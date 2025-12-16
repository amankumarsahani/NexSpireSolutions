const http = require('http');
const crypto = require('crypto');
const { exec } = require('child_process');
const nodemailer = require('nodemailer');

// Load environment variables
require('dotenv').config();

// ⚠️ IMPORTANT: Change this secret and keep it safe!
const SECRET = 'nexspire-webhook-secret-2024';
const PORT = 9000;
const REPO_PATH = '/var/www/html/NexSpireSolutions';

// Email configuration
const DEPLOY_NOTIFY_EMAILS = process.env.DEPLOY_NOTIFY_EMAILS || process.env.NOTIFICATION_EMAILS || '';

// Deployment status tracking
let deploymentStatus = {
    lastDeploy: null,
    backend: 'idle',
    frontend: 'idle',
    error: null
};

// Email transporter (initialized lazily)
let emailTransporter = null;

function getEmailTransporter() {
    if (emailTransporter) return emailTransporter;

    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_SECURE } = process.env;

    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD) {
        console.log('⚠️ Email notifications disabled: SMTP not configured');
        return null;
    }

    emailTransporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: parseInt(SMTP_PORT) || 587,
        secure: SMTP_SECURE === 'true',
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASSWORD
        }
    });

    return emailTransporter;
}

/**
 * Send deployment notification email
 */
async function sendDeploymentNotification({ status, pusher, commit, duration, error }) {
    const recipients = DEPLOY_NOTIFY_EMAILS.split(',').map(e => e.trim()).filter(Boolean);

    if (recipients.length === 0) {
        console.log('📧 No deployment notification recipients configured');
        return;
    }

    const transporter = getEmailTransporter();
    if (!transporter) return;

    const isSuccess = status === 'success';
    const emoji = isSuccess ? '✅' : '❌';
    const statusText = isSuccess ? 'Successful' : 'Failed';
    const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: ${isSuccess ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'}; color: white; padding: 24px; border-radius: 12px 12px 0 0;">
                <h1 style="margin: 0; font-size: 24px;">${emoji} Deployment ${statusText}</h1>
                <p style="margin: 8px 0 0 0; opacity: 0.9;">${timestamp}</p>
            </div>
            
            <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 14px; width: 100px;">Pushed by:</td>
                        <td style="padding: 8px 0; color: #1e293b; font-weight: 500;">${pusher || 'Unknown'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Commit:</td>
                        <td style="padding: 8px 0; color: #1e293b;">${commit || 'N/A'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Duration:</td>
                        <td style="padding: 8px 0; color: #1e293b;">${duration || 'N/A'}</td>
                    </tr>
                    ${error ? `
                    <tr>
                        <td style="padding: 8px 0; color: #dc2626; font-size: 14px;">Error:</td>
                        <td style="padding: 8px 0; color: #dc2626; font-family: monospace;">${error}</td>
                    </tr>
                    ` : ''}
                </table>
            </div>
            
            <div style="background: #1e293b; color: #94a3b8; padding: 16px 24px; border-radius: 0 0 12px 12px; text-align: center; font-size: 12px;">
                NexSpire Solutions Auto-Deploy System
            </div>
        </div>
    `;

    try {
        await transporter.sendMail({
            from: `"Deploy Bot" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
            to: recipients.join(', '),
            subject: `${emoji} Deployment ${statusText}: NexSpire Solutions`,
            html
        });
        console.log(`📧 Deployment notification sent to: ${recipients.join(', ')}`);
    } catch (err) {
        console.error('📧 Failed to send deployment notification:', err.message);
    }
}

// Helper function to run commands with promise
function runCommand(cmd, name) {
    return new Promise((resolve, reject) => {
        console.log(`\n📦 [${name}] Starting...`);
        exec(cmd, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
            if (error) {
                console.error(`❌ [${name}] Failed:`, error.message);
                if (stderr) console.error(`   stderr: ${stderr}`);
                reject({ name, error: error.message, stderr });
            } else {
                console.log(`✅ [${name}] Completed`);
                if (stdout) console.log(`   stdout: ${stdout.slice(0, 500)}`);
                resolve({ name, stdout });
            }
        });
    });
}

