<?php
// backend/api/orders/create.php
// POST Create Order endpoint with server-side validation, price calculation & transaction safety

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';

sendCorsHeaders();
startSession();

if (($_SERVER['REQUEST_METHOD'] ?? 'POST') !== 'POST') {
    sendErrorResponse('Method Not Allowed. Use POST.', 405);
}

$input = parseJsonInput();

$customer = isset($input['customer']) && is_array($input['customer']) ? $input['customer'] : [];
$shipping = isset($input['shipping']) && is_array($input['shipping']) ? $input['shipping'] : [];
$items = isset($input['items']) && is_array($input['items']) ? $input['items'] : [];
$paymentMethod = strtolower(trim((string)($input['payment_method'] ?? '')));

// 1. Client & Customer Validation
$name    = isset($customer['name']) ? trim((string)$customer['name']) : '';
$email   = isset($customer['email']) ? trim((string)$customer['email']) : '';
$phone   = isset($customer['phone']) ? trim((string)$customer['phone']) : '';

$address = isset($shipping['address']) ? trim((string)$shipping['address']) : '';
$city    = isset($shipping['city']) ? trim((string)$shipping['city']) : '';
$state   = isset($shipping['state']) ? trim((string)$shipping['state']) : '';
$pincode = isset($shipping['pincode']) ? trim((string)$shipping['pincode']) : '';

$errors = [];
if ($name === '')     $errors['name'] = 'Full name is required.';
if ($email === '')    $errors['email'] = 'Email address is required.';
elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) $errors['email'] = 'Please enter a valid email address.';

if ($phone === '')    $errors['phone'] = 'Phone number is required.';
elseif (!preg_match('/^[0-9+\-\s()]{7,20}$/', $phone)) $errors['phone'] = 'Please enter a valid phone number.';

if ($address === '') $errors['address'] = 'Shipping address is required.';
if ($city === '')    $errors['city'] = 'City is required.';
if ($state === '')   $errors['state'] = 'State is required.';
if ($pincode === '') $errors['pincode'] = 'Pincode is required.';
elseif (!preg_match('/^[0-9A-Za-z\s\-]{3,10}$/', $pincode)) $errors['pincode'] = 'Please enter a valid pincode.';

if (empty($items)) {
    $errors['cart'] = 'Your shopping cart is empty. Add products before placing an order.';
}

if (!in_array($paymentMethod, ['online', 'cod'], true)) {
    $errors['payment_method'] = 'Select a valid payment method: online or cod.';
}

if (!empty($errors)) {
    sendErrorResponse('Validation failed.', 400, $errors);
}

try {
    $pdo = getDbConnection();
    $pdo->beginTransaction();

    $orderItemsData = [];
    $subtotal = 0.0;

    // 2. Fetch product records from MySQL and validate prices/stock
    $prodStmt = $pdo->prepare("SELECT id, name, price, stock FROM `products` WHERE id = :id LIMIT 1");

    foreach ($items as $idx => $item) {
        $prodId = isset($item['id']) ? trim((string)$item['id']) : (isset($item['productId']) ? trim((string)$item['productId']) : '');
        $qty = isset($item['quantity']) ? (int)$item['quantity'] : 1;

        if ($prodId === '' || $qty <= 0) {
            $pdo->rollBack();
            sendErrorResponse('Invalid product item in cart.', 400);
        }

        $prodStmt->execute([':id' => $prodId]);
        $prod = $prodStmt->fetch();

        if (!$prod) {
            $pdo->rollBack();
            sendErrorResponse("Product with ID '$prodId' was not found in catalog.", 404);
        }

        // Verify stock
        if (empty($prod['stock'])) {
            $pdo->rollBack();
            sendErrorResponse("Sorry, '{$prod['name']}' is currently out of stock.", 400);
        }

        $unitPrice = (float)$prod['price'];
        $itemSubtotal = $unitPrice * $qty;
        $subtotal += $itemSubtotal;

        $orderItemsData[] = [
            'product_id'   => $prod['id'],
            'product_name' => $prod['name'],
            'quantity'     => $qty,
            'unit_price'   => $unitPrice,
            'subtotal'     => $itemSubtotal,
        ];
    }

    // 3. Calculate shipping & totals server-side
    $shippingCharge = $subtotal >= 999.0 ? 0.0 : 99.0;
    $totalAmount = $subtotal + $shippingCharge;

    // 4. Generate Order Number: MS-YYYYMMDD-XXXX
    $datePart = date('Ymd');
    $randomPart = strtoupper(substr(bin2hex(random_bytes(3)), 0, 5));
    $orderNumber = "MS-{$datePart}-{$randomPart}";

    $customerId = !empty($_SESSION['customer_id']) ? (int)$_SESSION['customer_id'] : null;

    // 5. Insert Order
    $orderIns = $pdo->prepare("
        INSERT INTO `orders` (
            customer_id, order_number, customer_name, customer_email, customer_phone,
            shipping_address, shipping_city, shipping_state, shipping_pincode,
            subtotal, shipping_charge, total_amount, status, payment_status, payment_method
        ) VALUES (
            :customer_id, :order_number, :name, :email, :phone,
            :address, :city, :state, :pincode,
            :subtotal, :shipping_charge, :total_amount, 'pending', 'pending', :payment_method
        )
    ");

    $orderIns->execute([
        ':customer_id'     => $customerId,
        ':order_number'    => $orderNumber,
        ':name'            => $name,
        ':email'           => strtolower($email),
        ':phone'           => $phone,
        ':address'         => $address,
        ':city'            => $city,
        ':state'           => $state,
        ':pincode'         => $pincode,
        ':subtotal'        => $subtotal,
        ':shipping_charge' => $shippingCharge,
        ':total_amount'    => $totalAmount,
        ':payment_method'  => $paymentMethod,
    ]);

    $orderId = (int)$pdo->lastInsertId();

    // 6. Insert Order Items
    $itemIns = $pdo->prepare("
        INSERT INTO `order_items` (
            order_id, product_id, product_name, quantity, unit_price, subtotal
        ) VALUES (
            :order_id, :product_id, :product_name, :quantity, :unit_price, :subtotal
        )
    ");

    foreach ($orderItemsData as $itemRow) {
        $itemIns->execute([
            ':order_id'     => $orderId,
            ':product_id'   => $itemRow['product_id'],
            ':product_name' => $itemRow['product_name'],
            ':quantity'     => $itemRow['quantity'],
            ':unit_price'   => $itemRow['unit_price'],
            ':subtotal'     => $itemRow['subtotal'],
        ]);
    }

    $pdo->commit();

    sendJsonResponse([
        'success' => true,
        'message' => 'Order placed successfully',
        'order'   => [
            'id'               => $orderId,
            'order_number'     => $orderNumber,
            'customer_name'    => $name,
            'customer_email'   => strtolower($email),
            'customer_phone'   => $phone,
            'shipping_address' => $address,
            'shipping_city'    => $city,
            'shipping_state'   => $state,
            'shipping_pincode'  => $pincode,
            'subtotal'         => $subtotal,
            'shipping_charge'  => $shippingCharge,
            'total_amount'     => $totalAmount,
            'status'           => 'pending',
            'payment_status'   => 'pending',
            'payment_method'   => $paymentMethod,
            'created_at'       => date('Y-m-d H:i:s'),
            'items'            => $orderItemsData,
        ],
    ], 201);

} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    sendErrorResponse('Unable to place your order. Please try again.', 500, ['error' => $e->getMessage()]);
}
