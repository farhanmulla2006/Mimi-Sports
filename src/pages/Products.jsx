import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SlidersHorizontal, ArrowUpDown, AlertCircle } from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import PageHeader from '../components/PageHeader.jsx'
import SearchBar from '../components/SearchBar.jsx'
import SortDropdown, { SORT_OPTIONS } from '../components/SortDropdown.jsx'
import FilterSidebar from '../components/FilterSidebar.jsx'
import MobileFilterDrawer from '../components/MobileFilterDrawer.jsx'
import ActiveFilters from '../components/ActiveFilters.jsx'
import EmptyState from '../components/EmptyState.jsx'
import ProductCard from '../components/ProductCard.jsx'
import { SPORT_META, PRICE_RANGES } from '../data/products.js'
import { loadProducts, getAllProducts, subscribeToProductChanges } from '../data/productStore.js'
import './Products.css'

const PAGE_SIZE = 12

const DEFAULT_FILTERS = {
  sport: 'all',
  categories: [],
  brands: [],
  priceRange: null,
  minRating: null,
  minDiscount: null,
  inStockOnly: false,
}

const CATEGORY_SLUG_MAP = {
  apparel: 'Apparel',
  footwear: 'Footwear',
  equipment: 'Equipment',
  'protective-gear': 'Protective Gear',
  accessories: 'Accessories',
}

function Products() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [searchTerm, setSearchTerm] = useState('')
  const [sort, setSort] = useState('relevance')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)
  const [mobileSortOpen, setMobileSortOpen] = useState(false)

  const [productsList, setProductsList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchCatalog = async () => {
    try {
      setLoading(true)
      const data = await loadProducts()
      setProductsList(data)
      setError(null)
    } catch (err) {
      console.error('Failed to load products from API:', err)
      setError(err.message || 'Unable to connect to Mimi Sports API.')
      setProductsList(getAllProducts())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCatalog()
    const unsubscribe = subscribeToProductChanges(() => {
      setProductsList(getAllProducts())
    })
    return () => unsubscribe()
  }, [])

  // Sync filters from the URL (?sport=, ?category=)
  useEffect(() => {
    const sportParam = searchParams.get('sport')
    const categoryParam = searchParams.get('category')
    setFilters((prev) => ({
      ...prev,
      sport: sportParam || 'all',
      categories: categoryParam && CATEGORY_SLUG_MAP[categoryParam]
        ? [CATEGORY_SLUG_MAP[categoryParam]]
        : prev.categories,
    }))
    window.scrollTo(0, 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const handleFiltersChange = (next) => {
    setFilters(next)
    const params = {}
    if (next.sport !== 'all') params.sport = next.sport
    setSearchParams(params, { replace: true })
  }

  const handleClearAll = () => {
    setFilters(DEFAULT_FILTERS)
    setSearchTerm('')
    setSearchParams({}, { replace: true })
  }

  const filteredProducts = useMemo(() => {
    let list = productsList.filter((p) => {
      if (filters.sport !== 'all' && p.sport !== filters.sport) return false
      if (filters.categories.length && !filters.categories.includes(p.category)) return false
      if (filters.brands.length && !filters.brands.includes(p.brand)) return false

      if (filters.priceRange) {
        const range = PRICE_RANGES.find((r) => r.id === filters.priceRange)
        if (range && !(p.price >= range.min && p.price < range.max)) return false
      }

      if (filters.minRating && p.rating < filters.minRating) return false
      if (filters.minDiscount && p.discount < filters.minDiscount) return false
      if (filters.inStockOnly && !p.stock) return false

      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase()
        const sportLabel = (SPORT_META.find((s) => s.id === p.sport)?.name || p.sport).toLowerCase()
        const haystack = `${p.name} ${p.brand} ${sportLabel} ${p.category}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }

      return true
    })

    switch (sort) {
      case 'price-asc':
        list = [...list].sort((a, b) => a.price - b.price)
        break
      case 'price-desc':
        list = [...list].sort((a, b) => b.price - a.price)
        break
      case 'rating':
        list = [...list].sort((a, b) => b.rating - a.rating)
        break
      case 'newest':
        list = [...list].reverse()
        break
      case 'popular':
        list = [...list].sort((a, b) => (b.reviewCount || b.reviews || 0) - (a.reviewCount || a.reviews || 0))
        break
      case 'discount':
        list = [...list].sort((a, b) => b.discount - a.discount)
        break
      default:
        break
    }

    return list
  }, [productsList, filters, searchTerm, sort])

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [filters, searchTerm, sort])

  const visibleProducts = filteredProducts.slice(0, visibleCount)
  const hasMore = visibleCount < filteredProducts.length

  return (
    <>
      <Navbar />
      <main>
        <PageHeader
          eyebrow="Full catalogue"
          title="All Sports Gear"
          subtitle="Discover sportswear, equipment, footwear and accessories for every game."
          breadcrumbItems={[{ label: 'Home', href: '/' }, { label: 'Products' }]}
        >
          <div className="products-search">
            <SearchBar value={searchTerm} onChange={setSearchTerm} />
          </div>
        </PageHeader>

        <section className="section products-section">
          <div className="container">
            {error && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px',
                background: '#FEE2E2',
                border: '1px solid #FCA5A5',
                color: '#991B1B',
                borderRadius: '8px',
                marginBottom: '24px',
                fontSize: '14px',
                fontWeight: 500,
              }}>
                <AlertCircle size={20} color="#DC2626" />
                <div>
                  <strong>API Error:</strong> {error}
                </div>
              </div>
            )}

            <div className="products-layout">
              <aside className="products-sidebar">
                <FilterSidebar filters={filters} onChange={handleFiltersChange} />
              </aside>

              <div className="products-main">
                <div className="products-toolbar">
                  <span className="products-count">
                    Showing <strong>{visibleProducts.length}</strong> of <strong>{filteredProducts.length}</strong> products
                  </span>

                  <SortDropdown value={sort} onChange={setSort} className="products-toolbar__sort" />

                  <div className="products-mobile-toolbar">
                    <button className="products-mobile-btn" onClick={() => setMobileFilterOpen(true)}>
                      <SlidersHorizontal size={16} /> Filter
                    </button>
                    <button className="products-mobile-btn" onClick={() => setMobileSortOpen((v) => !v)}>
                      <ArrowUpDown size={16} /> Sort
                    </button>
                  </div>
                </div>

                {mobileSortOpen && (
                  <div className="mobile-sort-sheet">
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        className={`mobile-sort-sheet__option ${sort === opt.id ? 'is-active' : ''}`}
                        onClick={() => { setSort(opt.id); setMobileSortOpen(false) }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}

                <ActiveFilters
                  filters={filters}
                  searchTerm={searchTerm}
                  onChange={handleFiltersChange}
                  onSearchChange={setSearchTerm}
                  onClearAll={handleClearAll}
                />

                {loading ? (
                  <div style={{ padding: '60px 0', textAlign: 'center', color: '#6B7280', fontSize: '16px' }}>
                    Loading products from Mimi Sports API...
                  </div>
                ) : visibleProducts.length === 0 ? (
                  <EmptyState onClear={handleClearAll} />
                ) : (
                  <>
                    <div className="grid-4 products-grid">
                      {visibleProducts.map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>

                    {hasMore && (
                      <div className="products-load-more">
                        <button
                          className="btn btn-outline-dark"
                          onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
                        >
                          Load More
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <MobileFilterDrawer
        open={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        filters={filters}
        onChange={handleFiltersChange}
        resultCount={filteredProducts.length}
      />

      <Footer />
    </>
  )
}

export default Products
