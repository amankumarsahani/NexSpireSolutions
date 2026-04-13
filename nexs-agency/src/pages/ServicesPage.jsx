import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import RelatedServices from '../components/seo/RelatedServices';
import AreasWeServe from '../components/seo/AreasWeServe';
import ProcessSection from '../components/ProcessSection';
import ClientLogos from '../components/ClientLogos';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import BackToTop from '../components/ui/BackToTop';
import ReadingProgress from '../components/ui/ReadingProgress';
import { SITE_URL } from '../constants/siteConfig';

// Refined Premium Styles
const serviceStyles = {
    blue: {
        gradient: "from-[#6D28D9] to-[#5B21B6]",
        shadow: "shadow-lg",
        text: "text-[#6D28D9]",
        bg: "bg-[#FAF9F6]",
        icon: "text-[#6D28D9]"
    },
    purple: {
        gradient: "from-[#6D28D9] to-[#5B21B6]",
        shadow: "shadow-lg",
        text: "text-[#6D28D9]",
        bg: "bg-[#FAF9F6]",
        icon: "text-purple-500"
    },
    emerald: {
        gradient: "from-emerald-500 to-teal-600",
        shadow: "shadow-lg",
        text: "text-emerald-600",
        bg: "bg-emerald-50",
        icon: "text-emerald-500"
    },
    orange: {
        gradient: "from-orange-500 to-red-600",
        shadow: "shadow-orange-500/20",
        text: "text-orange-600",
        bg: "bg-orange-50",
        icon: "text-orange-500"
    },
    cyan: {
        gradient: "from-[#6D28D9] to-[#5B21B6]",
        shadow: "shadow-lg",
        text: "text-cyan-600",
        bg: "bg-cyan-50",
        icon: "text-cyan-500"
    }
};

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

