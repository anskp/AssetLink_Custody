import crypto from 'crypto';
import axios from 'axios';

// API Keys
const MAKER_PUBLIC = 'ak_83a84a990f86d438d3d2c351962faa37';
const MAKER_SECRET = 'sk_402ac0ab604273cbebe947c552b64bb8dd9c98cb84e0dd52';

const CHECKER_PUBLIC = 'ak_cba55b501da24894d83d1d74d7022d81';
const CHECKER_SECRET = 'sk_d7accf74dde6d93dd6d5d9bcbe504743cd599a5b0d57ab58';

const BASE_URL = 'http://localhost:3000';

const generateSignature = (method, path, timestamp, body, secret) => {
    const bodyString = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : '';
    const payload = method + path + timestamp + bodyString;
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    return hmac.digest('hex');
};

async function testRwaFlow() {
    const assetId = `RWA_TEST_${Date.now()}`;
    const timestamp = Math.floor(Date.now() / 1000).toString();

    // 1. Link Asset (Maker)
    const linkPath = '/v1/custody/link';
    const linkBody = {
        assetId,
        assetName: 'Test RWA Estate',
        initialNav: '450.50',
        initialPor: '1000.00',
        customFields: {
            symbol: 'REIT',
            location: 'Dubai'
        }
    };

    const signature = generateSignature('POST', linkPath, timestamp, linkBody, MAKER_SECRET);

    console.log('--- 1. Linking Asset ---');
    try {
        const linkRes = await axios.post(BASE_URL + linkPath, linkBody, {
            headers: {
                'x-api-key': MAKER_PUBLIC,
                'x-signature': signature,
                'x-timestamp': timestamp,
                'x-user-id': 'maker_user_1'
            }
        });
        const custodyId = linkRes.data.id;
        console.log('✅ Asset Linked! ID:', custodyId);

        // 2. Approve Asset (Checker)
        const approvePath = `/v1/custody/${custodyId}/approve`;
        const approveTimestamp = Math.floor(Date.now() / 1000).toString();
        const approveSignature = generateSignature('POST', approvePath, approveTimestamp, {}, CHECKER_SECRET);

        console.log('--- 2. Approving Asset (Starting Orchestration) ---');
        const approveRes = await axios.post(BASE_URL + approvePath, {}, {
            headers: {
                'x-api-key': CHECKER_PUBLIC,
                'x-signature': approveSignature,
                'x-timestamp': approveTimestamp,
                'x-user-id': 'checker_user_1'
            }
        });
        console.log('✅ Approval Initiated! Status:', approveRes.data.status);

        // 3. Poll for Completion
        console.log('--- 3. Polling for Orchestration Completion ---');
        let completed = false;
        let attempts = 0;
        while (!completed && attempts < 30) {
            attempts++;
            const statusTimestamp = Math.floor(Date.now() / 1000).toString();
            // Note: get status uses assetId, not custodyId
            const statusPath = `/v1/custody/${assetId}`;
            const statusSignature = generateSignature('GET', statusPath, statusTimestamp, null, MAKER_SECRET);

            const statusRes = await axios.get(BASE_URL + statusPath, {
                headers: {
                    'x-api-key': MAKER_PUBLIC,
                    'x-signature': statusSignature,
                    'x-timestamp': statusTimestamp
                }
            });

            const status = statusRes.data.status;
            console.log(`Attempt ${attempts}: Status is ${status}`);

            if (status === 'LINKED') {
                console.log('✅ Orchestration Complete!');
                console.log('   Token Address:', statusRes.data.tokenAddress);
                console.log('   NAV Oracle:', statusRes.data.navOracleAddress);
                console.log('   PoR Oracle:', statusRes.data.porOracleAddress);
                completed = true;
            } else if (status === 'FAILED') {
                console.error('❌ Orchestration Failed:', statusRes.data.errorMessage);
                break;
            } else {
                await new Promise(r => setTimeout(r, 10000));
            }
        }

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

testRwaFlow();
