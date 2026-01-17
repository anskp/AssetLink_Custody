import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Box, Globe, Shield, Users, Database, Clock, ChevronRight, ExternalLink } from 'lucide-react';
import ExplorerLayout from '../../components/ExplorerLayout';

const AssetDetail = () => {
    const { address } = useParams();
    const [asset, setAsset] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        const fetchAsset = async () => {
            if (!address || address === 'null') {
                setLoading(false);
                return;
            }
            try {
                const res = await fetch(`http://localhost:3000/v1/explorer/asset/${address}`);
                const result = await res.json();
                if (result.success) setAsset(result.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchAsset();
    }, [address]);

    if (loading) return <ExplorerLayout><div style={{ textAlign: 'center', padding: '10rem' }}>Loading Asset State...</div></ExplorerLayout>;
    if (!asset) return <ExplorerLayout><div style={{ color: '#EF4444', textAlign: 'center', padding: '10rem' }}>Asset Not Found</div></ExplorerLayout>;

    return (
        <ExplorerLayout>
            {({ isDark, colors }) => (
                <>
                    {/* Header */}
                    <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: colors.textMuted, fontSize: '0.875rem', marginBottom: '1rem' }}>
                                <Link to="/explorer" style={{ color: colors.textMuted, textDecoration: 'none' }}>Explorer</Link>
                                <ChevronRight size={14} />
                                <Link to="/explorer/tokens" style={{ color: colors.textMuted, textDecoration: 'none' }}>Assets</Link>
                                <ChevronRight size={14} />
                                <span style={{ color: colors.text }}>{asset.assetMetadata?.assetName}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                                <div style={{
                                    width: '64px',
                                    height: '64px',
                                    backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
                                    border: `1px solid ${colors.border}`,
                                    borderRadius: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: isDark ? 'none' : '0 2px 4px rgba(0,0,0,0.02)'
                                }}>
                                    <Box size={32} color={isDark ? '#FFF' : '#2563EB'} />
                                </div>
                                <div>
                                    <h1 style={{ fontSize: '2rem', fontWeight: '800', color: colors.text, letterSpacing: '-0.02em' }}>
                                        {asset.assetMetadata?.assetName}
                                        <span style={{ color: colors.textMuted, fontSize: '1.125rem', fontWeight: '400', marginLeft: '0.75rem', opacity: 0.8 }}>[{asset.assetMetadata?.assetType}]</span>
                                    </h1>
                                    <div style={{ fontSize: '0.875rem', color: colors.textMuted, fontFamily: 'monospace', marginTop: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        Ledger ID: {asset.publicContractAddress}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* On-chain Contract Box (Top Right) */}
                        {asset.status === 'MINTED' && asset.tokenAddress && (
                            <div style={{
                                textAlign: 'right',
                                backgroundColor: isDark ? '#111' : '#F8FAFC',
                                padding: '1rem 1.25rem',
                                borderRadius: '14px',
                                border: `1px solid ${colors.border}`,
                                boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.03)'
                            }}>
                                <div style={{ fontSize: '0.625rem', color: colors.textMuted, fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>ON-CHAIN CONTRACT</div>
                                <a
                                    href={`https://sepolia.etherscan.io/address/${asset.tokenAddress}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        color: colors.accent,
                                        textDecoration: 'none',
                                        fontFamily: 'monospace',
                                        fontSize: '0.925rem',
                                        fontWeight: '700',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}
                                >
                                    {asset.tokenAddress.substring(0, 8)}...{asset.tokenAddress.substring(34)}
                                    <ExternalLink size={14} />
                                </a>
                                <div style={{ fontSize: '0.7rem', color: '#22C55E', fontWeight: '700', marginTop: '0.375rem', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22C55E' }}></div>
                                    VERIFIED ON SEPOLIA
                                </div>
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: '2rem' }}>
                        <div>
                            {/* Tabs */}
                            <div style={{ display: 'flex', gap: '2rem', borderBottom: `1px solid ${colors.border}`, marginBottom: '1.5rem' }}>
                                {['overview', 'transactions', 'holders'].map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            padding: '1rem 0',
                                            color: activeTab === tab ? colors.accent : colors.textMuted,
                                            cursor: 'pointer',
                                            fontSize: '0.875rem',
                                            fontWeight: '700',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em',
                                            borderBottom: activeTab === tab ? `2px solid ${colors.accent}` : 'none'
                                        }}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>

                            <div style={{
                                backgroundColor: colors.surface,
                                borderRadius: '16px',
                                border: `1px solid ${colors.border}`,
                                padding: '2rem',
                                boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.05)'
                            }}>
                                {activeTab === 'overview' && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                        <InfoBlock label="MANUFACTURER" value={asset.assetMetadata?.manufacturer} colors={colors} />
                                        <InfoBlock label="MODEL" value={asset.assetMetadata?.model} colors={colors} />
                                        <InfoBlock label="SERIAL NUMBER" value={asset.assetMetadata?.serialNumber} colors={colors} />
                                        <InfoBlock label="YEAR" value={asset.assetMetadata?.yearManufactured} colors={colors} />
                                        <InfoBlock label="ESTIMATED VALUE" value={`${asset.assetMetadata?.estimatedValue} ${asset.assetMetadata?.currency}`} colors={colors} />
                                        <InfoBlock label="CUSTODY STATUS" value={asset.status} colors={colors} />
                                        <div style={{ gridColumn: 'span 2' }}>
                                            <div style={{ color: colors.textMuted, fontSize: '0.75rem', marginBottom: '0.75rem', fontWeight: '700' }}>DESCRIPTION</div>
                                            <p style={{ color: isDark ? '#A3A3A3' : '#475569', fontSize: '1rem', lineHeight: '1.7' }}>{asset.assetMetadata?.description || 'No description provided.'}</p>
                                        </div>
                                    </div>
                                )}
                                {activeTab === 'transactions' && (
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr style={{ color: colors.textMuted, fontSize: '0.75rem', textAlign: 'left', borderBottom: `1px solid ${colors.border}` }}>
                                                    <th style={{ padding: '1rem 0', fontWeight: '700' }}>TX HASH</th>
                                                    <th style={{ padding: '1rem 0', fontWeight: '700' }}>TYPE</th>
                                                    <th style={{ padding: '1rem 0', fontWeight: '700' }}>TIMESTAMP</th>
                                                    <th style={{ padding: '1rem 0', fontWeight: '700' }}>STATUS</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {asset.operations?.map((op, i) => (
                                                    <tr key={i} style={{ borderBottom: `1px solid ${isDark ? '#1A1A1A' : '#F1F5F9'}` }}>
                                                        <td style={{ padding: '1rem 0' }}>
                                                            <Link to={`/explorer/tx/${op.offchainTxHash}`} style={{ color: colors.accent, textDecoration: 'none', fontFamily: 'monospace', fontWeight: '500' }}>
                                                                {op.offchainTxHash?.substring(0, 16)}...
                                                            </Link>
                                                        </td>
                                                        <td style={{ padding: '1rem 0', fontSize: '0.875rem' }}>{op.operationType}</td>
                                                        <td style={{ padding: '1rem 0', fontSize: '0.875rem', color: colors.textMuted }}>{new Date(op.createdAt).toLocaleString()}</td>
                                                        <td style={{ padding: '1rem 0' }}>
                                                            <span style={{ fontSize: '0.75rem', fontWeight: '600' }}>{op.status}</span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                                {activeTab === 'holders' && (
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr style={{ color: colors.textMuted, fontSize: '0.75rem', textAlign: 'left', borderBottom: `1px solid ${colors.border}` }}>
                                                    <th style={{ padding: '1rem 0', fontWeight: '700' }}>HOLDER ADDRESS</th>
                                                    <th style={{ padding: '1rem 0', fontWeight: '700' }}>QUANTITY</th>
                                                    <th style={{ padding: '1rem 0', fontWeight: '700' }}>ACQUIRED</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {asset.holders?.map((h, i) => (
                                                    <tr key={i} style={{ borderBottom: `1px solid ${isDark ? '#1A1A1A' : '#F1F5F9'}` }}>
                                                        <td style={{ padding: '1rem 0' }}>
                                                            <Link to={`/explorer/address/${h.ownerId}`} style={{ color: colors.accent, textDecoration: 'none', fontFamily: 'monospace' }}>{h.ownerId}</Link>
                                                        </td>
                                                        <td style={{ padding: '1rem 0', fontWeight: '600' }}>{h.quantity} Tokens</td>
                                                        <td style={{ padding: '1rem 0', fontSize: '0.875rem', color: colors.textMuted }}>{new Date(h.acquiredAt).toLocaleDateString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Sidebar Info */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{
                                backgroundColor: colors.surface,
                                borderRadius: '16px',
                                border: `1px solid ${colors.border}`,
                                padding: '1.5rem',
                                boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.05)'
                            }}>
                                <h3 style={{ fontSize: '0.875rem', fontWeight: '800', color: colors.textMuted, marginBottom: '1.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Custody Vault</h3>
                                <div style={{
                                    backgroundColor: isDark ? '#1A1A1A' : '#F8FAFC',
                                    padding: '1.25rem',
                                    borderRadius: '12px',
                                    border: `1px solid ${colors.border}`
                                }}>
                                    <div style={{ fontSize: '0.625rem', color: colors.textMuted, marginBottom: '0.5rem', fontWeight: '700' }}>BLOCKCHAIN ADDRESS</div>
                                    <div style={{ fontSize: '0.75rem', color: colors.text, fontFamily: 'monospace', wordBreak: 'break-all', fontWeight: '500' }}>{asset.vaultWallet?.address || 'UNASSIGNED'}</div>
                                </div>
                                <div style={{ marginTop: '1.5rem' }}>
                                    <div style={{ fontSize: '0.625rem', color: colors.textMuted, fontWeight: '700' }}>VAULT TYPE</div>
                                    <div style={{ fontSize: '0.875rem', fontWeight: '700', marginTop: '0.25rem' }}>INSTITUTIONAL FIREBLOCKS</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </ExplorerLayout>
    );
};

const InfoBlock = ({ label, value, colors }) => (
    <div style={{ marginBottom: '1rem' }}>
        <div style={{ color: colors.textMuted, fontSize: '0.75rem', marginBottom: '0.375rem', fontWeight: '700', letterSpacing: '0.05em' }}>{label}</div>
        <div style={{ color: colors.text, fontSize: '1.125rem', fontWeight: '600' }}>{value || 'N/A'}</div>
    </div>
);

const sideCardStyle = { backgroundColor: '#111111', borderRadius: '12px', border: '1px solid #262626', padding: '1.5rem' };
const sideTitleStyle = { fontSize: '0.875rem', fontWeight: '700', color: '#A3A3A3', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' };
const thStyle = { padding: '1rem 0' };
const tdStyle = { padding: '1rem 0', color: '#A3A3A3', fontSize: '0.875rem' };

export default AssetDetail;
