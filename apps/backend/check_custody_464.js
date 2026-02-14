
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCustodyRecord() {
    try {
        const id = '464'; // The ID failing in the logs
        console.log(`Checking for CustodyRecord with ID: ${id}`);

        const record = await prisma.custodyRecord.findUnique({
            where: { id: id }
        });

        if (record) {
            console.log('✅ Record FOUND:', JSON.stringify(record, null, 2));
        } else {
            console.log('❌ Record NOT FOUND');

            // List all records to see what's there
            console.log('Listing first 5 records:');
            const all = await prisma.custodyRecord.findMany({ take: 5 });
            console.log(JSON.stringify(all, null, 2));
        }
    } catch (error) {
        console.error('Error querying database:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkCustodyRecord();
