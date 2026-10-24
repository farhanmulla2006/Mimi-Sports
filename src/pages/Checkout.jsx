// src/pages/Checkout.jsx
// Checkout Page with Customer Info, Shipping Info, Order Summary & Order Placement

import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Lock, AlertCircle, ShoppingBag, CheckCircle, CreditCard, Banknote, LoaderCircle } from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import PageHeader from '../components/PageHeader.jsx'
import { useCart } from '../context/CartContext.jsx'
import { useCustomerAuth } from '../context/CustomerAuthContext.jsx'
import { createOrder, completeDemoPayment } from '../services/api.js'
import './Cart.css'

const PENDING_DEMO_CHECKOUT_KEY = 'mimi_sports_pending_demo_checkout'

function readPendingDemoCheckout() {
  if (typeof window === 'undefined') return null
  try {
    const saved = sessionStorage.getItem(PENDING_DEMO_CHECKOUT_KEY)
    return saved ? JSON.parse(saved) : null
  } catch {
    return null
  }
}

function Checkout() {
  const {
    cartItems,
    buyNow,
    buyNowItems,
    subtotal,
    shippingCharge,
    grandTotal,
    buyNowSubtotal,
    buyNowShippingCharge,
    buyNowGrandTotal,
    clearCart,
    clearBuyNow,
  } = useCart()
  const { customer } = useCustomerAuth()
  const navigate = useNavigate()
  const initialPendingCheckout = readPendingDemoCheckout()
  const checkoutItems = buyNow ? buyNowItems : cartItems
  const checkoutSubtotal = buyNow ? buyNowSubtotal : subtotal
  const checkoutShippingCharge = buyNow ? buyNowShippingCharge : shippingCharge
  const checkoutGrandTotal = buyNow ? buyNowGrandTotal : grandTotal

  const [form, setForm] = useState(() => initialPendingCheckout?.payload ? {
    ...initialPendingCheckout.payload.customer,
    ...initialPendingCheckout.payload.shipping,
  } : {
    name: '', email: '', phone: '', address: '', city: '', state: '', pincode: '',
  })

  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [apiError, setApiError] = useState(null)
  const [pendingCheckout, setPendingCheckout] = useState(initialPendingCheckout)
  const [paymentMethod, setPaymentMethod] = useState('online')
  const [paymentState, setPaymentState] = useState('idle')
  const [demoPaymentReference, setDemoPaymentReference] = useState('')

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    if (!customer) return
    setForm((prev) => ({
      ...prev,
      name: customer.name || prev.name,
      email: customer.email || prev.email,
      phone: customer.phone || prev.phone,
    }))
  }, [customer])

  if (checkoutItems.length === 0 && !submitting) {
    return (
      <>
        <Navbar />
        <main>
          <PageHeader
            title="Checkout"
            breadcrumbItems={[{ label: 'Home', href: '/' }, { label: 'Cart', href: '/cart' }, { label: 'Checkout' }]}
          />
          <div className="container" style={{ padding: '64px 32px', textAlign: 'center' }}>
            <div className="cart-empty__icon" style={{ margin: '0 auto 16px' }}>
              <ShoppingBag size={48} />
            </div>
            <h2>Your Cart is Empty</h2>
            <p style={{ color: '#6B7280', margin: '8px 0 24px' }}>Please add products to your cart before proceeding to checkout.</p>
            <Link to="/products" className="btn btn-primary">Return to Catalog</Link>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  const setField = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }))
    if (errors[field]) {
      setErrors((errs) => ({ ...errs, [field]: null }))
    }
  }

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Full name is required.'
    if (!form.email.trim()) errs.email = 'Email address is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs.email = 'Please enter a valid email address.'

    if (!form.phone.trim()) errs.phone = 'Phone number is required.'
    else if (!/^[0-9+\-\s()]{7,20}$/.test(form.phone.trim())) errs.phone = 'Please enter a valid phone number.'

    if (!form.address.trim()) errs.address = 'Shipping address is required.'
    if (!form.city.trim()) errs.city = 'City is required.'
    if (!form.state.trim()) errs.state = 'State is required.'

    if (!form.pincode.trim()) errs.pincode = 'Pincode is required.'
    else if (!/^[0-9]{6}$/.test(form.pincode.trim())) errs.pincode = 'Pincode must be 6 digits.'

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    setApiError(null)

    const payload = {
      customer: {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
      },
      shipping: {
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        pincode: form.pincode.trim(),
      },
      items: checkoutItems.map((item) => ({
        id: item.id,
        quantity: item.quantity,
      })),
      payment_method: paymentMethod,
    }

    try {
      const canReusePendingOrder = pendingCheckout
        && JSON.stringify(pendingCheckout.payload) === JSON.stringify(payload)
      const order = canReusePendingOrder ? pendingCheckout.order : await createOrder(payload)
      if (!canReusePendingOrder) {
        const pending = { order, payload }
        setPendingCheckout(pending)
        sessionStorage.setItem(PENDING_DEMO_CHECKOUT_KEY, JSON.stringify(pending))
      }
      let paymentResult = { payment_status: 'pending', payment_method: paymentMethod }
      let paymentReference = ''
      if (paymentMethod === 'online') {
        setPaymentState('processing')
        await new Promise((resolve) => setTimeout(resolve, 700))
        paymentResult = await completeDemoPayment(order.order_number, form.email.trim())
        paymentReference = `DEMO_PAY_${(window.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)).replace(/-/g, '').slice(0, 8).toUpperCase()}`
        setDemoPaymentReference(paymentReference)
        setPaymentState('success')
        await new Promise((resolve) => setTimeout(resolve, 450))
      } else {
        setPaymentState('success')
      }
      sessionStorage.removeItem(PENDING_DEMO_CHECKOUT_KEY)
      clearBuyNow()
      if (!buyNow) clearCart()
      navigate(`/order-confirmation/${order.order_number}`, {
        state: {
          order: {
            ...order,
            payment_status: paymentResult.payment_status,
            payment_method: paymentResult.payment_method,
            demo_payment_reference: paymentReference,
          },
        },
      })
    } catch (err) {
      console.error('Order creation failed:', err)
      setPaymentState('failed')
      setApiError(err.message || 'Payment could not be completed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Navbar />
      <main>
        <PageHeader
          title="Checkout"
          subtitle="Complete your shipping and contact details"
          breadcrumbItems={[
            { label: 'Home', href: '/' },
            { label: 'Cart', href: '/cart' },
            { label: 'Checkout' },
          ]}
        />

        <section className="section">
          <div className="container">
            <Link to="/cart" className="cart-back-link" style={{ marginBottom: 24, display: 'inline-flex' }}>
              <ArrowLeft size={16} /> Return to Cart
            </Link>

            {apiError && (
              <div className="checkout-alert checkout-alert--error">
                <AlertCircle size={20} />
                <span>{apiError}</span>
              </div>
            )}

            {paymentState === 'processing' && (
              <div className="checkout-alert" style={{ background: '#FFF7ED', border: '1px solid #FED7AA', color: '#9A3412' }}>
                <LoaderCircle size={20} />
                <span>Payment Processing: completing your simulated online payment...</span>
              </div>
            )}

            {paymentState === 'failed' && (
              <div className="checkout-alert checkout-alert--error">
                <AlertCircle size={20} />
                <span>Payment Failed: your order was not marked as paid. Please try again.</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="checkout-grid">
              <div className="checkout-form-main">
                <div className="checkout-section">
                  <h3 className="checkout-section__title">1. Customer Details</h3>
                  <div className="checkout-form-group">
                    <div className={`checkout-field ${errors.name ? 'has-error' : ''}`}>
                      <label>Full Name *</label>
                      <input
                        type="text"
                        placeholder="John Doe"
                        value={form.name}
                        onChange={(e) => setField('name', e.target.value)}
                      />
                      {errors.name && <span className="checkout-field__error">{errors.name}</span>}
                    </div>

                    <div className="checkout-field-row">
                      <div className={`checkout-field ${errors.email ? 'has-error' : ''}`}>
                        <label>Email Address *</label>
                        <input
                          type="email"
                          placeholder="john@example.com"
                          value={form.email}
                          onChange={(e) => setField('email', e.target.value)}
                        />
                        {errors.email && <span className="checkout-field__error">{errors.email}</span>}
                      </div>

                      <div className={`checkout-field ${errors.phone ? 'has-error' : ''}`}>
                        <label>Phone Number *</label>
                        <input
                          type="tel"
                          placeholder="9876543210"
                          value={form.phone}
                          onChange={(e) => setField('phone', e.target.value)}
                        />
                        {errors.phone && <span className="checkout-field__error">{errors.phone}</span>}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="checkout-section" style={{ marginTop: 24 }}>
                    <h3 className="checkout-section__title">2. Shipping Address</h3>
                  <div className="checkout-form-group">
                    <div className={`checkout-field ${errors.address ? 'has-error' : ''}`}>
                      <label>Street Address / House No. *</label>
                      <textarea
                        rows={2}
                        placeholder="Flat No, Building Name, Street Name..."
                        value={form.address}
                        onChange={(e) => setField('address', e.target.value)}
                      />
                      {errors.address && <span className="checkout-field__error">{errors.address}</span>}
                    </div>

                    <div className="checkout-field-row">
                      <div className={`checkout-field ${errors.city ? 'has-error' : ''}`}>
                        <label>City *</label>
                        <input
                          type="text"
                          placeholder="Mumbai"
                          value={form.city}
                          onChange={(e) => setField('city', e.target.value)}
                        />
                        {errors.city && <span className="checkout-field__error">{errors.city}</span>}
                      </div>

                      <div className={`checkout-field ${errors.state ? 'has-error' : ''}`}>
                        <label>State *</label>
                        <input
                          type="text"
                          placeholder="Maharashtra"
                          value={form.state}
                          onChange={(e) => setField('state', e.target.value)}
                        />
                        {errors.state && <span className="checkout-field__error">{errors.state}</span>}
                      </div>
                    </div>

                    <div className={`checkout-field ${errors.pincode ? 'has-error' : ''}`}>
                      <label>Pincode *</label>
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="400001"
                        value={form.pincode}
                        onChange={(e) => setField('pincode', e.target.value)}
                      />
                      {errors.pincode && <span className="checkout-field__error">{errors.pincode}</span>}
                    </div>
                  </div>
                </div>

                <div className="checkout-section" style={{ marginTop: 24 }}>
                  <h3 className="checkout-section__title">3. Payment Method</h3>
                  <label className="checkout-payment-option">
                    <input type="radio" name="payment_method" value="online" checked={paymentMethod === 'online'} onChange={() => setPaymentMethod('online')} />
                    <CreditCard size={18} />
                    <span>
                      <strong>Online Payment</strong>
                      <small>Simulated payment for college demonstration</small>
                    </span>
                  </label>
                  <label className="checkout-payment-option">
                    <input type="radio" name="payment_method" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />
                    <Banknote size={18} />
                    <span>
                      <strong>Cash on Delivery</strong>
                      <small>Pay when your order is delivered</small>
                    </span>
                  </label>
                </div>
              </div>

              <div className="checkout-summary-sidebar">
                <div className="cart-summary-card">
                  <h3 className="cart-summary__title">Order Summary</h3>

                  <div className="checkout-items-list">
                    {checkoutItems.map(({ id, quantity, product, unitPrice, subtotal: itemSubtotal }) => (
                      <div key={id} className="checkout-item-row">
                        <img src={product.image} alt={product.name} className="checkout-item-thumb" />
                        <div className="checkout-item-info">
                          <div className="checkout-item-name">{product.name}</div>
                          <div className="checkout-item-qty">Qty: {quantity} × ₹{unitPrice.toLocaleString('en-IN')}</div>
                        </div>
                        <div className="checkout-item-subtotal">₹{itemSubtotal.toLocaleString('en-IN')}</div>
                      </div>
                    ))}
                  </div>

                  <div className="cart-summary__rows" style={{ marginTop: 16 }}>
                    <div className="cart-summary__row">
                      <span>Subtotal</span>
                      <span>₹{checkoutSubtotal.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="cart-summary__row">
                      <span>Shipping</span>
                      {checkoutShippingCharge === 0 ? (
                        <span style={{ color: 'var(--color-success)', fontWeight: 700 }}>FREE</span>
                      ) : (
                        <span>₹{checkoutShippingCharge}</span>
                      )}
                    </div>

                    <div className="cart-summary__row cart-summary__row--total">
                      <span>Grand Total</span>
                      <span>₹{checkoutGrandTotal.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary btn-lg"
                    disabled={submitting}
                    style={{ width: '100%', justifyContent: 'center', marginTop: 24 }}
                  >
                    <Lock size={16} /> {submitting ? 'Processing order...' : paymentMethod === 'online' ? `Pay ₹${checkoutGrandTotal.toLocaleString('en-IN')}` : 'Place COD Order'}
                  </button>

                  <div className="checkout-payment-note">
                    <CheckCircle size={14} color="var(--color-success)" /> {paymentMethod === 'online' ? 'No card, CVV, PIN, or real money is used' : 'Pay in cash when your order is delivered'}
                  </div>
                </div>
              </div>
            </form>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

export default Checkout
