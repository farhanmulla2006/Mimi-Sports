<?php
// backend/scripts/test_customer_auth_flow.php
// Verify the customer auth flow and protected access without altering the product catalog.

declare(strict_types=1);

$baseUrl = 'http://127.0.0.1:8000/backend/api';
$cookieFile = __DIR__ . '/test_customer_cookie.txt';
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

    return ['status' => $httpCode, 'data' => $data ?? [], 'raw' => $body];
}

$email = 'customer_test_' . time() . '@example.com';
$password = 'Password123!';
$phone = '+91 9876543210';
$name = 'Customer Test User';

echo "===================================================\n";
echo " MIMI SPORTS — CUSTOMER AUTH TEST SUITE \n";
echo "===================================================\n\n";

$reg = makeRequest("$baseUrl/customer-auth/register.php", 'POST', [
    'name' => $name,
    'email' => $email,
    'password' => $password,
    'confirm_password' => $password,
    'phone' => $phone,
]);

echo "[REG] status={$reg['status']} message=" . ($reg['data']['message'] ?? 'N/A') . "\n";
if ($reg['status'] !== 201) {
    echo "❌ registration failed\n";
    exit(1);
}

$me = makeRequest("$baseUrl/customer-auth/me.php", 'GET');
echo "[ME] status={$me['status']} authenticated=" . (($me['data']['authenticated'] ?? false) ? 'true' : 'false') . "\n";
if (($me['data']['authenticated'] ?? false) !== true) {
    echo "❌ session not established\n";
    exit(1);
}

$update = makeRequest("$baseUrl/customer-auth/profile.php", 'PUT', [
    'name' => 'Updated Customer',
    'phone' => '+91 9123456789',
]);
echo "[PROFILE] status={$update['status']} message=" . ($update['data']['message'] ?? 'N/A') . "\n";
if ($update['status'] !== 200) {
    echo "❌ profile update failed\n";
    exit(1);
}

$logout = makeRequest("$baseUrl/customer-auth/logout.php", 'POST');
echo "[LOGOUT] status={$logout['status']} message=" . ($logout['data']['message'] ?? 'N/A') . "\n";
if ($logout['status'] !== 200) {
    echo "❌ logout failed\n";
    exit(1);
}

$afterLogout = makeRequest("$baseUrl/customer-auth/me.php", 'GET');
echo "[ME AFTER LOGOUT] status={$afterLogout['status']} authenticated=" . (($afterLogout['data']['authenticated'] ?? false) ? 'true' : 'false') . "\n";
if (($afterLogout['data']['authenticated'] ?? false) !== false) {
    echo "❌ session still active after logout\n";
    exit(1);
}

$invalidLogin = makeRequest("$baseUrl/customer-auth/login.php", 'POST', [
    'email' => $email,
    'password' => 'wrong-password',
], true);
echo "[INVALID LOGIN] status={$invalidLogin['status']} message=" . ($invalidLogin['data']['message'] ?? 'N/A') . "\n";
if ($invalidLogin['status'] !== 401) {
    echo "❌ invalid login did not fail as expected\n";
    exit(1);
}

$historyRequest = makeRequest("$baseUrl/customer-orders/list.php", 'GET', null, false);
echo "[UNAUTH ORDERS] status={$historyRequest['status']} message=" . ($historyRequest['data']['message'] ?? 'N/A') . "\n";
if ($historyRequest['status'] !== 401) {
    echo "❌ unauthorized order history check failed\n";
    exit(1);
}

$login = makeRequest("$baseUrl/customer-auth/login.php", 'POST', [
    'email' => $email,
    'password' => $password,
]);
echo "[LOGIN] status={$login['status']} message=" . ($login['data']['message'] ?? 'N/A') . "\n";
if ($login['status'] !== 200) {
    echo "❌ login failed\n";
    exit(1);
}

$history = makeRequest("$baseUrl/customer-orders/list.php", 'GET');
echo "[ORDER HISTORY] status={$history['status']} orders=" . count($history['data']['orders'] ?? []) . "\n";
if ($history['status'] !== 200) {
    echo "❌ order history failed\n";
    exit(1);
}

if (file_exists($cookieFile)) {
    unlink($cookieFile);
}

echo "✅ CUSTOMER AUTH FLOW CHECK PASSED\n";
