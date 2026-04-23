/**
 * ============================================================================
 * ⚔️ MAPLE OMNI - 사냥 기록 및 타이머 전용 모듈 (hunt.js)
 * ----------------------------------------------------------------------------
 * 수정사항: 콤팩트 모달 시스템 적용 및 모든 브라우저 기본 팝업 제거 완료
 * ============================================================================
 */

// ⏱️ 전역 변수 설정
let timerId = null, timeLeft = 1800, isPaused = false, endTime = null; 
let buffTimerId = null, buffTimeLeft = 0; 
let currentOcrMode = 'hunt'; 
let subHistory = {1:[], 2:[], 3:[], 4:[]}; 
let huntRecords = JSON.parse(localStorage.getItem('maple_hunt_records')) || []; 
let currentIdx = 1; 
let currentEditingId = null;

// ============================================================================
// 🏛️ 0. 통합 커스텀 모달 제어 시스템 (Compact Ver.)
// ============================================================================
function omniModal({ type = 'alert', title = '알림', desc = '', icon = '📢', date = '', onConfirm = null }) {
    const modal = document.getElementById('omniModal');
    if (!modal) return;

    const titleEl = document.getElementById('modalTitle');
    const descEl = document.getElementById('modalDesc');
    const iconEl = document.getElementById('modalIcon');
    const dateInput = document.getElementById('modalDateInput');
    const confirmBtn = document.getElementById('modalConfirmBtn');
    const cancelBtn = document.getElementById('modalCancelBtn');

    titleEl.innerText = title;
    descEl.innerText = desc;
    iconEl.innerText = icon;
    
    // 날짜 입력 모드 활성화 여부
    dateInput.style.display = (type === 'date') ? 'block' : 'none';
    if (date) dateInput.value = date;
    
    // 확인/취소 버튼 구성
    cancelBtn.style.display = (type === 'confirm' || type === 'date') ? 'block' : 'none';
    confirmBtn.style.background = (type === 'confirm' && icon === '🗑️') ? '#e11d48' : '#7c3aed';

    // 이벤트 바인딩
    confirmBtn.onclick = () => {
        if (onConfirm) onConfirm(dateInput.value);
        closeOmniModal();
    };

    modal.style.display = 'flex';
}

function closeOmniModal() { 
    const modal = document.getElementById('omniModal');
    if(modal) modal.style.display = 'none'; 
}

// ============================================================================
// 🕒 1. 타이머 및 도핑 로직
// ============================================================================
function startTimer() { 
    if (!timerId) { 
        endTime = Date.now() + (timeLeft * 1000); 
        timerId = setInterval(() => { 
            timeLeft = Math.round((endTime - Date.now()) / 1000); 
            if (timeLeft <= 0) { 
                timeLeft = 0; stopTimer(); updateTD(); 
                omniModal({ title: '타이머 종료', desc: '30분 소재가 종료되었습니다!', icon: '⏰' });
                timeLeft = 1800; 
            } 
            updateTD(); 
        }, 1000); 
        isPaused = false; 
        updateTimerButtons(); 
    } 
}

function stopOrResumeTimer() { 
    if (timerId) { clearInterval(timerId); timerId = null; isPaused = true; } 
    else if (isPaused) { startTimer(); } 
    updateTimerButtons(); 
}

function stopTimer() { clearInterval(timerId); timerId = null; isPaused = false; updateTimerButtons(); }
function resetTimer() { stopTimer(); timeLeft = 1800; isPaused = false; updateTD(); updateTimerButtons(); }
function updateTD() { const m = Math.floor(timeLeft/60), s = timeLeft%60; const td = document.getElementById('timerDisplay'); if(td) td.innerText = `${m}:${s<10?'0':''}${s}`; }

function updateTimerButtons() { 
    const stopBtn = document.getElementById('mainStopBtn'); 
    if (!stopBtn) return; 
    if (isPaused) { stopBtn.innerText = "재개"; stopBtn.classList.add('btn-resume'); } 
    else { stopBtn.innerText = "정지"; stopBtn.classList.remove('btn-resume'); } 
}

function setBuffTimer(sec) { 
    clearInterval(buffTimerId); 
    buffTimeLeft = sec; 
    updateBTD(); 
    buffTimerId = setInterval(() => { 
        buffTimeLeft--; 
        if(buffTimeLeft <= 0) { 
            clearInterval(buffTimerId); 
            omniModal({ title: '도핑 만료', desc: '도핑 시간이 끝났습니다!', icon: '💊' }); 
        } 
        updateBTD(); 
    }, 1000); 
}

