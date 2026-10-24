<?php
// backend/api/products/update.php
// PUT/POST Update existing product and images endpoint

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/auth.php';

sendCorsHeaders();

$method = $_SERVER['REQUEST_METHOD'] ?? 'POST';
if ($method !== 'PUT' && $method !== 'POST') {
    sendErrorResponse('Method Not Allowed. Use PUT or POST.', 405);
}

// Protect endpoint: Require Admin Authentication
$admin = requireAdmin();

$input = parseJsonInput();
$id = isset($_GET['id']) ? trim((string)$_GET['id']) : (isset($input['id']) ? trim((string)$input['id']) : '');

if ($id === '') {
    sendErrorResponse('Product ID (id) is required for update.', 400);
}

try {
    $pdo = getDbConnection();

    // Verify product existence
    $checkStmt = $pdo->prepare("SELECT * FROM `products` WHERE id = :id LIMIT 1");
    $checkStmt->execute([':id' => $id]);
    $existing = $checkStmt->fetch();

    if (!$existing) {
        sendErrorResponse("Product with ID '$id' not found.", 404);
    }

    // Merge values from input with existing product row
    $name        = isset($input['name']) ? trim((string)$input['name']) : $existing['name'];
    $sport       = isset($input['sport']) ? trim((string)$input['sport']) : $existing['sport'];
    $category    = isset($input['category']) ? trim((string)$input['category']) : $existing['category'];
    $brand       = isset($input['brand']) ? trim((string)$input['brand']) : $existing['brand'];
    $price       = isset($input['price']) && is_numeric($input['price']) ? (float)$input['price'] : (float)$existing['price'];
    
    $origPriceRaw = $input['originalPrice'] ?? $input['original_price'] ?? ($existing['original_price'] ?? $price);
    $originalPrice = is_numeric($origPriceRaw) ? (float)$origPriceRaw : $price;
    $discount    = $originalPrice > $price ? (int)round((1 - $price / $originalPrice) * 100) : 0;
    
    $rating      = isset($input['rating']) && is_numeric($input['rating']) ? (float)$input['rating'] : (float)$existing['rating'];
    $reviews     = isset($input['reviewCount']) ? (int)$input['reviewCount'] : (isset($input['reviews']) ? (int)$input['reviews'] : (int)$existing['reviews']);
    $stock       = isset($input['stock']) ? (bool)$input['stock'] : (bool)$existing['stock'];
    $description = isset($input['description']) ? trim((string)$input['description']) : (string)$existing['description'];
    $featured    = isset($input['featured']) ? (bool)$input['featured'] : (bool)$existing['featured'];
    $skillLevel  = isset($input['skillLevel']) ? trim((string)$input['skillLevel']) : (string)($existing['skill_level'] ?? 'Beginner');
    $usage       = isset($input['usage']) ? trim((string)$input['usage']) : (isset($input['usage_type']) ? trim((string)$input['usage_type']) : (string)($existing['usage_type'] ?? 'Training'));

    // Handle sizes / colors / tags
    if (isset($input['sizes'])) {
        $sizes = is_array($input['sizes']) ? json_encode(array_values($input['sizes'])) : json_encode(array_map('trim', explode(',', (string)$input['sizes'])));
    } else {
        $sizes = $existing['sizes'];
    }

    if (isset($input['colors'])) {
        $colors = is_array($input['colors']) ? json_encode(array_values($input['colors'])) : json_encode(array_map('trim', explode(',', (string)$input['colors'])));
    } else {
        $colors = $existing['colors'];
    }

    if (isset($input['tags'])) {
        $tags = is_array($input['tags']) ? json_encode(array_values($input['tags'])) : json_encode(array_map('trim', explode(',', (string)$input['tags'])));
    } else {
        $tags = $existing['tags'];
    }

    // Determine images array
    $imagesUpdated = false;
    $imagesInput = [];
    if (isset($input['images']) && is_array($input['images'])) {
        $imagesInput = array_values(array_filter(array_map('trim', $input['images'])));
        $imagesUpdated = true;
    } elseif (isset($input['image']) && trim((string)$input['image']) !== '') {
        $imagesInput = [trim((string)$input['image'])];
        $imagesUpdated = true;
    }

    $primaryImage = !empty($imagesInput) ? $imagesInput[0] : (string)($existing['image'] ?? '');

    $pdo->beginTransaction();

    // Update product table
    $updateSql = "
        UPDATE `products` SET
            name = :name,
            sport = :sport,
            category = :category,
            brand = :brand,
            price = :price,
            original_price = :original_price,
            discount = :discount,
            rating = :rating,
            reviews = :reviews,
            stock = :stock,
            description = :description,
            featured = :featured,
            image = :image,
            skill_level = :skill_level,
            usage_type = :usage_type,
            sizes = :sizes,
            colors = :colors,
            tags = :tags
        WHERE id = :id
    ";

    $stmt = $pdo->prepare($updateSql);
    $stmt->execute([
        ':name'           => $name,
        ':sport'          => $sport,
        ':category'       => $category,
        ':brand'          => $brand,
        ':price'          => $price,
        ':original_price' => $originalPrice,
        ':discount'       => $discount,
        ':rating'         => $rating,
        ':reviews'        => $reviews,
        ':stock'          => $stock ? 1 : 0,
        ':description'    => $description,
        ':featured'       => $featured ? 1 : 0,
        ':image'          => $primaryImage,
        ':skill_level'    => $skillLevel,
        ':usage_type'     => $usage,
        ':sizes'          => $sizes,
        ':colors'         => $colors,
        ':tags'           => $tags,
        ':id'             => $id,
    ]);

    // Update product_images table if images provided
    if ($imagesUpdated && !empty($imagesInput)) {
        $existingImageStmt = $pdo->prepare("SELECT id FROM `product_images` WHERE product_id = :id ORDER BY sort_order ASC, id ASC");
        $existingImageStmt->execute([':id' => $id]);
        $existingImageRows = $existingImageStmt->fetchAll(PDO::FETCH_COLUMN);
        $updateImg = $pdo->prepare("UPDATE `product_images` SET image_url = :url, sort_order = :order WHERE id = :image_id");
        $insertImg = $pdo->prepare("INSERT INTO `product_images` (product_id, image_url, sort_order) VALUES (:id, :url, :order)");
        foreach ($imagesInput as $order => $url) {
            if (isset($existingImageRows[$order])) {
                $updateImg->execute([
                    ':url' => $url,
                    ':order' => $order,
                    ':image_id' => $existingImageRows[$order],
                ]);
            } else {
                $insertImg->execute([
                    ':id' => $id,
                    ':url' => $url,
                    ':order' => $order,
                ]);
            }
        }
    }

    $pdo->commit();

    // Fetch updated images
    $imgStmt = $pdo->prepare("SELECT image_url FROM `product_images` WHERE product_id = :id ORDER BY sort_order ASC, id ASC");
    $imgStmt->execute([':id' => $id]);
    $currentImages = $imgStmt->fetchAll(PDO::FETCH_COLUMN);

    sendJsonResponse([
        'success' => true,
        'message' => 'Product updated successfully',
        'product' => [
            'id'            => $id,
            'name'          => $name,
            'sport'         => $sport,
            'category'      => $category,
            'brand'         => $brand,
            'price'         => $price,
            'originalPrice' => $originalPrice,
            'discount'      => $discount,
            'rating'        => $rating,
            'reviewCount'   => $reviews,
            'stock'         => $stock,
            'description'   => $description,
            'featured'      => $featured,
            'skillLevel'    => $skillLevel,
            'usage'         => $usage,
            'image'         => !empty($currentImages) ? $currentImages[0] : $primaryImage,
            'images'        => $currentImages,
            'sizes'         => $sizes ? json_decode($sizes, true) : [],
            'colors'        => $colors ? json_decode($colors, true) : [],
            'tags'          => $tags ? json_decode($tags, true) : [],
        ],
    ], 200);

} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    sendErrorResponse('Failed to update product: ' . $e->getMessage(), 500);
}
