-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Mar 27, 2026 at 08:56 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `tea`
--

-- --------------------------------------------------------

--
-- Table structure for table `chat_message`
--

CREATE TABLE `chat_message` (
  `message_id` int(10) NOT NULL,
  `room_id` int(10) NOT NULL,
  `sender_type` enum('user','shop') NOT NULL,
  `sender_user_id` int(10) DEFAULT NULL,
  `message_type` enum('text','product','image') NOT NULL DEFAULT 'text',
  `message_text` text DEFAULT NULL,
  `product_id` int(10) DEFAULT NULL,
  `image_path` varchar(255) DEFAULT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `chat_message`
--

INSERT INTO `chat_message` (`message_id`, `room_id`, `sender_type`, `sender_user_id`, `message_type`, `message_text`, `product_id`, `image_path`, `is_read`, `created_at`) VALUES
(4, 1, 'shop', 1, 'text', '????????? ???? Green Tea House ???????????????????????????????? ???????????????????????????????????????????????', NULL, NULL, 0, '2026-03-27 19:02:43'),
(5, 1, 'shop', 1, 'text', '?????????????????????? Lat Yao, Chatuchak, Bangkok', NULL, NULL, 0, '2026-03-27 19:02:43'),
(6, 1, 'shop', 1, 'product', NULL, 5, NULL, 0, '2026-03-27 19:02:43'),
(10, 2, 'user', 6, 'text', 'อยากสอบถามรายละเอียดสินค้าในร้านค่ะ', NULL, NULL, 0, '2026-03-27 19:13:58'),
(11, 2, 'shop', 2, 'text', '???? Milk Tea Corner ????????????????? ???????????????????????????????????', NULL, NULL, 0, '2026-03-27 19:13:58'),
(12, 2, 'user', 6, 'text', 'อยากสอบถามรายละเอียดสินค้าในร้านค่ะ', NULL, NULL, 0, '2026-03-27 19:13:58'),
(13, 2, 'shop', 2, 'text', '???? Milk Tea Corner ????????????????? ???????????????????????????????????', NULL, NULL, 0, '2026-03-27 19:13:58'),
(14, 2, 'user', 6, 'text', 'อยากสอบถามรายละเอียดสินค้าในร้านค่ะ', NULL, NULL, 0, '2026-03-27 19:13:58'),
(15, 2, 'shop', 2, 'text', '???? Milk Tea Corner ????????????????? ???????????????????????????????????', NULL, NULL, 0, '2026-03-27 19:13:58'),
(16, 2, 'user', 6, 'text', 'ร้านจัดส่งภายในกี่วันคะ', NULL, NULL, 0, '2026-03-27 19:14:00'),
(17, 2, 'shop', 2, 'text', '???? Milk Tea Corner ????????????????? ???????????????????????????????????', NULL, NULL, 0, '2026-03-27 19:14:00'),
(18, 2, 'user', 6, 'text', 'ตอนนี้ร้านมีโปรโมชั่นอะไรบ้างคะ', NULL, NULL, 0, '2026-03-27 19:14:01'),
(19, 2, 'shop', 2, 'text', '???? Milk Tea Corner ????????????????? ???????????????????????????????????', NULL, NULL, 0, '2026-03-27 19:14:01'),
(20, 2, 'user', 6, 'text', 'เ', NULL, NULL, 0, '2026-03-27 19:14:04'),
(21, 2, 'shop', 2, 'text', '???? Milk Tea Corner ????????????????? ???????????????????????????????????', NULL, NULL, 0, '2026-03-27 19:14:04');

-- --------------------------------------------------------

--
-- Table structure for table `chat_room`
--

CREATE TABLE `chat_room` (
  `room_id` int(10) NOT NULL,
  `user_id` int(10) NOT NULL,
  `shop_id` int(10) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `last_message_at` timestamp NULL DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'open'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `chat_room`
--

INSERT INTO `chat_room` (`room_id`, `user_id`, `shop_id`, `created_at`, `updated_at`, `last_message_at`, `status`) VALUES
(1, 6, 1, '2026-03-27 18:48:56', '2026-03-27 19:02:43', '2026-03-27 19:02:43', 'open'),
(2, 6, 2, '2026-03-27 19:03:16', '2026-03-27 19:14:04', '2026-03-27 19:14:04', 'open');

-- --------------------------------------------------------

--
-- Table structure for table `event`
--

CREATE TABLE `event` (
  `event_id` int(10) NOT NULL,
  `organizer_id` int(10) NOT NULL,
  `title` varchar(300) NOT NULL,
  `description` text DEFAULT NULL,
  `event_date` date NOT NULL,
  `location` varchar(255) DEFAULT NULL,
  `max_participant` int(3) DEFAULT NULL,
  `price` decimal(10,2) DEFAULT 0.00,
  `status` varchar(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `event`
--

INSERT INTO `event` (`event_id`, `organizer_id`, `title`, `description`, `event_date`, `location`, `max_participant`, `price`, `status`, `created_at`) VALUES
(1, 1, 'Bangkok Tea Festival', 'Festival for tea lovers with tasting session', '2026-04-10', 'Bangkok Art Center', 100, 150.00, 'open', '2026-03-09 14:56:41'),
(2, 1, 'Matcha Workshop', 'Learn how to make authentic Japanese matcha', '2026-04-15', 'สุขุมวิท 50', 30, 300.00, 'open', '2026-03-09 14:56:41'),
(3, 2, 'Chiang Mai Tea Tour', 'Visit tea plantations and taste fresh tea', '2026-05-01', 'Doi Mae Salong', 40, 500.00, 'open', '2026-03-09 14:56:41'),
(4, 2, 'Oolong Tea Tasting', 'Premium oolong tea tasting event', '2026-05-10', 'Nimmanhaemin Road', 25, 250.00, 'open', '2026-03-09 14:56:41');

-- --------------------------------------------------------

--
-- Table structure for table `event_images`
--

CREATE TABLE `event_images` (
  `image_id` int(10) NOT NULL,
  `event_id` int(10) NOT NULL,
  `image_path` varchar(255) NOT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `event_payment`
--

CREATE TABLE `event_payment` (
  `payment_id` int(10) NOT NULL,
  `registration_id` int(10) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_method` varchar(30) DEFAULT NULL,
  `payment_status` varchar(30) DEFAULT NULL,
  `paid_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `event_registration`
--

CREATE TABLE `event_registration` (
  `registration_id` int(10) NOT NULL,
  `event_id` int(10) NOT NULL,
  `user_id` int(10) NOT NULL,
  `registration_status` varchar(30) DEFAULT NULL,
  `registered_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `event_review`
--

CREATE TABLE `event_review` (
  `review_id` int(10) NOT NULL,
  `registration_id` int(10) NOT NULL,
  `overall_rating` int(2) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `order_id` int(10) NOT NULL,
  `user_id` int(10) NOT NULL,
  `address_id` int(10) DEFAULT NULL,
  `order_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` varchar(30) NOT NULL DEFAULT 'pending',
  `total_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `recipient_name` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `shipping_address` text DEFAULT NULL,
  `subdistrict` varchar(100) DEFAULT NULL,
  `district` varchar(100) DEFAULT NULL,
  `province` varchar(100) DEFAULT NULL,
  `postal_code` varchar(10) DEFAULT NULL,
  `address_note` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`order_id`, `user_id`, `address_id`, `order_date`, `status`, `total_amount`, `recipient_name`, `phone`, `shipping_address`, `subdistrict`, `district`, `province`, `postal_code`, `address_note`) VALUES
(1, 6, NULL, '2026-03-27 12:01:28', 'pending', 205.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(2, 6, 2, '2026-03-27 12:04:56', 'pending', 225.00, 'Apichat Hwankaew', '0650570453', '66/7', 'เวียงสระ', 'เวียงสระ', 'สุราษฎร์ธานี', '84190', 'หาเอาเดาตามหมุด'),
(3, 6, 2, '2026-03-27 12:14:39', 'pending', 205.00, 'Apichat Hwankaew', '0650570453', '66/7', 'เวียงสระ', 'เวียงสระ', 'สุราษฎร์ธานี', '84190', 'หาเอาเดาตามหมุด'),
(4, 6, 2, '2026-03-27 12:18:59', 'pending', 195.00, 'Apichat Hwankaew', '0650570453', '66/7', 'เวียงสระ', 'เวียงสระ', 'สุราษฎร์ธานี', '84190', 'หาเอาเดาตามหมุด'),
(5, 6, 2, '2026-03-27 16:44:21', 'pending', 130.00, 'Apichat Hwankaew', '0650570453', '66/7', 'เวียงสระ', 'เวียงสระ', 'สุราษฎร์ธานี', '84190', 'หาเอาเดาตามหมุด'),
(6, 6, 2, '2026-03-27 16:44:41', 'pending', 225.00, 'Apichat Hwankaew', '0650570453', '66/7', 'เวียงสระ', 'เวียงสระ', 'สุราษฎร์ธานี', '84190', 'หาเอาเดาตามหมุด'),
(7, 6, 2, '2026-03-27 16:47:34', 'pending', 345.00, 'Apichat Hwankaew', '0650570453', '66/7', 'เวียงสระ', 'เวียงสระ', 'สุราษฎร์ธานี', '84190', 'หาเอาเดาตามหมุด'),
(8, 6, 2, '2026-03-27 16:56:05', 'pending', 300.00, 'Apichat Hwankaew', '0650570453', '66/7', 'เวียงสระ', 'เวียงสระ', 'สุราษฎร์ธานี', '84190', 'หาเอาเดาตามหมุด'),
(9, 6, 2, '2026-03-27 17:00:12', 'pending', 195.00, 'Apichat Hwankaew', '0650570453', '66/7', 'เวียงสระ', 'เวียงสระ', 'สุราษฎร์ธานี', '84190', 'หาเอาเดาตามหมุด');

-- --------------------------------------------------------

--
-- Table structure for table `order_details`
--

CREATE TABLE `order_details` (
  `order_detail_id` int(10) NOT NULL,
  `order_id` int(10) NOT NULL,
  `product_id` int(10) NOT NULL,
  `quantity` int(5) NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `order_details`
--

INSERT INTO `order_details` (`order_detail_id`, `order_id`, `product_id`, `quantity`, `unit_price`, `subtotal`) VALUES
(1, 1, 5, 2, 65.00, 130.00),
(2, 1, 6, 1, 75.00, 75.00),
(3, 2, 6, 3, 75.00, 225.00),
(4, 3, 6, 1, 75.00, 75.00),
(5, 3, 5, 2, 65.00, 130.00),
(6, 4, 5, 3, 65.00, 195.00),
(7, 5, 5, 2, 65.00, 130.00),
(8, 6, 6, 3, 75.00, 225.00),
(9, 7, 5, 3, 65.00, 195.00),
(10, 7, 6, 2, 75.00, 150.00),
(11, 8, 6, 4, 75.00, 300.00),
(12, 9, 5, 3, 65.00, 195.00);

-- --------------------------------------------------------

--
-- Table structure for table `organizer`
--

CREATE TABLE `organizer` (
  `organizer_id` int(10) NOT NULL,
  `user_id` int(10) NOT NULL,
  `first_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) DEFAULT NULL,
  `birth_date` date DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `province` varchar(100) DEFAULT NULL,
  `district` varchar(100) DEFAULT NULL,
  `subdistrict` varchar(100) DEFAULT NULL,
  `national_id` varchar(13) DEFAULT NULL,
  `organization_name` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `verified_status` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `organizer`
--

INSERT INTO `organizer` (`organizer_id`, `user_id`, `first_name`, `last_name`, `birth_date`, `phone`, `address`, `province`, `district`, `subdistrict`, `national_id`, `organization_name`, `description`, `verified_status`) VALUES
(1, 1, 'Somchai', 'Sukjai', '1990-05-12', '0812345678', '123 ถนนสุขุมวิท', 'Bangkok', 'Watthana', 'Khlong Toei Nuea', '1234567890123', 'Tea Lovers Group', 'Organizer for tea tasting events', 1),
(2, 2, 'Suda', 'Meechai', '1995-08-22', '0898765432', '45 ถนนนิมมาน', 'Chiang Mai', 'Mueang', 'Suthep', '9876543210987', 'ChiangMai Tea Club', 'Community for tea culture', 1);

-- --------------------------------------------------------

--
-- Table structure for table `product_images`
--

CREATE TABLE `product_images` (
  `image_id` int(10) NOT NULL,
  `product_id` int(10) NOT NULL,
  `image_path` varchar(255) NOT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `product_images`
--

INSERT INTO `product_images` (`image_id`, `product_id`, `image_path`, `uploaded_at`) VALUES
(1, 5, '/uploads/products/Green herbal tea.jpg', '2026-03-10 01:03:09'),
(2, 6, '/uploads/products/Jasmine Tea Drink - Free photo on Pixabay.jpg', '2026-03-10 01:03:29'),
(4, 7, '/uploads/products/Thai Iced Tea (Sweet, Spiced & Creamy).jpg', '2026-03-10 01:04:23'),
(5, 8, '/uploads/products/Brown Sugar Milk Tea Boba Bubble.jpg', '2026-03-10 01:04:31');

-- --------------------------------------------------------

--
-- Table structure for table `product_review`
--

CREATE TABLE `product_review` (
  `review_id` int(10) NOT NULL,
  `order_detail_id` int(10) NOT NULL,
  `rating` int(2) NOT NULL,
  `comment` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `report`
--

CREATE TABLE `report` (
  `report_id` int(10) NOT NULL,
  `event_id` int(10) NOT NULL,
  `user_id` int(10) NOT NULL,
  `report_type` varchar(100) NOT NULL,
  `report_detail` text NOT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `shop_images`
--

CREATE TABLE `shop_images` (
  `image_id` int(10) NOT NULL,
  `shop_id` int(10) NOT NULL,
  `image_path` varchar(255) NOT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `shop_images`
--

INSERT INTO `shop_images` (`image_id`, `shop_id`, `image_path`, `uploaded_at`) VALUES
(1, 1, '/uploads/shops/teashop.jpg', '2026-03-10 00:55:29'),
(2, 2, '/uploads/shops/Tea Shop interior design.jpg', '2026-03-10 00:46:28');

-- --------------------------------------------------------

--
-- Table structure for table `sponsor`
--

CREATE TABLE `sponsor` (
  `sponsor_id` int(10) NOT NULL,
  `event_id` int(10) NOT NULL,
  `shop_id` int(10) NOT NULL,
  `product_id` int(10) DEFAULT NULL,
  `quantity` int(6) DEFAULT NULL,
  `request_by` varchar(50) NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tea_product`
--

CREATE TABLE `tea_product` (
  `product_id` int(10) NOT NULL,
  `shop_id` int(10) NOT NULL,
  `tea_name` varchar(50) NOT NULL,
  `tea_type` varchar(50) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `stock` int(10) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tea_product`
--

INSERT INTO `tea_product` (`product_id`, `shop_id`, `tea_name`, `tea_type`, `description`, `price`, `stock`) VALUES
(5, 1, 'Classic Green Tea', 'Green Tea', 'Fresh organic green tea leaves', 65.00, 35),
(6, 1, 'Jasmine Green Tea', 'Green Tea', 'Green tea with jasmine aroma', 75.00, 26),
(7, 2, 'Thai Milk Tea', 'Milk Tea', 'Traditional Thai milk tea', 60.00, 80),
(8, 2, 'Brown Sugar Milk Tea', 'Milk Tea', 'Milk tea with brown sugar pearls', 85.00, 60);

-- --------------------------------------------------------

--
-- Table structure for table `tea_shop`
--

CREATE TABLE `tea_shop` (
  `shop_id` int(10) NOT NULL,
  `user_id` int(10) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `shop_name` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `contact_info` varchar(150) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `province` varchar(100) DEFAULT NULL,
  `district` varchar(100) DEFAULT NULL,
  `subdistrict` varchar(100) DEFAULT NULL,
  `national_id` varchar(13) DEFAULT NULL,
  `verified_status` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tea_shop`
--

INSERT INTO `tea_shop` (`shop_id`, `user_id`, `email`, `shop_name`, `description`, `contact_info`, `phone`, `address`, `province`, `district`, `subdistrict`, `national_id`, `verified_status`) VALUES
(1, 1, 'greentea@shop.com', 'Green Tea House', 'Premium organic green tea shop', 'Line: greentea_shop', '0812345678', '123 Tea Street', 'Bangkok', 'Chatuchak', 'Lat Yao', '1234567890123', 1),
(2, 2, 'milktea@shop.com', 'Milk Tea Corner', 'Best milk tea in town', 'Facebook: milkteacorner', '0823456789', '456 Milk Road', 'Bangkok', 'Pathum Wan', 'Lumphini', '2345678901234', 1);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(10) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `username`, `email`, `password`, `created_at`) VALUES
(1, 'testuser', 'test@mail.com', '$2b$10$U4vz8gaaNoMO6kPMi47EIuI0Rwg6fLR67JPbF0uR8L.P5lXDbXcuO', '2026-03-04 15:28:36'),
(2, 'testuser2', 'test2@mail.com', '$2b$10$Gz58mcJiP42iALS7X4H/N.fN7iQX9mozD0awlw4gly7Dj7arwaD4a', '2026-03-09 12:41:55'),
(3, 'mek', 'mek@mail.com', 'mek123', '2026-03-27 10:59:26'),
(6, 'apichat', 'apichat@mail.com', '$2b$10$ZuLXy5SsDAOMzD37LtflcOPIP5GRNrxnmOOsjP1ZYI4vBkM7yCeti', '2026-03-27 11:01:16');

-- --------------------------------------------------------

--
-- Table structure for table `user_address`
--

CREATE TABLE `user_address` (
  `address_id` int(10) NOT NULL,
  `user_id` int(10) NOT NULL,
  `recipient_name` varchar(100) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `address_line` text NOT NULL,
  `subdistrict` varchar(100) DEFAULT NULL,
  `district` varchar(100) DEFAULT NULL,
  `province` varchar(100) DEFAULT NULL,
  `postal_code` varchar(10) DEFAULT NULL,
  `note` text DEFAULT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_address`
--

INSERT INTO `user_address` (`address_id`, `user_id`, `recipient_name`, `phone`, `address_line`, `subdistrict`, `district`, `province`, `postal_code`, `note`, `is_default`, `created_at`, `updated_at`) VALUES
(2, 6, 'Apichat Hwankaew', '0650570453', '66/7', 'เวียงสระ', 'เวียงสระ', 'สุราษฎร์ธานี', '84190', 'หาเอาเดาตามหมุด', 1, '2026-03-27 11:40:24', '2026-03-27 11:40:24');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `chat_message`
--
ALTER TABLE `chat_message`
  ADD PRIMARY KEY (`message_id`),
  ADD KEY `idx_chat_message_room` (`room_id`),
  ADD KEY `idx_chat_message_sender_user` (`sender_user_id`),
  ADD KEY `idx_chat_message_product` (`product_id`),
  ADD KEY `idx_chat_message_read` (`room_id`,`is_read`,`created_at`);

--
-- Indexes for table `chat_room`
--
ALTER TABLE `chat_room`
  ADD PRIMARY KEY (`room_id`),
  ADD UNIQUE KEY `uq_chat_room_user_shop` (`user_id`,`shop_id`),
  ADD KEY `idx_chat_room_user` (`user_id`),
  ADD KEY `idx_chat_room_shop` (`shop_id`);

--
-- Indexes for table `event`
--
ALTER TABLE `event`
  ADD PRIMARY KEY (`event_id`),
  ADD KEY `fk_event_organizer` (`organizer_id`);

--
-- Indexes for table `event_images`
--
ALTER TABLE `event_images`
  ADD PRIMARY KEY (`image_id`),
  ADD KEY `fk_event_images_event` (`event_id`);

--
-- Indexes for table `event_payment`
--
ALTER TABLE `event_payment`
  ADD PRIMARY KEY (`payment_id`),
  ADD KEY `fk_payment_registration` (`registration_id`);

--
-- Indexes for table `event_registration`
--
ALTER TABLE `event_registration`
  ADD PRIMARY KEY (`registration_id`),
  ADD KEY `fk_registration_event` (`event_id`),
  ADD KEY `fk_registration_user` (`user_id`);

--
-- Indexes for table `event_review`
--
ALTER TABLE `event_review`
  ADD PRIMARY KEY (`review_id`),
  ADD KEY `fk_review_registration` (`registration_id`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`order_id`),
  ADD KEY `fk_orders_user` (`user_id`),
  ADD KEY `fk_orders_address` (`address_id`);

--
-- Indexes for table `order_details`
--
ALTER TABLE `order_details`
  ADD PRIMARY KEY (`order_detail_id`),
  ADD KEY `fk_orderdetails_order` (`order_id`),
  ADD KEY `fk_orderdetails_product` (`product_id`);

--
-- Indexes for table `organizer`
--
ALTER TABLE `organizer`
  ADD PRIMARY KEY (`organizer_id`),
  ADD KEY `fk_organizer_user` (`user_id`);

--
-- Indexes for table `product_images`
--
ALTER TABLE `product_images`
  ADD PRIMARY KEY (`image_id`),
  ADD KEY `fk_product_images_product` (`product_id`);

--
-- Indexes for table `product_review`
--
ALTER TABLE `product_review`
  ADD PRIMARY KEY (`review_id`),
  ADD KEY `fk_productreview_orderdetail` (`order_detail_id`);

--
-- Indexes for table `report`
--
ALTER TABLE `report`
  ADD PRIMARY KEY (`report_id`),
  ADD KEY `fk_report_event` (`event_id`),
  ADD KEY `fk_report_user` (`user_id`);

--
-- Indexes for table `shop_images`
--
ALTER TABLE `shop_images`
  ADD PRIMARY KEY (`image_id`),
  ADD KEY `fk_shop_images_shop` (`shop_id`);

--
-- Indexes for table `sponsor`
--
ALTER TABLE `sponsor`
  ADD PRIMARY KEY (`sponsor_id`),
  ADD KEY `fk_sponsor_event` (`event_id`),
  ADD KEY `fk_sponsor_shop` (`shop_id`),
  ADD KEY `fk_sponsor_product` (`product_id`);

--
-- Indexes for table `tea_product`
--
ALTER TABLE `tea_product`
  ADD PRIMARY KEY (`product_id`),
  ADD KEY `fk_product_shop` (`shop_id`);

--
-- Indexes for table `tea_shop`
--
ALTER TABLE `tea_shop`
  ADD PRIMARY KEY (`shop_id`),
  ADD UNIQUE KEY `user_id` (`user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `user_address`
--
ALTER TABLE `user_address`
  ADD PRIMARY KEY (`address_id`),
  ADD KEY `fk_user_address_user` (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `chat_message`
--
ALTER TABLE `chat_message`
  MODIFY `message_id` int(10) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `chat_room`
--
ALTER TABLE `chat_room`
  MODIFY `room_id` int(10) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `event`
--
ALTER TABLE `event`
  MODIFY `event_id` int(10) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `event_images`
--
ALTER TABLE `event_images`
  MODIFY `image_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `event_payment`
--
ALTER TABLE `event_payment`
  MODIFY `payment_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `event_registration`
--
ALTER TABLE `event_registration`
  MODIFY `registration_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `event_review`
--
ALTER TABLE `event_review`
  MODIFY `review_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `order_id` int(10) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `order_details`
--
ALTER TABLE `order_details`
  MODIFY `order_detail_id` int(10) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `organizer`
--
ALTER TABLE `organizer`
  MODIFY `organizer_id` int(10) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `product_images`
--
ALTER TABLE `product_images`
  MODIFY `image_id` int(10) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `product_review`
--
ALTER TABLE `product_review`
  MODIFY `review_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `report`
--
ALTER TABLE `report`
  MODIFY `report_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sponsor`
--
ALTER TABLE `sponsor`
  MODIFY `sponsor_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tea_product`
--
ALTER TABLE `tea_product`
  MODIFY `product_id` int(10) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `tea_shop`
--
ALTER TABLE `tea_shop`
  MODIFY `shop_id` int(10) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(10) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `user_address`
--
ALTER TABLE `user_address`
  MODIFY `address_id` int(10) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `chat_message`
--
ALTER TABLE `chat_message`
  ADD CONSTRAINT `fk_chat_message_product` FOREIGN KEY (`product_id`) REFERENCES `tea_product` (`product_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_chat_message_room` FOREIGN KEY (`room_id`) REFERENCES `chat_room` (`room_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_chat_message_sender_user` FOREIGN KEY (`sender_user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `chat_room`
--
ALTER TABLE `chat_room`
  ADD CONSTRAINT `fk_chat_room_shop` FOREIGN KEY (`shop_id`) REFERENCES `tea_shop` (`shop_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_chat_room_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `event`
--
ALTER TABLE `event`
  ADD CONSTRAINT `fk_event_organizer` FOREIGN KEY (`organizer_id`) REFERENCES `organizer` (`organizer_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `event_images`
--
ALTER TABLE `event_images`
  ADD CONSTRAINT `fk_event_images_event` FOREIGN KEY (`event_id`) REFERENCES `event` (`event_id`) ON DELETE CASCADE;

--
-- Constraints for table `event_payment`
--
ALTER TABLE `event_payment`
  ADD CONSTRAINT `fk_payment_registration` FOREIGN KEY (`registration_id`) REFERENCES `event_registration` (`registration_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `event_registration`
--
ALTER TABLE `event_registration`
  ADD CONSTRAINT `fk_registration_event` FOREIGN KEY (`event_id`) REFERENCES `event` (`event_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_registration_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `event_review`
--
ALTER TABLE `event_review`
  ADD CONSTRAINT `fk_review_registration` FOREIGN KEY (`registration_id`) REFERENCES `event_registration` (`registration_id`) ON DELETE CASCADE;

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `fk_orders_address` FOREIGN KEY (`address_id`) REFERENCES `user_address` (`address_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_orders_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `order_details`
--
ALTER TABLE `order_details`
  ADD CONSTRAINT `fk_orderdetails_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_orderdetails_product` FOREIGN KEY (`product_id`) REFERENCES `tea_product` (`product_id`) ON DELETE CASCADE;

--
-- Constraints for table `organizer`
--
ALTER TABLE `organizer`
  ADD CONSTRAINT `fk_organizer_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `product_images`
--
ALTER TABLE `product_images`
  ADD CONSTRAINT `fk_product_images_product` FOREIGN KEY (`product_id`) REFERENCES `tea_product` (`product_id`) ON DELETE CASCADE;

--
-- Constraints for table `product_review`
--
ALTER TABLE `product_review`
  ADD CONSTRAINT `fk_productreview_orderdetail` FOREIGN KEY (`order_detail_id`) REFERENCES `order_details` (`order_detail_id`) ON DELETE CASCADE;

--
-- Constraints for table `report`
--
ALTER TABLE `report`
  ADD CONSTRAINT `fk_report_event` FOREIGN KEY (`event_id`) REFERENCES `event` (`event_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_report_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `shop_images`
--
ALTER TABLE `shop_images`
  ADD CONSTRAINT `fk_shop_images_shop` FOREIGN KEY (`shop_id`) REFERENCES `tea_shop` (`shop_id`) ON DELETE CASCADE;

--
-- Constraints for table `sponsor`
--
ALTER TABLE `sponsor`
  ADD CONSTRAINT `fk_sponsor_event` FOREIGN KEY (`event_id`) REFERENCES `event` (`event_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_sponsor_product` FOREIGN KEY (`product_id`) REFERENCES `tea_product` (`product_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_sponsor_shop` FOREIGN KEY (`shop_id`) REFERENCES `tea_shop` (`shop_id`) ON DELETE CASCADE;

--
-- Constraints for table `tea_product`
--
ALTER TABLE `tea_product`
  ADD CONSTRAINT `fk_product_shop` FOREIGN KEY (`shop_id`) REFERENCES `tea_shop` (`shop_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `tea_shop`
--
ALTER TABLE `tea_shop`
  ADD CONSTRAINT `fk_teashop_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `user_address`
--
ALTER TABLE `user_address`
  ADD CONSTRAINT `fk_user_address_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
