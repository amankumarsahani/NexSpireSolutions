/**
 * Support escalation across the partner boundary (P4-03, decision D7).
 *
 * The property that actually matters and is easy to break: the end customer is
 * the PARTNER's customer. A platform reply must arrive in the partner's own ticket
 * thread, and we must never contact that customer directly. These tests pin the
 * round trip and the idempotency that stops a retried heartbeat opening duplicate
 * tickets for the same problem.
 *
 * Requires migrations 058, 064, 065 and 066. See tests/README.md.
 */

const crypto = require('crypto');
const assert = require('assert');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'integration-test-master-key';

const { pool } = require('../config/database');
const { encryptSecret } = require('../services/secretStore');
const escalation = require('../services/supportEscalation.service');

const SLUG = `etest-${crypto.randomBytes(4).toString('hex')}`;

let passed = 0;
let failed = 0;
let instanceId;
const createdTickets = [];

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

/** Create a ticket as if a partner's tenant had raised it on the partner instance. */
async function makePartnerTicket({ subject = 'Cannot export invoices', pending = true } = {}) {
    const [r] = await pool.query(
        `INSERT INTO support_tickets
            (tenant_slug, tenant_name, subject, category, priority, status,
             escalation_state, escalated_at, escalation_reason, last_message_at, last_message_by)
         VALUES ('customer-a', 'Customer A', ?, 'technical', 'high', 'open',
                 ?, NOW(), 'Needs platform-level database access', NOW(), 'tenant')`,
        [subject, pending ? 'pending' : 'none']
    );
    createdTickets.push(r.insertId);
    await pool.query(
        `INSERT INTO support_ticket_messages (ticket_id, author_type, author_name, body)
         VALUES (?, 'tenant', 'Dana', 'Export button returns a 500.'),
                (?, 'agency', 'Partner Support', 'We reproduced it and are escalating.')`,
        [r.insertId, r.insertId]
    );
    return r.insertId;
}

