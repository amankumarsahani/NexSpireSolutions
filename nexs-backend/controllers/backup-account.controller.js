const BackupAccountModel = require('../models/backup-account.model');

class BackupAccountController {
    /**
     * List all backup accounts
     */
    async getAllAccounts(req, res) {
        try {
            const accounts = await BackupAccountModel.findAll();
            res.json({ success: true, data: accounts });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Create backup account
     */
    async createAccount(req, res) {
        try {
            const accountId = await BackupAccountModel.create(req.body);
            const account = await BackupAccountModel.findById(accountId);
            res.status(201).json({ success: true, data: account });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Update backup account
     */
    async updateAccount(req, res) {
        try {
            const { id } = req.params;
            await BackupAccountModel.update(id, req.body);
            const account = await BackupAccountModel.findById(id);
            res.json({ success: true, data: account });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Delete backup account
     */
    async deleteAccount(req, res) {
        try {
            const { id } = req.params;
            await BackupAccountModel.delete(id);
            res.json({ success: true, message: 'Backup account deleted' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Trigger manual backup
     */
    async triggerManualBackup(req, res) {
        try {
            const backupWorker = require('../workers/backupWorker');
            backupWorker.triggerNow(); // Run async
            res.json({ success: true, message: 'Backup process started in background' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new BackupAccountController();
