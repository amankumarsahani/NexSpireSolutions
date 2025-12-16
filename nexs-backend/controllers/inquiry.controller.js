const InquiryModel = require('../models/inquiry.model');
const emailService = require('../services/email.service');
const AssignmentService = require('../services/assignment.service');

class InquiryController {
    // Get all inquiries (filtered by role)
    async getAllInquiries(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 50;
            const userRole = req.user?.role;
            const userId = req.user?.id;

            let inquiries;

            // Sales operators only see their assigned inquiries
            if (userRole === 'sales_operator') {
                inquiries = await InquiryModel.findByAssignee(userId, page, limit);
            } else {
                // Admin sees all
                inquiries = await InquiryModel.findAll(page, limit);
            }

            res.json({
                success: true,
                data: inquiries,
                page,
                limit
            });
        } catch (error) {
            console.error('Get inquiries error:', error);
            res.status(500).json({
                error: 'Failed to fetch inquiries'
            });
        }
    }

    // Get inquiry by ID
    async getInquiryById(req, res) {
        try {
            const { id } = req.params;
            const inquiry = await InquiryModel.findById(id);

            if (!inquiry) {
                return res.status(404).json({
                    error: 'Inquiry not found'
                });
            }

            res.json({
                success: true,
                data: inquiry
            });
        } catch (error) {
            console.error('Get inquiry error:', error);
            res.status(500).json({
                error: 'Failed to fetch inquiry'
            });
        }
    }

    // Create inquiry (public endpoint for contact form)
    async createInquiry(req, res) {
        try {
            const { name, email, phone, company, message } = req.body;

            // Validation
            if (!name || !email || !message) {
                return res.status(400).json({
                    error: 'Name, email, and message are required'
                });
            }

            // Get next assignee using round-robin
            const assignedTo = await AssignmentService.getNextAssignee('inquiry');

            const inquiryId = await InquiryModel.create({
                name,
                email,
                phone,
                company,
                message,
                assignedTo
            });

            // Send email notification asynchronously (don't block response)
            emailService.sendInquiryNotification({
                name, email, phone, company, message, inquiryId
            }).catch(err => console.error('Email notification failed:', err));

            res.status(201).json({
                success: true,
                message: 'Inquiry submitted successfully',
                inquiryId,
                assignedTo
            });
        } catch (error) {
            console.error('Create inquiry error:', error);
            res.status(500).json({
                error: 'Failed to submit inquiry'
            });
        }
    }

    // Update inquiry status
    async updateInquiryStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            // Validation
            const validStatuses = ['new', 'contacted', 'resolved'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    error: 'Invalid status. Must be: new, contacted, or resolved'
                });
            }

            const affected = await InquiryModel.updateStatus(id, status);

            if (affected === 0) {
                return res.status(404).json({
                    error: 'Inquiry not found'
                });
            }

            res.json({
                success: true,
                message: 'Inquiry status updated successfully'
            });
        } catch (error) {
            console.error('Update inquiry error:', error);
            res.status(500).json({
                error: 'Failed to update inquiry'
            });
        }
    }

    // Delete inquiry
    async deleteInquiry(req, res) {
        try {
            const { id } = req.params;
            const affected = await InquiryModel.delete(id);

            if (affected === 0) {
                return res.status(404).json({
                    error: 'Inquiry not found'
                });
            }

            res.json({
                success: true,
                message: 'Inquiry deleted successfully'
            });
        } catch (error) {
            console.error('Delete inquiry error:', error);
            res.status(500).json({
                error: 'Failed to delete inquiry'
            });
        }
    }

    // Get stats
    async getStats(req, res) {
        try {
            const userRole = req.user?.role;
            const userId = req.user?.id;

            let stats;
            // Sales operators get only their assigned inquiry stats
            if (userRole === 'sales_operator' && userId) {
                stats = await InquiryModel.getStatsByUser(userId);
            } else {
                stats = await InquiryModel.getStats();
            }

            res.json({ success: true, data: stats });
        } catch (error) {
            console.error('Get stats error:', error);
            res.status(500).json({
                error: 'Failed to fetch stats'
            });
        }
    }

    // Convert inquiry to lead
    async convertToLead(req, res) {
        try {
            const { id } = req.params;
            const { estimatedValue, notes } = req.body;

            // Get the inquiry
            const inquiry = await InquiryModel.findById(id);
            if (!inquiry) {
                return res.status(404).json({
                    error: 'Inquiry not found'
                });
            }

            // Check if already converted
            if (inquiry.status === 'converted') {
                return res.status(400).json({
                    error: 'Inquiry has already been converted to a lead'
                });
            }

            // Create lead from inquiry data
            const LeadModel = require('../models/lead.model');
            const leadData = {
                contactName: inquiry.name,
                email: inquiry.email,
                phone: inquiry.phone || null,
                company: inquiry.company || null,
                leadSource: 'Website Inquiry',
                status: 'new',
                estimatedValue: estimatedValue || null,
                notes: notes || inquiry.message || null,
                score: 50 // Default score for converted inquiries
            };

            const leadId = await LeadModel.create(leadData);

            // Update inquiry status to converted
            await InquiryModel.updateStatus(id, 'converted');

            // Get the created lead
            const lead = await LeadModel.findById(leadId);

            res.json({
                success: true,
                message: 'Inquiry converted to lead successfully',
                lead,
                inquiryId: id
            });
        } catch (error) {
            console.error('Convert to lead error:', error);
            res.status(500).json({
                error: 'Failed to convert inquiry to lead'
            });
        }
    }

    // Assign inquiry to a user (admin only)
    async assignInquiry(req, res) {
        try {
            const { id } = req.params;
            const { assignedTo } = req.body;

            if (!assignedTo) {
                return res.status(400).json({
                    error: 'assignedTo is required'
                });
            }

            const inquiry = await InquiryModel.findById(id);
            if (!inquiry) {
                return res.status(404).json({
                    error: 'Inquiry not found'
                });
            }

            await InquiryModel.updateAssignee(id, assignedTo);

            res.json({
                success: true,
                message: 'Inquiry assigned successfully'
            });
        } catch (error) {
            console.error('Assign inquiry error:', error);
            res.status(500).json({
                error: 'Failed to assign inquiry'
            });
        }
    }

    // Get assignable users list
    async getAssignableUsers(req, res) {
        try {
            const users = await AssignmentService.getAssignableUsers();
            res.json({
                success: true,
                data: users
            });
        } catch (error) {
            console.error('Get assignable users error:', error);
            res.status(500).json({
                error: 'Failed to fetch assignable users'
            });
        }
    }
}

module.exports = new InquiryController();

