import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import BackToTop from '../components/ui/BackToTop';
import ReadingProgress from '../components/ui/ReadingProgress';
import { SITE_URL } from '../constants/siteConfig';

const FadeIn = ({ children, className, delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5, delay, ease: "easeOut" }}
        className={className}
    >
        {children}
    </motion.div>
);

const services = [
    {
        title: "Custom Web Development",
        description: "Enterprise-grade web applications built with modern frameworks and scaling architectures. We craft performant, accessible interfaces that serve millions — from SaaS platforms to internal tools.",
        link: "/services/custom-web-development",
        capabilities: [
            "Scalable SaaS Platforms",
            "Progressive Web Apps",
            "High-Performance APIs",
            "Headless CMS Integration",
            "Real-Time Dashboards"
        ]
    },
    {
        title: "Mobile App Development",
        description: "Native and cross-platform mobile experiences designed for engagement and retention. We build apps that feel right on every device, from first tap to thousandth session.",
        link: "/services/mobile-app-development",
        capabilities: [
            "iOS & Android Native",
            "Flutter & React Native",
            "App Store Optimization",
            "Push Notification Systems",
            "Offline-First Architecture"
        ]
    },
    {
        title: "AI & Machine Learning",
        description: "Intelligent systems that automate decisions, surface insights, and create competitive advantage. We turn raw data into business-critical intelligence.",
        link: "/services/ai-machine-learning",
        capabilities: [
            "Predictive Analytics",
            "Natural Language Processing",
            "Computer Vision Systems",
            "Recommendation Engines",
            "Custom Model Training"
        ]
    },
    {
        title: "Cloud Solutions",
        description: "Secure, scalable infrastructure design and DevOps automation that accelerates your shipping cadence. We architect for reliability, optimize for cost.",
        link: "/services/cloud-solutions",
        capabilities: [
            "AWS & Azure Architecture",
            "Cloud Migration Strategy",
            "CI/CD Pipeline Design",
            "Infrastructure as Code",
            "Cost Optimization"
        ]
    },
    {
        title: "E-Commerce Development",
        description: "High-conversion storefronts and marketplaces engineered to maximize revenue. From checkout flows to inventory systems, every detail is designed to sell.",
        link: "/services/ecommerce-development",
        capabilities: [
            "Shopify & WooCommerce",
            "Multi-Vendor Marketplaces",
            "Payment Gateway Integration",
            "Inventory Management",
            "Conversion Optimization"
        ]
    }
];

const ServicesPage = () => {
    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800 selection:bg-blue-600 selection:text-white">
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

            <ReadingProgress />

            {/* Hero */}
            <section className="pt-32 pb-16 lg:pt-40 lg:pb-20 bg-white">
                <div className="container-custom">
                    <Breadcrumbs />
                    <FadeIn>
                        <h1 className="font-serif text-5xl lg:text-6xl text-slate-900 tracking-tight mt-8 mb-6">
                            What We Do
                        </h1>
                    </FadeIn>
                    <FadeIn delay={0.1}>
                        <p className="text-lg lg:text-xl text-slate-500 max-w-2xl leading-relaxed">
                            Strategic software development for companies that need to move fast without
                            breaking things. We build, ship, and scale.
                        </p>
                    </FadeIn>
                </div>
            </section>

            {/* Services List */}
            <section className="py-24 lg:py-32">
                <div className="container-custom">
                    {services.map((service, index) => (
                        <FadeIn key={service.title} delay={index * 0.05}>
                            <Link
                                to={service.link}
                                className="block group"
                            >
                                <div className={`grid lg:grid-cols-2 gap-10 lg:gap-16 py-16 lg:py-20 ${
                                    index !== services.length - 1 ? 'border-b border-slate-200' : ''
                                }`}>
                                    {/* Left: Number + Title + Description */}
                                    <div>
                                        <span className="block font-serif text-8xl text-slate-200 leading-none mb-6 select-none">
                                            {String(index + 1).padStart(2, '0')}
                                        </span>
                                        <h2 className="font-serif text-2xl lg:text-3xl text-slate-900 mb-4 group-hover:text-[#2563EB] transition-colors duration-300">
                                            {service.title}
                                        </h2>
                                        <p className="text-slate-500 leading-relaxed max-w-lg">
                                            {service.description}
                                        </p>
                                    </div>

                                    {/* Right: Capabilities */}
                                    <div className="flex items-center">
                                        <ul className="space-y-4">
                                            {service.capabilities.map((cap) => (
                                                <li key={cap} className="flex items-center gap-3">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] shrink-0" />
                                                    <span className="text-slate-600 text-sm lg:text-base">
                                                        {cap}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </Link>
                        </FadeIn>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="py-24 lg:py-32 border-t border-slate-200">
                <div className="container-custom text-center">
                    <FadeIn>
                        <p className="font-serif text-3xl lg:text-4xl text-slate-900 mb-8">
                            Ready to start your project?
                        </p>
                        <Link
                            to="/contact"
                            className="inline-flex items-center gap-2 text-[#2563EB] font-medium text-lg hover:text-[#1D4ED8] transition-colors duration-200"
                        >
                            Get in touch
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </Link>
                    </FadeIn>
                </div>
            </section>

            <BackToTop />
        </div>
    );
};

export default ServicesPage;
