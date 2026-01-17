/**
 * Email Queue Worker
 * Processes pending emails with rate limiting and SMTP rotation
 */

const db = require('../config/database');
const nodemailer = require('nodemailer');

class EmailQueueWorker {
    constructor() {
        this.isRunning = false;
        this.transporters = new Map();
        this.currentSmtpIndex = 0;
    }

    /**
     * Initialize SMTP transporters from database
     */
    async initializeTransporters() {
        try {
            const [accounts] = await db.query(
                'SELECT * FROM smtp_accounts WHERE isActive = TRUE ORDER BY priority ASC'
            );

            this.transporters.clear();

            for (const account of accounts) {
                const transporter = nodemailer.createTransport({
                    host: account.host,
                    port: account.port,
                    secure: account.secure,
                    auth: {
                        user: account.username,
                        pass: account.password
                    }
                });

                this.transporters.set(account.id, {
                    transporter,
                    config: account
                });
            }

            console.log(`[EmailWorker] Initialized ${this.transporters.size} SMTP accounts`);
            return this.transporters.size > 0;
        } catch (error) {
            console.error('[EmailWorker] Failed to initialize transporters:', error);
            return false;
        }
    }

    /**
     * Get next available SMTP account (rotation for quota management)
     */
    async getNextSmtpAccount() {
        const accounts = Array.from(this.transporters.values());
        if (accounts.length === 0) return null;

        // Reset hourly counters if needed
        const now = new Date();
        for (const { config } of accounts) {
            const lastReset = config.lastHourReset ? new Date(config.lastHourReset) : null;
            if (!lastReset || now.getTime() - lastReset.getTime() > 3600000) {
                await db.query(
                    'UPDATE smtp_accounts SET sentThisHour = 0, lastHourReset = NOW() WHERE id = ?',
                    [config.id]
                );
                config.sentThisHour = 0;
            }
        }

        // Find account with available quota
        for (let i = 0; i < accounts.length; i++) {
            const index = (this.currentSmtpIndex + i) % accounts.length;
            const account = accounts[index];

            if (account.config.sentThisHour < account.config.hourlyLimit) {
                this.currentSmtpIndex = (index + 1) % accounts.length;
                return account;
            }
        }

        return null; // All accounts exhausted
    }

    /**
     * Generate tracking pixel HTML
     */
    generateTrackingPixel(trackingId) {
        const baseUrl = process.env.APP_URL || 'https://api.nexspiresolutions.co.in';
        return `<img src="${baseUrl}/api/track/open/${trackingId}" width="1" height="1" style="display:none" alt="" />`;
    }

