-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Хост: localhost:8889
-- Время создания: Апр 05 2025 г., 02:51
-- Версия сервера: 5.7.39
-- Версия PHP: 7.4.33

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- База данных: `htube`
--

-- --------------------------------------------------------

--
-- Структура таблицы `comments`
--

CREATE TABLE `comments` (
  `id` int(11) NOT NULL,
  `user_id` int(10) NOT NULL,
  `parent_id` int(10) DEFAULT NULL,
  `video_id` bigint(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `content` text NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4;

--
-- Дамп данных таблицы `comments`
--

INSERT INTO `comments` (`id`, `user_id`, `parent_id`, `video_id`, `created_at`, `updated_at`, `content`) VALUES
(54, 15, NULL, 1738719233672, '2025-02-19 12:54:35', '2025-02-19 12:54:35', 'huseyn1'),

-- --------------------------------------------------------

--
-- Структура таблицы `comment_likes`
--

CREATE TABLE `comment_likes` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `comment_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `like_status` tinyint(1) NOT NULL,
  `video_id` bigint(60) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

--
-- Дамп данных таблицы `comment_likes`
--

INSERT INTO `comment_likes` (`id`, `user_id`, `comment_id`, `created_at`, `like_status`, `video_id`) VALUES
(187, 16, 267, '2025-03-11 06:49:04', 1, 1740918395295),
(141, 16, 191, '2025-03-06 13:52:27', 1, 1739702690465),
(177, 17, 198, '2025-03-10 15:28:24', 1, 1740918395295),
(137, 16, 260, '2025-03-04 14:52:54', 0, 1740917301719),
(136, 16, 229, '2025-03-04 14:52:47', 1, 1740917301719),
(135, 16, 227, '2025-03-04 14:52:45', 1, 1740917301719),
(176, 17, 264, '2025-03-10 15:16:57', 1, 1741619752041),
(133, 16, 230, '2025-03-04 14:33:26', 1, 1740917301719),
(138, 16, 228, '2025-03-04 14:52:58', 1, 1740917301719),
(129, 16, 197, '2025-03-02 12:17:19', 1, 1740917301719),
(128, 16, 195, '2025-03-02 12:16:54', 1, 1740917301719),
(127, 15, 195, '2025-03-02 12:12:14', 1, 1740917301719),
(126, 16, 184, '2025-02-28 02:29:59', 1, 1739702690465),
(125, 16, 174, '2025-02-28 02:29:00', 1, 1739702690465),
(124, 16, 161, '2025-02-28 01:49:37', 1, 1739702690465),
(123, 16, 165, '2025-02-28 01:48:46', 0, 1739702690465),
(122, 16, 167, '2025-02-28 01:48:38', 1, 1739702690465),
(121, 15, 165, '2025-02-27 14:42:22', 1, 1739702690465),
(119, 16, 159, '2025-02-27 14:31:26', 1, 1739702690465),
(117, 15, 160, '2025-02-27 14:30:28', 0, 1739702690465),
(118, 15, 159, '2025-02-27 14:30:31', 1, 1739702690465),
(106, 15, 115, '2025-02-27 14:26:56', 1, 1739702690465),
(97, 15, 174, '2025-02-27 14:19:06', 0, 1739702690465);

-- --------------------------------------------------------

--
-- Структура таблицы `likes_dislikes`
--

CREATE TABLE `likes_dislikes` (
  `id` int(11) NOT NULL,
  `video_id` bigint(20) NOT NULL,
  `user_id` int(11) NOT NULL,
  `like_status` tinyint(1) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4;

--
-- Дамп данных таблицы `likes_dislikes`
--

INSERT INTO `likes_dislikes` (`id`, `video_id`, `user_id`, `like_status`) VALUES
(176, 1739702690465, 1162, 1),
(177, 1739702690465, 1163, 1),
(178, 1739702690465, 1164, 1),

-- --------------------------------------------------------

--
-- Структура таблицы `subscriptions`
--

CREATE TABLE `subscriptions` (
  `id` int(11) NOT NULL,
  `subscriber_id` int(11) NOT NULL,
  `channel_id` int(11) NOT NULL,
  `subscribe_timestamp` datetime NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4;

--
-- Дамп данных таблицы `subscriptions`
--

INSERT INTO `subscriptions` (`id`, `subscriber_id`, `channel_id`, `subscribe_timestamp`) VALUES
(308, 16, 15, '2025-02-16 17:55:00'),
(309, 20, 12, '2025-02-16 18:10:40'),
(310, 21, 12, '2025-02-16 18:10:40'),
(311, 22, 12, '2025-02-16 18:10:40'),
(312, 23, 12, '2025-02-16 18:10:40'),
(313, 24, 12, '2025-02-16 18:10:40'),
(314, 25, 12, '2025-02-16 18:10:40'),
(315, 26, 12, '2025-02-16 18:10:40'),

-- --------------------------------------------------------

--
-- Структура таблицы `users`
--

CREATE TABLE `users` (
  `id` int(20) NOT NULL,
  `name` varchar(100) NOT NULL,
  `surname` varchar(100) NOT NULL,
  `password` varchar(60) NOT NULL,
  `email` varchar(100) NOT NULL,
  `avatarImage` varchar(200) NOT NULL,
  `slug` varchar(50) NOT NULL,
  `discription` text
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4;

--
-- Дамп данных таблицы `users`
--

INSERT INTO `users` (`id`, `name`, `surname`, `password`, `email`, `avatarImage`, `slug`, `discription`) VALUES
(12, 'hasan', 'sharipov', '$2b$15$99nhDywcle742QpmTG4KZO5U5l7xnMK4/YUif46NCKihkT/6NpXWa', 'huseynsharipov08@gmail.com', '1737972375411-415802427.jpeg', 'hasanITJ', NULL),
(16, 'huseyn', 'sharipov', '$2b$15$0WZHb33O131NP1wuT2/7GOrxUngGGAPfKcXu0gxnin8smCVpRU7oe', 'huseynsharipov6668934893489983489343443@gmail.com', '1739188186691-897182633.jpg', 'huseyn_IT', NULL),

-- --------------------------------------------------------

--
-- Структура таблицы `videos`
--

CREATE TABLE `videos` (
  `id` int(10) NOT NULL,
  `user_id` int(10) NOT NULL,
  `title` varchar(100) NOT NULL,
  `discription` varchar(500) NOT NULL,
  `banner` varchar(200) NOT NULL,
  `uploaded_at` datetime NOT NULL,
  `filename` varchar(100) NOT NULL,
  `video_seconds` int(20) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4;

--
-- Дамп данных таблицы `videos`
--

INSERT INTO `videos` (`id`, `user_id`, `title`, `discription`, `banner`, `uploaded_at`, `filename`, `video_seconds`) VALUES
(58, 16, 'Underworld1112312', 'Underworld1', '1740918461008-974196827.png', '2025-03-02 12:27:41', '1740918395295', 209),
(59, 17, '.env', '.env', '1741619779734-291694737.jpeg', '2025-03-10 15:16:19', '1741619752041', 13),
(55, 12, 'Node.js | FullStack', 'Node или Node.js (читается: ноуд или ноуд-джей-эс) — программная платформа, основанная на движке V8 (компилирующем JavaScript в машинный код), превращающая JavaScript из узкоспециализированного языка в язык общего назначения. Node.js добавляет возможность JavaScript взаимодействовать с устройствами ввода-вывода через свой API, написанный на C++, подключать другие внешние библиотеки, написанные на разных языках, обеспечивая вызовы к ним из JavaScript-кода. ', '1739702860921-803890661.png', '2025-02-16 10:47:40', '1739702690465', 336),
(57, 15, 'chatGPT | JavaScript openAI (API)', 'This API Reference describes the RESTful, streaming, and realtime APIs you can use to interact with the OpenAI platform. REST APIs are usable via HTTP in any environment that supports HTTP requests.\n\nOn top of the core REST APIs, we also offer language-specific SDKs for a variety of popular backend programming languages like JavaScript, Python, and C#. You can see the full list of supported languages', '1740917504029-640305623.jpeg', '2025-03-02 12:11:44', '1740917301719', 793),
(61, 16, 'wfe', 'wef', '1742102233552-874308765.jpeg', '2025-03-16 05:17:13', '1742102224115', 13),
(62, 16, 'Prototype', 'Prototype', '1742227208159-960395016.jpeg', '2025-03-17 16:00:08', '1742227024585', 899);

-- --------------------------------------------------------

--
-- Структура таблицы `views`
--

CREATE TABLE `views` (
  `view_id` int(11) NOT NULL,
  `video_id` bigint(100) NOT NULL,
  `user_id` varchar(40) NOT NULL,
  `watched_seconds` int(6) NOT NULL,
  `views_date` datetime NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4;

--
-- Дамп данных таблицы `views`
--

INSERT INTO `views` (`view_id`, `video_id`, `user_id`, `watched_seconds`, `views_date`) VALUES
(223, 1740918395295, '16', 9, '2025-03-16 11:37:59'),
(176, 1740917301719, '15', 38, '2025-03-02 19:12:55'),
(227, 1742102224115, '16', 7, '2025-03-17 22:55:14'),
(93, 1738719233672, '12', 3, '2025-02-23 21:25:18'),
(132, 1739702690465, '17', 8, '2025-03-10 22:14:23'),
(209, 1741620980612, '17', 1043, '2025-03-10 22:50:14'),
(183, 1740918395295, '15', 43, '2025-03-02 20:49:39'),
(205, 1740918395295, '17', 25, '2025-03-10 22:55:13'),
(122, 1739082179904, '12', 1, '2025-02-16 17:44:15'),
(121, 1738749730226, '12', 40, '2025-02-16 17:40:45'),
(123, 1739702690465, '12', 45, '2025-02-23 22:06:44'),
(134, 1739792589486, '17', 2, '2025-02-17 20:06:50'),
(212, 1741619752041, '16', 13, '2025-03-11 14:21:29'),
(166, 1739082179904, '15', 5, '2025-03-01 14:16:09'),
(133, 1738719233672, '17', 9, '2025-02-17 20:06:22'),
(159, 1739702690465, '15', 27, '2025-03-02 19:13:11'),
(167, 1738719233672, '15', 2, '2025-02-26 01:07:38'),
(213, 1739702690465, '16', 190, '2025-03-11 14:21:34'),
(185, 1740918395295, '12', 104, '2025-03-03 19:27:17'),
(222, 1740917301719, '16', 3, '2025-03-16 11:37:45'),
(208, 1741619752041, '17', 4, '2025-03-10 22:55:22'),
(188, 1740917301719, '12', 750, '2025-03-04 19:07:00'),
(206, 1740917301719, '17', 2, '2025-03-10 22:23:56'),
(228, 1742227024585, '16', 762, '2025-03-17 23:01:48');

--
-- Индексы сохранённых таблиц
--

--
-- Индексы таблицы `comments`
--
ALTER TABLE `comments`
  ADD PRIMARY KEY (`id`);

--
-- Индексы таблицы `comment_likes`
--
ALTER TABLE `comment_likes`
  ADD PRIMARY KEY (`id`);

--
-- Индексы таблицы `likes_dislikes`
--
ALTER TABLE `likes_dislikes`
  ADD PRIMARY KEY (`id`);

--
-- Индексы таблицы `subscriptions`
--
ALTER TABLE `subscriptions`
  ADD PRIMARY KEY (`id`);

--
-- Индексы таблицы `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`);

--
-- Индексы таблицы `videos`
--
ALTER TABLE `videos`
  ADD PRIMARY KEY (`id`);

--
-- Индексы таблицы `views`
--
ALTER TABLE `views`
  ADD PRIMARY KEY (`view_id`),
  ADD UNIQUE KEY `user_id` (`user_id`,`video_id`);

--
-- AUTO_INCREMENT для сохранённых таблиц
--

--
-- AUTO_INCREMENT для таблицы `comments`
--
ALTER TABLE `comments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=268;

--
-- AUTO_INCREMENT для таблицы `comment_likes`
--
ALTER TABLE `comment_likes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=188;

--
-- AUTO_INCREMENT для таблицы `likes_dislikes`
--
ALTER TABLE `likes_dislikes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1499008;

--
-- AUTO_INCREMENT для таблицы `subscriptions`
--
ALTER TABLE `subscriptions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15296;

--
-- AUTO_INCREMENT для таблицы `users`
--
ALTER TABLE `users`
  MODIFY `id` int(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT для таблицы `videos`
--
ALTER TABLE `videos`
  MODIFY `id` int(10) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=65;

--
-- AUTO_INCREMENT для таблицы `views`
--
ALTER TABLE `views`
  MODIFY `view_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=229;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
