<?php
// backend/api/auth/logout.php
// POST Admin Logout API endpoint

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';

sendCorsHeaders();

if (($_SERVER['REQUEST_METHOD'] ?? 'POST') !== 'POST') {
    sendErrorResponse('Method Not Allowed. Use POST.', 405);
}

startSession();

// Clear admin session data
unset($_SESSION['admin_id'], $_SESSION['admin_role'], $_SESSION['admin_email']);

// If no customer session is active, destroy the session and invalidate session cookie
if (empty($_SESSION['customer_id'])) {
    $_SESSION = [];

    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(
            session_name(),
            '',
            time() - 42000,
            $params["path"],
            $params["domain"],
            $params["secure"],
            $params["httponly"]
        );
    }

    session_destroy();
}

sendJsonResponse([
    'success' => true,
    'message' => 'Logout successful',
], 200);
