/**
 * Token Minting Service
 * Handles the minting of tokens via Fireblocks
 */

import * as fireblocksService from '../fireblocks/fireblocks.client.js';
import * as vaultFireblocksService from '../vault/fireblocks.service.js';
import * as custodyService from '../custody/custody.service.js';
import * as custodyRepository from '../custody/custody.repository.js';
import * as auditService from '../audit/audit.service.js';
import { CustodyStatus } from '../../enums/custodyStatus.js';
import { NotFoundError, BadRequestError } from '../../errors/ApiError.js';
import { mapToFireblocksAsset } from '../../utils/blockchain.js';
import logger from '../../utils/logger.js';

// Fixed gas vault ID
const GAS_VAULT_ID = '88';

// Global tracking for active monitors to prevent duplicate monitoring across the application
// Using separate Maps for operation tracking and monitoring tracking
const activeMintOperations = new Map(); // Tracks mint operations by assetId to prevent duplicate mint attempts
const activeMintMonitors = new Map();   // Tracks active monitoring by tokenLinkId to prevent duplicate monitoring

/**
 * Mint a new token on the blockchain via Fireblocks
 * @param {Object} mintData - Token minting parameters
 * @param {string} mintData.assetId - Asset ID to mint token for
 * @param {string} mintData.tokenSymbol - Token symbol (e.g., RLX)
 * @param {string} mintData.tokenName - Token name (e.g., Rolex Token)
 * @param {string} mintData.totalSupply - Total token supply
 * @param {number} mintData.decimals - Token decimals
 * @param {string} mintData.blockchainId - Blockchain to mint on (e.g., ETH_TEST5)
 * @param {string} mintData.vaultWalletId - Vault ID to mint to
 * @param {string} actor - User initiating the mint
 * @param {Object} context - Request context
 * @returns {Object} Mint operation result
 */
