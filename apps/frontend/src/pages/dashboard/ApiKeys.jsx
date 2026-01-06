import { useState, useEffect } from 'react';
import ClientLayout from '../../components/ClientLayout';

export default function ApiKeys() {
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyRole, setNewKeyRole] = useState('MAKER');
  const [copiedKey, setCopiedKey] = useState(null);

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:3000/v1/auth/keys/my', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setApiKeys(data.keys || []);
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
      // Show empty state if API fails
      setApiKeys([]);
    } finally {
      setLoading(false);
    }
  };

  const generateApiKey = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:3000/v1/auth/keys/my', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: newKeyRole })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setApiKeys([data, ...apiKeys]);
      setShowCreateModal(false);
      alert('API Key generated! Copy the secret key now - it will not be shown again.');
    } catch (error) {
      console.error('Failed to generate API key:', error);
      alert('Failed to generate API key. Please try again.');
    }
  };

  const revokeApiKey = async (id) => {
    if (!confirm('Are you sure you want to revoke this API key?')) return;
    
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:3000/v1/auth/keys/my/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      setApiKeys(apiKeys.filter(key => key.id !== id));
      alert('API key revoked successfully');
    } catch (error) {
      console.error('Failed to revoke API key:', error);
      alert('Failed to revoke API key. Please try again.');
    }
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(type);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (loading) {
    return (
      <ClientLayout>
        <div style={{ padding: '2rem', color: '#FFF' }}>
          <div style={{ textAlign: 'center' }}>Loading...</div>
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div style={{ padding: '2rem', color: '#FFF' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem', textTransform: 'uppercase' }}>API Keys</h1>
          <p style={{ color: 'rgba(255,255,255,0.7)' }}>Manage your API keys for programmatic access</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#FFF',
            color: '#000',
            border: '1px solid #FFF',
            textTransform: 'uppercase',
            fontSize: '0.875rem',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          Generate New Key
        </button>
      </div>

      {/* Role Explanation */}
      <div style={{ 
        marginBottom: '2rem', 
        padding: '1.5rem', 
        border: '1px solid #FFF',
        backgroundColor: 'rgba(255,255,255,0.05)'
      }}>
        <h3 style={{ fontWeight: 'bold', marginBottom: '1rem', color: '#FFF' }}>API Key Roles (Maker-Checker Workflow)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          <div style={{ border: '1px solid rgba(255,255,255,0.3)', padding: '1rem' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#FFF' }}>🔨 MAKER</div>
            <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)' }}>
              Can create operations (mint, withdraw, burn) but cannot approve them.
              Requires checker approval.
            </div>
          </div>
          <div style={{ border: '1px solid rgba(255,255,255,0.3)', padding: '1rem' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#FFF' }}>✅ CHECKER</div>
            <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)' }}>
              Can approve or reject operations created by makers.
              Cannot approve own operations.
            </div>
          </div>
          <div style={{ border: '1px solid rgba(255,255,255,0.3)', padding: '1rem' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#FFF' }}>👁️ VIEWER</div>
            <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)' }}>
              Read-only access. Can view custody records, listings, and operations.
              Cannot create or approve.
            </div>
          </div>
        </div>
      </div>

      {/* API Keys List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {apiKeys.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '3rem', 
            border: '2px dashed rgba(255,255,255,0.3)'
          }}>
            <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '1rem' }}>No API keys yet</p>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #FFF',
                backgroundColor: 'transparent',
                color: '#FFF',
                cursor: 'pointer'
              }}
            >
              Generate Your First Key
            </button>
          </div>
        ) : (
          apiKeys.map((key) => (
            <div key={key.id} style={{ border: '1px solid #FFF', padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      border: '1px solid #FFF',
                      backgroundColor: key.role === 'MAKER' ? 'rgba(0,100,255,0.2)' : 
                                     key.role === 'CHECKER' ? 'rgba(0,255,0,0.2)' : 
                                     'rgba(150,150,150,0.2)',
                      color: '#FFF'
                    }}>
                      {key.role || 'MAKER'}
                    </span>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      border: '1px solid #FFF',
                      backgroundColor: key.isActive ? 'rgba(0,255,0,0.2)' : 'rgba(255,0,0,0.2)',
                      color: '#FFF'
                    }}>
                      {key.isActive ? 'ACTIVE' : 'REVOKED'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)' }}>
                    Created: {new Date(key.createdAt).toLocaleDateString()}
                  </div>
                </div>
                {key.isActive && (
                  <button
                    onClick={() => revokeApiKey(key.id)}
                    style={{
                      padding: '0.5rem 1rem',
                      border: '1px solid #F00',
                      backgroundColor: 'transparent',
                      color: '#F00',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: 'bold'
                    }}
                  >
                    Revoke
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.25rem', color: '#FFF' }}>
                    Public Key
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      value={key.publicKey}
                      readOnly
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        border: '1px solid #FFF',
                        backgroundColor: '#000',
                        color: '#FFF',
                        fontFamily: 'monospace',
                        fontSize: '0.875rem'
                      }}
                    />
                    <button
                      onClick={() => copyToClipboard(key.publicKey, `public-${key.id}`)}
                      style={{
                        padding: '0.5rem 1rem',
                        border: '1px solid #FFF',
                        backgroundColor: 'transparent',
                        color: '#FFF',
                        cursor: 'pointer'
                      }}
                    >
                      {copiedKey === `public-${key.id}` ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                {key.secretKey && (
                  <div>
                    <label style={{ 
                      display: 'block', 
                      fontSize: '0.875rem', 
                      fontWeight: 'bold', 
                      marginBottom: '0.25rem', 
                      color: '#F00' 
                    }}>
                      Secret Key (Save this now - won't be shown again!)
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="text"
                        value={key.secretKey}
                        readOnly
                        style={{
                          flex: 1,
                          padding: '0.5rem',
                          border: '1px solid #F00',
                          backgroundColor: 'rgba(255,0,0,0.1)',
                          color: '#FFF',
                          fontFamily: 'monospace',
                          fontSize: '0.875rem'
                        }}
                      />
                      <button
                        onClick={() => copyToClipboard(key.secretKey, `secret-${key.id}`)}
                        style={{
                          padding: '0.5rem 1rem',
                          border: '1px solid #F00',
                          backgroundColor: 'transparent',
                          color: '#F00',
                          cursor: 'pointer'
                        }}
                      >
                        {copiedKey === `secret-${key.id}` ? '✓ Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50
        }}>
          <div style={{
            backgroundColor: '#000',
            border: '2px solid #FFF',
            padding: '2rem',
            maxWidth: '500px',
            width: '100%',
            color: '#FFF'
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Generate New API Key</h2>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.75rem' }}>Select Role</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'start',
                  gap: '0.75rem',
                  padding: '1rem',
                  border: '1px solid #FFF',
                  cursor: 'pointer',
                  backgroundColor: newKeyRole === 'MAKER' ? 'rgba(255,255,255,0.1)' : 'transparent'
                }}>
                  <input
                    type="radio"
                    name="role"
                    value="MAKER"
                    checked={newKeyRole === 'MAKER'}
                    onChange={(e) => setNewKeyRole(e.target.value)}
                    style={{ marginTop: '0.25rem' }}
                  />
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#FFF' }}>MAKER</div>
                    <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)' }}>
                      Create operations (requires approval)
                    </div>
                  </div>
                </label>
                
                <label style={{
                  display: 'flex',
                  alignItems: 'start',
                  gap: '0.75rem',
                  padding: '1rem',
                  border: '1px solid #FFF',
                  cursor: 'pointer',
                  backgroundColor: newKeyRole === 'CHECKER' ? 'rgba(255,255,255,0.1)' : 'transparent'
                }}>
                  <input
                    type="radio"
                    name="role"
                    value="CHECKER"
                    checked={newKeyRole === 'CHECKER'}
                    onChange={(e) => setNewKeyRole(e.target.value)}
                    style={{ marginTop: '0.25rem' }}
                  />
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#FFF' }}>CHECKER</div>
                    <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)' }}>
                      Approve/reject operations
                    </div>
                  </div>
                </label>
                
                <label style={{
                  display: 'flex',
                  alignItems: 'start',
                  gap: '0.75rem',
                  padding: '1rem',
                  border: '1px solid #FFF',
                  cursor: 'pointer',
                  backgroundColor: newKeyRole === 'VIEWER' ? 'rgba(255,255,255,0.1)' : 'transparent'
                }}>
                  <input
                    type="radio"
                    name="role"
                    value="VIEWER"
                    checked={newKeyRole === 'VIEWER'}
                    onChange={(e) => setNewKeyRole(e.target.value)}
                    style={{ marginTop: '0.25rem' }}
                  />
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#FFF' }}>VIEWER</div>
                    <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)' }}>
                      Read-only access
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  border: '1px solid #FFF',
                  backgroundColor: 'transparent',
                  color: '#FFF',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={generateApiKey}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  backgroundColor: '#FFF',
                  color: '#000',
                  border: '1px solid #FFF',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Generate
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </ClientLayout>
  );
}
