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

const CustomWebDevelopment = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100, damping: 30, restDelta: 0.001
    });

    const capabilities = [
        {
            title: "Frontend Architecture",
            description: "Pixel-perfect, responsive interfaces built with React and Next.js for maximum performance and SEO.",
            tech: ["React.js", "Next.js", "Tailwind Connectivity", "Framer Motion"],
            icon: "ri-layout-masonry-line",
            color: "blue"
        },
        {
            title: "Backend Engineering",
            description: "Scalable server-side solutions designed to handle high concurrency and complex business logic.",
            tech: ["Node.js", "Python", "PostgreSQL", "Redis"],
            icon: "ri-server-line",
            color: "purple"
        },
        {
            title: "API Development",
            description: "Secure RESTful and GraphQL APIs that seamlessly connect your applications with third-party services.",
            tech: ["GraphQL", "REST", "Stripe Integration", "Auth0"],
            icon: "ri-links-line",
            color: "emerald"
        },
        {
            title: "Cloud Infrastructure",
            description: "Automated CI/CD pipelines and serverless architectures for rapid, reliable deployment.",
            tech: ["AWS", "Docker", "Kubernetes", "Terraform"],
            icon: "ri-cloud-windy-line",
            color: "cyan"
        }
    ];

    const serviceSchema = {
        "@context": "https://schema.org",
        "@type": "Service",
        "name": "Custom Web Development",
        "provider": { "@type": "Organization", "name": "Nexspire Solutions", "url": "https://nexspiresolutions.co.in" },
        "description": "Enterprise-grade custom web application development services using React, Next.js, and Node.js.",
        "areaServed": "Global"
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-600 selection:text-white">
            <Helmet>
                <title>Custom Web Development Services | Enterprise Solutions</title>
                <meta name="description" content="Build scalable, high-performance web applications with Nexspire. Expert React, Next.js, and Node.js developers delivering custom solutions for global brands." />
                <link rel="canonical" href="https://nexspiresolutions.co.in/services/custom-web-development" />
                <script type="application/ld+json">{JSON.stringify(serviceSchema)}</script>
            </Helmet>

            {/* Scroll Bar */}
            <motion.div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-purple-600 origin-left z-50" style={{ scaleX }} />

            {/* Hero Section */}
            <section className="relative pt-32 pb-24 overflow-hidden bg-slate-900 text-white rounded-b-[3rem] shadow-2xl z-20">
                {/* Hero Background Image */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop"
                        alt="Background"
                        className="w-full h-full object-cover opacity-50"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 via-slate-900/80 to-slate-900"></div>
                </div>

                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light z-1"></div>

                <div className="container-custom relative z-10">
                    <div className="max-w-4xl">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8">
                            <i className="ri-code-s-slash-line text-blue-400"></i>
                            <span className="text-sm font-medium text-blue-100">Web Engineering</span>
                        </motion.div>

                        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-5xl md:text-7xl font-bold mb-8 tracking-tight leading-tight">
                            Scalable <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">Web Applications.</span>
                        </motion.h1>

                        <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-xl text-gray-400 max-w-2xl leading-relaxed mb-10">
                            We define the digital standard for your business with robust, secure, and high-performance web solutions tailored to your unique goals.
                        </motion.p>

                        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-wrap gap-4">
                            <Link to="/contact" className="inline-flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-full text-lg font-bold transition-all shadow-lg hover:shadow-blue-500/25">
                                Start Project
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
                            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-slate-900">Built for Scale. <br /> Designed for Growth.</h2>
                            <p className="text-lg text-slate-600 leading-relaxed mb-6">
                                Off-the-shelf software often creates more problems than it solves. We build custom platforms that fit your business logic perfectly, allowing you to innovate without constraints.
                            </p>
                            <ul className="space-y-4 mt-8">
                                {[
                                    "Single Page Applications (SPAs)",
                                    "Progressive Web Apps (PWAs)",
                                    "Enterprise SaaS Platforms",
                                    "Complex Dashboards & Portals"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                            <i className="ri-check-line font-bold"></i>
                                        </div>
                                        <span className="font-semibold text-slate-700">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </FadeIn>

                        {/* Bento Grid Image Layout */}
                        <FadeIn delay={0.2} className="relative h-[600px] grid grid-cols-2 grid-rows-2 gap-4">
                            {/* Large Image */}
                            <div className="row-span-2 relative group overflow-hidden rounded-[2rem] shadow-xl">
                                <img
                                    src="https://images.unsplash.com/photo-1555099962-4199c345e5dd?q=80&w=2070&auto=format&fit=crop"
                                    alt="Coding Interface"
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
                                <div className="absolute bottom-6 left-6 text-white font-bold text-lg">Code Excellence</div>
                            </div>

                            {/* Top Small Image */}
                            <div className="relative group overflow-hidden rounded-[2rem] shadow-xl">
                                <img
                                    src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2015&auto=format&fit=crop"
                                    alt="Analytics Dashboard"
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-blue-600/20 mix-blend-overlay"></div>
                            </div>

                            {/* Bottom Small Image with Stat */}
                            <div className="relative bg-blue-600 rounded-[2rem] shadow-xl flex flex-col items-center justify-center text-white p-6 text-center group overflow-hidden">
                                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light"></div>
                                <div className="relative z-10">
                                    <div className="text-4xl font-bold mb-1">99%</div>
                                    <div className="text-sm text-blue-100 font-medium">Uptime Guarantee</div>
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
                        <span className="text-blue-600 font-bold tracking-widest uppercase text-sm">Technical Expertise</span>
                        <h2 className="text-4xl font-bold mt-2 text-slate-900">Full-Stack Excellence</h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {capabilities.map((cap, i) => (
                            <FadeIn key={i} delay={i * 0.1} className="group p-8 rounded-[2rem] bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300">
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
                    <h2 className="text-2xl font-bold mb-8">More Solutions</h2>
                    <RelatedServices currentService="Custom Web Development" />
                </div>
                <div className="mt-20">
                    <AreasWeServe />
                </div>
            </div>

            {/* Final CTA */}
            <section className="py-24 bg-slate-900 text-white text-center">
                <div className="container-custom">
                    <h2 className="text-4xl md:text-5xl font-bold mb-8">Ready to Build?</h2>
                    <p className="text-slate-400 mb-10 text-lg max-w-xl mx-auto">Let's turn your concept into a high-performing digital product.</p>
                    <Link to="/contact" className="inline-flex items-center gap-3 px-10 py-5 bg-white text-slate-900 rounded-full text-lg font-bold hover:scale-105 transition-transform">
                        Get Your Free Quote
                    </Link>
                </div>
            </section>
        </div>
    );
};

export default CustomWebDevelopment;
