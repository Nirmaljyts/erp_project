/*
  Warnings:

  - A unique constraint covering the columns `[timesheetId,rowKey]` on the table `TimesheetEntry` will be added. If there are existing duplicate values, this will fail.
  - Made the column `rowKey` on table `timesheetentry` required. This step will fail if there are existing NULL values in that column.

*/

-- AlterTable
ALTER TABLE `timesheetentry` MODIFY `rowKey` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `TimesheetEntry_timesheetId_rowKey_key` ON `TimesheetEntry`(`timesheetId`, `rowKey`);
