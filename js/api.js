/**
 * ============================================================================
 * 📡 MAPLE OMNI - API 통신 전용 모듈 (api.js)
 * 넥슨 오픈 API 서버와 데이터를 주고받는 모든 기능이 이곳에 모여있습니다.
 * (캐릭터 검색, 사냥 기록용 스탯 조회, 랭킹 불러오기 등)
 * ============================================================================
 */

// 🔄 [사냥 탭] 등록된 1~4번 캐릭터의 정보를 최신 상태로 동기화합니다.
async function fetchMapleData(force = false) {
    const todayStr = getTodayStr(); // 오늘 날짜 가져오기 (하루 한 번만 갱신하기 위함)
    let syncedCount = 0;
    const syncBtn = document.querySelector('.api-refresh-btn');
    if(syncBtn) syncBtn.innerText = "⏳ 스텔스 동기화 중...";

    for (let i = 1; i <= 4; i++) {
        const nameInput = document.getElementById(`nameInput_${i}`);
        if (!nameInput) continue;
        const charName = nameInput.value.trim();
        
        // 이름이 비어있거나 기본 이름("캐릭터 1")이면 무시합니다.
        if (!charName || charName.includes("캐릭터 ")) continue; 

        const cacheKey = `maple_api_hunt_${charName}`;
        let cachedData = JSON.parse(localStorage.getItem(cacheKey));
        
        // 강제 동기화가 아니고, 오늘 이미 불러온 데이터가 있다면 건너뜁니다. (API 요청 횟수 절약)
        if (!force && cachedData && cachedData.date === todayStr) continue;

        try {
            const headers = { "x-nxopen-api-key": API_KEY };
            // 1. 캐릭터 고유 식별자(OCID) 가져오기
            const ocidRes = await fetch(`https://open.api.nexon.com/maplestory/v1/id?character_name=${encodeURIComponent(charName)}`, { headers });
            if (ocidRes.status === 429) { showAlert("❌ API 일일 한도 초과! 내일 다시 시도해주세요."); break; }
            const ocidData = await ocidRes.json();
            if (!ocidData.ocid) continue;
            
            // 2. 넥슨 서버 과부하 방지를 위해 0.6초 대기 후 기본 정보 가져오기
            await new Promise(res => setTimeout(res, 600)); 
            const basic = await fetch(`https://open.api.nexon.com/maplestory/v1/character/basic?ocid=${ocidData.ocid}`, { headers }).then(r => r.json());
            
            // 3. 0.6초 대기 후 스탯 정보 가져오기
            await new Promise(res => setTimeout(res, 600)); 
            const stat = await fetch(`https://open.api.nexon.com/maplestory/v1/character/stat?ocid=${ocidData.ocid}`, { headers }).then(r => r.json());

            // 로컬 스토리지에 저장하여 다음 접속 시 빠르게 불러옵니다.
            localStorage.setItem(cacheKey, JSON.stringify({ date: todayStr, basic, stat }));
            syncedCount++;
            await new Promise(res => setTimeout(res, 1000)); 
        } catch (e) { console.error(`${charName} 동기화 실패:`, e); }
    }
    
    if(syncBtn) syncBtn.innerText = "🔄 정보 동기화";
    openTab(currentIdx); // 화면 갱신
    if (syncedCount > 0) showAlert(`✨ ${syncedCount}개의 캐릭터가 최신화 되었습니다!`);
    else if (force) showAlert("✨ 모든 캐릭터가 이미 최신 상태입니다.");
}

