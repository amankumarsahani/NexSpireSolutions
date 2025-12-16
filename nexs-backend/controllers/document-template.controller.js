const DocumentTemplateModel = require('../models/document-template.model');
const emailService = require('../services/email.service');

class DocumentTemplateController {
    // Get all templates
    async getAll(req, res) {
        try {
            const { category, isActive } = req.query;
            const templates = await DocumentTemplateModel.findAll({ category, isActive });

            res.json({
                success: true,
                data: templates
            });
        } catch (error) {
            console.error('Get templates error:', error);
            res.status(500).json({ error: 'Failed to fetch templates' });
        }
    }

    // Get template by ID
    async getById(req, res) {
        try {
            const template = await DocumentTemplateModel.findById(req.params.id);

            if (!template) {
                return res.status(404).json({ error: 'Template not found' });
            }

            // Parse variables JSON
            if (template.variables && typeof template.variables === 'string') {
                template.variables = JSON.parse(template.variables);
            }

            res.json({
                success: true,
                data: template
            });
        } catch (error) {
            console.error('Get template error:', error);
            res.status(500).json({ error: 'Failed to fetch template' });
        }
    }

    // Create new template
    async create(req, res) {
        try {
            const { name, slug, description, category, content, variables } = req.body;

            if (!name || !content) {
                return res.status(400).json({ error: 'Name and content are required' });
            }

            // Generate slug if not provided
            const templateSlug = slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

            // Extract variables from content
            const extractedVariables = variables || DocumentTemplateModel.extractVariables(content);

            const template = await DocumentTemplateModel.create({
                name,
                slug: templateSlug,
                description,
                category,
                content,
                variables: extractedVariables
            });

            res.status(201).json({
                success: true,
                message: 'Template created successfully',
                data: template
            });
        } catch (error) {
            console.error('Create template error:', error);
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ error: 'A template with this slug already exists' });
            }
            res.status(500).json({ error: 'Failed to create template' });
        }
    }

    // Update template
    async update(req, res) {
        try {
            const template = await DocumentTemplateModel.findById(req.params.id);

            if (!template) {
                return res.status(404).json({ error: 'Template not found' });
            }

            // If content is being updated, extract new variables
            if (req.body.content && !req.body.variables) {
                req.body.variables = DocumentTemplateModel.extractVariables(req.body.content);
            }

            const updatedTemplate = await DocumentTemplateModel.update(req.params.id, req.body);

            res.json({
                success: true,
                message: 'Template updated successfully',
                data: updatedTemplate
            });
        } catch (error) {
            console.error('Update template error:', error);
            res.status(500).json({ error: 'Failed to update template' });
        }
    }

    // Delete template
    async delete(req, res) {
        try {
            const deleted = await DocumentTemplateModel.delete(req.params.id);

            if (!deleted) {
                return res.status(400).json({ error: 'Cannot delete this template' });
            }

            res.json({
                success: true,
                message: 'Template deleted successfully'
            });
        } catch (error) {
            console.error('Delete template error:', error);
            res.status(500).json({ error: error.message || 'Failed to delete template' });
        }
    }

    // Preview rendered template
    async preview(req, res) {
        try {
            const template = await DocumentTemplateModel.findById(req.params.id);

            if (!template) {
                return res.status(404).json({ error: 'Template not found' });
            }

            const variables = req.body.variables || {};
            const renderedContent = DocumentTemplateModel.renderTemplate(template.content, variables);

            res.json({
                success: true,
                data: {
                    name: template.name,
                    renderedContent
                }
            });
        } catch (error) {
            console.error('Preview template error:', error);
            res.status(500).json({ error: 'Failed to preview template' });
        }
    }

    // Send document via email
    async sendDocument(req, res) {
        try {
            const { templateId, to, subject, variables } = req.body;

            if (!templateId || !to) {
                return res.status(400).json({ error: 'Template ID and recipient email are required' });
            }

            const template = await DocumentTemplateModel.findById(templateId);

            if (!template) {
                return res.status(404).json({ error: 'Template not found' });
            }

            // Render template with provided variables
            const renderedContent = DocumentTemplateModel.renderTemplate(template.content, variables || {});

            // Send email
            const emailResult = await emailService.sendEmail({
                to,
                subject: subject || `${template.name} from Nexspire Solutions`,
                html: renderedContent
            });

            if (!emailResult.success) {
                return res.status(500).json({ error: 'Failed to send email: ' + emailResult.error });
            }

            res.json({
                success: true,
                message: 'Document sent successfully',
                messageId: emailResult.messageId
            });
        } catch (error) {
            console.error('Send document error:', error);
            res.status(500).json({ error: 'Failed to send document' });
        }
    }
}

module.exports = new DocumentTemplateController();
