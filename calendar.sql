-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Erstellungszeit: 12. Mai 2025 um 11:16
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
(1, 2025, 3, 0, NULL, NULL),
(2, 2025, 4, 0, NULL, NULL),
(3, 2025, 5, 1, '2025-05-07 19:28:39', 8);

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
(22, 'hoverBg', '#ff5252', NULL, '2025-05-07 14:33:14', '2025-05-07 14:36:04', 1),
(23, 'selectedBg', '#ff5252', NULL, '2025-05-07 14:33:14', '2025-05-07 14:36:04', 1);

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
(2, '2025-06-03', 'Teamsitzung', '17:00:00', 8, '2025-05-07 15:51:59'),
(3, '2025-06-01', 'asdfasdf', '16:03:00', 8, '2025-05-07 16:01:19'),
(4, '2025-06-01', 'sdfgsdfg', '12:00:00', 8, '2025-05-07 16:05:32'),
(5, '2025-05-02', 'asdfa', '13:06:00', 8, '2025-05-07 16:06:25'),
(6, '2025-06-06', 'sdfgsd', '10:00:00', 8, '2025-05-07 16:10:51'),
(7, '2025-06-04', 'D', '12:23:00', 8, '2025-05-07 16:11:19'),
(8, '2025-06-08', 'asd', '03:22:00', 8, '2025-05-07 16:13:50'),
(9, '2025-06-05', 'asdfadsf', '22:12:00', 8, '2025-05-07 16:14:23'),
(10, '2025-06-16', 'dfgsdg', '18:00:00', 8, '2025-05-07 19:07:29'),
(11, '2025-06-01', 'asds', '12:12:00', 8, '2025-05-07 19:08:21');

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

--
-- Daten für Tabelle `holidays`
--

INSERT INTO `holidays` (`id`, `user_id`, `start_date`, `end_date`, `approved`, `created_at`) VALUES
(16, 1, '2025-03-29', '2025-03-30', 1, '2025-03-11 17:01:12'),
(31, 13, '2025-03-27', '2025-03-29', 1, '2025-03-12 13:02:44'),
(34, 2, '2025-03-11', '2025-03-11', 1, '2025-03-12 13:13:32'),
(35, 15, '2025-03-29', '2025-04-05', 1, '2025-03-29 20:36:56'),
(36, 2, '2025-04-04', '2025-04-11', 1, '2025-04-04 13:31:13'),
(37, 3, '2025-04-21', '2025-04-25', 1, '2025-04-06 17:01:34'),
(38, 3, '2025-03-25', '2025-03-28', 1, '2025-04-10 18:33:09'),
(39, 2, '2025-03-25', '2025-03-28', 1, '2025-04-10 18:33:41'),
(40, 3, '2025-04-15', '2025-04-22', 1, '2025-04-15 13:39:08');

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

--
-- Daten für Tabelle `schreibdienst_events`
--

