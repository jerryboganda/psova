-- CreateTable
CREATE TABLE `patient_document` (
    `id` VARCHAR(191) NOT NULL,
    `patientId` VARCHAR(191) NOT NULL,
    `centerId` VARCHAR(191) NOT NULL,
    `kind` ENUM('PHOTO', 'REPORT', 'IMAGING', 'OTHER') NOT NULL,
    `fileName` TEXT NOT NULL,
    `mime` VARCHAR(40) NOT NULL,
    `size` INTEGER NOT NULL,
    `storageKey` VARCHAR(64) NOT NULL,
    `consentForTeaching` BOOLEAN NOT NULL DEFAULT false,
    `uploadedById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `patient_document_storageKey_key`(`storageKey`),
    INDEX `patient_document_patientId_idx`(`patientId`),
    INDEX `patient_document_centerId_idx`(`centerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `patient_document` ADD CONSTRAINT `patient_document_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `registry_patient`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `patient_document` ADD CONSTRAINT `patient_document_centerId_fkey` FOREIGN KEY (`centerId`) REFERENCES `center`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

