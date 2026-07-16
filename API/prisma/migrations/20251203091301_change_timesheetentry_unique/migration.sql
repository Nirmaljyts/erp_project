/*
  Warnings:

  - A unique constraint covering the columns `[timesheetId,projectId,clientId,description]` on the table `TimesheetEntry` will be added. If there are existing duplicate values, this will fail.

*/

-- CreateIndex
CREATE UNIQUE INDEX `TimesheetEntry_timesheetId_projectId_clientId_description_key` ON `TimesheetEntry`(`timesheetId`, `projectId`, `clientId`, `description`);
