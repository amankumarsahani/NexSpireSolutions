import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import BackToTop from '../components/ui/BackToTop';
import RelatedServices from '../components/seo/RelatedServices';

const ProjectDetail = () => {
    const { slug } = useParams();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Placeholder data since we might not have a full backend for projects yet
    // In a real app, fetch from API based on slug
    const project = {
        title: slug?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || "Project Detail",
        category: "Web Development",
        client: "Global Client",
        description: "This is a detailed overview of the project. We helped the client achieve significant growth through custom software solutions.",
        challenge: "The client faced scalability issues with their legacy system, resulting in slow load times and poor user experience during peak traffic.",
        solution: "We re-architected the entire platform using Next.js and Node.js, implementing a microservices architecture that can scale elastically.",
        results: [
            { label: "Performance", value: "300% Faster" },
            { label: "User Retention", value: "+45%" },
            { label: "Cost Reduction", value: "-20%" }
        ],
        technologies: ["React", "Node.js", "AWS", "MongoDB"],
        image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=1200&q=80",
        testimonial: {
            text: "Nexspire transformed our digital presence. The team is incredibly talented and delivered beyond our expectations.",
            author: "Jane Doe, CTO"
        }
    };

    return (
        <div className="min-h-screen bg-white font-sans text-gray-900 selection:bg-blue-600 selection:text-white">
            <Helmet>
                <title>{project.title} | Portfolio | Nexspire Solutions</title>
                <meta name="description" content={`Case study: ${project.title}. See how we delivered exceptional results.`} />
            </Helmet>

            {/* Breadcrumbs */}
            <div className="container-custom pt-24 pb-4">
                <Breadcrumbs />
            </div>

            {/* Hero */}
            <section className="py-12">
                <div className="container-custom">
                    <span className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-bold mb-6">
                        {project.category}
                    </span>
                    <h1 className="text-4xl md:text-6xl font-bold mb-8 max-w-4xl">
                        {project.title}
                    </h1>
                    <div className="rounded-[2rem] overflow-hidden shadow-2xl h-[50vh] md:h-[70vh]">
                        <img
                            src={project.image}
                            alt={project.title}
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>
            </section>

            {/* Content & Sidebar Layout */}
            <section className="py-16">
                <div className="container-custom">
                    <div className="grid lg:grid-cols-3 gap-16">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-12">
                            <div>
                                <h2 className="text-2xl font-bold mb-4">The Challenge</h2>
                                <p className="text-gray-600 text-lg leading-relaxed">{project.challenge}</p>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold mb-4">Our Solution</h2>
                                <p className="text-gray-600 text-lg leading-relaxed">{project.solution}</p>
                            </div>

                            {/* Quote */}
                            <div className="bg-blue-50 p-8 rounded-2xl border border-blue-100">
                                <i className="ri-double-quotes-l text-4xl text-blue-300 mb-4 block"></i>
                                <p className="text-xl font-medium text-blue-900 mb-4 italic">
                                    "{project.testimonial.text}"
                                </p>
                                <p className="font-bold text-blue-700">- {project.testimonial.author}</p>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-12">
                            {/* Key Results */}
                            <div className="bg-gray-900 text-white p-8 rounded-2xl shadow-xl">
                                <h3 className="text-lg font-bold mb-6 border-b border-gray-700 pb-2">Key Results</h3>
                                <div className="space-y-6">
                                    {project.results.map((result, i) => (
                                        <div key={i}>
                                            <div className="text-3xl font-bold text-blue-400 mb-1">{result.value}</div>
                                            <div className="text-sm text-gray-400">{result.label}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Tech Stack */}
                            <div>
                                <h3 className="text-lg font-bold mb-6">Technologies Used</h3>
                                <div className="flex flex-wrap gap-2">
                                    {project.technologies.map(tech => (
                                        <span key={tech} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-bold">
                                            {tech}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Related Services */}
            <div className="border-t border-gray-100 py-24">
                <div className="container-custom">
                    <h2 className="text-3xl font-bold mb-12">Related Services</h2>
                    <RelatedServices currentService={project.category} />
                </div>
            </div>

            {/* CTA */}
            <section className="py-24 bg-blue-600 text-white text-center">
                <div className="container-custom">
                    <h2 className="text-4xl font-bold mb-8">Ready to start your project?</h2>
                    <Link
                        to="/contact"
                        className="inline-block px-10 py-4 bg-white text-blue-600 rounded-full font-bold text-lg hover:shadow-xl transition-all hover:scale-105"
                    >
                        Get Free Consultation
                    </Link>
                </div>
            </section>

            <BackToTop />
        </div>
    );
};

export default ProjectDetail;
