import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';

const NotFound = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4 bg-white relative overflow-hidden">
            <Helmet>
                <title>404 - Page Not Found | Nexspire Solutions</title>
                <meta name="robots" content="noindex, nofollow" />
            </Helmet>

            {/* Background elements */}
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#6D28D9]/10 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
            <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="relative z-10"
            >
                <h1 className="text-9xl md:text-[12rem] font-bold text-[#6D28D9] mb-0 leading-none select-none">
                    404
                </h1>
            </motion.div>

            <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-3xl md:text-4xl font-bold text-slate-800 mb-6 relative z-10"
            >
                Lost in the Digital Space?
            </motion.h2>

            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-slate-600 max-w-lg mx-auto mb-10 text-lg relative z-10 leading-relaxed"
            >
                The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
            </motion.p>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex flex-wrap gap-4 justify-center relative z-10"
            >
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition-all duration-300 shadow-lg shadow-lg "
                >
                    <i className="ri-home-4-line"></i>
                    Back to Home
                </Link>
                <Link
                    to="/services"
                    className="inline-flex items-center gap-2 px-8 py-3 bg-white text-slate-600 border border-slate-200 rounded-full font-semibold hover:bg-[#FAF9F6] transition-all duration-300 "
                >
                    <i className="ri-compass-3-line"></i>
                    Explore Services
                </Link>
            </motion.div>
        </div>
    );
};

export default NotFound;
