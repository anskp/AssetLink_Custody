import axios from 'axios';
import logger from './logger.js';

class WebhookService {
    constructor() {
        // COPYm webhook endpoint - typically http://localhost:5000/api/webhooks/assetlink in dev
        this.webhookUrl = process.env.COPYM_WEBHOOK_URL || 'http://localhost:5000/api/webhooks/assetlink';
    }

    /**
     * Send status update to COPYm
     * @param {string} event - Event type (e.g., 'operation.updated')
     * @param {object} data - Payload data
     */
    async notifyStatusUpdate(event, data) {
        if (!this.webhookUrl) {
            logger.warn('Webhook URL not configured, skipping notification');
            return;
        }

        try {
            logger.info(`📡 Sending webhook to COPYm: ${event}`, { event, id: data.id || data.operationId });

            await axios.post(this.webhookUrl, {
                event,
                data,
                timestamp: new Date().toISOString()
            }, {
                timeout: 5000 // 5 seconds timeout for webhook delivery
            });

            logger.info(`✅ Webhook delivered successfully: ${event}`);
        } catch (error) {
            logger.error(`❌ Webhook delivery failed: ${event}`, {
                error: error.message,
                status: error.response?.status,
                url: this.webhookUrl
            });
            // We don't throw here to avoid failing the main process if the receiver is down
        }
    }
}

export default new WebhookService();
