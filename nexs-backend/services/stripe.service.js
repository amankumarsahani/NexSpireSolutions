// services/stripe.service.js
// Handles Stripe API interactions for the Nexspire admin backend
// Includes webhook signature verification and basic customer/subscription utilities

const stripeKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder';
const stripe = require('stripe')(stripeKey);
const crypto = require('crypto');

class StripeService {
    /**
     * Verify Stripe webhook signature
     * @param {Buffer} payload - raw request body buffer
     * @param {string} sigHeader - value of 'stripe-signature' header
     * @returns {boolean}
     */
    verifyWebhookSignature(payload, sigHeader) {
        const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!endpointSecret) {
            console.error('[Stripe] Webhook secret not configured');
            return false;
        }
        try {
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
     * @param {string} planId - internal plan identifier (used to fetch price ID)
     * @param {string} successUrl - URL to redirect after successful payment
     * @param {string} cancelUrl - URL to redirect if payment is cancelled
     * @param {object} metadata - optional metadata for tracking/workflows
     * @returns {object} Stripe session object
     */
    async createCheckoutSession(planId, successUrl, cancelUrl, metadata = {}) {
        const priceId = process.env[`STRIPE_PRICE_ID_${planId.toUpperCase()}`];
        if (!priceId) {
            throw new Error(`No Stripe price configured for plan ${planId}`);
        }
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
        return await stripe.customers.create({ email, metadata });
    }

    // Example helper: create a subscription for a customer
    async createSubscription(customerId, priceId, metadata = {}) {
        return await stripe.subscriptions.create({
            customer: customerId,
            items: [{ price: priceId }],
            metadata,
        });
    }
}

module.exports = new StripeService();
