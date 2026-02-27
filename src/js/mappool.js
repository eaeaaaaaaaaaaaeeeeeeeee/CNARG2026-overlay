// =============================================================
// CNARG 2026 — MAPPOOL SCENE (v4 — Selected Map + Blackout)
// State Machine: Protect → Ban → Pick, auto-alternating turns.
// =============================================================

// Config Variables
let SUPABASE_URL = "";
let SUPABASE_KEY = "";

// SOCKET /////////////////////////////////////////////////////
const socket = new ReconnectingWebSocket('ws://' + location.host + '/ws');
socket.onopen = () => { };
socket.onclose = e => { };
socket.onerror = e => { };

// CONFIG /////////////////////////////////////////////////////
let STAGE_ID = '';
(async () => {
    try {
        const c = await $.getJSON('../config.json');
        STAGE_ID = c.stage_id;
        SUPABASE_URL = c.supabase_url;
        SUPABASE_KEY = c.supabase_key;
    } catch (e) { console.error('config.json error:', e); }
})();

// DOM REFS ///////////////////////////////////////////////////
const dom = {
    // Sidebars
    p1Name: document.getElementById('playerOneName'),
    p2Name: document.getElementById('playerTwoName'),
    p1Pic: document.getElementById('playerOnePic'),
    p1Seed: document.getElementById('playerOneSeed'),
    p1Rank: document.getElementById('playerOneRank'),
    p2Pic: document.getElementById('playerTwoPic'),
    p2Seed: document.getElementById('playerTwoSeed'),
    p2Rank: document.getElementById('playerTwoRank'),

    // Selected Map Preview
    selMapCon: document.getElementById('selectedMapContainer'),
    beatmapImg: document.getElementById('beatmapImage'),
    overlayBlur: document.getElementById('overlay-blur'),
    foreground: document.getElementById('foregroundMap'),
    upcomingTxt: document.getElementById('upcomingText'),
    selectedMap: document.getElementById('selectedMap'),
    mapEl: document.getElementById('map'),
    pickIDEl: document.getElementById('pickID'),
    songEl: document.getElementById('song'),
    mapperEl: document.getElementById('mapper'),
    mapSR: document.getElementById('mapSR'),
    mapOD: document.getElementById('mapOD'),
    mapBPM: document.getElementById('mapBPM'),
    mapLen: document.getElementById('mapLength'),

    // Status text
    pickingTxt: document.getElementById('pickingText'),

    // Chat
    chats: document.getElementById('chats'),

    // Timeout
    screen: document.getElementById('screen'),
    toFloater: document.getElementById('timeoutFloater'),
    toOverlay: document.getElementById('timeoutOverlay'),

    // Mappool grid
    pool: document.getElementById('mappoolContainer'),

    // Hidden refs
    ban1: document.getElementById('banOneContainer'),
    ban2: document.getElementById('banTwoContainer'),
    pick1Con: document.getElementById('pickOneContainer'),
    pick2Con: document.getElementById('pickTwoContainer'),
};

// =============================================================
// GLOBAL STATE
// =============================================================
let tempLeft = '';
let tempRight = '';
let hasSetup = false;

// --- Starting player toggle (Task 3) ---
let startingPlayer = 0; // 0 = P1 starts, 1 = P2 starts

// --- Turn & Phase ---
let currentTurn = 0;        // 0 = P1, 1 = P2
let currentPhase = 'protect'; // 'protect' | 'ban' | 'pick'

// --- Limits: 1 each per team ---
let p1ProtectUsed = false;
let p2ProtectUsed = false;
let p1BanUsed = false;
let p2BanUsed = false;

// --- Pick tracking ---
let currentPick = null;
let picking = true;

// --- Chat ---
let chatLen = 0;

// --- IPC / Scores ---
let previousIPC = null;
let cachedScoreL = 0;
let cachedScoreR = 0;

// --- Timeout ---
let leftIsTimeout = false;
let rightIsTimeout = false;

// --- All card instances ---
const allCards = [];

// =============================================================
// HELPERS
// =============================================================
function tName(t) { return t === 0 ? tempLeft : tempRight; }
function tColor(t) { return t === 0 ? 'var(--p1)' : 'var(--p2)'; }
function tRGB(t) { return t === 0 ? '247, 168, 88' : '88, 156, 237'; }
function formatTime(sec) {
    if (!sec && sec !== 0) return '00:00';
    return String(Math.floor(sec / 60)).padStart(2, '0') + ':' + String(sec % 60).padStart(2, '0');
}

