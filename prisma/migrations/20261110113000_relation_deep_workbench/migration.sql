CREATE TABLE IF NOT EXISTS `RelationChatArchive` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `personId` VARCHAR(191) NOT NULL,
  `sourceType` VARCHAR(191) NOT NULL,
  `sourceKey` VARCHAR(191) NOT NULL,
  `archivePath` TEXT NOT NULL,
  `periodStart` DATETIME(3) NOT NULL,
  `periodEnd` DATETIME(3) NOT NULL,
  `messageCount` INT NOT NULL,
  `importedAt` DATETIME(3) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `RelationChatArchive_userId_sourceType_sourceKey_key` (`userId`, `sourceType`, `sourceKey`),
  KEY `RelationChatArchive_userId_personId_idx` (`userId`, `personId`),
  CONSTRAINT `RelationChatArchive_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `RelationChatArchive_personId_fkey` FOREIGN KEY (`personId`) REFERENCES `RelationPerson` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `RelationAiReport` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `personId` VARCHAR(191) NOT NULL,
  `periodStart` DATETIME(3) NOT NULL,
  `periodEnd` DATETIME(3) NOT NULL,
  `model` VARCHAR(191) NOT NULL,
  `status` VARCHAR(191) NOT NULL,
  `contentMarkdown` LONGTEXT NOT NULL,
  `evidenceJson` JSON NOT NULL,
  `errorMessage` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `completedAt` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  KEY `RelationAiReport_userId_personId_createdAt_idx` (`userId`, `personId`, `createdAt`),
  CONSTRAINT `RelationAiReport_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `RelationAiReport_personId_fkey` FOREIGN KEY (`personId`) REFERENCES `RelationPerson` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
