#!/usr/bin/env node
/**
 * Brand leak audit (P2-09).
 *
 * The go-live gate for a partner instance. The brand guard in each frontend repo
 * checks SOURCE; this checks the things a partner's customer actually receives:
 * built bundles, rendered email templates, and every hostname the app will call.
 *
 * A source-level guard cannot catch these. A bundle can pick up our domain from a
 * dependency or an env default, and an email template only reveals its branding
 * once rendered with real tokens.
 *
 * Usage:
 *   node scripts/brand-leak-audit.mjs --base-domain partner.com \
 *        --dist ../../Nexspire-admin/dist \
 *        --dist ../../nexcrm-frontend/dist \
 *        --dist ../../nexcrm-storefront/dist
 *
 * Exits non-zero if anything leaks. Prints the manual checklist for the parts that
 * need a live instance and cannot be asserted from here.
 */

import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, extname, relative } from 'node:path';

const args = process.argv.slice(2);
const getAll = (flag) =>
    args.reduce((acc, a, i) => (a === flag && args[i + 1] ? [...acc, args[i + 1]] : acc), []);
const getOne = (flag, fallback = null) => getAll(flag)[0] ?? fallback;

const BASE_DOMAIN = getOne('--base-domain');
const DISTS = getAll('--dist');
const BRAND_NAME = getOne('--brand-name');

if (!BASE_DOMAIN) {
    console.error('--base-domain is required, e.g. --base-domain partner.com');
    process.exit(2);
}

/**
 * Platform identifiers that must never appear in partner-facing output.
 * Deliberately broad: a false positive costs a minute, a miss costs the deal.
 */
const PLATFORM_PATTERNS = [
    /NexCRM/i,
    /NapCRM/i,
    /NapMail/i,
    /Napnix/i,
    /napnix\.in/i,
    /napmailer\.in/i,
    /napnixsolutions/i,
    /Nexspire/i,
];

const SCAN_EXT = new Set(['.js', '.mjs', '.css', '.html', '.json', '.txt', '.svg', '.map']);

/**
 * Known, justified exceptions.
 *
 * Each is a wire identifier rather than display text: renaming it means changing
 * an API contract and a database value, not a string. They are visible only to
 * somebody reading minified JS, so the severity is low - but they are recorded
 * here rather than removed from the pattern list, so the exception stays visible
 * and has to be re-justified when someone reads this file.
 *
 * Remove an entry the moment the underlying identifier is renamed.
 */
const ACCEPTED_RESIDUALS = [
    {
        match: /nexcrm_backend_path/,
        why: 'column name on the servers table; renaming needs a migration and a backend change',
    },
    {
        match: /slug\s*[=:]{1,3}\s*"nexcrm"|\["nexcrm"\]/,
        why: 'product SKU slug in the tool registry; the backend already accepts napcrm as an alias, but the stored value is still nexcrm',
    },
    {
        match: /nexcrm_tenant|nexcrm_domain_|nexcrm_crm_domain_|nexcrm_custom_api_url|nexcrm_android_release_seen_at/,
        why: 'load-bearing localStorage/sessionStorage keys carrying tenant identity and the resolved-domain cache; renaming them would sign existing users out and break tenant resolution mid-session',
    },
    {
        match: /nexcrm_device_fp|nexcrm::fp::/,
        why: 'device-fingerprint storage keys and hash salt; changing the salt invalidates every stored device hash and re-prompts every returning user',
    },
    {
        match: /meta\[name="nexcrm-api-url"\]|nexcrm-api-url/,
        why: 'meta tag name read from already-deployed HTML; renaming it breaks existing custom-domain deploys until every one is rebuilt',
    },
    {
        match: /nexcrm:(services|manufacturing):/,
        why: 'per-industry invoice-defaults storage keys; renaming them orphans the terms, bank details and transport modes a tenant has already saved',
    },
    {
        match: /NEXCRM_BLOCKS/,
        why: 'marker embedded in saved email-template HTML; renaming it orphans every template already stored in a tenant DB',
    },
    {
        match: /"nexcrm",\s*\w+\s*=\s*"napmail"|SKU_CRM|SKU_MAIL/,
        why: 'product SKU constants from src/config/products.js; the backend compares these exact stored values',
    },
    {
        match: /"nexcrm store"|'nexcrm store'/,
        why: 'legacy seeded store names matched to detect a placeholder name; it matches stored data, never displayed',
    },
];

