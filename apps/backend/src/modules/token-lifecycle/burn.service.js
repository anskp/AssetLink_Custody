/**
 * Token Burn Service
 * Handles the burning of tokens via Fireblocks (CONTRACT_CALL) and ethers
 */

import { ethers } from 'ethers';
import * as fireblocksClient from '../fireblocks/fireblocks.client.js';
import * as custodyService from '../custody/custody.service.js';
import * as auditService from '../audit/audit.service.js';
import { CustodyStatus } from '../../enums/custodyStatus.js';
import logger from '../../utils/logger.js';
import { BadRequestError } from '../../errors/ApiError.js';
import webhookService from '../../utils/webhook.service.js';

// Global tracking for active monitors
const activeBurnMonitors = new Map();

/**
 * Burn tokens on the blockchain via Fireblocks
 * @param {Object} burnData - Token burn parameters
 * @param {string} burnData.custodyRecordId - Asset custody record ID
 * @param {string} burnData.amount - Amount of tokens to burn (decimal string)
 * @param {string} actor - User initiating the burn
 * @param {Object} context - Request context
 */
export const burnToken = async (burnData, actor, context = {}) => {
    const { custodyRecordId, amount } = burnData;

    try {
        logger.info('Initiating token burn process', { custodyRecordId, amount });

        // 1. Get Custody Record
        const record = await custodyService.getCustodyRecordById(custodyRecordId);
        if (record.status !== CustodyStatus.MINTED) {
            throw new BadRequestError(`Asset must be in MINTED status to burn tokens. Current status: ${record.status}`);
        }

        const tokenLinkId = record.tokenId; // In this system, tokenId often stores the Fireblocks Link ID
        if (!tokenLinkId) {
            throw new BadRequestError('Custody record does not have a linked token (tokenId missing)');
        }

        // 2. Fetch Token Details from Fireblocks
        logger.info(`🔍 Fetching details for Token Link ID: ${tokenLinkId}...`);
        const tokenDetails = await fireblocksClient.makeFireblocksRequest(`/v1/tokenization/tokens/${tokenLinkId}`, 'GET');

        const contractAddress = tokenDetails.tokenMetadata?.contractAddress;
        const decimals = tokenDetails.tokenMetadata?.decimals || 18;
        const blockchainId = tokenDetails.tokenMetadata?.blockchain || tokenDetails.blockchainId;

        if (!contractAddress) throw new Error("Could not find Contract Address in Fireblocks API response.");
        if (!blockchainId) throw new Error("Could not determine Blockchain ID.");

        logger.info(`✅ Found Contract: ${contractAddress}`, { blockchainId, decimals });

        // 3. Encode Burn Function using Ethers
        logger.info(`🔥 Encoding Burn Transaction for ${amount} tokens...`);
        const iface = new ethers.Interface(["function burn(uint256 amount)"]);
        const amountInWei = ethers.parseUnits(amount.toString(), decimals);
        const callData = iface.encodeFunctionData("burn", [amountInWei]);

        // 4. Construct Fireblocks CONTRACT_CALL Payload
        // We use the vault associated with the custody record
        const vaultId = record.vaultWallet?.fireblocksId || '88'; // Fallback to 88 if not found

        const payload = {
            operation: "CONTRACT_CALL",
            assetId: blockchainId,
            source: {
                type: "VAULT_ACCOUNT",
                id: String(vaultId)
            },
            destination: {
                type: "ONE_TIME_ADDRESS",
                oneTimeAddress: {
                    address: contractAddress
                }
            },
            note: `AssetLink: Burn ${amount} tokens for asset ${record.assetId}`,
            amount: "0",
            extraParameters: {
                contractCallData: callData
            }
        };

        // 5. Submit Transaction to Fireblocks
        logger.info('Submitting burn transaction to Fireblocks...');
        const result = await fireblocksClient.makeFireblocksRequest('/v1/transactions', 'POST', payload);

        logger.info('✅ Burn Transaction Submitted Successfully!', {
            txId: result.id,
            status: result.status
        });

        // 6. Start Background Monitoring
        // We delay terminal status updates until the transaction is COMPLETED on-chain
        try {
            monitorBurnTransaction(
                result.id,
                custodyRecordId,
                amount,
                actor,
                context
            );
        } catch (monitoringError) {
            logger.error('Failed to start burn monitoring', {
                txId: result.id,
                custodyRecordId,
                error: monitoringError.message
            });
        }

        return {
            success: true,
            fireblocksTxId: result.id,
            status: result.status,
            custodyRecordId
        };

    } catch (error) {
        logger.error('Failed to burn tokens', { custodyRecordId, error: error.message });

        await auditService.logEvent('TOKEN_BURN_FAILED', {
            custodyRecordId,
            error: error.message,
            amount
        }, { ...context, actor });

        throw error;
    }
};

