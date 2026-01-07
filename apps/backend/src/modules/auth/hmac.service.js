import crypto from 'crypto';
import { compareSecret } from '../../utils/crypto.js';

/**
 * HMAC Service
 * Handles HMAC-SHA256 signature generation and verification
 */

/**
 * Create signature payload from request components
 */
export const createSignaturePayload = (method, path, timestamp, body) => {
    const bodyString = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : '';
    const payload = method + path + timestamp + bodyString;

    // Debug logging for signature mismatches
    if (process.env.NODE_ENV === 'development') {
        console.log('[HMAC DEBUG] Payload Components:', {
            method,
            path,
            timestamp,
            bodyType: typeof body,
            hasBody: !!body,
            bodyString: bodyString.length > 500 ? bodyString.substring(0, 500) + '...' : bodyString
        });
        console.log('[HMAC DEBUG] Final Payload:', payload);
    }

    return payload;
};

/**
 * Generate HMAC-SHA256 signature
 */
export const generateSignature = (method, path, timestamp, body, secret) => {
    const payload = createSignaturePayload(method, path, timestamp, body);
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    return hmac.digest('hex');
};

/**
 * Verify HMAC signature
 * @param {string} providedSignature - Signature from request header
 * @param {string} method - HTTP method
 * @param {string} path - Request path
 * @param {string} timestamp - Unix timestamp
 * @param {any} body - Request body
 * @param {string} secretKeyHash - Hashed secret from database
 * @param {string} plainSecret - Plain secret (for verification)
 */
export const verifySignature = async (providedSignature, method, path, timestamp, body, secretKeyHash, plainSecret = null) => {
    try {
        // If plain secret is provided (during key creation), use it directly
        if (plainSecret) {
            const expectedSignature = generateSignature(method, path, timestamp, body, plainSecret);
            return crypto.timingSafeEqual(
                Buffer.from(providedSignature, 'hex'),
                Buffer.from(expectedSignature, 'hex')
            );
        }

        // Otherwise, we need to compare against the hash
        // Note: In production, you'd need to store the plain secret temporarily or use a different approach
        // For now, this is a placeholder that will be enhanced
        return false;
    } catch (error) {
        return false;
    }
};

/**
 * Verify signature with plain secret (used during authentication)
 */
export const verifySignatureWithSecret = (providedSignature, method, path, timestamp, body, secret) => {
    try {
        const expectedSignature = generateSignature(method, path, timestamp, body, secret);
        const isValid = crypto.timingSafeEqual(
            Buffer.from(providedSignature, 'hex'),
            Buffer.from(expectedSignature, 'hex')
        );

        if (!isValid && process.env.NODE_ENV === 'development') {
            console.log('[HMAC DEBUG] Signature Mismatch!');
            console.log('  Provided:', providedSignature);
            console.log('  Expected:', expectedSignature);
        }

        return isValid;
    } catch (error) {
        if (process.env.NODE_ENV === 'development') {
            console.error('[HMAC DEBUG] Verification Error:', error.message);
        }
        return false;
    }
};

export default {
    createSignaturePayload,
    generateSignature,
    verifySignature,
    verifySignatureWithSecret
};
