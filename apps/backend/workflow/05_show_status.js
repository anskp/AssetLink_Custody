import { makeRequest } from './utils.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function showStatus() {
    const assetId = process.env.LAST_ASSET_ID;
    const mintOpId = process.env.LAST_MINT_OP_ID;

    if (!assetId) {
        console.error('❌ LAST_ASSET_ID not found in .env.');
        process.exit(1);
    }

    console.log(`\n==========================================`);
    console.log(`   ASSETLINK RWA WORKFLOW STATUS`);
    console.log(`==========================================`);
    console.log(`Asset ID: ${assetId}`);

    try {
        // 1. Check Custody Status
        console.log(`\n🔍 CHECKING CUSTODY STATE...`);
        const custodyRes = await makeRequest('GET', `/custody/${assetId}`, null, 'maker');
        console.log(`   Status:       ${custodyRes.status}`);
        if (custodyRes.errorMessage) console.log(`   ❌ Error:     ${custodyRes.errorMessage}`);
        console.log(`   Token Contract: ${custodyRes.tokenAddress || 'N/A'}`);
        console.log(`   NAV Oracle:     ${custodyRes.navOracleAddress || 'N/A'}`);
        console.log(`   PoR Oracle:     ${custodyRes.porOracleAddress || 'N/A'}`);

        // 2. Check Minting Status
        if (mintOpId) {
            console.log(`\n🔍 CHECKING MINTING OPERATION...`);
            const mintRes = await makeRequest('GET', `/operations/${mintOpId}`, null, 'maker');
            console.log(`   ID:           ${mintOpId}`);
            console.log(`   Internal State: ${mintRes.status}`);
            console.log(`   On-chain Task:  ${mintRes.fireblocksTaskId || 'N/A'}`);
            console.log(`   TX Hash:       ${mintRes.txHash || 'Pending...'}`);

            if (mintRes.status === 'EXECUTED') {
                console.log(`\n✨ SUCCESS: Tokens have been minted successfully!`);
            } else if (mintRes.status === 'FAILED') {
                console.log(`\n❌ FAILED: ${mintRes.failureReason || 'Unknown error'}`);
            } else {
                console.log(`\n⏳ IN PROGRESS: Waiting for finality on-chain...`);
            }
        }

        console.log(`\n==========================================\n`);

    } catch (error) {
        // Error handled by makeRequest logic
    }
}

showStatus();
