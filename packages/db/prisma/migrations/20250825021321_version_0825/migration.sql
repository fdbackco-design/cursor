/*
  Warnings:

  - A unique constraint covering the columns `[phone]` on the table `sellers` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `sellers_phone_key` ON `sellers`(`phone`);
