import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkStatus() {
    const records = await prisma.custodyRecord.findMany({
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: {
            id: true,
            assetId: true,
            status: true,
            errorMessage: true,
            navOracleAddress: true,
            porOracleAddress: true,
            tokenAddress: true,
            initialNav: true,
            initialPor: true
        }
    });

    console.log(JSON.stringify(records, null, 2));
    process.exit(0);
}

checkStatus();
