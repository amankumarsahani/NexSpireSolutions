const TenantModel = require('../models/tenant.model');
const PlanModel = require('../models/plan.model');
const ServerModel = require('../models/server.model');
const Provisioner = require('../services/provisioner');

class TenantController {
    /**
     * Get all tenants
     */
    async getAllTenants(req, res) {
        try {
            const { status, plan_id, limit } = req.query;
            const tenants = await TenantModel.findAll({ status, plan_id, limit });

            res.json({
                success: true,
                data: tenants,
                count: tenants.length
            });
        } catch (error) {
            console.error('Get tenants error:', error);
            res.status(500).json({ error: 'Failed to fetch tenants' });
        }
    }

    /**
     * Get tenant by ID
     */
    async getTenant(req, res) {
        try {
            const { id } = req.params;
            const tenant = await TenantModel.findById(id);

            if (!tenant) {
                return res.status(404).json({ error: 'Tenant not found' });
            }

            res.json({
                success: true,
                data: tenant
            });
        } catch (error) {
            console.error('Get tenant error:', error);
            res.status(500).json({ error: 'Failed to fetch tenant' });
        }
    }

    /**
     * Get tenant by slug (for API discovery)
     */
    async getTenantBySlug(req, res) {
        try {
            const { slug } = req.params;
            const tenant = await TenantModel.findBySlug(slug);

            if (!tenant) {
                return res.status(404).json({ error: 'Tenant not found' });
            }

            // Return only public info for API discovery
            res.json({
                success: true,
                data: {
                    name: tenant.name,
                    slug: tenant.slug,
                    subdomain: tenant.subdomain,
                    status: tenant.status,
                    apiUrl: `https://${tenant.slug}-crm-api.nexspiresolutions.co.in`
                }
            });
        } catch (error) {
            console.error('Get tenant by slug error:', error);
            res.status(500).json({ error: 'Failed to fetch tenant' });
        }
    }

