<?php
// backend/api/products/list.php
// GET Products catalog list endpoint with filtering, search, sorting, and pagination

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';

sendCorsHeaders();

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    sendErrorResponse('Method Not Allowed. Use GET.', 405);
}

try {
    $pdo = getDbConnection();

    // Collect query parameters
    $sport = isset($_GET['sport']) && trim((string)$_GET['sport']) !== '' && $_GET['sport'] !== 'all'
        ? trim((string)$_GET['sport']) : null;
    $category = isset($_GET['category']) && trim((string)$_GET['category']) !== '' && $_GET['category'] !== 'all'
        ? trim((string)$_GET['category']) : null;
    $brand = isset($_GET['brand']) && trim((string)$_GET['brand']) !== '' && $_GET['brand'] !== 'all'
        ? trim((string)$_GET['brand']) : null;
    $search = isset($_GET['search']) && trim((string)$_GET['search']) !== ''
        ? trim((string)$_GET['search']) : null;
    $featured = isset($_GET['featured']) && $_GET['featured'] !== 'all'
        ? ($_GET['featured'] === '1' || $_GET['featured'] === 'true' || $_GET['featured'] === 'yes') : null;
    $inStock = isset($_GET['in_stock']) && $_GET['in_stock'] !== 'all'
        ? ($_GET['in_stock'] === '1' || $_GET['in_stock'] === 'true' || $_GET['in_stock'] === 'in') : null;

    $sort = $_GET['sort'] ?? 'relevance';
    $page = max(1, (int)($_GET['page'] ?? 1));
    $limit = isset($_GET['limit']) ? max(0, (int)$_GET['limit']) : 0; // 0 = all products

    // Build WHERE clause
    $where = [];
    $params = [];

    if ($sport !== null) {
        $where[] = 'p.sport = :sport';
        $params[':sport'] = $sport;
    }

    if ($category !== null) {
        $where[] = 'p.category = :category';
        $params[':category'] = $category;
    }

    if ($brand !== null) {
        $where[] = 'p.brand = :brand';
        $params[':brand'] = $brand;
    }

    if ($featured !== null) {
        $where[] = 'p.featured = :featured';
        $params[':featured'] = $featured ? 1 : 0;
    }

    if ($inStock !== null) {
        $where[] = 'p.stock = :stock';
        $params[':stock'] = $inStock ? 1 : 0;
    }

    if ($search !== null) {
        $where[] = '(p.name LIKE :search OR p.brand LIKE :search OR p.sport LIKE :search OR p.category LIKE :search OR p.id LIKE :search)';
        $params[':search'] = '%' . $search . '%';
    }

    $whereSql = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';

    // Count total matching records
    $countSql = "SELECT COUNT(*) FROM `products` p $whereSql";
    $stmtCount = $pdo->prepare($countSql);
    $stmtCount->execute($params);
    $totalRecords = (int)$stmtCount->fetchColumn();

    // Determine ORDER BY clause
    switch ($sort) {
        case 'price-asc':
            $orderBy = 'p.price ASC';
            break;
        case 'price-desc':
            $orderBy = 'p.price DESC';
            break;
        case 'rating':
            $orderBy = 'p.rating DESC, p.reviews DESC';
            break;
        case 'popular':
        case 'reviews':
            $orderBy = 'p.reviews DESC, p.rating DESC';
            break;
        case 'newest':
            $orderBy = 'p.created_at DESC';
            break;
        case 'discount':
            $orderBy = 'p.discount DESC';
            break;
        case 'name-asc':
            $orderBy = 'p.name ASC';
            break;
        default:
            $orderBy = 'p.id ASC';
            break;
    }

    // Determine LIMIT / OFFSET
    $limitSql = '';
    if ($limit > 0) {
        $offset = ($page - 1) * $limit;
        $limitSql = sprintf('LIMIT %d OFFSET %d', $limit, $offset);
    }

    // Main SQL query with primary image subquery
    $sql = "
        SELECT 
            p.*,
            COALESCE(
                (SELECT pi.image_url FROM `product_images` pi WHERE pi.product_id = p.id ORDER BY pi.sort_order ASC, pi.id ASC LIMIT 1),
                p.image
            ) AS primary_image
        FROM `products` p
        $whereSql
        ORDER BY $orderBy
        $limitSql
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();

    // Collect product IDs to fetch all associated images in batch
    $productIds = array_column($rows, 'id');
    $imagesByProduct = [];

    if (!empty($productIds)) {
        $inClause = implode(',', array_fill(0, count($productIds), '?'));
        $imgStmt = $pdo->prepare("SELECT product_id, image_url FROM `product_images` WHERE product_id IN ($inClause) ORDER BY sort_order ASC, id ASC");
        $imgStmt->execute($productIds);
        while ($imgRow = $imgStmt->fetch()) {
            $imagesByProduct[$imgRow['product_id']][] = $imgRow['image_url'];
        }
    }

    // Format products list
    $formattedProducts = [];
    foreach ($rows as $row) {
        $pid = (string)$row['id'];
        $imgs = $imagesByProduct[$pid] ?? [];
        if (empty($imgs) && !empty($row['image'])) {
            $imgs = [$row['image']];
        }
        $primaryImg = !empty($imgs) ? $imgs[0] : ($row['primary_image'] ?? $row['image'] ?? '');

        $sizes = !empty($row['sizes']) ? json_decode($row['sizes'], true) : [];
        $colors = !empty($row['colors']) ? json_decode($row['colors'], true) : [];
        $tags = !empty($row['tags']) ? json_decode($row['tags'], true) : [];

        $formattedProducts[] = [
            'id'            => $pid,
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
            'image'         => $primaryImg,
            'images'        => $imgs,
            'sizes'         => is_array($sizes) ? $sizes : [],
            'colors'        => is_array($colors) ? $colors : [],
            'tags'          => is_array($tags) ? $tags : [],
            'createdAt'     => $row['created_at'] ?? null,
            'updatedAt'     => $row['updated_at'] ?? null,
        ];
    }

    $totalPages = $limit > 0 ? (int)ceil($totalRecords / $limit) : 1;

    sendJsonResponse([
        'success'    => true,
        'products'   => $formattedProducts,
        'pagination' => [
            'total'       => $totalRecords,
            'page'        => $page,
            'limit'       => $limit,
            'total_pages' => $totalPages,
        ],
    ], 200);

} catch (Throwable $e) {
    sendErrorResponse('Failed to fetch product list: ' . $e->getMessage(), 500);
}