// =============================================================
// localStorage SYNC → MATCH scene
// =============================================================
function broadcastState() {
    try {
        localStorage.setItem('cnarg-pick', JSON.stringify({
            turn: currentTurn,
            currentPlayer: tName(currentTurn),
            currentPick,
            phase: currentPhase,
            ts: Date.now()
        }));
    } catch (_) { }
}

// =============================================================
// PHASE MANAGEMENT
// =============================================================
function advancePhase() {
    if (currentPhase === 'protect' && p1ProtectUsed && p2ProtectUsed) {
        currentPhase = 'ban';
    }
    if (currentPhase === 'ban' && p1BanUsed && p2BanUsed) {
        currentPhase = 'pick';
    }
}

function toggleTurn() {
    currentTurn = currentTurn === 0 ? 1 : 0;
    updateStatusBar();
    broadcastState();
}

function updateStatusBar() {
    const name = tName(currentTurn);
    const verb = currentPhase === 'protect' ? 'protecting'
        : currentPhase === 'ban' ? 'banning'
            : 'picking';
    dom.pickingTxt.textContent = `${name} is ${verb}...`;
    dom.pickingTxt.style.color = tColor(currentTurn);
}

// =============================================================
// SELECTED MAP PREVIEW
// =============================================================
function showSelectedMap(data, ownerTurn) {
    const d = data;
    const coverUrl = `https://assets.ppy.sh/beatmaps/${d.banner_id || ''}/covers/cover.jpg`;

    // Background
    dom.beatmapImg.style.backgroundImage = `url('${coverUrl}')`;
    dom.beatmapImg.style.opacity = '1';

    // Info
    dom.pickIDEl.textContent = `${d.pattern_type}${d.slot}`;
    dom.songEl.textContent = `${d.artist || '?'} - ${d.title || '?'}`;
    dom.mapperEl.textContent = d.mapper ? `MAPSET BY ${d.mapper.toUpperCase()}` : 'MAPSET BY —';
    dom.mapSR.textContent = d.sr ? `SR ${parseFloat(d.sr).toFixed(2)}★` : 'SR —';
    dom.mapOD.textContent = d.od ? `OD ${parseFloat(d.od).toFixed(1)}` : 'OD —';
    dom.mapBPM.textContent = d.bpm ? `BPM ${parseInt(d.bpm)}` : 'BPM —';
    dom.mapLen.textContent = `LENGTH ${formatTime(d.length)}`;

    // Show map details
    dom.selectedMap.style.display = 'block';
    dom.selectedMap.textContent = `${tName(ownerTurn)}'s PICK`;
    dom.selectedMap.style.color = tColor(ownerTurn);
    dom.mapEl.style.display = 'flex';
    dom.upcomingTxt.style.opacity = '0';

    // Show "UPCOMING" after delay
    setTimeout(() => {
        dom.upcomingTxt.textContent = 'UPCOMING MAP';
        dom.upcomingTxt.style.opacity = '1';
    }, 4000);
}

function hideSelectedMap() {
    dom.beatmapImg.style.opacity = '0';
    dom.mapEl.style.display = 'none';
    dom.selectedMap.style.display = 'none';
    dom.upcomingTxt.style.opacity = '0';
}

// =============================================================
// BEATMAP CARD CLASS
// =============================================================
class MapCard {
    constructor(dbMap, idx) {
        this.id = `card${idx}`;
        this.pick = `${dbMap.pattern_type}${dbMap.slot}`;
        this.mods = dbMap.pattern_type;
        this.slot = dbMap.slot;
        this.data = dbMap;
        this.beatmapID = dbMap.beatmap_id;
        this.state = 'available';
        this.owner = null;
    }

