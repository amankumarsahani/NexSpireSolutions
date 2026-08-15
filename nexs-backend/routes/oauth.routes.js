/**
 * Centralized Google OAuth — shared across NexCRM lead-source integrations
 * (Sheets today, Gmail later — same consent app, different scopes).
 *
 * Google OAuth redirect URIs are exact-match, so a per-tenant subdomain
 * (`<slug>-crm-api.<baseDomain>`) can't each register their own callback. This
 * app registration and callback live here instead, on nexs-backend's stable
 * domain. After exchanging the code for tokens, the refresh token is handed
 * off server-to-server to the originating tenant's nexcrm-backend instance —
 * nexs-backend itself never stores it.
 *
 * `state` is a signed JWT (not a raw tenant slug) so the callback can trust
 * which tenant/connection it's completing without a session — this endpoint
 * is hit directly by the user's browser, not through the authenticated API.
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');
const { google } = require('googleapis');
const oauthState = require('../services/oauthState');

const REDIRECT_URI = process.env.GOOGLE_OAUTH_REDIRECT_URI || `${brand.apiUrl}/oauth/google/callback`;

// Lead-sources (Sheets/Drive) flow scopes.
const SHEETS_SCOPES = [
    // drive.file (not drive.readonly): lets the tenant backend list/create only
    // files the user picks or that we create ourselves — not their whole Drive.
    'https://www.googleapis.com/auth/drive.file',
    // spreadsheets (not .readonly): creating a new sheet + writing its header row
    // is a write op. Also covers the read-only polling the worker already does.
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/userinfo.email' // so we can label the connection with the connected account
];

// Connected-mailbox (Gmail) flow scopes — SEND ONLY. gmail.send is a *sensitive*
// scope (standard OAuth verification, NO paid CASA assessment). Receiving would
// need gmail.readonly/modify (RESTRICTED → CASA), which we deliberately avoid;
// receive a Gmail mailbox via IMAP app-password instead.
const GMAIL_SCOPES = [
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/userinfo.email'
];

const GOOGLE_CALENDAR_SCOPES = [
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/userinfo.email'
];

// Which tenant endpoint receives the refresh token, per flow.
const TOKEN_PATHS = {
    sheets: '/api/lead-sources/google/token',
    mailbox_gmail: '/api/mailbox/oauth/token',
    calendar_google: '/api/calendar/google/token'
};

const GOOGLE_FLOWS = {
    sheets: { scopes: SHEETS_SCOPES, successKey: 'google_connect' },
    mailbox_gmail: { scopes: GMAIL_SCOPES, successKey: 'mailbox_connect' },
    calendar_google: { scopes: GOOGLE_CALENDAR_SCOPES, successKey: 'calendar_connect' }
};

const INTERNAL_OAUTH_KEY = process.env.INTERNAL_OAUTH_KEY;

/**
 * Verify an incoming state JWT, replying with a message that distinguishes a
 * genuinely stale link (user waited past the 10m expiry) from a secret mismatch
 * between this process and the tenant that signed it — both used to surface as
 * the same opaque "Invalid or expired state".
 * Returns true when handled (response already sent).
 */
function rejectBadState(state, res) {
    try {
        oauthState.verify(state);
        return false;
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            res.status(400).send('This connect link has expired. Go back to your CRM and start the connection again.');
        } else {
            console.error('[oauth] state verification failed:', err.name, err.message,
                '— check OAUTH_STATE_SECRET matches between nexs-backend and the tenant backend');
            res.status(400).send('Could not verify this connect link (OAuth state secret mismatch between servers). Contact support.');
        }
        return true;
    }
}

function buildOAuthClient() {
    return new google.auth.OAuth2(
        process.env.GOOGLE_OAUTH_CLIENT_ID,
        process.env.GOOGLE_OAUTH_CLIENT_SECRET,
        REDIRECT_URI
    );
}

