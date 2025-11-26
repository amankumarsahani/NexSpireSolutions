import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import DashboardLayout from './components/layout/DashboardLayout';
import Dashboard from './pages/Dashboard';
import ClientsList from './pages/clients/ClientsList';
import ClientDetails from './pages/clients/ClientDetails';
import ProjectsList from './pages/projects/ProjectsList';
import ProjectDetails from './pages/projects/ProjectDetails';
import LeadsList from './pages/leads/LeadsList';
import Inquiries from './pages/Inquiries';
import TeamsList from './pages/teams/TeamsList';
import DepartmentsList from './pages/departments/DepartmentsList';
import EmployeesList from './pages/employees/EmployeesList';
import ActivityLogs from './pages/admin/ActivityLogs';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="clients" element={<ClientsList />} />
        <Route path="clients/:id" element={<ClientDetails />} />
        <Route path="projects" element={<ProjectsList />} />
        <Route path="projects/:id" element={<ProjectDetails />} />
        <Route path="leads" element={<LeadsList />} />
        <Route path="inquiries" element={<Inquiries />} />
        <Route path="teams" element={<TeamsList />} />
        <Route path="departments" element={<DepartmentsList />} />
        <Route path="employees" element={<EmployeesList />} />
        <Route path="activity-logs" element={<ActivityLogs />} />
        <Route path="documents" element={<div className="p-8">Documents Page (Coming Soon)</div>} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster position="top-right" />
      </AuthProvider>
    </BrowserRouter>
  );
}
