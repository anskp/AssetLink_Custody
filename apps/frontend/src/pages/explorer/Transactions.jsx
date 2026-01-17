import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Repeat, ExternalLink, ArrowRight } from 'lucide-react';
import ExplorerLayout from '../../components/ExplorerLayout';

const Transactions = () => {
    const [txs, setTxs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTxs = async () => {
            try {
                const res = await fetch('http://localhost:3000/v1/explorer/latest-txs?limit=100');
                const result = await res.json();
                if (result.success) setTxs(result.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchTxs();
    }, []);

    const statusColors = {
        'EXECUTED': '#22C55E',
        'APPROVED': '#3B82F6',
        'PENDING_CHECKER': '#EAB308',
        'FAILED': '#EF4444'
    };

    return (
        <ExplorerLayout>
            {({ isDark, colors }) => (
                <>
                    <div style={{ marginBottom: '2.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: colors.textMuted, fontSize: '0.875rem', marginBottom: '1rem' }}>
                            <Link to="/explorer" style={{ color: colors.textMuted, textDecoration: 'none' }}>Explorer</Link>
                            <ChevronRight size={14} />
                            <span style={{ color: colors.text }}>Transactions</span>
                        </div>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: colors.text, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Repeat size={32} color={colors.accent} />
                            Ledger Operations
                        </h1>
                        <p style={{ color: colors.textMuted, marginTop: '0.5rem' }}>A real-time record of all off-chain and settled on-chain operations.</p>
                    </div>

                    <div style={{ backgroundColor: colors.surface, borderRadius: '16px', border: `1px solid ${colors.border}`, overflow: 'hidden', boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ color: colors.textMuted, fontSize: '0.75rem', textAlign: 'left', borderBottom: `1px solid ${colors.border}` }}>
                                        <th style={thStyle}>TX HASH</th>
                                        <th style={thStyle}>TYPE</th>
                                        <th style={thStyle}>ASSET</th>
                                        <th style={thStyle}>AMOUNT</th>
                                        <th style={thStyle}>STATUS</th>
                                        <th style={thStyle}>TIMESTAMP</th>
                                        <th style={thStyle}>NETWORK</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan="7" style={{ padding: '4rem', textAlign: 'center', color: colors.textMuted }}>Indexing Operations...</td></tr>
                                    ) : txs.map((tx, idx) => (
                                        <tr key={idx} style={{ borderBottom: `1px solid ${isDark ? '#1A1A1A' : '#F1F5F9'}` }}>
                                            <td style={tdStyle}>
                                                <Link to={`/explorer/tx/${tx.offchainTxHash}`} style={{ color: colors.accent, textDecoration: 'none', fontFamily: 'monospace', fontWeight: '600' }}>
                                                    {tx.offchainTxHash?.substring(0, 16)}...
                                                </Link>
                                            </td>
                                            <td style={tdStyle}>
                                                <span style={{ fontSize: '0.75rem', fontWeight: '800', padding: '0.2rem 0.5rem', backgroundColor: isDark ? '#1A1A1A' : '#F1F5F9', border: `1px solid ${colors.border}`, borderRadius: '4px' }}>{tx.type}</span>
                                            </td>
                                            <td style={tdStyle}>
                                                {tx.assetAddress ? (
                                                    <Link to={`/explorer/asset/${tx.assetAddress}`} style={{ textDecoration: 'none', color: colors.text, fontWeight: '600' }}>{tx.asset}</Link>
                                                ) : (
                                                    <span style={{ color: colors.text, fontWeight: '600' }}>{tx.asset}</span>
                                                )}
                                            </td>
                                            <td style={tdStyle}>
                                                <div style={{ fontWeight: '700' }}>{tx.amount} Tokens</div>
                                            </td>
                                            <td style={tdStyle}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: '700' }}>
                                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: statusColors[tx.status] || colors.textMuted }}></div>
                                                    {tx.status}
                                                </div>
                                            </td>
                                            <td style={tdStyle}>
                                                <span style={{ fontSize: '0.875rem', color: colors.textMuted }}>{new Date(tx.timestamp).toLocaleString()}</span>
                                            </td>
                                            <td style={tdStyle}>
                                                {tx.onchainTxHash ? (
                                                    <a href={`https://sepolia.etherscan.io/tx/${tx.onchainTxHash}`} target="_blank" rel="noopener noreferrer" style={{ color: colors.textMuted }}>
                                                        <ExternalLink size={16} />
                                                    </a>
                                                ) : <span style={{ color: '#DDD' }}>—</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </ExplorerLayout>
    );
};

const thStyle = { padding: '1.25rem 1.5rem', fontWeight: '700' };
const tdStyle = { padding: '1.25rem 1.5rem' };

export default Transactions;
