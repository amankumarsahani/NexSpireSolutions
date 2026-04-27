import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { nexmailTiers, nexmailFeatures } from '../constants/nexmailPricing';
import { SITE_URL, siteConfig } from '../constants/siteConfig';
import FadeIn from '../components/ui/FadeIn';
import Icon from '../components/ui/Icon';
import {
    RiMailSendLine, RiRobot2Line, RiBarChartBoxLine, RiShieldCheckLine,
    RiDragDropLine, RiTimeLine, RiUserFollowLine, RiSpamLine,
    RiMailCheckLine, RiFlowChart, RiDashboard3Line, RiServerLine,
    RiCheckLine, RiArrowRightLine, RiStarFill, RiGroupLine,
    RiLinksLine, RiArrowDownSLine
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

export default function NexMailLandingPage() {
    const [isYearly, setIsYearly] = useState(false);
    const [openFaq, setOpenFaq] = useState(null);

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900 overflow-x-hidden selection:bg-[#2563EB]/10">
            <Helmet>
                <title>NexMail - Email Marketing Engine by Nexspire | SMTP Rotation, Anti-Spam, Automations</title>
                <meta name="description" content="NexMail is an enterprise email marketing engine with smart SMTP rotation, anti-spam scoring, domain throttling, visual automations, and NexCRM integration. Free plan available." />
                <meta name="keywords" content="email marketing tool India, SMTP rotation, anti-spam email, email automation, NexMail, Nexspire, Mailchimp alternative India, Brevo alternative, email campaign tool, email deliverability" />
                <link rel="canonical" href={`${SITE_URL}/nexmail`} />
                <meta property="og:title" content="NexMail - Email Marketing Engine by Nexspire" />
                <meta property="og:description" content="Smart SMTP rotation, anti-spam scoring, domain throttling, visual automations, and NexCRM integration. Free plan available." />
                <meta property="og:type" content="website" />
                <meta property="og:url" content={`${SITE_URL}/nexmail`} />
            </Helmet>

            <script type="application/ld+json">{JSON.stringify({
                "@context": "https://schema.org", "@type": "SoftwareApplication",
                "name": "NexMail", "applicationCategory": "BusinessApplication", "operatingSystem": "Web",
                "description": "Enterprise email marketing engine with SMTP rotation, anti-spam scoring, and visual automations.",
                "url": `${SITE_URL}/nexmail`,
                "offers": { "@type": "AggregateOffer", "priceCurrency": "INR", "lowPrice": "0", "highPrice": "4999", "offerCount": "4" },
                "provider": { "@type": "Organization", "name": "Nexspire Solutions", "url": SITE_URL }
            })}</script>

            {/* Hero */}
            <section className="relative pt-24 pb-20 lg:pt-32 lg:pb-28 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40" />
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <FadeIn>
                        <div className="max-w-3xl mx-auto text-center">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium mb-6">
                                <RiMailSendLine className="text-base" /> New from Nexspire
                            </div>
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6">
                                Email Marketing<br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2563EB] to-indigo-600">That Actually Lands</span>
                            </h1>
                            <p className="text-lg md:text-xl text-slate-600 leading-relaxed mb-10 max-w-2xl mx-auto">
                                Smart SMTP rotation, 50+ anti-spam checks, per-domain throttling, and visual automations.
                                Built for deliverability, not just sending.
                            </p>
                            <div className="flex flex-col sm:flex-row justify-center gap-4">
                                <Link to="/contact" className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[#2563EB] text-white rounded-xl font-semibold text-base hover:bg-[#1d4ed8] transition-all shadow-lg shadow-blue-600/20">
                                    Start Free <RiArrowRightLine />
                                </Link>
                                <a href="#features" className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-slate-700 rounded-xl font-semibold text-base border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all">
                                    See Features
                                </a>
                            </div>
                        </div>
                    </FadeIn>

                    <FadeIn delay={0.2}>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-3xl mx-auto">
                            {trustStats.map(stat => (
                                <div key={stat.label} className="text-center p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                                    <stat.icon className="text-2xl text-[#2563EB] mx-auto mb-2" />
                                    <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                                    <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </FadeIn>
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <FadeIn>
                        <div className="text-center mb-14">
                            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need to<br />Send Better Emails</h2>
                            <p className="text-lg text-slate-500 max-w-2xl mx-auto">Not just another email tool. NexMail is an email <em>engine</em> — built from the ground up for deliverability.</p>
                        </div>
                    </FadeIn>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((f, i) => (
                            <FadeIn key={f.title} delay={i * 0.05}>
                                <div className="p-6 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-lg transition-all duration-300 h-full bg-white">
                                    <div className={`w-12 h-12 ${f.bg} rounded-xl flex items-center justify-center mb-4`}>
                                        <f.icon className={`text-2xl ${f.color}`} />
                                    </div>
                                    <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                                    <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-20 bg-slate-50">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <FadeIn><h2 className="text-3xl font-bold text-center mb-14">Get Started in 3 Steps</h2></FadeIn>
                    <div className="grid md:grid-cols-3 gap-8">
                        {howItWorks.map((s, i) => (
                            <FadeIn key={s.step} delay={i * 0.1}>
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-[#2563EB] text-white rounded-2xl flex items-center justify-center mx-auto mb-4 text-xl font-bold">{s.step}</div>
                                    <h3 className="text-lg font-bold mb-2">{s.title}</h3>
                                    <p className="text-sm text-slate-500">{s.desc}</p>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* Comparison */}
            <section className="py-20 bg-white">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <FadeIn><h2 className="text-3xl font-bold text-center mb-4">NexMail vs Competitors</h2><p className="text-center text-slate-500 mb-10">See what makes NexMail different</p></FadeIn>
                    <FadeIn delay={0.1}>
                        <div className="overflow-x-auto rounded-2xl border border-slate-200">
                            <table className="w-full">
                                <thead><tr className="bg-slate-50">
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Feature</th>
                                    <th className="text-center py-3 px-4 text-sm font-bold text-[#2563EB]">NexMail</th>
                                    <th className="text-center py-3 px-4 text-sm font-semibold text-slate-500">Mailchimp</th>
                                    <th className="text-center py-3 px-4 text-sm font-semibold text-slate-500">Brevo</th>
                                </tr></thead>
                                <tbody>
                                    {comparisonItems.map((item, i) => (
                                        <tr key={item.feature} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                                            <td className="py-3 px-4 text-sm text-slate-700">{item.feature}</td>
                                            {[item.nexmail, item.mailchimp, item.brevo].map((v, j) => (
                                                <td key={j} className="py-3 px-4 text-center text-sm">
                                                    {v === true ? <RiCheckLine className={`inline text-lg ${j === 0 ? 'text-[#2563EB]' : 'text-emerald-500'}`} /> : v === false ? <span className="text-slate-300">-</span> : <span className={j === 0 ? 'font-semibold text-[#2563EB]' : 'text-slate-600'}>{v}</span>}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </FadeIn>
                </div>
            </section>

            {/* Pricing */}
            <section id="pricing" className="py-20 bg-slate-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <FadeIn>
                        <div className="text-center mb-10">
                            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
                            <p className="text-slate-500 mb-6">Start free. Scale as you grow. No hidden fees.</p>
                            <div className="inline-flex items-center bg-white rounded-full p-1 border border-slate-200 shadow-sm">
                                <button onClick={() => setIsYearly(false)} className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${!isYearly ? 'bg-[#2563EB] text-white shadow' : 'text-slate-600'}`}>Monthly</button>
                                <button onClick={() => setIsYearly(true)} className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${isYearly ? 'bg-[#2563EB] text-white shadow' : 'text-slate-600'}`}>Yearly <span className="text-[10px] ml-1 opacity-75">Save 15%</span></button>
                            </div>
                        </div>
                    </FadeIn>

                    <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-5">
                        {nexmailTiers.map((tier, i) => (
                            <FadeIn key={tier.name} delay={i * 0.05}>
                                <div className={`relative rounded-2xl p-5 h-full flex flex-col ${tier.popular ? 'bg-[#2563EB] text-white ring-2 ring-[#2563EB] shadow-xl shadow-blue-600/20' : 'bg-white border border-slate-200'}`}>
                                    {tier.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-amber-400 text-amber-900 text-xs font-bold rounded-full">MOST POPULAR</div>}
                                    <h3 className={`text-xl font-bold ${tier.popular ? 'text-white' : 'text-slate-900'}`}>{tier.name}</h3>
                                    <p className={`text-sm mt-1 ${tier.popular ? 'text-blue-100' : 'text-slate-500'}`}>{tier.description}</p>
                                    <div className="my-6">
                                        {tier.price.monthly !== null ? (
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-4xl font-extrabold">{tier.currency}{isYearly ? tier.price.yearly : tier.price.monthly}</span>
                                                <span className={`text-sm ${tier.popular ? 'text-blue-200' : 'text-slate-400'}`}>/mo</span>
                                            </div>
                                        ) : (
                                            <p className="text-2xl font-bold">Custom</p>
                                        )}
                                        {tier.isFree && <p className={`text-xs mt-1 ${tier.popular ? 'text-blue-200' : 'text-emerald-600'}`}>Free forever</p>}
                                    </div>
                                    <ul className="space-y-2 mb-6 flex-1">
                                        {Object.entries(tier.limits).map(([key, val]) => (
                                            <li key={key} className="flex items-center gap-2 text-sm">
                                                <RiCheckLine className={tier.popular ? 'text-blue-200' : 'text-[#2563EB]'} />
                                                <span>{val} {key.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <Link to="/contact" className={`block text-center py-2.5 rounded-xl font-semibold text-sm transition-all ${tier.popular ? 'bg-white text-[#2563EB] hover:bg-blue-50' : 'bg-[#2563EB] text-white hover:bg-[#1d4ed8]'}`}>{tier.cta}</Link>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="py-20 bg-white">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <FadeIn><h2 className="text-3xl font-bold text-center mb-10">Frequently Asked Questions</h2></FadeIn>
                    <div className="space-y-3">
                        {faqs.map((faq, i) => (
                            <FadeIn key={i} delay={i * 0.03}>
                                <div className="border border-slate-200 rounded-xl overflow-hidden">
                                    <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors">
                                        <span className="font-semibold text-sm text-slate-900">{faq.q}</span>
                                        <RiArrowDownSLine className={`text-xl text-slate-400 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                                    </button>
                                    {openFaq === i && <div className="px-4 pb-4 text-sm text-slate-600 leading-relaxed">{faq.a}</div>}
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 bg-gradient-to-r from-[#2563EB] to-indigo-700">
                <div className="max-w-3xl mx-auto px-4 text-center">
                    <FadeIn>
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Send Emails That Land?</h2>
                        <p className="text-blue-100 text-lg mb-8">Join businesses using NexMail for better deliverability. Start free today.</p>
                        <Link to="/contact" className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-[#2563EB] rounded-xl font-semibold text-base hover:bg-blue-50 transition-all shadow-lg">
                            Get Started Free <RiArrowRightLine />
                        </Link>
                    </FadeIn>
                </div>
            </section>
        </div>
    );
}
