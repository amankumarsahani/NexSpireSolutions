import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function Sidebar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { name: 'Dashboard', path: '/dashboard', icon: '📊' },
        { name: 'Clients', path: '/clients', icon: '👥' },
        { name: 'Projects', path: '/projects', icon: '📁' },
        { name: 'Leads', path: '/leads', icon: '💼' },
    ];

    return (
        <div className="w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-white h-screen flex flex-col">
            <div className="p-6 border-b border-gray-700">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                        <span className="text-xl">⚡</span>
                    </div>
                    <div>
                        <h1 className="font-bold text-lg">Nexspire Admin</h1>
                        <p className="text-xs text-gray-400">Management Portal</p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 p-4 space-y-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg'
                                : 'hover:bg-gray-700/50'
                            }`
                        }
                    >
                        <span className="text-xl">{item.icon}</span>
                        <span className="font-medium">{item.name}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-gray-700">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center font-bold">
                        {user?.name?.[0] || 'A'}
                    </div>
                    <div className="flex-1">
                        <p className="font-medium text-sm">{user?.name || 'Admin'}</p>
                        <p className="text-xs text-gray-400">{user?.email || ''}</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 bg-red-600/20 hover:bg-red-600 rounded-xl text-sm font-medium transition-all"
                >
                    Logout
                </button>
            </div>
        </div>
    );
}
