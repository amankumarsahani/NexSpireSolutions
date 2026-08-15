const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const aiService = require('../services/ai.service');
const brand = require('../config/brand');

const dateClause = (range) => {
    const map = {
        '7d':  'DATE_SUB(NOW(), INTERVAL 7 DAY)',
        '30d': 'DATE_SUB(NOW(), INTERVAL 30 DAY)',
        '90d': 'DATE_SUB(NOW(), INTERVAL 90 DAY)',
    };
    return map[range] ? `AND created_at >= ${map[range]}` : '';
};

// ── GET /overview ──────────────────────────────────────────────────────────
router.get('/overview', async (req, res) => {
    try {
        const df = dateClause(req.query.range);

        const [[views]]    = await query(`SELECT COUNT(*) AS n FROM telemetry WHERE event_type='view' ${df}`);
        const [[sessions]] = await query(`SELECT COUNT(DISTINCT session_id) AS n FROM telemetry WHERE 1=1 ${df}`);
        const [[clicks]]   = await query(`SELECT COUNT(*) AS n FROM telemetry WHERE event_type='click' ${df}`);
        const [[countries]]= await query(`SELECT COUNT(DISTINCT country) AS n FROM telemetry WHERE country IS NOT NULL ${df}`);
        const [topCountryRows] = await query(
            `SELECT country, COUNT(*) AS n FROM telemetry WHERE country IS NOT NULL ${df} GROUP BY country ORDER BY n DESC LIMIT 1`
        );

        // avg pages per session
        const [[avgRow]] = await query(`
            SELECT ROUND(AVG(pc), 1) AS avg FROM (
                SELECT session_id, COUNT(*) AS pc
                FROM telemetry WHERE event_type='view' ${df}
                GROUP BY session_id
            ) t
        `);

        // bounce rate: sessions with only 1 page view
        const [[bounceRow]] = await query(`
            SELECT
                COUNT(*) AS total,
                SUM(CASE WHEN pc = 1 THEN 1 ELSE 0 END) AS bounces
            FROM (
                SELECT session_id, COUNT(*) AS pc
                FROM telemetry WHERE event_type='view' ${df}
                GROUP BY session_id
            ) t
        `);

        const bounceRate = bounceRow.total > 0
            ? Math.round((bounceRow.bounces / bounceRow.total) * 100)
            : 0;

        res.json({
            pageViews:          views.n,
            uniqueSessions:     sessions.n,
            clickEvents:        clicks.n,
            uniqueCountries:    countries.n,
            topCountry:         topCountryRows[0]?.country || 'N/A',
            avgPagesPerSession: avgRow.avg || 0,
            bounceRate,
        });
    } catch (err) {
        console.error('[site-analytics] overview error:', err);
        res.status(500).json({ error: 'Failed to fetch overview' });
    }
});

// ── GET /time-series ───────────────────────────────────────────────────────
router.get('/time-series', async (req, res) => {
    try {
        const df = dateClause(req.query.range);

        const [rows] = await query(`
            SELECT
                DATE(created_at) AS date,
                SUM(CASE WHEN event_type='view'  THEN 1 ELSE 0 END) AS views,
                SUM(CASE WHEN event_type='click' THEN 1 ELSE 0 END) AS clicks
            FROM telemetry
            WHERE 1=1 ${df}
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `);

        res.json(rows.map(r => ({
            date:   r.date instanceof Date ? r.date.toISOString().slice(0,10) : String(r.date),
            views:  Number(r.views),
            clicks: Number(r.clicks),
        })));
    } catch (err) {
        console.error('[site-analytics] time-series error:', err);
        res.status(500).json({ error: 'Failed to fetch time series' });
    }
});

