import * as operationService from './operation.service.js';
import { ValidationError } from '../../errors/ValidationError.js';

/**
 * Operation Controller
 * Handles HTTP requests for operation lifecycle
 */

/**
 * Initiate operation
 * POST /v1/operations
 */
export const initiateOperation = async (req, res, next) => {
    try {
        const { custodyRecordId, operationType, payload } = req.body;

        if (!custodyRecordId || !operationType) {
            throw new ValidationError('Custody Record ID and Operation Type are required');
        }

        const operation = await operationService.initiateOperation(
            { custodyRecordId, operationType, payload },
            req.auth?.publicKey || 'anonymous',
            { ipAddress: req.ip, userAgent: req.get('user-agent') }
        );

        res.status(201).json(operation);
    } catch (error) {
        next(error);
    }
};

/**
 * Initiate mint operation
 * POST /v1/operations/mint
 */
export const initiateMintOperation = async (req, res, next) => {
    try {
        const { assetId, tokenSymbol, tokenName, totalSupply, decimals, blockchainId, vaultWalletId } = req.body;

        const operation = await operationService.initiateMintOperation(
            { assetId, tokenSymbol, tokenName, totalSupply, decimals, blockchainId, vaultWalletId },
            req.auth?.publicKey || 'anonymous',
            { ipAddress: req.ip, userAgent: req.get('user-agent') }
        );

        res.status(201).json(operation);
    } catch (error) {
        next(error);
    }
};

/**
 * Initiate burn operation
 * POST /v1/operations/burn
 */
export const initiateBurnOperation = async (req, res, next) => {
    try {
        const { assetId, amount } = req.body;
        const operation = await operationService.initiateBurnOperation(
            { assetId, amount },
            req.auth?.publicKey || 'anonymous',
            { ipAddress: req.ip, userAgent: req.get('user-agent') }
        );
        res.status(201).json(operation);
    } catch (error) {
        next(error);
    }
};

/**
 * Initiate freeze operation
 * POST /v1/operations/freeze
 */
export const initiateFreezeOperation = async (req, res, next) => {
    try {
        const { assetId } = req.body;
        const operation = await operationService.initiateFreezeOperation(
            { assetId },
            req.auth?.publicKey || 'anonymous',
            { ipAddress: req.ip, userAgent: req.get('user-agent') }
        );
        res.status(201).json(operation);
    } catch (error) {
        next(error);
    }
};

/**
 * Direct Burn (Admin)
 * POST /v1/operations/admin/burn
 */
