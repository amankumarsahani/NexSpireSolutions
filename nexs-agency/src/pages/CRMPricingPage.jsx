import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { settingsAPI, billingAPI } from '../services/api';

const CheckIcon = () => (
    <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
);

const XIcon = () => (
    <svg className="w-5 h-5 text-slate-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const tiers = [
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

const features = {
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

const FeatureValue = ({ value, soon }) => {
    if (value === true) return <CheckIcon />;
    if (value === false) return <XIcon />;
    return (
        <span className="text-sm font-medium text-slate-700">
            {value}
            {soon && <span className="ml-1 text-xs text-amber-600">(Soon)</span>}
        </span>
    );
};

export default function CRMPricingPage() {
    const [isYearly, setIsYearly] = useState(false);
    const [showContactModal, setShowContactModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [pricingMode, setPricingMode] = useState('contact_us');
    const [contactEmail, setContactEmail] = useState('sales@nexspire.com');
    const [loadingSettings, setLoadingSettings] = useState(true);

    // reCAPTCHA site key (same as EnquiryPopup)
    const RECAPTCHA_SITE_KEY = '6LcrNTYsAAAAAAiRJyNE6h2kWSsof7HrIHRx4Z8z';

    // Load reCAPTCHA v3 script and settings
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await settingsAPI.getPublicSettings();
                if (response.data.success || response.data) {
                    const settings = response.data.data || response.data;
                    if (settings.pricing_page_mode) setPricingMode(settings.pricing_page_mode);
                    if (settings.contact_sales_email) setContactEmail(settings.contact_sales_email);
                }
            } catch (err) {
                console.error('Failed to fetch pricing settings:', err);
            } finally {
                setLoadingSettings(false);
            }
        };

        fetchSettings();

        if (document.getElementById('recaptcha-script')) return;

        const script = document.createElement('script');
        script.id = 'recaptcha-script';
        script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
        script.async = true;
        document.head.appendChild(script);
    }, []);

    const getCaptchaToken = async () => {
        if (!window.grecaptcha) return null;

        try {
            await new Promise(resolve => window.grecaptcha.ready(resolve));
            return await window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: 'pricing_inquiry' });
        } catch (err) {
            console.warn('reCAPTCHA error:', err);
            return null;
        }
    };

    // Toast notification state
    const [toast, setToast] = useState({ show: false, message: '', type: 'error' });

    const showToast = (message, type = 'error') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'error' }), 4000);
    };

    const handleAction = async (planName) => {
        if (pricingMode === 'contact_us' || planName === 'Enterprise') {
            setSelectedPlan(planName);
            setShowContactModal(true);
            setSubmitted(false);
            return;
        }

        // Stripe Checkout logic
        const planId = planName.toLowerCase();
        const id = showToast('Initiating secure checkout...', 'info');
        try {
            const finalPlanId = isYearly ? `${planId}_yearly` : planId;
            const response = await billingAPI.createPaymentLink({
                planId: finalPlanId,
                successUrl: window.location.origin + '/nexcrm?payment=success',
                cancelUrl: window.location.origin + '/nexcrm/pricing?payment=cancelled',
                metadata: {
                    source: 'agency_pricing_page',
                    billing_cycle: isYearly ? 'yearly' : 'monthly'
                }
            });

            if (response.data.success && response.data.url) {
                window.location.href = response.data.url;
            } else {
                showToast(response.data.error || 'Failed to generate checkout link');
            }
        } catch (err) {
            showToast('Failed to initiate checkout. Please contact support.');
            console.error('Checkout error:', err);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            <Helmet>
                <title>NexCRM Pricing - Affordable Plans for Every Business | Nexspire Solutions</title>
                <meta name="description" content="Choose the perfect NexCRM plan for your business. Starter from ₹999/month. Leads, E-commerce, Team Chat, Mobile App - all included." />
            </Helmet>

            {/* Toast Notification */}
            {toast.show && (
                <div className={`fixed top-4 right-4 z-[100] px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-fade-in ${toast.type === 'error' ? 'bg-red-500 text-white' : (toast.type === 'info' ? 'bg-blue-500 text-white' : 'bg-emerald-500 text-white')
                    }`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {toast.type === 'error' ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        ) : (toast.type === 'info' ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        ))}
                    </svg>
                    <span className="font-medium">{toast.message}</span>
                    <button onClick={() => setToast({ show: false, message: '', type: 'error' })} className="ml-2 hover:opacity-70">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}

            {/* Hero */}
            <section className="pt-32 pb-16 px-4">
                <div className="max-w-7xl mx-auto text-center">
                    <span className="inline-block px-4 py-1.5 bg-blue-100 text-blue-700 text-sm font-medium rounded-full mb-4">
                        NexCRM Pricing
                    </span>
                    <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
                        Simple, Transparent Pricing
                    </h1>
                    <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-8">
                        Choose a plan that scales with your business. Contact our sales team to get started.
                    </p>

                    {/* Billing Toggle */}
                    <div className="flex items-center justify-center gap-4 mb-12">
                        <span className={`text-sm font-medium ${!isYearly ? 'text-slate-900' : 'text-slate-500'}`}>Monthly</span>
                        <button
                            onClick={() => setIsYearly(!isYearly)}
                            className={`relative w-14 h-7 rounded-full transition-colors ${isYearly ? 'bg-blue-600' : 'bg-slate-300'}`}
                        >
                            <span className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow ${isYearly ? 'left-8' : 'left-1'}`} />
                        </button>
                        <span className={`text-sm font-medium ${isYearly ? 'text-slate-900' : 'text-slate-500'}`}>
                            Yearly <span className="text-emerald-600">(Save 15%)</span>
                        </span>
                    </div>

                    {/* Pricing Cards */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
                        {tiers.map((tier) => (
                            <div
                                key={tier.name}
                                className={`relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow p-6 text-left ${tier.popular ? 'ring-2 ring-blue-600' : 'border border-slate-200'
                                    }`}
                            >
                                {tier.popular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                        <span className="bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                                            Most Popular
                                        </span>
                                    </div>
                                )}

                                <h3 className="text-xl font-bold text-slate-900 mb-1">{tier.name}</h3>
                                <p className="text-sm text-slate-500 mb-4">{tier.description}</p>

                                <div className="mb-6">
                                    {tier.isCustom ? (
                                        <>
                                            <span className="text-4xl font-bold text-slate-900">Custom</span>
                                            <p className="text-sm text-slate-500 mt-1">Tailored for your needs</p>
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-4xl font-bold text-slate-900">
                                                {tier.currency}{isYearly ? tier.price.yearly : tier.price.monthly}
                                            </span>
                                            <span className="text-slate-500">/month</span>
                                            {isYearly && (
                                                <p className="text-sm text-emerald-600 mt-1">Billed annually</p>
                                            )}
                                        </>
                                    )}
                                </div>

                                <ul className="space-y-3 mb-6">
                                    <li className="flex items-center gap-2 text-sm text-slate-600">
                                        <CheckIcon /> {tier.limits.leads} Leads
                                    </li>
                                    <li className="flex items-center gap-2 text-sm text-slate-600">
                                        <CheckIcon /> {tier.limits.customers} Customers
                                    </li>
                                    <li className="flex items-center gap-2 text-sm text-slate-600">
                                        <CheckIcon /> {tier.limits.products} Products
                                    </li>
                                    <li className="flex items-center gap-2 text-sm text-slate-600">
                                        <CheckIcon /> {tier.limits.teamMembers} Team Members
                                    </li>
                                    <li className="flex items-center gap-2 text-sm text-slate-600">
                                        <CheckIcon /> {tier.limits.storage} Storage
                                    </li>
                                    <li className="flex items-center gap-2 text-sm text-slate-600">
                                        <CheckIcon /> Mobile App Included
                                    </li>
                                </ul>

                                <button
                                    onClick={() => handleAction(tier.name)}
                                    className={`block w-full py-3 px-4 rounded-lg font-semibold text-center transition-colors ${tier.popular
                                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                                        : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                                        }`}
                                >
                                    {pricingMode === 'payment_link' && tier.name !== 'Enterprise' ? 'Buy Now' : tier.cta}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Feature Comparison */}
            <section className="py-20 px-4 bg-white">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl font-bold text-slate-900 text-center mb-4">
                        Compare All Features
                    </h2>
                    <p className="text-slate-600 text-center mb-12 max-w-2xl mx-auto">
                        Detailed breakdown of what's included in each plan
                    </p>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[800px]">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className="py-4 px-4 text-left text-sm font-semibold text-slate-900">Feature</th>
                                    {tiers.map((tier) => (
                                        <th key={tier.name} className="py-4 px-4 text-center text-sm font-semibold text-slate-900">
                                            {tier.name}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {/* Core Features */}
                                <tr className="bg-slate-50">
                                    <td colSpan={5} className="py-3 px-4 text-sm font-bold text-slate-900 uppercase tracking-wider">
                                        Core Features
                                    </td>
                                </tr>
                                {features.core.map((feature) => (
                                    <tr key={feature.name} className="border-b border-slate-100">
                                        <td className="py-3 px-4 text-sm text-slate-700">{feature.name}</td>
                                        <td className="py-3 px-4 text-center"><FeatureValue value={feature.starter} /></td>
                                        <td className="py-3 px-4 text-center"><FeatureValue value={feature.growth} /></td>
                                        <td className="py-3 px-4 text-center"><FeatureValue value={feature.business} /></td>
                                        <td className="py-3 px-4 text-center"><FeatureValue value={feature.enterprise} /></td>
                                    </tr>
                                ))}

                                {/* E-commerce */}
                                <tr className="bg-slate-50">
                                    <td colSpan={5} className="py-3 px-4 text-sm font-bold text-slate-900 uppercase tracking-wider">
                                        E-commerce
                                    </td>
                                </tr>
                                {features.ecommerce.map((feature) => (
                                    <tr key={feature.name} className="border-b border-slate-100">
                                        <td className="py-3 px-4 text-sm text-slate-700">{feature.name}</td>
                                        <td className="py-3 px-4 text-center"><FeatureValue value={feature.starter} /></td>
                                        <td className="py-3 px-4 text-center"><FeatureValue value={feature.growth} /></td>
                                        <td className="py-3 px-4 text-center"><FeatureValue value={feature.business} /></td>
                                        <td className="py-3 px-4 text-center"><FeatureValue value={feature.enterprise} /></td>
                                    </tr>
                                ))}

                                {/* Communication */}
                                <tr className="bg-slate-50">
                                    <td colSpan={5} className="py-3 px-4 text-sm font-bold text-slate-900 uppercase tracking-wider">
                                        Communication
                                    </td>
                                </tr>
                                {features.communication.map((feature) => (
                                    <tr key={feature.name} className="border-b border-slate-100">
                                        <td className="py-3 px-4 text-sm text-slate-700">
                                            {feature.name}
                                            {feature.soon && <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">Soon</span>}
                                        </td>
                                        <td className="py-3 px-4 text-center"><FeatureValue value={feature.starter} soon={feature.soon} /></td>
                                        <td className="py-3 px-4 text-center"><FeatureValue value={feature.growth} soon={feature.soon} /></td>
                                        <td className="py-3 px-4 text-center"><FeatureValue value={feature.business} soon={feature.soon} /></td>
                                        <td className="py-3 px-4 text-center"><FeatureValue value={feature.enterprise} soon={feature.soon} /></td>
                                    </tr>
                                ))}

                                {/* Automation */}
                                <tr className="bg-slate-50">
                                    <td colSpan={5} className="py-3 px-4 text-sm font-bold text-slate-900 uppercase tracking-wider">
                                        Automation
                                    </td>
                                </tr>
                                {features.automation.map((feature) => (
                                    <tr key={feature.name} className="border-b border-slate-100">
                                        <td className="py-3 px-4 text-sm text-slate-700">
                                            {feature.name}
                                            {feature.soon && <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">Soon</span>}
                                        </td>
                                        <td className="py-3 px-4 text-center"><FeatureValue value={feature.starter} soon={feature.soon} /></td>
                                        <td className="py-3 px-4 text-center"><FeatureValue value={feature.growth} soon={feature.soon} /></td>
                                        <td className="py-3 px-4 text-center"><FeatureValue value={feature.business} soon={feature.soon} /></td>
                                        <td className="py-3 px-4 text-center"><FeatureValue value={feature.enterprise} soon={feature.soon} /></td>
                                    </tr>
                                ))}

                                {/* Support */}
                                <tr className="bg-slate-50">
                                    <td colSpan={5} className="py-3 px-4 text-sm font-bold text-slate-900 uppercase tracking-wider">
                                        Support & Extras
                                    </td>
                                </tr>
                                {features.support.map((feature) => (
                                    <tr key={feature.name} className="border-b border-slate-100">
                                        <td className="py-3 px-4 text-sm text-slate-700">{feature.name}</td>
                                        <td className="py-3 px-4 text-center"><FeatureValue value={feature.starter} /></td>
                                        <td className="py-3 px-4 text-center"><FeatureValue value={feature.growth} /></td>
                                        <td className="py-3 px-4 text-center"><FeatureValue value={feature.business} /></td>
                                        <td className="py-3 px-4 text-center"><FeatureValue value={feature.enterprise} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="py-20 px-4 bg-slate-50">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
                        Frequently Asked Questions
                    </h2>

                    <div className="space-y-4">
                        {[
                            {
                                q: 'How do I get started?',
                                a: 'Contact our sales team and we\'ll set up your account within 24 hours. We\'ll guide you through the onboarding process.'
                            },
                            {
                                q: 'Can I upgrade or downgrade anytime?',
                                a: 'Absolutely. You can upgrade or downgrade your plan at any time. Changes take effect on your next billing cycle.'
                            },
                            {
                                q: 'Is the mobile app included?',
                                a: 'Yes, mobile app access is included in all plans at no extra cost. Available for both iOS and Android.'
                            },
                            {
                                q: 'What payment methods do you accept?',
                                a: 'We accept all major credit/debit cards, UPI, Net Banking, and bank transfers for annual plans.'
                            },
                            {
                                q: 'What happens if I exceed my limits?',
                                a: 'We\'ll notify you when you\'re approaching limits. You can upgrade your plan or purchase add-ons to increase limits.'
                            },
                            {
                                q: 'Do you offer custom enterprise plans?',
                                a: 'Yes, for large organizations with specific needs, we offer custom plans with tailored features and pricing. Contact our sales team.'
                            }
                        ].map((faq, i) => (
                            <details key={i} className="group bg-white rounded-xl border border-slate-200 overflow-hidden">
                                <summary className="flex items-center justify-between p-5 cursor-pointer list-none">
                                    <span className="font-medium text-slate-900">{faq.q}</span>
                                    <svg className="w-5 h-5 text-slate-500 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </summary>
                                <div className="px-5 pb-5 text-slate-600">
                                    {faq.a}
                                </div>
                            </details>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-indigo-700">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                        Ready to Grow Your Business?
                    </h2>
                    <p className="text-xl text-blue-100 mb-8">
                        Get in touch with our sales team to find the perfect plan for your needs.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={() => handleContactClick('')}
                            className="px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                        >
                            Contact Sales
                        </button>
                        <a
                            href="/contact"
                            className="px-8 py-4 border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition-colors"
                        >
                            Learn More
                        </a>
                    </div>
                </div>
            </section>

            {/* Contact Modal */}
            {showContactModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 relative max-h-[90vh] overflow-y-auto">
                        <button
                            onClick={() => setShowContactModal(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <div className="text-center mb-6">
                            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-1">
                                Contact Sales{selectedPlan && ` - ${selectedPlan} Plan`}
                            </h3>
                            <p className="text-slate-500 text-sm">
                                Fill out the form and we'll get back to you within 24 hours.
                            </p>
                        </div>

                        {submitted ? (
                            /* Success Message */
                            <div className="text-center py-8">
                                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h4 className="text-xl font-bold text-slate-900 mb-2">Thank You!</h4>
                                <p className="text-slate-600 mb-6">
                                    We've received your inquiry and will get back to you within 24 hours.
                                </p>
                                <button
                                    onClick={() => setShowContactModal(false)}
                                    className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        ) : (
                            /* Contact Form */
                            <form
                                className="space-y-4"
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    setSubmitting(true);

                                    // Get CAPTCHA token
                                    const captchaToken = await getCaptchaToken();

                                    const formData = new FormData(e.target);
                                    const selectedPlanValue = formData.get('plan') || selectedPlan || 'General';
                                    const userMessage = formData.get('message') || '';
                                    const data = {
                                        name: formData.get('name'),
                                        email: formData.get('email'),
                                        phone: formData.get('phone'),
                                        company: formData.get('company'),
                                        message: `📋 Plan: NexCRM ${selectedPlanValue}\n\n${userMessage || 'Interested in learning more about NexCRM.'}`,
                                        captchaToken
                                    };

                                    try {
                                        const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/inquiries`, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify(data)
                                        });

                                        if (response.ok) {
                                            setSubmitted(true);
                                        } else {
                                            const err = await response.json().catch(() => ({}));
                                            showToast(err.error || 'Something went wrong. Please try again.', 'error');
                                        }
                                    } catch (err) {
                                        showToast('Network error. Please try again.', 'error');
                                    } finally {
                                        setSubmitting(false);
                                    }
                                }}
                            >
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                                        <input
                                            type="text"
                                            name="name"
                                            required
                                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                            placeholder="Your name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                                        <input
                                            type="email"
                                            name="email"
                                            required
                                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                            placeholder="you@company.com"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                            placeholder="+91 98765 43210"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Company</label>
                                        <input
                                            type="text"
                                            name="company"
                                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                            placeholder="Your company"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Interested Plan</label>
                                    <select
                                        name="plan"
                                        defaultValue={selectedPlan}
                                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                    >
                                        <option value="">Select a plan</option>
                                        <option value="Starter">Starter - ₹999/mo</option>
                                        <option value="Growth">Growth - ₹2,499/mo</option>
                                        <option value="Business">Business - ₹5,999/mo</option>
                                        <option value="Enterprise">Enterprise - ₹14,999/mo</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
                                    <textarea
                                        name="message"
                                        rows={3}
                                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors resize-none"
                                        placeholder="Tell us about your requirements..."
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <>
                                            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Submitting...
                                        </>
                                    ) : 'Submit Request'}
                                </button>

                                <p className="text-center text-xs text-slate-500">
                                    By submitting, you agree to our <a href="/privacy-policy" className="text-blue-600 hover:underline">Privacy Policy</a>
                                </p>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
