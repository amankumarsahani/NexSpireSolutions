/**
 * Workflow Routes
 * API endpoints for workflow CRUD and execution
 */

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { auth, isAdmin } = require('../middleware/auth');
const workflowEngine = require('../services/workflowEngine');

// All routes require authentication
router.use(auth);

// ============================================
// WORKFLOW CRUD
// ============================================

// Get all workflows
router.get('/', async (req, res) => {
    try {
        const [workflows] = await db.query(
            `SELECT w.*, 
             (SELECT COUNT(*) FROM workflow_executions WHERE workflow_id = w.id) as execution_count,
             (SELECT COUNT(*) FROM workflow_executions WHERE workflow_id = w.id AND status = 'completed') as success_count
             FROM workflows w
             ORDER BY w.created_at DESC`
        );
        res.json({ success: true, data: workflows });
    } catch (error) {
        console.error('Get workflows error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch workflows' });
    }
});

// Get single workflow with nodes and connections
router.get('/:id', async (req, res) => {
    try {
        const [[workflow]] = await db.query('SELECT * FROM workflows WHERE id = ?', [req.params.id]);

        if (!workflow) {
            return res.status(404).json({ success: false, error: 'Workflow not found' });
        }

        const [nodes] = await db.query('SELECT * FROM workflow_nodes WHERE workflow_id = ?', [req.params.id]);
        const [connections] = await db.query(
            `SELECT c.*, sn.node_uid as source, tn.node_uid as target 
             FROM workflow_connections c
             JOIN workflow_nodes sn ON c.source_node_id = sn.id
             JOIN workflow_nodes tn ON c.target_node_id = tn.id
             WHERE c.workflow_id = ?`,
            [req.params.id]
        );

        res.json({
            success: true,
            data: {
                ...workflow,
                nodes,
                connections
            }
        });
    } catch (error) {
        console.error('Get workflow error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch workflow' });
    }
});

// Create workflow
router.post('/', isAdmin, async (req, res) => {
    try {
        const { name, description, trigger_type, trigger_config, is_active, nodes, connections } = req.body;

        if (!name || !trigger_type) {
            return res.status(400).json({ success: false, error: 'Name and trigger type are required' });
        }

        // Create workflow
        const [result] = await db.query(
            `INSERT INTO workflows (name, description, trigger_type, trigger_config, is_active, created_by)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                name,
                description,
                trigger_type,
                JSON.stringify(trigger_config || {}),
                is_active ? 1 : 0,
                req.user?.id
            ]
        );

        const workflowId = result.insertId;

        // Create nodes
        const nodeIdMap = new Map(); // Map frontend node_uid to DB id
        if (nodes && nodes.length > 0) {
            for (const node of nodes) {
                const [nodeResult] = await db.query(
                    `INSERT INTO workflow_nodes 
                     (workflow_id, node_uid, node_type, action_type, label, config, position_x, position_y)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        workflowId,
                        node.id || node.node_uid,
                        node.node_type || node.type,
                        node.action_type || node.data?.actionType || node.trigger_type || node.data?.triggerType,
                        node.label || node.data?.label,
                        JSON.stringify(node.config || node.data?.config || {}),
                        node.position_x !== undefined ? node.position_x : (node.position?.x || 0),
                        node.position_y !== undefined ? node.position_y : (node.position?.y || 0)
                    ]
                );
                nodeIdMap.set(node.id || node.node_uid, nodeResult.insertId);
            }
        }

        // Create connections
        if (connections && connections.length > 0) {
            for (const conn of connections) {
                const sourceId = nodeIdMap.get(conn.source);
                const targetId = nodeIdMap.get(conn.target);

                if (sourceId && targetId) {
                    await db.query(
                        `INSERT INTO workflow_connections 
                         (workflow_id, source_node_id, target_node_id, source_handle)
                         VALUES (?, ?, ?, ?)`,
                        [workflowId, sourceId, targetId, conn.source_handle || 'default']
                    );
                }
            }
        }

        const [[newWorkflow]] = await db.query('SELECT * FROM workflows WHERE id = ?', [workflowId]);
        res.status(201).json({
            success: true,
            data: newWorkflow,
            workflowId: workflowId // Added for frontend compatibility
        });
    } catch (error) {
        console.error('Create workflow error:', error);
        res.status(500).json({ success: false, error: 'Failed to create workflow' });
    }
});

