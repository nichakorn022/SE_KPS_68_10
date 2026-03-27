-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Mar 15, 2026 at 01:41 PM
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
  `status` varchar(20) NOT NULL DEFAULT 'draft',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
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
  `registration_status` varchar(30) NOT NULL DEFAULT 'registered',
  `registered_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
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
  `order_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` varchar(30) NOT NULL DEFAULT 'pending',
  `payment_status` varchar(30) NOT NULL DEFAULT 'unpaid',
  `fulfillment_status` varchar(30) NOT NULL DEFAULT 'pending',
  `paid_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `total_amount` decimal(10,2) NOT NULL DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
  `stock` int(10) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tea_product`
--

INSERT INTO `tea_product` (`product_id`, `shop_id`, `tea_name`, `tea_type`, `description`, `price`, `stock`, `created_at`, `updated_at`) VALUES
(5, 1, 'Classic Green Tea', 'Green Tea', 'Fresh organic green tea leaves', 65.00, 50, '2026-03-15 12:31:23', NULL),
(6, 1, 'Jasmine Green Tea', 'Green Tea', 'Green tea with jasmine aroma', 75.00, 40, '2026-03-15 12:31:23', NULL),
(7, 2, 'Thai Milk Tea', 'Milk Tea', 'Traditional Thai milk tea', 60.00, 80, '2026-03-15 12:31:23', NULL),
(8, 2, 'Brown Sugar Milk Tea', 'Milk Tea', 'Milk tea with brown sugar pearls', 85.00, 60, '2026-03-15 12:31:23', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `tea_shop`
--

CREATE TABLE `tea_shop` (
  `shop_id` int(10) NOT NULL,
  `user_id` int(10) NOT NULL,
  `shop_name` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `contact_info` varchar(150) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `province` varchar(100) DEFAULT NULL,
  `district` varchar(100) DEFAULT NULL,
  `subdistrict` varchar(100) DEFAULT NULL,
  `national_id` varchar(13) DEFAULT NULL,
  `verified_status` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tea_shop`
--

INSERT INTO `tea_shop` (`shop_id`, `user_id`, `shop_name`, `description`, `contact_info`, `phone`, `address`, `province`, `district`, `subdistrict`, `national_id`, `verified_status`) VALUES
(1, 1, 'Green Tea House', 'Premium organic green tea shop', 'Line: greentea_shop', '0812345678', '123 Tea Street', 'Bangkok', 'Chatuchak', 'Lat Yao', '1234567890123', 1),
(2, 2, 'Milk Tea Corner', 'Best milk tea in town', 'Facebook: milkteacorner', '0823456789', '456 Milk Road', 'Bangkok', 'Pathum Wan', 'Lumphini', '2345678901234', 1);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(10) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` varchar(30) NOT NULL DEFAULT 'user',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `username`, `email`, `password`, `role`, `created_at`) VALUES
(1, 'testuser', 'test@mail.com', '$2b$10$U4vz8gaaNoMO6kPMi47EIuI0Rwg6fLR67JPbF0uR8L.P5lXDbXcuO', 'user', '2026-03-04 15:28:36'),
(2, 'testuser2', 'test2@mail.com', '$2b$10$Gz58mcJiP42iALS7X4H/N.fN7iQX9mozD0awlw4gly7Dj7arwaD4a', 'user', '2026-03-09 12:41:55'),
(3, 'testuser3', 'test3@mail.com', '$2b$10$iypjBjnmEJaqTzRv2qOnbOIpj4JKqcjUI9vz5glTYaJwvuKodO52m', 'user', '2026-03-10 13:54:54'),
(4, 'testuser4', 'test4@mail.com', '$2b$10$BaIhYUK/w7VUAfPrD8YXD.DmZ8v.PRBvkbTifL647Xr8cr9x2BUnC', 'user', '2026-03-10 14:17:59'),
(5, 'testuser5', 'test5@mail.com', '$2b$10$bXeLMTxpu5rwxf.7pqI0yOuUs2rAxaYn2zuyE/rE8Kzw/yt26T3w6', 'user', '2026-03-10 14:22:24'),
(6, 'testuser6', 'test6@mail.com', '$2b$10$eusHgB22AHUI5HVkBbfqiOdk3UDIF.iWaY0eA.SyYhu72d8awRB6C', 'user', '2026-03-10 14:37:58'),
(7, 'test1112', 'test1112@mail.com', '$2b$10$AQHh/dE7lUgpLWlgAVgfDOQfmVdJRfOvTWI1.D5Xt2nl47tQOsPH2', 'user', '2026-03-10 14:38:46'),
(8, 't', 't', '$2b$10$ESiSeLqqVvfUIiRuq.0g2ux66hDkn4eKFHr8MMD6AwqQOtnuxxe3G', 'user', '2026-03-11 02:40:43'),
(9, 'q', '1', '$2b$10$Ezbn8l5Rn8cvR2FQwNQPxuZ5J6BU/Ieql4n1Ri6cRa35dUeTKSuKC', 'user', '2026-03-11 03:19:30'),
(10, 'w', '2', '$2b$10$fK.Fyc8Z53K1ZbYW4BiPku/exbddhAPZNa7Kr9DCSGFojUQ8FtyM.', 'user', '2026-03-11 03:22:13'),
(11, 'admin', 'admin@atc.local', '$2b$10$bj1rhPSQmr0KCgd1D857teaTzYs0mIRUsA2.Yzg0MDpkwV.BRGo5q', 'admin', '2026-03-27 18:40:00');

--
-- Indexes for dumped tables
--

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
  ADD UNIQUE KEY `unique_event_user` (`event_id`,`user_id`),
  ADD UNIQUE KEY `event_id` (`event_id`,`user_id`),
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
  ADD KEY `fk_orders_user` (`user_id`);

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
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `event`
--
ALTER TABLE `event`
  MODIFY `event_id` int(10) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

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
  MODIFY `order_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `order_details`
--
ALTER TABLE `order_details`
  MODIFY `order_detail_id` int(10) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `organizer`
--
ALTER TABLE `organizer`
  MODIFY `organizer_id` int(10) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `product_images`
--
ALTER TABLE `product_images`
  MODIFY `image_id` int(10) NOT NULL AUTO_INCREMENT;

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
  MODIFY `user_id` int(10) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- Constraints for dumped tables
--

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
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
