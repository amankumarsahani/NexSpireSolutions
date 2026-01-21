const { pool } = require('./config/database');

async function fixEnum() {
    try {
        console.log('Starting ENUM fix...');
        await pool.query(`
            ALTER TABLE workflows 
            MODIFY COLUMN trigger_type ENUM(
                'lead_created', 
                'client_created', 
                'lead_status_changed',
                'client_status_changed',
                'task_due', 
                'form_submitted', 
                'scheduled', 
                'manual',
                'inquiry_created',
                'inquiry_status_updated',
                'inquiry_converted'
            ) NOT NULL
        `);
        console.log('✅ trigger_type ENUM updated successfully.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Failed to update ENUM:', err.message);
        process.exit(1);
    }
}

fixEnum();
