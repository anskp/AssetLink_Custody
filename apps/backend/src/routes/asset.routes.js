import express from 'express';
import * as assetController from '../modules/asset-linking/asset.controller.js';
import { authenticate, requirePermission } from '../modules/auth/auth.middleware.js';
import upload from '../utils/upload.js';

/**
 * Asset Routes
 * Enhanced asset linking and metadata management endpoints
 */

const router = express.Router();
// Link asset to custody (programmatic API)
router.post('/link',
    upload.conditionalUpload([
        { name: 'ownershipDocument', maxCount: 1 },
        { name: 'assetImages', maxCount: 10 },
        { name: 'assetVideo', maxCount: 1 }
    ]),
    authenticate,
    requirePermission('write'),
    assetController.createAsset
);
// Publicly available within authenticated session
router.get('/types', assetController.getAssetTypes);
router.get('/stats/types', assetController.getAssetStatsByType);

// Search and list (Read permission)
router.get('/search', requirePermission('read'), assetController.searchAssets);
router.get('/types/:type', requirePermission('read'), assetController.getAssetsByType);

// Record management (Write/Admin permission)
router.post('/', authenticate, requirePermission('write'), assetController.createAsset);
router.get('/:assetId', authenticate, requirePermission('read'), assetController.getAssetDetails);
router.patch('/:assetId', authenticate, requirePermission('write'), assetController.updateAsset);
router.post('/:assetId/verify', authenticate, requirePermission('admin'), assetController.verifyAsset);

export default router;
