-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Erstellungszeit: 26. Jun 2025 um 10:37
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
-- Tabellenstruktur für Tabelle `announcement_text`
--

CREATE TABLE `announcement_text` (
  `id` int(11) NOT NULL,
  `content` text NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `updated_by` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `announcement_text`
--

INSERT INTO `announcement_text` (`id`, `content`, `updated_at`, `updated_by`) VALUES
(1, '<p><span style=\"font-weight: 900;\"><font size=\"5\">EINSATZPLAN</font></span></p><p><b><font size=\"3\"><br></font></b></p>', '2025-04-25 07:32:38', 'Admin');

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `calendar_states`
--

CREATE TABLE `calendar_states` (
  `id` int(11) NOT NULL,
  `year` int(11) NOT NULL,
  `month` int(11) NOT NULL,
  `is_frozen` tinyint(1) NOT NULL DEFAULT 0,
  `frozen_at` timestamp NULL DEFAULT NULL,
  `frozen_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `calendar_states`
--

INSERT INTO `calendar_states` (`id`, `year`, `month`, `is_frozen`, `frozen_at`, `frozen_by`) VALUES
(1, 2025, 3, 1, '2025-06-02 15:52:00', NULL),
(2, 2025, 4, 0, NULL, NULL),
(3, 2025, 5, 0, NULL, NULL),
(4, 2025, 6, 0, NULL, NULL),
(5, 2025, 7, 0, NULL, NULL);

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

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `color_presets`
--

CREATE TABLE `color_presets` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `colors` text NOT NULL COMMENT 'JSON blob with all color values',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_default` tinyint(1) DEFAULT 0 COMMENT 'System presets cannot be deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `custom_events`
--

CREATE TABLE `custom_events` (
  `id` int(11) NOT NULL,
  `date` date NOT NULL,
  `title` varchar(255) NOT NULL,
  `time` time NOT NULL,
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `custom_events`
--

INSERT INTO `custom_events` (`id`, `date`, `title`, `time`, `created_by`, `created_at`) VALUES
(1, '2025-03-01', 'ydgsdgfs', '04:34:00', 8, '2025-05-07 15:42:41'),
(5, '2025-05-02', 'asdfa', '13:06:00', 8, '2025-05-07 16:06:25'),
(16, '2025-06-02', 'Apero', '11:30:00', 8, '2025-06-07 22:19:20'),
(17, '2025-06-04', 'Sitzung', '16:30:00', 8, '2025-06-07 23:04:47'),
(19, '2025-03-22', 'Apero', '16:00:00', 8, '2025-06-23 14:22:21');

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `holidays`
--

CREATE TABLE `holidays` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `approved` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `official_holidays`
--

CREATE TABLE `official_holidays` (
  `id` int(11) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `official_holidays`
--

INSERT INTO `official_holidays` (`id`, `start_date`, `end_date`, `title`, `description`, `created_by`, `created_at`, `updated_at`) VALUES
(7, '2025-07-19', '2025-08-03', 'Sommerferien', '', 8, '2025-06-26 08:24:22', '2025-06-26 08:24:22');

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `schreibdienst_events`
--

CREATE TABLE `schreibdienst_events` (
  `id` int(11) NOT NULL,
  `date` date NOT NULL,
  `time` time NOT NULL,
  `shift_type` enum('E1','E2') NOT NULL,
  `details` text NOT NULL,
  `user_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `sessions`
--

CREATE TABLE `sessions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `token` varchar(255) NOT NULL,
  `expires_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `sessions`
--

INSERT INTO `sessions` (`id`, `user_id`, `token`, `expires_at`, `created_at`) VALUES
(3, 8, '9061252ce758a54bccb8e503ac70da1679fdfa072506e0851e34ae6f4df08544', '2025-03-11 03:14:27', '2025-03-10 15:14:27'),
(7, 8, 'fe3d124e921b274619e548af9317b71b18046d9bc74c907ea7a2ab4e632ca9ac', '2025-03-13 00:40:36', '2025-03-12 12:40:36'),
(21, 8, '01182a221b5e873b900c3c3887801c3c223e4404208fb8d6394f4f6a256bb4cd', '2025-03-22 00:07:18', '2025-03-21 12:07:18'),
(23, 8, '8731850876e5d930f39fa564020742993ffb5f639e70867e7a5836f367f1dc0f', '2025-03-22 10:17:08', '2025-03-21 22:17:08'),
(26, 8, 'a448c3abfbd13cd3a45b384d6a6de32426e533b6ee2fc327d6db4df6a9c00e17', '2025-03-24 21:38:22', '2025-03-24 09:38:22'),
(41, 8, '48974d6dce8e6198b61ded1fb3111cf4c1052918e706d21aad1c5a454efa1408', '2025-04-03 04:10:37', '2025-04-02 16:10:37'),
(46, 8, '56a3d678fc64d58b33479fc49ea1d0c56a92eef0b0aab3eea0bc916211704d7a', '2025-04-06 23:51:19', '2025-04-06 11:51:19'),
(59, 8, '29c8c145a6b9c9fc38e6d5cb00f4354db2cb745b13b07f60cf261eae357242b8', '2025-04-24 04:00:54', '2025-04-23 16:00:54'),
(60, 8, 'd6845fd68aa5b69e45f6a7933b1a3371fec8a2b4c681cd93d33870eb865978fd', '2025-04-24 04:04:00', '2025-04-23 16:04:00'),
(61, 8, 'ef580b63eaf862918b10e53b6ae35aa8b399a87e06c896eca8aeba4c942874b0', '2025-04-24 04:21:37', '2025-04-23 16:21:37'),
(62, 8, 'ad1d3eff6db4e0a96da1f6d95554b20a7e67906f92f9ce13f531b792945a70c7', '2025-04-24 04:45:05', '2025-04-23 16:45:05'),
(68, 8, '79ffbea8f6cdf016a053aa86917293842fad151708c132cbc0940f874021f1c3', '2025-04-25 08:12:50', '2025-04-24 20:12:50'),
(71, 8, 'c6690aa0e8b8bddf296e4d91c8b18025c2df8045c7d78a191fbd9452f1f7847d', '2025-04-29 21:41:02', '2025-04-29 09:41:02'),
(72, 8, 'ab2e55b96624a772d853eb390bd60da91af99f3adf9c55f08c1f92ff46788dc8', '2025-04-29 22:17:00', '2025-04-29 10:17:00'),
(73, 8, '21fdc60a598573bbd574ce3e8eb1d742826e0b1da6154227442de73cf5fab600', '2025-04-29 22:20:28', '2025-04-29 10:20:28'),
(77, 8, '244981622a01efaee938c63731c3747861deb98ec3c77353c5aa0c074e60ed24', '2025-05-07 03:47:49', '2025-05-06 15:47:49'),
(82, 8, 'fc17d1dd38a9c31415eb7043f085fa5cff7b0d1ee232dd188eedc589f1656332', '2025-05-07 23:00:34', '2025-05-07 11:00:34'),
(83, 8, '539e2e89b8d3ba6b4c3d9c10d895c33fe4ada5742b09ef215e89341b85660409', '2025-05-08 01:47:22', '2025-05-07 13:47:22'),
(84, 8, '09fd1a0264f5fc4eca4f2f83acda827a9b7ec2e570fd645911ac3f7efe07836a', '2025-05-08 02:25:25', '2025-05-07 14:25:25'),
(86, 8, '6d631fe61822597d5dd5ecbe0d1638aa58445dea96797a549bec6d5a5bbcec35', '2025-05-19 22:28:20', '2025-05-19 10:28:20'),
(90, 8, '4f8b950cd3207923ca88dd9f2e44d14000bd9605ad6ef5bb40834eab85c958cb', '2025-06-07 02:54:22', '2025-06-06 14:54:22'),
(93, 8, '060fb4eaa116116101c756df5a06a72d843788c71b2c7f48ca5b9bf9e44940bb', '2025-06-07 07:22:53', '2025-06-06 19:22:53'),
(94, 8, 'd3f5edd49e361a3a33f9e26167b6a7bd6f65bc9985452d7457b403886dff6557', '2025-06-07 22:59:12', '2025-06-07 10:59:12'),
(95, 8, '28ca6dc8fa74f12080da553c3d78066f1857c6954cf97f7740f91a619389b65a', '2025-06-07 23:11:32', '2025-06-07 11:11:32'),
(98, 8, 'fb363302722e369609db76586499c852d173274d2ea1d9d017faa537a2da393e', '2025-06-08 04:35:40', '2025-06-07 16:35:40'),
(109, 8, '09ea781a2631639e681cc23aea5869e611a4d98def312539d7f7bea977c1e8c1', '2025-06-20 00:46:25', '2025-06-19 12:46:25'),
(115, 8, '855cb70d3bdd23fc88002472f2036e1e98b429f0b52141c04c0ff20e5e222f04', '2025-06-26 19:22:56', '2025-06-26 07:22:56');

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `settings`
--

CREATE TABLE `settings` (
  `id` int(11) NOT NULL,
  `setting_key` varchar(255) NOT NULL,
  `setting_value` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `settings`
--

INSERT INTO `settings` (`id`, `setting_key`, `setting_value`, `created_at`, `updated_at`) VALUES
(1, 'announcement_content', '<p>Welcome to the shift scheduling calendar. Here you can view and manage all assignments.</p>', '2025-04-24 19:05:57', '2025-04-24 19:05:57'),
(2, 'announcement_logo', 'http://localhost/calendar-deutsch/logo.svg', '2025-04-24 19:05:57', '2025-04-24 19:12:25');

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
-- Indizes für die Tabelle `announcement_text`
--
ALTER TABLE `announcement_text`
  ADD PRIMARY KEY (`id`);

--
-- Indizes für die Tabelle `calendar_states`
--
ALTER TABLE `calendar_states`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_year_month` (`year`,`month`),
  ADD KEY `frozen_by` (`frozen_by`);

--
-- Indizes für die Tabelle `color_settings`
--
ALTER TABLE `color_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`),
  ADD KEY `created_by` (`created_by`);

--
-- Indizes für die Tabelle `color_presets`
--
ALTER TABLE `color_presets`
  ADD PRIMARY KEY (`id`);

--
-- Indizes für die Tabelle `custom_events`
--
ALTER TABLE `custom_events`
  ADD PRIMARY KEY (`id`),
  ADD KEY `date_idx` (`date`),
  ADD KEY `created_by_idx` (`created_by`);

--
-- Indizes für die Tabelle `holidays`
--
ALTER TABLE `holidays`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indizes für die Tabelle `official_holidays`
--
ALTER TABLE `official_holidays`
  ADD PRIMARY KEY (`id`),
  ADD KEY `start_date` (`start_date`),
  ADD KEY `end_date` (`end_date`),
  ADD KEY `created_by` (`created_by`);

--
-- Indizes für die Tabelle `schreibdienst_events`
--
ALTER TABLE `schreibdienst_events`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indizes für die Tabelle `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `token` (`token`),
  ADD KEY `user_id` (`user_id`);

--
-- Indizes für die Tabelle `settings`
--
ALTER TABLE `settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `setting_key` (`setting_key`);

--
-- Indizes für die Tabelle `shifts`
--
ALTER TABLE `shifts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `date_shift` (`date`,`shift_type`),
  ADD KEY `user1_id` (`user1_id`),
  ADD KEY `user2_id` (`user2_id`);

--
-- Indizes für die Tabelle `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT für exportierte Tabellen
--

--
-- AUTO_INCREMENT für Tabelle `announcement_text`
--
ALTER TABLE `announcement_text`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT für Tabelle `calendar_states`
--
ALTER TABLE `calendar_states`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT für Tabelle `color_settings`
--
ALTER TABLE `color_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

--
-- AUTO_INCREMENT für Tabelle `color_presets`
--
ALTER TABLE `color_presets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1;

--
-- AUTO_INCREMENT für Tabelle `custom_events`
--
ALTER TABLE `custom_events`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT für Tabelle `holidays`
--
ALTER TABLE `holidays`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=57;

--
-- AUTO_INCREMENT für Tabelle `official_holidays`
--
ALTER TABLE `official_holidays`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT für Tabelle `schreibdienst_events`
--
ALTER TABLE `schreibdienst_events`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT für Tabelle `sessions`
--
ALTER TABLE `sessions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=116;

--
-- AUTO_INCREMENT für Tabelle `settings`
--
ALTER TABLE `settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT für Tabelle `shifts`
--
ALTER TABLE `shifts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=158;

--
-- AUTO_INCREMENT für Tabelle `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=76;

--
-- Constraints der exportierten Tabellen
--

--
-- Constraints der Tabelle `calendar_states`
--
ALTER TABLE `calendar_states`
  ADD CONSTRAINT `calendar_states_ibfk_1` FOREIGN KEY (`frozen_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints der Tabelle `color_settings`
--
ALTER TABLE `color_settings`
  ADD CONSTRAINT `color_settings_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`);

--
-- Constraints der Tabelle `holidays`
--
ALTER TABLE `holidays`
  ADD CONSTRAINT `holidays_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints der Tabelle `official_holidays`
--
ALTER TABLE `official_holidays`
  ADD CONSTRAINT `official_holidays_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints der Tabelle `schreibdienst_events`
--
ALTER TABLE `schreibdienst_events`
  ADD CONSTRAINT `schreibdienst_events_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints der Tabelle `sessions`
--
ALTER TABLE `sessions`
  ADD CONSTRAINT `sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

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
