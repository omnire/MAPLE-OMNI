/**
 * ============================================================================
 * 🍁 MAPLE OMNI V13.6.5 - 메인 자바스크립트 (Full Version)
 * ============================================================================
 * 초보자 가이드: 이 파일은 웹사이트의 '두뇌' 역할을 합니다.
 * 버튼을 눌렀을 때 화면이 바뀌거나, 넥슨 서버에서 데이터를 가져오는 등
 * 모든 동작(기능)이 이곳에 기록되어 있습니다.
 */

// --- [1. 기본 설정 및 전역 변수 (데이터 저장소)] ---
const API_KEY = "test_b4b72659365dd8f8e050630f7d05b609548335ee63fb773f616d4a4c479769e7efe8d04e6d233bd35cf2fabdeb93fb0d";

// 타이머 관련 변수들
let timerId = null, timeLeft = 1800, isPaused = false, endTime = null; 
let buffTimerId = null, buffTimeLeft = 0; 
let currentOcrMode = 'hunt'; // OCR 모드 (hunt: 사냥, sell: 판매)

// 사냥 스탯 및 도핑 아이템 리스트 (d: 드롭률, m: 메획)
const statItems = ['장비 아이템', '유니온 공격대', '어빌리티', '아티팩트', '스킬'];
const buffs = [
    { name: 'VIP 버프', d: 0, m: 0 }, { name: '추가 경험치 쿠폰(50%)', d: 0, m: 0 }, { name: '경험치 3배 쿠폰', d: 0, m: 0 },
    { name: '경험치 4배쿠폰', d: 0, m: 0 }, { name: '소형 재물 획득의 비약', d: 20, m: 1.2 }, { name: '소형 경험 축적의 비약', d: 10, m: 0 },
    { name: '유니온의 행운', d: 50, m: 0 }, { name: '유니온의 부', d: 0, m: 50 }, { name: '익스트림 골드', d: 0, m: 0 }
];
const sellItems = ["솔 에르다 조각", "코어 젬스톤", "어센틱 심볼", "상급 주문의 정수", "뒤틀린 시간의 정수", "기타"];

// 기록을 저장하는 배열과 현재 선택된 탭(1~4번) 번호
let subHistory = {1:[], 2:[], 3:[], 4:[]}; 
let huntRecords = JSON.parse(localStorage.getItem('maple_hunt_records')) || []; 
let currentIdx = 1; 

// --- [2. 넥슨 API 통신 기능 (사냥앱 전용)] ---
// 상세 설명: 입력한 캐릭터명을 넥슨 서버에 보내서 레벨, 직업, 전투력 등을 가져옵니다.
async function fetchMapleData() {
    const nameInput = document.getElementById(`nameInput_${currentIdx}`);
    const charName = nameInput.value.trim();
    if (!charName) { return; } 

    try {
        // 1단계: 캐릭터명으로 고유 식별자(OCID) 가져오기
        const ocidRes = await fetch(`https://open.api.nexon.com/maplestory/v1/id?character_name=${encodeURIComponent(charName)}`, { headers: { "x-nxopen-api-key": API_KEY } });
        const ocidData = await ocidRes.json();
        if (!ocidData.ocid) throw new Error("캐릭터를 찾을 수 없습니다.");
        const ocid = ocidData.ocid;

        // 2단계: 기본 정보(레벨, 직업 등) 가져오기
        const basicRes = await fetch(`https://open.api.nexon.com/maplestory/v1/character/basic?ocid=${ocid}`, { headers: { "x-nxopen-api-key": API_KEY } });
        const basicData = await basicRes.json();

        // 3단계: 화면에 기본 정보 표시하기
        document.getElementById('profileImg').src = basicData.character_image;
        document.getElementById('profileName').innerText = basicData.character_name;
        document.getElementById('profileLevel').innerText = `Lv. ${basicData.character_level}`;
        document.getElementById('profileJob').innerText = basicData.character_class;
        document.getElementById('profileWorld').innerText = basicData.world_name;
        document.getElementById('profileGuild').innerText = basicData.character_guild_name || "길드 없음";

        // 4단계: 스탯 정보(전투력 등) 가져오기
        const statRes = await fetch(`https://open.api.nexon.com/maplestory/v1/character/stat?ocid=${ocid}`, { headers: { "x-nxopen-api-key": API_KEY } });
        const statData = await statRes.json();
        
        // 특정 스탯만 쏙 뽑아오는 보조 함수
        const getStatValue = (target) => {
            const found = statData.final_stat.find(s => s.stat_name === target);
            return found ? found.stat_value : "0";
        };
        
        // 전투력과 공격력 표시 (숫자에 콤마 찍어서 깔끔하게)
        document.getElementById('stat_power').innerText = Number(getStatValue("전투력")).toLocaleString();
        document.getElementById('stat_atk').innerText = Number(getStatValue("최대 스탯 공격력")).toLocaleString();
        document.getElementById('stat_dmg').innerText = getStatValue("데미지") + "%";

    } catch (e) { console.error(e); }
}

// --- [3. 타이머 작동 로직] ---
// 상세 설명: 30분 사냥 타이머를 시작, 정지, 리셋하는 기능입니다.
function startTimer() { 
    if (!timerId) { 
        endTime = Date.now() + (timeLeft * 1000); 
        timerId = setInterval(() => { 
            const now = Date.now(); 
            timeLeft = Math.round((endTime - now) / 1000); 
            if (timeLeft <= 0) { 
                timeLeft = 0; 
                stopTimer(); 
                updateTD(); 
                alert("📢 30분 소재 종료!"); 
                timeLeft = 1800; // 시간이 끝나면 다시 30분으로 세팅
            } 
            updateTD(); 
        }, 1000); 
        isPaused = false; 
        updateTimerButtons(); 
    } 
}
function stopOrResumeTimer() { if (timerId) { clearInterval(timerId); timerId = null; isPaused = true; } else if (isPaused) { startTimer(); } updateTimerButtons(); }
function stopTimer() { clearInterval(timerId); timerId = null; isPaused = false; updateTimerButtons(); }
function resetTimer() { stopTimer(); timeLeft = 1800; isPaused = false; updateTD(); updateTimerButtons(); }
function updateTD() { const m = Math.floor(timeLeft/60), s = timeLeft%60; document.getElementById('timerDisplay').innerText = `${m}:${s<10?'0':''}${s}`; }
function updateTimerButtons() { const stopBtn = document.getElementById('mainStopBtn'); if (isPaused) { stopBtn.innerText = "재개"; stopBtn.classList.add('btn-resume'); } else { stopBtn.innerText = "정지"; stopBtn.classList.remove('btn-resume'); } }

