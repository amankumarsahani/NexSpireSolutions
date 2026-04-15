import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import BackToTop from '../components/ui/BackToTop';
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

const ProjectDetail = () => {
    const { slug } = useParams();

    // Placeholder project data — replace with API fetch in production
    const project = {
        title: slug?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || "Project Detail",
        category: "Web Development",
        description: "A detailed look at how we approached this project, the challenges involved, and the outcomes we delivered.",
        challenge: "The client faced scalability issues with their legacy system, resulting in slow load times and poor user experience during peak traffic. Their existing architecture couldn't handle the growth they were experiencing.",
        approach: "We re-architected the platform using a modern stack — React on the frontend, Node.js microservices on the backend, all deployed on AWS with auto-scaling. We took an iterative approach, shipping incrementally over 12 weeks.",
        result: "The new platform handles 10x the traffic with half the infrastructure cost. Page load times dropped from 4.2s to under 1s. The client saw a measurable improvement in user engagement and conversion within the first month.",
        technologies: ["React", "Node.js", "AWS", "MongoDB"],
        timeline: "12 weeks",
        image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=1200&q=80&fm=webp",
        metrics: [
            { label: "Faster Load Time", value: "300%" },
            { label: "User Retention", value: "+45%" },
            { label: "Infrastructure Cost", value: "-20%" }
        ]
    };

    return (
        <div className="min-h-screen bg-white font-sans text-slate-800 selection:bg-blue-600 selection:text-white">
            <Helmet>
                <title>{project.title} | Portfolio | Nexspire Solutions</title>
                <meta name="description" content={`Case study: ${project.title}. ${project.description}`} />
                <link rel="canonical" href={`${SITE_URL}/portfolio/${slug}`} />
                <meta property="og:title" content={`${project.title} | Portfolio | Nexspire Solutions`} />
                <meta property="og:description" content={`Case study: ${project.title}. ${project.description}`} />
                <meta property="og:type" content="website" />
                <meta property="og:url" content={`${SITE_URL}/portfolio/${slug}`} />
                <meta property="og:image" content={`${SITE_URL}/og-image.jpg`} />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={`${project.title} | Portfolio | Nexspire Solutions`} />
                <meta name="twitter:description" content={`Case study: ${project.title}. ${project.description}`} />
            </Helmet>

            {/* Header */}
            <section className="pt-32 pb-12 lg:pt-40 lg:pb-16">
                <div className="container-custom max-w-5xl">
                    <Breadcrumbs />
                    <FadeIn>
                        <p className="text-xs tracking-widest uppercase text-[#2563EB] font-medium mt-8 mb-4">
                            {project.category}
                        </p>
                        <h1 className="font-serif text-4xl lg:text-5xl text-slate-900 tracking-tight mb-4">
                            {project.title}
                        </h1>
                        <p className="text-lg text-slate-500 max-w-2xl leading-relaxed">
                            {project.description}
                        </p>
                    </FadeIn>
                </div>
            </section>

            {/* Hero Image */}
            <FadeIn delay={0.1}>
                <section className="pb-16">
                    <div className="container-custom max-w-5xl">
                        <div className="overflow-hidden rounded-xl">
                            <img
                                src={project.image}
                                alt={project.title}
                                loading="lazy"
                                className="w-full aspect-[16/9] object-cover"
                            />
                        </div>
                    </div>
                </section>
            </FadeIn>

            {/* Content */}
            <section className="py-16 lg:py-24">
                <div className="container-custom max-w-5xl">
                    <div className="grid lg:grid-cols-3 gap-16">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-16">
                            <FadeIn>
                                <div>
                                    <h2 className="font-serif text-2xl text-slate-900 mb-4">The Challenge</h2>
                                    <p className="text-slate-600 leading-relaxed">{project.challenge}</p>
                                </div>
                            </FadeIn>

                            <FadeIn>
                                <div>
                                    <h2 className="font-serif text-2xl text-slate-900 mb-4">Our Approach</h2>
                                    <p className="text-slate-600 leading-relaxed">{project.approach}</p>
                                </div>
                            </FadeIn>

                            <FadeIn>
                                <div>
                                    <h2 className="font-serif text-2xl text-slate-900 mb-4">The Result</h2>
                                    <p className="text-slate-600 leading-relaxed">{project.result}</p>
                                    <div className="grid grid-cols-3 gap-8 mt-8 pt-8 border-t border-slate-200">
                                        {project.metrics.map(m => (
                                            <div key={m.label}>
                                                <div className="text-2xl font-semibold text-slate-900">{m.value}</div>
                                                <div className="text-sm text-slate-500 mt-1">{m.label}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </FadeIn>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-10">
                            <FadeIn>
                                <div>
                                    <h3 className="text-xs tracking-widest uppercase text-slate-400 font-medium mb-4">Technologies</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {project.technologies.map(tech => (
                                            <span key={tech} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded text-sm">
                                                {tech}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </FadeIn>

                            <FadeIn delay={0.05}>
                                <div>
                                    <h3 className="text-xs tracking-widest uppercase text-slate-400 font-medium mb-4">Timeline</h3>
                                    <p className="text-slate-800">{project.timeline}</p>
                                </div>
                            </FadeIn>
                        </div>
                    </div>
                </div>
            </section>

            {/* Navigation */}
            <section className="py-16 border-t border-slate-200">
                <div className="container-custom max-w-5xl flex justify-between items-center">
                    <Link
                        to="/portfolio"
                        className="inline-flex items-center gap-2 text-slate-600 hover:text-[#2563EB] transition-colors duration-200"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                        </svg>
                        Back to all projects
                    </Link>
                    <Link
                        to="/contact"
                        className="inline-flex items-center gap-2 text-[#2563EB] font-medium hover:text-[#1D4ED8] transition-colors duration-200"
                    >
                        Start a project
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </Link>
                </div>
            </section>

            <BackToTop />
        </div>
    );
};

export default ProjectDetail;
