/*
  Warnings:

  - A unique constraint covering the columns `[type,projectId]` on the table `TimesheetDefinition` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `timesheetdefinition` MODIFY `appliesTo` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `TimesheetDefinition_type_projectId_key` ON `TimesheetDefinition`(`type`, `projectId`);
