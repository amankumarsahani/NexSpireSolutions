import { useState, useMemo } from 'react';
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

const projects = [
    {
        id: 1,
        title: "E-commerce Platform",
        slug: "e-commerce-platform-us-retailer",
        category: "Web",
        image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=1200&q=80&fm=webp",
        description: "Custom Magento store with UX redesign for a US-based retailer.",
        tags: ["Magento", "UX/UI", "E-commerce"]
    },
    {
        id: 2,
        title: "HealthTech Mobile App",
        slug: "healthtech-mobile-app-uk",
        category: "Mobile",
        image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80&fm=webp",
        description: "Flutter-based patient engagement app with real-time analytics.",
        tags: ["Flutter", "Healthcare", "Analytics"]
    },
    {
        id: 3,
        title: "AI-Powered CRM",
        slug: "ai-powered-crm-australia",
        category: "Dashboard",
        image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80&fm=webp",
        description: "Custom CRM with predictive lead scoring and automated workflows.",
        tags: ["AI/ML", "Python", "React"]
    },
    {
        id: 4,
        title: "Urban Pulse",
        slug: "urban-pulse",
        category: "Mobile",
        image: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=1200&q=80&fm=webp",
        description: "City guide app with augmented reality navigation and social features.",
        tags: ["Flutter", "ARKit", "Firebase"]
    },
    {
        id: 5,
        title: "Crypto Exchange",
        slug: "crypto-exchange",
        category: "Web",
        image: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=800&q=80&fm=webp",
        description: "Secure cryptocurrency trading platform with advanced charting.",
        tags: ["Vue.js", "WebSockets", "Go"]
    },
    {
        id: 6,
        title: "EcoEnergy Dashboard",
        slug: "ecoenergy",
        category: "Dashboard",
        image: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&q=80&fm=webp",
        description: "Smart home energy monitoring dashboard for sustainable living.",
        tags: ["React", "IoT", "AWS"]
    }
];

const filters = ["All", "Web", "Mobile", "Dashboard"];

const PortfolioPage = () => {
    const [activeFilter, setActiveFilter] = useState('All');

    const filteredProjects = useMemo(
        () => activeFilter === 'All' ? projects : projects.filter(p => p.category === activeFilter),
        [activeFilter]
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800 selection:bg-blue-600 selection:text-white">
            <Helmet>
                <title>Portfolio - Custom Software Case Studies | Nexspire Solutions</title>
                <meta name="description" content="Explore our portfolio of successful projects including E-commerce platforms, HealthTech apps, and AI-Powered CRM systems." />
                <link rel="canonical" href={`${SITE_URL}/portfolio`} />
                <meta property="og:title" content="Portfolio - Custom Software Case Studies | Nexspire Solutions" />
                <meta property="og:description" content="See how we've helped businesses worldwide with custom software solutions." />
                <meta property="og:type" content="website" />
                <meta property="og:url" content={`${SITE_URL}/portfolio`} />
                <meta property="og:image" content={`${SITE_URL}/og-image.jpg`} />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="Portfolio - Custom Software Case Studies | Nexspire Solutions" />
                <meta name="twitter:description" content="See how we've helped businesses worldwide with custom software solutions." />
                <script type="application/ld+json">{JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "ItemList",
                    "name": "Nexspire Solutions Portfolio",
                    "url": `${SITE_URL}/portfolio`,
                    "numberOfItems": projects.length,
                    "itemListElement": projects.map((p, i) => ({
                        "@type": "ListItem",
                        "position": i + 1,
                        "name": p.title
                    }))
                })}</script>
            </Helmet>

            <ReadingProgress />

            {/* Hero */}
            <section className="pt-32 pb-16 lg:pt-40 lg:pb-20 bg-white">
                <div className="container-custom">
                    <Breadcrumbs />
                    <FadeIn>
                        <h1 className="font-serif text-5xl lg:text-6xl text-slate-900 tracking-tight mt-8 mb-6">
                            Our Work
                        </h1>
                    </FadeIn>
                    <FadeIn delay={0.1}>
                        <p className="text-lg lg:text-xl text-slate-500 max-w-2xl leading-relaxed">
                            A selection of projects we&apos;ve shipped. Each one started with a conversation
                            and ended with measurable results.
                        </p>
                    </FadeIn>
                </div>
            </section>

            {/* Filter + Grid */}
            <section className="py-24 lg:py-32">
                <div className="container-custom">
                    {/* Filters */}
                    <FadeIn>
                        <div className="flex flex-wrap gap-3 mb-16">
                            {filters.map(filter => (
                                <button
                                    key={filter}
                                    onClick={() => setActiveFilter(filter)}
                                    className={`px-5 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                                        activeFilter === filter
                                            ? 'bg-[#2563EB] text-white'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    {filter}
                                </button>
                            ))}
                        </div>
                    </FadeIn>

                    {/* Asymmetric Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8">
                        {filteredProjects.map((project, index) => {
                            // Alternating layout: large-small / small-large
                            const isEvenPair = Math.floor(index / 2) % 2 === 0;
                            const isFirst = index % 2 === 0;
                            const span = (isEvenPair && isFirst) || (!isEvenPair && !isFirst)
                                ? 'md:col-span-7' : 'md:col-span-5';

                            return (
                                <FadeIn key={project.id} className={span} delay={index * 0.05}>
                                    <Link to={`/portfolio/${project.slug}`} className="block group">
                                        <div className="overflow-hidden rounded-xl">
                                            <img
                                                src={project.image}
                                                alt={project.title}
                                                loading="lazy"
                                                className="w-full aspect-[4/3] object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                                            />
                                        </div>
                                        <div className="mt-4">
                                            <h3 className="font-serif text-xl text-slate-900 group-hover:text-[#2563EB] transition-colors duration-200">
                                                {project.title}
                                            </h3>
                                            <p className="text-slate-500 text-sm mt-1 leading-relaxed">
                                                {project.description}
                                            </p>
                                            <div className="flex flex-wrap gap-2 mt-3">
                                                {project.tags.map(tag => (
                                                    <span key={tag} className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded text-xs">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </Link>
                                </FadeIn>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-24 lg:py-32 border-t border-slate-200">
                <div className="container-custom text-center">
                    <FadeIn>
                        <p className="font-serif text-3xl lg:text-4xl text-slate-900 mb-8">
                            Have a project in mind?
                        </p>
                        <Link
                            to="/contact"
                            className="inline-flex items-center gap-2 text-[#2563EB] font-medium text-lg hover:text-[#1D4ED8] transition-colors duration-200"
                        >
                            Let&apos;s talk
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

export default PortfolioPage;
