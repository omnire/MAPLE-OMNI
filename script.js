/* ============================================================
   🍁 MAPLE OMNI V13.6.5 통합 스타일 시트 (무결점 풀버전)
   ============================================================ */

:root { 
    --primary: #2d3436;     /* 메인 글자색 (진한 회색) */
    --accent: #ff9100;      /* 강조 오렌지 색상 */
    --bg: #f8f9fa;          /* 전체 배경 (밝은 연회색) */
    --card: #ffffff;        /* 카드 및 상자 배경 (순백색) */
    --border: #dfe6e9;      /* 테두리 색상 */
    --text: #2d3436;        /* 기본 본문 글자색 */
    --warn: #ff5252;        /* 경고/주의 빨간색 */
    --blue: #3498db;        /* 포인트 파란색 */
    --green: #2ecc71;       /* 완료 초록색 */
    --doping-bg: #fff9f0;   /* 도핑 구역 연한 베이지 배경 */
    --doping-border: #ffeaa7; /* 도핑 구역 테두리 */
    --purple: #a29bfe;      /* 타이머 및 포인트 보라색 */
}

body { font-family: 'Pretendard', sans-serif; background: var(--bg); margin: 0; padding: 10px; color: var(--text); font-size: 12px; display: flex; justify-content: center; gap: 20px; }

/* --------------------------------------------------
    👤 캐릭터 카드 사이드바 설정
-------------------------------------------------- */
.sidebar { 
    width: 240px; 
    flex-shrink: 0; 
    position: sticky; 
    top: 20px; 
    margin-top: 145px; 
    height: auto !important; 
    max-height: fit-content !important;
}

.char-card { 
    background-color: var(--card) !important; 
    border-radius: 20px; 
    border: 1px solid var(--border) !important; 
    padding: 25px 20px; 
    text-align: center; 
    box-shadow: 0 10px 25px rgba(0,0,0,0.05) !important; 
    margin-bottom: 15px; 
}

