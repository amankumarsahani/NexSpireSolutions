const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { pool } = require('../config/database');
const { auth, isAdmin } = require('../middleware/auth');
const waSvc = require('../services/whatsapp.service');

function hasValidInternalKey(req) {
    const expected = process.env.INTERNAL_OAUTH_KEY;
    const supplied = req.get('x-internal-key');
    if (!expected || !supplied) return false;

    const expectedBuffer = Buffer.from(expected);
    const suppliedBuffer = Buffer.from(supplied);
    return expectedBuffer.length === suppliedBuffer.length
        && crypto.timingSafeEqual(expectedBuffer, suppliedBuffer);
}

function hasValidWhatsAppServiceKey(req) {
    const expected = process.env.WHATSAPP_SERVICE_KEY;
    const supplied = req.get('x-service-key');
    if (!expected || !supplied) return false;

    const expectedBuffer = Buffer.from(expected);
    const suppliedBuffer = Buffer.from(supplied);
    return expectedBuffer.length === suppliedBuffer.length
        && crypto.timingSafeEqual(expectedBuffer, suppliedBuffer);
}

// Browser/admin calls use normal authentication. Tenant-to-central proxy calls
// use the shared internal key and are only allowed below /internal.
router.use((req, res, next) => {
    if (req.path.startsWith('/internal/') && hasValidInternalKey(req)) {
        return next();
    }
    if (req.path === '/incoming' && hasValidWhatsAppServiceKey(req)) {
        return next();
    }
    return auth(req, res, () => isAdmin(req, res, next));
});

// ── Account CRUD ──────────────────────────────────────────

