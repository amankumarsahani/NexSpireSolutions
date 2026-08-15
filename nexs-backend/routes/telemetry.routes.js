const express = require('express');
const router = express.Router();
const { randomUUID } = require('crypto');
const axios = require('axios');
const geoip = require('geoip-lite');
const { query } = require('../config/database');
const { decryptPayload } = require('../utils/telemetry-crypto');
const { UAParser } = require('ua-parser-js');
const jwt = require('jsonwebtoken');

const TELEMETRY_SECRET = process.env.PUBLIC_CRYPTO_SECRET || process.env.VITE_PUBLIC_CRYPTO_SECRET || '';

// ISO 3166-2 codes → full names (for geoip-lite local fallback)
const REGION_NAMES = {
    IN: {
        AN:'Andaman and Nicobar Islands', AP:'Andhra Pradesh', AR:'Arunachal Pradesh',
        AS:'Assam', BR:'Bihar', CH:'Chandigarh', CT:'Chhattisgarh',
        DH:'Dadra and Nagar Haveli and Daman and Diu', DL:'Delhi', GA:'Goa',
        GJ:'Gujarat', HP:'Himachal Pradesh', HR:'Haryana', JH:'Jharkhand',
        JK:'Jammu and Kashmir', KA:'Karnataka', KL:'Kerala', LA:'Ladakh',
        LD:'Lakshadweep', MH:'Maharashtra', ML:'Meghalaya', MN:'Manipur',
        MP:'Madhya Pradesh', MZ:'Mizoram', NL:'Nagaland', OR:'Odisha',
        PB:'Punjab', PY:'Puducherry', RJ:'Rajasthan', SK:'Sikkim',
        TG:'Telangana', TN:'Tamil Nadu', TR:'Tripura', UP:'Uttar Pradesh',
        UT:'Uttarakhand', WB:'West Bengal',
    },
    US: {
        AL:'Alabama', AK:'Alaska', AZ:'Arizona', AR:'Arkansas', CA:'California',
        CO:'Colorado', CT:'Connecticut', DE:'Delaware', FL:'Florida', GA:'Georgia',
        HI:'Hawaii', ID:'Idaho', IL:'Illinois', IN:'Indiana', IA:'Iowa',
        KS:'Kansas', KY:'Kentucky', LA:'Louisiana', ME:'Maine', MD:'Maryland',
        MA:'Massachusetts', MI:'Michigan', MN:'Minnesota', MS:'Mississippi',
        MO:'Missouri', MT:'Montana', NE:'Nebraska', NV:'Nevada',
        NH:'New Hampshire', NJ:'New Jersey', NM:'New Mexico', NY:'New York',
        NC:'North Carolina', ND:'North Dakota', OH:'Ohio', OK:'Oklahoma',
        OR:'Oregon', PA:'Pennsylvania', RI:'Rhode Island', SC:'South Carolina',
        SD:'South Dakota', TN:'Tennessee', TX:'Texas', UT:'Utah', VT:'Vermont',
        VA:'Virginia', WA:'Washington', WV:'West Virginia', WI:'Wisconsin',
        WY:'Wyoming', DC:'Washington D.C.',
    },
    GB: {
        ENG:'England', SCT:'Scotland', WLS:'Wales', NIR:'Northern Ireland',
    },
    CA: {
        AB:'Alberta', BC:'British Columbia', MB:'Manitoba', NB:'New Brunswick',
        NL:'Newfoundland and Labrador', NS:'Nova Scotia', NT:'Northwest Territories',
        NU:'Nunavut', ON:'Ontario', PE:'Prince Edward Island', QC:'Quebec',
        SK:'Saskatchewan', YT:'Yukon',
    },
    AU: {
        ACT:'Australian Capital Territory', NSW:'New South Wales', NT:'Northern Territory',
        QLD:'Queensland', SA:'South Australia', TAS:'Tasmania', VIC:'Victoria',
        WA:'Western Australia',
    },
    DE: {
        BB:'Brandenburg', BE:'Berlin', BW:'Baden-Württemberg', BY:'Bavaria',
        HB:'Bremen', HE:'Hesse', HH:'Hamburg', MV:'Mecklenburg-Vorpommern',
        NI:'Lower Saxony', NW:'North Rhine-Westphalia', RP:'Rhineland-Palatinate',
        SH:'Schleswig-Holstein', SL:'Saarland', SN:'Saxony', ST:'Saxony-Anhalt',
        TH:'Thuringia',
    },
};

