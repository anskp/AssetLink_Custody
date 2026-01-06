import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import Docs from '../pages/Docs';
import Overview from '../pages/dashboard/Overview';
import Custody from '../pages/dashboard/Custody';
import Tokens from '../pages/dashboard/Tokens';
import TokenFlow from '../pages/dashboard/TokenFlow';
import Marketplace from '../pages/dashboard/Marketplace';
import Operations from '../pages/dashboard/Operations';
import ApiKeys from '../pages/dashboard/ApiKeys';
import Settings from '../pages/dashboard/Settings';
import AdminLogin from '../pages/admin/AdminLogin';
import AdminDashboard from '../pages/admin/Dashboard';
import AdminUsers from '../pages/admin/Users';
import AdminApiKeys from '../pages/admin/ApiKeys';
import AdminAssets from '../pages/admin/Assets';
import AdminAuditLogs from '../pages/admin/AuditLogs';
import useAuthStore from '../store/auth.store';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
    const { isAuthenticated, user } = useAuthStore();
    
    if (!isAuthenticated) {
        return <Navigate to={requireAdmin ? "/admin/login" : "/login"} />;
    }
    
    if (requireAdmin && user?.role !== 'ADMIN') {
        return <Navigate to="/login" />;
    }
    
    return children;
};

const AppRouter = () => {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/docs" element={<Docs />} />
                
                {/* Client Routes */}
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <Overview />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/dashboard/custody"
                    element={
                        <ProtectedRoute>
                            <Custody />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/dashboard/tokens"
                    element={
                        <ProtectedRoute>
                            <Tokens />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/dashboard/token-flow"
                    element={
                        <ProtectedRoute>
                            <TokenFlow />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/dashboard/marketplace"
                    element={
                        <ProtectedRoute>
                            <Marketplace />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/dashboard/operations"
                    element={
                        <ProtectedRoute>
                            <Operations />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/dashboard/api-keys"
                    element={
                        <ProtectedRoute>
                            <ApiKeys />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/dashboard/settings"
                    element={
                        <ProtectedRoute>
                            <Settings />
                        </ProtectedRoute>
                    }
                />
                
                {/* Admin Routes */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route
                    path="/admin/dashboard"
                    element={
                        <ProtectedRoute requireAdmin>
                            <AdminDashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/users"
                    element={
                        <ProtectedRoute requireAdmin>
                            <AdminUsers />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/api-keys"
                    element={
                        <ProtectedRoute requireAdmin>
                            <AdminApiKeys />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/assets"
                    element={
                        <ProtectedRoute requireAdmin>
                            <AdminAssets />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/audit-logs"
                    element={
                        <ProtectedRoute requireAdmin>
                            <AdminAuditLogs />
                        </ProtectedRoute>
                    }
                />
                
                {/* Default Route */}
                <Route path="/" element={<Navigate to="/login" />} />
            </Routes>
        </BrowserRouter>
    );
};

export default AppRouter;
