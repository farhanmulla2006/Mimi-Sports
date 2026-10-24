import { X } from 'lucide-react'
import { SPORT_META, PRICE_RANGES } from '../data/products.js'
import './ActiveFilters.css'

function ActiveFilters({ filters, searchTerm, onChange, onSearchChange, onClearAll }) {
  const chips = []

  if (searchTerm) {
    chips.push({ key: 'search', label: `"${searchTerm}"`, onRemove: () => onSearchChange('') })
  }

  if (filters.sport !== 'all') {
    const sport = SPORT_META.find((s) => s.id === filters.sport)
    chips.push({
      key: 'sport',
      label: sport ? sport.name : filters.sport,
      onRemove: () => onChange({ ...filters, sport: 'all' }),
    })
  }

  filters.categories.forEach((cat) => {
    chips.push({
      key: `cat-${cat}`,
      label: cat,
      onRemove: () => onChange({ ...filters, categories: filters.categories.filter((c) => c !== cat) }),
    })
  })

  filters.brands.forEach((brand) => {
    chips.push({
      key: `brand-${brand}`,
      label: brand,
      onRemove: () => onChange({ ...filters, brands: filters.brands.filter((b) => b !== brand) }),
    })
  })

  if (filters.priceRange) {
    const range = PRICE_RANGES.find((r) => r.id === filters.priceRange)
    chips.push({
      key: 'price',
      label: range ? range.label : filters.priceRange,
      onRemove: () => onChange({ ...filters, priceRange: null }),
    })
  }

  if (filters.minRating) {
    chips.push({
      key: 'rating',
      label: `${filters.minRating}★ & up`,
      onRemove: () => onChange({ ...filters, minRating: null }),
    })
  }

  if (filters.minDiscount) {
    chips.push({
      key: 'discount',
      label: `${filters.minDiscount}% off & up`,
      onRemove: () => onChange({ ...filters, minDiscount: null }),
    })
  }

  if (filters.inStockOnly) {
    chips.push({
      key: 'stock',
      label: 'In Stock',
      onRemove: () => onChange({ ...filters, inStockOnly: false }),
    })
  }

  if (chips.length === 0) return null

  return (
    <div className="active-filters">
      <span className="active-filters__label">Filters:</span>
      <div className="active-filters__chips">
        {chips.map((chip) => (
          <button key={chip.key} className="active-filters__chip" onClick={chip.onRemove}>
            {chip.label} <X size={13} strokeWidth={2.5} />
          </button>
        ))}
      </div>
      <button className="active-filters__clear" onClick={onClearAll}>Clear All</button>
    </div>
  )
}

export default ActiveFilters
