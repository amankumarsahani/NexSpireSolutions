/**
 * Razorpay Webhook Controller
 * Handles incoming webhook events from Razorpay
 */

const RazorpayService = require('../services/razorpay.service');
const TenantModel = require('../models/tenant.model');
const Provisioner = require('../services/provisioner');
const { pool } = require('../config/database');

class WebhookController {
    /**
     * Main webhook handler
     */
    async handleWebhook(req, res) {
        try {
            const signature = req.headers['x-razorpay-signature'];
            const body = JSON.stringify(req.body);

            // Verify signature
            if (!RazorpayService.verifyWebhookSignature(body, signature)) {
                console.error('[Webhook] Invalid signature');
                return res.status(400).json({ error: 'Invalid signature' });
            }

            const event = req.body.event;
            const payload = req.body.payload;

            console.log(`[Webhook] Received event: ${event}`);

            // Route to appropriate handler
            switch (event) {
                case 'subscription.activated':
                    await this.handleSubscriptionActivated(payload);
                    break;

                case 'subscription.charged':
                    await this.handleSubscriptionCharged(payload);
                    break;

                case 'subscription.completed':
                case 'subscription.cancelled':
                    await this.handleSubscriptionCancelled(payload);
                    break;

                case 'subscription.halted':
                    await this.handleSubscriptionHalted(payload);
                    break;

                case 'payment.captured':
                    await this.handlePaymentCaptured(payload);
                    break;

                case 'payment.failed':
                    await this.handlePaymentFailed(payload);
                    break;

                default:
                    console.log(`[Webhook] Unhandled event: ${event}`);
            }

            res.json({ received: true });
        } catch (error) {
            console.error('[Webhook] Error:', error);
            res.status(500).json({ error: 'Webhook processing failed' });
        }
    }

    /**
     * Handle subscription activated
     */
    async handleSubscriptionActivated(payload) {
        const subscription = payload.subscription.entity;
        const tenantId = subscription.notes?.tenant_id;

        if (!tenantId) {
            console.error('[Webhook] No tenant_id in subscription notes');
            return;
        }

        // Update subscription status
        await pool.query(`
            UPDATE subscriptions SET status = 'active' 
            WHERE razorpay_subscription_id = ?
        `, [subscription.id]);

        // Activate tenant
        await TenantModel.update(tenantId, { status: 'active' });

        // Start tenant process if not running
        const tenant = await TenantModel.findById(tenantId);
        if (tenant && tenant.process_status !== 'running') {
            try {
                await Provisioner.startProcess(tenant);
                await TenantModel.updateProcessStatus(tenantId, 'running');
            } catch (error) {
                console.error('[Webhook] Failed to start tenant process:', error);
            }
        }

        console.log(`[Webhook] Subscription activated for tenant ${tenantId}`);
    }

    /**
     * Handle subscription charged (recurring payment)
     */
    async handleSubscriptionCharged(payload) {
        const subscription = payload.subscription.entity;
        const payment = payload.payment.entity;
        const tenantId = subscription.notes?.tenant_id;

        if (!tenantId) return;

        // Get subscription ID from database
        const [subs] = await pool.query(
            'SELECT id FROM subscriptions WHERE razorpay_subscription_id = ?',
            [subscription.id]
        );

        // Record payment
        await RazorpayService.recordPayment({
            tenant_id: tenantId,
            subscription_id: subs[0]?.id,
            amount: payment.amount / 100, // Convert from paise
            razorpay_payment_id: payment.id,
            razorpay_order_id: payment.order_id,
            status: 'success'
        });

        // Update subscription period
        const periodEnd = new Date();
        periodEnd.setMonth(periodEnd.getMonth() + 1);

        await pool.query(`
            UPDATE subscriptions 
            SET current_period_start = NOW(), current_period_end = ?
            WHERE razorpay_subscription_id = ?
        `, [periodEnd, subscription.id]);

        console.log(`[Webhook] Payment recorded for tenant ${tenantId}: ₹${payment.amount / 100}`);
    }

    /**
     * Handle subscription cancelled
     */
    async handleSubscriptionCancelled(payload) {
        const subscription = payload.subscription.entity;
        const tenantId = subscription.notes?.tenant_id;

        if (!tenantId) return;

        // Update subscription status
        await pool.query(`
            UPDATE subscriptions SET status = 'cancelled' 
            WHERE razorpay_subscription_id = ?
        `, [subscription.id]);

        // Suspend tenant
        await TenantModel.update(tenantId, { status: 'suspended' });

        // Stop tenant process
        const tenant = await TenantModel.findById(tenantId);
        if (tenant && tenant.process_status === 'running') {
            try {
                await Provisioner.stopProcess(tenant);
                await TenantModel.updateProcessStatus(tenantId, 'stopped');
            } catch (error) {
                console.error('[Webhook] Failed to stop tenant process:', error);
            }
        }

        console.log(`[Webhook] Subscription cancelled for tenant ${tenantId}`);
    }

    /**
     * Handle subscription halted (payment failed multiple times)
     */
    async handleSubscriptionHalted(payload) {
        const subscription = payload.subscription.entity;
        const tenantId = subscription.notes?.tenant_id;

        if (!tenantId) return;

        // Update subscription status
        await pool.query(`
            UPDATE subscriptions SET status = 'past_due' 
            WHERE razorpay_subscription_id = ?
        `, [subscription.id]);

        // Suspend tenant (graceful - give them time to fix payment)
        await TenantModel.update(tenantId, { status: 'suspended' });

        // TODO: Send email notification about payment failure

        console.log(`[Webhook] Subscription halted for tenant ${tenantId}`);
    }

    /**
     * Handle payment captured
     */
    async handlePaymentCaptured(payload) {
        const payment = payload.payment.entity;
        const tenantId = payment.notes?.tenant_id;

        if (!tenantId) return;

        // Record one-time payment
        await RazorpayService.recordPayment({
            tenant_id: tenantId,
            amount: payment.amount / 100,
            razorpay_payment_id: payment.id,
            razorpay_order_id: payment.order_id,
            status: 'success'
        });

        console.log(`[Webhook] Payment captured for tenant ${tenantId}: ₹${payment.amount / 100}`);
    }

    /**
     * Handle payment failed
     */
    async handlePaymentFailed(payload) {
        const payment = payload.payment.entity;
        const tenantId = payment.notes?.tenant_id;

        if (!tenantId) return;

        // Record failed payment
        await RazorpayService.recordPayment({
            tenant_id: tenantId,
            amount: payment.amount / 100,
            razorpay_payment_id: payment.id,
            status: 'failed'
        });

        // TODO: Send email notification about failed payment

        console.log(`[Webhook] Payment failed for tenant ${tenantId}`);
    }
}

module.exports = new WebhookController();
