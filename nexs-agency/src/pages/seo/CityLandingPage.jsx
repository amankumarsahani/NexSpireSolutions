import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import FadeIn from '../../components/ui/FadeIn';
import ReadingProgress from '../../components/ui/ReadingProgress';
import { SITE_URL } from '../../constants/siteConfig';

// City data with SEO content & Timezones
const cityData = {
    'london': {
        city: 'London',
        country: 'UK',
        timezone: 'Europe/London',
        title: 'Software Development Company in London | Nexspire',
        description: 'Nexspire Solutions provides top web, mobile, AI, cloud, and enterprise software solutions in London, UK. We serve startups and enterprises.',
        heroText: 'Digital Excellence for London\'s Finest.',
        content: 'Nexspire Solutions is a strategic technology partner for London\'s fast-moving business ecosystem. We combine British market understanding with global engineering talent to deliver software that scales.',
        services: ['Custom Web Platforms', 'Fintech & Banking Apps', 'AI-Driven Analytics', 'Cloud Migration (AWS/Azure)', 'Enterprise CRM Solutions'],
        image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&q=80&w=1200&fm=webp',
        coordinates: { lat: 51.5074, lng: -0.1278 },
        color: 'blue',
        stats: [
            { label: 'UK Clients served', value: '50+' },
            { label: 'Projects Delivered', value: '120+' },
            { label: 'Years in London', value: '4+' },
            { label: 'Support', value: '24/7' }
        ],
        whyUs: {
            title: "Why London Enterprises Choose Nexspire",
            reasons: [
                { title: "GDPR Compliance", desc: "Strict adherence to UK and EU data protection regulations.", icon: "ri-shield-keyhole-line" },
                { title: "Time Zone Aligned", desc: "Workflows synchronized with GMT for real-time collaboration.", icon: "ri-time-line" },
                { title: "Cost Efficiency", desc: "London quality standards at optimized global delivery rates.", icon: "ri-money-pound-circle-line" },
                { title: "Scalable Teams", desc: "Elastic engineering resources to match your project velocity.", icon: "ri-group-line" }
            ]
        }
    },
    'new-york': {
        city: 'New York',
        country: 'USA',
        timezone: 'America/New_York',
        title: 'Software Development Company in New York | Nexspire',
        description: 'Premier software development agency in New York. Enterprise-grade web, mobile, and AI solutions.',
        heroText: 'Engineering the Future of NYC Business.',
        content: 'In the city that never sleeps, your software needs to perform 24/7. We build robust, high-frequency, and secure systems tailored for New York\'s finance, media, and tech sectors.',
        services: ['Enterprise Web Apps', 'iOS & Android Development', 'Machine Learning Solutions', 'AWS Cloud Architecture', 'Digital Transformation'],
        image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&q=80&w=1200&fm=webp',
        coordinates: { lat: 40.7128, lng: -74.0060 },
        color: 'indigo',
        stats: [
            { label: 'US Clients served', value: '80+' },
            { label: 'Projects Delivered', value: '200+' },
            { label: 'Years in USA', value: '5+' },
            { label: 'Support', value: '24/7' }
        ],
        whyUs: {
            title: "Why NYC Businesses Partner with Nexspire",
            reasons: [
                { title: "Enterprise Grade", desc: "Security and stability for high-stakes industries.", icon: "ri-building-4-line" },
                { title: "Cutting-Edge Stack", desc: "React, Next.js, and GenAI to keep you ahead of the curve.", icon: "ri-stack-line" },
                { title: "Agile Speed", desc: "Bi-weekly sprints designed for fast-paced NYC startups.", icon: "ri-arrow-right-up-line" },
                { title: "Hybrid Delivery", desc: "Onshore management with offshore execution excellence.", icon: "ri-earth-line" }
            ]
        }
    },
    'bangalore': {
        city: 'Bangalore',
        country: 'India',
        timezone: 'Asia/Kolkata',
        title: 'Software Development Company in Bangalore | Nexspire',
        description: 'Top-rated software development company in Bangalore. Custom web, mobile, and AI solutions.',
        heroText: 'Silicon Valley Quality, Local Expertise.',
        content: 'Located in the heart of India\'s tech capital, we bring world-class engineering to local startups and enterprises. From MVP to IPO, we are the technical co-founder you need.',
        services: ['React & Next.js Development', 'Flutter & React Native Apps', 'AI & ML Integration', 'Cloud Migration', 'Startup MVP Development'],
        image: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&q=80&w=1200&fm=webp',
        coordinates: { lat: 12.9716, lng: 77.5946 },
        color: 'orange',
        stats: [
            { label: 'Startups Scaled', value: '40+' },
            { label: 'Projects Delivered', value: '150+' },
            { label: 'Expert Developers', value: '50+' },
            { label: 'Support', value: '24/7' }
        ],
        whyUs: {
            title: "Why Bangalore Startups Choose Nexspire",
            reasons: [
                { title: "Top 1% Talent", desc: "Access to the best engineering minds in the tech hub.", icon: "ri-medal-line" },
                { title: "Rapid MVPs", desc: "We specialize in taking ideas to market in record time.", icon: "ri-flashlight-line" },
                { title: "Full Cycle", desc: "Design, Development, Testing, and Deployment under one roof.", icon: "ri-recycle-line" },
                { title: "Startup Friendly", desc: "Flexible engagement models tailored for growth.", icon: "ri-shake-hands-line" }
            ]
        }
    },
    'dubai': {
        city: 'Dubai',
        country: 'UAE',
        timezone: 'Asia/Dubai',
        title: 'Software Development Company in Dubai | Nexspire',
        description: 'Leading software development company in Dubai. Web, mobile, and AI solutions for MENA.',
        heroText: 'Smart Solutions for a Smart City.',
        content: 'Nexspire Solutions empowers Dubai\'s vision with futuristic technologies. We build bilingual, compliant, and scalable digital platforms for government, retail, and real estate.',
        services: ['Arabic-Enabled Apps', 'Mobile App Development', 'Smart City AI', 'E-commerce Solutions', 'Fintech Development'],
        image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&q=80&w=1200&fm=webp',
        coordinates: { lat: 25.2048, lng: 55.2708 },
        color: 'emerald',
        stats: [
            { label: 'UAE Clients', value: '30+' },
            { label: 'Govt Projects', value: '5+' },
            { label: 'Years in MENA', value: '3+' },
            { label: 'Support', value: '24/7' }
        ],
        whyUs: {
            title: "Why Dubai Enterprises Trust Nexspire",
            reasons: [
                { title: "Localization", desc: "Fluent in Arabic/English digital experiences.", icon: "ri-translate-2" },
                { title: "Innovation Focused", desc: "Experts in Blockchain, AI, and IoT solutions.", icon: "ri-lightbulb-flash-line" },
                { title: "On-Site Support", desc: "Available for critical deployments and workshops.", icon: "ri-user-location-line" },
                { title: "Security First", desc: "Bank-grade security protocols for all applications.", icon: "ri-lock-shield-line" }
            ]
        }
    },
    'sydney': {
        city: 'Sydney',
        country: 'Australia',
        timezone: 'Australia/Sydney',
        title: 'Software Development Company in Sydney | Nexspire',
        description: 'Expert web and mobile app development in Sydney. Custom software solutions for Australian businesses.',
        heroText: 'Digital Innovation Down Under.',
        content: 'We help Australian businesses bridge the gap between concept and code. Our solutions are built to rigorous standards, ensuring reliability and scalability for the Aussie market.',
        services: ['Custom Web Development', 'iOS & Android Apps', 'Cloud Infrastructure', 'Healthcare Software', 'E-commerce Platforms'],
        image: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&q=80&w=1200&fm=webp',
        coordinates: { lat: -33.8688, lng: 151.2093 },
        color: 'cyan',
        stats: [
            { label: 'Aus Clients', value: '25+' },
            { label: 'Projects Delivered', value: '60+' },
            { label: 'Years in Region', value: '4+' },
            { label: 'Support', value: '24/7' }
        ],
        whyUs: {
            title: "Why Sydney Businesses Choose Nexspire",
            reasons: [
                { title: "Global Standards", desc: "Code quality that meets international benchmarks.", icon: "ri-global-line" },
                { title: "Regulated Industries", desc: "Experience in Fintech and Healthtech compliance.", icon: "ri-hospital-line" },
                { title: "Transparent Dev", desc: "Complete Jira/Slack access for total visibility.", icon: "ri-eye-line" },
                { title: "Long-term Partner", desc: "We support your growth well beyond launch day.", icon: "ri-plant-line" }
            ]
        }
    },
    'toronto': {
        city: 'Toronto',
        country: 'Canada',
        timezone: 'America/Toronto',
        title: 'Software Development Company in Toronto | Nexspire',
        description: 'Expert web, mobile, and AI development in Toronto. Trusted partner for Canadian tech innovation.',
        heroText: 'Tech Excellence for the North.',
        content: 'From the Financial District to the tech hubs of Waterloo, we provide the high-performance software backbone that Canadian businesses need to compete globally.',
        services: ['Web Application Development', 'Cross-Platform Mobile Apps', 'AI & Machine Learning', 'SaaS Development', 'Enterprise Solutions'],
        image: 'https://images.unsplash.com/photo-1517090504332-eac35b2cc8ab?auto=format&fit=crop&q=80&w=1200&fm=webp',
        coordinates: { lat: 43.65107, lng: -79.347015 },
        color: 'red',
        stats: [
            { label: 'Canadian Clients', value: '35+' },
            { label: 'Projects Delivered', value: '90+' },
            { label: 'Years in Canada', value: '3+' },
            { label: 'Support', value: '24/7' }
        ],
        whyUs: {
            title: "Why Toronto Innovators Partner with Nexspire",
            reasons: [
                { title: "North American Sync", desc: "Seamless collaboration across time zones.", icon: "ri-timer-flash-line" },
                { title: "AI Leadership", desc: "Leveraging Toronto's status as a global AI hub.", icon: "ri-brain-line" },
                { title: "Reliable Delivery", desc: "A proven track record of on-time deployment.", icon: "ri-checkbox-circle-line" },
                { title: "Full Stack", desc: "From UI/UX to DevOps, we handle the full stack.", icon: "ri-layers-line" }
            ]
        }
    }
};

