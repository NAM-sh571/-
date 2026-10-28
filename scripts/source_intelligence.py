#!/usr/bin/env python3
"""Conservative signal extractor for public advertising pages and media-kit PDFs.

Signals are leads for human review, NOT verified ad rates or contact details.
The module never downloads URLs; the caller supplies already fetched bytes.
"""
from __future__ import annotations

from html.parser import HTMLParser
from io import BytesIO
from urllib.parse import urljoin, urlsplit
import hashlib
import re

SKIP_TAGS = {'script', 'style', 'noscript', 'svg', 'template'}
MAX_TEXT = 100000
MAX_SIGNALS = 24
AD_CONTEXT = re.compile(r'광고|광고상품|소개서|매체소개서|미디어킷|media\s*kit|ad\s*product|advertis|sponsor|단가|집행', re.I)
PDF_CONTEXT = re.compile(r'광고|미디어킷|media\s*kit|advertis|ad.?kit|소개서|ad.?product|상품', re.I)
EMAIL_PATTERN = re.compile(r'(?<![\w.])([A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,})', re.I)
RATE_PATTERN = re.compile(
    r'\b(?:CPM|CPC|CPA|CPP|CPV|CPL)\s*[:=]?\s*[₩￦]?\s*\d[\d,.]*(?:\s*(?:원|만원|천원))?'
    r'|\b\d[\d,]*(?:\.\d+)?\s*(?:원/건|원/회|만원/일|만원/월|원\s*/\s*(?:클릭|노출))'
    r'|(?:최소\s*(?:집행|광고)|기본\s*광고|집행\s*금액)[^\n]{0,25}(?:\d[\d,.]*\s*(?:원|만원|천원))',
    re.I
)
PRODUCTS = {
    '배너': r'배너|디스플레이|banner|display\s*ad',
    '스플래시·팝업': r'스플래시|팝업|splash|pop.?up',
    '동영상': r'동영상|영상광고|video\s*ad',
    '네이티브': r'네이티브|인피드|native|in.feed',
    '검색': r'검색광고|키워드광고|search\s*ad',
    '앱푸시': r'앱\s*푸시|app\s*push|push\s*notification',
    '문자(LMS·MMS)': r'\bLMS\b|\bMMS\b|문자발송|문자\s*광고',
    '리워드': r'리워드|보상형|rewarded',
    '뉴스레터': r'뉴스레터|newsletter',
    '브랜디드': r'브랜디드|sponsored\s*content|브랜드\s*콘텐츠',
    '체험단': r'체험단|서포터즈',
    '옥외·DOOH': r'옥외광고|\bDOOH\b|사이니지',
    '리드젠': r'리드젠|리드\s*수집|lead\s*generation',
}
VERSION_PATTERN = re.compile(
    r'(?:20(?:2[4-9]|3\d)[.\-\s]*[01]?\d(?:[.\-\s]*[0-3]?\d)?|'
    r'20(?:2[4-9]|3\d)\s*(?:[1-4]\s*[Qq]|[1-4]\s*분기|Q[1-4])|'
    r'(?:[1-4]\s*[Qq]|Q[1-4])\s*20(?:2[4-9]|3\d))'
)


def clean_value(value, limit=180):
    value = re.sub(r'\s+', ' ', str(value or '')).strip()
    return value[:limit]


def limited_unique(items, n=MAX_SIGNALS):
    result = []
    for item in items:
        if item and item not in result:
            result.append(item)
        if len(result) >= n:
            break
    return result


