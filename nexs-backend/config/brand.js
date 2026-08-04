/**
 * Instance brand configuration.
 *
 * The server-side counterpart to brands/<slug>.json in the frontends. Everything
 * here is env-driven so one codebase can run as Napnix or as a whitelabel partner
 * instance without a branch or a fork - see
 * nexcrm-agents/shared/whitelabel-execution-plan.md (P0-03, P0-04).
 *
 * Defaults reproduce Napnix exactly, so an instance with none of these set behaves
 * as it always has.
 */

const baseDomain = process.env.NEXCRM_DOMAIN || 'napnix.in';

const brand = {
    /** Brand slug, matches VITE_BRAND on the frontends. */
    slug: process.env.BRAND_SLUG || 'napnix',

    /** Company name used in email footers and UI chrome. */
    name: process.env.BRAND_NAME || 'Napnix',

    /** Legal entity for invoice and email footers. */
    legalName: process.env.BRAND_LEGAL_NAME || 'Napnix Pvt. Ltd.',

    /** CRM product SKU name. */
    crmProductName: process.env.BRAND_CRM_PRODUCT_NAME || 'NapCRM',

    /** Email-marketing product SKU name. */
    mailProductName: process.env.BRAND_MAIL_PRODUCT_NAME || 'NapMail',

    /** Root domain for all tenant hostnames. Must match VITE_BRAND's baseDomain. */
    baseDomain,

    /** Public marketing site. */
    websiteUrl: process.env.WEBSITE_URL || `https://${baseDomain}`,

    /** Admin panel origin. */
    adminUrl: process.env.ADMIN_PANEL_URL || process.env.ADMIN_URL || `https://admin.${baseDomain}`,

    /** Master API origin. */
    apiUrl: process.env.API_URL || `https://api.${baseDomain}`,

    /** Where customers are told to write for help. */
    supportEmail: process.env.BRAND_SUPPORT_EMAIL
        || process.env.SMTP_FROM_EMAIL
        || `support@${baseDomain}`,

    /** Superadmin account address used by setup scripts. */
    platformAdminEmail: process.env.PLATFORM_ADMIN_EMAIL
        || process.env.NAPNIX_ADMIN_EMAIL
        || `admin@${baseDomain}`,
};

/** The API host for a tenant. Always on the platform base domain: the Cloudflare
 *  Tunnel in front of it requires Cloudflare-proxied DNS, which a customer's own
 *  custom domain does not have. */
brand.tenantApiUrl = (slug) => `https://${slug}-crm-api.${brand.baseDomain}`;

/** The tenant's CRM frontend host. */
brand.tenantCrmUrl = (slug) => `https://${slug}-crm.${brand.baseDomain}`;

/** The tenant's public storefront host. */
brand.tenantStorefrontUrl = (slug) => `https://${slug}.${brand.baseDomain}`;

/**
 * Token map handed to email/document templates so a single template renders
 * correctly on any instance.
 */
brand.templateTokens = () => ({
    brand_name: brand.name,
    brand_legal_name: brand.legalName,
    brand_website: brand.websiteUrl,
    brand_base_domain: brand.baseDomain,
    brand_support_email: brand.supportEmail,
    brand_admin_url: brand.adminUrl,
    brand_crm_product: brand.crmProductName,
    brand_mail_product: brand.mailProductName,
});

module.exports = brand;
