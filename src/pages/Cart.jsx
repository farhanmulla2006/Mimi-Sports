// src/pages/Cart.jsx
// Shopping Cart Page

import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Trash2, ShoppingBag, ArrowLeft, ArrowRight, ShieldCheck, Truck } from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import PageHeader from '../components/PageHeader.jsx'
import { useCart } from '../context/CartContext.jsx'
import './Cart.css'

function Cart() {
  const {
    cartItems,
    cartCount,
    subtotal,
    shippingCharge,
    grandTotal,
    updateQuantity,
    removeFromCart,
    clearCart,
    clearBuyNow,
  } = useCart()

  const navigate = useNavigate()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <>
      <Navbar />
      <main>
        <PageHeader
          title="Shopping Cart"
          subtitle={cartCount > 0 ? `${cartCount} item${cartCount > 1 ? 's' : ''} in your cart` : 'Your cart is currently empty'}
          breadcrumbItems={[
            { label: 'Home', href: '/' },
            { label: 'Products', href: '/products' },
            { label: 'Cart' },
          ]}
        />

        <section className="section">
          <div className="container">
            {cartItems.length === 0 ? (
              <div className="cart-empty">
                <div className="cart-empty__icon">
                  <ShoppingBag size={48} strokeWidth={1.5} />
                </div>
                <h2>Your Shopping Cart is Empty</h2>
                <p>Explore our premium catalog of sportswear, equipment, footwear, and accessories.</p>
                <Link to="/products" className="btn btn-primary btn-lg" style={{ marginTop: 16 }}>
                  Explore Catalog <ArrowRight size={18} />
                </Link>
              </div>
            ) : (
              <div className="cart-layout">
                <div className="cart-items-wrap">
                  <div className="cart-header-actions">
                    <Link to="/products" className="cart-back-link">
                      <ArrowLeft size={16} /> Continue Shopping
                    </Link>
                    <button onClick={clearCart} className="cart-clear-btn">
                      <Trash2 size={14} /> Clear Cart
                    </button>
                  </div>

                  <div className="cart-table-wrap">
                    <table className="cart-table">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Price</th>
                          <th>Quantity</th>
                          <th>Subtotal</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {cartItems.map(({ id, quantity, product, unitPrice, subtotal: itemSubtotal }) => (
                          <tr key={id}>
                            <td>
                              <div className="cart-item__product">
                                <Link to={`/products/${id}`} className="cart-item__thumb">
                                  <img src={product.image} alt={product.name} />
                                </Link>
                                <div>
                                  <span className="cart-item__brand">{product.brand}</span>
                                  <Link to={`/products/${id}`} className="cart-item__name">
                                    {product.name}
                                  </Link>
                                  <div className="cart-item__meta">
                                    <span>Sport: {product.sport}</span>
                                    <span>Category: {product.category}</span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="cart-item__price">
                                ₹{unitPrice.toLocaleString('en-IN')}
                              </span>
                            </td>
                            <td>
                              <div className="cart-qty-selector">
                                <button
                                  className="cart-qty-btn"
                                  onClick={() => updateQuantity(id, quantity - 1)}
                                  aria-label="Decrease quantity"
                                >
                                  -
                                </button>
                                <span className="cart-qty-val">{quantity}</span>
                                <button
                                  className="cart-qty-btn"
                                  onClick={() => updateQuantity(id, quantity + 1)}
                                  aria-label="Increase quantity"
                                >
                                  +
                                </button>
                              </div>
                            </td>
                            <td>
                              <span className="cart-item__subtotal">
                                ₹{itemSubtotal.toLocaleString('en-IN')}
                              </span>
                            </td>
                            <td>
                              <button
                                onClick={() => removeFromCart(id)}
                                className="cart-remove-btn"
                                aria-label="Remove item"
                                title="Remove item"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="cart-summary-card">
                  <h3 className="cart-summary__title">Order Summary</h3>

                  <div className="cart-summary__rows">
                    <div className="cart-summary__row">
                      <span>Subtotal ({cartCount} items)</span>
                      <span>₹{subtotal.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="cart-summary__row">
                      <span>Shipping Charge</span>
                      {shippingCharge === 0 ? (
                        <span style={{ color: 'var(--color-success)', fontWeight: 700 }}>FREE</span>
                      ) : (
                        <span>₹{shippingCharge}</span>
                      )}
                    </div>

                    {shippingCharge > 0 && (
                      <div className="cart-summary__hint">
                        <Truck size={14} /> Add ₹{(999 - subtotal).toLocaleString('en-IN')} more for FREE delivery!
                      </div>
                    )}

                    <div className="cart-summary__row cart-summary__row--total">
                      <span>Grand Total</span>
                      <span>₹{grandTotal.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => { clearBuyNow(); navigate('/checkout') }}
                    className="btn btn-primary btn-lg"
                    style={{ width: '100%', justifyContent: 'center', marginTop: 24 }}
                  >
                    Proceed to Checkout <ArrowRight size={18} />
                  </button>

                  <div className="cart-security-badge">
                    <ShieldCheck size={16} /> Secure Checkout & 100% Authentic Products
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

export default Cart