function updateBTD() { const m = Math.floor(buffTimeLeft/60), s = buffTimeLeft%60; const btd = document.getElementById('buffTimerDisplay'); if(btd) btd.innerText = `${m}:${s<10?'0':''}${s}`; }
function resetBuffTimer() { clearInterval(buffTimerId); buffTimeLeft=0; updateBTD(); }

// ============================================================================
// 📊 2. 사냥 데이터 입력 및 기록 로직
// ============================================================================
function openHistTab(idx) { 
    currentIdx = idx; 
    document.querySelectorAll('#historyTabContainer .nav-btn').forEach(b => b.classList.remove('active')); 
    const tabBtn = document.getElementById(`hist_tab_btn_${idx}`); 
    if(tabBtn) tabBtn.classList.add('active'); 
    renderRecords(); 
}

function addSellRow(idx) { 
    const container = document.getElementById(`sellContainer_${idx}`); 
    if(!container) return; 
    const div = document.createElement('div'); 
    div.className = 'sell-row'; 
    div.innerHTML = `<select><option value="" disabled selected>물품 선택</option>${sellItems.map(it=>`<option value="${it}">${it}</option>`).join('')}</select><input type="number" placeholder="개수" oninput="calcSellSum(${idx})"><input type="text" placeholder="판매 금액" oninput="onMeso(this); calcSellSum(${idx})"><button class="btn-del-row" onclick="this.parentElement.remove(); calcSellSum(${idx});">×</button>`; 
    container.appendChild(div); 
}

function calcSellSum(idx) { 
    const container = document.getElementById(`sellContainer_${idx}`); 
    if(!container) return 0; 
    const rows = container.querySelectorAll('.sell-row'); 
    let total = 0; 
    rows.forEach(row => { total += parseInt(row.querySelectorAll('input')[1].value.replace(/,/g, '')) || 0; }); 
    const td = document.getElementById(`sellTotalDisplay_${idx}`); 
    if(td) td.innerText = total.toLocaleString(); 
    return total; 
}

function updateTabName(idx) { 
    const nInput = document.getElementById(`nameInput_${idx}`); 
    const n = nInput ? nInput.value : `캐릭터 ${idx}`; 
    const tBtn = document.getElementById(`tab_btn_${idx}`); 
    if(tBtn) tBtn.innerText = n; 
    const hBtn = document.getElementById(`hist_tab_btn_${idx}`); 
    if(hBtn) hBtn.innerText = n; 
}

function onMeso(el) { let v = el.value.replace(/,/g, ""); el.value = isNaN(v) ? "" : Number(v).toLocaleString(); }
function toggleDetails(idx) { const el = document.getElementById(`details_${idx}`); if(el) el.style.display = (el.style.display === 'grid') ? 'none' : 'grid'; }

function recordSub(idx) {
    const mesoEl = document.getElementById(`meso_${idx}`), expEl = document.getElementById(`exp_${idx}`), gemEl = document.getElementById(`gem_${idx}`), fragEl = document.getElementById(`frag_${idx}`);
    if(!mesoEl || !expEl) return;
    
    const curM = parseInt(mesoEl.value.replace(/,/g, "")) || 0, curE = parseFloat(expEl.value) || 0, curG = parseInt(gemEl.value) || 0, curF = parseInt(fragEl.value) || 0;
    if (curM === 0 && curE === 0) return omniModal({ title: '입력 오류', desc: '메소와 경험치를 입력해주세요!', icon: '⚠️' });
    
    let prevM = 0, prevE = 0, prevG = 0, prevF = 0;
    if (subHistory[idx] && subHistory[idx].length > 0) {
        const lastLog = subHistory[idx][subHistory[idx].length - 1];
        prevM = parseInt(lastLog.fullMeso)||0; prevE = parseFloat(lastLog.fullExp)||0; 
        prevG = parseInt(lastLog.fullGem)||0; prevF = parseInt(lastLog.fullFrag)||0;
    } else {
        prevM = parseInt(document.getElementById(`startMeso_${idx}`)?.value.replace(/,/g, ""))||0; 
        prevE = parseFloat(document.getElementById(`startExp_${idx}`)?.value)||0; 
        prevG = parseInt(document.getElementById(`startGem_${idx}`)?.value)||0; 
        prevF = parseInt(document.getElementById(`startFrag_${idx}`)?.value)||0;
    }
    
    const diffM = Math.max(0, curM - prevM), diffE = Math.max(0, curE - prevE), diffG = Math.max(0, curG - prevG), diffF = Math.max(0, curF - prevF);
    let sDetail = [], sSum = 0;
    const sCont = document.getElementById(`sellContainer_${idx}`);
    if(sCont) sCont.querySelectorAll('.sell-row').forEach(row => {
        const item = row.querySelector('select').value, cnt = row.querySelectorAll('input')[0].value, price = row.querySelectorAll('input')[1].value;
        if(item && cnt) { sDetail.push(`${item}(${cnt}개)`); sSum += parseInt(price.replace(/,/g, '')) || 0; }
    });

    if(!subHistory[idx]) subHistory[idx] = [];
    subHistory[idx].push({ 
        id: Date.now(), time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), 
        meso: diffM.toLocaleString() + " 메소", fullMeso: curM, exp: diffE.toFixed(3) + " %", fullExp: curE, 
        gem: diffG, fullGem: curG, frag: diffF, fullFrag: curF, sellSum: sSum.toLocaleString() + " 메소", sellDetail: sDetail.length > 0 ? sDetail.join(', ') : "없음" 
    });
    
    localStorage.setItem(`maple_subHistory_${idx}`, JSON.stringify(subHistory[idx]));
    updateSubDisplay(idx); updateAll(idx); resetTimer(); 
    if (typeof markAttendance === 'function') markAttendance(); 
    
    mesoEl.value = ""; expEl.value = ""; gemEl.value = ""; fragEl.value = "";
    if(sCont) { 
        sCont.innerHTML = `<div class="sell-row"><select><option value="" disabled selected>물품 선택</option>${sellItems.map(it=>`<option value="${it}">${it}</option>`).join('')}</select><input type="number" placeholder="개수" oninput="calcSellSum(${idx})"><input type="text" placeholder="판매 금액" oninput="onMeso(this); calcSellSum(${idx})"><button class="btn-del-row" onclick="this.parentElement.remove(); calcSellSum(${idx});">×</button></div>`; 
        const td = document.getElementById(`sellTotalDisplay_${idx}`); if(td) td.innerText = "0"; 
    }
    omniModal({ title: '기록 완료', desc: '30분 기록이 성공적으로 저장되었습니다! 🍁', icon: '✅' });
}

