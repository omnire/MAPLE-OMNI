/**
 * ============================================================================
 * ⚔️ MAPLE OMNI - 사냥 기록 및 타이머 전용 모듈 (hunt.js)
 * 재획 타이머, 30분 단위 기록, 출석부 달력, 영수증(OCR) 스캔 등
 * 사냥과 관련된 모든 기능이 이 파일에서 작동합니다.
 * ============================================================================
 */

// ⏱️ 사냥(재획) 및 도핑 타이머 관련 전역 변수
let timerId = null, timeLeft = 1800, isPaused = false, endTime = null; 
let buffTimerId = null, buffTimeLeft = 0; 
let currentOcrMode = 'hunt'; // OCR(이미지 인식) 기본 모드

// 📝 사냥 기록을 기억하는 저장소
let subHistory = {1:[], 2:[], 3:[], 4:[]}; 
let huntRecords = JSON.parse(localStorage.getItem('maple_hunt_records')) || []; 
let currentIdx = 1; // 현재 선택된 캐릭터 탭 번호

// ============================================================================
// 🕒 타이머 및 도핑 로직
// ============================================================================
function startTimer() { if (!timerId) { endTime = Date.now() + (timeLeft * 1000); timerId = setInterval(() => { timeLeft = Math.round((endTime - Date.now()) / 1000); if (timeLeft <= 0) { timeLeft = 0; stopTimer(); updateTD(); alert("📢 30분 소재 종료!"); timeLeft = 1800; } updateTD(); }, 1000); isPaused = false; updateTimerButtons(); } }
function stopOrResumeTimer() { if (timerId) { clearInterval(timerId); timerId = null; isPaused = true; } else if (isPaused) { startTimer(); } updateTimerButtons(); }
function stopTimer() { clearInterval(timerId); timerId = null; isPaused = false; updateTimerButtons(); }
function resetTimer() { stopTimer(); timeLeft = 1800; isPaused = false; updateTD(); updateTimerButtons(); }
function updateTD() { const m = Math.floor(timeLeft/60), s = timeLeft%60; document.getElementById('timerDisplay').innerText = `${m}:${s<10?'0':''}${s}`; }
function updateTimerButtons() { const stopBtn = document.getElementById('mainStopBtn'); if (isPaused) { stopBtn.innerText = "재개"; stopBtn.classList.add('btn-resume'); } else { stopBtn.innerText = "정지"; stopBtn.classList.remove('btn-resume'); } }

function setBuffTimer(sec) { clearInterval(buffTimerId); buffTimeLeft = sec; updateBTD(); buffTimerId = setInterval(() => { buffTimeLeft--; if(buffTimeLeft <= 0) { clearInterval(buffTimerId); alert("💊 도핑 만료!"); } updateBTD(); }, 1000); }
function updateBTD() { const m = Math.floor(buffTimeLeft/60), s = buffTimeLeft%60; document.getElementById('buffTimerDisplay').innerText = `${m}:${s<10?'0':''}${s}`; }
function resetBuffTimer() { clearInterval(buffTimerId); buffTimeLeft=0; updateBTD(); }

