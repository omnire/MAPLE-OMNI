/**
 * ============================================================================
 * 🚀 [파일 이름] ui-omni.js
 * * [하는 일]
 * 1. 거대한 추가 기능인 'OMNI SCANNER(비교)'와 'OMNI BUILDER(시뮬레이터)'를
 * 부드럽게 열고 닫아주는 전용 스위치
 * 2. 사용자가 스마트폰이나 브라우저에서 무심코 [뒤로가기(⬅️)] 버튼을 눌렀을 때,
 * 화면이 꼬이지 않고 예전 화면으로 자연스럽게 넘어가게 해주는 '스마트 내비게이션'
 * ============================================================================
 */

// 스캐너 열기
function openOmniScanner() {
    const scanner = document.getElementById('omniScannerSection');
    const searchContent = document.getElementById('searchPageContent');
    const nameEl = document.getElementById('res_profileName');

    if (scanner && searchContent) {
        searchContent.style.display = 'none';
        scanner.style.display = 'block';
        if (nameEl) document.getElementById('scanner_my_name').innerText = nameEl.innerText;
        
        setTimeout(() => {
            if (typeof findRealPowerRivals === 'function') {
                findRealPowerRivals();
            }
        }, 300);
        
        // 브라우저 방문 기록에 'scanner' 화면을 추가 (뒤로가기 방지용)
        window.history.pushState({ page: 'scanner' }, null, "");
        window.scrollTo(0, 0);
    }
}

// 스캐너 닫기
function closeOmniScanner() {
    if (window.history.state && window.history.state.page === 'scanner') {
        window.history.back(); 
    } else {
        document.getElementById('omniScannerSection').style.display = 'none';
        document.getElementById('searchPageContent').style.display = 'block';
    }
}

// 빌더 열기
function openOmniBuilder() {
    const searchPage = document.getElementById('searchPageContent');
    const builderSection = document.getElementById('omniBuilderSection');
    
    if (window.currentSearchData && window.currentSearchData.basic) {
        if (searchPage) searchPage.style.display = 'none';
        if (builderSection) builderSection.style.display = 'block';
        if (typeof initBuilderGrids === 'function') initBuilderGrids();
        if (typeof syncEquipToBuilder === 'function') syncEquipToBuilder();

        const charJob = window.currentSearchData.basic.character_class;
        const jobGroup = typeof getJobGroup === 'function' ? getJobGroup(charJob) : "none";
        const jobSelect = document.getElementById('builder_job_group');
        if (jobSelect && jobGroup !== "none") jobSelect.value = jobGroup;

        // 브라우저 방문 기록에 'builder' 화면을 추가
        window.history.pushState({ page: 'builder' }, null, "");
        window.scrollTo(0, 0);
    } else {
        showAlert("캐릭터 정보를 먼저 조회해야 빌더를 사용할 수 있습니다!");
    }
}

// 빌더 닫기
function closeOmniBuilder() {
    if (window.history.state && window.history.state.page === 'builder') {
        window.history.back(); 
    } else {
        document.getElementById('omniBuilderSection').style.display = 'none';
        document.getElementById('searchPageContent').style.display = 'block';
    }
}

// 브라우저 '뒤로가기' 버튼을 눌렀을 때 화면이 꼬이지 않게 잡아주는 똑똑한 함수
window.onpopstate = function(event) {
    const page = (event.state && event.state.page) ? event.state.page : 'main';
    
    const builder = document.getElementById('omniBuilderSection');
    const scanner = document.getElementById('omniScannerSection');
    const searchContent = document.getElementById('searchPageContent');
    const mainPortal = document.getElementById('mainPortal');
    
    [builder, scanner, searchContent, mainPortal].forEach(sec => { if(sec) sec.style.display = 'none'; });

    if (page === 'scanner') {
        if (scanner) scanner.style.display = 'block';
    } else if (page === 'builder') {
        if (builder) builder.style.display = 'block';
    } else if (page === 'charDetail') {
        if (searchContent) {
            searchContent.style.display = 'block';
            showDetailTab('equip');
        }
    } else {
        backToPortal();
    }
    window.scrollTo(0, 0);
};