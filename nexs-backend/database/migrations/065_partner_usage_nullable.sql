-- Usage counters must distinguish "measured as zero" from "not measured" (P4-01).
--
-- 064 gave these columns DEFAULT 0, which is wrong for anything that will reach an
-- invoice: a tenant whose database was unreachable during a sweep would be
-- indistinguishable from a tenant that genuinely sent no email and has no users.
-- Billing from a fabricated zero is worse than refusing to bill.
--
-- NULL now means "unknown". The rollup must skip, not charge, when it sees one.

ALTER TABLE partner_tenant_mirror
    MODIFY COLUMN users INT DEFAULT NULL,
    MODIFY COLUMN storage_mb INT DEFAULT NULL,
    MODIFY COLUMN emails_sent_30d INT DEFAULT NULL,
    MODIFY COLUMN api_calls_30d INT DEFAULT NULL;

-- When the reported figures were actually measured on the instance. A usage sweep
-- runs hourly while heartbeats are every 15 minutes, so the same measurement is
-- re-sent several times; without this the panel would imply it is a live reading.
ALTER TABLE partner_tenant_mirror
    ADD COLUMN usage_collected_at DATETIME DEFAULT NULL AFTER api_calls_30d;
