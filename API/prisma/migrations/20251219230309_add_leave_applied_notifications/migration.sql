/*
  Warnings:

  - The values [LEAVE_APPLIED] on the enum `Notification_type` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `notification` MODIFY `type` ENUM('LEAVE_REQUESTED', 'LEAVE_APPROVED', 'LEAVE_REJECTED', 'LEAVE_DELETED', 'TIMESHEET_SUBMITTED', 'TIMESHEET_APPROVED', 'TIMESHEET_REJECTED', 'REMINDER', 'SLA_BREACH') NOT NULL;