function updateAll(idx) {
    let bm = 0, bd = 0;
    for(let j=0; j<statItems.length; j++){ 
        const mst=document.getElementById(`m_stat_${j}_${idx}`); const dst=document.getElementById(`d_stat_${j}_${idx}`); 
        bm += parseInt(mst?.value) || 0; bd += parseInt(dst?.value) || 0; 
    }
    let hasJ = document.getElementById(`chk_4_${idx}`)?.checked;
    buffs.forEach((b, i) => { if(document.getElementById(`chk_${i}_${idx}`)?.checked) { bd += b.d; if(i !== 4) bm += b.m; } });
    const curSt = document.getElementById(`currentStats_${idx}`); if(curSt) curSt.innerText = `${bd}% / ${hasJ ? Math.floor(((100 + bm) * 1.2) - 100) : bm}%`;
    
    let totalMeso = 0, totalExp = 0, totalGem = 0, totalFrag = 0;
    if(subHistory[idx]) subHistory[idx].forEach(log => { 
        totalMeso += parseInt(log.meso.replace(/[^0-9]/g, "")) || 0; 
        totalExp += parseFloat(log.exp) || 0; totalGem += parseInt(log.gem) || 0; totalFrag += parseInt(log.frag) || 0; 
    });
    
    const pM = document.getElementById(`profitMeso_${idx}`), pE = document.getElementById(`profitExp_${idx}`), nD = document.getElementById(`netDrops_${idx}`), sC = document.getElementById(`subCountDisplay_${idx}`);
    if(pM) pM.innerText = totalMeso.toLocaleString() + " 메소"; if(pE) pE.innerText = totalExp.toFixed(3) + " %"; if(nD) nD.innerText = `${totalGem} / ${totalFrag}`; if(sC && subHistory[idx]) sC.innerText = subHistory[idx].length + " 회";

    const tM = document.getElementById(`targetMeso_${idx}`);
    const targetVal = tM ? parseInt(tM.value.replace(/,/g, "")) || 0 : 0; 
    const currentVal = pM ? parseInt(pM.innerText.replace(/[^0-9]/g, "")) || 0 : 0;
    let goalP = targetVal > 0 ? Math.min((currentVal / targetVal) * 100, 100) : 0, goalR = targetVal > 0 ? Math.max(0, targetVal - currentVal) : 0;
    
    const gP = document.getElementById(`goalPercent_${idx}`), pB = document.getElementById(`progressBar_${idx}`), rM = document.getElementById(`remainMeso_${idx}`);
    if(gP) { gP.innerText = (goalP >= 100 && targetVal > 0) ? "🎉 목표 달성!" : goalP.toFixed(1) + "%"; gP.style.color = (goalP >= 100 && targetVal > 0) ? "#2ecc71" : "var(--accent)"; }
    if(pB) pB.style.width = goalP + "%"; if(rM) rM.innerText = goalR.toLocaleString();

    saveConfig(idx);
}

