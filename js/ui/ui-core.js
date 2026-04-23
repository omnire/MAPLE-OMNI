/**
 * ============================================================================
 * ⚙️ [파일 이름] ui-core.js
 * * [하는 일]
 * 1. 사냥 기록 탭, 장비/스탯 탭 등 화면의 메뉴를 누를 때 화면을 바꿔주는 역할
 * 2. 화면 아래에 뿅! 하고 나타나는 까만색 알림창 (showAlert) 띄우기
 * 3. 데이터를 불러올 때 화면 전체를 덮는 빙글빙글 로딩창 (toggleLoading) 제어
 * 4. 메인 화면(포털)으로 한 번에 돌아가는 기능
 * ============================================================================
 */

/**
 * [js/ui/ui-core.js]
 * 탭을 전환할 때 해당 캐릭터의 데이터를 로드하고 사이드바를 갱신합니다.
 */
function openTab(idx) { 
    if (typeof currentIdx !== 'undefined') currentIdx = idx; 
    
    // 1. 시각적으로 탭 활성화 (버튼 색상 및 컨텐츠 표시)
    document.querySelectorAll('.content').forEach(c => c.style.display = 'none'); 
    const targetTab = document.getElementById(`tab_${idx}`);
    if (targetTab) targetTab.style.display = 'block'; 

    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active')); 
    const targetBtn = document.getElementById(`tab_btn_${idx}`);
    if (targetBtn) targetBtn.classList.add('active'); 

    sessionStorage.setItem('omni_current_tab', idx); 

    // 2. 해당 탭에 저장된 캐릭터 데이터(설정값) 불러오기
    const cfg = JSON.parse(localStorage.getItem(`maple_config_${idx}`));
    
    if (cfg) {
        // [이름 배달] 입력창에 저장된 이름을 넣습니다.
        const nameInput = document.getElementById(`nameInput_${idx}`);
        if (nameInput) nameInput.value = cfg.name || "";

        // [수치 배달] 시작 메소, 경험치, 코젬, 조각 등 저장된 값을 다시 칸에 채웁니다.
        if (cfg.currentVals) {
            for (let key in cfg.currentVals) {
                const el = document.getElementById(`${key}_${idx}`);
                if (el) el.value = cfg.currentVals[key] || "";
            }
        }

        // 3. 🚨 [핵심] 좌측 캐릭터 카드 갱신 로직
        const charName = cfg.name;
        if (charName && !charName.includes("캐릭터 ")) {
            // 이전에 검색해서 저장된 API 데이터(이미지, 전투력 등)가 있는지 확인
            const cachedData = JSON.parse(localStorage.getItem(`maple_api_search_${charName}`));
            
            if (cachedData && typeof renderSearchDetail === 'function') {
                // api.js의 배달 함수를 실행해 사이드바를 홍시추 정보로 싹 바꿉니다.
                renderSearchDetail(
                    cachedData.basic, 
                    cachedData.stat, 
                    cachedData.item, 
                    cachedData.ability, 
                    cachedData.symbol, 
                    cachedData.dojang, 
                    cachedData.union
                );
            } else {
                // 캐시가 없다면 이름만이라도 먼저 바꿔줍니다.
                const cardName = document.getElementById('profileName');
                if (cardName) cardName.innerText = charName;
                // 이미지는 기본값으로 설정
                const cardImg = document.getElementById('profileImg');
                if (cardImg) cardImg.src = "https://open.api.nexon.com/static/maplestory/Character/Default.png";
            }
        }
    }

    // 4. 사냥 기록 목록(30분 로그) 갱신
    if (typeof updateSubDisplay === 'function') updateSubDisplay(idx);
    if (typeof updateAll === 'function') updateAll(idx);
}

// 사냥 기록, 통합 기록지 등 메인 페이지를 바꿔주는 기능
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

// 장비, 스탯, 유니온 등 상세 정보 탭을 바꿔주는 기능
function showDetailTab(tabName) { 
    const containers = ['equip', 'stat', 'union', 'skill', 'coordi'];
    containers.forEach(c => {
        const el = document.getElementById(`res_${c}_container`);
        const fallbackEl = document.getElementById(`tab_content_${c}`);
        if (el) el.style.display = (c === tabName) ? 'block' : 'none';
        if (fallbackEl) fallbackEl.style.display = (c === tabName) ? 'block' : 'none';
    });

    const tabButtons = document.querySelectorAll('#detailTabMenu .nav-btn, .detail-nav-btn');
    tabButtons.forEach(btn => {
        const onclickAttr = btn.getAttribute('onclick');
        if (onclickAttr && onclickAttr.includes(`'${tabName}'`)) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// 포털(메인 홈 화면)로 즉시 돌아가는 기능
function backToPortal() {
    const portal = document.getElementById('mainPortal');
    const searchPage = document.getElementById('searchPageContent');
    const scanner = document.getElementById('omniScannerSection');
    const builder = document.getElementById('omniBuilderSection');

    if (searchPage) searchPage.style.display = 'none';
    if (scanner) scanner.style.display = 'none';
    if (builder) builder.style.display = 'none';
    if (portal) portal.style.display = 'block';

    window.history.replaceState({ page: 'main' }, null, "");
    sessionStorage.setItem('omni_current_page', 'portal');
    window.scrollTo(0, 0);
}

// 알림창 띄우기 (예: "저장되었습니다!")
function showAlert(msg) { 
    const alertBox = document.getElementById('customAlert'), alertMsg = document.getElementById('alertMessage'); 
    if (!alertBox || !alertMsg) return; 
    alertMsg.innerText = msg; 
    alertBox.style.display = 'block'; 
    setTimeout(() => { alertBox.style.display = 'none'; }, 3000); 
}

// 로딩 화면을 켜고 끄는 기능
function toggleLoading(show, message = "데이터를 불러오는 중입니다") {
    const loadingEl = document.getElementById('globalLoading');
    const textEl = document.getElementById('loadingText');
    if (loadingEl) {
        if (show) {
            if (textEl) textEl.innerText = message;
            loadingEl.style.display = 'flex';
        } else {
            setTimeout(() => { loadingEl.style.display = 'none'; }, 500);
        }
    }
}

// 🔄 동기화 (최신 정보 새로고침) 기능
async function refreshCurrentChar() {
    const charName = document.getElementById('res_profileName')?.innerText;
    if (!charName || charName === "-") return showAlert("대상 캐릭터를 찾을 수 없습니다.");
    
    // 💡 [수정] event 객체를 안전하게 불러와 브라우저 에러를 방지합니다.
    const evt = window.event;
    const refreshBtn = evt ? evt.currentTarget : null; 
    if (refreshBtn) refreshBtn.disabled = true;
    
    try {
        if(typeof searchCharacter === 'function') await searchCharacter(charName, true); 
        showAlert(`✨ ${charName} 님의 정보가 최신화되었습니다!`);
    } catch (e) { 
        showAlert("❌ 갱신에 실패했습니다."); 
    } finally { 
        if (refreshBtn) refreshBtn.disabled = false; 
    }
}