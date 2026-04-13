/**
 * ============================================================================
 * 🍁 MAPLE OMNI V13.6.5 - F5 새로고침 정보 유지 보강
 * ============================================================================
 */

const API_KEY = "test_b4b72659365dd8f8e050630f7d05b609548335ee63fb773f616d4a4c479769e7efe8d04e6d233bd35cf2fabdeb93fb0d";

let timerId = null, timeLeft = 1800, isPaused = false, endTime = null; 
let buffTimerId = null, buffTimeLeft = 0; 
let currentOcrMode = 'hunt'; 

const statItems = ['장비 아이템', '유니온 공격대', '어빌리티', '아티팩트', '스킬'];
const buffs = [
    { name: 'VIP 버프', d: 0, m: 0 }, { name: '추가 경험치 쿠폰(50%)', d: 0, m: 0 }, { name: '경험치 3배 쿠폰', d: 0, m: 0 },
    { name: '경험치 4배쿠폰', d: 0, m: 0 }, { name: '소형 재물 획득의 비약', d: 20, m: 1.2 }, { name: '소형 경험 축적의 비약', d: 10, m: 0 },
    { name: '유니온의 행운', d: 50, m: 0 }, { name: '유니온의 부', d: 0, m: 50 }, { name: '익스트림 골드', d: 0, m: 0 }
];
const sellItems = ["솔 에르다 조각", "코어 젬스톤", "어센틱 심볼", "상급 주문의 정수", "뒤틀린 시간의 정수", "기타"];

let subHistory = {1:[], 2:[], 3:[], 4:[]}; 
let huntRecords = JSON.parse(localStorage.getItem('maple_hunt_records')) || []; 
let currentIdx = 1; 

function getTodayStr() {
    const today = new Date();
    return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
}

// ============================================================================
// 🚪 화면 이동 함수 (마스터키 적용)
// ============================================================================

window.backToPortal = function(isPopState = false) {
    const elApp = document.getElementById('appContent');
    const elSearch = document.getElementById('searchPageContent');
    const elPortal = document.getElementById('mainPortal');
    const elDetailTab = document.getElementById('detailTabMenu');

    if (elApp) elApp.style.setProperty('display', 'none', 'important');
    if (elSearch) elSearch.style.setProperty('display', 'none', 'important');
    if (elDetailTab) elDetailTab.style.setProperty('display', 'none', 'important');
    if (elPortal) elPortal.style.setProperty('display', 'block', 'important'); 

    sessionStorage.setItem('omni_current_page', 'portal'); 
    window.scrollTo(0, 0); 

    if (!isPopState) history.pushState({ page: 'portal' }, "", "#portal");
};

window.startApp = function(isPopState = false) {
    const elPortal = document.getElementById('mainPortal');
    const elSearch = document.getElementById('searchPageContent');
    const elApp = document.getElementById('appContent');

    if(elPortal) elPortal.style.setProperty('display', 'none', 'important');
    if(elSearch) elSearch.style.setProperty('display', 'none', 'important');
    if(elApp) elApp.style.setProperty('display', 'flex', 'important');
    
    sessionStorage.setItem('omni_current_page', 'hunt'); 
    
    const lastNav = sessionStorage.getItem('omni_nav_page') || 1;
    showPage(lastNav);
    
    const lastTab = parseInt(sessionStorage.getItem('omni_current_tab')) || 1;
    openTab(lastTab);

    if (!isPopState) history.pushState({ page: 'hunt' }, "", "#hunt");
};

window.openSearchPage = function(isPopState = false) {
    const elApp = document.getElementById('appContent');
    const elPortal = document.getElementById('mainPortal');
    const elSearch = document.getElementById('searchPageContent');
    const elPlaceholder = document.getElementById('searchPlaceholder');
    
    if(elPortal) elPortal.style.setProperty('display', 'none', 'important');
    if(elApp) elApp.style.setProperty('display', 'none', 'important');
    if(elSearch) elSearch.style.setProperty('display', 'block', 'important');
    if(elPlaceholder) elPlaceholder.style.setProperty('display', 'block', 'important');
    
    sessionStorage.setItem('omni_current_page', 'search'); 

    if (!isPopState) history.pushState({ page: 'search' }, "", "#search");
};

window.addEventListener('popstate', (event) => {
    if (event.state) {
        if (event.state.page === 'hunt') window.startApp(true);
        else if (event.state.page === 'search') window.openSearchPage(true);
        else window.backToPortal(true);
    } else {
        window.backToPortal(true);
    }
});

