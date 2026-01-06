import { useState, useEffect } from 'react';
import ClientLayout from '../../components/ClientLayout';
import { DollarSign, Plus, X } from 'lucide-react';

export default function Marketplace() {
  console.log('🔥🔥🔥 MARKETPLACE V3.0 LOADED - NEW CODE 🔥🔥🔥');
  // Force reload marker: v2.0.0-20260103
  const [activeTab, setActiveTab] = useState('portfolio');
  const [myPortfolio, setMyPortfolio] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showListingModal, setShowListingModal] = useState(false);
  const [listingForm, setListingForm] = useState({
    assetId: '',
    price: '',
    quantity: '',
    currency: 'USD',
    daysValid: '30'
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        console.error('No access token found - please login');
        alert('Session expired. Please login again.');
        window.location.href = '/login';
        return;
      }
      
      if (activeTab === 'portfolio') {
        console.log('Fetching minted tokens...');
        const response = await fetch('http://localhost:3000/v1/marketplace/dashboard/minted-tokens', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log('Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Minted tokens received:', data);
          setMyPortfolio(data.data || []);
        } else if (response.status === 401) {
          console.error('❌ 401 Unauthorized - Token expired');
          alert('Session expired. Please login again.');
          window.location.href = '/login';
        } else {
          const error = await response.json();
          console.error('❌ Failed to fetch portfolio:', error);
          alert(`Error: ${error.error?.message || 'Failed to fetch tokens'}`);
        }
      } else if (activeTab === 'listings') {
        console.log('Fetching my listings...');
        const response = await fetch('http://localhost:3000/v1/marketplace/dashboard/my-listings', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ My listings received:', data);
          setMyListings(data.data || []);
        } else if (response.status === 401) {
          console.error('❌ 401 Unauthorized - Token expired');
          alert('Session expired. Please login again.');
          window.location.href = '/login';
        } else {
          const error = await response.json();
          console.error('❌ Failed to fetch listings:', error);
        }
      }
    } catch (error) {
      console.error('❌ Failed to fetch data:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenListingModal = (preSelectedToken = null) => {
    console.log('🚀 NEW CODE: Opening listing modal', preSelectedToken);
    if (preSelectedToken) {
      // Pre-select token when coming from portfolio
      setListingForm({
        assetId: preSelectedToken.assetId,
        price: '',
        quantity: preSelectedToken.quantity || '1',
        currency: 'USD',
        daysValid: '30'
      });
    } else {
      // Empty form when coming from "Create Listing" button
      setListingForm({
        assetId: '',
        price: '',
        quantity: '',
        currency: 'USD',
        daysValid: '30'
      });
    }
    setShowListingModal(true);
  };

  const handleCloseListingModal = () => {
    setShowListingModal(false);
    setListingForm({
      assetId: '',
      price: '',
      quantity: '',
      currency: 'USD',
      daysValid: '30'
    });
  };

  const handleAssetChange = (assetId) => {
    const token = myPortfolio.find(t => t.assetId === assetId);
    setListingForm({
      ...listingForm,
      assetId,
      quantity: token ? token.quantity : ''
    });
  };

  const handleCreateListing = async (e) => {
    e.preventDefault();
    
    if (!listingForm.assetId) {
      alert('Please select a token');
      return;
    }
    
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + parseInt(listingForm.daysValid));
    
    try {
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch('http://localhost:3000/v1/marketplace/dashboard/listings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          assetId: listingForm.assetId,
          price: listingForm.price,
          currency: listingForm.currency,
          quantity: listingForm.quantity,
          expiryDate: expiryDate.toISOString()
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to create listing');
      }
      
      alert('Listing created successfully!');
      handleCloseListingModal();
      // Switch to listings tab to show the new listing
      setActiveTab('listings');
      fetchData();
    } catch (error) {
      console.error('Failed to create listing:', error);
      alert(error.message || 'Failed to create listing');
    }
  };

  return (
    <ClientLayout>
      <div style={{ padding: '2rem', color: '#FFF' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
            Marketplace
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)' }}>
            Manage your token portfolio and marketplace listings
          </p>
        </div>

        {/* Tabs */}
        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          marginBottom: '2rem',
          borderBottom: '1px solid #FFF'
        }}>
          <button
            onClick={() => setActiveTab('portfolio')}
            style={{
              padding: '1rem 2rem',
              border: 'none',
              borderBottom: activeTab === 'portfolio' ? '2px solid #FFF' : '2px solid transparent',
              backgroundColor: 'transparent',
              color: activeTab === 'portfolio' ? '#FFF' : 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '0.875rem',
              textTransform: 'uppercase',
              transition: 'all 0.2s'
            }}
          >
            My Portfolio
          </button>
          <button
            onClick={() => setActiveTab('listings')}
            style={{
              padding: '1rem 2rem',
              border: 'none',
              borderBottom: activeTab === 'listings' ? '2px solid #FFF' : '2px solid transparent',
              backgroundColor: 'transparent',
              color: activeTab === 'listings' ? '#FFF' : 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '0.875rem',
              textTransform: 'uppercase',
              transition: 'all 0.2s'
            }}
          >
            My Listings
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>Loading...</div>
        ) : (
          <>
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
                    These are the tokens you've minted. Go to "My Listings" tab to create marketplace listings.
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
                                <strong>Contract:</strong> {token.tokenAddress}
                              </div>
                            )}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                            <div>Minted: {token.mintedAt ? new Date(token.mintedAt).toLocaleString() : 'N/A'}</div>
                            <div>Status: <span style={{ color: '#0F0' }}>{token.status}</span></div>
                          </div>
                        </div>
                        
                        <div style={{
                          padding: '1rem',
                          border: '1px solid rgba(0,255,0,0.5)',
                          backgroundColor: 'rgba(0,255,0,0.05)',
                          textAlign: 'center',
                          minWidth: '150px'
                        }}>
                          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', marginBottom: '0.25rem' }}>
                            TOTAL SUPPLY
                          </div>
                          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0F0' }}>
                            {token.quantity || '1'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.75rem' }}>
                            tokens
                          </div>
                          <button
                            onClick={() => handleOpenListingModal(token)}
                            style={{
                              width: '100%',
                              padding: '0.5rem',
                              border: '1px solid #FFF',
                              backgroundColor: '#FFF',
                              color: '#000',
                              cursor: 'pointer',
                              fontWeight: 'bold',
                              fontSize: '0.75rem',
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

            {/* My Listings Tab */}
            {activeTab === 'listings' && (
              <div>
                <div style={{ 
                  marginBottom: '1.5rem', 
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Your Marketplace Listings</h3>
                    <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)' }}>
                      Active listings available for purchase by end users via API
                    </p>
                  </div>
                  {myPortfolio.length > 0 && (
                    <button
                      onClick={() => handleOpenListingModal()}
                      style={{
                        padding: '0.75rem 1.5rem',
                        border: '1px solid #FFF',
                        backgroundColor: '#FFF',
                        color: '#000',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '0.875rem',
                        textTransform: 'uppercase',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <Plus size={16} />
                      Create Listing
                    </button>
                  )}
                </div>

                {myListings.length === 0 ? (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '3rem', 
                    border: '2px dashed rgba(255,255,255,0.3)'
                  }}>
                    <DollarSign size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                    <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem', fontSize: '1.125rem' }}>
                      You haven't created any listings yet
                    </p>
                    <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', marginBottom: '1.5rem' }}>
                      Create a listing to sell your tokens
                    </p>
                    {myPortfolio.length > 0 && (
                      <button
                        onClick={() => handleOpenListingModal()}
                        style={{
                          padding: '0.75rem 1.5rem',
                          border: '1px solid #FFF',
                          backgroundColor: '#FFF',
                          color: '#000',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          fontSize: '0.875rem',
                          textTransform: 'uppercase',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <Plus size={16} />
                        Create Your First Listing
                      </button>
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {myListings.map((listing) => (
                      <div key={listing.id} style={{ 
                        border: '1px solid #FFF', 
                        padding: '1.5rem'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                          <div style={{ flex: 1 }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                              {listing.asset?.assetId || 'N/A'}
                            </h3>
                            <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem' }}>
                              <div><strong>Price:</strong> ${listing.price} {listing.currency} per token</div>
                              <div><strong>Quantity:</strong> {listing.quantity} tokens</div>
                              <div><strong>Status:</strong> <span style={{ color: listing.status === 'ACTIVE' ? '#0F0' : '#F00' }}>{listing.status}</span></div>
                              <div><strong>Expires:</strong> {new Date(listing.expiryDate).toLocaleDateString()}</div>
                            </div>
                            {listing.bids && listing.bids.length > 0 && (
                              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.5rem' }}>
                                {listing.bids.length} pending bid(s)
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Listing Modal */}
        {showListingModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: '#000',
              border: '2px solid #FFF',
              padding: '2rem',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', textTransform: 'uppercase' }}>
                  Create Marketplace Listing
                </h2>
                <button
                  onClick={handleCloseListingModal}
                  style={{
                    border: '1px solid #FFF',
                    backgroundColor: 'transparent',
                    color: '#FFF',
                    cursor: 'pointer',
                    padding: '0.5rem',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateListing}>
                {/* Asset ID Dropdown */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 'bold' }}>
                    Asset ID <span style={{ color: '#F00' }}>*</span>
                  </label>
                  {myPortfolio.length === 0 ? (
                    <div style={{
                      padding: '0.75rem',
                      border: '1px solid rgba(255,255,255,0.3)',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      fontSize: '0.875rem',
                      color: 'rgba(255,255,255,0.5)'
                    }}>
                      No minted tokens available. Mint a token first in the Tokens page.
                    </div>
                  ) : (
                    <select
                      required
                      value={listingForm.assetId}
                      onChange={(e) => handleAssetChange(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #FFF',
                        backgroundColor: '#000',
                        color: '#FFF',
                        fontSize: '0.875rem',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="">Select a minted token</option>
                      {myPortfolio.map((token) => (
                        <option key={token.id} value={token.assetId}>
                          {token.assetId} ({token.quantity} tokens available)
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Price */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 'bold' }}>
                    Price (per token)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={listingForm.price}
                    onChange={(e) => setListingForm({ ...listingForm, price: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #FFF',
                      backgroundColor: '#000',
                      color: '#FFF',
                      fontSize: '0.875rem'
                    }}
                    placeholder="0.00"
                  />
                </div>

                {/* Currency */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 'bold' }}>
                    Currency
                  </label>
                  <select
                    required
                    value={listingForm.currency}
                    onChange={(e) => setListingForm({ ...listingForm, currency: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #FFF',
                      backgroundColor: '#000',
                      color: '#FFF',
                      fontSize: '0.875rem',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>

                {/* Quantity */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 'bold' }}>
                    Quantity
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    max={listingForm.assetId ? myPortfolio.find(t => t.assetId === listingForm.assetId)?.quantity : ''}
                    required
                    value={listingForm.quantity}
                    onChange={(e) => setListingForm({ ...listingForm, quantity: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #FFF',
                      backgroundColor: '#000',
                      color: '#FFF',
                      fontSize: '0.875rem'
                    }}
                    placeholder="1"
                    disabled={!listingForm.assetId}
                  />
                </div>

                {/* Expiry Date */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 'bold' }}>
                    Expiry Date
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    required
                    value={listingForm.daysValid}
                    onChange={(e) => setListingForm({ ...listingForm, daysValid: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #FFF',
                      backgroundColor: '#000',
                      color: '#FFF',
                      fontSize: '0.875rem'
                    }}
                    placeholder="30"
                  />
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.25rem' }}>
                    Number of days from today
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    type="button"
                    onClick={handleCloseListingModal}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      border: '1px solid #FFF',
                      backgroundColor: 'transparent',
                      color: '#FFF',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '0.875rem',
                      textTransform: 'uppercase'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={myPortfolio.length === 0}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      border: '1px solid #FFF',
                      backgroundColor: myPortfolio.length === 0 ? 'rgba(255,255,255,0.3)' : '#FFF',
                      color: myPortfolio.length === 0 ? 'rgba(0,0,0,0.5)' : '#000',
                      cursor: myPortfolio.length === 0 ? 'not-allowed' : 'pointer',
                      fontWeight: 'bold',
                      fontSize: '0.875rem',
                      textTransform: 'uppercase'
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
