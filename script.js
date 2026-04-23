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

// 🚪 화면 이동 및 라우팅 (중앙 통제 시스템 omniSwitchPage로 일원화)
window.backToPortal = function(isPopState = false) {
    if(typeof window.omniSwitchPage === 'function') window.omniSwitchPage('mainPortal');
    window.scrollTo(0, 0); 
    if (!isPopState) history.pushState({ page: 'portal' }, "", "#portal");
};

window.startApp = function(isPopState = false) {
    if(typeof window.omniSwitchPage === 'function') window.omniSwitchPage('appContent');
    // 사냥 모드 내부 상태(탭, 페이지) 복구 - 사냥 모드가 안 튕기는 비결!
    if(typeof showPage === 'function') showPage(sessionStorage.getItem('omni_nav_page') || 1);
    if(typeof openTab === 'function') openTab(parseInt(sessionStorage.getItem('omni_current_tab')) || 1);
    if (!isPopState) history.pushState({ page: 'hunt' }, "", "#hunt");
};

window.openSearchPage = function(isPopState = false) {
    if(typeof window.omniSwitchPage === 'function') window.omniSwitchPage('searchPageContent');
    if (!isPopState) history.pushState({ page: 'search' }, "", "#search");
};


// 🚀 앱 초기화 로직 (시작 지점)
window.addEventListener('DOMContentLoaded', () => {
    // 1. 사냥 기록 판떼기(HTML)부터 사냥 모드처럼 즉시 그립니다.
    init(); 
    
    // 2. 부가 기능들 0.1~0.3초 간격으로 로딩
    setTimeout(() => { if(typeof renderAttendance === 'function') renderAttendance(); }, 100); 
    setTimeout(() => { if(typeof renderBossPresets === 'function') renderBossPresets(); }, 200); 
    setTimeout(() => { if(typeof renderFavorites === 'function') renderFavorites(); }, 300);

    // 3. [수정됨] 검색어 가로채기 (엔진과 이름 맞춤)
    const checkApi = setInterval(() => {
        if (typeof window.searchCharacter === 'function' && !window._searchInterceptor) {
            const originalSearch = window.searchCharacter;
            window.searchCharacter = async function(name, isForce) {
                const input = typeof name === 'string' ? name : document.getElementById('portalSearchInput')?.value.trim();
                // 엔진이 사용하는 이름인 'maple_last_search'로 통일해서 저장합니다.
                if (input) {
                    localStorage.setItem('maple_last_search', input);
                    sessionStorage.setItem('omni_last_search', input);
                }
                return await originalSearch(name, isForce);
            };
            window._searchInterceptor = true;
            clearInterval(checkApi);
        }
    }, 100);

    // 💡 [중요] 기존의 복잡했던 if(lastPage === 'hunt') 로직은 
    // 이제 index.html의 철벽 엔진이 0.05초 만에 처리하므로 여기서는 삭제하여 충돌을 막습니다.
});

