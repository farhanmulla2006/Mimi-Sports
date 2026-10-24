import { reviews } from '../data/mockData.js'
import ReviewCard from './ReviewCard.jsx'

function CustomerReviews() {
  return (
    <section className="section" style={{ background: 'var(--color-white)' }}>
      <div className="container">
        <div className="section-head">
          <div>
            <span className="section-eyebrow">Trusted by athletes</span>
            <h2 className="section-title">What Athletes Say</h2>
          </div>
        </div>

        <div className="grid-3-reviews">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default CustomerReviews
