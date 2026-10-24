import { SPORT_META, CATEGORY_LIST, BRAND_LIST, PRICE_RANGES } from '../data/products.js'
import './FilterSidebar.css'

const RATING_OPTIONS = [4, 3, 2]
const DISCOUNT_OPTIONS = [10, 20, 30, 40]

function FilterGroup({ title, children }) {
  return (
    <div className="filter-group">
      <h4 className="filter-group__title">{title}</h4>
      {children}
    </div>
  )
}

function FilterSidebar({ filters, onChange }) {
  const toggleArrayValue = (key, value) => {
    const current = filters[key]
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value]
    onChange({ ...filters, [key]: next })
  }

  const setSingle = (key, value) => {
    onChange({ ...filters, [key]: filters[key] === value ? null : value })
  }

  return (
    <div className="filter-sidebar">
      <FilterGroup title="Sport">
        <label className="filter-option">
          <input
            type="radio"
            name="sport"
            checked={filters.sport === 'all'}
            onChange={() => onChange({ ...filters, sport: 'all' })}
          />
          <span>All Sports</span>
        </label>
        {SPORT_META.map((sport) => (
          <label className="filter-option" key={sport.id}>
            <input
              type="radio"
              name="sport"
              checked={filters.sport === sport.id}
              onChange={() => onChange({ ...filters, sport: sport.id })}
            />
            <span>{sport.name}</span>
          </label>
        ))}
      </FilterGroup>

      <FilterGroup title="Category">
        {CATEGORY_LIST.map((cat) => (
          <label className="filter-option" key={cat}>
            <input
              type="checkbox"
              checked={filters.categories.includes(cat)}
              onChange={() => toggleArrayValue('categories', cat)}
            />
            <span>{cat}</span>
          </label>
        ))}
      </FilterGroup>

      <FilterGroup title="Brand">
        {BRAND_LIST.map((brand) => (
          <label className="filter-option" key={brand}>
            <input
              type="checkbox"
              checked={filters.brands.includes(brand)}
              onChange={() => toggleArrayValue('brands', brand)}
            />
            <span>{brand}</span>
          </label>
        ))}
      </FilterGroup>

      <FilterGroup title="Price">
        {PRICE_RANGES.map((range) => (
          <label className="filter-option" key={range.id}>
            <input
              type="radio"
              name="price"
              checked={filters.priceRange === range.id}
              onChange={() => setSingle('priceRange', range.id)}
            />
            <span>{range.label}</span>
          </label>
        ))}
      </FilterGroup>

      <FilterGroup title="Rating">
        {RATING_OPTIONS.map((r) => (
          <label className="filter-option" key={r}>
            <input
              type="radio"
              name="rating"
              checked={filters.minRating === r}
              onChange={() => setSingle('minRating', r)}
            />
            <span>{'★'.repeat(r)} {r}+</span>
          </label>
        ))}
      </FilterGroup>

      <FilterGroup title="Discount">
        {DISCOUNT_OPTIONS.map((d) => (
          <label className="filter-option" key={d}>
            <input
              type="radio"
              name="discount"
              checked={filters.minDiscount === d}
              onChange={() => setSingle('minDiscount', d)}
            />
            <span>{d}%+</span>
          </label>
        ))}
      </FilterGroup>

      <FilterGroup title="Availability">
        <label className="filter-option">
          <input
            type="checkbox"
            checked={filters.inStockOnly}
            onChange={() => onChange({ ...filters, inStockOnly: !filters.inStockOnly })}
          />
          <span>In Stock</span>
        </label>
      </FilterGroup>
    </div>
  )
}

export default FilterSidebar
