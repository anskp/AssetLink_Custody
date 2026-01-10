import Decimal from 'decimal.js';

/**
 * Price Utility
 */

// Default ETH price in USD (should be moved to env or dynamic source in production)
const ETH_USD_RATE = process.env.ETH_USD_RATE || '2500';

/**
 * Convert USD amount to ETH
 * @param {string|number} usdAmount - Amount in USD
 * @returns {string} - Amount in ETH as a decimal string
 */
export const convertUsdToEth = (usdAmount) => {
    if (!usdAmount || isNaN(usdAmount)) return '0';

    const usd = new Decimal(usdAmount);
    const rate = new Decimal(ETH_USD_RATE);

    // eth = usd / rate
    return usd.div(rate).toFixed(18); // Use 18 decimals for ETH precision
};

/**
 * Get current ETH rate in USD
 */
export const getEthRate = () => {
    return ETH_USD_RATE;
};

export default {
    convertUsdToEth,
    getEthRate
};
