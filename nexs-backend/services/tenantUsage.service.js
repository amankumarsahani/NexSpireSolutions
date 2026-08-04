/**
 * Per-tenant usage collection (P4-01 prerequisite).
 *
 * Usage lives in each tenant's own database, not in the instance's master
 * database, so gathering it means querying every tenant DB in turn. The sync
 * worker previously omitted these figures rather than reporting zeros - a zero is
 * indistinguishable from "this tenant genuinely sent no email", and billing from
 * a fabricated zero is worse than billing from nothing.
 *
 * That principle drives the whole design here: a tenant whose database is
 * unreachable, mid-migration, or missing a table reports `null` for the affected
 * counter, never 0. Null means "unknown" all the way up to the billing rollup,
 * which must then refuse to bill rather than quietly charge for nothing.
 *
 * Runs on a partner instance (and on ours), on a slow cadence. It is deliberately
 * defensive: one broken tenant must not stop the other forty being counted, and
 * nothing here may run on a request path.
 */

const mysql = require('mysql2/promise');
const { pool } = require('../config/database');

// A usage sweep is housekeeping. It gets a small, separate connection budget so it
// can never exhaust the pool that is serving real traffic.
const SWEEP_CONNECTION_LIMIT = 2;
const PER_TENANT_TIMEOUT_MS = 10000;

/**
 * Count one tenant's usage.
 *
 * Every counter is independently guarded: a tenant missing the email module still
 * reports its user count. Returning a partial row beats returning nothing.
 */
async function collectForTenant(dbName) {
    const usage = {
        users: null,
        storage_mb: null,
        emails_sent_30d: null,
    };

    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: Number(process.env.DB_PORT) || 3306,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: dbName,
            connectTimeout: PER_TENANT_TIMEOUT_MS,
        });
    } catch (error) {
        // Unreachable database. Everything stays null: we do not know, and saying
        // "0 users" here would be a lie that reaches an invoice.
        console.warn(`[TenantUsage] ${dbName}: cannot connect (${error.code || error.message})`);
        return usage;
    }

    try {
        try {
            const [[row]] = await connection.query(
                "SELECT COUNT(*) AS n FROM users WHERE status = 'active'"
            );
            usage.users = Number(row.n);
        } catch (error) {
            console.warn(`[TenantUsage] ${dbName}: users unavailable (${error.code})`);
        }

        try {
            const [[row]] = await connection.query(
                `SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024) AS mb
                   FROM information_schema.TABLES WHERE table_schema = ?`,
                [dbName]
            );
            usage.storage_mb = row && row.mb !== null ? Number(row.mb) : null;
        } catch (error) {
            console.warn(`[TenantUsage] ${dbName}: storage unavailable (${error.code})`);
        }

        try {
            // Only genuinely dispatched mail counts. Queued or failed messages were
            // never sent, so charging for them would be wrong.
            const [[row]] = await connection.query(
                `SELECT COUNT(*) AS n FROM email_messages
                  WHERE direction = 'outbound'
                    AND delivery_status IN ('sent', 'delivered')
                    AND sent_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`
            );
            usage.emails_sent_30d = Number(row.n);
        } catch (error) {
            // Tenants without the email module simply do not have this table. That
            // is a legitimate zero rather than an unknown.
            if (error.code === 'ER_NO_SUCH_TABLE') usage.emails_sent_30d = 0;
            else console.warn(`[TenantUsage] ${dbName}: email counts unavailable (${error.code})`);
        }
    } finally {
        try { await connection.end(); } catch { /* already closed */ }
    }

    return usage;
}

/**
 * Sweep every tenant on this instance.
 *
 * Sequential on purpose. A parallel sweep across forty tenant databases would
 * spike connections on the same MariaDB that is serving those tenants, to save
 * time on a job that runs hourly and that nothing is waiting for.
 */
async function collectAll() {
    const [tenants] = await pool.query(
        `SELECT slug, db_name FROM tenants
          WHERE db_name IS NOT NULL AND status IN ('active', 'trial', 'suspended')`
    );

    const results = {};
    for (const tenant of tenants) {
        results[tenant.slug] = await collectForTenant(tenant.db_name);
    }
    return results;
}

module.exports = { collectForTenant, collectAll, SWEEP_CONNECTION_LIMIT };
