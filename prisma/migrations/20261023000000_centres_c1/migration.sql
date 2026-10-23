-- CreateTable
CREATE TABLE `center` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `nameEn` VARCHAR(191) NOT NULL,
    `nameUr` VARCHAR(191) NULL,
    `type` ENUM('PUBLIC', 'PRIVATE', 'TRUST') NOT NULL,
    `city` VARCHAR(191) NOT NULL,
    `province` ENUM('PUNJAB', 'SINDH', 'KHYBER_PAKHTUNKHWA', 'BALOCHISTAN', 'GILGIT_BALTISTAN', 'AZAD_JAMMU_KASHMIR', 'ISLAMABAD_CAPITAL_TERRITORY') NOT NULL,
    `address` TEXT NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `website` VARCHAR(191) NULL,
    `lat` DOUBLE NULL,
    `lng` DOUBLE NULL,
    `services` JSON NOT NULL,
    `conditions` JSON NOT NULL,
    `licenceNumber` VARCHAR(191) NOT NULL,
    `headDoctorName` VARCHAR(191) NOT NULL,
    `headDoctorPmc` TEXT NOT NULL,
    `headDoctorHash` VARCHAR(64) NOT NULL,
    `status` ENUM('APPLIED', 'APPROVED', 'REJECTED', 'SUSPENDED') NOT NULL DEFAULT 'APPLIED',
    `tier` ENUM('MEMBER', 'ACCREDITED', 'EXCELLENCE') NOT NULL DEFAULT 'MEMBER',
    `statusReason` TEXT NULL,
    `approvedAt` DATETIME(3) NULL,
    `approvedById` VARCHAR(191) NULL,
    `membershipExpiresAt` DATETIME(3) NULL,
    `lastReminderAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `center_slug_key`(`slug`),
    INDEX `center_status_idx`(`status`),
    INDEX `center_province_idx`(`province`),
    INDEX `center_headDoctorHash_idx`(`headDoctorHash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `center_member` (
    `id` VARCHAR(191) NOT NULL,
    `centerId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `role` ENUM('OWNER', 'DOCTOR', 'NURSE', 'RECEPTION') NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `center_member_userId_key`(`userId`),
    INDEX `center_member_centerId_idx`(`centerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `center_payment` (
    `id` VARCHAR(191) NOT NULL,
    `centerId` VARCHAR(191) NOT NULL,
    `amount` INTEGER NOT NULL DEFAULT 12000,
    `method` ENUM('BANK', 'JAZZCASH', 'EASYPAISA', 'RAAST') NOT NULL,
    `txnRef` VARCHAR(191) NOT NULL,
    `paidOn` DATETIME(3) NOT NULL,
    `status` ENUM('PENDING', 'VERIFIED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `rejectReason` TEXT NULL,
    `verifiedAt` DATETIME(3) NULL,
    `verifiedById` VARCHAR(191) NULL,
    `periodStart` DATETIME(3) NULL,
    `periodEnd` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `center_payment_centerId_idx`(`centerId`),
    INDEX `center_payment_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `center_member` ADD CONSTRAINT `center_member_centerId_fkey` FOREIGN KEY (`centerId`) REFERENCES `center`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `center_member` ADD CONSTRAINT `center_member_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `center_payment` ADD CONSTRAINT `center_payment_centerId_fkey` FOREIGN KEY (`centerId`) REFERENCES `center`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

