export function adminInlineScript(): string {
  return `// STATE
let adminProducts = []
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
let desktopSidebarCollapsed = false
let selectedColorImage = ''
const MAX_PRODUCT_PAYLOAD_SIZE = 1200000
const ADMIN_OVERLAY_IDS = ['productModal', 'orderDetailModal', 'arrangeSuccessModal', 'createFlashSaleModal', 'flashSaleProductPickerModal', 'adminChangePasswordModal', 'reviewAdminModal']

function forceHideAdminOverlay(el) {
  if (!el) return
  el.classList.add('hidden')
  el.classList.remove('flex')
  el.style.display = 'none'
  el.style.pointerEvents = 'none'
}

function showAdminOverlay(el, displayMode = 'flex') {
  if (!el) return
  el.style.display = displayMode
  el.style.pointerEvents = ''
  el.classList.remove('hidden')
  if (displayMode === 'flex') el.classList.add('flex')
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

function hasOpenAdminModal() {
  return ADMIN_OVERLAY_IDS.some((id) => {
    const el = document.getElementById(id)
    if (!el) return false
    if (el.style.display && el.style.display !== 'none') return true
    if (!el.classList.contains('hidden')) return true
    return false
  })
}

function sanitizeAdminOverlayState() {
  // Skip sanitize if a modal is intentionally open - avoids closing user's active modal
  if (hasOpenAdminModal()) return
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
function showPage(name) {
  ['dashboard','products','orders','reviews','vouchers','featured','settings','settings-social','settings-warehouse','flashsale'].forEach(p => {
    const section = document.getElementById('page-'+p)
    if (section) section.classList.toggle('hidden', p !== name)
  })
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'))
  const mainBtn = document.querySelector('.nav-item[data-page="' + name + '"]')
  if (mainBtn) mainBtn.classList.add('active')
  document.querySelectorAll('.nav-sub-item').forEach(b => {
    b.classList.toggle('active', b.dataset.subPage === settingsActiveSubPage || b.dataset.subPage === marketingActiveSubPage)
  })
  if (name === 'settings' || name === 'settings-social' || name === 'settings-warehouse') {
    const settingsBtn = document.getElementById('settingsMenuBtn')
    if (settingsBtn) settingsBtn.classList.add('active')
    setSettingsSubmenuOpen(true)
    if (name === 'settings-social') settingsActiveSubPage = 'settings-social'
    if (name === 'settings-warehouse') settingsActiveSubPage = 'settings-warehouse'
  } else {
    setSettingsSubmenuOpen(false)
    if (name !== 'settings-social' && name !== 'settings-warehouse') settingsActiveSubPage = ''
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
  const titles = {dashboard:'Dashboard', products:'Quản lý Sản phẩm', orders:'Quản lý Đơn hàng', reviews:'Quản lý Đánh giá', vouchers:'Quản lý Voucher', featured:'Sản phẩm Nổi Bật', settings:'Setting', 'settings-social':'Cấu hình MXH', 'settings-warehouse':'Cài đặt kho hàng', flashsale:'Quản lý Flashsale'}
  document.body.dataset.adminPage = name
  document.getElementById('pageTitle').textContent = titles[name] || name

  if (name === 'dashboard') loadDashboard()
  else if (name === 'products') loadAdminProducts()
  else if (name === 'orders') loadAdminOrders()
  else if (name === 'reviews') loadAdminReviews()
  else if (name === 'vouchers') loadVouchers()
  else if (name === 'featured') loadFeaturedAdmin()
  else if (name === 'settings') loadSettingsAdmin()
  else if (name === 'settings-social') loadSocialSettings()
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

function setDesktopSidebarCollapsed(collapsed) {
  desktopSidebarCollapsed = !!collapsed
  document.body.dataset.sidebarState = desktopSidebarCollapsed ? 'collapsed' : 'expanded'
  const sidebar = document.getElementById('sidebar')
  if (sidebar) sidebar.dataset.sidebarState = document.body.dataset.sidebarState
}

function toggleDesktopSidebar() {
  const isDesktop = window.matchMedia && window.matchMedia('(min-width: 768px)').matches
  if (!isDesktop) return
  setDesktopSidebarCollapsed(!desktopSidebarCollapsed)
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

function openSettingsSocial() {
  settingsActiveSubPage = 'settings-social'
  marketingActiveSubPage = ''
  setSettingsSubmenuOpen(true)
  setMarketingSubmenuOpen(false)
  showPage('settings-social')
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

// PRODUCTS
async function loadAdminProducts() {
  const grid = document.getElementById('adminProductsGrid')
  grid.innerHTML = '<div class="col-span-4 text-center py-12 text-gray-400"><i class="fas fa-spinner fa-spin text-3xl"></i></div>'
  try {
    const res = await axios.get('/api/admin/products')
    adminProducts = res.data.data || []
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
    grid.innerHTML = '<div class="col-span-4 text-center py-12 text-gray-400"><i class="fas fa-box-open text-4xl mb-3"></i><p>Không có sản phẩm</p></div>'
    return
  }
  grid.innerHTML = safeProducts.map(raw => {
    try {
      const p = raw || {}
      const name = String(p.name || 'Sản phẩm')
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
          \${p.is_featured ? '<span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-400 text-white"><i class="fas fa-star mr-1"></i>Hot</span>' : ''}
          \${p.is_trending ? '<span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500 text-white"><i class="fas fa-fire mr-1"></i>Trend</span>' : ''}
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
        <p class="text-xs text-gray-400 mb-3">Tồn kho: <span class="font-semibold text-gray-700">\${p.stock || 0}</span></p>
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
          <p class="text-xs text-gray-400 mb-3">Tồn kho: <span class="font-semibold text-gray-700">\${p.stock || 0}</span></p>
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
      const msg = e?.response?.data?.error || e?.message || 'Lỗi tải sản phẩm'
      console.error('openProductModal error:', e)
      showAdminToast(msg, 'error')
      return
    }
  }
  
  showAdminOverlay(document.getElementById('productModal'))
  document.body.style.overflow = 'hidden'
}

function closeProductModal() {
  forceHideAdminOverlay(document.getElementById('productModal'))
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
    showAdminToast('Trường hình ảnh là bắt buộc', 'error')
    btn.textContent = 'Lưu sản phẩm'
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
    showAdminToast('Không thể xử lý ảnh màu', 'error')
  }
}

function addPresetSizes(arr) {
  arr.forEach(s => { if (!sizes.includes(s)) sizes.push(s) })
  renderTags('size')
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

async function saveAdminReview(e) {
  e.preventDefault()
  const id = String(document.getElementById('adminReviewId').value || '').trim()
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

  const btn = document.getElementById('adminReviewSaveBtn')
  btn.disabled = true
  try {
    if (id) await axios.patch('/api/admin/reviews/' + id, payload)
    else await axios.post('/api/admin/reviews', payload)
    closeAdminReviewModal()
    await loadAdminReviews()
    showAdminToast(id ? 'Đã cập nhật đánh giá' : 'Đã thêm đánh giá', 'success')
  } catch (err) {
    showAdminToast(err.response?.data?.error || 'Không lưu được đánh giá', 'error')
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
  list.innerHTML = '<div class="text-center py-8 text-gray-400"><i class="fas fa-spinner fa-spin text-2xl"></i></div>'
  try {
    const res = await axios.get('/api/admin/vouchers')
    const vouchers = res.data.data || []
    if (!vouchers.length) {
      list.innerHTML = '<div class="text-center py-8 text-gray-400"><i class="fas fa-ticket-alt text-4xl mb-2"></i><p>Chưa có voucher nào</p></div>'
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
    showAdminToast('Tạo voucher ' + code + ' thành công!', 'success')
    e.target.reset()
    loadVouchers()
  } catch(err) {
    showAdminToast('Lỗi tạo voucher: ' + (err.response?.data?.error || 'Unknown'), 'error')
  } finally {
    btn.disabled = false
    btn.innerHTML = '<i class="fas fa-magic mr-2"></i>Tạo & Sinh mã Voucher'
  }
}

async function toggleVoucher(id) {
  try {
    await axios.patch('/api/admin/vouchers/' + id + '/toggle')
    loadVouchers()
    showAdminToast('Đã cập nhật trạng thái voucher', 'success')
  } catch(e) { showAdminToast('Lỗi', 'error') }
}

async function deleteVoucher(id) {
  if (!confirm('Xóa voucher này?')) return
  try {
    await axios.delete('/api/admin/vouchers/' + id)
    loadVouchers()
    showAdminToast('Đã xóa voucher', 'success')
  } catch(e) { showAdminToast('Lỗi xóa', 'error') }
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
function statusLabel(s) { return {pending:'Chờ xử lý',confirmed:'Xác nhận',shipping:'Đang giao',done:'Hoàn thành',cancelled:'Đã hủy'}[s]||s }

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
    const modals = ['productModal', 'orderDetailModal', 'arrangeSuccessModal', 'createFlashSaleModal', 'flashSaleProductPickerModal']
    modals.forEach(id => {
      const el = document.getElementById(id)
      if (el) forceHideAdminOverlay(el)
    })
    closeFlashSaleCreateModal()
    closeFlashSaleProductPickerModal()
    closeChangeAdminPasswordModal()
    closeAdminAvatarMenu()
    document.body.style.overflow = ''
    closeMobileSidebar()
  }
})

document.addEventListener('DOMContentLoaded', function() {
  setDesktopSidebarCollapsed(false)
  scheduleAdminOverlaySanitize()
  syncOrdersHeaderSearchUI()
  window.addEventListener('resize', syncSidebarOverlay)
  window.addEventListener('resize', syncOrdersHeaderSearchUI)
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
