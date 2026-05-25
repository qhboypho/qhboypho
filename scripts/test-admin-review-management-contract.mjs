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
  /id="adminToast"[^>]*z-\[(?:9\d|1\d{2,})\]/.test(modals),
  'Expected admin toast container to render above admin review modal overlays'
)

assert(
  /<form[^>]*onsubmit="saveAdminReview\(event\)"[^>]*novalidate/.test(modals),
  'Expected admin review form to use scripted validation so save failures show a toast'
)

assert(
  /<input(?=[^>]*id="adminReviewReviewerAvatar")(?=[^>]*type="text")[^>]*>/.test(modals),
  'Expected optional reviewer avatar field not to block save with native URL validation'
)

assert(
  /<input(?=[^>]*id="adminReviewImageUrl")(?=[^>]*type="text")[^>]*>/.test(modals),
  'Expected optional review image URL field not to block save with native URL validation'
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
  adminScript.includes('getAdminReviewSaveErrorMessage'),
  'Expected admin review save failures to map API/browser errors to user-facing toast messages'
)

assert(
  adminScript.includes('^data:image\\\\/'),
  'Expected data image validation regex to remain escaped after admin script template rendering'
)

assert(
  adminScript.includes('deleteAdminReview'),
  'Expected admin script to support deleting reviews from admin UI'
)

console.log('admin review management contract passed')
