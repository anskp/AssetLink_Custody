import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Database, Coins, ShoppingCart, GitBranch, Key, Settings, LogOut, Network } from 'lucide-react';
import useAuthStore from '../store/auth.store';

const ClientLayout = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, clearAuth } = useAuthStore();

    const handleLogout = async () => {
        try {
            await fetch('http://localhost:3000/v1/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });
        } catch (err) {
            console.error('Logout error:', err);
        }
        clearAuth();
        navigate('/login');
    };

    const navItems = [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
        { path: '/dashboard/custody', icon: Database, label: 'Custody' },
        { path: '/dashboard/tokens', icon: Coins, label: 'Tokens' },
        { path: '/dashboard/token-flow', icon: Network, label: 'Token Flow' },
        { path: '/dashboard/marketplace', icon: ShoppingCart, label: 'Marketplace' },
        { path: '/dashboard/operations', icon: GitBranch, label: 'Operations' },
        { path: '/dashboard/api-keys', icon: Key, label: 'API Keys' },
        { path: '/dashboard/settings', icon: Settings, label: 'Settings' },
    ];

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#000', display: 'flex' }}>
            {/* Sidebar */}
            <aside style={{ width: '256px', borderRight: '1px solid #FFF', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #FFF' }}>
                    <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', textTransform: 'uppercase' }}>AssetLink</h1>
                    <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginTop: '0.25rem' }}>by copym</p>
                </div>

                <nav style={{ flex: 1, padding: '1rem' }}>
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    padding: '0.75rem 1rem',
                                    marginBottom: '0.5rem',
                                    border: '1px solid #FFF',
                                    textTransform: 'uppercase',
                                    fontSize: '0.875rem',
                                    backgroundColor: isActive ? '#FFF' : 'transparent',
                                    color: isActive ? '#000' : '#FFF',
                                    textDecoration: 'none',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    if (!isActive) {
                                        e.target.style.backgroundColor = '#FFF';
                                        e.target.style.color = '#000';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isActive) {
                                        e.target.style.backgroundColor = 'transparent';
                                        e.target.style.color = '#FFF';
                                    }
                                }}
                            >
                                <Icon size={18} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div style={{ padding: '1rem', borderTop: '1px solid #FFF' }}>
                    <div style={{ marginBottom: '1rem', fontSize: '0.75rem' }}>
                        <p style={{ color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Logged in as</p>
                        <p style={{ fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 1rem',
                            border: '1px solid #FFF',
                            backgroundColor: 'transparent',
                            color: '#FFF',
                            textTransform: 'uppercase',
                            fontSize: '0.875rem',
                            cursor: 'pointer'
                        }}
                    >
                        <LogOut size={16} />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main style={{ flex: 1, overflow: 'auto' }}>
                {children}
            </main>
        </div>
    );
};

export default ClientLayout;
