-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Erstellungszeit: 26. Jun 2025 um 18:02
-- Server-Version: 10.4.28-MariaDB
-- PHP-Version: 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Datenbank: `calendar`
--

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `color_settings`
--

CREATE TABLE `color_settings` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `value` varchar(255) NOT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `alpha` float NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `color_settings`
--

INSERT INTO `color_settings` (`id`, `name`, `value`, `created_by`, `created_at`, `updated_at`, `alpha`) VALUES
(13, 'primaryColor', '#2dc885', NULL, '2025-05-07 14:33:14', '2025-05-07 14:43:04', 1),
(14, 'background', '#ff5252', NULL, '2025-05-07 14:33:14', '2025-05-07 14:36:04', 1),
(15, 'backgroundFreeze', '#386aff', NULL, '2025-05-07 14:33:14', '2025-05-07 14:39:33', 1),
(16, 'redShift', '#ffffff', NULL, '2025-05-07 14:33:14', '2025-05-07 15:51:28', 1),
(17, 'orangeShift', '#ff5252', NULL, '2025-05-07 14:33:14', '2025-05-07 14:36:25', 0.45),
(18, 'greenShift', '#ff5252', NULL, '2025-05-07 14:33:14', '2025-05-07 14:36:04', 1),
(19, 'starterShift', '#2ec885', NULL, '2025-05-07 14:33:14', '2025-05-07 14:43:04', 1),
(20, 'schreibdienstSingle', '#64b5f6', NULL, '2025-05-07 14:33:14', '2025-05-07 14:33:14', 1),
(21, 'schreibdienstFull', '#1976d2', NULL, '2025-05-07 14:33:14', '2025-05-07 14:33:14', 1),
(22, 'hoverBg', '#ffe66b', NULL, '2025-05-07 14:33:14', '2025-06-19 13:00:52', 1),
(23, 'selectedBg', '#ffe66b', NULL, '2025-05-07 14:33:14', '2025-06-19 13:00:39', 1),
(24, 'buttonNavBg', '#ffebcd', NULL, '2025-06-13 06:41:17', '2025-06-13 06:49:40', 1),
(25, 'buttonNavBgHover', '#e8e8e8', NULL, '2025-06-13 06:41:17', '2025-06-13 06:41:17', 1),
(26, 'hoverBgSingle', '#fef1b4', NULL, '2025-06-19 15:30:47', '2025-06-19 15:38:16', 1),
(27, 'selectedBgSingle', '#fff0b4', NULL, '2025-06-19 15:30:47', '2025-06-19 15:36:34', 1);

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `color_settings`
--
ALTER TABLE `color_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`),
  ADD KEY `created_by` (`created_by`);

--
-- AUTO_INCREMENT für exportierte Tabellen
--

--
-- AUTO_INCREMENT für Tabelle `color_settings`
--
ALTER TABLE `color_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

--
-- Constraints der exportierten Tabellen
--

--
-- Constraints der Tabelle `color_settings`
--
ALTER TABLE `color_settings`
  ADD CONSTRAINT `color_settings_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
