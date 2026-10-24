import { Star } from 'lucide-react'

function ReviewCard({ review }) {
  return (
    <div className="review-card">
      <div className="review-card__stars">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={16}
            fill={i < review.rating ? '#FF5A1F' : 'none'}
            color="#FF5A1F"
            strokeWidth={1.5}
          />
        ))}
      </div>
      <p className="review-card__text">“{review.review}”</p>
      <div className="review-card__author">
        <img className="review-card__avatar" src={review.avatar} alt={review.name} loading="lazy" />
        <div>
          <div className="review-card__name">{review.name}</div>
          <div className="review-card__role">Verified Buyer</div>
        </div>
      </div>
    </div>
  )
}

export default ReviewCard
