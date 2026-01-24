import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, useScroll, useSpring, AnimatePresence } from 'framer-motion';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import BackToTop from '../components/ui/BackToTop';

const FAQPage = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [expandedIndex, setExpandedIndex] = useState(null);
    const [helpfulFeedback, setHelpfulFeedback] = useState({});

    const faqs = [
        {
            question: "What services do you offer?",
            answer: "We offer a comprehensive range of software development services including custom web development (React, Next.js, Node.js), mobile app development (Flutter, React Native, iOS, Android), AI & machine learning solutions, cloud infrastructure (AWS, Azure, GCP), CRM & ERP systems, and e-commerce platforms.",
            category: "Services"
        },
        {
            question: "Do you serve clients globally?",
            answer: "Yes, we work with clients worldwide. Our team serves businesses in India, USA, UK, Canada, Australia, UAE, and many other countries. We have experience working across different time zones and cultural contexts.",
            category: "General"
        },
        {
            question: "Which technologies do you specialize in?",
            answer: "Our core expertise includes React, Node.js, Next.js, Flutter, React Native for mobile, AWS, Azure, Google Cloud Platform (GCP), Python, TypeScript, PostgreSQL, MongoDB, and modern DevOps tools like Docker and Kubernetes.",
            category: "Technical"
        },
        {
            question: "What is your development process?",
            answer: "We follow an Agile methodology with sprint-based development. Our process includes: Discovery & Planning, UI/UX Design, Development with regular sprints, Quality Assurance & Testing, Deployment, and ongoing Support & Maintenance.",
            category: "Process"
        },
        {
            question: "How long does a typical project take?",
            answer: "Project timelines depend on complexity. A simple MVP might take 4-6 weeks, while a complex enterprise platform could take 3-6 months. We provide detailed roadmaps and milestone estimates during the discovery phase.",
            category: "Process"
        },
        {
            question: "Do you offer post-launch support?",
            answer: "Yes, we offer 24/7 global support and maintenance packages. This includes bug fixes, performance optimization, security updates, feature enhancements, and technical support to ensure your application runs smoothly.",
            category: "Services"
        },
        {
            question: "Can you integrate third-party APIs?",
            answer: "Absolutely! We have extensive experience integrating various third-party APIs including payment gateways (Stripe, PayPal, Razorpay), social media platforms, CRM systems, analytics tools, shipping providers, and custom enterprise APIs.",
            category: "Technical"
        },
        {
            question: "Do you provide custom solutions?",
            answer: "Every solution we deliver is fully customized to your specific business requirements. We don't believe in one-size-fits-all approaches. Each project is tailored to meet your unique goals, workflows, and user needs.",
            category: "Services"
        },
        {
            question: "How do you ensure data security?",
            answer: "We implement enterprise-grade security measures including SSL/TLS encryption, secure authentication (JWT, OAuth), data encryption at rest and in transit, regular security audits, GDPR compliance, and industry-standard security practices.",
            category: "Technical"
        },
        {
            question: "What are your pricing models?",
            answer: "We offer flexible pricing models including fixed-price projects for well-defined scopes, time & materials for agile projects, and dedicated team models for long-term engagements. We provide transparent quotes after understanding your requirements.",
            category: "Pricing"
        },
        {
            question: "Can you help with SEO-friendly websites?",
            answer: "Yes, all websites we build are SEO optimized from the ground up. This includes semantic HTML, fast page load times, mobile responsiveness, proper meta tags, structured data markup, and adherence to Google's Core Web Vitals guidelines.",
            category: "Technical"
        }
    ];

    const categories = ['All', ...new Set(faqs.map(faq => faq.category))];

    const filteredFaqs = useMemo(() => {
        return faqs.filter(faq => {
            const matchesCategory = activeCategory === 'All' || faq.category === activeCategory;
            const matchesSearch = searchQuery === '' ||
                faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [activeCategory, searchQuery]);

    // FAQ Schema for SEO
    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqs.map(faq => ({
            "@type": "Question",
            "name": faq.question,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.answer
            }
        }))
    };

    const handleFeedback = (index, isHelpful) => {
        setHelpfulFeedback(prev => ({ ...prev, [index]: isHelpful }));
    };

    return (
        <div className="min-h-screen bg-white font-sans text-gray-900 selection:bg-blue-600 selection:text-white overflow-hidden">
            <Helmet>
                <title>FAQ - Frequently Asked Questions | Nexspire Solutions</title>
                <meta name="description" content="Get answers to common questions about Nexspire Solutions' software development services, technologies, project timelines, support, and more. Learn about our web, mobile, AI, and cloud solutions." />
                <meta name="keywords" content="software development FAQ, web development questions, mobile app development process, project timeline, post-launch support, data security, SEO websites, custom software solutions" />
                <link rel="canonical" href="https://nexspiresolutions.co.in/faq" />
                <meta property="og:title" content="Frequently Asked Questions | Nexspire Solutions" />
                <meta property="og:description" content="Common questions answered about our software development services, process, and technologies." />
                <meta property="og:url" content="https://nexspiresolutions.co.in/faq" />
                <script type="application/ld+json">
                    {JSON.stringify(faqSchema)}
                </script>
            </Helmet>

            {/* Scroll Progress Bar */}
            <motion.div
                className="fixed top-0 left-0 right-0 h-1 bg-blue-600 origin-left z-50"
                style={{ scaleX }}
            />

            {/* Hero Section */}
            <section className="relative min-h-[50vh] flex items-center pt-20 overflow-hidden bg-gray-950 text-white">
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-blue-950 to-purple-950"></div>
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
                </div>

                <div className="container-custom relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="max-w-4xl mx-auto text-center"
                    >
                        <span className="inline-block py-2 px-6 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-blue-300 font-medium mb-8">
                            Have Questions?
                        </span>
                        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-tight mb-8">
                            Frequently Asked <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">Questions</span>
                        </h1>
                        <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                            Find answers to common questions about our services, process, and how we can help your business grow.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-20 bg-gray-50">
                <div className="container-custom max-w-4xl">
                    {/* Breadcrumbs */}
                    <div className="mb-8">
                        <Breadcrumbs />
                    </div>

                    {/* Search Bar */}
                    <div className="mb-8">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search for answers..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-6 py-4 pl-14 rounded-2xl bg-white border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm transition-all text-lg outline-none"
                            />
                            <i className="ri-search-line absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 text-xl"></i>
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <i className="ri-close-line text-xl"></i>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Category Filters */}
                    <div className="flex flex-wrap gap-3 mb-8">
                        {categories.map((category) => (
                            <button
                                key={category}
                                onClick={() => setActiveCategory(category)}
                                className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${activeCategory === category
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                                    }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>

                    {/* Results count */}
                    <div className="mb-4 text-sm text-gray-500">
                        Showing {filteredFaqs.length} of {faqs.length} questions
                    </div>

                    {/* FAQ List */}
                    <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
                        <AnimatePresence mode="wait">
                            {filteredFaqs.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="p-12 text-center"
                                >
                                    <i className="ri-search-eye-line text-6xl text-gray-200 mb-4 block"></i>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">No results found</h3>
                                    <p className="text-gray-500">Try adjusting your search or filter to find what you're looking for.</p>
                                </motion.div>
                            ) : (
                                filteredFaqs.map((faq, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.03 }}
                                        className="border-b border-gray-100 last:border-0"
                                    >
                                        <button
                                            onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                                            className="w-full p-6 text-left flex items-start gap-4 hover:bg-gray-50 transition-colors"
                                        >
                                            <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                                                Q
                                            </span>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                                                        {faq.category}
                                                    </span>
                                                </div>
                                                <h3 className="text-lg font-bold text-gray-900 pr-8">
                                                    {faq.question}
                                                </h3>
                                            </div>
                                            <i className={`ri-arrow-down-s-line text-2xl text-gray-400 transition-transform duration-300 ${expandedIndex === index ? 'rotate-180' : ''}`}></i>
                                        </button>

                                        <AnimatePresence>
                                            {expandedIndex === index && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.3 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="px-6 pb-6 pl-[4.5rem]">
                                                        <p className="text-gray-600 leading-relaxed mb-4">
                                                            {faq.answer}
                                                        </p>

                                                        {/* Helpful feedback */}
                                                        <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                                                            <span className="text-sm text-gray-400">Was this helpful?</span>
                                                            {helpfulFeedback[index] === undefined ? (
                                                                <>
                                                                    <button
                                                                        onClick={() => handleFeedback(index, true)}
                                                                        className="text-gray-400 hover:text-green-500 transition-colors"
                                                                    >
                                                                        <i className="ri-thumb-up-line text-lg"></i>
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleFeedback(index, false)}
                                                                        className="text-gray-400 hover:text-red-500 transition-colors"
                                                                    >
                                                                        <i className="ri-thumb-down-line text-lg"></i>
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <span className="text-sm text-green-600 flex items-center gap-1">
                                                                    <i className="ri-check-line"></i>
                                                                    Thanks for your feedback!
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                ))
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-white text-center">
                <div className="container-custom">
                    <h2 className="text-4xl font-bold mb-6">Still have questions?</h2>
                    <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
                        We're here to help! Contact us for a free consultation and let's discuss your project.
                    </p>
                    <Link
                        to="/contact"
                        className="inline-flex items-center gap-4 px-10 py-5 bg-blue-600 text-white rounded-full text-lg font-bold hover:bg-blue-700 transition-all duration-300 shadow-xl hover:shadow-2xl"
                    >
                        Contact Us
                        <i className="ri-arrow-right-line"></i>
                    </Link>
                </div>
            </section>

            {/* Back to Top */}
            <BackToTop />
        </div>
    );
};

export default FAQPage;
