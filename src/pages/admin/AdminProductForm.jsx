import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { UploadCloud, X, Save, ArrowLeft, AlertCircle } from 'lucide-react'
import {
  getProductByIdAsync, addProductAsync, updateProductAsync, generateNextId,
} from '../../data/productStore.js'
import { uploadProductImage } from '../../services/api.js'
import ProductImage from '../../components/ProductImage.jsx'
import { SPORT_META, CATEGORY_LIST, BRAND_LIST } from '../../data/products.js'
import './Admin.css'

const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Professional']
const USAGE_OPTIONS = ['Training', 'Match', 'Casual']
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_IMAGE_BYTES = 2 * 1024 * 1024 // 2MB limit

const EMPTY_FORM = {
  name: '',
  sport: '',
  category: '',
  brand: '',
  price: '',
  originalPrice: '',
  description: '',
  rating: '4.0',
  reviewCount: '0',
  stock: true,
  featured: false,
  skillLevel: 'Beginner',
  usage: 'Training',
  sizes: '',
  colors: '',
  tags: '',
  image: '',
}

function AdminProductForm({ mode }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = mode === 'edit'

  const [form, setForm] = useState(EMPTY_FORM)
  const [existingImages, setExistingImages] = useState([])
  const [selectedImageFile, setSelectedImageFile] = useState(null)
  const [errors, setErrors] = useState({})
  const [imageError, setImageError] = useState('')
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [generatedId, setGeneratedId] = useState('')

  useEffect(() => {
    if (isEdit && id) {
      setLoading(true)
      getProductByIdAsync(id)
        .then((existing) => {
          if (!existing) {
            setNotFound(true)
            return
          }
          setExistingImages(Array.isArray(existing.images) ? existing.images : existing.image ? [existing.image] : [])
          setForm({
            name: existing.name || '',
            sport: existing.sport || '',
            category: existing.category || '',
            brand: existing.brand || '',
            price: String(existing.price ?? ''),
            originalPrice: String(existing.originalPrice ?? existing.original_price ?? ''),
            description: existing.description || '',
            rating: String(existing.rating ?? '4.0'),
            reviewCount: String(existing.reviewCount ?? existing.reviews ?? '0'),
            stock: existing.stock !== false,
            featured: Boolean(existing.featured),
            skillLevel: existing.skillLevel || 'Beginner',
            usage: existing.usage || 'Training',
            sizes: Array.isArray(existing.sizes) ? existing.sizes.join(', ') : (existing.sizes || ''),
            colors: Array.isArray(existing.colors) ? existing.colors.join(', ') : (existing.colors || ''),
            tags: Array.isArray(existing.tags) ? existing.tags.join(', ') : (existing.tags || ''),
            image: existing.image || (existing.images && existing.images[0]) || '',
          })
        })
        .catch((err) => {
          console.error('Failed to load product for editing:', err)
          setSubmitError(err.message || 'Failed to load product')
        })
        .finally(() => setLoading(false))
    }
  }, [isEdit, id])

  // Auto-generate next ID when a sport is chosen in create mode
  useEffect(() => {
    if (!isEdit && form.sport) {
      setGeneratedId(generateNextId(form.sport))
    } else if (!isEdit) {
      setGeneratedId('')
    }
  }, [isEdit, form.sport])

  const discountPreview = useMemo(() => {
    const price = parseFloat(form.price)
    const orig = parseFloat(form.originalPrice)
    if (!price || !orig || orig <= price) return null
    return Math.round((1 - price / orig) * 100)
  }, [form.price, form.originalPrice])

  const setField = (field, value) => setForm((f) => ({ ...f, [field]: value }))

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageError('')

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setImageError('Please choose a JPG, PNG, or WebP image.')
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError('Image is too large — please choose a file under 2MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setSelectedImageFile(file)
      setField('image', reader.result)
    }
    reader.onerror = () => setImageError('Could not read file.')
    reader.readAsDataURL(file)
  }

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Product name is required.'
    if (!form.sport) errs.sport = 'Sport is required.'
    if (!form.category) errs.category = 'Category is required.'
    if (!form.brand.trim()) errs.brand = 'Brand is required.'

    const price = parseFloat(form.price)
    if (!form.price || Number.isNaN(price) || price <= 0) errs.price = 'Enter a valid price greater than 0.'

    if (form.originalPrice) {
      const orig = parseFloat(form.originalPrice)
      if (Number.isNaN(orig) || orig <= 0) errs.originalPrice = 'Enter a valid original price.'
      else if (!Number.isNaN(price) && orig < price) errs.originalPrice = 'Original price should be greater than or equal to current price.'
    }

    const rating = parseFloat(form.rating)
    if (form.rating && (Number.isNaN(rating) || rating < 0 || rating > 5)) errs.rating = 'Rating must be between 0 and 5.'

    const reviewCount = parseInt(form.reviewCount, 10)
    if (form.reviewCount && (Number.isNaN(reviewCount) || reviewCount < 0)) errs.reviewCount = 'Reviews must be 0 or more.'

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    setSubmitError(null)

    const price = parseFloat(form.price)
    const originalPrice = form.originalPrice ? parseFloat(form.originalPrice) : price
    const discount = originalPrice > price ? Math.round((1 - price / originalPrice) * 100) : 0

    const fallbackImage = `/images/products/${form.sport}/${form.sport}-1.jpg`

    let imagePath = form.image || fallbackImage
    try {
      if (selectedImageFile) {
        imagePath = await uploadProductImage(selectedImageFile, form.sport)
      }
    } catch (err) {
      console.error('Failed to upload product image:', err)
      setSubmitError(err.message || 'Failed to upload product image.')
      setSubmitting(false)
      return
    }

    const payload = {
      name: form.name.trim(),
      sport: form.sport,
      category: form.category,
      brand: form.brand.trim(),
      price,
      originalPrice,
      discount,
      rating: form.rating ? parseFloat(form.rating) : 4.0,
      reviewCount: form.reviewCount ? parseInt(form.reviewCount, 10) : 0,
      description: form.description.trim(),
      sizes: form.sizes.split(',').map((s) => s.trim()).filter(Boolean),
      colors: form.colors.split(',').map((c) => c.trim()).filter(Boolean),
      stock: form.stock,
      skillLevel: form.skillLevel,
      usage: form.usage,
      featured: form.featured,
    }

    if (!isEdit) {
      payload.image = imagePath
      payload.images = [imagePath]
    } else if (selectedImageFile) {
      payload.image = imagePath
      payload.images = [imagePath, ...existingImages.slice(1)]
    }

    if (form.tags.trim()) {
      payload.tags = form.tags.split(',').map((t) => t.trim()).filter(Boolean)
    }

    try {
      if (isEdit) {
        await updateProductAsync(id, payload)
      } else {
        await addProductAsync({ id: generatedId, ...payload })
      }
      navigate('/admin/products')
    } catch (err) {
      console.error('Failed to save product:', err)
      setSubmitError(err.message || 'Failed to save product to MySQL database.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="admin-empty">
        Loading product information...
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="admin-empty">
        Product <strong>{id}</strong> was not found in database.{' '}
        <Link to="/admin/products" className="admin-btn admin-btn-outline" style={{ marginTop: 16 }}>
          Back to Products
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="admin-page__header">
        <div>
          <Link to="/admin/products" className="admin-btn admin-btn-outline" style={{ marginBottom: 14 }}>
            <ArrowLeft size={15} /> Back to Products
          </Link>
          <h1 className="admin-page__title">{isEdit ? `Edit Product` : 'Add Product'}</h1>
          <p className="admin-page__sub">
            {isEdit ? `Editing ${id}` : generatedId ? `New ID will be: ${generatedId}` : 'Choose a sport to generate product ID'}
          </p>
        </div>
      </div>

      {submitError && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 16px',
          background: '#FEE2E2',
          border: '1px solid #FCA5A5',
          color: '#991B1B',
          borderRadius: '8px',
          marginBottom: '20px',
          fontSize: '14px',
        }}>
          <AlertCircle size={18} color="#DC2626" />
          <span>{submitError}</span>
        </div>
      )}

      <form className="admin-form" onSubmit={handleSubmit} noValidate>
        <div className="admin-form__main">
          <div className="admin-panel admin-form__main">
            <div className={`admin-field ${errors.name ? 'has-error' : ''}`}>
              <label>Product Name</label>
              <input type="text" value={form.name} onChange={(e) => setField('name', e.target.value)} placeholder="e.g. Pro Elite Cricket Bat" />
              {errors.name && <span className="admin-field__error">{errors.name}</span>}
            </div>

            <div className="admin-field--row">
              <div className={`admin-field ${errors.sport ? 'has-error' : ''}`}>
                <label>Sport</label>
                <select value={form.sport} onChange={(e) => setField('sport', e.target.value)}>
                  <option value="">Select a sport</option>
                  {SPORT_META.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                {errors.sport && <span className="admin-field__error">{errors.sport}</span>}
              </div>
              <div className={`admin-field ${errors.category ? 'has-error' : ''}`}>
                <label>Category</label>
                <select value={form.category} onChange={(e) => setField('category', e.target.value)}>
                  <option value="">Select a category</option>
                  {CATEGORY_LIST.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                {errors.category && <span className="admin-field__error">{errors.category}</span>}
              </div>
            </div>

            <div className={`admin-field ${errors.brand ? 'has-error' : ''}`}>
              <label>Brand</label>
              <input
                type="text"
                list="brand-suggestions"
                value={form.brand}
                onChange={(e) => setField('brand', e.target.value)}
                placeholder="e.g. Nike"
              />
              <datalist id="brand-suggestions">
                {BRAND_LIST.map((b) => <option key={b} value={b} />)}
              </datalist>
              {errors.brand && <span className="admin-field__error">{errors.brand}</span>}
            </div>

            <div className="admin-field--row">
              <div className={`admin-field ${errors.price ? 'has-error' : ''}`}>
                <label>Price (₹)</label>
                <input type="number" min="0" value={form.price} onChange={(e) => setField('price', e.target.value)} placeholder="2999" />
                {errors.price && <span className="admin-field__error">{errors.price}</span>}
              </div>
              <div className={`admin-field ${errors.originalPrice ? 'has-error' : ''}`}>
                <label>Original Price <span className="optional">(optional)</span></label>
                <input type="number" min="0" value={form.originalPrice} onChange={(e) => setField('originalPrice', e.target.value)} placeholder="3999" />
                {errors.originalPrice && <span className="admin-field__error">{errors.originalPrice}</span>}
                {discountPreview !== null && !errors.originalPrice && (
                  <span style={{ fontSize: 12, color: 'var(--color-success)', fontWeight: 600 }}>{discountPreview}% discount</span>
                )}
              </div>
            </div>

            <div className="admin-field">
              <label>Description <span className="optional">(optional)</span></label>
              <textarea value={form.description} onChange={(e) => setField('description', e.target.value)} placeholder="Short product description..." />
            </div>

            <div className="admin-field--row">
              <div className={`admin-field ${errors.rating ? 'has-error' : ''}`}>
                <label>Rating <span className="optional">(0–5)</span></label>
                <input type="number" min="0" max="5" step="0.1" value={form.rating} onChange={(e) => setField('rating', e.target.value)} />
                {errors.rating && <span className="admin-field__error">{errors.rating}</span>}
              </div>
              <div className={`admin-field ${errors.reviewCount ? 'has-error' : ''}`}>
                <label>Reviews <span className="optional">(count)</span></label>
                <input type="number" min="0" value={form.reviewCount} onChange={(e) => setField('reviewCount', e.target.value)} />
                {errors.reviewCount && <span className="admin-field__error">{errors.reviewCount}</span>}
              </div>
            </div>

            <div className="admin-field--row">
              <div className="admin-field">
                <label>Skill Level</label>
                <select value={form.skillLevel} onChange={(e) => setField('skillLevel', e.target.value)}>
                  {SKILL_LEVELS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="admin-field">
                <label>Usage</label>
                <select value={form.usage} onChange={(e) => setField('usage', e.target.value)}>
                  {USAGE_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>

            <div className="admin-field--row">
              <div className="admin-field">
                <label>Sizes <span className="optional">(comma-separated)</span></label>
                <input type="text" value={form.sizes} onChange={(e) => setField('sizes', e.target.value)} placeholder="S, M, L, XL" />
              </div>
              <div className="admin-field">
                <label>Colors <span className="optional">(comma-separated)</span></label>
                <input type="text" value={form.colors} onChange={(e) => setField('colors', e.target.value)} placeholder="Black, White" />
              </div>
            </div>

            <div className="admin-field">
              <label>Tags <span className="optional">(comma-separated, optional)</span></label>
              <input type="text" value={form.tags} onChange={(e) => setField('tags', e.target.value)} placeholder="new-arrival, bestseller" />
            </div>

            <label className="admin-checkbox">
              <input type="checkbox" checked={form.stock} onChange={(e) => setField('stock', e.target.checked)} />
              In stock
            </label>
            <label className="admin-checkbox">
              <input type="checkbox" checked={form.featured} onChange={(e) => setField('featured', e.target.checked)} />
              Featured (shows in homepage Trending Products)
            </label>
          </div>
        </div>

        <div className="admin-form__sidebar">
          <div className="admin-panel">
            <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>Product Image</h3>

            {form.image ? (
              <div className="admin-preview">
                <ProductImage src={form.image} alt="Preview" />
                <button type="button" className="admin-preview__remove" onClick={() => { setField('image', ''); setSelectedImageFile(null) }} aria-label="Remove image">
                  <X size={15} />
                </button>
              </div>
            ) : (
              <label className={`admin-upload ${errors.image || imageError ? 'has-error' : ''}`}>
                <div className="admin-upload__icon"><UploadCloud size={20} /></div>
                <div className="admin-upload__text">Click to upload an image</div>
                <div className="admin-upload__hint">JPG, PNG or WebP</div>
                <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handleImageChange} style={{ display: 'none' }} />
              </label>
            )}
            {(errors.image || imageError) && (
              <span className="admin-field__error" style={{ display: 'block', marginTop: 8 }}>{errors.image || imageError}</span>
            )}
          </div>

          <div className="admin-panel">
            <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 10 }}>Product ID</h3>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
              {isEdit ? id : generatedId || 'Select a sport to generate an ID'}
            </p>
          </div>

          <div className="admin-form__actions">
            <button
              type="submit"
              className="admin-btn admin-btn-primary"
              disabled={submitting}
              style={{ flex: 1, justifyContent: 'center' }}
            >
              <Save size={16} /> {submitting ? 'Saving to Database...' : isEdit ? 'Save Changes' : 'Add Product'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default AdminProductForm
