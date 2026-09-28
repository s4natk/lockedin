-- CreateTable
CREATE TABLE `Achievement` (
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `rule` ENUM('first_session', 'total_focus_seconds', 'single_session_seconds', 'streak_days', 'completed_sessions') NOT NULL,
    `threshold` INTEGER NOT NULL,
    `sortOrder` INTEGER NOT NULL,

    INDEX `Achievement_sortOrder_idx`(`sortOrder`),
    PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Seed the achievement catalog. Awarding happens when a session finishes.
INSERT INTO `Achievement` (`code`, `name`, `description`, `rule`, `threshold`, `sortOrder`) VALUES
    ('locked_in', 'Locked In', 'Complete your first focus session.', 'first_session', 1, 1),
    ('getting_serious', 'Getting Serious', 'Focus for 5 hours in total.', 'total_focus_seconds', 18000, 2),
    ('deep_work', 'Deep Work', 'Complete a 90-minute session.', 'single_session_seconds', 5400, 3),
    ('consistency', 'Consistency', 'Reach a 7-day streak.', 'streak_days', 7, 4),
    ('unstoppable', 'Unstoppable', 'Reach a 30-day streak.', 'streak_days', 30, 5),
    ('scholar', 'Scholar', 'Focus for 50 hours in total.', 'total_focus_seconds', 180000, 6),
    ('centurion', 'Centurion', 'Complete 100 sessions.', 'completed_sessions', 100, 7);