const CityLandingPage = () => {
    const { city } = useParams();
    const data = cityData[city] || cityData['london'];

    // Live Clock State
    const [time, setTime] = useState('');
    const [greeting, setGreeting] = useState('');

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            const timeOptions = {
                timeZone: data.timezone,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
            };
            const formatter = new Intl.DateTimeFormat('en-US', timeOptions);
            setTime(formatter.format(now));

            // Set greeting based on hour in that timezone
            const hour = parseInt(new Intl.DateTimeFormat('en-US', { ...timeOptions, hour: 'numeric', hour12: false }).format(now));

            if (hour < 12) setGreeting('Good Morning');
            else if (hour < 18) setGreeting('Good Afternoon');
            else setGreeting('Good Evening');
        };

        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, [data.timezone]);

    // LocalBusiness Schema for the city
    const localBusinessSchema = {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": `Nexspire Solutions - ${data.city}`,
        "description": data.description,
        "url": `${SITE_URL}/software-development-company/${city}`,
        "telephone": "+91-7696309551",
        "email": "nexspiretechsolutions@gmail.com",
        "areaServed": data.city,
        "address": {
            "@type": "PostalAddress",
            "addressLocality": data.city,
            "addressCountry": data.country
        },
        "geo": {
            "@type": "GeoCoordinates",
            "latitude": data.coordinates?.lat,
            "longitude": data.coordinates?.lng
        },
        "serviceArea": {
            "@type": "City",
            "name": data.city
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800 selection:bg-blue-600 selection:text-white">
            <Helmet>
                <title>{data.title}</title>
                <meta name="description" content={data.description} />
                <link rel="canonical" href={`${SITE_URL}/software-development-company/${city}`} />
                <meta property="og:title" content={data.title} />
                <meta property="og:description" content={data.description} />
                <meta property="og:type" content="website" />
                <meta property="og:url" content={`${SITE_URL}/software-development-company/${city}`} />
                <meta property="og:image" content={`${SITE_URL}/og-image.jpg`} />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={data.title} />
                <meta name="twitter:description" content={data.description} />
                <script type="application/ld+json">
                    {JSON.stringify(localBusinessSchema)}
                </script>
            </Helmet>

            <ReadingProgress />

            {/* Hero */}
            <section className="pt-32 pb-16 lg:pt-40 lg:pb-20 bg-white">
                <div className="container-custom">
                    <FadeIn>
                        <p className="text-slate-500 text-lg mb-2">
                            {greeting}, {data.city} &middot; <span className="tabular-nums">{time}</span>
                        </p>
                        <h1 className="font-serif text-5xl lg:text-6xl text-slate-900 tracking-tight mb-6">
                            Software Development <br className="hidden lg:block" />in {data.city}
                        </h1>
                    </FadeIn>
                    <FadeIn delay={0.1}>
                        <p className="text-lg lg:text-xl text-slate-500 max-w-2xl leading-relaxed mb-10">
                            {data.heroText} World-class engineering tailored to your time zone and business culture.
                        </p>
                    </FadeIn>
                    <FadeIn delay={0.15}>
                        <div className="flex flex-wrap gap-4">
                            <Link
                                to="/contact"
                                className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#2563EB] text-white font-medium rounded-xl hover:bg-[#1D4ED8] transition-colors duration-200"
                            >
                                Start a project in {data.city}
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </Link>
                            <Link
                                to="/services"
                                className="inline-flex items-center gap-2 px-7 py-3.5 border border-slate-200 text-slate-700 font-medium rounded-xl hover:border-slate-300 hover:bg-slate-50 transition-colors duration-200"
                            >
                                View capabilities
                            </Link>
                        </div>
                    </FadeIn>
                </div>
            </section>

            {/* Stats Row */}
            <section className="border-t border-b border-slate-200 py-12 bg-white">
                <div className="container-custom">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                        {data.stats && data.stats.map((stat, i) => (
                            <FadeIn key={i} delay={i * 0.05}>
                                <div className="text-center">
                                    <div className="text-3xl font-semibold text-slate-900">{stat.value}</div>
                                    <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* Our Presence */}
            <section className="py-24 lg:py-32">
                <div className="container-custom">
                    <div className="grid lg:grid-cols-2 gap-16 items-start">
                        <FadeIn>
                            <h2 className="font-serif text-3xl lg:text-4xl text-slate-900 mb-6">
                                Delivering excellence in {data.city}
                            </h2>
                            <p className="text-slate-600 leading-relaxed mb-8">
                                {data.content} As your local technology partner, we bridge the gap between complex business requirements and cutting-edge digital solutions.
                            </p>

                            <div className="rounded-xl border border-slate-200 p-6">
                                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-5">
                                    Key Capabilities
                                </h3>
                                <ul className="space-y-3">
                                    {data.services.map((service, index) => (
                                        <li key={index} className="flex items-center gap-3">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] shrink-0" />
                                            <span className="text-slate-600 text-sm">{service}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </FadeIn>

                        <FadeIn delay={0.15}>
                            <div className="overflow-hidden rounded-xl">
                                <img
                                    src={data.image}
                                    alt={`${data.city} skyline`}
                                    loading="lazy"
                                    className="w-full h-auto object-cover aspect-[4/3]"
                                />
                            </div>
                        </FadeIn>
                    </div>
                </div>
            </section>

            {/* Why Us */}
            <section className="py-24 lg:py-32 bg-slate-50">
                <div className="container-custom">
                    <FadeIn>
                        <h2 className="font-serif text-3xl lg:text-4xl text-slate-900 mb-4">
                            {data.whyUs?.title}
                        </h2>
                        <p className="text-slate-500 max-w-xl mb-16">
                            The Nexspire advantage for businesses operating in {data.city}.
                        </p>
                    </FadeIn>

                    <div className="grid md:grid-cols-2 gap-6">
                        {data.whyUs?.reasons.map((reason, idx) => (
                            <FadeIn key={idx} delay={idx * 0.05}>
                                <div className="p-6 rounded-xl border border-slate-200 bg-white">
                                    <div className="flex gap-4 items-start">
                                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-lg text-[#2563EB] shrink-0">
                                            <i className={reason.icon}></i>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-slate-900 mb-1">{reason.title}</h4>
                                            <p className="text-slate-500 text-sm leading-relaxed">{reason.desc}</p>
                                        </div>
                                    </div>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-24 lg:py-32 border-t border-slate-200">
                <div className="container-custom text-center">
                    <FadeIn>
                        <p className="font-serif text-3xl lg:text-4xl text-slate-900 mb-8">
                            Ready to build in {data.city}?
                        </p>
                        <Link
                            to="/contact"
                            className="inline-flex items-center gap-2 text-[#2563EB] font-medium text-lg hover:text-[#1D4ED8] transition-colors duration-200"
                        >
                            Start your project
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </Link>
                    </FadeIn>
                </div>
            </section>
        </div>
    );
};

export default CityLandingPage;
