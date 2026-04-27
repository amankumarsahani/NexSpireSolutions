const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
require('dotenv').config();

const { testConnection } = require('./config/database');
const { validateEnv } = require('./config/validateEnv');

// Validate environment variables
validateEnv();

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
            'https://nexspiresolutions.co.in',
            'https://admin.nexspiresolutions.co.in'
        ];

        // Allow any subdomain of nexspiresolutions.co.in
        const isNexspireSubdomain = origin && /https:\/\/[a-z0-9-]+\.nexspiresolutions\.co\.in$/.test(origin);

        // Allow any HTTPS origin (for custom domain storefronts calling /api/resolve-domain)
        // The resolve-domain endpoint returns public, non-sensitive data.
        // Protected endpoints are still gated by auth middleware.
        const isHttps = origin && /^https:\/\/.+/.test(origin);

        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin || allowedOrigins.indexOf(origin) !== -1 || isNexspireSubdomain || isHttps) {
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
        message: 'Nexspire Solutions API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});

// API Routes will be added here
app.get('/api', (req, res) => {
    res.json({
        message: 'Nexspire Solutions API v1.0',
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
app.use('/api/clients', clientRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/email-templates', emailTemplateRoutes);
app.use('/api/document-templates', require('./routes/document-template.routes'));
app.use('/api/activities', require('./routes/activity.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));
app.use('/api/settings', settingsRoutes);

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

        // Search across all custom domain columns
        const [rows] = await adminPool.query(
            `SELECT slug, name, industry_type, assigned_port, status,
                    custom_domain_crm, custom_domain_storefront, custom_domain_api,
                    custom_domain_verified
             FROM tenants
             WHERE status IN ('active', 'trial')
               AND (custom_domain_storefront = ? OR custom_domain_crm = ? OR custom_domain_api = ? OR custom_domain = ?)
             LIMIT 1`,
            [normalizedDomain, normalizedDomain, normalizedDomain, normalizedDomain]
        );

        if (!rows.length) {
            return res.status(404).json({ found: false, error: 'No tenant found for this domain' });
        }

        const tenant = rows[0];
        const baseDomain = process.env.NEXCRM_DOMAIN || 'nexspiresolutions.co.in';

        res.json({
            found: true,
            tenant: {
                slug: tenant.slug,
                name: tenant.name,
                industry: tenant.industry_type,
                // API always stays on nexspiresolutions.co.in (Cloudflare Tunnel)
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

// NexCRM Master Routes (Tenant Management)
app.use('/api/tenants', require('./routes/tenant.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/cms', require('./routes/cms.routes')); // Added CMS Routes
app.use('/api/plans', require('./routes/plan.routes'));

// Security Monitoring
app.get('/api/security/banned-ips', (req, res) => {
    const { getBannedIPs } = require('./middleware/security');
    res.json({
        success: true,
        count: getBannedIPs().length,
        bannedIPs: getBannedIPs()
    });
});

// Tool Registry
app.use('/api/tools', require('./routes/tool.routes'));

// Email Campaigns & Marketing
app.use('/api/campaigns', require('./routes/campaign.routes'));
app.use('/api/smtp-accounts', require('./routes/smtp.routes'));
app.use('/api/track', require('./routes/tracking.routes'));

// Automation Workflows
app.use('/api/workflows', require('./routes/workflow.routes'));

// Billing
app.use('/api/billing', require('./routes/billing.routes'));
// Webhooks moved to top of file


// Blog
app.use('/api/blogs', require('./routes/blog.routes'));

// Start email worker (after routes are set up)
const emailWorker = require('./workers/emailWorker');
emailWorker.start(30000); // Process queue every 30 seconds

// Start workflow worker for delayed executions
const workflowWorker = require('./workers/workflowWorker');
workflowWorker.start(60000); // Check every 60 seconds

// Start backup worker
const backupWorker = require('./workers/backupWorker');
backupWorker.start(60000); // Check every minute

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
