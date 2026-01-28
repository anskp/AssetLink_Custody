import axios from 'axios';

const BASE_URL = 'http://localhost:3000/v1';
const API_KEY = 'ak_c909d5a9253acd9e54ef917f66eedf99';
const SIGNATURE = 'dummy_signature_for_testing';

async function testFreeze() {
    try {
        console.log('--- Testing Freeze Initiation ---');
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const response = await axios.post(`${BASE_URL}/operations/freeze`,
            { assetId: '63' },
            {
                headers: {
                    'x-api-key': API_KEY,
                    'x-signature': SIGNATURE,
                    'x-timestamp': timestamp,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log('Success:', response.status);
        console.log('Operation Created:', response.data.id);
        return response.data;
    } catch (error) {
        console.error('Freeze Initiation Failed:', error.response?.data || error.message);
    }
}

async function testAdminFreeze() {
    try {
        console.log('\n--- Testing Admin Direct Freeze ---');
        const timestamp = Math.floor(Date.now() / 1000).toString();
        // Use the checker key for admin action
        const response = await axios.post(`${BASE_URL}/operations/admin/freeze`,
            { assetId: '62' },
            {
                headers: {
                    'x-api-key': 'ak_0f6bf9ab66a61cd598e709b65357856d',
                    'x-signature': SIGNATURE,
                    'x-timestamp': timestamp,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log('Success:', response.status);
        console.log('Result:', response.data.status);
        return response.data;
    } catch (error) {
        console.error('Admin Direct Freeze Failed:', error.response?.data || error.message);
    }
}

async function testBurn() {
    try {
        console.log('\n--- Testing Burn Initiation ---');
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const response = await axios.post(`${BASE_URL}/operations/burn`,
            { assetId: '63', amount: '1' },
            {
                headers: {
                    'x-api-key': API_KEY,
                    'x-signature': SIGNATURE,
                    'x-timestamp': timestamp,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log('Success:', response.status);
        console.log('Operation Created:', response.data.id);
        return response.data;
    } catch (error) {
        console.error('Burn Initiation Failed:', error.response?.data || error.message);
    }
}

async function runTests() {
    await testFreeze();
    await testAdminFreeze();
    await testBurn();
}

runTests();
