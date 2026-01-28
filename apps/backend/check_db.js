import prisma from './src/config/db.js';

async function main() {
    const assets = await prisma.custodyRecord.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' }
    });
    console.log(JSON.stringify(assets, null, 2));
}

main().catch(console.error);
