/*
  Warnings:

  - You are about to drop the column `addressDetail` on the `sellers` table. All the data in the column will be lost.
  - You are about to drop the column `postalCode` on the `sellers` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `sellers` DROP COLUMN `addressDetail`,
    DROP COLUMN `postalCode`;
