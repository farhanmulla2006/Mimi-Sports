import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'

function SportCard({ sport }) {
  return (
    <Link to={`/products?sport=${sport.id}`} className="sport-card">
      <img src={sport.image} alt={sport.name} loading="lazy" />
      <div className="sport-card__label">
        {sport.name}
        <span className="sport-card__arrow">
          <ArrowUpRight size={15} color="#fff" strokeWidth={2.5} />
        </span>
      </div>
    </Link>
  )
}

export default SportCard
