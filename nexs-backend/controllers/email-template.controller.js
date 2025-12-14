const EmailTemplateModel = require('../models/email-template.model');
const templateLoader = require('../services/template.loader');

/**
 * Email Template Controller
 * Handles CRUD operations for email templates
 */
class EmailTemplateController {
    /**
     * Get all templates
     */
    async getAllTemplates(req, res) {
        try {
            const { category, active, type } = req.query;
            const options = {};

            if (type) options.type = type;
            if (category) options.category = category;
            if (active !== undefined) options.isActive = active === 'true';

            const templates = await EmailTemplateModel.findAll(options);

            res.json({
                success: true,
                data: templates
            });
        } catch (error) {
            console.error('Get templates error:', error);
            res.status(500).json({
                error: 'Failed to fetch templates'
            });
        }
    }

    /**
     * Get template by ID
     */
    async getTemplateById(req, res) {
        try {
            const { id } = req.params;
            const template = await EmailTemplateModel.findById(id);

            if (!template) {
                return res.status(404).json({
                    error: 'Template not found'
                });
            }

            res.json({
                success: true,
                data: template
            });
        } catch (error) {
            console.error('Get template error:', error);
            res.status(500).json({
                error: 'Failed to fetch template'
            });
        }
    }

    /**
     * Create new template
     */
    async createTemplate(req, res) {
        try {
            const { name, subject, html_content, description, variables, category } = req.body;

            // Validation
            if (!name || !html_content) {
                return res.status(400).json({
                    error: 'Name and HTML content are required'
                });
            }

            // Check for duplicate name
            const existing = await EmailTemplateModel.findByName(name);
            if (existing) {
                return res.status(400).json({
                    error: 'A template with this name already exists'
                });
            }

            const templateId = await EmailTemplateModel.create({
                name,
                subject,
                html_content,
                description,
                variables,
                category
            });

            res.status(201).json({
                success: true,
                message: 'Template created successfully',
                templateId
            });
        } catch (error) {
            console.error('Create template error:', error);
            res.status(500).json({
                error: 'Failed to create template'
            });
        }
    }

    /**
     * Update template
     */
    async updateTemplate(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            const affected = await EmailTemplateModel.update(id, updateData);

            if (affected === 0) {
                return res.status(404).json({
                    error: 'Template not found'
                });
            }

            res.json({
                success: true,
                message: 'Template updated successfully'
            });
        } catch (error) {
            console.error('Update template error:', error);
            res.status(500).json({
                error: 'Failed to update template'
            });
        }
    }

    /**
     * Delete template
     */
    async deleteTemplate(req, res) {
        try {
            const { id } = req.params;
            const affected = await EmailTemplateModel.delete(id);

            if (affected === 0) {
                return res.status(404).json({
                    error: 'Template not found'
                });
            }

            res.json({
                success: true,
                message: 'Template deleted successfully'
            });
        } catch (error) {
            console.error('Delete template error:', error);
            res.status(500).json({
                error: 'Failed to delete template'
            });
        }
    }

    /**
     * Preview template with sample data
     */
    async previewTemplate(req, res) {
        try {
            const { id } = req.params;
            const sampleData = req.body;

            const template = await EmailTemplateModel.findById(id);

            if (!template) {
                return res.status(404).json({
                    error: 'Template not found'
                });
            }

            // Use template loader to render with base layout
            const renderedHtml = templateLoader.substituteVariables(
                template.html_content,
                sampleData
            );

            // Wrap in base template if available
            let fullHtml;
            try {
                const baseTemplate = templateLoader.loadTemplate('base');
                fullHtml = templateLoader.substituteVariables(baseTemplate, {
                    CONTENT: renderedHtml,
                    year: new Date().getFullYear(),
                    ...sampleData
                });
            } catch (e) {
                fullHtml = renderedHtml;
            }

            res.json({
                success: true,
                html: fullHtml,
                subject: templateLoader.substituteVariables(template.subject || '', sampleData)
            });
        } catch (error) {
            console.error('Preview template error:', error);
            res.status(500).json({
                error: 'Failed to preview template'
            });
        }
    }

    /**
     * Get template statistics
     */
    async getStats(req, res) {
        try {
            const stats = await EmailTemplateModel.getStats();
            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            console.error('Get stats error:', error);
            res.status(500).json({
                error: 'Failed to fetch stats'
            });
        }
    }

    /**
     * Send email using template or raw HTML
     */
    async sendEmail(req, res) {
        try {
            const { to, subject, html, templateId, variables, entityType, entityId, attachments } = req.body;

            if (!to) {
                return res.status(400).json({ error: 'Recipient email is required' });
            }

            let emailHtml = html;
            let emailSubject = subject;

            // If templateId provided, fetch and render template
            if (templateId) {
                const template = await EmailTemplateModel.findById(templateId);
                if (!template) {
                    return res.status(404).json({ error: 'Template not found' });
                }
                emailHtml = templateLoader.substituteVariables(template.html_content, variables || {});
                emailSubject = templateLoader.substituteVariables(template.subject || subject, variables || {});
            }

            if (!emailHtml) {
                return res.status(400).json({ error: 'Email content is required' });
            }

            // Use the email service to send
            const emailService = require('../services/email.service');
            const result = await emailService.sendEmail({
                to,
                subject: emailSubject || 'Message from Nexspire Solutions',
                html: emailHtml,
                attachments: attachments || []
            });

            if (!result.success) {
                return res.status(500).json({ error: 'Failed to send email: ' + result.error });
            }

            // Log activity if entity provided
            if (entityType && entityId) {
                try {
                    const ActivityModel = require('../models/activity.model');
                    await ActivityModel.create({
                        entityType,
                        entityId,
                        type: 'email',
                        summary: `Email sent to ${to}`,
                        details: `Subject: ${emailSubject}`,
                        userId: req.user?.id
                    });
                } catch (actError) {
                    console.error('Failed to log activity:', actError);
                }
            }

            res.json({
                success: true,
                message: 'Email sent successfully',
                messageId: result.messageId
            });
        } catch (error) {
            console.error('Send email error:', error);
            res.status(500).json({ error: 'Failed to send email' });
        }
    }
}

module.exports = new EmailTemplateController();