// ============================================================================
// 📊 사냥 데이터 입력 및 30분 기록 로직
// ============================================================================
function openHistTab(idx) { currentIdx = idx; document.querySelectorAll('#historyTabContainer .nav-btn').forEach(b => b.classList.remove('active')); document.getElementById(`hist_tab_btn_${idx}`).classList.add('active'); if(typeof renderRecords === 'function') renderRecords(); }
function addSellRow(idx) { const container = document.getElementById(`sellContainer_${idx}`); const div = document.createElement('div'); div.className = 'sell-row'; div.innerHTML = `<select><option value="" disabled selected>물품 선택</option>${sellItems.map(it=>`<option value="${it}">${it}</option>`).join('')}</select><input type="number" placeholder="개수" oninput="calcSellSum(${idx})"><input type="text" placeholder="판매 금액" oninput="onMeso(this); calcSellSum(${idx})"><button class="btn-del-row" onclick="this.parentElement.remove(); calcSellSum(${idx});">×</button>`; container.appendChild(div); }
function calcSellSum(idx) { const rows = document.getElementById(`sellContainer_${idx}`).querySelectorAll('.sell-row'); let total = 0; rows.forEach(row => { total += parseInt(row.querySelectorAll('input')[1].value.replace(/,/g, '')) || 0; }); document.getElementById(`sellTotalDisplay_${idx}`).innerText = total.toLocaleString(); return total; }
function updateTabName(idx) { const n = document.getElementById(`nameInput_${idx}`).value || `캐릭터 ${idx}`; document.getElementById(`tab_btn_${idx}`).innerText = n; document.getElementById(`hist_tab_btn_${idx}`).innerText = n; }
function onMeso(el) { let v = el.value.replace(/,/g, ""); el.value = isNaN(v) ? "" : Number(v).toLocaleString(); }
function toggleDetails(idx) { const el = document.getElementById(`details_${idx}`); el.style.display = (el.style.display === 'grid') ? 'none' : 'grid'; }

function recordSub(idx) {
    const mesoEl = document.getElementById(`meso_${idx}`), expEl = document.getElementById(`exp_${idx}`), gemEl = document.getElementById(`gem_${idx}`), fragEl = document.getElementById(`frag_${idx}`);
    const curM = parseInt(mesoEl.value.replace(/,/g, "")) || 0, curE = parseFloat(expEl.value) || 0, curG = parseInt(gemEl.value) || 0, curF = parseInt(fragEl.value) || 0;
    if (curM === 0 && curE === 0) return alert("현재 메소와 경험치를 입력해주세요!");
    let prevM = 0, prevE = 0, prevG = 0, prevF = 0;
    if (subHistory[idx] && subHistory[idx].length > 0) {
        const lastLog = subHistory[idx][subHistory[idx].length - 1];
        prevM = parseInt(lastLog.fullMeso)||0; prevE = parseFloat(lastLog.fullExp)||0; prevG = parseInt(lastLog.fullGem)||0; prevF = parseInt(lastLog.fullFrag)||0;
    } else {
        prevM = parseInt(document.getElementById(`startMeso_${idx}`).value.replace(/,/g, ""))||0; prevE = parseFloat(document.getElementById(`startExp_${idx}`).value)||0; prevG = parseInt(document.getElementById(`startGem_${idx}`).value)||0; prevF = parseInt(document.getElementById(`startFrag_${idx}`).value)||0;
    }
    const diffM = Math.max(0, curM - prevM), diffE = Math.max(0, curE - prevE), diffG = Math.max(0, curG - prevG), diffF = Math.max(0, curF - prevF);
    
    let sDetail = [], sSum = 0;
    document.getElementById(`sellContainer_${idx}`)?.querySelectorAll('.sell-row').forEach(row => {
        const item = row.querySelector('select').value, cnt = row.querySelectorAll('input')[0].value, price = row.querySelectorAll('input')[1].value;
        if(item && cnt) { sDetail.push(`${item}(${cnt}개)`); sSum += parseInt(price.replace(/,/g, '')) || 0; }
    });

    subHistory[idx].push({ id: Date.now(), time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), meso: diffM.toLocaleString() + " 메소", fullMeso: curM, exp: diffE.toFixed(3) + " %", fullExp: curE, gem: diffG, fullGem: curG, frag: diffF, fullFrag: curF, sellSum: sSum.toLocaleString() + " 메소", sellDetail: sDetail.length > 0 ? sDetail.join(', ') : "없음" });
    localStorage.setItem(`maple_subHistory_${idx}`, JSON.stringify(subHistory[idx]));
    updateSubDisplay(idx); updateAll(idx); resetTimer(); markAttendance();
    
    mesoEl.value = ""; expEl.value = ""; gemEl.value = ""; fragEl.value = "";
    const sellContainer = document.getElementById(`sellContainer_${idx}`);
    if(sellContainer) { sellContainer.innerHTML = `<div class="sell-row"><select><option value="" disabled selected>물품 선택</option>${sellItems.map(it=>`<option value="${it}">${it}</option>`).join('')}</select><input type="number" placeholder="개수" oninput="calcSellSum(${idx})"><input type="text" placeholder="판매 금액" oninput="onMeso(this); calcSellSum(${idx})"><button class="btn-del-row" onclick="this.parentElement.remove(); calcSellSum(${idx});">×</button></div>`; document.getElementById(`sellTotalDisplay_${idx}`).innerText = "0"; }
    alert("30분 기록이 저장되었습니다!");
}

