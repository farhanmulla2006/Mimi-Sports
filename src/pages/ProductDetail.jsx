import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Star, ArrowLeft, AlertCircle, ShoppingCart, Zap, Heart } from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import PageHeader from '../components/PageHeader.jsx'
import { getProductByIdAsync } from '../data/productStore.js'
import { useCart } from '../context/CartContext.jsx'
import { useWishlist } from '../context/WishlistContext.jsx'
import ProductReviews from '../components/ProductReviews.jsx'
import ProductImage from '../components/ProductImage.jsx'
import './ProductDetail.css'

function ProductDetail() {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedImage, setSelectedImage] = useState('')
  const [quantity, setQuantity] = useState(1)
  const { addToCart, startBuyNow } = useCart()
  const { isWishlisted, toggleWishlist, busyIds } = useWishlist()
  const navigate = useNavigate()
  const [reviewSummary, setReviewSummary] = useState({ average_rating: 0, review_count: 0 })

  useEffect(() => {
    window.scrollTo(0, 0)
    let isMounted = true

    const loadDetail = async () => {
      setLoading(true)
      setError(null)
      try {
        const item = await getProductByIdAsync(id)
        if (isMounted) {
          setProduct(item)
          if (item) {
            const primary = item.image || (item.images && item.images[0]) || ''
            setSelectedImage(primary)
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load product details.')
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadDetail()
    return () => { isMounted = false }
  }, [id])

  if (loading) {
    return (
      <>
        <Navbar />
        <main>
          <PageHeader
            title="Loading Product..."
            breadcrumbItems={[{ label: 'Home', href: '/' }, { label: 'Products', href: '/products' }, { label: 'Loading' }]}
          />
          <div className="container" style={{ padding: '64px 32px', textAlign: 'center', color: '#6B7280' }}>
            Loading product details from Mimi Sports API...
          </div>
        </main>
        <Footer />
      </>
    )
  }

  if (error || !product) {
    return (
      <>
        <Navbar />
        <main>
          <PageHeader
            title="Product Not Found"
            breadcrumbItems={[{ label: 'Home', href: '/' }, { label: 'Products', href: '/products' }, { label: 'Not Found' }]}
          />
          <div className="container" style={{ padding: '64px 32px', textAlign: 'center' }}>
            {error && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                background: '#FEE2E2',
                color: '#991B1B',
                borderRadius: '8px',
                marginBottom: '24px',
                fontSize: '14px',
              }}>
                <AlertCircle size={18} /> {error}
              </div>
            )}
            <div>
              <Link to="/products" className="btn btn-dark">Back to Products</Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  const imageGallery = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : product.image
      ? [product.image]
      : []

  const activeImage = selectedImage || product.image || (imageGallery[0] || '')

  return (
    <>
      <Navbar />
      <main>
        <PageHeader
          breadcrumbItems={[
            { label: 'Home', href: '/' },
            { label: 'Products', href: '/products' },
            { label: product.name },
          ]}
          title={product.name}
        />

        <section className="section">
          <div className="container">
            <Link to="/products" className="pdp-back">
              <ArrowLeft size={16} /> Back to all products
            </Link>

            <div className="pdp-layout">
              <div className="pdp-media-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="pdp-media">
                  <ProductImage src={activeImage} alt={product.name} />
                </div>

                {imageGallery.length > 1 && (
                  <div className="pdp-thumbnails" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {imageGallery.map((imgUrl, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImage(imgUrl)}
                        style={{
                          border: activeImage === imgUrl ? '2px solid #FF5A1F' : '1px solid #E5E7EB',
                          borderRadius: '6px',
                          padding: '2px',
                          background: 'none',
                          cursor: 'pointer',
                          width: '64px',
                          height: '64px',
                          overflow: 'hidden',
                        }}
                      >
                        <ProductImage
                          src={imgUrl}
                          alt={`${product.name} view ${idx + 1}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="pdp-info">
                <span className="product-card__brand">{product.brand}</span>
                <h2 className="pdp-name">{product.name}</h2>

                <div className="product-card__rating" style={{ margin: '10px 0' }}>
                  <strong>
                    <Star size={13} fill="#FF5A1F" color="#FF5A1F" /> {Number(reviewSummary.review_count ? reviewSummary.average_rating : product.rating || 0).toFixed(1)}
                  </strong>
                  ({reviewSummary.review_count || product.reviewCount || product.reviews || 0} reviews)
                </div>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={async () => {
                    try {
                      await toggleWishlist(product.id)
                    } catch (err) {
                      window.alert(err.message || 'Please log in to use your wishlist.')
                    }
                  }}
                  disabled={busyIds.has(product.id)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 14 }}
                >
                  <Heart size={17} fill={isWishlisted(product.id) ? '#FF5A1F' : 'none'} color={isWishlisted(product.id) ? '#FF5A1F' : 'currentColor'} />
                  {isWishlisted(product.id) ? 'Wishlisted' : 'Add to Wishlist'}
                </button>

                <div className="product-card__price" style={{ marginBottom: 4 }}>
                  <span className="product-card__price-current">
                    ₹{Number(product.price || 0).toLocaleString('en-IN')}
                  </span>
                  {(product.originalPrice || product.original_price) > product.price && (
                    <span className="product-card__price-original">
                      ₹{Number(product.originalPrice || product.original_price).toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
                {product.discount > 0 && (
                  <span className="product-card__price-discount">{product.discount}% off</span>
                )}

                <p className="pdp-description">{product.description}</p>

                <div className="pdp-meta">
                  {Array.isArray(product.sizes) && product.sizes.length > 0 && (
                    <div><strong>Sizes:</strong> {product.sizes.join(', ')}</div>
                  )}
                  {Array.isArray(product.colors) && product.colors.length > 0 && (
                    <div><strong>Colors:</strong> {product.colors.join(', ')}</div>
                  )}
                  <div><strong>Skill Level:</strong> {product.skillLevel || 'Beginner'}</div>
                  <div><strong>Usage:</strong> {product.usage || 'Training'}</div>
                  <div>
                    <strong>Availability: </strong>
                    <span style={{ color: product.stock ? '#10B981' : '#EF4444', fontWeight: 700 }}>
                      {product.stock ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </div>
                </div>

                {product.stock !== false && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '24px' }}>
                    <div className="cart-qty-selector">
                      <button
                        className="cart-qty-btn"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        disabled={quantity <= 1}
                      >
                        -
                      </button>
                      <span className="cart-qty-val">{quantity}</span>
                      <button
                        className="cart-qty-btn"
                        onClick={() => setQuantity((q) => Math.min(typeof product.stock === 'number' ? product.stock : 99, q + 1))}
                        disabled={typeof product.stock === 'number' && quantity >= product.stock}
                      >
                        +
                      </button>
                    </div>

                    <button
                      className="btn btn-primary"
                      onClick={() => addToCart(product.id, quantity)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                    >
                      <ShoppingCart size={18} /> Add to Cart
                    </button>
                    <button
                      className="btn btn-dark"
                      onClick={() => {
                        if (startBuyNow(product.id, quantity)) navigate('/checkout')
                      }}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                    >
                      <Zap size={18} /> Buy Now
                    </button>
                  </div>
                )}
                {product.stock === false && (
                  <button className="btn" disabled style={{ marginTop: 24, background: '#9CA3AF', color: '#FFF', cursor: 'not-allowed' }}>
                    Out of Stock
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
        <ProductReviews productId={product.id} onSummaryChange={setReviewSummary} />
      </main>
      <Footer />
    </>
  )
}

export default ProductDetail
