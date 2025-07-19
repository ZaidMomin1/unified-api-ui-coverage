// src/tracker.js
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const STORAGE_FILE = path.resolve('./coverage-reports/.coverage-tracker.sqlite');
const reportsDir = path.dirname(STORAGE_FILE);
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}
const DB_FILE = path.resolve('./coverage-reports/coverage-tracker.sqlite');

class CoverageTracker {
    constructor() {
        try {
            this.db = new sqlite3.Database(DB_FILE, (err) => {
                if (err) {
                    console.error('[CoverageTracker] Failed to open DB:', err);
                }
            });
            this.db.serialize(() => {
                this.db.run(`CREATE TABLE IF NOT EXISTS calls (
                    method TEXT,
                    endpoint TEXT,
                    fullUrl TEXT,
                    testName TEXT,
                    ui INTEGER,
                    api INTEGER,
                    count INTEGER,
                    PRIMARY KEY (method, endpoint, fullUrl, testName)
                )`, (err) => {
                    if (err) {
                        console.error('[CoverageTracker] Failed to create table:', err);
                    }
                });
            });
        } catch (e) {
            console.error('[CoverageTracker] Constructor error:', e);
        }
    }

    _load() {
        if (fs.existsSync(STORAGE_FILE)) {
            try {
                const json = JSON.parse(fs.readFileSync(STORAGE_FILE, 'utf-8'));
                json.forEach(item => {
                    this.calls.set(`${item.method} ${item.endpoint}`, item);
                });
            } catch (e) {
                console.error('Error loading tracker state', e);
            }
        }
    }

    _save() {
        // Read existing data from file
        let existing = [];
        if (fs.existsSync(STORAGE_FILE)) {
            try {
                existing = JSON.parse(fs.readFileSync(STORAGE_FILE, 'utf-8'));
            } catch (e) {
                console.error('[CoverageTracker] Error reading existing tracker file:', e);
            }
        }
        // Merge existing with current
        const merged = new Map();
        for (const item of existing) {
            merged.set(`${item.method} ${item.endpoint}`, { ...item });
        }
        for (const [key, value] of this.calls.entries()) {
            if (merged.has(key)) {
                const prev = merged.get(key);
                merged.set(key, {
                    method: value.method,
                    endpoint: value.endpoint,
                    ui: prev.ui || value.ui,
                    api: prev.api || value.api,
                    count: (prev.count || 0) + (value.count || 0)
                });
            } else {
                merged.set(key, { ...value });
            }
        }
        const data = Array.from(merged.values());
        fs.mkdirSync(path.dirname(STORAGE_FILE), { recursive: true });
        fs.writeFileSync(STORAGE_FILE, JSON.stringify(data, null, 2));
        console.log(`[CoverageTracker] _save: wrote ${data.length} entries to ${STORAGE_FILE}`);
    }

    logCall(endpoint, method, source, fullUrl = '', testName = '') {
        const m = method.toUpperCase();
        this.db.serialize(() => {
            this.db.get(
                'SELECT * FROM calls WHERE method = ? AND endpoint = ? AND fullUrl = ? AND testName = ?',
                [m, endpoint, fullUrl, testName],
                (err, row) => {
                    if (err) {
                        console.error('[CoverageTracker] logCall SELECT error:', err);
                        return;
                    }
                    let ui = row ? row.ui : 0;
                    let api = row ? row.api : 0;
                    let count = row ? row.count : 0;
                    if (source === 'ui') ui = 1;
                    if (source === 'api') api = 1;
                    count++;
                    this.db.run(
                        'INSERT OR REPLACE INTO calls (method, endpoint, fullUrl, testName, ui, api, count) VALUES (?, ?, ?, ?, ?, ?, ?)',
                        [m, endpoint, fullUrl, testName, ui, api, count],
                        (err) => {
                            if (err) {
                                console.error('[CoverageTracker] logCall INSERT error:', err);
                            }
                        }
                    );
                }
            );
        });
    }

    clear() {
        this.db.serialize(() => {
            this.db.run('DELETE FROM calls', (err) => {
                if (err) {
                    console.error('[CoverageTracker] clear error:', err);
                }
            });
        });
    }

    getReportData() {
        return new Promise((resolve) => {
            this.db.all('SELECT * FROM calls', (err, rows) => {
                if (err) {
                    console.error('[CoverageTracker] getReportData: DB error', err);
                    resolve([]);
                } else {
                    const data = rows.map(row => ({
                        method: row.method,
                        endpoint: row.endpoint,
                        fullUrl: row.fullUrl,
                        testName: row.testName,
                        ui: !!row.ui,
                        api: !!row.api,
                        count: row.count
                    }));
                    resolve(data);
                }
            });
        });
    }
}

module.exports = new CoverageTracker();