// --- [4. 30분 소재 기록 로직] ---
// 상세 설명: 한 번 사냥(30분)이 끝났을 때 벌어들인 재화를 계산하고 저장합니다.
function recordSub(idx) {
    const mesoEl = document.getElementById(`meso_${idx}`);
    const expEl = document.getElementById(`exp_${idx}`);
    const gemEl = document.getElementById(`gem_${idx}`);
    const fragEl = document.getElementById(`frag_${idx}`);

    const curM = parseInt(mesoEl.value.replace(/,/g, "")) || 0;
    const curE = parseFloat(expEl.value) || 0;
    const curG = parseInt(gemEl.value) || 0;
    const curF = parseInt(fragEl.value) || 0;

    if (curM === 0 && curE === 0) { alert("현재 메소와 경험치를 입력해주세요!"); return; }

    let prevM, prevE, prevG, prevF;
    if (subHistory[idx] && subHistory[idx].length > 0) {
        // 이전 기록이 있으면 마지막 기록을 기준으로 차이를 계산합니다.
        const lastLog = subHistory[idx][subHistory[idx].length - 1];
        prevM = parseInt(lastLog.fullMeso) || 0;
        prevE = parseFloat(lastLog.fullExp) || 0;
        prevG = parseInt(lastLog.fullGem) || 0;
        prevF = parseInt(lastLog.fullFrag) || 0;
    } else {
        // 첫 번째 기록이면 시작 값과 비교합니다.
        prevM = parseInt(document.getElementById(`startMeso_${idx}`).value.replace(/,/g, "")) || 0;
        prevE = parseFloat(document.getElementById(`startExp_${idx}`).value) || 0;
        prevG = parseInt(document.getElementById(`startGem_${idx}`).value) || 0;
        prevF = parseInt(document.getElementById(`startFrag_${idx}`).value) || 0;
    }

    const diffM = Math.max(0, curM - prevM);
    const diffE = Math.max(0, curE - prevE);
    const diffG = Math.max(0, curG - prevG);
    const diffF = Math.max(0, curF - prevF);

    const sellContainer = document.getElementById(`sellContainer_${idx}`);
    const sellRows = sellContainer ? sellContainer.querySelectorAll('.sell-row') : [];
    let sDetail = [], sSum = 0;
    sellRows.forEach(row => {
        const item = row.querySelector('select').value;
        const cnt = row.querySelectorAll('input')[0].value;
        const price = row.querySelectorAll('input')[1].value;
        if(item && cnt) {
            sDetail.push(`${item}(${cnt}개)`);
            sSum += parseInt(price.replace(/,/g, '')) || 0;
        }
    });

    const newSub = {
        id: Date.now(),
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        meso: diffM.toLocaleString() + " 메소",
        fullMeso: curM,
        exp: diffE.toFixed(3) + " %",
        fullExp: curE,
        gem: diffG,
        fullGem: curG,
        frag: diffF,
        fullFrag: curF,
        sellSum: sSum.toLocaleString() + " 메소",
        sellDetail: sDetail.length > 0 ? sDetail.join(', ') : "없음"
    };

    // 기록을 저장하고 화면을 새로고침합니다.
    subHistory[idx].push(newSub);
    localStorage.setItem(`maple_subHistory_${idx}`, JSON.stringify(subHistory[idx]));
    updateSubDisplay(idx);
    updateAll(idx);
    resetTimer();
    markAttendance();

    // 입력창 초기화
    mesoEl.value = ""; expEl.value = ""; gemEl.value = ""; fragEl.value = "";
    if(sellContainer) {
        sellContainer.innerHTML = `<div class="sell-row"><select><option value="" disabled selected>물품 선택</option>${sellItems.map(it=>`<option value="${it}">${it}</option>`).join('')}</select><input type="number" placeholder="개수" oninput="calcSellSum(${idx})"><input type="text" placeholder="판매 금액" oninput="onMeso(this); calcSellSum(${idx})"><button class="btn-del-row" onclick="this.parentElement.remove(); calcSellSum(${idx});">×</button></div>`;
        document.getElementById(`sellTotalDisplay_${idx}`).innerText = "0";
    }
    mesoEl.focus();
    alert("30분 기록이 저장되었습니다!");
}

function markAttendance() {
    const today = new Date();
    const dateStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
    let attendanceData = JSON.parse(localStorage.getItem('mapleAttendance')) || [];
    if (!attendanceData.includes(dateStr)) {
        attendanceData.push(dateStr);
        localStorage.setItem('mapleAttendance', JSON.stringify(attendanceData));
    }
    renderAttendance();
}

// --- [5. 스크린샷 분석 기능 통합 (OCR)] ---
// 상세 설명: 이미지를 드래그해서 넣으면 글씨를 읽어주는(OCR) 기능입니다.
function setOcrMode(mode) {
    currentOcrMode = mode;
    const btnHunt = document.getElementById('btnModeHunt');
    const btnSell = document.getElementById('btnModeSell');
    const desc = document.getElementById('ocrModeDesc');

    if (mode === 'hunt') {
        if(btnHunt) { btnHunt.style.borderColor = 'var(--accent)'; btnHunt.style.background = 'rgba(255, 145, 0, 0.1)'; }
        if(btnSell) { btnSell.style.borderColor = '#eee'; btnSell.style.background = '#f8f9fa'; }
        if(desc) desc.innerText = "현재 모드: 사냥 결과 분석 (전투 측정 창)";
    } else {
        if(btnSell) { btnSell.style.borderColor = 'var(--blue)'; btnSell.style.background = 'rgba(52, 152, 219, 0.1)'; }
        if(btnHunt) { btnHunt.style.borderColor = '#eee'; btnHunt.style.background = '#f8f9fa'; }
        if(desc) desc.innerText = "현재 모드: 경매장 판매 (완료 내역)";
    }
}

function openOcrModal() { 
    const modal = document.getElementById('ocrModal');
    if (modal) modal.style.display = 'flex'; 
}

function closeOcrModal() { 
    const modal = document.getElementById('ocrModal');
    if (modal) { modal.style.display = 'none'; resetOcrModal(); }
}

function resetOcrModal() {
    const textZone = document.getElementById('dropZoneText');
    const statusZone = document.getElementById('modalOcrStatus');
    const progressBar = document.getElementById('modalOcrBar');
    const percentText = document.getElementById('modalOcrPercent');
    
    if (textZone) textZone.style.display = 'block';
    if (statusZone) statusZone.style.display = 'none';
    if (progressBar) progressBar.style.width = '0%';
    if (percentText) percentText.innerText = '0%';
    setOcrMode('hunt'); 
}

// 마우스 드래그 & 드롭 이벤트
document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('dropZone');
    if (!dropZone) return;
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(e => {
        dropZone.addEventListener(e, ev => { ev.preventDefault(); ev.stopPropagation(); }, false);
    });
    dropZone.addEventListener('drop', ev => {
        const dt = ev.dataTransfer;
        const files = dt.files;
        if (files && files[0] && files[0].type.includes('image')) processOCR(files[0]);
    });
});

// Ctrl+V 붙여넣기 이벤트
window.addEventListener('paste', function(e) {
    const page1 = document.getElementById('page_1');
    if (page1 && page1.style.display === 'none') return;
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
            if (document.getElementById('ocrModal').style.display !== 'flex') openOcrModal();
            processOCR(items[i].getAsFile());
        }
    }
});

async function processOCR(blob) {
    const statusZone = document.getElementById('modalOcrStatus');
    const progressBar = document.getElementById('modalOcrBar');
    if (statusZone) statusZone.style.display = 'block';

    try {
        const img = new Image();
        img.src = URL.createObjectURL(blob);
        await new Promise(resolve => { img.onload = resolve; });

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // 이미지를 4구역으로 쪼개서 정확도를 높입니다.
        const regions = [
            { id: 'exp',  x: 0,    y: 0.8, w: 1,   h: 0.2 }, 
            { id: 'meso', x: 0.3,  y: 0.5, w: 0.7, h: 0.3 }, 
            { id: 'frag', x: 0.7,  y: 0.3, w: 0.3, h: 0.4 }, 
            { id: 'gem',  x: 0.3,  y: 0.7, w: 0.4, h: 0.3 }  
        ];

        let results = {};

        for (let reg of regions) {
            canvas.width = img.width * reg.w;
            canvas.height = img.height * reg.h;
            ctx.filter = 'grayscale(100%) contrast(400%)';
            ctx.drawImage(img, img.width * reg.x, img.height * reg.y, img.width * reg.w, img.height * reg.h, 0, 0, canvas.width, canvas.height);
            
            const res = await Tesseract.recognize(canvas.toDataURL(), 'kor+eng');
            results[reg.id] = res.data.text;
            if (progressBar) progressBar.style.width = (Object.keys(results).length * 25) + "%";
        }
        finalizeSmartParse(results);
    } catch (e) {
        console.error(e);
        showAlert("❌ 정밀 분석 중 오류가 발생했습니다.");
    }
}

