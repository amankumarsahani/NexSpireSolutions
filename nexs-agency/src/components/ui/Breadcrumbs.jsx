import { Link, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { SITE_URL } from '../../constants/siteConfig';

const routeNames = {
    'services': 'Services',
    'about': 'About',
    'portfolio': 'Portfolio',
    'contact': 'Contact',
    'blog': 'Blog',
    'faq': 'FAQ',
    'nexcrm': 'NexCRM',
    'privacy-policy': 'Privacy Policy',
    'terms': 'Terms of Service',
    'custom-web-development': 'Custom Web Development',
    'mobile-app-development': 'Mobile App Development',
    'ai-machine-learning': 'AI & Machine Learning',
    'cloud-solutions': 'Cloud Solutions',
    'ecommerce-development': 'E-commerce Development',
    'software-development-company': 'Software Development'
};

export default function Breadcrumbs({ className = '' }) {
    const location = useLocation();
    const pathnames = location.pathname.split('/').filter(x => x);

    if (pathnames.length === 0) return null;

    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": `${SITE_URL}/`
            },
            ...pathnames.map((name, index) => {
                const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
                const displayName = routeNames[name] || name.split('-').map(
                    word => word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ');
                return {
                    "@type": "ListItem",
                    "position": index + 2,
                    "name": displayName,
                    "item": `${SITE_URL}${routeTo}`
                };
            })
        ]
    };

    return (
        <>
            <Helmet>
                <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
            </Helmet>
            <nav className={`flex items-center gap-2 text-sm ${className}`} aria-label="Breadcrumb">
            <Link
                to="/"
                className="text-slate-500 hover:text-[#6D28D9] transition-colors flex items-center gap-1"
            >
                <i className="ri-home-4-line"></i>
                <span className="hidden sm:inline">Home</span>
            </Link>

            {pathnames.map((name, index) => {
                const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
                const isLast = index === pathnames.length - 1;
                const displayName = routeNames[name] || name.split('-').map(
                    word => word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ');

                return (
                    <span key={name} className="flex items-center gap-2">
                        <i className="ri-arrow-right-s-line text-gray-300"></i>
                        {isLast ? (
                            <span className="text-slate-800 font-medium truncate max-w-[200px]">
                                {displayName}
                            </span>
                        ) : (
                            <Link
                                to={routeTo}
                                className="text-slate-500 hover:text-[#6D28D9] transition-colors"
                            >
                                {displayName}
                            </Link>
                        )}
                    </span>
                );
            })}
            </nav>
        </>
    );
}
