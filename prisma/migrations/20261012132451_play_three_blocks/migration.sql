/*
  Warnings:

  - You are about to drop the column `playing` on the `PlayProfile` table. All the data in the column will be lost.
  - You are about to drop the column `stopped` on the `PlayProfile` table. All the data in the column will be lost.
  - You are about to drop the column `wanting` on the `PlayProfile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `PlayProfile` DROP COLUMN `playing`,
    DROP COLUMN `stopped`,
    DROP COLUMN `wanting`,
    ADD COLUMN `districts` TEXT NULL,
    ADD COLUMN `projects` TEXT NULL,
    ADD COLUMN `travel` TEXT NULL;
