/**
 * ============================================================================
 * 🛠️ MAPLE OMNI - 옴니 빌더 전용 모듈 (builder.js)
 * 장비 시뮬레이션, 아이템 변경, 프리셋 동기화 등 빌더 관련 기능
 * ============================================================================
 */

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
        history.pushState({ page: 'builder' }, "", "#builder");

        setTimeout(() => {
            if (typeof syncEquipToBuilder === 'function') {
                syncEquipToBuilder();
            }
        }, 50);
    }
}

function closeOmniBuilder() {
    const builder = document.getElementById('omniBuilderSection');
    const searchPage = document.getElementById('searchPageContent');
    const detailTab = document.getElementById('detailTabMenu');

    if (builder) builder.style.setProperty('display', 'none', 'important');
    if (searchPage) searchPage.style.setProperty('display', 'block', 'important');
    if (detailTab) detailTab.style.setProperty('display', 'flex', 'important');

    sessionStorage.setItem('omni_current_page', 'search');
    window.scrollTo(0, 0);
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

    showItemSelectionList(slotName);

    let itemIcon = "";
    if (currentSearchData && currentSearchData.item) {
        const activeBtn = document.querySelector('.builder-preset-btn.active');
        const presetNum = activeBtn ? parseInt(activeBtn.innerText.replace(/[^0-9]/g, "")) : 1;
        let equipList = currentSearchData.item[`item_equipment_preset_${presetNum}`] || currentSearchData.item.item_equipment;
        const item = equipList.find(eq => eq.item_equipment_slot === slotName || (slotName === "상의" && eq.item_equipment_slot === "한벌옷") || (slotName === "펜던트1" && eq.item_equipment_slot === "펜던트") || (slotName === "뱃지" && eq.item_equipment_slot === "배지"));
        if (item) itemIcon = item.item_icon;
    }
    const iconBox = document.getElementById('edit_item_icon');
    if (iconBox) iconBox.innerHTML = itemIcon ? `<img src="${itemIcon}" style="width: 70%; height: 70%; object-fit: contain;">` : '<span style="font-size:24px;">🖱️</span>';
}

// 🔍 빌더 아이템 선택 목록 생성 (💡 중복 및 에러 수정 완료)
function showItemSelectionList(slotName) {
    const jobSelect = document.getElementById('builder_job_group');
    const listContainer = document.getElementById('edit_base_item'); 

    if (!listContainer) return;
    
    // 이전에 남아있던 옵션들을 아주 깨끗하게 날려버리는 코드입니다.
    listContainer.innerHTML = ''; 
    const defaultOption = document.createElement('option');
    defaultOption.value = 'none';
    defaultOption.textContent = '아이템을 선택하세요';
    listContainer.appendChild(defaultOption);

    let jobGroup = jobSelect ? jobSelect.value : "none";

    if (jobGroup === "none" && currentSearchData && currentSearchData.basic) {
        const charJob = currentSearchData.basic.character_class;
        jobGroup = getJobGroup(charJob); 
        if (jobSelect && jobGroup !== "none") jobSelect.value = jobGroup;
    }

    if (jobGroup === "none") return;

    let dbSlotName = slotName;
    
    // 악세서리 류는 DB에 없기 때문에 임시로 '상의' 장비 리스트를 보여주도록 연결해 둡니다.
    const tempSlots = ["펜던트1", "펜던트2", "얼굴장식", "눈장식", "귀고리", "반지1", "반지2", "반지3", "반지4", "벨트"];
    if (tempSlots.includes(slotName)) {
        dbSlotName = "상의"; 
    } 

    // 💡 오타 수정 완료: dbSlotName으로 제대로 검색합니다.
    if (COMMON_ARMOR_DB[jobGroup] && COMMON_ARMOR_DB[jobGroup][dbSlotName]) {
        const items = COMMON_ARMOR_DB[jobGroup][dbSlotName];
        items.forEach(itemName => {
            const option = document.createElement('option');
            option.value = itemName;
            option.textContent = itemName;
            listContainer.appendChild(option);
        });
    }
}

// 🖼️ 선택한 아이템에 맞춰 이미지와 제목 업데이트
function updateBuilderPreview() {
    const jobGroup = document.getElementById('builder_job_group')?.value;
    const itemName = document.getElementById('edit_base_item')?.value;
    const iconContainer = document.getElementById('edit_item_icon');
    const titleContainer = document.getElementById('edit_slot_name');

    if (!iconContainer || !titleContainer) return;

    if (!itemName || itemName === "none" || jobGroup === "none") {
        iconContainer.innerHTML = '<span style="font-size:24px;">🖱️</span>';
        titleContainer.textContent = "아이템을 선택하세요";
        return;
    }

    iconContainer.innerHTML = '<span style="font-size:30px;">🛡️</span>'; 
    titleContainer.textContent = itemName;
}

// 🕵️ 직업군 분류기
function getJobGroup(jobName) {
    if (!jobName) return "none";
    const warrior = ["히어로", "팔라딘", "다크나이트", "소울마스터", "미하일", "블래스터", "데몬", "아란", "카이저", "아델", "제로"];
    const magician = ["비숍", "아크메이지", "불독", "썬콜", "플레임위자드", "배틀메이지", "에반", "루미너스", "일륨", "라라", "키네시스"];
    const bowman = ["보우마스터", "신궁", "패스파인더", "윈드브레이커", "와일드헌터", "메르세데스", "카인"];
    const thief = ["나이트로드", "섀도어", "듀얼블레이드", "나이트워커", "팬텀", "카데나", "호영", "칼리"];
    const pirate = ["바이퍼", "캡틴", "캐논슈터", "스트라이커", "메카닉", "은월", "엔젤릭버스터", "아크"];
    if (warrior.some(job => jobName.includes(job))) return "전사";
    if (magician.some(job => jobName.includes(job))) return "마법사";
    if (bowman.some(job => jobName.includes(job))) return "궁수";
    if (thief.some(job => jobName.includes(job))) return "도적";
    if (pirate.some(job => jobName.includes(job))) return "해적";
    return "none";
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
        const item = equipList.find(eq => eq.item_equipment_slot === slotName || (slotName === "상의" && eq.item_equipment_slot === "한벌옷") || (slotName === "펜던트1" && eq.item_equipment_slot === "펜던트") || (slotName === "뱃지" && eq.item_equipment_slot === "배지"));
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