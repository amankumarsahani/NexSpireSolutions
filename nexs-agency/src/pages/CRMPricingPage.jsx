import { Helmet } from 'react-helmet-async';
import { CheckIcon } from '../components/ui/Icons';
import { crmTiers, crmFeatures } from '../constants/crmPricing';
import { SITE_URL, siteConfig } from '../constants/siteConfig';
import FeatureValue from '../components/crm/FeatureValue';
import useCRMPricing from '../hooks/useCRMPricing';

const tiers = crmTiers;
const features = crmFeatures;

export default function CRMPricingPage() {
    const {
        isYearly, setIsYearly,
        showContactModal, setShowContactModal,
        selectedPlan,
        submitting, submitted,
        pricingMode,
        toast,
        dismissToast,
        handleAction,
        submitContactForm,
    } = useCRMPricing();

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            <Helmet>
                <title>NexCRM Pricing - Plans from ₹999/mo | Starter, Growth, Business, Enterprise</title>
                <meta name="description" content="Compare NexCRM pricing plans. Starter ₹999/mo, Growth ₹2,499/mo, Business ₹5,999/mo, Enterprise custom. Save 15% with yearly billing. 14-day free trial on all plans." />
                <meta name="keywords" content="NexCRM pricing, CRM pricing India, affordable CRM plans, CRM software cost, business CRM pricing, agency CRM plans, CRM monthly pricing, CRM enterprise pricing" />
                <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
                <link rel="canonical" href={`${SITE_URL}/nexcrm/pricing`} />
                <meta property="og:site_name" content="Nexspire Solutions" />
                <meta property="og:locale" content="en_IN" />
                <meta property="og:title" content="NexCRM Pricing - Plans from ₹999/mo" />
                <meta property="og:description" content="Compare NexCRM pricing plans. Starter, Growth, Business, Enterprise. Save 15% yearly. 14-day free trial." />
                <meta property="og:type" content="website" />
                <meta property="og:url" content={`${SITE_URL}/nexcrm/pricing`} />
                <meta property="og:image" content={`${SITE_URL}/og-image.jpg`} />
                <meta property="og:image:width" content="1200" />
                <meta property="og:image:height" content="630" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:site" content="@nexspiresolutions" />
                <meta name="twitter:creator" content="@nexspiresolutions" />
                <meta name="twitter:title" content="NexCRM Pricing - Plans from ₹999/mo" />
                <meta name="twitter:description" content="Starter ₹999/mo, Growth ₹2,499/mo, Business ₹5,999/mo. Save 15% yearly. 14-day free trial." />
            </Helmet>
            <script type="application/ld+json">{JSON.stringify({
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                "itemListElement": [
                    { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE_URL },
                    { "@type": "ListItem", "position": 2, "name": "NexCRM", "item": `${SITE_URL}/nexcrm` },
                    { "@type": "ListItem", "position": 3, "name": "Pricing", "item": `${SITE_URL}/nexcrm/pricing` }
                ]
            })}</script>
            <script type="application/ld+json">{JSON.stringify({
                "@context": "https://schema.org",
                "@type": "ItemList",
                "name": "NexCRM Pricing Plans",
                "description": "CRM pricing plans for agencies and businesses",
                "numberOfItems": 4,
                "itemListElement": crmTiers.map((tier, i) => ({
                    "@type": "ListItem",
                    "position": i + 1,
                    "item": {
                        "@type": "Product",
                        "name": `NexCRM ${tier.name}`,
                        "description": tier.tagline,
                        ...(tier.price !== 'Custom' ? {
                            "offers": {
                                "@type": "Offer",
                                "price": String(tier.price),
                                "priceCurrency": "INR",
                                "availability": "https://schema.org/InStock"
                            }
                        } : {})
                    }
                }))
            })}</script>

            {toast.show && (
                <div className={`fixed top-4 right-4 z-[100] px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-fade-in ${toast.type === 'error' ? 'bg-red-500 text-white' : (toast.type === 'info' ? 'bg-[#F8FAFC]0 text-white' : 'bg-emerald-500 text-white')
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
                    <button onClick={dismissToast} className="ml-2 hover:opacity-70">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}

            <section className="pt-32 pb-16 px-4">
                <div className="max-w-7xl mx-auto text-center">
                    <span className="inline-block px-4 py-1.5 bg-[#2563EB]/10 text-[#2563EB] text-sm font-medium rounded-full mb-4">
                        NexCRM Pricing
                    </span>
                    <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
                        Simple, Transparent Pricing
                    </h1>
                    <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-8">
                        Choose a plan that scales with your business. Contact our sales team to get started.
                    </p>

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
                                {Object.entries(features).map(([category, categoryFeatures]) => (
                                    <FeatureCategory
                                        key={category}
                                        title={category === 'support' ? 'Support & Extras' : category.charAt(0).toUpperCase() + category.slice(1)}
                                        features={categoryFeatures}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

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
                                a: 'We accept UPI, cards, net banking, and other methods supported by Razorpay.'
                            },
                            {
                                q: 'What happens if I exceed my limits?',
                                a: 'We\'ll notify you when you\'re approaching limits. You can upgrade your plan or purchase add-ons to increase limits.'
                            },
                            {
                                q: 'Do you offer custom enterprise plans?',
                                a: 'Yes, for large organizations with specific needs, we offer custom plans with tailored features and pricing. Contact our sales team.'
                            }
                        ].map((faq) => (
                            <details key={faq.q} className="group bg-white rounded-xl border border-slate-200 overflow-hidden">
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

            <section className="py-20 px-4 bg-[#2563EB]">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                        Ready to Grow Your Business?
                    </h2>
                    <p className="text-xl text-blue-100 mb-8">
                        Get in touch with our sales team to find the perfect plan for your needs.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={() => handleAction('')}
                            className="px-8 py-4 bg-white text-[#2563EB] rounded-lg font-semibold hover:bg-[#F8FAFC] transition-colors"
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

            {showContactModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 relative max-h-[90vh] overflow-y-auto">
                        <button
                            onClick={() => setShowContactModal(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
                            aria-label="Close contact form"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <div className="text-center mb-6">
                            <div className="w-14 h-14 bg-[#2563EB]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-7 h-7 text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                            <form
                                className="space-y-4"
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    const formData = new FormData(e.target);
                                    await submitContactForm(formData, formData.get('plan') || selectedPlan);
                                }}
                            >
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="crm-name" className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                                        <input
                                            id="crm-name"
                                            type="text"
                                            name="name"
                                            required
                                            minLength={2}
                                            maxLength={100}
                                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] outline-none transition-colors"
                                            placeholder="Your name"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="crm-email" className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                                        <input
                                            id="crm-email"
                                            type="email"
                                            name="email"
                                            required
                                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] outline-none transition-colors"
                                            placeholder="you@company.com"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="crm-phone" className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                                        <input
                                            id="crm-phone"
                                            type="tel"
                                            name="phone"
                                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] outline-none transition-colors"
                                            placeholder="+91 98765 43210"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="crm-company" className="block text-sm font-medium text-slate-700 mb-1">Company</label>
                                        <input
                                            id="crm-company"
                                            type="text"
                                            name="company"
                                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] outline-none transition-colors"
                                            placeholder="Your company"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="crm-plan" className="block text-sm font-medium text-slate-700 mb-1">Interested Plan</label>
                                    <select
                                        id="crm-plan"
                                        name="plan"
                                        defaultValue={selectedPlan}
                                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] outline-none transition-colors"
                                    >
                                        <option value="">Select a plan</option>
                                        <option value="Starter">Starter - ₹999/mo</option>
                                        <option value="Growth">Growth - ₹2,499/mo</option>
                                        <option value="Business">Business - ₹5,999/mo</option>
                                        <option value="Enterprise">Enterprise - ₹14,999/mo</option>
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="crm-message" className="block text-sm font-medium text-slate-700 mb-1">Message</label>
                                    <textarea
                                        id="crm-message"
                                        name="message"
                                        rows={3}
                                        maxLength={2000}
                                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] outline-none transition-colors resize-none"
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
                                    By submitting, you agree to our <a href="/privacy-policy" className="text-[#2563EB] hover:underline">Privacy Policy</a>
                                </p>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function FeatureCategory({ title, features: categoryFeatures }) {
    return (
        <>
            <tr className="bg-slate-50">
                <td colSpan={5} className="py-3 px-4 text-sm font-bold text-slate-900 uppercase tracking-wider">
                    {title}
                </td>
            </tr>
            {categoryFeatures.map((feature) => (
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
        </>
    );
}
