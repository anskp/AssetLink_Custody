import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { User, Box, Shield, ChevronRight, Briefcase, History } from 'lucide-react';
import ExplorerLayout from '../../components/ExplorerLayout';

const AddressDetail = () => {
    const { address } = useParams();
    const [portfolio, setPortfolio] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPortfolio = async () => {
            try {
                const res = await fetch(`http://localhost:3000/v1/explorer/address/${address}`);
                const result = await res.json();
                if (result.success) setPortfolio(result.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchPortfolio();
    }, [address]);

    if (loading) return <ExplorerLayout><div style={{ textAlign: 'center', padding: '10rem' }}>Loading Address Portfolio...</div></ExplorerLayout>;

    return (
        <ExplorerLayout>
            {({ isDark, colors }) => (
                <>
                    <div style={{ marginBottom: '2.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: colors.textMuted, fontSize: '0.875rem', marginBottom: '1rem' }}>
                            <Link to="/explorer" style={{ color: colors.textMuted, textDecoration: 'none' }}>Explorer</Link>
                            <ChevronRight size={14} />
                            <span style={{ color: colors.textMuted }}>Address</span>
                            <ChevronRight size={14} />
                            <span style={{ color: colors.text }}>{address?.substring(0, 16)}...</span>
                        </div>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: colors.text, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <User size={32} color={colors.accent} />
                            Address Overview
                        </h1>
                        <div style={{ fontSize: '0.875rem', color: colors.textMuted, fontFamily: 'monospace', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {address}
                        </div>
                    </div>

                    <div style={{ backgroundColor: colors.surface, borderRadius: '16px', border: `1px solid ${colors.border}`, overflow: 'hidden', boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <div style={{ padding: '1.5rem', borderBottom: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '1.125rem', fontWeight: '700' }}>Token Portfolio</h2>
                            <span style={{ fontSize: '0.75rem', color: colors.textMuted, fontWeight: '600' }}>{portfolio.length} ASSETS HELD</span>
                        </div>

                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ color: colors.textMuted, fontSize: '0.75rem', textAlign: 'left', borderBottom: `1px solid ${colors.border}` }}>
                                        <th style={{ padding: '1rem 1.5rem', fontWeight: '700' }}>ASSET</th>
                                        <th style={{ padding: '1rem 1.5rem', fontWeight: '700' }}>CONTRACT ADDRESS</th>
                                        <th style={{ padding: '1rem 1.5rem', fontWeight: '700' }}>BALANCE</th>
                                        <th style={{ padding: '1rem 1.5rem', fontWeight: '700' }}>LAST UPDATED</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {portfolio.length === 0 ? (
                                        <tr><td colSpan="4" style={{ padding: '4rem', textAlign: 'center', color: colors.textMuted }}>No assets found for this address.</td></tr>
                                    ) : portfolio.map((item, idx) => (
                                        <tr key={idx} style={{ borderBottom: `1px solid ${isDark ? '#1A1A1A' : '#F1F5F9'}` }}>
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                <Link to={`/explorer/asset/${item.custodyRecord?.publicContractAddress}`} style={{ textDecoration: 'none' }}>
                                                    <div style={{ fontWeight: '700', color: colors.accent }}>{item.custodyRecord?.assetMetadata?.assetName || 'Unknown Asset'}</div>
                                                    <div style={{ fontSize: '0.75rem', color: colors.textMuted }}>{item.custodyRecord?.assetMetadata?.assetType}</div>
                                                </Link>
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                                                {item.custodyRecord?.publicContractAddress}
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                <div style={{ fontWeight: '700', fontSize: '1rem' }}>{item.quantity} Tokens</div>
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: colors.textMuted }}>
                                                {new Date(item.updatedAt).toLocaleDateString()}
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

export default AddressDetail;
