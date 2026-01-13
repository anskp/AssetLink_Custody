import 'dotenv/config';
import fireblocksClient from '../src/modules/fireblocks/fireblocks.client.js';
import { config } from '../src/config/env.js';
import path from 'path';

// Force config for test
config.fireblocks = {
    apiKey: 'cdfb14c1-72ca-4f26-bd54-32a53b1550a0',
    secretKeyPath: 'C:\\Users\\anask\\Desktop\\AssetLink Custody\\apps\\backend\\fireblocks_secret.key',
    baseUrl: 'https://sandbox-api.fireblocks.io'
};

async function testManualIssue() {
    try {
        console.log('🧪 Starting Manual Issue Test using Vault 88...');
        console.log('API Key configured:', config.fireblocks.apiKey ? 'YES' : 'NO');

        const uniqueSuffix = Date.now().toString().slice(-6);
        const tokenConfig = {
            name: `TestToken${uniqueSuffix}`,
            symbol: `TT${uniqueSuffix}`,
            decimals: 18,
            totalSupply: '1000',
            blockchainId: 'ETH_TEST5', // Sepolia
            contractId: undefined // Use default from client
        };

        console.log('Config:', tokenConfig);

        // 1. Issue Token using Vault 88
        const result = await fireblocksClient.issueToken('88', tokenConfig);
        console.log('✅ Issue Request Submitted:', result);

        const tokenLinkId = result.tokenLinkId;

        // 2. Poll for status
        console.log(`⏳ Monitoring ${tokenLinkId}...`);

        for (let i = 0; i < 20; i++) {
            await new Promise(r => setTimeout(r, 5000));
            const status = await fireblocksClient.getTokenizationStatus(tokenLinkId);
            console.log(`[${i + 1}] Status: ${status.status} / ${status.substatus || ''}`);

            if (status.status === 'FAILED') {
                console.error('❌ FAILED with details:', JSON.stringify(status, null, 2));
                break;
            }
            if (status.status === 'COMPLETED') {
                console.log('✅ SUCCESS!');
                console.log('Details:', JSON.stringify(status, null, 2));
                break;
            }
        }

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

testManualIssue();
