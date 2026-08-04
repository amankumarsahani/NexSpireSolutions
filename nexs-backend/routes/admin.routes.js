const express = require('express');
const router = express.Router();
const multer = require('multer');
const ServerController = require('../controllers/server.controller');
const BackupAccountController = require('../controllers/backup-account.controller');
const { auth, isAdmin } = require('../middleware/auth');
const { isFull } = require('../config/edition');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 250 * 1024 * 1024 }
});
const registryUrl = (process.env.REGISTRY_URL || 'http://localhost:4000').replace(/\/$/, '');

const parseRegistryResponse = async (response) => {
    const text = await response.text();
    try {
        return text ? JSON.parse(text) : {};
    } catch (error) {
        return { success: false, error: text || 'Invalid registry response' };
    }
};

router.use(auth);
router.use(isAdmin);

// Visitor intelligence for our own marketing site. Never mounted on a partner
// instance - it is our business data, not theirs.
if (isFull) {
    router.use('/site-analytics', require('./site-analytics.routes'));
}

// Server routes
router.get('/servers', ServerController.getAllServers);
router.get('/servers/:id', ServerController.getServerById);
router.post('/servers', ServerController.createServer);
router.put('/servers/:id', ServerController.updateServer);
router.post('/servers/:id/test', ServerController.testConnection);

// Backup account routes
router.get('/backup-accounts', BackupAccountController.getAllAccounts);
router.post('/backup-accounts', BackupAccountController.createAccount);
router.put('/backup-accounts/:id', BackupAccountController.updateAccount);
router.delete('/backup-accounts/:id', BackupAccountController.deleteAccount);
router.post('/backup-accounts/google-oauth/exchange', BackupAccountController.exchangeGoogleOauthCode);
router.post('/backup-accounts/run-now', BackupAccountController.triggerManualBackup);

router.get('/mobile-app', async (req, res) => {
    try {
        const response = await fetch(`${registryUrl}/mobile-app/latest`);
        const data = await parseRegistryResponse(response);
        res.status(response.status).json(data);
    } catch (error) {
        console.error('Failed to fetch mobile app release:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch mobile app release' });
    }
});

router.post('/mobile-app/upload', upload.single('file'), async (req, res) => {
    try {
        if (!process.env.REGISTRY_API_KEY) {
            return res.status(500).json({ success: false, error: 'REGISTRY_API_KEY is not configured' });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, error: 'APK file is required' });
        }

        if (!/\.apk$/i.test(req.file.originalname)) {
            return res.status(400).json({ success: false, error: 'Only .apk files are supported' });
        }

        const response = await fetch(`${registryUrl}/mobile-app/upload`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': process.env.REGISTRY_API_KEY
            },
            body: JSON.stringify({
                file_name: req.file.originalname,
                file_data_base64: req.file.buffer.toString('base64'),
                content_type: req.file.mimetype || 'application/vnd.android.package-archive',
                version_name: req.body.version_name || '',
                build_number: req.body.build_number || '',
                release_notes: req.body.release_notes || ''
            })
        });

        const data = await parseRegistryResponse(response);
        res.status(response.status).json(data);
    } catch (error) {
        console.error('Failed to upload mobile app release:', error);
        res.status(500).json({ success: false, error: 'Failed to upload mobile app release' });
    }
});

router.get('/telemetry/stats', async (req, res) => {
    try {
        if (!process.env.REGISTRY_API_KEY) {
            return res.status(500).json({ success: false, error: 'REGISTRY_API_KEY is not configured' });
        }

        const response = await fetch(`${registryUrl}/telemetry/stats`, {
            headers: {
                'X-API-Key': process.env.REGISTRY_API_KEY
            }
        });
        const data = await parseRegistryResponse(response);
        res.status(response.status).json(data);
    } catch (error) {
        console.error('Failed to fetch telemetry stats:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch telemetry stats' });
    }
});

module.exports = router;
