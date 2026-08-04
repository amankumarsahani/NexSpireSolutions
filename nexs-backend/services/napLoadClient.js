// Registers the current full tenant domain->service routing map with every
// configured nap-load instance. Always pushes the COMPLETE table, never an
// incremental diff — a nap-load instance that misses one push (network
// blip, mid-restart) self-corrects on the very next tenant change anywhere
// in the system, with no retry queue or rollback machinery needed here.
// This intentionally never throws — a nap-load push failure must never
// block or fail tenant provisioning/updates/deletes.

const axios = require('axios');
const crypto = require('crypto');
const { pool } = require('../config/database');
const brand = require('../config/brand');

const NAP_LOAD_ADDRESSES = (process.env.NAP_LOAD_ADDRESSES || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

const NEXCRM_DOMAIN = brand.baseDomain;

// Must match nap-load's own hashRoutes() (Go, routes.go) exactly — sorted
// domain keys, "domain=service;" concatenation, SHA256 hex — so the
// confirmation check is comparing like for like.
function computeRoutesHash(routes) {
    const domains = Object.keys(routes).sort();
    let s = '';
    for (const d of domains) {
        s += `${d}=${routes[d]};`;
    }
    return crypto.createHash('sha256').update(s).digest('hex');
}

// Pulls every routable tenant (not paginated — nap-load needs the true
// complete set, not a UI page of it) and maps its API subdomain to its PM2
// process name. Only active/trial tenants are included; suspended/cancelled
// tenants shouldn't receive routed traffic.
async function buildFullRoutesMap() {
    const [rows] = await pool.query(`
        SELECT slug, process_name
        FROM tenants
        WHERE status IN ('active', 'trial')
          AND process_name IS NOT NULL
    `);

    const routes = {};
    for (const row of rows) {
        const domain = `${row.slug}-crm-api.${NEXCRM_DOMAIN}`;
        routes[domain] = row.process_name;
    }
    return routes;
}

async function pushToInstance(address, routes, expectedHash) {
    try {
        const url = `${address.replace(/\/$/, '')}/routes/push`;
        const resp = await axios.post(url, { routes }, { timeout: 5000 });
        if (resp.data && resp.data.hash === expectedHash) {
            console.log(`[napLoadClient] ${address}: synced OK (${resp.data.count} routes)`);
            return true;
        }
        console.warn(`[napLoadClient] ${address}: hash mismatch after push (expected ${expectedHash}, got ${resp.data && resp.data.hash})`);
        return false;
    } catch (err) {
        console.warn(`[napLoadClient] ${address}: push failed: ${err.message}`);
        return false;
    }
}

// Call this after any tenant create/update/delete/status change. Never
// throws — logs and returns per-instance results instead, so a caller can
// choose to inspect them but is never forced to handle a rejection.
async function syncRoutes() {
    if (NAP_LOAD_ADDRESSES.length === 0) {
        return { skipped: true, reason: 'NAP_LOAD_ADDRESSES not configured' };
    }

    try {
        const routes = await buildFullRoutesMap();
        const expectedHash = computeRoutesHash(routes);

        const results = await Promise.all(
            NAP_LOAD_ADDRESSES.map(addr => pushToInstance(addr, routes, expectedHash))
        );

        return {
            skipped: false,
            routeCount: Object.keys(routes).length,
            hash: expectedHash,
            perInstance: NAP_LOAD_ADDRESSES.map((addr, i) => ({ address: addr, ok: results[i] })),
        };
    } catch (err) {
        console.error(`[napLoadClient] syncRoutes failed: ${err.message}`);
        return { skipped: false, error: err.message };
    }
}

module.exports = { syncRoutes, buildFullRoutesMap, computeRoutesHash };
