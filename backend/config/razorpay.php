<?php
// backend/config/razorpay.php
// Razorpay test-mode configuration and API helpers.

declare(strict_types=1);

function razorpayConfig(): array {
    $localConfigPath = __DIR__ . '/razorpay.local.php';
    $localConfig = is_file($localConfigPath) ? require $localConfigPath : [];
    if (!is_array($localConfig)) {
        $localConfig = [];
    }

    $readConfig = static function (string $name) use ($localConfig): string {
        $environmentValue = getenv($name);
        if ($environmentValue !== false && trim((string)$environmentValue) !== '') {
            return trim((string)$environmentValue);
        }
        return trim((string)($localConfig[$name] ?? ''));
    };

    $keyId = $readConfig('RAZORPAY_KEY_ID');
    $keySecret = $readConfig('RAZORPAY_KEY_SECRET');
    $webhookSecret = $readConfig('RAZORPAY_WEBHOOK_SECRET');

    if ($keyId === '' || $keySecret === '' || str_contains($keyId, 'replace_with') || str_contains($keySecret, 'replace_with')) {
        throw new RuntimeException('Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in the PHP server environment or backend/config/razorpay.local.php.');
    }

    return [
        'key_id' => $keyId,
        'key_secret' => $keySecret,
        'webhook_secret' => $webhookSecret,
        'base_url' => 'https://api.razorpay.com/v1',
    ];
}

function razorpayRequest(string $method, string $path, ?array $payload = null): array {
    $config = razorpayConfig();
    $ch = curl_init($config['base_url'] . $path);
    if ($ch === false) {
        throw new RuntimeException('Unable to initialize Razorpay request.');
    }

    $headers = ['Accept: application/json', 'Content-Type: application/json'];
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_USERPWD => $config['key_id'] . ':' . $config['key_secret'],
        CURLOPT_HTTPAUTH => CURLAUTH_BASIC,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_TIMEOUT => 20,
    ]);
    if ($payload !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload, JSON_THROW_ON_ERROR));
    }

    $raw = curl_exec($ch);
    $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($raw === false || $curlError !== '') {
        throw new RuntimeException('cURL error: ' . ($curlError !== '' ? $curlError : 'request failed'));
    }

    $data = json_decode($raw, true);
    if (!is_array($data) || $httpCode < 200 || $httpCode >= 300) {
        $providerMessage = is_array($data) ? (string)($data['error']['description'] ?? $data['error']['reason'] ?? '') : '';
        $message = $providerMessage !== '' ? $providerMessage : 'Razorpay returned HTTP ' . $httpCode . '.';
        throw new RuntimeException('Razorpay HTTP ' . $httpCode . ': ' . $message);
    }

    return $data;
}

function razorpaySignature(string $orderId, string $paymentId, string $secret): string {
    return hash_hmac('sha256', $orderId . '|' . $paymentId, $secret);
}
