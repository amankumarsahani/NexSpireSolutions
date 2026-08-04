#!/usr/bin/env node
/**
 * Bootstrap a whitelabel partner instance (P2-05, P2-06).
 *
 * Turns the provisioning runbook into one command. Two modes:
 *
 *   generate  Mint an instance's secrets and write its .env
 *   check     Audit an existing .env before or after deploy
 *
 * The `check` mode exists because the dangerous failure here is silent: a partner
 * instance missing NEXCRM_DOMAIN still boots perfectly and simply serves our
 * domain to their customers. Every default in config/brand.js is a Napnix value,
 * which is correct for us and a leak for them, so the absence of a variable has to
 * be an error rather than a fallback.
 *
 * Usage:
 *   node scripts/bootstrap-partner-instance.mjs generate \
 *        --slug acme --name "Acme Software" --base-domain partner.com
 *
 *   node scripts/bootstrap-partner-instance.mjs check --env /path/to/.env
 */

import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const [mode, ...rest] = process.argv.slice(2);

const flag = (name, fallback = null) => {
    const i = rest.indexOf(`--${name}`);
    return i !== -1 && rest[i + 1] ? rest[i + 1] : fallback;
};
const has = (name) => rest.includes(`--${name}`);

const secret = (bytes = 32) => randomBytes(bytes).toString('hex');

/**
 * Values that must never survive into a partner instance.
 * Checked as substrings so a half-edited copy of our own .env is caught.
 */
const FORBIDDEN_SUBSTRINGS = ['napnix', 'nexspire', 'napmailer'];

/** Required on a whitelabel instance. A missing one silently falls back to ours. */
const REQUIRED_WHITELABEL = [
    'EDITION',
    'NEXCRM_DOMAIN',
    'BRAND_SLUG',
    'BRAND_NAME',
    'BRAND_LEGAL_NAME',
    'JWT_SECRET',
    'PUBLIC_CRYPTO_SECRET',
    'DB_NAME',
    'DB_USER',
    'DB_PASSWORD',
    'CLOUDFLARE_API_TOKEN',
    'CLOUDFLARE_ZONE_ID',
    'CLOUDFLARE_ACCOUNT_ID',
    'NEXCRM_PAGES_PROJECT',
    'NEXCRM_STOREFRONT_PROJECT',
    'REGISTRY_URL',
    'REGISTRY_API_KEY',
    'PARTNER_SLUG',
    'PARTNER_SYNC_URL',
    'PARTNER_SYNC_SECRET',
    'SMTP_FROM_EMAIL',
    'PLATFORM_ADMIN_EMAIL',
];

