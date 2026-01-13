import https from 'https';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Configure dotenv
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Try to load .env from backend root
dotenv.config({ path: path.join(__dirname, '../.env') });

// Fireblocks API Configuration
const FIREBLOCKS_API_URL = 'sandbox-api.fireblocks.io';
const API_PATH = '/v1/tokenization/tokens';

// Fireblocks credentials
// Use hardcoded values if env vars are missing, based on previous context
const API_KEY = process.env.FIREBLOCKS_API_KEY || 'cdfb14c1-72ca-4f26-bd54-32a53b1550a0';

// Resolve secret key path relative to process.cwd()
// Assumed CWD: C:\Users\anask\Desktop\AssetLink Custody
let PRIVATE_KEY_PATH = path.join(process.cwd(), 'apps', 'backend', 'fireblocks_secret.key');

console.log('Configuration:');
console.log(`CWD: ${process.cwd()}`);
console.log(`API Key: ${API_KEY}`);
console.log(`Attemping Key Path: ${PRIVATE_KEY_PATH}`);

if (!fs.existsSync(PRIVATE_KEY_PATH)) {
    console.error(`❌ Error: Secret key file not found at ${PRIVATE_KEY_PATH}`);

    // Fallback to strict absolute path
    const fallback = 'C:\\Users\\anask\\Desktop\\AssetLink Custody\\apps\\backend\\fireblocks_secret.key';
    console.log(`Trying fallback absolute path: ${fallback}`);

    if (fs.existsSync(fallback)) {
        console.log('✅ Found at fallback!');
        PRIVATE_KEY_PATH = fallback;
    } else {
        console.log('❌ Fallback failed too.');
        // Debug: list dir
        const dirToCheck = path.dirname(PRIVATE_KEY_PATH);
        if (fs.existsSync(dirToCheck)) {
            console.log(`Listing files in ${dirToCheck}:`);
            console.log(fs.readdirSync(dirToCheck));
        } else {
            console.log(`Directory ${dirToCheck} does not exist!`);
        }
        process.exit(1);
    }
}

// Function to generate JWT token for Fireblocks
function generateJWT(path, bodyJson) {
    // ... (rest of JWT logic same)
    try {
        const privateKey = fs.readFileSync(PRIVATE_KEY_PATH, 'utf8');

        const token = {
            uri: path,
            nonce: crypto.randomBytes(16).toString('hex'),
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 55, // 55 seconds expiry
            sub: API_KEY,
            bodyHash: crypto.createHash('sha256').update(bodyJson).digest('hex')
        };

        const header = {
            alg: 'RS256',
            typ: 'JWT'
        };

        const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
        const encodedPayload = Buffer.from(JSON.stringify(token)).toString('base64url');
        const signature = crypto.sign('RSA-SHA256', Buffer.from(`${encodedHeader}.${encodedPayload}`), {
            key: privateKey,
            padding: crypto.constants.RSA_PKCS1_PADDING
        }).toString('base64url');

        return `${encodedHeader}.${encodedPayload}.${signature}`;
    } catch (error) {
        console.error('Error generating JWT:', error.message);
        throw error;
    }
}

// Unique suffix for uniqueness
const uniqueSuffix = Date.now().toString().slice(-6);

// Request payload
const payload = {
    "blockchainId": "ETH_TEST5",
    "assetId": "ETH_TEST5",
    "vaultAccountId": "88",
    "createParams": {
        "contractId": "d39ba6d0-f738-4fab-ae00-874213375b5c",
        "deployFunctionParams": [
            {
                "name": "name",
                "type": "string",
                "value": `Manual Test Token ${uniqueSuffix}`
            },
            {
                "name": "symbol",
                "type": "string",
                "value": `MTT${uniqueSuffix}`
            },
            {
                "name": "decimals",
                "type": "uint8",
                "value": "18"
            },
            {
                "name": "totalSupply",
                "type": "uint256",
                "value": "1000000000000000000000000"
            }
        ]
    },
    "displayName": `Manual Test Token ${uniqueSuffix}`,
    "useGasless": false,
    "feeLevel": "MEDIUM"
};

// Function to create token
async function createToken() {
    const data = JSON.stringify(payload);

    // Generate JWT token
    const jwt = generateJWT(API_PATH, data);

    // Print Curl Command
    console.log('\n📜 Generated cURL Command (Valid for 55s):');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`curl --request POST \\
  --url https://${FIREBLOCKS_API_URL}${API_PATH} \\
  --header 'Authorization: Bearer ${jwt}' \\
  --header 'Content-Type: application/json' \\
  --header 'X-API-Key: ${API_KEY}' \\
  --data '${data}'`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const options = {
        hostname: FIREBLOCKS_API_URL,
        path: API_PATH,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length,
            'X-API-Key': API_KEY,
            'Authorization': `Bearer ${jwt}`
        }
    };
    // ... (rest request logic)

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let responseData = '';

            res.on('data', (chunk) => {
                responseData += chunk;
            });

            res.on('end', () => {
                console.log('Status Code:', res.statusCode);

                try {
                    const parsedData = JSON.parse(responseData);
                    console.log('Response Body:', JSON.stringify(parsedData, null, 2));
                    if (res.statusCode >= 400) {
                        reject(new Error(`API Error: ${parsedData.message || res.statusCode}`));
                    } else {
                        resolve(parsedData);
                    }
                } catch (error) {
                    console.log('Raw Response:', responseData);
                    resolve(responseData);
                }
            });
        });

        req.on('error', (error) => {
            console.error('Error:', error);
            reject(error);
        });

        req.write(data);
        req.end();
    });
}

// Execute the function
console.log('Creating token on Fireblocks...');
console.log('Request Payload:', JSON.stringify(payload, null, 2));
console.log('\n---\n');

createToken()
    .then(response => {
        console.log('\n✅ Token creation request sent successfully!');
    })
    .catch(error => {
        console.error('\n❌ Failed to create token:', error);
        process.exit(1);
    });