// GET /oauth/google/start?state=<jwt>&tenant_api_url=<url>&return_to=<url>
router.get('/google/start', (req, res) => {
    const { state, tenant_api_url, return_to } = req.query;
    if (!state || !tenant_api_url) {
        return res.status(400).send('Missing state or tenant_api_url');
    }

    if (rejectBadState(state, res)) return;

    // flow travels inside the signed state (set by the tenant connect-url builder).
    // Default to the sheets flow for backward compatibility with lead-sources.
    // Strip exp/iat from the decoded claims — the incoming state was signed with
    // its own expiry, and re-signing with expiresIn while exp is present throws.
    const { exp, iat, ...decoded } = oauthState.decode(state) || {};
    const flow = decoded.flow || 'sheets';
    const flowConfig = GOOGLE_FLOWS[flow];
    if (!flowConfig) return res.status(400).send('Unsupported Google OAuth flow');

    const client = buildOAuthClient();
    const url = client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent', // force refresh_token on every connect, not just the first
        scope: flowConfig.scopes,
        // tenant_api_url/return_to travel inside state's signature scope by being
        // re-embedded here rather than trusted from query params at callback time.
        state: oauthState.sign(
            { ...decoded, tenant_api_url, return_to: return_to || tenant_api_url },
            { expiresIn: '10m' }
        )
    });

    res.redirect(url);
});

// GET /oauth/google/callback?code=...&state=...
router.get('/google/callback', async (req, res) => {
    const { code, state, error } = req.query;

    let payload;
    try {
        payload = oauthState.verify(state);
    } catch {
        return res.status(400).send('Invalid or expired OAuth state');
    }

    const { connectionId, tenant_api_url, return_to } = payload;
    const flow = payload.flow || 'sheets';
    const flowConfig = GOOGLE_FLOWS[flow];
    if (!flowConfig) return res.status(400).send('Unsupported Google OAuth flow');
    const successKey = flowConfig.successKey;
    const failRedirect = `${return_to || tenant_api_url}?${successKey}=failed`;

    if (error || !code) {
        return res.redirect(failRedirect);
    }

    try {
        const client = buildOAuthClient();
        const { tokens } = await client.getToken(code);

        if (!tokens.refresh_token) {
            // Happens when the user has already granted consent and Google
            // silently reauthorizes without issuing a new refresh_token.
            // `prompt: 'consent'` above should prevent this, but guard anyway.
            return res.redirect(`${failRedirect}&reason=no_refresh_token`);
        }

        client.setCredentials(tokens);
        const oauth2 = google.oauth2({ version: 'v2', auth: client });
        const { data: profile } = await oauth2.userinfo.get();

        const tokenPath = TOKEN_PATHS[flow];
        const tokenBody = flow === 'mailbox_gmail'
            ? { connectionId, provider: 'gmail', refreshToken: tokens.refresh_token, email: profile.email, displayName: profile.name }
            : { connectionId, refreshToken: tokens.refresh_token, email: profile.email };

        await axios.post(
            `${tenant_api_url}${tokenPath}`,
            tokenBody,
            { headers: { 'X-Internal-Key': INTERNAL_OAUTH_KEY }, timeout: 30000 }
        );

        res.redirect(`${return_to || tenant_api_url}?${successKey}=success`);
    } catch (err) {
        console.error('[oauth] Google callback failed:', err.response?.data || err.message);
        res.redirect(failRedirect);
    }
});

/* ------------------------------------------------------------------ */
/* Microsoft 365 / Outlook — mailbox connect                            */
/* ------------------------------------------------------------------ */

const { ConfidentialClientApplication } = require('@azure/msal-node');
const brand = require('../config/brand');

const MS_REDIRECT_URI = process.env.MS_OAUTH_REDIRECT_URI || `${brand.apiUrl}/oauth/microsoft/callback`;
const MS_MAIL_SCOPES = ['offline_access', 'https://graph.microsoft.com/Mail.ReadWrite', 'https://graph.microsoft.com/Mail.Send', 'https://graph.microsoft.com/User.Read'];
const MS_CALENDAR_SCOPES = ['offline_access', 'https://graph.microsoft.com/Calendars.ReadWrite', 'https://graph.microsoft.com/User.Read'];

function microsoftFlow(flow) {
    if (flow === 'calendar_microsoft') {
        return {
            scopes: MS_CALENDAR_SCOPES,
            tokenPath: '/api/calendar/microsoft/token',
            successKey: 'calendar_connect'
        };
    }
    if (!flow || flow === 'mailbox_microsoft') {
        return {
            scopes: MS_MAIL_SCOPES,
            tokenPath: '/api/mailbox/oauth/token',
            successKey: 'mailbox_connect'
        };
    }
    return null;
}

