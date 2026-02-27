// =============================================================
// CNARG 2026 — WINNER SCENE
// Shows the match winner with avatar, score, and loser info.
// Reads from TOSU WebSocket + Supabase for team data.
// =============================================================

let SUPABASE_URL = "";
let SUPABASE_KEY = "";

const socket = new ReconnectingWebSocket('ws://' + location.host + '/ws');
socket.onopen = () => { };

// DOM
const dom = {
    sideP1: document.getElementById('sideP1'),
    sideP2: document.getElementById('sideP2'),
    winAvatar: document.getElementById('winner-avatar'),
    winName: document.getElementById('winner-name'),
    scoreLeft: document.getElementById('score-left'),
    scoreRight: document.getElementById('score-right'),
    loserName: document.getElementById('loser-name'),
};

let tempLeft = '';
let tempRight = '';
let starsL = 0;
let starsR = 0;
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
    if (!tempLeft || !tempRight) return;

    const bestOf = Math.max(starsL, starsR); // whoever hit the target
    const firstTo = Math.ceil(bestOf); // already is the count

    let winnerName, loserName, winnerSide;

    if (starsL > starsR) {
        winnerName = tempLeft;
        loserName = tempRight;
        winnerSide = 'left';
    } else if (starsR > starsL) {
        winnerName = tempRight;
        loserName = tempLeft;
        winnerSide = 'right';
    } else {
        // Tied — no winner yet
        return;
    }

    hasResolved = true;

    dom.winName.textContent = winnerName;
    dom.winName.style.color = winnerSide === 'left' ? 'var(--p1)' : 'var(--p2)';
    dom.scoreLeft.textContent = starsL;
    dom.scoreRight.textContent = starsR;
    dom.loserName.textContent = loserName;

    // Fetch avatar
    fetchTeam(winnerName).then(t => {
        if (t && t.logo_url) {
            dom.winAvatar.style.backgroundImage = `url('${t.logo_url}')`;
            dom.winAvatar.style.borderColor = winnerSide === 'left' ? 'var(--p1)' : 'var(--p2)';
        }
    });
}

socket.onmessage = async event => {
    const data = JSON.parse(event.data);
    const mgr = data.tourney.manager;

    // Team names
    if (tempLeft !== mgr.teamName.left && mgr.teamName.left) {
        tempLeft = mgr.teamName.left;
        dom.sideP1.textContent = tempLeft;
    }
    if (tempRight !== mgr.teamName.right && mgr.teamName.right) {
        tempRight = mgr.teamName.right;
        dom.sideP2.textContent = tempRight;
    }

    // Stars (match score)
    starsL = mgr.stars.left;
    starsR = mgr.stars.right;
    dom.scoreLeft.textContent = starsL;
    dom.scoreRight.textContent = starsR;

    // Auto-resolve when a player wins
    if (!hasResolved && (starsL > 0 || starsR > 0)) {
        resolveWinner();
    }
};
