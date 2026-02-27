// CNARG 2026 - Mappool Scene

let SUPABASE_URL = "";
let SUPABASE_KEY = "";

const socket = new ReconnectingWebSocket(`ws://${location.host}/ws`);
socket.onopen = () => { };
socket.onclose = e => { };
socket.onerror = e => { };

let STAGE_ID = '';
(async () => {
    try {
        const c = await $.getJSON('../config.json');
        STAGE_ID = c.stage_id;
        SUPABASE_URL = c.supabase_url;
        SUPABASE_KEY = c.supabase_key;
    } catch (e) {
        console.error('Failed to load config.json:', e);
    }
})();
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

let lastPlayerOneName = '';
let lastPlayerTwoName = '';
let isSetupComplete = false;

let currentStartingPlayer = 0; // 0 = P1 starts, 1 = P2 starts
let currentTurn = 0;           // 0 = P1, 1 = P2
let currentPhase = 'protect';  // 'protect' | 'ban' | 'pick'

let hasPlayerOneProtected = false;
let hasPlayerTwoProtected = false;
let hasPlayerOneBanned = false;
let hasPlayerTwoBanned = false;

let currentPick = null;
let isPickingPhase = true;

let processedChatLinesCount = 0;

let lastOsuIpcState = null;
let cachedScoreLeft = 0;
let cachedScoreRight = 0;

let isLeftTimeoutActive = false;
let isRightTimeoutActive = false;

const allBeatmapCards = [];

function getTeamNameByTurn(turnIdx) {
    return turnIdx === 0 ? lastPlayerOneName : lastPlayerTwoName;
}

function getTeamColorByTurn(turnIdx) {
    return turnIdx === 0 ? 'var(--p1)' : 'var(--p2)';
}

function getTeamRGBByTurn(turnIdx) {
    return turnIdx === 0 ? '247, 168, 88' : '88, 156, 237';
}

function formatTime(sec) {
    if (!sec && sec !== 0) return '00:00';
    return String(Math.floor(sec / 60)).padStart(2, '0') + ':' + String(sec % 60).padStart(2, '0');
}

function broadcastState() {
    try {
        localStorage.setItem('cnarg-pick', JSON.stringify({
            turn: currentTurn,
            currentPlayer: getTeamNameByTurn(currentTurn),
            currentPick,
            phase: currentPhase,
            ts: Date.now()
        }));
    } catch (_) { }
}

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

    handleClick() {
        if (this.state !== 'available') return;
        const turn = currentTurn;

        if (currentPhase === 'protect') {
            if (turn === 0 && hasPlayerOneProtected) return;
            if (turn === 1 && hasPlayerTwoProtected) return;
            this.state = 'protected';
            this.owner = turn;
            if (turn === 0) hasPlayerOneProtected = true; else hasPlayerTwoProtected = true;
            this._vProtect(turn);
            advancePhase();
            toggleTurn();
        } else if (currentPhase === 'ban') {
            if (turn === 0 && hasPlayerOneBanned) return;
            if (turn === 1 && hasPlayerTwoBanned) return;
            this.state = 'banned';
            this.owner = turn;
            if (turn === 0) hasPlayerOneBanned = true; else hasPlayerTwoBanned = true;
            this._vBan(turn);
            advancePhase();
            toggleTurn();
        } else if (currentPhase === 'pick') {
            this.state = 'picked';
            this.owner = turn;
            currentPick = this.pick;
            isPickingPhase = false;
            this._vPick(turn);
            showSelectedMap(this.data, turn);
            toggleTurn();
        }
        broadcastState();
    }

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

    _vProtect(turn) {
        this.el.classList.add('state-protect');
        this.el.style.boxShadow = `0 0 20px rgba(${getTeamRGBByTurn(turn)}, 0.6), inset 0 0 15px rgba(${getTeamRGBByTurn(turn)}, 0.1)`;
        this.el.style.borderColor = getTeamColorByTurn(turn);
        this.statusEl.style.opacity = '1';
        this.statusEl.style.background = `rgba(${getTeamRGBByTurn(turn)}, 0.15)`;
        this.statusEl.innerHTML = `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="${getTeamColorByTurn(turn)}" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;
    }

    _vBan(turn) {
        this.el.classList.add('state-ban');
        this.bgEl.style.filter = 'blur(4px) grayscale(100%)';
        this.overlayEl.style.background = 'rgba(0,0,0,0.8)';
        this.statusEl.style.opacity = '1';
        this.statusEl.style.background = 'rgba(255,40,40,0.15)';
        this.statusEl.style.borderColor = '#ff4444';
        this.statusEl.innerHTML = `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ff4444" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
    }

    _vPick(turn) {
        this.el.classList.add('state-pick');
        this.el.style.borderColor = getTeamColorByTurn(turn);
        this.el.style.boxShadow = `0 0 12px rgba(${getTeamRGBByTurn(turn)}, 0.5)`;
        this.statusEl.style.opacity = '1';
        this.statusEl.style.background = `linear-gradient(90deg, transparent, rgba(0,0,0,0.7) 40%, rgba(0,0,0,0.7) 60%, transparent)`;
        this.statusEl.style.borderColor = getTeamColorByTurn(turn);
        this.statusEl.style.color = getTeamColorByTurn(turn);
        this.statusEl.textContent = getTeamNameByTurn(turn);
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
    }
}

