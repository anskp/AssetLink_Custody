
import 'dotenv/config';
import { getFireblocksClient } from '../src/config/fireblocks.js';
import { config } from '../src/config/env.js';

async function simpleMintTest() {
    console.log('🧪 Starting Simple Mint Test (SDK Direct Mode)...');

    // Force config if env not loaded correctly
    if (!config.fireblocks.apiKey) {
        config.fireblocks = {
            apiKey: 'cdfb14c1-72ca-4f26-bd54-32a53b1550a0',
            secretKeyPath: 'C:\\Users\\anask\\Desktop\\AssetLink Custody\\apps\\backend\\fireblocks_secret.key',
            baseUrl: 'https://sandbox-api.fireblocks.io'
        };
    }

    const fireblocks = getFireblocksClient();

    if (!fireblocks) {
        console.error('❌ Failed to initialize Fireblocks SDK');
        process.exit(1);
    }

    console.log('✅ SDK Initialized');

    const uniqueSuffix = Date.now().toString().slice(-6);
    const createTokenRequestDto = {
        blockchainId: "ETH_TEST5",
        assetId: "ETH_TEST5", // This is usually the blockchain asset, but for token creation it might need to vary depending on SDK version? 
        // Actually guide says assetId: "ETH_TEST5"
        vaultAccountId: "88",
        createParams: {
            contractId: "d39ba6d0-f738-4fab-ae00-874213375b5c",
            deployFunctionParams: [
                { name: "name", type: "string", value: `Gold Token ${uniqueSuffix}` },
                { name: "symbol", type: "string", value: `GOLD${uniqueSuffix}` },
                { name: "decimals", type: "uint8", value: "18" },
                { name: "totalSupply", type: "uint256", value: "1000000000000000000000000" }
            ]
        },
        displayName: `Gold Token ${uniqueSuffix}`,
        useGasless: false,
        feeLevel: "MEDIUM"
    };

    console.log('🚀 Sending issueNewToken request via SDK...');
    try {
        const result = await fireblocks.tokenization.issueNewToken({ createTokenRequestDto });
        console.log('✅ Mint Initiated Successfully!');
        console.log('Response:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('❌ Minting Failed via SDK:', error);
        if (error.response) {
            console.error('Error Response:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

simpleMintTest();
