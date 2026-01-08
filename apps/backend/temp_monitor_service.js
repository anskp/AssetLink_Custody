import { PrismaClient } from '@prisma/client';
import nonRegulatedAssetLinkService from './nonRegulatedAssetLink.service.js';
import tokenService from './tokenService.js';

const prisma = new PrismaClient();

class AssetLinkOperationMonitorService {
  constructor() {
    this.isRunning = false;
    this.monitorInterval = null;
    this.intervalTime = 30000; // Check every 30 seconds
  }

  /**
   * Start monitoring AssetLink operations
   */
  async start() {
    if (this.isRunning) {
      console.log('AssetLink operation monitor is already running');
      return;
    }

    console.log('🚀 Starting AssetLink operation monitor...');
    this.isRunning = true;
    
    // Run immediately on startup
    await this.checkOperations();
    
    // Then run periodically
    this.monitorInterval = setInterval(async () => {
      await this.checkOperations();
    }, this.intervalTime);

    console.log(`✅ AssetLink operation monitor started (checking every ${this.intervalTime/1000}s)`);
  }

  /**
   * Stop monitoring AssetLink operations
   */
  stop() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
    this.isRunning = false;
    console.log('🛑 AssetLink operation monitor stopped');
  }

  /**
   * Check for pending AssetLink operations and update their status
   */
  async checkOperations() {
    try {
      console.log('🔍 Checking AssetLink operations...');

      // Get all tokens that are linked to AssetLink operations and have PENDING status
      const pendingTokens = await prisma.token.findMany({
        where: {
          templateId: 'ASSETLINK',
          status: 'PENDING'
        },
        include: {
          user: true,
          asset: true
        }
      });

      console.log(`📊 Found ${pendingTokens.length} pending AssetLink tokens to check`);

      for (const token of pendingTokens) {
        await this.checkOperationStatus(token);
      }

    } catch (error) {
      console.error('❌ Error checking AssetLink operations:', error);
    }
  }

  /**
   * Check the status of a specific AssetLink operation and update token accordingly
   */
  async checkOperationStatus(token) {
    try {
      console.log(`🔍 Checking operation status for token ${token.id} (operation: ${token.transactionId})`);

      // Get the operation details from AssetLink
      const operationDetails = await nonRegulatedAssetLinkService.getNonRegulatedOperationDetails(token.transactionId);

      if (!operationDetails) {
        console.warn(`⚠️ Operation not found in AssetLink: ${token.transactionId}`);
        return;
      }

      console.log(`📋 Operation ${token.transactionId} status: ${operationDetails.status}`);

      // Update token based on operation status
      switch (operationDetails.status) {
        case 'APPROVED':
          console.log(`✅ Operation ${token.transactionId} approved, creating token...`);
          await this.handleApprovedOperation(token, operationDetails);
          break;
          
        case 'EXECUTED':
          console.log(`✅ Operation ${token.transactionId} executed, updating token...`);
          await this.handleExecutedOperation(token, operationDetails);
          break;
          
        case 'REJECTED':
          console.log(`❌ Operation ${token.transactionId} rejected, marking token as failed...`);
          await this.handleRejectedOperation(token, operationDetails);
          break;
          
        case 'FAILED':
          console.log(`❌ Operation ${token.transactionId} failed, marking token as failed...`);
          await this.handleFailedOperation(token, operationDetails);
          break;
          
        default:
          console.log(`⏳ Operation ${token.transactionId} still pending (${operationDetails.status})`);
          // Do nothing, keep checking
          break;
      }

    } catch (error) {
      console.error(`❌ Error checking operation status for token ${token.id}:`, error);
    }
  }

  /**
   * Handle approved operation - create the actual token
   */
  async handleApprovedOperation(token, operationDetails) {
    try {
      // Update token status to indicate it's being processed
      await prisma.token.update({
        where: { id: token.id },
        data: {
          status: 'MINTING',
          updatedAt: new Date()
        }
      });

      console.log(`🚀 Processing approved operation for token ${token.id}`);

      // Prepare token configuration based on the original request
      const tokenConfig = {
        tokenName: token.name,
        tokenSymbol: token.symbol,
        selectedAsset: token.assetCategory || 'real-world-asset',
        selectedTemplate: token.templateId || 'erc20f',
        network: token.network || 'testnet',
        selectedNetwork: token.selectedNetwork || 'eth_test5',
        totalSupply: token.totalSupply,
        decimals: token.decimals,
        tokenDeployer: 'fireblocks',
        assetId: token.assetId,
        description: token.description || `${token.name} token`,
        imageUrl: token.imageUrl,
        assetType: token.assetCategory,
        category: token.assetCategory
      };

      // Create the actual token using the token service
      const result = await tokenService.createToken(token.userId, tokenConfig);

      if (result.success) {
        console.log(`✅ Token created successfully for operation ${token.transactionId}`);
        
        // Update the original token record to link to the new token
        await prisma.token.update({
          where: { id: token.id },
          data: {
            status: 'DEPLOYED',
            contractAddress: result.token.contractAddress,
            deployedAt: new Date(),
            updatedAt: new Date(),
            metadata: {
              ...token.metadata,
              assetLinkOperationId: token.transactionId,
              linkedTokenId: result.token.id
            }
          }
        });

        console.log(`🔗 Token ${token.id} linked to deployed token ${result.token.id}`);
      } else {
        console.error(`❌ Failed to create token for operation ${token.transactionId}:`, result.error);
        
        // Mark as failed
        await prisma.token.update({
          where: { id: token.id },
          data: {
            status: 'FAILED',
            errorMessage: result.error,
            updatedAt: new Date()
          }
        });
      }

    } catch (error) {
      console.error(`❌ Error handling approved operation for token ${token.id}:`, error);
      
      // Mark as failed
      await prisma.token.update({
        where: { id: token.id },
        data: {
          status: 'FAILED',
          errorMessage: error.message,
          updatedAt: new Date()
        }
      });
    }
  }

  /**
   * Handle executed operation - token has been created in AssetLink
   */
  async handleExecutedOperation(token, operationDetails) {
    try {
      // Update token to deployed status
      await prisma.token.update({
        where: { id: token.id },
        data: {
          status: 'DEPLOYED',
          contractAddress: operationDetails.contractAddress || operationDetails.contract_address,
          deployedAt: new Date(),
          updatedAt: new Date()
        }
      });

      console.log(`✅ Token ${token.id} marked as deployed after AssetLink execution`);
    } catch (error) {
      console.error(`❌ Error handling executed operation for token ${token.id}:`, error);
    }
  }

  /**
   * Handle rejected operation
   */
  async handleRejectedOperation(token, operationDetails) {
    try {
      await prisma.token.update({
        where: { id: token.id },
        data: {
          status: 'REJECTED',
          errorMessage: operationDetails.rejectionReason || 'Operation rejected by AssetLink',
          updatedAt: new Date()
        }
      });

      console.log(`❌ Token ${token.id} marked as rejected`);
    } catch (error) {
      console.error(`❌ Error handling rejected operation for token ${token.id}:`, error);
    }
  }

  /**
   * Handle failed operation
   */
  async handleFailedOperation(token, operationDetails) {
    try {
      await prisma.token.update({
        where: { id: token.id },
        data: {
          status: 'FAILED',
          errorMessage: operationDetails.errorMessage || operationDetails.error || 'Operation failed in AssetLink',
          updatedAt: new Date()
        }
      });

      console.log(`❌ Token ${token.id} marked as failed`);
    } catch (error) {
      console.error(`❌ Error handling failed operation for token ${token.id}:`, error);
    }
  }

  /**
   * Force check a specific operation
   */
  async forceCheckOperation(transactionId) {
    try {
      const token = await prisma.token.findFirst({
        where: {
          transactionId: transactionId,
          templateId: 'ASSETLINK'
        }
      });

      if (token) {
        await this.checkOperationStatus(token);
        return { success: true, message: `Operation ${transactionId} checked` };
      } else {
        return { success: false, error: `Token with transactionId ${transactionId} not found` };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export default new AssetLinkOperationMonitorService();