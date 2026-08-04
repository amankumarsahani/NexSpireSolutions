const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { verifyInstanceSignature } = require('../middleware/verifyInstanceSignature');

/**
 * Partner sync receiver (P1-02).
 *
 * Mounted OUTSIDE the auth/isAdmin chain - a partner instance is a machine with
 * no JWT, authenticated purely by HMAC. Because of that it deliberately touches
 * only the four partner_* tables and never trusts a field to name a table, a
 * column, or another instance.
 *
 * Direction is always inbound-to-us. The partner server sits behind a Cloudflare
 * Tunnel with no public inbound, so anything we want it to DO is returned in the
 * response to its own heartbeat rather than pushed to it.
 */

// Cap the payload. A fleet snapshot is small; anything large is either a bug or
// an attempt to exhaust memory before the signature is even checked.
const MAX_PAYLOAD_BYTES = 2 * 1024 * 1024;

/**
 * Capture the raw body for HMAC verification.
 *
 * The signature must cover exactly the bytes that were sent. Verifying a
 * re-serialised object would leave a gap between what was signed and what we act
 * on, so this runs before any JSON parsing and stores the original text.
 */
const rawJson = express.raw({ type: 'application/json', limit: MAX_PAYLOAD_BYTES });

function attachRawBody(req, res, next) {
    if (!Buffer.isBuffer(req.body)) return next();
    req.rawBody = req.body.toString('utf8');
    try {
        req.body = req.rawBody ? JSON.parse(req.rawBody) : {};
    } catch {
        return res.status(400).json({ ok: false, error: 'Malformed JSON' });
    }
    next();
}

const asInt = (v) => {
    const n = Number.parseInt(v, 10);
    return Number.isFinite(n) ? n : 0;
};

/**
 * Usage counters only. Absent stays NULL rather than becoming 0.
 *
 * The instance deliberately omits a counter it could not measure - an unreachable
 * tenant database, a missing table - so coercing that to 0 here would manufacture
 * a measurement that reaches an invoice. NULL means unknown, and the billing
 * rollup must refuse to bill rather than charge for it.
 */
const asUsage = (v) => {
    if (v === null || v === undefined) return null;
    const n = Number.parseInt(v, 10);
    return Number.isFinite(n) ? n : null;
};

/** MySQL DATETIME. Returns null for anything unparseable rather than throwing. */
const asDateTime = (v) => {
    if (!v) return null;
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 19).replace('T', ' ');
};

const asText = (v, max) => (v === null || v === undefined ? null : String(v).slice(0, max));

/**
 * POST /api/partner-sync/report
 *
 * Body: { instance, health, tenants[], totals, acks[] }
 * Returns: { ok, commands[] } - the queue the instance should execute next.
 */
