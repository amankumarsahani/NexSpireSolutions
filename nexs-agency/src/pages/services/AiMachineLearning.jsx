import ServicePageTemplate from '../../components/ServicePageTemplate';

const data = {
    themeColor: 'teal',
    badge: { icon: 'ri-brain-line', label: 'Artificial Intelligence' },
    hero: {
        h1Line1: 'Intelligence,',
        h1Line2: 'Integrated.',
        gradient: 'from-[#6D28D9] to-[#5B21B6]',
        paragraph: 'Transform your business with next-gen AI. From automating workflows to predicting market trends, we build intelligent systems that drive value.',
        ctaText: 'Consult AI Expert',
        bgImage: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485',
        bgImageAlt: 'AI Background',
    },
    overview: {
        h2: 'Data into Decisions. <br /> Automation into Art.',
        paragraph: 'The future belongs to businesses that leverage data. We help you move beyond hype and implement practical, high-ROI AI solutions that integrate seamlessly with your existing infrastructure.',
        checklist: [
            'Custom Large Language Models (LLMs)',
            'Automated Customer Support',
            'Sales Forecasting Engines',
            'Intelligent Document Processing',
        ],
        bento: {
            largeImage: {
                src: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800&fm=webp',
                alt: 'AI Network',
                label: 'Predictive Power',
            },
            smallImage: {
                src: 'https://images.unsplash.com/photo-1555255707-c07966088b7b?auto=format&fit=crop&q=80&w=800&fm=webp',
                alt: 'Data Visualization',
            },
            stat: { value: '40%', label: 'Efficiency Boost' },
        },
    },
    capabilities: [
        {
            title: 'Generative AI',
            description: 'Custom LLM integration and fine-tuning. Build your own ChatGPT-like assistants for internal data.',
            tech: ['OpenAI API', 'Llama 2', 'LangChain', 'Vector DBs'],
            icon: 'ri-openai-fill',
            color: 'emerald',
        },
        {
            title: 'Predictive Analytics',
            description: 'Turn historical data into future insights. Forecast sales, churn, and market trends with high accuracy.',
            tech: ['Python', 'scikit-learn', 'TensorFlow', 'Pandas'],
            icon: 'ri-line-chart-line',
            color: 'blue',
        },
        {
            title: 'Computer Vision',
            description: 'Automate visual inspections, facial recognition, and object detection using state-of-the-art CNNs.',
            tech: ['OpenCV', 'YOLO', 'PyTorch'],
            icon: 'ri-camera-lens-line',
            color: 'purple',
        },
        {
            title: 'NLP & Chatbots',
            description: 'Intelligent customer service agents that understand context, sentiment, and intent.',
            tech: ['NLTK', 'SpaCy', 'Dialogflow', 'RASA'],
            icon: 'ri-chat-voice-line',
            color: 'cyan',
        },
    ],
    capabilitiesSection: { label: 'Our Capabilities', title: 'AI Innovation' },
    bottomSection: { title: 'Service Integration', currentService: 'AI & Machine Learning' },
    cta: {
        h2: 'Ready to Automate?',
        paragraph: 'Discover how AI can reduce costs and increase revenue for your business.',
        buttonText: 'Explore AI Solutions',
    },
    seo: {
        title: 'AI & Machine Learning Services | Generative AI Solutions',
        description: 'Unlock the power of AI with Nexspire Solutions. Custom Machine Learning, Generative AI, and Predictive Analytics for enterprise growth.',
        canonicalPath: '/services/ai-machine-learning',
        ogTitle: 'AI & Machine Learning Services | Generative AI Solutions',
        ogDescription: 'Unlock the power of AI with Nexspire Solutions. Custom Machine Learning, Generative AI, and Predictive Analytics.',
        twitterTitle: 'AI & Machine Learning Services | Generative AI Solutions',
        twitterDescription: 'Unlock the power of AI with Nexspire Solutions. Custom Machine Learning, Generative AI, and Predictive Analytics.',
    },
    schema: {
        name: 'AI & Machine Learning Services',
        description: 'Enterprise AI and Machine Learning development services. Generative AI, Predictive Analytics, and Computer Vision solutions.',
    },
};

export default function AiMachineLearning() {
    return <ServicePageTemplate data={data} />;
}
