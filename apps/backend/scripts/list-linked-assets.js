import prisma from '../src/config/db.js';

async function listLinked() {
    try {
        const assets = await prisma.custodyRecord.findMany({
            where: { status: 'LINKED' },
            take: 10,
            select: { assetId: true, status: true, tenantId: true, vaultWalletId: true }
        });
        console.log(JSON.stringify(assets, null, 2));
    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

listLinked();
