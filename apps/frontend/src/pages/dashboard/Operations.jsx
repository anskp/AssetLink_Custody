import { useState, useEffect } from 'react';
import ClientLayout from '../../components/ClientLayout';
import api from '../../services/api';
import { Check, X, Clock, HelpCircle } from 'lucide-react';

export default function Operations() {
  const [operations, setOperations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('PENDING_CHECKER');

  useEffect(() => {
    fetchOperations();
  }, [filter]);

  const fetchOperations = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/operations/dashboard', {
        params: { status: filter === 'all' ? undefined : filter }
      });
      setOperations(data.operations || []);
    } catch (error) {
      console.error('Failed to fetch operations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (opId) => {
    if (!confirm('Authorize this operation for execution?')) return;
    try {
      await api.post(`/operations/dashboard/${opId}/approve`);
      alert('Operation approved and executed!');
      fetchOperations();
    } catch (error) {
      alert(error.response?.data?.error?.message || 'Approval failed');
    }
  };

  const handleReject = async (opId) => {
    const reason = prompt('Reason for rejection:');
    if (reason === null) return;
    try {
      await api.post(`/operations/dashboard/${opId}/reject`, { reason });
      alert('Operation rejected');
      fetchOperations();
    } catch (error) {
      alert(error.response?.data?.error?.message || 'Rejection failed');
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'PENDING_CHECKER': return { color: '#FF0', bg: 'rgba(255,255,0,0.1)', border: '#FF0' };
      case 'APPROVED': return { color: '#0F0', bg: 'rgba(0,255,0,0.1)', border: '#0F0' };
      case 'REJECTED': return { color: '#F00', bg: 'rgba(255,0,0,0.1)', border: '#F00' };
      case 'EXECUTED': return { color: '#00D1FF', bg: 'rgba(0,209,255,0.1)', border: '#00D1FF' };
      default: return { color: '#FFF', bg: 'rgba(255,255,255,0.1)', border: '#FFF' };
    }
  };

  return (
    <ClientLayout>
      <div style={{ padding: '2rem', color: '#FFF' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
            Governance Queue
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)' }}>
            Review and authorize external API requests and platform operations
          </p>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {[
            { id: 'PENDING_CHECKER', label: 'Awaiting Approval' },
            { id: 'APPROVED', label: 'Approved' },
            { id: 'EXECUTED', label: 'Executed' },
            { id: 'REJECTED', label: 'Rejected' },
            { id: 'all', label: 'All History' }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #FFF',
                backgroundColor: filter === f.id ? '#FFF' : 'transparent',
                color: filter === f.id ? '#000' : '#FFF',
                cursor: 'pointer',
                textTransform: 'uppercase',
                fontSize: '0.75rem',
                fontWeight: 'bold'
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Operations List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>Fetching records...</div>
        ) : operations.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            border: '2px dashed rgba(255,255,255,0.3)'
          }}>
            <p style={{ color: 'rgba(255,255,255,0.7)' }}>No operations found for this status</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {operations.map((op) => {
              const style = getStatusStyle(op.status);
              const assetId = op.custodyRecord?.assetId || op.payload?.assetId || 'Unknown';
              return (
                <div key={op.id} style={{
                  border: '1px solid #FFF',
                  padding: '1.5rem',
                  display: 'grid',
                  gridTemplateColumns: '1fr 150px auto',
                  gap: '1rem',
                  alignItems: 'center',
                  backgroundColor: 'rgba(255,255,255,0.02)'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '1.125rem', textTransform: 'uppercase' }}>{op.operationType}</span>
                      <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem' }}>• {assetId}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                      Requested by: <code style={{ color: '#FFF' }}>{op.initiatedBy}</code> • {new Date(op.createdAt).toLocaleString()}
                    </div>
                  </div>

                  <div style={{
                    textAlign: 'center',
                    padding: '0.4rem',
                    border: `1px solid ${style.border}`,
                    color: style.color,
                    backgroundColor: style.bg,
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    textTransform: 'uppercase'
                  }}>
                    {op.status.replace('_', ' ')}
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {op.status === 'PENDING_CHECKER' ? (
                      <>
                        <button
                          onClick={() => handleReject(op.id)}
                          style={{
                            padding: '0.5rem',
                            border: '1px solid #F00',
                            backgroundColor: 'transparent',
                            color: '#F00',
                            cursor: 'pointer'
                          }}
                          title="Reject"
                        >
                          <X size={18} />
                        </button>
                        <button
                          onClick={() => handleApprove(op.id)}
                          style={{
                            padding: '0.5rem',
                            border: '1px solid #0F0',
                            backgroundColor: '#0F0',
                            color: '#000',
                            cursor: 'pointer'
                          }}
                          title="Approve"
                        >
                          <Check size={18} />
                        </button>
                      </>
                    ) : (
                      <button
                        style={{
                          padding: '0.5rem',
                          border: '1px solid rgba(255,255,255,0.3)',
                          backgroundColor: 'transparent',
                          color: 'rgba(255,255,255,0.5)',
                          cursor: 'not-allowed'
                        }}
                      >
                        <Clock size={18} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ClientLayout>
  );
}
