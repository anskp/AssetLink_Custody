import crypto from 'crypto';
import axios from 'axios';

// API Keys from copym-platform/backend/.env
const MAKER_PUBLIC = 'ak_83a84a990f86d438d3d2c351962faa37';
const MAKER_SECRET = 'sk_402ac0ab604273cbebe947c552b64bb8dd9c98cb84e0dd52';

const BASE_URL = 'http://localhost:3000/v1';

const generateSignature = (method, path, timestamp, body, secret) => {
    const bodyString = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : '';
    const payload = method + path + timestamp + bodyString;
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    return hmac.digest('hex');
};

async function testConnectivity() {
    const path = '/v1/custody/stats';
    const method = 'GET';
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = generateSignature(method, path, timestamp, null, MAKER_SECRET);

    console.log('--- Testing Maker Connectivity ---');
    console.log('Method:', method);
    console.log('Path:', path);
    console.log('Timestamp:', timestamp);
    console.log('Signature:', signature);

    try {
        const response = await axios.get('http://localhost:3000' + path, {
            headers: {
                'x-api-key': MAKER_PUBLIC,
                'x-signature': signature,
                'x-timestamp': timestamp
            }
        });
        console.log('✅ Success! Stats:', response.data);
    } catch (error) {
        console.error('❌ Failed:', error.response?.data || error.message);
    }
}

testConnectivity();
