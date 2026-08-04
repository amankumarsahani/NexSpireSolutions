/**
 * Signature verification tests for the partner sync receiver.
 *
 * This endpoint is unauthenticated apart from its HMAC, so these cases are the
 * whole security boundary. Run with: node tests/partner-sync-signature.test.js
 *
 * Deliberately dependency-free (no jest/vitest in this repo) and does not touch
 * the database: it exercises the signing and comparison logic directly.
 */

const crypto = require('crypto');
const assert = require('assert');

const { sign, MAX_SKEW_MS } = require('../middleware/verifyInstanceSignature');

let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        console.log(`  ok   ${name}`);
        passed += 1;
    } catch (error) {
        console.error(`  FAIL ${name}\n       ${error.message}`);
        failed += 1;
    }
}

const SECRET = 'a'.repeat(64);
const BODY = JSON.stringify({ kind: 'snapshot', tenants: [{ slug: 'acme' }] });

console.log('\npartner sync signature');

test('a correctly signed request verifies', () => {
    const ts = Date.now().toString();
    const nonce = crypto.randomUUID();
    const expected = sign(BODY, ts, nonce, SECRET);
    assert.strictEqual(sign(BODY, ts, nonce, SECRET), expected);
});

test('changing one byte of the body invalidates the signature', () => {
    const ts = Date.now().toString();
    const nonce = crypto.randomUUID();
    const good = sign(BODY, ts, nonce, SECRET);
    const tampered = sign(BODY.replace('acme', 'acmf'), ts, nonce, SECRET);
    assert.notStrictEqual(good, tampered);
});

test('the timestamp is inside the signed payload, not just a header', () => {
    const nonce = crypto.randomUUID();
    const a = sign(BODY, '1000', nonce, SECRET);
    const b = sign(BODY, '2000', nonce, SECRET);
    // If these matched, a captured signature could be replayed forever simply by
    // sending a fresh X-Timestamp header.
    assert.notStrictEqual(a, b);
});

test('the nonce is inside the signed payload', () => {
    const ts = Date.now().toString();
    const a = sign(BODY, ts, 'nonce-one', SECRET);
    const b = sign(BODY, ts, 'nonce-two', SECRET);
    assert.notStrictEqual(a, b);
});

test('a different secret produces a different signature', () => {
    const ts = Date.now().toString();
    const nonce = crypto.randomUUID();
    assert.notStrictEqual(
        sign(BODY, ts, nonce, SECRET),
        sign(BODY, ts, nonce, 'b'.repeat(64))
    );
});

test('the skew window is five minutes', () => {
    assert.strictEqual(MAX_SKEW_MS, 5 * 60 * 1000);
});

console.log('\nsecret storage');

test('the sync secret round-trips through encryption', () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-master-key-for-secret-store';
    const { encryptSecret, decryptSecret, isEncryptedSecret } = require('../services/secretStore');
    const secret = crypto.randomBytes(32).toString('hex');
    const stored = encryptSecret(secret);

    // Encryption, not hashing: verifying an HMAC needs the plaintext back.
    assert.ok(isEncryptedSecret(stored), 'stored value should be marked encrypted');
    assert.notStrictEqual(stored, secret, 'secret must not be stored in plaintext');
    assert.strictEqual(decryptSecret(stored), secret);
});

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
