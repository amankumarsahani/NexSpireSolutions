/**
 * Email Tracking Routes
 * Handles open tracking, click tracking, and unsubscribes
 */

const express = require('express');
const router = express.Router();
const db = require('../config/database');

// 1x1 transparent GIF for tracking pixel
const TRACKING_PIXEL = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64'
);

/**
 * Track email open (via invisible pixel)
 */
router.get('/open/:trackingId', async (req, res) => {
    try {
        const { trackingId } = req.params;

        // Update queue item
        await db.query(
            'UPDATE email_queue SET opened_at = COALESCE(opened_at, NOW()), open_ip = COALESCE(open_ip, ?) WHERE tracking_id = ? AND opened_at IS NULL',
            [req.ip.replace(/^.*:ffff:/, ''), trackingId]
        );

        // Get queue item for campaign update
        const [[queueItem]] = await db.query('SELECT * FROM email_queue WHERE tracking_id = ?', [trackingId]);

        if (queueItem) {
            // Log tracking event
            await db.query(
                'INSERT INTO email_tracking (queue_id, campaign_id, tracking_id, event_type, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?)',
                [queueItem.id, queueItem.campaign_id, trackingId, 'opened', req.ip, req.get('User-Agent')]
            );

            // Update campaign open count (only first open counts)
            if (!queueItem.opened_at) {
                await db.query(
                    'UPDATE email_campaigns SET opened_count = opened_count + 1 WHERE id = ?',
                    [queueItem.campaign_id]
                );
            }
        }
    } catch (error) {
        console.error('Track open error:', error);
    }

    // Always return the tracking pixel
    res.set({
        'Content-Type': 'image/gif',
        'Content-Length': TRACKING_PIXEL.length,
        'Cache-Control': 'no-store, no-cache, must-revalidate, private'
    });
    res.send(TRACKING_PIXEL);
});

/**
 * Track link click and redirect
 */
router.get('/click/:trackingId', async (req, res) => {
    try {
        const { trackingId } = req.params;
        const { url } = req.query;

        if (!url) {
            return res.status(400).send('Missing URL');
        }

        const decodedUrl = decodeURIComponent(url);

        // Update queue item
        await db.query(
            'UPDATE email_queue SET clicked_at = COALESCE(clicked_at, NOW()), click_ip = COALESCE(click_ip, ?) WHERE tracking_id = ?',
            [req.ip.replace(/^.*:ffff:/, ''), trackingId]
        );

        // Get queue item for campaign update
        const [[queueItem]] = await db.query('SELECT * FROM email_queue WHERE tracking_id = ?', [trackingId]);

        if (queueItem) {
            // Log tracking event
            await db.query(
                'INSERT INTO email_tracking (queue_id, campaign_id, tracking_id, event_type, ip_address, user_agent, link_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [queueItem.id, queueItem.campaign_id, trackingId, 'clicked', req.ip, req.get('User-Agent'), decodedUrl]
            );

            // Update campaign click count (only first click counts)
            if (!queueItem.clicked_at) {
                await db.query(
                    'UPDATE email_campaigns SET clicked_count = clicked_count + 1 WHERE id = ?',
                    [queueItem.campaign_id]
                );
            }
        }

        // Redirect to actual URL
        res.redirect(302, decodedUrl);
    } catch (error) {
        console.error('Track click error:', error);
        res.redirect(302, req.query.url ? decodeURIComponent(req.query.url) : '/');
    }
});

/**
 * Handle unsubscribe
 */
router.get('/unsubscribe', async (req, res) => {
    try {
        const { email, campaign } = req.query;

        if (!email) {
            return res.status(400).send('Invalid request');
        }

        // Add to unsubscribe list
        await db.query(
            'INSERT IGNORE INTO email_unsubscribes (email, campaign_id, ip_address) VALUES (?, ?, ?)',
            [email, campaign || null, req.ip]
        );

        // Log tracking event if we have campaign info
        if (campaign) {
            const [[queueItem]] = await db.query(
                'SELECT * FROM email_queue WHERE campaign_id = ? AND recipient_email = ?',
                [campaign, email]
            );

            if (queueItem) {
                await db.query(
                    'INSERT INTO email_tracking (queue_id, campaign_id, tracking_id, event_type, ip_address) VALUES (?, ?, ?, ?, ?)',
                    [queueItem.id, campaign, queueItem.tracking_id, 'unsubscribed', req.ip]
                );

                await db.query(
                    'UPDATE email_campaigns SET unsubscribed_count = unsubscribed_count + 1 WHERE id = ?',
                    [campaign]
                );
            }
        }

        // Show confirmation page
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Unsubscribed</title>
                <style>
                    body { font-family: Arial, sans-serif; max-width: 600px; margin: 100px auto; text-align: center; }
                    .icon { font-size: 48px; margin-bottom: 20px; }
                    h1 { color: #333; }
                    p { color: #666; }
                </style>
            </head>
            <body>
                <div class="icon">✓</div>
                <h1>You've been unsubscribed</h1>
                <p>You will no longer receive marketing emails from us.</p>
                <p><small>If this was a mistake, please contact support.</small></p>
            </body>
            </html>
        `);
    } catch (error) {
        console.error('Unsubscribe error:', error);
        res.status(500).send('Failed to process unsubscribe request');
    }
});

/**
 * Webhook for bounce notifications (for external email providers)
 */
router.post('/bounce', async (req, res) => {
    try {
        const { email, type, reason, campaign_id } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email required' });
        }

        // Record bounce
        const bounceType = type === 'hard' ? 'hard' : 'soft';

        const [[existing]] = await db.query('SELECT * FROM email_bounces WHERE email = ?', [email]);

        if (existing) {
            const newCount = existing.bounce_count + 1;
            const isDisabled = newCount >= 3 || bounceType === 'hard';

            await db.query(
                'UPDATE email_bounces SET bounce_count = ?, bounce_type = ?, last_bounce_reason = ?, is_disabled = ? WHERE email = ?',
                [newCount, bounceType, reason, isDisabled, email]
            );
        } else {
            await db.query(
                'INSERT INTO email_bounces (email, bounce_type, last_bounce_reason, is_disabled) VALUES (?, ?, ?, ?)',
                [email, bounceType, reason, bounceType === 'hard']
            );
        }

        // Update campaign stats if campaign_id provided
        if (campaign_id) {
            await db.query(
                'UPDATE email_campaigns SET bounced_count = bounced_count + 1 WHERE id = ?',
                [campaign_id]
            );
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Bounce webhook error:', error);
        res.status(500).json({ error: 'Failed to process bounce' });
    }
});

module.exports = router;