function finalizeSmartParse(data) {
    const exp = data.exp.match(/(\d+\.\d{3})/);
    const mesoMatch = data.meso.replace(/[^0-9]/g, '');
    const fragNums = data.frag.match(/\d+/g);
    const frag = fragNums ? fragNums[fragNums.length - 1] : "0";
    const gemMatch = data.gem.match(/0\s+(\d+)/) || data.gem.match(/\d+/);

    const idx = currentIdx;
    if (exp) document.getElementById(`exp_${idx}`).value = exp[0];
    if (mesoMatch) document.getElementById(`meso_${idx}`).value = Number(mesoMatch).toLocaleString();
    if (gemMatch) document.getElementById(`gem_${idx}`).value = Array.isArray(gemMatch) ? gemMatch[1] : gemMatch;
    if (frag) document.getElementById(`frag_${idx}`).value = frag;

    updateAll(idx);
    showAlert("✨ 구역별 정밀 분석으로 인식을 보정했습니다!");
    setTimeout(closeOcrModal, 1200);
}

// --- [6. 초기 실행 및 화면 생성] ---
// 상세 설명: 브라우저가 열리면 캐릭터 4개의 탭과 입력창을 자동으로 만들어줍니다.
function init() {
    const container = document.getElementById('charContents');
    const tabList = document.getElementById('tabContainer');
    const histTabList = document.getElementById('historyTabContainer');
    container.innerHTML = ""; tabList.innerHTML = ""; histTabList.innerHTML = "";
    
    for(let i=1; i<=4; i++) {
        const savedName = (JSON.parse(localStorage.getItem(`maple_config_${i}`)) || {}).name || `캐릭터 ${i}`;
        tabList.innerHTML += `<button class="tab-btn ${i===currentIdx?'active':''}" id="tab_btn_${i}" onclick="openTab(${i})">${savedName}</button>`;
        histTabList.innerHTML += `<button class="nav-btn ${i===currentIdx?'active':''}" id="hist_tab_btn_${i}" onclick="openHistTab(${i})">${savedName}</button>`;
        
        container.innerHTML += `
        <div id="tab_${i}" class="content" style="${i===currentIdx?'':'display:none;'}">
            <div class="goal-card" style="background: white; padding: 20px; border-radius: 15px; border: 1px solid var(--border); margin-bottom: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <span style="font-weight: 800; color: var(--primary); font-size: 14px;">🚩 목표 달성률</span>
                    <span id="goalPercent_${i}" style="color: var(--accent); font-weight: 900; font-size: 16px;">0.0%</span>
                </div>
                <div style="background: #edf2f7; height: 12px; border-radius: 10px; overflow: hidden; border: 1px solid #e2e8f0;">
                    <div id="progressBar_${i}" style="background: linear-gradient(90deg, #ff9100, #ff6b10); height: 100%; width: 0%; transition: width 0.8s ease;"></div>
                </div>
                <div style="display: flex; justify-content: flex-end; margin-top: 8px;">
                    <small style="color: #a0aec0; font-weight: 600;">목표까지 <span id="remainMeso_${i}" style="color: var(--warn); font-weight: 800;">0</span> 메소 남음</small>
                </div>
            </div>

            <div class="dash">
                <div class="stat-card"><small>누적 사냥 메소</small><b id="profitMeso_${i}">0 메소</b></div>
                <div class="stat-card"><small>누적 경험치 상승</small><b id="profitExp_${i}">0 %</b></div>
                <div class="stat-card"><small>현재 드랍/메획</small><b id="currentStats_${i}">0% / 0%</b></div>
                <div class="stat-card"><small>누적 코젬 / 조각</small><b id="netDrops_${i}">0 / 0</b></div>
                <div class="stat-card"><small>총 소재 회차</small><b id="subCountDisplay_${i}">0 회</b></div>
            </div>

            <div class="config-area">
                <div class="input-row" style="grid-template-columns: repeat(6, 1fr);">
                    <div class="input-box"><label>👤 캐릭터명</label><input type="text" id="nameInput_${i}" value="${savedName}" oninput="updateTabName(${i}); updateAll(${i});"></div>
                    <div class="input-box"><label>💰 시작 메소</label><input type="text" id="startMeso_${i}" oninput="onMeso(this); updateAll(${i});"></div>
                    <div class="input-box"><label>🎯 목표 메소</label><input type="text" id="targetMeso_${i}" oninput="onMeso(this); updateAll(${i});" placeholder="목표액 입력"></div>
                    <div class="input-box"><label>📈 시작 경험치(%)</label><input type="number" id="startExp_${i}" step="0.001" oninput="updateAll(${i})"></div>
                    <div class="input-box"><label>💎 시작 코젬</label><input type="number" id="startGem_${i}" oninput="updateAll(${i})"></div>
                    <div class="input-box"><label>🧩 시작 조각</label><input type="number" id="startFrag_${i}" oninput="updateAll(${i})"></div>
                </div>

                <button onclick="toggleDetails(${i})" style="width:100%; padding:8px; background:#f8f9fa; border:1px solid #ddd; border-radius:8px; cursor:pointer; font-size:11px; margin-bottom:15px; font-weight:bold; color:#7f8c8d;">⚙️ 상세 스탯 설정 (열기/닫기)</button>
                <div id="details_${i}" class="details-panel">
                    <div class="stat-section"><h4>메소 획득량</h4>${statItems.map((s, idx)=>`<div class="stat-row"><span>${s}</span><input type="number" id="m_stat_${idx}_${i}" value="0" oninput="updateAll(${i})"></div>`).join('')}</div>
                    <div class="stat-section"><h4>아이템 드랍률</h4>${statItems.map((s, idx)=>`<div class="stat-row"><span>${s}</span><input type="number" id="d_stat_${idx}_${i}" value="0" oninput="updateAll(${i})"></div>`).join('')}</div>
                </div>

                <div class="check-area">
                    <div class="check-title">💊 사냥 도핑 체크리스트</div>
                    <div class="doping-grid">${buffs.map((b, idx) => `<label><input type="checkbox" id="chk_${idx}_${i}" onchange="updateAll(${i})"> ${b.name}</label>`).join('')}</div>
                    <div class="quick-timer-box" style="margin-top:10px">
                        <div class="timer-label">도핑 타이머 : <span id="buffTimerDisplay">00:00</span></div>
                        <div class="timer-btns"><button onclick="setBuffTimer(600)">10m</button><button onclick="setBuffTimer(1200)" style="color:red">20m</button><button onclick="resetBuffTimer()">리셋</button></div>
                    </div>
                </div>

                <div class="input-row" style="background:#fcfcfc; padding:15px; border-radius:12px; border:1px solid #eee; margin-bottom:10px;">
                    <div class="input-box"><label>📍 현재 사냥터</label><input type="text" id="map_${i}" placeholder="사냥터 입력"></div>
                    <div class="input-box"><label>💰 현재 메소</label><input type="text" id="meso_${i}" oninput="onMeso(this); updateAll(${i});"></div>
                    <div class="input-box"><label>📈 현재 경험치</label><input type="number" id="exp_${i}" step="0.001" oninput="updateAll(${i})"></div>
                    <div class="input-box"><label>💎 현재 코젬</label><input type="number" id="gem_${i}" oninput="updateAll(${i})"></div>
                    <div class="input-box"><label>🧩 현재 조각</label><input type="number" id="frag_${i}" oninput="updateAll(${i})"></div>
                </div>

                <button onclick="openOcrModal()" style="width:100%; padding:14px; background: #ffffff; color:var(--primary); border:1.5px solid var(--primary); border-radius:12px; cursor:pointer; font-size:13px; margin-bottom:20px; font-weight:bold; display:flex; align-items:center; justify-content:center; gap:8px; transition: 0.2s;" onmouseover="this.style.background='var(--primary)'; this.style.color='white';" onmouseout="this.style.background='#ffffff'; this.style.color='var(--primary)';">
                    <span>📸</span> 스크린샷으로 재획 기록 자동으로 입력하기
                </button>

                <div class="sell-section">
                    <div class="sell-header"><b>🛍️ 이번 회차 부수입 판매</b><button class="btn-add-sell" onclick="addSellRow(${i})">+ 추가</button></div>
                    <div id="sellContainer_${i}"><div class="sell-row"><select><option value="" disabled selected>물품 선택</option>${sellItems.map(it=>`<option value="${it}">${it}</option>`).join('')}</select><input type="number" placeholder="개수" oninput="calcSellSum(${i})"><input type="text" placeholder="판매 금액" oninput="onMeso(this); calcSellSum(${i})"><button class="btn-del-row" onclick="this.parentElement.remove(); calcSellSum(${i});">×</button></div></div>
                    <div style="text-align:right; margin-top:10px; font-weight:bold; color:var(--warn);">총 판매 합계: <span id="sellTotalDisplay_${i}">0</span> 메소</div>
                </div>
                <div id="subRecordList_${i}" class="sub-record-list"></div>
                
                <div class="action-group">
                    <button class="btn-action btn-sub-end" onclick="recordSub(${i})"><span>⏱️</span> 30분 소재 기록</button>
                    <button class="btn-action btn-all-end" onclick="saveFinalRecord(${i})"><span>📊</span> 기록지 전송</button>
                    <button class="btn-action btn-reset-data" onclick="resetCurrentHunt(${i})"><span>🗑️</span> 리셋</button>
                </div>
            </div>
        </div>`;
    }
    loadData();
    fetchRanking(); 
}

