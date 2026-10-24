import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'

function CategoryCard({ category }) {
  return (
    <Link to={`/products?category=${category.id}`} className="category-card">
      <img src={category.image} alt={category.name} loading="lazy" />
      <div className="category-card__content">
        <div className="category-card__name">{category.name}</div>
        <div className="category-card__tagline">{category.tagline}</div>
        <span className="category-card__link">
          Shop {category.name} <ArrowUpRight size={14} strokeWidth={2.5} />
        </span>
      </div>
    </Link>
  )
}

export default CategoryCard
