<?php
// backend/api/customer-auth/login.php
// POST Customer Login endpoint

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';

sendCorsHeaders();

if (($_SERVER['REQUEST_METHOD'] ?? 'POST') !== 'POST') {
    sendErrorResponse('Method Not Allowed. Use POST.', 405);
}

$input = parseJsonInput();

$email    = isset($input['email']) ? strtolower(trim((string)$input['email'])) : '';
$password = isset($input['password']) ? (string)$input['password'] : '';

if ($email === '' || $password === '') {
    sendErrorResponse('Email and password are required.', 400);
}

try {
    $pdo = getDbConnection();
    $stmt = $pdo->prepare("SELECT id, name, email, password_hash, phone, status, created_at FROM `customers` WHERE email = :email LIMIT 1");
    $stmt->execute([':email' => $email]);
    $customer = $stmt->fetch();

    if (!$customer || $customer['status'] !== 'active' || !password_verify($password, $customer['password_hash'])) {
        sendErrorResponse('Invalid email or password.', 401);
    }

    // Authenticated successfully — initialize Customer Session
    startSession();
    session_regenerate_id(true);

    $_SESSION['customer_id'] = (int)$customer['id'];
    $_SESSION['customer_email'] = (string)$customer['email'];

    sendJsonResponse([
        'success' => true,
        'message' => 'Login successful',
        'customer' => [
            'id'         => (int)$customer['id'],
            'name'       => (string)$customer['name'],
            'email'      => (string)$customer['email'],
            'phone'      => (string)($customer['phone'] ?? ''),
            'status'     => (string)$customer['status'],
            'created_at' => (string)$customer['created_at'],
        ],
    ], 200);

} catch (Throwable $e) {
    sendErrorResponse('Login processing failed: ' . $e->getMessage(), 500);
}
