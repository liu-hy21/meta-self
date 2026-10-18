-- CreateTable
CREATE TABLE `MedicalVisitLog` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `visitedOn` DATETIME(3) NOT NULL,
    `hospital` VARCHAR(191) NULL,
    `department` VARCHAR(191) NULL,
    `note` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `MedicalVisitLog_userId_visitedOn_idx`(`userId`, `visitedOn`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable
ALTER TABLE `BodyInfoLog` DROP COLUMN `medical`;

-- AddForeignKey
ALTER TABLE `MedicalVisitLog` ADD CONSTRAINT `MedicalVisitLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
