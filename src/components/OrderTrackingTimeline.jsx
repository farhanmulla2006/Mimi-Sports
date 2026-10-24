import { Check, Circle, PackageCheck, XCircle } from 'lucide-react'
import { ORDER_STATUS_STEPS, getOrderStatusLabel } from '../utils/orderStatus.js'
import './OrderTrackingTimeline.css'

function OrderTrackingTimeline({ status, createdAt }) {
  const normalizedStatus = String(status || 'pending').toLowerCase()
  const currentIndex = ORDER_STATUS_STEPS.findIndex((step) => step.value === normalizedStatus)
  const isCancelled = normalizedStatus === 'cancelled'
  const progressIndex = currentIndex < 0 ? 0 : currentIndex

  return (
    <section className={`order-tracking ${isCancelled ? 'order-tracking--cancelled' : ''}`} aria-label="Order tracking">
      <div className="order-tracking__header">
        <div>
          <p className="order-tracking__eyebrow">Delivery tracking</p>
          <h3>Order Progress</h3>
        </div>
        <span className="order-tracking__current">{getOrderStatusLabel(normalizedStatus)}</span>
      </div>

      {isCancelled ? (
        <div className="order-tracking__cancelled-state">
          <XCircle size={22} />
          <div>
            <strong>Order Cancelled</strong>
            <p>This order will not continue through delivery.</p>
          </div>
        </div>
      ) : (
        <ol className="order-tracking__steps">
          {ORDER_STATUS_STEPS.map((step, index) => {
            const isCurrent = index === progressIndex
            const isComplete = index < progressIndex || normalizedStatus === 'delivered'
            return (
              <li className={`order-tracking__step ${isComplete ? 'is-complete' : ''} ${isCurrent ? 'is-current' : ''}`} key={step.value}>
                <div className="order-tracking__marker">
                  {isComplete ? <Check size={15} /> : isCurrent ? <PackageCheck size={15} /> : <Circle size={12} />}
                </div>
                <div className="order-tracking__step-content">
                  <strong>{step.label}</strong>
                  {index === 0 && createdAt && <time dateTime={createdAt}>Placed {new Date(createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</time>}
                  {isCurrent && <span>Current status</span>}
                </div>
                {index < ORDER_STATUS_STEPS.length - 1 && <div className="order-tracking__connector" />}
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}

export default OrderTrackingTimeline