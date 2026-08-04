/**
 * Partner billing rollup (P4-01).
 *
 * Turns the read-only tenant mirror into a billable period for one partner.
 *
 * The billing MODEL is still an open decision (D5), so this deliberately computes
 * the inputs and supports all three shapes rather than hardcoding one. What is not
 * negotiable, and is the reason this file is careful, is the data-quality gate:
 *
 *   - A stale instance is not billed. Its figures are a snapshot of whenever it
 *     last reported, which may be days old.
 *   - A tenant with an unknown usage counter is not billed on that counter. NULL
 *     means the sweep could not measure it, not that it was zero.
 *
 * Both produce a REFUSAL with a reason, never a silent zero. Under-billing is
 * recoverable by rerunning; billing a customer for fabricated usage is not.
 */

const { pool } = require('../config/database');

// Matches the staleness threshold used by the sweep and the fleet query.
const STALE_AFTER_MINUTES = 45;

const MODELS = {
    /** A flat price for every active tenant. */
    wholesale: (ctx) => ({
        basis: 'active tenants',
        quantity: ctx.tenantsActive,
        unitPrice: ctx.instance.wholesale_price_monthly,
        amount: ctx.instance.wholesale_price_monthly === null
            ? null
            : Number(ctx.instance.wholesale_price_monthly) * ctx.tenantsActive,
    }),

    /** A percentage of what the partner bills their own customers. */
    revshare: (ctx) => ({
        basis: 'partner revenue share',
        quantity: ctx.tenantsActive,
        unitPrice: null,
        // Cannot be computed here: we do not know what the partner charges their
        // customers. That is their price book (P4-02), which they own.
        amount: null,
        needs: 'partner-reported revenue for the period',
    }),

    /** One fee for the instance, regardless of tenant count. */
    flat: (ctx) => ({
        basis: 'flat platform fee',
        quantity: 1,
        unitPrice: ctx.instance.wholesale_price_monthly,
        amount: ctx.instance.wholesale_price_monthly === null
            ? null
            : Number(ctx.instance.wholesale_price_monthly),
    }),
};

/**
 * Build a billing statement for one partner instance.
 *
 * Returns `{ billable: false, refusals: [...] }` when the data cannot support an
 * invoice. Callers must not fall back to charging zero.
 */
async function buildStatement(instanceId, { periodStart, periodEnd } = {}) {
    const [[instance]] = await pool.query(
        `SELECT *,
                (last_seen_at IS NULL
                  OR last_seen_at < DATE_SUB(NOW(), INTERVAL ? MINUTE)) AS is_stale
           FROM partner_instances WHERE id = ?`,
        [STALE_AFTER_MINUTES, instanceId]
    );
    if (!instance) throw new Error(`No partner instance with id ${instanceId}`);

    const [tenants] = await pool.query(
        `SELECT tenant_slug, name, status, plan_slug, users, storage_mb,
                emails_sent_30d, usage_collected_at, last_synced_at, is_stale
           FROM partner_tenant_mirror WHERE instance_id = ? ORDER BY tenant_slug`,
        [instanceId]
    );

    const refusals = [];

    if (Number(instance.is_stale) === 1) {
        refusals.push({
            code: 'instance_stale',
            detail: instance.last_seen_at
                ? `Instance last reported at ${new Date(instance.last_seen_at).toISOString()}; its figures are not current.`
                : 'Instance has never reported.',
        });
    }

    if (instance.status !== 'active') {
        refusals.push({
            code: 'instance_not_active',
            detail: `Instance status is "${instance.status}".`,
        });
    }

    const staleTenants = tenants.filter((t) => Number(t.is_stale) === 1);
    if (staleTenants.length > 0) {
        refusals.push({
            code: 'stale_tenants',
            detail: `${staleTenants.length} tenant(s) carry data from a sync that has since gone stale: ${staleTenants.map((t) => t.tenant_slug).join(', ')}.`,
        });
    }

    // Only counters that actually feed a charge matter. Unknown storage on a
    // per-tenant flat model is untidy, not a billing error, so it is reported as a
    // gap rather than a refusal.
    const unmeasured = tenants.filter((t) => t.users === null);
    const gaps = tenants
        .filter((t) => t.storage_mb === null || t.emails_sent_30d === null)
        .map((t) => t.tenant_slug);

    if (unmeasured.length > 0) {
        refusals.push({
            code: 'unmeasured_usage',
            detail: `${unmeasured.length} tenant(s) have no measured user count: ${unmeasured.map((t) => t.tenant_slug).join(', ')}. NULL means the usage sweep could not read that tenant's database, not that it is empty.`,
        });
    }

    const tenantsActive = tenants.filter((t) => t.status === 'active').length;
    const model = MODELS[instance.billing_model] || MODELS.wholesale;
    const line = model({ instance, tenants, tenantsActive });

    if (line.amount === null && refusals.length === 0) {
        refusals.push({
            code: 'model_incomplete',
            detail: line.needs
                ? `The ${instance.billing_model} model needs ${line.needs}.`
                : `No price is configured for the ${instance.billing_model} model.`,
        });
    }

    return {
        instance: {
            id: instance.id,
            slug: instance.slug,
            name: instance.name,
            billing_model: instance.billing_model,
        },
        period: { start: periodStart || null, end: periodEnd || null },
        tenants: {
            total: tenants.length,
            active: tenantsActive,
            suspended: tenants.filter((t) => t.status === 'suspended').length,
        },
        usage: {
            users: tenants.reduce((sum, t) => (t.users === null ? sum : sum + t.users), 0),
            storage_mb: tenants.reduce((sum, t) => (t.storage_mb === null ? sum : sum + t.storage_mb), 0),
            emails_sent_30d: tenants.reduce((sum, t) => (t.emails_sent_30d === null ? sum : sum + t.emails_sent_30d), 0),
            // Stated plainly so a total is never mistaken for a complete one.
            incomplete_for: gaps,
        },
        line,
        billable: refusals.length === 0,
        refusals,
    };
}

module.exports = { buildStatement, MODELS, STALE_AFTER_MINUTES };
