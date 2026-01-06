import { useState, useEffect } from 'react';
import ClientLayout from '../../components/ClientLayout';
import { Plus, ShoppingCart, DollarSign, User } from 'lucide-react';

export default function Marketplace() {
  const [activeTab, setActiveTab] = useState('portfolio');
  const [listings, setListings] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [myPortfolio, setMyPortfolio] = useState([]);
  const [allPortfolios, setAllPortfolios] = useState([]);
  const [mintedTokens, setMintedTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Create Listing Form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    assetId: '',
    price: '',
    currency: 'USD',
    quantity: '1',
    expiryDate: ''
  });

  // Place Bid Form
  const [showBidForm, setShowBidForm] = useState(null);
  const [bidFormData, setBidFormData] = useState({
    amount: '',
    quantity: '1'
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      
      if (activeTab === 'portfolio') {
        // Fetch my minted tokens (my portfolio)
        const response = await fetch('http://localhost:3000/v1/marketplace/dashboard/minted-tokens', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          console.log('My Portfolio data:', data);
          setMyPortfolio(data.data || []);
        } else {
          const error = await response.json();
          console.error('Failed to fetch portfolio:', error);
        }
      } else if (activeTab === 'all') {
        // Fetch all listings on the platform
        const response = await fetch('http://localhost:3000/v1/marketplace/dashboard/listings', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          console.log('All listings data:', data);
          setListings(data.data || []);
        } else {
          const error = await response.json();
          console.error('Failed to fetch listings:', error);
        }
      } else if (activeTab === 'my-listings') {
        // Fetch listings created by this client
        const response = await fetch('http://localhost:3000/v1/marketplace/dashboard/my-listings', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          console.log('My listings data:', data);
          setMyListings(data.data || []);
        } else {
          const error = await response.json();
          console.error('Failed to fetch my listings:', error);
        }
      } else if (activeTab === 'all-portfolios') {
        // Fetch ALL end users' portfolios (platform owner view)
        const response = await fetch('http://localhost:3000/v1/marketplace/dashboard/portfolios', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          console.log('All portfolios data:', data);
          setAllPortfolios(data.data || []);
        } else {
          const error = await response.json();
          console.error('Failed to fetch all portfolios:', error);
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleCreateListingFromPortfolio = async (assetId, availableQuantity) => {
    const price = prompt('Enter price per token (USD):');
    if (!price || parseFloat(price) <= 0) return;
    
    const quantity = prompt(`Enter quantity to list (max ${availableQuantity}):`);
    if (!quantity || parseFloat(quantity) <= 0 || parseFloat(quantity) > parseFloat(availableQuantity)) {
      alert(`Invalid quantity. Must be between 1 and ${availableQuantity}`);
      return;
    }
    
    const daysValid = prompt('Enter number of days listing should be valid:', '30');
    if (!daysValid || parseInt(daysValid) <= 0) return;
    
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + parseInt(daysValid));
    
    try {
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch('http://localhost:3000/v1/marketplace/dashboard/listings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          assetId,
          price,
          currency: 'USD',
          quantity,
          expiryDate: expiryDate.toISOString()
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to create listing');
      }
      
      alert('Listing created successfully!');
      fetchData();
    } catch (error) {
      console.error('Failed to create listing:', error);
      alert(error.message || 'Failed to create listing');
    }
  };

  const handleCreateListing = async (e) => {
    e.preventDefault();
    
    if (!createFormData.assetId || !createFormData.price || !createFormData.expiryDate) {
      alert('Please fill all required fields');
      return;
    }
    
    try {
      setSubmitting(true);
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch('http://localhost:3000/v1/marketplace/dashboard/listings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          assetId: createFormData.assetId,
          price: createFormData.price,
          currency: createFormData.currency,
          quantity: createFormData.quantity,
          expiryDate: new Date(createFormData.expiryDate).toISOString()
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to create listing');
      }
      
      alert('Listing created successfully!');
      setShowCreateForm(false);
      setCreateFormData({ assetId: '', price: '', currency: 'USD', quantity: '1', expiryDate: '' });
      fetchData();
    } catch (error) {
      console.error('Failed to create listing:', error);
      alert(error.message || 'Failed to create listing');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePlaceBid = async (e, listingId) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('accessToken');
      // TODO: API call to place bid (requires buyer user ID)
      alert('Bid placement is only available via API with X-USER-ID header');
      setShowBidForm(null);
      setBidFormData({ amount: '', quantity: '1' });
    } catch (error) {
      console.error('Failed to place bid:', error);
      alert('Failed to place bid');
    }
  };

  const handleAcceptBid = async (bidId) => {
    if (!confirm('Are you sure you want to accept this bid? This will transfer ownership.')) return;
    
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:3000/v1/marketplace/dashboard/bids/${bidId}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to accept bid');
      }
      
      alert('Bid accepted! Ownership transferred.');
      fetchData();
    } catch (error) {
      console.error('Failed to accept bid:', error);
      alert(error.message || 'Failed to accept bid');
    }
  };

  const handleRejectBid = async (bidId) => {
    if (!confirm('Are you sure you want to reject this bid?')) return;
    
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:3000/v1/marketplace/dashboard/bids/${bidId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to reject bid');
      }
      
      alert('Bid rejected');
      fetchData();
    } catch (error) {
      console.error('Failed to reject bid:', error);
      alert(error.message || 'Failed to reject bid');
    }
  };

  const handleCancelListing = async (listingId) => {
    if (!confirm('Are you sure you want to cancel this listing?')) return;
    
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:3000/v1/marketplace/dashboard/listings/${listingId}/cancel`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to cancel listing');
      }
      
      alert('Listing cancelled');
      fetchData();
    } catch (error) {
      console.error('Failed to cancel listing:', error);
      alert(error.message || 'Failed to cancel listing');
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
        {/* Header */}
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
              Marketplace
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.7)' }}>
              Platform owner view - See all listings and end user portfolios
            </p>
          </div>
          {activeTab === 'my-listings' && (
            <button
              onClick={() => setShowCreateForm(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                border: '1px solid #FFF',
                backgroundColor: '#FFF',
                color: '#000',
                textTransform: 'uppercase',
                fontSize: '0.875rem',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              <Plus size={18} />
              Create Listing
            </button>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid #FFF' }}>
          <button
            onClick={() => setActiveTab('portfolio')}
            style={{
              padding: '0.75rem 1.5rem',
              fontWeight: 'bold',
              border: '1px solid #FFF',
              borderBottom: 'none',
              backgroundColor: activeTab === 'portfolio' ? '#FFF' : 'transparent',
              color: activeTab === 'portfolio' ? '#000' : '#FFF',
              cursor: 'pointer',
              textTransform: 'uppercase',
              fontSize: '0.875rem'
            }}
          >
            My Portfolio
          </button>
          <button
            onClick={() => setActiveTab('my-listings')}
            style={{
              padding: '0.75rem 1.5rem',
              fontWeight: 'bold',
              border: '1px solid #FFF',
              borderBottom: 'none',
              backgroundColor: activeTab === 'my-listings' ? '#FFF' : 'transparent',
              color: activeTab === 'my-listings' ? '#000' : '#FFF',
              cursor: 'pointer',
              textTransform: 'uppercase',
              fontSize: '0.875rem'
            }}
          >
            My Listings
          </button>
          <button
            onClick={() => setActiveTab('all')}
            style={{
              padding: '0.75rem 1.5rem',
              fontWeight: 'bold',
              border: '1px solid #FFF',
              borderBottom: 'none',
              backgroundColor: activeTab === 'all' ? '#FFF' : 'transparent',
              color: activeTab === 'all' ? '#000' : '#FFF',
              cursor: 'pointer',
              textTransform: 'uppercase',
              fontSize: '0.875rem'
            }}
          >
            All Listings
          </button>
          <button
            onClick={() => setActiveTab('all-portfolios')}
            style={{
              padding: '0.75rem 1.5rem',
              fontWeight: 'bold',
              border: '1px solid #FFF',
              borderBottom: 'none',
              backgroundColor: activeTab === 'all-portfolios' ? '#FFF' : 'transparent',
              color: activeTab === 'all-portfolios' ? '#000' : '#FFF',
              cursor: 'pointer',
              textTransform: 'uppercase',
              fontSize: '0.875rem'
            }}
          >
            All Portfolios
          </button>
        </div>


        {/* My Portfolio Tab */}
        {activeTab === 'portfolio' && (
          <div>
            <div style={{ 
              marginBottom: '1.5rem', 
              padding: '1rem', 
              border: '1px solid #FFF',
              backgroundColor: 'rgba(255,255,255,0.05)'
            }}>
              <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Your Minted Tokens</h3>
              <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)' }}>
                These are the tokens you've minted. Click "List for Sale" to create a marketplace listing.
              </p>
            </div>

            {myPortfolio.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '3rem', 
                border: '2px dashed rgba(255,255,255,0.3)'
              }}>
                <DollarSign size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem', fontSize: '1.125rem' }}>
                  No minted tokens yet
                </p>
                <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)' }}>
                  Mint tokens in the Tokens page first
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {myPortfolio.map((token) => (
                  <div key={token.id} style={{ 
                    border: '1px solid #FFF', 
                    padding: '1.5rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                        {token.assetId}
                      </h3>
                      <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem' }}>
                        <div><strong>Blockchain:</strong> {token.blockchain || 'N/A'}</div>
                        <div><strong>Token Standard:</strong> {token.tokenStandard || 'N/A'}</div>
                        {token.tokenAddress && (
                          <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                            <strong>Contract:</strong> {token.tokenAddress.substring(0, 20)}...
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                        <div>Minted: {token.mintedAt ? new Date(token.mintedAt).toLocaleString() : 'N/A'}</div>
                        <div>Status: <span style={{ color: '#0F0' }}>{token.status}</span></div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginLeft: '2rem' }}>
                      <div style={{
                        padding: '1rem',
                        border: '1px solid rgba(0,255,0,0.5)',
                        backgroundColor: 'rgba(0,255,0,0.05)',
                        textAlign: 'center',
                        minWidth: '150px'
                      }}>
                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', marginBottom: '0.25rem' }}>
                          AVAILABLE
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0F0' }}>
                          {token.quantity || '1'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
                          tokens
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleCreateListingFromPortfolio(token.assetId, token.quantity || '1')}
                        style={{
                          padding: '0.75rem 1.5rem',
                          border: '1px solid #FFF',
                          backgroundColor: '#FFF',
                          color: '#000',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          fontSize: '0.875rem',
                          textTransform: 'uppercase'
                        }}
                      >
                        List for Sale
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* All Listings Tab */}
        {activeTab === 'all' && (
          <div>
            {listings.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '3rem', 
                border: '2px dashed rgba(255,255,255,0.3)'
              }}>
                <ShoppingCart size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem', fontSize: '1.125rem' }}>
                  No listings available
                </p>
                <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)' }}>
                  Check back later for new listings
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {listings.map((listing) => (
                  <div key={listing.id} style={{ border: '1px solid #FFF', padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                      <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                          {listing.assetId}
                        </h3>
                        <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)' }}>
                          <div>Seller: <strong>{listing.sellerId}</strong></div>
                          <div>Available: <strong>{listing.quantityListed - listing.quantitySold}</strong> / {listing.quantityListed}</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0F0' }}>
                          ${listing.price} {listing.currency}
                        </div>
                        <button
                          onClick={() => setShowBidForm(listing.id)}
                          style={{
                            marginTop: '0.5rem',
                            padding: '0.5rem 1rem',
                            border: '1px solid #FFF',
                            backgroundColor: '#FFF',
                            color: '#000',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: 'bold'
                          }}
                        >
                          Place Bid
                        </button>
                      </div>
                    </div>
                    
                    {showBidForm === listing.id && (
                      <form onSubmit={(e) => handlePlaceBid(e, listing.id)} style={{ 
                        marginTop: '1rem', 
                        padding: '1rem', 
                        border: '1px solid rgba(255,255,255,0.3)',
                        backgroundColor: 'rgba(255,255,255,0.05)'
                      }}>
                        <h4 style={{ fontWeight: 'bold', marginBottom: '1rem' }}>Place Your Bid</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                          <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                              Amount (per token)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={bidFormData.amount}
                              onChange={(e) => setBidFormData({ ...bidFormData, amount: e.target.value })}
                              required
                              style={{
                                width: '100%',
                                padding: '0.5rem',
                                border: '1px solid #FFF',
                                backgroundColor: '#000',
                                color: '#FFF'
                              }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                              Quantity
                            </label>
                            <input
                              type="number"
                              value={bidFormData.quantity}
                              onChange={(e) => setBidFormData({ ...bidFormData, quantity: e.target.value })}
                              required
                              max={listing.quantityListed - listing.quantitySold}
                              style={{
                                width: '100%',
                                padding: '0.5rem',
                                border: '1px solid #FFF',
                                backgroundColor: '#000',
                                color: '#FFF'
                              }}
                            />
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            type="submit"
                            style={{
                              padding: '0.5rem 1rem',
                              border: '1px solid #FFF',
                              backgroundColor: '#FFF',
                              color: '#000',
                              cursor: 'pointer',
                              fontWeight: 'bold'
                            }}
                          >
                            Submit Bid
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowBidForm(null)}
                            style={{
                              padding: '0.5rem 1rem',
                              border: '1px solid #FFF',
                              backgroundColor: 'transparent',
                              color: '#FFF',
                              cursor: 'pointer'
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}


        {/* My Listings Tab */}
        {activeTab === 'my-listings' && (
          <div>
            {myListings.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '3rem', 
                border: '2px dashed rgba(255,255,255,0.3)'
              }}>
                <ShoppingCart size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem', fontSize: '1.125rem' }}>
                  You haven't created any listings yet
                </p>
                <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', marginBottom: '1rem' }}>
                  Create a listing to sell your tokens
                </p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  style={{
                    padding: '0.5rem 1rem',
                    border: '1px solid #FFF',
                    backgroundColor: '#FFF',
                    color: '#000',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Create Your First Listing
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {myListings.map((listing) => (
                  <div key={listing.id} style={{ border: '1px solid #FFF', padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                          {listing.assetId}
                        </h3>
                        <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)' }}>
                          <div>Price: <strong>${listing.price} {listing.currency}</strong></div>
                          <div>Listed: <strong>{listing.quantityListed}</strong></div>
                          <div>Sold: <strong>{listing.quantitySold}</strong></div>
                          <div>Available: <strong>{parseFloat(listing.quantityListed) - parseFloat(listing.quantitySold)}</strong></div>
                          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.25rem' }}>
                            Expires: {new Date(listing.expiryDate).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                        <span style={{
                          padding: '0.5rem 1rem',
                          border: '1px solid #FFF',
                          backgroundColor: listing.status === 'ACTIVE' ? 'rgba(0,255,0,0.1)' : 'rgba(255,255,255,0.1)',
                          fontSize: '0.75rem',
                          textTransform: 'uppercase',
                          fontWeight: 'bold'
                        }}>
                          {listing.status}
                        </span>
                        {listing.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleCancelListing(listing.id)}
                            style={{
                              padding: '0.5rem 1rem',
                              border: '1px solid #F00',
                              backgroundColor: 'transparent',
                              color: '#F00',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              fontWeight: 'bold',
                              textTransform: 'uppercase'
                            }}
                          >
                            Cancel Listing
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {listing.bids && listing.bids.length > 0 && (
                      <div style={{ marginTop: '1rem', padding: '1rem', border: '1px solid rgba(255,255,255,0.3)' }}>
                        <h4 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Pending Bids ({listing.bids.length})</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {listing.bids.map((bid) => (
                            <div key={bid.id} style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center',
                              padding: '0.5rem',
                              border: '1px solid rgba(255,255,255,0.2)'
                            }}>
                              <div style={{ fontSize: '0.875rem' }}>
                                <strong>{bid.buyerId}</strong> - ${bid.amount} × {bid.quantity} tokens
                              </div>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                  onClick={() => handleAcceptBid(bid.id)}
                                  style={{
                                    padding: '0.25rem 0.75rem',
                                    border: '1px solid #0F0',
                                    backgroundColor: 'transparent',
                                    color: '#0F0',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem'
                                  }}
                                >
                                  Accept
                                </button>
                                <button
                                  onClick={() => handleRejectBid(bid.id)}
                                  style={{
                                    padding: '0.25rem 0.75rem',
                                    border: '1px solid #F00',
                                    backgroundColor: 'transparent',
                                    color: '#F00',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem'
                                  }}
                                >
                                  Reject
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}


        {/* All Portfolios Tab - Platform Owner View */}
        {activeTab === 'all-portfolios' && (
          <div>
            <div style={{ 
              marginBottom: '1.5rem', 
              padding: '1rem', 
              border: '1px solid #FFF',
              backgroundColor: 'rgba(255,255,255,0.05)'
            }}>
              <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Platform Owner View</h3>
              <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)' }}>
                You see ALL end users' portfolios on your platform. Each end user (identified by X-USER-ID in API calls) 
                can only see their own portfolio via the API.
              </p>
            </div>

            {allPortfolios.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '3rem', 
                border: '2px dashed rgba(255,255,255,0.3)'
              }}>
                <User size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem', fontSize: '1.125rem' }}>
                  No token ownership yet
                </p>
                <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)' }}>
                  End users will appear here once they purchase tokens via the API
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {/* Group by user */}
                {Object.entries(
                  allPortfolios.reduce((acc, holding) => {
                    if (!acc[holding.ownerId]) acc[holding.ownerId] = [];
                    acc[holding.ownerId].push(holding);
                    return acc;
                  }, {})
                ).map(([userId, holdings]) => (
                  <div key={userId} style={{ border: '1px solid #FFF', padding: '1.5rem' }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '1rem',
                      paddingBottom: '1rem',
                      borderBottom: '1px solid rgba(255,255,255,0.3)'
                    }}>
                      <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                          {userId}
                        </h3>
                        <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)' }}>
                          End User / Investor
                        </p>
                      </div>
                      <div style={{
                        padding: '0.75rem 1rem',
                        border: '1px solid #0F0',
                        backgroundColor: 'rgba(0,255,0,0.1)',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', marginBottom: '0.25rem' }}>
                          TOTAL HOLDINGS
                        </div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#0F0' }}>
                          {holdings.reduce((sum, h) => sum + h.quantity, 0)} tokens
                        </div>
                      </div>
                    </div>

                    {/* User's holdings */}
                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                      {holdings.map((holding) => (
                        <div key={holding.id} style={{ 
                          padding: '1rem',
                          border: '1px solid rgba(255,255,255,0.3)',
                          backgroundColor: 'rgba(255,255,255,0.02)',
                          display: 'grid',
                          gridTemplateColumns: '2fr 1fr 1fr 1fr',
                          gap: '1rem',
                          alignItems: 'center'
                        }}>
                          <div>
                            <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                              {holding.assetId}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
                              Acquired: {new Date(holding.acquiredAt).toLocaleDateString()}
                            </div>
                            {holding.custodyRecord?.tokenAddress && (
                              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.25rem', fontFamily: 'monospace' }}>
                                Contract: {holding.custodyRecord.tokenAddress.substring(0, 10)}...
                              </div>
                            )}
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.25rem' }}>
                              Quantity
                            </div>
                            <div style={{ fontWeight: 'bold' }}>
                              {holding.quantity}
                            </div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.25rem' }}>
                              Price Paid
                            </div>
                            <div style={{ fontWeight: 'bold' }}>
                              ${holding.purchasePrice || '0'}
                            </div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.25rem' }}>
                              Total Value
                            </div>
                            <div style={{ fontWeight: 'bold', color: '#0F0' }}>
                              ${(parseFloat(holding.purchasePrice || 0) * parseFloat(holding.quantity)).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Create Listing Modal */}
        {showCreateForm && (
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
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
                Create Marketplace Listing
              </h2>
              
              <form onSubmit={handleCreateListing}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 'bold' }}>
                      Asset ID *
                    </label>
                    <select
                      value={createFormData.assetId}
                      onChange={(e) => setCreateFormData({ ...createFormData, assetId: e.target.value })}
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #FFF',
                        backgroundColor: '#000',
                        color: '#FFF'
                      }}
                    >
                      <option value="">Select a minted token</option>
                      {mintedTokens.map((token) => (
                        <option key={token.id} value={token.assetId}>
                          {token.assetId} ({token.tokenAddress ? 'Minted' : 'Pending'})
                        </option>
                      ))}
                    </select>
                    {mintedTokens.length === 0 && (
                      <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,0,0.8)', marginTop: '0.5rem' }}>
                        No minted tokens available. Mint a token first in the Tokens page.
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 'bold' }}>
                        Price (per token)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={createFormData.price}
                        onChange={(e) => setCreateFormData({ ...createFormData, price: e.target.value })}
                        required
                        placeholder="100.00"
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #FFF',
                          backgroundColor: '#000',
                          color: '#FFF'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 'bold' }}>
                        Currency
                      </label>
                      <select
                        value={createFormData.currency}
                        onChange={(e) => setCreateFormData({ ...createFormData, currency: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #FFF',
                          backgroundColor: '#000',
                          color: '#FFF'
                        }}
                      >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 'bold' }}>
                      Quantity
                    </label>
                    <input
                      type="number"
                      value={createFormData.quantity}
                      onChange={(e) => setCreateFormData({ ...createFormData, quantity: e.target.value })}
                      required
                      placeholder="100"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #FFF',
                        backgroundColor: '#000',
                        color: '#FFF'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 'bold' }}>
                      Expiry Date
                    </label>
                    <input
                      type="datetime-local"
                      value={createFormData.expiryDate}
                      onChange={(e) => setCreateFormData({ ...createFormData, expiryDate: e.target.value })}
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #FFF',
                        backgroundColor: '#000',
                        color: '#FFF'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
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
                    type="submit"
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
                    Create Listing
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ClientLayout>
  );
}
