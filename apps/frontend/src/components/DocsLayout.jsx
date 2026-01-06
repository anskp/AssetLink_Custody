import { Link } from 'react-router-dom';
import { Book, Lock, Database, GitBranch, ShoppingCart, Workflow, AlertCircle, FileCode, Home } from 'lucide-react';

const DocsLayout = ({ children, activeSection, onSectionChange }) => {
    const navItems = [
        { id: 'introduction', icon: Book, label: 'Introduction' },
        { id: 'authentication', icon: Lock, label: 'Authentication' },
        { id: 'custody', icon: Database, label: 'Custody Endpoints' },
        { id: 'operations', icon: GitBranch, label: 'Operations' },
        { id: 'marketplace', icon: ShoppingCart, label: 'Marketplace' },
        { id: 'workflow', icon: Workflow, label: 'Complete Workflow' },
        { id: 'errors', icon: AlertCircle, label: 'Error Responses' },
        { id: 'openapi', icon: FileCode, label: 'OpenAPI Spec' },
    ];

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#000', display: 'flex' }}>
            {/* Fixed Sidebar */}
            <aside style={{ 
                width: '256px', 
                borderRight: '1px solid #FFF', 
                display: 'flex', 
                flexDirection: 'column',
                position: 'fixed',
                height: '100vh',
                left: 0,
                top: 0
            }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #FFF' }}>
                    <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', textTransform: 'uppercase', color: '#FFF' }}>AssetLink</h1>
                    <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginTop: '0.25rem' }}>API Documentation</p>
                </div>

                <nav style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeSection === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => onSectionChange(item.id)}
                                style={{
                                    width: '100%',
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
                                    transition: 'all 0.2s',
                                    cursor: 'pointer',
                                    textAlign: 'left'
                                }}
                                onMouseEnter={(e) => {
                                    if (!isActive) {
                                        e.currentTarget.style.backgroundColor = '#FFF';
                                        e.currentTarget.style.color = '#000';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isActive) {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                        e.currentTarget.style.color = '#FFF';
                                    }
                                }}
                            >
                                <Icon size={18} />
                                {item.label}
                            </button>
                        );
                    })}
                </nav>

                <div style={{ padding: '1rem', borderTop: '1px solid #FFF' }}>
                    <Link
                        to="/"
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
                            cursor: 'pointer',
                            textDecoration: 'none'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#FFF';
                            e.currentTarget.style.color = '#000';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = '#FFF';
                        }}
                    >
                        <Home size={16} />
                        Back to Home
                    </Link>
                </div>
            </aside>

            {/* Main Content - with left margin to account for fixed sidebar */}
            <main style={{ 
                flex: 1, 
                marginLeft: '256px',
                overflow: 'auto', 
                color: '#FFF',
                minHeight: '100vh'
            }}>
                {children}
            </main>
        </div>
    );
};

export default DocsLayout;