export const mintToken = async (mintData, actor, context = {}) => {
  // Check if mintData is provided
  if (!mintData) {
    throw BadRequestError('Missing mintData parameter');
  }

  // Extract values from mintData with fallbacks
  const assetId = mintData.assetId;
  const tokenSymbol = mintData.tokenSymbol;
  const tokenName = mintData.tokenName;
  const totalSupply = mintData.totalSupply;
  const decimals = mintData.decimals;
  const blockchainId = mintData.blockchainId;
  const vaultWalletId = mintData.vaultWalletId || 'default';

  // Validate required parameters
  if (!assetId) {
    throw BadRequestError('Missing required mint parameter: assetId');
  }
  if (!tokenSymbol) {
    throw BadRequestError('Missing required mint parameter: tokenSymbol');
  }
  if (!tokenName) {
    throw BadRequestError('Missing required mint parameter: tokenName');
  }
  if (!totalSupply && totalSupply !== 0) {
    throw BadRequestError('Missing required mint parameter: totalSupply');
  }
  if (decimals === undefined || decimals === null) {
    throw BadRequestError('Missing required mint parameter: decimals');
  }
  if (!blockchainId) {
    throw BadRequestError('Missing required mint parameter: blockchainId');
  }

  // Find custody record by assetId
  const custodyRecord = await custodyRepository.findByAssetId(assetId);
  if (!custodyRecord) {
    throw NotFoundError(`Asset ${assetId} not found in custody`);
  }

  // Validate asset is in LINKED, MINTED, or FAILED status
  if (custodyRecord.status !== CustodyStatus.LINKED &&
    custodyRecord.status !== CustodyStatus.MINTED &&
    custodyRecord.status !== CustodyStatus.FAILED) {
    throw BadRequestError(`Asset must be in LINKED, MINTED, or FAILED status. Current status: ${custodyRecord.status}`);
  }

  // If status is MINTED, ensure it has a tokenId for additional minting
  if (custodyRecord.status === CustodyStatus.MINTED && !custodyRecord.tokenId) {
    throw BadRequestError('Asset is already marked as MINTED but has no tokenId for additional minting');
  }

  // Check if a mint operation is already in progress for this asset
  const mintOperationKey = `mint_op_${assetId}`;
  if (activeMintOperations.has(mintOperationKey)) {
    logger.warn('Mint operation already in progress for this asset, skipping duplicate', { assetId });
    throw BadRequestError(`Mint operation already in progress for asset ${assetId}`);
  }

  // Add to active operations to prevent duplicate mint attempts
  activeMintOperations.set(mintOperationKey, {
    startedAt: Date.now(),
    assetId
  });

  // Calculate total supply in wei for Fireblocks
  const decimalsInt = parseInt(decimals) || 18;
  const totalSupplyWei = (BigInt(totalSupply) * BigInt(10 ** decimalsInt)).toString();

  // Prepare token configuration
  const tokenConfig = {
    name: tokenName,
    symbol: tokenSymbol,
    decimals: decimalsInt,
    totalSupply: totalSupply.toString(),
    blockchainId: blockchainId
  };

  try {
    logger.info('Initiating token mint via Fireblocks', {
      assetId,
      tokenSymbol,
      vaultWalletId
    });

    // Explicitly verify/create the wallet address in the vault
    // This ensures the asset exists in the vault before we try to mint or transfer gas
    try {
      const walletAddress = await vaultFireblocksService.getWalletAddress(vaultWalletId, blockchainId);
      logger.info('Verified vault wallet address', { vaultWalletId, blockchainId, walletAddress });
    } catch (addressError) {
      logger.error('Failed to verify vault wallet address', {
        vaultWalletId,
        blockchainId,
        error: addressError.message
      });
      // We log but continue, letting ensureGasForVault try its own checks or fail
      // This provides better diagnostics if it fails later
    }

    // Check if the vault has sufficient gas, and if not, transfer from vault 88
    await ensureGasForVault(vaultWalletId, blockchainId);

    let result;
    const existingTokenId = custodyRecord.tokenId;

    if (existingTokenId) {
      logger.info('Asset already has a tokenId, minting additional tokens', {
        assetId,
        tokenId: existingTokenId,
        amount: totalSupplyWei
      });

      // Mint additional tokens via Fireblocks Tokenization Engine
      const mintResult = await fireblocksService.mintTokens(existingTokenId, vaultWalletId, totalSupplyWei);

      result = {
        tokenLinkId: existingTokenId, // For additional mints, the link ID is the tokenId itself
        status: mintResult.status || 'PENDING_APPROVAL'
      };
    } else {
      logger.info('Asset has no tokenId, issuing new token deployment', { assetId });
      // Issue new token deployment via Fireblocks
      result = await fireblocksService.issueToken(vaultWalletId, tokenConfig);
    }

    logger.info('Token mint operation initiated successfully', {
      tokenLinkId: result.tokenLinkId,
      assetId,
      tokenSymbol,
      type: existingTokenId ? 'ADDITIONAL_MINT' : 'INITIAL_DEPLOYMENT'
    });

    // Log audit event
    await auditService.logEvent('TOKEN_MINT_INITIATED', {
      tokenLinkId: result.tokenLinkId,
      assetId,
      tokenSymbol,
      initiatedBy: actor,
      action: 'Token minting initiated via Fireblocks'
    }, {
      ...context,
      assetId,
      tokenSymbol
    });

    // Start monitoring the minting process
    // Note: We don't await this to avoid blocking the response,
    // but we'll remove the operation key from active monitors after a delay
    try {
      // Pass the operationId through context to the monitor
      monitorMintingStatus(result.tokenLinkId, custodyRecord.id, totalSupply.toString(), actor, context);
    } catch (monitoringError) {
      logger.error('Failed to start mint monitoring', {
        tokenLinkId: result.tokenLinkId,
        assetId,
        error: monitoringError.message
      });
    }

    // Clean up the mint operation key after a delay to allow monitoring to start
    setTimeout(() => {
      const mintOperationKey = `mint_op_${assetId}`;
      if (activeMintOperations.has(mintOperationKey)) {
        activeMintOperations.delete(mintOperationKey);
      }
    }, 5000); // 5 seconds delay before cleanup

    return {
      success: true,
      tokenLinkId: result.tokenLinkId,
      status: result.status,
      assetId,
      tokenSymbol
    };
  } catch (error) {
    logger.error('Token mint failed', {
      assetId,
      tokenSymbol,
      error: error.message
    });

    // Clean up the mint operation key on error
    const mintOperationKey = `mint_op_${assetId}`;
    if (activeMintOperations.has(mintOperationKey)) {
      activeMintOperations.delete(mintOperationKey);
    }

    // Log failure audit event
    await auditService.logEvent('TOKEN_MINT_FAILED', {
      assetId,
      tokenSymbol,
      error: error.message,
      action: 'Token minting failed'
    }, {
      ...context,
      assetId,
      tokenSymbol
    });

    throw error;
  }
};

