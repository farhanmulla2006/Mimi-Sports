import Navbar from '../components/Navbar.jsx'
import Hero from '../components/Hero.jsx'
import ShopBySport from '../components/ShopBySport.jsx'
import TrendingProducts from '../components/TrendingProducts.jsx'
import ShopByCategory from '../components/ShopByCategory.jsx'
import OfferBanner from '../components/OfferBanner.jsx'
import CustomerReviews from '../components/CustomerReviews.jsx'
import Newsletter from '../components/Newsletter.jsx'
import Footer from '../components/Footer.jsx'

function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <ShopBySport />
        <TrendingProducts />
        <ShopByCategory />
        <OfferBanner />
        <CustomerReviews />
        <Newsletter />
      </main>
      <Footer />
    </>
  )
}

export default Home