/**
 * Monitor burn transaction status and update custody record when complete
 */
const monitorBurnTransaction = async (txId, custodyRecordId, amount, actor, context) => {
    logger.info('Starting burn status monitoring', { txId, custodyRecordId, amount });

    let attempts = 0;
    const maxAttempts = 30; // ~2.5 minutes total (5s intervals)
    const delay = 5000;

    const monitoringKey = `burn_${txId}`;
    if (activeBurnMonitors.has(monitoringKey)) return;

    activeBurnMonitors.set(monitoringKey, { startedAt: Date.now(), custodyRecordId });

    const poll = async () => {
        try {
            const tx = await fireblocksClient.getTransactionById(txId);
            const currentStatus = tx.status;

            logger.info('Burn status update', { txId, status: currentStatus, attempts });

            // Update COPym operation status to EXECUTING with Fireblocks info
            if (context.operationId) {
                try {
                    const operationRepository = (await import('../operation/operation.repository.js')).default;
                    await operationRepository.updateStatus(context.operationId, 'EXECUTING', {
                        fireblocksStatus: currentStatus,
                        txHash: tx.txHash
                    });
                } catch (dbError) {
                    logger.warn('Failed to update operation fireblocksStatus', { operationId: context.operationId, error: dbError.message });
                }
            }

            if (currentStatus === 'COMPLETED') {
                logger.info('🔥 Burn transaction confirmed on-chain', { txId, custodyRecordId });

                const record = await custodyService.getCustodyRecordById(custodyRecordId);
                const currentQuantity = Number(record.quantity || 0);
                const burnAmount = Number(amount);
                const newQuantity = Math.max(0, currentQuantity - burnAmount);

                let nextStatus = CustodyStatus.MINTED;
                if (newQuantity <= 0 && currentQuantity > 0) {
                    nextStatus = CustodyStatus.BURNED;
                }

                const updatedRecord = await custodyService.updateCustodyStatus(
                    custodyRecordId,
                    nextStatus,
                    {
                        burnedAt: new Date(),
                        amountBurned: amount,
                        burnTxHash: tx.txHash || txId,
                        fireblocksTxId: txId,
                        quantity: String(newQuantity)
                    },
                    actor,
                    context
                );

                // Notify COPym that burn is complete
                if (context.operationId) {
                    const operationRepository = (await import('../operation/operation.repository.js')).default;
                    const finalOp = await operationRepository.updateStatus(context.operationId, 'EXECUTED', {
                        executedAt: new Date(),
                        txHash: tx.txHash
                    });
                    webhookService.notifyStatusUpdate('operation.updated', finalOp);
                }

                activeBurnMonitors.delete(monitoringKey);
                return;
            }

            if (['FAILED', 'REJECTED', 'CANCELLED', 'BLOCKED'].includes(currentStatus)) {
                logger.error('❌ Burn transaction failed', { txId, status: currentStatus, subStatus: tx.subStatus });

                if (context.operationId) {
                    const operationRepository = (await import('../operation/operation.repository.js')).default;
                    const failedOp = await operationRepository.updateStatus(context.operationId, 'FAILED', {
                        failureReason: `Fireblocks transaction ${currentStatus}: ${tx.subStatus || 'No details'}`
                    });
                    webhookService.notifyStatusUpdate('operation.updated', failedOp);
                }

                activeBurnMonitors.delete(monitoringKey);
                return;
            }

            if (attempts < maxAttempts) {
                attempts++;
                await new Promise(resolve => setTimeout(resolve, delay));
                await poll();
            } else {
                logger.error('Burn monitoring timeout', { txId, custodyRecordId });
                activeBurnMonitors.delete(monitoringKey);
            }
        } catch (error) {
            logger.error('Burn monitoring error', { txId, error: error.message });
            activeBurnMonitors.delete(monitoringKey);
        }
    };

    poll();
};

export default {
    burnToken
};