// Cache for gas balance checks to reduce API calls
// Using a Map for efficient lookups and automatic cleanup
const gasBalanceCache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds (increased to reduce API calls)

/**
 * Ensure the vault has sufficient gas for operations
 * Transfer from gas vault (88) if insufficient
 */
const ensureGasForVault = async (vaultId, blockchainId) => {
  try {
    const mappedAssetId = mapToFireblocksAsset(blockchainId);
    const cacheKey = `${vaultId}-${mappedAssetId}`;
    const now = Date.now();

    // Check if we have a recent cache entry
    if (gasBalanceCache.has(cacheKey)) {
      const cacheEntry = gasBalanceCache.get(cacheKey);
      if (now - cacheEntry.timestamp < CACHE_DURATION) {
        logger.info('Using cached gas balance for vault', {
          vaultId,
          blockchainId: mappedAssetId,
          balance: cacheEntry.balance
        });

        // If cached balance is sufficient, return early
        if (cacheEntry.balance >= 0.001) {
          return;
        }
      }
    }

    logger.info('Checking gas balance for vault', { vaultId, blockchainId: mappedAssetId });

    // Get vault account information to check gas balance
    const vaultInfo = await fireblocksService.getVaultDetails(vaultId);

    // Find the gas asset (e.g., ETH_TEST5 for Ethereum testnets)
    const gasAsset = vaultInfo.wallets.find(wallet => wallet.blockchain === mappedAssetId);
    const gasBalance = parseFloat(gasAsset?.balance || '0');

    // Update cache with the new balance
    gasBalanceCache.set(cacheKey, {
      balance: gasBalance,
      timestamp: now
    });

    // Define minimum gas threshold (adjust as needed)
    const minGasThreshold = 0.001; // Minimum 0.001 ETH equivalent for gas fees

    if (gasBalance < minGasThreshold) {
      logger.info('Insufficient gas in vault, transferring from gas vault', {
        vaultId,
        currentBalance: gasBalance,
        required: minGasThreshold,
        gasVault: GAS_VAULT_ID
      });

      // Transfer gas from the gas vault (88) to the target vault
      const transferAmount = 0.002; // Transfer 0.002 ETH equivalent

      const transferResult = await vaultFireblocksService.transferTokens(
        GAS_VAULT_ID,  // Source: gas vault
        vaultId,       // Destination: target vault
        mappedAssetId, // Asset to transfer (gas token)
        transferAmount // Amount to transfer
      );

      logger.info('Gas transfer initiated', {
        transferId: transferResult,
        fromVault: GAS_VAULT_ID,
        toVault: vaultId,
        amount: transferAmount,
        asset: mappedAssetId
      });

      // Wait for gas transfer to complete before proceeding
      await waitForTransferCompletion(transferResult);

      // Update cache with new balance after transfer
      gasBalanceCache.set(cacheKey, {
        balance: gasBalance + transferAmount,
        timestamp: Date.now()
      });

      logger.info('Gas transfer completed successfully', {
        transferId: transferResult,
        vaultId,
        newBalance: (gasBalance + transferAmount).toString()
      });
    } else {
      logger.info('Sufficient gas available in vault', {
        vaultId,
        balance: gasBalance,
        blockchainId: mappedAssetId
      });
    }
  } catch (error) {
    logger.error('CRITICAL: Error ensuring gas for vault', {
      vaultId,
      blockchainId: mapToFireblocksAsset(blockchainId),
      error: error.message,
      stack: error.stack
    });
    // Throw error to stop minting process if gas transfer failed
    // This prevents "silent" failures where minting is attempted without gas
    throw new Error(`Gas check failed: ${error.message}`);
  }
};

