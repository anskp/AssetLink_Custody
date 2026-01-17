import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Activity, Shield, Hash, Clock, User, Box, ExternalLink, ChevronRight } from 'lucide-react';
import ExplorerLayout from '../../components/ExplorerLayout';

const TransactionDetail = () => {
    const { hash } = useParams();
    const [tx, setTx] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTx = async () => {
            try {
                const res = await fetch(`http://localhost:3000/v1/explorer/tx/${hash}`);
                const result = await res.json();
                if (result.success) setTx(result.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchTx();
    }, [hash]);

    if (loading) return <ExplorerLayout><div style={{ textAlign: 'center', padding: '10rem' }}>Loading Transaction Hash...</div></ExplorerLayout>;
    if (!tx) return <ExplorerLayout><div style={{ color: '#EF4444', textAlign: 'center', padding: '10rem' }}>Transaction Not Found</div></ExplorerLayout>;

    return (
        <ExplorerLayout>
            {({ isDark, colors }) => (
                <>
                    <div style={{ marginBottom: '2.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: colors.textMuted, fontSize: '0.875rem', marginBottom: '1rem' }}>
                            <Link to="/explorer" style={{ color: colors.textMuted, textDecoration: 'none' }}>Explorer</Link>
                            <ChevronRight size={14} />
                            <Link to="/explorer/transactions" style={{ color: colors.textMuted, textDecoration: 'none' }}>Transactions</Link>
                            <ChevronRight size={14} />
                            <span style={{ color: colors.text }}>{hash.substring(0, 16)}...</span>
                        </div>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: colors.text }}>Transaction Details</h1>
                    </div>

                    <div style={{ backgroundColor: colors.surface, borderRadius: '16px', border: `1px solid ${colors.border}`, overflow: 'hidden', boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <div style={{ padding: '1.25rem 1.5rem', borderBottom: `1px solid ${colors.border}`, color: colors.textMuted, fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.05em' }}>OVERVIEW</div>

                        <div style={{ padding: '1.5rem' }}>
                            <DetailRow label="OFF-CHAIN TX HASH" value={tx.offchainTxHash} isMonospace colors={colors} />
                            <DetailRow label="STATUS" value={<StatusBadge status={tx.status} />} colors={colors} />
                            <DetailRow label="TIMESTAMP" value={new Date(tx.createdAt).toLocaleString()} colors={colors} />
                            <div style={{ borderTop: `1px solid ${isDark ? '#1A1A1A' : '#F1F5F9'}`, margin: '1rem 0' }} />
                            <DetailRow label="OPERATIONAL TYPE" value={tx.operationType} colors={colors} />
                            <DetailRow label="ASSET" value={<Link to={`/explorer/asset/${tx.custodyRecord?.publicContractAddress}`} style={{ color: colors.accent, textDecoration: 'none', fontWeight: '600' }}>{tx.custodyRecord?.assetMetadata?.assetName} ({tx.custodyRecord?.publicContractAddress})</Link>} colors={colors} />
                            <DetailRow label="MAKER (INITIATED BY)" value={tx.initiatedBy} isMonospace colors={colors} />
                            <DetailRow label="CHECKER (APPROVED BY)" value={tx.approvedBy || 'PENDING'} isMonospace colors={colors} />

                            <div style={{ borderTop: `1px solid ${isDark ? '#1A1A1A' : '#F1F5F9'}`, margin: '1rem 0' }} />

                            <DetailRow label="ON-CHAIN TX HASH" value={tx.txHash ? (
                                <a href={`https://sepolia.etherscan.io/tx/${tx.txHash}`} target="_blank" rel="noopener noreferrer" style={{ color: colors.accent, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '500' }}>
                                    {tx.txHash} <ExternalLink size={14} />
                                </a>
                            ) : 'NOT SETTLED ON-CHAIN'} colors={colors} />

                            <DetailRow label="FIREBLOCKS TASK ID" value={tx.fireblocksTaskId || 'N/A'} isMonospace colors={colors} />
                        </div>
                    </div>

                    {/* Audit Trail */}
                    <div style={{ marginTop: '3rem' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '2rem', color: colors.text }}>Ledger Audit Trail</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {tx.auditLogs?.map((log, i) => (
                                <div key={i} style={{ display: 'flex', gap: '2rem', paddingLeft: '1.5rem', borderLeft: `2px solid ${colors.border}`, position: 'relative', paddingBottom: '1rem' }}>
                                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: isDark ? '#404040' : '#CBD5E1', position: 'absolute', left: '-7px', top: '4px' }}></div>
                                    <div style={{ color: colors.textMuted, fontSize: '0.875rem', minWidth: '180px', fontWeight: '500' }}>{new Date(log.timestamp).toLocaleString()}</div>
                                    <div>
                                        <div style={{ fontSize: '0.875rem', fontWeight: '700', color: colors.text }}>{log.eventType}</div>
                                        <div style={{ fontSize: '0.875rem', color: colors.textMuted }}>By: {log.actor}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </ExplorerLayout>
    );
};

const DetailRow = ({ label, value, isMonospace, colors }) => (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 3.8fr', padding: '0.875rem 0', alignItems: 'center' }}>
        <div style={{ color: colors.textMuted, fontSize: '0.875rem', fontWeight: '600' }}>{label}:</div>
        <div style={{ color: colors.text, fontSize: '0.875rem', fontFamily: isMonospace ? 'monospace' : 'inherit', wordBreak: 'break-all', fontWeight: '500' }}>{value}</div>
    </div>
);

const StatusBadge = ({ status }) => {
    const colors = {
        'EXECUTED': { bg: 'rgba(34, 197, 94, 0.1)', text: '#22C55E' },
        'APPROVED': { bg: 'rgba(59, 130, 246, 0.1)', text: '#3B82F6' },
        'PENDING_CHECKER': { bg: 'rgba(234, 179, 8, 0.1)', text: '#EAB308' },
        'FAILED': { bg: 'rgba(239, 68, 68, 0.1)', text: '#EF4444' }
    };
    const style = colors[status] || { bg: '#1A1A1A', text: '#A3A3A3' };
    return (
        <span style={{ backgroundColor: style.bg, color: style.text, padding: '0.25rem 0.75rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: '600' }}>
            {status}
        </span>
    );
};

export default TransactionDetail;
