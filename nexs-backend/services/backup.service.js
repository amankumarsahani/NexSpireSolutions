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
    getAccountAuthType(account) {
        return account?.auth_type === 'oauth_personal' ? 'oauth_personal' : 'service_account';
    }

    createDriveClient(account) {
        const authType = this.getAccountAuthType(account);

        if (authType === 'oauth_personal') {
            if (!account.oauth_client_id || !account.oauth_client_secret || !account.oauth_refresh_token) {
                throw new Error('Backup account is missing OAuth client_id, client_secret, or refresh_token for personal Google Drive access.');
            }

            const auth = new google.auth.OAuth2(
                account.oauth_client_id,
                account.oauth_client_secret
            );

            auth.setCredentials({
                refresh_token: account.oauth_refresh_token
            });

            return google.drive({ version: 'v3', auth });
        }

        if (!account.credentials_json) {
            throw new Error('Backup account is missing service account credentials JSON.');
        }

        const authOptions = {
            credentials: JSON.parse(account.credentials_json),
            scopes: ['https://www.googleapis.com/auth/drive.file'],
        };

        if (account.subject_email) {
            authOptions.clientOptions = { subject: account.subject_email };
            console.log(`[BackupService] Impersonating user: ${account.subject_email}`);
        }

        const auth = new google.auth.GoogleAuth(authOptions);
        return google.drive({ version: 'v3', auth });
    }

    /**
     * Run daily backup for all active tenants
     */
    async backupAllTenants() {
        console.log('[BackupService] Starting daily backup run...');

        // Default to active tenants only. Allow override for special cases.
        const allowedStatuses = (process.env.BACKUP_TENANT_STATUSES || 'active,trial')
            .split(',')
            .map(status => status.trim().toLowerCase())
            .filter(Boolean);

        const tenants = await TenantModel.findAll({});
        const activeTenants = tenants.filter(t => allowedStatuses.includes(String(t.status || '').toLowerCase()));

        console.log(`[BackupService] Found ${tenants.length} total tenants. Proceeding with ${activeTenants.length} eligible tenant(s) for statuses: ${allowedStatuses.join(', ')}.`);

        for (const tenant of activeTenants) {
            try {
                console.log(`[BackupService] Processing tenant: ${tenant.slug} (${tenant.status})`);
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
        if (!account.folder_id) {
            throw new Error('Backup account missing folder_id. Please provide a Google Drive folder ID.');
        }

        const authType = this.getAccountAuthType(account);
        console.log(`[BackupService] Uploading to GDrive Folder ID: ${account.folder_id} using ${authType} auth`);

        const drive = this.createDriveClient(account);

        const fileMetadata = {
            name: fileName,
            parents: [account.folder_id],
        };

        const media = {
            mimeType: 'application/gzip',
            body: fs.createReadStream(filePath),
        };

        try {
            const res = await drive.files.create({
                resource: fileMetadata,
                media: media,
                fields: 'id',
                supportsAllDrives: true,
            });
            return res.data.id;
        } catch (error) {
            if (authType === 'service_account' && error.message && error.message.includes('Service Accounts do not have storage quota')) {
                throw new Error(`Google Drive Storage Error: Service Accounts cannot own files in standard folders. Please use a 'Shared Drive' (Team Drive) and ensure the Service Account is added as a 'Contributor' or 'Manager', OR use Domain-Wide Delegation.`);
            }
            if (authType === 'service_account' && error.message && (error.message.includes('unauthorized_client') || error.message.includes('Client is unauthorized'))) {
                throw new Error(`Authorization Error: Domain-Wide Delegation failed. If you are using a personal Gmail account, leave the 'Impersonate Email' field BLANK. If using Workspace, ensure the Service Account is authorized in the Admin Console.`);
            }
            if (authType === 'oauth_personal' && error.message && error.message.includes('invalid_grant')) {
                throw new Error('Google OAuth Error: The stored refresh token is invalid, expired, or revoked. Generate a new refresh token for the personal Google Drive account and update this backup account.');
            }
            if (authType === 'oauth_personal' && error.message && error.message.includes('unauthorized_client')) {
                throw new Error('Google OAuth Error: This OAuth client is not allowed for the requested Drive access. Verify the Google Cloud OAuth client configuration and consent screen.');
            }
            throw error;
        }
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
        const drive = this.createDriveClient(account);

        await drive.files.delete({
            fileId,
            supportsAllDrives: true
        });
    }
}

module.exports = new BackupService();
