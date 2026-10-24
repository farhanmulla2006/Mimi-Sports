import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import './SportDiscoveryCard.css'

function SportDiscoveryCard({ sport, featured = false }) {
  return (
    <Link
      to={`/products?sport=${sport.id}`}
      className={`sport-disc-card ${featured ? 'sport-disc-card--featured' : ''}`}
    >
      <img src={sport.image} alt={sport.name} loading="lazy" />
      <div className="sport-disc-card__content">
        <h3 className="sport-disc-card__name">{sport.name}</h3>
        <p className="sport-disc-card__desc">{sport.description}</p>
        <div className="sport-disc-card__foot">
          <span className="sport-disc-card__count">{sport.productCount}+ Products</span>
          <span className="sport-disc-card__cta">
            {featured ? 'Shop Now' : `Explore ${sport.name}`} <ArrowRight size={14} strokeWidth={2.5} />
          </span>
        </div>
      </div>
    </Link>
  )
}

export default SportDiscoveryCard