function startApp() {
    document.getElementById('mainPortal').style.display = 'none';
    document.getElementById('searchPageContent').style.display = 'none';
    document.getElementById('appContent').style.display = 'flex';
    showPage(1);
    history.pushState({page: 'hunt'}, "사냥 모드", "#hunt");
}

window.onpopstate = function(event) {
    document.getElementById('mainPortal').style.display = 'block';
    document.getElementById('searchPageContent').style.display = 'none';
    document.getElementById('appContent').style.display = 'none';
    location.hash = "";
};

// --- [7. 보조 유틸리티 함수들] ---
// 상세 설명: 탭을 전환하거나, 숫자에 콤마를 찍어주거나, 값을 합산하는 자잘한 기능들입니다.
function openTab(idx) { currentIdx = idx; document.querySelectorAll('.content').forEach(c => c.style.display = 'none'); document.getElementById(`tab_${idx}`).style.display = 'block'; document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active')); document.getElementById(`tab_btn_${idx}`).classList.add('active'); fetchMapleData(); }
function openHistTab(idx) { currentIdx = idx; document.querySelectorAll('#historyTabContainer .nav-btn').forEach(b => b.classList.remove('active')); document.getElementById(`hist_tab_btn_${idx}`).classList.add('active'); renderRecords(); }
function showPage(n) { document.getElementById('page_1').style.display=n==1?'block':'none'; document.getElementById('page_2').style.display=n==2?'block':'none'; document.getElementById('nav_1').classList.toggle('active', n==1); document.getElementById('nav_2').classList.toggle('active', n==2); if(n==2) renderRecords(); }
function addSellRow(idx) { const container = document.getElementById(`sellContainer_${idx}`); const div = document.createElement('div'); div.className = 'sell-row'; div.innerHTML = `<select><option value="" disabled selected>물품 선택</option>${sellItems.map(it=>`<option value="${it}">${it}</option>`).join('')}</select><input type="number" placeholder="개수" oninput="calcSellSum(${idx})"><input type="text" placeholder="판매 금액" oninput="onMeso(this); calcSellSum(${idx})"><button class="btn-del-row" onclick="this.parentElement.remove(); calcSellSum(${idx});">×</button>`; container.appendChild(div); }
function calcSellSum(idx) { const rows = document.getElementById(`sellContainer_${idx}`).querySelectorAll('.sell-row'); let total = 0; rows.forEach(row => { total += parseInt(row.querySelectorAll('input')[1].value.replace(/,/g, '')) || 0; }); document.getElementById(`sellTotalDisplay_${idx}`).innerText = total.toLocaleString(); return total; }
function updateTabName(idx) { const n = document.getElementById(`nameInput_${idx}`).value || `캐릭터 ${idx}`; document.getElementById(`tab_btn_${idx}`).innerText = n; document.getElementById(`hist_tab_btn_${idx}`).innerText = n; }
function onMeso(el) { let v = el.value.replace(/,/g, ""); el.value = isNaN(v) ? "" : Number(v).toLocaleString(); }
function toggleDetails(idx) { const el = document.getElementById(`details_${idx}`); el.style.display = (el.style.display === 'grid') ? 'none' : 'grid'; }
function setBuffTimer(sec) { clearInterval(buffTimerId); buffTimeLeft = sec; updateBTD(); buffTimerId = setInterval(() => { buffTimeLeft--; if(buffTimeLeft <= 0) { clearInterval(buffTimerId); alert("💊 도핑 만료!"); } updateBTD(); }, 1000); }
function updateBTD() { const m = Math.floor(buffTimeLeft/60), s = buffTimeLeft%60; document.getElementById('buffTimerDisplay').innerText = `${m}:${s<10?'0':''}${s}`; }
function resetBuffTimer() { clearInterval(buffTimerId); buffTimeLeft=0; updateBTD(); }

function updateAll(idx) {
    let bm = 0, bd = 0;
    for(let j=0; j<statItems.length; j++){
        bm += parseInt(document.getElementById(`m_stat_${j}_${idx}`).value) || 0;
        bd += parseInt(document.getElementById(`d_stat_${j}_${idx}`).value) || 0;
    }
    let hasJ = document.getElementById(`chk_4_${idx}`)?.checked;
    buffs.forEach((b, i) => { if(document.getElementById(`chk_${i}_${idx}`)?.checked) { bd += b.d; if(i !== 4) bm += b.m; } });
    let fm = hasJ ? Math.floor(((100 + bm) * 1.2) - 100) : bm;
    document.getElementById(`currentStats_${idx}`).innerText = `${bd}% / ${fm}%`;
    
    let totalMeso = 0, totalExp = 0, totalGem = 0, totalFrag = 0;
    subHistory[idx].forEach(log => {
        totalMeso += parseInt(log.meso.replace(/[^0-9]/g, "")) || 0;
        totalExp += parseFloat(log.exp) || 0;
        totalGem += parseInt(log.gem) || 0;
        totalFrag += parseInt(log.frag) || 0;
    });
    document.getElementById(`profitMeso_${idx}`).innerText = totalMeso.toLocaleString() + " 메소";
    document.getElementById(`profitExp_${idx}`).innerText = totalExp.toFixed(3) + " %";
    document.getElementById(`netDrops_${idx}`).innerText = `${totalGem} / ${totalFrag}`;
    document.getElementById(`subCountDisplay_${idx}`).innerText = subHistory[idx].length + " 회";

    const targetVal = parseInt(document.getElementById(`targetMeso_${idx}`).value.replace(/,/g, "")) || 0;
    const currentVal = parseInt(document.getElementById(`profitMeso_${idx}`).innerText.replace(/[^0-9]/g, "")) || 0;

    let goalP = 0, goalR = 0;
    if (targetVal > 0) {
        goalP = (currentVal / targetVal) * 100;
        if (goalP > 100) goalP = 100;
        goalR = Math.max(0, targetVal - currentVal);
    }

    document.getElementById(`goalPercent_${idx}`).innerText = (goalP >= 100 && targetVal > 0) ? "🎉 목표 달성!" : goalP.toFixed(1) + "%";
    document.getElementById(`progressBar_${idx}`).style.width = goalP + "%";
    document.getElementById(`remainMeso_${idx}`).innerText = goalR.toLocaleString();
    document.getElementById(`goalPercent_${idx}`).style.color = (goalP >= 100 && targetVal > 0) ? "#2ecc71" : "var(--accent)";

    if (totalMeso > 0) {
        const d = new Date().getDate();
        const dayEl = document.getElementById(`day-${d}`);
        if (dayEl) dayEl.classList.add('active');
    }

    saveConfig(idx);
}

function updateSubDisplay(idx) {
    const listEl = document.getElementById(`subRecordList_${idx}`);
    listEl.innerHTML = subHistory[idx].map((d, i) => `
        <div class="sub-item">
            <button onclick="removeSub(${idx},${d.id})" style="position:absolute;top:5px;right:5px;border:none;color:red;background:none;cursor:pointer;">×</button>
            <div class="sub-item-header"><b>${i+1}소재 기록</b> <input type="text" class="sub-time-input" value="${d.time}" onchange="editSubTime(${idx},${d.id},this.value)"></div>
            <div class="sub-tag-group">
                <div class="sub-tag tag-meso">💰 ${d.meso}</div>
                <div class="sub-tag tag-exp">📈 ${d.exp}</div>
                <div class="sub-tag tag-frag">🧩 조각: ${d.frag}</div>
                <div class="sub-tag tag-gem">💎 코젬: ${d.gem}</div>
                <div class="sub-tag tag-sell">🛍️ 부수입: ${d.sellSum}</div>
            </div>
        </div>`).join('');
}

function saveFinalRecord(idx) {
    if(!confirm("기록지로 전송할까요?")) return;
    const now = new Date();
    const dateStr = now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0');
    huntRecords.push({
        id: Date.now(), date: dateStr,
        name: document.getElementById(`nameInput_${idx}`).value,
        map: document.getElementById(`map_${idx}`).value || "미지정",
        meso: document.getElementById(`profitMeso_${idx}`).innerText,
        exp: document.getElementById(`profitExp_${idx}`).innerText,
        drops: document.getElementById(`netDrops_${idx}`).innerText,
        subs: subHistory[idx].length
    });
    saveAndRefresh();
    alert("기록 완료!");
}

function resetCurrentHunt(idx) {
    if(!confirm("리셋할까요?")) return;
    ['startMeso','startExp','startGem','startFrag','meso','exp','gem','frag','map'].forEach(id => { if(document.getElementById(`${id}_${idx}`)) document.getElementById(`${id}_${idx}`).value = ""; });
    subHistory[idx] = []; localStorage.removeItem(`maple_subHistory_${idx}`); updateSubDisplay(idx); updateAll(idx);
}

function editRecordDate(recordId) {
    const record = huntRecords.find(r => r.id === recordId);
    if (record) {
        const newDate = prompt("수정할 날짜를 입력하세요 (형식: YYYY-MM-DD):", record.date);
        if (newDate && /^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
            record.date = newDate;
            saveAndRefresh();
            alert("날짜가 수정되었습니다!");
        } else if (newDate) {
            alert("올바른 날짜 형식이 아닙니다 (YYYY-MM-DD).");
        }
    }
}

function saveAndRefresh() { localStorage.setItem('maple_hunt_records', JSON.stringify(huntRecords)); renderRecords(); }
function editSubTime(cI, sI, t) { const idx = subHistory[cI].findIndex(s=>s.id===sI); if(idx!==-1){ subHistory[cI][idx].time=t; localStorage.setItem(`maple_subHistory_${cI}`, JSON.stringify(subHistory[cI])); } }
function removeSub(cI, sI) { subHistory[cI]=subHistory[cI].filter(s=>s.id!==sI); localStorage.setItem(`maple_subHistory_${cI}`, JSON.stringify(subHistory[cI])); updateSubDisplay(cI); updateAll(cI); }
function deleteRecord(id) { if(confirm("삭제?")) { huntRecords=huntRecords.filter(r=>r.id!==id); saveAndRefresh(); } }
function resetDateFilter() { document.getElementById('dateFilter').value=''; renderRecords(); }

function saveConfig(idx) {
    const cfg = {
        name: document.getElementById(`nameInput_${idx}`).value,
        stats: {},
        doping: buffs.map((_, i) => document.getElementById(`chk_${i}_${idx}`)?.checked),
        currentVals: {
            startMeso: document.getElementById(`startMeso_${idx}`).value,
            startExp: document.getElementById(`startExp_${idx}`).value,
            startGem: document.getElementById(`startGem_${idx}`).value,
            startFrag: document.getElementById(`startFrag_${idx}`).value,
            map: document.getElementById(`map_${idx}`).value,
            meso: document.getElementById(`meso_${idx}`).value,
            exp: document.getElementById(`exp_${idx}`).value,
            gem: document.getElementById(`gem_${idx}`).value,
            frag: document.getElementById(`frag_${idx}`).value
        }
    };
    for(let j=0; j<statItems.length; j++) {
        cfg.stats[`m_stat_${j}`] = document.getElementById(`m_stat_${j}_${idx}`).value;
        cfg.stats[`d_stat_${j}`] = document.getElementById(`d_stat_${j}_${idx}`).value;
    }
    localStorage.setItem(`maple_config_${idx}`, JSON.stringify(cfg));
}

function loadData() {
    for(let i=1; i<=4; i++) {
        const cfg = JSON.parse(localStorage.getItem(`maple_config_${i}`));
        if(cfg) {
            document.getElementById(`nameInput_${i}`).value = cfg.name || "";
            updateTabName(i);
            if(cfg.stats) for(let j=0; j<statItems.length; j++) {
                if(document.getElementById(`m_stat_${j}_${i}`)) document.getElementById(`m_stat_${j}_${i}`).value = cfg.stats[`m_stat_${j}`] || 0;
                if(document.getElementById(`d_stat_${j}_${i}`)) document.getElementById(`d_stat_${j}_${i}`).value = cfg.stats[`d_stat_${j}`] || 0;
            }
            if(cfg.doping) cfg.doping.forEach((c, idx) => { if(document.getElementById(`chk_${idx}_${i}`)) document.getElementById(`chk_${idx}_${i}`).checked = c; });
            if(cfg.currentVals) for(let k in cfg.currentVals) { if(document.getElementById(`${k}_${i}`)) document.getElementById(`${k}_${i}`).value = cfg.currentVals[k] || ""; }
        }
        const savedSub = localStorage.getItem(`maple_subHistory_${i}`);
        if(savedSub) { subHistory[i] = JSON.parse(savedSub); updateSubDisplay(i); }
        updateAll(i);
    }
}

function exportData() { const d={}; for(let i=0; i<localStorage.length; i++) d[localStorage.key(i)]=localStorage.getItem(localStorage.key(i)); const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([JSON.stringify(d)],{type:"application/json"})); a.download=`maple_backup.json`; a.click(); }
function importData(e) { const f=e.target.files[0]; const r=new FileReader(); r.onload=function(ev){ const d=JSON.parse(ev.target.result); localStorage.clear(); for(const k in d)localStorage.setItem(k,d[k]); location.reload(); }; r.readAsText(f); }