    /**
     * Create new tenant and provision
     */
    async createTenant(req, res) {
        try {
            const { name, slug, email, phone, industry_type, plan_id, server_id } = req.body;

            // Validation
            if (!name || !slug || !email) {
                return res.status(400).json({
                    error: 'Name, slug, and email are required'
                });
            }

            // Check if slug already exists
            const existing = await TenantModel.findBySlug(slug);
            if (existing) {
                return res.status(400).json({
                    error: 'Slug already exists. Please choose a different one.'
                });
            }

            // Create tenant record
            const tenantId = await TenantModel.create({
                name, slug, email, phone, industry_type, plan_id, server_id
            });

            // Get plan details for provisioning
            let plan_slug = 'starter';
            if (plan_id) {
                const plan = await PlanModel.findById(plan_id);
                if (plan) {
                    plan_slug = plan.slug || 'starter';
                }
            }

            // Provision the tenant (create DB, start process, configure Cloudflare)
            // We do this asynchronously to prevent creating a timeout on the frontend
            try {
                // Initialize Provisioner service
                const provisioner = new Provisioner();

                // 1. Select Server (Critical Step)
                let server;
                if (server_id) {
                    server = await ServerModel.findById(server_id);
                } else {
                    server = await ServerModel.getBestServer();
                }

                if (!server) {
                    throw new Error('No available servers for provisioning');
                }

                // 2. Allocate Port (Critical Step)
                const port = await TenantModel.allocatePort(tenantId, server.id);

                // 3. Update Tenant with Server ID (Critical Step)
                await TenantModel.update(tenantId, { server_id: server.id });

                // 4. Create Database (Critical Step - usually fast enough)
                const dbName = `nexcrm_${slug.replace(/-/g, '_')}`;
                const dbHost = server.db_host || 'localhost';
                await provisioner.createDatabase(dbName, dbHost, server.db_user, server.db_password);

                // RESPONSE sent here - preventing timeout
                res.status(201).json({
                    success: true,
                    message: 'Tenant created successfully. Provisioning resources in background.',
                    data: {
                        tenantId,
                        slug,
                        status: 'provisioning'
                    }
                });

                // 5. Background Provisioning (Heavy Lifting)
                // We deliberately do NOT await this. We let it run in the background.
                provisioner.provisionTenant({
                    id: tenantId,
                    name,
                    slug,
                    email,
                    industry_type: industry_type || 'general',
                    plan_slug
                }, server.id, {
                    skipPortAllocation: true,
                    assignedPort: port,
                    skipDbCreation: true
                }).catch(async (bgError) => {
                    console.error(`[Background Provisioning Error] Tenant ${slug}:`, bgError);
                    await TenantModel.updateProcessStatus(tenantId, 'error');
                });

            } catch (provisionError) {
                // If critical setup fails, we DO return an error response (or warning)
                console.error('Critical provisioning error:', provisionError);

                // Update status to indicate issue
                await TenantModel.updateProcessStatus(tenantId, 'error');

                // If check prevents double header sending
                if (!res.headersSent) {
                    res.status(201).json({
                        success: true,
                        message: 'Tenant created but provisioning failed. Please provision manually.',
                        data: { tenantId },
                        provisionError: provisionError.message
                    });
                }
            }
        } catch (error) {
            console.error('Create tenant error:', error);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Failed to create tenant: ' + error.message });
            }
        }
    }

    /**
     * Update tenant
     */
    async updateTenant(req, res) {
        try {
            const { id } = req.params;

            const tenant = await TenantModel.findById(id);
            if (!tenant) {
                return res.status(404).json({ error: 'Tenant not found' });
            }

            const updated = await TenantModel.update(id, req.body);

            // Fix: Sync settings to tenant DB if critical fields changed
            if (req.body.name || req.body.email || req.body.industry_type) {
                const freshTenant = await TenantModel.findById(id);
                if (freshTenant) {
                    const provisioner = new Provisioner();
                    let server = { is_primary: true };

                    if (freshTenant.server_id) {
                        const s = await ServerModel.findById(freshTenant.server_id);
                        if (s) server = s;
                    }

                    // Run sync in background
                    provisioner.syncTenantSettings(freshTenant, server).catch(err => {
                        console.error(`[Update Tenant] JSON Settings sync failed: ${err.message}`);
                    });
                }
            }

            res.json({
                success: true,
                message: 'Tenant updated successfully',
                data: updated
            });
        } catch (error) {
            console.error('Update tenant error:', error);
            res.status(500).json({ error: 'Failed to update tenant' });
        }
    }

    /**
     * Start tenant process
     */
    async startTenant(req, res) {
        try {
            const { id } = req.params;

            const tenant = await TenantModel.findById(id);
            if (!tenant) {
                return res.status(404).json({ error: 'Tenant not found' });
            }

            if (!tenant.assigned_port || !tenant.db_name) {
                return res.status(400).json({
                    error: 'Tenant not provisioned. Please provision first.'
                });
            }

            const provisioner = new Provisioner();
            await provisioner.startProcess(tenant);
            await TenantModel.updateProcessStatus(id, 'running');

            res.json({
                success: true,
                message: 'Tenant process started'
            });
        } catch (error) {
            console.error('Start tenant error:', error);
            res.status(500).json({ error: 'Failed to start tenant process' });
        }
    }

    /**
     * Stop tenant process
     */
    async stopTenant(req, res) {
        try {
            const { id } = req.params;

            const tenant = await TenantModel.findById(id);
            if (!tenant) {
                return res.status(404).json({ error: 'Tenant not found' });
            }

            const provisioner = new Provisioner();
            await provisioner.stopProcess(tenant);
            await TenantModel.updateProcessStatus(id, 'stopped');

            res.json({
                success: true,
                message: 'Tenant process stopped'
            });
        } catch (error) {
            console.error('Stop tenant error:', error);
            res.status(500).json({ error: 'Failed to stop tenant process' });
        }
    }

    /**
     * Restart tenant process
     */
    async restartTenant(req, res) {
        try {
            const { id } = req.params;

            const tenant = await TenantModel.findById(id);
            if (!tenant) {
                return res.status(404).json({ error: 'Tenant not found' });
            }

            const provisioner = new Provisioner();
            await provisioner.restartProcess(tenant);
            await TenantModel.updateProcessStatus(id, 'running');

            res.json({
                success: true,
                message: 'Tenant process restarted'
            });
        } catch (error) {
            console.error('Restart tenant error:', error);
            res.status(500).json({ error: 'Failed to restart tenant process' });
        }
    }

    /**
     * Provision tenant (if not auto-provisioned on create)
     */
    async provisionTenant(req, res) {
        try {
            const { id } = req.params;

            const tenant = await TenantModel.findById(id);
            if (!tenant) {
                return res.status(404).json({ error: 'Tenant not found' });
            }

            if (tenant.process_status === 'running') {
                return res.status(400).json({
                    error: 'Tenant already provisioned and running'
                });
            }

            const provisioner = new Provisioner();
            const result = await provisioner.provisionTenant(tenant);

            res.json({
                success: true,
                message: 'Tenant provisioned successfully',
                data: result
            });
        } catch (error) {
            console.error('Provision tenant error:', error);
            res.status(500).json({ error: 'Failed to provision tenant' });
        }
    }

    /**
     * Get tenant stats for dashboard
     */
    async getStats(req, res) {
        try {
            const stats = await TenantModel.getStats();

            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            console.error('Get stats error:', error);
            res.status(500).json({ error: 'Failed to fetch stats' });
        }
    }

    /**
     * Delete/Cancel tenant
     */
    async deleteTenant(req, res) {
        try {
            const { id } = req.params;

            const tenant = await TenantModel.findById(id);
            if (!tenant) {
                return res.status(404).json({ error: 'Tenant not found' });
            }

            // Stop process if running
            try {
                if (tenant.process_status === 'running') {
                    const provisioner = new Provisioner();
                    await provisioner.stopProcess(tenant);
                }
            } catch (cleanupError) {
                console.warn('Error stopping process during delete (ignoring):', cleanupError);
            }

            // Soft delete
            await TenantModel.delete(id);

            res.json({
                success: true,
                message: 'Tenant cancelled successfully'
            });
        } catch (error) {
            console.error('Delete tenant error:', error);
            res.status(500).json({ error: 'Failed to delete tenant' });
        }
    }

    /**
     * Get PM2 logs for a tenant
     */
    async getLogs(req, res) {
        try {
            const { id } = req.params;
            const { lines = 100 } = req.query;

            const tenant = await TenantModel.findById(id);
            if (!tenant) {
                return res.status(404).json({ error: 'Tenant not found' });
            }

            const provisioner = new Provisioner();
            const logsData = await provisioner.getProcessLogs(tenant, parseInt(lines));

            res.json({
                success: true,
                data: logsData
            });
        } catch (error) {
            console.error('Get logs error:', error);
            res.status(500).json({ error: 'Failed to fetch logs' });
        }
    }

    /**
     * Setup custom domains for tenant (CRM, Storefront, API)
     */
    async setupCustomDomain(req, res) {
        try {
            const { id } = req.params;
            const { crm, storefront, api } = req.body;

            if (!crm && !storefront && !api) {
                return res.status(400).json({ error: 'At least one domain is required' });
            }

            const tenant = await TenantModel.findById(id);
            if (!tenant) {
                return res.status(404).json({ error: 'Tenant not found' });
            }

            // Call provisioner to setup domains
            const provisioner = new Provisioner();
            const result = await provisioner.setupCustomDomain(tenant, { crm, storefront, api });

            // Update database with new domain columns
            const updateData = {};
            if (crm) updateData.custom_domain_crm = crm;
            if (storefront) updateData.custom_domain_storefront = storefront;
            if (api) updateData.custom_domain_api = api;
            updateData.custom_domain_verified = result.success;

            await TenantModel.update(id, updateData);

            res.json({
                success: true,
                message: 'Custom domain configuration initiated',
                data: result
            });
        } catch (error) {
            console.error('Setup custom domain error:', error);
            res.status(500).json({ error: error.message || 'Failed to setup custom domain' });
        }
    }

    /**
     * Full delete tenant - removes all resources
     */
    async fullDeleteTenant(req, res) {
        try {
            const { id } = req.params;
            const { dropDatabase = false } = req.body;

            const tenant = await TenantModel.findById(id);
            if (!tenant) {
                return res.status(404).json({ error: 'Tenant not found' });
            }

            // Send immediate response to prevent timeouts
            res.status(202).json({
                success: true,
                message: 'Tenant deletion initiated in background',
                data: { tenantId: id }
            });

            // Perform full cleanup in background
            (async () => {
                try {
                    const provisioner = new Provisioner();
                    await provisioner.fullCleanup(tenant, {
                        dropDb: dropDatabase
                    });
                } catch (cleanupError) {
                    console.error('[Background Delete] Cleanup partial error:', cleanupError);
                } finally {
                    // Hard delete from database regardless of cleanup success
                    try {
                        await TenantModel.hardDelete(id);
                        console.log(`[Background Delete] Tenant ${id} hard deleted from DB`);
                    } catch (dbError) {
                        console.error(`[Background Delete] Failed to hard delete tenant ${id} from DB:`, dbError);
                    }
                }
            })();
        } catch (error) {
            console.error('Full delete tenant error:', error);
            res.status(500).json({ error: 'Failed to fully delete tenant' });
        }
    }

    /**
     * End trial, suspend process, and request payment via email
     */
    async endTrialAndRequestPayment(req, res) {
        try {
            const { id } = req.params;
            const StripeService = require('../services/stripe.service');
            const EmailService = require('../services/email.service');
            const { pool } = require('../config/database');

            const tenant = await TenantModel.findById(id);
            if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

            // 1. Suspend the tenant
            await TenantModel.update(id, { status: 'suspended' });

            // 2. Stop their process
            if (tenant.process_status === 'running') {
                try {
                    const provisioner = new Provisioner();
                    await provisioner.stopProcess(tenant);
                    await TenantModel.updateProcessStatus(id, 'stopped');
                } catch (e) {
                    console.error('Failed to stop process:', e);
                }
            }

            // 3. Get plan to generate payment link
            let planId = tenant.plan_id;
            let planSlug = 'starter';

            if (planId) {
                const [plans] = await pool.query('SELECT slug FROM plans WHERE id = ?', [planId]);
                if (plans.length) planSlug = plans[0].slug;
            } else {
                const [plans] = await pool.query('SELECT id, slug FROM plans ORDER BY id ASC LIMIT 1');
                if (plans.length) {
                    planId = plans[0].id;
                    planSlug = plans[0].slug;
                }
            }

            // 4. Generate Stripe checkout session
            let checkoutUrl = '';
            try {
                const adminUrl = process.env.APP_URL || 'http://localhost:5173';
                const successUrl = `${adminUrl}/payment/success`;
                const cancelUrl = `${adminUrl}/payment/cancelled`;
                const session = await StripeService.createCheckoutSession(
                    planId.toString(),
                    successUrl,
                    cancelUrl,
                    { tenant_id: tenant.id.toString(), plan_id: planId.toString() }
                );
                checkoutUrl = session.url;
            } catch (stripeErr) {
                console.error('Could not generate stripe link:', stripeErr.message);
            }

            const html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                    <h2 style="color: #4f46e5;">Your Nexspire Trial Has Ended</h2>
                    <p>Hi ${tenant.name},</p>
                    <p>We hope you enjoyed using Nexspire! Your free trial has concluded and your account has been temporarily suspended to prevent overages.</p>
                    <p>To restore access to your CRM and storefront instantly, please securely subscribe to a plan using the link below.</p>
                    ${checkoutUrl ? `<p style="margin: 30px 0;"><a href="${checkoutUrl}" style="padding: 12px 24px; background: #4f46e5; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Subscribe & Pay Now</a></p>` : ''}
                    <p>If you have any questions, please reach out to our team.</p>
                    <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;" />
                    <p style="font-size: 12px; color: #888;">&copy; ${new Date().getFullYear()} Nexspire Solutions</p>
                </div>
            `;

            await EmailService.sendEmail({
                to: tenant.email,
                subject: 'Action Required: Your Nexspire Trial Has Ended',
                html
            });

            res.json({
                success: true,
                message: 'Trial ended, tenant suspended, and payment email sent.',
                paymentLink: checkoutUrl
            });
        } catch (error) {
            console.error('End trial error:', error);
            res.status(500).json({ error: 'Failed to end trial and request payment' });
        }
    }

    /**
     * Send Payment Link via email without suspending
     */
    async sendPaymentLink(req, res) {
        try {
            const { id } = req.params;
            const StripeService = require('../services/stripe.service');
            const EmailService = require('../services/email.service');
            const { pool } = require('../config/database');

            const tenant = await TenantModel.findById(id);
            if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

            // 1. Get plan to generate payment link
            let planId = tenant.plan_id;
            let planSlug = 'starter';

            if (planId) {
                const [plans] = await pool.query('SELECT slug FROM plans WHERE id = ?', [planId]);
                if (plans.length) planSlug = plans[0].slug;
            } else {
                const [plans] = await pool.query('SELECT id, slug FROM plans ORDER BY id ASC LIMIT 1');
                if (plans.length) {
                    planId = plans[0].id;
                    planSlug = plans[0].slug;
                }
            }

            // 2. Generate Stripe checkout session
            let checkoutUrl = '';
            try {
                const adminUrl = process.env.APP_URL || 'http://localhost:5173';
                const successUrl = `${adminUrl}/payment/success`;
                const cancelUrl = `${adminUrl}/payment/cancelled`;
                const session = await StripeService.createCheckoutSession(
                    planId.toString(),
                    successUrl,
                    cancelUrl,
                    { tenant_id: tenant.id.toString(), plan_id: planId.toString() }
                );
                checkoutUrl = session.url;
            } catch (stripeErr) {
                console.error('Could not generate stripe link:', stripeErr.message);
                return res.status(500).json({ error: 'Could not generate Stripe link. Have you configured your keys and prices?' });
            }

            if (!checkoutUrl) {
                return res.status(500).json({ error: 'Checkout URL generation failed' });
            }

            const html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                    <h2 style="color: #4f46e5;">Action Required: Complete Your Subscription</h2>
                    <p>Hi ${tenant.name},</p>
                    <p>Attached is the secure payment link to subscribe to your Nexspire CRM and Storefront instance.</p>
                    <p>Please click the button below to review your plan details and securely enter your payment information.</p>
                    <p style="margin: 30px 0;"><a href="${checkoutUrl}" style="padding: 12px 24px; background: #4f46e5; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Review Plan & Pay</a></p>
                    <p>If you have any questions, please reach out to our team.</p>
                    <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;" />
                    <p style="font-size: 12px; color: #888;">&copy; ${new Date().getFullYear()} Nexspire Solutions</p>
                </div>
            `;

            await EmailService.sendEmail({
                to: tenant.email,
                subject: 'Action Required: Submit Your Nexspire Subscription Payment',
                html
            });

            res.json({
                success: true,
                message: 'Payment link generated and emailed to the tenant.',
                paymentLink: checkoutUrl
            });
        } catch (error) {
            console.error('Send payment link error:', error);
            res.status(500).json({ error: 'Failed to send payment link' });
        }
    }
}

module.exports = new TenantController();
