// OBS Automation Logic

const obs = new OBSWebSocket();
let isOBSAutoMode = true;
let lastOsuIpcState = null;
let resultsTimeout = null;

const OBS_SCENE_MATCH = "MATCH";
const OBS_SCENE_MAPPOOL = "MAPPOOL";

async function connectOBS() {
    try {
        const configReq = await fetch('../config.json');
        if (!configReq.ok) throw new Error("Config.json failed to load.");
        const configData = await configReq.json();

        const wsUrl = configData.obs_ws_url || 'ws://127.0.0.1:4455';
        const wsPwd = configData.obs_ws_pwd || '';

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
    if (newState === lastOsuIpcState) return;
    lastOsuIpcState = newState;

    console.log(`[OBS Auto] osu! IPC State changed to: ${newState}`);

    if (resultsTimeout) {
        clearTimeout(resultsTimeout);
        resultsTimeout = null;
    }

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
                switchScene(OBS_SCENE_MAPPOOL);
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
