/**
 * Meta Lead Ads — control-plane internal endpoints.  /api/admin/meta-leads
 *
 * Called server-to-server by a tenant's nexcrm-backend (metaLeadAds adapter),
 * authenticated by the shared INTERNAL_OAUTH_KEY — NOT admin auth, since the
 * caller is another service, not a logged-in admin. The consent + subscription
 * side of the flow lives in routes/oauth.routes.js; this only handles teardown.
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');
const { pool } = require('../config/database');
const { decryptSecret } = require('../services/secretStore');

const INTERNAL_OAUTH_KEY = process.env.INTERNAL_OAUTH_KEY;

router.use((req, res, next) => {
    if (!INTERNAL_OAUTH_KEY || req.headers['x-internal-key'] !== INTERNAL_OAUTH_KEY) {
        return res.status(403).json({ error: 'Invalid internal key' });
    }
    next();
});

// POST /api/admin/meta-leads/unregister  { pageId }
// Tenant disconnected the Page: stop delivering its leads. Unsubscribe the app
// from the Page's leadgen field (best-effort) and mark the registry row revoked.
router.post('/unregister', async (req, res) => {
    const { pageId } = req.body || {};
    if (!pageId) return res.status(400).json({ error: 'pageId required' });

    try {
        const [rows] = await pool.query(
            `SELECT page_token_encrypted FROM meta_page_registry WHERE page_id = ?`,
            [String(pageId)]
        );

        if (rows.length) {
            const pageToken = decryptSecret(rows[0].page_token_encrypted);
            if (pageToken) {
                await axios.delete(`https://graph.facebook.com/v21.0/${pageId}/subscribed_apps`, {
                    params: { access_token: pageToken },
                    timeout: 10000
                }).catch(e => console.error('[meta-leads] unsubscribe failed:', e.response?.data?.error?.message || e.message));
            }
        }

        await pool.query(
            `UPDATE meta_page_registry SET status = 'revoked' WHERE page_id = ?`,
            [String(pageId)]
        );
        res.json({ success: true });
    } catch (err) {
        console.error('[meta-leads] unregister failed:', err.message);
        res.status(500).json({ error: 'Failed to unregister page' });
    }
});

module.exports = router;
