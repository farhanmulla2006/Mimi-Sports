<?php
// backend/api/products/get.php
// GET Single Product detail by ID endpoint

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';

sendCorsHeaders();

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    sendErrorResponse('Method Not Allowed. Use GET.', 405);
}

$id = isset($_GET['id']) ? trim((string)$_GET['id']) : '';

if ($id === '') {
    sendErrorResponse('Product ID parameter (id) is required.', 400);
}

try {
    $pdo = getDbConnection();

    // Fetch product
    $stmt = $pdo->prepare("SELECT * FROM `products` WHERE id = :id LIMIT 1");
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch();

    if (!$row) {
        sendErrorResponse('Product not found with ID: ' . $id, 404);
    }

    // Fetch all associated images ordered by sort_order ASC
    $imgStmt = $pdo->prepare("SELECT id, image_url, sort_order FROM `product_images` WHERE product_id = :product_id ORDER BY sort_order ASC, id ASC");
    $imgStmt->execute([':product_id' => $id]);
    $imageRows = $imgStmt->fetchAll();

    $images = [];
    $imageObjects = [];
    foreach ($imageRows as $img) {
        $images[] = (string)$img['image_url'];
        $imageObjects[] = [
            'id'         => (int)$img['id'],
            'image_url'  => (string)$img['image_url'],
            'sort_order' => (int)$img['sort_order'],
        ];
    }

    // Primary image is either the first image in product_images or products.image
    $primaryImage = !empty($images) ? $images[0] : (string)($row['image'] ?? '');
    if (empty($images) && !empty($primaryImage)) {
        $images = [$primaryImage];
    }

    $sizes = !empty($row['sizes']) ? json_decode($row['sizes'], true) : [];
    $colors = !empty($row['colors']) ? json_decode($row['colors'], true) : [];
    $tags = !empty($row['tags']) ? json_decode($row['tags'], true) : [];

    $productData = [
        'id'            => (string)$row['id'],
        'name'          => (string)$row['name'],
        'sport'         => (string)$row['sport'],
        'category'      => (string)$row['category'],
        'brand'         => (string)$row['brand'],
        'price'         => (float)$row['price'],
        'originalPrice' => $row['original_price'] !== null ? (float)$row['original_price'] : (float)$row['price'],
        'original_price'=> $row['original_price'] !== null ? (float)$row['original_price'] : (float)$row['price'],
        'discount'      => (int)$row['discount'],
        'rating'        => (float)$row['rating'],
        'reviewCount'   => (int)$row['reviews'],
        'reviews'       => (int)$row['reviews'],
        'stock'         => (bool)$row['stock'],
        'description'   => (string)($row['description'] ?? ''),
        'featured'      => (bool)$row['featured'],
        'skillLevel'    => (string)($row['skill_level'] ?? 'Beginner'),
        'usage'         => (string)($row['usage_type'] ?? 'Training'),
        'image'         => $primaryImage,
        'images'        => $images,
        'image_objects' => $imageObjects,
        'sizes'         => is_array($sizes) ? $sizes : [],
        'colors'        => is_array($colors) ? $colors : [],
        'tags'          => is_array($tags) ? $tags : [],
        'createdAt'     => $row['created_at'] ?? null,
        'updatedAt'     => $row['updated_at'] ?? null,
    ];

    sendJsonResponse([
        'success' => true,
        'product' => $productData,
    ], 200);

} catch (Throwable $e) {
    sendErrorResponse('Failed to retrieve product: ' . $e->getMessage(), 500);
}
