import { useState, useEffect, useCallback } from 'react';
import { inquiryAPI } from '../services/api';

const RECAPTCHA_SITE_KEY = '6LcrNTYsAAAAAAiRJyNE6h2kWSsof7HrIHRx4Z8z';
const POPUP_DELAY_MS = 15000; // 15 seconds
const SCROLL_THRESHOLD = 0.5; // 50% scroll
const STORAGE_KEY = 'nexspire_popup_dismissed';
const DISMISS_DAYS = 7;

const EnquiryPopup = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState({ type: '', message: '' });

    // Check if popup was dismissed recently
    const wasRecentlyDismissed = useCallback(() => {
        const dismissedAt = localStorage.getItem(STORAGE_KEY);
        if (!dismissedAt) return false;
        const dismissDate = new Date(parseInt(dismissedAt));
        const daysSince = (Date.now() - dismissDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysSince < DISMISS_DAYS;
    }, []);

    // Show popup logic
    useEffect(() => {
        if (wasRecentlyDismissed()) return;

        let hasShown = false;
        const showPopup = () => {
            if (hasShown) return;
            hasShown = true;
            setIsVisible(true);
        };

        // Timer trigger
        const timer = setTimeout(showPopup, POPUP_DELAY_MS);

        // Scroll trigger
        const handleScroll = () => {
            const scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
            if (scrollPercent >= SCROLL_THRESHOLD) {
                showPopup();
            }
        };

        window.addEventListener('scroll', handleScroll);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('scroll', handleScroll);
        };
    }, [wasRecentlyDismissed]);

    // Close popup with animation
    const closePopup = useCallback(() => {
        setIsClosing(true);
        setTimeout(() => {
            setIsVisible(false);
            setIsClosing(false);
            localStorage.setItem(STORAGE_KEY, Date.now().toString());
        }, 300);
    }, []);

    // Handle escape key
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape' && isVisible) closePopup();
        };
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [isVisible, closePopup]);

    // Prevent body scroll when popup is open
    useEffect(() => {
        if (isVisible) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isVisible]);

    const handleChange = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitStatus({ type: '', message: '' });

        try {
            // Get reCAPTCHA token
            let captchaToken = null;
            if (window.grecaptcha) {
                captchaToken = await window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: 'submit_inquiry' });
            }

            await inquiryAPI.submit({
                ...formData,
                captchaToken
            });

            setSubmitStatus({
                type: 'success',
                message: '🎉 Thank you! We\'ll get back to you within 24 hours.'
            });

            // Close after success
            setTimeout(() => {
                localStorage.setItem(STORAGE_KEY, (Date.now() + 23 * 24 * 60 * 60 * 1000).toString()); // 30 days
                closePopup();
            }, 2500);

        } catch (error) {
            console.error('Form submission error:', error);
            const errorMessage = error.response?.data?.error || 'Failed to send. Please try again.';
            setSubmitStatus({ type: 'error', message: errorMessage });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isVisible) return null;

    return (
        <div
            className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-all duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}
            style={{ background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(8px)' }}
            onClick={closePopup}
        >
            {/* Animated particles/sparkles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-1 h-1 bg-blue-400 rounded-full animate-pulse"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 2}s`,
                            animationDuration: `${2 + Math.random() * 3}s`
                        }}
                    />
                ))}
            </div>

            {/* Popup Card */}
            <div
                className={`relative w-full max-w-lg transform transition-all duration-500 ${isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}
                onClick={(e) => e.stopPropagation()}
                style={{
                    animation: 'popupSlide 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}
            >
                {/* Main Card */}
                <div className="relative bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-indigo-500/30">
                    {/* Glow effect */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/30 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/30 rounded-full blur-3xl"></div>

                    {/* Close button */}
                    <button
                        onClick={closePopup}
                        className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors group"
                    >
                        <i className="ri-close-line text-white text-xl group-hover:scale-110 transition-transform"></i>
                    </button>

                    {/* Header */}
                    <div className="relative px-6 pt-8 pb-4 text-center">
                        <div className="inline-flex items-center bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 text-blue-300 text-xs font-semibold px-4 py-1.5 rounded-full mb-4">
                            <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                            Limited Time Offer
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                            Let's Build Something
                            <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mt-1">
                                Amazing Together! ✨
                            </span>
                        </h2>
                        <p className="text-gray-400 text-sm">
                            Get a free consultation and project estimate
                        </p>
                    </div>

                    {/* Form */}
                    <div className="relative px-6 pb-6">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        placeholder="Your Name *"
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                                    />
                                </div>
                                <div>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        placeholder="Email *"
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="Phone Number (Optional)"
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                                />
                            </div>

                            <div>
                                <textarea
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    required
                                    placeholder="Tell us about your project... *"
                                    rows={3}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none text-sm"
                                />
                            </div>

                            {/* Status Message */}
                            {submitStatus.message && (
                                <div className={`p-3 rounded-lg text-sm ${submitStatus.type === 'success'
                                        ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                                        : 'bg-red-500/20 text-red-300 border border-red-500/30'
                                    }`}>
                                    {submitStatus.message}
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white py-3.5 rounded-lg font-semibold transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/25 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none group"
                            >
                                <span className="relative z-10 flex items-center justify-center">
                                    {isSubmitting ? (
                                        <>
                                            <i className="ri-loader-4-line animate-spin mr-2"></i>
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            Get Free Consultation
                                            <i className="ri-arrow-right-line ml-2 group-hover:translate-x-1 transition-transform"></i>
                                        </>
                                    )}
                                </span>
                                {/* Shimmer effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                            </button>
                        </form>

                        {/* Trust badges */}
                        <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-500">
                            <div className="flex items-center">
                                <i className="ri-time-line mr-1 text-green-400"></i>
                                24hr response
                            </div>
                            <div className="flex items-center">
                                <i className="ri-shield-check-line mr-1 text-blue-400"></i>
                                100% Secure
                            </div>
                            <div className="flex items-center">
                                <i className="ri-star-line mr-1 text-yellow-400"></i>
                                150+ Projects
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Animation keyframes */}
            <style>{`
                @keyframes popupSlide {
                    0% {
                        opacity: 0;
                        transform: scale(0.8) translateY(20px);
                    }
                    100% {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }
            `}</style>
        </div>
    );
};

export default EnquiryPopup;