window.addEventListener('DOMContentLoaded', () => {
    init(); 
    
    const lastPage = sessionStorage.getItem('omni_current_page');
    if (lastPage === 'hunt') {
        window.startApp(true); 
        history.replaceState({ page: 'hunt' }, "", "#hunt");
    } else if (lastPage === 'search') {
        window.openSearchPage(true); 
        history.replaceState({ page: 'search' }, "", "#search");
        
        // 🚀 [추가된 복구 마법] 새로고침해도 마지막 검색자 정보 살려내기
        const lastSearch = sessionStorage.getItem('omni_last_search');
        if (lastSearch) {
            const cachedData = JSON.parse(localStorage.getItem(`maple_api_search_${lastSearch}`));
            if (cachedData) {
                renderSearchDetail(cachedData.basic, cachedData.stat, cachedData.item, cachedData.ability, cachedData.symbol);
            }
        }
    } else {
        window.backToPortal(true); 
        history.replaceState({ page: 'portal' }, "", "#portal");
    }
});

// ============================================================================
// 🛡️ API 데이터 불러오기 (스텔스 동기화 및 랭킹)
// ============================================================================
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

function renderHuntSidebar(basic, stat) {
    document.getElementById('profileImg').src = basic.character_image;
    document.getElementById('profileName').innerText = basic.character_name;
    document.getElementById('profileLevel').innerText = `Lv. ${basic.character_level}`;
    document.getElementById('profileJob').innerText = basic.character_class;
    document.getElementById('profileWorld').innerText = basic.world_name;
    const getStatValue = (target) => stat.final_stat.find(s => s.stat_name === target)?.stat_value || "0";
    document.getElementById('stat_power').innerText = Number(getStatValue("전투력")).toLocaleString();
    document.getElementById('stat_atk').innerText = Number(getStatValue("최대 스탯 공격력")).toLocaleString();
    document.getElementById('stat_dmg').innerText = getStatValue("데미지") + "%";
}

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

async function searchCharacter() {
    const input = document.getElementById('portalSearchInput')?.value.trim();
    if (!input) return showAlert("❌ 캐릭터명을 입력해주세요!"); 
    
    const todayStr = getTodayStr();
    const cacheKey = `maple_api_search_${input}`;
    
    // 🚀 [추가] 마지막으로 검색한 닉네임 수첩에 기록 (F5 복구용)
    sessionStorage.setItem('omni_last_search', input); 

    let cachedData = JSON.parse(localStorage.getItem(cacheKey));

    if (cachedData && cachedData.date === todayStr) { 
        window.openSearchPage(); 
        renderSearchDetail(cachedData.basic, cachedData.stat, cachedData.item, cachedData.ability, cachedData.symbol); 
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
        renderSearchSummary(basic, stat); 
        
        await new Promise(res => setTimeout(res, 600)); 
        const item = await fetch(`https://open.api.nexon.com/maplestory/v1/character/item-equipment?ocid=${ocid}`, { headers }).then(r => r.json());
        await new Promise(res => setTimeout(res, 600)); 
        const ability = await fetch(`https://open.api.nexon.com/maplestory/v1/character/ability?ocid=${ocid}`, { headers }).then(r => r.json());
        await new Promise(res => setTimeout(res, 600)); 
        const symbol = await fetch(`https://open.api.nexon.com/maplestory/v1/character/symbol-equipment?ocid=${ocid}`, { headers }).then(r => r.json());

        localStorage.setItem(cacheKey, JSON.stringify({ date: todayStr, basic, stat, item, ability, symbol }));
        renderSearchDetail(basic, stat, item, ability, symbol);
    } catch (e) { 
        document.getElementById('searchPlaceholder').innerHTML = e.message === "API_LIMIT" ? "❌ 한도 초과. 내일 다시 시도해주세요." : "❌ 정보를 찾을 수 없습니다."; 
    }
}

function renderSearchSummary(basic, stat) {
    document.getElementById('searchPlaceholder').style.display = 'none';
    document.getElementById('detailTabMenu').style.display = 'flex';
    document.getElementById('charDetailContainer').style.display = 'grid';
    document.getElementById('res_profileImg').src = basic.character_image;
    document.getElementById('res_profileName').innerText = basic.character_name;
    document.getElementById('res_profileLevel').innerText = basic.character_level;
    document.getElementById('res_profileJob').innerText = basic.character_class;
    const power = stat.final_stat.find(s => s.stat_name === "전투력")?.stat_value || "0";
    document.getElementById('res_power').innerText = Number(power).toLocaleString();
    document.getElementById('res_resPower').innerText = Number(power).toLocaleString();
}