function msalApp() {
    return new ConfidentialClientApplication({
        auth: {
            clientId: process.env.MS_OAUTH_CLIENT_ID,
            clientSecret: process.env.MS_OAUTH_CLIENT_SECRET,
            authority: `https://login.microsoftonline.com/${process.env.MS_OAUTH_TENANT || 'common'}`
        }
    });
}

// GET /oauth/microsoft/start?state=<jwt>&tenant_api_url=<url>&return_to=<url>
router.get('/microsoft/start', async (req, res) => {
    const { state, tenant_api_url, return_to } = req.query;
    if (!state || !tenant_api_url) return res.status(400).send('Missing state or tenant_api_url');

    if (rejectBadState(state, res)) return;

    try {
        const { exp, iat, ...decoded } = oauthState.decode(state) || {};
        const flowConfig = microsoftFlow(decoded.flow);
        if (!flowConfig) return res.status(400).send('Unsupported Microsoft OAuth flow');
        const embeddedState = oauthState.sign(
            { ...decoded, tenant_api_url, return_to: return_to || tenant_api_url },
            { expiresIn: '10m' }
        );
        const url = await msalApp().getAuthCodeUrl({
            scopes: flowConfig.scopes,
            redirectUri: MS_REDIRECT_URI,
            state: embeddedState,
            prompt: 'consent'
        });
        res.redirect(url);
    } catch (err) {
        console.error('[oauth] Microsoft start failed:', err.message);
        res.status(500).send('Failed to start Microsoft consent');
    }
});

// GET /oauth/microsoft/callback?code=...&state=...
router.get('/microsoft/callback', async (req, res) => {
    const { code, state, error } = req.query;

    let payload;
    try { payload = oauthState.verify(state); }
    catch { return res.status(400).send('Invalid or expired OAuth state'); }

    const { connectionId, tenant_api_url, return_to, flow } = payload;
    const flowConfig = microsoftFlow(flow);
    if (!flowConfig) return res.status(400).send('Unsupported Microsoft OAuth flow');
    const failRedirect = `${return_to || tenant_api_url}?${flowConfig.successKey}=failed`;
    if (error || !code) return res.redirect(failRedirect);

    try {
        // One app instance so we can read its token cache after the exchange.
        const app = msalApp();
        const result = await app.acquireTokenByCode({
            code,
            scopes: flowConfig.scopes,
            redirectUri: MS_REDIRECT_URI
        });

        const refreshToken = extractRefreshToken(app);
        if (!refreshToken) {
            return res.redirect(`${failRedirect}&reason=no_refresh_token`);
        }

        const email = result.account?.username || '';
        const displayName = result.account?.name || null;

        await axios.post(
            `${tenant_api_url}${flowConfig.tokenPath}`,
            flow === 'calendar_microsoft'
                ? { connectionId, refreshToken, email }
                : { connectionId, provider: 'microsoft', refreshToken, email, displayName },
            { headers: { 'X-Internal-Key': INTERNAL_OAUTH_KEY }, timeout: 30000 }
        );

        res.redirect(`${return_to || tenant_api_url}?${flowConfig.successKey}=success`);
    } catch (err) {
        console.error('[oauth] Microsoft callback failed:', err.response?.data || err.message);
        res.redirect(failRedirect);
    }
});

/**
 * msal-node does not return the refresh token on the result object (it manages
 * caching internally). The supported way to obtain it for our own server-to-server
 * relay to the tenant backend is to serialize the app's in-memory token cache
 * right after the code exchange and read the RefreshToken entry.
 */
/* ------------------------------------------------------------------ */
/* Facebook / Meta Lead Ads — capture leads from FB & Instagram forms   */
/* ------------------------------------------------------------------ */

/**
 * Lead Ads uses the SAME shared Meta App as WhatsApp (META_APP_ID /
 * META_APP_SECRET), so a single App Review covers both and every tenant's
 * inbound leads land on one central webhook (see webhook.controller
 * handleMetaLeadsWebhook), routed to the owning tenant via meta_page_registry.
 *
 * The consent grants us Page access tokens. We subscribe our app to each
 * Page's `leadgen` field and store the (encrypted) Page token centrally — the
 * webhook needs it to fetch the actual lead from the Graph API. The tenant
 * never sees the token; it only receives resolved leads.
 *
 * `leads_retrieval` is an Advanced-Access scope: until the app clears App
 * Review + Business Verification, only app admins/testers can complete this.
 */
