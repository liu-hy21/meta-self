-- CreateTable
CREATE TABLE `BodyInfoLog` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `writtenOn` DATE NOT NULL,
    `body` TEXT NULL,
    `diet` TEXT NULL,
    `sleep` TEXT NULL,
    `exam` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `BodyInfoLog_userId_writtenOn_idx`(`userId`, `writtenOn`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `BodyInfoLog` ADD CONSTRAINT `BodyInfoLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
