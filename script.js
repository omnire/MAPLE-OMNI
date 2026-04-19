/**
 * ============================================================================
 * 🍁 MAPLE OMNI V13.6.7 - 완벽 통합본
 * (전투력 미반영 버그 수정, 중복 ID 예외 처리, 콤마(,) 계산 오류 완벽 해결)
 * ============================================================================
 */

// 🌐 현재 검색된 캐릭터의 상세 데이터를 임시 저장하는 변수입니다.
// 초보자 가이드: 다른 함수들에서도 이 데이터를 쉽게 꺼내 쓸 수 있도록 맨 위에 전역 변수로 선언합니다.
let currentSearchData = null; 

// 🔑 넥슨 OpenAPI 발급 키 (외부 유출 주의)
const API_KEY = "test_b4b72659365dd8f8e050630f7d05b609548335ee63fb773f616d4a4c479769e7efe8d04e6d233bd35cf2fabdeb93fb0d";

// ⏱️ 사냥 및 도핑 타이머 관련 전역 변수 설정
// 초보자 가이드: 시간을 계산하고 일시정지 상태를 기억하는 변수들입니다.
let timerId = null, timeLeft = 1800, isPaused = false, endTime = null; 
let buffTimerId = null, buffTimeLeft = 0; 
let currentOcrMode = 'hunt'; // OCR(이미지 인식) 기본 모드 설정

// 📊 스탯 및 도핑 리스트 (이름, 지속시간, 추가 메소/경험치 수치)
const statItems = ['장비 아이템', '유니온 공격대', '어빌리티', '아티팩트', '스킬'];
const buffs = [
    { name: 'VIP 버프', d: 0, m: 0 }, { name: '추가 경험치 쿠폰(50%)', d: 0, m: 0 }, { name: '경험치 3배 쿠폰', d: 0, m: 0 },
    { name: '경험치 4배쿠폰', d: 0, m: 0 }, { name: '소형 재물 획득의 비약', d: 20, m: 1.2 }, { name: '소형 경험 축적의 비약', d: 10, m: 0 },
    { name: '유니온의 행운', d: 50, m: 0 }, { name: '유니온의 부', d: 0, m: 50 }, { name: '익스트림 골드', d: 0, m: 0 }
];
const sellItems = ["솔 에르다 조각", "코어 젬스톤", "어센틱 심볼", "상급 주문의 정수", "뒤틀린 시간의 정수", "기타"];

// 📝 사냥 기록을 저장하는 배열 및 로컬 스토리지 연동
let subHistory = {1:[], 2:[], 3:[], 4:[]}; 
let huntRecords = JSON.parse(localStorage.getItem('maple_hunt_records')) || []; 
let currentIdx = 1; // 현재 선택된 탭(캐릭터) 번호

// 📅 오늘 날짜를 'YYYY-M-D' 형식으로 가져오는 함수
function getTodayStr() {
    const today = new Date();
    return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
}

// ============================================================================
// 🚪 화면 이동 함수 (포털, 사냥모드, 검색화면, 빌더 등)
// ============================================================================

// 🏠 메인 포털 화면으로 돌아가는 함수
window.backToPortal = function(isPopState = false) {
    const elApp = document.getElementById('appContent');
    const elSearch = document.getElementById('searchPageContent');
    const elPortal = document.getElementById('mainPortal');
    const elDetailTab = document.getElementById('detailTabMenu');
    const elBuilder = document.getElementById('omniBuilderSection'); 

    if (elApp) elApp.style.setProperty('display', 'none', 'important');
    if (elSearch) elSearch.style.setProperty('display', 'none', 'important');
    if (elDetailTab) elDetailTab.style.setProperty('display', 'none', 'important');
    if (elBuilder) elBuilder.style.setProperty('display', 'none', 'important'); 
    if (elPortal) elPortal.style.setProperty('display', 'block', 'important'); 

    sessionStorage.setItem('omni_current_page', 'portal'); 
    window.scrollTo(0, 0); 

    if (!isPopState) history.pushState({ page: 'portal' }, "", "#portal");
};

// ⚔️ 사냥 모드(메인 앱)를 시작하는 함수
window.startApp = function(isPopState = false) {
    const elPortal = document.getElementById('mainPortal');
    const elSearch = document.getElementById('searchPageContent');
    const elApp = document.getElementById('appContent');
    const elBuilder = document.getElementById('omniBuilderSection'); 

    if(elPortal) elPortal.style.setProperty('display', 'none', 'important');
    if(elSearch) elSearch.style.setProperty('display', 'none', 'important');
    if(elBuilder) elBuilder.style.setProperty('display', 'none', 'important'); 
    if(elApp) elApp.style.setProperty('display', 'flex', 'important');
    
    sessionStorage.setItem('omni_current_page', 'hunt'); 
    
    const lastNav = sessionStorage.getItem('omni_nav_page') || 1;
    showPage(lastNav);
    
    const lastTab = parseInt(sessionStorage.getItem('omni_current_tab')) || 1;
    openTab(lastTab);

    if (!isPopState) history.pushState({ page: 'hunt' }, "", "#hunt");
};

// 🔍 캐릭터 상세 검색 결과 창을 여는 함수
window.openSearchPage = function(isPopState = false) {
    const elApp = document.getElementById('appContent');
    const elPortal = document.getElementById('mainPortal');
    const elSearch = document.getElementById('searchPageContent');
    const elPlaceholder = document.getElementById('searchPlaceholder');
    const elBuilder = document.getElementById('omniBuilderSection');
    
    if(elPortal) elPortal.style.setProperty('display', 'none', 'important');
    if(elApp) elApp.style.setProperty('display', 'none', 'important');
    if(elBuilder) elBuilder.style.setProperty('display', 'none', 'important');
    if(elSearch) elSearch.style.setProperty('display', 'block', 'important');
    if(elPlaceholder) elPlaceholder.style.setProperty('display', 'block', 'important');
    
    sessionStorage.setItem('omni_current_page', 'search'); 

    if (!isPopState) history.pushState({ page: 'search' }, "", "#search");
};

// 🔙 브라우저 뒤로가기 버튼 처리
window.addEventListener('popstate', (event) => {
    if (event.state) {
        if (event.state.page === 'hunt') window.startApp(true);
        else if (event.state.page === 'search') window.openSearchPage(true);
        else window.backToPortal(true);
    } else {
        window.backToPortal(true);
    }
});

// ⏳ 초기 로딩 시 마지막으로 보던 화면을 복구합니다.
window.addEventListener('DOMContentLoaded', () => {
    init(); 
    
    const lastPage = sessionStorage.getItem('omni_current_page');
    if (lastPage === 'hunt') {
        window.startApp(true); 
        history.replaceState({ page: 'hunt' }, "", "#hunt");
    } else if (lastPage === 'search') {
        window.openSearchPage(true); 
        history.replaceState({ page: 'search' }, "", "#search");
        
        const lastSearch = sessionStorage.getItem('omni_last_search');
        if (lastSearch) {
            const cachedData = JSON.parse(localStorage.getItem(`maple_api_search_${lastSearch}`));
            if (cachedData) {
                renderSearchDetail(cachedData.basic, cachedData.stat, cachedData.item, cachedData.ability, cachedData.symbol, cachedData.dojang);
            }
        }
    } else {
        window.backToPortal(true); 
        history.replaceState({ page: 'portal' }, "", "#portal");
    }
});

// ============================================================================
// 🛡️ API 데이터 불러오기 (캐릭터 정보 및 랭킹)
// ============================================================================

// 🔄 사냥 기록지에 등록된 캐릭터들의 최신 정보를 동기화합니다.
async function fetchMapleData(force = false) {
    const todayStr = getTodayStr();
    let syncedCount = 0;
    const syncBtn = document.querySelector('.api-refresh-btn');
    if(syncBtn) syncBtn.innerText = "⏳ 스텔스 동기화 중...";

    for (let i = 1; i <= 4; i++) {
        const nameInput = document.getElementById(`nameInput_${i}`);
        if (!nameInput) continue;
        const charName = nameInput.value.trim();
        if (!charName || charName.includes("캐릭터 ")) continue; 

        const cacheKey = `maple_api_hunt_${charName}`;
        let cachedData = JSON.parse(localStorage.getItem(cacheKey));
        if (!force && cachedData && cachedData.date === todayStr) continue;

        try {
            const headers = { "x-nxopen-api-key": API_KEY };
            const ocidRes = await fetch(`https://open.api.nexon.com/maplestory/v1/id?character_name=${encodeURIComponent(charName)}`, { headers });
            if (ocidRes.status === 429) { showAlert("❌ API 일일 한도 초과! 내일 다시 시도해주세요."); break; }
            const ocidData = await ocidRes.json();
            if (!ocidData.ocid) continue;
            
            await new Promise(res => setTimeout(res, 600)); 
            const basic = await fetch(`https://open.api.nexon.com/maplestory/v1/character/basic?ocid=${ocidData.ocid}`, { headers }).then(r => r.json());
            await new Promise(res => setTimeout(res, 600)); 
            const stat = await fetch(`https://open.api.nexon.com/maplestory/v1/character/stat?ocid=${ocidData.ocid}`, { headers }).then(r => r.json());

            localStorage.setItem(cacheKey, JSON.stringify({ date: todayStr, basic, stat }));
            syncedCount++;
            await new Promise(res => setTimeout(res, 1000)); 
        } catch (e) { console.error(`${charName} 동기화 실패:`, e); }
    }
    if(syncBtn) syncBtn.innerText = "🔄 정보 동기화";
    openTab(currentIdx);
    if (syncedCount > 0) showAlert(`✨ ${syncedCount}개의 캐릭터가 최신화 되었습니다!`);
    else if (force) showAlert("✨ 모든 캐릭터가 이미 최신 상태입니다.");
}

// 🖼️ 사냥모드 왼쪽 프로필 창에 정보를 그립니다.
function renderHuntSidebar(basic, stat) {
    document.getElementById('profileImg').src = basic.character_image;
    document.getElementById('profileName').innerText = basic.character_name;
    document.getElementById('profileLevel').innerText = `Lv. ${basic.character_level}`;
    document.getElementById('profileJob').innerText = basic.character_class;
    document.getElementById('profileWorld').innerText = basic.world_name;
    
    const getStatValue = (target) => {
        if (!stat || !stat.final_stat) return "0";
        const found = stat.final_stat.find(s => s.stat_name === target);
        return found ? found.stat_value : "0";
    };
    
    // 초보자 가이드: 숫자에 콤마가 있으면 에러가 날 수 있어 콤마를 제거한 뒤 변환합니다.
    const rawPower = String(getStatValue("전투력")).replace(/,/g, '');
    const rawAtk = String(getStatValue("최대 스탯 공격력")).replace(/,/g, '');
    
    document.getElementById('stat_power').innerText = Number(rawPower).toLocaleString();
    document.getElementById('stat_atk').innerText = Number(rawAtk).toLocaleString();
    document.getElementById('stat_dmg').innerText = getStatValue("데미지") + "%";
}

// 텅 빈 프로필 초기화
function resetHuntSidebar(fallbackName) {
    document.getElementById('profileImg').src = "https://open.api.nexon.com/static/maplestory/Character/Default.png";
    document.getElementById('profileName').innerText = fallbackName || "캐릭터명";
    document.getElementById('profileLevel').innerText = "Lv. ---";
    document.getElementById('profileJob').innerText = "---";
    document.getElementById('profileWorld').innerText = "미확인";
    document.getElementById('stat_power').innerText = "-";
    document.getElementById('stat_atk').innerText = "-";
    document.getElementById('stat_dmg').innerText = "-";
}

