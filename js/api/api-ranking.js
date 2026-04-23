/**
 * ============================================================================
 * 🏆 MAPLE OMNI - api-ranking.js
 * 메인 홈페이지의 종합 랭킹 조회를 담당하는 모듈
 * ============================================================================
 */

if (typeof isFetchingRanking === 'undefined') {
    window.isFetchingRanking = false;
}

async function fetchRanking() {
    if (window.isFetchingRanking) return;
    const tbody = document.getElementById('rankingBody');
    if (!tbody) return;
    
    window.isFetchingRanking = true;
   // 🏆 [수정] 랭킹 날짜 안정화 (메인 포털용)
    try {
        const now = new Date();
        // 한국 시간 기준 오전 10시 이전이면 데이터가 없을 확률이 커서 2일 전을 봅니다.
        const offset = now.getHours() < 10 ? 2 : 1;
        now.setDate(now.getDate() - offset);
        const dateStr = now.toISOString().split('T')[0];
        
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
        window.isFetchingRanking = false;
    }
}

function renderRankingHtml(top10, dateStr) {
    const tbody = document.getElementById('rankingBody');
    const dateSpan = document.getElementById('rankingDate');
    let html = "";
    top10.forEach((user) => {
        const worldMap = { "스카니아":1, "베라":2, "루나":3, "제니스":4, "크로아":5, "유니온":6, "엘리시움":7, "이노시스":8, "레드":9, "오로라":10, "아케인":11, "노바":12 };
        const worldId = worldMap[user.world_name] || 3;
        html += `<tr><td>${user.ranking}</td><td class="rank-name"><img src="icon/icon_${worldId}.png" class="world-icon" onerror="this.style.display='none'"> <span>${user.character_name}</span></td><td>${user.class_name}</td><td>Lv.${user.character_level}</td></tr>`;
    });
    if(tbody) tbody.innerHTML = html;
    if(dateSpan) dateSpan.innerText = `기준일: ${dateStr}`;
}