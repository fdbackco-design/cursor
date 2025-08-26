/*
  Warnings:

  - You are about to drop the column `barcode` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `sellerId` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `discountPercent` on the `referral_codes` table. All the data in the column will be lost.
  - You are about to drop the column `expiresAt` on the `referral_codes` table. All the data in the column will be lost.
  - You are about to drop the column `maxUses` on the `referral_codes` table. All the data in the column will be lost.
  - You are about to drop the column `businessNumber` on the `sellers` table. All the data in the column will be lost.
  - You are about to drop the column `city` on the `sellers` table. All the data in the column will be lost.
  - You are about to drop the column `country` on the `sellers` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `products` DROP FOREIGN KEY `products_sellerId_fkey`;

-- DropIndex
DROP INDEX `sellers_businessNumber_key` ON `sellers`;

-- AlterTable
ALTER TABLE `products` DROP COLUMN `barcode`,
    DROP COLUMN `sellerId`,
    ADD COLUMN `vendorId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `referral_codes` DROP COLUMN `discountPercent`,
    DROP COLUMN `expiresAt`,
    DROP COLUMN `maxUses`;

-- AlterTable
ALTER TABLE `returns` MODIFY `refundAmount` DECIMAL(12, 2) NULL;

-- AlterTable
ALTER TABLE `sellers` DROP COLUMN `businessNumber`,
    DROP COLUMN `city`,
    DROP COLUMN `country`;

-- AlterTable
ALTER TABLE `users` MODIFY `role` ENUM('BIZ', 'CONSUMER', 'ADMIN') NOT NULL DEFAULT 'CONSUMER';

-- CreateTable
CREATE TABLE `vendors` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `cutoffTime` VARCHAR(191) NULL,
    `notes` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `vendors_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `products_vendorId_idx` ON `products`(`vendorId`);

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
