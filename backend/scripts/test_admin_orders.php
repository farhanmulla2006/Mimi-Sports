<?php
// backend/scripts/test_admin_orders.php
// Comprehensive test suite for Phase 5: Admin Order Management

declare(strict_types=1);

$baseUrl = 'http://127.0.0.1:8000/backend/api';
$cookieFile = __DIR__ . '/test_admin_cookie.txt';
if (file_exists($cookieFile)) {
    unlink($cookieFile);
}

function makeRequest(string $url, string $method = 'GET', ?array $payload = null, bool $useCookie = true): array {
    global $cookieFile;
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    curl_setopt($ch, CURLOPT_HEADER, true);

    if ($useCookie) {
        curl_setopt($ch, CURLOPT_COOKIEJAR, $cookieFile);
        curl_setopt($ch, CURLOPT_COOKIEFILE, $cookieFile);
    }

    $headers = ['Accept: application/json'];
    if ($payload !== null) {
        $headers[] = 'Content-Type: application/json';
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    }
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

    $raw = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    curl_close($ch);

    $body = substr($raw, $headerSize);
    $data = json_decode($body, true);

    return [
        'status' => $httpCode,
        'data'   => $data,
        'raw'    => $body,
    ];
}

echo "===================================================\n";
echo " MIMI SPORTS — PHASE 5: ADMIN ORDERS TEST SUITE \n";
echo "===================================================\n\n";

// TEST 1 — Unauthenticated Protection Check
echo "[TEST 1] Testing GET /admin/orders/list.php without session...\n";
$res1 = makeRequest("$baseUrl/admin/orders/list.php", 'GET', null, false);
echo " -> Status: {$res1['status']}\n";
echo " -> Message: " . ($res1['data']['message'] ?? 'N/A') . "\n";
if ($res1['status'] === 401) {
    echo " ✓ TEST 1 PASSED: Unauthenticated request rejected with HTTP 401.\n\n";
} else {
    echo " ❌ TEST 1 FAILED!\n\n";
}

// TEST 2 — Admin Login
echo "[TEST 2] Logging in as Admin (admin@mimisports.com)...\n";
$res2 = makeRequest("$baseUrl/auth/login.php", 'POST', [
    'email'    => 'admin@mimisports.com',
    'password' => 'AdminPass123!',
]);
echo " -> Status: {$res2['status']}\n";
if ($res2['status'] === 200 && ($res2['data']['success'] ?? false) === true) {
    echo " ✓ TEST 2 PASSED: Admin login successful.\n\n";
} else {
    echo " ❌ TEST 2 FAILED!\n\n";
}

// TEST 3 — Authenticated Admin Order Listing
echo "[TEST 3] Fetching admin order list via GET /admin/orders/list.php...\n";
$res3 = makeRequest("$baseUrl/admin/orders/list.php", 'GET');
echo " -> Status: {$res3['status']}\n";
$orders = $res3['data']['orders'] ?? [];
$stats = $res3['data']['stats'] ?? [];
echo " -> Total Orders Returned: " . count($orders) . "\n";
echo " -> Revenue Calculated: ₹" . ($stats['total_revenue'] ?? 0) . "\n";
if ($res3['status'] === 200 && !empty($orders)) {
    echo " ✓ TEST 3 PASSED: Admin order list and stats retrieved successfully.\n\n";
} else {
    echo " ❌ TEST 3 FAILED!\n\n";
}

// TEST 4 — Existing Order Verification (MS-20260915-93E98 or latest)
$targetOrder = 'MS-20260915-93E98';
$foundOrder = null;
foreach ($orders as $o) {
    if ($o['order_number'] === $targetOrder) {
        $foundOrder = $o;
        break;
    }
}
if (!$foundOrder && !empty($orders)) {
    $foundOrder = $orders[0];
    $targetOrder = $foundOrder['order_number'];
}

echo "[TEST 4] Fetching order details for '$targetOrder' via GET /admin/orders/get.php?id=$targetOrder...\n";
$res4 = makeRequest("$baseUrl/admin/orders/get.php?id=$targetOrder", 'GET');
echo " -> Status: {$res4['status']}\n";
$orderDetail = $res4['data']['order'] ?? [];
echo " -> Customer Name: " . ($orderDetail['customer_name'] ?? 'N/A') . "\n";
echo " -> Total Amount: ₹" . ($orderDetail['total_amount'] ?? 0) . "\n";
echo " -> Items Count: " . count($orderDetail['items'] ?? []) . "\n";
if ($res4['status'] === 200 && ($orderDetail['order_number'] ?? '') === $targetOrder) {
    echo " ✓ TEST 4 PASSED: Existing order verified in admin detail API.\n\n";
} else {
    echo " ❌ TEST 4 FAILED!\n\n";
}

// TEST 5 — Invalid Status Validation Check
echo "[TEST 5] Updating order status to invalid status 'invalid_status'...\n";
$res5 = makeRequest("$baseUrl/admin/orders/update-status.php?id=$targetOrder", 'PUT', ['status' => 'invalid_status']);
echo " -> Status: {$res5['status']}\n";
echo " -> Message: " . ($res5['data']['message'] ?? 'N/A') . "\n";
if ($res5['status'] === 400) {
    echo " ✓ TEST 5 PASSED: Invalid status rejected with HTTP 400.\n\n";
} else {
    echo " ❌ TEST 5 FAILED!\n\n";
}

// TEST 6 — Valid Status Update Persistence
echo "[TEST 6] Updating order status to 'confirmed'...\n";
$res6 = makeRequest("$baseUrl/admin/orders/update-status.php?id=$targetOrder", 'PUT', ['status' => 'confirmed']);
echo " -> Status: {$res6['status']}\n";
echo " -> Message: " . ($res6['data']['message'] ?? 'N/A') . "\n";

// Verify in DB
$res6b = makeRequest("$baseUrl/admin/orders/get.php?id=$targetOrder", 'GET');
$updatedStatus = $res6b['data']['order']['status'] ?? '';
echo " -> Status in DB after update: '$updatedStatus'\n";
if ($res6['status'] === 200 && $updatedStatus === 'confirmed') {
    echo " ✓ TEST 6 PASSED: Order status updated to 'confirmed' and persisted in database!\n\n";
} else {
    echo " ❌ TEST 6 FAILED!\n\n";
}

// TEST 7 — Public Customer Order Lookup Security Check
echo "[TEST 7] Testing public customer lookup GET /orders/get.php?order_number=$targetOrder...\n";
$res7 = makeRequest("$baseUrl/orders/get.php?order_number=$targetOrder", 'GET', null, false);
echo " -> Status: {$res7['status']}\n";
if ($res7['status'] === 200 && isset($res7['data']['order']['order_number'])) {
    echo " ✓ TEST 7 PASSED: Customer order confirmation lookup remains functional.\n\n";
} else {
    echo " ❌ TEST 7 FAILED!\n\n";
}

// Cleanup cookie file
if (file_exists($cookieFile)) {
    unlink($cookieFile);
}
