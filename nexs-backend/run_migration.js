const fs = require('fs');
const pool = require('./config/database');

async function runMigration() {
    try {
        console.log('Running tasks and notes migration...');

        const sql = fs.readFileSync('./database/migrations/add_tasks_notes.sql', 'utf8');

        await pool.query(sql);

        console.log('✅ Migration completed successfully!');
        console.log('Created tables: tasks, notes');
        console.log('Added lead score column');
        console.log('Created indexes for performance');

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

runMigration();
