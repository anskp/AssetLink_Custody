import prisma from '../src/config/db.js';

async function main() {
    const records = await prisma.custodyRecord.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { assetMetadata: true }
    });

    console.log('--- SCANNING RECORDS ---');
    records.forEach(r => {
        const name = r.assetMetadata?.assetName || 'N/A';
        const symbol = r.tokenSymbol || 'N/A'; // Wait, let me check if tokenSymbol exists on CustodyRecord
        // checking schema again... no tokenSymbol on CustodyRecord.
        // Ah, IT IS IN THE DB, but maybe not in the model?
        // Wait, line 61-105: no tokenSymbol.
        // But JIT orchestration logs say: tokenSymbol: ILG
        // Let me check if I should use a different field.

        console.log(`Asset: ${r.assetId} | Name: ${name} | Addr: ${r.tokenAddress}`);
        console.log(`  NAV Oracle: ${r.navOracleAddress}`);
        console.log(`  PoR Oracle: ${r.porOracleAddress}`);
    });
    await prisma.$disconnect();
}

main();
