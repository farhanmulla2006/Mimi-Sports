// src/pages/OrderConfirmation.jsx
// Order Confirmation / Receipt Page

import { useState, useEffect } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import { CheckCircle2, ShoppingBag, ArrowRight, Truck, Mail, Phone, MapPin, PackageCheck } from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import PageHeader from '../components/PageHeader.jsx'
import { fetchOrderDetails } from '../services/api.js'
import { getPaymentMethodLabel, getPaymentStatusLabel } from '../utils/paymentStatus.js'
import { getOrderStatusLabel } from '../utils/orderStatus.js'
import './Cart.css'

function OrderConfirmation() {
  const { orderNumber } = useParams()
  const location = useLocation()

  const [order, setOrder] = useState(location.state?.order || null)
  const [loading, setLoading] = useState(!location.state?.order)
  const [error, setError] = useState(null)

  useEffect(() => {
    window.scrollTo(0, 0)
    if (!order && orderNumber) {
      setLoading(true)
      fetchOrderDetails(orderNumber)
        .then((data) => {
          if (data) setOrder(data)
          else setError('Order details could not be found.')
        })
        .catch((err) => {
          setError(err.message || 'Failed to load order details.')
        })
        .finally(() => setLoading(false))
    }
  }, [orderNumber])

  if (loading) {
    return (
      <>
        <Navbar />
        <main>
          <PageHeader
            title="Order Confirmation"
            breadcrumbItems={[{ label: 'Home', href: '/' }, { label: 'Order Confirmation' }]}
          />
          <div className="container" style={{ padding: '64px 32px', textAlign: 'center', color: '#6B7280' }}>
            Loading order summary...
          </div>
        </main>
        <Footer />
      </>
    )
  }

  if (error || !order) {
    return (
      <>
        <Navbar />
        <main>
          <PageHeader
            title="Order Details"
            breadcrumbItems={[{ label: 'Home', href: '/' }, { label: 'Order Not Found' }]}
          />
          <div className="container" style={{ padding: '64px 32px', textAlign: 'center' }}>
            <ShoppingBag size={48} color="#9CA3AF" style={{ margin: '0 auto 16px' }} />
            <h2>{error || 'Order details not found'}</h2>
            <Link to="/products" className="btn btn-primary" style={{ marginTop: 24 }}>
              Continue Shopping
            </Link>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main>
        <PageHeader
          title="Order Confirmed!"
          subtitle={`Order Number: ${order.order_number}`}
          breadcrumbItems={[
            { label: 'Home', href: '/' },
            { label: 'Products', href: '/products' },
            { label: 'Order Confirmed' },
          ]}
        />

        <section className="section">
          <div className="container">
            <div className="order-confirmation-card">
              <div className="order-confirmation-hero">
                <div className="order-confirmation-badge">
                  <CheckCircle2 size={48} strokeWidth={2} />
                </div>
                <h2>Thank You for Your Order!</h2>
                <p>We've received your order and are preparing your gear for shipment.</p>
                <div className="order-number-pill">
                  Order Reference: <strong>{order.order_number}</strong>
                </div>
              </div>

              <div className="order-details-grid">
                <div className="order-info-block">
                  <h4 className="order-block-title">
                    <Mail size={16} /> Customer Contact
                  </h4>
                  <div className="order-info-text">
                    <strong>{order.customer_name}</strong>
                    <div>{order.customer_email}</div>
                    <div><Phone size={13} style={{ display: 'inline', marginRight: 4 }} />{order.customer_phone}</div>
                  </div>
                </div>

                <div className="order-info-block">
                  <h4 className="order-block-title">
                    <MapPin size={16} /> Shipping Address
                  </h4>
                  <div className="order-info-text">
                    <div>{order.shipping_address}</div>
                    <div>{order.shipping_city}, {order.shipping_state} - {order.shipping_pincode}</div>
                  </div>
                </div>

                <div className="order-info-block">
                  <h4 className="order-block-title">
                    <Truck size={16} /> Status & Delivery
                  </h4>
                  <div className="order-info-text">
                    <div>Order Status: <span className="order-status-tag">{getOrderStatusLabel(order.status)}</span></div>
                    <div>Payment Status: <span className="order-status-tag">{getPaymentStatusLabel(order.payment_status)}</span></div>
                    <div>Payment Method: {getPaymentMethodLabel(order.payment_method)}</div>
                    {order.payment_method === 'cod' && order.payment_status !== 'paid' && <div>Pay in cash when your order is delivered.</div>}
                    {order.demo_payment_reference && <div>Demo Reference: {order.demo_payment_reference}</div>}
                    {order.razorpay_payment_id && <div>Payment ID: {order.razorpay_payment_id}</div>}
                    <div>Standard Express Delivery</div>
                  </div>
                </div>
              </div>

              <div className="order-items-summary">
                <h4 className="order-block-title" style={{ marginBottom: 16 }}>
                  <PackageCheck size={18} /> Items Ordered ({order.items ? order.items.length : 0})
                </h4>

                <div className="cart-table-wrap">
                  <table className="cart-table">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Unit Price</th>
                        <th>Qty</th>
                        <th>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items && order.items.map((item, idx) => (
                        <tr key={idx}>
                          <td>
                            <div className="cart-item__product">
                              {item.image && (
                                <img src={item.image} alt={item.product_name} className="cart-item__thumb" />
                              )}
                              <div>
                                <div className="cart-item__name">{item.product_name}</div>
                                <span className="cart-item__brand">ID: {item.product_id}</span>
                              </div>
                            </div>
                          </td>
                          <td>₹{Number(item.unit_price).toLocaleString('en-IN')}</td>
                          <td>{item.quantity}</td>
                          <td>₹{Number(item.subtotal).toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="order-totals-breakdown">
                <div className="cart-summary__row">
                  <span>Subtotal</span>
                  <span>₹{Number(order.subtotal).toLocaleString('en-IN')}</span>
                </div>
                <div className="cart-summary__row">
                  <span>Shipping Charge</span>
                  <span>{order.shipping_charge === 0 ? 'FREE' : `₹${order.shipping_charge}`}</span>
                </div>
                <div className="cart-summary__row cart-summary__row--total">
                  <span>{order.payment_status === 'paid' ? 'Total Paid' : 'Order Total'}</span>
                  <span>₹{Number(order.total_amount).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="order-confirmation-actions">
                <Link to={`/account/orders/${order.order_number}`} className="btn btn-secondary btn-lg">
                  Track Order <ArrowRight size={18} />
                </Link>
                <Link to="/products" className="btn btn-primary btn-lg">
                  Continue Shopping <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

export default OrderConfirmation
