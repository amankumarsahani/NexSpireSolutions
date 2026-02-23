const mysql = require('mysql2/promise');
require('dotenv').config();

// Create MySQL connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3307,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    authSwitchHandler: function (data, cb) {
        if (data.pluginName === 'auth_gssapi_client') {
            // Bypass this plugin
            const authData = Buffer.from([]);
            cb(null, authData);
        } else if (data.pluginName === 'mysql_clear_password') {
            const authData = Buffer.from(process.env.DB_PASSWORD + '\0');
            cb(null, authData);
        } else {
            cb(new Error(`Unknown Auth Plugin: ${data.pluginName}`));
        }
    }
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
