/**
 * Edition gating.
 *
 * One codebase, two products:
 *
 *   full       - the complete product: our own agency CRM, our marketing-site CMS, our
 *                money, our telemetry, plus the NexCRM control plane.
 *   whitelabel - a partner instance: the control plane only. Agency-operations
 *                routers are NOT MOUNTED, so those endpoints 404 rather than
 *                relying on a role check somebody could get wrong later.
 *
 * See nexcrm-agents/shared/whitelabel-execution-plan.md (P0-07).
 */

const EDITIONS = ['full', 'whitelabel'];

const edition = process.env.EDITION || 'full';

if (!EDITIONS.includes(edition)) {
    throw new Error(
        `EDITION must be one of ${EDITIONS.join(', ')} - got "${edition}"`
    );
}

const isFull = edition === 'full';
const isWhitelabel = edition === 'whitelabel';

/**
 * Optional add-ons a partner can buy. Default off in whitelabel, always on in the
 * full edition. Flipping one is a single env var, which is the point: decision D4 in
 * the plan is still open and must not require a code change to answer.
 */
const featureFlag = (name, defaultOnForPartner = false) => {
    const raw = process.env[name];
    if (raw === undefined) return isFull || defaultOnForPartner;
    return raw === 'true' || raw === '1';
};

const features = {
    /** NapMail email-marketing suite. */
    napmail: featureFlag('FEATURE_NAPMAIL'),
    /** WhatsApp Business integration. */
    whatsapp: featureFlag('FEATURE_WHATSAPP'),
    /** NapLead lead-intelligence. */
    naplead: featureFlag('FEATURE_NAPLEAD'),
};

module.exports = { edition, isFull, isWhitelabel, features, EDITIONS };