function renderSearchDetail(basic, stat, item, ability, symbol) {
    renderSearchSummary(basic, stat);
    const abiList = document.getElementById('res_equip_ability');
    if (abiList) abiList.innerHTML = (ability.ability_info || []).map(a => `<div class="ability-line">${a.ability_value}</div>`).join('');
    const symbolBox = document.getElementById('res_symbol_info');
    if (symbolBox) symbolBox.innerHTML = (symbol.symbol || []).slice(0, 6).map(s => {
        const name = s.symbol_name.replace(/아케인심볼 : |어센틱심볼 : /g, '');
        return `<p style="margin:4px 0; font-size:11px; border-bottom:1px solid #f1f5f9; padding-bottom:4px;"><b>${name}</b> <span style="color:#ff9100; font-weight:800; float:right;">Lv.${s.symbol_level}</span></p>`;
    }).join('');
    showDetailTab('equip');
}

// ============================================================================
// 🔄 유틸리티 및 탭, 타이머 기능
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
    // page_1, 2, 3을 각각 껐다 켰다 합니다.
    const p1 = document.getElementById('page_1'); if(p1) p1.style.display = n==1 ? 'block' : 'none'; 
    const p2 = document.getElementById('page_2'); if(p2) p2.style.display = n==2 ? 'block' : 'none'; 
    const p3 = document.getElementById('page_3'); if(p3) p3.style.display = n==3 ? 'block' : 'none'; 
    
    // 네비게이션 버튼 색상 활성화
    const n1 = document.getElementById('nav_1'); if(n1) n1.classList.toggle('active', n==1); 
    const n2 = document.getElementById('nav_2'); if(n2) n2.classList.toggle('active', n==2); 
    const n3 = document.getElementById('nav_3'); if(n3) n3.classList.toggle('active', n==3); 
    
    if(n==2) renderRecords(); 
    sessionStorage.setItem('omni_nav_page', n); 
}

// ============================================================================
// 📔 대규모 주간 보스 수익 다이어리 (프리셋 & 칩 UI)
// ============================================================================

const bossDB = [
    // [검밑솔]
    { id: 'b1', name: '카블퀸', price: 8140000, type: 'below' },
    { id: 'b2', name: '카반반', price: 8150000, type: 'below' },
    { id: 'b3', name: '카피에르', price: 8170000, type: 'below' },
    { id: 'b4', name: '하드 매그너스', price: 8560000, type: 'below' },
    { id: 'b5', name: '카오스 벨룸', price: 9280000, type: 'below' },
    { id: 'b6', name: '카오스 파풀라투스', price: 13800000, type: 'below' },
    { id: 'b7', name: '노멀 스우', price: 17600000, type: 'below' },
    { id: 'b8', name: '노멀 데미안', price: 18400000, type: 'below' },
    { id: 'b9', name: '노멀 가엔슬', price: 26800000, type: 'below' },
    { id: 'b10', name: '이지 루시드', price: 31400000, type: 'below' },
    { id: 'b11', name: '이지 윌', price: 34000000, type: 'below' },
    { id: 'b12', name: '노멀 루시드', price: 37500000, type: 'below' },
    { id: 'b13', name: '노멀 윌', price: 43300000, type: 'below' },
    { id: 'b14', name: '노멀 더스크', price: 46300000, type: 'below' },
    { id: 'b15', name: '노멀 듄켈', price: 50000000, type: 'below' },
    { id: 'b16', name: '하드 데미안', price: 51500000, type: 'below' },
    { id: 'b17', name: '하드 스우', price: 54200000, type: 'below' },
    { id: 'b18', name: '하드 루시드', price: 66200000, type: 'below' },
    { id: 'b19', name: '카오스 더스크', price: 73500000, type: 'below' },
    { id: 'b20', name: '노멀 진 힐라', price: 74900000, type: 'below' },
    { id: 'b21', name: '카오스 가엔슬', price: 79100000, type: 'below' },
    { id: 'b22', name: '하드 윌', price: 81200000, type: 'below' },
    { id: 'b23', name: '하드 듄켈', price: 99400000, type: 'below' },
    { id: 'b24', name: '하드 진 힐라', price: 112000000, type: 'below' },

    // [검윗솔]
    { id: 'a1', name: '노멀 세렌', price: 266000000, type: 'above' },
    { id: 'a2', name: '이지 칼로스', price: 311000000, type: 'above' },
    { id: 'a3', name: '이지 대적자', price: 324000000, type: 'above' },
    { id: 'a4', name: '하드 세렌', price: 396000000, type: 'above' },
    { id: 'a5', name: '이지 카링', price: 419000000, type: 'above' },
    { id: 'a6', name: '노멀 칼로스', price: 561000000, type: 'above' },
    { id: 'a7', name: '노멀 대적자', price: 589000000, type: 'above' },
    { id: 'a8', name: '익스트림 스우', price: 604000000, type: 'above' },
    { id: 'a9', name: '노멀 흉성', price: 658000000, type: 'above' },
    { id: 'a10', name: '하드 검은 마법사', price: 700000000, type: 'above' },
    { id: 'a11', name: '노멀 카링', price: 714000000, type: 'above' },
    { id: 'a12', name: '노멀 림보', price: 1080000000, type: 'above' },
    { id: 'a13', name: '카오스 칼로스', price: 1340000000, type: 'above' },
    { id: 'a14', name: '노멀 발드릭스', price: 1440000000, type: 'above' },
    { id: 'a15', name: '하드 대적자', price: 1510000000, type: 'above' },
    { id: 'a16', name: '노멀 유피테르', price: 1700000000, type: 'above' },
    { id: 'a17', name: '하드 카링', price: 1830000000, type: 'above' },
    { id: 'a18', name: '하드 림보', price: 2510000000, type: 'above' },
    { id: 'a19', name: '하드 흉성', price: 2819000000, type: 'above' },
    { id: 'a20', name: '익스트림 세렌', price: 2819000000, type: 'above' },
    { id: 'a21', name: '하드 발드릭스', price: 3240000000, type: 'above' },
    { id: 'a22', name: '익스트림 칼로스', price: 4320000000, type: 'above' },
    { id: 'a23', name: '익스트림 대적자', price: 4960000000, type: 'above' },
    { id: 'a24', name: '하드 유피테르', price: 5100000000, type: 'above' },
    { id: 'a25', name: '익스트림 카링', price: 5670000000, type: 'above' },
    { id: 'a26', name: '익스트림 검은 마법사', price: 9200000000, type: 'above' }
];

