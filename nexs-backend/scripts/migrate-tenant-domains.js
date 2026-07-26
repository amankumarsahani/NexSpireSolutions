/**
 * migrate-tenant-domains.js
 *
 * One-time migration: re-points all existing tenants from old domain → napnix.in
 *
 * What it does per tenant:
 *   1. Creates CNAME DNS records on napnix.in zone:
 *        {slug}-crm-api.napnix.in  → Tunnel (proxied)
 *        {slug}-crm.napnix.in      → Pages (proxied)
 *        {slug}.napnix.in          → Storefront Pages (proxied)
 *   2. Attaches {slug}-crm.napnix.in and {slug}.napnix.in to Pages projects
 *   3. Updates nexcrm_{slug}.settings: crm_url, api_url, storefront_url
 *   4. Updates tenants.cf_dns_record_id with new record ID
 *
 * Does NOT modify the tunnel config — that requires manual update (printed at end).
 *
 * Usage:
 *   node scripts/migrate-tenant-domains.js [--dry-run]
 *
 * Requires .env with:
 *   CLOUDFLARE_API_TOKEN, CLOUDFLARE_ZONE_ID, CLOUDFLARE_TUNNEL_ID,
 *   CLOUDFLARE_ACCOUNT_ID, NEXCRM_DOMAIN (napnix.in),
 *   NEXCRM_PAGES_PROJECT, NEXCRM_STOREFRONT_PROJECT,
 *   DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

const DRY_RUN = process.argv.includes('--dry-run');

const CF_API    = 'https://api.cloudflare.com/client/v4';
const CF_TOKEN  = process.env.CLOUDFLARE_API_TOKEN;
const CF_ZONE   = process.env.CLOUDFLARE_ZONE_ID;
const CF_TUNNEL = process.env.CLOUDFLARE_TUNNEL_ID;
const CF_ACCT   = process.env.CLOUDFLARE_ACCOUNT_ID;
const DOMAIN    = process.env.NEXCRM_DOMAIN || 'napnix.in';
const CRM_PAGES = process.env.NEXCRM_PAGES_PROJECT || 'nexcrm-frontend';
const SF_PAGES  = process.env.NEXCRM_STOREFRONT_PROJECT || 'nexcrm-storefront';

const DB_CONFIG = {
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT || '3306'),
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
};
const MASTER_DB = process.env.DB_NAME || 'napnix';

// ─── Cloudflare helpers ───────────────────────────────────────────────────────

async function cfGet(path) {
    const res = await fetch(`${CF_API}${path}`, {
        headers: { 'Authorization': `Bearer ${CF_TOKEN}` }
    });
    return res.json();
}

async function cfPost(path, body) {
    const res = await fetch(`${CF_API}${path}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${CF_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    return res.json();
}

async function cfDelete(path) {
    const res = await fetch(`${CF_API}${path}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${CF_TOKEN}` }
    });
    return res.json();
}

// Returns existing DNS record ID on napnix.in zone for given name, or null
async function existingDnsRecord(name) {
    const data = await cfGet(`/zones/${CF_ZONE}/dns_records?name=${name}.${DOMAIN}&type=CNAME`);
    return data.result?.[0] ?? null;
}

// Creates CNAME on napnix.in zone. Returns new record ID.
async function createCname(name, target) {
    const fqdn = `${name}.${DOMAIN}`;
    const existing = await existingDnsRecord(name);
    if (existing) {
        console.log(`  [DNS] Already exists: ${fqdn} — skipping`);
        return existing.id;
    }
    if (DRY_RUN) {
        console.log(`  [DRY] Would create CNAME ${fqdn} → ${target}`);
        return 'dry-run-id';
    }
    const data = await cfPost(`/zones/${CF_ZONE}/dns_records`, {
        type: 'CNAME', name, content: target, proxied: true, ttl: 1
    });
    if (!data.success) {
        console.error(`  [DNS] Failed to create ${fqdn}:`, data.errors);
        return null;
    }
    console.log(`  [DNS] Created: ${fqdn} → ${target}`);
    return data.result.id;
}

// Attaches a domain to a Cloudflare Pages project
async function attachToPages(project, domain) {
    if (DRY_RUN) {
        console.log(`  [DRY] Would attach ${domain} → Pages project ${project}`);
        return true;
    }
    const data = await cfPost(
        `/accounts/${CF_ACCT}/pages/projects/${project}/domains`,
        { name: domain }
    );
    if (data.success) {
        console.log(`  [Pages] Attached ${domain} → ${project}`);
        return true;
    }
    if (data.errors?.some(e => e.code === 8000018)) {
        console.log(`  [Pages] ${domain} already attached to ${project}`);
        return true;
    }
    console.error(`  [Pages] Failed to attach ${domain} to ${project}:`, data.errors);
    return false;
}

// ─── Per-tenant DB settings update ───────────────────────────────────────────

async function updateTenantSettings(slug) {
    const dbName = `nexcrm_${slug.replace(/-/g, '_')}`;
    const conn = await mysql.createConnection({ ...DB_CONFIG, database: dbName });
    try {
        const updates = [
            ['crm_url',        `https://${slug}-crm.${DOMAIN}`],
            ['api_url',        `https://${slug}-crm-api.${DOMAIN}`],
            ['storefront_url', `https://${slug}.${DOMAIN}`],
        ];
        for (const [key, value] of updates) {
            if (DRY_RUN) {
                console.log(`  [DRY] Would UPDATE ${dbName}.settings SET ${key} = '${value}'`);
            } else {
                await conn.query(
                    `INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)
                     ON DUPLICATE KEY UPDATE setting_value = ?`,
                    [key, value, value]
                );
                console.log(`  [DB] ${dbName}.settings: ${key} = ${value}`);
            }
        }
    } catch (err) {
        console.warn(`  [DB] Could not update ${dbName}: ${err.message}`);
    } finally {
        await conn.end();
    }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    if (!CF_TOKEN || !CF_ZONE || !CF_TUNNEL || !CF_ACCT) {
        console.error('Missing required env vars: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ZONE_ID, CLOUDFLARE_TUNNEL_ID, CLOUDFLARE_ACCOUNT_ID');
        process.exit(1);
    }

    console.log(`Domain: ${DOMAIN} | Dry run: ${DRY_RUN}\n`);

    const master = await mysql.createConnection({ ...DB_CONFIG, database: MASTER_DB });
    const [tenants] = await master.query(
        `SELECT id, name, slug, assigned_port, cf_dns_record_id, status
         FROM tenants
         WHERE status NOT IN ('cancelled')
         ORDER BY id`
    );
    console.log(`Found ${tenants.length} tenant(s)\n`);

    // Tunnel config changes needed (printed at end — requires manual edit on server)
    const tunnelChanges = [];

    for (const tenant of tenants) {
        const { id, name, slug, assigned_port: port } = tenant;
        console.log(`[${slug}] "${name}" (port ${port})`);

        // 1. DNS: {slug}-crm-api → Tunnel
        const apiRecordId = await createCname(
            `${slug}-crm-api`,
            `${CF_TUNNEL}.cfargotunnel.com`
        );

        // 2. DNS + Pages: {slug}-crm → nexcrm-frontend Pages
        await createCname(`${slug}-crm`, `${CRM_PAGES}.pages.dev`);
        await attachToPages(CRM_PAGES, `${slug}-crm.${DOMAIN}`);

        // 3. DNS + Pages: {slug} → nexcrm-storefront Pages
        await createCname(slug, `${SF_PAGES}.pages.dev`);
        await attachToPages(SF_PAGES, `${slug}.${DOMAIN}`);

        // 4. Update per-tenant DB settings
        await updateTenantSettings(slug);

        // 5. Update master DB cf_dns_record_id
        if (apiRecordId && apiRecordId !== 'dry-run-id' && !DRY_RUN) {
            await master.query(
                'UPDATE tenants SET cf_dns_record_id = ? WHERE id = ?',
                [apiRecordId, id]
            );
            console.log(`  [DB] tenants.cf_dns_record_id updated`);
        }

        // Collect tunnel config change
        if (port) {
            tunnelChanges.push({ slug, port });
        }

        console.log();
    }

    await master.end();

    // ── Print manual tunnel config steps ──────────────────────────────────────
    console.log('═══════════════════════════════════════════════════════');
    console.log('MANUAL STEP: Update /etc/cloudflared/config.yml on server');
    console.log('═══════════════════════════════════════════════════════');
    console.log('Add/update these ingress rules (before the catch-all):');
    console.log('');
    console.log('ingress:');
    console.log(`  - hostname: api.${DOMAIN}`);
    console.log('    service: http://localhost:5000');
    console.log(`  - hostname: registry.${DOMAIN}`);
    console.log('    service: http://localhost:4000');
    for (const { slug, port } of tunnelChanges) {
        console.log(`  - hostname: ${slug}-crm-api.${DOMAIN}`);
        console.log(`    service: http://localhost:${port}`);
    }
    console.log('  - service: http_status:404');
    console.log('');
    console.log('Then restart cloudflared:');
    console.log('  systemd: sudo systemctl restart cloudflared');
    console.log('  Alpine:  sudo rc-service cloudflared restart');
}

main().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
