import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Mail, Lock, AlertCircle, ArrowLeft } from 'lucide-react'
import { useCustomerAuth } from '../context/CustomerAuthContext.jsx'

function CustomerLogin() {
  const { customer, login } = useCustomerAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const from = location.state?.from?.pathname || '/account'

  if (customer) {
    navigate(from, { replace: true })
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      await login(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message || 'Invalid email or password.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-card" style={{ maxWidth: 460 }}>
        <div className="admin-login-header">
          <div className="admin-login-badge" style={{ background: 'var(--color-accent-soft)' }}>
            <Lock size={28} />
          </div>
          <h2>Customer Login</h2>
          <p>Welcome back to Mimi Sports</p>
        </div>

        {error && (
          <div className="admin-login-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="admin-field">
            <label>Email Address</label>
            <div className="admin-input-icon-wrap">
              <Mail size={18} className="admin-input-icon" />
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="admin-field">
            <label>Password</label>
            <div className="admin-input-icon-wrap">
              <Lock size={18} className="admin-input-icon" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="admin-btn admin-btn-primary admin-login-submit" disabled={submitting}>
            {submitting ? 'Signing in...' : 'Login'}
          </button>
        </form>

        <div className="admin-login-footer" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <Link to="/register" className="admin-back-link">Create account</Link>
          <Link to="/" className="admin-back-link">
            <ArrowLeft size={16} /> Back to store
          </Link>
        </div>
      </div>
    </div>
  )
}

export default CustomerLogin
