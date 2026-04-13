import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import RelatedServices from './seo/RelatedServices';
import AreasWeServe from './seo/AreasWeServe';
import FadeIn from './ui/FadeIn';
import ReadingProgress from './ui/ReadingProgress';
import { siteConfig } from '../constants/siteConfig';

const SITE_URL = siteConfig.domain;

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

    const serviceSchema = {
        "@context": "https://schema.org",
        "@type": "Service",
        "name": schema.name,
        "provider": { "@type": "Organization", "name": "Nexspire Solutions", "url": SITE_URL },
        "description": schema.description,
        "areaServed": "Global"
    };

    return (
        <div className={`min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-teal-700 selection:text-white`}>
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
                            <i className={`${badge.icon} text-${themeColor}-400`}></i>
                            <span className={`text-sm font-medium text-${themeColor}-100`}>{badge.label}</span>
                        </motion.div>

                        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-5xl md:text-7xl font-bold mb-8 tracking-tight leading-tight">
                            {hero.h1Line1} <br />
                            <span className={`text-[#0F766E]`}>{hero.h1Line2}</span>
                        </motion.h1>

                        <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-xl text-slate-400 max-w-2xl leading-relaxed mb-10">
                            {hero.paragraph}
                        </motion.p>

                        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-wrap gap-4">
                            <Link to="/contact" className={`inline-flex items-center gap-3 px-8 py-4 bg-${themeColor}-600 hover:bg-${themeColor}-500 rounded-full text-lg font-bold transition-all shadow-lg hover:shadow-${themeColor}-500/25`}>
                                {hero.ctaText}
                                <i className="ri-arrow-right-line"></i>
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
                            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-slate-900" dangerouslySetInnerHTML={{ __html: overview.h2 }} />
                            <p className="text-lg text-slate-600 leading-relaxed mb-6">
                                {overview.paragraph}
                            </p>
                            <ul className="space-y-4 mt-8">
                                {overview.checklist.map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                                        <div className={`w-6 h-6 rounded-full bg-${themeColor}-100 flex items-center justify-center text-${themeColor}-600`}>
                                            <i className="ri-check-line font-bold"></i>
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
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
                                <div className="absolute bottom-6 left-6 text-white font-bold text-lg">{overview.bento.largeImage.label}</div>
                            </div>

                            <div className="relative group overflow-hidden rounded-[2rem] shadow-xl">
                                <img
                                    src={overview.bento.smallImage.src}
                                    alt={overview.bento.smallImage.alt}
                                    loading="lazy"
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-"
                                />
                                <div className={`absolute inset-0 bg-${themeColor}-600/20 mix-blend-overlay`}></div>
                            </div>

                            <div className={`relative bg-${themeColor}-600 rounded-[2rem] shadow-xl flex flex-col items-center justify-center text-white p-6 text-center group overflow-hidden`}>
                                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light"></div>
                                <div className="relative z-10">
                                    <div className="text-4xl font-bold mb-1">{overview.bento.stat.value}</div>
                                    <div className={`text-sm text-${themeColor}-100 font-medium`}>{overview.bento.stat.label}</div>
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
                        <span className={`text-${themeColor}-600 font-bold tracking-widest uppercase text-sm`}>{capabilitiesSection.label}</span>
                        <h2 className="text-4xl font-bold mt-2 text-slate-900">{capabilitiesSection.title}</h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {capabilities.map((cap, i) => (
                            <FadeIn key={i} delay={i * 0.1} className={`group p-8 rounded-[2rem] bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-xl hover:shadow-${themeColor}-200/50 hover:-translate-y-1 transition-all duration-300`}>
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-6 transition-transform group- bg-${cap.color}-100 text-${cap.color}-600`}>
                                    <i className={cap.icon}></i>
                                </div>
                                <h3 className="text-2xl font-bold mb-3 text-slate-900">{cap.title}</h3>
                                <p className="text-slate-600 mb-6 leading-relaxed">
                                    {cap.description}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {cap.tech.map((t, idx) => (
                                        <span key={idx} className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 uppercase tracking-wide">
                                            {t}
                                        </span>
                                    ))}
                                </div>
                            </FadeIn>
                        ))}
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
                    <Link to="/contact" className="inline-flex items-center gap-3 px-10 py-5 bg-white text-slate-900 rounded-full text-lg font-bold  transition-transform">
                        {cta.buttonText}
                    </Link>
                </div>
            </section>
        </div>
    );
}
