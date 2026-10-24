<?php
// Idempotently create wishlist and product review tables.

declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';

try {
    $pdo = getDbConnection();

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `wishlist_items` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `customer_id` INT NOT NULL,
            `product_id` VARCHAR(50) NOT NULL,
            `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY `uq_wishlist_customer_product` (`customer_id`, `product_id`),
            INDEX `idx_wishlist_customer` (`customer_id`),
            INDEX `idx_wishlist_product` (`product_id`),
            CONSTRAINT `fk_wishlist_customer`
                FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`)
                ON DELETE CASCADE ON UPDATE CASCADE,
            CONSTRAINT `fk_wishlist_product`
                FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
                ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `product_reviews` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `product_id` VARCHAR(50) NOT NULL,
            `customer_id` INT NOT NULL,
            `rating` TINYINT UNSIGNED NOT NULL,
            `review_text` VARCHAR(1000) NOT NULL,
            `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY `uq_review_customer_product` (`customer_id`, `product_id`),
            INDEX `idx_reviews_product` (`product_id`),
            INDEX `idx_reviews_customer` (`customer_id`),
            CONSTRAINT `chk_review_rating` CHECK (`rating` BETWEEN 1 AND 5),
            CONSTRAINT `fk_reviews_product`
                FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
                ON DELETE CASCADE ON UPDATE CASCADE,
            CONSTRAINT `fk_reviews_customer`
                FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`)
                ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    echo "Wishlist and product review tables are ready.\n";
} catch (Throwable $e) {
    fwrite(STDERR, "Wishlist/review migration failed: {$e->getMessage()}\n");
    exit(1);
}