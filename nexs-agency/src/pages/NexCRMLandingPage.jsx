// TODO: Replace console.error with Sentry or proper error tracking
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { crmTiers, crmFeatures } from '../constants/crmPricing';
import { SITE_URL } from '../constants/siteConfig';
import { CheckIcon, XIcon } from '../components/ui/Icons';
import FeatureValue from '../components/crm/FeatureValue';
import useCRMPricing from '../hooks/useCRMPricing';
import Icon from '../components/ui/Icon';
import FadeIn from '../components/ui/FadeIn';
import {
    RiBankCardLine, RiCheckLine, RiDashboard3Line, RiLoader4Line,
    RiMailSendLine, RiRobot2Line, RiRobotLine, RiSmartphoneLine,
    RiUserFollowLine, RiGoogleLine, RiMailLine, RiCalendarLine,
    RiWhatsappLine, RiNotionLine, RiSlackLine, RiDriveLine,
    RiGroupLine, RiTimeLine, RiStarFill, RiLinksLine,
    RiSettings3Line, RiUploadCloud2Line, RiLineChartLine,
    RiArrowDownSLine
} from 'react-icons/ri';

const industries = [
    { name: "Digital Agencies", icon: "ri-briefcase-4-line", color: "text-[#2563EB]", bg: "bg-[#F8FAFC]" },
    { name: "Freelancers", icon: "ri-macbook-line", color: "text-[#2563EB]", bg: "bg-[#F8FAFC]" },
    { name: "E-commerce", icon: "ri-store-2-line", color: "text-emerald-600", bg: "bg-emerald-50" },
    { name: "Consultants", icon: "ri-discuss-line", color: "text-amber-600", bg: "bg-amber-50" },
    { name: "Real Estate", icon: "ri-building-2-line", color: "text-rose-600", bg: "bg-rose-50" },
    { name: "SaaS Startups", icon: "ri-arrow-right-up-line", color: "text-[#2563EB]", bg: "bg-indigo-50" },
    { name: "Marketing Teams", icon: "ri-megaphone-line", color: "text-cyan-600", bg: "bg-cyan-50" },
    { name: "Event Planners", icon: "ri-calendar-event-line", color: "text-pink-600", bg: "bg-pink-50" }
];

const tiers = crmTiers.map((tier, i) => {
    const ctaOverrides = ['Get Started', 'Get Started', 'Contact Sales', 'Contact Sales'];
    return { ...tier, cta: ctaOverrides[i] };
});

const features = crmFeatures;

const trustStats = [
    { value: '500+', label: 'Active Users', icon: RiGroupLine },
    { value: '99.9%', label: 'Uptime', icon: RiTimeLine },
    { value: '4.8', label: 'Rating', icon: RiStarFill, isStar: true },
    { value: '50+', label: 'Integrations', icon: RiLinksLine },
];

const howItWorks = [
    {
        step: '01',
        title: 'Sign Up & Configure',
        description: 'Set up your workspace, invite team members, configure your pipeline stages and workflows.',
        icon: RiSettings3Line,
    },
    {
        step: '02',
        title: 'Import & Connect',
        description: 'Import existing data, connect your payment gateway, and set up your storefront in minutes.',
        icon: RiUploadCloud2Line,
    },
    {
        step: '03',
        title: 'Grow & Scale',
        description: 'Start managing leads, sending invoices, and scaling your operations with data-driven insights.',
        icon: RiLineChartLine,
    },
];

const integrations = [
    { name: 'Razorpay', icon: RiBankCardLine },
    { name: 'Google', icon: RiGoogleLine },
    { name: 'Slack', icon: RiSlackLine },
    { name: 'WhatsApp', icon: RiWhatsappLine },
    { name: 'Notion', icon: RiNotionLine },
    { name: 'Gmail', icon: RiMailLine },
    { name: 'Calendar', icon: RiCalendarLine },
    { name: 'Drive', icon: RiDriveLine },
];

