import { Link } from 'react-router-dom'
import { sports } from '../data/mockData.js'
import SportCard from './SportCard.jsx'

function ShopBySport() {
  return (
    <section className="section" id="shop-by-sport">
      <div className="container">
        <div className="section-head">
          <div>
            <span className="section-eyebrow">Browse by discipline</span>
            <h2 className="section-title">Shop by Sport</h2>
          </div>
          <Link to="/sports" className="section-link">View All Sports →</Link>
        </div>

        <div className="grid-8">
          {sports.map((sport) => (
            <SportCard key={sport.id} sport={sport} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default ShopBySport
