<?php
// backend/api/admin/orders/update-status.php
// PUT/POST Admin Order Status Update endpoint (Protected: requireAdmin)

declare(strict_types=1);

require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../middleware/auth.php';

sendCorsHeaders();

$method = $_SERVER['REQUEST_METHOD'] ?? 'POST';
if ($method !== 'PUT' && $method !== 'POST') {
    sendErrorResponse('Method Not Allowed. Use PUT or POST.', 405);
}

// Protect endpoint: Require Admin Authentication
$admin = requireAdmin();

$input = parseJsonInput();
$orderIdentifier = isset($_GET['id']) ? trim((string)$_GET['id']) : (isset($input['id']) ? trim((string)$input['id']) : (isset($input['order_number']) ? trim((string)$input['order_number']) : ''));
$newStatus = isset($input['status']) ? strtolower(trim((string)$input['status'])) : '';

if ($orderIdentifier === '') {
    sendErrorResponse('Order ID (id or order_number) parameter is required.', 400);
}

$validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];

if (!in_array($newStatus, $validStatuses, true)) {
    sendErrorResponse(
        sprintf("Invalid status '%s'. Must be one of: %s.", $newStatus, implode(', ', $validStatuses)),
        400
    );
}

try {
    $pdo = getDbConnection();

    // Verify order existence
    $chkStmt = $pdo->prepare("SELECT id, order_number, status FROM `orders` WHERE id = :id_num OR order_number = :order_num LIMIT 1");
    $chkStmt->execute([
        ':id_num'    => is_numeric($orderIdentifier) ? (int)$orderIdentifier : 0,
        ':order_num' => $orderIdentifier,
    ]);

    $existingOrder = $chkStmt->fetch();

    if (!$existingOrder) {
        sendErrorResponse("Order '$orderIdentifier' not found.", 404);
    }

    // Update status
    $upStmt = $pdo->prepare("UPDATE `orders` SET status = :status WHERE id = :id");
    $upStmt->execute([
        ':status' => $newStatus,
        ':id'     => (int)$existingOrder['id'],
    ]);

    sendJsonResponse([
        'success'      => true,
        'message'      => sprintf("Order '%s' status updated to '%s' successfully.", $existingOrder['order_number'], $newStatus),
        'order_id'     => (int)$existingOrder['id'],
        'order_number' => $existingOrder['order_number'],
        'old_status'   => $existingOrder['status'],
        'new_status'   => $newStatus,
        'updated_at'   => date('Y-m-d H:i:s'),
    ], 200);

} catch (Throwable $e) {
    sendErrorResponse('Failed to update order status: ' . $e->getMessage(), 500);
}
