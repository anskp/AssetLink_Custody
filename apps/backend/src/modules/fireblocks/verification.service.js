import axios from 'axios';
import { ethers } from 'ethers';
import { config } from '../../config/env.js';
import logger from '../../utils/logger.js';
import { UAT_IMPLEMENTATION_ADDRESS } from './contracts.js';
import { FIREBLOCKS_PROXY_SOURCE, RWA_ORACLE_SOURCE } from './verification.logic.js';

const ETHERSCAN_API_URL = 'https://api-sepolia.etherscan.io/api';

/**
 * Verification Service - Ported to pure API calls
 * Triggers Etherscan verification for JIT-deployed contracts
 * without relying on external Hardhat repositories.
 */
export const verifyContractStack = async (data) => {
    const { name, symbol, address, nav, por, admin } = data;
    const apiKey = config.etherscan?.apiKey;

    if (!apiKey) {
        logger.warn('[VERIFICATION] Skipping verification: ETHERSCAN_API_KEY not configured.');
        return;
    }

    logger.info(`[VERIFICATION] Queuing autonomous verification for ${name} (20s delay for propagation)`, { address });

    // Wait 20 seconds for Etherscan to index the contract code
    setTimeout(async () => {
        // 1. Verify Proxy
        await verifyProxy(address, name, symbol, nav, por, admin, apiKey);

        // 2. Verify Oracles
        if (nav) await verifyOracle(nav, `NAV Oracle: ${name}`, 8, 0, apiKey);
        if (por) await verifyOracle(por, `PoR Oracle: ${name}`, 18, 0, apiKey);

        logger.info(`[VERIFICATION] Background tasks submitted for ${name}`, { address });
    }, 20000);
};

/**
 * Verify the FireblocksProxy contract
 */
async function verifyProxy(address, name, symbol, nav, por, admin, apiKey) {
    try {
        const uatImplementation = UAT_IMPLEMENTATION_ADDRESS;

        // Encode initialization data (same as in mint.service.js)
        // We use a dummy interface here just to get the signature
        const uatAbi = [
            "function initialize(string,string,address,address,address,address,address)"
        ];
        const uatInterface = new ethers.Interface(uatAbi);
        const initData = uatInterface.encodeFunctionData("initialize", [
            name, symbol, admin, admin, admin, nav, por
        ]);

        // Encode constructor arguments for FireblocksProxy(address _logic, bytes memory _data)
        const abiCoder = new ethers.AbiCoder();
        const constructorArgs = abiCoder.encode(["address", "bytes"], [uatImplementation, initData]);

        // Remove '0x' prefix for Etherscan
        const encodedArgs = constructorArgs.startsWith('0x') ? constructorArgs.substring(2) : constructorArgs;

        await submitToEtherscan(address, FIREBLOCKS_PROXY_SOURCE, 'FireblocksProxy', encodedArgs, apiKey);

        // Link as Proxy (Etherscan specific step)
        // Note: This often happens automatically if bytecode matches a known proxy, 
        // but we can trigger it explicitly if needed via separate API.
    } catch (error) {
        logger.error('[VERIFICATION] Proxy verification logic failed', { error: error.message });
    }
}

/**
 * Verify an RWAOracle contract
 */
async function verifyOracle(address, description, decimals, initialValue, apiKey) {
    try {
        const abiCoder = new ethers.AbiCoder();
        const constructorArgs = abiCoder.encode(["string", "uint8", "int256"], [description, decimals, initialValue]);
        const encodedArgs = constructorArgs.substring(2);

        await submitToEtherscan(address, RWA_ORACLE_SOURCE, 'RWAOracle', encodedArgs, apiKey);
    } catch (error) {
        logger.warn(`[VERIFICATION] Oracle verification failed for ${address}`, { error: error.message });
    }
}

/**
 * Generic Etherscan Submission
 */
async function submitToEtherscan(address, source, contractName, constructorArgs, apiKey) {
    const params = new URLSearchParams();
    params.append('apikey', apiKey);
    params.append('module', 'contract');
    params.append('action', 'verifysourcecode');
    params.append('contractaddress', address);
    params.append('sourceCode', source);
    params.append('codeformat', 'solidity-single-file');
    params.append('contractname', contractName);
    params.append('compilerversion', 'v0.8.20+commit.a1b79de6');
    params.append('optimizationUsed', '1');
    params.append('runs', '200');
    params.append('constructorArguements', constructorArgs);

    try {
        const response = await axios.post(ETHERSCAN_API_URL, params);

        if (response.data.status === '1') {
            logger.info(`[VERIFICATION] Submission successful for ${contractName}`, { guid: response.data.result, address });
        } else {
            if (response.data.result.includes('Already Verified')) {
                logger.info(`[VERIFICATION] ${contractName} is already verified.`, { address });
            } else {
                logger.warn(`[VERIFICATION] Etherscan rejected ${contractName}`, { result: response.data.result, address });
            }
        }
    } catch (error) {
        logger.error(`[VERIFICATION] API call failed for ${contractName}`, { error: error.message });
    }
}

export default {
    verifyContractStack
};