let myWeeklyBosses = {};

// 1. 바둑판(Grid) 형태의 칩(버튼) 그려주기
function renderBossPresets() {
    const gridBelow = document.getElementById('gridBelowBlackMage');
    const gridAbove = document.getElementById('gridAboveBlackMage');
    if (!gridBelow || !gridAbove) return;

    let belowHtml = '';
    let aboveHtml = '';

    bossDB.forEach(b => {
        const isSelected = myWeeklyBosses[b.id] !== undefined;
        // 선택되면 진한 색상과 굵은 글씨, 안 되면 회색조
        const bg = isSelected ? '#fff0f0' : '#ffffff';
        const border = isSelected ? '1px solid #ff4d4d' : '1px solid #cbd5e1';
        const color = isSelected ? '#d35400' : '#64748b';
        const weight = isSelected ? '800' : '500';

        const chipHtml = `
            <div onclick="toggleBossChip('${b.id}')" style="background: ${bg}; border: ${border}; color: ${color}; font-weight: ${weight}; padding: 10px 5px; border-radius: 8px; font-size: 11px; text-align: center; cursor: pointer; user-select: none; transition: 0.2s;">
                ${b.name}
            </div>
        `;

        if (b.type === 'below') belowHtml += chipHtml;
        else aboveHtml += chipHtml;
    });

    gridBelow.innerHTML = belowHtml;
    gridAbove.innerHTML = aboveHtml;
}

// 2. 칩을 클릭했을 때 (추가 / 제거)
function toggleBossChip(bossId) {
    if (myWeeklyBosses[bossId] !== undefined) {
        delete myWeeklyBosses[bossId]; // 이미 있으면 뺀다
    } else {
        myWeeklyBosses[bossId] = 1; // 없으면 파티원 1명으로 추가한다
    }
    renderBossPresets(); // 버튼 색상 업데이트
    renderSelectedBossList(); // 아래 목록 업데이트
}

// 3. 인원수 조절
function updatePartySize(bossId, size) {
    myWeeklyBosses[bossId] = parseInt(size);
    renderSelectedBossList();
}

