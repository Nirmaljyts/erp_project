/*
  Warnings:

  - You are about to drop the column `entryDate` on the `timesheetentry` table. All the data in the column will be lost.
  - You are about to drop the column `hours` on the `timesheetentry` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[timesheetId,projectId,clientId]` on the table `TimesheetEntry` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `timesheetentry` DROP COLUMN `entryDate`,
    DROP COLUMN `hours`,
    ADD COLUMN `fri` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `mon` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `sat` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `sun` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `thu` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `tue` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `wed` DOUBLE NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX `TimesheetEntry_timesheetId_projectId_clientId_key` ON `TimesheetEntry`(`timesheetId`, `projectId`, `clientId`);