router.post('/report', rawJson, attachRawBody, verifyInstanceSignature, async (req, res) => {
    const instance = req.instance;
    const body = req.body || {};
    const kind = body.kind === 'event' ? 'event' : 'snapshot';
    const tenants = Array.isArray(body.tenants) ? body.tenants : [];

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const meta = body.instance || {};
        const health = body.health || {};

        await connection.query(
            `UPDATE partner_instances
                SET git_sha = ?, app_version = ?, edition = ?, base_domain = ?,
                    health_json = ?, last_seen_at = NOW()
                    ${kind === 'snapshot' ? ', last_full_sync_at = NOW()' : ''}
              WHERE id = ?`,
            [
                asText(meta.git_sha, 40),
                asText(meta.app_version, 40),
                asText(meta.edition, 20),
                asText(meta.base_domain, 255),
                JSON.stringify(health),
                instance.id,
            ]
        );

        for (const t of tenants) {
            if (!t || !t.slug) continue;
            await connection.query(
                `INSERT INTO partner_tenant_mirror
                    (instance_id, tenant_slug, name, status, plan_slug, industry_type,
                     users, storage_mb, emails_sent_30d, api_calls_30d, usage_collected_at,
                     custom_domain_crm, process_status, tenant_created_at, last_active_at,
                     last_synced_at, is_stale)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 0)
                 ON DUPLICATE KEY UPDATE
                    name = VALUES(name), status = VALUES(status),
                    plan_slug = VALUES(plan_slug), industry_type = VALUES(industry_type),
                    users = VALUES(users), storage_mb = VALUES(storage_mb),
                    emails_sent_30d = VALUES(emails_sent_30d),
                    api_calls_30d = VALUES(api_calls_30d),
                    usage_collected_at = VALUES(usage_collected_at),
                    custom_domain_crm = VALUES(custom_domain_crm),
                    process_status = VALUES(process_status),
                    tenant_created_at = VALUES(tenant_created_at),
                    last_active_at = VALUES(last_active_at),
                    last_synced_at = NOW(), is_stale = 0`,
                [
                    instance.id,
                    asText(t.slug, 100),
                    asText(t.name, 255),
                    asText(t.status, 30),
                    asText(t.plan, 50),
                    asText(t.industry, 50),
                    asUsage(t.users),
                    asUsage(t.storage_mb),
                    asUsage(t.emails_sent_30d),
                    asUsage(t.api_calls_30d),
                    asDateTime(t.usage_collected_at),
                    asText(t.custom_domain_crm, 255),
                    asText(t.process_status, 30),
                    asDateTime(t.created_at),
                    asDateTime(t.last_active_at),
                ]
            );
        }

        // A full snapshot is authoritative: a tenant the instance no longer reports
        // has been deleted there, so drop it here rather than leaving a ghost row
        // that would keep being billed.
        if (kind === 'snapshot' && tenants.length > 0) {
            const slugs = tenants.map((t) => t && t.slug).filter(Boolean);
            await connection.query(
                `DELETE FROM partner_tenant_mirror
                  WHERE instance_id = ? AND tenant_slug NOT IN (?)`,
                [instance.id, slugs]
            );
        }

        // Acks for commands we handed out on a previous heartbeat.
        const acks = Array.isArray(body.acks) ? body.acks : [];
        for (const ack of acks) {
            if (!ack || !ack.id) continue;
            await connection.query(
                `UPDATE partner_commands
                    SET status = ?, result = ?, acked_at = NOW()
                  WHERE id = ? AND instance_id = ?`,
                [
                    ack.ok === false ? 'failed' : 'acked',
                    asText(ack.result, 2000),
                    asInt(ack.id),
                    instance.id,
                ]
            );
        }

        await connection.query(
            `INSERT INTO partner_sync_log
                (instance_id, instance_slug, kind, ok, tenants_count, payload_bytes, remote_ip)
             VALUES (?, ?, ?, 1, ?, ?, ?)`,
            [instance.id, instance.slug, kind, tenants.length, req.rawBody.length, req.ip || null]
        );

        // Hand back the pending queue and mark it sent. Commands are idempotent by
        // id, so a heartbeat that is lost in transit simply redelivers.
        const [commands] = await connection.query(
            `SELECT id, command, args FROM partner_commands
              WHERE instance_id = ? AND status IN ('pending', 'sent')
              ORDER BY id ASC LIMIT 50`,
            [instance.id]
        );

        if (commands.length > 0) {
            await connection.query(
                `UPDATE partner_commands SET status = 'sent', sent_at = NOW()
                  WHERE id IN (?) AND status = 'pending'`,
                [commands.map((c) => c.id)]
            );
        }

        await connection.commit();

        res.json({
            ok: true,
            commands: commands.map((c) => ({
                id: c.id,
                command: c.command,
                args: typeof c.args === 'string' ? JSON.parse(c.args || '{}') : c.args || {},
            })),
        });
    } catch (error) {
        await connection.rollback();
        console.error('[PartnerSync] Report failed:', error);
        try {
            await pool.query(
                `INSERT INTO partner_sync_log (instance_id, instance_slug, kind, ok, error, remote_ip)
                 VALUES (?, ?, ?, 0, ?, ?)`,
                [instance.id, instance.slug, kind, String(error.message).slice(0, 2000), req.ip || null]
            );
        } catch { /* logging must not mask the original failure */ }
        res.status(500).json({ ok: false, error: 'Failed to record report' });
    } finally {
        connection.release();
    }
});

module.exports = router;
