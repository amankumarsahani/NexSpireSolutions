const fs = require('fs');
const { pool } = require('./config/database');

async function runMigration() {
    const connection = await pool.getConnection();

    try {
        console.log('Running tasks and notes migration...\n');

        // Read and split SQL statements
        const sql = fs.readFileSync('./database/migrations/add_tasks_notes.sql', 'utf8');
        const statements = sql
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

        // Execute each statement
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            if (statement) {
                console.log(`Executing statement ${i + 1}/${statements.length}...`);
                await connection.query(statement);
            }
        }

        console.log('\n✅ Migration completed successfully!');
        console.log('Created tables: tasks, notes');
        console.log('Added lead score column');
        console.log('Created indexes for performance');

        connection.release();
        process.exit(0);
    } catch (error) {
        connection.release();
        console.error('\n❌ Migration failed:');
        console.error('Error:', error.message);
        console.error('Code:', error.code);
        console.error('SQL State:', error.sqlState);
        if (error.sql) {
            console.error('\nFailed SQL:');
            console.error(error.sql.substring(0, 200) + '...');
        }
        process.exit(1);
    }
}

runMigration();
