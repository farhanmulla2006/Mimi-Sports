<?php
// backend/api/customer-auth/logout.php
// POST Customer Logout endpoint

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';

sendCorsHeaders();

if (($_SERVER['REQUEST_METHOD'] ?? 'POST') !== 'POST') {
    sendErrorResponse('Method Not Allowed. Use POST.', 405);
}

startSession();

// Clear customer-specific session keys while preserving any admin session
unset($_SESSION['customer_id'], $_SESSION['customer_email']);

sendJsonResponse([
    'success' => true,
    'message' => 'Customer logged out successfully',
], 200);
