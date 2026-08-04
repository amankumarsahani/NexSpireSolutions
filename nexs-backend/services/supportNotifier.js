/**
 * Support desk email notifications.
 *
 * Fire-and-forget: every function swallows its own errors and must never be awaited in a
 * request's critical path — a mail failure should not fail ticket creation or a reply.
 *
 *   New ticket / tenant reply  -> agency inbox address (SUPPORT_NOTIFY_EMAIL | NAPNIX_ADMIN_EMAIL)
 *   Agency reply (public)      -> the tenant requester who opened the ticket
 */

const emailService = require('./email.service');
const brand = require('../config/brand');

// Agency recipients: the shared NOTIFICATION_EMAILS list (comma-separated), falling back
// to a single support/admin address. Sent via the existing (Zoho) email.service transport.
const AGENCY_EMAIL = () => {
    const list = emailService.getNotificationRecipients?.() || [];
    if (list.length) return list;
    return process.env.SUPPORT_NOTIFY_EMAIL || brand.platformAdminEmail;
};
const ADMIN_URL = () => (brand.adminUrl).replace(/\/+$/, '');

const esc = (s) => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const PRIORITY_COLOR = { low: '#64748b', medium: '#0284c7', high: '#ea580c', urgent: '#e11d48' };

/** Shared ticket-styled email shell — reads like a helpdesk notification, not a chat. */
function shell({ heading, ticket, bodyRows, message, cta }) {
    const pill = PRIORITY_COLOR[ticket.priority] || '#0284c7';
    const rows = bodyRows.map(([k, v]) => `
        <tr>
            <td style="padding:4px 12px 4px 0;color:#64748b;font-size:13px;white-space:nowrap;">${esc(k)}</td>
            <td style="padding:4px 0;color:#0f172a;font-size:13px;font-weight:600;">${v}</td>
        </tr>`).join('');
    return `
    <div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:560px;margin:0 auto;background:#f8fafc;padding:24px;">
        <div style="background:#fff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;">
            <div style="background:#4f46e5;padding:16px 20px;">
                <div style="color:#fff;font-size:15px;font-weight:700;">${esc(heading)}</div>
                <div style="color:#c7d2fe;font-size:12px;margin-top:2px;font-family:monospace;">${esc(ticket.ticket_no || '')}</div>
            </div>
            <div style="padding:20px;">
                <div style="font-size:16px;font-weight:700;color:#0f172a;margin-bottom:4px;">${esc(ticket.subject)}</div>
                <span style="display:inline-block;background:${pill};color:#fff;font-size:11px;font-weight:700;padding:2px 8px;border-radius:999px;text-transform:uppercase;">${esc(ticket.priority)}</span>
                <table style="margin:16px 0;border-collapse:collapse;">${rows}</table>
                ${message ? `<div style="background:#f1f5f9;border-radius:10px;padding:12px 14px;color:#334155;font-size:14px;line-height:1.5;white-space:pre-wrap;">${esc(message)}</div>` : ''}
                ${cta ? `<div style="margin-top:20px;"><a href="${esc(cta.url)}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:10px 18px;border-radius:8px;">${esc(cta.label)}</a></div>` : ''}
            </div>
        </div>
        <div style="text-align:center;color:#94a3b8;font-size:11px;margin-top:14px;">Napnix Support Desk</div>
    </div>`;
}

function fire(promise) {
    Promise.resolve(promise).catch((e) => console.error('[SupportNotifier]', e.message));
}

function notifyNewTicket(ticket, message) {
    fire(emailService.sendEmail({
        to: AGENCY_EMAIL(),
        subject: `[${ticket.ticket_no}] New support ticket — ${ticket.subject}`,
        html: shell({
            heading: 'New support ticket',
            ticket,
            message,
            bodyRows: [
                ['Tenant', esc(ticket.tenant_name || ticket.tenant_slug)],
                ['From', `${esc(ticket.requester_name || '—')} &lt;${esc(ticket.requester_email || '')}&gt;`],
                ['Category', esc(ticket.category)],
            ],
            cta: { label: 'Open in admin', url: `${ADMIN_URL()}/support` },
        }),
    }));
}

function notifyTenantReply(ticket, message) {
    fire(emailService.sendEmail({
        to: AGENCY_EMAIL(),
        subject: `[${ticket.ticket_no}] Customer replied — ${ticket.subject}`,
        html: shell({
            heading: 'Customer reply',
            ticket,
            message,
            bodyRows: [
                ['Tenant', esc(ticket.tenant_name || ticket.tenant_slug)],
                ['From', esc(ticket.requester_name || '—')],
            ],
            cta: { label: 'Reply in admin', url: `${ADMIN_URL()}/support` },
        }),
    }));
}

function notifyAgencyReply(ticket, message) {
    if (!ticket.requester_email) return;
    fire(emailService.sendEmail({
        to: ticket.requester_email,
        subject: `[${ticket.ticket_no}] Reply from support — ${ticket.subject}`,
        html: shell({
            heading: 'Support replied to your ticket',
            ticket,
            message,
            bodyRows: [
                ['Status', esc(ticket.status)],
                ['Category', esc(ticket.category)],
            ],
        }),
    }));
}

module.exports = { notifyNewTicket, notifyTenantReply, notifyAgencyReply };
