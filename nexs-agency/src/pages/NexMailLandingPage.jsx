import { useState, useCallback, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { nexmailTiers, nexmailFeatures } from '../constants/nexmailPricing';
import { SITE_URL, siteConfig } from '../constants/siteConfig';
import { CheckIcon, XIcon } from '../components/ui/Icons';
import FeatureValue from '../components/crm/FeatureValue';
import FadeIn from '../components/ui/FadeIn';
import {
    RiMailSendLine, RiBarChartBoxLine, RiShieldCheckLine,
    RiDragDropLine, RiTimeLine, RiUserFollowLine,
    RiMailCheckLine, RiFlowChart, RiServerLine,
    RiCheckLine, RiArrowRightLine, RiStarFill,
    RiLinksLine, RiArrowDownSLine, RiLoader4Line, RiCloseLine
} from 'react-icons/ri';

function AnimatedCounter({ value, suffix = '' }) {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-50px' });
    const numericValue = parseInt(value.replace(/\D/g, ''), 10) || 0;

    useEffect(() => {
        if (!isInView) return;
        let start = 0;
        const duration = 1200;
        const increment = numericValue / (duration / 16);
        const timer = setInterval(() => {
            start += increment;
            if (start >= numericValue) {
                setCount(numericValue);
                clearInterval(timer);
            } else {
                setCount(Math.floor(start));
            }
        }, 16);
        return () => clearInterval(timer);
    }, [isInView, numericValue]);

    return <span ref={ref}>{count}{suffix}</span>;
}

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
    { value: '18', suffix: '', label: 'Block Types', icon: RiDragDropLine },
    { value: '50', suffix: '+', label: 'Spam Checks', icon: RiShieldCheckLine },
    { value: '14', suffix: '', label: 'Domain Throttles', icon: RiTimeLine },
    { value: '9', suffix: '', label: 'Auto Triggers', icon: RiFlowChart },
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
    const [activeTestimonial, setActiveTestimonial] = useState(0);
    const toastTimerRef = useRef(null);

    useEffect(() => {
        const timer = setInterval(() => setActiveTestimonial(prev => (prev + 1) % 3), 6000);
        return () => clearInterval(timer);
    }, []);

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
            <script type="application/ld+json">{JSON.stringify({
                "@context": "https://schema.org",
                "@type": "FAQPage",
                "mainEntity": faqs.map(faq => ({
                    "@type": "Question",
                    "name": faq.q,
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": faq.a
                    }
                }))
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
                            <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-xl font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all duration-300 shadow-sm">
                                See Features
                            </button>
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
                                    <span className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
                                        <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                                    </span>
                                    <span className="text-sm text-slate-500 font-medium">{stat.label}</span>
                                </div>
                            ))}
                        </div>
                    </FadeIn>
                </div>
            </section>

            <section id="features" className="py-32 bg-slate-50 relative overflow-hidden">
                <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:24px_24px]" />

                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <FadeIn y={24} duration={0.6}>
                        <div className="max-w-3xl mx-auto text-center mb-16">
                            <span className="text-[#2563EB] font-bold tracking-wider uppercase text-sm mb-4 block">Capabilities</span>
                            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6">Everything you need to <span className="text-[#2563EB]">land in the inbox.</span></h2>
                            <p className="text-xl text-slate-600 font-light">Here&apos;s what your NexMail dashboard looks like on day one.</p>
                        </div>
                    </FadeIn>

                    <FadeIn y={40} duration={0.8}>
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl shadow-slate-300/30 overflow-hidden">
                            <div className="bg-slate-100 border-b border-slate-200 px-5 py-3 flex items-center gap-3">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-red-400" />
                                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                                </div>
                                <span className="text-xs font-medium text-slate-400 ml-2">NexMail — Campaign Dashboard</span>
                            </div>

                            <div className="flex">
                                <div className="hidden md:flex flex-col w-52 border-r border-slate-100 bg-slate-50/60 py-4 px-3 gap-0.5 shrink-0">
                                    {features.map((f, idx) => {
                                        const Icon = f.icon;
                                        return (
                                            <div key={f.title} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${idx === 0 ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}>
                                                <Icon className="text-sm flex-shrink-0" />
                                                <span className="truncate">{f.title}</span>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="flex-1 p-5 md:p-8 space-y-6 min-w-0">
                                    <div className="flex items-center justify-between flex-wrap gap-3">
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900">Campaign Overview</h3>
                                            <p className="text-xs text-slate-400 mt-0.5">Last 7 days · All campaigns</p>
                                        </div>
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-200">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            <span className="text-[10px] font-semibold text-emerald-700">All systems healthy</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {[
                                            { label: 'Delivered', value: '4,847', sub: '98.2%', accent: 'text-emerald-600', bg: 'bg-emerald-50' },
                                            { label: 'Open Rate', value: '61.4%', sub: '+8.2% vs avg', accent: 'text-blue-600', bg: 'bg-blue-50' },
                                            { label: 'Click Rate', value: '8.7%', sub: '+1.4% vs avg', accent: 'text-indigo-600', bg: 'bg-indigo-50' },
                                            { label: 'Spam Score', value: '87/100', sub: 'Excellent', accent: 'text-amber-600', bg: 'bg-amber-50' },
                                        ].map(m => (
                                            <div key={m.label} className={`${m.bg} rounded-xl p-4 border border-slate-100`}>
                                                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">{m.label}</div>
                                                <div className={`text-xl font-bold ${m.accent}`}>{m.value}</div>
                                                <div className="text-[10px] text-slate-400 mt-0.5">{m.sub}</div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                                        <div className="lg:col-span-3 bg-slate-50 rounded-xl border border-slate-100 p-5">
                                            <div className="flex items-center justify-between mb-4">
                                                <span className="text-xs font-semibold text-slate-700">Engagement Trend</span>
                                                <div className="flex items-center gap-3 text-[10px] text-slate-400">
                                                    <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-blue-500 rounded" />Opens</span>
                                                    <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-emerald-500 rounded" />Clicks</span>
                                                </div>
                                            </div>
                                            <div className="relative h-32">
                                                <svg viewBox="0 0 300 100" className="w-full h-full" preserveAspectRatio="none">
                                                    <defs>
                                                        <linearGradient id="openFill" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
                                                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                                                        </linearGradient>
                                                    </defs>
                                                    {[0, 25, 50, 75, 100].map(y => (
                                                        <line key={y} x1="0" y1={y} x2="300" y2={y} stroke="#e2e8f0" strokeWidth="0.5" />
                                                    ))}
                                                    <path d="M0,60 L50,52 L100,45 L150,38 L200,30 L250,25 L300,20 L300,100 L0,100 Z" fill="url(#openFill)" />
                                                    <polyline points="0,60 50,52 100,45 150,38 200,30 250,25 300,20" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    <polyline points="0,85 50,80 100,78 150,75 200,72 250,68 300,65" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4,3" />
                                                    {[{x:0,y:60},{x:50,y:52},{x:100,y:45},{x:150,y:38},{x:200,y:30},{x:250,y:25},{x:300,y:20}].map((p,i) => (
                                                        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#fff" stroke="#3b82f6" strokeWidth="1.5" />
                                                    ))}
                                                </svg>
                                                <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[9px] text-slate-400 pt-1">
                                                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => <span key={d}>{d}</span>)}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="lg:col-span-2 bg-slate-50 rounded-xl border border-slate-100 p-5">
                                            <span className="text-xs font-semibold text-slate-700 block mb-4">SMTP Rotation</span>
                                            <div className="space-y-3">
                                                {[
                                                    { name: 'Amazon SES', rep: 96, weight: 45, color: 'bg-blue-500' },
                                                    { name: 'Postmark', rep: 91, weight: 35, color: 'bg-indigo-500' },
                                                    { name: 'Gmail SMTP', rep: 72, weight: 20, color: 'bg-slate-400' },
                                                ].map(a => (
                                                    <div key={a.name}>
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-[11px] font-medium text-slate-600">{a.name}</span>
                                                            <span className="text-[10px] text-slate-400">Rep {a.rep} · {a.weight}%</span>
                                                        </div>
                                                        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                                            <div className={`h-full ${a.color} rounded-full`} style={{ width: `${a.weight}%` }} />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-slate-200">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                <span className="text-[10px] text-slate-500">Weighted rotation active</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                        <div className="bg-slate-50 rounded-xl border border-slate-100 p-5">
                                            <span className="text-xs font-semibold text-slate-700 block mb-3">Domain Throttling</span>
                                            <div className="space-y-2.5">
                                                {[
                                                    { name: 'Gmail', sent: 78, limit: 80 },
                                                    { name: 'Yahoo', sent: 34, limit: 60 },
                                                    { name: 'Outlook', sent: 61, limit: 100 },
                                                ].map(p => (
                                                    <div key={p.name}>
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-[11px] font-medium text-slate-600">{p.name}</span>
                                                            <span className="text-[10px] text-slate-400 font-mono">{p.sent}/{p.limit}</span>
                                                        </div>
                                                        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                                            <div className={`h-full rounded-full ${(p.sent / p.limit) > 0.9 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${(p.sent / p.limit) * 100}%` }} />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 rounded-xl border border-slate-100 p-5">
                                            <span className="text-xs font-semibold text-slate-700 block mb-3">Automation Flow</span>
                                            <div className="space-y-2">
                                                {[
                                                    { label: 'New subscriber', type: 'trigger', color: 'bg-blue-100 text-blue-700 border-blue-200' },
                                                    { label: 'Wait 2 days', type: 'delay', color: 'bg-amber-50 text-amber-700 border-amber-200' },
                                                    { label: 'Send welcome', type: 'action', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                                                    { label: 'If opened →', type: 'condition', color: 'bg-purple-50 text-purple-700 border-purple-200' },
                                                    { label: 'Send offer', type: 'action', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                                                ].map((node, i) => (
                                                    <div key={i} className="flex items-center gap-2">
                                                        <div className="w-1 h-1 rounded-full bg-slate-300 flex-shrink-0" />
                                                        <span className={`text-[10px] font-semibold px-2 py-1 rounded border ${node.color}`}>{node.label}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 rounded-xl border border-slate-100 p-5">
                                            <span className="text-xs font-semibold text-slate-700 block mb-3">Contact Scoring</span>
                                            <div className="space-y-2.5">
                                                {[
                                                    { name: 'Priya S.', score: 92, tag: 'Hot Lead' },
                                                    { name: 'Rahul M.', score: 67, tag: 'Engaged' },
                                                    { name: 'Sarah K.', score: 34, tag: 'Cooling' },
                                                    { name: 'Dev P.', score: 12, tag: 'Inactive' },
                                                ].map(c => (
                                                    <div key={c.name} className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-500">{c.name.charAt(0)}</div>
                                                            <span className="text-[11px] text-slate-600 font-medium">{c.name}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${c.score > 80 ? 'bg-emerald-50 text-emerald-600' : c.score > 50 ? 'bg-blue-50 text-blue-600' : c.score > 25 ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>{c.tag}</span>
                                                            <span className="text-[11px] font-bold text-slate-700 w-6 text-right">{c.score}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-center justify-between bg-blue-50 rounded-xl border border-blue-100 px-5 py-4 gap-3">
                                        <div className="flex items-center gap-3">
                                            <RiLinksLine className="text-blue-600 text-lg" />
                                            <div>
                                                <span className="text-xs font-semibold text-slate-800">NexCRM Integration</span>
                                                <span className="text-[10px] text-emerald-600 font-medium ml-2">● Connected</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 text-[10px] text-slate-500">
                                            <span>2,341 contacts synced</span>
                                            <span>Last sync: 3m ago</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </FadeIn>

                    <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {features.map((f, idx) => {
                            const Icon = f.icon;
                            return (
                                <FadeIn key={f.title} y={20} delay={0.04 * idx} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-lg shadow-slate-200/40 hover:translate-y-[-3px] hover:shadow-xl transition-all group">
                                    <div className={`w-10 h-10 ${f.bg} ${f.color} rounded-xl flex items-center justify-center text-lg mb-4 group-hover:scale-110 transition-transform`}>
                                        <Icon />
                                    </div>
                                    <h3 className="text-sm font-bold text-slate-900 mb-1">{f.title}</h3>
                                    <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
                                </FadeIn>
                            );
                        })}
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

            {/* Testimonials — Carousel */}
            <section className="py-24 bg-slate-50 border-y border-slate-100 overflow-hidden">
                <div className="max-w-5xl mx-auto px-6">
                    <FadeIn y={24}>
                        <div className="text-center mb-14">
                            <span className="text-[#2563EB] font-bold tracking-wider uppercase text-sm mb-4 block">Testimonials</span>
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Trusted by growing teams</h2>
                        </div>
                    </FadeIn>

                    <FadeIn y={20} delay={0.1}>
                        <div className="relative">
                            <AnimatePresence mode="wait">
                                {[
                                    {
                                        quote: 'We moved from Mailchimp to NexMail and our deliverability jumped from 82% to 96%. The SMTP rotation and domain throttling are game changers.',
                                        name: 'Rajesh Kumar',
                                        role: 'Marketing Director',
                                        company: 'TechScale Solutions',
                                        avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
                                        stars: 5,
                                        metric: '96% deliverability',
                                    },
                                    {
                                        quote: 'The anti-spam engine caught issues we never noticed. Our open rates went from 28% to 61% in three weeks. NexMail pays for itself.',
                                        name: 'Anita Sharma',
                                        role: 'Head of Growth',
                                        company: 'FinLeap India',
                                        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
                                        stars: 5,
                                        metric: '61% open rate',
                                    },
                                    {
                                        quote: 'We send 200K emails monthly across 8 SMTP accounts. NexMail handles rotation, throttling, and analytics flawlessly. Zero downtime in 6 months.',
                                        name: 'Vikram Patel',
                                        role: 'CTO',
                                        company: 'CloudNine Commerce',
                                        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
                                        stars: 5,
                                        metric: '200K emails/mo',
                                    },
                                ].filter((_, i) => i === activeTestimonial).map(t => (
                                    <motion.div
                                        key={t.name}
                                        initial={{ opacity: 0, x: 40 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -40 }}
                                        transition={{ duration: 0.35, ease: 'easeInOut' }}
                                        className="bg-white rounded-3xl border border-slate-200 p-8 md:p-12 shadow-xl shadow-slate-200/30"
                                    >
                                        <div className="flex flex-col md:flex-row gap-8 items-start">
                                            <div className="flex-shrink-0">
                                                <img src={t.avatar} alt={t.name} className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-lg" loading="lazy" />
                                                <div className="mt-3 bg-blue-50 rounded-lg px-3 py-1.5 text-center border border-blue-100">
                                                    <span className="text-xs font-bold text-blue-700">{t.metric}</span>
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex gap-0.5 mb-4">
                                                    {Array.from({ length: t.stars }).map((_, i) => (
                                                        <RiStarFill key={i} className="text-amber-400 text-lg" />
                                                    ))}
                                                </div>
                                                <blockquote className="text-xl md:text-2xl font-medium text-slate-900 leading-relaxed mb-6">
                                                    &ldquo;{t.quote}&rdquo;
                                                </blockquote>
                                                <div>
                                                    <p className="font-bold text-slate-900">{t.name}</p>
                                                    <p className="text-sm text-slate-500">{t.role}, {t.company}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            <div className="flex items-center justify-center gap-2 mt-8">
                                {[0, 1, 2].map(i => (
                                    <button
                                        key={i}
                                        onClick={() => setActiveTestimonial(i)}
                                        className={`transition-all duration-300 rounded-full ${activeTestimonial === i ? 'w-8 h-2.5 bg-blue-600' : 'w-2.5 h-2.5 bg-slate-300 hover:bg-slate-400'}`}
                                        aria-label={`Testimonial ${i + 1}`}
                                    />
                                ))}
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