// ── GET /pages ─────────────────────────────────────────────────────────────
router.get('/pages', async (req, res) => {
    try {
        const df = dateClause(req.query.range);

        const [rows] = await query(`
            SELECT
                SUBSTRING_INDEX(path, '?', 1) AS path,
                COUNT(*) AS views,
                COUNT(DISTINCT session_id) AS unique_sessions
            FROM telemetry
            WHERE event_type='view' ${df}
            GROUP BY SUBSTRING_INDEX(path, '?', 1)
            ORDER BY views DESC
            LIMIT 20
        `);

        res.json(rows);
    } catch (err) {
        console.error('[site-analytics] pages error:', err);
        res.status(500).json({ error: 'Failed to fetch pages' });
    }
});

// ── GET /traffic-sources ───────────────────────────────────────────────────
router.get('/traffic-sources', async (req, res) => {
    try {
        const df = dateClause(req.query.range);

        const [rows] = await query(`
            SELECT
                CASE
                    WHEN referrer IS NULL OR referrer = 'direct' OR referrer = '' THEN 'Direct'
                    WHEN referrer REGEXP 'google|bing|yahoo|duckduckgo|yandex|baidu' THEN 'Organic Search'
                    WHEN referrer REGEXP 'facebook\\.com|twitter\\.com|linkedin\\.com|instagram\\.com|t\\.co|pinterest' THEN 'Social Media'
                    WHEN referrer REGEXP 'napnix\\.in' THEN 'Internal'
                    ELSE 'Referral'
                END AS source,
                COUNT(*) AS count,
                COUNT(DISTINCT session_id) AS sessions
            FROM telemetry
            WHERE 1=1 ${df}
            GROUP BY source
            ORDER BY count DESC
        `);

        res.json(rows);
    } catch (err) {
        console.error('[site-analytics] traffic-sources error:', err);
        res.status(500).json({ error: 'Failed to fetch traffic sources' });
    }
});

// ── GET /devices ───────────────────────────────────────────────────────────
router.get('/devices', async (req, res) => {
    try {
        const df = dateClause(req.query.range);

        const [deviceRows] = await query(`
            SELECT COALESCE(device_type, 'desktop') AS label, COUNT(*) AS count
            FROM telemetry WHERE 1=1 ${df}
            GROUP BY label ORDER BY count DESC
        `);

        const [browserRows] = await query(`
            SELECT COALESCE(browser, 'Unknown') AS label, COUNT(*) AS count
            FROM telemetry WHERE 1=1 ${df}
            GROUP BY label ORDER BY count DESC LIMIT 8
        `);

        const [osRows] = await query(`
            SELECT COALESCE(os, 'Unknown') AS label, COUNT(*) AS count
            FROM telemetry WHERE 1=1 ${df}
            GROUP BY label ORDER BY count DESC LIMIT 8
        `);

        const [screenRows] = await query(`
            SELECT COALESCE(screen_size, 'Unknown') AS label, COUNT(*) AS count
            FROM telemetry WHERE screen_size IS NOT NULL ${df}
            GROUP BY label ORDER BY count DESC LIMIT 8
        `);

        res.json({
            deviceTypes: deviceRows,
            browsers:    browserRows,
            operatingSystems: osRows,
            screenSizes: screenRows,
        });
    } catch (err) {
        console.error('[site-analytics] devices error:', err);
        res.status(500).json({ error: 'Failed to fetch device breakdown' });
    }
});

// ── GET /geography ─────────────────────────────────────────────────────────
router.get('/geography', async (req, res) => {
    try {
        const df = dateClause(req.query.range);

        const [rows] = await query(`
            SELECT
                COALESCE(country, 'Unknown') AS country,
                city,
                COUNT(*) AS events,
                COUNT(DISTINCT session_id) AS sessions
            FROM telemetry
            WHERE country IS NOT NULL ${df}
            GROUP BY country, city
            ORDER BY events DESC
            LIMIT 30
        `);

        // Group by country for the chart
        const countryMap = {};
        for (const r of rows) {
            if (!countryMap[r.country]) {
                countryMap[r.country] = { country: r.country, events: 0, sessions: 0 };
            }
            countryMap[r.country].events   += Number(r.events);
            countryMap[r.country].sessions += Number(r.sessions);
        }

        const countries = Object.values(countryMap)
            .sort((a, b) => b.events - a.events)
            .slice(0, 20);

        res.json({ countries, cities: rows.slice(0, 20) });
    } catch (err) {
        console.error('[site-analytics] geography error:', err);
        res.status(500).json({ error: 'Failed to fetch geography' });
    }
});

