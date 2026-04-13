import { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import Header from './Header';
import Footer from './Footer';
import EnquiryPopup from './EnquiryPopup';
import PageLoader from './PageLoader';

const PublicLayout = () => {
    const location = useLocation();

    return (
        <div className="min-h-screen bg-white overflow-x-hidden w-full">
            <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:bg-white focus:px-4 focus:py-2 focus:text-black focus:rounded focus:shadow-lg">Skip to content</a>
            <Header />
            <main id="main-content">
                <Suspense fallback={<PageLoader />}>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                        >
                            <Outlet />
                        </motion.div>
                    </AnimatePresence>
                </Suspense>
            </main>
            <Footer />
            <EnquiryPopup />
        </div>
    );
};

export default PublicLayout;

