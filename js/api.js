/**
 * ============================================================================
 * 📡 MAPLE OMNI - API 통신 전용 모듈 (api.js) - 트래픽 최적화 완료
 * ============================================================================
 */

// 🚦 중복 실행 방지를 위한 전역 Lock 변수
let isSearching = false;
let isFetchingRanking = false;
let isFindingRivals = false;
let isComparing = false;

// 🔍 캐릭터를 검색하고 데이터를 가져오는 핵심 함수 (캐싱 및 Lock 적용)
async function searchCharacter(directName = null, isForce = false) {
    if (isSearching) return; // 이미 검색 중이면 무시
    const input = typeof directName === 'string' ? directName : document.getElementById('portalSearchInput')?.value.trim();
    if (!input) return showAlert("❌ 캐릭터명을 입력해주세요!"); 

    if (!isForce && window.history.state && window.history.state.page === 'charDetail') {
        window.history.replaceState({ page: 'charDetail' }, null, "");
    }

    const switchScreen = () => {
        const portal = document.getElementById('mainPortal');
        const searchPage = document.getElementById('searchPageContent');
        if (portal && searchPage) {
            portal.style.display = 'none';
            searchPage.style.display = 'block';
            if (!isForce) {
                if (!window.history.state || window.history.state.page !== 'charDetail') {
                    window.history.pushState({ page: 'charDetail' }, null, "");
                } else {
                    window.history.replaceState({ page: 'charDetail' }, null, "");
                }
            }
        }
        sessionStorage.setItem('omni_current_page', 'search');
        window.scrollTo(0, 0);
    };

    isSearching = true;
    if(typeof toggleLoading === 'function') toggleLoading(true, `${input} 님의 정보를 분석 중입니다...`);

    try {
        const todayStr = new Date().toISOString().split('T')[0];
        const cacheKey = `maple_api_search_${input}`;
        let cachedData = JSON.parse(localStorage.getItem(cacheKey));

        // 하루에 한 번만 API를 호출하도록 로컬 스토리지 캐시 활용
        if (!isForce && cachedData && cachedData.date === todayStr) { 
            window.currentSearchData = cachedData; 
            renderSearchDetail(cachedData.basic, cachedData.stat, cachedData.item, cachedData.ability, cachedData.symbol, cachedData.dojang); 
            switchScreen();
            return; 
        }

        const headers = { "x-nxopen-api-key": API_KEY };
        const ocidRes = await fetch(`https://open.api.nexon.com/maplestory/v1/id?character_name=${encodeURIComponent(input)}`, { headers });
        const ocidData = await ocidRes.json();
        if (!ocidData.ocid) throw new Error("NOT_FOUND");
        const ocid = ocidData.ocid;

        // 넥슨 API Rate Limit(초당 호출 제한) 방지를 위한 딜레이
        await new Promise(r => setTimeout(r, 600)); 
        const basic = await fetch(`https://open.api.nexon.com/maplestory/v1/character/basic?ocid=${ocid}`, { headers }).then(r => r.json());
        await new Promise(r => setTimeout(r, 600)); 
        const stat = await fetch(`https://open.api.nexon.com/maplestory/v1/character/stat?ocid=${ocid}`, { headers }).then(r => r.json());
        await new Promise(r => setTimeout(r, 600)); 
        const item = await fetch(`https://open.api.nexon.com/maplestory/v1/character/item-equipment?ocid=${ocid}`, { headers }).then(r => r.json());
        await new Promise(r => setTimeout(r, 600)); 
        const ability = await fetch(`https://open.api.nexon.com/maplestory/v1/character/ability?ocid=${ocid}`, { headers }).then(r => r.json());
        await new Promise(r => setTimeout(r, 600)); 
        const symbol = await fetch(`https://open.api.nexon.com/maplestory/v1/character/symbol-equipment?ocid=${ocid}`, { headers }).then(r => r.json());
        await new Promise(r => setTimeout(r, 600)); 
        const dojang = await fetch(`https://open.api.nexon.com/maplestory/v1/character/dojang?ocid=${ocid}`, { headers }).then(r => r.json()).catch(() => null);

        // 🏆 [최적화] 랭킹 API 호출 (캐싱 적용으로 횟수 최소화)
        const rankDate = new Date(); rankDate.setDate(rankDate.getDate() - 1);
        const rDateStr = rankDate.toISOString().split('T')[0];
        const rankCacheKey = `rank_cache_${input}_${rDateStr}`;
        const cachedRanks = JSON.parse(localStorage.getItem(rankCacheKey));

        if (cachedRanks) {
            // 이미 오늘 조회한 기록이 있다면 API 호출 없이 바로 적용
            basic.rank_total = cachedRanks.total;
            basic.rank_world = cachedRanks.world;
            basic.rank_class = cachedRanks.class;
        } else {
            // 기록이 없을 때만 딱 1번 호출
            const rankBaseUrl = `https://open.api.nexon.com/maplestory/v1/ranking/overall?date=${rDateStr}&ocid=${ocid}`;
            const [resTotal, resWorld, resClass] = await Promise.allSettled([
                fetch(rankBaseUrl, { headers }).then(r => r.json()),
                fetch(`${rankBaseUrl}&world_name=${encodeURIComponent(basic.world_name)}`, { headers }).then(r => r.json()),
                fetch(`${rankBaseUrl}&class_name=${encodeURIComponent(basic.character_class)}`, { headers }).then(r => r.json())
            ]);

            basic.rank_total = resTotal.value?.ranking?.[0]?.ranking || 0;
            basic.rank_world = resWorld.value?.ranking?.[0]?.ranking || 0;
            basic.rank_class = resClass.value?.ranking?.[0]?.ranking || 0;

            // 결과 저장해서 다음 검색 땐 호출 안 하게 함
            localStorage.setItem(rankCacheKey, JSON.stringify({
                total: basic.rank_total,
                world: basic.rank_world,
                class: basic.rank_class
            }));
        }

        // 🏰 [추가] 유니온 레벨 정보 가져오기
        await new Promise(r => setTimeout(r, 600));
        const union = await fetch(`https://open.api.nexon.com/maplestory/v1/user/union?ocid=${ocid}`, { headers })
            .then(r => r.json())
            .catch(() => ({ union_level: 0 }));

        // 📦 최종 결과 저장 (union 추가)
        const result = { date: todayStr, basic, stat, item, ability, symbol, dojang, union };
        localStorage.setItem(cacheKey, JSON.stringify(result));
        window.currentSearchData = result; 

        // 🚚 배달원에게 union 데이터까지 실어서 보냅니다.
        renderSearchDetail(basic, stat, item, ability, symbol, dojang, union);
        switchScreen();

    } catch (e) { 
        showAlert("캐릭터 정보를 찾을 수 없거나 API 한도 초과입니다.");
    } finally {
        isSearching = false;
        if(typeof toggleLoading === 'function') toggleLoading(false);
    }
}

