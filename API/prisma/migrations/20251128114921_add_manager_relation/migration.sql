-- DropIndex
DROP INDEX `Leave_approvedById_fkey` ON `leave`;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `managerId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_managerId_fkey` FOREIGN KEY (`managerId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
