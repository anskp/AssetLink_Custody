import * as oracleService from './oracle.service.js';
import { BadRequestError } from '../../errors/ApiError.js';

export const updateOracle = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { type, value } = req.body;

        if (!type || !['NAV', 'POR'].includes(type.toUpperCase())) {
            throw BadRequestError('Invalid oracle type. Must be NAV or POR');
        }

        if (value === undefined || value === null) {
            throw BadRequestError('Value is required');
        }

        const actor = req.auth?.publicKey || 'system';
        const context = {
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        };

        const result = await oracleService.updateOracleValue(id, type.toUpperCase(), value, actor, context);
        res.json(result);
    } catch (error) {
        next(error);
    }
};
