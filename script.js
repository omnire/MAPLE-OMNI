/**
 * ============================================================================
 * 🌟 MAPLE OMNI - 코어 실행 스크립트 (script.js) - 새로고침 복구 완전판
 * 앱의 진입점(Entry Point)입니다. 페이지 이동과 초기화를 담당합니다.
 * ============================================================================
 */

// 🌐 현재 검색된 캐릭터 데이터를 저장하는 전역 변수
let currentSearchData = null; 

// 📅 오늘 날짜 문자열 반환 유틸
function getTodayStr() {
    const today = new Date();
    return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
}

// ============================================================================
// 🚪 화면 이동 및 라우팅 (포털 ↔ 사냥 ↔ 검색 ↔ 빌더)
// ============================================================================
window.backToPortal = function(isPopState = false) {
    const ids = ['appContent', 'searchPageContent', 'detailTabMenu', 'omniBuilderSection'];
    ids.forEach(id => { const el = document.getElementById(id); if (el) el.style.setProperty('display', 'none', 'important'); });
    const portal = document.getElementById('mainPortal');
    if (portal) portal.style.setProperty('display', 'block', 'important'); 
    sessionStorage.setItem('omni_current_page', 'portal'); 
    window.scrollTo(0, 0); 
    if (!isPopState) history.pushState({ page: 'portal' }, "", "#portal");
};

window.startApp = function(isPopState = false) {
    const ids = ['mainPortal', 'searchPageContent', 'omniBuilderSection'];
    ids.forEach(id => { const el = document.getElementById(id); if (el) el.style.setProperty('display', 'none', 'important'); });
    const app = document.getElementById('appContent');
    if (app) app.style.setProperty('display', 'flex', 'important');
    sessionStorage.setItem('omni_current_page', 'hunt'); 
    showPage(sessionStorage.getItem('omni_nav_page') || 1);
    openTab(parseInt(sessionStorage.getItem('omni_current_tab')) || 1);
    if (!isPopState) history.pushState({ page: 'hunt' }, "", "#hunt");
};

window.openSearchPage = function(isPopState = false) {
    const ids = ['mainPortal', 'appContent', 'omniBuilderSection'];
    ids.forEach(id => { const el = document.getElementById(id); if (el) el.style.setProperty('display', 'none', 'important'); });
    const search = document.getElementById('searchPageContent');
    if (search) search.style.setProperty('display', 'block', 'important');
    
    // 💡 [수정됨] 무조건 Placeholder를 강제로 켜던 코드를 삭제했습니다. 
    // 이제 데이터가 있으면 안내문구가 켜지지 않고 정상적으로 데이터를 보여줍니다.

    sessionStorage.setItem('omni_current_page', 'search'); 
    if (!isPopState) history.pushState({ page: 'search' }, "", "#search");
};

// 🔙 뒤로가기 이벤트 감지
window.addEventListener('popstate', (event) => {
    if (event.state && event.state.page) {
        if (event.state.page === 'hunt') window.startApp(true);
        else if (event.state.page === 'search') window.openSearchPage(true);
        else if (event.state.page === 'charDetail') {
            window.openSearchPage(true); 
            if (typeof showDetailTab === 'function') showDetailTab('equip'); 
            const scanner = document.getElementById('omniScannerSection');
            const builder = document.getElementById('omniBuilderSection');
            if (scanner) scanner.style.setProperty('display', 'none', 'important');
            if (builder) builder.style.setProperty('display', 'none', 'important');
        }
        else if (event.state.page === 'scanner') {
            const search = document.getElementById('searchPageContent');
            const scanner = document.getElementById('omniScannerSection');
            if (search) search.style.setProperty('display', 'none', 'important');
            if (scanner) scanner.style.setProperty('display', 'block', 'important');
        }
        else if (event.state.page === 'builder') { 
            if(typeof openOmniBuilder === 'function') openOmniBuilder(); 
        }
        else window.backToPortal(true);
    } else window.backToPortal(true);
});

