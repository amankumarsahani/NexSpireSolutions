const TenantModel = require('../models/tenant.model');
const PlanModel = require('../models/plan.model');
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
            const { name, slug, email, phone, industry_type, plan_id } = req.body;

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
                name, slug, email, phone, industry_type, plan_id
            });

            // Provision the tenant (create DB, start process, configure Cloudflare)
            try {
                const provisionResult = await Provisioner.provisionTenant({
                    id: tenantId,
                    name,
                    slug,
                    email,
                    industry_type: industry_type || 'general'
                });

                res.status(201).json({
                    success: true,
                    message: 'Tenant created and provisioned successfully',
                    data: {
                        tenantId,
                        ...provisionResult
                    }
                });
            } catch (provisionError) {
                // Log the error but return partial success
                console.error('Provisioning error:', provisionError);

                res.status(201).json({
                    success: true,
                    message: 'Tenant created but provisioning failed. Please provision manually.',
                    data: { tenantId },
                    provisionError: provisionError.message
                });
            }
        } catch (error) {
            console.error('Create tenant error:', error);
            res.status(500).json({ error: 'Failed to create tenant' });
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

            await Provisioner.startProcess(tenant);
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

            await Provisioner.stopProcess(tenant);
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

            await Provisioner.restartProcess(tenant);
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

            const result = await Provisioner.provisionTenant(tenant);

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
            if (tenant.process_status === 'running') {
                await Provisioner.stopProcess(tenant);
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
}

module.exports = new TenantController();
