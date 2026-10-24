<?php
// backend/api/products/upload-image.php
// POST an authenticated product image and return its public URL.

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/auth.php';

sendCorsHeaders();

if (($_SERVER['REQUEST_METHOD'] ?? 'POST') !== 'POST') {
    sendErrorResponse('Method Not Allowed. Use POST.', 405);
}

requireAdmin();

$sport = strtolower(trim((string)($_POST['sport'] ?? '')));
if (!preg_match('/^[a-z0-9-]+$/', $sport)) {
    sendErrorResponse('A valid sport folder is required.', 400);
}

if (!isset($_FILES['image']) || !is_array($_FILES['image'])) {
    sendErrorResponse('An image file is required.', 400);
}

$file = $_FILES['image'];
if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
    sendErrorResponse('The image upload did not complete successfully.', 400);
}

if (!is_uploaded_file((string)$file['tmp_name']) || (int)$file['size'] > 2 * 1024 * 1024) {
    sendErrorResponse('Image must be a valid file no larger than 2 MB.', 400);
}

$mimeType = (new finfo(FILEINFO_MIME_TYPE))->file((string)$file['tmp_name']);
$extensions = [
    'image/jpeg' => 'jpg',
    'image/png' => 'png',
    'image/webp' => 'webp',
];

if (!isset($extensions[$mimeType]) || getimagesize((string)$file['tmp_name']) === false) {
    sendErrorResponse('Only valid JPG, PNG, or WebP images are allowed.', 400);
}

$relativeDirectory = '/images/products/' . $sport;
$uploadDirectory = dirname(__DIR__, 3) . '/public' . $relativeDirectory;
if (!is_dir($uploadDirectory) && !mkdir($uploadDirectory, 0755, true) && !is_dir($uploadDirectory)) {
    sendErrorResponse('Could not create the product image directory.', 500);
}

try {
    $filename = 'product-' . bin2hex(random_bytes(12)) . '.' . $extensions[$mimeType];
} catch (Throwable $error) {
    error_log('Could not generate a product image filename: ' . $error->getMessage());
    sendErrorResponse('Could not prepare the uploaded image.', 500);
}

if (!move_uploaded_file((string)$file['tmp_name'], $uploadDirectory . '/' . $filename)) {
    sendErrorResponse('Could not save the uploaded image.', 500);
}

sendJsonResponse([
    'success' => true,
    'image' => $relativeDirectory . '/' . $filename,
]);