function parseEnv(text) {
    const out = {};
    for (const line of text.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eq = trimmed.indexOf('=');
        if (eq === -1) continue;
        out[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
    }
    return out;
}

// ── generate ────────────────────────────────────────────────────────────────
function generate() {
    const slug = flag('slug');
    const name = flag('name');
    const baseDomain = flag('base-domain');
    const out = resolve(flag('out', `./.env.${slug || 'partner'}`));

    if (!slug || !name || !baseDomain) {
        console.error('Required: --slug <slug> --name "<name>" --base-domain <domain>');
        process.exit(2);
    }
    if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
        console.error('--slug must be lowercase alphanumeric with dashes');
        process.exit(2);
    }
    for (const bad of FORBIDDEN_SUBSTRINGS) {
        if (baseDomain.toLowerCase().includes(bad)) {
            console.error(`--base-domain "${baseDomain}" contains "${bad}" - that is our domain, not the partner's`);
            process.exit(2);
        }
    }
    if (existsSync(out) && !has('force')) {
        console.error(`${out} already exists. Refusing to overwrite - pass --force if you mean it.`);
        console.error('Overwriting rotates every secret and orphans the running instance.');
        process.exit(2);
    }

    const syncSecret = secret();
    const upper = slug.toUpperCase().replace(/[^A-Z0-9]/g, '_');

    // Every secret is minted fresh. Reusing ours across instances would mean a
    // token issued on one partner's install is valid on another's.
    const env = `# ${name} - whitelabel partner instance
# Generated ${new Date().toISOString()} by scripts/bootstrap-partner-instance.mjs
#
# Every secret below is unique to this instance. Do not copy values between
# instances: a JWT signed on one would then be accepted by another.

EDITION=whitelabel

# ─── Brand ───────────────────────────────────────────────────────────────────
BRAND_SLUG=${slug}
BRAND_NAME=${name}
BRAND_LEGAL_NAME=${name}
BRAND_CRM_PRODUCT_NAME=${name} CRM
BRAND_MAIL_PRODUCT_NAME=${name} Mail
BRAND_SUPPORT_EMAIL=support@${baseDomain}
NEXCRM_DOMAIN=${baseDomain}
WEBSITE_URL=https://${baseDomain}
ADMIN_PANEL_URL=https://admin.${baseDomain}
API_URL=https://api.${baseDomain}

# Add-ons. Blank means off for a whitelabel instance (decision D4).
FEATURE_NAPMAIL=
FEATURE_WHATSAPP=
FEATURE_NAPLEAD=

# ─── Secrets (unique per instance) ───────────────────────────────────────────
JWT_SECRET=${secret(48)}
PUBLIC_CRYPTO_SECRET=${secret()}
REGISTRY_API_KEY=${secret()}
DB_PASSWORD=${secret(24)}

# ─── Database ────────────────────────────────────────────────────────────────
DB_HOST=localhost
DB_PORT=3306
DB_NAME=${slug.replace(/-/g, '_')}
DB_USER=${slug.replace(/-/g, '_')}

# ─── Cloudflare (dedicated account we own - decision D1) ─────────────────────
CLOUDFLARE_API_TOKEN=
CLOUDFLARE_ZONE_ID=
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_TUNNEL_ID=
NEXCRM_PAGES_PROJECT=${slug}-crm
NEXCRM_PAGES_URL=${slug}-crm.pages.dev
NEXCRM_STOREFRONT_PROJECT=${slug}-storefront
NEXCRM_STOREFRONT_PAGES_URL=${slug}-storefront.pages.dev

# ─── Registry ────────────────────────────────────────────────────────────────
REGISTRY_URL=https://registry.${baseDomain}

# ─── Mail (SES identity for ${baseDomain} must be verified first) ────────────
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM_EMAIL=noreply@${baseDomain}
SMTP_FROM_NAME=${name}

# ─── Superadmin bootstrap ────────────────────────────────────────────────────
PLATFORM_ADMIN_EMAIL=admin@${baseDomain}
# create-admin.js refuses to run without this. Minimum 12 characters.
PLATFORM_ADMIN_PASSWORD=

# ─── Partner sync (reports up to the master) ─────────────────────────────────
PARTNER_SLUG=${slug}
PARTNER_SYNC_URL=https://api.napnix.in/api/partner-sync/report
PARTNER_SYNC_SECRET=${syncSecret}

# ─── Tenant provisioning ─────────────────────────────────────────────────────
NEXCRM_BACKEND_PATH=/var/www/html/${slug}-backend
`;

    writeFileSync(out, env);

    console.log(`\nWrote ${out}\n`);
    console.log('Still blank, and deliberately so - each needs a human action:');
    console.log('  CLOUDFLARE_API_TOKEN / ZONE_ID / ACCOUNT_ID / TUNNEL_ID');
    console.log('  SMTP_HOST / SMTP_USER / SMTP_PASS   (after SES DKIM verification)');
    console.log('  PLATFORM_ADMIN_PASSWORD             (min 12 chars)\n');
    console.log('Register this instance on the master, then set its secret there:');
    console.log(`  POST /api/partners  { "slug": "${slug}", "name": "${name}", "base_domain": "${baseDomain}" }`);
    console.log('  The master mints its own secret and shows it once. Replace');
    console.log(`  PARTNER_SYNC_SECRET in ${out} with that value - the one generated`);
    console.log('  here is only a placeholder so the file is complete.\n');
    console.log('Then create the matching brand file in each frontend:');
    console.log(`  Nexspire-admin/brands/${slug}.json`);
    console.log(`  nexcrm-frontend/brands/${slug}.json   (+ public/brand/${slug}/ assets)`);
    console.log(`  nexcrm-storefront/brands/${slug}.json\n`);
    console.log('Verify before go-live:');
    console.log(`  node scripts/bootstrap-partner-instance.mjs check --env ${out}`);
    console.log(`  node scripts/brand-leak-audit.mjs --base-domain ${baseDomain} --dist ...\n`);
}

