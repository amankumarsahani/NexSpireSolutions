const PlanModel = require('../models/plan.model');

class PlanController {
    /**
     * Get all plans
     */
    async getAllPlans(req, res) {
        try {
            const includeInactive = req.query.all === 'true';
            const plans = await PlanModel.findAll(includeInactive);

            res.json({
                success: true,
                data: plans
            });
        } catch (error) {
            console.error('Get plans error:', error);
            res.status(500).json({ error: 'Failed to fetch plans' });
        }
    }

    /**
     * Get plan by ID
     */
    async getPlan(req, res) {
        try {
            const { id } = req.params;
            const plan = await PlanModel.findById(id);

            if (!plan) {
                return res.status(404).json({ error: 'Plan not found' });
            }

            res.json({
                success: true,
                data: plan
            });
        } catch (error) {
            console.error('Get plan error:', error);
            res.status(500).json({ error: 'Failed to fetch plan' });
        }
    }

    /**
     * Create new plan (admin only)
     */
    async createPlan(req, res) {
        try {
            const {
                name, slug, description, price_monthly, price_yearly,
                max_users, max_leads, max_clients, max_projects,
                max_email_templates, max_document_templates, features
            } = req.body;

            if (!name || !slug || price_monthly === undefined) {
                return res.status(400).json({
                    error: 'Name, slug, and price_monthly are required'
                });
            }

            const planId = await PlanModel.create({
                name, slug, description, price_monthly, price_yearly,
                max_users, max_leads, max_clients, max_projects,
                max_email_templates, max_document_templates, features
            });

            const plan = await PlanModel.findById(planId);

            res.status(201).json({
                success: true,
                message: 'Plan created successfully',
                data: plan
            });
        } catch (error) {
            console.error('Create plan error:', error);
            res.status(500).json({ error: 'Failed to create plan' });
        }
    }

    /**
     * Update plan
     */
    async updatePlan(req, res) {
        try {
            const { id } = req.params;

            const plan = await PlanModel.findById(id);
            if (!plan) {
                return res.status(404).json({ error: 'Plan not found' });
            }

            const updated = await PlanModel.update(id, req.body);

            res.json({
                success: true,
                message: 'Plan updated successfully',
                data: updated
            });
        } catch (error) {
            console.error('Update plan error:', error);
            res.status(500).json({ error: 'Failed to update plan' });
        }
    }

    /**
     * Get plan usage stats
     */
    async getStats(req, res) {
        try {
            const stats = await PlanModel.getUsageStats();

            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            console.error('Get plan stats error:', error);
            res.status(500).json({ error: 'Failed to fetch stats' });
        }
    }
}

module.exports = new PlanController();
