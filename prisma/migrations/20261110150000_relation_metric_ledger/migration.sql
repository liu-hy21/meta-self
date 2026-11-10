CREATE TABLE IF NOT EXISTS `RelationMetricLedger` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `personId` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `calculation` TEXT NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `RelationMetricLedger_userId_personId_createdAt_idx` (`userId`, `personId`, `createdAt`),
  CONSTRAINT `RelationMetricLedger_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `RelationMetricLedger_personId_fkey` FOREIGN KEY (`personId`) REFERENCES `RelationPerson` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
