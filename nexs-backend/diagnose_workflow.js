const mysql = require('mysql2/promise');
require('dotenv').config();

async function diagnose() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3307,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        console.log('--- Table Schema ---');
        const [workflowCols] = await connection.query('DESCRIBE workflows');
        console.log('Workflows Table:', workflowCols);

        const [nodeCols] = await connection.query('DESCRIBE workflow_nodes');
        console.log('Nodes Table:', nodeCols);

        console.log('\n--- Data Sizes for Workflow 1 ---');
        const [workflows] = await connection.query('SELECT id, name, LENGTH(trigger_config) as trigger_config_size FROM workflows WHERE id = 1');
        console.log('Workflow 1 metadata:', workflows);

        const [nodes] = await connection.query('SELECT id, label, action_type, LENGTH(config) as config_size FROM workflow_nodes WHERE workflow_id = 1');
        console.log('Workflow 1 nodes:', nodes);

        const totalNodeSize = nodes.reduce((sum, n) => sum + (n.config_size || 0), 0);
        console.log(`\nTotal size of all nodes config for Workflow 1: ${totalNodeSize} bytes (~${(totalNodeSize / 1024 / 1024).toFixed(2)} MB)`);

    } catch (error) {
        console.error('Diagnosis failed:', error);
    } finally {
        await connection.end();
    }
}

diagnose();
