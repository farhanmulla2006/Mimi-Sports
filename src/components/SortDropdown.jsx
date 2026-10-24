import { ArrowUpDown } from 'lucide-react'
import './SortDropdown.css'

export const SORT_OPTIONS = [
  { id: 'relevance', label: 'Relevance' },
  { id: 'price-asc', label: 'Price: Low to High' },
  { id: 'price-desc', label: 'Price: High to Low' },
  { id: 'rating', label: 'Rating' },
  { id: 'newest', label: 'Newest' },
  { id: 'popular', label: 'Popular' },
  { id: 'discount', label: 'Discount' },
]

function SortDropdown({ value, onChange, className = '' }) {
  return (
    <label className={`sort-dropdown ${className}`}>
      <ArrowUpDown size={15} className="sort-dropdown__icon" />
      <span className="sort-dropdown__label">Sort:</span>
      <select
        className="sort-dropdown__select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Sort products"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.id} value={opt.id}>{opt.label}</option>
        ))}
      </select>
    </label>
  )
}

export default SortDropdown