// ── GET /journey ───────────────────────────────────────────────────────────
router.get('/journey', async (req, res) => {
    try {
        const df = dateClause(req.query.range);

        // Recent sessions with their page paths
        const [rows] = await query(`
            SELECT
                session_id,
                GROUP_CONCAT(
                    CASE WHEN event_type='view' THEN SUBSTRING_INDEX(path, '?', 1) END
                    ORDER BY created_at
                    SEPARATOR ' → '
                ) AS journey,
                COUNT(DISTINCT CASE WHEN event_type='view' THEN path END) AS unique_pages,
                COUNT(*) AS total_events,
                MIN(created_at) AS session_start,
                MAX(created_at) AS session_end,
                COALESCE(MAX(browser), 'Unknown') AS browser,
                COALESCE(MAX(device_type), 'desktop') AS device_type,
                COALESCE(MAX(country), 'Unknown') AS country,
                COALESCE(MAX(os), 'Unknown') AS os
            FROM telemetry
            WHERE 1=1 ${df}
            GROUP BY session_id
            ORDER BY session_start DESC
            LIMIT 50
        `);

        // Top entry pages
        const [entryRows] = await query(`
            SELECT SUBSTRING_INDEX(path, '?', 1) AS path, COUNT(*) AS count
            FROM (
                SELECT session_id, MIN(created_at) AS first_event FROM telemetry WHERE event_type='view' ${df} GROUP BY session_id
            ) sess
            JOIN telemetry t ON t.session_id = sess.session_id AND t.created_at = sess.first_event AND t.event_type='view'
            GROUP BY SUBSTRING_INDEX(path, '?', 1) ORDER BY count DESC LIMIT 10
        `);

        // Top exit pages
        const [exitRows] = await query(`
            SELECT SUBSTRING_INDEX(path, '?', 1) AS path, COUNT(*) AS count
            FROM (
                SELECT session_id, MAX(created_at) AS last_event FROM telemetry WHERE event_type='view' ${df} GROUP BY session_id
            ) sess
            JOIN telemetry t ON t.session_id = sess.session_id AND t.created_at = sess.last_event AND t.event_type='view'
            GROUP BY SUBSTRING_INDEX(path, '?', 1) ORDER BY count DESC LIMIT 10
        `);

        res.json({
            sessions:   rows,
            entryPages: entryRows,
            exitPages:  exitRows,
        });
    } catch (err) {
        console.error('[site-analytics] journey error:', err);
        res.status(500).json({ error: 'Failed to fetch journey data' });
    }
});

