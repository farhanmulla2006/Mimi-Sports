import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Mail, Phone, Lock, AlertCircle, ArrowLeft } from 'lucide-react'
import { useCustomerAuth } from '../context/CustomerAuthContext.jsx'

function CustomerRegister() {
  const { customer, register } = useCustomerAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  if (customer) {
    navigate('/account', { replace: true })
    return null
  }

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const validate = () => {
    const nextErrors = {}
    if (!form.name.trim()) nextErrors.name = 'Full name is required.'
    if (!form.email.trim()) nextErrors.email = 'Email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) nextErrors.email = 'Please enter a valid email address.'
    if (!form.phone.trim()) nextErrors.phone = 'Phone number is required.'
    else if (!/^[0-9+\-\s()]{7,20}$/.test(form.phone.trim())) nextErrors.phone = 'Please enter a valid phone number.'
    if (!form.password) nextErrors.password = 'Password is required.'
    else if (form.password.length < 6) nextErrors.password = 'Password must be at least 6 characters long.'
    if (!form.confirmPassword) nextErrors.confirmPassword = 'Please confirm your password.'
    else if (form.confirmPassword !== form.password) nextErrors.confirmPassword = 'Passwords do not match.'

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    try {
      await register(form.name.trim(), form.email.trim(), form.password, form.phone.trim())
      navigate('/account', { replace: true })
    } catch (err) {
      setErrors((prev) => ({ ...prev, submit: err.message || 'Registration failed.' }))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-card" style={{ maxWidth: 520 }}>
        <div className="admin-login-header">
          <div className="admin-login-badge" style={{ background: 'var(--color-accent-soft)' }}>
            <User size={28} />
          </div>
          <h2>Create Account</h2>
          <p>Register to track orders and manage your profile</p>
        </div>

        {errors.submit && (
          <div className="admin-login-error">
            <AlertCircle size={18} />
            <span>{errors.submit}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="admin-field">
            <label>Full Name</label>
            <div className="admin-input-icon-wrap">
              <User size={18} className="admin-input-icon" />
              <input type="text" value={form.name} onChange={(e) => setField('name', e.target.value)} />
            </div>
            {errors.name && <span className="checkout-field__error">{errors.name}</span>}
          </div>

          <div className="admin-field">
            <label>Email</label>
            <div className="admin-input-icon-wrap">
              <Mail size={18} className="admin-input-icon" />
              <input type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} />
            </div>
            {errors.email && <span className="checkout-field__error">{errors.email}</span>}
          </div>

          <div className="admin-field">
            <label>Phone</label>
            <div className="admin-input-icon-wrap">
              <Phone size={18} className="admin-input-icon" />
              <input type="tel" value={form.phone} onChange={(e) => setField('phone', e.target.value)} />
            </div>
            {errors.phone && <span className="checkout-field__error">{errors.phone}</span>}
          </div>

          <div className="admin-field">
            <label>Password</label>
            <div className="admin-input-icon-wrap">
              <Lock size={18} className="admin-input-icon" />
              <input type="password" value={form.password} onChange={(e) => setField('password', e.target.value)} />
            </div>
            {errors.password && <span className="checkout-field__error">{errors.password}</span>}
          </div>

          <div className="admin-field">
            <label>Confirm Password</label>
            <div className="admin-input-icon-wrap">
              <Lock size={18} className="admin-input-icon" />
              <input type="password" value={form.confirmPassword} onChange={(e) => setField('confirmPassword', e.target.value)} />
            </div>
            {errors.confirmPassword && <span className="checkout-field__error">{errors.confirmPassword}</span>}
          </div>

          <button type="submit" className="admin-btn admin-btn-primary admin-login-submit" disabled={submitting}>
            {submitting ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <div className="admin-login-footer" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <Link to="/login" className="admin-back-link">Already have an account?</Link>
          <Link to="/" className="admin-back-link">
            <ArrowLeft size={16} /> Back to store
          </Link>
        </div>
      </div>
    </div>
  )
}

export default CustomerRegister
