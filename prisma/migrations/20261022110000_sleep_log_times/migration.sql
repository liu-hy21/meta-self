-- AlterTable
ALTER TABLE `SleepLog` ADD COLUMN `logDate` DATE NULL,
    ADD COLUMN `sleepStart` VARCHAR(191) NULL,
    ADD COLUMN `wakeTime` VARCHAR(191) NULL;

UPDATE `SleepLog` SET `logDate` = DATE(`occurredAt`) WHERE `logDate` IS NULL;

CREATE INDEX `SleepLog_userId_logDate_idx` ON `SleepLog`(`userId`, `logDate`);
