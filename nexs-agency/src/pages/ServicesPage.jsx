import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, useScroll, useSpring, AnimatePresence } from 'framer-motion';
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

const ServiceCard = ({ service, index }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="group relative rounded-[2rem] bg-white border border-gray-100 hover:border-blue-100 shadow-sm hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 overflow-hidden flex flex-col"
        >
            {/* Image Header */}
            <div className="h-48 overflow-hidden relative">
                <div className={`absolute inset-0 bg-${service.color}-600/10 group-hover:bg-${service.color}-600/0 transition-colors duration-500 z-10`}></div>
                <img
                    src={service.image}
                    alt={service.title}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                />
            </div>

            <div className="p-8 flex-1 flex flex-col relative z-20 bg-white">
                <div className={`w-14 h-14 rounded-2xl bg-${service.color}-50 flex items-center justify-center mb-6 text-2xl text-${service.color}-600 group-hover:scale-110 transition-transform duration-500 -mt-16 shadow-lg border-4 border-white`}>
                    <i className={service.icon}></i>
                </div>

                <h3 className="text-2xl font-bold mb-4 group-hover:text-blue-600 transition-colors">{service.title}</h3>
                <p className="text-gray-600 mb-8 leading-relaxed flex-1">{service.description}</p>

                <ul className="space-y-3 mt-auto">
                    {service.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-3 text-sm font-medium text-gray-500">
                            <span className={`w-1.5 h-1.5 rounded-full bg-${service.color}-500`}></span>
                            {feature}
                        </li>
                    ))}
                </ul>
            </div>
        </motion.div>
    );
};

