const crypto = require('crypto');
const db = require('../config/database');

const SEO_SETTINGS_KEYS = [
    'seo_auto_index',
    'seo_engines',
    'indexnow_key',
    'google_service_account_json',
    'website_url',
];

class SEOIndexingService {
    constructor() {
        this._cachedSettings = null;
        this._cacheTime = 0;
        this._googleIndexing = null;
    }

    async _getSettings() {
        const now = Date.now();
        if (this._cachedSettings && (now - this._cacheTime) < 60000) {
            return this._cachedSettings;
        }

        try {
            const placeholders = SEO_SETTINGS_KEYS.map(() => '?').join(',');
            const [rows] = await db.query(
                `SELECT setting_key, setting_value FROM settings WHERE setting_key IN (${placeholders})`,
                SEO_SETTINGS_KEYS
            );

            const map = {};
            for (const row of rows) {
                map[row.setting_key] = row.setting_value;
            }

            this._cachedSettings = map;
            this._cacheTime = now;
            return map;
        } catch {
            return {};
        }
    }

    _clearCache() {
        this._cachedSettings = null;
        this._cacheTime = 0;
        this._googleIndexing = null;
    }

    async getSiteUrl() {
        const s = await this._getSettings();
        return s.website_url || process.env.WEBSITE_URL || process.env.FRONTEND_URL || 'https://nexspiresolutions.co.in';
    }

    async getSiteHost() {
        const url = await this.getSiteUrl();
        try { return new URL(url).hostname; } catch { return 'nexspiresolutions.co.in'; }
    }

    async getIndexNowKey() {
        const s = await this._getSettings();
        if (s.indexnow_key) return s.indexnow_key;
        if (process.env.INDEXNOW_KEY) return process.env.INDEXNOW_KEY;
        return crypto.randomBytes(16).toString('hex');
    }

    async isAutoIndexEnabled() {
        const s = await this._getSettings();
        if (s.seo_auto_index !== undefined) return s.seo_auto_index !== 'false';
        return true;
    }

    async getEnabledEngines() {
        const s = await this._getSettings();
        if (s.seo_engines) {
            try { return JSON.parse(s.seo_engines); } catch { /* fall through */ }
        }
        return ['indexnow', 'google', 'websub'];
    }

