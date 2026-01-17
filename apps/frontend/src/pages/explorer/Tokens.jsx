import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ChevronRight, Box, Coins } from 'lucide-react';
import ExplorerLayout from '../../components/ExplorerLayout';

const Tokens = () => {
    const navigate = useNavigate();
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchAssets = async () => {
            try {
                const res = await fetch('http://localhost:3000/v1/explorer/assets');
                const result = await res.json();
                if (result.success) setAssets(result.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchAssets();
    }, []);

    const filteredAssets = assets.filter(a =>
        a.assetMetadata?.assetName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.publicContractAddress?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <ExplorerLayout>
            {({ isDark, colors }) => (
                <>
                    <div style={{ marginBottom: '2.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: colors.textMuted, fontSize: '0.875rem', marginBottom: '1rem' }}>
                            <Link to="/explorer" style={{ color: colors.textMuted, textDecoration: 'none' }}>Explorer</Link>
                            <ChevronRight size={14} />
                            <span style={{ color: colors.text }}>Tokens</span>
                        </div>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: colors.text, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Coins size={32} color={colors.accent} />
                            Tracked Digital Assets
                        </h1>
                        <p style={{ color: colors.textMuted, marginTop: '0.5rem' }}>View all off-chain assets managed by COPYm AssetLink Custody.</p>
                    </div>

                    <div style={{
                        backgroundColor: colors.surface,
                        padding: '1.25rem',
                        borderRadius: '16px',
                        border: `1px solid ${colors.border}`,
                        marginBottom: '2rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem'
                    }}>
                        <Search size={20} color={colors.textMuted} />
                        <input
                            type="text"
                            placeholder="Filter by name or contract address..."
                            style={{ background: 'none', border: 'none', color: colors.text, width: '100%', fontSize: '1rem', outline: 'none' }}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div style={{ backgroundColor: colors.surface, borderRadius: '16px', border: `1px solid ${colors.border}`, overflow: 'hidden', boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ color: colors.textMuted, fontSize: '0.75rem', textAlign: 'left', borderBottom: `1px solid ${colors.border}` }}>
                                        <th style={{ padding: '1.25rem 1.5rem', fontWeight: '700' }}>ASSET NAME</th>
                                        <th style={{ padding: '1.25rem 1.5rem', fontWeight: '700' }}>TYPE</th>
                                        <th style={{ padding: '1.25rem 1.5rem', fontWeight: '700' }}>CONTRACT ADDRESS</th>
                                        <th style={{ padding: '1.25rem 1.5rem', fontWeight: '700' }}>STATUS</th>
                                        <th style={{ padding: '1.25rem 1.5rem', fontWeight: '700' }}>LINKED DATE</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan="5" style={{ padding: '4rem', textAlign: 'center', color: colors.textMuted }}>Fetching Assets...</td></tr>
                                    ) : filteredAssets.map((asset, idx) => (
                                        <tr key={idx} style={{ borderBottom: `1px solid ${isDark ? '#1A1A1A' : '#F1F5F9'}`, transition: 'background-color 0.2s' }}>
                                            <td style={{ padding: '1.25rem 1.5rem' }}>
                                                {asset.publicContractAddress ? (
                                                    <Link to={`/explorer/asset/${asset.publicContractAddress}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: isDark ? '#1A1A1A' : '#F1F5F9', border: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <Box size={16} color={colors.accent} />
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: '700', color: colors.text }}>{asset.assetMetadata?.assetName}</div>
                                                            <div style={{ fontSize: '0.75rem', color: colors.textMuted }}>{asset.assetMetadata?.manufacturer}</div>
                                                        </div>
                                                    </Link>
                                                ) : (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: isDark ? '#1A1A1A' : '#F1F5F9', border: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <Box size={16} color={colors.textMuted} />
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: '700', color: colors.text }}>{asset.assetMetadata?.assetName}</div>
                                                            <div style={{ fontSize: '0.75rem', color: colors.textMuted }}>{asset.assetMetadata?.manufacturer}</div>
                                                        </div>
                                                    </div>
                                                )}
                                            </td>
                                            <td style={{ padding: '1.25rem 1.5rem' }}>
                                                <span style={{ fontSize: '0.875rem', color: colors.textMuted }}>{asset.assetMetadata?.assetType}</span>
                                            </td>
                                            <td style={{ padding: '1.25rem 1.5rem' }}>
                                                <span style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: colors.accent }}>{asset.publicContractAddress}</span>
                                            </td>
                                            <td style={{ padding: '1.25rem 1.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: '700' }}>
                                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22C55E' }}></div>
                                                    {asset.status}
                                                </div>
                                            </td>
                                            <td style={{ padding: '1.25rem 1.5rem', color: colors.textMuted, fontSize: '0.875rem' }}>
                                                {new Date(asset.createdAt).toLocaleDateString()}
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

export default Tokens;
