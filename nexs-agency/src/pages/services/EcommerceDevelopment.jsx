import ServicePageTemplate from '../../components/ServicePageTemplate';

const data = {
    themeColor: 'orange',
    badge: { icon: 'ri-shopping-cart-2-line', label: 'Digital Commerce' },
    hero: {
        h1Line1: 'Sell Smarter.',
        h1Line2: 'Grow Faster.',
        gradient: 'from-orange-400 via-red-400 to-pink-400',
        paragraph: 'We build data-driven e-commerce experiences that turn visitors into loyal customers. From headless storefronts to complex marketplaces.',
        ctaText: 'Start Selling',
        bgImage: 'https://images.unsplash.com/photo-1556742049-0cfed4f7a07d',
        bgImageAlt: 'Ecommerce Background',
    },
    overview: {
        h2: 'Experience-Led. <br /> Conversion-Focused.',
        paragraph: "In a crowded market, generic stores don\u2019t cut it. We design unique shopping journeys that reflect your brand and remove friction at every touchpoint.",
        checklist: [
            'High-Performance Storefronts',
            'Seamless Payment Integration',
            'Inventory Management Sync',
            'Loyalty Program Systems',
        ],
        bento: {
            largeImage: {
                src: 'https://images.unsplash.com/photo-1601933973783-43cf8a7d4c5f?auto=format&fit=crop&q=80&w=800&fm=webp',
                alt: 'Online Shopping',
                label: 'Seamless Checkout',
            },
            smallImage: {
                src: 'https://images.unsplash.com/photo-1556742031-c6961e8560b0?auto=format&fit=crop&q=80&w=800&fm=webp',
                alt: 'Payment Terminal',
            },
            stat: { value: '3x', label: 'Conversion Rate' },
        },
    },
    capabilities: [
        {
            title: 'Custom Shopify',
            description: "Bespoke Shopify Plus themes and private apps that push the boundaries of what\u2019s possible.",
            tech: ['Liquid', 'Hydrogen', 'Shopify CLI', 'Storefront API'],
            icon: 'ri-shopping-bag-3-line',
            color: 'green',
        },
        {
            title: 'WooCommerce',
            description: 'Scalable WordPress-based stores with custom plugin development and performance optimization.',
            tech: ['PHP', 'WordPress', 'MySQL', 'Redis'],
            icon: 'ri-wordpress-fill',
            color: 'blue',
        },
        {
            title: 'Marketplace Development',
            description: 'Complex multi-vendor platforms like Amazon or Etsy, built for high transaction volumes.',
            tech: ['Next.js', 'Stripe Connect', 'PostgreSQL', 'Elasticsearch'],
            icon: 'ri-store-3-line',
            color: 'orange',
        },
        {
            title: 'Headless Commerce',
            description: 'Decoupled frontend experiences powered by best-in-class commerce backends.',
            tech: ['Medusa.js', 'Contentful', 'Sanity', 'Vercel'],
            icon: 'ri-rocket-line',
            color: 'purple',
        },
    ],
    capabilitiesSection: { label: 'Our Expertise', title: 'Commerce Solutions' },
    bottomSection: { title: 'Related Services', currentService: 'E-commerce Development' },
    cta: {
        h2: 'Ready to Scale?',
        paragraph: 'Build an online store that delivers results.',
        buttonText: 'Get Your Free Quote',
    },
    seo: {
        title: 'E-commerce Development Services | Shopify & Custom Stores',
        description: 'Build high-conversion online stores with Nexspire. Experts in Shopify, WooCommerce, and Headless Commerce solutions.',
        canonicalPath: '/services/ecommerce-development',
        ogTitle: 'E-commerce Development Services | Shopify & Custom Stores',
        ogDescription: 'Build high-conversion online stores with Nexspire. Experts in Shopify, WooCommerce, and Headless Commerce solutions.',
        twitterTitle: 'E-commerce Development Services | Shopify & Custom Stores',
        twitterDescription: 'Build high-conversion online stores with Nexspire. Experts in Shopify, WooCommerce, and Headless Commerce solutions.',
    },
    schema: {
        name: 'E-commerce Development',
        description: 'Expert E-commerce development services. Shopify, WooCommerce, and Custom Marketplaces.',
    },
};

export default function EcommerceDevelopment() {
    return <ServicePageTemplate data={data} />;
}