const AccordionItem = ({ question, answer, isOpen, onClick }) => {
    return (
        <div className="border-b border-gray-100 last:border-0">
            <button
                className="w-full py-6 flex items-center justify-between text-left focus:outline-none group"
                onClick={onClick}
            >
                <span className={cn("text-lg font-bold transition-colors", isOpen ? "text-blue-600" : "text-gray-900 group-hover:text-blue-600")}>
                    {question}
                </span>
                <span className={cn("w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300", isOpen ? "bg-blue-100 text-blue-600 rotate-180" : "bg-gray-100 text-gray-500 group-hover:bg-blue-50")}>
                    <i className="ri-arrow-down-s-line text-xl"></i>
                </span>
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <p className="pb-6 text-gray-600 leading-relaxed">
                            {answer}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const ServicesPage = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    const [openFaqIndex, setOpenFaqIndex] = useState(0);

    const services = [
        {
            title: "Custom Web Development",
            description: "We build scalable, high-performance web applications tailored to your business needs using the latest technologies.",
            icon: "ri-code-s-slash-line",
            color: "blue",
            image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=800",
            features: ["React & Next.js", "Progressive Web Apps", "Enterprise Solutions", "API Integration"]
        },
        {
            title: "Mobile App Development",
            description: "Create engaging native and cross-platform mobile experiences that users love and retain.",
            icon: "ri-smartphone-line",
            color: "purple",
            image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&q=80&w=800",
            features: ["iOS & Android", "Flutter & React Native", "App Store Optimization", "UI/UX Design"]
        },
        {
            title: "Cloud Infrastructure",
            description: "Secure, scalable, and cost-effective cloud solutions to power your digital transformation journey.",
            icon: "ri-cloud-line",
            color: "cyan",
            image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800",
            features: ["AWS & Azure", "DevOps Automation", "Cloud Migration", "Serverless Architecture"]
        },
        {
            title: "AI & Machine Learning",
            description: "Leverage the power of Artificial Intelligence to automate processes and gain actionable insights.",
            icon: "ri-brain-line",
            color: "emerald",
            image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800",
            features: ["Predictive Analytics", "NLP & Chatbots", "Computer Vision", "Data Mining"]
        },
        {
            title: "UI/UX Design",
            description: "User-centric design that combines aesthetics with functionality to create intuitive digital experiences.",
            icon: "ri-palette-line",
            color: "purple",
            image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&q=80&w=800",
            features: ["User Research", "Wireframing", "Prototyping", "Design Systems"]
        },
        {
            title: "E-Commerce Solutions",
            description: "Robust online stores that drive sales and provide seamless shopping experiences for your customers.",
            icon: "ri-shopping-bag-3-line",
            color: "orange",
            image: "https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?auto=format&fit=crop&q=80&w=800",
            features: ["Shopify & WooCommerce", "Custom Payment Gateways", "Inventory Management", "Conversion Optimization"]
        }
    ];

    const process = [
        { step: "01", title: "Discovery", description: "Understanding your goals and requirements." },
        { step: "02", title: "Strategy", description: "Creating a roadmap and technical architecture." },
        { step: "03", title: "Design", description: "Crafting intuitive and beautiful interfaces." },
        { step: "04", title: "Development", description: "Building with clean, scalable code." },
        { step: "05", title: "Launch", description: "Testing, deployment, and ongoing support." }
    ];

    // Tech Stack Icons (using Devicon URLs)
    const techStack = [
        { name: "React", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" },
        { name: "Next.js", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg" },
        { name: "Node.js", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg" },
        { name: "TypeScript", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg" },
        { name: "Python", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg" },
        { name: "AWS", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-original-wordmark.svg" },
        { name: "Docker", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg" },
        { name: "Kubernetes", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/kubernetes/kubernetes-plain.svg" },
        { name: "Flutter", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/flutter/flutter-original.svg" },
        { name: "GraphQL", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/graphql/graphql-plain.svg" },
        { name: "PostgreSQL", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg" },
        { name: "MongoDB", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg" },
        { name: "Redis", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/redis/redis-original.svg" },
        { name: "Figma", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/figma/figma-original.svg" }
    ];

    const testimonials = [
        {
            quote: "Nexspire transformed our outdated platform into a modern, high-speed application. Their attention to detail is unmatched.",
            author: "Sarah Jenkins",
            role: "CTO, FinTech Global",
            company: "FinTech Global"
        },
        {
            quote: "The team's ability to understand our complex requirements and deliver a scalable solution was impressive. Highly recommended.",
            author: "Michael Chen",
            role: "Founder, HealthAI",
            company: "HealthAI"
        },
        {
            quote: "From design to deployment, the process was seamless. They truly care about the product's success.",
            author: "Emily Rodriguez",
            role: "VP of Product, EcoComm",
            company: "EcoComm"
        },
        {
            quote: "A true partner in every sense. They anticipated our needs and delivered beyond expectations.",
            author: "David Kim",
            role: "CEO, StartUp Inc",
            company: "StartUp Inc"
        }
    ];

    const faqs = [
        {
            question: "How do you ensure project quality?",
            answer: "We follow strict coding standards, conduct thorough code reviews, and implement automated testing pipelines (CI/CD). Our QA team rigorously tests every feature before deployment."
        },
        {
            question: "What is your typical project timeline?",
            answer: "Timelines vary based on complexity. A simple MVP might take 4-6 weeks, while a complex enterprise platform could take 3-6 months. We provide detailed roadmaps during the discovery phase."
        },
        {
            question: "Do you provide post-launch support?",
            answer: "Yes, we offer various support and maintenance packages to ensure your application remains secure, up-to-date, and performs optimally after launch."
        },
        {
            question: "Can you work with our existing team?",
            answer: "Absolutely. We often augment existing teams, providing specialized expertise or additional capacity to help meet deadlines and goals."
        }
    ];

    return (
        <div className="min-h-screen bg-white font-sans text-gray-900 selection:bg-blue-600 selection:text-white overflow-hidden">
            <Helmet>
                <title>Web, Mobile & AI Development Services | Mohali & Global</title>
                <meta name="description" content="Premium software services: Custom Web Development, Mobile Apps, and AI Solutions. Top-rated freelance experts in Mohali & Chandigarh delivering enterprise-grade quality." />
                <meta name="keywords" content="web development services, mobile app development mohali, custom software agency, freelance web designer chandigarh, AI solutions, cloud infrastructure, enterprise software, best it company mohali" />
                <link rel="canonical" href="https://nexspiresolutions.co.in/services" />
                <meta property="og:title" content="Premium Dev Services - Mohali Experts, Global Quality" />
                <meta property="og:description" content="From MVP to Enterprise. World-class engineering services, locally available in Tricity." />
                <meta property="og:url" content="https://nexspiresolutions.co.in/services" />
            </Helmet>

            {/* Scroll Progress Bar */}
            <motion.div
                className="fixed top-0 left-0 right-0 h-1 bg-blue-600 origin-left z-50"
                style={{ scaleX }}
            />

            {/* Hero Section - 3D Gradient Mesh Style */}
            <section className="relative min-h-[85vh] flex items-center pt-20 overflow-hidden bg-gray-950 text-white">
                {/* CSS-based Animated Background */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-blue-950 to-purple-950"></div>
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')] bg-cover bg-center opacity-30 mix-blend-soft-light"></div>
                </div>

                <div className="container-custom relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="max-w-4xl mx-auto text-center"
                    >
                        <span className="inline-block py-2 px-6 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-blue-300 font-medium mb-8">
                            World-Class Engineering
                        </span>
                        <h1 className="text-6xl md:text-8xl font-bold tracking-tighter leading-tight mb-8">
                            We Craft <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">Digital Excellence.</span>
                        </h1>
                        <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                            From complex enterprise platforms to stunning mobile apps, we deliver software that defines the future of your business.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Tech Stack Marquee - Icons */}
            <section className="py-8 bg-gray-900 border-t border-gray-800 overflow-hidden">
                <div className="flex gap-16 animate-marquee whitespace-nowrap items-center">
                    {[...techStack, ...techStack].map((tech, i) => (
                        <div key={i} className="flex flex-col items-center gap-2 group opacity-50 hover:opacity-100 transition-opacity duration-300">
                            <img src={tech.icon} alt={tech.name} className="h-12 w-auto grayscale group-hover:grayscale-0 transition-all duration-300" />
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">{tech.name}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Services Grid - With Images */}
            <section className="py-32 bg-gray-50 relative">
                <div className="container-custom">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {services.map((service, index) => (
                            <ServiceCard key={index} service={service} index={index} />
                        ))}
                    </div>
                </div>
            </section>

            {/* Process Section */}
            <section className="py-32 bg-white overflow-hidden">
                <div className="container-custom">
                    <div className="flex flex-col md:flex-row gap-16 items-center">
                        <div className="md:w-1/2">
                            <FadeIn>
                                <h2 className="text-5xl font-bold tracking-tight mb-8">Our Process</h2>
                                <p className="text-xl text-gray-500 leading-relaxed mb-12">
                                    We follow a rigorous, agile methodology to ensure every project is delivered on time, within budget, and to the highest standards of quality.
                                </p>
                                <div className="space-y-8">
                                    {process.map((step, i) => (
                                        <div key={i} className="flex gap-6 group">
                                            <div className="text-4xl font-bold text-gray-200 group-hover:text-blue-600 transition-colors duration-300">
                                                {step.step}
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold mb-2 text-gray-900">{step.title}</h3>
                                                <p className="text-gray-500">{step.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </FadeIn>
                        </div>
                        <div className="md:w-1/2 relative">
                            <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-[3rem] rotate-3 opacity-10"></div>
                            <div className="relative bg-gray-900 rounded-[3rem] p-8 shadow-2xl rotate-[-3deg] hover:rotate-0 transition-all duration-500 aspect-square flex items-center justify-center overflow-hidden">
                                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800')] bg-cover bg-center opacity-20"></div>
                                <div className="text-center text-white relative z-10">
                                    <div className="text-6xl mb-4">🚀</div>
                                    <h3 className="text-3xl font-bold mb-2">Ready to Launch?</h3>
                                    <p className="text-gray-400">Let's turn your vision into reality.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials Slider */}
            <section className="py-32 bg-gray-900 text-white overflow-hidden relative">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
                <div className="container-custom relative z-10">
                    <FadeIn>
                        <h2 className="text-4xl md:text-5xl font-bold text-center mb-20">Trusted by Innovators</h2>
                    </FadeIn>

                    {/* Infinite Slider */}
                    <div className="relative w-full overflow-hidden">
                        <div className="flex animate-marquee gap-8 w-max">
                            {[...testimonials, ...testimonials, ...testimonials].map((t, i) => (
                                <div key={i} className="w-[400px] bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-white/10 hover:bg-white/10 transition-colors flex-shrink-0">
                                    <div className="text-blue-400 text-4xl mb-6">"</div>
                                    <p className="text-lg text-gray-300 mb-8 leading-relaxed italic">
                                        {t.quote}
                                    </p>
                                    <div>
                                        <div className="font-bold text-white">{t.author}</div>
                                        <div className="text-sm text-gray-500">{t.role}</div>
                                        <div className="text-xs text-blue-400 mt-1">{t.company}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-32 bg-gray-50">
                <div className="container-custom max-w-4xl">
                    <FadeIn>
                        <h2 className="text-4xl font-bold text-center mb-16">Frequently Asked Questions</h2>
                        <div className="bg-white rounded-[2rem] p-8 md:p-12 shadow-xl border border-gray-100">
                            {faqs.map((faq, index) => (
                                <AccordionItem
                                    key={index}
                                    question={faq.question}
                                    answer={faq.answer}
                                    isOpen={openFaqIndex === index}
                                    onClick={() => setOpenFaqIndex(index === openFaqIndex ? -1 : index)}
                                />
                            ))}
                        </div>
                    </FadeIn>
                </div>
            </section>

            {/* CTA - Minimalist */}
            <section className="py-32 bg-white text-center relative overflow-hidden">
                <div className="container-custom relative z-10">
                    <FadeIn>
                        <h2 className="text-5xl md:text-7xl font-bold mb-12 tracking-tighter text-gray-900">Start Your Journey</h2>
                        <Link to="/contact" className="inline-flex items-center gap-4 px-12 py-6 bg-gray-900 text-white rounded-full text-xl font-bold hover:bg-blue-600 transition-all duration-300 group shadow-2xl">
                            Book Consultation
                            <i className="ri-arrow-right-line group-hover:translate-x-2 transition-transform"></i>
                        </Link>
                    </FadeIn>
                </div>
            </section>
        </div>
    );
};

export default ServicesPage;
