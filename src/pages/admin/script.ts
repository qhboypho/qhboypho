export function adminInlineScript(): string {
  return `// STATE
let adminProducts = []
let adminProductTypes = []
let adminOrders = []
let adminReviews = []
let adminReviewFormImages = []
let selectedOrderIds = new Set()
let filteredAdminOrders = []
let paginatedAdminOrders = []
let ordersViewMode = 'to_arrange'
let currentOrdersPage = 1
let ordersSearchExpanded = false
const ORDERS_PAGE_SIZE = 50
let arrangedOrdersForPrint = []
let arrangedFailedOrders = []
let colors = []
let sizes = []
let skuPricingEnabled = false
let productSkuRows = []
let galleryImages = ['','','','','','','','','']
let editingId = null
let gallerySlotClickBound = false
let ghtkPickupAddresses = []
let adminProfile = null
let adminAvatarMenuOpen = false
let dashboardFilterMode = 'month'
let dashboardFilterInitialized = false
let dashboardDatePickerOpen = ''
let dashboardDatePickerView = null
let dashboardDatePickerYearListOpen = false
let settingsSubmenuOpen = false
let settingsActiveSubPage = ''
let productSubmenuOpen = false
let productActiveSubPage = ''
let productTypesEditorOpen = true
let marketingSubmenuOpen = false
let marketingActiveSubPage = ''
let desktopSidebarCollapsed = false
let selectedColorImage = ''
let adminOverlaySafetyScheduled = false
let adminScrollLockY = 0
let adminScrollLockActive = false
let adminPwaInstallPrompt = null
let adminSidebarGestureStart = null
let adminOrderNotifyTimer = null
let adminOrderNotifyAudioContext = null
let adminOrderNotifyInitialized = false
let adminOrderNotifyLastSeenId = 0
let adminOrderNotifyEnabled = false
let adminOrderSoundEnabled = false
let adminOrderPushEnabled = false
let adminUiSettings = {
  admin_brand_name: 'Boypho',
  admin_full_brand_name: 'QH Boypho',
  admin_panel_label: 'Admin Panel'
}
let adminMembers = []
let adminPermissionItems = []
let editingAdminMemberId = ''
let adminMemberPermissionsTargetId = ''
let marketplaceOrders = []
let marketplaceFilters = { channel: 'all', status: 'all', date: '' }
let marketplaceConfigLoaded = false
const ADMIN_ORDER_NOTIFY_ENABLED_KEY = 'boypho_admin_order_notifications_enabled'
const ADMIN_ORDER_SOUND_ENABLED_KEY = 'boypho_admin_order_sound_enabled'
const ADMIN_ORDER_LAST_SEEN_KEY = 'boypho_admin_order_last_seen_id'
const adminScrollLockStyles = {
  bodyPosition: '',
  bodyTop: '',
  bodyLeft: '',
  bodyRight: '',
  bodyWidth: '',
  bodyOverflow: '',
  htmlOverflow: '',
  htmlOverscrollBehavior: '',
}
const MAX_PRODUCT_PAYLOAD_SIZE = 1200000
const ADMIN_OVERLAY_IDS = ['productModal', 'orderDetailModal', 'arrangeSuccessModal', 'createFlashSaleModal', 'flashSaleProductPickerModal', 'adminChangePasswordModal', 'adminMemberAccountModal', 'adminMemberPermissionsModal', 'reviewAdminModal', 'dashboardCustomerModal', 'customerOrderHistoryModal', 'customerActionConfirmModal']
const ADMIN_PERMISSION_LABELS = {
  dashboard: 'Dashboard',
  products: 'Sản phẩm',
  'product-types': 'Loại sản phẩm',
  orders: 'Đơn hàng',
  returns: 'Hoàn trả',
  customers: 'Khách hàng',
  marketplaces: 'Sàn TMĐT',
  'live-chat': 'Live chat',
  reviews: 'Đánh giá',
  backup: 'Dữ liệu',
  vouchers: 'Khuyến mãi',
  featured: 'Sản phẩm nổi bật',
  flashsale: 'Flashsale',
  'settings-social': 'MXH',
  'settings-payment': 'Thanh toán',
  'settings-text-ui': 'Text UI',
  'settings-images': 'Hình ảnh',
  'settings-notifications': 'Thông báo',
  'settings-admin-ui': 'Trang quản trị',
  'settings-warehouse': 'Kho hàng'
}

function lockAdminPageScroll() {
  if (adminScrollLockActive) return
  adminScrollLockActive = true
  const body = document.body
  const html = document.documentElement
  adminScrollLockY = Math.max(0, window.scrollY || window.pageYOffset || 0)
  adminScrollLockStyles.bodyPosition = body.style.position || ''
  adminScrollLockStyles.bodyTop = body.style.top || ''
  adminScrollLockStyles.bodyLeft = body.style.left || ''
  adminScrollLockStyles.bodyRight = body.style.right || ''
  adminScrollLockStyles.bodyWidth = body.style.width || ''
  adminScrollLockStyles.bodyOverflow = body.style.overflow || ''
  adminScrollLockStyles.htmlOverflow = html.style.overflow || ''
  adminScrollLockStyles.htmlOverscrollBehavior = html.style.overscrollBehavior || ''
  html.classList.add('admin-scroll-locked')
  body.classList.add('admin-scroll-locked')
  html.style.overflow = 'hidden'
  html.style.overscrollBehavior = 'none'
  body.style.position = 'fixed'
  body.style.top = '-' + adminScrollLockY + 'px'
  body.style.left = '0'
  body.style.right = '0'
  body.style.width = '100%'
  body.style.overflow = 'hidden'
}

function unlockAdminPageScroll() {
  if (!adminScrollLockActive) return
  const body = document.body
  const html = document.documentElement
  html.classList.remove('admin-scroll-locked')
  body.classList.remove('admin-scroll-locked')
  body.style.position = adminScrollLockStyles.bodyPosition
  body.style.top = adminScrollLockStyles.bodyTop
  body.style.left = adminScrollLockStyles.bodyLeft
  body.style.right = adminScrollLockStyles.bodyRight
  body.style.width = adminScrollLockStyles.bodyWidth
  body.style.overflow = adminScrollLockStyles.bodyOverflow
  html.style.overflow = adminScrollLockStyles.htmlOverflow
  html.style.overscrollBehavior = adminScrollLockStyles.htmlOverscrollBehavior
  adminScrollLockActive = false
  const restoreY = adminScrollLockY
  adminScrollLockY = 0
  window.scrollTo(0, restoreY)
}

function forceHideAdminOverlay(el) {
  if (!el) return
  if (el.hasAttribute('data-admin-overlay-open')) el.removeAttribute('data-admin-overlay-open')
  if (!el.classList.contains('hidden')) el.classList.add('hidden')
  if (el.classList.contains('flex')) el.classList.remove('flex')
  if (el.style.display !== 'none') el.style.display = 'none'
  if (el.style.pointerEvents !== 'none') el.style.pointerEvents = 'none'
  queueAdminOverlaySafetySync()
}

function showAdminOverlay(el, displayMode = 'flex') {
  if (!el) return
  el.setAttribute('data-admin-overlay-open', '1')
  el.style.display = displayMode
  el.style.pointerEvents = ''
  el.classList.remove('hidden')
  if (displayMode === 'flex') el.classList.add('flex')
  lockAdminPageScroll()
  queueAdminOverlaySafetySync()
}

// NAVIGATION
function isAdminOverlayDebugEnabled() {
  const host = String(window.location.hostname || '')
  return host === '127.0.0.1' || host === 'localhost' || window.location.search.includes('debugOverlay=1')
}

function debugAdminOverlayState(reason = '') {
  if (!isAdminOverlayDebugEnabled()) return
  const inspectIds = [...ADMIN_OVERLAY_IDS, 'adminChangePasswordModal', 'sidebarOverlay']
  const rows = inspectIds.map((id) => {
    const el = document.getElementById(id)
    if (!el) return { id, missing: true }
    const style = window.getComputedStyle(el)
    return {
      id,
      hiddenClass: el.classList.contains('hidden'),
      inlineDisplay: el.style.display || '',
      display: style.display,
      pointerEvents: style.pointerEvents,
      opacity: style.opacity,
      zIndex: style.zIndex,
    }
  })
  console.groupCollapsed('[admin-overlay] ' + (reason || 'state'))
  console.table(rows)
  console.groupEnd()
}

function getInitialFromName(name) {
  const text = String(name || '').trim()
  if (!text) return 'A'
  return text.charAt(0).toUpperCase()
}

function normalizeAdminUiText(value, fallback, max) {
  const text = String(value || '')
    .replace(/[<>]/g, '')
    .replace(/\\s+/g, ' ')
    .trim()
    .slice(0, max || 80)
  return text || fallback
}

function getAdminUiBrandName() {
  return normalizeAdminUiText(adminUiSettings?.admin_brand_name, 'Boypho', 40)
}

function getAdminUiFullBrandName() {
  const brandName = getAdminUiBrandName()
  return normalizeAdminUiText(adminUiSettings?.admin_full_brand_name, /^qh\\s+/i.test(brandName) ? brandName : 'QH ' + brandName, 60)
}

function getAdminUiPanelLabel() {
  return normalizeAdminUiText(adminUiSettings?.admin_panel_label, 'Admin Panel', 80)
}

function applyAdminUiSettings(settings) {
  if (settings) adminUiSettings = { ...adminUiSettings, ...settings }
  const brandName = getAdminUiBrandName()
  const fullBrandName = getAdminUiFullBrandName()
  const panelLabel = getAdminUiPanelLabel()
  const sidebarBrand = document.getElementById('adminSidebarBrandName')
  const sidebarPanel = document.getElementById('adminSidebarPanelLabel')
  const sidebarLogo = document.getElementById('adminSidebarLogoImg')
  const appleTitleEl = document.querySelector('meta[name="apple-mobile-web-app-title"]')
  if (sidebarBrand) sidebarBrand.textContent = brandName
  if (sidebarPanel) sidebarPanel.textContent = panelLabel
  if (sidebarLogo) sidebarLogo.alt = fullBrandName
  if (appleTitleEl) appleTitleEl.setAttribute('content', brandName + ' Admin')
  document.title = fullBrandName + ' Admin'
  applyAdminAvatarUI()
}

async function loadAdminUiSettings(options = {}) {
  try {
    const res = await axios.get('/api/public/admin-ui-settings')
    applyAdminUiSettings(res.data?.data || null)
    return adminUiSettings
  } catch (_) {
    if (!options.silent) applyAdminUiSettings(adminUiSettings)
    return adminUiSettings
  }
}

function isSuperAdminProfile() {
  return adminProfile?.isSuperAdmin === true || String(adminProfile?.adminUserKey || '').toLowerCase() === 'admin'
}

function getAdminPermissions() {
  return adminProfile?.permissions || {}
}

function canAdminViewPage(pageName) {
  if (pageName === 'members') return isSuperAdminProfile()
  if (isSuperAdminProfile()) return true
  const key = normalizeAdminPermissionPageKey(pageName)
  if (!key) return true
  const entry = getAdminPermissions()[key]
  return !!(entry?.view || entry?.edit)
}

function canAdminEditPage(pageName) {
  if (pageName === 'members') return isSuperAdminProfile()
  if (isSuperAdminProfile()) return true
  const key = normalizeAdminPermissionPageKey(pageName)
  if (!key) return true
  return getAdminPermissions()[key]?.edit === true
}

function normalizeAdminPermissionPageKey(pageName) {
  if (pageName === 'settings') return 'settings-warehouse'
  if (pageName === 'members') return null
  return pageName
}

function getFirstAllowedAdminPage() {
  const pages = ['dashboard','orders','marketplaces','products','customers','live-chat','returns','reviews','vouchers','featured','flashsale','backup','settings-social','settings-payment','settings-text-ui','settings-images','settings-notifications','settings-admin-ui','settings-warehouse']
  return pages.find((page) => canAdminViewPage(page)) || 'dashboard'
}

function syncAdminPermissionUI() {
  const superAdmin = isSuperAdminProfile()
  document.body.dataset.adminSuper = superAdmin ? '1' : '0'
  document.querySelectorAll('.nav-item[data-page]').forEach((btn) => {
    const page = btn.dataset.page
    const visible = page === 'members' ? superAdmin : canAdminViewPage(page)
    btn.classList.toggle('hidden', !visible)
  })
  document.querySelectorAll('.nav-sub-item[data-sub-page]').forEach((btn) => {
    const page = btn.dataset.subPage
    const visible = canAdminViewPage(page)
    btn.classList.toggle('hidden', !visible)
  })
  const productMenu = document.getElementById('productMenuBtn')
  const productSubmenu = document.getElementById('productSubmenu')
  const hasProductChild = !!productSubmenu?.querySelector('.nav-sub-item:not(.hidden)')
  if (productMenu) productMenu.classList.toggle('hidden', !hasProductChild && !canAdminViewPage('products'))
  const marketingMenu = document.getElementById('marketingMenuBtn')
  const marketingSubmenu = document.getElementById('marketingSubmenu')
  const hasMarketingChild = !!marketingSubmenu?.querySelector('.nav-sub-item:not(.hidden)')
  if (marketingMenu) marketingMenu.classList.toggle('hidden', !hasMarketingChild)
  const settingsMenu = document.getElementById('settingsMenuBtn')
  const settingsSubmenu = document.getElementById('settingsSubmenu')
  const hasSettingsChild = !!settingsSubmenu?.querySelector('.nav-sub-item:not(.hidden)')
  if (settingsMenu) settingsMenu.classList.toggle('hidden', !hasSettingsChild)
  document.body.dataset.adminPermissionReady = '1'
}

function applyAdminAvatarUI() {
  const rawAvatar = String(adminProfile?.avatar || '').trim()
  const lowerAvatar = rawAvatar.toLowerCase()
  const avatar = ['null', 'undefined', 'none'].includes(lowerAvatar) ? '' : rawAvatar
  const fallbackName = getAdminUiFullBrandName()
  const name = String(adminProfile?.name || fallbackName).trim() || fallbackName
  const adminKey = String(adminProfile?.adminUserKey || 'admin').trim().toUpperCase()

  const bindAvatarImg = (img, fallback) => {
    if (!img || !fallback || img.dataset.bound === '1') return
    img.dataset.bound = '1'
    img.addEventListener('load', () => {
      if (!img.src) return
      if (img.naturalWidth <= 1 && img.naturalHeight <= 1) {
        img.classList.add('hidden')
        fallback.classList.remove('hidden')
        return
      }
      img.classList.remove('hidden')
      fallback.classList.add('hidden')
    })
    img.addEventListener('error', () => {
      img.classList.add('hidden')
      fallback.classList.remove('hidden')
    })
  }

  const syncAvatar = (imgId, fallbackId) => {
    const img = document.getElementById(imgId)
    const fallback = document.getElementById(fallbackId)
    if (!img || !fallback) return
    bindAvatarImg(img, fallback)
    fallback.textContent = getInitialFromName(name)
    if (avatar) {
      img.src = avatar
      img.classList.remove('hidden')
      fallback.classList.add('hidden')
    } else {
      img.src = ''
      img.classList.add('hidden')
      fallback.classList.remove('hidden')
    }
  }

  syncAvatar('adminHeaderAvatarImg', 'adminHeaderAvatarFallback')
  syncAvatar('adminMenuAvatarImg', 'adminMenuAvatarFallback')

  const headerName = document.getElementById('adminHeaderProfileName')
  if (headerName) headerName.textContent = name
  const menuName = document.getElementById('adminMenuProfileName')
  if (menuName) menuName.textContent = name
  const menuCode = document.getElementById('adminMenuShopCode')
  if (menuCode) menuCode.textContent = 'Shop Code: ' + adminKey
}

function applyAvatarSrcDirect(dataUrl) {
  const ids = [
    ['adminHeaderAvatarImg', 'adminHeaderAvatarFallback'],
    ['adminMenuAvatarImg', 'adminMenuAvatarFallback']
  ]
  ids.forEach(([imgId, fbId]) => {
    const img = document.getElementById(imgId)
    const fallback = document.getElementById(fbId)
    if (!img || !fallback) return
    if (!dataUrl) {
      img.src = ''
      img.classList.add('hidden')
      fallback.classList.remove('hidden')
      return
    }
    img.src = dataUrl
    img.classList.remove('hidden')
    fallback.classList.add('hidden')
  })
}

function syncAdminInstallButton() {
  const btn = document.getElementById('adminInstallAppButton')
  if (!btn) return
  const standalone = window.matchMedia?.('(display-mode: standalone)')?.matches || window.navigator.standalone === true
  const canInstall = !!adminPwaInstallPrompt && !standalone
  btn.classList.toggle('hidden', !canInstall)
  btn.classList.toggle('inline-flex', canInstall)
}

function registerAdminPwa() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/admin-sw.js', { scope: '/' }).catch(() => {})
    })
  }

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    adminPwaInstallPrompt = event
    syncAdminInstallButton()
  })

  window.addEventListener('appinstalled', () => {
    adminPwaInstallPrompt = null
    syncAdminInstallButton()
  })

  syncAdminInstallButton()
}

async function installAdminPwa() {
  if (!adminPwaInstallPrompt) return
  const promptEvent = adminPwaInstallPrompt
  adminPwaInstallPrompt = null
  syncAdminInstallButton()
  try {
    await promptEvent.prompt()
    await promptEvent.userChoice
  } catch (_) {}
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i)
  return outputArray
}

async function getAdminServiceWorkerRegistration() {
  if (!('serviceWorker' in navigator)) return null
  try {
    const registration = await navigator.serviceWorker.register('/admin-sw.js', { scope: '/' })
    return registration || await navigator.serviceWorker.ready
  } catch (_) {
    try {
      return await navigator.serviceWorker.ready
    } catch (_) {
      return null
    }
  }
}

async function registerAdminPushSubscription() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { ok: false, reason: 'unsupported' }
  }
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return { ok: false, reason: 'permission' }
  }
  const keyRes = await axios.get('/api/admin/push/vapid-public-key', { headers: { 'Cache-Control': 'no-cache' } })
  const pushConfig = keyRes.data?.data || {}
  const publicKey = String(pushConfig.publicKey || '').trim()
  if (!pushConfig.enabled || !publicKey) {
    return { ok: false, reason: 'missing_vapid' }
  }
  const registration = await getAdminServiceWorkerRegistration()
  if (!registration || !registration.pushManager) return { ok: false, reason: 'service_worker' }

  let subscription = await registration.pushManager.getSubscription()
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    })
  }
  await axios.post('/api/admin/push/subscriptions', {
    subscription: subscription.toJSON ? subscription.toJSON() : subscription
  })
  return { ok: true, reason: '' }
}

function readAdminOrderNotifySetting(key, fallback) {
  try {
    const value = localStorage.getItem(key)
    if (value === null) return fallback
    return value === '1'
  } catch (_) {
    return fallback
  }
}

function writeAdminOrderNotifySetting(key, enabled) {
  try {
    localStorage.setItem(key, enabled ? '1' : '0')
  } catch (_) {}
}

function readAdminOrderLastSeenId() {
  try {
    const id = Number(localStorage.getItem(ADMIN_ORDER_LAST_SEEN_KEY) || '0')
    return Number.isFinite(id) && id > 0 ? id : 0
  } catch (_) {
    return 0
  }
}

function writeAdminOrderLastSeenId(id) {
  adminOrderNotifyLastSeenId = Math.max(Number(id || 0), adminOrderNotifyLastSeenId || 0)
  try {
    localStorage.setItem(ADMIN_ORDER_LAST_SEEN_KEY, String(adminOrderNotifyLastSeenId || 0))
  } catch (_) {}
}

function syncAdminOrderNotifyButton() {
  const btn = document.getElementById('adminOrderNotifySettingsButton')
  const icon = document.getElementById('adminOrderNotifyIcon')
  const label = document.getElementById('adminOrderNotifyLabel')
  if (!btn || !icon) return
  const notificationBlocked = 'Notification' in window && Notification.permission === 'denied'
  const active = adminOrderNotifyEnabled && adminOrderSoundEnabled
  btn.classList.toggle('border-pink-200', active)
  btn.classList.toggle('bg-pink-50', active)
  btn.classList.toggle('text-pink-600', active)
  btn.classList.toggle('text-gray-500', !active)
  icon.className = active ? 'fas fa-bell text-sm' : 'far fa-bell text-sm'
  btn.title = active
    ? (notificationBlocked
      ? 'Âm báo đang bật, trình duyệt đang chặn thông báo hệ thống'
      : (adminOrderPushEnabled ? 'Thông báo đơn mới đang bật cả khi PWA đóng' : 'Thông báo đơn mới đang bật khi dashboard đang mở'))
    : 'Bật thông báo đơn mới'
  btn.setAttribute('aria-label', btn.title)
  if (label) label.textContent = 'Thông báo'
}

function getAdminOrderAudioContext() {
  const AudioCtor = window.AudioContext || window.webkitAudioContext
  if (!AudioCtor) return null
  if (!adminOrderNotifyAudioContext) adminOrderNotifyAudioContext = new AudioCtor()
  return adminOrderNotifyAudioContext
}

async function unlockAdminOrderSound() {
  const ctx = getAdminOrderAudioContext()
  if (!ctx) return false
  try {
    if (ctx.state === 'suspended') await ctx.resume()
    return true
  } catch (_) {
    return false
  }
}

function playAdminOrderSound() {
  if (!adminOrderSoundEnabled) return
  const ctx = getAdminOrderAudioContext()
  if (!ctx) return
  try {
    if (ctx.state === 'suspended') ctx.resume()
    const now = ctx.currentTime
    const master = ctx.createGain()
    master.gain.setValueAtTime(0.0001, now)
    master.gain.exponentialRampToValueAtTime(0.16, now + 0.025)
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.72)
    master.connect(ctx.destination)

    ;[880, 1174].forEach((freq, index) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const start = now + index * 0.18
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, start)
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(1, start + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.24)
      osc.connect(gain)
      gain.connect(master)
      osc.start(start)
      osc.stop(start + 0.28)
    })
  } catch (_) {}
}

function formatAdminOrderNotifyBody(order) {
  const name = String(order?.customer_name || 'Khách mới').trim()
  const phone = String(order?.customer_phone || '').trim()
  const total = formatAdminVnd(Number(order?.total_price || 0))
  return name + (phone ? ' - ' + phone : '') + ' - ' + total
}

function showAdminNewOrderNotification(order) {
  if (!order) return
  const code = String(order.order_code || ('#' + order.id))
  const body = formatAdminOrderNotifyBody(order)
  showAdminToast('Có đơn hàng mới ' + code + ': ' + body, 'success')
  playAdminOrderSound()
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      const notice = new Notification('Boypho có đơn mới ' + code, {
        body,
        icon: '/qh-logo.png',
        badge: '/qh-logo.png',
        tag: 'new-order-' + order.id,
        renotify: true,
      })
      notice.onclick = function() {
        window.focus()
        showPage('orders')
        notice.close()
      }
    } catch (_) {}
  }
  if (document.body.dataset.adminPage === 'orders' && typeof loadOrders === 'function') {
    loadOrders()
  }
  if (document.body.dataset.adminPage === 'dashboard' && typeof loadDashboard === 'function') {
    loadDashboard()
  }
}

async function pollAdminLatestOrder(silent) {
  try {
    const res = await axios.get('/api/admin/orders/latest', { headers: { 'Cache-Control': 'no-cache' } })
    const order = res.data?.data?.latestOrder
    if (!order) return
    const id = Number(order.id || 0)
    if (!Number.isFinite(id) || id <= 0) return
    if (!adminOrderNotifyInitialized) {
      adminOrderNotifyInitialized = true
      const saved = readAdminOrderLastSeenId()
      adminOrderNotifyLastSeenId = saved || id
      writeAdminOrderLastSeenId(adminOrderNotifyLastSeenId)
      return
    }
    if (id > adminOrderNotifyLastSeenId) {
      writeAdminOrderLastSeenId(id)
      if (!silent) showAdminNewOrderNotification(order)
    }
  } catch (_) {}
}

function startAdminOrderNotificationPolling() {
  if (adminOrderNotifyTimer) clearInterval(adminOrderNotifyTimer)
  pollAdminLatestOrder(true)
  adminOrderNotifyTimer = setInterval(function() {
    pollAdminLatestOrder(false)
  }, 10000)
}

async function enableAdminOrderNotifications() {
  adminOrderSoundEnabled = true
  writeAdminOrderNotifySetting(ADMIN_ORDER_SOUND_ENABLED_KEY, true)
  const soundReady = await unlockAdminOrderSound()
  if ('Notification' in window && Notification.permission === 'default') {
    try {
      await Notification.requestPermission()
    } catch (_) {}
  }
  adminOrderNotifyEnabled = true
  writeAdminOrderNotifySetting(ADMIN_ORDER_NOTIFY_ENABLED_KEY, true)
  startAdminOrderNotificationPolling()
  let pushResult = { ok: false, reason: 'skipped' }
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      pushResult = await registerAdminPushSubscription()
      adminOrderPushEnabled = !!pushResult.ok
    } catch (_) {
      adminOrderPushEnabled = false
      pushResult = { ok: false, reason: 'subscribe_failed' }
    }
  }
  syncAdminOrderNotifyButton()
  if (soundReady) playAdminOrderSound()
  if ('Notification' in window && Notification.permission === 'denied') {
    showAdminToast('Trình duyệt đang chặn thông báo. Vào cài đặt site để bật lại.', 'warning')
    return
  }
  if (pushResult.ok) {
    showAdminToast('Đã bật Web Push đơn mới cho dashboard/PWA', 'success')
    return
  }
  if (pushResult.reason === 'missing_vapid') {
    showAdminToast('Đã bật âm báo, nhưng chưa cấu hình VAPID để nhận khi PWA đóng.', 'warning')
    return
  }
  if (pushResult.reason === 'unsupported') {
    showAdminToast('Thiết bị này chưa hỗ trợ Web Push, âm báo trong dashboard vẫn hoạt động.', 'warning')
    return
  }
  showAdminToast('Đã bật thông báo đơn mới khi dashboard đang mở', 'success')
}

function initAdminOrderNotifications() {
  adminOrderNotifyEnabled = readAdminOrderNotifySetting(ADMIN_ORDER_NOTIFY_ENABLED_KEY, false)
  adminOrderSoundEnabled = readAdminOrderNotifySetting(ADMIN_ORDER_SOUND_ENABLED_KEY, false)
  adminOrderNotifyLastSeenId = readAdminOrderLastSeenId()
  syncAdminOrderNotifyButton()
  startAdminOrderNotificationPolling()
  if (adminOrderNotifyEnabled && 'Notification' in window && Notification.permission === 'granted') {
    registerAdminPushSubscription().then((result) => {
      adminOrderPushEnabled = !!result.ok
      syncAdminOrderNotifyButton()
    }).catch(() => {
      adminOrderPushEnabled = false
      syncAdminOrderNotifyButton()
    })
  }
  document.addEventListener('visibilitychange', function() {
    if (!document.hidden) pollAdminLatestOrder(false)
  })
}

async function loadAdminProfile() {
  try {
    const res = await axios.get('/api/admin/profile')
    adminProfile = res.data?.data || null
    await loadAdminUiSettings({ silent: true })
    applyAdminAvatarUI()
    ensureSettingsImagesNavItem()
    syncAdminPermissionUI()
  } catch (_) {
    // keep default avatar fallback
  }
}

function positionAdminAvatarMenu() {
  const menu = document.getElementById('adminAvatarDropdown')
  const trigger = document.getElementById('adminAvatarMenuTrigger')
  if (!menu || !trigger) return
  const rect = trigger.getBoundingClientRect()
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0
  const mobile = viewportWidth < 640
  menu.style.position = 'fixed'
  menu.style.top = Math.round(rect.bottom + 8) + 'px'
  if (mobile) {
    menu.style.left = '8px'
    menu.style.right = '8px'
    menu.style.width = 'auto'
  } else {
    menu.style.left = 'auto'
    menu.style.right = Math.max(8, Math.round(viewportWidth - rect.right)) + 'px'
    menu.style.width = '320px'
  }
}

function setAdminAvatarMenuOpen(open) {
  adminAvatarMenuOpen = !!open
  const menu = document.getElementById('adminAvatarDropdown')
  if (!menu) return
  if (adminAvatarMenuOpen) {
    positionAdminAvatarMenu()
    menu.classList.remove('hidden')
    menu.style.display = 'block'
    menu.style.pointerEvents = 'auto'
    requestAnimationFrame(positionAdminAvatarMenu)
    return
  }
  menu.classList.add('hidden')
  menu.style.display = 'none'
  menu.style.pointerEvents = 'none'
}

function closeAdminAvatarMenu() {
  setAdminAvatarMenuOpen(false)
}

function toggleAdminAvatarMenu(evt) {
  if (evt) {
    evt.preventDefault()
    evt.stopPropagation()
  }
  setAdminAvatarMenuOpen(!adminAvatarMenuOpen)
}

function hasOpenAdminModal() {
  return ADMIN_OVERLAY_IDS.some((id) => {
    const el = document.getElementById(id)
    if (!el) return false
    if (el.style.display && el.style.display !== 'none') return true
    if (!el.classList.contains('hidden')) return true
    return false
  })
}

function isAdminOverlayElementVisible(el) {
  if (!el) return false
  const style = window.getComputedStyle(el)
  return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0'
}

function adminOverlayHasVisibleContent(el) {
  if (!el) return false
  return Array.from(el.children || []).some((child) => {
    if (!(child instanceof HTMLElement)) return false
    const style = window.getComputedStyle(child)
    return style.display !== 'none' && style.visibility !== 'hidden'
  })
}

function getActiveAdminModalOverlays() {
  return ADMIN_OVERLAY_IDS
    .map((id) => document.getElementById(id))
    .filter((el) => String(el?.dataset?.adminOverlayOpen || '') === '1')
    .filter((el) => isAdminOverlayElementVisible(el) && adminOverlayHasVisibleContent(el))
}

function isMobileSidebarOpen() {
  const sidebar = document.getElementById('sidebar')
  if (!sidebar) return false
  const isDesktop = window.matchMedia && window.matchMedia('(min-width: 768px)').matches
  return !isDesktop && !sidebar.classList.contains('-translate-x-full')
}

function normalizeAdminOverlayState(options = {}) {
  const preserveActiveModal = options.preserveActiveModal !== false
  const reason = String(options.reason || '')
  const closeFloatingMenus = options.closeFloatingMenus === true || reason === 'sanitize'
  const activeModals = preserveActiveModal ? getActiveAdminModalOverlays() : []
  const activeSet = new Set(activeModals)

  ADMIN_OVERLAY_IDS.forEach((id) => {
    const el = document.getElementById(id)
    if (!el || activeSet.has(el)) return
    forceHideAdminOverlay(el)
  })

  const passwordModal = document.getElementById('adminChangePasswordModal')
  if (!activeSet.has(passwordModal)) closeChangeAdminPasswordModal()
  if (closeFloatingMenus && !activeModals.length) closeAdminAvatarMenu()

  const sidebarOverlay = document.getElementById('sidebarOverlay')
  if (sidebarOverlay) {
    const sidebar = document.getElementById('sidebar')
    const isDesktop = window.matchMedia && window.matchMedia('(min-width: 768px)').matches
    const sidebarOpen = sidebar && !sidebar.classList.contains('-translate-x-full')
    if (isDesktop || !sidebarOpen) {
      sidebarOverlay.style.display = 'none'
      sidebarOverlay.style.pointerEvents = 'none'
      sidebarOverlay.classList.add('hidden')
    }
  }

  syncSidebarOverlay()
  if (activeModals.length || isMobileSidebarOpen()) lockAdminPageScroll()
  else unlockAdminPageScroll()
  document.body.style.pointerEvents = ''
  debugAdminOverlayState(reason || 'normalize')
}

function sanitizeAdminOverlayState() {
  normalizeAdminOverlayState({ preserveActiveModal: false, reason: 'sanitize' })
}

function scheduleAdminOverlaySanitize() {
  sanitizeAdminOverlayState()
  requestAnimationFrame(() => {
    sanitizeAdminOverlayState()
    setTimeout(sanitizeAdminOverlayState, 0)
  })
}

function queueAdminOverlaySafetySync() {
  if (adminOverlaySafetyScheduled) return
  adminOverlaySafetyScheduled = true
  requestAnimationFrame(() => {
    adminOverlaySafetyScheduled = false
    normalizeAdminOverlayState({ preserveActiveModal: true, reason: 'queued-sync' })
  })
}

function bindAdminOverlaySafetyObserver() {
  if (document.body?.dataset.adminOverlayObserverBound === '1') return
  document.body.dataset.adminOverlayObserverBound = '1'
  const overlayNodes = ADMIN_OVERLAY_IDS
    .map((id) => document.getElementById(id))
    .concat(document.getElementById('sidebarOverlay'))
    .filter(Boolean)
  const observer = new MutationObserver(() => queueAdminOverlaySafetySync())
  overlayNodes.forEach((node) => observer.observe(node, { attributes: true, attributeFilter: ['class', 'style'] }))
}

function openChangeAdminPasswordModal() {
  const modal = document.getElementById('adminChangePasswordModal')
  showAdminOverlay(modal)
  const oldInput = document.getElementById('adminOldPassword')
  if (oldInput) setTimeout(() => oldInput.focus(), 0)
}

function closeChangeAdminPasswordModal() {
  const modal = document.getElementById('adminChangePasswordModal')
  forceHideAdminOverlay(modal)
  const formIds = ['adminOldPassword', 'adminNewPassword', 'adminConfirmPassword']
  formIds.forEach((id) => {
    const el = document.getElementById(id)
    if (el) el.value = ''
  })
}

async function submitAdminPasswordChange(e) {
  e.preventDefault()
  const oldPassword = String(document.getElementById('adminOldPassword')?.value || '')
  const newPassword = String(document.getElementById('adminNewPassword')?.value || '')
  const confirmPassword = String(document.getElementById('adminConfirmPassword')?.value || '')
  if (newPassword.length < 6) {
    showAdminToast('Mật khẩu mới tối thiểu 6 ký tự', 'error')
    return
  }
  if (newPassword !== confirmPassword) {
    showAdminToast('Nhập lại mật khẩu chưa khớp', 'error')
    return
  }
  const btn = document.getElementById('adminChangePasswordBtn')
  btn.disabled = true
  btn.textContent = 'Đang cập nhật...'
  try {
    await axios.put('/api/admin/profile/password', {
      old_password: oldPassword,
      new_password: newPassword
    })
    showAdminToast('Đã đổi mật khẩu thành công', 'success')
    closeChangeAdminPasswordModal()
  } catch (err) {
    const msg = err.response?.data?.error || 'Đổi mật khẩu thất bại'
    showAdminToast(msg, 'error')
  } finally {
    btn.disabled = false
    btn.textContent = 'Cập nhật mật khẩu'
  }
}

async function logoutAdminUser() {
  try { await axios.post('/api/auth/logout') } catch (_) {}
  sanitizeAdminOverlayState()
  window.location.replace('/admin/login')
}

function readImageAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('FILE_READ_FAILED'))
    reader.readAsDataURL(file)
  })
}

function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('IMAGE_LOAD_FAILED'))
    img.src = src
  })
}

async function compressAvatarDataUrl(dataUrl, maxSide = 512, quality = 0.85) {
  const img = await loadImageElement(dataUrl)
  const scale = Math.min(1, maxSide / Math.max(img.width || 1, img.height || 1))
  const w = Math.max(1, Math.round((img.width || 1) * scale))
  const h = Math.max(1, Math.round((img.height || 1) * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return dataUrl
  ctx.drawImage(img, 0, 0, w, h)
  return canvas.toDataURL('image/jpeg', quality)
}

function triggerAdminAvatarPicker(evt) {
  if (evt) evt.stopPropagation()
  const input = document.getElementById('adminAvatarInput')
  if (input) input.click()
}

async function onAdminAvatarSelected(inputOrEvent) {
  const input = inputOrEvent?.target || inputOrEvent
  const file = input?.files?.[0]
  if (!file) return
  await handleAdminAvatarFile(file)
  input.value = ''
}

async function handleAdminAvatarFile(file) {
  const mimeType = String(file.type || '').toLowerCase()
  if (!mimeType.startsWith('image/')) {
    showAdminToast('Vui lòng chọn file ảnh', 'error')
    return
  }
  try {
    const rawDataUrl = await readImageAsDataURL(file)
    let dataUrl = await compressAvatarDataUrl(rawDataUrl, 512, 0.85)
    if (dataUrl.length > 700000) dataUrl = await compressAvatarDataUrl(rawDataUrl, 448, 0.8)
    if (dataUrl.length > 700000) dataUrl = await compressAvatarDataUrl(rawDataUrl, 384, 0.75)
    if (dataUrl.length > 700000) dataUrl = await compressAvatarDataUrl(rawDataUrl, 320, 0.7)
    if (!dataUrl.startsWith('data:image/')) {
      showAdminToast('File ảnh không hợp lệ', 'error')
      return
    }
    if (dataUrl.length > 700000) {
      showAdminToast('Ảnh quá lớn, vui lòng chọn ảnh nhỏ hơn', 'error')
      return
    }
    const prevAvatar = String(adminProfile?.avatar || '').trim()
    adminProfile = { ...(adminProfile || {}), avatar: dataUrl }
    applyAdminAvatarUI()
    try {
      const res = await axios.put('/api/admin/profile/avatar', { avatar: dataUrl })
      adminProfile = res.data?.data || adminProfile
      applyAdminAvatarUI()
      applyAvatarSrcDirect(String(adminProfile?.avatar || dataUrl))
      loadAdminProfile()
      showAdminToast('Đã cập nhật avatar', 'success')
    } catch (e) {
      adminProfile = { ...(adminProfile || {}), avatar: prevAvatar }
      applyAdminAvatarUI()
      const msg = e.response?.data?.error || 'Lưu avatar thất bại'
      showAdminToast(msg, 'error')
    }
  } catch (_) {
    showAdminToast('Không đọc được ảnh, vui lòng thử lại', 'error')
  }
}

function isOrdersPageActive() {
  return document.body.dataset.adminPage === 'orders'
}

function syncOrdersHeaderSearchUI() {
  const wrap = document.getElementById('ordersHeaderSearch')
  const input = document.getElementById('orderSearch')
  const icon = document.getElementById('ordersHeaderSearchIcon')
  const isOrders = isOrdersPageActive()
  const hasValue = !!(input && String(input.value || '').trim())

  if (!wrap || !input || !icon) return

  wrap.classList.toggle('hidden', !isOrders)
  wrap.classList.toggle('is-visible', isOrders)

  if (!isOrders) {
    ordersSearchExpanded = false
    wrap.classList.remove('expanded')
    icon.className = 'fas fa-search text-sm'
    return
  }

  const shouldExpand = ordersSearchExpanded || hasValue
  wrap.classList.toggle('expanded', shouldExpand)
  icon.className = (hasValue ? 'fas fa-times' : 'fas fa-search') + ' text-sm'
}

function focusOrdersSearchInput() {
  const input = document.getElementById('orderSearch')
  if (!input) return
  setTimeout(() => input.focus(), 20)
}

function handleOrdersSearchButton() {
  const input = document.getElementById('orderSearch')
  if (!input || !isOrdersPageActive()) return

  if (String(input.value || '').trim()) {
    input.value = ''
    ordersSearchExpanded = false
    setOrdersPage(1)
    filterOrders()
    syncOrdersHeaderSearchUI()
    return
  }

  if (window.innerWidth >= 768) {
    ordersSearchExpanded = true
    syncOrdersHeaderSearchUI()
    focusOrdersSearchInput()
    return
  }

  ordersSearchExpanded = !ordersSearchExpanded
  syncOrdersHeaderSearchUI()
  if (ordersSearchExpanded) focusOrdersSearchInput()
}

function onOrderSearchInput() {
  const input = document.getElementById('orderSearch')
  if (!input) return
  ordersSearchExpanded = !!String(input.value || '').trim() || ordersSearchExpanded
  setOrdersPage(1)
  filterOrders()
  syncOrdersHeaderSearchUI()
}

function closeOrdersHeaderSearch() {
  const input = document.getElementById('orderSearch')
  if (!input) return
  if (window.innerWidth >= 768) {
    if (!String(input.value || '').trim()) ordersSearchExpanded = false
    syncOrdersHeaderSearchUI()
    return
  }
  if (String(input.value || '').trim()) {
    syncOrdersHeaderSearchUI()
    return
  }
  ordersSearchExpanded = false
  syncOrdersHeaderSearchUI()
}

function getLocalDateInputValue(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return year + '-' + month + '-' + day
}

function getLocalMonthInputValue(date = new Date()) {
  return getLocalDateInputValue(date).slice(0, 7)
}

function ensureDashboardDateFilter() {
  if (document.getElementById('dashboardDateFilter')) return
  const avatarRoot = document.getElementById('adminAvatarMenuRoot')
  if (!avatarRoot || !avatarRoot.parentElement) return

  const filter = document.createElement('div')
  filter.id = 'dashboardDateFilter'
  filter.className = 'dashboard-date-filter hidden items-center gap-2 rounded-full border border-gray-200 bg-white px-2 py-1 shadow-sm'
  filter.innerHTML =
    '<div class="dashboard-date-mode-shell">' +
      '<select id="dashboardFilterMode" onchange="onDashboardFilterModeChange()" class="dashboard-date-mode-select h-9 rounded-full border-0 bg-gray-50 px-3 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-100">' +
        '<option value="month">Theo tháng</option>' +
        '<option value="day">Theo ngày</option>' +
        '<option value="all">Tất cả</option>' +
      '</select>' +
      '<i class="fas fa-chevron-down dashboard-date-mode-chevron"></i>' +
    '</div>' +
    '<div id="dashboardMonthShell" class="dashboard-date-value-shell">' +
      '<input type="hidden" id="dashboardMonthInput">' +
      '<button type="button" id="dashboardMonthTrigger" onclick="toggleDashboardDatePicker(\\'month\\')" class="dashboard-date-trigger">' +
        '<span id="dashboardMonthDisplay" class="dashboard-date-display"></span>' +
        '<i class="far fa-calendar dashboard-date-calendar-icon"></i>' +
      '</button>' +
    '</div>' +
    '<div id="dashboardDateShell" class="dashboard-date-value-shell hidden">' +
      '<input type="hidden" id="dashboardDateInput">' +
      '<button type="button" id="dashboardDateTrigger" onclick="toggleDashboardDatePicker(\\'day\\')" class="dashboard-date-trigger">' +
        '<span id="dashboardDateDisplay" class="dashboard-date-display"></span>' +
        '<i class="far fa-calendar dashboard-date-calendar-icon"></i>' +
      '</button>' +
    '</div>' +
    '<div id="dashboardDatePicker" class="dashboard-date-picker hidden"></div>'
  avatarRoot.parentElement.insertBefore(filter, avatarRoot)
}

function formatDashboardDateFilterDisplay(value, mode) {
  const parts = String(value || '').split('-')
  if (mode === 'month' && parts.length >= 2) return parts[1] + '/' + parts[0]
  if (mode === 'day' && parts.length >= 3) return parts[2] + '/' + parts[1] + '/' + parts[0]
  return String(value || '')
}

function parseDashboardMonthValue(value) {
  const match = String(value || '').match(/^(\\d{4})-(\\d{2})$/)
  const now = new Date()
  if (!match) return { year: now.getFullYear(), month: now.getMonth() + 1 }
  return { year: Number(match[1]), month: Number(match[2]) }
}

function parseDashboardDateValue(value) {
  const match = String(value || '').match(/^(\\d{4})-(\\d{2})-(\\d{2})$/)
  const now = new Date()
  if (!match) return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() }
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) }
}

function getDashboardDatePicker() {
  return document.getElementById('dashboardDatePicker')
}

function closeDashboardDatePicker() {
  const picker = getDashboardDatePicker()
  if (picker) {
    picker.classList.add('hidden')
    picker.innerHTML = ''
  }
  dashboardDatePickerOpen = ''
  dashboardDatePickerView = null
  dashboardDatePickerYearListOpen = false
}

function toggleDashboardDatePicker(kind) {
  if (dashboardDatePickerOpen === kind) {
    closeDashboardDatePicker()
    return
  }
  openDashboardDatePicker(kind)
}

function openDashboardDatePicker(kind) {
  const picker = getDashboardDatePicker()
  if (!picker) return
  dashboardDatePickerOpen = kind
  dashboardDatePickerYearListOpen = false
  if (kind === 'day') {
    const selected = parseDashboardDateValue(document.getElementById('dashboardDateInput')?.value || getLocalDateInputValue())
    dashboardDatePickerView = { year: selected.year, month: selected.month }
    renderDashboardDayPicker()
  } else {
    const selected = parseDashboardMonthValue(document.getElementById('dashboardMonthInput')?.value || getLocalMonthInputValue())
    dashboardDatePickerView = { year: selected.year, month: selected.month }
    renderDashboardMonthPicker()
  }
  picker.classList.remove('hidden')
}

function shiftDashboardMonthPickerYear(delta) {
  const base = dashboardDatePickerView || parseDashboardMonthValue(document.getElementById('dashboardMonthInput')?.value || getLocalMonthInputValue())
  dashboardDatePickerView = { year: base.year + delta, month: base.month }
  dashboardDatePickerYearListOpen = false
  renderDashboardMonthPicker()
}

function shiftDashboardDayPickerMonth(delta) {
  const base = dashboardDatePickerView || parseDashboardDateValue(document.getElementById('dashboardDateInput')?.value || getLocalDateInputValue())
  const date = new Date(base.year, base.month - 1 + delta, 1)
  dashboardDatePickerView = { year: date.getFullYear(), month: date.getMonth() + 1 }
  renderDashboardDayPicker()
}

function toggleDashboardMonthYearList() {
  dashboardDatePickerYearListOpen = !dashboardDatePickerYearListOpen
  renderDashboardMonthPicker()
}

function selectDashboardMonthPickerYear(year) {
  const base = dashboardDatePickerView || parseDashboardMonthValue(document.getElementById('dashboardMonthInput')?.value || getLocalMonthInputValue())
  dashboardDatePickerView = { year: Number(year), month: base.month }
  dashboardDatePickerYearListOpen = false
  renderDashboardMonthPicker()
}

function renderDashboardMonthPicker() {
  const picker = getDashboardDatePicker()
  if (!picker) return
  const selected = parseDashboardMonthValue(document.getElementById('dashboardMonthInput')?.value || getLocalMonthInputValue())
  const view = dashboardDatePickerView || selected
  if (dashboardDatePickerYearListOpen) {
    const startYear = view.year - 5
    const yearButtons = Array.from({ length: 12 }, (_, index) => {
      const year = startYear + index
      const active = year === view.year
      return '<button type="button" onclick="selectDashboardMonthPickerYear(' + year + ')" class="dashboard-date-picker-cell dashboard-date-picker-year-cell' + (active ? ' is-active' : '') + '">' + year + '</button>'
    }).join('')
    picker.innerHTML =
      '<div class="dashboard-date-picker-header">' +
        '<button type="button" onclick="shiftDashboardMonthPickerYear(-12)" class="dashboard-date-picker-nav" aria-label="12 năm trước"><i class="fas fa-chevron-left"></i></button>' +
        '<strong>Chọn năm</strong>' +
        '<button type="button" onclick="shiftDashboardMonthPickerYear(12)" class="dashboard-date-picker-nav" aria-label="12 năm sau"><i class="fas fa-chevron-right"></i></button>' +
      '</div>' +
      '<div class="dashboard-date-picker-year-grid">' + yearButtons + '</div>'
    return
  }
  const monthButtons = Array.from({ length: 12 }, (_, index) => {
    const month = index + 1
    const value = view.year + '-' + String(month).padStart(2, '0')
    const active = selected.year === view.year && selected.month === month
    return '<button type="button" onclick="selectDashboardMonth(\\'' + value + '\\')" class="dashboard-date-picker-cell' + (active ? ' is-active' : '') + '">T' + month + '</button>'
  }).join('')
  picker.innerHTML =
    '<div class="dashboard-date-picker-header">' +
      '<button type="button" onclick="shiftDashboardMonthPickerYear(-1)" class="dashboard-date-picker-nav" aria-label="Năm trước"><i class="fas fa-chevron-left"></i></button>' +
      '<button type="button" onclick="toggleDashboardMonthYearList()" class="dashboard-date-picker-year-button">' + escapeDashboardHtml(view.year) + '</button>' +
      '<button type="button" onclick="shiftDashboardMonthPickerYear(1)" class="dashboard-date-picker-nav" aria-label="Năm sau"><i class="fas fa-chevron-right"></i></button>' +
    '</div>' +
    '<div class="dashboard-date-picker-month-grid">' + monthButtons + '</div>'
}

function renderDashboardDayPicker() {
  const picker = getDashboardDatePicker()
  if (!picker) return
  const selected = parseDashboardDateValue(document.getElementById('dashboardDateInput')?.value || getLocalDateInputValue())
  const view = dashboardDatePickerView || selected
  const first = new Date(view.year, view.month - 1, 1)
  const daysInMonth = new Date(view.year, view.month, 0).getDate()
  const leading = (first.getDay() + 6) % 7
  const cells = []
  for (let i = 0; i < leading; i += 1) cells.push('<span class="dashboard-date-picker-empty"></span>')
  for (let day = 1; day <= daysInMonth; day += 1) {
    const value = view.year + '-' + String(view.month).padStart(2, '0') + '-' + String(day).padStart(2, '0')
    const active = selected.year === view.year && selected.month === view.month && selected.day === day
    cells.push('<button type="button" onclick="selectDashboardDate(\\'' + value + '\\')" class="dashboard-date-picker-cell' + (active ? ' is-active' : '') + '">' + day + '</button>')
  }
  picker.innerHTML =
    '<div class="dashboard-date-picker-header">' +
      '<button type="button" onclick="shiftDashboardDayPickerMonth(-1)" class="dashboard-date-picker-nav" aria-label="Tháng trước"><i class="fas fa-chevron-left"></i></button>' +
      '<strong>Tháng ' + String(view.month).padStart(2, '0') + '/' + escapeDashboardHtml(view.year) + '</strong>' +
      '<button type="button" onclick="shiftDashboardDayPickerMonth(1)" class="dashboard-date-picker-nav" aria-label="Tháng sau"><i class="fas fa-chevron-right"></i></button>' +
    '</div>' +
    '<div class="dashboard-date-picker-weekdays"><span>T2</span><span>T3</span><span>T4</span><span>T5</span><span>T6</span><span>T7</span><span>CN</span></div>' +
    '<div class="dashboard-date-picker-day-grid">' + cells.join('') + '</div>'
}

function selectDashboardMonth(value) {
  const input = document.getElementById('dashboardMonthInput')
  if (input) input.value = value
  closeDashboardDatePicker()
  onDashboardFilterValueChange()
}

function selectDashboardDate(value) {
  const input = document.getElementById('dashboardDateInput')
  if (input) input.value = value
  closeDashboardDatePicker()
  onDashboardFilterValueChange()
}

function initDashboardDateFilterDefaults() {
  ensureDashboardDateFilter()
  if (dashboardFilterInitialized) return
  dashboardFilterInitialized = true
  const mode = document.getElementById('dashboardFilterMode')
  const dateInput = document.getElementById('dashboardDateInput')
  const monthInput = document.getElementById('dashboardMonthInput')
  if (mode) mode.value = dashboardFilterMode
  if (dateInput && !dateInput.value) dateInput.value = getLocalDateInputValue()
  if (monthInput && !monthInput.value) monthInput.value = getLocalMonthInputValue()
}

function syncDashboardDateFilterUI() {
  initDashboardDateFilterDefaults()
  const filter = document.getElementById('dashboardDateFilter')
  const mode = document.getElementById('dashboardFilterMode')
  const dateInput = document.getElementById('dashboardDateInput')
  const monthInput = document.getElementById('dashboardMonthInput')
  const dateShell = document.getElementById('dashboardDateShell')
  const monthShell = document.getElementById('dashboardMonthShell')
  const dateDisplay = document.getElementById('dashboardDateDisplay')
  const monthDisplay = document.getElementById('dashboardMonthDisplay')
  const avatarRoot = document.getElementById('adminAvatarMenuRoot')
  const header = document.querySelector('#adminMainContent > header')
  const headerActions = header?.lastElementChild instanceof HTMLElement ? header.lastElementChild : null
  const dashboardRoot = document.getElementById('page-dashboard')
  const statGrid = dashboardRoot?.querySelector('.dashboard-stat-grid')
  if (!filter || !mode || !dateInput || !monthInput) return

  const isDashboard = document.body.dataset.adminPage === 'dashboard'
  const isMobileDashboard = isDashboard && window.innerWidth < 768
  filter.classList.toggle('hidden', !isDashboard)
  filter.classList.toggle('flex', isDashboard)

  dashboardFilterMode = String(mode.value || 'month')
  dateInput.classList.toggle('hidden', dashboardFilterMode !== 'day')
  monthInput.classList.toggle('hidden', dashboardFilterMode !== 'month')
  dateShell?.classList.toggle('hidden', dashboardFilterMode !== 'day')
  monthShell?.classList.toggle('hidden', dashboardFilterMode !== 'month')
  if (dateDisplay) dateDisplay.textContent = formatDashboardDateFilterDisplay(dateInput.value || getLocalDateInputValue(), 'day')
  if (monthDisplay) monthDisplay.textContent = formatDashboardDateFilterDisplay(monthInput.value || getLocalMonthInputValue(), 'month')
  filter.classList.toggle('dashboard-date-filter-mobile', isMobileDashboard)

  if (isDashboard && isMobileDashboard) {
    if (dashboardRoot && statGrid && filter.parentElement !== dashboardRoot) {
      dashboardRoot.insertBefore(filter, statGrid)
    } else if (dashboardRoot && !statGrid && filter.parentElement !== dashboardRoot) {
      dashboardRoot.appendChild(filter)
    }
  } else if (isDashboard) {
    if (headerActions && avatarRoot instanceof HTMLElement && filter.parentElement !== headerActions) {
      headerActions.insertBefore(filter, avatarRoot)
    }
    filter.style.width = ''
    filter.style.maxWidth = ''
    filter.style.margin = ''
    filter.style.padding = ''
    filter.style.justifyContent = ''
    filter.style.alignSelf = ''
    filter.style.flexWrap = ''
    filter.style.gap = ''
  }
}

function onDashboardFilterModeChange() {
  syncDashboardDateFilterUI()
  closeDashboardDatePicker()
  if (document.body.dataset.adminPage === 'dashboard') loadDashboard()
}

function onDashboardFilterValueChange() {
  syncDashboardDateFilterUI()
  if (document.body.dataset.adminPage === 'dashboard') loadDashboard()
}

function getDashboardStatsParams() {
  initDashboardDateFilterDefaults()
  const mode = String(document.getElementById('dashboardFilterMode')?.value || dashboardFilterMode || 'month')
  const params = { mode }
  if (mode === 'day') params.date = String(document.getElementById('dashboardDateInput')?.value || getLocalDateInputValue())
  if (mode === 'month') params.month = String(document.getElementById('dashboardMonthInput')?.value || getLocalMonthInputValue())
  return params
}

function showPage(pageName) {
  pageName = String(pageName || 'dashboard')
  ensureSettingsImagesNavItem()
  syncAdminPermissionUI()
  if (!canAdminViewPage(pageName)) {
    pageName = getFirstAllowedAdminPage()
  }
  const adminPages = ['dashboard','products','product-types','orders','returns','customers','marketplaces','live-chat','reviews','backup','members','vouchers','featured','settings','settings-social','settings-payment','settings-text-ui','settings-images','settings-notifications','settings-admin-ui','settings-warehouse','flashsale']
  adminPages.forEach(p => {
    const section = document.getElementById('page-'+p)
    if (section) section.classList.toggle('hidden', p !== pageName)
  })
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'))
  const mainBtn = document.querySelector('.nav-item[data-page="' + pageName + '"]')
  if (mainBtn) mainBtn.classList.add('active')
  document.querySelectorAll('.nav-sub-item').forEach(b => {
    b.classList.toggle('active', b.dataset.subPage === settingsActiveSubPage || b.dataset.subPage === marketingActiveSubPage)
  })
  if (pageName === 'settings' || pageName === 'settings-social' || pageName === 'settings-payment' || pageName === 'settings-text-ui' || pageName === 'settings-images' || pageName === 'settings-notifications' || pageName === 'settings-admin-ui' || pageName === 'settings-warehouse') {
    const settingsBtn = document.getElementById('settingsMenuBtn')
    if (settingsBtn) settingsBtn.classList.add('active')
    setSettingsSubmenuOpen(true)
    if (pageName === 'settings-social') settingsActiveSubPage = 'settings-social'
    if (pageName === 'settings-payment') settingsActiveSubPage = 'settings-payment'
    if (pageName === 'settings-text-ui') settingsActiveSubPage = 'settings-text-ui'
    if (pageName === 'settings-images') settingsActiveSubPage = 'settings-images'
    if (pageName === 'settings-notifications') settingsActiveSubPage = 'settings-notifications'
    if (pageName === 'settings-admin-ui') settingsActiveSubPage = 'settings-admin-ui'
    if (pageName === 'settings-warehouse') settingsActiveSubPage = 'settings-warehouse'
  } else {
    setSettingsSubmenuOpen(false)
    if (pageName !== 'settings-social' && pageName !== 'settings-payment' && pageName !== 'settings-text-ui' && pageName !== 'settings-images' && pageName !== 'settings-notifications' && pageName !== 'settings-admin-ui' && pageName !== 'settings-warehouse') settingsActiveSubPage = ''
  }
  if (pageName === 'products' || pageName === 'product-types') {
    const productBtn = document.getElementById('productMenuBtn')
    if (productBtn) productBtn.classList.add('active')
    setProductSubmenuOpen(true)
    productActiveSubPage = pageName
  } else {
    setProductSubmenuOpen(false)
    if (pageName !== 'products' && pageName !== 'product-types') productActiveSubPage = ''
  }
  if (pageName === 'flashsale') {
    const marketingBtn = document.getElementById('marketingMenuBtn')
    if (marketingBtn) marketingBtn.classList.add('active')
    setMarketingSubmenuOpen(true)
    marketingActiveSubPage = 'flashsale'
  } else {
    setMarketingSubmenuOpen(false)
    if (pageName !== 'flashsale') marketingActiveSubPage = ''
  }
  document.querySelectorAll('.nav-sub-item').forEach(b => b.classList.remove('active'))
  if (settingsActiveSubPage) {
    document.querySelectorAll('.nav-sub-item[data-sub-page="' + settingsActiveSubPage + '"]').forEach(b => b.classList.add('active'))
  }
  if (productActiveSubPage) {
    document.querySelectorAll('.nav-sub-item[data-sub-page="' + productActiveSubPage + '"]').forEach(b => b.classList.add('active'))
  }
  if (marketingActiveSubPage) {
    document.querySelectorAll('.nav-sub-item[data-sub-page="' + marketingActiveSubPage + '"]').forEach(b => b.classList.add('active'))
  }
  const titles = {dashboard:'Dashboard', products:'Quản lý Sản phẩm', 'product-types':'Loại sản phẩm', orders:'Quản lý Đơn hàng', returns:'Quản lý hoàn trả', customers:'Quản lý Khách hàng', marketplaces:'Sàn TMĐT', 'live-chat':'Live chat', reviews:'Quản lý Đánh giá', backup:'Dữ liệu', members:'Thành viên', vouchers:'Khuyến mãi', featured:'Sản phẩm Nổi Bật', settings:'Setting', 'settings-social':'Cấu hình MXH', 'settings-payment':'Thanh toán', 'settings-text-ui':'Text UI', 'settings-images':'Cài đặt ảnh', 'settings-notifications':'Cài đặt thông báo', 'settings-admin-ui':'Trang quản trị', 'settings-warehouse':'Cài đặt kho hàng', flashsale:'Quản lý Flashsale'}
  document.body.dataset.adminPage = pageName
  document.getElementById('pageTitle').textContent = titles[pageName] || pageName

  if (pageName === 'dashboard') loadDashboard()
  else if (pageName === 'products') loadAdminProducts()
  else if (pageName === 'product-types') loadAdminProductTypes()
  else if (pageName === 'orders') loadAdminOrders()
  else if (pageName === 'returns') loadReturns()
  else if (pageName === 'customers') loadCustomers()
  else if (pageName === 'marketplaces') loadMarketplaceOrders()
  else if (pageName === 'live-chat') loadLiveChatAdminInbox()
  else if (pageName === 'reviews') loadAdminReviews()
  else if (pageName === 'backup') loadAdminBackupPage()
  else if (pageName === 'members') loadAdminMembers()
  else if (pageName === 'vouchers') loadVouchers()
  else if (pageName === 'featured') loadFeaturedAdmin()
  else if (pageName === 'settings') loadSettingsAdmin()
  else if (pageName === 'settings-social') loadSocialSettings()
  else if (pageName === 'settings-payment') loadPaymentSettings()
  else if (pageName === 'settings-text-ui') loadTextUiSettings()
  else if (pageName === 'settings-images') loadImageSettings()
  else if (pageName === 'settings-notifications') loadNotificationSettings()
  else if (pageName === 'settings-admin-ui') loadAdminUiSettingsPage()
  else if (pageName === 'settings-warehouse') loadSettingsWarehousePage()
  else if (pageName === 'flashsale') loadFlashSaleAdmin()

  syncOrdersHeaderSearchUI()
  syncDashboardDateFilterUI()

  if (pageName !== 'orders') {
    const bulkBar = document.getElementById('ordersBulkActionBar')
    const shipBar = document.getElementById('shippingBulkActionBar')
    if (bulkBar) bulkBar.classList.add('hidden')
    if (shipBar) shipBar.classList.add('hidden')
  }

  // Close mobile sidebar
  closeMobileSidebar()
}

function syncMobileSidebarToggle(open) {
  document.body.dataset.mobileSidebarState = open ? 'open' : 'closed'
  const toggle = document.getElementById('menuToggle')
  const icon = document.getElementById('menuToggleIcon')
  if (toggle) {
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false')
    toggle.setAttribute('aria-label', open ? 'Đóng menu quản trị' : 'Mở menu quản trị')
    toggle.title = open ? 'Đóng menu' : 'Mở menu'
  }
  if (icon) {
    icon.className = open ? 'fas fa-xmark text-gray-700' : 'admin-sidebar-panel-icon'
  }
}

function closeMobileSidebar() {
  const sidebar = document.getElementById('sidebar')
  const overlay = document.getElementById('sidebarOverlay')
  if (!sidebar || !overlay) {
    syncMobileSidebarToggle(false)
    if (!getActiveAdminModalOverlays().length) unlockAdminPageScroll()
    return
  }
  sidebar.classList.add('-translate-x-full')
  overlay.style.display = 'none'
  overlay.classList.add('hidden')
  overlay.style.pointerEvents = 'none'
  syncMobileSidebarToggle(false)
  if (!getActiveAdminModalOverlays().length) unlockAdminPageScroll()
}

function openMobileSidebar() {
  const sidebar = document.getElementById('sidebar')
  const overlay = document.getElementById('sidebarOverlay')
  if (!sidebar || !overlay) {
    syncMobileSidebarToggle(false)
    return
  }
  sidebar.classList.remove('-translate-x-full')
  overlay.style.display = 'block'
  overlay.classList.remove('hidden')
  overlay.style.pointerEvents = ''
  syncMobileSidebarToggle(true)
  lockAdminPageScroll()
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar')
  if (!sidebar) return
  const isOpen = !sidebar.classList.contains('-translate-x-full')
  if (isOpen) closeMobileSidebar()
  else openMobileSidebar()
}

function isAdminSidebarOpen() {
  const sidebar = document.getElementById('sidebar')
  return !!sidebar && !sidebar.classList.contains('-translate-x-full')
}

function isAdminSidebarGestureTargetAllowed(target) {
  if (!(target instanceof Element)) return true
  if (target.closest('input, textarea, select, button, a, [contenteditable="true"]')) return false
  if (target.closest('.modal-overlay, .modal-card, #adminAvatarDropdown')) return false
  return true
}

function bindAdminSidebarSwipeGestures() {
  if (window.__adminSidebarSwipeBound) return
  window.__adminSidebarSwipeBound = true

  document.addEventListener('touchstart', function(e) {
    if (window.innerWidth >= 768 || !e.touches || e.touches.length !== 1) return
    if (!isAdminSidebarGestureTargetAllowed(e.target)) return
    const touch = e.touches[0]
    const sidebarOpen = isAdminSidebarOpen()
    if (!sidebarOpen && touch.clientX > 32) return
    adminSidebarGestureStart = {
      x: touch.clientX,
      y: touch.clientY,
      sidebarOpen,
      startedAt: Date.now(),
      tracking: true,
    }
  }, { passive: true })

  document.addEventListener('touchmove', function(e) {
    if (!adminSidebarGestureStart?.tracking || !e.touches || e.touches.length !== 1) return
    const touch = e.touches[0]
    const dx = touch.clientX - adminSidebarGestureStart.x
    const dy = touch.clientY - adminSidebarGestureStart.y
    if (Math.abs(dy) > 36 && Math.abs(dy) > Math.abs(dx)) {
      adminSidebarGestureStart = null
      return
    }
    if (Math.abs(dx) > 14 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      e.preventDefault()
    }
  }, { passive: false })

  document.addEventListener('touchend', function(e) {
    if (!adminSidebarGestureStart?.tracking) return
    const touch = e.changedTouches && e.changedTouches[0]
    if (!touch) {
      adminSidebarGestureStart = null
      return
    }
    const dx = touch.clientX - adminSidebarGestureStart.x
    const dy = touch.clientY - adminSidebarGestureStart.y
    const elapsed = Date.now() - adminSidebarGestureStart.startedAt
    const horizontal = Math.abs(dx) >= 64 && Math.abs(dx) > Math.abs(dy) * 1.35
    const fastHorizontal = elapsed < 420 && Math.abs(dx) >= 46 && Math.abs(dx) > Math.abs(dy) * 1.2
    const shouldAct = horizontal || fastHorizontal
    const startedOpen = adminSidebarGestureStart.sidebarOpen
    adminSidebarGestureStart = null
    if (!shouldAct) return
    if (!startedOpen && dx > 0) openMobileSidebar()
    if (startedOpen && dx < 0) closeMobileSidebar()
  }, { passive: true })

  document.addEventListener('touchcancel', function() {
    adminSidebarGestureStart = null
  }, { passive: true })
}

function syncSidebarOverlay() {
  const sidebar = document.getElementById('sidebar')
  const overlay = document.getElementById('sidebarOverlay')
  if (!sidebar || !overlay) return
  const isDesktop = window.matchMedia && window.matchMedia('(min-width: 768px)').matches
  const sidebarOpen = !sidebar.classList.contains('-translate-x-full')
  if (isDesktop) {
    syncMobileSidebarToggle(false)
    overlay.style.display = 'none'
    overlay.classList.add('hidden')
    overlay.style.pointerEvents = 'none'
    if (!getActiveAdminModalOverlays().length) unlockAdminPageScroll()
    return
  }
  syncMobileSidebarToggle(sidebarOpen)
  if (sidebarOpen) {
    overlay.style.display = 'block'
    overlay.classList.remove('hidden')
    overlay.style.pointerEvents = ''
    lockAdminPageScroll()
  } else {
    overlay.style.display = 'none'
    overlay.classList.add('hidden')
    overlay.style.pointerEvents = 'none'
    if (!getActiveAdminModalOverlays().length) unlockAdminPageScroll()
  }
}

function resetAdminTransientSurface(reason = 'navigation-reset') {
  closeMobileSidebar()
  closeAdminAvatarMenu()
  scheduleAdminOverlaySanitize()
  debugAdminOverlayState(reason)
}

function shouldHardResetAdminSurfaceOnPageShow(event) {
  const navEntry = performance.getEntriesByType && performance.getEntriesByType('navigation')[0]
  const navType = String(navEntry?.type || '')
  return !!event?.persisted || navType === 'navigate' || navType === 'reload' || navType === 'back_forward'
}

function handleAdminPageShow(event) {
  if (shouldHardResetAdminSurfaceOnPageShow(event)) {
    resetAdminTransientSurface('pageshow-reset')
    return
  }
  normalizeAdminOverlayState({ preserveActiveModal: true, reason: 'pageshow' })
}

function setDesktopSidebarCollapsed(collapsed) {
  desktopSidebarCollapsed = !!collapsed
  if (!desktopSidebarCollapsed) hideCollapsedSidebarTooltip()
  const motion = desktopSidebarCollapsed ? 'collapsing' : 'expanding'
  document.body.dataset.sidebarToggleMotion = motion
  window.clearTimeout(window.__adminSidebarToggleMotionTimer)
  window.__adminSidebarToggleMotionTimer = window.setTimeout(() => {
    if (document.body.dataset.sidebarToggleMotion === motion) delete document.body.dataset.sidebarToggleMotion
  }, 360)
  document.body.dataset.sidebarState = desktopSidebarCollapsed ? 'collapsed' : 'expanded'
  const sidebar = document.getElementById('sidebar')
  if (sidebar) sidebar.dataset.sidebarState = document.body.dataset.sidebarState
  const toggle = document.getElementById('sidebarDesktopToggle')
  if (toggle) {
    toggle.setAttribute('aria-expanded', desktopSidebarCollapsed ? 'false' : 'true')
    toggle.setAttribute('aria-label', desktopSidebarCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar')
    toggle.title = desktopSidebarCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'
  }
}

function toggleDesktopSidebar() {
  const isDesktop = window.matchMedia && window.matchMedia('(min-width: 768px)').matches
  if (!isDesktop) return
  hideCollapsedSidebarTooltip()
  setDesktopSidebarCollapsed(!desktopSidebarCollapsed)
  if (desktopSidebarCollapsed) document.getElementById('sidebarDesktopToggle')?.blur()
}

function getCollapsedSidebarTooltip() {
  let tooltip = document.getElementById('collapsedSidebarTooltip')
  if (tooltip) return tooltip
  tooltip = document.createElement('div')
  tooltip.id = 'collapsedSidebarTooltip'
  tooltip.className = 'collapsed-sidebar-tooltip'
  tooltip.setAttribute('role', 'tooltip')
  document.body.appendChild(tooltip)
  return tooltip
}

function getCollapsedSidebarTooltipLabel(target) {
  if (!target) return ''
  if (target.id === 'sidebarDesktopToggle') return 'Mở rộng sidebar'
  const label = target.querySelector('.sidebar-label, .sidebar-sub-label')
  return String(label?.textContent || target.getAttribute('aria-label') || target.title || '').trim()
}

function hideCollapsedSidebarTooltip() {
  const tooltip = document.getElementById('collapsedSidebarTooltip')
  if (!tooltip) return
  tooltip.classList.remove('is-visible')
  tooltip.textContent = ''
}

function showCollapsedSidebarTooltip(target) {
  const isDesktop = window.matchMedia && window.matchMedia('(min-width: 768px)').matches
  if (!isDesktop || document.body.dataset.sidebarState !== 'collapsed') {
    hideCollapsedSidebarTooltip()
    return
  }
  const label = getCollapsedSidebarTooltipLabel(target)
  if (!label) {
    hideCollapsedSidebarTooltip()
    return
  }
  const tooltip = getCollapsedSidebarTooltip()
  const rect = target.getBoundingClientRect()
  tooltip.textContent = label
  tooltip.style.left = Math.round(rect.right + 12) + 'px'
  tooltip.style.top = Math.round(rect.top + rect.height / 2) + 'px'
  tooltip.classList.add('is-visible')
}

function bindCollapsedSidebarTooltips() {
  if (window.__adminCollapsedSidebarTooltipsBound) return
  window.__adminCollapsedSidebarTooltipsBound = true
  const getTarget = (node) => node?.closest?.('#sidebar .nav-item, #sidebar > .border-t a, #sidebar .sidebar-toggle-desktop')
  document.addEventListener('mouseover', function(event) {
    const target = getTarget(event.target)
    if (!target) return
    showCollapsedSidebarTooltip(target)
  })
  document.addEventListener('mouseout', function(event) {
    const target = getTarget(event.target)
    if (!target) return
    if (target.contains(event.relatedTarget)) return
    hideCollapsedSidebarTooltip()
  })
  document.addEventListener('focusin', function(event) {
    const target = getTarget(event.target)
    if (target) showCollapsedSidebarTooltip(target)
  })
  document.addEventListener('focusout', function(event) {
    const target = getTarget(event.target)
    if (target) hideCollapsedSidebarTooltip()
  })
  document.addEventListener('scroll', hideCollapsedSidebarTooltip, true)
}

function setProductSubmenuOpen(open) {
  productSubmenuOpen = !!open
  const submenu = document.getElementById('productSubmenu')
  const chevron = document.getElementById('productMenuChevron')
  if (submenu) submenu.classList.toggle('hidden', !productSubmenuOpen)
  if (chevron) chevron.classList.toggle('rotate-180', productSubmenuOpen)
}

function toggleProductMenu() {
  setProductSubmenuOpen(!productSubmenuOpen)
}

function openProductsAdmin() {
  productActiveSubPage = 'products'
  settingsActiveSubPage = ''
  marketingActiveSubPage = ''
  setProductSubmenuOpen(true)
  setSettingsSubmenuOpen(false)
  setMarketingSubmenuOpen(false)
  showPage('products')
}

function openProductTypesAdmin() {
  productActiveSubPage = 'product-types'
  settingsActiveSubPage = ''
  marketingActiveSubPage = ''
  setProductSubmenuOpen(true)
  setSettingsSubmenuOpen(false)
  setMarketingSubmenuOpen(false)
  showPage('product-types')
}

function setSettingsSubmenuOpen(open) {
  settingsSubmenuOpen = !!open
  const submenu = document.getElementById('settingsSubmenu')
  const chevron = document.getElementById('settingsMenuChevron')
  if (submenu) submenu.classList.toggle('hidden', !settingsSubmenuOpen)
  if (chevron) chevron.classList.toggle('rotate-180', settingsSubmenuOpen)
}

function toggleSettingsMenu() {
  ensureSettingsImagesNavItem()
  setSettingsSubmenuOpen(!settingsSubmenuOpen)
}

function ensureSettingsImagesNavItem() {
  const submenu = document.getElementById('settingsSubmenu')
  if (!submenu) return
  if (!submenu.querySelector('[data-sub-page="settings-text-ui"]')) {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'nav-sub-item w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-gray-400 text-sm font-medium'
    btn.dataset.subPage = 'settings-text-ui'
    btn.onclick = openSettingsTextUi
    btn.innerHTML = '<i class="fas fa-language w-4"></i><span class="sidebar-sub-label">Text UI</span>'
    const warehouseBtn = submenu.querySelector('[data-sub-page="settings-warehouse"]')
    submenu.insertBefore(btn, warehouseBtn || null)
  }
  if (!submenu.querySelector('[data-sub-page="settings-images"]')) {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'nav-sub-item w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-gray-400 text-sm font-medium'
    btn.dataset.subPage = 'settings-images'
    btn.onclick = openSettingsImages
    btn.innerHTML = '<i class="fas fa-image w-4"></i><span class="sidebar-sub-label">Hình ảnh</span>'
    const warehouseBtn = submenu.querySelector('[data-sub-page="settings-warehouse"]')
    submenu.insertBefore(btn, warehouseBtn || null)
  }
  if (!submenu.querySelector('[data-sub-page="settings-payment"]')) {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'nav-sub-item w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-gray-400 text-sm font-medium'
    btn.dataset.subPage = 'settings-payment'
    btn.onclick = openSettingsPayment
    btn.innerHTML = '<i class="fas fa-credit-card w-4"></i><span class="sidebar-sub-label">Thanh toán</span>'
    const warehouseBtn = submenu.querySelector('[data-sub-page="settings-warehouse"]')
    submenu.insertBefore(btn, warehouseBtn || null)
  }
  if (!submenu.querySelector('[data-sub-page="settings-admin-ui"]')) {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'nav-sub-item w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-gray-400 text-sm font-medium'
    btn.dataset.subPage = 'settings-admin-ui'
    btn.onclick = openSettingsAdminUi
    btn.innerHTML = '<i class="fas fa-id-card-clip w-4"></i><span class="sidebar-sub-label">Trang quản trị</span>'
    const warehouseBtn = submenu.querySelector('[data-sub-page="settings-warehouse"]')
    submenu.insertBefore(btn, warehouseBtn || null)
  }
  if (submenu.querySelector('[data-sub-page="settings-notifications"]')) return
  const btn = document.createElement('button')
  btn.type = 'button'
  btn.className = 'nav-sub-item w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-gray-400 text-sm font-medium'
  btn.dataset.subPage = 'settings-notifications'
  btn.onclick = openSettingsNotifications
  btn.innerHTML = '<i class="fas fa-bullhorn w-4"></i><span class="sidebar-sub-label">Thông báo</span>'
  const warehouseBtn = submenu.querySelector('[data-sub-page="settings-warehouse"]')
  submenu.insertBefore(btn, warehouseBtn || null)
}

function openSettingsTextUi() {
  settingsActiveSubPage = 'settings-text-ui'
  marketingActiveSubPage = ''
  setSettingsSubmenuOpen(true)
  setMarketingSubmenuOpen(false)
  showPage('settings-text-ui')
}

function openSettingsPayment() {
  settingsActiveSubPage = 'settings-payment'
  marketingActiveSubPage = ''
  setSettingsSubmenuOpen(true)
  setMarketingSubmenuOpen(false)
  showPage('settings-payment')
}

function openSettingsNotifications() {
  settingsActiveSubPage = 'settings-notifications'
  marketingActiveSubPage = ''
  setSettingsSubmenuOpen(true)
  setMarketingSubmenuOpen(false)
  showPage('settings-notifications')
}

function openSettingsAdminUi() {
  settingsActiveSubPage = 'settings-admin-ui'
  marketingActiveSubPage = ''
  setSettingsSubmenuOpen(true)
  setMarketingSubmenuOpen(false)
  showPage('settings-admin-ui')
}

function openSettingsImages() {
  settingsActiveSubPage = 'settings-images'
  marketingActiveSubPage = ''
  setSettingsSubmenuOpen(true)
  setMarketingSubmenuOpen(false)
  showPage('settings-images')
}

function openSettingsWarehouse() {
  settingsActiveSubPage = 'settings-warehouse'
  marketingActiveSubPage = ''
  setSettingsSubmenuOpen(true)
  setMarketingSubmenuOpen(false)
  showPage('settings-warehouse')
}

function openSettingsSocial() {
  settingsActiveSubPage = 'settings-social'
  marketingActiveSubPage = ''
  setSettingsSubmenuOpen(true)
  setMarketingSubmenuOpen(false)
  showPage('settings-social')
}

function escapeAdminText(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch] || ch))
}

function setMarketplaceButtonLoading(btn, loading, text) {
  if (!btn) return
  if (loading) {
    btn.dataset.originalHtml = btn.innerHTML
    btn.disabled = true
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>' + escapeAdminText(text || 'Đang xử lý...')
    return
  }
  btn.disabled = false
  if (btn.dataset.originalHtml) btn.innerHTML = btn.dataset.originalHtml
}

function getMarketplaceStatusMeta(bucket, statusText) {
  if (bucket === 'cancelled') return { label: statusText || 'Đã huỷ', cls: 'bg-red-50 text-red-600 border-red-100' }
  if (bucket === 'returns') return { label: statusText || 'Hoàn trả', cls: 'bg-amber-50 text-amber-700 border-amber-100' }
  return { label: statusText || 'Đang xử lý', cls: 'bg-emerald-50 text-emerald-700 border-emerald-100' }
}

function formatMarketplaceDate(value) {
  const text = String(value || '').trim()
  if (!text) return '--'
  if (/^[0-9]{10,13}$/.test(text)) {
    const numeric = Number(text)
    const dateFromNumber = new Date(numeric < 1000000000000 ? numeric * 1000 : numeric)
    if (!Number.isNaN(dateFromNumber.getTime())) {
      return dateFromNumber.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    }
  }
  const normalized = text.includes('T') ? text : text.replace(' ', 'T')
  const date = new Date(normalized)
  if (!Number.isNaN(date.getTime())) {
    return date.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }
  return text
}

function applyMarketplaceConfig(config) {
  const appIdInput = document.getElementById('marketplaceNhanhAppId')
  const businessInput = document.getElementById('marketplaceNhanhBusinessId')
  const secretInput = document.getElementById('marketplaceNhanhSecretKey')
  const tokenInput = document.getElementById('marketplaceNhanhAccessToken')
  const status = document.getElementById('marketplaceConfigStatus')
  const oauthLink = document.getElementById('marketplaceOauthLink')
  if (appIdInput && config?.appId) appIdInput.value = config.appId
  if (businessInput && config?.businessId) businessInput.value = config.businessId
  if (secretInput) secretInput.placeholder = config?.hasSecretKey ? 'Đã lưu: ' + (config.secretKeyMasked || '********') : 'Dán secret nếu cần đổi'
  if (tokenInput) tokenInput.placeholder = config?.hasAccessToken ? 'Đã lưu: ' + (config.accessTokenMasked || '********') : 'Tự fill sau cấp quyền'
  const ready = !!(config?.appId && config?.businessId && config?.hasAccessToken)
  if (status) {
    status.textContent = ready
      ? 'Đã có App ID, Business ID và token. Có thể tải đơn từ Nhanh.'
      : 'Chưa đủ cấu hình Nhanh. Lưu App ID/Secret rồi bấm Cấp quyền để lấy token.'
    status.className = 'mt-1 text-sm ' + (ready ? 'text-emerald-600' : 'text-amber-600')
  }
  if (oauthLink) {
    oauthLink.href = config?.oauthUrl || '#'
    oauthLink.classList.toggle('pointer-events-none', !config?.oauthUrl)
    oauthLink.classList.toggle('opacity-50', !config?.oauthUrl)
  }
}

async function loadMarketplaceConfig(force = false) {
  if (marketplaceConfigLoaded && !force) return
  try {
    const res = await axios.get('/api/admin/marketplaces/config')
    marketplaceConfigLoaded = true
    applyMarketplaceConfig(res.data?.data || {})
  } catch (e) {
    const status = document.getElementById('marketplaceConfigStatus')
    if (status) {
      status.textContent = 'Không tải được cấu hình Nhanh'
      status.className = 'mt-1 text-sm text-red-500'
    }
  }
}

async function saveMarketplaceConfig() {
  const btn = document.getElementById('marketplaceConfigSaveBtn')
  setMarketplaceButtonLoading(btn, true, 'Đang lưu...')
  try {
    const payload = {
      appId: document.getElementById('marketplaceNhanhAppId')?.value || '',
      businessId: document.getElementById('marketplaceNhanhBusinessId')?.value || '',
      secretKey: document.getElementById('marketplaceNhanhSecretKey')?.value || undefined,
      accessToken: document.getElementById('marketplaceNhanhAccessToken')?.value || undefined,
    }
    const res = await axios.put('/api/admin/marketplaces/config', payload)
    document.getElementById('marketplaceNhanhSecretKey').value = ''
    document.getElementById('marketplaceNhanhAccessToken').value = ''
    applyMarketplaceConfig(res.data?.data || {})
    marketplaceConfigLoaded = true
    showAdminToast('Đã lưu cấu hình Nhanh')
  } catch (e) {
    showAdminToast(e?.response?.data?.error || 'Lỗi lưu cấu hình Nhanh', 'error')
  } finally {
    setMarketplaceButtonLoading(btn, false)
  }
}

async function exchangeMarketplaceAccessCode() {
  const btn = document.getElementById('marketplaceExchangeBtn')
  const input = document.getElementById('marketplaceNhanhAccessCode')
  const accessCode = String(input?.value || '').trim()
  if (!accessCode) {
    showAdminToast('Dán accessCode từ Nhanh trước nhé', 'warning')
    return
  }
  setMarketplaceButtonLoading(btn, true, 'Đang lấy token...')
  try {
    const res = await axios.post('/api/admin/marketplaces/nhanh/exchange-token', { accessCode })
    if (input) input.value = ''
    applyMarketplaceConfig(res.data?.data || {})
    marketplaceConfigLoaded = true
    showAdminToast('Đã kết nối token Nhanh')
    await loadMarketplaceOrders()
  } catch (e) {
    showAdminToast(e?.response?.data?.error || 'Lỗi đổi token Nhanh', 'error')
  } finally {
    setMarketplaceButtonLoading(btn, false)
  }
}

function setMarketplaceChannel(channel) {
  marketplaceFilters.channel = channel || 'all'
  document.querySelectorAll('[data-marketplace-channel]').forEach((btn) => btn.classList.toggle('is-active', btn.dataset.marketplaceChannel === marketplaceFilters.channel))
  loadMarketplaceOrders()
}

function setMarketplaceStatus(status) {
  marketplaceFilters.status = status || 'all'
  document.querySelectorAll('[data-marketplace-status]').forEach((btn) => btn.classList.toggle('is-active', btn.dataset.marketplaceStatus === marketplaceFilters.status))
  const select = document.getElementById('marketplaceStatusFilter')
  if (select && select.value !== marketplaceFilters.status) select.value = marketplaceFilters.status
  loadMarketplaceOrders()
}

function ensureMarketplaceDateFilter() {
  if (!marketplaceFilters.date) marketplaceFilters.date = getLocalDateInputValue()
  const input = document.getElementById('marketplaceDateFilter')
  if (input && input.value !== marketplaceFilters.date) input.value = marketplaceFilters.date
}

function setMarketplaceDate(date) {
  marketplaceFilters.date = String(date || '').trim() || getLocalDateInputValue()
  ensureMarketplaceDateFilter()
  loadMarketplaceOrders()
}

function shiftMarketplaceDate(days) {
  ensureMarketplaceDateFilter()
  const base = new Date((marketplaceFilters.date || getLocalDateInputValue()) + 'T00:00:00')
  if (Number.isNaN(base.getTime())) return setMarketplaceDate(getLocalDateInputValue())
  base.setDate(base.getDate() + Number(days || 0))
  setMarketplaceDate(getLocalDateInputValue(base))
}

function updateMarketplaceStats(stats = {}) {
  const setText = (id, value) => {
    const el = document.getElementById(id)
    if (el) el.textContent = Number(value || 0).toLocaleString('vi-VN')
  }
  setText('marketplaceStatTotal', stats.total)
  setText('marketplaceStatTiktok', stats.tiktok)
  setText('marketplaceStatShopee', stats.shopee)
  setText('marketplaceStatReturns', stats.returns)
  setText('marketplaceStatCancelled', stats.cancelled)
}

function setMarketplaceLoadingState(message) {
  const table = document.getElementById('marketplaceOrdersTableBody')
  const mobile = document.getElementById('marketplaceOrdersMobileList')
  const empty = document.getElementById('marketplaceOrdersEmpty')
  if (empty) empty.classList.add('hidden')
  if (table) table.innerHTML = '<tr><td colspan="7" class="px-4 py-16 text-center text-gray-400"><i class="fas fa-spinner fa-spin text-2xl mb-2"></i><p>' + escapeAdminText(message || 'Đang tải dữ liệu sàn...') + '</p></td></tr>'
  if (mobile) mobile.innerHTML = '<div class="p-6 text-center text-gray-400"><i class="fas fa-spinner fa-spin text-2xl mb-2"></i><p>' + escapeAdminText(message || 'Đang tải...') + '</p></div>'
}

function renderMarketplaceOrders() {
  const table = document.getElementById('marketplaceOrdersTableBody')
  const mobile = document.getElementById('marketplaceOrdersMobileList')
  const empty = document.getElementById('marketplaceOrdersEmpty')
  if (empty) empty.classList.toggle('hidden', marketplaceOrders.length > 0)
  if (!marketplaceOrders.length) {
    if (table) table.innerHTML = ''
    if (mobile) mobile.innerHTML = ''
    return
  }
  if (table) {
    table.innerHTML = marketplaceOrders.map((order) => {
      const status = getMarketplaceStatusMeta(order.bucket, order.statusText)
      return '<tr class="border-b last:border-0 hover:bg-pink-50/40">' +
        '<td class="px-4 py-3"><span class="marketplace-platform-badge ' + escapeAdminText(order.platform) + '">' + escapeAdminText(order.platformLabel) + '</span></td>' +
        '<td class="px-4 py-3"><p class="font-mono font-bold text-gray-900">' + escapeAdminText(order.code || order.id || '--') + '</p></td>' +
        '<td class="px-4 py-3"><p class="font-bold text-gray-900">' + escapeAdminText(order.customerName || 'Khách sàn') + '</p><p class="text-xs text-gray-400">' + escapeAdminText(order.customerMobile || '') + '</p></td>' +
        '<td class="px-4 py-3 max-w-[24rem]"><p class="truncate font-semibold text-gray-700">' + escapeAdminText(order.productsText || '--') + '</p></td>' +
        '<td class="px-4 py-3 text-right font-extrabold text-gray-900">' + escapeAdminText(formatAdminVnd(order.money || order.codMoney)) + '</td>' +
        '<td class="px-4 py-3 text-center"><span class="inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ' + status.cls + '">' + escapeAdminText(status.label) + '</span></td>' +
        '<td class="px-4 py-3 text-center text-xs text-gray-500">' + escapeAdminText(formatMarketplaceDate(order.createdAt)) + '</td>' +
      '</tr>'
    }).join('')
  }
  if (mobile) {
    mobile.innerHTML = marketplaceOrders.map((order) => {
      const status = getMarketplaceStatusMeta(order.bucket, order.statusText)
      return '<article class="p-4">' +
        '<div class="flex items-start justify-between gap-3">' +
          '<div class="min-w-0"><p class="font-mono text-sm font-extrabold text-gray-900">' + escapeAdminText(order.code || order.id || '--') + '</p><p class="mt-1 text-xs text-gray-400">' + escapeAdminText(formatMarketplaceDate(order.createdAt)) + '</p></div>' +
          '<span class="marketplace-platform-badge ' + escapeAdminText(order.platform) + '">' + escapeAdminText(order.platformLabel) + '</span>' +
        '</div>' +
        '<p class="mt-3 font-bold text-gray-900">' + escapeAdminText(order.customerName || 'Khách sàn') + '</p>' +
        '<p class="text-xs text-gray-400">' + escapeAdminText(order.customerMobile || '') + '</p>' +
        '<p class="mt-3 text-sm font-semibold text-gray-700">' + escapeAdminText(order.productsText || '--') + '</p>' +
        '<div class="mt-3 flex items-center justify-between gap-3"><span class="font-extrabold text-pink-600">' + escapeAdminText(formatAdminVnd(order.money || order.codMoney)) + '</span><span class="inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ' + status.cls + '">' + escapeAdminText(status.label) + '</span></div>' +
      '</article>'
    }).join('')
  }
}

async function loadMarketplaceOrders() {
  await loadMarketplaceConfig()
  ensureMarketplaceDateFilter()
  setMarketplaceLoadingState('Đang tải đơn từ Nhanh ngày ' + marketplaceFilters.date + '...')
  try {
    const res = await axios.get('/api/admin/marketplaces/orders', {
      params: {
        channel: marketplaceFilters.channel,
        status: marketplaceFilters.status,
        date: marketplaceFilters.date,
        pageSize: 100,
      }
    })
    const data = res.data?.data || {}
    marketplaceOrders = data.orders || []
    updateMarketplaceStats(data.stats || {})
    renderMarketplaceOrders()
  } catch (e) {
    updateMarketplaceStats({})
    const message = e?.response?.data?.error || 'Không tải được đơn từ Nhanh'
    const table = document.getElementById('marketplaceOrdersTableBody')
    const mobile = document.getElementById('marketplaceOrdersMobileList')
    const empty = document.getElementById('marketplaceOrdersEmpty')
    if (empty) empty.classList.add('hidden')
    if (table) table.innerHTML = '<tr><td colspan="7" class="px-4 py-16 text-center text-red-500"><i class="fas fa-triangle-exclamation text-2xl mb-2"></i><p>' + escapeAdminText(message) + '</p></td></tr>'
    if (mobile) mobile.innerHTML = '<div class="p-6 text-center text-red-500"><i class="fas fa-triangle-exclamation text-2xl mb-2"></i><p>' + escapeAdminText(message) + '</p></div>'
  }
}

async function loadAdminPermissionItems() {
  if (adminPermissionItems.length) return adminPermissionItems
  const res = await axios.get('/api/admin/members/permission-items')
  adminPermissionItems = res.data?.data || []
  return adminPermissionItems
}

async function loadAdminMembers() {
  const table = document.getElementById('adminMembersTable')
  const mobile = document.getElementById('adminMembersMobileList')
  const empty = document.getElementById('adminMembersEmpty')
  if (table) table.innerHTML = '<tr><td colspan="5" class="px-5 py-10 text-center text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Đang tải thành viên...</td></tr>'
  if (mobile) mobile.innerHTML = '<div class="p-5 text-center text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Đang tải...</div>'
  try {
    await loadAdminPermissionItems()
    const res = await axios.get('/api/admin/members')
    adminMembers = res.data?.data || []
    renderAdminMembers()
  } catch (e) {
    if (table) table.innerHTML = '<tr><td colspan="5" class="px-5 py-10 text-center text-red-500">Lỗi tải thành viên</td></tr>'
    if (mobile) mobile.innerHTML = '<div class="p-5 text-center text-red-500">Lỗi tải thành viên</div>'
    if (empty) empty.classList.add('hidden')
  }
}

function summarizeAdminMemberPermissions(member) {
  const permissions = member?.permissions || {}
  const visible = adminPermissionItems.filter((item) => permissions[item.key]?.view || permissions[item.key]?.edit)
  if (!visible.length) return '<span class="text-gray-400">Chưa cấp quyền</span>'
  return visible.slice(0, 3).map((item) => '<span class="inline-flex rounded-full bg-pink-50 px-2 py-1 text-[11px] font-bold text-pink-600">' + escapeAdminText(item.label) + '</span>').join('') +
    (visible.length > 3 ? '<span class="inline-flex rounded-full bg-gray-100 px-2 py-1 text-[11px] font-bold text-gray-500">+' + (visible.length - 3) + '</span>' : '')
}

function renderAdminMembers() {
  const table = document.getElementById('adminMembersTable')
  const mobile = document.getElementById('adminMembersMobileList')
  const empty = document.getElementById('adminMembersEmpty')
  const hasRows = adminMembers.length > 0
  if (empty) empty.classList.toggle('hidden', hasRows)
  if (table) {
    table.innerHTML = hasRows ? adminMembers.map((member) => {
      return '<tr class="border-b last:border-0 hover:bg-gray-50">' +
        '<td class="px-5 py-4"><div class="flex items-center gap-3"><span class="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">' + escapeAdminText(member.name || member.id).charAt(0).toUpperCase() + '</span><div><p class="font-bold text-gray-900">' + escapeAdminText(member.name || member.id) + '</p><p class="text-xs text-gray-400">Tạo: ' + escapeAdminText(String(member.created_at || '').slice(0, 10)) + '</p></div></div></td>' +
        '<td class="px-5 py-4 font-mono text-sm text-gray-700">' + escapeAdminText(member.id) + '</td>' +
        '<td class="px-5 py-4"><div class="flex flex-wrap gap-1.5">' + summarizeAdminMemberPermissions(member) + '</div></td>' +
        '<td class="px-5 py-4 text-center">' + (member.is_active ? '<span class="badge badge-done">Đang mở</span>' : '<span class="badge badge-cancelled">Đã khóa</span>') + '</td>' +
        '<td class="px-5 py-4 text-right"><div class="inline-flex items-center gap-1.5">' +
          '<button type="button" onclick="openAdminMemberAccountModal(\\'' + escapeAdminText(member.id) + '\\')" class="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100" title="Sửa tài khoản"><i class="fas fa-user-pen"></i></button>' +
          '<button type="button" onclick="openAdminMemberPasswordModal(\\'' + escapeAdminText(member.id) + '\\')" class="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-100" title="Đổi mật khẩu"><i class="fas fa-key"></i></button>' +
          '<button type="button" onclick="openAdminMemberPermissionsModal(\\'' + escapeAdminText(member.id) + '\\')" class="h-9 w-9 rounded-xl bg-pink-50 text-pink-600 hover:bg-pink-100" title="Sửa quyền"><i class="fas fa-shield-halved"></i></button>' +
        '</div></td>' +
      '</tr>'
    }).join('') : ''
  }
  if (mobile) {
    mobile.innerHTML = hasRows ? adminMembers.map((member) => (
      '<div class="p-4">' +
        '<div class="mb-3 flex items-start justify-between gap-3"><div><p class="font-bold text-gray-900">' + escapeAdminText(member.name || member.id) + '</p><p class="font-mono text-xs text-gray-500">' + escapeAdminText(member.id) + '</p></div>' +
        (member.is_active ? '<span class="badge badge-done">Mở</span>' : '<span class="badge badge-cancelled">Khóa</span>') + '</div>' +
        '<div class="mb-3 flex flex-wrap gap-1.5">' + summarizeAdminMemberPermissions(member) + '</div>' +
        '<div class="flex gap-2"><button type="button" onclick="openAdminMemberAccountModal(\\'' + escapeAdminText(member.id) + '\\')" class="flex-1 rounded-xl bg-blue-50 px-3 py-2 text-xs font-bold text-blue-600">Tài khoản</button><button type="button" onclick="openAdminMemberPasswordModal(\\'' + escapeAdminText(member.id) + '\\')" class="flex-1 rounded-xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-600">Mật khẩu</button><button type="button" onclick="openAdminMemberPermissionsModal(\\'' + escapeAdminText(member.id) + '\\')" class="flex-1 rounded-xl bg-pink-50 px-3 py-2 text-xs font-bold text-pink-600">Quyền</button></div>' +
      '</div>'
    )).join('') : ''
  }
}

function findAdminMember(id) {
  return adminMembers.find((member) => member.id === id) || null
}

function openAdminMemberAccountModal(id = '') {
  editingAdminMemberId = String(id || '')
  const member = editingAdminMemberId ? findAdminMember(editingAdminMemberId) : null
  const modal = document.getElementById('adminMemberAccountModal')
  document.getElementById('adminMemberAccountModalTitle').textContent = member ? 'Sửa thành viên' : 'Thêm thành viên'
  document.getElementById('adminMemberEditId').value = member?.id || ''
  document.getElementById('adminMemberNameInput').value = member?.name || ''
  const idInput = document.getElementById('adminMemberIdInput')
  idInput.value = member?.id || ''
  idInput.disabled = !!member
  const passwordBlock = document.getElementById('adminMemberPasswordBlock')
  const passwordInput = document.getElementById('adminMemberPasswordInput')
  passwordBlock.classList.toggle('hidden', !!member)
  passwordInput.required = !member
  passwordInput.value = ''
  document.getElementById('adminMemberActiveInput').checked = member ? member.is_active !== false : true
  document.getElementById('adminMemberAccountSubmitBtn').textContent = member ? 'Lưu tài khoản' : 'Tạo và phân quyền'
  showAdminOverlay(modal)
}

function closeAdminMemberAccountModal() {
  forceHideAdminOverlay(document.getElementById('adminMemberAccountModal'))
}

function openAdminMemberPasswordModal(id) {
  openAdminMemberAccountModal(id)
  const passwordBlock = document.getElementById('adminMemberPasswordBlock')
  const passwordInput = document.getElementById('adminMemberPasswordInput')
  passwordBlock.classList.remove('hidden')
  passwordInput.required = true
  passwordInput.value = ''
  document.getElementById('adminMemberAccountModalTitle').textContent = 'Đổi mật khẩu member'
  document.getElementById('adminMemberAccountSubmitBtn').textContent = 'Cập nhật mật khẩu'
  setTimeout(() => passwordInput.focus(), 50)
}

async function submitAdminMemberAccount(event) {
  event.preventDefault()
  const id = String(document.getElementById('adminMemberIdInput')?.value || '').trim().toLowerCase()
  const name = String(document.getElementById('adminMemberNameInput')?.value || '').trim()
  const password = String(document.getElementById('adminMemberPasswordInput')?.value || '')
  const isActive = document.getElementById('adminMemberActiveInput')?.checked !== false
  const btn = document.getElementById('adminMemberAccountSubmitBtn')
  const isEditing = !!editingAdminMemberId
  const isPasswordVisible = !document.getElementById('adminMemberPasswordBlock')?.classList.contains('hidden')
  btn.disabled = true
  const oldText = btn.textContent
  btn.textContent = 'Đang lưu...'
  try {
    if (!isEditing) {
      const res = await axios.post('/api/admin/members', { id, name, password })
      closeAdminMemberAccountModal()
      await loadAdminMembers()
      showAdminToast('Đã tạo thành viên, tiếp tục phân quyền', 'success')
      openAdminMemberPermissionsModal(res.data?.data?.id || id)
      return
    }
    if (isPasswordVisible && password) {
      await axios.put('/api/admin/members/' + encodeURIComponent(editingAdminMemberId) + '/password', { password })
      showAdminToast('Đã cập nhật mật khẩu', 'success')
    }
    await axios.put('/api/admin/members/' + encodeURIComponent(editingAdminMemberId), { name, is_active: isActive })
    closeAdminMemberAccountModal()
    await loadAdminMembers()
    showAdminToast('Đã lưu tài khoản member', 'success')
  } catch (e) {
    const code = e?.response?.data?.error || e?.message || 'Lỗi lưu member'
    showAdminToast(code, 'error')
  } finally {
    btn.disabled = false
    btn.textContent = oldText
  }
}

function emptyPermissionMap() {
  return adminPermissionItems.reduce((acc, item) => {
    acc[item.key] = { visible: false, view: false, edit: false }
    return acc
  }, {})
}

function renderAdminMemberPermissions(member) {
  const grid = document.getElementById('adminMemberPermissionsGrid')
  if (!grid) return
  const permissions = { ...emptyPermissionMap(), ...(member?.permissions || {}) }
  const groups = {}
  adminPermissionItems.forEach((item) => {
    const group = item.group || 'Khác'
    if (!groups[group]) groups[group] = []
    groups[group].push(item)
  })
  grid.innerHTML = Object.keys(groups).map((group) => {
    const rows = groups[group].map((item) => {
      const entry = permissions[item.key] || { visible: false, view: false, edit: false }
      return '<div class="grid gap-3 rounded-2xl border border-gray-200 bg-white p-3 md:grid-cols-[1fr_auto] md:items-center">' +
        '<div><p class="font-bold text-gray-900">' + escapeAdminText(item.label) + '</p><p class="text-xs text-gray-500">' + escapeAdminText(item.key) + '</p></div>' +
        '<div class="grid grid-cols-3 gap-2 text-xs font-bold text-gray-600">' +
          permissionCheckboxHtml(item.key, 'visible', 'Hiện', entry.visible) +
          permissionCheckboxHtml(item.key, 'view', 'View', entry.view) +
          permissionCheckboxHtml(item.key, 'edit', 'Edit', entry.edit) +
        '</div>' +
      '</div>'
    }).join('')
    return '<section><h3 class="mb-2 text-xs font-extrabold uppercase tracking-[0.18em] text-pink-500">' + escapeAdminText(group) + '</h3><div class="grid gap-2">' + rows + '</div></section>'
  }).join('')
}

function permissionCheckboxHtml(key, field, label, checked) {
  return '<label class="flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-2 py-2"><input type="checkbox" data-member-permission-key="' + escapeAdminText(key) + '" data-member-permission-field="' + field + '" onchange="syncMemberPermissionCheckboxes(this)" ' + (checked ? 'checked' : '') + ' class="h-4 w-4 accent-pink-500"><span>' + label + '</span></label>'
}

function syncMemberPermissionCheckboxes(input) {
  const key = input.dataset.memberPermissionKey
  const field = input.dataset.memberPermissionField
  const get = (name) => document.querySelector('[data-member-permission-key="' + key + '"][data-member-permission-field="' + name + '"]')
  const visible = get('visible')
  const view = get('view')
  const edit = get('edit')
  if (field === 'edit' && input.checked) {
    if (view) view.checked = true
    if (visible) visible.checked = true
  }
  if (field === 'view' && input.checked && visible) visible.checked = true
  if (field === 'view' && !input.checked && edit) edit.checked = false
  if (field === 'visible' && !input.checked) {
    if (view) view.checked = false
    if (edit) edit.checked = false
  }
}

async function openAdminMemberPermissionsModal(id) {
  adminMemberPermissionsTargetId = String(id || '')
  await loadAdminPermissionItems()
  const member = findAdminMember(adminMemberPermissionsTargetId)
  if (!member) {
    showAdminToast('Không tìm thấy member', 'error')
    return
  }
  document.getElementById('adminMemberPermissionsSubtitle').textContent = (member.name || member.id) + ' · ID: ' + member.id
  renderAdminMemberPermissions(member)
  showAdminOverlay(document.getElementById('adminMemberPermissionsModal'))
}

function closeAdminMemberPermissionsModal() {
  forceHideAdminOverlay(document.getElementById('adminMemberPermissionsModal'))
}

function collectAdminMemberPermissions() {
  const permissions = emptyPermissionMap()
  document.querySelectorAll('[data-member-permission-key]').forEach((input) => {
    const key = input.dataset.memberPermissionKey
    const field = input.dataset.memberPermissionField
    if (!permissions[key]) permissions[key] = { visible: false, view: false, edit: false }
    permissions[key][field] = input.checked === true
  })
  Object.keys(permissions).forEach((key) => {
    if (permissions[key].edit) {
      permissions[key].view = true
      permissions[key].visible = true
    }
    if (permissions[key].view) permissions[key].visible = true
    if (!permissions[key].visible) {
      permissions[key].view = false
      permissions[key].edit = false
    }
  })
  return permissions
}

function grantSafeOrderStaffPreset() {
  const allowed = new Set(['dashboard','orders','returns','customers','live-chat'])
  document.querySelectorAll('[data-member-permission-key]').forEach((input) => {
    const key = input.dataset.memberPermissionKey
    const field = input.dataset.memberPermissionField
    input.checked = allowed.has(key) && (field === 'visible' || field === 'view' || field === 'edit')
  })
}

async function saveAdminMemberPermissions() {
  if (!adminMemberPermissionsTargetId) return
  const btn = document.getElementById('adminMemberPermissionsSaveBtn')
  const oldText = btn.textContent
  btn.disabled = true
  btn.textContent = 'Đang lưu...'
  try {
    const permissions = collectAdminMemberPermissions()
    await axios.put('/api/admin/members/' + encodeURIComponent(adminMemberPermissionsTargetId) + '/permissions', { permissions })
    closeAdminMemberPermissionsModal()
    await loadAdminMembers()
    showAdminToast('Đã lưu phân quyền member', 'success')
  } catch (e) {
    showAdminToast(e?.response?.data?.error || 'Lưu phân quyền thất bại', 'error')
  } finally {
    btn.disabled = false
    btn.textContent = oldText
  }
}

function setMarketingSubmenuOpen(open) {
  marketingSubmenuOpen = !!open
  const submenu = document.getElementById('marketingSubmenu')
  const chevron = document.getElementById('marketingMenuChevron')
  if (submenu) submenu.classList.toggle('hidden', !marketingSubmenuOpen)
  if (chevron) chevron.classList.toggle('rotate-180', marketingSubmenuOpen)
}

function toggleMarketingMenu() {
  setMarketingSubmenuOpen(!marketingSubmenuOpen)
}

function openFlashSaleAdmin() {
  marketingActiveSubPage = 'flashsale'
  settingsActiveSubPage = ''
  setMarketingSubmenuOpen(true)
  setSettingsSubmenuOpen(false)
  showPage('flashsale')
}

function escapeDashboardHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[ch])
}

function dashboardStatusClass(status) {
  return String(status || '').replace(/[^a-z0-9_-]/gi, '') || 'pending'
}

function encodeDashboardCustomer(order) {
  return encodeURIComponent(JSON.stringify({
    name: displayCustomerName(order?.customer_name),
    phone: String(order?.customer_phone || '').trim(),
    address: String(order?.customer_address || '').trim()
  }))
}

function decodeDashboardCustomer(payload) {
  try {
    return JSON.parse(decodeURIComponent(String(payload || ''))) || {}
  } catch (_) {
    return {}
  }
}

function openDashboardCustomerModal(payload) {
  const data = decodeDashboardCustomer(payload)
  const modal = document.getElementById('dashboardCustomerModal')
  const name = document.getElementById('dashboardCustomerName')
  const phone = document.getElementById('dashboardCustomerPhone')
  const address = document.getElementById('dashboardCustomerAddress')
  if (name) name.textContent = data.name || 'Chưa có tên'
  if (phone) phone.textContent = data.phone || 'Chưa có số điện thoại'
  if (address) address.textContent = data.address || 'Chưa có địa chỉ'
  showAdminOverlay(modal)
}

function closeDashboardCustomerModal() {
  forceHideAdminOverlay(document.getElementById('dashboardCustomerModal'))
}

function getDashboardOrderImage(order) {
  if (typeof getOrderItemImage === 'function') return getOrderItemImage(order)
  const selectedColorImage = String(order?.selected_color_image || '').trim()
  if (selectedColorImage) return selectedColorImage
  const fallback = String(order?.product_thumbnail || order?.thumbnail || '').trim()
    || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=80'
  const rawImages = String(order?.product_images || '').trim()
  if (!rawImages) return fallback
  let images = []
  try { images = JSON.parse(rawImages || '[]') } catch (_) { images = [] }
  if (!Array.isArray(images) || !images.length) return fallback
  const first = images.find((img) => String(img || '').trim())
  return first ? String(first).trim() : fallback
}

function renderRecentDashboardMobileCard(order) {
  const status = dashboardStatusClass(order?.status)
  const customerName = displayCustomerName(order?.customer_name)
  const encodedCustomer = encodeDashboardCustomer(order)
  const orderCode = escapeDashboardHtml(order?.order_code || '')
  const productName = escapeDashboardHtml(order?.product_name || 'Sản phẩm')
  const quantity = Number(order?.quantity || 0)
  const img = escapeDashboardHtml(getDashboardOrderImage(order))
  return '<article class="dashboard-recent-card rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">' +
    '<div class="flex items-start justify-between gap-2">' +
      '<div class="flex items-center gap-2 min-w-0 flex-1">' +
        '<button type="button" onclick="openDashboardCustomerModal(\\'' + encodedCustomer + '\\')" class="min-w-0 truncate text-left text-sm font-semibold text-gray-900 hover:text-pink-600 transition">' + escapeDashboardHtml(customerName) + '</button>' +
        '<span class="font-mono text-[11px] text-blue-600 shrink-0">' + orderCode + '</span>' +
      '</div>' +
      '<span class="badge badge-' + status + ' shrink-0">' + escapeDashboardHtml(statusLabel(order?.status)) + '</span>' +
    '</div>' +
    '<div class="mt-3 flex items-center gap-3">' +
      '<img src="' + img + '" alt="" loading="lazy" onerror="this.src=\\'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=80\\'" class="h-14 w-14 shrink-0 rounded-xl border border-gray-100 bg-gray-100 object-cover">' +
      '<div class="min-w-0 flex-1 flex items-start gap-2">' +
        '<p class="min-w-0 flex-1 text-sm font-semibold leading-snug text-gray-800 break-words">' + productName + '</p>' +
        '<span class="ml-auto shrink-0 text-sm font-bold text-gray-900">x ' + quantity + '</span>' +
      '</div>' +
    '</div>' +
  '</article>'
}

function renderRecentDashboardOrders(recent) {
  const desktopRows = recent.map((order) => {
    const status = dashboardStatusClass(order?.status)
    return '<tr class="border-b last:border-0">' +
      '<td class="py-2 pr-4 font-mono text-xs text-blue-600">' + escapeDashboardHtml(order?.order_code || '') + '</td>' +
      '<td class="py-2 pr-4">' + escapeDashboardHtml(displayCustomerName(order?.customer_name)) + '</td>' +
      '<td class="py-2 pr-4 text-right font-semibold">' + fmtPrice(getOrderAmountDue(order)) + '</td>' +
      '<td class="py-2 text-center"><span class="badge badge-' + status + '">' + escapeDashboardHtml(statusLabel(order?.status)) + '</span></td>' +
    '</tr>'
  }).join('')
  const desktopTable = '<div class="dashboard-recent-desktop-table overflow-x-auto"><table class="w-full text-sm"><thead><tr class="border-b text-gray-500"><th class="py-2 text-left pr-4">Mã ĐH</th><th class="py-2 text-left pr-4">Khách hàng</th><th class="py-2 text-right pr-4">Còn phải thu</th><th class="py-2 text-center">Trạng thái</th></tr></thead><tbody>' + desktopRows + '</tbody></table></div>'
  const mobileList = '<div class="dashboard-recent-mobile-list">' + recent.map(renderRecentDashboardMobileCard).join('') + '</div>'
  return desktopTable + mobileList
}

function fitDashboardStatValues() {
  const values = Array.from(document.querySelectorAll('.dashboard-stat-value'))
  values.forEach((el) => {
    if (!(el instanceof HTMLElement)) return
    el.style.fontSize = ''
    el.style.whiteSpace = 'nowrap'

    const computed = window.getComputedStyle(el)
    const maxFont = Number.parseFloat(computed.fontSize || '') || 24
    const minFont = el.classList.contains('dashboard-stat-value-revenue') ? 11 : 16
    let nextFont = maxFont
    el.style.fontSize = nextFont + 'px'

    let guard = 0
    while (el.scrollWidth > el.clientWidth + 1 && nextFont > minFont && guard < 40) {
      nextFont = Math.max(minFont, nextFont - 1)
      el.style.fontSize = nextFont + 'px'
      guard += 1
    }

    if (el.scrollWidth > el.clientWidth + 1 && el.clientWidth > 0) {
      const ratio = el.clientWidth / el.scrollWidth
      nextFont = Math.max(9, Math.floor(nextFont * ratio * 0.96))
      el.style.fontSize = nextFont + 'px'
    }
  })
}

function getDashboardRangeLabel(range) {
  const mode = String(range?.mode || 'all')
  const label = String(range?.label || '').trim()
  if (mode === 'day') return 'Ngày ' + formatDashboardDateLabel(label)
  if (mode === 'month') return 'Tháng ' + formatDashboardMonthLabel(label)
  if (mode === 'custom') return label
  return 'Tất cả thời gian'
}

function formatDashboardDateLabel(value) {
  if (!value) return '-'
  const parts = String(value).split('-')
  if (parts.length !== 3) return value
  return parts[2] + '/' + parts[1] + '/' + parts[0]
}

function formatDashboardMonthLabel(value) {
  if (!value) return '-'
  const parts = String(value).split('-')
  if (parts.length !== 2) return value
  return parts[1] + '/' + parts[0]
}

function formatDashboardExportDateTime(value) {
  const raw = String(value || '').trim()
  if (!raw) return ''
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::\d{2})?)?/)
  if (match) {
    const [, year, month, day, hour = '00', minute = '00'] = match
    return day + '/' + month + '/' + year + ' ' + hour + ':' + minute
  }
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return raw
  return date.toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDashboardRatePercent(value) {
  return (Number(value || 0) * 100).toLocaleString('vi-VN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }) + '%'
}

function getDashboardTaxReportFileName(range) {
  const mode = String(range?.mode || '')
  if (mode === 'month') return 'BaoCaoThue_QHBoypho_' + String(range?.label || getLocalMonthInputValue()) + '.xlsx'
  if (mode === 'day') return 'BaoCaoThue_QHBoypho_' + String(range?.label || getLocalDateInputValue()) + '.xlsx'
  return 'BaoCaoThue_QHBoypho_AllTime.xlsx'
}

async function downloadDashboardTaxReport() {
  const button = document.getElementById('dashboardTaxReportButton')
  const originalHtml = button ? button.innerHTML : ''
  if (button) {
    button.disabled = true
    button.innerHTML = '<i class="fas fa-spinner fa-spin text-sm"></i><span class="hidden sm:inline">Đang tải...</span>'
  }
  try {
    if (!window.XLSX) throw new Error('MISSING_XLSX')
    const res = await axios.get('/api/admin/stats/tax-report', { params: getDashboardStatsParams() })
    const payload = res.data?.data || {}
    const range = payload.range || {}
    const rows = Array.isArray(payload.rows) ? payload.rows : []
    const totals = payload.totals || {}
    const taxProfile = payload.taxProfile || {}

    const summaryRows = [
      ['BÁO CÁO DOANH THU TÍNH THUẾ'],
      ['Khoảng thời gian', getDashboardRangeLabel(range)],
      ['Nhóm ngành áp dụng', String(taxProfile.category || 'Phân phối, cung cấp hàng hóa')],
      ['Tỷ lệ VAT', formatDashboardRatePercent(taxProfile.vatRate)],
      ['Tỷ lệ TNCN', formatDashboardRatePercent(taxProfile.pitRate)],
      ['Tổng tỷ lệ thuế', formatDashboardRatePercent(taxProfile.totalRate)],
      ['Số đơn giao thành công', Number(totals.deliveredOrders || 0)],
      ['Doanh thu tính thuế', Number(totals.revenue || 0)],
      ['Thuế VAT', Number(totals.vatTax || 0)],
      ['Thuế TNCN', Number(totals.pitTax || 0)],
      ['Tổng thuế phải nộp', Number(totals.totalTax || 0)],
      ['Ghi chú', 'Chỉ tính các đơn hoàn thành / khách nhận thành công, không gồm đơn hoàn, hủy, giao thất bại.'],
    ]

    const detailRows = rows.map((row) => ({
      'STT': Number(row.stt || 0),
      'Mã đơn hàng': String(row.orderCode || ''),
      'Mã vận đơn': String(row.trackingCode || ''),
      'Ngày phát sinh đơn hàng': formatDashboardExportDateTime(row.createdAt),
      'Ngày khách nhận hàng': formatDashboardExportDateTime(row.deliveredAt),
      'Giá trị đơn hàng': Number(row.orderValue || 0),
      'VAT (%)': formatDashboardRatePercent(row.vatRate),
      'Thuế VAT': Number(row.vatTax || 0),
      'TNCN (%)': formatDashboardRatePercent(row.pitRate),
      'Thuế TNCN': Number(row.pitTax || 0),
      'Tổng thuế': Number(row.totalTax || 0),
    }))

    if (!detailRows.length) {
      detailRows.push({
        'STT': '',
        'Mã đơn hàng': '',
        'Mã vận đơn': '',
        'Ngày phát sinh đơn hàng': '',
        'Ngày khách nhận hàng': '',
        'Giá trị đơn hàng': 0,
        'VAT (%)': formatDashboardRatePercent(taxProfile.vatRate),
        'Thuế VAT': 0,
        'TNCN (%)': formatDashboardRatePercent(taxProfile.pitRate),
        'Thuế TNCN': 0,
        'Tổng thuế': 0,
      })
    }

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows)
    summarySheet['!cols'] = [{ wch: 28 }, { wch: 32 }]

    const detailsSheet = XLSX.utils.json_to_sheet(detailRows)
    detailsSheet['!cols'] = [
      { wch: 6 },
      { wch: 16 },
      { wch: 18 },
      { wch: 22 },
      { wch: 22 },
      { wch: 16 },
      { wch: 10 },
      { wch: 14 },
      { wch: 10 },
      { wch: 14 },
      { wch: 14 },
    ]

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'TongHop')
    XLSX.utils.book_append_sheet(workbook, detailsSheet, 'DonGiaoThanhCong')
    XLSX.writeFile(workbook, getDashboardTaxReportFileName(range))
    showAdminToast('Đã tải báo cáo thuế theo dữ liệu đang lọc', 'success')
  } catch (error) {
    console.error(error)
    const message = error?.message === 'MISSING_XLSX'
      ? 'Thiếu thư viện Excel trên trang admin'
      : (error?.response?.data?.error || 'Tải báo cáo thuế thất bại')
    showAdminToast(message, 'error')
  } finally {
    if (button) {
      button.disabled = false
      button.innerHTML = originalHtml
    }
  }
}

function renderDashboardInsights(d) {
  const rangeLabel = document.getElementById('dashboardRangeLabel')
  const grid = document.getElementById('dashboardInsightGrid')
  if (rangeLabel) rangeLabel.textContent = getDashboardRangeLabel(d.range)
  if (!grid) return
  const deliveredRevenue = Number(d.taxBaseRevenue || d.revenue || 0)
  const vatTax = Number(d.vatTax || 0)
  const pitTax = Number(d.pitTax || 0)
  const totalTax = Number(d.totalTax || 0)
  const netRevenue = Number(d.netRevenue || 0)
  const deliveredOrders = Number(d.deliveredOrders || 0)
  const returnedOrders = Number(d.returnedOrders || 0)
  const cancelledOrFailedOrders = Number(d.cancelledOrFailedOrders || 0)
  const avgOrderValue = Number(d.avgOrderValue || 0)
  const vatRate = Number(d.taxProfile?.vatRate || 0)
  const pitRate = Number(d.taxProfile?.pitRate || 0)
  const totalRate = Number(d.taxProfile?.totalRate || (vatRate + pitRate))
  const formulaCards = [
    {
      label: 'Doanh thu đơn hoàn thành',
      value: fmtPrice(deliveredRevenue),
      icon: 'fa-chart-column',
      tones: 'border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-700',
    },
    {
      label: 'Thuế VAT (1%)',
      value: fmtPrice(vatTax),
      icon: 'fa-calculator',
      tones: 'border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-700',
    },
    {
      label: 'Thuế TNCN (0,5%)',
      value: fmtPrice(pitTax),
      icon: 'fa-arrow-right-arrow-left',
      tones: 'border-violet-100 bg-gradient-to-br from-violet-50 to-fuchsia-50 text-violet-700',
    },
    {
      label: 'Tổng thuế phải nộp',
      value: fmtPrice(totalTax),
      icon: 'fa-money-bill-transfer',
      tones: 'border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50 text-amber-700',
    },
  ]
  const operators = ['-', '+', '=']
  const metrics = [
    { label: 'Đơn nhận thành công', value: deliveredOrders.toLocaleString('vi-VN'), tone: 'border-emerald-100 bg-emerald-50 text-emerald-700' },
    { label: 'Hoàn hàng', value: returnedOrders.toLocaleString('vi-VN'), tone: 'border-rose-100 bg-rose-50 text-rose-700' },
    { label: 'Bom / trả về', value: cancelledOrFailedOrders.toLocaleString('vi-VN'), tone: 'border-amber-100 bg-amber-50 text-amber-700' },
    { label: 'Giá trị đơn TB', value: fmtPrice(avgOrderValue), tone: 'border-slate-100 bg-slate-50 text-slate-700' },
  ]
  const formulaHtml = formulaCards.map((item, index) => {
    const card =
      '<div class="dashboard-tax-formula-card min-w-0 rounded-[24px] border px-4 py-4 shadow-sm ' + item.tones + '">' +
        '<div class="dashboard-tax-formula-icon mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/70 bg-white/80 text-base shadow-sm">' +
          '<i class="fas ' + item.icon + '"></i>' +
        '</div>' +
        '<div class="dashboard-tax-formula-copy">' +
          '<p class="dashboard-tax-formula-label min-h-[2.5rem] text-sm font-semibold leading-5">' + escapeDashboardHtml(item.label) + '</p>' +
          '<p class="dashboard-tax-formula-value mt-3 text-[1.8rem] font-black leading-none tracking-[-0.04em]">' + escapeDashboardHtml(item.value) + '</p>' +
        '</div>' +
      '</div>'
    if (index >= operators.length) return card
    return card + '<div class="dashboard-tax-formula-operator flex items-center justify-center text-2xl font-black text-slate-900 md:min-w-[24px]">' + operators[index] + '</div>'
  }).join('')

  grid.innerHTML =
    '<div class="grid gap-4">' +
      '<div class="dashboard-tax-formula-grid grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)] md:gap-4">' +
        formulaHtml +
      '</div>' +
      '<div class="flex flex-col gap-3 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-slate-50 px-4 py-3 md:flex-row md:items-center md:justify-between">' +
        '<div class="inline-flex items-center gap-3 text-blue-600">' +
          '<span class="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-blue-200 bg-white shadow-sm"><i class="fas fa-percent"></i></span>' +
          '<div>' +
            '<p class="text-sm font-black">Tỷ lệ thuế áp dụng: ' + escapeDashboardHtml((Math.round(totalRate * 1000) / 10).toLocaleString('vi-VN')) + '%</p>' +
            '<p class="text-xs text-blue-500">VAT ' + escapeDashboardHtml((Math.round(vatRate * 1000) / 10).toLocaleString('vi-VN')) + '% + TNCN ' + escapeDashboardHtml((Math.round(pitRate * 1000) / 10).toLocaleString('vi-VN')) + '%</p>' +
          '</div>' +
        '</div>' +
        '<div class="text-sm text-slate-500 md:max-w-sm">' +
          'Chỉ tính trên các đơn giao thành công / hoàn thành trong khoảng thời gian đang chọn.' +
        '</div>' +
      '</div>' +
      '<div class="grid grid-cols-2 xl:grid-cols-4 gap-3">' +
        metrics.map((item) => (
          '<div class="rounded-2xl border p-3 min-w-0 shadow-sm ' + item.tone + '">' +
            '<p class="text-xs font-semibold opacity-80">' + escapeDashboardHtml(item.label) + '</p>' +
            '<p class="mt-2 text-lg font-black leading-tight">' + escapeDashboardHtml(item.value) + '</p>' +
          '</div>'
        )).join('') +
      '</div>' +
      '<div class="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm text-slate-500">' +
        '<span class="font-semibold text-slate-700">Thực nhận tạm tính:</span> ' + escapeDashboardHtml(fmtPrice(netRevenue)) +
      '</div>' +
    '</div>'
}

function renderDashboardStatusBreakdown(rows, totalOrders) {
  const wrap = document.getElementById('dashboardStatusBreakdown')
  if (!wrap) return
  const normalized = Array.isArray(rows) ? rows : []
  const order = ['pending', 'confirmed', 'shipping', 'done', 'delivery_failed']
  const map = normalized.reduce((acc, row) => {
    acc[String(row.status || 'pending').toLowerCase()] = Number(row.count || 0)
    return acc
  }, {})
  const total = Math.max(1, normalized.reduce((sum, row) => sum + Number(row.count || 0), 0))

  if (!normalized.length) {
    wrap.innerHTML = '<div class="text-sm text-gray-400">Không có đơn trong khoảng này</div>'
    return
  }

  wrap.innerHTML = order.map((status) => {
    const count = Number(map[status] || 0)
    const percentRaw = (count / total) * 100
    const percent = Math.max(0, Math.min(100, percentRaw))
    const percentLabel = percentRaw.toLocaleString('vi-VN', { minimumFractionDigits: count > 0 ? 1 : 0, maximumFractionDigits: 1 })
    return '<div>' +
      '<div class="mb-1 flex items-center justify-between gap-3 text-xs">' +
        '<span class="font-semibold text-gray-600">' + escapeDashboardHtml(statusLabel(status)) + '</span>' +
        '<span class="font-bold text-gray-900">' + count.toLocaleString('vi-VN') + ' (' + percentLabel + '%)</span>' +
      '</div>' +
      '<div class="h-2 overflow-hidden rounded-full bg-gray-100">' +
        '<div class="' + dashboardStatusBarClass(status) + ' h-full rounded-full" style="width:' + percent + '%"></div>' +
      '</div>' +
    '</div>'
  }).join('')
}

function dashboardStatusBarClass(status) {
  const key = dashboardStatusClass(status)
  if (key === 'pending') return 'bg-amber-400'
  if (key === 'confirmed') return 'bg-blue-500'
  if (key === 'shipping') return 'bg-violet-500'
  if (key === 'done') return 'bg-emerald-500'
  if (key === 'delivery_failed') return 'bg-red-400'
  if (key === 'cancelled') return 'bg-red-400'
  return 'bg-gray-400'
}

function updateOrdersSidebarBadge(count) {
  const pendingBadge = document.getElementById('pendingBadge')
  if (!pendingBadge) return
  const value = Number(count || 0)
  if (value > 0) {
    pendingBadge.textContent = value.toLocaleString('vi-VN')
    pendingBadge.classList.remove('hidden')
    return
  }
  pendingBadge.textContent = ''
  pendingBadge.classList.add('hidden')
}

async function loadDashboard() {
  try {
    syncDashboardDateFilterUI()
    const res = await axios.get('/api/admin/stats', { params: getDashboardStatsParams() })
    const d = res.data?.data || {}
    const statProductsEl = document.getElementById('statProducts')
    const statOrdersEl = document.getElementById('statOrders')
    const statPendingEl = document.getElementById('statPending')
    const statRevenueEl = document.getElementById('statRevenue')
    const statTaxDueEl = document.getElementById('statTaxDue')
    const statFrontendVisitorsEl = document.getElementById('statFrontendVisitors')
    if (statProductsEl) statProductsEl.textContent = d.totalProducts ?? '0'
    if (statOrdersEl) statOrdersEl.textContent = d.totalOrders ?? '0'
    if (statPendingEl) statPendingEl.textContent = d.pendingOrders ?? '0'
    if (statRevenueEl) statRevenueEl.textContent = fmtPrice(d.revenue || 0)
    if (statTaxDueEl) statTaxDueEl.textContent = fmtPrice(d.totalTax || 0)
    if (statFrontendVisitorsEl) statFrontendVisitorsEl.textContent = Number(d.frontendVisitors || 0).toLocaleString('vi-VN')
    fitDashboardStatValues()
    requestAnimationFrame(fitDashboardStatValues)
    renderDashboardInsights(d)
    renderDashboardStatusBreakdown(d.statusBreakdown || [], d.totalOrders || 0)

    updateOrdersSidebarBadge(d.sidebarUndeliveredOrders ?? d.undeliveredOrders ?? d.shippingQueueOrders ?? 0)

    const recent = (d.recentOrders || []).filter(o => !isInternalTestOrder(o))
    const recentOrdersTable = document.getElementById('recentOrdersTable')
    if (!recentOrdersTable) return
    if (!recent.length) {
      recentOrdersTable.innerHTML = '<div class="text-center py-8 text-gray-400">Chưa có đơn hàng nào</div>'
      return
    }
    recentOrdersTable.innerHTML = renderRecentDashboardOrders(recent)
  } catch(e) {
    if (e && e.response && e.response.status === 401) {
      showAdminToast('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại', 'error')
      setTimeout(() => { window.location.href = '/admin/login' }, 400)
      return
    }
    const recentOrdersTable = document.getElementById('recentOrdersTable')
    if (recentOrdersTable) recentOrdersTable.innerHTML = '<div class="text-center py-8 text-red-400">Lỗi tải dữ liệu dashboard</div>'
    console.error(e)
  }
}

// PRODUCT UTILS (also defined in storefront, duplicated here for admin scope)
function normalizeColorOptions(raw) {
  const arr = Array.isArray(raw) ? raw : safeJson(raw)
  if (!Array.isArray(arr)) return []
  return arr.map((item) => {
    if (typeof item === 'string') return { name: String(item || '').trim(), image: '' }
    if (item && typeof item === 'object') {
      return {
        name: String(item.name || item.label || '').trim(),
        image: String(item.image || item.image_url || '').trim()
      }
    }
    return { name: '', image: '' }
  }).filter((c) => c.name || c.image)
}
function getProductColorOptions(product) {
  if (!product) return []
  const direct = Array.isArray(product.color_options) ? product.color_options : null
  if (direct && direct.length) return normalizeColorOptions(direct)
  return normalizeColorOptions(product.colors || [])
}

function normalizeAdminProductTypeSlug(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\\u0300-\\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
}

function getProductTypeLabel(slug) {
  const key = String(slug || '').trim()
  const found = adminProductTypes.find((item) => item.slug === key)
  return found ? found.name : key
}

function inferAdminProductType(product) {
  const explicit = normalizeAdminProductTypeSlug(product?.product_type || product?.product_type_slug)
  if (explicit) return explicit
  const text = String((product?.name || '') + ' ' + (product?.description || '')).toLowerCase()
  if (text.includes('áo phông') || text.includes('áo thun') || text.includes('t-shirt') || text.includes('tshirt')) return 'tshirt'
  if (text.includes('quần jean') || text.includes('quần bò') || text.includes('jeans')) return 'jeans'
  if (text.includes('áo khoác') || text.includes('jacket')) return 'jacket'
  if (text.includes('hoodie') || text.includes('sweater') || text.includes('nỉ')) return 'hoodie'
  if (text.includes('polo')) return 'polo'
  if (text.includes('váy') || text.includes('đầm')) return 'dress'
  if (text.includes('bộ') || text.includes('set')) return 'set'
  if (text.includes('quần')) return 'pants'
  return ''
}

function populateProductTypeControls() {
  const activeTypes = adminProductTypes.filter((item) => item.active !== false)
  const allTypes = adminProductTypes
  const productTypeSelect = document.getElementById('pProductType')
  if (productTypeSelect) {
    const selected = productTypeSelect.value
    productTypeSelect.innerHTML = '<option value="">Chưa phân loại</option>' + allTypes.map((item) => (
      '<option value="' + escapeDashboardHtml(item.slug) + '">' + escapeDashboardHtml(item.name) + (item.active === false ? ' (đang ẩn)' : '') + '</option>'
    )).join('')
    if (selected) productTypeSelect.value = selected
  }
  const productTypeFilter = document.getElementById('productTypeFilter')
  if (productTypeFilter) {
    const selected = productTypeFilter.value
    productTypeFilter.innerHTML = '<option value="">Tất cả loại</option>' + activeTypes.map((item) => (
      '<option value="' + escapeDashboardHtml(item.slug) + '">' + escapeDashboardHtml(item.name) + '</option>'
    )).join('')
    if (selected) productTypeFilter.value = selected
  }
}

function syncProductTypesEditorCollapse() {
  const shell = document.getElementById('productTypesEditorShell')
  const icon = document.getElementById('productTypesEditorChevron')
  if (shell) shell.classList.toggle('hidden', !productTypesEditorOpen)
  if (icon) icon.classList.toggle('rotate-180', !productTypesEditorOpen)
}

function toggleProductTypesEditor() {
  productTypesEditorOpen = !productTypesEditorOpen
  syncProductTypesEditorCollapse()
}

function renderAdminProductTypesEditor() {
  const wrap = document.getElementById('adminProductTypesEditor')
  const count = document.getElementById('adminProductTypesCount')
  if (count) count.textContent = String(adminProductTypes.filter((item) => item && item.active !== false).length) + ' loại'
  syncProductTypesEditorCollapse()
  if (!wrap) return
  if (!adminProductTypes.length) {
    wrap.innerHTML = '<div class="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-400">Chưa có loại sản phẩm</div>'
    return
  }
  wrap.innerHTML = adminProductTypes.map((item, index) => {
    const thumb = String(item.thumbnail || '').trim()
    const fallbackThumb = String(item.resolved_thumbnail || item.fallback_thumbnail || '').trim()
    const count = Number(item.product_count || 0)
    return '<div class="grid gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-3 lg:grid-cols-[92px_minmax(0,1fr)_minmax(120px,160px)_auto_auto] lg:items-center">' +
      '<div class="flex items-center gap-3 lg:block">' +
        '<label class="relative block h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-dashed border-pink-200 bg-white cursor-pointer group">' +
          (thumb ? '<img src="' + escapeDashboardHtml(thumb) + '" alt="" class="h-full w-full object-cover">' : '<span class="flex h-full w-full flex-col items-center justify-center gap-1 text-[10px] font-bold text-pink-400"><i class="fas fa-image text-base"></i>Ảnh</span>') +
          '<span class="absolute inset-0 hidden items-center justify-center bg-black/35 text-white group-hover:flex"><i class="fas fa-upload"></i></span>' +
          '<input type="file" accept="image/*" class="hidden" onchange="uploadAdminProductTypeThumbnail(' + index + ', this)">' +
        '</label>' +
        '<button type="button" onclick="clearAdminProductTypeThumbnail(' + index + ')" class="mt-2 inline-flex h-8 items-center justify-center rounded-xl border border-gray-200 bg-white px-2 text-[11px] font-bold text-gray-500 hover:bg-gray-100">Xóa ảnh</button>' +
      '</div>' +
      '<div class="grid gap-2">' +
        '<input type="text" value="' + escapeDashboardHtml(item.name) + '" oninput="updateAdminProductTypeName(' + index + ', this.value)" placeholder="Tên loại" class="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-pink-300">' +
        '<input type="text" value="' + escapeDashboardHtml(item.thumbnail || '') + '" oninput="updateAdminProductTypeThumbnail(' + index + ', this.value)" placeholder="URL ảnh thumbnail, để trống sẽ lấy ảnh sản phẩm" class="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs outline-none focus:border-pink-300">' +
        '<p class="text-[11px] font-semibold text-gray-400">Đang có ' + count + ' sản phẩm. Nếu không upload ảnh, storefront tự lấy ảnh chính của sản phẩm thuộc loại này' + (fallbackThumb ? ' (đã có ảnh tự động).' : '.') + '</p>' +
      '</div>' +
      '<input type="text" value="' + escapeDashboardHtml(item.slug) + '" oninput="updateAdminProductTypeSlug(' + index + ', this.value)" placeholder="slug" class="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-pink-300">' +
      '<label class="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-gray-600 ring-1 ring-gray-100"><input type="checkbox" class="accent-pink-500" ' + (item.active !== false ? 'checked' : '') + ' onchange="toggleAdminProductTypeActive(' + index + ', this.checked)">Hiện</label>' +
      '<button type="button" onclick="removeAdminProductTypeRow(' + index + ')" class="rounded-xl border border-red-100 bg-white px-3 py-2 text-sm font-semibold text-red-500 hover:bg-red-50"><i class="fas fa-trash"></i></button>' +
    '</div>'
  }).join('')
}

async function loadAdminProductTypes() {
  try {
    const res = await axios.get('/api/admin/product-types')
    adminProductTypes = Array.isArray(res.data?.data) ? res.data.data : []
  } catch (e) {
    adminProductTypes = []
    showAdminToast(e?.response?.data?.error || 'Lỗi tải loại sản phẩm', 'error')
  }
  renderAdminProductTypesEditor()
  populateProductTypeControls()
}

function addAdminProductTypeRow() {
  adminProductTypes.push({ slug: '', name: '', active: true, order: adminProductTypes.length + 1, thumbnail: '' })
  renderAdminProductTypesEditor()
}

function updateAdminProductTypeName(index, value) {
  const item = adminProductTypes[index]
  if (!item) return
  item.name = String(value || '').trimStart()
  if (!item.slug) item.slug = normalizeAdminProductTypeSlug(item.name)
}

function updateAdminProductTypeSlug(index, value) {
  const item = adminProductTypes[index]
  if (!item) return
  item.slug = normalizeAdminProductTypeSlug(value)
}

function toggleAdminProductTypeActive(index, checked) {
  const item = adminProductTypes[index]
  if (item) item.active = !!checked
}

function updateAdminProductTypeThumbnail(index, value) {
  const item = adminProductTypes[index]
  if (!item) return
  item.thumbnail = String(value || '').trim()
}

function clearAdminProductTypeThumbnail(index) {
  updateAdminProductTypeThumbnail(index, '')
  renderAdminProductTypesEditor()
}

async function uploadAdminProductTypeThumbnail(index, input) {
  const item = adminProductTypes[index]
  const file = Array.from(input?.files || []).find((f) => f.type && f.type.startsWith('image/'))
  if (!item || !file) return
  try {
    item.thumbnail = await uploadProductImageFile(file, 700, 0.84, 'product-types')
    renderAdminProductTypesEditor()
    showAdminToast('Đã upload thumbnail danh mục', 'success')
  } catch (_) {
    showAdminToast('Không thể upload thumbnail danh mục', 'error')
  } finally {
    if (input) input.value = ''
  }
}

function removeAdminProductTypeRow(index) {
  adminProductTypes.splice(index, 1)
  renderAdminProductTypesEditor()
}

async function saveAdminProductTypes() {
  const btn = document.getElementById('saveProductTypesBtn')
  const original = btn?.innerHTML || ''
  const normalized = adminProductTypes
    .map((item, index) => ({
      slug: normalizeAdminProductTypeSlug(item.slug || item.name),
      name: String(item.name || '').trim(),
      active: item.active !== false,
      order: index + 1,
      thumbnail: String(item.thumbnail || '').trim()
    }))
    .filter((item) => item.slug && item.name)
  const duplicate = normalized.find((item, index) => normalized.findIndex((x) => x.slug === item.slug) !== index)
  if (duplicate) {
    showAdminToast('Slug loại sản phẩm bị trùng: ' + duplicate.slug, 'error')
    return
  }
  if (!normalized.length) {
    showAdminToast('Cần ít nhất 1 loại sản phẩm', 'error')
    return
  }
  try {
    if (btn) btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>Đang lưu'
    const res = await axios.put('/api/admin/product-types', { types: normalized })
    adminProductTypes = Array.isArray(res.data?.data) ? res.data.data : normalized
    renderAdminProductTypesEditor()
    populateProductTypeControls()
    filterAdminProducts()
    showAdminToast('Đã lưu loại sản phẩm', 'success')
  } catch(e) {
    showAdminToast(e?.response?.data?.error || 'Lỗi lưu loại sản phẩm', 'error')
  } finally {
    if (btn) btn.innerHTML = original
  }
}

function setBackupStatus(targetId, message, tone = 'info') {
  const el = document.getElementById(targetId)
  if (!el) return
  el.classList.remove('hidden')
  const color = tone === 'error' ? 'text-red-600 border-red-100 bg-red-50' : tone === 'success' ? 'text-emerald-700 border-emerald-100 bg-emerald-50' : 'text-gray-600 border-gray-100 bg-gray-50'
  el.className = 'rounded-2xl border p-4 text-sm ' + color
  el.innerHTML = message
}

function loadAdminBackupPage() {
  const exportStatus = document.getElementById('backupExportStatus')
  const importPreview = document.getElementById('backupImportPreview')
  const importStatus = document.getElementById('backupImportStatus')
  if (exportStatus) exportStatus.classList.add('hidden')
  if (importPreview) importPreview.classList.add('hidden')
  if (importStatus) importStatus.classList.add('hidden')
}

function downloadBlobFile(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

async function downloadAdminBackup(format = 'zip') {
  const normalized = format === 'json' ? 'json' : 'zip'
  const btn = document.getElementById(normalized === 'json' ? 'backupJsonBtn' : 'backupZipBtn')
  const original = btn?.innerHTML || ''
  try {
    if (btn) btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>Đang tạo file'
    setBackupStatus('backupExportStatus', '<i class="fas fa-spinner fa-spin mr-2"></i>Đang gom dữ liệu backup...')
    const res = await axios.get('/api/admin/backup/export?format=' + normalized, { responseType: 'blob' })
    const ext = normalized === 'json' ? 'json' : 'zip'
    const stamp = new Date().toISOString().slice(0, 10)
    downloadBlobFile(res.data, 'qhclothes-backup-' + stamp + '.' + ext)
    setBackupStatus('backupExportStatus', '<i class="fas fa-check-circle mr-2"></i>Đã tải file backup ' + ext.toUpperCase() + '.', 'success')
  } catch (e) {
    setBackupStatus('backupExportStatus', '<i class="fas fa-triangle-exclamation mr-2"></i>' + escapeDashboardHtml(e?.response?.data?.error || e?.message || 'Lỗi tạo backup'), 'error')
  } finally {
    if (btn) btn.innerHTML = original
  }
}

function getBackupImportFormData(previewOnly) {
  const input = document.getElementById('backupImportFile')
  const file = input?.files?.[0]
  if (!file) {
    showAdminToast('Chọn file backup trước', 'error')
    return null
  }
  const form = new FormData()
  form.append('file', file)
  form.append('preview_only', previewOnly ? '1' : '0')
  form.append('replace_existing', document.getElementById('backupReplaceExisting')?.checked ? '1' : '0')
  return form
}

function renderBackupSummary(result) {
  const summary = result?.summary || {}
  const rows = [
    ['Sản phẩm', summary.products || 0],
    ['SKU', summary.product_skus || 0],
    ['Banner', summary.hero_banners || 0],
    ['Flashsale', summary.flash_sales || 0],
    ['Mặt hàng flashsale', summary.flash_sale_items || 0],
    ['Mã khuyến mãi', summary.vouchers || 0],
    ['Setting hiển thị', summary.app_settings || 0],
    ['Ảnh trong ZIP', summary.images || 0],
    ['Reviews tham chiếu', summary.reviews || 0],
  ]
  const warningHtml = (result?.warnings || []).map((item) => '<li>' + escapeDashboardHtml(item) + '</li>').join('')
  return '<div class="grid gap-2 sm:grid-cols-2">' + rows.map(([label, value]) => (
    '<div class="flex items-center justify-between rounded-xl bg-white px-3 py-2 ring-1 ring-gray-100"><span>' + escapeDashboardHtml(label) + '</span><strong class="text-gray-900">' + escapeDashboardHtml(value) + '</strong></div>'
  )).join('') + '</div>' +
  (warningHtml ? '<ul class="mt-3 list-disc space-y-1 pl-5 text-xs text-amber-700">' + warningHtml + '</ul>' : '')
}

async function previewAdminBackupImport() {
  const form = getBackupImportFormData(true)
  if (!form) return
  const btn = document.getElementById('backupPreviewBtn')
  const original = btn?.innerHTML || ''
  try {
    if (btn) btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>Đang xem'
    const res = await axios.post('/api/admin/backup/import', form)
    setBackupStatus('backupImportPreview', renderBackupSummary(res.data), 'info')
    setBackupStatus('backupImportStatus', '<i class="fas fa-check-circle mr-2"></i>Preview xong. Kiểm tra số liệu rồi mới import thật.', 'success')
  } catch (e) {
    setBackupStatus('backupImportPreview', '<i class="fas fa-triangle-exclamation mr-2"></i>' + escapeDashboardHtml(e?.response?.data?.error || e?.message || 'Lỗi đọc backup'), 'error')
  } finally {
    if (btn) btn.innerHTML = original
  }
}

async function restoreAdminBackupImport() {
  const form = getBackupImportFormData(false)
  if (!form) return
  const replaceExisting = form.get('replace_existing') === '1'
  const ok = window.confirm((replaceExisting ? 'Import sẽ xoá dữ liệu sản phẩm/marketing hiện tại rồi ghi backup mới.' : 'Import sẽ ghi đè các bản ghi trùng id.') + ' Tiếp tục?')
  if (!ok) return
  const btn = document.getElementById('backupRestoreBtn')
  const original = btn?.innerHTML || ''
  try {
    if (btn) btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>Đang import'
    setBackupStatus('backupImportStatus', '<i class="fas fa-spinner fa-spin mr-2"></i>Đang import dữ liệu và upload lại ảnh...')
    const res = await axios.post('/api/admin/backup/import', form)
    setBackupStatus('backupImportPreview', renderBackupSummary(res.data), 'success')
    setBackupStatus('backupImportStatus', '<i class="fas fa-check-circle mr-2"></i>Import xong. Ảnh upload: ' + escapeDashboardHtml(res.data?.images_uploaded || 0) + ', bỏ qua: ' + escapeDashboardHtml(res.data?.images_skipped || 0) + '.', 'success')
    showAdminToast('Đã import backup', 'success')
  } catch (e) {
    setBackupStatus('backupImportStatus', '<i class="fas fa-triangle-exclamation mr-2"></i>' + escapeDashboardHtml(e?.response?.data?.error || e?.message || 'Lỗi import backup'), 'error')
  } finally {
    if (btn) btn.innerHTML = original
  }
}

// PRODUCTS
async function loadAdminProducts() {
  const grid = document.getElementById('adminProductsGrid')
  grid.innerHTML = '<div class="col-span-4 text-center py-12 text-gray-400"><i class="fas fa-spinner fa-spin text-3xl"></i></div>'
  try {
    await loadAdminProductTypes()
    const res = await axios.get('/api/admin/products')
    adminProducts = sortAdminProductsForDisplay(res.data.data || [])
    renderAdminProducts(adminProducts)
  } catch(e) {
    if (e && e.response && e.response.status === 401) {
      showAdminToast('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại', 'error')
      setTimeout(() => { window.location.href = '/admin/login' }, 400)
      return
    }
    const msg = e?.response?.data?.error || e?.message || 'Lá»—i táº£i dá»¯ liá»‡u'
    grid.innerHTML = '<div class="col-span-4 text-center py-12 text-red-400">Lá»—i táº£i dá»¯ liá»‡u</div>'
    showAdminToast(msg, 'error')
    console.error('loadAdminProducts error:', e)
  }
}

function filterAdminProducts() {
  const q = document.getElementById('productSearch').value.toLowerCase()
  const cat = document.getElementById('productCatFilter').value
  const productType = document.getElementById('productTypeFilter')?.value || ''
  const filtered = adminProducts.filter(p => 
    (!q || String(p?.name || '').toLowerCase().includes(q) || String(p?.brand || '').toLowerCase().includes(q)) &&
    (!cat || String(p?.category || '') === cat) &&
    (!productType || inferAdminProductType(p) === productType)
  )
  renderAdminProducts(sortAdminProductsForDisplay(filtered))
}

function getAdminProductExplicitTrendingOrder(product) {
  const order = Number(product?.trending_order || 0)
  return product?.is_trending && order > 0 ? order : 0
}

function getAdminProductSortTime(product) {
  const parsed = Date.parse(product?.created_at || product?.updated_at || '')
  return Number.isNaN(parsed) ? 0 : parsed
}

function sortAdminProductsForDisplay(products) {
  return (Array.isArray(products) ? [...products] : []).sort((a, b) => {
    const ao = getAdminProductExplicitTrendingOrder(a)
    const bo = getAdminProductExplicitTrendingOrder(b)
    const aRanked = ao > 0
    const bRanked = bo > 0
    if (aRanked && !bRanked) return -1
    if (!aRanked && bRanked) return 1
    if (aRanked && bRanked && ao !== bo) return ao - bo
    const at = getAdminProductSortTime(a)
    const bt = getAdminProductSortTime(b)
    if (at !== bt) return bt - at
    return Number(b?.id || 0) - Number(a?.id || 0)
  })
}

function renderAdminProducts(products) {
  const grid = document.getElementById('adminProductsGrid')
  const safeProducts = (Array.isArray(products) ? products : []).filter(Boolean)
  if (!safeProducts.length) {
    grid.innerHTML = '<div class="col-span-4 text-center py-12 text-gray-400"><i class="fas fa-box-open text-4xl mb-3"></i><p>Không có sản phẩm</p></div>'
    return
  }
  grid.innerHTML = safeProducts.map(raw => {
    try {
      const p = raw || {}
      const name = String(p.name || 'Sản phẩm')
      const brand = String(p.brand || '').trim()
      const thumbnail = String(p.thumbnail || '').trim() || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'
      const productType = inferAdminProductType(p)
      const colors = getProductColorOptions(p).map((c) => c.name).filter(Boolean)
      const sizes = safeJson(p.sizes)
      const viewCount = Number(p.view_count || 0)
      const trendingOrder = Number(p.trending_order || 0)
      const showTrendingOrderBadge = shouldShowTrendingOrderBadge(p)
      return \`
    <div class="admin-product-card bg-white rounded-2xl shadow-sm border overflow-hidden \${!p.is_active ? 'opacity-60' : ''}">
      <div class="admin-product-thumb-shell relative bg-gray-100 overflow-hidden">
        <img src="\${thumbnail}" alt="\${name}" 
          class="admin-product-thumb w-full h-full object-cover" onerror="this.src='https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'">
        <div class="absolute top-2 left-2 flex flex-wrap gap-1 pr-8">
          <span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-white/90 text-gray-700">\${catLabel(p.category)}</span>
          \${productType ? \`<span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-50/95 text-sky-700">\${escapeDashboardHtml(getProductTypeLabel(productType))}</span>\` : ''}
          \${p.is_featured ? '<span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-400 text-white"><i class="fas fa-star mr-1"></i>Hot</span>' : ''}
          \${p.is_trending ? '<span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500 text-white"><i class="fas fa-fire mr-1"></i>Trend</span>' : ''}
          \${p.is_new_arrival ? '<span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500 text-white"><i class="fas fa-box-open mr-1"></i>Hàng mới</span>' : ''}
          \${showTrendingOrderBadge ? \`<span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-500 text-white">#\${trendingOrder}</span>\` : ''}
        </div>
        <div class="absolute top-2 right-2">
          <span class="w-2.5 h-2.5 rounded-full inline-block \${p.is_active ? 'bg-green-400' : 'bg-gray-400'}"></span>
        </div>
      </div>
      <div class="admin-product-card-body p-3">
        \${brand ? \`<p class="text-xs text-pink-500 font-medium mb-1">\${brand}</p>\` : ''}
        <h3 class="font-semibold text-gray-900 text-sm mb-2 line-clamp-2 leading-tight">\${name}</h3>
        <div class="flex flex-wrap items-center gap-x-2 gap-y-1 mb-2">
          <span class="font-bold text-pink-600">\${fmtPrice(p.price)}</span>
          \${p.original_price ? \`<span class="text-xs text-gray-400 line-through">\${fmtPrice(p.original_price)}</span>\` : ''}
        </div>
        \${renderAdminStorefrontBadges(p)}
        \${colors.length ? \`<div class="flex flex-wrap gap-1 mb-2">\${colors.slice(0,3).map(c=>\`<span class="text-xs bg-pink-50 text-pink-600 px-2 py-0.5 rounded-full">\${c}</span>\`).join('')}\${colors.length>3?\`<span class="text-xs text-gray-400">+\${colors.length-3}</span>\`:''}</div>\` : ''}
        \${sizes.length ? \`<div class="flex flex-wrap gap-1 mb-2">\${sizes.slice(0,4).map(s=>\`<span class="text-xs border text-gray-600 px-1.5 py-0.5 rounded">\${s}</span>\`).join('')}\${sizes.length>4?\`<span class="text-xs text-gray-400">+\${sizes.length-4}</span>\`:''}</div>\` : ''}
        <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400 mb-2">
          <span>Tồn kho: <span class="font-semibold text-gray-700">\${p.stock || 0}</span></span>
          <span class="inline-flex items-center gap-1"><i class="fas fa-eye text-sky-400"></i>Lượt xem: <span class="font-semibold text-gray-700">\${viewCount}</span></span>
        </div>
        <div class="flex gap-2">
          <button onclick="openProductModal(\${p.id})" class="flex-1 py-2 border-2 border-pink-200 text-pink-600 rounded-xl text-xs font-semibold hover:bg-pink-50 transition">
            <i class="fas fa-edit mr-1"></i>Sửa
          </button>
          <button onclick="toggleProductActive(\${p.id})" class="py-2 px-3 border-2 border-gray-200 rounded-xl text-xs hover:bg-gray-50 transition" title="\${p.is_active ? 'Ẩn' : 'Hiện'}">
            <i class="fas fa-\${p.is_active ? 'eye-slash' : 'eye'} text-gray-500"></i>
          </button>
          <button onclick="deleteProduct(\${p.id})" class="py-2 px-3 border-2 border-red-200 text-red-500 rounded-xl text-xs hover:bg-red-50 transition">
          <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    </div>\`
    } catch (err) {
      const p = raw || {}
      const name = String(p.name || 'Sản phẩm')
      const thumbnail = String(p.thumbnail || '').trim() || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'
      const isActive = !!p.is_active
      const price = Number(p.price || 0)
      const viewCount = Number(p.view_count || 0)
      console.error('renderAdminProducts item error:', err, raw)
      return \`
      <div class="admin-product-card bg-white rounded-2xl shadow-sm border overflow-hidden \${!isActive ? 'opacity-60' : ''}">
        <div class="admin-product-thumb-shell relative bg-gray-100 overflow-hidden">
          <img src="\${thumbnail}" alt="\${name}" class="admin-product-thumb w-full h-full object-cover" onerror="this.src='https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'">
          <div class="absolute top-2 right-2">
            <span class="w-2.5 h-2.5 rounded-full inline-block \${isActive ? 'bg-green-400' : 'bg-gray-400'}"></span>
          </div>
        </div>
        <div class="admin-product-card-body p-3">
          <h3 class="font-semibold text-gray-900 text-sm mb-2 line-clamp-2 leading-tight">\${name}</h3>
          <div class="flex flex-wrap items-center gap-x-2 gap-y-1 mb-2">
            <span class="font-bold text-pink-600">\${fmtPrice(price)}</span>
          </div>
          <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400 mb-2">
            <span>Tồn kho: <span class="font-semibold text-gray-700">\${p.stock || 0}</span></span>
            <span class="inline-flex items-center gap-1"><i class="fas fa-eye text-sky-400"></i>Lượt xem: <span class="font-semibold text-gray-700">\${viewCount}</span></span>
          </div>
          <div class="flex gap-2">
            <button onclick="openProductModal(\${p.id})" class="flex-1 py-2 border-2 border-pink-200 text-pink-600 rounded-xl text-xs font-semibold hover:bg-pink-50 transition">
              <i class="fas fa-edit mr-1"></i>Sửa
            </button>
            <button onclick="toggleProductActive(\${p.id})" class="py-2 px-3 border-2 border-gray-200 rounded-xl text-xs hover:bg-gray-50 transition" title="\${isActive ? 'Ẩn' : 'Hiện'}">
              <i class="fas fa-\${isActive ? 'eye-slash' : 'eye'} text-gray-500"></i>
            </button>
            <button onclick="deleteProduct(\${p.id})" class="py-2 px-3 border-2 border-red-200 text-red-500 rounded-xl text-xs hover:bg-red-50 transition">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>\`
    }
  }).join('')
}

async function toggleProductActive(id) {
  try {
    await axios.patch('/api/admin/products/' + id + '/toggle')
    loadAdminProducts()
    showAdminToast('Đã cập nhật trạng thái', 'success')
  } catch(e) { showAdminToast('Lỗi cập nhật', 'error') }
}

async function deleteProduct(id) {
  if (!confirm('Bạn chắc chắn muốn xóa sản phẩm này?')) return
  try {
    await axios.delete('/api/admin/products/' + id)
    loadAdminProducts()
    showAdminToast('Đã xóa sản phẩm', 'success')
  } catch(e) { showAdminToast('Lỗi xóa sản phẩm', 'error') }
}

// PRODUCT MODAL
const TIKTOK_MARKETPLACE_RETAIN_RATE = 0.65
const TIKTOK_MARKETPLACE_FIXED_COST = 33000
const PRODUCT_STOREFRONT_KEYS = ['boypho', 'hottrendnu']

function normalizeAdminProductStorefrontVisibility(input) {
  let source = []
  if (Array.isArray(input)) {
    source = input
  } else if (typeof input === 'string') {
    const trimmed = input.trim()
    if (trimmed) {
      try {
        const parsed = JSON.parse(trimmed)
        source = Array.isArray(parsed) ? parsed : [trimmed]
      } catch (_) {
        source = trimmed.split(',')
      }
    }
  }
  const keys = source.map((item) => String(item || '').trim().toLowerCase())
  if (keys.includes('all')) return PRODUCT_STOREFRONT_KEYS.slice()
  const out = PRODUCT_STOREFRONT_KEYS.filter((key) => keys.includes(key))
  return out.length ? out : ['boypho']
}

function renderAdminStorefrontBadges(product) {
  const keys = normalizeAdminProductStorefrontVisibility(product?.storefront_visibility)
  const labelMap = { boypho: 'Boypho', hottrendnu: 'QH Clothes' }
  return '<div class="flex flex-wrap gap-1 mb-2">' + keys.map((key) => {
    const colorClass = key === 'hottrendnu' ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600'
    return '<span class="text-xs font-semibold px-2 py-0.5 rounded-full ' + colorClass + '">' + (labelMap[key] || key) + '</span>'
  }).join('') + '</div>'
}

function syncProductStorefrontAllCheckbox() {
  const checks = Array.from(document.querySelectorAll('[data-storefront-visibility]'))
  const all = document.getElementById('pStorefrontAll')
  if (!all || !checks.length) return
  all.checked = checks.every((input) => input.checked)
}

function bindProductStorefrontVisibilityInputs() {
  const checks = Array.from(document.querySelectorAll('[data-storefront-visibility]'))
  const all = document.getElementById('pStorefrontAll')
  if (all && all.dataset.boundStorefrontVisibility !== '1') {
    all.dataset.boundStorefrontVisibility = '1'
    all.addEventListener('change', () => {
      checks.forEach((input) => { input.checked = all.checked })
      if (!checks.some((input) => input.checked) && checks[0]) checks[0].checked = true
      syncProductStorefrontAllCheckbox()
    })
  }
  checks.forEach((input) => {
    if (input.dataset.boundStorefrontVisibility === '1') return
    input.dataset.boundStorefrontVisibility = '1'
    input.addEventListener('change', () => {
      if (!checks.some((item) => item.checked)) input.checked = true
      syncProductStorefrontAllCheckbox()
    })
  })
  syncProductStorefrontAllCheckbox()
}

function setProductStorefrontVisibilityInput(input) {
  bindProductStorefrontVisibilityInputs()
  const keys = normalizeAdminProductStorefrontVisibility(input)
  document.querySelectorAll('[data-storefront-visibility]').forEach((checkbox) => {
    checkbox.checked = keys.includes(String(checkbox.value || '').trim().toLowerCase())
  })
  syncProductStorefrontAllCheckbox()
}

function getProductStorefrontVisibilityInput() {
  const keys = Array.from(document.querySelectorAll('[data-storefront-visibility]:checked'))
    .map((input) => String(input.value || '').trim().toLowerCase())
    .filter((key) => PRODUCT_STOREFRONT_KEYS.includes(key))
  return keys.length ? keys : ['boypho']
}

function parseAdminMoneyInput(value) {
  const normalized = String(value || '').replace(/[^0-9]/g, '')
  return Number(normalized || 0)
}

function formatAdminVnd(value) {
  const amount = Number(value || 0)
  if (!Number.isFinite(amount) || amount <= 0) return '--'
  return amount.toLocaleString('vi-VN') + 'đ'
}

function roundUpToNearestThousand(value) {
  const amount = Number(value || 0)
  if (!Number.isFinite(amount) || amount <= 0) return 0
  return Math.ceil(amount / 1000) * 1000
}

function calculateTikTokMarketplacePrice(costPrice) {
  const cost = Number(costPrice || 0)
  if (!Number.isFinite(cost) || cost <= 0) return 0
  return roundUpToNearestThousand((cost + TIKTOK_MARKETPLACE_FIXED_COST) / TIKTOK_MARKETPLACE_RETAIN_RATE)
}

function updateMarketplacePriceCalculator() {
  const input = document.getElementById('pTiktokCostInput')
  const output = document.getElementById('pTiktokSuggestedPrice')
  const hint = document.getElementById('pTiktokFormulaHint')
  if (!input || !output) return
  const cost = parseAdminMoneyInput(input.value)
  const suggested = calculateTikTokMarketplacePrice(cost)
  output.textContent = formatAdminVnd(suggested)
  if (hint) {
    hint.textContent = cost > 0
      ? 'Làm tròn lên nghìn: (' + cost.toLocaleString('vi-VN') + ' + 33.000) / 0,65'
      : 'Công thức: (giá gốc + 33.000) / 0,65'
  }
}

function syncMarketplaceCostFromProductPrice(force = false) {
  const priceInput = document.getElementById('pPrice')
  const tiktokCostInput = document.getElementById('pTiktokCostInput')
  if (!priceInput || !tiktokCostInput) return
  if (!force && String(tiktokCostInput.value || '').trim()) return
  tiktokCostInput.value = String(priceInput.value || '').trim()
  updateMarketplacePriceCalculator()
}

function bindMarketplacePriceCalculator() {
  const tiktokCostInput = document.getElementById('pTiktokCostInput')
  const priceInput = document.getElementById('pPrice')
  if (tiktokCostInput && tiktokCostInput.dataset.marketplaceCalculatorBound !== '1') {
    tiktokCostInput.dataset.marketplaceCalculatorBound = '1'
    tiktokCostInput.addEventListener('input', updateMarketplacePriceCalculator)
    tiktokCostInput.addEventListener('change', updateMarketplacePriceCalculator)
  }
  if (priceInput && priceInput.dataset.marketplaceCalculatorBound !== '1') {
    priceInput.dataset.marketplaceCalculatorBound = '1'
    priceInput.addEventListener('input', () => syncMarketplaceCostFromProductPrice(false))
    priceInput.addEventListener('change', () => syncMarketplaceCostFromProductPrice(false))
  }
  ;['pPrice','pOriginalPrice','pStock'].forEach((id) => {
    const input = document.getElementById(id)
    if (input && input.dataset.skuMatrixBound !== '1') {
      input.dataset.skuMatrixBound = '1'
      input.addEventListener('input', refreshProductSkuMatrixIfEnabled)
      input.addEventListener('change', refreshProductSkuMatrixIfEnabled)
    }
  })
  updateMarketplacePriceCalculator()
}

window.updateMarketplacePriceCalculator = updateMarketplacePriceCalculator
window.onDashboardFilterModeChange = onDashboardFilterModeChange
window.onDashboardFilterValueChange = onDashboardFilterValueChange
window.toggleDashboardDatePicker = toggleDashboardDatePicker
window.shiftDashboardMonthPickerYear = shiftDashboardMonthPickerYear
window.toggleDashboardMonthYearList = toggleDashboardMonthYearList
window.selectDashboardMonthPickerYear = selectDashboardMonthPickerYear
window.selectDashboardMonth = selectDashboardMonth
window.shiftDashboardDayPickerMonth = shiftDashboardDayPickerMonth
window.selectDashboardDate = selectDashboardDate

async function openProductModal(id = null) {
  editingId = id
  colors = []
  sizes = []
  skuPricingEnabled = false
  productSkuRows = []
  galleryImages = ['','','','','','','','','']
  const toStringList = (raw) => {
    const arr = Array.isArray(raw) ? raw : safeJson(raw)
    if (!Array.isArray(arr)) return []
    return arr.map((item) => String(item || '').trim()).filter(Boolean)
  }
  const normalizeColorOptionsLocal = (raw) => {
    const arr = Array.isArray(raw) ? raw : safeJson(raw)
    if (!Array.isArray(arr)) return []
    return arr.map((item) => {
      if (typeof item === 'string') return { name: String(item || '').trim(), image: '' }
      if (item && typeof item === 'object') {
        return {
          name: String(item.name || item.label || '').trim(),
          image: String(item.image || item.image_url || '').trim()
        }
      }
      return { name: '', image: '' }
    }).filter((c) => c.name || c.image)
  }
  
  resetProductForm()
  document.getElementById('modalTitle').textContent = id ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'
  
  // Bind gallery slots
  for (let i = 0; i < 9; i++) {
    const slot = document.getElementById('slot-'+i)
    if (slot) slot.onclick = () => handleGallerySlotClick(i)
  }
  
  if (id) {
    try {
      const res = await axios.get('/api/admin/products/' + id)
      const p = res?.data?.data || {}
      document.getElementById('productId').value = p.id || ''
      document.getElementById('pName').value = p.name || ''
      document.getElementById('pPrice').value = p.price || ''
      document.getElementById('pOriginalPrice').value = p.original_price || ''
      syncMarketplaceCostFromProductPrice(true)
      document.getElementById('pCategory').value = p.category || 'unisex'
      populateProductTypeControls()
      document.getElementById('pProductType').value = inferAdminProductType(p)
      setProductStorefrontVisibilityInput(p.storefront_visibility)
      document.getElementById('pBrand').value = p.brand || ''
      document.getElementById('pMaterial').value = p.material || ''
      document.getElementById('pDescription').value = p.description || ''
      document.getElementById('pStock').value = p.stock || 0
      document.getElementById('pFeatured').checked = !!p.is_featured
      document.getElementById('pTrending').checked = !!p.is_trending
      document.getElementById('pNewArrival').checked = !!p.is_new_arrival
      document.getElementById('pTrendingOrder').value = String(p.trending_order || 0)
      document.getElementById('pActive').checked = !!p.is_active
      
      // Thumbnail
      previewThumbnail(p.thumbnail || '')
      document.getElementById('pThumbnail').value = p.thumbnail || ''
      
      // Gallery
      const imgs = toStringList(Array.isArray(p.image_list) ? p.image_list : p.images)
      imgs.forEach((url, i) => { if (i < 9 && url) setGallerySlot(i, url) })
      
      // Colors & sizes
      colors = normalizeColorOptionsLocal(Array.isArray(p.color_options) ? p.color_options : p.colors)
      sizes = toStringList(Array.isArray(p.size_list) ? p.size_list : p.sizes)
      hydrateProductSkuRows(Array.isArray(p.product_skus) ? p.product_skus : p.skus)
      skuPricingEnabled = shouldEnableSkuPricingForProduct(p)
      renderColorOptionsEditor()
      renderTags('size')
      renderProductSkuMatrix()
    } catch(e) {
      const msg = e?.response?.data?.error || e?.message || 'Lỗi tải sản phẩm'
      console.error('openProductModal error:', e)
      showAdminToast(msg, 'error')
      return
    }
  }
  
  bindMarketplacePriceCalculator()
  renderProductSkuMatrix()
  syncTrendingOrderOptions(editingId)
  showAdminOverlay(document.getElementById('productModal'))
}

function closeProductModal() {
  forceHideAdminOverlay(document.getElementById('productModal'))
  editingId = null
}

function resetProductForm() {
  document.getElementById('productForm').reset()
  document.getElementById('productId').value = ''
  document.getElementById('pActive').checked = true
  document.getElementById('pTrendingOrder').value = '0'
  const tiktokCostInput = document.getElementById('pTiktokCostInput')
  if (tiktokCostInput) tiktokCostInput.value = ''
  bindMarketplacePriceCalculator()
  populateProductTypeControls()
  const productTypeSelect = document.getElementById('pProductType')
  if (productTypeSelect) productTypeSelect.value = ''
  setProductStorefrontVisibilityInput(['boypho'])
  previewThumbnail('')
  for (let i = 0; i < 9; i++) clearGallerySlot(i)
  colors = []; sizes = []
  skuPricingEnabled = false
  productSkuRows = []
  renderColorOptionsEditor(); renderTags('size')
  renderProductSkuMatrix()
  galleryImages = ['','','','','','','','','']
  syncTrendingOrderOptions(editingId)
}

function getTrendingOrderBuckets(currentProductId = null) {
  const currentId = Number(currentProductId || 0)
  const buckets = new Map()
  ;(Array.isArray(adminProducts) ? adminProducts : []).forEach((product) => {
    const productId = Number(product?.id || 0)
    const order = Number(product?.trending_order || 0)
    if (!product?.is_trending || order <= 0) return
    if (currentId > 0 && productId === currentId) return
    const products = buckets.get(order) || []
    products.push(product)
    buckets.set(order, products)
  })
  return buckets
}

function getValidTrendingOrderOwnerMap(currentProductId = null) {
  const owners = new Map()
  getTrendingOrderBuckets(currentProductId).forEach((products, order) => {
    if (products.length === 1) owners.set(order, products[0])
  })
  return owners
}

function getUsedTrendingOrderMap(currentProductId = null) {
  return getValidTrendingOrderOwnerMap(currentProductId)
}

function shouldShowTrendingOrderBadge(product) {
  const order = Number(product?.trending_order || 0)
  return !!product?.is_trending && order > 0
}

function syncTrendingOrderOptions(currentProductId = null) {
  const select = document.getElementById('pTrendingOrder')
  if (!select) return
  Array.from(select.options || []).forEach((option) => {
    const value = Number(option.value || 0)
    if (value <= 0) {
      option.disabled = false
      option.textContent = 'Tự động'
      return
    }
    option.disabled = false
    option.textContent = String(value)
  })
  if (select.selectedOptions && select.selectedOptions[0]?.disabled) {
    select.value = '0'
  }
}

function isTrendingOrderTaken(order, currentProductId = null) {
  const normalizedOrder = Number(order || 0)
  if (normalizedOrder <= 0) return false
  return getUsedTrendingOrderMap(currentProductId).has(normalizedOrder)
}

async function saveProduct(e) {
  e.preventDefault()
  const btn = document.getElementById('saveBtn')
  btn.textContent = 'Đang lưu...'
  
  const imgList = galleryImages.filter(v => v && v.trim())
  const normalizedThumbnail = String(document.getElementById('pThumbnail').value || '').trim()
  const normalizedColors = colors
    .map((c) => ({ name: String(c?.name || '').trim(), image: String(c?.image || '').trim() }))
    .filter((c) => c.name || c.image)
  if (!normalizedThumbnail && imgList.length === 0) {
    showAdminToast('Trường hình ảnh là bắt buộc', 'error')
    btn.textContent = 'Lưu sản phẩm'
    return
  }
  const skuRows = collectProductSkuRows()
  const skuFallback = getSkuFallbackPricing(skuRows)
  const manualPrice = String(document.getElementById('pPrice').value || '').trim()
  const manualOriginalPrice = String(document.getElementById('pOriginalPrice').value || '').trim()
  const resolvedPrice = manualPrice || (skuFallback.price > 0 ? String(skuFallback.price) : '')
  const resolvedOriginalPrice = manualOriginalPrice || (skuFallback.originalPrice ? String(skuFallback.originalPrice) : null)
  if (!resolvedPrice) {
    showAdminToast('Vui lòng nhập giá bán mặc định hoặc bật bảng SKU và nhập giá cho ít nhất một SKU', 'error')
    btn.textContent = 'Lưu sản phẩm'
    return
  }
  const isTrendingChecked = document.getElementById('pTrending').checked
  const selectedTrendingOrder = isTrendingChecked ? (parseInt(document.getElementById('pTrendingOrder').value) || 0) : 0
  
  const data = {
    name: document.getElementById('pName').value,
    price: resolvedPrice,
    original_price: resolvedOriginalPrice,
    category: document.getElementById('pCategory').value,
    product_type: document.getElementById('pProductType')?.value || '',
    brand: document.getElementById('pBrand').value,
    material: document.getElementById('pMaterial').value,
    description: document.getElementById('pDescription').value,
    thumbnail: normalizedThumbnail,
    images: imgList,
    colors: normalizedColors,
    sizes: sizes,
    product_skus: skuRows,
    stock: document.getElementById('pStock').value || skuFallback.stock || 0,
    is_featured: document.getElementById('pFeatured').checked,
    is_trending: isTrendingChecked,
    is_new_arrival: document.getElementById('pNewArrival').checked,
    trending_order: selectedTrendingOrder,
    is_active: document.getElementById('pActive').checked,
    storefront_visibility: getProductStorefrontVisibilityInput()
  }
  const payloadSize = JSON.stringify(data).length
  if (payloadSize > MAX_PRODUCT_PAYLOAD_SIZE) {
    showAdminToast('Ảnh quá nặng, vui lòng giảm dung lượng hoặc số lượng ảnh', 'error')
    btn.textContent = 'Lưu sản phẩm'
    return
  }
  
  try {
    if (editingId) {
      await axios.put('/api/admin/products/' + editingId, data)
      showAdminToast('Cập nhật sản phẩm thành công!', 'success')
    } else {
      await axios.post('/api/admin/products', data)
      showAdminToast('Thêm sản phẩm thành công!', 'success')
    }
    closeProductModal()
    loadAdminProducts()
  } catch(e) {
    const msg = e.response?.data?.error || e.message || 'Lỗi lưu sản phẩm'
    showAdminToast(msg, 'error')
  } finally {
    btn.textContent = 'Lưu sản phẩm'
  }
}

// GALLERY
function handleGallerySlotClick(i) {
  const hasImg = galleryImages[i]
  if (!hasImg) {
    document.getElementById('galleryFile-'+i).click()
  }
}

function setGallerySlot(i, url) {
  galleryImages[i] = url
  const img = document.getElementById('galleryImg-'+i)
  const placeholder = document.getElementById('slotPlaceholder-'+i)
  const delBtn = document.getElementById('slotDel-'+i)
  const slot = document.getElementById('slot-'+i)
  if (img) { img.src = url; img.classList.remove('hidden') }
  if (placeholder) placeholder.classList.add('hidden')
  if (delBtn) { delBtn.classList.remove('hidden'); delBtn.classList.add('flex') }
  if (slot) slot.classList.add('has-img')
}

function clearGallerySlot(i) {
  galleryImages[i] = ''
  const img = document.getElementById('galleryImg-'+i)
  const placeholder = document.getElementById('slotPlaceholder-'+i)
  const delBtn = document.getElementById('slotDel-'+i)
  const slot = document.getElementById('slot-'+i)
  if (img) { img.src = ''; img.classList.add('hidden') }
  if (placeholder) placeholder.classList.remove('hidden')
  if (delBtn) { delBtn.classList.add('hidden'); delBtn.classList.remove('flex') }
  if (slot) slot.classList.remove('has-img')
}

function compactGallerySlots() {
  const compacted = galleryImages.filter(v => String(v || '').trim())
  galleryImages = ['','','','','','','','','']
  for (let i = 0; i < 9; i++) clearGallerySlot(i)
  compacted.forEach((url, idx) => {
    if (idx < 9) setGallerySlot(idx, url)
  })
}

function removeGalleryImg(i) {
  event.stopPropagation()
  clearGallerySlot(i)
}

async function handleGalleryFile(i, input) {
  const files = Array.from(input.files || []).filter(f => f.type && f.type.startsWith('image/'))
  if (!files.length) return
  await applyMultipleImagesFrom(files, 'gallery', i)
  input.value = ''
}

function handleImageDragOver(event) {
  event.preventDefault()
  const hasInternalSource = !!event.dataTransfer?.types?.includes('application/x-image-source')
  event.dataTransfer.dropEffect = hasInternalSource ? 'move' : 'copy'
  event.currentTarget.classList.add('drag-over')
}

function handleImageDragLeave(event) {
  event.currentTarget.classList.remove('drag-over')
}

async function handleImageDrop(event, targetType, targetIndex = -1) {
  event.preventDefault()
  event.currentTarget.classList.remove('drag-over')
  const srcPayload = event.dataTransfer?.getData('application/x-image-source')
  if (srcPayload) {
    handleImageReorderDrop(srcPayload, targetType, targetIndex)
    return
  }
  const files = Array.from(event.dataTransfer?.files || []).filter(f => f.type && f.type.startsWith('image/'))
  if (!files.length) {
    showAdminToast('Vui lòng kéo thả file ảnh hợp lệ', 'warning')
    return
  }
  await applyMultipleImagesFrom(files, targetType, targetIndex)
}

function startImageReorderDrag(event, sourceType, sourceIndex = -1) {
  const sourceUrl = sourceType === 'thumbnail'
    ? String(document.getElementById('pThumbnail')?.value || '').trim()
    : String(galleryImages[sourceIndex] || '').trim()
  if (!sourceUrl) {
    event.preventDefault()
    return
  }
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('application/x-image-source', JSON.stringify({ sourceType, sourceIndex }))
  event.dataTransfer.setData('text/plain', sourceUrl)
}

function handleImageReorderDrop(rawSource, targetType, targetIndex = -1) {
  let source
  try {
    source = JSON.parse(rawSource)
  } catch {
    return
  }
  const sourceType = source?.sourceType === 'thumbnail' ? 'thumbnail' : 'gallery'
  const sourceIndex = Number.isInteger(source?.sourceIndex) ? source.sourceIndex : -1
  if (sourceType === targetType && sourceIndex === targetIndex) return
  const sourceUrl = sourceType === 'thumbnail'
    ? String(document.getElementById('pThumbnail')?.value || '').trim()
    : String(galleryImages[sourceIndex] || '').trim()
  if (!sourceUrl) return
  const targetUrl = targetType === 'thumbnail'
    ? String(document.getElementById('pThumbnail')?.value || '').trim()
    : String(galleryImages[targetIndex] || '').trim()
  if (targetType === 'thumbnail') {
    document.getElementById('pThumbnail').value = sourceUrl
    previewThumbnail(sourceUrl)
  } else if (targetIndex >= 0 && targetIndex < 9) {
    setGallerySlot(targetIndex, sourceUrl)
  }
  if (sourceType === 'thumbnail') {
    if (targetUrl) {
      document.getElementById('pThumbnail').value = targetUrl
      previewThumbnail(targetUrl)
    } else {
      document.getElementById('pThumbnail').value = ''
      previewThumbnail('')
    }
  } else if (sourceIndex >= 0 && sourceIndex < 9) {
    if (targetUrl) setGallerySlot(sourceIndex, targetUrl)
    else clearGallerySlot(sourceIndex)
  }
  compactGallerySlots()
}

async function applyMultipleImagesFrom(files, targetType, startIndex = 0) {
  try {
    let fileIndex = 0
    if (targetType === 'thumbnail' && files[0]) {
      const thumbUrl = await uploadProductImageFile(files[0], 900, 0.85, 'products')
      document.getElementById('pThumbnail').value = thumbUrl
      previewThumbnail(thumbUrl)
      fileIndex = 1
      startIndex = 0
    }
    for (let i = startIndex; i < 9 && fileIndex < files.length; i++) {
      const imageUrl = await uploadProductImageFile(files[fileIndex], 1200, 0.82, 'product-gallery')
      setGallerySlot(i, imageUrl)
      fileIndex++
    }
    if (fileIndex < files.length) {
      showAdminToast('Đã đầy ô ảnh, một số ảnh chưa được thêm', 'warning')
    }
  } catch (e) {
    showAdminToast('Không thể xử lý ảnh, vui lòng thử ảnh khác', 'error')
  }
}

function addGalleryUrl() {
  const url = document.getElementById('galleryUrlInput').value.trim()
  if (!url) return
  const emptySlot = galleryImages.findIndex(v => !v)
  if (emptySlot === -1) { showAdminToast('Đã đầy 9 ảnh', 'error'); return }
  setGallerySlot(emptySlot, url)
  document.getElementById('galleryUrlInput').value = ''
}

function previewThumbnail(url) {
  const img = document.getElementById('thumbnailPreview')
  const placeholder = document.getElementById('thumbnailPlaceholder')
  const box = document.getElementById('thumbnailPreviewBox')
  if (url) {
    img.src = url; img.classList.remove('hidden'); placeholder.classList.add('hidden')
    box.classList.add('has-img')
  } else {
    img.src = ''; img.classList.add('hidden'); placeholder.classList.remove('hidden')
    box.classList.remove('has-img')
  }
}

async function handleThumbnailFile(input) {
  const files = Array.from(input.files || []).filter(f => f.type && f.type.startsWith('image/'))
  if (!files.length) return
  await applyMultipleImagesFrom(files, 'thumbnail', 0)
  input.value = ''
}

function fileToOptimizedBlob(file, maxWidth = 1200, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('read_failed'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('decode_failed'))
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width)
        const width = Math.max(1, Math.round(img.width * scale))
        const height = Math.max(1, Math.round(img.height * scale))
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject(new Error('canvas_failed'))
        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob((blob) => {
          if (!blob) return reject(new Error('encode_failed'))
          resolve(blob)
        }, 'image/jpeg', quality)
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

async function uploadProductImageFile(file, maxWidth = 1200, quality = 0.82, folder = 'products') {
  const blob = await fileToOptimizedBlob(file, maxWidth, quality)
  const form = new FormData()
  form.append('folder', folder)
  form.append('file', blob, 'image.jpg')
  const res = await axios.post('/api/admin/assets/images', form)
  const url = String(res.data?.url || '').trim()
  if (!url) throw new Error('upload_failed')
  return url
}

function escapeAdminAttr(value) {
  return String(value || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function normalizeAdminSkuKey(color, size) {
  return String(color || '').trim().toLowerCase() + '::' + String(size || '').trim().toLowerCase()
}

function getProductSkuVariantOptions() {
  const variantOptions = colors
    .map((item) => ({
      color: String(item?.name || '').trim(),
      image: String(item?.image || '').trim()
    }))
    .filter((item) => item.color || item.image)
  return variantOptions.length ? variantOptions : [{ color: '', image: '' }]
}

function getProductSkuSizeOptions() {
  const list = sizes.map((size) => String(size || '').trim()).filter(Boolean)
  return list.length ? list : ['']
}

function makeAdminSkuCode(color, size, index) {
  const productId = String(document.getElementById('productId')?.value || 'NEW').trim() || 'NEW'
  const slug = (value, fallback) => {
    const out = String(value || '')
      .normalize('NFD')
      .replace(/[\\u0300-\\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toUpperCase()
    return out || fallback
  }
  return ['SKU', productId, slug(color, 'VAR'), slug(size, 'ONE'), String(index + 1).padStart(2, '0')].join('-')
}

function getExistingSkuRowByKey(key) {
  return productSkuRows.find((row) => normalizeAdminSkuKey(row.color, row.size) === key) || null
}

function buildProductSkuRowsFromOptions() {
  const variants = getProductSkuVariantOptions()
  const sizeOptions = getProductSkuSizeOptions()
  const price = parseAdminMoneyInput(document.getElementById('pPrice')?.value || 0)
  const originalPriceRaw = String(document.getElementById('pOriginalPrice')?.value || '').trim()
  const originalPrice = originalPriceRaw ? parseAdminMoneyInput(originalPriceRaw) : ''
  const stock = Math.max(0, parseInt(document.getElementById('pStock')?.value || '0', 10) || 0)
  const rows = []
  variants.forEach((variant, variantIndex) => {
    sizeOptions.forEach((size, sizeIndex) => {
      const key = normalizeAdminSkuKey(variant.color, size)
      const existing = getExistingSkuRowByKey(key)
      const index = rows.length
      rows.push({
        id: existing?.id || '',
        color: variant.color,
        size,
        image: variant.image || existing?.image || '',
        sku_code: existing?.sku_code || makeAdminSkuCode(variant.color, size, index + variantIndex + sizeIndex),
        price: existing?.price !== undefined && existing?.price !== null && String(existing.price) !== '' ? existing.price : price,
        original_price: existing?.original_price !== undefined && existing?.original_price !== null ? existing.original_price : originalPrice,
        stock: existing?.stock !== undefined && existing?.stock !== null && String(existing.stock) !== '' ? existing.stock : stock,
        is_active: existing?.is_active === undefined ? 1 : (Number(existing.is_active) === 0 ? 0 : 1)
      })
    })
  })
  productSkuRows = rows
  return rows
}

function hydrateProductSkuRows(rows) {
  productSkuRows = (Array.isArray(rows) ? rows : []).map((row) => ({
    id: row?.id || '',
    color: String(row?.color || '').trim(),
    size: String(row?.size || '').trim(),
    image: String(row?.image || '').trim(),
    sku_code: String(row?.sku_code || '').trim(),
    price: row?.price ?? '',
    original_price: row?.original_price ?? '',
    stock: row?.stock ?? 0,
    is_active: Number(row?.is_active ?? 1) === 0 ? 0 : 1
  }))
}

function shouldEnableSkuPricingForProduct(product) {
  const rows = Array.isArray(product?.product_skus) ? product.product_skus : (Array.isArray(product?.skus) ? product.skus : [])
  if (!rows.length) return false
  const productPrice = Number(product?.price || 0)
  const productOriginal = Number(product?.original_price || 0)
  const productStock = Number(product?.stock || 0)
  return rows.some((row) => {
    const rowPrice = Number(row?.price || 0)
    const rowOriginal = Number(row?.original_price || 0)
    const rowStock = Number(row?.stock || 0)
    return rowPrice !== productPrice || rowOriginal !== productOriginal || rowStock !== productStock || Number(row?.is_active ?? 1) === 0
  })
}

function renderProductSkuMatrix() {
  const section = document.getElementById('skuMatrixSection')
  const tbody = document.getElementById('skuMatrixBody')
  const count = document.getElementById('skuMatrixCount')
  const toggle = document.getElementById('pSkuPricingEnabled')
  if (toggle) toggle.checked = !!skuPricingEnabled
  if (!section || !tbody) return
  section.classList.toggle('hidden', !skuPricingEnabled)
  if (!skuPricingEnabled) {
    tbody.innerHTML = ''
    if (count) count.textContent = '0 SKU'
    return
  }
  const rows = buildProductSkuRowsFromOptions()
  if (count) count.textContent = rows.length + ' SKU'
  tbody.innerHTML = rows.map((row, index) => {
    const active = Number(row.is_active ?? 1) !== 0
    return '<tr class="border-b last:border-b-0 align-top" data-sku-row-index="' + index + '">' +
      '<td class="px-3 py-2 text-sm font-semibold text-gray-800 min-w-[130px]">' + (row.color ? escapeAdminAttr(row.color) : '<span class="text-gray-400">Mặc định</span>') + '</td>' +
      '<td class="px-3 py-2 text-sm text-gray-700 min-w-[110px]">' + (row.size ? escapeAdminAttr(row.size) : '<span class="text-gray-400">Không size</span>') + '</td>' +
      '<td class="px-3 py-2 min-w-[120px]"><input type="number" min="0" value="' + escapeAdminAttr(row.stock) + '" oninput="updateProductSkuRow(' + index + ', \\'stock\\', this.value)" class="w-full border rounded-lg px-2 py-1.5 text-sm"></td>' +
      '<td class="px-3 py-2 min-w-[140px]"><input type="number" min="0" value="' + escapeAdminAttr(row.price) + '" oninput="updateProductSkuRow(' + index + ', \\'price\\', this.value)" class="w-full border rounded-lg px-2 py-1.5 text-sm"></td>' +
      '<td class="px-3 py-2 min-w-[140px]"><input type="number" min="0" value="' + escapeAdminAttr(row.original_price) + '" oninput="updateProductSkuRow(' + index + ', \\'original_price\\', this.value)" class="w-full border rounded-lg px-2 py-1.5 text-sm"></td>' +
      '<td class="px-3 py-2 min-w-[150px]"><input type="text" value="' + escapeAdminAttr(row.sku_code) + '" oninput="updateProductSkuRow(' + index + ', \\'sku_code\\', this.value)" class="w-full border rounded-lg px-2 py-1.5 text-sm"></td>' +
      '<td class="px-3 py-2 text-center min-w-[78px]"><label class="inline-flex items-center justify-center gap-1 text-xs font-semibold text-gray-600"><input type="checkbox" ' + (active ? 'checked' : '') + ' onchange="updateProductSkuRow(' + index + ', \\'is_active\\', this.checked ? 1 : 0)" class="w-4 h-4 accent-pink-500"> Bật</label></td>' +
    '</tr>'
  }).join('')
}

function toggleProductSkuPricing(checked) {
  skuPricingEnabled = !!checked
  renderProductSkuMatrix()
}

function updateProductSkuRow(index, field, value) {
  if (!productSkuRows[index]) return
  productSkuRows[index][field] = value
}

function applySkuBulkValues() {
  if (!skuPricingEnabled) return
  buildProductSkuRowsFromOptions()
  const stockRaw = String(document.getElementById('skuBulkStock')?.value || '').trim()
  const priceRaw = String(document.getElementById('skuBulkPrice')?.value || '').trim()
  const originalRaw = String(document.getElementById('skuBulkOriginalPrice')?.value || '').trim()
  const skuPrefix = String(document.getElementById('skuBulkCodePrefix')?.value || '').trim()
  if (!stockRaw && !priceRaw && !originalRaw && !skuPrefix) {
    showAdminToast('Nhập ít nhất một giá trị để áp dụng', 'warning')
    return
  }
  productSkuRows = productSkuRows.map((row, index) => ({
    ...row,
    stock: stockRaw ? Math.max(0, parseInt(stockRaw, 10) || 0) : row.stock,
    price: priceRaw ? parseAdminMoneyInput(priceRaw) : row.price,
    original_price: originalRaw ? parseAdminMoneyInput(originalRaw) : row.original_price,
    sku_code: skuPrefix ? (skuPrefix + '-' + String(index + 1).padStart(2, '0')) : row.sku_code
  }))
  renderProductSkuMatrix()
  showAdminToast('Đã áp dụng giá trị cho tất cả SKU', 'success')
}

function refreshProductSkuMatrixIfEnabled() {
  if (skuPricingEnabled) renderProductSkuMatrix()
}

function collectProductSkuRows() {
  if (!skuPricingEnabled) return []
  buildProductSkuRowsFromOptions()
  return productSkuRows.map((row) => ({
    id: row.id || undefined,
    color: String(row.color || '').trim(),
    size: String(row.size || '').trim(),
    image: String(row.image || '').trim(),
    sku_code: String(row.sku_code || '').trim(),
    price: parseAdminMoneyInput(row.price),
    original_price: String(row.original_price ?? '').trim() ? parseAdminMoneyInput(row.original_price) : null,
    stock: Math.max(0, parseInt(row.stock || '0', 10) || 0),
    is_active: Number(row.is_active ?? 1) === 0 ? 0 : 1
  }))
}

function getSkuFallbackPricing(rows) {
  const activeRows = (Array.isArray(rows) ? rows : [])
    .filter((row) => Number(row?.is_active ?? 1) !== 0 && Number(row?.price || 0) > 0)
    .sort((a, b) => Number(a.price || 0) - Number(b.price || 0))
  const cheapest = activeRows[0] || null
  return {
    price: cheapest ? Number(cheapest.price || 0) : 0,
    originalPrice: cheapest && cheapest.original_price !== null && cheapest.original_price !== undefined && String(cheapest.original_price) !== ''
      ? Number(cheapest.original_price || 0)
      : null,
    stock: activeRows.reduce((sum, row) => sum + (parseInt(row.stock || '0', 10) || 0), 0)
  }
}

function fileToOptimizedDataURL(file, maxWidth = 1200, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('read_failed'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('decode_failed'))
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width)
        const width = Math.max(1, Math.round(img.width * scale))
        const height = Math.max(1, Math.round(img.height * scale))
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject(new Error('canvas_failed'))
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

// TAGS (Colors/Sizes)
function addTag(type) {
  const input = document.getElementById(type === 'size' ? 'sizeInput' : '')
  if (!input) return
  const val = input.value.trim()
  if (!val) return
  val.split(',').map(v => v.trim()).filter(v => v && !sizes.includes(v)).forEach(v => sizes.push(v))
  renderTags('size')
  refreshProductSkuMatrixIfEnabled()
  input.value = ''
}

function removeTag(type, val) {
  if (type !== 'size') return
  sizes = sizes.filter(s => s !== val)
  renderTags('size')
  refreshProductSkuMatrixIfEnabled()
}

function renderTags(type) {
  if (type !== 'size') return
  const container = document.getElementById('sizeTags')
  container.innerHTML = sizes.map(v => \`
    <span class="tag-item">\${v}<span class="tag-del" onclick="removeTag('size','\${v}')">×</span></span>
  \`).join('')
}

function renderColorOptionsEditor() {
  const wrap = document.getElementById('colorOptionsEditor')
  if (!wrap) return
  if (!colors.length) colors = [{ name: '', image: '' }]
  wrap.innerHTML = colors.map((color, idx) => \`
    <div class="grid grid-cols-[78px_1fr_auto] gap-3 items-start">
      <div class="img-slot group relative w-[78px] h-[78px] flex items-center justify-center cursor-pointer select-none overflow-hidden"
        ondragover="handleColorImageDragOver(event)"
        ondragleave="handleColorImageDragLeave(event)"
        ondrop="handleColorImageDrop(event, \${idx})">
        <img src="\${color.image || ''}" alt="" class="w-full h-full object-cover rounded-xl \${color.image ? '' : 'hidden'}" id="colorImg-\${idx}">
        <div class="text-[11px] text-gray-400 text-center px-2 leading-tight \${color.image ? 'hidden' : ''}" id="colorPlaceholder-\${idx}">
          Bấm hoặc kéo ảnh
        </div>
        <input type="file" accept="image/*" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" id="colorFile-\${idx}" onchange="handleColorImageFile(\${idx}, this)">
        <div class="\${color.image ? 'absolute inset-0 hidden group-hover:flex items-center justify-center bg-black/45 text-white transition z-20' : 'hidden'}" id="colorOverlay-\${idx}">
          <button type="button" onclick="event.preventDefault();event.stopPropagation();removeColorImage(\${idx})" class="w-8 h-8 rounded-full bg-black/35 hover:bg-red-500 flex items-center justify-center z-30">
            <i class="fas fa-trash text-xs"></i>
          </button>
        </div>
      </div>
      <input type="text" value="\${String(color.name || '').replace(/"/g, '&quot;')}" placeholder="Nhập màu (VD: Đen, Navy...)" class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400" oninput="updateColorName(\${idx}, this.value)">
      <button type="button" onclick="removeColorOptionRow(\${idx})" class="w-9 h-9 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 mt-1">
        <i class="fas fa-trash text-xs"></i>
      </button>
    </div>
  \`).join('')
}

function addColorOptionRow() {
  colors.push({ name: '', image: '' })
  renderColorOptionsEditor()
  refreshProductSkuMatrixIfEnabled()
}

function removeColorOptionRow(idx) {
  if (colors.length <= 1) {
    colors = [{ name: '', image: '' }]
  } else {
    colors.splice(idx, 1)
  }
  renderColorOptionsEditor()
  refreshProductSkuMatrixIfEnabled()
}

function updateColorName(idx, value) {
  if (!colors[idx]) return
  const oldName = String(colors[idx].name || '').trim()
  const nextName = String(value || '')
  colors[idx].name = String(value || '')
  if (oldName !== nextName.trim()) {
    productSkuRows = productSkuRows.map((row) => (
      String(row.color || '').trim().toLowerCase() === oldName.toLowerCase()
        ? { ...row, color: nextName.trim() }
        : row
    ))
  }
  refreshProductSkuMatrixIfEnabled()
}

function removeColorImage(idx) {
  if (!colors[idx]) return
  colors[idx].image = ''
  renderColorOptionsEditor()
  refreshProductSkuMatrixIfEnabled()
}

function handleColorImageDragOver(event) {
  event.preventDefault()
  event.currentTarget.classList.add('drag-over')
}

function handleColorImageDragLeave(event) {
  event.currentTarget.classList.remove('drag-over')
}

async function handleColorImageDrop(event, idx) {
  event.preventDefault()
  event.currentTarget.classList.remove('drag-over')
  const file = Array.from(event.dataTransfer?.files || []).find((f) => f.type && f.type.startsWith('image/'))
  if (!file) return
  await applyColorImageFile(idx, file)
}

async function handleColorImageFile(idx, input) {
  const file = Array.from(input.files || []).find((f) => f.type && f.type.startsWith('image/'))
  if (!file) return
  await applyColorImageFile(idx, file)
  input.value = ''
}

async function applyColorImageFile(idx, file) {
  try {
    if (!colors[idx]) return
    colors[idx].image = await uploadProductImageFile(file, 500, 0.85, 'product-colors')
    renderColorOptionsEditor()
    refreshProductSkuMatrixIfEnabled()
  } catch (_) {
    showAdminToast('Không thể xử lý ảnh màu', 'error')
  }
}

function addPresetSizes(arr) {
  arr.forEach(s => { if (!sizes.includes(s)) sizes.push(s) })
  renderTags('size')
  refreshProductSkuMatrixIfEnabled()
}

async function ensureAdminReviewProductsLoaded() {
  if (Array.isArray(adminProducts) && adminProducts.length) return adminProducts
  const res = await axios.get('/api/admin/products')
  adminProducts = Array.isArray(res.data?.data) ? res.data.data : []
  return adminProducts
}

function populateAdminReviewProductOptions(selectedId = '') {
  const select = document.getElementById('adminReviewProductId')
  const filter = document.getElementById('adminReviewProductFilter')
  const options = Array.isArray(adminProducts) ? adminProducts : []
  const optionsHtml = ['<option value="">Tất cả sản phẩm</option>'].concat(options.map((p) => {
    return '<option value="' + p.id + '">' + String(p.name || 'Sản phẩm #' + p.id) + '</option>'
  })).join('')
  if (filter) {
    const current = String(filter.value || '')
    filter.innerHTML = optionsHtml
    filter.value = current
  }
  if (select) {
    select.innerHTML = '<option value="">Chọn sản phẩm</option>' + options.map((p) => {
      return '<option value="' + p.id + '">' + String(p.name || 'Sản phẩm #' + p.id) + '</option>'
    }).join('')
    if (selectedId) select.value = String(selectedId)
  }
}

function renderAdminReviewImagePreviews() {
  const wrap = document.getElementById('adminReviewImagePreviews')
  if (!wrap) return
  wrap.innerHTML = adminReviewFormImages.map((src, idx) => {
    return '<div class="relative w-20 h-20 rounded-xl overflow-hidden border bg-gray-50">'
      + '<img src="' + src + '" alt="" class="w-full h-full object-cover">'
      + '<button type="button" onclick="removeAdminReviewImage(' + idx + ')" class="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white text-xs flex items-center justify-center">×</button>'
      + '</div>'
  }).join('')
}

function resetAdminReviewForm() {
  adminReviewFormImages = []
  document.getElementById('adminReviewId').value = ''
  document.getElementById('adminReviewProductId').value = ''
  document.getElementById('adminReviewReviewerName').value = ''
  document.getElementById('adminReviewReviewerAvatar').value = ''
  document.getElementById('adminReviewOrderId').value = ''
  document.getElementById('adminReviewRating').value = '5'
  document.getElementById('adminReviewComment').value = ''
  document.getElementById('adminReviewImageUrl').value = ''
  document.getElementById('adminReviewImagesInput').value = ''
  document.getElementById('reviewAdminModalTitle').textContent = 'Thêm đánh giá'
  document.getElementById('adminReviewSaveText').textContent = 'Lưu đánh giá'
  renderAdminReviewImagePreviews()
}

async function openAdminReviewModal(id) {
  await ensureAdminReviewProductsLoaded()
  populateAdminReviewProductOptions('')
  resetAdminReviewForm()
  if (id) {
    const review = Array.isArray(adminReviews) ? adminReviews.find((item) => Number(item.id) === Number(id)) : null
    if (review) {
      document.getElementById('adminReviewId').value = String(review.id || '')
      document.getElementById('adminReviewProductId').value = String(review.product_id || '')
      document.getElementById('adminReviewReviewerName').value = String(review.user_name || '')
      document.getElementById('adminReviewReviewerAvatar').value = String(review.user_avatar || '')
      document.getElementById('adminReviewOrderId').value = review.order_id ? String(review.order_id) : ''
      document.getElementById('adminReviewRating').value = String(review.rating || 5)
      document.getElementById('adminReviewComment').value = String(review.comment || '')
      adminReviewFormImages = Array.isArray(review.images) ? review.images.slice(0, 3) : []
      document.getElementById('reviewAdminModalTitle').textContent = 'Sửa đánh giá'
      document.getElementById('adminReviewSaveText').textContent = 'Cập nhật đánh giá'
      renderAdminReviewImagePreviews()
    }
  }
  showAdminOverlay(document.getElementById('reviewAdminModal'))
}

function closeAdminReviewModal() {
  forceHideAdminOverlay(document.getElementById('reviewAdminModal'))
}

async function handleAdminReviewImages(input) {
  const files = Array.from(input.files || []).filter((file) => file.type && file.type.startsWith('image/'))
  for (const file of files) {
    if (adminReviewFormImages.length >= 3) break
    try {
      const dataUrl = await fileToOptimizedDataURL(file, 900, 0.8)
      adminReviewFormImages.push(dataUrl)
    } catch (_) {
      showAdminToast('Không thể xử lý ảnh đánh giá', 'error')
    }
  }
  renderAdminReviewImagePreviews()
  input.value = ''
}

function addAdminReviewImageUrl() {
  const input = document.getElementById('adminReviewImageUrl')
  const value = String(input?.value || '').trim()
  if (!value) return
  if (adminReviewFormImages.length >= 3) {
    showAdminToast('Tối đa 3 ảnh cho mỗi đánh giá', 'warning')
    return
  }
  adminReviewFormImages.push(value)
  input.value = ''
  renderAdminReviewImagePreviews()
}

function removeAdminReviewImage(idx) {
  adminReviewFormImages.splice(idx, 1)
  renderAdminReviewImagePreviews()
}

function isAdminReviewImageSource(value, allowDataImage = true) {
  const raw = String(value || '').trim()
  if (!raw) return true
  if (allowDataImage && /^data:image\\/(png|jpe?g|webp|gif);base64,/i.test(raw)) return true
  try {
    const parsed = new URL(raw, window.location.origin)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch (_) {
    return false
  }
}

function getAdminReviewSaveErrorMessage(errorCode) {
  const code = String(errorCode || '').trim()
  const map = {
    INVALID_BODY: 'Dữ liệu đánh giá không hợp lệ',
    MISSING_PRODUCT_ID: 'Vui lòng chọn sản phẩm',
    PRODUCT_NOT_FOUND: 'Sản phẩm đã chọn không tồn tại',
    MISSING_REVIEWER_NAME: 'Vui lòng nhập tên người đánh giá',
    INVALID_RATING: 'Vui lòng chọn số sao hợp lệ',
    INVALID_IMAGE_FORMAT: 'Ảnh đánh giá phải là URL hoặc ảnh hợp lệ',
    IMAGE_TOO_LARGE: 'Ảnh đánh giá quá lớn, vui lòng chọn ảnh nhỏ hơn',
    ORDER_NOT_FOUND: 'Không tìm thấy đơn hàng đã nhập',
    ORDER_NOT_ELIGIBLE: 'Chỉ gắn đánh giá với đơn đã hoàn thành',
    ORDER_PRODUCT_MISMATCH: 'Đơn hàng không khớp với sản phẩm đã chọn',
    ALREADY_REVIEWED: 'Đơn hàng này đã có đánh giá',
    REVIEW_NOT_FOUND: 'Không tìm thấy đánh giá cần cập nhật',
    UNAUTHORIZED: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại',
  }
  return map[code] || code || 'Không lưu được đánh giá'
}

async function saveAdminReview(e) {
  e.preventDefault()
  const id = String(document.getElementById('adminReviewId').value || '').trim()
  const pendingImageUrl = String(document.getElementById('adminReviewImageUrl')?.value || '').trim()
  const payload = {
    product_id: Number(document.getElementById('adminReviewProductId').value || 0),
    reviewer_name: String(document.getElementById('adminReviewReviewerName').value || '').trim(),
    reviewer_avatar: String(document.getElementById('adminReviewReviewerAvatar').value || '').trim(),
    order_id: Number(document.getElementById('adminReviewOrderId').value || 0) || null,
    rating: Number(document.getElementById('adminReviewRating').value || 5),
    comment: String(document.getElementById('adminReviewComment').value || '').trim(),
    images: adminReviewFormImages.slice(0, 3),
  }
  if (!payload.product_id) { showAdminToast('Vui lòng chọn sản phẩm', 'error'); return }
  if (!payload.reviewer_name) { showAdminToast('Vui lòng nhập tên người đánh giá', 'error'); return }
  if (payload.rating < 1 || payload.rating > 5) { showAdminToast('Vui lòng chọn số sao hợp lệ', 'error'); return }
  if (payload.reviewer_avatar && !isAdminReviewImageSource(payload.reviewer_avatar, true)) {
    showAdminToast('Ảnh đại diện phải là URL hợp lệ', 'error')
    return
  }
  if (pendingImageUrl) {
    if (!isAdminReviewImageSource(pendingImageUrl, false)) {
      showAdminToast('URL ảnh đánh giá không hợp lệ', 'error')
      return
    }
    if (adminReviewFormImages.length >= 3) {
      showAdminToast('Tối đa 3 ảnh cho mỗi đánh giá', 'warning')
      return
    }
    adminReviewFormImages.push(pendingImageUrl)
    document.getElementById('adminReviewImageUrl').value = ''
    renderAdminReviewImagePreviews()
    payload.images = adminReviewFormImages.slice(0, 3)
  }
  if (payload.images.some((src) => !isAdminReviewImageSource(src, true))) {
    showAdminToast('Ảnh đánh giá phải là URL hoặc ảnh hợp lệ', 'error')
    return
  }

  const btn = document.getElementById('adminReviewSaveBtn')
  btn.disabled = true
  try {
    const res = id
      ? await axios.patch('/api/admin/reviews/' + id, payload)
      : await axios.post('/api/admin/reviews', payload)
    if (res.data && res.data.success === false) {
      throw { response: { data: res.data } }
    }
    closeAdminReviewModal()
    await loadAdminReviews()
    showAdminToast(id ? 'Đã cập nhật đánh giá' : 'Đã thêm đánh giá', 'success')
  } catch (err) {
    showAdminToast(getAdminReviewSaveErrorMessage(err?.response?.data?.error || err?.message), 'error')
  } finally {
    btn.disabled = false
  }
}

async function deleteAdminReview(id) {
  if (!confirm('Xoá đánh giá này?')) return
  try {
    await axios.delete('/api/admin/reviews/' + id)
    await loadAdminReviews()
    showAdminToast('Đã xoá đánh giá', 'success')
  } catch (err) {
    showAdminToast(err.response?.data?.error || 'Không thể xoá đánh giá', 'error')
  }
}

async function loadAdminReviews() {
  const tbody = document.getElementById('adminReviewsTable')
  const empty = document.getElementById('adminReviewsEmpty')
  if (!tbody || !empty) return
  tbody.innerHTML = '<tr><td colspan="8" class="px-4 py-10 text-center text-gray-400"><i class="fas fa-spinner fa-spin text-2xl"></i></td></tr>'
  try {
    await ensureAdminReviewProductsLoaded()
    populateAdminReviewProductOptions('')
    const params = {
      query: String(document.getElementById('adminReviewSearch')?.value || '').trim(),
      product_id: String(document.getElementById('adminReviewProductFilter')?.value || '').trim(),
      rating: String(document.getElementById('adminReviewRatingFilter')?.value || '').trim(),
      has_images: document.getElementById('adminReviewHasImagesFilter')?.checked ? '1' : '',
    }
    const res = await axios.get('/api/admin/reviews', { params })
    adminReviews = Array.isArray(res.data?.data) ? res.data.data : []
    empty.classList.toggle('hidden', adminReviews.length > 0)
    tbody.innerHTML = adminReviews.map((review) => {
      const imageHtml = Array.isArray(review.images) && review.images.length
        ? '<div class="flex justify-center -space-x-2">' + review.images.slice(0, 3).map((img) => '<img src="' + img + '" alt="" class="w-8 h-8 rounded-lg object-cover border-2 border-white bg-gray-100">').join('') + '</div>'
        : '<span class="text-gray-300">-</span>'
      const sourceHtml = review.created_by_admin
        ? '<span class="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold">Admin thêm</span>'
        : '<span class="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">Khách thật</span>'
      const stars = '★'.repeat(Number(review.rating || 0)) + '☆'.repeat(5 - Number(review.rating || 0))
      const comment = String(review.comment || '').trim()
      return '<tr class="border-b last:border-b-0 align-top">'
        + '<td class="px-4 py-3"><div class="flex items-start gap-3"><img src="' + String(review.product_thumbnail || '') + '" alt="" class="w-12 h-12 rounded-xl object-cover bg-gray-100"><div><p class="font-semibold text-gray-800 leading-snug">' + String(review.product_name || 'Sản phẩm') + '</p><p class="text-xs text-gray-400 mt-1">#' + review.product_id + '</p></div></div></td>'
        + '<td class="px-4 py-3"><div><p class="font-semibold text-gray-800">' + String(review.user_name || 'Khách hàng') + '</p><p class="text-xs text-gray-400 mt-1">' + (review.order_code ? ('Đơn ' + review.order_code) : 'Review thủ công') + '</p></div></td>'
        + '<td class="px-4 py-3 text-center font-semibold text-amber-500">' + stars + '</td>'
        + '<td class="px-4 py-3 text-gray-600 max-w-[320px]"><p class="line-clamp-3">' + (comment || '<span class="text-gray-300">Không có nội dung</span>') + '</p></td>'
        + '<td class="px-4 py-3 text-center">' + sourceHtml + '</td>'
        + '<td class="px-4 py-3 text-center">' + imageHtml + '</td>'
        + '<td class="px-4 py-3 text-center text-xs text-gray-500 whitespace-nowrap">' + formatDateTimeVi(review.created_at) + '</td>'
        + '<td class="px-4 py-3"><div class="flex items-center justify-center gap-2"><button onclick="openAdminReviewModal(' + review.id + ')" class="w-9 h-9 rounded-xl border border-gray-200 text-gray-600 hover:border-pink-300 hover:text-pink-600 transition"><i class="fas fa-pen"></i></button><button onclick="deleteAdminReview(' + review.id + ')" class="w-9 h-9 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition"><i class="fas fa-trash"></i></button></div></td>'
        + '</tr>'
    }).join('')
    if (!adminReviews.length) tbody.innerHTML = ''
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="8" class="px-4 py-10 text-center text-red-400">Lỗi tải danh sách đánh giá</td></tr>'
    showAdminToast(err.response?.data?.error || 'Không tải được đánh giá', 'error')
  }
}

async function loadVouchers() {
  const list = document.getElementById('voucherList')
  if (!list) return
  list.innerHTML = '<div class="text-center py-8 text-gray-400"><i class="fas fa-spinner fa-spin text-2xl"></i></div>'
  try {
    loadAutoVouchers()
    syncAutoVoucherScopeUI()
    const res = await axios.get('/api/admin/vouchers')
    const vouchers = res.data.data || []
    if (!vouchers.length) {
      list.innerHTML = '<div class="text-center py-8 text-gray-400"><i class="fas fa-ticket-alt text-4xl mb-2"></i><p>Chưa có mã khuyến mãi nào</p></div>'
      return
    }
    list.innerHTML = vouchers.map(v => {
      const now = new Date()
      const from = new Date(v.valid_from)
      const to = new Date(v.valid_to)
      const expired = to < now
      const notStarted = from > now
      const isValid = !expired && !notStarted && v.is_active
      return \`
      <div class="border rounded-2xl p-4 \${!v.is_active ? 'opacity-50 bg-gray-50' : isValid ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' : 'bg-gray-50 border-gray-200'}">
        <div class="flex items-start justify-between gap-2 mb-2">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="font-mono font-bold text-lg tracking-widest \${isValid ? 'text-green-700' : 'text-gray-500'}">\${v.code}</span>
            <span class="text-xs px-2 py-0.5 rounded-full font-medium \${isValid ? 'bg-green-100 text-green-700' : expired ? 'bg-gray-100 text-gray-500' : notStarted ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}">
              \${isValid ? '<i class="fas fa-circle-check mr-1"></i>Hiệu lực' : expired ? '<i class="fas fa-clock mr-1"></i>Hết hạn' : notStarted ? '<i class="fas fa-hourglass-start mr-1"></i>Chưa bắt đầu' : '<i class="fas fa-ban mr-1"></i>Tắt'}
            </span>
          </div>
          <div class="flex gap-1 shrink-0">
            <button onclick="toggleVoucher(\${v.id})" class="p-1.5 rounded-lg text-xs \${v.is_active ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-green-50 text-green-600 hover:bg-green-100'} transition" title="\${v.is_active ? 'Tắt' : 'Bật'}">
              <i class="fas fa-\${v.is_active ? 'toggle-off' : 'toggle-on'}"></i>
            </button>
            <button onclick="deleteVoucher(\${v.id})" class="p-1.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg text-xs transition" title="Xóa">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
        <div class="flex items-center gap-3 flex-wrap text-sm">
          <span class="font-bold text-pink-600 text-base">-\${fmtPrice(v.discount_amount)}</span>
          <span class="text-gray-400">|</span>
          <span class="text-gray-500 text-xs">
            <i class="fas fa-calendar text-gray-400 mr-1"></i>
            \${new Date(v.valid_from).toLocaleDateString('vi-VN')} -> \${new Date(v.valid_to).toLocaleDateString('vi-VN')}
          </span>
        </div>
        <div class="flex gap-3 mt-1.5 text-xs text-gray-500">
          <span><i class="fas fa-users mr-1 text-gray-400"></i>Đã dùng: <strong>\${v.used_count}</strong>\${v.usage_limit > 0 ? '/'+v.usage_limit : ' (không giới hạn)'}</span>
        </div>
      </div>\`
    }).join('')
  } catch(e) {
    list.innerHTML = '<div class="text-center text-red-400 py-8">Lỗi tải dữ liệu</div>'
  }
}

async function createVoucher(e) {
  e.preventDefault()
  const btn = document.getElementById('createVoucherBtn')
  btn.disabled = true
  btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Äang táº¡o...'
  try {
    const res = await axios.post('/api/admin/vouchers', {
      discount_amount: document.getElementById('vDiscount').value,
      valid_from: new Date(document.getElementById('vFrom').value).toISOString(),
      valid_to: new Date(document.getElementById('vTo').value).toISOString(),
      usage_limit: document.getElementById('vLimit').value || 0,
      custom_code: document.getElementById('vCode').value || ''
    })
    const code = res.data.code
    document.getElementById('generatedCode').classList.remove('hidden')
    document.getElementById('generatedCodeText').textContent = code
    showAdminToast('Tạo mã khuyến mãi ' + code + ' thành công!', 'success')
    e.target.reset()
    loadVouchers()
  } catch(err) {
    showAdminToast('Lỗi tạo mã khuyến mãi: ' + (err.response?.data?.error || 'Unknown'), 'error')
  } finally {
    btn.disabled = false
    btn.innerHTML = '<i class="fas fa-magic mr-2"></i>Tạo mã khuyến mãi'
  }
}

async function toggleVoucher(id) {
  try {
    await axios.patch('/api/admin/vouchers/' + id + '/toggle')
    loadVouchers()
    showAdminToast('Đã cập nhật trạng thái mã khuyến mãi', 'success')
  } catch(e) { showAdminToast('Lỗi', 'error') }
}

async function deleteVoucher(id) {
  if (!confirm('Xóa mã khuyến mãi này?')) return
  try {
    await axios.delete('/api/admin/vouchers/' + id)
    loadVouchers()
    showAdminToast('Đã xóa mã khuyến mãi', 'success')
  } catch(e) { showAdminToast('Lỗi xóa', 'error') }
}

function getAutoVoucherSelectedProductIds() {
  return Array.from(document.querySelectorAll('.auto-voucher-product-check:checked'))
    .map((el) => Number(el.value || 0))
    .filter((id) => Number.isFinite(id) && id > 0)
}

function syncAutoVoucherScopeUI() {
  const scope = document.getElementById('autoVoucherScope')?.value || 'all'
  const wrap = document.getElementById('autoVoucherProductsWrap')
  if (wrap) wrap.classList.toggle('hidden', scope !== 'products')
  if (scope === 'products') loadAutoVoucherProductOptions()
}

async function loadAutoVoucherProductOptions(selectedIds) {
  const wrap = document.getElementById('autoVoucherProducts')
  if (!wrap) return
  const selected = new Set((Array.isArray(selectedIds) ? selectedIds : getAutoVoucherSelectedProductIds()).map((id) => Number(id)))
  wrap.innerHTML = '<div class="text-center text-gray-400 py-6 text-sm"><i class="fas fa-spinner fa-spin mr-1"></i>Đang tải sản phẩm...</div>'
  try {
    if (!Array.isArray(adminProducts) || !adminProducts.length) {
      const res = await axios.get('/api/admin/products')
      adminProducts = Array.isArray(res.data?.data) ? res.data.data : []
    }
    const products = (adminProducts || []).filter(Boolean)
    if (!products.length) {
      wrap.innerHTML = '<div class="text-center text-gray-400 py-6 text-sm">Chưa có sản phẩm.</div>'
      return
    }
    wrap.innerHTML = products.map((p) => {
      const id = Number(p.id || 0)
      const checked = selected.has(id) ? 'checked' : ''
      const thumb = String(p.thumbnail || '').trim() || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200'
      return '<label class="flex items-center gap-3 rounded-xl bg-white border px-3 py-2 cursor-pointer hover:border-pink-200">'
        + '<input type="checkbox" class="auto-voucher-product-check w-4 h-4 rounded border-gray-300 text-pink-500 focus:ring-pink-400" value="' + id + '" ' + checked + '>'
        + '<img src="' + escapeDashboardHtml(thumb) + '" alt="" class="w-10 h-10 rounded-lg object-cover bg-gray-100" onerror="this.src=&quot;https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&quot;">'
        + '<span class="text-sm font-semibold text-gray-700 line-clamp-1">' + escapeDashboardHtml(p.name || ('Sản phẩm #' + id)) + '</span>'
        + '<span class="ml-auto text-xs font-bold text-pink-500">' + fmtPrice(p.price || 0) + '</span>'
      + '</label>'
    }).join('')
  } catch (e) {
    wrap.innerHTML = '<div class="text-center text-red-400 py-6 text-sm">Không tải được sản phẩm</div>'
  }
}

function renderAutoVoucherScope(v) {
  const scope = String(v.scope || 'all')
  const ids = Array.isArray(v.product_ids) ? v.product_ids : []
  if (scope === 'products') return ids.length + ' sản phẩm'
  return 'Toàn bộ cửa hàng'
}

async function loadAutoVouchers() {
  const list = document.getElementById('autoVoucherList')
  if (!list) return
  list.innerHTML = '<div class="text-center py-8 text-gray-400"><i class="fas fa-spinner fa-spin text-2xl"></i></div>'
  try {
    const res = await axios.get('/api/admin/auto-vouchers')
    const vouchers = Array.isArray(res.data?.data) ? res.data.data : []
    if (!vouchers.length) {
      list.innerHTML = '<div class="text-center py-8 text-gray-400"><i class="fas fa-tags text-4xl mb-2"></i><p>Chưa có voucher tự động nào</p></div>'
      return
    }
    list.innerHTML = vouchers.map((v) => {
      const now = new Date()
      const from = new Date(v.valid_from)
      const to = new Date(v.valid_to)
      const expired = Number.isFinite(to.getTime()) && to < now
      const notStarted = Number.isFinite(from.getTime()) && from > now
      const isValid = !expired && !notStarted && Number(v.is_active || 0) === 1
      return '<div class="border rounded-2xl p-4 ' + (!v.is_active ? 'opacity-50 bg-gray-50' : isValid ? 'bg-gradient-to-r from-pink-50 to-fuchsia-50 border-pink-200' : 'bg-gray-50 border-gray-200') + '">'
        + '<div class="flex items-start justify-between gap-2 mb-2">'
        + '<div class="min-w-0"><p class="font-bold text-gray-800 line-clamp-1">' + escapeDashboardHtml(v.name || 'Voucher tự động') + '</p>'
        + '<p class="text-xs text-gray-500 mt-1"><i class="fas fa-layer-group mr-1"></i>' + escapeDashboardHtml(renderAutoVoucherScope(v)) + '</p></div>'
        + '<div class="flex gap-1 shrink-0">'
        + '<button onclick="toggleAutoVoucher(' + v.id + ')" class="p-1.5 rounded-lg text-xs ' + (v.is_active ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-green-50 text-green-600 hover:bg-green-100') + ' transition" title="' + (v.is_active ? 'Tắt' : 'Bật') + '"><i class="fas fa-' + (v.is_active ? 'toggle-off' : 'toggle-on') + '"></i></button>'
        + '<button onclick="deleteAutoVoucher(' + v.id + ')" class="p-1.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg text-xs transition" title="Xóa"><i class="fas fa-trash"></i></button>'
        + '</div></div>'
        + '<div class="flex items-center gap-3 flex-wrap text-sm">'
        + '<span class="font-bold text-pink-600 text-base">Giảm thêm ' + fmtPrice(v.discount_amount || 0) + '</span>'
        + '<span class="text-gray-400">|</span>'
        + '<span class="text-xs px-2 py-0.5 rounded-full font-semibold ' + (Number(v.show_badge ?? 1) === 1 ? 'bg-pink-100 text-pink-700' : 'bg-gray-100 text-gray-500') + '"><i class="fas fa-ticket mr-1"></i>' + (Number(v.show_badge ?? 1) === 1 ? 'Hiện badge' : 'Ẩn badge') + '</span>'
        + '<span class="text-gray-400">|</span>'
        + '<span class="text-gray-500 text-xs"><i class="fas fa-calendar text-gray-400 mr-1"></i>' + new Date(v.valid_from).toLocaleDateString('vi-VN') + ' -> ' + new Date(v.valid_to).toLocaleDateString('vi-VN') + '</span>'
        + '</div>'
        + '<div class="mt-2"><span class="text-xs px-2 py-0.5 rounded-full font-medium ' + (isValid ? 'bg-green-100 text-green-700' : expired ? 'bg-gray-100 text-gray-500' : notStarted ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600') + '">' + (isValid ? 'Đang áp dụng' : expired ? 'Hết hạn' : notStarted ? 'Chưa bắt đầu' : 'Đang tắt') + '</span></div>'
      + '</div>'
    }).join('')
  } catch (e) {
    list.innerHTML = '<div class="text-center text-red-400 py-8">Lỗi tải dữ liệu</div>'
  }
}

async function createAutoVoucher(e) {
  e.preventDefault()
  const btn = document.getElementById('createAutoVoucherBtn')
  const scope = document.getElementById('autoVoucherScope')?.value || 'all'
  const productIds = scope === 'products' ? getAutoVoucherSelectedProductIds() : []
  if (scope === 'products' && !productIds.length) {
    showAdminToast('Vui lòng chọn ít nhất 1 sản phẩm', 'error')
    return
  }
  btn.disabled = true
  btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Đang tạo...'
  try {
    await axios.post('/api/admin/auto-vouchers', {
      name: document.getElementById('autoVoucherName').value,
      discount_amount: document.getElementById('autoVoucherDiscount').value,
      scope,
      product_ids: productIds,
      valid_from: new Date(document.getElementById('autoVoucherFrom').value).toISOString(),
      valid_to: new Date(document.getElementById('autoVoucherTo').value).toISOString(),
      show_badge: document.getElementById('autoVoucherShowBadge')?.checked ? 1 : 0,
      is_active: document.getElementById('autoVoucherActive')?.checked ? 1 : 0
    })
    showAdminToast('Đã tạo voucher tự động', 'success')
    e.target.reset()
    document.getElementById('autoVoucherActive').checked = true
    document.getElementById('autoVoucherShowBadge').checked = true
    syncAutoVoucherScopeUI()
    loadAutoVouchers()
  } catch (err) {
    showAdminToast(err.response?.data?.error || 'Lỗi tạo voucher tự động', 'error')
  } finally {
    btn.disabled = false
    btn.innerHTML = '<i class="fas fa-tags mr-2"></i>Tạo voucher tự động'
  }
}

async function toggleAutoVoucher(id) {
  try {
    await axios.patch('/api/admin/auto-vouchers/' + id + '/toggle')
    loadAutoVouchers()
    showAdminToast('Đã cập nhật trạng thái voucher tự động', 'success')
  } catch (e) {
    showAdminToast('Lỗi cập nhật voucher tự động', 'error')
  }
}

async function deleteAutoVoucher(id) {
  if (!confirm('Xóa voucher tự động này?')) return
  try {
    await axios.delete('/api/admin/auto-vouchers/' + id)
    loadAutoVouchers()
    showAdminToast('Đã xóa voucher tự động', 'success')
  } catch (e) {
    showAdminToast('Lỗi xóa voucher tự động', 'error')
  }
}

function copyCode() {
  const code = document.getElementById('generatedCodeText').textContent
  navigator.clipboard.writeText(code).then(() => showAdminToast('Đã sao chép: ' + code, 'success'))
}

// UTILS
function fmtPrice(p) { return new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND'}).format(p||0) }
function formatDateTimeVi(value) {
  if (!value) return '-'
  const parsed = new Date(String(value).trim().replace(' ', 'T'))
  if (!Number.isFinite(parsed.getTime())) return String(value)
  return parsed.toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
function getOrderAmountDue(order) {
  if (order && order.amount_due !== undefined && order.amount_due !== null) {
    return Number(order.amount_due || 0)
  }
  return String(order?.payment_status || '').toLowerCase() === 'paid'
    ? 0
    : Number(order?.total_price || 0)
}
function paymentStatusLabel(v) {
  return String(v || '').toLowerCase() === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'
}
function paymentStatusClass(v) {
  return String(v || '').toLowerCase() === 'paid'
    ? 'bg-green-100 text-green-700 border border-green-200'
    : 'bg-amber-100 text-amber-700 border border-amber-200'
}
function formatPaymentMethod(v) {
  const key = String(v || '').toUpperCase()
  if (key === 'BANK_TRANSFER') return 'Chuyển khoản ngân hàng'
  if (key === 'MOMO') return 'Ví điện tử MoMo'
  if (key === 'ZALOPAY') return 'ZaloPay'
  return 'COD - Thanh toán khi giao'
}
function paymentMethodTagHTML(method, paymentStatus) {
  const key = String(method || '').toUpperCase()
  const paid = String(paymentStatus || '').toLowerCase() === 'paid'
  const paidMark = paid ? '<i class="fas fa-check-circle text-green-600"></i>' : ''
  if (key === 'BANK_TRANSFER') {
    return '<span class="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200"><i class="fas fa-university"></i>CK ngân hàng ' + paidMark + '</span>'
  }
  if (key === 'MOMO') {
    return '<span class="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-pink-50 text-pink-700 border border-pink-200"><i class="fas fa-wallet"></i>MoMo ' + paidMark + '</span>'
  }
  if (key === 'ZALOPAY') {
    return '<span class="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200"><i class="fas fa-mobile-alt"></i>ZaloPay ' + paidMark + '</span>'
  }
  return '<span class="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200"><i class="fas fa-money-bill-wave"></i>COD</span>'
}
function displayCustomerName(name) {
  let n = String(name || '').trim()
  while (n.indexOf('  ') >= 0) n = n.replace('  ', ' ')
  if (/^Trần\s+Công\s+Hiếu[a-z]$/i.test(n)) return 'Trần Công Hiếu'
  if (n.toLowerCase().endsWith("'s")) n = n.slice(0, -2)
  return n
}
function isInternalTestOrder(o) {
  const customerName = String(o?.customer_name || '').trim().toLowerCase()
  const note = String(o?.note || '').trim().toLowerCase()
  return customerName === 'local script test' || note.indexOf('test:payos-local') >= 0 || note.indexOf('test:zalopay-local') >= 0
}

function getTrackingDisplayCode(fullCode) {
  const full = String(fullCode || '').trim()
  if (!full) return ''
  const parts = full.split('.').map((p) => String(p || '').trim()).filter(Boolean)
  if (parts.length >= 2 && parts[1]) return parts[1]
  return full
}

async function copyTextValue(value, successMessage) {
  const full = String(value || '').trim()
  if (!full) return false
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(full)
    } else {
      const ta = document.createElement('textarea')
      ta.value = full
      ta.setAttribute('readonly', '')
      ta.style.position = 'fixed'
      ta.style.left = '-9999px'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    showAdminToast(successMessage || 'Đã copy', 'success')
    return true
  } catch (_) {
    showAdminToast('Không thể copy', 'error')
    return false
  }
}

async function copyTrackingCode(fullCode) {
  await copyTextValue(fullCode, 'Đã copy mã vận đơn đầy đủ')
}

async function copyPhoneNumber(phone) {
  await copyTextValue(phone, 'Đã copy số điện thoại')
}

async function copyOrderCode(orderCode) {
  await copyTextValue(orderCode, 'Đã copy mã đơn hàng')
}
function safeJson(v) { try { return JSON.parse(v||'[]') } catch { return [] } }
function catLabel(c) { return {unisex:'Unisex',male:'Nam',female:'Nữ'}[c]||c }
function statusLabel(s) { return {pending:'Chờ xử lý',confirmed:'Xác nhận',shipping:'Đang giao',done:'Hoàn thành',cancelled:'Đã hủy',delivery_failed:'Bom / trả về'}[s]||s }

function showAdminToast(msg, type='success') {
  const c = document.getElementById('adminToast')
  const t = document.createElement('div')
  t.className = \`toast-admin flex items-center gap-2 px-5 py-3 rounded-2xl shadow-xl text-white text-sm font-medium pointer-events-auto \${type==='error'?'bg-red-500':type==='warning'?'bg-amber-500':'bg-green-500'}\`
  t.innerHTML = \`<i class="fas fa-\${type==='error'?'exclamation-circle':type==='warning'?'exclamation-triangle':'check-circle'}"></i>\${msg}\`
  c.appendChild(t)
  setTimeout(() => { t.style.opacity='0'; t.style.transform='translateX(100%)'; t.style.transition='all 0.3s'; setTimeout(()=>t.remove(),300) }, 3000)
}

`
}

