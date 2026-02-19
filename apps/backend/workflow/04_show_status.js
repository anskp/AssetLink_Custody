import { makeRequest } from './utils.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function showStatus() {
    if (!fs.existsSync(path.join(__dirname, 'state.json'))) {
        console.error('❌ state.json not found.');
        process.exit(1);
    }

    const state = JSON.parse(fs.readFileSync(path.join(__dirname, 'state.json')));

    console.log(`--- [4/4] Asset & Minting Status Tracking ---`);
    console.log(`Asset ID: ${state.assetId}`);

    try {
        // 1. Check Custody Status
        const custodyRes = await makeRequest('GET', `/custody/${state.assetId}`, null, 'maker');
        console.log(`\n[Custody Record]`);
        console.log(`Status: ${custodyRes.status}`);
        if (custodyRes.errorMessage) console.log(`Error: ${custodyRes.errorMessage}`);
        console.log(`Token Address: ${custodyRes.tokenAddress || 'N/A'}`);
        console.log(`NAV Oracle: ${custodyRes.navOracleAddress || 'N/A'}`);
        console.log(`PoR Oracle: ${custodyRes.porOracleAddress || 'N/A'}`);

        // 2. Check Minting Status if link ID exists
        if (state.tokenLinkId) {
            console.log(`\n[Minting Operation]`);
            const mintRes = await makeRequest('GET', `/token-lifecycle/status/${state.tokenLinkId}`, null, 'maker');
            console.log(`Status: ${mintRes.status}`);
            console.log(`TX Hash: ${mintRes.txHash || 'Pending...'}`);
            if (mintRes.errorMessage) console.log(`Error: ${mintRes.errorMessage}`);
        } else {
            console.log('\n[Minting Operation] Not initiated yet.');
        }

    } catch (error) {
        // Error handled by makeRequest logic
    }
}

// Auto-run polling if requested or just once
showStatus();
