#!/usr/bin/env python3
"""Daily public-source monitoring for Media Finder.

Only public advertised links are checked. Discovery results are unverified candidates,
never silently promoted to official rates, contacts, or media-kit facts.
No third-party Python dependencies are required.
"""
from __future__ import annotations
import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
import hashlib
import ipaddress
import json
import os
from pathlib import Path
import re
import socket
from urllib.parse import urlencode, urlsplit, urlunsplit, parse_qsl
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
from xml.etree import ElementTree

from source_intelligence import extract_source, compare_snapshots

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / 'data'
AGENT = 'Mozilla/5.0 (compatible; MediaFinderSourceMonitor/1.0; public-document-monitor)'
TIMEOUT = 9
MAX_BYTES = 5000000
ALLOWED_MEDIA_DOMAINS = set()  # only known URLs scanned, not arbitrary submitted URLs
SEARCH_QUERIES = [
    '광고상품소개서 버티컬 매체 2026',
    '매체소개서 PDF 광고 2026 여행 금융 뷰티',
    'site:ads.naver.com 광고상품소개서',
    '광고 상품 소개서 미디어킷 2026',
]
SKIP_HOSTS = ('bing.com', 'google.com', 'search.naver.com', 'news.google.com')
BAD_EXT = ('.exe', '.dmg', '.apk', '.msi', '.zip')


def dump(path, obj):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, ensure_ascii=False, indent=2) + '\n', encoding='utf8')


def read(path, default):
    try:
        return json.loads(path.read_text(encoding='utf8'))
    except (FileNotFoundError, ValueError):
        return default


def cleaned_url(url):
    try:
        u = urlsplit(str(url).strip())
        if u.scheme != 'https' or not u.hostname or u.username or u.password:
            return ''
        host = u.hostname.lower().rstrip('.')
        if host == 'localhost' or host.endswith(('.local','.internal')):
            return ''
        try:
            addr = ipaddress.ip_address(host)
            if not addr.is_global:
                return ''
        except ValueError:
            pass
        if u.port not in (None, 443):
            return ''
        # strip search/analytics tracking params, not other semantically important params
        qp = [(k,v) for k,v in parse_qsl(u.query,keep_blank_values=True) if not (k.startswith('utm_') or k in ('fbclid','gclid'))]
        return urlunsplit((u.scheme, u.netloc.lower(), u.path or '/', urlencode(qp), ''))
    except (ValueError, TypeError):
        return ''


def network_fetch(url, extra_headers=None):
    headers = {'User-Agent': AGENT, 'Accept': 'application/pdf,text/html,application/xml,application/rss+xml,*/*;q=0.5'}
    headers.update(extra_headers or {})
    req = Request(url, headers=headers)
    with urlopen(req, timeout=TIMEOUT) as resp:
        end = cleaned_url(resp.url)
        if not end:
            raise ValueError('untrusted redirect URL')
        body = resp.read(MAX_BYTES+1)
        return int(resp.status), resp.headers, body[:MAX_BYTES], len(body)>MAX_BYTES, end


