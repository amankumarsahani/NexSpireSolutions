const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

const migrations = [
    // 'add_departments_teams.sql',
    // 'add_tasks_table.sql',
    // 'create_activity_logs.sql',
    // 'alter_users_table.sql',
    'create_notifications_table.sql'
];

async function runMigrations() {
    console.log('Starting migrations...');

    for (const migration of migrations) {
        const filePath = path.join(__dirname, '../database/migrations', migration);
        if (!fs.existsSync(filePath)) {
            console.error(`Migration file not found: ${migration}`);
            continue;
        }

        console.log(`Running migration: ${migration}`);
        const sql = fs.readFileSync(filePath, 'utf8');

        // Split by semicolon but respect simple cases
        // This is a naive splitter, but sufficient for our simple migrations
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            for (const statement of statements) {
                await connection.query(statement);
            }

            await connection.commit();
            console.log(`✓ Completed migration: ${migration}`);
        } catch (error) {
            await connection.rollback();
            console.error(`✗ Failed migration: ${migration}`, error.message);
            // Don't throw, try next one or stop? Let's stop to be safe.
            process.exit(1);
        } finally {
            connection.release();
        }
    }

    console.log('All migrations completed.');
    process.exit(0);
}

runMigrations();
