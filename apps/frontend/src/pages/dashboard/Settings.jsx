import { useState } from 'react';
import { User, Lock, Bell } from 'lucide-react';
import ClientLayout from '../../components/ClientLayout';
import useAuthStore from '../../store/auth.store';

const Settings = () => {
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState('profile');

    const tabs = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'security', label: 'Security', icon: Lock },
        { id: 'notifications', label: 'Notifications', icon: Bell },
    ];

    return (
        <ClientLayout>
            <div style={{ padding: '2rem' }}>
                <div style={{ marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Settings</h1>
                    <p style={{ color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontSize: '0.875rem' }}>Manage your account preferences</p>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid #FFF', paddingBottom: '1rem' }}>
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.5rem 1rem',
                                    border: '1px solid #FFF',
                                    backgroundColor: activeTab === tab.id ? '#FFF' : 'transparent',
                                    color: activeTab === tab.id ? '#000' : '#FFF',
                                    textTransform: 'uppercase',
                                    fontSize: '0.875rem',
                                    cursor: 'pointer'
                                }}
                            >
                                <Icon size={16} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {activeTab === 'profile' && (
                    <div className="brutal-card">
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '1.5rem' }}>Profile Information</h2>
                        <div style={{ display: 'grid', gap: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', textTransform: 'uppercase', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Email</label>
                                <input
                                    type="email"
                                    value={user?.email || ''}
                                    disabled
                                    style={{ width: '100%', opacity: 0.7 }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', textTransform: 'uppercase', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Role</label>
                                <input
                                    type="text"
                                    value={user?.role || 'CLIENT'}
                                    disabled
                                    style={{ width: '100%', opacity: 0.7 }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'security' && (
                    <div className="brutal-card">
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '1.5rem' }}>Security Settings</h2>
                        <div style={{ display: 'grid', gap: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', textTransform: 'uppercase', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Current Password</label>
                                <input type="password" placeholder="Enter current password" style={{ width: '100%' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', textTransform: 'uppercase', fontSize: '0.875rem', marginBottom: '0.5rem' }}>New Password</label>
                                <input type="password" placeholder="Enter new password" style={{ width: '100%' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', textTransform: 'uppercase', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Confirm Password</label>
                                <input type="password" placeholder="Confirm new password" style={{ width: '100%' }} />
                            </div>
                            <button
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    border: '1px solid #FFF',
                                    backgroundColor: 'transparent',
                                    color: '#FFF',
                                    textTransform: 'uppercase',
                                    fontSize: '0.875rem',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    width: 'fit-content'
                                }}
                            >
                                Update Password
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'notifications' && (
                    <div className="brutal-card">
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '1.5rem' }}>Notification Preferences</h2>
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                                <input type="checkbox" defaultChecked />
                                <span style={{ textTransform: 'uppercase', fontSize: '0.875rem' }}>Email notifications for new operations</span>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                                <input type="checkbox" defaultChecked />
                                <span style={{ textTransform: 'uppercase', fontSize: '0.875rem' }}>Email notifications for API key usage</span>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                                <input type="checkbox" />
                                <span style={{ textTransform: 'uppercase', fontSize: '0.875rem' }}>Weekly summary reports</span>
                            </label>
                        </div>
                    </div>
                )}
            </div>
        </ClientLayout>
    );
};

export default Settings;
