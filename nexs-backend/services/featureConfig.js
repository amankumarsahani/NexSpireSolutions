/**
 * Feature Configuration Service
 * 
 * Manages industry-specific modules and plan-based feature access.
 * Used by both admin backend (for provisioning) and tenant backend (for runtime checks).
 */

// Industry module definitions
const INDUSTRY_MODULES = {
    // Core modules available to all industries
    general: [
        'dashboard',
        'leads',
        'clients',
        'inquiries',
        'users',
        'documents',
        'communications',
        'activities'
    ],

    // E-commerce specific
    ecommerce: [
        'products',
        'orders',
        'inventory',
        'shipping',
        'returns'
    ],

    // Real Estate specific
    realestate: [
        'properties',
        'listings',
        'viewings',
        'contracts'
    ],

    // Services specific
    services: [
        'appointments',
        'services',
        'bookings',
        'timesheets'
    ],

    // Education specific
    education: [
        'courses',
        'students',
        'batches',
        'attendance',
        'grades'
    ],

    // Healthcare specific
    healthcare: [
        'patients',
        'appointments',
        'records',
        'prescriptions'
    ],

    // Hospitality specific
    hospitality: [
        'reservations',
        'rooms',
        'guests',
        'housekeeping'
    ]
};

// Communication features by category
const COMMUNICATION_FEATURES = {
    email: [
        'email_templates',
        'bulk_mailing',
        'email_campaigns',
        'campaign_analytics',
        'email_scheduling',
        'custom_smtp'
    ],
    sms: [
        'sms_notifications',
        'sms_campaigns',
        'sms_templates'
    ],
    whatsapp: [
        'whatsapp_business',
        'whatsapp_templates',
        'whatsapp_broadcast'
    ],
    chat: [
        'team_chat_basic',
        'team_chat_full',
        'chat_file_sharing'
    ],
    automation: [
        'ai_chatbot_basic',
        'ai_chatbot_advanced',
        'auto_responders',
        'workflow_triggers'
    ],
    notifications: [
        'in_app_notifications',
        'push_notifications',
        'browser_push',
        'mobile_push'
    ]
};

// Default plan configurations (fallback if DB not available)
const DEFAULT_PLAN_CONFIGS = {
    starter: {
        limits: {
            users: 3,
            leads: 500,
            clients: 100,
            storage_gb: 1,
            documents: 50
        },
        // Allow all industries on starter plan for basic usage
        industries: ['general', 'ecommerce', 'services', 'realestate', 'education', 'healthcare', 'hospitality'],
        communication: {
            emails_per_month: 500,
            email_templates: 5,
            bulk_mail_limit: 0,
            sms_per_month: 0,
            whatsapp_enabled: false,
            team_chat: false,
            push_notifications: false
        },
        features: [
            'basic_reports',
            'email_templates',
            'in_app_notifications'
        ]
    },
    growth: {
        limits: {
            users: 10,
            leads: 2000,
            clients: 500,
            storage_gb: 5,
            documents: 200
        },
        industries: ['general', 'ecommerce', 'services', 'realestate'],
        communication: {
            emails_per_month: 5000,
            email_templates: 25,
            bulk_mail_limit: 500,
            sms_per_month: 0,
            whatsapp_enabled: false,
            team_chat: true,
            chat_history_days: 7,
            chat_channels: 3,
            push_notifications: true
        },
        features: [
            'basic_reports',
            'email_templates',
            'bulk_import',
            'email_scheduling',
            'bulk_mailing',
            'auto_responders',
            'team_chat_basic',
            'push_notifications',
            'in_app_notifications'
        ]
    },
    business: {
        limits: {
            users: 25,
            leads: 10000,
            clients: 2000,
            storage_gb: 25,
            documents: 1000
        },
        industries: ['*'], // All industries
        communication: {
            emails_per_month: 25000,
            email_templates: -1, // Unlimited
            bulk_mail_limit: 5000,
            sms_per_month: 1000,
            sms_templates: 10,
            whatsapp_enabled: true,
            whatsapp_templates: 10,
            team_chat: true,
            chat_history_days: 90,
            chat_channels: 10,
            push_notifications: true,
            browser_push: true
        },
        features: [
            'basic_reports',
            'advanced_reports',
            'email_templates',
            'bulk_import',
            'email_scheduling',
            'bulk_mailing',
            'email_campaigns',
            'campaign_analytics',
            'custom_smtp',
            'sms_notifications',
            'whatsapp_business',
            'team_chat_full',
            'ai_chatbot_basic',
            'auto_responders',
            'workflow_triggers',
            'push_notifications',
            'browser_push',
            'in_app_notifications',
            'api_access',
            'webhooks'
        ]
    },
    enterprise: {
        limits: {
            users: -1, // Unlimited
            leads: -1,
            clients: -1,
            storage_gb: 100,
            documents: -1
        },
        industries: ['*'],
        communication: {
            emails_per_month: -1,
            email_templates: -1,
            bulk_mail_limit: -1,
            sms_per_month: -1,
            sms_templates: -1,
            whatsapp_enabled: true,
            whatsapp_templates: -1,
            whatsapp_broadcast: true,
            team_chat: true,
            chat_history_days: -1,
            chat_channels: -1,
            push_notifications: true,
            browser_push: true,
            mobile_push: true
        },
        features: ['*'] // All features
    }
};

