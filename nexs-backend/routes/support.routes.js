/**
 * Support desk — master side.
 *
 * Two audiences under one router (mounted at /api/support):
 *
 *   /ingest/*  — service-to-service. The tenant's nexcrm-backend forwards its staff's
 *                actions here, authenticated with the shared SUPPORT_API_KEY. Every ingest
 *                call is scoped to a tenant_slug and can only touch that tenant's tickets.
 *
 *   /admin/*   — agency support staff (napnix.users) working the inbox from Nexspire-admin.
 *                JWT auth + sales_operator-or-higher (admins, managers, support operators).
 *
 * Tickets and their threads live in the master `napnix` DB, so one inbox spans all tenants.
 */

const express = require('express');
const router = express.Router();
const { query, pool } = require('../config/database');
const { auth, isSalesOperator } = require('../middleware/auth');
const { supportIngestRateLimit } = require('../middleware/rateLimit');
const { isFull } = require('../config/edition');
const { normalizeSlug, deriveSupportSecret, safeEqual } = require('../utils/supportSecret');
const notifier = require('../services/supportNotifier');

const MAX_SUBJECT = 255;
const MAX_MESSAGE = 10000;

const CATEGORIES = ['general', 'billing', 'technical', 'bug', 'feature_request', 'data', 'account'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const STATUSES = ['open', 'in_progress', 'waiting_customer', 'resolved', 'closed'];

// -------------------------------------------------------------- service auth

/**
 * Per-tenant service auth for the tenant CRM.
 *
 * The caller presents `x-tenant-slug` + `x-support-key`, where the key is that tenant's
 * derived secret (HMAC of the master root secret + slug). We re-derive the expected key,
 * compare in constant time, and confirm the slug is a real, live tenant. The verified slug
 * — never a client-supplied body/query value — is what every ingest handler then scopes to,
 * so a caller can only ever touch its own tenant's tickets even if a key leaks.
 */
const serviceAuth = async (req, res, next) => {
    try {
        const slug = normalizeSlug(req.headers['x-tenant-slug']);
        const key = req.headers['x-support-key'];
        if (!slug || !key) {
            return res.status(401).json({ error: 'Missing tenant credentials' });
        }

        let expected;
        try { expected = deriveSupportSecret(slug); }
        catch { return res.status(500).json({ error: 'Support signing secret not configured' }); }

        if (!safeEqual(key, expected)) {
            return res.status(401).json({ error: 'Invalid support credentials' });
        }

        // Key is valid for this slug; confirm it maps to a real tenant.
        const [[tenant]] = await query(
            `SELECT slug, name FROM tenants WHERE slug = ? LIMIT 1`,
            [slug]
        );
        if (!tenant) return res.status(404).json({ error: 'Unknown tenant' });

        req.verifiedSlug = tenant.slug;
        req.verifiedTenantName = tenant.name;
        next();
    } catch (error) {
        console.error('[Support] serviceAuth error:', error.message);
        res.status(500).json({ error: 'Support authentication failed' });
    }
};

const ticketNo = (id) => `TKT-${String(id).padStart(6, '0')}`;

/** Public-facing thread messages hide agency internal notes. */
const visibleMessages = (rows, includeInternal) =>
    rows.filter((m) => includeInternal || !m.is_internal_note);

// ============================================================== INGEST (tenant)

router.use('/ingest', serviceAuth);

/**
 * POST /api/support/ingest/tickets
 * Body: { tenant_name, industry, requester:{id,name,email,role}, subject, category, priority, message }
 * Tenant is taken from the verified credentials, never the body.
 */
router.post('/ingest/tickets', supportIngestRateLimit, async (req, res) => {
    const {
        tenant_name, industry,
        requester = {}, subject, category = 'general', priority = 'medium', message
    } = req.body || {};

    if (!subject || !subject.trim()) return res.status(400).json({ error: 'Subject is required' });
    if (!message || !message.trim()) return res.status(400).json({ error: 'Message is required' });

    const cat = CATEGORIES.includes(category) ? category : 'general';
    const pri = PRIORITIES.includes(priority) ? priority : 'medium';
    const cleanSubject = subject.trim().slice(0, MAX_SUBJECT);
    const cleanMessage = message.trim().slice(0, MAX_MESSAGE);

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const [result] = await conn.query(
            `INSERT INTO support_tickets
                (tenant_slug, tenant_name, industry, requester_user_id, requester_name,
                 requester_email, requester_role, subject, category, priority, status,
                 last_message_at, last_message_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', NOW(), 'tenant')`,
            [req.verifiedSlug, tenant_name || req.verifiedTenantName || null, industry || null,
             requester.id || null, requester.name || null, requester.email || null,
             requester.role || null, cleanSubject, cat, pri]
        );
        const id = result.insertId;
        await conn.query(`UPDATE support_tickets SET ticket_no = ? WHERE id = ?`, [ticketNo(id), id]);
        await conn.query(
            `INSERT INTO support_ticket_messages (ticket_id, author_type, author_id, author_name, body)
             VALUES (?, 'tenant', ?, ?, ?)`,
            [id, requester.id || null, requester.name || null, cleanMessage]
        );
        await conn.commit();

        const [[ticket]] = await conn.query(`SELECT * FROM support_tickets WHERE id = ?`, [id]);
        notifier.notifyNewTicket(ticket, cleanMessage);
        res.status(201).json({ success: true, data: ticket });
    } catch (error) {
        await conn.rollback();
        console.error('[Support] ingest create error:', error);
        res.status(500).json({ error: 'Failed to create ticket' });
    } finally {
        conn.release();
    }
});

