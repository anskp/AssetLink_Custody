
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTenantMismatch() {
    try {
        const recordId = '9d388ad1-12f0-4484-886e-60f7843e57fb';
        const apiKeyUsed = 'ak_cba55b501da24894d83d1d74d7022d81';

        console.log('--- DIAGNOSTIC START ---');

        // 1. Check Record
        const record = await prisma.custodyRecord.findUnique({
            where: { id: recordId },
            select: { id: true, tenantId: true, status: true }
        });

        if (!record) {
            console.log('❌ Custody Record NOT FOUND.');
        } else {
            console.log(`✅ Custody Record FOUND.`);
            console.log(`   ID: ${record.id}`);
            console.log(`   TenantId: ${record.tenantId}`);
            console.log(`   Status:   ${record.status}`);
        }

        // 2. Check API Key
        const key = await prisma.apiKey.findUnique({
            where: { publicKey: apiKeyUsed },
            select: { publicKey: true, tenantId: true, role: true }
        });

        if (!key) {
            console.log(`❌ API Key ${apiKeyUsed} NOT FOUND in DB.`);
        } else {
            console.log(`✅ API Key FOUND.`);
            console.log(`   PublicKey: ${key.publicKey}`);
            console.log(`   TenantId:  ${key.tenantId}`);
            console.log(`   Role:      ${key.role}`);
        }

        // 3. Compare
        if (record && key) {
            if (record.tenantId === key.tenantId) {
                console.log('✅ Tenant IDs MATCH.');
            } else {
                console.log('❌ Tenant IDs MISMATCH!');
                console.log(`   Record Tenant: ${record.tenantId}`);
                console.log(`   Key Tenant:    ${key.tenantId}`);
            }
        }

        console.log('--- DIAGNOSTIC END ---');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkTenantMismatch();
