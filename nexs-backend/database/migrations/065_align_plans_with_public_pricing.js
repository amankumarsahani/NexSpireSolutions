/**
 * Align the `plans` table with the public pricing page (napnix.in/napcrm/pricing).
 *
 * The site never reads this table — it renders hardcoded `crmTiers` from
 * nexs-agency/src/constants/crmPricing.js. This table is what actually charges:
 * Razorpay subscription amounts (razorpay.service.js), Clause 3 of the service
 * agreement, and Annexure A's rate card (tenant.controller.js buildRateCardRows).
 *
 * They had drifted apart: the site sold Starter/Growth/Business/Enterprise at
 * Rs 4,165 / 6,715 / 8,415 / custom, while this table held
 * Starter/Professional/Enterprise at Rs 999 / 2,499 / 5,999. A customer could read
 * one price on the site and receive an agreement quoting another.
 *
 * The site is treated as authoritative — it is the published offer, and the code
 * already assumes its naming (razorpay.service.js PLAN_ALIASES maps growth ->
 * professional and business -> enterprise; nexcrm-backend featureConfig.js already
 * defines growth/business plan configs).
 *
 * Verified against the live bundle on 2026-09-03
 * (assets/CurrencySwitcher-DTagjzPq.js): INR 4165/3570, 6715/5695, 8415/7140.
 *
 * Mapping (follows the existing PLAN_ALIASES, so tenant rows keep their plan_id):
 *   starter      -> Starter   Rs 4,165/mo   Rs 42,840/yr
 *   professional -> Growth    Rs 6,715/mo   Rs 68,340/yr
 *   enterprise   -> Business  Rs 8,415/mo   Rs 85,680/yr
 *   (new row)    -> Enterprise, price 0 = "On request" in the rate card
 *
 * `price_yearly` is the ANNUAL total (the seed used 999 -> 9990). The site quotes a
 * per-month figure for yearly billing, so these are that figure x 12.
 *
 * Rename order matters: the `enterprise` slug must be freed before the new
 * Enterprise row can claim it (slug is UNIQUE).
 */
module.exports = async function (connection) {
    const [existing] = await connection.query('SELECT id, slug FROM plans');
    const bySlug = Object.fromEntries(existing.map((p) => [p.slug, p.id]));

    // Idempotency: if the rename already ran, only refresh prices.
    const alreadyRenamed = Boolean(bySlug.growth && bySlug.business);

    const priceOf = {
        starter: { name: 'Starter', monthly: 4165, yearly: 42840, users: 2, leads: 500, clients: 200, email: 500 },
        growth: { name: 'Growth', monthly: 6715, yearly: 68340, users: 5, leads: 2000, clients: 1000, email: 5000 },
        business: { name: 'Business', monthly: 8415, yearly: 85680, users: 15, leads: 10000, clients: 5000, email: 25000 },
    };

    if (!alreadyRenamed) {
        // 1. Free the `enterprise` slug first: today's Enterprise row is the site's Business tier.
        if (bySlug.enterprise) {
            await connection.query(
                `UPDATE plans SET name = ?, slug = 'business', description = ?,
                     price_monthly = ?, price_yearly = ?, max_users = ?, max_leads = ?, max_clients = ?
                 WHERE id = ?`,
                ['Business', 'For established businesses', priceOf.business.monthly, priceOf.business.yearly,
                    priceOf.business.users, priceOf.business.leads, priceOf.business.clients, bySlug.enterprise]
            );
        }

        // 2. Professional becomes Growth.
        if (bySlug.professional) {
            await connection.query(
                `UPDATE plans SET name = ?, slug = 'growth', description = ?,
                     price_monthly = ?, price_yearly = ?, max_users = ?, max_leads = ?, max_clients = ?
                 WHERE id = ?`,
                ['Growth', 'Ideal for growing businesses', priceOf.growth.monthly, priceOf.growth.yearly,
                    priceOf.growth.users, priceOf.growth.leads, priceOf.growth.clients, bySlug.professional]
            );
        }
    }

    // 3. Starter keeps its slug; price and limits move to the published ones.
    if (bySlug.starter) {
        await connection.query(
            `UPDATE plans SET name = ?, description = ?, price_monthly = ?, price_yearly = ?,
                 max_users = ?, max_leads = ?, max_clients = ?
             WHERE id = ?`,
            ['Starter', 'Perfect for small businesses & startups', priceOf.starter.monthly, priceOf.starter.yearly,
                priceOf.starter.users, priceOf.starter.leads, priceOf.starter.clients, bySlug.starter]
        );
    }

    // 4. Re-run safe: if the rename already happened, keep prices current.
    if (alreadyRenamed) {
        for (const slug of ['growth', 'business']) {
            const p = priceOf[slug];
            await connection.query(
                'UPDATE plans SET name = ?, price_monthly = ?, price_yearly = ?, max_users = ?, max_leads = ?, max_clients = ? WHERE slug = ?',
                [p.name, p.monthly, p.yearly, p.users, p.leads, p.clients, slug]
            );
        }
    }

    // 5. Email-sending allowance per the pricing page's marketing feature table.
    const emailByPlan = { starter: 500, growth: 5000, business: 25000 };
    for (const [slug, limit] of Object.entries(emailByPlan)) {
        await connection.query(
            `UPDATE plans
                SET features = JSON_SET(COALESCE(features, JSON_OBJECT()), '$.email_sending', ?)
              WHERE slug = ?`,
            [limit, slug]
        );
    }

    // 6. The site's fourth tier has no row yet. Price 0 makes buildRateCardRows()
    //    render "On request", which is what the page says ("Contact Sales").
    const [ent] = await connection.query("SELECT id FROM plans WHERE slug = 'enterprise'");
    if (!ent.length) {
        await connection.query(
            `INSERT INTO plans
                 (name, slug, description, price_monthly, price_yearly, max_users, max_leads,
                  max_clients, max_projects, max_email_templates, max_document_templates, features)
             VALUES ('Enterprise', 'enterprise', 'For large organizations', 0, 0, 999, 99999,
                     99999, 99999, 999, 999,
                     '{"email_sending": 999999, "custom_domain": true, "api_access": true, "priority_support": true, "white_label": true}')`
        );
    }
};
