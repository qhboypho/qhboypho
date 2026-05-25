import fs from 'node:fs/promises'
import path from 'node:path'

const cwd = process.cwd()

async function read(relativePath) {
  return fs.readFile(path.join(cwd, relativePath), 'utf8')
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

const [reviewRoutes, orderRoutes, storefrontScript, storefrontDetailScript] = await Promise.all([
  read('src/routes/reviewRoutes.ts'),
  read('src/routes/orderRoutes.ts'),
  read('src/pages/storefront/script.ts'),
  read('src/pages/storefront/script-detail-order.ts'),
])

assert(
  !reviewRoutes.includes('total: reviews.length'),
  'Expected review aggregate metadata to stop using the truncated review list length'
)

assert(
  /COUNT\(\*\)|AVG\(/.test(reviewRoutes),
  'Expected review routes to compute review aggregates from a dedicated SQL aggregate query'
)

assert(
  reviewRoutes.includes("app.post('/api/admin/reviews'"),
  'Expected admin-only create review route'
)

assert(
  reviewRoutes.includes("app.patch('/api/admin/reviews/:id'"),
  'Expected admin-only update review route'
)

assert(
  reviewRoutes.includes("app.delete('/api/admin/reviews/:id'"),
  'Expected admin-only delete review route'
)

assert(
  reviewRoutes.includes('ADMIN_ONLY'),
  'Expected public review mutation path to reject non-admin callers explicitly'
)

assert(
  /has_review/i.test(orderRoutes),
  'Expected user orders payload to include review state'
)

assert(
  storefrontScript.includes('/api/admin/reviews'),
  'Expected storefront review submission to target the admin review API'
)

assert(
  storefrontScript.includes('!o.has_review'),
  'Expected review CTA rendering to consider whether the order is already reviewed'
)

assert(
  storefrontScript.includes('isAdminUser'),
  'Expected storefront review management to be gated for admins'
)

assert(
  !/detailReviewsSection" class="review-section\s+\$\{currentUser/.test(storefrontDetailScript),
  'Expected product detail reviews section to remain visible for guest shoppers'
)

assert(
  /loadProductReviews\(Number\(p\.id\)\)/.test(storefrontDetailScript),
  'Expected product detail modal to load public reviews without requiring login'
)

assert(
  !/if \(!section \|\| !content \|\| !currentUser\) return/.test(storefrontScript),
  'Expected public product reviews loader not to return early for guest shoppers'
)

console.log('review admin contract passed')
