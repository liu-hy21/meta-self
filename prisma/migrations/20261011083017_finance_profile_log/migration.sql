-- CreateTable
CREATE TABLE `FinanceProfile` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `cashCents` INTEGER NULL,
    `investmentCents` INTEGER NULL,
    `liabilityCents` INTEGER NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `FinanceProfile_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FinanceInfoLog` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `writtenOn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `learned` TEXT NULL,
    `decision` TEXT NULL,
    `outcome` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `FinanceInfoLog_userId_writtenOn_idx`(`userId`, `writtenOn`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `FinanceProfile` ADD CONSTRAINT `FinanceProfile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FinanceInfoLog` ADD CONSTRAINT `FinanceInfoLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
