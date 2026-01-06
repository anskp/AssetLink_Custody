import { useState, useEffect } from 'react';
import { Database } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import api from '../../services/api';

const Assets = () => {
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAssets();
    }, []);

    const fetchAssets = async () => {
        try {
            const { data } = await api.get('/admin/assets');
            setAssets(data.assets);
        } catch (err) {
            console.error('Failed to fetch assets', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout>
            <div className="p-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold uppercase mb-2">Assets</h1>
                    <p className="text-white/50 uppercase text-sm">All custody records</p>
                </div>

                {loading ? (
                    <div className="animate-pulse text-xl">LOADING_ASSETS...</div>
                ) : assets.length === 0 ? (
                    <div className="brutal-card text-center py-12">
                        <Database size={48} className="mx-auto mb-4 text-white/30" />
                        <p className="text-white/50 uppercase">No assets found</p>
                        <p className="text-white/30 text-sm mt-2">Assets will appear here once linked</p>
                    </div>
                ) : (
                    <div className="brutal-card overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="border-b border-white uppercase text-xs">
                                    <th className="p-4">Asset ID</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Blockchain</th>
                                    <th className="p-4">Token Address</th>
                                    <th className="p-4">Token ID</th>
                                    <th className="p-4">Created</th>
                                </tr>
                            </thead>
                            <tbody>
                                {assets.map((asset) => (
                                    <tr key={asset.id} className="border-b border-white/20 last:border-0">
                                        <td className="p-4 font-mono text-xs">{asset.assetId}</td>
                                        <td className="p-4">
                                            <span className="px-2 py-1 border border-white uppercase text-xs">
                                                {asset.status}
                                            </span>
                                        </td>
                                        <td className="p-4">{asset.blockchain || 'N/A'}</td>
                                        <td className="p-4 font-mono text-xs">{asset.tokenAddress || 'N/A'}</td>
                                        <td className="p-4">{asset.tokenId || 'N/A'}</td>
                                        <td className="p-4">{new Date(asset.createdAt).toLocaleDateString()}</td>
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

export default Assets;
