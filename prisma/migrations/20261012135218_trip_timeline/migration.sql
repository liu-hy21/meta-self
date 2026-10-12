/*
  Warnings:

  - You are about to drop the column `travel` on the `PlayProfile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `PlayProfile` DROP COLUMN `travel`;

-- CreateTable
CREATE TABLE `Trip` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `traveler` VARCHAR(191) NULL,
    `note` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Trip_userId_createdAt_idx`(`userId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TripEntry` (
    `id` VARCHAR(191) NOT NULL,
    `tripId` VARCHAR(191) NOT NULL,
    `sortAt` DATETIME(3) NOT NULL,
    `kind` VARCHAR(191) NOT NULL,
    `origin` VARCHAR(191) NULL,
    `destination` VARCHAR(191) NULL,
    `flightNo` VARCHAR(191) NULL,
    `cabin` VARCHAR(191) NULL,
    `departTime` VARCHAR(191) NULL,
    `arriveTime` VARCHAR(191) NULL,
    `terminal` VARCHAR(191) NULL,
    `fareCents` INTEGER NULL,
    `taxCents` INTEGER NULL,
    `totalCents` INTEGER NULL,
    `baggage` TEXT NULL,
    `remark` TEXT NULL,
    `hotelName` VARCHAR(191) NULL,
    `checkIn` DATETIME(3) NULL,
    `checkOut` DATETIME(3) NULL,
    `nights` INTEGER NULL,
    `paidCents` INTEGER NULL,
    `includes` VARCHAR(191) NULL,
    `happenedOn` DATETIME(3) NULL,
    `timeLabel` VARCHAR(191) NULL,
    `body` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `TripEntry_tripId_sortAt_idx`(`tripId`, `sortAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Trip` ADD CONSTRAINT `Trip_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TripEntry` ADD CONSTRAINT `TripEntry_tripId_fkey` FOREIGN KEY (`tripId`) REFERENCES `Trip`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
