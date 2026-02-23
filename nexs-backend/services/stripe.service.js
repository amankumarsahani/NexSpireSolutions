// services/stripe.service.js
// Handles Stripe API interactions for the Nexspire admin backend
// Includes webhook signature verification and basic customer/subscription utilities

const stripePackage = require('stripe');
const { pool } = require('../config/database');

class StripeService {
    constructor() {
        this.stripeClient = null;
        this.currentKey = null;
    }

    /**
     * Get the Stripe client, initializing it with the correct key (DB -> Env)
     */
    async getClient() {
        let apiKey = process.env.STRIPE_SECRET_KEY;

        try {
            const [[setting]] = await pool.query(
                'SELECT setting_value FROM settings WHERE setting_key = ?',
                ['stripe_api_key']
            );
            if (setting && setting.setting_value) {
                apiKey = setting.setting_value;
            }
        } catch (err) {
            console.error('[Stripe] DB lookup failed:', err.message);
        }

        if (!apiKey) {
            apiKey = 'sk_test_placeholder'; // Prevent crash if no key, but calls will fail
            console.warn('[Stripe] No API key found in DB or Env');
        }

        // Initialize or update client if key changed
        if (!this.stripeClient || this.currentKey !== apiKey) {
            this.stripeClient = stripePackage(apiKey);
            this.currentKey = apiKey;
        }

        return this.stripeClient;
    }

    /**
     * Verify Stripe webhook signature
     * @param {Buffer} payload - raw request body buffer
     * @param {string} sigHeader - value of 'stripe-signature' header
     * @returns {boolean}
     */
    async verifyWebhookSignature(payload, sigHeader) {
        let endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

        try {
            const [[setting]] = await pool.query(
                'SELECT setting_value FROM settings WHERE setting_key = ?',
                ['stripe_webhook_secret']
            );
            if (setting && setting.setting_value) {
                endpointSecret = setting.setting_value;
            }
        } catch (err) {
            console.error('[Stripe] DB lookup failed for webhook secret:', err.message);
        }

        if (!endpointSecret) {
            console.error('[Stripe] Webhook secret not configured');
            return false;
        }

        try {
            const stripe = await this.getClient();
            const event = stripe.webhooks.constructEvent(payload, sigHeader, endpointSecret);
            this.lastEvent = event;
            return true;
        } catch (err) {
            console.error('[Stripe] Webhook signature verification failed:', err.message);
            return false;
        }
    }

    /** Retrieve the last verified event */
    getLastEvent() {
        return this.lastEvent;
    }

    /**
     * Create a Stripe Checkout Session for a plan
     * @param {string|number} planId - internal plan identifier (used in metadata)
     * @param {string} planSlug - string name of the plan (used to fetch price ID from settings)
     * @param {string} successUrl - URL to redirect after successful payment
     * @param {string} cancelUrl - URL to redirect if payment is cancelled
     * @param {object} metadata - optional metadata for tracking/workflows
     * @returns {object} Stripe session object
     */
    async createCheckoutSession(planId, planSlug, successUrl, cancelUrl, metadata = {}) {
        // 1. Try to get Price ID from Database settings first
        let priceId = null;
        try {
            const [[setting]] = await pool.query(
                'SELECT setting_value FROM settings WHERE setting_key = ?',
                [`stripe_price_id_${planSlug.toLowerCase()}`]
            );
            if (setting && setting.setting_value) {
                priceId = setting.setting_value;
            }
        } catch (err) {
            console.error('[Stripe] DB lookup failed:', err.message);
        }

        // 2. Fallback to Environment Variables
        if (!priceId) {
            priceId = process.env[`STRIPE_PRICE_ID_${planSlug.toUpperCase()}`];
        }

        if (!priceId) {
            throw new Error(`No Stripe price configured for plan ${planSlug} (ID: ${planId}). Please check Admin Settings or .env`);
        }

        const stripe = await this.getClient();
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{ price: priceId, quantity: 1 }],
            mode: 'subscription',
            success_url: successUrl,
            cancel_url: cancelUrl,
            metadata: {
                ...metadata,
                plan_id: planId
            }
        });
        return session;
    }

    // Example helper: create a Stripe customer for a tenant
    async createCustomer(email, metadata = {}) {
        const stripe = await this.getClient();
        return await stripe.customers.create({ email, metadata });
    }

    // Example helper: create a subscription for a customer
    async createSubscription(customerId, priceId, metadata = {}) {
        const stripe = await this.getClient();
        return await stripe.subscriptions.create({
            customer: customerId,
            items: [{ price: priceId }],
            metadata,
        });
    }

    /**
     * Record payment in database
     */
    async recordPayment(paymentData) {
        const {
            tenant_id,
            subscription_id,
            amount,
            stripe_payment_id,
            stripe_session_id,
            status = 'success'
        } = paymentData;

        const invoiceNumber = `INV-STR-${Date.now()}`; // Generic invoice number for now

        const [result] = await pool.query(`
            INSERT INTO payments (tenant_id, subscription_id, amount, status, 
                                 stripe_payment_id, stripe_session_id,
                                 invoice_number)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [tenant_id, subscription_id, amount, status, stripe_payment_id,
            stripe_session_id, invoiceNumber]);

        return result.insertId;
    }

    /**
     * Fetch payment from Stripe and sync to DB
     */
    async fetchAndSyncPayment(paymentIntentId) {
        const stripe = await this.getClient();

        try {
            const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

            if (!paymentIntent) {
                throw new Error('Payment Intent not found');
            }

            // Check if exists
            const [existing] = await pool.query('SELECT id FROM payments WHERE stripe_payment_id = ?', [paymentIntent.id]);
            if (existing.length > 0) {
                return { success: false, message: 'Payment already exists' };
            }

            // We need tenant_id to record it. If it's in metadata excellent, if not we might be stuck.
            const tenantId = paymentIntent.metadata?.tenant_id;
            if (!tenantId) {
                throw new Error('Payment Intent missing tenant_id in metadata');
            }

            await this.recordPayment({
                tenant_id: tenantId,
                amount: paymentIntent.amount / 100,
                stripe_payment_id: paymentIntent.id,
                status: paymentIntent.status === 'succeeded' ? 'success' : 'failed'
            });

            return { success: true, message: 'Payment synced successfully' };

        } catch (error) {
            console.error('Sync payment error:', error);
            throw error;
        }
    }
}

module.exports = new StripeService();
