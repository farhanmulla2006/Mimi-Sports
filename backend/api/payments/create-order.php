<?php
// backend/api/payments/create-order.php
// Create a Razorpay order for an existing Mimi Sports order.

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/razorpay.php';

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

$stage = 'database_connection';
try {
    $pdo = getDbConnection();
    $stage = 'database_order_lookup';
    $stmt = $pdo->prepare("SELECT id, order_number, customer_id, customer_email, total_amount, payment_status, razorpay_order_id FROM `orders` WHERE order_number = :order_number LIMIT 1");
    $stmt->execute([':order_number' => $orderNumber]);
    $order = $stmt->fetch();

    if (!$order) {
        sendErrorResponse('Order not found.', 404);
    }

    $stage = 'order_ownership_check';
    $sessionCustomerId = !empty($_SESSION['customer_id']) ? (int)$_SESSION['customer_id'] : null;
    if ($order['customer_id'] !== null) {
        if ($sessionCustomerId === null || $sessionCustomerId !== (int)$order['customer_id']) {
            sendErrorResponse('You do not have permission to pay for this order.', 403);
        }
    } elseif ($guestEmail === '' || !hash_equals(strtolower((string)$order['customer_email']), $guestEmail)) {
        sendErrorResponse('Guest order verification failed.', 403);
    }

    if ($order['payment_status'] === 'paid') {
        sendErrorResponse('This order has already been paid.', 409);
    }

    if (!empty($order['razorpay_order_id']) && $order['payment_status'] === 'created') {
        $config = razorpayConfig();
        sendJsonResponse([
            'success' => true,
            'razorpay_order_id' => $order['razorpay_order_id'],
            'amount' => (int)round((float)$order['total_amount'] * 100),
            'currency' => 'INR',
            'key_id' => $config['key_id'],
        ]);
    }

    $stage = 'amount_validation';
    $amount = (int)round((float)$order['total_amount'] * 100);
    if ($amount <= 0) {
        sendErrorResponse('This order has an invalid payment amount.', 422);
    }

    $stage = 'razorpay_api';
    $razorpayOrder = razorpayRequest('POST', '/orders', [
        'amount' => $amount,
        'currency' => 'INR',
        'receipt' => $order['order_number'],
        'notes' => ['mimi_order_id' => (string)$order['id']],
    ]);

    $razorpayOrderId = trim((string)($razorpayOrder['id'] ?? ''));
    if ($razorpayOrderId === '' || (int)($razorpayOrder['amount'] ?? 0) !== $amount) {
        sendErrorResponse('Razorpay returned an invalid order.', 502);
    }

    $stage = 'database_payment_order_update';
    $update = $pdo->prepare("UPDATE `orders` SET payment_status = 'created', payment_method = 'online', razorpay_order_id = :razorpay_order_id WHERE id = :id AND payment_status <> 'paid' AND payment_method = 'online'");
    $update->execute([':razorpay_order_id' => $razorpayOrderId, ':id' => (int)$order['id']]);

    $config = razorpayConfig();
    sendJsonResponse([
        'success' => true,
        'razorpay_order_id' => $razorpayOrderId,
        'amount' => $amount,
        'currency' => 'INR',
        'key_id' => $config['key_id'],
    ], 201);
} catch (Throwable $e) {
    $diagnostic = [
        'stage' => $stage,
        'error' => $e->getMessage(),
    ];
    error_log('Mimi Sports payment order creation failed: ' . json_encode($diagnostic, JSON_UNESCAPED_SLASHES));
    sendJsonResponse([
        'success' => false,
        'message' => 'Payment order creation failed',
        'debug' => $diagnostic,
    ], 502);
}
