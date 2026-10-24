<?php
// backend/config/database.php
// Centralized PDO MySQL Database Connection & API Helpers

declare(strict_types=1);

define('DB_HOST', '127.0.0.1');
define('DB_PORT', 3306);
define('DB_NAME', 'mimi_sports');
define('DB_USER', 'root');
define('DB_PASS', '');

/**
 * Returns a PDO database connection instance.
 *
 * @return PDO
 * @throws PDOException
 */
function getDbConnection(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', DB_HOST, DB_PORT, DB_NAME);
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
    }
    return $pdo;
}

/**
 * Start or resume PHP session with secure cookie options.
 */
function startSession(): void {
    if (session_status() === PHP_SESSION_NONE) {
        ini_set('session.use_strict_mode', '1');
        ini_set('session.use_only_cookies', '1');

        session_set_cookie_params([
            'lifetime' => 86400,
            'path'     => '/',
            'domain'   => '',
            'secure'   => false,
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
        session_start();
    }
}

/**
 * Send CORS headers allowing local Vite dev server.
 */
function sendCorsHeaders(): void {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    // Allow any localhost / 127.0.0.1 port (Vite dev server)
    if (preg_match('/^https?:\/\/(localhost|127\.0\.0\.1)(:[0-9]+)?$/', $origin)) {
        header("Access-Control-Allow-Origin: $origin");
    } else {
        header("Access-Control-Allow-Origin: http://localhost:5173");
    }

    header("Vary: Origin");
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
    header("Access-Control-Allow-Credentials: true");
    header("Access-Control-Max-Age: 86400");
    header("Content-Type: application/json; charset=UTF-8");

    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
        http_response_code(200);
        exit(0);
    }
}

/**
 * Send JSON response and exit.
 *
 * @param array $data
 * @param int $statusCode
 */
function sendJsonResponse(array $data, int $statusCode = 200): void {
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit(0);
}

/**
 * Send JSON error response.
 *
 * @param string $message
 * @param int $statusCode
 * @param array|null $details
 */
function sendErrorResponse(string $message, int $statusCode = 400, ?array $details = null): void {
    $response = [
        'success' => false,
        'message' => $message,
    ];
    if ($details !== null) {
        $response['details'] = $details;
    }
    sendJsonResponse($response, $statusCode);
}

/**
 * Read and parse JSON request body.
 *
 * @return array
 */
function parseJsonInput(): array {
    $raw = file_get_contents('php://input');
    if (!$raw || trim($raw) === '') {
        return [];
    }
    $decoded = json_decode($raw, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        sendErrorResponse('Invalid JSON payload in request body: ' . json_last_error_msg(), 400);
    }
    return is_array($decoded) ? $decoded : [];
}
