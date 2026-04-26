import React from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { crmTiers } from '../constants/crmPricing';
import { industryData, industryList } from '../constants/industryData';
import { SITE_URL, siteConfig } from '../constants/siteConfig';
import FadeIn from '../components/ui/FadeIn';
import Icon from '../components/ui/Icon';
import useCRMPricing from '../hooks/useCRMPricing';
import { CheckIcon, XIcon } from '../components/ui/Icons';
import {
    RiMailSendLine, RiCheckLine, RiLoader4Line, RiDoubleQuotesL,
} from 'react-icons/ri';

const colorMap = {
    blue:    { bg: 'bg-blue-50',    text: 'text-blue-600',    border: 'border-blue-200',    dark: 'bg-blue-600',    ring: 'ring-blue-600',    glow: 'from-blue-100/40' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', dark: 'bg-emerald-600', ring: 'ring-emerald-600', glow: 'from-emerald-100/40' },
    rose:    { bg: 'bg-rose-50',    text: 'text-rose-600',    border: 'border-rose-200',    dark: 'bg-rose-600',    ring: 'ring-rose-600',    glow: 'from-rose-100/40' },
    amber:   { bg: 'bg-amber-50',   text: 'text-amber-600',   border: 'border-amber-200',   dark: 'bg-amber-600',   ring: 'ring-amber-600',   glow: 'from-amber-100/40' },
    violet:  { bg: 'bg-violet-50',  text: 'text-violet-600',  border: 'border-violet-200',  dark: 'bg-violet-600',  ring: 'ring-violet-600',  glow: 'from-violet-100/40' },
    cyan:    { bg: 'bg-cyan-50',    text: 'text-cyan-600',    border: 'border-cyan-200',    dark: 'bg-cyan-600',    ring: 'ring-cyan-600',    glow: 'from-cyan-100/40' },
    orange:  { bg: 'bg-orange-50',  text: 'text-orange-600',  border: 'border-orange-200',  dark: 'bg-orange-600',  ring: 'ring-orange-600',  glow: 'from-orange-100/40' },
    teal:    { bg: 'bg-teal-50',    text: 'text-teal-600',    border: 'border-teal-200',    dark: 'bg-teal-600',    ring: 'ring-teal-600',    glow: 'from-teal-100/40' },
    pink:    { bg: 'bg-pink-50',    text: 'text-pink-600',    border: 'border-pink-200',    dark: 'bg-pink-600',    ring: 'ring-pink-600',    glow: 'from-pink-100/40' },
    indigo:  { bg: 'bg-indigo-50',  text: 'text-indigo-600',  border: 'border-indigo-200',  dark: 'bg-indigo-600',  ring: 'ring-indigo-600',  glow: 'from-indigo-100/40' },
    slate:   { bg: 'bg-slate-100',  text: 'text-slate-600',   border: 'border-slate-300',   dark: 'bg-slate-600',   ring: 'ring-slate-600',   glow: 'from-slate-200/40' },
    yellow:  { bg: 'bg-yellow-50',  text: 'text-yellow-600',  border: 'border-yellow-200',  dark: 'bg-yellow-600',  ring: 'ring-yellow-600',  glow: 'from-yellow-100/40' },
    red:     { bg: 'bg-red-50',     text: 'text-red-600',     border: 'border-red-200',     dark: 'bg-red-600',     ring: 'ring-red-600',     glow: 'from-red-100/40' },
    fuchsia: { bg: 'bg-fuchsia-50', text: 'text-fuchsia-600', border: 'border-fuchsia-200', dark: 'bg-fuchsia-600', ring: 'ring-fuchsia-600', glow: 'from-fuchsia-100/40' },
};

const tiers = crmTiers.map((tier, i) => {
    const ctaOverrides = ['Get Started', 'Get Started', 'Contact Sales', 'Contact Sales'];
    return { ...tier, cta: ctaOverrides[i] };
});

export default function IndustryLandingPage() {
    const { industry } = useParams();
    const data = industryData[industry];

    const {
        isYearly, setIsYearly,
        showContactModal, setShowContactModal,
        selectedPlan,
        submitting, submitted,
        toast,
        handleAction,
        submitContactForm,
    } = useCRMPricing();

    if (!data) return <Navigate to="/nexcrm" replace />;

    const colors = colorMap[data.color] || colorMap.blue;
    const otherIndustries = industryList.filter((ind) => ind.slug !== industry);
    const pageUrl = `${SITE_URL}/nexcrm/industries/${industry}`;

    const breadcrumbSchema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
            { '@type': 'ListItem', position: 2, name: 'NexCRM', item: `${SITE_URL}/nexcrm` },
            { '@type': 'ListItem', position: 3, name: data.name, item: pageUrl },
        ],
    };

    const faqSchema = data.faqs?.length ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: data.faqs.map((faq) => ({
            '@type': 'Question',
            name: faq.q,
            acceptedAnswer: { '@type': 'Answer', text: faq.a },
        })),
    } : null;

    const productSchema = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: `NexCRM for ${data.name}`,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        url: pageUrl,
        description: data.seo.description,
        offers: {
            '@type': 'AggregateOffer',
            priceCurrency: 'INR',
            lowPrice: '999',
            highPrice: '5999',
            offerCount: '4',
        },
        provider: {
            '@type': 'Organization',
            name: 'Nexspire Solutions',
            url: SITE_URL,
            telephone: siteConfig.phone.tel,
            email: siteConfig.email.primary,
        },
    };

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900 overflow-x-hidden selection:bg-[#2563EB]/10">

            <Helmet>
                <title>{data.seo.title}</title>
                <meta name="description" content={data.seo.description} />
                {data.seo.keywords && <meta name="keywords" content={data.seo.keywords} />}
                <link rel="canonical" href={pageUrl} />
                <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />

                <meta property="og:title" content={data.seo.title} />
                <meta property="og:description" content={data.seo.description} />
                <meta property="og:type" content="website" />
                <meta property="og:url" content={pageUrl} />
                <meta property="og:image" content={`${SITE_URL}/og-image.jpg`} />
                <meta property="og:image:width" content="1200" />
                <meta property="og:image:height" content="630" />
                <meta property="og:site_name" content="Nexspire Solutions" />
                <meta property="og:locale" content="en_IN" />

                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={data.seo.title} />
                <meta name="twitter:description" content={data.seo.description} />
                <meta name="twitter:image" content={`${SITE_URL}/og-image.jpg`} />
                <meta name="twitter:site" content="@nexspiresolutions" />
                <meta name="twitter:creator" content="@nexspiresolutions" />

                <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
                <script type="application/ld+json">{JSON.stringify(productSchema)}</script>
                {faqSchema && <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>}
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

            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-slate-50 to-white z-0" />
                <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b ${colors.glow} to-transparent rounded-full blur-3xl opacity-60 pointer-events-none z-0`} />

                <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        {/* Breadcrumbs */}
                        <nav className="flex items-center justify-center gap-2 text-sm text-slate-500 mb-8">
                            <Link to="/" className="hover:text-slate-900 transition-colors">Home</Link>
                            <span>/</span>
                            <Link to="/nexcrm" className="hover:text-slate-900 transition-colors">NexCRM</Link>
                            <span>/</span>
                            <span className="text-slate-900 font-medium">{data.name}</span>
                        </nav>

                        {/* Badge */}
                        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm font-medium mb-8 hover:shadow-md transition-all cursor-default ${colors.bg} ${colors.border} ${colors.text}`}>
                            <Icon name={data.hero.badge.icon || data.icon} />
                            <span>{data.hero.badge.text || data.hero.badge}</span>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 mb-8 leading-[1.1]">
                            {data.hero.title}
                        </h1>

                        <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
                            {data.hero.subtitle}
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <button
                                onClick={() => document.getElementById('pricing').scrollIntoView({ behavior: 'smooth' })}
                                className="px-8 py-4 bg-slate-900 text-white rounded-xl font-semibold shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all duration-300 ring-4 ring-slate-900/10"
                            >
                                View Pricing
                            </button>
                            <Link
                                to="/contact"
                                className="px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-xl font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all duration-300 shadow-sm"
                            >
                                Book a Demo
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            <section className="py-10 bg-white border-b border-slate-100">
                <div className="max-w-5xl mx-auto px-6">
                    <FadeIn y={16} duration={0.5}>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
                            {data.stats.map((stat) => (
                                <div key={stat.label} className="flex flex-col items-center text-center gap-1">
                                    <span className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">{stat.value}</span>
                                    <span className="text-sm text-slate-500 font-medium">{stat.label}</span>
                                </div>
                            ))}
                        </div>
                    </FadeIn>
                </div>
            </section>

            <section className="py-32 bg-slate-50 relative overflow-hidden">
                <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:24px_24px]" />

                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <FadeIn y={24} duration={0.6}>
                        <div className="max-w-3xl mx-auto text-center mb-20">
                            <span className={`font-bold tracking-wider uppercase text-sm mb-4 block ${colors.text}`}>What We Offer</span>
                            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6">
                                Tailored for <span className={colors.text}>{data.name}</span>
                            </h2>
                            <p className="text-xl text-slate-600 font-light">Purpose-built tools that solve real problems in your industry.</p>
                        </div>
                    </FadeIn>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {data.services.map((service, idx) => (
                            <FadeIn key={service.title} y={30} delay={idx * 0.08}>
                                <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-xl shadow-slate-200/50 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 group h-full">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform ${colors.bg} ${colors.text}`}>
                                        <Icon name={service.icon} />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-3">{service.title}</h3>
                                    <p className="text-slate-600 font-medium leading-relaxed">{service.desc}</p>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            <section className="py-28 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <FadeIn y={24} duration={0.6}>
                        <div className="max-w-3xl mx-auto text-center mb-20">
                            <span className={`font-bold tracking-wider uppercase text-sm mb-4 block ${colors.text}`}>Why NexCRM</span>
                            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6">
                                Built for teams like yours
                            </h2>
                            <p className="text-xl text-slate-600 font-light">Here&rsquo;s why {data.name.toLowerCase()} businesses trust NexCRM.</p>
                        </div>
                    </FadeIn>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {data.whyChooseUs.map((item, idx) => (
                            <FadeIn key={item.title} y={24} delay={idx * 0.1}>
                                <div className="flex gap-6 p-8 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-lg transition-all duration-300 group h-full">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-110 transition-transform ${colors.bg} ${colors.text}`}>
                                        <Icon name={item.icon} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                                        <p className="text-slate-600 leading-relaxed">{item.desc}</p>
                                    </div>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            <section className="py-32 bg-slate-900 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:32px_32px] pointer-events-none" />
                <div className={`absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[120px] opacity-10 pointer-events-none ${colors.dark}`} />

                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <FadeIn y={24} duration={0.6}>
                        <div className="max-w-3xl mx-auto text-center mb-20">
                            <span className="text-blue-400 font-bold tracking-wider uppercase text-sm mb-4 block">The Difference</span>
                            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                                How we&rsquo;re different
                            </h2>
                            <p className="text-xl text-slate-400 font-light">Not just another generic CRM. We understand your industry.</p>
                        </div>
                    </FadeIn>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {data.differentiators.map((item, idx) => (
                            <FadeIn key={item.title} y={30} delay={idx * 0.08}>
                                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 group h-full">
                                    <div className={`text-sm font-bold tracking-wider uppercase mb-4 ${colors.text} opacity-80`}>0{idx + 1}</div>
                                    <h3 className="text-lg font-bold text-white mb-3">{item.title}</h3>
                                    <p className="text-slate-400 leading-relaxed text-sm">{item.desc}</p>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            <section className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <FadeIn y={24} duration={0.6}>
                        <div className="max-w-3xl mx-auto text-center mb-20">
                            <span className={`font-bold tracking-wider uppercase text-sm mb-4 block ${colors.text}`}>Modules</span>
                            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6">
                                Everything included
                            </h2>
                            <p className="text-xl text-slate-600 font-light">A complete set of modules designed for {data.name.toLowerCase()} workflows.</p>
                        </div>
                    </FadeIn>

                    <FadeIn y={20} delay={0.1}>
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-xl shadow-slate-200/40">
                            <div className="grid grid-cols-[1fr_auto] bg-slate-100/80 border-b border-slate-200">
                                <div className="py-4 px-8 text-sm font-semibold text-slate-900 uppercase tracking-wider">Module</div>
                                <div className="py-4 px-8 text-sm font-semibold text-slate-900 uppercase tracking-wider text-center">Included</div>
                            </div>
                            {data.modules.map((mod, idx) => (
                                <div
                                    key={mod.name}
                                    className={`grid grid-cols-[1fr_auto] items-center hover:bg-blue-50/30 transition-colors ${idx < data.modules.length - 1 ? 'border-b border-slate-100' : ''}`}
                                >
                                    <div className="py-4 px-8 flex items-center gap-3">
                                        <span className="text-sm font-medium text-slate-700">{mod.name}</span>
                                    </div>
                                    <div className="py-4 px-8 flex justify-center">
                                        {mod.included ? <CheckIcon /> : <XIcon />}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </FadeIn>
                </div>
            </section>

            <section id="pricing" className="py-32 bg-slate-50 relative border-t border-slate-200">
                <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />

                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <FadeIn y={24}>
                        <div className="text-center mb-16">
                            <h2 className="text-4xl font-bold text-slate-900 mb-6">Simple, Transparent Pricing</h2>
                            <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-12">Choose the plan that fits your {data.name.toLowerCase()} business.</p>

                            {/* Yearly / Monthly Toggle */}
                            <div className="inline-flex bg-white p-1 rounded-full border border-slate-200 shadow-sm relative">
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
                        {tiers.map((tier, idx) => {
                            const isRecommended = tier.name === data.recommendedTier;
                            return (
                                <FadeIn key={tier.name} y={30} delay={idx * 0.08}>
                                    <div className={`relative flex flex-col bg-white rounded-3xl p-8 transition-all duration-300 hover:-translate-y-1 overflow-hidden group h-full ${isRecommended ? `ring-2 ${colors.ring} shadow-2xl scale-[1.02] z-10` : 'border border-slate-200 shadow-lg hover:shadow-xl'}`}>
                                        {isRecommended && (
                                            <div className="absolute top-0 right-0">
                                                <div className={`${colors.dark} text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-2xl shadow-sm`}>
                                                    RECOMMENDED
                                                </div>
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
                                            <li className="flex items-start gap-3 text-sm text-slate-600">
                                                <div className="mt-0.5"><CheckIcon /></div>
                                                <span><strong className="text-slate-900">{tier.limits.leads}</strong> Leads</span>
                                            </li>
                                            <li className="flex items-start gap-3 text-sm text-slate-600">
                                                <div className="mt-0.5"><CheckIcon /></div>
                                                <span><strong className="text-slate-900">{tier.limits.customers}</strong> Customers</span>
                                            </li>
                                            <li className="flex items-start gap-3 text-sm text-slate-600">
                                                <div className="mt-0.5"><CheckIcon /></div>
                                                <span><strong className="text-slate-900">{tier.limits.teamMembers}</strong> Team Members</span>
                                            </li>
                                            <li className="flex items-start gap-3 text-sm text-slate-600">
                                                <div className="mt-0.5"><CheckIcon /></div>
                                                <span>{tier.limits.storage} Storage</span>
                                            </li>
                                        </ul>

                                        <button
                                            onClick={() => handleAction(tier.name)}
                                            className={`w-full py-4 rounded-xl font-bold transition-all duration-300 transform active:scale-95 border ${isRecommended ? `${colors.dark} text-white ${colors.border} hover:opacity-90 shadow-lg` : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md'}`}
                                        >
                                            {tier.cta}
                                        </button>
                                    </div>
                                </FadeIn>
                            );
                        })}
                    </div>
                </div>
            </section>

            {data.testimonial && (
                <section className="py-20 bg-white">
                    <div className="max-w-4xl mx-auto px-6">
                        <FadeIn y={24} duration={0.6}>
                            <div className="text-center">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-10 ${colors.bg} ${colors.text}`}>
                                    <RiDoubleQuotesL />
                                </div>
                                <blockquote className="text-2xl md:text-3xl font-medium text-slate-900 leading-relaxed mb-10">
                                    &ldquo;{data.testimonial.quote}&rdquo;
                                </blockquote>
                                <div className="flex flex-col items-center gap-1">
                                    <span className="font-bold text-slate-900">{data.testimonial.author}</span>
                                    <span className="text-sm text-slate-500">{data.testimonial.role}, {data.testimonial.company}</span>
                                </div>
                            </div>
                        </FadeIn>
                    </div>
                </section>
            )}

            <section className="py-24 bg-slate-50 border-t border-slate-100">
                <div className="max-w-3xl mx-auto px-6">
                    <FadeIn y={24}>
                        <div className="text-center mb-14">
                            <span className={`font-bold tracking-wider uppercase text-sm mb-4 block ${colors.text}`}>FAQ</span>
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Frequently Asked Questions</h2>
                        </div>
                    </FadeIn>

                    <div className="space-y-3">
                        {data.faqs.map((faq, idx) => (
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

            <section className="py-32 px-6">
                <FadeIn y={30}>
                    <div className="max-w-5xl mx-auto bg-slate-900 rounded-[2.5rem] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-[#2563EB]/10 to-transparent pointer-events-none" />
                        <div className="relative z-10">
                            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                                {data.cta?.title || `Ready to transform your ${data.name.toLowerCase()} business?`}
                            </h2>
                            <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
                                {data.cta?.subtitle || `Join businesses using NexCRM to scale their ${data.name.toLowerCase()} operations.`}
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <button
                                    onClick={() => document.getElementById('pricing').scrollIntoView({ behavior: 'smooth' })}
                                    className="px-10 py-5 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg"
                                >
                                    Get Started Now
                                </button>
                                <Link
                                    to="/contact"
                                    className="px-10 py-5 bg-white/10 text-white border border-white/20 rounded-xl font-bold text-lg hover:bg-white/20 transition-all"
                                >
                                    Talk to Sales
                                </Link>
                            </div>
                        </div>
                    </div>
                </FadeIn>
            </section>

            {otherIndustries.length > 0 && (
                <section className="py-20 bg-slate-50 border-t border-slate-100">
                    <div className="max-w-7xl mx-auto px-6">
                        <FadeIn y={24} duration={0.6}>
                            <div className="text-center mb-14">
                                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">Explore Other Industries</h2>
                                <p className="text-slate-500 text-lg">NexCRM is built for every business type.</p>
                            </div>
                        </FadeIn>

                        <FadeIn y={16} delay={0.1}>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {otherIndustries.map((ind) => {
                                    const indData = industryData[ind.slug];
                                    const indColors = colorMap[indData?.color] || colorMap.blue;
                                    return (
                                        <Link
                                            key={ind.slug}
                                            to={ind.path}
                                            className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-200 group"
                                        >
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${indColors.bg} ${indColors.text}`}>
                                                <Icon name={ind.icon} />
                                            </div>
                                            <span className="font-semibold text-slate-700 group-hover:text-slate-900 transition-colors text-sm">{ind.name}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </FadeIn>
                    </div>
                </section>
            )}

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
                            <p className="text-slate-500 mt-2">Let&rsquo;s discuss the best plan for your {data.name.toLowerCase()} business.</p>
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
                                    <textarea name="message" rows="3" maxLength={2000} placeholder="Additional details..." aria-label="Your message" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2563EB] focus:bg-white outline-none resize-none transition-all" />
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
