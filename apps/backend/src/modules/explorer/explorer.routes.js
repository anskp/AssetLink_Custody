import express from 'express';
import explorerController from './explorer.controller.js';

const router = express.Router();

/**
 * Public Explorer Routes
 * Note: These routes do NOT require authentication
 */

// Latest transactions
router.get('/latest-txs', explorerController.getLatestTransactions);

// Global statistics
router.get('/stats', explorerController.getStats);

// Asset details by public contract address
router.get('/asset/:address', explorerController.getAssetByAddress);

// Transaction details by off-chain hash
router.get('/tx/:hash', explorerController.getTransactionByHash);

// Address details / Portfolio
router.get('/address/:ownerId', explorerController.getAddressDetails);

// Unified search
router.get('/search', explorerController.search);

// All assets
router.get('/assets', explorerController.getAllAssets);

export default router;
