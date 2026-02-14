
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCustodyRecordUUID() {
    try {
        const id = '9d388ad1-12f0-4484-886e-60f7843e57fb';
        console.log(`Checking for CustodyRecord with ID: ${id}`);

        const record = await prisma.custodyRecord.findUnique({
            where: { id: id }
        });

        if (record) {
            console.log('✅ Record FOUND:', JSON.stringify(record, null, 2));
        } else {
            console.log('❌ Record NOT FOUND');
        }

        // Also check ApiKeys to see what tenantId corresponds to whom
        const apiKeys = await prisma.apiKey.findMany();
        console.log('🔑 API Keys in DB:');
        apiKeys.forEach(k => {
            console.log(`   PublicKey: ${k.publicKey}`);
            console.log(`   TenantId:  ${k.tenantId}`);
            console.log(`   Role:      ${k.role}`);
            console.log('---');
        });

    } catch (error) {
        console.error('Error querying database:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkCustodyRecordUUID();
