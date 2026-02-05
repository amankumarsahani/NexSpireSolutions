/**
 * Razorpay Billing Service
 * Handles subscription creation, management, and payment processing
 */

const crypto = require('crypto');
const { pool } = require('../config/database');

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
            status = 'success'
        } = paymentData;

        const invoiceNumber = `INV-${Date.now()}`;

        const [result] = await pool.query(`
            INSERT INTO payments (tenant_id, subscription_id, amount, status, 
                                 razorpay_payment_id, razorpay_order_id, razorpay_signature,
                                 invoice_number)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [tenant_id, subscription_id, amount, status, razorpay_payment_id,
            razorpay_order_id, razorpay_signature, invoiceNumber]);

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
}

module.exports = new RazorpayService();
