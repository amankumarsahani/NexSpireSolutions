const { pool } = require('./config/database');

async function checkSchema() {
    try {
        const [columns] = await pool.query('DESCRIBE payments');
        console.log(columns);
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkSchema();
