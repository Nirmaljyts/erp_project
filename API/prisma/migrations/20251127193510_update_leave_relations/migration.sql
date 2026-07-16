/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `leave` table. All the data in the column will be lost.
  - You are about to alter the column `type` on the `leave` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(0))` to `VarChar(191)`.
  - You are about to alter the column `status` on the `leave` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(1))` to `VarChar(191)`.

*/
-- DropForeignKey
ALTER TABLE `leave` DROP FOREIGN KEY `Leave_approvedById_fkey`;

-- AlterTable
ALTER TABLE `leave` DROP COLUMN `updatedAt`,
    ADD COLUMN `reviewerId` INTEGER NULL,
    MODIFY `type` VARCHAR(191) NOT NULL,
    MODIFY `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    MODIFY `startDate` DATETIME(3) NOT NULL,
    MODIFY `endDate` DATETIME(3) NOT NULL;

-- AddForeignKey
ALTER TABLE `Leave` ADD CONSTRAINT `Leave_reviewerId_fkey` FOREIGN KEY (`reviewerId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
