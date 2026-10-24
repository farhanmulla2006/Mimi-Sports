<?php
// backend/api/products/delete.php
// DELETE Product by ID endpoint

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/auth.php';

sendCorsHeaders();

$method = $_SERVER['REQUEST_METHOD'] ?? 'DELETE';
if ($method !== 'DELETE' && $method !== 'POST') {
    sendErrorResponse('Method Not Allowed. Use DELETE or POST.', 405);
}

// Protect endpoint: Require Admin Authentication
$admin = requireAdmin();

$input = parseJsonInput();
$id = isset($_GET['id']) ? trim((string)$_GET['id']) : (isset($input['id']) ? trim((string)$input['id']) : '');

if ($id === '') {
    sendErrorResponse('Product ID (id) parameter is required for deletion.', 400);
}

try {
    $pdo = getDbConnection();

    // Check existence
    $checkStmt = $pdo->prepare("SELECT id, name FROM `products` WHERE id = :id LIMIT 1");
    $checkStmt->execute([':id' => $id]);
    $existing = $checkStmt->fetch();

    if (!$existing) {
        sendErrorResponse("Product with ID '$id' not found.", 404);
    }

    // Delete product — foreign key ON DELETE CASCADE will automatically remove rows in product_images
    $stmt = $pdo->prepare("DELETE FROM `products` WHERE id = :id");
    $stmt->execute([':id' => $id]);

    sendJsonResponse([
        'success' => true,
        'message' => sprintf("Product '%s' (ID: %s) deleted successfully.", $existing['name'], $id),
        'deleted_id' => $id,
    ], 200);

} catch (Throwable $e) {
    sendErrorResponse('Failed to delete product: ' . $e->getMessage(), 500);
}
