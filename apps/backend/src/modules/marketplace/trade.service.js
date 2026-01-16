/**
 * Trade Service
 * Manages marketplace bids and trade execution
 */

import prisma from '../../config/db.js';
import * as auditService from '../audit/audit.service.js';
import * as fireblocksService from '../vault/fireblocks.service.js';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../errors/ApiError.js';
import logger from '../../utils/logger.js';
import { ListingStatus } from './listing.service.js';

/**
 * Bid Status Enum
 */
export const BidStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED'
};

/**
 * Place a bid on a listing
 */
export const placeBid = async (listingId, data, tenantId, buyerId, context = {}) => {
  const { amount, quantity } = data;

  if (!amount) {
    throw BadRequestError('Bid amount is required');
  }

  // Get listing
  const listing = await prisma.listing.findUnique({
    where: { id: listingId }
  });

  if (!listing) {
    throw NotFoundError(`Listing ${listingId} not found`);
  }

  // Verify listing is in ACTIVE status
  if (listing.status !== ListingStatus.ACTIVE) {
    throw BadRequestError(`Cannot bid on listing with status ${listing.status}`);
  }

  // Verify buyer has sufficient balance
  const userBalance = await prisma.userBalance.findUnique({
    where: { userId: buyerId }
  });

  const bidQuantity = parseFloat(quantity || '1');
  const totalBidAmount = parseFloat(amount) * bidQuantity;

  if (!userBalance || parseFloat(userBalance.balance) < totalBidAmount) {
    throw BadRequestError(`Insufficient balance. Required: ${totalBidAmount}, Available: ${userBalance?.balance || 0}`);
  }

  // Create bid
  const bid = await prisma.bid.create({
    data: {
      listingId,
      tenantId: listing.tenantId,
      buyerId,
      amount,
      quantity: quantity || '1',
      status: BidStatus.PENDING
    }
  });

  logger.info('Bid placed', {
    bidId: bid.id,
    listingId,
    buyerId,
    amount,
    quantity: bidQuantity
  });

  // Log audit event
  await auditService.logEvent('BID_PLACED', {
    bidId: bid.id,
    listingId,
    assetId: listing.assetId,
    amount,
    quantity: bidQuantity
  }, {
    custodyRecordId: listing.custodyRecordId,
    actor: buyerId,
    ...context
  });

  return bid;
};

/**
 * Accept a bid (executes off-chain ownership transfer and payment settlement)
 */
