<?php
// backend/api/auth/me.php
// GET Currently Authenticated Admin endpoint

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';

sendCorsHeaders();

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    sendErrorResponse('Method Not Allowed. Use GET.', 405);
}

startSession();

if (empty($_SESSION['admin_id'])) {
    sendJsonResponse([
        'success'       => false,
        'authenticated' => false,
        'message'       => 'Unauthenticated',
    ], 401);
}

try {
    $pdo = getDbConnection();
    $stmt = $pdo->prepare("SELECT id, name, email, role, status FROM `admins` WHERE id = :id LIMIT 1");
    $stmt->execute([':id' => (int)$_SESSION['admin_id']]);
    $admin = $stmt->fetch();

    if (!$admin || $admin['status'] !== 'active') {
        unset($_SESSION['admin_id'], $_SESSION['admin_role'], $_SESSION['admin_email']);
        sendJsonResponse([
            'success'       => false,
            'authenticated' => false,
            'message'       => 'Account inactive or missing',
        ], 401);
    }

    sendJsonResponse([
        'success'       => true,
        'authenticated' => true,
        'admin'         => [
            'id'    => (int)$admin['id'],
            'name'  => (string)$admin['name'],
            'email' => (string)$admin['email'],
            'role'  => (string)$admin['role'],
        ],
    ], 200);

} catch (Throwable $e) {
    error_log('Auth check error: ' . $e->getMessage());
    sendErrorResponse('Authentication check error occurred.', 500);
}
