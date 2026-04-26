import { lazy, memo, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { SITE_URL } from './constants/siteConfig';
import { useAuth } from './context/AuthContext';
import ScrollToTop from './components/ScrollToTop';
import ErrorBoundary from './components/ErrorBoundary';

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
const NexCRMLandingPage = lazy(() => import('./pages/NexCRMLandingPage'));
const CRMPricingPage = lazy(() => import('./pages/CRMPricingPage'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const FAQPage = lazy(() => import('./pages/FAQPage'));
const CityLandingPage = lazy(() => import('./pages/seo/CityLandingPage'));
const IndustryLandingPage = lazy(() => import('./pages/IndustryLandingPage'));
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
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));
const NotFound = lazy(() => import('./pages/NotFound'));
const AdminBackupsPage = lazy(() => import('./pages/AdminBackupsPage'));

// Loading spinner component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
    <div className="flex flex-col items-center gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2563EB]"></div>
      <p className="text-slate-500 text-sm">Loading...</p>
    </div>
  </div>
);

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading, user } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (!user?.role || user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

// Memoized Landing Page for better performance
const LandingPage = memo(function LandingPage() {
  return (
    <div className="min-h-screen bg-white w-full overflow-x-hidden">
      <Helmet>
        <title>Nexspire Solutions - AI Software Agency & Freelance Experts in Mohali, Chandigarh</title>
        <meta name="description" content="Nexspire Solutions is a top-rated AI & custom software development agency. We are a team of expert freelancers in Mohali & Chandigarh specializing in React, Next.js, Mobile Apps, and Digital Transformation." />
        <meta name="keywords" content="AI software development, custom software agency, web development company mohali, freelance developers chandigarh, mobile app developers, digital transformation services, React developers, Next.js experts, best software agency in mohali, freelance software engineer" />
        <link rel="canonical" href={`${SITE_URL}/`} />

        {/* Open Graph */}
        <meta property="og:title" content="Nexspire Solutions - Global Tech Quality, Local Mohali Experts" />
        <meta property="og:description" content="Transform your business with AI-powered software. Top-rated freelance team in Tricity building scalable web & mobile apps." />
        <meta property="og:url" content={`${SITE_URL}/`} />
        <meta property="og:type" content="website" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Nexspire Solutions - AI Tech & Freelance Experts" />
        <meta name="twitter:description" content="Expert software engineering. AI, Cloud, Web & Mobile. Based in Mohali, serving the world." />
      </Helmet>

      {/* Hero loads immediately for faster FCP */}
      <Hero />

      <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
        <Services />
      </motion.div>

      <motion.div initial={{ opacity: 0, x: -60 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}>
        <About />
      </motion.div>

      <motion.div initial={{ opacity: 0, scale: 0.95, rotate: -1 }} whileInView={{ opacity: 1, scale: 1, rotate: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}>
        <Portfolio />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
        <Technologies />
      </motion.div>

      <motion.div initial={{ opacity: 0, x: 60 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}>
        <Testimonials />
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } }
        }}
      >
        <Blog />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 40, filter: 'blur(4px)' }} whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }} viewport={{ once: true }} transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}>
        <FAQ />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
        <Partners />
      </motion.div>

      <motion.div initial={{ opacity: 0, scale: 0.92 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}>
        <Contact />
      </motion.div>
    </div>
  );
});

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <ErrorBoundary>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/nexcrm" element={<NexCRMLandingPage />} />
          <Route path="/nexcrm/pricing" element={<CRMPricingPage />} />
          <Route path="/nexcrm/industries/:industry" element={<IndustryLandingPage />} />
          <Route path="/admin/backups" element={<ProtectedRoute><AdminBackupsPage /></ProtectedRoute>} />
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
          <Route path="/portfolio/:slug" element={<ProjectDetail />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
