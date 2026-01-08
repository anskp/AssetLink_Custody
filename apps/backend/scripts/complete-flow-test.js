import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';
const API_KEY = 'ak_c909d5a9253acd9e54ef917f66eedf99';
const DUMMY_SIGNATURE = 'dummy_signature_for_testing';

async function runCompleteFlow() {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const assetId = `TEST_ASSET_${Date.now()}`;

    try {
        console.log(`\n🚀 Starting complete flow test for asset: ${assetId}`);

        // Step 1: Link Asset
        console.log('\n📤 Step 1: Linking Asset...');
        const linkRes = await axios.post(`${API_BASE_URL}/v1/custody/link`, {
            assetId,
            assetType: 'WATCH',
            assetName: 'Test Rolex',
            estimatedValue: '10000',
            currency: 'USD',
            documents: [],
            images: []
        }, {
            headers: {
                'X-API-Key': API_KEY,
                'X-Signature': DUMMY_SIGNATURE,
                'X-Timestamp': timestamp,
                'Content-Type': 'application/json'
            }
        });

        const custodyId = linkRes.data.id;
        console.log(`✅ Asset linked: ${custodyId}`);

        // Step 2: Approve Link (This creates the vault)
        console.log('\n📤 Step 2: Approving Link...');
        await axios.post(`${API_BASE_URL}/v1/custody/${custodyId}/approve`, {}, {
            headers: {
                'X-API-Key': API_KEY + '_CHECKER',
                'X-Signature': DUMMY_SIGNATURE,
                'X-Timestamp': timestamp,
                'Content-Type': 'application/json'
            }
        });
        console.log('✅ Link approved');

        // Wait a bit for DB to settle
        await new Promise(r => setTimeout(r, 1000));

        // Step 3: Initiate Mint
        console.log('\n📤 Step 3: Initiating Mint...');
        const mintRes = await axios.post(`${API_BASE_URL}/v1/operations/mint`, {
            assetId,
            tokenSymbol: 'TEST',
            tokenName: 'Test Token',
            totalSupply: '100',
            decimals: 18,
            blockchainId: '11155111' // Test our numeric mapping!
        }, {
            headers: {
                'X-API-Key': API_KEY,
                'X-Signature': DUMMY_SIGNATURE,
                'X-Timestamp': timestamp,
                'Content-Type': 'application/json'
            }
        });

        const operationId = mintRes.data.id;
        console.log(`✅ Mint operation initiated: ${operationId}`);

        // Step 4: Approve Mint (This triggers ensureGasForVault)
        console.log('\n📤 Step 4: Approving Mint (Triggering mapping fix)...');
        const executeRes = await axios.post(`${API_BASE_URL}/v1/operations/${operationId}/approve`, {}, {
            headers: {
                'X-API-Key': API_KEY + '_CHECKER',
                'X-Signature': DUMMY_SIGNATURE,
                'X-Timestamp': timestamp,
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Mint approved and executed!');
        console.log('\n📊 Final Execution Result:');
        console.log(JSON.stringify(executeRes.data, null, 2));

    } catch (error) {
        if (error.response) {
            console.error('\n❌ API Error:', error.response.status, JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('\n❌ Error:', error.message);
        }
    }
}

runCompleteFlow();
