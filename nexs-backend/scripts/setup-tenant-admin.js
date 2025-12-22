/**
 * Setup NexSpire Admin for Existing Tenant
 * Run this on the server to add NexSpire admin to an existing tenant
 * 
 * Usage: node scripts/setup-tenant-admin.js <tenant_slug> [reset_password]
 * Example: node scripts/setup-tenant-admin.js test-ecom
 * Example: node scripts/setup-tenant-admin.js test-ecom reset
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const DB_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
};

async function generatePassword() {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

async function setupTenantAdmin(tenantSlug, resetPassword = false) {
    // Connect to main database
    const mainDb = await mysql.createConnection({
        ...DB_CONFIG,
        database: process.env.DB_NAME || 'nexspire_solutions'
    });

    try {
        // Get tenant info
        const [tenants] = await mainDb.query(
            'SELECT * FROM tenants WHERE slug = ?',
            [tenantSlug]
        );

        if (tenants.length === 0) {
            console.error(`❌ Tenant with slug '${tenantSlug}' not found`);
            process.exit(1);
        }

        const tenant = tenants[0];
        console.log(`\n📌 Tenant: ${tenant.name} (${tenant.slug})`);
        console.log(`   Database: ${tenant.db_name}`);
        console.log(`   Port: ${tenant.assigned_port}`);
        console.log(`   Status: ${tenant.status}`);

        // Connect to tenant database
        const tenantDb = await mysql.createConnection({
            ...DB_CONFIG,
            database: tenant.db_name
        });

        // Add NexSpire super admin
        const superAdminEmail = process.env.NEXSPIRE_ADMIN_EMAIL || 'admin@nexspiresolutions.co.in';
        const superAdminPassword = process.env.NEXSPIRE_ADMIN_PASSWORD || 'NexSpire@2024!';
        const superAdminHash = await bcrypt.hash(superAdminPassword, 10);

        await tenantDb.query(
            `INSERT INTO users (email, password, firstName, lastName, role, status) 
             VALUES (?, ?, 'NexSpire', 'Admin', 'super_admin', 'active')
             ON DUPLICATE KEY UPDATE password = ?, role = 'super_admin'`,
            [superAdminEmail, superAdminHash, superAdminHash]
        );
        console.log(`\n✅ NexSpire Super Admin added/updated:`);
        console.log(`   Email: ${superAdminEmail}`);
        console.log(`   Password: ${superAdminPassword}`);

        // Handle tenant admin password
        if (resetPassword || !tenant.admin_password) {
            const newPassword = await generatePassword();
            const hash = await bcrypt.hash(newPassword, 10);

            // Update password in tenant users table
            await tenantDb.query(
                'UPDATE users SET password = ? WHERE email = ?',
                [hash, tenant.email]
            );

            // Store password in main database
            await mainDb.query(
                'UPDATE tenants SET admin_password = ? WHERE id = ?',
                [newPassword, tenant.id]
            );

            console.log(`\n✅ Tenant Admin credentials ${resetPassword ? 'RESET' : 'created'}:`);
            console.log(`   Email: ${tenant.email}`);
            console.log(`   Password: ${newPassword}`);
        } else {
            console.log(`\n📋 Existing Tenant Admin credentials:`);
            console.log(`   Email: ${tenant.email}`);
            console.log(`   Password: ${tenant.admin_password}`);
        }

        // Show all users in tenant
        const [users] = await tenantDb.query(
            'SELECT id, email, firstName, lastName, role, status FROM users'
        );
        console.log(`\n👥 All users in tenant:`);
        users.forEach(u => {
            console.log(`   - ${u.email} (${u.role}) - ${u.status}`);
        });

        await tenantDb.end();
        await mainDb.end();

        console.log(`\n✅ Done! You can now login to the CRM.`);

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Main execution
const args = process.argv.slice(2);
if (args.length === 0) {
    console.log('Usage: node scripts/setup-tenant-admin.js <tenant_slug> [reset]');
    console.log('Example: node scripts/setup-tenant-admin.js test-ecom');
    console.log('Example: node scripts/setup-tenant-admin.js test-ecom reset');
    process.exit(1);
}

const tenantSlug = args[0];
const resetPassword = args[1] === 'reset';

setupTenantAdmin(tenantSlug, resetPassword);
