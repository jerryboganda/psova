-- CreateTable
CREATE TABLE `user` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `emailVerified` BOOLEAN NOT NULL DEFAULT false,
    `image` VARCHAR(191) NULL,
    `role` VARCHAR(191) NOT NULL DEFAULT 'clinician',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `user_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `session` (
    `id` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `session_token_key`(`token`),
    INDEX `session_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `account` (
    `id` VARCHAR(191) NOT NULL,
    `accountId` VARCHAR(191) NOT NULL,
    `providerId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `accessToken` TEXT NULL,
    `refreshToken` TEXT NULL,
    `idToken` TEXT NULL,
    `accessTokenExpiresAt` DATETIME(3) NULL,
    `refreshTokenExpiresAt` DATETIME(3) NULL,
    `scope` VARCHAR(191) NULL,
    `password` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `account_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `verification` (
    `id` VARCHAR(191) NOT NULL,
    `identifier` VARCHAR(191) NOT NULL,
    `value` TEXT NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `verification_identifier_idx`(`identifier`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `registry_patient` (
    `id` VARCHAR(191) NOT NULL,
    `trackingCode` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'VERIFIED', 'REJECTED', 'DUPLICATE') NOT NULL DEFAULT 'PENDING',
    `source` ENUM('SELF', 'CLINICIAN') NOT NULL,
    `clinicianId` VARCHAR(191) NULL,
    `possibleDuplicate` BOOLEAN NOT NULL DEFAULT false,
    `duplicateOfId` VARCHAR(191) NULL,
    `publicReason` TEXT NULL,
    `internalNote` TEXT NULL,
    `verifiedAt` DATETIME(3) NULL,
    `verifiedById` VARCHAR(191) NULL,
    `fullName` TEXT NOT NULL,
    `guardianName` TEXT NULL,
    `cnic` TEXT NOT NULL,
    `phone` TEXT NOT NULL,
    `altPhone` TEXT NULL,
    `email` TEXT NULL,
    `address` TEXT NULL,
    `dob` TEXT NOT NULL,
    `cnicHash` VARCHAR(64) NOT NULL,
    `phoneHash` VARCHAR(64) NOT NULL,
    `gender` ENUM('MALE', 'FEMALE', 'OTHER') NOT NULL,
    `province` ENUM('PUNJAB', 'SINDH', 'KHYBER_PAKHTUNKHWA', 'BALOCHISTAN', 'GILGIT_BALTISTAN', 'AZAD_JAMMU_KASHMIR', 'ISLAMABAD_CAPITAL_TERRITORY') NOT NULL,
    `district` VARCHAR(191) NOT NULL,
    `birthYear` INTEGER NOT NULL,
    `birthMonth` INTEGER NOT NULL,
    `isMinor` BOOLEAN NOT NULL DEFAULT false,
    `consentRegistry` BOOLEAN NOT NULL,
    `consentContact` BOOLEAN NOT NULL DEFAULT false,
    `consentResearch` BOOLEAN NOT NULL DEFAULT false,
    `consentGuardian` BOOLEAN NOT NULL DEFAULT false,
    `consentVersion` VARCHAR(191) NOT NULL DEFAULT 'v1',
    `consentAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `registry_patient_trackingCode_key`(`trackingCode`),
    INDEX `registry_patient_status_idx`(`status`),
    INDEX `registry_patient_province_idx`(`province`),
    INDEX `registry_patient_cnicHash_idx`(`cnicHash`),
    INDEX `registry_patient_phoneHash_idx`(`phoneHash`),
    INDEX `registry_patient_status_province_idx`(`status`, `province`),
    INDEX `registry_patient_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `registry_diagnosis` (
    `id` VARCHAR(191) NOT NULL,
    `patientId` VARCHAR(191) NOT NULL,
    `conditionSlug` VARCHAR(191) NOT NULL,
    `conditionOther` VARCHAR(191) NULL,
    `issvaCategory` ENUM('BENIGN_TUMOR', 'BORDERLINE_TUMOR', 'MALIGNANT_TUMOR', 'SIMPLE_MALFORMATION', 'COMBINED_MALFORMATION', 'MAJOR_VESSEL_ANOMALY', 'SYNDROMIC', 'UNCLASSIFIED') NOT NULL DEFAULT 'UNCLASSIFIED',
    `bodySite` VARCHAR(191) NOT NULL,
    `onset` ENUM('BIRTH', 'INFANCY', 'CHILDHOOD', 'ADOLESCENCE', 'ADULTHOOD', 'UNKNOWN') NOT NULL DEFAULT 'UNKNOWN',
    `doctorDiagnosed` VARCHAR(191) NOT NULL DEFAULT 'unsure',
    `severity` ENUM('MILD', 'MODERATE', 'SEVERE', 'UNKNOWN') NOT NULL DEFAULT 'UNKNOWN',
    `basis` ENUM('CLINICAL', 'IMAGING', 'HISTOLOGY', 'UNKNOWN') NOT NULL DEFAULT 'UNKNOWN',
    `facility` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `registry_diagnosis_patientId_idx`(`patientId`),
    INDEX `registry_diagnosis_conditionSlug_idx`(`conditionSlug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `registry_treatment` (
    `id` VARCHAR(191) NOT NULL,
    `diagnosisId` VARCHAR(191) NOT NULL,
    `type` ENUM('OBSERVATION', 'PROPRANOLOL', 'OTHER_MEDICATION', 'LASER', 'SCLEROTHERAPY', 'EMBOLIZATION', 'SURGERY', 'COMBINED', 'OTHER') NOT NULL,
    `facility` VARCHAR(191) NULL,
    `year` INTEGER NULL,
    `outcome` ENUM('RESOLVED', 'IMPROVED', 'UNCHANGED', 'WORSENED', 'ONGOING', 'UNKNOWN') NOT NULL DEFAULT 'UNKNOWN',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `registry_treatment_diagnosisId_idx`(`diagnosisId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `clinician_profile` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `pmcNumber` TEXT NOT NULL,
    `pmcHash` VARCHAR(64) NOT NULL,
    `specialty` VARCHAR(191) NOT NULL,
    `facility` VARCHAR(191) NOT NULL,
    `city` VARCHAR(191) NOT NULL,
    `province` ENUM('PUNJAB', 'SINDH', 'KHYBER_PAKHTUNKHWA', 'BALOCHISTAN', 'GILGIT_BALTISTAN', 'AZAD_JAMMU_KASHMIR', 'ISLAMABAD_CAPITAL_TERRITORY') NOT NULL,
    `approved` BOOLEAN NOT NULL DEFAULT false,
    `approvedAt` DATETIME(3) NULL,
    `approvedById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `clinician_profile_userId_key`(`userId`),
    INDEX `clinician_profile_approved_idx`(`approved`),
    INDEX `clinician_profile_pmcHash_idx`(`pmcHash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_log` (
    `id` VARCHAR(191) NOT NULL,
    `actorId` VARCHAR(191) NULL,
    `actorRole` VARCHAR(191) NULL,
    `action` VARCHAR(191) NOT NULL,
    `entity` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NULL,
    `meta` JSON NULL,
    `ip` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_log_actorId_idx`(`actorId`),
    INDEX `audit_log_action_idx`(`action`),
    INDEX `audit_log_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `session` ADD CONSTRAINT `session_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `account` ADD CONSTRAINT `account_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `registry_patient` ADD CONSTRAINT `registry_patient_clinicianId_fkey` FOREIGN KEY (`clinicianId`) REFERENCES `clinician_profile`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `registry_diagnosis` ADD CONSTRAINT `registry_diagnosis_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `registry_patient`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `registry_treatment` ADD CONSTRAINT `registry_treatment_diagnosisId_fkey` FOREIGN KEY (`diagnosisId`) REFERENCES `registry_diagnosis`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `clinician_profile` ADD CONSTRAINT `clinician_profile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_log` ADD CONSTRAINT `audit_log_actorId_fkey` FOREIGN KEY (`actorId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