def monitor(entry, previous, now, fetch=network_fetch):
    """Check a known URL; submit observations for review, never update catalog facts."""
    url = cleaned_url(entry.get('deckUrl'))
    name, id_ = entry.get('name',''), entry.get('id','')
    obj = {'id':id_, 'name':name, 'source_url':url, 'checked_at':now,
           'status':'not_checked','http_status':None,'changed':False,
           'changed_at': previous.get('changed_at'), 'first_checked_at':previous.get('first_checked_at') or now,
           'last_success_at':previous.get('last_success_at'), 'fingerprint':previous.get('fingerprint'),
           'snapshot':previous.get('snapshot') if isinstance(previous.get('snapshot'),dict) else None,
           'change_candidates':[], 'raw_changed':False,
           'message':'', 'deck_type':entry.get('deckType','none')}
    if not url:
        obj['status']='unavailable';obj['message']='등록된 HTTPS 소개서 링크 없음'
        return obj
    try:
        code, headers, content, truncated, final_url = fetch(url)
        obj['http_status']=code
        obj['final_url']=final_url
        obj['content_type']=(headers.get('Content-Type','').split(';')[0] or '').lower()
        obj['content_length_header']=headers.get('Content-Length','')
        fp=hashlib.sha256(content).hexdigest() if content else ''
        previous_fp=previous.get('fingerprint')
        obj['raw_changed']=bool(fp and previous_fp and fp!=previous_fp)
        if fp:obj['fingerprint']=fp
        observation=extract_source(content,headers.get('Content-Type',''),final_url,truncated)
        obj['snapshot']=observation
        old_snapshot=previous.get('snapshot')
        if old_snapshot and obj['raw_changed']:
            obj['change_candidates']=compare_snapshots(old_snapshot,observation)
        old_url=cleaned_url(previous.get('source_url'))
        if old_url and old_url!=url:
            obj['change_candidates'].append({'field':'source_url','added':[url],
                                              'no_longer_detected':[old_url],
                                              'review_status':'pending',
                                              'verification':'unverified_source_url_change'})
        pdf_change=bool(old_snapshot) and obj['raw_changed'] and observation.get('kind')=='pdf' and observation.get('complete')
        # PDF changed with no readable/changed signals: needs a document-level human review.
        if pdf_change and not obj['change_candidates']:
            obj['change_candidates'].append({'field':'pdf_content',
                  'added':['PDF 파일 응답 변경 - 최신본 여부 검토'],
                  'no_longer_detected':[],'review_status':'pending',
                  'verification':'unverified_binary_change'})
        if obj['change_candidates']:
            obj['status']='changed_review'
            obj['changed']=True
            obj['changed_at']=now
            obj['message']='광고자료 변경 후보 검출 · 기존 정보는 수정하지 않음'
        else:
            obj['status']='ok'
            obj['message']='소개서 링크 점검 완료 · 자동 검수 전'
            if obj['raw_changed']:
                obj['message']='페이지 원문 변경 · 가격/상품/연락처 변경 단서 미확인 (자동 확정 안 함)'
        if not old_snapshot:
            obj['message']+=' · 콘텐츠 단서 기준점 수집'
        if truncated:
            obj['message']+=' · 용량 제한으로 파일 앞부분만 확인'
        obj['last_success_at']=now
    except HTTPError as e:
        obj['http_status']=e.code
        obj['status']='restricted' if e.code in (401,403,429) else 'error'
        obj['message']=f'HTTP {e.code}: 자동 접근 제한 또는 오류 (사람이 재확인)'
    except (URLError,TimeoutError,OSError,ValueError) as e:
        obj['status']='error'
        obj['message']=f'링크 확인 실패: {type(e).__name__}'
    return obj


def infer_category(text):
    s=text.lower()
    matches=[('여행·항공',['여행','항공','호텔','숙박','트립','travel','flight']),
    ('금융·핀테크',['금융','주식','투자','fintech','은행','증권']),
    ('뷰티',['뷰티','화장품','beauty']),
    ('교육',['교육','학생','대학','입시','education']),
    ('커머스·쇼핑',['쇼핑','커머스','shopping','commerce']),
    ('부동산',['부동산','분양','아파트','real estate']),
    ('헬스케어',['헬스','건강','health','병원']),
    ('모빌리티',['지도','내비','교통','모빌리티','mobility']),
    ('패션',['패션','의류','fashion']),
    ('뉴스·콘텐츠',['뉴스','news','매거진','newsletter','미디어'])]
    for k,words in matches:
        if any(t in s for t in words):return k
    return '기타'


