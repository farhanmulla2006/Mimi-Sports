<?php
declare(strict_types=1);

require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../middleware/auth.php';

sendCorsHeaders();
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') sendErrorResponse('Method Not Allowed. Use GET.', 405);
requireAdmin();

$search = trim((string)($_GET['search'] ?? ''));
$rating = (int)($_GET['rating'] ?? 0);
try {
    $pdo = getDbConnection();
    $where = [];
    $params = [];
    if ($search !== '') {
        $where[] = '(p.name LIKE :search OR c.name LIKE :search OR r.review_text LIKE :search)';
        $params[':search'] = '%' . $search . '%';
    }
    if ($rating >= 1 && $rating <= 5) {
        $where[] = 'r.rating = :rating';
        $params[':rating'] = $rating;
    }
    $sql = 'SELECT r.id, r.product_id, p.name AS product_name, c.name AS customer_name,
                   r.rating, r.review_text, r.created_at, r.updated_at
            FROM `product_reviews` r
            INNER JOIN `products` p ON p.id = r.product_id
            INNER JOIN `customers` c ON c.id = r.customer_id';
    if ($where) $sql .= ' WHERE ' . implode(' AND ', $where);
    $sql .= ' ORDER BY r.created_at DESC';
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $reviews = $stmt->fetchAll();
    foreach ($reviews as &$review) {
        $review['id'] = (int)$review['id'];
        $review['rating'] = (int)$review['rating'];
    }
    unset($review);
    sendJsonResponse(['success' => true, 'reviews' => $reviews]);
} catch (Throwable $e) {
    sendErrorResponse('Unable to load admin reviews.', 500);
}