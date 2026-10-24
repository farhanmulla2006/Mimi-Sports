<?php
// backend/api/customer-auth/me.php
// GET Currently Authenticated Customer session info endpoint

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';

sendCorsHeaders();

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    sendErrorResponse('Method Not Allowed. Use GET.', 405);
}

startSession();

if (empty($_SESSION['customer_id'])) {
    sendJsonResponse([
        'success'       => false,
        'authenticated' => false,
        'customer'      => null,
    ], 200);
}

try {
    $pdo = getDbConnection();
    $stmt = $pdo->prepare("SELECT id, name, email, phone, status, created_at FROM `customers` WHERE id = :id LIMIT 1");
    $stmt->execute([':id' => (int)$_SESSION['customer_id']]);
    $customer = $stmt->fetch();

    if (!$customer || $customer['status'] !== 'active') {
        unset($_SESSION['customer_id'], $_SESSION['customer_email']);
        sendJsonResponse([
            'success'       => false,
            'authenticated' => false,
            'customer'      => null,
        ], 200);
    }

    sendJsonResponse([
        'success'       => true,
        'authenticated' => true,
        'customer'      => [
            'id'         => (int)$customer['id'],
            'name'       => (string)$customer['name'],
            'email'      => (string)$customer['email'],
            'phone'      => (string)($customer['phone'] ?? ''),
            'status'     => (string)$customer['status'],
            'created_at' => (string)$customer['created_at'],
        ],
    ], 200);

} catch (Throwable $e) {
    sendErrorResponse('Customer auth check error: ' . $e->getMessage(), 500);
}
