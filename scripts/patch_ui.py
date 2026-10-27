from pathlib import Path
p=Path(__file__).resolve().parent.parent/'index.html'
s=p.read_text(encoding='utf8')
s=s.replace('<div class="sb-foot">© 2026 MEDIA FINDER · Prototype</div>', '<div class="sb-foot">© 2026 MEDIA FINDER · Auto Monitor</div>')
s=s.replace('<button class="nav-item" id="sidebar-import"><svg><use href="#i-upload"/></svg><span>데이터 백업·가져오기</span></button>', '<button class="nav-item" id="sidebar-import"><svg><use href="#i-upload"/></svg><span>데이터 백업·가져오기</span></button>\n <button class="nav-item" id="sidebar-sync"><svg><use href="#i-clock"/></svg><span>자동 업데이트 현황</span><em class="num" id="sync-alert-count">0</em></button>')
needle=' <section class="stats">'
assert needle in s
s=s.replace(needle,''' <section id="sync-panel" aria-live="polite" style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;background:#eef5ff;border:1px solid #d5e6ff;border-radius:14px;padding:16px 18px;margin:0 0 22px">
   <div style="display:flex;align-items:center;gap:13px"><span style="font-size:23px">🔄</span><div><b id="sync-main" style="display:block;font-size:14px">자동 업데이트 연동 대기</b><span id="sync-sub" style="color:#526681;font-size:12px">GitHub Pages에 게시하면 공개 매체소개서 링크를 매일 확인해요.</span></div></div>
   <button class="btn-outline" id="sync-show">업데이트 내역 및 신규 후보 보기 →</button>
 </section>
'''+needle)
s=s.replace('const all=()=>[...initial,...custom];','''const all=()=>[...initial,...custom];
let syncData=null, syncError=null;
function localTime(stamp){if(!stamp)return '아직 실행되지 않음';try{return new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',dateStyle:'medium',timeStyle:'short'}).format(new Date(stamp))}catch{return String(stamp)}}
function paintSyncStatus(){
 const main=$('#sync-main'),sub=$('#sync-sub');if(!main||!sub)return;
 if(!syncData){main.textContent='자동 업데이트 연동 대기';sub.textContent=syncError||'사이트를 GitHub Pages로 배포하면 매일 자동 조회 데이터가 연결됩니다.';return}
 const d=syncData,s=d.summary||{};
 if(d.mode==='not_started'){main.textContent='첫 자동 점검 실행 전';sub.textContent='GitHub Pages 연결 및 Actions 실행 후 점검 결과가 표시됩니다.'}
 else{main.textContent=`최근 자동 점검: ${localTime(d.generated_at)}`;sub.textContent=`링크 확인 ${s.checked||0}개 · 변경 검토 ${s.changed_review||0}개 · 신규 검색 후보 ${s.pending_candidates||0}개 · 검색 실패 ${s.search_queries_failed||0}건`}
 const alerts=(s.changed_review||0)+(s.pending_candidates||0);let a=$('#sync-alert-count');if(a)a.textContent=alerts;
}
async function refreshSync(){
 if(location.protocol==='file:'){syncError='파일 직접 실행에서는 자동 데이터 동기화가 제한됩니다. GitHub Pages 또는 로컬 웹서버로 열어주세요.';paintSyncStatus();return}
 try{const r=await fetch('./data/scan.json?v='+Date.now(),{cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);let d=await r.json();if(d.schema_version!==1)throw Error('알 수 없는 데이터 형식');syncData=d;syncError=null;paintSyncStatus()}
 catch(e){syncError='점검 데이터 연결 실패 ('+e.message+'). 사이트는 기존 등록 목록으로 동작합니다.';paintSyncStatus()}
}
function showSync(){let d=syncData||{}, stats=d.summary||{},monitors=d.monitors||[],candidates=(d.candidates||[]).filter(x=>x.review_status==='pending');let today=d.generated_at?localTime(d.generated_at):'기록 없음';
const flagged=monitors.filter(x=>x.status!=='ok').sort((a,b)=>Number(b.status==='changed_review')-Number(a.status==='changed_review'));
const flagMarkup=flagged.length?flagged.map(x=>`<div class="detailbox" style="margin-bottom:8px;display:block"><div style="display:flex;gap:10px;justify-content:space-between;align-items:center;flex-wrap:wrap"><b>${esc(x.name)}</b><span style="font-size:11px;color:${x.status==='changed_review'?'#a66500':'#65758b'}">${esc(({changed_review:'내용 변경 감지',restricted:'자동 접근 제한',error:'접속 확인 실패',unavailable:'링크 없음',not_checked:'미점검'})[x.status]||x.status)}</span></div><small>${esc(x.message||'')} · ${esc(x.http_status||'-')}</small>${safeUrl(x.source_url)?`<div style="margin-top:5px">${hrefButton(x.source_url,'원본 확인')}</div>`:''}</div>`).join(''):'<p style="color:#63758d">확인된 변경 또는 오류가 없어요.</p>';
const candMarkup=candidates.length?candidates.slice(0,80).map(x=>`<div class="detailbox" style="display:block;margin-bottom:8px"><b>${esc(x.name)}</b><small>${esc(x.category||'기타')} · ${esc(x.source_engine||'검색')} · 최초 발견 ${esc((x.first_seen||'').slice(0,10))}</small><div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px">${hrefButton(x.url,'원본 열기')} <button class="btn-outline" data-promote="${esc(x.id)}" style="font-size:12px">확인 후 내 목록 등록</button></div></div>`).join(''):'<p style="color:#63758d">신규 검색 후보가 없어요. 검색 공급자 연결·접근 상태를 확인하세요.</p>';
const fail=(d.search_status||[]).filter(x=>x.status!=='ok').length;
$('#portal').innerHTML=`<div class="overlay" data-overlay="1"><div class="drawer" role="dialog" aria-modal="true" aria-label="자동 업데이트 현황"><div class="dhead"><h2>🔄 매체 자동 최신화</h2><button class="close" data-close="1">${ico('close')}</button></div><div class="dbody" style="overflow:auto;max-height:calc(100vh - 100px)"><p class="detail-desc">마지막 점검: <b>${esc(today)}</b></p><div class="note">검색 후보는 미검증 정보입니다. 변경 감지는 웹페이지 또는 PDF 응답 차이로, 상품 개정이 확정된 것은 아닙니다. 기존 사용자가 추가한 매체와 소개서는 덮어쓰지 않습니다.</div><div class="detail-section"><h3>자동 검사 현황</h3><p>접속 확인 ${stats.ok||0}건 · 변경 검토 ${stats.changed_review||0}건 · 접근 제한 ${stats.restricted||0}건 · 실패 ${stats.failed||0}건</p>${flagMarkup}</div><div class="detail-section"><h3>신규 검색 후보 ${candidates.length}개</h3><p style="color:#6a7c94">링크를 확인한 뒤 등록하면 브라우저 개인 목록에 저장됩니다. 모든 후보는 검토가 필요해요.</p>${candMarkup}</div><div class="detail-section"><h3>검색 공급자 상태</h3><p>검색 성공 ${(d.search_status||[]).length-fail}건 · 실패 ${fail}건. 공개 RSS 접속이 차단될 수 있어 네이버·구글 API 키 연동을 지원합니다.</p></div><button class="primary" id="sync-refresh">최신 데이터 다시 불러오기</button></div></div></div>`;
}
function promote(id){const d=(syncData?.candidates||[]).find(x=>x.id===id);if(!d)return;
 if(!confirm('검색으로 발견한 미검증 후보입니다. 원본을 검토했으며 개인 목록에 추가하시겠습니까?'))return;
 let name=prompt('매체명을 확인해 주세요',d.name);if(!name?.trim())return;
 let url=safeUrl(d.url);if(!url)return;
 if(all().some(x=>x.deckUrl===url||x.name.toLowerCase()===name.trim().toLowerCase())){toast('이미 목록에 등록되어 있어요.');return}
 custom.push({id:'custom-'+Date.now(),custom:true,name:name.trim().slice(0,100),short:name.trim().slice(0,1),category:CATS.includes(d.category)?d.category:'뉴스·콘텐츠',summary:'검색에서 발견한 후보 · 사용자 검토 필요',products:d.products||[],target:'확인 필요',deckType:'thirdparty',deckUrl:url,deckLabel:'검색 후보 링크 · 공식 최신 자료 재확인 필요',contactType:'none',contact:'',contactUrl:'',source:'검색 후보: '+d.source_engine,verified:'',note:'사용자가 검토 후 개인 목록에 추가함. 실제 광고소개서인지 재확인 필요.',bg:'#f0f5ff',fg:'#2b59a5'});
 persist();close();render();toast('검토 후보가 내 매체 목록에 저장됐습니다.');
}
''')
s=s.replace("if(t.id==='analyze-media'){analyzeMedia();return}","if(t.id==='analyze-media'){analyzeMedia();return}\n if(t.id==='sidebar-sync'||t.id==='sync-show'){showSync();return}\n if(t.id==='sync-refresh'){await refreshSync();showSync();toast('저장소에 공개된 최신 점검 데이터를 읽었습니다.');return}\n if(t.dataset.promote){promote(t.dataset.promote);return}")
s=s.replace('render();\n})();\n</script>', 'render();\nrefreshSync();\nsetInterval(refreshSync,30*60*1000);\n})();\n</script>')
p.write_text(s,encoding='utf8')
print('patched HTML',p.stat().st_size)
