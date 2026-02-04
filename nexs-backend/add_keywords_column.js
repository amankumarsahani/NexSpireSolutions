const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD,
            database: 'nexspire_crm_test'
        });

        console.log('Connected to DB. Checking for keywords column...');

        const [rows] = await connection.execute("SHOW COLUMNS FROM blogs LIKE 'keywords'");

        if (rows.length === 0) {
            console.log('Adding keywords column...');
            await connection.execute("ALTER TABLE blogs ADD COLUMN keywords JSON DEFAULT NULL AFTER category");
            console.log('Column keywords added successfully (as JSON).');
        } else {
            console.log('Column keywords already exists.');
        }

        await connection.end();
    } catch (e) {
        console.error('Migration Error:', e);
        process.exit(1);
    }
}
migrate();
