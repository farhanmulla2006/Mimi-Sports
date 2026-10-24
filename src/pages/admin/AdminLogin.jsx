// src/pages/admin/AdminLogin.jsx
// Admin Authentication Login Page

import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Lock, Mail, AlertCircle, ArrowLeft, Shield } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import './Admin.css'

function AdminLogin() {
  const { login, admin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const from = location.state?.from?.pathname || '/admin'

  // If already logged in, redirect to target or admin dashboard
  if (admin) {
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
      <div className="admin-login-card">
        <div className="admin-login-header">
          <div className="admin-login-badge">
            <Shield size={28} />
          </div>
          <h2>Admin Login</h2>
          <p>Mimi Sports Administration</p>
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
                placeholder="admin@mimisports.com"
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

          <button
            type="submit"
            className="admin-btn admin-btn-primary admin-login-submit"
            disabled={submitting}
          >
            {submitting ? 'Authenticating...' : 'Log In'}
          </button>
        </form>

        <div className="admin-login-footer">
          <Link to="/" className="admin-back-link">
            <ArrowLeft size={16} /> Return to Store Catalog
          </Link>
        </div>
      </div>
    </div>
  )
}

export default AdminLogin
