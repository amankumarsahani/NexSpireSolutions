const http = require('http');
const crypto = require('crypto');
const { exec } = require('child_process');

// ⚠️ IMPORTANT: Change this secret and keep it safe!
const SECRET = 'nexspire-webhook-secret-2024';
const PORT = 9000;
const REPO_PATH = '/var/www/html/NexSpireSolutions';

// Deployment status tracking
let deploymentStatus = {
    lastDeploy: null,
    backend: 'idle',
    frontend: 'idle',
    error: null
};

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
            // Verify GitHub signature
            const signature = req.headers['x-hub-signature-256'];
            const hmac = crypto.createHmac('sha256', SECRET);
            const digest = 'sha256=' + hmac.update(body).digest('hex');

            if (signature !== digest) {
                console.log('❌ Invalid signature - Unauthorized request');
                res.writeHead(401, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ error: 'Unauthorized' }));
            }

            let payload;
            try {
                payload = JSON.parse(body);
            } catch (e) {
                console.log('❌ Invalid JSON payload');
                res.writeHead(400, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }

            // Only deploy on push to master branch
            if (payload.ref === 'refs/heads/master') {
                const timestamp = new Date().toISOString();
                console.log(`\n${'='.repeat(60)}`);
                console.log(`🚀 [${timestamp}] DEPLOYMENT TRIGGERED`);
                console.log(`   Pusher: ${payload.pusher?.name || 'unknown'}`);
                console.log(`   Commit: ${payload.head_commit?.message || 'unknown'}`);
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

                    // Step 2: Deploy Backend
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

                    // Step 3: Deploy Frontend
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

                    console.log(`\n${'='.repeat(60)}`);
                    console.log(`🎉 DEPLOYMENT COMPLETE!`);
                    console.log(`   Backend: ✅ Running`);
                    console.log(`   Frontend: ✅ Built to dist/`);
                    console.log(`${'='.repeat(60)}\n`);

                } catch (err) {
                    console.error(`\n❌ DEPLOYMENT FAILED: ${err.name}`);
                    console.error(`   Error: ${err.error}`);
                    deploymentStatus.error = `${err.name}: ${err.error}`;

                    if (deploymentStatus.backend === 'installing') {
                        deploymentStatus.backend = 'failed';
                    }
                    if (deploymentStatus.frontend === 'building') {
                        deploymentStatus.frontend = 'failed';
                    }
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
    console.log(`   - Backend:  nexs-backend → PM2 restart`);
    console.log(`   - Frontend: nexs-agency  → npm run build:prod`);
    console.log(`${'='.repeat(60)}\n`);
});
