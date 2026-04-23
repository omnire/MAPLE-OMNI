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

// 1. 빌더 열기
function openOmniBuilder() {
    sessionStorage.setItem('omni_current_page', 'omniBuilderSection');
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

// 2. 빌더 닫기
function closeOmniBuilder() {
    sessionStorage.setItem('omni_current_page', 'searchPageContent');
    const builder = document.getElementById('omniBuilderSection');
    const searchPage = document.getElementById('searchPageContent');
    const detailTab = document.getElementById('detailTabMenu');

    if (builder) builder.style.setProperty('display', 'none', 'important');
    if (searchPage) searchPage.style.setProperty('display', 'block', 'important');
    if (detailTab) detailTab.style.setProperty('display', 'flex', 'important');

    sessionStorage.setItem('omni_current_page', 'searchPageContent');
    window.scrollTo(0, 0);
}

// 3. 그리드 생성 및 이벤트 바인딩
function initBuilderGrids() {
    const currentGrid = document.getElementById('builder_current_grid');
    const targetGrid = document.getElementById('builder_target_grid');
    
    if (!currentGrid || currentGrid.children.length > 0) return;

    MAPLE_SLOT_NAMES.forEach((slotName, i) => {
        const slotC = document.createElement('div');
        if (slotName) {
            slotC.className = 'builder-slot-static';
            slotC.innerText = slotName;
            slotC.onmouseover = (e) => { if(typeof showBuilderItemTooltip === 'function') showBuilderItemTooltip(e, slotName); };
            slotC.onmousemove = (e) => { if(typeof moveTooltip === 'function') moveTooltip(e); }; 
            slotC.onmouseout = () => { if(typeof hideTooltip === 'function') hideTooltip(); }; 
        } else {
            slotC.className = 'slot-empty'; 
        }
        currentGrid.appendChild(slotC);

        const slotT = document.createElement('div');
        if (slotName) {
            slotT.className = 'builder-slot-active';
            slotT.innerText = slotName;
            slotT.onclick = () => selectBuilderSlot(i); 
            slotT.onmouseover = (e) => { if(typeof showBuilderItemTooltip === 'function') showBuilderItemTooltip(e, slotName); };
            slotT.onmousemove = (e) => { if(typeof moveTooltip === 'function') moveTooltip(e); }; 
            slotT.onmouseout = () => { if(typeof hideTooltip === 'function') hideTooltip(); }; 
        } else {
            slotT.className = 'slot-empty'; 
        }
        targetGrid.appendChild(slotT);
    });
}

// 4. 슬롯 선택 시 에디터 로직
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
    const data = window.currentSearchData;
    if (data && data.item) {
        const activeBtn = document.querySelector('.builder-preset-btn.active');
        const presetNum = activeBtn ? parseInt(activeBtn.innerText.replace(/[^0-9]/g, "")) : 1;
        let equipList = data.item[`item_equipment_preset_${presetNum}`] || data.item.item_equipment;
        const item = equipList.find(eq => eq.item_equipment_slot === slotName || (slotName === "상의" && eq.item_equipment_slot === "한벌옷") || (slotName === "펜던트1" && eq.item_equipment_slot === "펜던트") || (slotName === "뱃지" && eq.item_equipment_slot === "배지"));
        if (item) itemIcon = item.item_icon;
    }
    const iconBox = document.getElementById('edit_item_icon');
    if (iconBox) iconBox.innerHTML = itemIcon ? `<img src="${itemIcon}" style="width: 70%; height: 70%; object-fit: contain;">` : '<span style="font-size:24px;">🖱️</span>';
}

