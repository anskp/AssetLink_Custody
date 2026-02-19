import crypto from 'crypto';
import * as operationRepository from './operation.repository.js';
import * as custodyRepository from '../custody/custody.repository.js';
import * as auditService from '../audit/audit.service.js';
import * as custodyService from '../custody/custody.service.js';
import * as fireblocksService from '../vault/fireblocks.service.js';
import * as mintService from '../token-lifecycle/mint.service.js';
import * as burnService from '../token-lifecycle/burn.service.js';
import * as assetService from '../asset-linking/asset.service.js';
import * as assetRepository from '../asset-linking/asset.repository.js';
import { OperationStatus, canTransitionTo } from '../../enums/operationStatus.js';
import { OperationType } from '../../enums/operationType.js';
import { CustodyStatus } from '../../enums/custodyStatus.js';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../errors/ApiError.js';
import logger from '../../utils/logger.js';
import prisma from '../../config/db.js';
import { mapToFireblocksAsset } from '../../utils/blockchain.js';
import webhookService from '../../utils/webhook.service.js';

/**
 * Operation Service
 * Manages operation lifecycle, maker-checker logic, and execution
 */

/**
 * Initiate a new operation (MAKER role)
 */
export const initiateOperation = async (data, actor, context = {}) => {
    const { custodyRecordId, operationType, payload } = data;

    // Check if custody record exists
    const custodyRecord = await custodyService.getCustodyRecordById(custodyRecordId);

    // Check for existing pending operations to prevent concurrent conflicts
    const pending = await operationRepository.findPendingByCustodyRecord(custodyRecordId);
    if (pending.length > 0) {
        throw BadRequestError(`Custody record ${custodyRecordId} already has pending operations`);
    }

    // Generate offchainTxHash (altx_<sha256_hash>)
    const salt = crypto.randomBytes(16).toString('hex');
    const offchainTxHash = 'altx_0x' + crypto.createHash('sha256')
        .update(`${custodyRecordId}${operationType}${Date.now()}${salt}`)
        .digest('hex');

    // Create operation in PENDING_CHECKER state
    const operation = await operationRepository.createOperation({
        operationType,
        custodyRecordId,
        payload,
        initiatedBy: actor,
        status: OperationStatus.PENDING_CHECKER,
        offchainTxHash
    });

    // Log audit event
    await auditService.logEvent('OPERATION_CREATED', {
        operationId: operation.id,
        operationType,
        initiatedBy: actor
    }, {
        custodyRecordId,
        operationId: operation.id,
        actor,
        ...context
    });

    logger.info('Operation initiated', { operationId: operation.id, initiatedBy: actor });

    return operation;
};

/**
 * Initiate a mint operation with validation (MAKER role)
 */
