-- Migration: Add Specialist User Feature
-- Date: 2025-10-09
-- Description: Adds is_specialist flag to users and creates specialist_events table

-- Add is_specialist column to users table
ALTER TABLE `users`
ADD COLUMN `is_specialist` TINYINT(1) NOT NULL DEFAULT 0
AFTER `is_schreibdienst`;

-- Create specialist_events table
CREATE TABLE `specialist_events` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `user_id` INT(11) NOT NULL,
  `date` DATE NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `time` TIME NOT NULL,
  `is_weekly` TINYINT(1) DEFAULT 0,
  `end_date` DATE DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `date_idx` (`date`),
  CONSTRAINT `specialist_events_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Index for faster queries
CREATE INDEX `user_date_idx` ON `specialist_events` (`user_id`, `date`);