/**
 * GET /api/support/ingest/tickets?status=
 * Lists the verified tenant's tickets (newest activity first).
 */
router.get('/ingest/tickets', async (req, res) => {
    const { status } = req.query;
    try {
        const params = [req.verifiedSlug];
        let where = 'WHERE tenant_slug = ?';
        if (status && STATUSES.includes(status)) { where += ' AND status = ?'; params.push(status); }

        const [rows] = await query(
            `SELECT t.*,
                    (SELECT COUNT(*) FROM support_ticket_messages m
                      WHERE m.ticket_id = t.id AND m.is_internal_note = 0) AS message_count
               FROM support_tickets t ${where}
              ORDER BY COALESCE(t.last_message_at, t.created_at) DESC`,
            params
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('[Support] ingest list error:', error);
        res.status(500).json({ error: 'Failed to list tickets' });
    }
});

/**
 * GET /api/support/ingest/tickets/:id
 * Full thread for one ticket — internal agency notes stripped.
 */
router.get('/ingest/tickets/:id', async (req, res) => {
    try {
        const [[ticket]] = await query(
            `SELECT * FROM support_tickets WHERE id = ? AND tenant_slug = ?`,
            [req.params.id, req.verifiedSlug]
        );
        if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
        const [messages] = await query(
            `SELECT * FROM support_ticket_messages WHERE ticket_id = ? ORDER BY created_at ASC`,
            [ticket.id]
        );
        res.json({ success: true, data: { ...ticket, messages: visibleMessages(messages, false) } });
    } catch (error) {
        console.error('[Support] ingest thread error:', error);
        res.status(500).json({ error: 'Failed to load ticket' });
    }
});

/**
 * POST /api/support/ingest/tickets/:id/messages
 * Body: { requester:{id,name}, message }
 * Tenant reply. Reopens a resolved ticket and flips status to waiting on us.
 */
router.post('/ingest/tickets/:id/messages', supportIngestRateLimit, async (req, res) => {
    const { requester = {}, message } = req.body || {};
    if (!message || !message.trim()) return res.status(400).json({ error: 'Message is required' });
    try {
        const [[ticket]] = await query(
            `SELECT * FROM support_tickets WHERE id = ? AND tenant_slug = ?`,
            [req.params.id, req.verifiedSlug]
        );
        if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

        await query(
            `INSERT INTO support_ticket_messages (ticket_id, author_type, author_id, author_name, body)
             VALUES (?, 'tenant', ?, ?, ?)`,
            [ticket.id, requester.id || null, requester.name || null, message.trim().slice(0, MAX_MESSAGE)]
        );
        // A customer reply on a resolved/closed ticket reopens it as in_progress.
        const nextStatus = ['resolved', 'closed'].includes(ticket.status) ? 'in_progress' : ticket.status;
        await query(
            `UPDATE support_tickets
                SET last_message_at = NOW(), last_message_by = 'tenant', status = ?
              WHERE id = ?`,
            [nextStatus, ticket.id]
        );
        notifier.notifyTenantReply({ ...ticket, status: nextStatus }, message.trim());
        res.status(201).json({ success: true });
    } catch (error) {
        console.error('[Support] ingest reply error:', error);
        res.status(500).json({ error: 'Failed to post reply' });
    }
});

// =============================================================== ADMIN (agency)

router.use('/admin', auth, isSalesOperator);

/**
 * GET /api/support/admin/tickets?status=&priority=&tenant_slug=&search=
 * Inbox listing + aggregate counts for the header cards.
 */
router.get('/admin/tickets', async (req, res) => {
    const { status, priority, tenant_slug, search } = req.query;
    try {
        const params = [];
        let where = 'WHERE 1=1';
        if (status && STATUSES.includes(status)) { where += ' AND t.status = ?'; params.push(status); }
        if (priority && PRIORITIES.includes(priority)) { where += ' AND t.priority = ?'; params.push(priority); }
        if (tenant_slug) { where += ' AND t.tenant_slug = ?'; params.push(tenant_slug); }
        if (search) {
            where += ' AND (t.subject LIKE ? OR t.ticket_no LIKE ? OR t.tenant_name LIKE ? OR t.requester_name LIKE ?)';
            const like = `%${search}%`;
            params.push(like, like, like, like);
        }

        const [rows] = await query(
            `SELECT t.*,
                    (SELECT COUNT(*) FROM support_ticket_messages m
                      WHERE m.ticket_id = t.id AND m.is_internal_note = 0) AS message_count
               FROM support_tickets t ${where}
              ORDER BY FIELD(t.priority,'urgent','high','medium','low'),
                       COALESCE(t.last_message_at, t.created_at) DESC`,
            params
        );

        const [[stats]] = await query(
            `SELECT
                COUNT(*) AS total,
                SUM(status = 'open') AS open,
                SUM(status = 'in_progress') AS in_progress,
                SUM(status = 'waiting_customer') AS waiting_customer,
                SUM(status = 'resolved') AS resolved,
                SUM(status = 'closed') AS closed,
                SUM(status NOT IN ('resolved','closed')) AS active
             FROM support_tickets`
        );
        res.json({ success: true, data: rows, stats });
    } catch (error) {
        console.error('[Support] admin list error:', error);
        res.status(500).json({ error: 'Failed to list tickets' });
    }
});

/** GET /api/support/admin/tickets/:id — full thread incl. internal notes. */
router.get('/admin/tickets/:id', async (req, res) => {
    try {
        const [[ticket]] = await query(`SELECT * FROM support_tickets WHERE id = ?`, [req.params.id]);
        if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
        const [messages] = await query(
            `SELECT * FROM support_ticket_messages WHERE ticket_id = ? ORDER BY created_at ASC`,
            [ticket.id]
        );
        res.json({ success: true, data: { ...ticket, messages } });
    } catch (error) {
        console.error('[Support] admin thread error:', error);
        res.status(500).json({ error: 'Failed to load ticket' });
    }
});

/**
 * POST /api/support/admin/tickets/:id/messages
 * Body: { message, internal_note }
 * Agency reply. A public reply moves status to waiting_customer; an internal note leaves it.
 */
router.post('/admin/tickets/:id/messages', async (req, res) => {
    const { message, internal_note = false } = req.body || {};
    if (!message || !message.trim()) return res.status(400).json({ error: 'Message is required' });
    try {
        const [[ticket]] = await query(`SELECT * FROM support_tickets WHERE id = ?`, [req.params.id]);
        if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

        const isNote = internal_note === true || internal_note === 'true';
        await query(
            `INSERT INTO support_ticket_messages
                (ticket_id, author_type, author_id, author_name, body, is_internal_note)
             VALUES (?, 'agency', ?, ?, ?, ?)`,
            [ticket.id, req.user.id || null, req.user.name || 'Support', message.trim(), isNote ? 1 : 0]
        );

        if (!isNote) {
            // Public reply: ball is in the customer's court, and an untouched open ticket
            // becomes in_progress the moment we engage.
            const nextStatus = ticket.status === 'open' ? 'waiting_customer'
                : ['resolved', 'closed'].includes(ticket.status) ? ticket.status
                : 'waiting_customer';
            await query(
                `UPDATE support_tickets SET last_message_at = NOW(), last_message_by = 'agency', status = ? WHERE id = ?`,
                [nextStatus, ticket.id]
            );

            if (ticket.origin === 'partner_escalation' && ticket.partner_instance_id) {
                // An escalated ticket belongs to the partner's customer, not ours.
                // We must not email them directly - that would put our identity in
                // front of a customer who has only ever dealt with the partner, and
                // undo the whitelabel at the worst possible moment. Instead the reply
                // is queued for the partner instance to post under its own identity.
                await query(
                    `INSERT INTO partner_commands (instance_id, command, args, created_by)
                     VALUES (?, 'deliver_support_reply', ?, ?)`,
                    [
                        ticket.partner_instance_id,
                        JSON.stringify({
                            partner_ticket_id: ticket.partner_ticket_id,
                            message: message.trim(),
                            resolve: false,
                        }),
                        req.user.id || null,
                    ]
                );
            } else {
                // Our own tenant: notify them directly as before.
                notifier.notifyAgencyReply({ ...ticket, status: nextStatus }, message.trim());
            }
        }
        res.status(201).json({ success: true });
    } catch (error) {
        console.error('[Support] admin reply error:', error);
        res.status(500).json({ error: 'Failed to post reply' });
    }
});

/**
 * POST /api/support/admin/tickets/:id/escalate
 *
 * Partner-instance only. Hands a ticket up to the platform: it is queued here and
 * travels on the next sync heartbeat, because a partner server has no public
 * inbound for us to call into.
 *
 * The customer is told nothing and sees no change. When a platform reply comes
 * back it is posted into this same thread under the partner's own identity.
 */
router.post('/admin/tickets/:id/escalate', async (req, res) => {
    const { reason } = req.body || {};
    try {
        if (isFull) {
            return res.status(400).json({
                error: 'This instance is the platform - there is nowhere to escalate to.'
            });
        }

        const [[ticket]] = await query('SELECT * FROM support_tickets WHERE id = ?', [req.params.id]);
        if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

        if (['pending', 'sent'].includes(ticket.escalation_state)) {
            return res.status(400).json({ error: 'Already escalated and awaiting a platform reply' });
        }

        await query(
            `UPDATE support_tickets
                SET escalation_state = 'pending', escalated_at = NOW(), escalation_reason = ?
              WHERE id = ?`,
            [reason ? String(reason).slice(0, 2000) : null, ticket.id]
        );

        res.json({
            success: true,
            message: 'Queued. It travels on the next sync heartbeat, within 15 minutes.'
        });
    } catch (error) {
        console.error('[Support] escalate error:', error);
        res.status(500).json({ error: 'Failed to escalate ticket' });
    }
});

/**
 * POST /api/support/admin/tickets/:id/withdraw-escalation
 * Partner changed their mind, or resolved it themselves before we picked it up.
 */
router.post('/admin/tickets/:id/withdraw-escalation', async (req, res) => {
    try {
        const [result] = await query(
            `UPDATE support_tickets SET escalation_state = 'withdrawn'
              WHERE id = ? AND escalation_state = 'pending'`,
            [req.params.id]
        );
        if (!result.affectedRows) {
            // 'sent' cannot be withdrawn here: we may already be working on it.
            return res.status(400).json({ error: 'Only a pending escalation can be withdrawn' });
        }
        res.json({ success: true });
    } catch (error) {
        console.error('[Support] withdraw escalation error:', error);
        res.status(500).json({ error: 'Failed to withdraw escalation' });
    }
});

/**
 * PATCH /api/support/admin/tickets/:id
 * Body: any of { status, priority, assigned_to, assigned_name }
 */
router.patch('/admin/tickets/:id', async (req, res) => {
    const { status, priority, assigned_to, assigned_name } = req.body || {};
    const sets = [];
    const params = [];

    if (status !== undefined) {
        if (!STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status' });
        sets.push('status = ?'); params.push(status);
        if (['resolved', 'closed'].includes(status)) sets.push('resolved_at = NOW()');
    }
    if (priority !== undefined) {
        if (!PRIORITIES.includes(priority)) return res.status(400).json({ error: 'Invalid priority' });
        sets.push('priority = ?'); params.push(priority);
    }
    if (assigned_to !== undefined) { sets.push('assigned_to = ?'); params.push(assigned_to || null); }
    if (assigned_name !== undefined) { sets.push('assigned_name = ?'); params.push(assigned_name || null); }

    if (!sets.length) return res.status(400).json({ error: 'Nothing to update' });

    try {
        const [result] = await query(
            `UPDATE support_tickets SET ${sets.join(', ')} WHERE id = ?`,
            [...params, req.params.id]
        );
        if (!result.affectedRows) return res.status(404).json({ error: 'Ticket not found' });
        const [[ticket]] = await query(`SELECT * FROM support_tickets WHERE id = ?`, [req.params.id]);
        res.json({ success: true, data: ticket });
    } catch (error) {
        console.error('[Support] admin update error:', error);
        res.status(500).json({ error: 'Failed to update ticket' });
    }
});

module.exports = router;