// 🏆 메인 포털 랭킹 조회 (캐싱 강화)
async function fetchRanking() {
    if (isFetchingRanking) return;
    const tbody = document.getElementById('rankingBody');
    if (!tbody) return;
    
    isFetchingRanking = true;
    try {
        const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
        const dateStr = yesterday.toISOString().split('T')[0];
        
        const cachedRanking = JSON.parse(localStorage.getItem("maple_api_ranking"));
        if (cachedRanking && cachedRanking.date === dateStr) {
            renderRankingHtml(cachedRanking.data, dateStr);
            return;
        }

        const res = await fetch(`https://open.api.nexon.com/maplestory/v1/ranking/overall?date=${dateStr}`, { headers: { "x-nxopen-api-key": API_KEY } });
        const data = await res.json();
        
        if (data.ranking) {
            const top10 = data.ranking.slice(0, 10);
            localStorage.setItem("maple_api_ranking", JSON.stringify({ date: dateStr, data: top10 }));
            renderRankingHtml(top10, dateStr);
        }
    } catch (e) { 
        console.error("랭킹 조회 실패:", e); 
    } finally {
        isFetchingRanking = false;
    }
}

function renderRankingHtml(top10, dateStr) {
    const tbody = document.getElementById('rankingBody');
    const dateSpan = document.getElementById('rankingDate');
    let html = "";
    top10.forEach((user) => {
        const worldMap = { "스카니아":1, "베라":2, "루나":3, "제니스":4, "크로아":5, "유니온":6, "엘리시움":7, "이노시스":8, "레드":9, "오로라":10, "아케인":11, "노바":12 };
        const worldId = worldMap[user.world_name] || 3;
        html += `<tr>
                    <td>${user.ranking}</td>
                    <td class="rank-name"><img src="icon/icon_${worldId}.png" class="world-icon" onerror="this.style.display='none'"> <span>${user.character_name}</span></td>
                    <td>${user.class_name}</td>
                    <td>Lv.${user.character_level}</td>
                 </tr>`;
    });
    if(tbody) tbody.innerHTML = html;
    if(dateSpan) dateSpan.innerText = `기준일: ${dateStr}`;
}

