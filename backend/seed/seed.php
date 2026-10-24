<?php
// backend/seed/seed.php
// Database seed script to import products catalog from src/data/products.js into MySQL

declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';

echo "==================================================\n";
echo "Mimi Sports — MySQL Database Seed Script\n";
echo "==================================================\n\n";

$jsonPath = __DIR__ . '/products_catalog.json';
$jsPath = __DIR__ . '/../../src/data/products.js';
$publicDir = realpath(__DIR__ . '/../../public');

// Step 1: Ensure database connection & tables exist
try {
    // First connect without DB name to ensure database exists
    $dsnNoDb = sprintf('mysql:host=%s;port=%d;charset=utf8mb4', DB_HOST, DB_PORT);
    $rawPdo = new PDO($dsnNoDb, DB_USER, DB_PASS, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    $rawPdo->exec("CREATE DATABASE IF NOT EXISTS `" . DB_NAME . "` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    echo "✓ Database '" . DB_NAME . "' verified/created.\n";

    $pdo = getDbConnection();

    // Execute schema if tables do not exist
    $sqlFile = __DIR__ . '/../sql/mimi_sports.sql';
    if (file_exists($sqlFile)) {
        $sql = file_get_contents($sqlFile);
        $pdo->exec($sql);
        echo "✓ Executed SQL schema from mimi_sports.sql\n";
    }

} catch (Throwable $e) {
    echo "❌ Database initialization failed: " . $e->getMessage() . "\n";
    exit(1);
}

// Step 2: Extract products array if products_catalog.json is not present or outdated
if (!file_exists($jsonPath)) {
    echo "Generating products_catalog.json from src/data/products.js...\n";
    $nodeCmd = sprintf('node -e "import(\'%s\').then(m => require(\'fs\').writeFileSync(\'%s\', JSON.stringify(m.products, null, 2)))"', 
        addslashes(str_replace('\\', '/', realpath($jsPath))),
        addslashes(str_replace('\\', '/', $jsonPath))
    );
    exec($nodeCmd, $out, $ret);
    if ($ret !== 0 || !file_exists($jsonPath)) {
        echo "❌ Failed to extract products from products.js via Node.\n";
        exit(1);
    }
}

$rawJson = file_get_contents($jsonPath);
$products = json_decode($rawJson, true);

if (!is_array($products) || empty($products)) {
    echo "❌ Invalid catalog data in $jsonPath\n";
    exit(1);
}

echo sprintf("Found %d products to seed.\n\n", count($products));

$seededProducts = 0;
$seededImages = 0;
$existingImagesCount = 0;
$missingImagesCount = 0;
$sportCounts = [];

$pdo->beginTransaction();

try {
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
        ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            sport = VALUES(sport),
            category = VALUES(category),
            brand = VALUES(brand),
            price = VALUES(price),
            original_price = VALUES(original_price),
            discount = VALUES(discount),
            rating = VALUES(rating),
            reviews = VALUES(reviews),
            stock = VALUES(stock),
            description = VALUES(description),
            featured = VALUES(featured),
            image = VALUES(image),
            skill_level = VALUES(skill_level),
            usage_type = VALUES(usage_type),
            sizes = VALUES(sizes),
            colors = VALUES(colors),
            tags = VALUES(tags)
    ");

    $delImgStmt = $pdo->prepare("DELETE FROM `product_images` WHERE product_id = :id");
    $insImgStmt = $pdo->prepare("INSERT INTO `product_images` (product_id, image_url, sort_order) VALUES (:id, :url, :order)");

    foreach ($products as $p) {
        $id = (string)$p['id'];
        $sport = (string)$p['sport'];
        $price = (float)($p['price'] ?? 0);
        $origPrice = isset($p['originalPrice']) ? (float)$p['originalPrice'] : (isset($p['original_price']) ? (float)$p['original_price'] : $price);
        $discount = isset($p['discount']) ? (int)$p['discount'] : ($origPrice > $price ? (int)round((1 - $price / $origPrice) * 100) : 0);

        // Collect images
        $imagesList = [];
        if (isset($p['images']) && is_array($p['images'])) {
            $imagesList = array_values(array_filter(array_map('trim', $p['images'])));
        }
        if (empty($imagesList) && isset($p['image']) && trim((string)$p['image']) !== '') {
            $imagesList = [trim((string)$p['image'])];
        }

        $primaryImage = !empty($imagesList) ? $imagesList[0] : '';

        // Validate image paths on disk
        foreach ($imagesList as $imgUrl) {
            $localFilePath = $publicDir ? $publicDir . '/' . ltrim($imgUrl, '/') : '';
            if ($localFilePath && file_exists($localFilePath)) {
                $existingImagesCount++;
            } else {
                $missingImagesCount++;
            }
        }

        $sizes = isset($p['sizes']) && is_array($p['sizes']) ? json_encode(array_values($p['sizes'])) : null;
        $colors = isset($p['colors']) && is_array($p['colors']) ? json_encode(array_values($p['colors'])) : null;
        $tags = isset($p['tags']) && is_array($p['tags']) ? json_encode(array_values($p['tags'])) : null;

        $stmtProd->execute([
            ':id'             => $id,
            ':name'           => (string)$p['name'],
            ':sport'          => $sport,
            ':category'       => (string)$p['category'],
            ':brand'          => (string)$p['brand'],
            ':price'          => $price,
            ':original_price' => $origPrice,
            ':discount'       => $discount,
            ':rating'         => (float)($p['rating'] ?? 0),
            ':reviews'        => (int)($p['reviewCount'] ?? $p['reviews'] ?? 0),
            ':stock'          => !empty($p['stock']) ? 1 : 0,
            ':description'    => (string)($p['description'] ?? ''),
            ':featured'       => !empty($p['featured']) ? 1 : 0,
            ':image'          => $primaryImage,
            ':skill_level'    => (string)($p['skillLevel'] ?? 'Beginner'),
            ':usage_type'     => (string)($p['usage'] ?? 'Training'),
            ':sizes'          => $sizes,
            ':colors'         => $colors,
            ':tags'           => $tags,
        ]);

        $seededProducts++;
        $sportCounts[$sport] = ($sportCounts[$sport] ?? 0) + 1;

        // Sync images into product_images table
        $delImgStmt->execute([':id' => $id]);
        foreach ($imagesList as $order => $imgUrl) {
            $insImgStmt->execute([
                ':id'    => $id,
                ':url'   => $imgUrl,
                ':order' => $order,
            ]);
            $seededImages++;
        }
    }

    $pdo->commit();

} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo "❌ Seeding failed: " . $e->getMessage() . "\n";
    exit(1);
}

echo "==================================================\n";
echo "SEEDING COMPLETE\n";
echo "==================================================\n";
echo sprintf("• Total Products Seeded:       %d\n", $seededProducts);
echo sprintf("• Total Product Images Seeded:  %d\n", $seededImages);
echo sprintf("• Images Verified on Disk:      %d\n", $existingImagesCount);
if ($missingImagesCount > 0) {
    echo sprintf("• Images Not Found on Disk:     %d (preserved in DB)\n", $missingImagesCount);
}
echo "\nBreakdown by Sport:\n";
foreach ($sportCounts as $sp => $cnt) {
    echo sprintf("  - %-15s %d products\n", ucfirst($sp) . ':', $cnt);
}
echo "\nDatabase seeding completed successfully with zero duplicates!\n";