    render(parentRow) {
        this.el = document.createElement('div');
        this.el.id = this.id;
        this.el.className = this.mods === 'TB' ? 'clicker tb' : 'clicker';

        // Background image
        this.bgEl = document.createElement('div');
        this.bgEl.className = 'map';
        const coverUrl = `https://assets.ppy.sh/beatmaps/${this.data.banner_id || ''}/covers/cover.jpg`;
        this.bgEl.style.backgroundImage = `url('${coverUrl}')`;

        // Dark overlay
        this.overlayEl = document.createElement('div');
        this.overlayEl.className = 'overlay';

        // Map info
        this.infoEl = document.createElement('div');
        this.infoEl.className = 'mapInfo';
        const title = document.createElement('div');
        title.className = 'mapInfo-title';
        title.textContent = this.data.title || 'Unknown';
        const artist = document.createElement('div');
        artist.className = 'mapInfo-artist';
        artist.textContent = `${this.data.artist || '?'} // ${this.data.mapper || '?'}`;
        this.infoEl.append(title, artist);

        // Mod badge
        this.badgeEl = document.createElement('div');
        this.badgeEl.className = `mod-badge mod-${this.mods}`;
        this.badgeEl.textContent = this.pick;

        // Status overlay
        this.statusEl = document.createElement('div');
        this.statusEl.className = 'pickingStatus';

        this.el.append(this.bgEl, this.overlayEl, this.infoEl, this.badgeEl, this.statusEl);
        parentRow.appendChild(this.el);

        this.el.addEventListener('click', () => this.handleClick());
        this.el.addEventListener('contextmenu', e => { e.preventDefault(); this.handleReset(); });
    }

    // --- LEFT CLICK ---
    handleClick() {
        if (this.state !== 'available') return;
        const t = currentTurn;

        if (currentPhase === 'protect') {
            if (t === 0 && p1ProtectUsed) return;
            if (t === 1 && p2ProtectUsed) return;
            this.state = 'protected';
            this.owner = t;
            if (t === 0) p1ProtectUsed = true; else p2ProtectUsed = true;
            this._vProtect(t);
            advancePhase();
            toggleTurn();
        }
        else if (currentPhase === 'ban') {
            if (t === 0 && p1BanUsed) return;
            if (t === 1 && p2BanUsed) return;
            this.state = 'banned';
            this.owner = t;
            if (t === 0) p1BanUsed = true; else p2BanUsed = true;
            this._vBan(t);
            advancePhase();
            toggleTurn();
        }
        else if (currentPhase === 'pick') {
            this.state = 'picked';
            this.owner = t;
            currentPick = this.pick;
            picking = false;
            this._vPick(t);
            showSelectedMap(this.data, t);
            toggleTurn();
        }
        broadcastState();
    }

    // --- RIGHT CLICK: Reset ---
    handleReset() {
        if (this.state === 'available') return;
        if (this.state === 'protected') {
            if (this.owner === 0) p1ProtectUsed = false; else p2ProtectUsed = false;
        }
        if (this.state === 'banned') {
            if (this.owner === 0) p1BanUsed = false; else p2BanUsed = false;
        }
        if (this.state === 'picked' && currentPick === this.pick) {
            currentPick = null; picking = true;
            hideSelectedMap();
        }
        this.state = 'available';
        this.owner = null;
        this._vReset();

        // Re-evaluate phase
        if (!p1ProtectUsed || !p2ProtectUsed) currentPhase = 'protect';
        else if (!p1BanUsed || !p2BanUsed) currentPhase = 'ban';
        else currentPhase = 'pick';

        updateStatusBar();
        broadcastState();
    }

    // === VISUALS ===
    _vProtect(t) {
        this.el.classList.add('state-protect');
        this.el.style.boxShadow = `0 0 20px rgba(${tRGB(t)}, 0.6), inset 0 0 15px rgba(${tRGB(t)}, 0.1)`;
        this.el.style.borderColor = tColor(t);
        this.statusEl.style.opacity = '1';
        this.statusEl.style.background = `rgba(${tRGB(t)}, 0.15)`;
        this.statusEl.innerHTML = `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="${tColor(t)}" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;
    }

    _vBan(t) {
        this.el.classList.add('state-ban');
        this.bgEl.style.filter = 'blur(4px) grayscale(100%)';
        this.overlayEl.style.background = 'rgba(0,0,0,0.8)';
        this.statusEl.style.opacity = '1';
        this.statusEl.style.background = 'rgba(255,40,40,0.15)';
        this.statusEl.style.borderColor = '#ff4444';
        this.statusEl.innerHTML = `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ff4444" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
    }

    _vPick(t) {
        this.el.classList.add('state-pick');
        this.el.style.borderColor = tColor(t);
        this.el.style.boxShadow = `0 0 12px rgba(${tRGB(t)}, 0.5)`;
        this.statusEl.style.opacity = '1';
        this.statusEl.style.background = `linear-gradient(90deg, transparent, rgba(0,0,0,0.7) 40%, rgba(0,0,0,0.7) 60%, transparent)`;
        this.statusEl.style.borderColor = tColor(t);
        this.statusEl.style.color = tColor(t);
        this.statusEl.textContent = tName(t);
    }

