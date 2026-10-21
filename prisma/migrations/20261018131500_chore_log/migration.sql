-- CreateTable
CREATE TABLE `ChoreLog` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `cadence` ENUM('DAILY', 'WEEKLY', 'MONTHLY') NOT NULL,
    `text` TEXT NOT NULL,
    `doneOn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ChoreLog_userId_cadence_doneOn_idx`(`userId`, `cadence`, `doneOn`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ChoreLog` ADD CONSTRAINT `ChoreLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