function updateSubDisplay(idx) {
    const list = document.getElementById(`subRecordList_${idx}`);
    if(list && subHistory[idx]) {
        list.innerHTML = subHistory[idx].map((d, i) => `
            <div class="sub-item">
                <button onclick="removeSub(${idx},${d.id})" style="position:absolute;top:5px;right:5px;border:none;color:red;background:none;cursor:pointer;">×</button>
                <div class="sub-item-header"><b>${i+1}소재 기록</b><input type="text" class="sub-time-input" value="${d.time}" onchange="editSubTime(${idx},${d.id},this.value)"></div>
                <div class="sub-tag-group">
                    <div class="sub-tag tag-meso">💰 ${d.meso}</div><div class="sub-tag tag-exp">📈 ${d.exp}</div>
                    <div class="sub-tag tag-frag">🧩 조각: ${d.frag}</div><div class="sub-tag tag-gem">💎 코젬: ${d.gem}</div>
                    <div class="sub-tag tag-sell">🛍️ 부수입: ${d.sellSum}</div>
                </div>
            </div>`).join('');
    }
}

function saveFinalRecord(idx) {
    omniModal({
        type: 'confirm', title: '기록지 전송', desc: "소재 사냥 데이터를 통합 기록지로 전송할까요?", icon: '📤',
        onConfirm: () => {
            const nIn = document.getElementById(`nameInput_${idx}`), mIn = document.getElementById(`map_${idx}`), pM = document.getElementById(`profitMeso_${idx}`), pE = document.getElementById(`profitExp_${idx}`), nD = document.getElementById(`netDrops_${idx}`);
            const now = new Date(); 
            huntRecords.push({ 
                id: Date.now(), date: now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0'), 
                name: nIn ? nIn.value : "미지정", map: mIn ? (mIn.value || "미지정") : "미지정", 
                meso: pM ? pM.innerText : "0", exp: pE ? pE.innerText : "0", drops: nD ? nD.innerText : "0", subs: subHistory[idx] ? subHistory[idx].length : 0 
            });
            saveAndRefresh();
            omniModal({ title: '전송 완료', desc: '데이터가 안전하게 전송되었습니다.', icon: '🚀' });
        }
    });
}

function resetCurrentHunt(idx) { 
    omniModal({
        type: 'confirm', title: '초기화 확인', desc: "현재 탭의 모든 사냥 데이터와 오늘 출석을 초기화할까요?", icon: '🗑️',
        onConfirm: () => {
            ['startMeso','startExp','startGem','startFrag','meso','exp','gem','frag','map'].forEach(id => { const el = document.getElementById(`${id}_${idx}`); if(el) el.value = ""; }); 
            subHistory[idx] = []; localStorage.removeItem(`maple_subHistory_${idx}`); 
            localStorage.removeItem('mapleAttendance'); if (typeof renderAttendance === 'function') renderAttendance();
            updateSubDisplay(idx); updateAll(idx);
            omniModal({ title: '초기화 완료', desc: '데이터가 깨끗하게 비워졌습니다.', icon: '🧹' });
        }
    });
}

// ============================================================================
// 📜 3. 통합 로그 표 관리 (Compact Modal 연동)
// ============================================================================
function saveAndRefresh() { 
    localStorage.setItem('maple_hunt_records', JSON.stringify(huntRecords)); 
    renderRecords(); 
}

