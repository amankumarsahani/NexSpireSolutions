const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixTenantDatabases() {
    const config = {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'nexspire_user',
        password: process.env.DB_PASSWORD || 'NexspireSolutions@2025',
        multipleStatements: true
    };

    let connection;
    try {
        connection = await mysql.createConnection(config);
        console.log('Connected to MySQL');

        const [databases] = await connection.query("SHOW DATABASES LIKE 'nexcrm_%'");

        for (const db of databases) {
            const dbName = Object.values(db)[0];
            console.log(`Processing database: ${dbName}`);

            try {
                await connection.query(`USE \`${dbName}\``);

                // Check if table exists
                const [tables] = await connection.query("SHOW TABLES LIKE 'legal_document_templates'");
                if (tables.length === 0) {
                    console.log(`  - Table legal_document_templates not found in ${dbName}`);
                    continue;
                }

                // Apply fixes
                console.log(`  - Applying schema fixes to ${dbName}.legal_document_templates`);

                // Add name column if missing
                try {
                    await connection.query("ALTER TABLE legal_document_templates ADD COLUMN IF NOT EXISTS name VARCHAR(255) AFTER id");
                    console.log("    ✓ Column 'name' added/exists");
                } catch (e) {
                    console.log(`    ℹ Attempting alternative ALTER for 'name': ${e.message}`);
                    try { await connection.query("ALTER TABLE legal_document_templates ADD COLUMN name VARCHAR(255) AFTER id"); } catch (e2) { }
                }

                // Add header/footer columns if missing
                try {
                    await connection.query("ALTER TABLE legal_document_templates ADD COLUMN IF NOT EXISTS header TEXT AFTER variables");
                    await connection.query("ALTER TABLE legal_document_templates ADD COLUMN IF NOT EXISTS footer TEXT AFTER header");
                    console.log("    ✓ Columns 'header' and 'footer' added/exists");
                } catch (e) {
                    try { await connection.query("ALTER TABLE legal_document_templates ADD COLUMN header TEXT AFTER variables"); } catch (e) { }
                    try { await connection.query("ALTER TABLE legal_document_templates ADD COLUMN footer TEXT AFTER header"); } catch (e) { }
                }

                // Sync name from template_name
                try {
                    await connection.query("UPDATE legal_document_templates SET name = template_name WHERE (name IS NULL OR name = '') AND (template_name IS NOT NULL AND template_name != '')");
                    console.log("    ✓ Synchronized 'name' from 'template_name'");
                } catch (e) {
                    console.log(`    ℹ Could not sync: ${e.message}`);
                }

            } catch (err) {
                console.error(`  ✗ Error processing ${dbName}: ${err.message}`);
            }
        }

        console.log('\nAll databases processed.');
    } catch (error) {
        console.error('Fatal error details:');
        console.error(error);
        if (error.stack) console.error(error.stack);
    } finally {
        if (connection) await connection.end();
    }
}

fixTenantDatabases();
