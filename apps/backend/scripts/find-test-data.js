import prisma from '../src/config/db.js';

async function findValidTestPair() {
    try {
        const asset = await prisma.custodyRecord.findFirst({
            where: { status: 'LINKED', vaultWalletId: { not: null } },
            include: { vaultWallet: true }
        });

        if (asset) {
            console.log('VALID_TEST_DATA');
            console.log(JSON.stringify({
                assetId: asset.assetId,
                vaultWalletId: asset.vaultWalletId,
                fireblocksId: asset.vaultWallet?.fireblocksId
            }, null, 2));
        } else {
            console.log('NO_VALID_DATA_FOUND');
        }
    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

findValidTestPair();
