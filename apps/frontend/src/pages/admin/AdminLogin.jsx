import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/auth.store';
import api from '../../services/api';

const AdminLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const setAuth = useAuthStore(state => state.setAuth);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { data } = await api.post('/admin/login', { email, password });
            setAuth(data.user, data.accessToken);
            navigate('/admin/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Admin login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-black p-4">
            <div className="w-full max-w-md brutal-card">
                <div className="mb-8 text-center">
                    <h1 className="mb-2">ADMIN // ACCESS</h1>
                    <p className="text-xs text-white/50 uppercase tracking-wider">
                        Restricted Area
                    </p>
                </div>

                {error && (
                    <div className="mb-4 p-4 border border-white bg-black text-white uppercase text-sm">
                        Error: {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="block uppercase text-sm tracking-tight">Admin Email</label>
                        <input
                            type="email"
                            className="w-full"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="username"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block uppercase text-sm tracking-tight">Password</label>
                        <input
                            type="password"
                            className="w-full"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full uppercase font-bold py-4 mt-4"
                    >
                        {loading ? 'Authenticating...' : 'Admin Login'}
                    </button>
                </form>

                <div className="mt-8 pt-8 border-t border-white text-center text-xs uppercase text-white/30">
                    AssetLink Admin Panel v1.0
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
