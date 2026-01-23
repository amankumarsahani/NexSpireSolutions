import { lazy, Suspense, memo } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import ScrollReveal from './components/ScrollReveal';

// Critical components - load immediately (including all landing page sections)
import Header from './components/Header';
import Hero from './components/Hero';
import Services from './components/Services';
import About from './components/About';
import Portfolio from './components/Portfolio';
import Technologies from './components/Technologies';
import Testimonials from './components/Testimonials';
import Blog from './components/Blog';
import FAQ from './components/FAQ';
import Partners from './components/Partners';
import Contact from './components/Contact';
import Footer from './components/Footer';
import PublicLayout from './components/PublicLayout';

// Lazy load pages (route-based splitting - these actually benefit from it)
const ServicesPage = lazy(() => import('./pages/ServicesPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const PortfolioPage = lazy(() => import('./pages/PortfolioPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const BlogPage = lazy(() => import('./pages/BlogPage'));
const CRMPricingPage = lazy(() => import('./pages/CRMPricingPage'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const FAQPage = lazy(() => import('./pages/FAQPage'));
const CityLandingPage = lazy(() => import('./pages/seo/CityLandingPage'));
const CustomWebDevelopment = lazy(() => import('./pages/services/CustomWebDevelopment'));
const MobileAppDevelopment = lazy(() => import('./pages/services/MobileAppDevelopment'));
const AiMachineLearning = lazy(() => import('./pages/services/AiMachineLearning'));
const CloudSolutions = lazy(() => import('./pages/services/CloudSolutions'));
const EcommerceDevelopment = lazy(() => import('./pages/services/EcommerceDevelopment'));
const AiTrends2026 = lazy(() => import('./pages/blog/AiTrends2026'));
const ReactVsFlutter = lazy(() => import('./pages/blog/ReactVsFlutter'));
const CostOfCustomCrm = lazy(() => import('./pages/blog/CostOfCustomCrm'));
const MonolithToMicroservices = lazy(() => import('./pages/blog/MonolithToMicroservices'));
const PwaBenefits = lazy(() => import('./pages/blog/PwaBenefits'));
const BlogArticle = lazy(() => import('./pages/BlogArticle'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Loading spinner component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-indigo-900">
    <div className="flex flex-col items-center gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
      <p className="text-white/60 text-sm">Loading...</p>
    </div>
  </div>
);

// Memoized Landing Page for better performance
const LandingPage = memo(function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Nexspire Solutions - AI Software Agency & Freelance Experts in Mohali, Chandigarh</title>
        <meta name="description" content="Nexspire Solutions is a top-rated AI & custom software development agency. We are a team of expert freelancers in Mohali & Chandigarh specializing in React, Next.js, Mobile Apps, and Digital Transformation." />
        <meta name="keywords" content="AI software development, custom software agency, web development company mohali, freelance developers chandigarh, mobile app developers, digital transformation services, React developers, Next.js experts, best software agency in mohali, freelance software engineer" />
        <link rel="canonical" href="https://nexspiresolutions.co.in/" />

        {/* Open Graph */}
        <meta property="og:title" content="Nexspire Solutions - Global Tech Quality, Local Mohali Experts" />
        <meta property="og:description" content="Transform your business with AI-powered software. Top-rated freelance team in Tricity building scalable web & mobile apps." />
        <meta property="og:url" content="https://nexspiresolutions.co.in/" />
        <meta property="og:type" content="website" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Nexspire Solutions - AI Tech & Freelance Experts" />
        <meta name="twitter:description" content="Expert software engineering. AI, Cloud, Web & Mobile. Based in Mohali, serving the world." />
      </Helmet>

      {/* Hero loads immediately for faster FCP */}
      <Hero />

      {/* Sections with scroll-reveal animations (no lazy loading for reliability) */}
      <ScrollReveal animation="fade-up" delay={0}>
        <Services />
      </ScrollReveal>

      <ScrollReveal animation="fade-up" delay={100}>
        <About />
      </ScrollReveal>

      <ScrollReveal animation="zoom" delay={0}>
        <Portfolio />
      </ScrollReveal>

      <ScrollReveal animation="fade-up" delay={0}>
        <Technologies />
      </ScrollReveal>

      <ScrollReveal animation="fade-left" delay={0}>
        <Testimonials />
      </ScrollReveal>

      <ScrollReveal animation="fade-up" delay={0}>
        <Blog />
      </ScrollReveal>

      <ScrollReveal animation="fade-right" delay={0}>
        <FAQ />
      </ScrollReveal>

      <ScrollReveal animation="zoom" delay={0}>
        <Partners />
      </ScrollReveal>

      <ScrollReveal animation="fade-up" delay={0}>
        <Contact />
      </ScrollReveal>
    </div>
  );
});

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/portfolio" element={<PortfolioPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/nexcrm" element={<CRMPricingPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/software-development-company/:city" element={<CityLandingPage />} />
            <Route path="/services/custom-web-development" element={<CustomWebDevelopment />} />
            <Route path="/services/mobile-app-development" element={<MobileAppDevelopment />} />
            <Route path="/services/ai-machine-learning" element={<AiMachineLearning />} />
            <Route path="/services/cloud-solutions" element={<CloudSolutions />} />
            <Route path="/services/ecommerce-development" element={<EcommerceDevelopment />} />
            <Route path="/blog/ai-trends-2026" element={<AiTrends2026 />} />
            <Route path="/blog/react-native-vs-flutter" element={<ReactVsFlutter />} />
            <Route path="/blog/cost-of-custom-crm-2026" element={<CostOfCustomCrm />} />
            <Route path="/blog/monolith-to-microservices" element={<MonolithToMicroservices />} />
            <Route path="/blog/why-business-needs-pwa" element={<PwaBenefits />} />
            <Route path="/blog/:slug" element={<BlogArticle />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
