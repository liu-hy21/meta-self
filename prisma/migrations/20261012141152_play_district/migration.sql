/*
  Warnings:

  - You are about to drop the column `districts` on the `PlayProfile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `PlayProfile` DROP COLUMN `districts`;

-- CreateTable
CREATE TABLE `PlayDistrict` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `district` VARCHAR(191) NOT NULL,
    `project` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PlayDistrict_userId_createdAt_idx`(`userId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PlayDistrict` ADD CONSTRAINT `PlayDistrict_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
