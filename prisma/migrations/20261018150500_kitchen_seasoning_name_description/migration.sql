-- AlterTable
CREATE INDEX `KitchenSeasoning_userId_idx` ON `KitchenSeasoning`(`userId`);
ALTER TABLE `KitchenSeasoning` DROP INDEX `KitchenSeasoning_userId_category_idx`;
ALTER TABLE `KitchenSeasoning` DROP COLUMN `category`, DROP COLUMN `stock`, DROP COLUMN `location`;
ALTER TABLE `KitchenSeasoning` CHANGE `note` `description` TEXT NULL;
