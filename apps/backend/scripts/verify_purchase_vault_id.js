import prisma from '../src/config/db.js';
import * as tradeService from '../src/modules/marketplace/trade.service.js';
import logger from '../src/utils/logger.js';

async function verifyVaultIdFix() {
    console.log('🧪 Starting Vault ID Fix Verification...');

    try {
        // 1. Find a test listing
        const listing = await prisma.listing.findFirst({
            where: { status: 'ACTIVE' },
            include: { custodyRecord: true }
        });

        if (!listing) {
            console.error('❌ No active listings found for testing. Please create one.');
            return;
        }

        const buyerId = 'test_investor_123';
        const testVaultId = 'FB_VAULT_TEST_999';
        const purchaseQuantity = '1';

        console.log(`🛒 Simulating purchase for listing ${listing.id} with Vault ID: ${testVaultId}`);

        // 2. Mock paymentData
        const paymentData = {
            sourceVaultId: testVaultId,
            paymentAssetId: 'ETH_TEST5',
            quantity: purchaseQuantity,
            walletAddress: '0x1234567890123456789012345678901234567890'
        };

        // 3. Execute purchase (this will call acceptBid internally)
        // Note: This might fail if the test environment doesn't have all mocked services,
        // but we mainly want to see if the database record is created correctly.
        try {
            await tradeService.executePurchase(listing.id, buyerId, paymentData, {
                ipAddress: '127.0.0.1',
                userAgent: 'VerificationScript'
            });
            console.log('✅ Purchase execution called successfully.');
        } catch (e) {
            // It's okay if it fails due to Fireblocks or other service calls, 
            // the operation record might still be created before or after depending on the flow.
            console.log('⚠️ Purchase call finished (might have had expected errors):', e.message);
        }

        // 4. Check the latest TRANSFER operation for this listing
        const lastOp = await prisma.custodyOperation.findFirst({
            where: {
                custodyRecordId: listing.custodyRecordId,
                operationType: 'TRANSFER'
            },
            orderBy: { createdAt: 'desc' }
        });

        if (!lastOp) {
            console.error('❌ No TRANSFER operation found for the test.');
            return;
        }

        console.log('📋 Last TRANSFER Operation Payload:', JSON.stringify(lastOp.payload, null, 2));

        if (lastOp.payload.fromVaultId === testVaultId) {
            console.log('✨ SUCCESS: Investor Vault ID correctly passed to the operation payload!');
        } else {
            console.error(`❌ FAILURE: Expected fromVaultId ${testVaultId}, but got ${lastOp.payload.fromVaultId}`);
        }

    } catch (error) {
        console.error('❌ Error during verification:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verifyVaultIdFix();