export const directBurnOperation = async (req, res, next) => {
    try {
        const { assetId, amount } = req.body;
        const result = await operationService.executeDirectOperation(
            { assetId, amount, operationType: 'BURN' },
            req.auth?.publicKey || 'admin',
            { ipAddress: req.ip, userAgent: req.get('user-agent') }
        );
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
};

/**
 * Direct Freeze (Admin)
 * POST /v1/operations/admin/freeze
 */
export const directFreezeOperation = async (req, res, next) => {
    try {
        const { assetId } = req.body;
        const result = await operationService.executeDirectOperation(
            { assetId, operationType: 'FREEZE' },
            req.auth?.publicKey || 'admin',
            { ipAddress: req.ip, userAgent: req.get('user-agent') }
        );
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
};

/**
 * Direct Unfreeze (Admin)
 * POST /v1/operations/admin/unfreeze
 */
export const directUnfreezeOperation = async (req, res, next) => {
    try {
        const { assetId } = req.body;
        const result = await operationService.executeDirectOperation(
            { assetId, operationType: 'UNFREEZE' },
            req.auth?.publicKey || 'admin',
            { ipAddress: req.ip, userAgent: req.get('user-agent') }
        );
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
};

/**
 * Initiate unfreeze operation
 * POST /v1/operations/unfreeze
 */
export const initiateUnfreezeOperation = async (req, res, next) => {
    try {
        const { assetId } = req.body;
        const operation = await operationService.initiateUnfreezeOperation(
            { assetId },
            req.auth?.publicKey || 'anonymous',
            { ipAddress: req.ip, userAgent: req.get('user-agent') }
        );
        res.status(201).json(operation);
    } catch (error) {
        next(error);
    }
};

/**
 * Approve operation
 * POST /v1/operations/:id/approve
 */
export const approveOperation = async (req, res, next) => {
    try {
        const { id } = req.params;

        const result = await operationService.approveOperation(
            id,
            req.auth?.publicKey || 'anonymous',
            { ipAddress: req.ip, userAgent: req.get('user-agent') }
        );

        res.json(result);
    } catch (error) {
        next(error);
    }
};

/**
 * Reject operation
 * POST /v1/operations/:id/reject
 */
export const rejectOperation = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const result = await operationService.rejectOperation(
            id,
            req.auth?.publicKey || 'anonymous',
            reason,
            { ipAddress: req.ip, userAgent: req.get('user-agent') }
        );

        res.json(result);
    } catch (error) {
        next(error);
    }
};

/**
 * List operations
 * GET /v1/operations
 */
export const listOperations = async (req, res, next) => {
    try {
        const { status, operationType, custodyRecordId, limit, offset } = req.query;

        const result = await operationService.listOperations({
            status,
            operationType,
            custodyRecordId,
            limit: limit ? parseInt(limit) : 50,
            offset: offset ? parseInt(offset) : 0
        });

        res.json(result);
    } catch (error) {
        next(error);
    }
};

/**
 * Get operation details
 * GET /v1/operations/:id
 */
export const getOperationDetails = async (req, res, next) => {
    try {
        const { id } = req.params;
        const operation = await operationService.getOperationDetails(id); // Need to implement in service
        res.json(operation);
    } catch (error) {
        next(error);
    }
};



/**
 * DASHBOARD ENDPOINTS (JWT Authentication)
 */

/**
 * Initiate mint operation from dashboard
 * POST /v1/operations/dashboard/mint
 */
export const initiateMintOperationDashboard = async (req, res, next) => {
    try {
        const { assetId, tokenSymbol, tokenName, totalSupply, decimals, blockchain, vaultWalletId } = req.body;
        const userId = req.user.sub;

        const operation = await operationService.initiateMintOperation(
            {
                assetId,
                tokenSymbol,
                tokenName,
                totalSupply,
                decimals,
                blockchainId: blockchain || 'ETH_TEST5',
                vaultWalletId
            },
            `dashboard_user_${userId}`,
            { ipAddress: req.ip, userAgent: req.get('user-agent') }
        );

        res.status(201).json(operation);
    } catch (error) {
        next(error);
    }
};

/**
 * Initiate burn operation from dashboard
 * POST /v1/operations/dashboard/burn
 */
export const initiateBurnOperationDashboard = async (req, res, next) => {
    try {
        const { assetId, amount } = req.body;
        const userId = req.user.sub;
        const operation = await operationService.initiateBurnOperation(
            { assetId, amount },
            `dashboard_user_${userId}`,
            { ipAddress: req.ip, userAgent: req.get('user-agent') }
        );
        res.status(201).json(operation);
    } catch (error) {
        next(error);
    }
};

/**
 * Initiate freeze operation from dashboard
 * POST /v1/operations/dashboard/freeze
 */
export const initiateFreezeOperationDashboard = async (req, res, next) => {
    try {
        const { assetId } = req.body;
        const userId = req.user.sub;
        const operation = await operationService.initiateFreezeOperation(
            { assetId },
            `dashboard_user_${userId}`,
            { ipAddress: req.ip, userAgent: req.get('user-agent') }
        );
        res.status(201).json(operation);
    } catch (error) {
        next(error);
    }
};

/**
 * List operations from dashboard
 * GET /v1/operations/dashboard
 */
export const listOperationsDashboard = async (req, res, next) => {
    try {
        const { status, operationType, limit, offset } = req.query;
        const userId = req.user.sub;

        const result = await operationService.listOperations({
            tenantId: userId, // Filter by user's tenant ID
            status,
            operationType,
            limit: limit ? parseInt(limit) : 50,
            offset: offset ? parseInt(offset) : 0
        });

        res.json(result);
    } catch (error) {
        next(error);
    }
};

/**
 * Approve operation from dashboard
 * POST /v1/operations/dashboard/:id/approve
 */
export const approveOperationDashboard = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.sub;

        const result = await operationService.approveOperation(
            id,
            `dashboard_user_${userId}`,
            { ipAddress: req.ip, userAgent: req.get('user-agent') },
            true // Skip maker-checker validation for dashboard
        );

        res.json(result);
    } catch (error) {
        next(error);
    }
};

/**
 * Reject operation from dashboard
 * POST /v1/operations/dashboard/:id/reject
 */
export const rejectOperationDashboard = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const userId = req.user.sub;

        const result = await operationService.rejectOperation(
            id,
            `dashboard_user_${userId}`,
            reason || 'No reason provided',
            { ipAddress: req.ip, userAgent: req.get('user-agent') }
        );

        res.json(result);
    } catch (error) {
        next(error);
    }
};

/**
 * Initiate unfreeze operation from dashboard
 * POST /v1/operations/dashboard/unfreeze
 */
export const initiateUnfreezeOperationDashboard = async (req, res, next) => {
    try {
        const { assetId } = req.body;
        const userId = req.user.sub;
        const operation = await operationService.initiateUnfreezeOperation(
            { assetId },
            `dashboard_user_${userId}`,
            { ipAddress: req.ip, userAgent: req.get('user-agent') }
        );
        res.status(201).json(operation);
    } catch (error) {
        next(error);
    }
};

export default {
    initiateOperation,
    initiateMintOperation,
    initiateBurnOperation,
    initiateFreezeOperation,
    initiateUnfreezeOperation,
    directBurnOperation,
    directFreezeOperation,
    directUnfreezeOperation,
    approveOperation,
    rejectOperation,
    listOperations,
    getOperationDetails,
    initiateMintOperationDashboard,
    initiateBurnOperationDashboard,
    initiateFreezeOperationDashboard,
    initiateUnfreezeOperationDashboard,
    listOperationsDashboard,
    approveOperationDashboard,
    rejectOperationDashboard
};
