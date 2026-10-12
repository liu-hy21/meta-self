-- AlterTable
ALTER TABLE `BodyProfile` ADD COLUMN `chestCm` DOUBLE NULL,
    ADD COLUMN `thighCm` DOUBLE NULL,
    ADD COLUMN `waistCm` DOUBLE NULL;

-- CreateTable
CREATE TABLE `BodyDiet` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `proteinFoods` TEXT NULL,
    `fatFoods` TEXT NULL,
    `carbFoods` TEXT NULL,
    `vitaminFoods` TEXT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `BodyDiet_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BodySleepHabit` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `durationHours` DOUBLE NULL,
    `bedtime` VARCHAR(191) NULL,
    `wakeTime` VARCHAR(191) NULL,
    `quality` VARCHAR(191) NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `BodySleepHabit_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BodyExam` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `examDate` DATETIME(3) NULL,
    `heart` VARCHAR(191) NULL,
    `lung` VARCHAR(191) NULL,
    `liver` VARCHAR(191) NULL,
    `gallbladder` VARCHAR(191) NULL,
    `spleen` VARCHAR(191) NULL,
    `kidney` VARCHAR(191) NULL,
    `thyroid` VARCHAR(191) NULL,
    `wbc` VARCHAR(191) NULL,
    `rbc` VARCHAR(191) NULL,
    `hemoglobin` VARCHAR(191) NULL,
    `platelets` VARCHAR(191) NULL,
    `urineProtein` VARCHAR(191) NULL,
    `urineGlucose` VARCHAR(191) NULL,
    `urineBlood` VARCHAR(191) NULL,
    `glucose` VARCHAR(191) NULL,
    `uricAcid` VARCHAR(191) NULL,
    `cholesterol` VARCHAR(191) NULL,
    `triglycerides` VARCHAR(191) NULL,
    `ldl` VARCHAR(191) NULL,
    `alt` VARCHAR(191) NULL,
    `creatinine` VARCHAR(191) NULL,
    `systolic` VARCHAR(191) NULL,
    `diastolic` VARCHAR(191) NULL,
    `restingHeartRate` VARCHAR(191) NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `BodyExam_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `BodyDiet` ADD CONSTRAINT `BodyDiet_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BodySleepHabit` ADD CONSTRAINT `BodySleepHabit_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BodyExam` ADD CONSTRAINT `BodyExam_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
