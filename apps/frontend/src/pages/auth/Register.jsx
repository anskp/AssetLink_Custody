import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../../store/auth.store';
import api from '../../services/api';

const Register = () => {
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
            const { data } = await api.post('/auth/register', { email, password });
            setAuth(data.user, data.accessToken);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-black p-4">
            <div className="w-full max-w-md brutal-card">
                <h1 className="mb-8 text-center">AssetLink // Register</h1>

                {error && (
                    <div className="mb-4 p-4 border border-white bg-black text-white uppercase text-sm">
                        Error: {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="block uppercase text-sm tracking-tight">Email</label>
                        <input
                            type="email"
                            className="w-full"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
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
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full uppercase font-bold py-4 mt-4"
                    >
                        {loading ? 'Creating...' : 'Register Account'}
                    </button>
                </form>

                <div className="mt-8 pt-8 border-t border-white text-center text-sm uppercase">
                    Already registered?{' '}
                    <Link to="/login" className="underline hover:bg-white hover:text-black px-1">
                        Return to Login
                    </Link>
                    <br />
                    <Link to="/docs" className="underline hover:bg-white hover:text-black px-1 text-xs" style={{ marginTop: '0.5rem', display: 'inline-block' }}>
                        View API Documentation
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
