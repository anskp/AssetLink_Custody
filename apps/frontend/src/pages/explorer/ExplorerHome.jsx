import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Activity, Box, Database, Clock, ArrowRight, ExternalLink, Search } from 'lucide-react';
import ExplorerLayout from '../../components/ExplorerLayout';

const ExplorerHome = () => {
    const navigate = useNavigate();
    const [latestTxs, setLatestTxs] = useState([]);
    const [stats, setStats] = useState({ totalAssets: 0, totalOps: 0, healthy: true });
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchExplorerData = async () => {
            try {
                const res = await fetch('http://localhost:3000/v1/explorer/latest-txs');
                const result = await res.json();
                if (result.success) {
                    setLatestTxs(result.data);
                }

                // Fetch stats (public endpoint)
                const statsRes = await fetch('http://localhost:3000/v1/explorer/stats');
                const statsResult = await statsRes.json();
                if (statsResult.success) {
                    setStats(prev => ({ ...prev, totalAssets: statsResult.data.total, totalOps: result.data.length }));
                }
            } catch (err) {
                console.error('Failed to fetch explorer data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchExplorerData();
        const interval = setInterval(fetchExplorerData, 10000);
        return () => clearInterval(interval);
    }, []);

    const handleSearch = (q) => {
        const query = q || searchQuery;
        if (!query) return;
        if (query.startsWith('alca_')) navigate(`/explorer/asset/${query}`);
        else if (query.startsWith('altx_')) navigate(`/explorer/tx/${query}`);
        else navigate(`/explorer/address/${query}`);
    };

    const statusColors = {
        'EXECUTED': '#22C55E',
        'APPROVED': '#3B82F6',
        'PENDING_CHECKER': '#EAB308',
        'FAILED': '#EF4444',
        'REJECTED': '#EF4444'
    };

    return (
        <ExplorerLayout onSearch={handleSearch}>
            {({ isDark, colors }) => (
                <>
                    {/* Stats Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
                        <StatCard icon={<Activity size={24} color={isDark ? '#FFF' : '#000'} />} label="NETWORK STATUS" value="HEALTHY" colors={colors} isDark={isDark} />
                        <StatCard icon={<Box size={24} color={isDark ? '#FFF' : '#000'} />} label="TOTAL ASSETS" value={stats.totalAssets} colors={colors} isDark={isDark} />
                        <StatCard icon={<Database size={24} color={isDark ? '#FFF' : '#000'} />} label="LEDGER OPERATIONS" value={latestTxs.length || 0} colors={colors} isDark={isDark} />
                        <StatCard icon={<Clock size={24} color={isDark ? '#FFF' : '#000'} />} label="AVG. SETTLEMENT" value="OFF-CHAIN" colors={colors} isDark={isDark} />
                    </div>

                    {/* Central Search Bar */}
                    <div style={{
                        backgroundColor: colors.surface,
                        padding: '2rem',
                        borderRadius: '16px',
                        border: `1px solid ${colors.border}`,
                        marginBottom: '2.5rem',
                        boxShadow: isDark ? 'none' : '0 4px 12px rgba(0,0,0,0.03)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem'
                    }}>
                        <h3 style={{ fontSize: '0.875rem', fontWeight: '700', color: colors.textMuted, letterSpacing: '0.05em' }}>SEARCH THE LEDGER</h3>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            backgroundColor: isDark ? '#1A1A1A' : '#F8FAFC',
                            padding: '0.75rem 1.25rem',
                            borderRadius: '12px',
                            border: `2px solid ${isDark ? '#333' : '#E2E8F0'}`
                        }}>
                            <Search size={20} color={colors.textMuted} />
                            <input
                                type="text"
                                placeholder="Search by Asset ID (alca_...), Transaction Hash (altx_...), or User Address..."
                                style={{ background: 'none', border: 'none', color: colors.text, width: '100%', fontSize: '1rem', outline: 'none' }}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                            <button
                                onClick={() => handleSearch()}
                                style={{
                                    backgroundColor: colors.accent,
                                    color: '#FFF',
                                    border: 'none',
                                    padding: '0.5rem 1.5rem',
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Search
                            </button>
                        </div>
                    </div>

                    {/* Latest Transactions */}
                    <div style={{ backgroundColor: colors.surface, borderRadius: '12px', border: `1px solid ${colors.border}`, overflow: 'hidden', boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <div style={{ padding: '1.5rem', borderBottom: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '1.125rem', fontWeight: '700' }}>Latest Off-chain Transactions</h2>
                            <span style={{ fontSize: '0.75rem', color: colors.textMuted, letterSpacing: '0.05em', fontWeight: '600' }}>UPDATED REAL-TIME</span>
                        </div>

                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ borderBottom: `1px solid ${colors.border}`, color: colors.textMuted, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        <th style={thStyle}>Transaction Hash</th>
                                        <th style={thStyle}>Method</th>
                                        <th style={thStyle}>Asset</th>
                                        <th style={thStyle}>Amount</th>
                                        <th style={thStyle}>Vaults (FR/TO)</th>
                                        <th style={thStyle}>Status</th>
                                        <th style={thStyle}>Explorer</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan="7" style={{ padding: '4rem', textAlign: 'center', color: colors.textMuted }}>Loading Ledger Data...</td></tr>
                                    ) : latestTxs.map((tx, idx) => (
                                        <tr key={idx} style={{
                                            borderBottom: `1px solid ${isDark ? '#1A1A1A' : '#F1F5F9'}`,
                                            transition: 'background-color 0.2s'
                                        }}>
                                            <td style={tdStyle}>
                                                <Link to={`/explorer/tx/${tx.offchainTxHash}`} style={{ color: colors.accent, textDecoration: 'none', fontFamily: 'monospace', fontWeight: '500' }}>
                                                    {tx.offchainTxHash?.substring(0, 18)}...
                                                </Link>
                                            </td>
                                            <td style={tdStyle}>
                                                <span style={{
                                                    backgroundColor: isDark ? '#1A1A1A' : '#F1F5F9',
                                                    color: colors.textMuted,
                                                    padding: '0.25rem 0.5rem',
                                                    borderRadius: '4px',
                                                    fontSize: '0.625rem',
                                                    fontWeight: '700',
                                                    border: `1px solid ${colors.border}`
                                                }}>{tx.type}</span>
                                            </td>
                                            <td style={tdStyle}>
                                                {tx.assetAddress ? (
                                                    <Link to={`/explorer/asset/${tx.assetAddress}`} style={{ textDecoration: 'none' }}>
                                                        <div style={{ fontSize: '0.875rem', fontWeight: '600', color: colors.accent }}>{tx.asset}</div>
                                                        <div style={{ fontSize: '0.75rem', color: colors.textMuted, fontFamily: 'monospace' }}>{tx.assetAddress}</div>
                                                    </Link>
                                                ) : (
                                                    <div>
                                                        <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>{tx.asset}</div>
                                                        <div style={{ fontSize: '0.75rem', color: colors.textMuted, fontStyle: 'italic' }}>Legacy Record</div>
                                                    </div>
                                                )}
                                            </td>
                                            <td style={tdStyle}>
                                                <div style={{ fontWeight: '500' }}>{tx.amount} Tokens</div>
                                            </td>
                                            <td style={tdStyle}>
                                                <div style={{ fontSize: '0.75rem', color: colors.textMuted }}>FR: <span style={{ color: colors.text, fontFamily: 'monospace' }}>{tx.fromVaultId}</span></div>
                                                <div style={{ fontSize: '0.75rem', color: colors.textMuted }}>TO: <span style={{ color: colors.text, fontFamily: 'monospace' }}>{tx.toVaultId}</span></div>
                                            </td>
                                            <td style={tdStyle}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: '600' }}>
                                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: statusColors[tx.status] || colors.textMuted }}></div>
                                                    {tx.status}
                                                </div>
                                            </td>
                                            <td style={tdStyle}>
                                                {tx.onchainTxHash ? (
                                                    <a href={`https://sepolia.etherscan.io/tx/${tx.onchainTxHash}`} target="_blank" rel="noopener noreferrer" style={{ color: colors.textMuted }}>
                                                        <ExternalLink size={14} />
                                                    </a>
                                                ) : (
                                                    <span style={{ color: isDark ? '#404040' : '#CBD5E1' }}>—</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div style={{ padding: '1.25rem', textAlign: 'center', borderTop: `1px solid ${colors.border}` }}>
                            <button style={{ background: 'none', border: 'none', color: colors.accent, fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 auto' }}>
                                VIEW ALL TRANSACTIONS <ArrowRight size={14} />
                            </button>
                        </div>
                    </div>
                </>
            )}
        </ExplorerLayout>
    );
};

const StatCard = ({ icon, label, value, colors, isDark }) => (
    <div style={{
        backgroundColor: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: '12px',
        padding: '1.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1.25rem',
        boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.05)'
    }}>
        {icon}
        <div>
            <div style={{ fontSize: '0.625rem', color: colors.textMuted, fontWeight: '700', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>{label}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: '700', color: colors.text }}>{value}</div>
        </div>
    </div>
);

const thStyle = { padding: '1rem 1.5rem', fontWeight: '600' };
const tdStyle = { padding: '1rem 1.5rem' };

export default ExplorerHome;