export const initiateMintOperation = async (data, actor, context = {}) => {
    const { assetId, tokenSymbol, tokenName, totalSupply, decimals, blockchainId, vaultWalletId } = data;

    // Validate required parameters
    const missingFields = [];
    if (!assetId) missingFields.push('assetId');
    if (!tokenSymbol) missingFields.push('tokenSymbol');
    if (!tokenName) missingFields.push('tokenName');
    if (totalSupply === undefined || totalSupply === null) missingFields.push('totalSupply');
    if (decimals === undefined || decimals === null) missingFields.push('decimals');
    if (!blockchainId) missingFields.push('blockchainId');

    if (missingFields.length > 0) {
        throw BadRequestError(`Missing required parameters: ${missingFields.join(', ')}`);
    }

    // Find custody record by assetId
    const custodyRecord = await custodyRepository.findByAssetId(assetId);
    if (!custodyRecord) {
        throw NotFoundError(`Asset ${assetId} not found in custody`);
    }

    // Validate asset is in LINKED status
    if (custodyRecord.status !== CustodyStatus.LINKED) {
        throw BadRequestError(`Asset must be in LINKED status. Current status: ${custodyRecord.status}`);
    }

    // Check for existing pending operations to prevent concurrent conflicts
    const pending = await operationRepository.findPendingByCustodyRecord(custodyRecord.id);
    if (pending.length > 0) {
        throw BadRequestError(`Asset ${assetId} already has pending operations`);
    }

    // Generate offchainTxHash (altx_<sha256_hash>)
    const salt = crypto.randomBytes(16).toString('hex');
    const offchainTxHash = 'altx_0x' + crypto.createHash('sha256')
        .update(`${custodyRecord.id}${OperationType.MINT}${Date.now()}${salt}`)
        .digest('hex');

    // Create operation in PENDING_CHECKER state
    const operation = await operationRepository.createOperation({
        operationType: OperationType.MINT,
        custodyRecordId: custodyRecord.id,
        vaultWalletId,
        payload: {
            assetId,
            tokenSymbol,
            tokenName,
            totalSupply,
            decimals,
            blockchainId
        },
        initiatedBy: actor,
        status: OperationStatus.PENDING_CHECKER,
        offchainTxHash
    });

    // Log audit event
    await auditService.logEvent('OPERATION_CREATED', {
        operationId: operation.id,
        operationType: OperationType.MINT,
        assetId,
        tokenSymbol,
        initiatedBy: actor
    }, {
        custodyRecordId: custodyRecord.id,
        operationId: operation.id,
        actor,
        ...context
    });

    logger.info('Mint operation initiated', {
        operationId: operation.id,
        assetId,
        tokenSymbol,
        initiatedBy: actor
    });

    return operation;
};

/**
 * Initiate a burn operation (MAKER role)
 */
export const initiateBurnOperation = async (data, actor, context = {}) => {
    const { assetId, amount } = data;

    const custodyRecord = await custodyRepository.findByAssetId(assetId);
    if (!custodyRecord) throw NotFoundError(`Asset ${assetId} not found`);
    if (custodyRecord.status !== CustodyStatus.MINTED) {
        throw BadRequestError(`Token must be in MINTED status to burn. Current: ${custodyRecord.status}`);
    }

    return await initiateOperation({
        operationType: OperationType.BURN,
        custodyRecordId: custodyRecord.id,
        payload: { assetId, amount }
    }, actor, context);
};

/**
 * Initiate a freeze operation (MAKER role)
 */
export const initiateFreezeOperation = async (data, actor, context = {}) => {
    const { assetId } = data;

    const custodyRecord = await custodyRepository.findByAssetId(assetId);
    if (!custodyRecord) throw NotFoundError(`Asset ${assetId} not found`);
    if (custodyRecord.status !== CustodyStatus.MINTED) {
        throw BadRequestError(`Token must be in MINTED status to freeze. Current: ${custodyRecord.status}`);
    }

    return await initiateOperation({
        operationType: OperationType.FREEZE,
        custodyRecordId: custodyRecord.id,
        payload: { assetId }
    }, actor, context);
};

/**
 * Initiate an unfreeze operation (MAKER role)
 */
export const initiateUnfreezeOperation = async (data, actor, context = {}) => {
    const { assetId } = data;

    const custodyRecord = await custodyRepository.findByAssetId(assetId);
    if (!custodyRecord) throw NotFoundError(`Asset ${assetId} not found`);
    if (custodyRecord.status !== CustodyStatus.FROZEN) {
        throw BadRequestError(`Token must be in FROZEN status to unfreeze. Current: ${custodyRecord.status}`);
    }

    return await initiateOperation({
        operationType: OperationType.UNFREEZE,
        custodyRecordId: custodyRecord.id,
        payload: { assetId }
    }, actor, context);
};

/**
 * Direct execution for Admins (Initiate + Approve in one step)
 */
