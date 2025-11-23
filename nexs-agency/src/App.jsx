import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
      <Header />
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
      <Footer />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
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
