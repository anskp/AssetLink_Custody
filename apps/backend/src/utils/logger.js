import winston from 'winston';
import { config } from '../config/env.js';

/**
 * Winston Logger Configuration
 * Structured logging for AssetLink Custody
 */

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom human-friendly log format
const customFormat = printf(({ level, message, timestamp, ...metadata }) => {
    const service = metadata.service || 'asset-custody';
    delete metadata.service; // Remove from standard metadata display

    const metaStr = Object.keys(metadata).length > 0
        ? `\n   ${Object.entries(metadata).map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`).join(', ')}`
        : '';

    // Clean up timestamps to just show time for easier reading in dev
    const time = timestamp.split(' ')[1];

    return `[${time}] ${level.padEnd(5)} | ${message}${metaStr}`;
});

// Create logger instance
const logger = winston.createLogger({
    level: config.logLevel,
    format: combine(
        errors({ stack: true }),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        customFormat
    ),
    defaultMeta: { service: 'assetlink-custody' },
    transports: [
        new winston.transports.Console({
            format: combine(
                colorize({ all: true }),
                customFormat
            )
        })
    ]
});

// Professional Banner for Human Readability
if (config.nodeEnv !== 'production') {
    process.nextTick(() => {
        console.log('\x1b[36m%s\x1b[0m', `
   ┌──────────────────────────────────────────────────────────┐
   │                                                          │
   │   🔗  ASSETLINK CUSTODY ENGINE IS ONLINE                │
   │   🚀  Securely processing RWA on-chain operations        │
   │                                                          │
   └──────────────────────────────────────────────────────────┘
        `);
    });
}

// Add file transports in production
if (config.nodeEnv === 'production') {
    logger.add(new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error'
    }));
    logger.add(new winston.transports.File({
        filename: 'logs/combined.log'
    }));
}

export default logger;
