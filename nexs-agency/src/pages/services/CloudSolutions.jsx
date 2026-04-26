import ServicePageTemplate from '../../components/ServicePageTemplate';

const data = {
    themeColor: 'teal',
    badge: { icon: 'ri-cloud-windy-line', label: 'Cloud Infrastructure' },
    hero: {
        h1Line1: 'Scale Without',
        h1Line2: 'Limits.',
        gradient: 'from-[#2563EB] to-[#1D4ED8]',
        paragraph: 'Build, deploy, and manage your applications with the speed and reliability of modern cloud infrastructure.',
        ctaText: 'Plan Your Migration',
        bgImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa',
        bgImageAlt: 'Background',
    },
    overview: {
        h2: 'Agility. Security. <br /> Cost Efficiency.',
        paragraph: "The cloud isn\u2019t just a place to store data; it\u2019s an innovation engine. We help you leverage the full power of AWS, Azure, and GCP to build resilient systems that grow with your business.",
        checklist: [
            '99.99% Uptime Architectures',
            'Auto-Scaling Infrastructure',
            'Disaster Recovery Planning',
            'Cost Optimization Audits',
        ],
        bento: {
            largeImage: {
                src: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&q=80&w=800&fm=webp',
                alt: 'Server Room',
                label: 'Secure Infrastructure',
            },
            smallImage: {
                src: 'https://images.unsplash.com/photo-1667372393119-c85c020799a3?auto=format&fit=crop&q=80&w=800&fm=webp',
                alt: 'Cloud Data',
            },
            stat: { value: '99.9%', label: 'Uptime SLA' },
        },
    },
    capabilities: [
        {
            title: 'Cloud Migration',
            description: 'Seamlessly move your legacy infrastructure to the cloud with zero downtime strategies.',
            tech: ['AWS Migration Hub', 'Azure Migrate', 'VMware'],
            icon: 'ri-upload-cloud-2-line',
            color: 'blue',
        },
        {
            title: 'DevOps Automation',
            description: 'Accelerate delivery with CI/CD pipelines, Infrastructure as Code, and automated testing.',
            tech: ['Jenkins', 'GitHub Actions', 'Terraform', 'Ansible'],
            icon: 'ri-loop-right-line',
            color: 'orange',
        },
        {
            title: 'Serverless Architecture',
            description: 'Reduce costs and operational overhead by moving to event-driven, serverless computing.',
            tech: ['AWS Lambda', 'Azure Functions', 'Google Cloud Run'],
            icon: 'ri-server-line',
            color: 'purple',
        },
        {
            title: 'Cloud Security',
            description: 'Implement banking-grade security, compliance monitoring, and identity management.',
            tech: ['IAM', 'WAF', 'Shield', 'CloudTrail'],
            icon: 'ri-shield-check-line',
            color: 'cyan',
        },
    ],
    capabilitiesSection: { label: 'Our Expertise', title: 'DevOps & Cloud' },
    bottomSection: { title: 'Related Services', currentService: 'Cloud Solutions' },
    cta: {
        h2: 'Ready to Migrate?',
        paragraph: 'Optimize your cloud infrastructure for speed, security, and cost.',
        buttonText: 'Get Your Free Audit',
    },
    seo: {
        title: 'Cloud Solutions & DevOps Services | AWS & Azure Experts',
        description: 'Scale your business with expert Cloud and DevOps services from Nexspire. Security, migration, and automation on AWS, Azure, and GCP.',
        keywords: 'cloud solutions India, AWS cloud services, cloud migration, DevOps services Mohali, cloud infrastructure management, serverless architecture India, cloud consulting',
        canonicalPath: '/services/cloud-solutions',
        ogTitle: 'Cloud Solutions & DevOps Services | AWS & Azure Experts',
        ogDescription: 'Scale your business with expert Cloud and DevOps services from Nexspire. Security, migration, and automation on AWS, Azure, and GCP.',
        twitterTitle: 'Cloud Solutions & DevOps Services | AWS & Azure Experts',
        twitterDescription: 'Scale your business with expert Cloud and DevOps services from Nexspire. Security, migration, and automation on AWS, Azure, and GCP.',
    },
    schema: {
        name: 'Cloud Solutions & DevOps',
        description: 'Expert Cloud and DevOps services. AWS, Azure, Google Cloud migration and management.',
    },
};

export default function CloudSolutions() {
    return <ServicePageTemplate data={data} />;
}