// 📦 [데이터 배달] API로 받은 모든 데이터를 전역에 저장하고, 화면별 렌더링 함수를 실행합니다.
function renderSearchDetail(basic, stat, item, ability, symbol, dojang, union) {
    // 1. 전역 데이터 저장소 업데이트 (나중에 꺼내 쓸 수 있게 union도 포함)
    window.currentSearchData = { basic, stat, item, ability, symbol, dojang, union }; 
    
    // 2. 상단 요약 바 출력 (여기에 union이 들어가야 Lv.---가 사라집니다!)
    renderSearchSummary(basic, stat, dojang, union);
    
    // 3. 하단 상세 탭 초기화
    if(typeof switchAbilityPreset === 'function') switchAbilityPreset(1); 
    if(typeof switchItemPreset === 'function') switchItemPreset(1);    
    if(typeof showDetailTab === 'function') showDetailTab('equip'); 
}

// 📦 [요약 정보 렌더링] 상단 6칸 그리드에 랭킹, 유니온, 전투력 등을 출력합니다.
function renderSearchSummary(basic, stat, dojang) {
    const placeholder = document.getElementById('searchPlaceholder');
    if(placeholder) placeholder.style.display = 'none';
    const detailTab = document.getElementById('detailTabMenu');
    if(detailTab) detailTab.style.display = 'flex';
    const detailContainer = document.getElementById('charDetailContainer');
    if(detailContainer) detailContainer.style.display = 'grid';
    
    // 1. 기본 프로필 설정
    const profileImg = document.getElementById('res_profileImg');
    if(profileImg) profileImg.src = basic.character_image || "https://open.api.nexon.com/static/maplestory/Character/Default.png";
    
    const profileName = document.getElementById('res_profileName');
    if(profileName) profileName.innerText = basic.character_name || "알 수 없음";
    
    const worldGuild = document.getElementById('res_worldGuild');
    if(worldGuild) worldGuild.innerText = `${basic.world_name || '-'} / ${basic.character_guild_name || '길드 없음'}`;
    
    // 2. 랭킹 정보 매핑 (종합, 서버, 직업)
    const rankTotal = document.getElementById('res_rank_total');
    if(rankTotal) rankTotal.innerText = basic.rank_total ? `${basic.rank_total.toLocaleString()}위` : "기록 없음";
    
    const rankWorld = document.getElementById('res_rank_world');
    if(rankWorld) rankWorld.innerText = basic.rank_world ? `${basic.rank_world.toLocaleString()}위` : "기록 없음";

    const rankClass = document.getElementById('res_rank_class');
    if(rankClass) rankClass.innerText = basic.rank_class ? `${basic.rank_class.toLocaleString()}위` : "기록 없음";

    // 🏰 3. 유니온 레벨 매핑 (window.currentSearchData에서 안전하게 가져옴)
    const unionLevel = document.getElementById('res_union_level');
    const unionData = window.currentSearchData?.union;
    if(unionLevel) {
        unionLevel.innerText = (unionData && unionData.union_level) ? `Lv.${unionData.union_level.toLocaleString()}` : "Lv.---";
    }

    // 🥋 4. 무릉도장 정보
    const dojangEl = document.getElementById('res_dojang_floor');
    if (dojangEl) {
        dojangEl.innerText = (dojang && dojang.dojang_best_floor) 
            ? `최고기록: ${dojang.dojang_best_floor}층` 
            : "기록 없음";
    }

    // 5. 직업/레벨 정보
    const jobLevelEl = document.getElementById('res_job_level');
    if(jobLevelEl) {
        jobLevelEl.innerText = `${basic.character_class || '---'} / Lv.${basic.character_level || '---'}`;
    }
    
// ⚔️ 6. 전투력 계산 및 [하단 분석 문구 바] 로직
    let powerValue = 0;
    if (stat && stat.final_stat) {
        const powerObj = stat.final_stat.find(s => s.stat_name === "전투력");
        if (powerObj) powerValue = Number(String(powerObj.stat_value).replace(/,/g, ''));
    }
    
    const topCard = document.getElementById('res_power_top_val');
    // 상세 정보 카드의 메인 컨테이너를 타겟팅합니다.
    const infoContainer = document.querySelector('#searchPageContent > div:nth-child(2)'); 

    if (topCard) {
        // 숫자는 원래 디자인대로 아주 깔끔하게 유지
        topCard.innerText = powerValue > 0 ? powerValue.toLocaleString() : "0";

        // 🔎 사냥셋 여부 판독
        const equipList = window.currentSearchData?.item?.item_equipment || [];
        let isHuntingSet = false;
        let huntReason = "";

        equipList.forEach(item => {
            if (item.item_name && item.item_name.includes("정령의 펜던트")) {
                isHuntingSet = true;
                huntReason = "정령의 펜던트 착용";
            }
            const pots = [item.potential_option_1, item.potential_option_2, item.potential_option_3, item.additional_potential_option_1, item.additional_potential_option_2, item.additional_potential_option_3].filter(Boolean);
            if (pots.some(opt => opt.includes("드롭률") || opt.includes("메소"))) {
                isHuntingSet = true;
                huntReason = "아획/메획 셋팅";
            }
        });

        // 📝 [핵심] 하단 분석 문구 바 생성/제거 로직
        let analysisBar = document.getElementById('omni_analysis_bar');
        
        if (isHuntingSet) {
            if (!analysisBar) {
                analysisBar = document.createElement('div');
                analysisBar.id = 'omni_analysis_bar';
                // 카드 내부 최하단에 부착
                infoContainer.appendChild(analysisBar);
            }
            
            // 사용자님이 검정색으로 표시한 위치에 들어갈 세련된 스타일
            analysisBar.style = "margin-top: 20px; padding: 12px 20px; background: #f8fafc; border-top: 1px solid #edf2f7; border-radius: 0 0 20px 20px; display: flex; align-items: center; gap: 10px;";
            analysisBar.innerHTML = `
                <span style="font-size: 14px;">🔍</span>
                <span style="font-size: 12px; color: #64748b; font-weight: 500; line-height: 1.4;">
                    <b style="color: #475569;">OMNI 분석 리포트:</b> 현재 캐릭터가 <span style="color:#ff9100; font-weight:800;">${huntReason}</span> 상태로 조회되었습니다. 
                    Open API 특성상 마지막 갱신 시점이 사냥 모드이므로 실제 보스 전투력과는 차이가 있을 수 있습니다.
                </span>
            `;
        } else if (analysisBar) {
            // 보스셋일 경우 분석 바 제거
            analysisBar.remove();
        }
    }
} // renderSearchSummary 끝

