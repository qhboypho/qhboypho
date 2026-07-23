export function adminLiveChatScript(): string {
  return `// LIVE CHAT ADMIN
let liveChatAdminConversations = []
let liveChatAdminActiveId = ''
let liveChatAdminSocket = null
let liveChatAdminLastMessageId = ''

function normalizeLiveChatAdminTime(value) {
  if (!value) return ''
  const date = new Date(String(value).replace(' ', 'T'))
  if (!Number.isFinite(date.getTime())) return String(value)
  return date.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })
}

function liveChatAdminEscape(value) {
  return String(value || '').replace(/[&<>"']/g, function(ch) {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch] || ch
  })
}

function playLiveChatSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(988, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(1318, ctx.currentTime + 0.16)
    gain.gain.setValueAtTime(0.0001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.24, ctx.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.34)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.36)
  } catch(e) {}
}

async function loadLiveChatAdminInbox() {
  const list = document.getElementById('liveChatConversationList')
  const summary = document.getElementById('liveChatAdminSummary')
  if (list) list.innerHTML = '<div class="p-6 text-center text-gray-400"><i class="fas fa-spinner fa-spin text-2xl mb-2"></i><p>Đang tải live chat...</p></div>'
  try {
    const res = await axios.get('/api/admin/live-chat/conversations')
    if (!res.data?.success) throw new Error(res.data?.error || 'Không tải được live chat')
    liveChatAdminConversations = Array.isArray(res.data.data) ? res.data.data : []
    renderLiveChatAdminInbox()
    if (summary) summary.textContent = liveChatAdminConversations.length + ' hội thoại'
    if (!liveChatAdminActiveId && liveChatAdminConversations[0]) {
      openLiveChatAdminConversation(liveChatAdminConversations[0].id)
    }
  } catch(e) {
    if (e?.response?.status === 401) {
      showAdminToast('Phiên đăng nhập đã hết hạn', 'error')
      setTimeout(function() { window.location.href = '/admin/login' }, 400)
      return
    }
    if (summary) summary.textContent = 'Lỗi tải dữ liệu'
    if (list) list.innerHTML = '<div class="p-6 text-center text-red-500"><i class="fas fa-triangle-exclamation text-2xl mb-2"></i><p>' + liveChatAdminEscape(e?.message || 'Không tải được live chat') + '</p></div>'
  }
}

function renderLiveChatAdminInbox() {
  const list = document.getElementById('liveChatConversationList')
  const badge = document.getElementById('liveChatAdminBadge')
  if (!list) return
  const unread = liveChatAdminConversations.reduce(function(total, item) { return total + Number(item.admin_unread_count || 0) }, 0)
  if (badge) {
    badge.textContent = unread > 99 ? '99+' : String(unread)
    badge.classList.toggle('hidden', unread <= 0)
  }
  if (!liveChatAdminConversations.length) {
    list.innerHTML = '<div class="p-8 text-center text-gray-400"><i class="fas fa-comments text-3xl mb-3"></i><p>Chưa có hội thoại nào</p></div>'
    return
  }
  list.innerHTML = liveChatAdminConversations.map(function(item) {
    const active = item.id === liveChatAdminActiveId
    const product = item.product_name ? '<p class="mt-1 text-xs text-pink-600 truncate"><i class="fas fa-shirt mr-1"></i>' + liveChatAdminEscape(item.product_name) + '</p>' : ''
    const unreadHtml = Number(item.admin_unread_count || 0) > 0 ? '<span class="ml-2 rounded-full bg-pink-500 px-2 py-0.5 text-xs font-bold text-white">' + Number(item.admin_unread_count || 0) + '</span>' : ''
    return '<button type="button" onclick="openLiveChatAdminConversation(\\'' + liveChatAdminEscape(item.id) + '\\')" class="w-full text-left p-4 hover:bg-pink-50 transition ' + (active ? 'bg-pink-50' : 'bg-white') + '">'
      + '<div class="flex items-start gap-3">'
      + '<span class="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold shrink-0">' + liveChatAdminEscape((item.customer_name || 'KH').slice(0, 1).toUpperCase()) + '</span>'
      + '<div class="min-w-0 flex-1"><div class="flex items-center gap-1"><p class="font-bold text-sm text-gray-900 truncate">' + liveChatAdminEscape(item.customer_name || item.guest_phone || 'Khách hàng') + '</p>' + unreadHtml + '</div>'
      + '<p class="text-xs text-gray-500 truncate">' + liveChatAdminEscape(item.last_message || 'Chưa có tin nhắn') + '</p>'
      + product
      + '<p class="mt-1 text-[11px] text-gray-400">' + normalizeLiveChatAdminTime(item.last_message_at || item.updated_at) + '</p></div>'
      + '</div></button>'
  }).join('')
}

function renderLiveChatAdminMessage(message) {
  const box = document.getElementById('liveChatAdminMessages')
  if (!box || !message) return
  const sender = String(message.sender_type || 'customer')
  const wrap = document.createElement('div')
  wrap.className = 'flex ' + (sender === 'admin' ? 'justify-end' : 'justify-start')
  const bubble = document.createElement('div')
  bubble.className = 'max-w-[78%] rounded-2xl px-3 py-2 text-sm ' + (sender === 'admin' ? 'bg-gray-900 text-white' : 'bg-white border text-gray-800')
  if (String(message.message_type || '') === 'product') {
    const img = message.product_thumbnail ? '<img src="' + liveChatAdminEscape(message.product_thumbnail) + '" class="w-14 h-14 rounded-xl object-cover bg-gray-100" onerror="this.style.display=\\'none\\'">' : '<span class="w-14 h-14 rounded-xl bg-pink-100 text-pink-500 flex items-center justify-center"><i class="fas fa-shirt"></i></span>'
    bubble.innerHTML = '<div class="flex items-center gap-3">' + img + '<div class="min-w-0"><p class="font-bold truncate">' + liveChatAdminEscape(message.product_name || message.body || 'Sản phẩm') + '</p><a class="' + (sender === 'admin' ? 'text-pink-200' : 'text-pink-600') + ' text-xs font-semibold" href="' + liveChatAdminEscape(message.product_url || '#') + '" target="_blank">Mở sản phẩm</a></div></div>'
  } else {
    bubble.textContent = String(message.body || '')
  }
  wrap.appendChild(bubble)
  box.appendChild(wrap)
  box.scrollTop = box.scrollHeight
}

async function openLiveChatAdminConversation(conversationId) {
  liveChatAdminActiveId = String(conversationId || '')
  renderLiveChatAdminInbox()
  if (!liveChatAdminActiveId) return
  try {
    const res = await axios.get('/api/admin/live-chat/' + encodeURIComponent(liveChatAdminActiveId) + '/messages')
    const data = res.data?.data || {}
    const conversation = data.conversation || {}
    const messages = Array.isArray(data.messages) ? data.messages : []
    document.getElementById('liveChatActiveName').textContent = conversation.customer_name || conversation.guest_phone || 'Khách hàng'
    document.getElementById('liveChatActiveMeta').textContent = (conversation.guest_phone ? ('SĐT: ' + conversation.guest_phone + ' · ') : '') + 'Lưu 7 ngày'
    const box = document.getElementById('liveChatAdminMessages')
    if (box) box.innerHTML = ''
    messages.forEach(renderLiveChatAdminMessage)
    liveChatAdminLastMessageId = messages.length ? String(messages[messages.length - 1].id || '') : ''
    connectLiveChatAdminSocket()
    loadLiveChatAdminInbox()
  } catch(e) {
    showAdminToast('Không mở được hội thoại', 'error')
  }
}

function connectLiveChatAdminSocket() {
  if (!liveChatAdminActiveId) return
  if (liveChatAdminSocket) {
    try { liveChatAdminSocket.close() } catch(e) {}
    liveChatAdminSocket = null
  }
  const status = document.getElementById('liveChatSocketStatus')
  try {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    liveChatAdminSocket = new WebSocket(proto + '//' + window.location.host + '/api/admin/live-chat/' + encodeURIComponent(liveChatAdminActiveId) + '/ws')
    liveChatAdminSocket.onopen = function() {
      if (status) {
        status.textContent = 'Online'
        status.className = 'text-xs font-semibold rounded-full bg-emerald-50 text-emerald-600 px-2 py-1'
      }
    }
    liveChatAdminSocket.onmessage = function(event) {
      try {
        const payload = JSON.parse(event.data)
        const message = payload.message
        if (!message || String(message.id || '') === liveChatAdminLastMessageId) return
        liveChatAdminLastMessageId = String(message.id || '')
        renderLiveChatAdminMessage(message)
        if (String(message.sender_type || '') === 'customer') playLiveChatSound()
        loadLiveChatAdminInbox()
      } catch(e) {}
    }
    liveChatAdminSocket.onclose = function() {
      if (status) {
        status.textContent = 'Offline'
        status.className = 'text-xs font-semibold rounded-full bg-gray-100 text-gray-500 px-2 py-1'
      }
    }
  } catch(e) {
    if (status) status.textContent = 'Offline'
  }
}

async function sendLiveChatAdminReply() {
  const input = document.getElementById('liveChatAdminInput')
  const body = String(input?.value || '').trim()
  if (!liveChatAdminActiveId) { showAdminToast('Chọn hội thoại trước', 'warning'); return }
  if (!body) return
  try {
    if (input) input.value = ''
    const res = await axios.post('/api/admin/live-chat/' + encodeURIComponent(liveChatAdminActiveId) + '/messages', { body })
    renderLiveChatAdminMessage(res.data?.data)
    liveChatAdminLastMessageId = String(res.data?.data?.id || liveChatAdminLastMessageId)
    loadLiveChatAdminInbox()
  } catch(e) {
    showAdminToast('Không gửi được phản hồi', 'error')
    if (input) input.value = body
  }
}

function handleLiveChatAdminInputKey(event) {
  if (event.key === 'Enter') {
    event.preventDefault()
    sendLiveChatAdminReply()
  }
}
`
}
