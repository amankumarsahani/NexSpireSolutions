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
    },

    // Note Management
    async getNotes(req, res) {
        try {
            const Note = require('../models/note.model');
            const notes = await Note.findByLeadId(req.params.id);
            res.json({ notes });
        } catch (error) {
            console.error('Get notes error:', error);
            res.status(500).json({ error: 'Failed to fetch notes' });
        }
    },

    async createNote(req, res) {
        try {
            const Note = require('../models/note.model');
            const note = await Note.create({
                leadId: req.params.id,
                authorId: req.user?.id || 1, // Default to user 1 if not authenticated
                ...req.body
            });
            res.status(201).json({ message: 'Note added successfully', note });
        } catch (error) {
            console.error('Create note error:', error);
            res.status(500).json({ error: 'Failed to create note' });
        }
    },

    // Lead Conversion
    async convertToClient(req, res) {
        try {
            const lead = await LeadModel.findById(req.params.id);
            if (!lead) {
                return res.status(404).json({ error: 'Lead not found' });
            }

            const ClientModel = require('../models/client.model');

            // Create client from lead data
            const clientData = {
                companyName: lead.company || lead.contact_name,
                contactName: lead.contact_name,
                email: lead.email,
                phone: lead.phone,
                industry: lead.industry || 'Not specified',
                status: 'active'
            };

            const clientId = await ClientModel.create(clientData);

            // Update lead status to converted
            await LeadModel.update(req.params.id, { status: 'converted' });

            const client = await ClientModel.findById(clientId);
            res.json({
                message: 'Lead converted to client successfully',
                client,
                leadId: req.params.id
            });
        } catch (error) {
            console.error('Convert lead error:', error);
            res.status(500).json({ error: 'Failed to convert lead to client' });
        }
    },

    // Update Lead Score
    async updateScore(req, res) {
        try {
            const { score } = req.body;
            if (score === undefined || score < 0 || score > 100) {
                return res.status(400).json({ error: 'Score must be between 0 and 100' });
            }

            const lead = await LeadModel.findById(req.params.id);
            if (!lead) {
                return res.status(404).json({ error: 'Lead not found' });
            }

            await LeadModel.update(req.params.id, { score });
            const updated = await LeadModel.findById(req.params.id);

            res.json({ message: 'Lead score updated successfully', lead: updated });
        } catch (error) {
            console.error('Update lead score error:', error);
            res.status(500).json({ error: 'Failed to update lead score' });
        }
    }
};

module.exports = LeadController;
