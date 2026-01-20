import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';

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
        image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&q=80&w=1200',
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
        image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&q=80&w=1200',
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
                { title: "Agile Speed", desc: "Bi-weekly sprints designed for fast-paced NYC startups.", icon: "ri-rocket-line" },
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
        image: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&q=80&w=1200',
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
        image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&q=80&w=1200',
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
        image: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&q=80&w=1200',
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
        image: 'https://images.unsplash.com/photo-1517090504332-eac35b2cc8ab?auto=format&fit=crop&q=80&w=1200',
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

const FadeIn = ({ children, delay = 0, className = "" }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay }}
        className={className}
    >
        {children}
    </motion.div>
);

const CityLandingPage = () => {
    const { city } = useParams();
    const data = cityData[city] || cityData['london'];

    // Live Clock State
    const [time, setTime] = useState('');
    const [greeting, setGreeting] = useState('');

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [city]);

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

    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    const y = useTransform(scrollYProgress, [0, 1], [0, 200]);

    // LocalBusiness Schema for the city
    const localBusinessSchema = {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": `Nexspire Solutions - ${data.city}`,
        "description": data.description,
        "url": `https://nexspiresolutions.co.in/software-development-company/${city}`,
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
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-600 selection:text-white overflow-hidden">
            <Helmet>
                <title>{data.title}</title>
                <meta name="description" content={data.description} />
                <link rel="canonical" href={`https://nexspiresolutions.co.in/software-development-company/${city}`} />
                <meta property="og:title" content={data.title} />
                <meta property="og:description" content={data.description} />
                <meta property="og:url" content={`https://nexspiresolutions.co.in/software-development-company/${city}`} />
                <script type="application/ld+json">
                    {JSON.stringify(localBusinessSchema)}
                </script>
            </Helmet>

            <motion.div
                className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-purple-600 origin-left z-50"
                style={{ scaleX }}
            />

            {/* Premium Live Hero Section - Removing overflow-hidden from parent to avoid clipping floating stats */}
            <div className='relative'>
                <section className="relative min-h-[90vh] flex items-center pt-20 pb-20 overflow-hidden text-white rounded-b-[4rem] z-20 bg-slate-900">
                    {/* Parallax Background */}
                    <div className="absolute inset-0 z-0 pointer-events-none">
                        <motion.div
                            style={{ y }}
                            className="w-full h-[120%]"
                        >
                            <img
                                src={data.image}
                                alt={`${data.city} Skyline`}
                                className="w-full h-full object-cover opacity-50"
                            />
                        </motion.div>

                        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-900/80 to-slate-900/95"></div>
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light"></div>

                        {/* Tech Pulse Effect Overlay */}
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/circuit-board.png')] opacity-10 animate-pulse"></div>
                    </div>

                    <div className="container-custom relative z-30 pt-10">
                        {/* Live Dashboard Header */}
                        <div className="flex justify-between items-start mb-12">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-md"
                            >
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                </span>
                                <span className="text-sm font-medium tracking-wide text-green-300">Live in {data.city}</span>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex items-center gap-4 shadow-lg hidden md:flex"
                            >
                                <div className="text-right">
                                    <div className="text-xs text-blue-200 uppercase tracking-wider font-bold">Local Time</div>
                                    <div className="text-2xl font-mono font-bold text-white tabular-nums tracking-widest leading-none">{time}</div>
                                </div>
                                <div className="w-10 h-10 rounded-xl bg-blue-600/50 flex items-center justify-center animate-pulse">
                                    <i className="ri-time-line text-xl"></i>
                                </div>
                            </motion.div>
                        </div>

                        <div className="max-w-4xl">
                            <motion.h1
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-5xl md:text-8xl font-bold tracking-tight leading-none mb-6 relative z-30"
                            >
                                <span className="block text-3xl md:text-4xl font-light text-slate-300 mb-2">{greeting}, {data.city}.</span>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
                                    We Build the Future Here.
                                </span>
                            </motion.h1>

                            <motion.p
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-xl md:text-2xl text-slate-300 max-w-2xl leading-relaxed mb-12"
                            >
                                {data.heroText} Experience world-class software engineering tailored to your time zone and business culture.
                            </motion.p>

                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="flex flex-wrap gap-4 relative z-40"
                            >
                                <Link
                                    to="/contact"
                                    className="px-8 py-4 bg-blue-600 rounded-full font-bold text-white hover:bg-blue-500 transition-all shadow-lg hover:shadow-blue-500/30 flex items-center gap-2 group"
                                >
                                    Start Project in {data.city} <i className="ri-arrow-right-line group-hover:translate-x-1 transition-transform"></i>
                                </Link>
                                <div className="px-6 py-4 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 text-slate-300 flex items-center gap-3">
                                    <i className="ri-shield-check-line text-green-400"></i>
                                    Available Now
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* Floating Stats Bar - Moved OUTSIDE hero section to prevent clipping */}
                <div className="container-custom relative z-40 -mt-20 sm:-mt-24 pointer-events-none">
                    <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-2xl p-8 md:p-10 border border-white/50 grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto hover:transform hover:-translate-y-2 transition-transform duration-500 pointer-events-auto">
                        {data.stats && data.stats.map((stat, i) => (
                            <FadeIn key={i} delay={0.3 + (i * 0.1)} className="text-center group cursor-default relative">
                                <div className="text-4xl md:text-5xl font-bold text-slate-900 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300 mb-2 font-display">
                                    {stat.value}
                                </div>
                                <div className="text-slate-500 font-bold text-xs md:text-sm uppercase tracking-widest group-hover:text-slate-800">
                                    {stat.label}
                                </div>
                                {i !== data.stats.length - 1 && (
                                    <div className="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2 w-px h-12 bg-slate-200"></div>
                                )}
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </div>

            {/* Redesigned "Our Presence" - "Strategic Hub" Section */}
            <section className="pt-32 pb-24 bg-slate-50">
                <div className="container-custom">
                    <div className="flex flex-col lg:flex-row gap-16 items-start">
                        {/* Text Content */}
                        <FadeIn className="lg:w-1/2">
                            <span className="flex items-center gap-2 text-blue-600 font-bold tracking-widest uppercase text-sm mb-4">
                                <span className="w-8 h-px bg-blue-600"></span>
                                Strategic Hub
                            </span>
                            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight mb-6">
                                Delivering Excellence in <span className="text-blue-600">{data.city}</span>.
                            </h2>
                            <p className="text-lg text-slate-600 leading-relaxed mb-8">
                                {data.content} As your local technology partner, we bridge the gap between complex business requirements and cutting-edge digital solutions.
                            </p>

                            <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5">
                                    <i className="ri-map-pin-line text-9xl"></i>
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                                    <i className="ri-briefcase-4-line text-blue-600"></i>
                                    Key Capabilities
                                </h3>
                                <div className="grid sm:grid-cols-2 gap-4 relative z-10">
                                    {data.services.map((service, index) => (
                                        <div key={index} className="flex items-start gap-3">
                                            <i className="ri-check-line text-green-500 font-bold mt-1"></i>
                                            <span className="text-slate-700 font-medium text-sm">{service}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </FadeIn>

                        {/* Visual Content - Professional "Tech Specs" Look */}
                        <FadeIn delay={0.2} className="lg:w-1/2 w-full">
                            <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl bg-slate-900 min-h-[500px] border-4 border-white">
                                <img
                                    src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1200"
                                    alt="Corporate Architecture"
                                    className="absolute inset-0 w-full h-full object-cover opacity-40 hover:scale-105 transition-transform duration-700"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent"></div>

                                <div className="absolute bottom-0 left-0 p-8 w-full">
                                    <div className="glass-card bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
                                                <i className="ri-global-line text-2xl"></i>
                                            </div>
                                            <div>
                                                <p className="font-bold text-white text-lg">Global Standards</p>
                                                <p className="text-sm text-blue-200">ISO 27001 Certified Processes</p>
                                            </div>
                                        </div>
                                        <div className="h-px bg-white/10 my-4"></div>
                                        <div className="flex justify-between items-center">
                                            <div className="text-center">
                                                <p className="text-2xl font-bold text-white">100%</p>
                                                <p className="text-[10px] uppercase tracking-wider text-slate-300">On-Time</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-2xl font-bold text-white">4.9</p>
                                                <p className="text-[10px] uppercase tracking-wider text-slate-300">Client Rating</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-2xl font-bold text-white">24h</p>
                                                <p className="text-[10px] uppercase tracking-wider text-slate-300">Turnaround</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </FadeIn>
                    </div>
                </div>
            </section>

            {/* Why Us Grid */}
            <section className="py-24 bg-white relative overflow-hidden">
                <div className="absolute inset-0 bg-slate-50/50 -skew-y-3 transform origin-top-left scale-110"></div>

                <div className="container-custom relative z-10">
                    <div className="text-center mb-20">
                        <span className="text-blue-600 font-bold tracking-widest uppercase text-sm">The Nexspire Advantage</span>
                        <h2 className="text-4xl font-bold mt-2 text-slate-900">{data.whyUs?.title}</h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {data.whyUs?.reasons.map((reason, idx) => (
                            <FadeIn key={idx} delay={idx * 0.1} className="group p-8 rounded-[2rem] bg-white border border-slate-100 hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 transition-all duration-300">
                                <div className="flex gap-6 items-start">
                                    <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-3xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shrink-0">
                                        <i className={reason.icon}></i>
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-bold text-slate-900 mb-3">{reason.title}</h4>
                                        <p className="text-slate-600 leading-relaxed group-hover:text-slate-700 transition-colors">
                                            {reason.desc}
                                        </p>
                                    </div>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 bg-slate-900 text-white text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-soft-light"></div>
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>

                <div className="container-custom relative z-10">
                    <h2 className="text-5xl md:text-6xl font-bold mb-8 tracking-tight">
                        Ready to Build in {data.city}?
                    </h2>
                    <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
                        Join the hundreds of successful businesses that trust Nexspire for their mission-critical software.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-6 justify-center">
                        <Link
                            to="/contact"
                            className="inline-flex items-center justify-center gap-4 px-10 py-5 bg-blue-600 text-white rounded-full text-lg font-bold hover:bg-blue-500 shadow-lg hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105"
                        >
                            Start Your Project
                            <i className="ri-arrow-right-line"></i>
                        </Link>
                        <Link
                            to="/services"
                            className="inline-flex items-center justify-center gap-4 px-10 py-5 bg-white/10 text-white border border-white/10 backdrop-blur-sm rounded-full text-lg font-bold hover:bg-white/20 transition-all duration-300"
                        >
                            View Capabilities
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default CityLandingPage;