const faqs = [
    {
        q: 'How do I get started?',
        a: "Contact our sales team and we'll set up your account within 24 hours. We'll guide you through the onboarding process."
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
        a: "We'll notify you when you're approaching limits. You can upgrade your plan or purchase add-ons to increase limits."
    },
    {
        q: 'Do you offer custom enterprise plans?',
        a: 'Yes, for large organizations with specific needs, we offer custom plans with tailored features and pricing. Contact our sales team.'
    }
];

const featureCategoryLabels = {
    core: 'Core Features',
    ecommerce: 'E-commerce',
    communication: 'Communication',
    automation: 'Automation',
    support: 'Support & Extras',
};

export default function NexCRMLandingPage() {
    const {
        isYearly, setIsYearly,
        showContactModal, setShowContactModal,
        selectedPlan,
        submitting, submitted,
        toast,
        handleAction,
        submitContactForm,
    } = useCRMPricing();

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900 overflow-x-hidden selection:bg-[#2563EB]/10">
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
                <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-0"></div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-[#2563EB]/10 to-transparent rounded-full blur-3xl opacity-60 pointer-events-none z-0" />

                <div className="container-custom px-6 max-w-7xl mx-auto relative z-10 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200 text-slate-600 text-sm font-medium mb-8 hover:shadow-md transition-all cursor-default relative overflow-hidden">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse relative z-10"></span>
                            <span className="relative z-10">v2.0 is now live</span>
                            <div className="absolute inset-0 bg-[#F8FAFC] opacity-50"></div>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 mb-8 leading-[1.1]">
                            The Operating System for <br className="hidden md:block" />
                            <span className="text-[#2563EB]">running your agency.</span>
                        </h1>

                        <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
                            Stop stitching together 5 different tools. Manage leads, projects, invoices, and client support in one unified platform.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <button onClick={() => document.getElementById('pricing').scrollIntoView({ behavior: 'smooth' })} className="px-8 py-4 bg-slate-900 text-white rounded-xl font-semibold shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all duration-300 ring-4 ring-slate-900/10">
                                View Plans
                            </button>
                            <a href="/contact" className="px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-xl font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all duration-300 shadow-sm">
                                Book a Demo
                            </a>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Social Proof Stats */}
            <section className="py-10 bg-white border-b border-slate-100">
                <div className="max-w-5xl mx-auto px-6">
                    <FadeIn y={16} duration={0.5}>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
                            {trustStats.map((stat) => (
                                <div key={stat.label} className="flex flex-col items-center text-center gap-2">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg">
                                        <stat.icon />
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">{stat.value}</span>
                                        {stat.isStar && <RiStarFill className="text-amber-400 text-sm mb-1" />}
                                    </div>
                                    <span className="text-sm text-slate-500 font-medium">{stat.label}</span>
                                </div>
                            ))}
                        </div>
                    </FadeIn>
                </div>
            </section>

            {/* Industry Marquee */}
            <section className="py-12 border-b border-slate-100 bg-slate-50/50 overflow-hidden">
                <div className="flex gap-12 animate-scroll w-max hover:pause-scroll">
                    {[...industries, ...industries, ...industries].map((ind, i) => (
                        <div key={`${ind.name}-${i}`} className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity cursor-default">
                            <div className={`w-10 h-10 rounded-lg ${ind.bg} ${ind.color} flex items-center justify-center text-xl`}>
                                <Icon name={ind.icon} />
                            </div>
                            <span className="font-semibold text-slate-700 text-lg whitespace-nowrap">{ind.name}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Features (Bento Grid) */}
            <section className="py-32 bg-slate-50 relative overflow-hidden">
                <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:24px_24px]"></div>

                <div className="container-custom px-6 max-w-7xl mx-auto relative z-10">
                    <FadeIn y={24} duration={0.6}>
                        <div className="max-w-3xl mx-auto text-center mb-24">
                            <span className="text-[#2563EB] font-bold tracking-wider uppercase text-sm mb-4 block">Capabilities</span>
                            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6 font-display">Everything you need to <span className="text-[#2563EB]">scale.</span></h2>
                            <p className="text-xl text-slate-600 font-light">Unified tools that replace your fragmented tech stack.</p>
                        </div>
                    </FadeIn>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 auto-rows-[340px]">
                        <FadeIn y={30} delay={0} className="md:col-span-2 md:row-span-1 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:border-slate-200 transition-all group overflow-hidden relative">
                            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=2600&q=80&fm=webp')] bg-cover bg-center transition-transform duration-700 group-hover:scale-105"></div>
                            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-transparent"></div>
                            <div className="relative z-10 p-10 h-full flex flex-col justify-center max-w-md">
                                <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-lg"><RiDashboard3Line /></div>
                                <h3 className="text-3xl font-bold text-slate-900 mb-4">Centralized Operations</h3>
                                <p className="text-slate-600 text-lg leading-relaxed font-medium">See everything in one place. Revenue, project status, leads, and support tickets at a glance.</p>
                            </div>
                        </FadeIn>

                        <FadeIn y={30} delay={0.1} className="md:col-span-1 md:row-span-2 bg-slate-900 rounded-[2rem] p-8 border border-slate-800 text-white hover:shadow-2xl transition-all relative overflow-hidden group flex flex-col items-center text-center">
                            <div className="relative z-10 mb-8">
                                <div className="w-14 h-14 bg-white/10 text-white rounded-2xl flex items-center justify-center text-2xl mb-6 mx-auto backdrop-blur-md border border-white/10"><RiSmartphoneLine /></div>
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
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent"></div>
                                <div className="absolute bottom-6 left-4 right-4 bg-white/10 backdrop-blur-md border border-white/10 p-3 rounded-xl flex items-center gap-3 animate-pulse">
                                    <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-xs text-white"><RiCheckLine /></div>
                                    <div className="text-left">
                                        <div className="text-xs text-slate-300">New Payment</div>
                                        <div className="text-sm font-bold">₹24,000 received</div>
                                    </div>
                                </div>
                            </div>
                        </FadeIn>

                        <FadeIn y={30} delay={0.2} className="md:col-span-1 bg-white rounded-[2rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/50 hover:translate-y-[-4px] hover:shadow-2xl transition-all group">
                            <div className="w-14 h-14 bg-[#F8FAFC] text-[#2563EB] rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform"><RiBankCardLine /></div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Invoicing & Payments</h3>
                            <p className="text-slate-600 font-medium leading-relaxed">Accept payments via Razorpay with UPI, cards, and net banking.</p>
                        </FadeIn>

                        <FadeIn y={30} delay={0.3} className="md:col-span-1 bg-white rounded-[2rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/50 hover:translate-y-[-4px] hover:shadow-2xl transition-all group">
                            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform"><RiUserFollowLine /></div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Lead Pipeline</h3>
                            <p className="text-slate-600 font-medium leading-relaxed">Drag-and-drop kanban board to track deals from lead to close.</p>
                        </FadeIn>

                        <FadeIn y={30} delay={0.15} className="md:col-span-3 rounded-[2rem] p-10 border border-slate-200 hover:border-slate-200 hover:shadow-lg transition-all flex flex-col md:flex-row items-center gap-10 overflow-hidden relative group">
                            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1620712943543-bcc4688e7485?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80&fm=webp')] bg-cover bg-center opacity-10 group-hover:opacity-20 transition-opacity duration-500"></div>
                            <div className="absolute inset-0 bg-gradient-to-r from-white via-white to-transparent"></div>
                            <div className="flex-1 relative z-10 pl-4">
                                <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center text-2xl mb-6"><RiRobot2Line /></div>
                                <h3 className="text-3xl font-bold text-slate-900 mb-4">AI Automation</h3>
                                <p className="text-slate-600 text-lg leading-relaxed font-medium max-w-lg">Let AI handle the busy work. Auto-responses, meeting scheduling, and smart follow-ups so you can focus on high-value work.</p>
                            </div>
                            <div className="flex-1 w-full max-w-md bg-white rounded-2xl shadow-lg border border-slate-100 p-6 relative z-10 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                <div className="flex items-start gap-4 mb-6">
                                    <div className="w-10 h-10 rounded-full bg-[#2563EB]/10 flex-shrink-0 flex items-center justify-center text-[#2563EB] font-bold border-2 border-white shadow-sm"><RiRobotLine /></div>
                                    <div className="bg-slate-50 p-4 rounded-2xl rounded-tl-none text-slate-700 font-medium shadow-inner text-sm leading-relaxed border border-slate-100">
                                        &ldquo;I noticed the client hasn&rsquo;t replied to the proposal sent 3 days ago. Should I send a follow-up email?&rdquo;
                                    </div>
                                </div>
                                <div className="flex gap-3 justify-end">
                                    <button className="bg-slate-100 text-slate-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-colors">Edit</button>
                                    <button className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-md">Yes, Send it</button>
                                </div>
                            </div>
                        </FadeIn>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-28 bg-white relative">
                <div className="max-w-6xl mx-auto px-6">
                    <FadeIn y={24} duration={0.6}>
                        <div className="text-center mb-20">
                            <span className="text-[#2563EB] font-bold tracking-wider uppercase text-sm mb-4 block">How It Works</span>
                            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6">Up and running in <span className="text-[#2563EB]">3 steps.</span></h2>
                            <p className="text-xl text-slate-600 max-w-2xl mx-auto font-light">No lengthy onboarding. Go from sign-up to managing clients in under an hour.</p>
                        </div>
                    </FadeIn>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 relative">
                        {/* Connecting line on desktop */}
                        <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

                        {howItWorks.map((item, idx) => (
                            <FadeIn key={item.step} y={30} delay={idx * 0.12} className="relative">
                                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-8 text-center hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full">
                                    <div className="relative mx-auto mb-6 w-16 h-16">
                                        <div className="absolute inset-0 bg-blue-100 rounded-2xl rotate-6" />
                                        <div className="relative w-16 h-16 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-2xl text-blue-600 shadow-sm">
                                            <item.icon />
                                        </div>
                                    </div>
                                    <div className="text-xs font-bold text-blue-600 tracking-widest uppercase mb-3">Step {item.step}</div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                                    <p className="text-slate-600 leading-relaxed">{item.description}</p>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* Integrations */}
            <section className="py-20 bg-slate-50 border-y border-slate-100">
                <div className="max-w-5xl mx-auto px-6">
                    <FadeIn y={20} duration={0.5}>
                        <div className="text-center mb-14">
                            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">Integrates with your favorite tools</h2>
                            <p className="text-slate-500 text-lg">Connect the services you already use. More integrations added regularly.</p>
                        </div>
                    </FadeIn>
                    <FadeIn y={16} delay={0.1}>
                        <div className="grid grid-cols-4 md:grid-cols-8 gap-4 md:gap-6 max-w-3xl mx-auto">
                            {integrations.map((tool) => (
                                <div key={tool.name} className="flex flex-col items-center gap-2 group">
                                    <div className="w-14 h-14 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-2xl text-slate-600 group-hover:text-blue-600 group-hover:border-blue-200 group-hover:shadow-md transition-all duration-200">
                                        <tool.icon />
                                    </div>
                                    <span className="text-xs text-slate-500 font-medium group-hover:text-slate-700 transition-colors">{tool.name}</span>
                                </div>
                            ))}
                        </div>
                    </FadeIn>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-32 bg-white relative">
                <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none"></div>
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <FadeIn y={24}>
                        <div className="text-center mb-16">
                            <h2 className="text-4xl font-bold text-slate-900 mb-6">Simple, Transparent Pricing</h2>
                            <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-12">Choose the plan that fits your agency.</p>

                            <div className="inline-flex bg-slate-50 p-1 rounded-full border border-slate-200 shadow-sm relative">
                                <div
                                    className={`absolute top-1 bottom-1 w-[120px] bg-white rounded-full transition-all duration-300 shadow-md border border-slate-100 ${isYearly ? 'left-[124px]' : 'left-1'}`}
                                />
                                <button onClick={() => setIsYearly(false)} className={`relative z-10 w-[120px] py-2.5 text-sm font-semibold rounded-full transition-colors ${!isYearly ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}>
                                    Monthly
                                </button>
                                <button onClick={() => setIsYearly(true)} className={`relative z-10 w-[120px] py-2.5 text-sm font-semibold rounded-full transition-colors ${isYearly ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}>
                                    Yearly <span className="text-xs opacity-80 ml-1 text-emerald-600 font-bold">(-15%)</span>
                                </button>
                            </div>
                        </div>
                    </FadeIn>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {tiers.map((tier, idx) => (
                            <FadeIn key={tier.name} y={30} delay={idx * 0.08}>
                                <div className={`relative flex flex-col bg-slate-50 rounded-3xl p-8 transition-all duration-300 hover:-translate-y-1 overflow-hidden group h-full ${tier.popular ? 'ring-2 ring-blue-600 shadow-2xl scale-[1.02] z-10 bg-white' : 'border border-slate-200 shadow-lg hover:shadow-xl hover:bg-white'}`}>
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
                                        className={`w-full py-4 rounded-xl font-bold transition-all duration-300 transform active:scale-95 border ${tier.popular ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 shadow-lg' : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md'}`}
                                    >
                                        {tier.cta}
                                    </button>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* Comparison Table (Accordion) */}
            <section className="py-32 bg-slate-50 relative border-t border-slate-200">
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <FadeIn y={24}>
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold text-slate-900 mb-6">Compare features</h2>
                            <p className="text-lg text-slate-600 max-w-2xl mx-auto">A detailed breakdown of what&rsquo;s included in each plan.</p>
                        </div>
                    </FadeIn>

                    <FadeIn y={20} delay={0.1}>
                        <div className="bg-white border border-slate-200 rounded-[2rem] shadow-xl shadow-slate-200/40 overflow-hidden">
                            {/* Sticky header row */}
                            <div className="overflow-x-auto custom-scrollbar">
                                <div className="min-w-[900px]">
                                    <div className="grid grid-cols-[1fr_repeat(4,minmax(0,1fr))] bg-slate-50/50 border-b border-slate-200">
                                        <div className="py-5 px-8 text-sm font-semibold text-slate-900 uppercase tracking-wider">Feature</div>
                                        {tiers.map((tier) => (
                                            <div key={tier.name} className="py-5 px-6 text-center text-sm font-bold text-slate-900">{tier.name}</div>
                                        ))}
                                    </div>

                                    {Object.keys(features).map((category, catIdx) => (
                                        <details key={category} open={catIdx === 0} className="group/cat">
                                            <summary className="grid grid-cols-[1fr_repeat(4,minmax(0,1fr))] bg-slate-50/80 cursor-pointer list-none select-none hover:bg-slate-100/60 transition-colors border-b border-slate-100">
                                                <div className="py-3.5 px-8 text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                                    <RiArrowDownSLine className="text-slate-400 transition-transform group-open/cat:rotate-180 text-base flex-shrink-0" />
                                                    {featureCategoryLabels[category] || (category.charAt(0).toUpperCase() + category.slice(1))}
                                                </div>
                                                <div className="col-span-4" />
                                            </summary>
                                            <div>
                                                {features[category].map((feature) => (
                                                    <div key={feature.name} className="grid grid-cols-[1fr_repeat(4,minmax(0,1fr))] hover:bg-blue-50/30 transition-colors group border-b border-slate-50 last:border-b-0">
                                                        <div className="py-4 px-8 text-sm text-slate-600 font-medium group-hover:text-blue-900 group-hover:pl-9 transition-all">
                                                            {feature.name}
                                                            {feature.soon && <span className="ml-2 text-[10px] uppercase bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold tracking-wide border border-amber-200">Soon</span>}
                                                        </div>
                                                        <div className="py-4 px-6 flex justify-center"><FeatureValue value={feature.starter} soon={feature.soon} /></div>
                                                        <div className="py-4 px-6 flex justify-center"><FeatureValue value={feature.growth} soon={feature.soon} /></div>
                                                        <div className="py-4 px-6 flex justify-center"><FeatureValue value={feature.business} soon={feature.soon} /></div>
                                                        <div className="py-4 px-6 flex justify-center"><FeatureValue value={feature.enterprise} soon={feature.soon} /></div>
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

            {/* FAQ Section */}
            <section className="py-28 bg-white">
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

            {/* CTA Section */}
            <section className="py-32 px-6">
                <FadeIn y={30}>
                    <div className="max-w-5xl mx-auto bg-slate-900 rounded-[2.5rem] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-[#2563EB]/10 to-transparent pointer-events-none" />
                        <div className="relative z-10">
                            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                                Ready to transform your agency?
                            </h2>
                            <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
                                Join 2,000+ agencies using NexCRM to scale their operations.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <button onClick={() => document.getElementById('pricing').scrollIntoView({ behavior: 'smooth' })} className="px-10 py-5 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg">
                                    Get Started Now
                                </button>
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
                        <button onClick={() => setShowContactModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-50 rounded-full transition-colors" aria-label="Close contact form">
                            <XIcon />
                        </button>

                        <div className="text-center mb-8">
                            <div className="w-14 h-14 bg-[#2563EB]/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-[#2563EB] text-2xl shadow-inner"><RiMailSendLine /></div>
                            <h3 className="text-2xl font-bold text-slate-900">Contact Sales</h3>
                            <p className="text-slate-500 mt-2">Let&rsquo;s simplify your agency operations.</p>
                        </div>

                        {submitted ? (
                            <div className="text-center py-10">
                                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600 text-4xl animate-bounce"><RiCheckLine /></div>
                                <h4 className="text-2xl font-bold text-slate-900 mb-2">Request Sent!</h4>
                                <p className="text-slate-600 mb-8">Our team will reach out within 24 hours.</p>
                                <button onClick={() => setShowContactModal(false)} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors">Close</button>
                            </div>
                        ) : (
                            <form className="space-y-5" onSubmit={async (e) => {
                                e.preventDefault();
                                await submitContactForm(new FormData(e.target));
                            }}>
                                <div className="space-y-4">
                                    <input type="text" name="name" required minLength={2} maxLength={100} placeholder="Full Name" aria-label="Full name" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2563EB] focus:bg-white outline-none transition-all" />
                                    <input type="email" name="email" required placeholder="Work Email" aria-label="Email address" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2563EB] focus:bg-white outline-none transition-all" />
                                    <div className="grid grid-cols-2 gap-4">
                                        <input type="tel" name="phone" placeholder="Phone" aria-label="Phone number" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2563EB] focus:bg-white outline-none transition-all" />
                                        <input type="text" name="company" placeholder="Company" aria-label="Company name" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2563EB] focus:bg-white outline-none transition-all" />
                                    </div>
                                    <textarea name="message" rows="3" maxLength={2000} placeholder="Additional details..." aria-label="Your message" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2563EB] focus:bg-white outline-none resize-none transition-all"></textarea>
                                </div>
                                <button disabled={submitting} type="submit" className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-70 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transform duration-200">
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