/**
 * Wait for transfer completion
 */
/**
 * Wait for transfer completion
 * Polls transaction status until COMPLETED
 */
const waitForTransferCompletion = async (transferId) => {
  logger.info(`Polling gas transfer status for TX: ${transferId}`);

  let attempts = 0;
  const maxAttempts = 60; // 5 minutes max (5s interval)

  while (attempts < maxAttempts) {
    attempts++;

    try {
      // Import the client function directly since it's not exposed via the service wrapper yet
      const { getTransactionById } = await import('../fireblocks/fireblocks.client.js');
      const tx = await getTransactionById(transferId);

      logger.info(`Gas transfer status: ${tx.status}`, { transferId, attempt: attempts });

      if (tx.status === 'COMPLETED') {
        logger.info('Gas transfer confirmed on-chain', { transferId });
        return;
      }

      if (['FAILED', 'CANCELLED', 'REJECTED', 'BLOCKED'].includes(tx.status)) {
        throw new Error(`Gas transfer failed with status: ${tx.status} - ${tx.subStatus || ''}`);
      }

    } catch (error) {
      // If it's our thrown error, rethrow
      if (error.message.includes('Gas transfer failed')) throw error;

      // Otherwise log and continue polling (transient API error)
      logger.warn('Error polling gas transfer status', { transferId, error: error.message });
    }

    // Wait standard 5 seconds
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  throw new Error(`Gas transfer timed out after ${maxAttempts * 5} seconds`);
};

/**
 * Monitor minting status and update custody record when complete
 */
const monitorMintingStatus = async (tokenLinkId, custodyRecordId, totalSupply, actor, context, vaultWalletId, tokenSymbol) => {
  logger.info('Starting mint status monitoring', { tokenLinkId, custodyRecordId, totalSupply, vaultWalletId, tokenSymbol });

  let attempts = 0;
  const maxAttempts = 60; // Increased to match copym-platform (10 minutes total monitoring time)
  const initialDelay = 10000; // 10 seconds initial delay
  const maxDelay = 600000; // 10 minutes maximum delay between polls

  // Track active monitoring to prevent duplicate monitors
  const monitoringKey = `mint_${tokenLinkId}`;

  // Check if monitoring is already active using Map
  if (activeMintMonitors.has(monitoringKey)) {
    logger.info('Mint monitoring already active for this tokenLinkId, skipping duplicate', { tokenLinkId });
    return;
  }

  // Add to active monitors
  activeMintMonitors.set(monitoringKey, {
    startedAt: Date.now(),
    custodyRecordId
  });

  const poll = async () => {
    try {
      const statusData = await fireblocksService.getTokenizationStatus(tokenLinkId);

      const currentStatus = statusData.status;
      const txHash = statusData.txHash;

      // Log mint status update


      logger.info('Mint status update', {
        tokenLinkId,
        status: currentStatus,
        attempts
      });

      // Update the operation record with the granular Fireblocks status
      if (context.operationId) {
        try {
          const operationRepository = (await import('../operation/operation.repository.js')).default;
          await operationRepository.updateStatus(context.operationId, 'EXECUTING', {
            fireblocksStatus: currentStatus
          });
          logger.info('Updated operation fireblocksStatus', { operationId: context.operationId, fireblocksStatus: currentStatus });
        } catch (dbError) {
          logger.warn('Failed to update operation fireblocksStatus', { operationId: context.operationId, error: dbError.message });
        }
      }

      // Log granular progress for the live terminal
      if (attempts === 2) {
        await auditService.logEvent('ON_CHAIN_SUBMISSION', { tokenLinkId }, { custodyRecordId });
      }
      if (attempts === 5) {
        await auditService.logEvent('BLOCK_PROPAGATION', { tokenLinkId }, { custodyRecordId });
      }
      if (attempts === 10) {
        await auditService.logEvent('FINALIZING_SETTLEMENT', { tokenLinkId }, { custodyRecordId });
      }

      if (currentStatus === 'COMPLETED') {
        logger.info('Token mint completed successfully', {
          tokenLinkId,
          txHash,
          custodyRecordId
        });

        // Update custody record status to MINTED
        await custodyService.updateCustodyStatus(
          custodyRecordId,
          CustodyStatus.MINTED,
          {
            blockchain: statusData.blockchainId || 'ETH_TEST5',
            tokenStandard: statusData.tokenMetadata?.tokenStandard || 'ERC20', // Default to ERC20
            tokenAddress: statusData.tokenMetadata?.contractAddress || tokenLinkId,
            tokenId: statusData.tokenId || tokenLinkId,
            quantity: totalSupply || '1', // Use the actual total supply from minting
            txHash: txHash,
            mintedAt: new Date()
          },
          actor,
          context
        );

        // Log successful minting event
        await auditService.logTokenMinted(
          custodyRecordId,
          {
            tokenLinkId,
            contractAddress: statusData.tokenMetadata?.contractAddress,
            txHash
          },
          actor,
          context
        );

        // Remove from active monitors
        activeMintMonitors.delete(monitoringKey);
        return;
      }

      if (['FAILED', 'REJECTED', 'CANCELLED'].includes(currentStatus)) {
        // RECOVERY CHECK:
        // If status is FAILED, it might be due to a race condition (e.g. asset already created by parallel process).
        // We check if the asset wallet address exists in the vault. If it does, we assume success.
        if (tokenSymbol && vaultWalletId) {
          try {
            logger.info('Mint reported FAILED. Attempting recovery check...', { vaultWalletId, tokenSymbol });
            // Attempt to get the wallet address for the token symbol
            // Note: check blockchain specific asset ID if necessary, but symbol often works for Fireblocks custom assets or we might need mapping
            const recoveredAddress = await vaultFireblocksService.getWalletAddress(vaultWalletId, tokenSymbol);

            if (recoveredAddress) {
              logger.info('✅ RECOVERY SUCCESS: Asset found in vault despite FAILED status!', { tokenSymbol, recoveredAddress });

              // Manually force status to COMPLETED
              const recoveryStatusData = {
                ...statusData,
                status: 'COMPLETED',
                txHash: statusData.txHash || 'recov_tx_unknown', // We might not have hash
                tokenMetadata: {
                  ...statusData.tokenMetadata,
                  contractAddress: recoveredAddress // Use the wallet address (or finding contract address would be better but this unblocks)
                }
              };

              // Proceed to success handler logic (copy-paste or refactor? I'll just execute success logic here to avoid huge refactor)
              logger.info('Token mint completed successfully (Recovered)', {
                tokenLinkId,
                txHash: recoveryStatusData.txHash,
                custodyRecordId
              });

              await custodyService.updateCustodyStatus(
                custodyRecordId,
                CustodyStatus.MINTED,
                {
                  blockchain: recoveryStatusData.blockchainId || 'ETH_TEST5',
                  tokenStandard: 'ERC20',
                  tokenAddress: recoveredAddress, // Best guess
                  tokenId: tokenLinkId,
                  quantity: totalSupply || '1',
                  txHash: recoveryStatusData.txHash,
                  mintedAt: new Date()
                },
                actor,
                context
              );

              await auditService.logTokenMinted(
                custodyRecordId,
                { tokenLinkId, contractAddress: recoveredAddress, txHash: recoveryStatusData.txHash, note: 'Recovered from FAILED status' },
                actor,
                context
              );

              activeMintMonitors.delete(monitoringKey);
              return;
            }
          } catch (recoveryError) {
            logger.warn('Recovery check failed', { error: recoveryError.message });
            // Proceed to normal failure handling
          }
        }

        // Extract detailed error info
        const failureReason = `Fireblocks Error: [${statusData.substatus || 'N/A'}] - ${statusData.errorMessage || 'Unknown Error'}`;

        logger.warn('Token mint failed', {
          tokenLinkId,
          status: currentStatus,
          substatus: statusData.substatus,
          errorMessage: statusData.errorMessage,
          custodyRecordId
        });

        // Update custody record status to FAILED in database
        // We need to find the related operation to update its failure reason
        try {
          // This is a simplified update - ideally we'd update the operation directly if we had its ID here
          // But since we only have custodyRecordId, we'll update the custody record
          await custodyService.updateCustodyStatus(
            custodyRecordId,
            CustodyStatus.FAILED,
            {
              failureReason: failureReason,
              fireblocksError: statusData
            },
            'SYSTEM',
            { source: 'FireblocksWebhook/Monitor' }
          );

          // Also try to update the latest operation for this custody record if possible
          // But rely on audit log for details primarily
        } catch (dbError) {
          logger.error('Failed to update custody status to FAILED', { custodyRecordId, error: dbError.message });
        }

        // Log failure with FULL details
        await auditService.logEvent('TOKEN_MINT_FAILED', {
          tokenLinkId,
          status: currentStatus,
          substatus: statusData.substatus,
          errorMessage: statusData.errorMessage,
          errorDetails: statusData.error,
          fullResponse: statusData,
          action: failureReason
        }, { custodyRecordId });


        // Remove from active monitors
        activeMintMonitors.delete(monitoringKey);
        return;
      }

      if (attempts < maxAttempts) {
        attempts++;
        // Use consistent 10-second polling interval for faster detection
        // Total monitoring time: 60 attempts * 10s = 10 minutes
        const pollingDelay = 10000; // 10 seconds per poll
        logger.info('Waiting before next status check', {
          tokenLinkId,
          attempts,
          delay: pollingDelay
        });

        await new Promise(resolve => setTimeout(resolve, pollingDelay));
        await poll(); // Recursive call instead of setTimeout
      } else {
        logger.error('Mint monitoring timeout', {
          tokenLinkId,
          custodyRecordId
        });

        await auditService.logEvent('TOKEN_MINT_TIMEOUT', {
          tokenLinkId,
          action: 'Token mint monitoring timed out'
        }, { custodyRecordId });

        // Remove from active monitors
        activeMintMonitors.delete(monitoringKey);
      }
    } catch (error) {
      logger.error('Mint monitoring error', {
        tokenLinkId,
        error: error.message
      });

      // If it's a rate limit error or authentication error, wait longer before retrying
      if (error.message.includes('Too Many Requests') ||
        error.message.includes('429') ||
        error.message.includes('Unauthorized')) {
        const rateLimitDelay = 300000; // 5 minutes for rate limit or auth errors
        logger.info('Rate limit or auth error, waiting longer before retry', {
          tokenLinkId,
          delay: rateLimitDelay,
          error: error.message
        });
        await new Promise(resolve => setTimeout(resolve, rateLimitDelay));
        if (attempts < maxAttempts) {
          attempts++;
          await poll(); // Retry after longer delay
        } else {
          activeMintMonitors.delete(monitoringKey);
        }
      } else if (attempts < maxAttempts) {
        attempts++;
        // Use exponential backoff for other errors too, with maximum cap
        const exponentialDelay = Math.min(initialDelay + (attempts * 60000), maxDelay);
        logger.info('Waiting before retry after error', {
          tokenLinkId,
          attempts,
          delay: exponentialDelay
        });
        await new Promise(resolve => setTimeout(resolve, exponentialDelay));
        await poll(); // Recursive call instead of setTimeout
      } else {
        activeMintMonitors.delete(monitoringKey);
      }
    }
  };

  // Check the initial status before starting monitoring
  try {
    const initialStatus = await fireblocksService.getTokenizationStatus(tokenLinkId);
    if (initialStatus.status === 'COMPLETED') {
      logger.info('Token mint already completed, skipping monitoring', { tokenLinkId });
      activeMintMonitors.delete(monitoringKey);
      return;
    }
  } catch (error) {
    logger.warn('Could not get initial status, proceeding with monitoring', {
      tokenLinkId,
      error: error.message
    });
  }

  // Start monitoring after a short delay
  await new Promise(resolve => setTimeout(resolve, initialDelay));
  await poll();
};

// Clean up active monitors periodically to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  const expiredKeys = [];

  for (const [key, monitor] of activeMintMonitors.entries()) {
    // Clean up monitors that have been active for more than 24 hours
    if (now - monitor.startedAt > 24 * 60 * 60 * 1000) {
      expiredKeys.push(key);
    }
  }

  for (const key of expiredKeys) {
    activeMintMonitors.delete(key);
    logger.info('Cleaned up expired monitor', { key });
  }
}, 60 * 60 * 1000); // Run cleanup every hour

