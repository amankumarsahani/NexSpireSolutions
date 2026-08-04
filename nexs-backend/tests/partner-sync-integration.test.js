/**
 * End-to-end verification of the partner sync subsystem (closes P1).
 *
 * The unit tests in partner-sync-signature.test.js prove the signing scheme in
 * isolation. This one runs the real router against a real database, because the
 * things most likely to be wrong are exactly the things a unit test cannot see:
 * whether the raw body survives the parser chain, whether the mirror upsert and
 * the delete-missing-tenants sweep actually behave, and whether a command really
 * round-trips from queue to ack.
 *
 * Requires a MariaDB/MySQL reachable via DB_* env vars, with migration 064
 * applied. It creates and drops only its own rows.
 *
 *   docker run -d --name wl-mariadb -e MARIADB_ROOT_PASSWORD=verifypass \
 *     -e MARIADB_DATABASE=napnix_verify -p 13306:3306 mariadb:11
 *   mariadb ... < database/migrations/064_partner_instances.sql
 *
 *   DB_HOST=127.0.0.1 DB_PORT=13306 DB_USER=root DB_PASSWORD=verifypass \
 *   DB_NAME=napnix_verify node tests/partner-sync-integration.test.js
 */

const crypto = require('crypto');
const assert = require('assert');
const express = require('express');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'integration-test-master-key';

const { pool } = require('../config/database');
const { encryptSecret } = require('../services/secretStore');
const { _seenNonces } = require('../middleware/verifyInstanceSignature');

const SLUG = `itest-${crypto.randomBytes(4).toString('hex')}`;
const SECRET = crypto.randomBytes(32).toString('hex');

let passed = 0;
let failed = 0;
let server;
let baseUrl;
let instanceId;

async function test(name, fn) {
    try {
        await fn();
        console.log(`  ok   ${name}`);
        passed += 1;
    } catch (error) {
        console.error(`  FAIL ${name}`);
        console.error(`       ${error.message}`);
        failed += 1;
    }
}

/** Sign exactly as the instance worker does. */
function post(payload, { secret = SECRET, slug = SLUG, timestamp, nonce, tamper } = {}) {
    let rawBody = JSON.stringify(payload);
    const ts = String(timestamp ?? Date.now());
    const n = nonce ?? crypto.randomUUID();
    const signature = crypto
        .createHmac('sha256', secret)
        .update(`${ts}.${n}.${rawBody}`, 'utf8')
        .digest('hex');

    // Change the body AFTER signing, to model an attacker rewriting it in flight.
    if (tamper) rawBody = tamper(rawBody);

    return fetch(`${baseUrl}/api/partner-sync/report`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Instance-Id': slug,
            'X-Signature': `sha256=${signature}`,
            'X-Timestamp': ts,
            'X-Nonce': n,
        },
        body: rawBody,
    });
}

const snapshot = (tenants) => ({
    kind: 'snapshot',
    instance: { slug: SLUG, edition: 'whitelabel', git_sha: 'abc1234', base_domain: 'partner.com' },
    health: { uptime_s: 100, db_size_mb: 42, pm2_errored: 0 },
    tenants,
});

async function setup() {
    const app = express();
    app.set('trust proxy', true);
    // Mounted exactly as server.js does: before any global JSON parser.
    app.use('/api/partner-sync', require('../routes/partner-sync.routes'));

    await new Promise((resolve) => {
        server = app.listen(0, '127.0.0.1', resolve);
    });
    baseUrl = `http://127.0.0.1:${server.address().port}`;

    const [result] = await pool.query(
        `INSERT INTO partner_instances (slug, name, base_domain, sync_secret_enc)
         VALUES (?, ?, ?, ?)`,
        [SLUG, 'Integration Test', 'partner.com', encryptSecret(SECRET)]
    );
    instanceId = result.insertId;
}

