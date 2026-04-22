/**
 * ============================================================================
 * 🎨 MAPLE OMNI - UI 및 상호작용 전용 모듈 (ui.js) - 최종 정비 완료
 * ============================================================================
 */

// ============================================================================
// 🔄 1. 기본 UI 유틸리티 (탭 및 화면 전환, 알림창)
// ============================================================================

function openTab(idx) { 
    if (typeof currentIdx !== 'undefined') currentIdx = idx; 
    document.querySelectorAll('.content').forEach(c => c.style.display = 'none'); 
    const targetTab = document.getElementById(`tab_${idx}`);
    if (targetTab) targetTab.style.display = 'block'; 

    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active')); 
    const targetBtn = document.getElementById(`tab_btn_${idx}`);
    if (targetBtn) targetBtn.classList.add('active'); 

    sessionStorage.setItem('omni_current_tab', idx); 
    const nameInput = document.getElementById(`nameInput_${idx}`);
    const charName = nameInput ? nameInput.value.trim() : "";

    if (charName && !charName.includes("캐릭터 ")) {
        const cachedData = JSON.parse(localStorage.getItem(`maple_api_hunt_${charName}`));
        if (cachedData && typeof renderHuntSidebar === 'function') renderHuntSidebar(cachedData.basic, cachedData.stat);
        else if (typeof resetHuntSidebar === 'function') resetHuntSidebar(charName);
    } else {
        if (typeof resetHuntSidebar === 'function') resetHuntSidebar(`캐릭터 ${idx}`);
    }
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

function showAlert(msg) { 
    const alertBox = document.getElementById('customAlert'), alertMsg = document.getElementById('alertMessage'); 
    if (!alertBox || !alertMsg) return; 
    alertMsg.innerText = msg; 
    alertBox.style.display = 'block'; 
    setTimeout(() => { alertBox.style.display = 'none'; }, 3000); 
}

// ============================================================================
// ⭐ 2. 캐릭터 즐겨찾기 연동
// ============================================================================
let favoriteChars = JSON.parse(localStorage.getItem('maple_favorites')) || [];

function toggleFavorite() {
    const nameEl = document.getElementById('res_profileName');
    if (!nameEl) return;
    const charName = nameEl.innerText;
    if (charName === '-') return;

    if (favoriteChars.includes(charName)) { 
        favoriteChars = favoriteChars.filter(n => n !== charName); 
        showAlert(`⭐ ${charName} 즐겨찾기 해제 완료!`); 
    } else { 
        favoriteChars.push(charName); 
        showAlert(`⭐ ${charName} 즐겨찾기 등록 완료!`); 
    }
    localStorage.setItem('maple_favorites', JSON.stringify(favoriteChars));
    updateFavoriteBtnState(charName); 
    renderFavorites();
}

function updateFavoriteBtnState(charName) {
    const btn = document.getElementById('btn_favorite');
    if (!btn) return;
    if (favoriteChars.includes(charName)) { 
        btn.style.background = '#ff9100'; 
        btn.style.color = 'white'; 
        btn.innerText = '★ 즐겨찾기 해제'; 
    } else { 
        btn.style.background = 'white'; 
        btn.style.color = '#ff9100'; 
        btn.innerText = '⭐ 즐겨찾기 추가'; 
    }
}

function renderFavorites() {
    const favBox = document.getElementById('favoriteListContainer');
    if (!favBox) return;
    if (favoriteChars.length === 0) { 
        favBox.innerHTML = '<div style="font-size: 12px; color: #94a3b8; text-align: center; padding: 20px 0;">등록 캐릭터 없음</div>'; 
        return; 
    }
    favBox.innerHTML = favoriteChars.map(name => `
        <div onclick="searchCharacter('${name}')" style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px 15px; border-radius: 10px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: 0.2s;" onmouseover="this.style.borderColor='#ff9100'; this.style.transform='translateY(-2px)';" onmouseout="this.style.borderColor='#e2e8f0'; this.style.transform='translateY(0)';">
            <span style="font-weight: 800; color: #1e293b; font-size: 13px;">${name}</span>
            <span style="font-size: 11px; color: white; background: #ff9100; padding: 3px 8px; border-radius: 12px; font-weight: bold;">조회 ➔</span>
        </div>
    `).join('');
}

// ============================================================================
// 🎨 3. 인게임 툴팁 생성 및 렌더링
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
        if (baseLev >= 150) maxStar = 25; else if (baseLev >= 140) maxStar = 25; else if (baseLev >= 130) maxStar = 20; else if (baseLev >= 120) maxStar = 15; else if (baseLev >= 100) maxStar = 8; else maxStar = 5;
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
            <div style="font-size:10px; color:#cccccc; display:grid; grid-template-columns: 1fr 1fr; gap:3px;"><span>REQ STR : 000</span><span>REQ LUK : 000</span><span>REQ DEX : 000</span><span>REQ INT : 000</span></div>
        </div>
    </div>`;

    let statsHtml = `<div style="font-size:12px; line-height:1.6; margin-bottom:12px; color: #eeeeee;"><div>장비분류 : <span style="font-weight: 700;">${part}</span></div>`;
    
    const formatStat = (name, key, isPercent = false) => {
        if (!item.item_total_option || !item.item_total_option[key] || item.item_total_option[key] === "0") return "";
        let total = item.item_total_option[key], base = item.item_base_option?.[key] || 0, add = item.item_add_option?.[key] || 0, etc = item.item_etc_option?.[key] || 0, star = item.item_starforce_option?.[key] || 0;
        let unit = isPercent ? "%" : "", isBonus = (add != 0 || etc != 0 || star != 0);
        let detail = isBonus ? ` <span style="color:#aaa;">(</span><span style="color:#fff;">${base}${unit}</span><span style="color:#2ecc71;"> +${add}${unit}</span><span style="color:#fff;"> +${etc}${unit}</span><span style="color:#ffd200;"> +${star}${unit}</span><span style="color:#aaa;">)</span>` : "";
        return `<div>${name} : <span style="color:${isBonus?'#64e2ff':'#fff'}; font-weight:700;">+${total}${unit}</span>${detail}</div>`;
    };

    statsHtml += formatStat("STR", "str"); statsHtml += formatStat("DEX", "dex"); statsHtml += formatStat("INT", "int"); statsHtml += formatStat("LUK", "luk"); statsHtml += formatStat("최대 HP", "max_hp"); statsHtml += formatStat("공격력", "attack_power"); statsHtml += formatStat("마력", "magic_power"); statsHtml += formatStat("보공", "boss_damage", true); statsHtml += formatStat("방무", "ignore_monster_armor", true); statsHtml += formatStat("올스탯", "all_stat", true); statsHtml += `</div>`;

    let potHtml = '';
    if (item.potential_option_grade) { potHtml += `<div style="border-top:1px dashed #555; padding-top:10px; margin-top:8px; font-size:12px;"><div style="color:${gradeColor[item.potential_option_grade]}; font-weight:800; margin-bottom:4px;">● 잠재옵션</div><div style="color:#fff;">${item.potential_option_1 || ''}</div><div style="color:#fff;">${item.potential_option_2 || ''}</div><div style="color:#fff;">${item.potential_option_3 || ''}</div></div>`; }
    if (item.additional_potential_option_grade) { potHtml += `<div style="border-top:1px dashed #555; padding-top:10px; margin-top:8px; font-size:12px;"><div style="color:${gradeColor[item.additional_potential_option_grade]}; font-weight:800; margin-bottom:4px;">● 에디셔널 잠재옵션</div><div style="color:#fff;">${item.additional_potential_option_1 || ''}</div><div style="color:#fff;">${item.additional_potential_option_2 || ''}</div><div style="color:#fff;">${item.additional_potential_option_3 || ''}</div></div>`; }

    return `${starHtml}${nameHtml}${subHtml}${reqHtml}${statsHtml}${potHtml}`;
}

function getOrCreateTooltip() {
    let tt = document.getElementById('itemTooltip');
    if (!tt) { tt = document.createElement('div'); tt.id = 'itemTooltip'; document.body.appendChild(tt); }
    tt.style.cssText = `display: none; position: fixed !important; background: rgba(17, 17, 17, 0.95); color: #fff; border: 2px solid #555; border-radius: 10px; padding: 15px; font-size: 12px; z-index: 99999; width: 280px; pointer-events: none; box-shadow: 0 10px 30px rgba(0,0,0,0.5); box-sizing: border-box; backdrop-filter: blur(10px); top: 0; left: 0;`;
    return tt;
}

