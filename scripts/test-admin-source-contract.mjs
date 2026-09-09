import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const adminPageSource = await readFile(new URL('../src/pages/adminPage.ts', import.meta.url), 'utf8')
const adminScriptSource = await readFile(new URL('../src/pages/admin/script.ts', import.meta.url), 'utf8')
const adminSectionsSource = await readFile(new URL('../src/pages/admin/sections.ts', import.meta.url), 'utf8')
const adminFlashSaleSource = await readFile(new URL('../src/pages/admin/script-flashsale.ts', import.meta.url), 'utf8')
const orderRoutesSource = await readFile(new URL('../src/routes/orderRoutes.ts', import.meta.url), 'utf8')
const pageRoutesSource = await readFile(new URL('../src/routes/pageRoutes.ts', import.meta.url), 'utf8')
const indexSource = await readFile(new URL('../src/index.tsx', import.meta.url), 'utf8')
const adminPushRoutesSource = await readFile(new URL('../src/routes/adminPushRoutes.ts', import.meta.url), 'utf8')
const webPushHelperSource = await readFile(new URL('../src/lib/webPushHelpers.ts', import.meta.url), 'utf8')
const pushMigrationSource = await readFile(new URL('../migrations/0023_admin_push_subscriptions.sql', import.meta.url), 'utf8')

const expectedScriptEmbeds = [
  '${adminInlineScript()}',
  '${adminOrdersScript()}',
  '${adminFlashSaleScript()}',
  '${adminFeaturedSettingsScript()}',
  '${adminBootstrapScript()}',
]

expectedScriptEmbeds.forEach((snippet) => {
  assert.ok(adminPageSource.includes(snippet), `Expected adminPage.ts to include ${snippet}`)
})

const scriptTagCount = (adminPageSource.match(/<script>/g) || []).length
assert.ok(scriptTagCount >= 5, `Expected adminPage.ts to render split script tags, got ${scriptTagCount}`)

assert.match(adminScriptSource, /export function adminInlineScript\(\): string/, 'Expected adminInlineScript export')
assert.match(adminScriptSource, /export function adminBootstrapScript\(\): string/, 'Expected adminBootstrapScript export')
assert.doesNotMatch(adminScriptSource, /\$\{adminOrdersScript\(\)\}/, 'Expected adminOrdersScript to stay out of core script')
assert.doesNotMatch(adminScriptSource, /\$\{adminFlashSaleScript\(\)\}/, 'Expected adminFlashSaleScript to stay out of core script')
assert.doesNotMatch(adminScriptSource, /\$\{adminFeaturedSettingsScript\(\)\}/, 'Expected adminFeaturedSettingsScript to stay out of core script')
assert.match(adminScriptSource, /function bindAdminSidebarSwipeGestures\(\)/, 'Expected admin dashboard to bind mobile sidebar swipe gestures')
assert.match(adminScriptSource, /touchstart[\s\S]*touchmove[\s\S]*touchend/, 'Expected sidebar swipe gesture to track touch lifecycle')
assert.match(adminScriptSource, /if \(!startedOpen && dx > 0\) openMobileSidebar\(\)/, 'Expected edge swipe right to open mobile sidebar')
assert.match(adminScriptSource, /if \(startedOpen && dx < 0\) closeMobileSidebar\(\)/, 'Expected swipe left to close mobile sidebar')
assert.match(adminScriptSource, /function initAdminOrderNotifications\(\)/, 'Expected admin dashboard to initialize new order notifications')
assert.match(adminScriptSource, /Notification\.permission/, 'Expected admin new order notifications to use browser Notification permission')
assert.match(adminScriptSource, /AudioContext|webkitAudioContext/, 'Expected admin new order notifications to include audible alert support')
assert.match(adminScriptSource, /pushManager\.subscribe/, 'Expected admin dashboard to subscribe the PWA service worker for push')
assert.match(adminScriptSource, /\/api\/admin\/push\/subscriptions/, 'Expected admin dashboard to persist push subscriptions')
assert.match(adminSectionsSource, /<header[\s\S]*id="menuToggle"[\s\S]*id="pageTitle"/, 'Expected mobile menu toggle to render inside the admin header before the page title')
assert.match(adminSectionsSource, /export function adminMobileMenuToggle\(\): string \{\s*return ""\s*\}/, 'Expected legacy mobile menu placeholder to avoid rendering a second fixed hamburger')
// c01c74bb moved this control from the header into notification settings.
assert.match(adminSectionsSource, /id="adminOrderNotifySettingsButton"[^>]*onclick="enableAdminOrderNotifications\(\)"/, 'Expected notification settings to expose the enable action')
assert.match(adminScriptSource, /function syncAdminOrderNotifyButton\(\)[\s\S]*?getElementById\('adminOrderNotifySettingsButton'\)/, 'Expected notification state updates to target the current settings control')
assert.match(adminFlashSaleSource, /function adminSecretFieldMarkup\(opts\)/, 'Expected warehouse credentials to use shared secret field markup')
assert.match(adminFlashSaleSource, /function toggleAdminSecretField\(id\)/, 'Expected warehouse credential fields to support visibility toggle')
assert.match(adminFlashSaleSource, /async function copyAdminSecretField\(id\)/, 'Expected warehouse credential fields to support copy')
for (const fieldId of ['ghtkToken', 'ghtkClientSource', 'spxUserId', 'spxSecretKey', 'spxAccountId', 'ghnToken', 'ghnShopId', 'ghnClientId']) {
  assert.match(adminFlashSaleSource, new RegExp(`adminSecretFieldMarkup\\(\\{ id: '${fieldId}'`), `Expected ${fieldId} to render as copyable secret field`)
}

assert.match(orderRoutesSource, /app\.get\('\/api\/admin\/orders\/latest'/, 'Expected admin latest order endpoint for notification polling')
assert.match(orderRoutesSource, /latestOrder/, 'Expected latest order endpoint to return latestOrder payload')
assert.match(orderRoutesSource, /notifyAdminNewOrderPush/, 'Expected order creation to dispatch admin Web Push notifications')
assert.match(pageRoutesSource, /self\.addEventListener\('push'/, 'Expected admin service worker to handle Web Push events')
assert.match(pageRoutesSource, /self\.addEventListener\('notificationclick'/, 'Expected admin service worker to focus admin orders on notification click')
assert.match(indexSource, /registerAdminPushRoutes/, 'Expected app bootstrap to register admin push routes')
assert.match(adminPushRoutesSource, /\/api\/admin\/push\/vapid-public-key/, 'Expected admin push route to expose VAPID public key')
assert.match(adminPushRoutesSource, /\/api\/admin\/push\/subscriptions/, 'Expected admin push route to persist browser subscriptions')
assert.match(webPushHelperSource, /sendNotification|webcrypto-web-push|PushSubscription/, 'Expected Web Push helper to send encrypted push payloads')
assert.match(pushMigrationSource, /admin_push_subscriptions/, 'Expected D1 migration to create admin push subscriptions table')

console.log('admin source contract passed')
