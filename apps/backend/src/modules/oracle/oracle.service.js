import * as fireblocksService from '../fireblocks/fireblocks.client.js';
import * as custodyRepository from '../custody/custody.repository.js';
import { RWA_ORACLE } from '../fireblocks/contracts.js';
import { ethers } from 'ethers';
import { NotFoundError, BadRequestError } from '../../errors/ApiError.js';
import logger from '../../utils/logger.js';
import auditService from '../audit/audit.service.js';

/**
 * Update Oracle Value (NAV or PoR)
 */
export const updateOracleValue = async (id, type, newValue, actor, context = {}) => {
    const custodyRecord = await custodyRepository.findById(id);
    if (!custodyRecord) {
        throw new NotFoundError('Custody record not found');
    }

    const oracleAddress = type === 'NAV' ? custodyRecord.navOracleAddress : custodyRecord.porOracleAddress;
    if (!oracleAddress) {
        throw new BadRequestError(`${type} Oracle address not found for this asset. Has it been deployed?`);
    }

    const vaultWallet = custodyRecord.vaultWallet;
    if (!vaultWallet || !vaultWallet.fireblocksId) {
        throw new BadRequestError('Vault not found for this asset');
    }

    logger.info(`Updating ${type} Oracle at ${oracleAddress} to ${newValue}`, { assetId: custodyRecord.assetId });

    // Encode updateValue(int256)
    const oracleInterface = new ethers.Interface(RWA_ORACLE.abi);
    const decimals = type === 'NAV' ? 8 : 18;
    const valueWei = ethers.parseUnits(String(newValue), decimals);

    const data = oracleInterface.encodeFunctionData("updateValue", [valueWei]);

    const tx = await fireblocksService.callContract(
        vaultWallet.fireblocksId,
        oracleAddress,
        data,
        'ETH_TEST5',
        `Update ${type} Oracle to ${newValue}`
    );

    // Log audit
    await auditService.logEvent('ORACLE_UPDATE_INITIATED', {
        type,
        newValue,
        oracleAddress,
        txId: tx.id
    }, {
        custodyRecordId: id,
        actor,
        ...context
    });

    return {
        success: true,
        txId: tx.id,
        type,
        newValue
    };
};
