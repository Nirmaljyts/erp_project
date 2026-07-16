-- CreateTable
CREATE TABLE `TimesheetWeek` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `approverId` INTEGER NULL,
    `weekStartDate` DATE NOT NULL,
    `status` ENUM('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'DRAFT',
    `submittedAt` DATETIME(3) NULL,
    `decidedAt` DATETIME(3) NULL,
    `deletedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `TimesheetWeek_userId_weekStartDate_key`(`userId`, `weekStartDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TimesheetEntry` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `timesheetId` INTEGER NOT NULL,
    `projectId` INTEGER NULL,
    `clientId` INTEGER NULL,
    `entryDate` DATE NOT NULL,
    `hours` DOUBLE NOT NULL,
    `isBillable` BOOLEAN NOT NULL DEFAULT true,
    `description` VARCHAR(191) NULL,
    `deletedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `TimesheetWeek` ADD CONSTRAINT `TimesheetWeek_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TimesheetWeek` ADD CONSTRAINT `TimesheetWeek_approverId_fkey` FOREIGN KEY (`approverId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TimesheetEntry` ADD CONSTRAINT `TimesheetEntry_timesheetId_fkey` FOREIGN KEY (`timesheetId`) REFERENCES `TimesheetWeek`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TimesheetEntry` ADD CONSTRAINT `TimesheetEntry_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TimesheetEntry` ADD CONSTRAINT `TimesheetEntry_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