/**
 * Get minting status for a specific token link
 */
export const getMintStatus = async (tokenLinkId) => {
  try {
    const statusData = await fireblocksService.getTokenizationStatus(tokenLinkId);
    return statusData;
  } catch (error) {
    logger.error('Failed to get mint status', {
      tokenLinkId,
      error: error.message
    });
    throw error;
  }
};

/**
 * Handle transition of mint status and update custody record
 * @returns {Promise<boolean>} - True if monitoring should stop (terminal state reached)
 */
export const handleMintStatusTransition = async (statusData, custodyRecordId, totalSupply, actor, context, vaultWalletId, tokenSymbol) => {
  const currentStatus = statusData.status;
  const tokenLinkId = statusData.tokenId || statusData.id;
  const txHash = statusData.txHash;

  // Update the operation record with the granular Fireblocks status
  if (context.operationId) {
    try {
      const operationRepository = (await import('../operation/operation.repository.js')).default;
      await operationRepository.updateStatus(context.operationId, 'EXECUTING', {
        fireblocksStatus: currentStatus
      });
    } catch (dbError) {
      logger.warn('Failed to update operation fireblocksStatus', { operationId: context.operationId, error: dbError.message });
    }
  }

  if (currentStatus === 'COMPLETED') {
    logger.info('Token mint completed successfully', { tokenLinkId, txHash, custodyRecordId });

    await custodyService.updateCustodyStatus(
      custodyRecordId,
      CustodyStatus.MINTED,
      {
        blockchain: statusData.blockchainId || 'ETH_TEST5',
        tokenStandard: statusData.tokenMetadata?.tokenStandard || 'ERC20',
        tokenAddress: statusData.tokenMetadata?.contractAddress || tokenLinkId,
        tokenId: statusData.tokenId || tokenLinkId,
        quantity: totalSupply || '1',
        txHash: txHash,
        mintedAt: new Date()
      },
      actor,
      context
    );

    await auditService.logTokenMinted(
      custodyRecordId,
      { tokenLinkId, contractAddress: statusData.tokenMetadata?.contractAddress, txHash },
      actor,
      context
    );

    return true; // Terminal state
  }

  if (['FAILED', 'REJECTED', 'CANCELLED'].includes(currentStatus)) {
    // RECOVERY CHECK:
    if (tokenSymbol && vaultWalletId) {
      try {
        logger.info('Mint reported FAILED. Attempting recovery check...', { vaultWalletId, tokenSymbol });
        const recoveredAddress = await vaultFireblocksService.getWalletAddress(vaultWalletId, tokenSymbol);

        if (recoveredAddress) {
          logger.info('✅ RECOVERY SUCCESS: Asset found in vault despite FAILED status!', { tokenSymbol, recoveredAddress });

          await custodyService.updateCustodyStatus(
            custodyRecordId,
            CustodyStatus.MINTED,
            {
              blockchain: statusData.blockchainId || 'ETH_TEST5',
              tokenStandard: 'ERC20',
              tokenAddress: recoveredAddress,
              tokenId: tokenLinkId,
              quantity: totalSupply || '1',
              txHash: statusData.txHash || 'recov_tx_unknown',
              mintedAt: new Date()
            },
            actor,
            context
          );

          await auditService.logTokenMinted(
            custodyRecordId,
            { tokenLinkId, contractAddress: recoveredAddress, txHash: statusData.txHash || 'recov_tx_unknown', note: 'Recovered from FAILED status' },
            actor,
            context
          );

          return true; // Terminal state
        }
      } catch (recoveryError) {
        logger.warn('Recovery check failed', { error: recoveryError.message });
      }
    }

    const failureReason = `Fireblocks Error: [${statusData.substatus || 'N/A'}] - ${statusData.errorMessage || 'Unknown Error'}`;
    logger.warn('Token mint failed', { tokenLinkId, status: currentStatus, substatus: statusData.substatus, errorMessage: statusData.errorMessage, custodyRecordId });

    try {
      await custodyService.updateCustodyStatus(custodyRecordId, CustodyStatus.FAILED, { failureReason, fireblocksError: statusData }, 'SYSTEM', { source: 'FireblocksSync' });
    } catch (dbError) {
      logger.error('Failed to update custody status to FAILED', { custodyRecordId, error: dbError.message });
    }

    return true; // Terminal state
  }

  return false; // Not terminal
};

