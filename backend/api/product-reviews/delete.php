<?php
declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/customer_auth.php';

sendCorsHeaders();
if (($_SERVER['REQUEST_METHOD'] ?? 'DELETE') !== 'DELETE') {
    sendErrorResponse('Method Not Allowed. Use DELETE.', 405);
}

$customer = requireCustomer();
$reviewId = (int)($_GET['id'] ?? 0);
if ($reviewId <= 0) sendErrorResponse('Review ID is required.', 400);

try {
    $pdo = getDbConnection();
    $delete = $pdo->prepare('DELETE FROM `product_reviews` WHERE id = :id AND customer_id = :customer_id');
    $delete->execute([':id' => $reviewId, ':customer_id' => (int)$customer['id']]);
    if ($delete->rowCount() === 0) {
        $exists = $pdo->prepare('SELECT id FROM `product_reviews` WHERE id = :id LIMIT 1');
        $exists->execute([':id' => $reviewId]);
        $reviewExists = (bool)$exists->fetch();
        sendErrorResponse($reviewExists ? 'You may only delete your own review.' : 'Review not found.', $reviewExists ? 403 : 404);
    }
    sendJsonResponse(['success' => true, 'message' => 'Review deleted successfully.']);
} catch (Throwable $e) {
    sendErrorResponse('Unable to delete review.', 500);
}