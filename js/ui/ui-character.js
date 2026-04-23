/**
 * ============================================================================
 * 👤 [파일 이름] ui-character.js 
 * * [하는 일] 
 * 1. 캐릭터 이름 옆에 있는 ⭐즐겨찾기 버튼을 누르고 해제하는 기능
 * 2. 즐겨찾기 한 캐릭터 목록을 화면에 예쁘게 그려주는 기능
 * 3. 장비창과 어빌리티창에서 프리셋(1번, 2번, 3번) 버튼을 누르면
 * 해당 프리셋에 맞는 장비와 능력치로 화면을 싹 바꿔주는 기능
 * ============================================================================
 */

// ============================================================================
// ⭐ 즐겨찾기 기능 모음
// ============================================================================
let favoriteChars = JSON.parse(localStorage.getItem('maple_favorites')) || [];

// 즐겨찾기 버튼을 눌렀을 때 실행되는 함수
function toggleFavorite() {
    const nameEl = document.getElementById('res_profileName');
    if (!nameEl) return;
    const charName = nameEl.innerText;
    if (charName === '-') return;

    // 이미 즐겨찾기에 있으면 빼고, 없으면 넣습니다.
    if (favoriteChars.includes(charName)) { 
        favoriteChars = favoriteChars.filter(n => n !== charName); 
        if (typeof showAlert === 'function') showAlert(`⭐ ${charName} 즐겨찾기 해제 완료!`); 
    } else { 
        favoriteChars.push(charName); 
        if (typeof showAlert === 'function') showAlert(`⭐ ${charName} 즐겨찾기 등록 완료!`); 
    }
    
    // 변경된 내용을 컴퓨터에 저장하고 화면을 새로고침합니다.
    localStorage.setItem('maple_favorites', JSON.stringify(favoriteChars));
    updateFavoriteBtnState(charName); 
    renderFavorites();
}

// 즐겨찾기 버튼의 색상과 글씨를 바꿔주는 함수
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

// 화면 아래쪽에 즐겨찾기 목록 네모 박스들을 그려주는 함수
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
// 🔄 장비 및 어빌리티 프리셋 전환 기능 모음
// ============================================================================

// 장비창에서 1, 2, 3 버튼을 누르면 해당 프리셋으로 바꿔주는 함수
function switchItemPreset(num) {
    // 누른 버튼만 색깔을 진하게 바꿉니다.
    document.querySelectorAll('#itemPresetBtns .preset-btn').forEach((btn, i) => { 
        btn.classList.toggle('active', i + 1 === num); 
    });
    
    // 현재 검색된 캐릭터의 데이터를 가져옵니다.
    const data = window.currentSearchData;
    if (!data || !data.item) return;
    const itemData = data.item;
    let equipList = itemData[`item_equipment_preset_${num}`] || itemData.item_equipment;
    
    const listGrid = document.getElementById('res_itemGrid') || document.getElementById('res_equipDetailList');
    let slotBox = document.getElementById('res_equip_slot_grid'); 
    
    // 무기, 모자, 옷 등 부위별 네모칸을 그릴 공간을 준비합니다.
    if (!slotBox) { 
        const powerNode = document.getElementById('res_power'); 
        if (powerNode) { 
            const parent = powerNode.parentElement; 
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
    
    // 길고 복잡한 잠재능력 글씨를 짧게 줄여주는 마법의 함수
    const shortPot = (txt) => { 
        if (!txt) return ""; 
        return txt.replace("보스 몬스터 공격 시 데미지", "보공").replace("보스 몬스터 데미지", "보공").replace("몬스터 방어율 무시", "방무").replace("크리티컬 데미지", "크뎀").replace("아이템 드롭률", "아획").replace("메소 획득량", "메획").replace("최대 HP", "HP").replace(" : ", ":"); 
    };

    // 부위별 아이콘을 네모칸 안에 그려줍니다.
    if (slotBox && equipList) {
        let gHtml = ""; 
        slotOrder.forEach(sName => {
            let item = equipList.find(eq => eq.item_equipment_slot === sName || (sName === "상의" && eq.item_equipment_slot === "한벌옷") || (sName === "펜던트1" && eq.item_equipment_slot === "펜던트") || (sName === "뱃지" && eq.item_equipment_slot === "배지"));
            if (item) { 
                let bColor = borderGradeColor[item.potential_option_grade] || "#e2e8f0"; 
                // 아이콘에 마우스를 올리면 툴팁(상세정보)이 뜨도록 연결합니다.
                gHtml += `<div onmouseenter="showTooltip(event, '${sName}', ${num})" onmousemove="moveTooltip(event)" onmouseleave="hideTooltip()" style="background:white; border-radius:8px; border:1px solid ${bColor}; display:flex; align-items:center; justify-content:center; aspect-ratio:1/1; cursor:pointer; overflow:hidden;"><img src="${item.item_icon}" style="max-width:85%; max-height:85%; object-fit:contain; pointer-events:none;"></div>`;
            } else { 
                gHtml += `<div style="background:#f1f5f9; border-radius:6px; border:1px dashed #cbd5e1; aspect-ratio:1/1;"></div>`; 
            }
        });
        slotBox.innerHTML = gHtml;
    }

    // 아이템 리스트를 길게 그려줍니다.
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
            
            listHtml += `<div onmouseenter="showTooltip(event, '${item.item_equipment_slot}', ${num})" onmousemove="moveTooltip(event)" onmouseleave="hideTooltip()" style="background:#fff; border:1px solid ${bColor}; border-radius:8px; padding:10px; display:flex; align-items:center; gap:10px; box-shadow:0 1px 2px rgba(0,0,0,0.02); cursor:pointer;"><div style="width:38px; height:38px; flex-shrink:0; background:#f8fafc; border-radius:6px; display:flex; align-items:center; justify-content:center; border:1px solid #e2e8f0; overflow:hidden;"><img src="${item.item_icon}" style="max-width:85%; max-height:85%; object-fit:contain;"></div><div style="flex:1; min-width:0;"><div style="font-weight:800; font-size:12px; color:#1e293b; margin-bottom:2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.item_name}${starHtml}</div>${potStr}</div></div>`;
        });
        listGrid.innerHTML = listHtml + `</div>`;
    }
}

// 어빌리티(능력치) 창에서 1, 2, 3 버튼을 누르면 바꿔주는 함수
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