.char-img-box { 
    width: 140px; height: 140px; 
    background: radial-gradient(circle, #f1f2f6 0%, #dfe6e9 100%) !important; 
    border-radius: 50%; 
    margin: 0 auto 15px; 
    display: flex; align-items: center; justify-content: center; 
    overflow: hidden; 
    border: 4px solid white !important; 
    box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important; 
}

.char-img { 
    width: 100%; height: auto; 
    transform: scale(2.3) translate(3px, -5px); 
    transform-origin: center center; 
}

.char-info h3 { color: var(--primary) !important; }
.char-info p { margin: 3px 0; color: #636e72 !important; font-weight: bold; font-size: 13px; }

.char-card button { 
    width: 100%; 
    margin-top: 15px; 
    padding: 10px; 
    background-color: #f1f2f6 !important; 
    color: #2d3436 !important; 
    border: 1px solid var(--border) !important; 
    border-radius: 10px; 
    cursor: pointer; 
    font-weight: bold; 
    transition: 0.2s;
}
.char-card button:hover { background-color: #dfe6e9 !important; }

#profileWorld { color: var(--accent) !important; font-weight: 800 !important; }

#statBox { background: rgba(0,0,0,0.03) !important; border: 1px solid var(--border) !important; padding: 12px 10px; border-radius: 10px; font-size: 11px; text-align: left; margin-top: 15px; }
#statBox span { color: #636e72 !important; }
#statBox b { color: var(--primary) !important; }

.container { flex-grow: 1; max-width: 1000px; }

/* --------------------------------------------------
    🏢 상단 메뉴 바 틀 설정
-------------------------------------------------- */
nav { 
    display: flex; 
    justify-content: center; 
    gap: 5px; 
    margin-bottom: 20px; 
    background-color: var(--card) !important; 
    padding: 5px; 
    border-radius: 15px; 
    border: 1px solid var(--border) !important; 
    box-shadow: 0 4px 12px rgba(0,0,0,0.05) !important; 
}

.nav-btn { 
    flex: 1; 
    padding: 12px; 
    border: none; 
    background: transparent; 
    cursor: pointer; 
    font-weight: bold; 
    border-radius: 10px; 
    transition: 0.2s; 
    color: #b2bec3 !important; 
    font-size: 14px; 
}

.nav-btn.active, 
.nav-btn[class*="active"], 
.nav-btn.selected,
.nav-btn.active-tab,
.nav-btn.current,
#nav-details.active { 
    background-color: var(--accent) !important; 
    color: white !important; 
    box-shadow: 0 4px 10px rgba(255, 145, 0, 0.3) !important; 
    border: none !important;
}

.nav-btn.active *, 
.nav-btn[class*="active"] *,
.nav-btn.selected *, 
.nav-btn.current *,
.nav-btn.active-tab * {
    color: white !important;
}

header { text-align: center; padding: 10px 0; }
header h1 { font-size: 26px; color: var(--accent); margin: 0; font-weight: 900; }

.top-control-bar { display: flex; align-items: center; gap: 15px; margin-bottom: 15px; }

.system-btns { 
    display: flex; gap: 8px; 
    background-color: var(--card) !important; 
    padding: 8px 12px; border-radius: 12px; 
    border: 1px solid var(--border) !important; 
}

.sys-btn { 
    padding: 8px 14px; 
    background-color: #f1f2f6 !important; 
    border: 1px solid var(--border) !important; 
    border-radius: 8px; cursor: pointer; font-size: 11px; font-weight: bold; 
    color: #2d3436 !important; transition: 0.2s; 
}
.sys-btn:hover { background-color: #dfe6e9 !important; }

.timer-bar { 
    flex: 1; display: flex; align-items: center; justify-content: center; gap: 20px; 
    background-color: var(--card) !important; 
    padding: 10px 25px; border-radius: 12px; 
    border: 1px solid var(--border) !important; 
}
.timer-display { font-size: 28px; color: var(--accent) !important; font-weight: 900; font-family: 'Inter', 'monospace'; min-width: 80px; text-align: center; }
.timer-btn { padding: 8px 16px; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 12px; }
.btn-start { background: var(--purple); color: white; }
.btn-stop { background: #b2bec3; color: white; }
.btn-resume { background: var(--warn) !important; color: white !important; }
.btn-reset { background: #f1f2f6; color: #555; border: 1px solid #dfe4ea; }

.tab-btn { 
    padding: 10px 15px; 
    border: 1px solid var(--border) !important; 
    border-radius: 10px; 
    background-color: #ffffff !important; 
    cursor: pointer; 
    font-weight: bold; 
    min-width: 80px; 
    color: #b2bec3 !important; 
    transition: 0.2s;
}

.tab-btn.active { 
    background-color: #f1f2f6 !important; 
    border-color: #b2bec3 !important; 
    color: #2d3436 !important; 
    box-shadow: 0 4px 8px rgba(0,0,0,0.05) !important; 
}

.goal-container { grid-column: span 5; background-color: var(--card) !important; padding: 15px; border-radius: 15px; border: 1px solid var(--border) !important; margin-bottom: 15px; box-shadow: 0 2px 8px rgba(0,0,0,0.02); }
.goal-header { display: flex; justify-content: space-between; margin-bottom: 10px; font-weight: 800; font-size: 13px; }
.progress-bg { background: #eee; height: 14px; border-radius: 10px; overflow: hidden; border: 1px solid #e1e1e1; }
.progress-fill { background: linear-gradient(90deg, #ff9100, #ff6b10); height: 100%; width: 0%; transition: width 0.6s ease-in-out; }

.dash { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 18px; }

.stat-card { 
    background-color: var(--card) !important; 
    padding: 15px 5px; border-radius: 12px; text-align: center; 
    border: 1px solid var(--border) !important; 
    position: relative; box-shadow: 0 4px 6px rgba(0,0,0,0.02) !important; 
}
.stat-card b { font-size: 13px; color: var(--primary) !important; }
.stat-card::after { content: ''; position: absolute; top: 0; left: 10%; width: 80%; height: 4px; border-radius: 0 0 4px 4px; }
.stat-card:nth-child(1)::after { background: var(--accent); }
.stat-card:nth-child(2)::after { background: var(--green); }
.stat-card:nth-child(3)::after { background: var(--blue); }
.stat-card:nth-child(4)::after { background: #9b59b6; }
.stat-card:nth-child(5)::after { background: #f1c40f; }
.stat-card small { font-size: 10px; color: #95a5a6; font-weight: 700; display: block; margin-bottom: 8px; }

/* --------------------------------------------------
    🛠️ 설정 구역 및 테이블 
-------------------------------------------------- */
.config-area { background-color: var(--card) !important; padding: 20px; border-radius: 15px; border: 1px solid var(--border) !important; margin-bottom: 15px; }
.input-row { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 15px; }
.input-box label { font-size: 11px; font-weight: 700; color: #636e72 !important; display: block; margin-bottom: 6px; }

.input-box input { 
    width: 100%; padding: 10px; border: 1px solid var(--border) !important; 
    border-radius: 8px; font-size: 12px; box-sizing: border-box; 
    background-color: #ffffff !important; color: var(--primary) !important; 
    outline: none !important; 
    transition: 0.2s; 
}

.input-box input:focus { 
    background-color: #f8f9fa !important; 
    border-color: #b2bec3 !important; 
}

.details-panel { 
    display: none; grid-template-columns: 1fr 1fr; gap: 20px; 
    margin-bottom: 20px; padding: 20px; 
    background-color: #fcfcfc !important; 
    border-radius: 12px; border: 1px dashed #ccc !important; 
}
.stat-section h4 { margin-top: 0; color: var(--primary) !important; font-size: 13px; border-bottom: 1px solid #eee !important; padding-bottom: 5px; }
.stat-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }

.stat-row input { 
    width: 80px; padding: 5px; border: 1px solid var(--border) !important; 
    border-radius: 4px; text-align: center; 
    background-color: #ffffff !important; color: var(--primary) !important; 
    outline: none !important;
    transition: 0.2s;
}
.stat-row input:focus { background-color: #f8f9fa !important; }

.check-area { background: var(--doping-bg) !important; padding: 20px; border-radius: 15px; border: 1.5px solid var(--doping-border) !important; margin-bottom: 20px; }
.check-title { color: var(--accent) !important; font-weight: 800; font-size: 13px; margin-bottom: 15px; display: flex; align-items: center; gap: 6px; }
.doping-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
.doping-grid label { display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 600; color: #636e72 !important; cursor: pointer; }

.quick-timer-box { background: rgba(0, 0, 0, 0.02) !important; padding: 12px 15px; border-radius: 10px; border: 1px solid var(--doping-border); display: flex; align-items: center; justify-content: space-between; }
.timer-label { font-size: 14px; font-weight: 800; color: var(--accent) !important; }
.timer-btns button { padding: 6px 12px; border: 1px solid #ddd; background: white; border-radius: 6px; font-weight: 700; cursor: pointer; font-size: 11px; margin-left: 3px; }

/* 💰 아이템 판매 구역 */
.sell-section { 
    background-color: var(--card) !important; 
    padding: 15px; border-radius: 12px; 
    border: 1px solid var(--border) !important; 
    margin-top: 10px; margin-bottom: 15px; 
}
.sell-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.sell-header b { color: var(--primary) !important; font-size: 13px; }

.sell-row { display: grid; grid-template-columns: 2fr 1fr 2fr 40px; gap: 8px; margin-bottom: 8px; align-items: center; }

.sell-row select, .sell-row input { 
    padding: 8px; 
    background-color: #ffffff !important; 
    color: var(--primary) !important; 
    border: 1px solid var(--border) !important; 
    border-radius: 6px; font-size: 11px; 
    transition: 0.2s;
}
.sell-row select:focus, .sell-row input:focus { background-color: #f8f9fa !important; outline: none; }

.btn-add-sell { padding: 4px 10px; background: var(--blue); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 11px; }
.btn-del-row { background: #ff7675; color: white; border: none; border-radius: 4px; cursor: pointer; height: 30px; }

/* 🎬 하단 조작 버튼 그룹 */
.action-group { 
    display: flex !important; 
    flex-direction: row !important; 
    gap: 10px; 
    margin-top: 25px; 
    padding: 15px; 
    background-color: #f1f2f6 !important; 
    border-radius: 20px; 
    border: 1px solid var(--border) !important; 
    align-items: center !important; 
}

.btn-action { 
    flex: 1 !important; 
    height: 50px; 
    border: none; 
    border-radius: 12px; 
    font-size: 14px; 
    font-weight: 800; 
    cursor: pointer; 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    gap: 6px; 
    transition: 0.2s; 
}

.btn-sub-end { background: linear-gradient(135deg, #6c5ce7, #a29bfe); color: white; }
.btn-all-end { background: linear-gradient(135deg, #2ecc71, #27ae60); color: white; }

.btn-reset-data { 
    flex: 0.4 !important; 
    height: 50px !important; 
    background-color: #ffffff !important; 
    color: #ff7675 !important; 
    border: 2px solid #ff7675 !important; 
    border-radius: 12px;
    font-weight: 800;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
}
.btn-reset-data:hover { background-color: #fcfcfc !important; }

/* 📝 사냥 기록 리스트 구역 */
.sub-record-list { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px; }

.sub-item { 
    background-color: var(--card) !important; 
    border: 1px solid var(--border) !important; 
    border-radius: 12px; padding: 12px; 
    position: relative; 
    box-shadow: 0 4px 6px rgba(0,0,0,0.02) !important; 
}

.sub-item-header { 
    display: flex; justify-content: space-between; align-items: center; 
    margin-bottom: 8px; border-bottom: 1px solid #f1f1f1 !important; 
    padding-bottom: 5px; 
}
.sub-item-header b { font-size: 13px; color: var(--primary) !important; }

.sub-time-input { 
    background-color: #f8f9fa !important; 
    border: 1px solid var(--border) !important; 
    border-radius: 4px; padding: 2px 5px; 
    font-size: 11px; width: 85px; text-align: center; 
    color: #666 !important; font-weight: bold; 
}

.sub-tag-group { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; }
.sub-tag { display: flex; align-items: center; justify-content: center; padding: 4px; border-radius: 6px; font-size: 10px; font-weight: bold; }
.tag-meso { background: #fff4e6; color: #fd7e14; }
.tag-exp { background: #f3f0ff; color: #7950f2; }
.tag-frag { background: #e3fafc; color: #0b7285; }
.tag-gem { background: #ebfbee; color: #2ecc71; }
.tag-sell { background: #f1f2f6; color: #34495e; grid-column: span 2; }

/* 📊 통합 기록지 및 요약 */
.monthly-summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 25px; }
.summary-card { background-color: var(--card) !important; padding: 20px 15px; border-radius: 18px; text-align: center; border: 1px solid var(--border) !important; }
.summary-card b { font-size: 18px; font-weight: 900; color: var(--primary); display: block; }
.summary-card small { font-size: 11px; color: #7f8c8d; font-weight: 800; display: block; margin-bottom: 8px; }

.record-table { width: 100%; border-collapse: collapse; font-size: 11px; text-align: center; }
.record-table th { background: #fdfdfd; padding: 10px; border-bottom: 2px solid var(--accent) !important; color: #7f8c8d; }
.record-table td { padding: 10px; border-bottom: 1px solid #f1f1f1; }

.date-header { background: #f8f9fa; padding: 12px 15px; border-left: 6px solid var(--accent); font-weight: bold; margin-top: 10px; }

/* --------------------------------------------------
    📅 오른쪽 사이드바 (재획 출석기록부 및 랭킹)
-------------------------------------------------- */
.right-sidebar { width: 220px; flex-shrink: 0; position: sticky; top: 20px; margin-top: 145px; height: fit-content; }
.attendance-card { background-color: var(--card) !important; border-radius: 15px; border: 1px solid var(--border) !important; padding: 15px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
.attendance-card h4 { margin: 0 0 10px 0; font-size: 13px; color: var(--primary); display: flex; align-items: center; gap: 5px; }

.calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 5px; text-align: center; }

.calendar-day { 
    font-size: 10px; 
    padding: 5px 0; 
    border-radius: 8px; 
    background-color: #f1f2f6 !important; 
    color: #2d3436 !important; 
    transition: all 0.2s ease-in-out; 
    border: 2px solid transparent; 
}

.calendar-day.today-marker {
    border: 2px solid #b2bec3 !important;
    font-weight: 900;
}

.calendar-day.active {
    background-color: transparent !important; 
    color: #ff5252 !important;              
    font-weight: 900 !important;
    text-shadow: 0 0 5px rgba(255, 82, 82, 0.2);
}

.calendar-header { font-size: 10px; font-weight: bold; color: #7f8c8d; margin-bottom: 5px; }

.ranking-table { width: 100%; border-collapse: collapse; font-size: 13px; text-align: center; }
.ranking-table th { padding: 12px 5px; border-bottom: 2px solid #eee; color: #7f8c8d; font-weight: 800; background: #fdfdfd; }
.ranking-table td { padding: 6px 5px; border-bottom: 1px solid #f8f9fa; color: var(--text); vertical-align: middle; }
.ranking-table tr:hover td { background-color: #f1f3f5; }
.rank-1 { color: #d35400; font-weight: 900; font-size: 15px; }
.rank-2 { color: #7f8c8d; font-weight: 900; font-size: 14px; }
.rank-3 { color: #bdc3c7; font-weight: 900; font-size: 14px; }
.rank-other { color: #95a5a6; font-weight: bold; }
.rank-name { font-weight: 700; color: var(--primary); display: flex; align-items: center; justify-content: center; gap: 6px; }
.world-icon { width: 16px; height: 16px; object-fit: contain; }

/* --------------------------------------------------
    ✨ 애니메이션 및 모달 (OCR 팝업용)
-------------------------------------------------- */
.modal-overlay {
    animation: modalFadeIn 0.2s ease-out;
}

@keyframes modalFadeIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
}

/* --------------------------------------------------
    🔍 [신규 추가] 캐릭터 상세 조회 스타일 (화이트 테마 3단)
-------------------------------------------------- */

/* 탭 버튼 스타일 */
.detail-tab-btn {
    padding: 10px 20px; background: white; border: 1px solid var(--border);
    border-radius: 12px; font-size: 13px; font-weight: 700; color: #64748b;
    cursor: pointer; transition: 0.2s;
}
.detail-tab-btn.active {
    background-color: var(--accent); color: white; border-color: var(--accent);
    box-shadow: 0 4px 12px rgba(255, 145, 0, 0.2);
}

/* 프리셋 버튼 */
.preset-btn {
    padding: 4px 10px; background: transparent; border: none;
    border-radius: 6px; color: #64748b; font-size: 11px; font-weight: 800;
    cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.preset-btn.active {
    background: white; color: var(--accent); box-shadow: 0 2px 4px rgba(0,0,0,0.08);
}

/* 장비 슬롯 */
.item-slot {
    width: 48px; height: 48px; background: #475569; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    border: 1px solid rgba(255,255,255,0.05); position: relative; transition: transform 0.1s;
}
.item-slot:hover {
    transform: scale(1.03); background: #505f73; border-color: var(--accent);
}

/* 어빌리티 스타일 */
.ability-line {
    padding: 10px 14px; background: #f8fafc; border-radius: 10px;
    border-left: 4px solid var(--accent); font-size: 12px;
    font-weight: 700; color: #334155; margin-bottom: 6px; transition: all 0.2s;
}
.ability-line:hover {
    background: #f1f5f9; transform: translateX(2px);
}

/* 결과창 애니메이션 */
#charDetailContainer > div { animation: fadeInSlide 0.5s ease forwards; }

@keyframes fadeInSlide {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}