// ── Geo cache (in-process, 24 h TTL) ─────────────────────────────────────
// Keyed by cleaned IP. Avoids hitting ip-api.com / ipinfo.io on repeat visits.
const _geoCache  = new Map();
const GEO_TTL_MS = 24 * 60 * 60 * 1000; // 24 h

function geoCacheGet(ip) {
    const entry = _geoCache.get(ip);
    if (entry && entry.expiresAt > Date.now()) return entry.data;
    if (entry) _geoCache.delete(ip); // evict expired
    return null;
}
function geoCacheSet(ip, data) {
    // Prevent unbounded growth — cap at 50 k entries (~15 MB worst-case)
    if (_geoCache.size >= 50_000) {
        const firstKey = _geoCache.keys().next().value;
        _geoCache.delete(firstKey);
    }
    _geoCache.set(ip, { data, expiresAt: Date.now() + GEO_TTL_MS });
}

// ── Visitor IP extraction ──────────────────────────────────────────────────
function getVisitorIp(req) {
    return (
        req.headers['cf-connecting-ip'] ||
        req.headers['x-real-ip'] ||
        req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
        req.ip ||
        req.socket.remoteAddress ||
        null
    );
}

// ── Local synchronous geo (geoip-lite) ────────────────────────────────────
const PRIVATE_IP_RE = /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::1$|localhost)/;

function resolveGeoLocal(ip) {
    if (!ip || PRIVATE_IP_RE.test(ip)) return null;
    const cleanIp = ip.replace(/^::ffff:/, '');

    const cached = geoCacheGet(`local:${cleanIp}`);
    if (cached) return cached;

    const geo = geoip.lookup(cleanIp);
    if (!geo) return null;
    const cc = geo.country || null;
    const rc = geo.region  || null;
    const result = {
        country:  cc,
        region:   (cc && rc) ? (REGION_NAMES[cc]?.[rc] || rc) : null,
        city:     geo.city    || null,
        lat:      geo.ll?.[0] ?? null,
        lon:      geo.ll?.[1] ?? null,
        timezone: geo.timezone || null,
        isp:      null,
    };

    geoCacheSet(`local:${cleanIp}`, result);
    return result;
}

// ── Remote geo chain: ip-api.com → ipinfo.io ─────────────────────────────
async function resolveGeoRemote(ip) {
    if (!ip || PRIVATE_IP_RE.test(ip)) return null;
    const cleanIp = ip.replace(/^::ffff:/, '');

    // Return cached result immediately — avoids redundant HTTP calls
    const cached = geoCacheGet(`remote:${cleanIp}`);
    if (cached) return cached;

    // 1. ip-api.com — best data (ISP, full region name, lat/lon)
    try {
        const { data } = await axios.get(
            `http://ip-api.com/json/${encodeURIComponent(cleanIp)}`,
            {
                params: { fields: 'status,countryCode,regionName,city,lat,lon,timezone,isp' },
                timeout: 3500,
            }
        );
        if (data?.status === 'success') {
            const result = {
                country:  data.countryCode || null,
                region:   data.regionName  || null,
                city:     data.city        || null,
                lat:      data.lat         ?? null,
                lon:      data.lon         ?? null,
                timezone: data.timezone    || null,
                isp:      data.isp         || null,
            };
            geoCacheSet(`remote:${cleanIp}`, result);
            return result;
        }
    } catch (err) {
        console.error(`[Telemetry] ip-api.com geo lookup failed for ${cleanIp}:`, err.message);
    }

    // 2. ipinfo.io — free, no key, full region names
    try {
        const { data } = await axios.get(
            `https://ipinfo.io/${encodeURIComponent(cleanIp)}/json`,
            { timeout: 3500 }
        );
        if (data?.country) {
            const [rawLat, rawLon] = (data.loc || '').split(',').map(Number);
            const result = {
                country:  data.country  || null,
                region:   data.region   || null,
                city:     data.city     || null,
                lat:      isNaN(rawLat) ? null : rawLat,
                lon:      isNaN(rawLon) ? null : rawLon,
                timezone: data.timezone || null,
                isp:      data.org      || null,
            };
            geoCacheSet(`remote:${cleanIp}`, result);
            return result;
        }
    } catch (err) {
        console.error(`[Telemetry] ipinfo.io geo lookup failed for ${cleanIp}:`, err.message);
    }

    return null;
}