def infer_products(text):
    s=text.lower(); out=[]
    for label,terms in [('배너',['배너','banner','display']),('검색광고',['검색광고','search ad']),
                        ('동영상',['동영상','video']),('네이티브',['네이티브','native']),
                        ('뉴스레터',['뉴스레터','newsletter']),('푸시',['푸시','push']),
                        ('스폰서드',['스폰서드','sponsored'])]:
        if any(t in s for t in terms): out.append(label)
    return out


def candidate_from(title, url, source, now, prior=None):
    url=cleaned_url(url)
    if not url or len(url)>1100 or url.lower().endswith(BAD_EXT): return None
    hostname=urlsplit(url).hostname or ''
    if hostname in SKIP_HOSTS or any(hostname.endswith('.'+p) for p in SKIP_HOSTS):return None
    title=re.sub(r'\s+', ' ', re.sub(r'<[^>]+>',' ',title or '')).strip()[:180]
    if not title:return None
    if not (any(w in (title+' '+url).lower() for w in ['광고','미디어킷','media kit','advertis','sponsor','rate card','매체소개서','media_kit','pr_kit'])):
        return None
    previous=prior or {}
    return {'id':'discovery-'+hashlib.sha256(url.encode()).hexdigest()[:14],
            'name':title[:90], 'title':title,'url':url,'host':hostname,'category':infer_category(title),
            'products':infer_products(title), 'source_engine':source,'official_verified':False,
            'review_status':previous.get('review_status','pending'),
            'first_seen':previous.get('first_seen',now), 'last_seen':now}


def engine_search(now, previous, fetch=network_fetch):
    found={x['url']:x for x in previous if x.get('url')}
    stats=[]
    # Public RSS is a best-effort provider; credentials optional for official search APIs.
    search_limit=int(os.getenv('MEDIA_FINDER_QUERY_LIMIT','4'))
    for query in SEARCH_QUERIES[:max(0,min(search_limit,len(SEARCH_QUERIES)))]:
        q=urlencode({'q':query, 'format':'rss'})
        url='https://www.bing.com/search?'+q
        try:
            _,_,body,_,_=fetch(url)
            root=ElementTree.fromstring(body)
            count=0
            for node in root.findall('./channel/item'):
                title=node.findtext('title') or ''
                link=node.findtext('link') or ''
                item=candidate_from(title,link,'Bing RSS',now,found.get(cleaned_url(link)))
                if item:
                    found[item['url']]=item;count+=1
            stats.append({'query':query,'provider':'Bing RSS','status':'ok','matching_results':count})
        except (ValueError,ElementTree.ParseError,URLError,HTTPError,TimeoutError,OSError) as e:
            stats.append({'query':query,'provider':'Bing RSS','status':'failed','message':type(e).__name__})
    # Naver official Search OpenAPI requires user-provided secrets. No tokens in repository.
    nid=os.getenv('NAVER_CLIENT_ID','');nsecret=os.getenv('NAVER_CLIENT_SECRET','')
    if nid and nsecret:
        for query in SEARCH_QUERIES[:search_limit]:
            try:
                uri='https://openapi.naver.com/v1/search/webkr.json?'+urlencode({'query':query,'display':20})
                _,_,body,_,_=fetch(uri,{'X-Naver-Client-Id':nid,'X-Naver-Client-Secret':nsecret})
                result=json.loads(body)
                count=0
                for x in result.get('items',[]):
                    link=x.get('link','');item=candidate_from(x.get('title',''),link,'Naver OpenAPI',now,found.get(cleaned_url(link)))
                    if item:found[item['url']]=item;count+=1
                stats.append({'query':query,'provider':'Naver OpenAPI','status':'ok','matching_results':count})
            except (ValueError,URLError,HTTPError,TimeoutError,OSError) as e:
                stats.append({'query':query,'provider':'Naver OpenAPI','status':'failed','message':type(e).__name__})
    # Google Programmable Search Engine optional API. Only used if keys provided.
    gkey=os.getenv('GOOGLE_CSE_API_KEY','');gcx=os.getenv('GOOGLE_CSE_ID','')
    if gkey and gcx:
        for query in SEARCH_QUERIES[:search_limit]:
            try:
                uri='https://www.googleapis.com/customsearch/v1?'+urlencode({'key':gkey,'cx':gcx,'q':query,'num':10})
                _,_,body,_,_=fetch(uri)
                result=json.loads(body);count=0
                for x in result.get('items',[]):
                    link=x.get('link',''); item=candidate_from(x.get('title',''),link,'Google PSE API',now,found.get(cleaned_url(link)))
                    if item:found[item['url']]=item;count+=1
                stats.append({'query':query,'provider':'Google PSE API','status':'ok','matching_results':count})
            except (ValueError,URLError,HTTPError,TimeoutError,OSError) as e:
                stats.append({'query':query,'provider':'Google PSE API','status':'failed','message':type(e).__name__})
    return list(found.values())[:300],stats


