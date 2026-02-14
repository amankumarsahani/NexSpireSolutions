import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import EnquiryPopup from './EnquiryPopup';
import PageLoader from './PageLoader';

const PublicLayout = () => {
    return (
        <div className="min-h-screen bg-white overflow-x-hidden w-full">
            <Header />
            <main>
                <Suspense fallback={<PageLoader />}>
                    <Outlet />
                </Suspense>
            </main>
            <Footer />
            <EnquiryPopup />
        </div>
    );
};

export default PublicLayout;

