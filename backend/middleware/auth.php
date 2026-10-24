<?php
// backend/middleware/auth.php
// Reusable Authentication & Role Authorization Middleware

declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';

/**
 * Requires an authenticated active admin session.
 * Returns the admin record or exits with HTTP 401.
 *
 * @param array $allowedRoles Array of allowed roles (e.g. ['admin', 'super_admin'])
 * @return array
 */
function requireAdmin(array $allowedRoles = ['admin', 'super_admin']): array {
    startSession();

    if (empty($_SESSION['admin_id'])) {
        sendErrorResponse('Unauthorized. Please log in as an administrator.', 401);
    }

    try {
        $pdo = getDbConnection();
        $stmt = $pdo->prepare("SELECT id, name, email, role, status FROM `admins` WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => (int)$_SESSION['admin_id']]);
        $admin = $stmt->fetch();

        if (!$admin || $admin['status'] !== 'active') {
            // Unset invalid session
            unset($_SESSION['admin_id'], $_SESSION['admin_role'], $_SESSION['admin_email']);
            sendErrorResponse('Account is inactive or no longer exists. Please log in again.', 401);
        }

        if (!empty($allowedRoles) && !in_array($admin['role'], $allowedRoles, true)) {
            sendErrorResponse('Forbidden. Insufficient permissions for this action.', 403);
        }

        return $admin;
    } catch (Throwable $e) {
        error_log('Authentication check error: ' . $e->getMessage());
        sendErrorResponse('Authentication check error occurred.', 500);
    }
}
