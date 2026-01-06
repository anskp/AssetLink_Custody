import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Key, FileText, LogOut, Database } from 'lucide-react';
import useAuthStore from '../store/auth.store';

const AdminLayout = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, clearAuth } = useAuthStore();

    const handleLogout = () => {
        clearAuth();
        navigate('/admin/login');
    };

    const navItems = [
        { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/admin/users', icon: Users, label: 'Users' },
        { path: '/admin/api-keys', icon: Key, label: 'API Keys' },
        { path: '/admin/assets', icon: Database, label: 'Assets' },
        { path: '/admin/audit-logs', icon: FileText, label: 'Audit Logs' },
    ];

    return (
        <div className="min-h-screen bg-black flex">
            {/* Sidebar */}
            <aside className="w-64 border-r border-white flex flex-col">
                <div className="p-6 border-b border-white">
                    <h1 className="text-xl font-bold uppercase">AssetLink</h1>
                    <p className="text-xs text-white/50 uppercase mt-1">Admin Panel</p>
                </div>

                <nav className="flex-1 p-4">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 px-4 py-3 mb-2 border border-white uppercase text-sm transition-colors ${
                                    isActive ? 'bg-white text-black' : 'hover:bg-white hover:text-black'
                                }`}
                            >
                                <Icon size={18} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-white">
                    <div className="mb-4 text-xs">
                        <p className="text-white/50 uppercase mb-1">Logged in as</p>
                        <p className="font-mono truncate">{user?.email}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-white hover:bg-white hover:text-black uppercase text-sm"
                    >
                        <LogOut size={16} />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                {children}
            </main>
        </div>
    );
};

export default AdminLayout;
