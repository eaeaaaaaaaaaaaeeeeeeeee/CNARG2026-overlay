// CNARG 2026 - Winner Scene

let SUPABASE_URL = "";
let SUPABASE_KEY = "";

const socket = new ReconnectingWebSocket(`ws://${location.host}/ws`);
socket.onopen = () => { };

const dom = {
    sideP1: document.getElementById('sideP1'),
    sideP2: document.getElementById('sideP2'),
    winAvatar: document.getElementById('winner-avatar'),
    winName: document.getElementById('winner-name'),
    scoreLeft: document.getElementById('score-left'),
    scoreRight: document.getElementById('score-right'),
    loserName: document.getElementById('loser-name'),
};

let lastPlayerOneName = '';
let lastPlayerTwoName = '';
let currentScoreLeft = 0;
let currentScoreRight = 0;
let teamDataCache = {};
let hasResolved = false;

async function fetchTeam(name) {
    if (teamDataCache[name]) return teamDataCache[name];
    try {
        if (!SUPABASE_URL) {
            const c = await $.getJSON('../config.json');
            SUPABASE_URL = c.supabase_url;
            SUPABASE_KEY = c.supabase_key;
        }
        const res = await axios.get(`${SUPABASE_URL}/rest/v1/teams`, {
            params: { name: `eq.${name}`, select: '*' },
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
        });
        if (res.data && res.data[0]) {
            teamDataCache[name] = res.data[0];
            return res.data[0];
        }
    } catch (e) { }
    return null;
}

function resolveWinner() {
    if (hasResolved) return;
    if (!lastPlayerOneName || !lastPlayerTwoName) return;

    let winnerName, loserName, winnerSide;

    if (currentScoreLeft > currentScoreRight) {
        winnerName = lastPlayerOneName;
        loserName = lastPlayerTwoName;
        winnerSide = 'left';
    } else if (currentScoreRight > currentScoreLeft) {
        winnerName = lastPlayerTwoName;
        loserName = lastPlayerOneName;
        winnerSide = 'right';
    } else {
        return; // Tied, no winner yet
    }

    hasResolved = true;

    dom.winName.textContent = winnerName;
    dom.winName.style.color = winnerSide === 'left' ? 'var(--p1)' : 'var(--p2)';
    dom.scoreLeft.textContent = currentScoreLeft;
    dom.scoreRight.textContent = currentScoreRight;
    dom.loserName.textContent = loserName;

    fetchTeam(winnerName).then(team => {
        if (team && team.logo_url) {
            dom.winAvatar.style.backgroundImage = `url('${team.logo_url}')`;
            dom.winAvatar.style.borderColor = winnerSide === 'left' ? 'var(--p1)' : 'var(--p2)';
        }
    });
}

socket.onmessage = async event => {
    const data = JSON.parse(event.data);
    const manager = data.tourney.manager;

    if (lastPlayerOneName !== manager.teamName.left && manager.teamName.left) {
        lastPlayerOneName = manager.teamName.left;
        dom.sideP1.textContent = lastPlayerOneName;
    }
    if (lastPlayerTwoName !== manager.teamName.right && manager.teamName.right) {
        lastPlayerTwoName = manager.teamName.right;
        dom.sideP2.textContent = lastPlayerTwoName;
    }

    currentScoreLeft = manager.stars.left;
    currentScoreRight = manager.stars.right;
    dom.scoreLeft.textContent = currentScoreLeft;
    dom.scoreRight.textContent = currentScoreRight;

    if (!hasResolved && (currentScoreLeft > 0 || currentScoreRight > 0)) {
        resolveWinner();
    }
};
