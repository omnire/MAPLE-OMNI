/**
 * ============================================================================
 * 🐉 MAPLE OMNI - 주간 보스 수익 계산기 모듈 (boss.js)
 * 주간 보스 선택, 인원수 분배, 난이도 조절 및 수익 정산 기능을 관리합니다.
 * ============================================================================
 */

let myWeeklyBosses = {};

// 🖼️ 화면 상단에 보스 이름표(칩)들을 주르륵 그려주는 함수
function renderBossPresets() {
    const gridBelow = document.getElementById('gridBelowBlackMage');
    const gridAbove = document.getElementById('gridAboveBlackMage');
    if (!gridBelow || !gridAbove) return;

    let belowHtml = '', aboveHtml = '';
    
    bossData.forEach(boss => {
        const isSelected = myWeeklyBosses[boss.id] !== undefined;
        const activeClass = isSelected ? 'active' : '';
        const chipHtml = `<div class="boss-chip ${activeClass}" onclick="toggleBossInList('${boss.id}')">${boss.name}</div>`;
        
        if (boss.group === 'below') belowHtml += chipHtml;
        else aboveHtml += chipHtml;
    });
    
    gridBelow.innerHTML = belowHtml;
    gridAbove.innerHTML = aboveHtml;
}

// 👆 보스 이름표 클릭 시 장바구니 추가/삭제
function toggleBossInList(bossId) {
    if (myWeeklyBosses[bossId] !== undefined) {
        delete myWeeklyBosses[bossId];
    } else {
        myWeeklyBosses[bossId] = { selectedDiffIndex: 0, partySize: 1 };
    }
    renderBossPresets(); 
    renderSelectedBossList(); 
}

function changeDifficulty(bossId, diffIndex) {
    if (myWeeklyBosses[bossId]) {
        myWeeklyBosses[bossId].selectedDiffIndex = diffIndex;
        renderSelectedBossList(); 
    }
}

function updatePartySize(bossId, size) {
    if (myWeeklyBosses[bossId]) {
        myWeeklyBosses[bossId].partySize = parseInt(size);
        renderSelectedBossList();
    }
}

function resetAllBosses() {
    if(Object.keys(myWeeklyBosses).length === 0) return;
    if(confirm("모든 보스 정산 내역을 초기화하시겠습니까?")) {
        myWeeklyBosses = {};
        renderBossPresets();
        renderSelectedBossList();
    }
}

function formatMesoText(num) {
    if (num >= 100000000) {
        const uk = Math.floor(num / 100000000);
        const man = (num % 100000000) / 10000;
        return `${uk}억 ${man > 0 ? man + '만' : ''} 메소`;
    }
    return `${num / 10000}만 메소`;
}

function renderSelectedBossList() {
    const listArea = document.getElementById('selectedBossList');
    const totalDisplay = document.getElementById('totalWeeklyProfit');
    let totalProfit = 0; 
    
    const selectedKeys = Object.keys(myWeeklyBosses);
    
    if (selectedKeys.length === 0) {
        listArea.innerHTML = `<div style="text-align: center; color: #cbd5e1; font-size: 12px; padding: 30px; border: 1px dashed #e2e8f0; border-radius: 8px;">위에서 보스를 클릭해 목록에 추가해주세요. 🍁</div>`;
        totalDisplay.innerText = "0 메소";
        return;
    }

    let html = '';
    selectedKeys.forEach(bossId => {
        const bossInfo = bossData.find(b => b.id === bossId);
        if (!bossInfo) return;

        const myData = myWeeklyBosses[bossId];
        const selectedVariant = bossInfo.variants[myData.selectedDiffIndex]; 
        const myShare = Math.floor(selectedVariant.price / myData.partySize); 
        totalProfit += myShare; 

        let diffBoxesHtml = '<div class="diff-box-group">';
        bossInfo.variants.forEach((v, index) => {
            const isActive = index === myData.selectedDiffIndex;
            const activeClass = isActive ? 'active' : '';
            diffBoxesHtml += `<div class="diff-box ${activeClass}" onclick="changeDifficulty('${bossId}', ${index})">${v.diff}</div>`;
        });
        diffBoxesHtml += '</div>';

        html += `
        <div style="display: flex; justify-content: space-between; align-items: center; background: #ffffff; border: 1px solid #f1f5f9; border-radius: 8px; padding: 10px 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.01); flex-wrap: wrap; gap: 8px;">
            <div style="display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 140px;">
                <div style="font-weight: 700; color: #334155; font-size: 13px;">
                    ${bossInfo.name} <span style="font-size:10px; color:#94a3b8; font-weight:500; margin-left:4px;">(원가: ${formatMesoText(selectedVariant.price)})</span>
                </div>
                ${diffBoxesHtml}
            </div>
            
            <div style="display: flex; align-items: center; gap: 12px; justify-content: flex-end; flex: 1.2; min-width: 180px;">
                <div style="display: flex; align-items: center; gap: 3px;">
                    <span style="font-size: 10px; color: #94a3b8; font-weight: 600;">인원</span>
                    <select onchange="updatePartySize('${bossId}', this.value)" style="padding: 2px 4px; border-radius: 4px; border: 1px solid #e2e8f0; font-size: 11px; font-weight: 700; cursor: pointer; color: #475569; background: #fcfcfc;">
                        ${[1,2,3,4,5,6].map(num => `<option value="${num}" ${num === myData.partySize ? 'selected' : ''}>${num}명</option>`).join('')}
                    </select>
                </div>
                
                <div style="text-align: right; min-width: 85px; border-left: 1px solid #f1f5f9; padding-left: 10px;">
                    <div style="font-size: 9px; color: #cbd5e1; font-weight: 600;">순수익</div>
                    <div style="color: #334155; font-weight: 700; font-size: 14px;">${myShare.toLocaleString()}</div>
                </div>
                <button onclick="toggleBossInList('${bossId}')" style="background: none; border: none; color: #fca5a5; cursor: pointer; font-size: 14px; padding: 4px;">✕</button>
            </div>
        </div>`;
    });

    listArea.innerHTML = html;
    totalDisplay.innerText = totalProfit.toLocaleString() + " 메소";
}

function saveBossPreset(num) {
    if (Object.keys(myWeeklyBosses).length === 0) return showAlert("⚠️ 저장할 보스 정산 내역이 없습니다.");
    localStorage.setItem('maple_expert_boss_preset_' + num, JSON.stringify(myWeeklyBosses));
    showAlert(`💾 [프리셋 ${num}] 저장이 완료되었습니다!`);
}

function loadBossPreset(num) {
    const saved = JSON.parse(localStorage.getItem('maple_expert_boss_preset_' + num));
    if (!saved || Object.keys(saved).length === 0) return showAlert(`⚠️ 저장된 [프리셋 ${num}] 내역이 없습니다.`);
    myWeeklyBosses = saved;
    renderBossPresets();
    renderSelectedBossList();
    showAlert(`📂 [프리셋 ${num}] 내역을 불러왔습니다!`);
}