import { useEffect, useState } from 'react'
import { PencilLine } from 'lucide-react'
import { useCustomerAuth } from '../context/CustomerAuthContext.jsx'

function CustomerAccountProfile() {
  const { customer, updateProfile } = useCustomerAuth()
  const [form, setForm] = useState({ name: '', phone: '' })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (customer) {
      setForm({ name: customer.name || '', phone: customer.phone || '' })
    }
  }, [customer])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')

    try {
      await updateProfile({ name: form.name.trim(), phone: form.phone.trim() })
      setMessage('Profile updated successfully.')
    } catch (err) {
      setError(err.message || 'Unable to update profile.')
    } finally {
      setSaving(false)
    }
  }

  if (!customer) return null

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: 0 }}>Profile Details</h2>
          <p style={{ margin: '8px 0 0', color: 'var(--color-text-secondary)' }}>View and update your basic account information.</p>
        </div>
        <span className="admin-badge admin-badge--confirmed">{customer.status}</span>
      </div>

      {message && <div className="admin-alert admin-alert--success" style={{ marginBottom: 16 }}><span>{message}</span></div>}
      {error && <div className="admin-alert admin-alert--error" style={{ marginBottom: 16 }}><span>{error}</span></div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 18 }}>
        <div className="detail-card" style={{ background: '#f8fafc', border: '1px solid var(--color-border)', borderRadius: 14, padding: 16 }}>
          <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-secondary)' }}>Name</div>
          <div style={{ fontWeight: 800, marginTop: 6 }}>{customer.name}</div>
        </div>
        <div className="detail-card" style={{ background: '#f8fafc', border: '1px solid var(--color-border)', borderRadius: 14, padding: 16 }}>
          <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-secondary)' }}>Email</div>
          <div style={{ fontWeight: 800, marginTop: 6 }}>{customer.email}</div>
        </div>
        <div className="detail-card" style={{ background: '#f8fafc', border: '1px solid var(--color-border)', borderRadius: 14, padding: 16 }}>
          <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-secondary)' }}>Phone</div>
          <div style={{ fontWeight: 800, marginTop: 6 }}>{customer.phone || 'Not provided'}</div>
        </div>
        <div className="detail-card" style={{ background: '#f8fafc', border: '1px solid var(--color-border)', borderRadius: 14, padding: 16 }}>
          <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-secondary)' }}>Member Since</div>
          <div style={{ fontWeight: 800, marginTop: 6 }}>{new Date(customer.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ borderTop: '1px solid var(--color-border)', paddingTop: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <PencilLine size={18} />
          <h3 style={{ margin: 0 }}>Edit Profile</h3>
        </div>

        <div className="checkout-form-group" style={{ maxWidth: 520 }}>
          <div className="checkout-field">
            <label>Full Name</label>
            <input type="text" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
          </div>
          <div className="checkout-field">
            <label>Phone Number</label>
            <input type="tel" value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} />
          </div>
        </div>

        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Update Profile'}
        </button>
      </form>
    </div>
  )
}

export default CustomerAccountProfile
