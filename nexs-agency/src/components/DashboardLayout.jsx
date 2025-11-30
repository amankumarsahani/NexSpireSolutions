import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function DashboardLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const isActive = (tabName) => {
        if (location.pathname === '/admin/dashboard') {
            const params = new URLSearchParams(location.search);
            const currentTab = params.get('tab') || 'dashboard';
            return currentTab === tabName;
        }
        if (location.pathname.includes('/admin/team') && tabName === 'team') return true;
        if (location.pathname.includes('/admin/clients') && tabName === 'clients') return true;
        if (location.pathname.includes('/admin/projects') && tabName === 'projects') return true;
        if (location.pathname.includes('/admin/leads') && tabName === 'leads') return true;
        return false;
    };

    const handleNavigation = (tabName) => {
        navigate(`/admin/dashboard?tab=${tabName}`);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <div className="w-64 bg-gray-900 text-white flex-shrink-0 fixed h-full overflow-y-auto z-10">
                <div className="p-6">
                    <h1 className="text-2xl font-bold">NexSpire</h1>
                    <p className="text-sm text-gray-400">Admin Panel</p>
                </div>
                <nav className="mt-6">
                    <button
                        onClick={() => handleNavigation('dashboard')}
                        className={`w-full text-left px-6 py-3 flex items-center gap-3 transition-colors ${isActive('dashboard') ? 'bg-blue-600 border-l-4 border-blue-400' : 'hover:bg-gray-800'}`}
                    >
                        <i className="ri-dashboard-line text-xl"></i>
                        <span>Dashboard</span>
                    </button>
                    <button
                        onClick={() => handleNavigation('team')}
                        className={`w-full text-left px-6 py-3 flex items-center gap-3 transition-colors ${isActive('team') ? 'bg-blue-600 border-l-4 border-blue-400' : 'hover:bg-gray-800'}`}
                    >
                        <i className="ri-team-line text-xl"></i>
                        <span>Team</span>
                    </button>
                    <button
                        onClick={() => handleNavigation('clients')}
                        className={`w-full text-left px-6 py-3 flex items-center gap-3 transition-colors ${isActive('clients') ? 'bg-blue-600 border-l-4 border-blue-400' : 'hover:bg-gray-800'}`}
                    >
                        <i className="ri-building-line text-xl"></i>
                        <span>Clients</span>
                    </button>
                    <button
                        onClick={() => handleNavigation('projects')}
                        className={`w-full text-left px-6 py-3 flex items-center gap-3 transition-colors ${isActive('projects') ? 'bg-blue-600 border-l-4 border-blue-400' : 'hover:bg-gray-800'}`}
                    >
                        <i className="ri-folder-line text-xl"></i>
                        <span>Projects</span>
                    </button>
                    <button
                        onClick={() => handleNavigation('leads')}
                        className={`w-full text-left px-6 py-3 flex items-center gap-3 transition-colors ${isActive('leads') ? 'bg-blue-600 border-l-4 border-blue-400' : 'hover:bg-gray-800'}`}
                    >
                        <i className="ri-user-star-line text-xl"></i>
                        <span>Leads</span>
                    </button>
                    <button
                        onClick={() => handleNavigation('messages')}
                        className={`w-full text-left px-6 py-3 flex items-center gap-3 transition-colors ${isActive('messages') ? 'bg-blue-600 border-l-4 border-blue-400' : 'hover:bg-gray-800'}`}
                    >
                        <i className="ri-message-3-line text-xl"></i>
                        <span>Messages</span>
                    </button>
                    <button
                        onClick={() => navigate('/admin/seo')}
                        className={`w-full text-left px-6 py-3 flex items-center gap-3 transition-colors ${location.pathname.includes('/admin/seo') ? 'bg-purple-600 border-l-4 border-purple-400' : 'hover:bg-gray-800'}`}
                    >
                        <i className="ri-line-chart-line text-xl"></i>
                        <span>SEO Tools</span>
                    </button>
                </nav>
                <div className="absolute bottom-0 w-64 p-6 border-t border-gray-800 bg-gray-900">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                            {user?.firstName?.[0]}{user?.lastName?.[0]}
                        </div>
                        <div>
                            <p className="font-semibold text-sm">{user?.firstName} {user?.lastName}</p>
                            <p className="text-xs text-gray-400">{user?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg flex items-center justify-center gap-2"
                    >
                        <i className="ri-logout-box-line"></i>
                        <span>Logout</span>
                    </button>
                </div>
            </div>
            {/* Main Content */}
            <div className="flex-1 ml-64">
                <Outlet />
            </div>
        </div>
    );
}
