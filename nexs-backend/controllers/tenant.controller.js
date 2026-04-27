const TenantModel = require('../models/tenant.model');
const PlanModel = require('../models/plan.model');
const ServerModel = require('../models/server.model');
const Provisioner = require('../services/provisioner');
const RazorpayService = require('../services/razorpay.service');
const DocumentTemplateModel = require('../models/document-template.model');
const pdfService = require('../services/pdf.service');
const emailService = require('../services/email.service');
const workflowEngine = require('../services/workflowEngine');
const { pool } = require('../config/database');

class TenantController {
    /**
     * Get all tenants
     */
    async getAllTenants(req, res) {
        try {
            const { status, plan_id, page = 1, limit = 10 } = req.query;
            const filters = { status, plan_id, page, limit };
            const tenants = await TenantModel.findAll(filters);
            const total = await TenantModel.count(filters);

            const p = parseInt(page);
            const l = parseInt(limit);

            res.json({
                success: true,
                data: tenants,
                count: tenants.length,
                pagination: {
                    page: p,
                    limit: l,
                    total,
                    pages: Math.ceil(total / l)
                }
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
     * Create new tenant and provision selected tools
     */
    async createTenant(req, res) {
        try {
            const { name, slug, email, phone, industry_type, plan_id, server_id, tools: selectedTools } = req.body;

            if (!name || !slug || !email) {
                return res.status(400).json({
                    error: 'Name, slug, and email are required'
                });
            }

            const existing = await TenantModel.findBySlug(slug);
            if (existing) {
                return res.status(400).json({
                    error: 'Slug already exists. Please choose a different one.'
                });
            }

            const tenantId = await TenantModel.create({
                name, slug, email, phone, industry_type, plan_id, server_id
            });

            let plan_slug = 'starter';
            if (plan_id) {
                const plan = await PlanModel.findById(plan_id);
                if (plan) plan_slug = plan.slug || 'starter';
            }

            const toolsToEnable = Array.isArray(selectedTools) ? selectedTools : [];
            const enableCRM = toolsToEnable.length === 0 || toolsToEnable.some(t => t.slug === 'nexcrm' || t === 'nexcrm');
            const enableNexMail = toolsToEnable.some(t => t.slug === 'nexmail' || t === 'nexmail');

            try {
                if (enableCRM) {
                    const provisioner = new Provisioner();

                    let server;
                    if (server_id) {
                        server = await ServerModel.findById(server_id);
                    } else {
                        server = await ServerModel.getBestServer();
                    }

                    if (!server) {
                        throw new Error('No available servers for provisioning');
                    }

                    const port = await TenantModel.allocatePort(tenantId, server.id);
                    await TenantModel.update(tenantId, { server_id: server.id });

                    const dbName = `nexcrm_${slug.replace(/-/g, '_')}`;
                    const dbHost = server.db_host || 'localhost';
                    await provisioner.createDatabase(dbName, dbHost, server.db_user, server.db_password);

                    res.status(201).json({
                        success: true,
                        message: 'Tenant created. Provisioning selected tools in background.',
                        data: { tenantId, slug, status: 'provisioning', tools: { crm: enableCRM, nexmail: enableNexMail } }
                    });

                    try {
                        const plan = plan_id ? await PlanModel.findById(plan_id) : null;
                        workflowEngine.trigger('tenant_created', 'tenant', tenantId, {
                            id: tenantId, name, slug, email, owner_email: email, owner_name: name,
                            phone: phone || '', industry_type: industry_type || 'general',
                            plan_name: plan?.name || 'Starter', plan_price: plan?.price ? `${plan.price}` : 'As per agreement',
                            plan_billing_cycle: plan?.billing_cycle || 'Monthly', trial_days: plan?.trial_days || 14
                        });
                    } catch (triggerErr) {
                        console.error('[TenantController] Workflow trigger error:', triggerErr.message);
                    }

                    provisioner.provisionTenant({
                        id: tenantId, name, slug, email,
                        industry_type: industry_type || 'general', plan_slug
                    }, server.id, {
                        skipPortAllocation: true, assignedPort: port, skipDbCreation: true
                    }).then(() => {
                        this._recordToolEnabled(tenantId, 'nexcrm', plan_id);
                    }).catch(async (bgError) => {
                        console.error(`[Background Provisioning Error] Tenant ${slug}:`, bgError);
                        await TenantModel.updateProcessStatus(tenantId, 'error');
                    });
                } else {
                    res.status(201).json({
                        success: true,
                        message: 'Tenant created. Provisioning selected tools in background.',
                        data: { tenantId, slug, status: 'created', tools: { crm: false, nexmail: enableNexMail } }
                    });
                }

                if (enableNexMail) {
                    this._provisionNexMail(tenantId, slug, null, email, name).catch(e =>
                        console.warn(`[Tenant] NexMail provision failed for ${slug}:`, e.message)
                    );
                }

                for (const tool of toolsToEnable) {
                    const toolSlug = typeof tool === 'string' ? tool : tool.slug;
                    const toolPlanId = typeof tool === 'object' ? tool.plan_id : null;
                    if (toolSlug !== 'nexcrm' && toolSlug !== 'nexmail') {
                        this._provisionGenericTool(tenantId, toolSlug, toolPlanId).catch(e =>
                            console.warn(`[Tenant] Tool ${toolSlug} provision failed:`, e.message)
                        );
                    }
                }

            } catch (provisionError) {
                console.error('Critical provisioning error:', provisionError);
                await TenantModel.updateProcessStatus(tenantId, 'error');
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

    async _recordToolEnabled(tenantId, toolSlug, planId) {
        try {
            const [tools] = await pool.query("SELECT id FROM tools WHERE slug = ?", [toolSlug]);
            if (tools.length) {
                await pool.query(`
                    INSERT INTO tenant_tools (tenant_id, tool_id, tool_plan_id, status, provisioned_at)
                    VALUES (?, ?, ?, 'active', NOW())
                    ON DUPLICATE KEY UPDATE status = 'active', tool_plan_id = COALESCE(VALUES(tool_plan_id), tool_plan_id)
                `, [tenantId, tools[0].id, planId || null]);
            }
        } catch (e) {
            console.warn(`[Tenant] Record tool ${toolSlug} failed:`, e.message);
        }
    }

    async _provisionNexMail(tenantId, slug, planId, adminEmail, adminName) {
        const [nexmailTool] = await pool.query("SELECT id, internal_api_url FROM tools WHERE slug = 'nexmail' AND status = 'active'");
        if (!nexmailTool.length) return;

        const toolId = nexmailTool[0].id;
        let selectedPlanId = planId;
        let planLimits = null, planFeatures = null;

        if (!selectedPlanId) {
            const [freePlan] = await pool.query("SELECT id, limits, features FROM tool_plans WHERE tool_id = ? AND is_free = TRUE ORDER BY sort_order LIMIT 1", [toolId]);
            if (freePlan.length) {
                selectedPlanId = freePlan[0].id;
                planLimits = freePlan[0].limits;
                planFeatures = freePlan[0].features;
            }
        } else {
            const [plan] = await pool.query("SELECT limits, features FROM tool_plans WHERE id = ?", [selectedPlanId]);
            if (plan.length) { planLimits = plan[0].limits; planFeatures = plan[0].features; }
        }

        await pool.query(`
            INSERT INTO tenant_tools (tenant_id, tool_id, tool_plan_id, status, provisioned_at)
            VALUES (?, ?, ?, 'active', NOW())
            ON DUPLICATE KEY UPDATE status = 'active', tool_plan_id = VALUES(tool_plan_id)
        `, [tenantId, toolId, selectedPlanId]);

        if (nexmailTool[0].internal_api_url) {
            const axios = require('axios');
            await axios.post(`${nexmailTool[0].internal_api_url}/internal/provision`, {
                tenant_id: tenantId, plan_id: selectedPlanId,
                plan_limits: planLimits, plan_features: planFeatures,
                admin_email: adminEmail, admin_name: adminName
            }, {
                headers: { 'X-API-Key': process.env.NEXMAIL_API_KEY || process.env.PLATFORM_API_KEY || '' },
                timeout: 10000
            });
        }
        console.log(`[Tenant] NexMail enabled for ${slug || tenantId}`);
    }

    async _provisionGenericTool(tenantId, toolSlug, planId) {
        const [tools] = await pool.query("SELECT id, internal_api_url FROM tools WHERE slug = ? AND status = 'active'", [toolSlug]);
        if (!tools.length) return;

        const toolId = tools[0].id;
        let selectedPlanId = planId;
        let planLimits = null, planFeatures = null;

        if (!selectedPlanId) {
            const [freePlan] = await pool.query("SELECT id, limits, features FROM tool_plans WHERE tool_id = ? AND is_free = TRUE ORDER BY sort_order LIMIT 1", [toolId]);
            if (freePlan.length) { selectedPlanId = freePlan[0].id; planLimits = freePlan[0].limits; planFeatures = freePlan[0].features; }
        } else {
            const [plan] = await pool.query("SELECT limits, features FROM tool_plans WHERE id = ?", [selectedPlanId]);
            if (plan.length) { planLimits = plan[0].limits; planFeatures = plan[0].features; }
        }

        await pool.query(`
            INSERT INTO tenant_tools (tenant_id, tool_id, tool_plan_id, status, provisioned_at)
            VALUES (?, ?, ?, 'active', NOW())
            ON DUPLICATE KEY UPDATE status = 'active', tool_plan_id = VALUES(tool_plan_id)
        `, [tenantId, toolId, selectedPlanId]);

        if (tools[0].internal_api_url) {
            const axios = require('axios');
            await axios.post(`${tools[0].internal_api_url}/internal/provision`, {
                tenant_id: tenantId, plan_id: selectedPlanId,
                plan_limits: planLimits, plan_features: planFeatures
            }, {
                headers: { 'X-API-Key': process.env.NEXMAIL_API_KEY || process.env.PLATFORM_API_KEY || '' },
                timeout: 10000
            });
        }
        console.log(`[Tenant] Tool ${toolSlug} enabled for tenant ${tenantId}`);
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

            // Resolve the server for this tenant
            const server = tenant.server_id
                ? await ServerModel.findById(tenant.server_id)
                : await ServerModel.getBestServer();

            if (!server) {
                return res.status(400).json({ error: 'No server found for this tenant' });
            }

            const provisioner = new Provisioner();
            await provisioner.startProcess(tenant, tenant.assigned_port, server);
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
            const { crm, storefront } = req.body;

            if (!crm && !storefront) {
                return res.status(400).json({ error: 'At least one domain is required' });
            }

            const tenant = await TenantModel.findById(id);
            if (!tenant) {
                return res.status(404).json({ error: 'Tenant not found' });
            }

            // Save domains to DB FIRST (before Cloudflare setup)
            // This ensures domain resolution works even if Cloudflare attachment fails
            const updateData = {};
            if (crm) updateData.custom_domain_crm = crm;
            if (storefront) updateData.custom_domain_storefront = storefront;
            await TenantModel.update(id, updateData);

            // Then attempt Cloudflare Pages attachment (non-blocking for DB save)
            let result = { success: false, results: {} };
            try {
                const provisioner = new Provisioner();
                result = await provisioner.setupCustomDomain(tenant, { crm, storefront });
                // Update verification status based on Cloudflare result
                await TenantModel.update(id, { custom_domain_verified: result.success });
            } catch (cfError) {
                console.warn('Cloudflare domain setup failed (domains saved to DB):', cfError.message);
                // Don't throw — domains are saved, Cloudflare can be retried
            }

            res.json({
                success: true,
                message: 'Custom domains saved' + (result.success ? ' and configured with Cloudflare' : ' (Cloudflare setup pending)'),
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

            // 4. Generate Razorpay payment link
            let paymentLinkUrl = '';
            try {
                // Point users back to their own CRM instance
                const baseDomain = process.env.VITE_APP_BASE_DOMAIN || 'nexspiresolutions.co.in';
                const tenantDomain = tenant.custom_domain || `${tenant.slug}-crm.${baseDomain}`;
                const tenantUrl = tenantDomain.startsWith('http') ? tenantDomain : `https://${tenantDomain}`;

                const successUrl = `${tenantUrl}/payment/success`;
                const cancelUrl = `${tenantUrl}/payment/cancelled`;
                const paymentLink = await RazorpayService.createHostedPaymentLink({
                    planId: planId.toString(),
                    billingCycle: 'monthly',
                    successUrl,
                    cancelUrl,
                    customer: {
                        name: tenant.name,
                        email: tenant.email,
                        contact: tenant.phone
                    },
                    metadata: {
                        tenant_id: tenant.id.toString(),
                        plan_id: planId.toString(),
                        plan_slug: planSlug,
                        source: 'tenant_end_trial'
                    }
                });
                paymentLinkUrl = paymentLink.short_url;
            } catch (razorpayErr) {
                console.error('Could not generate Razorpay link:', razorpayErr.message);
            }

            const html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                    <h2 style="color: #4f46e5;">Your Nexspire Trial Has Ended</h2>
                    <p>Hi ${tenant.name},</p>
                    <p>We hope you enjoyed using Nexspire! Your free trial has concluded and your account has been temporarily suspended to prevent overages.</p>
                    <p>To restore access to your CRM and storefront instantly, please securely complete payment using the Razorpay link below.</p>
                    ${paymentLinkUrl ? `<p style="margin: 30px 0;"><a href="${paymentLinkUrl}" style="padding: 12px 24px; background: #4f46e5; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Pay Securely with Razorpay</a></p>` : ''}
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
                paymentLink: paymentLinkUrl,
                provider: 'razorpay'
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

            // 2. Generate Razorpay payment link
            let paymentLinkUrl = '';
            try {
                // Point users back to their own CRM instance
                const baseDomain = process.env.VITE_APP_BASE_DOMAIN || 'nexspiresolutions.co.in';
                const tenantDomain = tenant.custom_domain || `${tenant.slug}-crm.${baseDomain}`;
                const tenantUrl = tenantDomain.startsWith('http') ? tenantDomain : `https://${tenantDomain}`;

                const successUrl = `${tenantUrl}/payment/success`;
                const cancelUrl = `${tenantUrl}/payment/cancelled`;
                const paymentLink = await RazorpayService.createHostedPaymentLink({
                    planId: planId.toString(),
                    billingCycle: 'monthly',
                    successUrl,
                    cancelUrl,
                    customer: {
                        name: tenant.name,
                        email: tenant.email,
                        contact: tenant.phone
                    },
                    metadata: {
                        tenant_id: tenant.id.toString(),
                        plan_id: planId.toString(),
                        plan_slug: planSlug,
                        source: 'tenant_payment_request'
                    }
                });
                paymentLinkUrl = paymentLink.short_url;
            } catch (razorpayErr) {
                console.error('Could not generate Razorpay link:', razorpayErr.message);
                return res.status(500).json({ error: 'Could not generate Razorpay link. Have you configured your keys?' });
            }

            if (!paymentLinkUrl) {
                return res.status(500).json({ error: 'Checkout URL generation failed' });
            }

            const html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                    <h2 style="color: #4f46e5;">Action Required: Complete Your Subscription</h2>
                    <p>Hi ${tenant.name},</p>
                    <p>Attached is the secure Razorpay payment link for your Nexspire CRM and storefront instance.</p>
                    <p>Please click the button below to review your plan details and complete payment securely.</p>
                    <p style="margin: 30px 0;"><a href="${paymentLinkUrl}" style="padding: 12px 24px; background: #4f46e5; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Review Plan & Pay</a></p>
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
                paymentLink: paymentLinkUrl,
                provider: 'razorpay'
            });
        } catch (error) {
            console.error('Send payment link error:', error);
            res.status(500).json({ error: 'Failed to send payment link' });
        }
    }

    /**
     * Send Service Agreement PDF to tenant via email
     */
    async sendAgreement(req, res) {
        try {
            const { id } = req.params;
            const { pool } = require('../config/database');

            const tenant = await TenantModel.findById(id);
            if (!tenant) {
                return res.status(404).json({ error: 'Tenant not found' });
            }

            // Find the tenant-agreement template
            const template = await DocumentTemplateModel.findBySlug('tenant-agreement');
            if (!template) {
                return res.status(404).json({ error: 'Agreement template not found. Please run seed-templates first.' });
            }

            // Resolve plan details
            let planName = 'Standard';
            let planPrice = 'As per selected plan';
            let planBillingCycle = 'Monthly';

            if (tenant.plan_id) {
                const [plans] = await pool.query('SELECT name, slug, price_monthly, price_yearly FROM plans WHERE id = ?', [tenant.plan_id]);
                if (plans.length) {
                    planName = plans[0].name || planName;
                    const billingCycle = tenant.billing_cycle || 'monthly';
                    const price = billingCycle === 'yearly' ? plans[0].price_yearly : plans[0].price_monthly;
                    planPrice = price ? `INR ${price}` : planPrice;
                    planBillingCycle = billingCycle === 'yearly' ? 'Yearly' : 'Monthly';
                }
            }

            // Build template variables
            const today = new Date();
            const agreementDate = today.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
            const startDate = tenant.created_at
                ? new Date(tenant.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
                : agreementDate;

            const variables = {
                tenant_name: tenant.owner_name || tenant.name,
                tenant_email: tenant.owner_email || tenant.email,
                tenant_phone: tenant.phone || 'Not provided',
                tenant_company: tenant.business_name || tenant.name,
                tenant_slug: tenant.slug,
                plan_name: tenant.plan_name || planName,
                plan_price: planPrice,
                plan_billing_cycle: planBillingCycle,
                start_date: startDate,
                agreement_date: agreementDate,
                trial_period: tenant.trial_days ? `${tenant.trial_days} days` : '14 days',
                business_address: 'Nexspire Solutions, India',
                custom_terms: 'No additional terms apply unless mutually agreed upon in writing by both parties.'
            };

            // Render the template
            const renderedHtml = DocumentTemplateModel.renderTemplate(template.content, variables);

            // Generate PDF
            const pdfBuffer = await pdfService.generateFromHtml(renderedHtml);

            // Build professional email wrapper
            const tenantDisplayName = variables.tenant_name;
            const emailHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Service Agreement - NexSpire Solutions</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:32px 16px;">
        <tr>
            <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background-color:#4f46e5;padding:32px 40px;text-align:center;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding-bottom:12px;">
                                        <div style="width:48px;height:48px;background-color:rgba(255,255,255,0.2);border-radius:10px;display:inline-block;line-height:48px;text-align:center;">
                                            <span style="color:#ffffff;font-size:22px;font-weight:bold;">N</span>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center">
                                        <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:600;">Service Agreement</h1>
                                        <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:14px;">NexSpire Solutions</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <!-- Body -->
                    <tr>
                        <td style="padding:40px;">
                            <p style="color:#1e293b;font-size:16px;line-height:1.6;margin:0 0 20px;">
                                Dear <strong>${tenantDisplayName}</strong>,
                            </p>
                            <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 20px;">
                                Thank you for choosing NexSpire Solutions. Please find attached your Service Agreement for the <strong>${variables.plan_name}</strong> plan.
                            </p>
                            <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 28px;">
                                Please review the attached agreement carefully. If you have any questions, don't hesitate to reach out to our team.
                            </p>
                            <!-- Agreement Summary Box -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:28px;">
                                <tr>
                                    <td style="padding:20px;">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="padding-bottom:12px;border-bottom:1px solid #e2e8f0;">
                                                    <span style="color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Agreement Summary</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding-top:12px;">
                                                    <table width="100%" cellpadding="0" cellspacing="0">
                                                        <tr>
                                                            <td style="padding:6px 0;color:#64748b;font-size:13px;">Plan</td>
                                                            <td style="padding:6px 0;font-weight:600;color:#1e293b;text-align:right;font-size:13px;">${variables.plan_name}</td>
                                                        </tr>
                                                        <tr>
                                                            <td style="padding:6px 0;color:#64748b;font-size:13px;">Billing</td>
                                                            <td style="padding:6px 0;font-weight:600;color:#1e293b;text-align:right;font-size:13px;">${variables.plan_billing_cycle}</td>
                                                        </tr>
                                                        <tr>
                                                            <td style="padding:6px 0;color:#64748b;font-size:13px;">Effective Date</td>
                                                            <td style="padding:6px 0;font-weight:600;color:#1e293b;text-align:right;font-size:13px;">${variables.start_date}</td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 8px;">
                                Best regards,
                            </p>
                            <p style="color:#1e293b;font-size:14px;font-weight:600;margin:0;">
                                NexSpire Solutions Team
                            </p>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="background-color:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center">
                                        <p style="color:#94a3b8;font-size:12px;margin:0;">
                                            &copy; ${new Date().getFullYear()} NexSpire Solutions Pvt. Ltd. All rights reserved.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

            // Send email with PDF attachment
            const emailResult = await emailService.sendEmail({
                to: variables.tenant_email,
                subject: 'Service Agreement - NexSpire Solutions',
                html: emailHtml,
                attachments: [{
                    filename: `Nexspire-Agreement-${tenant.slug}.pdf`,
                    content: pdfBuffer,
                    contentType: 'application/pdf'
                }]
            });

            if (!emailResult.success) {
                return res.status(500).json({ error: emailResult.error || 'Failed to send agreement email' });
            }

            res.json({
                success: true,
                message: `Agreement sent successfully to ${variables.tenant_email}`
            });
        } catch (error) {
            console.error('Send agreement error:', error);
            res.status(500).json({ error: 'Failed to send agreement: ' + error.message });
        }
    }
}

module.exports = new TenantController();
