import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { loadProducts, getAllProducts, subscribeToProductChanges } from '../data/productStore.js'
import ProductCard from './ProductCard.jsx'

function TrendingProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchTrending = async () => {
    try {
      setLoading(true)
      const list = await loadProducts({ featured: true })
      setProducts(list.filter((p) => p.featured))
      setError(null)
    } catch (err) {
      console.error('Failed to load trending products:', err)
      setError(err.message || 'Unable to connect to Mimi Sports API.')
      // Fallback to cache/static catalog if API call fails
      setProducts(getAllProducts().filter((p) => p.featured))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTrending()
    const unsubscribe = subscribeToProductChanges(() => {
      setProducts(getAllProducts().filter((p) => p.featured))
    })
    return () => unsubscribe()
  }, [])

  return (
    <section className="section" id="trending-products" style={{ background: 'var(--color-white)' }}>
      <div className="container">
        <div className="section-head">
          <div>
            <span className="section-eyebrow">Handpicked this week</span>
            <h2 className="section-title">Trending Products</h2>
          </div>
          <Link to="/products" className="section-link">View All Products →</Link>
        </div>

        {error && (
          <div style={{ padding: '16px', background: '#FEE2E2', color: '#DC2626', borderRadius: '8px', marginBottom: '24px', fontSize: '14px' }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>
            Loading trending products...
          </div>
        ) : (
          <div className="grid-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default TrendingProducts
