/**
 * ============================================================================
 * 🔍 MAPLE OMNI - api-search.js (심볼 & 사이드바 완벽 복구본)
 * ============================================================================
 */

if (typeof isSearching === 'undefined') {
    window.isSearching = false;
}

// 🚀 [1] 캐릭터 검색 메인 함수
async function searchCharacter(directName = null, isSyncOnly = false) {
    if (window.isSearching) return; 
    
    const searchInput = document.getElementById('portalSearchInput');
    const input = typeof directName === 'string' ? directName : searchInput?.value.trim();
    
    if (!input) return; 

    localStorage.setItem('maple_last_search', input); 

    window.isSearching = true;
    if(typeof toggleLoading === 'function') toggleLoading(true, `${input} 님의 정보를 분석 중입니다...`);

    try {
        const todayStr = new Date().toISOString().split('T')[0];
        const cacheKey = `maple_api_search_v2_${input}`; 
        let cachedData = JSON.parse(localStorage.getItem(cacheKey));

        // 1. 오늘 검색 기록이 있다면 즉시 렌더링
        if (cachedData && cachedData.date === todayStr) { 
            window.currentSearchData = cachedData; 
            renderSearchDetail(cachedData.basic, cachedData.stat, cachedData.item, cachedData.ability, cachedData.symbol, cachedData.dojang, cachedData.union, cachedData.ranking); 
            window.isSearching = false;
            if(typeof toggleLoading === 'function') toggleLoading(false);
            return true; 
        }

        // 2. API 데이터 호출 (넥슨 서버)
        const headers = { "x-nxopen-api-key": API_KEY };
        const ocidRes = await fetch(`https://open.api.nexon.com/maplestory/v1/id?character_name=${encodeURIComponent(input)}`, { headers });
        const ocidData = await ocidRes.json();
        if (!ocidData.ocid) throw new Error("NOT_FOUND");
        const ocid = ocidData.ocid;

        const delay = () => new Promise(r => setTimeout(r, 600));

        await delay();
        const basic = await fetch(`https://open.api.nexon.com/maplestory/v1/character/basic?ocid=${ocid}`, { headers }).then(r => r.json());
        await delay();
        const stat = await fetch(`https://open.api.nexon.com/maplestory/v1/character/stat?ocid=${ocid}`, { headers }).then(r => r.json());
        await delay();
        const item = await fetch(`https://open.api.nexon.com/maplestory/v1/character/item-equipment?ocid=${ocid}`, { headers }).then(r => r.json());
        await delay();
        const ability = await fetch(`https://open.api.nexon.com/maplestory/v1/character/ability?ocid=${ocid}`, { headers }).then(r => r.json());
        await delay();
        const symbol = await fetch(`https://open.api.nexon.com/maplestory/v1/character/symbol-equipment?ocid=${ocid}`, { headers }).then(r => r.json());
        await delay();
        const dojang = await fetch(`https://open.api.nexon.com/maplestory/v1/character/dojang?ocid=${ocid}`, { headers }).then(r => r.json()).catch(() => null);
        await delay();
        const union = await fetch(`https://open.api.nexon.com/maplestory/v1/user/union?ocid=${ocid}`, { headers }).then(r => r.json()).catch(() => ({ union_level: 0 }));

        const now = new Date();
        const offset = now.getHours() < 10 ? 2 : 1;
        now.setDate(now.getDate() - offset);
        const rDateStr = now.toISOString().split('T')[0];
        const rankBaseUrl = `https://open.api.nexon.com/maplestory/v1/ranking/overall?date=${rDateStr}&ocid=${ocid}`;
        
        const [resTotal, resWorld, resClass] = await Promise.allSettled([
            fetch(rankBaseUrl, { headers }).then(r => r.json()),
            fetch(`${rankBaseUrl}&world_name=${encodeURIComponent(basic.world_name)}`, { headers }).then(r => r.json()),
            fetch(`${rankBaseUrl}&class_name=${encodeURIComponent(basic.character_class)}`, { headers }).then(r => r.json())
        ]);

        const ranking = {
            total_rank: resTotal.value?.ranking?.[0]?.ranking || 0,
            world_rank: resWorld.value?.ranking?.[0]?.ranking || 0,
            class_rank: resClass.value?.ranking?.[0]?.ranking || 0
        };

        const result = { date: todayStr, basic, stat, item, ability, symbol, dojang, union, ranking };
        localStorage.setItem(cacheKey, JSON.stringify(result));
        window.currentSearchData = result; 

        renderSearchDetail(basic, stat, item, ability, symbol, dojang, union, ranking);
        return true; 

    } catch (e) { 
        console.error(e);
        if(typeof showAlert === 'function') showAlert("캐릭터 정보를 찾을 수 없습니다.");
        return false; 
    } finally {
        window.isSearching = false;
        if(typeof toggleLoading === 'function') toggleLoading(false);
    }
}