// ============================================================================
// 🚀 앱 초기화 로직 (시작 지점)
// ============================================================================
window.addEventListener('DOMContentLoaded', () => {
    init(); // HTML 찍어내기
    
    setTimeout(() => { if(typeof renderAttendance === 'function') renderAttendance(); }, 100); 
    setTimeout(() => { if(typeof renderBossPresets === 'function') renderBossPresets(); }, 200); 
    setTimeout(() => { if(typeof renderFavorites === 'function') renderFavorites(); }, 300);

    // 🔥 [핵심 추가] 캐릭터를 검색할 때마다 브라우저가 이름을 자동 기억하도록 스파이를 심습니다.
    const checkApi = setInterval(() => {
        if (typeof window.searchCharacter === 'function' && !window._searchInterceptor) {
            const originalSearch = window.searchCharacter;
            window.searchCharacter = async function(name, isForce) {
                const input = typeof name === 'string' ? name : document.getElementById('portalSearchInput')?.value.trim();
                if (input) sessionStorage.setItem('omni_last_search', input);
                return await originalSearch(name, isForce);
            };
            window._searchInterceptor = true;
            clearInterval(checkApi);
        }
    }, 100);

    const lastPage = sessionStorage.getItem('omni_current_page');
    if (lastPage === 'hunt') { 
        window.startApp(true); 
        history.replaceState({ page: 'hunt' }, "", "#hunt"); 
    } 
    else if (lastPage === 'search' || lastPage === 'charDetail') {
        window.openSearchPage(true); 
        history.replaceState({ page: 'charDetail' }, "", "#search"); 
        
        // 💾 저장된 이름으로 캐시 데이터를 즉시 복구합니다.
        const lastSearch = sessionStorage.getItem('omni_last_search');
        let dataRestored = false;
        
        if (lastSearch) {
            const cachedData = JSON.parse(localStorage.getItem(`maple_api_search_${lastSearch}`));
            if (cachedData && typeof renderSearchDetail === 'function') {
                // 화면 복구용 딜레이 (HTML 구조가 먼저 잡힐 시간을 줌)
                setTimeout(() => {
                    renderSearchDetail(cachedData.basic, cachedData.stat, cachedData.item, cachedData.ability, cachedData.symbol, cachedData.dojang, cachedData.union);
                    
                    // Placeholder(안내문구)를 확실하게 끄고 상세창을 켭니다.
                    const ph = document.getElementById('searchPlaceholder');
                    const detail = document.getElementById('charDetailContainer');
                    if (ph) ph.style.setProperty('display', 'none', 'important');
                    if (detail) detail.style.setProperty('display', 'grid', 'important');
                }, 50);
                dataRestored = true;
            }
        }
        
        // 캐시 데이터가 없으면 안내문구 표시
        if (!dataRestored) {
            const ph = document.getElementById('searchPlaceholder');
            if (ph) ph.style.setProperty('display', 'block', 'important');
        }

    } else { 
        window.backToPortal(true); 
        history.replaceState({ page: 'portal' }, "", "#portal"); 
    }
});

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
    if(typeof loadData === 'function') loadData(); 
    if(typeof fetchRanking === 'function') fetchRanking();
}

function exportData() { const d={}; for(let i=0; i<localStorage.length; i++) d[localStorage.key(i)]=localStorage.getItem(localStorage.key(i)); const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([JSON.stringify(d)],{type:"application/json"})); a.download=`maple_backup.json`; a.click(); }
function importData(e) { const r=new FileReader(); r.onload=function(ev){ const d=JSON.parse(ev.target.result); localStorage.clear(); for(const k in d)localStorage.setItem(k,d[k]); location.reload(); }; r.readAsText(e.target.files[0]); }
function goHuntHome() { const elApp = document.getElementById('appContent'); const elBuilder = document.getElementById('omniBuilderSection'); if (elBuilder && elBuilder.style.display !== 'none') { closeOmniBuilder(); } else if (elApp && elApp.style.display !== 'none') { showPage(1); showAlert("🏠 사냥 기록 입력 화면으로 돌아왔습니다."); } else { location.href = 'index.html'; } }