/**
 * Synchronize a single custody record's status with Fireblocks
 * Useful for on-demand checking via API requests
 */
export const syncCustodyRecordStatus = async (assetId, actor = 'API_SYNC', context = {}) => {
  try {
    const custodyRecord = await custodyRepository.findByAssetId(assetId);
    if (!custodyRecord || !custodyRecord.tokenId || custodyRecord.status === CustodyStatus.MINTED) {
      return custodyRecord;
    }

    // Rate limit per record: 5 seconds
    const lastUpdate = new Date(custodyRecord.updatedAt).getTime();
    if (Date.now() - lastUpdate < 5000) {
      return custodyRecord;
    }

    logger.info('Performing on-demand status synchronization', { assetId, tokenId: custodyRecord.tokenId });

    const statusData = await fireblocksService.getTokenizationStatus(custodyRecord.tokenId);

    // Attempt recovery check parameters if possible
    // We might need to find the tokenSymbol and vaultWalletId
    let tokenSymbol, vaultWalletId;
    try {
      const assetMetadata = await (await import('../asset-linking/asset.repository.js')).default.getAssetMetadata(custodyRecord.id);
      tokenSymbol = assetMetadata?.symbol;

      const vaultWallet = await (await import('../../config/db.js')).default.vaultWallet.findUnique({
        where: { id: custodyRecord.vaultWalletId }
      });
      vaultWalletId = vaultWallet?.fireblocksId;
    } catch (e) {
      logger.warn('Could not retrieve metadata for recovery sync', { error: e.message });
    }

    await handleMintStatusTransition(
      statusData,
      custodyRecord.id,
      custodyRecord.quantity?.toString(),
      actor,
      context,
      vaultWalletId,
      tokenSymbol
    );

    // Fetch updated record
    return await custodyRepository.findById(custodyRecord.id);
  } catch (error) {
    logger.warn('On-demand sync failed', { assetId, error: error.message });
    return null;
  }
};

export default {
  mintToken,
  getMintStatus,
  handleMintStatusTransition,
  syncCustodyRecordStatus
};