// 5. 아이템 목록 생성
function showItemSelectionList(slotName) {
    const jobSelect = document.getElementById('builder_job_group');
    const listContainer = document.getElementById('edit_base_item'); 

    if (!listContainer) return;
    
    listContainer.innerHTML = '<option value="none">아이템을 선택하세요</option>';

    const data = window.currentSearchData;
    let jobGroup = jobSelect ? jobSelect.value : "none";

    if (jobGroup === "none" && data && data.basic) {
        jobGroup = getJobGroup(data.basic.character_class);
        if (jobSelect) jobSelect.value = jobGroup;
    }

    let dbSlotName = slotName.replace(/[0-9]/g, "").trim();

    if (typeof COMMON_ARMOR_DB !== 'undefined') {
        const jobItems = COMMON_ARMOR_DB[jobGroup] ? COMMON_ARMOR_DB[jobGroup][dbSlotName] : null;
        const commonItems = COMMON_ARMOR_DB["공통"] ? COMMON_ARMOR_DB["공통"][dbSlotName] : null;
        const items = jobItems || commonItems;
        
        if (items && items.length > 0) {
            items.forEach(itemName => {
                const option = document.createElement('option');
                option.value = itemName; 
                option.textContent = itemName;
                listContainer.appendChild(option);
            });
            if (typeof updateBuilderPreview === 'function') updateBuilderPreview();
        } else {
            listContainer.innerHTML = '<option value="none">데이터 없음</option>';
        }
    }
}

function updateBuilderPreview() {
    const itemName = document.getElementById('edit_base_item')?.value;
    const iconContainer = document.getElementById('edit_item_icon');
    const titleContainer = document.getElementById('edit_slot_name');

    if (!iconContainer) return;

    if (!itemName || itemName === "none") {
        iconContainer.innerHTML = '<span style="font-size:24px;">🖱️</span>';
        return;
    }

    let foundIcon = "";
    const data = window.currentSearchData;
    if (data && data.item) {
        const allItems = [...data.item.item_equipment, ...(data.item.item_equipment_preset_1 || []), ...(data.item.item_equipment_preset_2 || []), ...(data.item.item_equipment_preset_3 || [])];
        const match = allItems.find(it => it.item_name === itemName);
        if (match) foundIcon = match.item_icon;
    }

    const finalIconUrl = foundIcon || `https://open.api.nexon.com/static/maplestory/itemIcon/${encodeURIComponent(itemName)}.png`;

    iconContainer.innerHTML = `
        <img src="${finalIconUrl}" 
             alt="${itemName}"
             style="width: 42px; height: 42px; object-fit: contain; display: block; margin: auto;" 
             onerror="this.onerror=null; this.src='https://open.api.nexon.com/static/maplestory/Character/Default.png';">
    `;
    
    if (titleContainer) titleContainer.textContent = itemName;
}

// 7. 직업군 판별 로직
function getJobGroup(jobName) {
    if (!jobName) return "none";
    
    const warrior = ["히어로", "팔라딘", "다크나이트", "소울마스터", "미하일", "블래스터", "데몬", "아란", "카이저", "아델", "제로", "전사", "렌"];
    const magician = ["비숍", "아크메이지", "불독", "썬콜", "플레임위자드", "배틀메이지", "에반", "루미너스", "일륨", "라라", "키네시스", "마법사"];
    const bowman = ["보우마스터", "신궁", "패스파인더", "윈드브레이커", "와일드헌터", "메르세데스", "카인", "궁수"];
    const thief = ["나이트로드", "섀도어", "듀얼블레이드", "나이트워커", "팬텀", "카데나", "호영", "칼리", "도적"];
    const pirate = ["바이퍼", "캡틴", "캐논슈터", "스트라이커", "메카닉", "은월", "엔젤릭버스터", "아크", "해적"];
    
    if (warrior.some(job => jobName.includes(job))) return "전사";
    if (magician.some(job => jobName.includes(job))) return "마법사";
    if (bowman.some(job => jobName.includes(job))) return "궁수";
    if (thief.some(job => jobName.includes(job))) return "도적";
    if (pirate.some(job => jobName.includes(job))) return "해적";
    
    return "none";
}

// 8. 프리셋 전환
function changeBuilderPreset(num) {
    const btns = document.querySelectorAll('.builder-preset-btn');
    btns.forEach((btn) => {
        btn.classList.remove('active');
        btn.style.background = "transparent";
        btn.style.color = "#64748b";
    });
    const activeBtn = btns[num - 1];
    if (activeBtn) {
        activeBtn.classList.add('active');
        activeBtn.style.background = "#ffffff";
        activeBtn.style.color = "#ff9100";
    }
    syncEquipToBuilder(num);
}

