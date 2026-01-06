import { useState, useEffect } from 'react';
import ClientLayout from '../../components/ClientLayout';

export default function Assets() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      // TODO: Replace with real API call when custody endpoint is ready
      // const response = await fetch('http://localhost:3000/v1/custody', {
      //   headers: { 'Authorization': `Bearer ${token}` }
      // });
      // const data = await response.json();
      // setAssets(data.records || []);
      
      // Mock data for now
      setAssets([]);
    } catch (error) {
      console.error('Failed to fetch assets:', error);
    } finally {
      setLoading(false);
    }
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
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
            Assets & Custody
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)' }}>
            View all custody records and ownership ledger
          </p>
        </div>

        {/* Info Box */}
        <div style={{ 
          marginBottom: '2rem', 
          padding: '1.5rem', 
          border: '1px solid #FFF',
          backgroundColor: 'rgba(255,255,255,0.1)'
        }}>
          <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Platform Owner View</h3>
          <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
            You see ALL custody records on your platform. Each asset shows who created it (issuer)
            and who owns tokens (investors). End users via API see only their own data.
          </p>
        </div>

        {/* Assets List */}
        {assets.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '3rem', 
            border: '2px dashed rgba(255,255,255,0.3)'
          }}>
            <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '1rem' }}>
              No assets in custody yet
            </p>
            <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)' }}>
              Use the API to link assets to custody
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {assets.map((asset) => (
              <div key={asset.id} style={{ border: '1px solid #FFF', padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                  {asset.assetId}
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)' }}>
                  Status: {asset.status}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </ClientLayout>
  );
}
