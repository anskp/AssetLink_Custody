import explorerService from './explorer.service.js';
import logger from '../../utils/logger.js';

/**
 * Explorer Controller
 * Handles public ledger exploration requests
 */

export const getLatestTransactions = async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 25;
        const transactions = await explorerService.getLatestTransactions(limit);
        res.json({ success: true, data: transactions });
    } catch (error) {
        next(error);
    }
};

export const getAssetByAddress = async (req, res, next) => {
    try {
        const { address } = req.params;
        const asset = await explorerService.getAssetByAddress(address);
        res.json({ success: true, data: asset });
    } catch (error) {
        next(error);
    }
};

export const getTransactionByHash = async (req, res, next) => {
    try {
        const { hash } = req.params;
        const tx = await explorerService.getTransactionByHash(hash);
        res.json({ success: true, data: tx });
    } catch (error) {
        next(error);
    }
};

export const getAddressDetails = async (req, res, next) => {
    try {
        const { ownerId } = req.params;
        const portfolio = await explorerService.getAddressDetails(ownerId);
        res.json({ success: true, data: portfolio });
    } catch (error) {
        next(error);
    }
};

export const search = async (req, res, next) => {
    try {
        const { q } = req.query;
        if (!q) return res.status(400).json({ success: false, message: 'Search query is required' });

        const result = await explorerService.search(q);
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export const getStats = async (req, res, next) => {
    try {
        const stats = await explorerService.getStats();
        res.json({ success: true, data: stats });
    } catch (error) {
        next(error);
    }
};

export const getAllAssets = async (req, res, next) => {
    try {
        const assets = await explorerService.getAllAssets();
        res.json({ success: true, data: assets });
    } catch (error) {
        next(error);
    }
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