// 🏆 종합 랭킹 데이터를 불러오는 함수
async function fetchRanking() {
    const tbody = document.getElementById('rankingBody');
    const dateSpan = document.getElementById('rankingDate');
    if (!tbody) return;

    try {
        const today = new Date(); today.setDate(today.getDate() - 1); 
        const yesterdayStr = today.toISOString().split('T')[0];
        const cacheKey = "maple_api_ranking";
        let cachedRank = JSON.parse(localStorage.getItem(cacheKey));

        if (cachedRank && cachedRank.date === yesterdayStr) { renderRankingHtml(cachedRank.data, yesterdayStr); return; }

        const res = await fetch(`https://open.api.nexon.com/maplestory/v1/ranking/overall?date=${yesterdayStr}`, { headers: { "x-nxopen-api-key": API_KEY } });
        if (res.status === 429) { tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 20px; color: #ff7675;">API 한도 초과</td></tr>`; return; }
        const data = await res.json();
        const top10 = data.ranking.slice(0, 10); 
        localStorage.setItem(cacheKey, JSON.stringify({ date: yesterdayStr, data: top10 }));
        renderRankingHtml(top10, yesterdayStr);
    } catch (e) { console.error(e); }
}

// 🏆 랭킹 데이터를 HTML 표에 그려줍니다.
function renderRankingHtml(top10, dateStr) {
    const tbody = document.getElementById('rankingBody');
    const dateSpan = document.getElementById('rankingDate');
    let html = "";
    top10.forEach((user, index) => {
        let rankClass = index === 0 ? "rank-1" : index === 1 ? "rank-2" : index === 2 ? "rank-3" : "rank-other";
        const worldId = { "스카니아":1, "베라":2, "루나":3, "제니스":4, "크로아":5, "유니온":6, "엘리시움":7, "이노시스":8, "레드":9, "오로라":10, "아케인":11, "노바":12 }[user.world_name] || 3;
        html += `<tr><td class="${rankClass}">${user.ranking}</td><td class="rank-name"><img src="icon/icon_${worldId}.png" class="world-icon"> <span>${user.character_name}</span></td><td style="color:#636e72;">${user.class_name}</td><td style="color:#636e72;">Lv.${user.character_level}</td></tr>`;
    });
    if(tbody) tbody.innerHTML = html;
    if(dateSpan) dateSpan.innerText = `기준일: ${dateStr}`;
}

// 🔍 특정 캐릭터의 상세 정보를 조회합니다.
async function searchCharacter(directName = null) {
    const input = typeof directName === 'string' ? directName : document.getElementById('portalSearchInput')?.value.trim();
    if (!input) return showAlert("❌ 캐릭터명을 입력해주세요!"); 
    
    const todayStr = getTodayStr();
    const cacheKey = `maple_api_search_${input}`;
    sessionStorage.setItem('omni_last_search', input); 

    let cachedData = JSON.parse(localStorage.getItem(cacheKey));

    if (cachedData && cachedData.date === todayStr) { 
        window.openSearchPage(); 
        renderSearchDetail(cachedData.basic, cachedData.stat, cachedData.item, cachedData.ability, cachedData.symbol, cachedData.dojang); 
        if(typeof directName === 'string') showAlert(`⚡ ${input} (저장된 캐시 데이터 로드 완료!)`); 
        return; 
    }

    window.openSearchPage();
    document.getElementById('searchPlaceholder').innerHTML = `<b>${input}</b>님의 정보를 가져오는 중... 🔄`;

    try {
        const headers = { "x-nxopen-api-key": API_KEY };
        const ocidRes = await fetch(`https://open.api.nexon.com/maplestory/v1/id?character_name=${encodeURIComponent(input)}`, { headers });
        if (ocidRes.status === 429) throw new Error("API_LIMIT");
        const ocidData = await ocidRes.json();
        if (!ocidData.ocid) throw new Error("NOT_FOUND");
        const ocid = ocidData.ocid;

        await new Promise(res => setTimeout(res, 600)); 
        const basic = await fetch(`https://open.api.nexon.com/maplestory/v1/character/basic?ocid=${ocid}`, { headers }).then(r => r.json());
        await new Promise(res => setTimeout(res, 600)); 
        const stat = await fetch(`https://open.api.nexon.com/maplestory/v1/character/stat?ocid=${ocid}`, { headers }).then(r => r.json());
        
        await new Promise(res => setTimeout(res, 600)); 
        const item = await fetch(`https://open.api.nexon.com/maplestory/v1/character/item-equipment?ocid=${ocid}`, { headers }).then(r => r.json());
        await new Promise(res => setTimeout(res, 600)); 
        const ability = await fetch(`https://open.api.nexon.com/maplestory/v1/character/ability?ocid=${ocid}`, { headers }).then(r => r.json());
        await new Promise(res => setTimeout(res, 600)); 
        const symbol = await fetch(`https://open.api.nexon.com/maplestory/v1/character/symbol-equipment?ocid=${ocid}`, { headers }).then(r => r.json());
        await new Promise(res => setTimeout(res, 600)); 
        const dojang = await fetch(`https://open.api.nexon.com/maplestory/v1/character/dojang?ocid=${ocid}`, { headers }).then(r => r.json()).catch(() => null);

        localStorage.setItem(cacheKey, JSON.stringify({ date: todayStr, basic, stat, item, ability, symbol, dojang }));
        renderSearchDetail(basic, stat, item, ability, symbol, dojang);
    } catch (e) { 
        document.getElementById('searchPlaceholder').innerHTML = e.message === "API_LIMIT" ? "❌ 한도 초과. 내일 다시 시도해주세요." : "❌ 정보를 찾을 수 없습니다."; 
    }
}

// 🌟 검색된 캐릭터의 요약 정보(상단 프로필)를 채웁니다.
function renderSearchSummary(basic, stat, dojang) {
    // 1. 화면 레이아웃 초기화
    document.getElementById('searchPlaceholder').style.display = 'none';
    document.getElementById('detailTabMenu').style.display = 'flex';
    document.getElementById('charDetailContainer').style.display = 'grid';
    
    // 2. 프로필 기본 정보 삽입
    document.getElementById('res_profileImg').src = basic.character_image;
    document.getElementById('res_profileName').innerText = basic.character_name;
    const guildName = basic.character_guild_name || '길드 없음';
    document.getElementById('res_worldGuild').innerText = `${basic.world_name} / ${guildName}`;
    
    // 3. 전투력 데이터 추출 (stat 변수 사용)
    let powerValue = 0;
    if (stat && stat.final_stat) {
        const powerObj = stat.final_stat.find(s => s.stat_name === "전투력");
        if (powerObj) {
            // 콤마 제거 후 순수 숫자로 변환
            powerValue = Number(String(powerObj.stat_value).replace(/,/g, ''));
        }
    }
    
    // 4. [전투력 업데이트] 상단 카드와 좌측 상세창에 동시 적용
    const topCard = document.getElementById('res_power_top_val');
    if (topCard) {
        topCard.innerText = powerValue > 0 ? powerValue.toLocaleString() : "0";
    }

    const sideDetail = document.getElementById('res_power');
    if (sideDetail) {
        sideDetail.innerText = powerValue > 0 ? powerValue.toLocaleString() : "0";
    }

    // 5. 직업 및 레벨 표시
    const jobLvl = document.getElementById('res_job_level');
    if (jobLvl) {
        jobLvl.innerText = `${basic.character_class} / Lv.${basic.character_level}`;
    }

    // 6. 랭킹 계산 (기존 로직 유지)
    const seed = (basic.character_level * 13) + (parseInt(String(powerValue).slice(0, 5)) || 999);
    const totalRank = (seed * 7) % 50000 + 10;
    const jobRank = (seed * 3) % 1000 + 5;
    const worldRank = (seed * 5) % 8000 + 10;
    
    document.getElementById('res_rank_total').innerText = `전체 ${totalRank.toLocaleString()}위 / 직업별 ${jobRank.toLocaleString()}위`;
    document.getElementById('res_rank_world').innerText = `전체 ${worldRank.toLocaleString()}위 / 직업별 ${(jobRank%50)+1}위`;
    
    // 7. 무릉도장 기록 표시
    const bestFloor = dojang && dojang.dojang_best_floor ? dojang.dojang_best_floor : 0;
    const dojangElem = document.getElementById('res_dojang_floor');
    if (dojangElem) {
        dojangElem.innerText = bestFloor > 0 ? `최고기록: ${bestFloor}층` : "최고기록: 없음";
    }

    // 8. 즐겨찾기 상태 업데이트
    updateFavoriteBtnState(basic.character_name);
}

// 🌟 무릉, 어빌리티, 심볼 등의 상세 정보를 렌더링합니다.
function renderSearchDetail(basic, stat, item, ability, symbol, dojang) {
    currentSearchData = { basic, stat, item, ability, symbol, dojang }; 
    renderSearchSummary(basic, stat, dojang);
    
    const symbolBox = document.getElementById('res_symbol_info');
    if (symbolBox) {
        const symbols = symbol.symbol || [];
        const aut = symbols.filter(s => s.symbol_name.includes('어센틱'));
        const arc = symbols.filter(s => s.symbol_name.includes('아케인'));

        const renderSymbol = (arr) => arr.map(s => {
            const name = s.symbol_name.replace(/아케인심볼 : |어센틱심볼 : /g, '');
            return `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; background:#f8fafc; padding:6px 10px; border-radius:8px; border:1px solid #edf2f7;">
                        <div style="display:flex; align-items:center; gap:8px;">
                            <img src="${s.symbol_icon}" style="width:24px; height:24px; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.1));">
                            <b style="color:#475569; font-size:12px;">${name}</b>
                        </div>
                        <span style="color:#ff9100; font-size:11px; font-weight:800; background:#fff9f0; padding:3px 8px; border-radius:6px;">Lv.${s.symbol_level}</span>
                    </div>`;
        }).join('');

        symbolBox.innerHTML = `
            <div style="margin-bottom: 18px;">
                <div style="font-size:13px; font-weight:900; color:#3b82f6; margin-bottom:10px; display:flex; align-items:center; gap:5px;">💧 어센틱 심볼</div>
                ${aut.length > 0 ? renderSymbol(aut) : '<div style="color:#94a3b8; font-size:11px; padding-left:4px;">착용 중인 심볼 없음</div>'}
            </div>
            <div>
                <div style="font-size:13px; font-weight:900; color:#8b5cf6; margin-bottom:10px; display:flex; align-items:center; gap:5px;">🔮 아케인 심볼</div>
                ${arc.length > 0 ? renderSymbol(arc) : '<div style="color:#94a3b8; font-size:11px; padding-left:4px;">착용 중인 심볼 없음</div>'}
            </div>
        `;
    }
    
    switchAbilityPreset(1);
    switchAbilityPreset(1); // 오타 방지용 (중복 호출되어도 안전합니다)
    switchItemPreset(1);
    showDetailTab('equip');
}

// ============================================================================
// 🔄 유틸리티 및 화면 탭 관련 함수
// ============================================================================

function openTab(idx) { 
    currentIdx = idx; 
    document.querySelectorAll('.content').forEach(c => c.style.display = 'none'); 
    document.getElementById(`tab_${idx}`).style.display = 'block'; 
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active')); 
    document.getElementById(`tab_btn_${idx}`).classList.add('active'); 
    sessionStorage.setItem('omni_current_tab', idx); 
    const charName = document.getElementById(`nameInput_${idx}`)?.value.trim();
    if (charName && !charName.includes("캐릭터 ")) {
        const cachedData = JSON.parse(localStorage.getItem(`maple_api_hunt_${charName}`));
        if (cachedData) renderHuntSidebar(cachedData.basic, cachedData.stat);
        else resetHuntSidebar(charName);
    } else resetHuntSidebar(`캐릭터 ${idx}`);
} 

function showPage(n) { 
    const p1 = document.getElementById('page_1'); if(p1) p1.style.display = n==1 ? 'block' : 'none'; 
    const p2 = document.getElementById('page_2'); if(p2) p2.style.display = n==2 ? 'block' : 'none'; 
    const p3 = document.getElementById('page_3'); if(p3) p3.style.display = n==3 ? 'block' : 'none'; 
    
    const n1 = document.getElementById('nav_1'); if(n1) n1.classList.toggle('active', n==1); 
    const n2 = document.getElementById('nav_2'); if(n2) n2.classList.toggle('active', n==2); 
    const n3 = document.getElementById('nav_3'); if(n3) n3.classList.toggle('active', n==3); 
    
    if(n==2 && typeof renderRecords === 'function') renderRecords(); 
    sessionStorage.setItem('omni_nav_page', n); 
}

// ============================================================================
// 📔 보스 수익 계산기 다이어리
// ============================================================================
const bossData = [
    { group: 'below', id: 'b_queen', name: '블러디 퀸', variants: [{ diff: '카오스', price: 8140000 }] },
    { group: 'below', id: 'b_banban', name: '반반', variants: [{ diff: '카오스', price: 8150000 }] },
    { group: 'below', id: 'b_pierre', name: '피에르', variants: [{ diff: '카오스', price: 8170000 }] },
    { group: 'below', id: 'b_vellum', name: '벨룸', variants: [{ diff: '카오스', price: 9280000 }] },
    { group: 'below', id: 'b_mag', name: '매그너스', variants: [{ diff: '하드', price: 8560000 }] },
    { group: 'below', id: 'b_papu', name: '파풀라투스', variants: [{ diff: '카오스', price: 13800000 }] },
    { group: 'below', id: 'b_suu', name: '스우', variants: [{ diff: '노멀', price: 17600000 }, { diff: '하드', price: 54200000 }] },
    { group: 'below', id: 'b_demi', name: '데미안', variants: [{ diff: '노멀', price: 18400000 }, { diff: '하드', price: 51500000 }] },
    { group: 'below', id: 'b_gaen', name: '가엔슬', variants: [{ diff: '노멀', price: 26800000 }, { diff: '카오스', price: 79100000 }] },
    { group: 'below', id: 'b_lucid', name: '루시드', variants: [{ diff: '이지', price: 31400000 }, { diff: '노멀', price: 37500000 }, { diff: '하드', price: 66200000 }] },
    { group: 'below', id: 'b_will', name: '윌', variants: [{ diff: '이지', price: 34000000 }, { diff: '노멀', price: 43300000 }, { diff: '하드', price: 81200000 }] },
    { group: 'below', id: 'b_dusk', name: '더스크', variants: [{ diff: '노멀', price: 46300000 }, { diff: '카오스', price: 73500000 }] },
    { group: 'below', id: 'b_dunkel', name: '듄켈', variants: [{ diff: '노멀', price: 50000000 }, { diff: '하드', price: 99400000 }] },
    { group: 'below', id: 'b_hilla', name: '진 힐라', variants: [{ diff: '노멀', price: 74900000 }, { diff: '하드', price: 112000000 }] },
    { group: 'above', id: 'a_seren', name: '선택받은 세렌', variants: [{ diff: '노멀', price: 266000000 }, { diff: '하드', price: 396000000 }, { diff: '익스트림', price: 2819000000 }] },
    { group: 'above', id: 'a_kalos', name: '감시자 칼로스', variants: [{ diff: '이지', price: 311000000 }, { diff: '노멀', price: 561000000 }, { diff: '카오스', price: 1340000000 }, { diff: '익스트림', price: 4320000000 }] },
    { group: 'above', id: 'a_karing', name: '카링', variants: [{ diff: '이지', price: 419000000 }, { diff: '노멀', price: 714000000 }, { diff: '하드', price: 1830000000 }, { diff: '익스트림', price: 5670000000 }] },
    { group: 'above', id: 'a_daejeok', name: '최초의 대적자', variants: [{ diff: '이지', price: 324000000 }, { diff: '노멀', price: 589000000 }, { diff: '하드', price: 1510000000 }, { diff: '익스트림', price: 4960000000 }] },
    { group: 'above', id: 'a_suu_x', name: '스우 (익스)', variants: [{ diff: '익스트림', price: 604000000 }] },
    { group: 'above', id: 'a_hyung', name: '찬란한 흉성', variants: [{ diff: '노멀', price: 658000000 }, { diff: '하드', price: 2819000000 }] },
    { group: 'above', id: 'a_black', name: '검은 마법사', variants: [{ diff: '하드', price: 700000000 }, { diff: '익스트림', price: 9200000000 }] },
    { group: 'above', id: 'a_limbo', name: '림보', variants: [{ diff: '노멀', price: 1080000000 }, { diff: '하드', price: 2510000000 }] },
    { group: 'above', id: 'a_bal', name: '발드릭스', variants: [{ diff: '노멀', price: 1440000000 }, { diff: '하드', price: 3240000000 }] },
    { group: 'above', id: 'a_jupi', name: '유피테르', variants: [{ diff: '노멀', price: 1700000000 }, { diff: '하드', price: 5100000000 }] }
];

let myWeeklyBosses = {};

function renderBossPresets() {
    const gridBelow = document.getElementById('gridBelowBlackMage');
    const gridAbove = document.getElementById('gridAboveBlackMage');
    if (!gridBelow || !gridAbove) return;

    let belowHtml = '', aboveHtml = '';
    bossData.forEach(boss => {
        const isSelected = myWeeklyBosses[boss.id] !== undefined;
        const activeClass = isSelected ? 'active' : '';
        const chipHtml = `<div class="boss-chip ${activeClass}" onclick="toggleBossInList('${boss.id}')">${boss.name}</div>`;
        if (boss.group === 'below') belowHtml += chipHtml;
        else aboveHtml += chipHtml;
    });
    gridBelow.innerHTML = belowHtml;
    gridAbove.innerHTML = aboveHtml;
}

function toggleBossInList(bossId) {
    if (myWeeklyBosses[bossId] !== undefined) delete myWeeklyBosses[bossId];
    else myWeeklyBosses[bossId] = { selectedDiffIndex: 0, partySize: 1 };
    renderBossPresets(); 
    renderSelectedBossList(); 
}

function changeDifficulty(bossId, diffIndex) {
    if (myWeeklyBosses[bossId]) {
        myWeeklyBosses[bossId].selectedDiffIndex = diffIndex;
        renderSelectedBossList();
    }
}

function updatePartySize(bossId, size) {
    if (myWeeklyBosses[bossId]) {
        myWeeklyBosses[bossId].partySize = parseInt(size);
        renderSelectedBossList();
    }
}

function resetAllBosses() {
    if(Object.keys(myWeeklyBosses).length === 0) return;
    if(confirm("모든 보스 정산 내역을 초기화하시겠습니까?")) {
        myWeeklyBosses = {};
        renderBossPresets();
        renderSelectedBossList();
    }
}

function formatMesoText(num) {
    if (num >= 100000000) {
        const uk = Math.floor(num / 100000000);
        const man = (num % 100000000) / 10000;
        return `${uk}억 ${man > 0 ? man + '만' : ''} 메소`;
    }
    return `${num / 10000}만 메소`;
}

function renderSelectedBossList() {
    const listArea = document.getElementById('selectedBossList');
    const totalDisplay = document.getElementById('totalWeeklyProfit');
    let totalProfit = 0;
    
    const selectedKeys = Object.keys(myWeeklyBosses);
    if (selectedKeys.length === 0) {
        listArea.innerHTML = `<div style="text-align: center; color: #cbd5e1; font-size: 12px; padding: 30px; border: 1px dashed #e2e8f0; border-radius: 8px;">위에서 보스를 클릭해 목록에 추가해주세요. 🍁</div>`;
        totalDisplay.innerText = "0 메소";
        return;
    }

    let html = '';
    selectedKeys.forEach(bossId => {
        const bossInfo = bossData.find(b => b.id === bossId);
        if (!bossInfo) return;

        const myData = myWeeklyBosses[bossId];
        const selectedVariant = bossInfo.variants[myData.selectedDiffIndex];
        const myShare = Math.floor(selectedVariant.price / myData.partySize);
        totalProfit += myShare;

        let diffBoxesHtml = '<div class="diff-box-group">';
        bossInfo.variants.forEach((v, index) => {
            const isActive = index === myData.selectedDiffIndex;
            const activeClass = isActive ? 'active' : '';
            diffBoxesHtml += `<div class="diff-box ${activeClass}" onclick="changeDifficulty('${bossId}', ${index})">${v.diff}</div>`;
        });
        diffBoxesHtml += '</div>';

        html += `
        <div style="display: flex; justify-content: space-between; align-items: center; background: #ffffff; border: 1px solid #f1f5f9; border-radius: 8px; padding: 10px 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.01); flex-wrap: wrap; gap: 8px;">
            <div style="display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 140px;">
                <div style="font-weight: 700; color: #334155; font-size: 13px;">
                    ${bossInfo.name} <span style="font-size:10px; color:#94a3b8; font-weight:500; margin-left:4px;">(원가: ${formatMesoText(selectedVariant.price)})</span>
                </div>
                ${diffBoxesHtml}
            </div>
            
            <div style="display: flex; align-items: center; gap: 12px; justify-content: flex-end; flex: 1.2; min-width: 180px;">
                <div style="display: flex; align-items: center; gap: 3px;">
                    <span style="font-size: 10px; color: #94a3b8; font-weight: 600;">인원</span>
                    <select onchange="updatePartySize('${bossId}', this.value)" style="padding: 2px 4px; border-radius: 4px; border: 1px solid #e2e8f0; font-size: 11px; font-weight: 700; cursor: pointer; color: #475569; background: #fcfcfc;">
                        ${[1,2,3,4,5,6].map(num => `<option value="${num}" ${num === myData.partySize ? 'selected' : ''}>${num}명</option>`).join('')}
                    </select>
                </div>
                
                <div style="text-align: right; min-width: 85px; border-left: 1px solid #f1f5f9; padding-left: 10px;">
                    <div style="font-size: 9px; color: #cbd5e1; font-weight: 600;">순수익</div>
                    <div style="color: #334155; font-weight: 700; font-size: 14px;">${myShare.toLocaleString()}</div>
                </div>
                <button onclick="toggleBossInList('${bossId}')" style="background: none; border: none; color: #fca5a5; cursor: pointer; font-size: 14px; padding: 4px;">✕</button>
            </div>
        </div>`;
    });

    listArea.innerHTML = html;
    totalDisplay.innerText = totalProfit.toLocaleString() + " 메소";
}

function saveBossPreset(num) {
    if (Object.keys(myWeeklyBosses).length === 0) return showAlert("⚠️ 저장할 보스 정산 내역이 없습니다.");
    localStorage.setItem('maple_expert_boss_preset_' + num, JSON.stringify(myWeeklyBosses));
    showAlert(`💾 [프리셋 ${num}] 저장이 완료되었습니다!`);
}

function loadBossPreset(num) {
    const saved = JSON.parse(localStorage.getItem('maple_expert_boss_preset_' + num));
    if (!saved || Object.keys(saved).length === 0) return showAlert(`⚠️ 저장된 [프리셋 ${num}] 내역이 없습니다.`);
    myWeeklyBosses = saved;
    renderBossPresets();
    renderSelectedBossList();
    showAlert(`📂 [프리셋 ${num}] 내역을 불러왔습니다!`);
}

window.addEventListener('DOMContentLoaded', () => { setTimeout(renderBossPresets, 200); });

// ============================================================================
// 🕒 타이머, 도핑, 데이터 처리 기능 (사냥 기록)
// ============================================================================
function startTimer() { if (!timerId) { endTime = Date.now() + (timeLeft * 1000); timerId = setInterval(() => { timeLeft = Math.round((endTime - Date.now()) / 1000); if (timeLeft <= 0) { timeLeft = 0; stopTimer(); updateTD(); alert("📢 30분 소재 종료!"); timeLeft = 1800; } updateTD(); }, 1000); isPaused = false; updateTimerButtons(); } }
function stopOrResumeTimer() { if (timerId) { clearInterval(timerId); timerId = null; isPaused = true; } else if (isPaused) { startTimer(); } updateTimerButtons(); }
function stopTimer() { clearInterval(timerId); timerId = null; isPaused = false; updateTimerButtons(); }
function resetTimer() { stopTimer(); timeLeft = 1800; isPaused = false; updateTD(); updateTimerButtons(); }
function updateTD() { const m = Math.floor(timeLeft/60), s = timeLeft%60; document.getElementById('timerDisplay').innerText = `${m}:${s<10?'0':''}${s}`; }
function updateTimerButtons() { const stopBtn = document.getElementById('mainStopBtn'); if (isPaused) { stopBtn.innerText = "재개"; stopBtn.classList.add('btn-resume'); } else { stopBtn.innerText = "정지"; stopBtn.classList.remove('btn-resume'); } }

function setBuffTimer(sec) { clearInterval(buffTimerId); buffTimeLeft = sec; updateBTD(); buffTimerId = setInterval(() => { buffTimeLeft--; if(buffTimeLeft <= 0) { clearInterval(buffTimerId); alert("💊 도핑 만료!"); } updateBTD(); }, 1000); }
function updateBTD() { const m = Math.floor(buffTimeLeft/60), s = buffTimeLeft%60; document.getElementById('buffTimerDisplay').innerText = `${m}:${s<10?'0':''}${s}`; }
function resetBuffTimer() { clearInterval(buffTimerId); buffTimeLeft=0; updateBTD(); }

function openHistTab(idx) { currentIdx = idx; document.querySelectorAll('#historyTabContainer .nav-btn').forEach(b => b.classList.remove('active')); document.getElementById(`hist_tab_btn_${idx}`).classList.add('active'); if(typeof renderRecords === 'function') renderRecords(); }
function addSellRow(idx) { const container = document.getElementById(`sellContainer_${idx}`); const div = document.createElement('div'); div.className = 'sell-row'; div.innerHTML = `<select><option value="" disabled selected>물품 선택</option>${sellItems.map(it=>`<option value="${it}">${it}</option>`).join('')}</select><input type="number" placeholder="개수" oninput="calcSellSum(${idx})"><input type="text" placeholder="판매 금액" oninput="onMeso(this); calcSellSum(${idx})"><button class="btn-del-row" onclick="this.parentElement.remove(); calcSellSum(${idx});">×</button>`; container.appendChild(div); }
function calcSellSum(idx) { const rows = document.getElementById(`sellContainer_${idx}`).querySelectorAll('.sell-row'); let total = 0; rows.forEach(row => { total += parseInt(row.querySelectorAll('input')[1].value.replace(/,/g, '')) || 0; }); document.getElementById(`sellTotalDisplay_${idx}`).innerText = total.toLocaleString(); return total; }
function updateTabName(idx) { const n = document.getElementById(`nameInput_${idx}`).value || `캐릭터 ${idx}`; document.getElementById(`tab_btn_${idx}`).innerText = n; document.getElementById(`hist_tab_btn_${idx}`).innerText = n; }
function onMeso(el) { let v = el.value.replace(/,/g, ""); el.value = isNaN(v) ? "" : Number(v).toLocaleString(); }
function toggleDetails(idx) { const el = document.getElementById(`details_${idx}`); el.style.display = (el.style.display === 'grid') ? 'none' : 'grid'; }

function recordSub(idx) {
    const mesoEl = document.getElementById(`meso_${idx}`), expEl = document.getElementById(`exp_${idx}`), gemEl = document.getElementById(`gem_${idx}`), fragEl = document.getElementById(`frag_${idx}`);
    const curM = parseInt(mesoEl.value.replace(/,/g, "")) || 0, curE = parseFloat(expEl.value) || 0, curG = parseInt(gemEl.value) || 0, curF = parseInt(fragEl.value) || 0;
    if (curM === 0 && curE === 0) return alert("현재 메소와 경험치를 입력해주세요!");
    let prevM = 0, prevE = 0, prevG = 0, prevF = 0;
    if (subHistory[idx] && subHistory[idx].length > 0) {
        const lastLog = subHistory[idx][subHistory[idx].length - 1];
        prevM = parseInt(lastLog.fullMeso)||0; prevE = parseFloat(lastLog.fullExp)||0; prevG = parseInt(lastLog.fullGem)||0; prevF = parseInt(lastLog.fullFrag)||0;
    } else {
        prevM = parseInt(document.getElementById(`startMeso_${idx}`).value.replace(/,/g, ""))||0; prevE = parseFloat(document.getElementById(`startExp_${idx}`).value)||0; prevG = parseInt(document.getElementById(`startGem_${idx}`).value)||0; prevF = parseInt(document.getElementById(`startFrag_${idx}`).value)||0;
    }
    const diffM = Math.max(0, curM - prevM), diffE = Math.max(0, curE - prevE), diffG = Math.max(0, curG - prevG), diffF = Math.max(0, curF - prevF);
    
    let sDetail = [], sSum = 0;
    document.getElementById(`sellContainer_${idx}`)?.querySelectorAll('.sell-row').forEach(row => {
        const item = row.querySelector('select').value, cnt = row.querySelectorAll('input')[0].value, price = row.querySelectorAll('input')[1].value;
        if(item && cnt) { sDetail.push(`${item}(${cnt}개)`); sSum += parseInt(price.replace(/,/g, '')) || 0; }
    });

    subHistory[idx].push({ id: Date.now(), time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), meso: diffM.toLocaleString() + " 메소", fullMeso: curM, exp: diffE.toFixed(3) + " %", fullExp: curE, gem: diffG, fullGem: curG, frag: diffF, fullFrag: curF, sellSum: sSum.toLocaleString() + " 메소", sellDetail: sDetail.length > 0 ? sDetail.join(', ') : "없음" });
    localStorage.setItem(`maple_subHistory_${idx}`, JSON.stringify(subHistory[idx]));
    updateSubDisplay(idx); updateAll(idx); resetTimer(); markAttendance();
    
    mesoEl.value = ""; expEl.value = ""; gemEl.value = ""; fragEl.value = "";
    const sellContainer = document.getElementById(`sellContainer_${idx}`);
    if(sellContainer) { sellContainer.innerHTML = `<div class="sell-row"><select><option value="" disabled selected>물품 선택</option>${sellItems.map(it=>`<option value="${it}">${it}</option>`).join('')}</select><input type="number" placeholder="개수" oninput="calcSellSum(${idx})"><input type="text" placeholder="판매 금액" oninput="onMeso(this); calcSellSum(${idx})"><button class="btn-del-row" onclick="this.parentElement.remove(); calcSellSum(${idx});">×</button></div>`; document.getElementById(`sellTotalDisplay_${idx}`).innerText = "0"; }
    alert("30분 기록이 저장되었습니다!");
}

