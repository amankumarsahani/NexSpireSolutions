/**
 * Billing Controller
 * Handles subscription management and payment endpoints
 */

const RazorpayService = require('../services/razorpay.service');
const StripeService = require('../services/stripe.service');
const TenantModel = require('../models/tenant.model');

const { pool } = require('../config/database');

class BillingController {
    /**
     * Create subscription for tenant
     */
    async createSubscription(req, res) {
        try {
            const { tenantId, planId } = req.body;

            // Get tenant
            const tenant = await TenantModel.findById(tenantId);
            if (!tenant) {
                return res.status(404).json({ error: 'Tenant not found' });
            }

            // Create or get customer
            let customerId = tenant.razorpay_customer_id;
            if (!customerId) {
                const customer = await RazorpayService.createCustomer(tenant);
                customerId = customer.id;

                // Store customer ID
                await pool.query('UPDATE tenants SET razorpay_customer_id = ? WHERE id = ?',
                    [customerId, tenantId]);
            }

            // Create subscription
            const subscription = await RazorpayService.createSubscription(
                tenantId,
                planId || tenant.plan_id,
                customerId
            );

            res.json({
                success: true,
                message: 'Subscription created',
                data: {
                    subscriptionId: subscription.id,
                    shortUrl: subscription.short_url,
                    status: subscription.status
                }
            });
        } catch (error) {
            console.error('Create subscription error:', error);
            res.status(500).json({ error: error.message || 'Failed to create subscription' });
        }
    }

    /**
     * Cancel subscription
     */
    async cancelSubscription(req, res) {
        try {
            const { tenantId } = req.params;
            const { immediate = false } = req.body;

            // Get active subscription
            const [subs] = await pool.query(
                'SELECT * FROM subscriptions WHERE tenant_id = ? AND status = "active"',
                [tenantId]
            );

            if (!subs.length) {
                return res.status(404).json({ error: 'No active subscription found' });
            }

            const result = await RazorpayService.cancelSubscription(
                subs[0].razorpay_subscription_id,
                !immediate
            );

            // Update tenant status if immediate
            if (immediate) {
                await TenantModel.update(tenantId, { status: 'cancelled' });
            }

            res.json({
                success: true,
                message: immediate ? 'Subscription cancelled immediately' : 'Subscription will cancel at end of period',
                data: result
            });
        } catch (error) {
            console.error('Cancel subscription error:', error);
            res.status(500).json({ error: error.message || 'Failed to cancel subscription' });
        }
    }

    /**
     * Pause subscription
     */
    async pauseSubscription(req, res) {
        try {
            const { tenantId } = req.params;

            const [subs] = await pool.query(
                'SELECT * FROM subscriptions WHERE tenant_id = ? AND status = "active"',
                [tenantId]
            );

            if (!subs.length) {
                return res.status(404).json({ error: 'No active subscription found' });
            }

            const result = await RazorpayService.pauseSubscription(subs[0].razorpay_subscription_id);

            res.json({
                success: true,
                message: 'Subscription paused',
                data: result
            });
        } catch (error) {
            console.error('Pause subscription error:', error);
            res.status(500).json({ error: error.message || 'Failed to pause subscription' });
        }
    }

    /**
     * Resume subscription
     */
    async resumeSubscription(req, res) {
        try {
            const { tenantId } = req.params;

            const [subs] = await pool.query(
                'SELECT * FROM subscriptions WHERE tenant_id = ? AND status = "paused"',
                [tenantId]
            );

            if (!subs.length) {
                return res.status(404).json({ error: 'No paused subscription found' });
            }

            const result = await RazorpayService.resumeSubscription(subs[0].razorpay_subscription_id);

            res.json({
                success: true,
                message: 'Subscription resumed',
                data: result
            });
        } catch (error) {
            console.error('Resume subscription error:', error);
            res.status(500).json({ error: error.message || 'Failed to resume subscription' });
        }
    }

    /**
     * Get subscription details
     */
    async getSubscription(req, res) {
        try {
            const { tenantId } = req.params;

            const [subs] = await pool.query(`
                SELECT s.*, p.name as plan_name, p.price_monthly, p.max_users, p.max_leads
                FROM subscriptions s
                LEFT JOIN plans p ON s.plan_id = p.id
                WHERE s.tenant_id = ?
                ORDER BY s.created_at DESC
                LIMIT 1
            `, [tenantId]);

            if (!subs.length) {
                return res.status(404).json({ error: 'No subscription found' });
            }

            res.json({
                success: true,
                data: subs[0]
            });
        } catch (error) {
            console.error('Get subscription error:', error);
            res.status(500).json({ error: 'Failed to fetch subscription' });
        }
    }

