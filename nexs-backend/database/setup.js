const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const runSetup = async () => {
    let connection;
    try {
        console.log('🔄 Starting database initialization...');

        // 1. Try to connect to the server (without selecting database first)
        const config = {
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        };

        connection = await mysql.createConnection(config);
        console.log('✓ Connected to Database Server');

        // 2. Read schema file
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        // 3. Split into statements and execute
        // We use a simple split by ';' but handle edge cases slightly better
        // Note: This simple splitter assumes no semicolons within strings/comments
        const statements = schemaSql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        console.log(`Found ${statements.length} SQL statements in schema.sql`);

        for (const statement of statements) {
            try {
                await connection.query(statement);
            } catch (err) {
                // If error is "No database selected" and we are running other queries, 
                // the schema.sql acts to select it: "USE nexspire_solutions;"
                // But generally schema.sql should contain CREATE DB and USE DB.
                console.error(`Error executing statement: ${statement.substring(0, 50)}...`);
                console.error(err.message);
                throw err;
            }
        }

        console.log('✅ Database setup completed successfully!');

        // 4. Initialize migrations table
        console.log('🔄 Initializing migrations table...');

        // Ensure we are using the correct DB now
        await connection.query(`USE ${process.env.DB_NAME || 'nexspire_solutions'}`);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS migrations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                filename VARCHAR(255) NOT NULL,
                executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Migrations table ready.');

    } catch (error) {
        console.error('❌ Database setup failed:', error);
        process.exit(1);
    } finally {
        if (connection) await connection.end();
        process.exit(0);
    }
};

runSetup();
