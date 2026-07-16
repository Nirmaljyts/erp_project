/*
  Warnings:

  - A unique constraint covering the columns `[type,description,appliesTo]` on the table `TimesheetDefinition` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `TimesheetEntry_timesheetId_projectId_clientId_description_key` ON `timesheetentry`;

-- CreateIndex
CREATE UNIQUE INDEX `TimesheetDefinition_type_description_appliesTo_key` ON `TimesheetDefinition`(`type`, `description`, `appliesTo`);
