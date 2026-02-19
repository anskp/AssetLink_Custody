import * as custodyRepository from './custody.repository.js';
import * as auditService from '../audit/audit.service.js';
import { CustodyStatus, canTransitionTo } from '../../enums/custodyStatus.js';
import * as fireblocksService from '../fireblocks/fireblocks.client.js';
import { RWA_ORACLE, FIREBLOCKS_PROXY, UNIQUE_ASSET_TOKEN, UAT_IMPLEMENTATION_ADDRESS } from '../fireblocks/contracts.js';
import { ethers } from 'ethers';
import { ConflictError, NotFoundError, BadRequestError } from '../../errors/ApiError.js';
import logger from '../../utils/logger.js';
import webhookService from '../../utils/webhook.service.js';
import prisma from '../../config/db.js';

/**
 * Custody Service
 * Business logic for custody operations
 */

export const linkAsset = async (assetId, tenantId, createdBy, actor, context = {}, metadata = {}) => {
    // Check if asset already exists
    const existing = await custodyRepository.findByAssetId(assetId);
    if (existing) {
        throw ConflictError(`Asset ${assetId} is already in custody`);
    }

    // Generate publicContractAddress (alca_<chain>_<short-hash>)
    const chainCode = (metadata.blockchain || 'eth').toLowerCase();
    const shortHash = Math.random().toString(36).substring(2, 10);
    const publicContractAddress = `alca_${chainCode}_${shortHash}`;

    console.log('[DEBUG] linkAsset calling createCustodyRecord with:', {
        assetId,
        tenantId,
        createdBy,
        initialNav: metadata.initialNav,
        initialPor: metadata.initialPor
    });

    // Create custody record with two-level isolation (PENDING status - awaiting approval)
    const custodyRecord = await custodyRepository.createCustodyRecord(
        assetId,
        tenantId,
        createdBy,
        CustodyStatus.PENDING,
        publicContractAddress,
        {
            initialNav: metadata.initialNav,
            initialPor: metadata.initialPor
        }
    );

    // Save metadata if provided
    if (Object.keys(metadata).length > 0) {
        const assetRepository = (await import('../asset-linking/asset.repository.js')).default;
        await assetRepository.createAssetMetadata(custodyRecord.id, metadata);
    }

    // Log audit event
    await auditService.logAssetLinked(
        custodyRecord.id,
        assetId,
        actor,
        { ...context, tenantId, createdBy, metadata }
    );

    logger.info('Asset linked to custody, initializing Fireblocks environment...', {
        assetId,
        tenantId,
        createdBy,
        custodyRecordId: custodyRecord.id
    });

    // --- Fireblocks Setup (User preference: Setup early) ---
    try {
        const vaultName = `AssetLink_${tenantId}_${assetId}_${Date.now()}`;
        const vault = await fireblocksService.createVault(vaultName);
        const vaultId = vault.id;

        const wallet = await fireblocksService.createWallet(vaultId, 'ETH_TEST5');

        // Create VaultWallet in DB
        const vaultWalletRecord = await prisma.vaultWallet.create({
            data: {
                fireblocksId: vaultId,
                blockchain: 'ETH_TEST5',
                address: wallet.address,
                vaultType: 'CUSTODY',
                isActive: true
            }
        });

        // Activate ETH_TEST5 early
        try {
            await fireblocksService.createWallet(vaultId, 'ETH_TEST5');
            // Wallet already creates it, but let's be sure
        } catch (e) { }

        // Link the vault wallet to the custody record
        await custodyRepository.updateStatus(custodyRecord.id, CustodyStatus.PENDING, {
            vaultWalletId: vaultWalletRecord.id
        });

        logger.info('Fireblocks environment initialized for asset', {
            assetId,
            vaultId,
            address: wallet.address
        });

        // Short delay to let Fireblocks settle
        await new Promise(r => setTimeout(r, 2000));
    } catch (fbError) {
        logger.error('Failed to initialize Fireblocks environment during link', {
            assetId,
            error: fbError.message
        });
        // We still return the custody record, but it will lack a vaultWalletId until manually fixed
    }

    return custodyRecord;
};

/**
 * Get custody status with two-level isolation
 * @param {string} assetId - Asset identifier
 * @param {string} tenantId - Platform owner (required)
 * @param {string} endUserId - End user (optional, if provided filters to their assets only)
 */
