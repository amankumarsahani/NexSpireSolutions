const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const brand = require('../config/brand');

/**
 * Creates (or resets) the platform superadmin account.
 *
 * The email and password used to be hardcoded to admin@napnix.in / admin123. That
 * was survivable while this only ever ran on a Napnix dev box, but the whitelabel
 * rollout runs it on every partner production server during provisioning (task
 * P2-06), so the password is now required from the environment and there is no
 * default left to forget to change.
 */
async function createAdmin() {
    const email = process.env.PLATFORM_ADMIN_EMAIL || brand.platformAdminEmail;
    const password = process.env.PLATFORM_ADMIN_PASSWORD;
    const first_name = process.env.PLATFORM_ADMIN_FIRST_NAME || 'Admin';
    const last_name = process.env.PLATFORM_ADMIN_LAST_NAME || 'User';
    const role = 'admin';

    if (!password) {
        console.error('PLATFORM_ADMIN_PASSWORD is not set.');
        console.error('Refusing to create an admin account with a default password.');
        console.error('Set it in the environment and re-run, e.g.:');
        console.error('  PLATFORM_ADMIN_PASSWORD=... node scripts/create-admin.js');
        process.exit(1);
    }

    if (password.length < 12) {
        console.error('PLATFORM_ADMIN_PASSWORD must be at least 12 characters.');
        process.exit(1);
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        console.log('Creating admin user...');
        console.log('Email:', email);

        // Delete existing admin user if exists
        await pool.query('DELETE FROM users WHERE email = ?', [email]);
        console.log('Deleted existing admin user (if any)');

        // Insert new admin user
        const [result] = await pool.query(
            `INSERT INTO users (email, password, first_name, last_name, role, status)
             VALUES (?, ?, ?, ?, ?, 'active')`,
            [email, hashedPassword, first_name, last_name, role]
        );

        console.log('Admin user created successfully!');
        console.log('User ID:', result.insertId);
        console.log('\nYou can now login with:');
        console.log('Email:', email);
        console.log('Password: (the value of PLATFORM_ADMIN_PASSWORD)');

        process.exit(0);
    } catch (error) {
        console.error('Error creating admin user:', error);
        process.exit(1);
    }
}

createAdmin();
