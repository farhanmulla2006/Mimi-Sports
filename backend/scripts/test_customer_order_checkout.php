<?php
// backend/scripts/test_customer_order_checkout.php
// Verify a logged-in customer checkout attaches customer_id to the created order.

declare(strict_types=1);

$baseUrl = 'http://127.0.0.1:8000/backend/api';
$cookieFile = __DIR__ . '/test_customer_checkout_cookie.txt';
if (file_exists($cookieFile)) unlink($cookieFile);

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
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    curl_close($ch);

    $body = substr($raw, $headerSize);
    return ['status' => $code, 'data' => json_decode($body, true) ?? [], 'raw' => $body];
}

$email = 'checkout_' . time() . '@example.com';
$password = 'Password123!';

$register = makeRequest("$baseUrl/customer-auth/register.php", 'POST', [
    'name' => 'Checkout Customer',
    'email' => $email,
    'password' => $password,
    'confirm_password' => $password,
    'phone' => '+91 9999999999',
]);

if (($register['status'] ?? 0) !== 201) {
    echo "REGISTER_FAILED\n";
    var_dump($register);
    exit(1);
}

$orderPayload = [
    'customer' => ['name' => 'Checkout Customer', 'email' => $email, 'phone' => '+91 9999999999'],
    'shipping' => ['address' => '12 Demo Street', 'city' => 'Mumbai', 'state' => 'Maharashtra', 'pincode' => '400001'],
    'items' => [['id' => 'cricket-1', 'quantity' => 1]],
];

$orderRes = makeRequest("$baseUrl/orders/create.php", 'POST', $orderPayload);

echo "ORDER_STATUS=" . ($orderRes['status'] ?? 0) . "\n";
echo "ORDER_MESSAGE=" . ($orderRes['data']['message'] ?? 'N/A') . "\n";
if (($orderRes['status'] ?? 0) !== 201) {
    var_dump($orderRes);
    exit(1);
}

$pdo = new PDO('mysql:host=127.0.0.1;port=3306;dbname=mimi_sports;charset=utf8mb4', 'root', '');
$stmt = $pdo->prepare('SELECT customer_id, customer_email, order_number FROM orders WHERE customer_email = :email ORDER BY id DESC LIMIT 1');
$stmt->execute([':email' => strtolower($email)]);
$row = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$row) {
    echo "NO_ORDER_FOUND\n";
    exit(1);
}

echo "ORDER_CUSTOMER_ID=" . ($row['customer_id'] ?? 'NULL') . "\n";
echo "ORDER_NUMBER=" . ($row['order_number'] ?? 'N/A') . "\n";
if ((string)($row['customer_id'] ?? '') === '') {
    echo "CUSTOMER_ID_NOT_ATTACHED\n";
    exit(1);
}

if (file_exists($cookieFile)) unlink($cookieFile);
echo "✅ CUSTOMER CHECKOUT ASSOCIATION VERIFIED\n";
