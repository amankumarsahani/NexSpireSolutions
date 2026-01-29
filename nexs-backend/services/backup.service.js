const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const TenantModel = require('../models/tenant.model');
const ServerModel = require('../models/server.model');
const BackupAccountModel = require('../models/backup-account.model');

class BackupService {
    /**
     * Run daily backup for all active tenants
     */
    async backupAllTenants() {
        console.log('[BackupService] Starting daily backup run...');
        const tenants = await TenantModel.findAll({ status: 'active' });

        for (const tenant of tenants) {
            try {
                await this.backupTenant(tenant);
            } catch (error) {
                console.error(`[BackupService] Failed to backup tenant ${tenant.slug}:`, error.message);
            }
        }

        await this.cleanupOldBackups();
        console.log('[BackupService] Backup run complete.');
    }

    /**
     * Backup a specific tenant
     */
    async backupTenant(tenant) {
        const server = await ServerModel.findById(tenant.server_id);
        const backupAccount = await BackupAccountModel.getNextAccount();

        if (!server || !backupAccount) {
            throw new Error('Missing server or backup account configuration');
        }

        const date = new Date().toISOString().split('T')[0];
        const fileName = `${tenant.slug}_${date}.sql.gz`;
        const localPath = path.join(__dirname, `../temp/${fileName}`);

        // Ensure temp dir exists
        if (!fs.existsSync(path.join(__dirname, '../temp'))) {
            fs.mkdirSync(path.join(__dirname, '../temp'));
        }

        try {
            console.log(`[BackupService] Backing up ${tenant.slug} on server ${server.name}...`);

            // 1. Generate dump via SSH (stream it locally)
            const sshPrefix = server.is_primary ? '' : `ssh ${server.hostname} "`;
            const sshSuffix = server.is_primary ? '' : '"';
            const dbHost = server.db_host || 'localhost';

            const dumpCmd = `${sshPrefix}mysqldump -h ${dbHost} -u ${server.db_user || 'root'} -p'${server.db_password}' ${tenant.db_name} | gzip${sshSuffix} > ${localPath}`;

            await execAsync(dumpCmd);
            const stats = fs.statSync(localPath);

            // 2. Upload to Google Drive
            const gdriveFileId = await this.uploadToGDrive(backupAccount, localPath, fileName);

            // 3. Record in history
            await BackupAccountModel.addHistory({
                tenant_id: tenant.id,
                server_id: server.id,
                file_name: fileName,
                gdrive_file_id: gdriveFileId,
                backup_account_id: backupAccount.id,
                status: 'success',
                file_size_bytes: stats.size
            });

            await BackupAccountModel.incrementUsage(backupAccount.id);
            console.log(`[BackupService] Successfully backed up ${tenant.slug} to Google Drive.`);

        } catch (error) {
            await BackupAccountModel.addHistory({
                tenant_id: tenant.id,
                server_id: server.id,
                file_name: fileName,
                status: 'failed',
                error_message: error.message
            });
            throw error;
        } finally {
            // Clean up local temp file
            if (fs.existsSync(localPath)) {
                fs.unlinkSync(localPath);
            }
        }
    }

    /**
     * Upload file to Google Drive
     */
    async uploadToGDrive(account, filePath, fileName) {
        const auth = new google.auth.GoogleAuth({
            credentials: JSON.parse(account.credentials_json),
            scopes: ['https://www.googleapis.com/auth/drive.file'],
        });

        const drive = google.drive({ version: 'v3', auth });

        const fileMetadata = {
            name: fileName,
            parents: account.folder_id ? [account.folder_id] : [],
        };

        const media = {
            mimeType: 'application/gzip',
            body: fs.createReadStream(filePath),
        };

        const res = await drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: 'id',
        });

        return res.data.id;
    }

    /**
     * Delete backups older than 15 days
     */
    async cleanupOldBackups() {
        console.log('[BackupService] Cleaning up old backups...');
        const expiredBackups = await BackupAccountModel.getExpiredBackups(15);

        for (const backup of expiredBackups) {
            try {
                const account = await BackupAccountModel.findById(backup.backup_account_id);
                if (account && backup.gdrive_file_id) {
                    await this.deleteFromGDrive(account, backup.gdrive_file_id);
                }
                await BackupAccountModel.deleteHistory(backup.id);
                console.log(`[BackupService] Deleted expired backup: ${backup.file_name}`);
            } catch (error) {
                console.error(`[BackupService] Failed to delete backup ${backup.file_name}:`, error.message);
            }
        }
    }

    async deleteFromGDrive(account, fileId) {
        const auth = new google.auth.GoogleAuth({
            credentials: JSON.parse(account.credentials_json),
            scopes: ['https://www.googleapis.com/auth/drive.file'],
        });
        const drive = google.drive({ version: 'v3', auth });
        await drive.files.delete({ fileId });
    }
}

module.exports = new BackupService();
