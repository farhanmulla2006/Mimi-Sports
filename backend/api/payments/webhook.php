<?php
// backend/api/payments/webhook.php
// Idempotent Razorpay payment.captured webhook handler.

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/razorpay.php';

sendCorsHeaders();
if (($_SERVER['REQUEST_METHOD'] ?? 'POST') !== 'POST') {
    sendErrorResponse('Method Not Allowed. Use POST.', 405);
}

$raw = file_get_contents('php://input') ?: '';
$signature = trim((string)($_SERVER['HTTP_X_RAZORPAY_SIGNATURE'] ?? ''));
try {
    $config = razorpayConfig();
    if ($config['webhook_secret'] === '' || $signature === '' || !hash_equals(hash_hmac('sha256', $raw, $config['webhook_secret']), $signature)) {
        sendErrorResponse('Invalid webhook signature.', 400);
    }

    $payload = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
    $payment = $payload['payload']['payment']['entity'] ?? null;
    if (!is_array($payment) || ($payload['event'] ?? '') !== 'payment.captured') {
        sendJsonResponse(['success' => true, 'ignored' => true]);
    }

    $razorpayOrderId = trim((string)($payment['order_id'] ?? ''));
    $paymentId = trim((string)($payment['id'] ?? ''));
    if ($razorpayOrderId === '' || $paymentId === '') {
        sendErrorResponse('Invalid payment webhook payload.', 400);
    }

    $pdo = getDbConnection();
    $pdo->beginTransaction();
    $stmt = $pdo->prepare("SELECT id, total_amount, payment_status FROM `orders` WHERE razorpay_order_id = :razorpay_order_id LIMIT 1 FOR UPDATE");
    $stmt->execute([':razorpay_order_id' => $razorpayOrderId]);
    $order = $stmt->fetch();
    if (!$order) {
        $pdo->rollBack();
        sendErrorResponse('Payment order is not linked to a Mimi Sports order.', 404);
    }

    $expectedAmount = (int)round((float)$order['total_amount'] * 100);
    if ((int)($payment['amount'] ?? 0) !== $expectedAmount || (string)($payment['currency'] ?? '') !== 'INR') {
        $pdo->rollBack();
        sendErrorResponse('Payment amount does not match the order total.', 400);
    }

    if ($order['payment_status'] !== 'paid') {
        $update = $pdo->prepare("UPDATE `orders` SET payment_status = 'paid', payment_method = 'online', razorpay_payment_id = :payment_id, paid_at = NOW(), status = CASE WHEN status = 'pending' THEN 'confirmed' ELSE status END WHERE id = :id AND payment_status <> 'paid' AND payment_method = 'online'");
        $update->execute([':payment_id' => $paymentId, ':id' => (int)$order['id']]);
    }
    $pdo->commit();
    sendJsonResponse(['success' => true, 'message' => 'Webhook processed.']);
} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    sendErrorResponse('Webhook could not be processed.', 400);
}
