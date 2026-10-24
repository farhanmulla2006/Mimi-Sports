// src/context/CartContext.jsx
// React Cart Context for managing shopping cart state, stock validation & localStorage persistence

import { createContext, useContext, useState, useEffect, useMemo } from 'react'
import { getProductById, getAllProducts, loadProducts } from '../data/productStore.js'

const CART_STORAGE_KEY = 'mimi_sports_cart'
const BUY_NOW_STORAGE_KEY = 'mimi_sports_buy_now'
const CartContext = createContext(null)

function readBuyNow() {
  if (typeof window === 'undefined') return null
  try {
    const saved = sessionStorage.getItem(BUY_NOW_STORAGE_KEY)
    return saved ? JSON.parse(saved) : null
  } catch {
    return null
  }
}

export function CartProvider({ children }) {
  // Store minimal cart items: [{ id: 'cricket-1', quantity: 2 }]
  const [cart, setCart] = useState(() => {
    if (typeof window === 'undefined') return []
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          return parsed.filter((item) => item && item.id && item.quantity > 0)
        }
      }
    } catch (e) {
      console.error('Failed to parse cart from localStorage:', e)
    }
    return []
  })

  const [products, setProducts] = useState(() => getAllProducts())
  const [notification, setNotification] = useState(null)
  const [buyNow, setBuyNow] = useState(readBuyNow)

  // Ensure products are loaded from API to enrich cart
  useEffect(() => {
    loadProducts()
      .then((list) => setProducts(list))
      .catch(() => setProducts(getAllProducts()))
  }, [])

  // Persist cart to localStorage on changes
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
    } catch (e) {
      console.error('Failed to save cart to localStorage:', e)
    }
  }, [cart])

  const showToast = (message, type = 'info') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3500)
  }

  // Enriched cart items with fresh product details
  const cartItems = useMemo(() => {
    return cart
      .map((item) => {
        const product = products.find((p) => String(p.id) === String(item.id)) || getProductById(item.id)
        if (!product) return null
        return {
          id: item.id,
          quantity: item.quantity,
          product,
          unitPrice: Number(product.price || 0),
          subtotal: item.quantity * Number(product.price || 0),
        }
      })
      .filter(Boolean)
  }, [cart, products])

  const buyNowItems = useMemo(() => {
    if (!buyNow?.id || !buyNow.quantity) return []
    const product = products.find((p) => String(p.id) === String(buyNow.id)) || getProductById(buyNow.id)
    if (!product) return []
    const unitPrice = Number(product.price || 0)
    return [{
      id: buyNow.id,
      quantity: buyNow.quantity,
      product,
      unitPrice,
      subtotal: buyNow.quantity * unitPrice,
    }]
  }, [buyNow, products])

  const cartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
  }, [cart])

  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.subtotal, 0)
  }, [cartItems])

  const shippingCharge = useMemo(() => {
    if (subtotal === 0) return 0
    return subtotal >= 999 ? 0 : 99
  }, [subtotal])

  const grandTotal = useMemo(() => {
    return subtotal + shippingCharge
  }, [subtotal, shippingCharge])

  const buyNowSubtotal = useMemo(() => buyNowItems.reduce((sum, item) => sum + item.subtotal, 0), [buyNowItems])
  const buyNowShippingCharge = buyNowSubtotal === 0 ? 0 : buyNowSubtotal >= 999 ? 0 : 99
  const buyNowGrandTotal = buyNowSubtotal + buyNowShippingCharge

  const addToCart = (productId, qtyToAdd = 1) => {
    const product = products.find((p) => String(p.id) === String(productId)) || getProductById(productId)
    if (!product) {
      showToast('Product not found.', 'error')
      return false
    }

    if (product.stock === false) {
      showToast(`Sorry, "${product.name}" is currently out of stock.`, 'error')
      return false
    }

    const existingIndex = cart.findIndex((item) => String(item.id) === String(productId))
    const currentQty = existingIndex !== -1 ? cart[existingIndex].quantity : 0
    const newQty = currentQty + qtyToAdd

    // Stock limit validation (if product has numeric stock, otherwise boolean true = available)
    const maxStock = typeof product.stock === 'number' ? product.stock : 99
    if (newQty > maxStock) {
      showToast(`Cannot add more. Maximum available stock reached (${maxStock}).`, 'warning')
      return false
    }

    if (existingIndex !== -1) {
      const updated = [...cart]
      updated[existingIndex] = { ...updated[existingIndex], quantity: newQty }
      setCart(updated)
    } else {
      setCart([...cart, { id: String(productId), quantity: qtyToAdd }])
    }

    showToast(`Added "${product.name}" to your cart!`, 'success')
    return true
  }

  const updateQuantity = (productId, newQuantity) => {
    const qty = Number(newQuantity)
    if (qty <= 0) {
      removeFromCart(productId)
      return
    }

    const product = products.find((p) => String(p.id) === String(productId)) || getProductById(productId)
    const maxStock = product && typeof product.stock === 'number' ? product.stock : 99

    if (qty > maxStock) {
      showToast(`Maximum available stock reached (${maxStock}).`, 'warning')
      return
    }

    setCart((prev) =>
      prev.map((item) => (String(item.id) === String(productId) ? { ...item, quantity: qty } : item))
    )
  }

  const removeFromCart = (productId) => {
    const product = products.find((p) => String(p.id) === String(productId)) || getProductById(productId)
    setCart((prev) => prev.filter((item) => String(item.id) !== String(productId)))
    if (product) {
      showToast(`Removed "${product.name}" from cart.`, 'info')
    }
  }

  const clearCart = () => {
    setCart([])
  }

  const startBuyNow = (productId, quantity = 1) => {
    const product = products.find((p) => String(p.id) === String(productId)) || getProductById(productId)
    const qty = Number(quantity)
    const maxStock = product && typeof product.stock === 'number' ? product.stock : 99
    if (!product || product.stock === false) {
      showToast('Sorry, this product is currently out of stock.', 'error')
      return false
    }
    if (!Number.isInteger(qty) || qty < 1 || qty > maxStock) {
      showToast(`Quantity unavailable. Maximum available stock is ${maxStock}.`, 'warning')
      return false
    }
    const nextBuyNow = { id: String(productId), quantity: qty }
    setBuyNow(nextBuyNow)
    sessionStorage.setItem(BUY_NOW_STORAGE_KEY, JSON.stringify(nextBuyNow))
    return true
  }

  const clearBuyNow = () => {
    setBuyNow(null)
    sessionStorage.removeItem(BUY_NOW_STORAGE_KEY)
  }

  return (
    <CartContext.Provider
      value={{
        cart,
        cartItems,
        buyNowItems,
        cartCount,
        subtotal,
        shippingCharge,
        grandTotal,
        buyNow,
        buyNowSubtotal,
        buyNowShippingCharge,
        buyNowGrandTotal,
        notification,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        startBuyNow,
        clearBuyNow,
        showToast,
      }}
    >
      {children}
      {notification && (
        <div className={`cart-toast cart-toast--${notification.type}`}>
          <span>{notification.message}</span>
        </div>
      )}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
