<?php
// backend/scripts/update_order_enum.php
// Idempotently add the customer-visible out_for_delivery status.
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';

try {
    $pdo = getDbConnection();
    $column = $pdo->query("SHOW COLUMNS FROM `orders` LIKE 'status'")->fetch();
    if (!$column) {
        throw new RuntimeException('orders.status column does not exist.');
    }

    if (strpos((string)$column['Type'], "'out_for_delivery'") === false) {
        $pdo->exec("
            ALTER TABLE `orders`
            MODIFY COLUMN `status` ENUM('pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled') NOT NULL DEFAULT 'pending'
        ");
        echo "✓ Added out_for_delivery to orders.status.\n";
    } else {
        echo "✓ orders.status already supports out_for_delivery.\n";
    }
} catch (Throwable $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