// GET /api/admin/whatsapp/accounts
// List all accounts (napnix + tenant) visible to admin
router.get('/accounts', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT id, owner_type, owner_id, channel, label, phone,
                    session_id, meta_phone_id, meta_waba_id, status, created_at
             FROM whatsapp_accounts ORDER BY owner_type, owner_id, id`
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/admin/whatsapp/accounts
// Create account (napnix-owned only via this route)
router.post('/accounts', async (req, res) => {
    const { channel, label, ownerType = 'napnix', ownerId = null } = req.body;
    if (!channel || !label) return res.status(400).json({ error: 'channel, label required' });

    try {
        const [result] = await pool.query(
            `INSERT INTO whatsapp_accounts (owner_type, owner_id, channel, label) VALUES (?, ?, ?, ?)`,
            [ownerType, ownerId, channel, label]
        );
        const accountId = result.insertId;
        const sessionId = waSvc.makeSessionId(ownerType, ownerId, accountId);
        await pool.query(`UPDATE whatsapp_accounts SET session_id = ? WHERE id = ?`, [sessionId, accountId]);

        res.json({ id: accountId, sessionId, channel, label });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/admin/whatsapp/accounts/:id
router.delete('/accounts/:id', async (req, res) => {
    try {
        const [rows] = await pool.query(`SELECT * FROM whatsapp_accounts WHERE id = ?`, [req.params.id]);
        if (!rows.length) return res.status(404).json({ error: 'Account not found' });
        const account = rows[0];

        if (account.channel === 'baileys' && account.session_id) {
            try { await waSvc.disconnectSession(account.session_id); } catch (err) { console.error(`[WhatsApp] Failed to disconnect session ${account.session_id} before delete:`, err.message); }
        }

        await pool.query(`DELETE FROM whatsapp_accounts WHERE id = ?`, [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── Baileys: QR connect flow ──────────────────────────────

// POST /api/admin/whatsapp/accounts/:id/connect
router.post('/accounts/:id/connect', async (req, res) => {
    try {
        const [rows] = await pool.query(`SELECT * FROM whatsapp_accounts WHERE id = ?`, [req.params.id]);
        if (!rows.length) return res.status(404).json({ error: 'Account not found' });
        const account = rows[0];

        if (account.channel === 'baileys') {
            const result = await waSvc.startSession(account.session_id);
            await pool.query(`UPDATE whatsapp_accounts SET status = 'pending_qr' WHERE id = ?`, [account.id]);
            return res.json(result);
        }

        if (account.channel === 'evolution') {
            if (!account.evolution_api_url || !account.evolution_api_key) {
                return res.status(400).json({ error: 'Set evolution_api_url and evolution_api_key first' });
            }
            // Create instance if not exists, then get QR
            try {
                await waSvc.evolutionCreateInstance(account.evolution_api_url, account.evolution_api_key, account.session_id);
            } catch (_) { /* already exists */ }
            // Set webhook so incoming messages reach nexs-backend
            const webhookUrl = `${process.env.SERVER_URL || 'http://localhost:5000'}/api/admin/whatsapp/incoming/evolution`;
            try { await waSvc.evolutionSetWebhook(account.evolution_api_url, account.evolution_api_key, account.session_id, webhookUrl); } catch (err) { console.error(`[WhatsApp] Failed to set Evolution webhook for session ${account.session_id}:`, err.message); }
            const qrData = await waSvc.evolutionGetQR(account.evolution_api_url, account.evolution_api_key, account.session_id);
            await pool.query(`UPDATE whatsapp_accounts SET status = 'pending_qr' WHERE id = ?`, [account.id]);
            return res.json({ ...qrData, sessionId: account.session_id });
        }

        return res.status(400).json({ error: 'Meta accounts do not use QR connect' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/admin/whatsapp/accounts/:id/disconnect
router.post('/accounts/:id/disconnect', async (req, res) => {
    try {
        const [rows] = await pool.query(`SELECT * FROM whatsapp_accounts WHERE id = ?`, [req.params.id]);
        if (!rows.length) return res.status(404).json({ error: 'Account not found' });
        const account = rows[0];

        if (account.channel === 'baileys' && account.session_id) {
            try { await waSvc.disconnectSession(account.session_id); } catch (err) { console.error(`[WhatsApp] Failed to disconnect Baileys session ${account.session_id}:`, err.message); }
        } else if (account.channel === 'evolution' && account.session_id) {
            try { await waSvc.evolutionDisconnect(account.evolution_api_url, account.evolution_api_key, account.session_id); } catch (err) { console.error(`[WhatsApp] Failed to disconnect Evolution session ${account.session_id}:`, err.message); }
        }
        await pool.query(`UPDATE whatsapp_accounts SET status = 'disconnected', phone = NULL WHERE id = ?`, [account.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/admin/whatsapp/accounts/:id/status
router.get('/accounts/:id/status', async (req, res) => {
    try {
        const [rows] = await pool.query(`SELECT * FROM whatsapp_accounts WHERE id = ?`, [req.params.id]);
        if (!rows.length) return res.status(404).json({ error: 'Account not found' });
        const account = rows[0];

        if (account.channel === 'baileys' && account.session_id) {
            const live = await waSvc.getSessionStatus(account.session_id);
            const statusChanged = live.status !== account.status && ['connected', 'disconnected'].includes(live.status);
            const phoneChanged = live.phone && live.phone !== account.phone;
            if (statusChanged || phoneChanged) {
                await pool.query(
                    `UPDATE whatsapp_accounts SET status = ?, phone = COALESCE(?, phone) WHERE id = ?`,
                    [live.status || account.status, live.phone || null, account.id]
                );
            }
            return res.json({ ...account, status: live.status || account.status, phone: live.phone || account.phone, liveStatus: live.status });
        }

        if (account.channel === 'evolution' && account.session_id && account.evolution_api_url) {
            try {
                const live = await waSvc.evolutionGetStatus(account.evolution_api_url, account.evolution_api_key, account.session_id);
                const state = live?.instance?.state;
                const mapped = state === 'open' ? 'connected' : state === 'connecting' ? 'pending_qr' : 'disconnected';
                if (mapped !== account.status) {
                    await pool.query(`UPDATE whatsapp_accounts SET status = ? WHERE id = ?`, [mapped, account.id]);
                }
                return res.json({ ...account, status: mapped, liveStatus: state });
            } catch (err) {
                console.error(`[WhatsApp] Failed to fetch live Evolution status for session ${account.session_id}:`, err.message);
            }
        }

        res.json(account);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── Evolution API: Save credentials ──────────────────────

// PUT /api/admin/whatsapp/accounts/:id/evolution-credentials
router.put('/accounts/:id/evolution-credentials', async (req, res) => {
    const { apiUrl, apiKey, instanceName } = req.body;
    if (!apiUrl || !apiKey || !instanceName) return res.status(400).json({ error: 'apiUrl, apiKey, instanceName required' });

    try {
        // Test connectivity
        const client = require('axios').create({ baseURL: apiUrl.replace(/\/$/, ''), headers: { apikey: apiKey }, timeout: 8000 });
        await client.get('/instance/fetchInstances').catch(() => {}); // just test auth/reachability

        await pool.query(
            `UPDATE whatsapp_accounts SET evolution_api_url = ?, evolution_api_key = ?, session_id = ? WHERE id = ?`,
            [apiUrl.replace(/\/$/, ''), apiKey, instanceName, req.params.id]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── Meta: Save credentials ────────────────────────────────

// PUT /api/admin/whatsapp/accounts/:id/meta-credentials
router.put('/accounts/:id/meta-credentials', async (req, res) => {
    const { token, phoneNumberId, wabaId } = req.body;
    if (!token || !phoneNumberId) return res.status(400).json({ error: 'token, phoneNumberId required' });

    try {
        // Test before saving
        const test = await waSvc.testMetaCredentials(token, phoneNumberId);
        if (!test.valid) return res.status(400).json({ error: `Invalid Meta credentials: ${test.error}` });

        const encrypted = waSvc.encryptToken(token);
        await pool.query(
            `UPDATE whatsapp_accounts SET meta_token = ?, meta_phone_id = ?, meta_waba_id = ?,
             phone = ?, status = 'connected' WHERE id = ?`,
            [encrypted, phoneNumberId, wabaId || null, test.phone || null, req.params.id]
        );
        res.json({ success: true, phone: test.phone, name: test.name });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── Webhook: Status callback from nexs-whatsapp ──────────
// nexs-whatsapp can POST here to update session status in DB
// Protected by internal service key

// POST /api/admin/whatsapp/webhook/status (internal — nexs-whatsapp calls this)
router.post('/webhook/status', auth, async (req, res) => {
    // Override auth — allow service key too (already handled in auth.js via x-api-key)
    const { sessionId, status, phone } = req.body;
    if (!sessionId || !status) return res.status(400).json({ error: 'sessionId, status required' });

    try {
        const update = { status };
        if (phone) update.phone = phone;
        await pool.query(
            `UPDATE whatsapp_accounts SET status = ?, ${phone ? 'phone = ?,' : ''} updated_at = NOW()
             WHERE session_id = ?`,
            phone ? [status, phone, sessionId] : [status, sessionId]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── Send messages ─────────────────────────────────────────

// POST /api/admin/whatsapp/send/text
router.post('/send/text', async (req, res) => {
    const { accountId, to, message } = req.body;
    if (!accountId || !to || !message) return res.status(400).json({ error: 'accountId, to, message required' });

    try {
        const [rows] = await pool.query(`SELECT * FROM whatsapp_accounts WHERE id = ?`, [accountId]);
        if (!rows.length) return res.status(404).json({ error: 'Account not found' });
        const account = rows[0];

        let result;
        if (account.channel === 'baileys') {
            result = await waSvc.sendText(account.session_id, to, message);
        } else if (account.channel === 'evolution') {
            result = await waSvc.evolutionSendText(account.evolution_api_url, account.evolution_api_key, account.session_id, to, message);
        } else {
            result = await waSvc.sendMetaText(account.meta_token, account.meta_phone_id, to, message);
        }
        res.json({ success: true, result });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/admin/whatsapp/send/template (Meta only)
router.post('/send/template', async (req, res) => {
    const { accountId, to, templateName, languageCode, components } = req.body;
    if (!accountId || !to || !templateName) return res.status(400).json({ error: 'accountId, to, templateName required' });

    try {
        const [rows] = await pool.query(`SELECT * FROM whatsapp_accounts WHERE id = ? AND channel = 'meta'`, [accountId]);
        if (!rows.length) return res.status(404).json({ error: 'Meta account not found' });
        const account = rows[0];

        const result = await waSvc.sendMetaTemplate(account.meta_token, account.meta_phone_id, to, templateName, languageCode, components);
        res.json({ success: true, result });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/admin/whatsapp/templates?accountId=X
router.get('/templates', async (req, res) => {
    const { accountId } = req.query;
    if (!accountId) return res.status(400).json({ error: 'accountId required' });

    try {
        const [rows] = await pool.query(`SELECT * FROM whatsapp_accounts WHERE id = ? AND channel = 'meta'`, [accountId]);
        if (!rows.length) return res.status(404).json({ error: 'Meta account not found' });
        const account = rows[0];

        const result = await waSvc.getMetaTemplates(account.meta_token, account.meta_waba_id);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── Internal proxy for nexcrm-backend tenant sessions ─────

// POST /api/admin/whatsapp/internal/session/start
// Called by nexcrm-backend to start a tenant session
router.post('/internal/session/start', async (req, res) => {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'sessionId required' });
    try {
        const result = await waSvc.startSession(sessionId);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/internal/session/:sessionId', async (req, res) => {
    try {
        await waSvc.disconnectSession(req.params.sessionId);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/internal/session/status/:sessionId', async (req, res) => {
    try {
        const result = await waSvc.getSessionStatus(req.params.sessionId);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/internal/send/text', async (req, res) => {
    const { sessionId, to, message } = req.body;
    try {
        const result = await waSvc.sendText(sessionId, to, message);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/admin/whatsapp/internal/meta/send/text — tenant proxy for Meta send
router.post('/internal/meta/send/text', async (req, res) => {
    const { accountId, to, message } = req.body;
    if (!accountId || !to || !message) return res.status(400).json({ error: 'accountId, to, message required' });
    try {
        const [rows] = await pool.query(
            `SELECT * FROM whatsapp_accounts WHERE id = ? AND channel = 'meta'`, [accountId]
        );
        if (!rows.length) return res.status(404).json({ error: 'Meta account not found' });
        const result = await waSvc.sendMetaText(rows[0].meta_token, rows[0].meta_phone_id, to, message);
        res.json({ success: true, result });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/admin/whatsapp/internal/meta-credentials — tenant saves Meta creds, nexs-backend encrypts
router.put('/internal/meta-credentials', async (req, res) => {
    const { token, phoneNumberId, wabaId } = req.body;
    if (!token || !phoneNumberId) return res.status(400).json({ error: 'token, phoneNumberId required' });
    try {
        const test = await waSvc.testMetaCredentials(token, phoneNumberId);
        if (!test.valid) return res.json({ valid: false, error: test.error });
        const encryptedToken = waSvc.encryptToken(token);
        res.json({ valid: true, encryptedToken, phone: test.phone, name: test.name });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/admin/whatsapp/internal/phone-registry — tenant registers its phone_number_id
// so the single central Meta webhook (one Meta App for every tenant) knows where to
// forward inbound messages for that number.
router.put('/internal/phone-registry', async (req, res) => {
    const { phoneNumberId, tenantSlug, tenantApiUrl } = req.body;
    if (!phoneNumberId || !tenantSlug || !tenantApiUrl) {
        return res.status(400).json({ error: 'phoneNumberId, tenantSlug, tenantApiUrl required' });
    }
    try {
        await pool.query(
            `INSERT INTO whatsapp_phone_registry (meta_phone_id, tenant_slug, tenant_api_url)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE tenant_slug = VALUES(tenant_slug), tenant_api_url = VALUES(tenant_api_url)`,
            [phoneNumberId, tenantSlug, tenantApiUrl]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── Conversations (Napnix accounts) ──────────────────────

// GET /api/admin/whatsapp/accounts/:id/conversations
router.get('/accounts/:id/conversations', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT c.*, a.label as account_label
             FROM whatsapp_conversations c
             JOIN whatsapp_accounts a ON a.id = c.account_id
             WHERE c.account_id = ?
             ORDER BY c.last_message_at DESC LIMIT 100`,
            [req.params.id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/admin/whatsapp/conversations/:id/messages
router.get('/conversations/:id/messages', async (req, res) => {
    const { page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    try {
        const [rows] = await pool.query(
            `SELECT * FROM whatsapp_messages WHERE conversation_id = ?
             ORDER BY sent_at DESC LIMIT ? OFFSET ?`,
            [req.params.id, parseInt(limit), offset]
        );
        // Mark as read
        await pool.query(
            `UPDATE whatsapp_conversations SET unread_count = 0 WHERE id = ?`,
            [req.params.id]
        );
        res.json(rows.reverse());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/admin/whatsapp/conversations/:id/messages — send reply
router.post('/conversations/:id/messages', async (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'message required' });
    try {
        const [convRows] = await pool.query(
            `SELECT c.*, a.channel, a.session_id, a.meta_token, a.meta_phone_id
             FROM whatsapp_conversations c JOIN whatsapp_accounts a ON a.id = c.account_id
             WHERE c.id = ?`,
            [req.params.id]
        );
        if (!convRows.length) return res.status(404).json({ error: 'Conversation not found' });
        const conv = convRows[0];

        if (conv.channel === 'baileys') {
            await waSvc.sendText(conv.session_id, conv.contact_jid, message);
        } else if (conv.channel === 'evolution') {
            const [accs] = await pool.query(`SELECT evolution_api_url, evolution_api_key FROM whatsapp_accounts WHERE id = ?`, [conv.account_id]);
            await waSvc.evolutionSendText(accs[0].evolution_api_url, accs[0].evolution_api_key, conv.session_id, conv.contact_jid.replace('@s.whatsapp.net', ''), message);
        } else {
            await waSvc.sendMetaText(conv.meta_token, conv.meta_phone_id, conv.contact_jid.replace('@s.whatsapp.net', ''), message);
        }

        const [msgResult] = await pool.query(
            `INSERT INTO whatsapp_messages (conversation_id, account_id, direction, body, media_type)
             VALUES (?, ?, 'outbound', ?, 'text')`,
            [conv.id, conv.account_id, message]
        );
        await pool.query(
            `UPDATE whatsapp_conversations SET last_message = ?, last_message_at = NOW() WHERE id = ?`,
            [message, conv.id]
        );
        res.json({ success: true, messageId: msgResult.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/admin/whatsapp/incoming — called by nap-whatsapp on incoming message
router.post('/incoming', async (req, res) => {
    const serviceKey = req.headers['x-service-key'];
    if (serviceKey !== process.env.WHATSAPP_SERVICE_KEY) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const { sessionId, from, fromName, text, mediaType, messageId, timestamp } = req.body;
    if (!sessionId || !from) return res.status(400).json({ error: 'sessionId, from required' });

    try {
        const [accounts] = await pool.query(`SELECT * FROM whatsapp_accounts WHERE session_id = ?`, [sessionId]);
        if (!accounts.length) return res.status(404).json({ error: 'Account not found' });
        const account = accounts[0];
        const phone = from.replace('@s.whatsapp.net', '');

        await pool.query(
            `INSERT INTO whatsapp_conversations (account_id, contact_jid, contact_name, contact_phone, last_message, last_message_at, unread_count)
             VALUES (?, ?, ?, ?, ?, NOW(), 1)
             ON DUPLICATE KEY UPDATE
               contact_name = COALESCE(VALUES(contact_name), contact_name),
               last_message = VALUES(last_message),
               last_message_at = NOW(),
               unread_count = unread_count + 1`,
            [account.id, from, fromName || null, phone, text || '[media]']
        );

        const [[conv]] = await pool.query(
            `SELECT id FROM whatsapp_conversations WHERE account_id = ? AND contact_jid = ?`,
            [account.id, from]
        );
        await pool.query(
            `INSERT INTO whatsapp_messages (conversation_id, account_id, message_id, direction, body, media_type, sent_at)
             VALUES (?, ?, ?, 'inbound', ?, ?, FROM_UNIXTIME(?))`,
            [conv.id, account.id, messageId || null, text || null, mediaType || 'text', timestamp || Math.floor(Date.now() / 1000)]
        );

        res.json({ success: true });

        // Fire workflow trigger asynchronously after responding
        const workflowEngine = require('../services/workflowEngine');
        workflowEngine.trigger('whatsapp_message_received', 'whatsapp_message', conv.id, {
            from_jid: from,
            from_phone: phone,
            from_name: fromName || '',
            text: text || '',
            message_text: text || '',
            media_type: mediaType || 'text',
            message_id: messageId || '',
            session_id: sessionId,
            account_id: account.id,
            account_label: account.label || '',
            conversation_id: conv.id,
            // Aliases for AI prompt convenience
            name: fromName || phone,
            phone: phone,
            message: text || '',
        }).catch(err => console.error('[WA incoming] Workflow trigger failed:', err.message));

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/admin/whatsapp/incoming/evolution — Evolution API webhook
// Evolution API posts events here (no service key — secured by obscurity + optional API key check)
router.post('/incoming/evolution', async (req, res) => {
    const body = req.body;
    // Only handle incoming messages
    if (body.event !== 'messages.upsert') return res.json({ success: true });
    const data = body.data;
    if (!data || data.key?.fromMe) return res.json({ success: true });

    const instanceName = body.instance;
    const from = data.key?.remoteJid || '';
    const fromName = data.pushName || '';
    const messageId = data.key?.id || '';
    const timestamp = data.messageTimestamp || Math.floor(Date.now() / 1000);
    const text = data.message?.conversation
        || data.message?.extendedTextMessage?.text
        || data.message?.imageMessage?.caption
        || data.message?.videoMessage?.caption || '';
    const mediaType = data.message?.imageMessage ? 'image'
        : data.message?.videoMessage ? 'video'
        : data.message?.audioMessage ? 'audio'
        : data.message?.documentMessage ? 'document' : 'text';

    if (!from || from.endsWith('@g.us')) return res.json({ success: true }); // skip groups

    try {
        const [accounts] = await pool.query(`SELECT * FROM whatsapp_accounts WHERE session_id = ? AND channel = 'evolution'`, [instanceName]);
        if (!accounts.length) return res.status(404).json({ error: 'Account not found' });
        const account = accounts[0];
        const phone = from.replace('@s.whatsapp.net', '');

        await pool.query(
            `INSERT INTO whatsapp_conversations (account_id, contact_jid, contact_name, contact_phone, last_message, last_message_at, unread_count)
             VALUES (?, ?, ?, ?, ?, NOW(), 1)
             ON DUPLICATE KEY UPDATE
               contact_name = COALESCE(VALUES(contact_name), contact_name),
               last_message = VALUES(last_message),
               last_message_at = NOW(),
               unread_count = unread_count + 1`,
            [account.id, from, fromName || null, phone, text || '[media]']
        );

        const [[conv]] = await pool.query(
            `SELECT id FROM whatsapp_conversations WHERE account_id = ? AND contact_jid = ?`,
            [account.id, from]
        );
        await pool.query(
            `INSERT INTO whatsapp_messages (conversation_id, account_id, message_id, direction, body, media_type, sent_at)
             VALUES (?, ?, ?, 'inbound', ?, ?, FROM_UNIXTIME(?))`,
            [conv.id, account.id, messageId || null, text || null, mediaType, timestamp]
        );

        res.json({ success: true });

        const workflowEngine = require('../services/workflowEngine');
        workflowEngine.trigger('whatsapp_message_received', 'whatsapp_message', conv.id, {
            from_jid: from,
            from_phone: phone,
            from_name: fromName || '',
            text: text || '',
            message_text: text || '',
            media_type: mediaType,
            message_id: messageId || '',
            session_id: instanceName,
            account_id: account.id,
            account_label: account.label || '',
            conversation_id: conv.id,
            name: fromName || phone,
            phone,
            message: text || '',
        }).catch(err => console.error('[WA Evolution incoming] Workflow trigger failed:', err.message));

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// SSE proxy — pipe nap-whatsapp events to frontend (admin or tenant)
router.get('/internal/session/events/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    const WA_SERVICE_URL = process.env.WHATSAPP_SERVICE_URL || 'http://localhost:5100';
    const WA_SERVICE_KEY = process.env.WHATSAPP_SERVICE_KEY;

    const url = new URL(`/session/events/${sessionId}`, WA_SERVICE_URL);
    const lib = url.protocol === 'https:' ? require('https') : require('http');

    const proxyReq = lib.request({
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname,
        method: 'GET',
        headers: { 'x-service-key': WA_SERVICE_KEY },
    }, (proxyRes) => {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no',   // Disable nginx buffering for SSE
        });
        proxyRes.pipe(res, { end: true });
    });

    proxyReq.on('error', (err) => {
        console.error('[WA SSE proxy] error:', err.message);
        if (!res.headersSent) res.status(502).json({ error: 'WA service unavailable' });
        else res.end();
    });

    req.on('close', () => proxyReq.destroy());
    proxyReq.end();
});

module.exports = router;
