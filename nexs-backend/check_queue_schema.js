const db = require('./config/database');

async function check() {
    try {
        const [rows] = await db.query('DESCRIBE email_queue');
        console.log('Columns in email_queue:');
        rows.forEach(row => console.log(`- ${row.Field} (${row.Type})`));
    } catch (error) {
        console.error('Check failed:', error.message);
    }
    process.exit(0);
}

check();
