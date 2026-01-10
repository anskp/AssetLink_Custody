import prisma from '../src/config/db.js';
import { linkAssetWithMetadata } from '../src/modules/asset-linking/asset.service.js';
import { createListing } from '../src/modules/marketplace/listing.service.js';
import { convertUsdToEth } from '../src/utils/price.js';
import { CustodyStatus } from '../src/enums/custodyStatus.js';
import logger from '../src/utils/logger.js';

async function verify() {
    const assetId = `TEST-PRICE-${Date.now()}`;
    const actor = 'system-verify';
    const tenantId = '023c9c2f-286c-42b3-9ffc-d0874413e6bf';

    console.log(`--- Verifying Price Conversion for Asset: ${assetId} ---`);

    // 1. Link Asset with USD Price
    const metadata = {
        assetType: 'WATCH',
        assetName: 'Verification Rolex',
        estimatedValue: '10000',
        currency: 'USD'
    };

    console.log('Linking asset with USD 10000...');
    const linkResult = await linkAssetWithMetadata(assetId, metadata, actor, { tenantId });

    console.log('Asset Metadata stored:', {
        estimatedValue: linkResult.metadata.estimatedValue,
        estimatedValueUsd: linkResult.metadata.estimatedValueUsd,
        estimatedValueEth: linkResult.metadata.estimatedValueEth
    });

    if (linkResult.metadata.estimatedValueEth === convertUsdToEth('10000')) {
        console.log('✅ Asset ETH conversion successful');
    } else {
        console.error('❌ Asset ETH conversion failed');
    }

    // 2. Mock Minting (to create listing)
    await prisma.custodyRecord.update({
        where: { assetId },
        data: { status: 'MINTED' }
    });

    // 3. Create Listing with USD Price
    const listingData = {
        assetId,
        price: '12000',
        currency: 'USD',
        expiryDate: new Date(Date.now() + 86400000).toISOString(),
        quantity: '1'
    };

    console.log('\nCreating listing with USD 12000...');
    const listing = await createListing(listingData, 'seller-123', { tenantId });

    console.log('Listing stored:', {
        price: listing.price,
        priceUsd: listing.priceUsd,
        priceEth: listing.priceEth
    });

    if (listing.priceEth === convertUsdToEth('12000')) {
        console.log('✅ Listing ETH conversion successful');
    } else {
        console.error('❌ Listing ETH conversion failed');
    }

    // Cleanup
    console.log('\nCleaning up test data...');
    await prisma.bid.deleteMany({ where: { listing: { assetId } } });
    await prisma.listing.deleteMany({ where: { assetId } });
    await prisma.ownership.deleteMany({ where: { assetId } });
    await prisma.assetMetadata.deleteMany({ where: { custodyRecord: { assetId } } });
    await prisma.custodyRecord.delete({ where: { assetId } });
    console.log('Cleanup complete.');
}

verify().catch(console.error).finally(() => process.exit());
