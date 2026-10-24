<?php
// backend/scripts/cleanup_added_products.php
// Safe one-time cleanup script to remove exactly the 138 added products from MySQL database.

declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';

function generateIdRange(string $prefix, int $start, int $end): array {
    $ids = [];
    for ($i = $start; $i <= $end; $i++) {
        $ids[] = "{$prefix}-{$i}";
    }
    return $ids;
}

// 1. Define explicit original product ID ranges (138 products)
$originalRanges = [
    'cricket'      => [1, 20],
    'football'     => [1, 20],
    'basketball'   => [1, 15],
    'badminton'    => [1, 15],
    'tennis'       => [1, 12],
    'running'      => [1, 15],
    'fitness'      => [1, 15],
    'volleyball'   => [1, 10],
    'table-tennis' => [1, 8],
    'boxing'       => [1, 8],
];

$originalIds = [];
foreach ($originalRanges as $prefix => [$start, $end]) {
    $originalIds = array_merge($originalIds, generateIdRange($prefix, $start, $end));
}

// 2. Define explicit target deletion product ID ranges (138 products)
$deleteRanges = [
    'cricket'      => [21, 40],
    'football'     => [21, 40],
    'basketball'   => [16, 30],
    'badminton'    => [16, 30],
    'tennis'       => [13, 24],
    'running'      => [16, 30],
    'fitness'      => [16, 30],
    'volleyball'   => [11, 20],
    'table-tennis' => [9, 16],
    'boxing'       => [9, 16],
];

$deleteIds = [];
foreach ($deleteRanges as $prefix => [$start, $end]) {
    $deleteIds = array_merge($deleteIds, generateIdRange($prefix, $start, $end));
}

echo "===================================================\n";
echo " MIMI SPORTS — DATABASE CLEANUP PRE-CHECK & DELETE \n";
echo "===================================================\n\n";