export const executeDirectOperation = async (data, actor, context = {}) => {
    logger.info('Executing direct admin operation', { operationType: data.operationType, actor });

    // 1. Initiate
    let operation;
    const { operationType } = data;

    if (operationType === OperationType.MINT) {
        operation = await initiateMintOperation(data, actor, context);
    } else if (operationType === OperationType.BURN) {
        operation = await initiateBurnOperation(data, actor, context);
    } else if (operationType === OperationType.FREEZE) {
        operation = await initiateFreezeOperation(data, actor, context);
    } else if (operationType === OperationType.UNFREEZE) {
        operation = await initiateUnfreezeOperation(data, actor, context);
    } else {
        operation = await initiateOperation(data, actor, context);
    }

    // 2. Approve (using skip flag to bypass maker-checker since this is an admin target)
    return await approveOperation(operation.id, actor, context, true);
};

/**
 * Approve an operation (CHECKER role)
 */
export const approveOperation = async (operationId, actor, context = {}, skipMakerCheckerValidation = false) => {
    const operation = await operationRepository.findById(operationId);
    if (!operation) {
        throw NotFoundError(`Operation ${operationId} not found`);
    }

    // Basic Maker-Checker segregation (skip for dashboard operations)
    if (!skipMakerCheckerValidation && operation.initiatedBy === actor) {
        throw ForbiddenError('Maker cannot approve their own operation');
    }

    // Check if operation is already approved - if so, just execute it
    if (operation.status === OperationStatus.APPROVED) {
        logger.info('Operation already approved, executing directly', { operationId });
        return await executeOperation(operationId, actor, context);
    }

    // Check state transition
    if (!canTransitionTo(operation.status, OperationStatus.APPROVED)) {
        throw BadRequestError(`Cannot approve operation in status ${operation.status}`);
    }

    // Update status to APPROVED
    const updated = await operationRepository.updateStatus(operationId, OperationStatus.APPROVED, {
        approvedBy: actor
    });

    // Log audit event with checker identity
    await auditService.logEvent('OPERATION_APPROVED', {
        operationId,
        approvedBy: actor,
        checkerIdentity: actor,
        action: 'Operation approved by checker'
    }, {
        custodyRecordId: operation.custodyRecordId,
        operationId,
        actor,
        ...context
    });

    logger.info('Operation approved', { operationId, approvedBy: actor });

    // For Sprint 4 (Mocking), we auto-execute approved operations
    // NOTE: executeOperation is intentionaly NOT awaited here to prevent timeouts in the caller (COPYm)
    // The actual work happens in the background.
    executeOperation(operationId, actor, context).catch(err => {
        logger.error('Background operation execution failed', { operationId, error: err.message });
    });

    // Notify COPYm immediately about the approval
    webhookService.notifyStatusUpdate('operation.updated', updated);

    return updated;
};

/**
 * Reject an operation (CHECKER role)
 */
export const rejectOperation = async (operationId, actor, reason, context = {}) => {
    const operation = await operationRepository.findById(operationId);
    if (!operation) {
        throw NotFoundError(`Operation ${operationId} not found`);
    }

    if (!canTransitionTo(operation.status, OperationStatus.REJECTED)) {
        throw BadRequestError(`Cannot reject operation in status ${operation.status}`);
    }

    const updated = await operationRepository.updateStatus(operationId, OperationStatus.REJECTED, {
        rejectedBy: actor,
        rejectionReason: reason
    });

    // Log audit event
    await auditService.logEvent('OPERATION_REJECTED', {
        operationId,
        rejectedBy: actor,
        reason
    }, {
        custodyRecordId: operation.custodyRecordId,
        operationId,
        actor,
        ...context
    });

    logger.info('Operation rejected', { operationId, rejectedBy: actor });

    return updated;
};

/**
 * Execute an operation (Internal/System)
 * Briges the approval workflow to real Fireblocks execution
 */