// ── POST / ─────────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
    try {
        const { p } = req.body;
        if (!p) return res.status(400).json({ ok: false, error: 'invalid_payload' });

        let body;
        try {
            body = decryptPayload(p, TELEMETRY_SECRET);
        } catch (_) {
            return res.status(400).json({ ok: false, error: 'decryption_failed' });
        }

        if (!body.path || !body.session_id) {
            return res.status(400).json({ ok: false, error: 'missing_required_fields' });
        }

        const userAgent = req.headers['user-agent'] || '';
        const ua = new UAParser(userAgent).getResult();
        const visitorIp = getVisitorIp(req);

        // Cloudflare-supplied country is most accurate behind CDN
        const cfCountry = req.headers['cf-ipcountry'] || req.headers['x-vercel-ip-country'] || null;

        // Synchronous local lookup for immediate INSERT
        const local = resolveGeoLocal(visitorIp);

        // Resolve User ID (optional JWT)
        let userId = null;
        const authHeader = req.headers['authorization'] || '';
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                userId = decoded.id || decoded.userId || null;
            } catch (err) {
                console.error('[Telemetry] Failed to verify optional JWT on telemetry event:', err.message);
            }
        }

        const id = randomUUID();

        // INSERT immediately using local geo as baseline
        await query(`
            INSERT INTO telemetry (
                id, user_id, ip_address,
                session_id, path, event_type, referrer,
                browser, browser_version, engine, engine_version,
                os, os_version, device_type, device_vendor, device_model,
                cpu, ua_string,
                country, city, region, latitude, longitude, timezone, isp,
                language, screen_size, metadata
            ) VALUES (
                ?, ?, ?,
                ?, ?, ?, ?,
                ?, ?, ?, ?,
                ?, ?, ?, ?, ?,
                ?, ?,
                ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?
            )
        `, [
            id, userId, visitorIp,
            body.session_id, body.path, body.event_type || 'view', body.referrer || null,
            ua.browser.name || null, ua.browser.version || null,
            ua.engine.name  || null, ua.engine.version  || null,
            ua.os.name      || null, ua.os.version      || null,
            ua.device.type  || 'desktop', ua.device.vendor || null, ua.device.model || null,
            ua.cpu.architecture || null, userAgent,
            cfCountry || local?.country || null,
            local?.city     || null,
            local?.region   || null,
            local?.lat      ?? null,
            local?.lon      ?? null,
            local?.timezone || null,
            null, // isp — enriched in background
            body.language    || null,
            body.screen_size || null,
            JSON.stringify(body.metadata || {}),
        ]);

        // Respond immediately — don't block on remote lookup
        res.status(200).json({ ok: true });

        // Background: enrich with better geo from ip-api.com / ipinfo.io
        setImmediate(async () => {
            try {
                const remote = await resolveGeoRemote(visitorIp);
                if (!remote) return;

                await query(`
                    UPDATE telemetry
                    SET
                        country   = COALESCE(country, ?),
                        region    = ?,
                        city      = ?,
                        latitude  = ?,
                        longitude = ?,
                        timezone  = ?,
                        isp       = ?
                    WHERE id = ?
                `, [
                    remote.country,
                    remote.region,
                    remote.city,
                    remote.lat,
                    remote.lon,
                    remote.timezone,
                    remote.isp,
                    id,
                ]);
            } catch (err) {
                console.error('[telemetry] geo enrichment failed:', err.message);
            }
        });

    } catch (err) {
        console.error('[telemetry] unexpected error:', err);
        if (!res.headersSent) {
            res.status(500).json({ ok: false, error: 'server_error' });
        }
    }
});

module.exports = router;
