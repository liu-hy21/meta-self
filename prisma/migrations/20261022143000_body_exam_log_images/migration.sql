CREATE TABLE `BodyExamLogImage` (
    `id` VARCHAR(191) NOT NULL,
    `examLogId` VARCHAR(191) NOT NULL,
    `storedName` VARCHAR(191) NOT NULL,
    `originalName` VARCHAR(191) NOT NULL,
    `mime` VARCHAR(191) NOT NULL,
    `sizeBytes` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `BodyExamLogImage_examLogId_idx`(`examLogId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `BodyExamLogImage` ADD CONSTRAINT `BodyExamLogImage_examLogId_fkey` FOREIGN KEY (`examLogId`) REFERENCES `BodyExamLog`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `BodyExamLog`
    DROP COLUMN `heart`,
    DROP COLUMN `lung`,
    DROP COLUMN `liver`,
    DROP COLUMN `gallbladder`,
    DROP COLUMN `spleen`,
    DROP COLUMN `kidney`,
    DROP COLUMN `thyroid`,
    DROP COLUMN `wbc`,
    DROP COLUMN `rbc`,
    DROP COLUMN `hemoglobin`,
    DROP COLUMN `platelets`,
    DROP COLUMN `urineProtein`,
    DROP COLUMN `urineGlucose`,
    DROP COLUMN `urineBlood`,
    DROP COLUMN `glucose`,
    DROP COLUMN `uricAcid`,
    DROP COLUMN `cholesterol`,
    DROP COLUMN `triglycerides`,
    DROP COLUMN `ldl`,
    DROP COLUMN `alt`,
    DROP COLUMN `creatinine`,
    DROP COLUMN `systolic`,
    DROP COLUMN `diastolic`,
    DROP COLUMN `restingHeartRate`;
