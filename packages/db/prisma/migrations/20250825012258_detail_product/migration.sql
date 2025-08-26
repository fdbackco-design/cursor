-- AlterTable
ALTER TABLE `products` MODIFY `descriptionImages` JSON NULL;

UPDATE `products`
SET `descriptionImages` = JSON_ARRAY()
WHERE `descriptionImages` IS NULL;