    /**
     * Get payment history
     */
    async getPaymentHistory(req, res) {
        try {
            const { tenantId } = req.params;
            const payments = await RazorpayService.getPaymentHistory(tenantId);

            res.json({
                success: true,
                data: payments
            });
        } catch (error) {
            console.error('Get payment history error:', error);
            res.status(500).json({ error: 'Failed to fetch payment history' });
        }
    }

    /**
     * Create a Stripe payment link (checkout session) for a plan
     */
    async createPaymentLink(req, res) {
        try {
            const { planId, successUrl, cancelUrl, metadata } = req.body;
            if (!planId) {
                return res.status(400).json({ error: 'planId is required' });
            }
            const session = await StripeService.createCheckoutSession(planId, successUrl, cancelUrl, metadata);
            // Return the URL to redirect the user
            res.json({ success: true, url: session.url });
        } catch (error) {
            console.error('Create payment link error:', error);
            res.status(500).json({ error: error.message || 'Failed to create payment link' });
        }
    }

    /**
     * Get all payments (Admin)
     */
    async getAllPayments(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const offset = (page - 1) * limit;
            const status = req.query.status;

            let query = `
                SELECT 
                    p.*, 
                    t.name as tenant_name, 
                    t.email as tenant_email,
                    pl.name as plan_name
                FROM payments p
                LEFT JOIN tenants t ON p.tenant_id = t.id
                LEFT JOIN subscriptions s ON p.subscription_id = s.id
                LEFT JOIN plans pl ON s.plan_id = pl.id
            `;

            const params = [];

            if (status && status !== 'all') {
                query += ' WHERE p.status = ?';
                params.push(status);
            }

            query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
            params.push(limit, offset);

            const [payments] = await pool.query(query, params);

            // Get total count
            let countQuery = 'SELECT COUNT(*) as total FROM payments p';
            const countParams = [];
            if (status && status !== 'all') {
                countQuery += ' WHERE p.status = ?';
                countParams.push(status);
            }
            const [totalResult] = await pool.query(countQuery, countParams);

            res.json({
                success: true,
                data: payments,
                pagination: {
                    page,
                    limit,
                    total: totalResult[0].total,
                    pages: Math.ceil(totalResult[0].total / limit)
                }
            res.json({
                    success: true,
                    data: payments,
                    pagination: {
                        page,
                        limit,
                        total: totalResult[0].total,
                        pages: Math.ceil(totalResult[0].total / limit)
                    }
                });
            } catch (error) {
                console.error('Get all payments error:', error);
                res.status(500).json({ error: 'Failed to fetch payments' });
            }
        }

    async syncPayment(req, res) {
            try {
                const { provider, paymentId } = req.body;

                if (provider !== 'stripe') {
                    return res.status(400).json({ error: 'Only Stripe sync supported currently' });
                }

                const StripeService = require('../services/stripe.service');
                const result = await StripeService.fetchAndSyncPayment(paymentId);

                res.json(result);
            } catch (error) {
                console.error('Sync payment error:', error);
                res.status(500).json({ error: error.message || 'Sync failed' });
            }
        }

    async getBillingStats(req, res) {
            try {
                const [stats] = await pool.query(`
                SELECT 
                    COUNT(DISTINCT s.tenant_id) as total_subscribers,
                    SUM(CASE WHEN s.status = 'active' THEN 1 ELSE 0 END) as active_subscriptions,
                    (SELECT SUM(amount) FROM payments WHERE status = 'success' AND MONTH(created_at) = MONTH(CURRENT_DATE)) as mrr,
                    (SELECT SUM(amount) FROM payments WHERE status = 'success') as total_revenue,
                    (SELECT COUNT(*) FROM payments WHERE status = 'success' AND MONTH(created_at) = MONTH(CURRENT_DATE)) as payments_this_month
                FROM subscriptions s
            `);

                res.json({
                    success: true,
                    data: stats[0]
                });
            } catch (error) {
                console.error('Get billing stats error:', error);
                res.status(500).json({ error: 'Failed to fetch billing stats' });
            }
        }
    }

module.exports = new BillingController();
