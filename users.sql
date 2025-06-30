-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Erstellungszeit: 26. Jun 2025 um 17:56
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
-- Tabellenstruktur für Tabelle `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `role` enum('Backoffice','Freiwillige') NOT NULL DEFAULT 'Freiwillige',
  `is_starter` tinyint(1) NOT NULL DEFAULT 0,
  `is_schreibdienst` tinyint(1) NOT NULL DEFAULT 0,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `max_shifts_per_week` int(11) NOT NULL DEFAULT 5,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `is_starter`, `is_schreibdienst`, `active`, `max_shifts_per_week`, `created_at`, `updated_at`) VALUES
(8, 'Admin', 'admin@admin.ch', '$2y$10$RzNivZ6AsrcIhwpcxNXJTe3LHzHC.gdd.In.FUqIavvBJNSHbOBbW', 'Backoffice', 0, 0, 1, 5, '2025-03-10 14:24:06', '2025-03-10 14:24:06'),
(50, 'Milena', 'schaeli.milena@ggg-wegweiser.ch', '$2y$10$Ftjyuz.zz9Jy1m/.ellmgOV.IX18vYu/1LGHQK1RieuFdyMzXeKN2', 'Backoffice', 0, 0, 1, 5, '2025-06-26 07:45:46', '2025-06-26 07:45:46'),
(53, 'Sophia', 'toenshoff.sophia@ggg-wegweiser.ch', '$2y$10$tKOGXU1Ds3gImrfjvE5/EOvcfjkzmfj2NOIWUSmsxb5NfAxMgj5sm', 'Backoffice', 0, 0, 1, 5, '2025-06-26 07:48:52', '2025-06-26 07:48:52'),
(57, 'Angelika Rose', NULL, NULL, 'Freiwillige', 0, 0, 1, 5, '2025-06-26 07:50:07', '2025-06-26 07:50:07'),
(58, 'Antonina', NULL, NULL, 'Freiwillige', 0, 0, 1, 5, '2025-06-26 07:50:07', '2025-06-26 07:50:07'),
(59, 'Araceli', NULL, NULL, 'Freiwillige', 0, 0, 1, 5, '2025-06-26 07:50:07', '2025-06-26 07:50:07'),
(60, 'Chantal', NULL, NULL, 'Freiwillige', 0, 0, 1, 5, '2025-06-26 07:50:07', '2025-06-26 07:50:07'),
(61, 'Daniela', NULL, NULL, 'Freiwillige', 0, 0, 1, 5, '2025-06-26 07:50:07', '2025-06-26 07:50:07'),
(62, 'Felix', NULL, NULL, 'Freiwillige', 0, 0, 1, 5, '2025-06-26 07:50:07', '2025-06-26 07:50:07'),
(63, 'Hermelinda', NULL, NULL, 'Freiwillige', 0, 0, 1, 5, '2025-06-26 07:50:07', '2025-06-26 07:50:07'),
(64, 'Marco', NULL, NULL, 'Freiwillige', 0, 0, 1, 5, '2025-06-26 07:50:07', '2025-06-26 07:50:07'),
(65, 'Marina', NULL, NULL, 'Freiwillige', 0, 0, 1, 5, '2025-06-26 07:50:07', '2025-06-26 07:50:07'),
(67, 'Nelly', NULL, NULL, 'Freiwillige', 0, 0, 1, 5, '2025-06-26 07:50:07', '2025-06-26 07:50:07'),
(68, 'Pia', NULL, NULL, 'Freiwillige', 0, 0, 1, 5, '2025-06-26 07:50:07', '2025-06-26 07:50:07'),
(69, 'Renata', NULL, NULL, 'Freiwillige', 0, 0, 1, 5, '2025-06-26 07:50:07', '2025-06-26 07:50:07'),
(70, 'Silvie', NULL, NULL, 'Freiwillige', 0, 0, 1, 5, '2025-06-26 07:50:07', '2025-06-26 07:50:07'),
(72, 'Tosca', NULL, NULL, 'Freiwillige', 0, 0, 1, 5, '2025-06-26 07:50:07', '2025-06-26 07:50:07'),
(73, 'Ursula Gross', NULL, NULL, 'Freiwillige', 0, 0, 1, 5, '2025-06-26 07:50:07', '2025-06-26 07:50:07'),
(74, 'Ursula von Gunten', NULL, NULL, 'Freiwillige', 0, 0, 1, 5, '2025-06-26 07:50:07', '2025-06-26 07:50:07'),
(75, 'Ortrud', 'biersack.ortrud@ggg-wegweiser.ch', '$2y$10$kIJZ/lENiFy1mHJC2uk3LePQPAF3Nh6piF2BAl9S2GNhjlGnS5vkW', 'Backoffice', 0, 0, 1, 5, '2025-06-26 08:01:15', '2025-06-26 08:01:15');

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT für exportierte Tabellen
--

--
-- AUTO_INCREMENT für Tabelle `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=76;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
