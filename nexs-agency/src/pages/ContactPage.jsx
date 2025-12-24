import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import confetti from 'canvas-confetti';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { inquiryAPI } from '../services/api';

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

const ContactPage = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    const [formState, setFormState] = useState({
        name: '',
        email: '',
        phone: '',
        company: '',
        message: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormState({
            ...formState,
            [e.target.name]: e.target.value
        });
        setError(''); // Clear error on input change
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            // Submit form data directly (fields now match backend API)
            await inquiryAPI.submit(formState);

            setIsSubmitting(false);
            setIsSuccess(true);
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#3B82F6', '#8B5CF6', '#10B981']
            });
        } catch (err) {
            console.error('Form submission error:', err);
            setIsSubmitting(false);
            setError(err.response?.data?.error || 'Failed to send message. Please try again.');
        }
    };

    const faqs = [
        {
            question: "Are you accepting new projects?",
            answer: "Yes, we are currently accepting new projects for Q2 and Q3. Reach out to secure your spot."
        },
        {
            question: "Do you work with startups?",
            answer: "Absolutely. We love helping startups build their MVPs and scale their products."
        },
        {
            question: "What is your hourly rate?",
            answer: "We typically work on a project-based pricing model to ensure transparency and predictable costs."
        }
    ];

    return (
        <div className="min-h-screen bg-white font-sans text-gray-900 selection:bg-blue-600 selection:text-white overflow-hidden">
            <Helmet>
                <title>Contact Nexspire - Hire Top Freelance Developers (Mohali & Global)</title>
                <meta name="description" content="Ready to start your project? Contact Nexspire Solutions for expert software development. Whether you need a local agency in Mohali/Chandigarh or remote freelance experts, we're here to help." />
                <meta name="keywords" content="hire developers mohali, contact software agency, freelance web developer chandigarh, hire react developers, software consultation, app development quote, it company mohali address, nexspire contact" />
                <link rel="canonical" href="https://nexspiresolutions.co.in/contact" />
                <meta property="og:title" content="Hire Top Developers - Local Presence, Global Standards" />
                <meta property="og:description" content="Connect with the best software team in Mohali. Custom solutions for ambitious businesses worldwide." />
                <meta property="og:url" content="https://nexspiresolutions.co.in/contact" />
            </Helmet>

            {/* Scroll Progress Bar */}
            <motion.div
                className="fixed top-0 left-0 right-0 h-1 bg-blue-600 origin-left z-50"
                style={{ scaleX }}
            />

            {/* Hero Section - 3D Gradient Mesh Style */}
            <section className="relative min-h-[85vh] flex items-center pt-20 pb-32 overflow-hidden bg-gray-950 text-white">
                {/* CSS-based Animated Background */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-blue-950 to-purple-950"></div>
                    <motion.div
                        animate={{
                            scale: [1, 1.2, 1],
                            rotate: [0, 180, 360],
                            opacity: [0.3, 0.5, 0.3]
                        }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-blue-600/20 rounded-full blur-[120px]"
                    />
                    <motion.div
                        animate={{
                            scale: [1, 1.3, 1],
                            rotate: [360, 180, 0],
                            opacity: [0.3, 0.5, 0.3]
                        }}
                        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                        className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[100px]"
                    />
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1423666639041-f142fcb93461?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-30 mix-blend-soft-light"></div>
                </div>

                <div className="container-custom relative z-10 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <span className="inline-block py-2 px-6 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-blue-300 font-medium mb-8">
                            Get in Touch
                        </span>
                        <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
                            Let's Build <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Something Great.</span>
                        </h1>
                        <p className="text-xl text-blue-100/80 max-w-2xl mx-auto">
                            Ready to transform your business? We're here to help you every step of the way.
                        </p>
                    </motion.div>
                </div>
            </section>

            <div className="container-custom -mt-20 relative z-20 pb-24">
                <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden grid lg:grid-cols-2 min-h-[800px] border border-gray-100">

                    {/* Left: Contact Info & Map */}
                    <div className="relative bg-blue-600 text-white p-12 lg:p-16 flex flex-col justify-between overflow-hidden">
                        {/* Map Background */}
                        <div className="absolute inset-0 opacity-30 mix-blend-overlay grayscale contrast-125">
                            <iframe
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3430.566817389476!2d76.7033!3d30.7046!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390fee906da6f81f%3A0x512998f16ce508d8!2sSahibzada%20Ajit%20Singh%20Nagar%2C%20Punjab!5e0!3m2!1sen!2sin!4v1625641234567!5m2!1sen!2sin"
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                allowFullScreen=""
                                loading="lazy"
                                title="Office Location"
                                className="w-full h-full object-cover"
                            ></iframe>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/90 via-blue-800/80 to-blue-900/90 pointer-events-none"></div>

                        <div className="relative z-10">
                            <h2 className="text-3xl font-bold mb-8">Contact Information</h2>
                            <div className="space-y-10">
                                <div className="flex items-start gap-6 group">
                                    <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white group-hover:bg-white group-hover:text-blue-600 transition-all duration-300 shadow-lg">
                                        <i className="ri-mail-send-line text-2xl"></i>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-xl mb-1">Email Us</h3>
                                        <p className="text-blue-100 opacity-80">nexspiretechsolutions@gmail.com</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-6 group">
                                    <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white group-hover:bg-white group-hover:text-blue-600 transition-all duration-300 shadow-lg">
                                        <i className="ri-phone-line text-2xl"></i>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-xl mb-1">Call Us</h3>
                                        <p className="text-blue-100 opacity-80">+91 9729916844</p>
                                        <p className="text-blue-100 opacity-80">Mon-Fri, 9am - 6pm IST</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-6 group">
                                    <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white group-hover:bg-white group-hover:text-blue-600 transition-all duration-300 shadow-lg">
                                        <i className="ri-map-pin-line text-2xl"></i>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-xl mb-1">Visit Us</h3>
                                        <p className="text-blue-100 opacity-80">Mohali, SAS Nagar</p>
                                        <p className="text-blue-100 opacity-80">Punjab, India</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="relative z-10 mt-12">
                            <p className="text-blue-200 mb-6 font-medium">Connect with us</p>
                            <div className="flex gap-4">
                                {['ri-twitter-x-fill', 'ri-linkedin-fill', 'ri-github-fill', 'ri-dribbble-fill'].map((icon, i) => (
                                    <a key={i} href="#" className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center hover:bg-white hover:text-blue-900 transition-all transform hover:scale-110 hover:shadow-lg backdrop-blur-sm">
                                        <i className={`${icon} text-xl`}></i>
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right: Form */}
                    <div className="p-12 lg:p-16 bg-white flex flex-col justify-center relative">
                        <AnimatePresence mode="wait">
                            {isSuccess ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="text-center py-20"
                                >
                                    <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
                                        <i className="ri-check-line text-5xl"></i>
                                    </div>
                                    <h2 className="text-4xl font-bold text-gray-900 mb-4">Message Sent!</h2>
                                    <p className="text-xl text-gray-500 mb-12">
                                        Thanks for reaching out. We'll get back to you within 24 hours.
                                    </p>
                                    <button
                                        onClick={() => setIsSuccess(false)}
                                        className="px-8 py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-blue-600 transition-all shadow-lg"
                                    >
                                        Send Another Message
                                    </button>
                                </motion.div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Send us a Message</h2>
                                    <p className="text-gray-500 mb-10">We'd love to hear about your project.</p>

                                    <form onSubmit={handleSubmit} className="space-y-8">
                                        <div className="space-y-2 group">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest group-focus-within:text-blue-600 transition-colors">Full Name</label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={formState.name}
                                                onChange={handleChange}
                                                required
                                                className="w-full px-0 py-3 border-b-2 border-gray-100 focus:border-blue-600 focus:outline-none transition-colors bg-transparent placeholder-gray-300 font-medium text-lg"
                                                placeholder="John Doe"
                                            />
                                        </div>

                                        <div className="space-y-2 group">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest group-focus-within:text-blue-600 transition-colors">Email Address</label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={formState.email}
                                                onChange={handleChange}
                                                required
                                                className="w-full px-0 py-3 border-b-2 border-gray-100 focus:border-blue-600 focus:outline-none transition-colors bg-transparent placeholder-gray-300 font-medium text-lg"
                                                placeholder="john@example.com"
                                            />
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-8">
                                            <div className="space-y-2 group">
                                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest group-focus-within:text-blue-600 transition-colors">Phone (Optional)</label>
                                                <input
                                                    type="tel"
                                                    name="phone"
                                                    value={formState.phone}
                                                    onChange={handleChange}
                                                    className="w-full px-0 py-3 border-b-2 border-gray-100 focus:border-blue-600 focus:outline-none transition-colors bg-transparent placeholder-gray-300 font-medium text-lg"
                                                    placeholder="+91 12345 67890"
                                                />
                                            </div>
                                            <div className="space-y-2 group">
                                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest group-focus-within:text-blue-600 transition-colors">Company (Optional)</label>
                                                <input
                                                    type="text"
                                                    name="company"
                                                    value={formState.company}
                                                    onChange={handleChange}
                                                    className="w-full px-0 py-3 border-b-2 border-gray-100 focus:border-blue-600 focus:outline-none transition-colors bg-transparent placeholder-gray-300 font-medium text-lg"
                                                    placeholder="Your Company"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2 group">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest group-focus-within:text-blue-600 transition-colors">Message</label>
                                            <textarea
                                                name="message"
                                                value={formState.message}
                                                onChange={handleChange}
                                                required
                                                rows="4"
                                                className="w-full px-0 py-3 border-b-2 border-gray-100 focus:border-blue-600 focus:outline-none transition-colors bg-transparent placeholder-gray-300 font-medium text-lg resize-none"
                                                placeholder="Tell us about your project..."
                                            ></textarea>
                                        </div>

                                        {/* Error Message */}
                                        {error && (
                                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                                <div className="flex items-center">
                                                    <i className="ri-error-warning-line mr-2"></i>
                                                    <span>{error}</span>
                                                </div>
                                            </div>
                                        )}

                                        <button
                                            disabled={isSubmitting}
                                            className="w-full bg-gray-900 text-white py-5 rounded-xl font-bold hover:bg-blue-600 transition-all duration-300 flex items-center justify-center gap-2 shadow-xl transform hover:-translate-y-1 disabled:opacity-70 disabled:cursor-not-allowed"
                                        >
                                            {isSubmitting ? (
                                                <span className="flex items-center gap-2">
                                                    <i className="ri-loader-4-line animate-spin text-xl"></i>
                                                    Sending...
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-2">
                                                    Send Message
                                                    <i className="ri-send-plane-fill"></i>
                                                </span>
                                            )}
                                        </button>
                                    </form>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* FAQ Section */}
            <section className="py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <FadeIn>
                    <h2 className="text-3xl font-bold text-center mb-12">Before you ask...</h2>
                    <div className="grid gap-6">
                        {faqs.map((faq, index) => (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                key={index}
                                className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-blue-100 transition-all duration-300"
                            >
                                <h3 className="text-lg font-bold text-gray-900 mb-2">{faq.question}</h3>
                                <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                            </motion.div>
                        ))}
                    </div>
                </FadeIn>
            </section>
        </div>
    );
};

export default ContactPage;
