import prisma from '../src/config/db.js';

const r = await prisma.custodyRecord.findFirst({
    orderBy: { createdAt: 'desc' },
    include: { operations: { orderBy: { createdAt: 'desc' }, take: 2 } }
});

console.log('--- ASSET TRACEABILITY ---');
console.log('AssetId:       ', r?.assetId);
console.log('Status:        ', r?.status);
console.log('Token Address: ', r?.tokenAddress);
console.log('');
console.log('--- ORCHESTRATION HASHES ---');
console.log('NAV Oracle:   ', r?.navOracleAddress);
console.log('NAV TX Hash:  ', r?.navOracleTxHash);
console.log('PoR Oracle:   ', r?.porOracleAddress);
console.log('PoR TX Hash:  ', r?.porOracleTxHash);
console.log('Proxy TX Hash:', r?.tokenProxyTxHash);
console.log('Mint TX Hash: ', r?.mintTxHash);
console.log('Mint FB ID:   ', r?.mintTxId);
console.log('');
console.log('--- LIFECYCLE ---');
console.log('Minted At:    ', r?.mintedAt);
console.log('Last Op State:', r?.operations?.[0]?.status);

await prisma.$disconnect();
