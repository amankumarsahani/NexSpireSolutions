const jwt = require('jsonwebtoken');

/**
 * State is signed by tenant CRM processes and verified here. Tenant login JWT
 * secrets may differ, so federation state uses its own shared secret.
 */
let warnedFallback = false;

function secret() {
    const value = process.env.OAUTH_STATE_SECRET
        || process.env.INTERNAL_OAUTH_KEY
        || process.env.JWT_SECRET;
    if (!value) throw new Error('OAUTH_STATE_SECRET or INTERNAL_OAUTH_KEY is required');
    // JWT_SECRET is per-process (agency vs tenant), so falling back to it makes
    // every cross-process state fail signature verification and surface as the
    // misleading "Invalid or expired state". Warn once so it's diagnosable.
    if (!process.env.OAUTH_STATE_SECRET && !process.env.INTERNAL_OAUTH_KEY && !warnedFallback) {
        warnedFallback = true;
        console.warn('[oauthState] No OAUTH_STATE_SECRET/INTERNAL_OAUTH_KEY set — falling back to JWT_SECRET. Cross-process OAuth state will fail unless every process shares the same JWT_SECRET.');
    }
    return value;
}

function sign(payload, options = { expiresIn: '10m' }) {
    return jwt.sign(payload, secret(), options);
}

function verify(token) {
    return jwt.verify(token, secret());
}

function decode(token) {
    return jwt.decode(token);
}

module.exports = { secret, sign, verify, decode };