const FB_GRAPH = 'v21.0';
const FB_LEADS_REDIRECT_URI = process.env.FACEBOOK_LEADS_REDIRECT_URI
    || `${brand.apiUrl}/oauth/facebook/leads/callback`;
const FB_LEADS_SCOPES = [
    'pages_show_list',
    'pages_read_engagement',
    'pages_manage_metadata',
    'leads_retrieval',
    'business_management'
];

// GET /oauth/facebook/leads/start?state=<jwt>&tenant_api_url=<url>&return_to=<url>
router.get('/facebook/leads/start', (req, res) => {
    const appId = process.env.META_APP_ID || process.env.FACEBOOK_APP_ID;
    if (!appId || !(process.env.META_APP_SECRET || process.env.FACEBOOK_APP_SECRET)) {
        return res.status(503).send('Meta Lead Ads is not configured on this server (META_APP_ID / META_APP_SECRET)');
    }

    const { state, tenant_api_url, return_to } = req.query;
    if (!state || !tenant_api_url) return res.status(400).send('Missing state or tenant_api_url');

    if (rejectBadState(state, res)) return;

    const { exp, iat, ...decoded } = oauthState.decode(state) || {};
    const embeddedState = oauthState.sign(
        { ...decoded, tenant_api_url, return_to: return_to || tenant_api_url },
        { expiresIn: '10m' }
    );

    const params = new URLSearchParams({
        client_id: appId,
        redirect_uri: FB_LEADS_REDIRECT_URI,
        response_type: 'code',
        scope: FB_LEADS_SCOPES.join(','),
        state: embeddedState
    });
    res.redirect(`https://www.facebook.com/${FB_GRAPH}/dialog/oauth?${params}`);
});

// GET /oauth/facebook/leads/callback?code=...&state=...
router.get('/facebook/leads/callback', async (req, res) => {
    const { code, state, error } = req.query;
    const { pool } = require('../config/database');
    const { encryptSecret } = require('../services/secretStore');

    let payload;
    try { payload = oauthState.verify(state); }
    catch { return res.status(400).send('Invalid or expired OAuth state'); }

    const { tenant, connectorKey, tenant_api_url, return_to } = payload;
    const failRedirect = `${return_to || tenant_api_url}?connector_connect=failed`;
    if (error || !code) return res.redirect(failRedirect);

    const appId = process.env.META_APP_ID || process.env.FACEBOOK_APP_ID;
    const appSecret = process.env.META_APP_SECRET || process.env.FACEBOOK_APP_SECRET;

    try {
        // 1. code → short-lived user token
        const { data: shortTok } = await axios.get(`https://graph.facebook.com/${FB_GRAPH}/oauth/access_token`, {
            params: { client_id: appId, client_secret: appSecret, redirect_uri: FB_LEADS_REDIRECT_URI, code },
            timeout: 15000
        });

        // 2. short → long-lived user token (~60 days)
        const { data: longTok } = await axios.get(`https://graph.facebook.com/${FB_GRAPH}/oauth/access_token`, {
            params: { grant_type: 'fb_exchange_token', client_id: appId, client_secret: appSecret, fb_exchange_token: shortTok.access_token },
            timeout: 15000
        });
        const userToken = longTok.access_token;

        // 3. list Pages the user manages — each carries its own (long-lived) Page token
        const { data: pagesRes } = await axios.get(`https://graph.facebook.com/${FB_GRAPH}/me/accounts`, {
            params: { access_token: userToken, fields: 'id,name,access_token', limit: 100 },
            timeout: 15000
        });
        const pages = pagesRes.data || [];
        if (!pages.length) return res.redirect(`${failRedirect}&reason=no_pages`);

        let registered = 0;
        for (const page of pages) {
            try {
                // 4. subscribe OUR app to this page's leadgen webhook field
                await axios.post(
                    `https://graph.facebook.com/${FB_GRAPH}/${page.id}/subscribed_apps`,
                    null,
                    { params: { subscribed_fields: 'leadgen', access_token: page.access_token }, timeout: 15000 }
                );

                // 5. register page → tenant centrally (page token encrypted; webhook uses it)
                await pool.query(
                    `INSERT INTO meta_page_registry (page_id, page_name, tenant_slug, tenant_api_url, page_token_encrypted, status)
                     VALUES (?, ?, ?, ?, ?, 'active')
                     ON DUPLICATE KEY UPDATE
                       page_name = VALUES(page_name),
                       tenant_slug = VALUES(tenant_slug),
                       tenant_api_url = VALUES(tenant_api_url),
                       page_token_encrypted = VALUES(page_token_encrypted),
                       status = 'active'`,
                    [page.id, page.name || null, tenant, tenant_api_url, encryptSecret(page.access_token)]
                );

                // 6. create the tenant-visible connection record in its own hub
                await axios.post(
                    `${tenant_api_url}/api/meta-leads/register`,
                    { connectorKey: connectorKey || 'meta_lead_ads', pageId: page.id, pageName: page.name || 'Facebook Page' },
                    { headers: { 'X-Internal-Key': INTERNAL_OAUTH_KEY }, timeout: 30000 }
                ).catch(e => console.error('[oauth] meta-leads tenant register failed:', e.message));

                registered++;
            } catch (e) {
                console.error(`[oauth] facebook page ${page.id} subscribe failed:`, e.response?.data?.error?.message || e.message);
            }
        }

        if (!registered) return res.redirect(`${failRedirect}&reason=subscribe_failed`);
        res.redirect(`${return_to || tenant_api_url}?connector_connect=success`);
    } catch (err) {
        console.error('[oauth] Facebook Lead Ads callback failed:', err.response?.data || err.message);
        res.redirect(failRedirect);
    }
});