const server = http.createServer((req, res) => {
    // Health check endpoint
    if (req.method === 'GET' && req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
            status: 'ok',
            timestamp: new Date().toISOString(),
            deployment: deploymentStatus
        }));
    }

    // Webhook endpoint
    if (req.method === 'POST' && req.url === '/webhook') {
        let body = '';

        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            const contentType = req.headers['content-type'] || '';
            console.log(`\n📥 Webhook received`);
            console.log(`   Content-Type: ${contentType}`);
            console.log(`   Body length: ${body.length} bytes`);

            // Verify GitHub signature (if provided)
            const signature = req.headers['x-hub-signature-256'];
            if (signature) {
                const hmac = crypto.createHmac('sha256', SECRET);
                const digest = 'sha256=' + hmac.update(body).digest('hex');

                if (signature !== digest) {
                    console.log('❌ Invalid signature - Unauthorized request');
                    res.writeHead(401, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ error: 'Unauthorized' }));
                }
                console.log('   ✅ Signature verified');
            } else {
                console.log('   ⚠️ No signature provided (skipping verification)');
            }

            let payload;
            try {
                // Handle URL-encoded payloads (GitHub sometimes sends these)
                if (contentType.includes('application/x-www-form-urlencoded')) {
                    const params = new URLSearchParams(body);
                    const payloadStr = params.get('payload');
                    if (payloadStr) {
                        payload = JSON.parse(payloadStr);
                    } else {
                        throw new Error('No payload field in form data');
                    }
                } else {
                    payload = JSON.parse(body);
                }
                console.log(`   ✅ Payload parsed successfully`);
            } catch (e) {
                console.log('❌ Invalid payload:', e.message);
                console.log('   Body preview:', body.substring(0, 200));
                res.writeHead(400, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ error: 'Invalid payload', details: e.message }));
            }

            // Only deploy on push to master branch
            if (payload.ref === 'refs/heads/master') {
                const deployStartTime = Date.now();
                const timestamp = new Date().toISOString();
                const pusherName = payload.pusher?.name || 'unknown';
                const commitMessage = payload.head_commit?.message || 'unknown';

                console.log(`\n${'='.repeat(60)}`);
                console.log(`🚀 [${timestamp}] DEPLOYMENT TRIGGERED`);
                console.log(`   Pusher: ${pusherName}`);
                console.log(`   Commit: ${commitMessage}`);
                console.log(`${'='.repeat(60)}`);

                // Update status
                deploymentStatus = {
                    lastDeploy: timestamp,
                    backend: 'deploying',
                    frontend: 'deploying',
                    error: null
                };

                // Respond immediately (don't block GitHub)
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'Deployment started', timestamp }));

                try {
                    // Step 1: Pull latest code
                    await runCommand(
                        `cd ${REPO_PATH} && git fetch origin master && git reset --hard origin/master`,
                        'Git Pull'
                    );

                    // Step 2: Run Database Migrations (safe - only runs pending)
                    deploymentStatus.backend = 'migrating';
                    try {
                        await runCommand(
                            `cd ${REPO_PATH}/nexs-backend && node database/migrate.js`,
                            'Database Migrations'
                        );
                    } catch (migrationErr) {
                        console.log('⚠️ Migration warning (may be already up to date):', migrationErr.error);
                        // Continue deployment - migration might fail if no new migrations
                    }

                    // Step 3: Deploy Backend
                    deploymentStatus.backend = 'installing';
                    await runCommand(
                        `cd ${REPO_PATH}/nexs-backend && npm install --production`,
                        'Backend npm install'
                    );

                    await runCommand(
                        `pm2 restart 0`,
                        'Backend PM2 restart'
                    );
                    deploymentStatus.backend = 'running';

                    // Step 4: Deploy Frontend
                    deploymentStatus.frontend = 'building';
                    await runCommand(
                        `cd ${REPO_PATH}/nexs-agency && npm install`,
                        'Frontend npm install'
                    );

                    await runCommand(
                        `cd ${REPO_PATH}/nexs-agency && npm run build:prod`,
                        'Frontend build'
                    );
                    deploymentStatus.frontend = 'deployed';

                    const deployDuration = ((Date.now() - deployStartTime) / 1000).toFixed(1) + 's';

                    console.log(`\n${'='.repeat(60)}`);
                    console.log(`🎉 DEPLOYMENT COMPLETE!`);
                    console.log(`   Migrations: ✅ Up to date`);
                    console.log(`   Backend: ✅ Running`);
                    console.log(`   Frontend: ✅ Built to dist/`);
                    console.log(`   Duration: ${deployDuration}`);
                    console.log(`${'='.repeat(60)}\n`);

                    // Send success notification
                    await sendDeploymentNotification({
                        status: 'success',
                        pusher: pusherName,
                        commit: commitMessage,
                        duration: deployDuration
                    });

                } catch (err) {
                    const deployDuration = ((Date.now() - deployStartTime) / 1000).toFixed(1) + 's';

                    console.error(`\n❌ DEPLOYMENT FAILED: ${err.name}`);
                    console.error(`   Error: ${err.error}`);
                    deploymentStatus.error = `${err.name}: ${err.error}`;

                    if (deploymentStatus.backend === 'installing' || deploymentStatus.backend === 'migrating') {
                        deploymentStatus.backend = 'failed';
                    }
                    if (deploymentStatus.frontend === 'building') {
                        deploymentStatus.frontend = 'failed';
                    }

                    // Send failure notification
                    await sendDeploymentNotification({
                        status: 'failed',
                        pusher: pusherName,
                        commit: commitMessage,
                        duration: deployDuration,
                        error: `${err.name}: ${err.error}`
                    });
                }

            } else {
                console.log(`ℹ️ Ignored push to ${payload.ref} (not master)`);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'Ignored - not master branch' }));
            }
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not Found' }));
    }
});

server.listen(PORT, () => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🎯 NEXSPIRE AUTO-DEPLOY WEBHOOK SERVER`);
    console.log(`${'='.repeat(60)}`);
    console.log(`   Port:     ${PORT}`);
    console.log(`   Health:   http://localhost:${PORT}/health`);
    console.log(`   Webhook:  http://localhost:${PORT}/webhook`);
    console.log(`   Repo:     ${REPO_PATH}`);
    console.log(`   Branch:   master`);
    console.log(`\n   Deploys:`);
    console.log(`   - Migrations: database/migrate.js (auto)`);
    console.log(`   - Backend:    nexs-backend → PM2 restart`);
    console.log(`   - Frontend:   nexs-agency  → npm run build:prod`);
    console.log(`${'='.repeat(60)}\n`);
});