export const acceptBid = async (bidId, tenantId, sellerId, context = {}) => {
  // Get bid with listing
  const bid = await prisma.bid.findUnique({
    where: { id: bidId },
    include: {
      listing: true
    }
  });

  if (!bid) {
    throw NotFoundError(`Bid ${bidId} not found`);
  }

  const listing = bid.listing;

  // Verify seller owns the listing
  if (listing.sellerId !== sellerId) {
    throw ForbiddenError('Only the listing owner can accept bids');
  }

  // Verify bid is still valid
  if (bid.status !== BidStatus.PENDING) {
    throw BadRequestError(`Cannot accept bid with status ${bid.status}`);
  }

  // Verify listing is still active
  if (listing.status !== ListingStatus.ACTIVE) {
    throw BadRequestError(`Cannot accept bid for listing with status ${listing.status}`);
  }

  const bidQuantity = parseFloat(bid.quantity || '1');
  const totalAmount = parseFloat(bid.amount) * bidQuantity;

  // Verify buyer has sufficient funds
  const buyerBalance = await prisma.userBalance.findUnique({
    where: { userId: bid.buyerId }
  });

  if (!buyerBalance || parseFloat(buyerBalance.balance) < totalAmount) {
    throw BadRequestError('Buyer has insufficient funds');
  }

  // Execute atomic transaction:
  // 1. Transfer ownership in off-chain ledger
  // 2. Update buyer balance (decrease)
  // 3. Update seller balance (increase)
  // 4. Update listing status to SOLD (or reduce quantity)
  // 5. Update bid status to ACCEPTED

  const result = await prisma.$transaction(async (tx) => {
    // 1. Transfer ownership
    // Reduce seller's ownership
    const sellerOwnership = await tx.ownership.findUnique({
      where: {
        assetId_ownerId: {
          assetId: listing.assetId,
          ownerId: sellerId
        }
      }
    });

    if (!sellerOwnership) {
      throw BadRequestError('Seller does not own this asset');
    }

    const sellerQuantity = parseFloat(sellerOwnership.quantity);
    if (sellerQuantity < bidQuantity) {
      throw BadRequestError(`Insufficient quantity. Available: ${sellerQuantity}, Required: ${bidQuantity}`);
    }

    if (sellerQuantity === bidQuantity) {
      // Delete seller's ownership if selling all
      await tx.ownership.delete({
        where: {
          assetId_ownerId: {
            assetId: listing.assetId,
            ownerId: sellerId
          }
        }
      });
    } else {
      // Reduce seller's quantity
      await tx.ownership.update({
        where: {
          assetId_ownerId: {
            assetId: listing.assetId,
            ownerId: sellerId
          }
        },
        data: {
          quantity: (sellerQuantity - bidQuantity).toString()
        }
      });
    }

    // Create or update buyer's ownership
    const buyerOwnership = await tx.ownership.findUnique({
      where: {
        assetId_ownerId: {
          assetId: listing.assetId,
          ownerId: bid.buyerId
        }
      }
    });


    if (buyerOwnership) {
      // Update existing ownership
      await tx.ownership.update({
        where: {
          assetId_ownerId: {
            assetId: listing.assetId,
            ownerId: bid.buyerId
          }
        },
        data: {
          quantity: (parseFloat(buyerOwnership.quantity) + bidQuantity).toString(),
          walletAddress: context.walletAddress || undefined // Update wallet address if provided
        }
      });
    } else {
      // Create new ownership
      await tx.ownership.create({
        data: {
          assetId: listing.assetId,
          custodyRecordId: listing.custodyRecordId,
          tenantId: listing.tenantId,
          ownerId: bid.buyerId,
          quantity: bidQuantity.toString(),
          purchasePrice: bid.amount,
          purchasePriceUsd: listing.priceUsd || bid.amount,
          purchasePriceEth: listing.priceEth,
          currency: listing.currency,
          walletAddress: context.walletAddress || null // Store wallet address
        }
      });
    }

    // 2. Update buyer balance (decrease)
    await tx.userBalance.update({
      where: { userId: bid.buyerId },
      data: {
        balance: (parseFloat(buyerBalance.balance) - totalAmount).toString()
      }
    });

    // 3. Update seller balance (increase)
    const sellerBalance = await tx.userBalance.findUnique({
      where: { userId: sellerId }
    });

    if (sellerBalance) {
      await tx.userBalance.update({
        where: { userId: sellerId },
        data: {
          balance: (parseFloat(sellerBalance.balance) + totalAmount).toString()
        }
      });
    } else {
      await tx.userBalance.create({
        data: {
          userId: sellerId,
          balance: totalAmount.toString(),
          currency: listing.currency
        }
      });
    }

    // 4. Update listing status
    const newQuantitySold = parseFloat(listing.quantitySold) + bidQuantity;
    const totalListed = parseFloat(listing.quantityListed);

    // Use Math.abs to handle potential floating point precision issues
    const isFullySold = Math.abs(newQuantitySold - totalListed) < 0.000001 || newQuantitySold >= totalListed;

    const updatedListing = await tx.listing.update({
      where: { id: listing.id },
      data: {
        quantitySold: newQuantitySold.toString(),
        status: isFullySold ? ListingStatus.SOLD : ListingStatus.ACTIVE,
        updatedAt: new Date()
      }
    });

    // 5. Update bid status to ACCEPTED
    const updatedBid = await tx.bid.update({
      where: { id: bidId },
      data: {
        status: BidStatus.ACCEPTED,
        updatedAt: new Date()
      }
    });

    return {
      bid: updatedBid,
      listing: updatedListing
    };
  });

  logger.info('Bid accepted and trade executed', {
    bidId,
    listingId: listing.id,
    assetId: listing.assetId,
    sellerId,
    buyerId: bid.buyerId,
    amount: totalAmount,
    quantity: bidQuantity
  });

  // Log audit event
  await auditService.logEvent('BID_ACCEPTED', {
    bidId,
    listingId: listing.id,
    assetId: listing.assetId,
    sellerId,
    buyerId: bid.buyerId,
    amount: totalAmount,
    quantity: bidQuantity
  }, {
    custodyRecordId: listing.custodyRecordId,
    actor: sellerId,
    ...context
  });

  await auditService.logEvent('OWNERSHIP_TRANSFERRED', {
    assetId: listing.assetId,
    fromUserId: sellerId,
    toUserId: bid.buyerId,
    amount: totalAmount,
    quantity: bidQuantity
  }, {
    custodyRecordId: listing.custodyRecordId,
    actor: 'SYSTEM',
    ...context
  });

  return result;
};

