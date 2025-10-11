-- Create feedback table for user comments and suggestions
-- Run this SQL in phpMyAdmin or MySQL client

CREATE TABLE IF NOT EXISTS `feedback` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `comment` text NOT NULL,
  `user_name` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `created_at_idx` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Note: Run this SQL script to add the feedback table to your database
-- Example: mysql -u your_user -p calendar < create_feedback_table.sql
