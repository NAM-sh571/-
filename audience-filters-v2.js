(function mediaFacetsV2() {
  "use strict";
  const OPTIONS = {
    vertical: ["가족·생활","건강·운동","게임","교육","육아","뷰티·미용","여행","IT·테크","금융","뉴스·잡지","도서","라이프스타일","복지·행정","사진","생산성","소셜미디어","쇼핑","엔터테인먼트","교통","의료","자동차","유틸리티","부동산","스포츠·레저","B2B·직장인","반려동물"],
    age: ["10대","20대","30대","40대","50대","60대+"],
    gender: ["여성","남성"],
    interest: ["육아·키즈","재테크·투자","다이어트·피트니스","스킨케어·메이크업","패션","해외여행","국내여행","게임","신차·중고차","자기계발","요리·레시피","인테리어·리빙","건강관리","독서","학습·수험","반려동물","IT·디지털","엔터테인먼트","스포츠·레저","직장·커리어","로컬·맛집","쇼핑·커머스","부동산·이사","뉴스·시사","금융상품","사진·영상"],
    region: ["지역 타깃팅 가능","전국","수도권","서울","경기·인천","부산·경남","대구·경북","충청","호남","강원","제주"],
    life: ["임신·출산","신생아","영유아","유치원","초등","중·고등","학부모","시니어","반려동물 보호자"],
    format: ["배너","검색","네이티브","동영상","오디오","푸시","문자(LMS·MMS)","뉴스레터","브랜디드","리워드","리드 수집","체험단","스플래시·팝업","옥외·DOOH"],
    source: ["공식 PDF","공식 광고 안내","문의 후 수령","제3자 자료","자료 미확인"]
  };
  const TITLES = {
    vertical:"버티컬",age:"연령대",gender:"성별",interest:"관심사",region:"지역",
    life:"생애주기·자녀 연령",format:"광고상품",source:"광고소개서 상태"
  };
  const NOTES = {
    vertical:"매체 업종·콘텐츠 기반 분류",
    age:"이용자 특성/상품 타깃 단서",
    gender:"이용자 특성/상품 타깃 단서",
    interest:"매체 이용 맥락 기준",
    region:"광고에서 선택 가능한 지역만 확정",
    life:"학부모·자녀 연령 등",
    format:"등록된 광고상품 기준",
    source:"소개서 공개 및 수령 형태"
  };
  const CATEGORY_TO_VERTICAL = {
    "여행·항공":["여행"],"모빌리티":["교통","자동차"],"뷰티":["뷰티·미용"],"부동산":["부동산"],
    "금융·핀테크":["금융"],"리빙·인테리어":["라이프스타일","가족·생활"],"로컬·커뮤니티":["가족·생활"],
    "교육":["교육"],"육아·키즈":["육아","가족·생활"],"패션":["쇼핑"],"커머스·쇼핑":["쇼핑"],"B2B·직장인":["B2B·직장인","생산성"],
    "포털·종합":["유틸리티"],"뉴스·콘텐츠":["뉴스·잡지"],"스포츠·레저":["스포츠·레저","건강·운동"],
    "헬스케어":["의료","건강·운동"],"오디오·영상":["엔터테인먼트"],"SNS·동영상":["소셜미디어","엔터테인먼트"]
  };
  const CATEGORY_TO_INTEREST = {
    "여행·항공":["해외여행","국내여행"],"모빌리티":["신차·중고차"],"뷰티":["스킨케어·메이크업"],
    "부동산":["부동산·이사"],"금융·핀테크":["재테크·투자","금융상품"],
    "리빙·인테리어":["인테리어·리빙"],"로컬·커뮤니티":["로컬·맛집"],
    "교육":["학습·수험"],"육아·키즈":["육아·키즈"],"패션":["패션"],"커머스·쇼핑":["쇼핑·커머스"],
    "B2B·직장인":["직장·커리어"],"뉴스·콘텐츠":["뉴스·시사"],
    "스포츠·레저":["스포츠·레저"],"헬스케어":["건강관리"],
    "오디오·영상":["엔터테인먼트"],"SNS·동영상":["엔터테인먼트","사진·영상"]
  };
  const KEYWORDS = {
    vertical:{
      "가족·생활":/가족|생활정보|살림|주부|집안일|생활비|맘카페/,
      "건강·운동":/운동|건강|헬스케어|웰니스|피트니스|혈당|다이어트|러닝|헬스장/,
      "게임":/게임|게이밍|게이머|e스포츠/,
      "교육":/교육|학습|수험|입시|어학|학부모|유치원|초등|대학생/,
      "육아":/육아|영유아|신생아|어린이집|키즈|아동|맘카페|육아맘/,
      "뷰티·미용":/뷰티|스킨케어|화장품|메이크업|미용/,
      "여행":/여행|항공|호텔|숙박|관광|트래블|렌터카/,
      "IT·테크":/테크|IT기기|디지털기기|소프트웨어|스마트폰|개발자/,
      "금융":/금융|핀테크|주식|펀드|투자|재테크|은행|카드|보험/,
      "뉴스·잡지":/뉴스|매거진|시사|언론|잡지|저널/,
      "도서":/독서|도서|서적|책 읽|전자책|웹소설/,
      "라이프스타일":/라이프스타일|리빙|홈퍼니싱|취미|인테리어/,
      "복지·행정":/복지|정부지원|행정서비스|공공기관|지자체/,
      "사진":/사진|포토그래피|이미지편집|카메라/,
      "생산성":/업무효율|생산성|직장인|협업툴|업무관리/,
      "소셜미디어":/소셜미디어|인스타그램|틱톡|SNS|커뮤니티|네트워크/,
      "쇼핑":/쇼핑|커머스|상품구매|상품 구매|리셀|구매자/,
      "엔터테인먼트":/엔터테인먼트|음악|영화|드라마|영상|OTT|웹툰|콘텐츠/,
      "교통":/교통|지하철|버스|택시|이동경로|모빌리티|내비게이션/,
      "의료":/의료|병원|진료|의사|처방|질환|약국/,
      "자동차":/자동차|차량|운전자|중고차|렌터카/,
      "유틸리티":/유틸리티|도구 앱|포털|정보검색|검색 서비스/,
      "부동산":/부동산|주거|아파트|청약|분양|이사/,
      "스포츠·레저":/스포츠|골프|등산|러닝|레저|캠핑/,
      "B2B·직장인":/B2B|직장인|임직원|기업 고객|채용|경력직|업무용/,
      "반려동물":/반려동물|강아지|고양이|펫케어|동물병원/
    },
    interest:{
      "육아·키즈":/육아|영유아|신생아|아동|키즈|학부모|어린이집|유치원/,
      "재테크·투자":/재테크|투자|주식|펀드|자산관리|증권/,
      "다이어트·피트니스":/다이어트|피트니스|헬스장|체중감량|PT|운동/,
      "스킨케어·메이크업":/스킨케어|메이크업|뷰티|화장품|피부/,
      "패션":/패션|의류|스니커즈|신발|코디|리셀/,
      "해외여행":/해외여행|해외 여행|국제선|해외항공|해외항공권|출국/,
      "국내여행":/국내여행|국내 여행|국내선|제주 여행|국내 숙박/,
      "게임":/게임|게이머|게이밍|e스포츠/,
      "신차·중고차":/신차|중고차|차량|자동차 구매|운전자/,
      "자기계발":/자기계발|자기 개발|어학|직무 역량|자격증/,
      "요리·레시피":/요리|레시피|식재료|간편식|식품/,
      "인테리어·리빙":/인테리어|리빙|집꾸미기|홈퍼니싱|가구/,
      "건강관리":/건강관리|건강|웰니스|혈당|운동|질병 예방/,
      "독서":/도서|서점|책읽기|독서|전자책/,
      "학습·수험":/학습|공부|수능|수험|입시|학부모|학교|교육/,
      "반려동물":/반려동물|반려견|반려묘|강아지|고양이/,
      "IT·디지털":/IT기기|테크|소프트웨어|디지털|프로그래밍|개발자/,
      "엔터테인먼트":/영화|드라마|음악|OTT|콘서트|웹툰|엔터테인먼트/,
      "스포츠·레저":/스포츠|레저|골프|캠핑|운동|러닝/,
      "직장·커리어":/직장인|취업|채용|경력|기업|직무|B2B/,
      "로컬·맛집":/맛집|음식점|동네|지역 주민|로컬/,
      "쇼핑·커머스":/쇼핑|커머스|구매 고객|구매자|소비자|리셀/,
      "부동산·이사":/부동산|주거|분양|매매|전세|청약|이사/,
      "뉴스·시사":/뉴스|시사|경제 뉴스|언론|매거진/,
      "금융상품":/금융|보험|카드|대출|은행|예적금/,
      "사진·영상":/사진|동영상 제작|영상 편집|카메라|숏폼/
    },
    life:{
      "임신·출산":/임신|출산|임산부|산모|태교/,
      "신생아":/신생아|생후 [0-9]+개월/,
      "영유아":/영유아|영아|유아|어린이집|미취학/,
      "유치원":/유치원|유치부|유치원생/,
      "초등":/초등|초등학생|초·중·고|초중고/,
      "중·고등":/중학생|고등학생|중고등|초·중·고|초중고|수능|입시/,
      "학부모":/학부모|부모 고객|자녀 교육|자녀교육|육아맘|엄마/,
      "시니어":/시니어|노년층|고령층|실버세대|액티브 시니어/,
      "반려동물 보호자":/반려동물 보호자|반려견 보호자|반려묘 보호자/
    },
    format:{
      "배너":/배너|디스플레이|display|GFA|NOSP/i,
      "검색":/검색광고|검색 결과|브랜드검색|검색 지면|키워드 광고|브랜드존/i,
      "네이티브":/네이티브|피드 광고|인피드|native/i,
      "동영상":/동영상|비디오|영상 광고|숏폼|릴스|VOD/i,
      "오디오":/오디오|팟캐스트|라디오|오디오북/i,
      "푸시":/푸시|push|알림톡/i,
      "문자(LMS·MMS)":/LMS|MMS|문자 발송|문자 광고/i,
      "뉴스레터":/뉴스레터|newsletter/i,
      "브랜디드":/브랜디드|콘텐츠 협업|제휴 콘텐츠/i,
      "리워드":/리워드|rewarded|보상형/i,
      "리드 수집":/리드젠|리드 수집|DB 수집|상담 신청/i,
      "체험단":/체험단|서포터즈/i,
      "스플래시·팝업":/스플래시|팝업|splash|pop-up/i,
      "옥외·DOOH":/옥외|DOOH|전광판|교통 광고/i
    }
  };
  const REGION_REGEX = /지역\s*(타겟팅|타깃팅|지정|선택)|거주\s*지역\s*(타겟팅|타깃팅)|위치기반\s*타겟팅|지역별\s*타깃|geo[\s-]*targeting|동네\s*타깃|광고\s*지역\s*설정/i;
  const ALL_KEYS=Object.keys(OPTIONS);
  const skipKeys=new Set(["source","vertical","interest","format"]);
  const $=q=>document.querySelector(q);
  const $$=q=>Array.from(document.querySelectorAll(q));
  const escapeHtml = v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const empty=()=>Object.fromEntries(ALL_KEYS.map(k=>[k,[]]));
  const valid=(xs,k)=>Array.isArray(xs)?xs.filter(x=>OPTIONS[k].includes(x)):[];
  const uniq=arr=>[...new Set(arr)];
  let state=empty(), verifiedOnly=false,landscape=false,redraw=()=>{},lastMatches=new Map();
  function sourceTags(x){
    if(x.deckType==="none"||(!x.deckUrl&&!x.localFileId))return ["자료 미확인"];
    if(x.deckType==="thirdparty")return ["제3자 자료"];
    if(x.deckType==="request")return ["문의 후 수령"];
    if(x.deckType==="direct"&&/\.pdf(?:[?#]|$)/i.test(String(x.deckUrl)))return ["공식 PDF"];
    return ["공식 광고 안내"];
  }
  function derived(x,documentMode=false){
    const p=empty();
    const user=x.audience||{};
    const raw=documentMode?(x.documentText||""):([x.summary,x.target,x.subtitle].filter(Boolean).join(" "));
    const body=String(raw||"").slice(0,documentMode?120000:2000);
    const products=String(documentMode?body:(x.products||[]).join(" ")); 
    if(!documentMode){
      p.vertical.push(...(CATEGORY_TO_VERTICAL[x.category]||[]));
      p.interest.push(...(CATEGORY_TO_INTEREST[x.category]||[]));
    }
    for(const dim of ["vertical","interest","life"]){
      for(const [tag,re] of Object.entries(KEYWORDS[dim]))if(re.test(body))p[dim].push(tag);
    }
    for(const [tag,re] of Object.entries(KEYWORDS.format))if(re.test(products))p.format.push(tag);
    if(/2030|20\s*[~–-]\s*30대|20·30대/.test(body))p.age.push("20대","30대");
    if(/3040|30\s*[~–-]\s*40대|30·40대/.test(body))p.age.push("30대","40대");
    if(/4050|40\s*[~–-]\s*50대|40·50대/.test(body))p.age.push("40대","50대");
    for(const tag of OPTIONS.age){
      const re=tag==="60대+"?/60대(?:\s*이상)?|60세\s*이상/:new RegExp(tag);
      if(re.test(body))p.age.push(tag);
    }
    if(/여성|여자\s*이용자|여자\s*고객/.test(body))p.gender.push("여성");
    if(/남성|남자\s*이용자|남자\s*고객/.test(body))p.gender.push("남성");
    if(REGION_REGEX.test(documentMode?body:([x.target,x.note].filter(Boolean).join(" "))))p.region.push("지역 타깃팅 가능");
    if(documentMode){
      const rq=body.match(/(?:광고|타깃|타겟|노출|집행|지역\s*선택)[^\n。.!?]{0,35}/g)||[];
      const segment=rq.join(" ");
      for(const [tag,re] of Object.entries({
        "전국":/전국\s*(집행|노출|타깃|타겟)/,"수도권":/수도권/,"서울":/서울/,"경기·인천":/경기|인천/,
        "부산·경남":/부산|경남/,"대구·경북":/대구|경북/,"충청":/충청|대전|세종/,
        "호남":/호남|광주|전남|전북/,"강원":/강원/,"제주":/제주/
      }))if(re.test(segment))p.region.push(tag);
    }
    p.source.push(...(documentMode?[]:sourceTags(x)));
    for(const k of ALL_KEYS){
      p[k]=uniq(p[k]);
      if(valid(user[k],k).length) p[k]=valid(user[k],k);
    }
    return p;
  }
  function profile(x){return derived(x)}
  function match(x){
    const tags=profile(x);let matched=0,unknown=[],matchedGroups=[];
    for(const k of ALL_KEYS){
      const selected=state[k];
      if(!selected.length)continue;
      const found=tags[k];
      if(selected.some(v=>found.includes(v))){
        if(verifiedOnly&&["age","gender","life","region"].includes(k)&&!x.audienceReviewed){
          return {show:false,reason:"자료 검수 전",profile:tags};
        }
        matched++;matchedGroups.push(k);continue;
      }
      if(skipKeys.has(k))return {show:false,reason:k+" 조건 불일치",profile:tags};
      if(k==="region"){
        // 지역 대상 여부가 없는 경우에는 '미확인'이지 해당 지역을 타깃할 수 있다는 뜻이 아닙니다.
        if(found.includes("지역 타깃팅 가능")&&!selected.includes("지역 타깃팅 가능"))unknown.push(k);
        else if(!found.length)unknown.push(k);
        else return {show:false,profile:tags};
      }else if(k==="life"){
        const broad=found.includes("학부모");
        const specific=selected.some(v=>["신생아","영유아","유치원","초등","중·고등"].includes(v));
        if(!found.length||(broad&&specific))unknown.push(k);
        else return {show:false,profile:tags};
      }else if(!found.length)unknown.push(k);
      else return {show:false,profile:tags};
    }
    if(verifiedOnly&&unknown.length)return {show:false,profile:tags};
    if(unknown.length&&!matched)return {show:false,profile:tags};
    return {show:true,profile:tags,matched,unknown,matchedGroups,
      fullyConfirmed:!!x.audienceReviewed&&unknown.length===0};
  }
  function hasFilters(){return ALL_KEYS.some(k=>state[k].length)}
  function selectionSummary(){return ALL_KEYS.flatMap(k=>state[k].map(v=>({group:k,value:v})))}
  function refreshUI(){
    $$(".facet-opt[data-facet]").forEach(el=>el.setAttribute("aria-pressed",String(state[el.dataset.facet]?.includes(el.dataset.value))));
    const active=$("#facet-active");
    if(active)active.innerHTML=selectionSummary().map(x=>`<button class="facet-active-tag" type="button" data-remove-facet="${escapeHtml(x.group)}" data-remove-value="${escapeHtml(x.value)}" aria-label="${escapeHtml(x.value)} 필터 제거">${escapeHtml(TITLES[x.group])} · ${escapeHtml(x.value)} ×</button>`).join("");
    const clear=$("#facet-clear");
    if(clear)clear.disabled=!hasFilters();
    const count=$("#facet-count");
    if(count)count.textContent=hasFilters()?selectionSummary().length+"개 선택":"자유롭게 조합";
  }
  function drawGroups(){
    return ALL_KEYS.map(k=>`<fieldset class="facet-group" data-group="${k}"><legend>${escapeHtml(TITLES[k])}</legend><p class="facet-group-note">${escapeHtml(NOTES[k])}</p><div class="facet-options">${OPTIONS[k].map(v=>`<button type="button" class="facet-opt" data-facet="${k}" data-value="${escapeHtml(v)}" aria-pressed="false">${escapeHtml(v)}</button>`).join("")}</div></fieldset>`).join("");
  }
  function init(redrawFn){
    redraw=redrawFn;
    const style=document.createElement("style");
    style.textContent=`
      .audience-panel{margin-top:16px;padding:20px;border-radius:16px;background:#fff;border:1px solid #e0e8f2;box-shadow:0 6px 20px #0b28500a}
      .audience-title-row,.facet-toolbar,.landscape-toggle-row{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px}
      .audience-title-row b{font-size:16px;color:#1c344e}
      .audience-title-row small{display:block;color:#70849b;font-size:11px;margin-top:4px}
      .facet-count{border-radius:50px;background:#eff6ff;color:#2762ab;padding:7px 12px;font-size:11px;font-weight:700}
      .audience-presets{display:flex;gap:7px;flex-wrap:wrap;margin:16px 0}
      .preset-btn{padding:7px 12px;border:1px solid #cbdff5;border-radius:30px;color:#375574;background:white;font-size:11px}
      .preset-btn:hover,.facet-opt:hover{border-color:#7aa7dd}
      .audience-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
      .facet-group{margin:0;min-width:0;border:1px solid #e5ecf4;border-radius:12px;padding:10px 12px 14px}
      .facet-group legend{font-size:13px;font-weight:800;color:#263e57;padding:0 5px}
      .facet-group-note{margin:2px 0 9px;color:#899bb0;font-size:10px}
      .facet-options{display:flex;flex-wrap:wrap;gap:6px}
      .facet-opt{background:#fff;border:1px solid #cdd9e7;border-radius:30px;padding:6px 11px;color:#3d5672;font-size:11px;white-space:nowrap}
      .facet-opt[aria-pressed="true"]{background:#2563eb;color:white;border-color:#2563eb;font-weight:750}
      .facet-toolbar{margin-top:15px}
      .facet-toolbar label{font-size:11px;display:flex;align-items:center;gap:6px;color:#4f647c}
      .facet-toolbar input{accent-color:#2563eb}
      .facet-toolbar button{border:0;background:none;color:#2765b4;font-size:11px;font-weight:750;cursor:pointer}
      .facet-toolbar button:disabled{opacity:.45;cursor:not-allowed}
      .facet-note{font-size:11px;line-height:1.75;color:#687d96;margin:13px 0 0}
      .audience-active{display:flex;gap:6px;flex-wrap:wrap;margin:13px 0 0}
      .facet-active-tag{font-size:10px;padding:7px 10px;border-radius:7px;color:#1b5cb5;border:1px solid #cde0ff;background:#edf4ff}
      .audience-result{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin:8px 0 3px}
      .facet-highlight{display:inline-flex;flex-wrap:wrap;gap:5px}
      .facet-highlight span{background:#edf4fb;border-radius:8px;padding:4px 7px;font-size:10px;color:#315f8f}
      .candidate-pill{font-size:10px;color:#906314;border:1px solid #edd5a5;background:#fff8e9;border-radius:7px;padding:5px 7px}
      .confirmed-pill{font-size:10px;color:#176b58;border:1px solid #cce6dc;background:#edfaf6;border-radius:7px;padding:5px 7px}
      .landscape{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
      .landscape-group{padding:16px;border:1px solid #e5ecf4;border-radius:12px;background:#fff;min-height:120px}
      .landscape-group h4{font-size:13px;margin:0 0 10px}
      .landscape-group h4 small{font-size:11px;color:#7f90a5}
      .landscape-group button{display:inline-flex;margin:3px;border:1px solid #dae6f5;border-radius:30px;background:#f6f9fd;padding:7px 10px;color:#2c5b90;font-size:11px}
      .facet-form-group{margin:10px 0;padding:10px;border:1px solid #dae5f1;border-radius:11px}
      .facet-form-group summary{font-size:13px;color:#21466e;font-weight:800;cursor:pointer}
      .facet-form-group p{font-size:11px;color:#657c95;line-height:1.65}
      .facet-form-line{margin:10px 0;padding-top:8px;border-top:1px solid #f0f3f7}
      .facet-form-line b{font-size:11px;display:block;margin-bottom:5px}
      .facet-check{font-size:11px;display:inline-flex;align-items:center;gap:4px;padding:4px 7px 4px 0}
      .facet-check input{accent-color:#2563eb}
      @media(max-width:1060px){.audience-grid,.landscape{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media(max-width:640px){.audience-panel{padding:13px}.audience-grid,.landscape{grid-template-columns:1fr}.facet-group{padding:9px}}
    `;
    document.head.appendChild(style);
    const bar=$(".filterbar");
    if(!bar)return;
    const panel=document.createElement("section");panel.className="audience-panel";panel.id="audience-panel";
    panel.innerHTML=`
      <div class="audience-title-row"><div><b>🎯 매체 상세 다중 필터</b><small>업종 · 연령 · 성별 · 관심사 · 지역 등 8개 그룹 조합 검색</small></div>
      <span class="facet-count" id="facet-count">자유롭게 조합</span></div>
      <div class="audience-presets">${[
        ["mom3040","30·40대 엄마"],["elementary","초등 학부모"],["baby","영유아 부모"],
        ["beauty2030","20·30대 뷰티"],["finance","직장인·재테크"],["travel","여행 고객"],["local","지역 타깃"],["health","건강·운동"]
      ].map(([k,v])=>`<button class="preset-btn" data-preset="${k}" type="button">${v}</button>`).join("")}</div>
      <div id="facet-body"><div class="audience-grid">${drawGroups()}</div>
      <div class="facet-toolbar"><label><input id="facet-strict" type="checkbox"> 인구통계·생애주기·지역은 확인된 자료 태그만 보기</label>
      <button id="facet-clear" type="button">선택 초기화</button></div>
      <p class="facet-note"><b>필터 규칙:</b> 동일 그룹 안에서는 OR, 서로 다른 그룹 사이에서는 AND를 적용합니다. 이용자 구성비는 광고 타깃팅 지원과 다릅니다. 지역은 특정 지명 타깃팅 가능 여부가 확인되지 않으면 '미확인'으로 처리합니다. 이용자 조건이 일부 부족한 매체는 '추가 확인 필요'로 표시합니다.</p>
      </div><div class="audience-active" id="facet-active"></div>`;
    bar.appendChild(panel);
    const line=$(".resultline");
    if(line){
      const tools=document.createElement("div");tools.className="landscape-toggle-row";tools.style.margin="0 0 12px";
      tools.innerHTML='<span id="audience-result-note" style="font-size:11px;color:#6e8198"></span><button class="btn-outline" id="landscape-toggle" type="button">◫ 미디어 랜드스케이프</button>';
      line.insertAdjacentElement("afterend",tools);
    }
    const cards=$("#cards");
    if(cards){const grid=document.createElement("div");grid.id="landscape";grid.className="landscape";grid.style.display="none";cards.insertAdjacentElement("afterend",grid);}
    panel.addEventListener("click",ev=>{
      const b=ev.target.closest("button");if(!b)return;
      if(b.id==="facet-clear"){reset();return;}
      if(b.dataset.facet){
        const k=b.dataset.facet, v=b.dataset.value;
        state[k]=state[k].includes(v)?state[k].filter(z=>z!==v):[...state[k],v];redraw();return;
      }
      if(b.dataset.preset){preset(b.dataset.preset);return;}
      if(b.dataset.removeFacet){
        const k=b.dataset.removeFacet, v=b.dataset.removeValue;
        state[k]=state[k].filter(x=>x!==v);redraw();
      }
    });
    panel.addEventListener("change",ev=>{if(ev.target.id==="facet-strict"){verifiedOnly=ev.target.checked;redraw();}});
    $("#landscape-toggle")?.addEventListener("click",()=>{landscape=!landscape;redraw();});
    refreshUI();
  }
  function preset(name){
    const d={
      mom3040:{age:["30대","40대"],gender:["여성"],life:["학부모"]},
      elementary:{life:["초등"]},baby:{life:["신생아","영유아","유치원","학부모"]},
      beauty2030:{age:["20대","30대"],interest:["스킨케어·메이크업"]},
      finance:{interest:["재테크·투자","직장·커리어"]},
      travel:{vertical:["여행"]},local:{region:["지역 타깃팅 가능"]},health:{vertical:["건강·운동"]}
    };
    state=empty();if(d[name])Object.assign(state,d[name]);verifiedOnly=false;
    const b=$("#facet-strict");if(b)b.checked=false;redraw();
  }
  function reset(andRender=true){
    state=empty();verifiedOnly=false;
    const b=$("#facet-strict");if(b)b.checked=false;
    if(andRender)redraw();else refreshUI();
  }
  function badges(x){
    const p=profile(x),tags=[...p.age,...p.gender,...p.life].slice(0,4);
    let status="";
    if(hasFilters()){
      const m=lastMatches.get(x.id)||match(x);
      if(m.unknown?.length)status=`<span class="candidate-pill">조건 일부 미확인: ${escapeHtml(m.unknown.map(k=>TITLES[k]).join("·"))}</span>`;
      else status=`<span class="confirmed-pill">${x.audienceReviewed?"소개서 검수 태그 일치":"등록된 설명·상품 태그 일치"} · 집행 조건 확인 필요</span>`;
    }
    if(!tags.length&&!status)return "";
    return `<div class="audience-result">${tags.map(v=>`<span class="facet-highlight"><span>${escapeHtml(v)}</span></span>`).join("")}${status}</div>`;
  }
  function detail(x){
    const p=profile(x);
    const rows=ALL_KEYS.map(k=>p[k].length?`<div style="margin:9px 0"><b style="font-size:11px">${escapeHtml(TITLES[k])}</b><div class="facet-highlight">${p[k].map(v=>`<span>${escapeHtml(v)}</span>`).join("")}</div></div>`:"").join("");
    return `<div class="detail-section"><h3>🎯 광고 매체 분류 태그</h3>${rows||"<p class='secondary-text'>자료가 없어 분류 태그가 없습니다.</p>"}<p class="facet-note">${x.audienceReviewed?"소개서 검수로 등록한 타깃 태그가 포함되어 있습니다.": "기존 매체의 업종·설명·상품명에서 추출한 탐색용 태그로, 매체가 제공하는 광고 타깃팅 기능을 보증하지 않습니다."} 지역 범위나 실제 구매 타깃 지정은 별도 확인이 필요합니다.</p></div>`;
  }
  function formFields(x){
    const p=x?.audience||{};
    return `<div class="field wide"><details class="facet-form-group"><summary>🎯 상세 필터용 태그 편집 · 8개 그룹</summary><p>소개서에 기재된 값만 검수 완료 표시하세요. 텍스트 추출은 분류 후보를 자동 제안하지만 근거 검수까지 대신하지는 않습니다.</p>${ALL_KEYS.filter(k=>k!=="source").map(k=>`<div class="facet-form-line"><b>${escapeHtml(TITLES[k])}</b>${OPTIONS[k].map(v=>`<label class="facet-check"><input type="checkbox" name="aud-${k}" value="${escapeHtml(v)}" ${valid(p[k],k).includes(v)?"checked":""}>${escapeHtml(v)}</label>`).join("")}</div>`).join("")}<label class="facet-check"><input type="checkbox" name="aud-reviewed" ${x?.audienceReviewed?"checked":""}> 소개서에서 해당 태그를 실제 확인했고 검수 완료</label></details></div>`;
  }
  function fromForm(form){
    const audience={};
    for(const k of ALL_KEYS.filter(x=>x!=="source")){
      audience[k]=[...form.querySelectorAll(`input[name="aud-${k}"]:checked`)].map(i=>i.value).filter(v=>OPTIONS[k].includes(v));
    }
    return {audience,audienceReviewed:!!form.querySelector('input[name="aud-reviewed"]:checked')};
  }
  function suggest(form,body){
    if(!body?.trim())return;
    const p=derived({documentText:body},true);
    for(const k of ALL_KEYS.filter(x=>x!=="source")){
      for(const input of form.querySelectorAll(`input[name="aud-${k}"]`)){
        input.checked=p[k].includes(input.value);
      }
    }
    const reviewed=form.querySelector('input[name="aud-reviewed"]');if(reviewed)reviewed.checked=false;
    const el=form.querySelector("#analysis-panel");
    if(el)el.insertAdjacentHTML("beforeend",`<p><b>상세 태그 자동 제안:</b> ${escapeHtml(ALL_KEYS.filter(k=>k!=="source").flatMap(k=>p[k]).join(" · ")||"자료에서 확정 가능한 태그가 없습니다.")} · <b>미검수</b>. 소개서에 등장하는 단어와 실제 타깃팅 가능 여부는 다릅니다.</p>`);
  }
  function afterRender(results){
    lastMatches=new Map(results.map(x=>[x.id,match(x)]));
    refreshUI();
    const note=$("#audience-result-note");
    if(note){
      const uncertain=results.filter(x=>match(x).unknown?.length).length;
      note.textContent=hasFilters()?`선택한 필터로 ${results.length}개 매체 검색${uncertain?" · 미확인 조건 포함 "+uncertain+"개":""}`:"상세 타깃 필터를 선택하거나 산업별 미디어 랜드스케이프를 살펴보세요.";
      if(state.region.length&&!results.length)note.textContent+=" · 지역별 타깃팅 근거가 없는 매체는 제외했어요.";
    }
    const grid=$("#landscape"),cards=$("#cards"),toggle=$("#landscape-toggle");
    if(!grid||!cards)return;
    grid.style.display=landscape?"grid":"none";cards.style.display=landscape?"none":"grid";
    if(toggle)toggle.textContent=landscape?"▦ 카드 목록 보기":"◫ 미디어 랜드스케이프";
    if(landscape){
      const by={};
      for(const x of results)(by[x.category]??=[]).push(x);
      grid.innerHTML=Object.entries(by).sort((a,b)=>b[1].length-a[1].length).map(([cat,arr])=>`<div class="landscape-group"><h4>${escapeHtml(cat)} <small>${arr.length}개</small></h4>${arr.map(x=>`<button type="button" data-detail="${escapeHtml(x.id)}">${escapeHtml(x.name)}</button>`).join("")}</div>`).join("")||"<p>조건에 맞는 매체가 없습니다.</p>";
    }
  }
  window.MediaTargetFilters={init,check:match,badges,detail,formFields,fromForm,suggest,afterRender,reset,profile};
})();
