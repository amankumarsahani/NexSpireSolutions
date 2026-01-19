/**
 * Security Middleware
 * Blocks common bot attack patterns and rogue paths
 */

// Known malicious paths and patterns
const ROGUE_PATTERNS = [
    /\.php$/i,
    /\.env$/i,
    /\/\.git/i,
    /wp-admin/i,
    /wp-login/i,
    /wlwmanifest\.xml/i,
    /xmlrpc\.php/i,
    /actuator/i, // Spring Boot
    /\.jsp$/i,
    /\.asp$/i,
    /\.aspx$/i,
    /cgi-bin/i,
    /phpmyadmin/i,
    /config\.json$/i,
    /config\.php$/i,
    /setup\.php$/i,
    /install\.php$/i,
    /console/i,
    /debug/i,
    /heartbeat/i, // Specific check from logs
    /ismustmobile/i, // Specific check from logs
    /getHome/i, // Specific check from logs
];

// IP Blocklist (In-memory for session)
const bannedIPs = new Map();
const BAN_THRESHOLD = 3; // Number of rogue hits before ban
const BAN_DURATION = 1000 * 60 * 60 * 24; // 24 hours

/**
 * Middleware to block IPs that hit known malicious paths
 */
const roguePathBlocker = (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const url = req.originalUrl || req.url;

    // Check if IP is already banned
    if (bannedIPs.has(ip)) {
        const banInfo = bannedIPs.get(ip);
        if (Date.now() < banInfo.expiry) {
            console.warn(`[Security] Blocked request from banned IP: ${ip} for ${url}`);
            return res.status(403).end();
        } else {
            bannedIPs.delete(ip); // Ban expired
        }
    }

    // Check if path is rogue
    const isRogue = ROGUE_PATTERNS.some(pattern => pattern.test(url));

    if (isRogue) {
        // Track rogue hits for this IP
        const hits = (bannedIPs.get(ip)?.hits || 0) + 1;

        if (hits >= BAN_THRESHOLD) {
            console.error(`[Security] BANNING IP: ${ip} for ${hits} rogue hits. Last path: ${url}`);
            bannedIPs.set(ip, {
                hits,
                expiry: Date.now() + BAN_DURATION,
                lastPath: url
            });
        } else {
            console.warn(`[Security] Rogue path hit detected from ${ip}: ${url} (Hit ${hits}/${BAN_THRESHOLD})`);
            bannedIPs.set(ip, {
                hits,
                expiry: Date.now() + 60000, // Short temporary block
                lastPath: url
            });
        }

        return res.status(403).json({
            error: 'Forbidden',
            message: 'Access denied for security reasons.'
        });
    }

    next();
};

const getBannedIPs = () => {
    const list = [];
    const now = Date.now();
    for (const [ip, info] of bannedIPs.entries()) {
        if (now < info.expiry) {
            list.push({
                ip,
                hits: info.hits,
                expiresIn: Math.round((info.expiry - now) / 1000 / 60) + ' minutes',
                lastPath: info.lastPath
            });
        }
    }
    return list;
};

module.exports = {
    roguePathBlocker,
    getBannedIPs
};