// Update workflow
router.put('/:id', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const workflowId = parseInt(id);

        if (isNaN(workflowId) || id === 'undefined') {
            return res.status(400).json({ success: false, error: 'Invalid workflow ID provided: ' + id });
        }

        let { name, description, trigger_type, trigger_config, is_active, nodes, connections, canvas_data } = req.body;

        // Support for frontend canvas_data structure
        if (canvas_data && !nodes) {
            nodes = canvas_data.nodes;
            connections = canvas_data.edges; // connections = edges in frontend
        }

        // Extract trigger config from trigger node if nodes provided
        if (nodes && nodes.length > 0 && !trigger_config) {
            const triggerNode = nodes.find(n =>
                (n.node_type === 'trigger' || n.type === 'trigger')
            );
            if (triggerNode) {
                trigger_config = triggerNode.config || triggerNode.data?.config || {};
            }
        }

        // Update workflow metadata (using COALESCE to avoid overwriting with null)
        await db.query(
            `UPDATE workflows SET 
                name = COALESCE(?, name), 
                description = COALESCE(?, description), 
                trigger_type = COALESCE(?, trigger_type), 
                trigger_config = COALESCE(?, trigger_config), 
                is_active = COALESCE(?, is_active)
             WHERE id = ?`,
            [
                name || null,
                description || null,
                trigger_type || null,
                trigger_config ? JSON.stringify(trigger_config) : null,
                is_active !== undefined ? (is_active ? 1 : 0) : null,
                id
            ]
        );

        // If nodes provided, recreate them
        if (nodes !== undefined) {
            // Delete existing nodes and connections
            await db.query('DELETE FROM workflow_nodes WHERE workflow_id = ?', [id]);

            // Recreate nodes
            const nodeIdMap = new Map();
            for (const node of nodes) {
                const [nodeResult] = await db.query(
                    `INSERT INTO workflow_nodes 
                     (workflow_id, node_uid, node_type, action_type, label, config, position_x, position_y)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        id,
                        node.id || node.node_uid,
                        node.node_type || node.type,
                        node.action_type || node.data?.actionType || node.trigger_type || node.data?.triggerType,
                        node.label || node.data?.label,
                        JSON.stringify(node.config || node.data?.config || {}),
                        node.position_x !== undefined ? node.position_x : (node.position?.x || 0),
                        node.position_y !== undefined ? node.position_y : (node.position?.y || 0)
                    ]
                );
                nodeIdMap.set(node.id || node.node_uid, nodeResult.insertId);
            }

            // Recreate connections
            if (connections && connections.length > 0) {
                for (const conn of connections) {
                    const sourceId = nodeIdMap.get(conn.source);
                    const targetId = nodeIdMap.get(conn.target);

                    if (sourceId && targetId) {
                        await db.query(
                            `INSERT INTO workflow_connections 
                             (workflow_id, source_node_id, target_node_id, source_handle)
                             VALUES (?, ?, ?, ?)`,
                            [id, sourceId, targetId, conn.source_handle || 'default']
                        );
                    }
                }
            }
        }

        const [[updated]] = await db.query('SELECT * FROM workflows WHERE id = ?', [id]);
        res.json({ success: true, data: updated });
    } catch (error) {
        console.error('Update workflow error:', error);
        res.status(500).json({ success: false, error: 'Failed to update workflow' });
    }
});

// Toggle workflow active status
router.patch('/:id/toggle', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('UPDATE workflows SET is_active = NOT is_active WHERE id = ?', [id]);
        const [[workflow]] = await db.query('SELECT * FROM workflows WHERE id = ?', [id]);
        res.json({ success: true, data: workflow });
    } catch (error) {
        console.error('Toggle workflow error:', error);
        res.status(500).json({ success: false, error: 'Failed to toggle workflow' });
    }
});

// Delete workflow
router.delete('/:id', isAdmin, async (req, res) => {
    try {
        await db.query('DELETE FROM workflows WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Workflow deleted' });
    } catch (error) {
        console.error('Delete workflow error:', error);
        res.status(500).json({ success: false, error: 'Failed to delete workflow' });
    }
});

// ============================================
// EXECUTION
// ============================================

// Test/manually trigger workflow
router.post('/:id/test', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const testData = req.body.testData || { id: 1, email: 'test@example.com', contact_name: 'Test User' };

        const [[workflow]] = await db.query('SELECT * FROM workflows WHERE id = ?', [id]);
        if (!workflow) {
            return res.status(404).json({ success: false, error: 'Workflow not found' });
        }

        // Trigger the workflow
        await workflowEngine.trigger(workflow.trigger_type, 'test', 0, testData);

        res.json({ success: true, message: 'Workflow triggered for testing' });
    } catch (error) {
        console.error('Test workflow error:', error);
        res.status(500).json({ success: false, error: 'Failed to test workflow' });
    }
});

// Get execution history
router.get('/:id/executions', async (req, res) => {
    try {
        const { id } = req.params;
        const { limit = 20, page = 1 } = req.query;
        const offset = (page - 1) * limit;

        const [executions] = await db.query(
            `SELECT * FROM workflow_executions 
             WHERE workflow_id = ?
             ORDER BY started_at DESC
             LIMIT ? OFFSET ?`,
            [id, parseInt(limit), offset]
        );

        const [[{ total }]] = await db.query(
            'SELECT COUNT(*) as total FROM workflow_executions WHERE workflow_id = ?',
            [id]
        );

        res.json({
            success: true,
            data: executions,
            pagination: { total, page: parseInt(page), limit: parseInt(limit) }
        });
    } catch (error) {
        console.error('Get executions error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch executions' });
    }
});

// Get execution logs
router.get('/executions/:executionId/logs', async (req, res) => {
    try {
        const { executionId } = req.params;

        const [[execution]] = await db.query(
            'SELECT * FROM workflow_executions WHERE id = ?',
            [executionId]
        );

        const [logs] = await db.query(
            `SELECT l.*, n.node_type, n.action_type, n.label
             FROM workflow_execution_logs l
             JOIN workflow_nodes n ON l.node_id = n.id
             WHERE l.execution_id = ?
             ORDER BY l.started_at ASC`,
            [executionId]
        );

        res.json({ success: true, data: { execution, logs } });
    } catch (error) {
        console.error('Get execution logs error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch execution logs' });
    }
});

// ============================================
// NODE TYPES REFERENCE
// ============================================

// Get available node types
router.get('/meta/node-types', (req, res) => {
    res.json({
        success: true,
        data: {
            triggers: [
                { type: 'lead_created', label: 'Lead Created', description: 'When a new lead is created' },
                { type: 'client_created', label: 'Client Created', description: 'When a new client is created' },
                { type: 'lead_status_changed', label: 'Lead Status Changed', description: 'When lead status changes' },
                { type: 'scheduled', label: 'Scheduled', description: 'Run on a schedule' },
                { type: 'manual', label: 'Manual', description: 'Triggered manually' }
            ],
            actions: [
                { type: 'send_email', label: 'Send Email', description: 'Send an email', icon: 'mail' },
                { type: 'update_lead', label: 'Update Lead', description: 'Update lead fields', icon: 'edit' },
                { type: 'update_client', label: 'Update Client', description: 'Update client fields', icon: 'edit' },
                { type: 'create_task', label: 'Create Task', description: 'Create a new task', icon: 'check-square' },
                { type: 'assign_user', label: 'Assign User', description: 'Assign to a user', icon: 'user' },
                { type: 'add_note', label: 'Add Note', description: 'Add a note', icon: 'file-text' },
                { type: 'webhook', label: 'Webhook', description: 'Call external URL', icon: 'globe' }
            ],
            conditions: [
                { type: 'condition', label: 'If/Else', description: 'Branch based on condition', icon: 'git-branch' }
            ],
            delays: [
                { type: 'delay', label: 'Wait', description: 'Wait for a period', icon: 'clock' }
            ]
        }
    });
});

module.exports = router;