// 🎨 [2] 캐릭터 상세 정보 총괄 일꾼
function renderSearchDetail(basic, stat, item, ability, symbol, dojang, union, ranking) {
    window.currentSearchData = { basic, stat, item, ability, symbol, dojang, union, ranking }; 

    // 상단 카드 그리기
    renderSearchSummary(basic, stat, dojang, union, ranking);
    
    // 🔥 [핵심 복구] 심볼을 그리는 함수를 여기서 부릅니다. (아래에 정의되어 있음)
    renderSymbols(symbol);
    
    // 사이드바 캐릭터 카드 채우기
    const els = {
        img: document.getElementById('profileImg'),
        name: document.getElementById('profileName'),
        world: document.getElementById('profileWorld'),
        guild: document.getElementById('profileGuild'),
        level: document.getElementById('profileLevel'),
        job: document.getElementById('profileJob'),
        power: document.getElementById('stat_power'),
        atk: document.getElementById('stat_atk'),
        dmg: document.getElementById('stat_dmg')
    };

    if (els.img) els.img.src = basic.character_image;
    if (els.name) els.name.innerText = basic.character_name;
    if (els.world) els.world.innerText = basic.world_name;
    if (els.guild) els.guild.innerText = basic.character_guild_name || "길드 없음";
    if (els.level) els.level.innerText = `Lv. ${basic.character_level}`;
    if (els.job) els.job.innerText = basic.character_class;

    // 💡 사이드바 스탯 수치 채우기 (전투력, 스공, 데미지)
    if (stat && stat.final_stat) {
        const getV = (name) => stat.final_stat.find(s => s.stat_name === name)?.stat_value || "0";
        if (els.power) els.power.innerText = parseInt(stat.character_combat_power || 0).toLocaleString();
        if (els.atk) els.atk.innerText = parseInt(getV("최대 스탯공격력")).toLocaleString();
        if (els.dmg) els.dmg.innerText = getV("데미지") + "%";
    }

    if(typeof switchAbilityPreset === 'function') switchAbilityPreset(1); 
    if(typeof switchItemPreset === 'function') switchItemPreset(1);    
}

