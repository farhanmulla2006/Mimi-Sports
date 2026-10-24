import { createContext, useContext, useEffect, useState } from 'react'
import { addWishlistItem, fetchWishlist, removeWishlistItem } from '../services/api.js'
import { useCustomerAuth } from './CustomerAuthContext.jsx'

const WishlistContext = createContext(null)

export function WishlistProvider({ children }) {
  const { customer } = useCustomerAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [busyIds, setBusyIds] = useState(() => new Set())
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    if (!customer) {
      setItems([])
      setError('')
      return undefined
    }

    setLoading(true)
    fetchWishlist()
      .then((wishlist) => {
        if (active) setItems(wishlist)
      })
      .catch((err) => {
        if (active && err.status !== 401) setError(err.message || 'Unable to load wishlist.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [customer])

  const isWishlisted = (productId) => items.some((item) => String(item.id) === String(productId))

  const toggleWishlist = async (productId) => {
    if (!customer) {
      const authError = new Error('Please log in to use your wishlist.')
      authError.status = 401
      throw authError
    }
    if (busyIds.has(productId)) return false

    setError('')
    setBusyIds((current) => new Set(current).add(productId))
    try {
      if (isWishlisted(productId)) {
        await removeWishlistItem(productId)
        setItems((current) => current.filter((item) => String(item.id) !== String(productId)))
        return false
      }
      await addWishlistItem(productId)
      const wishlist = await fetchWishlist()
      setItems(wishlist)
      return true
    } catch (err) {
      setError(err.message || 'Unable to update wishlist.')
      throw err
    } finally {
      setBusyIds((current) => {
        const next = new Set(current)
        next.delete(productId)
        return next
      })
    }
  }

  const removeItem = async (productId) => {
    if (busyIds.has(productId)) return
    setBusyIds((current) => new Set(current).add(productId))
    try {
      await removeWishlistItem(productId)
      setItems((current) => current.filter((item) => String(item.id) !== String(productId)))
    } finally {
      setBusyIds((current) => {
        const next = new Set(current)
        next.delete(productId)
        return next
      })
    }
  }

  return (
    <WishlistContext.Provider value={{
      items,
      count: items.length,
      loading,
      error,
      busyIds,
      isWishlisted,
      toggleWishlist,
      removeItem,
    }}>
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const context = useContext(WishlistContext)
  if (!context) throw new Error('useWishlist must be used within a WishlistProvider')
  return context
}