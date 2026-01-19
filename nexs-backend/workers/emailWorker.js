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
     * Initialize SMTP transporters from database or .env fallback
     */
    async initializeTransporters() {
        try {
            const [accounts] = await db.query(
                'SELECT * FROM smtp_accounts WHERE is_active = TRUE ORDER BY priority ASC'
            );

            this.transporters.clear();

            // If no DB accounts, try .env fallback
            if (accounts.length === 0 && process.env.SMTP_HOST) {
                console.log('[EmailWorker] No DB accounts, using .env SMTP fallback');

                const envTransporter = nodemailer.createTransport({
                    host: process.env.SMTP_HOST,
                    port: parseInt(process.env.SMTP_PORT) || 587,
                    secure: process.env.SMTP_SECURE === 'true',
                    auth: {
                        user: process.env.SMTP_USER,
                        pass: process.env.SMTP_PASSWORD || process.env.SMTP_PASS
                    }
                });

                this.transporters.set('env', {
                    transporter: envTransporter,
                    config: {
                        id: 'env',
                        name: 'Environment SMTP',
                        host: process.env.SMTP_HOST,
                        port: parseInt(process.env.SMTP_PORT) || 587,
                        secure: process.env.SMTP_SECURE === 'true',
                        from_name: process.env.SMTP_FROM_NAME || 'NexSpire',
                        from_email: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER,
                        hourly_limit: parseInt(process.env.SMTP_HOURLY_LIMIT) || 100,
                        sent_this_hour: 0
                    }
                });

                console.log('[EmailWorker] Initialized 1 SMTP account from .env');
                return true;
            }

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
            // Skip DB update for .env fallback account
            if (config.id === 'env') {
                if (!config.last_hour_reset || now.getTime() - new Date(config.last_hour_reset).getTime() > 3600000) {
                    config.sent_this_hour = 0;
                    config.last_hour_reset = now;
                }
                continue;
            }

            const lastReset = config.last_hour_reset ? new Date(config.last_hour_reset) : null;
            if (!lastReset || now.getTime() - lastReset.getTime() > 3600000) {
                await db.query(
                    'UPDATE smtp_accounts SET sent_this_hour = 0, last_hour_reset = NOW() WHERE id = ?',
                    [config.id]
                );
                config.sent_this_hour = 0;
            }
        }

        // Find account with available quota
        for (let i = 0; i < accounts.length; i++) {
            const index = (this.currentSmtpIndex + i) % accounts.length;
            const account = accounts[index];

            if (account.config.sent_this_hour < account.config.hourly_limit) {
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
        const baseUrl = process.env.API_URL || 'https://api.nexspiresolutions.co.in';
        return `<img src="${baseUrl}/api/track/open/${trackingId}" width="1" height="1" style="display:none" alt="" />`;
    }

    /**
     * Wrap links with click tracking
     */
    wrapLinksWithTracking(html, trackingId) {
        const baseUrl = process.env.API_URL || 'https://api.nexspiresolutions.co.in';
        // Improved regex to handle both single and double quotes, and avoid wrapping internal anchors or already tracked links
        return html.replace(
            /href=["'](https?:\/\/(?!api\.nexspiresolutions\.co\.in\/api\/track\/)[^"']+)["']/g,
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
        const baseUrl = process.env.API_URL || 'https://api.nexspiresolutions.co.in';
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
            // Mark as sending (use NULL for env fallback since smtp_account_id is INT)
            const smtpId = smtpAccount.config.id === 'env' ? null : smtpAccount.config.id;
            await db.query('UPDATE email_queue SET status = ?, smtp_account_id = ? WHERE id = ?',
                ['sending', smtpId, queueItem.id]);

            // Prepare email content - use campaign html_content OR template html_content
            let htmlContent = campaign.html_content || campaign.template_html_content || '';

            // Add tracking pixel
            htmlContent = this.addUnsubscribeLink(htmlContent, queueItem.recipient_email, campaign.id);
            htmlContent = this.wrapLinksWithTracking(htmlContent, queueItem.tracking_id);
            htmlContent += this.generateTrackingPixel(queueItem.tracking_id);

            // Personalize content
            const vars = typeof queueItem.variables === 'string' ? JSON.parse(queueItem.variables || '{}') : (queueItem.variables || {});

            htmlContent = htmlContent
                .replace(/{{name}}/g, queueItem.recipient_name || vars.name || 'there')
                .replace(/{{email}}/g, queueItem.recipient_email)
                .replace(/{{first_name}}/g, (queueItem.recipient_name || vars.name || vars.first_name || '').split(' ')[0] || 'there')
                .replace(/{{company}}/g, queueItem.recipient_company || vars.company || 'your company');

            // Send email
            await smtpAccount.transporter.sendMail({
                from: `"${smtpAccount.config.from_name}" <${smtpAccount.config.from_email}>`,
                to: queueItem.recipient_email,
                subject: campaign.subject.replace(/{{name}}/g, queueItem.recipient_name || 'there'),
                html: htmlContent,
                text: campaign.text_content || htmlContent.replace(/<[^>]*>/g, '')
            });

            // Update queue item
            await db.query(
                'UPDATE email_queue SET status = ?, sent_at = NOW() WHERE id = ?',
                ['sent', queueItem.id]
            );

            // Update SMTP counter (skip DB for env fallback)
            if (smtpAccount.config.id !== 'env') {
                await db.query(
                    'UPDATE smtp_accounts SET sent_this_hour = sent_this_hour + 1, sent_today = sent_today + 1 WHERE id = ?',
                    [smtpAccount.config.id]
                );
            }
            smtpAccount.config.sent_this_hour++;

            // Update campaign counter
            await db.query(
                'UPDATE email_campaigns SET sent_count = sent_count + 1 WHERE id = ?',
                [campaign.id]
            );

            // Log tracking event
            await db.query(
                'INSERT INTO email_tracking (queue_id, campaign_id, tracking_id, event_type) VALUES (?, ?, ?, ?)',
                [queueItem.id, campaign.id, queueItem.tracking_id, 'sent']
            );

            console.log(`[EmailWorker] Sent to ${queueItem.recipient_email}`);
            return true;

        } catch (error) {
            console.error(`[EmailWorker] Failed to send to ${queueItem.recipient_email}:`, error.message);

            // Update queue with error
            const attempts = queueItem.attempts + 1;
            const status = attempts >= queueItem.max_attempts ? 'failed' : 'pending';
            const nextRetry = new Date(Date.now() + Math.pow(2, attempts) * 60000); // Exponential backoff

            await db.query(
                'UPDATE email_queue SET status = ?, attempts = ?, error_message = ?, next_retry_at = ? WHERE id = ?',
                [status, attempts, error.message, status === 'pending' ? nextRetry : null, queueItem.id]
            );

            if (status === 'failed') {
                await db.query(
                    'UPDATE email_campaigns SET failed_count = failed_count + 1 WHERE id = ?',
                    [campaign.id]
                );

                // Check for bounce
                if (error.message.includes('bounce') || error.responseCode === 550) {
                    await this.recordBounce(queueItem.recipient_email, 'hard', error.message);
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
                const newCount = existing.bounce_count + 1;
                const isDisabled = newCount >= 3 || type === 'hard';

                await db.query(
                    'UPDATE email_bounces SET bounce_count = ?, bounce_type = ?, last_bounce_reason = ?, is_disabled = ? WHERE email = ?',
                    [newCount, type, reason, isDisabled, email]
                );
            } else {
                await db.query(
                    'INSERT INTO email_bounces (email, bounce_type, last_bounce_reason, is_disabled) VALUES (?, ?, ?, ?)',
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
            // Get active campaigns with template content
            const [campaigns] = await db.query(
                `SELECT c.*, t.html_content as template_html_content 
                 FROM email_campaigns c 
                 LEFT JOIN email_templates t ON c.template_id = t.id 
                 WHERE c.status = 'sending'`
            );

            for (const campaign of campaigns) {
                // Get pending emails for this campaign
                const [pending] = await db.query(
                    `SELECT * FROM email_queue 
                     WHERE campaign_id = ? AND status = 'pending' 
                     AND (next_retry_at IS NULL OR next_retry_at <= NOW())
                     ORDER BY id ASC
                     LIMIT ?`,
                    [campaign.id, campaign.rate_limit_per_hour]
                );

                console.log(`[EmailWorker] Processing ${pending.length} emails for campaign ${campaign.id}`);

                for (const item of pending) {
                    await this.processEmail(item, campaign);

                    // Delay between emails (anti-spam)
                    await new Promise(resolve => setTimeout(resolve, campaign.delay_between_emails * 1000));
                }

                // Check if campaign is complete
                const [[remaining]] = await db.query(
                    "SELECT COUNT(*) as count FROM email_queue WHERE campaign_id = ? AND status = 'pending'",
                    [campaign.id]
                );

                if (remaining.count === 0 && !campaign.auto_enroll) {
                    // Only mark as completed if NOT an auto-enroll campaign
                    await db.query(
                        "UPDATE email_campaigns SET status = 'completed', completed_at = NOW() WHERE id = ?",
                        [campaign.id]
                    );
                    console.log(`[EmailWorker] Campaign ${campaign.id} completed`);
                } else if (remaining.count === 0 && campaign.auto_enroll) {
                    console.log(`[EmailWorker] Campaign ${campaign.id} queue empty but auto-enroll ON - staying active`);
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
