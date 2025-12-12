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

        // 1. Create Activities Table
        console.log('Creating activities table...');
        const createActivitiesTable = `
            CREATE TABLE IF NOT EXISTS activities (
                id INT PRIMARY KEY AUTO_INCREMENT,
                entityType ENUM('inquiry', 'lead', 'client', 'project') NOT NULL,
                entityId INT NOT NULL,
                type ENUM('note', 'call', 'email', 'status_change', 'creation') NOT NULL,
                summary VARCHAR(255),
                details TEXT,
                performedBy INT,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (performedBy) REFERENCES users(id) ON DELETE SET NULL,
                INDEX idx_entity (entityType, entityId)
            );
        `;
        await connection.query(createActivitiesTable);
        console.log('Activities table created/verified.');

        // 2. Add originalInquiryId to leads
        console.log('Checking leads table columns...');
        const [leadColumns] = await connection.query("SHOW COLUMNS FROM leads LIKE 'originalInquiryId'");
        if (leadColumns.length === 0) {
            console.log('Adding originalInquiryId to leads...');
            await connection.query("ALTER TABLE leads ADD COLUMN originalInquiryId INT NULL");
            // Optional: Foreign Key if inquiries table has ID. Assuming inquiries table exists from previous context (viewed Inquiries.jsx but schema showed it missing? wait, schema.sql I viewed earlier didn't show inquiries table on lines 1-141. Let me double check if inquiries table exists. Inquiries.jsx fetches from it, so it must exist or needs creation. I'll check schema again or just add column safe-ishly).
            // Actually, looking at schema.sql viewed in step 434, "Inquiries table" was NOT there.
            // But Inquiries.jsx fetches from /api/inquiries.
            // It's possible I missed it or it's further down.
            // PROCEED assumption: inquiries table exists. If not, this FK might fail. I will add column without FK constraint strictly first to be safe, or just index it.
        } else {
            console.log('originalInquiryId already exists in leads.');
        }

        // 3. Add originalLeadId to clients
        console.log('Checking clients table columns...');
        const [clientColumns] = await connection.query("SHOW COLUMNS FROM clients LIKE 'originalLeadId'");
        if (clientColumns.length === 0) {
            console.log('Adding originalLeadId to clients...');
            await connection.query("ALTER TABLE clients ADD COLUMN originalLeadId INT NULL");
        } else {
            console.log('originalLeadId already exists in clients.');
        }

        console.log('Schema update complete.');

    } catch (error) {
        console.error('Schema update failed:', error);
    } finally {
        if (connection) await connection.end();
    }
}

updateSchema();
