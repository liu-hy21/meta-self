-- CreateTable
CREATE TABLE `KitchenSeasoning` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `category` ENUM('SOY', 'VINEGAR', 'OIL', 'SALT', 'SUGAR', 'SPICE', 'SAUCE', 'OTHER') NOT NULL DEFAULT 'OTHER',
    `stock` ENUM('OK', 'LOW', 'OUT') NOT NULL DEFAULT 'OK',
    `location` VARCHAR(191) NULL,
    `note` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `KitchenSeasoning_userId_category_idx`(`userId`, `category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `KitchenSeasoning` ADD CONSTRAINT `KitchenSeasoning_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