/**
 * Execute direct purchase (immediate buy at listing price)
 */
export const executePurchase = async (listingId, buyerId, paymentData = {}, context = {}) => {
  // 1. Get listing with vault info
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: {
      custodyRecord: {
        include: {
          vaultWallet: true
        }
      }
    }
  });

  if (!listing) {
    console.error('❌ Listing not found:', listingId);
    throw NotFoundError(`Listing ${listingId} not found`);
  }
  console.log('✅ Listing found:', listing.id);

  if (listing.status !== ListingStatus.ACTIVE) {
    throw BadRequestError(`Cannot purchase listing with status ${listing.status}`);
  }

  if (listing.sellerId === buyerId) {
    throw BadRequestError('Cannot purchase your own listing');
  }

  // 2. Handle Fireblocks Payment if source vault is provided
  const { sourceVaultId, paymentAssetId = 'ETH_TEST5', walletAddress, quantity } = paymentData;
  const purchaseQuantity = parseFloat(quantity || '1');
  console.log('📦 Purchase Data:', { sourceVaultId, paymentAssetId, purchaseQuantity });
  let fireblocksTxId = null;

  if (sourceVaultId) {
    const destinationVaultId = listing.custodyRecord?.vaultWallet?.fireblocksId;
    if (!destinationVaultId) {
      throw BadRequestError('Asset vault not configured for payment');
    }

    // Use priceEth for ETH payments, or priceUsd for stablecoins
    const unitPrice = paymentAssetId.includes('USD') ? (listing.priceUsd || listing.price) : (listing.priceEth || listing.price);
    const paymentAmount = parseFloat(unitPrice || '0') * purchaseQuantity;

    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      throw BadRequestError(`Invalid payment amount: ${paymentAmount}. Unit Price: ${unitPrice}, Quantity: ${purchaseQuantity}`);
    }

    logger.info('Initiating Fireblocks payment for purchase', {
      sourceVaultId,
      destinationVaultId,
      paymentAssetId,
      amount: paymentAmount
    });

    try {
      fireblocksTxId = await fireblocksService.transferTokens(
        sourceVaultId,
        destinationVaultId,
        paymentAssetId,
        paymentAmount
      );
    } catch (error) {
      logger.error('Fireblocks payment failed', { error: error.message });
      throw BadRequestError(`Payment failed: ${error.message}`);
    }
  }

  // 3. Create a phantom 'ACCEPTED' bid to reuse trade logic

  const totalAmount = parseFloat(listing.price || '0') * purchaseQuantity;

  if (isNaN(totalAmount) || totalAmount <= 0) {
    throw BadRequestError(`Invalid total amount: ${totalAmount}. Price: ${listing.price}, Quantity: ${purchaseQuantity}`);
  }

  // Check balance (Off-chain balance for ledger)
  let buyerBalance = await prisma.userBalance.findUnique({
    where: { userId: buyerId }
  });



  // If Fireblocks payment was successful, credit the off-chain balance temporarily
  // This "bridges" the on-chain deposit to the off-chain ledger so acceptBid can succeed
  if (fireblocksTxId) {
    // Check if user exists first to avoid FK constraint error
    const user = await prisma.user.findUnique({
      where: { id: buyerId }
    });

    if (!user) {
      // Lazy create user (External user from copym)
      await prisma.user.create({
        data: {
          id: buyerId, // Use external ID
          email: `${buyerId}@external.platform`, // Placeholder email
          passwordHash: 'EXTERNAL_USER_HASH', // Placeholder hash
          role: 'CLIENT'
        }
      });
      logger.info('Lazy created external user', { userId: buyerId });
    }

    if (buyerBalance) {
      buyerBalance = await prisma.userBalance.update({
        where: { userId: buyerId },
        data: {
          balance: (parseFloat(buyerBalance.balance) + totalAmount).toString()
        }
      });
    } else {
      buyerBalance = await prisma.userBalance.create({
        data: {
          userId: buyerId,
          balance: totalAmount.toString(),
          currency: listing.currency || 'USD'
        }
      });
    }
    logger.info('Credited off-chain balance from Fireblocks payment', { buyerId, amount: totalAmount });
  }

  console.log('🔍 Checking buyer balance...', { buyerId, totalAmount });
  if (!buyerBalance || parseFloat(buyerBalance.balance) < totalAmount) {
    console.error('❌ Insufficient balance:', { balance: buyerBalance?.balance, required: totalAmount });
    throw BadRequestError('Insufficient off-chain balance for direct purchase');
  }

  // Validate that the requested quantity is available
  const availableQuantity = parseFloat(listing.quantityListed) - parseFloat(listing.quantitySold);
  console.log('📊 Available Quantity:', availableQuantity);
  if (purchaseQuantity > availableQuantity) {
    console.error('❌ Insufficient quantity:', { availableQuantity, purchaseQuantity });
    throw BadRequestError(`Insufficient quantity available. Requested: ${purchaseQuantity}, Available: ${availableQuantity}`);
  }

  console.log('📝 Creating bid...');

  // Create the bid
  const bid = await prisma.bid.create({
    data: {
      listingId,
      tenantId: listing.tenantId,
      buyerId,
      amount: listing.price,
      quantity: purchaseQuantity.toString(),
      status: BidStatus.PENDING
    }
  });
  console.log('✅ Bid created:', bid.id);

  // Accept the bid (ledger update)
  console.log('🤝 Accepting bid...', { bidId: bid.id, tenantId: listing.tenantId, sellerId: listing.sellerId });
  const result = await acceptBid(bid.id, listing.tenantId, listing.sellerId, {
    ...context,
    fireblocksTxId, // Pass to audit log
    walletAddress   // Pass wallet address for ledger
  });

  return {
    ...result,
    fireblocksTxId
  };
};

