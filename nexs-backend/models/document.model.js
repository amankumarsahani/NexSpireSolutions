const { pool } = require('../config/database');

const DocumentModel = {
    // Get all documents
    async getAll(filters = {}) {
        try {
            let query = `
                SELECT d.*, p.name as projectName, u.firstName, u.lastName 
                FROM documents d
                LEFT JOIN projects p ON d.projectId = p.id
                LEFT JOIN users u ON d.uploadedBy = u.id
                WHERE 1=1
            `;
            const params = [];

            // Apply filters
            if (filters.projectId) {
                query += ' AND d.projectId = ?';
                params.push(filters.projectId);
            }

            if (filters.category) {
                query += ' AND d.category = ?';
                params.push(filters.category);
            }

            if (filters.uploadedBy) {
                query += ' AND d.uploadedBy = ?';
                params.push(filters.uploadedBy);
            }

            query += ' ORDER BY d.created_at DESC';

            const [rows] = await pool.query(query, params);
            return rows;
        } catch (error) {
            throw error;
        }
    },

    // Get document by ID
    async getById(id) {
        try {
            const [rows] = await pool.query(
                `SELECT d.*, p.name as projectName, u.firstName, u.lastName 
                FROM documents d
                LEFT JOIN projects p ON d.projectId = p.id
                LEFT JOIN users u ON d.uploadedBy = u.id
                WHERE d.id = ?`,
                [id]
            );
            return rows[0];
        } catch (error) {
            throw error;
        }
    },

    // Get documents by project
    async getByProject(projectId) {
        try {
            const [rows] = await pool.query(
                `SELECT d.*, u.firstName, u.lastName 
                FROM documents d
                LEFT JOIN users u ON d.uploadedBy = u.id
                WHERE d.projectId = ?
                ORDER BY d.created_at DESC`,
                [projectId]
            );
            return rows;
        } catch (error) {
            throw error;
        }
    },

    // Create new document
    async create(documentData) {
        try {
            const {
                projectId = null,
                name,
                category = 'other',
                fileUrl,
                fileSize,
                uploadedBy
            } = documentData;

            const [result] = await pool.query(
                `INSERT INTO documents 
                (projectId, name, category, fileUrl, fileSize, uploadedBy) 
                VALUES (?, ?, ?, ?, ?, ?)`,
                [projectId, name, category, fileUrl, fileSize, uploadedBy]
            );

            return await this.getById(result.insertId);
        } catch (error) {
            throw error;
        }
    },

    // Update document
    async update(id, documentData) {
        try {
            const updates = [];
            const values = [];

            const allowedFields = ['projectId', 'name', 'category'];

            allowedFields.forEach(field => {
                if (documentData[field] !== undefined) {
                    updates.push(`${field} = ?`);
                    values.push(documentData[field]);
                }
            });

            if (updates.length === 0) {
                throw new Error('No valid fields to update');
            }

            values.push(id);

            await pool.query(
                `UPDATE documents SET ${updates.join(', ')} WHERE id = ?`,
                values
            );

            return await this.getById(id);
        } catch (error) {
            throw error;
        }
    },

    // Delete document
    async delete(id) {
        try {
            const [result] = await pool.query(
                'DELETE FROM documents WHERE id = ?',
                [id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    },

    // Get document statistics
    async getStats() {
        try {
            const [totalCount] = await pool.query(
                'SELECT COUNT(*) as total, SUM(fileSize) as totalSize FROM documents'
            );

            const [categoryBreakdown] = await pool.query(`
                SELECT 
                    category,
                    COUNT(*) as count,
                    SUM(fileSize) as totalSize
                FROM documents
                GROUP BY category
            `);

            const [projectBreakdown] = await pool.query(`
                SELECT 
                    p.name as projectName,
                    COUNT(d.id) as documentCount,
                    SUM(d.fileSize) as totalSize
                FROM projects p
                LEFT JOIN documents d ON p.id = d.projectId
                GROUP BY p.id, p.name
                HAVING documentCount > 0
                ORDER BY documentCount DESC
                LIMIT 10
            `);

            const [recentDocuments] = await pool.query(
                `SELECT d.*, p.name as projectName 
                FROM documents d
                LEFT JOIN projects p ON d.projectId = p.id
                ORDER BY d.created_at DESC 
                LIMIT 5`
            );

            return {
                total: totalCount[0].total,
                totalSize: totalCount[0].totalSize || 0,
                byCategory: categoryBreakdown,
                byProject: projectBreakdown,
                recentDocuments
            };
        } catch (error) {
            throw error;
        }
    }
};

module.exports = DocumentModel;
