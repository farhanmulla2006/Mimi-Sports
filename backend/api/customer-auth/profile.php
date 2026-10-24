<?php
// backend/api/customer-auth/profile.php
// PUT/POST Customer Profile update endpoint

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/customer_auth.php';

sendCorsHeaders();

$method = $_SERVER['REQUEST_METHOD'] ?? 'POST';
if ($method !== 'PUT' && $method !== 'POST') {
    sendErrorResponse('Method Not Allowed. Use PUT or POST.', 405);
}

// Require authenticated customer session
$currentCustomer = requireCustomer();

$input = parseJsonInput();
$name = isset($input['name']) ? trim((string)$input['name']) : '';
$phone = isset($input['phone']) ? trim((string)$input['phone']) : '';

$errors = [];
if ($name === '') {
    $errors['name'] = 'Full name cannot be empty.';
}

if ($phone !== '' && !preg_match('/^[0-9+\-\s()]{7,20}$/', $phone)) {
    $errors['phone'] = 'Please enter a valid phone number.';
}

if (!empty($errors)) {
    sendErrorResponse('Validation failed.', 400, $errors);
}

try {
    $pdo = getDbConnection();
    $stmt = $pdo->prepare("UPDATE `customers` SET name = :name, phone = :phone WHERE id = :id");
    $stmt->execute([
        ':name'  => $name,
        ':phone' => $phone,
        ':id'    => (int)$currentCustomer['id'],
    ]);

    sendJsonResponse([
        'success'  => true,
        'message'  => 'Profile updated successfully!',
        'customer' => [
            'id'         => (int)$currentCustomer['id'],
            'name'       => $name,
            'email'      => $currentCustomer['email'],
            'phone'      => $phone,
            'status'     => $currentCustomer['status'],
            'created_at' => $currentCustomer['created_at'],
        ],
    ], 200);

} catch (Throwable $e) {
    sendErrorResponse('Profile update failed: ' . $e->getMessage(), 500);
}
