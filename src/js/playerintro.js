// =============================================================
// CNARG 2026 — PLAYERINTRO SCENE
// Fetches team data from TOSU + Supabase, fills the intro cards.
// =============================================================

let SUPABASE_URL = "";
let SUPABASE_KEY = "";

const socket = new ReconnectingWebSocket('ws://' + location.host + '/ws');
socket.onopen = async () => {

    // Load optional data files (not critical — don't crash if missing)
    try {
        const bsData = await $.getJSON("../_data/beatmaps.json");
        beatmapSet = bsData;
        beatmaps = bsData.map(b => b.beatmapId);
    } catch (e) { console.warn("beatmaps.json not found (non-critical)"); }

    try {
        const sdData = await $.getJSON("../_data/prism_seed.json");
        seeds = sdData;
    } catch (e) { console.warn("prism_seed.json not found (non-critical)"); }

    try {
        const apData = await $.getJSON("../_data/api.json");
        api = apData[0].api;
    } catch (e) { }
};

// Stage Name Logic (critical — runs independently)
(async () => {
    try {
        const configData = await $.getJSON("../config.json");
        const stageId = configData.stage_id;
        SUPABASE_URL = configData.supabase_url;
        SUPABASE_KEY = configData.supabase_key;

        if (stageId && SUPABASE_URL) {
            const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
            const { data: stageData, error } = await supabaseClient
                .from('stages')
                .select('name')
                .eq('id', stageId)
                .single();
            if (!error && stageData) {
                const stageLabel = document.querySelector(".stage");
                if (stageLabel) stageLabel.textContent = stageData.name;
            }
        }
    } catch (e) { }
})();

// DOM
const dom = {
    sideP1: document.getElementById('sideP1'),
    sideP2: document.getElementById('sideP2'),
    p1Name: document.getElementById('p1-name'),
    p1Seed: document.getElementById('p1-seed'),
    p1Avatar: document.getElementById('p1-avatar'),
    p2Name: document.getElementById('p2-name'),
    p2Seed: document.getElementById('p2-seed'),
    p2Avatar: document.getElementById('p2-avatar'),
    bestOf: document.getElementById('bestOf'),
    round: document.getElementById('roundLabel'),
};

let tempLeft = '';
let tempRight = '';

async function updatePlayer(side, nickname) {
    const titleName = nickname;
    let teamSeed = null;
    let teamLogo = "";
    try {
        if (!SUPABASE_URL) {
            const c = await $.getJSON('../config.json');
            SUPABASE_URL = c.supabase_url;
            SUPABASE_KEY = c.supabase_key;
        }

        const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
            global: {
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                }
            }
        });

        const { data: teamData } = await supabaseClient
            .from('teams')
            .select('seed, logo_url')
            .eq('name', titleName)
            .single();
        if (teamData) {
            teamSeed = teamData.seed;
            teamLogo = teamData.logo_url || "";
        }
    } catch (e) { }

    if (side === 'left') {
        dom.p1Name.textContent = titleName; // Card title stays as Team Name
        dom.p1Seed.textContent = teamSeed != null ? `SEED #${teamSeed}` : '';
        if (teamLogo) dom.p1Avatar.style.backgroundImage = `url('${teamLogo}')`;
        // Side name remains the original nickname (if known) or same as title
        dom.sideP1.textContent = titleName;
    } else {
        dom.p2Name.textContent = titleName; // Card title stays as Team Name
        dom.p2Seed.textContent = teamSeed != null ? `SEED #${teamSeed}` : '';
        if (teamLogo) dom.p2Avatar.style.backgroundImage = `url('${teamLogo}')`;
        dom.sideP2.textContent = titleName;
    }
}

socket.onmessage = async event => {
    const data = JSON.parse(event.data);
    const mgr = data.tourney.manager;

    // Best of
    if (mgr.bestOF) {
        dom.bestOf.textContent = mgr.bestOF;
    }

    // Team names
    if (tempLeft !== mgr.teamName.left && mgr.teamName.left) {
        tempLeft = mgr.teamName.left;
        await updatePlayer('left', tempLeft);
    }
    if (tempRight !== mgr.teamName.right && mgr.teamName.right) {
        tempRight = mgr.teamName.right;
        await updatePlayer('right', tempRight);
    }
};