async function setupBeatmaps() {
    isSetupComplete = true;
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
            allBeatmapCards.push(card);
        });

    } catch (e) {
        console.error('Error fetching mappool:', e);
    }
}

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
    } catch (e) {
        // Ignored fetch error
    }
}

function updateChat(chatArray) {
    if (processedChatLinesCount > chatArray.length) {
        dom.chats.innerHTML = '';
        processedChatLinesCount = 0;
    }
    for (let i = processedChatLinesCount; i < chatArray.length; i++) {
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
    processedChatLinesCount = chatArray.length;
    dom.chats.scrollTop = dom.chats.scrollHeight;
}

function toggleTimeout(side) {
    const isLeft = side === 'left';
    const isAlreadyActive = isLeft ? isLeftTimeoutActive : isRightTimeoutActive;
    if (isAlreadyActive) {
        if (isLeft) isLeftTimeoutActive = false; else isRightTimeoutActive = false;
        dom.toOverlay.style.opacity = '0';
        dom.toFloater.classList.remove('show');
        setTimeout(() => { dom.screen.style.display = 'none'; }, 700);
    } else {
        if (isLeft) { isLeftTimeoutActive = true; isRightTimeoutActive = false; }
        else { isRightTimeoutActive = true; isLeftTimeoutActive = false; }
        dom.screen.style.display = 'flex';
        dom.toFloater.textContent = `TIMEOUT — ${isLeft ? lastPlayerOneName : lastPlayerTwoName}`;
        dom.toFloater.style.borderColor = isLeft ? 'var(--p1)' : 'var(--p2)';
        setTimeout(() => { dom.toOverlay.style.opacity = '1'; dom.toFloater.classList.add('show'); }, 100);
    }
}

function autoSyncBeatmap(beatmapId) {
    if (!beatmapId) return;
    const matched = allBeatmapCards.find(c => c.beatmapID == beatmapId && c.state === 'picked');
    if (matched) {
        showSelectedMap(matched.data, matched.owner);
    }
}

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
    isPickingPhase = true;
    hideSelectedMap();
    toggleTurn();
});
document.getElementById('swapStartButton').addEventListener('click', () => {
    currentStartingPlayer = currentStartingPlayer === 0 ? 1 : 0;
    currentTurn = currentStartingPlayer;
    updateStatusBar();
    broadcastState();
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

socket.onmessage = async event => {
    const data = JSON.parse(event.data);
    const mgr = data.tourney.manager;

    if (mgr.bools.scoreVisible) {
        cachedScoreLeft = mgr.gameplay.score.left;
        cachedScoreRight = mgr.gameplay.score.right;
    }

    if (lastOsuIpcState !== mgr.ipcState) {
        lastOsuIpcState = mgr.ipcState;

        if (typeof handleOsuIpcState === 'function') {
            handleOsuIpcState(mgr.ipcState);
        }

        if (mgr.ipcState === 4 && currentPick) {
            document.getElementById('nextButton').click();
        }
    }

    if (lastPlayerOneName !== mgr.teamName.left && mgr.teamName.left) {
        lastPlayerOneName = mgr.teamName.left;
        dom.p1Name.textContent = lastPlayerOneName;
        setTeamDetails(dom.p1Pic, dom.p1Seed, dom.p1Rank, lastPlayerOneName);
    }
    if (lastPlayerTwoName !== mgr.teamName.right && mgr.teamName.right) {
        lastPlayerTwoName = mgr.teamName.right;
        dom.p2Name.textContent = lastPlayerTwoName;
        setTeamDetails(dom.p2Pic, dom.p2Seed, dom.p2Rank, lastPlayerTwoName);
    }

    if (!isSetupComplete && STAGE_ID) {
        isSetupComplete = true;
        setupBeatmaps().then(() => {
            currentTurn = currentStartingPlayer;
            currentPhase = 'protect';
            updateStatusBar();
            broadcastState();
        });
    }

    if (data.menu && data.menu.bm && data.menu.bm.id) {
        autoSyncBeatmap(data.menu.bm.id);
    }

    if (processedChatLinesCount !== mgr.chat.length) {
        updateChat(mgr.chat);
    }
};