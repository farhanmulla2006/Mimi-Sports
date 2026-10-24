<?php
// backend/api/customer-orders/list.php
// GET Logged-in Customer Order History endpoint (Protected: requireCustomer)

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/customer_auth.php';

sendCorsHeaders();

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    sendErrorResponse('Method Not Allowed. Use GET.', 405);
}

// Require authenticated customer session
$currentCustomer = requireCustomer();
$customerId = (int)$currentCustomer['id'];

try {
    $pdo = getDbConnection();

    $sql = "
        SELECT 
            o.id,
            o.order_number,
            o.subtotal,
            o.shipping_charge,
            o.total_amount,
            o.status,
            o.payment_status,
            o.payment_method,
            o.created_at,
            COALESCE(SUM(i.quantity), 0) as total_items
        FROM `orders` o
        LEFT JOIN `order_items` i ON i.order_id = o.id
        WHERE o.customer_id = :customer_id
        GROUP BY o.id
        ORDER BY o.created_at DESC
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([':customer_id' => $customerId]);
    $rows = $stmt->fetchAll();

    $orders = array_map(function($row) {
        return [
            'id'              => (int)$row['id'],
            'order_number'    => $row['order_number'],
            'subtotal'        => (float)$row['subtotal'],
            'shipping_charge' => (float)$row['shipping_charge'],
            'total_amount'    => (float)$row['total_amount'],
            'status'          => $row['status'],
            'payment_status'  => $row['payment_status'] ?? 'pending',
            'payment_method'  => $row['payment_method'] ?? null,
            'total_items'     => (int)$row['total_items'],
            'created_at'      => $row['created_at'],
        ];
    }, $rows);

    sendJsonResponse([
        'success' => true,
        'orders'  => $orders,
    ], 200);

} catch (Throwable $e) {
    sendErrorResponse('Failed to fetch customer order history: ' . $e->getMessage(), 500);
}
