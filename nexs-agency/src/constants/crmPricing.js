export const crmTiers = [
    {
        name: 'Starter',
        price: { monthly: { INR: 4165, USD: 49, EUR: 45 }, yearly: { INR: 3570, USD: 42, EUR: 38 } },
        description: 'Perfect for small businesses & startups',
        popular: false,
        cta: 'Contact Sales',
        limits: {
            leads: '500',
            customers: '200',
            products: '50',
            teamMembers: '2',
            storage: '1 GB'
        }
    },
    {
        name: 'Growth',
        price: { monthly: { INR: 6715, USD: 79, EUR: 73 }, yearly: { INR: 5695, USD: 67, EUR: 62 } },
        description: 'Ideal for growing businesses',
        popular: true,
        cta: 'Contact Sales',
        limits: {
            leads: '2,000',
            customers: '1,000',
            products: '500',
            teamMembers: '5',
            storage: '5 GB'
        }
    },
    {
        name: 'Business',
        price: { monthly: { INR: 8415, USD: 99, EUR: 91 }, yearly: { INR: 7140, USD: 84, EUR: 77 } },
        description: 'For established businesses',
        popular: false,
        cta: 'Contact Sales',
        limits: {
            leads: '10,000',
            customers: '5,000',
            products: '2,000',
            teamMembers: '15',
            storage: '25 GB'
        }
    },
    {
        name: 'Enterprise',
        price: { monthly: { INR: null, USD: null, EUR: null }, yearly: { INR: null, USD: null, EUR: null } },
        description: 'For large organizations',
        popular: false,
        cta: 'Contact Sales',
        isCustom: true,
        limits: {
            leads: 'Unlimited',
            customers: 'Unlimited',
            products: 'Unlimited',
            teamMembers: 'Unlimited',
            storage: 'Custom'
        }
    }
];

export const crmFeatures = {
    core: [
        { name: 'Dashboard & Analytics', starter: true, growth: true, business: true, enterprise: true },
        { name: 'Lead Management', starter: true, growth: true, business: true, enterprise: true },
        { name: 'Customer Management', starter: true, growth: true, business: true, enterprise: true },
        { name: 'Mobile App Access', starter: true, growth: true, business: true, enterprise: true },
        { name: 'Multi-Industry Templates', starter: true, growth: true, business: true, enterprise: true },
    ],
    ecommerce: [
        { name: 'Product Catalog', starter: '50', growth: '500', business: '2,000', enterprise: 'Unlimited' },
        { name: 'Order Management', starter: true, growth: true, business: true, enterprise: true },
        { name: 'Storefront Website', starter: true, growth: true, business: true, enterprise: true },
        { name: 'Inventory Tracking', starter: false, growth: true, business: true, enterprise: true },
        { name: 'Payment Gateway', starter: true, growth: true, business: true, enterprise: true },
    ],
    marketing: [
        { name: 'Email Follow-ups', starter: '500/mo', growth: '5,000/mo', business: '25,000/mo', enterprise: 'Unlimited' },
        { name: 'WhatsApp Integration', starter: false, growth: true, business: true, enterprise: true },
        { name: 'Automation Workflows', starter: '3', growth: '10', business: '50', enterprise: 'Unlimited' },
        { name: 'Landing Pages', starter: false, growth: '5', business: '25', enterprise: 'Unlimited' },
        { name: 'Analytics & Reports', starter: 'Basic', growth: 'Advanced', business: 'Advanced', enterprise: 'Custom' },
    ],
    // Managed services delivered by the Napnix team, not software toggles inside
    // NapCRM. Setup work is included from Starter; ongoing management starts at
    // Growth, so the delivery cost stays matched to the plan price.
    visibility: [
        { name: 'Google Business Profile Setup', starter: true, growth: true, business: true, enterprise: true },
        { name: 'GBP Management (posts, Q&A, reviews)', starter: false, growth: 'Monthly', business: 'Weekly', enterprise: 'Weekly' },
        { name: 'Google Search Console Setup', starter: true, growth: true, business: true, enterprise: true },
        { name: 'Google Analytics 4 Setup & Goals', starter: true, growth: true, business: true, enterprise: true },
        { name: 'Technical SEO Audit', starter: false, growth: 'Quarterly', business: 'Monthly', enterprise: 'Monthly' },
        { name: 'On-Page SEO & Schema Markup', starter: false, growth: true, business: true, enterprise: true },
        { name: 'Keyword Rank Tracking', starter: false, growth: '25 keywords', business: '100 keywords', enterprise: 'Unlimited' },
        { name: 'Local SEO & Business Listings', starter: false, growth: true, business: true, enterprise: true },
        { name: 'Automated Review Requests (WhatsApp/Email)', starter: false, growth: true, business: true, enterprise: true },
        { name: 'Growth Report (traffic, leads, rankings)', starter: false, growth: 'Monthly', business: 'Monthly', enterprise: 'Custom' },
        { name: 'Dedicated Growth Manager', starter: false, growth: false, business: true, enterprise: true },
    ],
    support: [
        { name: 'Priority Support', starter: 'Email', growth: 'Email + Chat', business: 'Priority', enterprise: 'Dedicated' },
        { name: 'Onboarding & Data Migration', starter: 'Self-serve', growth: 'Guided', business: 'Done-for-you', enterprise: 'Done-for-you' },
        { name: 'Team Training Session', starter: false, growth: '1 session', business: 'Quarterly', enterprise: 'On demand' },
        { name: 'API Access', starter: false, growth: true, business: true, enterprise: true },
        { name: 'Custom Integrations', starter: false, growth: false, business: true, enterprise: true },
        { name: 'White-label', starter: false, growth: false, business: false, enterprise: true },
        { name: 'SLA Guarantee', starter: false, growth: false, business: '99.5%', enterprise: '99.9%' },
    ]
};
