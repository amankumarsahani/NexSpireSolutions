/**
 * Campaign Controller
 * Handles email campaign CRUD and sending
 */

const db = require('../config/database');
const emailService = require('../services/email.service');

// Get all campaigns
exports.getAllCampaigns = async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        let whereClause = 'WHERE 1=1';
        const params = [];

        if (status) {
            whereClause += ' AND status = ?';
            params.push(status);
        }

        const [campaigns] = await db.query(
            `SELECT c.*, CONCAT(u.firstName, ' ', u.lastName) as createdByName
             FROM email_campaigns c
             LEFT JOIN users u ON c.createdBy = u.id
             ${whereClause}
             ORDER BY c.createdAt DESC
             LIMIT ? OFFSET ?`,
            [...params, parseInt(limit), parseInt(offset)]
        );

        const [[{ total }]] = await db.query(
            `SELECT COUNT(*) as total FROM email_campaigns ${whereClause}`,
            params
        );

        res.json({
            success: true,
            data: campaigns,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get campaigns error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch campaigns' });
    }
};

// Get campaign by ID
exports.getCampaignById = async (req, res) => {
    try {
        const { id } = req.params;

        const [[campaign]] = await db.query(
            `SELECT c.*, CONCAT(u.firstName, ' ', u.lastName) as createdByName
             FROM email_campaigns c
             LEFT JOIN users u ON c.createdBy = u.id
             WHERE c.id = ?`,
            [id]
        );

        if (!campaign) {
            return res.status(404).json({ success: false, error: 'Campaign not found' });
        }

        res.json({ success: true, data: campaign });
    } catch (error) {
        console.error('Get campaign error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch campaign' });
    }
};

