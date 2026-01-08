import prisma from '../src/config/db.js';

async function listAll() {
    try {
        const assets = await prisma.custodyRecord.findMany({
            select: { assetId: true, status: true, tenantId: true }
        });
        console.log('ALL_ASSETS_IN_DB:');
        console.log(JSON.stringify(assets, null, 2));
    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

listAll();