export const executeOperation = async (operationId, actor, context = {}) => {
    const operation = await operationRepository.findById(operationId);
    if (!operation) throw NotFoundError('Operation not found');

    try {
        let fireblocksTaskId = null;
        let txHash = null;

        // Perform real Fireblocks execution
        if (operation.operationType === OperationType.MINT) {
            // Get the custody record to get the assetId
            const custodyRecord = await custodyService.getCustodyRecordById(operation.custodyRecordId);

            // Map the vault ID to a numeric ID for Fireblocks (in sandbox mode)
            // In a real system, this would be a proper mapping from UUID to Fireblocks numeric ID

            // First, try to get the vaultWalletId from the operation, then from the custody record if not available
            let vaultWalletId = operation.vaultWalletId || operation.payload.vaultWalletId;

            // If still not available, try to get it from the custody record
            if (!vaultWalletId && custodyRecord && custodyRecord.vaultWalletId) {
                vaultWalletId = custodyRecord.vaultWalletId;
            }

            // Default to '88' if no vault ID is found
            if (!vaultWalletId) {
                vaultWalletId = '88';
            }

            // Check if vaultWalletId is a UUID format, if so, we need to map it to the actual Fireblocks vault ID
            // For now, we'll assume that if it's not numeric, we should look it up in the database
            let numericVaultId;
            if (/^[0-9]+$/.test(vaultWalletId)) {
                // It's already a numeric ID
                numericVaultId = vaultWalletId;
            } else if (vaultWalletId === '88') {
                // Explicitly set to gas vault
                numericVaultId = '88';
            } else {
                // It's a UUID, need to look up the corresponding Fireblocks vault ID
                // First, try to find the vault wallet record in the database
                const vaultWalletRecord = await prisma.vaultWallet.findFirst({
                    where: {
                        id: vaultWalletId  // This is the database ID (UUID)
                    }
                });

                if (vaultWalletRecord) {
                    // Use the Fireblocks ID from the database record
                    numericVaultId = vaultWalletRecord.fireblocksId;
                } else {
                    // If not found, default to '88' but log a warning
                    logger.warn('Vault wallet record not found, defaulting to gas vault', {
                        vaultWalletId
                    });
                    numericVaultId = '88';
                }
            }

            const mintData = {
                assetId: operation.payload.assetId || custodyRecord?.assetId,
                tokenSymbol: operation.payload.tokenSymbol || operation.payload.symbol,
                tokenName: operation.payload.tokenName || operation.payload.name,
                totalSupply: operation.payload.totalSupply,
                decimals: operation.payload.decimals,
                blockchainId: mapToFireblocksAsset(operation.payload.blockchainId),
                vaultWalletId: numericVaultId
            };

            const result = await mintService.mintToken(mintData, 'SYSTEM', {
                operationId: operationId,
                custodyRecordId: operation.custodyRecordId
            });

            fireblocksTaskId = result.tokenLinkId;
        } else if (operation.operationType === OperationType.TRANSFER) {
            const { fromVaultId, toVaultId, assetId, amount } = operation.payload;
            fireblocksTaskId = await fireblocksService.transferTokens(
                fromVaultId || operation.vaultWalletId,
                toVaultId,
                assetId,
                amount
            );
        } else if (operation.operationType === OperationType.LINK_ASSET) {
            const { assetId, ...metadata } = operation.payload;

            // Create a new vault for this specific asset during asset link approval
            const vaultName = `${assetId.replace(/[^a-zA-Z0-9]/g, '_')}_VAULT_${Date.now()}`;
            const vaultResult = await fireblocksService.createUserVault(vaultName, operation.custodyRecordId);
            const fireblocksVaultId = vaultResult.vaultId;

            // Create a VaultWallet record in the database to track this vault
            const vaultWalletRecord = await prisma.vaultWallet.create({
                data: {
                    fireblocksId: fireblocksVaultId,
                    blockchain: 'ETH_TEST5', // Default blockchain, could be configurable
                    vaultType: 'CUSTODY',
                    isActive: true
                }
            });

            // 1. Update custody status from PENDING to LINKED
            await custodyService.updateCustodyStatus(
                operation.custodyRecordId,
                CustodyStatus.LINKED,
                {
                    linkedAt: new Date(),
                    vaultWalletId: vaultWalletRecord.id  // Store the database vault wallet ID, not the Fireblocks ID
                },
                'SYSTEM_GOVERNANCE',
                { operationId }
            );

            // 2. Create actual AssetMetadata
            await assetRepository.createAssetMetadata(
                operation.custodyRecordId,
                metadata
            );

            // Mark as EXECUTED immediately since no on-chain task exists for linking
            return await operationRepository.updateStatus(operationId, OperationStatus.EXECUTED, {
                executedAt: new Date()
            });
        } else if (operation.operationType === OperationType.BURN) {
            const { amount } = operation.payload;
            const result = await burnService.burnToken({
                custodyRecordId: operation.custodyRecordId,
                amount
            }, actor, context);

            // Return early - monitorBurnTransaction is handling the status update to EXECUTED/FAILED
            // We update status to EXECUTING here to signal submission
            const executingOp = await operationRepository.updateStatus(operationId, 'EXECUTING', {
                fireblocksTaskId: result.fireblocksTxId,
                fireblocksStatus: result.status || 'SUBMITTED'
            });

            logger.info('Burn operation submitted to Fireblocks and monitoring started', { operationId, fireblocksTxId: result.fireblocksTxId });
            return executingOp;
        } else if (operation.operationType === OperationType.FREEZE) {
            await custodyService.freezeToken(operation.custodyRecordId, actor, context);
            const updated = await operationRepository.updateStatus(operationId, OperationStatus.EXECUTED, {
                executedAt: new Date()
            });
            webhookService.notifyStatusUpdate('operation.updated', updated);
            return updated;
        } else if (operation.operationType === OperationType.UNFREEZE) {
            const updated = await custodyService.unfreezeToken(operation.custodyRecordId, actor, context);
            const opUpdated = await operationRepository.updateStatus(operationId, OperationStatus.EXECUTED, {
                executedAt: new Date()
            });
            webhookService.notifyStatusUpdate('operation.updated', opUpdated);
            return opUpdated;
        }

        // Update status to EXECUTED (or SUBMITTED/PENDING if we want to monitor)
        // For now, we'll mark as EXECUTED once the task is created, but in production,
        // we should wait for COMPLETED via webhook or polling.
        const updated = await operationRepository.updateStatus(operationId, OperationStatus.EXECUTED, {
            fireblocksTaskId,
            executedAt: new Date()
        });

        // Notify subscribers about execution
        webhookService.notifyStatusUpdate('operation.updated', updated);

        // Log audit event
        await auditService.logOperationExecuted(operationId, 'PENDING_ON_CHAIN', context);

        logger.info('Operation submitted to Fireblocks', { operationId, fireblocksTaskId });

        return updated;
    } catch (error) {
        console.error('🚨 [EXECUTION ERROR] Full Stack Trace:', error);
        logger.error('Fireblocks execution failed', { operationId, error: error.message, stack: error.stack });
        const errorMessage = error.message.includes('ENOENT') ? 'Fireblocks Secret Key Missing' : error.message;
        await auditService.logOperationFailed(operationId, { message: errorMessage, stack: error.stack }, context);
        const updated = await operationRepository.updateStatus(operationId, OperationStatus.FAILED, {
            failureReason: errorMessage
        });
        webhookService.notifyStatusUpdate('operation.updated', updated);
        throw error;
    }
};


/**
 * List operations
 */
export const listOperations = async (filters) => {
    return await operationRepository.listOperations(filters);
};

/**
 * Get operation details
 */
export const getOperationDetails = async (id) => {
    const operation = await operationRepository.findById(id);
    if (!operation) {
        throw NotFoundError(`Operation ${id} not found`);
    }
    return operation;
};

export default {
    initiateMintOperation,
    initiateBurnOperation,
    initiateFreezeOperation,
    initiateUnfreezeOperation,
    executeDirectOperation,
    approveOperation,
    rejectOperation,
    executeOperation,
    listOperations,
    getOperationDetails
};