class TextAndLinks(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.skip = 0
        self.parts = []
        self.pdf_links = []
        self.context = ''
    def handle_starttag(self, tag, attrs):
        if tag in SKIP_TAGS:
            self.skip += 1
        if tag in ('p', 'div', 'li', 'section', 'tr', 'h1', 'h2', 'h3', 'td', 'br'):
            self.parts.append('\n')
        if tag == 'a':
            dic = dict(attrs)
            self.context = dic.get('title', '') or dic.get('aria-label', '') or ''
            href = dic.get('href', '')
            if '.pdf' in href.lower():
                self.pdf_links.append((href, self.context))
    def handle_endtag(self, tag):
        if tag in SKIP_TAGS and self.skip:
            self.skip -= 1
        if tag in ('p', 'div', 'li', 'section', 'tr', 'h1', 'h2', 'h3', 'td'):
            self.parts.append('\n')
    def handle_data(self, data):
        if not self.skip:
            self.parts.append(data)


def decode_html(data, content_type):
    enc = re.search(r'charset\s*=\s*["\']?([\w\-]+)', content_type or '', re.I)
    for charset in [enc.group(1) if enc else None, 'utf-8', 'cp949']:
        if charset:
            try:
                return data.decode(charset)
            except (UnicodeDecodeError, LookupError):
                pass
    return data.decode('utf-8', errors='replace')


def extract_pdf_text(data):
    try:
        from pypdf import PdfReader
    except ImportError:
        return '', 'pdf_parser_unavailable'
    if not data.startswith(b'%PDF') or b'%%EOF' not in data[-2048:]:
        return '', 'pdf_incomplete_or_invalid'
    try:
        reader = PdfReader(BytesIO(data), strict=False)
        texts = []
        for page in list(reader.pages)[:30]:
            if sum(len(x) for x in texts) > MAX_TEXT:
                break
            texts.append(page.extract_text() or '')
        return '\n'.join(texts)[:MAX_TEXT], 'pdf_text'
    except (ValueError, TypeError, OSError, RuntimeError, KeyError, Exception) as exc:
        return '', 'pdf_parse_failed_' + type(exc).__name__


def safe_link(url):
    try:
        u = urlsplit(url)
        return u.scheme == 'https' and u.hostname and not u.username and not u.password
    except (ValueError, TypeError):
        return False


def extract_source(payload, content_type='', source_url='', truncated=False):
    """Produce a bounded observation; text-derived facts remain unverified."""
    ctype = (content_type or '').lower()
    is_pdf = 'pdf' in ctype or (payload or b'').startswith(b'%PDF')
    links = []
    if is_pdf:
        text, extraction = extract_pdf_text(payload) if not truncated else ('', 'pdf_truncated')
        kind = 'pdf'
    elif 'html' in ctype or b'<html' in (payload or b'')[:2000].lower():
        parser = TextAndLinks()
        parser.feed(decode_html(payload, ctype)[:MAX_TEXT * 4])
        text = '\n'.join(line.strip() for line in ''.join(parser.parts).splitlines() if line.strip())[:MAX_TEXT]
        for href, label in parser.pdf_links:
            link = urljoin(source_url, href)
            if safe_link(link) and PDF_CONTEXT.search(href + ' ' + label):
                links.append(link[:1200])
        extraction, kind = 'html_text', 'html'
    else:
        text, extraction, kind = '', 'unsupported_content', 'other'
    source = text[:MAX_TEXT]
    product_candidates = [label for label, regex in PRODUCTS.items() if re.search(regex, source, re.I)]
    rates = []
    # Rates are only meaningful when paired with advertising context nearby.
    for found in RATE_PATTERN.finditer(source):
        context = source[max(0, found.start()-100):min(len(source),found.end()+100)]
        if AD_CONTEXT.search(context):
            rates.append(clean_value(found.group(0), 80))
    emails = []
    for found in EMAIL_PATTERN.finditer(source):
        v = found.group(1).rstrip('.')
        nearby = source[max(0,found.start()-105):min(len(source),found.end()+70)]
        local = v.split('@')[0].lower()
        if AD_CONTEXT.search(nearby) or re.search(r'^(?:ads?|ad[_-]?sales|advertis|media|biz|partners?|sales|marketing)', local):
            emails.append(v.lower())
    versions = []
    for found in VERSION_PATTERN.finditer(source):
        context = source[max(0,found.start()-85):min(len(source),found.end()+85)]
        if PDF_CONTEXT.search(context):
            versions.append(clean_value(found.group(0), 65))
    observations = {
        'kind':kind,'extraction':extraction,'complete':not truncated,
        'products':limited_unique(product_candidates),
        'rates':limited_unique(rates,12),
        'contacts':limited_unique(emails,12),
        'document_versions':limited_unique(versions,12),
        'pdf_links':limited_unique(links,12)
    }
    normalized = repr([observations[k] for k in ('products','rates','contacts','document_versions','pdf_links')])
    observations['signal_fingerprint'] = hashlib.sha256(normalized.encode('utf-8')).hexdigest()[:20]
    observations['has_signals'] = any(observations[k] for k in ('products','rates','contacts','document_versions','pdf_links'))
    return observations


def compare_snapshots(previous, current):
    """Compare *observed* values only; never infer that removed text means obsolete pricing."""
    if not isinstance(previous, dict) or not previous.get('has_signals') or not current.get('has_signals'):
        return []
    changes = []
    for key in ('products','rates','contacts','document_versions','pdf_links'):
        old = set(previous.get(key) or [])
        new = set(current.get(key) or [])
        added = sorted(new - old)[:10]
        removed = sorted(old - new)[:10]
        if added or removed:
            changes.append({'field':key,'added':added,'no_longer_detected':removed,
                            'review_status':'pending', 'verification':'unverified_extraction'})
    return changes


def candidate_id(media_id, field, added, removed):
    raw = repr((media_id,field,sorted(added),sorted(removed)))
    return 'review-' + hashlib.sha256(raw.encode('utf8')).hexdigest()[:20]
