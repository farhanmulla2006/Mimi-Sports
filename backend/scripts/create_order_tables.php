<?php
// backend/scripts/create_order_tables.php
// Script to create orders and order_items tables in MySQL database

declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';

try {
    $pdo = getDbConnection();

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `orders` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `order_number` VARCHAR(50) NOT NULL UNIQUE,
            `customer_name` VARCHAR(150) NOT NULL,
            `customer_email` VARCHAR(150) NOT NULL,
            `customer_phone` VARCHAR(30) NOT NULL,
            `shipping_address` TEXT NOT NULL,
            `shipping_city` VARCHAR(100) NOT NULL,
            `shipping_state` VARCHAR(100) NOT NULL,
            `shipping_pincode` VARCHAR(20) NOT NULL,
            `subtotal` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
            `shipping_charge` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
            `total_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
            `status` ENUM('pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled') NOT NULL DEFAULT 'pending',
            `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX `idx_order_number` (`order_number`),
            INDEX `idx_customer_email` (`customer_email`),
            INDEX `idx_created_at` (`created_at`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `order_items` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `order_id` INT NOT NULL,
            `product_id` VARCHAR(50) NOT NULL,
            `product_name` VARCHAR(255) NOT NULL,
            `quantity` INT NOT NULL DEFAULT 1,
            `unit_price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
            `subtotal` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
            `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX `idx_order_id` (`order_id`),
            INDEX `idx_product_id` (`product_id`),
            CONSTRAINT `fk_order_items_order`
                FOREIGN KEY (`order_id`)
                REFERENCES `orders` (`id`)
                ON DELETE CASCADE
                ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    echo "✓ Orders and order_items tables created successfully in MySQL!\n";
} catch (Throwable $e) {
    echo "❌ Error creating tables: " . $e->getMessage() . "\n";
    exit(1);
}