// 4. 선택된 보스 목록 및 총액 정산
function renderSelectedBossList() {
    const listArea = document.getElementById('selectedBossList');
    const totalDisplay = document.getElementById('totalWeeklyProfit');
    let totalProfit = 0;
    
    if (Object.keys(myWeeklyBosses).length === 0) {
        listArea.innerHTML = `<div style="text-align: center; color: #a0aec0; font-size: 12px; padding: 20px;">위에서 보스를 클릭해 목록에 추가하세요.</div>`;
        totalDisplay.innerText = "0 메소";
        return;
    }

    let html = '';
    
    Object.keys(myWeeklyBosses).forEach(bossId => {
        const bossInfo = bossDB.find(b => b.id === bossId);
        const partySize = myWeeklyBosses[bossId];
        const myShare = Math.floor(bossInfo.price / partySize);
        totalProfit += myShare;

        // 메소 단위를 보기 좋게 (억, 만)
        let priceStr = bossInfo.price >= 100000000 
            ? Math.floor(bossInfo.price / 100000000) + "억 " + (bossInfo.price % 100000000 !== 0 ? (bossInfo.price % 100000000).toLocaleString() : "") 
            : bossInfo.price.toLocaleString();

        html += `
        <div style="display: flex; justify-content: space-between; align-items: center; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 15px; box-shadow: 0 2px 5px rgba(0,0,0,0.01);">
            <div>
                <div style="font-weight: 800; color: #1e293b; font-size: 14px;">${bossInfo.name}</div>
                <div style="font-size: 11px; color: #94a3b8;">${priceStr}</div>
            </div>
            
            <div style="display: flex; align-items: center; gap: 15px;">
                <div style="display: flex; align-items: center; gap: 5px;">
                    <span style="font-size: 11px; color: #64748b; font-weight: bold;">인원</span>
                    <select onchange="updatePartySize('${bossId}', this.value)" style="padding: 4px; border-radius: 6px; border: 1px solid #cbd5e1; outline: none; font-size: 12px; font-weight: bold; cursor: pointer;">
                        ${[1,2,3,4,5,6].map(num => `<option value="${num}" ${num === partySize ? 'selected' : ''}>${num}명</option>`).join('')}
                    </select>
                </div>
                
                <div style="text-align: right; min-width: 90px;">
                    <div style="font-size: 10px; color: #a0aec0; font-weight: bold;">내 수익</div>
                    <div style="color: var(--primary); font-weight: 900; font-size: 14px;">${myShare.toLocaleString()}</div>
                </div>
                <button onclick="toggleBossChip('${bossId}')" style="background: none; border: none; color: #ff7675; cursor: pointer; font-size: 16px; padding: 0;">×</button>
            </div>
        </div>`;
    });

    listArea.innerHTML = html;
    totalDisplay.innerText = totalProfit.toLocaleString() + " 메소";
}

// 5. 프리셋 저장하기
function saveBossPreset(num) {
    const selectedIds = Object.keys(myWeeklyBosses);
    if (selectedIds.length === 0) return showAlert("⚠️ 저장할 보스를 먼저 선택해주세요!");
    localStorage.setItem('maple_boss_preset_' + num, JSON.stringify(selectedIds));
    showAlert(`💾 프리셋 [${num}]번이 성공적으로 저장되었습니다!`);
}

// 6. 프리셋 불러오기
function loadBossPreset(num) {
    const saved = JSON.parse(localStorage.getItem('maple_boss_preset_' + num));
    if (!saved || saved.length === 0) return showAlert(`⚠️ 저장된 프리셋 [${num}]번이 없습니다.`);
    
    myWeeklyBosses = {};
    saved.forEach(id => myWeeklyBosses[id] = 1); // 불러올 땐 전부 1명으로 초기화
    
    renderBossPresets();
    renderSelectedBossList();
    showAlert(`📂 프리셋 [${num}]번을 불러왔습니다!`);
}

window.addEventListener('DOMContentLoaded', () => {
    setTimeout(renderBossPresets, 200); 
});

function startTimer() { if (!timerId) { endTime = Date.now() + (timeLeft * 1000); timerId = setInterval(() => { timeLeft = Math.round((endTime - Date.now()) / 1000); if (timeLeft <= 0) { timeLeft = 0; stopTimer(); updateTD(); alert("📢 30분 소재 종료!"); timeLeft = 1800; } updateTD(); }, 1000); isPaused = false; updateTimerButtons(); } }
function stopOrResumeTimer() { if (timerId) { clearInterval(timerId); timerId = null; isPaused = true; } else if (isPaused) { startTimer(); } updateTimerButtons(); }
function stopTimer() { clearInterval(timerId); timerId = null; isPaused = false; updateTimerButtons(); }
function resetTimer() { stopTimer(); timeLeft = 1800; isPaused = false; updateTD(); updateTimerButtons(); }
function updateTD() { const m = Math.floor(timeLeft/60), s = timeLeft%60; document.getElementById('timerDisplay').innerText = `${m}:${s<10?'0':''}${s}`; }
function updateTimerButtons() { const stopBtn = document.getElementById('mainStopBtn'); if (isPaused) { stopBtn.innerText = "재개"; stopBtn.classList.add('btn-resume'); } else { stopBtn.innerText = "정지"; stopBtn.classList.remove('btn-resume'); } }

function setBuffTimer(sec) { clearInterval(buffTimerId); buffTimeLeft = sec; updateBTD(); buffTimerId = setInterval(() => { buffTimeLeft--; if(buffTimeLeft <= 0) { clearInterval(buffTimerId); alert("💊 도핑 만료!"); } updateBTD(); }, 1000); }
function updateBTD() { const m = Math.floor(buffTimeLeft/60), s = buffTimeLeft%60; document.getElementById('buffTimerDisplay').innerText = `${m}:${s<10?'0':''}${s}`; }
function resetBuffTimer() { clearInterval(buffTimerId); buffTimeLeft=0; updateBTD(); }

