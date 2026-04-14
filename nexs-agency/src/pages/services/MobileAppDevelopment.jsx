import ServicePageTemplate from '../../components/ServicePageTemplate';

const data = {
    themeColor: 'teal',
    badge: { icon: 'ri-smartphone-line', label: 'Mobile Engineering' },
    hero: {
        h1Line1: 'Apps That Users',
        h1Line2: 'Actually Love.',
        gradient: 'from-[#2563EB] to-[#1D4ED8]',
        paragraph: 'From native iOS/Android to high-performance cross-platform solutions, we build mobile experiences that drive engagement and retention.',
        ctaText: 'Discuss Your App',
        bgImage: 'https://images.unsplash.com/photo-1551650975-87deedd944c3',
        bgImageAlt: 'Mobile Development Background',
    },
    overview: {
        h2: 'Mobile First. <br /> User Centric.',
        paragraph: "With billions of smartphone users worldwide, a mobile presence is no longer optional. But simply having an app isn\u2019t enough\u2014it needs to be fast, intuitive, and flawless.",
        checklist: [
            'Seamless UI/UX Design',
            'Offline Functionality',
            'Push Notification Strategy',
            'Secure Biometric Auth',
        ],
        bento: {
            largeImage: {
                src: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&q=80&w=800&fm=webp',
                alt: 'Mobile UI Design',
                label: 'Intuitive Interfaces',
            },
            smallImage: {
                src: 'https://images.unsplash.com/photo-1555774698-0b77e0d5fac6?auto=format&fit=crop&q=80&w=800&fm=webp',
                alt: 'Phone Mockup',
            },
            stat: { value: '4.8', label: 'Avg App Store Rating' },
        },
    },
    capabilities: [
        {
            title: 'iOS Development',
            description: 'Native iOS applications written in Swift/SwiftUI that deliver seamless performance on all Apple devices.',
            tech: ['Swift', 'SwiftUI', 'Xcode', 'TestFlight'],
            icon: 'ri-apple-fill',
            color: 'slate',
        },
        {
            title: 'Android Development',
            description: 'Robust Android apps built with Kotlin to reach the widest possible global audience.',
            tech: ['Kotlin', 'Jetpack Compose', 'Android Studio'],
            icon: 'ri-android-fill',
            color: 'green',
        },
        {
            title: 'Cross-Platform (Flutter)',
            description: 'Build once, deploy everywhere. High-fidelity apps for iOS and Android using a single codebase.',
            tech: ['Flutter', 'Dart', 'Firebase', 'GetX'],
            icon: 'ri-flutter-fill',
            color: 'blue',
        },
        {
            title: 'React Native',
            description: 'Leverage your web team\'s skills to build native mobile experiences using React.',
            tech: ['React Native', 'Expo', 'Redux', 'NativeBase'],
            icon: 'ri-reactjs-line',
            color: 'cyan',
        },
    ],
    capabilitiesSection: { label: 'Tech Stack', title: 'Native & Cross-Platform' },
    bottomSection: { title: 'Related Services', currentService: 'Mobile App Development' },
    cta: {
        h2: 'Have an App Idea?',
        paragraph: 'From MVP to App Store launch, we handle the entire lifecycle.',
        buttonText: 'Launch Your App',
    },
    seo: {
        title: 'Mobile App Development Services | iOS & Android',
        description: 'Create engaging native and cross-platform mobile apps with Nexspire. Expert Flutter, React Native, and Swift developers.',
        canonicalPath: '/services/mobile-app-development',
        ogTitle: 'Mobile App Development Services | iOS & Android',
        ogDescription: 'Create engaging native and cross-platform mobile apps with Nexspire. Expert Flutter, React Native, and Swift developers.',
        twitterTitle: 'Mobile App Development Services | iOS & Android',
        twitterDescription: 'Create engaging native and cross-platform mobile apps with Nexspire. Expert Flutter, React Native, and Swift developers.',
    },
    schema: {
        name: 'Mobile App Development',
        description: 'Expert mobile app development services for iOS and Android using Swift, Kotlin, Flutter, and React Native.',
    },
};

export default function MobileAppDevelopment() {
    return <ServicePageTemplate data={data} />;
}
