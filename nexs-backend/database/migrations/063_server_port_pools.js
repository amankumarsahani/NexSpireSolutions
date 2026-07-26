const DEFAULT_PORT_START = 3001;
const DEFAULT_PORT_END = 3050;

async function hasIndex(connection, table, indexName) {
    const [rows] = await connection.query(`SHOW INDEX FROM \`${table}\``);
    return rows.some(row => row.Key_name === indexName);
}

async function seedServerPorts(connection, serverId, start, end) {
    const rows = [];
    for (let port = start; port <= end; port++) {
        rows.push([port, serverId]);
    }

    if (rows.length) {
        await connection.query(
            'INSERT IGNORE INTO port_allocation (port, server_id) VALUES ?',
            [rows]
        );
    }
}

module.exports = {
    async up(connection) {
        await connection.query(`
            ALTER TABLE servers
                ADD COLUMN IF NOT EXISTS port_start INT NOT NULL DEFAULT ${DEFAULT_PORT_START}
                    AFTER cloudflare_config_path,
                ADD COLUMN IF NOT EXISTS port_end INT NOT NULL DEFAULT ${DEFAULT_PORT_END}
                    AFTER port_start
        `);

        // MariaDB SHOW INDEX does not accept a trailing ORDER BY on every
        // supported version. Filter and order the metadata in JavaScript.
        const [indexRows] = await connection.query(
            'SHOW INDEX FROM port_allocation'
        );
        const primaryKeyRows = indexRows
            .filter(row => row.Key_name === 'PRIMARY')
            .sort((left, right) => Number(left.Seq_in_index) - Number(right.Seq_in_index));
        const primaryColumns = primaryKeyRows.map(row => row.Column_name);
        if (primaryColumns.length === 1 && primaryColumns[0] === 'port') {
            await connection.query(`
                ALTER TABLE port_allocation
                    DROP PRIMARY KEY,
                    ADD PRIMARY KEY (server_id, port)
            `);
        }

        if (!await hasIndex(connection, 'port_allocation', 'uq_port_allocation_tenant')) {
            const [duplicateReservations] = await connection.query(`
                SELECT tenant_id, COUNT(*) AS reservation_count
                FROM port_allocation
                WHERE tenant_id IS NOT NULL
                GROUP BY tenant_id
                HAVING COUNT(*) > 1
                LIMIT 1
            `);
            if (duplicateReservations.length > 0) {
                const duplicate = duplicateReservations[0];
                throw new Error(
                    `Cannot enforce one port reservation per tenant: tenant ${duplicate.tenant_id} has ${duplicate.reservation_count} reservations`
                );
            }

            await connection.query(`
                ALTER TABLE port_allocation
                    ADD UNIQUE KEY uq_port_allocation_tenant (tenant_id)
            `);
        }

        const [servers] = await connection.query(
            'SELECT id, port_start, port_end FROM servers'
        );
        for (const server of servers) {
            await seedServerPorts(
                connection,
                server.id,
                Number(server.port_start || DEFAULT_PORT_START),
                Number(server.port_end || DEFAULT_PORT_END)
            );
        }
    }
};
