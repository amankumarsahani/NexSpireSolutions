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
}

module.exports = new BackupAccountController();
