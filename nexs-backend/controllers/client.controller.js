const ClientModel = require('../models/client.model');
const ActivityModel = require('../models/activity.model');
const { pool } = require('../config/database');
const autoEnrollService = require('../services/autoEnrollService');
const workflowEngine = require('../services/workflowEngine');

const ClientController = {
    // Get all clients
    async getAll(req, res) {
        try {
            const filters = {
                status: req.query.status,
                industry: req.query.industry,
                search: req.query.search,
                sortBy: req.query.sortBy,
                sortOrder: req.query.sortOrder,
                limit: req.query.limit || 50,
                page: req.query.page || 1
            };

            const clients = await ClientModel.findAll(filters);
            const total = await ClientModel.count(filters);

            res.json({
                clients,
                pagination: {
                    total,
                    page: parseInt(filters.page),
                    limit: parseInt(filters.limit),
                    pages: Math.ceil(total / filters.limit)
                }
            });
        } catch (error) {
            console.error('Get clients error:', error);
            res.status(500).json({ error: 'Failed to fetch clients' });
        }
    },

    // Get client by ID
    async getById(req, res) {
        try {
            const client = await ClientModel.findById(req.params.id);

            if (!client) {
                return res.status(404).json({ error: 'Client not found' });
            }

            res.json({ client });
        } catch (error) {
            console.error('Get client error:', error);
            res.status(500).json({ error: 'Failed to fetch client' });
        }
    },

    // Create new client
    async create(req, res) {
        try {
            const clientData = {
                ...req.body,
                createdBy: req.user.id
            };

            // Validation
            if (!clientData.companyName) {
                return res.status(400).json({ error: 'Company name is required' });
            }

            const clientId = await ClientModel.create(clientData);
            const client = await ClientModel.findById(clientId);

            // Auto-enroll new client into active campaigns (async, don't wait)
            if (client.email) {
                autoEnrollService.enrollClient(clientId, client.email, client.contactName, client.companyName).catch(err => {
                    console.error('Auto-enroll failed:', err);
                });
            }

            // Trigger workflow automations for client_created
            workflowEngine.trigger('client_created', 'client', clientId, {
                ...client,
                entity_type: 'client'
            }).catch(err => {
                console.error('Workflow trigger failed:', err);
            });

            res.status(201).json({
                message: 'Client created successfully',
                client
            });
        } catch (error) {
            console.error('Create client error:', error);
            res.status(500).json({ error: 'Failed to create client' });
        }
    },

    // Update client
    async update(req, res) {
        try {
            const client = await ClientModel.findById(req.params.id);

            if (!client) {
                return res.status(404).json({ error: 'Client not found' });
            }

            const oldStatus = client.status;
            const newStatus = req.body.status;

            const updatedClient = await ClientModel.update(req.params.id, req.body);

            // Trigger workflow automations for client_status_changed
            if (newStatus && oldStatus !== newStatus) {
                workflowEngine.trigger('client_status_changed', 'client', parseInt(req.params.id), {
                    ...updatedClient,
                    entity_type: 'client',
                    old_status: oldStatus,
                    new_status: newStatus
                }).catch(err => {
                    console.error('Workflow trigger failed:', err);
                });
            }

            res.json({
                message: 'Client updated successfully',
                client: updatedClient
            });
        } catch (error) {
            console.error('Update client error:', error);
            res.status(500).json({ error: 'Failed to update client' });
        }
    },

    // Delete client
    async delete(req, res) {
        try {
            const client = await ClientModel.findById(req.params.id);

            if (!client) {
                return res.status(404).json({ error: 'Client not found' });
            }

            await ClientModel.delete(req.params.id);

            res.json({ message: 'Client deleted successfully' });
        } catch (error) {
            console.error('Delete client error:', error);
            res.status(500).json({ error: 'Failed to delete client' });
        }
    },

    // Get statistics
    async getStats(req, res) {
        try {
            const stats = await ClientModel.getStats();
            res.json({ stats });
        } catch (error) {
            console.error('Get stats error:', error);
            res.status(500).json({ error: 'Failed to fetch statistics' });
        }
    },

    // Get client activities
    async getActivities(req, res) {
        try {
            const activities = await ActivityModel.getByEntity('client', req.params.id);
            res.json({ success: true, activities: activities || [] });
        } catch (error) {
            console.error('Get client activities error:', error);
            res.status(500).json({ error: 'Failed to fetch activities' });
        }
    },

    // Get client payments
    async getPayments(req, res) {
        try {
            const [payments] = await pool.query(
                `SELECT * FROM payments WHERE client_id = ? ORDER BY created_at DESC`,
                [req.params.id]
            );
            res.json({ success: true, payments: payments || [] });
        } catch (error) {
            console.error('Get client payments error:', error);
            res.status(500).json({ error: 'Failed to fetch payments' });
        }
    }
};

module.exports = ClientController;