/** Cap per file so one minified bundle cannot bury the rest of the report. */
const MAX_FINDINGS_PER_FILE = 5;

const accepted = [];

const findings = [];
const record = (where, detail, sample) => findings.push({ where, detail, sample });

/** Text files whose contents are scanned. */
function walk(dir, out = []) {
    for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) walk(full, out);
        else if (SCAN_EXT.has(extname(entry))) out.push(full);
    }
    return out;
}

/** Every file, including binaries, for the filename check. */
function walkAll(dir, out = []) {
    for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) walkAll(full, out);
        else out.push(full);
    }
    return out;
}

// ── 1. Built bundles ────────────────────────────────────────────────────────
function auditDist(dist) {
    if (!existsSync(dist)) {
        record('dist', `${dist} does not exist - build it before auditing`, '');
        return;
    }

    // Filenames leak too, and the source guard cannot judge them: public/napnix-logo.png
    // is correct in a Napnix build and a leak in a partner one, reachable at a
    // guessable URL whether or not any page references it.
    for (const file of walkAll(dist)) {
        const name = relative(dist, file);
        for (const pattern of PLATFORM_PATTERNS) {
            if (pattern.test(name)) {
                record('asset', `${name} - filename carries a platform brand`, '');
                break;
            }
        }
    }

    for (const file of walk(dist)) {
        const content = readFileSync(file, 'utf8');
        const rel = relative(dist, file);

        /**
         * Every occurrence is judged on its own context.
         *
         * The previous version took only the first match per pattern and then broke
         * out of the whole file when that match was an accepted residual. A bundle
         * is one file, so a single whitelisted storage key near the top hid every
         * real leak below it - that is exactly how `name@napnix.com`, a hardcoded
         * `napnix.in` host regex and a `napcrm-` download filename all survived an
         * audit that reported one finding.
         */
        const seen = new Set();
        const excused = new Set();
        let recorded = 0;
        let suppressed = 0;

        for (const pattern of PLATFORM_PATTERNS) {
            const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`;
            for (const match of content.matchAll(new RegExp(pattern.source, flags))) {
                const context = content
                    .slice(Math.max(0, match.index - 80), match.index + 80)
                    .replace(/\s+/g, ' ');

                const excuse = ACCEPTED_RESIDUALS.find((r) => r.match.test(context));
                if (excuse) {
                    excused.add(excuse.why);
                    continue;
                }

                // Minified bundles repeat the same string; report each distinct site once.
                const key = `${match[0].toLowerCase()}::${context}`;
                if (seen.has(key)) continue;
                seen.add(key);

                if (recorded >= MAX_FINDINGS_PER_FILE) {
                    suppressed += 1;
                    continue;
                }
                record('bundle', `${rel} contains "${match[0]}"`, context);
                recorded += 1;
            }
        }

        for (const why of excused) accepted.push(`${rel}: ${why}`);
        if (suppressed > 0) {
            record('bundle', `${rel} has ${suppressed} further occurrence(s) beyond the first ${MAX_FINDINGS_PER_FILE}`, '');
        }
    }
}

// ── 2. Hostnames the built app will contact ─────────────────────────────────
// The network tab is the leak a partner notices first, and it survives every
// amount of visual rebranding.
function auditHostnames(dist) {
    if (!existsSync(dist)) return;
    const hosts = new Set();
    for (const file of walk(dist)) {
        if (!['.js', '.mjs', '.html'].includes(extname(file))) continue;
        const content = readFileSync(file, 'utf8');
        for (const m of content.matchAll(/https?:\/\/([a-z0-9.-]+\.[a-z]{2,})/gi)) {
            hosts.add(m[1].toLowerCase());
        }
    }

    // Only OUR infrastructure is a leak. Library documentation links (react.dev,
    // redux.js.org, and so on) are baked into dependency error messages, are not
    // ours, and flagging them just trains people to ignore this audit.
    const informational = [];
    for (const host of hosts) {
        if (host === BASE_DOMAIN || host.endsWith(`.${BASE_DOMAIN}`)) continue;
        if (PLATFORM_PATTERNS.some((p) => p.test(host))) {
            record('hostname', `bundle will contact "${host}" - platform infrastructure`, '');
        } else {
            informational.push(host);
        }
    }

    if (informational.length > 0) {
        console.log(`  Third-party hosts referenced by ${relative(process.cwd(), dist)}:`);
        console.log(`    ${[...new Set(informational)].sort().join(', ')}`);
        console.log('    (not leaks; confirm once that each is an intended dependency)\n');
    }
}

// ── 3. Rendered email templates ─────────────────────────────────────────────
// Source-level checks pass here even when the output leaks, because the branding
// only materialises once tokens are substituted.
async function auditEmailTemplates() {
    process.env.NEXCRM_DOMAIN = BASE_DOMAIN;
    process.env.BRAND_NAME = BRAND_NAME || 'AuditBrand';
    process.env.BRAND_LEGAL_NAME = `${BRAND_NAME || 'AuditBrand'} Ltd`;
    process.env.BRAND_CRM_PRODUCT_NAME = `${BRAND_NAME || 'AuditBrand'} CRM`;
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'audit-only';

    const require = (await import('node:module')).createRequire(import.meta.url);
    let templateLoader;
    let brand;
    try {
        templateLoader = require('../services/template.loader');
        brand = require('../config/brand');
    } catch (error) {
        record('email', `could not load template loader: ${error.message}`, '');
        return;
    }

    const templatesDir = join(process.cwd(), 'templates', 'emails');
    if (!existsSync(templatesDir)) {
        record('email', 'templates/emails not found', '');
        return;
    }

    for (const file of readdirSync(templatesDir)) {
        if (extname(file) !== '.html') continue;
        const raw = readFileSync(join(templatesDir, file), 'utf8');
        const rendered = templateLoader.substituteVariables(raw, brand.templateTokens());

        for (const pattern of PLATFORM_PATTERNS) {
            const match = rendered.match(pattern);
            if (match) {
                const idx = rendered.indexOf(match[0]);
                record(
                    'email',
                    `rendered ${file} contains "${match[0]}"`,
                    rendered.slice(Math.max(0, idx - 60), idx + 60).replace(/\s+/g, ' ')
                );
                break;
            }
        }

        // An unsubstituted token reaching a customer looks broken even though it
        // leaks nothing, so it fails the audit too.
        const leftover = rendered.match(/{{\s*\w+\s*}}/);
        if (leftover) {
            record('email', `rendered ${file} still contains ${leftover[0]}`, '');
        }
    }
}

// ── Run ─────────────────────────────────────────────────────────────────────
console.log(`\nBrand leak audit - base domain: ${BASE_DOMAIN}\n`);

for (const dist of DISTS) {
    auditDist(dist);
    auditHostnames(dist);
}
await auditEmailTemplates();

if (accepted.length > 0) {
    console.log('  Accepted residuals (wire identifiers, see ACCEPTED_RESIDUALS):');
    for (const a of [...new Set(accepted)]) console.log(`    - ${a}`);
    console.log('');
}

if (findings.length === 0) {
    console.log('  Automated checks: PASS\n');
} else {
    console.error(`  Automated checks: ${findings.length} FINDING(S)\n`);
    for (const f of findings) {
        console.error(`  [${f.where}] ${f.detail}`);
        if (f.sample) console.error(`      …${f.sample}…`);
    }
    console.error('');
}

console.log(`Manual checks still required - these need a live instance and a real
tenant, and cannot be asserted from a build:

  [ ] Provision a throwaway tenant end to end on the partner instance
  [ ] Admin panel: every reachable page, light and dark
  [ ] Tenant CRM: every module for that industry
  [ ] Storefront: rendered page and view-source
  [ ] Browser network tab: every request hostname
  [ ] Welcome, invite, password-reset, order and invoice emails -
      body, headers AND Return-Path
  [ ] Invoice / quote PDF header and footer
  [ ] Push notification title and icon
  [ ] Onboarding overlay copy
  [ ] API error responses and any stack trace reaching the client
  [ ] Favicon and manifest
  [ ] DNS records visible to the partner (depends on decision D1)

Record the result in nexcrm-agents/shared/whitelabel-execution-plan.md under P2-09.
`);

process.exit(findings.length === 0 ? 0 : 1);
