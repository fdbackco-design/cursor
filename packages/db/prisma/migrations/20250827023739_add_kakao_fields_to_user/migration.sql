/*
  Warnings:

  - You are about to drop the column `isUsed` on the `user_coupons` table. All the data in the column will be lost.
  - You are about to drop the column `usedAt` on the `user_coupons` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `user_coupons` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `coupons` ADD COLUMN `userMaxUses` INTEGER NULL;

-- AlterTable
ALTER TABLE `orders` ADD COLUMN `couponId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `user_coupons` DROP COLUMN `isUsed`,
    DROP COLUMN `usedAt`,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL,
    ADD COLUMN `usageCount` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `phoneNumber` VARCHAR(191) NULL,
    ADD COLUMN `shippingAddress` JSON NULL,
    ADD COLUMN `talkMessageAgreed` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX `users_phoneNumber_idx` ON `users`(`phoneNumber`);

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_couponId_fkey` FOREIGN KEY (`couponId`) REFERENCES `coupons`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