export const getCustodyStatus = async (assetId, tenantId, endUserId = null) => {
    const custodyRecord = await custodyRepository.findByAssetId(assetId);
    if (!custodyRecord) {
        throw NotFoundError(`Asset ${assetId} not found in custody`);
    }

    // Two-level isolation check
    if (custodyRecord.tenantId !== tenantId) {
        throw NotFoundError(`Asset ${assetId} not found in custody`);
    }

    // If endUserId is provided, verify it matches (end user can only see their own)
    if (endUserId && custodyRecord.createdBy !== endUserId) {
        throw NotFoundError(`Asset ${assetId} not found in custody`);
    }

    return enrichCustodyRecord(custodyRecord);
};

/**
 * Get custody record by ID
 */
export const getCustodyRecordById = async (id) => {
    const custodyRecord = await custodyRepository.findById(id);
    if (!custodyRecord) {
        throw NotFoundError('Custody record not found');
    }

    return enrichCustodyRecord(custodyRecord);
};

/**
 * Validate state transition
 */
export const validateStateTransition = (currentStatus, newStatus) => {
    if (!canTransitionTo(currentStatus, newStatus)) {
        throw BadRequestError(
            `Invalid state transition from ${currentStatus} to ${newStatus}`
        );
    }
    return true;
};

/**
 * Approve custody link (PENDING -> LINKED)
 * @param {string} id - Custody record ID
 * @param {string} tenantId - Platform owner (for authorization)
 * @param {string} checkerId - User/API key approving
 * @param {object} context - Additional context
 */
export const approveCustodyLink = async (id, tenantId, checkerId, context = {}, metadata = {}) => {
    const custodyRecord = await custodyRepository.findById(id);
    if (!custodyRecord) {
        throw NotFoundError('Custody record not found');
    }

    // Verify tenant ownership
    if (custodyRecord.tenantId !== tenantId) {
        throw NotFoundError('Custody record not found');
    }

    // Verify status is PENDING
    if (custodyRecord.status !== CustodyStatus.PENDING) {
        throw BadRequestError(`Cannot approve custody record with status ${custodyRecord.status}`);
    }

    logger.info('Custody link approval initiated', {
        custodyRecordId: id,
        assetId: custodyRecord.assetId
    });

    // Final Step: Transition status to LINKED
    const updated = await custodyRepository.updateStatus(id, CustodyStatus.LINKED, {
        ...metadata,
        approvedBy: checkerId,
        approvedAt: new Date(),
        linkedAt: new Date()
    });

    // Log audit event
    await auditService.logEvent('CUSTODY_APPROVED', {
        assetId: custodyRecord.assetId,
        action: 'Asset link approved by checker. Orchestration deferred to minting.'
    }, {
        custodyRecordId: id,
        actor: checkerId,
        ...context
    });

    logger.info('Custody link approved', { id, assetId: custodyRecord.assetId });

    return enrichCustodyRecord(updated);
};

/**
 * Reject custody link (PENDING -> UNLINKED)
 * @param {string} id - Custody record ID
 * @param {string} tenantId - Platform owner (for authorization)
 * @param {string} reason - Rejection reason
 * @param {string} actor - User/API key rejecting
 * @param {object} context - Additional context
 */
export const rejectCustodyLink = async (id, tenantId, reason, actor, context = {}) => {
    const custodyRecord = await custodyRepository.findById(id);
    if (!custodyRecord) {
        throw NotFoundError('Custody record not found');
    }

    // Verify tenant ownership
    if (custodyRecord.tenantId !== tenantId) {
        throw NotFoundError('Custody record not found');
    }

    // Verify status is PENDING
    if (custodyRecord.status !== CustodyStatus.PENDING) {
        throw BadRequestError(`Cannot reject custody record with status ${custodyRecord.status}`);
    }

    // Update to UNLINKED status (or delete the record)
    const updated = await custodyRepository.updateStatus(id, CustodyStatus.UNLINKED, {
        rejectionReason: reason
    });

    // Log audit event
    await auditService.logEvent('CUSTODY_REJECTED', {
        assetId: custodyRecord.assetId,
        reason
    }, {
        custodyRecordId: id,
        actor,
        ...context
    });

    logger.info('Custody link rejected', {
        custodyRecordId: id,
        assetId: custodyRecord.assetId,
        tenantId,
        actor,
        reason
    });

    return enrichCustodyRecord(updated);
};

/**
 * Update custody status
 */
