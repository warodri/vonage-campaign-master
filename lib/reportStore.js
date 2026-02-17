/**
 * All process for storing data
 */
const { neru, State } = require('neru-alpha');
const session = neru.getGlobalSession();
const globalState = new State(session);

const REPORTS_HASH = 'reports';

// Add a report
async function addReport(item) {
    await globalState.hset(REPORTS_HASH, {
        [item.requestId]: JSON.stringify(item)
    });
}

// Get a single report
async function getReport(requestId) {
    const data = await globalState.hget(REPORTS_HASH, requestId);
    return data ? JSON.parse(data) : null;
}

// Update a report
async function updateReport(requestId, updates) {
    const existing = await getReport(requestId);
    if (!existing) return null;
    const updated = { ...existing, ...updates };
    await globalState.hset(REPORTS_HASH, {
        [requestId]: JSON.stringify(updated)
    });
    return updated;
}

// Get all reports
async function readStore() {
    const all = await globalState.hgetall(REPORTS_HASH);
    if (!all) return [];
    return Object.values(all).map(v => JSON.parse(v));
}

function writeStore(data) {
    fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2));
}

// Delete old reports (cleanup)
async function deleteReport(requestId) {
    await globalState.hdel(REPORTS_HASH, [requestId]); // Note: hdel takes an array of keys
}

async function cleanupOldReports(maxAgeMs = 24 * 60 * 60 * 1000) {
    const now = Date.now();
    const store = await readStore().filter(
        r => now - (r.createdAt || now) < maxAgeMs
    );
    writeStore(store);
}

module.exports = {
    addReport,
    getReport,
    updateReport,
    cleanupOldReports,
    readStore,
    deleteReport
};
