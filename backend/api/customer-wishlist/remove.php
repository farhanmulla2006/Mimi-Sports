<?php
declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/customer_auth.php';

sendCorsHeaders();
if (($_SERVER['REQUEST_METHOD'] ?? 'DELETE') !== 'DELETE') {
    sendErrorResponse('Method Not Allowed. Use DELETE.', 405);
}

$customer = requireCustomer();
$input = parseJsonInput();
$productId = trim((string)($input['product_id'] ?? ($_GET['product_id'] ?? '')));
if ($productId === '') {
    sendErrorResponse('Product ID is required.', 400);
}

try {
    $pdo = getDbConnection();
    $remove = $pdo->prepare('DELETE FROM `wishlist_items` WHERE customer_id = :customer_id AND product_id = :product_id');
    $remove->execute([':customer_id' => (int)$customer['id'], ':product_id' => $productId]);
    sendJsonResponse(['success' => true, 'removed' => $remove->rowCount() > 0, 'product_id' => $productId]);
} catch (Throwable $e) {
    sendErrorResponse('Unable to remove product from wishlist.', 500);
}