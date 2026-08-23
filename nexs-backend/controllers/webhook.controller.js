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
const axios = require('axios');

/**
 * WhatsApp webhook fan-out helpers.
 *
 * Module-level rather than class methods because they are pure plumbing with no
 * request context, and keeping them out of the class makes them straightforward to
 * exercise from tests/whatsapp/webhookRouting.test.js.
 */

const { loadRegistry, verifySignature, phoneIdsIn } = require('../services/whatsappWebhookAuth');

/** Max attempts before a forward is given up on and left visible as `failed`. */
const FORWARD_MAX_ATTEMPTS = 8;

/**
 * POST to the tenant, and persist for retry if that fails.
 *
 * Meta has already been acked by this point, so nothing else will re-deliver.
 * A tenant restarting during a deploy is routine, and losing that window's
 * messages with no trace is not acceptable.
 */
async function deliverToTenant(phoneNumberId, tenantApiUrl, body) {
    try {
        await axios.post(`${tenantApiUrl}/api/whatsapp/incoming`, body, {
            timeout: 10000,
            headers: { 'X-Internal-Key': process.env.INTERNAL_OAUTH_KEY }
        });
        await pool.query(
            `UPDATE whatsapp_phone_registry
                SET last_inbound_at = NOW(), last_forward_error = NULL
              WHERE meta_phone_id = ?`,
            [phoneNumberId]
        ).catch(() => {});
        return true;
    } catch (err) {
        const message = String(err.message || 'forward failed').slice(0, 500);
        console.error(`[Webhook] Queueing WhatsApp forward for ${tenantApiUrl}: ${message}`);
        await pool.query(
            `INSERT INTO whatsapp_forward_queue
                (meta_phone_id, tenant_api_url, payload, attempts, next_attempt_at, last_error)
             VALUES (?, ?, ?, 1, DATE_ADD(NOW(), INTERVAL 30 SECOND), ?)`,
            [phoneNumberId, tenantApiUrl, JSON.stringify(body), message]
        ).catch((qErr) => {
            // If even the queue insert fails the message really is lost; say so
            // loudly rather than letting it disappear into a swallowed catch.
            console.error('[Webhook] WhatsApp forward could not be queued, message lost:', qErr.message);
        });
        await pool.query(
            `UPDATE whatsapp_phone_registry SET last_forward_error = ? WHERE meta_phone_id = ?`,
            [message, phoneNumberId]
        ).catch(() => {});
        return false;
    }
}

/**
 * Drain the forward queue. Called on an interval by services/whatsappForwardWorker.
 * Exported here so the delivery path and the retry path stay identical.
 */
