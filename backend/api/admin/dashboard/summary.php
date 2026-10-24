<?php
// backend/api/admin/dashboard/summary.php
// GET protected admin dashboard analytics using live MySQL data.

declare(strict_types=1);

require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../middleware/auth.php';

sendCorsHeaders();

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    sendErrorResponse('Method Not Allowed. Use GET.', 405);
}

$admin = requireAdmin();

function normalizeRange(array $params): array {
    $range = strtolower(trim((string)($params['range'] ?? '30d')));
    $allowed = ['today', '7d', '30d', 'this_month', 'last_month', 'custom'];
    if (!in_array($range, $allowed, true)) {
        $range = '30d';
    }

    $start = null;
    $end = null;
    $now = new DateTime('now', new DateTimeZone('UTC'));

    if ($range === 'today') {
        $start = (clone $now)->setTime(0, 0, 0)->format('Y-m-d H:i:s');
        $end = (clone $now)->setTime(23, 59, 59)->format('Y-m-d H:i:s');
    } elseif ($range === '7d') {
        $start = (clone $now)->modify('-6 days')->setTime(0, 0, 0)->format('Y-m-d H:i:s');
        $end = (clone $now)->setTime(23, 59, 59)->format('Y-m-d H:i:s');
    } elseif ($range === '30d') {
        $start = (clone $now)->modify('-29 days')->setTime(0, 0, 0)->format('Y-m-d H:i:s');
        $end = (clone $now)->setTime(23, 59, 59)->format('Y-m-d H:i:s');
    } elseif ($range === 'this_month') {
        $start = (clone $now)->modify('first day of this month')->setTime(0, 0, 0)->format('Y-m-d H:i:s');
        $end = (clone $now)->modify('last day of this month')->setTime(23, 59, 59)->format('Y-m-d H:i:s');
    } elseif ($range === 'last_month') {
        $start = (clone $now)->modify('first day of previous month')->setTime(0, 0, 0)->format('Y-m-d H:i:s');
        $end = (clone $now)->modify('last day of previous month')->setTime(23, 59, 59)->format('Y-m-d H:i:s');
    } elseif ($range === 'custom') {
        $startInput = trim((string)($params['start_date'] ?? ''));
        $endInput = trim((string)($params['end_date'] ?? ''));

        if ($startInput === '' || $endInput === '') {
            $range = '30d';
            $start = (clone $now)->modify('-29 days')->setTime(0, 0, 0)->format('Y-m-d H:i:s');
            $end = (clone $now)->setTime(23, 59, 59)->format('Y-m-d H:i:s');
        } else {
            $startDt = DateTime::createFromFormat('Y-m-d', $startInput, new DateTimeZone('UTC'));
            $endDt = DateTime::createFromFormat('Y-m-d', $endInput, new DateTimeZone('UTC'));
            if ($startDt === false || $endDt === false) {
                sendErrorResponse('Invalid custom date range. Use YYYY-MM-DD.', 400);
            }
            $start = $startDt->setTime(0, 0, 0)->format('Y-m-d H:i:s');
            $end = $endDt->setTime(23, 59, 59)->format('Y-m-d H:i:s');
            if ($start > $end) {
                sendErrorResponse('Start date cannot be later than end date.', 400);
            }
        }
    }

    return [
        'range' => $range,
        'start' => $start,
        'end' => $end,
    ];
}

