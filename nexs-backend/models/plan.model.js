const { pool } = require('../config/database');

class PlanModel {
    /**
     * Get all active plans
     */
    static async findAll(includeInactive = false) {
        let query = 'SELECT * FROM plans';
        if (!includeInactive) {
            query += ' WHERE is_active = TRUE';
        }
        query += ' ORDER BY price_monthly ASC';

        const [rows] = await pool.query(query);
        return rows;
    }

    /**
     * Get plan by ID
     */
    static async findById(id) {
        const [rows] = await pool.query('SELECT * FROM plans WHERE id = ?', [id]);
        return rows[0];
    }

    /**
     * Get plan by slug
     */
    static async findBySlug(slug) {
        const [rows] = await pool.query('SELECT * FROM plans WHERE slug = ?', [slug]);
        return rows[0];
    }

    /**
     * Create new plan
     */
    static async create(planData) {
        const {
            name,
            slug,
            description,
            price_monthly,
            price_yearly,
            max_users,
            max_leads,
            max_clients,
            max_projects,
            max_email_templates,
            max_document_templates,
            features
        } = planData;

        const [result] = await pool.query(`
            INSERT INTO plans (name, slug, description, price_monthly, price_yearly, 
                              max_users, max_leads, max_clients, max_projects,
                              max_email_templates, max_document_templates, features)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            name, slug, description, price_monthly, price_yearly || price_monthly * 10,
            max_users, max_leads, max_clients, max_projects,
            max_email_templates, max_document_templates,
            JSON.stringify(features || {})
        ]);

        return result.insertId;
    }

    /**
     * Update plan
     */
    static async update(id, planData) {
        const allowedFields = [
            'name', 'description', 'price_monthly', 'price_yearly',
            'max_users', 'max_leads', 'max_clients', 'max_projects',
            'max_email_templates', 'max_document_templates', 'features', 'is_active'
        ];

        const updates = [];
        const values = [];

        allowedFields.forEach(field => {
            if (planData[field] !== undefined) {
                updates.push(`${field} = ?`);
                values.push(field === 'features' ? JSON.stringify(planData[field]) : planData[field]);
            }
        });

        if (updates.length === 0) {
            throw new Error('No valid fields to update');
        }

        values.push(id);
        await pool.query(`UPDATE plans SET ${updates.join(', ')} WHERE id = ?`, values);
        return this.findById(id);
    }

    /**
     * Get tenant count per plan
     */
    static async getUsageStats() {
        const [stats] = await pool.query(`
            SELECT p.id, p.name, p.slug, p.price_monthly,
                   COUNT(t.id) as tenant_count,
                   SUM(CASE WHEN t.status = 'active' THEN 1 ELSE 0 END) as active_count
            FROM plans p
            LEFT JOIN tenants t ON p.id = t.plan_id
            GROUP BY p.id
            ORDER BY p.price_monthly ASC
        `);
        return stats;
    }
}

module.exports = PlanModel;
