import { adminOrdersScript } from './script-orders'
import { adminFeaturedSettingsScript } from './script-featured-settings'
import { adminFlashSaleScript } from './script-flashsale'
export function adminInlineScript(): string {
  return `// â”€â”€ STATE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
let adminProducts = []
let adminOrders = []
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
let galleryImages = ['','','','','','','','','']
let editingId = null
let gallerySlotClickBound = false
let ghtkPickupAddresses = []
let adminProfile = null
let adminAvatarMenuOpen = false
let settingsSubmenuOpen = false
let settingsActiveSubPage = ''
let marketingSubmenuOpen = false
let marketingActiveSubPage = ''
let selectedColorImage = ''
const MAX_PRODUCT_PAYLOAD_SIZE = 1200000
const ADMIN_OVERLAY_IDS = ['productModal', 'orderDetailModal', 'arrangeSuccessModal', 'createFlashSaleModal', 'flashSaleProductPickerModal', 'adminChangePasswordModal']

function forceHideAdminOverlay(el) {
  if (!el) return
  el.classList.add('hidden')
  el.classList.remove('flex')
  el.style.display = 'none'
  el.style.pointerEvents = 'none'
}

// â”€â”€ NAVIGATION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

function applyAdminAvatarUI() {
  const rawAvatar = String(adminProfile?.avatar || '').trim()
  const lowerAvatar = rawAvatar.toLowerCase()
  const avatar = ['null', 'undefined', 'none'].includes(lowerAvatar) ? '' : rawAvatar
  const name = String(adminProfile?.name || 'QH Clothes').trim() || 'QH Clothes'
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

async function loadAdminProfile() {
  try {
    const res = await axios.get('/api/admin/profile')
    adminProfile = res.data?.data || null
    applyAdminAvatarUI()
  } catch (_) {
    // keep default avatar fallback
  }
}

function closeAdminAvatarMenu() {
  adminAvatarMenuOpen = false
  const menu = document.getElementById('adminAvatarDropdown')
  if (menu) menu.classList.add('hidden')
}

function toggleAdminAvatarMenu() {
  adminAvatarMenuOpen = !adminAvatarMenuOpen
  const menu = document.getElementById('adminAvatarDropdown')
  if (menu) menu.classList.toggle('hidden', !adminAvatarMenuOpen)
}

function sanitizeAdminOverlayState() {
  ADMIN_OVERLAY_IDS.forEach((id) => {
    const el = document.getElementById(id)
    forceHideAdminOverlay(el)
  })
  closeChangeAdminPasswordModal()
  closeAdminAvatarMenu()
  const sidebarOverlay = document.getElementById('sidebarOverlay')
  if (sidebarOverlay) {
    sidebarOverlay.style.display = 'none'
    sidebarOverlay.style.pointerEvents = 'none'
    sidebarOverlay.classList.add('hidden')
  }
  syncSidebarOverlay()
  document.body.style.overflow = ''
  document.body.style.pointerEvents = ''
  debugAdminOverlayState('sanitize')
}

function scheduleAdminOverlaySanitize() {
  sanitizeAdminOverlayState()
  requestAnimationFrame(() => {
    sanitizeAdminOverlayState()
    setTimeout(sanitizeAdminOverlayState, 0)
  })
}

function openChangeAdminPasswordModal() {
  const modal = document.getElementById('adminChangePasswordModal')
  if (modal) modal.style.display = 'flex'
  const oldInput = document.getElementById('adminOldPassword')
  if (oldInput) setTimeout(() => oldInput.focus(), 0)
}

function closeChangeAdminPasswordModal() {
  const modal = document.getElementById('adminChangePasswordModal')
  if (modal) modal.style.display = 'none'
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
    showAdminToast('Máº­t kháº©u má»›i tá»‘i thiá»ƒu 6 kÃ½ tá»±', 'error')
    return
  }
  if (newPassword !== confirmPassword) {
    showAdminToast('Nháº­p láº¡i máº­t kháº©u chÆ°a khá»›p', 'error')
    return
  }
  const btn = document.getElementById('adminChangePasswordBtn')
  btn.disabled = true
  btn.textContent = 'Äang cáº­p nháº­t...'
  try {
    await axios.put('/api/admin/profile/password', {
      old_password: oldPassword,
      new_password: newPassword
    })
    showAdminToast('ÄÃ£ Ä‘á»•i máº­t kháº©u thÃ nh cÃ´ng', 'success')
    closeChangeAdminPasswordModal()
  } catch (err) {
    const msg = err.response?.data?.error || 'Äá»•i máº­t kháº©u tháº¥t báº¡i'
    showAdminToast(msg, 'error')
  } finally {
    btn.disabled = false
    btn.textContent = 'Cáº­p nháº­t máº­t kháº©u'
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
    showAdminToast('Vui lÃ²ng chá»n file áº£nh', 'error')
    return
  }
  try {
    const rawDataUrl = await readImageAsDataURL(file)
    let dataUrl = await compressAvatarDataUrl(rawDataUrl, 512, 0.85)
    if (dataUrl.length > 700000) dataUrl = await compressAvatarDataUrl(rawDataUrl, 448, 0.8)
    if (dataUrl.length > 700000) dataUrl = await compressAvatarDataUrl(rawDataUrl, 384, 0.75)
    if (dataUrl.length > 700000) dataUrl = await compressAvatarDataUrl(rawDataUrl, 320, 0.7)
    if (!dataUrl.startsWith('data:image/')) {
      showAdminToast('File áº£nh khÃ´ng há»£p lá»‡', 'error')
      return
    }
    if (dataUrl.length > 700000) {
      showAdminToast('áº¢nh quÃ¡ lá»›n, vui lÃ²ng chá»n áº£nh nhá» hÆ¡n', 'error')
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
      showAdminToast('ÄÃ£ cáº­p nháº­t avatar', 'success')
    } catch (e) {
      adminProfile = { ...(adminProfile || {}), avatar: prevAvatar }
      applyAdminAvatarUI()
      const msg = e.response?.data?.error || 'LÆ°u avatar tháº¥t báº¡i'
      showAdminToast(msg, 'error')
    }
  } catch (_) {
    showAdminToast('KhÃ´ng Ä‘á»c Ä‘Æ°á»£c áº£nh, vui lÃ²ng thá»­ láº¡i', 'error')
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
function showPage(name) {
  ['dashboard','products','orders','vouchers','featured','settings','settings-warehouse','flashsale'].forEach(p => {
    const section = document.getElementById('page-'+p)
    if (section) section.classList.toggle('hidden', p !== name)
  })
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'))
  const mainBtn = document.querySelector('.nav-item[data-page="' + name + '"]')
  if (mainBtn) mainBtn.classList.add('active')
  document.querySelectorAll('.nav-sub-item').forEach(b => {
    b.classList.toggle('active', b.dataset.subPage === settingsActiveSubPage || b.dataset.subPage === marketingActiveSubPage)
  })
  if (name === 'settings' || name === 'settings-warehouse') {
    const settingsBtn = document.getElementById('settingsMenuBtn')
    if (settingsBtn) settingsBtn.classList.add('active')
    setSettingsSubmenuOpen(true)
    if (name === 'settings-warehouse') settingsActiveSubPage = 'settings-warehouse'
  } else {
    setSettingsSubmenuOpen(false)
    if (name !== 'settings-warehouse') settingsActiveSubPage = ''
  }
  if (name === 'flashsale') {
    const marketingBtn = document.getElementById('marketingMenuBtn')
    if (marketingBtn) marketingBtn.classList.add('active')
    setMarketingSubmenuOpen(true)
    marketingActiveSubPage = 'flashsale'
  } else {
    setMarketingSubmenuOpen(false)
    if (name !== 'flashsale') marketingActiveSubPage = ''
  }
  document.querySelectorAll('.nav-sub-item').forEach(b => b.classList.remove('active'))
  if (settingsActiveSubPage) {
    document.querySelectorAll('.nav-sub-item[data-sub-page="' + settingsActiveSubPage + '"]').forEach(b => b.classList.add('active'))
  }
  if (marketingActiveSubPage) {
    document.querySelectorAll('.nav-sub-item[data-sub-page="' + marketingActiveSubPage + '"]').forEach(b => b.classList.add('active'))
  }
  const titles = {dashboard:'Dashboard', products:'Quáº£n lÃ½ Sáº£n pháº©m', orders:'Quáº£n lÃ½ ÄÆ¡n hÃ ng', vouchers:'Quáº£n lÃ½ Voucher', featured:'Sáº£n pháº©m Ná»•i Báº­t', settings:'CÃ i Ä‘áº·t', 'settings-warehouse':'CÃ i Ä‘áº·t kho hÃ ng', flashsale:'Quáº£n lÃ½ Flashsale'}
  document.body.dataset.adminPage = name
  document.getElementById('pageTitle').textContent = titles[name] || name

  if (name === 'dashboard') loadDashboard()
  else if (name === 'products') loadAdminProducts()
  else if (name === 'orders') loadAdminOrders()
  else if (name === 'vouchers') loadVouchers()
  else if (name === 'featured') loadFeaturedAdmin()
  else if (name === 'settings') loadSettingsAdmin()
  else if (name === 'settings-warehouse') loadSettingsWarehousePage()
  else if (name === 'flashsale') loadFlashSaleAdmin()

  syncOrdersHeaderSearchUI()

  if (name !== 'orders') {
    const bulkBar = document.getElementById('ordersBulkActionBar')
    const shipBar = document.getElementById('shippingBulkActionBar')
    if (bulkBar) bulkBar.classList.add('hidden')
    if (shipBar) shipBar.classList.add('hidden')
  }

  // Close mobile sidebar
  closeMobileSidebar()
}

function closeMobileSidebar() {
  const sidebar = document.getElementById('sidebar')
  const overlay = document.getElementById('sidebarOverlay')
  if (!sidebar || !overlay) return
  sidebar.classList.add('-translate-x-full')
  overlay.style.display = 'none'
  overlay.classList.add('hidden')
  overlay.style.pointerEvents = 'none'
}

function openMobileSidebar() {
  const sidebar = document.getElementById('sidebar')
  const overlay = document.getElementById('sidebarOverlay')
  if (!sidebar || !overlay) return
  sidebar.classList.remove('-translate-x-full')
  overlay.style.display = 'block'
  overlay.classList.remove('hidden')
  overlay.style.pointerEvents = ''
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar')
  if (!sidebar) return
  const isOpen = !sidebar.classList.contains('-translate-x-full')
  if (isOpen) closeMobileSidebar()
  else openMobileSidebar()
}

function syncSidebarOverlay() {
  const sidebar = document.getElementById('sidebar')
  const overlay = document.getElementById('sidebarOverlay')
  if (!sidebar || !overlay) return
  const isDesktop = window.matchMedia && window.matchMedia('(min-width: 768px)').matches
  const sidebarOpen = !sidebar.classList.contains('-translate-x-full')
  if (isDesktop) {
    overlay.style.display = 'none'
    overlay.classList.add('hidden')
    overlay.style.pointerEvents = 'none'
    return
  }
  if (sidebarOpen) {
    overlay.style.display = 'block'
    overlay.classList.remove('hidden')
    overlay.style.pointerEvents = ''
  } else {
    overlay.style.display = 'none'
    overlay.classList.add('hidden')
    overlay.style.pointerEvents = 'none'
  }
}

function setSettingsSubmenuOpen(open) {
  settingsSubmenuOpen = !!open
  const submenu = document.getElementById('settingsSubmenu')
  const chevron = document.getElementById('settingsMenuChevron')
  if (submenu) submenu.classList.toggle('hidden', !settingsSubmenuOpen)
  if (chevron) chevron.classList.toggle('rotate-180', settingsSubmenuOpen)
}

function toggleSettingsMenu() {
  setSettingsSubmenuOpen(!settingsSubmenuOpen)
}

function openSettingsWarehouse() {
  settingsActiveSubPage = 'settings-warehouse'
  marketingActiveSubPage = ''
  setSettingsSubmenuOpen(true)
  setMarketingSubmenuOpen(false)
  showPage('settings-warehouse')
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

${adminFlashSaleScript()}

${adminFeaturedSettingsScript()}

async function loadDashboard() {
  try {
    const res = await axios.get('/api/admin/stats')
    const d = res.data?.data || {}
    const statProductsEl = document.getElementById('statProducts')
    const statOrdersEl = document.getElementById('statOrders')
    const statPendingEl = document.getElementById('statPending')
    const statRevenueEl = document.getElementById('statRevenue')
    if (statProductsEl) statProductsEl.textContent = d.totalProducts ?? '0'
    if (statOrdersEl) statOrdersEl.textContent = d.totalOrders ?? '0'
    if (statPendingEl) statPendingEl.textContent = d.pendingOrders ?? '0'
    if (statRevenueEl) statRevenueEl.textContent = fmtPrice(d.revenue || 0)

    const shippingQueueOrders = Number(d.shippingQueueOrders || 0)
    if (shippingQueueOrders > 0) {
      const pendingBadge = document.getElementById('pendingBadge')
      if (pendingBadge) {
        pendingBadge.textContent = shippingQueueOrders
        pendingBadge.classList.remove('hidden')
      }
    }

    const recent = (d.recentOrders || []).filter(o => !isInternalTestOrder(o))
    const recentOrdersTable = document.getElementById('recentOrdersTable')
    if (!recentOrdersTable) return
    if (!recent.length) {
      recentOrdersTable.innerHTML = '<div class="text-center py-8 text-gray-400">Chưa có đơn hàng nào</div>'
      return
    }
    recentOrdersTable.innerHTML = '<table class="w-full text-sm"><thead><tr class="border-b text-gray-500"><th class="py-2 text-left pr-4">Mã ĐH</th><th class="py-2 text-left pr-4">Khách hàng</th><th class="py-2 text-right pr-4">Còn phải thu</th><th class="py-2 text-center">Trạng thái</th></tr></thead><tbody>' +
      recent.map(o => '<tr class="border-b last:border-0"><td class="py-2 pr-4 font-mono text-xs text-blue-600">' + o.order_code + '</td><td class="py-2 pr-4">' + displayCustomerName(o.customer_name) + '</td><td class="py-2 pr-4 text-right font-semibold">' + fmtPrice(getOrderAmountDue(o)) + '</td><td class="py-2 text-center"><span class="badge badge-' + o.status + '">' + statusLabel(o.status) + '</span></td></tr>').join('') +
      '</tbody></table>'
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

// â”€â”€ PRODUCTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function loadAdminProducts() {
  const grid = document.getElementById('adminProductsGrid')
  grid.innerHTML = '<div class="col-span-4 text-center py-12 text-gray-400"><i class="fas fa-spinner fa-spin text-3xl"></i></div>'
  try {
    const res = await axios.get('/api/admin/products')
    adminProducts = res.data.data || []
    renderAdminProducts(adminProducts)
  } catch(e) {
    if (e && e.response && e.response.status === 401) {
      showAdminToast('PhiÃªn Ä‘Äƒng nháº­p Ä‘Ã£ háº¿t háº¡n, vui lÃ²ng Ä‘Äƒng nháº­p láº¡i', 'error')
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
  const filtered = adminProducts.filter(p => 
    (!q || String(p?.name || '').toLowerCase().includes(q) || String(p?.brand || '').toLowerCase().includes(q)) &&
    (!cat || String(p?.category || '') === cat)
  )
  renderAdminProducts(filtered)
}

function renderAdminProducts(products) {
  const grid = document.getElementById('adminProductsGrid')
  const safeProducts = (Array.isArray(products) ? products : []).filter(Boolean)
  if (!safeProducts.length) {
    grid.innerHTML = '<div class="col-span-4 text-center py-12 text-gray-400"><i class="fas fa-box-open text-4xl mb-3"></i><p>KhÃ´ng cÃ³ sáº£n pháº©m</p></div>'
    return
  }
  grid.innerHTML = safeProducts.map(raw => {
    try {
      const p = raw || {}
      const name = String(p.name || 'Sáº£n pháº©m')
      const brand = String(p.brand || '').trim()
      const thumbnail = String(p.thumbnail || '').trim() || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'
      const colors = getProductColorOptions(p).map((c) => c.name).filter(Boolean)
      const sizes = safeJson(p.sizes)
      return \`
    <div class="bg-white rounded-2xl shadow-sm border overflow-hidden \${!p.is_active ? 'opacity-60' : ''}">
      <div class="relative h-48 bg-gray-100 overflow-hidden">
        <img src="\${thumbnail}" alt="\${name}" 
          class="w-full h-full object-cover" onerror="this.src='https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'">
        <div class="absolute top-2 left-2 flex gap-1">
          <span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-white/90 text-gray-700">\${catLabel(p.category)}</span>
          \${p.is_featured ? '<span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-400 text-white">â­ Hot</span>' : ''}
          \${p.is_trending ? '<span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500 text-white">ðŸ”¥ Trend</span>' : ''}
          \${p.is_trending && (p.trending_order||0) > 0 ? \`<span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-500 text-white">#\${p.trending_order}</span>\` : ''}
        </div>
        <div class="absolute top-2 right-2">
          <span class="w-2.5 h-2.5 rounded-full inline-block \${p.is_active ? 'bg-green-400' : 'bg-gray-400'}"></span>
        </div>
      </div>
      <div class="p-4">
        \${brand ? \`<p class="text-xs text-pink-500 font-medium mb-1">\${brand}</p>\` : ''}
        <h3 class="font-semibold text-gray-900 text-sm mb-2 line-clamp-2 leading-tight">\${name}</h3>
        <div class="flex items-center gap-2 mb-3">
          <span class="font-bold text-pink-600">\${fmtPrice(p.price)}</span>
          \${p.original_price ? \`<span class="text-xs text-gray-400 line-through">\${fmtPrice(p.original_price)}</span>\` : ''}
        </div>
        \${colors.length ? \`<div class="flex flex-wrap gap-1 mb-2">\${colors.slice(0,3).map(c=>\`<span class="text-xs bg-pink-50 text-pink-600 px-2 py-0.5 rounded-full">\${c}</span>\`).join('')}\${colors.length>3?\`<span class="text-xs text-gray-400">+\${colors.length-3}</span>\`:''}</div>\` : ''}
        \${sizes.length ? \`<div class="flex flex-wrap gap-1 mb-3">\${sizes.slice(0,4).map(s=>\`<span class="text-xs border text-gray-600 px-1.5 py-0.5 rounded">\${s}</span>\`).join('')}\${sizes.length>4?\`<span class="text-xs text-gray-400">+\${sizes.length-4}</span>\`:''}</div>\` : ''}
        <p class="text-xs text-gray-400 mb-3">Tá»“n kho: <span class="font-semibold text-gray-700">\${p.stock || 0}</span></p>
        <div class="flex gap-2">
          <button onclick="openProductModal(\${p.id})" class="flex-1 py-2 border-2 border-pink-200 text-pink-600 rounded-xl text-xs font-semibold hover:bg-pink-50 transition">
            <i class="fas fa-edit mr-1"></i>Sá»­a
          </button>
          <button onclick="toggleProductActive(\${p.id})" class="py-2 px-3 border-2 border-gray-200 rounded-xl text-xs hover:bg-gray-50 transition" title="\${p.is_active ? 'áº¨n' : 'Hiá»‡n'}">
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
      const name = String(p.name || 'Sáº£n pháº©m')
      const thumbnail = String(p.thumbnail || '').trim() || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'
      const isActive = !!p.is_active
      const price = Number(p.price || 0)
      console.error('renderAdminProducts item error:', err, raw)
      return \`
      <div class="bg-white rounded-2xl shadow-sm border overflow-hidden \${!isActive ? 'opacity-60' : ''}">
        <div class="relative h-48 bg-gray-100 overflow-hidden">
          <img src="\${thumbnail}" alt="\${name}" class="w-full h-full object-cover" onerror="this.src='https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'">
          <div class="absolute top-2 right-2">
            <span class="w-2.5 h-2.5 rounded-full inline-block \${isActive ? 'bg-green-400' : 'bg-gray-400'}"></span>
          </div>
        </div>
        <div class="p-4">
          <h3 class="font-semibold text-gray-900 text-sm mb-2 line-clamp-2 leading-tight">\${name}</h3>
          <div class="flex items-center gap-2 mb-3">
            <span class="font-bold text-pink-600">\${fmtPrice(price)}</span>
          </div>
          <p class="text-xs text-gray-400 mb-3">Tá»“n kho: <span class="font-semibold text-gray-700">\${p.stock || 0}</span></p>
          <div class="flex gap-2">
            <button onclick="openProductModal(\${p.id})" class="flex-1 py-2 border-2 border-pink-200 text-pink-600 rounded-xl text-xs font-semibold hover:bg-pink-50 transition">
              <i class="fas fa-edit mr-1"></i>Sá»­a
            </button>
            <button onclick="toggleProductActive(\${p.id})" class="py-2 px-3 border-2 border-gray-200 rounded-xl text-xs hover:bg-gray-50 transition" title="\${isActive ? 'áº¨n' : 'Hiá»‡n'}">
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
    showAdminToast('ÄÃ£ cáº­p nháº­t tráº¡ng thÃ¡i', 'success')
  } catch(e) { showAdminToast('Lá»—i cáº­p nháº­t', 'error') }
}

async function deleteProduct(id) {
  if (!confirm('Báº¡n cháº¯c cháº¯n muá»‘n xoÃ¡ sáº£n pháº©m nÃ y?')) return
  try {
    await axios.delete('/api/admin/products/' + id)
    loadAdminProducts()
    showAdminToast('ÄÃ£ xoÃ¡ sáº£n pháº©m', 'success')
  } catch(e) { showAdminToast('Lá»—i xoÃ¡ sáº£n pháº©m', 'error') }
}

// â”€â”€ PRODUCT MODAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function openProductModal(id = null) {
  editingId = id
  colors = []
  sizes = []
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
  document.getElementById('modalTitle').textContent = id ? 'Chá»‰nh sá»­a sáº£n pháº©m' : 'ThÃªm sáº£n pháº©m má»›i'
  
  // Bind gallery slots
  for (let i = 0; i < 9; i++) {
    const slot = document.getElementById('slot-'+i)
    slot.onclick = () => handleGallerySlotClick(i)
  }
  
  if (id) {
    try {
      const res = await axios.get('/api/admin/products/' + id)
      const p = res?.data?.data || {}
      document.getElementById('productId').value = p.id || ''
      document.getElementById('pName').value = p.name || ''
      document.getElementById('pPrice').value = p.price || ''
      document.getElementById('pOriginalPrice').value = p.original_price || ''
      document.getElementById('pCategory').value = p.category || 'unisex'
      document.getElementById('pBrand').value = p.brand || ''
      document.getElementById('pMaterial').value = p.material || ''
      document.getElementById('pDescription').value = p.description || ''
      document.getElementById('pStock').value = p.stock || 0
      document.getElementById('pFeatured').checked = !!p.is_featured
      document.getElementById('pTrending').checked = !!p.is_trending
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
      renderColorOptionsEditor()
      renderTags('size')
    } catch(e) {
      const msg = e?.response?.data?.error || e?.message || 'Lá»—i táº£i sáº£n pháº©m'
      console.error('openProductModal error:', e)
      showAdminToast(msg, 'error')
      return
    }
  }
  
  document.getElementById('productModal').classList.remove('hidden')
  document.body.style.overflow = 'hidden'
}

function closeProductModal() {
  document.getElementById('productModal').classList.add('hidden')
  document.body.style.overflow = ''
  editingId = null
}

function resetProductForm() {
  document.getElementById('productForm').reset()
  document.getElementById('productId').value = ''
  document.getElementById('pActive').checked = true
  document.getElementById('pTrendingOrder').value = '0'
  previewThumbnail('')
  for (let i = 0; i < 9; i++) clearGallerySlot(i)
  colors = []; sizes = []
  renderColorOptionsEditor(); renderTags('size')
  galleryImages = ['','','','','','','','','']
}

async function saveProduct(e) {
  e.preventDefault()
  const btn = document.getElementById('saveBtn')
  btn.textContent = 'Äang lÆ°u...'
  
  const imgList = galleryImages.filter(v => v && v.trim())
  const normalizedThumbnail = String(document.getElementById('pThumbnail').value || '').trim()
  const normalizedColors = colors
    .map((c) => ({ name: String(c?.name || '').trim(), image: String(c?.image || '').trim() }))
    .filter((c) => c.name || c.image)
  if (!normalizedThumbnail && imgList.length === 0) {
    showAdminToast('TrÆ°á»ng hÃ¬nh áº£nh lÃ  báº¯t buá»™c', 'error')
    btn.textContent = 'LÆ°u sáº£n pháº©m'
    return
  }
  
  const data = {
    name: document.getElementById('pName').value,
    price: document.getElementById('pPrice').value,
    original_price: document.getElementById('pOriginalPrice').value || null,
    category: document.getElementById('pCategory').value,
    brand: document.getElementById('pBrand').value,
    material: document.getElementById('pMaterial').value,
    description: document.getElementById('pDescription').value,
    thumbnail: normalizedThumbnail,
    images: imgList,
    colors: normalizedColors,
    sizes: sizes,
    stock: document.getElementById('pStock').value || 0,
    is_featured: document.getElementById('pFeatured').checked,
    is_trending: document.getElementById('pTrending').checked,
    trending_order: parseInt(document.getElementById('pTrendingOrder').value) || 0,
    is_active: document.getElementById('pActive').checked
  }
  const payloadSize = JSON.stringify(data).length
  if (payloadSize > MAX_PRODUCT_PAYLOAD_SIZE) {
    showAdminToast('áº¢nh quÃ¡ náº·ng, vui lÃ²ng giáº£m dung lÆ°á»£ng hoáº·c sá»‘ lÆ°á»£ng áº£nh', 'error')
    btn.textContent = 'LÆ°u sáº£n pháº©m'
    return
  }
  
  try {
    if (editingId) {
      await axios.put('/api/admin/products/' + editingId, data)
      showAdminToast('Cáº­p nháº­t sáº£n pháº©m thÃ nh cÃ´ng!', 'success')
    } else {
      await axios.post('/api/admin/products', data)
      showAdminToast('ThÃªm sáº£n pháº©m thÃ nh cÃ´ng!', 'success')
    }
    closeProductModal()
    loadAdminProducts()
  } catch(e) {
    const msg = e.response?.data?.error || e.message || 'Lá»—i lÆ°u sáº£n pháº©m'
    showAdminToast(msg, 'error')
  } finally {
    btn.textContent = 'LÆ°u sáº£n pháº©m'
  }
}

// â”€â”€ GALLERY â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
  img.src = url
  img.classList.remove('hidden')
  placeholder.classList.add('hidden')
  delBtn.classList.remove('hidden')
  delBtn.classList.add('flex')
  slot.classList.add('has-img')
}

function clearGallerySlot(i) {
  galleryImages[i] = ''
  const img = document.getElementById('galleryImg-'+i)
  const placeholder = document.getElementById('slotPlaceholder-'+i)
  const delBtn = document.getElementById('slotDel-'+i)
  const slot = document.getElementById('slot-'+i)
  img.src = ''; img.classList.add('hidden')
  placeholder.classList.remove('hidden')
  delBtn.classList.add('hidden'); delBtn.classList.remove('flex')
  slot.classList.remove('has-img')
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
    showAdminToast('Vui lÃ²ng kÃ©o tháº£ file áº£nh há»£p lá»‡', 'warning')
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
      const thumbDataUrl = await fileToOptimizedDataURL(files[0], 900, 0.85)
      document.getElementById('pThumbnail').value = thumbDataUrl
      previewThumbnail(thumbDataUrl)
      fileIndex = 1
      startIndex = 0
    }
    for (let i = startIndex; i < 9 && fileIndex < files.length; i++) {
      const dataUrl = await fileToOptimizedDataURL(files[fileIndex], 1200, 0.82)
      setGallerySlot(i, dataUrl)
      fileIndex++
    }
    if (fileIndex < files.length) {
      showAdminToast('ÄÃ£ Ä‘áº§y Ã´ áº£nh, má»™t sá»‘ áº£nh chÆ°a Ä‘Æ°á»£c thÃªm', 'warning')
    }
  } catch (e) {
    showAdminToast('KhÃ´ng thá»ƒ xá»­ lÃ½ áº£nh, vui lÃ²ng thá»­ áº£nh khÃ¡c', 'error')
  }
}

function addGalleryUrl() {
  const url = document.getElementById('galleryUrlInput').value.trim()
  if (!url) return
  const emptySlot = galleryImages.findIndex(v => !v)
  if (emptySlot === -1) { showAdminToast('ÄÃ£ Ä‘áº§y 9 áº£nh', 'error'); return }
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

// â”€â”€ TAGS (Colors/Sizes) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function addTag(type) {
  const input = document.getElementById(type === 'size' ? 'sizeInput' : '')
  if (!input) return
  const val = input.value.trim()
  if (!val) return
  val.split(',').map(v => v.trim()).filter(v => v && !sizes.includes(v)).forEach(v => sizes.push(v))
  renderTags('size')
  input.value = ''
}

function removeTag(type, val) {
  if (type !== 'size') return
  sizes = sizes.filter(s => s !== val)
  renderTags('size')
}

function renderTags(type) {
  if (type !== 'size') return
  const container = document.getElementById('sizeTags')
  container.innerHTML = sizes.map(v => \`
    <span class="tag-item">\${v}<span class="tag-del" onclick="removeTag('size','\${v}')">Ã—</span></span>
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
          Báº¥m hoáº·c kÃ©o áº£nh
        </div>
        <input type="file" accept="image/*" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" id="colorFile-\${idx}" onchange="handleColorImageFile(\${idx}, this)">
        <div class="\${color.image ? 'absolute inset-0 hidden group-hover:flex items-center justify-center bg-black/45 text-white transition z-20' : 'hidden'}" id="colorOverlay-\${idx}">
          <button type="button" onclick="event.preventDefault();event.stopPropagation();removeColorImage(\${idx})" class="w-8 h-8 rounded-full bg-black/35 hover:bg-red-500 flex items-center justify-center z-30">
            <i class="fas fa-trash text-xs"></i>
          </button>
        </div>
      </div>
      <input type="text" value="\${String(color.name || '').replace(/"/g, '&quot;')}" placeholder="Nháº­p mÃ u (VD: Äen, Navy...)" class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400" oninput="updateColorName(\${idx}, this.value)">
      <button type="button" onclick="removeColorOptionRow(\${idx})" class="w-9 h-9 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 mt-1">
        <i class="fas fa-trash text-xs"></i>
      </button>
    </div>
  \`).join('')
}

function addColorOptionRow() {
  colors.push({ name: '', image: '' })
  renderColorOptionsEditor()
}

function removeColorOptionRow(idx) {
  if (colors.length <= 1) {
    colors = [{ name: '', image: '' }]
  } else {
    colors.splice(idx, 1)
  }
  renderColorOptionsEditor()
}

function updateColorName(idx, value) {
  if (!colors[idx]) return
  colors[idx].name = String(value || '')
}

function removeColorImage(idx) {
  if (!colors[idx]) return
  colors[idx].image = ''
  renderColorOptionsEditor()
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
    colors[idx].image = await fileToOptimizedDataURL(file, 500, 0.85)
    renderColorOptionsEditor()
  } catch (_) {
    showAdminToast('KhÃ´ng thá»ƒ xá»­ lÃ½ áº£nh mÃ u', 'error')
  }
}

function addPresetSizes(arr) {
  arr.forEach(s => { if (!sizes.includes(s)) sizes.push(s) })
  renderTags('size')
}

// â”€â”€ ORDERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
${adminOrdersScript()}

async function loadVouchers() {
  const list = document.getElementById('voucherList')
  list.innerHTML = '<div class="text-center py-8 text-gray-400"><i class="fas fa-spinner fa-spin text-2xl"></i></div>'
  try {
    const res = await axios.get('/api/admin/vouchers')
    const vouchers = res.data.data || []
    if (!vouchers.length) {
      list.innerHTML = '<div class="text-center py-8 text-gray-400"><i class="fas fa-ticket-alt text-4xl mb-2"></i><p>ChÆ°a cÃ³ voucher nÃ o</p></div>'
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
              \${isValid ? 'âœ… Hiá»‡u lá»±c' : expired ? 'â° Háº¿t háº¡n' : notStarted ? 'ðŸ• ChÆ°a báº¯t Ä‘áº§u' : 'ðŸš« Táº¯t'}
            </span>
          </div>
          <div class="flex gap-1 shrink-0">
            <button onclick="toggleVoucher(\${v.id})" class="p-1.5 rounded-lg text-xs \${v.is_active ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-green-50 text-green-600 hover:bg-green-100'} transition" title="\${v.is_active ? 'Táº¯t' : 'Báº­t'}">
              <i class="fas fa-\${v.is_active ? 'toggle-off' : 'toggle-on'}"></i>
            </button>
            <button onclick="deleteVoucher(\${v.id})" class="p-1.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg text-xs transition" title="XoÃ¡">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
        <div class="flex items-center gap-3 flex-wrap text-sm">
          <span class="font-bold text-pink-600 text-base">-\${fmtPrice(v.discount_amount)}</span>
          <span class="text-gray-400">|</span>
          <span class="text-gray-500 text-xs">
            <i class="fas fa-calendar text-gray-400 mr-1"></i>
            \${new Date(v.valid_from).toLocaleDateString('vi-VN')} â†’ \${new Date(v.valid_to).toLocaleDateString('vi-VN')}
          </span>
        </div>
        <div class="flex gap-3 mt-1.5 text-xs text-gray-500">
          <span><i class="fas fa-users mr-1 text-gray-400"></i>ÄÃ£ dÃ¹ng: <strong>\${v.used_count}</strong>\${v.usage_limit > 0 ? '/'+v.usage_limit : ' (khÃ´ng giá»›i háº¡n)'}</span>
        </div>
      </div>\`
    }).join('')
  } catch(e) {
    list.innerHTML = '<div class="text-center text-red-400 py-8">Lá»—i táº£i dá»¯ liá»‡u</div>'
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
    showAdminToast('Táº¡o voucher ' + code + ' thÃ nh cÃ´ng!', 'success')
    e.target.reset()
    loadVouchers()
  } catch(err) {
    showAdminToast('Lá»—i táº¡o voucher: ' + (err.response?.data?.error || 'Unknown'), 'error')
  } finally {
    btn.disabled = false
    btn.innerHTML = '<i class="fas fa-magic mr-2"></i>Táº¡o & Sinh mÃ£ Voucher'
  }
}

async function toggleVoucher(id) {
  try {
    await axios.patch('/api/admin/vouchers/' + id + '/toggle')
    loadVouchers()
    showAdminToast('ÄÃ£ cáº­p nháº­t tráº¡ng thÃ¡i voucher', 'success')
  } catch(e) { showAdminToast('Lá»—i', 'error') }
}

async function deleteVoucher(id) {
  if (!confirm('XoÃ¡ voucher nÃ y?')) return
  try {
    await axios.delete('/api/admin/vouchers/' + id)
    loadVouchers()
    showAdminToast('ÄÃ£ xoÃ¡ voucher', 'success')
  } catch(e) { showAdminToast('Lá»—i xoÃ¡', 'error') }
}

function copyCode() {
  const code = document.getElementById('generatedCodeText').textContent
  navigator.clipboard.writeText(code).then(() => showAdminToast('ÄÃ£ sao chÃ©p: ' + code, 'success'))
}

// â”€â”€ UTILS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function fmtPrice(p) { return new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND'}).format(p||0) }
function formatDateTimeVi(value) {
  if (!value) return 'â€”'
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
  return String(v || '').toLowerCase() === 'paid' ? 'ÄÃ£ thanh toÃ¡n' : 'ChÆ°a thanh toÃ¡n'
}
function paymentStatusClass(v) {
  return String(v || '').toLowerCase() === 'paid'
    ? 'bg-green-100 text-green-700 border border-green-200'
    : 'bg-amber-100 text-amber-700 border border-amber-200'
}
function formatPaymentMethod(v) {
  const key = String(v || '').toUpperCase()
  if (key === 'BANK_TRANSFER') return 'Chuyá»ƒn khoáº£n ngÃ¢n hÃ ng'
  if (key === 'MOMO') return 'VÃ­ Ä‘iá»‡n tá»­ MoMo'
  if (key === 'ZALOPAY') return 'ZaloPay'
  return 'COD - Thanh toÃ¡n khi giao'
}
function paymentMethodTagHTML(method, paymentStatus) {
  const key = String(method || '').toUpperCase()
  const paid = String(paymentStatus || '').toLowerCase() === 'paid'
  const paidMark = paid ? '<i class="fas fa-check-circle text-green-600"></i>' : ''
  if (key === 'BANK_TRANSFER') {
    return '<span class="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200"><i class="fas fa-university"></i>CK ngÃ¢n hÃ ng ' + paidMark + '</span>'
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
  if (/^Tráº§n\s+CÃ´ng\s+Hiáº¿u[a-z]$/i.test(n)) return 'Tráº§n CÃ´ng Hiáº¿u'
  if (n.toLowerCase().endsWith("'s")) n = n.slice(0, -2)
  // Fix common input artifact: Vietnamese char + stray latin suffix (e.g. "Hiáº¿us")
  if (n.length >= 2) {
    const last = n.charAt(n.length - 1)
    const prev = n.charAt(n.length - 2)
    const isAsciiLetter = (last >= 'A' && last <= 'Z') || (last >= 'a' && last <= 'z')
    if (isAsciiLetter && prev.charCodeAt(0) > 127) {
      n = n.slice(0, -1)
    }
  }
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
    showAdminToast(successMessage || 'ÄÃ£ copy', 'success')
    return true
  } catch (_) {
    showAdminToast('KhÃ´ng thá»ƒ copy', 'error')
    return false
  }
}

async function copyTrackingCode(fullCode) {
  await copyTextValue(fullCode, 'ÄÃ£ copy mÃ£ váº­n Ä‘Æ¡n Ä‘áº§y Ä‘á»§')
}

async function copyPhoneNumber(phone) {
  await copyTextValue(phone, 'ÄÃ£ copy sá»‘ Ä‘iá»‡n thoáº¡i')
}

async function copyOrderCode(orderCode) {
  await copyTextValue(orderCode, 'ÄÃ£ copy mÃ£ Ä‘Æ¡n hÃ ng')
}
function safeJson(v) { try { return JSON.parse(v||'[]') } catch { return [] } }
function catLabel(c) { return {unisex:'Unisex',male:'Nam',female:'Ná»¯'}[c]||c }
function statusLabel(s) { return {pending:'Chá» xá»­ lÃ½',confirmed:'XÃ¡c nháº­n',shipping:'Äang giao',done:'HoÃ n thÃ nh',cancelled:'ÄÃ£ há»§y'}[s]||s }

function showAdminToast(msg, type='success') {
  const c = document.getElementById('adminToast')
  const t = document.createElement('div')
  t.className = \`toast-admin flex items-center gap-2 px-5 py-3 rounded-2xl shadow-xl text-white text-sm font-medium pointer-events-auto \${type==='error'?'bg-red-500':type==='warning'?'bg-amber-500':'bg-green-500'}\`
  t.innerHTML = \`<i class="fas fa-\${type==='error'?'exclamation-circle':type==='warning'?'exclamation-triangle':'check-circle'}"></i>\${msg}\`
  c.appendChild(t)
  setTimeout(() => { t.style.opacity='0'; t.style.transform='translateX(100%)'; t.style.transition='all 0.3s'; setTimeout(()=>t.remove(),300) }, 3000)
}

// â”€â”€ ESC key handler - close any open modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    const modals = ['productModal', 'orderDetailModal', 'arrangeSuccessModal', 'createFlashSaleModal']
    modals.forEach(id => {
      const el = document.getElementById(id)
      if (el && !el.classList.contains('hidden')) {
        el.classList.add('hidden')
      }
    })
    closeChangeAdminPasswordModal()
    closeAdminAvatarMenu()
    document.body.style.overflow = ''
    // Also close sidebar overlay if open
    closeMobileSidebar()
  }
})

// â”€â”€ Safety: ensure all modals start hidden on page load â”€â”€
document.addEventListener('DOMContentLoaded', function() {
  scheduleAdminOverlaySanitize()
  syncOrdersHeaderSearchUI()
  window.addEventListener('resize', syncSidebarOverlay)
  window.addEventListener('resize', syncOrdersHeaderSearchUI)
  window.addEventListener('pageshow', scheduleAdminOverlaySanitize)
  window.addEventListener('focus', scheduleAdminOverlaySanitize)
  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible') scheduleAdminOverlaySanitize()
  })
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

// Init
async function initAdminAuth() {
  scheduleAdminOverlaySanitize()
  try {
    const res = await axios.get('/api/auth/me')
    if (!res.data.isAdmin) {
      window.location.replace('/admin/login')
      return
    }
    adminProfile = res.data?.data || null
    applyAdminAvatarUI()
  } catch (e) {
    // 401 or error â†’ redirect to login
    window.location.replace('/admin/login')
    return
  }
  await loadAdminProfile()
  showPage('dashboard')
  scheduleAdminOverlaySanitize()
}
initAdminAuth()
`
}
