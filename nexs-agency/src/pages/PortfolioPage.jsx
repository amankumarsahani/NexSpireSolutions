import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, useScroll, useTransform, useSpring, useInView } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for tailwind class merging
function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const FadeIn = ({ children, className, delay = 0 }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.7, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
            className={className}
        >
            {children}
        </motion.div>
    );
};

const ProjectCard = ({ project, index }) => {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5 }}
            className={cn(
                "group relative rounded-[2rem] overflow-hidden cursor-pointer",
                project.size === 'large' ? 'md:col-span-2 md:row-span-2' :
                    project.size === 'wide' ? 'md:col-span-2' :
                        'md:col-span-1'
            )}
        >
            <div className="absolute inset-0 bg-gray-900/20 group-hover:bg-gray-900/0 transition-colors duration-500 z-10" />
            <img
                src={project.image}
                alt={project.title}
                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-out"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-100 transition-opacity duration-300 z-20 flex flex-col justify-end p-8">
                <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                    <div className="flex flex-wrap gap-2 mb-3">
                        {project.tags.map((tag, i) => (
                            <span key={i} className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-xs font-medium text-white">
                                {tag}
                            </span>
                        ))}
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-2">{project.title}</h3>
                    <p className="text-gray-300 line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                        {project.description}
                    </p>
                </div>
            </div>
        </motion.div>
    );
};

const PortfolioPage = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const [activeFilter, setActiveFilter] = useState('All');
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    const projects = [
        {
            id: 1,
            title: "NeoBank Finance",
            category: "Mobile App",
            image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=1200&q=80",
            size: "large",
            description: "A next-generation banking interface focusing on clarity, security, and speed.",
            tags: ["React Native", "Node.js", "Security"]
        },
        {
            id: 2,
            title: "Luxe Interiors",
            category: "Web Platform",
            image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&q=80",
            size: "small",
            description: "E-commerce platform for high-end furniture with AR visualization.",
            tags: ["Next.js", "WebGL", "Shopify"]
        },
        {
            id: 3,
            title: "HealthTrack AI",
            category: "Dashboard",
            image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80",
            size: "small",
            description: "Medical analytics dashboard for tracking patient vitals in real-time.",
            tags: ["React", "D3.js", "Python"]
        },
        {
            id: 4,
            title: "Urban Pulse",
            category: "Mobile App",
            image: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=1200&q=80",
            size: "wide",
            description: "City guide app with augmented reality navigation and social features.",
            tags: ["Flutter", "ARKit", "Firebase"]
        },
        {
            id: 5,
            title: "Crypto Exchange",
            category: "Web Platform",
            image: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=800&q=80",
            size: "small",
            description: "Secure and fast cryptocurrency trading platform with advanced charting.",
            tags: ["Vue.js", "WebSockets", "Go"]
        },
        {
            id: 6,
            title: "EcoEnergy",
            category: "Dashboard",
            image: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&q=80",
            size: "small",
            description: "Smart home energy monitoring dashboard for sustainable living.",
            tags: ["React", "IoT", "AWS"]
        }
    ];

    const filters = ["All", "Web Platform", "Mobile App", "Dashboard"];

    const filteredProjects = activeFilter === 'All'
        ? projects
        : projects.filter(p => p.category === activeFilter);

    return (
        <div className="min-h-screen bg-white font-sans text-gray-900 selection:bg-blue-600 selection:text-white">
            <Helmet>
                <title>Our Portfolio - Case Studies & Success Stories | Nexspire Solutions</title>
                <meta name="description" content="Browse our portfolio of successful projects. See how we've helped startups and enterprises launch award-winning web and mobile applications. Real results, real impact." />
                <meta name="keywords" content="software portfolio, case studies, web development projects, mobile app examples, fintech apps, healthcare software, e-commerce solutions, nexspire work, client success stories" />
                <link rel="canonical" href="https://nexspiresolutions.co.in/portfolio" />
                <meta property="og:title" content="Our Work - Digital Legacies We've Built" />
                <meta property="og:description" content="Explore our curated selection of high-impact digital products and transformations." />
                <meta property="og:url" content="https://nexspiresolutions.co.in/portfolio" />
            </Helmet>

            {/* Scroll Progress Bar */}
            <motion.div
                className="fixed top-0 left-0 right-0 h-1 bg-blue-600 origin-left z-50"
                style={{ scaleX }}
            />

            {/* Hero Section */}
            <section className="relative min-h-[85vh] flex items-center pt-20 overflow-hidden bg-gray-950 text-white">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1558655146-d09347e92766?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-30 mix-blend-soft-light"></div>
                <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-blue-900/30 to-transparent"></div>

                <div className="container-custom relative z-10">
                    <FadeIn>
                        <span className="inline-block py-2 px-4 rounded-full bg-white/10 border border-white/10 backdrop-blur-md text-sm font-medium mb-6">
                            Selected Works 2023-2024
                        </span>
                        <h1 className="text-6xl md:text-8xl font-bold tracking-tighter leading-tight mb-8">
                            We Create <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Digital Legacies.</span>
                        </h1>
                    </FadeIn>
                </div>
            </section>

            {/* Filter & Grid */}
            <section className="py-10 bg-gray-50 min-h-screen">
                <div className="container-custom">
                    {/* Filters */}
                    <div className="flex flex-wrap gap-4 mb-16 justify-center md:justify-start">
                        {filters.map(filter => (
                            <button
                                key={filter}
                                onClick={() => setActiveFilter(filter)}
                                className={cn(
                                    "px-6 py-3 rounded-full text-sm font-bold transition-all duration-300",
                                    activeFilter === filter
                                        ? "bg-gray-900 text-white shadow-lg scale-105"
                                        : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                                )}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>

                    {/* Masonry Grid */}
                    <motion.div
                        layout
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 auto-rows-[400px]"
                    >
                        {filteredProjects.map((project, index) => (
                            <ProjectCard key={project.id} project={project} index={index} />
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-32 bg-white text-center relative overflow-hidden">
                <div className="container-custom relative z-10">
                    <FadeIn>
                        <h2 className="text-5xl md:text-7xl font-bold mb-8 tracking-tighter">Have a vision?</h2>
                        <p className="text-xl text-gray-500 mb-12 max-w-2xl mx-auto">
                            Let's collaborate to turn your boldest ideas into reality. We are ready when you are.
                        </p>
                        <Link to="/contact" className="inline-flex items-center gap-4 px-12 py-6 bg-gray-900 text-white rounded-full text-xl font-bold hover:bg-blue-600 transition-all duration-300 group shadow-2xl">
                            Start a Project
                            <i className="ri-arrow-right-line group-hover:translate-x-2 transition-transform"></i>
                        </Link>
                    </FadeIn>
                </div>
            </section>
        </div>
    );
};

export default PortfolioPage;
