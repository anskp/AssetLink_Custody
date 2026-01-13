import prisma from '../src/config/db.js';

async function checkFailedLog() {
    const fs = await import('fs');

    try {
        console.log('🔍 Fetching latest TOKEN_MINT_FAILED log...');

        const failedLog = await prisma.auditLog.findFirst({
            where: {
                eventType: 'TOKEN_MINT_FAILED'
            },
            orderBy: {
                timestamp: 'desc'
            }
        });

        if (!failedLog) {
            fs.writeFileSync('failure_details.txt', 'No TOKEN_MINT_FAILED logs found.');
            return;
        }

        const output = `
TIMESTAMP: ${failedLog.timestamp}
ACTOR: ${failedLog.actor}
EVENT: ${failedLog.eventType}
METADATA:
${JSON.stringify(failedLog.metadata, null, 2)}
        `;

        fs.writeFileSync('failure_details.txt', output);
        console.log('✅ Failure details written to failure_details.txt');

    } catch (error) {
        console.error('Error:', error);
        fs.writeFileSync('failure_details.txt', `Error: ${error.message}`);
    } finally {
        await prisma.$disconnect();
    }
}

checkFailedLog();
