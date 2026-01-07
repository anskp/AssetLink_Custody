-- AlterTable
ALTER TABLE `asset_metadata` ADD COLUMN `storageType` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `asset_files` (
    `id` VARCHAR(191) NOT NULL,
    `assetMetadataId` VARCHAR(191) NOT NULL,
    `fileType` VARCHAR(191) NOT NULL,
    `filePath` VARCHAR(191) NOT NULL,
    `mimeType` VARCHAR(191) NULL,
    `uploadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `asset_files_assetMetadataId_idx`(`assetMetadataId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `asset_files` ADD CONSTRAINT `asset_files_assetMetadataId_fkey` FOREIGN KEY (`assetMetadataId`) REFERENCES `asset_metadata`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
