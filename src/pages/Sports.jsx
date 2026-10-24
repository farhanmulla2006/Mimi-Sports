import { useEffect } from 'react'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import PageHeader from '../components/PageHeader.jsx'
import SportDiscoveryCard from '../components/SportDiscoveryCard.jsx'
import { SPORT_META } from '../data/products.js'

const POPULAR_IDS = ['cricket', 'football', 'badminton', 'running']

function Sports() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const popularSports = SPORT_META.filter((s) => POPULAR_IDS.includes(s.id))

  return (
    <>
      <Navbar />
      <main>
        <PageHeader
          eyebrow="Browse by discipline"
          title="Shop by Sport"
          subtitle="Everything you need for your favorite sport, all in one place."
          breadcrumbItems={[{ label: 'Home', href: '/' }, { label: 'Sports' }]}
        />

        <section className="section">
          <div className="container">
            <div className="grid-4 sports-grid">
              {SPORT_META.map((sport) => (
                <SportDiscoveryCard key={sport.id} sport={sport} />
              ))}
            </div>
          </div>
        </section>

        <section className="section" style={{ background: 'var(--color-white)', paddingTop: 0 }}>
          <div className="container">
            <div className="section-head">
              <div>
                <span className="section-eyebrow">Fan favorites</span>
                <h2 className="section-title">Most Popular Sports</h2>
              </div>
            </div>

            <div className="grid-4">
              {popularSports.map((sport) => (
                <SportDiscoveryCard key={sport.id} sport={sport} featured />
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

export default Sports
