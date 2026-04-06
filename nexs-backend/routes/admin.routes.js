const express = require('express');
const router = express.Router();
const ServerController = require('../controllers/server.controller');
const BackupAccountController = require('../controllers/backup-account.controller');
const { auth, isAdmin } = require('../middleware/auth');

router.use(auth);
router.use(isAdmin);

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

module.exports = router;