    async getGoogleCredentials() {
        const s = await this._getSettings();
        if (s.google_service_account_json) return s.google_service_account_json;
        if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) return process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
        if (process.env.GOOGLE_SERVICE_ACCOUNT_PATH) return `file:${process.env.GOOGLE_SERVICE_ACCOUNT_PATH}`;
        return null;
    }

    // ============================================
    // INDEXNOW
    // ============================================

    async notifyIndexNow(urls, overrides = {}) {
        const urlList = Array.isArray(urls) ? urls : [urls];
        if (urlList.length === 0) return { success: false, reason: 'no_urls' };

        const siteUrl = overrides.websiteUrl || await this.getSiteUrl();
        const host = new URL(siteUrl).hostname;
        const key = overrides.indexnowKey || await this.getIndexNowKey();

        const absoluteUrls = urlList.map(u => u.startsWith('/') ? `${siteUrl}${u}` : u);

        try {
            const response = await fetch('https://api.indexnow.org/IndexNow', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json; charset=utf-8' },
                body: JSON.stringify({
                    host,
                    key,
                    keyLocation: `${siteUrl}/${key}.txt`,
                    urlList: absoluteUrls,
                }),
            });

            const status = response.status;
            console.log(`[SEO-IndexNow] Submitted ${absoluteUrls.length} URL(s) — HTTP ${status}`);
            return { success: status === 200 || status === 202, status, urlCount: absoluteUrls.length };
        } catch (error) {
            console.warn('[SEO-IndexNow] Submission error:', error.message);
            return { success: false, error: error.message };
        }
    }

    // ============================================
    // GOOGLE INDEXING API
    // ============================================

    async _getGoogleIndexingClient(overrideJson) {
        // If override provided, create a fresh client (don't cache — different creds per node)
        if (overrideJson) {
            try {
                const { google } = require('googleapis');
                const creds = typeof overrideJson === 'string' ? JSON.parse(overrideJson) : overrideJson;
                const auth = new google.auth.GoogleAuth({
                    credentials: creds,
                    scopes: ['https://www.googleapis.com/auth/indexing'],
                });
                return google.indexing({ version: 'v3', auth });
            } catch (error) {
                console.error('[SEO-Google] Failed to init with override creds:', error.message);
                return null;
            }
        }

        const creds = await this.getGoogleCredentials();
        if (!creds) return null;

        if (this._googleIndexing) return this._googleIndexing;

        try {
            const { google } = require('googleapis');
            let auth;

            if (creds.startsWith('file:')) {
                auth = new google.auth.GoogleAuth({
                    keyFile: creds.slice(5),
                    scopes: ['https://www.googleapis.com/auth/indexing'],
                });
            } else {
                auth = new google.auth.GoogleAuth({
                    credentials: JSON.parse(creds),
                    scopes: ['https://www.googleapis.com/auth/indexing'],
                });
            }

            this._googleIndexing = google.indexing({ version: 'v3', auth });
            return this._googleIndexing;
        } catch (error) {
            console.error('[SEO-Google] Failed to initialize:', error.message);
            return null;
        }
    }

    async notifyGoogle(url, overrides = {}) {
        const siteUrl = overrides.websiteUrl || await this.getSiteUrl();
        const absoluteUrl = url.startsWith('/') ? `${siteUrl}${url}` : url;

        const client = await this._getGoogleIndexingClient(overrides.googleServiceAccountJson);
        if (!client) return { success: false, reason: 'not_configured' };

        try {
            const res = await client.urlNotifications.publish({
                requestBody: { url: absoluteUrl, type: 'URL_UPDATED' },
            });

            const notifyTime = res.data?.urlNotificationMetadata?.latestUpdate?.notifyTime;
            console.log(`[SEO-Google] Indexed: ${absoluteUrl}, notifyTime: ${notifyTime}`);
            return { success: true, url: absoluteUrl, notifyTime };
        } catch (error) {
            const status = error?.response?.status || 0;
            if (status === 429) console.warn('[SEO-Google] Daily quota exceeded (200/day)');
            else console.error(`[SEO-Google] Error for ${absoluteUrl}:`, error.message);
            return { success: false, status, error: error.message };
        }
    }

    async notifyGoogleRemoval(url) {
        const siteUrl = await this.getSiteUrl();
        const absoluteUrl = url.startsWith('/') ? `${siteUrl}${url}` : url;
        const client = await this._getGoogleIndexingClient();
        if (!client) return { success: false, reason: 'not_configured' };

        try {
            await client.urlNotifications.publish({
                requestBody: { url: absoluteUrl, type: 'URL_DELETED' },
            });
            console.log(`[SEO-Google] Removal requested: ${absoluteUrl}`);
            return { success: true, url: absoluteUrl };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // ============================================
    // WEBSUB
    // ============================================

    async notifyWebSub(feedUrl) {
        const siteUrl = await this.getSiteUrl();
        const absoluteFeedUrl = feedUrl || `${siteUrl}/sitemap.xml`;

        const hubs = [
            'https://pubsubhubbub.appspot.com/',
            'https://pubsubhubbub.superfeedr.com/',
        ];

        const results = await Promise.allSettled(
            hubs.map(async (hub) => {
                const response = await fetch(hub, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams({ 'hub.mode': 'publish', 'hub.url': absoluteFeedUrl }),
                });
                return { hub, status: response.status, ok: response.ok };
            })
        );

        const successes = results.filter(r => r.status === 'fulfilled' && r.value.ok).length;
        console.log(`[SEO-WebSub] Pinged ${successes}/${hubs.length} hubs for ${absoluteFeedUrl}`);
        return {
            success: successes > 0,
            hubResults: results.map(r => r.status === 'fulfilled' ? r.value : { error: r.reason?.message }),
        };
    }

    // ============================================
    // COMBINED
    // ============================================

    async notifyAll(urls, options = {}) {
        const autoEnabled = await this.isAutoIndexEnabled();
        if (!autoEnabled && !options.force) {
            console.log('[SEO] Auto-indexing disabled in settings');
            return { urls: [], results: [], summary: { total: 0, succeeded: 0, failed: 0 } };
        }

        const engines = options.engines || await this.getEnabledEngines();
        const urlList = Array.isArray(urls) ? urls : [urls];
        const tasks = [];

        if (engines.includes('indexnow')) {
            tasks.push(
                this.notifyIndexNow(urlList, { indexnowKey: options.indexnowKey, websiteUrl: options.websiteUrl })
                    .then(r => ({ engine: 'indexnow', ...r }))
                    .catch(e => ({ engine: 'indexnow', success: false, error: e.message }))
            );
        }

        if (engines.includes('google')) {
            for (const url of urlList) {
                tasks.push(
                    this.notifyGoogle(url, { googleServiceAccountJson: options.googleServiceAccountJson, websiteUrl: options.websiteUrl })
                        .then(r => ({ engine: 'google', ...r }))
                        .catch(e => ({ engine: 'google', success: false, error: e.message }))
                );
            }
        }

        if (engines.includes('websub')) {
            tasks.push(
                this.notifyWebSub(options.feedUrl)
                    .then(r => ({ engine: 'websub', ...r }))
                    .catch(e => ({ engine: 'websub', success: false, error: e.message }))
            );
        }

        const results = await Promise.allSettled(tasks);
        const flat = results.map(r => r.status === 'fulfilled' ? r.value : { success: false, error: r.reason?.message });

        console.log(`[SEO] Notified ${flat.filter(r => r.success).length}/${flat.length} engines for ${urlList.length} URL(s)`);
        return {
            urls: urlList,
            results: flat,
            summary: { total: flat.length, succeeded: flat.filter(r => r.success).length, failed: flat.filter(r => !r.success).length },
        };
    }

    async notifyBlogPublished(slug) {
        const siteUrl = await this.getSiteUrl();
        return this.notifyAll(`${siteUrl}/blog/${slug}`);
    }

    async notifyPagePublished(slug) {
        const siteUrl = await this.getSiteUrl();
        return this.notifyAll(`${siteUrl}/${slug}`);
    }
}

module.exports = new SEOIndexingService();
