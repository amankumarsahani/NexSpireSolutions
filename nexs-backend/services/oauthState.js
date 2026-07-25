const jwt = require('jsonwebtoken');

/**
 * State is signed by tenant CRM processes and verified here. Tenant login JWT
 * secrets may differ, so federation state uses its own shared secret.
 */
function secret() {
    const value = process.env.OAUTH_STATE_SECRET
        || process.env.INTERNAL_OAUTH_KEY
        || process.env.JWT_SECRET;
    if (!value) throw new Error('OAUTH_STATE_SECRET or INTERNAL_OAUTH_KEY is required');
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
