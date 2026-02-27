// =============================================================
// CNARG 2026 — SCHEDULE SCENE
// Fetches match schedule directly using Supabase JS Client.
// =============================================================

let SUPABASE_URL = "";
let SUPABASE_KEY = "";
let supabase = null;

const dom = {
    matchesList: document.getElementById('matches-list'),
    roundLabel: document.getElementById('roundLabel'),
    refreshBtn: document.getElementById('refreshButton')
};

// Global Config
let STAGE_ID = '';

async function init() {
    try {
        const c = await $.getJSON('../config.json');
        STAGE_ID = c.stage_id;
        SUPABASE_URL = c.supabase_url;
        SUPABASE_KEY = c.supabase_key;

        // Initialize Supabase Client dynamically
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

        dom.roundLabel.textContent = `Stage: ${STAGE_ID}`;
        await fetchSchedule();
    } catch (e) { }
}

// 2. Fetch and Render Matches
async function fetchSchedule() {
    dom.matchesList.innerHTML = '<div style="color: grey; text-align: center; margin-top: 20px;">Loading schedule...</div>';

    try {
        // Query matches and join teams
        // Assuming typical foreign keys: team_1_id, team_2_id => teams table
        // Adjust the foreign key references if your schema uses different exact names.
        const { data: matches, error } = await supabase
            .from('matches')
            .select(`
                id,
                match_time,
                status,
                team1:teams!team_1_id(name, logo_url),
                team2:teams!team_2_id(name, logo_url)
            `)
            .eq('stage_id', STAGE_ID)
            .order('match_time', { ascending: true });

        if (error) throw error;

        dom.matchesList.innerHTML = '';

        if (!matches || matches.length === 0) {
            dom.matchesList.innerHTML = '<div style="color: grey; text-align: center; margin-top: 20px;">No matches found for this stage.</div>';
            return;
        }

        matches.forEach(match => {
            renderMatchRow(match);
        });

    } catch (err) {
        dom.matchesList.innerHTML = `<div style="color: #ff4444; text-align: center; margin-top: 20px;">Error Loading: ${err.message}</div>`;
    }
}

// Render a single match row
function renderMatchRow(match) {
    const row = document.createElement('div');
    row.className = 'match-row';

    // Format time (e.g., 2026-10-15T18:00:00Z -> "18:00")
    let timeString = 'TBD';
    if (match.match_time) {
        const d = new Date(match.match_time);
        timeString = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // Status mapping (default logic)
    let stateClass = 'status-upcoming';
    let stateLabel = 'UPCOMING';

    if (match.status) {
        const s = match.status.toLowerCase();
        if (s === 'live' || s === 'playing') {
            stateClass = 'status-live';
            stateLabel = 'LIVE';
        } else if (s === 'completed' || s === 'done') {
            stateClass = 'status-completed';
            stateLabel = 'COMPLETED';
        }
    }

    // Team data safety defaults
    const t1 = match.team1 || { name: 'TBD', logo_url: '' };
    const t2 = match.team2 || { name: 'TBD', logo_url: '' };

    const bg1 = t1.logo_url ? `style="background-image: url('${t1.logo_url}')"` : '';
    const bg2 = t2.logo_url ? `style="background-image: url('${t2.logo_url}')"` : '';

    row.innerHTML = `
        <div class="match-time">${timeString}</div>
        
        <div class="teams-container">
            <!-- Team 1 -->
            <div class="team left">
                <div class="team-logo" ${bg1}></div>
                <div class="team-name">${t1.name}</div>
            </div>

            <!-- VS & Status -->
            <div class="match-middle">
                <div class="status-badge ${stateClass}">${stateLabel}</div>
                <div class="vs">VS</div>
            </div>

            <!-- Team 2 -->
            <div class="team right">
                <div class="team-logo" ${bg2}></div>
                <div class="team-name">${t2.name}</div>
            </div>
        </div>
    `;

    dom.matchesList.appendChild(row);
}

// Refresher button
if (dom.refreshBtn) {
    dom.refreshBtn.addEventListener('click', fetchSchedule);
}

// Start
init();
