import { useEffect, useState } from 'react'
import { CheckCircle2, Pencil, Star, Trash2 } from 'lucide-react'
import { useCustomerAuth } from '../context/CustomerAuthContext.jsx'
import {
  createProductReview,
  deleteProductReview,
  fetchProductReviews,
  updateProductReview,
} from '../services/api.js'

const EMPTY_DATA = { reviews: [], summary: { average_rating: 0, review_count: 0 }, can_review: false, own_review: null }

function Stars({ rating, interactive = false, onChange }) {
  return (
    <span className="reviews-stars" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((value) => (
        <button
          key={value}
          type={interactive ? 'button' : undefined}
          className={interactive ? 'reviews-star-button' : 'reviews-star-static'}
          onClick={interactive ? () => onChange(value) : undefined}
          aria-label={interactive ? `Rate ${value} stars` : undefined}
        >
          <Star size={interactive ? 22 : 16} fill={value <= rating ? '#FF5A1F' : 'none'} color={value <= rating ? '#FF5A1F' : '#CBD5E1'} />
        </button>
      ))}
    </span>
  )
}

function ProductReviews({ productId, onSummaryChange }) {
  const { customer } = useCustomerAuth()
  const [data, setData] = useState(EMPTY_DATA)
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [rating, setRating] = useState(5)
  const [reviewText, setReviewText] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const loadReviews = async () => {
    setLoading(true)
    try {
      const response = await fetchProductReviews(productId)
      setData(response)
      onSummaryChange?.(response.summary || EMPTY_DATA.summary)
    } catch (err) {
      setError(err.message || 'Unable to load reviews.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setData(EMPTY_DATA)
    setError('')
    loadReviews()
  }, [productId])

  const beginEdit = (review) => {
    setEditingId(review.id)
    setRating(review.rating)
    setReviewText(review.review_text)
    setFormOpen(true)
    setMessage('')
  }

  const submitReview = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setMessage('')
    try {
      if (editingId) {
        await updateProductReview(editingId, rating, reviewText)
        setMessage('Review updated successfully.')
      } else {
        await createProductReview(productId, rating, reviewText)
        setMessage('Review submitted successfully.')
      }
      setEditingId(null)
      setReviewText('')
      setRating(5)
      setFormOpen(false)
      await loadReviews()
    } catch (err) {
      setError(err.message || 'Unable to save review.')
    } finally {
      setSubmitting(false)
    }
  }

  const deleteReview = async (reviewId) => {
    if (!window.confirm('Delete your review?')) return
    setError('')
    try {
      await deleteProductReview(reviewId)
      setMessage('Review deleted successfully.')
      await loadReviews()
    } catch (err) {
      setError(err.message || 'Unable to delete review.')
    }
  }

  return (
    <section className="section" style={{ paddingTop: 0 }}>
      <div className="container">
        <div className="section-head">
          <div>
            <span className="section-eyebrow">Customer feedback</span>
            <h2 className="section-title">Reviews & Ratings</h2>
            <p className="section-sub">{data.summary.review_count} review{data.summary.review_count === 1 ? '' : 's'} from Mimi Sports customers.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800 }}>
            <Stars rating={Math.round(data.summary.average_rating)} />
            <span>{Number(data.summary.average_rating || 0).toFixed(1)}</span>
          </div>
        </div>

        {message && <div className="admin-alert admin-alert--success" style={{ marginBottom: 16 }}>{message}</div>}
        {error && <div className="admin-alert admin-alert--error" style={{ marginBottom: 16 }}>{error}</div>}

        {customer && data.can_review && !formOpen && (
          <button type="button" className="btn btn-primary" onClick={() => setFormOpen(true)} style={{ marginBottom: 24 }}>
            Write a Review
          </button>
        )}
        {!customer && data.reviews.length > 0 && (
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 24 }}>Log in after purchasing this product to leave a review.</p>
        )}

        {formOpen && (
          <form onSubmit={submitReview} className="reviews-form">
            <h3>{editingId ? 'Edit Your Review' : 'Write a Review'}</h3>
            <label>Rating</label>
            <Stars rating={rating} interactive onChange={setRating} />
            <label htmlFor="review-text">Review</label>
            <textarea id="review-text" rows={4} maxLength={1000} value={reviewText} onChange={(event) => setReviewText(event.target.value)} placeholder="Share your experience with this product..." required />
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving...' : editingId ? 'Update Review' : 'Submit Review'}</button>
              <button type="button" className="btn btn-secondary" onClick={() => { setFormOpen(false); setEditingId(null) }}>Cancel</button>
            </div>
          </form>
        )}

        {loading ? <p>Loading reviews...</p> : data.reviews.length === 0 ? (
          <div className="wishlist-empty" style={{ padding: '36px 24px' }}><h3>No reviews yet</h3><p>Be the first verified customer to review this product.</p></div>
        ) : (
          <div className="reviews-list">
            {data.reviews.map((review) => (
              <article className="review-item" key={review.id}>
                <div className="review-item__header">
                  <div>
                    <strong>{review.customer_name}</strong>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                      <Stars rating={review.rating} />
                      {review.verified_purchase && <span className="verified-badge"><CheckCircle2 size={14} /> Verified Purchase</span>}
                    </div>
                  </div>
                  <time dateTime={review.created_at}>{new Date(review.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</time>
                </div>
                <p>{review.review_text}</p>
                {review.is_owner && (
                  <div className="review-item__actions">
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => beginEdit(review)}><Pencil size={14} /> Edit</button>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => deleteReview(review.id)}><Trash2 size={14} /> Delete</button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default ProductReviews