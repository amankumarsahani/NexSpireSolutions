import { useState, useCallback, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { nexmailTiers, nexmailFeatures } from '../constants/nexmailPricing';
import { SITE_URL, siteConfig } from '../constants/siteConfig';
import { CheckIcon, XIcon } from '../components/ui/Icons';
import FeatureValue from '../components/crm/FeatureValue';
import FadeIn from '../components/ui/FadeIn';
import {
    RiMailSendLine, RiRobot2Line, RiBarChartBoxLine, RiShieldCheckLine,
    RiDragDropLine, RiTimeLine, RiUserFollowLine, RiSpamLine,
    RiMailCheckLine, RiFlowChart, RiDashboard3Line, RiServerLine,
    RiCheckLine, RiArrowRightLine, RiStarFill, RiGroupLine,
    RiLinksLine, RiArrowDownSLine, RiLoader4Line, RiCloseLine,
    RiMailLine, RiSendPlaneLine, RiPieChartLine, RiSettings3Line
} from 'react-icons/ri';

const features = [
    { title: 'Drag & Drop Builder', desc: '18 block types with mobile preview, undo/redo, and template versioning.', icon: RiDragDropLine, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Smart SMTP Rotation', desc: 'Weighted multi-account rotation with reputation tracking and auto-disable.', icon: RiServerLine, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { title: 'Anti-Spam Engine', desc: '50+ spam checks, subject analysis, compliance verification. Score < 20 blocks sending.', icon: RiShieldCheckLine, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'Domain Throttling', desc: 'Per-provider limits (Gmail, Yahoo, Outlook) with human-like variable delays.', icon: RiTimeLine, color: 'text-amber-600', bg: 'bg-amber-50' },
    { title: 'Visual Automations', desc: 'Node-based flow builder with 9 triggers, 11 actions, and conditional branching.', icon: RiFlowChart, color: 'text-purple-600', bg: 'bg-purple-50' },
    { title: 'Campaign Analytics', desc: 'Open rates, click maps, delivery funnels, engagement heatmaps, and leaderboards.', icon: RiBarChartBoxLine, color: 'text-rose-600', bg: 'bg-rose-50' },
    { title: 'Contact Scoring', desc: 'Automatic 0-100 engagement scores based on opens, clicks, recency, and bounces.', icon: RiUserFollowLine, color: 'text-cyan-600', bg: 'bg-cyan-50' },
    { title: 'CRM Integration', desc: 'Native sync with NexCRM. Contacts auto-imported from leads and customers.', icon: RiLinksLine, color: 'text-orange-600', bg: 'bg-orange-50' },
    { title: 'Deliverability Tools', desc: 'SPF/DKIM/DMARC verification, warmup mode, bounce handling, suppression lists.', icon: RiMailCheckLine, color: 'text-teal-600', bg: 'bg-teal-50' },
];

const howItWorks = [
    { step: '01', title: 'Configure SMTP', desc: 'Add your sending accounts (Gmail, SES, Postmark). Test the connection instantly.', icon: RiServerLine },
    { step: '02', title: 'Import Contacts', desc: 'Upload CSV, sync from NexCRM, or add manually. Tags and segments included.', icon: RiUserFollowLine },
    { step: '03', title: 'Build & Send', desc: 'Create emails with drag-and-drop, check spam score, and launch your campaign.', icon: RiMailSendLine },
];

const trustStats = [
    { value: '18', label: 'Block Types', icon: RiDragDropLine },
    { value: '50+', label: 'Spam Checks', icon: RiShieldCheckLine },
    { value: '14', label: 'Domain Throttles', icon: RiTimeLine },
    { value: '9', label: 'Auto Triggers', icon: RiFlowChart },
];

const comparisonItems = [
    { feature: 'SMTP Account Rotation', nexmail: true, mailchimp: false, brevo: false },
    { feature: 'Bring Your Own SMTP', nexmail: true, mailchimp: false, brevo: true },
    { feature: 'Spam Score Checker', nexmail: true, mailchimp: false, brevo: false },
    { feature: 'Domain-Level Throttling', nexmail: true, mailchimp: false, brevo: false },
    { feature: 'Adaptive Send Delays', nexmail: true, mailchimp: false, brevo: false },
    { feature: 'NexCRM Native Integration', nexmail: true, mailchimp: false, brevo: false },
    { feature: 'Visual Automation Builder', nexmail: true, mailchimp: true, brevo: true },
    { feature: 'A/B Testing', nexmail: true, mailchimp: true, brevo: true },
    { feature: 'Free Tier', nexmail: '1K contacts', mailchimp: '500 contacts', brevo: '300 emails/day' },
    { feature: 'Starting Price', nexmail: 'Free', mailchimp: '$13/mo', brevo: '$25/mo' },
];

const faqs = [
    { q: 'Can I use my own SMTP servers?', a: 'Yes! NexMail is BYOS (Bring Your Own SMTP). Add unlimited accounts from Gmail, Amazon SES, Postmark, SendGrid, or any SMTP provider. NexMail rotates between them intelligently.' },
    { q: 'How does the spam checker work?', a: 'Our anti-spam engine runs 50+ checks on every email before sending: spam trigger words, subject line analysis, HTML structure, image-to-text ratio, compliance checks (CAN-SPAM/GDPR), and sender reputation. Emails scoring below 20/100 are blocked from sending.' },
    { q: 'What is domain throttling?', a: 'Major email providers (Gmail, Yahoo, Outlook) have strict per-hour limits. NexMail respects these limits automatically — for example, max 80 emails/hour to Gmail addresses — so your sender reputation stays protected.' },
    { q: 'How does SMTP rotation work?', a: 'When you add multiple SMTP accounts, NexMail uses weighted rotation — accounts with better reputation scores and lower usage get selected more often. If one account hits its daily limit, NexMail seamlessly switches to the next.' },
    { q: 'Does it integrate with NexCRM?', a: 'Natively. When a lead or customer is created in NexCRM, their contact is auto-synced to NexMail. You can segment by CRM source, tags, and custom fields.' },
    { q: 'Is there a free plan?', a: 'Yes! The Starter plan is completely free — 1,000 contacts and 5,000 emails per month with the drag-and-drop editor, campaign analytics, and basic automations.' },
];

const featureCategoryLabels = {
    campaigns: 'Campaigns',
    templates: 'Templates & Content',
    contacts: 'Contacts & Segmentation',
    automation: 'Automation',
    deliverability: 'Deliverability Engine',
    analytics: 'Analytics',
    support: 'Support',
};

export default function NexMailLandingPage() {
    const [isYearly, setIsYearly] = useState(false);
    const [showContactModal, setShowContactModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'error' });
    const toastTimerRef = useRef(null);

    const showToast = useCallback((message, type = 'error') => {
        setToast({ show: true, message, type });
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        toastTimerRef.current = setTimeout(() => setToast({ show: false, message: '', type: 'error' }), 4000);
    }, []);

    useEffect(() => {
        return () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); };
    }, []);

    const handleAction = useCallback((planName) => {
        setSelectedPlan(planName);
        setShowContactModal(true);
        setSubmitted(false);
    }, []);

    const submitContactForm = useCallback(async (formData) => {
        setSubmitting(true);
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            company: formData.get('company'),
            message: `Plan: NexMail ${selectedPlan || 'General'}\n\n${formData.get('message') || 'Interested in NexMail.'}`,
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
        } catch {
            showToast('Network error. Please try again.', 'error');
        } finally {
            setSubmitting(false);
        }
    }, [selectedPlan, showToast]);

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900 overflow-x-hidden selection:bg-[#2563EB]/10">
            <Helmet>
                <title>NexMail - Email Marketing Engine by Nexspire | SMTP Rotation, Anti-Spam, Automations</title>
                <meta name="description" content="NexMail is an enterprise email marketing engine with smart SMTP rotation, anti-spam scoring, domain throttling, visual automations, and NexCRM integration. Free plan available." />
                <meta name="keywords" content="email marketing tool India, SMTP rotation, anti-spam email, email automation, NexMail, Nexspire, Mailchimp alternative India, Brevo alternative, email campaign tool, email deliverability" />
                <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
                <link rel="canonical" href={`${SITE_URL}/nexmail`} />
                <meta property="og:site_name" content="Nexspire Solutions" />
                <meta property="og:locale" content="en_IN" />
                <meta property="og:title" content="NexMail - Email Marketing Engine by Nexspire" />
                <meta property="og:description" content="Smart SMTP rotation, anti-spam scoring, domain throttling, visual automations, and NexCRM integration. Free plan available." />
                <meta property="og:type" content="website" />
                <meta property="og:url" content={`${SITE_URL}/nexmail`} />
                <meta property="og:image" content={`${SITE_URL}/og-image.jpg`} />
                <meta property="og:image:width" content="1200" />
                <meta property="og:image:height" content="630" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:site" content="@nexspiresolutions" />
                <meta name="twitter:creator" content="@nexspiresolutions" />
                <meta name="twitter:title" content="NexMail - Email Marketing Engine by Nexspire" />
                <meta name="twitter:description" content="Smart SMTP rotation, anti-spam scoring, domain throttling, visual automations, and NexCRM integration." />
            </Helmet>

            <script type="application/ld+json">{JSON.stringify({
                "@context": "https://schema.org", "@type": "SoftwareApplication",
                "name": "NexMail", "applicationCategory": "BusinessApplication", "operatingSystem": "Web",
                "description": "Enterprise email marketing engine with SMTP rotation, anti-spam scoring, and visual automations.",
                "url": `${SITE_URL}/nexmail`,
                "offers": { "@type": "AggregateOffer", "priceCurrency": "INR", "lowPrice": "0", "highPrice": "4999", "offerCount": "5" },
                "provider": { "@type": "Organization", "name": "Nexspire Solutions", "url": SITE_URL, "telephone": siteConfig.phone.primary, "email": siteConfig.email.primary }
            })}</script>
            <script type="application/ld+json">{JSON.stringify({
                "@context": "https://schema.org", "@type": "BreadcrumbList",
                "itemListElement": [
                    { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE_URL },
                    { "@type": "ListItem", "position": 2, "name": "NexMail", "item": `${SITE_URL}/nexmail` }
                ]
            })}</script>

            <AnimatePresence>
                {toast.show && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, x: 20 }}
                        animate={{ opacity: 1, y: 0, x: 0 }}
                        exit={{ opacity: 0, y: -20, x: 20 }}
                        className={`fixed top-24 right-4 z-[100] px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 backdrop-blur-md border ${toast.type === 'error' ? 'bg-red-500/90 text-white border-red-500' : 'bg-emerald-500/90 text-white border-emerald-500'}`}
                    >
                        <span className="font-medium">{toast.message}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Hero */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-[url('https://images.unsplash.com/photo-1596526131083-e8c633c948d2?ixlib=rb-4.0.3&auto=format&fit=crop&w=2600&q=80&fm=webp')] bg-cover bg-center">
                <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-0" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-[#2563EB]/10 to-transparent rounded-full blur-3xl opacity-60 pointer-events-none z-0" />

                <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200 text-slate-600 text-sm font-medium mb-8 hover:shadow-md transition-all cursor-default relative overflow-hidden">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse relative z-10" />
                            <span className="relative z-10">Now available</span>
                            <div className="absolute inset-0 bg-[#F8FAFC] opacity-50" />
                        </div>

                        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 mb-8 leading-[1.1]">
                            Email Marketing<br className="hidden md:block" />
                            <span className="text-[#2563EB]">That Actually Lands.</span>
                        </h1>

                        <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
                            Smart SMTP rotation, 50+ anti-spam checks, per-domain throttling, and visual automations.
                            Built for deliverability, not just sending.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <button onClick={() => handleAction('Free')} className="px-8 py-4 bg-slate-900 text-white rounded-xl font-semibold shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all duration-300 ring-4 ring-slate-900/10">
                                Start Free
                            </button>
                            <a href="#features" className="px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-xl font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all duration-300 shadow-sm">
                                See Features
                            </a>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Stats Bar */}
            <section className="py-10 bg-white border-b border-slate-100">
                <div className="max-w-5xl mx-auto px-6">
                    <FadeIn y={16} duration={0.5}>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
                            {trustStats.map((stat) => (
                                <div key={stat.label} className="flex flex-col items-center text-center gap-2">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg">
                                        <stat.icon />
                                    </div>
                                    <span className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">{stat.value}</span>
                                    <span className="text-sm text-slate-500 font-medium">{stat.label}</span>
                                </div>
                            ))}
                        </div>
                    </FadeIn>
                </div>
            </section>

            {/* Features — Bento Grid */}
            <section id="features" className="py-32 bg-slate-50 relative overflow-hidden">
                <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:24px_24px]" />

                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <FadeIn y={24} duration={0.6}>
                        <div className="max-w-3xl mx-auto text-center mb-24">
                            <span className="text-[#2563EB] font-bold tracking-wider uppercase text-sm mb-4 block">Capabilities</span>
                            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6">Everything you need to <span className="text-[#2563EB]">land in inboxes.</span></h2>
                            <p className="text-xl text-slate-600 font-light">Not just another email tool. NexMail is an email engine — built from the ground up for deliverability.</p>
                        </div>
                    </FadeIn>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 auto-rows-[340px]">
                        {/* Lead card — Email builder with bg image */}
                        <FadeIn y={30} delay={0} className="md:col-span-2 md:row-span-1 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 hover:shadow-2xl transition-all group overflow-hidden relative">
                            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1563986768609-322da13575f2?ixlib=rb-4.0.3&auto=format&fit=crop&w=2600&q=80&fm=webp')] bg-cover bg-center transition-transform duration-700 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-transparent" />
                            <div className="relative z-10 p-10 h-full flex flex-col justify-center max-w-md">
                                <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-lg"><RiDragDropLine /></div>
                                <h3 className="text-3xl font-bold text-slate-900 mb-4">Drag & Drop Builder</h3>
                                <p className="text-slate-600 text-lg leading-relaxed font-medium">18 block types, mobile preview, undo/redo, template versioning. Build beautiful emails without code.</p>
                            </div>
                        </FadeIn>

                        {/* Tall dark card — Deliverability engine */}
                        <FadeIn y={30} delay={0.1} className="md:col-span-1 md:row-span-2 bg-slate-900 rounded-[2rem] p-8 border border-slate-800 text-white hover:shadow-2xl transition-all relative overflow-hidden group flex flex-col">
                            <div className="relative z-10 mb-8">
                                <div className="w-14 h-14 bg-white/10 text-white rounded-2xl flex items-center justify-center text-2xl mb-6 backdrop-blur-md border border-white/10"><RiShieldCheckLine /></div>
                                <h3 className="text-2xl font-bold mb-3">Deliverability Engine</h3>
                                <p className="text-slate-400 leading-relaxed font-medium">SMTP rotation, domain throttling, warmup mode, and reputation monitoring.</p>
                            </div>
                            <div className="flex-1 flex flex-col justify-end gap-3">
                                {['Gmail: 80/hr limit respected', 'Yahoo: 60/hr limit respected', 'Outlook: 100/hr limit respected', 'Custom domains: No throttle'].map((rule, i) => (
                                    <div key={i} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3 backdrop-blur-sm">
                                        <RiCheckLine className="text-emerald-400 flex-shrink-0" />
                                        <span className="text-sm text-slate-300 font-medium">{rule}</span>
                                    </div>
                                ))}
                            </div>
                        </FadeIn>

                        {/* Standard card — SMTP Rotation */}
                        <FadeIn y={30} delay={0.2} className="md:col-span-1 bg-white rounded-[2rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/50 hover:translate-y-[-4px] hover:shadow-2xl transition-all group">
                            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform"><RiServerLine /></div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Smart SMTP Rotation</h3>
                            <p className="text-slate-600 font-medium leading-relaxed">Weighted multi-account rotation. Better reputation = more sends. Auto-disable on issues.</p>
                        </FadeIn>

                        {/* Standard card — Anti-Spam */}
                        <FadeIn y={30} delay={0.3} className="md:col-span-1 bg-white rounded-[2rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/50 hover:translate-y-[-4px] hover:shadow-2xl transition-all group">
                            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform"><RiSpamLine /></div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Anti-Spam Scoring</h3>
                            <p className="text-slate-600 font-medium leading-relaxed">50+ checks on every email. Score below 20? Sending blocked. Protect your reputation.</p>
                        </FadeIn>

                        {/* Full-width card — Automation with mockup */}
                        <FadeIn y={30} delay={0.15} className="md:col-span-3 rounded-[2rem] p-10 border border-slate-200 hover:shadow-lg transition-all flex flex-col md:flex-row items-center gap-10 overflow-hidden relative group">
                            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80&fm=webp')] bg-cover bg-center opacity-10 group-hover:opacity-20 transition-opacity duration-500" />
                            <div className="absolute inset-0 bg-gradient-to-r from-white via-white to-transparent" />
                            <div className="flex-1 relative z-10 pl-4">
                                <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center text-2xl mb-6"><RiFlowChart /></div>
                                <h3 className="text-3xl font-bold text-slate-900 mb-4">Visual Automations</h3>
                                <p className="text-slate-600 text-lg leading-relaxed font-medium max-w-lg">Node-based flow builder with 9 triggers, 11 actions, conditional branching, and webhook integrations. Set it and forget it.</p>
                            </div>
                            <div className="flex-1 w-full max-w-md bg-white rounded-2xl shadow-lg border border-slate-100 p-6 relative z-10 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100">
                                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Automation Running</span>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                                        <RiMailLine className="text-blue-600" />
                                        <span className="text-sm font-medium text-slate-700">New subscriber joins</span>
                                    </div>
                                    <div className="flex justify-center"><div className="w-px h-4 bg-slate-200" /></div>
                                    <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                                        <RiTimeLine className="text-amber-600" />
                                        <span className="text-sm font-medium text-slate-700">Wait 2 hours</span>
                                    </div>
                                    <div className="flex justify-center"><div className="w-px h-4 bg-slate-200" /></div>
                                    <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                                        <RiSendPlaneLine className="text-emerald-600" />
                                        <span className="text-sm font-medium text-slate-700">Send welcome email</span>
                                    </div>
                                </div>
                            </div>
                        </FadeIn>
                    </div>
                </div>
            </section>

            {/* Remaining features — compact grid */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
                        {features.slice(3).map((f, i) => (
                            <FadeIn key={f.title} y={20} delay={i * 0.05}>
                                <div className="p-6 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-lg transition-all duration-300 h-full bg-white group">
                                    <div className={`w-11 h-11 ${f.bg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                        <f.icon className={`text-xl ${f.color}`} />
                                    </div>
                                    <h3 className="text-base font-bold mb-2 text-slate-900">{f.title}</h3>
                                    <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section id="how-it-works" className="py-28 bg-slate-50 relative">
                <div className="max-w-6xl mx-auto px-6">
                    <FadeIn y={24} duration={0.6}>
                        <div className="text-center mb-20">
                            <span className="text-[#2563EB] font-bold tracking-wider uppercase text-sm mb-4 block">How It Works</span>
                            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6">Up and running in <span className="text-[#2563EB]">3 steps.</span></h2>
                            <p className="text-xl text-slate-600 max-w-2xl mx-auto font-light">No lengthy setup. Go from sign-up to sending campaigns in under 10 minutes.</p>
                        </div>
                    </FadeIn>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 relative">
                        <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

                        {howItWorks.map((item, idx) => (
                            <FadeIn key={item.step} y={30} delay={idx * 0.12} className="relative">
                                <div className="bg-white border border-slate-100 rounded-2xl p-8 text-center hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full">
                                    <div className="relative mx-auto mb-6 w-16 h-16">
                                        <div className="absolute inset-0 bg-blue-100 rounded-2xl rotate-6" />
                                        <div className="relative w-16 h-16 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-2xl text-blue-600 shadow-sm">
                                            <item.icon />
                                        </div>
                                    </div>
                                    <div className="text-xs font-bold text-blue-600 tracking-widest uppercase mb-3">Step {item.step}</div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                                    <p className="text-slate-600 leading-relaxed">{item.desc}</p>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* Comparison — NexMail vs Others */}
            <section id="comparison" className="py-28 bg-white">
                <div className="max-w-4xl mx-auto px-6">
                    <FadeIn y={24}>
                        <div className="text-center mb-14">
                            <span className="text-[#2563EB] font-bold tracking-wider uppercase text-sm mb-4 block">Comparison</span>
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">NexMail vs Competitors</h2>
                            <p className="text-lg text-slate-500 max-w-2xl mx-auto">See what makes NexMail different from Mailchimp and Brevo.</p>
                        </div>
                    </FadeIn>
                    <FadeIn y={20} delay={0.1}>
                        <div className="bg-white border border-slate-200 rounded-[2rem] shadow-xl shadow-slate-200/40 overflow-hidden">
                            <div className="overflow-x-auto">
                                <div className="min-w-[600px]">
                                    <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr] bg-slate-50/50 border-b border-slate-200">
                                        <div className="py-4 px-6 text-sm font-semibold text-slate-900 uppercase tracking-wider">Feature</div>
                                        <div className="py-4 px-4 text-center text-sm font-bold text-[#2563EB]">NexMail</div>
                                        <div className="py-4 px-4 text-center text-sm font-semibold text-slate-500">Mailchimp</div>
                                        <div className="py-4 px-4 text-center text-sm font-semibold text-slate-500">Brevo</div>
                                    </div>
                                    {comparisonItems.map((item, i) => (
                                        <div key={item.feature} className={`grid grid-cols-[1.5fr_1fr_1fr_1fr] hover:bg-blue-50/30 transition-colors border-b border-slate-50 last:border-b-0 ${i % 2 === 0 ? '' : 'bg-slate-50/30'}`}>
                                            <div className="py-3.5 px-6 text-sm text-slate-700 font-medium">{item.feature}</div>
                                            {[item.nexmail, item.mailchimp, item.brevo].map((v, j) => (
                                                <div key={j} className="py-3.5 px-4 flex justify-center items-center text-sm">
                                                    {v === true ? <RiCheckLine className={`text-lg ${j === 0 ? 'text-[#2563EB]' : 'text-emerald-500'}`} /> : v === false ? <span className="text-slate-300">—</span> : <span className={j === 0 ? 'font-semibold text-[#2563EB]' : 'text-slate-600'}>{v}</span>}
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </FadeIn>
                </div>
            </section>

            {/* Pricing */}
            <section id="pricing" className="py-32 bg-slate-50 relative">
                <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <FadeIn y={24}>
                        <div className="text-center mb-16">
                            <span className="text-[#2563EB] font-bold tracking-wider uppercase text-sm mb-4 block">Pricing</span>
                            <h2 className="text-4xl font-bold text-slate-900 mb-6">Simple, Transparent Pricing</h2>
                            <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-12">Start free. Scale as you grow. No hidden fees.</p>

                            <div className="inline-flex bg-white p-1 rounded-full border border-slate-200 shadow-sm relative">
                                <div className={`absolute top-1 bottom-1 w-[120px] bg-slate-900 rounded-full transition-all duration-300 shadow-md ${isYearly ? 'left-[124px]' : 'left-1'}`} />
                                <button onClick={() => setIsYearly(false)} className={`relative z-10 w-[120px] py-2.5 text-sm font-semibold rounded-full transition-colors ${!isYearly ? 'text-white' : 'text-slate-500 hover:text-slate-900'}`}>
                                    Monthly
                                </button>
                                <button onClick={() => setIsYearly(true)} className={`relative z-10 w-[120px] py-2.5 text-sm font-semibold rounded-full transition-colors ${isYearly ? 'text-white' : 'text-slate-500 hover:text-slate-900'}`}>
                                    Yearly <span className="text-xs opacity-80 ml-1 text-emerald-400 font-bold">-15%</span>
                                </button>
                            </div>
                        </div>
                    </FadeIn>

                    <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-5">
                        {nexmailTiers.map((tier, idx) => (
                            <FadeIn key={tier.name} y={30} delay={idx * 0.06}>
                                <div className={`relative flex flex-col rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 overflow-hidden h-full ${tier.popular ? 'ring-2 ring-blue-600 shadow-2xl scale-[1.02] z-10 bg-white' : 'bg-white border border-slate-200 shadow-lg hover:shadow-xl'}`}>
                                    {tier.popular && (
                                        <div className="absolute top-0 right-0">
                                            <div className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-2xl shadow-sm">POPULAR</div>
                                        </div>
                                    )}

                                    <h3 className="text-xl font-bold text-slate-900 mb-1">{tier.name}</h3>
                                    <p className="text-slate-500 text-sm mb-5 min-h-[36px] leading-relaxed">{tier.description}</p>

                                    <div className="mb-6">
                                        {tier.price.monthly !== null ? (
                                            <div>
                                                <div className="flex items-baseline">
                                                    <span className="text-3xl font-bold text-slate-900 tracking-tight">{tier.currency}{isYearly ? tier.price.yearly : tier.price.monthly}</span>
                                                    <span className="text-slate-400 font-medium ml-1 text-sm">/mo</span>
                                                </div>
                                                {tier.isFree && <p className="text-xs text-emerald-600 font-semibold mt-1">Free forever</p>}
                                                {isYearly && !tier.isFree && <p className="text-xs text-emerald-600 font-bold mt-1">Billed ₹{(tier.price.yearly * 12).toLocaleString()} yearly</p>}
                                            </div>
                                        ) : (
                                            <div className="h-12 flex items-center"><span className="text-3xl font-bold text-slate-900">Custom</span></div>
                                        )}
                                    </div>

                                    <ul className="space-y-2.5 mb-6 flex-1">
                                        {Object.entries(tier.limits).map(([key, val]) => (
                                            <li key={key} className="flex items-start gap-2 text-sm text-slate-600">
                                                <RiCheckLine className="text-blue-600 mt-0.5 flex-shrink-0" />
                                                <span><strong className="text-slate-900">{val}</strong> {key.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <button
                                        onClick={() => handleAction(tier.name)}
                                        className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-300 transform active:scale-95 border ${tier.popular ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 shadow-lg' : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md'}`}
                                    >
                                        {tier.cta}
                                    </button>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* Feature Comparison — Full Accordion */}
            <section id="compare-features" className="py-32 bg-white relative border-t border-slate-100">
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <FadeIn y={24}>
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold text-slate-900 mb-6">Compare all features</h2>
                            <p className="text-lg text-slate-600 max-w-2xl mx-auto">A detailed breakdown of what&rsquo;s included in each plan.</p>
                        </div>
                    </FadeIn>

                    <FadeIn y={20} delay={0.1}>
                        <div className="bg-white border border-slate-200 rounded-[2rem] shadow-xl shadow-slate-200/40 overflow-hidden">
                            <div className="overflow-x-auto">
                                <div className="min-w-[900px]">
                                    <div className="grid grid-cols-[1fr_repeat(5,minmax(0,1fr))] bg-slate-50/50 border-b border-slate-200">
                                        <div className="py-5 px-8 text-sm font-semibold text-slate-900 uppercase tracking-wider">Feature</div>
                                        {nexmailTiers.map((tier) => (
                                            <div key={tier.name} className={`py-5 px-4 text-center text-sm font-bold ${tier.popular ? 'text-[#2563EB]' : 'text-slate-900'}`}>{tier.name}</div>
                                        ))}
                                    </div>

                                    {Object.keys(nexmailFeatures).map((category, catIdx) => (
                                        <details key={category} open={catIdx === 0} className="group/cat">
                                            <summary className="grid grid-cols-[1fr_repeat(5,minmax(0,1fr))] bg-slate-50/80 cursor-pointer list-none select-none hover:bg-slate-100/60 transition-colors border-b border-slate-100">
                                                <div className="py-3.5 px-8 text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                                    <RiArrowDownSLine className="text-slate-400 transition-transform group-open/cat:rotate-180 text-base flex-shrink-0" />
                                                    {featureCategoryLabels[category] || category}
                                                </div>
                                                <div className="col-span-5" />
                                            </summary>
                                            <div>
                                                {nexmailFeatures[category].items.map((feature) => (
                                                    <div key={feature.name} className="grid grid-cols-[1fr_repeat(5,minmax(0,1fr))] hover:bg-blue-50/30 transition-colors group border-b border-slate-50 last:border-b-0">
                                                        <div className="py-4 px-8 text-sm text-slate-600 font-medium group-hover:text-blue-900 group-hover:pl-9 transition-all">
                                                            {feature.name}
                                                        </div>
                                                        {feature.values.map((val, vi) => (
                                                            <div key={vi} className="py-4 px-4 flex justify-center"><FeatureValue value={val} /></div>
                                                        ))}
                                                    </div>
                                                ))}
                                            </div>
                                        </details>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </FadeIn>
                </div>
            </section>

            {/* Testimonial / Social Proof */}
            <section className="py-20 bg-slate-50 border-y border-slate-100">
                <div className="max-w-4xl mx-auto px-6">
                    <FadeIn y={24}>
                        <div className="flex flex-col md:flex-row items-center gap-10">
                            <div className="flex-shrink-0">
                                <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80" alt="Customer" className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-lg" loading="lazy" />
                            </div>
                            <div>
                                <RiStarFill className="text-amber-400 text-xl mb-3" />
                                <blockquote className="text-xl md:text-2xl font-medium text-slate-900 leading-relaxed mb-4">
                                    &ldquo;We moved from Mailchimp to NexMail and our deliverability jumped from 82% to 96%. The SMTP rotation and domain throttling are game changers.&rdquo;
                                </blockquote>
                                <div>
                                    <p className="font-bold text-slate-900">Rajesh Kumar</p>
                                    <p className="text-sm text-slate-500">Marketing Director, TechScale Solutions</p>
                                </div>
                            </div>
                        </div>
                    </FadeIn>
                </div>
            </section>

            {/* FAQ */}
            <section id="faq" className="py-28 bg-white">
                <div className="max-w-3xl mx-auto px-6">
                    <FadeIn y={24}>
                        <div className="text-center mb-14">
                            <span className="text-[#2563EB] font-bold tracking-wider uppercase text-sm mb-4 block">FAQ</span>
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Frequently Asked Questions</h2>
                        </div>
                    </FadeIn>

                    <div className="space-y-3">
                        {faqs.map((faq, idx) => (
                            <FadeIn key={faq.q} y={16} delay={idx * 0.05}>
                                <details className="group bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-slate-300 transition-colors">
                                    <summary className="flex items-center justify-between p-5 cursor-pointer list-none">
                                        <span className="font-medium text-slate-900 pr-4">{faq.q}</span>
                                        <svg className="w-5 h-5 text-slate-400 transition-transform group-open:rotate-180 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </summary>
                                    <div className="px-5 pb-5 text-slate-600 leading-relaxed">
                                        {faq.a}
                                    </div>
                                </details>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-32 px-6">
                <FadeIn y={30}>
                    <div className="max-w-5xl mx-auto bg-slate-900 rounded-[2.5rem] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-[#2563EB]/10 to-transparent pointer-events-none" />
                        <div className="relative z-10">
                            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                                Ready to send emails that land?
                            </h2>
                            <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
                                Join businesses using NexMail for better deliverability. Start free today.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <button onClick={() => handleAction('Free')} className="px-10 py-5 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg">
                                    Get Started Free
                                </button>
                                <Link to="/nexcrm" className="px-10 py-5 bg-white/10 text-white border border-white/20 rounded-xl font-bold text-lg hover:bg-white/20 transition-all backdrop-blur-sm">
                                    Explore NexCRM
                                </Link>
                            </div>
                        </div>
                    </div>
                </FadeIn>
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
                        <button onClick={() => setShowContactModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-50 rounded-full transition-colors" aria-label="Close">
                            <RiCloseLine className="text-xl" />
                        </button>

                        <div className="text-center mb-8">
                            <div className="w-14 h-14 bg-[#2563EB]/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-[#2563EB] text-2xl shadow-inner"><RiMailSendLine /></div>
                            <h3 className="text-2xl font-bold text-slate-900">{selectedPlan === 'Enterprise' ? 'Contact Sales' : `Get Started with ${selectedPlan}`}</h3>
                            <p className="text-slate-500 mt-2">We&rsquo;ll get you set up within 24 hours.</p>
                        </div>

                        {submitted ? (
                            <div className="text-center py-10">
                                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600 text-4xl animate-bounce"><RiCheckLine /></div>
                                <h4 className="text-2xl font-bold text-slate-900 mb-2">Request Sent!</h4>
                                <p className="text-slate-600 mb-8">Our team will reach out within 24 hours.</p>
                                <button onClick={() => setShowContactModal(false)} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors">Close</button>
                            </div>
                        ) : (
                            <form className="space-y-5" onSubmit={async (e) => { e.preventDefault(); await submitContactForm(new FormData(e.target)); }}>
                                <div className="space-y-4">
                                    <input type="text" name="name" required minLength={2} maxLength={100} placeholder="Full Name" aria-label="Full name" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2563EB] focus:bg-white outline-none transition-all" />
                                    <input type="email" name="email" required placeholder="Work Email" aria-label="Email address" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2563EB] focus:bg-white outline-none transition-all" />
                                    <div className="grid grid-cols-2 gap-4">
                                        <input type="tel" name="phone" placeholder="Phone" aria-label="Phone number" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2563EB] focus:bg-white outline-none transition-all" />
                                        <input type="text" name="company" placeholder="Company" aria-label="Company name" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2563EB] focus:bg-white outline-none transition-all" />
                                    </div>
                                    <textarea name="message" rows="3" maxLength={2000} placeholder="Tell us about your email needs..." aria-label="Your message" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2563EB] focus:bg-white outline-none resize-none transition-all" />
                                </div>
                                <button disabled={submitting} type="submit" className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-70 flex items-center justify-center gap-3 shadow-lg hover:-translate-y-0.5 transform duration-200">
                                    {submitting && <RiLoader4Line className="animate-spin" />}
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
