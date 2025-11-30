const LeadModel = require('../models/lead.model');

const LeadController = {
    async getAll(req, res) {
        try {
            const leads = await LeadModel.findAll(req.query);
            res.json({ leads });
        } catch (error) {
            console.error('Get leads error:', error);
            res.status(500).json({ error: 'Failed to fetch leads' });
        }
    },

    async getById(req, res) {
        try {
            const lead = await LeadModel.findById(req.params.id);
            if (!lead) {
                return res.status(404).json({ error: 'Lead not found' });
            }
            res.json({ lead });
        } catch (error) {
            console.error('Get lead error:', error);
            res.status(500).json({ error: 'Failed to fetch lead' });
        }
    },

    async create(req, res) {
        try {
            if (!req.body.contactName) {
                return res.status(400).json({ error: 'Contact name is required' });
            }

            const leadId = await LeadModel.create(req.body);
            const lead = await LeadModel.findById(leadId);

            res.status(201).json({ message: 'Lead created successfully', lead });
        } catch (error) {
            console.error('Create lead error:', error);
            res.status(500).json({ error: 'Failed to create lead' });
        }
    },

    async update(req, res) {
        try {
            const lead = await LeadModel.findById(req.params.id);
            if (!lead) {
                return res.status(404).json({ error: 'Lead not found' });
            }

            const updated = await LeadModel.update(req.params.id, req.body);
            res.json({ message: 'Lead updated successfully', lead: updated });
        } catch (error) {
            console.error('Update lead error:', error);
            res.status(500).json({ error: 'Failed to update lead' });
        }
    },

    async delete(req, res) {
        try {
            const lead = await LeadModel.findById(req.params.id);
            if (!lead) {
                return res.status(404).json({ error: 'Lead not found' });
            }

            await LeadModel.delete(req.params.id);
            res.json({ message: 'Lead deleted successfully' });
        } catch (error) {
            console.error('Delete lead error:', error);
            res.status(500).json({ error: 'Failed to delete lead' });
        }
    },

    async addComment(req, res) {
        try {
            const { comment } = req.body;
            if (!comment) {
                return res.status(400).json({ error: 'Comment is required' });
            }
            const newComment = await LeadModel.addComment(req.params.id, comment);
            res.status(201).json({ message: 'Comment added', comment: newComment });
        } catch (error) {
            console.error('Add comment error:', error);
            res.status(500).json({ error: 'Failed to add comment' });
        }
    },

    async getComments(req, res) {
        try {
            const comments = await LeadModel.getComments(req.params.id);
            res.json({ comments });
        } catch (error) {
            console.error('Get comments error:', error);
            res.status(500).json({ error: 'Failed to fetch comments' });
        }
    },

    async getStats(req, res) {
        try {
            const stats = await LeadModel.getStats();
            res.json({ stats });
        } catch (error) {
            console.error('Get stats error:', error);
            res.status(500).json({ error: 'Failed to fetch statistics' });
        }
    }
};

module.exports = LeadController;
