<?php
// backend/api/auth/login.php
// POST Admin Login API endpoint

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';

sendCorsHeaders();

if (($_SERVER['REQUEST_METHOD'] ?? 'POST') !== 'POST') {
    sendErrorResponse('Method Not Allowed. Use POST.', 405);
}

$input = parseJsonInput();

$email = isset($input['email']) ? trim((string)$input['email']) : '';
$password = isset($input['password']) ? (string)$input['password'] : '';

if ($email === '' || $password === '') {
    sendErrorResponse('Email and password are required.', 400);
}

try {
    $pdo = getDbConnection();
    $stmt = $pdo->prepare("SELECT id, name, email, password_hash, role, status FROM `admins` WHERE email = :email LIMIT 1");
    $stmt->execute([':email' => strtolower($email)]);
    $admin = $stmt->fetch();

    if (!$admin || $admin['status'] !== 'active' || !password_verify($password, $admin['password_hash'])) {
        sendErrorResponse('Invalid email or password.', 401);
    }

    // Authenticated successfully — initialize session
    startSession();
    session_regenerate_id(true);

    $_SESSION['admin_id'] = (int)$admin['id'];
    $_SESSION['admin_role'] = (string)$admin['role'];
    $_SESSION['admin_email'] = (string)$admin['email'];

    sendJsonResponse([
        'success' => true,
        'message' => 'Login successful',
        'admin' => [
            'id'    => (int)$admin['id'],
            'name'  => (string)$admin['name'],
            'email' => (string)$admin['email'],
            'role'  => (string)$admin['role'],
        ],
    ], 200);

} catch (Throwable $e) {
    error_log('Login processing error: ' . $e->getMessage());
    sendErrorResponse('Login processing failed. Please try again.', 500);
}