// 🛠️ 사냥 기록 시스템 초기화 (HTML 생성)
function init() {
    const container = document.getElementById('charContents'), 
          tabList = document.getElementById('tabContainer'), 
          histTabList = document.getElementById('historyTabContainer');
    
    if(!container) return;
    container.innerHTML = ""; tabList.innerHTML = ""; histTabList.innerHTML = "";
    
    // 현재 활성화된 탭 번호를 가져옵니다.
    const currentIdx = parseInt(sessionStorage.getItem('omni_current_tab')) || 1;
    
    for(let i=1; i<=4; i++) {
        const savedName = (JSON.parse(localStorage.getItem(`maple_config_${i}`)) || {}).name || `캐릭터 ${i}`;
        
        // 상단 탭 버튼
        tabList.innerHTML += `<button class="tab-btn ${i===currentIdx?'active':''}" id="tab_btn_${i}" onclick="openTab(${i})">${savedName}</button>`;
        histTabList.innerHTML += `<button class="nav-btn ${i===currentIdx?'active':''}" id="hist_tab_btn_${i}" onclick="openHistTab(${i})">${savedName}</button>`;
        
        // 사냥 모드 상세 본문 (사용자님의 코드를 단 한 줄도 빠짐없이 그대로 유지)
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
                <div id="details_${i}" class="details-panel"><div class="stat-section"><h4>메소 획득량</h4>${(typeof statItems !== 'undefined' ? statItems : []).map((s, idx)=>`<div class="stat-row"><span>${s}</span><input type="number" id="m_stat_${idx}_${i}" value="0" oninput="updateAll(${i})"></div>`).join('')}</div><div class="stat-section"><h4>아이템 드랍률</h4>${(typeof statItems !== 'undefined' ? statItems : []).map((s, idx)=>`<div class="stat-row"><span>${s}</span><input type="number" id="d_stat_${idx}_${i}" value="0" oninput="updateAll(${i})"></div>`).join('')}</div></div>
                <div class="check-area"><div class="check-title">💊 사냥 도핑 체크리스트</div><div class="doping-grid">${(typeof buffs !== 'undefined' ? buffs : []).map((b, idx) => `<label><input type="checkbox" id="chk_${idx}_${i}" onchange="updateAll(${i})"> ${b.name}</label>`).join('')}</div><div class="quick-timer-box" style="margin-top:10px"><div class="timer-label">도핑 타이머 : <span id="buffTimerDisplay">00:00</span></div><div class="timer-btns"><button onclick="setBuffTimer(600)">10m</button><button onclick="setBuffTimer(1200)" style="color:red">20m</button><button onclick="resetBuffTimer()">리셋</button></div></div></div>
                <div class="input-row" style="background:#fcfcfc; padding:15px; border-radius:12px; border:1px solid #eee; margin-bottom:10px;"><div class="input-box"><label>📍 현재 사냥터</label><input type="text" id="map_${i}" placeholder="사냥터 입력"></div><div class="input-box"><label>💰 현재 메소</label><input type="text" id="meso_${i}" oninput="onMeso(this); updateAll(${i});"></div><div class="input-box"><label>📈 현재 경험치</label><input type="number" id="exp_${i}" step="0.001" oninput="updateAll(${i})"></div><div class="input-box"><label>💎 현재 코젬</label><input type="number" id="gem_${i}" oninput="updateAll(${i})"></div><div class="input-box"><label>🧩 현재 조각</label><input type="number" id="frag_${i}" oninput="updateAll(${i})"></div></div>
                <button onclick="openOcrModal()" style="width:100%; padding:14px; background: #ffffff; color:var(--primary); border:1.5px solid var(--primary); border-radius:12px; cursor:pointer; font-size:13px; margin-bottom:20px; font-weight:bold; display:flex; align-items:center; justify-content:center; gap:8px;"><span>📸</span> 스크린샷으로 재획 기록 자동 입력</button>
                <div class="sell-section"><div class="sell-header"><b>🛍️ 이번 회차 부수입 판매</b><button class="btn-add-sell" onclick="addSellRow(${i})">+ 추가</button></div><div id="sellContainer_${i}"><div class="sell-row"><select><option value="" disabled selected>물품 선택</option>${(typeof sellItems !== 'undefined' ? sellItems : []).map(it=>`<option value="${it}">${it}</option>`).join('')}</select><input type="number" placeholder="개수" oninput="calcSellSum(${i})"><input type="text" placeholder="판매 금액" oninput="onMeso(this); calcSellSum(${i})"><button class="btn-del-row" onclick="this.parentElement.remove(); calcSellSum(${i});">×</button></div></div><div style="text-align:right; margin-top:10px; font-weight:bold; color:var(--warn);">총 판매 합계: <span id="sellTotalDisplay_${i}">0</span> 메소</div></div>
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
function goHuntHome() {
    // 직접 display를 끄지 않고 감독관(omniSwitchPage)에게 부탁합니다.
    if (typeof window.omniSwitchPage === 'function') {
        window.omniSwitchPage('appContent');
        showAlert("🏠 사냥 기록 입력 화면으로 돌아왔습니다.");
    } else {
        location.href = 'index.html';
    }
}