/* ------------------------------------------------------------------ */
/* Generic OAuth2 — everything that isn't Google or Microsoft           */
/* ------------------------------------------------------------------ */

/**
 * Provider-agnostic authorization-code flow. Google and Microsoft keep their
 * own endpoints above because each has SDK-specific quirks (msal's token cache,
 * Google's prompt=consent); every other provider is plain OAuth2, so adding one
 * is a registry entry rather than two new routes.
 *
 * Credentials come from env per provider, so a provider with no client
 * configured simply reports that instead of half-completing a flow.
 */
const OAUTH2_PROVIDERS = {
    slack: {
        name: 'Slack',
        authUrl: 'https://slack.com/oauth/v2/authorize',
        tokenUrl: 'https://slack.com/api/oauth.v2.access',
        scopes: ['chat:write', 'channels:read'],
        clientIdEnv: 'SLACK_CLIENT_ID',
        clientSecretEnv: 'SLACK_CLIENT_SECRET'
    },
    quickbooks: {
        name: 'QuickBooks',
        authUrl: 'https://appcenter.intuit.com/connect/oauth2',
        tokenUrl: 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
        scopes: ['com.intuit.quickbooks.accounting'],
        clientIdEnv: 'QUICKBOOKS_CLIENT_ID',
        clientSecretEnv: 'QUICKBOOKS_CLIENT_SECRET',
        basicTokenAuth: true
    },
    zoho_books: {
        name: 'Zoho Books',
        authUrl: () => `${process.env.ZOHO_ACCOUNTS_URL || 'https://accounts.zoho.in'}/oauth/v2/auth`,
        tokenUrl: () => `${process.env.ZOHO_ACCOUNTS_URL || 'https://accounts.zoho.in'}/oauth/v2/token`,
        scopes: ['ZohoBooks.contacts.ALL', 'ZohoBooks.invoices.ALL', 'ZohoBooks.settings.READ'],
        clientIdEnv: 'ZOHO_CLIENT_ID',
        clientSecretEnv: 'ZOHO_CLIENT_SECRET',
        extraAuthParams: { access_type: 'offline', prompt: 'consent' }
    }
};

const resolveOAuthValue = value => typeof value === 'function' ? value() : value;

function oauth2RedirectUri(provider) {
    const base = brand.apiUrl;
    return `${base}/oauth/oauth2/${provider}/callback`;
}

