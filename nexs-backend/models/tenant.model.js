const { pool } = require('../config/database');

class TenantModel {
    /**
     * Get all tenants with plan info
     */
    static async findAll(filters = {}) {
        let query = `
            SELECT t.*, p.name as plan_name, p.slug as plan_slug,
                   p.price_monthly, p.max_users, p.max_leads
            FROM tenants t
            LEFT JOIN plans p ON t.plan_id = p.id
            WHERE 1=1
        `;
        const params = [];

        if (filters.status) {
            query += ' AND t.status = ?';
            params.push(filters.status);
        }

        if (filters.plan_id) {
            query += ' AND t.plan_id = ?';
            params.push(filters.plan_id);
        }

        query += ' ORDER BY t.created_at DESC';

        if (filters.limit) {
            query += ' LIMIT ?';
            params.push(parseInt(filters.limit));
        }

        const [rows] = await pool.query(query, params);
        return rows;
    }

    /**
     * Get tenant by ID
     */
    static async findById(id) {
        const [rows] = await pool.query(`
            SELECT t.*, p.name as plan_name, p.slug as plan_slug,
                   p.price_monthly, p.max_users, p.max_leads, p.max_clients,
                   p.max_projects, p.max_email_templates, p.features as plan_features
            FROM tenants t
            LEFT JOIN plans p ON t.plan_id = p.id
            WHERE t.id = ?
        `, [id]);
        return rows[0];
    }

    /**
     * Get tenant by slug
     */
    static async findBySlug(slug) {
        const [rows] = await pool.query(`
            SELECT t.*, p.name as plan_name, p.slug as plan_slug
            FROM tenants t
            LEFT JOIN plans p ON t.plan_id = p.id
            WHERE t.slug = ?
        `, [slug]);
        return rows[0];
    }

    /**
     * Get tenant by subdomain
     */
    static async findBySubdomain(subdomain) {
        const [rows] = await pool.query(`
            SELECT t.*, p.name as plan_name
            FROM tenants t
            LEFT JOIN plans p ON t.plan_id = p.id
            WHERE t.subdomain = ?
        `, [subdomain]);
        return rows[0];
    }

    /**
     * Create new tenant
     */
    static async create(tenantData) {
        const {
            name,
            slug,
            subdomain,
            email,
            phone,
            logo_url,
            industry_type = 'general',
            plan_id = 1
        } = tenantData;

        // Calculate trial end date (14 days from now)
        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + 14);

        const [result] = await pool.query(`
            INSERT INTO tenants (name, slug, subdomain, email, phone, logo_url, industry_type, plan_id, status, trial_ends_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'trial', ?)
        `, [name, slug, subdomain || slug, email, phone, logo_url, industry_type, plan_id, trialEndsAt]);

        return result.insertId;
    }

    /**
     * Update tenant
     */
    static async update(id, tenantData) {
        const allowedFields = ['name', 'email', 'phone', 'logo_url', 'industry_type', 'plan_id', 'status', 'custom_features'];
        const updates = [];
        const values = [];

        allowedFields.forEach(field => {
            if (tenantData[field] !== undefined) {
                updates.push(`${field} = ?`);
                values.push(field === 'custom_features' ? JSON.stringify(tenantData[field]) : tenantData[field]);
            }
        });

        if (updates.length === 0) {
            throw new Error('No valid fields to update');
        }

        values.push(id);
        await pool.query(`UPDATE tenants SET ${updates.join(', ')} WHERE id = ?`, values);
        return this.findById(id);
    }

    /**
     * Update process info
     */
    static async updateProcessInfo(id, { assigned_port, db_name, process_name, process_status }) {
        await pool.query(`
            UPDATE tenants 
            SET assigned_port = ?, db_name = ?, process_name = ?, process_status = ?
            WHERE id = ?
        `, [assigned_port, db_name, process_name, process_status, id]);
    }

    /**
     * Update process status
     */
    static async updateProcessStatus(id, status) {
        await pool.query('UPDATE tenants SET process_status = ? WHERE id = ?', [status, id]);
    }

    /**
     * Update Cloudflare DNS record ID
     */
    static async updateCfDnsRecordId(id, recordId) {
        await pool.query('UPDATE tenants SET cf_dns_record_id = ? WHERE id = ?', [recordId, id]);
    }

    /**
     * Allocate next available port
     */
    static async allocatePort(tenantId) {
        const [result] = await pool.query(`
            SELECT port FROM port_allocation 
            WHERE tenant_id IS NULL 
            ORDER BY port ASC 
            LIMIT 1
        `);

        if (!result.length) {
            throw new Error('No available ports');
        }

        const port = result[0].port;

        await pool.query(`
            UPDATE port_allocation 
            SET tenant_id = ?, allocated_at = NOW() 
            WHERE port = ?
        `, [tenantId, port]);

        return port;
    }

    /**
     * Release port back to pool
     */
    static async releasePort(tenantId) {
        await pool.query(`
            UPDATE port_allocation 
            SET tenant_id = NULL, allocated_at = NULL 
            WHERE tenant_id = ?
        `, [tenantId]);
    }

    /**
     * Get tenant stats for dashboard
     */
    static async getStats() {
        const [stats] = await pool.query(`
            SELECT 
                COUNT(*) as total_tenants,
                SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
                SUM(CASE WHEN status = 'trial' THEN 1 ELSE 0 END) as trial,
                SUM(CASE WHEN status = 'suspended' THEN 1 ELSE 0 END) as suspended,
                SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
                SUM(CASE WHEN process_status = 'running' THEN 1 ELSE 0 END) as running_processes
            FROM tenants
        `);
        return stats[0];
    }

    /**
     * Delete tenant (soft delete - just update status)
     */
    static async delete(id) {
        // Release port first
        await this.releasePort(id);

        // Update status to cancelled
        await pool.query('UPDATE tenants SET status = ? WHERE id = ?', ['cancelled', id]);
    }
}

module.exports = TenantModel;
