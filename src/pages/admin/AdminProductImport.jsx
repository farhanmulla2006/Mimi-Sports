import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  UploadCloud, FileText, Download, CheckCircle, AlertTriangle, XCircle, ArrowLeft, RefreshCw,
} from 'lucide-react'
import { getAllProducts, loadProducts } from '../../data/productStore.js'
import * as api from '../../services/api.js'
import './Admin.css'

const ALLOWED_SPORTS = [
  'Cricket', 'Football', 'Basketball', 'Badminton', 'Tennis',
  'Running', 'Fitness', 'Volleyball', 'Table Tennis', 'Boxing',
]

const ALLOWED_CATEGORIES = [
  'Apparel', 'Footwear', 'Equipment', 'Protective Gear', 'Accessories',
  'Bats', 'Boots', 'Balls', 'Racquets', 'Shoes', 'Gear', 'Gloves', 'Paddles',
]

/**
 * Robust CSV parser handling quoted fields and pipe separators
 */
function parseCSV(text) {
  const lines = []
  let row = ['']
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const nextChar = text[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        row[row.length - 1] += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      row.push('')
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++
      if (row.length > 1 || row[0] !== '') {
        lines.push(row)
      }
      row = ['']
    } else {
      row[row.length - 1] += char
    }
  }
  if (row.length > 1 || row[0] !== '') {
    lines.push(row)
  }
  return lines
}

