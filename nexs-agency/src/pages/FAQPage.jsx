import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, useScroll, useSpring } from 'framer-motion';

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

    const faqs = [
        {
            question: "What services do you offer?",
            answer: "We offer a comprehensive range of software development services including custom web development (React, Next.js, Node.js), mobile app development (Flutter, React Native, iOS, Android), AI & machine learning solutions, cloud infrastructure (AWS, Azure, GCP), CRM & ERP systems, and e-commerce platforms."
        },
        {
            question: "Do you serve clients globally?",
            answer: "Yes, we work with clients worldwide. Our team serves businesses in India, USA, UK, Canada, Australia, UAE, and many other countries. We have experience working across different time zones and cultural contexts."
        },
        {
            question: "Which technologies do you specialize in?",
            answer: "Our core expertise includes React, Node.js, Next.js, Flutter, React Native for mobile, AWS, Azure, Google Cloud Platform (GCP), Python, TypeScript, PostgreSQL, MongoDB, and modern DevOps tools like Docker and Kubernetes."
        },
        {
            question: "What is your development process?",
            answer: "We follow an Agile methodology with sprint-based development. Our process includes: Discovery & Planning, UI/UX Design, Development with regular sprints, Quality Assurance & Testing, Deployment, and ongoing Support & Maintenance."
        },
        {
            question: "How long does a typical project take?",
            answer: "Project timelines depend on complexity. A simple MVP might take 4-6 weeks, while a complex enterprise platform could take 3-6 months. We provide detailed roadmaps and milestone estimates during the discovery phase."
        },
        {
            question: "Do you offer post-launch support?",
            answer: "Yes, we offer 24/7 global support and maintenance packages. This includes bug fixes, performance optimization, security updates, feature enhancements, and technical support to ensure your application runs smoothly."
        },
        {
            question: "Can you integrate third-party APIs?",
            answer: "Absolutely! We have extensive experience integrating various third-party APIs including payment gateways (Stripe, PayPal, Razorpay), social media platforms, CRM systems, analytics tools, shipping providers, and custom enterprise APIs."
        },
        {
            question: "Do you provide custom solutions?",
            answer: "Every solution we deliver is fully customized to your specific business requirements. We don't believe in one-size-fits-all approaches. Each project is tailored to meet your unique goals, workflows, and user needs."
        },
        {
            question: "How do you ensure data security?",
            answer: "We implement enterprise-grade security measures including SSL/TLS encryption, secure authentication (JWT, OAuth), data encryption at rest and in transit, regular security audits, GDPR compliance, and industry-standard security practices."
        },
        {
            question: "Can you help with SEO-friendly websites?",
            answer: "Yes, all websites we build are SEO optimized from the ground up. This includes semantic HTML, fast page load times, mobile responsiveness, proper meta tags, structured data markup, and adherence to Google's Core Web Vitals guidelines."
        }
    ];

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
                    <div className="bg-white rounded-[2rem] p-8 md:p-12 shadow-xl border border-gray-100">
                        {faqs.map((faq, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.05 }}
                                className="border-b border-gray-100 last:border-0 py-6"
                            >
                                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-start gap-4">
                                    <span className="text-blue-600 text-2xl leading-none">Q.</span>
                                    {faq.question}
                                </h3>
                                <p className="text-gray-600 leading-relaxed pl-10">
                                    {faq.answer}
                                </p>
                            </motion.div>
                        ))}
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
        </div>
    );
};

export default FAQPage;