function openHistTab(idx) { currentIdx = idx; document.querySelectorAll('#historyTabContainer .nav-btn').forEach(b => b.classList.remove('active')); document.getElementById(`hist_tab_btn_${idx}`).classList.add('active'); renderRecords(); }
function addSellRow(idx) { const container = document.getElementById(`sellContainer_${idx}`); const div = document.createElement('div'); div.className = 'sell-row'; div.innerHTML = `<select><option value="" disabled selected>물품 선택</option>${sellItems.map(it=>`<option value="${it}">${it}</option>`).join('')}</select><input type="number" placeholder="개수" oninput="calcSellSum(${idx})"><input type="text" placeholder="판매 금액" oninput="onMeso(this); calcSellSum(${idx})"><button class="btn-del-row" onclick="this.parentElement.remove(); calcSellSum(${idx});">×</button>`; container.appendChild(div); }
function calcSellSum(idx) { const rows = document.getElementById(`sellContainer_${idx}`).querySelectorAll('.sell-row'); let total = 0; rows.forEach(row => { total += parseInt(row.querySelectorAll('input')[1].value.replace(/,/g, '')) || 0; }); document.getElementById(`sellTotalDisplay_${idx}`).innerText = total.toLocaleString(); return total; }
function updateTabName(idx) { const n = document.getElementById(`nameInput_${idx}`).value || `캐릭터 ${idx}`; document.getElementById(`tab_btn_${idx}`).innerText = n; document.getElementById(`hist_tab_btn_${idx}`).innerText = n; }
function onMeso(el) { let v = el.value.replace(/,/g, ""); el.value = isNaN(v) ? "" : Number(v).toLocaleString(); }
function toggleDetails(idx) { const el = document.getElementById(`details_${idx}`); el.style.display = (el.style.display === 'grid') ? 'none' : 'grid'; }

