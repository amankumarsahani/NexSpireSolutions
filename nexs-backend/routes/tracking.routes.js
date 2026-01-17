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
            'UPDATE email_queue SET openedAt = COALESCE(openedAt, NOW()) WHERE trackingId = ? AND openedAt IS NULL',
            [trackingId]
        );

        // Get queue item for campaign update
        const [[queueItem]] = await db.query('SELECT * FROM email_queue WHERE trackingId = ?', [trackingId]);

        if (queueItem) {
            // Log tracking event
            await db.query(
                'INSERT INTO email_tracking (queueId, campaignId, trackingId, eventType, ipAddress, userAgent) VALUES (?, ?, ?, ?, ?, ?)',
                [queueItem.id, queueItem.campaignId, trackingId, 'opened', req.ip, req.get('User-Agent')]
            );

            // Update campaign open count (only first open counts)
            if (!queueItem.openedAt) {
                await db.query(
                    'UPDATE email_campaigns SET openedCount = openedCount + 1 WHERE id = ?',
                    [queueItem.campaignId]
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
            'UPDATE email_queue SET clickedAt = COALESCE(clickedAt, NOW()) WHERE trackingId = ?',
            [trackingId]
        );

        // Get queue item for campaign update
        const [[queueItem]] = await db.query('SELECT * FROM email_queue WHERE trackingId = ?', [trackingId]);

        if (queueItem) {
            // Log tracking event
            await db.query(
                'INSERT INTO email_tracking (queueId, campaignId, trackingId, eventType, ipAddress, userAgent, linkUrl) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [queueItem.id, queueItem.campaignId, trackingId, 'clicked', req.ip, req.get('User-Agent'), decodedUrl]
            );

            // Update campaign click count (only first click counts)
            if (!queueItem.clickedAt) {
                await db.query(
                    'UPDATE email_campaigns SET clickedCount = clickedCount + 1 WHERE id = ?',
                    [queueItem.campaignId]
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
            'INSERT IGNORE INTO email_unsubscribes (email, campaignId, ipAddress) VALUES (?, ?, ?)',
            [email, campaign || null, req.ip]
        );

        // Log tracking event if we have campaign info
        if (campaign) {
            const [[queueItem]] = await db.query(
                'SELECT * FROM email_queue WHERE campaignId = ? AND recipientEmail = ?',
                [campaign, email]
            );

            if (queueItem) {
                await db.query(
                    'INSERT INTO email_tracking (queueId, campaignId, trackingId, eventType, ipAddress) VALUES (?, ?, ?, ?, ?)',
                    [queueItem.id, campaign, queueItem.trackingId, 'unsubscribed', req.ip]
                );

                await db.query(
                    'UPDATE email_campaigns SET unsubscribedCount = unsubscribedCount + 1 WHERE id = ?',
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
        const { email, type, reason, campaignId } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email required' });
        }

        // Record bounce
        const bounceType = type === 'hard' ? 'hard' : 'soft';

        const [[existing]] = await db.query('SELECT * FROM email_bounces WHERE email = ?', [email]);

        if (existing) {
            const newCount = existing.bounceCount + 1;
            const isDisabled = newCount >= 3 || bounceType === 'hard';

            await db.query(
                'UPDATE email_bounces SET bounceCount = ?, bounceType = ?, lastBounceReason = ?, isDisabled = ? WHERE email = ?',
                [newCount, bounceType, reason, isDisabled, email]
            );
        } else {
            await db.query(
                'INSERT INTO email_bounces (email, bounceType, lastBounceReason, isDisabled) VALUES (?, ?, ?, ?)',
                [email, bounceType, reason, bounceType === 'hard']
            );
        }

        // Update campaign stats if campaignId provided
        if (campaignId) {
            await db.query(
                'UPDATE email_campaigns SET bouncedCount = bouncedCount + 1 WHERE id = ?',
                [campaignId]
            );
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Bounce webhook error:', error);
        res.status(500).json({ error: 'Failed to process bounce' });
    }
});

module.exports = router;
