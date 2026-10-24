<?php
// backend/scripts/add_payment_fields.php
// Idempotently add payment fields to the existing orders table.

declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';

try {
    $pdo = getDbConnection();
    $existingColumns = array_flip($pdo->query("SHOW COLUMNS FROM `orders`")->fetchAll(PDO::FETCH_COLUMN));
    $columns = [
        'payment_status' => "ALTER TABLE `orders` ADD COLUMN `payment_status` ENUM('pending', 'created', 'paid', 'failed', 'refunded') NOT NULL DEFAULT 'pending' AFTER `status`",
        'payment_method' => "ALTER TABLE `orders` ADD COLUMN `payment_method` VARCHAR(30) NULL DEFAULT NULL AFTER `payment_status`",
        'razorpay_order_id' => "ALTER TABLE `orders` ADD COLUMN `razorpay_order_id` VARCHAR(80) NULL DEFAULT NULL AFTER `payment_method`",
        'razorpay_payment_id' => "ALTER TABLE `orders` ADD COLUMN `razorpay_payment_id` VARCHAR(80) NULL DEFAULT NULL AFTER `razorpay_order_id`",
        'paid_at' => "ALTER TABLE `orders` ADD COLUMN `paid_at` DATETIME NULL DEFAULT NULL AFTER `razorpay_payment_id`",
    ];

    foreach ($columns as $name => $sql) {
        if (!isset($existingColumns[$name])) {
            $pdo->exec($sql);
            echo "ADDED {$name}\n";
        } else {
            echo "EXISTS {$name}\n";
        }
    }

    try {
        $pdo->exec("ALTER TABLE `orders` ADD INDEX `idx_payment_status` (`payment_status`)");
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate key name') === false) {
            throw $e;
        }
    }
} catch (Throwable $e) {
    fwrite(STDERR, "Payment migration failed: {$e->getMessage()}\n");
    exit(1);
}

echo "Payment fields are ready.\n";
