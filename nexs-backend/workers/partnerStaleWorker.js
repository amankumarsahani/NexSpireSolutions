/**
 * Partner Stale Worker (P1-06)
 *
 * Runs on the MASTER. Marks mirrored partner data stale when its instance stops
 * reporting, and alerts on instances that have gone quiet or unhealthy.
 *
 * This exists because the mirror is read-only and eventually consistent: without
 * a staleness marker the panel would keep showing a dead partner's last-known
 * tenant counts as if they were current, and P4-01 would bill from them.
 */

const { pool } = require('../config/database');
const { isFull } = require('../config/edition');
const emailService = require('../services/email.service');
const brand = require('../config/brand');

// An instance reports every 15 minutes. Three missed reports is a real outage
// rather than a slow network or a restart.
const STALE_AFTER_MINUTES = 45;
const DISK_ALERT_PCT = 85;

class PartnerStaleWorker {
    constructor() {
        this.timer = null;
        this.alerted = new Map();
    }

    /** Only alert once per instance per issue until it recovers. */
    shouldAlert(key) {
        if (this.alerted.get(key)) return false;
        this.alerted.set(key, true);
        return true;
    }

    clearAlert(key) {
        this.alerted.delete(key);
    }

    async sweep() {
        try {
            await pool.query(
                `UPDATE partner_tenant_mirror m
                    JOIN partner_instances i ON i.id = m.instance_id
                    SET m.is_stale = 1
                  WHERE i.last_seen_at IS NULL
                     OR i.last_seen_at < DATE_SUB(NOW(), INTERVAL ? MINUTE)`,
                [STALE_AFTER_MINUTES]
            );

            const [instances] = await pool.query(
                `SELECT id, slug, name, contact_email, last_seen_at, health_json, git_sha
                   FROM partner_instances
                  WHERE status = 'active'`
            );

            for (const instance of instances) {
                await this.checkInstance(instance);
            }
        } catch (error) {
            console.error('[PartnerStale] Sweep failed:', error.message);
        }
    }

    async checkInstance(instance) {
        const silentKey = `silent:${instance.id}`;
        const lastSeen = instance.last_seen_at ? new Date(instance.last_seen_at) : null;
        const minutesQuiet = lastSeen
            ? Math.round((Date.now() - lastSeen.getTime()) / 60000)
            : null;

        if (minutesQuiet === null || minutesQuiet > STALE_AFTER_MINUTES) {
            if (this.shouldAlert(silentKey)) {
                await this.alert(
                    `Partner instance "${instance.name}" has gone quiet`,
                    lastSeen
                        ? `No report received for ${minutesQuiet} minutes (last seen ${lastSeen.toISOString()}).`
                        : 'This instance has never reported in.'
                );
            }
        } else {
            this.clearAlert(silentKey);
        }

        let health = instance.health_json;
        if (typeof health === 'string') {
            try { health = JSON.parse(health); } catch { health = null; }
        }
        if (!health) return;

        const diskKey = `disk:${instance.id}`;
        if (Number(health.disk_used_pct) > DISK_ALERT_PCT) {
            if (this.shouldAlert(diskKey)) {
                await this.alert(
                    `Partner instance "${instance.name}" is low on disk`,
                    `Disk is ${health.disk_used_pct}% used.`
                );
            }
        } else {
            this.clearAlert(diskKey);
        }

        const pm2Key = `pm2:${instance.id}`;
        if (Number(health.pm2_errored) > 0) {
            if (this.shouldAlert(pm2Key)) {
                await this.alert(
                    `Partner instance "${instance.name}" has errored tenant processes`,
                    `${health.pm2_errored} tenant process(es) are in an error state.`
                );
            }
        } else {
            this.clearAlert(pm2Key);
        }
    }

    async alert(subject, message) {
        console.warn(`[PartnerStale] ${subject} - ${message}`);
        const to = process.env.PARTNER_ALERT_EMAIL || brand.platformAdminEmail;
        if (!to) return;
        try {
            await emailService.sendEmail({
                to,
                subject,
                html: `<p>${message}</p>`,
            });
        } catch (error) {
            // An alert that cannot be emailed is still on the console; never let
            // the mail path take the sweep down.
            console.error('[PartnerStale] Could not send alert email:', error.message);
        }
    }

    start(intervalMs = 5 * 60 * 1000) {
        // Only the master holds a mirror to sweep.
        if (!isFull) return;
        console.log('[PartnerStale] Starting...');
        this.timer = setInterval(() => this.sweep(), intervalMs);
    }

    stop() {
        if (this.timer) clearInterval(this.timer);
        this.timer = null;
    }
}

module.exports = new PartnerStaleWorker();
