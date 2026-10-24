// src/pages/admin/AdminOrders.jsx
// Admin Order Management Page with statistics, search, status filtering, order detail modal & status updating

import { useEffect, useState, useMemo } from 'react'
import {
  Search, Eye, ShoppingCart, Clock, CheckCircle, Package, Truck, XCircle, AlertCircle, X, Check, DollarSign, Calendar
} from 'lucide-react'
import { fetchAdminOrders, fetchAdminOrderDetail, updateAdminOrderStatus } from '../../services/api.js'
import { getPaymentMethodLabel, getPaymentStatusLabel, getPaymentStatusClass } from '../../utils/paymentStatus.js'
import { getOrderStatusLabel } from '../../utils/orderStatus.js'
import './Admin.css'

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
]

const STATUS_BADGE_CLASS = {
  pending: 'admin-badge--pending',
  confirmed: 'admin-badge--confirmed',
  processing: 'admin-badge--processing',
  shipped: 'admin-badge--shipped',
  out_for_delivery: 'admin-badge--shipped',
  delivered: 'admin-badge--delivered',
  cancelled: 'admin-badge--cancelled',
}

function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const [selectedOrder, setSelectedOrder] = useState(null)
  const [modalLoading, setModalLoading] = useState(false)
  const [statusUpdating, setStatusUpdating] = useState(false)
  const [statusSuccess, setStatusSuccess] = useState(null)

  const loadOrderList = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchAdminOrders({ search, status: statusFilter })
      setOrders(data.orders || [])
      setStats(data.stats || {})
    } catch (err) {
      console.error('Failed to load admin orders:', err)
      setError(err.message || 'Failed to load order list.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    document.title = 'Admin — Orders'
    loadOrderList()
  }, [search, statusFilter])

  const openOrderDetail = async (orderId) => {
    setModalLoading(true)
    setStatusSuccess(null)
    try {
      const detail = await fetchAdminOrderDetail(orderId)
      setSelectedOrder(detail)
    } catch (err) {
      alert(`Failed to load order details: ${err.message}`)
    } finally {
      setModalLoading(false)
    }
  }

  const handleStatusChange = async (orderId, newStatus) => {
    if (!newStatus || newStatus === selectedOrder?.status) return
    setStatusUpdating(true)
    setStatusSuccess(null)
    try {
      const res = await updateAdminOrderStatus(orderId, newStatus)
      setStatusSuccess(res.message || `Order status updated to "${newStatus}".`)
      setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null))
      await loadOrderList()
    } catch (err) {
      alert(`Failed to update status: ${err.message}`)
    } finally {
      setStatusUpdating(false)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A'
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateStr
    }
  }

  return (
    <div>
      <div className="admin-page__header">
        <div>
          <h1 className="admin-page__title">Customer Orders</h1>
          <p className="admin-page__sub">Manage store orders, customer shipments, and fulfillment status.</p>
        </div>
      </div>

      {error && (
        <div className="admin-alert admin-alert--error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Summary Stat Cards */}
      <div className="admin-stats" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <div className="admin-stat-card">
          <div>
            <div className="admin-stat-card__value">{stats.total_orders || 0}</div>
            <div className="admin-stat-card__label">Total Orders</div>
          </div>
          <div className="admin-stat-card__icon" style={{ background: '#EFF6FF', color: '#2563EB' }}>
            <ShoppingCart size={20} />
          </div>
        </div>

        <div className="admin-stat-card">
          <div>
            <div className="admin-stat-card__value">{stats.pending_count || 0}</div>
            <div className="admin-stat-card__label">Pending Orders</div>
          </div>
          <div className="admin-stat-card__icon" style={{ background: '#FFFBEB', color: '#B45309' }}>
            <Clock size={20} />
          </div>
        </div>

        <div className="admin-stat-card">
          <div>
            <div className="admin-stat-card__value">{stats.shipped_count || 0}</div>
            <div className="admin-stat-card__label">Shipped</div>
          </div>
          <div className="admin-stat-card__icon" style={{ background: '#F0FDFA', color: '#0D9488' }}>
            <Truck size={20} />
          </div>
        </div>

        <div className="admin-stat-card">
          <div>
            <div className="admin-stat-card__value">₹{Number(stats.total_revenue || 0).toLocaleString('en-IN')}</div>
            <div className="admin-stat-card__label">Total Revenue</div>
          </div>
          <div className="admin-stat-card__icon" style={{ background: '#ECFDF5', color: '#059669' }}>
            <DollarSign size={20} />
          </div>
        </div>

        <div className="admin-stat-card">
          <div>
            <div className="admin-stat-card__value">{stats.paid_orders || 0}</div>
            <div className="admin-stat-card__label">Paid Orders</div>
          </div>
          <div className="admin-stat-card__icon" style={{ background: '#ECFDF5', color: '#059669' }}>
            <CheckCircle size={20} />
          </div>
        </div>
      </div>

      <div className="admin-panel">
        <div className="admin-toolbar">
          <div className="admin-toolbar__search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by order #, customer name, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select className="admin-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="admin-empty">Loading orders from database...</div>
        ) : orders.length === 0 ? (
          <div className="admin-empty">No orders found matching your filter criteria.</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Items</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <strong style={{ fontFamily: 'monospace', color: 'var(--color-accent)' }}>
                        {o.order_number}
                      </strong>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--color-text)' }}>{o.customer_name}</div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{o.customer_email}</div>
                    </td>
                    <td>
                      <span style={{ fontSize: 12.5, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                        {formatDate(o.created_at)}
                      </span>
                    </td>
                    <td>
                      <span className="admin-badge admin-badge--neutral">
                        {o.total_items} item{o.total_items > 1 ? 's' : ''}
                      </span>
                    </td>
                    <td>
                      <strong style={{ fontSize: 14 }}>₹{Number(o.total_amount || 0).toLocaleString('en-IN')}</strong>
                    </td>
                    <td>
                      <span className={`admin-badge ${STATUS_BADGE_CLASS[o.status] || 'admin-badge--neutral'}`}>
                        {getOrderStatusLabel(o.status)}
                      </span>
                    </td>
                    <td>
                      <span className={`admin-badge ${getPaymentStatusClass(o.payment_status)}`}>
                        {getPaymentMethodLabel(o.payment_method)} · {getPaymentStatusLabel(o.payment_status)}
                      </span>
                    </td>
                    <td>
                      <button
                        className="admin-btn admin-btn-outline"
                        style={{ padding: '6px 12px', fontSize: 12.5 }}
                        onClick={() => openOrderDetail(o.id)}
                      >
                        <Eye size={14} /> View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {(selectedOrder || modalLoading) && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedOrder(null)}>
          <div className="admin-modal admin-modal--lg" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <div>
                <h2>Order Details</h2>
                {selectedOrder && (
                  <span className="admin-modal__sub">
                    Reference: <strong>{selectedOrder.order_number}</strong>
                  </span>
                )}
              </div>
              <button className="admin-modal__close" onClick={() => setSelectedOrder(null)}>
                <X size={18} />
              </button>
            </div>

            {modalLoading ? (
              <div className="admin-empty">Loading full order details...</div>
            ) : selectedOrder ? (
              <div className="admin-modal__body">
                {statusSuccess && (
                  <div className="admin-alert admin-alert--success" style={{ marginBottom: 16 }}>
                    <CheckCircle size={16} />
                    <span>{statusSuccess}</span>
                  </div>
                )}

                <div className="admin-order-modal-grid">
                  <div className="admin-order-card">
                    <h4 className="admin-order-card__title">Customer Details</h4>
                    <div className="admin-order-card__info">
                      <div><strong>Name:</strong> {selectedOrder.customer_name}</div>
                      <div><strong>Email:</strong> {selectedOrder.customer_email}</div>
                      <div><strong>Phone:</strong> {selectedOrder.customer_phone}</div>
                    </div>
                  </div>

                  <div className="admin-order-card">
                    <h4 className="admin-order-card__title">Shipping Address</h4>
                    <div className="admin-order-card__info">
                      <div>{selectedOrder.shipping_address}</div>
                      <div>{selectedOrder.shipping_city}, {selectedOrder.shipping_state} - {selectedOrder.shipping_pincode}</div>
                    </div>
                  </div>

                  <div className="admin-order-card">
                    <h4 className="admin-order-card__title">Order Status</h4>
                    <div className="admin-order-card__info">
                      <div style={{ marginBottom: 8 }}>
                        Current Status: {' '}
                        <span className={`admin-badge ${STATUS_BADGE_CLASS[selectedOrder.status]}`}>
                          {getOrderStatusLabel(selectedOrder.status)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <label style={{ fontSize: 12, fontWeight: 700 }}>Update Status:</label>
                        <select
                          className="admin-select"
                          value={selectedOrder.status}
                          disabled={statusUpdating}
                          onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value)}
                          style={{ padding: '4px 8px', fontSize: 12.5 }}
                        >
                          {STATUS_OPTIONS.filter((o) => o.value !== 'all').map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="admin-order-card">
                    <h4 className="admin-order-card__title">Payment Details</h4>
                    <div className="admin-order-card__info">
                      <div><strong>Status:</strong>{' '}
                        <span className={`admin-badge ${getPaymentStatusClass(selectedOrder.payment_status)}`}>
                          {getPaymentStatusLabel(selectedOrder.payment_status)}
                        </span>
                      </div>
                      <div><strong>Method:</strong> {getPaymentMethodLabel(selectedOrder.payment_method)}</div>
                      <div><strong>Razorpay Order:</strong> {selectedOrder.razorpay_order_id || 'N/A'}</div>
                      <div><strong>Payment ID:</strong> {selectedOrder.razorpay_payment_id || 'N/A'}</div>
                      <div><strong>Paid At:</strong> {formatDate(selectedOrder.paid_at)}</div>
                    </div>
                  </div>
                </div>

                <div className="admin-order-items-table-wrap" style={{ marginTop: 20 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>Items Ordered</h4>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Unit Price</th>
                        <th>Qty</th>
                        <th>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items && selectedOrder.items.map((it) => (
                        <tr key={it.id}>
                          <td>
                            <div className="admin-table__product">
                              <img className="admin-table__thumb" src={it.image} alt={it.product_name} />
                              <div>
                                <div className="admin-table__name">{it.product_name}</div>
                                <div className="admin-table__id">ID: {it.product_id}</div>
                              </div>
                            </div>
                          </td>
                          <td>₹{Number(it.unit_price).toLocaleString('en-IN')}</td>
                          <td>{it.quantity}</td>
                          <td><strong>₹{Number(it.subtotal).toLocaleString('en-IN')}</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="admin-order-totals" style={{ marginTop: 20 }}>
                  <div className="admin-summary-row">
                    <span>Subtotal:</span>
                    <span>₹{Number(selectedOrder.subtotal).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="admin-summary-row">
                    <span>Shipping Charge:</span>
                    <span>{selectedOrder.shipping_charge === 0 ? 'FREE' : `₹${selectedOrder.shipping_charge}`}</span>
                  </div>
                  <div className="admin-summary-row admin-summary-row--total">
                    <span>Grand Total:</span>
                    <span>₹{Number(selectedOrder.total_amount).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminOrders
