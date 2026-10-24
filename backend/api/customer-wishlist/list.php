<?php
declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/customer_auth.php';

sendCorsHeaders();
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    sendErrorResponse('Method Not Allowed. Use GET.', 405);
}

$customer = requireCustomer();
try {
    $pdo = getDbConnection();
    $stmt = $pdo->prepare(
        'SELECT w.id AS wishlist_id, w.created_at AS wishlisted_at,
                p.id, p.name, p.brand, p.price, p.original_price, p.discount,
                p.rating, p.reviews, p.stock, p.image
         FROM `wishlist_items` w
         INNER JOIN `products` p ON p.id = w.product_id
         WHERE w.customer_id = :customer_id
         ORDER BY w.created_at DESC'
    );
    $stmt->execute([':customer_id' => (int)$customer['id']]);
    $items = $stmt->fetchAll();
    foreach ($items as &$item) {
        $item['wishlist_id'] = (int)$item['wishlist_id'];
        $item['price'] = (float)$item['price'];
        $item['original_price'] = $item['original_price'] !== null ? (float)$item['original_price'] : null;
        $item['rating'] = (float)$item['rating'];
        $item['reviews'] = (int)$item['reviews'];
        $item['stock'] = (bool)$item['stock'];
    }
    unset($item);
    sendJsonResponse(['success' => true, 'items' => $items, 'count' => count($items)]);
} catch (Throwable $e) {
    sendErrorResponse('Unable to load wishlist.', 500);
}