import { useEffect, useState } from 'react'

const FALLBACK_IMAGE = '/images/product-placeholder.svg'

function ProductImage({ src, alt, ...props }) {
  const imageSrc = typeof src === 'string' ? src.trim() : ''
  const [failedSrc, setFailedSrc] = useState('')

  useEffect(() => {
    setFailedSrc('')
  }, [imageSrc])

  const displaySrc = !imageSrc || failedSrc === imageSrc ? FALLBACK_IMAGE : imageSrc

  const handleError = () => {
    if (!imageSrc || imageSrc === FALLBACK_IMAGE || failedSrc === imageSrc) return
    console.error('Product image failed to load:', imageSrc, { alt })
    setFailedSrc(imageSrc)
  }

  return <img {...props} src={displaySrc} alt={alt} onError={handleError} />
}

export default ProductImage