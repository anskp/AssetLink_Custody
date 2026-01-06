import { useState, useEffect, useRef } from 'react';
import ClientLayout from '../../components/ClientLayout';
import { Database, Coins, ShoppingCart, Users, ArrowRight } from 'lucide-react';

export default function TokenFlow() {
  const [flowData, setFlowData] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [draggedNode, setDraggedNode] = useState(null);
  const [nodePositions, setNodePositions] = useState({});

  useEffect(() => {
    fetchFlowData();
  }, []);

  const fetchFlowData = async () => {
    try {
      // TODO: Fetch real data from API
      // This should combine custody, tokens, listings, and ownership data
      
      // Mock data structure
      const mockData = [
        {
          assetId: 'property_001',
          custodyStatus: 'LINKED',
          custodyCreatedBy: 'issuer_john',
          token: {
            id: 'token_001',
            blockchain: 'ETHEREUM',
            tokenAddress: '0x742d35Cc...',
            quantity: 100,
            status: 'MINTED'
          },
          listing: {
            id: 'listing_001',
            price: '100.00',
            currency: 'USD',
            quantityListed: 100,
            quantitySold: 25
          },
          owners: [
            { userId: 'issuer_john', quantity: 75, role: 'Issuer' },
            { userId: 'investor_alice', quantity: 10, role: 'Investor', purchasePrice: '10.00' },
            { userId: 'investor_bob', quantity: 15, role: 'Investor', purchasePrice: '15.00' }
          ]
        }
      ];
      
      setFlowData(mockData);
      
      // Initialize node positions
      const positions = {};
      mockData.forEach((asset, assetIndex) => {
        positions[`asset_${asset.assetId}`] = { x: 100, y: 100 + assetIndex * 400 };
        positions[`token_${asset.assetId}`] = { x: 400, y: 100 + assetIndex * 400 };
        positions[`listing_${asset.assetId}`] = { x: 700, y: 100 + assetIndex * 400 };
        
        asset.owners.forEach((owner, ownerIndex) => {
          positions[`owner_${asset.assetId}_${owner.userId}`] = { 
            x: 1000, 
            y: 50 + assetIndex * 400 + ownerIndex * 100 
          };
        });
      });
      setNodePositions(positions);
    } catch (error) {
      console.error('Failed to fetch flow data:', error);
    }
  };

  const handleNodeDragStart = (e, nodeId) => {
    setDraggedNode(nodeId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleNodeDrag = (e, nodeId) => {
    if (e.clientX === 0 && e.clientY === 0) return; // Ignore final drag event
    
    const container = document.getElementById('flow-container');
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (x > 0 && y > 0) {
      setNodePositions(prev => ({
        ...prev,
        [nodeId]: { x, y }
      }));
    }
  };

  const handleNodeDragEnd = () => {
    setDraggedNode(null);
  };

  const renderNode = (id, type, data, position) => {
    const nodeStyle = {
      position: 'absolute',
      left: `${position.x}px`,
      top: `${position.y}px`,
      padding: '1rem',
      border: '2px solid #FFF',
      backgroundColor: '#000',
      minWidth: '200px',
      cursor: 'move',
      userSelect: 'none'
    };

    const getIcon = () => {
      switch (type) {
        case 'asset': return <Database size={20} />;
        case 'token': return <Coins size={20} />;
        case 'listing': return <ShoppingCart size={20} />;
        case 'owner': return <Users size={20} />;
        default: return null;
      }
    };

    return (
      <div
        key={id}
        draggable
        onDragStart={(e) => handleNodeDragStart(e, id)}
        onDrag={(e) => handleNodeDrag(e, id)}
        onDragEnd={handleNodeDragEnd}
        style={nodeStyle}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          {getIcon()}
          <strong style={{ textTransform: 'uppercase', fontSize: '0.75rem' }}>{type}</strong>
        </div>
        <div style={{ fontSize: '0.875rem' }}>
          {type === 'asset' && (
            <>
              <div><strong>{data.assetId}</strong></div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem' }}>
                Status: {data.custodyStatus}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem' }}>
                By: {data.custodyCreatedBy}
              </div>
            </>
          )}
          {type === 'token' && (
            <>
              <div><strong>{data.blockchain}</strong></div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem' }}>
                Qty: {data.quantity}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                {data.tokenAddress}
              </div>
            </>
          )}
          {type === 'listing' && (
            <>
              <div><strong>{data.price} {data.currency}</strong></div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem' }}>
                Listed: {data.quantityListed}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem' }}>
                Sold: {data.quantitySold}
              </div>
            </>
          )}
          {type === 'owner' && (
            <>
              <div><strong>{data.userId}</strong></div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem' }}>
                {data.role}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem' }}>
                Owns: {data.quantity} tokens
              </div>
              {data.purchasePrice && (
                <div style={{ color: 'rgba(0,255,0,0.8)', fontSize: '0.75rem' }}>
                  Paid: ${data.purchasePrice}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  const renderConnection = (from, to) => {
    const fromPos = nodePositions[from];
    const toPos = nodePositions[to];
    
    if (!fromPos || !toPos) return null;

    const x1 = fromPos.x + 200; // Node width
    const y1 = fromPos.y + 50; // Half node height
    const x2 = toPos.x;
    const y2 = toPos.y + 50;

    return (
      <line
        key={`${from}-${to}`}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="#FFF"
        strokeWidth="2"
        strokeDasharray="5,5"
      />
    );
  };

  return (
    <ClientLayout>
      <div style={{ padding: '2rem', color: '#FFF' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
            Token Flow Visualization
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)' }}>
            Visual representation of asset lifecycle: Custody → Minting → Listing → Ownership
          </p>
        </div>

        {/* Info Box */}
        <div style={{ 
          marginBottom: '2rem', 
          padding: '1.5rem', 
          border: '1px solid #FFF',
          backgroundColor: 'rgba(255,255,255,0.05)'
        }}>
          <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>How to Use</h3>
          <ul style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)', paddingLeft: '1.5rem' }}>
            <li>Drag nodes to rearrange the visualization</li>
            <li>Follow the flow: Asset → Token → Listing → Owners</li>
            <li>Each owner node shows who purchased tokens and how many</li>
            <li>Dashed lines show the connection between stages</li>
          </ul>
        </div>

        {/* Legend */}
        <div style={{ 
          marginBottom: '2rem', 
          padding: '1rem', 
          border: '1px solid #FFF',
          display: 'flex',
          gap: '2rem',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Database size={18} />
            <span style={{ fontSize: '0.875rem' }}>Custody Asset</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Coins size={18} />
            <span style={{ fontSize: '0.875rem' }}>Minted Token</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShoppingCart size={18} />
            <span style={{ fontSize: '0.875rem' }}>Marketplace Listing</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={18} />
            <span style={{ fontSize: '0.875rem' }}>Token Owner</span>
          </div>
        </div>

        {/* Flow Visualization */}
        {flowData.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '3rem', 
            border: '2px dashed rgba(255,255,255,0.3)'
          }}>
            <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem', fontSize: '1.125rem' }}>
              No token flow data yet
            </p>
            <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)' }}>
              Start by linking assets, minting tokens, and creating marketplace listings
            </p>
          </div>
        ) : (
          <div 
            id="flow-container"
            style={{ 
              position: 'relative',
              minHeight: '600px',
              border: '1px solid #FFF',
              backgroundColor: 'rgba(255,255,255,0.02)',
              overflow: 'auto'
            }}
          >
            {/* SVG for connections */}
            <svg style={{ position: 'absolute', width: '100%', height: '100%', pointerEvents: 'none' }}>
              {flowData.map((asset) => (
                <g key={asset.assetId}>
                  {/* Asset to Token */}
                  {renderConnection(`asset_${asset.assetId}`, `token_${asset.assetId}`)}
                  
                  {/* Token to Listing */}
                  {asset.listing && renderConnection(`token_${asset.assetId}`, `listing_${asset.assetId}`)}
                  
                  {/* Listing to Owners */}
                  {asset.owners.map((owner) => 
                    renderConnection(`listing_${asset.assetId}`, `owner_${asset.assetId}_${owner.userId}`)
                  )}
                </g>
              ))}
            </svg>

            {/* Nodes */}
            {flowData.map((asset) => (
              <div key={asset.assetId}>
                {/* Asset Node */}
                {nodePositions[`asset_${asset.assetId}`] && 
                  renderNode(`asset_${asset.assetId}`, 'asset', asset, nodePositions[`asset_${asset.assetId}`])}
                
                {/* Token Node */}
                {asset.token && nodePositions[`token_${asset.assetId}`] && 
                  renderNode(`token_${asset.assetId}`, 'token', asset.token, nodePositions[`token_${asset.assetId}`])}
                
                {/* Listing Node */}
                {asset.listing && nodePositions[`listing_${asset.assetId}`] && 
                  renderNode(`listing_${asset.assetId}`, 'listing', asset.listing, nodePositions[`listing_${asset.assetId}`])}
                
                {/* Owner Nodes */}
                {asset.owners.map((owner) => 
                  nodePositions[`owner_${asset.assetId}_${owner.userId}`] && 
                  renderNode(
                    `owner_${asset.assetId}_${owner.userId}`, 
                    'owner', 
                    owner, 
                    nodePositions[`owner_${asset.assetId}_${owner.userId}`]
                  )
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </ClientLayout>
  );
}
