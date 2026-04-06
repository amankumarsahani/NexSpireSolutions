const BackupAccountModel = require('../models/backup-account.model');

class BackupAccountController {
    validatePayload(payload) {
        const authType = payload.auth_type === 'oauth_personal' ? 'oauth_personal' : 'service_account';

        if (!payload.account_name || !payload.folder_id) {
            throw new Error('account_name and folder_id are required');
        }

        if (authType === 'oauth_personal') {
            if (!payload.oauth_client_id || !payload.oauth_client_secret || !payload.oauth_refresh_token) {
                throw new Error('oauth_client_id, oauth_client_secret, and oauth_refresh_token are required for personal Google Drive accounts');
            }
            return;
        }

        if (!payload.credentials_json) {
            throw new Error('credentials_json is required for service account backup mode');
        }
    }

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
            this.validatePayload(req.body);
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
            this.validatePayload(req.body);
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