// ============================================================================
// 📡 OMNI SCANNER - 실시간 전투력 기반 라이벌 탐색 엔진 (세션 캐싱 철저 적용)
// ============================================================================

// 📡 [스캐너 탭] 내 주변 순위 유저들을 훑어서 실시간으로 라이벌 3명을 찾습니다.
async function findRealPowerRivals() {
    if (isFindingRivals) return; // 중복 클릭 방지
    const rivalContainer = document.getElementById('scanner_recommend_list');
    if (!rivalContainer || !window.currentSearchData) return;

    isFindingRivals = true;

    try {
        const topPowerEl = document.getElementById('res_power_top_val');
        const myPower = topPowerEl ? Number(topPowerEl.innerText.replace(/,/g, '')) : 0;
        
        if (myPower === 0) throw new Error("전투력 정보가 없습니다.");

        const myName = window.currentSearchData.basic.character_name;
        const myJob = window.currentSearchData.basic.character_class;
        const worldName = window.currentSearchData.basic.world_name || "스카니아";
        
        const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
        const dateStr = yesterday.toISOString().split('T')[0];

        // 🔥 API 폭주 방지: 이미 찾은 라이벌이 있다면 세션에서 바로 불러옵니다.
        const rivalCacheKey = `omni_rivals_${myName}_${dateStr}`;
        const cachedRivals = JSON.parse(sessionStorage.getItem(rivalCacheKey));
        
        if (cachedRivals && cachedRivals.length > 0) {
            renderRivalsHtml(cachedRivals, rivalContainer);
            return;
        }

        rivalContainer.innerHTML = ""; 
        const loadingMsg = document.createElement('div');
        loadingMsg.style.cssText = "width:100%; text-align:center; color:#6c5ce7; font-weight:bold; padding:20px; border:1px dashed #6c5ce7; border-radius:12px; background:#f5f3ff;";
        loadingMsg.innerText = "📡 주변 순위 라이벌 유저들을 스캐닝 중입니다... (최초 1회만 약 2~3초 소요)";
        rivalContainer.appendChild(loadingMsg);

        const headers = { "x-nxopen-api-key": API_KEY };
        const rankUrl = `https://open.api.nexon.com/maplestory/v1/ranking/overall?date=${dateStr}&world_name=${encodeURIComponent(worldName)}&class_name=${encodeURIComponent(myJob)}`;
        const rankRes = await fetch(rankUrl, { headers }).then(r => r.json());

        if (!rankRes.ranking || rankRes.ranking.length === 0) {
            rivalContainer.innerHTML = `<div style="text-align:center; width:100%; padding:15px; color:#94a3b8;">주변 유저 데이터가 없습니다.</div>`;
            return;
        }

        const candidates = rankRes.ranking.filter(u => u.character_name !== myName).sort(() => 0.5 - Math.random()).slice(0, 4);
        let rivalResults = [];

        for (const user of candidates) {
            const ocidRes = await fetch(`https://open.api.nexon.com/maplestory/v1/id?character_name=${encodeURIComponent(user.character_name)}`, { headers }).then(r => r.json());
            if (ocidRes.ocid) {
                const statRes = await fetch(`https://open.api.nexon.com/maplestory/v1/character/stat?ocid=${ocidRes.ocid}`, { headers }).then(r => r.json());
                const pObj = statRes.final_stat.find(s => s.stat_name === "전투력");
                const power = pObj ? Number(pObj.stat_value) : 0;
                if (power > 0) {
                    rivalResults.push({ name: user.character_name, power: power, job: user.class_name });
                }
            }
            await new Promise(r => setTimeout(r, 400)); // Rate Limit 방어
        }

        if (rivalResults.length === 0) {
            rivalContainer.innerHTML = `<div style="text-align:center; width:100%; padding:15px; color:#94a3b8;">비교 가능한 라이벌을 찾지 못했습니다.</div>`;
            return;
        }

        rivalResults.sort((a, b) => Math.abs(a.power - myPower) - Math.abs(b.power - myPower));
        const finalRivals = rivalResults.slice(0, 3);
        
        // 검색된 라이벌 캐싱 (하루 동안 유지)
        sessionStorage.setItem(rivalCacheKey, JSON.stringify(finalRivals));
        renderRivalsHtml(finalRivals, rivalContainer);

    } catch (e) {
        rivalContainer.innerHTML = `<div style="text-align:center; width:100%; padding:15px; color:#ff4d4d;">데이터를 가져오는 중 오류가 발생했습니다.</div>`;
    } finally {
        isFindingRivals = false;
    }
}

