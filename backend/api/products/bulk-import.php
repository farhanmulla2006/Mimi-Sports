<?php
// backend/api/products/bulk-import.php
// POST Bulk Import Products endpoint with PDO transaction and file validation

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
$products = isset($input['products']) && is_array($input['products']) 
    ? $input['products'] 
    : (is_array($input) && isset($input[0]) ? $input : []);

if (empty($products)) {
    sendErrorResponse('No products provided for bulk import.', 400);
}

$allowedSportsMap = [
    'cricket'      => 'cricket',
    'football'     => 'football',
    'basketball'   => 'basketball',
    'badminton'    => 'badminton',
    'tennis'       => 'tennis',
    'running'      => 'running',
    'fitness'      => 'fitness',
    'gym & fitness'=> 'fitness',
    'volleyball'   => 'volleyball',
    'table tennis' => 'table-tennis',
    'table-tennis' => 'table-tennis',
    'boxing'       => 'boxing',
];

$allowedCategories = ['Apparel', 'Footwear', 'Equipment', 'Protective Gear', 'Accessories', 'Bats', 'Boots', 'Balls', 'Racquets', 'Shoes', 'Gear', 'Gloves', 'Paddles'];

$publicDir = realpath(__DIR__ . '/../../../public');

try {
    $pdo = getDbConnection();

    $validationErrors = [];
    $seenIds = [];
    $normalizedProducts = [];

    // Step 1: Strict Server-Side Validation
    foreach ($products as $idx => $item) {
        $rowNum = $idx + 1;
        $id = isset($item['id']) ? trim((string)$item['id']) : '';
        $name = isset($item['name']) ? trim((string)$item['name']) : '';
        $sportRaw = isset($item['sport']) ? trim((string)$item['sport']) : '';
        $category = isset($item['category']) ? trim((string)$item['category']) : '';
        $brand = isset($item['brand']) ? trim((string)$item['brand']) : '';
        $priceRaw = $item['price'] ?? null;
        $ratingRaw = $item['rating'] ?? 4.0;
        $reviewsRaw = $item['reviews'] ?? $item['reviewCount'] ?? 0;
        $stockRaw = $item['stock'] ?? true;
        $featuredRaw = $item['featured'] ?? false;
        $description = isset($item['description']) ? trim((string)$item['description']) : '';

        if ($id === '') {
            $validationErrors[] = "Row $rowNum: Product ID is required.";
            continue;
        }

        if (isset($seenIds[$id])) {
            $validationErrors[] = "Row $rowNum: Duplicate Product ID '$id' within CSV payload.";
            continue;
        }
        $seenIds[$id] = true;

        // Check if ID already exists in MySQL
        $chkStmt = $pdo->prepare("SELECT COUNT(*) FROM `products` WHERE id = :id");
        $chkStmt->execute([':id' => $id]);
        if ((int)$chkStmt->fetchColumn() > 0) {
            $validationErrors[] = "Row $rowNum: Product ID '$id' already exists in MySQL database.";
            continue;
        }

        if ($name === '') {
            $validationErrors[] = "Row $rowNum (ID: $id): Product name is required.";
        }

        $sportKey = strtolower($sportRaw);
        if (!isset($allowedSportsMap[$sportKey])) {
            $validationErrors[] = "Row $rowNum (ID: $id): Invalid sport '$sportRaw'. Must be one of Cricket, Football, Basketball, Badminton, Tennis, Running, Fitness, Volleyball, Table Tennis, Boxing.";
        }
        $sport = $allowedSportsMap[$sportKey] ?? strtolower($sportRaw);

        if ($category === '') {
            $validationErrors[] = "Row $rowNum (ID: $id): Category is required.";
        }

        if ($brand === '') {
            $validationErrors[] = "Row $rowNum (ID: $id): Brand is required.";
        }

        if ($priceRaw === null || !is_numeric($priceRaw) || (float)$priceRaw < 0) {
            $validationErrors[] = "Row $rowNum (ID: $id): Price must be a non-negative number.";
        }
        $price = (float)$priceRaw;

        $origPriceRaw = $item['originalPrice'] ?? $item['original_price'] ?? $price;
        $originalPrice = is_numeric($origPriceRaw) && (float)$origPriceRaw >= 0 ? (float)$origPriceRaw : $price;
        $discount = $originalPrice > $price ? (int)round((1 - $price / $originalPrice) * 100) : 0;

        $rating = is_numeric($ratingRaw) ? (float)$ratingRaw : 4.0;
        if ($rating < 0 || $rating > 5) {
            $validationErrors[] = "Row $rowNum (ID: $id): Rating must be between 0 and 5.";
        }

        $reviews = is_numeric($reviewsRaw) && (int)$reviewsRaw >= 0 ? (int)$reviewsRaw : 0;

        // Parse stock
        $stock = true;
        if (is_bool($stockRaw)) {
            $stock = $stockRaw;
        } elseif (is_numeric($stockRaw)) {
            $stock = (int)$stockRaw > 0;
        } elseif (is_string($stockRaw)) {
            $str = strtolower(trim($stockRaw));
            $stock = ($str === 'true' || $str === '1' || $str === 'yes' || $str === 'in stock' || $str === 'instock');
        }

        // Parse featured
        $featured = false;
        if (is_bool($featuredRaw)) {
            $featured = $featuredRaw;
        } elseif (is_numeric($featuredRaw)) {
            $featured = (int)$featuredRaw > 0;
        } elseif (is_string($featuredRaw)) {
            $str = strtolower(trim($featuredRaw));
            $featured = ($str === 'true' || $str === '1' || $str === 'yes');
        }

        // Images processing
        $imagesList = [];
        if (isset($item['images']) && is_array($item['images'])) {
            $imagesList = array_values(array_filter(array_map('trim', $item['images'])));
        } elseif (isset($item['images']) && is_string($item['images']) && trim($item['images']) !== '') {
            $imagesList = array_values(array_filter(array_map('trim', explode('|', $item['images']))));
        }

        if (empty($imagesList) && isset($item['image']) && trim((string)$item['image']) !== '') {
            $imagesList = [trim((string)$item['image'])];
        }

        if (empty($imagesList)) {
            $validationErrors[] = "Row $rowNum (ID: $id): Image path is required.";
        } else {
            foreach ($imagesList as $imgUrl) {
                if (str_starts_with($imgUrl, 'http://') || str_starts_with($imgUrl, 'https://')) {
                    $validationErrors[] = "Row $rowNum (ID: $id): External image URLs ('$imgUrl') are not allowed. Must use local /images/products/ path.";
                    continue;
                }
                if (!str_starts_with($imgUrl, '/images/products/') && !str_starts_with($imgUrl, 'images/products/')) {
                    $validationErrors[] = "Row $rowNum (ID: $id): Image path '$imgUrl' must start with /images/products/.";
                    continue;
                }

                // Verify file exists on disk
                if ($publicDir) {
                    $localPath = $publicDir . '/' . ltrim($imgUrl, '/');
                    if (!file_exists($localPath)) {
                        $validationErrors[] = "Row $rowNum (ID: $id): Missing image file: " . basename($imgUrl);
                    }
                }
            }
        }

        $primaryImage = !empty($imagesList) ? $imagesList[0] : '';
        $skillLevel = isset($item['skillLevel']) ? trim((string)$item['skillLevel']) : 'Beginner';
        $usage = isset($item['usage']) ? trim((string)$item['usage']) : 'Training';

        $sizes = isset($item['sizes']) && is_array($item['sizes']) ? json_encode(array_values($item['sizes'])) : null;
        $colors = isset($item['colors']) && is_array($item['colors']) ? json_encode(array_values($item['colors'])) : null;
        $tags = isset($item['tags']) && is_array($item['tags']) ? json_encode(array_values($item['tags'])) : null;

        $normalizedProducts[] = [
            'id'             => $id,
            'name'           => $name,
            'sport'          => $sport,
            'category'       => $category,
            'brand'          => $brand,
            'price'          => $price,
            'original_price' => $originalPrice,
            'discount'       => $discount,
            'rating'         => $rating,
            'reviews'        => $reviews,
            'stock'          => $stock ? 1 : 0,
            'description'    => $description,
            'featured'       => $featured ? 1 : 0,
            'image'          => $primaryImage,
            'images'         => $imagesList,
            'skill_level'    => $skillLevel,
            'usage_type'     => $usage,
            'sizes'          => $sizes,
            'colors'         => $colors,
            'tags'           => $tags,
        ];
    }

    if (!empty($validationErrors)) {
        sendErrorResponse("Validation failed for bulk import payload.", 400, [
          'error_count' => count($validationErrors),
          'errors' => array_slice($validationErrors, 0, 50), // return up to 50 detailed errors
        ]);
    }

    // Step 2: Database Transaction
    $pdo->beginTransaction();

    $stmtProd = $pdo->prepare("
        INSERT INTO `products` (
            id, name, sport, category, brand, price, original_price, discount,
            rating, reviews, stock, description, featured, image, skill_level,
            usage_type, sizes, colors, tags
        ) VALUES (
            :id, :name, :sport, :category, :brand, :price, :original_price, :discount,
            :rating, :reviews, :stock, :description, :featured, :image, :skill_level,
            :usage_type, :sizes, :colors, :tags
        )
    ");

    $stmtImg = $pdo->prepare("
        INSERT INTO `product_images` (product_id, image_url, sort_order) 
        VALUES (:product_id, :image_url, :sort_order)
    ");

    $sportCounts = [];
    $importedCount = 0;

    foreach ($normalizedProducts as $p) {
        $stmtProd->execute([
            ':id'             => $p['id'],
            ':name'           => $p['name'],
            ':sport'          => $p['sport'],
            ':category'       => $p['category'],
            ':brand'          => $p['brand'],
            ':price'          => $p['price'],
            ':original_price' => $p['original_price'],
            ':discount'       => $p['discount'],
            ':rating'         => $p['rating'],
            ':reviews'        => $p['reviews'],
            ':stock'          => $p['stock'],
            ':description'    => $p['description'],
            ':featured'       => $p['featured'],
            ':image'          => $p['image'],
            ':skill_level'    => $p['skill_level'],
            ':usage_type'     => $p['usage_type'],
            ':sizes'          => $p['sizes'],
            ':colors'         => $p['colors'],
            ':tags'           => $p['tags'],
        ]);

        foreach ($p['images'] as $order => $imgUrl) {
            $stmtImg->execute([
                ':product_id' => $p['id'],
                ':image_url'  => $imgUrl,
                ':sort_order' => $order,
            ]);
        }

        $importedCount++;
        $sp = ucfirst($p['sport']);
        $sportCounts[$sp] = ($sportCounts[$sp] ?? 0) + 1;
    }

    $pdo->commit();

    // Query total products in database
    $totalCountStmt = $pdo->query("SELECT COUNT(*) FROM `products`");
    $totalDbProducts = (int)$totalCountStmt->fetchColumn();

    sendJsonResponse([
        'success' => true,
        'message' => 'Import Successful',
        'importedCount' => $importedCount,
        'sportBreakdown' => $sportCounts,
        'totalDatabaseProducts' => $totalDbProducts,
    ], 201);

} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    sendErrorResponse('Bulk import failed and transaction was rolled back: ' . $e->getMessage(), 500);
}
