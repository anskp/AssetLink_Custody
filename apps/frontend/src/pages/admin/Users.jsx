import { useState, useEffect } from 'react';
import { UserCheck, UserX, Shield } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import api from '../../services/api';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchUsers();
    }, [filter]);

    const fetchUsers = async () => {
        try {
            const params = {};
            if (filter !== 'all') params.status = filter.toUpperCase();
            
            const { data } = await api.get('/admin/users', { params });
            setUsers(data.users);
        } catch (err) {
            console.error('Failed to fetch users', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleUserStatus = async (userId, currentStatus) => {
        const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
        
        if (!confirm(`Are you sure you want to ${newStatus === 'SUSPENDED' ? 'suspend' : 'activate'} this user?`)) {
            return;
        }

        try {
            await api.patch(`/admin/users/${userId}/status`, { status: newStatus });
            fetchUsers();
        } catch (err) {
            alert('Failed to update user status');
        }
    };

    return (
        <AdminLayout>
            <div className="p-8">
                <div className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold uppercase mb-2">User Management</h1>
                        <p className="text-white/50 uppercase text-sm">Manage platform users</p>
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
                            onClick={() => setFilter('suspended')}
                            className={`px-4 py-2 border border-white uppercase text-sm ${
                                filter === 'suspended' ? 'bg-white text-black' : 'hover:bg-white hover:text-black'
                            }`}
                        >
                            Suspended
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="animate-pulse text-xl">LOADING_USERS...</div>
                ) : users.length === 0 ? (
                    <div className="brutal-card text-center py-12">
                        <p className="text-white/50 uppercase">No users found</p>
                    </div>
                ) : (
                    <div className="brutal-card overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="border-b border-white uppercase text-xs">
                                    <th className="p-4">Email</th>
                                    <th className="p-4">Role</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">API Keys</th>
                                    <th className="p-4">Created</th>
                                    <th className="p-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user.id} className="border-b border-white/20 last:border-0">
                                        <td className="p-4 font-mono text-xs">{user.email}</td>
                                        <td className="p-4">
                                            <span className="flex items-center gap-2">
                                                {user.role === 'ADMIN' && <Shield size={14} />}
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center gap-2 px-2 py-1 border ${
                                                user.status === 'ACTIVE' 
                                                    ? 'border-green-400 text-green-400' 
                                                    : 'border-red-400 text-red-400'
                                            }`}>
                                                {user.status === 'ACTIVE' ? <UserCheck size={14} /> : <UserX size={14} />}
                                                {user.status}
                                            </span>
                                        </td>
                                        <td className="p-4">{user._count?.apiKeys || 0}</td>
                                        <td className="p-4">{new Date(user.createdAt).toLocaleDateString()}</td>
                                        <td className="p-4">
                                            {user.role !== 'ADMIN' && (
                                                <button
                                                    onClick={() => toggleUserStatus(user.id, user.status)}
                                                    className="px-3 py-1 border border-white hover:bg-white hover:text-black uppercase text-xs"
                                                >
                                                    {user.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                                                </button>
                                            )}
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

export default Users;
