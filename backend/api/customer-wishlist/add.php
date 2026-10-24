<?php
declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/customer_auth.php';

sendCorsHeaders();
if (($_SERVER['REQUEST_METHOD'] ?? 'POST') !== 'POST') {
    sendErrorResponse('Method Not Allowed. Use POST.', 405);
}

$customer = requireCustomer();
$input = parseJsonInput();
$productId = trim((string)($input['product_id'] ?? ''));
if ($productId === '') {
    sendErrorResponse('Product ID is required.', 400);
}

try {
    $pdo = getDbConnection();
    $product = $pdo->prepare('SELECT id, name FROM `products` WHERE id = :id LIMIT 1');
    $product->execute([':id' => $productId]);
    $productRow = $product->fetch();
    if (!$productRow) {
        sendErrorResponse('Product not found.', 404);
    }

    $insert = $pdo->prepare('INSERT IGNORE INTO `wishlist_items` (customer_id, product_id) VALUES (:customer_id, :product_id)');
    $insert->execute([':customer_id' => (int)$customer['id'], ':product_id' => $productId]);

    sendJsonResponse([
        'success' => true,
        'added' => true,
        'product_id' => $productId,
        'message' => $insert->rowCount() > 0 ? 'Added to wishlist.' : 'Product is already in your wishlist.',
    ], 201);
} catch (Throwable $e) {
    sendErrorResponse('Unable to add product to wishlist.', 500);
}