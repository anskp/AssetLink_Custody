import prisma from '../src/config/db.js';

// Fix last asset that was minted but stuck in LINKED
const r = await prisma.custodyRecord.findFirst({
    orderBy: { createdAt: 'desc' }
});

if (!r) { console.log('No records found'); process.exit(0); }

console.log('Current:', r.assetId, r.status, r.tokenAddress);

if (r.status === 'LINKED' && r.tokenAddress) {
    const updated = await prisma.custodyRecord.update({
        where: { id: r.id },
        data: {
            status: 'MINTED',
            mintedAt: new Date(),
            tokenStandard: r.tokenStandard || 'ERC20F',
            blockchain: r.blockchain || 'ETH_TEST5'
        }
    });
    console.log('✅ Updated to MINTED:', updated.assetId, updated.status, updated.mintedAt);
} else {
    console.log('Record is already', r.status, '- no change needed');
}

await prisma.$disconnect();
