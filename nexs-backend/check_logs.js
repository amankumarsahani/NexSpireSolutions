const { pool } = require('./config/database');

async function checkLogs() {
    try {
        const [tables] = await pool.query("SHOW TABLES LIKE '%log%'");
        console.log(tables);
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkLogs();
