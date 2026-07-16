/*
  Warnings:

  - You are about to alter the column `type` on the `leave` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(1))`.

*/
-- AlterTable
ALTER TABLE `leave` ADD COLUMN `dayType` ENUM('FULL', 'HALF') NOT NULL DEFAULT 'FULL',
    MODIFY `type` ENUM('ANNUAL', 'CASUAL', 'SICK', 'UNPAID', 'WFH', 'OTHER') NOT NULL;
