const crypto = require('crypto');
const { pool } = require('../config/database');
const { decryptSecret } = require('../services/secretStore');

/**
 * Authenticates a partner instance reporting in.
 *
 * This endpoint is reached by a machine on the public internet with no JWT, so
 * the signature IS the authentication. Every requirement below is load-bearing:
 *
 *   - The HMAC covers the RAW body. Re-serialising parsed JSON would open a gap
 *     between what we verified and what we store.
 *   - Comparison is constant-time. A byte-by-byte `===` leaks the expected digest
 *     to a patient attacker one character at a time.
 *   - Timestamps outside a 5 minute window are rejected AND every nonce inside
 *     that window is remembered. Either alone is insufficient: the window bounds
 *     how long a captured request stays useful, the nonce stops replay within it.
 *   - The timestamp and nonce are inside the signed payload, so an attacker
 *     cannot take a valid signature and attach a fresh timestamp to it.
 *   - The secret is encrypted at rest rather than hashed. Hashing would be
 *     stronger, but verifying an HMAC requires the plaintext, so the realistic
 *     choice is encryption with the key held outside the database.
 *
 * On success attaches `req.instance`.
 */

const MAX_SKEW_MS = 5 * 60 * 1000;

// Nonces seen inside the acceptance window. Bounded by the window itself:
// anything older than the skew limit already fails the timestamp check, so it can
// be forgotten. That keeps this map from growing without limit.
const seenNonces = new Map();

function pruneNonces(now) {
    for (const [nonce, ts] of seenNonces) {
        if (now - ts > MAX_SKEW_MS) seenNonces.delete(nonce);
    }
}

/** The signed payload. Timestamp and nonce are inside it, not just headers. */
function sign(rawBody, timestamp, nonce, secret) {
    return crypto
        .createHmac('sha256', secret)
        .update(`${timestamp}.${nonce}.${rawBody}`, 'utf8')
        .digest('hex');
}

function timingSafeEqualHex(a, b) {
    const bufA = Buffer.from(String(a), 'utf8');
    const bufB = Buffer.from(String(b), 'utf8');
    // timingSafeEqual throws on a length mismatch, which would itself leak length.
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
}

async function logRejection(slug, error, req) {
    try {
        await pool.query(
            `INSERT INTO partner_sync_log (instance_slug, kind, ok, error, remote_ip, payload_bytes)
             VALUES (?, 'snapshot', 0, ?, ?, ?)`,
            [slug || null, error, req.ip || null, req.rawBody ? req.rawBody.length : 0]
        );
    } catch {
        // Audit logging must never break the rejection path.
    }
}

async function verifyInstanceSignature(req, res, next) {
    const slug = req.get('X-Instance-Id');
    const signature = req.get('X-Signature');
    const timestamp = req.get('X-Timestamp');
    const nonce = req.get('X-Nonce');

    // Rejections are logged with the real reason but answered vaguely: a caller
    // probing this endpoint learns nothing about which check it failed.
    const reject = async (reason) => {
        await logRejection(slug, reason, req);
        return res.status(401).json({ ok: false, error: 'Invalid signature' });
    };

    try {
        if (!slug || !signature || !timestamp || !nonce) {
            return await reject('Missing signature headers');
        }

        if (typeof req.rawBody !== 'string') {
            return await reject('Raw body unavailable - check body parser order');
        }

        const ts = Number(timestamp);
        if (!Number.isFinite(ts)) return await reject('Malformed timestamp');

        const now = Date.now();
        if (Math.abs(now - ts) > MAX_SKEW_MS) {
            return await reject(`Timestamp outside acceptance window (skew ${now - ts}ms)`);
        }

        pruneNonces(now);
        if (seenNonces.has(nonce)) {
            return await reject('Nonce replayed');
        }

        const [rows] = await pool.query(
            'SELECT * FROM partner_instances WHERE slug = ? LIMIT 1',
            [slug]
        );
        if (rows.length === 0) return await reject('Unknown instance');

        const instance = rows[0];
        if (instance.status === 'cancelled') return await reject('Instance cancelled');

        let secret;
        try {
            secret = decryptSecret(instance.sync_secret_enc);
        } catch (err) {
            return await reject(`Could not decrypt sync secret: ${err.message}`);
        }
        if (!secret) return await reject('No sync secret stored for instance');

        const presented = signature.replace(/^sha256=/, '');
        const expected = sign(req.rawBody, timestamp, nonce, secret);
        if (!timingSafeEqualHex(presented, expected)) {
            return await reject('Signature mismatch');
        }

        // Only record the nonce once the request is fully authenticated, so an
        // attacker cannot burn a legitimate instance's nonces with junk requests.
        seenNonces.set(nonce, now);
        req.instance = instance;
        req.instanceSecret = secret;
        return next();
    } catch (error) {
        console.error('[PartnerSync] Signature verification error:', error);
        return res.status(401).json({ ok: false, error: 'Invalid signature' });
    }
}

module.exports = {
    verifyInstanceSignature,
    sign,
    MAX_SKEW_MS,
    _seenNonces: seenNonces,
};
