-- AlterTable
ALTER TABLE `notification` ADD COLUMN `deletedAt` DATETIME(3) NULL;

-- CreateIndex
CREATE INDEX `Notification_userId_deletedAt_idx` ON `Notification`(`userId`, `deletedAt`);
