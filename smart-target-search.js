(function mediaSmartSearch(){
  "use strict";
  const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const uniq=a=>[...new Set(a)];
  const patterns={
    age:[
      ["10대",/10대|10\s*~\s*19\s*세/],["20대",/20대|20\s*~\s*29\s*세/],
      ["30대",/30대|30\s*~\s*39\s*세/],["40대",/40대|40\s*~\s*49\s*세/],
      ["50대",/50대|50\s*~\s*59\s*세/],["60대+",/60대|60세\s*이상|시니어|노년층/]
    ],
    gender:[["여성",/여성|여자|엄마|어머니|맘\b|주부|산모|워킹맘|육아맘/],["남성",/남성|남자|아빠|아버지|대디/]],
    life:[
      ["임신·출산",/임신|출산|임산부|예비맘|예비\s*엄마|산모|태교/],
      ["신생아",/신생아|갓난아기|생후\s*(?:[0-9]|10|11)\s*개월/],
      ["영유아",/영유아|영아|유아|어린이집|미취학|아기|베이비/],
      ["유치원",/유치원|유치부|유치원생|유치원\s*아이|5\s*~\s*7\s*세/],
      ["초등",/초등|초딩|초등생|초등학교|초등학생/],
      ["중·고등",/중학생|고등학생|중고등|중학교|고등학교|수험생|수능/],
      ["학부모",/학부모|엄마|어머니|아빠|아버지|자녀\s*둔|자녀가\s*있는|워킹맘|육아맘/],
      ["시니어",/시니어|실버|노년층|노인|고령자/],
      ["반려동물 보호자",/반려동물|반려견|반려묘|강아지|고양이|펫맘|견주|묘주/]
    ],
    interest:[
      ["육아·키즈",/육아|엄마|어머니|맘|학부모|유치원|어린이집|자녀|초등|영유아|키즈|출산|임신|베이비/],
      ["학습·수험",/교육|학습|학교|공부|학원|입시|수험|수능|초등|중고등|유치원/],
      ["재테크·투자",/재테크|투자|주식|펀드|증권|ETF|자산관리|부동산\s*투자/],
      ["금융상품",/은행|금융상품|보험|대출|신용카드|체크카드|카드\s*혜택/],
      ["다이어트·피트니스",/다이어트|헬스장|피트니스|운동|필라테스|요가|체중|러닝|달리기/],
      ["스킨케어·메이크업",/화장품|뷰티|스킨케어|메이크업|피부관리|화장/],
      ["패션",/패션|의류|옷|코디|신발|스니커즈|스타일링/],
      ["해외여행",/해외여행|해외\s*여행|항공권|해외항공|국제선|출국|해외\s*휴가/],
      ["국내여행",/국내여행|국내\s*여행|숙박|캠핑|여행|국내선|호텔|호캉스/],
      ["게임",/게임|게이머|게이밍|롤\b|리그오브레전드|발로란트|e스포츠|PC방/],
      ["신차·중고차",/자동차|중고차|신차|차량|운전|내비|차주|리스/],
      ["자기계발",/자기계발|자기개발|자격증|영어공부|어학|커리어\s*개발/],
      ["요리·레시피",/요리|레시피|이유식|식품|식재료|맛집|집밥|간편식/],
      ["인테리어·리빙",/인테리어|리빙|집꾸미기|가구|홈퍼니싱|살림/],
      ["건강관리",/건강|헬스케어|병원|의료|질병|치료|검진|웰니스|혈당/],
      ["독서",/도서|독서|서점|책\s*좋아|전자책|웹소설/],
      ["반려동물",/반려동물|반려견|반려묘|강아지|고양이|펫케어|동물병원/],
      ["IT·디지털",/\bIT\b|테크|전자기기|디지털|컴퓨터|개발자|\bAI\b|인공지능/],
      ["엔터테인먼트",/영화|드라마|콘서트|연예|웹툰|OTT|공연|뮤지컬|음악/],
      ["스포츠·레저",/골프|풋살|축구|야구|스포츠|캠핑|등산|수영|낚시/],
      ["직장·커리어",/직장인|회사원|취업|채용|기업\s*인사|커리어|사무직|B2B/],
      ["로컬·맛집",/동네|지역|로컬|맛집|카페|생활권|상권/],
      ["쇼핑·커머스",/쇼핑|커머스|구매자|가격비교|소비자|구매\s*의향/],
      ["부동산·이사",/이사|분양|청약|아파트|부동산|전세|주거/],
      ["뉴스·시사",/뉴스|경제\s*기사|시사|정치|언론|매거진/],
      ["사진·영상",/카메라|사진|인스타|셀카|영상\s*제작|숏폼/]
    ],
    vertical:[
      ["육아",/육아|유치원|어린이집|엄마|산모|임신|신생아|베이비/],
      ["교육",/교육|학부모|초등|중등|고등|학습|학원|공부|수능/],
      ["여행",/여행|항공|호텔|숙박|캠핑|관광/],
      ["금융",/금융|은행|주식|투자|재테크|보험|카드/],
      ["게임",/게임|PC방|게이밍|e스포츠|롤\b/],
      ["부동산",/부동산|분양|아파트|청약|이사/],
      ["반려동물",/반려동물|반려견|반려묘|강아지|고양이/],
      ["건강·운동",/헬스|건강|병원|다이어트|운동|필라테스|골프/],
      ["쇼핑",/쇼핑|커머스|패션|화장품|가격비교/],
      ["자동차",/자동차|중고차|신차|차량|운전/],
      ["도서",/도서|독서|책|전자책|웹소설/],
      ["뷰티·미용",/뷰티|미용|화장품|피부|메이크업/],
      ["스포츠·레저",/골프|풋살|야구|축구|스포츠|캠핑|수영|등산/],
      ["B2B·직장인",/직장인|사무직|기업\s*고객|B2B|채용/]
    ],
    format:[
      ["배너",/배너|디스플레이|DA\b/],
      ["푸시",/푸시|앱\s*알림|push/i],
      ["문자(LMS·MMS)",/문자|LMS|MMS/i],
      ["검색",/검색\s*광고|브랜드\s*검색|SA\b/],
      ["동영상",/동영상\s*광고|영상\s*광고|VOD/],
      ["뉴스레터",/뉴스레터|이메일\s*광고/],
      ["리워드",/리워드|보상형|앱테크/],
      ["네이티브",/네이티브|인피드/],
      ["체험단",/체험단|서포터즈/],
      ["옥외·DOOH",/옥외|사이니지|전광판/]
    ],
    region:[
      ["서울",/서울|강남|강북|마포|서초|송파|홍대|성수/],
      ["경기·인천",/경기|인천|수원|성남|용인|고양|부천|화성|분당/],
      ["부산·경남",/부산|울산|경남|창원|김해/],
      ["대구·경북",/대구|경북|포항|구미/],
      ["충청",/충청|대전|세종|청주|천안|충남|충북/],
      ["호남",/호남|광주|전주|전북|전남|목포|순천/],
      ["강원",/강원|춘천|원주|강릉/],
      ["제주",/제주/],
      ["전국",/전국/],
      ["수도권",/수도권/]
    ]
  };
  const DISPLAY={age:"연령",gender:"성별",life:"자녀·생애주기",interest:"관심사",vertical:"업종",format:"광고상품",region:"지역"};
  const examples=["30대 유치원 엄마","20대 남성 게임","40대 여성 골프","영유아 부모 건강관리","서울 30대 직장인 재테크","반려견 보호자","30대 여성 여행 푸시"];
  const categoryMap={"육아·키즈":["육아"],"교육":["교육"],"금융·핀테크":["금융"],"여행·항공":["여행"],"게임":["게임"],"게임·e스포츠":["게임"],"반려동물":["반려동물"],"헬스케어":["건강·운동"],"부동산":["부동산"],"뷰티":["뷰티·미용"],"스포츠·레저":["스포츠·레저"],"커머스·쇼핑":["쇼핑"],"패션":["쇼핑"],"도서·독서":["도서"],"B2B·직장인":["B2B·직장인"]};
  const weights={life:9,interest:6,vertical:5,age:3,gender:2,format:4,region:4};
  const ageRegex=/(20\s*[~\-∼–]\s*30|2030|20·30|20,\s*30)\s*대?/g;
  const ageRegex2=/(30\s*[~\-∼–]\s*40|3040|30·40|30,\s*40)\s*대?/g;
  const ageRegex3=/(40\s*[~\-∼–]\s*50|4050|40·50|40,\s*50)\s*대?/g;
  const toPct=(num,den)=>den?Math.round(100*num/den):0;
  function parse(query){
    const q=String(query||"").trim().slice(0,160);
    const tags={age:[],gender:[],life:[],interest:[],vertical:[],format:[],region:[]};
    for(const [key,defs] of Object.entries(patterns)){
      for(const [value,regex] of defs){if(regex.test(q))tags[key].push(value);}
    }
    if(ageRegex.test(q))tags.age.push("20대","30대");
    if(ageRegex2.test(q))tags.age.push("30대","40대");
    if(ageRegex3.test(q))tags.age.push("40대","50대");
    for(const k of Object.keys(tags))tags[k]=uniq(tags[k]);
    // Maternal language implies parenthood, not kindergarten or a specific child age.
    if(/엄마|어머니|워킹맘|육아맘|아빠|아버지/.test(q)&&!tags.life.includes("학부모"))tags.life.push("학부모");
    const count=Object.values(tags).flat().length;
    return {query:q,tags,count,recognized:count>0,labels:Object.entries(tags).flatMap(([key,values])=>values.map(v=>DISPLAY[key]+" "+v))};
  }
  function compareMedia(media,intent,getProfile){
    const profile=getProfile(media)||{};
    const explicit=media.audience||{};
    const notes=String([media.summary,media.target,media.note].filter(Boolean).join(" "));
    const concrete=String(intent.query).match(/골프|풋살|수영|야구|축구|캠핑|등산|러닝|낚시|게임|반려견|반려묘|유치원/);
    const concreteTerm=concrete&&concrete[0];
    const contextText=String([media.name,media.category,media.summary,media.target,media.products?.join(" ")].filter(Boolean).join(" "));
    let weighted=0,maxWeight=0,matched=[],missing=[],confirmed=[],context=[];
    for(const [key,wanted] of Object.entries(intent.tags)){
      if(!wanted.length)continue;
      const baseWeight=weights[key]||1;
      // Query alternatives within one group are OR; parenthood and child stage
      // are separate criteria to avoid false exact match on generic "학부모".
      let tests=(key==="life"&&wanted.some(v=>v!=="학부모")&&wanted.includes("학부모"))
        ?[wanted.filter(v=>v!=="학부모"),["학부모"]]
        :[wanted];
      for(const opts of tests){
        const weight=key==="life"&&opts.includes("학부모")?4:baseWeight;
        maxWeight+=weight;
        let verified=Array.isArray(explicit[key])&&opts.some(v=>explicit[key].includes(v));
        let tag=Array.isArray(profile[key])&&opts.some(v=>profile[key].includes(v));
        // If a verified field is explicitly empty, do not infer it from text
        // containing phrases such as "학부모 비중 미확인".
        if(media.audienceReviewed&&Array.isArray(explicit[key])&&!verified)tag=false;
        // Prefer a narrow life stage over broad overlap. The fallback is related, not exact.
        if(!verified&&!tag&&key==="life"&&opts.includes("유치원")&&
          (profile.life||[]).some(v=>["영유아","초등"].includes(v))&&
          /육아|교육|학부모|유치원/.test(media.category+" "+notes)){
          weighted+=weight*0.24;context.push("유치원 연령 인접 · 단계 확인 필요");missing.push("유치원생 비중");continue;
        }
        if(!verified&&!tag&&key==="region"&&
          (profile.region||[]).includes("지역 타깃팅 가능")){
          weighted+=weight*0.2;context.push("지역 광고 가능 · 해당 지역 확인 필요");missing.push(opts.join("·")+" 집행 범위");continue;
        }
        if(verified||tag){
          let picked=opts.filter(v=>(verified?explicit[key]:profile[key]).includes(v));
          const source=verified&&media.audienceReviewed?"검수 등록 태그":verified?"등록 태그(미검수)":"이용 맥락 추정";
          weighted+=weight*(verified?(media.audienceReviewed?1:0.86):0.64);
          matched.push(...picked.map(v=>({key,value:v,source})));
          if(source==="검수 등록 태그")confirmed.push(...picked);
          else context.push(...picked);
        }else{
          missing.push(DISPLAY[key]+": "+opts.join("·"));
        }
      }
    }
    if(concreteTerm&&contextText.includes(concreteTerm)){
      maxWeight+=7;weighted+=7;
      matched.push({key:"interest",value:concreteTerm,source:"매체 설명 근거"});
    }
    const domain=matched.some(m=>["interest","vertical","life"].includes(m.key))||
      (intent.tags.region.length>0 && matched.some(m=>m.key==="region"));
    const genericDemographic=Object.keys(intent.tags).every(k=>["age","gender","region"].includes(k)||!intent.tags[k].length);
    if(!domain&&!genericDemographic)return null;
    let score=toPct(weighted,maxWeight);
    // Favor the strongest contextual match, never advertise score as an audience index.
    if(!matched.length)return null;
    if(matched.some(m=>m.key==="life"&&m.value==="유치원"))score=Math.min(100,score+3);
    if(concreteTerm){
      if(contextText.includes(concreteTerm))score=Math.min(100,Math.max(score+24,concreteTerm==="유치원"?score+13:78));
      else if(concreteTerm!=="유치원"&&concreteTerm!=="게임")score=Math.max(0,score-23);
    }
    let tier=score>=73?"상위 관련 후보":score>=45?"관련 매체":"확인 필요 후보";
    return {media,score,tier,matched,missing:uniq(missing),verifiedCount:confirmed.length,hasInterest:domain};
  }
  function rank(query,all,getProfile,limit=10){
    const intent=parse(query);
    if(!intent.recognized)return {intent,results:[],error:query.trim()?"해석 가능한 타깃 조건이 부족해요. 연령·자녀 연령·관심사 등을 추가해 주세요.":""};
    const results=all.map(m=>compareMedia(m,intent,getProfile)).filter(Boolean)
      .filter(x=>x.score>=17)
      .sort((a,b)=>b.score-a.score||b.verifiedCount-a.verifiedCount||a.media.name.localeCompare(b.media.name,"ko"))
      .slice(0,limit);
    return {intent,results};
  }
  let allFn=()=>[],profileFn=()=>({}),openDetail=()=>{};
  function createUI(){
    const existing=document.getElementById("smart-target-search");if(existing)return;
    const filterbar=document.querySelector(".filterbar");
    if(!filterbar)return;
    const style=document.createElement("style");
    style.textContent=`
      #smart-target-search{margin:16px 0 18px;background:linear-gradient(105deg,#eff6ff,#f7faff);border:1px solid #cadcf5;border-radius:17px;padding:21px}
      .smart-head{display:flex;justify-content:space-between;gap:12px;align-items:start;flex-wrap:wrap}
      .smart-head b{font-size:17px;color:#163b68}.smart-head small{display:block;font-size:11px;color:#67809e;margin-top:6px;line-height:1.6}
      .smart-version{border:1px solid #d0e0f5;border-radius:40px;background:white;color:#4874aa;padding:6px 10px;font-size:10px;font-weight:750}
      .smart-searchrow{display:flex;gap:8px;margin:15px 0 11px}
      .smart-searchrow input{flex:1;min-width:0;border:1px solid #bad0e9;border-radius:10px;background:white;padding:13px 14px;color:#1e3858;font-size:13px}
      .smart-searchrow input:focus{outline:2px solid #87aff6;outline-offset:1px}
      .smart-searchrow button{background:#2563eb;border:1px solid #2563eb;border-radius:10px;color:#fff;padding:0 18px;font-size:12px;font-weight:750}
      .smart-examples{display:flex;gap:7px;flex-wrap:wrap;align-items:center}
      .smart-examples small{font-size:10px;color:#6883a1}
      .smart-example{border:1px solid #ccdef1;border-radius:30px;background:#fff;color:#396491;padding:6px 10px;font-size:10px}
      #smart-clear{padding:6px 9px;border:0;background:transparent;color:#517398;font-size:11px}
      .smart-info{margin:15px 0 0;color:#557291;font-size:11px;line-height:1.7}
      .smart-result{margin-top:15px;border-top:1px solid #dce9f9;padding-top:15px}
      .smart-result-title{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center}
      .smart-result-title b{font-size:13px}.smart-result-title small{color:#66819c;font-size:10px}
      .smart-parsed{display:flex;gap:6px;flex-wrap:wrap;margin:12px 0}
      .smart-parsed span{background:white;color:#33659b;border:1px solid #dae5f5;border-radius:7px;padding:5px 8px;font-size:10px}
      .smart-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:12px}
      .smart-item{background:#fff;border:1px solid #dbe6f3;border-radius:11px;padding:14px}
      .smart-item-top{display:flex;justify-content:space-between;align-items:start;gap:8px}
      .smart-item h4{color:#1e3a5b;font-size:14px;margin:0 0 3px}
      .smart-item p{font-size:11px;color:#6c819b;line-height:1.5;margin:7px 0}
      .smart-item small{font-size:10px;color:#7790aa}
      .smart-tier{border:1px solid #d4e6fb;border-radius:8px;padding:4px 7px;color:#306fab;background:#f3f8ff;white-space:nowrap;font-size:10px}
      .smart-match{display:flex;gap:5px;flex-wrap:wrap;margin:9px 0 5px}
      .smart-match span{font-size:10px;border-radius:6px;padding:4px 7px;background:#eef4fc;color:#32618e}
      .smart-match span.verified{background:#e9f8f2;color:#17775b}
      .smart-missing{font-size:10px;color:#91713d;margin:8px 0 9px;background:#fff9ec;border-radius:7px;padding:6px 8px}
      .smart-detail{background:white;border:1px solid #c9dcef;color:#2465aa;border-radius:8px;padding:7px 11px;font-size:11px;font-weight:700}
      .smart-empty{margin-top:12px;background:white;color:#637991;border:1px solid #dbe6f2;padding:14px;border-radius:10px;font-size:12px}
      @media(max-width:650px){#smart-target-search{padding:13px}.smart-list{grid-template-columns:1fr}.smart-searchrow button{padding:0 12px}.smart-item{padding:12px}}
    `;
    document.head.appendChild(style);
    const panel=document.createElement("section");
    panel.id="smart-target-search";
    panel.innerHTML=`<div class="smart-head"><div><b>✨ 타깃 문장으로 매체 찾기</b><small>예: 30대 유치원 엄마 → 조건 자동 해석 → 관련 매체 추천</small></div><span class="smart-version">기존 매체 DB 기반</span></div>
      <form id="smart-form" class="smart-searchrow"><input type="search" id="smart-query" autocomplete="off" maxlength="160" placeholder="누구에게 광고하고 싶나요? 예: 30대 유치원 엄마" aria-label="타깃 자연어 검색"><button type="submit">맞춤 매체 찾기</button></form>
      <div class="smart-examples"><small>추천 검색어</small>${examples.slice(0,6).map((x,i)=>`<button class="smart-example" type="button" data-smart-example="${i}">${esc(x)}</button>`).join("")}<button id="smart-clear" type="button" hidden>검색 초기화</button></div>
      <div id="smart-response" aria-live="polite"></div>
      <p class="smart-info">키워드와 등록된 소개서·매체 정보를 분석해 추천해요. <b>유치원 학부모</b>라는 이용 맥락과 <b>광고 관리자에서 유치원 학부모를 지정할 수 있는 기능</b>은 서로 다르며, 확인되지 않은 조건은 따로 표시합니다.</p>`;
    filterbar.parentNode.insertBefore(panel,filterbar);
    panel.querySelector("#smart-form").addEventListener("submit",e=>{e.preventDefault();show(panel.querySelector("#smart-query").value);});
    panel.querySelectorAll("[data-smart-example]").forEach(b=>b.addEventListener("click",()=>{const q=examples[Number(b.dataset.smartExample)];panel.querySelector("#smart-query").value=q;show(q);}));
    panel.querySelector("#smart-clear").addEventListener("click",()=>{panel.querySelector("#smart-query").value="";panel.querySelector("#smart-response").innerHTML="";panel.querySelector("#smart-clear").hidden=true;});
    panel.addEventListener("click",e=>{const b=e.target.closest("[data-smart-open]");if(!b)return;const id=b.dataset.smartOpen;openDetail(id);});
  }
  function show(query){
    const panel=document.getElementById("smart-target-search");if(!panel)return;
    const area=panel.querySelector("#smart-response");
    let result=rank(query,allFn(),profileFn,10);
    panel.querySelector("#smart-clear").hidden=!result.intent.query;
    if(!result.intent.query){area.innerHTML="";return;}
    if(result.error){area.innerHTML=`<div class="smart-empty">${esc(result.error)}</div>`;return;}
    const sourceLabels={direct:"공식 소개서/PDF 또는 자료",guide:"광고 안내 페이지",request:"소개서 요청",thirdparty:"제3자 자료",none:"자료 미확인"};
    const explanation=result.intent.labels.map(t=>`<span>${esc(t)}</span>`).join("");
    let rows=result.results.map(({media,score,tier,matched,missing})=>{
      const seen=uniq(matched.map(m=>m.value));
      const reliable=new Set(matched.filter(m=>m.source==="검수 등록 태그").map(m=>m.value));
      const badges=seen.slice(0,6).map(t=>`<span class="${reliable.has(t)?"verified":""}" title="${reliable.has(t)?"기존 검수 등록 태그":"매체 설명·미검수 태그 기반"}">${esc(t)}${reliable.has(t)?" · 검수":""}</span>`).join("");
      const missingNote=missing.length?`<div class="smart-missing">추가 확인: ${esc(missing.slice(0,3).join(" / "))}${missing.length>3?" 외":""}</div>`:"";
      return `<article class="smart-item"><div class="smart-item-top"><div><h4>${esc(media.name)}</h4><small>${esc(media.category||"미분류")} · ${esc(sourceLabels[media.deckType]||"광고자료 상태 미확인")}</small></div><span class="smart-tier">${esc(tier)}</span></div><p>${esc(media.summary||"등록된 매체 요약 없음")}</p><div class="smart-match">${badges}</div>${missingNote}<button class="smart-detail" type="button" data-smart-open="${esc(media.id)}">매체 상세·광고자료 보기</button></article>`;
    }).join("");
    area.innerHTML=`<div class="smart-result"><div class="smart-result-title"><b>타깃 해석 결과 · 관련 매체 ${result.results.length}개 추천</b><small>유사도 순 정렬 · 공식 타깃팅 지원 확정 아님</small></div><div class="smart-parsed">${explanation}</div><div class="smart-list">${rows}</div>${!rows?'<div class="smart-empty">현재 등록된 매체 중 조건을 충분히 뒷받침하는 후보가 없어요. 검색 조건을 조금 넓혀 보거나 새로운 매체 아카이빙이 필요합니다.</div>':''}</div>`;
  }
  function init(config){
    allFn=typeof config.getAll==="function"?config.getAll:()=>[];
    profileFn=typeof config.getProfile==="function"?config.getProfile:()=>({});
    openDetail=typeof config.openDetail==="function"?config.openDetail:()=>{};
    createUI();
  }
  window.SmartTargetSearch={init,parse,rank};
})();
