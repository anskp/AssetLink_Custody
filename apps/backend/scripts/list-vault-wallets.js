import prisma from '../src/config/db.js';

async function listVaults() {
    try {
        const vaults = await prisma.vaultWallet.findMany({
            take: 10,
            select: { id: true, fireblocksId: true, blockchain: true, address: true }
        });
        console.log(JSON.stringify(vaults, null, 2));
    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

listVaults();
