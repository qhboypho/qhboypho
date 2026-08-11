import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'

const sections = readFileSync(new URL('../src/pages/admin/sections.ts', import.meta.url), 'utf8')
const script = readFileSync(new URL('../src/pages/admin/script.ts', import.meta.url), 'utf8')
const liveChatScript = readFileSync(new URL('../src/pages/admin/script-live-chat.ts', import.meta.url), 'utf8')

describe('admin live chat mobile contract', () => {
  it('uses top bar chat action instead of order notification bell', () => {
    assert.match(sections, /id="adminLiveChatTopButton"/)
    assert.match(sections, /onclick="showPage\('live-chat'\)"/)
    assert.doesNotMatch(sections, /id="adminOrderNotifyButton"[\s\S]*?<\/button>[\s\S]*?id="sidebarDesktopToggle"/)
  })

  it('moves order notification enable action into settings notifications', () => {
    assert.match(sections, /id="adminOrderNotifySettingsButton"/)
    assert.match(sections, /onclick="enableAdminOrderNotifications\(\)"/)
    assert.match(sections, /id="adminOrderNotifyIcon"/)
    assert.match(sections, /id="adminOrderNotifyLabel"/)
  })

  it('renders mobile live chat as list first, then full-screen conversation detail', () => {
    assert.match(sections, /id="liveChatAdminLayout"/)
    assert.match(sections, /id="liveChatConversationPanel"/)
    assert.match(sections, /id="liveChatConversationDetail"/)
    assert.match(sections, /id="liveChatAdminBackButton"/)
    assert.match(liveChatScript, /setLiveChatAdminMobileDetailOpen/)
    assert.match(liveChatScript, /focusLiveChatAdminMobileInput/)
    assert.match(liveChatScript, /liveChatAdminLayout\.classList\.toggle\('is-detail-open'/)
    assert.match(liveChatScript, /bindLiveChatAdminMobileSwipeBack/)
    assert.match(liveChatScript, /closeLiveChatAdminMobileDetail\(\)/)
    assert.match(liveChatScript, /touchstart/)
    assert.match(liveChatScript, /touchend/)
  })

  it('keeps notification button sync compatible after moving the button', () => {
    assert.match(script, /adminOrderNotifySettingsButton/)
    assert.match(script, /adminOrderNotifyIcon/)
    assert.match(script, /adminOrderNotifyLabel/)
  })
})
