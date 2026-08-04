/**
 * Support escalation across the partner boundary (P4-03, decision D7).
 *
 * Routing is partner-first by construction: support_tickets lives in each
 * instance's own database, so a partner's tenant raises a ticket into the
 * partner's inbox and it never touches ours. This module only handles the case
 * where the partner cannot resolve it and hands it up.
 *
 * Escalations ride the existing partner sync channel rather than opening a second
 * authenticated path. That is deliberate: the sync channel is already HMAC-signed,
 * replay-protected and outbound-only, and a partner server has no public inbound
 * for us to call into. A separate endpoint would mean a second set of credentials
 * and a second thing to get wrong.
 *
 * Direction of travel:
 *
 *   partner -> us    escalated tickets ride the heartbeat payload
 *   us -> partner    replies ride the command queue, and the partner instance
 *                    posts them into its own ticket thread
 *
 * The end customer sees only their partner. A reply we write is delivered by the
 * partner instance under the partner's mail identity, and is recorded against the
 * partner's own ticket.
 */

const { pool } = require('../config/database');

/** Cap per heartbeat so a backlog cannot produce an enormous payload. */
const MAX_ESCALATIONS_PER_REPORT = 25;

/**
 * Partner side: tickets awaiting hand-off, with their conversation so far.
 *
 * The whole thread goes up. Escalating without context just means we immediately
 * ask the partner to paste it in, with the customer waiting throughout. Internal
 * notes are excluded - those are the partner's private working notes.
 */
async function collectPending() {
    const [tickets] = await pool.query(
        `SELECT id, ticket_no, tenant_slug, tenant_name, industry, subject, category,
                priority, status, requester_name, requester_email, escalation_reason,
                created_at
           FROM support_tickets
          WHERE escalation_state = 'pending'
          ORDER BY escalated_at ASC
          LIMIT ?`,
        [MAX_ESCALATIONS_PER_REPORT]
    );
    if (tickets.length === 0) return [];

    const ids = tickets.map((t) => t.id);
    const [messages] = await pool.query(
        `SELECT ticket_id, author_type, author_name, body, created_at
           FROM support_ticket_messages
          WHERE ticket_id IN (?) AND is_internal_note = 0
          ORDER BY created_at ASC`,
        [ids]
    );

    const byTicket = new Map();
    for (const m of messages) {
        if (!byTicket.has(m.ticket_id)) byTicket.set(m.ticket_id, []);
        byTicket.get(m.ticket_id).push({
            author_type: m.author_type,
            author_name: m.author_name,
            body: m.body,
            created_at: m.created_at,
        });
    }

    return tickets.map((t) => ({
        partner_ticket_id: t.id,
        ticket_no: t.ticket_no,
        tenant_slug: t.tenant_slug,
        tenant_name: t.tenant_name,
        industry: t.industry,
        subject: t.subject,
        category: t.category,
        priority: t.priority,
        status: t.status,
        requester_name: t.requester_name,
        requester_email: t.requester_email,
        escalation_reason: t.escalation_reason,
        created_at: t.created_at,
        messages: byTicket.get(t.id) || [],
    }));
}

/** Partner side: mark as handed over once the master has acknowledged receipt. */
async function markSent(partnerTicketIds) {
    if (!partnerTicketIds || partnerTicketIds.length === 0) return;
    await pool.query(
        `UPDATE support_tickets SET escalation_state = 'sent' WHERE id IN (?) AND escalation_state = 'pending'`,
        [partnerTicketIds]
    );
}

/**
 * Partner side: post a platform reply into the partner's own ticket thread.
 *
 * Attributed to the partner's support identity, not ours. The customer is the
 * partner's customer and must never see a third party in the conversation - that
 * would undo the whitelabel at the exact moment it matters most.
 */
