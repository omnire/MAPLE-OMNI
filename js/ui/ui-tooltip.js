/**
 * ============================================================================
 * 🎨 [파일 이름] ui-tooltip.js 
 * * [하는 일] 
 * 1. 게임 내 아이템에 마우스를 올렸을 때 뜨는 '상세 정보창(툴팁)'을 만듭니다.
 * 2. 스타포스(별), 잠재능력 색상, 추가옵션 등을 계산해서 예쁘게 보여줍니다.
 * 3. 마우스 커서를 따라다니도록 위치를 실시간 계산합니다.
 * 4. 스캐너(비교창) 등에서도 툴팁이 뻗지 않고 잘 나오게 연결합니다.
 * ============================================================================
 */

// 1. 아이템 데이터를 받아서 HTML(디자인 뼈대)로 만들어주는 함수
function generateInGameTooltipHtml(item, slotName) {
    const gradeColor = { "레전드리": "#73ff00", "유니크": "#ffcc00", "에픽": "#cc66ff", "레어": "#00ccff" };
    
    // 스타포스(별) 그리기 로직
    let starHtml = '';
    const sf = Number(item.starforce) || 0;
    const part = item.item_equipment_part || slotName;
    const noStarParts = ["훈장", "포켓 아이템", "배지", "뱃지", "성향 아이템", "칭호"];

    if (!noStarParts.includes(part) && sf > 0) {
        let r1 = '', r2 = '';
        for (let i = 0; i < 15; i++) {
            r1 += `<span style="color: ${i < sf ? '#ffcc00' : '#444444'}; text-shadow: 1px 1px 1px #000; font-size: 11px;">★</span>`;
            if ((i + 1) % 5 === 0 && i !== 14) r1 += '<span style="margin: 0 4px;"></span>';
        }
        for (let i = 15; i < 30; i++) {
            r2 += `<span style="color: ${i < sf ? '#ffcc00' : '#444444'}; text-shadow: 1px 1px 1px #000; font-size: 11px;">★</span>`;
            if ((i + 1) % 5 === 0 && i !== 29) r2 += '<span style="margin: 0 4px;"></span>';
        }
        starHtml = `<div style="text-align: center; margin-bottom: 8px; line-height: 1.2;"><div>${r1}</div><div>${r2}</div></div>`;
    }

    // 스탯(STR, DEX 등) 표시 로직
    const stats = [
        { name: 'STR', key: 'str' }, { name: 'DEX', key: 'dex' }, { name: 'INT', key: 'int' }, { name: 'LUK', key: 'luk' },
        { name: '최대 HP', key: 'max_hp' }, { name: '공격력', key: 'attack_power' }, { name: '마력', key: 'magic_power' },
        { name: '보스 데미지', key: 'boss_damage', isPercent: true },
        { name: '방어율 무시', key: 'ignore_monster_armor', isPercent: true },
        { name: '올스탯', key: 'all_stat', isPercent: true }
    ];

    let statHtml = '';
    stats.forEach(s => {
        const b = Number(item.item_base_option?.[s.key]) || 0;
        const star = Number(item.item_starforce_option?.[s.key]) || 0;
        const add = Number(item.item_add_option?.[s.key]) || 0;
        const etc = Number(item.item_etc_option?.[s.key]) || 0;
        const total = b + star + add + etc;

        if (total > 0) {
            const unit = s.isPercent ? '%' : '';
            let detail = '';
            if (star > 0 || add > 0 || etc > 0) {
                detail += ` <span style="color:#aaaaaa;">(${b}${unit}`;
                if (add > 0) detail += ` <span style="color:#66ffff;">+${add}${unit}</span>`;
                if (etc > 0) detail += ` <span style="color:#af48ff;">+${etc}${unit}</span>`;
                if (star > 0) detail += ` <span style="color:#ffcc00;">+${star}${unit}</span>`;
                detail += `)</span>`;
            }
            statHtml += `<div style="margin-bottom: 2px;">${s.name} : +${total}${unit}${detail}</div>`;
        }
    });

    const nameColor = gradeColor[item.potential_option_grade] || "#ffffff";
    return `
        ${starHtml}
        <div style="text-align: center; margin-bottom: 10px;">
            <div style="color: ${nameColor}; font-weight: bold; font-size: 15px; margin-bottom: 4px;">${item.item_name}</div>
            <div style="color: #aaa; font-size: 11px;">(${item.potential_option_grade || '일반'} 아이템)</div>
        </div>
        <div style="display: flex; gap: 12px; border-top: 1px dashed #555; border-bottom: 1px dashed #555; padding: 10px 0; margin-bottom: 10px;">
            <div style="width: 60px; height: 60px; background: #222; border: 1px solid #333; border-radius: 5px; display: flex; align-items: center; justify-content: center;">
                <img src="${item.item_icon}" style="max-width: 45px; max-height: 45px;">
            </div>
            <div style="display: flex; flex-direction: column; justify-content: center; font-size: 11px;">
                <div style="color: #ffcc00; font-weight: bold;">REQ LEV : ${item.item_base_option?.base_equipment_level || 0}</div>
                <div style="color: #aaa; margin-top: 3px;">장비분류 : ${part}</div>
            </div>
        </div>
        <div style="font-size: 11px; color: #fff; line-height: 1.5;">
            ${statHtml}
        </div>
        <div style="border-top: 1px dashed #555; margin-top: 10px; padding-top: 10px; font-size: 11px;">
            <div style="color: #73ff00; font-weight: bold; margin-bottom: 4px;">● 잠재옵션</div>
            <div>${item.potential_option_1 || '옵션 없음'}</div>
            <div>${item.potential_option_2 || ''}</div>
            <div>${item.potential_option_3 || ''}</div>
            ${item.additional_potential_option_1 ? `
                <div style="color: #cc66ff; font-weight: bold; margin-top: 10px; margin-bottom: 4px;">● 에디셔널 잠재옵션</div>
                <div>${item.additional_potential_option_1}</div>
                <div>${item.additional_potential_option_2 || ''}</div>
                <div>${item.additional_potential_option_3 || ''}</div>
            ` : ''}
        </div>
    `;
}