export const updateCustodyStatus = async (id, newStatus, metadata, actor, context = {}) => {
    const custodyRecord = await custodyRepository.findById(id);
    if (!custodyRecord) {
        throw NotFoundError('Custody record not found');
    }

    // Validate transition
    validateStateTransition(custodyRecord.status, newStatus);

    // Update status
    const updated = await custodyRepository.updateStatus(id, newStatus, metadata);

    // Log appropriate audit event
    if (newStatus === CustodyStatus.MINTED) {
        await auditService.logTokenMinted(id, metadata, actor, context);
    } else if (newStatus === CustodyStatus.WITHDRAWN) {
        await auditService.logTokenTransferred(id, metadata, actor, context);
    } else if (newStatus === CustodyStatus.BURNED) {
        await auditService.logTokenBurned(id, metadata, actor, context);
    } else if (newStatus === CustodyStatus.FROZEN) {
        await auditService.logEvent('TOKEN_FROZEN', metadata, { ...context, custodyRecordId: id, actor });
    }

    return enrichCustodyRecord(updated);
};

/**
 * Freeze token internally (MINTED -> FROZEN)
 */
export const freezeToken = async (id, actor, context = {}) => {
    const custodyRecord = await custodyRepository.findById(id);
    if (!custodyRecord) {
        throw new NotFoundError('Custody record not found');
    }

    if (custodyRecord.status !== CustodyStatus.MINTED) {
        throw new BadRequestError(`Cannot freeze token in status ${custodyRecord.status}. Must be MINTED.`);
    }

    const updated = await updateCustodyStatus(
        id,
        CustodyStatus.FROZEN,
        { frozenAt: new Date(), frozenBy: actor },
        actor,
        context
    );

    logger.info('Token frozen internally', { custodyRecordId: id, actor });

    return updated;
};

/**
 * Unfreeze token internally (FROZEN -> MINTED)
 */
export const unfreezeToken = async (id, actor, context = {}) => {
    const custodyRecord = await custodyRepository.findById(id);
    if (!custodyRecord) {
        throw new NotFoundError('Custody record not found');
    }

    if (custodyRecord.status !== CustodyStatus.FROZEN) {
        throw new BadRequestError(`Cannot unfreeze token in status ${custodyRecord.status}. Must be FROZEN.`);
    }

    const updated = await updateCustodyStatus(
        id,
        CustodyStatus.MINTED,
        { unfrozenAt: new Date(), unfrozenBy: actor },
        actor,
        context
    );

    logger.info('Token unfrozen internally', { custodyRecordId: id, actor });

    return updated;
};

/**
 * List custody records with two-level isolation
 * @param {object} filters - Filter options
 * @param {string} filters.tenantId - Platform owner (required)
 * @param {string} filters.endUserId - End user (optional, filters to their assets only)
 */
export const listCustodyRecords = async (filters = {}) => {
    const { tenantId, endUserId, ...otherFilters } = filters;

    // Build filter object with two-level isolation
    const queryFilters = { tenantId, ...otherFilters };

    // If endUserId is provided, filter by it (end user sees only their own)
    if (endUserId) {
        queryFilters.createdBy = endUserId;
    }
    // Otherwise, platform owner sees all records for their tenant

    const { records, total } = await custodyRepository.listCustodyRecords(queryFilters);

    return {
        records: records.map(enrichCustodyRecord),
        total,
        limit: filters.limit || 50,
        offset: filters.offset || 0
    };
};

/**
 * Get custody statistics
 */
export const getStatistics = async () => {
    return await custodyRepository.getStatistics();
};

/**
 * Enrich custody record with computed fields
 */
export const enrichCustodyRecord = (record) => {
    if (!record) return null;

    return {
        ...record,
        isActive: [CustodyStatus.LINKED, CustodyStatus.MINTED].includes(record.status),
        hasToken: record.tokenAddress && record.tokenId,
        daysInCustody: record.linkedAt
            ? Math.floor((Date.now() - new Date(record.linkedAt).getTime()) / (1000 * 60 * 60 * 24))
            : 0
    };
};

export default {
    linkAsset,
    getCustodyStatus,
    getCustodyRecordById,
    validateStateTransition,
    approveCustodyLink,
    rejectCustodyLink,
    updateCustodyStatus,
    freezeToken,
    unfreezeToken,
    listCustodyRecords,
    getStatistics,
    enrichCustodyRecord
};
