<?php
// backend/scripts/test_auth_flow.php
// Script to test complete admin auth flow, cookie sessions, protection, and mutation.

declare(strict_types=1);

$baseUrl = 'http://127.0.0.1:8000/backend/api';
$cookieFile = __DIR__ . '/test_cookie.txt';
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
echo " MIMI SPORTS — AUTHENTICATION & API TEST SUITE \n";
echo "===================================================\n\n";

// TEST 1 — Unauthenticated me.php
echo "[TEST 1] Checking /auth/me.php without session...\n";
$res1 = makeRequest("$baseUrl/auth/me.php", 'GET', null, false);
echo " -> Status: {$res1['status']}\n";
echo " -> Message: " . ($res1['data']['message'] ?? 'N/A') . "\n";
if ($res1['status'] === 401) {
    echo " ✓ TEST 1 PASSED: Unauthenticated user receives 401.\n\n";
} else {
    echo " ❌ TEST 1 FAILED!\n\n";
}

// TEST 2 — Login with valid credentials
echo "[TEST 2] Logging in as admin (admin@mimisports.com)...\n";
$res2 = makeRequest("$baseUrl/auth/login.php", 'POST', [
    'email'    => 'admin@mimisports.com',
    'password' => 'AdminPass123!',
]);
echo " -> Status: {$res2['status']}\n";
echo " -> Message: " . ($res2['data']['message'] ?? 'N/A') . "\n";
echo " -> Admin Name: " . ($res2['data']['admin']['name'] ?? 'N/A') . "\n";
if ($res2['status'] === 200 && ($res2['data']['success'] ?? false) === true) {
    echo " ✓ TEST 2 PASSED: Admin login successful and session cookie set.\n\n";
} else {
    echo " ❌ TEST 2 FAILED!\n\n";
}

// TEST 3 — Authenticated me.php check
echo "[TEST 3] Checking /auth/me.php with active session cookie...\n";
$res3 = makeRequest("$baseUrl/auth/me.php", 'GET');
echo " -> Status: {$res3['status']}\n";
echo " -> Authenticated: " . (isset($res3['data']['authenticated']) && $res3['data']['authenticated'] ? 'TRUE' : 'FALSE') . "\n";
echo " -> Admin Email: " . ($res3['data']['admin']['email'] ?? 'N/A') . "\n";
if ($res3['status'] === 200 && ($res3['data']['authenticated'] ?? false) === true) {
    echo " ✓ TEST 3 PASSED: Session recognized by /auth/me.php.\n\n";
} else {
    echo " ❌ TEST 3 FAILED!\n\n";
}

// TEST 4 — Public API list check
echo "[TEST 4] Calling public API /products/list.php...\n";
$res4 = makeRequest("$baseUrl/products/list.php", 'GET', null, false);
$prodCount = count($res4['data']['products'] ?? []);
echo " -> Status: {$res4['status']}\n";
echo " -> Total Products Returned: $prodCount\n";
if ($res4['status'] === 200 && $prodCount === 138) {
    echo " ✓ TEST 4 PASSED: Public product API returns HTTP 200 and exactly 138 products.\n\n";
} else {
    echo " ❌ TEST 4 FAILED!\n\n";
}

// TEST 5 — Protected mutation without auth session
echo "[TEST 5] Attempting product update without auth session...\n";
$res5 = makeRequest("$baseUrl/products/update.php?id=cricket-1", 'PUT', ['price' => 2999], false);
echo " -> Status: {$res5['status']}\n";
echo " -> Message: " . ($res5['data']['message'] ?? 'N/A') . "\n";
if ($res5['status'] === 401) {
    echo " ✓ TEST 5 PASSED: Unauthenticated mutation rejected with HTTP 401 Unauthorized.\n\n";
} else {
    echo " ❌ TEST 5 FAILED!\n\n";
}

// TEST 6 — Authenticated mutation with admin session
echo "[TEST 6] Executing authenticated product update as admin...\n";
// Fetch current product price
$origProd = makeRequest("$baseUrl/products/get.php?id=cricket-1", 'GET', null, false)['data']['product'] ?? [];
$oldPrice = $origProd['price'] ?? 0;
$testPrice = $oldPrice > 0 ? (float)$oldPrice : 1999.0;

$res6 = makeRequest("$baseUrl/products/update.php?id=cricket-1", 'PUT', [
    'price' => $testPrice,
]);
echo " -> Status: {$res6['status']}\n";
echo " -> Message: " . ($res6['data']['message'] ?? 'N/A') . "\n";
echo " -> Updated Price: ₹" . ($res6['data']['product']['price'] ?? 'N/A') . "\n";
if ($res6['status'] === 200 && ($res6['data']['success'] ?? false) === true) {
    echo " ✓ TEST 6 PASSED: Authenticated product update succeeded.\n\n";
} else {
    echo " ❌ TEST 6 FAILED!\n\n";
}

// TEST 7 — Logout
echo "[TEST 7] Logging out via /auth/logout.php...\n";
$res7 = makeRequest("$baseUrl/auth/logout.php", 'POST');
echo " -> Status: {$res7['status']}\n";
echo " -> Message: " . ($res7['data']['message'] ?? 'N/A') . "\n";

// Verify session is destroyed
$res7b = makeRequest("$baseUrl/auth/me.php", 'GET');
echo " -> /auth/me.php status after logout: {$res7b['status']}\n";
if ($res7['status'] === 200 && $res7b['status'] === 401) {
    echo " ✓ TEST 7 PASSED: Logout destroyed session correctly.\n\n";
} else {
    echo " ❌ TEST 7 FAILED!\n\n";
}

// Clean up test cookie file
if (file_exists($cookieFile)) {
    unlink($cookieFile);
}