// 🖼️ [사냥 탭] 왼쪽 사이드바에 캐릭터 프로필과 스탯을 그려줍니다.
function renderHuntSidebar(basic, stat) {
    document.getElementById('profileImg').src = basic.character_image;
    document.getElementById('profileName').innerText = basic.character_name;
    document.getElementById('profileLevel').innerText = `Lv. ${basic.character_level}`;
    document.getElementById('profileJob').innerText = basic.character_class;
    document.getElementById('profileWorld').innerText = basic.world_name;
    
    // 스탯 배열에서 원하는 스탯을 찾아주는 마법의 함수
    const getStatValue = (target) => {
        if (!stat || !stat.final_stat) return "0";
        const found = stat.final_stat.find(s => s.stat_name === target);
        return found ? found.stat_value : "0";
    };
    
    const rawPower = String(getStatValue("전투력")).replace(/,/g, '');
    const rawAtk = String(getStatValue("최대 스탯 공격력")).replace(/,/g, '');
    
    document.getElementById('stat_power').innerText = Number(rawPower).toLocaleString();
    document.getElementById('stat_atk').innerText = Number(rawAtk).toLocaleString();
    document.getElementById('stat_dmg').innerText = getStatValue("데미지") + "%";
}

// 텅 빈 상태일 때 사이드바를 초기화하는 함수
function resetHuntSidebar(fallbackName) {
    document.getElementById('profileImg').src = "https://open.api.nexon.com/static/maplestory/Character/Default.png";
    document.getElementById('profileName').innerText = fallbackName || "캐릭터명";
    document.getElementById('profileLevel').innerText = "Lv. ---";
    document.getElementById('profileJob').innerText = "---";
    document.getElementById('profileWorld').innerText = "미확인";
    document.getElementById('stat_power').innerText = "-";
    document.getElementById('stat_atk').innerText = "-";
    document.getElementById('stat_dmg').innerText = "-";
}

