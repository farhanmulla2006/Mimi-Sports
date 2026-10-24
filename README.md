# MIMI SPORTS — E-commerce Application

**Gear Up. Play More.**

Mimi Sports is a React + Vite storefront backed by PHP, PDO, and MySQL. The normal local checkout uses a clearly simulated online payment flow for college demonstrations. Razorpay remains available as an optional test-mode integration.

## Stack

- React 18 + Vite (JavaScript, no TypeScript)
- React Router v6
- Lucide React icons
- Plain CSS with design tokens (no framework)

## Run it locally

```bash
npm install
npm run dev
```

Then open the local URL Vite prints (usually `http://localhost:5173`).

To build for production:

```bash
npm run build
npm run preview
```

## Simulated local payments

The default checkout uses `POST /backend/api/payments/complete-demo.php`. It does not contact Razorpay, require credentials, collect card or banking data, or move real money. It completes the existing order with `payment_status = paid`, `payment_method = online`, and `paid_at` set by the backend. The displayed `DEMO_PAY_...` reference is frontend-only.

## Optional Razorpay test payments

Run the existing database migration once without dropping or recreating tables:

```bash
php backend/scripts/add_payment_fields.php
```

Configure these server-side environment variables before starting PHP/XAMPP:

```text
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
```

For local PHP development, copy `backend/config/razorpay.local.php.example` to `backend/config/razorpay.local.php` and replace only the placeholders with Razorpay TEST credentials. The local file is ignored by Git and must never contain live credentials in a committed change.

The secret values must never be placed in React or committed to Git. Razorpay amounts are calculated from the stored Mimi Sports order total and sent in paise. Checkout success is accepted only after server-side signature, order ownership, payment status, currency, and amount checks.

Payment endpoints:

- `POST /backend/api/payments/create-order.php`
- `POST /backend/api/payments/verify.php`
- `POST /backend/api/payments/webhook.php`

The webhook URL must be registered in the Razorpay Dashboard for the deployed backend. Localhost webhook delivery requires a secure tunnel and has not been claimed as production-ready here. Test mode does not charge real money; live credentials, dashboard configuration, and go-live checks are still required before production use.

Run the non-destructive integrity checks with the PHP CLI:

```bash
php backend/scripts/test_payments.php
```

## What's included

**Homepage (Step 1)**
- **Navbar** — sticky, responsive, hamburger menu on mobile, search/wishlist/cart/login
- **Hero** — headline, CTAs, floating info cards, animated sport ticker
- **Shop by Sport** — 8 sport cards linking to `/products?sport=...`
- **Trending Products** — featured products pulled from the full catalog, wishlist toggle, ratings, INR pricing, discounts
- **Personalized For You** — 4 AI-recommendation preview cards with match %
- **Shop by Category** — apparel, footwear, equipment, accessories, linking to `/products?category=...`
- **Offer Banner** — promotional CTA section
- **What Athletes Say** — 3 customer review cards
- **Newsletter** — email signup (client-side only, no backend call)
- **Footer** — full sitemap + social links

**Sports & Products (Step 2)**
- **`/sports`** — discovery grid of all 10 sports (description, product count, CTA) + a "Most Popular Sports" featured section
- **`/products`** — full catalogue with:
  - Search (name, brand, sport, category)
  - Filter sidebar: sport, category, brand, price range, rating, discount, in-stock — all combine together
  - Sort dropdown: relevance, price, rating, newest, popular, discount
  - Active filter chips with individual + "Clear All" removal
  - Live "Showing X of Y products" count
  - Load More pagination (12 at a time)
  - Empty state when nothing matches
  - Mobile Filter/Sort buttons opening a slide-in drawer / sort sheet
- **`/products/:id`** — placeholder product detail page (full PDP planned for Step 3)

## Project structure

```
src/
  components/       Reusable UI components (colocated CSS)
  pages/            Home, Sports, Products, ProductDetail
  data/
    mockData.js      Homepage sports/categories/recommendations/reviews
    products.js       Full 35-product catalog + sport metadata + filter option lists
  styles/            Design tokens, global styles, shared card styles
```

## Notes

- All product/category imagery uses Unsplash URLs as placeholders.
- Cart, wishlist, and login are UI-only for now (no persisted state, no backend).
- Clicking a sport on the homepage or Sports page navigates to `/products?sport=<id>`, which the Products page reads via `useSearchParams` to pre-filter the catalog.
- Nothing here touches PHP, MySQL, real auth, real payments, or the actual AI recommendation model — all per the brief.

## Next steps (not built yet)

- Full product detail page (gallery, size/color selection, reviews)
- Offers and AI Picks as dedicated pages
- Functional cart, wishlist, and login flows
- Backend/API integration to replace mock data
# Mimi-Sports
Sports Merchindise website  