// --- [8. 캘린더/출석부 기능] ---
let viewDate = new Date();

function renderAttendance() {
    const grid = document.getElementById('attendanceGrid');
    if(!grid) return;
    
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const realToday = new Date(); 
    
    document.getElementById('currentMonth').innerText = `${year}년 ${month + 1}월`;
    
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    
    const attendanceData = JSON.parse(localStorage.getItem('mapleAttendance')) || [];
    
    grid.innerHTML = '';
    for (let i = 0; i < firstDay; i++) grid.innerHTML += '<div></div>';
    
    for (let i = 1; i <= lastDate; i++) {
        const currentFullDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        let classes = ["calendar-day"];
        if (i === realToday.getDate() && month === realToday.getMonth() && year === realToday.getFullYear()) {
            classes.push("today-marker");
        }
        if (attendanceData.includes(currentFullDate)) {
            classes.push("active");
        }
        grid.innerHTML += `<div class="${classes.join(' ')}" id="day-${i}">${i}</div>`;
    }
}

function changeMonth(diff) {
    viewDate.setMonth(viewDate.getMonth() + diff);
    renderAttendance();
}

// --- [9. 사냥 기록지(통계) 화면 렌더링] ---
function renderRecords() {
    const area = document.getElementById('recordDisplayArea'), sumArea = document.getElementById('monthlySummaryArea');
    const targetName = document.getElementById(`nameInput_${currentIdx}`).value, selectedDate = document.getElementById('dateFilter').value;
    const now = new Date(), monthStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
    
    let charRecs = huntRecords.filter(r => r.name === targetName);
    let mRecs = charRecs.filter(r => r.date.startsWith(monthStr));
    const mSumMeso = mRecs.reduce((s, r) => s + (parseInt(r.meso.replace(/[^0-9]/g, '')) || 0), 0);
    const mSumExp = mRecs.reduce((s, r) => s + (parseFloat(r.exp.replace(/[^0-9.]/g, '')) || 0), 0).toFixed(3);
    const mSumSubs = mRecs.reduce((s, r) => s + (parseInt(r.subs) || 0), 0);

    sumArea.innerHTML = `
        <div class="summary-card"><small>💰 ${now.getMonth()+1}월 누적 수익</small><b>${mSumMeso.toLocaleString()} 메소</b></div>
        <div class="summary-card"><small>📈 ${now.getMonth()+1}월 누적 경험치</small><b>${mSumExp}%</b></div>
        <div class="summary-card"><small>⏱️ ${now.getMonth()+1}월 사냥 횟수</small><b>${mSumSubs}회</b></div>`;

    let displayData = selectedDate ? charRecs.filter(r => r.date === selectedDate) : charRecs;
    if (displayData.length === 0) { area.innerHTML = `<div style='text-align:center; padding:80px; color:#999;'>기록이 없습니다.</div>`; return; }

   const groups = displayData.reduce((acc, rec) => { 
        if (!acc[rec.date]) acc[rec.date] = []; 
        acc[rec.date].push(rec); 
        return acc; 
    }, {});

    let html = "";
    Object.keys(groups).sort((a, b) => new Date(b) - new Date(a)).forEach(date => {
        html += `
            <div class="date-header">📅 ${date}</div>
            <table class="record-table">
                <tr>
                    <th>사냥터</th>
                    <th>메소</th>
                    <th>경험치</th>
                    <th>코젬/조각</th>
                    <th>회차</th>
                    <th>관리</th>
                </tr>
                ${groups[date].map(r => `
                    <tr>
                        <td>${r.map || '-'}</td>
                        <td style="color:var(--accent); font-weight:bold;">${r.meso}</td>
                        <td>${r.exp}</td>
                        <td>${r.drops}</td>
                        <td>${r.subs}회</td>
                        <td>
                            <div style="display: flex; justify-content: center; gap: 8px;">
                                <button onclick="editRecordDate(${r.id})" style="padding: 4px 8px; background: #ebf2ff; color: #407bff; border: 1px solid #d0e1ff; border-radius: 6px; cursor: pointer; font-size: 10px; font-weight: bold;">📅 수정</button>
                                <button onclick="deleteRecord(${r.id})" style="padding: 4px 8px; background: #fff0f0; color: #ff4d4d; border: 1px solid #ffd1d1; border-radius: 6px; cursor: pointer; font-size: 10px; font-weight: bold;">🗑️ 삭제</button>
                            </div>
                        </td>
                    </tr>
                `).join('')}
            </table>`;
    });
    area.innerHTML = html;
}

