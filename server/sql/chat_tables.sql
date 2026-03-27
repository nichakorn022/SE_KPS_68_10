START TRANSACTION;

CREATE TABLE `chat_room` (
  `room_id` int(10) NOT NULL AUTO_INCREMENT,
  `user_id` int(10) NOT NULL,
  `shop_id` int(10) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `last_message_at` timestamp NULL DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'open',
  PRIMARY KEY (`room_id`),
  UNIQUE KEY `uq_chat_room_user_shop` (`user_id`, `shop_id`),
  KEY `idx_chat_room_user` (`user_id`),
  KEY `idx_chat_room_shop` (`shop_id`),
  CONSTRAINT `fk_chat_room_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_chat_room_shop`
    FOREIGN KEY (`shop_id`) REFERENCES `tea_shop` (`shop_id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `chat_message` (
  `message_id` int(10) NOT NULL AUTO_INCREMENT,
  `room_id` int(10) NOT NULL,
  `sender_type` enum('user','shop') NOT NULL,
  `sender_user_id` int(10) DEFAULT NULL,
  `message_type` enum('text','product','image') NOT NULL DEFAULT 'text',
  `message_text` text DEFAULT NULL,
  `product_id` int(10) DEFAULT NULL,
  `image_path` varchar(255) DEFAULT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`message_id`),
  KEY `idx_chat_message_room` (`room_id`),
  KEY `idx_chat_message_sender_user` (`sender_user_id`),
  KEY `idx_chat_message_product` (`product_id`),
  KEY `idx_chat_message_read` (`room_id`, `is_read`, `created_at`),
  CONSTRAINT `fk_chat_message_room`
    FOREIGN KEY (`room_id`) REFERENCES `chat_room` (`room_id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_chat_message_sender_user`
    FOREIGN KEY (`sender_user_id`) REFERENCES `users` (`user_id`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_chat_message_product`
    FOREIGN KEY (`product_id`) REFERENCES `tea_product` (`product_id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

COMMIT;
