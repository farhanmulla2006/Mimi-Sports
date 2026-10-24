<?php
// backend/scripts/create-admin.php
// CLI script to create an Admin user in MySQL

declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';

echo "==================================================\n";
echo "Mimi Sports — Create Admin User\n";
echo "==================================================\n\n";

try {
    $pdo = getDbConnection();

    // Ensure admins table exists
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `admins` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `name` VARCHAR(100) NOT NULL,
            `email` VARCHAR(150) NOT NULL UNIQUE,
            `password_hash` VARCHAR(255) NOT NULL,
            `role` ENUM('admin', 'super_admin') NOT NULL DEFAULT 'admin',
            `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
            `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX `idx_email` (`email`),
            INDEX `idx_status` (`status`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    // Parse options from CLI arguments or stdin prompt
    $options = getopt('', ['name:', 'email:', 'password:', 'role:']);

    $name = $options['name'] ?? null;
    $email = $options['email'] ?? null;
    $password = $options['password'] ?? null;
    $role = $options['role'] ?? 'super_admin';

    if (php_sapi_name() === 'cli' && (!$name || !$email || !$password)) {
        if (!$name) {
            echo "Enter Admin Name: ";
            $name = trim((string)fgets(STDIN));
        }
        if (!$email) {
            echo "Enter Admin Email: ";
            $email = trim((string)fgets(STDIN));
        }
        if (!$password) {
            echo "Enter Admin Password: ";
            $password = trim((string)fgets(STDIN));
        }
    }

    if (empty($name) || empty($email) || empty($password)) {
        echo "❌ Name, Email, and Password are all required.\n";
        echo "Usage: php create-admin.php --name=\"Admin Name\" --email=\"admin@example.com\" --password=\"SecretPass123!\" [--role=\"super_admin\"]\n";
        exit(1);
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo "❌ Invalid email format: '$email'\n";
        exit(1);
    }

    if (strlen($password) < 6) {
        echo "❌ Password must be at least 6 characters long.\n";
        exit(1);
    }

    // Check duplicate email
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM `admins` WHERE email = :email");
    $stmt->execute([':email' => strtolower($email)]);
    if ((int)$stmt->fetchColumn() > 0) {
        echo "❌ Duplicate Email: Admin with email '$email' already exists.\n";
        exit(1);
    }

    $passwordHash = password_hash($password, PASSWORD_DEFAULT);
    $validRole = in_array($role, ['admin', 'super_admin'], true) ? $role : 'admin';

    $insStmt = $pdo->prepare("
        INSERT INTO `admins` (name, email, password_hash, role, status)
        VALUES (:name, :email, :password_hash, :role, 'active')
    ");

    $insStmt->execute([
        ':name'          => $name,
        ':email'         => strtolower($email),
        ':password_hash' => $passwordHash,
        ':role'          => $validRole,
    ]);

    echo "==================================================\n";
    echo "✓ SUCCESS: Admin account created successfully!\n";
    echo sprintf("• ID:    %d\n", (int)$pdo->lastInsertId());
    echo sprintf("• Name:  %s\n", $name);
    echo sprintf("• Email: %s\n", strtolower($email));
    echo sprintf("• Role:  %s\n", $validRole);
    echo "==================================================\n";

} catch (Throwable $e) {
    echo "❌ Error creating admin: " . $e->getMessage() . "\n";
    exit(1);
}