// 렌더링 헬퍼 함수
function renderRivalsHtml(rivals, container) {
    container.innerHTML = rivals.map(user => `
        <button type="button" onclick="document.getElementById('scanner_target_name').value='${user.name}'; startComparison();" 
                style="background: white; border: 2px solid #6c5ce7; padding: 10px 18px; border-radius: 25px; color: #6c5ce7; font-weight: 800; cursor: pointer; transition: 0.2s; box-shadow: 0 4px 6px rgba(108, 92, 231, 0.1);">
            🔥 ${user.name} (${Math.floor(user.power / 10000).toLocaleString()}만)
        </button>
    `).join('');
}

// 📊 [스캐너 탭] 라이벌 전투력 비교 + AI 보스 셋팅 자동 추적 엔진 (감점제 도입)
async function startComparison() {
    if (isComparing) return;
    const targetName = document.getElementById('scanner_target_name')?.value.trim();
    if (!targetName) return showAlert("❌ 비교할 유저의 이름을 입력해주세요!");

    isComparing = true;
    if (typeof toggleLoading === 'function') toggleLoading(true, `${targetName} 님의 셋팅을 AI가 정밀 분석 중입니다...`);

    try {
        const myPowerEl = document.getElementById('res_power_top_val');
        const myPower = myPowerEl ? Number(myPowerEl.innerText.replace(/,/g, '')) : 0;
        const dateStr = new Date().toISOString().split('T')[0];
        const compCacheKey = `omni_comp_detail_${targetName}_${dateStr}`;
        
        let rivalData = JSON.parse(sessionStorage.getItem(compCacheKey));

        // 🧠 [핵심 업그레이드] AI 장비 정밀 스코어링 (사냥템 감점제)
        const analyzePreset = (equipList) => {
            if(!equipList || equipList.length === 0) return { name: "장비 없음", color: "#64748b", bg: "#f1f5f9", border: "#cbd5e1", finalScore: -9999, equipList: [] };
            
            let huntScore = 0; let bossScore = 0;
            
            equipList.forEach(item => {
                // 1. 이름 검사 (정펜 등은 강력한 사냥템)
                if (item.item_name && item.item_name.includes("정령의 펜던트")) huntScore += 50;

                // 2. 잠재옵션 검사
                const pots = [item.potential_option_1, item.potential_option_2, item.potential_option_3, item.additional_potential_option_1, item.additional_potential_option_2, item.additional_potential_option_3].filter(Boolean);
                pots.forEach(opt => {
                    if (opt.includes("드롭률") || opt.includes("메소")) huntScore += 10;
                    if (opt.includes("보스 몬스터") || opt.includes("방어율 무시") || opt.includes("크리티컬 데미지") || opt.includes("공격력") || opt.includes("마력")) bossScore += 5;
                });
            });

            let name = "🛡️ 일반 셋팅"; let color = "#64748b"; let bg = "#f1f5f9"; let border = "#cbd5e1";
            if (huntScore >= 10 && huntScore > bossScore) {
                name = "🏹 사냥 셋팅"; color = "#10b981"; bg = "#d1fae5"; border = "#34d399";
            } else if (bossScore > 0) {
                name = "⚔️ 보스 셋팅"; color = "#ef4444"; bg = "#fee2e2"; border = "#f87171";
            } else if (huntScore === 0) {
                // 아획/메획도 없고 보공도 없는 평범한 스탯템들인 경우
                name = "⚔️ 보스 셋팅 (스탯 위주)"; color = "#f59e0b"; bg = "#fef3c7"; border = "#fbbf24";
            }

            // 🔥 사냥 점수를 깎아내려서, 아무 옵션 없는 깨끗한 보스셋이 1등이 되게 만듦!
            const finalScore = bossScore - (huntScore * 2); 
            return { name, color, bg, border, finalScore, equipList };
        };

        // 1. 라이벌 데이터 가져오기
        if (!rivalData) {
            const headers = { "x-nxopen-api-key": API_KEY };
            const ocidRes = await fetch(`https://open.api.nexon.com/maplestory/v1/id?character_name=${encodeURIComponent(targetName)}`, { headers }).then(r => r.json());
            if (!ocidRes.ocid) throw new Error("NOT_FOUND");

            await new Promise(r => setTimeout(r, 600));
            const targetStat = await fetch(`https://open.api.nexon.com/maplestory/v1/character/stat?ocid=${ocidRes.ocid}`, { headers }).then(r => r.json());
            
            await new Promise(r => setTimeout(r, 600));
            const targetItem = await fetch(`https://open.api.nexon.com/maplestory/v1/character/item-equipment?ocid=${ocidRes.ocid}`, { headers }).then(r => r.json());

            const targetPowerObj = targetStat.final_stat.find(s => s.stat_name === "전투력");
            
            const r1 = analyzePreset(targetItem.item_equipment_preset_1 || targetItem.item_equipment);
            const r2 = analyzePreset(targetItem.item_equipment_preset_2 || []);
            const r3 = analyzePreset(targetItem.item_equipment_preset_3 || []);
            const rivalPresets = [r1, r2, r3].filter(p => p.equipList.length > 0);
            
            // finalScore 내림차순 정렬
            rivalPresets.sort((a, b) => b.finalScore - a.finalScore); 

            rivalData = {
                power: targetPowerObj ? Number(targetPowerObj.stat_value) : 0,
                items: rivalPresets[0] ? rivalPresets[0].equipList : []
            };
            
            if (rivalData.power > 0) sessionStorage.setItem(compCacheKey, JSON.stringify(rivalData));
        }

        // 2. 리포트 출력
        const reportArea = document.getElementById('scanner_report');
        const reportContent = document.getElementById('scanner_report_content');
        if (reportArea && reportContent) {
            reportArea.style.display = 'block';
            const diff = rivalData.power - myPower;
            const diffText = diff > 0 
                ? `<span style="color:#ff4d4d; font-weight:900;">▲ ${diff.toLocaleString()} (라이벌 우세)</span>` 
                : `<span style="color:#4dff4d; font-weight:900;">▼ ${Math.abs(diff).toLocaleString()} (내가 우세)</span>`;
            
            reportContent.innerHTML = `<div style="font-size: 16px;">🎯 <b>${targetName}</b> 님과의 전투력 차이: ${diffText}</div>`;
        }

        // 📦 3. 장비 아이콘 렌더링 도우미 함수
        const renderScannerEquip = (equipList, containerId, tagId) => {
            const container = document.getElementById(containerId);
            const tagEl = document.getElementById(tagId);
            if(!container) return;

            const aiTag = analyzePreset(equipList);
            if(tagEl) {
                tagEl.innerText = aiTag.name;
                tagEl.style.color = aiTag.color;
                tagEl.style.background = aiTag.bg;
                tagEl.style.border = `1px solid ${aiTag.border}`;
            }
            
            const slotOrder = ["반지4", "펜던트2", "모자", "얼굴장식", "뱃지", "반지3", "펜던트", "눈장식", "귀고리", "엠블렘", "반지2", "무기", "상의", "어깨장식", "훈장", "반지1", "벨트", "하의", "장갑", "보조무기", "포켓 아이템", "안드로이드", "신발", "망토", "기계 심장"];
            const borderGradeColor = { "레전드리": "#22c55e", "유니크": "#f59e0b", "에픽": "#a855f7", "레어": "#0ea5e9" };

            let html = "";
            slotOrder.forEach(sName => {
                let item = equipList.find(eq => eq.item_equipment_slot === sName || (sName === "상의" && eq.item_equipment_slot === "한벌옷") || (sName === "펜던트1" && eq.item_equipment_slot === "펜던트") || (sName === "뱃지" && eq.item_equipment_slot === "배지"));
                if (item) { 
                    let bColor = borderGradeColor[item.potential_option_grade] || "#cbd5e1"; 
                    html += `<div style="background:white; border-radius:8px; border:2px solid ${bColor}; display:flex; align-items:center; justify-content:center; aspect-ratio:1/1; box-shadow: 0 2px 5px rgba(0,0,0,0.05);" title="${item.item_name}"><img src="${item.item_icon}" style="max-width:85%; max-height:85%;"></div>`; 
                } 
                else { 
                    html += `<div style="background:#f8fafc; border-radius:8px; border:1px dashed #cbd5e1; aspect-ratio:1/1;"></div>`; 
                }
            });
            container.innerHTML = html;
        };

        // 💡 4. 내 장비 중 감점(아획/메획)이 제일 적은 진짜 보스셋팅을 찾는다!
        const myItemData = window.currentSearchData?.item;
        const m1 = analyzePreset(myItemData?.item_equipment_preset_1 || myItemData?.item_equipment);
        const m2 = analyzePreset(myItemData?.item_equipment_preset_2 || []);
        const m3 = analyzePreset(myItemData?.item_equipment_preset_3 || []);
        
        const myPresets = [m1, m2, m3].filter(p => p.equipList.length > 0);
        myPresets.sort((a, b) => b.finalScore - a.finalScore); // 똑똑해진 점수 기준으로 정렬
        const bestMyPreset = myPresets[0] ? myPresets[0].equipList : [];

        // 화면에 뿌리기
        renderScannerEquip(bestMyPreset, 'scanner_my_grid', 'scanner_my_ai_tag');
        renderScannerEquip(rivalData.items, 'scanner_target_grid', 'scanner_rival_ai_tag');

        showAlert(`✅ 감점제 AI가 최적의 보스 셋팅을 찾아냈습니다!`);
    } catch (e) {
        showAlert("❌ 유저 정보를 불러오지 못했습니다.");
    } finally {
        isComparing = false;
        if (typeof toggleLoading === 'function') toggleLoading(false);
    }
}