require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
};

async function updateSchema() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database.');

        // Update Users Table Role Enum
        console.log('Updating users table role enum...');
        await connection.query("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'manager', 'employee') DEFAULT 'employee'");
        console.log('Users table role updated successfully.');

        // Update Team Members Table Status Enum if needed, or other fields
        // The user asked for more columns: Phone, Position. 
        // Schema already has Phone. Position is in team_members. 
        // Let's ensure team_members table has all needed columns.
        // Schema check: team_members has id, name, email, phone, position, department, workload, status, joinDate. 
        // So team_members is fine.

    } catch (error) {
        console.error('Schema update failed:', error);
    } finally {
        if (connection) await connection.end();
    }
}

updateSchema();
