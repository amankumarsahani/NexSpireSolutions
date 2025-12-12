const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const { testConnection } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(morgan('dev')); // Logging
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

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/activities', require('./routes/activity.routes'));

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