// GET /oauth/oauth2/:provider/start?state=<jwt>&tenant_api_url=<url>&return_to=<url>
router.get('/oauth2/:provider/start', (req, res) => {
    const cfg = OAUTH2_PROVIDERS[req.params.provider];
    if (!cfg) return res.status(404).send('Unknown OAuth2 provider');

    const clientId = process.env[cfg.clientIdEnv];
    if (!clientId || !process.env[cfg.clientSecretEnv]) {
        return res.status(503).send(`${cfg.name} is not configured on this server (${cfg.clientIdEnv} / ${cfg.clientSecretEnv})`);
    }

    const { state, tenant_api_url, return_to } = req.query;
    if (!state || !tenant_api_url) return res.status(400).send('Missing state or tenant_api_url');

    if (rejectBadState(state, res)) return;

    const { exp, iat, ...decoded } = oauthState.decode(state) || {};
    const embeddedState = oauthState.sign(
        { ...decoded, provider: req.params.provider, tenant_api_url, return_to: return_to || tenant_api_url },
        { expiresIn: '10m' }
    );

    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: oauth2RedirectUri(req.params.provider),
        response_type: 'code',
        scope: cfg.scopes.join(cfg.scopeSeparator || ' '),
        state: embeddedState,
        ...(cfg.extraAuthParams || {})
    });

    res.redirect(`${resolveOAuthValue(cfg.authUrl)}?${params}`);
});

// GET /oauth/oauth2/:provider/callback?code=...&state=...
router.get('/oauth2/:provider/callback', async (req, res) => {
    const cfg = OAUTH2_PROVIDERS[req.params.provider];
    if (!cfg) return res.status(404).send('Unknown OAuth2 provider');

    const { code, state, error } = req.query;

    let payload;
    try { payload = oauthState.verify(state); }
    catch { return res.status(400).send('Invalid or expired OAuth state'); }

    const { connectorKey, tenant_api_url, return_to } = payload;
    const failRedirect = `${return_to || tenant_api_url}?connector_connect=failed`;
    if (error || !code) return res.redirect(failRedirect);

    try {
        const body = new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: oauth2RedirectUri(req.params.provider)
        });
        const tokenHeaders = {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json'
        };

        if (cfg.basicTokenAuth) {
            tokenHeaders.Authorization = `Basic ${Buffer.from(
                `${process.env[cfg.clientIdEnv]}:${process.env[cfg.clientSecretEnv]}`
            ).toString('base64')}`;
        } else {
            body.set('client_id', process.env[cfg.clientIdEnv]);
            body.set('client_secret', process.env[cfg.clientSecretEnv]);
        }

        const tokenRes = await axios.post(resolveOAuthValue(cfg.tokenUrl), body.toString(), {
            headers: tokenHeaders,
            timeout: 15000
        });

        // Slack returns {ok:false,error} with HTTP 200 rather than a 4xx.
        if (tokenRes.data?.ok === false) {
            console.error(`[oauth2] ${req.params.provider} token error:`, tokenRes.data.error);
            return res.redirect(failRedirect);
        }

        const d = tokenRes.data || {};
        const accessToken = d.access_token || d.authed_user?.access_token;
        if (!accessToken) return res.redirect(`${failRedirect}&reason=no_access_token`);
        const config = { ...(payload.config || {}) };
        if (req.params.provider === 'quickbooks' && req.query.realmId) {
            config.realm_id = String(req.query.realmId);
        }

        await axios.post(
            `${tenant_api_url}/api/connectors/oauth/token`,
            {
                connectorKey,
                label: payload.label || cfg.name,
                tokens: {
                    access_token: accessToken,
                    refresh_token: d.refresh_token || null,
                    expires_in: Number(d.expires_in) || 3600,
                    api_domain: d.api_domain || null,
                    account: d.team?.name || d.account || null
                },
                config
            },
            { headers: { 'X-Internal-Key': INTERNAL_OAUTH_KEY }, timeout: 30000 }
        );

        res.redirect(`${return_to || tenant_api_url}?connector_connect=success`);
    } catch (err) {
        console.error(`[oauth2] ${req.params.provider} callback failed:`, err.response?.data || err.message);
        res.redirect(failRedirect);
    }
});

function extractRefreshToken(app) {
    try {
        const cache = JSON.parse(app.getTokenCache().serialize());
        const rt = cache.RefreshToken || {};
        const first = Object.values(rt)[0];
        return first?.secret || null;
    } catch (err) {
        console.error('[oauth] Failed to read MS refresh token from cache:', err.message);
        return null;
    }
}

module.exports = router;
