import { SearchX } from 'lucide-react'
import './EmptyState.css'

function EmptyState({ onClear }) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon"><SearchX size={30} /></div>
      <h3 className="empty-state__title">No Products Found</h3>
      <p className="empty-state__sub">Try changing your search or filters.</p>
      <button className="btn btn-dark" onClick={onClear}>Clear Filters</button>
    </div>
  )
}

export default EmptyState
