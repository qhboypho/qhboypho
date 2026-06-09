import { readFileSync } from 'node:fs'

const route = readFileSync('src/routes/adminUtilityRoutes.ts', 'utf8')
const sections = readFileSync('src/pages/admin/sections.ts', 'utf8')
const adminPage = readFileSync('src/pages/adminPage.ts', 'utf8')
const script = readFileSync('src/pages/admin/script.ts', 'utf8')

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`)
    process.exit(1)
  }
}

assert(route.includes("app.get('/api/admin/backup/export'"), 'missing admin backup export route')
assert(route.includes("app.post('/api/admin/backup/import'"), 'missing admin backup import route')
assert(route.includes('zipSync(') && route.includes('unzipSync('), 'backup route should zip and unzip files')
assert(route.includes('uploadBackupImagesFromZip'), 'backup import should upload images from ZIP')
const insertOrder = route.match(/const SHOP_BACKUP_INSERT_ORDER = \[([\s\S]*?)\] as const/)?.[1] || ''
const restoreOrder = route.match(/const SHOP_BACKUP_RESTORE_ORDER = \[([\s\S]*?)\] as const/)?.[1] || ''
assert(!insertOrder.includes("'reviews'"), 'reviews should not be inserted by default')
assert(!restoreOrder.includes("'reviews'"), 'reviews should not be deleted/restored by default')

assert(sections.includes('function adminBackupPage'), 'missing backup admin page')
assert(sections.includes('page-backup'), 'missing backup page container')
assert(sections.includes("data-page=\"backup\""), 'missing backup sidebar item')
assert(adminPage.includes('adminBackupPage()'), 'backup page not mounted in admin HTML')

assert(script.includes("'backup'"), 'backup page missing from navigation list/title map')
assert(script.includes('downloadAdminBackup'), 'missing backup download handler')
assert(script.includes('previewAdminBackupImport'), 'missing backup preview handler')
assert(script.includes('restoreAdminBackupImport'), 'missing backup restore handler')

console.log('PASS: backup export/import contract')
