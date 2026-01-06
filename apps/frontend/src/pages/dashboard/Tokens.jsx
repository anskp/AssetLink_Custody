import { useState, useEffect } from 'react';
import ClientLayout from '../../components/ClientLayout';
import { Coins, Plus, RefreshCw } from 'lucide-react';
import { authenticatedFetch } from '../../utils/auth';

export default function Tokens() {
  const [custodyRecords, setCustodyRecords] = useState([]);
  const [operations, setOperations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMintForm, setShowMintForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [approvingId, setApprovingId] = useState(null); // Track which operation is being approved
  const [formData, setFormData] = useState({
    assetId: '',
    tokenSymbol: '',
    tokenName: '',
    totalSupply: '1000000',
    decimals: '18',
    blockchain: 'ETH_TEST5'
  });

  useEffect(() => {
    fetchData();
    
    // Auto-refresh every 30 seconds to catch contract address updates
    const interval = setInterval(() => {
      fetchData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch custody records (only LINKED ones can be minted)
      const custodyResponse = await authenticatedFetch('http://localhost:3000/v1/custody/dashboard?status=LINKED');
      
      if (custodyResponse.ok) {
        const custodyData = await custodyResponse.json();
        setCustodyRecords(custodyData.records || []);
      }

      // Fetch mint operations
      const opsResponse = await authenticatedFetch('http://localhost:3000/v1/operations/dashboard?operationType=MINT');
      
      if (opsResponse.ok) {
        const opsData = await opsResponse.json();
        
        // Fetch all custody records once
        const allCustodyResp = await authenticatedFetch(`http://localhost:3000/v1/custody/dashboard`);
        
        let allCustodyRecords = [];
        if (allCustodyResp.ok) {
          const allCustodyData = await allCustodyResp.json();
          allCustodyRecords = allCustodyData.records || [];
        }
        
        // Enrich operations with custody record data (to get token address)
        const enrichedOps = (opsData.operations || []).map((op) => {
          if (op.payload?.assetId) {
            const custodyRecord = allCustodyRecords.find(r => r.assetId === op.payload.assetId);
            if (custodyRecord && custodyRecord.tokenAddress) {
              return {
                ...op,
                contractAddress: custodyRecord.tokenAddress,
                tokenId: custodyRecord.tokenId,
                txHash: op.fireblocksTaskId // Use fireblocksTaskId as txHash if available
              };
            }
          }
          return op;
        });
        
        setOperations(enrichedOps);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMintToken = async (e) => {
    e.preventDefault();
    
    if (!formData.assetId || !formData.tokenSymbol || !formData.tokenName) {
      alert('Please fill all required fields');
      return;
    }

    try {
      setSubmitting(true);
      
      const response = await authenticatedFetch('http://localhost:3000/v1/operations/dashboard/mint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          assetId: formData.assetId,
          tokenSymbol: formData.tokenSymbol,
          tokenName: formData.tokenName,
          totalSupply: formData.totalSupply,
          decimals: parseInt(formData.decimals),
          blockchain: formData.blockchain
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to create mint operation');
      }
      
      alert('Mint operation created! Status: PENDING_CHECKER (awaiting approval)');
      setFormData({
        assetId: '',
        tokenSymbol: '',
        tokenName: '',
        totalSupply: '1000000',
        decimals: '18',
        blockchain: 'ETH_TEST5'
      });
      setShowMintForm(false);
      fetchData();
    } catch (error) {
      console.error('Failed to create mint operation:', error);
      alert(error.message || 'Failed to create mint operation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (operationId) => {
    if (!confirm('Are you sure you want to approve this mint operation? This will mint the token on-chain.')) return;

    try {
      setApprovingId(operationId); // Set loading state
      const response = await authenticatedFetch(`http://localhost:3000/v1/operations/dashboard/${operationId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to approve operation');
      }
      
      alert('Operation approved! Token is being minted on-chain. This may take a few moments.');
      fetchData();
    } catch (error) {
      console.error('Failed to approve:', error);
      alert(error.message || 'Failed to approve operation');
    } finally {
      setApprovingId(null); // Clear loading state
    }
  };

  const handleReject = async (operationId) => {
    const reason = prompt('Enter rejection reason (optional):');
    if (reason === null) return; // User cancelled

    try {
      const response = await authenticatedFetch(`http://localhost:3000/v1/operations/dashboard/${operationId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: reason || 'No reason provided' })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to reject operation');
      }
      
      alert('Operation rejected');
      fetchData();
    } catch (error) {
      console.error('Failed to reject:', error);
      alert(error.message || 'Failed to reject operation');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      PENDING_CHECKER: { bg: 'rgba(255,255,0,0.2)', border: '#FF0', color: '#FF0' },
      APPROVED: { bg: 'rgba(0,255,0,0.2)', border: '#0F0', color: '#0F0' },
      EXECUTED: { bg: 'rgba(0,100,255,0.2)', border: '#06F', color: '#06F' },
      REJECTED: { bg: 'rgba(255,0,0,0.2)', border: '#F00', color: '#F00' },
      FAILED: { bg: 'rgba(255,0,0,0.2)', border: '#F00', color: '#F00' }
    };
    const style = styles[status] || { bg: 'rgba(100,100,100,0.2)', border: '#FFF', color: '#FFF' };
    
    return (
      <span style={{
        padding: '0.25rem 0.75rem',
        fontSize: '0.75rem',
        fontWeight: 'bold',
        border: `1px solid ${style.border}`,
        backgroundColor: style.bg,
        color: style.color
      }}>
        {status.replace('_', ' ')}
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
              Tokens
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.7)' }}>
              Mint tokens on-chain for custody assets
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => fetchData()}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                border: '1px solid #FFF',
                backgroundColor: 'transparent',
                color: '#FFF',
                textTransform: 'uppercase',
                fontSize: '0.875rem',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1
              }}
            >
              <RefreshCw size={18} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              Refresh
            </button>
            <button
              onClick={() => setShowMintForm(!showMintForm)}
              disabled={custodyRecords.length === 0}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                border: '1px solid #FFF',
                backgroundColor: showMintForm ? '#FFF' : 'transparent',
                color: showMintForm ? '#000' : '#FFF',
                textTransform: 'uppercase',
                fontSize: '0.875rem',
                fontWeight: 'bold',
                cursor: custodyRecords.length === 0 ? 'not-allowed' : 'pointer',
                opacity: custodyRecords.length === 0 ? 0.5 : 1
              }}
            >
              <Plus size={18} />
              Mint Token
            </button>
          </div>
        </div>

        {/* Info Box */}
        <div style={{ 
          marginBottom: '2rem', 
          padding: '1.5rem', 
          border: '1px solid #FFF',
          backgroundColor: 'rgba(255,255,255,0.05)'
        }}>
          <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Maker-Checker Workflow</h3>
          <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)', marginBottom: '0.5rem' }}>
            Token minting requires approval. MAKER creates the mint operation, CHECKER approves it,
            then the token is minted on-chain. This ensures security and compliance.
          </p>
          <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>
            Flow: Create Mint Operation → Pending Checker → Approved → Executed (Minted)
          </p>
        </div>

        {custodyRecords.length === 0 && (
          <div style={{ 
            marginBottom: '2rem',
            padding: '1.5rem', 
            border: '1px solid rgba(255,255,0,0.5)',
            backgroundColor: 'rgba(255,255,0,0.05)'
          }}>
            <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
              ⚠️ No LINKED custody records available. Please link and approve an asset first in the Custody page.
            </p>
          </div>
        )}

        {/* Mint Token Form */}
        {showMintForm && (
          <div style={{ 
            marginBottom: '2rem', 
            padding: '1.5rem', 
            border: '1px solid #FFF',
            backgroundColor: 'rgba(255,255,255,0.05)'
          }}>
            <h3 style={{ fontWeight: 'bold', marginBottom: '1rem' }}>Create Mint Operation</h3>
            <form onSubmit={handleMintToken}>
              <div style={{ display: 'grid', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', textTransform: 'uppercase' }}>
                    Asset ID *
                  </label>
                  <select
                    value={formData.assetId}
                    onChange={(e) => setFormData({ ...formData, assetId: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #FFF',
                      backgroundColor: '#000',
                      color: '#FFF',
                      fontSize: '1rem'
                    }}
                  >
                    <option value="">Select a custody record</option>
                    {custodyRecords.map((record) => (
                      <option key={record.id} value={record.assetId}>
                        {record.assetId} (Status: {record.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', textTransform: 'uppercase' }}>
                      Token Symbol *
                    </label>
                    <input
                      type="text"
                      value={formData.tokenSymbol}
                      onChange={(e) => setFormData({ ...formData, tokenSymbol: e.target.value.toUpperCase() })}
                      placeholder="e.g., PROP"
                      required
                      maxLength={10}
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

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', textTransform: 'uppercase' }}>
                      Token Name *
                    </label>
                    <input
                      type="text"
                      value={formData.tokenName}
                      onChange={(e) => setFormData({ ...formData, tokenName: e.target.value })}
                      placeholder="e.g., Property Token"
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
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', textTransform: 'uppercase' }}>
                      Total Supply *
                    </label>
                    <input
                      type="number"
                      value={formData.totalSupply}
                      onChange={(e) => setFormData({ ...formData, totalSupply: e.target.value })}
                      placeholder="1000000"
                      required
                      min="1"
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

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', textTransform: 'uppercase' }}>
                      Decimals *
                    </label>
                    <input
                      type="number"
                      value={formData.decimals}
                      onChange={(e) => setFormData({ ...formData, decimals: e.target.value })}
                      placeholder="18"
                      required
                      min="0"
                      max="18"
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

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', textTransform: 'uppercase' }}>
                      Blockchain
                    </label>
                    <select
                      value={formData.blockchain}
                      onChange={(e) => setFormData({ ...formData, blockchain: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #FFF',
                        backgroundColor: '#000',
                        color: '#FFF',
                        fontSize: '1rem'
                      }}
                    >
                      <option value="ETH_TEST5">Ethereum Testnet</option>
                      <option value="POLYGON_TEST">Polygon Testnet</option>
                      <option value="BSC_TEST">BSC Testnet</option>
                    </select>
                  </div>
                </div>
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
                  {submitting ? 'Creating...' : 'Create Mint Operation'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowMintForm(false)}
                  disabled={submitting}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: '1px solid #FFF',
                    backgroundColor: 'transparent',
                    color: '#FFF',
                    textTransform: 'uppercase',
                    fontSize: '0.875rem',
                    fontWeight: 'bold',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    opacity: submitting ? 0.6 : 1
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Operations List */}
        {operations.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '3rem', 
            border: '2px dashed rgba(255,255,255,0.3)'
          }}>
            <Coins size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem', fontSize: '1.125rem' }}>
              No mint operations yet
            </p>
            <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)' }}>
              {custodyRecords.length === 0 
                ? 'Link an asset in the Custody page first'
                : 'Click "Mint Token" to create your first mint operation'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {operations.map((op) => (
              <div key={op.id} style={{ 
                border: '1px solid #FFF', 
                padding: '1.5rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                        {op.payload?.tokenSymbol || 'N/A'}
                      </h3>
                      {getStatusBadge(op.status)}
                    </div>
                    
                    <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem' }}>
                      <div><strong>Token Name:</strong> {op.payload?.tokenName || 'N/A'}</div>
                      <div><strong>Asset ID:</strong> {op.payload?.assetId || 'N/A'}</div>
                      <div><strong>Total Supply:</strong> {op.payload?.totalSupply || 'N/A'}</div>
                      <div><strong>Blockchain:</strong> {op.payload?.blockchainId || 'N/A'}</div>
                    </div>

                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                      <div>Created: {new Date(op.createdAt).toLocaleString()}</div>
                      <div>Initiated by: {op.initiatedBy}</div>
                      {op.approvedBy && <div>Approved by: {op.approvedBy}</div>}
                      {op.rejectedBy && <div>Rejected by: {op.rejectedBy}</div>}
                      {op.rejectionReason && <div>Reason: {op.rejectionReason}</div>}
                    </div>
                  </div>

                  {/* Action Buttons for PENDING_CHECKER */}
                  {op.status === 'PENDING_CHECKER' && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                      <button
                        onClick={() => handleApprove(op.id)}
                        disabled={approvingId === op.id}
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: approvingId === op.id ? 'rgba(0,255,0,0.5)' : '#0F0',
                          color: '#000',
                          border: '1px solid #0F0',
                          cursor: approvingId === op.id ? 'not-allowed' : 'pointer',
                          fontWeight: 'bold',
                          fontSize: '0.875rem',
                          textTransform: 'uppercase',
                          opacity: approvingId === op.id ? 0.7 : 1
                        }}
                      >
                        {approvingId === op.id ? '⏳ Minting...' : '✓ Approve'}
                      </button>
                      <button
                        onClick={() => handleReject(op.id)}
                        disabled={approvingId === op.id}
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: '#F00',
                          color: '#FFF',
                          border: '1px solid #F00',
                          cursor: approvingId === op.id ? 'not-allowed' : 'pointer',
                          fontWeight: 'bold',
                          fontSize: '0.875rem',
                          textTransform: 'uppercase',
                          opacity: approvingId === op.id ? 0.5 : 1
                        }}
                      >
                        ✗ Reject
                      </button>
                    </div>
                  )}

                  {/* Progress indicator for APPROVED status */}
                  {op.status === 'APPROVED' && (
                    <div style={{ 
                      padding: '0.75rem', 
                      border: '1px solid rgba(255,255,0,0.5)',
                      backgroundColor: 'rgba(255,255,0,0.05)',
                      fontSize: '0.875rem',
                      maxWidth: '300px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <div style={{ 
                        width: '16px', 
                        height: '16px', 
                        border: '2px solid #FF0',
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></div>
                      <div style={{ color: '#FF0' }}>Minting on-chain...</div>
                    </div>
                  )}

                  {/* Success indicator for EXECUTED */}
                  {op.status === 'EXECUTED' && (
                    <div style={{ 
                      padding: '1rem', 
                      border: '1px solid rgba(0,255,0,0.5)',
                      backgroundColor: 'rgba(0,255,0,0.05)',
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                      maxWidth: '350px'
                    }}>
                      <div style={{ marginBottom: '0.5rem', color: '#0F0', fontWeight: 'bold' }}>
                        ✓ Minted On-Chain
                      </div>
                      {op.contractAddress && (
                        <div style={{ marginBottom: '0.25rem', wordBreak: 'break-all' }}>
                          <span style={{ color: 'rgba(255,255,255,0.7)' }}>Contract: </span>
                          <span style={{ color: '#0F0' }}>{op.contractAddress}</span>
                        </div>
                      )}
                      {op.txHash && (
                        <div style={{ wordBreak: 'break-all' }}>
                          <span style={{ color: 'rgba(255,255,255,0.7)' }}>TX: </span>
                          <span style={{ color: '#0F0' }}>{op.txHash}</span>
                        </div>
                      )}
                      {!op.contractAddress && !op.txHash && (
                        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem' }}>
                          Minting in progress. Contract address will appear when complete.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ClientLayout>
  );
}