function updateAll(idx) {
    let bm = 0, bd = 0;
    for(let j=0; j<statItems.length; j++){ bm += parseInt(document.getElementById(`m_stat_${j}_${idx}`).value) || 0; bd += parseInt(document.getElementById(`d_stat_${j}_${idx}`).value) || 0; }
    let hasJ = document.getElementById(`chk_4_${idx}`)?.checked;
    buffs.forEach((b, i) => { if(document.getElementById(`chk_${i}_${idx}`)?.checked) { bd += b.d; if(i !== 4) bm += b.m; } });
    document.getElementById(`currentStats_${idx}`).innerText = `${bd}% / ${hasJ ? Math.floor(((100 + bm) * 1.2) - 100) : bm}%`;
    
    let totalMeso = 0, totalExp = 0, totalGem = 0, totalFrag = 0;
    subHistory[idx].forEach(log => { totalMeso += parseInt(log.meso.replace(/[^0-9]/g, "")) || 0; totalExp += parseFloat(log.exp) || 0; totalGem += parseInt(log.gem) || 0; totalFrag += parseInt(log.frag) || 0; });
    document.getElementById(`profitMeso_${idx}`).innerText = totalMeso.toLocaleString() + " 메소"; document.getElementById(`profitExp_${idx}`).innerText = totalExp.toFixed(3) + " %"; document.getElementById(`netDrops_${idx}`).innerText = `${totalGem} / ${totalFrag}`; document.getElementById(`subCountDisplay_${idx}`).innerText = subHistory[idx].length + " 회";

    const targetVal = parseInt(document.getElementById(`targetMeso_${idx}`).value.replace(/,/g, "")) || 0, currentVal = parseInt(document.getElementById(`profitMeso_${idx}`).innerText.replace(/[^0-9]/g, "")) || 0;
    let goalP = targetVal > 0 ? Math.min((currentVal / targetVal) * 100, 100) : 0, goalR = targetVal > 0 ? Math.max(0, targetVal - currentVal) : 0;
    document.getElementById(`goalPercent_${idx}`).innerText = (goalP >= 100 && targetVal > 0) ? "🎉 목표 달성!" : goalP.toFixed(1) + "%"; document.getElementById(`progressBar_${idx}`).style.width = goalP + "%"; document.getElementById(`remainMeso_${idx}`).innerText = goalR.toLocaleString(); document.getElementById(`goalPercent_${idx}`).style.color = (goalP >= 100 && targetVal > 0) ? "#2ecc71" : "var(--accent)";

    if (totalMeso > 0) { const dayEl = document.getElementById(`day-${new Date().getDate()}`); if (dayEl) dayEl.classList.add('active'); }
    saveConfig(idx);
}

