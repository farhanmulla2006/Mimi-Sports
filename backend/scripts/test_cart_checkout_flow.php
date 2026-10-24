<?php
// backend/scripts/test_cart_checkout_flow.php
// Script to test cart & checkout backend order API, validation & database records.

declare(strict_types=1);

$baseUrl = 'http://127.0.0.1:8000/backend/api';

function makeRequest(string $url, string $method = 'GET', ?array $payload = null): array {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    curl_setopt($ch, CURLOPT_HEADER, true);

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
echo " MIMI SPORTS — PHASE 4: ORDER & CHECKOUT API TEST \n";
echo "===================================================\n\n";

// TEST 1 — Order Placement Validation Failure (Empty Payload)
echo "[TEST 1] Testing POST /orders/create.php with empty payload...\n";
$res1 = makeRequest("$baseUrl/orders/create.php", 'POST', []);
echo " -> Status: {$res1['status']}\n";
echo " -> Message: " . ($res1['data']['message'] ?? 'N/A') . "\n";
if ($res1['status'] === 400 && ($res1['data']['success'] ?? true) === false) {
    echo " ✓ TEST 1 PASSED: Empty payload properly rejected with 400 Validation Error.\n\n";
} else {
    echo " ❌ TEST 1 FAILED!\n\n";
}

// TEST 2 — Valid Order Creation
echo "[TEST 2] Placing valid order for 2 products (cricket-1 x2, football-1 x1)...\n";
$validOrderPayload = [
    'customer' => [
        'name'  => 'Rahul Sharma',
        'email' => 'rahul.sharma@example.com',
        'phone' => '9876543210',
    ],
    'shipping' => [
        'address' => '402 Sunrise Heights, MG Road',
        'city'    => 'Mumbai',
        'state'   => 'Maharashtra',
        'pincode' => '400001',
    ],
    'items' => [
        ['id' => 'cricket-1', 'quantity' => 2],
        ['id' => 'football-1', 'quantity' => 1],
    ],
];

$res2 = makeRequest("$baseUrl/orders/create.php", 'POST', $validOrderPayload);
echo " -> Status: {$res2['status']}\n";
echo " -> Message: " . ($res2['data']['message'] ?? 'N/A') . "\n";
$createdOrder = $res2['data']['order'] ?? [];
$orderNum = $createdOrder['order_number'] ?? '';
echo " -> Generated Order Number: $orderNum\n";
echo " -> Calculated Subtotal: ₹" . ($createdOrder['subtotal'] ?? 0) . "\n";
echo " -> Total Amount: ₹" . ($createdOrder['total_amount'] ?? 0) . "\n";

if ($res2['status'] === 201 && !empty($orderNum)) {
    echo " ✓ TEST 2 PASSED: Order created successfully in database!\n\n";
} else {
    echo " ❌ TEST 2 FAILED!\n\n";
}

// TEST 3 — Fetch Order Details by Order Number
echo "[TEST 3] Fetching created order details via GET /orders/get.php?order_number=$orderNum...\n";
$res3 = makeRequest("$baseUrl/orders/get.php?order_number=$orderNum", 'GET');
echo " -> Status: {$res3['status']}\n";
$retrievedOrder = $res3['data']['order'] ?? [];
echo " -> Customer Name: " . ($retrievedOrder['customer_name'] ?? 'N/A') . "\n";
echo " -> Item Count: " . count($retrievedOrder['items'] ?? []) . "\n";
if ($res3['status'] === 200 && ($retrievedOrder['order_number'] ?? '') === $orderNum) {
    echo " ✓ TEST 3 PASSED: Order details fetched successfully!\n\n";
} else {
    echo " ❌ TEST 3 FAILED!\n\n";
}
