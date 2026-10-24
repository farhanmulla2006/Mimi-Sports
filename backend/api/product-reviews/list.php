<?php
declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';

sendCorsHeaders();
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    sendErrorResponse('Method Not Allowed. Use GET.', 405);
}

$productId = trim((string)($_GET['product_id'] ?? ''));
if ($productId === '') {
    sendErrorResponse('Product ID is required.', 400);
}

try {
    startSession();
    $pdo = getDbConnection();
    $product = $pdo->prepare('SELECT id FROM `products` WHERE id = :id LIMIT 1');
    $product->execute([':id' => $productId]);
    if (!$product->fetch()) {
        sendErrorResponse('Product not found.', 404);
    }

    $viewerId = !empty($_SESSION['customer_id']) ? (int)$_SESSION['customer_id'] : null;
    $stmt = $pdo->prepare(
        'SELECT r.id, r.product_id, r.customer_id, c.name AS customer_name,
                r.rating, r.review_text, r.created_at, r.updated_at,
                CASE WHEN EXISTS (
                    SELECT 1 FROM `orders` o
                    INNER JOIN `order_items` oi ON oi.order_id = o.id
                    WHERE o.customer_id = r.customer_id
                      AND o.status <> \'cancelled\'
                      AND oi.product_id = r.product_id
                ) THEN 1 ELSE 0 END AS verified_purchase
         FROM `product_reviews` r
         INNER JOIN `customers` c ON c.id = r.customer_id
         WHERE r.product_id = :product_id
         ORDER BY r.created_at DESC'
    );
    $stmt->execute([':product_id' => $productId]);
    $reviews = $stmt->fetchAll();
    foreach ($reviews as &$review) {
        $review['id'] = (int)$review['id'];
        $review['rating'] = (int)$review['rating'];
        $review['verified_purchase'] = (bool)$review['verified_purchase'];
        $review['is_owner'] = $viewerId !== null && (int)$review['customer_id'] === $viewerId;
        unset($review['customer_id']);
    }
    unset($review);

    $canReview = false;
    $ownReview = null;
    if ($viewerId !== null) {
        $eligibility = $pdo->prepare(
            'SELECT EXISTS (
                SELECT 1 FROM `orders` o
                INNER JOIN `order_items` oi ON oi.order_id = o.id
                WHERE o.customer_id = :customer_id
                  AND o.status <> \'cancelled\'
                  AND oi.product_id = :product_id
            ) AS has_purchased,
            (SELECT id FROM `product_reviews` WHERE customer_id = :customer_id_2 AND product_id = :product_id_2 LIMIT 1) AS own_review_id'
        );
        $eligibility->execute([
            ':customer_id' => $viewerId,
            ':product_id' => $productId,
            ':customer_id_2' => $viewerId,
            ':product_id_2' => $productId,
        ]);
        $eligibilityRow = $eligibility->fetch();
        $canReview = (bool)$eligibilityRow['has_purchased'] && $eligibilityRow['own_review_id'] === null;
        if ($eligibilityRow['own_review_id'] !== null) {
            foreach ($reviews as $review) {
                if ($review['is_owner']) {
                    $ownReview = $review;
                    break;
                }
            }
        }
    }

    $summary = $pdo->prepare('SELECT COALESCE(AVG(rating), 0) AS average_rating, COUNT(*) AS review_count FROM `product_reviews` WHERE product_id = :product_id');
    $summary->execute([':product_id' => $productId]);
    $summaryRow = $summary->fetch();

    sendJsonResponse([
        'success' => true,
        'reviews' => $reviews,
        'summary' => [
            'average_rating' => round((float)$summaryRow['average_rating'], 1),
            'review_count' => (int)$summaryRow['review_count'],
        ],
        'can_review' => $canReview,
        'own_review' => $ownReview,
    ]);
} catch (Throwable $e) {
    sendErrorResponse('Unable to load product reviews.', 500);
}