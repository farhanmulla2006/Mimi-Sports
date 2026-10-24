// src/services/api.js
// Centralized PHP REST API Client for Mimi Sports

const getApiBaseUrl = () => {
  const currentHost = typeof window !== 'undefined' && window.location.hostname ? window.location.hostname : ''
  const envUrl = import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, '') : ''

  // When running in the browser, guarantee the API hostname strictly matches the frontend hostname
  // to avoid cross-site cookie blocking between localhost and 127.0.0.1
  if (currentHost) {
    if (envUrl) {
      try {
        const parsed = new URL(envUrl)
        if (
          (currentHost === 'localhost' || currentHost === '127.0.0.1') &&
          (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1')
        ) {
          parsed.hostname = currentHost
          return parsed.toString().replace(/\/+$/, '')
        }
        return envUrl
      } catch {
        // Fall back to currentHost if URL parsing fails
      }
    }
    return `http://${currentHost}:8000/backend/api`
  }

  if (envUrl) {
    return envUrl
  }

  return 'http://127.0.0.1:8000/backend/api'
}

const API_BASE_URL = getApiBaseUrl()

/**
 * Generic fetch wrapper with error handling and JSON parsing
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`

  const config = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options.headers,
    },
    ...options,
  }

  if (config.body && typeof config.body !== 'string') {
    config.body = JSON.stringify(config.body)
  }

  try {
    const response = await fetch(url, config)

    let data
    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      data = await response.json()
    } else {
      const text = await response.text()
      try {
        data = JSON.parse(text)
      } catch {
        data = { success: false, message: text || `HTTP ${response.status}` }
      }
    }

    if (!response.ok || data.success === false) {
      const errorMsg = data.message || `API Request failed with status ${response.status}`
      const error = new Error(errorMsg)
      error.status = response.status
      error.details = data.details || null
      throw error
    }

    return data
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error(`Unable to connect to Mimi Sports API at ${API_BASE_URL}. Please check if the PHP server is running.`)
    }
    throw err
  }
}

/**
 * Check backend API health & database connectivity
 */
export async function checkHealth() {
  return request('/health.php')
}

/**
 * Get products list from PHP MySQL backend
 */
export async function fetchProducts(params = {}) {
  const query = new URLSearchParams()

  if (params.sport && params.sport !== 'all') query.append('sport', params.sport)
  if (params.category && params.category !== 'all') query.append('category', params.category)
  if (params.brand && params.brand !== 'all') query.append('brand', params.brand)
  if (params.search && params.search.trim()) query.append('search', params.search.trim())
  if (params.featured !== undefined && params.featured !== 'all') query.append('featured', String(params.featured))
  if (params.inStock !== undefined && params.inStock !== 'all') query.append('in_stock', String(params.inStock))
  if (params.sort) query.append('sort', params.sort)
  if (params.page) query.append('page', String(params.page))
  if (params.limit !== undefined) query.append('limit', String(params.limit))

  const queryString = query.toString()
  const endpoint = `/products/list.php${queryString ? '?' + queryString : ''}`

  const response = await request(endpoint)
  return response.products || []
}

/**
 * Get single product details by ID
 */
export async function fetchProductById(id) {
  if (!id) return null
  const response = await request(`/products/get.php?id=${encodeURIComponent(id)}`)
  return response.product || null
}

/**
 * Create a new product record in MySQL via PHP API
 */
export async function createProduct(productData) {
  const response = await request('/products/create.php', {
    method: 'POST',
    body: productData,
  })
  return response.product
}

export async function uploadProductImage(file, sport) {
  const formData = new FormData()
  formData.append('image', file)
  formData.append('sport', sport)

  const response = await fetch(`${API_BASE_URL}/products/upload-image.php`, {
    method: 'POST',
    credentials: 'include',
    headers: { Accept: 'application/json' },
    body: formData,
  })

  const data = await response.json()
  if (!response.ok || data.success === false) {
    throw new Error(data.message || `Image upload failed with status ${response.status}`)
  }

  return data.image
}

/**
 * Update existing product record in MySQL via PHP API
 */