// ============================================================================
// 📈 기록 저장 및 상태 갱신
// ============================================================================
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
function editRecordDate(recordId) { const record = huntRecords.find(r => r.id === recordId); if (record) { const newDate = prompt("수정할 날짜 (YYYY-MM-DD):", record.date); if (newDate && /^\d{4}-\d{2}-\d{2}$/.test(newDate)) { record.date = newDate; saveAndRefresh(); alert("수정 완료!"); } } }
function saveAndRefresh() { localStorage.setItem('maple_hunt_records', JSON.stringify(huntRecords)); renderRecords(); }
function editSubTime(cI, sI, t) { const idx = subHistory[cI].findIndex(s=>s.id===sI); if(idx!==-1){ subHistory[cI][idx].time=t; localStorage.setItem(`maple_subHistory_${cI}`, JSON.stringify(subHistory[cI])); } }
function removeSub(cI, sI) { subHistory[cI]=subHistory[cI].filter(s=>s.id!==sI); localStorage.setItem(`maple_subHistory_${cI}`, JSON.stringify(subHistory[cI])); updateSubDisplay(cI); updateAll(cI); }
function deleteRecord(id) { if(confirm("삭제?")) { huntRecords=huntRecords.filter(r=>r.id!==id); saveAndRefresh(); } }
function resetDateFilter() { document.getElementById('dateFilter').value=''; renderRecords(); }

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
// 📅 출석부 및 기록 시각화 (정사각형 + 빨간 체크 + 오늘 테두리)
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
    
    // 1. 일~토 요일 헤더
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    let html = days.map(d => `<div style="font-size:11px; font-weight:800; color:#a0aec0; padding-bottom:5px;">${d}</div>`).join('');

    // 2. 1일 시작 전 빈 칸 채우기
    for (let i = 0; i < firstDay; i++) {
        html += `<div></div>`;
    }

    // 3. 날짜 채우기
    for (let i = 1; i <= lastDate; i++) { 
        const currentFullDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`; 
        
        let bg = '#f8f9fa';
        let color = '#64748b';
        let border = '1px solid #edf2f7';
        let weight = '600';
        let content = `${i}`; // 기본 날짜 숫자

        // ✅ [요청 1] 출석한 날짜 (빨간색 체크 표시)
        if (attendanceData.includes(currentFullDate)) { 
            // 숫자 밑에 빨간색 체크를 달아줍니다.
            content = `${i}<br><span style="color:#ff4d4d; font-size:11px;">✔</span>`;
        } 
        
        // ✅ [요청 2] 오늘 날짜 (주황색 테두리)
        if (i === realToday.getDate() && month === realToday.getMonth() && year === realToday.getFullYear()) { 
            bg = 'white';
            color = '#ff9100';
            border = '2px solid #ff9100'; // 테두리 두껍게
            weight = '900';
        } 

        // ✅ [요청 3] aspect-ratio: 1/1 을 추가하여 완벽한 정사각형으로 만듭니다.
        html += `<div style="background:${bg}; color:${color}; border:${border}; border-radius:8px; display:flex; flex-direction:column; align-items:center; justify-content:center; aspect-ratio: 1 / 1; font-size:12px; font-weight:${weight}; box-shadow:0 2px 4px rgba(0,0,0,0.02); line-height:1.2;">${content}</div>`; 
    }
    
    grid.innerHTML = html; 
}

function changeMonth(diff) { 
    viewDate.setMonth(viewDate.getMonth() + diff); 
    renderAttendance(); 
}

function markAttendance() { 
    const today = new Date();
    const dateStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0'); 
    let attendanceData = JSON.parse(localStorage.getItem('mapleAttendance')) || []; 
    if (!attendanceData.includes(dateStr)) { 
        attendanceData.push(dateStr); 
        localStorage.setItem('mapleAttendance', JSON.stringify(attendanceData)); 
    } 
    renderAttendance(); 
}

window.addEventListener('DOMContentLoaded', () => {
    setTimeout(renderAttendance, 100); 
});

// ============================================================================
// 📸 [OCR] 스크린샷 이미지 인식 및 처리
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
// ⚙️ UI 뼈대 렌더링 (화면 그리기)
// ============================================================================
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
                <div id="details_${i}" class="details-panel"><div class="stat-section"><h4>메소 획득량</h4>${statItems.map((s, idx)=>`<div class="stat-row"><span>${s}</span><input type="number" id="m_stat_${idx}_${i}" value="0" oninput="updateAll(${i})"></div>`).join('')}</div><div class="stat-section"><h4>아이템 드랍률</h4>${statItems.map((s, idx)=>`<div class="stat-row"><span>${s}</span><input type="number" id="d_stat_${idx}_${i}" value="0" oninput="updateAll(${i})"></div>`).join('')}</div></div>
                <div class="check-area"><div class="check-title">💊 사냥 도핑 체크리스트</div><div class="doping-grid">${buffs.map((b, idx) => `<label><input type="checkbox" id="chk_${idx}_${i}" onchange="updateAll(${i})"> ${b.name}</label>`).join('')}</div><div class="quick-timer-box" style="margin-top:10px"><div class="timer-label">도핑 타이머 : <span id="buffTimerDisplay">00:00</span></div><div class="timer-btns"><button onclick="setBuffTimer(600)">10m</button><button onclick="setBuffTimer(1200)" style="color:red">20m</button><button onclick="resetBuffTimer()">리셋</button></div></div></div>
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

// 미니 팝업창을 여는 함수
function openMiniPopup() {
    const w = 300, h = 480, popup = window.open("", "MapleMini", `width=${w},height=${h},left=${window.screen.width - w - 20},top=20,scrollbars=no,resizable=yes`);
    if (!popup) return alert("⚠️ 팝업 차단이 감지되었습니다!");
    let optionsHTML = '<option value="" disabled selected>👤 캐릭터 선택</option>'; document.querySelectorAll('.tab-btn').forEach((tab, index) => { const nameInput = document.getElementById('nameInput_' + (index + 1)); optionsHTML += `<option value="${index + 1}">${nameInput ? nameInput.value : '캐릭터 ' + (index + 1)}</option>`; });
    popup.document.open(); popup.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>사냥 리모컨</title><style>body { font-family: "Pretendard", sans-serif; padding: 10px; background: #f1f2f6; margin: 0; overflow: hidden; }.mini-card { background: #1a1a2e; padding: 12px; border-radius: 15px; color: #fff; text-align: center; border: 1px solid #c9a55c; margin-bottom: 10px; }.timer-text { font-size: 32px; font-weight: 900; color: #ffd700; margin-bottom: 5px; font-family: monospace; }.btn-timer { background: rgba(255,215,0,0.1); border: 1px solid #ffd700; color: #ffd700; padding: 3px 8px; border-radius: 5px; font-size: 11px; cursor: pointer; margin: 0 2px; }#char_select { width: 100%; margin-top: 10px; background: #2d3436; color: white; border: 1px solid #555; border-radius: 5px; padding: 4px; font-size: 12px; }.input-grid { background: white; padding: 10px; border-radius: 12px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }.row { display: flex; gap: 5px; margin-bottom: 8px; }.field { flex: 1; }.field label { display: block; font-size: 10px; color: #777; font-weight: bold; margin-bottom: 2px; }.field input { width: 100%; padding: 5px; border: 1px solid #ddd; border-radius: 6px; font-size: 12px; text-align: center; box-sizing: border-box; outline: none; }.field input:focus { border-color: #6c5ce7; }.btn-record { width: 100%; padding: 12px; background: #6c5ce7; color: white; border: none; border-radius: 10px; font-weight: bold; font-size: 14px; cursor: pointer; margin-top: 5px; }.btn-clear { width: 100%; padding: 6px; background: none; color: #ff7675; border: 1px solid #ff7675; border-radius: 8px; font-size: 11px; cursor: pointer; margin-top: 8px; }</style></head><body><div class="mini-card"><div class="timer-text" id="w_timer">00:00</div><div><button class="btn-timer" onclick="window.opener.startTimer()">▶ 재생</button><button class="btn-timer" onclick="window.opener.stopOrResumeTimer()">⏸ 정지</button><button class="btn-timer" onclick="window.opener.resetTimer()">🔄 리셋</button></div><select id="char_select" onchange="loadChar(this.value)">${optionsHTML}</select></div><div id="w_content" style="text-align:center; font-size:11px; color:#999; margin-top:30px;">캐릭터를 선택해 주세요 🍁</div><script>let activeIdx = null; setInterval(() => { if (!window.opener) return; const mainT = window.opener.document.getElementById("timerDisplay"); if (mainT) document.getElementById("w_timer").innerText = mainT.innerText; }, 500); function syncToMain(field, value) { if (!activeIdx || !window.opener) return; const target = window.opener.document.getElementById(field + "_" + activeIdx); if (target) { target.value = value; window.opener.updateAll(activeIdx); } } function loadChar(idx) { activeIdx = idx; const op = window.opener, mapV = op.document.getElementById("map_" + idx).value, mesoV = op.document.getElementById("meso_" + idx).value, expV = op.document.getElementById("exp_" + idx).value, gemV = op.document.getElementById("gem_" + idx).value, fragV = op.document.getElementById("frag_" + idx).value; document.getElementById("w_content").innerHTML = \'<div class="input-grid"><div class="row"><div class="field"><label>📍 사냥터</label><input type="text" value="\' + mapV + \'" oninput="syncToMain(\\\'map\\\', this.value)"></div></div><div class="row"><div class="field"><label>💰 현재 메소</label><input type="text" value="\' + mesoV + \'" oninput="window.opener.onMeso(this); syncToMain(\\\'meso\\\', this.value)"></div><div class="field"><label>📈 현재 경험치</label><input type="number" value="\' + expV + \'" step="0.001" oninput="syncToMain(\\\'exp\\\', this.value)"></div></div><div class="row"><div class="field"><label>💎 현재 코젬</label><input type="number" value="\' + gemV + \'" oninput="syncToMain(\\\'gem\\\', this.value)"></div><div class="field"><label>🧩 현재 조각</label><input type="number" value="\' + fragV + \'" oninput="syncToMain(\\\'frag\\\', this.value)"></div></div><button class="btn-record" onclick="record()">⏱️ 30분 소재 기록</button><button class="btn-clear" onclick="resetInputs()">🗑️ 입력칸 비우기</button></div>\'; } function record() { window.opener.recordSub(activeIdx); document.body.style.background = "#d1ffd1"; setTimeout(() => { document.body.style.background = "#f1f2f6"; loadChar(activeIdx); }, 300); } function resetInputs() { if(!confirm("초기화할까요?")) return; ["map", "meso", "exp", "gem", "frag"].forEach(id => syncToMain(id, "")); loadChar(activeIdx); }<\/script></body></html>`); popup.document.close();
}