async function drainForwardQueue(limit = 50) {
    const [rows] = await pool.query(
        `SELECT id, meta_phone_id, tenant_api_url, payload, attempts
           FROM whatsapp_forward_queue
          WHERE status = 'pending' AND next_attempt_at <= NOW()
          ORDER BY next_attempt_at ASC
          LIMIT ?`,
        [limit]
    );

    let delivered = 0;
    for (const row of rows) {
        const payload = typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload;
        try {
            await axios.post(`${row.tenant_api_url}/api/whatsapp/incoming`, payload, {
                timeout: 10000,
                headers: { 'X-Internal-Key': process.env.INTERNAL_OAUTH_KEY }
            });
            await pool.query(
                `UPDATE whatsapp_forward_queue SET status = 'delivered', last_error = NULL WHERE id = ?`,
                [row.id]
            );
            delivered += 1;
        } catch (err) {
            const attempts = row.attempts + 1;
            const message = String(err.message || 'forward failed').slice(0, 500);
            if (attempts >= FORWARD_MAX_ATTEMPTS) {
                await pool.query(
                    `UPDATE whatsapp_forward_queue SET status = 'failed', attempts = ?, last_error = ? WHERE id = ?`,
                    [attempts, message, row.id]
                );
                console.error(`[Webhook] WhatsApp forward to ${row.tenant_api_url} gave up after ${attempts} attempts`);
            } else {
                // Exponential backoff, capped at an hour: a tenant down for a
                // deploy recovers in seconds, one down for maintenance in minutes.
                const delaySeconds = Math.min(30 * Math.pow(2, attempts - 1), 3600);
                await pool.query(
                    `UPDATE whatsapp_forward_queue
                        SET attempts = ?, last_error = ?, next_attempt_at = DATE_ADD(NOW(), INTERVAL ? SECOND)
                      WHERE id = ?`,
                    [attempts, message, delaySeconds, row.id]
                );
            }
        }
    }

    return { examined: rows.length, delivered };
}

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
            if (!(await RazorpayService.verifyWebhookSignature(body, signature))) {
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
                case 'payment_link.paid':
                    await this.handlePaymentLinkPaid(payload);
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
            if (existingClient.length) {
                console.log(`[Webhook] Client already exists: ${email}`);
                return existingClient[0];
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

    getNotes(...sources) {
        for (const source of sources) {
            if (source && typeof source === 'object' && !Array.isArray(source) && Object.keys(source).length > 0) {
                return source;
            }
        }

        return {};
    }

    parsePlanId(notes = {}) {
        const parsed = Number(notes.plan_id);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    }

    async activateTenantAccess(tenantId, planId = null, billingCycle = 'monthly') {
        let subscriptionId = null;

        if (planId) {
            subscriptionId = await RazorpayService.ensureSubscriptionRecord({
                tenantId,
                planId,
                billingCycle
            });
            await TenantModel.update(tenantId, { status: 'active', plan_id: planId });
        } else {
            const [subs] = await pool.query(
                'SELECT id FROM subscriptions WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 1',
                [tenantId]
            );
            subscriptionId = subs[0]?.id || null;
            await TenantModel.update(tenantId, { status: 'active' });
        }

        const tenant = await TenantModel.findById(tenantId);
        if (tenant && tenant.process_status !== 'running' && tenant.assigned_port && tenant.db_name) {
            try {
                const provisioner = new Provisioner();
                await provisioner.startProcess(tenant);
                await TenantModel.updateProcessStatus(tenantId, 'running');
            } catch (error) {
                console.error('[Webhook] Failed to start tenant process:', error);
            }
        }

        return subscriptionId;
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
        const notes = this.getNotes(payment.notes);
        const tenantId = notes.tenant_id;

        if (!tenantId) return;

        const subscriptionId = await this.activateTenantAccess(
            tenantId,
            this.parsePlanId(notes),
            notes.billing_cycle || 'monthly'
        );

        await RazorpayService.recordPayment({
            tenant_id: tenantId,
            subscription_id: subscriptionId,
            amount: payment.amount / 100,
            currency: payment.currency || 'INR',
            razorpay_payment_id: payment.id,
            razorpay_order_id: payment.order_id,
            status: 'success',
            payment_method: payment.method || null,
            notes
        });

        console.log(`[Webhook] Payment captured for tenant ${tenantId}: ₹${payment.amount / 100}`);
    }

    /**
     * Handle payment failed
     */
    async handlePaymentFailed(payload) {
        const payment = payload.payment.entity;
        const notes = this.getNotes(payment.notes);
        const tenantId = notes.tenant_id;

        if (!tenantId) return;

        // Record failed payment
        await RazorpayService.recordPayment({
            tenant_id: tenantId,
            amount: payment.amount / 100,
            currency: payment.currency || 'INR',
            razorpay_payment_id: payment.id,
            razorpay_order_id: payment.order_id,
            status: 'failed',
            payment_method: payment.method || null,
            notes
        });

        // TODO: Send email notification about failed payment

        console.log(`[Webhook] Payment failed for tenant ${tenantId}`);
    }

    async handlePaymentLinkPaid(payload) {
        const paymentLink = payload.payment_link?.entity;
        const payment = payload.payment?.entity;
        const notes = this.getNotes(payment?.notes, paymentLink?.notes);
        const tenantId = notes.tenant_id;

        if (!tenantId) {
            console.log('[Webhook] Payment link paid without tenant context; skipping tenant activation');
            return;
        }

        const subscriptionId = await this.activateTenantAccess(
            tenantId,
            this.parsePlanId(notes),
            notes.billing_cycle || 'monthly'
        );

        await RazorpayService.recordPayment({
            tenant_id: tenantId,
            subscription_id: subscriptionId,
            amount: (payment?.amount || paymentLink?.amount_paid || 0) / 100,
            currency: payment?.currency || paymentLink?.currency || 'INR',
            razorpay_payment_id: payment?.id,
            razorpay_order_id: payment?.order_id || paymentLink?.order_id || null,
            status: 'success',
            payment_method: payment?.method || null,
            notes
        });

        console.log(`[Webhook] Payment link settled for tenant ${tenantId}`);
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

            if (!(await StripeService.verifyWebhookSignature(payload, sig))) {
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

    /**
     * WhatsApp Cloud API (Meta) — one-time subscription verification handshake.
     * Meta calls this with hub.mode/hub.verify_token/hub.challenge when the
     * webhook URL is registered in the Meta App dashboard.
     */
    verifyWhatsAppMetaWebhook(req, res) {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        if (mode === 'subscribe' && token && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
            return res.status(200).send(challenge);
        }
        return res.sendStatus(403);
    }

    /**
     * WhatsApp Cloud API (Meta) — inbound message and status delivery.
     *
     * This is the single central receiver: Meta allows one callback URL per Meta
     * App, so every tenant's traffic arrives here and is fanned out to that
     * tenant's own nexcrm-backend, where it lands in their own database.
     *
     * Two things this used to get wrong.
     *
     * 1. Signature verification used one global META_APP_SECRET. That is correct
     *    for numbers on our own Meta App, but a tenant who brings their OWN app
     *    signs with THEIR secret, so every one of their messages failed the check
     *    and was dropped. Outbound worked and inbound silently did not. The secret
     *    is now resolved per phone_number_id from whatsapp_phone_registry.
     *
     * 2. Only `messages[]` was forwarded. `statuses[]` — sent/delivered/read/failed
     *    plus Meta's billing category — was discarded, which is why no delivery
     *    receipt ever reached the CRM and whatsapp_messages.status was dead weight.
     *
     * Meta backs the whole app off if we are slow, so we ack immediately and do the
     * work after. That makes delivery to the tenant entirely our problem, hence the
     * durable whatsapp_forward_queue rather than a best-effort POST.
     */
    async handleWhatsAppMetaWebhook(req, res) {
        res.status(200).json({ received: true });

        try {
            const rawBody = req.body; // Buffer (express.raw)

            if (!process.env.INTERNAL_OAUTH_KEY) {
                console.error('[Webhook] WhatsApp Meta: INTERNAL_OAUTH_KEY is not set, cannot deliver payload');
                return;
            }

            let payload;
            try {
                payload = JSON.parse(rawBody.toString('utf8'));
            } catch {
                console.error('[Webhook] WhatsApp Meta: payload is not JSON, dropping');
                return;
            }

            // Read (but do not act on) the phone ids so the right verification key
            // can be chosen. Selecting a key by an unverified field is safe: the
            // signature is then checked against that key, so naming another
            // tenant's number cannot make a forged body verify.
            const phoneIds = phoneIdsIn(payload);
            if (!phoneIds.size) return;

            const registry = await loadRegistry([...phoneIds]);

            // Verify once per distinct secret. In practice a payload carries one
            // WABA, but a shared-app payload spanning several tenants must not let
            // one tenant's valid signature authorise another tenant's entries.
            const verifiedPhoneIds = verifySignature(
                req.headers['x-hub-signature-256'] || '',
                rawBody,
                registry
            );
            if (!verifiedPhoneIds.size) {
                console.error('[Webhook] WhatsApp Meta: signature mismatch, dropping payload');
                return;
            }

            for (const entry of payload.entry || []) {
                for (const change of entry.changes || []) {
                    const value = change.value || {};
                    const phoneNumberId = value.metadata?.phone_number_id
                        ? String(value.metadata.phone_number_id)
                        : null;
                    if (!phoneNumberId) continue;

                    if (!verifiedPhoneIds.has(phoneNumberId)) {
                        console.error(`[Webhook] WhatsApp Meta: entry for ${phoneNumberId} not covered by a valid signature, skipping`);
                        continue;
                    }

                    const registration = registry.get(phoneNumberId);
                    if (!registration) {
                        console.warn(`[Webhook] WhatsApp Meta: no tenant registered for phone_number_id ${phoneNumberId}`);
                        continue;
                    }

                    const messages = value.messages || [];
                    const statuses = value.statuses || [];
                    if (!messages.length && !statuses.length) continue;

                    const contactNameByWaId = {};
                    for (const c of value.contacts || []) {
                        contactNameByWaId[c.wa_id] = c.profile?.name || null;
                    }

                    // Forward the change verbatim alongside a pre-parsed summary.
                    // The tenant re-normalises with its own provider code, so a
                    // future Meta field is available without a hub deploy; the
                    // summary keeps older tenant builds working.
                    const body = {
                        metaPhoneId: phoneNumberId,
                        wabaId: entry.id || null,
                        raw: { entry: [{ id: entry.id, changes: [change] }] },
                        messages: messages.map((msg) => ({
                            messageId: msg.id,
                            from: msg.from,
                            fromName: contactNameByWaId[msg.from] || null,
                            text: msg.text?.body
                                || msg.button?.text
                                || msg.interactive?.button_reply?.title
                                || msg.interactive?.list_reply?.title
                                || '',
                            mediaType: msg.type && msg.type !== 'text' ? msg.type : 'text',
                            timestamp: Number(msg.timestamp) || Math.floor(Date.now() / 1000)
                        })),
                        statuses: statuses.map((s) => ({
                            messageId: s.id,
                            status: s.status,
                            recipient: s.recipient_id,
                            timestamp: Number(s.timestamp) || Math.floor(Date.now() / 1000),
                            conversationId: s.conversation?.id || null,
                            billingCategory: s.conversation?.origin?.type || s.pricing?.category || null,
                            billable: s.pricing ? Boolean(s.pricing.billable) : null,
                            errors: s.errors || null
                        }))
                    };

                    await deliverToTenant(phoneNumberId, registration.tenant_api_url, body);
                }
            }
        } catch (error) {
            console.error('[Webhook] WhatsApp Meta processing error:', error);
        }
    }

    /**
     * Meta Lead Ads — one-time subscription verification handshake.
     * Shares META_WEBHOOK_VERIFY_TOKEN with the WhatsApp webhook (same Meta App,
     * separate callback URL configured against the `page` object → `leadgen`).
     */
    verifyMetaLeadsWebhook(req, res) {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        if (mode === 'subscribe' && token && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
            return res.status(200).send(challenge);
        }
        return res.sendStatus(403);
    }

    /**
     * Meta Lead Ads — inbound lead delivery.
     * A `leadgen` change carries only ids (leadgen_id, page_id, form_id); the
     * actual field data must be pulled from the Graph API with the Page token,
     * which lives (encrypted) in meta_page_registry. We resolve page_id → tenant,
     * fetch the lead, normalise its field_data, and forward to that tenant's own
     * nexcrm-backend so the lead lands in the tenant's DB. Ack fast (Meta retries
     * aggressively) and process after.
     */
    async handleMetaLeadsWebhook(req, res) {
        res.status(200).json({ received: true });

        try {
            const rawBody = req.body; // Buffer (express.raw)
            const appSecret = process.env.META_APP_SECRET;

            if (appSecret) {
                const signature = req.headers['x-hub-signature-256'] || '';
                const expected = 'sha256=' + crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex');
                const sigBuf = Buffer.from(signature);
                const expBuf = Buffer.from(expected);
                if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
                    console.error('[Webhook] Meta Leads: signature mismatch, dropping payload');
                    return;
                }
            } else {
                console.warn('[Webhook] Meta Leads: META_APP_SECRET not set, skipping signature verification');
            }

            const { decryptSecret } = require('../services/secretStore');
            const payload = JSON.parse(rawBody.toString('utf8'));

            for (const entry of payload.entry || []) {
                for (const change of entry.changes || []) {
                    if (change.field !== 'leadgen') continue;
                    const value = change.value || {};
                    const pageId = value.page_id || entry.id;
                    const leadgenId = value.leadgen_id;
                    if (!pageId || !leadgenId) continue;

                    const [regRows] = await pool.query(
                        `SELECT tenant_slug, tenant_api_url, page_token_encrypted
                         FROM meta_page_registry WHERE page_id = ? AND status = 'active'`,
                        [String(pageId)]
                    );
                    if (!regRows.length) {
                        console.warn(`[Webhook] Meta Leads: no tenant registered for page_id ${pageId}`);
                        continue;
                    }
                    const reg = regRows[0];
                    const pageToken = decryptSecret(reg.page_token_encrypted);
                    if (!pageToken) {
                        console.error(`[Webhook] Meta Leads: missing page token for page_id ${pageId}`);
                        continue;
                    }

                    // Fetch the lead's actual field data from the Graph API.
                    let lead;
                    try {
                        const { data } = await axios.get(`https://graph.facebook.com/v21.0/${leadgenId}`, {
                            params: { access_token: pageToken, fields: 'field_data,form_id,ad_id,campaign_name,created_time' },
                            timeout: 10000
                        });
                        lead = data;
                    } catch (err) {
                        console.error(`[Webhook] Meta Leads: fetch lead ${leadgenId} failed:`, err.response?.data?.error?.message || err.message);
                        continue;
                    }

                    // field_data: [{ name: 'email', values: ['a@b.com'] }, ...]
                    const fields = {};
                    for (const f of lead.field_data || []) {
                        fields[f.name] = Array.isArray(f.values) ? f.values[0] : f.values;
                    }

                    try {
                        await axios.post(`${reg.tenant_api_url}/api/meta-leads/incoming`, {
                            leadgenId,
                            pageId: String(pageId),
                            formId: value.form_id || lead.form_id || null,
                            adId: lead.ad_id || null,
                            campaignName: lead.campaign_name || null,
                            createdTime: lead.created_time || null,
                            fields
                        }, {
                            headers: { 'X-Internal-Key': process.env.INTERNAL_OAUTH_KEY },
                            timeout: 10000
                        });

                        await pool.query(
                            `UPDATE meta_page_registry SET last_lead_at = NOW() WHERE page_id = ?`,
                            [String(pageId)]
                        );
                    } catch (err) {
                        console.error(`[Webhook] Meta Leads: forward to tenant ${reg.tenant_api_url} failed:`, err.message);
                    }
                }
            }
        } catch (error) {
            console.error('[Webhook] Meta Leads processing error:', error);
        }
    }
}


module.exports = new WebhookController();
module.exports.drainForwardQueue = drainForwardQueue;