    /**
     * Wrap links with click tracking
     */
    wrapLinksWithTracking(html, trackingId) {
        const baseUrl = process.env.APP_URL || 'https://api.nexspiresolutions.co.in';
        return html.replace(
            /href="(https?:\/\/[^"]+)"/g,
            (match, url) => {
                const encodedUrl = encodeURIComponent(url);
                return `href="${baseUrl}/api/track/click/${trackingId}?url=${encodedUrl}"`;
            }
        );
    }

    /**
     * Add unsubscribe link to email
     */
    addUnsubscribeLink(html, email, campaignId) {
        const baseUrl = process.env.APP_URL || 'https://api.nexspiresolutions.co.in';
        const unsubUrl = `${baseUrl}/api/track/unsubscribe?email=${encodeURIComponent(email)}&campaign=${campaignId}`;

        const unsubscribeHtml = `
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 12px; color: #666;">
                <p>You're receiving this email because you're subscribed to our mailing list.</p>
                <p><a href="${unsubUrl}" style="color: #666;">Unsubscribe</a> from future emails</p>
            </div>
        `;

        // Insert before closing body tag or at end
        if (html.includes('</body>')) {
            return html.replace('</body>', `${unsubscribeHtml}</body>`);
        }
        return html + unsubscribeHtml;
    }

    /**
     * Process a single email from queue
     */
    async processEmail(queueItem, campaign) {
        const smtpAccount = await this.getNextSmtpAccount();

        if (!smtpAccount) {
            console.log('[EmailWorker] No SMTP accounts available (quota exhausted)');
            return false;
        }

        try {
            // Mark as sending
            await db.query('UPDATE email_queue SET status = ?, smtpAccountId = ? WHERE id = ?',
                ['sending', smtpAccount.config.id, queueItem.id]);

            // Prepare email content
            let htmlContent = campaign.htmlContent || '';

            // Add tracking pixel
            htmlContent = this.addUnsubscribeLink(htmlContent, queueItem.recipientEmail, campaign.id);
            htmlContent = this.wrapLinksWithTracking(htmlContent, queueItem.trackingId);
            htmlContent += this.generateTrackingPixel(queueItem.trackingId);

            // Personalize content
            htmlContent = htmlContent
                .replace(/{{name}}/g, queueItem.recipientName || 'there')
                .replace(/{{email}}/g, queueItem.recipientEmail)
                .replace(/{{first_name}}/g, (queueItem.recipientName || '').split(' ')[0] || 'there');

            // Send email
            await smtpAccount.transporter.sendMail({
                from: `"${smtpAccount.config.fromName}" <${smtpAccount.config.fromEmail}>`,
                to: queueItem.recipientEmail,
                subject: campaign.subject.replace(/{{name}}/g, queueItem.recipientName || 'there'),
                html: htmlContent,
                text: campaign.textContent || htmlContent.replace(/<[^>]*>/g, '')
            });

            // Update queue item
            await db.query(
                'UPDATE email_queue SET status = ?, sentAt = NOW() WHERE id = ?',
                ['sent', queueItem.id]
            );

            // Update SMTP counter
            await db.query(
                'UPDATE smtp_accounts SET sentThisHour = sentThisHour + 1, sentToday = sentToday + 1 WHERE id = ?',
                [smtpAccount.config.id]
            );
            smtpAccount.config.sentThisHour++;

            // Update campaign counter
            await db.query(
                'UPDATE email_campaigns SET sentCount = sentCount + 1 WHERE id = ?',
                [campaign.id]
            );

            // Log tracking event
            await db.query(
                'INSERT INTO email_tracking (queueId, campaignId, trackingId, eventType) VALUES (?, ?, ?, ?)',
                [queueItem.id, campaign.id, queueItem.trackingId, 'sent']
            );

            console.log(`[EmailWorker] Sent to ${queueItem.recipientEmail}`);
            return true;

        } catch (error) {
            console.error(`[EmailWorker] Failed to send to ${queueItem.recipientEmail}:`, error.message);

            // Update queue with error
            const attempts = queueItem.attempts + 1;
            const status = attempts >= queueItem.maxAttempts ? 'failed' : 'pending';
            const nextRetry = new Date(Date.now() + Math.pow(2, attempts) * 60000); // Exponential backoff

            await db.query(
                'UPDATE email_queue SET status = ?, attempts = ?, errorMessage = ?, nextRetryAt = ? WHERE id = ?',
                [status, attempts, error.message, status === 'pending' ? nextRetry : null, queueItem.id]
            );

            if (status === 'failed') {
                await db.query(
                    'UPDATE email_campaigns SET failedCount = failedCount + 1 WHERE id = ?',
                    [campaign.id]
                );

                // Check for bounce
                if (error.message.includes('bounce') || error.responseCode === 550) {
                    await this.recordBounce(queueItem.recipientEmail, 'hard', error.message);
                }
            }

            return false;
        }
    }

    /**
     * Record email bounce
     */
    async recordBounce(email, type, reason) {
        try {
            const [[existing]] = await db.query('SELECT * FROM email_bounces WHERE email = ?', [email]);

            if (existing) {
                const newCount = existing.bounceCount + 1;
                const isDisabled = newCount >= 3 || type === 'hard';

                await db.query(
                    'UPDATE email_bounces SET bounceCount = ?, bounceType = ?, lastBounceReason = ?, isDisabled = ? WHERE email = ?',
                    [newCount, type, reason, isDisabled, email]
                );
            } else {
                await db.query(
                    'INSERT INTO email_bounces (email, bounceType, lastBounceReason, isDisabled) VALUES (?, ?, ?, ?)',
                    [email, type, reason, type === 'hard']
                );
            }
        } catch (error) {
            console.error('[EmailWorker] Failed to record bounce:', error);
        }
    }

    /**
     * Main processing loop
     */
    async processQueue() {
        if (this.isRunning) {
            console.log('[EmailWorker] Already running, skipping...');
            return;
        }

        this.isRunning = true;
        console.log('[EmailWorker] Starting queue processing...');

        try {
            // Get active campaigns
            const [campaigns] = await db.query(
                "SELECT * FROM email_campaigns WHERE status = 'sending'"
            );

            for (const campaign of campaigns) {
                // Get pending emails for this campaign
                const [pending] = await db.query(
                    `SELECT * FROM email_queue 
                     WHERE campaignId = ? AND status = 'pending' 
                     AND (nextRetryAt IS NULL OR nextRetryAt <= NOW())
                     ORDER BY id ASC
                     LIMIT ?`,
                    [campaign.id, campaign.rateLimitPerHour]
                );

                console.log(`[EmailWorker] Processing ${pending.length} emails for campaign ${campaign.id}`);

                for (const item of pending) {
                    await this.processEmail(item, campaign);

                    // Delay between emails (anti-spam)
                    await new Promise(resolve => setTimeout(resolve, campaign.delayBetweenEmails * 1000));
                }

                // Check if campaign is complete
                const [[remaining]] = await db.query(
                    "SELECT COUNT(*) as count FROM email_queue WHERE campaignId = ? AND status = 'pending'",
                    [campaign.id]
                );

                if (remaining.count === 0) {
                    await db.query(
                        "UPDATE email_campaigns SET status = 'completed', completedAt = NOW() WHERE id = ?",
                        [campaign.id]
                    );
                    console.log(`[EmailWorker] Campaign ${campaign.id} completed`);
                }
            }
        } catch (error) {
            console.error('[EmailWorker] Processing error:', error);
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Start the worker
     */
    async start(intervalMs = 30000) {
        console.log('[EmailWorker] Initializing...');

        const hasTransporters = await this.initializeTransporters();
        if (!hasTransporters) {
            console.warn('[EmailWorker] No SMTP accounts configured. Worker will retry on next interval.');
        }

        // Run immediately
        await this.processQueue();

        // Schedule recurring runs
        setInterval(async () => {
            await this.initializeTransporters(); // Refresh transporters
            await this.processQueue();
        }, intervalMs);

        console.log(`[EmailWorker] Started with ${intervalMs}ms interval`);
    }
}

module.exports = new EmailQueueWorker();
