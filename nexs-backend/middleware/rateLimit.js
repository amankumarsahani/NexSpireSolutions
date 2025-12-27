const rateLimit = require('express-rate-limit');

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
 * Limits to 100 requests per 15 minutes per IP
 */
const generalRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        error: 'Too many requests. Please slow down.',
        retryAfter: 15
    },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { xForwardedForHeader: false, default: true }
});

module.exports = {
    inquiryRateLimit,
    generalRateLimit
};
