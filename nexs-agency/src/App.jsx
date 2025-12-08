import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { AuthProvider, useAuth } from './context/AuthContext';
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
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import TeamDetail from './pages/TeamDetail';
import ClientDetail from './pages/ClientDetail';
import ProjectDetail from './pages/ProjectDetail';
import LeadDetail from './pages/LeadDetail';
import DashboardLayout from './components/DashboardLayout';
import PublicLayout from './components/PublicLayout';
import ServicesPage from './pages/ServicesPage';
import AboutPage from './pages/AboutPage';
import PortfolioPage from './pages/PortfolioPage';
import ContactPage from './pages/ContactPage';
import BlogPage from './pages/BlogPage';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';

// Protected Route Component
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/admin/login" />;
}

// Main Landing Page
function LandingPage() {
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
      <Hero />
      <Services />
      <About />
      <Portfolio />
      <Technologies />
      <Testimonials />
      <Blog />
      <FAQ />
      <Partners />
      <Contact />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/portfolio" element={<PortfolioPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
          </Route>

          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="team/:id" element={<TeamDetail />} />
            <Route path="clients/:id" element={<ClientDetail />} />
            <Route path="projects/:id" element={<ProjectDetail />} />
            <Route path="leads/:id" element={<LeadDetail />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
