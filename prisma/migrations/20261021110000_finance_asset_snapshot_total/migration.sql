-- Normalize snapshot date to calendar day, add holdings snapshot fields
ALTER TABLE `FinanceAssetSnapshot` ADD COLUMN `totalCnyMinor` INTEGER NOT NULL DEFAULT 0;
ALTER TABLE `FinanceAssetSnapshot` ADD COLUMN `holdingsJson` JSON NULL;

UPDATE `FinanceAssetSnapshot` SET `asOfDate` = DATE(`asOfDate`);

ALTER TABLE `FinanceAssetSnapshot` MODIFY `asOfDate` DATE NOT NULL;

-- Drop duplicate (userId, asOfDate) rows, keep latest createdAt
DELETE t1 FROM `FinanceAssetSnapshot` t1
INNER JOIN `FinanceAssetSnapshot` t2
  ON t1.`userId` = t2.`userId` AND t1.`asOfDate` = t2.`asOfDate` AND t1.`createdAt` < t2.`createdAt`;

CREATE UNIQUE INDEX `FinanceAssetSnapshot_userId_asOfDate_key` ON `FinanceAssetSnapshot`(`userId`, `asOfDate`);
