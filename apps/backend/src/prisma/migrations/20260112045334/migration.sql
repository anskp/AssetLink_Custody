-- AlterTable
ALTER TABLE `asset_metadata` ADD COLUMN `estimatedValueEth` VARCHAR(191) NULL,
    ADD COLUMN `estimatedValueUsd` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `listings` ADD COLUMN `priceEth` VARCHAR(191) NULL,
    ADD COLUMN `priceUsd` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `ownerships` ADD COLUMN `purchasePriceEth` VARCHAR(191) NULL,
    ADD COLUMN `purchasePriceUsd` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `listings` ADD CONSTRAINT `listings_custodyRecordId_fkey` FOREIGN KEY (`custodyRecordId`) REFERENCES `custody_records`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
