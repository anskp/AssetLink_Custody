import { generateSignature } from '../src/modules/auth/hmac.service.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const BASE_URL = 'http://localhost:3000';
const API_KEY = 'ak_c909d5a9253acd9e54ef917f66eedf99';
const SECRET = 'sk_0b02353396cb44321010323c91557008'; // Example secret

function generateCurl(method, endpoint, jsonPath) {
    const fullPath = path.join(__dirname, '..', jsonPath);
    const body = fs.readFileSync(fullPath, 'utf8');
    const timestamp = Math.floor(Date.now() / 1000).toString();

    // Calculate signature
    const signature = generateSignature(method, endpoint, timestamp, JSON.parse(body), SECRET);

    // For development, we can also use:
    const dummySignature = 'dummy_signature_for_testing';

    console.log(`\n--- ${method} ${endpoint} ---`);
    console.log(`curl -X ${method} "${BASE_URL}${endpoint}" \\`);
    console.log(`  -H "Content-Type: application/json" \\`);
    console.log(`  -H "x-api-key: ${API_KEY}" \\`);
    console.log(`  -H "x-signature: ${dummySignature}" \\`);
    console.log(`  -H "x-timestamp: ${timestamp}" \\`);
    console.log(`  -d @${jsonPath}`);
}

console.log('Generating curl commands using dummy signature (works in development mode)...');

generateCurl('POST', '/v1/custody/link', 'tests/json/price-link.json');
generateCurl('POST', '/v1/marketplace/listings', 'tests/json/price-listing.json');