// 2. 툴팁 상자를 만들거나 가져오는 함수
function getOrCreateTooltip() {
    let tt = document.getElementById('itemTooltip');
    if (!tt) {
        tt = document.createElement('div');
        tt.id = 'itemTooltip';
        document.body.appendChild(tt);
    }
    tt.style.cssText = `display: none; position: fixed !important; background: rgba(17, 17, 17, 0.95); color: #fff; border: 1px solid #555; border-radius: 10px; padding: 15px; font-size: 12px; z-index: 99999; width: 280px; pointer-events: none; box-shadow: 0 10px 30px rgba(0,0,0,0.5); box-sizing: border-box; backdrop-filter: blur(10px); top: 0; left: 0;`;
    return tt;
}

// 3. 툴팁 숨기기 함수
function hideTooltip() { 
    const tt = document.getElementById('itemTooltip'); 
    if (tt) tt.style.display = 'none'; 
}

// 💡 [수정] 스캐너에서 아이템 툴팁을 닫을 때 부르는 함수를 추가했습니다.
function hideOmniTooltip() {
    hideTooltip();
}

// 4. 툴팁을 화면에 보여주는 함수 (핵심)
function showTooltip(e, slotName, presetNum) {
    const data = window.currentSearchData;
    if (!data || !data.item) return;
    
    let list = data.item[`item_equipment_preset_${presetNum}`] || data.item.item_equipment;
    const item = list.find(eq => 
        eq.item_equipment_slot === slotName || 
        (slotName === "상의" && eq.item_equipment_slot === "한벌옷") || 
        (slotName === "펜던트1" && eq.item_equipment_slot === "펜던트") || 
        (slotName === "뱃지" && eq.item_equipment_slot === "배지")
    );
    
    if (!item) return;
    
    let tt = getOrCreateTooltip(); 
    tt.innerHTML = generateInGameTooltipHtml(item, slotName); 
    tt.style.display = 'block';
    moveTooltip(e); 
}

// 5. 마우스를 따라다니게 위치를 옮겨주는 함수
function moveTooltip(event) {
    const tooltip = document.getElementById('itemTooltip');
    if (tooltip && tooltip.style.display === 'block') {
        const ttWidth = tooltip.offsetWidth;
        const ttHeight = tooltip.offsetHeight;
        
        let posX = event.clientX + 15;
        let posY = event.clientY - ttHeight - 10;

        if (posX + ttWidth > window.innerWidth) posX = event.clientX - ttWidth - 20;
        if (posY < 10) {
            posY = event.clientY + 20; 
            if (posY + ttHeight > window.innerHeight) posY = 10; 
        }

        tooltip.style.left = posX + 'px'; 
        tooltip.style.top = posY + 'px';
    }
}

// 6. 옴니 빌더 등 다른 곳에서도 쓸 수 있게 연결해주는 함수
function showOmniTooltip(e, item) {
    if (!item) return;
    let tt = getOrCreateTooltip();
    tt.innerHTML = generateInGameTooltipHtml(item, item.item_equipment_slot || '장비');
    tt.style.display = 'block';
    moveTooltip(e);
}

// 💡 [수정] 스캐너에서 아이템 툴팁을 이동할 때 부르는 함수를 추가했습니다.
function moveOmniTooltip(e) {
    moveTooltip(e);
}