try {
    $pdo = getDbConnection();

    // STEP 1: PRE-DELETE AUDIT & VERIFICATION
    echo "[1/4] Running Pre-Delete Verification...\n";

    // Count total products before
    $stmt = $pdo->query("SELECT COUNT(*) FROM products");
    $totalBefore = (int)$stmt->fetchColumn();
    echo " -> Total products currently in DB: {$totalBefore}\n";

    // Count original IDs present in DB
    $placeholdersOrig = implode(',', array_fill(0, count($originalIds), '?'));
    $stmtOrig = $pdo->prepare("SELECT COUNT(*) FROM products WHERE id IN ({$placeholdersOrig})");
    $stmtOrig->execute($originalIds);
    $originalsFound = (int)$stmtOrig->fetchColumn();
    echo " -> Original product IDs found in DB: {$originalsFound} / " . count($originalIds) . "\n";

    // Count target deletion IDs present in DB
    $placeholdersDel = implode(',', array_fill(0, count($deleteIds), '?'));
    $stmtDel = $pdo->prepare("SELECT COUNT(*) FROM products WHERE id IN ({$placeholdersDel})");
    $stmtDel->execute($deleteIds);
    $targetsFound = (int)$stmtDel->fetchColumn();
    echo " -> Target products for deletion found in DB: {$targetsFound} / " . count($deleteIds) . "\n";

    // Strict validation
    if (count($originalIds) !== 138) {
        throw new Exception("Original IDs count definition error: Expected 138, got " . count($originalIds));
    }
    if (count($deleteIds) !== 138) {
        throw new Exception("Delete IDs count definition error: Expected 138, got " . count($deleteIds));
    }
    if ($originalsFound !== 138) {
        throw new Exception("Pre-delete verification failed! Not all 138 original products exist in DB (found {$originalsFound}). Deletion aborted.");
    }
    if ($targetsFound !== 138) {
        throw new Exception("Pre-delete verification failed! Target deletion count is {$targetsFound}, expected exactly 138. Deletion aborted.");
    }

    echo " ✓ Pre-delete verification PASSED: Exactly 138 target products identified for deletion.\n\n";

    // STEP 2: EXECUTE TRANSACTIONAL DELETE
    echo "[2/4] Executing Database Transactional Deletion...\n";
    $pdo->beginTransaction();

    // Delete related product_images first
    $stmtDelImages = $pdo->prepare("DELETE FROM product_images WHERE product_id IN ({$placeholdersDel})");
    $stmtDelImages->execute($deleteIds);
    $deletedImagesCount = $stmtDelImages->rowCount();
    echo " -> Deleted {$deletedImagesCount} related rows from product_images.\n";

    // Delete matching products
    $stmtDelProds = $pdo->prepare("DELETE FROM products WHERE id IN ({$placeholdersDel})");
    $stmtDelProds->execute($deleteIds);
    $actuallyDeleted = $stmtDelProds->rowCount();
    echo " -> Deleted {$actuallyDeleted} rows from products table.\n";

    if ($actuallyDeleted !== 138) {
        $pdo->rollBack();
        throw new Exception("Deletion mismatch! Actually deleted {$actuallyDeleted} rows, expected 138. Transaction rolled back.");
    }

    $pdo->commit();
    echo " ✓ Transaction COMMITTED successfully.\n\n";

    // STEP 3: POST-DELETE VERIFICATION
    echo "[3/4] Running Post-Delete Verification...\n";

    // Remaining total
    $stmt = $pdo->query("SELECT COUNT(*) FROM products");
    $remainingTotal = (int)$stmt->fetchColumn();

    // Unique IDs
    $stmt = $pdo->query("SELECT COUNT(DISTINCT id) FROM products");
    $remainingUnique = (int)$stmt->fetchColumn();

    // Duplicate IDs check
    $stmt = $pdo->query("SELECT id, COUNT(*) as cnt FROM products GROUP BY id HAVING cnt > 1");
    $duplicates = $stmt->fetchAll();
    $duplicateCount = count($duplicates);

    // Verify no deleted IDs remain
    $stmtDelCheck = $pdo->prepare("SELECT COUNT(*) FROM products WHERE id IN ({$placeholdersDel})");
    $stmtDelCheck->execute($deleteIds);
    $deletedRemaining = (int)$stmtDelCheck->fetchColumn();

    // Verify all original IDs still exist
    $stmtOrigCheck = $pdo->prepare("SELECT COUNT(*) FROM products WHERE id IN ({$placeholdersOrig})");
    $stmtOrigCheck->execute($originalIds);
    $originalsRemaining = (int)$stmtOrigCheck->fetchColumn();

    // Check for orphaned images
    $stmtOrphanCheck = $pdo->query("SELECT COUNT(*) FROM product_images WHERE product_id NOT IN (SELECT id FROM products)");
    $orphanedImages = (int)$stmtOrphanCheck->fetchColumn();

    echo " -> Remaining product count: {$remainingTotal}\n";
    echo " -> Unique product IDs: {$remainingUnique}\n";
    echo " -> Duplicate IDs: {$duplicateCount}\n";
    echo " -> Deleted IDs still remaining: {$deletedRemaining}\n";
    echo " -> Original IDs present: {$originalsRemaining}\n";
    echo " -> Orphaned product images: {$orphanedImages}\n\n";

    $passed = (
        $remainingTotal === 138 &&
        $remainingUnique === 138 &&
        $duplicateCount === 0 &&
        $deletedRemaining === 0 &&
        $originalsRemaining === 138 &&
        $orphanedImages === 0
    );

    if (!$passed) {
        throw new Exception("Post-delete verification failed! Criteria not met.");
    }

    echo "[4/4] SUMMARY REPORT:\n";
    echo "---------------------------------------------------\n";
    echo " Number of products before:        {$totalBefore}\n";
    echo " Number targeted for deletion:     " . count($deleteIds) . "\n";
    echo " Number actually deleted:          {$actuallyDeleted}\n";
    echo " Number remaining:                 {$remainingTotal}\n";
    echo " Verification result:              PASSED (ALL CHECKS SUCCESSFUL)\n";
    echo "---------------------------------------------------\n";

} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
        echo " [ROLLBACK] Transaction rolled back.\n";
    }
    echo "\n ERROR: " . $e->getMessage() . "\n";
    exit(1);
}
