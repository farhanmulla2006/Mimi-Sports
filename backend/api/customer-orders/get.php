<?php
// backend/api/customer-orders/get.php
// GET Logged-in Customer Order Detail endpoint (Protected: requireCustomer)

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

$orderIdentifier = isset($_GET['order_number']) ? trim((string)$_GET['order_number']) : (isset($_GET['id']) ? trim((string)$_GET['id']) : '');

if ($orderIdentifier === '') {
    sendErrorResponse('Order identifier is required.', 400);
}

try {
    $pdo = getDbConnection();

    // Query order ensuring it belongs to current customer
    $stmt = $pdo->prepare("
        SELECT id, order_number, customer_name, customer_email, customer_phone,
               shipping_address, shipping_city, shipping_state, shipping_pincode,
               subtotal, shipping_charge, total_amount, status, payment_status,
               payment_method, razorpay_payment_id, paid_at, created_at
        FROM `orders`
        WHERE (order_number = :order_num OR id = :id_num)
          AND customer_id = :customer_id
        LIMIT 1
    ");

    $stmt->execute([
        ':order_num'   => $orderIdentifier,
        ':id_num'      => is_numeric($orderIdentifier) ? (int)$orderIdentifier : 0,
        ':customer_id' => $customerId,
    ]);

    $order = $stmt->fetch();

    if (!$order) {
        sendErrorResponse('Order not found or you do not have permission to view this order.', 404);
    }

    // Query order items
    $itemStmt = $pdo->prepare("
        SELECT i.id, i.product_id, i.product_name, i.quantity, i.unit_price, i.subtotal, p.image, p.brand, p.category, p.sport
        FROM `order_items` i
        LEFT JOIN `products` p ON p.id = i.product_id
        WHERE i.order_id = :order_id
        ORDER BY i.id ASC
    ");
    $itemStmt->execute([':order_id' => (int)$order['id']]);
    $items = $itemStmt->fetchAll();

    sendJsonResponse([
        'success' => true,
        'order'   => [
            'id'               => (int)$order['id'],
            'order_number'     => $order['order_number'],
            'customer_name'    => $order['customer_name'],
            'customer_email'   => $order['customer_email'],
            'customer_phone'   => $order['customer_phone'],
            'shipping_address' => $order['shipping_address'],
            'shipping_city'    => $order['shipping_city'],
            'shipping_state'   => $order['shipping_state'],
            'shipping_pincode'  => $order['shipping_pincode'],
            'subtotal'         => (float)$order['subtotal'],
            'shipping_charge'  => (float)$order['shipping_charge'],
            'total_amount'     => (float)$order['total_amount'],
            'status'           => $order['status'],
            'payment_status'   => $order['payment_status'] ?? 'pending',
            'payment_method'   => $order['payment_method'] ?? null,
            'razorpay_payment_id' => $order['razorpay_payment_id'] ?? null,
            'paid_at'          => $order['paid_at'] ?? null,
            'created_at'       => $order['created_at'],
            'items'            => array_map(function($it) {
                return [
                    'id'           => (int)$it['id'],
                    'product_id'   => $it['product_id'],
                    'product_name' => $it['product_name'],
                    'quantity'     => (int)$it['quantity'],
                    'unit_price'   => (float)$it['unit_price'],
                    'subtotal'     => (float)$it['subtotal'],
                    'image'        => $it['image'] ?? sprintf('/images/products/%s.jpg', strtolower($it['product_id'])),
                    'brand'        => $it['brand'] ?? '',
                    'category'     => $it['category'] ?? '',
                    'sport'        => $it['sport'] ?? '',
                ];
            }, $items),
        ],
    ], 200);

} catch (Throwable $e) {
    sendErrorResponse('Failed to fetch customer order detail: ' . $e->getMessage(), 500);
}
