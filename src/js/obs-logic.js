// =============================================================
// OBS AUTOMATION LOGIC
// Handles automatic scene switching based on osu! IPC State
// =============================================================

const obs = new OBSWebSocket();
let isOBSAutoMode = true;
let obsCurrentState = null;
let resultsTimeout = null;

// --- CONFIGURATION ---
const OBS_SCENE_MATCH = "MATCH";     
const OBS_SCENE_MAPPOOL = "MAPPOOL"; 

async function connectOBS() {
    try {
        // Fetch config.json safely
        const configReq = await fetch('../config.json');
        if (!configReq.ok) throw new Error("Config.json failed to load.");
        const configData = await configReq.json();

        let wsUrl = configData.obs_ws_url || 'ws://127.0.0.1:4455';
        let wsPwd = configData.obs_ws_pwd || '';

        // Connect automatically to localhost on default port 4455.
        // If your OBS WebSocket has a password, add it as the second argument:
        const { obsWebSocketVersion } = await obs.connect(wsUrl, wsPwd);
        console.log(`[OBS Auto] Connected to OBS WebSocket (v${obsWebSocketVersion}) using config.json credentials.`);
    } catch (error) {
        console.warn(`[OBS Auto] Connection failed (${error.message}). Retrying in 5s...`);
        setTimeout(connectOBS, 5000);
    }
}

// Robust reconnection
obs.on('ConnectionClosed', () => {
    console.warn('[OBS Auto] Connection closed, retrying in 5s...');
    setTimeout(connectOBS, 5000);
});

async function switchScene(sceneName) {
    if (!isOBSAutoMode) {
        console.log(`[OBS Auto] (MANUAL MODE) Ignored switch to scene: ${sceneName}`);
        return;
    }
    try {
        await obs.call('SetCurrentProgramScene', { sceneName });
        console.log(`[OBS Auto] ---> ACTION: Switched OBS to scene [${sceneName}] <---`);
    } catch (err) {
        console.error(`[OBS Auto] Failed to switch to [${sceneName}]:`, err.message);
    }
}

function handleOsuIpcState(newState) {
    if (newState === obsCurrentState) return;
    obsCurrentState = newState;

    console.log(`[OBS Auto] osu! IPC State changed to: ${newState}`);

    // Clear any pending timeouts if state changes rapidly
    if (resultsTimeout) {
        clearTimeout(resultsTimeout);
        resultsTimeout = null;
    }

    /*
     * IPC STATES (TOSU standard):
     * 0 = Idle / Menu
     * 1 = Multi Lobby
     * 2 = Multi Playing (Loading)
     * 3 = Playing
     * 4 = Results / Ranking Screen
     */
    switch (newState) {
        case 0:
        case 1:
            console.log('[OBS Auto] Lobby/Idle state detected.');
            switchScene(OBS_SCENE_MAPPOOL);
            break;
        case 2:
        case 3:
            console.log('[OBS Auto] Gameplay state detected.');
            switchScene(OBS_SCENE_MATCH);
            break;
        case 4:
            console.log('[OBS Auto] Results screen detected. Waiting 10s...');
            resultsTimeout = setTimeout(() => {
                console.log('[OBS Auto] 10s passed on results. Transitioning to MAPPOOL.');
                switchScene(OBS_SCENE_MAPPOOL); // Change to OBS_SCENE_RESULTS if defined
            }, 10000);
            break;
        default:
            console.log(`[OBS Auto] Unhandled IPC State: ${newState}`);
            break;
    }
}

function toggleAutoMode() {
    isOBSAutoMode = !isOBSAutoMode;
    console.log(`[OBS Auto] Mode changed to: ${isOBSAutoMode ? "AUTO" : "MANUAL"}`);
    return isOBSAutoMode;
}

// Initialize connection automatically when logic loads
connectOBS();
