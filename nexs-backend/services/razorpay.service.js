/**
 * Razorpay Billing Service
 * Handles subscription creation, management, and payment processing
 */

const crypto = require('crypto');
const { pool } = require('../config/database');

const PLAN_ALIASES = {
    growth: 'professional',
    business: 'enterprise'
};

class RazorpayService {
    constructor() {
        this.baseUrl = 'https://api.razorpay.com/v1';
    }

    /**
     * Get credentials from DB or Env
     */
    async getCredentials() {
        let keyId = process.env.RAZORPAY_KEY_ID;
        let keySecret = process.env.RAZORPAY_KEY_SECRET;

        try {
            const [settings] = await pool.query(
                'SELECT setting_key, setting_value FROM settings WHERE setting_key IN (?, ?)',
                ['razorpay_api_key', 'razorpay_secret_key']
            );

            settings.forEach(s => {
                if (s.setting_key === 'razorpay_api_key' && s.setting_value) keyId = s.setting_value;
                if (s.setting_key === 'razorpay_secret_key' && s.setting_value) keySecret = s.setting_value;
            });
        } catch (err) {
            console.error('[Razorpay] DB lookup failed:', err.message);
        }

        if (!keyId || !keySecret) {
            console.warn('[Razorpay] Credentials not configured. Billing features disabled.');
        }

        return { keyId, keySecret };
    }

    async getPublicKey() {
        const { keyId } = await this.getCredentials();
        return keyId;
    }

    /**
     * Make authenticated request to Razorpay API
     */
    async apiRequest(endpoint, method = 'GET', body = null) {
        const { keyId, keySecret } = await this.getCredentials();

        if (!keyId || !keySecret) {
            throw new Error('Razorpay credentials missing');
        }

        const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

        const options = {
            method,
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json'
            }
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(`${this.baseUrl}${endpoint}`, options);
        const data = await response.json();

        if (!response.ok) {
            console.error('[Razorpay] API Error:', data);
            throw new Error(data.error?.description || 'Razorpay API error');
        }

        return data;
    }

    normalizeBillingCycle(billingCycle = 'monthly') {
        return String(billingCycle).toLowerCase() === 'yearly' ? 'yearly' : 'monthly';
    }

    async resolvePlan(planReference, preferredBillingCycle = 'monthly') {
        if (planReference === undefined || planReference === null || planReference === '') {
            throw new Error('Plan reference is required');
        }

        let billingCycle = this.normalizeBillingCycle(preferredBillingCycle);
        let normalizedReference = String(planReference).trim().toLowerCase();

        if (normalizedReference.endsWith('_yearly')) {
            billingCycle = 'yearly';
            normalizedReference = normalizedReference.slice(0, -7);
        } else if (normalizedReference.endsWith('_monthly')) {
            billingCycle = 'monthly';
            normalizedReference = normalizedReference.slice(0, -8);
        }

        const lookupCandidates = [normalizedReference];
        if (PLAN_ALIASES[normalizedReference]) {
            lookupCandidates.push(PLAN_ALIASES[normalizedReference]);
        }

        let plan = null;

        if (/^\d+$/.test(normalizedReference)) {
            const [rows] = await pool.query('SELECT * FROM plans WHERE id = ?', [Number(normalizedReference)]);
            plan = rows[0] || null;
        }

        if (!plan) {
            for (const candidate of lookupCandidates) {
                const [rows] = await pool.query(
                    'SELECT * FROM plans WHERE LOWER(slug) = ? OR LOWER(name) = ? LIMIT 1',
                    [candidate, candidate]
                );

                if (rows.length) {
                    plan = rows[0];
                    break;
                }
            }
        }

        if (!plan) {
            throw new Error(`Plan not found for reference "${planReference}"`);
        }

        const rawAmount = billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly;
        const amount = Number(rawAmount || 0);

        if (!amount || amount <= 0) {
            throw new Error(`Plan ${plan.name} does not have a valid ${billingCycle} price`);
        }

        return { plan, billingCycle, amount };
    }

    sanitizeNotes(notes = {}) {
        const result = {};

        Object.entries(notes)
            .filter(([, value]) => value !== undefined && value !== null && value !== '')
            .slice(0, 15)
            .forEach(([key, value]) => {
                result[String(key).slice(0, 64)] = String(value).slice(0, 255);
            });

        return result;
    }

