const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { pool } = require('../config/database');
const { auth, isAdmin } = require('../middleware/auth');
const { encryptSecret } = require('../services/secretStore');
const { buildStatement } = require('../services/partnerBilling.service');

/**
 * Partner administration (P1-04, P1-05).
 *
 * Master-side only. Distinct from partner-sync.routes.js, which is the
 * unauthenticated machine endpoint - this one is behind auth + isAdmin and is
 * what our panel talks to.
 *
 * Note what is absent: nothing here writes into a partner's database. The mirror
 * is read-only, and every action that must take effect on a partner instance is
 * enqueued in partner_commands for that instance to pull on its next heartbeat.
 */

router.use(auth, isAdmin);

/** Never leak the encrypted secret to the client, even to an admin. */
const publicInstance = (row) => {
    const { sync_secret_enc, ...safe } = row;
    return safe;
};

const STALE_AFTER_MINUTES = 45;

// GET /api/partners - fleet overview
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT i.*,
                   (SELECT COUNT(*) FROM partner_tenant_mirror m
                     WHERE m.instance_id = i.id) AS tenants_total,
                   (SELECT COUNT(*) FROM partner_tenant_mirror m
                     WHERE m.instance_id = i.id AND m.status = 'active') AS tenants_active,
                   (SELECT COALESCE(SUM(m.users), 0) FROM partner_tenant_mirror m
                     WHERE m.instance_id = i.id) AS users_total,
                   (i.last_seen_at IS NULL
                     OR i.last_seen_at < DATE_SUB(NOW(), INTERVAL ? MINUTE)) AS is_stale
              FROM partner_instances i
             ORDER BY i.name ASC
        `, [STALE_AFTER_MINUTES]);

        res.json({ success: true, data: rows.map(publicInstance) });
    } catch (error) {
        console.error('List partners error:', error);
        res.status(500).json({ error: 'Failed to fetch partners' });
    }
});

// GET /api/partners/:id - detail, mirrored tenants, recent sync log, command queue
router.get('/:id', async (req, res) => {
    try {
        // Staleness is decided here rather than in the browser: the server owns the
        // clock, and computing it during render is both impure and subject to a
        // skewed client clock.
        const [[instance]] = await pool.query(
            `SELECT *,
                    (last_seen_at IS NULL
                      OR last_seen_at < DATE_SUB(NOW(), INTERVAL ? MINUTE)) AS is_stale
               FROM partner_instances WHERE id = ?`,
            [STALE_AFTER_MINUTES, req.params.id]
        );
        if (!instance) return res.status(404).json({ error: 'Partner not found' });

        const [tenants] = await pool.query(
            `SELECT * FROM partner_tenant_mirror WHERE instance_id = ? ORDER BY name ASC`,
            [instance.id]
        );
        const [logs] = await pool.query(
            `SELECT id, kind, ok, tenants_count, payload_bytes, error, received_at
               FROM partner_sync_log WHERE instance_id = ?
              ORDER BY received_at DESC LIMIT 50`,
            [instance.id]
        );
        const [commands] = await pool.query(
            `SELECT * FROM partner_commands WHERE instance_id = ?
              ORDER BY created_at DESC LIMIT 50`,
            [instance.id]
        );

        res.json({
            success: true,
            data: { instance: publicInstance(instance), tenants, logs, commands },
        });
    } catch (error) {
        console.error('Get partner error:', error);
        res.status(500).json({ error: 'Failed to fetch partner' });
    }
});

// POST /api/partners - register an instance and mint its sync secret
router.post('/', async (req, res) => {
    try {
        const { slug, name, base_domain, admin_url, contact_name, contact_email,
                contact_phone, billing_model, revshare_pct, wholesale_price_monthly,
                tenant_quota, notes } = req.body;

        if (!slug || !name) {
            return res.status(400).json({ error: 'slug and name are required' });
        }
        if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
            return res.status(400).json({ error: 'slug must be lowercase alphanumeric with dashes' });
        }

        const [[existing]] = await pool.query(
            'SELECT id FROM partner_instances WHERE slug = ?', [slug]
        );
        if (existing) return res.status(400).json({ error: 'slug already exists' });

        // Generated here, shown exactly once, stored encrypted. There is no
        // endpoint to read it back - a lost secret is rotated, not recovered.
        const secret = crypto.randomBytes(32).toString('hex');

        const [result] = await pool.query(
            `INSERT INTO partner_instances
                (slug, name, base_domain, admin_url, sync_secret_enc,
                 contact_name, contact_email, contact_phone,
                 billing_model, revshare_pct, wholesale_price_monthly, tenant_quota, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                slug, name, base_domain || null, admin_url || null, encryptSecret(secret),
                contact_name || null, contact_email || null, contact_phone || null,
                billing_model || 'wholesale',
                revshare_pct || null, wholesale_price_monthly || null,
                tenant_quota || 25, notes || null,
            ]
        );

        res.status(201).json({
            success: true,
            data: { id: result.insertId, slug },
            sync_secret: secret,
            warning: 'Store this now. It is encrypted at rest and cannot be read back.',
        });
    } catch (error) {
        console.error('Create partner error:', error);
        res.status(500).json({ error: 'Failed to create partner' });
    }
});

