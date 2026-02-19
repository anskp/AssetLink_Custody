import crypto from 'crypto';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

export const config = {
    baseUrl: process.env.ASSETLINK_CUSTODY_BASE_URL,
    maker: {
        public: process.env.ASSETLINK_CUSTODY_MAKER_API_KEY,
        secret: process.env.ASSETLINK_CUSTODY_MAKER_SECRET_KEY
    },
    checker: {
        public: process.env.ASSETLINK_CUSTODY_CHECKER_API_KEY,
        secret: process.env.ASSETLINK_CUSTODY_CHECKER_SECRET_KEY
    }
};

export const generateSignature = (method, fullPath, timestamp, body, secret) => {
    const bodyString = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : '';
    const payload = method.toUpperCase() + fullPath + timestamp + bodyString;
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    return hmac.digest('hex');
};

export const makeRequest = async (method, relativePath, body, role = 'maker', userId = 'workflow_user') => {
    const fullPath = '/v1' + relativePath; // Relative path should start with /
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const keys = role === 'maker' ? config.maker : config.checker;

    const signature = generateSignature(method, fullPath, timestamp, body, keys.secret);

    const headers = {
        'x-api-key': keys.public,
        'x-signature': signature,
        'x-timestamp': timestamp,
        'x-user-id': userId,
        'Content-Type': 'application/json'
    };

    try {
        const response = await axios({
            method,
            url: config.baseUrl + relativePath,
            data: body,
            headers
        });
        return response.data;
    } catch (error) {
        console.error(`❌ Request Failed [${method} ${relativePath}]:`, error.response?.data || error.message);
        throw error;
    }
};
