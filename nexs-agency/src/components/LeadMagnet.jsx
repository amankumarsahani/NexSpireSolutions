import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LeadMagnet = ({ className = "" }) => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle'); // idle, loading, success

    const handleSubmit = (e) => {
        e.preventDefault();
        setStatus('loading');
        // Simulate API call
        setTimeout(() => {
            setStatus('success');
            setEmail('');
        }, 1500);
    };

    return (
        <section className={`py-20 relative overflow-hidden ${className}`}>
            {/* Ambient Background */}
            <div className="absolute inset-0 bg-gray-900">
                <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-blue-900/20 to-transparent"></div>
                <div className="absolute bottom-0 left-0 w-2/3 h-full bg-gradient-to-r from-purple-900/20 to-transparent"></div>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
            </div>

            <div className="container-custom relative z-10">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    {/* Visual Side */}
                    <div className="relative group">
                        <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-[2rem] blur-2xl opacity-40 group-hover:opacity-60 transition-opacity duration-1000"></div>
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            whileInView={{ y: 0, opacity: 1 }}
                            viewport={{ once: true }}
                            className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-[2rem] p-8 md:p-12 overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-50">
                                <i className="ri-file-download-line text-6xl text-white"></i>
                            </div>
                            <div className="flex items-center gap-4 mb-8">
                                <span className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded-full text-xs font-bold border border-blue-500/30 uppercase tracking-wider">
                                    Free Resource
                                </span>
                                <span className="text-gray-400 text-sm font-medium">Updated Jan 2026</span>
                            </div>
                            <h3 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
                                The 2026 <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                                    Enterprise Tech Stack
                                </span> <br />
                                Guide
                            </h3>
                            <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                                Stop guessing your architecture. Download the exact blueprint we use to scale applications to 1 million+ users. Includes React, Node.js, and AWS patterns.
                            </p>
                            <div className="flex items-center gap-6">
                                <div className="flex -space-x-4">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="w-10 h-10 rounded-full border-2 border-gray-800 bg-gray-700 flex items-center justify-center text-xs text-white">
                                            <i className="ri-user-smile-line"></i>
                                        </div>
                                    ))}
                                    <div className="w-10 h-10 rounded-full border-2 border-gray-800 bg-blue-600 flex items-center justify-center text-xs text-white font-bold">
                                        +500
                                    </div>
                                </div>
                                <span className="text-gray-400 text-sm">Download by 500+ CTOs</span>
                            </div>
                        </motion.div>
                    </div>

                    {/* Form Side */}
                    <div className="lg:pl-8">
                        {status === 'success' ? (
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="bg-green-500/10 border border-green-500/30 rounded-2xl p-8 text-center"
                            >
                                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl shadow-lg shadow-green-500/30">
                                    <i className="ri-check-line"></i>
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">Check your inbox!</h3>
                                <p className="text-green-200">
                                    We've sent the guide to <strong>{email}</strong>.
                                </p>
                            </motion.div>
                        ) : (
                            <>
                                <h4 className="text-2xl font-bold text-white mb-6">
                                    Get the PDF Guide Instantly
                                </h4>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label htmlFor="email" className="sr-only">Work Email</label>
                                        <div className="relative">
                                            <i className="ri-mail-line absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl"></i>
                                            <input
                                                type="email"
                                                id="email"
                                                required
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="Enter your work email"
                                                className="w-full pl-12 pr-4 py-4 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={status === 'loading'}
                                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white font-bold text-lg hover:shadow-lg hover:shadow-blue-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {status === 'loading' ? (
                                            <>
                                                <i className="ri-loader-4-line animate-spin text-xl"></i>
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                Download Free Guide
                                                <i className="ri-arrow-right-line"></i>
                                            </>
                                        )}
                                    </button>
                                    <p className="text-gray-500 text-sm text-center">
                                        <i className="ri-lock-line mr-1"></i>
                                        Your data is secure. Unsubscribe at any time.
                                    </p>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default LeadMagnet;
