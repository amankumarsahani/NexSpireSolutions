// TODO: Replace console.error with Sentry or proper error tracking
import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { settingsAPI, billingAPI } from '../services/api';
import { CheckIcon, XIcon } from '../components/ui/Icons';
import { crmTiers, crmFeatures } from '../constants/crmPricing';
import { SITE_URL } from '../constants/siteConfig';

const FadeIn = ({ children, className, delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5, delay, ease: "easeOut" }}
        className={className}
    >
        {children}
    </motion.div>
);

const industries = [
    { name: "Digital Agencies", icon: "ri-briefcase-4-line" },
    { name: "Freelancers", icon: "ri-macbook-line" },
    { name: "E-commerce", icon: "ri-store-2-line" },
    { name: "Consultants", icon: "ri-discuss-line" },
    { name: "Real Estate", icon: "ri-building-2-line" },
    { name: "SaaS Startups", icon: "ri-arrow-right-up-line" },
    { name: "Marketing Teams", icon: "ri-megaphone-line" },
    { name: "Event Planners", icon: "ri-calendar-event-line" }
];

const featureCards = [
    { icon: "ri-dashboard-3-line", title: "Centralized Operations", description: "See everything in one place. Revenue, project status, leads, and support tickets at a glance." },
    { icon: "ri-bank-card-line", title: "Invoicing & Payments", description: "Accept payments via Razorpay with UPI, cards, and net banking. Automated invoice reminders." },
    { icon: "ri-user-follow-line", title: "Lead Pipeline", description: "Drag-and-drop kanban board to track deals from first contact to close." },
    { icon: "ri-smartphone-line", title: "Mobile App", description: "Manage your agency from anywhere. Full functionality on iOS and Android." },
    { icon: "ri-robot-2-line", title: "AI Automation", description: "Auto-responses, smart follow-ups, and meeting scheduling — so you can focus on high-value work." },
    { icon: "ri-customer-service-2-line", title: "Client Portal", description: "White-labeled portal where clients track projects, approve deliverables, and pay invoices." }
];

const tiers = crmTiers.map((tier, i) => {
    const ctaOverrides = ['Start Free Trial', 'Get Started', 'Contact Sales', 'Contact Sales'];
    return { ...tier, cta: ctaOverrides[i] };
});

const features = crmFeatures;

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

