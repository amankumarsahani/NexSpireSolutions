const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
require('dotenv').config();

const { testConnection } = require('./config/database');
const { validateEnv } = require('./config/validateEnv');
const brand = require('./config/brand');
const { edition, isFull, features } = require('./config/edition');

// Validate environment variables
validateEnv();

// Matches any HTTPS subdomain of this instance's base domain.
const platformSubdomainRe = new RegExp(
    `^https://[a-z0-9-]+\\.${brand.baseDomain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`
);

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for accurate IP detection behind Nginx/PM2
app.set('trust proxy', 1);

// Custom Morgan Token for Dual IP Visibility (IPv4 and IPv6)
morgan.token('real-ip', (req) => {
    const ip = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || '';
    // Normalize: strip ::ffff: prefix if present (IPv4-mapped IPv6)
    return ip.replace(/^.*:ffff:/, '');
});

// Middleware
app.use(morgan(':real-ip - :method :url :status :response-time ms - :res[content-length]')); // Enhanced logging with normalized IP

// CORS Configuration - MUST be before rate limiting to handle preflight requests
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = [
            process.env.CLIENT_URL,
            process.env.CLIENT_URL_PROD,
            'http://localhost:3000',
            'http://localhost:5173',
            'http://localhost:5174',
            brand.websiteUrl,
            brand.adminUrl
        ];

        // Allow any subdomain of this instance's base domain
        const isPlatformSubdomain = origin && platformSubdomainRe.test(origin);

        // Allow any HTTPS origin (for custom domain storefronts calling /api/resolve-domain)
        // The resolve-domain endpoint returns public, non-sensitive data.
        // Protected endpoints are still gated by auth middleware.
        const isHttps = origin && /^https:\/\/.+/.test(origin);

        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin || allowedOrigins.indexOf(origin) !== -1 || isPlatformSubdomain || isHttps) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    optionsSuccessStatus: 200
};

// Handle preflight requests explicitly BEFORE other middleware
app.options('*', cors(corsOptions));
app.use(cors(corsOptions));

// Rate Limiting & Rogue Path Protection (AFTER CORS)
const { generalRateLimit } = require('./middleware/rateLimit');
const { roguePathBlocker } = require('./middleware/security');
const webhookRoutes = require('./routes/webhook.routes');

app.use(roguePathBlocker); // Block rogue paths
app.use(generalRateLimit); // Then apply global rate limit

// Security headers
app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP for API
    crossOriginEmbedderPolicy: false
}));

// Webhooks must be mounted before the global body parsers so provider-specific
// raw/json parsing continues to work for signature verification.
app.use('/api/webhooks', webhookRoutes);

// Centralized Google OAuth (Sheets today, Gmail later). Mounted at /oauth, not
// /api — this is a browser redirect flow (Google's redirect_uri is exact-match
// so it must live on this stable domain), not an authenticated API call.
app.use('/oauth', require('./routes/oauth.routes'));

// Partner sync must be mounted before the global JSON parser: it verifies an HMAC
// over the raw request bytes, and express.json() would consume the stream and
// leave only a re-serialisable object. Authenticated by signature, not JWT, so it
// sits outside the auth chain by design.
app.use('/api/partner-sync', require('./routes/partner-sync.routes'));

app.use(express.json({ limit: '100mb' })); // Parse JSON bodies with increased limit
app.use(express.urlencoded({ limit: '100mb', extended: true })); // Parse URL-encoded bodies with increased limit

// Static files (for uploaded documents)
app.use('/uploads', express.static('uploads'));

// IndexNow key verification
const SEOIndexingService = require('./services/seoIndexing.service');
app.get('/indexnow-key.txt', async (req, res) => {
    const key = await SEOIndexingService.getIndexNowKey();
    res.type('text/plain').send(key);
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: `${brand.name} API is running`,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});

// API Routes will be added here
app.get('/api', (req, res) => {
    res.json({
        message: `${brand.name} API v1.0`,
        endpoints: {
            health: '/health',
            auth: '/api/auth/*',
            clients: '/api/clients/*',
            projects: '/api/projects/*',
            leads: '/api/leads/*',
            teams: '/api/teams/*',
            documents: '/api/documents/*',
            messages: '/api/messages/*',
            inquiries: '/api/inquiries/*'
        }
    });
});

