import { makeRequest } from './utils.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function approveAsset() {
    const custodyId = process.env.LAST_CUSTODY_ID;
    if (!custodyId) {
        console.error('❌ LAST_CUSTODY_ID not found in .env. Run step 1 first.');
        process.exit(1);
    }

    console.log(`--- [2/5] Approving Asset: ${custodyId} ---`);

    try {
        const result = await makeRequest('POST', `/custody/${custodyId}/approve`, {}, 'checker', 'checker_admin_01');
        console.log(`✅ Asset Approved! Orchestration will be triggered on first mint.`);
        console.log(`Current Status: ${result.status}`);
        console.log(`You can now request minting to trigger deployment.`);
    } catch (error) {
        process.exit(1);
    }
}

approveAsset();
