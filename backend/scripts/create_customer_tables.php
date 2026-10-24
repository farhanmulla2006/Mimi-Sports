<?php
// backend/scripts/create_customer_tables.php
// Script to create customers table and update orders table for Phase 6

declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';

try {
    $pdo = getDbConnection();

    // 1. Create customers table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `customers` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `name` VARCHAR(150) NOT NULL,
            `email` VARCHAR(150) NOT NULL UNIQUE,
            `password_hash` VARCHAR(255) NOT NULL,
            `phone` VARCHAR(30) DEFAULT NULL,
            `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
            `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX `idx_email` (`email`),
            INDEX `idx_status` (`status`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");
    echo "✓ Customers table created successfully!\n";

    // 2. Add customer_id to orders table if not already existing
    $chkCol = $pdo->query("SHOW COLUMNS FROM `orders` LIKE 'customer_id'");
    if ($chkCol->rowCount() === 0) {
        $pdo->exec("
            ALTER TABLE `orders`
            ADD COLUMN `customer_id` INT NULL DEFAULT NULL AFTER `id`,
            ADD INDEX `idx_customer_id` (`customer_id`),
            ADD CONSTRAINT `fk_orders_customer`
                FOREIGN KEY (`customer_id`)
                REFERENCES `customers` (`id`)
                ON DELETE SET NULL
                ON UPDATE CASCADE;
        ");
        echo "✓ customer_id foreign key column added to orders table!\n";
    } else {
        echo "✓ customer_id column already exists in orders table.\n";
    }

} catch (Throwable $e) {
    echo "❌ Migration Error: " . $e->getMessage() . "\n";
    exit(1);
}