    _vReset() {
        this.el.classList.remove('state-protect', 'state-ban', 'state-pick');
        this.el.style.boxShadow = '';
        this.el.style.borderColor = '';
        this.bgEl.style.filter = 'blur(4px)';
        this.overlayEl.style.background = '';
        this.statusEl.style.opacity = '0';
        this.statusEl.style.background = '';
        this.statusEl.style.borderColor = 'transparent';
        this.statusEl.style.color = '';
        this.statusEl.innerHTML = '';
    }
}

// =============================================================
// SETUP BEATMAPS
// =============================================================
async function setupBeatmaps() {
    hasSetup = true;
    try {
        const res = await axios.get(`${SUPABASE_URL}/rest/v1/mappool_maps`, {
            params: { stage_id: `eq.${STAGE_ID}`, select: '*' },
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
        });

        if (!res.data || !res.data.length) {
            console.warn('No mappool data from Supabase.');
            return;
        }

        const ORDER = { RC: 1, HB: 2, LN: 3, SV: 4, TB: 5 };
        const sorted = res.data.sort((a, b) => {
            const oa = ORDER[a.pattern_type] || 99;
            const ob = ORDER[b.pattern_type] || 99;
            return oa !== ob ? oa - ob : (a.slot || 0) - (b.slot || 0);
        });

        dom.pool.innerHTML = '';
        let curMod = null, curRow = null;

        sorted.forEach((dbMap, i) => {
            if (dbMap.pattern_type !== curMod) {
                curMod = dbMap.pattern_type;
                curRow = document.createElement('div');
                curRow.className = 'mod-row';
                curRow.id = `row-${curMod}`;
                dom.pool.appendChild(curRow);
            }
            const card = new MapCard(dbMap, i);
            card.render(curRow);
            allCards.push(card);
        });

        console.log(`Loaded ${sorted.length} maps.`);
    } catch (e) { console.error('Error fetching mappool:', e); }
}

// =============================================================
// SUPABASE: Team details
// =============================================================
async function setTeamDetails(avatarEl, seedEl, rankEl, name) {
    if (!name) return;
    try {
        const res = await axios.get(`${SUPABASE_URL}/rest/v1/teams`, {
            params: { name: `eq.${name}`, select: '*' },
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
        });
        if (res.data && res.data[0]) {
            const t = res.data[0];
            if (t.logo_url && avatarEl) avatarEl.style.backgroundImage = `url('${t.logo_url}')`;
            if (seedEl) seedEl.textContent = t.seed ? `SEED #${t.seed}` : '';
            if (rankEl) rankEl.textContent = t.rank ? `RANK #${t.rank}` : '';
        }
    } catch (e) { console.error('Team fetch error:', e); }
}

// =============================================================
// CHAT
// =============================================================
function updateChat(chatArray) {
    if (chatLen > chatArray.length) { dom.chats.innerHTML = ''; chatLen = 0; }
    for (let i = chatLen; i < chatArray.length; i++) {
        const msg = chatArray[i];
        const row = document.createElement('div');
        row.className = 'chat-row';
        const time = document.createElement('span');
        time.className = 'chat-time';
        time.textContent = msg.time;
        const name = document.createElement('span');
        name.className = `chat-name team-${msg.team || 'unknown'}`;
        name.textContent = msg.name + ':\u00A0';
        const body = document.createElement('span');
        body.className = 'chat-body';
        body.textContent = msg.messageBody;
        row.append(time, name, body);
        dom.chats.appendChild(row);
    }
    chatLen = chatArray.length;
    dom.chats.scrollTop = dom.chats.scrollHeight;
}

// =============================================================
// TIMEOUT
// =============================================================
function toggleTimeout(side) {
    const isLeft = side === 'left';
    const alreadyOn = isLeft ? leftIsTimeout : rightIsTimeout;
    if (alreadyOn) {
        if (isLeft) leftIsTimeout = false; else rightIsTimeout = false;
        dom.toOverlay.style.opacity = '0';
        dom.toFloater.classList.remove('show');
        setTimeout(() => { dom.screen.style.display = 'none'; }, 700);
    } else {
        if (isLeft) { leftIsTimeout = true; rightIsTimeout = false; }
        else { rightIsTimeout = true; leftIsTimeout = false; }
        dom.screen.style.display = 'flex';
        dom.toFloater.textContent = `TIMEOUT — ${isLeft ? tempLeft : tempRight}`;
        dom.toFloater.style.borderColor = isLeft ? 'var(--p1)' : 'var(--p2)';
        setTimeout(() => { dom.toOverlay.style.opacity = '1'; dom.toFloater.classList.add('show'); }, 100);
    }
}

