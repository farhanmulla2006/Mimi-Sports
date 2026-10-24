import Breadcrumb from './Breadcrumb.jsx'
import './PageHeader.css'

function PageHeader({ eyebrow, title, subtitle, breadcrumbItems, children }) {
  return (
    <section className="page-header">
      <div className="container">
        <Breadcrumb items={breadcrumbItems} />
        {eyebrow && <span className="section-eyebrow page-header__eyebrow">{eyebrow}</span>}
        <h1 className="page-header__title">{title}</h1>
        {subtitle && <p className="page-header__sub">{subtitle}</p>}
        {children}
      </div>
    </section>
  )
}

export default PageHeader
