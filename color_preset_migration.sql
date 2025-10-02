-- =====================================================
-- Color Preset Feature - Database Migration
-- =====================================================
-- This script adds the color_presets table for saving
-- and loading custom color schemes.
-- =====================================================

--
-- Table structure for table `color_presets`
--

CREATE TABLE IF NOT EXISTS `color_presets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `colors` text NOT NULL COMMENT 'JSON blob with all color values',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_default` tinyint(1) DEFAULT 0 COMMENT 'System presets cannot be deleted',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =====================================================
-- End of migration
-- =====================================================
