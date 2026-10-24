import { Link } from 'react-router-dom'
import { Heart, ShoppingCart, Trash2, Star } from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import PageHeader from '../components/PageHeader.jsx'
import { useWishlist } from '../context/WishlistContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import './Wishlist.css'

function Wishlist() {
  const { items, loading, error, removeItem } = useWishlist()
  const { addToCart } = useCart()

  return (
    <>
      <Navbar />
      <main>
        <PageHeader
          title="Wishlist"
          subtitle="Keep your favourite sports gear close."
          breadcrumbItems={[{ label: 'Home', href: '/' }, { label: 'Wishlist' }]}
        />
        <section className="section">
          <div className="container">
            {error && <div className="checkout-alert checkout-alert--error">{error}</div>}
            {loading ? (
              <div className="wishlist-empty">Loading your wishlist...</div>
            ) : items.length === 0 ? (
              <div className="wishlist-empty">
                <Heart size={46} />
                <h2>Your wishlist is empty</h2>
                <p>Save products you want to revisit while you browse the catalog.</p>
                <Link to="/products" className="btn btn-primary">Browse Products</Link>
              </div>
            ) : (
              <div className="wishlist-list">
                {items.map((item) => (
                  <article className="wishlist-item" key={item.id}>
                    <Link to={`/products/${item.id}`} className="wishlist-item__image">
                      <img src={item.image} alt={item.name} />
                    </Link>
                    <div className="wishlist-item__details">
                      <span className="product-card__brand">{item.brand}</span>
                      <Link to={`/products/${item.id}`}><h2>{item.name}</h2></Link>
                      <div className="product-card__rating">
                        <Star size={13} fill="#FF5A1F" color="#FF5A1F" /> {Number(item.rating || 0).toFixed(1)} ({item.reviews || 0} reviews)
                      </div>
                      <strong className="wishlist-item__price">₹{Number(item.price || 0).toLocaleString('en-IN')}</strong>
                      <span className={item.stock ? 'wishlist-stock wishlist-stock--available' : 'wishlist-stock'}>{item.stock ? 'In Stock' : 'Out of Stock'}</span>
                    </div>
                    <div className="wishlist-item__actions">
                      <button type="button" className="btn btn-primary" onClick={() => addToCart(item.id)} disabled={!item.stock}>
                        <ShoppingCart size={16} /> Add to Cart
                      </button>
                      <button type="button" className="btn btn-secondary" onClick={() => removeItem(item.id)}>
                        <Trash2 size={16} /> Remove
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

export default Wishlist