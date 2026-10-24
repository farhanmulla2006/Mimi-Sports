import { useMemo, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, PlusCircle, Pencil, Trash2, Star, AlertCircle } from 'lucide-react'
import { loadProducts, getAllProducts, deleteProductAsync, subscribeToProductChanges } from '../../data/productStore.js'
import { SPORT_META, BRAND_LIST } from '../../data/products.js'
import DeleteConfirmModal from './DeleteConfirmModal.jsx'

const SORT_OPTIONS = [
  { id: 'name-asc', label: 'Name (A–Z)' },
  { id: 'price-asc', label: 'Price: Low to High' },
  { id: 'price-desc', label: 'Price: High to Low' },
  { id: 'stock', label: 'Stock (In Stock first)' },
  { id: 'rating', label: 'Rating' },
]

function AdminProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [search, setSearch] = useState('')
  const [sportFilter, setSportFilter] = useState('all')
  const [brandFilter, setBrandFilter] = useState('all')
  const [stockFilter, setStockFilter] = useState('all')
  const [featuredFilter, setFeaturedFilter] = useState('all')
  const [sort, setSort] = useState('name-asc')
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fetchProductsList = async () => {
    setLoading(true)
    try {
      const list = await loadProducts()
      setProducts(list)
      setError(null)
    } catch (err) {
      console.error('Failed to load admin products list:', err)
      setError(err.message || 'Failed to connect to Mimi Sports API.')
      setProducts(getAllProducts())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    document.title = 'Admin — Products'
    fetchProductsList()
    const unsubscribe = subscribeToProductChanges(() => {
      setProducts(getAllProducts())
    })
    return () => unsubscribe()
  }, [])

  const filtered = useMemo(() => {
    let list = products.filter((p) => {
      if (sportFilter !== 'all' && p.sport !== sportFilter) return false
      if (brandFilter !== 'all' && p.brand !== brandFilter) return false
      if (stockFilter === 'in' && !p.stock) return false
      if (stockFilter === 'out' && p.stock) return false
      if (featuredFilter === 'yes' && !p.featured) return false
      if (featuredFilter === 'no' && p.featured) return false
      if (search.trim()) {
        const q = search.trim().toLowerCase()
        const haystack = `${p.name} ${p.brand} ${p.id}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })

    switch (sort) {
      case 'price-asc': list = [...list].sort((a, b) => a.price - b.price); break
      case 'price-desc': list = [...list].sort((a, b) => b.price - a.price); break
      case 'stock': list = [...list].sort((a, b) => Number(b.stock) - Number(a.stock)); break
      case 'rating': list = [...list].sort((a, b) => b.rating - a.rating); break
      default: list = [...list].sort((a, b) => a.name.localeCompare(b.name))
    }
    return list
  }, [products, search, sportFilter, brandFilter, stockFilter, featuredFilter, sort])

  const handleDeleteConfirmed = async () => {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      await deleteProductAsync(pendingDelete.id)
      setPendingDelete(null)
      await fetchProductsList()
    } catch (err) {
      alert(`Delete failed: ${err.message}`)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <div className="admin-page__header">
        <div>
          <h1 className="admin-page__title">Products</h1>
          <p className="admin-page__sub">{filtered.length} of {products.length} products</p>
        </div>
        <Link to="/admin/products/new" className="admin-btn admin-btn-primary">
          <PlusCircle size={16} /> Add Product
        </Link>
      </div>

      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 16px',
          background: '#FEE2E2',
          border: '1px solid #FCA5A5',
          color: '#991B1B',
          borderRadius: '8px',
          marginBottom: '20px',
          fontSize: '14px',
        }}>
          <AlertCircle size={18} color="#DC2626" />
          <span>{error}</span>
        </div>
      )}

      <div className="admin-panel">
        <div className="admin-toolbar">
          <div className="admin-toolbar__search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by name, brand, or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select className="admin-select" value={sportFilter} onChange={(e) => setSportFilter(e.target.value)}>
            <option value="all">All Sports</option>
            {SPORT_META.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          <select className="admin-select" value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)}>
            <option value="all">All Brands</option>
            {BRAND_LIST.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>

          <select className="admin-select" value={stockFilter} onChange={(e) => setStockFilter(e.target.value)}>
            <option value="all">All Stock</option>
            <option value="in">In Stock</option>
            <option value="out">Out of Stock</option>
          </select>

          <select className="admin-select" value={featuredFilter} onChange={(e) => setFeaturedFilter(e.target.value)}>
            <option value="all">Featured: All</option>
            <option value="yes">Featured Only</option>
            <option value="no">Not Featured</option>
          </select>

          <select className="admin-select" value={sort} onChange={(e) => setSort(e.target.value)}>
            {SORT_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="admin-empty">Loading products from MySQL database...</div>
        ) : products.length === 0 ? (
          <div className="admin-empty">No products found in database.</div>
        ) : filtered.length === 0 ? (
          <div className="admin-empty">No products match these filters.</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Sport</th>
                  <th>Brand</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Rating</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="admin-table__product">
                        <img className="admin-table__thumb" src={p.image} alt={p.name} />
                        <div>
                          <div className="admin-table__name">{p.name}</div>
                          <div className="admin-table__id">{p.id}</div>
                        </div>
                      </div>
                    </td>
                    <td>{SPORT_META.find((s) => s.id === p.sport)?.name || p.sport}</td>
                    <td>{p.brand}</td>
                    <td>₹{Number(p.price || 0).toLocaleString('en-IN')}</td>
                    <td>
                      <span className={`admin-badge ${p.stock ? 'admin-badge--in-stock' : 'admin-badge--out-stock'}`}>
                        {p.stock ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Star size={13} fill="#FF5A1F" color="#FF5A1F" /> {Number(p.rating || 0).toFixed(1)}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {p.featured && <span className="admin-badge admin-badge--featured">Featured</span>}
                      </div>
                    </td>
                    <td>
                      <div className="admin-table__actions">
                        <Link to={`/admin/products/${p.id}/edit`} className="admin-icon-btn" aria-label="Edit">
                          <Pencil size={15} />
                        </Link>
                        <button
                          className="admin-icon-btn admin-icon-btn--danger"
                          aria-label="Delete"
                          onClick={() => setPendingDelete(p)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pendingDelete && (
        <DeleteConfirmModal
          productName={pendingDelete.name}
          onCancel={() => setPendingDelete(null)}
          onConfirm={handleDeleteConfirmed}
          disabled={deleting}
        />
      )}
    </div>
  )
}

export default AdminProducts
