(function mediaFacets(){
  "use strict";
  const OPTIONS={
    age:["10대","20대","30대","40대","50대","60대+"],
    gender:["여성","남성"],
    life:["임신·출산","신생아","영아·유아","유치원","초등","중고등","학부모","시니어"],
    interest:["육아·교육","뷰티","금융·재테크","여행·항공","헬스케어","리빙·인테리어","쇼핑","취미·운동","로컬","커리어","모빌리티"],
    format:["배너","검색","네이티브","동영상","오디오","푸시","뉴스레터","브랜디드","리드젠"]
  };
  const TITLES={age:"연령대",gender:"성별",life:"생애주기 · 자녀 연령",interest:"관심사 · 이용 맥락",format:"광고상품 유형"};
  const KEYWORDS={
    life:{
      "임신·출산":/임산부|임신|출산|산모|태교/,
      "신생아":/신생아|생후 ?[0-9]+개월|0세/,
      "영아·유아":/영유아|영아|유아|어린이집|미취학|유딩/,
      "유치원":/유치원|유치부|유치원생/,
      "초등":/초등|초딩|초등학생|초·중·고|초중고/,
      "중고등":/중학생|고등학생|중·고|중고등|초·중·고|초중고|수능|입시|수험생/,
      "학부모":/학부모|엄마|어머니|부모|자녀 교육|자녀교육/,
      "시니어":/시니어|실버세대|고령층|노년층/
    },
    interest:{
      "육아·교육":/육아|교육|학부모|어린이|학교|학습|수능|입시|키즈|자녀|유치원|수험생/,
      "뷰티":/뷰티|화장품|스킨케어|코스메틱|메이크업|피부/,
      "금융·재테크":/금융|핀테크|주식|투자|재테크|자산관리|경제|보험|은행/,
      "여행·항공":/여행|항공|숙박|호텔|관광|트래블|비행기/,
      "헬스케어":/헬스케어|건강|웰니스|혈당|당뇨|병원|의료/,
      "리빙·인테리어":/리빙|인테리어|가구|홈퍼니싱|주거|이사|집꾸미기/,
      "쇼핑":/커머스|쇼핑|구매|상품 탐색|선물|리셀/,
      "취미·운동":/스포츠|레저|피트니스|골프|운동|모임|취미|러닝/,
      "로컬":/동네|지역|생활권|로컬|근거리/,
      "커리어":/직장인|기업|B2B|채용|직무|창업|커리어|대학생/,
      "모빌리티":/교통|자동차|차량|운전|이동|택시|대중교통|지하철/
    },
    format:{
      "배너":/배너|디스플레이|display|GFA|NOSP/i,
      "검색":/검색광고|검색결과|키워드|search|브랜드검색/i,
      "네이티브":/네이티브|인피드|피드|native/i,
      "동영상":/영상|동영상|숏폼|비디오|릴스|YouTube|VOD/i,
      "오디오":/오디오|팟캐스트|라디오|음성/i,
      "푸시":/푸시|push|문자|알림톡/i,
      "뉴스레터":/뉴스레터|newsletter/i,
      "브랜디드":/브랜디드|콘텐츠 협업|제휴 콘텐츠|체험단/i,
      "리드젠":/리드젠|리드 수집|DB 수집|상담신청/i
    }
  };
  const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const empty=()=>Object.fromEntries(Object.keys(OPTIONS).map(k=>[k,[]]));
  let state=empty(), strict=false, landscape=false, redraw=()=>{}, getAll=()=>[], lastMatches=new Map();
  function norm(a,choices){return Array.isArray(a)?a.filter(v=>choices.includes(v)):[]}
  function derive(x,documentMode=false){
    const a=empty(), explicit=x.audience||{};
    const base=String((documentMode?x.documentText:(x.target||"")+" "+(x.summary||"")+" "+(x.subtitle||""))||"");
    const desc=base.slice(0,documentMode?90000:1500);
    const productText=String((x.products||[]).join(" "));
    if(/2030|20\s*[~\-∼]\s*30\s*대|20·30대|20대와 ?30대/.test(desc)){a.age.push("20대","30대")}
    if(/3040|30\s*[~\-∼]\s*40\s*대|30·40대/.test(desc)){a.age.push("30대","40대")}
    if(/4050|40\s*[~\-∼]\s*50\s*대|40·50대/.test(desc)){a.age.push("40대","50대")}
    for(const age of OPTIONS.age){
      const t=age==="60대+"?"60대|60세 이상|60대 이상":age;
      if(new RegExp(t).test(desc))a.age.push(age);
    }
    if(/여성|여자|엄마|어머니|주부/.test(desc))a.gender.push("여성");
    if(/남성|남자|아빠|아버지/.test(desc))a.gender.push("남성");
    for(const [key,rs] of Object.entries(KEYWORDS))
      for(const [label,re] of Object.entries(rs))
        if(re.test(key==="format"?productText:desc))a[key].push(label);
    const cats={
      "뷰티":"뷰티","금융·핀테크":"금융·재테크","여행·항공":"여행·항공",
      "교육":"육아·교육","헬스케어":"헬스케어","리빙·인테리어":"리빙·인테리어",
      "커머스·쇼핑":"쇼핑","패션":"쇼핑","스포츠·레저":"취미·운동",
      "로컬·커뮤니티":"로컬","B2B·직장인":"커리어","모빌리티":"모빌리티"
    };
    if(!documentMode&&cats[x.category])a.interest.push(cats[x.category]);
    for(const k of Object.keys(a)){
      a[k]=[...new Set(a[k])];
      if(norm(explicit[k],OPTIONS[k]).length)a[k]=norm(explicit[k],OPTIONS[k]);
    }
    return a;
  }
  function profile(x){return derive(x)}
  function matching(x){
    const p=profile(x);let count=0,unknown=[],found=[];
    for(const key of Object.keys(OPTIONS)){
      if(!state[key].length)continue;
      const chosen=state[key],tags=p[key];
      if(chosen.some(v=>tags.includes(v))){count++;found.push(TITLES[key]);continue}
      if(key==="format"||key==="interest")return {show:false};
      if(key==="life"){
        const broad=chosen.includes("학부모"), isChildSpecific=chosen.some(x=>["신생아","영아·유아","유치원","초등","중고등"].includes(x));
        if(isChildSpecific&&tags.some(v=>["신생아","영아·유아","유치원","초등","중고등"].includes(v)))return {show:false};
        if(!tags.length||(isChildSpecific&&tags.includes("학부모"))||(!broad&&tags.includes("학부모"))){unknown.push(TITLES[key]);continue}
        return {show:false};
      }
      if(!tags.length){unknown.push(TITLES[key]);continue}
      return {show:false};
    }
    if(unknown.length&&(strict||!count))return {show:false};
    return {show:true,unknown,found,reviewed:!!(x.audienceReviewed&&x.audience),profile:p};
  }
  const hasSelections=()=>Object.values(state).some(a=>a.length);
  function chipBlock(){
    return Object.keys(OPTIONS).map(k=>`<fieldset class="facet-group"><legend>${esc(TITLES[k])}</legend><div class="facet-options">${OPTIONS[k].map(v=>`<button type="button" class="facet-opt" data-facet="${k}" data-value="${esc(v)}" aria-pressed="false">${esc(v)}</button>`).join("")}</div></fieldset>`).join("");
  }
  function init(callback,all){
    redraw=callback;getAll=all;
    const style=document.createElement("style");
    style.textContent=`
    .audience-panel{margin-top:15px;background:#f7f9fd;border:1px solid #e1e8f2;border-radius:12px;padding:15px}
    .audience-top,.facet-toolbar{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}
    .audience-top b{font-size:13px;color:#213956}.audience-top small{color:#667c96;line-height:1.7}
    .audience-presets{display:flex;flex-wrap:wrap;gap:7px;margin:12px 0}
    .preset-btn{border:1px solid #cddcf1;background:#fff;color:#375780;font-size:11px;border-radius:999px;padding:8px 12px;font-weight:700}
    .preset-btn.selected{background:#e7f0ff;border-color:#477ed9;color:#1a55bb}
    .audience-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px}
    .facet-group{background:#fff;border:1px solid #e5ebf3;border-radius:10px;padding:12px;min-width:0;margin:0}
    .facet-group legend{font-size:12px;color:#263b55;font-weight:800;padding:0 4px}
    .facet-options{display:flex;flex-wrap:wrap;gap:7px}
    .facet-opt{font-size:11px;white-space:nowrap;border:1px solid #e4eaf4;border-radius:8px;background:#fff;padding:7px 10px;color:#65758c}
    .facet-opt[aria-pressed="true"]{border-color:#2764d6;color:#fff;background:#2764d6}
    .facet-note{font-size:11px;line-height:1.7;color:#6b7e98;margin:12px 0 0}
    .facet-toolbar label{font-size:11px;color:#596e87;display:flex;gap:7px;align-items:center}
    .facet-toolbar input{accent-color:#2563eb}
    .facet-clear{border:0;background:none;color:#2466c6;font-size:11px;font-weight:750;padding:8px}
    .audience-active{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0 0}
    .audience-active span{background:#e7f0ff;color:#2e60a8;border-radius:6px;padding:5px 8px;font-size:10px}
    .audience-result{display:flex;flex-wrap:wrap;align-items:center;gap:7px;margin-top:9px}
    .candidate-pill{background:#fff8e8;color:#986316;border:1px solid #f4dfb4;font-size:10px;border-radius:6px;padding:5px 7px}
    .confirmed-pill{background:#eaf8f4;color:#137b66;border:1px solid #cceee3;font-size:10px;border-radius:6px;padding:5px 7px}
    .landscape{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
    .landscape-group{background:#fff;border:1px solid #e1e8f2;border-radius:13px;padding:17px;min-height:130px}
    .landscape-group h4{margin:0 0 12px;color:#213b5d}.landscape-group h4 small{color:#7589a5;font-size:11px}
    .landscape-group button{display:inline-flex;margin:0 5px 7px 0;border:1px solid #e6ebf3;border-radius:999px;background:#f7f9fc;padding:7px 10px;color:#315c8a;font-size:11px}
    .landscape-group button:hover{background:#e8f1ff}
    .facet-form-group{border:1px solid #e0e8f2;border-radius:10px;padding:12px;margin:12px 0 5px}
    .facet-form-group h4{margin:0 0 6px;font-size:13px}.facet-form-group p{color:#7a8ca2;font-size:11px;line-height:1.65}
    .facet-form-line{margin:12px 0}.facet-form-line b{display:block;font-size:11px;margin-bottom:6px;color:#465a74}
    .facet-form-line .facet-check{display:inline-flex;align-items:center;gap:5px;padding:5px 10px 5px 0;font-size:11px}
    .facet-form-line input{accent-color:#2563eb}
    .facet-highlight{display:flex;gap:6px;flex-wrap:wrap;margin:7px 0}
    .facet-highlight span{font-size:10px;color:#426389;background:#edf4fc;padding:5px 8px;border-radius:7px}
    @media(max-width:1020px){.audience-grid,.landscape{grid-template-columns:1fr 1fr}}
    @media(max-width:620px){.audience-grid,.landscape{grid-template-columns:1fr}.facet-group{padding:10px}}
    `;
    document.head.appendChild(style);
    const bar=document.querySelector(".filterbar");
    if(!bar)return;
    const panel=document.createElement("section");panel.className="audience-panel";panel.id="audience-panel";
    panel.innerHTML=`<div class="audience-top"><div><b>🎯 타깃 조건으로 매체 찾기</b><br><small>연령 · 성별 · 자녀 생애주기 · 관심사 · 상품을 함께 선택하세요</small></div><button type="button" class="btn-outline" id="facet-toggle">상세 필터 접기</button></div>
    <div id="facet-body"><div class="audience-presets">${[
      ["mom3040","30·40대 엄마"],["elementary","초등 학부모"],["baby","신생아·영유아 부모"],
      ["beauty2030","2030 뷰티"],["senior","시니어"],["finance","직장인·재테크"]
    ].map(([id,t])=>`<button type="button" class="preset-btn" data-preset="${id}">${t}</button>`).join("")}</div>
    <div class="audience-grid">${chipBlock()}</div><div class="facet-toolbar" style="margin-top:10px"><label><input type="checkbox" id="facet-strict">자료에서 단서가 확인된 조건만 보기</label>
    <button type="button" id="facet-clear" class="facet-clear">타깃 필터 초기화</button></div><p class="facet-note">동일 항목은 OR, 서로 다른 항목은 AND 조건이에요. 기본 모드는 일부 정보가 미확인된 <b>연관 후보</b>도 보여줍니다. 매체의 관심 이용자 맥락과 광고 관리자에서 실제 지정 가능한 타깃 조건은 다릅니다.</p></div>
    <div id="facet-active" class="audience-active"></div>`;
    bar.appendChild(panel);
    const line=document.querySelector(".resultline");
    if(line){
      const controls=document.createElement("div");controls.className="audience-top";controls.style.margin="0 0 12px";
      controls.innerHTML=`<span id="audience-result-note" style="font-size:12px;color:#667b95"></span><button class="btn-outline" id="landscape-toggle" type="button">◫ 미디어 랜드스케이프 보기</button>`;
      line.insertAdjacentElement("afterend",controls);
    }
    const cards=document.querySelector("#cards");
    if(cards){const v=document.createElement("div");v.id="landscape";v.className="landscape";v.style.display="none";cards.insertAdjacentElement("afterend",v)}
    panel.addEventListener("click",e=>{
      const btn=e.target.closest("button");if(!btn)return;
      if(btn.id==="facet-toggle"){const b=document.querySelector("#facet-body");b.hidden=!b.hidden;btn.textContent=b.hidden?"상세 필터 펼치기":"상세 필터 접기";return}
      if(btn.id==="facet-clear"){reset();return}
      if(btn.dataset.facet){const key=btn.dataset.facet,v=btn.dataset.value;state[key]=state[key].includes(v)?state[key].filter(x=>x!==v):[...state[key],v];redraw();return}
      if(btn.dataset.preset){applyPreset(btn.dataset.preset);return}
    });
    panel.addEventListener("change",e=>{if(e.target.id==="facet-strict"){strict=e.target.checked;redraw()}});
    document.querySelector("#landscape-toggle")?.addEventListener("click",()=>{landscape=!landscape;redraw()});
    updateUI();
  }
  function applyPreset(id){
    state=empty();
    const data={
      mom3040:{age:["30대","40대"],gender:["여성"],life:["학부모"]},
      elementary:{life:["초등"]},
      baby:{life:["신생아","영아·유아","유치원","학부모"]},
      beauty2030:{age:["20대","30대"],interest:["뷰티"]},
      senior:{life:["시니어"]},
      finance:{interest:["금융·재테크","커리어"]}
    };
    if(data[id])Object.assign(state,data[id]);
    strict=false;document.querySelector("#facet-strict").checked=false;redraw();
  }
  function reset(doRedraw=true){
    state=empty();strict=false;
    const c=document.querySelector("#facet-strict");if(c)c.checked=false;
    if(doRedraw)redraw();else updateUI();
  }
  function check(x){return matching(x)}
  function badges(x){
    const p=profile(x);
    const vals=[...p.age,...p.gender,...p.life].slice(0,5);
    const match=hasSelections()?lastMatches.get(x.id)||matching(x):null;
    let badge=match?.unknown?.length?`<span class="candidate-pill" title="조건 중 일부 공개자료 미확인">추가 확인 필요: ${esc(match.unknown.join("·"))}</span>`:
      (hasSelections()?`<span class="confirmed-pill">등록 단서 일치 · 집행 가능 여부 별도 확인</span>`:"");
    if(!vals.length&&!badge)return "";
    return `<div class="audience-result">${vals.map(v=>`<span class="facet-highlight"><span>${esc(v)}</span></span>`).join("")}${badge}</div>`;
  }
  function detail(x){
    const p=profile(x),has=Object.values(p).some(v=>v.length);
    const body=Object.entries(TITLES).map(([k,t])=>p[k].length?`<div style="margin:8px 0"><b style="font-size:11px">${esc(t)}</b><div class="facet-highlight">${p[k].map(v=>`<span>${esc(v)}</span>`).join("")}</div></div>`:"").join("");
    return `<div class="detail-section"><h3>🎯 타깃 / 미디어 랜드스케이프 태그</h3>${has?body:"<p class='secondary-text'>태그가 부족합니다. 소개서에서 근거를 확인한 뒤 등록해 주세요.</p>"}<p class="facet-note">${x.audienceReviewed?"사용자가 소개서 검토 후 확정한 분류입니다. 실제 광고 타깃팅 기능은 별도 확인해야 합니다.":"등록 설명문과 업종 기준 자동 탐색 태그입니다. 인구통계 비중이나 광고 관리자 타깃팅 가능 여부가 검증된 값은 아닙니다."}</p></div>`;
  }
  function formFields(x){
    const p=x?.audience||empty();
    let out=`<div class="field wide"><div class="facet-form-group"><h4>🎯 상세 타깃 아카이빙</h4><p>소개서에서 확인된 내용만 확정 표시하세요. 입력하지 않은 인구통계는 임의로 가정하지 않습니다.</p>`;
    for(const [k,values] of Object.entries(OPTIONS))out+=`<div class="facet-form-line"><b>${esc(TITLES[k])}</b>${values.map(v=>`<label class="facet-check"><input type="checkbox" name="aud-${k}" value="${esc(v)}" ${norm(p[k],values).includes(v)?"checked":""}>${esc(v)}</label>`).join("")}</div>`;
    out+=`<label style="display:flex;align-items:center;gap:6px;font-size:12px"><input type="checkbox" name="aud-reviewed" ${x?.audienceReviewed?"checked":""}> 소개서에서 실제로 확인한 태그로 검수 완료</label></div></div>`;
    return out;
  }
  function fromForm(form){
    const audience=empty();
    for(const k of Object.keys(OPTIONS))audience[k]=[...form.querySelectorAll(`input[name="aud-${k}"]:checked`)].map(x=>x.value).filter(v=>OPTIONS[k].includes(v));
    return {audience,audienceReviewed:!!form.querySelector('input[name="aud-reviewed"]:checked')};
  }
  function suggest(form,body){
    if(!body||!body.trim())return;
    const p=derive({documentText:body},true);
    for(const [k,vals] of Object.entries(p)){
      for(const input of form.querySelectorAll(`input[name="aud-${k}"]`))input.checked=vals.includes(input.value);
    }
    const v=form.querySelector('input[name="aud-reviewed"]');if(v)v.checked=false;
    const el=form.querySelector("#analysis-panel");
    if(el)el.insertAdjacentHTML("beforeend",`<p><b>상세 타깃 자동 제안:</b> ${esc(Object.values(p).flat().join(", ")||"관련 단서가 발견되지 않았습니다.")} · <b>미검수</b> (설명서에 단어가 나온 사실이 광고 타깃팅 가능을 뜻하지는 않습니다.)</p>`);
  }
  function updateUI(){
    for(const b of document.querySelectorAll("button[data-facet]"))b.setAttribute("aria-pressed",String(state[b.dataset.facet]?.includes(b.dataset.value)));
    document.querySelectorAll(".preset-btn").forEach(b=>b.classList.remove("selected"));
    const active=document.querySelector("#facet-active");
    if(active)active.innerHTML=Object.entries(state).flatMap(([k,vs])=>vs.map(v=>`<span>${esc(TITLES[k])} · ${esc(v)}</span>`)).join("");
  }
  function afterRender(results){
    lastMatches=new Map(results.map(x=>[x.id,matching(x)]));updateUI();
    const info=document.querySelector("#audience-result-note");
    if(info){
      const candidates=results.filter(x=>matching(x).unknown?.length).length;
      info.textContent=hasSelections()?`선택한 타깃 조합 · ${results.length}개 결과${candidates?` (조건 일부 미확인 ${candidates}개 포함)`:""}`:"광고주 타깃 기준으로 필터링하거나 산업별 미디어 랜드스케이프를 확인하세요.";
    }
    const btn=document.querySelector("#landscape-toggle"),grid=document.querySelector("#landscape"),cards=document.querySelector("#cards");
    if(!grid||!cards)return;
    btn.textContent=landscape?"▦ 카드 목록으로 돌아가기":"◫ 미디어 랜드스케이프 보기";
    grid.style.display=landscape?"grid":"none";cards.style.display=landscape?"none":"grid";
    if(landscape){
      const by=new Map();
      for(const x of results){if(!by.has(x.category))by.set(x.category,[]);by.get(x.category).push(x)}
      grid.innerHTML=[...by.entries()].sort((a,b)=>b[1].length-a[1].length).map(([cat,items])=>`<div class="landscape-group"><h4>${esc(cat)} <small>${items.length}개</small></h4>${items.map(x=>`<button type="button" data-detail="${esc(x.id)}">${esc(x.name)}</button>`).join("")}</div>`).join("")||"<div class='empty'>현재 조건에 맞는 매체가 없습니다.</div>";
    }
  }
  window.MediaTargetFilters={init,check,badges,detail,formFields,fromForm,suggest,afterRender,reset,profile};
})();
