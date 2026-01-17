import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Sun, Moon, User, FileText, Menu, X, Coins, Repeat } from 'lucide-react';

import alIcon from '../assets/assetlinkIcon.png';

const ExplorerLayout = ({ children, onSearch }) => {
    const location = useLocation();

    // Initialize theme from localStorage or default to light (false)
    const [isDark, setIsDark] = useState(() => {
        const saved = localStorage.getItem('explorer_theme');
        return saved === 'dark';
    });

    // Persist theme choice
    useEffect(() => {
        localStorage.setItem('explorer_theme', isDark ? 'dark' : 'light');
    }, [isDark]);

    const colors = isDark ? {
        background: '#0A0A0A',
        surface: '#111111',
        border: '#262626',
        text: '#E5E5E5',
        textMuted: '#A3A3A3',
        input: '#1A1A1A',
        accent: '#3B82F6'
    } : {
        background: '#F8FAFC',
        surface: '#FFFFFF',
        border: '#E2E8F0',
        text: '#1E293B',
        textMuted: '#64748B',
        input: '#FFFFFF',
        accent: '#2563EB'
    };

    const isHome = location.pathname === '/explorer';

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: colors.background,
            color: colors.text,
            fontFamily: 'Inter, system-ui, sans-serif',
            transition: 'background-color 0.3s, color 0.3s'
        }}>
            {/* Header */}
            <header style={{
                borderBottom: `1px solid ${colors.border}`,
                backgroundColor: colors.surface,
                padding: '0.75rem 2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'sticky',
                top: 0,
                zIndex: 100,
                boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.05)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
                    <Link to="/explorer" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', color: isDark ? '#FFF' : '#000' }}>
                        <div style={{
                            backgroundColor: '#FFF',
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '6px',
                            flexShrink: 0,
                            border: 'none',
                            boxShadow: 'none'
                        }}>
                            <img src={alIcon} alt="AssetLink" style={{ height: '100%', width: 'auto' }} />
                        </div>
                        <span style={{ fontWeight: '700', letterSpacing: '-0.02em', fontSize: '1.25rem' }}>ASSETLINK</span>
                    </Link>

                    <nav style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                        <Link to="/explorer" style={{ color: isHome ? colors.accent : colors.textMuted, textDecoration: 'none', fontSize: '0.875rem', fontWeight: '500' }}>Home</Link>
                        <Link to="/explorer/tokens" style={{ color: colors.textMuted, textDecoration: 'none', fontSize: '0.875rem', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Coins size={14} /> Tokens
                        </Link>
                        <Link to="/explorer/transactions" style={{ color: colors.textMuted, textDecoration: 'none', fontSize: '0.875rem', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Repeat size={14} /> Transactions
                        </Link>

                    </nav>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    {/* Search Bar - Hide on Home as requested */}
                    {!isHome && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            backgroundColor: isDark ? '#1A1A1A' : '#F1F5F9',
                            padding: '0.5rem 1rem',
                            borderRadius: '8px',
                            border: `1px solid ${colors.border}`,
                            width: '320px'
                        }}>
                            <Search size={16} color={colors.textMuted} />
                            <input
                                type="text"
                                placeholder="Search address / tx..."
                                style={{ background: 'none', border: 'none', color: colors.text, width: '100%', fontSize: '0.875rem', outline: 'none' }}
                                onKeyDown={(e) => e.key === 'Enter' && onSearch && onSearch(e.target.value)}
                            />
                        </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <Link to="/docs" title="API Documentation" style={{ color: colors.textMuted, display: 'flex', alignItems: 'center' }}>
                            <FileText size={20} />
                        </Link>
                        <Link to="/login" title="Login" style={{ color: colors.textMuted, display: 'flex', alignItems: 'center' }}>
                            <User size={20} />
                        </Link>
                        <button
                            onClick={() => setIsDark(!isDark)}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: colors.textMuted,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                padding: '4px'
                            }}
                            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                        >
                            {isDark ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                    </div>
                </div>
            </header>

            {/* Main */}
            <main style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
                {/* We pass the theme down as a prop if children are functions or just let components handle it */}
                {/* For simplicity we'll just use global theme aware styles in children if they support it */}
                {typeof children === 'function' ? children({ isDark, colors }) : children}
            </main>

            {/* Footer */}
            <footer style={{
                borderTop: `1px solid ${colors.border}`,
                padding: '3rem 2rem',
                marginTop: '4rem',
                color: colors.textMuted,
                fontSize: '0.875rem',
                textAlign: 'center',
                backgroundColor: colors.surface
            }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                    <p>© 2026 COPYm AssetLink Off-chain Ledger Explorer. All Rights Reserved.</p>
                    <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', gap: '3rem' }}>
                        <span>Off-chain Source of Truth</span>
                        <span>Institutional Custody</span>
                        <span>Real-time Sync</span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default ExplorerLayout;
