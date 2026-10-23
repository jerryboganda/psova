-- CreateTable
CREATE TABLE `support_request` (
    `id` VARCHAR(191) NOT NULL,
    `publicCode` VARCHAR(16) NOT NULL,
    `patientId` VARCHAR(191) NOT NULL,
    `centerId` VARCHAR(191) NOT NULL,
    `treatment` VARCHAR(160) NOT NULL,
    `estimatedCostPkr` INTEGER NOT NULL,
    `blurbEn` TEXT NOT NULL,
    `blurbUr` TEXT NULL,
    `status` ENUM('SUBMITTED', 'APPROVED', 'FUNDED', 'CLOSED', 'REJECTED') NOT NULL DEFAULT 'SUBMITTED',
    `fundedPkr` INTEGER NOT NULL DEFAULT 0,
    `sponsorName` VARCHAR(120) NULL,
    `showSponsor` BOOLEAN NOT NULL DEFAULT false,
    `statusReason` TEXT NULL,
    `adminNote` TEXT NULL,
    `createdById` VARCHAR(191) NULL,
    `reviewedById` VARCHAR(191) NULL,
    `approvedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `support_request_publicCode_key`(`publicCode`),
    INDEX `support_request_status_approvedAt_idx`(`status`, `approvedAt`),
    INDEX `support_request_centerId_idx`(`centerId`),
    INDEX `support_request_patientId_idx`(`patientId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `support_request` ADD CONSTRAINT `support_request_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `registry_patient`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `support_request` ADD CONSTRAINT `support_request_centerId_fkey` FOREIGN KEY (`centerId`) REFERENCES `center`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

