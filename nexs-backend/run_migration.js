const { pool } = require('./config/database');
const fs = require('fs');

async function runMigration() {
    const file = process.argv[2];
    if (!file) {
        console.error('Please provide a migration file path');
        process.exit(1);
    }

    try {
        const sql = fs.readFileSync(file, 'utf8');
        await pool.query(sql);
        console.log('Migration successfully executed');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
