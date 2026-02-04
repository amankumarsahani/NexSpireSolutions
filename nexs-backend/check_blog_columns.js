const mysql = require('mysql2/promise');
require('dotenv').config();

async function check() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD,
            database: 'nexspire_crm_test'
        });

        const [rows] = await connection.execute("SHOW COLUMNS FROM blogs");
        console.log('Blogs Columns:', rows.map(r => r.Field));

        await connection.end();
    } catch (e) {
        console.error('Error:', e);
    }
}
check();
