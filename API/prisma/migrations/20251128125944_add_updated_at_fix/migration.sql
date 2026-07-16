/*
  Warnings:

  - You are about to drop the column `reviewerId` on the `leave` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `leave` DROP FOREIGN KEY `Leave_reviewerId_fkey`;

-- AlterTable
ALTER TABLE `leave` DROP COLUMN `reviewerId`,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE `Leave` ADD CONSTRAINT `Leave_approvedById_fkey` FOREIGN KEY (`approvedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