// Create campaign
exports.createCampaign = async (req, res) => {
    try {
        const {
            name,
            subject,
            previewText,
            htmlContent,
            textContent,
            templateId,
            audienceType,
            audienceFilter,
            customEmails,
            scheduledAt,
            rateLimitPerHour = 50,
            delayBetweenEmails = 3
        } = req.body;

        if (!name || !subject) {
            return res.status(400).json({ success: false, error: 'Name and subject are required' });
        }

        const [result] = await db.query(
            `INSERT INTO email_campaigns 
             (name, subject, previewText, htmlContent, textContent, templateId, 
              audienceType, audienceFilter, customEmails, scheduledAt, 
              rateLimitPerHour, delayBetweenEmails, createdBy)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                name, subject, previewText, htmlContent, textContent, templateId,
                audienceType || 'all_leads',
                audienceFilter ? JSON.stringify(audienceFilter) : null,
                customEmails,
                scheduledAt,
                rateLimitPerHour,
                delayBetweenEmails,
                req.user?.id
            ]
        );

        const [[newCampaign]] = await db.query('SELECT * FROM email_campaigns WHERE id = ?', [result.insertId]);

        res.status(201).json({ success: true, data: newCampaign });
    } catch (error) {
        console.error('Create campaign error:', error);
        res.status(500).json({ success: false, error: 'Failed to create campaign' });
    }
};

// Update campaign
exports.updateCampaign = async (req, res) => {
    try {
        const { id } = req.params;
        const allowedFields = [
            'name', 'subject', 'previewText', 'htmlContent', 'textContent',
            'templateId', 'audienceType', 'audienceFilter', 'customEmails',
            'scheduledAt', 'rateLimitPerHour', 'delayBetweenEmails', 'status'
        ];

        const updates = [];
        const values = [];

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates.push(`${field} = ?`);
                values.push(field === 'audienceFilter' ? JSON.stringify(req.body[field]) : req.body[field]);
            }
        }

        if (updates.length === 0) {
            return res.status(400).json({ success: false, error: 'No valid fields to update' });
        }

        values.push(id);
        await db.query(`UPDATE email_campaigns SET ${updates.join(', ')} WHERE id = ?`, values);

        const [[updated]] = await db.query('SELECT * FROM email_campaigns WHERE id = ?', [id]);

        res.json({ success: true, data: updated });
    } catch (error) {
        console.error('Update campaign error:', error);
        res.status(500).json({ success: false, error: 'Failed to update campaign' });
    }
};

// Delete campaign
exports.deleteCampaign = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM email_campaigns WHERE id = ?', [id]);
        res.json({ success: true, message: 'Campaign deleted' });
    } catch (error) {
        console.error('Delete campaign error:', error);
        res.status(500).json({ success: false, error: 'Failed to delete campaign' });
    }
};

// Get campaign stats
exports.getCampaignStats = async (req, res) => {
    try {
        const { id } = req.params;

        const [[campaign]] = await db.query(
            'SELECT sentCount, failedCount, openedCount, clickedCount, bouncedCount, unsubscribedCount, totalRecipients FROM email_campaigns WHERE id = ?',
            [id]
        );

        if (!campaign) {
            return res.status(404).json({ success: false, error: 'Campaign not found' });
        }

        const stats = {
            ...campaign,
            openRate: campaign.sentCount > 0 ? ((campaign.openedCount / campaign.sentCount) * 100).toFixed(2) : 0,
            clickRate: campaign.openedCount > 0 ? ((campaign.clickedCount / campaign.openedCount) * 100).toFixed(2) : 0,
            bounceRate: campaign.sentCount > 0 ? ((campaign.bouncedCount / campaign.sentCount) * 100).toFixed(2) : 0
        };

        res.json({ success: true, data: stats });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch stats' });
    }
};

// Get campaign recipients
exports.getCampaignRecipients = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;

        let whereClause = 'WHERE campaignId = ?';
        const params = [id];

        if (status) {
            whereClause += ' AND status = ?';
            params.push(status);
        }

        const [recipients] = await db.query(
            `SELECT id, recipientEmail, recipientName, status, sentAt, openedAt, clickedAt, errorMessage
             FROM email_queue
             ${whereClause}
             ORDER BY id DESC
             LIMIT ? OFFSET ?`,
            [...params, parseInt(limit), parseInt(offset)]
        );

        const [[{ total }]] = await db.query(
            `SELECT COUNT(*) as total FROM email_queue ${whereClause}`,
            params
        );

        res.json({
            success: true,
            data: recipients,
            pagination: { page: parseInt(page), limit: parseInt(limit), total }
        });
    } catch (error) {
        console.error('Get recipients error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch recipients' });
    }
};

// Start sending campaign
exports.startCampaign = async (req, res) => {
    try {
        const { id } = req.params;

        const [[campaign]] = await db.query('SELECT * FROM email_campaigns WHERE id = ?', [id]);

        if (!campaign) {
            return res.status(404).json({ success: false, error: 'Campaign not found' });
        }

        if (campaign.status === 'sending') {
            return res.status(400).json({ success: false, error: 'Campaign is already sending' });
        }

        // Build recipient list based on audience type
        let recipients = [];

        if (campaign.audienceType === 'all_leads') {
            const [leads] = await db.query('SELECT id, contactName as name, email FROM leads WHERE email IS NOT NULL');
            recipients = leads.map(l => ({ id: l.id, type: 'lead', email: l.email, name: l.name }));
        } else if (campaign.audienceType === 'all_clients') {
            const [clients] = await db.query('SELECT id, contactName as name, email FROM clients WHERE email IS NOT NULL');
            recipients = clients.map(c => ({ id: c.id, type: 'client', email: c.email, name: c.name }));
        } else if (campaign.audienceType === 'filtered' && campaign.audienceFilter) {
            const filter = typeof campaign.audienceFilter === 'string'
                ? JSON.parse(campaign.audienceFilter)
                : campaign.audienceFilter;

            let table = filter.source === 'clients' ? 'clients' : 'leads';
            let whereClause = 'WHERE email IS NOT NULL';
            const params = [];

            if (filter.status) {
                whereClause += ' AND status = ?';
                params.push(filter.status);
            }

            const [filtered] = await db.query(`SELECT id, contactName as name, email FROM ${table} ${whereClause}`, params);
            recipients = filtered.map(r => ({ id: r.id, type: filter.source || 'lead', email: r.email, name: r.name }));
        } else if (campaign.audienceType === 'custom' && campaign.customEmails) {
            const emails = campaign.customEmails.split(/[,\n]/).map(e => e.trim()).filter(e => e);
            recipients = emails.map(email => ({ id: null, type: 'custom', email, name: email.split('@')[0] }));
        }

        // Filter out unsubscribed emails
        const [unsubscribed] = await db.query('SELECT email FROM email_unsubscribes');
        const unsubSet = new Set(unsubscribed.map(u => u.email.toLowerCase()));
        recipients = recipients.filter(r => !unsubSet.has(r.email.toLowerCase()));

        // Filter out bounced emails
        const [bounced] = await db.query('SELECT email FROM email_bounces WHERE isDisabled = TRUE');
        const bouncedSet = new Set(bounced.map(b => b.email.toLowerCase()));
        recipients = recipients.filter(r => !bouncedSet.has(r.email.toLowerCase()));

        if (recipients.length === 0) {
            return res.status(400).json({ success: false, error: 'No valid recipients found' });
        }

        // Insert into queue
        const crypto = require('crypto');
        for (const recipient of recipients) {
            const trackingId = crypto.randomBytes(16).toString('hex');
            await db.query(
                `INSERT INTO email_queue 
                 (campaignId, recipientEmail, recipientName, recipientType, recipientId, trackingId, status)
                 VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
                [id, recipient.email, recipient.name, recipient.type, recipient.id, trackingId]
            );
        }

        // Update campaign status
        await db.query(
            'UPDATE email_campaigns SET status = ?, totalRecipients = ?, startedAt = NOW() WHERE id = ?',
            ['sending', recipients.length, id]
        );

        res.json({
            success: true,
            message: `Campaign started. ${recipients.length} emails queued.`,
            totalQueued: recipients.length
        });
    } catch (error) {
        console.error('Start campaign error:', error);
        res.status(500).json({ success: false, error: 'Failed to start campaign' });
    }
};

