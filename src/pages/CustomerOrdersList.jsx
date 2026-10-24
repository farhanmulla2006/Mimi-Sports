import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye } from 'lucide-react'
import { fetchCustomerOrders } from '../services/api.js'
import { getPaymentMethodLabel, getPaymentStatusLabel } from '../utils/paymentStatus.js'
import { getOrderStatusLabel } from '../utils/orderStatus.js'

const STATUS_BADGE_CLASS = {
  pending: 'admin-badge--pending',
  confirmed: 'admin-badge--confirmed',
  processing: 'admin-badge--processing',
  shipped: 'admin-badge--shipped',
  delivered: 'admin-badge--delivered',
  out_for_delivery: 'admin-badge--shipped',
  cancelled: 'admin-badge--cancelled',
}

function CustomerOrdersList() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchCustomerOrders()
        setOrders(data)
      } catch (err) {
        setError(err.message || 'Unable to load your orders.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  if (loading) return <div className="account-empty">Loading your orders...</div>
  if (error) return <div className="admin-alert admin-alert--error"><span>{error}</span></div>

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>My Orders</h2>
        <p style={{ margin: '8px 0 0', color: 'var(--color-text-secondary)' }}>Track recent purchases and review order details.</p>
      </div>

      {orders.length === 0 ? (
        <div className="admin-empty">No orders yet. Head to the catalog to start shopping.</div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {orders.map((order) => (
            <div key={order.id} style={{ border: '1px solid var(--color-border)', borderRadius: 16, padding: 18, background: '#fffaf8' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Order Number</div>
                  <strong>{order.order_number}</strong>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Date</div>
                  <strong>{formatDate(order.created_at)}</strong>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Items</div>
                  <strong>{order.total_items} item{order.total_items > 1 ? 's' : ''}</strong>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total</div>
                  <strong>₹{Number(order.total_amount || 0).toLocaleString('en-IN')}</strong>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Status</div>
                  <span className={`admin-badge ${STATUS_BADGE_CLASS[order.status] || 'admin-badge--neutral'}`}>{getOrderStatusLabel(order.status)}</span>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Payment</div>
                  <strong>{getPaymentMethodLabel(order.payment_method)} · {getPaymentStatusLabel(order.payment_status)}</strong>
                </div>
              </div>

              <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
                <Link to={`/account/orders/${order.order_number}`} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <Eye size={16} /> Track Order
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default CustomerOrdersList