/**
 * Reject a bid
 */
export const rejectBid = async (bidId, tenantId, sellerId, context = {}) => {
  // Get bid with listing
  const bid = await prisma.bid.findUnique({
    where: { id: bidId },
    include: {
      listing: true
    }
  });

  if (!bid) {
    throw NotFoundError(`Bid ${bidId} not found`);
  }

  const listing = bid.listing;

  // Verify seller owns the listing
  if (listing.sellerId !== sellerId) {
    throw ForbiddenError('Only the listing owner can reject bids');
  }

  // Verify bid is still pending
  if (bid.status !== BidStatus.PENDING) {
    throw BadRequestError(`Cannot reject bid with status ${bid.status}`);
  }

  // Update bid status to REJECTED
  const updatedBid = await prisma.bid.update({
    where: { id: bidId },
    data: {
      status: BidStatus.REJECTED,
      updatedAt: new Date()
    }
  });

  logger.info('Bid rejected', {
    bidId,
    listingId: listing.id,
    assetId: listing.assetId,
    sellerId
  });

  // Log audit event
  await auditService.logEvent('BID_REJECTED', {
    bidId,
    listingId: listing.id,
    assetId: listing.assetId
  }, {
    custodyRecordId: listing.custodyRecordId,
    actor: sellerId,
    ...context
  });

  return updatedBid;
};

/**
 * Get bids for a listing
 */
export const getListingBids = async (listingId) => {
  const bids = await prisma.bid.findMany({
    where: { listingId },
    orderBy: {
      amount: 'desc'
    }
  });

  return bids;
};

export default {
  placeBid,
  acceptBid,
  rejectBid,
  getListingBids,
  BidStatus
};