/**
 * FeatureConfig class for runtime feature checks
 */
class FeatureConfig {
    constructor(industryType, planConfig) {
        this.industry = industryType || 'general';
        this.planConfig = planConfig || DEFAULT_PLAN_CONFIGS.starter;
    }

    /**
     * Get all enabled modules for this tenant
     */
    getEnabledModules() {
        // Always include core modules
        const coreModules = [...INDUSTRY_MODULES.general];

        // Check if industry modules are allowed by plan
        const allowedIndustries = this.planConfig.industries || [];
        const industryAllowed = allowedIndustries.includes('*') ||
            allowedIndustries.includes(this.industry);

        if (industryAllowed && INDUSTRY_MODULES[this.industry]) {
            return [...coreModules, ...INDUSTRY_MODULES[this.industry]];
        }

        return coreModules;
    }

    /**
     * Check if a specific module is accessible
     */
    canAccessModule(moduleName) {
        return this.getEnabledModules().includes(moduleName);
    }

    /**
     * Get limit for a specific resource
     * Returns -1 for unlimited
     */
    getLimit(resource) {
        const limits = this.planConfig.limits || {};
        return limits[resource] !== undefined ? limits[resource] : 0;
    }

    /**
     * Get communication limit
     */
    getCommunicationLimit(resource) {
        const comm = this.planConfig.communication || {};
        return comm[resource] !== undefined ? comm[resource] : 0;
    }

    /**
     * Check if a feature is enabled
     */
    hasFeature(feature) {
        const features = this.planConfig.features || [];
        return features.includes('*') || features.includes(feature);
    }

    /**
     * Check if plan supports the specified industry
     */
    canUseIndustry(industry) {
        const allowed = this.planConfig.industries || ['general'];
        return allowed.includes('*') || allowed.includes(industry);
    }

    /**
     * Get the full config for API response
     */
    toJSON() {
        return {
            industry: this.industry,
            modules: this.getEnabledModules(),
            limits: this.planConfig.limits,
            communication: this.planConfig.communication,
            features: this.planConfig.features
        };
    }
}

/**
 * Create FeatureConfig from database tenant/plan data
 */
function createFeatureConfig(tenant, plan) {
    const planConfig = {
        limits: plan.feature_limits || DEFAULT_PLAN_CONFIGS.starter.limits,
        industries: plan.allowed_industries || ['general'],
        communication: plan.communication_limits || DEFAULT_PLAN_CONFIGS.starter.communication,
        features: plan.enabled_features || DEFAULT_PLAN_CONFIGS.starter.features
    };

    return new FeatureConfig(tenant.industry_type, planConfig);
}

/**
 * Get default plan config by plan name/slug
 */
function getDefaultPlanConfig(planSlug) {
    return DEFAULT_PLAN_CONFIGS[planSlug.toLowerCase()] || DEFAULT_PLAN_CONFIGS.starter;
}

module.exports = {
    FeatureConfig,
    createFeatureConfig,
    getDefaultPlanConfig,
    INDUSTRY_MODULES,
    COMMUNICATION_FEATURES,
    DEFAULT_PLAN_CONFIGS
};