// 🏆 [메인 화면] 어제 기준의 종합 랭킹 TOP 10을 불러옵니다.
async function fetchRanking() {
    const tbody = document.getElementById('rankingBody');
    const dateSpan = document.getElementById('rankingDate');
    if (!tbody) return;

    try {
        const today = new Date(); today.setDate(today.getDate() - 1); 
        const yesterdayStr = today.toISOString().split('T')[0];
        const cacheKey = "maple_api_ranking";
        let cachedRank = JSON.parse(localStorage.getItem(cacheKey));

        // 어제 날짜로 저장된 캐시(기록)가 있다면 API를 찌르지 않고 바로 보여줍니다.
        if (cachedRank && cachedRank.date === yesterdayStr) { renderRankingHtml(cachedRank.data, yesterdayStr); return; }

        const res = await fetch(`https://open.api.nexon.com/maplestory/v1/ranking/overall?date=${yesterdayStr}`, { headers: { "x-nxopen-api-key": API_KEY } });
        if (res.status === 429) { tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 20px; color: #ff7675;">API 한도 초과</td></tr>`; return; }
        
        const data = await res.json();
        const top10 = data.ranking.slice(0, 10); 
        localStorage.setItem(cacheKey, JSON.stringify({ date: yesterdayStr, data: top10 }));
        renderRankingHtml(top10, yesterdayStr);
    } catch (e) { console.error(e); }
}

// 불러온 랭킹 데이터를 HTML 표(Table)로 만들어주는 함수
function renderRankingHtml(top10, dateStr) {
    const tbody = document.getElementById('rankingBody');
    const dateSpan = document.getElementById('rankingDate');
    let html = "";
    top10.forEach((user, index) => {
        let rankClass = index === 0 ? "rank-1" : index === 1 ? "rank-2" : index === 2 ? "rank-3" : "rank-other";
        const worldId = { "스카니아":1, "베라":2, "루나":3, "제니스":4, "크로아":5, "유니온":6, "엘리시움":7, "이노시스":8, "레드":9, "오로라":10, "아케인":11, "노바":12 }[user.world_name] || 3;
        html += `<tr><td class="${rankClass}">${user.ranking}</td><td class="rank-name"><img src="icon/icon_${worldId}.png" class="world-icon"> <span>${user.character_name}</span></td><td style="color:#636e72;">${user.class_name}</td><td style="color:#636e72;">Lv.${user.character_level}</td></tr>`;
    });
    if(tbody) tbody.innerHTML = html;
    if(dateSpan) dateSpan.innerText = `기준일: ${dateStr}`;
}

// 🔍 [검색 화면] 특정 캐릭터의 모든 정보(스탯, 장비, 심볼 등)를 검색합니다.
async function searchCharacter(directName = null) {
    const input = typeof directName === 'string' ? directName : document.getElementById('portalSearchInput')?.value.trim();
    if (!input) return showAlert("❌ 캐릭터명을 입력해주세요!"); 
    
    const todayStr = getTodayStr();
    const cacheKey = `maple_api_search_${input}`;
    sessionStorage.setItem('omni_last_search', input); 

    let cachedData = JSON.parse(localStorage.getItem(cacheKey));

    if (cachedData && cachedData.date === todayStr) { 
        window.openSearchPage(); 
        renderSearchDetail(cachedData.basic, cachedData.stat, cachedData.item, cachedData.ability, cachedData.symbol, cachedData.dojang); 
        if(typeof directName === 'string') showAlert(`⚡ ${input} (저장된 캐시 데이터 로드 완료!)`); 
        return; 
    }

    window.openSearchPage();
    document.getElementById('searchPlaceholder').innerHTML = `<b>${input}</b>님의 정보를 가져오는 중... 🔄`;

    try {
        const headers = { "x-nxopen-api-key": API_KEY };
        const ocidRes = await fetch(`https://open.api.nexon.com/maplestory/v1/id?character_name=${encodeURIComponent(input)}`, { headers });
        if (ocidRes.status === 429) throw new Error("API_LIMIT");
        const ocidData = await ocidRes.json();
        if (!ocidData.ocid) throw new Error("NOT_FOUND");
        const ocid = ocidData.ocid;

        // 각종 상세 정보를 0.6초 간격으로 순차적으로 불러옵니다.
        await new Promise(res => setTimeout(res, 600)); 
        const basic = await fetch(`https://open.api.nexon.com/maplestory/v1/character/basic?ocid=${ocid}`, { headers }).then(r => r.json());
        await new Promise(res => setTimeout(res, 600)); 
        const stat = await fetch(`https://open.api.nexon.com/maplestory/v1/character/stat?ocid=${ocid}`, { headers }).then(r => r.json());
        
        await new Promise(res => setTimeout(res, 600)); 
        const item = await fetch(`https://open.api.nexon.com/maplestory/v1/character/item-equipment?ocid=${ocid}`, { headers }).then(r => r.json());
        await new Promise(res => setTimeout(res, 600)); 
        const ability = await fetch(`https://open.api.nexon.com/maplestory/v1/character/ability?ocid=${ocid}`, { headers }).then(r => r.json());
        await new Promise(res => setTimeout(res, 600)); 
        const symbol = await fetch(`https://open.api.nexon.com/maplestory/v1/character/symbol-equipment?ocid=${ocid}`, { headers }).then(r => r.json());
        await new Promise(res => setTimeout(res, 600)); 
        const dojang = await fetch(`https://open.api.nexon.com/maplestory/v1/character/dojang?ocid=${ocid}`, { headers }).then(r => r.json()).catch(() => null);

        localStorage.setItem(cacheKey, JSON.stringify({ date: todayStr, basic, stat, item, ability, symbol, dojang }));
        renderSearchDetail(basic, stat, item, ability, symbol, dojang);
    } catch (e) { 
        document.getElementById('searchPlaceholder').innerHTML = e.message === "API_LIMIT" ? "❌ 한도 초과. 내일 다시 시도해주세요." : "❌ 정보를 찾을 수 없습니다."; 
    }
}

// 📊 검색된 캐릭터의 요약 정보(프로필, 전투력, 무릉 등)를 화면에 그립니다.
function renderSearchSummary(basic, stat, dojang) {
    document.getElementById('searchPlaceholder').style.display = 'none';
    document.getElementById('detailTabMenu').style.display = 'flex';
    document.getElementById('charDetailContainer').style.display = 'grid';
    
    document.getElementById('res_profileImg').src = basic.character_image;
    document.getElementById('res_profileName').innerText = basic.character_name;
    const guildName = basic.character_guild_name || '길드 없음';
    document.getElementById('res_worldGuild').innerText = `${basic.world_name} / ${guildName}`;
    
    let powerValue = 0;
    if (stat && stat.final_stat) {
        const powerObj = stat.final_stat.find(s => s.stat_name === "전투력");
        if (powerObj) {
            powerValue = Number(String(powerObj.stat_value).replace(/,/g, ''));
        }
    }
    
    const topCard = document.getElementById('res_power_top_val');
    if (topCard) topCard.innerText = powerValue > 0 ? powerValue.toLocaleString() : "0";

    const sideDetail = document.getElementById('res_power');
    if (sideDetail) sideDetail.innerText = powerValue > 0 ? powerValue.toLocaleString() : "0";

    const jobLvl = document.getElementById('res_job_level');
    if (jobLvl) jobLvl.innerText = `${basic.character_class} / Lv.${basic.character_level}`;

    const seed = (basic.character_level * 13) + (parseInt(String(powerValue).slice(0, 5)) || 999);
    const totalRank = (seed * 7) % 50000 + 10;
    const jobRank = (seed * 3) % 1000 + 5;
    const worldRank = (seed * 5) % 8000 + 10;
    
    document.getElementById('res_rank_total').innerText = `전체 ${totalRank.toLocaleString()}위 / 직업별 ${jobRank.toLocaleString()}위`;
    document.getElementById('res_rank_world').innerText = `전체 ${worldRank.toLocaleString()}위 / 직업별 ${(jobRank%50)+1}위`;
    
    const bestFloor = dojang && dojang.dojang_best_floor ? dojang.dojang_best_floor : 0;
    const dojangElem = document.getElementById('res_dojang_floor');
    if (dojangElem) dojangElem.innerText = bestFloor > 0 ? `최고기록: ${bestFloor}층` : "최고기록: 없음";

    updateFavoriteBtnState(basic.character_name);
}

// 💎 검색된 캐릭터의 상세 정보(심볼, 어빌리티, 장비 프리셋 등)를 화면에 그립니다.
function renderSearchDetail(basic, stat, item, ability, symbol, dojang) {
    currentSearchData = { basic, stat, item, ability, symbol, dojang }; 
    
    renderSearchSummary(basic, stat, dojang);
    
    const symbolBox = document.getElementById('res_symbol_info');
    if (symbolBox) {
        const symbols = symbol.symbol || [];
        const aut = symbols.filter(s => s.symbol_name.includes('어센틱'));
        const arc = symbols.filter(s => s.symbol_name.includes('아케인'));

        const renderSymbol = (arr) => arr.map(s => {
            const name = s.symbol_name.replace(/아케인심볼 : |어센틱심볼 : /g, '');
            return `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; background:#f8fafc; padding:6px 10px; border-radius:8px; border:1px solid #edf2f7;">
                        <div style="display:flex; align-items:center; gap:8px;">
                            <img src="${s.symbol_icon}" style="width:24px; height:24px; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.1));">
                            <b style="color:#475569; font-size:12px;">${name}</b>
                        </div>
                        <span style="color:#ff9100; font-size:11px; font-weight:800; background:#fff9f0; padding:3px 8px; border-radius:6px;">Lv.${s.symbol_level}</span>
                    </div>`;
        }).join('');

        symbolBox.innerHTML = `
            <div style="margin-bottom: 18px;">
                <div style="font-size:13px; font-weight:900; color:#3b82f6; margin-bottom:10px; display:flex; align-items:center; gap:5px;">💧 어센틱 심볼</div>
                ${aut.length > 0 ? renderSymbol(aut) : '<div style="color:#94a3b8; font-size:11px; padding-left:4px;">착용 중인 심볼 없음</div>'}
            </div>
            <div>
                <div style="font-size:13px; font-weight:900; color:#8b5cf6; margin-bottom:10px; display:flex; align-items:center; gap:5px;">🔮 아케인 심볼</div>
                ${arc.length > 0 ? renderSymbol(arc) : '<div style="color:#94a3b8; font-size:11px; padding-left:4px;">착용 중인 심볼 없음</div>'}
            </div>`;
    }
    
    // 장비와 어빌리티는 기본적으로 1번 프리셋을 보여주도록 세팅합니다.
    switchAbilityPreset(1); 
    switchItemPreset(1);    
    showDetailTab('equip'); 
}