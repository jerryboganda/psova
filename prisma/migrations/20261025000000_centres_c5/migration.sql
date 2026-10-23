-- AlterTable
ALTER TABLE `registry_treatment` ADD COLUMN `complications` TEXT NULL,
    ADD COLUMN `date` DATETIME(3) NULL,
    ADD COLUMN `dose` VARCHAR(120) NULL,
    ADD COLUMN `drug` VARCHAR(120) NULL,
    ADD COLUMN `encounterId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `appointment` (
    `id` VARCHAR(191) NOT NULL,
    `patientId` VARCHAR(191) NOT NULL,
    `centerId` VARCHAR(191) NOT NULL,
    `startsAt` DATETIME(3) NOT NULL,
    `kind` ENUM('FIRST_VISIT', 'FOLLOW_UP', 'PROCEDURE') NOT NULL DEFAULT 'FOLLOW_UP',
    `status` ENUM('SCHEDULED', 'DONE', 'MISSED', 'CANCELLED') NOT NULL DEFAULT 'SCHEDULED',
    `note` TEXT NULL,
    `createdById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `appointment_centerId_startsAt_idx`(`centerId`, `startsAt`),
    INDEX `appointment_patientId_idx`(`patientId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `encounter` (
    `id` VARCHAR(191) NOT NULL,
    `patientId` VARCHAR(191) NOT NULL,
    `centerId` VARCHAR(191) NOT NULL,
    `authorId` VARCHAR(191) NULL,
    `date` DATETIME(3) NOT NULL,
    `notes` TEXT NULL,
    `lesionSizeCm` DOUBLE NULL,
    `painScore` INTEGER NULL,
    `responseScore` ENUM('WORSE', 'STABLE', 'PARTIAL', 'COMPLETE') NULL,
    `plan` TEXT NULL,
    `nextReviewDate` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `encounter_patientId_date_idx`(`patientId`, `date`),
    INDEX `encounter_centerId_idx`(`centerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `registry_treatment` ADD CONSTRAINT `registry_treatment_encounterId_fkey` FOREIGN KEY (`encounterId`) REFERENCES `encounter`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `appointment` ADD CONSTRAINT `appointment_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `registry_patient`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `appointment` ADD CONSTRAINT `appointment_centerId_fkey` FOREIGN KEY (`centerId`) REFERENCES `center`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `encounter` ADD CONSTRAINT `encounter_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `registry_patient`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `encounter` ADD CONSTRAINT `encounter_centerId_fkey` FOREIGN KEY (`centerId`) REFERENCES `center`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `encounter` ADD CONSTRAINT `encounter_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

