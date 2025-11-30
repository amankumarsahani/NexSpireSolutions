const DocumentModel = require('../models/document.model');
const fs = require('fs').promises;
const path = require('path');

const DocumentController = {
    // Get all documents
    async getAll(req, res) {
        try {
            const { projectId, category, uploadedBy } = req.query;
            const filters = {};

            if (projectId) filters.projectId = projectId;
            if (category) filters.category = category;
            if (uploadedBy) filters.uploadedBy = uploadedBy;

            const documents = await DocumentModel.getAll(filters);

            res.json({
                success: true,
                count: documents.length,
                data: documents
            });
        } catch (error) {
            console.error('Get all documents error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch documents',
                error: error.message
            });
        }
    },

    // Get document by ID
    async getById(req, res) {
        try {
            const { id } = req.params;
            const document = await DocumentModel.getById(id);

            if (!document) {
                return res.status(404).json({
                    success: false,
                    message: 'Document not found'
                });
            }

            res.json({
                success: true,
                data: document
            });
        } catch (error) {
            console.error('Get document error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch document',
                error: error.message
            });
        }
    },

    // Get documents by project
    async getByProject(req, res) {
        try {
            const { projectId } = req.params;
            const documents = await DocumentModel.getByProject(projectId);

            res.json({
                success: true,
                count: documents.length,
                data: documents
            });
        } catch (error) {
            console.error('Get project documents error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch project documents',
                error: error.message
            });
        }
    },

    // Upload new document
    async upload(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No file uploaded'
                });
            }

            const { projectId, category = 'other' } = req.body;

            const document = await DocumentModel.create({
                projectId: projectId || null,
                name: req.file.originalname,
                category,
                fileUrl: `/uploads/${req.file.filename}`,
                fileSize: req.file.size,
                uploadedBy: req.user.id
            });

            res.status(201).json({
                success: true,
                message: 'Document uploaded successfully',
                data: document
            });
        } catch (error) {
            console.error('Upload document error:', error);

            // Clean up uploaded file on error
            if (req.file) {
                try {
                    await fs.unlink(req.file.path);
                } catch (unlinkError) {
                    console.error('Error deleting file:', unlinkError);
                }
            }

            res.status(500).json({
                success: false,
                message: 'Failed to upload document',
                error: error.message
            });
        }
    },

    // Update document
    async update(req, res) {
        try {
            const { id } = req.params;

            // Check if document exists
            const existingDocument = await DocumentModel.getById(id);
            if (!existingDocument) {
                return res.status(404).json({
                    success: false,
                    message: 'Document not found'
                });
            }

            const document = await DocumentModel.update(id, req.body);

            res.json({
                success: true,
                message: 'Document updated successfully',
                data: document
            });
        } catch (error) {
            console.error('Update document error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update document',
                error: error.message
            });
        }
    },

    // Delete document
    async delete(req, res) {
        try {
            const { id } = req.params;

            // Check if document exists
            const existingDocument = await DocumentModel.getById(id);
            if (!existingDocument) {
                return res.status(404).json({
                    success: false,
                    message: 'Document not found'
                });
            }

            // Delete file from filesystem
            try {
                const filePath = path.join(__dirname, '..', existingDocument.fileUrl);
                await fs.unlink(filePath);
            } catch (fileError) {
                console.error('Error deleting file from filesystem:', fileError);
                // Continue with database deletion even if file deletion fails
            }

            const deleted = await DocumentModel.delete(id);

            if (deleted) {
                res.json({
                    success: true,
                    message: 'Document deleted successfully'
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Failed to delete document'
                });
            }
        } catch (error) {
            console.error('Delete document error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete document',
                error: error.message
            });
        }
    },

    // Get document statistics
    async getStats(req, res) {
        try {
            const stats = await DocumentModel.getStats();

            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            console.error('Get document stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch document statistics',
                error: error.message
            });
        }
    }
};

module.exports = DocumentController;
