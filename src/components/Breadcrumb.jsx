import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import './Breadcrumb.css'

function Breadcrumb({ items }) {
  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      {items.map((item, i) => {
        const isLast = i === items.length - 1
        return (
          <span key={item.label} className="breadcrumb__item">
            {isLast || !item.href ? (
              <span className="breadcrumb__current">{item.label}</span>
            ) : (
              <Link to={item.href} className="breadcrumb__link">{item.label}</Link>
            )}
            {!isLast && <ChevronRight size={13} className="breadcrumb__sep" />}
          </span>
        )
      })}
    </nav>
  )
}

export default Breadcrumb
