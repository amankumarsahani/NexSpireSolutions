const InquiryModel = require('../models/inquiry.model');

class InquiryController {
    // Get all inquiries
    async getAllInquiries(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 50;

            const inquiries = await InquiryModel.findAll(page, limit);

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

            const inquiryId = await InquiryModel.create({
                name,
                email,
                phone,
                company,
                message
            });

            res.status(201).json({
                success: true,
                message: 'Inquiry submitted successfully',
                inquiryId
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
            const stats = await InquiryModel.getStats();
            res.json(stats);
        } catch (error) {
            console.error('Get stats error:', error);
            res.status(500).json({
                error: 'Failed to fetch stats'
            });
        }
    }
}

module.exports = new InquiryController();
