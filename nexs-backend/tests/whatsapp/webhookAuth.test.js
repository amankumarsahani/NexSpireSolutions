/**
 * WhatsApp webhook signature verification.
 *
 * This is the security boundary for every inbound WhatsApp message on the platform.
 * The property under test is one-directional: a mistake must reject a real payload,
 * never accept a forged one. In particular, one tenant holding a valid signature
 * must not be able to authorise entries for a number they do not own.
 */

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const Module = require('node:module');

// The module reaches for a pool at require time; nothing under test uses it.
const originalLoad = Module._load;
Module._load = function patched(request, parent, isMain) {
    if (request === '../config/database') return { pool: { query: async () => [[]] } };
    if (request === './whatsapp.service') return { decryptToken: (v) => v };
    return originalLoad.apply(this, arguments);
};

const { verifySignature, candidateSecrets, phoneIdsIn } = require('../../services/whatsappWebhookAuth');

Module._load = originalLoad;

const PLATFORM_SECRET = 'platform-app-secret';
const TENANT_SECRET = 'tenant-own-app-secret';

const sign = (body, secret) =>
    'sha256=' + crypto.createHmac('sha256', secret).update(body).digest('hex');

/** Registry rows keyed by phone id, as loadRegistry returns them. */
const registryOf = (...rows) => new Map(rows.map((r) => [String(r.meta_phone_id), r]));

const platformRow = (id) => ({ meta_phone_id: id, app_mode: 'platform', app_secret: null, tenant_api_url: `https://${id}.example` });
const tenantRow = (id, secret = TENANT_SECRET) => ({ meta_phone_id: id, app_mode: 'tenant', app_secret: secret, tenant_api_url: `https://${id}.example` });

const deps = { decrypt: (v) => v, platformSecret: PLATFORM_SECRET };

function run() {
    const body = Buffer.from(JSON.stringify({ entry: [{ changes: [{ value: { metadata: { phone_number_id: '111' } } }] }] }));

    // ---- platform-app numbers (the pre-existing behaviour) ----------------
    {
        const registry = registryOf(platformRow('111'));

        const ok = verifySignature(sign(body, PLATFORM_SECRET), body, registry, deps);
        assert.deepEqual([...ok], ['111']);

        const wrong = verifySignature(sign(body, 'not-the-secret'), body, registry, deps);
        assert.equal(wrong.size, 0, 'a bad signature must verify nothing');

        assert.equal(verifySignature('', body, registry, deps).size, 0);
        assert.equal(verifySignature(sign(body, PLATFORM_SECRET), null, registry, deps).size, 0);

        // A signature over different bytes must not verify — this is what stops
        // replaying a captured signature against a modified body.
        const tampered = Buffer.from(body.toString().replace('111', '222'));
        assert.equal(verifySignature(sign(body, PLATFORM_SECRET), tampered, registry, deps).size, 0);
    }

    // ---- bring-your-own Meta App (the bug this fixes) ---------------------
    {
        const registry = registryOf(tenantRow('222'));

        // Before this change the global secret was the only one tried, so a
        // tenant-signed payload was dropped as a mismatch and inbound silently
        // never worked for these numbers.
        const platformSigned = verifySignature(sign(body, PLATFORM_SECRET), body, registry, deps);
        assert.equal(platformSigned.size, 0, 'platform secret must NOT verify a tenant-app number');

        const tenantSigned = verifySignature(sign(body, TENANT_SECRET), body, registry, deps);
        assert.deepEqual([...tenantSigned], ['222'], 'tenant secret verifies its own number');
    }

    // ---- cross-tenant isolation -------------------------------------------
    {
        // Two numbers on two different apps, both referenced by one body. Only the
        // entries belonging to the secret that actually signed it may be processed.
        const registry = registryOf(tenantRow('222'), tenantRow('333', 'a-third-app-secret'));

        const signedByTenantA = verifySignature(sign(body, TENANT_SECRET), body, registry, deps);
        assert.deepEqual([...signedByTenantA], ['222'],
            "one tenant's signature must not authorise another tenant's number");

        // Mixed platform + tenant: the platform signature covers only its own.
        const mixed = registryOf(platformRow('111'), tenantRow('222'));
        assert.deepEqual([...verifySignature(sign(body, PLATFORM_SECRET), body, mixed, deps)], ['111']);
        assert.deepEqual([...verifySignature(sign(body, TENANT_SECRET), body, mixed, deps)], ['222']);
    }

    // ---- fail-closed behaviour -------------------------------------------
    {
        // Registered as tenant-app but the secret is missing: must verify nothing
        // rather than quietly falling back to the platform secret, which would
        // accept forged payloads for that number.
        const noSecret = registryOf({ meta_phone_id: '444', app_mode: 'tenant', app_secret: null });
        assert.equal(candidateSecrets(noSecret, deps).size, 0);
        assert.equal(verifySignature(sign(body, PLATFORM_SECRET), body, noSecret, deps).size, 0);

        // Secret present but undecryptable: same rule.
        const badSecret = registryOf(tenantRow('555'));
        const throwingDeps = { decrypt: () => { throw new Error('bad key'); }, platformSecret: PLATFORM_SECRET };
        assert.equal(verifySignature(sign(body, TENANT_SECRET), body, badSecret, throwingDeps).size, 0);

        // No platform secret configured at all: platform numbers verify nothing.
        const registry = registryOf(platformRow('111'));
        assert.equal(verifySignature(sign(body, PLATFORM_SECRET), body, registry,
            { decrypt: (v) => v, platformSecret: null }).size, 0);

        // Empty registry — an unregistered number cannot be verified into existence.
        assert.equal(verifySignature(sign(body, PLATFORM_SECRET), body, new Map(), deps).size, 0);
    }

    // ---- secret grouping ---------------------------------------------------
    {
        // Numbers sharing a secret are hashed once, not once per number.
        const shared = registryOf(platformRow('111'), platformRow('112'), tenantRow('222'));
        const groups = candidateSecrets(shared, deps);
        assert.equal(groups.size, 2);
        assert.deepEqual(groups.get(PLATFORM_SECRET).sort(), ['111', '112']);
        assert.deepEqual(groups.get(TENANT_SECRET), ['222']);
    }

    // ---- payload scanning --------------------------------------------------
    {
        assert.deepEqual([...phoneIdsIn({
            entry: [
                { changes: [{ value: { metadata: { phone_number_id: '111' } } }] },
                { changes: [{ value: { metadata: { phone_number_id: '222' } } }, { value: {} }] }
            ]
        })], ['111', '222']);

        assert.equal(phoneIdsIn({}).size, 0);
        assert.equal(phoneIdsIn(null).size, 0);
        assert.equal(phoneIdsIn({ entry: [{ changes: [{ value: {} }] }] }).size, 0);
    }

    console.log('whatsapp webhook auth tests passed');
}

try {
    run();
} catch (error) {
    console.error(error);
    process.exitCode = 1;
}
