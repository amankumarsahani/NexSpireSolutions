// TODO: Replace console.error with Sentry or proper error tracking
import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { settingsAPI, billingAPI } from '../services/api';
import { CheckIcon, XIcon } from '../components/ui/Icons';
import { crmTiers, crmFeatures } from '../constants/crmPricing';
import { SITE_URL } from '../constants/siteConfig';

// --- Data ---
const industries = [
    { name: "Digital Agencies", icon: "ri-briefcase-4-line", color: "text-[#0F766E]", bg: "bg-[#FAF9F6]" },
    { name: "Freelancers", icon: "ri-macbook-line", color: "text-[#0F766E]", bg: "bg-[#FAF9F6]" },
    { name: "E-commerce", icon: "ri-store-2-line", color: "text-emerald-600", bg: "bg-emerald-50" },
    { name: "Consultants", icon: "ri-discuss-line", color: "text-amber-600", bg: "bg-amber-50" },
    { name: "Real Estate", icon: "ri-building-2-line", color: "text-rose-600", bg: "bg-rose-50" },
    { name: "SaaS Startups", icon: "ri-arrow-right-up-line", color: "text-[#0F766E]", bg: "bg-indigo-50" },
    { name: "Marketing Teams", icon: "ri-megaphone-line", color: "text-cyan-600", bg: "bg-cyan-50" },
    { name: "Event Planners", icon: "ri-calendar-event-line", color: "text-pink-600", bg: "bg-pink-50" }
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
    const [contactEmail, setContactEmail] = useState('sales@nexspire.com');
    const [loadingSettings, setLoadingSettings] = useState(true);

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
        <div className="min-h-screen bg-white font-sans text-slate-900 overflow-x-hidden selection:bg-[#0F766E]/10">
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
                        initial={{ opacity: 0, y: -20, x: 20 }}
                        animate={{ opacity: 1, y: 0, x: 0 }}
                        exit={{ opacity: 0, y: -20, x: 20 }}
                        className={`fixed top-24 right-4 z-[100] px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 backdrop-blur-md border ${toast.type === 'error' ? 'bg-red-500/90 text-white border-red-500' : (toast.type === 'info' ? 'bg-blue-600/90 text-white border-blue-500' : 'bg-emerald-500/90 text-white border-emerald-500')}`}
                    >
                        <span className="font-medium">{toast.message}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-[url('https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=2600&q=80&fm=webp')] bg-cover bg-center">
                {/* Hero Overlay */}
                <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-0"></div>

                {/* Background Elements */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-[#0F766E]/10 to-transparent rounded-full blur-3xl opacity-60 pointer-events-none z-0" />

                <div className="container-custom px-6 max-w-7xl mx-auto relative z-10 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200 text-slate-600 text-sm font-medium mb-8 hover:shadow-md transition-all cursor-default relative overflow-hidden">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse relative z-10"></span>
                            <span className="relative z-10">v2.0 is now live</span>
                            <div className="absolute inset-0 bg-[#FAF9F6] opacity-50"></div>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 mb-8 leading-[1.1]">
                            The Operating System for <br className="hidden md:block" />
                            <span className="text-[#0F766E]">running your agency.</span>
                        </h1>

                        <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
                            Stop stitching together 5 different tools. Manage leads, projects, invoices, and client support in one unified platform.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <button onClick={() => document.getElementById('pricing').scrollIntoView({ behavior: 'smooth' })} className="px-8 py-4 bg-slate-900 text-white rounded-xl font-semibold shadow-xl shadow-slate-900/20 hover:bg-slate-800  transition-all duration-300 ring-4 ring-slate-900/10">
                                Start Free Trial
                            </button>
                            <a href="/contact" className="px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-xl font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all duration-300 shadow-sm">
                                Book a Demo
                            </a>
                        </div>
                    </motion.div>

                    {/* Dashboard Mockup (3D Tilt) */}
                    <motion.div
                        initial={{ opacity: 0, y: 60, rotateX: 10 }}
                        animate={{ opacity: 1, y: 0, rotateX: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="mt-20 relative mx-auto max-w-5xl"
                        style={{ perspective: '1000px' }}
                    >
                        <div className="relative rounded-2xl border-[6px] border-slate-900 bg-slate-900 shadow-2xl overflow-hidden aspect-[16/9] group ring-1 ring-slate-900/50">
                            <img
                                src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2426&q=80&fm=webp"
                                srcSet="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=640&fm=webp 640w, https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1024&fm=webp 1024w, https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1920&fm=webp 1920w"
                                sizes="(max-width: 640px) 640px, (max-width: 1024px) 1024px, 1920px"
                                alt="Dashboard Preview"
                                className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent pointer-events-none"></div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Industry Marquee */}
            <section className="py-12 border-y border-slate-100 bg-slate-50/50 overflow-hidden">
                <div className="flex gap-12 animate-scroll w-max hover:pause-scroll">
                    {[...industries, ...industries, ...industries].map((ind, i) => (
                        <div key={i} className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity cursor-default">
                            <div className={`w-10 h-10 rounded-lg ${ind.bg} ${ind.color} flex items-center justify-center text-xl`}>
                                <i className={ind.icon}></i>
                            </div>
                            <span className="font-semibold text-slate-700 text-lg whitespace-nowrap">{ind.name}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Features (Bento Grid) */}
            <section className="py-32 bg-slate-50 relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

                <div className="container-custom px-6 max-w-7xl mx-auto relative z-10">
                    <div className="max-w-3xl mx-auto text-center mb-24">
                        <span className="text-[#0F766E] font-bold tracking-wider uppercase text-sm mb-4 block">Capabilities</span>
                        <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6 font-display">Everything you need to <span className="text-[#0F766E]">scale.</span></h2>
                        <p className="text-xl text-slate-600 font-light">Unified tools that replace your fragmented tech stack.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 auto-rows-[340px]">
                        {/* Large Feature - Dashboard */}
                        <div className="md:col-span-2 md:row-span-1 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:border-slate-200 transition-all group overflow-hidden relative">
                            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=2600&q=80&fm=webp')] bg-cover bg-center transition-transform duration-700 group-"></div>
                            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-transparent"></div>

                            <div className="relative z-10 p-10 h-full flex flex-col justify-center max-w-md">
                                <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-lg shadow-lg"><i className="ri-dashboard-3-line"></i></div>
                                <h3 className="text-3xl font-bold text-slate-900 mb-4">Centralized Operations</h3>
                                <p className="text-slate-600 text-lg leading-relaxed font-medium">See everything in one place. Revenue, project status, leads, and support tickets at a glance.</p>
                            </div>
                        </div>

                        {/* Tall Feature - Mobile App */}
                        <div className="md:col-span-1 md:row-span-2 bg-slate-900 rounded-[2rem] p-8 border border-slate-800 text-white hover:shadow-2xl hover:shadow-lg transition-all relative overflow-hidden group flex flex-col items-center text-center">
                            <div className="relative z-10 mb-8">
                                <div className="w-14 h-14 bg-white/10 text-white rounded-2xl flex items-center justify-center text-2xl mb-6 mx-auto backdrop-blur-md border border-white/10"><i className="ri-smartphone-line"></i></div>
                                <h3 className="text-2xl font-bold mb-3">Mobile App</h3>
                                <p className="text-slate-400 leading-relaxed font-medium">Manage your agency from anywhere.</p>
                            </div>

                            <div className="w-56 flex-grow bg-slate-800 rounded-t-[2.5rem] border-[8px] border-slate-700 overflow-hidden relative shadow-2xl group-hover:translate-y-2 transition-transform duration-500">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-slate-700 rounded-b-xl z-20"></div>
                                <img
                                    src="https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?ixlib=rb-4.0.3&auto=format&fit=crop&w=900&q=80&fm=webp"
                                    alt="Mobile App"
                                    loading="lazy"
                                    className="w-full h-full object-cover"
                                />
                                {/* Phone Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent"></div>

                                {/* Notification Mockup - Animated */}
                                <div className="absolute bottom-6 left-4 right-4 bg-white/10 backdrop-blur-md border border-white/10 p-3 rounded-xl flex items-center gap-3 animate-pulse">
                                    <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-xs text-white"><i className="ri-check-line"></i></div>
                                    <div className="text-left">
                                        <div className="text-xs text-slate-300">New Payment</div>
                                        <div className="text-sm font-bold">₹24,000 received</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Standard Feature - Invoicing */}
                        <div className="md:col-span-1 bg-white rounded-[2rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/50 hover:translate-y-[-4px] hover:shadow-2xl transition-all group">
                            <div className="w-14 h-14 bg-[#FAF9F6] text-[#0F766E] rounded-2xl flex items-center justify-center text-2xl mb-6 group- transition-transform"><i className="ri-bank-card-line"></i></div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Invoicing & Payments</h3>
                            <p className="text-slate-600 font-medium leading-relaxed">Accept payments via Razorpay with UPI, cards, and net banking.</p>
                        </div>

                        {/* Standard Feature - Pipeline */}
                        <div className="md:col-span-1 bg-white rounded-[2rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/50 hover:translate-y-[-4px] hover:shadow-2xl transition-all group">
                            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl mb-6 group- transition-transform"><i className="ri-user-follow-line"></i></div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Lead Pipeline</h3>
                            <p className="text-slate-600 font-medium leading-relaxed">Drag-and-drop kanban board to track deals from lead to close.</p>
                        </div>

                        {/* Wide Feature - AI Automation */}
                        <div className="md:col-span-3 rounded-[2rem] p-10 border border-slate-200 hover:border-slate-200 hover:shadow-lg transition-all flex flex-col md:flex-row items-center gap-10 overflow-hidden relative group">
                            {/* Background Image */}
                            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1620712943543-bcc4688e7485?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80&fm=webp')] bg-cover bg-center opacity-10 group-hover:opacity-20 transition-opacity duration-500"></div>
                            <div className="absolute inset-0 bg-gradient-to-r from-white via-white to-transparent"></div>

                            <div className="flex-1 relative z-10 pl-4">
                                <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center text-2xl mb-6"><i className="ri-robot-2-line"></i></div>
                                <h3 className="text-3xl font-bold text-slate-900 mb-4">AI Automation</h3>
                                <p className="text-slate-600 text-lg leading-relaxed font-medium max-w-lg">Let AI handle the busy work. Auto-responses, meeting scheduling, and smart follow-ups so you can focus on high-value work.</p>
                            </div>

                            <div className="flex-1 w-full max-w-md bg-white rounded-2xl shadow-lg border border-slate-100 p-6 relative z-10 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                <div className="flex items-start gap-4 mb-6">
                                    <div className="w-10 h-10 rounded-full bg-[#0F766E]/10 flex-shrink-0 flex items-center justify-center text-[#0F766E] font-bold border-2 border-white shadow-sm"><i className="ri-robot-line"></i></div>
                                    <div className="bg-slate-50 p-4 rounded-2xl rounded-tl-none text-slate-700 font-medium shadow-inner text-sm leading-relaxed border border-slate-100">
                                        "I noticed the client hasn't replied to the proposal sent 3 days ago. Should I send a follow-up email?"
                                    </div>
                                </div>
                                <div className="flex gap-3 justify-end">
                                    <button className="bg-slate-100 text-slate-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-colors">Edit</button>
                                    <button className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-md shadow-lg">Yes, Send it</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-32 bg-white relative">
                <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none"></div>
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-slate-900 mb-6">Simple, Transparent Pricing</h2>
                        <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-12">Start for free, scale as you grow.</p>

                        {/* Custom Toggle */}
                        <div className="inline-flex bg-slate-50 p-1 rounded-full border border-slate-200 shadow-sm relative">
                            <div
                                className={`absolute top-1 bottom-1 w-[120px] bg-white rounded-full transition-all duration-300 shadow-md border border-slate-100 ${isYearly ? 'left-[124px]' : 'left-1'}`}
                            />
                            <button onClick={() => setIsYearly(false)} className={`relative z-10 w-[120px] py-2.5 text-sm font-semibold rounded-full transition-colors ${!isYearly ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}>
                                Monthly
                            </button>
                            <button onClick={() => setIsYearly(true)} className={`relative z-10 w-[120px] py-2.5 text-sm font-semibold rounded-full transition-colors ${isYearly ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}>
                                Yearly <span className="text-xs opacity-80 font-normal ml-1 text-emerald-600 font-bold">(-15%)</span>
                            </button>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {tiers.map((tier) => (
                            <div key={tier.name} className={`relative flex flex-col bg-slate-50 rounded-3xl p-8 transition-all duration-300 hover:-translate-y-1 overflow-hidden group ${tier.popular ? 'ring-2 ring-blue-600 shadow-2xl scale-[1.02] z-10 bg-white' : 'border border-slate-200 shadow-lg hover:shadow-xl hover:bg-white'}`}>
                                {tier.popular && (
                                    <div className="absolute top-0 right-0">
                                        <div className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-2xl shadow-sm">POPULAR</div>
                                    </div>
                                )}

                                <h3 className="text-xl font-bold text-slate-900 mb-2">{tier.name}</h3>
                                <p className="text-slate-500 text-sm mb-6 min-h-[40px] leading-relaxed">{tier.description}</p>

                                <div className="mb-8 relative">
                                    {tier.isCustom ? (
                                        <div className="h-16 flex items-center"><span className="text-4xl font-bold text-slate-900">Custom</span></div>
                                    ) : (
                                        <div className="h-16">
                                            <div className="flex items-baseline">
                                                <span className="text-4xl font-bold text-slate-900 tracking-tight">
                                                    {tier.currency}{isYearly ? tier.price.yearly : tier.price.monthly}
                                                </span>
                                                <span className="text-slate-500 font-medium ml-1">/mo</span>
                                            </div>
                                            {isYearly && <p className="text-xs text-emerald-600 font-bold mt-1">Billed ₹{(tier.price.yearly * 12).toLocaleString()} yearly</p>}
                                        </div>
                                    )}
                                </div>

                                <ul className="space-y-4 mb-8 flex-grow relative z-10">
                                    <li className="flex items-start gap-3 text-sm text-slate-600 group-hover:text-slate-700 transition-colors">
                                        <div className="mt-0.5"><CheckIcon /></div>
                                        <span><strong className="text-slate-900">{tier.limits.leads}</strong> Leads</span>
                                    </li>
                                    <li className="flex items-start gap-3 text-sm text-slate-600 group-hover:text-slate-700 transition-colors">
                                        <div className="mt-0.5"><CheckIcon /></div>
                                        <span><strong className="text-slate-900">{tier.limits.customers}</strong> Customers</span>
                                    </li>
                                    <li className="flex items-start gap-3 text-sm text-slate-600 group-hover:text-slate-700 transition-colors">
                                        <div className="mt-0.5"><CheckIcon /></div>
                                        <span><strong className="text-slate-900">{tier.limits.teamMembers}</strong> Team Members</span>
                                    </li>
                                    <li className="flex items-start gap-3 text-sm text-slate-600 group-hover:text-slate-700 transition-colors">
                                        <div className="mt-0.5"><CheckIcon /></div>
                                        <span>{tier.limits.storage} Storage</span>
                                    </li>
                                </ul>

                                <button
                                    onClick={() => handleAction(tier.name)}
                                    className={`w-full py-4 rounded-xl font-bold transition-all duration-300 transform active:scale-95 border ${tier.popular ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-lg' : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md'}`}
                                >
                                    {tier.cta}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Comparison Table (Refined) */}
            <section className="py-32 bg-slate-50 relative border-t border-slate-200">
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-slate-900 mb-6">Compare features</h2>
                        <p className="text-lg text-slate-600 max-w-2xl mx-auto"> detailed breakdown of what's included in each plan.</p>
                    </div>

                    <div className="overflow-x-auto bg-white border border-slate-200 rounded-[2rem] shadow-xl shadow-slate-200/40 custom-scrollbar">
                        <table className="w-full min-w-[900px]">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-200">
                                    <th className="py-6 px-8 text-left text-sm font-semibold text-slate-900 w-1/4 uppercase tracking-wider">Feature</th>
                                    {tiers.map((tier) => (
                                        <th key={tier.name} className="py-6 px-6 text-center text-sm font-bold text-slate-900 w-[18%]">
                                            {tier.name}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {Object.keys(features).map((category) => (
                                    <>
                                        <tr key={category} className="bg-slate-50/80">
                                            <td colSpan={5} className="py-3 px-8 text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50 backdrop-blur-sm sticky left-0">
                                                {category.charAt(0).toUpperCase() + category.slice(1)}
                                            </td>
                                        </tr>
                                        {features[category].map((feature) => (
                                            <tr key={feature.name} className="hover:bg-[#FAF9F6]/30 transition-colors group duration-150">
                                                <td className="py-4 px-8 text-sm text-slate-600 font-medium group-hover:text-blue-900 group-hover:pl-9 transition-all">
                                                    {feature.name}
                                                    {feature.soon && <span className="ml-2 text-[10px] uppercase bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold tracking-wide border border-amber-200">Soon</span>}
                                                </td>
                                                <td className="py-4 px-6 text-center"><FeatureValue value={feature.starter} soon={feature.soon} /></td>
                                                <td className="py-4 px-6 text-center"><FeatureValue value={feature.growth} soon={feature.soon} /></td>
                                                <td className="py-4 px-6 text-center"><FeatureValue value={feature.business} soon={feature.soon} /></td>
                                                <td className="py-4 px-6 text-center"><FeatureValue value={feature.enterprise} soon={feature.soon} /></td>
                                            </tr>
                                        ))}
                                    </>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-32 px-6">
                <div className="max-w-5xl mx-auto bg-slate-900 rounded-[2.5rem] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl">
                    {/* Glow effects */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-[#0F766E]/10 to-transparent pointer-events-none" />

                    <div className="relative z-10">
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                            Ready to transform your agency?
                        </h2>
                        <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
                            Join 2,000+ agencies using NexCRM to scale their operations.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button onClick={() => document.getElementById('pricing').scrollIntoView({ behavior: 'smooth' })} className="px-10 py-5 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-[#FAF9F6]0  transition-all shadow-lg shadow-lg">
                                Get Started Now
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Contact Modal */}
            {showContactModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 relative max-h-[90vh] overflow-y-auto"
                    >
                        <button onClick={() => setShowContactModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-50 rounded-full transition-colors">
                            <XIcon />
                        </button>

                        <div className="text-center mb-8">
                            <div className="w-14 h-14 bg-[#0F766E]/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-[#0F766E] text-2xl shadow-inner"><i className="ri-mail-send-line"></i></div>
                            <h3 className="text-2xl font-bold text-slate-900">Contact Sales</h3>
                            <p className="text-slate-500 mt-2">Let's simplify your agency operations.</p>
                        </div>

                        {submitted ? (
                            <div className="text-center py-10">
                                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600 text-4xl animate-bounce"><i className="ri-check-line"></i></div>
                                <h4 className="text-2xl font-bold text-slate-900 mb-2">Request Sent!</h4>
                                <p className="text-slate-600 mb-8">Our team will reach out within 24 hours.</p>
                                <button onClick={() => setShowContactModal(false)} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors">Close</button>
                            </div>
                        ) : (
                            <form className="space-y-5" onSubmit={async (e) => {
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
                                } catch (err) { showToast('Network error', 'error'); }
                                finally { setSubmitting(false); }
                            }}>
                                <div className="space-y-4">
                                    <input type="text" name="name" required minLength={2} maxLength={100} placeholder="Full Name" aria-label="Full name" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0F766E] focus:bg-white outline-none transition-all" />
                                    <input type="email" name="email" required placeholder="Work Email" aria-label="Email address" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0F766E] focus:bg-white outline-none transition-all" />
                                    <div className="grid grid-cols-2 gap-4">
                                        <input type="tel" name="phone" placeholder="Phone" aria-label="Phone number" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0F766E] focus:bg-white outline-none transition-all" />
                                        <input type="text" name="company" placeholder="Company" aria-label="Company name" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0F766E] focus:bg-white outline-none transition-all" />
                                    </div>
                                    <textarea name="message" rows="3" maxLength={2000} placeholder="Additional details..." aria-label="Your message" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0F766E] focus:bg-white outline-none resize-none transition-all"></textarea>
                                </div>
                                <button disabled={submitting} type="submit" className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-70 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transform duration-200">
                                    {submitting && <i className="ri-loader-4-line animate-spin"></i>}
                                    Submit Request
                                </button>
                            </form>
                        )}
                    </motion.div>
                </div>
            )}
        </div>
    );
}
