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

const MobileAppDevelopment = () => {
    useEffect(() => { window.scrollTo(0, 0); }, []);
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

    const capabilities = [
        {
            title: "iOS Development",
            description: "Native iOS applications written in Swift/SwiftUI that deliver seamless performance on all Apple devices.",
            tech: ["Swift", "SwiftUI", "Xcode", "TestFlight"],
            icon: "ri-apple-fill",
            color: "slate"
        },
        {
            title: "Android Development",
            description: "Robust Android apps built with Kotlin to reach the widest possible global audience.",
            tech: ["Kotlin", "Jetpack Compose", "Android Studio"],
            icon: "ri-android-fill",
            color: "green"
        },
        {
            title: "Cross-Platform (Flutter)",
            description: "Build once, deploy everywhere. High-fidelity apps for iOS and Android using a single codebase.",
            tech: ["Flutter", "Dart", "Firebase", "GetX"],
            icon: "ri-flutter-fill",
            color: "blue"
        },
        {
            title: "React Native",
            description: "Leverage your web team's skills to build native mobile experiences using React.",
            tech: ["React Native", "Expo", "Redux", "NativeBase"],
            icon: "ri-reactjs-line",
            color: "cyan"
        }
    ];

    const serviceSchema = {
        "@context": "https://schema.org",
        "@type": "Service",
        "name": "Mobile App Development",
        "provider": { "@type": "Organization", "name": "Nexspire Solutions", "url": "https://nexspiresolutions.co.in" },
        "description": "Expert mobile app development services for iOS and Android using Swift, Kotlin, Flutter, and React Native.",
        "areaServed": "Global"
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-purple-600 selection:text-white">
            <Helmet>
                <title>Mobile App Development Services | iOS & Android</title>
                <meta name="description" content="Create engaging native and cross-platform mobile apps with Nexspire. Expert Flutter, React Native, and Swift developers." />
                <link rel="canonical" href="https://nexspiresolutions.co.in/services/mobile-app-development" />
                <script type="application/ld+json">{JSON.stringify(serviceSchema)}</script>
            </Helmet>

            <motion.div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 to-pink-600 origin-left z-50" style={{ scaleX }} />

            {/* Hero Section */}
            <section className="relative pt-32 pb-24 overflow-hidden bg-slate-900 text-white rounded-b-[3rem] shadow-2xl z-20">
                {/* Hero Background Image */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1551650975-87deedd944c3?q=80&w=1974&auto=format&fit=crop"
                        alt="Mobile Development Background"
                        className="w-full h-full object-cover opacity-50 transform scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 via-slate-900/80 to-slate-900"></div>
                </div>

                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light z-1"></div>

                <div className="container-custom relative z-10">
                    <div className="max-w-4xl">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8">
                            <i className="ri-smartphone-line text-purple-400"></i>
                            <span className="text-sm font-medium text-purple-100">Mobile Engineering</span>
                        </motion.div>

                        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-5xl md:text-7xl font-bold mb-8 tracking-tight leading-tight">
                            Apps That Users <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-red-400">Actually Love.</span>
                        </motion.h1>

                        <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-xl text-gray-400 max-w-2xl leading-relaxed mb-10">
                            From native iOS/Android to high-performance cross-platform solutions, we build mobile experiences that drive engagement and retention.
                        </motion.p>

                        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-wrap gap-4">
                            <Link to="/contact" className="inline-flex items-center gap-3 px-8 py-4 bg-purple-600 hover:bg-purple-500 rounded-full text-lg font-bold transition-all shadow-lg hover:shadow-purple-500/25">
                                Discuss Your App
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
                            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-slate-900">Mobile First. <br /> User Centric.</h2>
                            <p className="text-lg text-slate-600 leading-relaxed mb-6">
                                With billions of smartphone users worldwide, a mobile presence is no longer optional. But simply having an app isn't enough—it needs to be fast, intuitive, and flawless.
                            </p>
                            <ul className="space-y-4 mt-8">
                                {[
                                    "Seamless UI/UX Design",
                                    "Offline Functionality",
                                    "Push Notification Strategy",
                                    "Secure Biometric Auth"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                                        <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
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
                                    src="https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&q=80&w=800"
                                    alt="Mobile UI Design"
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
                                <div className="absolute bottom-6 left-6 text-white font-bold text-lg">Intuitive Interfaces</div>
                            </div>

                            {/* Top Small Image */}
                            <div className="relative group overflow-hidden rounded-[2rem] shadow-xl">
                                <img
                                    src="https://images.unsplash.com/photo-1555774698-0b77e0d5fac6?auto=format&fit=crop&q=80&w=800"
                                    alt="Phone Mockup"
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-purple-600/20 mix-blend-overlay"></div>
                            </div>

                            {/* Bottom Small Image with Stat */}
                            <div className="relative bg-purple-600 rounded-[2rem] shadow-xl flex flex-col items-center justify-center text-white p-6 text-center group overflow-hidden">
                                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light"></div>
                                <div className="relative z-10">
                                    <div className="text-4xl font-bold mb-1">4.8</div>
                                    <div className="text-sm text-purple-100 font-medium">Avg App Store Rating</div>
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
                        <span className="text-purple-600 font-bold tracking-widest uppercase text-sm">Tech Stack</span>
                        <h2 className="text-4xl font-bold mt-2 text-slate-900">Native & Cross-Platform</h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {capabilities.map((cap, i) => (
                            <FadeIn key={i} delay={i * 0.1} className="group p-8 rounded-[2rem] bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-xl hover:shadow-purple-200/50 hover:-translate-y-1 transition-all duration-300">
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
                    <RelatedServices currentService="Mobile App Development" />
                </div>
                <div className="mt-20">
                    <AreasWeServe />
                </div>
            </div>

            {/* Final CTA */}
            <section className="py-24 bg-slate-900 text-white text-center">
                <div className="container-custom">
                    <h2 className="text-4xl md:text-5xl font-bold mb-8">Have an App Idea?</h2>
                    <p className="text-slate-400 mb-10 text-lg max-w-xl mx-auto">From MVP to App Store launch, we handle the entire lifecycle.</p>
                    <Link to="/contact" className="inline-flex items-center gap-3 px-10 py-5 bg-white text-slate-900 rounded-full text-lg font-bold hover:scale-105 transition-transform">
                        Launch Your App
                    </Link>
                </div>
            </section>
        </div>
    );
};

export default MobileAppDevelopment;