def run(offline=False):
    now=datetime.now(timezone.utc).isoformat(timespec='seconds')
    seeds=read(DATA/'catalog_seed.json',[])
    previous=read(DATA/'scan.json',{})
    old_review=read(DATA/'review_queue.json',{})
    decisions=read(DATA/'review_decisions.json',{'decisions':[]})
    old_states={x['id']:x for x in previous.get('monitors',[]) if x.get('id')}
    if not seeds:raise RuntimeError('Seed catalog is empty')
    if offline:
        # Explicit dry-run: do not make up successful checks or overwrite last real scan.
        states=[{'id':x['id'],'name':x['name'],'status':'not_checked','message':'오프라인 시연; 접속 확인하지 않음'} for x in seeds]
        results=[];stats=[]
    else:
        states=[]
        with ThreadPoolExecutor(max_workers=6) as pool:
            futs={pool.submit(monitor,x,old_states.get(x['id'],{}),now):x['id'] for x in seeds}
            for f in as_completed(futs):states.append(f.result())
        states.sort(key=lambda x:next((i for i,y in enumerate(seeds) if y['id']==x['id']),999))
        results,stats=engine_search(now,previous.get('candidates',[]))
    known_urls={cleaned_url(x.get('deckUrl')) for x in seeds}|{cleaned_url(x.get('website')) for x in seeds}|{cleaned_url(x.get('contactUrl')) for x in seeds}
    results=[x for x in results if x['url'] not in known_urls]
    summary={'checked':sum(x['status'] not in ('not_checked','unavailable') for x in states),
             'ok':sum(x['status']=='ok' for x in states),
             'changed_review':sum(x['status']=='changed_review' for x in states),
             'restricted':sum(x['status']=='restricted' for x in states),
             'failed':sum(x['status']=='error' for x in states),
             'pending_candidates':sum(x['review_status']=='pending' for x in results),
             'search_queries_ok':sum(x['status']=='ok' for x in stats),
             'search_queries_failed':sum(x['status']=='failed' for x in stats)}
    report={'schema_version':1,'generated_at':now,'mode':'offline_example' if offline else 'scheduled_monitor',
            'disclaimer':'검색 후보는 미검증. 변경 감지는 문서 개정 확증이 아님.',
            'summary':summary,'monitors':states,'candidates':results,'search_status':stats}
    if not offline:
        from review_queue import build_review_queue
        review_report=build_review_queue(states,old_review,decisions,now)
        dump(DATA/'review_queue.json',review_report)
        report['review_summary']=review_report['summary']
    if offline:
        dump(DATA/'scan_demo.json',report)
        print('Wrote scan_demo.json; this is explicitly NOT a real monitoring result.')
    else:
        dump(DATA/'scan.json',report)
        print('Updated scan.json:',summary,'review queue:',report.get('review_summary'))
    return report


if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--offline-demo',action='store_true',help='write clearly labeled unverified demo state; no network')
    args=parser.parse_args()
    run(offline=args.offline_demo)