INSERT INTO `schreibdienst_events` (`id`, `date`, `time`, `shift_type`, `details`, `user_id`, `created_at`) VALUES
(5, '2025-03-12', '11:30:00', 'E1', 'SID 80', 1, '2025-03-12 13:17:52');

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
(84, 8, '09fd1a0264f5fc4eca4f2f83acda827a9b7ec2e570fd645911ac3f7efe07836a', '2025-05-08 02:25:25', '2025-05-07 14:25:25');

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
(1, '2025-03-03', 'E1', 1, 3, '', ''),
(2, '2025-03-03', 'E2', 8, 13, '', ''),
(3, '2025-03-17', 'E2', NULL, 1, NULL, ''),
(4, '2025-03-11', 'E2', 2, NULL, 'yvsdsdf', NULL),
(5, '2025-03-04', 'E1', 13, NULL, 'adsdfadada', ''),
(6, '2025-03-07', 'E1', 8, 12, '', ''),
(7, '2025-03-13', 'E2', 1, 8, '', ''),
(8, '2025-03-12', 'E2', 1, NULL, '', NULL),
(9, '2025-03-18', 'E1', 8, 2, '', ''),
(10, '2025-03-19', 'E2', NULL, 3, NULL, ''),
(11, '2025-03-27', 'E2', 8, NULL, '', NULL),
(12, '2025-03-04', 'E2', 8, 13, 'yjksbdföajsdf', ''),
(13, '2025-03-05', 'E1', 1, 13, 'Bis später', 'Hab ich dabei'),
(14, '2025-03-06', 'E1', 1, 12, '', ''),
(15, '2025-03-06', 'E2', NULL, NULL, '', ''),
(16, '2025-03-14', 'E2', 8, 12, '', ''),
(17, '2025-03-10', 'E1', 1, 8, '', ''),
(18, '2025-03-12', 'E1', 8, NULL, '', NULL),
(19, '2025-03-24', 'E2', 1, NULL, '', NULL),
(20, '2025-03-24', 'E1', NULL, 3, NULL, ''),
(21, '2025-03-25', 'E1', 8, NULL, '', ''),
(22, '2025-03-25', 'E2', 1, NULL, '', NULL),
(23, '2025-03-05', 'E2', NULL, 8, NULL, ''),
(24, '2025-03-26', 'E1', 3, 13, '', ''),
(25, '2025-03-26', 'E2', NULL, 3, NULL, ''),
(26, '2025-03-13', 'E1', 3, NULL, '', NULL),
(27, '2025-03-19', 'E1', 3, 8, '', ''),
(28, '2025-03-20', 'E1', NULL, 3, NULL, ''),
(29, '2025-03-10', 'E2', NULL, 3, NULL, ''),
(30, '2025-03-21', 'E1', 3, NULL, '', NULL),
(31, '2025-03-20', 'E2', 8, NULL, '', NULL),
(32, '2025-03-28', 'E2', 8, NULL, '', NULL),
(33, '2025-03-17', 'E1', 8, NULL, '', NULL),
(34, '2025-03-11', 'E1', 13, 3, '', ''),
(35, '2025-03-07', 'E2', 8, NULL, '', NULL),
(36, '2025-03-14', 'E1', 13, NULL, '', NULL),
(37, '2025-02-04', 'E1', NULL, NULL, '', NULL),
(38, '2025-03-31', 'E1', 1, 13, '', ''),
(39, '2025-03-27', 'E1', 12, NULL, '', NULL),
(40, '2025-03-28', 'E1', 3, NULL, '', NULL),
(41, '2025-11-11', 'E1', 8, NULL, '', NULL),
(42, '2025-03-18', 'E2', 2, NULL, 'Komme leider erst auf 11.15h', NULL),
(43, '2025-03-21', 'E2', 1, NULL, 'Hallo', NULL),
(44, '2025-04-01', 'E2', 1, NULL, '', NULL),
(45, '2025-04-09', 'E1', 1, 2, '', ''),
(46, '2025-05-01', 'E1', 1, 3, '', ''),
(47, '2025-06-03', 'E2', 3, 8, '', ''),
(48, '2025-06-03', 'E1', 8, 19, '', '');

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
(1, 'Felix', NULL, NULL, 'Freiwillige', 0, 0, 1, 5, '2025-03-09 15:16:21', '2025-04-10 18:38:27'),
(2, 'Sophia', NULL, NULL, 'Freiwillige', 1, 0, 1, 5, '2025-03-09 15:16:28', '2025-04-11 18:35:20'),
(3, 'Milena', NULL, NULL, 'Freiwillige', 0, 0, 1, 5, '2025-03-09 15:16:34', '2025-04-10 17:45:39'),
(4, 'Test', NULL, NULL, 'Freiwillige', 0, 0, 0, 5, '2025-03-09 18:19:01', '2025-03-10 13:28:46'),
(5, 'Lina', NULL, NULL, 'Freiwillige', 0, 0, 0, 5, '2025-03-10 13:30:42', '2025-03-10 13:30:58'),
(8, 'Admin', 'admin@admin.ch', '$2y$10$RzNivZ6AsrcIhwpcxNXJTe3LHzHC.gdd.In.FUqIavvBJNSHbOBbW', 'Backoffice', 0, 0, 1, 5, '2025-03-10 14:24:06', '2025-03-10 14:24:06'),
(9, 'Test2', NULL, NULL, 'Freiwillige', 0, 0, 0, 5, '2025-03-10 15:13:14', '2025-03-10 15:13:18'),
(10, 'asdfadf', NULL, NULL, 'Freiwillige', 0, 0, 0, 5, '2025-03-11 17:10:27', '2025-03-11 17:10:32'),
(11, 'sdfgsdgsdf', NULL, NULL, 'Freiwillige', 0, 0, 0, 5, '2025-03-11 17:10:44', '2025-03-11 17:12:40'),
(12, 'sdfasdf', NULL, NULL, 'Freiwillige', 0, 0, 0, 5, '2025-03-11 17:25:36', '2025-04-02 15:59:32'),
(13, 'Sol', NULL, NULL, 'Freiwillige', 0, 0, 0, 5, '2025-03-12 12:42:56', '2025-05-07 09:13:01'),
(14, 'Test', NULL, NULL, 'Freiwillige', 0, 0, 0, 5, '2025-03-24 13:44:13', '2025-03-24 13:44:21'),
(15, 'trtr', NULL, NULL, 'Freiwillige', 0, 0, 0, 5, '2025-03-29 20:36:43', '2025-03-29 20:37:07'),
(16, 'Backoffice', NULL, NULL, 'Freiwillige', 0, 0, 0, 5, '2025-05-07 09:12:44', '2025-05-07 10:29:52'),
(17, 'Marius', NULL, NULL, 'Freiwillige', 0, 0, 0, 5, '2025-05-07 09:28:44', '2025-05-07 10:14:17'),
(18, 'asas', NULL, NULL, 'Freiwillige', 0, 0, 0, 5, '2025-05-07 10:00:29', '2025-05-07 10:00:38'),
(19, 'Marius', NULL, NULL, 'Freiwillige', 0, 0, 1, 5, '2025-05-07 10:14:24', '2025-05-07 10:14:24'),
(20, 'asdas', NULL, NULL, 'Freiwillige', 0, 0, 0, 5, '2025-05-07 10:27:55', '2025-05-07 10:28:00'),
(21, 'Backoffice', 'backoffice@ggg-wegweiser.ch', '$2y$10$htUVzOy15Lre9aDKBGrxWebZo72NkAUefaHOZ1D3rL7SEkecW5YLG', 'Backoffice', 0, 0, 1, 5, '2025-05-07 10:31:16', '2025-05-07 10:31:16'),
(22, 'Backoffice', 'backoffice@ggg-wegweiser.ch', '$2y$10$EIiOBuSA0mEfbiJeqv/kv.9U.mnW1LeUYOPxwinrwZxHZ83Kljb2.', 'Backoffice', 0, 0, 0, 5, '2025-05-07 10:31:16', '2025-05-07 10:31:47'),
(23, 'Backoffice', 'backoffice@ggg-wegweiser.ch', '$2y$10$H4XRIG.lNChwSuhfgmQhKOzVUcA3RNqeBhD1OVvoz0qN8Wnu5giAu', 'Backoffice', 0, 0, 0, 5, '2025-05-07 10:31:16', '2025-05-07 10:31:39'),
(24, 'Backoffice', 'backoffice@ggg-wegweiser.ch', '$2y$10$UgpcJrDa9laFa.eIJARe1erLyiFoJUzPBJywCO09q6sEFV06888m.', 'Backoffice', 0, 0, 0, 5, '2025-05-07 10:31:16', '2025-05-07 10:31:35');

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT für Tabelle `color_settings`
--
ALTER TABLE `color_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT für Tabelle `custom_events`
--
ALTER TABLE `custom_events`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT für Tabelle `holidays`
--
ALTER TABLE `holidays`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41;

--
-- AUTO_INCREMENT für Tabelle `schreibdienst_events`
--
ALTER TABLE `schreibdienst_events`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT für Tabelle `sessions`
--
ALTER TABLE `sessions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=86;

--
-- AUTO_INCREMENT für Tabelle `settings`
--
ALTER TABLE `settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT für Tabelle `shifts`
--
ALTER TABLE `shifts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=49;

--
-- AUTO_INCREMENT für Tabelle `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

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
