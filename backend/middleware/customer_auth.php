<?php
// backend/middleware/customer_auth.php
// Reusable Customer Authentication Middleware

declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';

/**
 * Requires an authenticated active customer session.
 * Returns the customer record or exits with HTTP 401.
 *
 * @return array
 */
function requireCustomer(): array {
    startSession();

    if (empty($_SESSION['customer_id'])) {
        sendErrorResponse('Unauthorized. Please log in to your account.', 401);
    }

    try {
        $pdo = getDbConnection();
        $stmt = $pdo->prepare("SELECT id, name, email, phone, status, created_at FROM `customers` WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => (int)$_SESSION['customer_id']]);
        $customer = $stmt->fetch();

        if (!$customer || $customer['status'] !== 'active') {
            unset($_SESSION['customer_id'], $_SESSION['customer_email']);
            sendErrorResponse('Account is inactive or no longer exists. Please log in again.', 401);
        }

        return $customer;
    } catch (Throwable $e) {
        sendErrorResponse('Customer authentication check error: ' . $e->getMessage(), 500);
    }
}