function renderRecords() {
    const tableBody = document.getElementById('recordTableBody');
    if (!tableBody) return;
    huntRecords = JSON.parse(localStorage.getItem('maple_hunt_records') || '[]');
    if (huntRecords.length === 0) { tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 50px; color: #94a3b8; font-weight:800;">기록이 없습니다. 🏹</td></tr>'; return; }
    let html = "";
    [...huntRecords].sort((a, b) => new Date(b.date) - new Date(a.date)).forEach((row) => {
        html += `<tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="color: #94a3b8; font-size: 11px; font-weight: 700;">${row.date}</td>
            <td style="font-weight: 800; color: #1e293b;">${row.charName || row.name}</td>
            <td style="color: #64748b;">${row.mapName || row.map || '-'}</td>
            <td style="color: #ff9100; font-weight: 800;">${parseInt(row.meso || 0).toLocaleString()}</td>
            <td style="color: #a29bfe; font-weight: 700;">${row.exp}%</td>
            <td style="color: #2dd4bf; font-weight: 700;">${row.cores || row.gem || 0} / ${row.fragments || row.frag || 0}</td>
            <td><div style="display: flex; gap: 6px; justify-content: center;">
                <button onclick="editRecordDate(${row.id})" style="background:#f1f5f9; color:#475569; border:1px solid #dfe6e9; padding:5px 10px; border-radius:6px; cursor:pointer; font-size:11px; font-weight:800;">수정</button>
                <button onclick="deleteRecord(${row.id})" style="background:#fff1f2; color:#e11d48; border:1px solid #fecdd3; padding:5px 10px; border-radius:6px; cursor:pointer; font-size:11px; font-weight:800;">삭제</button>
            </div></td></tr>`;
    });
    tableBody.innerHTML = html;
}

function editRecordDate(recordId) {
    const record = huntRecords.find(r => r.id === recordId);
    if (!record) return;
    omniModal({
        type: 'date', title: '날짜 변경', desc: `[${record.charName || record.name}] 기록의 날짜를 선택하세요.`, icon: '📅', date: record.date,
        onConfirm: (newDate) => {
            if (newDate) {
                record.date = newDate;
                saveAndRefresh();
                omniModal({ title: '변경 완료', desc: '기록 날짜가 정상적으로 수정되었습니다.', icon: '✅' });
            }
        }
    });
}

function deleteRecord(id) { 
    omniModal({
        type: 'confirm', title: '기록 삭제', desc: '이 사냥 기록을 정말로 삭제할까요?', icon: '🗑️',
        onConfirm: () => { 
            huntRecords = huntRecords.filter(r => r.id !== id); 
            saveAndRefresh(); 
        }
    });
}

function resetDateFilter() { const filter = document.getElementById('dateFilter'); if(filter) filter.value = ''; renderRecords(); }

function saveConfig(idx) {
    const nIn = document.getElementById(`nameInput_${idx}`); if(!nIn) return;
    const cfg = { name: nIn.value, stats: {}, doping: buffs.map((_, i) => document.getElementById(`chk_${i}_${idx}`)?.checked), currentVals: { startMeso: document.getElementById(`startMeso_${idx}`)?.value, startExp: document.getElementById(`startExp_${idx}`)?.value, startGem: document.getElementById(`startGem_${idx}`)?.value, startFrag: document.getElementById(`startFrag_${idx}`)?.value, map: document.getElementById(`map_${idx}`)?.value, meso: document.getElementById(`meso_${idx}`)?.value, exp: document.getElementById(`exp_${idx}`)?.value, gem: document.getElementById(`gem_${idx}`)?.value, frag: document.getElementById(`frag_${idx}`)?.value } };
    for(let j=0; j<statItems.length; j++) { cfg.stats[`m_stat_${j}`] = document.getElementById(`m_stat_${j}_${idx}`)?.value; cfg.stats[`d_stat_${j}`] = document.getElementById(`d_stat_${j}_${idx}`)?.value; }
    localStorage.setItem(`maple_config_${idx}`, JSON.stringify(cfg));
}

function loadData() {
    for(let i=1; i<=4; i++) {
        const cfg = JSON.parse(localStorage.getItem(`maple_config_${i}`));
        if(cfg) { 
            const nIn = document.getElementById(`nameInput_${i}`); if(nIn) nIn.value = cfg.name || ""; updateTabName(i); 
            if(cfg.stats) for(let j=0; j<statItems.length; j++) { if(document.getElementById(`m_stat_${j}_${i}`)) document.getElementById(`m_stat_${j}_${i}`).value = cfg.stats[`m_stat_${j}`] || 0; if(document.getElementById(`d_stat_${j}_${i}`)) document.getElementById(`d_stat_${j}_${i}`).value = cfg.stats[`d_stat_${j}`] || 0; } 
            if(cfg.doping) cfg.doping.forEach((c, idx) => { if(document.getElementById(`chk_${idx}_${i}`)) document.getElementById(`chk_${idx}_${i}`).checked = c; }); 
            if(cfg.currentVals) for(let k in cfg.currentVals) { if(document.getElementById(`${k}_${i}`)) document.getElementById(`${k}_${i}`).value = cfg.currentVals[k] || ""; } 
        }
        const savedSub = localStorage.getItem(`maple_subHistory_${i}`); if(savedSub) { subHistory[i] = JSON.parse(savedSub); updateSubDisplay(i); } updateAll(i);
    }
}

// ============================================================================
// 📅 4. 출석부 달력 로직
// ============================================================================
let viewDate = new Date();
function renderAttendance() { 
    const grid = document.getElementById('attendanceGrid'); if(!grid) return; 
    grid.style.display = 'grid'; grid.style.gridTemplateColumns = 'repeat(7, 1fr)'; grid.style.gap = '6px'; grid.style.marginTop = '15px'; grid.style.textAlign = 'center';
    const year = viewDate.getFullYear(), month = viewDate.getMonth(), realToday = new Date(); 
    const monthTitle = document.getElementById('currentMonth'); if(monthTitle) monthTitle.innerText = `${year}년 ${month + 1}월`; 
    const firstDay = new Date(year, month, 1).getDay(), lastDate = new Date(year, month + 1, 0).getDate(); 
    const attendanceData = JSON.parse(localStorage.getItem('mapleAttendance')) || []; 
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    let html = days.map(d => `<div style="font-size:11px; font-weight:800; color:#a0aec0; padding-bottom:5px;">${d}</div>`).join('');
    for (let i = 0; i < firstDay; i++) { html += `<div></div>`; }
    for (let i = 1; i <= lastDate; i++) { 
        const currentFullDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`; 
        let className = "calendar-day"; 
        if (attendanceData.includes(currentFullDate)) className += " active";
        if (i === realToday.getDate() && month === realToday.getMonth() && year === realToday.getFullYear()) className += " today"; 
        html += `<div class="${className}">${i}</div>`; 
    }
    grid.innerHTML = html;
}
function changeMonth(diff) { viewDate.setMonth(viewDate.getMonth() + diff); renderAttendance(); }
function markAttendance() { 
    const today = new Date(); const dateStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0'); 
    let attendanceData = JSON.parse(localStorage.getItem('mapleAttendance')) || []; 
    if (!attendanceData.includes(dateStr)) { attendanceData.push(dateStr); localStorage.setItem('mapleAttendance', JSON.stringify(attendanceData)); } 
    renderAttendance(); 
}

// ============================================================================
// 📸 5. 이미지 스캔(OCR) 연동 및 제어
// ============================================================================
function setOcrMode(mode) {
    currentOcrMode = mode;
    const btnHunt = document.getElementById('btnModeHunt'), btnSell = document.getElementById('btnModeSell'), desc = document.getElementById('ocrModeDesc');
    if (mode === 'hunt') { if(btnHunt) { btnHunt.style.borderColor = 'var(--accent)'; btnHunt.style.background = 'rgba(255, 145, 0, 0.1)'; } if(btnSell) { btnSell.style.borderColor = '#eee'; btnSell.style.background = '#f8f9fa'; } if(desc) desc.innerText = "현재 모드: 사냥 결과 분석"; } 
    else { if(btnSell) { btnSell.style.borderColor = 'var(--blue)'; btnSell.style.background = 'rgba(52, 152, 219, 0.1)'; } if(btnHunt) { btnHunt.style.borderColor = '#eee'; btnHunt.style.background = '#f8f9fa'; } if(desc) desc.innerText = "현재 모드: 경매장 판매"; }
}
function openOcrModal() { const modal = document.getElementById('ocrModal'); if (modal) { modal.style.display = 'flex'; resetOcrModal(); } }
function closeOcrModal() { const modal = document.getElementById('ocrModal'); if (modal) { modal.style.display = 'none'; resetOcrModal(); } }
function resetOcrModal() {
    const dropZoneText = document.getElementById('dropZoneText'), modalOcrStatus = document.getElementById('modalOcrStatus'), modalOcrBar = document.getElementById('modalOcrBar'), modalOcrPercent = document.getElementById('modalOcrPercent'), imagePreview = document.getElementById('imagePreview');
    if (dropZoneText) dropZoneText.style.display = 'block'; if (modalOcrStatus) modalOcrStatus.style.display = 'none'; if (modalOcrBar) modalOcrBar.style.width = '0%'; if (modalOcrPercent) modalOcrPercent.innerText = '0%'; if (imagePreview) imagePreview.style.display = 'none';
    if (typeof setOcrMode === 'function') setOcrMode('hunt');
}

window.addEventListener('paste', function(e) { 
    const page1 = document.getElementById('page_1'); if (page1 && page1.style.display === 'none') return; 
    const items = e.clipboardData.items; 
    for (let i = 0; i < items.length; i++) { if (items[i].type.indexOf("image") !== -1) { openOcrModal(); processOCR(items[i].getAsFile()); } } 
});

async function processOCR(blob) {
    const statusEl = document.getElementById('modalOcrStatus'); if(statusEl) statusEl.style.display = 'block';
    try {
        const img = new Image(); img.src = URL.createObjectURL(blob); await new Promise(resolve => { img.onload = resolve; });
        const canvas = document.createElement('canvas'), ctx = canvas.getContext('2d'); let results = {};
        if (currentOcrMode === 'hunt') {
            const regions = [ { id: 'exp', x: 0, y: 0.8, w: 1, h: 0.2 }, { id: 'meso', x: 0.3, y: 0.5, w: 0.7, h: 0.3 }, { id: 'frag', x: 0.7, y: 0.3, w: 0.3, h: 0.4 }, { id: 'gem', x: 0.3, y: 0.7, w: 0.4, h: 0.3 } ];
            for (let reg of regions) {
                canvas.width = img.width * reg.w; canvas.height = img.height * reg.h; ctx.filter = 'grayscale(100%) invert(100%) contrast(500%)'; 
                ctx.drawImage(img, img.width * reg.x, img.height * reg.y, img.width * reg.w, img.height * reg.h, 0, 0, canvas.width, canvas.height);
                const res = await Tesseract.recognize(canvas.toDataURL(), 'kor+eng'); results[reg.id] = res.data.text;
                const mBar = document.getElementById('modalOcrBar'); if(mBar) mBar.style.width = (Object.keys(results).length * 25) + "%";
            }
            const exp = results.exp.match(/(\d+\.\d{3})/), mesoMatch = results.meso.replace(/[^0-9]/g, ''), fragNums = results.frag.match(/\d+/g), frag = fragNums ? fragNums[fragNums.length - 1] : "0", gemMatch = results.gem.match(/0\s+(\d+)/) || results.gem.match(/\d+/);
            const eEl=document.getElementById(`exp_${currentIdx}`), mEl=document.getElementById(`meso_${currentIdx}`), gEl=document.getElementById(`gem_${currentIdx}`), fEl=document.getElementById(`frag_${currentIdx}`);
            if (exp && eEl) eEl.value = exp[0]; if (mesoMatch && mEl) mEl.value = Number(mesoMatch).toLocaleString(); if (gemMatch && gEl) gEl.value = Array.isArray(gemMatch) ? gemMatch[1] : gemMatch; if (frag && fEl) fEl.value = frag;
            updateAll(currentIdx); omniModal({ title: '인식 성공', desc: '데이터 동기화가 완료되었습니다.', icon: '✨' }); setTimeout(closeOcrModal, 1200);
        } else {
            canvas.width = img.width; canvas.height = img.height; ctx.filter = 'threshold(0.5) contrast(300%)'; ctx.drawImage(img, 0, 0);
            const res = await Tesseract.recognize(canvas.toDataURL(), 'kor+eng');
            const mBar = document.getElementById('modalOcrBar'); if(mBar) mBar.style.width = "100%"; parseAuctionResults(res.data.text);
        }
    } catch (e) { console.error(e); omniModal({ title: '오류', desc: '분석 중 문제가 발생했습니다.', icon: '❌' }); }
}

function parseAuctionResults(fullText) {
    const lines = fullText.split('\n').map(l => l.trim()).filter(l => l.length > 0), detectedItems = [];
    let headerIndex = lines.findIndex(l => l.includes("아이템") || l.includes("금액") || l.includes("처리"));
    for (let i = headerIndex + 1; i < lines.length; i++) {
        const line = lines[i];
        if (!(line.includes("수령 완료") || line.includes("수령완료")) && (line.includes("대금") || line.includes("판매 완료") || line.includes("낙찰"))) {
            const numbers = line.match(/[\d,]{4,}/g); let price = numbers ? numbers[numbers.length - 1].replace(/,/g, '') : "0";
            let itemName = line.split("판매")[0].split("낙찰")[0].replace(/\d{4}-\d{2}-\d{2}/g, '').replace(/\(.*\)/g, '').replace(/[0-9]/g, '').replace(/[\[\]\-\:\.\|]/g, '').trim();
            if (itemName.length < 2) itemName = "인식 실패";
            if (parseInt(price) > 100) detectedItems.push({ item: itemName, price: parseInt(price) });
        }
    }
    if (detectedItems.length > 0) { fillAuctionSellRows(detectedItems); omniModal({ title: '정산 감지', desc: `${detectedItems.length}건의 판매 내역이 추가되었습니다.`, icon: '🛍️' }); } 
    else omniModal({ title: '내역 없음', desc: '정산 가능한 항목을 찾지 못했습니다.', icon: '❌' });
    setTimeout(closeOcrModal, 1200);
}

function fillAuctionSellRows(items) {
    const container = document.getElementById(`sellContainer_${currentIdx}`); if (!container) return; container.innerHTML = ""; 
    items.forEach(data => {
        const div = document.createElement('div'); div.className = 'sell-row';
        div.innerHTML = `<select style="flex:1.5;"><option value="${data.item}" selected>${data.item}</option>${sellItems.map(it => `<option value="${it}">${it}</option>`).join('')}</select><input type="number" value="1" style="flex:0.5;" oninput="calcSellSum(${currentIdx})"><input type="text" value="${data.price.toLocaleString()}" style="flex:1.5;" oninput="onMeso(this); calcSellSum(${currentIdx})"><button class="btn-del-row" onclick="this.parentElement.remove(); calcSellSum(${currentIdx});">×</button>`;
        container.appendChild(div);
    });
    calcSellSum(currentIdx); 
}

// ============================================================================
// 📱 6. 미니 리모컨 팝업 기능
// ============================================================================
function openMiniPopup() {
    const w = 300, h = 480, popup = window.open("", "MapleMini", `width=${w},height=${h},left=${window.screen.width - w - 20},top=20,scrollbars=no,resizable=yes`);
    if (!popup) return omniModal({ title: '차단됨', desc: '팝업 차단 설정을 해제해주세요!', icon: '⚠️' });
    let optionsHTML = '<option value="" disabled selected>👤 캐릭터 선택</option>'; document.querySelectorAll('.tab-btn').forEach((tab, index) => { const nameInput = document.getElementById('nameInput_' + (index + 1)); optionsHTML += `<option value="${index + 1}">${nameInput ? nameInput.value : '캐릭터 ' + (index + 1)}</option>`; });
    popup.document.open(); popup.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>리모컨</title><style>body { font-family: "Pretendard", sans-serif; padding: 10px; background: #f1f2f6; margin: 0; }.mini-card { background: #1a1a2e; padding: 12px; border-radius: 15px; color: #fff; text-align: center; border: 1px solid #c9a55c; margin-bottom: 10px; }.timer-text { font-size: 32px; font-weight: 900; color: #ffd700; font-family: monospace; }.btn-timer { background: rgba(255,215,0,0.1); border: 1px solid #ffd700; color: #ffd700; padding: 3px 8px; border-radius: 5px; cursor: pointer; }.input-grid { background: white; padding: 10px; border-radius: 12px; }.row { display: flex; gap: 5px; margin-bottom: 8px; }.field label { display: block; font-size: 10px; color: #777; font-weight: bold; }.field input { width: 100%; padding: 5px; border: 1px solid #ddd; border-radius: 6px; font-size: 12px; box-sizing: border-box; }.btn-record { width: 100%; padding: 12px; background: #6c5ce7; color: white; border: none; border-radius: 10px; font-weight: bold; cursor: pointer; }</style></head><body><div class="mini-card"><div class="timer-text" id="w_timer">00:00</div><div><button class="btn-timer" onclick="window.opener.startTimer()">▶</button><button class="btn-timer" onclick="window.opener.stopOrResumeTimer()">⏸</button><button class="btn-timer" onclick="window.opener.resetTimer()">🔄</button></div><select id="char_select" onchange="loadChar(this.value)">${optionsHTML}</select></div><div id="w_content"></div><script>let activeIdx = null; setInterval(() => { if (!window.opener) return; const mainT = window.opener.document.getElementById("timerDisplay"); if (mainT) document.getElementById("w_timer").innerText = mainT.innerText; }, 500); function syncToMain(field, value) { if (!activeIdx || !window.opener) return; const target = window.opener.document.getElementById(field + "_" + activeIdx); if (target) { target.value = value; window.opener.updateAll(activeIdx); } } function loadChar(idx) { activeIdx = idx; const op = window.opener; const mEl=op.document.getElementById("map_"+idx), meEl=op.document.getElementById("meso_"+idx), eEl=op.document.getElementById("exp_"+idx), gEl=op.document.getElementById("gem_"+idx), fEl=op.document.getElementById("frag_"+idx); document.getElementById("w_content").innerHTML = '<div class="input-grid"><div class="row"><div class="field" style="width:100%"><label>📍 사냥터</label><input type="text" value="' + (mEl?mEl.value:'') + '" oninput="syncToMain(\\'map\\', this.value)"></div></div><div class="row"><div class="field"><label>💰 메소</label><input type="text" value="' + (meEl?meEl.value:'') + '" oninput="window.opener.onMeso(this); syncToMain(\\'meso\\', this.value)"></div><div class="field"><label>📈 경험치</label><input type="number" value="' + (eEl?eEl.value:'') + '" oninput="syncToMain(\\'exp\\', this.value)"></div></div><button class="btn-record" onclick="record()">⏱️ 기록 전송</button></div>'; } function record() { window.opener.recordSub(activeIdx); loadChar(activeIdx); }<\/script></body></html>`); popup.document.close();
}

// ============================================================================
// 🔄 7. 정보 동기화 브릿지 (Nexon API 연동)
// ============================================================================
function fetchMapleData() {
    const nameInput = document.getElementById(`nameInput_${currentIdx}`);
    const charName = nameInput ? nameInput.value.trim() : "";
    if (!charName || charName.includes("캐릭터 ")) return omniModal({ title: '캐릭터명 오류', desc: '이름을 확인해주세요!', icon: '⚠️' });
    if (typeof searchCharacter === 'function') {
        searchCharacter(charName, true); 
        omniModal({ title: '동기화 중', desc: `${charName} 님의 정보를 가져옵니다.`, icon: '📡' });
    }
}