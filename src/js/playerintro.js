// CNARG 2026 - Player Intro Scene

let SUPABASE_URL = "";
let SUPABASE_KEY = "";

const socket = new ReconnectingWebSocket(`ws://${location.host}/ws`);
socket.onopen = async () => { };

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

let lastPlayerOneName = '';
let lastPlayerTwoName = '';

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
        dom.p1Name.textContent = titleName;
        dom.p1Seed.textContent = teamSeed != null ? `SEED #${teamSeed}` : '';
        if (teamLogo) dom.p1Avatar.style.backgroundImage = `url('${teamLogo}')`;
        dom.sideP1.textContent = titleName;
    } else {
        dom.p2Name.textContent = titleName;
        dom.p2Seed.textContent = teamSeed != null ? `SEED #${teamSeed}` : '';
        if (teamLogo) dom.p2Avatar.style.backgroundImage = `url('${teamLogo}')`;
        dom.sideP2.textContent = titleName;
    }
}

socket.onmessage = async event => {
    const data = JSON.parse(event.data);
    const manager = data.tourney.manager;

    if (manager.bestOF) {
        dom.bestOf.textContent = manager.bestOF;
    }

    if (lastPlayerOneName !== manager.teamName.left && manager.teamName.left) {
        lastPlayerOneName = manager.teamName.left;
        await updatePlayer('left', lastPlayerOneName);
    }
    if (lastPlayerTwoName !== manager.teamName.right && manager.teamName.right) {
        lastPlayerTwoName = manager.teamName.right;
        await updatePlayer('right', lastPlayerTwoName);
    }
};
