-- CreateTable
CREATE TABLE `FinanceLargeExpense` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(120) NOT NULL,
    `amountMinor` INTEGER NOT NULL,
    `occurredOn` DATETIME(3) NOT NULL,
    `note` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `FinanceLargeExpense_userId_occurredOn_idx`(`userId`, `occurredOn`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `FinanceLargeExpense` ADD CONSTRAINT `FinanceLargeExpense_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
