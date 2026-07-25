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
const { execFile } = require('child_process');
const path = require('path');

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
                    apiUrl: `https://${tenant.slug}-crm-api.napnix.in`
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
            const {
                name,
                slug,
                email,
                phone,
                industry_type,
                academic_mode,
                plan_id,
                server_id,
                custom_domain,
                status,
                trial_days,
                trial_ends_at,
                tools: selectedTools
            } = req.body;

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
                name,
                slug,
                email,
                phone,
                industry_type,
                academic_mode,
                plan_id: plan_id ? Number(plan_id) : undefined,
                server_id: server_id ? Number(server_id) : undefined,
                custom_domain: custom_domain || null,
                status: status || 'trial',
                trial_days,
                trial_ends_at
            });

            let plan_slug = 'starter';
            if (plan_id) {
                const plan = await PlanModel.findById(plan_id);
                if (plan) plan_slug = plan.slug || 'starter';
            }

            const toolsToEnable = Array.isArray(selectedTools) ? selectedTools : [];
            const enableCRM = toolsToEnable.length === 0 || toolsToEnable.some(t => {
                const toolSlug = typeof t === 'string' ? t : t.slug;
                return toolSlug === 'nexcrm' || toolSlug === 'napcrm';
            });
            const enableNexMail = toolsToEnable.some(t => t.slug === 'napmail' || t === 'napmail');

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
                    await provisioner.createDatabase(dbName, server);
                    await TenantModel.updateProcessInfo(tenantId, {
                        assigned_port: port,
                        db_name: dbName,
                        process_name: `tenant-${slug}`,
                        process_status: 'starting'
                    });
                    await TenantModel.update(tenantId, {
                        provision_step: 'migrations',
                        provision_error: null,
                        provisioning_started_at: new Date(),
                        provisioning_completed_at: null
                    });

                    res.status(201).json({
                        success: true,
                        message: 'Tenant created. Provisioning selected tools in background.',
                        data: { tenantId, slug, status: 'provisioning', tools: { nexcrm: enableCRM, napmail: enableNexMail } }
                    });

                    provisioner.provisionTenant({
                        id: tenantId, name, slug, email,
                        industry_type: industry_type || 'general',
                        academic_mode: industry_type === 'school' ? (academic_mode || 'school') : null,
                        custom_domain: custom_domain || null,
                        plan_slug
                    }, server.id, {
                        skipPortAllocation: true, assignedPort: port, skipDbCreation: true
                    }).then(async () => {
                        await module.exports._recordToolEnabled(tenantId, 'nexcrm', plan_id);

                        await module.exports._triggerTenantCreatedWorkflow({
                            id: tenantId,
                            name,
                            slug,
                            email,
                            phone,
                            industry_type: industry_type || 'general',
                            plan_id
                        });
                    }).catch(async (bgError) => {
                        console.error(`[Background Provisioning Error] Tenant ${slug}:`, bgError);
                        await TenantModel.update(tenantId, {
                            process_status: 'error',
                            provision_error: bgError.message,
                            provisioning_completed_at: null
                        });
                    });
                } else {
                    res.status(201).json({
                        success: true,
                        message: 'Tenant created. Provisioning selected tools in background.',
                        data: { tenantId, slug, status: 'created', tools: { nexcrm: false, napmail: enableNexMail } }
                    });
                }

                if (enableNexMail) {
                    this._provisionNexMail(tenantId, slug, null, email, name).catch(e =>
                        console.warn(`[Tenant] NapMail provision failed for ${slug}:`, e.message)
                    );
                }

                for (const tool of toolsToEnable) {
                    const toolSlug = typeof tool === 'string' ? tool : tool.slug;
                    const toolPlanId = typeof tool === 'object' ? tool.plan_id : null;
                    if (toolSlug !== 'nexcrm' && toolSlug !== 'napcrm' && toolSlug !== 'napmail') {
                        this._provisionGenericTool(tenantId, toolSlug, toolPlanId).catch(e =>
                            console.warn(`[Tenant] Tool ${toolSlug} provision failed:`, e.message)
                        );
                    }
                }

            } catch (provisionError) {
                console.error('Critical provisioning error:', provisionError);
                await TenantModel.update(tenantId, {
                    process_status: 'error',
                    provision_step: 'initialization',
                    provision_error: provisionError.message,
                    provisioning_completed_at: null
                });
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

    async _startTenantIfProvisioned(tenant) {
        if (
            !tenant
            || tenant.process_status === 'running'
            || tenant.process_status === 'starting'
            || tenant.process_status === 'error'
            || tenant.provision_error
            || !tenant.assigned_port
            || !tenant.db_name
        ) {
            return false;
        }

        const server = tenant.server_id
            ? await ServerModel.findById(tenant.server_id)
            : await ServerModel.getBestServer();

        if (!server) {
            return false;
        }

        const provisioner = new Provisioner();
        await provisioner.startProcess(tenant, tenant.assigned_port, server);
        await TenantModel.updateProcessStatus(tenant.id, 'running');
        return true;
    }

    async _stopTenantIfRunning(tenant) {
        if (!tenant || tenant.process_status !== 'running') {
            return false;
        }

        const provisioner = new Provisioner();
        await provisioner.stopProcess(tenant);
        await TenantModel.updateProcessStatus(tenant.id, 'stopped');
        return true;
    }

    /**
     * Relaunch a tenant's PM2 process so launch-time args (--industry/--plan)
     * pick up changes. A plain `pm2 restart` reuses the running process's old
     * args, so industry/plan changes need a full ecosystem update + delete/start.
     */
    async _relaunchTenantForConfigChange(tenant) {
        if (!tenant || tenant.process_status !== 'running' || !tenant.assigned_port || !tenant.db_name) {
            return false;
        }

        const server = tenant.server_id
            ? await ServerModel.findById(tenant.server_id)
            : await ServerModel.getBestServer();

        if (!server) {
            return false;
        }

        const provisioner = new Provisioner();
        // Rewrite ecosystem.config.js with fresh args, then delete + start so
        // the new --industry/--plan take effect (startProcess does delete+start).
        await provisioner.updateEcosystemConfig(tenant, tenant.assigned_port, server);
        await provisioner.startProcess(tenant, tenant.assigned_port, server);
        await TenantModel.updateProcessStatus(tenant.id, 'running');
        return true;
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

    async _triggerTenantCreatedWorkflow(tenant) {
        try {
            const plan = tenant.plan_id ? await PlanModel.findById(tenant.plan_id) : null;
            workflowEngine.trigger('tenant_created', 'tenant', tenant.id, {
                id: tenant.id,
                name: tenant.name,
                slug: tenant.slug,
                email: tenant.email,
                owner_email: tenant.email,
                owner_name: tenant.name,
                phone: tenant.phone || '',
                industry_type: tenant.industry_type || 'general',
                plan_name: plan?.name || tenant.plan_name || 'Starter',
                plan_price: plan?.price ? `${plan.price}` : 'As per agreement',
                plan_billing_cycle: plan?.billing_cycle || 'Monthly',
                trial_days: plan?.trial_days || 14
            });
        } catch (triggerErr) {
            console.error('[TenantController] Workflow trigger error:', triggerErr.message);
        }
    }

    async _provisionNexMail(tenantId, slug, planId, adminEmail, adminName) {
        const [nexmailTool] = await pool.query("SELECT id, internal_api_url FROM tools WHERE slug = 'napmail' AND status = 'active'");
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

            const payload = { ...req.body };

            if (payload.plan_id === '') payload.plan_id = null;
            if (payload.plan_id !== undefined && payload.plan_id !== null) {
                payload.plan_id = Number(payload.plan_id);
            }
            if (payload.server_id === '') payload.server_id = null;
            if (payload.server_id !== undefined && payload.server_id !== null) {
                payload.server_id = Number(payload.server_id);
            }
            if (payload.trial_ends_at === '') {
                payload.trial_ends_at = null;
            }

            const updated = await TenantModel.update(id, payload);

            if (payload.status && payload.status !== tenant.status) {
                const refreshedTenant = await TenantModel.findById(id);

                if (payload.status === 'active' || payload.status === 'trial') {
                    await this._startTenantIfProvisioned(refreshedTenant);
                } else if (payload.status === 'suspended' || payload.status === 'cancelled') {
                    await this._stopTenantIfRunning(refreshedTenant);
                }
            }

            // Fix: Sync settings to tenant DB if critical fields changed
            if (payload.name || payload.email || payload.industry_type || payload.plan_id !== undefined) {
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

                    // industry/plan are baked into the PM2 launch args (--industry/--plan)
                    // and read once at boot. A settings-table sync alone is invisible to
                    // /api/config, so relaunch the process to apply the new value.
                    const industryChanged = payload.industry_type && freshTenant.industry_type !== tenant.industry_type;
                    const planChanged = payload.plan_id !== undefined && (
                        Number(freshTenant.plan_id || 0) !== Number(tenant.plan_id || 0)
                        || freshTenant.plan_slug !== tenant.plan_slug
                    );
                    if (industryChanged || planChanged) {
                        this._relaunchTenantForConfigChange(freshTenant).catch(err => {
                            console.error(`[Update Tenant] Process relaunch failed: ${err.message}`);
                        });
                    }
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

            if (tenant.process_status === 'starting') {
                return res.status(409).json({
                    error: `Tenant provisioning is still running${tenant.provision_step ? ` (${tenant.provision_step})` : ''}.`
                });
            }

            if (tenant.process_status === 'error' || tenant.provision_error) {
                return res.status(409).json({
                    error: `Provisioning failed${tenant.provision_step ? ` at ${tenant.provision_step}` : ''}. Retry provisioning before starting the tenant.`,
                    provisionError: tenant.provision_error || null
                });
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

            if (tenant.process_status === 'starting') {
                return res.status(409).json({
                    error: `Tenant provisioning is already running${tenant.provision_step ? ` (${tenant.provision_step})` : ''}.`
                });
            }

            const provisioner = new Provisioner();
            const result = await provisioner.provisionTenant(tenant);
            await this._recordToolEnabled(id, 'nexcrm', tenant.plan_id);

            if (!tenant.provisioning_completed_at) {
                await this._triggerTenantCreatedWorkflow(tenant);
            }

            res.json({
                success: true,
                message: 'Tenant provisioned successfully',
                data: result
            });
        } catch (error) {
            console.error('Provision tenant error:', error);
            res.status(500).json({ error: `Failed to provision tenant: ${error.message}` });
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
     * Repair DNS + Pages domain registration for a tenant.
     * Use when tenant shows Cloudflare Error 1014 (CNAME Cross-User Banned).
     * Cause: DNS CNAME exists but Pages project never claimed the custom domain,
     * or Pages domain is stuck in "initializing" state.
     * Action: re-attach Pages custom domains and wait for active, then ensure DNS CNAMEs exist.
     */
    async repairDns(req, res) {
        try {
            const { id } = req.params;
            const tenant = await TenantModel.findById(id);
            if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

            const provisioner = new Provisioner();
            const results = { frontend: null, storefront: null, api: null };

            // Re-attach CRM frontend domain (slug-crm.domain)
            try {
                results.frontend = await provisioner.addCloudflareFrontendRoute(tenant.slug);
            } catch (e) {
                results.frontend = `error: ${e.message}`;
            }

            // Re-attach storefront domain (slug.domain)
            try {
                results.storefront = await provisioner.addStorefrontRoute(tenant.slug);
            } catch (e) {
                results.storefront = `error: ${e.message}`;
            }

            // Re-create API host (slug-crm-api.domain): CNAME -> tunnel + tunnel ingress.
            // Missing here = ERR_NAME_NOT_RESOLVED on the tenant's API calls. Repair-DNS
            // previously only fixed the Pages domains, leaving the API host broken.
            if (tenant.assigned_port && tenant.db_name) {
                try {
                    const server = tenant.server_id
                        ? await ServerModel.findById(tenant.server_id)
                        : await ServerModel.getBestServer();
                    if (server) {
                        results.api = await provisioner.addCloudflareRoute(tenant.slug, tenant.assigned_port, server);
                    } else {
                        results.api = 'error: no server found for tenant';
                    }
                } catch (e) {
                    // "record already exists" is benign — DNS is present, nothing to repair.
                    results.api = /already exists/i.test(e.message) ? 'already-exists' : `error: ${e.message}`;
                }
            }

            const success = results.frontend !== null || results.storefront !== null || results.api !== null;
            res.json({
                success,
                message: success ? 'DNS repair completed' : 'DNS repair attempted but Pages attachment may still be pending',
                data: results
            });
        } catch (error) {
            console.error('Repair DNS error:', error);
            res.status(500).json({ error: error.message || 'DNS repair failed' });
        }
    }

    /**
     * Run database migrations for a specific tenant.
     * Runs core + industry-specific migrations via migrate_tenants.js.
     */
    async runMigration(req, res) {
        try {
            const { id } = req.params;
            const tenant = await TenantModel.findById(id);
            if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

            const nexcrmPath = process.env.NEXCRM_BACKEND_PATH;
            if (!nexcrmPath) return res.status(500).json({ error: 'NEXCRM_BACKEND_PATH not configured' });

            const scriptPath = path.join(nexcrmPath, 'scripts', 'migrate_tenants.js');

            const migrationArgs = [scriptPath, `--tenant=${tenant.slug}`];
            if (tenant.industry_type && tenant.industry_type !== 'general') {
                migrationArgs.push(`--industry=${tenant.industry_type}`);
            }

            await new Promise((resolve, reject) => {
                execFile('node', migrationArgs, {
                    env: { ...process.env },
                    cwd: nexcrmPath,
                    timeout: 120000
                }, (err, stdout, stderr) => {
                    if (err) {
                        console.error(`[Migration] Tenant ${tenant.slug} failed:`, err.message);
                        console.error(stderr);
                        return reject(new Error(stderr || err.message));
                    }
                    console.log(`[Migration] Tenant ${tenant.slug}:`, stdout);
                    resolve(stdout);
                });
            });

            res.json({ success: true, message: `Migration completed for tenant ${tenant.slug}` });
        } catch (error) {
            console.error('Run migration error:', error);
            res.status(500).json({ error: error.message || 'Migration failed' });
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
                let cleanupResults = null;

                try {
                    const provisioner = new Provisioner();
                    cleanupResults = await provisioner.fullCleanup(tenant, {
                        dropDb: dropDatabase
                    });
                } catch (cleanupError) {
                    console.error('[Background Delete] Cleanup partial error:', cleanupError);
                }

                if (!cleanupResults || !cleanupResults.ecosystemUpdated) {
                    console.error(`[Background Delete] Skipping hard delete for tenant ${id} because ecosystem cleanup did not complete successfully`);
                    return;
                }

                try {
                    await TenantModel.hardDelete(id);
                    console.log(`[Background Delete] Tenant ${id} hard deleted from DB`);
                } catch (dbError) {
                    console.error(`[Background Delete] Failed to hard delete tenant ${id} from DB:`, dbError);
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
                const baseDomain = process.env.VITE_APP_BASE_DOMAIN || 'napnix.in';
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
                    <h2 style="color: #4f46e5;">Your Napnix Trial Has Ended</h2>
                    <p>Hi ${tenant.name},</p>
                    <p>We hope you enjoyed using Napnix! Your free trial has concluded and your account has been temporarily suspended to prevent overages.</p>
                    <p>To restore access to your CRM and storefront instantly, please securely complete payment using the Razorpay link below.</p>
                    ${paymentLinkUrl ? `<p style="margin: 30px 0;"><a href="${paymentLinkUrl}" style="padding: 12px 24px; background: #4f46e5; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Pay Securely with Razorpay</a></p>` : ''}
                    <p>If you have any questions, please reach out to our team.</p>
                    <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;" />
                    <p style="font-size: 12px; color: #888;">&copy; ${new Date().getFullYear()} Napnix</p>
                </div>
            `;

            await EmailService.sendEmail({
                to: tenant.email,
                subject: 'Action Required: Your Napnix Trial Has Ended',
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
            const requestedBillingCycle = req.body?.billing_cycle || 'monthly';

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
                const baseDomain = process.env.VITE_APP_BASE_DOMAIN || 'napnix.in';
                const tenantDomain = tenant.custom_domain || `${tenant.slug}-crm.${baseDomain}`;
                const tenantUrl = tenantDomain.startsWith('http') ? tenantDomain : `https://${tenantDomain}`;

                const successUrl = `${tenantUrl}/payment/success`;
                const cancelUrl = `${tenantUrl}/payment/cancelled`;
                const paymentLink = await RazorpayService.createHostedPaymentLink({
                    planId: planId.toString(),
                    billingCycle: requestedBillingCycle,
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
                        billing_cycle: requestedBillingCycle,
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
                    <p>Attached is the secure Razorpay payment link for your Napnix CRM and storefront instance.</p>
                    <p>Please click the button below to review your plan details and complete payment securely.</p>
                    <p style="margin: 30px 0;"><a href="${paymentLinkUrl}" style="padding: 12px 24px; background: #4f46e5; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Review Plan & Pay</a></p>
                    <p>If you have any questions, please reach out to our team.</p>
                    <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;" />
                    <p style="font-size: 12px; color: #888;">&copy; ${new Date().getFullYear()} Napnix</p>
                </div>
            `;

            await EmailService.sendEmail({
                to: tenant.email,
                subject: 'Action Required: Submit Your Napnix Subscription Payment',
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
     * Send a month-specific invoice PDF and payment link
     */
    async sendBillingInvoice(req, res) {
        try {
            const { id } = req.params;
            const {
                amount,
                billing_cycle = 'monthly',
                billing_month,
                due_date
            } = req.body || {};

            const tenant = await TenantModel.findById(id);
            if (!tenant) {
                return res.status(404).json({ error: 'Tenant not found' });
            }

            if (!tenant.plan_id) {
                return res.status(400).json({ error: 'Tenant does not have a plan assigned' });
            }

            const resolved = await RazorpayService.resolvePlan(tenant.plan_id, billing_cycle);
            const paymentAmount = Number(amount || resolved.amount);
            if (!paymentAmount || paymentAmount <= 0) {
                return res.status(400).json({ error: 'A valid billing amount is required' });
            }

            const parsedMonth = billing_month && /^\d{4}-\d{2}$/.test(billing_month)
                ? new Date(`${billing_month}-01T00:00:00`)
                : new Date(new Date().getFullYear(), new Date().getMonth(), 1);

            if (Number.isNaN(parsedMonth.getTime())) {
                return res.status(400).json({ error: 'billing_month must be in YYYY-MM format' });
            }

            const billingMonthValue = `${parsedMonth.getFullYear()}-${String(parsedMonth.getMonth() + 1).padStart(2, '0')}`;
            const billingMonthLabel = parsedMonth.toLocaleDateString('en-IN', {
                month: 'long',
                year: 'numeric'
            });

            const issueDate = new Date();
            const parsedDueDate = due_date
                ? new Date(`${due_date}T00:00:00`)
                : new Date(issueDate.getFullYear(), issueDate.getMonth(), issueDate.getDate() + 7);

            if (Number.isNaN(parsedDueDate.getTime())) {
                return res.status(400).json({ error: 'due_date must be a valid date' });
            }

            const invoiceNumber = `INV-T${tenant.id}-${billingMonthValue.replace('-', '')}-${Date.now().toString().slice(-6)}`;

            const baseDomain = process.env.VITE_APP_BASE_DOMAIN || 'napnix.in';
            const tenantDomain = tenant.custom_domain || `${tenant.slug}-crm.${baseDomain}`;
            const tenantUrl = tenantDomain.startsWith('http') ? tenantDomain : `https://${tenantDomain}`;

            const paymentLink = await RazorpayService.createHostedPaymentLink({
                planId: tenant.plan_id.toString(),
                billingCycle: billing_cycle,
                successUrl: `${tenantUrl}/payment/success`,
                cancelUrl: `${tenantUrl}/payment/cancelled`,
                customer: {
                    name: tenant.name,
                    email: tenant.email,
                    contact: tenant.phone
                },
                metadata: {
                    tenant_id: tenant.id.toString(),
                    plan_id: tenant.plan_id.toString(),
                    plan_slug: resolved.plan.slug,
                    billing_cycle,
                    billing_month: billingMonthValue,
                    invoice_number: invoiceNumber,
                    source: 'tenant_billing_invoice'
                }
            });

            const [subs] = await pool.query(
                'SELECT id FROM subscriptions WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 1',
                [tenant.id]
            );
            const latestSubscriptionId = subs[0]?.id || null;

            await pool.query(`
                INSERT INTO payments (
                    tenant_id, subscription_id, amount, status, invoice_number,
                    currency, payment_method, notes
                )
                VALUES (?, ?, ?, 'pending', ?, 'INR', ?, ?)
            `, [
                tenant.id,
                latestSubscriptionId,
                paymentAmount,
                invoiceNumber,
                'payment_link',
                JSON.stringify({
                    source: 'tenant_billing_invoice',
                    billing_month: billingMonthValue,
                    billing_month_label: billingMonthLabel,
                    payment_link_url: paymentLink.short_url,
                    payment_link_id: paymentLink.id
                })
            ]);

            const template = await DocumentTemplateModel.findBySlug('invoice');
            if (!template) {
                return res.status(404).json({ error: 'Invoice template not found. Please run seed-templates first.' });
            }

            const invoiceDateLabel = issueDate.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
            const dueDateLabel = parsedDueDate.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
            const amountLabel = paymentAmount.toFixed(2);
            const taxRate = '0';
            const taxAmount = '0.00';

            const variables = {
                invoice_number: invoiceNumber,
                invoice_date: invoiceDateLabel,
                due_date: dueDateLabel,
                our_address: 'Napnix, India',
                our_email: process.env.SMTP_FROM_EMAIL || process.env.ZOHO_FROM_EMAIL || process.env.SMTP_USER || 'support@napnix.in',
                contact_name: tenant.owner_name || tenant.name,
                company_name: tenant.business_name || tenant.name,
                client_email: tenant.owner_email || tenant.email,
                item_description: `${resolved.plan.name} subscription for ${billingMonthLabel}`,
                quantity: '1',
                rate: amountLabel,
                amount: amountLabel,
                subtotal: amountLabel,
                tax_rate: taxRate,
                tax_amount: taxAmount,
                total_amount: amountLabel,
                payment_instructions: `Pay securely using the payment link included in this email: ${paymentLink.short_url}`
            };

            const renderedHtml = DocumentTemplateModel.renderTemplate(template.content, variables);
            const pdfBuffer = await pdfService.generateFromHtml(renderedHtml);

            const emailHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice - Napnix</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:32px 16px;">
        <tr>
            <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1);">
                    <tr>
                        <td style="background-color:#4f46e5;padding:32px 40px;text-align:center;">
                            <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:600;">Billing Invoice</h1>
                            <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">${billingMonthLabel} subscription payment request</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:40px;">
                            <p style="color:#1e293b;font-size:16px;line-height:1.6;margin:0 0 20px;">
                                Dear <strong>${tenant.owner_name || tenant.name}</strong>,
                            </p>
                            <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 20px;">
                                Please find attached your invoice for <strong>${billingMonthLabel}</strong>. You can complete the payment securely using the link below.
                            </p>
                            <p style="margin:28px 0;">
                                <a href="${paymentLink.short_url}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;">Open Payment Link</a>
                            </p>
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">
                                <tr>
                                    <td style="padding:20px;">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="padding:6px 0;color:#64748b;font-size:13px;">Invoice Number</td>
                                                <td style="padding:6px 0;font-weight:600;color:#1e293b;text-align:right;font-size:13px;">${invoiceNumber}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding:6px 0;color:#64748b;font-size:13px;">Billing Month</td>
                                                <td style="padding:6px 0;font-weight:600;color:#1e293b;text-align:right;font-size:13px;">${billingMonthLabel}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding:6px 0;color:#64748b;font-size:13px;">Plan</td>
                                                <td style="padding:6px 0;font-weight:600;color:#1e293b;text-align:right;font-size:13px;">${resolved.plan.name}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding:6px 0;color:#64748b;font-size:13px;">Amount Due</td>
                                                <td style="padding:6px 0;font-weight:600;color:#1e293b;text-align:right;font-size:13px;">INR ${amountLabel}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding:6px 0;color:#64748b;font-size:13px;">Due Date</td>
                                                <td style="padding:6px 0;font-weight:600;color:#1e293b;text-align:right;font-size:13px;">${dueDateLabel}</td>
                                            </tr>
                                        </table>
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

            const emailResult = await emailService.sendEmail({
                to: tenant.email,
                subject: `Invoice for ${billingMonthLabel} - Napnix`,
                html: emailHtml,
                attachments: [{
                    filename: `Napnix-Invoice-${tenant.slug}-${billingMonthValue}.pdf`,
                    content: pdfBuffer,
                    contentType: 'application/pdf'
                }]
            });

            if (!emailResult.success) {
                return res.status(500).json({ error: emailResult.error || 'Failed to send billing invoice email' });
            }

            res.json({
                success: true,
                message: `Invoice and payment link sent successfully for ${billingMonthLabel}.`,
                data: {
                    invoice_number: invoiceNumber,
                    billing_month: billingMonthValue,
                    payment_link: paymentLink.short_url
                }
            });
        } catch (error) {
            console.error('Send billing invoice error:', error);
            res.status(500).json({ error: 'Failed to send billing invoice' });
        }
    }

    /**
     * Manually mark a tenant as paid and activate access
     */
    async markPaid(req, res) {
        try {
            const { id } = req.params;
            const {
                amount,
                billing_cycle = 'monthly',
                payment_method = 'manual',
                notes = null
            } = req.body || {};

            const tenant = await TenantModel.findById(id);
            if (!tenant) {
                return res.status(404).json({ error: 'Tenant not found' });
            }

            if (!tenant.plan_id) {
                return res.status(400).json({ error: 'Tenant does not have a plan assigned' });
            }

            const resolved = await RazorpayService.resolvePlan(tenant.plan_id, billing_cycle);
            const paymentAmount = Number(amount || resolved.amount);

            if (!paymentAmount || paymentAmount <= 0) {
                return res.status(400).json({ error: 'A valid payment amount is required' });
            }

            const subscriptionId = await RazorpayService.ensureSubscriptionRecord({
                tenantId: tenant.id,
                planId: resolved.plan.id,
                billingCycle: resolved.billingCycle
            });

            const paymentId = await RazorpayService.recordPayment({
                tenant_id: tenant.id,
                subscription_id: subscriptionId,
                amount: paymentAmount,
                currency: 'INR',
                status: 'success',
                payment_method,
                notes: {
                    ...(notes && typeof notes === 'object' ? notes : {}),
                    source: 'admin_manual_payment',
                    plan_id: resolved.plan.id,
                    plan_slug: resolved.plan.slug,
                    billing_cycle: resolved.billingCycle,
                    recorded_by_user_id: req.user?.id || null
                }
            });

            await TenantModel.update(tenant.id, {
                status: 'active',
                plan_id: resolved.plan.id
            });

            const refreshedTenant = await TenantModel.findById(tenant.id);
            await this._startTenantIfProvisioned(refreshedTenant);

            const [subscriptions] = await pool.query(`
                SELECT s.*, p.name as plan_name
                FROM subscriptions s
                LEFT JOIN plans p ON p.id = s.plan_id
                WHERE s.id = ?
                LIMIT 1
            `, [subscriptionId]);

            const [payments] = await pool.query(`
                SELECT *
                FROM payments
                WHERE id = ?
                LIMIT 1
            `, [paymentId]);

            res.json({
                success: true,
                message: 'Tenant marked as paid and activated successfully.',
                data: {
                    tenant: await TenantModel.findById(tenant.id),
                    subscription: subscriptions[0] || null,
                    payment: payments[0] || null
                }
            });
        } catch (error) {
            console.error('Mark paid error:', error);
            res.status(500).json({ error: error.message || 'Failed to mark tenant as paid' });
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
                    const [subscriptions] = await pool.query(
                        'SELECT billing_cycle FROM subscriptions WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 1',
                        [tenant.id]
                    );
                    const billingCycle = subscriptions[0]?.billing_cycle || 'monthly';
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
                business_address: 'Napnix, India',
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
    <title>Service Agreement - Napnix</title>
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
                                        <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:14px;">Napnix</p>
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
                                Thank you for choosing Napnix. Please find attached your Service Agreement for the <strong>${variables.plan_name}</strong> plan.
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
                                Napnix Team
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
                                            &copy; ${new Date().getFullYear()} Napnix Pvt. Ltd. All rights reserved.
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
                subject: 'Service Agreement - Napnix',
                html: emailHtml,
                attachments: [{
                    filename: `Napnix-Agreement-${tenant.slug}.pdf`,
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
