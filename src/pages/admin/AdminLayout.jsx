import { NavLink, Outlet, Link, useNavigate, useLocation, Navigate } from 'react-router-dom'
import {
  LayoutDashboard, Package, PlusCircle, UploadCloud, ShoppingCart, Users, Settings, ArrowLeft, LogOut, UserCheck, Star,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import './Admin.css'

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/products/new', label: 'Add Product', icon: PlusCircle },
  { to: '/admin/products/import', label: 'Bulk Import', icon: UploadCloud },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/admin/reviews', label: 'Reviews', icon: Star },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
]

function AdminLayout() {
  const { admin, loading, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="admin-empty" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Verifying admin session...
      </div>
    )
  }

  if (!admin) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  const handleLogout = async () => {
    await logout()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="admin">
      <aside className="admin__sidebar">
        <Link to="/" className="admin__logo">
          <span className="admin__logo-mark">M</span>
          <span className="admin__logo-text">MIMI<span className="admin__logo-accent">SPORTS</span></span>
        </Link>
        <span className="admin__logo-sub">Admin</span>

        <div className="admin__user-badge">
          <UserCheck size={14} />
          <span>{admin.name || admin.email}</span>
        </div>

        <nav className="admin__nav">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `admin__nav-link ${isActive ? 'is-active' : ''}`}
            >
              <Icon size={18} strokeWidth={2} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="admin__sidebar-footer">
          <button onClick={handleLogout} className="admin__logout-btn">
            <LogOut size={16} /> <span>Logout</span>
          </button>
          <Link to="/" className="admin__back-link">
            <ArrowLeft size={16} /> <span>Back to Store</span>
          </Link>
        </div>
      </aside>

      <main className="admin__content">
        <Outlet />
      </main>
    </div>
  )
}

export default AdminLayout
