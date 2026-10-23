-- AlterTable
ALTER TABLE `registry_patient` ADD COLUMN `centerId` VARCHAR(191) NULL,
    ADD COLUMN `consentCentre` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `mrn` VARCHAR(40) NULL,
    ADD COLUMN `sharedAt` DATETIME(3) NULL,
    ADD COLUMN `sharedWithNvar` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX `registry_patient_centerId_createdAt_idx` ON `registry_patient`(`centerId`, `createdAt`);

-- CreateIndex
CREATE UNIQUE INDEX `registry_patient_centerId_mrn_key` ON `registry_patient`(`centerId`, `mrn`);

-- AddForeignKey
ALTER TABLE `registry_patient` ADD CONSTRAINT `registry_patient_centerId_fkey` FOREIGN KEY (`centerId`) REFERENCES `center`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

