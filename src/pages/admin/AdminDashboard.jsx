import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, AlertTriangle, DollarSign, Package, ShoppingCart, Users, TrendingUp, CalendarRange, Filter } from 'lucide-react'
import { fetchAdminDashboardSummary } from '../../services/api.js'

const RANGE_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: 'this_month', label: 'This month' },
  { value: 'last_month', label: 'Last month' },
  { value: 'custom', label: 'Custom' },
]

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

function formatCurrency(value) {
  return currencyFormatter.format(Number(value || 0))
}

function formatDate(value) {
  if (!value) return 'N/A'
  try {
    return new Date(value).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return value
  }
}

function AdminDashboard() {
  const [range, setRange] = useState('30d')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadDashboard = async (nextRange = range, nextStart = startDate, nextEnd = endDate) => {
    try {
      setLoading(true)
      setError('')
      const payload = await fetchAdminDashboardSummary({
        range: nextRange,
        start_date: nextRange === 'custom' ? nextStart : '',
        end_date: nextRange === 'custom' ? nextEnd : '',
      })
      setData(payload)
    } catch (err) {
      console.error('Failed to load dashboard summary:', err)
      setError(err.message || 'Unable to load dashboard analytics.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    document.title = 'Admin — Dashboard'
    loadDashboard('30d', '', '')
  }, [])

  const handleRangeApply = () => {
    loadDashboard(range, startDate, endDate)
  }

  const summaryCards = useMemo(() => {
    if (!data) return []

    return [
      { label: 'Revenue', value: formatCurrency(data.revenue?.range || data.summary?.total_revenue || 0), icon: DollarSign, bg: '#ECFDF5', color: '#059669' },
      { label: 'Orders', value: data.summary?.total_orders ?? 0, icon: ShoppingCart, bg: '#EFF6FF', color: '#2563EB' },
      { label: 'Customers', value: data.customers?.total ?? data.summary?.total_customers ?? 0, icon: Users, bg: '#FFF1EA', color: '#FF5A1F' },
      { label: 'Products', value: data.summary?.total_products ?? 0, icon: Package, bg: '#F5F3FF', color: '#7C3AED' },
    ]
  }, [data])

  const salesTrendMax = useMemo(() => {
    if (!data?.salesTrend?.length) return 1
    return Math.max(...data.salesTrend.map((item) => Number(item.revenue || 0)), 1)
  }, [data])

  return (
    <div>
      <div className="admin-page__header">
        <div>
          <h1 className="admin-page__title">Dashboard</h1>
          <p className="admin-page__sub">Live sales, orders, customer, and inventory overview.</p>
        </div>
        <Link to="/admin/products/new" className="admin-btn admin-btn-primary">
          <ArrowRight size={16} /> Add Product
        </Link>
      </div>

      <div className="admin-panel admin-dashboard-filter">
        <div className="admin-dashboard-filter__controls">
          <div className="admin-dashboard-filter__label">
            <Filter size={15} />
            <span>Date range</span>
          </div>
          <select value={range} onChange={(e) => setRange(e.target.value)} className="admin-select">
            {RANGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        {range === 'custom' && (
          <div className="admin-dashboard-filter__custom">
            <label>
              <span>From</span>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </label>
            <label>
              <span>To</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </label>
          </div>
        )}

        <button type="button" className="admin-btn admin-btn-primary" onClick={handleRangeApply}>
          <CalendarRange size={15} /> Apply
        </button>
      </div>

      {error && (
        <div className="admin-alert admin-alert--error" style={{ marginBottom: 20 }}>
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="admin-empty">Loading live dashboard data...</div>
      ) : data ? (
        <>
          <div className="admin-stats">
            {summaryCards.map(({ label, value, icon: Icon, bg, color }) => (
              <div className="admin-stat-card" key={label}>
                <div>
                  <div className="admin-stat-card__value">{value}</div>
                  <div className="admin-stat-card__label">{label}</div>
                </div>
                <div className="admin-stat-card__icon" style={{ background: bg, color }}>
                  <Icon size={20} />
                </div>
              </div>
            ))}
          </div>

          <div className="admin-dashboard-grid">
            <div className="admin-panel admin-dashboard-panel">
              <div className="admin-panel__header">
                <h3>Revenue overview</h3>
              </div>
              <div className="admin-dashboard-metrics">
                <div>
                  <span>Selected period</span>
                  <strong>{formatCurrency(data.revenue?.range || 0)}</strong>
                </div>
                <div>
                  <span>Today</span>
                  <strong>{formatCurrency(data.revenue?.today || 0)}</strong>
                </div>
                <div>
                  <span>This month</span>
                  <strong>{formatCurrency(data.revenue?.this_month || 0)}</strong>
                </div>
              </div>
              <div className="admin-dashboard-bars">
                {data.salesTrend?.length ? (
                  data.salesTrend.map((point) => (
                    <div key={point.date} className="admin-dashboard-bar-wrap">
                      <div className="admin-dashboard-bar" style={{ height: `${Math.max((Number(point.revenue) / salesTrendMax) * 100, 6)}%` }} />
                      <span>{new Date(point.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    </div>
                  ))
                ) : (
                  <div className="admin-empty admin-empty--compact">No revenue data for the selected period.</div>
                )}
              </div>
            </div>

            <div className="admin-panel admin-dashboard-panel">
              <div className="admin-panel__header">
                <h3>Order status</h3>
              </div>
              <div className="admin-progress-list">
                {(data.orderStatus || []).map((item) => {
                  const max = Math.max(...(data.orderStatus || []).map((entry) => Number(entry.count || 0)), 1)
                  const width = Math.max((Number(item.count || 0) / max) * 100, item.count ? 10 : 0)
                  return (
                    <div key={item.status} className="admin-progress-row">
                      <div className="admin-progress-row__meta">
                        <span>{item.status}</span>
                        <strong>{item.count}</strong>
                      </div>
                      <div className="admin-progress-row__bar">
                        <span style={{ width: `${width}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="admin-dashboard-grid admin-dashboard-grid--three">
            <div className="admin-panel admin-dashboard-panel">
              <div className="admin-panel__header">
                <h3>Top products</h3>
              </div>
              <div className="admin-list-table">
                {data.topProducts?.length ? (
                  <table>
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Units</th>
                        <th>Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.topProducts.map((product) => (
                        <tr key={`${product.product}-${product.sport}`}>
                          <td>
                            <div className="admin-list-table__primary">{product.product}</div>
                            <div className="admin-list-table__secondary">{product.sport}</div>
                          </td>
                          <td>{product.quantity}</td>
                          <td>{formatCurrency(product.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="admin-empty admin-empty--compact">No product sales recorded in this range.</div>
                )}
              </div>
            </div>

            <div className="admin-panel admin-dashboard-panel">
              <div className="admin-panel__header">
                <h3>Top sports</h3>
              </div>
              <div className="admin-list-stack">
                {(data.topSports || []).map((sport) => (
                  <div key={sport.sport} className="admin-mini-card">
                    <div>
                      <strong>{sport.sport}</strong>
                      <span>{sport.orders} orders</span>
                    </div>
                    <div className="admin-mini-card__value">{formatCurrency(sport.revenue)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="admin-panel admin-dashboard-panel">
              <div className="admin-panel__header">
                <h3>Customer insights</h3>
              </div>
              <div className="admin-list-stack">
                {(data.customers?.top_customers || []).map((customer, index) => (
                  <div key={`${customer.customer}-${index}`} className="admin-mini-card">
                    <div>
                      <strong>{customer.customer}</strong>
                      <span>{customer.orders} orders</span>
                    </div>
                    <div className="admin-mini-card__value">{formatCurrency(customer.total_spent)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="admin-dashboard-grid admin-dashboard-grid--two">
            <div className="admin-panel admin-dashboard-panel">
              <div className="admin-panel__header">
                <h3>Recent orders</h3>
              </div>
              <div className="admin-list-table">
                {data.recentOrders?.length ? (
                  <table>
                    <thead>
                      <tr>
                        <th>Order</th>
                        <th>Customer</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentOrders.map((order) => (
                        <tr key={order.id}>
                          <td>
                            <div className="admin-list-table__primary">{order.order_number}</div>
                            <div className="admin-list-table__secondary">{order.status}</div>
                          </td>
                          <td>{order.customer}</td>
                          <td>{formatCurrency(order.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="admin-empty admin-empty--compact">No recent orders in the current range.</div>
                )}
              </div>
            </div>

            <div className="admin-panel admin-dashboard-panel">
              <div className="admin-panel__header">
                <h3>Low stock</h3>
              </div>
              <div className="admin-list-table">
                {data.lowStock?.length ? (
                  <table>
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.lowStock.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <div className="admin-list-table__primary">{item.name}</div>
                            <div className="admin-list-table__secondary">{item.sport}</div>
                          </td>
                          <td>{item.stock}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="admin-empty admin-empty--compact">No products require restocking.</div>
                )}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}

export default AdminDashboard
