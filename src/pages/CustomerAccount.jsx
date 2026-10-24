import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { UserRound, Package, Heart, LogOut, ArrowLeft } from 'lucide-react'
import { useCustomerAuth } from '../context/CustomerAuthContext.jsx'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'

function CustomerAccount() {
  const { customer, logout, loading } = useCustomerAuth()
  const navigate = useNavigate()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    document.title = 'My Account'
  }, [])

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="section"><div className="container account-empty" style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading account...</div></main>
        <Footer />
      </>
    )
  }

  if (!customer) {
    navigate('/login', { replace: true })
    return null
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout()
      navigate('/', { replace: true })
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <>
      <Navbar />
      <main className="section">
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
            <div>
              <p style={{ textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-accent)', fontWeight: 800, fontSize: 12, margin: 0 }}>Customer Account</p>
              <h1 style={{ margin: '8px 0 0', fontSize: 'clamp(2rem, 3vw, 2.5rem)' }}>CUSTOMER ACCOUNT</h1>
            </div>
            <Link to="/" className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <ArrowLeft size={16} /> Continue shopping
            </Link>
          </div>

          <div className="account-shell" style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24 }}>
            <aside className="account-sidebar" style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 20, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--color-accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-accent)' }}>
                  <UserRound size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 800 }}>{customer.name}</div>
                  <div style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>{customer.email}</div>
                </div>
              </div>

              <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <NavLink to="/account" end className={({ isActive }) => `btn ${isActive ? 'btn-dark' : 'btn-secondary'} account-nav-link`} style={{ justifyContent: 'flex-start' }}>
                  <UserRound size={16} /> Profile
                </NavLink>
                <NavLink to="/account/orders" className={({ isActive }) => `btn ${isActive ? 'btn-dark' : 'btn-secondary'} account-nav-link`} style={{ justifyContent: 'flex-start' }}>
                  <Package size={16} /> My Orders
                </NavLink>
                <NavLink to="/wishlist" className={({ isActive }) => `btn ${isActive ? 'btn-dark' : 'btn-secondary'} account-nav-link`} style={{ justifyContent: 'flex-start' }}>
                  <Heart size={16} /> Wishlist
                </NavLink>
                <button type="button" className="btn btn-secondary" onClick={handleLogout} disabled={isLoggingOut} style={{ justifyContent: 'flex-start' }}>
                  <LogOut size={16} /> {isLoggingOut ? 'Logging out...' : 'Logout'}
                </button>
              </nav>
            </aside>

            <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 20, padding: 24 }}>
              <Outlet />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

export default CustomerAccount
