const axios = require('axios');
const crypto = require('crypto');

const WA_SERVICE_URL = process.env.WHATSAPP_SERVICE_URL || 'http://localhost:5100';
const WA_SERVICE_KEY = process.env.WHATSAPP_SERVICE_KEY;
// Tenant and central must derive the same key because central validates/encrypts
// and the tenant sends/decrypts. INTERNAL_OAUTH_KEY is already shared by the
// provisioning contract, so it is the safe compatibility fallback.
const ENCRYPT_SECRET = process.env.META_TOKEN_SECRET
    || process.env.INTERNAL_OAUTH_KEY
    || process.env.JWT_SECRET;

const waClient = axios.create({
    baseURL: WA_SERVICE_URL,
    headers: { 'x-service-key': WA_SERVICE_KEY },
    timeout: 15000,
});

// ── Encryption for Meta tokens stored in DB ───────────────

function encryptToken(plain) {
    const iv = crypto.randomBytes(16);
    const key = crypto.scryptSync(ENCRYPT_SECRET, 'nexs-wa-salt', 32);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decryptToken(stored) {
    const [ivHex, encHex] = stored.split(':');
    const key = crypto.scryptSync(ENCRYPT_SECRET, 'nexs-wa-salt', 32);
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, Buffer.from(ivHex, 'hex'));
    const decrypted = Buffer.concat([decipher.update(Buffer.from(encHex, 'hex')), decipher.final()]);
    return decrypted.toString('utf8');
}

// ── Session ID helpers ────────────────────────────────────

function makeSessionId(ownerType, ownerId, accountId) {
    return ownerType === 'napnix'
        ? `napnix_${accountId}`
        : `tenant_${ownerId}_${accountId}`;
}

// ── nexs-whatsapp proxy calls ─────────────────────────────

async function startSession(sessionId) {
    const { data } = await waClient.post('/session/start', { sessionId });
    return data;
}

async function disconnectSession(sessionId) {
    const { data } = await waClient.delete(`/session/${sessionId}`);
    return data;
}

async function getSessionStatus(sessionId) {
    const { data } = await waClient.get(`/session/status/${sessionId}`);
    return data;
}

async function sendText(sessionId, to, message) {
    const { data } = await waClient.post('/send/text', { sessionId, to, message });
    return data;
}

async function sendMedia(sessionId, to, mediaUrl, caption, mediaType) {
    const { data } = await waClient.post('/send/media', { sessionId, to, mediaUrl, caption, mediaType });
    return data;
}

async function sendMetaText(token, phoneNumberId, to, message) {
    const plain = decryptToken(token);
    const { data } = await waClient.post('/meta/send/text', { token: plain, phoneNumberId, to, message });
    return data;
}

async function sendMetaTemplate(token, phoneNumberId, to, templateName, languageCode, components) {
    const plain = decryptToken(token);
    const { data } = await waClient.post('/meta/send/template', {
        token: plain, phoneNumberId, to, templateName, languageCode, components
    });
    return data;
}

async function getMetaTemplates(token, wabaId) {
    const plain = decryptToken(token);
    const { data } = await waClient.get('/meta/templates', { params: { token: plain, wabaId } });
    return data;
}

async function testMetaCredentials(token, phoneNumberId) {
    const version = process.env.META_GRAPH_VERSION || 'v21.0';
    try {
        const { data } = await axios.get(
            `https://graph.facebook.com/${version}/${encodeURIComponent(phoneNumberId)}`,
            {
                params: { fields: 'display_phone_number,verified_name' },
                headers: { Authorization: `Bearer ${token}` },
                timeout: 15000
            }
        );
        return {
            valid: true,
            phone: data.display_phone_number || null,
            name: data.verified_name || null
        };
    } catch (err) {
        return {
            valid: false,
            error: err.response?.data?.error?.message || err.message || 'Meta credential validation failed'
        };
    }
}

// ── Evolution API proxy calls ─────────────────────────────

function evolutionClient(apiUrl, apiKey) {
    return axios.create({
        baseURL: apiUrl.replace(/\/$/, ''),
        headers: { 'apikey': apiKey },
        timeout: 15000,
    });
}

async function evolutionCreateInstance(apiUrl, apiKey, instanceName) {
    const client = evolutionClient(apiUrl, apiKey);
    const { data } = await client.post('/instance/create', {
        instanceName,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS',
    });
    return data;
}

async function evolutionGetQR(apiUrl, apiKey, instanceName) {
    const client = evolutionClient(apiUrl, apiKey);
    const { data } = await client.get(`/instance/connect/${instanceName}`);
    return data; // { base64, code }
}

async function evolutionGetStatus(apiUrl, apiKey, instanceName) {
    const client = evolutionClient(apiUrl, apiKey);
    const { data } = await client.get(`/instance/connectionState/${instanceName}`);
    // data.instance.state: 'open' | 'close' | 'connecting'
    return data;
}

async function evolutionDisconnect(apiUrl, apiKey, instanceName) {
    const client = evolutionClient(apiUrl, apiKey);
    const { data } = await client.delete(`/instance/logout/${instanceName}`);
    return data;
}

async function evolutionSetWebhook(apiUrl, apiKey, instanceName, webhookUrl) {
    const client = evolutionClient(apiUrl, apiKey);
    const { data } = await client.post(`/webhook/set/${instanceName}`, {
        url: webhookUrl,
        enabled: true,
        events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE'],
        webhook_by_events: false,
    });
    return data;
}

async function evolutionSendText(apiUrl, apiKey, instanceName, to, message) {
    const client = evolutionClient(apiUrl, apiKey);
    const number = to.replace(/[^0-9]/g, '');
    const { data } = await client.post(`/message/sendText/${instanceName}`, {
        number,
        text: message,
    });
    return data;
}

module.exports = {
    encryptToken,
    decryptToken,
    makeSessionId,
    startSession,
    disconnectSession,
    getSessionStatus,
    sendText,
    sendMedia,
    sendMetaText,
    sendMetaTemplate,
    getMetaTemplates,
    testMetaCredentials,
    evolutionCreateInstance,
    evolutionGetQR,
    evolutionGetStatus,
    evolutionDisconnect,
    evolutionSetWebhook,
    evolutionSendText,
};
