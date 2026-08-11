export function adminLiveChatScript(): string {
  return `// LIVE CHAT ADMIN
if (!document.getElementById('liveChatAdminBubbleStyle')) {
  const style = document.createElement('style')
  style.id = 'liveChatAdminBubbleStyle'
  style.textContent = \`
    .live-chat-admin-bubble {
      position: relative;
      width: fit-content;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      word-break: break-word;
    }
    .live-chat-admin-bubble::after {
      content: '';
      position: absolute;
      bottom: 0.04rem;
      width: 0.78rem;
      height: 0.64rem;
    }
    .live-chat-admin-bubble.is-own::after {
      right: -0.38rem;
      background: #111827;
      clip-path: path('M0 0 C2 4 6 7 12 8 C7 8 3 10 0 10 Z');
      transform: rotate(49deg);
    }
    .live-chat-admin-bubble.is-other::after {
      left: -0.38rem;
      background: #fff;
      clip-path: path('M12 0 C10 4 6 7 0 8 C5 8 9 10 12 10 Z');
    }
    @media (max-width: 767px) {
      #page-live-chat {
        padding: 0.75rem !important;
      }
      .admin-live-chat-layout {
        display: block !important;
        height: calc(100dvh - 5.75rem) !important;
        min-height: 0 !important;
      }
      .admin-live-chat-list {
        height: 100% !important;
        min-height: 0 !important;
        border-radius: 1.25rem !important;
      }
      .admin-live-chat-detail {
        position: fixed;
        inset: 0;
        z-index: 80;
        height: 100dvh;
        width: 100vw;
        border: 0 !important;
        border-radius: 0 !important;
        transform: translateX(100%);
        opacity: 0.01;
        pointer-events: none;
        transition: transform 240ms cubic-bezier(0.22, 1, 0.36, 1), opacity 180ms ease;
      }
      .admin-live-chat-layout.is-detail-open .admin-live-chat-detail {
        transform: translateX(0);
        opacity: 1;
        pointer-events: auto;
      }
      .admin-live-chat-layout.is-detail-open #liveChatAdminBackButton {
        display: inline-flex !important;
        align-items: center;
        justify-content: center;
      }
      #liveChatAdminMessages {
        min-height: 0;
      }
      #liveChatAdminInput {
        font-size: 16px !important;
      }
      .admin-live-chat-detail > .p-3 {
        padding-bottom: calc(0.75rem + env(safe-area-inset-bottom)) !important;
      }
    }
  \`
  document.head.appendChild(style)
}

let liveChatAdminConversations = []
let liveChatAdminActiveId = ''
let liveChatAdminSocket = null
let liveChatAdminLastMessageId = ''
let liveChatAdminPollTimer = null
let liveChatAdminInboxPollTimer = null
let liveChatAdminRenderedMessageIds = new Set()
let liveChatAdminSwipeStartX = 0
let liveChatAdminSwipeStartY = 0
let liveChatAdminSwipeBound = false
let liveChatAdminLastUnreadTotal = 0
let liveChatAdminUnreadInitialized = false

function isLiveChatAdminMobileViewport() {
  return Math.min(window.innerWidth || 0, window.visualViewport?.width || window.innerWidth || 0) <= 767
}

function setLiveChatAdminMobileDetailOpen(open) {
  const liveChatAdminLayout = document.getElementById('liveChatAdminLayout')
  if (!liveChatAdminLayout) return
  liveChatAdminLayout.classList.toggle('is-detail-open', !!open)
}

function closeLiveChatAdminMobileDetail() {
  setLiveChatAdminMobileDetailOpen(false)
}

function focusLiveChatAdminMobileInput() {
  if (!isLiveChatAdminMobileViewport()) return
  const input = document.getElementById('liveChatAdminInput')
  if (!input || typeof input.focus !== 'function') return
  setTimeout(function() {
    try {
      input.focus({ preventScroll: true })
    } catch(e) {
      input.focus()
    }
  }, 120)
}

function bindLiveChatAdminMobileSwipeBack() {
  if (liveChatAdminSwipeBound) return
  const detail = document.getElementById('liveChatConversationDetail')
  if (!detail) return
  liveChatAdminSwipeBound = true
  detail.addEventListener('touchstart', function(event) {
    if (!isLiveChatAdminMobileViewport()) return
    const touch = event.touches && event.touches[0]
    if (!touch) return
    liveChatAdminSwipeStartX = touch.clientX
    liveChatAdminSwipeStartY = touch.clientY
  }, { passive: true })
  detail.addEventListener('touchend', function(event) {
    if (!isLiveChatAdminMobileViewport()) return
    const touch = event.changedTouches && event.changedTouches[0]
    if (!touch) return
    const deltaX = touch.clientX - liveChatAdminSwipeStartX
    const deltaY = Math.abs(touch.clientY - liveChatAdminSwipeStartY)
    liveChatAdminSwipeStartX = 0
    liveChatAdminSwipeStartY = 0
    if (deltaX > 76 && deltaY < 70) {
      closeLiveChatAdminMobileDetail()
    }
  }, { passive: true })
}

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

function getLiveChatCustomerName(conversation) {
  return String(conversation?.customer_name || conversation?.guest_phone || 'Khách hàng')
}

function renderLiveChatCustomerAvatar(conversation, sizeClass) {
  const name = getLiveChatCustomerName(conversation)
  const avatar = String(conversation?.customer_avatar || '').trim()
  const classes = (sizeClass || 'w-10 h-10') + ' rounded-full bg-gradient-to-br from-pink-500 to-slate-900 text-white flex items-center justify-center font-bold shrink-0 overflow-hidden'
  if (avatar) {
    return '<span class="' + classes + '"><img src="' + liveChatAdminEscape(avatar) + '" alt="' + liveChatAdminEscape(name) + '" class="w-full h-full object-cover" onerror="this.parentElement.textContent=\\'' + liveChatAdminEscape(name.slice(0, 1).toUpperCase() || 'K') + '\\'"></span>'
  }
  return '<span class="' + classes + '">' + liveChatAdminEscape(name.slice(0, 1).toUpperCase() || 'K') + '</span>'
}

function updateLiveChatActiveAvatar(conversation) {
  const avatar = document.getElementById('liveChatActiveAvatar')
  if (!avatar) return
  avatar.outerHTML = renderLiveChatCustomerAvatar(conversation || {}, 'w-10 h-10').replace('<span ', '<span id="liveChatActiveAvatar" ')
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

function getLiveChatAdminUnreadTotal() {
  return liveChatAdminConversations.reduce(function(total, item) {
    return total + Number(item.admin_unread_count || 0)
  }, 0)
}

function syncLiveChatAdminBadges(unread) {
  const count = Number(unread || 0)
  const badgeText = count > 99 ? '99+' : String(count)
  const badges = [
    document.getElementById('liveChatAdminBadge'),
    document.getElementById('liveChatAdminTopBadge')
  ]
  badges.forEach(function(badge) {
    if (!badge) return
    badge.textContent = badgeText
    badge.classList.toggle('hidden', count <= 0)
    badge.classList.toggle('flex', count > 0)
  })
}

function updateLiveChatAdminUnreadState(options) {
  options = options || {}
  const unread = getLiveChatAdminUnreadTotal()
  const shouldNotify = liveChatAdminUnreadInitialized && unread > liveChatAdminLastUnreadTotal && !options.silentSound
  liveChatAdminUnreadInitialized = true
  liveChatAdminLastUnreadTotal = unread
  syncLiveChatAdminBadges(unread)
  if (shouldNotify) playLiveChatSound()
}

async function pollLiveChatAdminInboxNotifications(options) {
  options = options || {}
  try {
    const res = await axios.get('/api/admin/live-chat/conversations')
    if (!res.data?.success) throw new Error(res.data?.error || 'Không tải được live chat')
    liveChatAdminConversations = Array.isArray(res.data.data) ? res.data.data : []
    updateLiveChatAdminUnreadState(options)
    const summary = document.getElementById('liveChatAdminSummary')
    if (summary) summary.textContent = liveChatAdminConversations.length + ' hội thoại'
    if (document.body.dataset.adminPage === 'live-chat') renderLiveChatAdminInbox()
  } catch(e) {}
}

function startLiveChatAdminInboxNotifications() {
  if (liveChatAdminInboxPollTimer) return
  pollLiveChatAdminInboxNotifications({ silentSound: true })
  liveChatAdminInboxPollTimer = setInterval(function() {
    pollLiveChatAdminInboxNotifications()
  }, 3000)
}

async function loadLiveChatAdminInbox(options) {
  options = options || {}
  bindLiveChatAdminMobileSwipeBack()
  const list = document.getElementById('liveChatConversationList')
  const summary = document.getElementById('liveChatAdminSummary')
  if (!options.silent && isLiveChatAdminMobileViewport()) setLiveChatAdminMobileDetailOpen(false)
  if (list && !options.silent) list.innerHTML = '<div class="p-6 text-center text-gray-400"><i class="fas fa-spinner fa-spin text-2xl mb-2"></i><p>Đang tải live chat...</p></div>'
  try {
    const res = await axios.get('/api/admin/live-chat/conversations')
    if (!res.data?.success) throw new Error(res.data?.error || 'Không tải được live chat')
    liveChatAdminConversations = Array.isArray(res.data.data) ? res.data.data : []
    updateLiveChatAdminUnreadState({ silentSound: true })
    renderLiveChatAdminInbox()
    if (summary) summary.textContent = liveChatAdminConversations.length + ' hội thoại'
    if (!options.silent && !liveChatAdminActiveId && liveChatAdminConversations[0] && !isLiveChatAdminMobileViewport()) {
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
  updateLiveChatAdminUnreadState({ silentSound: true })
  if (!list) return
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
      + renderLiveChatCustomerAvatar(item, 'w-10 h-10')
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
  const messageId = String(message.id || '')
  if (messageId && liveChatAdminRenderedMessageIds.has(messageId)) return
  if (messageId) liveChatAdminRenderedMessageIds.add(messageId)
  const sender = String(message.sender_type || 'customer')
  const wrap = document.createElement('div')
  wrap.className = 'flex ' + (sender === 'admin' ? 'justify-end' : 'justify-start')
  const bubble = document.createElement('div')
  bubble.className = 'live-chat-admin-bubble ' + (sender === 'admin' ? 'is-own bg-gray-900 text-white' : 'is-other bg-white border text-gray-800') + ' max-w-[78%] rounded-2xl px-3 py-2 text-sm'
  if (String(message.message_type || '') === 'product') {
    const img = message.product_thumbnail ? '<img src="' + liveChatAdminEscape(message.product_thumbnail) + '" alt="' + liveChatAdminEscape(message.product_name || 'Sản phẩm khách gửi') + '" class="w-14 h-14 rounded-xl object-cover bg-gray-100" onerror="this.style.display=\\'none\\'">' : '<span class="w-14 h-14 rounded-xl bg-pink-100 text-pink-500 flex items-center justify-center"><i class="fas fa-shirt"></i></span>'
    bubble.innerHTML = '<div class="flex items-center gap-3">' + img + '<div class="min-w-0"><p class="font-bold truncate">' + liveChatAdminEscape(message.product_name || message.body || 'Sản phẩm') + '</p><a class="' + (sender === 'admin' ? 'text-pink-200' : 'text-pink-600') + ' text-xs font-semibold" href="' + liveChatAdminEscape(message.product_url || '#') + '" target="_blank">Mở sản phẩm</a></div></div>'
  } else {
    bubble.textContent = String(message.body || '')
  }
  wrap.appendChild(bubble)
  box.appendChild(wrap)
  box.scrollTop = box.scrollHeight
}

async function pollLiveChatAdminConversation() {
  if (!liveChatAdminActiveId || document.body.dataset.adminPage !== 'live-chat') return
  try {
    const res = await axios.get('/api/admin/live-chat/' + encodeURIComponent(liveChatAdminActiveId) + '/messages')
    const messages = Array.isArray(res.data?.data?.messages) ? res.data.data.messages : []
    let hasCustomerMessage = false
    messages.forEach(function(message) {
      const id = String(message?.id || '')
      const isNew = id && !liveChatAdminRenderedMessageIds.has(id)
      renderLiveChatAdminMessage(message)
      if (isNew && String(message?.sender_type || '') === 'customer') hasCustomerMessage = true
      if (id) liveChatAdminLastMessageId = id
    })
    if (hasCustomerMessage) playLiveChatSound()
    if (hasCustomerMessage) loadLiveChatAdminInbox({ silent: true })
  } catch(e) {}
}

function startLiveChatAdminPolling() {
  if (liveChatAdminPollTimer) return
  liveChatAdminPollTimer = setInterval(pollLiveChatAdminConversation, 3000)
}

function stopLiveChatAdminPolling() {
  if (!liveChatAdminPollTimer) return
  clearInterval(liveChatAdminPollTimer)
  liveChatAdminPollTimer = null
}

async function openLiveChatAdminConversation(conversationId) {
  liveChatAdminActiveId = String(conversationId || '')
  renderLiveChatAdminInbox()
  if (!liveChatAdminActiveId) return
  setLiveChatAdminMobileDetailOpen(true)
  try {
    const res = await axios.get('/api/admin/live-chat/' + encodeURIComponent(liveChatAdminActiveId) + '/messages')
    const data = res.data?.data || {}
    const conversation = data.conversation || {}
    const messages = Array.isArray(data.messages) ? data.messages : []
    updateLiveChatActiveAvatar(conversation)
    document.getElementById('liveChatActiveName').textContent = getLiveChatCustomerName(conversation)
    document.getElementById('liveChatActiveMeta').textContent = (conversation.guest_phone ? ('SĐT: ' + conversation.guest_phone + ' · ') : '') + 'Lưu 7 ngày'
    const box = document.getElementById('liveChatAdminMessages')
    if (box) box.innerHTML = ''
    liveChatAdminRenderedMessageIds = new Set()
    messages.forEach(renderLiveChatAdminMessage)
    liveChatAdminLastMessageId = messages.length ? String(messages[messages.length - 1].id || '') : ''
    connectLiveChatAdminSocket()
    startLiveChatAdminPolling()
    loadLiveChatAdminInbox({ silent: true })
    focusLiveChatAdminMobileInput()
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
        loadLiveChatAdminInbox({ silent: true })
      } catch(e) {}
    }
    liveChatAdminSocket.onclose = function() {
      if (status) {
        status.textContent = 'Offline'
        status.className = 'text-xs font-semibold rounded-full bg-gray-100 text-gray-500 px-2 py-1'
      }
      startLiveChatAdminPolling()
    }
  } catch(e) {
    if (status) status.textContent = 'Offline'
    startLiveChatAdminPolling()
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
    loadLiveChatAdminInbox({ silent: true })
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