try {
    $pdo = getDbConnection();
    $rangeConfig = normalizeRange($_GET);
    $rangeKey = $rangeConfig['range'];
    $rangeStart = $rangeConfig['start'];
    $rangeEnd = $rangeConfig['end'];

    $revenueEligibleStatuses = ['confirmed', 'processing', 'shipped', 'delivered'];
    $summaryStmt = $pdo->query(
        "
        SELECT
            COUNT(*) AS total_orders,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_orders,
            SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) AS processing_orders,
            SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END) AS shipped_orders,
            SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) AS delivered_orders,
            SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_orders,
            COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END), 0) AS total_revenue,
            (SELECT COUNT(*) FROM `customers`) AS total_customers,
            (SELECT COUNT(*) FROM `products`) AS total_products,
            (SELECT COUNT(*) FROM `products` WHERE stock <= 10) AS low_stock_products
        FROM `orders`
        "
    );
    $summaryRow = $summaryStmt->fetch();

    $summary = [
        'total_revenue' => (float)($summaryRow['total_revenue'] ?? 0),
        'total_orders' => (int)($summaryRow['total_orders'] ?? 0),
        'total_customers' => (int)($summaryRow['total_customers'] ?? 0),
        'total_products' => (int)($summaryRow['total_products'] ?? 0),
        'pending_orders' => (int)($summaryRow['pending_orders'] ?? 0),
        'processing_orders' => (int)($summaryRow['processing_orders'] ?? 0),
        'shipped_orders' => (int)($summaryRow['shipped_orders'] ?? 0),
        'delivered_orders' => (int)($summaryRow['delivered_orders'] ?? 0),
        'low_stock_products' => (int)($summaryRow['low_stock_products'] ?? 0),
        'cancelled_orders' => (int)($summaryRow['cancelled_orders'] ?? 0),
    ];

    $revenueStmt = $pdo->prepare(
        "
        SELECT
            COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END), 0) AS total_revenue,
            COALESCE(SUM(CASE WHEN payment_status = 'paid' AND created_at >= :today_start AND created_at <= :today_end THEN total_amount ELSE 0 END), 0) AS revenue_today,
            COALESCE(SUM(CASE WHEN payment_status = 'paid' AND created_at >= :week_start AND created_at <= :week_end THEN total_amount ELSE 0 END), 0) AS revenue_week,
            COALESCE(SUM(CASE WHEN payment_status = 'paid' AND created_at >= :month_start AND created_at <= :month_end THEN total_amount ELSE 0 END), 0) AS revenue_month,
            COALESCE(SUM(CASE WHEN payment_status = 'paid' AND created_at >= :range_start AND created_at <= :range_end THEN total_amount ELSE 0 END), 0) AS revenue_range
        FROM `orders`
        "
    );

    $now = new DateTime('now', new DateTimeZone('UTC'));
    $revenueStmt->execute([
        ':today_start' => $now->format('Y-m-d 00:00:00'),
        ':today_end' => $now->format('Y-m-d 23:59:59'),
        ':week_start' => (clone $now)->modify('-6 days')->setTime(0, 0, 0)->format('Y-m-d H:i:s'),
        ':week_end' => (clone $now)->setTime(23, 59, 59)->format('Y-m-d H:i:s'),
        ':month_start' => (clone $now)->modify('first day of this month')->setTime(0, 0, 0)->format('Y-m-d H:i:s'),
        ':month_end' => (clone $now)->modify('last day of this month')->setTime(23, 59, 59)->format('Y-m-d H:i:s'),
        ':range_start' => $rangeStart,
        ':range_end' => $rangeEnd,
    ]);
    $revenueRow = $revenueStmt->fetch();

    $revenue = [
        'total' => (float)($revenueRow['total_revenue'] ?? 0),
        'today' => (float)($revenueRow['revenue_today'] ?? 0),
        'this_week' => (float)($revenueRow['revenue_week'] ?? 0),
        'this_month' => (float)($revenueRow['revenue_month'] ?? 0),
        'range' => (float)($revenueRow['revenue_range'] ?? 0),
    ];

    $statusStmt = $pdo->prepare(
        "
        SELECT
            status,
            COUNT(*) AS total
        FROM `orders`
        WHERE created_at >= :range_start AND created_at <= :range_end
        GROUP BY status
        ORDER BY FIELD(status, 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')
        "
    );
    $statusStmt->execute([':range_start' => $rangeStart, ':range_end' => $rangeEnd]);
    $statusRows = $statusStmt->fetchAll();

    $statusMap = ['pending' => 0, 'confirmed' => 0, 'processing' => 0, 'shipped' => 0, 'delivered' => 0, 'cancelled' => 0];
    foreach ($statusRows as $row) {
        $status = strtolower((string)($row['status'] ?? ''));
        if (isset($statusMap[$status])) {
            $statusMap[$status] = (int)$row['total'];
        }
    }

    $orderStatus = [
        ['status' => 'Pending', 'count' => $statusMap['pending']],
        ['status' => 'Confirmed', 'count' => $statusMap['confirmed']],
        ['status' => 'Processing', 'count' => $statusMap['processing']],
        ['status' => 'Shipped', 'count' => $statusMap['shipped']],
        ['status' => 'Delivered', 'count' => $statusMap['delivered']],
        ['status' => 'Cancelled', 'count' => $statusMap['cancelled']],
    ];

    $salesTrendStmt = $pdo->prepare(
        "
        SELECT DATE(created_at) AS order_date,
               COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END), 0) AS revenue
        FROM `orders`
        WHERE created_at >= :range_start AND created_at <= :range_end
        GROUP BY DATE(created_at)
        ORDER BY order_date ASC
        "
    );
    $salesTrendStmt->execute([':range_start' => $rangeStart, ':range_end' => $rangeEnd]);
    $salesTrend = array_map(function ($row) {
        return [
            'date' => $row['order_date'],
            'revenue' => (float)($row['revenue'] ?? 0),
        ];
    }, $salesTrendStmt->fetchAll());

    $topProductsStmt = $pdo->prepare(
        "
        SELECT p.name AS product_name, p.sport, p.price,
               SUM(oi.quantity) AS units_sold,
               SUM(CASE WHEN o.payment_status = 'paid' THEN oi.subtotal ELSE 0 END) AS revenue
        FROM `order_items` oi
        INNER JOIN `products` p ON p.id = oi.product_id
        INNER JOIN `orders` o ON o.id = oi.order_id
        WHERE o.payment_status = 'paid'
          AND o.created_at >= :range_start AND o.created_at <= :range_end
        GROUP BY oi.product_id, p.name, p.sport, p.price
        ORDER BY units_sold DESC, revenue DESC
        LIMIT 10
        "
    );
    $topProductsStmt->execute([':range_start' => $rangeStart, ':range_end' => $rangeEnd]);
    $topProductsRows = $topProductsStmt->fetchAll();
    $topProducts = array_map(function ($row, $index) {
        return [
            'rank' => $index + 1,
            'product' => $row['product_name'],
            'sport' => $row['sport'],
            'quantity' => (int)($row['units_sold'] ?? 0),
            'revenue' => (float)($row['revenue'] ?? 0),
        ];
    }, $topProductsRows, array_keys($topProductsRows));

    $topSportsStmt = $pdo->prepare(
        "
        SELECT p.sport,
               SUM(oi.quantity) AS units_sold,
               SUM(CASE WHEN o.payment_status = 'paid' THEN oi.subtotal ELSE 0 END) AS revenue,
               COUNT(DISTINCT o.id) AS orders
        FROM `order_items` oi
        INNER JOIN `products` p ON p.id = oi.product_id
        INNER JOIN `orders` o ON o.id = oi.order_id
        WHERE o.payment_status = 'paid'
          AND o.created_at >= :range_start AND o.created_at <= :range_end
        GROUP BY p.sport
        ORDER BY revenue DESC, units_sold DESC
        LIMIT 10
        "
    );
    $topSportsStmt->execute([':range_start' => $rangeStart, ':range_end' => $rangeEnd]);
    $topSports = array_map(function ($row) {
        return [
            'sport' => $row['sport'] ?? 'Unknown',
            'units_sold' => (int)($row['units_sold'] ?? 0),
            'revenue' => (float)($row['revenue'] ?? 0),
            'orders' => (int)($row['orders'] ?? 0),
        ];
    }, $topSportsStmt->fetchAll());

    $recentOrdersStmt = $pdo->prepare(
        "
        SELECT o.id, o.order_number, o.customer_name, o.customer_email, o.total_amount, o.status, o.created_at
        FROM `orders` o
        WHERE o.created_at >= :range_start AND o.created_at <= :range_end
        ORDER BY o.created_at DESC
        LIMIT 10
        "
    );
    $recentOrdersStmt->execute([':range_start' => $rangeStart, ':range_end' => $rangeEnd]);
    $recentOrders = array_map(function ($row) {
        return [
            'id' => (int)$row['id'],
            'order_number' => $row['order_number'],
            'customer' => $row['customer_name'] ?: $row['customer_email'],
            'date' => $row['created_at'],
            'total' => (float)($row['total_amount'] ?? 0),
            'status' => $row['status'],
        ];
    }, $recentOrdersStmt->fetchAll());

    $lowStockStmt = $pdo->prepare(
        "
        SELECT id, name, sport, stock, price
        FROM `products`
        WHERE stock <= 10
        ORDER BY stock ASC, price DESC
        LIMIT 10
        "
    );
    $lowStockStmt->execute();
    $lowStock = array_map(function ($row) {
        return [
            'id' => (int)$row['id'],
            'name' => $row['name'],
            'sport' => $row['sport'],
            'stock' => (int)($row['stock'] ?? 0),
            'price' => (float)($row['price'] ?? 0),
        ];
    }, $lowStockStmt->fetchAll());

    $customerSummaryStmt = $pdo->query(
        "
        SELECT
            (SELECT COUNT(*) FROM `customers`) AS total_customers,
            (SELECT COUNT(*) FROM `customers` WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)) AS new_today,
            (SELECT COUNT(*) FROM `customers` WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) AS new_week,
            (SELECT COUNT(*) FROM `customers` WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)) AS new_month,
            (SELECT COUNT(DISTINCT customer_id) FROM `orders` WHERE customer_id IS NOT NULL) AS customers_with_orders,
            (SELECT COUNT(*) FROM `customers` WHERE id NOT IN (SELECT DISTINCT customer_id FROM `orders` WHERE customer_id IS NOT NULL)) AS customers_without_orders
        "
    );
    $customerSummaryRow = $customerSummaryStmt->fetch();

    $customerTopStmt = $pdo->prepare(
        "
        SELECT o.customer_id, c.name, c.email,
               COUNT(o.id) AS order_count,
               COALESCE(SUM(CASE WHEN o.payment_status = 'paid' THEN o.total_amount ELSE 0 END), 0) AS total_spent
        FROM `orders` o
        LEFT JOIN `customers` c ON c.id = o.customer_id
        WHERE o.customer_id IS NOT NULL
        GROUP BY o.customer_id, c.name, c.email
        ORDER BY total_spent DESC, order_count DESC
        LIMIT 10
        "
    );
    $customerTopStmt->execute();
    $topCustomers = array_map(function ($row) {
        return [
            'customer' => $row['name'] ?: $row['email'],
            'orders' => (int)($row['order_count'] ?? 0),
            'total_spent' => (float)($row['total_spent'] ?? 0),
        ];
    }, $customerTopStmt->fetchAll());

    $customers = [
        'total' => (int)($customerSummaryRow['total_customers'] ?? 0),
        'new_today' => (int)($customerSummaryRow['new_today'] ?? 0),
        'new_week' => (int)($customerSummaryRow['new_week'] ?? 0),
        'new_month' => (int)($customerSummaryRow['new_month'] ?? 0),
        'with_orders' => (int)($customerSummaryRow['customers_with_orders'] ?? 0),
        'without_orders' => (int)($customerSummaryRow['customers_without_orders'] ?? 0),
        'top_customers' => $topCustomers,
    ];

    sendJsonResponse([
        'success' => true,
        'range' => [
            'key' => $rangeKey,
            'start' => $rangeStart,
            'end' => $rangeEnd,
        ],
        'summary' => $summary,
        'revenue' => $revenue,
        'salesTrend' => $salesTrend,
        'orderStatus' => $orderStatus,
        'topProducts' => $topProducts,
        'topSports' => $topSports,
        'recentOrders' => $recentOrders,
        'lowStock' => $lowStock,
        'customers' => $customers,
    ], 200);
} catch (Throwable $e) {
    sendErrorResponse('Failed to load dashboard analytics: ' . $e->getMessage(), 500);
}
