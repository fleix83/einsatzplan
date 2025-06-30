-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Erstellungszeit: 26. Jun 2025 um 17:57
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
-- Tabellenstruktur für Tabelle `shifts`
--

CREATE TABLE `shifts` (
  `id` int(11) NOT NULL,
  `date` date NOT NULL,
  `shift_type` enum('E1','E2') NOT NULL,
  `user1_id` int(11) DEFAULT NULL,
  `user2_id` int(11) DEFAULT NULL,
  `note1` text DEFAULT NULL,
  `note2` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `shifts`
--

INSERT INTO `shifts` (`id`, `date`, `shift_type`, `user1_id`, `user2_id`, `note1`, `note2`) VALUES
(131, '2025-07-01', 'E1', 57, 74, NULL, NULL),
(132, '2025-07-01', 'E2', 61, NULL, NULL, NULL),
(133, '2025-07-02', 'E1', 62, NULL, '', NULL),
(134, '2025-07-03', 'E1', 67, NULL, '', ''),
(135, '2025-07-03', 'E2', 60, NULL, '', ''),
(136, '2025-07-04', 'E1', 70, NULL, '', NULL),
(137, '2025-07-04', 'E2', NULL, 65, '', ''),
(138, '2025-07-07', 'E2', 63, NULL, '', NULL),
(139, '2025-07-08', 'E2', 70, NULL, NULL, NULL),
(140, '2025-07-09', 'E1', 58, 67, '', ''),
(141, '2025-07-09', 'E2', 57, NULL, '', ''),
(142, '2025-07-10', 'E2', 68, 72, NULL, ''),
(143, '2025-07-11', 'E1', 60, NULL, '', NULL),
(144, '2025-07-11', 'E2', NULL, NULL, '', ''),
(145, '2025-07-14', 'E1', 65, NULL, '', NULL),
(146, '2025-07-14', 'E2', NULL, 63, '', ''),
(147, '2025-07-15', 'E1', 74, NULL, '', NULL),
(148, '2025-07-15', 'E2', 57, NULL, '', ''),
(149, '2025-07-16', 'E1', 64, NULL, '', NULL),
(150, '2025-07-16', 'E2', 63, 62, NULL, ''),
(151, '2025-07-17', 'E2', 68, NULL, NULL, NULL),
(152, '2025-07-18', 'E2', 65, NULL, NULL, NULL),
(153, '2025-07-07', 'E1', 59, NULL, '', NULL),
(154, '2025-07-08', 'E1', 69, NULL, '', ''),
(155, '2025-07-10', 'E1', 53, NULL, '', NULL),
(156, '2025-07-17', 'E1', 58, NULL, '', NULL),
(157, '2025-07-18', 'E1', 73, NULL, '', NULL);

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `shifts`
--
ALTER TABLE `shifts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `date_shift` (`date`,`shift_type`),
  ADD KEY `user1_id` (`user1_id`),
  ADD KEY `user2_id` (`user2_id`);

--
-- AUTO_INCREMENT für exportierte Tabellen
--

--
-- AUTO_INCREMENT für Tabelle `shifts`
--
ALTER TABLE `shifts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=158;

--
-- Constraints der exportierten Tabellen
--

--
-- Constraints der Tabelle `shifts`
--
ALTER TABLE `shifts`
  ADD CONSTRAINT `shifts_ibfk_1` FOREIGN KEY (`user1_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `shifts_ibfk_2` FOREIGN KEY (`user2_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
