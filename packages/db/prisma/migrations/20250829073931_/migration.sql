/*
  Warnings:

  - You are about to alter the column `amount` on the `payments` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Int`.
  - You are about to alter the column `method` on the `payments` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(6))` to `VarChar(191)`.
  - A unique constraint covering the columns `[orderId]` on the table `payments` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[paymentKey]` on the table `payments` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `customerId` to the `payments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customerKey` to the `payments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `orderName` to the `payments` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `payments` DROP FOREIGN KEY `payments_orderId_fkey`;

-- AlterTable
ALTER TABLE `payments` ADD COLUMN `approvedAt` DATETIME(3) NULL,
    ADD COLUMN `customerEmail` VARCHAR(191) NULL,
    ADD COLUMN `customerId` VARCHAR(191) NOT NULL,
    ADD COLUMN `customerKey` VARCHAR(191) NOT NULL,
    ADD COLUMN `customerMobilePhone` VARCHAR(191) NULL,
    ADD COLUMN `customerName` VARCHAR(191) NULL,
    ADD COLUMN `orderName` VARCHAR(191) NOT NULL,
    ADD COLUMN `paymentKey` VARCHAR(191) NULL,
    MODIFY `paymentNumber` VARCHAR(191) NULL,
    MODIFY `amount` INTEGER NOT NULL,
    MODIFY `method` VARCHAR(191) NULL,
    MODIFY `status` ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED', 'PARTIALLY_CANCELLED') NOT NULL DEFAULT 'PENDING',
    MODIFY `idempotencyKey` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `payments_orderId_key` ON `payments`(`orderId`);

-- CreateIndex
CREATE UNIQUE INDEX `payments_paymentKey_key` ON `payments`(`paymentKey`);

-- CreateIndex
CREATE INDEX `payments_customerId_idx` ON `payments`(`customerId`);

-- CreateIndex
CREATE INDEX `payments_status_idx` ON `payments`(`status`);

-- CreateIndex
CREATE INDEX `payments_createdAt_idx` ON `payments`(`createdAt`);

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
