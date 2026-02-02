const { pool } = require('../config/database');

const DocumentTemplateModel = {
    // Get all document templates (without content for list view)
    async findAll(filters = {}) {
        let query = 'SELECT `id`, `name`, `slug`, `description`, `category`, `variables`, `isActive` AS `is_active`, `isDefault` AS `is_default`, `createdAt` AS `created_at`, `updatedAt` AS `updated_at` FROM `document_templates` WHERE 1=1';
        const params = [];

        if (filters.category) {
            query += ' AND `category` = ?';
            params.push(filters.category);
        }

        if (filters.isActive !== undefined) {
            query += ' AND `isActive` = ?';
            params.push(filters.isActive);
        }

        query += ' ORDER BY `isDefault` DESC, `name` ASC';

        const [rows] = await pool.query(query, params);
        return rows;
    },

    // Get by ID with content
    async findById(id) {
        const [rows] = await pool.query(
            'SELECT `id`, `name`, `slug`, `description`, `category`, `content`, `variables`, `isActive` AS `is_active`, `isDefault` AS `is_default`, `createdAt` AS `created_at`, `updatedAt` AS `updated_at` FROM `document_templates` WHERE `id` = ?',
            [id]
        );
        return rows[0];
    },

    // Get by slug
    async findBySlug(slug) {
        const [rows] = await pool.query(
            'SELECT `id`, `name`, `slug`, `description`, `category`, `content`, `variables`, `isActive` AS `is_active`, `isDefault` AS `is_default`, `createdAt` AS `created_at`, `updatedAt` AS `updated_at` FROM `document_templates` WHERE `slug` = ?',
            [slug]
        );
        return rows[0];
    },

    // Create new template
    async create(data) {
        const { name, slug, description, category, content, variables, isDefault } = data;

        const [result] = await pool.query(
            'INSERT INTO `document_templates` (`name`, `slug`, `description`, `category`, `content`, `variables`, `isDefault`) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, slug, description, category || 'sales', content, JSON.stringify(variables || []), isDefault || false]
        );

        return this.findById(result.insertId);
    },

    // Update template
    async update(id, data) {
        const updates = [];
        const values = [];

        const allowedFields = ['name', 'slug', 'description', 'category', 'content', 'isActive', 'isDefault'];

        allowedFields.forEach(field => {
            if (data[field] !== undefined) {
                updates.push(`\`${field}\` = ?`);
                values.push(data[field]);
            }
        });

        if (data.variables !== undefined) {
            updates.push('`variables` = ?');
            values.push(JSON.stringify(data.variables));
        }

        if (updates.length === 0) {
            throw new Error('No valid fields to update');
        }

        values.push(id);

        await pool.query(
            `UPDATE \`document_templates\` SET ${updates.join(', ')} WHERE \`id\` = ?`,
            values
        );

        return this.findById(id);
    },

    // Delete template (only custom ones)
    async delete(id) {
        const template = await this.findById(id);
        if (template?.isDefault) {
            throw new Error('Cannot delete default templates');
        }

        const [result] = await pool.query(
            'DELETE FROM document_templates WHERE id = ? AND isDefault = FALSE',
            [id]
        );
        return result.affectedRows > 0;
    },

    // Render template with variables
    renderTemplate(content, variables) {
        let rendered = content;

        // Replace {{variable}} with actual values
        Object.entries(variables).forEach(([key, value]) => {
            const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
            rendered = rendered.replace(regex, value || '');
        });

        // Replace any remaining unset variables with placeholder
        rendered = rendered.replace(/\{\{([^}]+)\}\}/g, '<span style="color: #f59e0b; background: #fef3c7; padding: 2px 6px; border-radius: 4px;">[$1]</span>');

        return rendered;
    },

    // Extract variables from template content
    extractVariables(content) {
        const matches = content.match(/\{\{([^}]+)\}\}/g) || [];
        return [...new Set(matches.map(m => m.replace(/\{\{|\}\}/g, '')))];
    }
};

module.exports = DocumentTemplateModel;
