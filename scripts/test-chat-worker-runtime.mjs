import assert from 'node:assert/strict'
import { build } from 'esbuild'
import { Miniflare, convertV4MiniflareOptions } from 'miniflare'

const bundle = await build({ entryPoints: ['src/liveChatWorker.ts'], bundle: true, write: false, format: 'esm', platform: 'neutral', target: 'esnext', external: ['cloudflare:workers'] })
const runtime = new Miniflare(convertV4MiniflareOptions({
  workers: [
    {
      name: 'pages-probe', modules: true, compatibilityDate: '2026-02-21',
      script: `export default { fetch(request, env) { return env.ROOM.get(env.ROOM.idFromName('local-test')).fetch(request) } }`,
      durableObjects: { ROOM: { className: 'LiveChatRoom', scriptName: 'chat', useSQLite: true } },
    },
    {
      name: 'chat', modules: true, compatibilityDate: '2026-02-21',
      script: bundle.outputFiles[0].text,
      durableObjects: { LIVE_CHAT_ROOM: { className: 'LiveChatRoom', useSQLite: true } },
    },
  ],
}))
let socket
try {
  const noUpgrade = await runtime.dispatchFetch('http://local.test/')
  assert.equal(noUpgrade.status, 426)
  const badPayload = await runtime.dispatchFetch('http://local.test/broadcast', { method: 'POST', body: '{' })
  assert.equal(badPayload.status, 400)
  const response = await runtime.dispatchFetch('http://local.test/?role=customer&conversationId=local-test', { headers: { Upgrade: 'websocket' } })
  assert.equal(response.status, 101)
  socket = response.webSocket
  assert.ok(socket)
  const messages = []
  socket.addEventListener('message', event => messages.push(JSON.parse(event.data)))
  socket.accept()
  socket.send('ping')
  const broadcast = await runtime.dispatchFetch('http://local.test/broadcast', { method: 'POST', body: JSON.stringify({ id: 'local-message' }) })
  assert.equal(broadcast.status, 200)
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => { clearInterval(check); reject(new Error('WebSocket messages timed out')) }, 3000)
    const check = setInterval(() => {
      if (messages.some(m => m.type === 'pong') && messages.some(m => m.id === 'local-message')) {
        clearTimeout(timer); clearInterval(check); resolve()
      }
    }, 10)
  })
  assert.ok(messages.some(m => m.type === 'connected' && m.conversation_id === 'local-test'))
  console.log('Real workerd chat binding, WebSocket handshake, ping and broadcast passed (local only)')
} finally {
  socket?.close()
  await runtime.dispose()
}
