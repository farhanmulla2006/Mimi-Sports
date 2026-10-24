import { Navigate, useLocation } from 'react-router-dom'
import { useCustomerAuth } from '../context/CustomerAuthContext.jsx'

function ProtectedCustomerRoute({ children }) {
  const { customer, loading } = useCustomerAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="account-empty" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Checking your account session...
      </div>
    )
  }

  if (!customer) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}

export default ProtectedCustomerRoute