const ServiceCard = ({ service, index }) => {
    const styles = serviceStyles[service.color] || serviceStyles.blue;

    return (
        <Link to={service.link} className="block h-full group perspective-1000">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative h-full bg-white rounded-[2rem] p-8 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 border border-slate-100 overflow-hidden"
            >
                {/* Gradient Blob Background Effect */}
                <div className={`absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-br ${styles.gradient} opacity-[0.08] blur-3xl rounded-full group-hover:opacity-15 transition-opacity duration-500`}></div>

                {/* Icon Container */}
                <div className="relative mb-8 inline-block">
                    <div className={`relative z-10 w-20 h-20 rounded-2xl ${styles.bg} flex items-center justify-center text-3xl ${styles.icon} transition-transform duration-500 group- group-hover:rotate-3 shadow-sm`}>
                        <i className={service.icon}></i>
                    </div>
                    <div className={`absolute inset-0 bg-gradient-to-br ${styles.gradient} opacity-20 blur-xl rounded-2xl transform scale-0 group-hover:scale-125 transition-transform duration-500`}></div>
                </div>

                {/* Content */}
                <div className="relative z-10">
                    <h3 className="text-2xl font-bold text-slate-800 mb-4 group-hover:text-[#6D28D9] transition-all duration-300">
                        <span>
                            {service.title}
                        </span>
                    </h3>

                    <div className="mb-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold bg-white border border-slate-200 shadow-sm ${styles.text}`}>
                            Starts from <span className="font-bold">{service.price}</span>
                        </span>
                    </div>

                    <p className="text-slate-600 leading-relaxed mb-8 min-h-[4.5rem]">
                        {service.description}
                    </p>

                    {/* Features List */}
                    <div className="space-y-4 mb-8">
                        {service.features.map((feature, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                                <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${styles.gradient}`}></div>
                                <span className="text-sm font-medium text-slate-500 group-hover:text-slate-600 transition-colors">
                                    {feature}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* CTA Button */}
                    <div className="flex items-center text-sm font-bold mt-auto group/btn">
                        <span className={`text-[#6D28D9] mr-2`}>
                            Explore Service
                        </span>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-[#FAF9F6] group-hover/btn:bg-gray-100 transition-colors`}>
                            <i className={`ri-arrow-right-line ${styles.text} group-hover/btn:translate-x-1 transition-transform`}></i>
                        </div>
                    </div>
                </div>
            </motion.div>
        </Link>
    );
};

const ServicesPage = () => {

    const services = [
        {
            title: "Custom Web Development",
            description: "Enterprise-grade web applications built with React, Next.js, and scaling architectures for maximum performance.",
            icon: "ri-layout-masonry-line",
            color: "blue",
            link: "/services/custom-web-development",
            features: ["Scalable SaaS Platforms", "Progressive Web Apps (PWA)", "High-Performance APIs"],
            price: "$2,999"
        },
        {
            title: "Mobile App Development",
            description: "Native and cross-platform mobile experiences that engage users and drive retention across iOS and Android.",
            icon: "ri-smartphone-line",
            color: "purple",
            link: "/services/mobile-app-development",
            features: ["iOS & Android Native", "Flutter & React Native", "App Store Optimization"],
            price: "$4,999"
        },
        {
            title: "AI & Machine Learning",
            description: "Intelligent solutions that automate workflows, predict trends, and unlock deep insights from your data.",
            icon: "ri-brain-line",
            color: "emerald",
            link: "/services/ai-machine-learning",
            features: ["Predictive Analytics", "NLP / Chatbots", "Computer Vision Systems"],
            price: "$5,999"
        },
        {
            title: "Cloud Solutions",
            description: "Secure, scalable cloud infrastructure design and DevOps automation to accelerate your shipment cycles.",
            icon: "ri-cloud-windy-line",
            color: "cyan",
            link: "/services/cloud-solutions",
            features: ["AWS/Azure Architecture", "Cloud Migration Strategy", "DevOps & CI/CD Pipelines"],
            price: "$1,999/mo"
        },
        {
            title: "E-Commerce",
            description: "High-conversion online stores and marketplaces designed to maximize sales and simplify management.",
            icon: "ri-shopping-cart-2-line",
            color: "orange",
            link: "/services/ecommerce-development",
            features: ["Shopify & WooCommerce", "Multi-vendor Marketplaces", "Secure Payment Gateways"],
            price: "$3,499"
        }
    ];

    const stats = [
        { label: "Projects Delivered", value: "150+" },
        { label: "Client Retention", value: "95%" },
        { label: "Years Experience", value: "5+" },
        { label: "Global Clients", value: "12+" }
    ];

    return (
        <div className="min-h-screen bg-[#FDFDFD] font-sans text-slate-800 selection:bg-blue-600 selection:text-white">
            <Helmet>
                <title>Our Services - Web, Mobile, AI & Cloud | Nexspire Solutions</title>
                <meta name="description" content="Explore our comprehensive software development services. From custom web and mobile apps to AI integration and cloud solutions." />
                <link rel="canonical" href={`${SITE_URL}/services`} />
                <meta property="og:title" content="Our Services - Web, Mobile, AI & Cloud | Nexspire Solutions" />
                <meta property="og:description" content="Explore our comprehensive software development services. From custom web and mobile apps to AI integration and cloud solutions." />
                <meta property="og:type" content="website" />
                <meta property="og:url" content={`${SITE_URL}/services`} />
                <meta property="og:image" content={`${SITE_URL}/og-image.jpg`} />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="Our Services - Web, Mobile, AI & Cloud | Nexspire Solutions" />
                <meta name="twitter:description" content="Explore our comprehensive software development services. From custom web and mobile apps to AI integration and cloud solutions." />
                <script type="application/ld+json">{JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "ItemList",
                    "name": "Nexspire Solutions Services",
                    "url": `${SITE_URL}/services`,
                    "numberOfItems": 5,
                    "itemListElement": [
                        { "@type": "ListItem", "position": 1, "name": "Custom Web Development", "url": `${SITE_URL}/services/custom-web-development` },
                        { "@type": "ListItem", "position": 2, "name": "Mobile App Development", "url": `${SITE_URL}/services/mobile-app-development` },
                        { "@type": "ListItem", "position": 3, "name": "AI & Machine Learning", "url": `${SITE_URL}/services/ai-machine-learning` },
                        { "@type": "ListItem", "position": 4, "name": "Cloud Solutions", "url": `${SITE_URL}/services/cloud-solutions` },
                        { "@type": "ListItem", "position": 5, "name": "E-commerce Development", "url": `${SITE_URL}/services/ecommerce-development` }
                    ]
                })}</script>
            </Helmet>

            {/* Scroll Progress Bar */}
            <ReadingProgress />

            {/* Hero Section */}
            <section className="relative pt-32 pb-24 overflow-hidden bg-slate-900 text-white rounded-b-[3rem] shadow-2xl z-20">
                {/* Background Image */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=2070&auto=format&fit=crop&fm=webp"
                        alt="Services Hero"
                        loading="lazy"
                        className="w-full h-full object-cover opacity-50 transform scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 via-slate-900/80 to-slate-900"></div>
                </div>

                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light"></div>
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 animate-pulse"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2"></div>

                <div className="container-custom relative z-10 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8"
                    >
                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                        <span className="text-sm font-medium text-blue-100">Engineering Excellence</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-5xl md:text-7xl font-bold mb-8 tracking-tight leading-tight"
                    >
                        We Engineer <span className="text-[#D97706]">Digital Growth</span> <br className="hidden md:block" />
                        For Global Brands.
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="max-w-2xl mx-auto text-xl text-slate-400 leading-relaxed mb-12"
                    >
                        Strategic software solutions that solve complex business problems. Built for scale, security, and performance.
                    </motion.p>
                </div>
            </section>

            {/* Stats Bar */}
            <section className="relative -mt-12 z-30 px-6 mb-20">
                <div className="container-custom">
                    <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-8 md:p-10 border border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-8 backdrop-blur-xl">
                        {stats.map((stat, i) => (
                            <div key={i} className="text-center group cursor-default">
                                <div className="text-4xl md:text-5xl font-bold text-slate-900 group-hover:text-[#6D28D9] transition-colors duration-300 mb-2 font-display">
                                    {stat.value}
                                </div>
                                <div className="text-slate-500 font-medium text-xs md:text-sm uppercase tracking-widest">
                                    {stat.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Services Grid */}
            <section className="py-20 relative">
                <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
                <div className="container-custom relative z-10">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">Our Core Capabilities</h2>
                        <p className="text-slate-500 max-w-2xl mx-auto">Providing end-to-end development services to help you scale your business.</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {services.map((service, index) => (
                            <ServiceCard key={index} service={service} index={index} />
                        ))}
                    </div>
                </div>
            </section>

            {/* Process Section */}
            <ProcessSection />

            {/* Client Logos */}
            <ClientLogos />

            {/* Tech Stack Marquee */}
            <section className="py-20 bg-slate-50 border-y border-slate-100 overflow-hidden">
                <div className="text-center mb-10">
                    <h2 className="text-lg font-semibold text-slate-400 uppercase tracking-widest">Trusted Technology Stack</h2>
                </div>
                <div className="flex animate-marquee gap-16 whitespace-nowrap opacity-50 hover:opacity-80 transition-opacity">
                    {[
                        "React", "Next.js", "Node.js", "Python", "AWS", "Docker", "Kubernetes", "Flutter",
                        "React", "Next.js", "Node.js", "Python", "AWS", "Docker", "Kubernetes", "Flutter"
                    ].map((tech, i) => (
                        <span key={i} className="text-5xl font-bold text-slate-300 pointer-events-none select-none font-display">
                            {tech}
                        </span>
                    ))}
                </div>
            </section>

            {/* SEO Internal Linking Components */}
            <div className="bg-white py-24">
                <div className="container-custom">
                    <div className="mb-20">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-bold">Related Capabilities</h2>
                            <Link to="/services" className="text-[#6D28D9] font-medium hover:underline">View All Services</Link>
                        </div>
                        <RelatedServices currentService="Services Overview" />
                    </div>
                </div>
            </div>

            {/* Global Markets Section - Full Width */}
            <AreasWeServe />

            {/* CTA */}
            <section className="py-32 bg-slate-900 text-white text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                {/* Animated Rings */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-white/5 rounded-full animate-[spin_10s_linear_infinite]"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-white/5 rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>

                <div className="container-custom relative z-10">
                    <h2 className="text-5xl md:text-7xl font-bold mb-8 tracking-tight">Ready to Scale?</h2>
                    <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto">
                        Book a free 30-minute consultation with our technical team.
                    </p>
                    <Link to="/contact" className="group inline-flex items-center gap-3 px-10 py-5 bg-white text-slate-900 rounded-full text-lg font-bold transition-all  shadow-2xl hover:shadow-white/20">
                        Get Your Free Quote
                        <i className="ri-arrow-right-line group-hover:translate-x-1 transition-transform"></i>
                    </Link>
                </div>
            </section>

            {/* Back to Top */}
            <BackToTop />
        </div>
    );
};

export default ServicesPage;
