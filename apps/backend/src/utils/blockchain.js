/**
 * Blockchain Utilities
 * Mapping between Chain IDs and Fireblocks Asset IDs
 */

const CHAIN_ID_TO_FIREBLOCKS_ASSET = {
    '11155111': 'ETH_TEST5',      // Ethereum Sepolia testnet
    '1': 'ETH',                   // Ethereum mainnet
    '137': 'MATIC',               // Polygon mainnet
    '80001': 'MATIC_MUMBAI',      // Polygon Mumbai testnet (legacy)
    '80002': 'MATIC_AMOY',        // Polygon Amoy testnet
    '56': 'BNB',                   // BNB Smart Chain mainnet
    '97': 'BNB_TEST',             // BNB Smart Chain testnet
    '43114': 'AVAX',              // Avalanche C-Chain mainnet
    '43113': 'AVAX_TEST'          // Avalanche Fuji testnet
};

/**
 * Maps a blockchain ID (Chain ID or name) to a Fireblocks Asset ID
 * @param {string|number} blockchainId - Numeric Chain ID or blockchain name
 * @returns {string} Fireblocks Asset ID
 */
export const mapToFireblocksAsset = (blockchainId) => {
    if (!blockchainId) return 'ETH_TEST5'; // Default fallback

    const idStr = String(blockchainId).trim();

    // If it's already a Fireblocks-style string (contains letters or underscore), return as is
    if (/[a-zA-Z_]/.test(idStr)) {
        return idStr;
    }

    // Lookup in mapping table
    return CHAIN_ID_TO_FIREBLOCKS_ASSET[idStr] || 'ETH_TEST5';
};

export default {
    mapToFireblocksAsset
};
