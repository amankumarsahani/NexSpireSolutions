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

### Confirming the suite still bites

A passing suite is only evidence if it can fail. These three mutations were each
verified to turn exactly one test red:

| Mutation | Test that fails |
|---|---|
| remove the nonce replay check in `verifyInstanceSignature.js` | a replayed nonce is rejected |
| remove the timestamp skew window | a stale timestamp is rejected |
| disable the delete-missing-tenants sweep in `partner-sync.routes.js` | a tenant dropped from a snapshot is removed from the mirror |

Worth repeating after any significant change to the sync path.
