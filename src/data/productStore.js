// src/data/productStore.js
// Product data store connected to PHP + MySQL REST API Backend

import { products as catalogFromFile, SPORT_META } from './products.js'
import * as api from '../services/api.js'

const CHANGE_EVENT = 'mimi-sports-products-changed'

// In-memory cache populated from MySQL API
let cacheProducts = []
let isInitialized = false
let lastFetchError = null

function notifyProductChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(CHANGE_EVENT))
  }
}

export function subscribeToProductChanges(callback) {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener(CHANGE_EVENT, callback)
  return () => window.removeEventListener(CHANGE_EVENT, callback)
}

/**
 * Fetch products from PHP MySQL API backend into cache.
 * Returns array of products.
 */
export async function loadProducts(params = {}) {
  try {
    const list = await api.fetchProducts(params)
    if (Array.isArray(list)) {
      cacheProducts = list
      isInitialized = true
      lastFetchError = null
      notifyProductChange()
      return list
    }
  } catch (err) {
    console.error('Failed to load products from PHP API:', err)
    lastFetchError = err
    throw err
  }
  return cacheProducts
}

/**
 * Get cached products synchronously.
 * If cache is not yet initialized, falls back to static catalog.
 */
export function getAllProducts() {
  if (cacheProducts.length > 0 || isInitialized) {
    return cacheProducts
  }
  return Array.isArray(catalogFromFile) ? catalogFromFile : []
}

/**
 * Get last fetch error if any occurred
 */
export function getLastError() {
  return lastFetchError
}

/**
 * Fetch product by ID from API or cache
 */
export async function getProductByIdAsync(id) {
  if (id == null || id === '') return null
  const wanted = decodeURIComponent(String(id))

  // Try cache first
  const cached = cacheProducts.find((p) => String(p.id) === wanted)
  if (cached) return cached

  // Fetch directly from API
  try {
    const product = await api.fetchProductById(wanted)
    if (product) {
      // Update cache
      const idx = cacheProducts.findIndex((p) => String(p.id) === wanted)
      if (idx !== -1) {
        cacheProducts[idx] = product
      } else {
        cacheProducts.push(product)
      }
      notifyProductChange()
      return product
    }
  } catch (err) {
    console.error(`Failed to fetch product ${wanted} from API:`, err)
  }
  return null
}

/**
 * Synchronous getProductById (reads from cache or fallback)
 */
export function getProductById(id) {
  if (id == null || id === '') return null
  const wanted = decodeURIComponent(String(id))
  const found = getAllProducts().find((p) => String(p.id) === wanted)
  return found || null
}

export function isLocallyAdded(id) {
  // Backwards compatibility helper
  return false
}

export function hasLocalChange(id) {
  // Backwards compatibility helper
  return false
}

/**
 * Generate next sequential ID for a sport
 */
export function generateNextId(sportId) {
  const all = getAllProducts()
  const prefix = `${sportId}-`
  let max = 0
  for (const p of all) {
    if (p.id && p.id.startsWith(prefix)) {
      const suffix = p.id.slice(prefix.length)
      const n = parseInt(suffix, 10)
      if (!Number.isNaN(n) && n > max) max = n
    }
  }
  return `${prefix}${max + 1}`
}

export function idExists(id) {
  return getAllProducts().some((p) => p.id === id)
}

/**
 * Add a new product to MySQL database via PHP API
 */
export async function addProductAsync(product) {
  const created = await api.createProduct(product)
  cacheProducts.unshift(created)
  notifyProductChange()
  return created
}

/**
 * Sync addProduct wrapper
 */
export function addProduct(product) {
  addProductAsync(product).catch((err) => {
    console.error('Async addProduct failed:', err)
  })
}

/**
 * Update an existing product in MySQL database via PHP API
 */
export async function updateProductAsync(id, patch) {
  const updated = await api.updateProduct(id, patch)
  const idx = cacheProducts.findIndex((p) => String(p.id) === String(id))
  if (idx !== -1) {
    cacheProducts[idx] = updated
  } else {
    cacheProducts.unshift(updated)
  }
  notifyProductChange()
  return updated
}

/**
 * Sync updateProduct wrapper
 */
export function updateProduct(id, patch) {
  updateProductAsync(id, patch).catch((err) => {
    console.error('Async updateProduct failed:', err)
  })
}

/**
 * Delete a product from MySQL database via PHP API
 */
export async function deleteProductAsync(id) {
  await api.deleteProduct(id)
  cacheProducts = cacheProducts.filter((p) => String(p.id) !== String(id))
  notifyProductChange()
}

/**
 * Sync deleteProduct wrapper
 */
export function deleteProduct(id) {
  deleteProductAsync(id).catch((err) => {
    console.error('Async deleteProduct failed:', err)
  })
}

export function resetAllOverrides() {
  // Deprecated localStorage reset helper — reload catalog from API
  loadProducts().catch(() => {})
}

export { SPORT_META }
