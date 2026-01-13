
import axios from 'axios';
import crypto from 'crypto';

const API_BASE_URL = 'http://localhost:3000';

// Keys from generate-test-curls.js
const MAKER = {
    publicKey: 'ak_c909d5a9253acd9e54ef917f66eedf99',
    secretKey: 'sk_ebd6ccc695e9e6c38336b3686548fee760b8819fe941928e'
};

const CHECKER = {
    publicKey: 'ak_0f6bf9ab66a61cd598e709b65357856d',
    secretKey: 'sk_f8a705ef9cf26073e83f8d9ed0d60830df0203f8b80b531c'
};

function generateSignature(method, path, timestamp, body, secret) {
    const bodyString = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : '';
    // Path should include the v1 prefix if it's part of the route match, but usually signature logic depends on implementation.
    // Assuming backend takes the full path including /v1 or relative. 
    // Looking at generate-test-curls.js: 
    // const linkPath = '/v1/custody/link';
    // const payload = method + path + timestamp + bodyString;
    // So we should use the path starting with /v1
    const payload = method + path + timestamp + bodyString;
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

async function callApi(method, endpoint, body, keyPair) {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = generateSignature(method, endpoint, timestamp, body, keyPair.secretKey);

    try {
        const config = {
            method: method,
            url: `${API_BASE_URL}${endpoint}`,
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': keyPair.publicKey,
                'x-signature': signature,
                'x-timestamp': timestamp,
                'x-user-id': 'test-user-123'
            },
            data: body
        };

        console.log(`\n📞 ${method} ${endpoint}`);
        const response = await axios(config);
        console.log(`✅ Success: ${response.status}`);
        return response.data;
    } catch (error) {
        if (error.response) {
            console.error(`❌ API Error ${endpoint}: ${error.response.status}`);
            console.error(JSON.stringify(error.response.data, null, 2));
            throw new Error(`API failed`);
        } else {
            console.error(`❌ Error ${endpoint}:`, error.message);
            throw error;
        }
    }
}

async function runFullFlow() {
    try {
        const uniqueId = crypto.randomUUID();
        const assetId = `TEST_ASSET_${uniqueId}`;
        const tokenSymbol = `TST${uniqueId.substring(0, 4).toUpperCase()}`;

        console.log(`\n🚀 Starting Full Flow Test`);
        console.log(`📝 Asset ID: ${assetId}`);
        console.log(`TOKEN Symbol: ${tokenSymbol}`);

        // 1. Link Asset
        const linkBody = {
            assetId: assetId,
            assetType: 'WATCH',
            assetName: `Rolex Test ${uniqueId}`,
            estimatedValue: '15000',
            currency: 'USD',
            documents: [],
            images: []
        };
        const linkRes = await callApi('POST', '/v1/custody/link', linkBody, MAKER);
        const custodyRecordId = linkRes.id;
        console.log(`\n📄 Custody Record Created: ${custodyRecordId}`);

        // 2. Approve Link
        await callApi('POST', `/v1/custody/${custodyRecordId}/approve`, {}, CHECKER);
        console.log(`\n✅ Custody Link Approved`);

        // 3. Initiate Mint
        const mintBody = {
            assetId: assetId,
            tokenSymbol: tokenSymbol,
            tokenName: `Test Token ${uniqueId}`,
            totalSupply: "100",
            decimals: 18,
            blockchainId: "11155111" // Sepolia
        };
        const mintRes = await callApi('POST', '/v1/operations/mint', mintBody, MAKER);
        const operationId = mintRes.id;
        console.log(`\n⚙️ Mint Operation Initiated: ${operationId}`);

        // 4. Approve Mint
        await callApi('POST', `/v1/operations/${operationId}/approve`, {}, CHECKER);
        console.log(`\n🚀 Mint Operation Approved!`);

        // 5. Poll for completion
        console.log(`\n⏳ Polling for MINTED status...`);
        let attempts = 0;
        while (attempts < 30) {
            await new Promise(r => setTimeout(r, 2000));
            try {
                const custodyRes = await callApi('GET', `/v1/custody/${assetId}`, null, MAKER);
                console.log(`   Status: ${custodyRes.status}`);
                if (custodyRes.status === 'MINTED') {
                    console.log(`\n✅ TOKEN MINTED SUCCESSFULLY!`);
                    console.log(`   Detailed Record:`, JSON.stringify(custodyRes, null, 2));
                    break;
                }
            } catch (e) {
                console.log('   Error polling:', e.message);
            }
            attempts++;
        }

    } catch (error) {
        console.error('\n❌ Test Failed:', error.message);
        process.exit(1);
    }
}

runFullFlow();