function showDetailTab(tab) { document.querySelectorAll('.detail-tab-content').forEach(el => el.style.display = 'none'); document.querySelectorAll('.detail-nav-btn').forEach(btn => btn.classList.remove('active')); const target = document.getElementById(`tab_content_${tab}`); if (target) target.style.display = 'block'; }
function switchItemPreset(num) { document.querySelectorAll('.preset-btn').forEach((btn, i) => btn.classList.toggle('active', i + 1 === num)); }
function showAlert(msg) { const alertBox = document.getElementById('customAlert'), alertMsg = document.getElementById('alertMessage'); if (!alertBox || !alertMsg) return; alertMsg.innerText = msg; alertBox.style.display = 'block'; setTimeout(() => { alertBox.style.display = 'none'; }, 3000); }
function exportData() { const d={}; for(let i=0; i<localStorage.length; i++) d[localStorage.key(i)]=localStorage.getItem(localStorage.key(i)); const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([JSON.stringify(d)],{type:"application/json"})); a.download=`maple_backup.json`; a.click(); }
function importData(e) { const r=new FileReader(); r.onload=function(ev){ const d=JSON.parse(ev.target.result); localStorage.clear(); for(const k in d)localStorage.setItem(k,d[k]); location.reload(); }; r.readAsText(e.target.files[0]); }



// ⚔️ 보스 수익 계산 함수
function calcBossProfit() {
    const partySize = Math.max(1, parseInt(document.getElementById('partySize').value) || 1);
    const totalLootStr = document.getElementById('bossTotalLoot').value.replace(/,/g, '');
    const totalLoot = parseInt(totalLootStr) || 0;

    const individualShare = Math.floor(totalLoot / partySize);
    document.getElementById('individualProfit').innerText = individualShare.toLocaleString() + " 메소";
}