export default function NexCRMLandingPage() {
    const [isYearly, setIsYearly] = useState(false);
    const [showContactModal, setShowContactModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [pricingMode, setPricingMode] = useState('contact_us');
    const [, setContactEmail] = useState('sales@nexspire.com');
    const [, setLoadingSettings] = useState(true);

    const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

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
    }, []);

    const getCaptchaToken = async () => {
        if (!window.grecaptcha) {
            throw new Error('reCAPTCHA failed to load. Please refresh the page and try again.');
        }
        try {
            await new Promise(resolve => window.grecaptcha.ready(resolve));
            return await window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: 'pricing_inquiry' });
        } catch {
            throw new Error('reCAPTCHA verification failed. Please refresh the page and try again.');
        }
    };

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

        const planId = planName.toLowerCase();
        showToast('Initiating secure Razorpay checkout...', 'info');
        try {
            const finalPlanId = isYearly ? `${planId}_yearly` : planId;
            const response = await billingAPI.createPaymentLink({
                planId: finalPlanId,
                billingCycle: isYearly ? 'yearly' : 'monthly',
                successUrl: window.location.origin + '/nexcrm?payment=success',
                cancelUrl: window.location.origin + '/nexcrm/pricing?payment=cancelled',
                metadata: {
                    source: 'agency_pricing_page',
                    billing_cycle: isYearly ? 'yearly' : 'monthly'
                }
            });

            if (response.data.success && response.data.url) {
                const paymentUrl = new URL(response.data.url, window.location.origin);
                const allowedHosts = [window.location.hostname, 'razorpay.com', 'api.razorpay.com', 'checkout.razorpay.com'];
                if (allowedHosts.some(h => paymentUrl.hostname === h || paymentUrl.hostname.endsWith('.' + h))) {
                    window.location.href = response.data.url;
                } else {
                    showToast('Invalid checkout URL. Please contact support.');
                }
            } else {
                showToast(response.data.error || 'Failed to generate checkout link');
            }
        } catch (err) {
            showToast('Failed to initiate Razorpay checkout. Please contact support.');
            console.error('Razorpay checkout error:', err);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800 selection:bg-blue-600 selection:text-white">
            <Helmet>
                <title>NexCRM - The Operating System for Modern Agencies</title>
                <meta name="description" content="Streamline your agency with NexCRM. Integrated project management, CRM, invoicing, and client portals." />
                <link rel="canonical" href={`${SITE_URL}/nexcrm`} />
                <meta property="og:title" content="NexCRM - The Operating System for Modern Agencies" />
                <meta property="og:description" content="Streamline your agency with NexCRM. Integrated project management, CRM, invoicing, and client portals." />
                <meta property="og:type" content="website" />
                <meta property="og:url" content={`${SITE_URL}/nexcrm`} />
                <meta property="og:image" content={`${SITE_URL}/og-image.jpg`} />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="NexCRM - The Operating System for Modern Agencies" />
                <meta name="twitter:description" content="Streamline your agency with NexCRM. Integrated project management, CRM, invoicing, and client portals." />
            </Helmet>

            {/* Toast */}
            <AnimatePresence>
                {toast.show && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`fixed top-24 right-4 z-[100] px-5 py-3 rounded-lg shadow-md flex items-center gap-3 text-sm font-medium ${toast.type === 'error' ? 'bg-red-600 text-white' : (toast.type === 'info' ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white')}`}
                    >
                        {toast.message}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Hero ── */}
            <section className="pt-32 pb-16 lg:pt-40 lg:pb-20 bg-white">
                <div className="container-custom text-center">
                    <FadeIn>
                        <span className="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-sm font-medium mb-8">
                            v2.0 is now live
                        </span>
                    </FadeIn>

                    <FadeIn delay={0.05}>
                        <h1 className="font-serif text-5xl lg:text-6xl text-slate-900 tracking-tight mb-6">
                            The Operating System for{' '}
                            <span className="text-[#2563EB]">running your agency.</span>
                        </h1>
                    </FadeIn>

                    <FadeIn delay={0.1}>
                        <p className="text-lg lg:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed mb-10">
                            Stop stitching together 5 different tools. Manage leads, projects,
                            invoices, and client support in one unified platform.
                        </p>
                    </FadeIn>

                    <FadeIn delay={0.15}>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <button
                                onClick={() => document.getElementById('pricing').scrollIntoView({ behavior: 'smooth' })}
                                className="px-7 py-3.5 bg-[#2563EB] text-white rounded-lg font-medium hover:bg-[#1D4ED8] transition-colors duration-200"
                            >
                                Start Free Trial
                            </button>
                            <a
                                href="/contact"
                                className="px-7 py-3.5 text-slate-700 border border-slate-200 rounded-lg font-medium hover:border-slate-300 hover:bg-slate-50 transition-colors duration-200"
                            >
                                Book a Demo
                            </a>
                        </div>
                    </FadeIn>
                </div>
            </section>

            {/* ── Industry Marquee ── */}
            <section className="py-6 border-y border-slate-200 bg-white overflow-hidden">
                <div className="flex gap-10 animate-marquee w-max">
                    {[...industries, ...industries].map((ind, i) => (
                        <div key={i} className="flex items-center gap-2.5 text-slate-400 whitespace-nowrap">
                            <i className={`${ind.icon} text-lg`} />
                            <span className="text-sm font-medium">{ind.name}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Features ── */}
            <section className="py-24 lg:py-32">
                <div className="container-custom">
                    <FadeIn>
                        <div className="text-center mb-16">
                            <h2 className="font-serif text-3xl lg:text-4xl text-slate-900 mb-4">
                                Everything you need to scale.
                            </h2>
                            <p className="text-lg text-slate-500 max-w-xl mx-auto">
                                Unified tools that replace your fragmented tech stack.
                            </p>
                        </div>
                    </FadeIn>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {featureCards.map((card, i) => (
                            <FadeIn key={card.title} delay={i * 0.05}>
                                <div className="rounded-xl border border-slate-200 bg-white p-8 h-full">
                                    <div className="w-10 h-10 rounded-lg bg-slate-100 text-[#2563EB] flex items-center justify-center text-xl mb-5">
                                        <i className={card.icon} />
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-900 mb-2">{card.title}</h3>
                                    <p className="text-slate-500 text-sm leading-relaxed">{card.description}</p>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Pricing ── */}
            <section id="pricing" className="py-24 lg:py-32 bg-slate-50">
                <div className="container-custom">
                    <FadeIn>
                        <div className="text-center mb-16">
                            <h2 className="font-serif text-3xl lg:text-4xl text-slate-900 mb-4">Simple, Transparent Pricing</h2>
                            <p className="text-lg text-slate-500 max-w-xl mx-auto mb-10">Start for free, scale as you grow.</p>

                            {/* Toggle */}
                            <div className="inline-flex bg-white p-1 rounded-full border border-slate-200 relative">
                                <div
                                    className={`absolute top-1 bottom-1 w-[108px] bg-slate-900 rounded-full transition-all duration-300 ${isYearly ? 'left-[112px]' : 'left-1'}`}
                                />
                                <button
                                    onClick={() => setIsYearly(false)}
                                    className={`relative z-10 w-[108px] py-2 text-sm font-medium rounded-full transition-colors ${!isYearly ? 'text-white' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Monthly
                                </button>
                                <button
                                    onClick={() => setIsYearly(true)}
                                    className={`relative z-10 w-[108px] py-2 text-sm font-medium rounded-full transition-colors ${isYearly ? 'text-white' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Yearly <span className="text-xs text-emerald-400 font-semibold">-15%</span>
                                </button>
                            </div>
                        </div>
                    </FadeIn>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {tiers.map((tier, i) => (
                            <FadeIn key={tier.name} delay={i * 0.05}>
                                <div className={`relative flex flex-col rounded-xl p-7 h-full transition-colors duration-200 ${tier.popular ? 'bg-white border-2 border-[#2563EB]' : 'bg-white border border-slate-200'}`}>
                                    {tier.popular && (
                                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#2563EB] text-white text-xs font-semibold px-3 py-1 rounded-full">
                                            Popular
                                        </span>
                                    )}

                                    <h3 className="text-lg font-semibold text-slate-900 mb-1">{tier.name}</h3>
                                    <p className="text-slate-500 text-sm mb-6 min-h-[40px] leading-relaxed">{tier.description}</p>

                                    <div className="mb-6">
                                        {tier.isCustom ? (
                                            <span className="text-3xl font-semibold text-slate-900">Custom</span>
                                        ) : (
                                            <>
                                                <div className="flex items-baseline">
                                                    <span className="text-3xl font-semibold text-slate-900">
                                                        {tier.currency}{isYearly ? tier.price.yearly : tier.price.monthly}
                                                    </span>
                                                    <span className="text-slate-500 text-sm ml-1">/mo</span>
                                                </div>
                                                {isYearly && (
                                                    <p className="text-xs text-emerald-600 font-medium mt-1">
                                                        Billed ₹{(tier.price.yearly * 12).toLocaleString()} yearly
                                                    </p>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    <ul className="space-y-3 mb-8 flex-grow">
                                        <li className="flex items-start gap-2.5 text-sm text-slate-600">
                                            <div className="mt-0.5"><CheckIcon /></div>
                                            <span><strong className="text-slate-900">{tier.limits.leads}</strong> Leads</span>
                                        </li>
                                        <li className="flex items-start gap-2.5 text-sm text-slate-600">
                                            <div className="mt-0.5"><CheckIcon /></div>
                                            <span><strong className="text-slate-900">{tier.limits.customers}</strong> Customers</span>
                                        </li>
                                        <li className="flex items-start gap-2.5 text-sm text-slate-600">
                                            <div className="mt-0.5"><CheckIcon /></div>
                                            <span><strong className="text-slate-900">{tier.limits.teamMembers}</strong> Team Members</span>
                                        </li>
                                        <li className="flex items-start gap-2.5 text-sm text-slate-600">
                                            <div className="mt-0.5"><CheckIcon /></div>
                                            <span>{tier.limits.storage} Storage</span>
                                        </li>
                                    </ul>

                                    <button
                                        onClick={() => handleAction(tier.name)}
                                        className={`w-full py-3 rounded-lg font-medium text-sm transition-colors duration-200 ${tier.popular ? 'bg-[#2563EB] text-white hover:bg-[#1D4ED8]' : 'bg-slate-100 text-slate-900 hover:bg-slate-200'}`}
                                    >
                                        {tier.cta}
                                    </button>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Comparison Table ── */}
            <section className="py-24 lg:py-32 bg-white">
                <div className="container-custom">
                    <FadeIn>
                        <div className="text-center mb-16">
                            <h2 className="font-serif text-3xl lg:text-4xl text-slate-900 mb-4">Compare features</h2>
                            <p className="text-lg text-slate-500 max-w-xl mx-auto">A detailed breakdown of what's included in each plan.</p>
                        </div>
                    </FadeIn>

                    <FadeIn delay={0.1}>
                        <div className="overflow-x-auto rounded-xl border border-slate-200">
                            <table className="w-full min-w-[900px]">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th className="py-4 px-6 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-1/4">Feature</th>
                                        {tiers.map((tier) => (
                                            <th key={tier.name} className="py-4 px-6 text-center text-xs font-semibold text-slate-900 uppercase tracking-wider w-[18%]">
                                                {tier.name}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {Object.keys(features).map((category) => (
                                        <>
                                            <tr key={category} className="bg-slate-50/60">
                                                <td colSpan={5} className="py-2.5 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                                    {category.charAt(0).toUpperCase() + category.slice(1)}
                                                </td>
                                            </tr>
                                            {features[category].map((feature) => (
                                                <tr key={feature.name} className="hover:bg-slate-50 transition-colors duration-150">
                                                    <td className="py-3.5 px-6 text-sm text-slate-600">
                                                        {feature.name}
                                                        {feature.soon && (
                                                            <span className="ml-2 text-[10px] uppercase bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-semibold">Soon</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3.5 px-6 text-center"><FeatureValue value={feature.starter} soon={feature.soon} /></td>
                                                    <td className="py-3.5 px-6 text-center"><FeatureValue value={feature.growth} soon={feature.soon} /></td>
                                                    <td className="py-3.5 px-6 text-center"><FeatureValue value={feature.business} soon={feature.soon} /></td>
                                                    <td className="py-3.5 px-6 text-center"><FeatureValue value={feature.enterprise} soon={feature.soon} /></td>
                                                </tr>
                                            ))}
                                        </>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </FadeIn>
                </div>
            </section>

            {/* ── CTA ── */}
            <section className="py-24 lg:py-32 border-t border-slate-200">
                <div className="container-custom text-center">
                    <FadeIn>
                        <p className="font-serif text-3xl lg:text-4xl text-slate-900 mb-8">
                            Ready to transform your agency?
                        </p>
                        <button
                            onClick={() => document.getElementById('pricing').scrollIntoView({ behavior: 'smooth' })}
                            className="inline-flex items-center gap-2 text-[#2563EB] font-medium text-lg hover:text-[#1D4ED8] transition-colors duration-200"
                        >
                            Get started now
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </button>
                    </FadeIn>
                </div>
            </section>

            {/* ── Contact Modal ── */}
            <AnimatePresence>
                {showContactModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.97 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.97 }}
                            transition={{ duration: 0.2 }}
                            className="bg-white rounded-xl border border-slate-200 shadow-lg max-w-lg w-full p-8 relative max-h-[90vh] overflow-y-auto"
                        >
                            <button
                                onClick={() => setShowContactModal(false)}
                                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-50 rounded-lg transition-colors"
                            >
                                <XIcon />
                            </button>

                            <div className="mb-8">
                                <div className="w-10 h-10 rounded-lg bg-slate-100 text-[#2563EB] flex items-center justify-center text-xl mb-4">
                                    <i className="ri-mail-send-line" />
                                </div>
                                <h3 className="text-xl font-semibold text-slate-900">Contact Sales</h3>
                                <p className="text-slate-500 text-sm mt-1">Let&apos;s simplify your agency operations.</p>
                            </div>

                            {submitted ? (
                                <div className="text-center py-8">
                                    <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600 text-2xl">
                                        <i className="ri-check-line" />
                                    </div>
                                    <h4 className="text-lg font-semibold text-slate-900 mb-1">Request Sent!</h4>
                                    <p className="text-slate-500 text-sm mb-6">Our team will reach out within 24 hours.</p>
                                    <button
                                        onClick={() => setShowContactModal(false)}
                                        className="px-6 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            ) : (
                                <form className="space-y-4" onSubmit={async (e) => {
                                    e.preventDefault();
                                    setSubmitting(true);
                                    let captchaToken;
                                    try {
                                        captchaToken = await getCaptchaToken();
                                    } catch (captchaErr) {
                                        showToast(captchaErr.message, 'error');
                                        setSubmitting(false);
                                        return;
                                    }
                                    const formData = new FormData(e.target);
                                    const data = {
                                        name: formData.get('name'),
                                        email: formData.get('email'),
                                        phone: formData.get('phone'),
                                        company: formData.get('company'),
                                        message: `Plan: NexCRM ${selectedPlan}\n\n${formData.get('message')}`,
                                        captchaToken
                                    };

                                    try {
                                        const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/inquiries`, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify(data)
                                        });
                                        if (response.ok) setSubmitted(true);
                                        else showToast('Submission failed.', 'error');
                                    } catch { showToast('Network error', 'error'); }
                                    finally { setSubmitting(false); }
                                }}>
                                    <input type="text" name="name" required minLength={2} maxLength={100} placeholder="Full Name" aria-label="Full name" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none transition-shadow" />
                                    <input type="email" name="email" required placeholder="Work Email" aria-label="Email address" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none transition-shadow" />
                                    <div className="grid grid-cols-2 gap-3">
                                        <input type="tel" name="phone" placeholder="Phone" aria-label="Phone number" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none transition-shadow" />
                                        <input type="text" name="company" placeholder="Company" aria-label="Company name" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none transition-shadow" />
                                    </div>
                                    <textarea name="message" rows="3" maxLength={2000} placeholder="Additional details..." aria-label="Your message" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none resize-none transition-shadow" />
                                    <button
                                        disabled={submitting}
                                        type="submit"
                                        className="w-full py-3 bg-slate-900 text-white font-medium text-sm rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                                    >
                                        {submitting && <i className="ri-loader-4-line animate-spin" />}
                                        Submit Request
                                    </button>
                                </form>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
