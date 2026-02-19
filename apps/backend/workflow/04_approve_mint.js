import { makeRequest } from './utils.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function approveMint() {
    const mintOpId = process.env.LAST_MINT_OP_ID;
    if (!mintOpId) {
        console.error('❌ LAST_MINT_OP_ID not found in .env. Run step 3 first.');
        process.exit(1);
    }

    console.log(`--- [4/5] Admin Approving Mint Operation: ${mintOpId} ---`);

    try {
        const result = await makeRequest('POST', `/operations/${mintOpId}/approve`, {}, 'checker', 'checker_admin_01');
        console.log('✅ Minting Operation Approved!');
        console.log('Status:', result.status);
        console.log('Fireblocks Task ID:', result.fireblocksTaskId);

        console.log('⏳ Token is now being minted on-chain...');
    } catch (error) {
        process.exit(1);
    }
}

approveMint();
