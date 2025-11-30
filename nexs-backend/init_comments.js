const { pool } = require('./config/database');

async function init() {
    try {
        console.log('Initializing lead_comments table...');
        await pool.query(`
      CREATE TABLE IF NOT EXISTS lead_comments (
        id INT PRIMARY KEY AUTO_INCREMENT,
        leadId INT NOT NULL,
        comment TEXT NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (leadId) REFERENCES leads(id) ON DELETE CASCADE,
        INDEX idx_lead (leadId)
      );
    `);
        console.log('Lead comments table created successfully');
    } catch (error) {
        console.error('Error creating table:', error);
    } finally {
        process.exit();
    }
}

init();
