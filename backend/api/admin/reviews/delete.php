<?php
declare(strict_types=1);

require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../middleware/auth.php';

sendCorsHeaders();
if (($_SERVER['REQUEST_METHOD'] ?? 'DELETE') !== 'DELETE') sendErrorResponse('Method Not Allowed. Use DELETE.', 405);
requireAdmin();
$reviewId = (int)($_GET['id'] ?? 0);
if ($reviewId <= 0) sendErrorResponse('Review ID is required.', 400);

try {
    $pdo = getDbConnection();
    $stmt = $pdo->prepare('DELETE FROM `product_reviews` WHERE id = :id');
    $stmt->execute([':id' => $reviewId]);
    if ($stmt->rowCount() === 0) sendErrorResponse('Review not found.', 404);
    sendJsonResponse(['success' => true, 'message' => 'Review deleted successfully.']);
} catch (Throwable $e) {
    sendErrorResponse('Unable to delete review.', 500);
}