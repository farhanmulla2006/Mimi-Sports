export function getPaymentStatusLabel(paymentStatus) {
  switch (String(paymentStatus || '').toLowerCase()) {
    case 'paid':
      return 'Paid'
    case 'pending':
    case 'created':
      return 'Payment Pending'
    case 'failed':
      return 'Payment Failed'
    case 'refunded':
      return 'Payment Refunded'
    default:
      return 'Payment Status Unavailable'
  }
}

export function getPaymentMethodLabel(paymentMethod) {
  switch (String(paymentMethod || '').toLowerCase()) {
    case 'online':
      return 'Online Payment'
    case 'cod':
      return 'Cash on Delivery'
    default:
      return 'Payment Method Unavailable'
  }
}

export function getPaymentStatusClass(paymentStatus) {
  switch (String(paymentStatus || '').toLowerCase()) {
    case 'paid':
      return 'admin-badge--confirmed'
    case 'pending':
    case 'created':
      return 'admin-badge--pending'
    case 'failed':
      return 'admin-badge--cancelled'
    default:
      return 'admin-badge--neutral'
  }
}
