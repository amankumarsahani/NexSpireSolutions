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

// Middleware
app.use(morgan(':remote-addr - :method :url :status :response-time ms - :res[content-length]')); // Enhanced logging with IP

// Rate Limiting & Rogue Path Protection
const { generalRateLimit } = require('./middleware/rateLimit');
const { roguePathBlocker } = require('./middleware/security');

app.use(roguePathBlocker); // Block rogue paths first
app.use(generalRateLimit); // Then apply global rate limit

// Security headers
app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP for API
    crossOriginEmbedderPolicy: false
}));

app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// CORS Configuration
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

        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Static files (for uploaded documents)
app.use('/uploads', express.static('uploads'));

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

// NexCRM Master Routes (Tenant Management)
app.use('/api/tenants', require('./routes/tenant.routes'));
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

// Email Campaigns & Marketing
app.use('/api/campaigns', require('./routes/campaign.routes'));
app.use('/api/smtp-accounts', require('./routes/smtp.routes'));
app.use('/api/track', require('./routes/tracking.routes'));

// Automation Workflows
app.use('/api/workflows', require('./routes/workflow.routes'));

// Billing & Webhooks
app.use('/api/billing', require('./routes/billing.routes'));
app.use('/webhooks', require('./routes/webhook.routes'));

// Start email worker (after routes are set up)
const emailWorker = require('./workers/emailWorker');
emailWorker.start(30000); // Process queue every 30 seconds

// Start workflow worker for delayed executions
const workflowWorker = require('./workers/workflowWorker');
workflowWorker.start(60000); // Check every 60 seconds

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
