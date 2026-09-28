-- CreateTable
CREATE TABLE `Environment` (
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `requiredLevel` INTEGER NOT NULL,
    `sortOrder` INTEGER NOT NULL,

    INDEX `Environment_sortOrder_idx`(`sortOrder`),
    PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `Environment` (`code`, `name`, `description`, `requiredLevel`, `sortOrder`) VALUES
    ('library', 'Library', 'A quiet room. This one is yours from the start.', 1, 1),
    ('cabin', 'Cabin', 'A mountain cabin, unlocked at level 5.', 5, 2),
    ('space_station', 'Space Station', 'In orbit, unlocked at level 10.', 10, 3);
