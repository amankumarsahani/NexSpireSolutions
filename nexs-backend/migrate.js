const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'nexspire_solutions',
    multipleStatements: true
};

async function runMigrations() {
    let connection;

    try {
        console.log('🔌 Connecting to database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to database');

        // 1. Create migrations table if not exists
        await connection.query(`
            CREATE TABLE IF NOT EXISTS migrations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL UNIQUE,
                executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 2. Get executed migrations
        const [rows] = await connection.query('SELECT name FROM migrations');
        const executedMigrations = new Set(rows.map(row => row.name));

        // 3. Get all migration files
        const migrationsDir = path.join(__dirname, 'database', 'migrations');

        if (!fs.existsSync(migrationsDir)) {
            console.log('📁 Creating migrations directory...');
            fs.mkdirSync(migrationsDir, { recursive: true });
        }

        const files = fs.readdirSync(migrationsDir)
            .filter(file => file.endsWith('.sql'))
            .sort(); // Run in alphabetical order

        if (files.length === 0) {
            console.log('⚠️  No migration files found in database/migrations/');
            return;
        }

        console.log(`\n📄 Found ${files.length} migration file(s)`);

        // 4. Run new migrations
        let ranCount = 0;
        for (const file of files) {
            if (executedMigrations.has(file)) {
                console.log(`⏭️  Skipped: ${file} (already executed)`);
                continue;
            }

            console.log(`▶️  Running: ${file}`);
            const filePath = path.join(migrationsDir, file);
            const sql = fs.readFileSync(filePath, 'utf8');

            try {
                await connection.beginTransaction();

                // Run the migration SQL
                await connection.query(sql);

                // Record the migration
                await connection.query('INSERT INTO migrations (name) VALUES (?)', [file]);

                await connection.commit();
                console.log(`✅ Completed: ${file}`);
                ranCount++;
            } catch (error) {
                await connection.rollback();
                console.error(`❌ Error in ${file}:`, error.message);
                throw error; // Stop execution on error
            }
        }

        if (ranCount === 0) {
            console.log('\n✨ No new migrations to run.');
        } else {
            console.log(`\n🎉 Successfully ran ${ranCount} new migration(s)!`);
        }

    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

// Run migrations
runMigrations();