function AdminProductImport() {
  const navigate = useNavigate()
  const [existingProducts, setExistingProducts] = useState([])
  const [file, setFile] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const [parseResults, setParseResults] = useState(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const [importError, setImportError] = useState(null)

  useEffect(() => {
    document.title = 'Admin — Bulk Product Import'
    loadProducts()
      .then((list) => setExistingProducts(list))
      .catch(() => setExistingProducts(getAllProducts()))
  }, [])

  const existingIdsSet = new Set(existingProducts.map((p) => String(p.id)))

  const downloadCsvTemplate = () => {
    const templateContent = [
      'id,name,sport,category,brand,price,originalPrice,rating,reviews,description,stock,featured,image,images',
      'cricket-21,SG Test Cricket Bat,Cricket,Equipment,SG,4999,5999,4.7,125,Professional English willow cricket bat,25,true,/images/products/cricket/cricker-1.jpg,/images/products/cricket/cricker-1.jpg|/images/products/cricket/sunny tonny image-2.jpg',
      'football-21,Nike Premier Strike Football,Football,Equipment,Nike,1999,2499,4.6,85,Official match football with textured casing,50,false,/images/products/football/footlball-1.jpg,/images/products/football/footlball-1.jpg',
    ].join('\n')

    const blob = new Blob([templateContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'mimi_sports_bulk_import_template.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleFileChange = (selectedFile) => {
    if (!selectedFile) return
    if (!selectedFile.name.endsWith('.csv')) {
      alert('Please select a valid .csv file.')
      return
    }
    setFile(selectedFile)
    setImportResult(null)
    setImportError(null)

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target.result
      validateAndPreviewCsv(text)
    }
    reader.readAsText(selectedFile)
  }

  const validateAndPreviewCsv = (text) => {
    const rawRows = parseCSV(text)
    if (rawRows.length < 2) {
      alert('CSV file is empty or missing headers.')
      return
    }

    const headers = rawRows[0].map((h) => h.trim().toLowerCase())
    const rows = rawRows.slice(1)

    const getCol = (row, fieldName) => {
      const idx = headers.indexOf(fieldName.toLowerCase())
      return idx !== -1 && row[idx] !== undefined ? row[idx].trim() : ''
    }

    const payload = []
    const rowErrors = []
    const seenPayloadIds = new Set()

    let duplicatePayloadCount = 0
    let existingDbCount = 0
    let invalidImageCount = 0

    rows.forEach((row, idx) => {
      const rowNum = idx + 2 // 1-based index including header
      const id = getCol(row, 'id')
      const name = getCol(row, 'name')
      const sport = getCol(row, 'sport')
      const category = getCol(row, 'category')
      const brand = getCol(row, 'brand')
      const priceStr = getCol(row, 'price')
      const origPriceStr = getCol(row, 'originalPrice') || getCol(row, 'original_price')
      const ratingStr = getCol(row, 'rating')
      const reviewsStr = getCol(row, 'reviews')
      const description = getCol(row, 'description')
      const stockStr = getCol(row, 'stock')
      const featuredStr = getCol(row, 'featured')
      const imageStr = getCol(row, 'image')
      const imagesStr = getCol(row, 'images')

      const errs = []

      if (!id) {
        errs.push('Product ID is required')
      } else if (seenPayloadIds.has(id)) {
        errs.push(`Duplicate ID '${id}' in CSV`)
        duplicatePayloadCount++
      } else if (existingIdsSet.has(id)) {
        errs.push(`ERROR: Product ID '${id}' already exists in database`)
        existingDbCount++
      } else {
        seenPayloadIds.add(id)
      }

      if (!name) errs.push('Name is required')
      if (!sport) {
        errs.push('Sport is required')
      } else {
        const matchingSport = ALLOWED_SPORTS.find((s) => s.toLowerCase() === sport.toLowerCase())
        if (!matchingSport) {
          errs.push(`Invalid sport '${sport}'. Must be one of: ${ALLOWED_SPORTS.join(', ')}`)
        }
      }

      if (!category) errs.push('Category is required')
      if (!brand) errs.push('Brand is required')

      const price = parseFloat(priceStr)
      if (!priceStr || Number.isNaN(price) || price < 0) {
        errs.push('Price must be a valid non-negative number')
      }

      if (origPriceStr) {
        const orig = parseFloat(origPriceStr)
        if (Number.isNaN(orig) || orig < 0) errs.push('Original price must be a valid non-negative number')
      }

      const rating = parseFloat(ratingStr)
      if (ratingStr && (Number.isNaN(rating) || rating < 0 || rating > 5)) {
        errs.push('Rating must be between 0 and 5')
      }

      const reviews = parseInt(reviewsStr, 10)
      if (reviewsStr && (Number.isNaN(reviews) || reviews < 0)) {
        errs.push('Reviews must be a non-negative integer')
      }

      // Process image / images
      let imagesList = []
      if (imagesStr) {
        imagesList = imagesStr.split('|').map((s) => s.trim()).filter(Boolean)
      } else if (imageStr) {
        imagesList = [imageStr]
      }

      if (imagesList.length === 0) {
        errs.push('Image path is required')
      } else {
        imagesList.forEach((imgUrl) => {
          if (imgUrl.startsWith('http://') || imgUrl.startsWith('https://')) {
            errs.push(`External URLs (${imgUrl}) are not allowed. Use local /images/products/ paths`)
            invalidImageCount++
          } else if (!imgUrl.startsWith('/images/products/') && !imgUrl.startsWith('images/products/')) {
            errs.push(`Image path '${imgUrl}' must start with /images/products/`)
            invalidImageCount++
          }
        })
      }

      if (errs.length > 0) {
        rowErrors.push({ rowNum, id: id || 'N/A', errors: errs })
      } else {
        // Parse stock
        let stockVal = true
        if (stockStr) {
          const s = stockStr.toLowerCase()
          stockVal = (s === 'true' || s === '1' || s === 'yes' || parseInt(s, 10) > 0)
        }

        // Parse featured
        let featuredVal = false
        if (featuredStr) {
          const f = featuredStr.toLowerCase()
          featuredVal = (f === 'true' || f === '1' || f === 'yes')
        }

        payload.push({
          id,
          name,
          sport,
          category,
          brand,
          price,
          originalPrice: origPriceStr ? parseFloat(origPriceStr) : price,
          rating: ratingStr ? parseFloat(ratingStr) : 4.0,
          reviews: reviewsStr ? parseInt(reviewsStr, 10) : 0,
          description,
          stock: stockVal,
          featured: featuredVal,
          image: imagesList[0] || '',
          images: imagesList,
        })
      }
    })

    setParseResults({
      totalRows: rows.length,
      validRows: payload.length,
      invalidRows: rowErrors.length,
      duplicatePayloadCount,
      existingDbCount,
      invalidImageCount,
      payload,
      rowErrors,
    })
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0])
    }
  }

  const executeBulkImport = async () => {
    if (!parseResults || parseResults.invalidRows > 0 || parseResults.payload.length === 0) return

    setImporting(true)
    setImportError(null)

    try {
      const res = await api.bulkImportProducts(parseResults.payload)
      setImportResult(res)
      await loadProducts()
    } catch (err) {
      console.error('Bulk import execution failed:', err)
      setImportError(err.message || 'Bulk import failed.')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div>
      <div className="admin-page__header">
        <div>
          <Link to="/admin/products" className="admin-btn admin-btn-outline" style={{ marginBottom: 14 }}>
            <ArrowLeft size={15} /> Back to Products
          </Link>
          <h1 className="admin-page__title">Bulk Product Import</h1>
          <p className="admin-page__sub">Import multiple products into MySQL database from a CSV file.</p>
        </div>
        <button type="button" className="admin-btn admin-btn-outline" onClick={downloadCsvTemplate}>
          <Download size={16} /> Download CSV Template
        </button>
      </div>

      {importResult ? (
        <div className="admin-panel" style={{ borderLeft: '4px solid var(--color-success)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <CheckCircle size={28} color="var(--color-success)" />
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-text-primary)' }}>Import Successful</h2>
              <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>All products have been inserted into MySQL database inside an atomic transaction.</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div style={{ padding: '16px', background: '#F0FDF4', borderRadius: '8px', border: '1px solid #DCFCE7' }}>
              <div style={{ fontSize: '13px', color: '#166534', fontWeight: 600 }}>Products Imported</div>
              <div style={{ fontSize: '28px', fontWeight: 900, color: '#15803D' }}>{importResult.importedCount}</div>
            </div>
            <div style={{ padding: '16px', background: '#EFF6FF', borderRadius: '8px', border: '1px solid #DBEAFE' }}>
              <div style={{ fontSize: '13px', color: '#1E40AF', fontWeight: 600 }}>Total Products in Database</div>
              <div style={{ fontSize: '28px', fontWeight: 900, color: '#1D4ED8' }}>{importResult.totalDatabaseProducts}</div>
            </div>
          </div>

          {importResult.sportBreakdown && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px' }}>Import Breakdown by Sport</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
                {Object.entries(importResult.sportBreakdown).map(([sport, count]) => (
                  <div key={sport} style={{ padding: '10px 14px', background: 'var(--color-bg)', borderRadius: '6px', fontSize: '13px' }}>
                    <strong>{sport}:</strong> {count} products
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="admin-btn admin-btn-primary" onClick={() => navigate('/admin/products')}>
              View All Products ({importResult.totalDatabaseProducts})
            </button>
            <button className="admin-btn admin-btn-outline" onClick={() => { setFile(null); setParseResults(null); setImportResult(null); }}>
              Import Another CSV
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="admin-panel">
            <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '8px' }}>Select CSV File</h3>
            <p style={{ fontSize: '13.5px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
              Upload a CSV file containing product records. Ensure images use local paths such as <code>/images/products/...</code>.
            </p>

            <div
              className={`admin-upload ${dragActive ? 'is-active' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              style={{ borderStyle: 'dashed', borderWidth: '2px', padding: '36px', textAlign: 'center' }}
            >
              <div className="admin-upload__icon"><FileText size={32} color="var(--color-accent)" /></div>
              <div className="admin-upload__text" style={{ fontSize: '15px', fontWeight: 700 }}>
                {file ? file.name : 'Drag and drop your CSV file here, or click to browse'}
              </div>
              <div className="admin-upload__hint" style={{ marginTop: '4px' }}>CSV format only</div>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                style={{ display: 'none' }}
                id="csv-file-input"
              />
              <label htmlFor="csv-file-input" className="admin-btn admin-btn-outline" style={{ marginTop: '16px', display: 'inline-flex' }}>
                Select CSV File
              </label>
            </div>
          </div>

          {importError && (
            <div style={{ padding: '16px', background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B', borderRadius: '8px', fontSize: '14px' }}>
              <strong>Import Error:</strong> {importError}
            </div>
          )}

          {parseResults && (
            <div className="admin-panel">
              <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '16px' }}>Validation & Preview</h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                <div style={{ padding: '12px', background: '#F9FAFB', borderRadius: '6px', border: '1px solid #E5E7EB' }}>
                  <div style={{ fontSize: '12px', color: '#6B7280' }}>Total CSV Rows</div>
                  <div style={{ fontSize: '20px', fontWeight: 800 }}>{parseResults.totalRows}</div>
                </div>
                <div style={{ padding: '12px', background: '#F0FDF4', borderRadius: '6px', border: '1px solid #DCFCE7' }}>
                  <div style={{ fontSize: '12px', color: '#166534' }}>Valid Rows</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#15803D' }}>{parseResults.validRows}</div>
                </div>
                <div style={{ padding: '12px', background: parseResults.invalidRows > 0 ? '#FEF2F2' : '#F9FAFB', borderRadius: '6px', border: '1px solid #FEE2E2' }}>
                  <div style={{ fontSize: '12px', color: parseResults.invalidRows > 0 ? '#991B1B' : '#6B7280' }}>Invalid Rows</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: parseResults.invalidRows > 0 ? '#DC2626' : '#111827' }}>{parseResults.invalidRows}</div>
                </div>
                <div style={{ padding: '12px', background: '#F9FAFB', borderRadius: '6px', border: '1px solid #E5E7EB' }}>
                  <div style={{ fontSize: '12px', color: '#6B7280' }}>Existing DB IDs</div>
                  <div style={{ fontSize: '20px', fontWeight: 800 }}>{parseResults.existingDbCount}</div>
                </div>
              </div>

              {parseResults.invalidRows > 0 ? (
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#DC2626', fontWeight: 700, marginBottom: '12px' }}>
                    <AlertTriangle size={18} /> Found {parseResults.invalidRows} invalid row(s). Fix errors before importing:
                  </div>
                  <div className="admin-table-wrap" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Row #</th>
                          <th>ID</th>
                          <th>Validation Error</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parseResults.rowErrors.map((errItem, idx) => (
                          <tr key={idx}>
                            <td>Row {errItem.rowNum}</td>
                            <td><code>{errItem.id}</code></td>
                            <td style={{ color: '#DC2626', fontWeight: 600 }}>{errItem.errors.join(' | ')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#15803D', fontWeight: 700, marginBottom: '20px' }}>
                  <CheckCircle size={18} /> All {parseResults.validRows} rows passed validation. Ready to import into MySQL database!
                </div>
              )}

              {parseResults.validRows > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '10px' }}>Valid Product Preview (First 5 Rows)</h4>
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Name</th>
                          <th>Sport</th>
                          <th>Brand</th>
                          <th>Price</th>
                          <th>Stock</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parseResults.payload.slice(0, 5).map((p) => (
                          <tr key={p.id}>
                            <td><code>{p.id}</code></td>
                            <td>{p.name}</td>
                            <td>{p.sport}</td>
                            <td>{p.brand}</td>
                            <td>₹{p.price}</td>
                            <td>{p.stock ? 'In Stock' : 'Out of Stock'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  className="admin-btn admin-btn-primary"
                  disabled={parseResults.invalidRows > 0 || parseResults.validRows === 0 || importing}
                  onClick={executeBulkImport}
                >
                  {importing ? (
                    <>
                      <RefreshCw size={16} className="spin" /> Importing into MySQL...
                    </>
                  ) : (
                    `Import ${parseResults.validRows} Products into MySQL`
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default AdminProductImport
