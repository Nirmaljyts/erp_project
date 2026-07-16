-- AlterTable
ALTER TABLE `leave` ADD COLUMN `rejectedById` INTEGER NULL,
    ALTER COLUMN `updatedAt` DROP DEFAULT;

-- AddForeignKey
ALTER TABLE `Leave` ADD CONSTRAINT `Leave_rejectedById_fkey` FOREIGN KEY (`rejectedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
