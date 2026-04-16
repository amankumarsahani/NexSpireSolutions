import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import DOMPurify from 'dompurify';
import RelatedServices from './seo/RelatedServices';
import AreasWeServe from './seo/AreasWeServe';
import FadeIn from './ui/FadeIn';
import ReadingProgress from './ui/ReadingProgress';
import { siteConfig } from '../constants/siteConfig';
import Icon from './ui/Icon';
import { RiArrowRightLine, RiCheckLine } from 'react-icons/ri';

const SITE_URL = siteConfig.domain;

// Static color maps — Tailwind can detect these complete class strings at build time
const themeColorMap = {
    teal: {
        text400: 'text-teal-400',
        text100: 'text-teal-100',
        text600: 'text-teal-600',
        bg100: 'bg-teal-100',
        bg600: 'bg-teal-600',
        bgHover500: 'hover:bg-teal-500',
        bg600_20: 'bg-teal-600/20',
        shadowHover: 'hover:shadow-teal-500/25',
        shadowHover200: 'hover:shadow-teal-200/50',
    },
    blue: {
        text400: 'text-blue-400',
        text100: 'text-blue-100',
        text600: 'text-blue-600',
        bg100: 'bg-blue-100',
        bg600: 'bg-blue-600',
        bgHover500: 'hover:bg-blue-500',
        bg600_20: 'bg-blue-600/20',
        shadowHover: 'hover:shadow-blue-500/25',
        shadowHover200: 'hover:shadow-blue-200/50',
    },
    purple: {
        text400: 'text-purple-400',
        text100: 'text-purple-100',
        text600: 'text-purple-600',
        bg100: 'bg-purple-100',
        bg600: 'bg-purple-600',
        bgHover500: 'hover:bg-purple-500',
        bg600_20: 'bg-purple-600/20',
        shadowHover: 'hover:shadow-purple-500/25',
        shadowHover200: 'hover:shadow-purple-200/50',
    },
    emerald: {
        text400: 'text-emerald-400',
        text100: 'text-emerald-100',
        text600: 'text-emerald-600',
        bg100: 'bg-emerald-100',
        bg600: 'bg-emerald-600',
        bgHover500: 'hover:bg-emerald-500',
        bg600_20: 'bg-emerald-600/20',
        shadowHover: 'hover:shadow-emerald-500/25',
        shadowHover200: 'hover:shadow-emerald-200/50',
    },
    cyan: {
        text400: 'text-cyan-400',
        text100: 'text-cyan-100',
        text600: 'text-cyan-600',
        bg100: 'bg-cyan-100',
        bg600: 'bg-cyan-600',
        bgHover500: 'hover:bg-cyan-500',
        bg600_20: 'bg-cyan-600/20',
        shadowHover: 'hover:shadow-cyan-500/25',
        shadowHover200: 'hover:shadow-cyan-200/50',
    },
    green: {
        text400: 'text-green-400',
        text100: 'text-green-100',
        text600: 'text-green-600',
        bg100: 'bg-green-100',
        bg600: 'bg-green-600',
        bgHover500: 'hover:bg-green-500',
        bg600_20: 'bg-green-600/20',
        shadowHover: 'hover:shadow-green-500/25',
        shadowHover200: 'hover:shadow-green-200/50',
    },
    orange: {
        text400: 'text-orange-400',
        text100: 'text-orange-100',
        text600: 'text-orange-600',
        bg100: 'bg-orange-100',
        bg600: 'bg-orange-600',
        bgHover500: 'hover:bg-orange-500',
        bg600_20: 'bg-orange-600/20',
        shadowHover: 'hover:shadow-orange-500/25',
        shadowHover200: 'hover:shadow-orange-200/50',
    },
    slate: {
        text400: 'text-slate-400',
        text100: 'text-slate-100',
        text600: 'text-slate-600',
        bg100: 'bg-slate-100',
        bg600: 'bg-slate-600',
        bgHover500: 'hover:bg-slate-500',
        bg600_20: 'bg-slate-600/20',
        shadowHover: 'hover:shadow-slate-500/25',
        shadowHover200: 'hover:shadow-slate-200/50',
    },
    pink: {
        text400: 'text-pink-400',
        text100: 'text-pink-100',
        text600: 'text-pink-600',
        bg100: 'bg-pink-100',
        bg600: 'bg-pink-600',
        bgHover500: 'hover:bg-pink-500',
        bg600_20: 'bg-pink-600/20',
        shadowHover: 'hover:shadow-pink-500/25',
        shadowHover200: 'hover:shadow-pink-200/50',
    },
};

