/**
 * All process for storing data
 */
const fs = require('fs');
const path = require('path');

const STORE_PATH = path.join(__dirname, '../reports.json');

function readStore() {
    if (!fs.existsSync(STORE_PATH)) return [];
    return JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
}

function writeStore(data) {
    fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2));
}

function addReport(item) {
    const store = readStore();
    store.push(item);
    writeStore(store);
}

function getReport(requestId) {
    const store = readStore();
    return store.find(i => i.requestId === requestId);
}

function updateReport(requestId, updates) {
    const store = readStore();
    const item = store.find(i => i.requestId === requestId);
    if (!item) return null;

    Object.assign(item, updates);
    writeStore(store);
    return item;
}

function cleanupOldReports(maxAgeMs = 24 * 60 * 60 * 1000) {
    const now = Date.now();
    const store = readStore().filter(
        r => now - (r.createdAt || now) < maxAgeMs
    );
    writeStore(store);
}

module.exports = {
    addReport,
    getReport,
    updateReport,
    cleanupOldReports,
    readStore
};
