/**
 * WhatsApp webhook authentication.
 *
 * Extracted from the controller because this is the security boundary for every
 * inbound WhatsApp message on the platform, and a security boundary that can only
 * be exercised by booting the whole app is a security boundary nobody tests.
 *
 * The problem it solves: Meta signs each webhook with the app secret of the Meta
 * App the number belongs to. Numbers onboarded through our Tech Provider app are
 * signed with META_APP_SECRET, but a tenant who brings their own Meta App signs
 * with theirs. A single global check therefore silently dropped every message from
 * a bring-your-own-app tenant.
 */

const crypto = require('crypto');
const { pool } = require('../config/database');
const waService = require('./whatsapp.service');

/**
 * Registry rows for a set of phone ids, keyed by phone id (string).
 */
async function loadRegistry(phoneIds) {
    if (!phoneIds.length) return new Map();
    const placeholders = phoneIds.map(() => '?').join(',');
    const [rows] = await pool.query(
        `SELECT meta_phone_id, tenant_slug, tenant_api_url, app_mode, app_secret
           FROM whatsapp_phone_registry
          WHERE meta_phone_id IN (${placeholders})`,
        phoneIds
    );
    return new Map(rows.map((row) => [String(row.meta_phone_id), row]));
}

/**
 * Collect the candidate verification secrets for a registry, grouped so the body
 * is hashed once per distinct secret rather than once per number.
 *
 * @param {Map} registry
 * @param {object} deps  { decrypt, platformSecret } — injected for testing
 * @returns {Map<string, string[]>} secret -> phone ids
 */
function candidateSecrets(registry, deps = {}) {
    const decrypt = deps.decrypt || waService.decryptToken;
    const platformSecret = deps.platformSecret !== undefined
        ? deps.platformSecret
        : (process.env.META_APP_SECRET || null);

    const bySecret = new Map();

    for (const [phoneId, row] of registry.entries()) {
        let secret = null;

        if (row.app_mode === 'tenant' && row.app_secret) {
            try {
                secret = decrypt(row.app_secret);
            } catch {
                // An unreadable secret must fail closed. Falling back to the
                // platform secret here would accept forged payloads for that number.
                console.error(`[whatsappWebhookAuth] app secret for ${phoneId} could not be decrypted`);
                continue;
            }
        } else if (row.app_mode === 'tenant' && !row.app_secret) {
            console.error(`[whatsappWebhookAuth] ${phoneId} is registered as tenant-app but has no app secret`);
            continue;
        } else {
            secret = platformSecret;
        }

        if (!secret) {
            console.error(`[whatsappWebhookAuth] no verification secret available for ${phoneId}`);
            continue;
        }

        if (!bySecret.has(secret)) bySecret.set(secret, []);
        bySecret.get(secret).push(phoneId);
    }

    return bySecret;
}

/**
 * Which phone ids in this payload are covered by a valid signature.
 *
 * Returning a set rather than a boolean is the point: one tenant's valid signature
 * must not authorise another tenant's entries that happen to ride in the same body.
 *
 * @param {string} signatureHeader  the `x-hub-signature-256` value
 * @param {Buffer} rawBody          the exact bytes Meta signed
 * @param {Map} registry            phone id -> registry row
 * @param {object} [deps]           { decrypt, platformSecret } for testing
 * @returns {Set<string>}
 */
function verifySignature(signatureHeader, rawBody, registry, deps = {}) {
    const verified = new Set();
    if (!signatureHeader || !rawBody) return verified;

    const supplied = Buffer.from(String(signatureHeader));

    for (const [secret, phoneIds] of candidateSecrets(registry, deps).entries()) {
        const expected = Buffer.from(
            'sha256=' + crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
        );
        // timingSafeEqual throws on a length mismatch, so the length is checked
        // first — and a length check is not a timing leak here because the expected
        // length is a constant of the algorithm, not a secret.
        if (supplied.length !== expected.length) continue;
        if (crypto.timingSafeEqual(supplied, expected)) {
            for (const id of phoneIds) verified.add(id);
        }
    }

    return verified;
}

/** Phone ids referenced by a payload, without acting on any of it. */
function phoneIdsIn(payload) {
    const ids = new Set();
    for (const entry of payload?.entry || []) {
        for (const change of entry.changes || []) {
            const id = change.value?.metadata?.phone_number_id;
            if (id) ids.add(String(id));
        }
    }
    return ids;
}

module.exports = { loadRegistry, verifySignature, candidateSecrets, phoneIdsIn };
