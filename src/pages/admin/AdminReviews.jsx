import { useEffect, useState } from 'react'
import { Search, Star, Trash2, AlertCircle } from 'lucide-react'
import { deleteAdminReview, fetchAdminReviews } from '../../services/api.js'
import './Admin.css'

function AdminReviews() {
  const [reviews, setReviews] = useState([])
  const [search, setSearch] = useState('')
  const [rating, setRating] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadReviews = async () => {
    setLoading(true)
    setError('')
    try {
      setReviews(await fetchAdminReviews({ search, rating }))
    } catch (err) {
      setError(err.message || 'Unable to load reviews.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    document.title = 'Admin - Reviews'
    loadReviews()
  }, [search, rating])

  const removeReview = async (reviewId) => {
    if (!window.confirm('Delete this review?')) return
    try {
      await deleteAdminReview(reviewId)
      setReviews((current) => current.filter((review) => review.id !== reviewId))
    } catch (err) {
      setError(err.message || 'Unable to delete review.')
    }
  }

  return (
    <div>
      <div className="admin-page__header">
        <div>
          <h1 className="admin-page__title">Product Reviews</h1>
          <p className="admin-page__sub">Review customer feedback and remove inappropriate content.</p>
        </div>
      </div>

      {error && <div className="admin-alert admin-alert--error"><AlertCircle size={18} /> <span>{error}</span></div>}

      <div className="admin-panel">
        <div className="admin-toolbar">
          <div className="admin-toolbar__search">
            <Search size={16} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search product, customer, review..." />
          </div>
          <select className="admin-select" value={rating} onChange={(event) => setRating(event.target.value)}>
            <option value="all">All ratings</option>
            {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} stars</option>)}
          </select>
        </div>

        {loading ? <div className="admin-empty">Loading reviews...</div> : reviews.length === 0 ? <div className="admin-empty">No reviews found.</div> : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Product</th><th>Customer</th><th>Rating</th><th>Review</th><th>Date</th><th>Action</th></tr></thead>
              <tbody>
                {reviews.map((review) => (
                  <tr key={review.id}>
                    <td><strong>{review.product_name}</strong></td>
                    <td>{review.customer_name}</td>
                    <td><span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Star size={14} fill="#FF5A1F" color="#FF5A1F" /> {review.rating}/5</span></td>
                    <td style={{ maxWidth: 360 }}>{review.review_text}</td>
                    <td>{new Date(review.created_at).toLocaleDateString('en-IN')}</td>
                    <td><button type="button" className="admin-btn admin-btn-danger" onClick={() => removeReview(review.id)}><Trash2 size={14} /> Delete</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminReviews