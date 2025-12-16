/**
 * Assignment Service
 * Handles round-robin assignment of leads and inquiries to sales operators
 */

const { pool } = require('../config/database');

class AssignmentService {
    /**
     * Get all active sales operators
     * @returns {Promise<Array>} List of sales operator users
     */
    static async getSalesOperators() {
        const [rows] = await pool.query(
            `SELECT id, email, firstName, lastName 
             FROM users 
             WHERE role = 'sales_operator' 
             ORDER BY id ASC`
        );
        return rows;
    }

    /**
     * Get the first admin user (fallback when no sales operators)
     * @returns {Promise<Object|null>} Admin user or null
     */
    static async getFirstAdmin() {
        const [rows] = await pool.query(
            `SELECT id, email, firstName, lastName 
             FROM users 
             WHERE role = 'admin' 
             ORDER BY id ASC 
             LIMIT 1`
        );
        return rows[0] || null;
    }

    /**
     * Get next assignee using round-robin
     * @param {string} entityType - 'lead' or 'inquiry'
     * @returns {Promise<number|null>} User ID to assign to
     */
    static async getNextAssignee(entityType) {
        try {
            // Get all sales operators
            const operators = await this.getSalesOperators();

            // If no sales operators, assign to admin
            if (operators.length === 0) {
                const admin = await this.getFirstAdmin();
                return admin ? admin.id : null;
            }

            // Get current tracker state
            const [trackerRows] = await pool.query(
                `SELECT lastAssignedIndex FROM assignment_tracker WHERE entityType = ?`,
                [entityType]
            );

            let lastIndex = 0;
            if (trackerRows.length > 0) {
                lastIndex = trackerRows[0].lastAssignedIndex || 0;
            }

            // Calculate next index (round-robin)
            const nextIndex = (lastIndex + 1) % operators.length;
            const nextOperator = operators[nextIndex];

            // Update tracker
            await pool.query(
                `INSERT INTO assignment_tracker (entityType, lastAssignedUserId, lastAssignedIndex)
                 VALUES (?, ?, ?)
                 ON DUPLICATE KEY UPDATE lastAssignedUserId = ?, lastAssignedIndex = ?`,
                [entityType, nextOperator.id, nextIndex, nextOperator.id, nextIndex]
            );

            console.log(`[Assignment] ${entityType} assigned to ${nextOperator.firstName} (ID: ${nextOperator.id})`);
            return nextOperator.id;
        } catch (error) {
            console.error('[Assignment] Error getting next assignee:', error);
            // Fallback to admin on error
            const admin = await this.getFirstAdmin();
            return admin ? admin.id : null;
        }
    }

    /**
     * Manually assign an item to a specific user (admin only)
     * @param {string} entityType - 'lead' or 'inquiry'
     * @param {number} entityId - ID of the lead/inquiry
     * @param {number} assignToUserId - User ID to assign to
     * @returns {Promise<boolean>} Success status
     */
    static async assignTo(entityType, entityId, assignToUserId) {
        try {
            const table = entityType === 'lead' ? 'leads' : 'inquiries';
            await pool.query(
                `UPDATE ${table} SET assignedTo = ? WHERE id = ?`,
                [assignToUserId, entityId]
            );
            console.log(`[Assignment] Manually assigned ${entityType} #${entityId} to user #${assignToUserId}`);
            return true;
        } catch (error) {
            console.error('[Assignment] Error in manual assignment:', error);
            return false;
        }
    }

    /**
     * Get all users who can be assigned items (sales operators + admins)
     * @returns {Promise<Array>} List of assignable users
     */
    static async getAssignableUsers() {
        const [rows] = await pool.query(
            `SELECT id, email, firstName, lastName, role 
             FROM users 
             WHERE role IN ('admin', 'sales_operator')
             ORDER BY role DESC, firstName ASC`
        );
        return rows;
    }
}

module.exports = AssignmentService;