// ── check ───────────────────────────────────────────────────────────────────
function check() {
    const file = resolve(flag('env', './.env'));
    if (!existsSync(file)) {
        console.error(`${file} not found`);
        process.exit(2);
    }

    const env = parseEnv(readFileSync(file, 'utf8'));
    const problems = [];
    const warnings = [];

    if (env.EDITION !== 'whitelabel') {
        console.log(`\nEDITION=${env.EDITION || '(unset)'} - not a whitelabel instance, checking basics only.\n`);
    }

    const isWhitelabel = env.EDITION === 'whitelabel';

    if (isWhitelabel) {
        for (const key of REQUIRED_WHITELABEL) {
            if (!env[key]) problems.push(`${key} is missing or empty`);
        }

        // The real failure mode: a value left pointing at us still works, so it is
        // never noticed until a partner's customer sees our domain.
        for (const [key, value] of Object.entries(env)) {
            if (key === 'PARTNER_SYNC_URL') continue; // legitimately points at the master
            const lower = String(value).toLowerCase();
            for (const bad of FORBIDDEN_SUBSTRINGS) {
                if (lower.includes(bad)) {
                    problems.push(`${key} still contains "${bad}": ${value}`);
                }
            }
        }

        if (env.PARTNER_SYNC_URL && !env.PARTNER_SYNC_URL.includes('/api/partner-sync/report')) {
            problems.push('PARTNER_SYNC_URL does not point at /api/partner-sync/report');
        }
        if (env.PLATFORM_ADMIN_PASSWORD && env.PLATFORM_ADMIN_PASSWORD.length < 12) {
            problems.push('PLATFORM_ADMIN_PASSWORD is shorter than 12 characters');
        }
        if (env.NEXCRM_PAGES_PROJECT && env.BRAND_SLUG
            && !env.NEXCRM_PAGES_PROJECT.startsWith(env.BRAND_SLUG)) {
            warnings.push(`NEXCRM_PAGES_PROJECT "${env.NEXCRM_PAGES_PROJECT}" does not start with the brand slug - partners can see project names`);
        }
    }

    // Distinct secrets, whatever the edition. Identical values here mean a token
    // minted for one purpose is valid for another.
    const secrets = ['JWT_SECRET', 'PUBLIC_CRYPTO_SECRET', 'REGISTRY_API_KEY', 'PARTNER_SYNC_SECRET'];
    const seen = new Map();
    for (const key of secrets) {
        const value = env[key];
        if (!value) continue;
        if (value.length < 24) problems.push(`${key} is suspiciously short (${value.length} chars)`);
        if (seen.has(value)) problems.push(`${key} has the same value as ${seen.get(value)}`);
        seen.set(value, key);
    }

    console.log(`\nChecking ${file}\n`);
    if (warnings.length > 0) {
        for (const w of warnings) console.log(`  warn  ${w}`);
        console.log('');
    }
    if (problems.length === 0) {
        console.log('  PASS - no configuration problems found.\n');
        process.exit(0);
    }
    for (const p of problems) console.error(`  FAIL  ${p}`);
    console.error(`\n${problems.length} problem(s). This instance would serve our identity to a partner's customers.\n`);
    process.exit(1);
}

if (mode === 'generate') generate();
else if (mode === 'check') check();
else {
    console.error(`Usage:
  bootstrap-partner-instance.mjs generate --slug <slug> --name "<name>" --base-domain <domain> [--out <path>] [--force]
  bootstrap-partner-instance.mjs check --env <path>`);
    process.exit(2);
}
