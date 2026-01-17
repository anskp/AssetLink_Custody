import prisma from '../../config/db.js';
import { CustodyStatus } from '../../enums/custodyStatus.js';
import { NotFoundError } from '../../errors/ApiError.js';
import custodyRepository from '../custody/custody.repository.js';

/**
 * Explorer Service
 * Public, read-only data aggregation for the Ledger Explorer
 */

/**
 * Get latest transactions (aggregated operations and linking events)
 */
export const getLatestTransactions = async (limit = 25) => {
    const operations = await prisma.custodyOperation.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
            custodyRecord: {
                include: {
                    assetMetadata: true,
                    vaultWallet: true
                }
            },
            vaultWallet: true
        }
    });

    return operations.map(op => {
        const assetName = op.custodyRecord?.assetMetadata?.assetName || 'Unknown Asset';
        const tokenSymbol = op.payload?.tokenSymbol || op.payload?.symbol;
        const displayName = tokenSymbol ? `${assetName} (${tokenSymbol})` : assetName;

        // Determine From/To based on operation type
        let fromVaultId, toVaultId;

        if (op.operationType === 'TRANSFER') {
            // For transfers: from investor vault to asset vault (purchase flow)
            fromVaultId = op.payload?.fromVaultId || op.payload?.sourceVaultId || 'Unknown';
            toVaultId = op.payload?.toVaultId || op.custodyRecord?.vaultWallet?.fireblocksId || 'Unknown';
        } else if (op.operationType === 'MINT') {
            // For minting: System mints to asset vault
            fromVaultId = 'System';
            toVaultId = op.vaultWallet?.fireblocksId || op.custodyRecord?.vaultWallet?.fireblocksId || 'Vault';
        } else {
            // Default fallback
            fromVaultId = op.payload?.fromVaultId || 'System';
            toVaultId = op.payload?.toVaultId || op.custodyRecord?.vaultWallet?.fireblocksId || 'Vault';
        }

        return {
            offchainTxHash: op.offchainTxHash,
            type: op.operationType,
            status: op.status,
            timestamp: op.executedAt || op.createdAt,
            asset: displayName,
            assetAddress: op.custodyRecord?.publicContractAddress,
            amount: op.payload?.amount || op.payload?.totalSupply || '0',
            fromVaultId,
            toVaultId,
            onchainTxHash: op.txHash
        };
    });
};

/**
 * Get asset by public contract address
 */
export const getAssetByAddress = async (address) => {
    const asset = await prisma.custodyRecord.findUnique({
        where: { publicContractAddress: address },
        include: {
            assetMetadata: true,
            vaultWallet: true,
            operations: {
                orderBy: { createdAt: 'desc' },
                take: 50
            }
        }
    });

    if (!asset) {
        throw NotFoundError(`Asset with address ${address} not found`);
    }

    // Get holders/ownership
    const holders = await prisma.ownership.findMany({
        where: { custodyRecordId: asset.id },
        orderBy: { quantity: 'desc' }
    });

    return {
        ...asset,
        holders
    };
};

/**
 * Get transaction by off-chain hash
 */
export const getTransactionByHash = async (hash) => {
    const operation = await prisma.custodyOperation.findUnique({
        where: { offchainTxHash: hash },
        include: {
            custodyRecord: {
                include: {
                    assetMetadata: true
                }
            },
            auditLogs: {
                orderBy: { timestamp: 'asc' }
            }
        }
    });

    if (!operation) {
        throw NotFoundError(`Transaction with hash ${hash} not found`);
    }

    return operation;
};

/**
 * Get address details (portfolio and history)
 */
export const getAddressDetails = async (ownerId) => {
    const ownerships = await prisma.ownership.findMany({
        where: { ownerId },
        include: {
            custodyRecord: {
                include: {
                    assetMetadata: true
                }
            }
        }
    });

    return ownerships;
};

/**
 * Search by hash or address
 */
export const search = async (query) => {
    if (query.startsWith('alca_')) {
        return { type: 'asset', data: await getAssetByAddress(query) };
    } else if (query.startsWith('altx_')) {
        return { type: 'transaction', data: await getTransactionByHash(query) };
    } else {
        // Try searching for ownerId/address
        const details = await getAddressDetails(query);
        if (details.length > 0) return { type: 'address', data: details };
    }

    throw new NotFoundError('No results found for your search');
};

/**
 * Get all assets for listing
 */
export const getAllAssets = async () => {
    const assets = await prisma.custodyRecord.findMany({
        where: {
            status: {
                in: [CustodyStatus.LINKED, CustodyStatus.MINTED]
            }
        },
        include: {
            assetMetadata: true,
            vaultWallet: true
        },
        orderBy: { createdAt: 'desc' }
    });

    return assets;
};

/**
 * Get global custody statistics (public)
 */
export const getStats = async () => {
    return await custodyRepository.getStatistics();
};

export default {
    getLatestTransactions,
    getAssetByAddress,
    getTransactionByHash,
    getAddressDetails,
    search,
    getStats,
    getAllAssets
};
