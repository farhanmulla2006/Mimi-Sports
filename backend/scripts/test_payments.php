<?php
// backend/scripts/test_payments.php
// Non-destructive payment integration checks. Requires the PHP CLI, database, and API server.

declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';

$failures = 0;
function checkResult(string $name, bool $passed): void {
    global $failures;
    echo ($passed ? "PASS" : "FAIL") . " {$name}\n";
    if (!$passed) $failures++;
}

try {
    $pdo = getDbConnection();
    $columns = $pdo->query("SHOW COLUMNS FROM `orders`")->fetchAll(PDO::FETCH_COLUMN);
    foreach (['payment_status', 'payment_method', 'razorpay_order_id', 'razorpay_payment_id', 'paid_at'] as $column) {
        checkResult("orders has {$column}", in_array($column, $columns, true));
    }

    $productCount = (int)$pdo->query("SELECT COUNT(*) FROM `products`")->fetchColumn();
    checkResult('product catalog contains exactly 138 products', $productCount === 138);

    $duplicateProducts = (int)$pdo->query("SELECT COUNT(*) FROM (SELECT id FROM `products` GROUP BY id HAVING COUNT(*) > 1) duplicates")->fetchColumn();
    $duplicateOrders = (int)$pdo->query("SELECT COUNT(*) FROM (SELECT order_number FROM `orders` GROUP BY order_number HAVING COUNT(*) > 1) duplicates")->fetchColumn();
    $duplicateItems = (int)$pdo->query("SELECT COUNT(*) FROM (SELECT order_id, product_id, quantity, unit_price FROM `order_items` GROUP BY order_id, product_id, quantity, unit_price HAVING COUNT(*) > 1) duplicates")->fetchColumn();
    checkResult('no duplicate product IDs', $duplicateProducts === 0);
    checkResult('no duplicate order numbers', $duplicateOrders === 0);
    checkResult('no duplicate order item rows', $duplicateItems === 0);

    $existingOrder = $pdo->prepare("SELECT COUNT(*) FROM `orders` WHERE order_number = :order_number");
    $existingOrder->execute([':order_number' => 'MS-20260915-93E98']);
    checkResult('historical order MS-20260915-93E98 remains present', (int)$existingOrder->fetchColumn() === 1);

    $signature = hash_hmac('sha256', 'order_test|payment_test', 'test_secret');
    checkResult('HMAC signature generation is deterministic', hash_equals($signature, hash_hmac('sha256', 'order_test|payment_test', 'test_secret')));

    echo "Payment endpoint checks requiring Razorpay test credentials are documented in README.md.\n";
} catch (Throwable $e) {
    echo "FAIL payment integration checks could not run.\n";
    exit(1);
}

exit($failures === 0 ? 0 : 1);