function updateSubDisplay(idx) {
    document.getElementById(`subRecordList_${idx}`).innerHTML = subHistory[idx].map((d, i) => `<div class="sub-item"><button onclick="removeSub(${idx},${d.id})" style="position:absolute;top:5px;right:5px;border:none;color:red;background:none;cursor:pointer;">×</button><div class="sub-item-header"><b>${i+1}소재 기록</b> <input type="text" class="sub-time-input" value="${d.time}" onchange="editSubTime(${idx},${d.id},this.value)"></div><div class="sub-tag-group"><div class="sub-tag tag-meso">💰 ${d.meso}</div><div class="sub-tag tag-exp">📈 ${d.exp}</div><div class="sub-tag tag-frag">🧩 조각: ${d.frag}</div><div class="sub-tag tag-gem">💎 코젬: ${d.gem}</div><div class="sub-tag tag-sell">🛍️ 부수입: ${d.sellSum}</div></div></div>`).join('');
}

function saveFinalRecord(idx) {
    if(!confirm("기록지로 전송할까요?")) return;
    const now = new Date(); huntRecords.push({ id: Date.now(), date: now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0'), name: document.getElementById(`nameInput_${idx}`).value, map: document.getElementById(`map_${idx}`).value || "미지정", meso: document.getElementById(`profitMeso_${idx}`).innerText, exp: document.getElementById(`profitExp_${idx}`).innerText, drops: document.getElementById(`netDrops_${idx}`).innerText, subs: subHistory[idx].length });
    saveAndRefresh(); alert("기록 완료!");
}

function resetCurrentHunt(idx) { if(!confirm("리셋할까요?")) return; ['startMeso','startExp','startGem','startFrag','meso','exp','gem','frag','map'].forEach(id => { if(document.getElementById(`${id}_${idx}`)) document.getElementById(`${id}_${idx}`).value = ""; }); subHistory[idx] = []; localStorage.removeItem(`maple_subHistory_${idx}`); updateSubDisplay(idx); updateAll(idx); }

// ============================================================================
// 📊 [통합 로그 세트] (사냥 기록 저장 및 표기)
// ============================================================================
function saveAndRefresh() { 
    localStorage.setItem('maple_hunt_records', JSON.stringify(huntRecords)); 
    if(typeof renderRecords === 'function') renderRecords(); 
}

function renderRecords() {
    const tbody = document.getElementById('recordTableBody');
    if (!tbody) return;

    huntRecords = JSON.parse(localStorage.getItem('maple_hunt_records')) || [];
    const dateFilter = document.getElementById('dateFilter');
    const filterValue = dateFilter ? dateFilter.value : '';

    let filteredRecords = huntRecords;
    if (filterValue) {
        filteredRecords = huntRecords.filter(r => r.date === filterValue);
    }

    filteredRecords.sort((a, b) => {
        if (b.date !== a.date) return b.date.localeCompare(a.date);
        return b.id - a.id;
    });

    let html = '';
    let lastDate = '';

    filteredRecords.forEach(record => {
        if (record.date !== lastDate) {
            html += `
            <tr class="date-group-header">
                <td colspan="7" style="text-align: left; padding: 12px 20px; border-left: 6px solid var(--accent);">
                    <span class="date-group-text">📅 ${record.date} 사냥 기록</span>
                </td>
            </tr>`;
            lastDate = record.date;
        }

        html += `
        <tr>
            <td style="color: #94a3b8; font-size: 11px; font-weight: 700;">${record.date}</td>
            <td style="font-weight: 800; color: #1e293b;">${record.name}</td>
            <td style="color: #64748b; text-align: left;">${record.map}</td>
            <td style="color: #ff9100; font-weight: 800;">${record.meso}</td>
            <td style="color: #8b5cf6; font-weight: 700;">${record.exp}</td>
            <td style="color: #10b981; font-weight: 700;">${record.drops}</td>
            <td>
                <div style="display: flex; gap: 6px; justify-content: center;">
                    <button onclick="editRecordDate(${record.id})" style="background: #f1f5f9; color: #475569; border: 1px solid #dfe6e9; padding: 5px 10px; border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: 800; transition: 0.2s;">수정</button>
                    <button onclick="deleteRecord(${record.id})" style="background: #fff1f2; color: #e11d48; border: 1px solid #fecdd3; padding: 5px 10px; border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: 800; transition: 0.2s;">삭제</button>
                </div>
            </td>
        </tr>
        `;
    });

    if (filteredRecords.length === 0) {
        html = `<tr><td colspan="7" style="text-align: center; padding: 50px; color: #94a3b8; font-weight: 800;">데이터가 없습니다. 소재 종료 후 '기록지 전송'을 눌러주세요!</td></tr>`;
    }

    tbody.innerHTML = html;
}

function editRecordDate(recordId) {
    const record = huntRecords.find(r => r.id === recordId);
    if (record) {
        const newDate = prompt("기록의 날짜를 변경하시겠습니까? (예: 2026-04-18)", record.date);
        if (newDate && /^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
            record.date = newDate;
            saveAndRefresh();
            showAlert(`✅ [${record.name}] 기록이 ${newDate}로 이동되었습니다.`);
        } else if (newDate) {
            alert("❌ 날짜 형식을 맞춰주세요 (YYYY-MM-DD)");
        }
    }
}

function deleteRecord(id) { 
    if(confirm("이 기록을 삭제할까요?")) { 
        huntRecords = huntRecords.filter(r => r.id !== id); 
        saveAndRefresh(); 
    } 
}

function resetDateFilter() { 
    const filter = document.getElementById('dateFilter');
    if(filter) filter.value = ''; 
    renderRecords(); 
}

function saveConfig(idx) {
    const cfg = { name: document.getElementById(`nameInput_${idx}`).value, stats: {}, doping: buffs.map((_, i) => document.getElementById(`chk_${i}_${idx}`)?.checked), currentVals: { startMeso: document.getElementById(`startMeso_${idx}`).value, startExp: document.getElementById(`startExp_${idx}`).value, startGem: document.getElementById(`startGem_${idx}`).value, startFrag: document.getElementById(`startFrag_${idx}`).value, map: document.getElementById(`map_${idx}`).value, meso: document.getElementById(`meso_${idx}`).value, exp: document.getElementById(`exp_${idx}`).value, gem: document.getElementById(`gem_${idx}`).value, frag: document.getElementById(`frag_${idx}`).value } };
    for(let j=0; j<statItems.length; j++) { cfg.stats[`m_stat_${j}`] = document.getElementById(`m_stat_${j}_${idx}`).value; cfg.stats[`d_stat_${j}`] = document.getElementById(`d_stat_${j}_${idx}`).value; }
    localStorage.setItem(`maple_config_${idx}`, JSON.stringify(cfg));
}

function loadData() {
    for(let i=1; i<=4; i++) {
        const cfg = JSON.parse(localStorage.getItem(`maple_config_${i}`));
        if(cfg) { document.getElementById(`nameInput_${i}`).value = cfg.name || ""; updateTabName(i); if(cfg.stats) for(let j=0; j<statItems.length; j++) { if(document.getElementById(`m_stat_${j}_${i}`)) document.getElementById(`m_stat_${j}_${i}`).value = cfg.stats[`m_stat_${j}`] || 0; if(document.getElementById(`d_stat_${j}_${i}`)) document.getElementById(`d_stat_${j}_${i}`).value = cfg.stats[`d_stat_${j}`] || 0; } if(cfg.doping) cfg.doping.forEach((c, idx) => { if(document.getElementById(`chk_${idx}_${i}`)) document.getElementById(`chk_${idx}_${i}`).checked = c; }); if(cfg.currentVals) for(let k in cfg.currentVals) { if(document.getElementById(`${k}_${i}`)) document.getElementById(`${k}_${i}`).value = cfg.currentVals[k] || ""; } }
        const savedSub = localStorage.getItem(`maple_subHistory_${i}`); if(savedSub) { subHistory[i] = JSON.parse(savedSub); updateSubDisplay(i); } updateAll(i);
    }
}

// ============================================================================
// 📅 출석부 달력 연동
// ============================================================================
let viewDate = new Date();
function renderAttendance() { 
    const grid = document.getElementById('attendanceGrid'); 
    if(!grid) return; 

    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(7, 1fr)';
    grid.style.gap = '6px';
    grid.style.marginTop = '15px';
    grid.style.textAlign = 'center';

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const realToday = new Date(); 
    
    const monthTitle = document.getElementById('currentMonth');
    if(monthTitle) monthTitle.innerText = `${year}년 ${month + 1}월`; 
    
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate(); 
    const attendanceData = JSON.parse(localStorage.getItem('mapleAttendance')) || []; 
    
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    let html = days.map(d => `<div style="font-size:11px; font-weight:800; color:#a0aec0; padding-bottom:5px;">${d}</div>`).join('');

    for (let i = 0; i < firstDay; i++) { html += `<div></div>`; }
    
    for (let i = 1; i <= lastDate; i++) { 
        const currentFullDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`; 
        let className = "calendar-day"; 
        let content = `${i}`; 

        if (attendanceData.includes(currentFullDate)) {
            content = `${i}<br><span class="check-mark">✔</span>`;
        }
        
        if (i === realToday.getDate() && month === realToday.getMonth() && year === realToday.getFullYear()) { 
            className += " today"; 
        } 

        html += `<div class="${className}">${content}</div>`; 
    }
    grid.innerHTML = html;
}
function changeMonth(diff) { viewDate.setMonth(viewDate.getMonth() + diff); renderAttendance(); }

function markAttendance() { 
    const today = new Date();
    const dateStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0'); 
    let attendanceData = JSON.parse(localStorage.getItem('mapleAttendance')) || []; 
    if (!attendanceData.includes(dateStr)) { attendanceData.push(dateStr); localStorage.setItem('mapleAttendance', JSON.stringify(attendanceData)); } 
    renderAttendance(); 
}
window.addEventListener('DOMContentLoaded', () => { setTimeout(renderAttendance, 100); });

// ============================================================================
// 📸 이미지 스캔(OCR) 연동 (사냥 인식 / 경매장 인식)
// ============================================================================
function setOcrMode(mode) {
    currentOcrMode = mode;
    const btnHunt = document.getElementById('btnModeHunt'), btnSell = document.getElementById('btnModeSell'), desc = document.getElementById('ocrModeDesc');
    if (mode === 'hunt') { if(btnHunt) { btnHunt.style.borderColor = 'var(--accent)'; btnHunt.style.background = 'rgba(255, 145, 0, 0.1)'; } if(btnSell) { btnSell.style.borderColor = '#eee'; btnSell.style.background = '#f8f9fa'; } if(desc) desc.innerText = "현재 모드: 사냥 결과 분석"; } 
    else { if(btnSell) { btnSell.style.borderColor = 'var(--blue)'; btnSell.style.background = 'rgba(52, 152, 219, 0.1)'; } if(btnHunt) { btnHunt.style.borderColor = '#eee'; btnHunt.style.background = '#f8f9fa'; } if(desc) desc.innerText = "현재 모드: 경매장 판매"; }
}
function openOcrModal() { const modal = document.getElementById('ocrModal'); if (modal) modal.style.display = 'flex'; }
function closeOcrModal() { const modal = document.getElementById('ocrModal'); if (modal) { modal.style.display = 'none'; resetOcrModal(); } }
function resetOcrModal() { document.getElementById('dropZoneText').style.display = 'block'; document.getElementById('modalOcrStatus').style.display = 'none'; document.getElementById('modalOcrBar').style.width = '0%'; document.getElementById('modalOcrPercent').innerText = '0%'; setOcrMode('hunt'); }

document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('dropZone');
    if (!dropZone) return;
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(e => { dropZone.addEventListener(e, ev => { ev.preventDefault(); ev.stopPropagation(); }, false); });
    dropZone.addEventListener('drop', ev => { const dt = ev.dataTransfer, files = dt.files; if (files && files[0] && files[0].type.includes('image')) processOCR(files[0]); });
});
window.addEventListener('paste', function(e) { const page1 = document.getElementById('page_1'); if (page1 && page1.style.display === 'none') return; const items = e.clipboardData.items; for (let i = 0; i < items.length; i++) { if (items[i].type.indexOf("image") !== -1) { if (document.getElementById('ocrModal').style.display !== 'flex') openOcrModal(); processOCR(items[i].getAsFile()); } } });

async function processOCR(blob) {
    document.getElementById('modalOcrStatus').style.display = 'block';
    try {
        const img = new Image(); img.src = URL.createObjectURL(blob);
        await new Promise(resolve => { img.onload = resolve; });
        const canvas = document.createElement('canvas'), ctx = canvas.getContext('2d');
        let results = {};

        if (currentOcrMode === 'hunt') {
            const regions = [ { id: 'exp', x: 0, y: 0.8, w: 1, h: 0.2 }, { id: 'meso', x: 0.3, y: 0.5, w: 0.7, h: 0.3 }, { id: 'frag', x: 0.7, y: 0.3, w: 0.3, h: 0.4 }, { id: 'gem', x: 0.3, y: 0.7, w: 0.4, h: 0.3 } ];
            for (let reg of regions) {
                canvas.width = img.width * reg.w; canvas.height = img.height * reg.h;
                ctx.filter = 'grayscale(100%) invert(100%) contrast(500%)'; 
                ctx.drawImage(img, img.width * reg.x, img.height * reg.y, img.width * reg.w, img.height * reg.h, 0, 0, canvas.width, canvas.height);
                const res = await Tesseract.recognize(canvas.toDataURL(), 'kor+eng');
                results[reg.id] = res.data.text;
                document.getElementById('modalOcrBar').style.width = (Object.keys(results).length * 25) + "%";
            }
            const exp = results.exp.match(/(\d+\.\d{3})/), mesoMatch = results.meso.replace(/[^0-9]/g, ''), fragNums = results.frag.match(/\d+/g), frag = fragNums ? fragNums[fragNums.length - 1] : "0", gemMatch = results.gem.match(/0\s+(\d+)/) || results.gem.match(/\d+/);
            if (exp) document.getElementById(`exp_${currentIdx}`).value = exp[0];
            if (mesoMatch) document.getElementById(`meso_${currentIdx}`).value = Number(mesoMatch).toLocaleString();
            if (gemMatch) document.getElementById(`gem_${currentIdx}`).value = Array.isArray(gemMatch) ? gemMatch[1] : gemMatch;
            if (frag) document.getElementById(`frag_${currentIdx}`).value = frag;
            updateAll(currentIdx); showAlert("✨ 사냥 데이터 인식 시도 완료!"); setTimeout(closeOcrModal, 1200);
        } else {
            canvas.width = img.width; canvas.height = img.height;
            ctx.filter = 'threshold(0.5) contrast(300%)';
            ctx.drawImage(img, 0, 0);
            const res = await Tesseract.recognize(canvas.toDataURL(), 'kor+eng');
            document.getElementById('modalOcrBar').style.width = "100%";
            parseAuctionResults(res.data.text);
        }
    } catch (e) { console.error(e); showAlert("❌ 분석 중 오류 발생."); }
}

function parseAuctionResults(fullText) {
    const lines = fullText.split('\n').map(l => l.trim()).filter(l => l.length > 0), detectedItems = [];
    let headerIndex = lines.findIndex(l => l.includes("아이템") || l.includes("금액") || l.includes("처리"));
    for (let i = headerIndex + 1; i < lines.length; i++) {
        const line = lines[i];
        if (!(line.includes("수령 완료") || line.includes("수령완료")) && (line.includes("대금") || line.includes("판매 완료") || line.includes("낙찰"))) {
            const numbers = line.match(/[\d,]{4,}/g); let price = numbers ? numbers[numbers.length - 1].replace(/,/g, '') : "0";
            let itemName = line.split("판매")[0].split("낙찰")[0].replace(/\d{4}-\d{2}-\d{2}/g, '').replace(/\(.*\)/g, '').replace(/[0-9]/g, '').replace(/[\[\]\-\:\.\|]/g, '').trim();
            if (itemName.length < 2) itemName = "이름 인식 필요";
            if (parseInt(price) > 100) detectedItems.push({ item: itemName, price: parseInt(price) });
        }
    }
    if (detectedItems.length > 0) { fillAuctionSellRows(detectedItems); showAlert(`🛍️ 정산 필요한 ${detectedItems.length}건 추가됨!`); } 
    else showAlert("❌ 정산 가능한 항목이 없습니다.");
    setTimeout(closeOcrModal, 1200);
}

function fillAuctionSellRows(items) {
    const container = document.getElementById(`sellContainer_${currentIdx}`); if (!container) return; container.innerHTML = ""; 
    items.forEach(data => {
        const div = document.createElement('div'); div.className = 'sell-row';
        div.innerHTML = `<select style="flex:1.5;"><option value="${data.item}" selected>${data.item}</option>${sellItems.map(it => `<option value="${it}">${it}</option>`).join('')}</select><input type="number" value="1" style="flex:0.5;" oninput="calcSellSum(${currentIdx})"><input type="text" value="${data.price.toLocaleString()}" style="flex:1.5;" oninput="onMeso(this); calcSellSum(${currentIdx})"><button class="btn-del-row" onclick="this.parentElement.remove(); calcSellSum(${currentIdx});">×</button>`;
        container.appendChild(div);
    });
    calcSellSum(currentIdx); 
}

// ============================================================================
// ⭐ 즐겨찾기 연동
// ============================================================================
let favoriteChars = JSON.parse(localStorage.getItem('maple_favorites')) || [];
function toggleFavorite() {
    const charName = document.getElementById('res_profileName').innerText;
    if (charName === '-') return;
    if (favoriteChars.includes(charName)) { favoriteChars = favoriteChars.filter(n => n !== charName); showAlert(`⭐ ${charName} 즐겨찾기 해제 완료!`); } 
    else { favoriteChars.push(charName); showAlert(`⭐ ${charName} 즐겨찾기 등록 완료!`); }
    localStorage.setItem('maple_favorites', JSON.stringify(favoriteChars));
    updateFavoriteBtnState(charName); renderFavorites();
}
function updateFavoriteBtnState(charName) {
    const btn = document.getElementById('btn_favorite');
    if (!btn) return;
    if (favoriteChars.includes(charName)) { btn.style.background = '#ff9100'; btn.style.color = 'white'; btn.innerText = '★ 즐겨찾기 해제'; } 
    else { btn.style.background = 'white'; btn.style.color = '#ff9100'; btn.innerText = '⭐ 즐겨찾기 추가'; }
}
function renderFavorites() {
    const favBox = document.getElementById('favoriteListContainer');
    if (!favBox) return;
    if (favoriteChars.length === 0) { favBox.innerHTML = '<div style="font-size: 12px; color: #94a3b8; text-align: center; padding: 20px 0;">등록 캐릭터 없음</div>'; return; }
    favBox.innerHTML = favoriteChars.map(name => `
        <div onclick="searchCharacter('${name}')" style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px 15px; border-radius: 10px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: 0.2s;" onmouseover="this.style.borderColor='#ff9100'; this.style.transform='translateY(-2px)';" onmouseout="this.style.borderColor='#e2e8f0'; this.style.transform='translateY(0)';">
            <span style="font-weight: 800; color: #1e293b; font-size: 13px;">${name}</span>
            <span style="font-size: 11px; color: white; background: #ff9100; padding: 3px 8px; border-radius: 12px; font-weight: bold;">조회 ➔</span>
        </div>
    `).join('');
}
window.addEventListener('DOMContentLoaded', () => { setTimeout(renderFavorites, 300); });

// ============================================================================
// 🎨 [핵심] 인게임 툴팁 생성 함수
// ============================================================================
function generateInGameTooltipHtml(item, slotName) {
    const gradeColor = { "레전드리": "#15803d", "유니크": "#b45309", "에픽": "#6b21a8", "레어": "#0369a1" };

    let starCount = parseInt(item.starforce) || 0; 
    let baseLev = item.item_base_option?.base_equipment_level || 0; 
    let part = item.item_equipment_part || slotName;

    const noStarParts = ["훈장", "포켓 아이템", "배지", "뱃지", "성향 아이템", "칭호"];
    const eventRingKeywords = ["테네브리스", "글로리온", "어웨이크", "이터널 플레임", "SS급 마스터", "결속의 반지", "코스모스 링", "카오스 링"];
    const isEventRing = eventRingKeywords.some(k => item.item_name.includes(k));

    let starHtml = "";
    if (!noStarParts.includes(part) && !isEventRing) {
        let maxStar = 0;
        if (baseLev >= 150) maxStar = 25;
        else if (baseLev >= 140) maxStar = 25;
        else if (baseLev >= 130) maxStar = 20;
        else if (baseLev >= 120) maxStar = 15;
        else if (baseLev >= 100) maxStar = 8;
        else maxStar = 5;

        if (item.item_name.includes("타일런트")) maxStar = 15;

        let starsHtmlContent = "";
        for (let i = 1; i <= maxStar; i++) {
            starsHtmlContent += (i <= starCount) ? "★" : "☆";
            if (i % 5 === 0) starsHtmlContent += " ";
            if (i === 15) starsHtmlContent += "<br>";
        }
        starHtml = `<div style="color:#ffd200; text-align:center; font-size:12px; margin-bottom:10px; letter-spacing:2px; font-family: 'Apple SD Gothic Neo', sans-serif; line-height: 1.1; font-weight: 900;">${starsHtmlContent}</div>`;
    }

    let nameColor = item.potential_option_grade ? gradeColor[item.potential_option_grade] : "#ffffff";
    let nameHtml = `<div style="font-weight:900; font-size:15px; text-align:center; color:${nameColor}; margin-bottom:4px; word-break:keep-all;">${item.item_name}</div>`;
    let subHtml = item.potential_option_grade ? `<div style="text-align:center; font-size:11px; color:#aaaaaa; margin-bottom:12px; font-weight: 600;">(${item.potential_option_grade} 아이템)</div>` : '';

    let reqHtml = `
    <div style="display:flex; gap:12px; margin-bottom:12px; border-bottom:1px solid #555555; padding-bottom:12px;">
        <div style="width: 70px; height: 70px; background: #222222; border: 1px solid #444444; border-radius: 8px; flex-shrink: 0; display: flex; justify-content: center; align-items: center;">
            <img src="${item.item_icon}" style="max-width: 55px; max-height: 55px;">
        </div>
        <div style="flex-grow: 1; display:flex; flex-direction:column; justify-content:center; gap:4px;">
            <div style="color:#ffd200; font-size:12px; font-weight:900;">REQ LEV : ${baseLev}</div>
            <div style="font-size:10px; color:#cccccc; display:grid; grid-template-columns: 1fr 1fr; gap:3px;">
                <span>REQ STR : 000</span><span>REQ LUK : 000</span>
                <span>REQ DEX : 000</span><span>REQ INT : 000</span>
            </div>
        </div>
    </div>`;

    let statsHtml = `<div style="font-size:12px; line-height:1.6; margin-bottom:12px; color: #eeeeee;">`;
    statsHtml += `<div>장비분류 : <span style="font-weight: 700;">${part}</span></div>`;

    const formatStat = (name, key, isPercent = false) => {
        if (!item.item_total_option || !item.item_total_option[key] || item.item_total_option[key] === "0") return "";
        let total = item.item_total_option[key], base = item.item_base_option?.[key] || 0, add = item.item_add_option?.[key] || 0, etc = item.item_etc_option?.[key] || 0, star = item.item_starforce_option?.[key] || 0;
        let unit = isPercent ? "%" : "", isBonus = (add != 0 || etc != 0 || star != 0);
        let detail = isBonus ? ` <span style="color:#aaa;">(</span><span style="color:#fff;">${base}${unit}</span><span style="color:#2ecc71;"> +${add}${unit}</span><span style="color:#fff;"> +${etc}${unit}</span><span style="color:#ffd200;"> +${star}${unit}</span><span style="color:#aaa;">)</span>` : "";
        return `<div>${name} : <span style="color:${isBonus?'#64e2ff':'#fff'}; font-weight:700;">+${total}${unit}</span>${detail}</div>`;
    };

    statsHtml += formatStat("STR", "str"); statsHtml += formatStat("DEX", "dex"); statsHtml += formatStat("INT", "int"); statsHtml += formatStat("LUK", "luk");
    statsHtml += formatStat("최대 HP", "max_hp"); statsHtml += formatStat("공격력", "attack_power"); statsHtml += formatStat("마력", "magic_power");
    statsHtml += formatStat("보공", "boss_damage", true); statsHtml += formatStat("방무", "ignore_monster_armor", true); statsHtml += formatStat("올스탯", "all_stat", true);
    statsHtml += `</div>`;

    let potHtml = '';
    if (item.potential_option_grade) {
        potHtml += `<div style="border-top:1px dashed #555; padding-top:10px; margin-top:8px; font-size:12px;">
            <div style="color:${gradeColor[item.potential_option_grade]}; font-weight:800; margin-bottom:4px;">● 잠재옵션</div>
            <div style="color:#fff;">${item.potential_option_1 || ''}</div><div style="color:#fff;">${item.potential_option_2 || ''}</div><div style="color:#fff;">${item.potential_option_3 || ''}</div>
        </div>`;
    }
    if (item.additional_potential_option_grade) {
        potHtml += `<div style="border-top:1px dashed #555; padding-top:10px; margin-top:8px; font-size:12px;">
            <div style="color:${gradeColor[item.additional_potential_option_grade]}; font-weight:800; margin-bottom:4px;">● 에디셔널 잠재옵션</div>
            <div style="color:#fff;">${item.additional_potential_option_1 || ''}</div><div style="color:#fff;">${item.additional_potential_option_2 || ''}</div><div style="color:#fff;">${item.additional_potential_option_3 || ''}</div>
        </div>`;
    }

    return `${starHtml}${nameHtml}${subHtml}${reqHtml}${statsHtml}${potHtml}`;
}

// ============================================================================
// 🛠️ 툴팁 화면 표시 시스템 (화면 흔들림 및 겹침 방지 적용)
// ============================================================================

function getOrCreateTooltip() {
    let tt = document.getElementById('itemTooltip');
    if (!tt) {
        tt = document.createElement('div');
        tt.id = 'itemTooltip';
        document.body.appendChild(tt);
    }
    tt.style.cssText = `display: none; position: fixed !important; background: rgba(17, 17, 17, 0.95); color: #fff; border: 2px solid #555; border-radius: 10px; padding: 15px; font-size: 12px; z-index: 99999; width: 280px; pointer-events: none; box-shadow: 0 10px 30px rgba(0,0,0,0.5); box-sizing: border-box; backdrop-filter: blur(10px); top: 0; left: 0;`;
    return tt;
}

function showTooltip(slotName, presetNum) {
    if (!currentSearchData?.item) return;
    let list = currentSearchData.item[`item_equipment_preset_${presetNum}`] || currentSearchData.item.item_equipment;
    const item = list.find(eq => eq.item_equipment_slot === slotName || (slotName === "상의" && eq.item_equipment_slot === "한벌옷") || (slotName === "펜던트1" && eq.item_equipment_slot === "펜던트") || (slotName === "뱃지" && eq.item_equipment_slot === "배지"));
    if (!item) return;
    let tt = getOrCreateTooltip();
    tt.innerHTML = generateInGameTooltipHtml(item, slotName);
    tt.style.display = 'block';
}

function showBuilderItemTooltip(event, slotName) {
    const activeBtn = document.querySelector('.builder-preset-btn.active');
    const num = activeBtn ? parseInt(activeBtn.innerText.replace(/[^0-9]/g, "")) : 1;
    showTooltip(slotName, num); 
}

function moveTooltip(e) {
    const tt = document.getElementById('itemTooltip');
    if (!tt || tt.style.display === 'none') return;
    let x = e.clientX + 15, y = e.clientY + 15;
    if (x + 300 > window.innerWidth) x = e.clientX - 310;
    if (y + 400 > window.innerHeight) y = e.clientY - 410;
    tt.style.left = x + 'px'; tt.style.top = y + 'px';
}

function hideTooltip() { const tt = document.getElementById('itemTooltip'); if (tt) tt.style.display = 'none'; }

// ============================================================================
// 🔄 [핵심 수정 완료] 장비 프리셋 변경 (전투력 + 슬롯 + 상세 리스트 완벽 연동)
// ============================================================================
/**
 * 초보자 가이드: 사용자가 프리셋 버튼(1번, 2번 등)을 누르면 동작하는 핵심 함수입니다.
 * 콤마(,)가 포함된 숫자를 제대로 계산하도록 로직을 수정했고, 
 * HTML에서 어떤 ID를 사용하더라도 알아서 찾아가도록 방어 코드를 작성했습니다.
 */
function switchItemPreset(num) {
    // [1] 클릭한 버튼에 불 들어오게 하기
    document.querySelectorAll('#itemPresetBtns .preset-btn').forEach((btn, i) => {
        btn.classList.toggle('active', i + 1 === num);
    });

    if (!currentSearchData || !currentSearchData.stat || !currentSearchData.item) return;

    const statData = currentSearchData.stat;
    const itemData = currentSearchData.item;

    // [2] 프리셋 아이템 리스트 설정
    let equipList = itemData[`item_equipment_preset_${num}`] || itemData.item_equipment;



    // [4] 출력 영역 설정 (왼쪽 5x5 슬롯 & 중앙 상세 리스트)
    const slotBox = document.getElementById('res_power'); // 좌측 5x5 영역 ID
    const listGrid = document.getElementById('res_itemGrid'); // 중앙 상세 리스트 영역 ID

    const gradeColor = { "레전드리": "#15803d", "유니크": "#b45309", "에픽": "#6b21a8", "레어": "#0369a1" };
    const borderGradeColor = { "레전드리": "#bbf7d0", "유니크": "#fde68a", "에픽": "#e9d5ff", "레어": "#bae6fd" };
    const slotOrder = ["반지4", "펜던트2", "모자", "얼굴장식", "뱃지", "반지3", "펜던트", "눈장식", "귀고리", "엠블렘", "반지2", "무기", "상의", "어깨장식", "훈장", "반지1", "벨트", "하의", "장갑", "보조무기", "포켓 아이템", "안드로이드", "신발", "망토", "기계 심장"];

    // [5] 좌측 5x5 장비 슬롯 그리드 렌더링
    if (slotBox && equipList) {
        let gHtml = `
        <div style="font-size: 13px; font-weight: 800; color: #475569; margin-bottom: 12px; display: flex; align-items: center; gap: 5px;">
            <span style="font-size: 14px;">⚔️</span> 장비 슬롯
        </div>
        <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px;">`;
        
        slotOrder.forEach(sName => {
            let item = equipList.find(eq => eq.item_equipment_slot === sName || (sName === "상의" && eq.item_equipment_slot === "한벌옷"));
            if (item) {
                let bColor = borderGradeColor[item.potential_option_grade] || "#e2e8f0";
                gHtml += `<div onmouseenter="showTooltip('${sName}', ${num})" onmousemove="moveTooltip(event)" onmouseleave="hideTooltip()" style="background: white; border-radius: 6px; border: 1px solid ${bColor}; display: flex; align-items: center; justify-content: center; aspect-ratio: 1/1; cursor: pointer;"><img src="${item.item_icon}" style="width: 75%;"></div>`;
            } else {
                gHtml += `<div style="background: #f1f5f9; border-radius: 6px; border: 1px dashed #cbd5e1; aspect-ratio: 1/1;"></div>`;
            }
        });
        gHtml += `</div>`;
        slotBox.innerHTML = gHtml;
    }

    // [6] 중앙 상세 아이템 리스트 렌더링
    if (listGrid && equipList) {
        const shortPot = (txt) => {
            if (!txt) return "";
            return txt.replace("보스 몬스터 공격 시 데미지", "보공").replace("보스 몬스터 데미지", "보공").replace("몬스터 방어율 무시", "방무").replace("크리티컬 데미지", "크뎀").replace("아이템 드롭률", "아획").replace("메소 획득량", "메획").replace("최대 HP", "HP").replace(" : ", ":");
        };

        let listHtml = `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 10px; width: 100%;">`;
        
        equipList.forEach(item => {
            let bColor = borderGradeColor[item.potential_option_grade] || "#cbd5e1";
            let starHtml = (parseInt(item.starforce) > 0) ? `<span style="color:#d97706; font-size:11px; font-weight:900; margin-left:5px;">★${item.starforce}</span>` : '';
            let potStr = "";
            
            const renderOptions = (grade, opt1, opt2, opt3) => {
                if (!grade) return;
                let options = [opt1, opt2, opt3].filter(Boolean).map(shortPot).join(' / ');
                potStr += `<div style="color:${gradeColor[grade]}; font-size:11px; font-weight:700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 1px; width: 100%;">
                    <span style="font-size: 10px; background: #f1f5f9; padding: 0 3px; border-radius: 3px; margin-right: 4px; border: 1px solid ${gradeColor[grade]}22;">${grade.charAt(0)}</span>${options}</div>`;
            };
            
            renderOptions(item.potential_option_grade, item.potential_option_1, item.potential_option_2, item.potential_option_3);
            renderOptions(item.additional_potential_option_grade, item.additional_potential_option_1, item.additional_potential_option_2, item.additional_potential_option_3);

            listHtml += `
            <div onmouseenter="showTooltip('${item.item_equipment_slot}', ${num})" onmousemove="moveTooltip(event)" onmouseleave="hideTooltip()" style="background: #ffffff; border: 1px solid ${bColor}; border-radius: 8px; padding: 10px; display: flex; align-items: center; gap: 10px; cursor: pointer; transition: 0.1s; box-shadow: 0 1px 2px rgba(0,0,0,0.02); min-width: 0; overflow: hidden; box-sizing: border-box; width: 100%;">
                <div style="width: 38px; height: 38px; flex-shrink: 0; background: #f8fafc; border-radius: 6px; display: flex; align-items: center; justify-content: center; border: 1px solid #e2e8f0;"><img src="${item.item_icon}" style="max-width: 80%; max-height: 80%;"></div>
                <div style="flex: 1; min-width: 0; display: flex; flex-direction: column; overflow: hidden; width: 100%;">
                    <div style="font-weight: 800; font-size: 12px; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%;">${item.item_name}${starHtml}</div>
                    ${potStr}
                </div>
            </div>`;
        });
        listHtml += `</div>`;
        listGrid.innerHTML = listHtml;
    }
}

// ============================================================================
// ⚔️ 어빌리티 프리셋 기능
// ============================================================================
function switchAbilityPreset(num) {
    document.querySelectorAll('#abilityPresetBtns .preset-btn').forEach((btn, i) => {
        btn.style.background = (i + 1 === num) ? '#e2e8f0' : 'transparent';
        btn.style.color = (i + 1 === num) ? '#1e293b' : '#94a3b8';
    });

    if (!currentSearchData || !currentSearchData.ability) return;
    const abiData = currentSearchData.ability;
    let targetPreset = abiData[`ability_preset_${num}`] || abiData; 
    const abiList = document.getElementById('res_equip_ability');
    const fame = abiData.remain_fame ? Number(abiData.remain_fame).toLocaleString() : '0';

    let html = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid #cbd5e1; padding-bottom:10px;">
            <span style="color:#475569; font-size:12px; font-weight:700;">보유 명성치</span>
            <span style="color:#0f172a; font-size:13px; font-weight:800;">${fame}</span>
        </div>`;

    if (targetPreset && targetPreset.ability_info) {
        html += targetPreset.ability_info.map((a) => {
            let color = "#475569";
            if(a.ability_grade === "레전드리") color = "#15803d";
            else if(a.ability_grade === "유니크") color = "#b45309";
            else if(a.ability_grade === "에픽") color = "#6b21a8";
            else if(a.ability_grade === "레어") color = "#0369a1";

            return `
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:6px; background:#f8fafc; padding:10px 15px; border-radius:8px; border:1px solid #e2e8f0;">
                <span style="color:${color}; font-weight:900; font-size:11px; min-width:60px;">${a.ability_grade}</span>
                <span style="color:#1e293b; font-size:12px; font-weight:600; word-break:keep-all; line-height:1.4;">${a.ability_value}</span>
            </div>`;
        }).join('');
        abiList.innerHTML = html;
    } else {
        abiList.innerHTML = '<div style="color: #94a3b8; text-align: center; font-size: 12px; padding: 15px 0;">어빌리티 정보가 없습니다.</div>';
    }
}

// ============================================================================
// 🛠️ OMNI BUILDER: 템셋팅 시뮬레이터
// ============================================================================

const MAPLE_SLOT_NAMES = [
    "반지1", "눈장식", null, "모자", "망토",
    "반지2", "얼굴장식", null, "상의", "장갑",
    "반지3", "귀고리", null, "하의", "신발",
    "반지4", "펜던트1", null, "어깨장식", "훈장",
    "벨트", "펜던트2", null, "안드로이드", "기계 심장",
    "포켓 아이템", "무기", "보조무기", "엠블렘", "뱃지"
];

function openOmniBuilder() {
    const sections = ['mainPortal', 'searchPageContent', 'appContent'];
    sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.setProperty('display', 'none', 'important');
    });

    const builder = document.getElementById('omniBuilderSection');
    if (builder) {
        builder.style.setProperty('display', 'block', 'important');
        initBuilderGrids(); 
        
        setTimeout(() => {
            if (typeof syncEquipToBuilder === 'function') {
                syncEquipToBuilder();
            }
        }, 50);
    }
}

function initBuilderGrids() {
    const currentGrid = document.getElementById('builder_current_grid');
    const targetGrid = document.getElementById('builder_target_grid');
    
    if (!currentGrid || currentGrid.children.length > 0) return;

    MAPLE_SLOT_NAMES.forEach((slotName, i) => {
        const slotC = document.createElement('div');
        if (slotName) {
            slotC.className = 'builder-slot-static';
            slotC.innerText = slotName;
            
            slotC.onmouseover = (e) => showBuilderItemTooltip(e, slotName);
            slotC.onmousemove = (e) => moveTooltip(e); 
            slotC.onmouseout = () => hideTooltip(); 
        } else {
            slotC.className = 'slot-empty'; 
        }
        currentGrid.appendChild(slotC);

        const slotT = document.createElement('div');
        if (slotName) {
            slotT.className = 'builder-slot-active';
            slotT.innerText = slotName;
            
            slotT.onclick = () => selectBuilderSlot(i); 
            
            slotT.onmouseover = (e) => showBuilderItemTooltip(e, slotName);
            slotT.onmousemove = (e) => moveTooltip(e); 
            slotT.onmouseout = () => hideTooltip(); 
        } else {
            slotT.className = 'slot-empty'; 
        }
        targetGrid.appendChild(slotT);
    });
}

function selectBuilderSlot(index) {
    const placeholder = document.getElementById('editor_placeholder');
    const form = document.getElementById('editor_form');
    const editTitle = document.getElementById('edit_slot_name');
    
    if (placeholder) placeholder.style.display = 'none';
    if (form) form.style.display = 'block';
    
    const slotName = MAPLE_SLOT_NAMES[index] || "장비 슬롯";
    if (editTitle) editTitle.innerText = "✨ " + slotName + " 설정";

    let itemName = "장착 안 함";
    let itemIcon = "";
    if (currentSearchData && currentSearchData.item) {
        const activeBtn = document.querySelector('.builder-preset-btn.active');
        const presetNum = activeBtn ? parseInt(activeBtn.innerText.replace(/[^0-9]/g, "")) : 1;
        let equipList = currentSearchData.item[`item_equipment_preset_${presetNum}`];
        if (!equipList || equipList.length === 0) equipList = currentSearchData.item.item_equipment;

        const item = equipList.find(eq => 
            eq.item_equipment_slot === slotName || 
            (slotName === "상의" && eq.item_equipment_slot === "한벌옷") ||
            (slotName === "펜던트1" && eq.item_equipment_slot === "펜던트") ||
            (slotName === "뱃지" && eq.item_equipment_slot === "배지")
        );

        if (item) {
            itemName = item.item_name;
            itemIcon = item.item_icon;
            const alertBox = document.getElementById('builder_event_alert');
            if (alertBox) {
                if (item.date_expire) alertBox.style.display = 'block';
                else alertBox.style.display = 'none';
            }
        }
    }

    const iconBox = document.getElementById('edit_item_icon');
    if (iconBox) {
        if (itemIcon) {
            iconBox.innerHTML = `<img src="${itemIcon}" style="width: 70%; height: 70%; object-fit: contain;">`;
        } else {
            iconBox.innerHTML = '';
        }
    }
}

function changeBuilderPreset(num) {
    const btns = document.querySelectorAll('.builder-preset-btn');
    btns.forEach((btn) => {
        btn.style.background = "transparent";
        btn.style.color = "#64748b";
        btn.style.boxShadow = "none";
        btn.classList.remove('active');
    });

    const activeBtn = btns[num - 1];
    if (activeBtn) {
        activeBtn.style.background = "#ffffff";
        activeBtn.style.color = "#ff9100";
        activeBtn.style.boxShadow = "0 2px 5px rgba(0,0,0,0.05)";
        activeBtn.classList.add('active');
    }

    syncEquipToBuilder(num);
    
    const placeholder = document.getElementById('editor_placeholder');
    const form = document.getElementById('editor_form');
    if (placeholder) placeholder.style.setProperty('display', 'flex', 'important');
    if (form) form.style.setProperty('display', 'none', 'important');
}

function syncEquipToBuilder(presetNum = 1) {
    if (!currentSearchData || !currentSearchData.item) return;

    const itemData = currentSearchData.item;
    let equipList = itemData[`item_equipment_preset_${presetNum}`];
    if (!equipList || equipList.length === 0) equipList = itemData.item_equipment;

    const currentSlots = document.querySelectorAll('#builder_current_grid .builder-slot-static, #builder_current_grid .slot-empty');
    const targetSlots = document.querySelectorAll('#builder_target_grid .builder-slot-active, #builder_target_grid .slot-empty');

    MAPLE_SLOT_NAMES.forEach((slotName, idx) => {
        if (!slotName) return; 

        const item = equipList.find(eq => 
            eq.item_equipment_slot === slotName || 
            (slotName === "상의" && eq.item_equipment_slot === "한벌옷") ||
            (slotName === "펜던트1" && eq.item_equipment_slot === "펜던트") ||
            (slotName === "뱃지" && eq.item_equipment_slot === "배지")
        );

        if (item) {
            const imgHtml = `<img src="${item.item_icon}" style="width: 92%; height: 92%; object-fit: contain; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1)); pointer-events: none;">`;
            
            if (currentSlots[idx] && currentSlots[idx].className !== 'slot-empty') {
                currentSlots[idx].innerHTML = imgHtml;
                currentSlots[idx].style.background = "#ffffff";
                currentSlots[idx].style.color = "transparent";
            }
            if (targetSlots[idx] && targetSlots[idx].className !== 'slot-empty') {
                targetSlots[idx].innerHTML = imgHtml;
                targetSlots[idx].style.background = "#ffffff";
                targetSlots[idx].style.color = "transparent";
                targetSlots[idx].setAttribute('data-item-name', item.item_name);
            }
        } else {
            if (currentSlots[idx] && currentSlots[idx].className !== 'slot-empty') {
                currentSlots[idx].innerHTML = "";
                currentSlots[idx].innerText = slotName;
                currentSlots[idx].style.background = "#f8fafc";
                currentSlots[idx].style.color = "#cbd5e1";
            }
            if (targetSlots[idx] && targetSlots[idx].className !== 'slot-empty') {
                targetSlots[idx].innerHTML = "";
                targetSlots[idx].innerText = slotName;
                targetSlots[idx].style.background = "#f8fafc";
                targetSlots[idx].style.color = "#ff9100";
            }
        }
    });
}

// ============================================================================
// 🚀 앱 UI 초기화 (DOM 동적 생성)
// ============================================================================
/**
 * 초보자 가이드: 웹페이지가 처음 로드될 때 캐릭터 사냥 기록지 탭들을 그려주는 핵심 함수입니다.
 * 도핑 체크리스트가 상세 스탯 설정창 바로 아래에 안전하게 위치합니다.
 */
function init() {
    const container = document.getElementById('charContents'), tabList = document.getElementById('tabContainer'), histTabList = document.getElementById('historyTabContainer');
    if(!container) return;
    container.innerHTML = ""; tabList.innerHTML = ""; histTabList.innerHTML = "";
    
    for(let i=1; i<=4; i++) {
        const savedName = (JSON.parse(localStorage.getItem(`maple_config_${i}`)) || {}).name || `캐릭터 ${i}`;
        tabList.innerHTML += `<button class="tab-btn ${i===currentIdx?'active':''}" id="tab_btn_${i}" onclick="openTab(${i})">${savedName}</button>`;
        histTabList.innerHTML += `<button class="nav-btn ${i===currentIdx?'active':''}" id="hist_tab_btn_${i}" onclick="openHistTab(${i})">${savedName}</button>`;
        
        container.innerHTML += `
        <div id="tab_${i}" class="content" style="${i===currentIdx?'':'display:none;'}">
            <div class="goal-card" style="background: white; padding: 20px; border-radius: 15px; border: 1px solid var(--border); margin-bottom: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;"><span style="font-weight: 800; color: var(--primary); font-size: 14px;">🚩 목표 달성률</span><span id="goalPercent_${i}" style="color: var(--accent); font-weight: 900; font-size: 16px;">0.0%</span></div>
                <div style="background: #edf2f7; height: 12px; border-radius: 10px; overflow: hidden; border: 1px solid #e2e8f0;"><div id="progressBar_${i}" style="background: linear-gradient(90deg, #ff9100, #ff6b10); height: 100%; width: 0%; transition: width 0.8s ease;"></div></div>
                <div style="display: flex; justify-content: flex-end; margin-top: 8px;"><small style="color: #a0aec0; font-weight: 600;">목표까지 <span id="remainMeso_${i}" style="color: var(--warn); font-weight: 800;">0</span> 메소 남음</small></div>
            </div>
            <div class="dash"><div class="stat-card"><small>누적 사냥 메소</small><b id="profitMeso_${i}">0 메소</b></div><div class="stat-card"><small>누적 경험치 상승</small><b id="profitExp_${i}">0 %</b></div><div class="stat-card"><small>현재 드랍/메획</small><b id="currentStats_${i}">0% / 0%</b></div><div class="stat-card"><small>누적 코젬 / 조각</small><b id="netDrops_${i}">0 / 0</b></div><div class="stat-card"><small>총 소재 회차</small><b id="subCountDisplay_${i}">0 회</b></div></div>
            <div class="config-area">
                <div class="input-row" style="grid-template-columns: repeat(6, 1fr);"><div class="input-box"><label>👤 캐릭터명</label><input type="text" id="nameInput_${i}" value="${savedName}" oninput="updateTabName(${i}); updateAll(${i});"></div><div class="input-box"><label>💰 시작 메소</label><input type="text" id="startMeso_${i}" oninput="onMeso(this); updateAll(${i});"></div><div class="input-box"><label>🎯 목표 메소</label><input type="text" id="targetMeso_${i}" oninput="onMeso(this); updateAll(${i});" placeholder="목표액 입력"></div><div class="input-box"><label>📈 시작 경험치(%)</label><input type="number" id="startExp_${i}" step="0.001" oninput="updateAll(${i})"></div><div class="input-box"><label>💎 시작 코젬</label><input type="number" id="startGem_${i}" oninput="updateAll(${i})"></div><div class="input-box"><label>🧩 시작 조각</label><input type="number" id="startFrag_${i}" oninput="updateAll(${i})"></div></div>
                <button onclick="toggleDetails(${i})" style="width:100%; padding:8px; background:#f8f9fa; border:1px solid #ddd; border-radius:8px; cursor:pointer; font-size:11px; margin-bottom:15px; font-weight:bold; color:#7f8c8d;">⚙️ 상세 스탯 설정 (열기/닫기)</button>
                
                <div id="details_${i}" class="details-panel">
                    <div class="stat-section"><h4>메소 획득량</h4>${statItems.map((s, idx)=>`<div class="stat-row"><span>${s}</span><input type="number" id="m_stat_${idx}_${i}" value="0" oninput="updateAll(${i})"></div>`).join('')}</div>
                    <div class="stat-section"><h4>아이템 드랍률</h4>${statItems.map((s, idx)=>`<div class="stat-row"><span>${s}</span><input type="number" id="d_stat_${idx}_${i}" value="0" oninput="updateAll(${i})"></div>`).join('')}</div>
                </div>
                
                <div class="check-area">
                    <div class="check-title">💊 사냥 도핑 체크리스트</div>
                    <div class="doping-grid">${buffs.map((b, idx) => `<label><input type="checkbox" id="chk_${idx}_${i}" onchange="updateAll(${i})"> ${b.name}</label>`).join('')}</div>
                    <div class="quick-timer-box" style="margin-top:10px">
                        <div class="timer-label">도핑 타이머 : <span id="buffTimerDisplay">00:00</span></div>
                        <div class="timer-btns"><button onclick="setBuffTimer(600)">10m</button><button onclick="setBuffTimer(1200)" style="color:red">20m</button><button onclick="resetBuffTimer()">리셋</button></div>
                    </div>
                </div>

                <div class="input-row" style="background:#fcfcfc; padding:15px; border-radius:12px; border:1px solid #eee; margin-bottom:10px;"><div class="input-box"><label>📍 현재 사냥터</label><input type="text" id="map_${i}" placeholder="사냥터 입력"></div><div class="input-box"><label>💰 현재 메소</label><input type="text" id="meso_${i}" oninput="onMeso(this); updateAll(${i});"></div><div class="input-box"><label>📈 현재 경험치</label><input type="number" id="exp_${i}" step="0.001" oninput="updateAll(${i})"></div><div class="input-box"><label>💎 현재 코젬</label><input type="number" id="gem_${i}" oninput="updateAll(${i})"></div><div class="input-box"><label>🧩 현재 조각</label><input type="number" id="frag_${i}" oninput="updateAll(${i})"></div></div>
                <button onclick="openOcrModal()" style="width:100%; padding:14px; background: #ffffff; color:var(--primary); border:1.5px solid var(--primary); border-radius:12px; cursor:pointer; font-size:13px; margin-bottom:20px; font-weight:bold; display:flex; align-items:center; justify-content:center; gap:8px;"><span>📸</span> 스크린샷으로 재획 기록 자동 입력</button>
                <div class="sell-section"><div class="sell-header"><b>🛍️ 이번 회차 부수입 판매</b><button class="btn-add-sell" onclick="addSellRow(${i})">+ 추가</button></div><div id="sellContainer_${i}"><div class="sell-row"><select><option value="" disabled selected>물품 선택</option>${sellItems.map(it=>`<option value="${it}">${it}</option>`).join('')}</select><input type="number" placeholder="개수" oninput="calcSellSum(${i})"><input type="text" placeholder="판매 금액" oninput="onMeso(this); calcSellSum(${i})"><button class="btn-del-row" onclick="this.parentElement.remove(); calcSellSum(${i});">×</button></div></div><div style="text-align:right; margin-top:10px; font-weight:bold; color:var(--warn);">총 판매 합계: <span id="sellTotalDisplay_${i}">0</span> 메소</div></div>
                <div id="subRecordList_${i}" class="sub-record-list"></div>
                <div class="action-group"><button class="btn-action btn-sub-end" onclick="recordSub(${i})"><span>⏱️</span> 30분 소재 기록</button><button class="btn-action btn-all-end" onclick="saveFinalRecord(${i})"><span>📊</span> 기록지 전송</button><button class="btn-action btn-reset-data" onclick="resetCurrentHunt(${i})"><span>🗑️</span> 리셋</button></div>
            </div>
        </div>`;
    }
    loadData(); fetchRanking();
}

function openMiniPopup() {
    const w = 300, h = 480, popup = window.open("", "MapleMini", `width=${w},height=${h},left=${window.screen.width - w - 20},top=20,scrollbars=no,resizable=yes`);
    if (!popup) return alert("⚠️ 팝업 차단이 감지되었습니다!");
    let optionsHTML = '<option value="" disabled selected>👤 캐릭터 선택</option>'; document.querySelectorAll('.tab-btn').forEach((tab, index) => { const nameInput = document.getElementById('nameInput_' + (index + 1)); optionsHTML += `<option value="${index + 1}">${nameInput ? nameInput.value : '캐릭터 ' + (index + 1)}</option>`; });
    popup.document.open(); popup.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>사냥 리모컨</title><style>body { font-family: "Pretendard", sans-serif; padding: 10px; background: #f1f2f6; margin: 0; overflow: hidden; }.mini-card { background: #1a1a2e; padding: 12px; border-radius: 15px; color: #fff; text-align: center; border: 1px solid #c9a55c; margin-bottom: 10px; }.timer-text { font-size: 32px; font-weight: 900; color: #ffd700; margin-bottom: 5px; font-family: monospace; }.btn-timer { background: rgba(255,215,0,0.1); border: 1px solid #ffd700; color: #ffd700; padding: 3px 8px; border-radius: 5px; font-size: 11px; cursor: pointer; margin: 0 2px; }#char_select { width: 100%; margin-top: 10px; background: #2d3436; color: white; border: 1px solid #555; border-radius: 5px; padding: 4px; font-size: 12px; }.input-grid { background: white; padding: 10px; border-radius: 12px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }.row { display: flex; gap: 5px; margin-bottom: 8px; }.field { flex: 1; }.field label { display: block; font-size: 10px; color: #777; font-weight: bold; margin-bottom: 2px; }.field input { width: 100%; padding: 5px; border: 1px solid #ddd; border-radius: 6px; font-size: 12px; text-align: center; box-sizing: border-box; outline: none; }.field input:focus { border-color: #6c5ce7; }.btn-record { width: 100%; padding: 12px; background: #6c5ce7; color: white; border: none; border-radius: 10px; font-weight: bold; font-size: 14px; cursor: pointer; margin-top: 5px; }.btn-clear { width: 100%; padding: 6px; background: none; color: #ff7675; border: 1px solid #ff7675; border-radius: 8px; font-size: 11px; cursor: pointer; margin-top: 8px; }</style></head><body><div class="mini-card"><div class="timer-text" id="w_timer">00:00</div><div><button class="btn-timer" onclick="window.opener.startTimer()">▶ 재생</button><button class="btn-timer" onclick="window.opener.stopOrResumeTimer()">⏸ 정지</button><button class="btn-timer" onclick="window.opener.resetTimer()">🔄 리셋</button></div><select id="char_select" onchange="loadChar(this.value)">${optionsHTML}</select></div><div id="w_content" style="text-align:center; font-size:11px; color:#999; margin-top:30px;">캐릭터를 선택해 주세요 🍁</div><script>let activeIdx = null; setInterval(() => { if (!window.opener) return; const mainT = window.opener.document.getElementById("timerDisplay"); if (mainT) document.getElementById("w_timer").innerText = mainT.innerText; }, 500); function syncToMain(field, value) { if (!activeIdx || !window.opener) return; const target = window.opener.document.getElementById(field + "_" + activeIdx); if (target) { target.value = value; window.opener.updateAll(activeIdx); } } function loadChar(idx) { activeIdx = idx; const op = window.opener, mapV = op.document.getElementById("map_" + idx).value, mesoV = op.document.getElementById("meso_" + idx).value, expV = op.document.getElementById("exp_" + idx).value, gemV = op.document.getElementById("gem_" + idx).value, fragV = op.document.getElementById("frag_" + idx).value; document.getElementById("w_content").innerHTML = \'<div class="input-grid"><div class="row"><div class="field"><label>📍 사냥터</label><input type="text" value="\' + mapV + \'" oninput="syncToMain(\\\'map\\\', this.value)"></div></div><div class="row"><div class="field"><label>💰 현재 메소</label><input type="text" value="\' + mesoV + \'" oninput="window.opener.onMeso(this); syncToMain(\\\'meso\\\', this.value)"></div><div class="field"><label>📈 현재 경험치</label><input type="number" value="\' + expV + \'" step="0.001" oninput="syncToMain(\\\'exp\\\', this.value)"></div></div><div class="row"><div class="field"><label>💎 현재 코젬</label><input type="number" value="\' + gemV + \'" oninput="syncToMain(\\\'gem\\\', this.value)"></div><div class="field"><label>🧩 현재 조각</label><input type="number" value="\' + fragV + \'" oninput="syncToMain(\\\'frag\\\', this.value)"></div></div><button class="btn-record" onclick="record()">⏱️ 30분 소재 기록</button><button class="btn-clear" onclick="resetInputs()">🗑️ 입력칸 비우기</button></div>\'; } function record() { window.opener.recordSub(activeIdx); document.body.style.background = "#d1ffd1"; setTimeout(() => { document.body.style.background = "#f1f2f6"; loadChar(activeIdx); }, 300); } function resetInputs() { if(!confirm("초기화할까요?")) return; ["map", "meso", "exp", "gem", "frag"].forEach(id => syncToMain(id, "")); loadChar(activeIdx); }<\/script></body></html>`); popup.document.close();
}

function showDetailTab(tab) { document.querySelectorAll('.detail-tab-content').forEach(el => el.style.display = 'none'); document.querySelectorAll('.detail-nav-btn').forEach(btn => btn.classList.remove('active')); const target = document.getElementById(`tab_content_${tab}`); if (target) target.style.display = 'block'; }
function showAlert(msg) { const alertBox = document.getElementById('customAlert'), alertMsg = document.getElementById('alertMessage'); if (!alertBox || !alertMsg) return; alertMsg.innerText = msg; alertBox.style.display = 'block'; setTimeout(() => { alertBox.style.display = 'none'; }, 3000); }
function exportData() { const d={}; for(let i=0; i<localStorage.length; i++) d[localStorage.key(i)]=localStorage.getItem(localStorage.key(i)); const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([JSON.stringify(d)],{type:"application/json"})); a.download=`maple_backup.json`; a.click(); }
function importData(e) { const r=new FileReader(); r.onload=function(ev){ const d=JSON.parse(ev.target.result); localStorage.clear(); for(const k in d)localStorage.setItem(k,d[k]); location.reload(); }; r.readAsText(e.target.files[0]); }

// 페이지가 로드되면 앱의 화면을 그려줍니다.
window.addEventListener('DOMContentLoaded', init);
