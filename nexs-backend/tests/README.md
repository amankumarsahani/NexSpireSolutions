# Tests

No test framework is installed in this repo, so these run directly under `node`.

## Partner sync

`partner-sync-signature.test.js` — the signing scheme in isolation. No database.

```bash
npm run test:sync
```

`partner-sync-integration.test.js` — the real router against a real database.
Verifies the things a unit test structurally cannot: that the raw body survives
the parser chain, that the mirror upsert and the delete-missing-tenants sweep
behave, and that a command round-trips from queue to ack.

```bash
docker run -d --name wl-mariadb \
  -e MARIADB_ROOT_PASSWORD=verifypass \
  -e MARIADB_DATABASE=napnix_verify \
  -p 13306:3306 mariadb:11

docker cp database/migrations/064_partner_instances.sql wl-mariadb:/tmp/064.sql
docker exec wl-mariadb sh -c 'mariadb -uroot -pverifypass napnix_verify < /tmp/064.sql'

DB_HOST=127.0.0.1 DB_PORT=13306 DB_USER=root DB_PASSWORD=verifypass \
DB_NAME=napnix_verify npm run test:sync:integration
```

The suite creates and removes only its own rows, so it can be run repeatedly
against the same database.

**Point it at a throwaway database.** It writes to `partner_instances`,
`partner_tenant_mirror`, `partner_commands` and `partner_sync_log`.

## Partner billing

`partner-billing.test.js` — the data-quality gate on the billing rollup. Same
database requirements, plus migration 065.

```bash
DB_HOST=127.0.0.1 DB_PORT=13306 DB_USER=root DB_PASSWORD=verifypass \
DB_NAME=napnix_verify npm run test:billing
```

Most of these cases assert a *refusal*. That is the point: under-billing is
recoverable by rerunning the rollup, and charging a partner for usage that was
never measured is not. A stale instance, an unmeasured user count, a missing
price and an unsuspended-but-inactive instance each block the invoice with a
reason rather than producing a confident zero.

## Support escalation

`support-escalation.test.js` — the partner-to-platform hand-off. Requires
migrations 058, 064, 065 and 066.

```bash
DB_HOST=127.0.0.1 DB_PORT=13306 DB_USER=root DB_PASSWORD=verifypass \
DB_NAME=napnix_verify npm run test:escalation
```

The property worth protecting: the end customer belongs to the *partner*. A
platform reply must arrive in the partner's own ticket thread under the partner's
identity, never as an email from us, and the partner's internal notes must stay
with the partner. Redelivery after a lost ack must not open a second ticket for
the same problem.

### Confirming the suite still bites

A passing suite is only evidence if it can fail. These three mutations were each
verified to turn exactly one test red:

| Mutation | Test that fails |
|---|---|
| remove the nonce replay check in `verifyInstanceSignature.js` | a replayed nonce is rejected |
| remove the timestamp skew window | a stale timestamp is rejected |
| disable the delete-missing-tenants sweep in `partner-sync.routes.js` | a tenant dropped from a snapshot is removed from the mirror |
| coerce usage through `asInt` instead of `asUsage` (the original bug) | an unmeasured usage counter is stored NULL, not zero |
| remove the unmeasured-usage refusal in `partnerBilling.service.js` | an unmeasured user count blocks billing |
| remove the stale-instance refusal | a stale instance is NOT billed |
| ship internal notes in `supportEscalation.collectPending` | internal notes are not shipped to the platform |
| re-copy the thread on every redelivery (`if (n === 0)` → always) | a redelivered escalation does not duplicate the ticket |

Worth repeating after any significant change to the sync or billing path.

One caution learned here: an "obvious" mutation can be behaviourally equivalent
and prove nothing. Deleting the `null`/`undefined` early return from `asUsage`
looked like a real mutation but changed no behaviour, because `parseInt(undefined)`
is already `NaN`. Check that a mutation actually turns a test red before trusting
it as evidence.
