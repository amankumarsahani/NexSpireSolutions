/**
 * Environment Variable Validation
 * 
 * Validates required environment variables at startup to prevent
 * runtime errors due to missing configuration.
 */

const validateEnv = () => {
    const required = [];
    const warnings = [];

    // Database configuration
    if (!process.env.DB_HOST) {
        warnings.push('DB_HOST (defaults to localhost)');
    }
    if (!process.env.DB_USER) {
        required.push('DB_USER');
    }
    if (!process.env.DB_PASSWORD) {
        required.push('DB_PASSWORD');
    }
    if (!process.env.DB_NAME) {
        required.push('DB_NAME');
    }

    // JWT Secret (critical for security)
    if (!process.env.JWT_SECRET) {
        required.push('JWT_SECRET');
    } else if (process.env.JWT_SECRET.includes('change-this') ||
        process.env.JWT_SECRET.length < 32) {
        console.warn('\n⚠️  WARNING: JWT_SECRET appears to be weak or is a placeholder.');
        console.warn('   Please use a strong, random secret in production.\n');
    }

    // Cloudflare (required for tenant provisioning)
    if (!process.env.CLOUDFLARE_API_TOKEN) {
        warnings.push('CLOUDFLARE_API_TOKEN (required for tenant provisioning)');
    }
    if (!process.env.CLOUDFLARE_ZONE_ID) {
        warnings.push('CLOUDFLARE_ZONE_ID (required for tenant provisioning)');
    }

    // Registry (required for mobile app lookup)
    if (!process.env.REGISTRY_URL) {
        warnings.push('REGISTRY_URL (required for mobile app integration)');
    }

    // SMTP (optional but warn if incomplete)
    if (process.env.SMTP_USER && !process.env.SMTP_PASSWORD) {
        warnings.push('SMTP_PASSWORD (SMTP_USER is set but password is missing)');
    }

    // Print warnings
    if (warnings.length > 0) {
        console.warn('\n⚠️  Environment Warnings:');
        warnings.forEach(w => console.warn(`   - Missing: ${w}`));
        console.warn('');
    }

    // Exit if required vars missing
    if (required.length > 0) {
        console.error('\n❌ Missing required environment variables:');
        required.forEach(r => console.error(`   - ${r}`));
        console.error('\nPlease set these in your .env file or environment.');
        console.error('See .env.example for reference.\n');
        process.exit(1);
    }

    return true;
};

module.exports = { validateEnv };
