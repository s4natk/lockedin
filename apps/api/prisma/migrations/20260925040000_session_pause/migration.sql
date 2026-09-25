-- AlterTable
ALTER TABLE `FocusSession` ADD COLUMN `pausedAt` DATETIME(3) NULL,
    ADD COLUMN `pausedSeconds` INTEGER NOT NULL DEFAULT 0;
