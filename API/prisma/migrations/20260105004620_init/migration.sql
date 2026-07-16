-- DropForeignKey
ALTER TABLE `leave` DROP FOREIGN KEY `Leave_approvedById_fkey`;

-- DropForeignKey
ALTER TABLE `leave` DROP FOREIGN KEY `Leave_rejectedById_fkey`;

-- DropForeignKey
ALTER TABLE `leave` DROP FOREIGN KEY `Leave_userId_fkey`;

-- DropForeignKey
ALTER TABLE `notification` DROP FOREIGN KEY `Notification_userId_fkey`;

-- DropForeignKey
ALTER TABLE `otpcode` DROP FOREIGN KEY `OtpCode_userId_fkey`;

-- DropForeignKey
ALTER TABLE `project` DROP FOREIGN KEY `Project_clientId_fkey`;

-- DropForeignKey
ALTER TABLE `project` DROP FOREIGN KEY `Project_managerId_fkey`;

-- DropForeignKey
ALTER TABLE `projectemployee` DROP FOREIGN KEY `ProjectEmployee_employeeId_fkey`;

-- DropForeignKey
ALTER TABLE `projectemployee` DROP FOREIGN KEY `ProjectEmployee_projectId_fkey`;

-- DropForeignKey
ALTER TABLE `timesheetdefinition` DROP FOREIGN KEY `TimesheetDefinition_projectId_fkey`;

-- DropForeignKey
ALTER TABLE `timesheetentry` DROP FOREIGN KEY `TimesheetEntry_clientId_fkey`;

-- DropForeignKey
ALTER TABLE `timesheetentry` DROP FOREIGN KEY `TimesheetEntry_projectId_fkey`;

-- DropForeignKey
ALTER TABLE `timesheetentry` DROP FOREIGN KEY `TimesheetEntry_timesheetId_fkey`;

-- DropForeignKey
ALTER TABLE `timesheetweek` DROP FOREIGN KEY `TimesheetWeek_approverId_fkey`;

-- DropForeignKey
ALTER TABLE `timesheetweek` DROP FOREIGN KEY `TimesheetWeek_userId_fkey`;

-- DropForeignKey
ALTER TABLE `user` DROP FOREIGN KEY `User_managerId_fkey`;

-- AddForeignKey
ALTER TABLE `user` ADD CONSTRAINT `user_managerId_fkey` FOREIGN KEY (`managerId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project` ADD CONSTRAINT `project_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `client`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project` ADD CONSTRAINT `project_managerId_fkey` FOREIGN KEY (`managerId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `projectemployee` ADD CONSTRAINT `projectemployee_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `project`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `projectemployee` ADD CONSTRAINT `projectemployee_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `otpcode` ADD CONSTRAINT `otpcode_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leave` ADD CONSTRAINT `leave_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leave` ADD CONSTRAINT `leave_approvedById_fkey` FOREIGN KEY (`approvedById`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leave` ADD CONSTRAINT `leave_rejectedById_fkey` FOREIGN KEY (`rejectedById`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `timesheetweek` ADD CONSTRAINT `timesheetweek_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `timesheetweek` ADD CONSTRAINT `timesheetweek_approverId_fkey` FOREIGN KEY (`approverId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `timesheetentry` ADD CONSTRAINT `timesheetentry_timesheetId_fkey` FOREIGN KEY (`timesheetId`) REFERENCES `timesheetweek`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `timesheetentry` ADD CONSTRAINT `timesheetentry_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `project`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `timesheetentry` ADD CONSTRAINT `timesheetentry_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `client`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `timesheetdefinition` ADD CONSTRAINT `timesheetdefinition_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `project`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notification` ADD CONSTRAINT `notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `holiday` RENAME INDEX `Holiday_date_name_key` TO `holiday_date_name_key`;

-- RenameIndex
ALTER TABLE `notification` RENAME INDEX `Notification_userId_deletedAt_idx` TO `notification_userId_deletedAt_idx`;

-- RenameIndex
ALTER TABLE `notification` RENAME INDEX `Notification_userId_isRead_idx` TO `notification_userId_isRead_idx`;

-- RenameIndex
ALTER TABLE `projectemployee` RENAME INDEX `ProjectEmployee_projectId_employeeId_key` TO `projectemployee_projectId_employeeId_key`;

-- RenameIndex
ALTER TABLE `timesheetdefinition` RENAME INDEX `TimesheetDefinition_type_description_appliesTo_key` TO `timesheetdefinition_type_description_appliesTo_key`;

-- RenameIndex
ALTER TABLE `timesheetdefinition` RENAME INDEX `TimesheetDefinition_type_projectId_key` TO `timesheetdefinition_type_projectId_key`;

-- RenameIndex
ALTER TABLE `timesheetentry` RENAME INDEX `TimesheetEntry_timesheetId_rowKey_key` TO `timesheetentry_timesheetId_rowKey_key`;

-- RenameIndex
ALTER TABLE `timesheetweek` RENAME INDEX `TimesheetWeek_userId_weekStartDate_key` TO `timesheetweek_userId_weekStartDate_key`;

-- RenameIndex
ALTER TABLE `user` RENAME INDEX `User_email_key` TO `user_email_key`;
