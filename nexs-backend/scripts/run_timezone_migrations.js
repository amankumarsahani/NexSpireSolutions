/**
 * Run Timezone Migrations for All Tenants
 * 
 * This script fetches all active tenants from the Nexspire admin database,
 * gets their server credentials, and runs timezone migrations on each tenant DB.
 * 
 * Usage (from NexSpireSolutions/nexs-backend folder):
 *   node scripts/run_timezone_migrations.js
 * 
 * Prerequisites:
 *   - Must run from the nexs-backend folder (uses its .env for admin DB connection)
 *   - Requires active connection to the nexspire_solutions database
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

async function runTimezoneForAllTenants() {
    // Connect to the admin database (nexspire_solutions)
    const adminConfig = {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'nexspire_solutions',
        multipleStatements: true
    };

    let adminConn;
    let successCount = 0;
    let errorCount = 0;

    try {
        adminConn = await mysql.createConnection(adminConfig);
        console.log('\n🚀 Timezone Migration Runner for All Tenants');
        console.log('='.repeat(55));
        console.log(`📍 Admin DB: ${adminConfig.host}:${adminConfig.port}/${adminConfig.database}`);
        console.log('='.repeat(55) + '\n');

        // Get all active tenants with their server info
        const [tenants] = await adminConn.query(`
            SELECT 
                t.id, t.name, t.slug, t.db_name, t.status,
                s.db_host, s.db_user, s.db_password, s.name as server_name
            FROM tenants t
            LEFT JOIN servers s ON t.server_id = s.id
            WHERE t.status = 'active' OR t.status = 'running'
        `);

        console.log(`📋 Found ${tenants.length} active tenants\n`);

        for (const tenant of tenants) {
            const dbName = tenant.db_name || `nexcrm_${tenant.slug.replace(/-/g, '_')}`;
            console.log(`\n📦 Processing: ${tenant.name} (${dbName})`);
            console.log(`   Server: ${tenant.server_name || 'primary'}`);

            let tenantConn;
            try {
                // Connect to the tenant database using server credentials
                tenantConn = await mysql.createConnection({
                    host: tenant.db_host || adminConfig.host,
                    port: 3306, // Default MySQL port
                    user: tenant.db_user || adminConfig.user,
                    password: tenant.db_password || adminConfig.password,
                    database: dbName,
                    multipleStatements: true
                });


                // Migration 026: Add timezone column to users table
                console.log('  → Running migration 026_add_user_timezone...');

                const [userCols] = await tenantConn.query("SHOW COLUMNS FROM users LIKE 'timezone'");
                if (userCols.length === 0) {
                    await tenantConn.query(`
                        ALTER TABLE users 
                        ADD COLUMN timezone VARCHAR(100) DEFAULT 'UTC' 
                        COMMENT 'User preferred timezone (IANA format)'
                    `);
                    console.log('    ✓ Added timezone column to users');
                } else {
                    console.log('    ⏭  timezone column already exists');
                }

                // Migration 027: Add timezone setting to settings table
                console.log('  → Running migration 027_add_tenant_timezone_setting...');

                const [tables] = await tenantConn.query("SHOW TABLES LIKE 'settings'");
                if (tables.length > 0) {
                    const [existing] = await tenantConn.query(
                        "SELECT 1 FROM settings WHERE setting_key = 'timezone' LIMIT 1"
                    );
                    if (existing.length === 0) {
                        await tenantConn.query(`
                            INSERT INTO settings (setting_key, setting_value) 
                            VALUES ('timezone', 'UTC')
                        `);
                        console.log('    ✓ Added timezone setting');
                    } else {
                        console.log('    ⏭  timezone setting already exists');
                    }
                } else {
                    console.log('    ⚠  settings table not found, skipping');
                }

                // Record migrations in migrations table if it exists
                const [migTable] = await tenantConn.query("SHOW TABLES LIKE 'migrations'");
                if (migTable.length > 0) {
                    try {
                        await tenantConn.query(`
                            INSERT IGNORE INTO migrations (name, industry) VALUES 
                            ('026_add_user_timezone', 'core'),
                            ('027_add_tenant_timezone_setting', 'core')
                        `);
                    } catch (e) {
                        // Ignore duplicate entry errors
                    }
                }

                console.log(`  ✅ ${tenant.name} completed`);
                successCount++;

            } catch (err) {
                console.error(`  ✗ Error in ${tenant.name}: ${err.message}`);
                errorCount++;
            } finally {
                if (tenantConn) await tenantConn.end();
            }
        }

        // Summary
        console.log('\n' + '='.repeat(55));
        console.log('✅ Migration Complete!');
        console.log(`   Success: ${successCount} tenants`);
        if (errorCount > 0) {
            console.log(`   Errors: ${errorCount} tenants`);
        }
        console.log('='.repeat(55) + '\n');

    } catch (error) {
        console.error('\n❌ Fatal error:', error.message);
        if (error.stack) console.error(error.stack);
        process.exit(1);
    } finally {
        if (adminConn) await adminConn.end();
    }
}

runTimezoneForAllTenants();
