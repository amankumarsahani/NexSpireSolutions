const express = require('express');
const router = express.Router();
const { auth, isAdmin } = require('../middleware/auth');
const { pool } = require('../config/database');
const axios = require('axios');

router.use(auth);
router.use(isAdmin);

router.get('/', async (req, res) => {
    try {
        const [tools] = await pool.query('SELECT * FROM tools ORDER BY created_at ASC');
        res.json({ success: true, data: tools });
    } catch (error) {
        if (error.code === 'ER_NO_SUCH_TABLE') return res.json({ success: true, data: [] });
        console.error('Get tools error:', error);
        res.status(500).json({ error: 'Failed to fetch tools.' });
    }
});

router.get('/:toolId/plans', async (req, res) => {
    try {
        const [plans] = await pool.query('SELECT * FROM tool_plans WHERE tool_id = ? AND status = ? ORDER BY sort_order', [req.params.toolId, 'active']);
        res.json({ success: true, data: plans });
    } catch (error) {
        if (error.code === 'ER_NO_SUCH_TABLE') return res.json({ success: true, data: [] });
        console.error('Get tool plans error:', error);
        res.status(500).json({ error: 'Failed to fetch plans.' });
    }
});

router.get('/tenant/:tenantId', async (req, res) => {
    try {
        const [tenantTools] = await pool.query(`
            SELECT tt.*, t.slug as tool_slug, t.name as tool_name, t.icon as tool_icon,
                   t.description as tool_description, t.version as tool_version, t.status as tool_status,
                   tp.name as plan_name, tp.slug as plan_slug, tp.limits as plan_limits, tp.features as plan_features
            FROM tenant_tools tt
            INNER JOIN tools t ON t.id = tt.tool_id
            LEFT JOIN tool_plans tp ON tp.id = tt.tool_plan_id
            WHERE tt.tenant_id = ?
            ORDER BY t.name
        `, [req.params.tenantId]);
        res.json({ success: true, data: tenantTools });
    } catch (error) {
        if (error.code === 'ER_NO_SUCH_TABLE') return res.json({ success: true, data: [] });
        console.error('Get tenant tools error:', error);
        res.status(500).json({ error: 'Failed to fetch tenant tools.' });
    }
});

router.post('/tenant/:tenantId/enable', async (req, res) => {
    try {
        const { tool_id, tool_plan_id, trial_days } = req.body;
        const tenantId = req.params.tenantId;

        if (!tool_id) return res.status(400).json({ error: 'tool_id is required.' });

        const [tools] = await pool.query('SELECT * FROM tools WHERE id = ?', [tool_id]);
        if (!tools.length) return res.status(404).json({ error: 'Tool not found.' });

        const tool = tools[0];
        const trialEndsAt = trial_days ? new Date(Date.now() + trial_days * 86400000) : null;

        await pool.query(`
            INSERT INTO tenant_tools (tenant_id, tool_id, tool_plan_id, status, trial_ends_at, provisioned_at)
            VALUES (?, ?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
                tool_plan_id = VALUES(tool_plan_id),
                status = VALUES(status),
                trial_ends_at = VALUES(trial_ends_at),
                suspended_at = NULL,
                cancelled_at = NULL
        `, [tenantId, tool_id, tool_plan_id || null, trialEndsAt ? 'trial' : 'active', trialEndsAt]);

        if (tool.internal_api_url) {
            let planLimits = null, planFeatures = null;
            if (tool_plan_id) {
                const [plans] = await pool.query('SELECT limits, features FROM tool_plans WHERE id = ?', [tool_plan_id]);
                if (plans.length) { planLimits = plans[0].limits; planFeatures = plans[0].features; }
            }

            try {
                await axios.post(`${tool.internal_api_url}/internal/provision`, {
                    tenant_id: tenantId,
                    plan_id: tool_plan_id,
                    plan_limits: planLimits,
                    plan_features: planFeatures,
                    trial_ends_at: trialEndsAt
                }, { headers: { 'X-API-Key': process.env.NEXMAIL_API_KEY || process.env.PLATFORM_API_KEY || '' }, timeout: 10000 });
            } catch (provisionErr) {
                console.warn(`[Tools] Failed to provision ${tool.slug} for tenant ${tenantId}:`, provisionErr.message);
            }
        }

        res.json({ success: true, message: `${tool.name} enabled for tenant.` });
    } catch (error) {
        console.error('Enable tool error:', error);
        res.status(500).json({ error: 'Failed to enable tool.' });
    }
});

router.post('/tenant/:tenantId/disable', async (req, res) => {
    try {
        const { tool_id } = req.body;
        const tenantId = req.params.tenantId;

        await pool.query(`
            UPDATE tenant_tools SET status = 'suspended', suspended_at = NOW()
            WHERE tenant_id = ? AND tool_id = ?
        `, [tenantId, tool_id]);

        const [tools] = await pool.query('SELECT * FROM tools WHERE id = ?', [tool_id]);
        if (tools.length && tools[0].internal_api_url) {
            try {
                await axios.post(`${tools[0].internal_api_url}/internal/suspend`, {
                    tenant_id: tenantId
                }, { headers: { 'X-API-Key': process.env.NEXMAIL_API_KEY || process.env.PLATFORM_API_KEY || '' }, timeout: 10000 });
            } catch (e) {
                console.warn(`[Tools] Failed to suspend ${tools[0].slug}:`, e.message);
            }
        }

        res.json({ success: true, message: 'Tool disabled.' });
    } catch (error) {
        console.error('Disable tool error:', error);
        res.status(500).json({ error: 'Failed to disable tool.' });
    }
});

router.get('/tenant/:tenantId/:toolSlug/stats', async (req, res) => {
    try {
        const { tenantId, toolSlug } = req.params;
        const [tools] = await pool.query('SELECT * FROM tools WHERE slug = ?', [toolSlug]);
        if (!tools.length) return res.status(404).json({ error: 'Tool not found.' });

        if (tools[0].internal_api_url) {
            try {
                const response = await axios.get(`${tools[0].internal_api_url}/internal/tenant/${tenantId}/stats`, {
                    headers: { 'X-API-Key': process.env.NEXMAIL_API_KEY || process.env.PLATFORM_API_KEY || '' },
                    timeout: 5000
                });
                return res.json(response.data);
            } catch (e) {
                return res.json({ success: true, data: { error: 'Service unavailable' } });
            }
        }

        res.json({ success: true, data: {} });
    } catch (error) {
        console.error('Tool stats error:', error);
        res.status(500).json({ error: 'Failed to fetch stats.' });
    }
});

module.exports = router;
