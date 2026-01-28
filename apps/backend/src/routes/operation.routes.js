import express from 'express';
import * as operationController from '../modules/operation/operation.controller.js';
import { authenticate, requirePermission, authenticateJwt } from '../modules/auth/auth.middleware.js';

/**
 * Operation Routes
 * Maker-Checker approval workflow endpoints
 */

const router = express.Router();

// ============================================
// DASHBOARD ENDPOINTS (JWT Authentication)
// MUST BE DEFINED FIRST
// ============================================

// Initiate mint operation from dashboard
router.post('/dashboard/mint', authenticateJwt, operationController.initiateMintOperationDashboard);

// Approve operation from dashboard
router.post('/dashboard/:id/approve', authenticateJwt, operationController.approveOperationDashboard);

// Reject operation from dashboard
router.post('/dashboard/:id/reject', authenticateJwt, operationController.rejectOperationDashboard);

// Burn & Freeze from dashboard
router.post('/dashboard/burn', authenticateJwt, operationController.initiateBurnOperationDashboard);
router.post('/dashboard/freeze', authenticateJwt, operationController.initiateFreezeOperationDashboard);
router.post('/dashboard/unfreeze', authenticateJwt, operationController.initiateUnfreezeOperationDashboard);

// List operations from dashboard
router.get('/dashboard', authenticateJwt, operationController.listOperationsDashboard);

// ============================================
// API ENDPOINTS (HMAC Authentication)
// ============================================

// List and view (Read permission)
router.get('/', authenticate, requirePermission('read'), operationController.listOperations);
router.get('/:id', authenticate, requirePermission('read'), operationController.getOperationDetails);

// Initiate (Write permission - Maker role)
router.post('/', authenticate, requirePermission('write'), operationController.initiateOperation);
router.post('/mint', authenticate, requirePermission('write'), operationController.initiateMintOperation);
router.post('/burn', authenticate, requirePermission('write'), operationController.initiateBurnOperation);
router.post('/freeze', authenticate, requirePermission('write'), operationController.initiateFreezeOperation);
router.post('/unfreeze', authenticate, requirePermission('write'), operationController.initiateUnfreezeOperation);

// Direct Actions (Admin permission - Checker role)
router.post('/admin/burn', authenticate, requirePermission('admin'), operationController.directBurnOperation);
router.post('/admin/freeze', authenticate, requirePermission('admin'), operationController.directFreezeOperation);
router.post('/admin/unfreeze', authenticate, requirePermission('admin'), operationController.directUnfreezeOperation);

// Approve/Reject (Admin permission - Checker role)
router.post('/:id/approve', authenticate, requirePermission('admin'), operationController.approveOperation);
router.post('/:id/reject', authenticate, requirePermission('admin'), operationController.rejectOperation);

export default router;