// =============================================================
// AUTO-SYNC: Check if current beatmap matches a picked card
// =============================================================
function autoSyncBeatmap(beatmapId) {
    if (!beatmapId) return;
    const matched = allCards.find(c => c.beatmapID == beatmapId && c.state === 'picked');
    if (matched) {
        showSelectedMap(matched.data, matched.owner);
    }
}

// =============================================================
// CONTROL PANEL
// =============================================================
document.getElementById('protectButton').addEventListener('click', () => {
    currentPhase = 'protect'; updateStatusBar();
});
document.getElementById('banButton').addEventListener('click', () => {
    currentPhase = 'ban'; updateStatusBar();
});
document.getElementById('pickButton').addEventListener('click', () => {
    currentPhase = 'pick'; updateStatusBar();
});
document.getElementById('playerOneButton').addEventListener('click', () => {
    currentTurn = 0; updateStatusBar(); broadcastState();
});
document.getElementById('playerTwoButton').addEventListener('click', () => {
    currentTurn = 1; updateStatusBar(); broadcastState();
});
document.getElementById('nextButton').addEventListener('click', () => {
    picking = true;
    hideSelectedMap();
    toggleTurn();
});
document.getElementById('swapStartButton').addEventListener('click', () => {
    startingPlayer = startingPlayer === 0 ? 1 : 0;
    currentTurn = startingPlayer;
    updateStatusBar();
    broadcastState();
    console.log(`Starting player swapped to P${startingPlayer + 1}`);
});

const obsToggleBtn = document.getElementById('obsAutoToggle');
if (obsToggleBtn) {
    obsToggleBtn.addEventListener('click', () => {
        const isAuto = toggleAutoMode();
        obsToggleBtn.textContent = `OBS: ${isAuto ? 'AUTO' : 'MANUAL'}`;
        obsToggleBtn.style.color = isAuto ? '#5af78e' : '#ff4444';
        obsToggleBtn.style.borderColor = isAuto ? '#5af78e' : '#ff4444';
    });
}

document.getElementById('leftTimeout').addEventListener('click', () => toggleTimeout('left'));
document.getElementById('rightTimeout').addEventListener('click', () => toggleTimeout('right'));

// =============================================================
// MAIN WEBSOCKET LOOP
// =============================================================
socket.onmessage = async event => {
    const data = JSON.parse(event.data);
    const mgr = data.tourney.manager;

    // Cache scores
    if (mgr.bools.scoreVisible) {
        cachedScoreL = mgr.gameplay.score.left;
        cachedScoreR = mgr.gameplay.score.right;
    }

    // IPC state change
    if (previousIPC !== mgr.ipcState) {
        previousIPC = mgr.ipcState;

        // Auto OBS Switcher trigger
        if (typeof handleOsuIpcState === 'function') {
            handleOsuIpcState(mgr.ipcState);
        }

        if (mgr.ipcState === 4 && currentPick) {
            document.getElementById('nextButton').click();
        }
    }

    // Team name changes
    if (tempLeft !== mgr.teamName.left && mgr.teamName.left) {
        tempLeft = mgr.teamName.left;
        dom.p1Name.textContent = tempLeft;
        setTeamDetails(dom.p1Pic, dom.p1Seed, dom.p1Rank, tempLeft);
    }
    if (tempRight !== mgr.teamName.right && mgr.teamName.right) {
        tempRight = mgr.teamName.right;
        dom.p2Name.textContent = tempRight;
        setTeamDetails(dom.p2Pic, dom.p2Seed, dom.p2Rank, tempRight);
    }

    // First-time setup
    if (!hasSetup && STAGE_ID) {
        hasSetup = true; // Prevent parallel executions
        setupBeatmaps().then(() => {
            currentTurn = startingPlayer;
            currentPhase = 'protect';
            updateStatusBar();
            broadcastState();
        });
    }

    // Auto-sync: check if the current osu! beatmap matches a picked card
    if (data.menu && data.menu.bm && data.menu.bm.id) {
        autoSyncBeatmap(data.menu.bm.id);
    }

    // Chat
    if (chatLen !== mgr.chat.length) {
        updateChat(mgr.chat);
    }
};