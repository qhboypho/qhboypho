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

const [sections, modals, adminScript, reviewRoutes] = await Promise.all([
  read('src/pages/admin/sections.ts'),
  read('src/pages/admin/modals.ts'),
  read('src/pages/admin/script.ts'),
  read('src/routes/reviewRoutes.ts'),
])

assert(
  sections.includes('data-page=\\"reviews\\"'),
  'Expected admin sidebar to include a reviews navigation entry'
)

assert(
  sections.includes('page-reviews'),
  'Expected admin sections to render a dedicated reviews management page'
)

assert(
  modals.includes('reviewAdminModal'),
  'Expected admin modals to include a review create/edit modal'
)

assert(
  reviewRoutes.includes("app.get('/api/admin/reviews'"),
  'Expected backend route for listing admin reviews'
)

assert(
  reviewRoutes.includes('reviewer_name'),
  'Expected review routes to support admin-managed reviewer identity fields'
)

assert(
  adminScript.includes('loadAdminReviews'),
  'Expected admin script to load and render review records'
)

assert(
  adminScript.includes('openAdminReviewModal'),
  'Expected admin script to support opening the review create/edit modal'
)

assert(
  adminScript.includes('saveAdminReview'),
  'Expected admin script to support saving reviews from admin UI'
)

assert(
  adminScript.includes('deleteAdminReview'),
  'Expected admin script to support deleting reviews from admin UI'
)

console.log('admin review management contract passed')
