import { useEffect } from 'react'
import { X } from 'lucide-react'
import FilterSidebar from './FilterSidebar.jsx'
import './MobileFilterDrawer.css'

function MobileFilterDrawer({ open, onClose, filters, onChange, resultCount }) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="mobile-drawer">
      <div className="mobile-drawer__backdrop" onClick={onClose} />
      <div className="mobile-drawer__panel">
        <div className="mobile-drawer__header">
          <h3>Filters</h3>
          <button className="mobile-drawer__close" onClick={onClose} aria-label="Close filters">
            <X size={20} />
          </button>
        </div>
        <div className="mobile-drawer__body">
          <FilterSidebar filters={filters} onChange={onChange} />
        </div>
        <div className="mobile-drawer__footer">
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={onClose}>
            Show {resultCount} Results
          </button>
        </div>
      </div>
    </div>
  )
}

export default MobileFilterDrawer
