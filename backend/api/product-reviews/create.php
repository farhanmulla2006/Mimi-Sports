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
$rating = filter_var($input['rating'] ?? null, FILTER_VALIDATE_INT);
$reviewText = trim((string)($input['review_text'] ?? ''));

$errors = [];
if ($productId === '') $errors['product_id'] = 'Product ID is required.';
if ($rating === false || $rating === null || $rating < 1 || $rating > 5) $errors['rating'] = 'Rating must be an integer from 1 to 5.';
if (mb_strlen($reviewText) < 5 || mb_strlen($reviewText) > 1000) $errors['review_text'] = 'Review must be between 5 and 1000 characters.';
if ($errors) sendErrorResponse('Validation failed.', 400, $errors);

try {
    $pdo = getDbConnection();
    $product = $pdo->prepare('SELECT id FROM `products` WHERE id = :id LIMIT 1');
    $product->execute([':id' => $productId]);
    if (!$product->fetch()) sendErrorResponse('Product not found.', 404);

    $purchase = $pdo->prepare(
        'SELECT 1 FROM `orders` o INNER JOIN `order_items` oi ON oi.order_id = o.id
         WHERE o.customer_id = :customer_id AND o.status <> \'cancelled\' AND oi.product_id = :product_id LIMIT 1'
    );
    $purchase->execute([':customer_id' => (int)$customer['id'], ':product_id' => $productId]);
    if (!$purchase->fetch()) sendErrorResponse('You can review this product after purchasing it.', 403);

    $insert = $pdo->prepare('INSERT INTO `product_reviews` (product_id, customer_id, rating, review_text) VALUES (:product_id, :customer_id, :rating, :review_text)');
    try {
        $insert->execute([
            ':product_id' => $productId,
            ':customer_id' => (int)$customer['id'],
            ':rating' => $rating,
            ':review_text' => $reviewText,
        ]);
    } catch (PDOException $e) {
        if ((string)$e->errorInfo[1] === '1062') sendErrorResponse('You have already reviewed this product.', 409);
        throw $e;
    }

    sendJsonResponse(['success' => true, 'message' => 'Review submitted successfully.'], 201);
} catch (Throwable $e) {
    sendErrorResponse('Unable to submit review.', 500);
}