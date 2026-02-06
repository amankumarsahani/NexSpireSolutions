/**
 * Backup Worker
 * Handles automated daily backups
 */

const BackupService = require('../services/backup.service');

class BackupWorker {
    constructor() {
        this.isRunning = false;
        this.scheduleTime = { hour: 2, minute: 0 }; // 2:00 AM
    }

    /**
     * Start the worker
     */
    start(intervalMs = 60000) {
        console.log('[BackupWorker] Starting...');

        // check every minute
        setInterval(() => {
            this.checkSchedule();
        }, intervalMs);
    }

    /**
     * Check if it's time to run backup
     */
    async checkSchedule() {
        if (this.isRunning) return;

        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        // Run only at 2:00 AM (0-59 seconds window)
        // Also check if we haven't run it today already? 
        // For simplicity in this worker loop w/ 1 min interval, checking HH:MM matches is sufficient 
        // provided the interval is 60s. To be safer against restarts, a DB lock/last_run would be better,
        // but sticking to the requested simple schedule for now.

        if (currentHour === this.scheduleTime.hour && currentMinute === this.scheduleTime.minute) {
            this.runBackup();
        }
    }

    /**
     * Run the backup process
     */
    async runBackup() {
        if (this.isRunning) {
            console.log('[BackupWorker] Backup already in progress, skipping schedule.');
            return;
        }

        this.isRunning = true;

        try {
            console.log('[BackupWorker] Starting scheduled daily backup...');
            await BackupService.backupAllTenants();
            console.log('[BackupWorker] Daily backup completed successfully.');
        } catch (error) {
            console.error('[BackupWorker] Daily backup failed:', error);
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Manual Trigger (exposed for API)
     */
    async triggerNow() {
        if (this.isRunning) {
            throw new Error('Backup is already in progress');
        }
        // Don't await here to return response quickly, or await if caller wants to wait?
        // Usually trigger jobs are async. We'll run it and let logs handle it.
        this.runBackup().catch(err => console.error('[BackupWorker] Manual run error:', err));
        return true;
    }
}

module.exports = new BackupWorker();