export function adminBootstrapScript(): string {
  return `// ESC key handler - close any open modal
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    const modals = ['productModal', 'orderDetailModal', 'arrangeSuccessModal', 'createFlashSaleModal', 'flashSaleProductPickerModal', 'dashboardCustomerModal']
    modals.forEach(id => {
      const el = document.getElementById(id)
      if (el) forceHideAdminOverlay(el)
    })
    closeFlashSaleCreateModal()
    closeFlashSaleProductPickerModal()
    closeChangeAdminPasswordModal()
    closeDashboardCustomerModal()
    closeAdminAvatarMenu()
    unlockAdminPageScroll()
    closeMobileSidebar()
  }
})

document.addEventListener('DOMContentLoaded', function() {
  registerAdminPwa()
  ensureSettingsImagesNavItem()
  setDesktopSidebarCollapsed(false)
  initDashboardDateFilterDefaults()
  bindAdminOverlaySafetyObserver()
  bindAdminSidebarSwipeGestures()
  bindCollapsedSidebarTooltips()
  resetAdminTransientSurface('dom-ready-reset')
  syncOrdersHeaderSearchUI()
  syncDashboardDateFilterUI()
  window.addEventListener('resize', syncSidebarOverlay)
  window.addEventListener('resize', hideCollapsedSidebarTooltip)
  window.addEventListener('resize', syncOrdersHeaderSearchUI)
  window.addEventListener('resize', positionAdminAvatarMenu)
  window.addEventListener('resize', fitDashboardStatValues)
  window.addEventListener('resize', syncDashboardDateFilterUI)
  document.addEventListener('click', function(event) {
    const filter = document.getElementById('dashboardDateFilter')
    const path = typeof event.composedPath === 'function' ? event.composedPath() : []
    const clickedInsideFilter = filter && (filter.contains(event.target) || path.includes(filter))
    if (dashboardDatePickerOpen && filter && !clickedInsideFilter) closeDashboardDatePicker()
  })
  window.addEventListener('scroll', () => {
    if (adminAvatarMenuOpen) positionAdminAvatarMenu()
  }, true)
  window.addEventListener('load', () => resetAdminTransientSurface('load-reset'))
  window.addEventListener('pageshow', handleAdminPageShow)
  document.addEventListener('visibilitychange', function() {
    if (!document.hidden) normalizeAdminOverlayState({ preserveActiveModal: true, reason: 'visibilitychange' })
  })
  // NOTE: pageshow/focus/visibilitychange intentionally NOT hooked to scheduleAdminOverlaySanitize
  // because triggering sanitize on focus/visibility would force-close modals the user has open
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeOrdersHeaderSearch()
  })
  document.addEventListener('click', function(e) {
    const target = e.target
    if (!target) return
    const searchRoot = document.getElementById('ordersHeaderSearch')
    if (searchRoot && isOrdersPageActive() && ordersSearchExpanded && !searchRoot.contains(target)) closeOrdersHeaderSearch()
    const root = document.getElementById('adminAvatarMenuRoot')
    if (!root) return
    if (!root.contains(target)) closeAdminAvatarMenu()
  })
})

async function initAdminAuth() {
  resetAdminTransientSurface('auth-start-reset')
  try {
    const res = await axios.get('/api/admin/profile')
    if (!res.data?.success) {
      window.location.replace('/admin/login')
      return
    }
    adminProfile = res.data?.data || null
    await loadAdminUiSettings({ silent: true })
    applyAdminAvatarUI()
    ensureSettingsImagesNavItem()
    syncAdminPermissionUI()
  } catch (e) {
    window.location.replace('/admin/login')
    return
  }
  await loadAdminProfile()
  showPage('dashboard')
  initAdminOrderNotifications()
  if (typeof startLiveChatAdminInboxNotifications === 'function') startLiveChatAdminInboxNotifications()
  resetAdminTransientSurface('auth-ready-reset')
}

initAdminAuth()
`
}
