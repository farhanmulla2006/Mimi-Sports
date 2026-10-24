import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchCustomerOrderDetail } from '../services/api.js'
import { getPaymentMethodLabel, getPaymentStatusLabel } from '../utils/paymentStatus.js'
import { getOrderStatusLabel } from '../utils/orderStatus.js'
import OrderTrackingTimeline from '../components/OrderTrackingTimeline.jsx'

function CustomerOrderDetail() {
  const { orderNumber } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchCustomerOrderDetail(orderNumber)
        setOrder(data)
      } catch (err) {
        setError(err.message || 'Unable to load order details.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [orderNumber])

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  if (loading) return <div className="account-empty">Loading order details...</div>
  if (error) return <div className="admin-alert admin-alert--error"><span>{error}</span></div>
  if (!order) return <div className="admin-empty">Order not found.</div>

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <p style={{ margin: 0, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-accent)' }}>Order Details</p>
        <h2 style={{ margin: '8px 0 0' }}>{order.order_number}</h2>
      </div>

      <OrderTrackingTimeline status={order.status} createdAt={order.created_at} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="detail-card" style={{ background: '#f8fafc', border: '1px solid var(--color-border)', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>Order Date</div>
          <div style={{ marginTop: 6, fontWeight: 700 }}>{formatDate(order.created_at)}</div>
        </div>
        <div className="detail-card" style={{ background: '#f8fafc', border: '1px solid var(--color-border)', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>Status</div>
          <div style={{ marginTop: 6 }}><span className={`admin-badge admin-badge--${order.status === 'cancelled' ? 'cancelled' : order.status === 'pending' ? 'pending' : 'confirmed'}`}>{getOrderStatusLabel(order.status)}</span></div>
        </div>
        <div className="detail-card" style={{ background: '#f8fafc', border: '1px solid var(--color-border)', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>Payment</div>
          <div style={{ marginTop: 6 }}>{getPaymentStatusLabel(order.payment_status)}</div>
          <div style={{ marginTop: 4, fontSize: 13, color: 'var(--color-text-secondary)' }}>Method: {getPaymentMethodLabel(order.payment_method)}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#f8fafc', border: '1px solid var(--color-border)', borderRadius: 12, padding: 16 }}>
          <h4 style={{ marginTop: 0 }}>Customer Information</h4>
          <div>{order.customer_name}</div>
          <div>{order.customer_email}</div>
          <div>{order.customer_phone}</div>
        </div>
        <div style={{ background: '#f8fafc', border: '1px solid var(--color-border)', borderRadius: 12, padding: 16 }}>
          <h4 style={{ marginTop: 0 }}>Shipping Address</h4>
          <div>{order.shipping_address}</div>
          <div>{order.shipping_city}, {order.shipping_state} - {order.shipping_pincode}</div>
        </div>
      </div>

      <div style={{ border: '1px solid var(--color-border)', borderRadius: 12, overflow: 'hidden' }}>
        <table className="admin-table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>Product</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.items && order.items.map((item) => (
              <tr key={item.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <img src={item.image} alt={item.product_name} style={{ width: 42, height: 42, objectFit: 'cover', borderRadius: 8 }} />
                    <div>{item.product_name}</div>
                  </div>
                </td>
                <td>{item.quantity}</td>
                <td>₹{Number(item.unit_price).toLocaleString('en-IN')}</td>
                <td><strong>₹{Number(item.subtotal).toLocaleString('en-IN')}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 20, maxWidth: 320, marginLeft: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}><span>Subtotal</span><strong>₹{Number(order.subtotal || 0).toLocaleString('en-IN')}</strong></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}><span>Shipping</span><strong>{Number(order.shipping_charge || 0) === 0 ? 'FREE' : `₹${Number(order.shipping_charge).toLocaleString('en-IN')}`}</strong></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid var(--color-border)', fontWeight: 800 }}><span>Total</span><span>₹{Number(order.total_amount || 0).toLocaleString('en-IN')}</span></div>
      </div>

      <div style={{ marginTop: 20 }}>
        <Link to="/account/orders" className="btn btn-secondary">Back to orders</Link>
      </div>
    </div>
  )
}

export default CustomerOrderDetail