(async () => {
    console.log('\nsupport escalation\n');

    const [ins] = await pool.query(
        `INSERT INTO partner_instances (slug, name, sync_secret_enc) VALUES (?, ?, ?)`,
        [SLUG, 'Escalation Test', encryptSecret('unused')]
    );
    instanceId = ins.insertId;

    await test('a pending escalation is collected with its whole thread', async () => {
        const id = await makePartnerTicket();
        const pending = await escalation.collectPending();
        const mine = pending.find((p) => p.partner_ticket_id === id);
        assert.ok(mine, 'ticket should be collected');
        assert.strictEqual(mine.subject, 'Cannot export invoices');
        assert.strictEqual(mine.messages.length, 2, 'escalating without context is useless');
        assert.strictEqual(mine.escalation_reason, 'Needs platform-level database access');
    });

    await test('internal notes are not shipped to the platform', async () => {
        const id = await makePartnerTicket({ subject: 'Note privacy' });
        await pool.query(
            `INSERT INTO support_ticket_messages (ticket_id, author_type, author_name, body, is_internal_note)
             VALUES (?, 'agency', 'Partner Support', 'Customer is behind on payment', 1)`,
            [id]
        );
        const pending = await escalation.collectPending();
        const mine = pending.find((p) => p.partner_ticket_id === id);
        assert.ok(mine.messages.every((m) => !m.body.includes('behind on payment')),
            "the partner's private working notes must stay with the partner");
    });

    await test('the master records an escalation as a ticket', async () => {
        const partnerTicketId = await makePartnerTicket({ subject: 'Master receives this' });
        const pending = await escalation.collectPending();
        const payload = pending.filter((p) => p.partner_ticket_id === partnerTicketId);

        const conn = await pool.getConnection();
        const accepted = await escalation.receiveEscalations(conn, { id: instanceId }, payload);
        conn.release();

        assert.deepStrictEqual(accepted, [partnerTicketId]);

        const [[row]] = await pool.query(
            `SELECT id, origin, partner_instance_id, subject FROM support_tickets
              WHERE partner_instance_id = ? AND partner_ticket_id = ?`,
            [instanceId, partnerTicketId]
        );
        assert.ok(row, 'master ticket should exist');
        assert.strictEqual(row.origin, 'partner_escalation');
        createdTickets.push(row.id);

        const [msgs] = await pool.query(
            'SELECT via_escalation FROM support_ticket_messages WHERE ticket_id = ?', [row.id]
        );
        assert.ok(msgs.length >= 2, 'the conversation should come across');
        assert.ok(msgs.every((m) => m.via_escalation === 1), 'and be marked as having crossed the boundary');
    });

    await test('a redelivered escalation does not duplicate the ticket', async () => {
        // A lost ack means the instance resends. That must not open a second ticket
        // for the same customer problem, nor grow the thread.
        const partnerTicketId = await makePartnerTicket({ subject: 'Redelivery safety' });
        const payload = (await escalation.collectPending())
            .filter((p) => p.partner_ticket_id === partnerTicketId);

        const conn = await pool.getConnection();
        await escalation.receiveEscalations(conn, { id: instanceId }, payload);

        const [rows] = await pool.query(
            `SELECT id FROM support_tickets WHERE partner_instance_id = ? AND partner_ticket_id = ?`,
            [instanceId, partnerTicketId]
        );
        assert.strictEqual(rows.length, 1, 'exactly one master ticket');
        createdTickets.push(rows[0].id);

        const countMessages = async () => {
            const [[{ n }]] = await pool.query(
                'SELECT COUNT(*) AS n FROM support_ticket_messages WHERE ticket_id = ?', [rows[0].id]
            );
            return Number(n);
        };

        // Assert stability rather than a specific number: what matters is that
        // redelivery changes nothing, not how many messages the first one produced.
        const afterFirst = await countMessages();
        await escalation.receiveEscalations(conn, { id: instanceId }, payload);
        await escalation.receiveEscalations(conn, { id: instanceId }, payload);
        conn.release();

        const [again] = await pool.query(
            `SELECT id FROM support_tickets WHERE partner_instance_id = ? AND partner_ticket_id = ?`,
            [instanceId, partnerTicketId]
        );
        assert.strictEqual(again.length, 1, 'still exactly one master ticket');
        assert.strictEqual(await countMessages(), afterFirst, 'the thread must not grow on redelivery');
    });

    await test('markSent stops a handed-over ticket being resent', async () => {
        const id = await makePartnerTicket({ subject: 'Mark sent' });
        await escalation.markSent([id]);
        const pending = await escalation.collectPending();
        assert.ok(!pending.find((p) => p.partner_ticket_id === id), 'should no longer be pending');

        const [[row]] = await pool.query('SELECT escalation_state FROM support_tickets WHERE id = ?', [id]);
        assert.strictEqual(row.escalation_state, 'sent');
    });

    await test('a platform reply lands in the partner thread under the partner identity', async () => {
        const id = await makePartnerTicket({ subject: 'Reply delivery' });
        await escalation.markSent([id]);

        const result = await escalation.applyPlatformReply({
            partner_ticket_id: id,
            message: 'Fixed on our side, please retry the export.',
        });
        assert.ok(result.includes('replied'));

        const [msgs] = await pool.query(
            `SELECT author_type, author_name, body, via_escalation
               FROM support_ticket_messages WHERE ticket_id = ? ORDER BY id DESC LIMIT 1`,
            [id]
        );
        assert.strictEqual(msgs[0].author_type, 'agency');
        assert.strictEqual(msgs[0].via_escalation, 1);
        assert.ok(msgs[0].body.includes('Fixed on our side'));
        // Attribution must not name the platform: the customer only knows the partner.
        assert.ok(!/napnix/i.test(msgs[0].author_name || ''),
            'the reply must not be attributed to the platform');

        const [[ticket]] = await pool.query('SELECT escalation_state, status FROM support_tickets WHERE id = ?', [id]);
        assert.strictEqual(ticket.escalation_state, 'answered');
        assert.strictEqual(ticket.status, 'waiting_customer');
    });

    await test('withdrawn escalations are not collected', async () => {
        const id = await makePartnerTicket({ subject: 'Withdrawn' });
        await pool.query("UPDATE support_tickets SET escalation_state = 'withdrawn' WHERE id = ?", [id]);
        const pending = await escalation.collectPending();
        assert.ok(!pending.find((p) => p.partner_ticket_id === id));
    });

    // Cleanup: the FK cascades messages.
    if (createdTickets.length > 0) {
        await pool.query('DELETE FROM support_tickets WHERE id IN (?)', [createdTickets]);
    }
    await pool.query('DELETE FROM partner_instances WHERE id = ?', [instanceId]);
    await pool.end();

    console.log(`\n${passed} passed, ${failed} failed\n`);
    process.exit(failed === 0 ? 0 : 1);
})().catch(async (error) => {
    console.error('\nHarness error:', error.message);
    try { await pool.end(); } catch { /* already failing */ }
    process.exit(1);
});
