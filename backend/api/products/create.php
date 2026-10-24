<?php
// backend/api/products/create.php
// POST Create product and product images endpoint

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/auth.php';

sendCorsHeaders();

if (($_SERVER['REQUEST_METHOD'] ?? 'POST') !== 'POST') {
    sendErrorResponse('Method Not Allowed. Use POST.', 405);
}

// Protect endpoint: Require Admin Authentication
$admin = requireAdmin();

$input = parseJsonInput();

// Required validation
$name     = isset($input['name']) ? trim((string)$input['name']) : '';
$sport    = isset($input['sport']) ? trim((string)$input['sport']) : '';
$category = isset($input['category']) ? trim((string)$input['category']) : '';
$brand    = isset($input['brand']) ? trim((string)$input['brand']) : '';
$priceRaw = $input['price'] ?? null;

$errors = [];
if ($name === '')     $errors['name'] = 'Product name is required.';
if ($sport === '')    $errors['sport'] = 'Sport is required.';
if ($category === '') $errors['category'] = 'Category is required.';
if ($brand === '')    $errors['brand'] = 'Brand is required.';
if ($priceRaw === null || !is_numeric($priceRaw) || (float)$priceRaw <= 0) {
    $errors['price'] = 'Price must be a number greater than 0.';
}

if (!empty($errors)) {
    sendErrorResponse('Validation failed.', 400, $errors);
}

$price = (float)$priceRaw;
$origPriceRaw = $input['originalPrice'] ?? $input['original_price'] ?? $price;
$originalPrice = is_numeric($origPriceRaw) && (float)$origPriceRaw >= $price ? (float)$origPriceRaw : $price;

$discount = $originalPrice > $price ? (int)round((1 - $price / $originalPrice) * 100) : 0;
$rating = isset($input['rating']) ? (float)$input['rating'] : 4.0;
$reviews = isset($input['reviewCount']) ? (int)$input['reviewCount'] : (isset($input['reviews']) ? (int)$input['reviews'] : 0);
$stock = isset($input['stock']) ? (bool)$input['stock'] : true;
$description = isset($input['description']) ? trim((string)$input['description']) : '';
$featured = isset($input['featured']) ? (bool)$input['featured'] : false;
$skillLevel = isset($input['skillLevel']) ? trim((string)$input['skillLevel']) : 'Beginner';
$usage = isset($input['usage']) ? trim((string)$input['usage']) : (isset($input['usage_type']) ? trim((string)$input['usage_type']) : 'Training');

$sizes = isset($input['sizes']) && is_array($input['sizes']) ? json_encode(array_values($input['sizes'])) : (isset($input['sizes']) && is_string($input['sizes']) && trim($input['sizes']) !== '' ? json_encode(array_map('trim', explode(',', $input['sizes']))) : null);
$colors = isset($input['colors']) && is_array($input['colors']) ? json_encode(array_values($input['colors'])) : (isset($input['colors']) && is_string($input['colors']) && trim($input['colors']) !== '' ? json_encode(array_map('trim', explode(',', $input['colors']))) : null);
$tags = isset($input['tags']) && is_array($input['tags']) ? json_encode(array_values($input['tags'])) : (isset($input['tags']) && is_string($input['tags']) && trim($input['tags']) !== '' ? json_encode(array_map('trim', explode(',', $input['tags']))) : null);

// Determine images array
$imagesInput = [];
if (isset($input['images']) && is_array($input['images'])) {
    $imagesInput = array_values(array_filter(array_map('trim', $input['images'])));
} elseif (isset($input['image']) && trim((string)$input['image']) !== '') {
    $imagesInput = [trim((string)$input['image'])];
}

$primaryImage = !empty($imagesInput) ? $imagesInput[0] : sprintf('/images/products/%s/%s-1.jpg', strtolower($sport), strtolower($sport));

try {
    $pdo = getDbConnection();

    // Determine ID
    $id = isset($input['id']) ? trim((string)$input['id']) : '';
    if ($id !== '') {
        // Check for duplicate ID
        $chkStmt = $pdo->prepare("SELECT COUNT(*) FROM `products` WHERE id = :id");
        $chkStmt->execute([':id' => $id]);
        if ((int)$chkStmt->fetchColumn() > 0) {
            sendErrorResponse("Product ID '$id' already exists.", 409);
        }
    } else {
        // Auto-generate ID: <sport>-<max_index+1>
        $prefix = strtolower($sport) . '-';
        $genStmt = $pdo->prepare("SELECT id FROM `products` WHERE id LIKE :prefix");
        $genStmt->execute([':prefix' => $prefix . '%']);
        $maxNum = 0;
        while ($row = $genStmt->fetch()) {
            $numPart = substr($row['id'], strlen($prefix));
            if (is_numeric($numPart)) {
                $maxNum = max($maxNum, (int)$numPart);
            }
        }
        $id = $prefix . ($maxNum + 1);
    }

    $pdo->beginTransaction();

    // Insert Product record
    $insertSql = "
        INSERT INTO `products` (
            id, name, sport, category, brand, price, original_price, discount,
            rating, reviews, stock, description, featured, image, skill_level,
            usage_type, sizes, colors, tags
        ) VALUES (
            :id, :name, :sport, :category, :brand, :price, :original_price, :discount,
            :rating, :reviews, :stock, :description, :featured, :image, :skill_level,
            :usage_type, :sizes, :colors, :tags
        )
    ";

    $stmt = $pdo->prepare($insertSql);
    $stmt->execute([
        ':id'             => $id,
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
    ]);

    // Insert images into product_images table
    if (!empty($imagesInput)) {
        $imgStmt = $pdo->prepare("INSERT INTO `product_images` (product_id, image_url, sort_order) VALUES (:product_id, :image_url, :sort_order)");
        foreach ($imagesInput as $order => $imgUrl) {
            $imgStmt->execute([
                ':product_id' => $id,
                ':image_url'  => $imgUrl,
                ':sort_order' => $order,
            ]);
        }
    } else {
        // Fallback primary image insertion
        $imgStmt = $pdo->prepare("INSERT INTO `product_images` (product_id, image_url, sort_order) VALUES (:product_id, :image_url, 0)");
        $imgStmt->execute([
            ':product_id' => $id,
            ':image_url'  => $primaryImage,
        ]);
        $imagesInput = [$primaryImage];
    }

    $pdo->commit();

    sendJsonResponse([
        'success' => true,
        'message' => 'Product created successfully',
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
            'image'         => $primaryImage,
            'images'        => $imagesInput,
            'sizes'         => $sizes ? json_decode($sizes, true) : [],
            'colors'        => $colors ? json_decode($colors, true) : [],
            'tags'          => $tags ? json_decode($tags, true) : [],
        ],
    ], 201);

} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    sendErrorResponse('Failed to create product: ' . $e->getMessage(), 500);
}
