import { Instagram, Youtube, Facebook, Twitter } from 'lucide-react'
import './Footer.css'

const footerCols = [
  {
    title: 'Shop',
    links: ['Sports', 'Products', 'Offers', 'New Arrivals'],
  },
  {
    title: 'Customer Service',
    links: ['Contact', 'Shipping', 'Returns', 'FAQ'],
  },
  {
    title: 'Account',
    links: ['Login', 'Register', 'Orders', 'Wishlist'],
  },
]

const socials = [
  { icon: Instagram, label: 'Instagram' },
  { icon: Youtube, label: 'YouTube' },
  { icon: Facebook, label: 'Facebook' },
  { icon: Twitter, label: 'X' },
]

function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__brand">
          <div className="footer__logo">MIMI<span>SPORTS</span></div>
          <p className="footer__tagline">Gear Up. Play More.</p>
          <ul className="footer__brand-links">
            <li><a href="#">About</a></li>
            <li><a href="#">Contact</a></li>
            <li><a href="#">Careers</a></li>
          </ul>
        </div>

        {footerCols.map((col) => (
          <div className="footer__col" key={col.title}>
            <h4>{col.title}</h4>
            <ul>
              {col.links.map((link) => (
                <li key={link}><a href="#">{link}</a></li>
              ))}
            </ul>
          </div>
        ))}

        <div className="footer__col">
          <h4>Social</h4>
          <div className="footer__socials">
            {socials.map(({ icon: Icon, label }) => (
              <a href="#" key={label} aria-label={label} className="footer__social-icon">
                <Icon size={17} />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="footer__bottom">
        <div className="container footer__bottom-inner">
          <span>© 2026 MIMI SPORTS. All rights reserved.</span>
        </div>
      </div>
    </footer>
  )
}

export default Footer
