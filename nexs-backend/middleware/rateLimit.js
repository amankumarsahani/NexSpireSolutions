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
    keyGenerator: (req) => {
        // Use X-Forwarded-For header if behind a proxy, otherwise use IP
        return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
    }
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
    legacyHeaders: false
});

module.exports = {
    inquiryRateLimit,
    generalRateLimit
};
