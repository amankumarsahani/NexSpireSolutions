const https = require('https');

/**
 * Google reCAPTCHA v3 verification middleware
 * Validates CAPTCHA token and score
 */
const verifyCaptcha = async (req, res, next) => {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;

    // Skip CAPTCHA in development if no key is set
    if (!secretKey) {
        console.warn('⚠️ RECAPTCHA_SECRET_KEY not set - skipping CAPTCHA verification');
        return next();
    }

    const captchaToken = req.body.captchaToken;

    if (!captchaToken) {
        return res.status(400).json({
            error: 'CAPTCHA verification required',
            code: 'CAPTCHA_MISSING'
        });
    }

    try {
        const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${captchaToken}&remoteip=${req.ip}`;

        const result = await new Promise((resolve, reject) => {
            https.get(verifyUrl, (response) => {
                let data = '';
                response.on('data', chunk => data += chunk);
                response.on('end', () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        reject(new Error('Failed to parse CAPTCHA response'));
                    }
                });
            }).on('error', reject);
        });

        if (!result.success) {
            console.warn('CAPTCHA verification failed:', result['error-codes']);
            return res.status(400).json({
                error: 'CAPTCHA verification failed. Please try again.',
                code: 'CAPTCHA_FAILED'
            });
        }

        // Check score (0.0 = bot, 1.0 = human)
        // Score threshold of 0.5 is recommended by Google
        if (result.score !== undefined && result.score < 0.5) {
            console.warn(`CAPTCHA low score: ${result.score}`);
            return res.status(400).json({
                error: 'Verification failed. Please try again.',
                code: 'CAPTCHA_LOW_SCORE'
            });
        }

        // Attach score to request for logging
        req.captchaScore = result.score;
        next();
    } catch (error) {
        console.error('CAPTCHA verification error:', error);
        // Allow through on error to not block legitimate users
        // Rate limiting will still protect against abuse
        next();
    }
};

module.exports = { verifyCaptcha };