// ── GET /events ────────────────────────────────────────────────────────────
router.get('/events', async (req, res) => {
    try {
        const df = dateClause(req.query.range);

        // Recent click events
        const [recent] = await query(`
            SELECT SUBSTRING_INDEX(path, '?', 1) AS path, event_type, metadata, created_at, browser, device_type, country
            FROM telemetry
            WHERE event_type='click' ${df}
            ORDER BY created_at DESC
            LIMIT 100
        `);

        // Top clicked elements (parse metadata on Node side)
        const [rawClicks] = await query(`
            SELECT SUBSTRING_INDEX(path, '?', 1) AS path, metadata, COUNT(*) AS click_count
            FROM telemetry
            WHERE event_type='click' AND metadata IS NOT NULL AND metadata != '{}' ${df}
            GROUP BY SUBSTRING_INDEX(path, '?', 1), metadata
            ORDER BY click_count DESC
            LIMIT 200
        `);

        const elemMap = new Map();
        for (const row of rawClicks) {
            try {
                const meta = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata;
                const key = `${row.path}||${meta.element || ''}||${(meta.text || '').slice(0, 50)}`;
                const prev = elemMap.get(key) || {
                    path:    row.path,
                    element: meta.element || 'unknown',
                    text:    (meta.text || '').slice(0, 60),
                    href:    meta.href || null,
                    count:   0,
                };
                prev.count += Number(row.click_count);
                elemMap.set(key, prev);
            } catch (err) {
                console.error(`[site-analytics] Failed to parse click metadata for path ${row.path}:`, err.message);
            }
        }

        const topElements = [...elemMap.values()]
            .sort((a, b) => b.count - a.count)
            .slice(0, 20);

        res.json({
            recentEvents: recent.map(r => ({
                path:       r.path,
                event_type: r.event_type,
                metadata:   (() => { try { return typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata; } catch (_) { return {}; } })(),
                created_at: r.created_at,
                browser:    r.browser,
                device_type: r.device_type,
                country:    r.country,
            })),
            topElements,
        });
    } catch (err) {
        console.error('[site-analytics] events error:', err);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
});

// ── GET /heatmap ───────────────────────────────────────────────────────────
router.get('/heatmap', async (req, res) => {
    try {
        const { page, range } = req.query;
        const df = dateClause(range);

        // All pages that have click data (for the selector dropdown)
        const [availablePages] = await query(`
            SELECT SUBSTRING_INDEX(path, '?', 1) AS path, COUNT(*) AS clicks
            FROM telemetry
            WHERE event_type='click' ${df}
            GROUP BY SUBSTRING_INDEX(path, '?', 1)
            ORDER BY clicks DESC
        `);

        if (!page) {
            return res.json({ availablePages, points: [], totalClicks: 0 });
        }

        // Raw clicks for this page with x/y in metadata
        const [rows] = await query(`
            SELECT metadata, screen_size, COUNT(*) AS cnt
            FROM telemetry
            WHERE event_type='click'
              AND SUBSTRING_INDEX(path, '?', 1) = ?
              AND metadata IS NOT NULL
              AND metadata != '{}'
              ${df}
            GROUP BY metadata, screen_size
        `, [page]);

        // Most common screen size for this page (use as reference viewport)
        const [screenRows] = await query(`
            SELECT screen_size, COUNT(*) AS n
            FROM telemetry
            WHERE event_type='click' AND SUBSTRING_INDEX(path, '?', 1) = ? ${df}
            GROUP BY screen_size ORDER BY n DESC LIMIT 1
        `, [page]);

        const refSize = (screenRows[0]?.screen_size || '1280x800').split('x');
        const refW = Number(refSize[0]) || 1280;
        const refH = Number(refSize[1]) || 800;

        // Aggregate by normalised coordinate
        const pointMap = new Map();
        let totalClicks = 0;

        for (const row of rows) {
            try {
                const meta = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata;
                if (typeof meta.x !== 'number' || typeof meta.y !== 'number') continue;

                const [sw, sh] = (row.screen_size || `${refW}x${refH}`).split('x').map(Number);
                const nx = Math.round((meta.x / (sw || refW)) * refW);
                const ny = Math.round((meta.y / (sh || refH)) * refH);

                const key = `${nx},${ny}`;
                const prev = pointMap.get(key) || {
                    x: nx, y: ny, count: 0,
                    element: meta.element || 'unknown',
                    text:    (meta.text || '').slice(0, 60),
                    href:    meta.href || null,
                };
                prev.count += Number(row.cnt);
                totalClicks += Number(row.cnt);
                pointMap.set(key, prev);
            } catch (err) {
                console.error(`[site-analytics] Failed to parse heatmap click metadata for page ${page}:`, err.message);
            }
        }

        res.json({
            page,
            totalClicks,
            viewportWidth:  refW,
            viewportHeight: refH,
            points:         [...pointMap.values()].sort((a, b) => b.count - a.count),
            availablePages,
        });
    } catch (err) {
        console.error('[site-analytics] heatmap error:', err);
        res.status(500).json({ error: 'Failed to fetch heatmap data' });
    }
});

// ── POST /ai-insights ──────────────────────────────────────────────────────
router.post('/ai-insights', async (req, res) => {
    try {
        const { analytics } = req.body;
        if (!analytics) {
            return res.status(400).json({ error: 'analytics data required' });
        }

        const systemMessage = `You are a senior conversion rate optimization specialist and web analytics expert for Napnix, a B2B digital agency offering SaaS products (NexCRM), web development, and digital solutions.

Your goal is to analyze website telemetry data and provide deeply actionable recommendations specifically aimed at improving LEAD CAPTURING and CONVERSION RATES from visitors.

Keep recommendations specific, prioritized, and tied to real observations from the data. Format your response with clear sections using markdown headers (##).`;

        const topPages = (analytics.pages || []).slice(0, 8)
            .map(p => `  - ${p.path}: ${p.views} views, ${p.unique_sessions} sessions`)
            .join('\n');

        const topJourneys = (analytics.journeySessions || []).slice(0, 5)
            .map(s => `  - ${s.journey || 'single page'} (${s.unique_pages} pages, ${s.country})`)
            .join('\n');

        const topClicks = (analytics.topElements || []).slice(0, 8)
            .map(e => `  - "${e.text || e.element}" on ${e.path} → ${e.count} clicks${e.href ? ` (→ ${e.href})` : ''}`)
            .join('\n');

        const prompt = `Analyze this website telemetry data for ${brand.baseDomain} and provide insights:

## OVERVIEW (last ${analytics.range || '30'} days)
- Page Views: ${analytics.overview?.pageViews || 0}
- Unique Sessions: ${analytics.overview?.uniqueSessions || 0}
- Click Events: ${analytics.overview?.clickEvents || 0}
- Bounce Rate: ${analytics.overview?.bounceRate || 0}%
- Avg Pages/Session: ${analytics.overview?.avgPagesPerSession || 0}
- Countries Reached: ${analytics.overview?.uniqueCountries || 0}
- Top Country: ${analytics.overview?.topCountry || 'N/A'}

## TOP PAGES (by views)
${topPages || '  No data'}

## TRAFFIC SOURCES
${(analytics.sources || []).map(s => `  - ${s.source}: ${s.count} events, ${s.sessions} sessions`).join('\n') || '  No data'}

## DEVICE BREAKDOWN
${(analytics.devices?.deviceTypes || []).map(d => `  - ${d.label}: ${d.count}`).join('\n') || '  No data'}
Top Browser: ${analytics.devices?.browsers?.[0]?.label || 'Unknown'}
Top OS: ${analytics.devices?.operatingSystems?.[0]?.label || 'Unknown'}

## TOP COUNTRIES
${(analytics.geography?.countries || []).slice(0, 5).map(c => `  - ${c.country}: ${c.sessions} sessions`).join('\n') || '  No data'}

## COMMON USER JOURNEYS
${topJourneys || '  No data'}

## TOP CLICKED ELEMENTS
${topClicks || '  No data'}

---

Please provide:

## Key Observations
(3-5 bullets about what the data reveals)

## Critical Drop-off Points
(where visitors are leaving or not converting)

## Top 5 Recommendations to Improve Lead Capturing
(numbered, each with: what to do, why, expected impact High/Medium/Low)

## Quick Wins (This Week)
(2-3 fast changes that can be implemented immediately)

## User Journey Insights
(how visitors navigate the site and what this means for conversion)

Be specific to Napnix' business context — a B2B agency selling NexCRM and digital services.`;

        const insight = await aiService.generateContent(prompt, systemMessage);
        res.json({ insight });
    } catch (err) {
        console.error('[site-analytics] ai-insights error:', err);
        res.status(500).json({ error: err.message || 'AI analysis failed' });
    }
});

module.exports = router;
