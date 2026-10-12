-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `displayName` VARCHAR(191) NULL,
    `timezone` VARCHAR(191) NOT NULL DEFAULT 'Asia/Shanghai',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BodyProfile` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `heightCm` DOUBLE NULL,
    `weightKg` DOUBLE NULL,
    `birthDate` DATETIME(3) NULL,
    `gender` VARCHAR(191) NULL,
    `bloodType` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `BodyProfile_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VitalMetric` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `value` VARCHAR(191) NOT NULL,
    `unit` VARCHAR(191) NULL,
    `measuredAt` DATETIME(3) NOT NULL,
    `source` ENUM('MANUAL', 'PASTE') NOT NULL DEFAULT 'MANUAL',
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `VitalMetric_userId_measuredAt_idx`(`userId`, `measuredAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SleepLog` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `occurredAt` DATETIME(3) NOT NULL,
    `durationHours` DOUBLE NOT NULL,
    `note` TEXT NULL,
    `source` ENUM('MANUAL', 'PASTE') NOT NULL DEFAULT 'MANUAL',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SleepLog_userId_occurredAt_idx`(`userId`, `occurredAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MealLog` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `occurredAt` DATETIME(3) NOT NULL,
    `description` TEXT NOT NULL,
    `satiety` INTEGER NULL,
    `source` ENUM('MANUAL', 'PASTE') NOT NULL DEFAULT 'MANUAL',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `MealLog_userId_occurredAt_idx`(`userId`, `occurredAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MoodLog` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `calendarDate` DATE NOT NULL,
    `occurredAt` DATETIME(3) NULL,
    `score` INTEGER NOT NULL,
    `note` TEXT NULL,
    `source` ENUM('MANUAL', 'PASTE') NOT NULL DEFAULT 'MANUAL',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `MoodLog_userId_calendarDate_idx`(`userId`, `calendarDate`),
    UNIQUE INDEX `MoodLog_userId_calendarDate_key`(`userId`, `calendarDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WorkCompanySnapshot` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `companyName` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NULL,
    `note` TEXT NULL,
    `effectiveAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `isCurrent` BOOLEAN NOT NULL DEFAULT true,

    INDEX `WorkCompanySnapshot_userId_isCurrent_idx`(`userId`, `isCurrent`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TechStackItem` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `status` ENUM('PROFICIENT', 'LEARNING', 'DEPRECATED') NOT NULL,
    `note` TEXT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `TechStackItem_userId_name_key`(`userId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ExpressionReview` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `occurredAt` DATETIME(3) NOT NULL,
    `context` TEXT NOT NULL,
    `outcome` TEXT NULL,
    `nextImprovement` TEXT NULL,
    `source` ENUM('MANUAL', 'PASTE') NOT NULL DEFAULT 'MANUAL',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ExpressionReview_userId_occurredAt_idx`(`userId`, `occurredAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RelationPerson` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `note` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RelationPersonKind` (
    `personId` VARCHAR(191) NOT NULL,
    `kind` ENUM('FRIEND', 'ROMANCE', 'FAMILY', 'OTHER') NOT NULL,

    PRIMARY KEY (`personId`, `kind`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RelationInteraction` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `personId` VARCHAR(191) NOT NULL,
    `occurredAt` DATETIME(3) NOT NULL,
    `note` TEXT NOT NULL,
    `feelingScore` INTEGER NOT NULL,
    `source` ENUM('MANUAL', 'PASTE') NOT NULL DEFAULT 'MANUAL',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `RelationInteraction_userId_occurredAt_idx`(`userId`, `occurredAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FinanceAssetSnapshot` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `asOfDate` DATETIME(3) NOT NULL,
    `cashCents` INTEGER NOT NULL DEFAULT 0,
    `investmentCents` INTEGER NOT NULL DEFAULT 0,
    `liabilityCents` INTEGER NOT NULL DEFAULT 0,
    `note` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `FinanceAssetSnapshot_userId_asOfDate_idx`(`userId`, `asOfDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FinanceLiteracyLog` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `occurredAt` DATETIME(3) NOT NULL,
    `kind` ENUM('LEARNING', 'DECISION') NOT NULL,
    `content` TEXT NOT NULL,
    `outcomeNote` TEXT NULL,
    `source` ENUM('MANUAL', 'PASTE') NOT NULL DEFAULT 'MANUAL',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `FinanceLiteracyLog_userId_occurredAt_idx`(`userId`, `occurredAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Report` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` ENUM('BIWEEKLY', 'MONTHLY') NOT NULL,
    `periodStart` DATETIME(3) NOT NULL,
    `periodEnd` DATETIME(3) NOT NULL,
    `status` ENUM('DRAFT', 'FINALIZED') NOT NULL DEFAULT 'DRAFT',
    `title` VARCHAR(191) NOT NULL,
    `contentMarkdown` LONGTEXT NOT NULL,
    `citationsJson` JSON NOT NULL,
    `generatedBy` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `finalizedAt` DATETIME(3) NULL,

    INDEX `Report_userId_type_periodStart_idx`(`userId`, `type`, `periodStart`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ReportSchedule` (
    `userId` VARCHAR(191) NOT NULL,
    `lastBiweeklyAt` DATETIME(3) NULL,
    `lastMonthlyAt` DATETIME(3) NULL,
    `nextBiweeklyDue` DATETIME(3) NULL,
    `nextMonthlyDue` DATETIME(3) NULL,

    PRIMARY KEY (`userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `BodyProfile` ADD CONSTRAINT `BodyProfile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VitalMetric` ADD CONSTRAINT `VitalMetric_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SleepLog` ADD CONSTRAINT `SleepLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MealLog` ADD CONSTRAINT `MealLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MoodLog` ADD CONSTRAINT `MoodLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WorkCompanySnapshot` ADD CONSTRAINT `WorkCompanySnapshot_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TechStackItem` ADD CONSTRAINT `TechStackItem_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExpressionReview` ADD CONSTRAINT `ExpressionReview_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RelationPerson` ADD CONSTRAINT `RelationPerson_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RelationPersonKind` ADD CONSTRAINT `RelationPersonKind_personId_fkey` FOREIGN KEY (`personId`) REFERENCES `RelationPerson`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RelationInteraction` ADD CONSTRAINT `RelationInteraction_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RelationInteraction` ADD CONSTRAINT `RelationInteraction_personId_fkey` FOREIGN KEY (`personId`) REFERENCES `RelationPerson`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FinanceAssetSnapshot` ADD CONSTRAINT `FinanceAssetSnapshot_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FinanceLiteracyLog` ADD CONSTRAINT `FinanceLiteracyLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Report` ADD CONSTRAINT `Report_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReportSchedule` ADD CONSTRAINT `ReportSchedule_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