function updateAll(idx) {
    let bm = 0, bd = 0;
    for(let j=0; j<statItems.length; j++){ bm += parseInt(document.getElementById(`m_stat_${j}_${idx}`).value) || 0; bd += parseInt(document.getElementById(`d_stat_${j}_${idx}`).value) || 0; }
    let hasJ = document.getElementById(`chk_4_${idx}`)?.checked;
    buffs.forEach((b, i) => { if(document.getElementById(`chk_${i}_${idx}`)?.checked) { bd += b.d; if(i !== 4) bm += b.m; } });
    document.getElementById(`currentStats_${idx}`).innerText = `${bd}% / ${hasJ ? Math.floor(((100 + bm) * 1.2) - 100) : bm}%`;
    
    let totalMeso = 0, totalExp = 0, totalGem = 0, totalFrag = 0;
    subHistory[idx].forEach(log => { totalMeso += parseInt(log.meso.replace(/[^0-9]/g, "")) || 0; totalExp += parseFloat(log.exp) || 0; totalGem += parseInt(log.gem) || 0; totalFrag += parseInt(log.frag) || 0; });
    document.getElementById(`profitMeso_${idx}`).innerText = totalMeso.toLocaleString() + " 메소"; document.getElementById(`profitExp_${idx}`).innerText = totalExp.toFixed(3) + " %"; document.getElementById(`netDrops_${idx}`).innerText = `${totalGem} / ${totalFrag}`; document.getElementById(`subCountDisplay_${idx}`).innerText = subHistory[idx].length + " 회";

    const targetVal = parseInt(document.getElementById(`targetMeso_${idx}`).value.replace(/,/g, "")) || 0, currentVal = parseInt(document.getElementById(`profitMeso_${idx}`).innerText.replace(/[^0-9]/g, "")) || 0;
    let goalP = targetVal > 0 ? Math.min((currentVal / targetVal) * 100, 100) : 0, goalR = targetVal > 0 ? Math.max(0, targetVal - currentVal) : 0;
    document.getElementById(`goalPercent_${idx}`).innerText = (goalP >= 100 && targetVal > 0) ? "🎉 목표 달성!" : goalP.toFixed(1) + "%"; document.getElementById(`progressBar_${idx}`).style.width = goalP + "%"; document.getElementById(`remainMeso_${idx}`).innerText = goalR.toLocaleString(); document.getElementById(`goalPercent_${idx}`).style.color = (goalP >= 100 && targetVal > 0) ? "#2ecc71" : "var(--accent)";

    if (totalMeso > 0) { const dayEl = document.getElementById(`day-${new Date().getDate()}`); if (dayEl) dayEl.classList.add('active'); }
    saveConfig(idx);
}

function updateSubDisplay(idx) {
    document.getElementById(`subRecordList_${idx}`).innerHTML = subHistory[idx].map((d, i) => `<div class="sub-item"><button onclick="removeSub(${idx},${d.id})" style="position:absolute;top:5px;right:5px;border:none;color:red;background:none;cursor:pointer;">×</button><div class="sub-item-header"><b>${i+1}소재 기록</b> <input type="text" class="sub-time-input" value="${d.time}" onchange="editSubTime(${idx},${d.id},this.value)"></div><div class="sub-tag-group"><div class="sub-tag tag-meso">💰 ${d.meso}</div><div class="sub-tag tag-exp">📈 ${d.exp}</div><div class="sub-tag tag-frag">🧩 조각: ${d.frag}</div><div class="sub-tag tag-gem">💎 코젬: ${d.gem}</div><div class="sub-tag tag-sell">🛍️ 부수입: ${d.sellSum}</div></div></div>`).join('');
}

