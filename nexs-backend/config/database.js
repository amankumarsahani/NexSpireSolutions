const mysql = require('mysql2/promise');
require('dotenv').config();

// Create MySQL connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

// Test database connection
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✓ MySQL Database connected successfully');
        connection.release();
        return true;
    } catch (error) {
        console.error('✗ MySQL Database connection failed:', error.message);
        return false;
    }
};

// Wrapper for query method
const query = (sql, params) => {
    return pool.query(sql, params);
};

module.exports = { pool, testConnection, query };
