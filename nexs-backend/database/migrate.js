const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

const runMigrations = async () => {
    let connection;
    try {
        connection = await pool.getConnection();

        // 1. Create migrations table if it doesn't exist
        await connection.query(`
            CREATE TABLE IF NOT EXISTS migrations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                filename VARCHAR(255) NOT NULL,
                executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 2. Get list of already executed migrations
        const [executed] = await connection.query('SELECT filename FROM migrations');
        const executedFiles = new Set(executed.map(row => row.filename));

        // 3. Get all migration files
        const migrationsDir = path.join(__dirname, 'migrations');
        if (!fs.existsSync(migrationsDir)) {
            console.log('No migrations directory found.');
            return;
        }

        const files = fs.readdirSync(migrationsDir)
            .filter(file => file.endsWith('.sql'))
            .sort(); // Sort to ensure order

        if (files.length === 0) {
            console.log('No migration files found.');
            return;
        }

        let migrationCount = 0;

        // 4. Run pending migrations
        for (const file of files) {
            if (executedFiles.has(file)) {
                continue; // Skip already executed
            }

            console.log(`Running migration: ${file}...`);
            const filePath = path.join(migrationsDir, file);
            const sql = fs.readFileSync(filePath, 'utf8');


            // Split by semicolon for multiple statements
            const statements = sql
                .split(';')
                .map(s => s.trim())
                .filter(s => s.length > 0);

            try {
                await connection.beginTransaction();

                for (const statement of statements) {
                    try {
                        await connection.query(statement);
                    } catch (stmtErr) {
                        // Ignore "column already exists" or "table already exists" errors
                        const ignorableErrors = [
                            'ER_DUP_FIELDNAME',      // Duplicate column name
                            'ER_TABLE_EXISTS_ERROR', // Table already exists
                            'ER_DUP_ENTRY',          // Duplicate entry
                            'ER_BAD_FIELD_ERROR',    // Unknown column (for SELECT statements)
                            'ER_DUP_KEYNAME'         // Duplicate key/index name
                        ];
                        if (ignorableErrors.includes(stmtErr.code)) {
                            console.log(`   ⚠️ Skipped (already exists): ${stmtErr.message.substring(0, 50)}...`);
                        } else {
                            throw stmtErr;
                        }
                    }
                }

                // Record migration
                await connection.query('INSERT INTO migrations (filename) VALUES (?)', [file]);
                await connection.commit();

                console.log(`✅ ${file} completed successfully.`);
                migrationCount++;
            } catch (err) {
                await connection.rollback();
                console.error(`❌ Error in ${file}:`, err.message);
                throw err;
            }
        }

        if (migrationCount === 0) {
            console.log('All migrations are up to date.');
        } else {
            console.log(`Successfully ran ${migrationCount} migrations.`);
        }

    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        if (connection) connection.release();
        process.exit(0);
    }
};

runMigrations();