export async function updateProduct(id, patchData) {
  const response = await request(`/products/update.php?id=${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: patchData,
  })
  return response.product
}

/**
 * Delete product from MySQL via PHP API
 */
export async function deleteProduct(id) {
  const response = await request(`/products/delete.php?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
  return response
}

/**
 * Bulk import multiple products via PHP transaction
 */
export async function bulkImportProducts(products) {
  const response = await request('/products/bulk-import.php', {
    method: 'POST',
    body: { products },
  })
  return response
}

/**
 * Admin Login endpoint call
 */
export async function loginAdmin(email, password) {
  const response = await request('/auth/login.php', {
    method: 'POST',
    body: { email, password },
  })
  return response.admin
}

/**
 * Admin Logout endpoint call
 */
export async function logoutAdmin() {
  return request('/auth/logout.php', {
    method: 'POST',
  })
}

/**
 * Get current authenticated Admin user
 */
export async function getCurrentAdmin() {
  const response = await request('/auth/me.php')
  return response.admin
}

/**
 * Place a new customer order via PHP MySQL API
 */
export async function createOrder(orderPayload) {
  const response = await request('/orders/create.php', {
    method: 'POST',
    body: orderPayload,
  })
  return response.order
}

export async function createPaymentOrder(orderNumber, email = '') {
  const response = await request('/payments/create-order.php', {
    method: 'POST',
    body: { order_number: orderNumber, email },
  })
  return response
}

export async function verifyPayment(paymentData) {
  const response = await request('/payments/verify.php', {
    method: 'POST',
    body: paymentData,
  })
  return response
}

export async function completeDemoPayment(orderNumber, email = '') {
  const response = await request('/payments/complete-demo.php', {
    method: 'POST',
    body: { order_number: orderNumber, email },
  })
  return response
}

/**
 * Fetch order details by order number or ID (Customer lookup)
 */
export async function fetchOrderDetails(orderNumber) {
  if (!orderNumber) return null
  const response = await request(`/orders/get.php?order_number=${encodeURIComponent(orderNumber)}`)
  return response.order || null
}

/**
 * Fetch admin order list with search, filters & statistics
 */
export async function fetchAdminOrders(params = {}) {
  const query = new URLSearchParams()
  if (params.search && params.search.trim()) query.append('search', params.search.trim())
  if (params.status && params.status !== 'all') query.append('status', params.status)

  const queryString = query.toString()
  const endpoint = `/admin/orders/list.php${queryString ? '?' + queryString : ''}`

  const response = await request(endpoint)
  return {
    orders: response.orders || [],
    stats: response.stats || {},
  }
}

/**
 * Fetch admin dashboard summary and sales analytics from MySQL.
 */
export async function fetchAdminDashboardSummary(params = {}) {
  const query = new URLSearchParams()
  if (params.range) query.append('range', params.range)
  if (params.start_date) query.append('start_date', params.start_date)
  if (params.end_date) query.append('end_date', params.end_date)

  const queryString = query.toString()
  const endpoint = `/admin/dashboard/summary.php${queryString ? '?' + queryString : ''}`
  const response = await request(endpoint)
  return response
}

/**
 * Fetch full admin order detail by ID or Order Number
 */
export async function fetchAdminOrderDetail(id) {
  if (!id) return null
  const response = await request(`/admin/orders/get.php?id=${encodeURIComponent(id)}`)
  return response.order || null
}

/**
 * Update order status (Admin protected)
 */
export async function updateAdminOrderStatus(id, newStatus) {
  const response = await request(`/admin/orders/update-status.php?id=${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: { status: newStatus },
  })
  return response
}

/**
 * Customer Registration endpoint call
 */
export async function registerCustomer(name, email, password, phone = '') {
  const response = await request('/customer-auth/register.php', {
    method: 'POST',
    body: { name, email, password, phone },
  })
  return response.customer
}

/**
 * Customer Login endpoint call
 */
export async function loginCustomer(email, password) {
  const response = await request('/customer-auth/login.php', {
    method: 'POST',
    body: { email, password },
  })
  return response.customer
}

/**
 * Customer Logout endpoint call
 */
export async function logoutCustomer() {
  return request('/customer-auth/logout.php', {
    method: 'POST',
  })
}

/**
 * Get current authenticated Customer account
 */
export async function getCurrentCustomer() {
  const response = await request('/customer-auth/me.php')
  return response.customer
}

/**
 * Update Customer profile details
 */
export async function updateCustomerProfile(profileData) {
  const response = await request('/customer-auth/profile.php', {
    method: 'PUT',
    body: profileData,
  })
  return response.customer
}

/**
 * Fetch Customer order history list
 */
export async function fetchCustomerOrders() {
  const response = await request('/customer-orders/list.php')
  return response.orders || []
}

/**
 * Fetch Customer order detail by order number
 */
export async function fetchCustomerOrderDetail(orderNumber) {
  if (!orderNumber) return null
  const response = await request(`/customer-orders/get.php?order_number=${encodeURIComponent(orderNumber)}`)
  return response.order || null
}

export async function fetchWishlist() {
  const response = await request('/customer-wishlist/list.php')
  return response.items || []
}

export async function addWishlistItem(productId) {
  return request('/customer-wishlist/add.php', {
    method: 'POST',
    body: { product_id: productId },
  })
}

export async function removeWishlistItem(productId) {
  return request('/customer-wishlist/remove.php', {
    method: 'DELETE',
    body: { product_id: productId },
  })
}

export async function fetchProductReviews(productId) {
  const response = await request(`/product-reviews/list.php?product_id=${encodeURIComponent(productId)}`)
  return response
}

export async function createProductReview(productId, rating, reviewText) {
  return request('/product-reviews/create.php', {
    method: 'POST',
    body: { product_id: productId, rating, review_text: reviewText },
  })
}

export async function updateProductReview(reviewId, rating, reviewText) {
  return request(`/product-reviews/update.php?id=${encodeURIComponent(reviewId)}`, {
    method: 'PUT',
    body: { rating, review_text: reviewText },
  })
}

export async function deleteProductReview(reviewId) {
  return request(`/product-reviews/delete.php?id=${encodeURIComponent(reviewId)}`, {
    method: 'DELETE',
  })
}

export async function fetchAdminReviews(params = {}) {
  const query = new URLSearchParams()
  if (params.search && params.search.trim()) query.append('search', params.search.trim())
  if (params.rating && params.rating !== 'all') query.append('rating', String(params.rating))
  const queryString = query.toString()
  const response = await request(`/admin/reviews/list.php${queryString ? `?${queryString}` : ''}`)
  return response.reviews || []
}

export async function deleteAdminReview(reviewId) {
  return request(`/admin/reviews/delete.php?id=${encodeURIComponent(reviewId)}`, {
    method: 'DELETE',
  })
}

export { API_BASE_URL }



