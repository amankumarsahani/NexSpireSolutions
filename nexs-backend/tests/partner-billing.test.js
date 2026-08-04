/**
 * Billing rollup gate (P4-01).
 *
 * These tests exist for one reason: under-billing is recoverable by rerunning,
 * and billing a partner for usage we never measured is not. So the interesting
 * cases here are all refusals.
 *
 * Requires a database with migrations 064 and 065 applied. See tests/README.md.
 */

const crypto = require('crypto');
const assert = require('assert');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'integration-test-master-key';

const { pool } = require('../config/database');
const { encryptSecret } = require('../services/secretStore');
const { buildStatement } = require('../services/partnerBilling.service');

const SLUG = `btest-${crypto.randomBytes(4).toString('hex')}`;

let passed = 0;
let failed = 0;
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

/** Rebuild the instance and its tenants into a known state for each case. */
async function seed({ lastSeenMinutesAgo = 1, status = 'active', price = 50, model = 'wholesale', tenants = [] }) {
    await pool.query('DELETE FROM partner_tenant_mirror WHERE instance_id = ?', [instanceId]);
    await pool.query(
        `UPDATE partner_instances
            SET last_seen_at = DATE_SUB(NOW(), INTERVAL ? MINUTE),
                status = ?, wholesale_price_monthly = ?, billing_model = ?
          WHERE id = ?`,
        [lastSeenMinutesAgo, status, price, model, instanceId]
    );
    for (const t of tenants) {
        await pool.query(
            `INSERT INTO partner_tenant_mirror
                (instance_id, tenant_slug, name, status, users, storage_mb, emails_sent_30d, last_synced_at, is_stale)
             VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
            [
                instanceId, t.slug, t.slug, t.status || 'active',
                t.users === undefined ? null : t.users,
                t.storage_mb === undefined ? null : t.storage_mb,
                t.emails === undefined ? null : t.emails,
                t.stale ? 1 : 0,
            ]
        );
    }
}

const refusalCodes = (s) => s.refusals.map((r) => r.code);

(async () => {
    console.log('\npartner billing rollup\n');

    const [result] = await pool.query(
        `INSERT INTO partner_instances (slug, name, sync_secret_enc, billing_model, wholesale_price_monthly)
         VALUES (?, ?, ?, 'wholesale', 50)`,
        [SLUG, 'Billing Test', encryptSecret('unused')]
    );
    instanceId = result.insertId;

    await test('a healthy instance with measured usage is billable', async () => {
        await seed({
            tenants: [
                { slug: 'a', users: 5, storage_mb: 100, emails: 20 },
                { slug: 'b', users: 3, storage_mb: 50, emails: 0 },
            ],
        });
        const s = await buildStatement(instanceId);
        assert.strictEqual(s.billable, true, `refusals: ${JSON.stringify(s.refusals)}`);
        assert.strictEqual(s.tenants.active, 2);
        assert.strictEqual(s.line.amount, 100, '2 active tenants at 50');
        assert.strictEqual(s.usage.users, 8);
    });

    await test('a stale instance is NOT billed', async () => {
        // Its numbers are from whenever it last reported, which could be days ago.
        await seed({ lastSeenMinutesAgo: 120, tenants: [{ slug: 'a', users: 5, storage_mb: 1, emails: 0 }] });
        const s = await buildStatement(instanceId);
        assert.strictEqual(s.billable, false);
        assert.ok(refusalCodes(s).includes('instance_stale'), JSON.stringify(refusalCodes(s)));
    });

    await test('an unmeasured user count blocks billing rather than counting as zero', async () => {
        await seed({
            tenants: [
                { slug: 'a', users: 5, storage_mb: 1, emails: 0 },
                { slug: 'b' }, // sweep could not read this tenant's database
            ],
        });
        const s = await buildStatement(instanceId);
        assert.strictEqual(s.billable, false);
        assert.ok(refusalCodes(s).includes('unmeasured_usage'), JSON.stringify(refusalCodes(s)));
        assert.ok(s.refusals.find((r) => r.code === 'unmeasured_usage').detail.includes('b'));
    });

    await test('a suspended instance is not billed', async () => {
        await seed({ status: 'suspended', tenants: [{ slug: 'a', users: 1, storage_mb: 1, emails: 0 }] });
        const s = await buildStatement(instanceId);
        assert.strictEqual(s.billable, false);
        assert.ok(refusalCodes(s).includes('instance_not_active'));
    });

    await test('stale tenant rows block billing', async () => {
        await seed({ tenants: [{ slug: 'a', users: 1, storage_mb: 1, emails: 0, stale: true }] });
        const s = await buildStatement(instanceId);
        assert.strictEqual(s.billable, false);
        assert.ok(refusalCodes(s).includes('stale_tenants'));
    });

    await test('a missing price refuses rather than invoicing zero', async () => {
        await seed({ price: null, tenants: [{ slug: 'a', users: 1, storage_mb: 1, emails: 0 }] });
        const s = await buildStatement(instanceId);
        assert.strictEqual(s.billable, false);
        assert.ok(refusalCodes(s).includes('model_incomplete'));
        assert.strictEqual(s.line.amount, null, 'amount must be null, never 0');
    });

    await test('revshare reports what it still needs instead of guessing', async () => {
        await seed({ model: 'revshare', tenants: [{ slug: 'a', users: 1, storage_mb: 1, emails: 0 }] });
        const s = await buildStatement(instanceId);
        assert.strictEqual(s.billable, false);
        assert.strictEqual(s.line.amount, null);
        assert.ok(s.line.needs, 'should state what is missing');
    });

    await test('flat model bills once regardless of tenant count', async () => {
        await seed({
            model: 'flat', price: 500,
            tenants: [
                { slug: 'a', users: 1, storage_mb: 1, emails: 0 },
                { slug: 'b', users: 2, storage_mb: 1, emails: 0 },
                { slug: 'c', users: 3, storage_mb: 1, emails: 0 },
            ],
        });
        const s = await buildStatement(instanceId);
        assert.strictEqual(s.billable, true, JSON.stringify(s.refusals));
        assert.strictEqual(s.line.amount, 500);
    });

    await test('suspended tenants are excluded from the wholesale count', async () => {
        await seed({
            tenants: [
                { slug: 'a', status: 'active', users: 1, storage_mb: 1, emails: 0 },
                { slug: 'b', status: 'suspended', users: 1, storage_mb: 1, emails: 0 },
            ],
        });
        const s = await buildStatement(instanceId);
        assert.strictEqual(s.tenants.active, 1);
        assert.strictEqual(s.line.amount, 50, 'a suspended tenant must not be charged');
    });

    await test('partial usage is reported as incomplete rather than silently summed', async () => {
        await seed({
            tenants: [
                { slug: 'a', users: 5, storage_mb: 100, emails: 10 },
                { slug: 'b', users: 5, emails: 10 }, // storage unknown
            ],
        });
        const s = await buildStatement(instanceId);
        assert.strictEqual(s.usage.storage_mb, 100, 'sums only what is known');
        assert.ok(s.usage.incomplete_for.includes('b'), 'and says which tenants are incomplete');
    });

    await pool.query('DELETE FROM partner_instances WHERE id = ?', [instanceId]);
    await pool.end();

    console.log(`\n${passed} passed, ${failed} failed\n`);
    process.exit(failed === 0 ? 0 : 1);
})().catch(async (error) => {
    console.error('\nHarness error:', error.message);
    try {
        if (instanceId) await pool.query('DELETE FROM partner_instances WHERE id = ?', [instanceId]);
        await pool.end();
    } catch { /* already failing */ }
    process.exit(1);
});
