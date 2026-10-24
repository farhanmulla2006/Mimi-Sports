<?php
// backend/api/payments/complete-demo.php
// Complete a clearly simulated local payment without contacting Razorpay.

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';

sendCorsHeaders();
startSession();

if (($_SERVER['REQUEST_METHOD'] ?? 'POST') !== 'POST') {
    sendErrorResponse('Method Not Allowed. Use POST.', 405);
}

$input = parseJsonInput();
$orderNumber = trim((string)($input['order_number'] ?? ''));
$guestEmail = strtolower(trim((string)($input['email'] ?? '')));

if ($orderNumber === '') {
    sendErrorResponse('Order number is required.', 400);
}

try {
    $pdo = getDbConnection();
    $pdo->beginTransaction();

    $stmt = $pdo->prepare(
        "SELECT id, order_number, customer_id, customer_email, payment_status, payment_method, paid_at
         FROM `orders`
         WHERE order_number = :order_number
         LIMIT 1
         FOR UPDATE"
    );
    $stmt->execute([':order_number' => $orderNumber]);
    $order = $stmt->fetch();

    if (!$order) {
        $pdo->rollBack();
        sendErrorResponse('Order not found.', 404);
    }

    $sessionCustomerId = !empty($_SESSION['customer_id']) ? (int)$_SESSION['customer_id'] : null;
    if ($order['customer_id'] !== null) {
        if ($sessionCustomerId === null || $sessionCustomerId !== (int)$order['customer_id']) {
            $pdo->rollBack();
            sendErrorResponse('You do not have permission to complete this order.', 403);
        }
    } elseif ($guestEmail === '' || !hash_equals(strtolower((string)$order['customer_email']), $guestEmail)) {
        $pdo->rollBack();
        sendErrorResponse('Guest order verification failed.', 403);
    }

    if ($order['payment_method'] !== 'online') {
        $pdo->rollBack();
        sendErrorResponse('Only online payment orders can use the demo payment flow.', 400);
    }

    if ($order['payment_status'] === 'paid') {
        $pdo->commit();
        sendJsonResponse([
            'success' => true,
            'already_paid' => true,
            'message' => 'Demo payment was already completed.',
            'order_number' => $order['order_number'],
            'payment_status' => $order['payment_status'],
            'payment_method' => $order['payment_method'],
            'paid_at' => $order['paid_at'],
        ]);
    }

    $update = $pdo->prepare(
        "UPDATE `orders`
         SET payment_status = 'paid', paid_at = NOW(),
             status = CASE WHEN status = 'pending' THEN 'confirmed' ELSE status END
         WHERE id = :id AND payment_status <> 'paid'"
    );
    $update->execute([':id' => (int)$order['id']]);
    $order['payment_status'] = 'paid';
    $order['payment_method'] = 'online';
    $order['paid_at'] = date('Y-m-d H:i:s');
    $pdo->commit();

    sendJsonResponse([
        'success' => true,
        'message' => 'Demo payment completed successfully.',
        'order_number' => $order['order_number'],
        'payment_status' => $order['payment_status'],
        'payment_method' => $order['payment_method'],
        'paid_at' => $order['paid_at'],
    ]);
} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    sendErrorResponse('Unable to complete the demo payment. Please try again.', 500);
}
