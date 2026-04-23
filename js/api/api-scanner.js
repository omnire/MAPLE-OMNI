/**
 * ============================================================================
 * 📡 js/api/scanner.js
 * OMNI 스캐너 기능 (라이벌 탐색 및 전투력/장비 비교)을 담당하는 모듈
 * ============================================================================
 */

if (typeof window.isFindingRivals === 'undefined') {
    window.isFindingRivals = false;
    window.isComparing = false;
}

/**
 * 🔥 현재 조회된 내 캐릭터와 전투력이 비슷한 라이벌을 탐색하는 함수
 */
async function findRealPowerRivals() {
    if (window.isFindingRivals) return; 
    const rivalContainer = document.getElementById('scanner_recommend_list');
    if (!rivalContainer || !window.currentSearchData) return;

    window.isFindingRivals = true;
    try {
        const topPowerEl = document.getElementById('res_power_top_val');
        const myPower = topPowerEl ? Number(topPowerEl.innerText.replace(/,/g, '')) : 0;
        
        if (myPower === 0) throw new Error("전투력 정보가 없습니다.");

        const myName = window.currentSearchData.basic.character_name;
        const myJob = window.currentSearchData.basic.character_class;
        const worldName = window.currentSearchData.basic.world_name || "스카니아";
        
        // 어제 날짜
        const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
        const dateStr = yesterday.toISOString().split('T')[0];

        // 캐시 확인
        const rivalCacheKey = `omni_rivals_${myName}_${dateStr}`;
        const cachedRivals = JSON.parse(sessionStorage.getItem(rivalCacheKey));
        
        if (cachedRivals && cachedRivals.length > 0) {
            renderRivalsHtml(cachedRivals, rivalContainer);
            return;
        }

        rivalContainer.innerHTML = `<div style="text-align:center; width:100%; color:#6c5ce7; font-weight:bold; padding:20px; border:1px dashed #6c5ce7; border-radius:12px; background:#f5f3ff;">📡 주변 순위 라이벌 유저들을 스캐닝 중입니다... (최초 1회만 약 2~3초 소요)</div>`;

        const headers = { "x-nxopen-api-key": API_KEY };
        const rankUrl = `https://open.api.nexon.com/maplestory/v1/ranking/overall?date=${dateStr}&world_name=${encodeURIComponent(worldName)}&class_name=${encodeURIComponent(myJob)}`;
        const rankRes = await fetch(rankUrl, { headers }).then(r => r.json());

        if (!rankRes.ranking || rankRes.ranking.length === 0) {
            rivalContainer.innerHTML = `<div style="text-align:center; width:100%; padding:15px; color:#94a3b8;">주변 유저 데이터가 없습니다.</div>`;
            return;
        }

        // 주변 순위 유저 무작위 4명 추출
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
            await new Promise(r => setTimeout(r, 400)); 
        }

        if (rivalResults.length === 0) {
            rivalContainer.innerHTML = `<div style="text-align:center; width:100%; padding:15px; color:#94a3b8;">비교 가능한 라이벌을 찾지 못했습니다.</div>`;
            return;
        }

        // 전투력 차이가 가장 적은 순서대로 정렬
        rivalResults.sort((a, b) => Math.abs(a.power - myPower) - Math.abs(b.power - myPower));
        const finalRivals = rivalResults.slice(0, 3);
        
        sessionStorage.setItem(rivalCacheKey, JSON.stringify(finalRivals));
        renderRivalsHtml(finalRivals, rivalContainer);

    } catch (e) {
        rivalContainer.innerHTML = `<div style="text-align:center; width:100%; padding:15px; color:#ff4d4d;">데이터를 가져오는 중 오류가 발생했습니다.</div>`;
    } finally {
        window.isFindingRivals = false;
    }
}

function renderRivalsHtml(rivals, container) {
    container.innerHTML = rivals.map(user => `
        <button type="button" onclick="document.getElementById('scanner_target_name').value='${user.name}'; startComparison();" 
                style="background: white; border: 2px solid #6c5ce7; padding: 10px 18px; border-radius: 25px; color: #6c5ce7; font-weight: 800; cursor: pointer; transition: 0.2s; box-shadow: 0 4px 6px rgba(108, 92, 231, 0.1);">
            🔥 ${user.name} (${Math.floor(user.power / 10000).toLocaleString()}만)
        </button>
    `).join('');
}

/**
 * 📊 입력한 유저를 찾아 내 스펙과 비교하는 핵심 엔진
 */
