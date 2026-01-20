/**
 * Migration: 026_add_ip_to_queue
 * Description: Adds open_ip and click_ip columns to email_queue for tracking originating IPs of email events.
 */

const db = require('../../config/database');

async function up() {
    try {
        console.log('Running migration: 026_add_ip_to_queue...');

        await db.query(`
            ALTER TABLE email_queue 
            ADD COLUMN open_ip VARCHAR(45) DEFAULT NULL AFTER clicked_at,
            ADD COLUMN click_ip VARCHAR(45) DEFAULT NULL AFTER open_ip
        `);

        console.log('✓ Migration 026_add_ip_to_queue completed successfully.');
        return true;
    } catch (error) {
        if (error.code === 'ER_DUP_COLUMN_NAME') {
            console.log('! Migration already applied (columns exist).');
            return true;
        }
        console.error('✗ Migration 026_add_ip_to_queue failed:', error.message);
        throw error;
    }
}

async function down() {
    try {
        await db.query(`
            ALTER TABLE email_queue 
            DROP COLUMN open_ip,
            DROP COLUMN click_ip
        `);
        console.log('✓ Rollback 026_add_ip_to_queue completed.');
        return true;
    } catch (error) {
        console.error('✗ Rollback failed:', error.message);
        throw error;
    }
}

module.exports = { up, down };

// Auto-run if executed directly
if (require.main === module) {
    up().then(() => process.exit(0)).catch(() => process.exit(1));
}
