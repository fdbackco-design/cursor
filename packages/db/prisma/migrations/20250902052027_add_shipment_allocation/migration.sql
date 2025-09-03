-- DropForeignKey
ALTER TABLE `shipments` DROP FOREIGN KEY `shipments_orderId_fkey`;

-- CreateTable
CREATE TABLE `shipment_allocations` (
    `id` VARCHAR(191) NOT NULL,
    `shipmentId` VARCHAR(191) NOT NULL,
    `orderItemId` VARCHAR(191) NOT NULL,
    `qty` INTEGER NOT NULL DEFAULT 1,

    INDEX `ix_shipment_allocations__order_item`(`orderItemId`),
    INDEX `ix_shipment_allocations__shipment`(`shipmentId`),
    UNIQUE INDEX `shipment_allocations_shipmentId_orderItemId_key`(`shipmentId`, `orderItemId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `shipments_carrier_idx` ON `shipments`(`carrier`);

-- AddForeignKey
ALTER TABLE `shipments` ADD CONSTRAINT `fk_shipments__order` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shipment_allocations` ADD CONSTRAINT `fk_shipment_allocations__shipment` FOREIGN KEY (`shipmentId`) REFERENCES `shipments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shipment_allocations` ADD CONSTRAINT `fk_shipment_allocations__order_item` FOREIGN KEY (`orderItemId`) REFERENCES `order_items`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