// --- [10. 미니 팝업 로직] ---
function openMiniPopup() {
    const w = 300, h = 480, left = (window.screen.width) - w - 20, top = 20;
    const popup = window.open("", "MapleMini", "width=" + w + ",height=" + h + ",left=" + left + ",top=" + top + ",scrollbars=no,resizable=yes");
    
    if (!popup) { 
        alert("⚠️ 팝업 차단이 감지되었습니다! 설정에서 팝업을 허용해주세요."); 
        return; 
    }

    const tabs = document.querySelectorAll('.tab-btn');
    let optionsHTML = '<option value="" disabled selected>👤 캐릭터 선택</option>';
    tabs.forEach((tab, index) => { 
        const charIdx = index + 1;
        const nameInput = document.getElementById('nameInput_' + charIdx);
        const charName = nameInput ? nameInput.value : '캐릭터 ' + charIdx;
        optionsHTML += '<option value="' + charIdx + '">' + charName + '</option>'; 
    });

    let popupHTML = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>사냥 리모컨</title>';
    popupHTML += '<style>';
    popupHTML += 'body { font-family: "Pretendard", sans-serif; padding: 10px; background: #f1f2f6; margin: 0; overflow: hidden; }';
    popupHTML += '.mini-card { background: #1a1a2e; padding: 12px; border-radius: 15px; color: #fff; text-align: center; border: 1px solid #c9a55c; margin-bottom: 10px; }';
    popupHTML += '.timer-text { font-size: 32px; font-weight: 900; color: #ffd700; margin-bottom: 5px; font-family: "monospace"; }';
    popupHTML += '.btn-timer { background: rgba(255,215,0,0.1); border: 1px solid #ffd700; color: #ffd700; padding: 3px 8px; border-radius: 5px; font-size: 11px; cursor: pointer; margin: 0 2px; }';
    popupHTML += '#char_select { width: 100%; margin-top: 10px; background: #2d3436; color: white; border: 1px solid #555; border-radius: 5px; padding: 4px; font-size: 12px; }';
    popupHTML += '.input-grid { background: white; padding: 10px; border-radius: 12px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }';
    popupHTML += '.row { display: flex; gap: 5px; margin-bottom: 8px; }';
    popupHTML += '.field { flex: 1; }';
    popupHTML += '.field label { display: block; font-size: 10px; color: #777; font-weight: bold; margin-bottom: 2px; }';
    popupHTML += '.field input { width: 100%; padding: 5px; border: 1px solid #ddd; border-radius: 6px; font-size: 12px; text-align: center; box-sizing: border-box; outline: none; }';
    popupHTML += '.field input:focus { border-color: #6c5ce7; }';
    popupHTML += '.btn-record { width: 100%; padding: 12px; background: #6c5ce7; color: white; border: none; border-radius: 10px; font-weight: bold; font-size: 14px; cursor: pointer; margin-top: 5px; }';
    popupHTML += '.btn-clear { width: 100%; padding: 6px; background: none; color: #ff7675; border: 1px solid #ff7675; border-radius: 8px; font-size: 11px; cursor: pointer; margin-top: 8px; }';
    popupHTML += '</style></head><body>';
    
    popupHTML += '<div class="mini-card">';
    popupHTML += '<div class="timer-text" id="w_timer">00:00</div>';
    popupHTML += '<div>';
    popupHTML += '<button class="btn-timer" onclick="window.opener.startTimer()">▶ 재생</button>';
    popupHTML += '<button class="btn-timer" onclick="window.opener.stopOrResumeTimer()">⏸ 정지</button>';
    popupHTML += '<button class="btn-timer" onclick="window.opener.resetTimer()">🔄 리셋</button>';
    popupHTML += '</div>';
    popupHTML += '<select id="char_select" onchange="loadChar(this.value)">' + optionsHTML + '</select>';
    popupHTML += '</div>';

    popupHTML += '<div id="w_content" style="text-align:center; font-size:11px; color:#999; margin-top:30px;">캐릭터를 선택해 주세요 🍁</div>';

    popupHTML += '<script>';
    popupHTML += 'let activeIdx = null;';
    popupHTML += 'setInterval(() => { if (!window.opener) return; const mainT = window.opener.document.getElementById("timerDisplay"); if (mainT) document.getElementById("w_timer").innerText = mainT.innerText; }, 500);';
    popupHTML += 'function syncToMain(field, value) { if (!activeIdx || !window.opener) return; const target = window.opener.document.getElementById(field + "_" + activeIdx); if (target) { target.value = value; window.opener.updateAll(activeIdx); } }';
    popupHTML += 'function loadChar(idx) { activeIdx = idx; const op = window.opener;';
    popupHTML += 'const mapV = op.document.getElementById("map_" + idx).value;';
    popupHTML += 'const mesoV = op.document.getElementById("meso_" + idx).value;';
    popupHTML += 'const expV = op.document.getElementById("exp_" + idx).value;';
    popupHTML += 'const gemV = op.document.getElementById("gem_" + idx).value;';
    popupHTML += 'const fragV = op.document.getElementById("frag_" + idx).value;';
    popupHTML += 'let html = \'<div class="input-grid">\';';
    popupHTML += 'html += \'<div class="row"><div class="field"><label>📍 사냥터</label><input type="text" value="\' + mapV + \'" oninput="syncToMain(\\\'map\\\', this.value)"></div></div>\';';
    popupHTML += 'html += \'<div class="row"><div class="field"><label>💰 현재 메소</label><input type="text" value="\' + mesoV + \'" oninput="window.opener.onMeso(this); syncToMain(\\\'meso\\\', this.value)"></div><div class="field"><label>📈 현재 경험치</label><input type="number" value="\' + expV + \'" step="0.001" oninput="syncToMain(\\\'exp\\\', this.value)"></div></div>\';';
    popupHTML += 'html += \'<div class="row"><div class="field"><label>💎 현재 코젬</label><input type="number" value="\' + gemV + \'" oninput="syncToMain(\\\'gem\\\', this.value)"></div><div class="field"><label>🧩 현재 조각</label><input type="number" value="\' + fragV + \'" oninput="syncToMain(\\\'frag\\\', this.value)"></div></div>\';';
    popupHTML += 'html += \'<button class="btn-record" onclick="record()">⏱️ 30분 소재 기록</button>\';';
    popupHTML += 'html += \'<button class="btn-clear" onclick="resetInputs()">🗑️ 입력칸 비우기</button></div>\';';
    popupHTML += 'document.getElementById("w_content").innerHTML = html; }';

    popupHTML += 'function record() { window.opener.recordSub(activeIdx); document.body.style.background = "#d1ffd1"; setTimeout(() => { document.body.style.background = "#f1f2f6"; loadChar(activeIdx); }, 300); }';
    popupHTML += 'function resetInputs() { if(!confirm("초기화할까요?")) return; ["map", "meso", "exp", "gem", "frag"].forEach(id => syncToMain(id, "")); loadChar(activeIdx); }';
    popupHTML += '<\/script></body></html>';

    popup.document.open();
    popup.document.write(popupHTML);
    popup.document.close();
}

