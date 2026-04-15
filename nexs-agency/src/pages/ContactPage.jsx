import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { inquiryAPI } from '../services/api';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import BackToTop from '../components/ui/BackToTop';
import ReadingProgress from '../components/ui/ReadingProgress';
import { SITE_URL, siteConfig } from '../constants/siteConfig';

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

const ContactPage = () => {
    const [formState, setFormState] = useState({
        name: '',
        email: '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormState({ ...formState, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            await inquiryAPI.submit(formState);
            setIsSubmitting(false);
            setIsSuccess(true);
        } catch (err) {
            // TODO: Replace with Sentry or proper error tracking
            console.error('Form submission error:', err);
            setIsSubmitting(false);
            setError(err.response?.data?.error || 'Failed to send message. Please try again.');
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800 selection:bg-blue-600 selection:text-white">
            <Helmet>
                <title>Contact Us | Nexspire Solutions</title>
                <meta name="description" content="Get in touch with Nexspire Solutions. We're based in Mohali, India and work with clients globally." />
                <link rel="canonical" href={`${SITE_URL}/contact`} />
                <meta property="og:title" content="Contact Us | Nexspire Solutions" />
                <meta property="og:description" content="Get in touch with Nexspire Solutions. We're based in Mohali, India and work with clients globally." />
                <meta property="og:type" content="website" />
                <meta property="og:url" content={`${SITE_URL}/contact`} />
                <meta property="og:image" content={`${SITE_URL}/og-image.jpg`} />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="Contact Us | Nexspire Solutions" />
                <meta name="twitter:description" content="Get in touch. We're based in Mohali, India and work with clients globally." />
                <script type="application/ld+json">{JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "LocalBusiness",
                    "name": "Nexspire Solutions",
                    "url": SITE_URL,
                    "email": "nexspiretechsolutions@gmail.com",
                    "telephone": "+919729916844",
                    "address": {
                        "@type": "PostalAddress",
                        "addressLocality": "Mohali",
                        "addressRegion": "Punjab",
                        "addressCountry": "IN"
                    }
                })}</script>
            </Helmet>

            <ReadingProgress />

            <section className="pt-32 pb-16 lg:pt-40 lg:pb-20 bg-white">
                <div className="container-custom">
                    <Breadcrumbs />
                    <FadeIn>
                        <h1 className="font-serif text-5xl lg:text-6xl text-slate-900 tracking-tight mt-8 mb-6">
                            Get in Touch
                        </h1>
                    </FadeIn>
                    <FadeIn delay={0.1}>
                        <p className="text-lg lg:text-xl text-slate-500 max-w-2xl leading-relaxed">
                            Have a project in mind or just want to say hello? We&apos;d love to hear from you.
                        </p>
                    </FadeIn>
                </div>
            </section>

            <section className="py-24 lg:py-32">
                <div className="container-custom">
                    <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
                        <FadeIn>
                            <AnimatePresence mode="wait">
                                {isSuccess ? (
                                    <motion.div
                                        key="success"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="py-16"
                                    >
                                        <h2 className="font-serif text-3xl text-slate-900 mb-4">Message sent.</h2>
                                        <p className="text-slate-500 leading-relaxed mb-8">
                                            Thanks for reaching out. We&apos;ll get back to you within 24 hours.
                                        </p>
                                        <button
                                            onClick={() => { setIsSuccess(false); setFormState({ name: '', email: '', message: '' }); }}
                                            className="text-[#2563EB] font-medium hover:text-[#1D4ED8] transition-colors"
                                        >
                                            Send another message →
                                        </button>
                                    </motion.div>
                                ) : (
                                    <motion.form
                                        key="form"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        onSubmit={handleSubmit}
                                        className="space-y-8"
                                    >
                                        <div>
                                            <label htmlFor="contact-name" className="block text-sm font-medium text-slate-700 mb-2">
                                                Name
                                            </label>
                                            <input
                                                id="contact-name"
                                                type="text"
                                                name="name"
                                                value={formState.name}
                                                onChange={handleChange}
                                                required
                                                minLength={2}
                                                maxLength={100}
                                                className="w-full px-0 py-3 border-b-2 border-slate-200 focus:border-[#2563EB] focus:outline-none transition-colors bg-transparent text-lg"
                                                placeholder="Your name"
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="contact-email" className="block text-sm font-medium text-slate-700 mb-2">
                                                Email
                                            </label>
                                            <input
                                                id="contact-email"
                                                type="email"
                                                name="email"
                                                value={formState.email}
                                                onChange={handleChange}
                                                required
                                                className="w-full px-0 py-3 border-b-2 border-slate-200 focus:border-[#2563EB] focus:outline-none transition-colors bg-transparent text-lg"
                                                placeholder="you@company.com"
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="contact-message" className="block text-sm font-medium text-slate-700 mb-2">
                                                Tell us about your project
                                            </label>
                                            <textarea
                                                id="contact-message"
                                                name="message"
                                                value={formState.message}
                                                onChange={handleChange}
                                                required
                                                minLength={10}
                                                maxLength={2000}
                                                rows="5"
                                                className="w-full px-0 py-3 border-b-2 border-slate-200 focus:border-[#2563EB] focus:outline-none transition-colors bg-transparent text-lg resize-none"
                                                placeholder="What are you building?"
                                            />
                                        </div>

                                        {error && (
                                            <p className="text-red-600 text-sm" role="alert">{error}</p>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="px-8 py-4 bg-[#2563EB] text-white rounded-lg font-medium hover:bg-[#1D4ED8] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                        >
                                            {isSubmitting ? 'Sending...' : 'Send Message'}
                                        </button>
                                    </motion.form>
                                )}
                            </AnimatePresence>
                        </FadeIn>

                        <FadeIn delay={0.1}>
                            <div className="space-y-10 lg:pt-4">
                                <div>
                                    <h3 className="text-xs tracking-widest uppercase text-slate-400 font-medium mb-3">Email</h3>
                                    <a href="mailto:nexspiretechsolutions@gmail.com" className="text-slate-800 hover:text-[#2563EB] transition-colors">
                                        nexspiretechsolutions@gmail.com
                                    </a>
                                </div>

                                <div>
                                    <h3 className="text-xs tracking-widest uppercase text-slate-400 font-medium mb-3">Phone</h3>
                                    <a href="tel:+919729916844" className="text-slate-800 hover:text-[#2563EB] transition-colors">
                                        +91 9729916844
                                    </a>
                                    <p className="text-slate-500 text-sm mt-1">Mon–Fri, 9am – 6pm IST</p>
                                </div>

                                <div>
                                    <h3 className="text-xs tracking-widest uppercase text-slate-400 font-medium mb-3">Location</h3>
                                    <p className="text-slate-800">Mohali, SAS Nagar</p>
                                    <p className="text-slate-500 text-sm mt-1">Punjab, India</p>
                                </div>

                                <div>
                                    <h3 className="text-xs tracking-widest uppercase text-slate-400 font-medium mb-3">Social</h3>
                                    <div className="flex gap-4">
                                        {siteConfig.social.map(s => (
                                            <a
                                                key={s.label}
                                                href={s.href}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                aria-label={s.label}
                                                className="text-slate-500 hover:text-[#2563EB] transition-colors"
                                            >
                                                <i className={`${s.icon} text-xl`}></i>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </FadeIn>
                    </div>
                </div>
            </section>

            <BackToTop />
        </div>
    );
};

export default ContactPage;
