/**
 * Partner Sync Worker (P1-03)
 *
 * Runs on a PARTNER instance and reports it, plus its tenants, up to the Napnix
 * master. Inactive on the master itself.
 *
 * Push, never pull: a partner server sits behind a Cloudflare Tunnel with no
 * public inbound, so the master cannot reach in. Everything the master wants done
 * comes back in the response to this heartbeat.
 *
 * Failure must never be silent or lossy. Reports that cannot be delivered are
 * spooled to disk and retried with backoff, and nothing here runs on a request
 * path.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { pool } = require('../config/database');
const brand = require('../config/brand');
const { edition } = require('../config/edition');
const tenantUsage = require('../services/tenantUsage.service');

const SPOOL_DIR = path.join(__dirname, '..', '.sync-spool');
// Bound the spool. A master that has been down for days must not fill the disk;
// old snapshots are worthless anyway once a newer one exists.
const SPOOL_MAX_FILES = 200;

// A usage sweep touches every tenant database, so it runs hourly rather than on
// every heartbeat. Between sweeps the last measurement is re-sent with the
// timestamp it was taken at.
const USAGE_MAX_AGE_MS = 60 * 60 * 1000;

class PartnerSyncWorker {
    constructor() {
        this.timer = null;
        this.isRunning = false;
        this.consecutiveFailures = 0;
        this.gitSha = null;
        this.usageCache = null;
        this.usageCollectedAt = 0;
    }

    get enabled() {
        return Boolean(process.env.PARTNER_SYNC_URL && process.env.PARTNER_SYNC_SECRET && process.env.PARTNER_SLUG);
    }

    getGitSha() {
        if (this.gitSha !== null) return this.gitSha;
        try {
            this.gitSha = execSync('git rev-parse --short HEAD', {
                cwd: path.join(__dirname, '..'),
                stdio: ['ignore', 'pipe', 'ignore'],
            }).toString().trim();
        } catch {
            this.gitSha = process.env.APP_GIT_SHA || '';
        }
        return this.gitSha;
    }

    /**
     * Usage requires querying every tenant database, so it runs on its own slow
     * cadence rather than on every heartbeat. Between sweeps the last known
     * figures are re-sent, which is honest: they are a measurement with a
     * timestamp, not a live reading.
     */
    async getUsage() {
        const age = Date.now() - this.usageCollectedAt;
        if (this.usageCache && age < USAGE_MAX_AGE_MS) return this.usageCache;

        try {
            this.usageCache = await tenantUsage.collectAll();
            this.usageCollectedAt = Date.now();
        } catch (error) {
            console.error('[PartnerSync] Usage sweep failed:', error.message);
            // Keep serving the previous sweep rather than downgrading to nothing.
            if (!this.usageCache) this.usageCache = {};
        }
        return this.usageCache;
    }

    async collectTenants() {
        try {
            const [rows] = await pool.query(`
                SELECT t.slug, t.name, t.status, t.industry_type, t.process_status,
                       t.custom_domain_crm, t.created_at, p.slug AS plan_slug
                  FROM tenants t
                  LEFT JOIN plans p ON p.id = t.plan_id
            `);

            const usage = await this.getUsage();

            return rows.map((r) => {
                // Absent rather than zero when unknown. A zero here would reach an
                // invoice as a real measurement; an absent field cannot.
                const u = usage[r.slug] || {};
                const tenant = {
                    slug: r.slug,
                    name: r.name,
                    status: r.status,
                    plan: r.plan_slug,
                    industry: r.industry_type,
                    process_status: r.process_status,
                    custom_domain_crm: r.custom_domain_crm,
                    created_at: r.created_at,
                };
                if (u.users !== null && u.users !== undefined) tenant.users = u.users;
                if (u.storage_mb !== null && u.storage_mb !== undefined) tenant.storage_mb = u.storage_mb;
                if (u.emails_sent_30d !== null && u.emails_sent_30d !== undefined) {
                    tenant.emails_sent_30d = u.emails_sent_30d;
                }
                tenant.usage_collected_at = this.usageCollectedAt
                    ? new Date(this.usageCollectedAt).toISOString()
                    : null;
                return tenant;
            });
        } catch (error) {
            console.error('[PartnerSync] Failed to collect tenants:', error.message);
            return [];
        }
    }

    async collectHealth() {
        const health = {
            uptime_s: Math.round(process.uptime()),
            mem_used_pct: Math.round((1 - require('os').freemem() / require('os').totalmem()) * 100),
        };

        try {
            const [[row]] = await pool.query(`
                SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024) AS mb
                  FROM information_schema.TABLES WHERE table_schema = DATABASE()
            `);
            health.db_size_mb = row ? Number(row.mb) || 0 : 0;
        } catch { /* health is best-effort; a missing field beats a failed report */ }

        try {
            const [[row]] = await pool.query(
                `SELECT COUNT(*) AS n FROM tenants WHERE process_status = 'error'`
            );
            health.pm2_errored = row ? Number(row.n) || 0 : 0;
        } catch { /* as above */ }

        return health;
    }

    async buildPayload(kind = 'snapshot', extra = {}) {
        const tenants = await this.collectTenants();
        return {
            kind,
            instance: {
                slug: process.env.PARTNER_SLUG,
                edition,
                git_sha: this.getGitSha(),
                app_version: process.env.APP_VERSION || '',
                base_domain: brand.baseDomain,
                reported_at: new Date().toISOString(),
            },
            health: await this.collectHealth(),
            tenants,
            totals: {
                tenants_active: tenants.filter((t) => t.status === 'active').length,
                tenants_suspended: tenants.filter((t) => t.status === 'suspended').length,
            },
            ...extra,
        };
    }

    /**
     * Sign and POST. The timestamp and nonce are inside the signed payload so a
     * captured signature cannot be replayed with a fresh timestamp.
     */
    async send(payload) {
        const rawBody = JSON.stringify(payload);
        const timestamp = Date.now().toString();
        const nonce = crypto.randomUUID();
        const signature = crypto
            .createHmac('sha256', process.env.PARTNER_SYNC_SECRET)
            .update(`${timestamp}.${nonce}.${rawBody}`, 'utf8')
            .digest('hex');

        const response = await fetch(process.env.PARTNER_SYNC_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Instance-Id': process.env.PARTNER_SLUG,
                'X-Signature': `sha256=${signature}`,
                'X-Timestamp': timestamp,
                'X-Nonce': nonce,
            },
            body: rawBody,
        });

        if (!response.ok) {
            throw new Error(`Master returned ${response.status}`);
        }
        return response.json();
    }

    spool(payload) {
        try {
            fs.mkdirSync(SPOOL_DIR, { recursive: true });
            const files = fs.readdirSync(SPOOL_DIR).sort();
            // Drop the oldest first: a stale snapshot is superseded by any newer one.
            while (files.length >= SPOOL_MAX_FILES) {
                fs.unlinkSync(path.join(SPOOL_DIR, files.shift()));
            }
            const name = `${Date.now()}-${crypto.randomUUID()}.json`;
            fs.writeFileSync(path.join(SPOOL_DIR, name), JSON.stringify(payload));
        } catch (error) {
            console.error('[PartnerSync] Failed to spool report:', error.message);
        }
    }

    async flushSpool() {
        let files;
        try {
            files = fs.readdirSync(SPOOL_DIR).sort();
        } catch {
            return; // no spool directory yet
        }
        for (const file of files) {
            const full = path.join(SPOOL_DIR, file);
            try {
                const payload = JSON.parse(fs.readFileSync(full, 'utf8'));
                await this.send(payload);
                fs.unlinkSync(full);
            } catch {
                // Master still unreachable. Stop here so ordering is preserved and
                // we do not hammer it once per spooled file.
                return;
            }
        }
    }

    /** Execute commands handed back by the master, then ack on the next report. */
    async runCommands(commands) {
        const acks = [];
        for (const cmd of commands || []) {
            try {
                const result = await this.execute(cmd);
                acks.push({ id: cmd.id, ok: true, result });
            } catch (error) {
                acks.push({ id: cmd.id, ok: false, result: error.message });
            }
        }
        return acks;
    }

    async execute(cmd) {
        const args = cmd.args || {};
        switch (cmd.command) {
            case 'force_resync':
                return 'resync queued';

            case 'suspend_tenant':
            case 'resume_tenant': {
                if (!args.tenant_slug) throw new Error('tenant_slug required');
                const status = cmd.command === 'suspend_tenant' ? 'suspended' : 'active';
                const [result] = await pool.query(
                    'UPDATE tenants SET status = ? WHERE slug = ?',
                    [status, args.tenant_slug]
                );
                if (result.affectedRows === 0) throw new Error('tenant not found');
                return `${args.tenant_slug} -> ${status}`;
            }

            case 'set_quota':
                // Quota is enforced by the master at provision time; nothing to do
                // locally, but acking keeps the queue moving.
                return 'noted';

            default:
                // Deliberately unimplemented here: run_migrations, rotate_sync_secret
                // and suspend_instance change how this process runs or authenticates
                // and need a supervised path, not an in-process mutation.
                throw new Error(`Command '${cmd.command}' not implemented on this instance`);
        }
    }

    async runOnce(kind = 'snapshot', extra = {}) {
        if (!this.enabled || this.isRunning) return;
        this.isRunning = true;

        let payload;
        try {
            await this.flushSpool();
            // Built once and reused for the spool: rebuilding on the failure path
            // would re-run every collection query at the exact moment the instance
            // is already unhappy, and would spool a payload describing a different
            // moment than the one that failed to send.
            payload = await this.buildPayload(kind, extra);
            const response = await this.send(payload);
            this.consecutiveFailures = 0;

            if (response && Array.isArray(response.commands) && response.commands.length > 0) {
                const acks = await this.runCommands(response.commands);
                if (acks.length > 0) {
                    // Acks ride along with the next report rather than opening a
                    // second connection.
                    this.pendingAcks = acks;
                }
            }
        } catch (error) {
            this.consecutiveFailures += 1;
            console.error(
                `[PartnerSync] Report failed (${this.consecutiveFailures}): ${error.message}`
            );
            if (payload) this.spool(payload);
        } finally {
            this.isRunning = false;
        }
    }

    /** Immediate push for a state change worth knowing about before the next tick. */
    async reportEvent(event) {
        if (!this.enabled) return;
        await this.runOnce('event', { event });
    }

    start(intervalMs = 15 * 60 * 1000) {
        if (!this.enabled) {
            console.log('[PartnerSync] Disabled (PARTNER_SYNC_URL/SECRET/SLUG not set)');
            return;
        }
        console.log(`[PartnerSync] Starting, reporting every ${Math.round(intervalMs / 60000)}m`);

        // Report shortly after boot so a restarted instance shows up quickly,
        // but not so soon that it races the rest of startup.
        setTimeout(() => this.runOnce(), 15000);

        this.timer = setInterval(() => {
            const extra = this.pendingAcks ? { acks: this.pendingAcks } : {};
            this.pendingAcks = null;
            this.runOnce('snapshot', extra);
        }, intervalMs);
    }

    stop() {
        if (this.timer) clearInterval(this.timer);
        this.timer = null;
    }
}

module.exports = new PartnerSyncWorker();