// --- [11. 메인 포털 랭킹 및 환산 검색 로직] ---
async function fetchRanking() {
    const tbody = document.getElementById('rankingBody');
    const dateSpan = document.getElementById('rankingDate');
    if (!tbody) return;

    const jobFixer = { "초월자": "제로", "프렌즈 월드": "키네시스" };

    try {
        const today = new Date();
        today.setDate(today.getDate() - 1); 
        const yesterdayStr = today.toISOString().split('T')[0];

        const res = await fetch(`https://open.api.nexon.com/maplestory/v1/ranking/overall?date=${yesterdayStr}`, {
            headers: { "x-nxopen-api-key": API_KEY }
        });
        
        if (!res.ok) throw new Error("데이터 호출 실패");
        
        const data = await res.json();
        const top10 = data.ranking.slice(0, 10); 

        let html = "";
        
        top10.forEach((user, index) => {
            let rankClass = index === 0 ? "rank-1" : index === 1 ? "rank-2" : index === 2 ? "rank-3" : "rank-other";
            let fixedJob = jobFixer[user.class_name] || user.class_name;
            
            const worldId = getWorldId(user.world_name);
            const iconUrl = `icon/icon_${worldId}.png`;

            html += `
                <tr>
                    <td class="${rankClass}">${user.ranking}</td>
                    <td class="rank-name">
                        <div style="display: flex; align-items: center; justify-content: center; gap: 7px;">
                            <img src="${iconUrl}" class="world-icon" alt="${user.world_name}" 
                                 style="width: 16px; height: 16px; object-fit: contain; vertical-align: middle; display: block !important;">
                            
                            <span style="font-weight: 700; color: var(--primary);">${user.character_name}</span>
                        </div>
                    </td>
                    <td style="color: #636e72;">${fixedJob}</td> 
                    <td style="color: #636e72;">Lv.${user.character_level}</td>
                </tr>
            `;
        });

        tbody.innerHTML = html;
        if(dateSpan) dateSpan.innerText = `기준일: ${yesterdayStr}`;

    } catch (e) {
        console.error(e);
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--warn); padding: 15px;">랭킹 데이터를 불러올 수 없습니다.</td></tr>`;
    }
}

function getWorldId(name) {
    const ids = {
        "스카니아": 1, "베라": 2, "루나": 3, "제니스": 4, "크로아": 5,
        "유니온": 6, "엘리시움": 7, "이노시스": 8, "레드": 9, "오로라": 10,
        "아케인": 11, "노바": 12, "에오스": 13, "헬리오스": 14
    };
    return ids[name] || 3; 
}

function showAlert(msg) {
    const alertBox = document.getElementById('customAlert');
    const alertMsg = document.getElementById('alertMessage');
    
    if (!alertBox || !alertMsg) return;

    alertMsg.innerText = msg;
    alertBox.style.display = 'block';

    setTimeout(() => {
        alertBox.style.display = 'none';
    }, 3000);
}

// --- [12. 캐릭터 상세 검색 로직 (화이트 테마 3단 레이아웃 연결)] ---
let characterOcid = null;
let itemPresets = { 1: [], 2: [], 3: [] }; // 장비 프리셋 1, 2, 3 저장
let abilityPresets = { 1: [], 2: [], 3: [] }; // 어빌리티 프리셋 1, 2, 3 저장

/**
 * 🔍 캐릭터 상세 검색 및 탭 데이터 연동 로직
 * 상세 주석: 검색 버튼을 누르면 5가지 데이터를 넥슨에서 동시에 받아옵니다.
 */
