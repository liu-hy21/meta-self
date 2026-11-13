-- AlterTable
ALTER TABLE `FinanceLargeExpense`
    ADD COLUMN `type` ENUM('TRAVEL', 'ITEM', 'OUTFIT', 'DATE') NOT NULL DEFAULT 'ITEM';