    buildReferenceId(prefix, planSlug, billingCycle) {
        const safePrefix = String(prefix || 'nex').replace(/[^a-z0-9]/gi, '').toLowerCase() || 'nex';
        const safeSlug = String(planSlug || 'plan').replace(/[^a-z0-9]/gi, '').toLowerCase() || 'plan';
        const safeCycle = this.normalizeBillingCycle(billingCycle) === 'yearly' ? 'y' : 'm';
        return `${safePrefix}_${safeSlug}_${safeCycle}_${Date.now().toString(36)}`.slice(0, 40);
    }

    isValidHttpUrl(url) {
        if (!url) return false;

        try {
            const parsed = new URL(url);
            return parsed.protocol === 'http:' || parsed.protocol === 'https:';
        } catch (error) {
            return false;
        }
    }

    async createHostedPaymentLink({
        planId,
        billingCycle = 'monthly',
        successUrl,
        cancelUrl,
        metadata = {},
        customer = {}
    }) {
        const resolved = await this.resolvePlan(planId, billingCycle);
        const notes = this.sanitizeNotes({
            ...metadata,
            plan_id: resolved.plan.id,
            plan_slug: resolved.plan.slug,
            billing_cycle: resolved.billingCycle,
            cancel_url: cancelUrl || ''
        });

        const payload = {
            amount: Math.round(resolved.amount * 100),
            currency: 'INR',
            description: `NexCRM ${resolved.plan.name} ${resolved.billingCycle} plan`,
            reference_id: this.buildReferenceId('nexcrm', resolved.plan.slug, resolved.billingCycle),
            reminder_enable: true,
            notes
        };

        if (customer && (customer.name || customer.email || customer.contact)) {
            payload.customer = {};

            if (customer.name) payload.customer.name = customer.name;
            if (customer.email) payload.customer.email = customer.email;
            if (customer.contact) payload.customer.contact = customer.contact;

            payload.notify = {
                email: Boolean(customer.email),
                sms: Boolean(customer.contact)
            };
        }

        if (this.isValidHttpUrl(successUrl)) {
            payload.callback_url = successUrl;
            payload.callback_method = 'get';
        }

        return this.apiRequest('/payment_links', 'POST', payload);
    }

    /**
     * Create or get Razorpay customer
     */
    async createCustomer(tenant) {
        const customer = await this.apiRequest('/customers', 'POST', {
            name: tenant.name,
            email: tenant.email,
            contact: tenant.phone || '',
            notes: {
                tenant_id: tenant.id.toString(),
                tenant_slug: tenant.slug
            }
        });

        return customer;
    }

    /**
     * Create Razorpay subscription plan
     */
    async createPlan(plan) {
        const razorpayPlan = await this.apiRequest('/plans', 'POST', {
            period: 'monthly',
            interval: 1,
            item: {
                name: `NexCRM ${plan.name}`,
                amount: Math.round(plan.price_monthly * 100), // Convert to paise
                currency: 'INR',
                description: plan.description || `NexCRM ${plan.name} Plan`
            },
            notes: {
                plan_id: plan.id.toString(),
                plan_slug: plan.slug
            }
        });

        return razorpayPlan;
    }

    /**
     * Create a subscription for tenant
     */
    async createSubscription(tenantId, planId, customerId) {
        // Get plan details
        const [plans] = await pool.query('SELECT * FROM plans WHERE id = ?', [planId]);
        if (!plans.length) {
            throw new Error('Plan not found');
        }
        const plan = plans[0];

        // Get or create Razorpay plan
        let razorpayPlanId = plan.razorpay_plan_id;
        if (!razorpayPlanId) {
            const razorpayPlan = await this.createPlan(plan);
            razorpayPlanId = razorpayPlan.id;

            // Store Razorpay plan ID
            await pool.query('UPDATE plans SET razorpay_plan_id = ? WHERE id = ?', [razorpayPlanId, planId]);
        }

        // Create subscription
        const subscription = await this.apiRequest('/subscriptions', 'POST', {
            plan_id: razorpayPlanId,
            customer_id: customerId,
            quantity: 1,
            total_count: 12, // 12 months
            customer_notify: 1,
            notes: {
                tenant_id: tenantId.toString(),
                plan_id: planId.toString()
            }
        });

        // Store subscription in database
        const now = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1);

        await pool.query(`
            INSERT INTO subscriptions (tenant_id, plan_id, status, billing_cycle, 
                                       current_period_start, current_period_end, 
                                       razorpay_subscription_id, razorpay_customer_id)
            VALUES (?, ?, 'active', 'monthly', ?, ?, ?, ?)
        `, [tenantId, planId, now, endDate, subscription.id, customerId]);