async function applyPlatformReply({ partner_ticket_id, message, resolve }) {
    if (!partner_ticket_id || !message) throw new Error('partner_ticket_id and message are required');

    const [[ticket]] = await pool.query('SELECT * FROM support_tickets WHERE id = ?', [partner_ticket_id]);
    if (!ticket) throw new Error(`No ticket ${partner_ticket_id}`);

    await pool.query(
        `INSERT INTO support_ticket_messages
            (ticket_id, author_type, author_name, body, is_internal_note, via_escalation)
         VALUES (?, 'agency', ?, ?, 0, 1)`,
        [ticket.id, 'Support', message]
    );

    const nextStatus = resolve ? 'resolved'
        : ['resolved', 'closed'].includes(ticket.status) ? ticket.status
        : 'waiting_customer';

    await pool.query(
        `UPDATE support_tickets
            SET last_message_at = NOW(), last_message_by = 'agency',
                status = ?, escalation_state = 'answered'
          WHERE id = ?`,
        [nextStatus, ticket.id]
    );

    return `replied to ticket ${ticket.ticket_no || ticket.id}`;
}

/**
 * Master side: record escalations arriving from a partner instance.
 *
 * Idempotent on (partner_instance_id, partner_ticket_id): a heartbeat that is
 * retried, or redelivered because an ack was lost, must not open a duplicate
 * ticket for the same customer problem.
 */
async function receiveEscalations(connection, instance, escalations) {
    const accepted = [];
    for (const e of escalations || []) {
        if (!e || !e.partner_ticket_id || !e.subject) continue;

        const [result] = await connection.query(
            `INSERT INTO support_tickets
                (tenant_slug, tenant_name, industry, requester_name, requester_email,
                 subject, category, priority, status,
                 partner_instance_id, partner_ticket_id, origin,
                 last_message_at, last_message_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, ?, 'partner_escalation', NOW(), 'tenant')
             ON DUPLICATE KEY UPDATE
                subject = VALUES(subject),
                priority = VALUES(priority),
                updated_at = NOW()`,
            [
                e.tenant_slug || 'unknown',
                e.tenant_name || null,
                e.industry || null,
                e.requester_name || null,
                e.requester_email || null,
                String(e.subject).slice(0, 255),
                ['general', 'billing', 'technical', 'bug', 'feature_request', 'data', 'account']
                    .includes(e.category) ? e.category : 'general',
                ['low', 'medium', 'high', 'urgent'].includes(e.priority) ? e.priority : 'medium',
                instance.id,
                e.partner_ticket_id,
            ]
        );

        // insertId is 0 on the duplicate-key path, so resolve the existing row.
        let ticketId = result.insertId;
        if (!ticketId) {
            const [[existing]] = await connection.query(
                'SELECT id FROM support_tickets WHERE partner_instance_id = ? AND partner_ticket_id = ?',
                [instance.id, e.partner_ticket_id]
            );
            ticketId = existing ? existing.id : null;
        }
        if (!ticketId) continue;

        // Copy the thread only once. Re-copying on every redelivery would grow the
        // conversation without anybody having said anything.
        const [[{ n }]] = await connection.query(
            'SELECT COUNT(*) AS n FROM support_ticket_messages WHERE ticket_id = ?', [ticketId]
        );
        if (n === 0) {
            for (const m of e.messages || []) {
                if (!m || !m.body) continue;
                await connection.query(
                    `INSERT INTO support_ticket_messages
                        (ticket_id, author_type, author_name, body, is_internal_note, via_escalation)
                     VALUES (?, ?, ?, ?, 0, 1)`,
                    [
                        ticketId,
                        m.author_type === 'agency' ? 'agency' : 'tenant',
                        m.author_name || null,
                        m.body,
                    ]
                );
            }
            if (e.escalation_reason) {
                await connection.query(
                    `INSERT INTO support_ticket_messages
                        (ticket_id, author_type, author_name, body, is_internal_note, via_escalation)
                     VALUES (?, 'tenant', ?, ?, 1, 1)`,
                    [ticketId, 'Partner', `Escalation reason: ${e.escalation_reason}`]
                );
            }
        }

        accepted.push(e.partner_ticket_id);
    }
    return accepted;
}

module.exports = {
    collectPending,
    markSent,
    applyPlatformReply,
    receiveEscalations,
    MAX_ESCALATIONS_PER_REPORT,
};
