import { ArrowRight, Compass, ShieldCheck, Truck, Star } from 'lucide-react'
import './Hero.css'

function Hero() {
  return (
    <section className="hero">
      <div className="container hero__inner">
        <div className="hero__content">
          <span className="hero__eyebrow">Gear Up. Play More.</span>
          <h1 className="hero__headline">
            EVERYTHING YOU NEED TO <span className="hero__headline-accent">PLAY YOUR BEST</span>
          </h1>
          <p className="hero__sub">
            Premium sportswear, equipment, footwear and accessories for every athlete.
          </p>
          <div className="hero__actions">
            <a href="#trending-products" className="btn btn-primary">
              Shop Now <ArrowRight size={16} strokeWidth={2.5} />
            </a>
            <a href="#shop-by-sport" className="btn btn-outline">
              <Compass size={16} strokeWidth={2.5} /> Explore Sports
            </a>
          </div>

          <div className="hero__stats">
            <div className="hero__stat">
              <strong>40K+</strong>
              <span>Athletes served</span>
            </div>
            <div className="hero__stat-divider" />
            <div className="hero__stat">
              <strong>8</strong>
              <span>Sports covered</span>
            </div>
            <div className="hero__stat-divider" />
            <div className="hero__stat">
              <strong>4.8<Star size={13} fill="#FF5A1F" color="#FF5A1F" /></strong>
              <span>Average rating</span>
            </div>
          </div>
        </div>

        <div className="hero__media">
          <div className="hero__media-frame">
            <img
              src="https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=1200&auto=format&fit=crop"
              alt="Athlete gearing up with sports equipment"
            />
          </div>

          <div className="hero__floating-card hero__floating-card--top">
            <div className="hero__floating-icon"><ShieldCheck size={18} /></div>
            <div>
              <strong>Authentic Gear</strong>
              <span>100% verified brands</span>
            </div>
          </div>

          <div className="hero__floating-card hero__floating-card--bottom">
            <div className="hero__floating-icon hero__floating-icon--accent"><Truck size={18} /></div>
            <div>
              <strong>Fast Delivery</strong>
              <span>Pan-India shipping</span>
            </div>
          </div>
        </div>
      </div>

      <div className="hero__marquee">
        <div className="hero__marquee-track">
          {Array.from({ length: 2 }).map((_, i) => (
            <div className="hero__marquee-group" key={i}>
              <span>CRICKET</span><span className="hero__dot">•</span>
              <span>FOOTBALL</span><span className="hero__dot">•</span>
              <span>BASKETBALL</span><span className="hero__dot">•</span>
              <span>BADMINTON</span><span className="hero__dot">•</span>
              <span>TENNIS</span><span className="hero__dot">•</span>
              <span>RUNNING</span><span className="hero__dot">•</span>
              <span>FITNESS</span><span className="hero__dot">•</span>
              <span>VOLLEYBALL</span><span className="hero__dot">•</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Hero
