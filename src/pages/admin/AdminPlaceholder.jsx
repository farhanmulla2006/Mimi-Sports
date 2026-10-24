import { Construction } from 'lucide-react'

function AdminPlaceholder({ title }) {
  return (
    <div>
      <div className="admin-page__header">
        <div>
          <h1 className="admin-page__title">{title}</h1>
        </div>
      </div>
      <div className="admin-placeholder">
        <Construction size={28} style={{ marginBottom: 12, opacity: 0.5 }} />
        <p style={{ fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>{title} is not implemented yet</p>
        <p style={{ fontSize: 13 }}>This section is a placeholder for a future phase — no functionality here yet, intentionally.</p>
      </div>
    </div>
  )
}

export default AdminPlaceholder
