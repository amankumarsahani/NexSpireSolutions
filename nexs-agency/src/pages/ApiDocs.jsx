import { useState } from 'react';

const API_CATEGORIES = [
    {
        name: 'Core CRM',
        icon: 'ri-dashboard-line',
        endpoints: [
            { method: 'POST', path: '/api/auth/login', desc: 'User login' },
            { method: 'GET', path: '/api/auth/me', desc: 'Get current user' },
            { method: 'GET', path: '/api/config', desc: 'Get tenant config' },
            { method: 'GET', path: '/api/leads', desc: 'List leads' },
            { method: 'POST', path: '/api/leads', desc: 'Create lead' },
            { method: 'GET', path: '/api/leads/:id', desc: 'Get lead by ID' },
            { method: 'PUT', path: '/api/leads/:id', desc: 'Update lead' },
            { method: 'DELETE', path: '/api/leads/:id', desc: 'Delete lead' },
            { method: 'GET', path: '/api/clients', desc: 'List clients' },
            { method: 'POST', path: '/api/clients', desc: 'Create client' },
            { method: 'GET', path: '/api/dashboard/stats', desc: 'Dashboard stats' },
        ]
    },
    {
        name: 'E-Commerce',
        icon: 'ri-shopping-bag-line',
        industry: 'ecommerce',
        endpoints: [
            { method: 'GET', path: '/api/products', desc: 'List products' },
            { method: 'POST', path: '/api/products', desc: 'Create product' },
            { method: 'GET', path: '/api/products/stats', desc: 'Product stats' },
            { method: 'GET', path: '/api/products/categories', desc: 'List categories' },
            { method: 'GET', path: '/api/orders', desc: 'List orders' },
            { method: 'POST', path: '/api/orders', desc: 'Create order' },
            { method: 'PATCH', path: '/api/orders/:id/status', desc: 'Update order status' },
        ]
    },
    {
        name: 'Real Estate',
        icon: 'ri-home-4-line',
        industry: 'realestate',
        endpoints: [
            { method: 'GET', path: '/api/properties', desc: 'List properties' },
            { method: 'POST', path: '/api/properties', desc: 'Create property' },
            { method: 'GET', path: '/api/properties/stats', desc: 'Property stats' },
            { method: 'GET', path: '/api/viewings', desc: 'List viewings' },
            { method: 'POST', path: '/api/viewings', desc: 'Schedule viewing' },
        ]
    },
    {
        name: 'Healthcare',
        icon: 'ri-heart-pulse-line',
        industry: 'healthcare',
        endpoints: [
            { method: 'GET', path: '/api/patients', desc: 'List patients' },
            { method: 'POST', path: '/api/patients', desc: 'Register patient' },
            { method: 'GET', path: '/api/patients/stats', desc: 'Patient stats' },
            { method: 'GET', path: '/api/prescriptions', desc: 'List prescriptions' },
            { method: 'POST', path: '/api/prescriptions', desc: 'Create prescription' },
        ]
    },
    {
        name: 'Hospitality',
        icon: 'ri-hotel-line',
        industry: 'hospitality',
        endpoints: [
            { method: 'GET', path: '/api/rooms', desc: 'List rooms' },
            { method: 'POST', path: '/api/rooms', desc: 'Add room' },
            { method: 'GET', path: '/api/rooms/stats', desc: 'Room stats' },
            { method: 'PATCH', path: '/api/rooms/:id/status', desc: 'Update room status' },
            { method: 'GET', path: '/api/reservations', desc: 'List reservations' },
            { method: 'POST', path: '/api/reservations', desc: 'Create reservation' },
            { method: 'GET', path: '/api/guests', desc: 'List guests' },
        ]
    },
    {
        name: 'Education',
        icon: 'ri-book-open-line',
        industry: 'education',
        endpoints: [
            { method: 'GET', path: '/api/courses', desc: 'List courses' },
            { method: 'POST', path: '/api/courses', desc: 'Create course' },
            { method: 'GET', path: '/api/courses/stats', desc: 'Course stats' },
            { method: 'GET', path: '/api/students', desc: 'List students' },
            { method: 'POST', path: '/api/students', desc: 'Enroll student' },
            { method: 'GET', path: '/api/students/stats', desc: 'Student stats' },
        ]
    },
    {
        name: 'Fitness/Gym',
        icon: 'ri-run-line',
        industry: 'fitness',
        endpoints: [
            { method: 'GET', path: '/api/members', desc: 'List gym members' },
            { method: 'POST', path: '/api/members', desc: 'Register member' },
            { method: 'GET', path: '/api/members/stats', desc: 'Member stats' },
            { method: 'GET', path: '/api/members/memberships/all', desc: 'List memberships' },
            { method: 'GET', path: '/api/classes', desc: 'List classes' },
            { method: 'POST', path: '/api/classes/:id/book', desc: 'Book class' },
        ]
    },
    {
        name: 'Legal',
        icon: 'ri-scales-3-line',
        industry: 'legal',
        endpoints: [
            { method: 'GET', path: '/api/cases', desc: 'List cases' },
            { method: 'POST', path: '/api/cases', desc: 'Create case' },
            { method: 'GET', path: '/api/cases/stats', desc: 'Case stats' },
            { method: 'GET', path: '/api/cases/:id/hearings', desc: 'Get hearings' },
            { method: 'POST', path: '/api/cases/:id/hearings', desc: 'Add hearing' },
            { method: 'GET', path: '/api/cases/clients', desc: 'List clients' },
        ]
    },
    {
        name: 'Manufacturing',
        icon: 'ri-tools-line',
        industry: 'manufacturing',
        endpoints: [
            { method: 'GET', path: '/api/production', desc: 'List production orders' },
            { method: 'POST', path: '/api/production', desc: 'Create order' },
            { method: 'GET', path: '/api/production/stats', desc: 'Production stats' },
            { method: 'PATCH', path: '/api/production/:id/status', desc: 'Update status' },
            { method: 'GET', path: '/api/production/materials', desc: 'List materials' },
            { method: 'GET', path: '/api/production/quality-checks', desc: 'Quality checks' },
        ]
    },
    {
        name: 'Logistics',
        icon: 'ri-truck-line',
        industry: 'logistics',
        endpoints: [
            { method: 'GET', path: '/api/shipments', desc: 'List shipments' },
            { method: 'POST', path: '/api/shipments', desc: 'Create shipment' },
            { method: 'GET', path: '/api/shipments/stats', desc: 'Shipment stats' },
            { method: 'POST', path: '/api/shipments/:id/track', desc: 'Add tracking' },
            { method: 'GET', path: '/api/shipments/:id/tracking', desc: 'Get tracking' },
            { method: 'GET', path: '/api/shipments/vehicles', desc: 'List vehicles' },
            { method: 'GET', path: '/api/shipments/drivers', desc: 'List drivers' },
        ]
    },
    {
        name: 'Restaurant',
        icon: 'ri-restaurant-line',
        industry: 'restaurant',
        endpoints: [
            { method: 'GET', path: '/api/menu', desc: 'List menu items' },
            { method: 'POST', path: '/api/menu', desc: 'Add menu item' },
            { method: 'GET', path: '/api/menu/categories', desc: 'List categories' },
            { method: 'GET', path: '/api/tables', desc: 'List tables' },
            { method: 'PATCH', path: '/api/tables/:id/status', desc: 'Update table status' },
            { method: 'GET', path: '/api/tables/orders', desc: 'List orders' },
            { method: 'POST', path: '/api/tables/orders', desc: 'Create order' },
        ]
    },
    {
        name: 'Salon/Spa',
        icon: 'ri-scissors-line',
        industry: 'salon',
        endpoints: [
            { method: 'GET', path: '/api/bookings', desc: 'List appointments' },
            { method: 'POST', path: '/api/bookings', desc: 'Create booking' },
            { method: 'GET', path: '/api/bookings/stats', desc: 'Booking stats' },
            { method: 'GET', path: '/api/bookings/slots', desc: 'Available slots' },
            { method: 'GET', path: '/api/bookings/services', desc: 'List services' },
            { method: 'GET', path: '/api/bookings/staff', desc: 'List staff' },
        ]
    },
    {
        name: 'Services',
        icon: 'ri-calendar-check-line',
        industry: 'services',
        endpoints: [
            { method: 'GET', path: '/api/appointments', desc: 'List appointments' },
            { method: 'POST', path: '/api/appointments', desc: 'Create appointment' },
            { method: 'GET', path: '/api/appointments/stats', desc: 'Appointment stats' },
            { method: 'GET', path: '/api/services', desc: 'List services' },
            { method: 'POST', path: '/api/services', desc: 'Create service' },
        ]
    },
];

