import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, useScroll, useSpring } from 'framer-motion';
import RelatedServices from '../../components/seo/RelatedServices';
import AreasWeServe from '../../components/seo/AreasWeServe';

const FadeIn = ({ children, className, delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.6, delay, ease: "easeOut" }}
        className={className}
    >
        {children}
    </motion.div>
);

const EcommerceDevelopment = () => {
    useEffect(() => { window.scrollTo(0, 0); }, []);
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

    const capabilities = [
        {
            title: "Custom Shopify",
            description: "Bespoke Shopify Plus themes and private apps that push the boundaries of what's possible.",
            tech: ["Liquid", "Hydrogen", "Shopify CLI", "Storefront API"],
            icon: "ri-shopping-bag-3-line",
            color: "green"
        },
        {
            title: "WooCommerce",
            description: "Scalable WordPress-based stores with custom plugin development and performance optimization.",
            tech: ["PHP", "WordPress", "MySQL", "Redis"],
            icon: "ri-wordpress-fill",
            color: "blue"
        },
        {
            title: "Marketplace Development",
            description: "Complex multi-vendor platforms like Amazon or Etsy, built for high transaction volumes.",
            tech: ["Next.js", "Stripe Connect", "PostgreSQL", "Elasticsearch"],
            icon: "ri-store-3-line",
            color: "orange"
        },
        {
            title: "Headless Commerce",
            description: "Decoupled frontend experiences powered by best-in-class commerce backends.",
            tech: ["Medusa.js", "Contentful", "Sanity", "Vercel"],
            icon: "ri-rocket-line",
            color: "purple"
        }
    ];

    const serviceSchema = {
        "@context": "https://schema.org",
        "@type": "Service",
        "name": "E-commerce Development",
        "provider": { "@type": "Organization", "name": "Nexspire Solutions", "url": "https://nexspiresolutions.co.in" },
        "description": "Expert E-commerce development services. Shopify, WooCommerce, and Custom Marketplaces.",
        "areaServed": "Global"
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-orange-600 selection:text-white">
            <Helmet>
                <title>E-commerce Development Services | Shopify & Custom Stores</title>
                <meta name="description" content="Build high-conversion online stores with Nexspire. Experts in Shopify, WooCommerce, and Headless Commerce solutions." />
                <link rel="canonical" href="https://nexspiresolutions.co.in/services/ecommerce-development" />
                <script type="application/ld+json">{JSON.stringify(serviceSchema)}</script>
            </Helmet>

            <motion.div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-red-500 origin-left z-50" style={{ scaleX }} />

            {/* Hero Section */}
            <section className="relative pt-32 pb-24 overflow-hidden bg-slate-900 text-white rounded-b-[3rem] shadow-2xl z-20">
                {/* Hero Background Image */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?q=80&w=2070&auto=format&fit=crop"
                        alt="Ecommerce Background"
                        className="w-full h-full object-cover opacity-50 transform scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 via-slate-900/80 to-slate-900"></div>
                </div>

                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light z-1"></div>

                <div className="container-custom relative z-10">
                    <div className="max-w-4xl">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8">
                            <i className="ri-shopping-cart-2-line text-orange-400"></i>
                            <span className="text-sm font-medium text-orange-100">Digital Commerce</span>
                        </motion.div>

                        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-5xl md:text-7xl font-bold mb-8 tracking-tight leading-tight">
                            Sell Smarter. <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-red-400 to-pink-400">Grow Faster.</span>
                        </motion.h1>

                        <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-xl text-gray-400 max-w-2xl leading-relaxed mb-10">
                            We build data-driven e-commerce experiences that turn visitors into loyal customers. From headless storefronts to complex marketplaces.
                        </motion.p>

                        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-wrap gap-4">
                            <Link to="/contact" className="inline-flex items-center gap-3 px-8 py-4 bg-orange-600 hover:bg-orange-500 rounded-full text-lg font-bold transition-all shadow-lg hover:shadow-orange-500/25">
                                Start Selling
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
                            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-slate-900">Experience-Led. <br /> Conversion-Focused.</h2>
                            <p className="text-lg text-slate-600 leading-relaxed mb-6">
                                In a crowded market, generic stores don't cut it. We design unique shopping journeys that reflect your brand and remove friction at every touchpoint.
                            </p>
                            <ul className="space-y-4 mt-8">
                                {[
                                    "High-Performance Storefronts",
                                    "Seamless Payment Integration",
                                    "Inventory Management Sync",
                                    "Loyalty Program Systems"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                                        <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                                            <i className="ri-check-line font-bold"></i>
                                        </div>
                                        <span className="font-semibold text-slate-700">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </FadeIn>

                        {/* Bento Grid Images */}
                        <FadeIn delay={0.2} className="relative h-[600px] grid grid-cols-2 grid-rows-2 gap-4">
                            {/* Large Image */}
                            <div className="row-span-2 relative group overflow-hidden rounded-[2rem] shadow-xl">
                                <img
                                    src="https://images.unsplash.com/photo-1601933973783-43cf8a7d4c5f?auto=format&fit=crop&q=80&w=800"
                                    alt="Online Shopping"
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
                                <div className="absolute bottom-6 left-6 text-white font-bold text-lg">Seamless Checkout</div>
                            </div>

                            {/* Top Small Image */}
                            <div className="relative group overflow-hidden rounded-[2rem] shadow-xl">
                                <img
                                    src="https://images.unsplash.com/photo-1556742031-c6961e8560b0?auto=format&fit=crop&q=80&w=800"
                                    alt="Payment Terminal"
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-orange-600/20 mix-blend-overlay"></div>
                            </div>

                            {/* Bottom Small Image with Stat */}
                            <div className="relative bg-orange-600 rounded-[2rem] shadow-xl flex flex-col items-center justify-center text-white p-6 text-center group overflow-hidden">
                                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light"></div>
                                <div className="relative z-10">
                                    <div className="text-4xl font-bold mb-1">3x</div>
                                    <div className="text-sm text-orange-100 font-medium">Conversion Rate</div>
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
                        <span className="text-orange-600 font-bold tracking-widest uppercase text-sm">Our Expertise</span>
                        <h2 className="text-4xl font-bold mt-2 text-slate-900">Commerce Solutions</h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {capabilities.map((cap, i) => (
                            <FadeIn key={i} delay={i * 0.1} className="group p-8 rounded-[2rem] bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-xl hover:shadow-orange-200/50 hover:-translate-y-1 transition-all duration-300">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-6 transition-transform group-hover:scale-110 bg-${cap.color}-100 text-${cap.color}-600`}>
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
                    <h2 className="text-2xl font-bold mb-8">Related Services</h2>
                    <RelatedServices currentService="E-commerce Development" />
                </div>
                <div className="mt-20">
                    <AreasWeServe />
                </div>
            </div>

            {/* Final CTA */}
            <section className="py-24 bg-slate-900 text-white text-center">
                <div className="container-custom">
                    <h2 className="text-4xl md:text-5xl font-bold mb-8">Ready to Scale?</h2>
                    <p className="text-slate-400 mb-10 text-lg max-w-xl mx-auto">Build an online store that delivers results.</p>
                    <Link to="/contact" className="inline-flex items-center gap-3 px-10 py-5 bg-white text-slate-900 rounded-full text-lg font-bold hover:scale-105 transition-transform">
                        Get Your Free Quote
                    </Link>
                </div>
            </section>
        </div>
    );
};

export default EcommerceDevelopment;
