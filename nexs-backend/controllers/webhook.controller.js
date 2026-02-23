/**
 * Razorpay Webhook Controller
 * Handles incoming webhook events from Razorpay
 */

const RazorpayService = require('../services/razorpay.service');
const StripeService = require('../services/stripe.service');
const TenantModel = require('../models/tenant.model');
const UserModel = require('../models/user.model');
const ClientModel = require('../models/client.model');
const Provisioner = require('../services/provisioner');
const { pool } = require('../config/database');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

class WebhookController {
    /**
     * Main webhook handler
     */
    /**
     * Main webhook handler
     */
    async handleWebhook(req, res) {
        try {
            const signature = req.headers['x-razorpay-signature'];
            const body = JSON.stringify(req.body);

            // Log raw webhook
            await pool.query(
                `INSERT INTO webhook_logs (provider, event_type, payload) VALUES (?, ?, ?)`,
                ['razorpay', req.body.event || 'unknown', body]
            ).catch(err => console.error('Failed to log webhook:', err));

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
     * Helper to create client if not exists
     */
    async createClientIfNotExist(email, name, phone) {
        if (!email) return null;

        try {
            // Check if client exists by email
            const [existingClient] = await pool.query('SELECT * FROM clients WHERE email = ?', [email]);
            if (existingClient) {
                console.log(`[Webhook] Client already exists: ${email}`);
                return existingClient;
            }

            // Create client
            const clientId = await ClientModel.create({
                companyName: name || 'Unknown Company',
                contactName: name || 'Unknown',
                email,
                phone: phone || '',
                status: 'active', // Active since they paid
                industry: 'Other',
                notes: 'Created via Payment Webhook',
                createdBy: null // System created
            });

            console.log(`[Webhook] Created new client: ${email}`);
            return await ClientModel.findById(clientId);
        } catch (error) {
            console.error(`[Webhook] Failed to create client ${email}:`, error);
            return null;
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
                const provisioner = new Provisioner();
                await provisioner.startProcess(tenant);
                await TenantModel.updateProcessStatus(tenantId, 'running');
            } catch (error) {
                console.error('[Webhook] Failed to start tenant process:', error);
            }
        }

        console.log(`[Webhook] Subscription activated for tenant ${tenantId}`);

        // Auto-create client from subscription email
        let clientId = null;
        if (subscription.notes?.email) {
            const client = await this.createClientIfNotExist(
                subscription.notes.email,
                subscription.notes.name,
                subscription.notes.phone
            );
            if (client) clientId = client.id;
        }
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
        // We need client_id if available. 
        // For recurring payments, we might need to store client_id in subscription or lookup via email.
        // For now, let's try to find client by tenant email if possible or just use tenant_id

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
                const provisioner = new Provisioner();
                await provisioner.stopProcess(tenant);
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
    // Stripe webhook handler
    // Stripe webhook handler
    async handleStripeWebhook(req, res) {
        try {
            const sig = req.headers['stripe-signature'];
            const payload = req.body; // raw body buffer

            // We need to parse event to log it properly, but verification needs raw body
            // We'll log after construction/verification for safety, or we can log raw buffer if needed.
            // Let's rely on StripeService to verify first.

            if (!StripeService.verifyWebhookSignature(payload, sig)) {
                console.error('[Webhook] Invalid Stripe signature');
                // Log failed attempt
                await pool.query(
                    `INSERT INTO webhook_logs (provider, status, error_message) VALUES (?, ?, ?)`,
                    ['stripe', 'failed', 'Invalid signature']
                ).catch(err => console.error('Failed to log webhook:', err));
                return res.status(400).json({ error: 'Invalid signature' });
            }

            const event = StripeService.getLastEvent();

            // Log successful webhook
            await pool.query(
                `INSERT INTO webhook_logs (provider, event_type, payload, status) VALUES (?, ?, ?, ?)`,
                ['stripe', event.type, JSON.stringify(event), 'received']
            ).catch(err => console.error('Failed to log webhook:', err));

            console.log(`[Webhook] Received Stripe event: ${event.type}`);
            switch (event.type) {
                case 'checkout.session.completed':
                    await this.handleStripeCheckoutSessionCompleted(event);
                    break;
                case 'invoice.paid':
                    await this.handleStripeInvoicePaid(event);
                    break;
                case 'invoice.payment_failed':
                    await this.handleStripeInvoicePaymentFailed(event);
                    break;
                case 'customer.subscription.deleted':
                    await this.handleStripeSubscriptionDeleted(event);
                    break;
                default:
                    console.log(`[Webhook] Unhandled Stripe event: ${event.type}`);
            }
            res.json({ received: true });
        } catch (error) {
            console.error('[Webhook] Stripe processing error:', error);
            res.status(500).json({ error: 'Webhook processing failed' });
        }
    }

    async handleStripeCheckoutSessionCompleted(event) {
        const session = event.data.object;
        const tenantId = session.metadata?.tenant_id;
        const planId = session.metadata?.plan_id;

        if (!tenantId) return;
        await TenantModel.update(tenantId, { status: 'active' });

        // Record Payment
        try {
            // Find subscription if it exists (for recurring) or null
            let subscriptionId = null;
            if (session.subscription) {
                const [subs] = await pool.query('SELECT id FROM subscriptions WHERE stripe_subscription_id = ?', [session.subscription]);
                if (subs.length) subscriptionId = subs[0].id;
            }

            await StripeService.recordPayment({
                tenant_id: tenantId,
                subscription_id: subscriptionId,
                amount: session.amount_total / 100, // Stripe amount is in cents
                stripe_payment_intent_id: session.payment_intent,
                stripe_invoice_id: session.invoice || session.id,
                status: 'success'
            });
            console.log(`[Webhook] Stripe payment recorded for tenant ${tenantId}`);
        } catch (err) {
            console.error('[Webhook] Failed to record Stripe payment:', err);
        }

        const workflowEngine = require('../services/workflowEngine');
        await workflowEngine.trigger('stripe_payment_received', 'tenant', tenantId, { session });

        // Auto-create client from Stripe session
        const email = session.customer_details?.email || session.customer_email;
        const name = session.customer_details?.name;

        if (email) {
            await this.createClientIfNotExist(email, name, null);
        }
    }

    async handleStripeInvoicePaid(event) {
        const invoice = event.data.object;
        let tenantId = invoice.metadata?.tenant_id;

        // If metadata is empty on invoice, try fetching it from subscription
        if (!tenantId && invoice.subscription) {
            try {
                const [subs] = await pool.query('SELECT tenant_id FROM subscriptions WHERE stripe_subscription_id = ?', [invoice.subscription]);
                if (subs.length) {
                    tenantId = subs[0].tenant_id;
                }
            } catch (err) {
                console.error('[Webhook] Error fetching tenant_id from subscription:', err);
            }
        }

        if (!tenantId) return;

        try {
            // Find subscription
            let subscriptionId = null;
            if (invoice.subscription) {
                const [subs] = await pool.query('SELECT id FROM subscriptions WHERE stripe_subscription_id = ?', [invoice.subscription]);
                if (subs.length) {
                    subscriptionId = subs[0].id;
                    // Ensure subscription is active if it was past due
                    await pool.query('UPDATE subscriptions SET status = "active" WHERE id = ?', [subscriptionId]);
                }
            }

            await StripeService.recordPayment({
                tenant_id: tenantId,
                subscription_id: subscriptionId,
                amount: invoice.amount_paid / 100,
                stripe_payment_intent_id: invoice.payment_intent,
                stripe_invoice_id: invoice.id,
                status: 'success'
            });
            console.log(`[Webhook] Stripe recurring payment recorded for tenant ${tenantId}`);

            // Check if tenant was suspended, if so reactivate
            const tenant = await TenantModel.findById(tenantId);
            if (tenant) {
                if (tenant.status !== 'active') {
                    await TenantModel.update(tenantId, { status: 'active' });
                    console.log(`[Webhook] Reactivated tenant ${tenantId}`);
                }

                if (tenant.process_status !== 'running' && tenant.assigned_port && tenant.db_name) {
                    try {
                        const provisioner = new Provisioner();
                        await provisioner.startProcess(tenant);
                        await TenantModel.updateProcessStatus(tenantId, 'running');
                        console.log(`[Webhook] Started PM2 process for tenant ${tenantId}`);
                    } catch (startError) {
                        console.error('[Webhook] Failed to start tenant process:', startError);
                    }
                }
            }

        } catch (err) {
            console.error('[Webhook] Failed to record Stripe recurring payment:', err);
        }

        const workflowEngine = require('../services/workflowEngine');
        await workflowEngine.trigger('stripe_invoice_paid', 'tenant', tenantId, { invoice });
    }

    async handleStripeInvoicePaymentFailed(event) {
        const invoice = event.data.object;
        let tenantId = invoice.metadata?.tenant_id;

        if (!tenantId && invoice.subscription) {
            try {
                const [subs] = await pool.query('SELECT tenant_id FROM subscriptions WHERE stripe_subscription_id = ?', [invoice.subscription]);
                if (subs.length) {
                    tenantId = subs[0].tenant_id;
                }
            } catch (err) {
                console.error('[Webhook] Error fetching tenant_id from subscription:', err);
            }
        }

        if (!tenantId) {
            console.error('[Webhook] Could not find tenantId for failed invoice');
            return;
        }

        try {
            let subscriptionId = null;
            if (invoice.subscription) {
                const [subs] = await pool.query('SELECT id FROM subscriptions WHERE stripe_subscription_id = ?', [invoice.subscription]);
                if (subs.length) {
                    subscriptionId = subs[0].id;
                    await pool.query('UPDATE subscriptions SET status = "past_due" WHERE id = ?', [subscriptionId]);
                }
            }

            await StripeService.recordPayment({
                tenant_id: tenantId,
                subscription_id: subscriptionId,
                amount: invoice.amount_due / 100,
                stripe_payment_intent_id: invoice.payment_intent,
                stripe_invoice_id: invoice.id,
                status: 'failed'
            });
            console.log(`[Webhook] Stripe failed payment recorded for tenant ${tenantId}`);

            // Suspend the tenant and stop process
            await TenantModel.update(tenantId, { status: 'suspended' });
            console.log(`[Webhook] Suspended tenant ${tenantId} due to failed payment`);

            const tenant = await TenantModel.findById(tenantId);
            if (tenant && tenant.process_status === 'running') {
                try {
                    const provisioner = new Provisioner();
                    await provisioner.stopProcess(tenant);
                    await TenantModel.updateProcessStatus(tenantId, 'stopped');
                    console.log(`[Webhook] Stopped PM2 process for tenant ${tenantId}`);
                } catch (stopError) {
                    console.error('[Webhook] Failed to stop tenant process:', stopError);
                }
            }

        } catch (err) {
            console.error('[Webhook] Error handling Stripe payment failure:', err);
        }
    }

    async handleStripeSubscriptionDeleted(event) {
        const subscription = event.data.object;
        const tenantId = subscription.metadata?.tenant_id;
        if (!tenantId) return;
        await pool.query(`UPDATE subscriptions SET status = 'cancelled' WHERE stripe_subscription_id = ?`, [subscription.id]);

        await TenantModel.update(tenantId, { status: 'cancelled' });
        const tenant = await TenantModel.findById(tenantId);
        if (tenant && tenant.process_status === 'running') {
            try {
                const provisioner = new Provisioner();
                await provisioner.stopProcess(tenant);
                await TenantModel.updateProcessStatus(tenantId, 'stopped');
            } catch (err) {
                console.error('[Webhook] Failed to stop process for cancelled sub:', err);
            }
        }

        const workflowEngine = require('../services/workflowEngine');
        await workflowEngine.trigger('stripe_subscription_cancelled', 'tenant', tenantId, { subscription });
    }
}


module.exports = new WebhookController();
