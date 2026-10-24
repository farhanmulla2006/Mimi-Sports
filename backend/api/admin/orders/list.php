<?php
// backend/api/admin/orders/list.php
// GET Admin Order List & Summary Statistics endpoint (Protected: requireAdmin)

declare(strict_types=1);

require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../middleware/auth.php';

sendCorsHeaders();

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    sendErrorResponse('Method Not Allowed. Use GET.', 405);
}

// Protect endpoint: Require Admin Authentication
$admin = requireAdmin();

try {
    $pdo = getDbConnection();

    // Query overall summary stats
    $statsQuery = $pdo->query("
        SELECT 
            COUNT(*) as total_orders,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
            SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_count,
            SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing_count,
            SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END) as shipped_count,
            SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered_count,
            SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_count,
            SUM(CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END) as paid_orders,
            COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END), 0.00) as total_revenue
        FROM `orders`
    ");
    $statsRow = $statsQuery->fetch();

    $stats = [
        'total_orders'     => (int)($statsRow['total_orders'] ?? 0),
        'pending_count'    => (int)($statsRow['pending_count'] ?? 0),
        'confirmed_count'  => (int)($statsRow['confirmed_count'] ?? 0),
        'processing_count' => (int)($statsRow['processing_count'] ?? 0),
        'shipped_count'    => (int)($statsRow['shipped_count'] ?? 0),
        'delivered_count'  => (int)($statsRow['delivered_count'] ?? 0),
        'cancelled_count'  => (int)($statsRow['cancelled_count'] ?? 0),
        'total_revenue'    => (float)($statsRow['total_revenue'] ?? 0.00),
        'paid_orders'      => (int)($statsRow['paid_orders'] ?? 0),
    ];

    // Build filter query for order listing
    $search = isset($_GET['search']) ? trim((string)$_GET['search']) : '';
    $statusFilter = isset($_GET['status']) ? strtolower(trim((string)$_GET['status'])) : 'all';

    $where = [];
    $params = [];

    if ($statusFilter !== '' && $statusFilter !== 'all') {
        $where[] = "o.status = :status";
        $params[':status'] = $statusFilter;
    }

    if ($search !== '') {
        $where[] = "(o.order_number LIKE :search OR o.customer_name LIKE :search OR o.customer_email LIKE :search OR o.customer_phone LIKE :search)";
        $params[':search'] = '%' . $search . '%';
    }

    $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';

    $sql = "
        SELECT 
            o.id,
            o.order_number,
            o.customer_name,
            o.customer_email,
            o.customer_phone,
            o.shipping_address,
            o.shipping_city,
            o.shipping_state,
            o.shipping_pincode,
            o.subtotal,
            o.shipping_charge,
            o.total_amount,
            o.status,
            o.payment_status,
            o.payment_method,
            o.created_at,
            o.updated_at,
            COALESCE(SUM(i.quantity), 0) as total_items
        FROM `orders` o
        LEFT JOIN `order_items` i ON i.order_id = o.id
        {$whereClause}
        GROUP BY o.id
        ORDER BY o.created_at DESC
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $ordersRaw = $stmt->fetchAll();

    $orders = array_map(function($row) {
        return [
            'id'               => (int)$row['id'],
            'order_number'     => $row['order_number'],
            'customer_name'    => $row['customer_name'],
            'customer_email'   => $row['customer_email'],
            'customer_phone'   => $row['customer_phone'],
            'shipping_address' => $row['shipping_address'],
            'shipping_city'    => $row['shipping_city'],
            'shipping_state'   => $row['shipping_state'],
            'shipping_pincode'  => $row['shipping_pincode'],
            'subtotal'         => (float)$row['subtotal'],
            'shipping_charge'  => (float)$row['shipping_charge'],
            'total_amount'     => (float)$row['total_amount'],
            'status'           => $row['status'],
            'payment_status'   => $row['payment_status'] ?? 'pending',
            'payment_method'   => $row['payment_method'] ?? null,
            'total_items'      => (int)$row['total_items'],
            'created_at'       => $row['created_at'],
            'updated_at'       => $row['updated_at'],
        ];
    }, $ordersRaw);

    sendJsonResponse([
        'success' => true,
        'stats'   => $stats,
        'orders'  => $orders,
    ], 200);

} catch (Throwable $e) {
    sendErrorResponse('Failed to fetch admin orders list: ' . $e->getMessage(), 500);
}