async function teardown() {
    if (instanceId) {
        await pool.query('DELETE FROM partner_instances WHERE id = ?', [instanceId]);
        // Rejections are logged under whatever slug was presented, including the
        // deliberately-unknown one, so clean by prefix or repeated runs accumulate.
        await pool.query('DELETE FROM partner_sync_log WHERE instance_slug LIKE ?', [`${SLUG}%`]);
    }
    if (server) server.close();
    await pool.end();
}

(async () => {
    console.log('\npartner sync integration\n');
    await setup();

    await test('a signed snapshot is accepted and mirrors its tenants', async () => {
        const res = await post(snapshot([
            { slug: 'alpha', name: 'Alpha Ltd', status: 'active', plan: 'growth', industry: 'ecommerce', users: 4 },
            { slug: 'beta', name: 'Beta Ltd', status: 'suspended', plan: 'starter', industry: 'legal', users: 2 },
        ]));
        assert.strictEqual(res.status, 200);
        const body = await res.json();
        assert.strictEqual(body.ok, true);

        const [rows] = await pool.query(
            'SELECT tenant_slug, status, users FROM partner_tenant_mirror WHERE instance_id = ? ORDER BY tenant_slug',
            [instanceId]
        );
        assert.strictEqual(rows.length, 2);
        assert.strictEqual(rows[0].tenant_slug, 'alpha');
        assert.strictEqual(rows[0].users, 4);
        assert.strictEqual(rows[1].status, 'suspended');
    });

    await test('instance metadata and health are recorded', async () => {
        const [[row]] = await pool.query(
            'SELECT git_sha, edition, last_seen_at, last_full_sync_at, health_json FROM partner_instances WHERE id = ?',
            [instanceId]
        );
        assert.strictEqual(row.git_sha, 'abc1234');
        assert.strictEqual(row.edition, 'whitelabel');
        assert.ok(row.last_seen_at, 'last_seen_at should be set');
        assert.ok(row.last_full_sync_at, 'a snapshot should set last_full_sync_at');
        const health = typeof row.health_json === 'string' ? JSON.parse(row.health_json) : row.health_json;
        assert.strictEqual(health.db_size_mb, 42);
    });

    await test('a repeat snapshot updates rather than duplicates', async () => {
        const res = await post(snapshot([
            { slug: 'alpha', name: 'Alpha Renamed', status: 'active', users: 9 },
            { slug: 'beta', name: 'Beta Ltd', status: 'active', users: 2 },
        ]));
        assert.strictEqual(res.status, 200);

        const [rows] = await pool.query(
            'SELECT tenant_slug, name, users FROM partner_tenant_mirror WHERE instance_id = ? ORDER BY tenant_slug',
            [instanceId]
        );
        assert.strictEqual(rows.length, 2, 'upsert must not duplicate');
        assert.strictEqual(rows[0].name, 'Alpha Renamed');
        assert.strictEqual(rows[0].users, 9);
    });

    await test('a tenant dropped from a snapshot is removed from the mirror', async () => {
        // A snapshot is authoritative. A ghost row here would keep being billed.
        const res = await post(snapshot([
            { slug: 'alpha', name: 'Alpha Renamed', status: 'active', users: 9 },
        ]));
        assert.strictEqual(res.status, 200);

        const [rows] = await pool.query(
            'SELECT tenant_slug FROM partner_tenant_mirror WHERE instance_id = ?',
            [instanceId]
        );
        assert.strictEqual(rows.length, 1);
        assert.strictEqual(rows[0].tenant_slug, 'alpha');
    });

    await test('a tampered body is rejected', async () => {
        const res = await post(snapshot([{ slug: 'alpha', users: 1 }]), {
            tamper: (raw) => raw.replace('"alpha"', '"evil"'),
        });
        assert.strictEqual(res.status, 401);

        const [rows] = await pool.query(
            "SELECT tenant_slug FROM partner_tenant_mirror WHERE instance_id = ? AND tenant_slug = 'evil'",
            [instanceId]
        );
        assert.strictEqual(rows.length, 0, 'tampered payload must not reach the mirror');
    });

    await test('a wrong secret is rejected', async () => {
        const res = await post(snapshot([]), { secret: crypto.randomBytes(32).toString('hex') });
        assert.strictEqual(res.status, 401);
    });

    await test('an unknown instance is rejected', async () => {
        const res = await post(snapshot([]), { slug: `${SLUG}-unknown` });
        assert.strictEqual(res.status, 401);
    });

    await test('a stale timestamp is rejected', async () => {
        const res = await post(snapshot([]), { timestamp: Date.now() - 10 * 60 * 1000 });
        assert.strictEqual(res.status, 401);
    });

    await test('a replayed nonce is rejected', async () => {
        const nonce = crypto.randomUUID();
        const first = await post(snapshot([{ slug: 'alpha', users: 9 }]), { nonce });
        assert.strictEqual(first.status, 200);
        // Same nonce, freshly signed - only the nonce cache can catch this.
        const second = await post(snapshot([{ slug: 'alpha', users: 9 }]), { nonce });
        assert.strictEqual(second.status, 401);
    });

    await test('a queued command is delivered, then acked', async () => {
        const [ins] = await pool.query(
            `INSERT INTO partner_commands (instance_id, command, args) VALUES (?, 'suspend_tenant', ?)`,
            [instanceId, JSON.stringify({ tenant_slug: 'alpha' })]
        );
        const commandId = ins.insertId;

        const res = await post(snapshot([{ slug: 'alpha', users: 9 }]));
        const body = await res.json();
        assert.strictEqual(res.status, 200);
        assert.strictEqual(body.commands.length, 1);
        assert.strictEqual(body.commands[0].id, commandId);
        assert.strictEqual(body.commands[0].command, 'suspend_tenant');
        assert.strictEqual(body.commands[0].args.tenant_slug, 'alpha');

        const [[sent]] = await pool.query('SELECT status FROM partner_commands WHERE id = ?', [commandId]);
        assert.strictEqual(sent.status, 'sent');

        // The instance acks on its next report.
        const ackRes = await post({
            ...snapshot([{ slug: 'alpha', users: 9 }]),
            acks: [{ id: commandId, ok: true, result: 'alpha -> suspended' }],
        });
        assert.strictEqual(ackRes.status, 200);

        const [[acked]] = await pool.query(
            'SELECT status, result, acked_at FROM partner_commands WHERE id = ?', [commandId]
        );
        assert.strictEqual(acked.status, 'acked');
        assert.strictEqual(acked.result, 'alpha -> suspended');
        assert.ok(acked.acked_at);

        await pool.query('DELETE FROM partner_commands WHERE id = ?', [commandId]);
    });

    await test('accepted and rejected reports are both logged', async () => {
        const [[ok]] = await pool.query(
            'SELECT COUNT(*) AS n FROM partner_sync_log WHERE instance_id = ? AND ok = 1', [instanceId]
        );
        assert.ok(ok.n > 0, 'accepted reports should be logged');

        const [[bad]] = await pool.query(
            'SELECT COUNT(*) AS n FROM partner_sync_log WHERE instance_slug = ? AND ok = 0', [SLUG]
        );
        assert.ok(bad.n > 0, 'rejections should be logged for audit');
    });

    await test('an unmeasured usage counter is stored NULL, not zero', async () => {
        // The whole point of P4-01's null handling. A tenant whose database was
        // unreachable during the usage sweep must not arrive as "0 users, 0 emails"
        // and get billed as though that were measured.
        const res = await post(snapshot([
            { slug: 'alpha', name: 'Alpha', status: 'active', users: 9 },   // measured
            { slug: 'gamma', name: 'Gamma', status: 'active' },             // unmeasured
        ]));
        assert.strictEqual(res.status, 200);

        const [rows] = await pool.query(
            'SELECT tenant_slug, users, storage_mb, emails_sent_30d FROM partner_tenant_mirror WHERE instance_id = ? ORDER BY tenant_slug',
            [instanceId]
        );
        const alpha = rows.find((r) => r.tenant_slug === 'alpha');
        const gamma = rows.find((r) => r.tenant_slug === 'gamma');

        assert.strictEqual(alpha.users, 9, 'a measured count is stored');
        assert.strictEqual(gamma.users, null, 'an omitted count must stay NULL');
        assert.strictEqual(gamma.storage_mb, null);
        assert.strictEqual(gamma.emails_sent_30d, null);
    });

    await test('a genuine zero is preserved as zero, not confused with unknown', async () => {
        const res = await post(snapshot([
            { slug: 'alpha', name: 'Alpha', status: 'active', users: 9, emails_sent_30d: 0 },
        ]));
        assert.strictEqual(res.status, 200);
        const [[row]] = await pool.query(
            "SELECT emails_sent_30d FROM partner_tenant_mirror WHERE instance_id = ? AND tenant_slug = 'alpha'",
            [instanceId]
        );
        assert.strictEqual(row.emails_sent_30d, 0, 'a real zero must survive as 0');
    });

    await test('the stale sweep marks a silent instance\'s tenants stale', async () => {
        // The mirror is eventually consistent. Without this an instance that died
        // hours ago still shows its last tenant counts as if they were current,
        // and P4-01 would bill from them.
        await pool.query(
            'UPDATE partner_instances SET last_seen_at = DATE_SUB(NOW(), INTERVAL 90 MINUTE) WHERE id = ?',
            [instanceId]
        );
        await pool.query(
            `UPDATE partner_tenant_mirror m
                JOIN partner_instances i ON i.id = m.instance_id
                SET m.is_stale = 1
              WHERE i.last_seen_at IS NULL
                 OR i.last_seen_at < DATE_SUB(NOW(), INTERVAL 45 MINUTE)`
        );

        const [rows] = await pool.query(
            'SELECT is_stale FROM partner_tenant_mirror WHERE instance_id = ?', [instanceId]
        );
        assert.ok(rows.length > 0);
        assert.ok(rows.every((r) => r.is_stale === 1), 'all mirrored tenants should be stale');
    });

    await test('a fresh report clears the stale flag', async () => {
        const res = await post(snapshot([{ slug: 'alpha', users: 9 }]));
        assert.strictEqual(res.status, 200);
        const [rows] = await pool.query(
            'SELECT is_stale FROM partner_tenant_mirror WHERE instance_id = ?', [instanceId]
        );
        assert.ok(rows.every((r) => r.is_stale === 0), 'reporting again should clear staleness');
    });

    await test('the fleet query reports staleness server-side', async () => {
        // The panel must not compute this from a browser clock.
        const [rows] = await pool.query(`
            SELECT i.slug,
                   (SELECT COUNT(*) FROM partner_tenant_mirror m WHERE m.instance_id = i.id) AS tenants_total,
                   (i.last_seen_at IS NULL
                     OR i.last_seen_at < DATE_SUB(NOW(), INTERVAL 45 MINUTE)) AS is_stale
              FROM partner_instances i WHERE i.id = ?`, [instanceId]);
        assert.strictEqual(rows.length, 1);
        assert.strictEqual(Number(rows[0].is_stale), 0);
        assert.ok(Number(rows[0].tenants_total) >= 1);
    });

    await test('the nonce cache does not grow without bound', async () => {
        // Entries older than the acceptance window are pruned on each request,
        // otherwise a long-lived master would leak memory one report at a time.
        const before = _seenNonces.size;
        for (const [nonce] of _seenNonces) _seenNonces.set(nonce, Date.now() - 60 * 60 * 1000);
        await post(snapshot([{ slug: 'alpha', users: 9 }]));
        assert.ok(_seenNonces.size <= before, `expected pruning, size went ${before} -> ${_seenNonces.size}`);
    });

    await teardown();

    console.log(`\n${passed} passed, ${failed} failed\n`);
    process.exit(failed === 0 ? 0 : 1);
})().catch(async (error) => {
    console.error('\nHarness error:', error.message);
    try { await teardown(); } catch { /* already failing */ }
    process.exit(1);
});
