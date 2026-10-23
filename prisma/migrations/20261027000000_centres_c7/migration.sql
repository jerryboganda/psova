-- CreateTable
CREATE TABLE `case_share` (
    `id` VARCHAR(191) NOT NULL,
    `patientId` VARCHAR(191) NOT NULL,
    `fromCenterId` VARCHAR(191) NOT NULL,
    `toCenterId` VARCHAR(191) NOT NULL,
    `type` ENUM('REFERRAL', 'SECOND_OPINION') NOT NULL,
    `status` ENUM('SENT', 'ACCEPTED', 'DECLINED', 'COMPLETED') NOT NULL DEFAULT 'SENT',
    `note` TEXT NULL,
    `response` TEXT NULL,
    `copiedPatientId` VARCHAR(191) NULL,
    `createdById` VARCHAR(191) NULL,
    `respondedById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `respondedAt` DATETIME(3) NULL,

    INDEX `case_share_fromCenterId_createdAt_idx`(`fromCenterId`, `createdAt`),
    INDEX `case_share_toCenterId_status_idx`(`toCenterId`, `status`),
    INDEX `case_share_patientId_idx`(`patientId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mdt_post` (
    `id` VARCHAR(191) NOT NULL,
    `centerId` VARCHAR(191) NOT NULL,
    `authorId` VARCHAR(191) NULL,
    `title` VARCHAR(160) NOT NULL,
    `summary` TEXT NOT NULL,
    `gender` ENUM('MALE', 'FEMALE', 'OTHER') NULL,
    `ageBand` VARCHAR(20) NULL,
    `province` ENUM('PUNJAB', 'SINDH', 'KHYBER_PAKHTUNKHWA', 'BALOCHISTAN', 'GILGIT_BALTISTAN', 'AZAD_JAMMU_KASHMIR', 'ISLAMABAD_CAPITAL_TERRITORY') NULL,
    `conditionSlug` VARCHAR(80) NULL,
    `bodySite` VARCHAR(40) NULL,
    `status` ENUM('OPEN', 'RESOLVED', 'HIDDEN') NOT NULL DEFAULT 'OPEN',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `mdt_post_status_createdAt_idx`(`status`, `createdAt`),
    INDEX `mdt_post_centerId_idx`(`centerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mdt_comment` (
    `id` VARCHAR(191) NOT NULL,
    `postId` VARCHAR(191) NOT NULL,
    `centerId` VARCHAR(191) NOT NULL,
    `authorId` VARCHAR(191) NULL,
    `body` TEXT NOT NULL,
    `hidden` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `mdt_comment_postId_createdAt_idx`(`postId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mdt_post_document` (
    `postId` VARCHAR(191) NOT NULL,
    `documentId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`postId`, `documentId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `case_share` ADD CONSTRAINT `case_share_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `registry_patient`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `case_share` ADD CONSTRAINT `case_share_fromCenterId_fkey` FOREIGN KEY (`fromCenterId`) REFERENCES `center`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `case_share` ADD CONSTRAINT `case_share_toCenterId_fkey` FOREIGN KEY (`toCenterId`) REFERENCES `center`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mdt_post` ADD CONSTRAINT `mdt_post_centerId_fkey` FOREIGN KEY (`centerId`) REFERENCES `center`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mdt_post` ADD CONSTRAINT `mdt_post_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mdt_comment` ADD CONSTRAINT `mdt_comment_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `mdt_post`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mdt_comment` ADD CONSTRAINT `mdt_comment_centerId_fkey` FOREIGN KEY (`centerId`) REFERENCES `center`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mdt_comment` ADD CONSTRAINT `mdt_comment_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mdt_post_document` ADD CONSTRAINT `mdt_post_document_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `mdt_post`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mdt_post_document` ADD CONSTRAINT `mdt_post_document_documentId_fkey` FOREIGN KEY (`documentId`) REFERENCES `patient_document`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

