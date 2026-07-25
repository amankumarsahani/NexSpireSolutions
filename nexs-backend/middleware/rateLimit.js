const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = rateLimit;

/**
 * Rate limiter for inquiry/contact form submissions
 * Limits to 5 requests per 15 minutes per IP
 */
const inquiryRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per window
    message: {
        error: 'Too many inquiries submitted. Please try again after 15 minutes.',
        retryAfter: 15
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Disable validation to prevent IPv6 crash
    validate: { xForwardedForHeader: false, default: true }
});

/**
 * General API rate limiter
 * Limits to 200 requests per 15 minutes per IP
 */
const generalRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: {
        error: 'Too many requests. Please slow down.',
        retryAfter: 15
    },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { xForwardedForHeader: false, default: true }
});

/**
 * Authentication rate limiter
 * Prevents brute force on login/register
 * Limits to 10 requests per 15 minutes per IP
 */
const authRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: {
        error: 'Too many login attempts. Please try again after 15 minutes.',
        retryAfter: 15
    },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { xForwardedForHeader: false, default: true }
});

/**
 * Support ingest limiter.
 * Colocated tenant backends share the master's IP, so key by the verified tenant slug
 * (set by the support serviceAuth) and fall back to IP. Caps ticket/reply spam from any
 * single tenant to 40 writes per 15 minutes.
 */
const supportIngestRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 40,
    message: { error: 'Too many support requests. Please slow down.', retryAfter: 15 },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.verifiedSlug || ipKeyGenerator(req.ip),
    validate: { xForwardedForHeader: false, default: true }
});

module.exports = {
    inquiryRateLimit,
    generalRateLimit,
    authRateLimit,
    supportIngestRateLimit
};