function saveFinalRecord(idx) {
    if(!confirm("기록지로 전송할까요?")) return;
    const now = new Date(); huntRecords.push({ id: Date.now(), date: now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0'), name: document.getElementById(`nameInput_${idx}`).value, map: document.getElementById(`map_${idx}`).value || "미지정", meso: document.getElementById(`profitMeso_${idx}`).innerText, exp: document.getElementById(`profitExp_${idx}`).innerText, drops: document.getElementById(`netDrops_${idx}`).innerText, subs: subHistory[idx].length });
    saveAndRefresh(); alert("기록 완료!");
}

function resetCurrentHunt(idx) { if(!confirm("리셋할까요?")) return; ['startMeso','startExp','startGem','startFrag','meso','exp','gem','frag','map'].forEach(id => { if(document.getElementById(`${id}_${idx}`)) document.getElementById(`${id}_${idx}`).value = ""; }); subHistory[idx] = []; localStorage.removeItem(`maple_subHistory_${idx}`); updateSubDisplay(idx); updateAll(idx); }

// ============================================================================
// 📜 통합 로그 표 관리
// ============================================================================
function saveAndRefresh() { 
    localStorage.setItem('maple_hunt_records', JSON.stringify(huntRecords)); 
    if(typeof renderRecords === 'function') renderRecords(); 
}

function renderRecords() {
    const tbody = document.getElementById('recordTableBody');
    if (!tbody) return;

    huntRecords = JSON.parse(localStorage.getItem('maple_hunt_records')) || [];
    const dateFilter = document.getElementById('dateFilter');
    const filterValue = dateFilter ? dateFilter.value : '';

    let filteredRecords = huntRecords;
    if (filterValue) {
        filteredRecords = huntRecords.filter(r => r.date === filterValue);
    }

    filteredRecords.sort((a, b) => {
        if (b.date !== a.date) return b.date.localeCompare(a.date);
        return b.id - a.id;
    });

    let html = '';
    let lastDate = '';

    filteredRecords.forEach(record => {
        if (record.date !== lastDate) {
            html += `<tr class="date-group-header"><td colspan="7" style="text-align: left; padding: 12px 20px; border-left: 6px solid var(--accent);"><span class="date-group-text">📅 ${record.date} 사냥 기록</span></td></tr>`;
            lastDate = record.date;
        }
        html += `
        <tr>
            <td style="color: #94a3b8; font-size: 11px; font-weight: 700;">${record.date}</td>
            <td style="font-weight: 800; color: #1e293b;">${record.name}</td>
            <td style="color: #64748b; text-align: left;">${record.map}</td>
            <td style="color: #ff9100; font-weight: 800;">${record.meso}</td>
            <td style="color: #8b5cf6; font-weight: 700;">${record.exp}</td>
            <td style="color: #10b981; font-weight: 700;">${record.drops}</td>
            <td>
                <div style="display: flex; gap: 6px; justify-content: center;">
                    <button onclick="editRecordDate(${record.id})" style="background: #f1f5f9; color: #475569; border: 1px solid #dfe6e9; padding: 5px 10px; border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: 800; transition: 0.2s;">수정</button>
                    <button onclick="deleteRecord(${record.id})" style="background: #fff1f2; color: #e11d48; border: 1px solid #fecdd3; padding: 5px 10px; border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: 800; transition: 0.2s;">삭제</button>
                </div>
            </td>
        </tr>`;
    });

    if (filteredRecords.length === 0) {
        html = `<tr><td colspan="7" style="text-align: center; padding: 50px; color: #94a3b8; font-weight: 800;">데이터가 없습니다. 소재 종료 후 '기록지 전송'을 눌러주세요!</td></tr>`;
    }
    tbody.innerHTML = html;
}

function editRecordDate(recordId) {
    const record = huntRecords.find(r => r.id === recordId);
    if (record) {
        const newDate = prompt("기록의 날짜를 변경하시겠습니까? (예: 2026-04-18)", record.date);
        if (newDate && /^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
            record.date = newDate; saveAndRefresh(); showAlert(`✅ [${record.name}] 기록이 ${newDate}로 이동되었습니다.`);
        } else if (newDate) alert("❌ 날짜 형식을 맞춰주세요 (YYYY-MM-DD)");
    }
}
function deleteRecord(id) { if(confirm("이 기록을 삭제할까요?")) { huntRecords = huntRecords.filter(r => r.id !== id); saveAndRefresh(); } }
function resetDateFilter() { const filter = document.getElementById('dateFilter'); if(filter) filter.value = ''; renderRecords(); }
function saveConfig(idx) {
    const cfg = { name: document.getElementById(`nameInput_${idx}`).value, stats: {}, doping: buffs.map((_, i) => document.getElementById(`chk_${i}_${idx}`)?.checked), currentVals: { startMeso: document.getElementById(`startMeso_${idx}`).value, startExp: document.getElementById(`startExp_${idx}`).value, startGem: document.getElementById(`startGem_${idx}`).value, startFrag: document.getElementById(`startFrag_${idx}`).value, map: document.getElementById(`map_${idx}`).value, meso: document.getElementById(`meso_${idx}`).value, exp: document.getElementById(`exp_${idx}`).value, gem: document.getElementById(`gem_${idx}`).value, frag: document.getElementById(`frag_${idx}`).value } };
    for(let j=0; j<statItems.length; j++) { cfg.stats[`m_stat_${j}`] = document.getElementById(`m_stat_${j}_${idx}`).value; cfg.stats[`d_stat_${j}`] = document.getElementById(`d_stat_${j}_${idx}`).value; }
    localStorage.setItem(`maple_config_${idx}`, JSON.stringify(cfg));
}
function loadData() {
    for(let i=1; i<=4; i++) {
        const cfg = JSON.parse(localStorage.getItem(`maple_config_${i}`));
        if(cfg) { document.getElementById(`nameInput_${i}`).value = cfg.name || ""; updateTabName(i); if(cfg.stats) for(let j=0; j<statItems.length; j++) { if(document.getElementById(`m_stat_${j}_${i}`)) document.getElementById(`m_stat_${j}_${i}`).value = cfg.stats[`m_stat_${j}`] || 0; if(document.getElementById(`d_stat_${j}_${i}`)) document.getElementById(`d_stat_${j}_${i}`).value = cfg.stats[`d_stat_${j}`] || 0; } if(cfg.doping) cfg.doping.forEach((c, idx) => { if(document.getElementById(`chk_${idx}_${i}`)) document.getElementById(`chk_${idx}_${i}`).checked = c; }); if(cfg.currentVals) for(let k in cfg.currentVals) { if(document.getElementById(`${k}_${i}`)) document.getElementById(`${k}_${i}`).value = cfg.currentVals[k] || ""; } }
        const savedSub = localStorage.getItem(`maple_subHistory_${i}`); if(savedSub) { subHistory[i] = JSON.parse(savedSub); updateSubDisplay(i); } updateAll(i);
    }
}

// ============================================================================
// 📅 출석부 달력
// ============================================================================
let viewDate = new Date();
function renderAttendance() { 
    const grid = document.getElementById('attendanceGrid'); 
    if(!grid) return; 
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
        let className = "calendar-day"; let content = `${i}`; 
        if (attendanceData.includes(currentFullDate)) content = `${i}<br><span class="check-mark">✔</span>`;
        if (i === realToday.getDate() && month === realToday.getMonth() && year === realToday.getFullYear()) className += " today"; 
        html += `<div class="${className}">${content}</div>`; 
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
// 📸 이미지 스캔(OCR) 연동
// ============================================================================
function setOcrMode(mode) {
    currentOcrMode = mode;
    const btnHunt = document.getElementById('btnModeHunt'), btnSell = document.getElementById('btnModeSell'), desc = document.getElementById('ocrModeDesc');
    if (mode === 'hunt') { if(btnHunt) { btnHunt.style.borderColor = 'var(--accent)'; btnHunt.style.background = 'rgba(255, 145, 0, 0.1)'; } if(btnSell) { btnSell.style.borderColor = '#eee'; btnSell.style.background = '#f8f9fa'; } if(desc) desc.innerText = "현재 모드: 사냥 결과 분석"; } 
    else { if(btnSell) { btnSell.style.borderColor = 'var(--blue)'; btnSell.style.background = 'rgba(52, 152, 219, 0.1)'; } if(btnHunt) { btnHunt.style.borderColor = '#eee'; btnHunt.style.background = '#f8f9fa'; } if(desc) desc.innerText = "현재 모드: 경매장 판매"; }
}
function openOcrModal() { const modal = document.getElementById('ocrModal'); if (modal) modal.style.display = 'flex'; }
function closeOcrModal() { const modal = document.getElementById('ocrModal'); if (modal) { modal.style.display = 'none'; resetOcrModal(); } }
function resetOcrModal() { document.getElementById('dropZoneText').style.display = 'block'; document.getElementById('modalOcrStatus').style.display = 'none'; document.getElementById('modalOcrBar').style.width = '0%'; document.getElementById('modalOcrPercent').innerText = '0%'; setOcrMode('hunt'); }

document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('dropZone');
    if (!dropZone) return;
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(e => { dropZone.addEventListener(e, ev => { ev.preventDefault(); ev.stopPropagation(); }, false); });
    dropZone.addEventListener('drop', ev => { const dt = ev.dataTransfer, files = dt.files; if (files && files[0] && files[0].type.includes('image')) processOCR(files[0]); });
});
window.addEventListener('paste', function(e) { const page1 = document.getElementById('page_1'); if (page1 && page1.style.display === 'none') return; const items = e.clipboardData.items; for (let i = 0; i < items.length; i++) { if (items[i].type.indexOf("image") !== -1) { if (document.getElementById('ocrModal').style.display !== 'flex') openOcrModal(); processOCR(items[i].getAsFile()); } } });

async function processOCR(blob) {
    document.getElementById('modalOcrStatus').style.display = 'block';
    try {
        const img = new Image(); img.src = URL.createObjectURL(blob);
        await new Promise(resolve => { img.onload = resolve; });
        const canvas = document.createElement('canvas'), ctx = canvas.getContext('2d');
        let results = {};

        if (currentOcrMode === 'hunt') {
            const regions = [ { id: 'exp', x: 0, y: 0.8, w: 1, h: 0.2 }, { id: 'meso', x: 0.3, y: 0.5, w: 0.7, h: 0.3 }, { id: 'frag', x: 0.7, y: 0.3, w: 0.3, h: 0.4 }, { id: 'gem', x: 0.3, y: 0.7, w: 0.4, h: 0.3 } ];
            for (let reg of regions) {
                canvas.width = img.width * reg.w; canvas.height = img.height * reg.h;
                ctx.filter = 'grayscale(100%) invert(100%) contrast(500%)'; 
                ctx.drawImage(img, img.width * reg.x, img.height * reg.y, img.width * reg.w, img.height * reg.h, 0, 0, canvas.width, canvas.height);
                const res = await Tesseract.recognize(canvas.toDataURL(), 'kor+eng');
                results[reg.id] = res.data.text;
                document.getElementById('modalOcrBar').style.width = (Object.keys(results).length * 25) + "%";
            }
            const exp = results.exp.match(/(\d+\.\d{3})/), mesoMatch = results.meso.replace(/[^0-9]/g, ''), fragNums = results.frag.match(/\d+/g), frag = fragNums ? fragNums[fragNums.length - 1] : "0", gemMatch = results.gem.match(/0\s+(\d+)/) || results.gem.match(/\d+/);
            if (exp) document.getElementById(`exp_${currentIdx}`).value = exp[0];
            if (mesoMatch) document.getElementById(`meso_${currentIdx}`).value = Number(mesoMatch).toLocaleString();
            if (gemMatch) document.getElementById(`gem_${currentIdx}`).value = Array.isArray(gemMatch) ? gemMatch[1] : gemMatch;
            if (frag) document.getElementById(`frag_${currentIdx}`).value = frag;
            updateAll(currentIdx); showAlert("✨ 사냥 데이터 인식 시도 완료!"); setTimeout(closeOcrModal, 1200);
        } else {
            canvas.width = img.width; canvas.height = img.height;
            ctx.filter = 'threshold(0.5) contrast(300%)';
            ctx.drawImage(img, 0, 0);
            const res = await Tesseract.recognize(canvas.toDataURL(), 'kor+eng');
            document.getElementById('modalOcrBar').style.width = "100%";
            parseAuctionResults(res.data.text);
        }
    } catch (e) { console.error(e); showAlert("❌ 분석 중 오류 발생."); }
}

function parseAuctionResults(fullText) {
    const lines = fullText.split('\n').map(l => l.trim()).filter(l => l.length > 0), detectedItems = [];
    let headerIndex = lines.findIndex(l => l.includes("아이템") || l.includes("금액") || l.includes("처리"));
    for (let i = headerIndex + 1; i < lines.length; i++) {
        const line = lines[i];
        if (!(line.includes("수령 완료") || line.includes("수령완료")) && (line.includes("대금") || line.includes("판매 완료") || line.includes("낙찰"))) {
            const numbers = line.match(/[\d,]{4,}/g); let price = numbers ? numbers[numbers.length - 1].replace(/,/g, '') : "0";
            let itemName = line.split("판매")[0].split("낙찰")[0].replace(/\d{4}-\d{2}-\d{2}/g, '').replace(/\(.*\)/g, '').replace(/[0-9]/g, '').replace(/[\[\]\-\:\.\|]/g, '').trim();
            if (itemName.length < 2) itemName = "이름 인식 필요";
            if (parseInt(price) > 100) detectedItems.push({ item: itemName, price: parseInt(price) });
        }
    }
    if (detectedItems.length > 0) { fillAuctionSellRows(detectedItems); showAlert(`🛍️ 정산 필요한 ${detectedItems.length}건 추가됨!`); } 
    else showAlert("❌ 정산 가능한 항목이 없습니다.");
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

// 📱 미니 리모컨 팝업 기능
function openMiniPopup() {
    const w = 300, h = 480, popup = window.open("", "MapleMini", `width=${w},height=${h},left=${window.screen.width - w - 20},top=20,scrollbars=no,resizable=yes`);
    if (!popup) return alert("⚠️ 팝업 차단이 감지되었습니다!");
    let optionsHTML = '<option value="" disabled selected>👤 캐릭터 선택</option>'; document.querySelectorAll('.tab-btn').forEach((tab, index) => { const nameInput = document.getElementById('nameInput_' + (index + 1)); optionsHTML += `<option value="${index + 1}">${nameInput ? nameInput.value : '캐릭터 ' + (index + 1)}</option>`; });
    popup.document.open(); popup.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>사냥 리모컨</title><style>body { font-family: "Pretendard", sans-serif; padding: 10px; background: #f1f2f6; margin: 0; overflow: hidden; }.mini-card { background: #1a1a2e; padding: 12px; border-radius: 15px; color: #fff; text-align: center; border: 1px solid #c9a55c; margin-bottom: 10px; }.timer-text { font-size: 32px; font-weight: 900; color: #ffd700; margin-bottom: 5px; font-family: monospace; }.btn-timer { background: rgba(255,215,0,0.1); border: 1px solid #ffd700; color: #ffd700; padding: 3px 8px; border-radius: 5px; font-size: 11px; cursor: pointer; margin: 0 2px; }#char_select { width: 100%; margin-top: 10px; background: #2d3436; color: white; border: 1px solid #555; border-radius: 5px; padding: 4px; font-size: 12px; }.input-grid { background: white; padding: 10px; border-radius: 12px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }.row { display: flex; gap: 5px; margin-bottom: 8px; }.field { flex: 1; }.field label { display: block; font-size: 10px; color: #777; font-weight: bold; margin-bottom: 2px; }.field input { width: 100%; padding: 5px; border: 1px solid #ddd; border-radius: 6px; font-size: 12px; text-align: center; box-sizing: border-box; outline: none; }.field input:focus { border-color: #6c5ce7; }.btn-record { width: 100%; padding: 12px; background: #6c5ce7; color: white; border: none; border-radius: 10px; font-weight: bold; font-size: 14px; cursor: pointer; margin-top: 5px; }.btn-clear { width: 100%; padding: 6px; background: none; color: #ff7675; border: 1px solid #ff7675; border-radius: 8px; font-size: 11px; cursor: pointer; margin-top: 8px; }</style></head><body><div class="mini-card"><div class="timer-text" id="w_timer">00:00</div><div><button class="btn-timer" onclick="window.opener.startTimer()">▶ 재생</button><button class="btn-timer" onclick="window.opener.stopOrResumeTimer()">⏸ 정지</button><button class="btn-timer" onclick="window.opener.resetTimer()">🔄 리셋</button></div><select id="char_select" onchange="loadChar(this.value)">${optionsHTML}</select></div><div id="w_content" style="text-align:center; font-size:11px; color:#999; margin-top:30px;">캐릭터를 선택해 주세요 🍁</div><script>let activeIdx = null; setInterval(() => { if (!window.opener) return; const mainT = window.opener.document.getElementById("timerDisplay"); if (mainT) document.getElementById("w_timer").innerText = mainT.innerText; }, 500); function syncToMain(field, value) { if (!activeIdx || !window.opener) return; const target = window.opener.document.getElementById(field + "_" + activeIdx); if (target) { target.value = value; window.opener.updateAll(activeIdx); } } function loadChar(idx) { activeIdx = idx; const op = window.opener, mapV = op.document.getElementById("map_" + idx).value, mesoV = op.document.getElementById("meso_" + idx).value, expV = op.document.getElementById("exp_" + idx).value, gemV = op.document.getElementById("gem_" + idx).value, fragV = op.document.getElementById("frag_" + idx).value; document.getElementById("w_content").innerHTML = '<div class="input-grid"><div class="row"><div class="field"><label>📍 사냥터</label><input type="text" value="' + mapV + '" oninput="syncToMain(\\'map\\', this.value)"></div></div><div class="row"><div class="field"><label>💰 현재 메소</label><input type="text" value="' + mesoV + '" oninput="window.opener.onMeso(this); syncToMain(\\'meso\\', this.value)"></div><div class="field"><label>📈 현재 경험치</label><input type="number" value="' + expV + '" step="0.001" oninput="syncToMain(\\'exp\\', this.value)"></div></div><div class="row"><div class="field"><label>💎 현재 코젬</label><input type="number" value="' + gemV + '" oninput="syncToMain(\\'gem\\', this.value)"></div><div class="field"><label>🧩 현재 조각</label><input type="number" value="' + fragV + '" oninput="syncToMain(\\'frag\\', this.value)"></div></div><button class="btn-record" onclick="record()">⏱️ 30분 소재 기록</button><button class="btn-clear" onclick="resetInputs()">🗑️ 입력칸 비우기</button></div>'; } function record() { window.opener.recordSub(activeIdx); document.body.style.background = "#d1ffd1"; setTimeout(() => { document.body.style.background = "#f1f2f6"; loadChar(activeIdx); }, 300); } function resetInputs() { if(!confirm("초기화할까요?")) return; ["map", "meso", "exp", "gem", "frag"].forEach(id => syncToMain(id, "")); loadChar(activeIdx); }<\/script></body></html>`); popup.document.close();
}