function showTooltip(slotName, presetNum) {
    const data = window.currentSearchData;
    if (!data || !data.item) return;
    let list = data.item[`item_equipment_preset_${presetNum}`] || data.item.item_equipment;
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

function moveTooltip(event) {
    const tooltip = document.getElementById('itemTooltip');
    if (tooltip && tooltip.style.display === 'block') {
        let posX = event.clientX + 15, posY = event.clientY + 15;
        if (posX + tooltip.offsetWidth > window.innerWidth) posX = event.clientX - tooltip.offsetWidth - 20;
        if (posY + tooltip.offsetHeight > window.innerHeight) posY = window.innerHeight - tooltip.offsetHeight - 10;
        tooltip.style.left = posX + 'px'; 
        tooltip.style.top = posY + 'px';
    }
}

function hideTooltip() { 
    const tt = document.getElementById('itemTooltip'); 
    if (tt) tt.style.display = 'none'; 
}

// ============================================================================
// 🔄 4. 장비 및 어빌리티 프리셋 전환
// ============================================================================
function switchItemPreset(num) {
    document.querySelectorAll('#itemPresetBtns .preset-btn').forEach((btn, i) => { 
        btn.classList.toggle('active', i + 1 === num); 
    });
    
    const data = window.currentSearchData;
    if (!data || !data.item) return;
    const itemData = data.item;
    let equipList = itemData[`item_equipment_preset_${num}`] || itemData.item_equipment;
    
    const listGrid = document.getElementById('res_itemGrid') || document.getElementById('res_equipDetailList');
    let slotBox = document.getElementById('res_equip_slot_grid'); 
    
    if (!slotBox) { 
        const powerNode = document.getElementById('res_power'); 
        if (powerNode) { 
            const parent = powerNode.parentElement; 
            parent.innerHTML = ''; 
            slotBox = document.createElement('div'); 
            slotBox.id = 'res_equip_slot_grid'; 
            parent.appendChild(slotBox); 
        } 
    }
    
    if (slotBox) { 
        slotBox.style.cssText = "display:grid !important; grid-template-columns:repeat(5, 1fr) !important; gap:8px; padding:15px; background:#f8fafc; border-radius:12px; border:1px solid #edf2f7; width: 280px; box-sizing: border-box; margin: 0 auto 20px auto;"; 
    }

    const borderGradeColor = { "레전드리": "#bbf7d0", "유니크": "#fde68a", "에픽": "#e9d5ff", "레어": "#bae6fd" };
    const gradeColor = { "레전드리": "#15803d", "유니크": "#b45309", "에픽": "#6b21a8", "레어": "#0369a1" };
    const slotOrder = ["반지4", "펜던트2", "모자", "얼굴장식", "뱃지", "반지3", "펜던트", "눈장식", "귀고리", "엠블렘", "반지2", "무기", "상의", "어깨장식", "훈장", "반지1", "벨트", "하의", "장갑", "보조무기", "포켓 아이템", "안드로이드", "신발", "망토", "기계 심장"];
    const shortPot = (txt) => { 
        if (!txt) return ""; 
        return txt.replace("보스 몬스터 공격 시 데미지", "보공").replace("보스 몬스터 데미지", "보공").replace("몬스터 방어율 무시", "방무").replace("크리티컬 데미지", "크뎀").replace("아이템 드롭률", "아획").replace("메소 획득량", "메획").replace("최대 HP", "HP").replace(" : ", ":"); 
    };

    if (slotBox && equipList) {
        let gHtml = ""; 
        slotOrder.forEach(sName => {
            let item = equipList.find(eq => eq.item_equipment_slot === sName || (sName === "상의" && eq.item_equipment_slot === "한벌옷") || (sName === "펜던트1" && eq.item_equipment_slot === "펜던트") || (sName === "뱃지" && eq.item_equipment_slot === "배지"));
            if (item) { 
                let bColor = borderGradeColor[item.potential_option_grade] || "#e2e8f0"; 
                gHtml += `<div onmouseenter="showTooltip('${sName}', ${num})" onmousemove="moveTooltip(event)" onmouseleave="hideTooltip()" style="background:white; border-radius:8px; border:1px solid ${bColor}; display:flex; align-items:center; justify-content:center; aspect-ratio:1/1; cursor:pointer; overflow:hidden;"><img src="${item.item_icon}" style="max-width:85%; max-height:85%; object-fit:contain; pointer-events:none;"></div>`; 
            } else { 
                gHtml += `<div style="background:#f1f5f9; border-radius:6px; border:1px dashed #cbd5e1; aspect-ratio:1/1;"></div>`; 
            }
        });
        slotBox.innerHTML = gHtml;
    }

    if (listGrid && equipList) {
        let listHtml = `<div style="display:grid !important; grid-template-columns: repeat(2, 1fr) !important; gap:12px; width:100%; box-sizing: border-box; clear: both;">`;
        equipList.forEach(item => {
            let bColor = borderGradeColor[item.potential_option_grade] || "#cbd5e1";
            let starHtml = (parseInt(item.starforce) > 0) ? `<span style="color:#d97706; font-size:11px; font-weight:900; margin-left:5px;">★${item.starforce}</span>` : '';
            let potStr = "";
            const renderOptions = (grade, opt1, opt2, opt3) => { 
                if (!grade) return ""; 
                let options = [opt1, opt2, opt3].filter(Boolean).map(shortPot).join(' / '); 
                let color = gradeColor[grade] || "#475569"; 
                return `<div style="color:${color}; font-size:11px; font-weight:700; margin-top:3px; word-break:break-all; white-space:normal; line-height:1.4;"><span style="font-size:9px; background:#f1f5f9; padding:0 3px; border-radius:3px; margin-right:4px; border:1px solid ${color}33; display:inline-block; vertical-align:middle;">${grade.charAt(0)}</span><span style="vertical-align:middle;">${options}</span></div>`; 
            };
            potStr += renderOptions(item.potential_option_grade, item.potential_option_1, item.potential_option_2, item.potential_option_3);
            potStr += renderOptions(item.additional_potential_option_grade, item.additional_potential_option_1, item.additional_potential_option_2, item.additional_potential_option_3);
            listHtml += `<div onmouseenter="showTooltip('${item.item_equipment_slot}', ${num})" onmousemove="moveTooltip(event)" onmouseleave="hideTooltip()" style="background:#fff; border:1px solid ${bColor}; border-radius:8px; padding:10px; display:flex; align-items:center; gap:10px; box-shadow:0 1px 2px rgba(0,0,0,0.02); cursor:pointer;"><div style="width:38px; height:38px; flex-shrink:0; background:#f8fafc; border-radius:6px; display:flex; align-items:center; justify-content:center; border:1px solid #e2e8f0; overflow:hidden;"><img src="${item.item_icon}" style="max-width:85%; max-height:85%; object-fit:contain;"></div><div style="flex:1; min-width:0;"><div style="font-weight:800; font-size:12px; color:#1e293b; margin-bottom:2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.item_name}${starHtml}</div>${potStr}</div></div>`;
        });
        listGrid.innerHTML = listHtml + `</div>`;
    }
}

function switchAbilityPreset(num) {
    document.querySelectorAll('#abilityPresetBtns .preset-btn').forEach((btn, i) => { 
        btn.style.background = (i + 1 === num) ? '#e2e8f0' : 'transparent'; 
        btn.style.color = (i + 1 === num) ? '#1e293b' : '#94a3b8'; 
    });
    const data = window.currentSearchData;
    if (!data || !data.ability) return;
    const abiData = data.ability;
    let targetPreset = abiData[`ability_preset_${num}`] || abiData; 
    const abiList = document.getElementById('res_equip_ability');
    const fame = abiData.remain_fame ? Number(abiData.remain_fame).toLocaleString() : '0';
    
    let html = `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid #cbd5e1; padding-bottom:10px;"><span style="color:#475569; font-size:12px; font-weight:700;">보유 명성치</span><span style="color:#0f172a; font-size:13px; font-weight:800;">${fame}</span></div>`;
    
    if (targetPreset && targetPreset.ability_info) {
        html += targetPreset.ability_info.map((a) => {
            let color = "#475569"; 
            if(a.ability_grade === "레전드리") color = "#15803d"; 
            else if(a.ability_grade === "유니크") color = "#b45309"; 
            else if(a.ability_grade === "에픽") color = "#6b21a8"; 
            else if(a.ability_grade === "레어") color = "#0369a1";
            return `<div style="display:flex; align-items:center; gap:10px; margin-bottom:6px; background:#f8fafc; padding:10px 15px; border-radius:8px; border:1px solid #e2e8f0;"><span style="color:${color}; font-weight:900; font-size:11px; min-width:60px;">${a.ability_grade}</span><span style="color:#1e293b; font-size:12px; font-weight:600; word-break:keep-all; line-height:1.4;">${a.ability_value}</span></div>`;
        }).join('');
        if(abiList) abiList.innerHTML = html;
    }
}

// ============================================================================
// 🛰️ 5. 기타 유틸리티 (로딩, 동기화)
// ============================================================================
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

async function refreshCurrentChar() {
    const charName = document.getElementById('res_profileName')?.innerText;
    if (!charName || charName === "-") return showAlert("대상 캐릭터를 찾을 수 없습니다.");
    
    const refreshBtn = event.currentTarget; 
    refreshBtn.disabled = true;
    try {
        if(typeof searchCharacter === 'function') await searchCharacter(charName, true); 
        showAlert(`✨ ${charName} 님의 정보가 최신화되었습니다!`);
    } catch (e) { 
        showAlert("❌ 갱신에 실패했습니다."); 
    } finally { 
        refreshBtn.disabled = false; 
    }
}

// ============================================================================
// 🚀 6. OMNI SCANNER / BUILDER 스마트 뒤로가기 엔진
// ============================================================================

/* 🔍 [스캐너 제어] 스캐너 창을 열고 라이벌 추천 기능을 가동합니다. */
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

        window.history.pushState({ page: 'scanner' }, null, "");
        window.scrollTo(0, 0);
    }
}

