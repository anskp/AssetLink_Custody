import { useState, useEffect } from 'react';
import { Database, Key, Activity, ShoppingCart, TrendingUp } from 'lucide-react';
import ClientLayout from '../../components/ClientLayout';

const Overview = () => {
    const [stats, setStats] = useState({
        apiKeys: 0,
        custodyRecords: 0,
        mintedTokens: 0,
        activeListings: 0,
        totalSales: 0,
        ownedAssets: 0
    });
    const [recentActivity, setRecentActivity] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            // TODO: Backend endpoint /auth/keys/my doesn't exist yet
            // Using mock data until backend is implemented
            
            setStats({
                apiKeys: 0, // Will be populated when endpoint exists
                custodyRecords: 0,
                mintedTokens: 0,
                activeListings: 0,
                totalSales: 0,
                ownedAssets: 0
            });

            // Mock recent activity
            setRecentActivity([
                { type: 'INFO', message: 'Dashboard ready - connect your API', time: 'Just now' },
            ]);
        } catch (err) {
            console.error('Failed to fetch dashboard data', err);
        } finally {
            setLoading(false);
        }
    };

    const StatCard = ({ icon: Icon, title, value, subtitle, color = '#FFF' }) => (
        <div className="brutal-card">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <Icon size={32} style={{ color }} />
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>{title}</span>
            </div>
            <div style={{ fontSize: '2.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{value}</div>
            {subtitle && <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)' }}>{subtitle}</div>}
        </div>
    );

    return (
        <ClientLayout>
            <div style={{ padding: '2rem' }}>
                <div style={{ marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Dashboard</h1>
                    <p style={{ color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontSize: '0.875rem' }}>Your API activity overview</p>
                </div>

                {loading ? (
                    <div style={{ fontSize: '1.25rem', animation: 'pulse 2s infinite' }}>LOADING...</div>
                ) : (
                    <>
                        {/* Stats Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                            <StatCard
                                icon={Key}
                                title="API Keys"
                                value={stats.apiKeys}
                                subtitle="Active keys"
                            />
                            <StatCard
                                icon={Database}
                                title="Custody Records"
                                value={stats.custodyRecords}
                                subtitle="Linked assets"
                            />
                            <StatCard
                                icon={Activity}
                                title="Minted Tokens"
                                value={stats.mintedTokens}
                                subtitle="Total tokens"
                            />
                            <StatCard
                                icon={ShoppingCart}
                                title="Active Listings"
                                value={stats.activeListings}
                                subtitle="On marketplace"
                            />
                            <StatCard
                                icon={TrendingUp}
                                title="Total Sales"
                                value={`$${stats.totalSales}`}
                                subtitle="Revenue"
                            />
                            <StatCard
                                icon={Database}
                                title="Owned Assets"
                                value={stats.ownedAssets}
                                subtitle="In portfolio"
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                            {/* Recent Activity */}
                            <div className="brutal-card">
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '1rem' }}>Recent Activity</h2>
                                {recentActivity.length === 0 ? (
                                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>No recent activity</p>
                                ) : (
                                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                                        {recentActivity.map((activity, idx) => (
                                            <div key={idx} style={{ padding: '0.75rem', border: '1px solid rgba(255,255,255,0.2)' }}>
                                                <div style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>{activity.message}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>{activity.time}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Quick Actions */}
                            <div className="brutal-card">
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '1rem' }}>Quick Actions</h2>
                                <div style={{ display: 'grid', gap: '0.75rem' }}>
                                    <a
                                        href="/dashboard/api-keys"
                                        style={{
                                            display: 'block',
                                            padding: '0.75rem 1rem',
                                            border: '1px solid #FFF',
                                            textTransform: 'uppercase',
                                            fontSize: '0.875rem',
                                            textDecoration: 'none',
                                            color: '#FFF',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        → Manage API Keys
                                    </a>
                                    <a
                                        href="/dashboard/assets"
                                        style={{
                                            display: 'block',
                                            padding: '0.75rem 1rem',
                                            border: '1px solid #FFF',
                                            textTransform: 'uppercase',
                                            fontSize: '0.875rem',
                                            textDecoration: 'none',
                                            color: '#FFF',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        → View Assets
                                    </a>
                                    <a
                                        href="/docs"
                                        style={{
                                            display: 'block',
                                            padding: '0.75rem 1rem',
                                            border: '1px solid #FFF',
                                            textTransform: 'uppercase',
                                            fontSize: '0.875rem',
                                            textDecoration: 'none',
                                            color: '#FFF',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        → API Documentation
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Info Box */}
                        <div style={{ marginTop: '2rem', padding: '1.5rem', border: '1px solid #FFF', backgroundColor: 'rgba(255,255,255,0.05)' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.5rem' }}>📊 What You See Here</h3>
                            <p style={{ fontSize: '0.875rem', lineHeight: '1.6', color: 'rgba(255,255,255,0.8)' }}>
                                This dashboard shows ALL activity from your API keys - assets you've linked, tokens you've minted, 
                                marketplace listings you've created, and assets you've purchased. Everything your API does is tracked here.
                            </p>
                        </div>
                    </>
                )}
            </div>
        </ClientLayout>
    );
};

export default Overview;
