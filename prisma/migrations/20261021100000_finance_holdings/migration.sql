-- CreateTable
CREATE TABLE `FinanceHolding` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `account` ENUM('SCHWAB', 'HK_CARD', 'BANK_CARD', 'ALIPAY', 'EASTMONEY') NOT NULL,
    `amountMinor` INTEGER NOT NULL DEFAULT 0,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `FinanceHolding_userId_account_key`(`userId`, `account`),
    INDEX `FinanceHolding_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FinanceHoldingLog` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `account` ENUM('SCHWAB', 'HK_CARD', 'BANK_CARD', 'ALIPAY', 'EASTMONEY') NOT NULL,
    `previousAmountMinor` INTEGER NULL,
    `newAmountMinor` INTEGER NOT NULL,
    `totalCnyMinor` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `FinanceHoldingLog_userId_createdAt_idx`(`userId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `FinanceHolding` ADD CONSTRAINT `FinanceHolding_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FinanceHoldingLog` ADD CONSTRAINT `FinanceHoldingLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
