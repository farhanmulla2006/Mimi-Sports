import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, ShoppingCart, Menu, X, Heart } from 'lucide-react'
import { useCart } from '../context/CartContext.jsx'
import { useCustomerAuth } from '../context/CustomerAuthContext.jsx'
import { useWishlist } from '../context/WishlistContext.jsx'
import './Navbar.css'

const navLinks = [
  { label: 'Sports', to: '/sports', type: 'route' },
  { label: 'Products', to: '/products', type: 'route' },
  { label: 'Offers', to: '/#offers', type: 'anchor' },
]

function NavLinkItem({ link, className, onClick }) {
  if (link.type === 'route') {
    return (
      <Link to={link.to} className={className} onClick={onClick}>
        {link.label}
      </Link>
    )
  }
  return (
    <a href={link.to} className={className} onClick={onClick}>
      {link.label}
    </a>
  )
}

function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { cartCount } = useCart()
  const { customer, logout } = useCustomerAuth()
  const { count: wishlistCount } = useWishlist()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
  }, [menuOpen])

  const handleCustomerLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Navbar logout error:', error)
    }
  }

  return (
    <header className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="container navbar__inner">
        <Link to="/" className="navbar__logo">
          <span className="navbar__logo-mark">M</span>
          <span className="navbar__logo-text">MIMI<span className="navbar__logo-accent">SPORTS</span></span>
        </Link>

        <nav className="navbar__links" aria-label="Primary">
          {navLinks.map((link) => (
            <NavLinkItem key={link.label} link={link} className="navbar__link" />
          ))}
        </nav>

        <div className="navbar__actions">
          <Link to="/products" className="navbar__icon-btn navbar__search" aria-label="Search">
            <Search size={19} strokeWidth={2} />
            <span className="navbar__search-text">Search gear, brands...</span>
          </Link>

          <Link to="/cart" className="navbar__icon-btn navbar__cart" aria-label="Shopping Cart">
            <ShoppingCart size={20} strokeWidth={2} />
            {cartCount > 0 && <span className="navbar__badge">{cartCount}</span>}
          </Link>

          <Link to="/wishlist" className="navbar__icon-btn navbar__cart" aria-label="Wishlist">
            <Heart size={20} strokeWidth={2} />
            {customer && wishlistCount > 0 && <span className="navbar__badge">{wishlistCount}</span>}
          </Link>

          {customer ? (
            <>
              <Link to="/account" className="btn btn-dark btn-sm navbar__login">Account</Link>
              <Link to="/account/orders" className="btn btn-secondary btn-sm navbar__login">My Orders</Link>
              <button type="button" className="btn btn-dark btn-sm navbar__login" onClick={handleCustomerLogout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-dark btn-sm navbar__login">Login</Link>
              <Link to="/register" className="btn btn-secondary btn-sm navbar__login">Register</Link>
            </>
          )}

          <button
            className="navbar__hamburger"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <div className={`navbar__mobile ${menuOpen ? 'navbar__mobile--open' : ''}`}>
        <Link to="/products" className="navbar__mobile-search" aria-label="Search" onClick={() => setMenuOpen(false)}>
          <Search size={18} />
          <span>Search gear, brands...</span>
        </Link>
        <nav className="navbar__mobile-links" aria-label="Mobile Primary">
          {navLinks.map((link) => (
            <NavLinkItem
              key={link.label}
              link={link}
              className="navbar__mobile-link"
              onClick={() => setMenuOpen(false)}
            />
          ))}
        </nav>
        <div className="navbar__mobile-actions">
          <Link to="/cart" className="navbar__icon-btn" aria-label="Cart" onClick={() => setMenuOpen(false)}>
            <ShoppingCart size={20} /> <span>Cart ({cartCount})</span>
          </Link>
          <Link to="/wishlist" className="navbar__icon-btn" aria-label="Wishlist" onClick={() => setMenuOpen(false)}>
            <Heart size={20} /> <span>Wishlist ({customer ? wishlistCount : 0})</span>
          </Link>
        </div>
        {customer ? (
          <>
            <Link to="/account" className="btn btn-primary" style={{ width: '100%', textAlign: 'center' }} onClick={() => setMenuOpen(false)}>Account</Link>
            <Link to="/account/orders" className="btn btn-secondary" style={{ width: '100%', textAlign: 'center' }} onClick={() => setMenuOpen(false)}>My Orders</Link>
            <button type="button" className="btn btn-primary" style={{ width: '100%', textAlign: 'center' }} onClick={() => { setMenuOpen(false); handleCustomerLogout() }}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-primary" style={{ width: '100%', textAlign: 'center' }} onClick={() => setMenuOpen(false)}>Login</Link>
            <Link to="/register" className="btn btn-secondary" style={{ width: '100%', textAlign: 'center' }} onClick={() => setMenuOpen(false)}>Register</Link>
          </>
        )}
      </div>
    </header>
  )
}

export default Navbar
