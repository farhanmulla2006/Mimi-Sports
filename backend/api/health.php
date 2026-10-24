<?php
// backend/api/health.php
// Health check API endpoint

declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';

sendCorsHeaders();

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    sendErrorResponse('Method Not Allowed. Use GET.', 405);
}

try {
    $pdo = getDbConnection();
    // Test simple query
    $stmt = $pdo->query("SELECT 1");
    $stmt->fetch();

    sendJsonResponse([
        'success' => true,
        'message' => 'Mimi Sports API is running',
        'database' => 'connected',
        'timestamp' => date('c'),
    ], 200);
} catch (Throwable $e) {
    sendErrorResponse('Mimi Sports API health check failed: ' . $e->getMessage(), 500);
}