async function startComparison() {
    if (window.isComparing) return;
    const targetName = document.getElementById('scanner_target_name')?.value.trim();
    if (!targetName) return showAlert("❌ 비교할 유저의 이름을 입력해주세요!");

    window.isComparing = true;
    if (typeof toggleLoading === 'function') toggleLoading(true, `${targetName} 님의 셋팅을 AI가 정밀 분석 중입니다...`);

    try {
        const myPowerEl = document.getElementById('res_power_top_val');
        const myPower = myPowerEl ? Number(myPowerEl.innerText.replace(/,/g, '')) : 0;
        const dateStr = new Date().toISOString().split('T')[0];
        const compCacheKey = `omni_comp_detail_${targetName}_${dateStr}`;
        
        let rivalData = JSON.parse(sessionStorage.getItem(compCacheKey));

        // 장비의 잠재능력을 분석하여 '보스용'인지 '사냥용'인지 점수를 매기는 내부 함수
        const analyzePreset = (equipList) => {
            if(!equipList || equipList.length === 0) return { name: "장비 없음", color: "#64748b", bg: "#f1f5f9", border: "#cbd5e1", finalScore: -9999, equipList: [] };
            
            let huntScore = 0; let bossScore = 0;
            
            equipList.forEach(item => {
                if (item.item_name && item.item_name.includes("정령의 펜던트")) huntScore += 50;
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
                name = "⚔️ 보스 셋팅 (스탯 위주)"; color = "#f59e0b"; bg = "#fef3c7"; border = "#fbbf24";
            }

            const finalScore = bossScore - (huntScore * 2); 
            return { name, color, bg, border, finalScore, equipList };
        };

        // 데이터가 없으면 넥슨에서 새로 가져옵니다.
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
            
            rivalPresets.sort((a, b) => b.finalScore - a.finalScore); 

            rivalData = {
                power: targetPowerObj ? Number(targetPowerObj.stat_value) : 0,
                items: rivalPresets[0] ? rivalPresets[0].equipList : []
            };
            
            if (rivalData.power > 0) sessionStorage.setItem(compCacheKey, JSON.stringify(rivalData));
        }

        // 결과창 표시 로직
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

        // 스캐너 하단에 장비 아이콘들을 예쁘게 그려주는 보조 함수
        const renderScannerEquip = (equipList, containerId, tagId) => {
            const container = document.getElementById(containerId);
            const tagEl = document.getElementById(tagId);
            if (!container) return;

            const aiTag = analyzePreset(equipList);
            if (tagEl) {
                tagEl.innerText = aiTag.name;
                tagEl.style.color = aiTag.color;
                tagEl.style.background = aiTag.bg;
                tagEl.style.border = `1px solid ${aiTag.border}`;
            }

            const slotOrder = ["반지4", "펜던트2", "모자", "얼굴장식", "뱃지", "반지3", "펜던트", "눈장식", "귀고리", "엠블렘", "반지2", "무기", "상의", "어깨장식", "훈장", "반지1", "벨트", "하의", "장갑", "보조무기", "포켓 아이템", "안드로이드", "신발", "망토", "기계 심장"];
            const borderGradeColor = { "레전드리": "#22c55e", "유니크": "#f59e0b", "에픽": "#a855f7", "레어": "#0ea5e9" };

            container.style.display = "grid";
            container.style.gridTemplateColumns = "repeat(5, 38px)";
            container.style.gap = "4px 5px";
            container.style.width = "max-content";
            container.style.margin = "0 auto";
            container.innerHTML = ""; 

            slotOrder.forEach(sName => {
                let item = equipList.find(eq => eq.item_equipment_slot === sName || (sName === "상의" && eq.item_equipment_slot === "한벌옷") || (sName === "펜던트1" && eq.item_equipment_slot === "펜던트") || (sName === "뱃지" && eq.item_equipment_slot === "배지"));

                const slot = document.createElement('div'); 
                
                if (item) {
                    let bColor = borderGradeColor[item.potential_option_grade] || "#e2e8f0";
                    slot.className = "scanner-item-slot";
                    slot.style = `width:38px; height:38px; background:white; border-radius:6px; border:1.5px solid ${bColor}; display:flex; align-items:center; justify-content:center; box-shadow: 0 1px 2px rgba(0,0,0,0.05); flex-shrink:0; cursor:pointer;`;
                    slot.innerHTML = `<img src="${item.item_icon}" style="width:28px; height:28px; object-fit:contain;">`;

                    slot.onmouseover = (e) => showOmniTooltip(e, item);
                    slot.onmousemove = (e) => moveOmniTooltip(e);
                    slot.onmouseout = () => hideOmniTooltip();
                } else {
                    slot.style = `width:38px; height:38px; background:#f8fafc; border-radius:6px; border:1px dashed #e2e8f0; flex-shrink:0;`;
                }
                container.appendChild(slot);
            });
        };

        const myItemData = window.currentSearchData?.item;
        const m1 = analyzePreset(myItemData?.item_equipment_preset_1 || myItemData?.item_equipment);
        const m2 = analyzePreset(myItemData?.item_equipment_preset_2 || []);
        const m3 = analyzePreset(myItemData?.item_equipment_preset_3 || []);
        
        const myPresets = [m1, m2, m3].filter(p => p.equipList.length > 0);
        myPresets.sort((a, b) => b.finalScore - a.finalScore); 
        const bestMyPreset = myPresets[0] ? myPresets[0].equipList : [];

        renderScannerEquip(bestMyPreset, 'scanner_my_grid', 'scanner_my_ai_tag');
        renderScannerEquip(rivalData.items, 'scanner_target_grid', 'scanner_rival_ai_tag');

        showAlert(`✅ 감점제 AI가 최적의 보스 셋팅을 찾아냈습니다!`);
    } catch (e) {
        showAlert("❌ 유저 정보를 불러오지 못했습니다.");
    } finally {
        window.isComparing = false;
        if (typeof toggleLoading === 'function') toggleLoading(false);
    }
}