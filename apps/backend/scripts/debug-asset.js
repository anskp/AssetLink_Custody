import prisma from '../src/config/db.js';

async function debugAsset() {
    try {
        const asset = await prisma.custodyRecord.findUnique({
            where: { assetId: '20' }
        });
        console.log(JSON.stringify(asset, null, 2));
    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

debugAsset();
