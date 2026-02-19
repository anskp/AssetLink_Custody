import { makeRequest } from './utils.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function linkAsset() {
    const assetId = `RWA-${Date.now()}`;
    console.log(`--- [1/4] Linking New Asset: ${assetId} ---`);

    const payload = {
        assetId: assetId,
        assetName: 'Luxury Villa Dubai',
        initialNav: '500.50',
        initialPor: '1000.00',
        customFields: {
            symbol: 'LVD',
            location: 'Palm Jumeirah'
        }
    };

    try {
        const result = await makeRequest('POST', '/custody/link', payload, 'maker', 'workflow_user');
        const custodyId = result.id;
        const assetId = result.assetId;
        console.log('✅ Asset Linked Successfully!');
        console.log('Custody ID:', custodyId);

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

        updateEnv('LAST_CUSTODY_ID', custodyId);
        updateEnv('LAST_ASSET_ID', assetId);

        fs.writeFileSync(envPath, envContent);
        console.log('💾 IDs saved to workflow/.env');
    } catch (error) {
        process.exit(1);
    }
}

linkAsset();
