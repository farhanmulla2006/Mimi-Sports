<?php
// backend/api/customer-auth/register.php
// POST Customer Registration endpoint

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';

sendCorsHeaders();

if (($_SERVER['REQUEST_METHOD'] ?? 'POST') !== 'POST') {
    sendErrorResponse('Method Not Allowed. Use POST.', 405);
}

$input = parseJsonInput();

$name     = isset($input['name']) ? trim((string)$input['name']) : '';
$email    = isset($input['email']) ? strtolower(trim((string)$input['email'])) : '';
$password = isset($input['password']) ? (string)$input['password'] : '';
$confirm  = isset($input['confirm_password']) ? (string)$input['confirm_password'] : (isset($input['confirmPassword']) ? (string)$input['confirmPassword'] : '');
$phone    = isset($input['phone']) ? trim((string)$input['phone']) : '';

$errors = [];
if ($name === '') {
    $errors['name'] = 'Full name is required.';
}

if ($email === '') {
    $errors['email'] = 'Email address is required.';
} elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors['email'] = 'Please enter a valid email address.';
}

if ($phone !== '' && !preg_match('/^[0-9+\-\s()]{7,20}$/', $phone)) {
    $errors['phone'] = 'Please enter a valid phone number.';
}

if ($password === '') {
    $errors['password'] = 'Password is required.';
} elseif (strlen($password) < 6) {
    $errors['password'] = 'Password must be at least 6 characters long.';
}

if ($confirm !== '' && $confirm !== $password) {
    $errors['confirm_password'] = 'Passwords do not match.';
}

if (!empty($errors)) {
    sendErrorResponse('Validation failed.', 400, $errors);
}

try {
    $pdo = getDbConnection();

    // Check duplicate email
    $chkStmt = $pdo->prepare("SELECT COUNT(*) FROM `customers` WHERE email = :email");
    $chkStmt->execute([':email' => $email]);
    if ((int)$chkStmt->fetchColumn() > 0) {
        sendErrorResponse('An account with this email address already exists.', 409, ['email' => 'Email is already registered.']);
    }

    $passwordHash = password_hash($password, PASSWORD_DEFAULT);

    $stmt = $pdo->prepare("
        INSERT INTO `customers` (name, email, password_hash, phone, status)
        VALUES (:name, :email, :password_hash, :phone, 'active')
    ");

    $stmt->execute([
        ':name'          => $name,
        ':email'         => $email,
        ':password_hash' => $passwordHash,
        ':phone'         => $phone,
    ]);

    $customerId = (int)$pdo->lastInsertId();

    // Initialize Customer Session
    startSession();
    session_regenerate_id(true);

    $_SESSION['customer_id'] = $customerId;
    $_SESSION['customer_email'] = $email;

    sendJsonResponse([
        'success' => true,
        'message' => 'Account created successfully!',
        'customer' => [
            'id'         => $customerId,
            'name'       => $name,
            'email'      => $email,
            'phone'      => $phone,
            'status'     => 'active',
            'created_at' => date('Y-m-d H:i:s'),
        ],
    ], 201);

} catch (Throwable $e) {
    sendErrorResponse('Registration failed: ' . $e->getMessage(), 500);
}
