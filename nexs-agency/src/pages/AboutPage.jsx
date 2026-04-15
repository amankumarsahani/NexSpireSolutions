import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import officeImg from '../assets/office_collaboration.png';
import Timeline from '../components/Timeline';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import BackToTop from '../components/ui/BackToTop';
import ReadingProgress from '../components/ui/ReadingProgress';
import { SITE_URL } from '../constants/siteConfig';

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

const stats = [
    { label: "Years", value: "5+" },
    { label: "Projects", value: "150+" },
    { label: "Clients", value: "50+" },
    { label: "Retention", value: "98%" }
];

const AboutPage = () => {
    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800 selection:bg-blue-600 selection:text-white">
            <Helmet>
                <title>About Us | Nexspire Solutions</title>
                <meta name="description" content="Nexspire Solutions is a software development agency founded in 2020. We build web, mobile, AI, and cloud solutions for clients worldwide." />
                <link rel="canonical" href={`${SITE_URL}/about`} />
                <meta property="og:title" content="About Us | Nexspire Solutions" />
                <meta property="og:description" content="Software development agency founded in 2020. Web, mobile, AI, and cloud solutions." />
                <meta property="og:type" content="website" />
                <meta property="og:url" content={`${SITE_URL}/about`} />
                <meta property="og:image" content={`${SITE_URL}/og-image.jpg`} />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="About Us | Nexspire Solutions" />
                <meta name="twitter:description" content="Software development agency founded in 2020. Web, mobile, AI, and cloud solutions." />
                <script type="application/ld+json">{JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "Organization",
                    "name": "Nexspire Solutions",
                    "url": SITE_URL,
                    "logo": `${SITE_URL}/og-image.jpg`,
                    "foundingDate": "2020",
                    "email": "nexspiretechsolutions@gmail.com",
                    "telephone": "+919729916844",
                    "sameAs": [
                        "https://github.com/orgs/Nexspire-Solutions/repositories",
                        "https://www.linkedin.com/company/nexspire-solution",
                        "https://www.instagram.com/nexspire_solutions/"
                    ]
                })}</script>
            </Helmet>

            <ReadingProgress />

            <section className="pt-32 pb-16 lg:pt-40 lg:pb-20 bg-white">
                <div className="container-custom">
                    <Breadcrumbs />
                    <FadeIn>
                        <h1 className="font-serif text-5xl lg:text-6xl text-slate-900 tracking-tight mt-8 mb-6">
                            About Us
                        </h1>
                    </FadeIn>
                    <FadeIn delay={0.1}>
                        <p className="text-lg lg:text-xl text-slate-500 max-w-2xl leading-relaxed">
                            A software agency that cares about craft. Founded in 2020, based in Mohali, working with clients worldwide.
                        </p>
                    </FadeIn>
                </div>
            </section>

            <section className="py-12 bg-white border-b border-slate-200">
                <div className="container-custom">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {stats.map((stat, i) => (
                            <FadeIn key={stat.label} delay={i * 0.05}>
                                <div className="text-center">
                                    <div className="text-3xl font-semibold text-slate-900">{stat.value}</div>
                                    <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            <section className="py-24 lg:py-32">
                <div className="container-custom">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <FadeIn>
                            <div className="overflow-hidden rounded-xl">
                                <img
                                    src={officeImg}
                                    alt="Nexspire team collaborating"
                                    loading="lazy"
                                    className="w-full h-auto object-cover"
                                />
                            </div>
                        </FadeIn>

                        <div className="space-y-8">
                            <FadeIn>
                                <h2 className="font-serif text-3xl lg:text-4xl text-slate-900 mb-4">How we started</h2>
                                <p className="text-slate-600 leading-relaxed">
                                    Nexspire began in 2020 as a small team of engineers and designers who believed software development
                                    could be done better. We were tired of agencies that over-promise and under-deliver, so we
                                    built one focused on honest work and real results.
                                </p>
                            </FadeIn>

                            <FadeIn delay={0.1}>
                                <h2 className="font-serif text-3xl lg:text-4xl text-slate-900 mb-4">What we believe</h2>
                                <p className="text-slate-600 leading-relaxed">
                                    Good software is built by small teams that care deeply about their craft. We keep our team lean,
                                    our communication direct, and our code clean. Every project gets senior-level attention from
                                    day one — no hand-offs to junior devs.
                                </p>
                            </FadeIn>
                        </div>
                    </div>
                </div>
            </section>

            <Timeline />

            <section className="py-24 lg:py-32 border-t border-slate-200">
                <div className="container-custom text-center">
                    <FadeIn>
                        <p className="font-serif text-3xl lg:text-4xl text-slate-900 mb-8">
                            Want to work together?
                        </p>
                        <Link
                            to="/contact"
                            className="inline-flex items-center gap-2 text-[#2563EB] font-medium text-lg hover:text-[#1D4ED8] transition-colors duration-200"
                        >
                            Get in touch
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </Link>
                    </FadeIn>
                </div>
            </section>

            <BackToTop />
        </div>
    );
};

export default AboutPage;
