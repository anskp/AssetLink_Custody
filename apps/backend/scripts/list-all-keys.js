import prisma from '../src/config/db.js';

async function listAllKeys() {
    try {
        const keys = await prisma.apiKey.findMany({
            select: { publicKey: true, role: true, isActive: true, tenantId: true }
        });
        console.log(JSON.stringify(keys, null, 2));
    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

listAllKeys();
