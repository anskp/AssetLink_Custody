import axios from 'axios';
import fs from 'fs';
import path from 'path';

const API_BASE_URL = 'http://localhost:3001';
const API_KEY = 'ak_0f6bf9ab66a61cd598e709b65357856d'; // Used in user logs
const DUMMY_SIGNATURE = 'dummy_signature_for_testing';
const CONFIG_PATH = path.resolve('tests/json/test-mint.json');

async function runMintTest() {
    try {
        const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
        const timestamp = Math.floor(Date.now() / 1000).toString();

        console.log(`\n🚀 Starting mint test for asset: ${config.assetId}`);

        // Step 1: Initiate mint
        console.log('\n📤 Step 1: Initiating mint operation...');
        const initiateRes = await axios.post(`${API_BASE_URL}/v1/operations/mint`, config, {
            headers: {
                'X-API-Key': API_KEY,
                'X-Signature': DUMMY_SIGNATURE,
                'X-Timestamp': timestamp,
                'Content-Type': 'application/json'
            }
        });

        const operationId = initiateRes.data.id;
        console.log(`✅ Operation initiated: ${operationId}`);

        // Step 2: Approve mint
        console.log('\n📤 Step 2: Approving operation...');
        const approveRes = await axios.post(`${API_BASE_URL}/v1/operations/${operationId}/approve`, {}, {
            headers: {
                'X-API-Key': API_KEY + '_CHECKER',
                'X-Signature': DUMMY_SIGNATURE,
                'X-Timestamp': timestamp,
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Operation approved and executed!');
        console.log('\n📊 Final Result:');
        console.log(JSON.stringify(approveRes.data, null, 2));

    } catch (error) {
        if (error.response) {
            console.error('\n❌ API Error:', error.response.status, error.response.data);
        } else {
            console.error('\n❌ Error:', error.message);
        }
    }
}

runMintTest();
