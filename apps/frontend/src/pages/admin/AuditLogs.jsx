import { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import api from '../../services/api';

const AuditLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const { data } = await api.get('/admin/audit-logs');
            setLogs(data.logs);
        } catch (err) {
            console.error('Failed to fetch audit logs', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout>
            <div className="p-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold uppercase mb-2">Audit Logs</h1>
                    <p className="text-white/50 uppercase text-sm">Immutable system audit trail</p>
                </div>

                {loading ? (
                    <div className="animate-pulse text-xl">LOADING_LOGS...</div>
                ) : logs.length === 0 ? (
                    <div className="brutal-card text-center py-12">
                        <FileText size={48} className="mx-auto mb-4 text-white/30" />
                        <p className="text-white/50 uppercase">No audit logs found</p>
                        <p className="text-white/30 text-sm mt-2">System events will be logged here</p>
                    </div>
                ) : (
                    <div className="brutal-card overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="border-b border-white uppercase text-xs">
                                    <th className="p-4">Timestamp</th>
                                    <th className="p-4">Event Type</th>
                                    <th className="p-4">Actor</th>
                                    <th className="p-4">IP Address</th>
                                    <th className="p-4">Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log) => (
                                    <tr key={log.id} className="border-b border-white/20 last:border-0">
                                        <td className="p-4 font-mono text-xs">
                                            {new Date(log.timestamp).toLocaleString()}
                                        </td>
                                        <td className="p-4">
                                            <span className="px-2 py-1 border border-white uppercase text-xs">
                                                {log.eventType}
                                            </span>
                                        </td>
                                        <td className="p-4 font-mono text-xs">{log.actor}</td>
                                        <td className="p-4 font-mono text-xs">{log.ipAddress || 'N/A'}</td>
                                        <td className="p-4 text-xs">
                                            <details className="cursor-pointer">
                                                <summary className="hover:text-white/70">View metadata</summary>
                                                <pre className="mt-2 p-2 border border-white/30 text-xs overflow-auto">
                                                    {JSON.stringify(log.metadata, null, 2)}
                                                </pre>
                                            </details>
                                        </td>
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

export default AuditLogs;