// Which product this instance is running as. Public and unauthenticated: the admin
// panel calls it on boot to check its own build matches the server, so a
// whitelabel bundle pointed at a full-edition API (or the reverse) fails loudly instead
// of rendering half a UI whose endpoints 404.
app.get('/api/edition', (req, res) => {
    res.json({
        edition,
        brand: brand.slug,
        productName: brand.name,
        baseDomain: brand.baseDomain,
        features
    });
});

// Import routes
const authRoutes = require('./routes/auth.routes');
const clientRoutes = require('./routes/client.routes');
const projectRoutes = require('./routes/project.routes');
const leadRoutes = require('./routes/lead.routes');
const teamRoutes = require('./routes/team.routes');
const documentRoutes = require('./routes/document.routes');
const messageRoutes = require('./routes/message.routes');
const inquiryRoutes = require('./routes/inquiry.routes');
const emailTemplateRoutes = require('./routes/email-template.routes');
const settingsRoutes = require('./routes/settings.routes');
const tenantRoutes = require('./routes/tenant.routes'); // Moved from below
const adminRoutes = require('./routes/admin.routes'); // Added

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/email-templates', emailTemplateRoutes);
app.use('/api/document-templates', require('./routes/document-template.routes'));
app.use('/api/activities', require('./routes/activity.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));
app.use('/api/settings', settingsRoutes);

// Our own agency CRM. A partner instance runs the control plane only, so these
// are not mounted at all rather than hidden behind a role check.
if (isFull) {
    app.use('/api/clients', clientRoutes);
    app.use('/api/projects', projectRoutes);
    app.use('/api/leads', leadRoutes);
    app.use('/api/documents', documentRoutes);
    app.use('/api/messages', messageRoutes);
    app.use('/api/inquiries', inquiryRoutes);
}

// Public: Resolve custom domain → tenant info (no auth required)
// Used by storefront to discover which tenant a custom domain belongs to
app.get('/api/resolve-domain', async (req, res) => {
    try {
        const { domain } = req.query;
        if (!domain) {
            return res.status(400).json({ found: false, error: 'domain query parameter is required' });
        }

        const normalizedDomain = domain.toLowerCase().trim();
        const { pool: adminPool } = require('./config/database');
        const baseDomain = brand.baseDomain;

        // Match custom domains OR default {slug}.<baseDomain> / {slug}-crm.<baseDomain> / {slug}-crm-api.<baseDomain>
        const [rows] = await adminPool.query(
            `SELECT slug, name, industry_type, assigned_port, status,
                    custom_domain_crm, custom_domain_storefront, custom_domain_api,
                    custom_domain_verified
             FROM tenants
             WHERE status IN ('active', 'trial')
               AND (
                 custom_domain_storefront = ?
                 OR custom_domain_crm = ?
                 OR custom_domain_api = ?
                 OR custom_domain = ?
                 OR ? = CONCAT(slug, '.', ?)
                 OR ? = CONCAT(slug, '-crm.', ?)
                 OR ? = CONCAT(slug, '-crm-api.', ?)
               )
             LIMIT 1`,
            [
                normalizedDomain, normalizedDomain, normalizedDomain, normalizedDomain,
                normalizedDomain, baseDomain,
                normalizedDomain, baseDomain,
                normalizedDomain, baseDomain
            ]
        );

        if (!rows.length) {
            return res.status(404).json({ found: false, error: 'No tenant found for this domain' });
        }

        const tenant = rows[0];

        res.json({
            found: true,
            tenant: {
                slug: tenant.slug,
                name: tenant.name,
                industry: tenant.industry_type,
                // API always stays on the platform base domain (Cloudflare Tunnel)
                // Custom domains are only for CRM and Storefront (Cloudflare Pages)
                api_url: `https://${tenant.slug}-crm-api.${baseDomain}`,
                storefront_url: tenant.custom_domain_storefront
                    ? `https://${tenant.custom_domain_storefront}`
                    : `https://${tenant.slug}.${baseDomain}`,
                crm_url: tenant.custom_domain_crm
                    ? `https://${tenant.custom_domain_crm}`
                    : `https://${tenant.slug}-crm.${baseDomain}`,
                verified: !!tenant.custom_domain_verified
            }
        });
    } catch (error) {
        console.error('Resolve domain error:', error);
        res.status(500).json({ found: false, error: 'Internal server error' });
    }
});

// NexCRM Master Routes (Tenant Management) - the control plane, both editions
app.use('/api/tenants', require('./routes/tenant.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/plans', require('./routes/plan.routes'));

// Our marketing-site CMS
if (isFull) {
    app.use('/api/cms', require('./routes/cms.routes'));
}

// WhatsApp (admin + internal proxy for tenant sessions)
if (features.whatsapp) {
    app.use('/api/admin/whatsapp', require('./routes/whatsapp.routes'));
}

// Meta Lead Ads (internal teardown endpoints called by tenant backends)
if (features.naplead) {
    app.use('/api/admin/meta-leads', require('./routes/metaLeads.routes'));
}

// Security Monitoring
app.get('/api/security/banned-ips', (req, res) => {
    const { getBannedIPs } = require('./middleware/security');
    res.json({
        success: true,
        count: getBannedIPs().length,
        bannedIPs: getBannedIPs()
    });
});

// SMTP accounts back tenant transactional mail, so both editions need them.
app.use('/api/smtp-accounts', require('./routes/smtp.routes'));

// Automation Workflows
app.use('/api/workflows', require('./routes/workflow.routes'));

// Billing
app.use('/api/billing', require('./routes/billing.routes'));
// Webhooks moved to top of file

// Support desk (tenant ingest + agency inbox)
app.use('/api/support', require('./routes/support.routes'));

// Email campaigns. Sold to partners as an add-on (decision D4), so this is a
// feature flag rather than a straight edition check.
if (features.napmail) {
    app.use('/api/campaigns', require('./routes/campaign.routes'));
    app.use('/api/track', require('./routes/tracking.routes'));
}

// Whitelabel partner fleet. Only the master holds a mirror, so a partner
// instance has no partners of its own to administer.
if (isFull) {
    app.use('/api/partners', require('./routes/partner.routes'));
}

// Agency operations: our internal tooling, our website telemetry, our marketing
// site content, and our money. None of this belongs on a partner instance.
if (isFull) {
    app.use('/api/tools', require('./routes/tool.routes'));
    app.use('/api/telemetry', require('./routes/telemetry.routes'));
    app.use('/api/blogs', require('./routes/blog.routes'));
    app.use('/api/portfolio', require('./routes/portfolio.routes'));
    app.use('/api/case-studies', require('./routes/caseStudy.routes'));
    app.use('/api/expenses', require('./routes/expense.routes'));
}

// Start email worker (after routes are set up)
const emailWorker = require('./workers/emailWorker');
emailWorker.start(30000); // Process queue every 30 seconds

// Start workflow worker for delayed executions
const workflowWorker = require('./workers/workflowWorker');
workflowWorker.start(60000); // Check every 60 seconds

// Start backup worker
const backupWorker = require('./workers/backupWorker');
backupWorker.start(60000); // Check every minute

// Report this instance up to the master. No-ops unless PARTNER_SYNC_* is set, so
// it stays inert on the master itself.
const partnerSyncWorker = require('./workers/partnerSyncWorker');
partnerSyncWorker.start(15 * 60 * 1000); // Full snapshot every 15 minutes

// Mark mirrored data stale when an instance stops reporting, so the panel greys
// the rows instead of presenting old numbers as current.
const partnerStaleWorker = require('./workers/partnerStaleWorker');
partnerStaleWorker.start(5 * 60 * 1000);

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.url} not found`
    });
});

// Error Handler
app.use((err, req, res, next) => {
    console.error('Error:', err);

    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Start server
const startServer = async () => {
    try {
        // Test database connection
        const dbConnected = await testConnection();

        if (!dbConnected) {
            console.error('Failed to connect to database. Please check your configuration.');
            process.exit(1);
        }

        // Start listening
        app.listen(PORT, () => {
            console.log('='.repeat(50));
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📍 Environment: ${process.env.NODE_ENV}`);
            console.log(`🌐 Health check: http://localhost:${PORT}/health`);
            console.log(`📚 API docs: http://localhost:${PORT}/api`);
            console.log('='.repeat(50));
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

module.exports = app;
