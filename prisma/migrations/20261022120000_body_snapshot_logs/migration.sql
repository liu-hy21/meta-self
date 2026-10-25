CREATE TABLE `BodyMeasureLog` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `logDate` DATE NOT NULL,
    `weightKg` DOUBLE NULL,
    `bodyFatPct` DOUBLE NULL,
    `chestCm` DOUBLE NULL,
    `waistCm` DOUBLE NULL,
    `thighCm` DOUBLE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `BodyMeasureLog_userId_logDate_idx`(`userId`, `logDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `BodyExamLog` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `logDate` DATE NOT NULL,
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
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `BodyExamLog_userId_logDate_idx`(`userId`, `logDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `BodyMeasureLog` ADD CONSTRAINT `BodyMeasureLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `BodyExamLog` ADD CONSTRAINT `BodyExamLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO `BodyMeasureLog` (`id`, `userId`, `logDate`, `weightKg`, `chestCm`, `waistCm`, `thighCm`, `createdAt`)
SELECT REPLACE(UUID(), '-', ''), `userId`, DATE(`updatedAt`), `weightKg`, `chestCm`, `waistCm`, `thighCm`, `updatedAt`
FROM `BodyProfile`
WHERE `weightKg` IS NOT NULL OR `chestCm` IS NOT NULL OR `waistCm` IS NOT NULL OR `thighCm` IS NOT NULL;

INSERT INTO `BodyExamLog` (
    `id`, `userId`, `logDate`,
    `heart`, `lung`, `liver`, `gallbladder`, `spleen`, `kidney`, `thyroid`,
    `wbc`, `rbc`, `hemoglobin`, `platelets`,
    `urineProtein`, `urineGlucose`, `urineBlood`,
    `glucose`, `uricAcid`, `cholesterol`, `triglycerides`, `ldl`, `alt`, `creatinine`,
    `systolic`, `diastolic`, `restingHeartRate`, `createdAt`
)
SELECT
    REPLACE(UUID(), '-', ''), `userId`, COALESCE(DATE(`examDate`), DATE(`updatedAt`)),
    `heart`, `lung`, `liver`, `gallbladder`, `spleen`, `kidney`, `thyroid`,
    `wbc`, `rbc`, `hemoglobin`, `platelets`,
    `urineProtein`, `urineGlucose`, `urineBlood`,
    `glucose`, `uricAcid`, `cholesterol`, `triglycerides`, `ldl`, `alt`, `creatinine`,
    `systolic`, `diastolic`, `restingHeartRate`, `updatedAt`
FROM `BodyExam`;
