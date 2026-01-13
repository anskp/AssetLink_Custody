
import axios from 'axios';
import crypto from 'crypto';

const API_BASE_URL = 'http://localhost:3000';

const MAKER = {
    publicKey: 'ak_c909d5a9253acd9e54ef917f66eedf99',
    secretKey: 'sk_ebd6ccc695e9e6c38336b3686548fee760b8819fe941928e'
};

function generateSignature(method, path, timestamp, body, secret) {
    const bodyString = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : '';
    const payload = method + path + timestamp + bodyString;
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

async function callApi(method, endpoint, body, keyPair) {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = generateSignature(method, endpoint, timestamp, body, keyPair.secretKey);

    console.log(`\n📞 Request: ${method} ${API_BASE_URL}${endpoint}`);
    if (body) console.log('📦 Body:', JSON.stringify(body, null, 2));

    try {
        const config = {
            method: method,
            url: `${API_BASE_URL}${endpoint}`,
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': keyPair.publicKey,
                'x-signature': signature,
                'x-timestamp': timestamp
            },
            data: body
        };

        const response = await axios(config);
        console.log(`✅ Success: ${response.status}`);
        console.log('📄 Response:', JSON.stringify(response.data, null, 2));
        return response.data;
    } catch (error) {
        if (error.response) {
            console.error(`❌ API Error: ${error.response.status}`);
            console.error('❌ Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(`❌ Network/Client Error:`, error.message);
        }
    }
}

async function debug() {
    try {
        const uniqueId = crypto.randomUUID();
        const assetId = `DEBUG_ASSET_${uniqueId}`;

        console.log(`\n🔍 Checking if asset exists: ${assetId}`);
        await callApi('GET', `/v1/custody/${assetId}`, null, MAKER);

        console.log(`\n📤 Linking asset: ${assetId}`);
        const linkBody = {
            assetId: assetId,
            assetType: 'WATCH',
            assetName: `Debug Rolex ${uniqueId.substring(0, 8)}`,
            estimatedValue: '1000',
            currency: 'USD',
            documents: [],
            images: []
        };

        await callApi('POST', '/v1/custody/link', linkBody, MAKER);

    } catch (error) {
        console.error('Script Error:', error);
    }
}

debug();
