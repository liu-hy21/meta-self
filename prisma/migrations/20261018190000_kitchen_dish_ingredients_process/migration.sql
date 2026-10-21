-- AlterTable
ALTER TABLE `KitchenDish` ADD COLUMN `ingredients` TEXT NULL;
ALTER TABLE `KitchenDish` ADD COLUMN `cookingProcess` TEXT NULL;

UPDATE `KitchenDish` SET `cookingProcess` = `description` WHERE `description` IS NOT NULL;

ALTER TABLE `KitchenDish` DROP COLUMN `description`;
