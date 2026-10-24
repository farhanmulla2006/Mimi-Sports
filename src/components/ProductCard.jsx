import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Heart, Star, ShoppingCart, Check, Zap } from 'lucide-react'
import { useCart } from '../context/CartContext.jsx'
import { useWishlist } from '../context/WishlistContext.jsx'
import ProductImage from './ProductImage.jsx'

function ProductCard({ product }) {
  const [added, setAdded] = useState(false)
  const { addToCart, startBuyNow } = useCart()
  const { isWishlisted, toggleWishlist, busyIds } = useWishlist()
  const navigate = useNavigate()

  const handleAddToCart = () => {
    const success = addToCart(product.id, 1)
    if (success) {
      setAdded(true)
      setTimeout(() => setAdded(false), 1500)
    }
  }

  const handleBuyNow = () => {
    if (startBuyNow(product.id, 1)) navigate('/checkout')
  }

  const isOutOfStock = product.stock === false
  const wishlisted = isWishlisted(product.id)

  const handleWishlist = async (event) => {
    event.preventDefault()
    event.stopPropagation()
    try {
      await toggleWishlist(product.id)
    } catch (error) {
      window.alert(error.message || 'Please log in to use your wishlist.')
    }
  }

  return (
    <div className="product-card">
      <div className="product-card__media">
        {product.discount > 0 && (
          <span className="product-card__discount">{product.discount}% OFF</span>
        )}
        <button
          className={`product-card__wishlist ${wishlisted ? 'is-active' : ''}`}
          aria-label="Toggle wishlist"
          aria-pressed={wishlisted}
          onClick={handleWishlist}
          disabled={busyIds.has(product.id)}
        >
          <Heart size={16} fill={wishlisted ? '#FF5A1F' : 'none'} strokeWidth={2} />
        </button>
        <Link to={`/products/${product.id}`} className="product-card__image-link">
          <ProductImage src={product.image} alt={product.name} loading="lazy" />
        </Link>
      </div>

      <div className="product-card__body">
        <span className="product-card__brand">{product.brand}</span>
        <Link to={`/products/${product.id}`} className="product-card__name-link">
          <h3 className="product-card__name">{product.name}</h3>
        </Link>

        <div className="product-card__rating">
          <strong>
            <Star size={13} fill="#FF5A1F" color="#FF5A1F" /> {Number(product.rating || 0).toFixed(1)}
          </strong>
          ({product.reviewCount || product.reviews || 0} reviews)
        </div>

        <div className="product-card__price">
          <span className="product-card__price-current">₹{Number(product.price || 0).toLocaleString('en-IN')}</span>
          {(product.originalPrice || product.original_price) > product.price && (
            <span className="product-card__price-original">
              ₹{Number(product.originalPrice || product.original_price).toLocaleString('en-IN')}
            </span>
          )}
        </div>
        {product.discount > 0 && (
          <span className="product-card__price-discount">{product.discount}% off</span>
        )}

        <button
          className={`product-card__cta ${added ? 'is-added' : ''}`}
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          style={isOutOfStock ? { opacity: 0.6, cursor: 'not-allowed', background: '#9CA3AF' } : {}}
        >
          {added ? (
            <>
              <Check size={15} /> Added!
            </>
          ) : isOutOfStock ? (
            'Out of Stock'
          ) : (
            <>
              <ShoppingCart size={15} /> Add to Cart
            </>
          )}
        </button>
        {!isOutOfStock && (
          <button className="product-card__cta" onClick={handleBuyNow}>
            <Zap size={15} /> Buy Now
          </button>
        )}
      </div>
    </div>
  )
}

export default ProductCard
