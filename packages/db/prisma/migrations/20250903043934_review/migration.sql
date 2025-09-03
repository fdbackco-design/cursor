/*
  Warnings:

  - A unique constraint covering the columns `[orderId,orderItemId]` on the table `reviews` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `orderId` to the `reviews` table without a default value. This is not possible if the table is not empty.
  - Added the required column `orderItemId` to the `reviews` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `reviews_productId_userId_key` ON `reviews`;

-- AlterTable
ALTER TABLE `reviews` ADD COLUMN `orderId` VARCHAR(191) NOT NULL,
    ADD COLUMN `orderItemId` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `reviews_orderId_orderItemId_key` ON `reviews`(`orderId`, `orderItemId`);

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_orderItemId_fkey` FOREIGN KEY (`orderItemId`) REFERENCES `order_items`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
