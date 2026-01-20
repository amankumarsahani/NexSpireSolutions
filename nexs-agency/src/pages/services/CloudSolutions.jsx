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

const CloudSolutions = () => {
    useEffect(() => { window.scrollTo(0, 0); }, []);
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

    const capabilities = [
        {
            title: "Cloud Migration",
            description: "Seamlessly move your legacy infrastructure to the cloud with zero downtime strategies.",
            tech: ["AWS Migration Hub", "Azure Migrate", "VMware"],
            icon: "ri-upload-cloud-2-line",
            color: "blue"
        },
        {
            title: "DevOps Automation",
            description: "Accelerate delivery with CI/CD pipelines, Infrastructure as Code, and automated testing.",
            tech: ["Jenkins", "GitHub Actions", "Terraform", "Ansible"],
            icon: "ri-loop-right-line",
            color: "orange"
        },
        {
            title: "Serverless Architecture",
            description: "Reduce costs and operational overhead by moving to event-driven, serverless computing.",
            tech: ["AWS Lambda", "Azure Functions", "Google Cloud Run"],
            icon: "ri-server-line",
            color: "purple"
        },
        {
            title: "Cloud Security",
            description: "Implement banking-grade security, compliance monitoring, and identity management.",
            tech: ["IAM", "WAF", "Shield", "CloudTrail"],
            icon: "ri-shield-check-line",
            color: "cyan"
        }
    ];

    const serviceSchema = {
        "@context": "https://schema.org",
        "@type": "Service",
        "name": "Cloud Solutions & DevOps",
        "provider": { "@type": "Organization", "name": "Nexspire Solutions", "url": "https://nexspiresolutions.co.in" },
        "description": "Expert Cloud and DevOps services. AWS, Azure, Google Cloud migration and management.",
        "areaServed": "Global"
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-cyan-600 selection:text-white">
            <Helmet>
                <title>Cloud Solutions & DevOps Services | AWS & Azure Experts</title>
                <meta name="description" content="Scale your business with expert Cloud and DevOps services from Nexspire. Security, migration, and automation on AWS, Azure, and GCP." />
                <link rel="canonical" href="https://nexspiresolutions.co.in/services/cloud-solutions" />
                <script type="application/ld+json">{JSON.stringify(serviceSchema)}</script>
            </Helmet>

            <motion.div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-500 origin-left z-50" style={{ scaleX }} />

            {/* Hero Section */}
            <section className="relative pt-32 pb-24 overflow-hidden bg-slate-900 text-white rounded-b-[3rem] shadow-2xl z-20">
                {/* Hero Background Image */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop"
                        alt="Background"
                        className="w-full h-full object-cover opacity-50 transform scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 via-slate-900/80 to-slate-900"></div>
                </div>

                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light z-1"></div>

                <div className="container-custom relative z-10">
                    <div className="max-w-4xl">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8">
                            <i className="ri-cloud-windy-line text-cyan-400"></i>
                            <span className="text-sm font-medium text-cyan-100">Cloud Infrastructure</span>
                        </motion.div>

                        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-5xl md:text-7xl font-bold mb-8 tracking-tight leading-tight">
                            Scale Without <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400">Limits.</span>
                        </motion.h1>

                        <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-xl text-gray-400 max-w-2xl leading-relaxed mb-10">
                            Build, deploy, and manage your applications with the speed and reliability of modern cloud infrastructure.
                        </motion.p>

                        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-wrap gap-4">
                            <Link to="/contact" className="inline-flex items-center gap-3 px-8 py-4 bg-cyan-600 hover:bg-cyan-500 rounded-full text-lg font-bold transition-all shadow-lg hover:shadow-cyan-500/25">
                                Plan Your Migration
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
                            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-slate-900">Agility. Security. <br /> Cost Efficiency.</h2>
                            <p className="text-lg text-slate-600 leading-relaxed mb-6">
                                The cloud isn't just a place to store data; it's an innovation engine. We help you leverage the full power of AWS, Azure, and GCP to build resilient systems that grow with your business.
                            </p>
                            <ul className="space-y-4 mt-8">
                                {[
                                    "99.99% Uptime Architectures",
                                    "Auto-Scaling Infrastructure",
                                    "Disaster Recovery Planning",
                                    "Cost Optimization Audits"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                                        <div className="w-6 h-6 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600">
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
                                    src="https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&q=80&w=800"
                                    alt="Server Room"
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
                                <div className="absolute bottom-6 left-6 text-white font-bold text-lg">Secure Infrastructure</div>
                            </div>

                            {/* Top Small Image */}
                            <div className="relative group overflow-hidden rounded-[2rem] shadow-xl">
                                <img
                                    src="https://images.unsplash.com/photo-1667372393119-c85c020799a3?auto=format&fit=crop&q=80&w=800"
                                    alt="Cloud Data"
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-cyan-600/20 mix-blend-overlay"></div>
                            </div>

                            {/* Bottom Small Image with Stat */}
                            <div className="relative bg-cyan-600 rounded-[2rem] shadow-xl flex flex-col items-center justify-center text-white p-6 text-center group overflow-hidden">
                                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light"></div>
                                <div className="relative z-10">
                                    <div className="text-4xl font-bold mb-1">99.9%</div>
                                    <div className="text-sm text-cyan-100 font-medium">Uptime SLA</div>
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
                        <span className="text-cyan-600 font-bold tracking-widest uppercase text-sm">Our Expertise</span>
                        <h2 className="text-4xl font-bold mt-2 text-slate-900">DevOps & Cloud</h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {capabilities.map((cap, i) => (
                            <FadeIn key={i} delay={i * 0.1} className="group p-8 rounded-[2rem] bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-xl hover:shadow-cyan-200/50 hover:-translate-y-1 transition-all duration-300">
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
                    <RelatedServices currentService="Cloud Solutions" />
                </div>
                <div className="mt-20">
                    <AreasWeServe />
                </div>
            </div>

            {/* Final CTA */}
            <section className="py-24 bg-slate-900 text-white text-center">
                <div className="container-custom">
                    <h2 className="text-4xl md:text-5xl font-bold mb-8">Ready to Migrate?</h2>
                    <p className="text-slate-400 mb-10 text-lg max-w-xl mx-auto">Optimize your cloud infrastructure for speed, security, and cost.</p>
                    <Link to="/contact" className="inline-flex items-center gap-3 px-10 py-5 bg-white text-slate-900 rounded-full text-lg font-bold hover:scale-105 transition-transform">
                        Get Your Free Audit
                    </Link>
                </div>
            </section>
        </div>
    );
};

export default CloudSolutions;
