const ClientModel = require('../models/client.model');

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

            const projects = await ClientModel.getProjectsByClientId(req.params.id);
            const stats = await ClientModel.getRevenueStatsByClientId(req.params.id);

            res.json({
                client,
                projects,
                stats
            });
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

            const updatedClient = await ClientModel.update(req.params.id, req.body);

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
    }
};

module.exports = ClientController;
