<?php
// backend/api/payments/verify.php
// Verify Razorpay signature, payment ownership, order linkage, and amount.

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
$paymentId = trim((string)($input['razorpay_payment_id'] ?? ''));
$browserOrderId = trim((string)($input['razorpay_order_id'] ?? ''));
$signature = trim((string)($input['razorpay_signature'] ?? ''));

if ($orderNumber === '' || $paymentId === '' || $browserOrderId === '' || $signature === '') {
    sendErrorResponse('Incomplete payment verification data.', 400);
}

try {
    $pdo = getDbConnection();
    $pdo->beginTransaction();

    $stmt = $pdo->prepare("SELECT id, order_number, customer_id, customer_email, total_amount, status, payment_status, payment_method, razorpay_order_id, razorpay_payment_id, paid_at FROM `orders` WHERE order_number = :order_number FOR UPDATE");
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
            sendErrorResponse('You do not have permission to verify this order.', 403);
        }
    } elseif ($guestEmail === '' || !hash_equals(strtolower((string)$order['customer_email']), $guestEmail)) {
        $pdo->rollBack();
        sendErrorResponse('Guest order verification failed.', 403);
    }

    if ($order['payment_status'] === 'paid') {
        $pdo->commit();
        sendJsonResponse([
            'success' => true,
            'already_paid' => true,
            'message' => 'Payment was already verified.',
            'order_number' => $order['order_number'],
            'payment_id' => $order['razorpay_payment_id'],
        ]);
    }

    if ($order['payment_method'] !== 'online') {
        $pdo->rollBack();
        sendErrorResponse('Only online payment orders can be verified.', 400);
    }

    if (!hash_equals((string)$order['razorpay_order_id'], $browserOrderId)) {
        $pdo->rollBack();
        sendErrorResponse('Payment order mismatch.', 400);
    }

    $config = razorpayConfig();
    $expectedSignature = razorpaySignature((string)$order['razorpay_order_id'], $paymentId, $config['key_secret']);
    if (!hash_equals($expectedSignature, $signature)) {
        $pdo->rollBack();
        sendErrorResponse('Payment signature could not be verified.', 400);
    }

    $payment = razorpayRequest('GET', '/payments/' . rawurlencode($paymentId));
    if ((string)($payment['order_id'] ?? '') !== (string)$order['razorpay_order_id']) {
        $pdo->rollBack();
        sendErrorResponse('Payment does not belong to this order.', 400);
    }

    $expectedAmount = (int)round((float)$order['total_amount'] * 100);
    if ((int)($payment['amount'] ?? 0) !== $expectedAmount || (string)($payment['currency'] ?? '') !== 'INR') {
        $pdo->rollBack();
        sendErrorResponse('Payment amount does not match the order total.', 400);
    }

    if (!in_array((string)($payment['status'] ?? ''), ['authorized', 'captured'], true)) {
        $pdo->rollBack();
        sendErrorResponse('Payment has not been authorized by Razorpay.', 400);
    }

    $update = $pdo->prepare("UPDATE `orders` SET payment_status = 'paid', payment_method = 'online', razorpay_payment_id = :payment_id, paid_at = NOW(), status = CASE WHEN status = 'pending' THEN 'confirmed' ELSE status END WHERE id = :id AND payment_status <> 'paid' AND payment_method = 'online'");
    $update->execute([':payment_id' => $paymentId, ':id' => (int)$order['id']]);
    $pdo->commit();

    sendJsonResponse([
        'success' => true,
        'message' => 'Payment verified successfully.',
        'order_number' => $order['order_number'],
        'payment_id' => $paymentId,
    ]);
} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    sendErrorResponse('Unable to verify the payment. Please contact support if money was deducted.', 502);
}
