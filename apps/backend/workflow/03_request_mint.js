import { makeRequest } from './utils.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function requestMint() {
    const assetId = process.env.LAST_ASSET_ID;
    if (!assetId) {
        console.error('❌ LAST_ASSET_ID not found in .env. Run step 1 & 2 first.');
        process.exit(1);
    }

    // First check if status is LINKED
    console.log(`--- Checking orchestration status for ${assetId} ---`);
    const statusRes = await makeRequest('GET', `/custody/${assetId}`, null, 'maker');

    if (statusRes.status !== 'LINKED') {
        console.error(`❌ Asset is not in LINKED status (Current: ${statusRes.status}).`);
        console.error('Wait for orchestration to complete or check for errors.');
        process.exit(1);
    }

    console.log(`--- [3/5] Requesting Token Minting for: ${assetId} ---`);

    const payload = {
        assetId: assetId,
        tokenSymbol: 'LVD',
        tokenName: 'Luxury Villa Dubai',
        totalSupply: '1000',
        decimals: 18,
        blockchainId: 'ETH_TEST5'
    };

    try {
        // Note: Using /operations/mint endpoint
        const result = await makeRequest('POST', '/operations/mint', payload, 'maker', 'maker_admin_01');
        const mintOpId = result.id;
        console.log('✅ Minting Operation Initiated (Pending Checker)!');
        console.log('Operation ID:', mintOpId);

        // Update workflow/.env
        const envPath = path.join(__dirname, '.env');
        let envContent = fs.readFileSync(envPath, 'utf8');

        const updateEnv = (key, value) => {
            const regex = new RegExp(`^${key}=.*$`, 'm');
            if (regex.test(envContent)) {
                envContent = envContent.replace(regex, `${key}=${value}`);
            } else {
                envContent += `\n${key}=${value}`;
            }
        };

        updateEnv('LAST_MINT_OP_ID', mintOpId);
        fs.writeFileSync(envPath, envContent);
        console.log('💾 Mint Operation ID saved to workflow/.env');
    } catch (error) {
        process.exit(1);
    }
}

requestMint();
