import prisma from '../src/config/db.js';

async function checkLastOperation() {
    const fs = await import('fs');
    const writeLog = (msg) => {
        fs.appendFileSync('op_check.txt', msg + '\n');
    };

    try {
        // Clear previous log
        fs.writeFileSync('op_check.txt', '');

        writeLog('🔍 Checking last operation and custody record...\n');

        // Get the most recent operation
        const lastOp = await prisma.custodyOperation.findFirst({
            orderBy: { createdAt: 'desc' },
            include: {
                custodyRecord: true
            }
        });

        if (!lastOp) {
            writeLog('❌ No operations found');
            return;
        }

        writeLog('📋 LAST OPERATION:');
        writeLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        writeLog(`ID: ${lastOp.id}`);
        writeLog(`Type: ${lastOp.operationType}`);
        writeLog(`Status: ${lastOp.status}`);
        writeLog(`Initiated By: ${lastOp.initiatedBy}`);
        writeLog(`Approved By: ${lastOp.approvedBy || 'N/A'}`);
        writeLog(`Fireblocks Task ID: ${lastOp.fireblocksTaskId || 'N/A'}`);
        writeLog(`Failure Reason: ${lastOp.failureReason || 'N/A'}`);
        writeLog(`Executed At: ${lastOp.executedAt || 'N/A'}`);
        writeLog(`Created At: ${lastOp.createdAt}`);
        writeLog(`Payload: ${JSON.stringify(lastOp.payload, null, 2)}`);

        writeLog('\n📦 ASSOCIATED CUSTODY RECORD:');
        writeLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        if (lastOp.custodyRecord) {
            writeLog(`Asset ID: ${lastOp.custodyRecord.assetId}`);
            writeLog(`Status: ${lastOp.custodyRecord.status}`);
            writeLog(`Vault Wallet ID: ${lastOp.custodyRecord.vaultWalletId || 'N/A'}`);
            writeLog(`Token ID: ${lastOp.custodyRecord.tokenId || 'N/A'}`);
            writeLog(`Token Address: ${lastOp.custodyRecord.tokenAddress || 'N/A'}`);
            writeLog(`Blockchain: ${lastOp.custodyRecord.blockchain || 'N/A'}`);
            writeLog(`Linked At: ${lastOp.custodyRecord.linkedAt || 'N/A'}`);
            writeLog(`Minted At: ${lastOp.custodyRecord.mintedAt || 'N/A'}`);
        } else {
            writeLog('No custody record linked');
        }

        // Get audit logs for this operation
        writeLog('\n📜 RECENT AUDIT LOGS:');
        writeLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        const auditLogs = await prisma.auditLog.findMany({
            where: {
                tenantId: lastOp.tenantId
            },
            orderBy: { timestamp: 'desc' },
            take: 15
        });

        if (auditLogs.length === 0) {
            writeLog('No audit logs found');
        } else {
            auditLogs.forEach((log, idx) => {
                writeLog(`\n${idx + 1}. ${log.eventType} - ${log.timestamp.toISOString()}`);
                writeLog(`   Actor: ${log.actor}`);
                if (log.details && typeof log.details === 'object') {
                    writeLog(`   Details: ${JSON.stringify(log.details, null, 2)}`);
                }
            });
        }

    } catch (error) {
        fs.appendFileSync('op_check.txt', `❌ Error: ${error.message}\n${error.stack}\n`);
    } finally {
        await prisma.$disconnect();
    }
}

checkLastOperation();
