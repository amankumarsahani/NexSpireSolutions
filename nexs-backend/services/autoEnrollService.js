/**
 * Auto-Enrollment Service
 * Automatically enrolls new leads/clients into active auto-enroll campaigns
 */

const db = require('../config/database');
const crypto = require('crypto');

class AutoEnrollService {
    /**
     * Enroll a new lead into matching campaigns
     * @param {number} leadId - The lead's ID
     * @param {string} email - Lead's email address
     * @param {string} name - Lead's name
     */
    async enrollLead(leadId, email, name) {
        return this.enrollContact('lead', leadId, email, name, ['all_leads']);
    }

    /**
     * Enroll a new client into matching campaigns
     * @param {number} clientId - The client's ID
     * @param {string} email - Client's email address
     * @param {string} name - Client's name
     */
    async enrollClient(clientId, email, name) {
        return this.enrollContact('client', clientId, email, name, ['all_clients']);
    }

    /**
     * Generic enrollment for any contact type
     */
    async enrollContact(type, recipientId, email, name, audienceTypes) {
        if (!email) {
            console.log(`[AutoEnroll] Skipping ${type} ${recipientId}: no email`);
            return;
        }

        try {
            // Check if email is unsubscribed or bounced
            const [[unsub]] = await db.query(
                'SELECT 1 FROM email_unsubscribes WHERE email = ?',
                [email]
            );
            if (unsub) {
                console.log(`[AutoEnroll] Skipping ${email}: unsubscribed`);
                return;
            }

            const [[bounce]] = await db.query(
                'SELECT 1 FROM email_bounces WHERE email = ? AND is_disabled = TRUE',
                [email]
            );
            if (bounce) {
                console.log(`[AutoEnroll] Skipping ${email}: bounced/disabled`);
                return;
            }

            // Find active auto-enroll campaigns matching audience type
            const placeholders = audienceTypes.map(() => '?').join(',');
            const [campaigns] = await db.query(
                `SELECT id, name FROM email_campaigns 
                 WHERE auto_enroll = TRUE 
                 AND status IN ('sending', 'scheduled') 
                 AND audience_type IN (${placeholders})`,
                audienceTypes
            );

            if (campaigns.length === 0) {
                console.log(`[AutoEnroll] No matching auto-enroll campaigns for ${type}`);
                return;
            }

            for (const campaign of campaigns) {
                // Check if already in queue for this campaign
                const [[existing]] = await db.query(
                    'SELECT 1 FROM email_queue WHERE campaign_id = ? AND recipient_email = ?',
                    [campaign.id, email]
                );

                if (existing) {
                    console.log(`[AutoEnroll] ${email} already in campaign ${campaign.id}`);
                    continue;
                }

                // Add to queue
                const trackingId = crypto.randomUUID();
                await db.query(
                    `INSERT INTO email_queue 
                     (campaign_id, recipient_email, recipient_name, recipient_type, recipient_id, tracking_id, status)
                     VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
                    [campaign.id, email, name, type, recipientId, trackingId]
                );

                // Update campaign total_recipients
                await db.query(
                    'UPDATE email_campaigns SET total_recipients = total_recipients + 1 WHERE id = ?',
                    [campaign.id]
                );

                console.log(`[AutoEnroll] Added ${email} to campaign "${campaign.name}" (ID: ${campaign.id})`);
            }
        } catch (error) {
            console.error('[AutoEnroll] Error:', error.message);
        }
    }
}

module.exports = new AutoEnrollService();
