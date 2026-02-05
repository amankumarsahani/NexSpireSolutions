const { pool } = require('./config/database');

async function migrate() {
    try {
        console.log('Altering payments table...');
        await pool.query(`
            ALTER TABLE payments 
            ADD COLUMN stripe_payment_id VARCHAR(100) NULL AFTER razorpay_signature,
            ADD COLUMN stripe_session_id VARCHAR(100) NULL AFTER stripe_payment_id
        `);
        console.log('Migration successful');
        process.exit(0);
    } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('Columns already exist');
            process.exit(0);
        }
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
