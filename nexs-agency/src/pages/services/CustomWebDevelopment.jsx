import ServicePageTemplate from '../../components/ServicePageTemplate';

const data = {
    themeColor: 'teal',
    badge: { icon: 'ri-code-s-slash-line', label: 'Web Engineering' },
    hero: {
        h1Line1: 'Scalable',
        h1Line2: 'Web Applications.',
        gradient: 'from-[#6D28D9] to-[#5B21B6]',
        paragraph: 'We define the digital standard for your business with robust, secure, and high-performance web solutions tailored to your unique goals.',
        ctaText: 'Start Project',
        bgImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa',
        bgImageAlt: 'Background',
    },
    overview: {
        h2: 'Built for Scale. <br /> Designed for Growth.',
        paragraph: "Off-the-shelf software often creates more problems than it solves. We build custom platforms that fit your business logic perfectly, allowing you to innovate without constraints.",
        checklist: [
            'Single Page Applications (SPAs)',
            'Progressive Web Apps (PWAs)',
            'Enterprise SaaS Platforms',
            'Complex Dashboards & Portals',
        ],
        bento: {
            largeImage: {
                src: 'https://images.unsplash.com/photo-1555099962-4199c345e5dd?q=80&w=2070&auto=format&fit=crop&fm=webp',
                alt: 'Coding Interface',
                label: 'Code Excellence',
            },
            smallImage: {
                src: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2015&auto=format&fit=crop&fm=webp',
                alt: 'Analytics Dashboard',
            },
            stat: { value: '99%', label: 'Uptime Guarantee' },
        },
    },
    capabilities: [
        {
            title: 'Frontend Architecture',
            description: 'Pixel-perfect, responsive interfaces built with React and Next.js for maximum performance and SEO.',
            tech: ['React.js', 'Next.js', 'Tailwind Connectivity', 'Framer Motion'],
            icon: 'ri-layout-masonry-line',
            color: 'blue',
        },
        {
            title: 'Backend Engineering',
            description: 'Scalable server-side solutions designed to handle high concurrency and complex business logic.',
            tech: ['Node.js', 'Python', 'PostgreSQL', 'Redis'],
            icon: 'ri-server-line',
            color: 'purple',
        },
        {
            title: 'API Development',
            description: 'Secure RESTful and GraphQL APIs that seamlessly connect your applications with third-party services.',
            tech: ['GraphQL', 'REST', 'Stripe Integration', 'Auth0'],
            icon: 'ri-links-line',
            color: 'emerald',
        },
        {
            title: 'Cloud Infrastructure',
            description: 'Automated CI/CD pipelines and serverless architectures for rapid, reliable deployment.',
            tech: ['AWS', 'Docker', 'Kubernetes', 'Terraform'],
            icon: 'ri-cloud-windy-line',
            color: 'cyan',
        },
    ],
    capabilitiesSection: { label: 'Technical Expertise', title: 'Full-Stack Excellence' },
    bottomSection: { title: 'More Solutions', currentService: 'Custom Web Development' },
    cta: {
        h2: 'Ready to Build?',
        paragraph: "Let's turn your concept into a high-performing digital product.",
        buttonText: 'Get Your Free Quote',
    },
    seo: {
        title: 'Custom Web Development Services | Enterprise Solutions',
        description: 'Build scalable, high-performance web applications with Nexspire. Expert React, Next.js, and Node.js developers delivering custom solutions for global brands.',
        canonicalPath: '/services/custom-web-development',
        ogTitle: 'Custom Web Development Services | Enterprise Solutions',
        ogDescription: 'Build scalable, high-performance web applications with Nexspire. Expert React, Next.js, and Node.js developers.',
        twitterTitle: 'Custom Web Development Services | Enterprise Solutions',
        twitterDescription: 'Build scalable, high-performance web applications with Nexspire. Expert React, Next.js, and Node.js developers.',
    },
    schema: {
        name: 'Custom Web Development',
        description: 'Enterprise-grade custom web application development services using React, Next.js, and Node.js.',
    },
};

export default function CustomWebDevelopment() {
    return <ServicePageTemplate data={data} />;
}