function getColors(color) {
    return themeColorMap[color] || themeColorMap.teal;
}

export default function ServicePageTemplate({ data }) {
    const {
        themeColor,
        badge,
        hero,
        overview,
        capabilities,
        capabilitiesSection,
        bottomSection,
        cta,
        seo,
        schema,
    } = data;

    const tc = getColors(themeColor);

    const serviceSchema = {
        "@context": "https://schema.org",
        "@type": "Service",
        "name": schema.name,
        "provider": { "@type": "Organization", "name": "Nexspire Solutions", "url": SITE_URL },
        "description": schema.description,
        "areaServed": "Global"
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-teal-700 selection:text-white">
            <Helmet>
                <title>{seo.title}</title>
                <meta name="description" content={seo.description} />
                <link rel="canonical" href={`${SITE_URL}${seo.canonicalPath}`} />
                <meta property="og:title" content={seo.ogTitle || seo.title} />
                <meta property="og:description" content={seo.ogDescription || seo.description} />
                <meta property="og:type" content="website" />
                <meta property="og:url" content={`${SITE_URL}${seo.canonicalPath}`} />
                <meta property="og:image" content={`${SITE_URL}/og-image.jpg`} />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={seo.twitterTitle || seo.title} />
                <meta name="twitter:description" content={seo.twitterDescription || seo.description} />
                <script type="application/ld+json">{JSON.stringify(serviceSchema)}</script>
            </Helmet>

            <ReadingProgress />

            {/* Hero Section */}
            <section className="relative pt-32 pb-24 overflow-hidden bg-slate-900 text-white rounded-b-[3rem] shadow-2xl z-20">
                <div className="absolute inset-0 z-0">
                    <img
                        src={`${hero.bgImage}?q=80&w=2072&auto=format&fit=crop&fm=webp`}
                        srcSet={`${hero.bgImage}?w=640&fm=webp 640w, ${hero.bgImage}?w=1024&fm=webp 1024w, ${hero.bgImage}?w=1920&fm=webp 1920w`}
                        sizes="100vw"
                        alt={hero.bgImageAlt || 'Background'}
                        loading="lazy"
                        className="w-full h-full object-cover opacity-50 transform scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 via-slate-900/80 to-slate-900"></div>
                </div>

                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light z-1"></div>

                <div className="container-custom relative z-10">
                    <div className="max-w-4xl">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8">
                            <Icon name={badge.icon} className={tc.text400} />
                            <span className={`text-sm font-medium ${tc.text100}`}>{badge.label}</span>
                        </motion.div>

                        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-5xl md:text-7xl font-bold mb-8 tracking-tight leading-tight">
                            {hero.h1Line1} <br />
                            <span className="text-[#2563EB]">{hero.h1Line2}</span>
                        </motion.h1>

                        <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-xl text-slate-400 max-w-2xl leading-relaxed mb-10">
                            {hero.paragraph}
                        </motion.p>

                        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-wrap gap-4">
                            <Link to="/contact" className={`inline-flex items-center gap-3 px-8 py-4 ${tc.bg600} ${tc.bgHover500} rounded-full text-lg font-bold transition-all shadow-lg ${tc.shadowHover}`}>
                                {hero.ctaText}
                                <RiArrowRightLine />
                            </Link>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Overview Section */}
            <section className="py-24">
                <div className="container-custom">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <FadeIn>
                            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-slate-900" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(overview.h2) }} />
                            <p className="text-lg text-slate-600 leading-relaxed mb-6">
                                {overview.paragraph}
                            </p>
                            <ul className="space-y-4 mt-8">
                                {overview.checklist.map((item, i) => (
                                    <li key={`checklist-${i}`} className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                                        <div className={`w-6 h-6 rounded-full ${tc.bg100} flex items-center justify-center ${tc.text600}`}>
                                            <RiCheckLine className="font-bold" />
                                        </div>
                                        <span className="font-semibold text-slate-700">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </FadeIn>

                        {/* Bento Grid Image Layout */}
                        <FadeIn delay={0.2} className="relative h-[600px] grid grid-cols-2 grid-rows-2 gap-4">
                            <div className="row-span-2 relative group overflow-hidden rounded-[2rem] shadow-xl">
                                <img
                                    src={overview.bento.largeImage.src}
                                    alt={overview.bento.largeImage.alt}
                                    loading="lazy"
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
                                <div className="absolute bottom-6 left-6 text-white font-bold text-lg">{overview.bento.largeImage.label}</div>
                            </div>

                            <div className="relative group overflow-hidden rounded-[2rem] shadow-xl">
                                <img
                                    src={overview.bento.smallImage.src}
                                    alt={overview.bento.smallImage.alt}
                                    loading="lazy"
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className={`absolute inset-0 ${tc.bg600_20} mix-blend-overlay`}></div>
                            </div>

                            <div className={`relative ${tc.bg600} rounded-[2rem] shadow-xl flex flex-col items-center justify-center text-white p-6 text-center group overflow-hidden`}>
                                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light"></div>
                                <div className="relative z-10">
                                    <div className="text-4xl font-bold mb-1">{overview.bento.stat.value}</div>
                                    <div className={`text-sm ${tc.text100} font-medium`}>{overview.bento.stat.label}</div>
                                </div>
                                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                            </div>
                        </FadeIn>
                    </div>
                </div>
            </section>

            {/* Capabilities Grid */}
            <section className="py-24 bg-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
                <div className="container-custom relative z-10">
                    <div className="text-center mb-16">
                        <span className={`${tc.text600} font-bold tracking-widest uppercase text-sm`}>{capabilitiesSection.label}</span>
                        <h2 className="text-4xl font-bold mt-2 text-slate-900">{capabilitiesSection.title}</h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {capabilities.map((cap, i) => {
                            const cc = getColors(cap.color);
                            return (
                                <FadeIn key={cap.title || `cap-${i}`} delay={i * 0.1} className={`group p-8 rounded-[2rem] bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-xl ${tc.shadowHover200} hover:-translate-y-1 transition-all duration-300`}>
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-6 transition-transform group-hover:scale-110 ${cc.bg100} ${cc.text600}`}>
                                        <Icon name={cap.icon} />
                                    </div>
                                    <h3 className="text-2xl font-bold mb-3 text-slate-900">{cap.title}</h3>
                                    <p className="text-slate-600 mb-6 leading-relaxed">
                                        {cap.description}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {cap.tech.map((t) => (
                                            <span key={t} className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 uppercase tracking-wide">
                                                {t}
                                            </span>
                                        ))}
                                    </div>
                                </FadeIn>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Bottom Section */}
            <div className="bg-slate-50 pt-20">
                <div className="container-custom">
                    <h2 className="text-2xl font-bold mb-8">{bottomSection.title}</h2>
                    <RelatedServices currentService={bottomSection.currentService} />
                </div>
                <div className="mt-20">
                    <AreasWeServe />
                </div>
            </div>

            {/* Final CTA */}
            <section className="py-24 bg-slate-900 text-white text-center">
                <div className="container-custom">
                    <h2 className="text-4xl md:text-5xl font-bold mb-8">{cta.h2}</h2>
                    <p className="text-slate-400 mb-10 text-lg max-w-xl mx-auto">{cta.paragraph}</p>
                    <Link to="/contact" className="inline-flex items-center gap-3 px-10 py-5 bg-white text-slate-900 rounded-full text-lg font-bold transition-transform">
                        {cta.buttonText}
                    </Link>
                </div>
            </section>
        </div>
    );
}