function closeOmniScanner() {
    if (window.history.state && window.history.state.page === 'scanner') {
        window.history.back(); 
    } else {
        document.getElementById('omniScannerSection').style.display = 'none';
        document.getElementById('searchPageContent').style.display = 'block';
    }
}

/* 🛠️ [빌더 제어] 빌더 창을 엽니다. */
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

        window.history.pushState({ page: 'builder' }, null, "");
        window.scrollTo(0, 0);
    } else {
        showAlert("캐릭터 정보를 먼저 조회해야 빌더를 사용할 수 있습니다!");
    }
}

function closeOmniBuilder() {
    if (window.history.state && window.history.state.page === 'builder') {
        window.history.back(); 
    } else {
        document.getElementById('omniBuilderSection').style.display = 'none';
        document.getElementById('searchPageContent').style.display = 'block';
    }
}

/* 🚀 브라우저 뒤로가기 통합 감지 시스템 */
window.onpopstate = function(event) {
    const page = (event.state && event.state.page) ? event.state.page : 'main';
    
    const builder = document.getElementById('omniBuilderSection');
    const scanner = document.getElementById('omniScannerSection');
    const searchContent = document.getElementById('searchPageContent');
    const mainPortal = document.getElementById('mainPortal');
    
    // 모든 구역 숨기기 (초기화)
    [builder, scanner, searchContent, mainPortal].forEach(sec => { if(sec) sec.style.display = 'none'; });

    // 기록에 맞는 화면 띄우기
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

// 💡 안전 장치: 전역 변수 초기화 등 필요한 폴백 로직만 남김
(function() {
    window._uiScriptLoaded = true;
})();