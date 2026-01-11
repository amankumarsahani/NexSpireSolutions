const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

async function createAdmin() {
    try {
        const email = 'admin@nexspiresolutions.co.in';
        const password = 'admin123';
        const first_name = 'Admin';
        const last_name = 'User';
        const role = 'admin';

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        console.log('Creating admin user...');
        console.log('Email:', email);
        console.log('Password:', password);
        console.log('Hashed password:', hashedPassword);

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
        console.log('Password:', password);

        process.exit(0);
    } catch (error) {
        console.error('Error creating admin user:', error);
        process.exit(1);
    }
}

createAdmin();