// Pause campaign
exports.pauseCampaign = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('UPDATE email_campaigns SET status = ? WHERE id = ?', ['paused', id]);
        res.json({ success: true, message: 'Campaign paused' });
    } catch (error) {
        console.error('Pause campaign error:', error);
        res.status(500).json({ success: false, error: 'Failed to pause campaign' });
    }
};

// Resume campaign
exports.resumeCampaign = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('UPDATE email_campaigns SET status = ? WHERE id = ?', ['sending', id]);
        res.json({ success: true, message: 'Campaign resumed' });
    } catch (error) {
        console.error('Resume campaign error:', error);
        res.status(500).json({ success: false, error: 'Failed to resume campaign' });
    }
};

// Dashboard stats
exports.getDashboardStats = async (req, res) => {
    try {
        const [[stats]] = await db.query(`
            SELECT 
                COUNT(*) as totalCampaigns,
                SUM(CASE WHEN status = 'sending' THEN 1 ELSE 0 END) as activeCampaigns,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completedCampaigns,
                SUM(sentCount) as totalSent,
                SUM(openedCount) as totalOpened,
                SUM(clickedCount) as totalClicked
            FROM email_campaigns
        `);

        const [[unsubCount]] = await db.query('SELECT COUNT(*) as count FROM email_unsubscribes');
        const [[bounceCount]] = await db.query('SELECT COUNT(*) as count FROM email_bounces WHERE isDisabled = TRUE');

        res.json({
            success: true,
            data: {
                ...stats,
                unsubscribed: unsubCount.count,
                bounced: bounceCount.count,
                overallOpenRate: stats.totalSent > 0
                    ? ((stats.totalOpened / stats.totalSent) * 100).toFixed(2)
                    : 0
            }
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch stats' });
    }
};
