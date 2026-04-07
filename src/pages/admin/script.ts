export function adminInlineScript(): string {
  return `// ── STATE ─────────────────────────────────────────
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
const ADMIN_OVERLAY_IDS = ['productModal', 'orderDetailModal', 'arrangeSuccessModal']

// ── NAVIGATION ────────────────────────────────────
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
    if (el) el.classList.add('hidden')
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
  const titles = {dashboard:'Dashboard', products:'Quản lý Sản phẩm', orders:'Quản lý Đơn hàng', vouchers:'Quản lý Voucher', featured:'Sản phẩm Nổi Bật', settings:'Cài đặt', 'settings-warehouse':'Cài đặt kho hàng', flashsale:'Quản lý Flashsale'}
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

let flashSaleCreateSelectedItems = []
let flashSaleProductPickerItems = []
let flashSaleProductPickerQuery = ''
let flashSaleCreateSubmitting = false
let flashSaleEditingId = null

function flashSaleEscapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function flashSaleNormalizeNumber(value) {
  const num = typeof value === 'number' ? value : Number(String(value ?? '').replace(/,/g, '').trim())
  return Number.isFinite(num) ? num : 0
}

function flashSaleNormalizeDateTime(value) {
  const raw = String(value ?? '').trim()
  if (!raw) return ''
  const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T')
  return Number.isFinite(Date.parse(normalized)) ? normalized : ''
}

function flashSaleGetSelectedItemIndex(productId) {
  return flashSaleCreateSelectedItems.findIndex((item) => String(item.product_id) === String(productId))
}

function flashSaleGetSelectedItem(productId) {
  const index = flashSaleGetSelectedItemIndex(productId)
  return index >= 0 ? flashSaleCreateSelectedItems[index] : null
}

function flashSaleMakeSelectedItem(product) {
  const basePrice = flashSaleNormalizeNumber(product && (product.price ?? product.original_price ?? product.product_price ?? 0))
  return {
    product_id: flashSaleNormalizeNumber(product && product.id),
    product_name: String(product && (product.name ?? product.product_name ?? '')),
    product_thumbnail: String(product && (product.thumbnail ?? product.product_thumbnail ?? product.image ?? '')),
    product_price: basePrice,
    sale_price: null,
    discount_percent: null,
    purchase_limit: null,
    is_enabled: 1
  }
}

function flashSaleSyncModalMode() {
  const title = document.getElementById('flashSaleModalTitle')
  const subtitle = document.getElementById('flashSaleModalSubtitle')
  const submitText = document.getElementById('flashSaleSubmitText')
  const isEditing = flashSaleEditingId !== null
  if (title) title.textContent = isEditing ? 'Sửa Flashsale của shop' : 'Tạo Flashsale của shop'
  if (subtitle) subtitle.textContent = isEditing
    ? 'Chỉnh sửa chiến dịch flashsale hiện có. Giá flash sale vẫn ưu tiên cao nhất ngoài storefront.'
    : 'Thiết lập thời gian, chọn sản phẩm và cấu hình giá ưu đãi cho từng item.'
  if (submitText) submitText.textContent = flashSaleCreateSubmitting
    ? (isEditing ? 'Đang cập nhật...' : 'Đang tạo...')
    : (isEditing ? 'Cập nhật flashsale' : 'Tạo flashsale')
}

function flashSaleSetCreateSubmitState(isSubmitting) {
  flashSaleCreateSubmitting = !!isSubmitting
  const btn = document.getElementById('flashSaleSubmitBtn')
  if (btn) btn.disabled = flashSaleCreateSubmitting
  flashSaleSyncModalMode()
}

function flashSaleUpdateSelectionSummary() {
  const hint = document.getElementById('flashSaleSelectedItemsHint')
  const count = document.getElementById('flashSaleSelectedItemsCount')
  const total = flashSaleCreateSelectedItems.length
  if (hint) hint.textContent = total ? 'Đã chọn ' + total + ' sản phẩm để cấu hình flashsale.' : 'Chưa có sản phẩm nào được gắn vào flashsale.'
  if (count) count.innerHTML = '<i class="fas fa-layer-group"></i>' + total + ' sản phẩm'
}

function renderFlashSaleSelectedItems() {
  const tbody = document.getElementById('flashSaleSelectedItemsBody')
  if (!tbody) return
  flashSaleUpdateSelectionSummary()
  if (!flashSaleCreateSelectedItems.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="px-4 py-10 text-center text-gray-500"><div class="flex flex-col items-center gap-2"><div class="flex h-12 w-12 items-center justify-center rounded-full bg-pink-50 text-pink-500"><i class="fas fa-basket-shopping"></i></div><p class="font-medium">Chưa có sản phẩm nào được chọn</p><p class="text-xs text-gray-400">Task 8 sẽ nối phần chọn sản phẩm và cấu hình giá vào đây.</p></div></td></tr>'
    return
  }

  tbody.innerHTML = flashSaleCreateSelectedItems.map((item) => {
    const itemId = item.product_id
    const imageHtml = item.product_thumbnail
      ? '<img src="' + flashSaleEscapeHtml(item.product_thumbnail) + '" alt="' + flashSaleEscapeHtml(item.product_name) + '" class="h-14 w-14 rounded-xl object-cover border border-gray-100 bg-gray-50 shrink-0" />'
      : '<div class="h-14 w-14 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 shrink-0"><i class="fas fa-image"></i></div>'
    const salePriceValue = item.sale_price === null || item.sale_price === undefined ? '' : flashSaleNormalizeNumber(item.sale_price)
    const discountValue = item.discount_percent === null || item.discount_percent === undefined ? '' : flashSaleNormalizeNumber(item.discount_percent)
    const purchaseLimitValue = item.purchase_limit === null || item.purchase_limit === undefined ? '' : flashSaleNormalizeNumber(item.purchase_limit)
    const enabled = Number(item.is_enabled) === 1
    return '' +
      '<tr class="border-b last:border-b-0 align-top">' +
        '<td class="px-4 py-4">' +
          '<div class="flex items-start gap-3">' +
            imageHtml +
            '<div class="min-w-0">' +
              '<p class="font-semibold text-gray-900 line-clamp-2">' + flashSaleEscapeHtml(item.product_name) + '</p>' +
              '<p class="text-xs text-gray-400 mt-1">ID: ' + itemId + '</p>' +
            '</div>' +
          '</div>' +
        '</td>' +
        '<td class="px-4 py-4 text-center text-gray-700 font-medium">' + (item.product_price > 0 ? flashSaleNormalizeNumber(item.product_price).toLocaleString('vi-VN') + 'đ' : '—') + '</td>' +
        '<td class="px-4 py-4 text-center"><input type="number" min="0" step="1000" value="' + salePriceValue + '" oninput="updateFlashSaleSelectedItemField(' + itemId + ', &quot;sale_price&quot;, this.value)" class="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-center outline-none focus:border-pink-300 focus:ring-4 focus:ring-pink-100" placeholder="Nhập giá"></td>' +
        '<td class="px-4 py-4 text-center"><input type="number" min="1" max="99" step="1" value="' + discountValue + '" oninput="updateFlashSaleSelectedItemField(' + itemId + ', &quot;discount_percent&quot;, this.value)" class="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-center outline-none focus:border-pink-300 focus:ring-4 focus:ring-pink-100" placeholder="%"></td>' +
        '<td class="px-4 py-4 text-center"><input type="number" min="0" step="1" value="' + purchaseLimitValue + '" oninput="updateFlashSaleSelectedItemField(' + itemId + ', &quot;purchase_limit&quot;, this.value)" class="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-center outline-none focus:border-pink-300 focus:ring-4 focus:ring-pink-100" placeholder="0 = không giới hạn"></td>' +
        '<td class="px-4 py-4 text-center"><label class="inline-flex items-center justify-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold border ' + (enabled ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-500 border-gray-200') + '"><input type="checkbox" ' + (enabled ? 'checked' : '') + ' onchange="toggleFlashSaleSelectedItemEnabled(' + itemId + ', this.checked)" class="h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500"><span>' + (enabled ? 'Đang bật' : 'Đang tắt') + '</span></label></td>' +
        '<td class="px-4 py-4 text-center"><button type="button" onclick="removeFlashSaleSelectedItem(' + itemId + ')" class="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 text-xs font-semibold transition"><i class="fas fa-trash"></i>Xoá</button></td>' +
      '</tr>'
  }).join('')

  renderFlashSaleProductPicker()
}

async function loadFlashSaleProductPickerProducts() {
  const list = document.getElementById('flashSaleProductPickerList')
  if (list) list.innerHTML = '<div class="py-10 text-center text-gray-400"><i class="fas fa-spinner fa-spin text-3xl"></i></div>'
  try {
    const res = await axios.get('/api/admin/products')
    const products = Array.isArray(res.data && res.data.data) ? res.data.data : []
    flashSaleProductPickerItems = products.map((product) => ({
      id: flashSaleNormalizeNumber(product && product.id),
      name: String(product && (product.name ?? product.product_name ?? '')),
      thumbnail: String(product && (product.thumbnail ?? product.product_thumbnail ?? product.image ?? '')),
      price: flashSaleNormalizeNumber(product && (product.price ?? product.original_price ?? product.product_price ?? 0)),
      category: String(product && (product.category ?? product.category_name ?? '')),
      is_active: Number(product && (product.is_active ?? 1)) === 1
    }))
    renderFlashSaleProductPicker()
  } catch (e) {
    if (list) list.innerHTML = '<div class="py-10 text-center text-red-400"><i class="fas fa-triangle-exclamation text-2xl mb-2"></i><p>Không tải được danh sách sản phẩm</p></div>'
  }
}

function renderFlashSaleProductPicker() {
  const list = document.getElementById('flashSaleProductPickerList')
  const count = document.getElementById('flashSaleProductPickerCount')
  if (!list) return
  const queryEl = document.getElementById('flashSaleProductPickerSearch')
  flashSaleProductPickerQuery = queryEl ? String(queryEl.value || '').trim() : flashSaleProductPickerQuery
  const query = flashSaleProductPickerQuery.toLowerCase()
  const products = flashSaleProductPickerItems.filter((product) => {
    if (!query) return true
    return String(product.name || '').toLowerCase().includes(query) || String(product.id || '').includes(query)
  })
  if (count) count.innerHTML = '<i class="fas fa-layer-group"></i><span>' + products.length + ' sản phẩm</span>'
  if (!flashSaleProductPickerItems.length) {
    list.innerHTML = '<div class="py-10 text-center text-gray-400"><i class="fas fa-spinner fa-spin text-3xl mb-2"></i><p>Đang tải sản phẩm...</p></div>'
    return
  }
  if (!products.length) {
    list.innerHTML = '<div class="py-10 text-center text-gray-400"><i class="fas fa-box-open text-3xl mb-2"></i><p>Không tìm thấy sản phẩm phù hợp</p></div>'
    return
  }

  list.innerHTML = products.map((product) => {
    const selected = flashSaleGetSelectedItem(product.id)
    const thumbHtml = product.thumbnail
      ? '<img src="' + flashSaleEscapeHtml(product.thumbnail) + '" alt="' + flashSaleEscapeHtml(product.name) + '" class="h-16 w-16 rounded-2xl object-cover border border-gray-100 bg-gray-50 shrink-0" />'
      : '<div class="h-16 w-16 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 shrink-0"><i class="fas fa-image"></i></div>'
    const buttonClass = selected ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-pink-600 text-white border-pink-600 hover:bg-pink-700'
    const buttonText = selected ? 'Đã chọn' : 'Chọn'
    const buttonIcon = selected ? 'fa-check' : 'fa-plus'
    return '' +
      '<div class="p-4 flex items-center gap-4 hover:bg-pink-50/40 transition">' +
        thumbHtml +
        '<div class="min-w-0 flex-1">' +
          '<div class="flex flex-wrap items-center gap-2">' +
            '<p class="font-semibold text-gray-900 truncate">' + flashSaleEscapeHtml(product.name) + '</p>' +
            '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[11px] font-semibold">#' + product.id + '</span>' +
            (product.category ? '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-pink-50 text-pink-600 text-[11px] font-semibold">' + flashSaleEscapeHtml(product.category) + '</span>' : '') +
          '</div>' +
          '<p class="text-sm text-gray-500 mt-1">Giá gốc: ' + (product.price > 0 ? flashSaleNormalizeNumber(product.price).toLocaleString('vi-VN') + 'đ' : '—') + '</p>' +
        '</div>' +
        '<button type="button" onclick="toggleFlashSaleProductSelection(' + product.id + ')" class="inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition ' + buttonClass + '"><i class="fas ' + buttonIcon + '"></i>' + buttonText + '</button>' +
      '</div>'
  }).join('')
}

function openFlashSaleProductPickerModal() {
  const modal = document.getElementById('flashSaleProductPickerModal')
  if (!modal) return
  modal.classList.remove('hidden')
  modal.classList.add('flex')
  document.body.style.overflow = 'hidden'
  if (!flashSaleProductPickerItems.length) {
    loadFlashSaleProductPickerProducts()
  } else {
    renderFlashSaleProductPicker()
  }
  setTimeout(() => {
    const input = document.getElementById('flashSaleProductPickerSearch')
    if (input) input.focus()
  }, 0)
}

function closeFlashSaleProductPickerModal(event) {
  if (event && event.target && event.currentTarget && event.target !== event.currentTarget) return
  const modal = document.getElementById('flashSaleProductPickerModal')
  if (modal) {
    modal.classList.add('hidden')
    modal.classList.remove('flex')
  }
  if (!document.querySelector('.modal-overlay:not(.hidden)')) document.body.style.overflow = ''
}

function toggleFlashSaleProductSelection(productId) {
  const id = flashSaleNormalizeNumber(productId)
  const existingIndex = flashSaleGetSelectedItemIndex(id)
  if (existingIndex >= 0) {
    flashSaleCreateSelectedItems.splice(existingIndex, 1)
  } else {
    const product = flashSaleProductPickerItems.find((item) => Number(item.id) === id)
    if (!product) return
    flashSaleCreateSelectedItems.push(flashSaleMakeSelectedItem(product))
  }
  renderFlashSaleSelectedItems()
}

function updateFlashSaleSelectedItemField(productId, field, value) {
  const item = flashSaleGetSelectedItem(productId)
  if (!item) return
  if (field === 'sale_price') {
    item.sale_price = String(value ?? '').trim() ? flashSaleNormalizeNumber(value) : null
    if (item.sale_price !== null) item.discount_percent = null
  } else if (field === 'discount_percent') {
    item.discount_percent = String(value ?? '').trim() ? flashSaleNormalizeNumber(value) : null
    if (item.discount_percent !== null) item.sale_price = null
  } else if (field === 'purchase_limit') {
    item.purchase_limit = String(value ?? '').trim() ? Math.max(0, Math.floor(flashSaleNormalizeNumber(value))) : null
  }
  renderFlashSaleSelectedItems()
}

function toggleFlashSaleSelectedItemEnabled(productId, checked) {
  const item = flashSaleGetSelectedItem(productId)
  if (!item) return
  item.is_enabled = checked ? 1 : 0
  renderFlashSaleSelectedItems()
}

function removeFlashSaleSelectedItem(productId) {
  flashSaleCreateSelectedItems = flashSaleCreateSelectedItems.filter((item) => String(item.product_id) !== String(productId))
  renderFlashSaleSelectedItems()
}

function flashSaleMapDetailItem(item) {
  return {
    product_id: flashSaleNormalizeNumber(item && item.product_id),
    product_name: String(item && (item.product_name ?? '')),
    product_thumbnail: String(item && (item.product_thumbnail ?? '')),
    product_price: flashSaleNormalizeNumber(item && (item.product_price ?? item.product_original_price ?? 0)),
    sale_price: item && item.sale_price !== null && item.sale_price !== undefined ? flashSaleNormalizeNumber(item.sale_price) : null,
    discount_percent: item && item.discount_percent !== null && item.discount_percent !== undefined ? flashSaleNormalizeNumber(item.discount_percent) : null,
    purchase_limit: item && item.purchase_limit !== null && item.purchase_limit !== undefined ? Math.max(0, Math.floor(flashSaleNormalizeNumber(item.purchase_limit))) : null,
    is_enabled: item && Number(item.is_enabled) === 0 ? 0 : 1
  }
}

function resetFlashSaleCreateForm() {
  flashSaleEditingId = null
  flashSaleCreateSelectedItems = []
  flashSaleProductPickerQuery = ''
  const nameInput = document.getElementById('flashSaleNameInput')
  const startInput = document.getElementById('flashSaleStartInput')
  const endInput = document.getElementById('flashSaleEndInput')
  const pickerSearch = document.getElementById('flashSaleProductPickerSearch')
  if (nameInput) nameInput.value = ''
  if (startInput) startInput.value = ''
  if (endInput) endInput.value = ''
  if (pickerSearch) pickerSearch.value = ''
  flashSaleSetCreateSubmitState(false)
  renderFlashSaleSelectedItems()
}

function flashSaleCollectPayloadItems() {
  return flashSaleCreateSelectedItems.map((item) => ({
    product_id: item.product_id,
    sale_price: item.sale_price === null ? null : flashSaleNormalizeNumber(item.sale_price),
    discount_percent: item.discount_percent === null ? null : flashSaleNormalizeNumber(item.discount_percent),
    purchase_limit: item.purchase_limit === null ? null : Math.max(0, Math.floor(flashSaleNormalizeNumber(item.purchase_limit))),
    is_enabled: Number(item.is_enabled) === 1 ? 1 : 0
  }))
}

async function submitFlashSaleCreateForm() {
  if (flashSaleCreateSubmitting) return
  const nameInput = document.getElementById('flashSaleNameInput')
  const startInput = document.getElementById('flashSaleStartInput')
  const endInput = document.getElementById('flashSaleEndInput')
  const name = nameInput ? String(nameInput.value || '').trim() : ''
  const startAt = flashSaleNormalizeDateTime(startInput ? startInput.value : '')
  const endAt = flashSaleNormalizeDateTime(endInput ? endInput.value : '')
  const items = flashSaleCollectPayloadItems()
  const isEditing = flashSaleEditingId !== null

  if (!name) return showAdminToast('Tên flashsale là bắt buộc', 'warning')
  if (!startAt || !endAt) return showAdminToast('Vui lòng chọn thời gian bắt đầu và kết thúc', 'warning')
  if (Date.parse(endAt) <= Date.parse(startAt)) return showAdminToast('Thời gian kết thúc phải sau thời gian bắt đầu', 'warning')
  if (!items.length) return showAdminToast('Vui lòng chọn ít nhất 1 sản phẩm', 'warning')

  for (const item of items) {
    if (item.sale_price === null && item.discount_percent === null) {
      return showAdminToast('Mỗi sản phẩm phải có giá flashsale hoặc % giảm', 'warning')
    }
    if (item.sale_price !== null && item.sale_price <= 0) {
      return showAdminToast('Giá flashsale phải lớn hơn 0', 'warning')
    }
    if (item.discount_percent !== null && (item.discount_percent <= 0 || item.discount_percent >= 100)) {
      return showAdminToast('Phần trăm giảm phải nằm trong khoảng 1-99', 'warning')
    }
  }

  flashSaleSetCreateSubmitState(true)
  try {
    const res = await axios({
      method: flashSaleEditingId ? 'PUT' : 'POST',
      url: flashSaleEditingId ? ('/api/admin/flash-sales/' + flashSaleEditingId) : '/api/admin/flash-sales',
      data: { name, start_at: startAt, end_at: endAt, items }
    })
    if (!res.data || res.data.success === false) throw new Error(String(res.data && res.data.error ? res.data.error : (isEditing ? 'Không thể cập nhật flashsale' : 'Không thể tạo flashsale')))
    showAdminToast(isEditing ? 'Cập nhật flashsale thành công' : 'Tạo flashsale thành công', 'success')
    closeFlashSaleCreateModal()
    await loadFlashSaleAdmin()
  } catch (e) {
    const message = e && e.response && e.response.data && e.response.data.error ? e.response.data.error : (e && e.message ? e.message : (isEditing ? 'Không thể cập nhật flashsale' : 'Không thể tạo flashsale'))
    showAdminToast(String(message), 'error')
  } finally {
    flashSaleSetCreateSubmitState(false)
  }
}

function openFlashSaleCreateModal() {
  const modal = document.getElementById('createFlashSaleModal')
  if (!modal) return
  resetFlashSaleCreateForm()
  flashSaleSyncModalMode()
  modal.classList.remove('hidden')
  modal.classList.add('flex')
  document.body.style.overflow = 'hidden'
  renderFlashSaleSelectedItems()
  loadFlashSaleProductPickerProducts()
}

async function openFlashSaleEditModal(id) {
  const modal = document.getElementById('createFlashSaleModal')
  if (!modal) return
  resetFlashSaleCreateForm()
  modal.classList.remove('hidden')
  modal.classList.add('flex')
  document.body.style.overflow = 'hidden'
  flashSaleSetCreateSubmitState(true)
  try {
    const res = await axios.get('/api/admin/flash-sales/' + id)
    const campaign = res?.data?.data
    if (!campaign || !campaign.id) throw new Error('Không tải được dữ liệu flashsale')
    flashSaleEditingId = Number(campaign.id)
    const nameInput = document.getElementById('flashSaleNameInput')
    const startInput = document.getElementById('flashSaleStartInput')
    const endInput = document.getElementById('flashSaleEndInput')
    if (nameInput) nameInput.value = String(campaign.name || '')
    if (startInput) startInput.value = flashSaleNormalizeDateTime(campaign.start_at)
    if (endInput) endInput.value = flashSaleNormalizeDateTime(campaign.end_at)
    flashSaleCreateSelectedItems = Array.isArray(campaign.items) ? campaign.items.map((item) => flashSaleMapDetailItem(item)) : []
    flashSaleSyncModalMode()
    renderFlashSaleSelectedItems()
    loadFlashSaleProductPickerProducts()
  } catch (e) {
    closeFlashSaleCreateModal()
    const message = e && e.response && e.response.data && e.response.data.error ? e.response.data.error : (e && e.message ? e.message : 'Không thể tải chi tiết flashsale')
    showAdminToast(String(message), 'error')
  } finally {
    flashSaleSetCreateSubmitState(false)
  }
}

function closeFlashSaleCreateModal(event) {
  if (event && event.target && event.currentTarget && event.target !== event.currentTarget) return
  const modal = document.getElementById('createFlashSaleModal')
  if (modal) {
    modal.classList.add('hidden')
    modal.classList.remove('flex')
  }
  closeFlashSaleProductPickerModal()
  if (!document.querySelector('.modal-overlay:not(.hidden)')) document.body.style.overflow = ''
}

function loadSettingsWarehousePage() {
  const el = document.getElementById('settingsWarehouseContent')
  if (!el) return
}

let flashSaleAdminItems = []
let flashSaleAdminMeta = { status: 'all', total: 0 }
let flashSaleAdminFilter = 'all'

function flashSaleStatusChipClass(statusKey) {
  if (statusKey === 'active') return 'bg-emerald-100 text-emerald-700 border-emerald-200'
  if (statusKey === 'upcoming') return 'bg-sky-100 text-sky-700 border-sky-200'
  if (statusKey === 'ended') return 'bg-gray-100 text-gray-600 border-gray-200'
  return 'bg-rose-100 text-rose-700 border-rose-200'
}

function flashSaleStatusLabel(statusKey) {
  if (statusKey === 'active') return 'Đang diễn ra'
  if (statusKey === 'upcoming') return 'Sắp tới'
  if (statusKey === 'ended') return 'Đã kết thúc'
  return 'Đã vô hiệu hoá'
}

function escapeFlashSaleHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function renderFlashSaleAdminShell(list, meta) {
  const el = document.getElementById('flashsaleAdminShell')
  if (!el) return
  const rows = Array.isArray(list) ? list : []
  const statusLabel = meta && meta.status === 'active' ? 'Đang diễn ra' : meta && meta.status === 'upcoming' ? 'Sắp tới' : 'Tất cả trạng thái'
  if (!rows.length) {
    el.innerHTML =
      '<div class="w-full text-center py-12 text-gray-500">' +
        '<div class="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm text-pink-500">' +
          '<i class="fas fa-bolt text-xl"></i>' +
        '</div>' +
        '<p class="font-semibold text-gray-800">Chưa có flashsale nào ở trạng thái ' + escapeFlashSaleHtml(String(statusLabel).toLowerCase()) + '</p>' +
        '<p class="text-sm text-gray-500 mt-1">Bấm "Tạo flashsale" để thêm campaign mới.</p>' +
      '</div>'
    return
  }

  const tableRows = rows.map(function(item) {
    const statusKey = String((item && item.status_key) || (item && item.status && item.status.key) || 'disabled')
    const itemName = escapeFlashSaleHtml(String((item && item.name) || 'Flashsale'))
    const itemId = escapeFlashSaleHtml(String((item && item.id) || ''))
    const startAt = formatDateTimeVi(item && item.start_at)
    const endAt = formatDateTimeVi(item && item.end_at)
    const productCount = Number((item && item.product_count) || 0)
    const itemCount = Number((item && item.item_count) || 0)
    return '<tr class="border-t border-gray-100 hover:bg-pink-50/40 transition">' +
      '<td class="px-4 py-4 align-top">' +
        '<div class="font-semibold text-gray-900">' + itemName + '</div>' +
        '<div class="text-xs text-gray-500 mt-1">ID #' + itemId + '</div>' +
      '</td>' +
      '<td class="px-4 py-4 align-top text-center">' +
        '<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ' + flashSaleStatusChipClass(statusKey) + '">' +
          '<i class="fas fa-bolt"></i>' + flashSaleStatusLabel(statusKey) +
        '</span>' +
      '</td>' +
      '<td class="px-4 py-4 align-top text-gray-600">' + startAt + '</td>' +
      '<td class="px-4 py-4 align-top text-gray-600">' + endAt + '</td>' +
      '<td class="px-4 py-4 align-top text-center">' +
        '<div class="flex flex-col items-center gap-1">' +
          '<span class="font-bold text-gray-900">' + productCount + '</span>' +
          '<span class="text-xs text-gray-500">' + itemCount + ' cấu hình</span>' +
        '</div>' +
      '</td>' +
      '<td class="px-4 py-4 align-top text-center">' +
        '<button type="button" class="flashsale-shell-action-btn inline-flex items-center gap-2 rounded-xl border border-pink-200 bg-pink-50 px-3 py-2 text-xs font-semibold text-pink-600 hover:bg-pink-100 transition" data-flashsale-id="' + itemId + '">' +
          '<i class="fas fa-pen-to-square"></i>Xem/Sửa' +
        '</button>' +
      '</td>' +
    '</tr>'
  }).join('')

  el.innerHTML =
    '<div class="w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">' +
      '<div class="overflow-x-auto">' +
        '<table class="min-w-full text-sm">' +
          '<thead class="bg-gray-50 text-gray-500">' +
            '<tr>' +
              '<th class="px-4 py-3 text-left font-semibold">Tên khuyến mãi</th>' +
              '<th class="px-4 py-3 text-center font-semibold">Trạng thái</th>' +
              '<th class="px-4 py-3 text-left font-semibold">Thời gian bắt đầu</th>' +
              '<th class="px-4 py-3 text-left font-semibold">Thời gian kết thúc</th>' +
              '<th class="px-4 py-3 text-center font-semibold">Sản phẩm</th>' +
              '<th class="px-4 py-3 text-center font-semibold">Hành động</th>' +
            '</tr>' +
          '</thead>' +
          '<tbody>' + tableRows + '</tbody>' +
        '</table>' +
      '</div>' +
    '</div>'

  document.querySelectorAll('.flashsale-shell-action-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = Number(btn.getAttribute('data-flashsale-id') || 0)
      if (!Number.isFinite(id) || id <= 0) return
      openFlashSaleEditModal(id)
    })
  })
}

async function loadFlashSaleAdmin() {
  const el = document.getElementById('flashsaleAdminShell')
  if (!el) return
  el.innerHTML = '<div class="py-12 text-center text-gray-400"><i class="fas fa-spinner fa-spin text-3xl"></i></div>'
  const createBtn = document.getElementById('createFlashSaleBtn')
  if (createBtn && !createBtn.dataset.bound) {
    createBtn.dataset.bound = '1'
    createBtn.addEventListener('click', () => openFlashSaleCreateModal())
  }
  document.querySelectorAll('.flashsale-filter-btn').forEach((btn) => {
    if (btn.dataset.bound === '1') return
    btn.dataset.bound = '1'
    btn.addEventListener('click', () => {
      const nextStatus = String(btn.dataset.status || 'all')
      flashSaleAdminFilter = nextStatus
      document.querySelectorAll('.flashsale-filter-btn').forEach((elBtn) => {
        const active = String(elBtn.dataset.status || 'all') === nextStatus
        elBtn.classList.toggle('active', active)
        elBtn.classList.toggle('bg-pink-50', active)
        elBtn.classList.toggle('text-pink-600', active)
        elBtn.classList.toggle('border-pink-200', active)
        elBtn.classList.toggle('bg-white', !active)
        elBtn.classList.toggle('text-gray-600', !active)
        elBtn.classList.toggle('border-gray-200', !active)
      })
      loadFlashSaleAdmin()
    })
  })
  try {
    const res = await axios.get('/api/admin/flash-sales', {
      params: { status: flashSaleAdminFilter }
    })
    flashSaleAdminItems = Array.isArray(res.data?.data) ? res.data.data : []
    flashSaleAdminMeta = res.data?.meta || { status: flashSaleAdminFilter, total: flashSaleAdminItems.length }
    renderFlashSaleAdminShell(flashSaleAdminItems, flashSaleAdminMeta)
  } catch (e) {
    el.innerHTML = '<div class="py-12 text-center text-red-400"><i class="fas fa-triangle-exclamation text-3xl mb-2"></i><p>Lỗi tải dữ liệu Flashsale</p></div>'
  }
}

// ── FEATURED PRODUCTS ────────────────────────────
let allProductsForFeatured = []
let featuredOrderMap = {} // { productId: displayOrder }

async function loadFeaturedAdmin() {
  const listEl = document.getElementById('featuredProductsList')
  listEl.innerHTML = '<div class="py-12 text-center text-gray-400"><i class="fas fa-spinner fa-spin text-3xl"></i></div>'
  try {
    const res = await axios.get('/api/admin/products')
    allProductsForFeatured = res.data.data || []
    // Build orderMap from existing data
    featuredOrderMap = {}
    allProductsForFeatured.forEach(p => {
      if (p.is_featured) featuredOrderMap[p.id] = p.display_order || 0
    })
    renderFeaturedProductsList(allProductsForFeatured)
    updateFeaturedPreview()
  } catch(e) {
    listEl.innerHTML = '<div class="py-12 text-center text-red-400">Lỗi tải dữ liệu</div>'
  }
}

function filterFeaturedProducts() {
  const q = document.getElementById('featuredSearch').value.toLowerCase()
  const filtered = allProductsForFeatured.filter(p =>
    !q || p.name.toLowerCase().includes(q) || (p.brand||'').toLowerCase().includes(q)
  )
  renderFeaturedProductsList(filtered)
}

function renderFeaturedProductsList(products) {
  const listEl = document.getElementById('featuredProductsList')
  if (!products.length) {
    listEl.innerHTML = '<div class="py-12 text-center text-gray-400"><i class="fas fa-box-open text-4xl mb-3"></i><p>Không có sản phẩm nào</p></div>'
    return
  }

  // Sort: featured first (by display_order), then non-featured
  const sorted = [...products].sort((a,b) => {
    if (a.is_featured && !b.is_featured) return -1
    if (!a.is_featured && b.is_featured) return 1
    return (a.display_order||0) - (b.display_order||0)
  })

  listEl.innerHTML = sorted.map(p => {
    const isFeatured = !!p.is_featured
    const order = featuredOrderMap[p.id] ?? (p.display_order || 0)
    return \`
    <div class="featured-product-row flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition \${isFeatured ? 'bg-amber-50/60 border-l-4 border-amber-400' : ''}" data-id="\${p.id}">
      <!-- Checkbox -->
      <div class="flex-none">
        <label class="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" \${isFeatured ? 'checked' : ''} onchange="toggleFeaturedCheck(\${p.id}, this.checked)"
            class="sr-only peer">
          <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-400"></div>
        </label>
      </div>
      <!-- Thumbnail -->
      <div class="flex-none">
        <img src="\${p.thumbnail || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=80'}" alt="\${p.name}"
          class="w-14 h-16 object-cover rounded-xl shadow-sm border-2 \${isFeatured ? 'border-amber-300' : 'border-gray-200'}"
          onerror="this.src='https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=80'">
      </div>
      <!-- Info -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          \${isFeatured ? '<span class="text-xs bg-amber-400 text-white px-2 py-0.5 rounded-full font-semibold">⭐ Nổi bật</span>' : ''}
          \${p.brand ? \`<span class="text-xs text-pink-500 font-medium">\${p.brand}</span>\` : ''}
        </div>
        <p class="font-semibold text-gray-800 text-sm mt-0.5 truncate">\${p.name}</p>
        <p class="text-xs text-pink-600 font-bold">\${new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND'}).format(p.price)}</p>
      </div>
      <!-- Order Input (only if featured) -->
      <div class="flex-none w-32 \${isFeatured ? '' : 'opacity-30 pointer-events-none'}">
        <label class="block text-xs text-gray-500 mb-1 text-center">Thứ tự</label>
        <input type="number" min="1" max="99" value="\${order || 1}"
          id="order-\${p.id}"
          onchange="updateFeaturedOrder(\${p.id}, this.value)"
          class="w-full border-2 border-amber-200 rounded-xl px-3 py-1.5 text-sm text-center font-bold focus:outline-none focus:border-amber-400 bg-white">
      </div>
      <!-- Badge Status -->
      <div class="flex-none">
        <span class="text-xs px-2 py-1 rounded-full \${p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}">
          \${p.is_active ? '● Đang bán' : '○ Đã ẩn'}
        </span>
      </div>
    </div>\`
  }).join('')
}

function toggleFeaturedCheck(id, checked) {
  // Update local state
  const prod = allProductsForFeatured.find(p => p.id === id)
  if (prod) prod.is_featured = checked ? 1 : 0
  
  if (checked) {
    // Auto-assign next order if not set
    const maxOrder = Math.max(0, ...Object.values(featuredOrderMap))
    featuredOrderMap[id] = maxOrder + 1
  } else {
    delete featuredOrderMap[id]
  }
  
  // Re-render
  const q = document.getElementById('featuredSearch').value.toLowerCase()
  const filtered = q ? allProductsForFeatured.filter(p => p.name.toLowerCase().includes(q) || (p.brand||'').toLowerCase().includes(q)) : allProductsForFeatured
  renderFeaturedProductsList(filtered)
  updateFeaturedPreview()
}

function updateFeaturedOrder(id, val) {
  featuredOrderMap[id] = parseInt(val) || 1
  updateFeaturedPreview()
}

function updateFeaturedPreview() {
  const featured = allProductsForFeatured
    .filter(p => p.is_featured)
    .sort((a,b) => (featuredOrderMap[a.id]||0) - (featuredOrderMap[b.id]||0))

  const countEl = document.getElementById('featuredCount')
  countEl.innerHTML = \`<i class="fas fa-star mr-1"></i>\${featured.length} sản phẩm nổi bật\`

  const strip = document.getElementById('featuredPreviewStrip')
  const previewItems = document.getElementById('featuredPreviewItems')

  if (!featured.length) {
    strip.classList.add('hidden')
    return
  }
  strip.classList.remove('hidden')
  previewItems.innerHTML = featured.map((p, i) => \`
    <div class="flex-none flex flex-col items-center gap-1" style="min-width:72px">
      <div class="relative">
        <img src="\${p.thumbnail || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=80'}" alt="\${p.name}"
          class="w-16 h-20 object-cover rounded-xl border-2 border-amber-300 shadow-sm"
          onerror="this.src='https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=80'">
        <span class="absolute -top-1 -left-1 w-5 h-5 bg-amber-400 text-white text-xs font-bold rounded-full flex items-center justify-center">\${i+1}</span>
      </div>
      <p class="text-xs text-gray-600 text-center leading-tight w-16 truncate">\${p.name}</p>
    </div>
  \`).join('')
}

async function saveFeaturedOrder() {
  const btn = document.getElementById('saveFeaturedBtn')
  btn.disabled = true
  btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Đang lưu...'
  
  try {
    const promises = allProductsForFeatured.map(p => {
      const isFeatured = !!p.is_featured
      const order = featuredOrderMap[p.id] || 0
      return axios.patch('/api/admin/products/' + p.id + '/featured', {
        is_featured: isFeatured,
        display_order: order
      })
    })
    await Promise.all(promises)
    showAdminToast('Đã lưu sản phẩm nổi bật thành công!', 'success')
    loadFeaturedAdmin()
  } catch(e) {
    showAdminToast('Lỗi lưu dữ liệu: ' + (e.response?.data?.error || e.message), 'error')
  } finally {
    btn.disabled = false
    btn.innerHTML = '<i class="fas fa-save"></i>Lưu thứ tự'
  }
}

// ── BANNERS ──────────────────────────────────────
async function loadSettingsAdmin() {
  try {
    const pickupRes = await axios.get('/api/admin/ghtk/pickup-config')
    const pickupCfg = pickupRes.data.data || {}
    fillGhtkPickupConfig(pickupCfg)
    await syncGhtkPickupAddresses(true, pickupCfg.pickAddressId || '')
  } catch (e) {
    showAdminToast('Lỗi tải dữ liệu cài đặt kho GHTK', 'error')
  }
}

function fillGhtkPickupConfig(cfg) {
  document.getElementById('ghtkPickupAddressId').value = cfg.pickAddressId || ''
  document.getElementById('ghtkPickName').value = cfg.pickName || ''
  document.getElementById('ghtkPickTel').value = cfg.pickTel || ''
  document.getElementById('ghtkPickAddress').value = cfg.pickAddress || ''
  document.getElementById('ghtkPickProvince').value = cfg.pickProvince || ''
  document.getElementById('ghtkPickDistrict').value = cfg.pickDistrict || ''
  document.getElementById('ghtkPickWard').value = cfg.pickWard || ''
}

function renderGhtkPickupAddressOptions(selectedId = '') {
  const select = document.getElementById('ghtkPickupAddressId')
  if (!select) return
  const options = ['<option value="">-- Chọn kho đồng bộ --</option>']
  ghtkPickupAddresses.forEach(item => {
    const text = [item.pick_name || 'Kho', item.full_address || '', item.pick_tel || ''].filter(Boolean).join(' | ')
    options.push('<option value="' + (item.pick_address_id || '') + '">' + text + '</option>')
  })
  select.innerHTML = options.join('')
  select.value = selectedId || ''
}

function applySelectedGhtkWarehouse() {
  const selectedId = document.getElementById('ghtkPickupAddressId').value
  if (!selectedId) return
  const found = ghtkPickupAddresses.find(item => String(item.pick_address_id) === String(selectedId))
  if (!found) return
  if (found.pick_name) document.getElementById('ghtkPickName').value = found.pick_name
  if (found.pick_tel) document.getElementById('ghtkPickTel').value = found.pick_tel
  if (found.pick_address) document.getElementById('ghtkPickAddress').value = found.pick_address
  if (found.pick_province) document.getElementById('ghtkPickProvince').value = found.pick_province
  if (found.pick_district) document.getElementById('ghtkPickDistrict').value = found.pick_district
  if (found.pick_ward) document.getElementById('ghtkPickWard').value = found.pick_ward
}

async function syncGhtkPickupAddresses(silent = false, selectedId = '') {
  const btn = document.getElementById('syncGhtkPickupBtn')
  const currentSelected = selectedId || document.getElementById('ghtkPickupAddressId').value
  btn.disabled = true
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang đồng bộ...'
  try {
    const res = await axios.get('/api/admin/ghtk/pickup-addresses')
    ghtkPickupAddresses = res.data.data || []
    renderGhtkPickupAddressOptions(currentSelected)
    document.getElementById('ghtkPickupHint').textContent = ghtkPickupAddresses.length
      ? ('Đã đồng bộ ' + ghtkPickupAddresses.length + ' kho từ GHTK.')
      : 'Chưa tìm thấy kho trên GHTK.'
    if (!silent) showAdminToast('Đã đồng bộ kho GHTK', 'success')
  } catch (e) {
    const msg = e.response?.data?.error || e.message || 'SYNC_GHTK_FAILED'
    if (!silent) showAdminToast('Đồng bộ kho thất bại: ' + msg, 'error')
    document.getElementById('ghtkPickupHint').textContent = 'Không đồng bộ được kho từ GHTK: ' + msg
  } finally {
    btn.disabled = false
    btn.innerHTML = '<i class="fas fa-rotate"></i> Đồng bộ kho từ GHTK'
  }
}

async function saveGhtkPickupConfig() {
  const btn = document.getElementById('saveGhtkPickupBtn')
  const payload = {
    pick_address_id: document.getElementById('ghtkPickupAddressId').value.trim(),
    pick_name: document.getElementById('ghtkPickName').value.trim(),
    pick_tel: document.getElementById('ghtkPickTel').value.trim(),
    pick_address: document.getElementById('ghtkPickAddress').value.trim(),
    pick_province: document.getElementById('ghtkPickProvince').value.trim(),
    pick_district: document.getElementById('ghtkPickDistrict').value.trim(),
    pick_ward: document.getElementById('ghtkPickWard').value.trim()
  }
  btn.disabled = true
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang lưu...'
  try {
    await axios.put('/api/admin/ghtk/pickup-config', payload)
    showAdminToast('Đã lưu cấu hình kho GHTK', 'success')
  } catch (e) {
    showAdminToast('Lưu cấu hình kho thất bại', 'error')
  } finally {
    btn.disabled = false
    btn.innerHTML = '<i class="fas fa-save"></i>Lưu cấu hình kho GHTK'
  }
}


// ── DASHBOARD ─────────────────────────────────────
async function loadDashboard() {
  try {
    const res = await axios.get('/api/admin/stats')
    const d = res.data.data
    document.getElementById('statProducts').textContent = d.totalProducts
    document.getElementById('statOrders').textContent = d.totalOrders
    document.getElementById('statPending').textContent = d.pendingOrders
    document.getElementById('statRevenue').textContent = fmtPrice(d.revenue)
    
    const shippingQueueOrders = Number(d.shippingQueueOrders || 0)
    if (shippingQueueOrders > 0) {
      document.getElementById('pendingBadge').textContent = shippingQueueOrders
      document.getElementById('pendingBadge').classList.remove('hidden')
    }
    
    const recent = (d.recentOrders || []).filter(o => !isInternalTestOrder(o))
    if (!recent.length) {
      document.getElementById('recentOrdersTable').innerHTML = '<div class="text-center py-8 text-gray-400">Chưa có đơn hàng nào</div>'
      return
    }
    document.getElementById('recentOrdersTable').innerHTML = '<table class="w-full text-sm"><thead><tr class="border-b text-gray-500"><th class="py-2 text-left pr-4">Mã ĐH</th><th class="py-2 text-left pr-4">Khách hàng</th><th class="py-2 text-right pr-4">Còn phải thu</th><th class="py-2 text-center">Trạng thái</th></tr></thead><tbody>' +
      recent.map(o => '<tr class="border-b last:border-0"><td class="py-2 pr-4 font-mono text-xs text-blue-600">' + o.order_code + '</td><td class="py-2 pr-4">' + displayCustomerName(o.customer_name) + '</td><td class="py-2 pr-4 text-right font-semibold">' + fmtPrice(getOrderAmountDue(o)) + '</td><td class="py-2 text-center"><span class="badge badge-' + o.status + '">' + statusLabel(o.status) + '</span></td></tr>').join('') +
      '</tbody></table>'
  } catch(e) {
    if (e && e.response && e.response.status === 401) {
      showAdminToast('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại', 'error')
      setTimeout(() => { window.location.href = '/admin/login' }, 400)
      return
    }
    document.getElementById('recentOrdersTable').innerHTML = '<div class="text-center py-8 text-red-400">Lỗi tải dữ liệu dashboard</div>'
    console.error(e)
  }
}

// ── PRODUCTS ─────────────────────────────────────
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
    const msg = e?.response?.data?.error || e?.message || 'Lỗi tải dữ liệu'
    grid.innerHTML = '<div class="col-span-4 text-center py-12 text-red-400">Lỗi tải dữ liệu</div>'
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
          \${p.is_featured ? '<span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-400 text-white">⭐ Hot</span>' : ''}
          \${p.is_trending ? '<span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500 text-white">🔥 Trend</span>' : ''}
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
  if (!confirm('Bạn chắc chắn muốn xoá sản phẩm này?')) return
  try {
    await axios.delete('/api/admin/products/' + id)
    loadAdminProducts()
    showAdminToast('Đã xoá sản phẩm', 'success')
  } catch(e) { showAdminToast('Lỗi xoá sản phẩm', 'error') }
}

// ── PRODUCT MODAL ─────────────────────────────────
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
      const msg = e?.response?.data?.error || e?.message || 'Lỗi tải sản phẩm'
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

// ── GALLERY ───────────────────────────────────────
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

// ── TAGS (Colors/Sizes) ────────────────────────────
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

// ── ORDERS ────────────────────────────────────────
async function loadAdminOrders() {
  document.getElementById('ordersTable').innerHTML = '<tr><td colspan="7" class="text-center py-12 text-gray-400"><i class="fas fa-spinner fa-spin text-2xl"></i></td></tr>'
  document.getElementById('ordersMobileList').innerHTML = '<div class="py-12 text-center text-gray-400"><i class="fas fa-spinner fa-spin text-2xl"></i></div>'
  try {
    const params = new URLSearchParams()
    params.set('shipping_queue', '1')
    const res = await axios.get('/api/admin/orders?' + params.toString())
    adminOrders = res.data.data || []
    const validIds = new Set(adminOrders.map(o => Number(o.id)))
    selectedOrderIds = new Set(Array.from(selectedOrderIds).filter(id => validIds.has(Number(id))))
    filterOrders()
  } catch(e) {
    if (e && e.response && e.response.status === 401) {
      showAdminToast('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại', 'error')
      setTimeout(() => { window.location.href = '/admin/login' }, 400)
      return
    }
    const msg = e?.response?.data?.error || e?.message || 'Lỗi tải dữ liệu'
    document.getElementById('ordersTable').innerHTML = '<tr><td colspan="7" class="text-center py-8 text-red-400">Lỗi tải dữ liệu</td></tr>'
    document.getElementById('ordersMobileList').innerHTML = '<div class="py-8 text-center text-red-400">Lỗi tải dữ liệu</div>'
    showAdminToast(msg, 'error')
    console.error('loadAdminOrders error:', e)
  }
}

function setOrdersViewMode(mode) {
  ordersViewMode = mode === 'waiting_ship' ? 'waiting_ship' : 'to_arrange'
  const modeSelect = document.getElementById('ordersViewModeSelect')
  if (modeSelect) modeSelect.value = ordersViewMode
  currentOrdersPage = 1
  selectedOrderIds.clear()
  filterOrders()
}

function setOrdersPage(page) {
  const numericPage = Number(page) || 1
  currentOrdersPage = Math.max(1, numericPage)
}

function updateOrdersModeButtons(counters) {
  const modeSelect = document.getElementById('ordersViewModeSelect')
  const arrangeOption = document.getElementById('ordersViewModeToArrangeOption')
  const waitingOption = document.getElementById('ordersViewModeWaitingOption')

  if (arrangeOption) arrangeOption.textContent = 'Sắp xếp vận chuyển (' + String(counters.toArrange || 0) + ')'
  if (waitingOption) waitingOption.textContent = 'Đang chờ vận chuyển (' + String(counters.waitingShip || 0) + ')'
  if (modeSelect) modeSelect.value = ordersViewMode
}

function filterOrders() {
  const status = document.getElementById('orderStatusFilter').value
  const q = String((document.getElementById('orderSearch') || {}).value || '').toLowerCase()
  const sourceOrders = adminOrders.filter(o => !isInternalTestOrder(o))

  const activeOrders = sourceOrders.filter(o => {
    const st = String(o.status || '').toLowerCase()
    return st !== 'shipping' && st !== 'done' && st !== 'cancelled'
  })
  const toArrangeCount = activeOrders.filter(o => Number(o.shipping_arranged || 0) !== 1).length
  const waitingShipCount = activeOrders.filter(o => Number(o.shipping_arranged || 0) === 1).length
  updateOrdersModeButtons({ toArrange: toArrangeCount, waitingShip: waitingShipCount })

  const byView = sourceOrders.filter(o => {
    const st = String(o.status || '').toLowerCase()
    if (st === 'shipping' || st === 'done' || st === 'cancelled') return false
    if (ordersViewMode === 'waiting_ship') return Number(o.shipping_arranged || 0) === 1
    return Number(o.shipping_arranged || 0) !== 1
  })
  const byStatus = status === 'all'
    ? byView
    : byView.filter(o => String(o.status || '').toLowerCase() === status)
  const filtered = q ? byStatus.filter(o =>
    String(o.customer_name || '').toLowerCase().includes(q) ||
    String(o.customer_phone || '').includes(q) ||
    String(o.order_code || '').toLowerCase().includes(q) ||
    String(o.product_name || '').toLowerCase().includes(q)
  ) : byStatus
  
  filteredAdminOrders = filtered
  const totalPages = Math.max(1, Math.ceil(filtered.length / ORDERS_PAGE_SIZE))
  if (currentOrdersPage > totalPages) currentOrdersPage = totalPages
  const pageStart = (currentOrdersPage - 1) * ORDERS_PAGE_SIZE
  paginatedAdminOrders = filtered.slice(pageStart, pageStart + ORDERS_PAGE_SIZE)
  renderOrdersTable(paginatedAdminOrders)
  renderOrdersPagination(filtered.length, totalPages)
  const total = filtered.reduce((s,o) => s + getOrderAmountDue(o), 0)
  const modeLabel = ordersViewMode === 'waiting_ship' ? 'Đang chờ vận chuyển' : 'Sắp xếp vận chuyển'
  document.getElementById('orderStats').textContent = \`\${modeLabel}: \${filtered.length} đơn – Tổng: \${fmtPrice(total)}\`
  updateOrderSelectionUI()
}

function buildOrderSkuText(order) {
  const color = String(order?.color || '').trim()
  const size = String(order?.size || '').trim()
  const bits = []
  if (color) bits.push(color)
  if (size) bits.push('Size ' + size)
  return bits.length ? bits.join(' / ') : 'N/A'
}

function getOrderItemImage(order) {
  const selectedColorImage = String(order?.selected_color_image || '').trim()
  if (selectedColorImage) return selectedColorImage
  const fallback = String(order?.product_thumbnail || order?.thumbnail || '').trim()
    || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=80'
  const rawImages = String(order?.product_images || '').trim()
  const rawColors = Array.isArray(order?.product_colors) ? order.product_colors : safeJson(order?.product_colors || '[]')
  const selectedColor = String(order?.color || '').trim()
  if (!rawImages || !selectedColor) return fallback
  let images = []
  try { images = JSON.parse(rawImages || '[]') } catch (_) { images = [] }
  if (!Array.isArray(images) || !images.length) return fallback
  if (Array.isArray(rawColors) && rawColors.length) {
    const idx = rawColors.findIndex((c) => {
      const name = typeof c === 'string' ? c : String(c?.name || c?.label || '')
      return String(name || '').trim().toLowerCase() === selectedColor.toLowerCase()
    })
    if (idx >= 0 && String(images[idx] || '').trim()) return String(images[idx]).trim()
  }
  const first = images.find((img) => String(img || '').trim())
  return first ? String(first).trim() : fallback
}

function getRowPrimaryActionMeta() {
  if (ordersViewMode === 'waiting_ship') {
    return {
      label: 'In giấy tờ',
      className: 'bg-blue-600 hover:bg-blue-700 text-white border border-blue-600',
      icon: 'fa-print'
    }
  }
  return {
    label: 'Sắp xếp vận chuyển và in',
    className: 'bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-600',
    icon: 'fa-truck-fast'
  }
}

function renderOrderRowActionControls(order, compact = false) {
  const meta = getRowPrimaryActionMeta()
  const orderId = Number(order.id)
  const compactLabel = compact
    ? (ordersViewMode === 'waiting_ship' ? 'In giấy tờ' : 'Sắp xếp')
    : meta.label
  const wrapClass = compact
    ? 'flex flex-col gap-2 items-stretch w-full min-w-0'
    : 'flex flex-col gap-2 items-stretch w-full max-w-[240px] mx-auto'
  const buttonClass = compact
    ? 'w-full inline-flex items-center justify-center gap-1 rounded-lg px-2 py-2 text-[10px] leading-tight font-semibold whitespace-normal break-words text-center flex-wrap transition ' + meta.className
    : 'w-full inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-[11px] font-semibold whitespace-nowrap transition ' + meta.className
  return ''
    + '<div class="' + wrapClass + '">'
    +   '<button type="button"'
    +     ' onclick="handleOrderPrimaryAction(' + orderId + ')"'
    +     ' class="' + buttonClass + '">'
    +     '<i class="fas ' + meta.icon + ' text-[11px]"></i>'
    +     '<span>' + compactLabel + '</span>'
    +   '</button>'
    +   '<select onchange="handleOrderSecondaryAction(' + orderId + ', this)" class="w-full min-w-0 text-xs border rounded-lg px-2 py-2 focus:outline-none bg-white text-gray-700 border-gray-300">'
    +     '<option value="">Thao tác khác</option>'
    +     '<option value="cancelled">Hủy</option>'
    +   '</select>'
    + '</div>'
}

function renderOrdersTable(orders) {
  const empty = document.getElementById('ordersEmpty')
  if (!orders.length) {
    document.getElementById('ordersTable').innerHTML = ''
    document.getElementById('ordersMobileList').innerHTML = ''
    empty.classList.remove('hidden')
    updateOrderSelectionUI()
    return
  }
  empty.classList.add('hidden')
  
  document.getElementById('ordersTable').innerHTML = orders.map(o => \`
  <tr class="table-row border-b cursor-pointer">
    <td class="px-3 py-3 text-center w-10 min-w-10">
      <input type="checkbox" class="w-4 h-4 rounded border-gray-300 text-pink-500 focus:ring-pink-400" \${selectedOrderIds.has(Number(o.id)) ? 'checked' : ''} onchange="toggleOrderSelection(\${o.id}, this.checked)">
    </td>
    <td class="px-4 py-3 w-[360px] min-w-[360px] align-top">
      <div class="flex items-start gap-3 max-w-[360px]">
        <img src="\${getOrderItemImage(o)}" alt="\${o.product_name || 'product'}" class="w-12 h-12 rounded-lg object-cover border border-gray-200 bg-gray-100 flex-none" onerror="this.src='https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=80'">
        <div class="min-w-0 max-w-[300px] space-y-0.5">
          <div>
            <button type="button"
              onclick="copyOrderCode(decodeURIComponent('\${encodeURIComponent(String(o.order_code || '').trim())}')); return false;"
              title="Bấm để copy mã đơn hàng"
              class="font-mono text-[11px] text-blue-600 font-semibold hover:text-blue-700 transition">
              Mã ĐH: \${o.order_code}
            </button>
          </div>
          <p class="text-sm text-gray-800 font-semibold truncate max-w-[290px]">\${o.product_name}</p>
          <div class="text-xs text-gray-500 flex items-center gap-1.5 flex-wrap">
            <span>\${displayCustomerName(o.customer_name)}</span>
            <span> • </span>
            <button type="button"
              onclick="copyPhoneNumber(decodeURIComponent('\${encodeURIComponent(String(o.customer_phone || '').trim())}')); return false;"
              title="Bấm để copy số điện thoại"
              class="hover:text-blue-600 no-underline transition">\${o.customer_phone}</button>
            <button type="button"
              onclick="showOrderDetail(\${o.id})"
              class="ml-1 inline-flex items-center justify-center w-6 h-6 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
              title="Chi tiết">
              <i class="fas fa-eye text-[10px]"></i>
            </button>
          </div>
          <p class="text-xs text-gray-500">SKU: \${buildOrderSkuText(o)}</p>
          \${String(o.shipping_tracking_code || '').trim()
            ? \`<div>
                <button type="button"
                  onclick="copyTrackingCode(decodeURIComponent('\${encodeURIComponent(String(o.shipping_tracking_code || '').trim())}')); return false;"
                  title="Bấm để copy mã đầy đủ: \${String(o.shipping_tracking_code || '').trim()}"
                  class="font-mono text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg font-semibold hover:bg-emerald-100 transition">
                  Mã vận đơn: \${getTrackingDisplayCode(o.shipping_tracking_code)}
                </button>
              </div>\`
            : ''}
        </div>
      </div>
    </td>
    <td class="px-2 py-3 text-center w-12 align-top">
      <span class="inline-flex min-w-6 justify-center text-[11px] \${Number(o.quantity || 1) > 1 ? 'font-bold text-gray-900 bg-amber-100 border border-amber-300 shadow-sm' : 'font-semibold text-gray-700 bg-gray-100 border border-gray-200'} rounded-md px-1.5 py-0.5">\${o.quantity || 1}</span>
    </td>
    <td class="px-4 py-3 text-right w-[150px] min-w-[150px]">
      <p class="font-bold text-gray-800">\${fmtPrice(getOrderAmountDue(o))}</p>
      \${o.discount_amount > 0 ? \`<p class="text-xs text-green-600">-\${fmtPrice(o.discount_amount)}</p>\` : ''}
      <p class="mt-1"><span class="text-[11px] px-2 py-0.5 rounded-full \${paymentStatusClass(o.payment_status)}">\${paymentStatusLabel(o.payment_status)}</span></p>
      <div class="mt-1 flex justify-end">\${paymentMethodTagHTML(o.payment_method, o.payment_status)}</div>
    </td>
    <td class="px-4 py-3 text-center hidden lg:table-cell w-[120px] min-w-[120px]">
      \${o.voucher_code ? \`<span class="font-mono text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-lg font-semibold">\${o.voucher_code}</span>\` : '<span class="text-gray-300 text-xs">—</span>'}
    </td>
    <td class="px-4 py-3 text-center align-top w-[240px] min-w-[240px]">
      \${renderOrderRowActionControls(o)}
    </td>
  </tr>\`).join('')
  renderOrdersMobileList(orders)
  updateOrderSelectionUI()
}

function renderOrdersMobileList(orders) {
  const wrap = document.getElementById('ordersMobileList')
  wrap.innerHTML = '<div class="orders-mobile-stack">' + orders.map(o => {
    const tracking = String(o.shipping_tracking_code || '').trim()
    const qtyClass = Number(o.quantity || 1) > 1
      ? 'font-bold text-gray-900 bg-amber-100 border border-amber-300 shadow-sm'
      : 'font-semibold text-gray-700 bg-gray-100 border border-gray-200'
    const voucherHtml = o.voucher_code
      ? '<span class="font-mono text-[11px] bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded-lg font-semibold">' + o.voucher_code + '</span>'
      : '<span class="text-gray-300 text-xs">—</span>'
    return \`
      <div class="orders-mobile-card">
        <div class="mobile-order-main flex items-start gap-2.5">
          <input type="checkbox" class="mt-1 w-4 h-4 rounded border-gray-300 text-pink-500 focus:ring-pink-400 shrink-0" \${selectedOrderIds.has(Number(o.id)) ? 'checked' : ''} onchange="toggleOrderSelection(\${o.id}, this.checked)">
          <div class="min-w-0 flex-1 space-y-2.5">
            <div class="mobile-order-media flex items-start gap-3 min-w-0">
              <img src="\${getOrderItemImage(o)}" alt="\${o.product_name || 'product'}" class="w-14 h-14 rounded-xl object-cover border border-gray-200 bg-gray-100 flex-none" onerror="this.src='https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=80'">
              <div class="min-w-0 flex-1">
                <div class="flex items-start justify-between gap-2">
                  <button type="button"
                    onclick="copyOrderCode(decodeURIComponent('\${encodeURIComponent(String(o.order_code || '').trim())}')); return false;"
                    class="font-mono text-[11px] text-blue-600 font-semibold truncate max-w-[150px] text-left">Mã ĐH: \${o.order_code}</button>
                  <span class="inline-flex min-w-7 justify-center text-[11px] \${qtyClass} rounded-md px-2 py-0.5 shrink-0">x\${o.quantity || 1}</span>
                </div>
                <p class="mt-1 text-sm font-semibold text-gray-900 leading-5 truncate">\${o.product_name}</p>
                <p class="mt-1 text-xs text-gray-500 truncate">SKU: \${buildOrderSkuText(o)}</p>
                <div class="mt-1.5 text-xs text-gray-500 flex items-center gap-1.5 flex-wrap">
                  <span>\${displayCustomerName(o.customer_name)}</span>
                  <span>•</span>
                  <button type="button"
                    onclick="copyPhoneNumber(decodeURIComponent('\${encodeURIComponent(String(o.customer_phone || '').trim())}')); return false;"
                    class="hover:text-blue-600 no-underline transition">\${o.customer_phone}</button>
                  <button type="button"
                    onclick="showOrderDetail(\${o.id})"
                    class="ml-1 inline-flex items-center justify-center w-6 h-6 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition shrink-0"
                    title="Chi tiết">
                    <i class="fas fa-eye text-[10px]"></i>
                  </button>
                </div>
                \${tracking
                  ? \`<div class="mt-1.5">
                      <button type="button"
                        onclick="copyTrackingCode(decodeURIComponent('\${encodeURIComponent(tracking)}')); return false;"
                        class="font-mono text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg font-semibold hover:bg-emerald-100 transition truncate max-w-full">Mã vận đơn: \${getTrackingDisplayCode(tracking)}</button>
                    </div>\`
                  : ''}
              </div>
            </div>
            <div class="mobile-order-meta grid grid-cols-2 gap-2 text-xs min-w-0">
              <div class="rounded-xl border border-gray-200 bg-white px-3 py-2">
                <p class="text-gray-400 uppercase tracking-wide text-[10px]">Tổng tiền</p>
                <p class="mt-1 text-sm font-bold text-gray-900">\${fmtPrice(getOrderAmountDue(o))}</p>
                <p class="mt-1"><span class="text-[11px] px-2 py-0.5 rounded-full \${paymentStatusClass(o.payment_status)}">\${paymentStatusLabel(o.payment_status)}</span></p>
              </div>
              <div class="rounded-xl border border-gray-200 bg-white px-3 py-2">
                <p class="text-gray-400 uppercase tracking-wide text-[10px]">Voucher</p>
                <div class="mt-1">\${voucherHtml}</div>
                <div class="mt-2">\${paymentMethodTagHTML(o.payment_method, o.payment_status)}</div>
              </div>
            </div>
            <div class="mobile-order-actions min-w-0">
              \${renderOrderRowActionControls(o, true)}
            </div>
          </div>
        </div>
      </div>\`
  }).join('') + '</div>'
}

function toggleOrderSelection(id, checked) {
  const n = Number(id)
  if (checked) selectedOrderIds.add(n)
  else selectedOrderIds.delete(n)
  updateOrderSelectionUI()
}

function toggleSelectAllOrders(checked) {
  paginatedAdminOrders.forEach(o => {
    const id = Number(o.id)
    if (checked) selectedOrderIds.add(id)
    else selectedOrderIds.delete(id)
  })
  renderOrdersTable(paginatedAdminOrders)
}

function jumpToOrdersPage(totalPages) {
  const input = document.getElementById('ordersPageInput')
  if (!input) return
  const numericPage = Number(input.value) || 1
  setOrdersPage(Math.min(totalPages, Math.max(1, numericPage)))
  selectedOrderIds.clear()
  filterOrders()
}

function renderOrdersPagination(totalCount, totalPages) {
  const wrap = document.getElementById('ordersPagination')
  if (!wrap) return
  if (totalCount <= ORDERS_PAGE_SIZE) {
    wrap.innerHTML = ''
    return
  }
  const start = totalCount ? ((currentOrdersPage - 1) * ORDERS_PAGE_SIZE) + 1 : 0
  const end = Math.min(totalCount, currentOrdersPage * ORDERS_PAGE_SIZE)
  const showJump = totalPages >= 4
  const jumpHtml = showJump
    ? '<div class="flex items-center gap-2">'
        + '<input id="ordersPageInput" type="number" min="1" max="' + totalPages + '" value="' + currentOrdersPage + '" onkeydown="if(event.keyCode===13){jumpToOrdersPage(' + totalPages + ')}" class="w-16 px-2 py-1.5 rounded-lg border border-gray-300 text-center text-sm focus:outline-none focus:border-pink-400">'
        + '<button type="button" onclick="jumpToOrdersPage(' + totalPages + ')" class="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition">Đi</button>'
      + '</div>'
    : ''
  wrap.innerHTML = ''
    + '<div class="flex flex-col gap-1">'
    +   '<div>Hiển thị ' + start + '–' + end + ' / ' + totalCount + ' đơn</div>'
    +   '<div class="text-xs text-gray-400 md:hidden">Trang ' + currentOrdersPage + '/' + totalPages + '</div>'
    + '</div>'
    + '<div class="flex flex-wrap items-center gap-2 justify-end">'
    +   '<button type="button" onclick="setOrdersPage(' + (currentOrdersPage - 1) + '); selectedOrderIds.clear(); filterOrders()" class="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition ' + (currentOrdersPage <= 1 ? 'opacity-50 pointer-events-none' : '') + '">Trước</button>'
    +   '<span class="hidden md:inline text-gray-600">Trang ' + currentOrdersPage + '/' + totalPages + '</span>'
    +   jumpHtml
    +   '<button type="button" onclick="setOrdersPage(' + (currentOrdersPage + 1) + '); selectedOrderIds.clear(); filterOrders()" class="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition ' + (currentOrdersPage >= totalPages ? 'opacity-50 pointer-events-none' : '') + '">Sau</button>'
    + '</div>'
}

function updateOrderSelectionUI() {
  const bulkBar = document.getElementById('ordersBulkActionBar')
  const bulkBtn = document.getElementById('bulkDeleteOrdersBtn')
  const bulkText = document.getElementById('bulkDeleteOrdersText')
  const arrangeBtn = document.getElementById('bulkArrangeShipBtn')
  const arrangeText = document.getElementById('bulkArrangeShipText')
  const selectAll = document.getElementById('ordersSelectAll')
  const shipBar = document.getElementById('shippingBulkActionBar')
  const shipBarText = document.getElementById('shippingBulkSelectedText')
  const visibleIds = paginatedAdminOrders.map(o => Number(o.id))
  const checkedVisible = visibleIds.filter(id => selectedOrderIds.has(id)).length
  const anySelectedVisible = checkedVisible > 0

  if (arrangeBtn) {
    const showArrange = ordersViewMode === 'to_arrange' && anySelectedVisible
    arrangeBtn.classList.toggle('hidden', !showArrange)
    arrangeBtn.classList.toggle('flex', showArrange)
  }
  if (arrangeText) {
    arrangeText.textContent = anySelectedVisible
      ? ('Sắp xếp vận chuyển (' + checkedVisible + ')')
      : 'Sắp xếp vận chuyển'
  }
  if (bulkBtn) {
    const showDelete = ordersViewMode !== 'waiting_ship' && anySelectedVisible
    bulkBtn.classList.toggle('hidden', !showDelete)
    bulkBtn.classList.toggle('flex', showDelete)
  }
  if (bulkBar) {
    const showBar = ordersViewMode === 'to_arrange' && anySelectedVisible
    bulkBar.classList.toggle('hidden', !showBar)
  }
  if (bulkText) {
    bulkText.textContent = anySelectedVisible ? ('Xoá đã chọn (' + checkedVisible + ')') : 'Xoá đã chọn'
  }
  if (shipBar) {
    const showShipBar = ordersViewMode === 'waiting_ship' && anySelectedVisible
    shipBar.classList.toggle('hidden', !showShipBar)
  }
  if (shipBarText) {
    shipBarText.textContent = 'Đã chọn ' + checkedVisible + ' đơn'
  }
  if (selectAll) {
    const allVisibleChecked = visibleIds.length > 0 && checkedVisible === visibleIds.length
    selectAll.checked = allVisibleChecked
    selectAll.indeterminate = checkedVisible > 0 && checkedVisible < visibleIds.length
  }
}

async function deleteSelectedOrders() {
  const ids = Array.from(selectedOrderIds)
  if (!ids.length) return
  if (!confirm('Xoá ' + ids.length + ' đơn đã chọn?')) return
  try {
    await Promise.all(ids.map(id => axios.delete('/api/admin/orders/' + id)))
    selectedOrderIds.clear()
    showAdminToast('Đã xoá ' + ids.length + ' đơn hàng', 'success')
    await loadAdminOrders()
  } catch (e) {
    showAdminToast('Lỗi xoá hàng loạt', 'error')
  }
}

async function arrangeSelectedForShipping() {
  const ids = paginatedAdminOrders.map(o => Number(o.id)).filter(id => selectedOrderIds.has(id))
  if (!ids.length) return
  try {
    const res = await axios.post('/api/admin/orders/arrange-shipping', { ids })
    const updated = Array.isArray(res.data?.updated) ? res.data.updated : []
    const failed = Array.isArray(res.data?.failed) ? res.data.failed : []
    arrangedOrdersForPrint = updated.map((o) => ({
      id: Number(o.id),
      order_code: String(o.order_code || ''),
      shipping_carrier: String(o.shipping_carrier || o.carrier || 'GHTK'),
      shipping_tracking_code: String(o.shipping_tracking_code || o.tracking_code || '').trim()
    }))
    arrangedFailedOrders = failed
    selectedOrderIds.clear()
    openArrangeSuccessModal(arrangedOrdersForPrint.length, failed)
    await loadAdminOrders()
  } catch (e) {
    showAdminToast('Lỗi sắp xếp vận chuyển', 'error')
  }
}

function printSelectedOrders() {
  const selected = paginatedAdminOrders.filter(o => selectedOrderIds.has(Number(o.id)))
  if (!selected.length) return
  const ghtkOrders = extractGHTKPrintableOrders(selected)
  if (!ghtkOrders.length) {
    showAdminToast('Chưa có mã vận đơn GHTK để in nhãn', 'warning')
    return
  }
  if (ghtkOrders.length < selected.length) {
    showAdminToast('Một số đơn chưa có mã vận đơn, chỉ in các đơn đã có mã GHTK', 'warning')
  }
  openGHTKLabelsPdf(ghtkOrders.map(o => Number(o.id)))
}

function openGHTKLabelsPdf(orderIds) {
  const ids = (orderIds || []).map((v) => Number(v)).filter((v) => Number.isFinite(v) && v > 0)
  if (!ids.length) return
  const url = '/api/admin/orders/ghtk/print-labels?ids=' + encodeURIComponent(ids.join(',')) + '&original=portrait&page_size=A6'
  const tab = window.open(url, '_blank')
  if (!tab) showAdminToast('Trình duyệt đang chặn mở PDF nhãn GHTK', 'error')
}

function openPrintOrdersPopup(selected) {
  if (!Array.isArray(selected) || !selected.length) return
  const rows = selected.map(o =>
    '<div class="order-card">'
    + '<div class="row"><strong>Mã đơn:</strong><span>' + (o.order_code || '') + '</span></div>'
    + '<div class="row"><strong>Khách:</strong><span>' + displayCustomerName(o.customer_name || '') + '</span></div>'
    + '<div class="row"><strong>SĐT:</strong><span>' + (o.customer_phone || '') + '</span></div>'
    + '<div class="row"><strong>Địa chỉ:</strong><span>' + (o.customer_address || '') + '</span></div>'
    + '<div class="row"><strong>Sản phẩm:</strong><span>' + (o.product_name || '') + ' x ' + (o.quantity || 0) + '</span></div>'
    + '<div class="row"><strong>Thanh toán:</strong><span>' + formatPaymentMethod(o.payment_method) + ' (' + paymentStatusLabel(o.payment_status) + ')</span></div>'
    + '<div class="row total"><strong>Cần thu:</strong><span>' + fmtPrice(getOrderAmountDue(o)) + '</span></div>'
    + '</div>'
  ).join('')

  const popup = window.open('', '_blank', 'width=1080,height=760')
  if (!popup) {
    showAdminToast('Trình duyệt đang chặn popup in đơn', 'error')
    return
  }
  popup.onload = function() {
    setTimeout(function() { popup.print() }, 120)
  }
  const html = '<!doctype html>'
    + '<html lang="vi">'
    + '<head>'
    + '<meta charset="UTF-8" />'
    + '<title>In đơn hàng loạt</title>'
    + '<style>'
    + 'body{font-family:Arial,sans-serif;margin:16px;color:#111827;}'
    + 'h1{margin:0 0 8px;font-size:22px;}'
    + '.meta{color:#6b7280;font-size:13px;margin-bottom:14px;}'
    + '.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;}'
    + '.order-card{border:1px solid #e5e7eb;border-radius:12px;padding:12px;break-inside:avoid;}'
    + '.row{display:flex;gap:6px;margin:5px 0;font-size:13px;}'
    + '.row strong{min-width:86px;}'
    + '.total{margin-top:8px;padding-top:8px;border-top:1px dashed #d1d5db;font-size:15px;}'
    + '@media print{body{margin:8px;}}'
    + '</style>'
    + '</head>'
    + '<body>'
    + '<h1>In đơn hàng loạt</h1>'
    + '<div class="meta">Số đơn: ' + selected.length + ' • In lúc: ' + new Date().toLocaleString('vi-VN') + '</div>'
    + '<div class="grid">' + rows + '</div>'
    + '</body></html>'
  popup.document.write(html)
  popup.document.close()
}

function extractGHTKPrintableOrders(rows) {
  const list = Array.isArray(rows) ? rows : []
  return list.filter((o) => {
    const carrier = String(o.shipping_carrier || o.carrier || '').toUpperCase()
    const tracking = String(o.shipping_tracking_code || o.tracking_code || '').trim()
    return carrier === 'GHTK' && !!tracking
  })
}

function mapArrangeErrorText(code) {
  if (code === 'ORDER_NOT_FOUND') return 'Không tìm thấy đơn'
  if (code === 'ORDER_CLOSED') return 'Đơn đã đóng/hủy'
  if (code === 'MISSING_GHTK_KEYS') return 'Thiếu GHTK_TOKEN hoặc GHTK_CLIENT_SOURCE'
  if (code === 'MISSING_GHTK_PICKUP_CONFIG') return 'Thiếu cấu hình địa chỉ lấy hàng GHTK'
  if (code === 'INVALID_CUSTOMER_ADDRESS_FORMAT') return 'Địa chỉ khách chưa hợp lệ và không có fallback'
  if (code === 'GHTK_TRACKING_EMPTY') return 'GHTK không trả mã vận đơn'
  return String(code || 'Lỗi không xác định')
}

function openArrangeSuccessModal(count, failedList) {
  const text = document.getElementById('arrangeSuccessText')
  const failed = Array.isArray(failedList) ? failedList : []
  if (text) text.textContent = 'Đã sắp xếp vận chuyển thành công ' + count + ' đơn hàng.'
  const printBtn = document.getElementById('arrangeModalPrintBtn')
  if (printBtn) printBtn.classList.toggle('hidden', count <= 0)
  const failWrap = document.getElementById('arrangeFailedWrap')
  const failListEl = document.getElementById('arrangeFailedList')
  if (failWrap && failListEl) {
    const hasFail = failed.length > 0
    failWrap.classList.toggle('hidden', !hasFail)
    if (hasFail) {
      failListEl.innerHTML = failed.map((f) => {
        const code = String(f.order_code || f.id || 'N/A')
        const reason = mapArrangeErrorText(f.error)
        return '<div>• <span class="font-semibold">' + code + '</span>: ' + reason + '</div>'
      }).join('')
    } else {
      failListEl.innerHTML = ''
    }
  }
  const modal = document.getElementById('arrangeSuccessModal')
  if (modal) modal.classList.remove('hidden')
}

function closeArrangeSuccessModal() {
  const modal = document.getElementById('arrangeSuccessModal')
  if (modal) modal.classList.add('hidden')
  arrangedFailedOrders = []
}

function printArrangedOrdersFromModal() {
  if (!arrangedOrdersForPrint.length) {
    showAdminToast('Không có đơn để in', 'warning')
    closeArrangeSuccessModal()
    return
  }
  const ghtkOrders = extractGHTKPrintableOrders(arrangedOrdersForPrint)
  if (!ghtkOrders.length) {
    showAdminToast('Chưa có mã vận đơn GHTK để in nhãn', 'warning')
    return
  }
  openGHTKLabelsPdf(ghtkOrders.map((o) => Number(o.id)))
  closeArrangeSuccessModal()
}

async function handleOrderPrimaryAction(id) {
  const orderId = Number(id)
  if (!Number.isFinite(orderId) || orderId <= 0) return
  if (ordersViewMode === 'waiting_ship') {
    const order = adminOrders.find((x) => Number(x.id) === orderId)
    if (!order) return
    const printable = extractGHTKPrintableOrders([order])
    if (!printable.length) {
      showAdminToast('Chưa có mã vận đơn GHTK để in nhãn', 'warning')
      return
    }
    openGHTKLabelsPdf([orderId])
    return
  }
  try {
    const res = await axios.post('/api/admin/orders/arrange-shipping', { ids: [orderId] })
    const updated = Array.isArray(res.data?.updated) ? res.data.updated : []
    const failed = Array.isArray(res.data?.failed) ? res.data.failed : []
    arrangedOrdersForPrint = updated.map((o) => ({
      id: Number(o.id),
      order_code: String(o.order_code || ''),
      shipping_carrier: String(o.shipping_carrier || o.carrier || 'GHTK'),
      shipping_tracking_code: String(o.shipping_tracking_code || o.tracking_code || '').trim()
    }))
    arrangedFailedOrders = failed
    selectedOrderIds.delete(orderId)
    openArrangeSuccessModal(arrangedOrdersForPrint.length, failed)
    await loadAdminOrders()
  } catch (_) {
    showAdminToast('Lỗi sắp xếp vận chuyển', 'error')
  }
}

async function handleOrderSecondaryAction(id, selectEl) {
  const nextAction = String(selectEl?.value || '').trim().toLowerCase()
  if (!nextAction) return
  if (nextAction === 'cancelled') {
    await updateOrderStatus(id, 'cancelled')
  }
  if (selectEl) selectEl.value = ''
}

async function updateOrderStatus(id, status) {
  try {
    const nextStatus = String(status || '').trim().toLowerCase()
    if (nextStatus === 'cancelled') {
      const order = adminOrders.find((x) => Number(x.id) === Number(id))
      const carrier = String(order?.shipping_carrier || '').trim().toUpperCase()
      if (carrier === 'GHTK' && String(order?.shipping_tracking_code || '').trim()) {
        showAdminToast('Dang huy don nay tren dashboard va GHTK...', 'warning')
      }
    }
    await axios.patch('/api/admin/orders/'+id+'/status', { status: nextStatus })
    showAdminToast('Cập nhật trạng thái thành công', 'success')
    await loadAdminOrders()
  } catch(e) { showAdminToast('Lỗi cập nhật', 'error') }
}

async function deleteOrder(id) {
  if (!confirm('Xoá đơn hàng này?')) return
  try {
    await axios.delete('/api/admin/orders/'+id)
    selectedOrderIds.delete(Number(id))
    showAdminToast('Đã xoá đơn hàng', 'success')
    loadAdminOrders()
  } catch(e) { showAdminToast('Lỗi xoá', 'error') }
}

function showOrderDetail(id) {
  const o = adminOrders.find(x => x.id === id)
  if (!o) return
  document.getElementById('orderDetailContent').innerHTML = \`
  <div class="space-y-3 pb-4">
    <div class="grid grid-cols-2 gap-3">
      <div class="bg-gray-50 rounded-xl p-3">
        <p class="text-xs text-gray-500">Mã đơn hàng</p>
        <p class="font-bold text-blue-600">\${o.order_code}</p>
      </div>
      <div class="bg-gray-50 rounded-xl p-3">
        <p class="text-xs text-gray-500">Trạng thái</p>
        <span class="badge badge-\${o.status}">\${statusLabel(o.status)}</span>
      </div>
    </div>
    <div class="bg-pink-50 rounded-xl p-3">
      <p class="text-xs text-gray-500 mb-1">Khách hàng</p>
      <p class="font-semibold">\${displayCustomerName(o.customer_name)}</p>
      <p class="text-sm text-gray-600">\${o.customer_phone}</p>
      <p class="text-sm text-gray-600">\${o.customer_address}</p>
      <p class="text-sm text-gray-600 mt-1"><span class="text-gray-500">Thanh toán:</span> \${formatPaymentMethod(o.payment_method)}</p>
      <p class="text-sm text-gray-600"><span class="text-gray-500">Trạng thái TT:</span> <span class="\${paymentStatusClass(o.payment_status)} px-2 py-0.5 rounded-full text-xs">\${paymentStatusLabel(o.payment_status)}</span></p>
      \${o.payment_paid_at ? \`<p class="text-xs text-green-600 mt-1">Đã thanh toán lúc: \${new Date(o.payment_paid_at).toLocaleString('vi-VN')}</p>\` : ''}
    </div>
    <div class="bg-gray-50 rounded-xl p-3">
      <p class="text-xs text-gray-500 mb-1">Sản phẩm</p>
      <p class="font-semibold">\${o.product_name}</p>
      <div class="flex gap-2 mt-1 flex-wrap">
        \${o.color ? \`<span class="text-xs bg-pink-50 text-pink-600 px-2 py-0.5 rounded-full border border-pink-200">Màu: \${o.color}</span>\` : ''}
        \${o.size ? \`<span class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full border">Size: \${o.size}</span>\` : ''}
        <span class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full border">SL: \${o.quantity}</span>
      </div>
    </div>
    \${o.voucher_code ? \`
    <div class="bg-green-50 rounded-xl p-3 flex justify-between items-center">
      <div>
        <p class="text-xs text-gray-500">Voucher áp dụng</p>
        <p class="font-mono font-bold text-green-700 text-sm">\${o.voucher_code}</p>
      </div>
      <span class="font-bold text-green-600">-\${fmtPrice(o.discount_amount)}</span>
    </div>\` : ''}
    <div class="bg-gradient-to-r from-pink-50 to-red-50 rounded-xl p-3 space-y-1">
      \${o.discount_amount > 0 ? \`
      <div class="flex justify-between text-sm">
        <span class="text-gray-500">Tạm tính:</span>
        <span class="text-gray-700">\${fmtPrice(o.product_price * o.quantity)}</span>
      </div>
      <div class="flex justify-between text-sm">
        <span class="text-green-600">Giảm giá:</span>
        <span class="text-green-600 font-semibold">-\${fmtPrice(o.discount_amount)}</span>
      </div>\` : ''}
      <div class="flex justify-between items-center">
        <span class="font-semibold text-gray-700">Còn phải thu:</span>
        <span class="text-xl font-bold text-pink-600">\${fmtPrice(getOrderAmountDue(o))}</span>
      </div>
      \${String(o.payment_status || '').toLowerCase() === 'paid' ? '<p class="text-xs text-green-600">Đơn này đã thanh toán online, khi in đơn hiển thị 0đ.</p>' : ''}
    </div>
    \${o.note ? \`<div class="bg-yellow-50 rounded-xl p-3"><p class="text-xs text-gray-500">Ghi chú</p><p class="text-sm">\${o.note}</p></div>\` : ''}
    <p class="text-xs text-gray-400 text-right">Đặt lúc: \${new Date(o.created_at).toLocaleString('vi-VN')}</p>
  </div>\`
  document.getElementById('orderDetailModal').classList.remove('hidden')
}

// ── EXCEL EXPORT ──────────────────────────────────
function exportExcel() {
  if (!adminOrders.length) { showAdminToast('Không có dữ liệu để xuất', 'error'); return }

  const data = adminOrders.map((o, i) => ({
    'STT': i + 1,
    'Mã đơn hàng': o.order_code,
    'Họ và tên': displayCustomerName(o.customer_name),
    'Số điện thoại': o.customer_phone,
    'Địa chỉ': o.customer_address,
    'Sản phẩm': o.product_name,
    'Đơn giá': o.product_price,
    'Màu sắc': o.color || '',
    'Size': o.size || '',
    'Số lượng': o.quantity,
    'Phương thức thanh toán': formatPaymentMethod(o.payment_method),
    'Trạng thái thanh toán': paymentStatusLabel(o.payment_status),
    'Voucher': o.voucher_code || '',
    'Giảm giá': o.discount_amount || 0,
    'Tổng tiền': getOrderAmountDue(o),
    'Ghi chú': o.note || '',
    'Trạng thái': statusLabel(o.status),
    'Thanh toán lúc': o.payment_paid_at ? new Date(o.payment_paid_at).toLocaleString('vi-VN') : '',
    'Ngày đặt': new Date(o.created_at).toLocaleString('vi-VN')
  }))

  const ws = XLSX.utils.json_to_sheet(data)
  ws['!cols'] = [
    {wch:5},{wch:15},{wch:20},{wch:14},{wch:35},{wch:30},
    {wch:12},{wch:12},{wch:8},{wch:8},{wch:14},{wch:12},{wch:12},{wch:20},{wch:12},{wch:18}
  ]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Đơn hàng')
  XLSX.writeFile(wb, 'DonHang_QHClothes_' + new Date().toISOString().split('T')[0] + '.xlsx')
  showAdminToast('Xuất Excel thành công!', 'success')
}

// ── VOUCHERS ──────────────────────────────────────
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
              \${isValid ? '✅ Hiệu lực' : expired ? '⏰ Hết hạn' : notStarted ? '🕐 Chưa bắt đầu' : '🚫 Tắt'}
            </span>
          </div>
          <div class="flex gap-1 shrink-0">
            <button onclick="toggleVoucher(\${v.id})" class="p-1.5 rounded-lg text-xs \${v.is_active ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-green-50 text-green-600 hover:bg-green-100'} transition" title="\${v.is_active ? 'Tắt' : 'Bật'}">
              <i class="fas fa-\${v.is_active ? 'toggle-off' : 'toggle-on'}"></i>
            </button>
            <button onclick="deleteVoucher(\${v.id})" class="p-1.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg text-xs transition" title="Xoá">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
        <div class="flex items-center gap-3 flex-wrap text-sm">
          <span class="font-bold text-pink-600 text-base">-\${fmtPrice(v.discount_amount)}</span>
          <span class="text-gray-400">|</span>
          <span class="text-gray-500 text-xs">
            <i class="fas fa-calendar text-gray-400 mr-1"></i>
            \${new Date(v.valid_from).toLocaleDateString('vi-VN')} → \${new Date(v.valid_to).toLocaleDateString('vi-VN')}
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
  btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Đang tạo...'
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
  if (!confirm('Xoá voucher này?')) return
  try {
    await axios.delete('/api/admin/vouchers/' + id)
    loadVouchers()
    showAdminToast('Đã xoá voucher', 'success')
  } catch(e) { showAdminToast('Lỗi xoá', 'error') }
}

function copyCode() {
  const code = document.getElementById('generatedCodeText').textContent
  navigator.clipboard.writeText(code).then(() => showAdminToast('Đã sao chép: ' + code, 'success'))
}

// ── UTILS ─────────────────────────────────────────
function fmtPrice(p) { return new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND'}).format(p||0) }
function formatDateTimeVi(value) {
  if (!value) return '—'
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
  // Fix common input artifact: Vietnamese char + stray latin suffix (e.g. "Hiếus")
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

// ── ESC key handler - close any open modal ──────────
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

// ── Safety: ensure all modals start hidden on page load ──
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
    // 401 or error → redirect to login
    window.location.replace('/admin/login')
    return
  }
  await loadAdminProfile()
  loadDashboard()
  scheduleAdminOverlaySanitize()
}
initAdminAuth()
`
}
