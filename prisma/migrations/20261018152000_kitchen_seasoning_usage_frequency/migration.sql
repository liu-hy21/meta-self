-- AlterTable
ALTER TABLE `KitchenSeasoning` ADD COLUMN `usageFrequency` ENUM('HIGH', 'MEDIUM', 'LOW') NOT NULL DEFAULT 'MEDIUM';
