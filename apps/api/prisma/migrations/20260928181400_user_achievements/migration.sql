-- CreateTable
CREATE TABLE `UserAchievement` (
    `userId` VARCHAR(191) NOT NULL,
    `achievementCode` VARCHAR(191) NOT NULL,
    `earnedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `UserAchievement_userId_idx`(`userId`),
    PRIMARY KEY (`userId`, `achievementCode`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UserAchievement` ADD CONSTRAINT `UserAchievement_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserAchievement` ADD CONSTRAINT `UserAchievement_achievementCode_fkey` FOREIGN KEY (`achievementCode`) REFERENCES `Achievement`(`code`) ON DELETE CASCADE ON UPDATE CASCADE;
