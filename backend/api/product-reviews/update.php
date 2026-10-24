<?php
declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/customer_auth.php';

sendCorsHeaders();
if (($_SERVER['REQUEST_METHOD'] ?? 'PUT') !== 'PUT') {
    sendErrorResponse('Method Not Allowed. Use PUT.', 405);
}

$customer = requireCustomer();
$reviewId = (int)($_GET['id'] ?? 0);
$input = parseJsonInput();
$rating = filter_var($input['rating'] ?? null, FILTER_VALIDATE_INT);
$reviewText = trim((string)($input['review_text'] ?? ''));
if ($reviewId <= 0) sendErrorResponse('Review ID is required.', 400);
if ($rating === false || $rating === null || $rating < 1 || $rating > 5) sendErrorResponse('Rating must be an integer from 1 to 5.', 400);
if (mb_strlen($reviewText) < 5 || mb_strlen($reviewText) > 1000) sendErrorResponse('Review must be between 5 and 1000 characters.', 400);

try {
    $pdo = getDbConnection();
    $update = $pdo->prepare('UPDATE `product_reviews` SET rating = :rating, review_text = :review_text WHERE id = :id AND customer_id = :customer_id');
    $update->execute([
        ':rating' => $rating,
        ':review_text' => $reviewText,
        ':id' => $reviewId,
        ':customer_id' => (int)$customer['id'],
    ]);
    if ($update->rowCount() === 0) {
        $exists = $pdo->prepare('SELECT id FROM `product_reviews` WHERE id = :id LIMIT 1');
        $exists->execute([':id' => $reviewId]);
        $reviewExists = (bool)$exists->fetch();
        sendErrorResponse($reviewExists ? 'You may only edit your own review.' : 'Review not found.', $reviewExists ? 403 : 404);
    }
    sendJsonResponse(['success' => true, 'message' => 'Review updated successfully.']);
} catch (Throwable $e) {
    sendErrorResponse('Unable to update review.', 500);
}