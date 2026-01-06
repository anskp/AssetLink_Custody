import { useState, useEffect } from 'react';
import { Key, CheckCircle, XCircle } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import api from '../../services/api';

const ApiKeys = () => {
    const [keys, setKeys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchKeys();
    }, [filter]);

    const fetchKeys = async () => {
        try {
            const params = {};
            if (filter !== 'all') params.isActive = filter === 'active';
            
            const { data } = await api.get('/admin/api-keys', { params });
            setKeys(data.keys);
        } catch (err) {
            console.error('Failed to fetch API keys', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout>
            <div className="p-8">
                <div className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold uppercase mb-2">API Keys</h1>
                        <p className="text-white/50 uppercase text-sm">All platform API keys</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 border border-white uppercase text-sm ${
                                filter === 'all' ? 'bg-white text-black' : 'hover:bg-white hover:text-black'
                            }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setFilter('active')}
                            className={`px-4 py-2 border border-white uppercase text-sm ${
                                filter === 'active' ? 'bg-white text-black' : 'hover:bg-white hover:text-black'
                            }`}
                        >
                            Active
                        </button>
                        <button
                            onClick={() => setFilter('revoked')}
                            className={`px-4 py-2 border border-white uppercase text-sm ${
                                filter === 'revoked' ? 'bg-white text-black' : 'hover:bg-white hover:text-black'
                            }`}
                        >
                            Revoked
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="animate-pulse text-xl">LOADING_KEYS...</div>
                ) : keys.length === 0 ? (
                    <div className="brutal-card text-center py-12">
                        <p className="text-white/50 uppercase">No API keys found</p>
                    </div>
                ) : (
                    <div className="brutal-card overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="border-b border-white uppercase text-xs">
                                    <th className="p-4">Public Key</th>
                                    <th className="p-4">User</th>
                                    <th className="p-4">Role</th>
                                    <th className="p-4">Permissions</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Created</th>
                                </tr>
                            </thead>
                            <tbody>
                                {keys.map((key) => (
                                    <tr key={key.id} className="border-b border-white/20 last:border-0">
                                        <td className="p-4 font-mono text-xs">{key.publicKey}</td>
                                        <td className="p-4 font-mono text-xs">{key.user?.email || 'N/A'}</td>
                                        <td className="p-4 uppercase">{key.user?.role || 'N/A'}</td>
                                        <td className="p-4">
                                            <div className="flex gap-1 flex-wrap">
                                                {Array.isArray(key.permissions) && key.permissions.map((perm) => (
                                                    <span key={perm} className="px-2 py-0.5 border border-white/30 text-xs uppercase">
                                                        {perm}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center gap-2 ${
                                                key.isActive ? 'text-green-400' : 'text-red-400'
                                            }`}>
                                                {key.isActive ? <CheckCircle size={14} /> : <XCircle size={14} />}
                                                {key.isActive ? 'Active' : 'Revoked'}
                                            </span>
                                        </td>
                                        <td className="p-4">{new Date(key.createdAt).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default ApiKeys;
