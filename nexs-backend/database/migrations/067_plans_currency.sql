-- Partner price book (P4-02, decision D5).
--
-- Under wholesale-per-active-tenant, a partner sets whatever retail price they
-- like for their own customers and our margin is the gap to it. Two things were
-- missing for that to actually work on a partner instance.
--
-- 1. Currency was implicit. Prices were seeded in INR and rendered with a hardcoded
--    symbol, so a partner selling in another currency had no way to say so and
--    would have shown their customers the wrong unit.
--
-- 2. Nothing recorded that a plan's price was still the seeded default. A partner
--    who forgets to price a plan would otherwise sell at ours, which is both wrong
--    for them and a disclosure of our pricing.
--
-- Note what is NOT here: nothing about our wholesale price or margin. Those live
-- only in partner_instances on the master, which a partner instance never has rows
-- in and whose API is gated to the full edition.

ALTER TABLE plans
    ADD COLUMN currency CHAR(3) NOT NULL DEFAULT 'INR' AFTER price_yearly,
    ADD COLUMN currency_symbol VARCHAR(8) NOT NULL DEFAULT '₹' AFTER currency,
    -- Set on seed, cleared the first time an operator saves a price. Lets the UI
    -- warn that a plan is still carrying a default rather than a chosen price.
    ADD COLUMN price_is_default TINYINT(1) NOT NULL DEFAULT 0 AFTER currency_symbol;

-- Existing rows were seeded by us and have never been priced deliberately.
UPDATE plans SET price_is_default = 1;