async function searchCharacter() {
    const input = document.getElementById('portalSearchInput')?.value.trim();
    if (!input) { showAlert("❌ 캐릭터명을 입력해주세요!"); return; }
    
    document.getElementById('mainPortal').style.display = 'none';
    document.getElementById('searchPageContent').style.display = 'block';
    
    const placeholder = document.getElementById('searchPlaceholder');
    const detailContainer = document.getElementById('charDetailContainer');
    const tabMenu = document.getElementById('detailTabMenu');

    if (detailContainer) detailContainer.style.display = 'none';
    if (placeholder) {
        placeholder.style.display = 'block';
        placeholder.innerHTML = '<b>' + input + '</b>님의 정보를 분석 중입니다... 🔄';
    }

    itemPresets = { 1: [], 2: [], 3: [] };
    abilityPresets = { 1: [], 2: [], 3: [] };

    try {
        const ocidRes = await fetch('https://open.api.nexon.com/maplestory/v1/id?character_name=' + encodeURIComponent(input), { headers: { "x-nxopen-api-key": API_KEY } });
        const ocidData = await ocidRes.json();
        if (!ocidData.ocid) throw new Error("캐릭터를 찾을 수 없습니다.");
        const ocid = ocidData.ocid;

        const [basic, stat, item, ability, symbol] = await Promise.all([
            fetch('https://open.api.nexon.com/maplestory/v1/character/basic?ocid=' + ocid, { headers: { "x-nxopen-api-key": API_KEY } }).then(r => r.json()),
            fetch('https://open.api.nexon.com/maplestory/v1/character/stat?ocid=' + ocid, { headers: { "x-nxopen-api-key": API_KEY } }).then(r => r.json()),
            fetch('https://open.api.nexon.com/maplestory/v1/character/item-equipment?ocid=' + ocid, { headers: { "x-nxopen-api-key": API_KEY } }).then(r => r.json()),
            fetch('https://open.api.nexon.com/maplestory/v1/character/ability?ocid=' + ocid, { headers: { "x-nxopen-api-key": API_KEY } }).then(r => r.json()),
            fetch('https://open.api.nexon.com/maplestory/v1/character/symbol-equipment?ocid=' + ocid, { headers: { "x-nxopen-api-key": API_KEY } }).then(r => r.json())
        ]);

        itemPresets[1] = item.item_equipment_preset_1;
        itemPresets[2] = item.item_equipment_preset_2;
        itemPresets[3] = item.item_equipment_preset_3;
        
        abilityPresets[1] = ability.ability_preset_1 ? ability.ability_preset_1.ability_info : [];
        abilityPresets[2] = ability.ability_preset_2 ? ability.ability_preset_2.ability_info : [];
        abilityPresets[3] = ability.ability_preset_3 ? ability.ability_preset_3.ability_info : [];

        renderSearchDetail(basic, stat, item, ability, symbol);

    } catch (e) {
        console.error(e);
        if (placeholder) placeholder.innerHTML = "❌ 정보를 가져오는데 실패했습니다. 캐릭터명을 확인해주세요.";
    }
}

/**
 * 🎨 가져온 데이터를 시각적으로 렌더링하는 함수 (화이트 테마 연결)
 */
function renderSearchDetail(basic, stat, item, ability, symbol) {
    const detailContainer = document.getElementById('charDetailContainer');
    const placeholder = document.getElementById('searchPlaceholder');
    const tabMenu = document.getElementById('detailTabMenu');
    
    if (placeholder) placeholder.style.display = 'none';
    if (tabMenu) tabMenu.style.display = 'flex';
    if (detailContainer) detailContainer.style.display = 'grid'; // 3단 그리드 활성화

    // 캐릭터 요약 프로필
    document.getElementById('res_profileImg').src = basic.character_image;
    document.getElementById('res_profileName').innerText = basic.character_name;
    document.getElementById('res_profileLevel').innerText = basic.character_level;
    document.getElementById('res_profileJob').innerText = basic.character_class;
    
    const power = stat.final_stat.find(s => s.stat_name === "전투력")?.stat_value || "0";
    document.getElementById('res_power').innerText = Number(power).toLocaleString();

    // 어빌리티 요약 정보 (화이트 테마의 주황색 포인트 바)
    const abiList = document.getElementById('res_equip_ability');
    if (abiList) {
        abiList.innerHTML = "";
        const currentAbi = ability.ability_info || [];
        currentAbi.forEach(abi => {
            const div = document.createElement('div');
            div.className = 'ability-line';
            div.innerText = abi.ability_value;
            abiList.appendChild(div);
        });
    }

    // 심볼 정보 요약
    const symbolBox = document.getElementById('res_symbol_info');
    if (symbolBox) {
        symbolBox.innerHTML = "";
        const symbols = symbol.symbol || [];
        symbols.slice(0, 6).forEach(s => {
            const p = document.createElement('p');
            p.style = "margin: 4px 0; font-size: 11px; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px;";
            const name = s.symbol_name.replace('아케인심볼 : ', '').replace('어센틱심볼 : ', '');
            p.innerHTML = `<b>${name}</b> <span style="color:#ff9100; font-weight:800; float:right;">Lv.${s.symbol_level}</span>`;
            symbolBox.appendChild(p);
        });
    }

    // 기본 탭과 프리셋 1번 활성화
    showDetailTab('equip');
    switchItemPreset(1);
}

/**
 * 상세 페이지 내 탭 전환 함수
 */
function showDetailTab(tabId) {
    document.querySelectorAll('.detail-tab-btn').forEach(btn => btn.classList.remove('active'));
    const tabNames = { 'equip': '장비', 'stat': '스탯', 'content': '유니온', 'skill': '스킬', 'coordi': '코디' };
    const targetBtn = Array.from(document.querySelectorAll('.detail-tab-btn')).find(b => b.textContent.includes(tabNames[tabId]));
    if (targetBtn) targetBtn.classList.add('active');
}

/**
 * ⚔️ 장비 프리셋 전환 함수 (콤팩트 그리드 배열)
 */
function switchItemPreset(presetNo) {
    const btns = document.querySelectorAll('#itemPresetBtns .preset-btn');
    btns.forEach((b, i) => { if (i === (presetNo - 1)) b.classList.add('active'); else b.classList.remove('active'); });

    const grid = document.getElementById('res_itemGrid');
    if (!grid) return;
    grid.innerHTML = "";
    
    for(let i = 0; i < 25; i++) {
        const eq = itemPresets[presetNo] && itemPresets[presetNo][i];
        const slot = document.createElement('div');
        slot.className = 'item-slot';
        if (eq && eq.item_icon) {
            slot.innerHTML = `<img src="${eq.item_icon}" title="${eq.item_name}" style="width:32px;">`;
            if (eq.starforce > 0) {
                slot.innerHTML += `<span style="position:absolute; top:3px; left:3px; font-size:8px; color:#ffd700; font-weight:900; text-shadow: 1px 1px 1px rgba(0,0,0,0.8);">★${eq.starforce}</span>`;
            }
        }
        grid.appendChild(slot);
    }
}

/**
 * 📜 어빌리티 프리셋 전환 함수
 */
function switchAbilityPreset(presetNo) {
    const btns = document.querySelectorAll('#abilityPresetBtns .preset-btn');
    btns.forEach((b, i) => { if (i === (presetNo - 1)) b.classList.add('active'); else b.classList.remove('active'); });

    const list = document.getElementById('res_abilityList');
    if (!list) return;
    list.innerHTML = "";
    const abiInfo = abilityPresets[presetNo];
    
    if (abiInfo && abiInfo.length > 0) {
        abiInfo.forEach(abi => {
            const line = document.createElement('div');
            line.className = 'ability-line';
            line.innerText = abi.ability_value;
            list.appendChild(line);
        });
    }
}

/**
 * 포털 화면으로 돌아가기
 */
function backToPortal() {
    if (document.getElementById('appContent')) document.getElementById('appContent').style.display = 'none';
    if (document.getElementById('searchPageContent')) document.getElementById('searchPageContent').style.display = 'none';
    if (document.getElementById('mainPortal')) document.getElementById('mainPortal').style.display = 'block';
    if (document.getElementById('detailTabMenu')) document.getElementById('detailTabMenu').style.display = 'none';
    window.scrollTo(0, 0);
}

// --- [13. 앱 최종 실행] ---
init();
renderAttendance();