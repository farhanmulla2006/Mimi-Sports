import { Zap, ArrowRight } from 'lucide-react'
import './OfferBanner.css'

function OfferBanner() {
  return (
    <section className="offer" id="offers">
      <div className="container offer__inner">
        <div className="offer__badge">
          <Zap size={14} fill="#111827" /> Limited time
        </div>
        <h2 className="offer__title">
          TRAIN HARD.<br /><span>SAVE MORE.</span>
        </h2>
        <p className="offer__sub">UP TO 40% OFF SPORTS GEAR</p>
        <a href="#trending-products" className="btn btn-dark offer__cta">
          Shop Offers <ArrowRight size={16} strokeWidth={2.5} />
        </a>
      </div>
      <div className="offer__stripes" aria-hidden="true">
        <span></span><span></span><span></span><span></span><span></span>
      </div>
    </section>
  )
}

export default OfferBanner
