const http = require('http');
const crypto = require('crypto');
const { exec } = require('child_process');

// ⚠️ IMPORTANT: Change this secret and keep it safe!
const SECRET = 'nexspire-webhook-secret-2024';
const PORT = 9000;
const REPO_PATH = '/var/www/html/NexSpireSolutions';

const server = http.createServer((req, res) => {
    // Health check endpoint
    if (req.method === 'GET' && req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
    }

    // Webhook endpoint
    if (req.method === 'POST' && req.url === '/webhook') {
        let body = '';

        req.on('data', chunk => body += chunk);
        req.on('end', () => {
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
                console.log(`\n🚀 [${timestamp}] Deployment triggered by push to master`);
                console.log(`   Pusher: ${payload.pusher?.name || 'unknown'}`);
                console.log(`   Commit: ${payload.head_commit?.message || 'unknown'}`);

                // Deploy command: pull latest code, install deps, restart PM2
                const deployCmd = `
          cd ${REPO_PATH} && \
          git fetch origin master && \
          git reset --hard origin/master && \
          cd nexs-backend && \
          npm install --production && \
          pm2 restart 0
        `;

                exec(deployCmd, (error, stdout, stderr) => {
                    if (error) {
                        console.error('❌ Deploy failed:', error.message);
                        console.error('stderr:', stderr);
                        return;
                    }
                    console.log('✅ Deploy successful!');
                    console.log('stdout:', stdout);
                });

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'Deployment started' }));
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
    console.log(`\n🎯 Webhook server running on port ${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/health`);
    console.log(`   Webhook: http://localhost:${PORT}/webhook`);
    console.log(`   Repo: ${REPO_PATH}`);
    console.log(`   Branch: master\n`);
});
