import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

function read(rel) {
  const file = path.join(root, rel)
  if (!fs.existsSync(file)) throw new Error(`Missing required file: ${rel}`)
  return fs.readFileSync(file, 'utf8')
}

function assertIncludes(text, needle, label) {
  if (!text.includes(needle)) throw new Error(`${label} must include ${needle}`)
}

function assertMatch(text, pattern, label) {
  if (!pattern.test(text)) throw new Error(`${label} must match ${pattern}`)
}

const wrangler = JSON.parse(read('wrangler.jsonc'))
const doBindings = wrangler.durable_objects?.bindings || []
if (!doBindings.some((binding) => binding.name === 'LIVE_CHAT_ROOM' && binding.class_name === 'LiveChatRoom')) {
  throw new Error('wrangler.jsonc must bind LIVE_CHAT_ROOM to LiveChatRoom')
}
const migrations = wrangler.migrations || []
if (!migrations.some((migration) => (migration.new_sqlite_classes || []).includes('LiveChatRoom'))) {
  throw new Error('wrangler.jsonc must add a Durable Object sqlite migration for LiveChatRoom')
}
if (!Array.isArray(wrangler.triggers?.crons) || !wrangler.triggers.crons.length) {
  throw new Error('wrangler.jsonc must configure a cron trigger for 7-day live chat cleanup')
}

const migration = read('migrations/0027_live_chat.sql')
for (const table of ['live_chat_conversations', 'live_chat_messages']) {
  assertIncludes(migration, `CREATE TABLE IF NOT EXISTS ${table}`, 'live chat migration')
}
for (const column of ['customer_token', 'guest_phone', 'product_id', 'expires_at', 'admin_unread_count']) {
  assertIncludes(migration, column, 'live chat migration')
}

const room = read('src/durable/liveChatRoom.ts')
assertIncludes(room, 'export class LiveChatRoom', 'Durable Object')
assertIncludes(room, 'acceptWebSocket', 'Durable Object')
assertIncludes(room, 'serializeAttachment', 'Durable Object')
assertIncludes(room, 'getWebSockets', 'Durable Object')
assertIncludes(room, 'message_created', 'Durable Object broadcast event')

const routes = read('src/routes/liveChatRoutes.ts')
for (const route of [
  "/api/live-chat/start",
  "/api/live-chat/product-context",
  "/api/live-chat/:conversationId/messages",
  "/api/live-chat/:conversationId/ws",
  "/api/admin/live-chat/conversations",
  "/api/admin/live-chat/:conversationId/messages",
  "/api/admin/live-chat/:conversationId/ws",
  "/api/admin/live-chat/cleanup",
]) {
  assertIncludes(routes, route, 'live chat routes')
}
for (const token of ['getUserSessionUserId', 'guest_phone', 'cleanupExpiredLiveChat', 'notifyLiveChatRoom', 'LIVE_CHAT_TTL_DAYS']) {
  assertIncludes(routes, token, 'live chat route logic')
}
assertIncludes(routes, 'normalizeMessageBody', 'live chat multiline messages')
assertMatch(routes, /replace\(\s*\/\\r\\n\?\//, 'live chat multiline messages')
assertIncludes(routes, 'customer_avatar', 'admin live chat customer avatar')
assertIncludes(routes, 'LEFT JOIN users', 'admin live chat customer avatar')

const index = read('src/index.tsx')
assertIncludes(index, "registerLiveChatRoutes", 'app entry')
assertIncludes(index, "export { LiveChatRoom }", 'app entry')
assertIncludes(index, "scheduled", 'app entry scheduled handler')

const bindings = read('src/types/app.ts')
assertIncludes(bindings, 'LIVE_CHAT_ROOM', 'AppBindings')

const storefrontPage = read('src/pages/storefrontPage.ts')
assertIncludes(storefrontPage, 'storefrontLiveChatSection', 'storefront page')
assertIncludes(storefrontPage, 'storefrontLiveChatStyles', 'storefront page')

const storefrontScript = read('src/pages/storefront/script.ts')
for (const token of ['openLiveChat', 'sendLiveChatProductContext', 'openLiveChatProductPicker', 'guest phone', 'liveChatSocket']) {
  assertIncludes(storefrontScript, token, 'storefront live chat script')
}

const adminSections = read('src/pages/admin/sections.ts')
assertIncludes(adminSections, 'page-live-chat', 'admin live chat page')
assertIncludes(adminSections, 'liveChatConversationList', 'admin live chat page')

const adminScript = read('src/pages/admin/script.ts')
assertIncludes(adminScript, "'live-chat'", 'admin navigation')
assertIncludes(adminScript, 'loadLiveChatAdminInbox', 'admin page loader')

const adminLiveChatScript = read('src/pages/admin/script-live-chat.ts')
for (const token of ['loadLiveChatAdminInbox', 'connectLiveChatAdminSocket', 'playLiveChatSound', 'sendLiveChatAdminReply']) {
  assertIncludes(adminLiveChatScript, token, 'admin live chat script')
}
assertIncludes(adminLiveChatScript, 'renderLiveChatCustomerAvatar', 'admin live chat customer avatar')

assertMatch(routes, /DELETE FROM live_chat_messages[\s\S]+expires_at/, 'cleanup query')

console.log('live chat contract ok')
