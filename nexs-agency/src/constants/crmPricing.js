export const crmTiers = [
    {
        name: 'Starter',
        price: { monthly: 999, yearly: 849 },
        currency: '₹',
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
        price: { monthly: 2499, yearly: 2124 },
        currency: '₹',
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
        price: { monthly: 5999, yearly: 5099 },
        currency: '₹',
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
        price: { monthly: null, yearly: null },
        currency: '',
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
        { name: 'Vendor Management', starter: false, growth: '5', business: '25', enterprise: 'Unlimited' },
        { name: 'CMS Pages', starter: '3', growth: '10', business: '50', enterprise: 'Unlimited' },
        { name: 'Coupons & Discounts', starter: '5', growth: '25', business: 'Unlimited', enterprise: 'Unlimited' },
    ],
    communication: [
        { name: 'Email Templates', starter: '5', growth: '25', business: 'Unlimited', enterprise: 'Unlimited' },
        { name: 'Emails/Month', starter: '500', growth: '5,000', business: '25,000', enterprise: 'Unlimited' },
        { name: 'Bulk Mailing', starter: false, growth: '500/mo', business: '5,000/mo', enterprise: 'Unlimited' },
        { name: 'Team Chat', starter: false, growth: 'Basic', business: 'Full', enterprise: 'Full' },
        { name: 'Chat History', starter: false, growth: '7 days', business: '90 days', enterprise: 'Unlimited' },
        { name: 'Push Notifications', starter: false, growth: true, business: true, enterprise: true, soon: true },
        { name: 'SMS Notifications', starter: false, growth: false, business: '1,000/mo', enterprise: 'Unlimited', soon: true },
        { name: 'WhatsApp Business', starter: false, growth: false, business: true, enterprise: true, soon: true },
    ],
    automation: [
        { name: 'AI Chatbot', starter: false, growth: false, business: 'Basic', enterprise: 'Advanced', soon: true },
        { name: 'Auto Responders', starter: false, growth: true, business: true, enterprise: true, soon: true },
        { name: 'Workflow Triggers', starter: false, growth: false, business: '10', enterprise: 'Unlimited', soon: true },
    ],
    support: [
        { name: 'Email Support', starter: true, growth: true, business: true, enterprise: true },
        { name: 'Priority Support', starter: false, growth: false, business: true, enterprise: true },
        { name: 'Dedicated Manager', starter: false, growth: false, business: false, enterprise: true },
        { name: 'Custom Development', starter: false, growth: false, business: false, enterprise: true },
        { name: 'API Access', starter: false, growth: false, business: true, enterprise: true },
    ]
};
