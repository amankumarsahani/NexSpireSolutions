import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import EnquiryPopup from './EnquiryPopup';

const PublicLayout = () => {
    return (
        <div className="min-h-screen bg-white">
            <Header />
            <main>
                <Outlet />
            </main>
            <Footer />
            <EnquiryPopup />
        </div>
    );
};

export default PublicLayout;

