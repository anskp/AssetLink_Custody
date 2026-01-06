import { useState, useEffect } from 'react';
import { Users, Key, Database, Activity } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import api from '../../services/api';

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const { data } = await api.get('/admin/stats');
            setStats(data);
        } catch (err) {
            console.error('Failed to fetch stats', err);
        } finally {
            setLoading(false);
        }
    };

    const StatCard = ({ icon: Icon, title, value, subtitle }) => (
        <div className="brutal-card">
            <div className="flex items-start justify-between mb-4">
                <Icon size={32} className="text-white" />
                <span className="text-xs uppercase text-white/50">{title}</span>
            </div>
            <div className="text-4xl font-bold mb-2">{value}</div>
            {subtitle && <div className="text-sm text-white/70">{subtitle}</div>}
        </div>
    );

    if (loading) {
        return (
            <AdminLayout>
                <div className="p-8">
                    <div className="animate-pulse text-xl">LOADING_STATS...</div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="p-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold uppercase mb-2">System Overview</h1>
                    <p className="text-white/50 uppercase text-sm">Real-time platform statistics</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        icon={Users}
                        title="Users"
                        value={stats?.users?.total || 0}
                        subtitle={`${stats?.users?.active || 0} active, ${stats?.users?.suspended || 0} suspended`}
                    />
                    <StatCard
                        icon={Key}
                        title="API Keys"
                        value={stats?.apiKeys?.total || 0}
                        subtitle={`${stats?.apiKeys?.active || 0} active, ${stats?.apiKeys?.revoked || 0} revoked`}
                    />
                    <StatCard
                        icon={Database}
                        title="Assets"
                        value={stats?.assets?.total || 0}
                        subtitle="Total custody records"
                    />
                    <StatCard
                        icon={Activity}
                        title="Operations"
                        value={stats?.operations?.total || 0}
                        subtitle="Total operations"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="brutal-card">
                        <h2 className="text-xl font-bold uppercase mb-4">System Status</h2>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center py-2 border-b border-white/20">
                                <span className="uppercase text-sm">Database</span>
                                <span className="text-green-400 uppercase text-xs">● Online</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-white/20">
                                <span className="uppercase text-sm">API Server</span>
                                <span className="text-green-400 uppercase text-xs">● Running</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-white/20">
                                <span className="uppercase text-sm">Fireblocks</span>
                                <span className="text-green-400 uppercase text-xs">● Connected</span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <span className="uppercase text-sm">Audit Trail</span>
                                <span className="text-green-400 uppercase text-xs">● Verified</span>
                            </div>
                        </div>
                    </div>

                    <div className="brutal-card">
                        <h2 className="text-xl font-bold uppercase mb-4">Quick Actions</h2>
                        <div className="space-y-3">
                            <a
                                href="/admin/users"
                                className="block px-4 py-3 border border-white hover:bg-white hover:text-black uppercase text-sm transition-colors"
                            >
                                → Manage Users
                            </a>
                            <a
                                href="/admin/api-keys"
                                className="block px-4 py-3 border border-white hover:bg-white hover:text-black uppercase text-sm transition-colors"
                            >
                                → View API Keys
                            </a>
                            <a
                                href="/admin/assets"
                                className="block px-4 py-3 border border-white hover:bg-white hover:text-black uppercase text-sm transition-colors"
                            >
                                → Browse Assets
                            </a>
                            <a
                                href="/admin/audit-logs"
                                className="block px-4 py-3 border border-white hover:bg-white hover:text-black uppercase text-sm transition-colors"
                            >
                                → Audit Logs
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default Dashboard;
