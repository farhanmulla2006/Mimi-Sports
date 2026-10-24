import { categories } from '../data/mockData.js'
import CategoryCard from './CategoryCard.jsx'

function ShopByCategory() {
  return (
    <section className="section" style={{ background: 'var(--color-white)' }}>
      <div className="container">
        <div className="section-head">
          <div>
            <span className="section-eyebrow">Find your fit</span>
            <h2 className="section-title">Shop by Category</h2>
          </div>
        </div>

        <div className="grid-4">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default ShopByCategory
