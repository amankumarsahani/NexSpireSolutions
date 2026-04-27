export const nexmailTiers = [
    {
        name: 'Free',
        price: { monthly: 0, yearly: 0 },
        currency: '₹',
        description: 'For solo creators and startups testing email marketing',
        popular: false,
        cta: 'Start Free',
        isFree: true,
        limits: {
            contacts: '1,000',
            emailsPerMonth: '5,000',
            templates: '10',
            lists: '5',
            automations: '2',
            smtpAccounts: '1'
        }
    },
    {
        name: 'Growth',
        price: { monthly: 699, yearly: 594 },
        currency: '₹',
        description: 'For small businesses getting serious about email',
        popular: false,
        cta: 'Get Started',
        limits: {
            contacts: '5,000',
            emailsPerMonth: '25,000',
            templates: '25',
            lists: '15',
            automations: '5',
            smtpAccounts: '2'
        }
    },
    {
        name: 'Pro',
        price: { monthly: 1999, yearly: 1699 },
        currency: '₹',
        description: 'For growing businesses with advanced email needs',
        popular: true,
        cta: 'Get Started',
        limits: {
            contacts: '25,000',
            emailsPerMonth: '100,000',
            templates: '100',
            lists: 'Unlimited',
            automations: 'Unlimited',
            smtpAccounts: '5'
        }
    },
    {
        name: 'Business',
        price: { monthly: 4999, yearly: 4249 },
        currency: '₹',
        description: 'High-volume sending with full deliverability controls',
        popular: false,
        cta: 'Get Started',
        limits: {
            contacts: '100,000',
            emailsPerMonth: '500,000',
            templates: 'Unlimited',
            lists: 'Unlimited',
            automations: 'Unlimited',
            smtpAccounts: '10'
        }
    },
    {
        name: 'Enterprise',
        price: { monthly: null, yearly: null },
        currency: '',
        description: 'Unlimited everything with dedicated support',
        popular: false,
        cta: 'Contact Sales',
        limits: {
            contacts: 'Unlimited',
            emailsPerMonth: 'Unlimited',
            templates: 'Unlimited',
            lists: 'Unlimited',
            automations: 'Unlimited',
            smtpAccounts: 'Unlimited'
        }
    }
];

export const nexmailFeatures = {
    campaigns: {
        label: 'Campaigns',
        items: [
            { name: 'Email campaigns', values: [true, true, true, true, true] },
            { name: 'A/B testing', values: [false, false, true, true, true] },
            { name: 'Campaign scheduling', values: [true, true, true, true, true] },
            { name: 'Spam score checker', values: [true, true, true, true, true] },
            { name: 'Throttle controls', values: [false, true, true, true, true] },
            { name: 'Send window scheduling', values: [false, false, true, true, true] },
            { name: 'Stagger mode', values: [false, false, true, true, true] },
        ]
    },
    templates: {
        label: 'Templates & Content',
        items: [
            { name: 'Drag-and-drop editor (18 blocks)', values: [true, true, true, true, true] },
            { name: 'Pre-built templates', values: ['5', '10', '25', '50+', '50+'] },
            { name: 'Mobile preview', values: [true, true, true, true, true] },
            { name: 'Template versioning', values: [false, true, true, true, true] },
            { name: 'Custom HTML editor', values: [true, true, true, true, true] },
            { name: 'Asset library', values: ['100 MB', '500 MB', '2 GB', '10 GB', 'Unlimited'] },
        ]
    },
    contacts: {
        label: 'Contacts & Segmentation',
        items: [
            { name: 'Contact management', values: [true, true, true, true, true] },
            { name: 'CSV import', values: [true, true, true, true, true] },
            { name: 'NexCRM sync', values: [false, true, true, true, true] },
            { name: 'Dynamic segments', values: [false, false, true, true, true] },
            { name: 'Contact scoring', values: [false, false, true, true, true] },
            { name: 'Tags & custom fields', values: [true, true, true, true, true] },
        ]
    },
    automation: {
        label: 'Automation',
        items: [
            { name: 'Visual flow builder', values: [true, true, true, true, true] },
            { name: 'Drip sequences', values: ['2 max', '5 max', 'Unlimited', 'Unlimited', 'Unlimited'] },
            { name: 'Conditional branching', values: [false, false, true, true, true] },
            { name: 'Webhook triggers', values: [false, false, true, true, true] },
            { name: 'Pre-built recipes', values: ['2', '5', '10', '10', '10'] },
        ]
    },
    deliverability: {
        label: 'Deliverability Engine',
        items: [
            { name: 'SMTP accounts', values: ['1', '2', '5', '10', 'Unlimited'] },
            { name: 'Weighted SMTP rotation', values: [false, true, true, true, true] },
            { name: 'Domain authentication (SPF/DKIM/DMARC)', values: [true, true, true, true, true] },
            { name: 'Per-domain throttling (Gmail/Yahoo/etc)', values: [false, true, true, true, true] },
            { name: 'Reputation monitoring & auto-disable', values: [false, false, true, true, true] },
            { name: 'Warmup mode', values: [false, true, true, true, true] },
            { name: 'Adaptive human-like delays', values: [false, true, true, true, true] },
            { name: 'Bounce handling & suppression', values: [true, true, true, true, true] },
        ]
    },
    analytics: {
        label: 'Analytics',
        items: [
            { name: 'Open & click tracking', values: [true, true, true, true, true] },
            { name: 'Campaign analytics', values: [true, true, true, true, true] },
            { name: 'Engagement heatmap', values: [false, false, true, true, true] },
            { name: 'Campaign leaderboard', values: [false, true, true, true, true] },
            { name: 'CSV export', values: [true, true, true, true, true] },
            { name: 'API access', values: [false, false, true, true, true] },
        ]
    },
    support: {
        label: 'Support',
        items: [
            { name: 'Email support', values: [true, true, true, true, true] },
            { name: 'Priority support', values: [false, false, true, true, true] },
            { name: 'Dedicated account manager', values: [false, false, false, false, true] },
            { name: 'Custom onboarding', values: [false, false, false, true, true] },
            { name: 'SLA guarantee', values: [false, false, false, '99.5%', '99.9%'] },
        ]
    }
};
