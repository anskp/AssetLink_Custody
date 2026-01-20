import * as mintService from './mint.service.js';
import logger from '../../utils/logger.js';
import dotenv from 'dotenv';

dotenv.config();

async function runTest() {
    const testMintData = {
        assetId: '40', // Using existing asset idiosyncratic from DB
        tokenSymbol: 'T100',
        tokenName: 'Test Token 100',
        totalSupply: 100,
        decimals: 18,
        blockchainId: 'ETH_TEST5',
        vaultWalletId: '327' // Using the vault ID from the logs
    };

    const actor = 'TEST_RUNNER';
    const context = {
        ipAddress: '127.0.0.1',
        userAgent: 'TestScript'
    };

    try {
        logger.info('Starting test minting with supply 100...');
        const result = await mintService.mintToken(testMintData, actor, context);
        logger.info('Test minting result:', result);
    } catch (error) {
        logger.error('Test minting failed:', error);
    }
}

runTest();