// PUT /api/partners/:id
router.put('/:id', async (req, res) => {
    try {
        const allowed = ['name', 'status', 'base_domain', 'admin_url', 'contact_name',
            'contact_email', 'contact_phone', 'billing_model', 'revshare_pct',
            'wholesale_price_monthly', 'tenant_quota', 'notes'];

        const updates = [];
        const values = [];
        for (const field of allowed) {
            if (req.body[field] !== undefined) {
                updates.push(`${field} = ?`);
                values.push(req.body[field]);
            }
        }
        if (updates.length === 0) {
            return res.status(400).json({ error: 'No updatable fields supplied' });
        }
        values.push(req.params.id);

        await pool.query(
            `UPDATE partner_instances SET ${updates.join(', ')} WHERE id = ?`,
            values
        );
        res.json({ success: true });
    } catch (error) {
        console.error('Update partner error:', error);
        res.status(500).json({ error: 'Failed to update partner' });
    }
});

// POST /api/partners/:id/commands - enqueue work for the instance to pull
router.post('/:id/commands', async (req, res) => {
    try {
        const { command, args } = req.body;
        const VALID = ['suspend_tenant', 'resume_tenant', 'rotate_sync_secret',
            'run_migrations', 'force_resync', 'set_quota', 'suspend_instance'];

        if (!VALID.includes(command)) {
            return res.status(400).json({ error: `command must be one of ${VALID.join(', ')}` });
        }
        if ((command === 'suspend_tenant' || command === 'resume_tenant') && !args?.tenant_slug) {
            return res.status(400).json({ error: 'args.tenant_slug is required for this command' });
        }

        const [[instance]] = await pool.query(
            'SELECT id FROM partner_instances WHERE id = ?', [req.params.id]
        );
        if (!instance) return res.status(404).json({ error: 'Partner not found' });

        const [result] = await pool.query(
            `INSERT INTO partner_commands (instance_id, command, args, created_by)
             VALUES (?, ?, ?, ?)`,
            [instance.id, command, JSON.stringify(args || {}), req.user?.id || null]
        );

        res.status(201).json({
            success: true,
            data: { id: result.insertId },
            message: 'Queued. The instance will pick this up on its next heartbeat.',
        });
    } catch (error) {
        console.error('Queue command error:', error);
        res.status(500).json({ error: 'Failed to queue command' });
    }
});

// GET /api/partners/:id/billing - statement for the current period
router.get('/:id/billing', async (req, res) => {
    try {
        const statement = await buildStatement(req.params.id, {
            periodStart: req.query.start || null,
            periodEnd: req.query.end || null,
        });
        // A statement that cannot be billed is still a 200: it is a valid answer,
        // and the caller must read `billable` and `refusals` rather than treating
        // the absence of an error as permission to invoice.
        res.json({ success: true, data: statement });
    } catch (error) {
        console.error('Partner billing error:', error);
        res.status(500).json({ error: 'Failed to build billing statement' });
    }
});

// POST /api/partners/:id/rotate-secret
router.post('/:id/rotate-secret', async (req, res) => {
    try {
        const [[instance]] = await pool.query(
            'SELECT id FROM partner_instances WHERE id = ?', [req.params.id]
        );
        if (!instance) return res.status(404).json({ error: 'Partner not found' });

        const secret = crypto.randomBytes(32).toString('hex');
        await pool.query(
            'UPDATE partner_instances SET sync_secret_enc = ? WHERE id = ?',
            [encryptSecret(secret), instance.id]
        );

        res.json({
            success: true,
            sync_secret: secret,
            warning: 'The instance stops reporting until PARTNER_SYNC_SECRET is updated there and the process restarts.',
        });
    } catch (error) {
        console.error('Rotate secret error:', error);
        res.status(500).json({ error: 'Failed to rotate secret' });
    }
});

module.exports = router;