        return subscription;
    }

    /**
     * Cancel subscription
     */
    async cancelSubscription(subscriptionId, cancelAtEndOfPeriod = true) {
        const endpoint = cancelAtEndOfPeriod
            ? `/subscriptions/${subscriptionId}/cancel`
            : `/subscriptions/${subscriptionId}`;

        const method = cancelAtEndOfPeriod ? 'POST' : 'DELETE';

        const result = await this.apiRequest(endpoint, method, {
            cancel_at_cycle_end: cancelAtEndOfPeriod ? 1 : 0
        });

        // Update database
        await pool.query(`
            UPDATE subscriptions SET status = ? WHERE razorpay_subscription_id = ?
        `, [cancelAtEndOfPeriod ? 'active' : 'cancelled', subscriptionId]);

        return result;
    }

    /**
     * Pause subscription
     */
    async pauseSubscription(subscriptionId) {
        const result = await this.apiRequest(`/subscriptions/${subscriptionId}/pause`, 'POST');

        await pool.query(`
            UPDATE subscriptions SET status = 'paused' WHERE razorpay_subscription_id = ?
        `, [subscriptionId]);

        return result;
    }

    /**
     * Resume subscription
     */
    async resumeSubscription(subscriptionId) {
        const result = await this.apiRequest(`/subscriptions/${subscriptionId}/resume`, 'POST');

        await pool.query(`
            UPDATE subscriptions SET status = 'active' WHERE razorpay_subscription_id = ?
        `, [subscriptionId]);

        return result;
    }

    /**
     * Get subscription details
     */
    async getSubscription(subscriptionId) {
        return this.apiRequest(`/subscriptions/${subscriptionId}`);
    }

    /**
     * Verify webhook signature
     */
    async verifyWebhookSignature(body, signature) {
        let webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

        try {
            const [[setting]] = await pool.query(
                'SELECT setting_value FROM settings WHERE setting_key = ?',
                ['razorpay_webhook_secret']
            );
            if (setting && setting.setting_value) {
                webhookSecret = setting.setting_value;
            }
        } catch (err) {
            console.error('[Razorpay] DB lookup failed for webhook secret:', err.message);
        }

        if (!webhookSecret) return false;

        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(body)
            .digest('hex');

        return signature === expectedSignature;
    }

    /**
     * Create payment link for one-time payment
     */
    async createPaymentLink(amount, tenantId, description) {
        const paymentLink = await this.apiRequest('/payment_links', 'POST', {
            amount: Math.round(amount * 100),
            currency: 'INR',
            description,
            customer: {},
            notify: {
                sms: true,
                email: true
            },
            reminder_enable: true,
            notes: {
                tenant_id: tenantId.toString()
            },
            callback_url: `${process.env.APP_URL}/payment/success`,
            callback_method: 'get'
        });

        return paymentLink;
    }

    async ensureSubscriptionRecord({
        tenantId,
        planId,
        billingCycle = 'monthly',
        razorpaySubscriptionId = null,
        razorpayCustomerId = null
    }) {
        if (!tenantId || !planId) {
            return null;
        }

        const cycle = this.normalizeBillingCycle(billingCycle);
        const periodStart = new Date();
        const periodEnd = new Date(periodStart);

        if (cycle === 'yearly') {
            periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        } else {
            periodEnd.setMonth(periodEnd.getMonth() + 1);
        }

        const [existingRows] = razorpaySubscriptionId
            ? await pool.query(
                'SELECT id FROM subscriptions WHERE razorpay_subscription_id = ? LIMIT 1',
                [razorpaySubscriptionId]
            )
            : await pool.query(
                'SELECT id FROM subscriptions WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 1',
                [tenantId]
            );

        if (existingRows.length) {
            await pool.query(`
                UPDATE subscriptions
                SET plan_id = ?, status = 'active', billing_cycle = ?,
                    current_period_start = ?, current_period_end = ?,
                    razorpay_subscription_id = COALESCE(?, razorpay_subscription_id),
                    razorpay_customer_id = COALESCE(?, razorpay_customer_id)
                WHERE id = ?
            `, [
                planId,
                cycle,
                periodStart,
                periodEnd,
                razorpaySubscriptionId,
                razorpayCustomerId,
                existingRows[0].id
            ]);

            return existingRows[0].id;
        }

        const [result] = await pool.query(`
            INSERT INTO subscriptions (
                tenant_id, plan_id, status, billing_cycle,
                current_period_start, current_period_end,
                razorpay_subscription_id, razorpay_customer_id
            )
            VALUES (?, ?, 'active', ?, ?, ?, ?, ?)
        `, [
            tenantId,
            planId,
            cycle,
            periodStart,
            periodEnd,
            razorpaySubscriptionId,
            razorpayCustomerId
        ]);

        return result.insertId;
    }

    /**
     * Record payment in database
     */
    async recordPayment(paymentData) {
        const {
            tenant_id,
            subscription_id,
            amount,
            razorpay_payment_id,
            razorpay_order_id,
            razorpay_signature,
            currency = 'INR',
            payment_method = null,
            notes = null,
            status = 'success'
        } = paymentData;

        if (!tenant_id) {
            throw new Error('tenant_id is required to record a payment');
        }

        if (razorpay_payment_id) {
            const [existing] = await pool.query(
                'SELECT id FROM payments WHERE razorpay_payment_id = ? LIMIT 1',
                [razorpay_payment_id]
            );

            if (existing.length) {
                await pool.query(`
                    UPDATE payments
                    SET status = ?, amount = ?, currency = ?, razorpay_order_id = COALESCE(?, razorpay_order_id),
                        razorpay_signature = COALESCE(?, razorpay_signature),
                        payment_method = COALESCE(?, payment_method),
                        notes = COALESCE(?, notes)
                    WHERE id = ?
                `, [
                    status,
                    amount,
                    currency,
                    razorpay_order_id,
                    razorpay_signature,
                    payment_method,
                    notes ? JSON.stringify(notes) : null,
                    existing[0].id
                ]);

                return existing[0].id;
            }
        }

        const invoiceNumber = `INV-${Date.now()}`;

        const [result] = await pool.query(`
            INSERT INTO payments (tenant_id, subscription_id, amount, status, 
                                 razorpay_payment_id, razorpay_order_id, razorpay_signature,
                                 invoice_number, currency, payment_method, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            tenant_id,
            subscription_id,
            amount,
            status,
            razorpay_payment_id,
            razorpay_order_id,
            razorpay_signature,
            invoiceNumber,
            currency,
            payment_method,
            notes ? JSON.stringify(notes) : null
        ]);

        return result.insertId;
    }

    /**
     * Get payment history for tenant
     */
    async getPaymentHistory(tenantId) {
        const [payments] = await pool.query(`
            SELECT p.*, s.razorpay_subscription_id, pl.name as plan_name
            FROM payments p
            LEFT JOIN subscriptions s ON p.subscription_id = s.id
            LEFT JOIN plans pl ON s.plan_id = pl.id
            WHERE p.tenant_id = ?
            ORDER BY p.created_at DESC
        `, [tenantId]);

        return payments;
    }

    async fetchAndSyncPayment(paymentId) {
        const payment = await this.apiRequest(`/payments/${paymentId}`);

        if (!payment) {
            throw new Error('Payment not found');
        }

        const [existing] = await pool.query(
            'SELECT id FROM payments WHERE razorpay_payment_id = ? LIMIT 1',
            [payment.id]
        );

        if (existing.length) {
            return { success: false, message: 'Payment already exists', paymentId: existing[0].id };
        }

        const tenantId = payment.notes?.tenant_id;
        if (!tenantId) {
            throw new Error('Razorpay payment is not linked to a tenant');
        }

        const planId = payment.notes?.plan_id ? Number(payment.notes.plan_id) : null;
        const billingCycle = payment.notes?.billing_cycle || 'monthly';
        const subscriptionId = planId
            ? await this.ensureSubscriptionRecord({ tenantId, planId, billingCycle })
            : null;

        const recordedPaymentId = await this.recordPayment({
            tenant_id: tenantId,
            subscription_id: subscriptionId,
            amount: payment.amount / 100,
            currency: payment.currency || 'INR',
            razorpay_payment_id: payment.id,
            razorpay_order_id: payment.order_id,
            status: payment.status === 'captured' ? 'success' : 'failed',
            payment_method: payment.method || null,
            notes: payment.notes || null
        });

        return {
            success: true,
            message: 'Payment synced successfully',
            paymentId: recordedPaymentId
        };
    }
}

module.exports = new RazorpayService();
