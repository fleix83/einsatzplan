-- Create password reset logs table for tracking reset activities
-- This table is optional but recommended for security monitoring

CREATE TABLE IF NOT EXISTS `password_reset_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(100) NOT NULL,
  `activity` varchar(50) NOT NULL,
  `details` text DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `email` (`email`),
  KEY `activity` (`activity`),
  KEY `created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS `idx_reset_logs_email_created` ON `password_reset_logs` (`email`, `created_at`);