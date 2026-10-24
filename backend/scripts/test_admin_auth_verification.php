<?php
// backend/scripts/test_admin_auth_verification.php
// Comprehensive verification of Mimi Sports admin authentication and session flow.

declare(strict_types=1);

function runAuthSuite(string $host): void {
    $baseUrl = "http://{$host}:8000/backend/api";
    $cookieFile = __DIR__ . "/test_{$host}_cookie.txt";
    if (file_exists($cookieFile)) {
        unlink($cookieFile);
    }

    $client = function (string $url, string $method = 'GET', ?array $payload = null, bool $useCookie = true, array $extraHeaders = []) use ($cookieFile): array {
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        curl_setopt($ch, CURLOPT_HEADER, true);

        if ($useCookie) {
            curl_setopt($ch, CURLOPT_COOKIEJAR, $cookieFile);
            curl_setopt($ch, CURLOPT_COOKIEFILE, $cookieFile);
        }

        $headers = array_merge(['Accept: application/json'], $extraHeaders);
        if ($payload !== null) {
            $headers[] = 'Content-Type: application/json';
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        }
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

        $raw = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
        curl_close($ch);

        $body = substr((string)$raw, $headerSize);
        $data = json_decode($body, true);

        return [
            'status' => $httpCode,
            'data'   => $data,
            'body'   => $body,
        ];
    };

    echo "\n=======================================================\n";
    echo " RUNNING TEST SUITE ON HOST: {$host} \n";
    echo "=======================================================\n\n";

    // 1. Unauthenticated /auth/me.php
    $r1 = $client("$baseUrl/auth/me.php", 'GET', null, false);
    assertTest("Unauthenticated /auth/me.php returns 401", $r1['status'] === 401 && ($r1['data']['authenticated'] ?? true) === false);

    // 2. Unauthenticated /admin/orders/list.php
    $r2 = $client("$baseUrl/admin/orders/list.php", 'GET', null, false);
    assertTest("Unauthenticated /admin/orders/list.php rejected with 401", $r2['status'] === 401 && ($r2['data']['message'] ?? '') === 'Unauthorized. Please log in as an administrator.');

    // 3. Unauthenticated /admin/dashboard/summary.php
    $r3 = $client("$baseUrl/admin/dashboard/summary.php", 'GET', null, false);
    assertTest("Unauthenticated /admin/dashboard/summary.php rejected with 401", $r3['status'] === 401 && ($r3['data']['message'] ?? '') === 'Unauthorized. Please log in as an administrator.');

    // 4. Invalid Login Attempt
    $r4 = $client("$baseUrl/auth/login.php", 'POST', ['email' => 'admin@mimisports.com', 'password' => 'WrongPassword!'], false);
    assertTest("Invalid credentials rejected with 401", $r4['status'] === 401 && ($r4['data']['message'] ?? '') === 'Invalid email or password.');

    // 5. Valid Admin Login
    $r5 = $client("$baseUrl/auth/login.php", 'POST', ['email' => 'admin@mimisports.com', 'password' => 'AdminPass123!'], true, ["Origin: http://{$host}:5173"]);
    $loginOk = $r5['status'] === 200 && ($r5['data']['success'] ?? false) === true && ($r5['data']['admin']['role'] ?? '') === 'super_admin';
    assertTest("Admin login successful as super_admin with session cookie", $loginOk);

    // 6. Authenticated /auth/me.php
    $r6 = $client("$baseUrl/auth/me.php", 'GET', null, true);
    $meOk = $r6['status'] === 200 && ($r6['data']['authenticated'] ?? false) === true && ($r6['data']['admin']['email'] ?? '') === 'admin@mimisports.com';
    assertTest("Session verified via /auth/me.php", $meOk);

    // 7. Authenticated /admin/orders/list.php
    $r7 = $client("$baseUrl/admin/orders/list.php", 'GET', null, true);
    $ordersOk = $r7['status'] === 200 && ($r7['data']['success'] ?? false) === true && isset($r7['data']['orders'], $r7['data']['stats']);
    assertTest("Protected /admin/orders/list.php returns orders and stats", $ordersOk);

    // 8. Authenticated /admin/dashboard/summary.php
    $r8 = $client("$baseUrl/admin/dashboard/summary.php", 'GET', null, true);
    $dashOk = $r8['status'] === 200 && ($r8['data']['success'] ?? false) === true && isset($r8['data']['summary']);
    assertTest("Protected /admin/dashboard/summary.php returns live metrics", $dashOk);

    // 9. Logout
    $r9 = $client("$baseUrl/auth/logout.php", 'POST', null, true);
    assertTest("Admin logout succeeds with 200", $r9['status'] === 200 && ($r9['data']['success'] ?? false) === true);

    // 10. Post-logout /auth/me.php verification
    $r10 = $client("$baseUrl/auth/me.php", 'GET', null, true);
    assertTest("Post-logout /auth/me.php returns 401", $r10['status'] === 401);

    // 11. Post-logout /admin/orders/list.php verification
    $r11 = $client("$baseUrl/admin/orders/list.php", 'GET', null, true);
    assertTest("Post-logout /admin/orders/list.php rejected with 401", $r11['status'] === 401 && ($r11['data']['message'] ?? '') === 'Unauthorized. Please log in as an administrator.');

    if (file_exists($cookieFile)) {
        unlink($cookieFile);
    }
}

function assertTest(string $title, bool $condition): void {
    if ($condition) {
        echo "  [PASS] {$title}\n";
    } else {
        echo "  [FAIL] {$title}\n";
    }
}

echo "=======================================================\n";
echo " MIMI SPORTS — ADMIN AUTHENTICATION VERIFICATION \n";
echo "=======================================================\n";

runAuthSuite('localhost');
runAuthSuite('127.0.0.1');

echo "\nVerification complete.\n";