const MethodBadge = ({ method }) => {
    const colors = {
        GET: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        POST: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        PUT: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        PATCH: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
        DELETE: 'bg-red-500/20 text-red-400 border-red-500/30',
    };
    return (
        <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold border ${colors[method]}`}>
            {method}
        </span>
    );
};

export default function ApiDocs() {
    const [expandedCategories, setExpandedCategories] = useState(['Core CRM', 'E-Commerce']);
    const [searchQuery, setSearchQuery] = useState('');

    const toggleCategory = (name) => {
        setExpandedCategories(prev =>
            prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
        );
    };

    const filteredCategories = API_CATEGORIES.map(cat => ({
        ...cat,
        endpoints: cat.endpoints.filter(ep =>
            ep.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ep.desc.toLowerCase().includes(searchQuery.toLowerCase())
        )
    })).filter(cat => cat.endpoints.length > 0);

    return (
        <div className="min-h-screen bg-slate-900 text-white">
            {/* Header */}
            <div className="bg-slate-800 border-b border-slate-700 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">API Documentation</h1>
                        <p className="text-slate-400 text-sm mt-1">NexCRM Tenant API Reference • v1.0.0</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <input
                            type="text"
                            placeholder="Search endpoints..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-slate-700 border border-slate-600 text-white placeholder-slate-400 px-4 py-2 rounded-lg w-64 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-6">
                {/* Base URL */}
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-3">
                        <i className="ri-server-line text-xl text-blue-400"></i>
                        <div>
                            <span className="text-slate-400 text-sm">Base URL</span>
                            <code className="block text-blue-400 font-mono">https://{'{tenant}'}-crm-api.nexspiresolutions.co.in/api</code>
                        </div>
                    </div>
                </div>

                {/* Auth Header */}
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-3">
                        <i className="ri-key-line text-xl text-amber-400"></i>
                        <div>
                            <span className="text-slate-400 text-sm">Authorization Header</span>
                            <code className="block text-amber-400 font-mono">Authorization: Bearer {'{token}'}</code>
                        </div>
                    </div>
                </div>

                {/* Categories */}
                <div className="space-y-4">
                    {filteredCategories.map((category) => (
                        <div key={category.name} className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
                            <button
                                onClick={() => toggleCategory(category.name)}
                                className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-700/50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <i className={`${category.icon} text-xl text-blue-400`}></i>
                                    <span className="font-semibold">{category.name}</span>
                                    {category.industry && (
                                        <span className="text-xs px-2 py-0.5 bg-slate-700 text-slate-400 rounded">
                                            {category.industry}
                                        </span>
                                    )}
                                    <span className="text-xs text-slate-500">{category.endpoints.length} endpoints</span>
                                </div>
                                <i className={`ri-arrow-down-s-line text-xl transition-transform ${expandedCategories.includes(category.name) ? 'rotate-180' : ''}`}></i>
                            </button>

                            {expandedCategories.includes(category.name) && (
                                <div className="border-t border-slate-700">
                                    {category.endpoints.map((ep, idx) => (
                                        <div key={idx} className="px-4 py-3 flex items-center gap-4 border-b border-slate-700/50 last:border-b-0 hover:bg-slate-700/30">
                                            <MethodBadge method={ep.method} />
                                            <code className="text-slate-300 font-mono text-sm flex-1">{ep.path}</code>
                                            <span className="text-slate-500 text-sm">{ep.desc}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="mt-8 text-center text-slate-500 text-sm">
                    <p>Need help? Contact <a href="mailto:support@nexspiresolutions.co.in" className="text-blue-400 hover:underline">support@nexspiresolutions.co.in</a></p>
                </div>
            </div>
        </div>
    );
}