// 9. 장비 데이터 동기화
function syncEquipToBuilder(presetNum = 1) {
    const data = window.currentSearchData;
    if (!data || !data.item) return;
    const itemData = data.item;
    let equipList = itemData[`item_equipment_preset_${presetNum}`];
    if (!equipList || equipList.length === 0) equipList = itemData.item_equipment;
    const currentSlots = document.querySelectorAll('#builder_current_grid .builder-slot-static, #builder_current_grid .slot-empty');
    const targetSlots = document.querySelectorAll('#builder_target_grid .builder-slot-active, #builder_target_grid .slot-empty');

    MAPLE_SLOT_NAMES.forEach((slotName, idx) => {
        if (!slotName) return; 
        const item = equipList.find(eq => eq.item_equipment_slot === slotName || (slotName === "상의" && eq.item_equipment_slot === "한벌옷") || (slotName === "펜던트1" && eq.item_equipment_slot === "펜던트") || (slotName === "뱃지" && eq.item_equipment_slot === "배지"));
        
        const curSlot = currentSlots[idx];
        const tarSlot = targetSlots[idx];

        if (item) {
            const imgHtml = `<img src="${item.item_icon}" style="width: 92%; height: 92%; object-fit: contain; pointer-events: none;">`;
            if (curSlot && !curSlot.classList.contains('slot-empty')) {
                curSlot.innerHTML = imgHtml;
                curSlot.style.color = "transparent";
            }
            if (tarSlot && !tarSlot.classList.contains('slot-empty')) {
                tarSlot.innerHTML = imgHtml;
                tarSlot.style.color = "transparent";
            }
        }
    });
    updateLivePower(); // 데이터 동기화 후 실시간 전투력 갱신
}

// 10. 실시간 전투력 수치 업데이트 (지능형 직업군 스탯 감지 추가)
function updateLivePower() {
    const data = window.currentSearchData;
    if (!data || !data.stat || !data.basic) return;
    
    const { stat, item, basic } = data;
    const jobGroup = getJobGroup(basic.character_class);
    
    let activePreset = 1;
    const activeBtn = document.querySelector('.builder-preset-btn.active');
    if (activeBtn) activePreset = parseInt(activeBtn.innerText.replace(/[^0-9]/g, ""));

    let basePower = 0;
    const powerObj = stat.final_stat.find(s => s.stat_name === "전투력");
    if (powerObj) basePower = Number(String(powerObj.stat_value).replace(/,/g, ''));

    let calculatedPower = basePower; 
    const presetItems = item[`item_equipment_preset_${activePreset}`] || item.item_equipment;
    
    if (presetItems && presetItems.length > 0) {
        calculatedPower = calculatePresetPower(basePower, presetItems, jobGroup);
    }

    const buildPowerDisp = document.getElementById('build_total_power'); 
    if (buildPowerDisp) {
        const diff = calculatedPower - basePower;
        buildPowerDisp.innerText = (diff >= 0 ? "+ " : "- ") + Math.abs(diff).toLocaleString();
        buildPowerDisp.style.color = diff >= 0 ? "#ff9100" : "#ef4444";
    }
}

// 11. 시뮬레이션 계산 로직 (주스탯/공격력 감지)
function calculatePresetPower(basePower, items, jobGroup) {
    let totalMainStat = 0;
    let totalAtkPower = 0;
    
    // 마법사라면 INT와 마력, 그 외엔 직업별 주스탯과 공격력을 봅니다.
    const isMagician = jobGroup === "마법사";

    items.forEach(item => {
        if (item.item_total_option) {
            if (isMagician) {
                totalMainStat += (Number(item.item_total_option.int) || 0);
                totalAtkPower += (Number(item.item_total_option.magic_power) || 0);
            } else {
                // 전사/궁수/도적/해적 공통 처리 (단순화된 시뮬레이션 공식)
                const main = (Number(item.item_total_option.str) || 0) + (Number(item.item_total_option.dex) || 0) + (Number(item.item_total_option.luk) || 0);
                totalMainStat += main;
                totalAtkPower += (Number(item.item_total_option.attack_power) || 0);
            }
        }
    });
    
    const finalSimulatedPower = basePower + (totalMainStat * 1.1 + totalAtkPower * 14.8) * 100; 
    return Math.floor(finalSimulatedPower);
}