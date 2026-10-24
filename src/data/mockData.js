// Mock data only — no backend/API calls yet.
import { products as allProducts, SPORT_META } from './products.js'

export const sports = SPORT_META.map(sport => ({
  id: sport.id,
  name: sport.name,
  description: sport.description,
  productCount: sport.productCount,
  image: sport.image,
}))

export const categories = [
  { id: 'apparel', name: 'Apparel', tagline: 'Jerseys, tees & trackwear', image: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?q=80&w=900&auto=format&fit=crop' },
  { id: 'footwear', name: 'Footwear', tagline: 'Cleats, spikes & trainers', image: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?q=80&w=900&auto=format&fit=crop' },
  { id: 'equipment', name: 'Equipment', tagline: 'Bats, balls & gear', image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=900&auto=format&fit=crop' },
  { id: 'accessories', name: 'Accessories', tagline: 'Bags, gloves & more', image: 'https://images.unsplash.com/photo-1622260614153-03223fb72052?q=80&w=900&auto=format&fit=crop' },
]

// Trending Products on the homepage now pulls a curated subset of the full
// catalog in data/products.js, so homepage and /products stay in sync.
export const products = allProducts.filter((p) => p.featured)

export const reviews = [
  {
    id: 'rv1',
    name: 'Arjun Mehta',
    rating: 5,
    review: 'Ordered cricket gear for my whole team — quality is genuinely pro-level and delivery was quick.',
    avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?q=80&w=200&auto=format&fit=crop',
  },
  {
    id: 'rv2',
    name: 'Sneha Kapoor',
    rating: 5,
    review: 'The running gear matched my style. Best shoe recommendation I have gotten online.',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop',
  },
  {
    id: 'rv3',
    name: 'Rohan Iyer',
    rating: 4,
    review: 'Great range across sports. Wish they had more badminton stringing options, otherwise excellent.',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop',
  },
]
