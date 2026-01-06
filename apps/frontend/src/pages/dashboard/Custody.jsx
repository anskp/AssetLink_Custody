import { useState, useEffect } from 'react';
import ClientLayout from '../../components/ClientLayout';
import { Database, Plus, Eye, Check, X } from 'lucide-react';

export default function Custody() {
  const [custodyRecords, setCustodyRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(null);
  const [assetId, setAssetId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fetchingRef, setFetchingRef] = useState(false);

  useEffect(() => {
    // Prevent duplicate fetches
    if (!fetchingRef) {
      fetchCustodyRecords();
    }
  }, []);

  const fetchCustodyRecords = async () => {
    // Prevent duplicate concurrent requests
    if (fetchingRef) {
      console.log('Fetch already in progress, skipping...');
      return;
    }

    try {
      setFetchingRef(true);
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:3000/v1/custody/dashboard?scope=all', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setCustodyRecords(data.records || []);
    } catch (error) {
      console.error('Failed to fetch custody records:', error);
      setCustodyRecords([]);
    } finally {
      setLoading(false);
      setFetchingRef(false);
    }
  };

  const handleLinkAsset = async (e) => {
    e.preventDefault();
    if (!assetId.trim()) {
      alert('Please enter an asset ID');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:3000/v1/custody/dashboard/link', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ assetId: assetId.trim() })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to link asset');
      }

      alert('Asset link request submitted! Status: PENDING approval');
      setAssetId('');
      setShowLinkForm(false);
      fetchCustodyRecords();
    } catch (error) {
      console.error('Failed to link asset:', error);
      alert(error.message || 'Failed to link asset');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (recordId) => {
    if (!confirm('Are you sure you want to approve this custody link?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:3000/v1/custody/dashboard/${recordId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to approve');
      }

      alert('Asset approved and linked to custody!');
      setShowDetailsModal(null);
      fetchCustodyRecords();
    } catch (error) {
      console.error('Failed to approve:', error);
      alert(error.message || 'Failed to approve');
    }
  };

  const handleReject = async (recordId) => {
    const reason = prompt('Enter rejection reason (optional):');
    if (reason === null) return; // User cancelled

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:3000/v1/custody/dashboard/${recordId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: reason || 'No reason provided' })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to reject');
      }

      alert('Asset link request rejected');
      setShowDetailsModal(null);
      fetchCustodyRecords();
    } catch (error) {
      console.error('Failed to reject:', error);
      alert(error.message || 'Failed to reject');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      PENDING: { bg: 'rgba(255,255,0,0.2)', border: '#FF0', color: '#FF0' },
      LINKED: { bg: 'rgba(0,255,0,0.2)', border: '#0F0', color: '#0F0' },
      UNLINKED: { bg: 'rgba(255,0,0,0.2)', border: '#F00', color: '#F00' },
      MINTED: { bg: 'rgba(0,100,255,0.2)', border: '#06F', color: '#06F' }
    };
    const style = styles[status] || styles.PENDING;

    return (
      <span style={{
        padding: '0.25rem 0.75rem',
        fontSize: '0.75rem',
        fontWeight: 'bold',
        border: `1px solid ${style.border}`,
        backgroundColor: style.bg,
        color: style.color
      }}>
        {status}
      </span>
    );
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
        {/* Header */}
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
              Custody
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.7)' }}>
              Link real-world assets to custody system (requires approval)
            </p>
          </div>
          <button
            onClick={() => setShowLinkForm(!showLinkForm)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              border: '1px solid #FFF',
              backgroundColor: showLinkForm ? '#FFF' : 'transparent',
              color: showLinkForm ? '#000' : '#FFF',
              textTransform: 'uppercase',
              fontSize: '0.875rem',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            <Plus size={18} />
            Link Asset
          </button>
        </div>

        {/* Info Box */}
        <div style={{
          marginBottom: '2rem',
          padding: '1.5rem',
          border: '1px solid #FFF',
          backgroundColor: 'rgba(255,255,255,0.05)'
        }}>
          <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Approval Workflow</h3>
          <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)', marginBottom: '0.5rem' }}>
            When you link an asset, it enters "Pending Approval" status. Click "View Details" to see asset information
            and approve or reject the custody link request.
          </p>
          <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>
            Flow: Link Asset → Pending Approval → Approve/Reject → Linked/Rejected
          </p>
        </div>

        {/* Link Asset Form */}
        {showLinkForm && (
          <div style={{
            marginBottom: '2rem',
            padding: '1.5rem',
            border: '1px solid #FFF',
            backgroundColor: 'rgba(255,255,255,0.05)'
          }}>
            <h3 style={{ fontWeight: 'bold', marginBottom: '1rem' }}>Link New Asset</h3>
            <form onSubmit={handleLinkAsset}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', textTransform: 'uppercase' }}>
                  Asset ID
                </label>
                <input
                  type="text"
                  value={assetId}
                  onChange={(e) => setAssetId(e.target.value)}
                  placeholder="e.g., property_001"
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #FFF',
                    backgroundColor: '#000',
                    color: '#FFF',
                    fontSize: '1rem'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: '1px solid #FFF',
                    backgroundColor: submitting ? 'rgba(255,255,255,0.5)' : '#FFF',
                    color: '#000',
                    textTransform: 'uppercase',
                    fontSize: '0.875rem',
                    fontWeight: 'bold',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    opacity: submitting ? 0.6 : 1
                  }}
                >
                  {submitting ? 'Submitting...' : 'Submit for Approval'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowLinkForm(false)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: '1px solid #FFF',
                    backgroundColor: 'transparent',
                    color: '#FFF',
                    textTransform: 'uppercase',
                    fontSize: '0.875rem',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Custody Records List */}
        {custodyRecords.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            border: '2px dashed rgba(255,255,255,0.3)'
          }}>
            <Database size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem', fontSize: '1.125rem' }}>
              No assets in custody yet
            </p>
            <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)' }}>
              Click "Link Asset" to add your first asset to custody
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {custodyRecords.map((record) => (
              <div style={{
                border: '1px solid #FFF',
                padding: '1.5rem',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr auto auto', // Added column for Creator
                gap: '1rem',
                alignItems: 'center'
              }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    {record.assetId}
                  </h3>
                  <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)' }}>
                    Linked: {new Date(record.linkedAt || record.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.25rem' }}>CREATOR</div>
                  <div style={{
                    fontSize: '0.875rem',
                    fontFamily: 'monospace',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    padding: '0.25rem 0.5rem',
                    display: 'inline-block'
                  }}>
                    {record.createdBy}
                  </div>
                </div>

                <span style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid #FFF',
                  backgroundColor: record.status === 'PENDING' ? 'rgba(255,255,0,0.1)' :
                    record.status === 'LINKED' ? 'rgba(0,255,0,0.1)' :
                      record.status === 'UNLINKED' ? 'rgba(255,0,0,0.1)' :
                        'rgba(100,100,100,0.1)',
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  fontWeight: 'bold',
                  color: record.status === 'PENDING' ? '#FF0' :
                    record.status === 'LINKED' ? '#0F0' :
                      record.status === 'UNLINKED' ? '#F00' : '#FFF'
                }}>
                  {record.status}
                </span>

                {record.status === 'PENDING' && (
                  <button
                    onClick={() => setShowDetailsModal(record)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 1rem',
                      border: '1px solid #FFF',
                      backgroundColor: '#FFF',
                      color: '#000',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: 'bold'
                    }}
                  >
                    <Eye size={16} />
                    View Details
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Asset Details Modal */}
        {showDetailsModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50
          }}>
            <div style={{
              backgroundColor: '#000',
              border: '2px solid #FFF',
              padding: '2rem',
              maxWidth: '600px',
              width: '100%',
              color: '#FFF'
            }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', textTransform: 'uppercase' }}>
                Asset Details
              </h2>

              <div style={{ marginBottom: '2rem' }}>
                <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.3)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.25rem' }}>
                    ASSET ID
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                    {showDetailsModal.assetId}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.25rem' }}>
                      CREATED BY
                    </div>
                    <div style={{ fontWeight: 'bold' }}>
                      {showDetailsModal.createdBy}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.25rem' }}>
                      STATUS
                    </div>
                    <div style={{ fontWeight: 'bold', color: '#FF0' }}>
                      {showDetailsModal.status}
                    </div>
                  </div>
                </div>

                {showDetailsModal.details && (
                  <div style={{
                    padding: '1rem',
                    border: '1px solid rgba(255,255,255,0.3)',
                    backgroundColor: 'rgba(255,255,255,0.05)'
                  }}>
                    <h3 style={{ fontWeight: 'bold', marginBottom: '0.75rem', fontSize: '0.875rem', textTransform: 'uppercase' }}>
                      Additional Information
                    </h3>
                    <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.875rem' }}>
                      {Object.entries(showDetailsModal.details).map(([key, value]) => (
                        <div key={key} style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'rgba(255,255,255,0.7)' }}>{key}:</span>
                          <span style={{ fontWeight: 'bold' }}>{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={() => handleApprove(showDetailsModal.id)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1rem',
                    backgroundColor: '#0F0',
                    color: '#000',
                    border: '1px solid #0F0',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    textTransform: 'uppercase'
                  }}
                >
                  <Check size={18} />
                  Approve
                </button>
                <button
                  onClick={() => handleReject(showDetailsModal.id)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1rem',
                    backgroundColor: '#F00',
                    color: '#FFF',
                    border: '1px solid #F00',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    textTransform: 'uppercase'
                  }}
                >
                  <X size={18} />
                  Reject
                </button>
                <button
                  onClick={() => setShowDetailsModal(null)}
                  style={{
                    padding: '0.75rem 1rem',
                    border: '1px solid #FFF',
                    backgroundColor: 'transparent',
                    color: '#FFF',
                    cursor: 'pointer',
                    textTransform: 'uppercase'
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ClientLayout>
  );
}
