import { useState } from 'react'
import { Send } from 'lucide-react'
import './Newsletter.css'

function Newsletter() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!email) return
    setSubmitted(true)
  }

  return (
    <section className="newsletter">
      <div className="container newsletter__inner">
        <div className="newsletter__copy">
          <h2 className="newsletter__title">Stay in the Game</h2>
          <p className="newsletter__sub">Get updates about new products, exclusive offers and sports gear.</p>
        </div>

        <div className="newsletter__form">
          <input
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="newsletter__input"
            aria-label="Email address"
          />
          <button className="btn btn-primary" onClick={handleSubmit}>
            Subscribe <Send size={15} strokeWidth={2.5} />
          </button>
        </div>
        {submitted && <p className="newsletter__confirm">You're subscribed! Watch your inbox for the next drop.</p>}
      </div>
    </section>
  )
}

export default Newsletter