// 🏆 [3] 상단 요약 카드 및 사냥셋 분석
function renderSearchSummary(basic, stat, dojang, union, ranking) {
    const placeholder = document.getElementById('searchPlaceholder');
    if(placeholder) placeholder.style.display = 'none';
    
    const detailTab = document.getElementById('detailTabMenu');
    if(detailTab) detailTab.style.display = 'flex';
    
    const detailContainer = document.getElementById('charDetailContainer');
    if(detailContainer) {
        detailContainer.style.setProperty('display', 'grid', 'important');
    }
    
    const profileImg = document.getElementById('res_profileImg');
    if(profileImg) profileImg.src = basic.character_image;
    const profileName = document.getElementById('res_profileName');
    if(profileName) profileName.innerText = basic.character_name;
    const worldGuild = document.getElementById('res_worldGuild');
    if(worldGuild) worldGuild.innerText = `${basic.world_name} / ${basic.character_guild_name || '길드 없음'}`;
    
    const rankTotal = document.getElementById('res_rank_total');
    if(rankTotal) rankTotal.innerText = ranking.total_rank > 0 ? `${ranking.total_rank.toLocaleString()}위` : "기록 없음";
    const rankWorld = document.getElementById('res_rank_world');
    if(rankWorld) rankWorld.innerText = ranking.world_rank > 0 ? `${ranking.world_rank.toLocaleString()}위` : "기록 없음";
    const rankClass = document.getElementById('res_rank_class');
    if(rankClass) rankClass.innerText = ranking.class_rank > 0 ? `${ranking.class_rank.toLocaleString()}위` : "기록 없음";

    const unionLevel = document.getElementById('res_union_level');
    if(unionLevel) unionLevel.innerText = (union && union.union_level) ? `Lv.${union.union_level.toLocaleString()}` : "Lv.---";
    const dojangEl = document.getElementById('res_dojang_floor');
    if (dojangEl) dojangEl.innerText = (dojang && dojang.dojang_best_floor) ? `최고: ${dojang.dojang_best_floor}층` : "기록 없음";
    
    let powerValue = 0;
    if (stat && stat.final_stat) {
        const pObj = stat.final_stat.find(s => s.stat_name === "전투력");
        if (pObj) powerValue = parseInt(pObj.stat_value, 10);
    }
    const topCard = document.getElementById('res_power_top_val');
    if (topCard) topCard.innerText = powerValue > 0 ? powerValue.toLocaleString() : "0";
    const jobLevelEl = document.getElementById('res_job_level');
    if(jobLevelEl) jobLevelEl.innerText = `${basic.character_class} / Lv.${basic.character_level}`;

    // 🕵️ 사냥셋 실시간 분석
    const equipList = window.currentSearchData?.item?.item_equipment || [];
    let isHuntingSet = false;
    let huntReason = "";

    equipList.forEach(item => {
        if (item.item_name && item.item_name.includes("정령의 펜던트")) { isHuntingSet = true; huntReason = "정령의 펜던트"; }
        const pots = [item.potential_option_1, item.potential_option_2, item.potential_option_3, item.additional_potential_option_1, item.additional_potential_option_2, item.additional_potential_option_3].filter(Boolean);
        if (pots.some(opt => opt.includes("드롭률") || opt.includes("메소"))) { isHuntingSet = true; huntReason = "아획/메획 아이템"; }
    });

    let analysisBar = document.getElementById('omni_analysis_bar');
    if (isHuntingSet) {
        if (!analysisBar) {
            analysisBar = document.createElement('div');
            analysisBar.id = 'omni_analysis_bar';
            if(detailContainer) detailContainer.prepend(analysisBar);
        }
        analysisBar.style = "grid-column: span 3; margin-bottom: 20px; padding: 12px 20px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; display: flex; align-items: center; gap: 10px;";
        analysisBar.innerHTML = `<span>🔍</span><span style="font-size: 12px; color: #92400e; font-weight: 500;"><b style="color: #b45309;">사냥 셋팅 감지:</b> 현재 캐릭터가 <span style="font-weight:800;">${huntReason}</span> 상태로 조회되었습니다.</span>`;
    } else if (analysisBar) {
        analysisBar.remove();
    }
}

/**
 * 💎 심볼 정보 렌더링 (탭 디자인 버전)
 * 역할: 아케인/어센틱 심볼을 탭으로 나누고, 합계 능력치를 계산해서 보여줍니다.
 */
function renderSymbols(symbolData) {
    const container = document.getElementById('res_symbol_info');
    if (!container) return;

    // 1. 나중에 탭을 클릭했을 때 데이터를 다시 써야 하므로 전역 변수에 저장해둡니다.
    window.lastSymbolData = symbolData;

    // 2. 초기 화면을 그립니다 (기본값은 '아케인' 탭 선택)
    renderSymbolTab('arcane');
}

/**
 * 🎨 캐릭터 심볼 렌더링 (미니멀 & 클린 화이트 버전)
 */
function renderSymbolTab(type) {
    const container = document.getElementById('res_symbol_info');
    const symbolData = window.lastSymbolData;
    if (!container || !symbolData) return;

    const arcaneList = symbolData.symbol.filter(s => s.symbol_name.includes('아케인'));
    const authenticList = symbolData.symbol.filter(s => s.symbol_name.includes('어센틱'));
    
    const isArcane = type === 'arcane';
    const targetList = isArcane ? arcaneList : authenticList;
    
    // 포인트 컬러 (매우 절제된 톤)
    const pointColor = isArcane ? '#2563eb' : '#7c3aed';
    const statName = isArcane ? 'ARC' : 'AUT';

    // 수치 계산
    let totalSymbolStat = 0;
    let totalMainStat = 0;
    targetList.forEach(s => {
        const lv = parseInt(s.symbol_level);
        if (isArcane) {
            totalSymbolStat += (lv * 10) + 20;
            totalMainStat += (lv * 100) + 200;
        } else {
            totalSymbolStat += (lv * 10) + 20;
            totalMainStat += (lv * 200) + 300;
        }
    });

    let html = `
        <div style="background: #ffffff; border-radius: 12px; padding: 20px; font-family: 'Pretendard', sans-serif; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
            
            <div style="display: flex; background: #f1f5f9; padding: 4px; border-radius: 10px; margin-bottom: 20px;">
                <button onclick="renderSymbolTab('arcane')" style="flex: 1; padding: 9px; border: none; border-radius: 7px; cursor: pointer; font-weight: 700; font-size: 12px; transition: all 0.2s; 
                    background: ${isArcane ? '#ffffff' : 'transparent'}; 
                    color: ${isArcane ? '#1e293b' : '#94a3b8'}; 
                    box-shadow: ${isArcane ? '0 2px 6px rgba(0,0,0,0.08)' : 'none'};">Arcane</button>
                <button onclick="renderSymbolTab('authentic')" style="flex: 1; padding: 9px; border: none; border-radius: 7px; cursor: pointer; font-weight: 700; font-size: 12px; transition: all 0.2s; 
                    background: ${!isArcane ? '#ffffff' : 'transparent'}; 
                    color: ${!isArcane ? '#1e293b' : '#94a3b8'}; 
                    box-shadow: ${!isArcane ? '0 2px 6px rgba(0,0,0,0.08)' : 'none'};">Authentic</button>
            </div>

            <div style="border-bottom: 2px solid #f8fafc; padding-bottom: 15px; margin-bottom: 20px; text-align: center;">
                <div style="font-size: 11px; color: #94a3b8; font-weight: 700; margin-bottom: 4px; letter-spacing: 0.5px;">TOTAL STATS</div>
                <div style="font-size: 15px; font-weight: 800; color: #1e293b;">
                    ${statName} <span style="color:${pointColor};">+${totalSymbolStat.toLocaleString()}</span> │ 
                    Stat <span style="color:${pointColor};">+${totalMainStat.toLocaleString()}</span>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
                ${targetList.map(s => {
                    const isMax = (isArcane && s.symbol_level == 20) || (!isArcane && s.symbol_level == 11);
                    return `
                        <div style="background: #ffffff; border-radius: 12px; padding: 15px 0; text-align: center; border: 1px solid #f1f5f9; box-shadow: 0 2px 4px rgba(0,0,0,0.02); display: flex; flex-direction: column; align-items: center;">
                            <div style="width: 32px; height: 32px; margin-bottom: 10px; display: flex; align-items: center; justify-content: center;">
                                <img src="${s.symbol_icon}" style="max-width: 100%; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));">
                            </div>
                            <div style="font-size: 12px; font-weight: 800; color: #334155;">Lv.${s.symbol_level}</div>
                            ${isMax ? `<div style="font-size: 9px; color: ${pointColor}; font-weight: 900; margin-top: 2px;">MAX</div>` : ''}
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;

    container.innerHTML = html;
}