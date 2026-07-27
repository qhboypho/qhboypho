import { storefrontDetailOrderScript } from './script-detail-order'
export function storefrontInlineScript(): string {
  return `let allProducts = []
let filteredProducts = []
let currentProduct = null
let orderQty = 1
let selectedColor = ''
let orderColorOptions = []
let selectedSize = ''
let selectedProductSku = null
let selectedPaymentMethod = ''
let pendingBankTransferOrder = null
let bankTransferPollTimer = null
const PRODUCT_PREVIEW_ROWS = 3
const PRODUCT_MODAL_PAGE_SIZE = 24
const MOBILE_PRODUCT_PAGE_SIZE = 8

function isHotTrendWomenContext() {
  const ctx = typeof window !== 'undefined' ? (window.STOREFRONT_SEGMENT_CONTEXT || window.storefrontSegmentContext) : null
  return String(ctx?.key || '').trim() === 'hottrendnu'
}

function getCurrentStorefrontKey() {
  return isHotTrendWomenContext() ? 'hottrendnu' : 'boypho'
}

function getStorefrontQuerySuffix(prefix = '?') {
  return prefix + 'storefront=' + encodeURIComponent(getCurrentStorefrontKey())
}

function normalizeProductStorefrontVisibility(input) {
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
  if (keys.includes('all')) return ['boypho', 'hottrendnu']
  const valid = ['boypho', 'hottrendnu'].filter((key) => keys.includes(key))
  return valid.length ? valid : ['boypho']
}

function isProductVisibleOnCurrentStorefront(product) {
  return normalizeProductStorefrontVisibility(product?.storefront_visibility).includes(getCurrentStorefrontKey())
}

function scopeStorefrontProductsForPage(products) {
  if (!Array.isArray(products)) return []
  return products.filter(isProductVisibleOnCurrentStorefront)
}
const DEFAULT_STOREFRONT_PRODUCT_TYPES = [
  { slug: 'tshirt', name: 'Áo phông / thun', active: true },
  { slug: 'polo', name: 'Áo Polo', active: true },
  { slug: 'jacket', name: 'Áo khoác', active: true },
  { slug: 'hoodie', name: 'Hoodie / Sweater', active: true },
  { slug: 'pants', name: 'Quần', active: true },
  { slug: 'jeans', name: 'Quần Jean', active: true },
  { slug: 'dress', name: 'Váy / Đầm', active: true },
  { slug: 'set', name: 'Bộ đồ', active: true }
]
const HOT_TREND_NU_TYPE_FILTERS = [
  { slug: 'all', name: 'Tất cả', members: [] },
  { slug: 'tops', name: 'Áo', members: ['tshirt', 'polo'] },
  { slug: 'dress', name: 'Váy/Đầm', members: ['dress'] },
  { slug: 'pants', name: 'Quần', members: ['pants', 'jeans'] },
  { slug: 'set', name: 'Set đồ', members: ['set'] },
  { slug: 'outerwear', name: 'Áo khoác', members: ['jacket', 'hoodie'] }
]
let productsModalVisibleCount = PRODUCT_MODAL_PAGE_SIZE
let mobileProductsVisibleCount = MOBILE_PRODUCT_PAGE_SIZE
let appliedVoucher = null   // { code, discount_amount }
let detailColorOptions = []
let detailSelectedColor = ''
let detailSelectedColorImage = ''
let detailSelectedColorIndex = -1
let detailSelectedSize = ''
let detailQty = 1
let detailSelectedProductId = null
let cartVariantEditId = ''
let activeProductCategory = 'all'
let activeProductType = 'all'
let storefrontProductTypes = []
let activeProductSearch = ''
let activeProductSort = 'newest'
let activeProductColor = 'all'
let activeProductSize = 'all'
let activeProductPrice = 'all'
let mobileProductsLayout = 'list'
let favoriteProductIds = []
let activeUserMenuView = ''
let userOrderHistoryCache = []
let lastMobileBottomNavScrollY = 0
let mobileBottomNavHidden = false
let walletTopupEnabled = false
let storefrontScrollLockY = 0
let storefrontScrollLockActive = false
let storefrontScrollLockMode = ''
let storefrontScrollTouchY = 0
let storefrontScrollTouchHandler = null
let storefrontScrollTouchStartHandler = null
const storefrontScrollLockTokens = new Set()
const storefrontScrollLockStyles = {
  bodyPosition: '',
  bodyTop: '',
  bodyLeft: '',
  bodyRight: '',
  bodyWidth: '',
  bodyOverflow: '',
  htmlOverflow: '',
  htmlOverscrollBehavior: '',
}

function isStorefrontMobileViewport() {
  const viewportWidth = Math.min(
    window.innerWidth || document.documentElement.clientWidth || 0,
    window.visualViewport?.width || window.innerWidth || 0
  )
  return viewportWidth > 0 && viewportWidth <= 768
}

function getStorefrontScrollableAncestor(target) {
  let node = target instanceof Element ? target : null
  while (node && node !== document.body && node !== document.documentElement) {
    const style = window.getComputedStyle(node)
    const canScrollY = /(auto|scroll)/.test(style.overflowY || '')
    if (canScrollY && node.scrollHeight > node.clientHeight + 1) return node
    node = node.parentElement
  }
  return null
}

function bindStorefrontMobileScrollTrap() {
  if (storefrontScrollTouchHandler || !isStorefrontMobileViewport()) return
  storefrontScrollTouchStartHandler = (event) => {
    storefrontScrollTouchY = event.touches?.[0]?.clientY || 0
  }
  storefrontScrollTouchHandler = (event) => {
    if (!storefrontScrollLockActive || !storefrontScrollLockTokens.size) return
    const currentY = event.touches?.[0]?.clientY || storefrontScrollTouchY
    const deltaY = currentY - storefrontScrollTouchY
    storefrontScrollTouchY = currentY
    const scroller = getStorefrontScrollableAncestor(event.target)
    if (!scroller) {
      event.preventDefault()
      return
    }
    const atTop = scroller.scrollTop <= 0
    const atBottom = Math.ceil(scroller.scrollTop + scroller.clientHeight) >= scroller.scrollHeight
    if ((atTop && deltaY > 0) || (atBottom && deltaY < 0)) {
      event.preventDefault()
    }
  }
  document.addEventListener('touchstart', storefrontScrollTouchStartHandler, { passive: true, capture: true })
  document.addEventListener('touchmove', storefrontScrollTouchHandler, { passive: false, capture: true })
}

function unbindStorefrontMobileScrollTrap() {
  if (storefrontScrollTouchStartHandler) {
    document.removeEventListener('touchstart', storefrontScrollTouchStartHandler, true)
    storefrontScrollTouchStartHandler = null
  }
  if (storefrontScrollTouchHandler) {
    document.removeEventListener('touchmove', storefrontScrollTouchHandler, true)
    storefrontScrollTouchHandler = null
  }
  storefrontScrollTouchY = 0
}

function lockStorefrontPageScroll(token) {
  const key = String(token || 'modal')
  storefrontScrollLockTokens.add(key)
  if (storefrontScrollLockActive) return
  storefrontScrollLockActive = true
  const body = document.body
  const html = document.documentElement
  storefrontScrollLockY = Math.max(0, window.scrollY || window.pageYOffset || 0)
  storefrontScrollLockStyles.bodyPosition = body.style.position || ''
  storefrontScrollLockStyles.bodyTop = body.style.top || ''
  storefrontScrollLockStyles.bodyLeft = body.style.left || ''
  storefrontScrollLockStyles.bodyRight = body.style.right || ''
  storefrontScrollLockStyles.bodyWidth = body.style.width || ''
  storefrontScrollLockStyles.bodyOverflow = body.style.overflow || ''
  storefrontScrollLockStyles.htmlOverflow = html.style.overflow || ''
  storefrontScrollLockStyles.htmlOverscrollBehavior = html.style.overscrollBehavior || ''
  html.classList.add('storefront-scroll-locked')
  body.classList.add('storefront-scroll-locked')
  html.style.overflow = 'hidden'
  html.style.overscrollBehavior = 'none'
  body.style.overflow = 'hidden'
  body.style.width = '100%'
  if (isStorefrontMobileViewport()) {
    storefrontScrollLockMode = 'mobile'
    bindStorefrontMobileScrollTrap()
    return
  }
  storefrontScrollLockMode = 'fixed'
  body.style.position = 'fixed'
  body.style.top = '-' + storefrontScrollLockY + 'px'
  body.style.left = '0'
  body.style.right = '0'
}

function unlockStorefrontPageScroll(token) {
  const key = String(token || 'modal')
  storefrontScrollLockTokens.delete(key)
  if (!storefrontScrollLockActive || storefrontScrollLockTokens.size) return
  const body = document.body
  const html = document.documentElement
  html.classList.remove('storefront-scroll-locked')
  body.classList.remove('storefront-scroll-locked')
  unbindStorefrontMobileScrollTrap()
  const wasFixedLock = storefrontScrollLockMode === 'fixed'
  body.style.position = storefrontScrollLockStyles.bodyPosition
  body.style.top = storefrontScrollLockStyles.bodyTop
  body.style.left = storefrontScrollLockStyles.bodyLeft
  body.style.right = storefrontScrollLockStyles.bodyRight
  body.style.width = storefrontScrollLockStyles.bodyWidth
  body.style.overflow = storefrontScrollLockStyles.bodyOverflow
  html.style.overflow = storefrontScrollLockStyles.htmlOverflow
  html.style.overscrollBehavior = storefrontScrollLockStyles.htmlOverscrollBehavior
  storefrontScrollLockActive = false
  storefrontScrollLockMode = ''
  const restoreY = storefrontScrollLockY
  storefrontScrollLockY = 0
  if (wasFixedLock) {
    requestAnimationFrame(() => window.scrollTo(0, restoreY))
  }
}

function syncStorefrontPageScrollLock() {
  const modalIds = [
    'orderOverlay',
    'orderBankTransferOverlay',
    'orderPaidNoticeOverlay',
    'cartOrderSuccessOverlay',
    'shippingJourneyOverlay',
    'detailOverlay',
    'cartOverlay',
    'userMenuOverlay',
    'reviewModalOverlay',
    'blockedCustomerModal',
    'favoriteAuthModal',
    'filterModalOverlay',
    'variantModalOverlay',
    'productsModalOverlay',
    'checkoutAddressManagerOverlay',
    'checkoutNoteOverlay'
  ]
  const hasOpenModal = modalIds.some((id) => {
    const el = document.getElementById(id)
    return el && !el.classList.contains('hidden')
  })
  if (hasOpenModal) lockStorefrontPageScroll('sync-open-modal')
  else unlockStorefrontPageScroll('sync-open-modal')
}

// ── CART STATE ─────────────────────────────────────
// cart = [{ cartId, productId, name, sku, thumbnail, price, color, size, qty, checked }]
let cart = []
let cartStep = 1  // 1=list, 2=checkout
let ckAppliedVoucher = null
let cartSelectedPaymentMethod = ''
let checkoutAddressBook = []
let selectedCheckoutAddressId = ''
let editingCheckoutAddressId = ''
let checkoutAddressEditorSaved = false
let checkoutAddressEditorSnapshot = null
let checkoutAddressContext = 'ck'
let orderAddressEditorSaved = false
let orderAddressEditorSnapshot = null
let checkoutNoteContext = 'ck'
let currentUser = null
let isAdminUser = false
let liveChatConversationId = ''
let liveChatCustomerToken = ''
let liveChatSocket = null
let liveChatStarted = false
let liveChatProductContextSent = ''
let liveChatPollTimer = null
let liveChatRenderedMessageIds = new Set()
let liveChatProductsLoading = false
let userAuthTurnstileEnabled = false
let userAuthTurnstileSiteKey = ''
let userAuthTurnstileToken = ''
let userAuthTurnstileWidgetId = null
let turnstilePublicConfigPromise = null
let turnstileScriptPromise = null
let cartStorageKey = 'qhclothes_cart_guest'
const TURNSTILE_LOCAL_TEST_SITE_KEY = '1x00000000000000000000AA'
const STOREFRONT_THEME_KEY = 'qhclothes_storefront_theme'
const STOREFRONT_DEVICE_KEY = 'qhclothes_device_id'
const STOREFRONT_FAVORITES_KEY = 'qhclothes_storefront_favorites'
const ADDRESS_EFFECTIVE_DATE = 'latest'
let addressProvinceOptions = []
let addressCommuneOptionsByProvince = {}
let addressKitLoadingPromise = null
let addressAutoFillInProgress = false
const addressDropdownSearchState = {}

function createStorefrontDeviceId() {
  const random = new Uint8Array(16)
  if (window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(random)
  } else {
    for (let i = 0; i < random.length; i += 1) random[i] = Math.floor(Math.random() * 256)
  }
  const hex = Array.from(random).map((byte) => byte.toString(16).padStart(2, '0')).join('')
  return 'qh_' + Date.now().toString(36) + '_' + hex
}

function getCookieValue(name) {
  const prefix = name + '='
  return document.cookie
    .split(';')
    .map((item) => item.trim())
    .find((item) => item.indexOf(prefix) === 0)
    ?.slice(prefix.length) || ''
}

function persistStorefrontDeviceId(deviceId) {
  try { localStorage.setItem(STOREFRONT_DEVICE_KEY, deviceId) } catch (_) { }
  try {
    document.cookie = STOREFRONT_DEVICE_KEY + '=' + encodeURIComponent(deviceId) + '; Max-Age=31536000; Path=/; SameSite=Lax'
  } catch (_) { }
}

function getStorefrontDeviceId() {
  let deviceId = ''
  try { deviceId = localStorage.getItem(STOREFRONT_DEVICE_KEY) || '' } catch (_) { }
  if (!deviceId) {
    try { deviceId = decodeURIComponent(getCookieValue(STOREFRONT_DEVICE_KEY) || '') } catch (_) { deviceId = '' }
  }
  if (!/^qh_[a-z0-9]+_[a-f0-9]{32}$/i.test(deviceId)) {
    deviceId = createStorefrontDeviceId()
  }
  persistStorefrontDeviceId(deviceId)
  return deviceId
}

function loadStorefrontThemePreference() {
  if (isHotTrendWomenContext()) return 'light'
  try {
    const saved = localStorage.getItem(STOREFRONT_THEME_KEY)
    if (saved === 'dark' || saved === 'light') return saved
  } catch (_) { }
  return 'light'
}

function applyStorefrontTheme(theme) {
  if (isHotTrendWomenContext()) {
    theme = 'light'
  } else {
    theme = theme === 'dark' ? 'dark' : 'light'
  }
  document.documentElement.dataset.storefrontTheme = theme
  document.body.dataset.storefrontTheme = theme
  const icon = document.getElementById('storefrontThemeIcon')
  const btn = document.getElementById('storefrontThemeToggle')
  const mobileIcon = document.getElementById('storefrontThemeIconMobile')
  const mobileBtn = document.getElementById('storefrontThemeToggleMobile')
  if (icon) icon.className = theme === 'dark' ? 'fas fa-sun text-lg' : 'fas fa-moon text-lg'
  if (mobileIcon) mobileIcon.className = theme === 'dark' ? 'fas fa-sun text-[16px]' : 'fas fa-moon text-[16px]'
  if (btn) {
    btn.setAttribute('aria-label', theme === 'dark' ? 'Chuyển giao diện sáng' : 'Chuyển giao diện tối')
    btn.setAttribute('title', theme === 'dark' ? 'Chuyển giao diện sáng' : 'Chuyển giao diện tối')
  }
  if (mobileBtn) {
    mobileBtn.setAttribute('aria-label', theme === 'dark' ? 'Chuyển giao diện sáng' : 'Chuyển giao diện tối')
    mobileBtn.setAttribute('title', theme === 'dark' ? 'Chuyển giao diện sáng' : 'Chuyển giao diện tối')
  }
}

function toggleStorefrontTheme() {
  const theme = document.body.dataset.storefrontTheme === 'dark' ? 'light' : 'dark'
  try { localStorage.setItem(STOREFRONT_THEME_KEY, theme) } catch (_) { }
  applyStorefrontTheme(theme)
}

function getFavoritesOwnerKey() {
  const raw = currentUser?.userId || currentUser?.id || currentUser?.username || currentUser?.email || ''
  return String(raw || '').trim()
}

function readFavoritesStore() {
  try {
    const raw = localStorage.getItem(STOREFRONT_FAVORITES_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch (_) {
    return {}
  }
}

function writeFavoritesStore(store) {
  try { localStorage.setItem(STOREFRONT_FAVORITES_KEY, JSON.stringify(store || {})) } catch (_) { }
}

function loadFavoriteProductsForCurrentUser() {
  const ownerKey = getFavoritesOwnerKey()
  if (!ownerKey) {
    favoriteProductIds = []
    return
  }
  const store = readFavoritesStore()
  const list = Array.isArray(store[ownerKey]) ? store[ownerKey] : []
  favoriteProductIds = list
    .map((id) => Number(id || 0))
    .filter((id, index, arr) => Number.isFinite(id) && id > 0 && arr.indexOf(id) === index)
}

function persistFavoriteProductsForCurrentUser() {
  const ownerKey = getFavoritesOwnerKey()
  if (!ownerKey) return
  const store = readFavoritesStore()
  store[ownerKey] = favoriteProductIds
  writeFavoritesStore(store)
}

function isFavoriteProduct(productId) {
  const id = Number(productId || 0)
  return favoriteProductIds.includes(id)
}

function renderFavoriteButton(productId, extraClass) {
  const id = Number(productId || 0)
  if (!id) return ''
  const active = isFavoriteProduct(id)
  const cls = extraClass ? ' ' + extraClass : ''
  return '<button type="button" class="favorite-toggle-btn' + (active ? ' active' : '') + cls + '" title="' + (active ? 'Bỏ yêu thích' : 'Lưu yêu thích') + '" aria-label="' + (active ? 'Bỏ yêu thích' : 'Lưu yêu thích') + '" aria-pressed="' + (active ? 'true' : 'false') + '" onclick="toggleFavoriteProduct(event,' + id + ')"><i class="fas fa-heart"></i></button>'
}

function syncFavoriteButtonState(productId) {
  const id = Number(productId || 0)
  if (!id) return
  const active = isFavoriteProduct(id)
  document.querySelectorAll('.favorite-toggle-btn[onclick*="toggleFavoriteProduct(event,' + id + ')"]').forEach((btn) => {
    btn.classList.toggle('active', active)
    btn.setAttribute('aria-pressed', active ? 'true' : 'false')
    btn.setAttribute('title', active ? 'Bỏ yêu thích' : 'Lưu yêu thích')
    btn.setAttribute('aria-label', active ? 'Bỏ yêu thích' : 'Lưu yêu thích')
    const icon = btn.querySelector('i')
    if (icon) icon.className = 'fas fa-heart'
  })
}

function refreshFavoriteProductViews() {
  if (activeUserMenuView === 'favorites' && !document.getElementById('userMenuOverlay')?.classList.contains('hidden')) showUserFavorites()
}

function showFavoriteAuthModal() {
  const modal = document.getElementById('favoriteAuthModal')
  if (!modal) return
  modal.classList.remove('hidden')
  modal.classList.add('flex')
  lockStorefrontPageScroll('favoriteAuthModal')
}

function closeFavoriteAuthModal() {
  const modal = document.getElementById('favoriteAuthModal')
  if (!modal) return
  modal.classList.add('hidden')
  modal.classList.remove('flex')
  unlockStorefrontPageScroll('favoriteAuthModal')
}

function openFavoriteLoginFlow() {
  closeFavoriteAuthModal()
  openUserMenu()
  renderUserAuthForm('login')
}

function toggleFavoriteProduct(event, productId) {
  if (event) {
    event.preventDefault()
    event.stopPropagation()
  }
  if (!currentUser || isAdminUser) {
    showFavoriteAuthModal()
    return
  }
  const id = Number(productId || 0)
  if (!id) return
  if (isFavoriteProduct(id)) {
    favoriteProductIds = favoriteProductIds.filter((item) => item !== id)
    persistFavoriteProductsForCurrentUser()
    showToast('Đã bỏ khỏi yêu thích', 'success', 1800)
  } else {
    favoriteProductIds = [id].concat(favoriteProductIds.filter((item) => item !== id))
    persistFavoriteProductsForCurrentUser()
    showToast('Đã lưu vào yêu thích', 'success', 1800)
  }
  syncFavoriteButtonState(id)
  refreshFavoriteProductViews()
}

function initHeroTypedText() {
  const el = document.getElementById('heroTypedText')
  if (!el) return
  const texts = String(el.getAttribute('data-typed-text') || 'Phong cách Boypho|Sang Trọng Và Cá Tính')
    .split('|')
    .map((item) => item.trim())
    .filter(Boolean)
  if (!texts.length) return
  if (el._heroTypedTimer) {
    window.clearTimeout(el._heroTypedTimer)
    el._heroTypedTimer = null
  }
  if (el._heroTypedInstance) {
    if (typeof el._heroTypedInstance.stop === 'function') el._heroTypedInstance.stop()
    el._heroTypedInstance = null
  }
  const maxLength = texts.reduce((max, item) => Math.max(max, item.length), 0)
  el.style.setProperty('--hero-typed-width', Math.max(10, maxLength) + 'ch')
  el.innerHTML = ''
  if (typeof window.AutoTyping !== 'function') {
    el.textContent = texts[0]
    return
  }
  el._heroTypedInstance = new window.AutoTyping({
    id: 'heroTypedText',
    typeText: texts,
    typeSpeed: 72,
    typeRandom: false,
    typeDelay: 240,
    deleteSpeed: 32,
    deleteDelay: 1500,
    cursor: '',
    cursorColor: '',
    cursorSpeed: 0,
    textColor: '',
    typeInfinity: true,
    callBack: {
      method: function() {
        el.querySelectorAll('span').forEach((span) => {
          span.classList.add('hero-typed-segment')
        })
      }
    }
  })
  el._heroTypedInstance.init()
  window.requestAnimationFrame(() => {
    el.querySelectorAll('span').forEach((span) => {
      span.classList.add('hero-typed-segment')
    })
  })
}

function getAddressScopeElements(scope) {
  const isCart = scope === 'ck'
  return {
    fieldId: isCart ? 'ckFieldAddress' : 'fieldAddress',
    provinceId: isCart ? 'ckProvince' : 'orderProvince',
    communeId: isCart ? 'ckCommune' : 'orderCommune',
    detailId: isCart ? 'ckAddressDetail' : 'orderAddressDetail',
    fullAddressId: isCart ? 'ckAddress' : 'orderAddress'
  }
}

function getSelectedAddressOptionText(selectEl) {
  if (!selectEl) return ''
  const idx = selectEl.selectedIndex
  if (idx < 0 || !selectEl.options[idx]) return ''
  return String(selectEl.options[idx].textContent || '').trim()
}

function setAddressSelectOptions(selectEl, options, placeholder) {
  if (!selectEl) return
  const safeOptions = Array.isArray(options) ? options : []
  const previousValue = String(selectEl.value || '').trim()
  selectEl.innerHTML = '<option value="">' + placeholder + '</option>'
  safeOptions.forEach((item) => {
    if (!item || !item.code || !item.name) return
    const opt = document.createElement('option')
    opt.value = String(item.code)
    opt.textContent = String(item.name)
    selectEl.appendChild(opt)
  })
  if (previousValue && safeOptions.some((item) => String(item.code) === previousValue)) {
    selectEl.value = previousValue
  }
}

function normalizeSearchText(input) {
  return String(input || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\\u0300-\\u036f]/g, '')
    .trim()
}

function getCheckoutScopeConfig(scope) {
  const isCart = scope === 'ck'
  return {
    isCart,
    nameFieldId: isCart ? 'ckFieldName' : 'fieldName',
    phoneFieldId: isCart ? 'ckFieldPhone' : 'fieldPhone',
    addressFieldId: isCart ? 'ckFieldAddress' : 'fieldAddress',
    colorFieldId: 'fieldColor',
    sizeFieldId: 'sizeSection',
    paymentFieldId: isCart ? 'ckFieldPaymentMethod' : 'fieldPaymentMethod',
    nameInputId: isCart ? 'ckName' : 'orderName',
    phoneInputId: isCart ? 'ckPhone' : 'orderPhone'
  }
}

function getCheckoutSelectedPaymentMethod(scope) {
  return scope === 'ck' ? cartSelectedPaymentMethod : selectedPaymentMethod
}

function resetCheckoutPaymentMethod(scope) {
  if (scope === 'ck') cartSelectedPaymentMethod = ''
  else selectedPaymentMethod = ''
  document.querySelectorAll('.payment-method-btn[data-payment-scope="' + scope + '"]').forEach((btn) => {
    btn.classList.remove('active', 'border-pink-500', 'bg-pink-50')
  })
}

function selectCheckoutPaymentMethod(scope, method, btn) {
  if (!btn || btn.disabled || btn.closest('.payment-method-unavailable')) return
  document.querySelectorAll('.payment-method-btn[data-payment-scope="' + scope + '"]').forEach((node) => {
    node.classList.remove('active', 'border-pink-500', 'bg-pink-50')
  })
  btn.classList.add('active', 'border-pink-500', 'bg-pink-50')
  if (scope === 'ck') cartSelectedPaymentMethod = method
  else selectedPaymentMethod = method
  const cfg = getCheckoutScopeConfig(scope)
  if (scope === 'ck') clearCheckoutError(cfg.paymentFieldId)
  else clearFieldError(cfg.paymentFieldId)
}

function validateCheckoutFields(scope, options) {
  const cfg = getCheckoutScopeConfig(scope)
  const values = {
    name: document.getElementById(cfg.nameInputId)?.value.trim() || '',
    phone: document.getElementById(cfg.phoneInputId)?.value.trim() || '',
    addressPayload: getAddressPayload(scope)
  }
  values.address = values.addressPayload.address
  const shake = scope === 'ck' ? shakeCheckoutField : shakeField
  const clear = scope === 'ck' ? clearCheckoutError : clearFieldError

  if (!values.name) { shake(cfg.nameFieldId); return null }
  clear(cfg.nameFieldId)
  if (!values.phone || !/^[0-9]{9,11}$/.test(values.phone.replace(/\\s/g, ''))) { shake(cfg.phoneFieldId); return null }
  clear(cfg.phoneFieldId)
  if (!values.addressPayload.valid) { shake(cfg.addressFieldId); return null }
  clear(cfg.addressFieldId)

  if (options?.requireColor) {
    if (!selectedColor) { shake(cfg.colorFieldId); return null }
    clear(cfg.colorFieldId)
  }
  if (options?.requireSize) {
    if (!selectedSize) { shake(cfg.sizeFieldId); return null }
    clear(cfg.sizeFieldId)
  }
  if (options?.requirePayment) {
    if (!getCheckoutSelectedPaymentMethod(scope)) { shake(cfg.paymentFieldId); return null }
    clear(cfg.paymentFieldId)
  }

  return values
}

function hasCheckoutContactAddress(scope) {
  const cfg = getCheckoutScopeConfig(scope)
  const name = document.getElementById(cfg.nameInputId)?.value.trim() || ''
  const phone = document.getElementById(cfg.phoneInputId)?.value.trim() || ''
  const addressPayload = getAddressPayload(scope)
  return !!(name && phone && /^[0-9]{9,11}$/.test(phone.replace(/\s/g, '')) && addressPayload.valid)
}

function getAddressPreferenceKey() {
  if (isAdminUser) return 'qhclothes_saved_address_admin'
  const uid = Number(currentUser?.userId || currentUser?.id || 0)
  if (uid > 0) return 'qhclothes_saved_address_user_' + uid
  return 'qhclothes_saved_address_guest'
}

function saveAddressPreference(payload) {
  try {
    localStorage.setItem(getAddressPreferenceKey(), JSON.stringify({
      provinceCode: String(payload?.provinceCode || '').trim(),
      communeCode: String(payload?.communeCode || '').trim(),
      detail: String(payload?.detail || '').trim(),
      updatedAt: Date.now()
    }))
  } catch (_) { }
}

function loadAddressPreference() {
  try {
    const raw = localStorage.getItem(getAddressPreferenceKey())
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    const provinceCode = String(parsed.provinceCode || '').trim()
    const communeCode = String(parsed.communeCode || '').trim()
    const detail = String(parsed.detail || '').trim()
    if (!provinceCode || !communeCode || !detail) return null
    return { provinceCode, communeCode, detail }
  } catch (_) {
    return null
  }
}

function getFilteredAddressOptions(options, keyword) {
  const list = Array.isArray(options) ? options : []
  const q = normalizeSearchText(keyword)
  if (!q) return list
  return list.filter((item) => normalizeSearchText(item?.name || '').indexOf(q) >= 0)
}

function getAddressDropdownIds(scope, type) {
  const prefix = scope === 'ck' ? 'ck' : 'order'
  const part = type === 'province' ? 'Province' : 'Commune'
  const root = prefix + part
  return {
    dropdownId: root + 'Dropdown',
    triggerId: root + 'Trigger',
    labelId: root + 'Label',
    menuId: root + 'Menu',
    searchId: root + 'Search',
    optionsId: root + 'Options'
  }
}

function closeAddressDropdown(scope, type) {
  const ids = getAddressDropdownIds(scope, type)
  const menuEl = document.getElementById(ids.menuId)
  if (menuEl) menuEl.classList.add('hidden')
}

function closeAllAddressDropdowns() {
  ;[
    ['order', 'province'],
    ['order', 'commune'],
    ['ck', 'province'],
    ['ck', 'commune']
  ].forEach(([scope, type]) => closeAddressDropdown(scope, type))
}

function renderAddressDropdownList(scope, type, keyword = '') {
  const ids = getAddressScopeElements(scope)
  const dIds = getAddressDropdownIds(scope, type)
  const selectEl = document.getElementById(type === 'province' ? ids.provinceId : ids.communeId)
  const optionsEl = document.getElementById(dIds.optionsId)
  const labelEl = document.getElementById(dIds.labelId)
  if (!selectEl || !optionsEl || !labelEl) return

  const placeholder = String(selectEl.options?.[0]?.textContent || (type === 'province' ? 'Chọn tỉnh/thành' : 'Chọn phường/xã'))
  const selectedCode = String(selectEl.value || '').trim()
  const selectedOpt = Array.from(selectEl.options).find((opt, idx) => idx > 0 && String(opt.value || '').trim() === selectedCode)
  labelEl.textContent = selectedOpt ? String(selectedOpt.textContent || '') : placeholder
  labelEl.classList.toggle('text-gray-500', !selectedOpt)
  labelEl.classList.toggle('text-gray-900', !!selectedOpt)

  const list = Array.from(selectEl.options)
    .slice(1)
    .map((opt) => ({ code: String(opt.value || ''), name: String(opt.textContent || '') }))
  const filtered = getFilteredAddressOptions(list, keyword)

  if (!filtered.length) {
    optionsEl.innerHTML = '<div class="px-3 py-2 text-sm text-gray-400">Không tìm thấy kết quả</div>'
    return
  }

  optionsEl.innerHTML = filtered.map((item) => {
    const active = String(item.code) === selectedCode ? ' active' : ''
    return '<button type="button" class="address-option-item' + active + '" data-scope="' + escapeHtml(scope) + '" data-type="' + escapeHtml(type) + '" data-code="' + escapeHtml(item.code) + '" onclick="selectAddressDropdownOption(this.dataset.scope,this.dataset.type,this.dataset.code)">' + escapeHtml(item.name) + '</button>'
  }).join('')
}

function renderProvinceOptionsForScope(scope, keyword = '') {
  const ids = getAddressScopeElements(scope)
  const provinceEl = document.getElementById(ids.provinceId)
  const filtered = getFilteredAddressOptions(addressProvinceOptions, keyword)
  setAddressSelectOptions(provinceEl, filtered, filtered.length ? 'Chọn tỉnh/thành' : 'Không tìm thấy tỉnh/thành')
  renderAddressDropdownList(scope, 'province', keyword)
}

function renderCommuneOptionsForScope(scope, keyword = '') {
  const ids = getAddressScopeElements(scope)
  const provinceEl = document.getElementById(ids.provinceId)
  const communeEl = document.getElementById(ids.communeId)
  const provinceCode = String(provinceEl?.value || '').trim()
  const list = provinceCode ? (addressCommuneOptionsByProvince[provinceCode] || []) : []
  const filtered = getFilteredAddressOptions(list, keyword)
  const placeholder = provinceCode
    ? (filtered.length ? 'Chọn phường/xã' : 'Không tìm thấy phường/xã')
    : 'Chọn phường/xã'
  setAddressSelectOptions(communeEl, filtered, placeholder)
  renderAddressDropdownList(scope, 'commune', keyword)
}

async function fetchAddressProvinces() {
  const res = await axios.get('/api/address/provinces', { params: { effectiveDate: ADDRESS_EFFECTIVE_DATE } })
  const list = Array.isArray(res.data?.data) ? res.data.data : []
  addressProvinceOptions = list.filter((p) => p && p.code && p.name)
  renderProvinceOptionsForScope('order')
  renderProvinceOptionsForScope('ck')
}

async function ensureAddressKitReady() {
  if (!addressKitLoadingPromise) {
    addressKitLoadingPromise = fetchAddressProvinces()
      .catch((err) => {
        addressProvinceOptions = []
        addressCommuneOptionsByProvince = {}
        throw err
      })
      .finally(() => { addressKitLoadingPromise = null })
  }
  return addressKitLoadingPromise
}

async function fetchAddressCommunesByProvince(provinceCode) {
  const code = String(provinceCode || '').trim()
  if (!code) return []
  if (Array.isArray(addressCommuneOptionsByProvince[code])) return addressCommuneOptionsByProvince[code]
  const res = await axios.get('/api/address/provinces/' + encodeURIComponent(code) + '/communes', {
    params: { effectiveDate: ADDRESS_EFFECTIVE_DATE }
  })
  const list = Array.isArray(res.data?.data) ? res.data.data : []
  const safeList = list.filter((item) => item && item.code && item.name)
  addressCommuneOptionsByProvince[code] = safeList
  return safeList
}

function syncAddressFullText(scope) {
  const ids = getAddressScopeElements(scope)
  const provinceEl = document.getElementById(ids.provinceId)
  const communeEl = document.getElementById(ids.communeId)
  const detailEl = document.getElementById(ids.detailId)
  const fullAddressEl = document.getElementById(ids.fullAddressId)
  if (!fullAddressEl) return ''

  const provinceName = getSelectedAddressOptionText(provinceEl)
  const communeName = getSelectedAddressOptionText(communeEl)
  const detail = String(detailEl?.value || '').trim()
  const fullParts = [detail, communeName, provinceName].filter(Boolean)
  const fullAddress = fullParts.join(', ')
  fullAddressEl.value = fullAddress
  if (!addressAutoFillInProgress) {
    const provinceCode = String(provinceEl?.value || '').trim()
    const communeCode = String(communeEl?.value || '').trim()
    if (provinceCode && communeCode && detail && fullAddress) {
      saveAddressPreference({ provinceCode, communeCode, detail })
    }
  }
  return fullAddress
}

function resetAddressScope(scope) {
  const ids = getAddressScopeElements(scope)
  const provinceEl = document.getElementById(ids.provinceId)
  const communeEl = document.getElementById(ids.communeId)
  const detailEl = document.getElementById(ids.detailId)
  const fullAddressEl = document.getElementById(ids.fullAddressId)
  addressDropdownSearchState[scope + ':province'] = ''
  addressDropdownSearchState[scope + ':commune'] = ''
  renderProvinceOptionsForScope(scope)
  if (provinceEl) provinceEl.value = ''
  if (communeEl) setAddressSelectOptions(communeEl, [], 'Chọn phường/xã')
  renderAddressDropdownList(scope, 'province', '')
  renderAddressDropdownList(scope, 'commune', '')
  if (detailEl) detailEl.value = ''
  if (fullAddressEl) fullAddressEl.value = ''
}

async function onAddressProvinceChange(scope) {
  const ids = getAddressScopeElements(scope)
  const provinceEl = document.getElementById(ids.provinceId)
  const communeEl = document.getElementById(ids.communeId)
  const selectedCode = String(provinceEl?.value || '').trim()
  addressDropdownSearchState[scope + ':commune'] = ''
  setAddressSelectOptions(communeEl, [], selectedCode ? 'Đang tải phường/xã...' : 'Chọn phường/xã')
  renderAddressDropdownList(scope, 'commune', '')
  if (!selectedCode) {
    renderCommuneOptionsForScope(scope)
    syncAddressFullText(scope)
    if (scope === 'ck') clearCheckoutError(ids.fieldId)
    else {
      clearFieldError(ids.fieldId)
      renderOrderAddressSummary()
    }
    return
  }
  try {
    await fetchAddressCommunesByProvince(selectedCode)
    renderCommuneOptionsForScope(scope)
  } catch (_) {
    setAddressSelectOptions(communeEl, [], 'Không tải được phường/xã')
    showToast('Không tải được danh sách phường/xã. Vui lòng thử lại.', 'error', 4500)
  }
  syncAddressFullText(scope)
  if (scope === 'ck') clearCheckoutError(ids.fieldId)
  else {
    clearFieldError(ids.fieldId)
    renderOrderAddressSummary()
  }
}

function onAddressCommuneChange(scope) {
  syncAddressFullText(scope)
  renderAddressDropdownList(scope, 'commune', '')
  const ids = getAddressScopeElements(scope)
  if (scope === 'ck') clearCheckoutError(ids.fieldId)
  else {
    clearFieldError(ids.fieldId)
    renderOrderAddressSummary()
  }
}

function onAddressDropdownSearchInput(scope, type) {
  const dIds = getAddressDropdownIds(scope, type)
  const searchEl = document.getElementById(dIds.searchId)
  const keyword = String(searchEl?.value || '')
  addressDropdownSearchState[scope + ':' + type] = keyword
  if (type === 'province') renderProvinceOptionsForScope(scope, keyword)
  else renderCommuneOptionsForScope(scope, keyword)
}

function selectAddressDropdownOption(scope, type, code) {
  const ids = getAddressScopeElements(scope)
  const selectEl = document.getElementById(type === 'province' ? ids.provinceId : ids.communeId)
  if (!selectEl) return
  selectEl.value = String(code || '')
  const dIds = getAddressDropdownIds(scope, type)
  const searchEl = document.getElementById(dIds.searchId)
  if (searchEl) searchEl.value = ''
  addressDropdownSearchState[scope + ':' + type] = ''
  closeAddressDropdown(scope, type)
  if (type === 'province') {
    renderProvinceOptionsForScope(scope, '')
    onAddressProvinceChange(scope)
  } else {
    renderCommuneOptionsForScope(scope, '')
    onAddressCommuneChange(scope)
  }
}

function toggleAddressDropdown(scope, type) {
  const dIds = getAddressDropdownIds(scope, type)
  const menuEl = document.getElementById(dIds.menuId)
  const searchEl = document.getElementById(dIds.searchId)
  if (!menuEl) return
  const willOpen = menuEl.classList.contains('hidden')
  closeAllAddressDropdowns()
  if (!willOpen) return
  menuEl.classList.remove('hidden')
  if (searchEl) {
    searchEl.value = ''
    setTimeout(() => searchEl.focus(), 0)
  }
  addressDropdownSearchState[scope + ':' + type] = ''
  if (type === 'province') renderProvinceOptionsForScope(scope, '')
  else renderCommuneOptionsForScope(scope, '')
}

function bindAddressSearchableDropdowns() {
  document.addEventListener('click', (e) => {
    const target = e.target
    if (!target) return
    const inDropdown = target.closest && target.closest('#orderProvinceDropdown, #orderCommuneDropdown, #ckProvinceDropdown, #ckCommuneDropdown')
    if (!inDropdown) closeAllAddressDropdowns()
  })
}

async function applySavedAddressToScope(scope) {
  resetAddressScope(scope)
  const saved = loadAddressPreference()
  if (!saved) return
  const ids = getAddressScopeElements(scope)
  const provinceEl = document.getElementById(ids.provinceId)
  const communeEl = document.getElementById(ids.communeId)
  const detailEl = document.getElementById(ids.detailId)
  if (!provinceEl || !communeEl || !detailEl) return
  const hasProvince = addressProvinceOptions.some((item) => String(item.code) === saved.provinceCode)
  if (!hasProvince) return
  addressAutoFillInProgress = true
  try {
    provinceEl.value = saved.provinceCode
    await onAddressProvinceChange(scope)
    const communes = addressCommuneOptionsByProvince[saved.provinceCode] || []
    if (communes.some((item) => String(item.code) === saved.communeCode)) {
      communeEl.value = saved.communeCode
    }
    detailEl.value = saved.detail
    syncAddressFullText(scope)
  } finally {
    addressAutoFillInProgress = false
  }
}

function getAddressPayload(scope) {
  const ids = getAddressScopeElements(scope)
  const provinceEl = document.getElementById(ids.provinceId)
  const communeEl = document.getElementById(ids.communeId)
  const detailEl = document.getElementById(ids.detailId)
  const provinceCode = String(provinceEl?.value || '').trim()
  const communeCode = String(communeEl?.value || '').trim()
  const detail = String(detailEl?.value || '').trim()
  const address = syncAddressFullText(scope)
  return {
    address,
    valid: !!(provinceCode && communeCode && detail && address),
    provinceCode,
    communeCode,
    detail,
    effectiveDate: ADDRESS_EFFECTIVE_DATE
  }
}

function getCheckoutAddressBookKey() {
  if (isAdminUser) return 'qhclothes_checkout_addresses_admin'
  const uid = Number(currentUser?.userId || currentUser?.id || 0)
  if (uid > 0) return 'qhclothes_checkout_addresses_user_' + uid
  return 'qhclothes_checkout_addresses_guest'
}

function loadCheckoutAddressBook() {
  try {
    const raw = localStorage.getItem(getCheckoutAddressBookKey())
    const parsed = raw ? JSON.parse(raw) : []
    checkoutAddressBook = Array.isArray(parsed) ? parsed.filter((item) => item && item.id) : []
  } catch (_) {
    checkoutAddressBook = []
  }
  return checkoutAddressBook
}

function saveCheckoutAddressBook() {
  try {
    localStorage.setItem(getCheckoutAddressBookKey(), JSON.stringify(checkoutAddressBook))
  } catch (_) { }
}

function maskCheckoutPhone(phone) {
  const raw = String(phone || '').replace(/\\s/g, '')
  if (raw.length <= 4) return raw
  const prefix = raw.startsWith('0') ? '(+84)' + raw.slice(1, 3) : raw.slice(0, 5)
  return prefix + '*****' + raw.slice(-2)
}

function captureCheckoutAddressFromFields() {
  return captureAddressRecordFromScope('ck')
}

function captureAddressRecordFromScope(scope) {
  const cfg = getCheckoutScopeConfig(scope)
  const name = document.getElementById(cfg.nameInputId)?.value.trim() || ''
  const phone = document.getElementById(cfg.phoneInputId)?.value.trim() || ''
  const addressPayload = getAddressPayload(scope)
  if (!name || !phone || !addressPayload.valid) return null
  return {
    id: editingCheckoutAddressId || ('addr_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)),
    name,
    phone,
    address: addressPayload.address,
    provinceCode: addressPayload.provinceCode,
    communeCode: addressPayload.communeCode,
    detail: addressPayload.detail,
    effectiveDate: addressPayload.effectiveDate,
    updatedAt: Date.now()
  }
}

function getCheckoutAddressFingerprint(record) {
  const phone = String(record?.phone || '').replace(/\D/g, '')
  const provinceCode = String(record?.provinceCode || '').trim()
  const communeCode = String(record?.communeCode || '').trim()
  const detail = normalizeSearchText(record?.detail || '')
  return [phone, provinceCode, communeCode, detail].join('|')
}

function snapshotCheckoutAddressFields() {
  return {
    selectedId: selectedCheckoutAddressId,
    name: document.getElementById('ckName')?.value || '',
    phone: document.getElementById('ckPhone')?.value || '',
    provinceCode: document.getElementById('ckProvince')?.value || '',
    communeCode: document.getElementById('ckCommune')?.value || '',
    detail: document.getElementById('ckAddressDetail')?.value || '',
    address: document.getElementById('ckAddress')?.value || ''
  }
}

async function restoreCheckoutAddressSnapshot(snapshot) {
  if (!snapshot) return
  const nameEl = document.getElementById('ckName')
  const phoneEl = document.getElementById('ckPhone')
  const provinceEl = document.getElementById('ckProvince')
  const communeEl = document.getElementById('ckCommune')
  const detailEl = document.getElementById('ckAddressDetail')
  const addressEl = document.getElementById('ckAddress')
  if (nameEl) nameEl.value = snapshot.name || ''
  if (phoneEl) phoneEl.value = snapshot.phone || ''
  if (provinceEl) {
    provinceEl.value = String(snapshot.provinceCode || '')
    if (snapshot.provinceCode) await onAddressProvinceChange('ck')
  }
  if (communeEl) communeEl.value = String(snapshot.communeCode || '')
  if (detailEl) detailEl.value = snapshot.detail || ''
  if (addressEl) addressEl.value = snapshot.address || ''
  selectedCheckoutAddressId = snapshot.selectedId || ''
  renderAddressDropdownList('ck', 'province', '')
  renderAddressDropdownList('ck', 'commune', '')
  syncAddressFullText('ck')
  renderCheckoutAddressSummary()
}

function getSelectedCheckoutAddress() {
  loadCheckoutAddressBook()
  return checkoutAddressBook.find((item) => item.id === selectedCheckoutAddressId) || checkoutAddressBook[0] || null
}

async function applyCheckoutAddressRecord(record) {
  await applyAddressRecordToScope(record, 'ck')
}

async function applyAddressRecordToScope(record, scope) {
  if (!record) return
  await ensureAddressKitReady()
  const cfg = getCheckoutScopeConfig(scope)
  const ids = getAddressScopeElements(scope)
  const nameEl = document.getElementById(cfg.nameInputId)
  const phoneEl = document.getElementById(cfg.phoneInputId)
  const provinceEl = document.getElementById(ids.provinceId)
  const communeEl = document.getElementById(ids.communeId)
  const detailEl = document.getElementById(ids.detailId)
  if (nameEl) nameEl.value = record.name || ''
  if (phoneEl) phoneEl.value = record.phone || ''
  if (provinceEl) {
    provinceEl.value = String(record.provinceCode || '')
    await onAddressProvinceChange(scope)
  }
  if (communeEl) communeEl.value = String(record.communeCode || '')
  if (detailEl) detailEl.value = String(record.detail || '')
  renderAddressDropdownList(scope, 'province', '')
  renderAddressDropdownList(scope, 'commune', '')
  syncAddressFullText(scope)
  selectedCheckoutAddressId = record.id || ''
  if (scope === 'ck') {
    ;['ckFieldName','ckFieldPhone','ckFieldAddress'].forEach(id => clearCheckoutError(id))
    renderCheckoutAddressSummary()
  } else {
    ;['fieldName','fieldPhone','fieldAddress'].forEach(id => clearFieldError(id))
    renderOrderAddressSummary()
  }
}

function ensureCheckoutAddressBookFromCurrentFields() {
  loadCheckoutAddressBook()
  const current = captureCheckoutAddressFromFields()
  if (!current) return null
  const existingIndex = checkoutAddressBook.findIndex((item) => {
    return String(item.phone || '') === current.phone && String(item.address || '') === current.address
  })
  if (existingIndex >= 0) {
    current.id = checkoutAddressBook[existingIndex].id
    checkoutAddressBook[existingIndex] = { ...checkoutAddressBook[existingIndex], ...current }
  } else {
    checkoutAddressBook.unshift(current)
  }
  selectedCheckoutAddressId = current.id
  saveCheckoutAddressBook()
  return current
}

function renderCheckoutAddressSummary() {
  const box = document.getElementById('ckMobileAddressSummary')
  if (!box) return
  const name = document.getElementById('ckName')?.value.trim() || ''
  const phone = document.getElementById('ckPhone')?.value.trim() || ''
  const address = syncAddressFullText('ck')
  box.classList.remove('hidden')
  if (!name || !phone || !address) {
    box.innerHTML = '<button type="button" onclick="openCheckoutAddressEditor()" class="checkout-address-empty-card">'
      + '<span class="checkout-address-pin"><i class="fas fa-map-marker-alt"></i></span>'
      + '<span class="min-w-0 flex-1"><strong>Thêm địa chỉ nhận hàng</strong><small>Điền tên, số điện thoại và địa chỉ giao hàng</small></span>'
      + '<i class="fas fa-chevron-right"></i>'
      + '</button>'
    return
  }
  box.innerHTML = '<button type="button" onclick="openCheckoutAddressManager()" class="checkout-address-selected-card">'
    + '<span class="checkout-address-pin"><i class="fas fa-map-marker-alt"></i></span>'
    + '<span class="min-w-0 flex-1 text-left">'
    + '<strong>' + escapeHtml(name) + ' <span>' + escapeHtml(maskCheckoutPhone(phone)) + '</span></strong>'
    + '<small>' + escapeHtml(address) + '</small>'
    + '</span>'
    + '<i class="fas fa-chevron-right"></i>'
    + '</button>'
}

function snapshotOrderAddressFields() {
  return {
    selectedId: selectedCheckoutAddressId,
    name: document.getElementById('orderName')?.value || '',
    phone: document.getElementById('orderPhone')?.value || '',
    provinceCode: document.getElementById('orderProvince')?.value || '',
    communeCode: document.getElementById('orderCommune')?.value || '',
    detail: document.getElementById('orderAddressDetail')?.value || '',
    address: document.getElementById('orderAddress')?.value || ''
  }
}

async function restoreOrderAddressSnapshot(snapshot) {
  if (!snapshot) return
  const nameEl = document.getElementById('orderName')
  const phoneEl = document.getElementById('orderPhone')
  const provinceEl = document.getElementById('orderProvince')
  const communeEl = document.getElementById('orderCommune')
  const detailEl = document.getElementById('orderAddressDetail')
  const addressEl = document.getElementById('orderAddress')
  if (nameEl) nameEl.value = snapshot.name || ''
  if (phoneEl) phoneEl.value = snapshot.phone || ''
  if (provinceEl) {
    provinceEl.value = String(snapshot.provinceCode || '')
    if (snapshot.provinceCode) await onAddressProvinceChange('order')
  }
  if (communeEl) communeEl.value = String(snapshot.communeCode || '')
  if (detailEl) detailEl.value = snapshot.detail || ''
  if (addressEl) addressEl.value = snapshot.address || ''
  selectedCheckoutAddressId = snapshot.selectedId || ''
  renderAddressDropdownList('order', 'province', '')
  renderAddressDropdownList('order', 'commune', '')
  syncAddressFullText('order')
  renderOrderAddressSummary()
}

function renderOrderAddressSummary() {
  const box = document.getElementById('orderMobileAddressSummary')
  if (!box) return
  const name = document.getElementById('orderName')?.value.trim() || ''
  const phone = document.getElementById('orderPhone')?.value.trim() || ''
  const address = syncAddressFullText('order')
  box.classList.remove('hidden')
  if (!name || !phone || !address) {
    box.innerHTML = '<button type="button" onclick="openOrderAddressEditor()" class="checkout-address-empty-card">'
      + '<span class="checkout-address-pin"><i class="fas fa-map-marker-alt"></i></span>'
      + '<span class="min-w-0 flex-1"><strong>Thêm địa chỉ nhận hàng</strong><small>Điền tên, số điện thoại và địa chỉ giao hàng</small></span>'
      + '<i class="fas fa-chevron-right"></i>'
      + '</button>'
    return
  }
  box.innerHTML = '<button type="button" onclick="openOrderAddressManager()" class="checkout-address-selected-card">'
    + '<span class="checkout-address-pin"><i class="fas fa-map-marker-alt"></i></span>'
    + '<span class="min-w-0 flex-1 text-left">'
    + '<strong>' + escapeHtml(name) + ' <span>' + escapeHtml(maskCheckoutPhone(phone)) + '</span></strong>'
    + '<small>' + escapeHtml(address) + '</small>'
    + '</span>'
    + '<i class="fas fa-chevron-right"></i>'
    + '</button>'
}

async function openOrderAddressEditor(addressId) {
  editingCheckoutAddressId = String(addressId || '')
  orderAddressEditorSaved = false
  orderAddressEditorSnapshot = snapshotOrderAddressFields()
  const record = editingCheckoutAddressId ? checkoutAddressBook.find((item) => item.id === editingCheckoutAddressId) : null
  if (record) {
    await applyAddressRecordToScope(record, 'order')
  } else if (!editingCheckoutAddressId) {
    ;['orderName','orderPhone','orderAddress','orderAddressDetail'].forEach(id => { const el=document.getElementById(id); if(el) el.value='' })
    resetAddressScope('order')
  }
  const editor = document.getElementById('orderShippingEditor')
  if (editor) {
    editor.classList.add('is-open')
    lockStorefrontPageScroll('orderShippingEditor')
  }
}

function closeOrderAddressEditor() {
  const editor = document.getElementById('orderShippingEditor')
  if (editor) editor.classList.remove('is-open')
  if (!orderAddressEditorSaved && orderAddressEditorSnapshot) {
    restoreOrderAddressSnapshot(orderAddressEditorSnapshot).catch(() => { })
  }
  editingCheckoutAddressId = ''
  orderAddressEditorSaved = false
  orderAddressEditorSnapshot = null
  unlockStorefrontPageScroll('orderShippingEditor')
}

async function saveOrderAddressFromEditor() {
  const payload = validateCheckoutFields('order', {})
  if (!payload) return
  const record = captureAddressRecordFromScope('order')
  if (!record) return
  loadCheckoutAddressBook()
  const recordFingerprint = getCheckoutAddressFingerprint(record)
  const duplicate = checkoutAddressBook.find((item) => {
    return item.id !== record.id && getCheckoutAddressFingerprint(item) === recordFingerprint
  })
  if (duplicate) {
    if (record.id) {
      let merged = false
      checkoutAddressBook = checkoutAddressBook
        .map((item) => {
          if (item.id === record.id) {
            merged = true
            return { ...item, ...record }
          }
          return item
        })
        .filter((item) => item.id === record.id || getCheckoutAddressFingerprint(item) !== recordFingerprint)
      if (!merged) checkoutAddressBook.unshift(record)
      selectedCheckoutAddressId = record.id
      saveCheckoutAddressBook()
      await applyAddressRecordToScope(record, 'order')
      renderCheckoutAddressManager()
      showToast('Đã cập nhật và gộp địa chỉ trùng.', 'success', 3000)
    } else {
      showToast('Địa chỉ này đã tồn tại trong danh sách.', 'error', 3500)
      await applyAddressRecordToScope(duplicate, 'order')
    }
    orderAddressEditorSaved = true
    closeOrderAddressEditor()
    return
  }
  const idx = checkoutAddressBook.findIndex((item) => item.id === record.id)
  if (idx >= 0) checkoutAddressBook[idx] = { ...checkoutAddressBook[idx], ...record }
  else checkoutAddressBook.unshift(record)
  selectedCheckoutAddressId = record.id
  saveCheckoutAddressBook()
  await applyAddressRecordToScope(record, 'order')
  renderCheckoutAddressManager()
  orderAddressEditorSaved = true
  closeOrderAddressEditor()
}

function openCheckoutAddressEditor(addressId) {
  checkoutAddressContext = 'ck'
  editingCheckoutAddressId = String(addressId || '')
  checkoutAddressEditorSaved = false
  checkoutAddressEditorSnapshot = snapshotCheckoutAddressFields()
  const record = editingCheckoutAddressId ? checkoutAddressBook.find((item) => item.id === editingCheckoutAddressId) : null
  const editor = document.getElementById('ckShippingEditor')
  if (record) {
    applyCheckoutAddressRecord(record).catch(() => { })
  } else if (!editingCheckoutAddressId) {
    ;['ckName','ckPhone','ckAddress','ckAddressDetail'].forEach(id => { const el=document.getElementById(id); if(el) el.value='' })
    resetAddressScope('ck')
  }
  if (editor) {
    editor.classList.add('is-open')
    lockStorefrontPageScroll('ckShippingEditor')
  }
}

function openCheckoutAddressEditorFromManager(addressId) {
  const modal = document.getElementById('checkoutAddressManagerOverlay')
  const panel = document.getElementById('checkoutAddressManagerPanel')
  if (modal && panel && !modal.classList.contains('hidden')) {
    panel.classList.remove('translate-y-0')
    panel.classList.add('translate-y-full')
    modal.classList.add('hidden')
    modal.classList.remove('flex')
    unlockStorefrontPageScroll('checkoutAddressManagerOverlay')
  }
  setTimeout(() => {
    if (checkoutAddressContext === 'order') openOrderAddressEditor(addressId)
    else openCheckoutAddressEditor(addressId)
  }, 0)
}

function closeCheckoutAddressEditor() {
  const editor = document.getElementById('ckShippingEditor')
  if (editor) editor.classList.remove('is-open')
  if (!checkoutAddressEditorSaved && checkoutAddressEditorSnapshot) {
    restoreCheckoutAddressSnapshot(checkoutAddressEditorSnapshot).catch(() => { })
  }
  editingCheckoutAddressId = ''
  checkoutAddressEditorSaved = false
  checkoutAddressEditorSnapshot = null
  unlockStorefrontPageScroll('ckShippingEditor')
}

async function saveCheckoutAddressFromEditor() {
  const payload = validateCheckoutFields('ck', {})
  if (!payload) return
  const record = captureCheckoutAddressFromFields()
  if (!record) return
  loadCheckoutAddressBook()
  const recordFingerprint = getCheckoutAddressFingerprint(record)
  const duplicate = checkoutAddressBook.find((item) => {
    return item.id !== record.id && getCheckoutAddressFingerprint(item) === recordFingerprint
  })
  if (duplicate) {
    if (record.id) {
      let merged = false
      checkoutAddressBook = checkoutAddressBook
        .map((item) => {
          if (item.id === record.id) {
            merged = true
            return { ...item, ...record }
          }
          return item
        })
        .filter((item) => item.id === record.id || getCheckoutAddressFingerprint(item) !== recordFingerprint)
      if (!merged) checkoutAddressBook.unshift(record)
      selectedCheckoutAddressId = record.id
      saveCheckoutAddressBook()
      await applyCheckoutAddressRecord(record)
      renderCheckoutAddressManager()
      showToast('Đã cập nhật và gộp địa chỉ trùng.', 'success', 3000)
    } else {
      showToast('Địa chỉ này đã tồn tại trong danh sách.', 'error', 3500)
      await applyCheckoutAddressRecord(duplicate)
    }
    checkoutAddressEditorSaved = true
    closeCheckoutAddressEditor()
    return
  }
  const idx = checkoutAddressBook.findIndex((item) => item.id === record.id)
  if (idx >= 0) checkoutAddressBook[idx] = { ...checkoutAddressBook[idx], ...record }
  else checkoutAddressBook.unshift(record)
  selectedCheckoutAddressId = record.id
  saveCheckoutAddressBook()
  renderCheckoutAddressSummary()
  renderCheckoutAddressManager()
  checkoutAddressEditorSaved = true
  closeCheckoutAddressEditor()
}

function renderCheckoutAddressManager() {
  const list = document.getElementById('checkoutAddressManagerList')
  if (!list) return
  loadCheckoutAddressBook()
  if (!checkoutAddressBook.length) {
    list.innerHTML = '<div class="px-5 py-8 text-center text-sm text-gray-500">Chưa có địa chỉ nào</div>'
    return
  }
  list.innerHTML = checkoutAddressBook.map((item) => {
    const isActive = item.id === selectedCheckoutAddressId
    return '<div class="checkout-address-manage-row' + (isActive ? ' is-active' : '') + '">'
      + '<button type="button" class="checkout-address-manage-main" onclick="selectCheckoutManagedAddress(\\'' + escapeHtml(item.id) + '\\')">'
      + '<strong>' + escapeHtml(item.name || '') + '</strong>'
      + '<span>' + escapeHtml(maskCheckoutPhone(item.phone || '')) + '</span>'
      + '<p>' + escapeHtml(item.address || '') + '</p>'
      + (isActive ? '<em>Mặc định</em>' : '')
      + '</button>'
      + '<button type="button" class="checkout-address-edit-btn" onclick="openCheckoutAddressEditorFromManager(\\'' + escapeHtml(item.id) + '\\')">Chỉnh sửa</button>'
      + '</div>'
  }).join('')
}

function openCheckoutAddressManager() {
  checkoutAddressContext = 'ck'
  renderCheckoutAddressManager()
  const modal = document.getElementById('checkoutAddressManagerOverlay')
  const panel = document.getElementById('checkoutAddressManagerPanel')
  if (!modal || !panel) return
  modal.classList.remove('hidden')
  modal.classList.add('flex')
  lockStorefrontPageScroll('checkoutAddressManagerOverlay')
  setTimeout(() => {
    panel.classList.remove('translate-y-full')
    panel.classList.add('translate-y-0')
  }, 10)
}

function openOrderAddressManager() {
  checkoutAddressContext = 'order'
  renderCheckoutAddressManager()
  const modal = document.getElementById('checkoutAddressManagerOverlay')
  const panel = document.getElementById('checkoutAddressManagerPanel')
  if (!modal || !panel) return
  modal.classList.remove('hidden')
  modal.classList.add('flex')
  lockStorefrontPageScroll('checkoutAddressManagerOverlay')
  setTimeout(() => {
    panel.classList.remove('translate-y-full')
    panel.classList.add('translate-y-0')
  }, 10)
}

function closeCheckoutAddressManager() {
  const modal = document.getElementById('checkoutAddressManagerOverlay')
  const panel = document.getElementById('checkoutAddressManagerPanel')
  if (!modal || !panel) return
  panel.classList.remove('translate-y-0')
  panel.classList.add('translate-y-full')
  setTimeout(() => {
    modal.classList.add('hidden')
    modal.classList.remove('flex')
    unlockStorefrontPageScroll('checkoutAddressManagerOverlay')
  }, 260)
}

function selectCheckoutManagedAddress(addressId) {
  const record = checkoutAddressBook.find((item) => item.id === addressId)
  if (!record) return
  const applyRecord = checkoutAddressContext === 'order'
    ? applyAddressRecordToScope(record, 'order')
    : applyCheckoutAddressRecord(record)
  applyRecord
    .then(() => closeCheckoutAddressManager())
    .catch(() => showToast('Không thể áp dụng địa chỉ này. Vui lòng thử lại.', 'error', 3500))
}

function updateCheckoutNoteActionLabel() {
  const note = document.getElementById('ckNote')?.value.trim() || ''
  const row = document.querySelector('#ckNoteField .checkout-note-field-row span')
  if (row) row.innerHTML = '<i class="fas fa-sticky-note text-pink-400 mr-1"></i>' + (note ? 'Ghi chú' : 'Ghi chú (tuỳ chọn)')
  document.querySelectorAll('.checkout-note-preview-inline').forEach((preview) => {
    preview.textContent = note
    preview.classList.toggle('hidden', !note)
  })
}

function updateOrderNoteActionLabel() {
  const note = document.getElementById('orderNote')?.value.trim() || ''
  const row = document.querySelector('#orderNoteField .checkout-note-field-row span')
  if (row) row.innerHTML = '<i class="fas fa-sticky-note text-pink-400 mr-1"></i>' + (note ? 'Ghi chú' : 'Ghi chú (tuỳ chọn)')
  document.querySelectorAll('.order-note-preview-inline').forEach((preview) => {
    preview.textContent = note
    preview.classList.toggle('hidden', !note)
  })
}

function getCheckoutNoteInputId(scope) {
  return scope === 'order' ? 'orderNote' : 'ckNote'
}

function openCheckoutNoteSheet(scope) {
  checkoutNoteContext = scope === 'order' ? 'order' : 'ck'
  const modal = document.getElementById('checkoutNoteOverlay')
  const panel = document.getElementById('checkoutNotePanel')
  const draft = document.getElementById('checkoutNoteDraft')
  if (draft) draft.value = document.getElementById(getCheckoutNoteInputId(checkoutNoteContext))?.value || ''
  if (!modal || !panel) return
  modal.classList.remove('hidden')
  modal.classList.add('flex')
  lockStorefrontPageScroll('checkoutNoteOverlay')
  setTimeout(() => {
    panel.classList.remove('opacity-0', 'scale-95')
    panel.classList.add('opacity-100', 'scale-100')
    draft?.focus()
  }, 10)
}

function closeCheckoutNoteSheet() {
  const modal = document.getElementById('checkoutNoteOverlay')
  const panel = document.getElementById('checkoutNotePanel')
  if (!modal || !panel) return
  panel.classList.remove('opacity-100', 'scale-100')
  panel.classList.add('opacity-0', 'scale-95')
  setTimeout(() => {
    modal.classList.add('hidden')
    modal.classList.remove('flex')
    unlockStorefrontPageScroll('checkoutNoteOverlay')
  }, 260)
}

function saveCheckoutNoteSheet() {
  const noteEl = document.getElementById(getCheckoutNoteInputId(checkoutNoteContext))
  const draft = document.getElementById('checkoutNoteDraft')
  if (noteEl && draft) noteEl.value = draft.value.trim()
  if (checkoutNoteContext === 'order') updateOrderNoteActionLabel()
  else updateCheckoutNoteActionLabel()
  closeCheckoutNoteSheet()
}

function clearCheckoutNoteSheet() {
  const draft = document.getElementById('checkoutNoteDraft')
  if (draft) draft.value = ''
}

function resolveCartStorageKey() {
  if (isAdminUser) return 'qhclothes_cart_admin'
  const uid = Number(currentUser?.userId || currentUser?.id || 0)
  if (uid > 0) return 'qhclothes_cart_user_' + uid
  return 'qhclothes_cart_guest'
}

function syncCartScope(force = false) {
  const nextKey = resolveCartStorageKey()
  if (!force && nextKey === cartStorageKey) return
  cartStorageKey = nextKey
  loadCart(true)
  const overlay = document.getElementById('cartOverlay')
  if (overlay && !overlay.classList.contains('hidden')) {
    renderCartStep1()
  }
}

function loadCart(useCurrentScope = false) {
  if (!useCurrentScope) cartStorageKey = resolveCartStorageKey()
  try { cart = JSON.parse(localStorage.getItem(cartStorageKey) || '[]') } catch { cart = [] }
  updateCartBadge()
}
function saveCart() {
  localStorage.setItem(cartStorageKey, JSON.stringify(cart))
  updateCartBadge()
}
function updateCartBadge() {
  const total = cart.reduce((s,i)=>s+i.qty,0)
  
  const updateBadge = (id) => {
    const badge = document.getElementById(id)
    if (!badge) return
    if (total > 0) {
      badge.textContent = total > 99 ? '99+' : total
      badge.classList.remove('hidden')
      badge.classList.add('flex')
      badge.classList.add('cart-badge-bounce')
      setTimeout(()=>badge.classList.remove('cart-badge-bounce'),400)
    } else {
      badge.classList.add('hidden')
      badge.classList.remove('flex')
    }
  }

  updateBadge('cartBadge')
  updateBadge('cartBadgeMobile')
  updateBadge('cartBadgeBottom')
  updateBadge('cartBadgeCategory')
  updateBadge('cartBadgeDetail')
  updateBadge('cartBadgeDetailHeader')
}
function genCartId() { return Date.now().toString(36)+Math.random().toString(36).slice(2,7) }

function addToCart(product, color, size, qty, skuOverride) {
  if (!assertCustomerCanShop()) return false
  const sku = skuOverride || getProductSkuBySelection(product, color, size)
  const skuId = sku?.id ? String(sku.id) : ''
  // check duplicate: same SKU when available, fallback productId + color + size
  const exist = cart.find(i => skuId
    ? String(i.productSkuId || '') === skuId
    : (i.productId === product.id && i.color === color && i.size === size))
  if (exist) {
    exist.qty = Math.min(99, exist.qty + qty)
  } else {
    const priceInfo = getProductDisplayPriceInfo(product, sku)
    cart.push({
      cartId: genCartId(),
      productId: product.id,
      productSkuId: sku?.id || '',
      name: product.name,
      sku: sku?.sku_code || product.sku || ('SKU-'+String(product.id).padStart(4,'0')),
      thumbnail: sku?.image || product.thumbnail || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
      price: priceInfo.price,
      color,
      colorImage: sku?.image || getSelectedColorImageFromProduct(product, color),
      size, qty,
      checked: true
    })
  }
  saveCart()
  return true
}

// ── INIT ──────────────────────────────────────────
function inferStorefrontProductType(product) {
  const explicit = String(product?.product_type || product?.product_type_slug || '').trim()
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

function getHotTrendNuTypeFilterOptions() {
  return HOT_TREND_NU_TYPE_FILTERS.map((item) => ({ ...item }))
}

function getHotTrendNuTypeFilterMembers(slug) {
  const key = String(slug || 'all').trim()
  const filter = HOT_TREND_NU_TYPE_FILTERS.find((item) => item.slug === key)
  return filter ? filter.members : null
}

function productMatchesTypeFilter(product) {
  if (!activeProductType || activeProductType === 'all') return true
  const productType = String(inferStorefrontProductType(product) || '').trim().toLowerCase()
  if (!productType) return false
  if (isHotTrendWomenContext()) {
    const members = getHotTrendNuTypeFilterMembers(activeProductType)
    if (Array.isArray(members)) return members.includes(productType)
  }
  return productType === activeProductType
}

function renderFilterModalTypeOptions() {
  const row = document.getElementById('filterModalTypeRow')
  if (!row) return
  const types = isHotTrendWomenContext()
    ? getHotTrendNuTypeFilterOptions()
    : (Array.isArray(storefrontProductTypes) ? storefrontProductTypes.filter((item) => item && item.active !== false) : [])
  row.innerHTML = '<button class="filter-modal-chip" data-val="all" onclick="selectFilterModalType(\\'all\\', this)">Tất cả</button>' +
    types.filter((item) => item && item.slug !== 'all').map((item) => {
      const slug = escapeHtml(item.slug || '')
      const name = escapeHtml(item.name || item.slug || '')
      return '<button class="filter-modal-chip" data-val="' + slug + '" onclick="selectFilterModalType(\\'' + slug + '\\', this)">' + name + '</button>'
    }).join('')
  document.querySelectorAll('#filterModalTypeRow .filter-modal-chip').forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-val') === activeProductType)
  })
  if (!row.querySelector('.filter-modal-chip.active')) {
    const allBtn = row.querySelector('.filter-modal-chip[data-val="all"]')
    if (allBtn) allBtn.classList.add('active')
  }
}

async function loadProductTypes() {
  try {
    const res = await axios.get('/api/product-types' + getStorefrontQuerySuffix())
    storefrontProductTypes = Array.isArray(res.data?.data) && res.data.data.length ? res.data.data : DEFAULT_STOREFRONT_PRODUCT_TYPES
  } catch (_) {
    storefrontProductTypes = DEFAULT_STOREFRONT_PRODUCT_TYPES
  }
  renderFilterModalTypeOptions()
  renderHotTrendNuCategorySurfaces()
}

async function loadProducts() {
  try {
    const [res] = await Promise.all([axios.get('/api/products' + getStorefrontQuerySuffix()), loadProductTypes()])
    allProducts = scopeStorefrontProductsForPage(res.data.data || [])
    hydrateProductSearchFromUrl()
    updateHotTrendNuFilterOptions()
    applyProductsFilters()
    if (isHotTrendWomenContext()) {
      loadHotTrendNuTrendingProducts()
      loadBestSellers()
    }
    loadFlashSaleShop()
    checkUrlDeepLink()
  } catch(e) {
    document.getElementById('productsGrid').innerHTML = '<div class="col-span-full text-center text-gray-400 py-12"><i class="fas fa-exclamation-circle text-4xl mb-3"></i><p>Không thể tải sản phẩm</p></div>'
  }
}

function checkUrlDeepLink() {
  try {
    const params = new URLSearchParams(window.location.search)
    const productId = params.get('product')
    if (productId) {
      if (!document.getElementById('detailOverlay') || document.getElementById('detailOverlay').classList.contains('hidden')) {
        showDetail(productId, { fromUrl: true })
      }
    }
  } catch(e) {}
}

// ── REVIEWS ─────────────────────────────────────────
let _reviewState = { productId: 0, orderId: 0, rating: 5, images: [], submitting: false }
let detailReviewCache = {}
let detailReviewExpandedState = {}

function renderDetailReviewsContent(productId) {
  const contents = document.querySelectorAll('.detail-reviews-content')
  if (!contents.length) return
  const reviewData = detailReviewCache[String(productId || '')]
  if (!reviewData || !Array.isArray(reviewData.reviews) || !reviewData.reviews.length) return
  const reviews = reviewData.reviews
  const avg = Number(reviewData.avg || 0)
  const total = Number(reviewData.total || reviews.length || 0)
  const expanded = !!detailReviewExpandedState[String(productId || '')]
  const visibleReviews = expanded ? reviews : reviews.slice(0, 3)
  const hiddenCount = Math.max(0, reviews.length - 3)
  const stars = (n) => '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n))
  const renderReviewCard = (r) => {
    const avatarHtml = r.user_avatar
      ? \`<img src="\${escapeHtml(r.user_avatar)}" class="review-avatar" onerror="this.src=''">\`
      : \`<div class="review-avatar bg-violet-100 flex items-center justify-center text-violet-500 text-xs font-bold">\${escapeHtml((r.user_name || '?')[0].toUpperCase())}</div>\`
    const imgHtml = Array.isArray(r.images) && r.images.length
      ? \`<div class="flex gap-1.5 mt-2 flex-wrap">\${r.images.map(img => \`<img src="\${escapeHtml(img)}" class="review-img-thumb" onclick="window.open('\${escapeHtml(img)}','_blank')">\`).join('')}</div>\`
      : ''
    return \`<div class="review-card">
      <div class="flex items-center gap-2 mb-1.5">
        \${avatarHtml}
        <div>
          <p class="text-xs font-semibold text-gray-700">\${escapeHtml(r.user_name || 'Khách hàng')}</p>
          <span class="review-stars">\${'★'.repeat(Number(r.rating))}\${'☆'.repeat(5 - Number(r.rating))}</span>
        </div>
        <span class="ml-auto text-xs text-gray-400">\${new Date(r.created_at).toLocaleDateString('vi-VN')}</span>
      </div>
      \${r.comment ? \`<p class="text-sm text-gray-600 leading-relaxed">\${escapeHtml(r.comment)}</p>\` : ''}
      \${imgHtml}
    </div>\`
  }
  const html = \`
    <div class="flex items-center gap-2 mb-3">
      <span class="review-avg-stars text-lg">\${stars(avg)}</span>
      <span class="font-bold text-gray-800 text-sm">\${avg.toFixed(1)}</span>
      <span class="text-gray-400 text-xs">(\${total} đánh giá)</span>
    </div>
    <div class="detail-reviews-stack relative">
      <div class="space-y-3">
        \${visibleReviews.map(renderReviewCard).join('')}
      </div>
      \${hiddenCount > 0 ? \`
        <div class="detail-reviews-toggle-wrap \${expanded ? 'is-expanded' : ''}">
          <div class="detail-reviews-fade \${expanded ? 'hidden' : ''}" aria-hidden="true"></div>
          <button type="button" class="detail-reviews-toggle-btn" onclick="toggleDetailReviews(\${Number(productId)})">
            <i class="fas \${expanded ? 'fa-chevron-up' : 'fa-chevron-down'}" aria-hidden="true"></i>
            <span>\${expanded ? 'Thu gọn đánh giá' : 'Xem thêm đánh giá (' + hiddenCount + ')'}</span>
          </button>
        </div>\` : ''}
    </div>\`
  contents.forEach(c => c.innerHTML = html)
}

function toggleDetailReviews(productId) {
  const key = String(productId || '')
  detailReviewExpandedState[key] = !detailReviewExpandedState[key]
  renderDetailReviewsContent(productId)
}

async function loadProductReviews(productId) {
  const sections = document.querySelectorAll('.detail-reviews-section')
  const contents = document.querySelectorAll('.detail-reviews-content')
  if (!sections.length || !contents.length) return
  sections.forEach(s => s.classList.remove('hidden'))
  try {
    const res = await axios.get('/api/reviews?productId=' + productId)
    const reviews = Array.isArray(res.data?.data) ? res.data.data : []
    const avg = Number(res.data?.avgRating || 0)
    const total = Number(res.data?.total || 0)
    if (!reviews.length) {
      contents.forEach(c => c.innerHTML = '<p class="text-gray-400 text-sm py-2">Chưa có đánh giá nào. Hãy là người đầu tiên!</p>')
      return
    }
    detailReviewCache[String(productId)] = { reviews, avg, total }
    if (detailReviewExpandedState[String(productId)] === undefined) {
      detailReviewExpandedState[String(productId)] = false
    }
    renderDetailReviewsContent(productId)
  } catch(e) {
    sections.forEach(s => s.classList.add('hidden'))
  }
}

async function openReviewModal(orderId, productId) {
  if (!currentUser) { showToast('Vui lòng đăng nhập để đánh giá', 'error'); return }
  if (!isAdminUser) { showToast('Chỉ admin mới có thể quản lý đánh giá', 'error'); return }
  _reviewState = { productId: Number(productId), orderId: Number(orderId), rating: 5, images: [], submitting: false }
  // Reset UI
  setReviewRating(5)
  document.getElementById('reviewComment').value = ''
  document.getElementById('reviewImgPreviews').innerHTML = ''
  document.getElementById('reviewImgInput').value = ''
  // Load product info for display
  try {
    const res = await axios.get('/api/products/' + productId)
    const p = res.data?.data
    if (p) {
      document.getElementById('reviewProductInfo').innerHTML =
        \`<img src="\${escapeHtml(p.thumbnail||'')}" class="w-12 h-12 rounded-lg object-cover bg-gray-100" onerror="this.style.display='none'">
        <div><p class="text-sm font-semibold text-gray-800">\${escapeHtml(p.name||'')}</p><p class="text-xs text-gray-400">Đơn hàng #\${orderId}</p></div>\`
    }
  } catch { document.getElementById('reviewProductInfo').innerHTML = '<p class="text-sm text-gray-500">Đơn hàng #' + orderId + '</p>' }
  document.getElementById('reviewModalOverlay').classList.remove('hidden')
  lockStorefrontPageScroll('reviewModalOverlay')
}

function closeReviewModal() {
  document.getElementById('reviewModalOverlay').classList.add('hidden')
  unlockStorefrontPageScroll('reviewModalOverlay')
}

function handleReviewOverlayClick(e) {
  if (e.target === document.getElementById('reviewModalOverlay')) closeReviewModal()
}

function setReviewRating(n) {
  _reviewState.rating = n
  document.querySelectorAll('.review-star-btn').forEach(btn => {
    const v = Number(btn.getAttribute('data-v'))
    btn.textContent = v <= n ? '★' : '☆'
    btn.classList.toggle('active', v <= n)
    btn.style.color = v <= n ? '#f59e0b' : '#d1d5db'
  })
}

function onReviewImgSelected(input) {
  const files = Array.from(input.files || [])
  const remaining = 3 - _reviewState.images.length
  if (!remaining) { showToast('Tối đa 3 ảnh', 'error'); return }
  const toAdd = files.slice(0, remaining)
  const previews = document.getElementById('reviewImgPreviews')
  toAdd.forEach(file => {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target.result
      if (dataUrl.length > 700000) { showToast('Ảnh quá lớn (tối đa 500KB)', 'error'); return }
      _reviewState.images.push(dataUrl)
      const wrapper = document.createElement('div')
      wrapper.className = 'relative'
      wrapper.innerHTML = \`<img src="\${dataUrl}" class="review-img-preview">
        <button onclick="removeReviewImg(\${_reviewState.images.length - 1}, this.parentNode)"
          class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs font-bold flex items-center justify-center">×</button>\`
      previews.appendChild(wrapper)
    }
    reader.readAsDataURL(file)
  })
}

function removeReviewImg(idx, wrapper) {
  _reviewState.images.splice(idx, 1)
  wrapper?.remove()
  // Refresh indices on remaining remove buttons
  document.querySelectorAll('#reviewImgPreviews > div').forEach((el, i) => {
    const btn = el.querySelector('button')
    if (btn) btn.setAttribute('onclick', \`removeReviewImg(\${i}, this.parentNode)\`)
  })
}

async function submitReview() {
  if (_reviewState.submitting) return
  if (!currentUser) { showToast('Vui lòng đăng nhập', 'error'); return }
  if (!isAdminUser) { showToast('Chỉ admin mới có thể quản lý đánh giá', 'error'); return }
  const comment = (document.getElementById('reviewComment').value || '').trim()
  if (!comment) { showToast('Vui lòng nhập nhận xét', 'error'); document.getElementById('reviewComment').focus(); return }
  _reviewState.submitting = true
  const btn = document.getElementById('reviewSubmitBtn')
  btn.disabled = true
  btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Đang gửi...'
  try {
    const order = Array.isArray(userOrderHistoryCache)
      ? userOrderHistoryCache.find((item) => Number(item.id) === Number(_reviewState.orderId))
      : null
    const res = await axios.post('/api/admin/reviews', {
      product_id: _reviewState.productId,
      user_id: Number(order?.user_id || currentUser?.userId || 0),
      order_id: _reviewState.orderId,
      rating: _reviewState.rating,
      comment,
      images: _reviewState.images
    })
    closeReviewModal()
    showToast('Cảm ơn bạn đã đánh giá! ⭐', 'success', 3500)
    // Refresh reviews in product detail if open
    if (detailSelectedProductId === _reviewState.productId) {
      loadProductReviews(_reviewState.productId)
    }
    // Refresh order history to remove the rate button for this order
    showUserOrders()
  } catch(e) {
    const code = e.response?.data?.error
    const msg = code === 'ALREADY_REVIEWED' ? 'Bạn đã đánh giá đơn hàng này rồi'
              : code === 'ORDER_NOT_ELIGIBLE' ? 'Đơn hàng chưa đủ điều kiện đánh giá'
              : code === 'UNAUTHORIZED' ? 'Vui lòng đăng nhập để đánh giá'
              : 'Gửi đánh giá thất bại, thử lại sau'
    showToast(msg, 'error')
  } finally {
    _reviewState.submitting = false
    btn.disabled = false
    btn.innerHTML = '<i class="fas fa-paper-plane mr-2"></i>Gửi đánh giá'
  }
}


async function loadBestSellers() {
  const track = document.getElementById('bestsellersTrack')
  if (!track) return
  const section = document.getElementById('bestsellersSection')
  try {
    ensureBestsellerRuntimeStyle()
    if (isHotTrendWomenContext()) {
      const res = await axios.get('/api/new-arrival-products?limit=10&storefront=' + encodeURIComponent(getCurrentStorefrontKey()))
      const products = scopeStorefrontProductsForPage(Array.isArray(res.data?.data) ? res.data.data : [])
      if (!products.length) {
        track.innerHTML = ''
        section?.classList.add('hidden')
        syncHotTrendNuDealsRowState()
        return
      }
      section?.classList.remove('hidden')
      track.innerHTML = products.slice(0, 3).map((p, i) => renderHotTrendNuBestsellerCard(p, i)).join('')
      syncHotTrendNuDealsRowState()
      return
    }
    const res = await axios.get('/api/bestsellers?limit=10&storefront=' + encodeURIComponent(getCurrentStorefrontKey()))
    const products = scopeStorefrontProductsForPage(Array.isArray(res.data?.data) ? res.data.data : [])
    if (!products.length) { track.innerHTML = '<p class="text-gray-400 text-sm py-4 px-2">Chưa có dữ liệu bán hàng.</p>'; return }
    const medalClass = (i) => i < 3 ? 'bs-medal bs-medal-top bs-medal-top-' + (i + 1) : 'bs-medal bs-medal-n'
    const medalIcon = (i) => i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : String(i + 1)
    const fmtSold = (n) => n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n)
    let soldRank = 0
    track.innerHTML = products.map((p, i) => {
      const priceInfo = getProductDisplayPriceInfo(p)
      const flashMeta = priceInfo.flashMeta
      const price = priceInfo.price
      const originalPrice = priceInfo.originalPrice
      const soldCount = Number(p.total_sold || 0)
      const rankIndex = soldCount > 0 ? soldRank++ : -1
      const ratingStars = renderProductRatingStars(p, 'bs-stars')
      return \`<div class="bs-card" onclick="showDetail(\${p.id})">
        <div class="relative">
          <img src="\${escapeHtml(p.thumbnail || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400')}"
            alt="\${escapeHtml(p.name)}" class="bs-card-img" loading="lazy"
            onerror="this.src='https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'">
          \${renderFavoriteButton(p.id, 'favorite-toggle-btn--bestseller')}
          <span class="bs-mobile-hot-badge" aria-label="Sản phẩm hot"><i class="fas fa-fire-flame-curved" aria-hidden="true"></i><span>Hot</span></span>
          \${rankIndex >= 0 ? \`<div class="\${medalClass(rankIndex)}">\${medalIcon(rankIndex)}</div>\` : ''}
        </div>
        <div class="bs-card-body p-3">
          <p class="bs-name mb-1.5">\${escapeHtml(p.name)}</p>
          <div class="flex items-center justify-between gap-2 mb-2">
            <div class="flex items-center gap-2 min-w-0 flex-wrap">
              <span class="bs-price text-gradient-price">\${fmtPrice(price)}</span>
              \${originalPrice > price ? \`<span class="bs-original-price">\${fmtPrice(originalPrice)}</span>\` : ''}
            </div>
            \${ratingStars}
          </div>
          \${renderProductCommerceMeta(p, { className: 'product-commerce-meta--bestseller' })}
          \${p.has_flash_sale ? renderFlashSaleMiniStrip(flashMeta) : ''}
          \${isCurrentUserBlocked() ? \`<div class="flash-sale-shop-actions flash-sale-shop-actions--blocked">\${renderBlockedPurchaseActions('flash-sale-shop-blocked-btn text-xs font-bold')}</div>\` : \`<div class="flash-sale-shop-actions"><button onclick="event.stopPropagation();openOrder(\${p.id})" class="btn-primary flash-sale-shop-buy-btn text-sm font-semibold text-white"><i class="fas fa-bolt mr-1"></i><span class="quick-order-label-desktop">Đặt nhanh</span><span class="quick-order-label-mobile">Đặt nhanh</span></button><button onclick="event.stopPropagation();addToCartFromProductCard(event, \${p.id})" title="Thêm vào giỏ hàng" class="flash-sale-shop-cart-btn add-to-cart-btn flex items-center justify-center text-white transition group relative"><i class="fas fa-cart-plus text-sm"></i></button></div>\`}
        </div>
      </div>\`
    }).join('')
  } catch(e) {
    if (track) track.innerHTML = ''
    if (isHotTrendWomenContext()) {
      section?.classList.add('hidden')
      syncHotTrendNuDealsRowState()
    }
  }
}

async function loadHotTrendNuTrendingProducts() {
  if (!isHotTrendWomenContext()) return
  const section = document.getElementById('trendingProductsSection')
  const track = document.getElementById('trendingProductsTrack')
  if (!section || !track) return
  try {
    ensureBestsellerRuntimeStyle()
    const res = await axios.get('/api/trending-products' + getStorefrontQuerySuffix())
    const products = scopeStorefrontProductsForPage(Array.isArray(res.data?.data) ? res.data.data : [])
    if (!products.length) {
      const hasStorefrontProducts = Array.isArray(allProducts) && allProducts.length > 0
      track.innerHTML = hasStorefrontProducts
        ? '<div class="qhher-mini-empty">Đang cập nhật sản phẩm thịnh hành</div>'
        : ''
      section.classList.toggle('hidden', !hasStorefrontProducts)
      section.dataset.empty = hasStorefrontProducts ? 'true' : ''
      syncHotTrendNuDealsRowState()
      return
    }
    section.dataset.empty = ''
    section.classList.remove('hidden')
    track.innerHTML = products.slice(0, 4).map((product, index) => renderHotTrendNuBestsellerCard(product, index)).join('')
    syncHotTrendNuDealsRowState()
  } catch (e) {
    track.innerHTML = ''
    section.classList.add('hidden')
    syncHotTrendNuDealsRowState()
  }
}

function syncHotTrendNuDealsRowState() {
  if (!isHotTrendWomenContext()) return
  const row = document.getElementById('dealsGridRow')
  const trendingSection = document.getElementById('trendingProductsSection')
  const bestsellersSection = document.getElementById('bestsellersSection')
  if (!row) return
  const hasTrending = !!trendingSection && !trendingSection.classList.contains('hidden')
  const hasBestsellers = !!bestsellersSection && !bestsellersSection.classList.contains('hidden')
  row.classList.toggle('hidden', !hasTrending && !hasBestsellers)
  row.classList.toggle('has-trending', hasTrending)
}

function syncHotTrendNuFlashSaleRowState() {
  if (!isHotTrendWomenContext()) return
  const row = document.getElementById('flashSaleDealsRow')
  const section = document.getElementById('flashSaleShopSection')
  if (!row || !section) return
  row.classList.toggle('hidden', section.classList.contains('hidden'))
}

function getFlashSaleMeta(product) {
  const flashSale = product?.flash_sale
  const hasFlashSale = !!product?.has_flash_sale && flashSale && flashSale.item
  if (!hasFlashSale) return null
  const salePrice = Number(product.display_sale_price ?? product.display_price ?? product.price ?? 0)
  const basePrice = Number(product.display_original_price ?? product.original_price ?? product.price ?? 0)
  const discountPercent = Number(product.display_discount_percent ?? flashSale.item.discount_percent ?? 0)
  return {
    salePrice,
    basePrice,
    discountPercent,
    endsAt: flashSale.campaign?.end_at || flashSale.end_at || '',
    campaignName: flashSale.campaign?.name || flashSale.name || 'Flash Sale'
  }
}

function normalizeSkuToken(value) {
  return String(value || '').trim().toLowerCase()
}

function getProductSkuRows(product) {
  const source = Array.isArray(product?.product_skus)
    ? product.product_skus
    : (Array.isArray(product?.skus) ? product.skus : [])
  return source.filter((sku) => Number(sku?.is_active ?? 1) !== 0)
}

function getProductSkuBySelection(product, color, size) {
  const rows = getProductSkuRows(product)
  if (!rows.length) return null
  const targetColor = normalizeSkuToken(color)
  const targetSize = normalizeSkuToken(size)
  const exact = rows.find((sku) => normalizeSkuToken(sku.color) === targetColor && normalizeSkuToken(sku.size) === targetSize)
  if (exact) return exact
  if (targetColor) {
    const colorMatch = rows.find((sku) => normalizeSkuToken(sku.color) === targetColor)
    if (colorMatch) return colorMatch
  }
  if (targetSize) {
    const sizeOnly = rows.find((sku) => normalizeSkuToken(sku.size) === targetSize && !normalizeSkuToken(sku.color))
    if (sizeOnly) return sizeOnly
  }
  return rows[0] || null
}

function getProductDisplayPriceInfo(product, sku) {
  const source = sku || product
  const flashMeta = getFlashSaleMeta(source)
  const rawPrice = Number(source?.display_price ?? source?.price ?? product?.display_price ?? product?.price ?? 0)
  const rawOriginal = Number(source?.display_original_price ?? source?.original_price ?? product?.display_original_price ?? product?.original_price ?? rawPrice)
  let price = Number(flashMeta?.salePrice || rawPrice || 0)
  let originalPrice = Number(flashMeta?.basePrice || rawOriginal || price)
  const productAutoVoucher = !flashMeta && product?.has_auto_voucher && product?.auto_voucher ? product.auto_voucher : null
  const autoVoucher = productAutoVoucher
  if (autoVoucher && sku) {
    const discount = Math.min(price, Number(autoVoucher.discount_amount || product?.display_auto_voucher_discount || 0))
    price = Math.max(0, price - discount)
    originalPrice = rawOriginal > 0 ? rawOriginal : Number(source?.price || price)
  }
  return { price, originalPrice, flashMeta, autoVoucher }
}

function renderAutoVoucherMiniBadge(product) {
  const info = getProductDisplayPriceInfo(product)
  if (!info.autoVoucher) return ''
  const discount = Number(info.autoVoucher.discount_amount || product?.display_auto_voucher_discount || 0)
  if (!discount) return ''
  return '<div class="auto-voucher-mini-badge" title="Voucher tự động đã áp vào giá"><i class="fas fa-ticket"></i><span>Voucher -' + fmtPrice(discount).replace(/\s/g, '') + '</span></div>'
}

function renderFlashSaleMiniStrip(flashMeta) {
  if (!flashMeta) return ''
  return \`<div class="flash-sale-mini-strip" aria-label="Flash sale đang chạy">
    <span class="flash-sale-mini-label">Flash Sale <i class="fas fa-bolt"></i></span>
    <span class="flash-sale-countdown flash-sale-mini-timer" data-flash-sale-ends-at="\${flashMeta.endsAt || ''}">\${formatFlashSaleCountdown(flashMeta.endsAt || '')}</span>
  </div>\`
}

function formatFlashSaleCountdown(endAt) {
  if (!endAt) return '00:00:00'
  const target = new Date(endAt).getTime()
  if (!target || Number.isNaN(target)) return '00:00:00'
  const diff = Math.max(0, target - Date.now())
  const totalSeconds = Math.floor(diff / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':')
}

function getFlashSaleCountdownParts(endAt) {
  if (!endAt) return ['00', '00', '00', '00']
  const target = new Date(endAt).getTime()
  if (!target || Number.isNaN(target)) return ['00', '00', '00', '00']
  const diff = Math.max(0, target - Date.now())
  const totalSeconds = Math.floor(diff / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return [days, hours, minutes, seconds].map((value) => String(value).padStart(2, '0'))
}

let flashSaleCountdownTicker = null

function updateFlashSaleCountdownNode(node) {
  if (!node) return
  const endAt = String(node.getAttribute('data-flash-sale-ends-at') || '').trim()
  node.textContent = formatFlashSaleCountdown(endAt)
}

function updateHotTrendNuFlashSaleHeaderCountdown() {
  const timer = document.querySelector('.qhher-deal-timer[data-flash-sale-ends-at]')
  if (!timer) return
  const digits = timer.querySelectorAll('.qhher-timer-digit')
  if (digits.length < 4) return
  const parts = getFlashSaleCountdownParts(timer.getAttribute('data-flash-sale-ends-at') || '')
  digits.forEach((digit, index) => {
    digit.textContent = parts[index] || '00'
  })
}

async function startFlashSaleCountdownTicker() {
  const updateAll = () => {
    document.querySelectorAll('.flash-sale-countdown[data-flash-sale-ends-at]').forEach((node) => updateFlashSaleCountdownNode(node))
    updateHotTrendNuFlashSaleHeaderCountdown()
  }
  updateAll()
  if (flashSaleCountdownTicker) clearInterval(flashSaleCountdownTicker)
  flashSaleCountdownTicker = setInterval(updateAll, 1000)
}

async function loadFlashSaleShop() {
  const section = document.getElementById('flashSaleShopSection')
  const grid = document.getElementById('flashSaleShopGrid')
  if (!section || !grid) return
  try {
    const res = await axios.get('/api/flash-sales/active-products' + getStorefrontQuerySuffix())
    const products = scopeStorefrontProductsForPage(Array.isArray(res.data?.data) ? res.data.data : [])
    if (!products.length) {
      grid.innerHTML = ''
      section.classList.add('hidden')
      syncHotTrendNuFlashSaleRowState()
      return
    }
    section.classList.remove('hidden')
    const isHerPage = isHotTrendWomenContext()
    grid.className = isHerPage
      ? 'flash-sale-shop-track flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 pr-2'
      : 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6'
    syncHotTrendNuFlashSaleRowState()
    if (isHerPage) {
      const timer = section.querySelector('.qhher-deal-timer')
      if (timer) timer.setAttribute('data-flash-sale-ends-at', getFlashSaleMeta(products[0])?.endsAt || '')
      grid.innerHTML = products.map((product) => renderHotTrendNuFlashSaleCard(product)).join('')
      startFlashSaleCountdownTicker()
      return
    }
    grid.innerHTML = products.map((product) => renderStorefrontProductCard(product)).join('')
    startFlashSaleCountdownTicker()
  } catch (e) {
    grid.innerHTML = ''
    section.classList.add('hidden')
    syncHotTrendNuFlashSaleRowState()
  }
}

function renderProducts(products) {
  const grid = document.getElementById('productsGrid')
  const empty = document.getElementById('emptyState')
  const moreWrap = document.getElementById('productsMoreWrap')
  const moreCount = document.getElementById('productsMoreCount')
  if (!products.length) {
    grid.innerHTML = ''
    renderProductsEmptyState()
    empty.classList.remove('hidden')
    if (moreWrap) moreWrap.classList.add('hidden')
    updateProductsFilterMeta(0)
    return
  }
  empty.classList.add('hidden')
  const mobileMode = isMobileProductListMode()
  const limit = mobileMode ? mobileProductsVisibleCount : getProductPreviewLimit()
  const visible = products.slice(0, limit)
  grid.innerHTML = visible.map((p) => renderStorefrontProductCard(p)).join('')
  const hiddenCount = Math.max(0, products.length - visible.length)
  if (moreWrap) moreWrap.classList.toggle('hidden', mobileMode || hiddenCount <= 0)
  if (moreCount) moreCount.textContent = hiddenCount > 0 ? '(' + hiddenCount + ')' : ''
  updateProductsFilterMeta(products.length)
  applyProductsMobileLayout()
  startFlashSaleCountdownTicker()
  if (mobileMode && hiddenCount > 0) requestAnimationFrame(maybeLoadMoreMobileProducts)
}

function isMobileProductListMode() {
  return (window.innerWidth || document.documentElement.clientWidth || 1024) < 768
}

function resetMobileProductsVisibleCount() {
  mobileProductsVisibleCount = MOBILE_PRODUCT_PAGE_SIZE
}

function maybeLoadMoreMobileProducts() {
  if (!isMobileProductListMode()) return
  if (!Array.isArray(filteredProducts) || mobileProductsVisibleCount >= filteredProducts.length) return
  const productsSection = document.getElementById('products')
  if (!productsSection) return
  const rect = productsSection.getBoundingClientRect()
  const nearSectionEnd = rect.bottom - window.innerHeight < 420
  if (!nearSectionEnd) return
  mobileProductsVisibleCount = Math.min(filteredProducts.length, mobileProductsVisibleCount + MOBILE_PRODUCT_PAGE_SIZE)
  renderProducts(filteredProducts)
}

function setMobileBottomNavHidden(hidden) {
  const nav = document.getElementById('mobileBottomNav')
  if (!nav) return
  mobileBottomNavHidden = !!hidden
  nav.classList.toggle('is-hidden', mobileBottomNavHidden)
}

function setMobileBottomNavActive(target) {
  const nav = document.getElementById('mobileBottomNav')
  const item = target?.closest?.('.mobile-bottom-nav-link')
  if (!nav || !item) return
  const isAccountNavItem = item.getAttribute('onclick')?.includes('toggleUserMenu')
  const userMenuOverlay = document.getElementById('userMenuOverlay')
  if (!isAccountNavItem && userMenuOverlay && !userMenuOverlay.classList.contains('hidden') && typeof closeUserMenu === 'function') {
    closeUserMenu()
  }
  nav.querySelectorAll('.mobile-bottom-nav-link').forEach((link) => {
    link.classList.toggle('is-active', link === item)
  })
}

function initMobileBottomNavActiveState() {
  const nav = document.getElementById('mobileBottomNav')
  if (!nav || nav.dataset.activeBound === '1') return
  nav.dataset.activeBound = '1'
  nav.querySelectorAll('.mobile-bottom-nav-link').forEach((item) => {
    item.addEventListener('click', () => setMobileBottomNavActive(item))
    item.addEventListener('touchstart', () => setMobileBottomNavActive(item), { passive: true })
  })
}

function revealMobileBottomNavForCartFeedback() {
  if (window.innerWidth >= 768) return
  setMobileBottomNavHidden(false)
  lastMobileBottomNavScrollY = Math.max(0, window.scrollY || window.pageYOffset || 0)
}

function updateMobileBottomNavOnScroll() {
  const nav = document.getElementById('mobileBottomNav')
  if (!nav || window.innerWidth >= 768) return
  const currentY = Math.max(0, window.scrollY || window.pageYOffset || 0)
  const delta = currentY - lastMobileBottomNavScrollY

  if (currentY < 96) {
    setMobileBottomNavHidden(false)
  } else if (delta > 8) {
    setMobileBottomNavHidden(true)
  } else if (delta < -8) {
    setMobileBottomNavHidden(false)
  }

  lastMobileBottomNavScrollY = currentY
}

function initMobileBottomNavBehavior() {
  lastMobileBottomNavScrollY = Math.max(0, window.scrollY || window.pageYOffset || 0)
  setMobileBottomNavHidden(false)
  updateMobileBottomNavOnScroll()
}

function renderProductRatingStars(product, className) {
  const total = Number(product?.total_reviews || product?.review_count || 0)
  const avg = Number(product?.avg_rating || product?.rating || 0)
  if (!total || !avg) return ''
  const score = Math.max(1, Math.min(5, avg))
  const rounded = Math.round(score)
  const scoreText = score.toFixed(1)
  return '<span class="' + (className || 'product-rating-stars') + '" title="' + scoreText + '/5 từ ' + total + ' đánh giá">' +
    '<span class="product-rating-stars-icons">' + '★'.repeat(rounded) + '☆'.repeat(5 - rounded) + '</span>' +
    '<span class="product-rating-score-text">' + scoreText + '</span>' +
  '</span>'
}

function renderProductCardSocialMeta(product) {
  const stars = renderProductRatingStars(product)
  const soldCount = Number(product?.total_sold || 0)
  if (!stars) return soldCount > 0 ? '<div class="product-card-social-meta product-card-social-meta--sold-only"><span class="product-card-sold-text">Đã bán ' + fmtSold(soldCount) + '</span></div>' : ''
  return '<div class="product-card-social-meta">' + stars + '<span class="product-card-sold-text">Đã bán ' + fmtSold(soldCount) + '</span></div>'
}

function getProductPreviewLimit() {
  const w = window.innerWidth || document.documentElement.clientWidth || 1024
  const cols = w >= 1024 ? 6 : w >= 768 ? 3 : 1
  return cols * PRODUCT_PREVIEW_ROWS
}

function renderStorefrontProductCard(p, options) {
  if (isHotTrendWomenContext()) return renderHotTrendNuProductCard(p)
  const opts = options || {}
  const colors = getProductColorOptions(p).map((c) => c.name)
  const priceInfo = getProductDisplayPriceInfo(p)
  const flashMeta = priceInfo.flashMeta
  const displayPrice = priceInfo.price
  const displayOriginalPrice = priceInfo.originalPrice
  const discount = flashMeta ? Number(flashMeta.discountPercent || 0) : (displayOriginalPrice > displayPrice ? Math.round((1 - displayPrice/displayOriginalPrice)*100) : 0)
  return \`
  <div class="product-card bg-white rounded-2xl overflow-hidden card-hover shadow-sm border border-gray-100 cursor-pointer" onclick="openProductDetailFromCard(\${p.id})">
    <div class="relative overflow-hidden bg-gray-100">
      <img src="\${escapeHtml(p.thumbnail || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400')}"
        alt="\${escapeHtml(p.name)}" class="w-full product-img-main" loading="eager" decoding="sync"
        onerror="this.src='https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'">
      \${renderFavoriteButton(p.id)}
      <!-- Discount badge hidden temporarily; keep logic for later reuse.
      \${!p.has_flash_sale && discount > 0 ? \`<span class="absolute top-3 left-3 badge-sale text-white text-xs font-bold px-2 py-1 rounded-full">-\${discount}%</span>\` : ''}
      -->
      \${p.is_featured ? \`<span class="absolute top-3 right-3 product-featured-badge"><i class="fas fa-fire-flame-curved" aria-hidden="true"></i><span>Hot</span></span>\` : ''}
      <div class="absolute inset-0 hidden bg-black/0 transition items-center justify-center opacity-0 hover:bg-black/10 hover:opacity-100 md:flex">
        <span class="bg-white/90 text-gray-800 px-3 py-1 rounded-full text-xs font-semibold">Xem chi tiết</span>
      </div>
    </div>
    <div class="p-3 md:p-4">
      <h3 class="font-semibold text-gray-900 text-sm leading-tight mb-2 line-clamp-2">\${escapeHtml(p.name)}</h3>
      <div class="flex items-center gap-2 mb-3 flex-wrap">
        <span class="text-gradient-price font-bold">\${fmtPrice(displayPrice)}</span>
        \${displayOriginalPrice > displayPrice ? \`<span class="product-card-original-price text-xs line-through">\${fmtPrice(displayOriginalPrice)}</span>\` : ''}
        <span class="product-rating-stars-desktop">\${renderProductRatingStars(p)}</span>
      </div>
      \${renderProductCommerceMeta(p, { className: 'product-commerce-meta--card' })}
      \${p.has_flash_sale && !opts.hideFlashSaleMiniStrip ? renderFlashSaleMiniStrip(flashMeta) : ''}
      \${renderProductCardActions(p.id)}
    </div>
  </div>\`
}

function openProductsModal() {
  productsModalVisibleCount = PRODUCT_MODAL_PAGE_SIZE
  renderProductsModal()
  const overlay = document.getElementById('productsModalOverlay')
  if (!overlay) return
  overlay.classList.remove('hidden')
  lockStorefrontPageScroll('productsModalOverlay')
  requestAnimationFrame(() => overlay.querySelector('.overflow-y-auto')?.scrollTo({ top: 0 }))
}

function closeProductsModal() {
  document.getElementById('productsModalOverlay')?.classList.add('hidden')
  unlockStorefrontPageScroll('productsModalOverlay')
}

function openProductDetailFromCard(productId) {
  if (!document.getElementById('productsModalOverlay')?.classList.contains('hidden')) closeProductsModal()
  showDetail(productId)
}

async function openOrderFromProductCard(productId) {
  if (!document.getElementById('productsModalOverlay')?.classList.contains('hidden')) closeProductsModal()
  try { await openOrder(productId) } catch(e) {}
}

function addToCartFromProductCard(event, productId) {
  if (!document.getElementById('productsModalOverlay')?.classList.contains('hidden')) closeProductsModal()
  addToCartFromCard(event, productId)
}

function loadMoreProductsModal() {
  productsModalVisibleCount += PRODUCT_MODAL_PAGE_SIZE
  renderProductsModal()
}

function renderProductsModal() {
  const grid = document.getElementById('productsModalGrid')
  const meta = document.getElementById('productsModalMeta')
  const loadMoreBtn = document.getElementById('productsModalLoadMore')
  if (!grid) return
  const visible = filteredProducts.slice(0, productsModalVisibleCount)
  grid.innerHTML = visible.map((p) => renderStorefrontProductCard(p)).join('')
  if (meta) meta.textContent = 'Đang hiển thị ' + visible.length + ' / ' + filteredProducts.length + ' mặt hàng'
  if (loadMoreBtn) loadMoreBtn.classList.toggle('hidden', visible.length >= filteredProducts.length)
  startFlashSaleCountdownTicker()
}

function renderProductPerkBadges(product) {
  const config = typeof window !== 'undefined' ? (window.STOREFRONT_RUNTIME_CONFIG || {}) : {}
  const freeshipEnabled = config.product_freeship_badge_enabled !== false
  const autoVoucher = product?.has_auto_voucher && product?.auto_voucher ? product.auto_voucher : null
  const showVoucherBadge = autoVoucher && autoVoucher?.show_badge !== false
  const voucherDiscount = showVoucherBadge ? Number(autoVoucher.discount_amount || product?.display_auto_voucher_discount || 0) : 0
  const badges = []
  if (freeshipEnabled) {
    badges.push('<span class="product-perk-badge product-perk-badge--freeship" title="Freeship theo chính sách cửa hàng" style="font-family: Be Vietnam Pro, sans-serif;"><i class="fas fa-shipping-fast"></i><span>Freeship</span></span>')
  }
  if (voucherDiscount > 0) {
    badges.push('<span class="product-perk-badge product-perk-badge--voucher" title="Voucher tự động đã áp vào giá" style="font-family: Be Vietnam Pro, sans-serif;"><i class="fas fa-ticket"></i><span>-' + fmtCompactPrice(voucherDiscount) + '</span></span>')
  }
  if (!badges.length) return ''
  return '<div class="product-perk-badges">' + badges.join('') + '</div>'
}

function renderProductSoldLine(product, className) {
  const soldCount = Number(product?.total_sold || 0)
  if (soldCount <= 0) return ''
  const c = className ? ' ' + className : ''
  return '<div class="product-sold-line' + c + '" style="font-family: Be Vietnam Pro, sans-serif; font-size: 11px; font-weight: 700;">Đã bán ' + fmtSold(soldCount) + '</div>'
}

function renderProductCommerceMeta(product, options) {
  const opts = options || {}
  const classes = ['product-commerce-meta']
  if (opts.className) classes.push(opts.className)
  const soldHtml = renderProductSoldLine(product)
  const perkHtml = renderProductPerkBadges(product)
  if (!soldHtml && !perkHtml) return ''
  return '<div class="' + classes.join(' ') + '">' + soldHtml + perkHtml + '</div>'
}

function resolveColorNameToHex(name) {
  const n = String(name || '').trim().toLowerCase()
  if (n.includes('trắng') || n.includes('white')) return '#FFFFFF'
  if (n.includes('đen') || n.includes('black')) return '#171114'
  if (n.includes('hồng') || n.includes('pink') || n.includes('phấn')) return '#E9A2B2'
  if (n.includes('be') || n.includes('beige') || n.includes('kem') || n.includes('cream')) return '#F1E8E2'
  if (n.includes('nâu') || n.includes('brown')) return '#8B5A2B'
  if (n.includes('xám') || n.includes('grey') || n.includes('gray')) return '#9CA3AF'
  if (n.includes('navy') || n.includes('xanh đậm') || n.includes('xanh biển')) return '#1E3A8A'
  if (n.includes('xanh') || n.includes('green') || n.includes('lá')) return '#10B981'
  if (n.includes('đỏ') || n.includes('red')) return '#EF4444'
  if (n.includes('vàng') || n.includes('yellow')) return '#F59E0B'
  return '#cbd5e1'
}

function renderHotTrendNuActions(productId, compact) {
  if (isCurrentUserBlocked()) {
    return '<div class="htn-actions htn-actions--blocked">' + renderBlockedPurchaseActions('htn-buy htn-buy--blocked') + '</div>'
  }
  const bagIcon = '<i class="fas fa-shopping-bag htn-buy-cart-icon" aria-hidden="true"></i>'
  return '<div class="htn-actions htn-actions--single ' + (compact ? 'htn-actions--compact' : '') + '">'
    + '<button onclick="event.stopPropagation();openOrderFromProductCard(' + productId + ')" title="Mua nhanh" class="htn-buy"><span>Mua nhanh</span>' + bagIcon + '</button>'
    + '</div>'
}

function renderProductsEmptyState() {
  const empty = document.getElementById('emptyState')
  if (!empty) return
  const keyword = String(activeProductSearch || '').trim()
  if (isHotTrendWomenContext() && keyword) {
    empty.innerHTML = '<i class="fas fa-search mb-4 text-5xl"></i>' +
      '<p class="text-lg font-bold">Không có sản phẩm bạn đang tìm</p>' +
      '<p class="mx-auto mt-2 max-w-sm text-sm text-[#7B6870]">Thử từ khóa khác hoặc xoá bộ lọc để xem thêm sản phẩm phù hợp.</p>' +
      '<button type="button" class="mt-5 rounded-full border border-[#F3DDE4] bg-white px-5 py-2 text-sm font-bold text-[#C94F7C]" onclick="submitStorefrontHeaderSearch(\\'\\')">Xem tất cả sản phẩm</button>'
    return
  }
  if (isHotTrendWomenContext()) {
    empty.innerHTML = '<i class="fas fa-box-open mb-4 text-5xl"></i><p class="text-lg font-bold">Chưa có sản phẩm nữ phù hợp</p>'
  }
}

function buildHotTrendNuPreviewProducts(source, count) {
  const list = Array.isArray(source) ? source.filter(Boolean) : []
  const limit = Number(count || 0)
  if (!list.length || limit <= 0) return []
  const out = []
  for (let i = 0; i < limit; i += 1) out.push(list[i % list.length])
  return out
}

function renderHotTrendNuProductCard(p) {
  const colors = getProductColorOptions(p).map((c) => c.name).filter(Boolean)
  const priceInfo = getProductDisplayPriceInfo(p)
  const flashMeta = priceInfo.flashMeta
  const displayPrice = priceInfo.price
  const displayOriginalPrice = priceInfo.originalPrice
  const type = inferStorefrontProductType(p)
  const discount = flashMeta ? Number(flashMeta.discountPercent || 0) : (displayOriginalPrice > displayPrice ? Math.round((1 - displayPrice / displayOriginalPrice) * 100) : 0)
  const badgeLabel = p.is_featured ? 'HOT' : discount > 0 ? '-' + discount + '%' : 'NEW'
  const colorDots = colors.slice(0, 4).map((c) => '<span class="htn-color-dot" style="background: ' + resolveColorNameToHex(c) + '" title="' + escapeHtml(c) + '"></span>').join('')
  return \`
  <article class="product-card htn-product-card" onclick="openProductDetailFromCard(\${p.id})">
    <div class="htn-product-media">
      <img src="\${escapeHtml(p.thumbnail || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500')}" alt="\${escapeHtml(p.name)}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500'">
      <div class="htn-product-media-top">
        <span class="htn-product-type">\${escapeHtml(badgeLabel)}</span>
        \${renderFavoriteButton(p.id)}
      </div>
    </div>
    <div class="htn-product-body">
      <div class="htn-product-title-row">
        <h3>\${escapeHtml(p.name)}</h3>
      </div>
      <div class="htn-product-price-row">
        <span class="htn-product-price">\${fmtPrice(displayPrice)}</span>
        \${displayOriginalPrice > displayPrice ? \`<span class="htn-product-original">\${fmtPrice(displayOriginalPrice)}</span>\` : ''}
      </div>
      \${renderProductCommerceMeta(p, { className: 'product-commerce-meta--hottrendnu' })}
      \${p.has_flash_sale ? renderFlashSaleMiniStrip(flashMeta) : ''}
      \${colors.length ? '<div class="htn-color-row">' + colorDots + '</div>' : ''}
      \${renderHotTrendNuActions(p.id, false)}
    </div>
  </article>\`
}

function renderHotTrendNuBestsellerCard(p, index) {
  const priceInfo = getProductDisplayPriceInfo(p)
  const price = priceInfo.price
  const originalPrice = priceInfo.originalPrice
  const soldCount = Number(p.total_sold || 0)
  const discount = originalPrice > price ? Math.round((1 - price / originalPrice) * 100) : 0
  const badge = discount > 0 ? '-' + discount + '%' : 'NEW'
  return \`
  <article class="htn-rank-card" onclick="showDetail(\${p.id})">
    <div class="htn-rank-image">
      <img src="\${escapeHtml(p.thumbnail || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500')}" alt="\${escapeHtml(p.name)}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500'">
      <span class="qhher-mini-badge">\${escapeHtml(badge)}</span>
    </div>
    <div class="htn-rank-body">
      <h3>\${escapeHtml(p.name)}</h3>
      <div class="htn-product-price-row">
        <span class="htn-product-price">\${fmtPrice(price)}</span>
        \${originalPrice > price ? \`<span class="htn-product-original">\${fmtPrice(originalPrice)}</span>\` : ''}
      </div>
    </div>
  </article>\`
}

function renderHotTrendNuFlashSaleCard(product) {
  const priceInfo = getProductDisplayPriceInfo(product)
  const meta = priceInfo.flashMeta
  const price = priceInfo.price
  const original = priceInfo.originalPrice
  const discount = meta ? Number(meta.discountPercent || 0) : (original > price ? Math.round((1 - price / original) * 100) : 0)
  const badge = discount > 0 ? '-' + discount + '%' : 'SALE'
  return \`
  <div class="flash-sale-shop-card shrink-0 snap-start cursor-pointer htn-deal-card" onclick="showDetail(\${product.id})">
    <div class="htn-deal-media">
      <img src="\${product.thumbnail || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500'}" alt="\${product.name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500'">
      <span class="qhher-mini-badge">\${escapeHtml(badge)}</span>
    </div>
    <div class="htn-deal-body">
      <h3>\${escapeHtml(product.name)}</h3>
      <div class="htn-product-price-row">
        <span class="htn-product-price">\${fmtPrice(price)}</span>
        \${original > price ? \`<span class="htn-product-original">\${fmtPrice(original)}</span>\` : ''}
      </div>
    </div>
  </div>\`
}

function filterProductType(type, btn) {
  document.querySelectorAll('.hottrendnu-type-chip').forEach((b) => b.classList.remove('active'))
  if (btn) {
    btn.classList.add('active')
  } else {
    const matchingTypeChip = document.querySelector('.hottrendnu-type-chip[data-type="' + type + '"]')
    if (matchingTypeChip) matchingTypeChip.classList.add('active')
  }
  activeProductType = type
  applyProductsFilters()
}

function getHotTrendNuCategoryItems() {
  const productTypes = Array.isArray(storefrontProductTypes) ? storefrontProductTypes : []
  const bySlug = new Map(productTypes.map((item) => [String(item.slug || ''), item]))
  const pickImage = (members) => {
    const found = members.map((slug) => bySlug.get(slug)).find((item) => String(item?.resolved_thumbnail || item?.thumbnail || item?.fallback_thumbnail || '').trim())
    return String(found?.resolved_thumbnail || found?.thumbnail || found?.fallback_thumbnail || '').trim()
  }
  const countMembers = (members) => members.reduce((sum, slug) => sum + Number(bySlug.get(slug)?.product_count || 0), 0)
  return getHotTrendNuTypeFilterOptions()
    .filter((item) => item.slug !== 'all')
    .map((item) => ({
      ...item,
      count: countMembers(item.members || []),
      image: pickImage(item.members || [])
    }))
}

function renderHotTrendNuCategoryImage(src, alt) {
  const safeAlt = escapeHtml(alt || 'Danh mục')
  if (!src) return '<div class="qhher-category-card-fallback" aria-hidden="true"><i class="fas fa-shirt"></i></div>'
  return '<img src="' + escapeHtml(src) + '" alt="' + safeAlt + '" loading="lazy" onerror="if(this.parentElement){this.parentElement.innerHTML=\\'<div class=&quot;qhher-category-card-fallback&quot; aria-hidden=&quot;true&quot;><i class=&quot;fas fa-shirt&quot;></i></div>\\'}">'
}

function renderHotTrendNuCategorySurfaces() {
  if (!isHotTrendWomenContext()) return
  const categories = getHotTrendNuCategoryItems()
  const quickRail = document.getElementById('qhherCategoryRailDynamic')
  if (quickRail) {
    quickRail.innerHTML = [
      '<button type="button" class="qhher-category-pill" onclick="openHotTrendNuCategoryPage(event)">',
        '<span class="qhher-category-avatar-wrap qhher-category-avatar-wrap--new"><i class="fas fa-star"></i></span>',
        '<span>Hàng mới</span>',
      '</button>'
    ].concat(categories.map((item) => (
      '<button type="button" class="qhher-category-pill" onclick="selectHotTrendNuCategory(\\'' + escapeHtml(item.slug) + '\\')">' +
        '<span class="qhher-category-avatar-wrap">' + renderHotTrendNuCategoryImage(item.image, item.name) + '</span>' +
        '<span>' + escapeHtml(item.name) + '</span>' +
      '</button>'
    ))).join('')
  }
  const grid = document.getElementById('qhherMobileCategoryGrid')
  if (grid) {
    grid.innerHTML = categories.map((item) => (
      '<button type="button" class="qhher-category-card" onclick="selectHotTrendNuCategory(\\'' + escapeHtml(item.slug) + '\\')">' +
        '<span class="qhher-category-card-media">' + renderHotTrendNuCategoryImage(item.image, item.name) + '</span>' +
        '<span class="qhher-category-card-title">' + escapeHtml(item.name) + '</span>' +
        '<span class="qhher-category-card-count">' + Number(item.count || 0) + ' sản phẩm</span>' +
      '</button>'
    )).join('')
  }
  const collection = document.getElementById('qhherFeaturedCollections')
  if (collection) {
    const featured = categories.filter((item) => item.image).slice(0, 2)
    collection.innerHTML = featured.map((item, index) => (
      '<button type="button" class="qhher-collection-card" onclick="selectHotTrendNuCategory(\\'' + escapeHtml(item.slug) + '\\')">' +
        '<span class="qhher-collection-card-media">' + renderHotTrendNuCategoryImage(item.image, item.name) + '</span>' +
        '<span class="qhher-collection-card-label">' + (index === 0 ? 'Đi làm thanh lịch' : 'Đi chơi cuối tuần') + '</span>' +
      '</button>'
    )).join('')
  }
}

function openHotTrendNuCategoryPage(event) {
  if (event) event.preventDefault()
  const section = document.getElementById('qhherCategoryPage')
  if (!section) return
  renderHotTrendNuCategorySurfaces()
  const categoryNavItem = document.querySelector('[data-qhher-category-nav="true"]')
  if (categoryNavItem && typeof setMobileBottomNavActive === 'function') {
    setMobileBottomNavActive(categoryNavItem)
  }
  document.body.classList.add('qhher-category-open')
  section.classList.remove('hidden')
  section.scrollTop = 0
  setMobileBottomNavHidden(false)
}

function closeHotTrendNuCategoryPage() {
  const section = document.getElementById('qhherCategoryPage')
  document.body.classList.remove('qhher-category-open')
  if (section) section.classList.add('hidden')
}

function selectHotTrendNuCategory(type) {
  const slug = String(type || 'all').trim() || 'all'
  closeHotTrendNuCategoryPage()
  filterProductType(slug, document.querySelector('.hottrendnu-type-chip[data-type="' + slug + '"]'))
  const products = document.getElementById('products')
  if (products) products.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// ── FILTER & SEARCH ────────────────────────────────
function getProductTimeValue(product) {
  const createdAt = Date.parse(product?.created_at || '')
  const updatedAt = Date.parse(product?.updated_at || '')
  return Number.isFinite(createdAt) ? createdAt : (Number.isFinite(updatedAt) ? updatedAt : 0)
}

function sortProductsList(products) {
  const list = Array.isArray(products) ? [...products] : []
  list.sort((a, b) => {
    if (activeProductSort === 'price_asc' || activeProductSort === 'price_desc') {
      const av = Number(getProductDisplayPriceInfo(a).price || 0)
      const bv = Number(getProductDisplayPriceInfo(b).price || 0)
      return activeProductSort === 'price_asc' ? av - bv : bv - av
    }
    if (activeProductSort === 'best_selling') {
      return Number(b?.total_sold || 0) - Number(a?.total_sold || 0)
    }
    const av = getProductTimeValue(a)
    const bv = getProductTimeValue(b)
    return activeProductSort === 'oldest' ? av - bv : bv - av
  })
  return list
}

function normalizeProductFilterText(value) {
  return String(value || '').trim().toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
}

function formatHotTrendNuColorLabel(label) {
  const raw = String(label || '').trim()
  const key = raw.toLowerCase()
    .normalize('NFD')
    .replace(/[\\u0300-\\u036f]/g, '')
    .replace(/đ/g, 'd')
  const common = {
    'hoa vang': 'Hoa vàng',
    'vang': 'Vàng',
    'hong': 'Hồng',
    'hoa hong': 'Hoa hồng',
    'xanh': 'Xanh',
    'xanh than': 'Xanh than',
    'den': 'Đen',
    'trang': 'Trắng',
    'kem': 'Kem',
    'do': 'Đỏ',
    'do man': 'Đỏ mận',
    'nau': 'Nâu',
    'xam': 'Xám'
  }
  return common[key] || raw
}

function updateSelectPreservingValue(select, options, placeholder, activeValue) {
  if (!select) return
  const current = String(activeValue || select.value || 'all')
  select.innerHTML = '<option value="all">' + escapeHtml(placeholder) + '</option>' + options.map((option) => {
    const value = escapeHtml(option.value)
    const label = escapeHtml(option.label)
    return '<option value="' + value + '">' + label + '</option>'
  }).join('')
  select.value = options.some((option) => String(option.value) === current) ? current : 'all'
  select.dispatchEvent(new Event('change', { bubbles: true }))
  if (typeof window !== 'undefined' && typeof window.refreshUiSelects === 'function') {
    window.requestAnimationFrame(window.refreshUiSelects)
  }
}

function updateHotTrendNuFilterOptions() {
  if (!isHotTrendWomenContext()) return
  const source = Array.isArray(allProducts) ? allProducts : []
  const colorMap = new Map()
  const sizeSet = new Set()
  source.forEach((product) => {
    getProductColorOptions(product).forEach((color) => {
      const label = formatHotTrendNuColorLabel(color?.name)
      const key = normalizeProductFilterText(color?.name || label)
      if (key && !colorMap.has(key)) colorMap.set(key, label)
    })
    const sizes = Array.isArray(product?.sizes) ? product.sizes : safeJson(product?.sizes || '[]')
    sizes.forEach((size) => {
      const label = String(size || '').trim()
      if (label) sizeSet.add(label)
    })
  })
  const colors = Array.from(colorMap.entries()).map(([value, label]) => ({ value, label }))
  const sizes = Array.from(sizeSet).sort((a, b) => String(a).localeCompare(String(b), 'vi')).map((label) => ({ value: label, label }))
  updateSelectPreservingValue(document.getElementById('productsColorFilter'), colors, 'Màu sắc', activeProductColor)
  updateSelectPreservingValue(document.getElementById('productsSizeFilter'), sizes, 'Size', activeProductSize)
}

function productMatchesColorFilter(product) {
  if (!activeProductColor || activeProductColor === 'all') return true
  return getProductColorOptions(product).some((color) => normalizeProductFilterText(color?.name) === normalizeProductFilterText(activeProductColor))
}

function productMatchesSizeFilter(product) {
  if (!activeProductSize || activeProductSize === 'all') return true
  const sizes = Array.isArray(product?.sizes) ? product.sizes : safeJson(product?.sizes || '[]')
  return sizes.some((size) => normalizeProductFilterText(size) === normalizeProductFilterText(activeProductSize))
}

function productMatchesPriceFilter(product) {
  if (!activeProductPrice || activeProductPrice === 'all') return true
  const price = Number(getProductDisplayPriceInfo(product).price || 0)
  if (activeProductPrice === 'under_200') return price > 0 && price < 200000
  if (activeProductPrice === '200_400') return price >= 200000 && price <= 400000
  if (activeProductPrice === 'over_400') return price > 400000
  return true
}

function setHotTrendNuProductFilter(kind, value) {
  const normalized = String(value || 'all').trim() || 'all'
  if (kind === 'color') activeProductColor = normalized === 'all' ? 'all' : normalizeProductFilterText(normalized)
  if (kind === 'size') activeProductSize = normalized
  if (kind === 'price') activeProductPrice = normalized
  applyProductsFilters()
}

function updateProductsFilterMeta(total) {
  const countLabel = document.getElementById('productsCountLabel')
  if (countLabel) countLabel.textContent = String(total || 0) + ' mặt hàng'
  const sortSelects = [document.getElementById('productsSortSelect'), document.getElementById('productsSortSelectMobile')]
  sortSelects.forEach((sortSelect) => {
    if (sortSelect && sortSelect.value !== activeProductSort) sortSelect.value = activeProductSort
  })
  const colorSelect = document.getElementById('productsColorFilter')
  if (colorSelect && colorSelect.value !== activeProductColor) colorSelect.value = activeProductColor
  const sizeSelect = document.getElementById('productsSizeFilter')
  if (sizeSelect && sizeSelect.value !== activeProductSize) sizeSelect.value = activeProductSize
  const priceSelect = document.getElementById('productsPriceFilter')
  if (priceSelect && priceSelect.value !== activeProductPrice) priceSelect.value = activeProductPrice
  applyProductsMobileLayout()
  if (typeof window !== 'undefined' && typeof window.refreshUiSelects === 'function') {
    window.requestAnimationFrame(window.refreshUiSelects)
  }
}

function applyProductsMobileLayout() {
  const grid = document.getElementById('productsGrid')
  const btn = document.getElementById('productsLayoutToggle')
  const compactMode = mobileProductsLayout === 'grid'
  if (grid) {
    grid.classList.toggle('products-grid-compact', compactMode)
    grid.dataset.mobileLayout = compactMode ? 'grid' : 'list'
  }
  if (btn) {
    btn.classList.toggle('active', compactMode)
    btn.setAttribute('aria-label', compactMode ? 'Chuyển sang danh sách ngang' : 'Chuyển sang dạng lưới 2 cột')
    btn.setAttribute('title', compactMode ? 'Chuyển sang danh sách ngang' : 'Chuyển sang dạng lưới 2 cột')
    btn.innerHTML = compactMode
      ? '<i class="fas fa-list-ul" aria-hidden="true"></i>'
      : '<i class="fas fa-table-cells-large" aria-hidden="true"></i>'
  }
}

function toggleProductsMobileLayout() {
  mobileProductsLayout = mobileProductsLayout === 'grid' ? 'list' : 'grid'
  applyProductsMobileLayout()
  if (Array.isArray(filteredProducts) && filteredProducts.length) renderProducts(filteredProducts)
}

function applyProductsFilters() {
  resetMobileProductsVisibleCount()
  filteredProducts = sortProductsList(allProducts.filter((p) => {
    const matchCat = activeProductCategory === 'all' || p.category === activeProductCategory
    const searchHaystack = normalizeProductFilterText([p.name, p.brand, p.sku, p.description].filter(Boolean).join(' '))
    const matchSearch = !activeProductSearch || searchHaystack.includes(normalizeProductFilterText(activeProductSearch))
    const matchType = productMatchesTypeFilter(p)

    return matchCat && matchSearch && matchType && productMatchesColorFilter(p) && productMatchesSizeFilter(p) && productMatchesPriceFilter(p)
  }))
  renderProducts(filteredProducts)
}

function filterProducts(cat, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'))
  btn.classList.add('active')
  activeProductCategory = cat
  activeProductType = 'all'
  applyProductsFilters()
}

function openFilterModal() {
  const modal = document.getElementById('filterModalOverlay')
  if (modal) {
    modal.classList.remove('hidden')
    modal.classList.add('flex')
    renderFilterModalTypeOptions()
    document.querySelectorAll('#filterModalGenderRow .filter-modal-chip').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-val') === activeProductCategory)
    })
    document.querySelectorAll('#filterModalTypeRow .filter-modal-chip').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-val') === activeProductType)
    })
    lockStorefrontPageScroll('filterModalOverlay')

    // Animate slide up
    const panel = document.getElementById('filterModalPanel')
    if (panel) {
      setTimeout(() => {
        panel.classList.remove('translate-y-full')
        panel.classList.add('translate-y-0')
      }, 10)
    }
  }
}

function closeFilterModal() {
  const modal = document.getElementById('filterModalOverlay')
  const panel = document.getElementById('filterModalPanel')
  if (modal && panel) {
    // Animate slide down
    panel.classList.remove('translate-y-0')
    panel.classList.add('translate-y-full')
    setTimeout(() => {
      modal.classList.add('hidden')
      modal.classList.remove('flex')
      unlockStorefrontPageScroll('filterModalOverlay')
    }, 300)
  }
}

function selectFilterModalGender(val, btn) {
  document.querySelectorAll('#filterModalGenderRow .filter-modal-chip').forEach(b => b.classList.remove('active'))
  btn.classList.add('active')
}

function selectFilterModalType(val, btn) {
  document.querySelectorAll('#filterModalTypeRow .filter-modal-chip').forEach(b => b.classList.remove('active'))
  btn.classList.add('active')
}

function resetFilterModal() {
  document.querySelectorAll('#filterModalGenderRow .filter-modal-chip').forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-val') === 'all')
  })
  document.querySelectorAll('#filterModalTypeRow .filter-modal-chip').forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-val') === 'all')
  })
  activeProductColor = 'all'
  activeProductSize = 'all'
  activeProductPrice = 'all'
  updateProductsFilterMeta(filteredProducts.length)
}

function applyFilterModal() {
  const activeGenderBtn = document.querySelector('#filterModalGenderRow .filter-modal-chip.active')
  const activeTypeBtn = document.querySelector('#filterModalTypeRow .filter-modal-chip.active')
  
  if (activeGenderBtn) activeProductCategory = activeGenderBtn.getAttribute('data-val') || 'all'
  if (activeTypeBtn) activeProductType = activeTypeBtn.getAttribute('data-val') || 'all'
  
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'))
  const matchingDesktopChip = document.querySelector('.filter-btn[data-cat=\"' + activeProductCategory + '\"]')
  if (matchingDesktopChip && activeProductType === 'all') {
    matchingDesktopChip.classList.add('active')
  }
  document.querySelectorAll('.hottrendnu-type-chip').forEach((b) => {
    b.classList.toggle('active', b.getAttribute('data-type') === activeProductType)
  })
  if (!document.querySelector('.hottrendnu-type-chip.active')) {
    document.querySelector('.hottrendnu-type-chip[data-type="all"]')?.classList.add('active')
  }

  applyProductsFilters()
  closeFilterModal()
}

function searchProducts(q) {
  activeProductSearch = String(q || '').toLowerCase().trim()
  syncStorefrontSearchInputs(activeProductSearch)
  applyProductsFilters()
}

function getSearchPanelForInput(input) {
  const box = input?.closest?.('.qhher-search-box')
  return box ? box.querySelector('.qhher-search-suggest-panel') : null
}

function getPrimaryProductImage(product) {
  const direct = String(product?.thumbnail || '').trim()
  if (direct) return direct
  const images = Array.isArray(product?.images) ? product.images : safeJson(product?.images || '[]')
  return String((images || []).find(Boolean) || '').trim()
}

function getStorefrontSearchMatches(query, limit) {
  const keyword = normalizeProductFilterText(query)
  const source = Array.isArray(allProducts) ? allProducts : []
  if (!keyword) return source.slice(0, limit || 5)
  return source.filter((product) => {
    const text = normalizeProductFilterText([product.name, product.brand, product.sku, product.description, inferStorefrontProductType(product)].filter(Boolean).join(' '))
    return text.includes(keyword)
  }).slice(0, limit || 6)
}

function renderStorefrontSearchSuggestions(input) {
  if (!isHotTrendWomenContext()) return
  const panel = getSearchPanelForInput(input)
  if (!panel) return
  const query = String(input?.value || '').trim()
  const matches = getStorefrontSearchMatches(query, query ? 6 : 4)
  const safeQuery = escapeHtml(query)
  if (!matches.length) {
    panel.innerHTML = '<div class="qhher-search-suggest-empty">Không có sản phẩm phù hợp' + (safeQuery ? ' với "' + safeQuery + '"' : '') + '</div>'
    panel.classList.remove('hidden')
    return
  }
  const encodedQuery = encodeURIComponent(query)
  panel.innerHTML = matches.map((product) => {
    const image = getPrimaryProductImage(product)
    const priceInfo = getProductDisplayPriceInfo(product)
    const price = Number(priceInfo.price || product.price || 0)
    const original = Number(priceInfo.original || product.original_price || 0)
    return '<button type="button" class="qhher-search-suggest-item" onclick="openStorefrontSearchSuggestionProduct(' + Number(product.id || 0) + ')">' +
      '<span class="qhher-search-suggest-thumb">' + (image ? '<img src="' + escapeHtml(image) + '" alt="">' : '') + '</span>' +
      '<span class="min-w-0">' +
        '<span class="qhher-search-suggest-title">' + escapeHtml(product.name || 'Sản phẩm') + '</span>' +
        '<span class="qhher-search-suggest-meta"><span>' + fmtPrice(price) + '</span>' + (original > price ? '<span class="qhher-search-suggest-original">' + fmtPrice(original) + '</span>' : '') + '</span>' +
      '</span>' +
    '</button>'
  }).join('') + (query ? '<button type="button" class="qhher-search-suggest-action" onclick="submitStorefrontHeaderSearch(decodeURIComponent(\\'' + encodedQuery + '\\'))">Xem tất cả kết quả cho "' + safeQuery + '"</button>' : '')
  panel.classList.remove('hidden')
}

function openStorefrontHeaderSearch(input) {
  if (!isHotTrendWomenContext()) {
    focusProductsSearch()
    return
  }
  renderStorefrontSearchSuggestions(input)
}

function handleStorefrontHeaderSearchInput(value, input) {
  if (!isHotTrendWomenContext()) {
    searchProducts(value)
    return
  }
  renderStorefrontSearchSuggestions(input)
}

function handleStorefrontHeaderSearchKeydown(event) {
  if (!event) return
  if (event.key === 'Enter') {
    event.preventDefault()
    submitStorefrontHeaderSearch(event.currentTarget?.value || '')
  }
  if (event.key === 'Escape') {
    closeStorefrontHeaderSearchPanels()
  }
}

function closeStorefrontHeaderSearchPanels() {
  document.querySelectorAll('.qhher-search-suggest-panel').forEach((panel) => panel.classList.add('hidden'))
}

function syncStorefrontSearchInputs(value) {
  const keyword = String(value || '').trim()
  document.querySelectorAll('.qhher-storefront-search-input, #searchInput').forEach((input) => {
    if (input && input.value !== keyword) input.value = keyword
  })
}

function updateStorefrontSearchUrl(keyword) {
  if (!isHotTrendWomenContext()) return
  try {
    const url = new URL(window.location.href)
    const value = String(keyword || '').trim()
    if (value) url.searchParams.set('search', value)
    else url.searchParams.delete('search')
    window.history.replaceState({}, '', url.pathname + (url.searchParams.toString() ? '?' + url.searchParams.toString() : '') + url.hash)
  } catch (_) {}
}

function submitStorefrontHeaderSearch(value) {
  const keyword = String(value || '').trim()
  activeProductSearch = keyword.toLowerCase()
  syncStorefrontSearchInputs(keyword)
  updateStorefrontSearchUrl(keyword)
  closeStorefrontHeaderSearchPanels()
  applyProductsFilters()
  const products = document.getElementById('products')
  if (products) products.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function openStorefrontSearchSuggestionProduct(productId) {
  closeStorefrontHeaderSearchPanels()
  const id = Number(productId || 0)
  if (id && typeof showDetail === 'function') showDetail(id)
}

function hydrateProductSearchFromUrl() {
  if (!isHotTrendWomenContext()) return
  try {
    const params = new URLSearchParams(window.location.search)
    const keyword = String(params.get('search') || '').trim()
    if (!keyword) return
    activeProductSearch = keyword.toLowerCase()
    syncStorefrontSearchInputs(keyword)
  } catch (_) {}
}

document.addEventListener('click', function(event) {
  if (!isHotTrendWomenContext()) return
  if (event.target?.closest?.('.qhher-search-box')) return
  closeStorefrontHeaderSearchPanels()
})

function sortProductsByTime(value) {
  activeProductSort = ['oldest', 'price_asc', 'price_desc', 'best_selling'].includes(value) ? value : 'newest'
  applyProductsFilters()
}

// ── PRODUCT DETAIL ─────────────────────────────────
${storefrontDetailOrderScript()}

function fmtPrice(p) { return new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND'}).format(p) }
function fmtCompactPrice(p) {
  const value = Number(p || 0)
  if (!Number.isFinite(value) || value <= 0) return '0đ'
  if (value >= 1000000) {
    const compact = value / 1000000
    return (Number.isInteger(compact) ? compact.toFixed(0) : compact.toFixed(1).replace(/\.0$/, '')) + 'tr'
  }
  if (value >= 1000) return Math.round(value / 1000) + 'K'
  return new Intl.NumberFormat('vi-VN').format(value) + 'đ'
}
function fmtSold(n) {
  const value = Number(n || 0)
  if (!Number.isFinite(value) || value <= 0) return '0'
  if (value >= 1000000) return (value / 1000000).toFixed(value >= 10000000 ? 0 : 1).replace('.0', '') + 'tr'
  if (value >= 1000) return (value / 1000).toFixed(value >= 10000 ? 0 : 1).replace('.0', '') + 'k'
  return String(Math.floor(value))
}
function safeJson(v) { try { return JSON.parse(v||'[]') } catch { return [] } }
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
function getColorNames(raw) {
  const arr = Array.isArray(raw) ? raw : safeJson(raw)
  if (!Array.isArray(arr)) return []
  return arr.map((item) => {
    if (typeof item === 'string') return String(item || '').trim()
    if (item && typeof item === 'object') return String(item.name || item.label || '').trim()
    return ''
  }).filter(Boolean)
}
function getSelectedColorImageFromProduct(product, selectedColor) {
  const color = String(selectedColor || '').trim().toLowerCase()
  if (!color) return String(product?.thumbnail || '').trim()
  const colors = getProductColorOptions(product)
  const matched =
    colors.find((item) => String(item.name || '').trim().toLowerCase() === color) ||
    colors.find((item) => {
      const name = String(item.name || '').trim().toLowerCase()
      return name.includes(color) || color.includes(name)
    })
  if (matched && String(matched.image || '').trim()) return String(matched.image).trim()
  return String(product?.thumbnail || '').trim()
}
window.normalizeColorOptions = normalizeColorOptions
window.getColorNames = getColorNames
function formatPaymentMethod(v) {
  const key = String(v || '').toUpperCase()
  if (key === 'BANK_TRANSFER') return 'Chuyển khoản ngân hàng'
  return 'COD - Thanh toán khi giao'
}
function paymentStatusLabel(v) {
  return String(v || '').toLowerCase() === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'
}
function paymentStatusClass(v) {
  return String(v || '').toLowerCase() === 'paid'
    ? 'bg-green-100 text-green-700 border border-green-200'
    : 'bg-amber-100 text-amber-700 border border-amber-200'
}
function getOrderAmountDue(order) {
  if (order && order.amount_due !== undefined && order.amount_due !== null) {
    return Number(order.amount_due || 0)
  }
  return String(order?.payment_status || '').toLowerCase() === 'paid'
    ? 0
    : Number(order?.total_price || 0)
}

function showToast(msg, type='success', duration=3000) {
  const c = document.getElementById('toastContainer')
  const t = document.createElement('div')
  t.className = \`toast px-5 py-3 rounded-2xl shadow-xl text-white text-sm font-medium pointer-events-auto \${type==='error'?'bg-red-500':'bg-green-500'}\`
  t.textContent = msg
  c.appendChild(t)
  setTimeout(() => t.remove(), duration)
}

function normalizeCustomerPhone(value) {
  return String(value || '').trim().replace(/\\s+/g, '')
}

function isBlockedFlag(value) {
  return Number(value || 0) === 1 || value === true || String(value || '').toLowerCase() === 'true'
}

function getCurrentUserBlockReason() {
  return String(currentUser?.blocked_reason || 'Không thể đặt hàng').trim()
}

function isCurrentUserBlocked() {
  return !!currentUser && isBlockedFlag(currentUser.is_blocked)
}

function assertCustomerCanShop() {
  if (!isCurrentUserBlocked()) return true
  showBlockedCustomerModal(getCurrentUserBlockReason())
  return false
}

function renderBlockedPurchaseActions(extraClass) {
  const cls = extraClass || 'w-full rounded-2xl py-3 text-sm font-semibold'
  return '<button type="button" onclick="event.stopPropagation();showBlockedCustomerModal(getCurrentUserBlockReason())" class="blocked-order-btn ' + cls + '"><i class="fas fa-ban"></i><span>Không thể đặt hàng</span></button>'
}

function renderProductCardActions(productId) {
  if (isCurrentUserBlocked()) {
    return '<div class="product-card-actions product-card-actions--blocked">' + renderBlockedPurchaseActions('product-buy-btn product-buy-btn--blocked w-full text-sm font-semibold') + '</div>'
  }
  return '<div class="product-card-actions">'
    + '<button onclick="event.stopPropagation();openOrderFromProductCard(' + productId + ')" title="Đặt nhanh" class="product-buy-btn btn-primary text-white text-sm font-semibold"><i class="fas fa-bolt mr-1"></i><span class="quick-order-label-desktop">Đặt nhanh</span><span class="quick-order-label-mobile">Đặt nhanh</span></button>'
    + '<button onclick="event.stopPropagation();addToCartFromProductCard(event, ' + productId + ')" title="Thêm vào giỏ hàng" class="product-cart-btn add-to-cart-btn flex items-center justify-center text-white transition group relative"><i class="fas fa-cart-plus text-sm"></i><span>Thêm vào giỏ hàng</span></button>'
    + '</div>'
}

function refreshStorefrontPurchaseControls() {
  if (Array.isArray(filteredProducts) && filteredProducts.length) renderProducts(filteredProducts)
  if (isHotTrendWomenContext()) loadHotTrendNuTrendingProducts()
  loadBestSellers()
  loadFlashSaleShop()
}

function toggleMobileMenu() {
  const m = document.getElementById('mobileMenu')
  m.classList.toggle('hidden')
}

function focusProductsSearch() {
  if (isHotTrendWomenContext()) {
    const input = window.innerWidth < 768
      ? document.getElementById('qhherMobileSearchInput')
      : document.getElementById('qhherHeaderSearchInput')
    if (!input) return
    try {
      input.focus({ preventScroll: true })
    } catch (_) {
      input.focus()
    }
    if (String(input.value || '').trim()) input.select()
    renderStorefrontSearchSuggestions(input)
    return
  }
  const navbar = document.querySelector('nav.navbar-blur')
  const filterBar = document.getElementById('filterBar')
  const input = document.getElementById('searchInput')
  if (!filterBar || !input) return
  const navbarHeight = navbar ? navbar.getBoundingClientRect().height : 0
  const filterRect = filterBar.getBoundingClientRect()
  const targetTop = Math.max(0, window.scrollY + filterRect.top - navbarHeight - 12)
  window.scrollTo({ top: targetTop, behavior: 'smooth' })
  setTimeout(() => {
    try {
      input.focus({ preventScroll: true })
    } catch (_) {
      input.focus()
    }
    if (String(input.value || '').trim()) input.select()
  }, 260)
}
const toggleMobileSearch = focusProductsSearch
// ── CART MODAL ────────────────────────────────────
function openCart() {
  cartStep = 1
  ckAppliedVoucher = null
  renderCartStep1()
  document.getElementById('cartOverlay').classList.remove('hidden')
  document.getElementById('cartStep2').classList.add('hidden')
  document.getElementById('cartStep2').classList.remove('flex')
  document.getElementById('cartStep1').classList.remove('hidden')
  document.getElementById('cartBackBtn').classList.add('hidden')
  document.getElementById('cartTitle').textContent = 'Giỏ hàng'
  lockStorefrontPageScroll('cartOverlay')
}
function closeCart() {
  document.getElementById('cartOverlay').classList.add('hidden')
  closeCheckoutAddressEditor()
  closeCheckoutAddressManager()
  closeCheckoutNoteSheet()
  unlockStorefrontPageScroll('cartOverlay')
}
function handleCartOverlayClick(e) {
  if (e.target.id === 'cartOverlay') closeCart()
}
function cartGoBack() {
  cartStep = 1
  document.getElementById('cartStep2').classList.add('hidden')
  document.getElementById('cartStep2').classList.remove('flex')
  document.getElementById('cartStep1').classList.remove('hidden')
  document.getElementById('cartBackBtn').classList.add('hidden')
  document.getElementById('cartTitle').textContent = 'Giỏ hàng'
  updateCartHeaderSubtitle()
}

function renderCartStep1() {
  const listEl = document.getElementById('cartItemsList')
  const checkAllBar = document.getElementById('cartCheckAllBar')
  const footer = document.getElementById('cartFooter')
  
  if (cart.length === 0) {
    checkAllBar.classList.add('hidden')
    footer.classList.add('hidden')
    listEl.innerHTML = '<div class="flex flex-col items-center justify-center py-20 text-center"><div class="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4"><i class="fas fa-shopping-bag text-4xl text-gray-300"></i></div><p class="text-gray-500 font-medium text-lg mb-1">Chưa có mặt hàng nào</p><p class="text-gray-400 text-sm">Hãy thêm mặt hàng vào giỏ hàng</p><button onclick="closeCart()" class="mt-6 btn-primary text-white px-6 py-2.5 rounded-full font-semibold text-sm"><i class="fas fa-arrow-left mr-2"></i>Tiếp tục mua sắm</button></div>'
    updateCartHeaderSubtitle()
    return
  }

  checkAllBar.classList.remove('hidden')
  footer.classList.remove('hidden')

  // Sync checkAll state
  const allChecked = cart.every(i=>i.checked)
  document.getElementById('checkAll').checked = allChecked

  listEl.innerHTML = cart.map(function(item) {
    const col = (typeof item.color === 'string' && item.color) ? item.color : ''
    const sz = item.size || ''
    const chk = item.checked ? 'checked' : ''
    const variantLabel = [col, sz].filter(Boolean).join(', ') || 'Chọn màu, size'
    return '<div class="cart-item rounded-xl border border-gray-200 bg-white" data-cart-id="' + item.cartId + '">'
      + '<div class="cart-item-inner rounded-xl p-3" data-cart-id="' + item.cartId + '">'
      + '<button type="button" class="cart-inline-delete-btn cart-del-btn" data-id="' + item.cartId + '" title="Xoá sản phẩm" aria-label="Xoá sản phẩm"><i class="fas fa-trash"></i></button>'
      + '<div class="flex gap-3 items-start">'
      + '<div class="flex-shrink-0 pt-1"><input type="checkbox" ' + chk + ' data-toggle-id="' + item.cartId + '" class="cart-chk w-4 h-4 accent-pink-500 cursor-pointer mt-0.5"></div>'
      + '<img src="' + escapeHtml(item.thumbnail) + '" alt="' + escapeHtml(item.name) + '" class="h-20 aspect-square object-cover rounded-lg flex-shrink-0" onerror="this.src=&quot;https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&quot;">'
      + '<div class="flex-1 min-w-0 pr-8">'
      + '<p class="font-semibold text-gray-900 text-sm line-clamp-1 mb-0.5">' + escapeHtml(item.name) + '</p>'
      + '<p class="text-xs text-gray-400 mb-1">' + escapeHtml(item.sku) + '</p>'
      + '<button type="button" class="cart-variant-selector" data-cart-id="' + item.cartId + '"><span>' + escapeHtml(variantLabel) + '</span><i class="fas fa-chevron-down"></i></button>'
      + '<div class="flex items-center justify-between">'
      + '<span class="text-gradient-price font-bold text-sm">' + fmtPrice(item.price) + '</span>'
      + '<div class="flex items-center gap-2">'
      + '<button class="cart-qty-btn w-7 h-7 rounded-full border flex items-center justify-center text-gray-600 hover:border-pink-400 hover:text-pink-500 transition font-bold text-base" data-id="' + item.cartId + '" data-delta="-1">&minus;</button>'
      + '<span class="text-sm font-bold w-6 text-center">' + item.qty + '</span>'
      + '<button class="cart-qty-btn w-7 h-7 rounded-full border flex items-center justify-center text-gray-600 hover:border-pink-400 hover:text-pink-500 transition font-bold text-base" data-id="' + item.cartId + '" data-delta="1">+</button>'
      + '</div></div>'
      + '<p class="text-right text-xs text-gray-400 mt-1">= ' + fmtPrice(item.price * item.qty) + '</p>'
      + '</div></div></div></div>'
  }).join('')

  // Bind events via delegation
  listEl.querySelectorAll('.cart-del-btn').forEach(function(btn) {
    btn.addEventListener('click', function() { removeCartItem(btn.dataset.id) })
  })
  listEl.querySelectorAll('.cart-chk').forEach(function(cb) {
    cb.addEventListener('change', function() { toggleCartItem(cb.dataset.toggleId, cb.checked) })
  })
  listEl.querySelectorAll('.cart-qty-btn').forEach(function(btn) {
    btn.addEventListener('click', function() { changeCartQty(btn.dataset.id, parseInt(btn.dataset.delta)) })
  })
  listEl.querySelectorAll('.cart-variant-selector').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation()
      openCartItemVariantEditor(btn.dataset.cartId)
    })
  })

  updateCartSummary()
  updateCartHeaderSubtitle()
}

async function openCartItemVariantEditor(cartId) {
  const item = cart.find(i => i.cartId === cartId)
  if (!item) return
  cartVariantEditId = cartId
  await openVariantModal(item.productId, 'add_to_cart', cartId)
}

function updateCartHeaderSubtitle() {
  const total = cart.reduce(function(s,i){return s+i.qty},0)
  document.getElementById('cartSubtitle').textContent = total > 0 ? (total + ' mặt hàng trong giỏ') : 'Chưa có mặt hàng nào'
}

function toggleCheckAll(cb) {
  cart.forEach(i=>i.checked = cb.checked)
  saveCart()
  renderCartStep1()
}
function toggleCartItem(cartId, checked) {
  const item = cart.find(i=>i.cartId===cartId)
  if (item) item.checked = checked
  saveCart()
  updateCartSummary()
  // sync checkAll
  document.getElementById('checkAll').checked = cart.every(i=>i.checked)
}
function updateCartSummary() {
  const checked = cart.filter(i=>i.checked)
  const total = checked.reduce((s,i)=>s+i.price*i.qty,0)
  const count = checked.length
  document.getElementById('cartSelectedItems').textContent = checked.reduce((s,i)=>s+i.qty,0)
  document.getElementById('cartTotalPrice').textContent = fmtPrice(total)
  const deleteBtn = document.getElementById('deleteCheckedBtn')
  const checkoutBtn = document.getElementById('checkoutBtn')
  if (count > 0) {
    deleteBtn.classList.remove('hidden')
    checkoutBtn.disabled = false
  } else {
    deleteBtn.classList.add('hidden')
    checkoutBtn.disabled = true
  }
  document.getElementById('selectedCount').textContent = 'Đã chọn ' + count
}
function changeCartQty(cartId, delta) {
  const item = cart.find(i=>i.cartId===cartId)
  if (!item) return
  item.qty = Math.max(1, Math.min(99, item.qty + delta))
  saveCart()
  renderCartStep1()
}
function removeCartItem(cartId) {
  cart = cart.filter(i=>i.cartId!==cartId)
  saveCart()
  renderCartStep1()
}
function removeChecked() {
  cart = cart.filter(i=>!i.checked)
  saveCart()
  renderCartStep1()
}

// ── SWIPE TO DELETE ────────────────────────────────
function setupSwipeToDelete() {
  document.querySelectorAll('.cart-item').forEach(itemEl => {
    const inner = itemEl.querySelector('.cart-item-inner')
    if (!inner) return
    let startX = 0, currentX = 0, isDragging = false
    const threshold = 60

    function onStart(e) {
      startX = e.touches ? e.touches[0].clientX : e.clientX
      isDragging = true
    }
    function onMove(e) {
      if (!isDragging) return
      currentX = (e.touches ? e.touches[0].clientX : e.clientX) - startX
      if (currentX < 0) {
        inner.style.transform = 'translateX(' + Math.max(currentX,-80) + 'px)'
      } else {
        inner.style.transform = ''
      }
    }
    function onEnd() {
      if (!isDragging) return
      isDragging = false
      const cartId = inner.dataset.cartId
      if (currentX < -threshold) {
        inner.style.transform = 'translateX(-80px)'
        setTimeout(()=>removeCartItem(cartId),200)
      } else {
        inner.style.transform = ''
      }
      currentX = 0
    }
    inner.addEventListener('touchstart', onStart, {passive:true})
    inner.addEventListener('touchmove', onMove, {passive:true})
    inner.addEventListener('touchend', onEnd)
    inner.addEventListener('mousedown', onStart)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onEnd)
  })
}

// ── CHECKOUT from CART ────────────────────────────
function renderCheckoutSummaryCards(items) {
  return items.map(function(item) {
    const col = (typeof item.color === 'string' && item.color) ? item.color : ''
    const sz = item.size || ''
    const variantLabel = [col, sz].filter(Boolean).join(', ') || 'Chọn màu, size'
    return '<div class="checkout-order-item cart-item rounded-xl border border-gray-200 bg-white">'
      + '<div class="cart-item-inner checkout-order-item-inner rounded-xl p-3">'
      + '<div class="flex gap-3 items-start">'
      + '<img src="' + escapeHtml(item.thumbnail) + '" alt="' + escapeHtml(item.name) + '" class="checkout-order-img h-20 aspect-square object-cover rounded-lg flex-shrink-0" onerror="this.src=&quot;https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&quot;">'
      + '<div class="flex-1 min-w-0">'
      + '<div class="flex items-start gap-2">'
      + '<p class="checkout-order-product-name font-semibold text-gray-900 text-sm line-clamp-1 mb-0.5 flex-1 min-w-0">' + escapeHtml(item.name) + '</p>'
      + '<span class="checkout-order-qty">x' + item.qty + '</span>'
      + '</div>'
      + '<p class="text-xs text-gray-400 mb-1">' + escapeHtml(item.sku) + '</p>'
      + '<div class="cart-variant-selector checkout-order-variant"><span>' + escapeHtml(variantLabel) + '</span></div>'
      + '<span class="text-gradient-price font-bold text-sm">' + fmtPrice(item.price) + '</span>'
      + '</div></div></div></div>'
  }).join('')
}

async function proceedToCheckout() {
  const checked = cart.filter(i=>i.checked)
  if (checked.length === 0) { showToast('Vui lòng chọn ít nhất 1 mặt hàng','error'); return }
  if (!assertCustomerCanShop()) return
  try {
    await ensureAddressKitReady()
  } catch (_) {
    showToast('Không tải được danh mục địa chỉ, vui lòng thử lại.', 'error', 4500)
    return
  }
  // Build summary
  const summaryItemsEl = document.getElementById('checkoutSummaryItems')
  summaryItemsEl.className = 'checkout-order-list'
  summaryItemsEl.innerHTML = renderCheckoutSummaryCards(checked)
  // reset form
  ;['ckName','ckPhone','ckAddress','ckAddressDetail','ckNote'].forEach(id => { const el=document.getElementById(id); if(el) el.value='' })
  await applySavedAddressToScope('ck')
  loadCheckoutAddressBook()
  const selectedAddress = getSelectedCheckoutAddress()
  if (selectedAddress) await applyCheckoutAddressRecord(selectedAddress)
  else ensureCheckoutAddressBookFromCurrentFields()
  renderCheckoutAddressSummary()
  updateCheckoutNoteActionLabel()
  setCartSubmitStatus('', '')
  ;['ckFieldName','ckFieldPhone','ckFieldAddress','ckFieldPaymentMethod'].forEach(id => clearCheckoutError(id))
  resetCheckoutPaymentMethod('ck')
  ckAppliedVoucher = null
  document.getElementById('ckVoucher').value = ''
  document.getElementById('ckVoucherStatus').classList.add('hidden')
  document.getElementById('ckVoucherBtn').textContent = 'Áp dụng'
  document.getElementById('ckVoucherBtn').className = 'px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-sm font-semibold transition whitespace-nowrap'
  updateCkTotal()
  // show step2
  cartStep = 2
  document.getElementById('cartStep1').classList.add('hidden')
  document.getElementById('cartStep2').classList.remove('hidden')
  document.getElementById('cartStep2').classList.add('flex')
  document.getElementById('cartBackBtn').classList.remove('hidden')
  document.getElementById('cartTitle').textContent = 'Xác nhận đơn hàng'
  document.getElementById('cartSubtitle').textContent = checked.reduce(function(s,i){return s+i.qty},0) + ' mặt hàng'
}

function updateCkTotal() {
  const checked = cart.filter(i=>i.checked)
  const itemCount = checked.reduce((s,i)=>s+i.qty,0)
  const subtotal = checked.reduce((s,i)=>s+i.price*i.qty,0)
  const discount = ckAppliedVoucher ? ckAppliedVoucher.discount_amount : 0
  const total = Math.max(0, subtotal - discount)
  const label = document.getElementById('ckTotalLabel')
  if (label) label.textContent = 'Tổng (' + itemCount + ' mặt hàng):'
  document.getElementById('ckTotal').textContent = fmtPrice(total)
  if (ckAppliedVoucher) {
    document.getElementById('ckSubtotal').textContent = fmtPrice(subtotal)
    document.getElementById('ckDiscount').textContent = '-'+fmtPrice(discount)
    document.getElementById('ckSubtotalRow').classList.remove('hidden')
    document.getElementById('ckDiscountRow').classList.remove('hidden')
  } else {
    document.getElementById('ckSubtotalRow').classList.add('hidden')
    document.getElementById('ckDiscountRow').classList.add('hidden')
  }
}

function setCartSubmitStatus(message, type) {
  const el = document.getElementById('ckSubmitStatus')
  if (!el) return
  const msg = String(message || '').trim()
  if (!msg) {
    el.classList.add('hidden')
    el.textContent = ''
    return
  }
  const isError = type === 'error'
  el.className = (isError
    ? 'mb-3 rounded-xl px-3 py-2 text-sm font-semibold bg-red-500/10 text-red-600 border border-red-400/30'
    : 'mb-3 rounded-xl px-3 py-2 text-sm font-semibold bg-green-500/10 text-green-600 border border-green-400/30')
  el.textContent = msg
}

function resetCartSubmitButton() {
  const btn = document.getElementById('submitCartBtn')
  if (!btn) return
  btn.disabled = false
  btn.innerHTML = '<i class="fas fa-credit-card mr-2"></i>Đặt hàng'
}

function showCartOrderSuccessModal(createdOrders) {
  const overlay = document.getElementById('cartOrderSuccessOverlay')
  const msgEl = document.getElementById('cartOrderSuccessMessage')
  const codesEl = document.getElementById('cartOrderSuccessCodes')
  if (!overlay || !codesEl) return
  const orders = Array.isArray(createdOrders) ? createdOrders : []
  if (msgEl) msgEl.textContent = orders.length > 1
    ? (orders.length + ' đơn hàng đã được tạo.')
    : 'Đơn hàng đã được ghi nhận.'
  codesEl.innerHTML = orders.map((order) => {
    return '<p class="font-mono text-sm font-bold text-blue-600">' + escapeHtml(order.orderCode || '') + '</p>'
  }).join('')
  overlay.classList.remove('hidden')
  overlay.classList.add('flex')
  lockStorefrontPageScroll('cartOrderSuccessOverlay')
}

function closeCartOrderSuccessModal() {
  const overlay = document.getElementById('cartOrderSuccessOverlay')
  if (!overlay) return
  overlay.classList.add('hidden')
  overlay.classList.remove('flex')
  unlockStorefrontPageScroll('cartOrderSuccessOverlay')
}
async function applyCkVoucher() {
  const code = document.getElementById('ckVoucher').value.trim().toUpperCase()
  const statusEl = document.getElementById('ckVoucherStatus')
  const btn = document.getElementById('ckVoucherBtn')
  if (!code) {
    statusEl.className='mt-2 voucher-error rounded-xl px-3 py-2 text-sm text-red-600 font-medium'
    statusEl.innerHTML='<i class="fas fa-times-circle mr-1"></i>Vui lòng nhập mã khuyến mãi'
    statusEl.classList.remove('hidden'); return
  }
  btn.disabled=true; btn.innerHTML='<i class="fas fa-spinner fa-spin"></i>'
  statusEl.classList.add('hidden')
  try {
    const res = await axios.post('/api/vouchers/validate', { code })
    ckAppliedVoucher = res.data.data
    statusEl.className='mt-2 voucher-success rounded-xl px-3 py-2 text-sm text-green-700 font-semibold flex items-center gap-2'
    statusEl.innerHTML='<i class="fas fa-check-circle text-green-500"></i>Áp dụng thành công! Giảm <strong>' + fmtPrice(ckAppliedVoucher.discount_amount) + '</strong>'
    statusEl.classList.remove('hidden')
    document.getElementById('ckVoucher').classList.add('border-green-400','bg-green-50')
    updateCkTotal()
  } catch(err) {
    ckAppliedVoucher = null
    const errCode = err.response?.data?.error
    const msg = errCode==='VOUCHER_LIMIT'?'Mã khuyến mãi đã hết lượt':errCode==='INVALID_VOUCHER'?'Mã không hợp lệ hoặc hết hạn':'Không thể áp dụng'
    statusEl.className='mt-2 voucher-error rounded-xl px-3 py-2 text-sm text-red-600 font-medium flex items-center gap-1'
    statusEl.innerHTML='<i class="fas fa-times-circle mr-1"></i>' + msg
    statusEl.classList.remove('hidden')
    document.getElementById('ckVoucher').classList.remove('border-green-400','bg-green-50')
    updateCkTotal()
  } finally {
    btn.disabled=false
    btn.innerHTML = ckAppliedVoucher ? '<i class="fas fa-check mr-1"></i>Đã áp dụng' : 'Áp dụng'
    if(ckAppliedVoucher) btn.classList.replace('bg-gray-800','bg-green-600')
    else btn.className='px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-sm font-semibold transition whitespace-nowrap'
  }
}
function shakeCheckoutField(fieldId) {
  const el = document.getElementById(fieldId)
  if (!el) return
  el.classList.add('field-error')
  el.classList.remove('shake')
  void el.offsetWidth
  el.classList.add('shake')
  el.scrollIntoView({ behavior:'smooth', block:'center' })
  setTimeout(()=>el.classList.remove('shake'),600)
}
function clearCheckoutError(fieldId) {
  document.getElementById(fieldId)?.classList.remove('field-error')
}

// ── CUSTOMER BLOCK CHECK ──────────────────────────
async function checkCustomerBlockStatus(phone) {
  try {
    if (isCurrentUserBlocked()) {
      return { is_blocked: true, reason: getCurrentUserBlockReason() }
    }
    const userId = currentUser?.userId || currentUser?.id || null
    const normalizedPhone = normalizeCustomerPhone(phone)
    if (!userId && !normalizedPhone) return { is_blocked: false, reason: '' }
    let url = '/api/customers/block-status?'
    if (userId) url += 'user_id=' + userId + '&'
    if (normalizedPhone) url += 'phone=' + encodeURIComponent(normalizedPhone)
    
    const res = await axios.get(url)
    return res.data?.data || { is_blocked: false, reason: '' }
  } catch (e) {
    console.error('Check block status error:', e)
    return { is_blocked: false, reason: '' }
  }
}

function showBlockedCustomerModal(reason) {
  const modal = document.getElementById('blockedCustomerModal')
  const reasonEl = document.getElementById('blockedCustomerReason')
  if (reasonEl) reasonEl.textContent = reason || 'Không thể đặt hàng'
  if (modal) {
    modal.classList.remove('hidden')
    modal.classList.add('flex')
    lockStorefrontPageScroll('blockedCustomerModal')
  }
}

function closeBlockedCustomerModal() {
  const modal = document.getElementById('blockedCustomerModal')
  if (modal) {
    modal.classList.add('hidden')
    modal.classList.remove('flex')
    unlockStorefrontPageScroll('blockedCustomerModal')
  }
}

async function submitCartOrder() {
  setCartSubmitStatus('', '')
  let payload = validateCheckoutFields('ck', { requirePayment: true })
  if (!payload) {
    const selectedAddress = getSelectedCheckoutAddress()
    if (selectedAddress) {
      try {
        await applyCheckoutAddressRecord(selectedAddress)
        payload = validateCheckoutFields('ck', { requirePayment: true })
      } catch (_) { }
    }
  }
  if (!payload) {
    setCartSubmitStatus('Vui lòng kiểm tra lại thông tin giao hàng và phương thức thanh toán.', 'error')
    if (window.matchMedia && window.matchMedia('(max-width: 767px)').matches) {
      openCheckoutAddressEditor()
    }
    return
  }

  const btn = document.getElementById('submitCartBtn')
  if (btn) {
    btn.disabled = true
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Đang đặt hàng...'
  }

  // Check if customer is blocked
  const blockCheck = await checkCustomerBlockStatus(payload.phone)
  if (blockCheck.is_blocked) {
    resetCartSubmitButton()
    showBlockedCustomerModal(blockCheck.reason)
    return
  }

  const note = document.getElementById('ckNote').value.trim()
  const checkedItems = cart.filter(i=>i.checked)
  if (!checkedItems.length) {
    setCartSubmitStatus('Không còn mặt hàng nào được chọn để đặt.', 'error')
    resetCartSubmitButton()
    return
  }
  const paymentMethod = getCheckoutSelectedPaymentMethod('ck')
  if (paymentMethod === 'BANK_TRANSFER' && checkedItems.length !== 1) {
    setCartSubmitStatus('Chuyển khoản từ giỏ hiện chỉ hỗ trợ 1 mặt hàng mỗi lần. Hãy chọn 1 mặt hàng hoặc dùng COD.', 'error')
    resetCartSubmitButton()
    return
  }
  let payTabRef = null
  if (paymentMethod === 'BANK_TRANSFER') {
    try { payTabRef = window.open('about:blank', '_blank') } catch (_) { payTabRef = null }
  }

  try {
    const createdOrders = []
    for (const item of checkedItems) {
      const res = await axios.post('/api/orders', {
        customer_name: payload.name, customer_phone: payload.phone, customer_address: payload.address,
        customer_province_code: payload.addressPayload.provinceCode,
        customer_commune_code: payload.addressPayload.communeCode,
        address_effective_date: payload.addressPayload.effectiveDate,
        product_id: item.productId, color: item.color, size: item.size,
        product_sku_id: item.productSkuId || '',
        selected_color_image: item.colorImage || '',
        quantity: item.qty,
        voucher_code: ckAppliedVoucher ? ckAppliedVoucher.code : '',
        note,
        payment_method: paymentMethod,
        device_id: getStorefrontDeviceId()
      })
      createdOrders.push({
        orderCode: res.data.order_code,
        orderId: Number(res.data.id || 0),
        orderTotal: Number(res.data.total || 0)
      })
    }
    // Remove checked items from cart
    cart = cart.filter(i=>!i.checked)
    saveCart()
    closeCart()
    if (paymentMethod === 'BANK_TRANSFER' && createdOrders[0]) {
      await continueOrderPaymentFlow({
        orderCode: createdOrders[0].orderCode,
        orderId: createdOrders[0].orderId,
        orderTotal: createdOrders[0].orderTotal,
        paymentMethod,
        payTabRef
      })
    } else {
      showCartOrderSuccessModal(createdOrders)
      showToast('Đặt hàng thành công! ' + createdOrders.length + ' đơn hàng đã được tạo', 'success', 5000)
    }
  } catch(e) {
    try { if (payTabRef && !payTabRef.closed) payTabRef.close() } catch (_) { }
    const errCode = e.response?.data?.error
    if (errCode === 'CUSTOMER_BLOCKED') {
      showBlockedCustomerModal(e.response?.data?.reason || 'Không thể đặt hàng')
    } else if (errCode === 'ORDER_DAILY_LIMIT_REACHED') {
      showBlockedCustomerModal(e.response?.data?.reason || 'Bạn đã đặt tối đa 2 đơn trong hôm nay. Vui lòng liên hệ shop nếu cần hỗ trợ.')
    } else if (errCode==='INVALID_VOUCHER'||errCode==='VOUCHER_LIMIT') {
      setCartSubmitStatus('Mã khuyến mãi không còn hiệu lực.', 'error')
      ckAppliedVoucher=null; updateCkTotal()
      document.getElementById('ckVoucherBtn').innerHTML='Áp dụng'
      document.getElementById('ckVoucherBtn').className='px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-sm font-semibold transition whitespace-nowrap'
    } else {
      const apiMsg = e.response?.data?.reason || e.response?.data?.error || e.message || ''
      setCartSubmitStatus('Đặt hàng thất bại' + (apiMsg ? ': ' + apiMsg : ', vui lòng thử lại sau.'), 'error')
    }
  } finally {
    resetCartSubmitButton()
  }
}

function toggleCart() { openCart() }

// Close overlays on outside click
document.getElementById('orderOverlay').addEventListener('click', (e) => { if(e.target.id==='orderOverlay') closeOrder() })
document.getElementById('detailOverlay').addEventListener('click', (e) => { if(e.target.id==='detailOverlay') closeDetail() })
document.getElementById('orderBankTransferOverlay').addEventListener('click', (e) => { if (e.target.id === 'orderBankTransferOverlay') closeOrderBankTransferModal() })
document.getElementById('productsModalOverlay')?.addEventListener('click', (e) => { if (e.target.id === 'productsModalOverlay') closeProductsModal() })
const storefrontClosableOverlays = [
  { id: 'favoriteAuthModal', close: () => closeFavoriteAuthModal() },
  { id: 'orderBankTransferOverlay', close: () => closeOrderBankTransferModal() },
  { id: 'shippingJourneyOverlay', close: () => closeShippingJourneyModal() },
  { id: 'productsModalOverlay', close: () => closeProductsModal() },
  { id: 'orderOverlay', close: () => closeOrder() },
  { id: 'detailOverlay', close: () => closeDetail() },
  { id: 'checkoutAddressManagerOverlay', close: () => closeCheckoutAddressManager() },
  { id: 'checkoutNoteOverlay', close: () => closeCheckoutNoteSheet() },
  { id: 'cartOrderSuccessOverlay', close: () => closeCartOrderSuccessModal() },
  { id: 'cartOverlay', close: () => closeCart() },
  { id: 'userMenuOverlay', close: () => closeUserMenu() },
]

function closeVisibleStorefrontOverlay() {
  for (const item of storefrontClosableOverlays) {
    const overlay = document.getElementById(item.id)
    if (overlay && !overlay.classList.contains('hidden')) {
      item.close()
      return true
    }
  }
  return false
}

function handleGlobalEscape(e) {
  if (e.key !== 'Escape') return
  if (closeVisibleStorefrontOverlay()) return
}

document.addEventListener('keydown', handleGlobalEscape)

// Auto clear error on input
;['orderName','orderPhone','orderAddressDetail','orderProvince','orderCommune'].forEach(id => {
  const el = document.getElementById(id)
  if (!el) return
  const fieldMap = {
    orderName: 'fieldName',
    orderPhone: 'fieldPhone',
    orderAddressDetail: 'fieldAddress',
    orderProvince: 'fieldAddress',
    orderCommune: 'fieldAddress'
  }
  const clearFn = () => {
    clearFieldError(fieldMap[id])
    renderOrderAddressSummary()
  }
  el.addEventListener('input', clearFn)
  el.addEventListener('change', clearFn)
})

// ── DYNAMIC HERO BANNERS ──────────────────────────
let heroBannersData = []
let lastHeroMobileMode = null
let heroCarouselIndex = 0
let heroCarouselTimer = null
let heroCarouselSuppressClick = false

function renderFooterSocialLinks(data) {
  const section = document.getElementById('footerSocialSection')
  const container = document.getElementById('footerSocialLinks')
  if (!section || !container) return
  const platforms = [
    { key: 'tiktok', label: 'TikTok', icon: 'fa-brands fa-tiktok' },
    { key: 'shopee', label: 'Shopee', icon: 'fa-solid fa-bag-shopping' },
    { key: 'facebook', label: 'Facebook', icon: 'fa-brands fa-facebook-f' },
    { key: 'threads', label: 'Threads', icon: 'fa-brands fa-threads' },
  ]
  const items = platforms.filter((item) => {
    const row = data && data[item.key]
    return row && row.url && row.handle
  })
  if (!items.length) {
    section.classList.add('hidden')
    container.innerHTML = ''
    return
  }
  section.classList.remove('hidden')
  container.innerHTML = items.map((item) => {
    const row = data[item.key]
    return '<a href="' + row.url + '" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-gray-200 hover:text-pink-300 hover:border-pink-300/40 transition"><i class="' + item.icon + ' text-pink-400"></i><span>' + item.label + '</span></a>'
  }).join('')
}

async function loadFooterSocialLinks() {
  try {
    const res = await axios.get('/api/public/social-links')
    renderFooterSocialLinks((res.data && res.data.data) || {})
  } catch (_) {
    renderFooterSocialLinks({})
  }
}

async function loadSettings() {
  try {
    prepareHeroBannerShell()
    loadPublicPaymentSettings().catch(() => { })
    const imageSettingsRes = await axios.get('/api/public/image-settings').catch(() => ({ data: { data: {} } }))
    const imageSettings = (imageSettingsRes.data && imageSettingsRes.data.data) ? imageSettingsRes.data.data : {}
    const configuredTrendingImage = String(imageSettings.home_trending_banner_image || '').trim()
    const settingBannerCards = configuredTrendingImage ? [{
        image_url: configuredTrendingImage,
        subtitle: String(imageSettings.home_trending_banner_subtitle || '').trim() || 'QH Boypho · Đang thịnh hành',
        title: String(imageSettings.home_trending_banner_title || '').trim() || 'Bộ sưu tập thịnh hành',
        price: '',
        product_id: null,
        is_setting_banner: true,
        trending_order: 0,
        updated_at: '',
        created_at: ''
      }] : []

    const trendingRes = await axios.get('/api/trending-products' + getStorefrontQuerySuffix()).catch(() => ({ data: { data: [] } }))
    const trendingProducts = (trendingRes.data && trendingRes.data.data) ? trendingRes.data.data : []
    const fallbackProducts = trendingProducts.length || settingBannerCards.length ? [] : await loadHeroFallbackProducts()
    heroBannersData = sortHeroCards([...mapTrendingProductsToHeroCards(trendingProducts.length ? trendingProducts : fallbackProducts), ...settingBannerCards])
    renderCollapsedBanners(heroBannersData)
  } catch (e) {
    console.error('Failed to load banners', e)
  }
}

async function loadPublicPaymentSettings() {
  const res = await axios.get('/api/public/payment-settings')
  const data = (res.data && res.data.data) || {}
  walletTopupEnabled = data.wallet_topup_enabled !== false
  updateUserUI()
  syncWalletTopupDisabledView()
}

async function loadHeroFallbackProducts() {
  if (Array.isArray(allProducts) && allProducts.length) return allProducts.slice(0, 6)
  const productsRes = await axios.get('/api/products' + getStorefrontQuerySuffix()).catch(() => ({ data: { data: [] } }))
  const products = (productsRes.data && productsRes.data.data) ? productsRes.data.data : []
  return Array.isArray(products) ? products.slice(0, 6) : []
}

function ensureBestsellerRuntimeStyle() {
  if (document.getElementById('bestsellerRuntimeStyle')) return
  const style = document.createElement('style')
  style.id = 'bestsellerRuntimeStyle'
  style.textContent = '.bs-price{font-size:15px;font-weight:800;white-space:nowrap}.bs-original-price{font-size:11px;color:rgba(148,163,184,.82);text-decoration:line-through;white-space:nowrap}'
  document.head.appendChild(style)
}

function prepareHeroBannerShell() {
  const wrapper = document.getElementById('heroBannersWrapper')
  const container = document.getElementById('heroBannersCollapsed')
  if (!container) return
  ensureHeroCarouselRuntimeStyle()
  container.removeAttribute('title')
  const legacyOverlay = document.getElementById('heroBannersExpanded')
  if (legacyOverlay) legacyOverlay.remove()
  const mobileMode = isMobileHeroLayout()
  if (wrapper) {
    wrapper.style.justifyContent = mobileMode ? 'flex-start' : 'flex-end'
    wrapper.style.cursor = 'default'
  }
  if (mobileMode) {
    container.style.width = '100%'
    container.style.height = 'auto'
    container.innerHTML = ''
    return
  }
  container.style.width = '360px'
  container.style.height = '360px'
  container.style.paddingBottom = '0'
  container.onclick = null
  container.innerHTML = '<div class="relative rounded-3xl overflow-hidden bg-white/[0.03]" style="width:360px;height:360px"></div>'
}

function mapTrendingProductsToHeroCards(products) {
  if (!Array.isArray(products)) return []
  return products.map((p) => {
    const imgs = safeJson(p.images)
    const categoryLabel = p.category === 'male' ? 'Nam' : p.category === 'female' ? 'Nu' : 'Unisex'
    const priceInfo = getProductDisplayPriceInfo(p)
    const displayPrice = priceInfo.price
    const displayOriginalPrice = priceInfo.originalPrice
    return {
      image_url: p.thumbnail || imgs[0] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
      subtitle: categoryLabel + ' · Dang thinh hanh',
      title: p.name || '',
      price: fmtPrice(displayPrice),
      original_price: displayOriginalPrice > displayPrice ? fmtPrice(displayOriginalPrice) : '',
      description: String(p.description || '').trim(),
      tags: [],
      product_id: p.id,
      total_sold: Number(p.total_sold || 0),
      has_auto_voucher: !!p.has_auto_voucher,
      display_auto_voucher_discount: p.display_auto_voucher_discount || 0,
      auto_voucher: p.auto_voucher,
      trending_order: Number(p.trending_order || 0),
      updated_at: p.updated_at || '',
      created_at: p.created_at || ''
    }
  })
}
function sortHeroCards(cards) {
  return [...cards].sort((a, b) => {
    const ao = Number(a.trending_order || 0)
    const bo = Number(b.trending_order || 0)
    const aHas = ao > 0
    const bHas = bo > 0
    if (aHas && !bHas) return -1
    if (!aHas && bHas) return 1
    if (aHas && bHas && ao !== bo) return ao - bo
    const au = Date.parse(a.created_at || a.updated_at || '')
    const bu = Date.parse(b.created_at || b.updated_at || '')
    if (!Number.isNaN(au) && !Number.isNaN(bu) && au !== bu) return au - bu
    return Number(a.product_id || 0) - Number(b.product_id || 0)
  })
}
function isMobileHeroLayout() {
  return window.matchMedia('(max-width: 768px)').matches
}

function renderCollapsedBanners(banners) {
  const container = document.getElementById('heroBannersCollapsed')
  if (!container) return
  ensureHeroCarouselRuntimeStyle()
  const wrapper = document.getElementById('heroBannersWrapper')
  const mobileMode = isMobileHeroLayout()
  lastHeroMobileMode = mobileMode
  if (wrapper) wrapper.style.justifyContent = mobileMode ? 'center' : 'flex-end'
  container.removeAttribute('title')
  stopHeroCarouselAutoPlay()
  if (!banners.length) {
    if (wrapper) wrapper.style.cursor = 'default'
    container.style.width = mobileMode ? '100%' : '360px'
    container.style.height = mobileMode ? '220px' : '360px'
    container.style.paddingBottom = '0'
    container.onclick = null
    container.innerHTML = \`<div class="relative w-full h-full rounded-3xl bg-gradient-to-br from-white/5 via-white/[0.03] to-pink-500/10 flex items-center justify-center text-center px-6">
      <div>
        <i class="fas fa-sparkles text-2xl text-pink-300 mb-2"></i>
        <p class="text-white/70 text-sm font-medium">Bộ sưu tập đang được cập nhật</p>
      </div>
    </div>\`
    return
  }
  const hasSettingBannerOnly = banners.length === 1 && banners[0]?.is_setting_banner
  if (wrapper) wrapper.style.cursor = 'default'
  container.onclick = null
  container.style.width = hasSettingBannerOnly ? (mobileMode ? 'min(100%, 320px)' : '360px') : (mobileMode ? '100%' : '430px')
  container.style.height = hasSettingBannerOnly ? (mobileMode ? 'min(82vw, 320px)' : '360px') : (mobileMode ? '356px' : '548px')
  container.style.marginLeft = mobileMode ? 'auto' : ''
  container.style.marginRight = mobileMode ? 'auto' : ''
  container.style.paddingBottom = '0'
  if (hasSettingBannerOnly) {
    const b = banners[0]
    const size = mobileMode ? 'min(100%, 320px)' : '360px'
    container.innerHTML = \`<div class="relative hero-setting-banner-card" style="width:\${size};height:\${size};cursor:default">
      <img src="\${escapeHtml(b.image_url)}" alt="\${escapeHtml(b.title || 'Banner')}" class="w-full h-full object-cover rounded-3xl pointer-events-none" onerror="this.src='https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'">
      \${renderHeroSettingCaption(b, mobileMode ? 'mobile' : 'desktop')}
    </div>\`
    return
  }
  const shown = banners.slice(0, Math.min(banners.length, 6))
  heroCarouselIndex = Math.min(heroCarouselIndex, Math.max(0, shown.length - 1))
  container.innerHTML = \`<div class="hero-3d-carousel" role="region" aria-label="Sản phẩm thịnh hành">
    <button type="button" class="hero-carousel-nav hero-carousel-prev" aria-label="Sản phẩm trước" onclick="moveHeroCarousel(-1)"><i class="fas fa-chevron-left"></i></button>
    <div class="hero-carousel-stage" id="heroCarouselStage">
      \${shown.map((b, i) => renderHeroCarouselCard(b, i)).join('')}
    </div>
    <button type="button" class="hero-carousel-nav hero-carousel-next" aria-label="Sản phẩm tiếp theo" onclick="moveHeroCarousel(1)"><i class="fas fa-chevron-right"></i></button>
  </div>\`
  updateHeroCarousel()
  bindHeroCarouselSwipe()
}

function ensureHeroCarouselRuntimeStyle() {
  if (document.getElementById('heroCarouselRuntimeStyle')) return
  const style = document.createElement('style')
  style.id = 'heroCarouselRuntimeStyle'
  style.textContent = \`
    #heroBannersWrapper{cursor:default!important}
    #heroBannersCollapsed{position:relative}
    .hero-setting-banner-card{border-radius:1.5rem;overflow:hidden;box-shadow:0 24px 55px rgba(0,0,0,.34);background:rgba(255,255,255,.05)}
    .hero-3d-carousel{position:relative;width:430px;height:500px;display:flex;align-items:center;justify-content:center;perspective:1100px;overflow:visible;touch-action:pan-y}
    .hero-carousel-stage{position:relative;width:360px;height:474px;transform-style:preserve-3d}
    .hero-carousel-card{position:absolute;top:0;left:0;width:100%;border-radius:24px;overflow:hidden;background:var(--qh-product-card-bg,linear-gradient(145deg,#fff,#f8fafc) padding-box,linear-gradient(135deg,rgba(203,213,225,.95),rgba(236,72,153,.24)) border-box);color:var(--qh-text,#111827);box-shadow:0 28px 70px rgba(0,0,0,.18),0 0 34px var(--qh-glow-blue,rgba(59,130,246,.12)),0 0 36px var(--qh-glow-pink,rgba(236,72,153,.1)),inset 0 0 0 1px rgba(255,255,255,.06),inset 0 1px 0 rgba(255,255,255,.08);border:1px solid transparent;transition:transform .55s cubic-bezier(.2,.8,.2,1),opacity .45s ease;will-change:transform,opacity;pointer-events:none;backface-visibility:hidden;-webkit-font-smoothing:antialiased}
    .hero-carousel-card[data-offset="0"]{transform:translate3d(0,0,0) scale(1);opacity:1;z-index:6;pointer-events:auto}
    .hero-carousel-card[data-offset="-1"]{transform:translate3d(-28%,6px,-48px) scale(.84);opacity:.72;z-index:4}
    .hero-carousel-card[data-offset="1"]{transform:translate3d(28%,6px,-48px) scale(.84);opacity:.72;z-index:4}
    .hero-carousel-card[data-offset="-2"]{transform:translate3d(-42%,18px,-96px) scale(.74);opacity:.22;z-index:2}
    .hero-carousel-card[data-offset="2"]{transform:translate3d(42%,18px,-96px) scale(.74);opacity:.22;z-index:2}
    .hero-carousel-card[data-offset="hidden"]{transform:translate3d(0,24px,-140px) scale(.68);opacity:0;z-index:1}
    .hero-carousel-media{position:relative;overflow:hidden;background:linear-gradient(135deg,#1f2937,#831843);aspect-ratio:1/1}
    .hero-carousel-media img{width:100%;height:100%;object-fit:cover;display:block}
    .hero-carousel-media::after{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(17,24,39,.08),rgba(190,24,93,.24))}
    .hero-carousel-media::before{content:'';position:absolute;left:0;right:0;bottom:0;height:38%;background:linear-gradient(180deg,rgba(7,12,24,0) 0%,rgba(7,12,24,.18) 34%,rgba(7,12,24,.58) 72%,rgba(7,12,24,.84) 100%);z-index:2;pointer-events:none}
    .hero-carousel-detail-overlay{position:absolute;inset:0;z-index:3;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0);opacity:0;transition:background .2s ease,opacity .2s ease;border:0;cursor:pointer}
    .hero-carousel-media:hover .hero-carousel-detail-overlay{background:rgba(0,0,0,.16);opacity:1}
    .hero-carousel-detail-overlay span{display:inline-flex;align-items:center;gap:.4rem;border-radius:999px;background:rgba(255,255,255,.92);color:#1f2937;font-size:12px;font-weight:700;padding:8px 12px;box-shadow:0 12px 26px rgba(15,23,42,.2)}
    .hero-carousel-kicker{position:absolute;left:18px;right:18px;bottom:14px;color:rgba(248,250,252,.98);font-size:11px;font-weight:900;letter-spacing:.16em;text-transform:uppercase;text-shadow:0 1px 2px rgba(2,6,23,.45);z-index:4;-webkit-font-smoothing:antialiased;text-rendering:geometricPrecision}
    .hero-carousel-body{padding:14px 16px 16px;display:flex;flex-direction:column;gap:11px;background:rgba(8,16,32,.88);-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;text-rendering:optimizeLegibility}
    .hero-carousel-title{font-family:'Inter',sans-serif;font-size:16px;font-weight:800;line-height:1.28;color:#f8fafc;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden;text-shadow:none;filter:none}
    .hero-carousel-footer{display:flex;align-items:center;justify-content:space-between;gap:12px}
    .hero-carousel-price-wrap{display:flex;align-items:center;gap:8px;min-width:0;flex-wrap:wrap}
    .hero-carousel-price{font-size:18px;font-weight:900;white-space:nowrap}
    .hero-carousel-original-price{font-size:11px;color:#9ca3af;text-decoration:line-through;white-space:nowrap}
    .hero-carousel-link{border:0;background:transparent;color:#f8fafc;font-size:14px;font-weight:700;white-space:nowrap;cursor:pointer;text-shadow:none}
    .hero-carousel-link:hover{color:#f9a8d4}
    .hero-carousel-nav{position:absolute;top:50%;transform:translateY(-50%);z-index:10;width:42px;height:42px;border:0;border-radius:999px;background:rgba(255,255,255,.92);color:#475569;box-shadow:0 12px 28px rgba(15,23,42,.22);display:flex;align-items:center;justify-content:center;transition:transform .2s ease,background .2s ease,color .2s ease}
    .hero-carousel-nav:hover{transform:translateY(-50%) scale(1.06);background:#fff;color:#db2777}
    .hero-carousel-prev{left:0}
    .hero-carousel-next{right:0}
    @media (max-width:768px){
      .hero-3d-carousel{width:100%;height:388px;overflow:hidden;perspective:820px}
      .hero-carousel-stage{width:min(52vw,214px);height:366px}
      .hero-carousel-card{border-radius:20px;display:flex;flex-direction:column}
      .hero-carousel-media{height:min(52vw,214px);aspect-ratio:auto;flex:0 0 auto}
      .hero-carousel-card[data-offset="-1"]{transform:translate3d(-42%,8px,-42px) scale(.8);opacity:.66}
      .hero-carousel-card[data-offset="1"]{transform:translate3d(42%,8px,-42px) scale(.8);opacity:.66}
      .hero-carousel-card[data-offset="-2"]{transform:translate3d(-68%,18px,-94px) scale(.66);opacity:.16}
      .hero-carousel-card[data-offset="2"]{transform:translate3d(68%,18px,-94px) scale(.66);opacity:.16}
      .hero-carousel-card[data-offset="-1"] .hero-carousel-body,
      .hero-carousel-card[data-offset="1"] .hero-carousel-body,
      .hero-carousel-card[data-offset="-2"] .hero-carousel-body,
      .hero-carousel-card[data-offset="2"] .hero-carousel-body{opacity:0}
      .hero-carousel-nav{width:34px;height:34px}
      .hero-carousel-prev{left:2px}
      .hero-carousel-next{right:2px}
      .hero-carousel-detail-overlay{display:none}
      .hero-carousel-media::before{display:none}
      .hero-carousel-kicker{display:none}
      .hero-carousel-body{padding:10px 12px 12px;gap:7px;min-height:0;flex:1}
      .hero-carousel-title{font-size:13px;line-height:1.22}
      .hero-carousel-footer{margin-top:auto;gap:8px;align-items:flex-end}
      .hero-carousel-price-wrap{gap:0}
      .hero-carousel-price{font-size:15px}
      .hero-carousel-original-price{font-size:11px}
      .hero-carousel-link{font-size:12px}
    }
  \`
  document.head.appendChild(style)
}

function renderHeroCarouselCard(b, index) {
  const title = escapeHtml(b.title || 'Sản phẩm thịnh hành')
  const subtitle = escapeHtml(b.subtitle || 'Đang thịnh hành')
  const price = escapeHtml(b.price || '')
  const originalPrice = escapeHtml(b.original_price || '')
  const image = escapeHtml(b.image_url || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400')
  const detailAction = b.product_id ? \`onclick="showDetail(\${Number(b.product_id)})"\` : 'onclick="document.getElementById(&quot;products&quot;)?.scrollIntoView({behavior:&quot;smooth&quot;})"'
  const footerAction = b.product_id ? \`onclick="event.stopPropagation();openOrder(\${Number(b.product_id)})"\` : detailAction
  const footerLabel = b.product_id ? 'Đặt nhanh' : 'Xem sản phẩm'
  if (isHotTrendWomenContext()) {
    return \`<article class="hero-carousel-card htn-hero-card" data-hero-index="\${index}" data-offset="hidden" aria-hidden="true" \${detailAction}>
      <div class="htn-hero-card-media">
        <img src="\${image}" alt="\${title}" onerror="this.src='https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'">
        <span class="htn-hero-card-index">\${String(index + 1).padStart(2, '0')}</span>
      </div>
      <div class="htn-hero-card-copy">
        <p>\${subtitle}</p>
        <h3>\${title}</h3>
        \${renderProductCommerceMeta(b, { className: 'product-commerce-meta--hottrendnu product-commerce-meta--hero' })}
        <div class="htn-hero-card-footer">
          <div class="htn-product-price-row">
            <span class="htn-product-price">\${price}</span>
            \${originalPrice ? \`<span class="htn-product-original">\${originalPrice}</span>\` : ''}
          </div>
          <button type="button" class="htn-hero-card-cta" \${footerAction}>\${footerLabel} <i class="fas fa-arrow-right" aria-hidden="true"></i></button>
        </div>
      </div>
    </article>\`
  }
  return \`<article class="hero-carousel-card" data-hero-index="\${index}" data-offset="hidden" aria-hidden="true" \${detailAction}>
    <div class="hero-carousel-media">
      <img src="\${image}" alt="\${title}" onerror="this.src='https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'">
      <p class="hero-carousel-kicker">\${subtitle}</p>
      <button type="button" class="hero-carousel-detail-overlay" \${detailAction}><span><i class="fas fa-eye"></i>Xem chi tiết</span></button>
    </div>
    <div class="hero-carousel-body">
      <h3 class="hero-carousel-title">\${title}</h3>
      \${renderProductCommerceMeta(b, { className: 'product-commerce-meta--hero' })}
      <div class="hero-carousel-footer">
        <div class="hero-carousel-price-wrap">
          <span class="hero-carousel-price text-gradient-price">\${price}</span>
          \${originalPrice ? \`<span class="hero-carousel-original-price">\${originalPrice}</span>\` : ''}
        </div>
        <button type="button" class="hero-carousel-link" \${footerAction}>\${footerLabel} <i class="fas fa-arrow-right ml-1"></i></button>
      </div>
    </div>
  </article>\`
}

function normalizeHeroCarouselOffset(offset, total) {
  if (total <= 1) return 0
  const half = Math.floor(total / 2)
  if (offset > half) offset -= total
  if (offset < -half) offset += total
  return offset
}

function updateHeroCarousel() {
  const cards = Array.from(document.querySelectorAll('.hero-carousel-card'))
  const total = cards.length
  if (!total) return
  cards.forEach((card, index) => {
    const offset = normalizeHeroCarouselOffset(index - heroCarouselIndex, total)
    const visibleOffset = Math.abs(offset) <= 2 ? String(offset) : 'hidden'
    card.setAttribute('data-offset', visibleOffset)
    card.setAttribute('aria-hidden', offset === 0 ? 'false' : 'true')
  })
}

function moveHeroCarousel(direction) {
  const total = document.querySelectorAll('.hero-carousel-card').length
  if (!total) return
  heroCarouselIndex = (heroCarouselIndex + direction + total) % total
  updateHeroCarousel()
}

function bindHeroCarouselSwipe() {
  const carousel = document.querySelector('.hero-3d-carousel')
  if (!carousel || carousel.dataset.swipeBound === '1') return
  carousel.dataset.swipeBound = '1'

  let startX = 0
  let startY = 0
  let lastX = 0
  let lastY = 0
  let active = false

  carousel.addEventListener('touchstart', (event) => {
    if (!isMobileHeroLayout()) return
    const touch = event.touches && event.touches[0]
    if (!touch) return
    startX = touch.clientX
    startY = touch.clientY
    lastX = startX
    lastY = startY
    active = true
  }, { passive: true })

  carousel.addEventListener('touchmove', (event) => {
    if (!active) return
    const touch = event.touches && event.touches[0]
    if (!touch) return
    lastX = touch.clientX
    lastY = touch.clientY
  }, { passive: true })

  carousel.addEventListener('touchend', (event) => {
    if (!active || !isMobileHeroLayout()) {
      active = false
      return
    }
    active = false
    const touch = event.changedTouches && event.changedTouches[0]
    if (touch) {
      lastX = touch.clientX
      lastY = touch.clientY
    }
    const dx = lastX - startX
    const dy = lastY - startY
    const threshold = Math.max(36, Math.min(58, carousel.clientWidth * 0.12))
    if (Math.abs(dx) < threshold || Math.abs(dx) <= Math.abs(dy) * 1.2) return

    event.preventDefault()
    heroCarouselSuppressClick = true
    moveHeroCarousel(dx < 0 ? 1 : -1)
    window.setTimeout(() => {
      heroCarouselSuppressClick = false
    }, 320)
  }, { passive: false })

  carousel.addEventListener('click', (event) => {
    if (!heroCarouselSuppressClick) return
    event.preventDefault()
    event.stopPropagation()
  }, true)
}

function stopHeroCarouselAutoPlay() {
  if (!heroCarouselTimer) return
  clearInterval(heroCarouselTimer)
  heroCarouselTimer = null
}

function startHeroCarouselAutoPlay(total) {
  stopHeroCarouselAutoPlay()
}

function renderHeroSettingCaption(b, mode) {
  const subtitle = String(b.subtitle || '').trim()
  const title = String(b.title || '').trim()
  if (!subtitle && !title) return ''
  const safeSubtitle = escapeHtml(subtitle)
  const safeTitle = escapeHtml(title)
  const pad = mode === 'mobile' ? 'px-3 pt-12 pb-3' : 'px-4 pt-16 pb-4'
  const subtitleCls = mode === 'mobile' ? 'text-[9px]' : 'text-[10px]'
  const titleCls = mode === 'mobile' ? 'text-xs' : 'text-sm'
  return \`<div class="absolute left-0 right-0 bottom-0 \${pad} pointer-events-none"
    style="background:linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.58) 48%, rgba(0,0,0,0) 100%);">
    \${title ? \`<p class="\${titleCls} font-extrabold text-white leading-tight overflow-hidden text-ellipsis whitespace-nowrap mb-1">\${safeTitle}</p>\` : ''}
    \${subtitle ? \`<p class="\${subtitleCls} text-white/85 font-bold leading-tight">\${safeSubtitle}</p>\` : ''}
  </div>\`
}

const DEFAULT_MARQUEE_NOTIFICATION_TEXT = 'Mua hàng tại đây không qua sàn thương mại nên giá thành sản phẩm sẽ rẻ hơn rất nhiều và bảo hành hoàn trả trong vòng 7 ngày nếu sản phẩm bị lỗi nên quý khách yên tâm mua sắm nhé.Bảo hành đổi trả nhắn qua trang facebook : QH Boypho. Chúc quý khách có trải nghiệm mua sắm tốt tại QH Boypho'
const DEFAULT_HOT_TREND_NU_MARQUEE_NOTIFICATION_TEXT = 'Mua trực tiếp giá tốt hơn | Không qua sàn | Đổi trả 7 ngày'

function getStorefrontMarqueeDefaultText() {
  return isHotTrendWomenContext() ? DEFAULT_HOT_TREND_NU_MARQUEE_NOTIFICATION_TEXT : DEFAULT_MARQUEE_NOTIFICATION_TEXT
}

function normalizeStorefrontMarqueeSpeed(value) {
  const n = Number(value || 48)
  if (!Number.isFinite(n)) return 48
  return Math.min(120, Math.max(8, Math.round(n)))
}

function normalizeHotTrendNuBrandText(text) {
  const value = String(text || '')
  const isHotTrendNuPage = isHotTrendWomenContext()
    || document.body?.classList?.contains('hottrendnu-page')
    || window.location.pathname.indexOf('/hottrendnu') === 0
  if (!isHotTrendNuPage) return value
  return value.replace(/QH\\s*Her/gi, 'QH Clothes')
}

function parseStorefrontMarqueeSegments(value) {
  const fallback = getStorefrontMarqueeDefaultText()
  const raw = normalizeHotTrendNuBrandText(value || fallback)
  const lineBreak = String.fromCharCode(10)
  const segments = raw
    .replaceAll(String.fromCharCode(13), lineBreak)
    .replaceAll('|', lineBreak)
    .split(lineBreak)
    .map(item => item.trim())
    .filter(Boolean)
  return segments.length ? segments.slice(0, 12) : [fallback]
}

function getStorefrontMarqueeIconClass(text) {
  const value = String(text || '').toLowerCase()
  const rules = [
    { keywords: ['tìm', 'search', 'chủ đề'], icon: 'fa-search' },
    { keywords: ['giao', 'ship', 'vận chuyển', 'freeship'], icon: 'fa-shipping-fast' },
    { keywords: ['zalo', 'facebook', 'messenger', 'nhắn', 'hỗ trợ'], icon: 'fa-comments' },
    { keywords: ['flash', 'sale', 'giảm', 'ưu đãi', 'khuyến mãi', 'giá'], icon: 'fa-tags' },
    { keywords: ['nghiên cứu', 'tool', 'thị trường'], icon: 'fa-chart-line' },
    { keywords: ['48h', 'giờ', 'thời gian'], icon: 'fa-clock' },
    { keywords: ['đổi', 'hoàn', 'trả', 'bảo hành'], icon: 'fa-undo' },
    { keywords: ['trực tiếp', 'cửa hàng', 'shop'], icon: 'fa-store' },
    { keywords: ['hot', 'trend'], icon: 'fa-bolt' }
  ]
  const matched = rules.find(rule => rule.keywords.some(keyword => value.includes(keyword)))
  return 'fas ' + (matched?.icon || 'fa-info-circle') + ' storefront-marquee-icon'
}

function ensureStorefrontMarqueeRuntimeStyle() {
  if (document.getElementById('storefrontMarqueeRuntimeStyle')) return
  const style = document.createElement('style')
  style.id = 'storefrontMarqueeRuntimeStyle'
  style.textContent = '.storefront-marquee-track{display:flex!important;align-items:center!important;gap:0!important;width:max-content!important;animation:storefrontMarqueeImmediate var(--storefront-marquee-duration,48s) linear infinite!important;animation-delay:0s!important;transform:translate3d(0,0,0);backface-visibility:hidden}.storefront-marquee-seq{display:flex!important;align-items:center!important;flex:0 0 auto!important;gap:0!important}.storefront-marquee-group{padding-left:.65rem!important;padding-right:.65rem!important}.storefront-marquee-separator{margin-left:.45rem!important}.storefront-marquee-bar:hover .storefront-marquee-track{animation-play-state:paused!important}@keyframes storefrontMarqueeImmediate{from{transform:translate3d(0,0,0)}to{transform:translate3d(-50%,0,0)}}'
  document.head.appendChild(style)
}

function bindStorefrontMarqueeHoverPause(bar, track) {
  if (!bar || !track || bar.dataset.marqueeHoverPauseBound === '1') return
  const pause = () => {
    track.style.setProperty('animation-play-state', 'paused', 'important')
  }
  const resume = () => {
    track.style.removeProperty('animation-play-state')
  }
  bar.addEventListener('pointerenter', pause)
  bar.addEventListener('mouseenter', pause)
  bar.addEventListener('pointerleave', resume)
  bar.addEventListener('mouseleave', resume)
  bar.dataset.marqueeHoverPauseBound = '1'
}

function appendStorefrontMarqueeGroup(container, segment) {
  const group = document.createElement('div')
  group.className = 'storefront-marquee-group'
  const icon = document.createElement('i')
  icon.className = getStorefrontMarqueeIconClass(segment)
  icon.setAttribute('aria-hidden', 'true')
  const span = document.createElement('span')
  span.className = 'storefront-marquee-text'
  span.textContent = segment
  const separator = document.createElement('span')
  separator.className = 'storefront-marquee-separator'
  separator.setAttribute('aria-hidden', 'true')
  group.appendChild(icon)
  group.appendChild(span)
  group.appendChild(separator)
  container.appendChild(group)
}

function getStorefrontMarqueeFillWidth(track) {
  const bar = track?.closest?.('.storefront-marquee-bar')
  const barWidth = Number(bar?.clientWidth || bar?.getBoundingClientRect?.().width || 0)
  const viewportWidth = Number(window.innerWidth || document.documentElement.clientWidth || 0)
  return Math.max(barWidth, viewportWidth, 720) + 160
}

function fillStorefrontMarqueeSequence(sequence, segments, minWidth) {
  let guard = 0
  while (sequence.scrollWidth < minWidth && guard < 80) {
    segments.forEach(segment => appendStorefrontMarqueeGroup(sequence, segment))
    guard += 1
  }
}

function resolveStorefrontMarqueeDuration(speedSeconds, sequence) {
  const speed = normalizeStorefrontMarqueeSpeed(speedSeconds)
  const sequenceWidth = Number(sequence?.scrollWidth || 0)
  const baselineWidth = 720
  const widthScale = sequenceWidth > baselineWidth ? sequenceWidth / baselineWidth : 1
  return Math.round(speed * widthScale)
}

function renderStorefrontMarquee(text, speedSeconds) {
  ensureStorefrontMarqueeRuntimeStyle()
  const track = document.querySelector('.storefront-marquee-track')
  if (!track) return
  const bar = track.closest('.storefront-marquee-bar')
  const segments = parseStorefrontMarqueeSegments(text)
  const speed = normalizeStorefrontMarqueeSpeed(speedSeconds)
  if (bar) bar.classList.remove('storefront-marquee-bar--static')
  bindStorefrontMarqueeHoverPause(bar, track)
  track.innerHTML = ''
  track.className = 'storefront-marquee-track'
  track.style.removeProperty('animation')
  track.style.removeProperty('transform')
  track.style.removeProperty('width')
  const sequence = document.createElement('div')
  sequence.className = 'storefront-marquee-seq'
  fillStorefrontMarqueeSequence(sequence, segments, getStorefrontMarqueeFillWidth(track))
  track.appendChild(sequence)
  const clone = sequence.cloneNode(true)
  clone.setAttribute('aria-hidden', 'true')
  track.appendChild(clone)
  track.style.setProperty('--storefront-marquee-duration', resolveStorefrontMarqueeDuration(speed, sequence) + 's')
}

function renderStorefrontStaticNotification(text) {
  const track = document.querySelector('.storefront-marquee-track')
  if (!track) return
  const bar = track.closest('.storefront-marquee-bar')
  const fallback = getStorefrontMarqueeDefaultText()
  const safeText = normalizeHotTrendNuBrandText(text || fallback).trim() || normalizeHotTrendNuBrandText(fallback)
  if (bar) bar.classList.add('storefront-marquee-bar--static')
  track.innerHTML = ''
  track.className = 'storefront-marquee-track storefront-marquee-track--static'
  track.style.animation = 'none'
  track.style.transform = 'none'
  track.style.width = '100%'
  const notice = document.createElement('div')
  notice.className = 'storefront-static-notice'
  const icon = document.createElement('i')
  icon.className = 'fas fa-bullhorn storefront-marquee-icon'
  icon.setAttribute('aria-hidden', 'true')
  const span = document.createElement('span')
  span.className = 'storefront-static-notice-text'
  span.textContent = safeText
  notice.appendChild(icon)
  notice.appendChild(span)
  track.appendChild(notice)
}

function renderStorefrontNotificationSettings(cfg) {
  const mode = String(cfg?.notification_display_mode || '').trim() === 'static' ? 'static' : 'marquee'
  const fallback = getStorefrontMarqueeDefaultText()
  if (mode === 'static') {
    renderStorefrontStaticNotification(cfg?.static_notification_text || cfg?.marquee_text || fallback)
    return
  }
  renderStorefrontMarquee(cfg?.marquee_text || fallback, cfg?.marquee_speed_seconds || 48)
}

function initStorefrontMarquee() {
  renderStorefrontMarquee(getStorefrontMarqueeDefaultText(), 48)
}

async function loadNotificationSettings() {
  try {
    const suffix = isHotTrendWomenContext() ? '?segment=hottrendnu' : ''
    const res = await axios.get('/api/public/notification-settings' + suffix)
    const cfg = (res.data && res.data.data) || {}
    renderStorefrontNotificationSettings(cfg)
  } catch (_) {
    renderStorefrontMarquee(getStorefrontMarqueeDefaultText(), 48)
  }
}

window.filterProductType = filterProductType
window.setHotTrendNuProductFilter = setHotTrendNuProductFilter
window.isHotTrendWomenContext = isHotTrendWomenContext

window.addEventListener('popstate', function (event) {
  const params = new URLSearchParams(window.location.search)
  const productId = params.get('product')
  if (productId) {
    if (!document.getElementById('detailOverlay') || document.getElementById('detailOverlay').classList.contains('hidden')) {
      showDetail(productId, { fromUrl: true })
    }
  } else {
    const overlay = document.getElementById('detailOverlay')
    if (overlay && !overlay.classList.contains('hidden')) {
      if (typeof closeDetail === 'function') closeDetail(true)
    }
  }
})

window.addEventListener('resize', () => {
  const mobileMode = isMobileHeroLayout()
  if (lastHeroMobileMode === null) {
    lastHeroMobileMode = mobileMode
    return
  }
  if (mobileMode !== lastHeroMobileMode) {
    renderCollapsedBanners(heroBannersData)
    lastHeroMobileMode = mobileMode
  }
  if (Array.isArray(filteredProducts) && filteredProducts.length && !document.getElementById('productsModalOverlay')?.classList.contains('hidden')) {
    renderProductsModal()
  } else if (Array.isArray(filteredProducts) && filteredProducts.length) {
    renderProducts(filteredProducts)
  }
})

window.addEventListener('scroll', () => {
  window.requestAnimationFrame(() => {
    maybeLoadMoreMobileProducts()
    updateMobileBottomNavOnScroll()
  })
}, { passive: true })

// Init
initStorefrontMarquee()
applyStorefrontTheme(loadStorefrontThemePreference())
initMobileBottomNavBehavior()
initMobileBottomNavActiveState()
initHeroTypedText()
bindAddressSearchableDropdowns()
loadNotificationSettings()
loadSettings()
loadFooterSocialLinks()
loadCart()
loadProducts()
checkUserAuth()
handleAuthReturnFlow()
handlePaymentReturnFlow()
ensureAddressKitReady().catch(() => {
  showToast('Không tải được danh mục tỉnh/phường. Bạn có thể thử lại sau.', 'error', 4500)
})

window.addEventListener('message', function (event) {
  if (event.origin !== window.location.origin) return
  const data = event.data || {}
  if ((data.type === 'payment_paid' || data.type === 'payos_paid') && data.orderCode) {
    onOrderMarkedPaid(String(data.orderCode))
  }
})

// ── USER AUTH & MENU ──────────────────────────────
async function checkUserAuth() {
  try {
    const res = await axios.get('/api/auth/me')
    currentUser = res.data.data
    if (currentUser) {
      currentUser.is_blocked = isBlockedFlag(currentUser.is_blocked) ? 1 : 0
      currentUser.blocked_reason = String(currentUser.blocked_reason || '')
    }
    loadFavoriteProductsForCurrentUser()
    isAdminUser = !!res.data.isAdmin
    syncCartScope()
    ensureAddressKitReady()
      .then(() => {
        applySavedAddressToScope('order')
          .catch(() => { })
      })
      .catch(() => { })
    updateUserUI()
    refreshStorefrontPurchaseControls()
    loadSettings()
  } catch {
    currentUser = null
    loadFavoriteProductsForCurrentUser()
    isAdminUser = false
    syncCartScope()
    ensureAddressKitReady()
      .then(() => {
        applySavedAddressToScope('order')
          .catch(() => { })
      })
      .catch(() => { })
    updateUserUI()
    refreshStorefrontPurchaseControls()
    loadSettings()
  }
}

function fmtBalance(v) { return new Intl.NumberFormat('vi-VN').format(v||0) + 'đ' }

function renderWalletTopupDisabledNotice() {
  return '<div class="text-center py-8 text-gray-400"><i class="fas fa-wallet text-3xl mb-3"></i><p class="font-semibold text-gray-600">Chức năng nạp tiền vào ví đang tắt</p><p class="text-sm mt-1">Shop sẽ mở lại khi cần hỗ trợ thanh toán bằng ví.</p></div>'
}

function syncWalletTopupDisabledView() {
  if (walletTopupEnabled || activeUserMenuView !== 'wallet') return
  const content = document.getElementById('userMenuContent')
  if (content) content.innerHTML = renderWalletTopupDisabledNotice()
}

function updateUserUI() {
  const defaultAvatar = document.getElementById('userAvatarDefault')
  const imgAvatar = document.getElementById('userAvatarImg')
  const guestSection = document.getElementById('userMenuGuest')
  const loggedInSection = document.getElementById('userMenuLoggedIn')
  const logoutArea = document.getElementById('userMenuLogoutArea')
  const walletNav = document.getElementById('walletNavBtn')
  const adminLink = document.getElementById('adminNavLink')
  const userOrdersBtn = document.getElementById('userOrdersBtn')
  const userFavoritesBtn = document.getElementById('userFavoritesBtn')
  const userWalletBtn = document.getElementById('userWalletBtn')
  const authedNav = document.getElementById('userMenuAuthedNav')
  const clearAuthFormContent = () => {
    const content = document.getElementById('userMenuContent')
    if (content && content.querySelector('#userAuthShell')) content.innerHTML = ''
  }
  // Admin icon
  if (isAdminUser) { adminLink.classList.remove('hidden') } else { adminLink.classList.add('hidden') }
  if (currentUser && isAdminUser) {
    clearAuthFormContent()
    defaultAvatar.classList.remove('hidden')
    imgAvatar.classList.add('hidden')
    defaultAvatar.innerHTML = isHotTrendWomenContext() ? '<i class="far fa-user" aria-hidden="true"></i>' : '<i class="fas fa-user text-sm"></i>'
    defaultAvatar.style.background = ''
    guestSection.classList.add('hidden')
    loggedInSection.classList.remove('hidden')
    logoutArea.classList.remove('hidden')
    document.getElementById('userMenuAvatarSlot').innerHTML = renderAdminAvatarHtml('w-12 h-12', 'border-2 border-pink-400')
    document.getElementById('userMenuName').textContent = 'Admin'
    document.getElementById('userMenuEmail').textContent = 'Quyền quản trị'
    walletNav.classList.add('hidden')
    walletNav.classList.remove('flex')
    if (authedNav) authedNav.classList.remove('hidden')
    if (userOrdersBtn) userOrdersBtn.classList.add('hidden')
    if (userFavoritesBtn) userFavoritesBtn.classList.add('hidden')
    if (userWalletBtn) {
      userWalletBtn.classList.add('hidden')
      userWalletBtn.classList.remove('flex')
    }
  } else if (currentUser) {
    clearAuthFormContent()
    if (currentUser.avatar) {
      defaultAvatar.classList.add('hidden')
      imgAvatar.src = currentUser.avatar
      imgAvatar.classList.remove('hidden')
    } else {
      defaultAvatar.classList.remove('hidden')
      imgAvatar.classList.add('hidden')
      if (isHotTrendWomenContext()) {
        defaultAvatar.innerHTML = '<i class="far fa-user" aria-hidden="true"></i>'
        defaultAvatar.style.background = ''
      } else {
        defaultAvatar.innerHTML = escapeHtml(getUserAvatarInitial(currentUser))
        defaultAvatar.style.background = getUserAvatarStyle(currentUser)
      }
    }
    guestSection.classList.add('hidden')
    loggedInSection.classList.remove('hidden')
    logoutArea.classList.remove('hidden')
    document.getElementById('userMenuAvatarSlot').innerHTML = renderUserAvatarHtml(currentUser, 'w-12 h-12', 'text-xl', 'border-2 border-pink-400')
    document.getElementById('userMenuName').textContent = getUserDisplayName(currentUser)
    document.getElementById('userMenuEmail').textContent = getUserDisplayLine(currentUser)
    const bal = fmtBalance(currentUser.balance)
    if (walletTopupEnabled) {
      walletNav.classList.remove('hidden')
      walletNav.classList.add('flex')
      document.getElementById('walletBalanceNav').textContent = bal
      document.getElementById('walletBalanceMenu').textContent = bal
    } else {
      walletNav.classList.add('hidden')
      walletNav.classList.remove('flex')
      syncWalletTopupDisabledView()
    }
    if (authedNav) authedNav.classList.remove('hidden')
    if (userOrdersBtn) userOrdersBtn.classList.remove('hidden')
    if (userFavoritesBtn) userFavoritesBtn.classList.remove('hidden')
    if (walletTopupEnabled) {
      if (userWalletBtn) {
        userWalletBtn.classList.remove('hidden')
        userWalletBtn.classList.add('flex')
      }
    } else if (userWalletBtn) {
      userWalletBtn.classList.add('hidden')
      userWalletBtn.classList.remove('flex')
    }
  } else {
    defaultAvatar.classList.remove('hidden')
    imgAvatar.classList.add('hidden')
    defaultAvatar.innerHTML = isHotTrendWomenContext() ? '<i class="far fa-user" aria-hidden="true"></i>' : '<i class="fas fa-user text-sm"></i>'
    defaultAvatar.style.background = ''
    guestSection.classList.remove('hidden')
    loggedInSection.classList.add('hidden')
    logoutArea.classList.add('hidden')
    walletNav.classList.add('hidden')
    walletNav.classList.remove('flex')
    if (authedNav) authedNav.classList.add('hidden')
    if (userOrdersBtn) userOrdersBtn.classList.add('hidden')
    if (userFavoritesBtn) userFavoritesBtn.classList.add('hidden')
    if (userWalletBtn) {
      userWalletBtn.classList.add('hidden')
      userWalletBtn.classList.remove('flex')
    }
  }
}

function toggleUserMenu() {
  const overlay = document.getElementById('userMenuOverlay')
  if (overlay.classList.contains('hidden')) { openUserMenu() } else { closeUserMenu() }
}
function openUserMenu() {
  const overlay = document.getElementById('userMenuOverlay')
  const panel = document.getElementById('userMenuPanel')
  activeUserMenuView = ''
  panel.classList.remove('closing')
  overlay.classList.remove('hidden')
  lockStorefrontPageScroll('userMenuOverlay')
  if (currentUser) document.getElementById('userMenuContent').innerHTML = ''
  else renderUserAuthForm('login')
}
function closeUserMenu() {
  const overlay = document.getElementById('userMenuOverlay')
  const panel = document.getElementById('userMenuPanel')
  panel.classList.add('closing')
  setTimeout(() => { overlay.classList.add('hidden'); panel.classList.remove('closing'); closeShippingJourneyModal(); unlockStorefrontPageScroll('userMenuOverlay') }, 300)
}
function handleUserMenuOverlayClick(e) { if (e.target.id === 'userMenuOverlay') closeUserMenu() }

function getStorefrontAuthReturnPath() {
  return window.location.pathname + window.location.search + window.location.hash
}

function loginWithGoogle() {
  window.location.href = '/api/auth/google?return_to=' + encodeURIComponent(getStorefrontAuthReturnPath())
}

function getUserDisplayName(user) {
  if (!user) return ''
  return String(user.name || user.username || '').trim() || String(user.email || '').split('@')[0] || 'Tài khoản'
}

function getUserDisplayLine(user) {
  if (!user) return ''
  const username = String(user.username || '').trim()
  if (username) return '@' + username
  return String(user.email || '').trim()
}

function getUserAvatarInitial(user) {
  const label = getUserDisplayName(user)
  const chars = Array.from(String(label || '').trim())
  return (chars[0] || 'U').toUpperCase()
}

function getUserAvatarStyle(user) {
  const key = String(user?.username || user?.name || user?.email || 'user')
  const palettes = [
    'linear-gradient(135deg,#f43f5e,#fb7185)',
    'linear-gradient(135deg,#8b5cf6,#c084fc)',
    'linear-gradient(135deg,#06b6d4,#22d3ee)',
    'linear-gradient(135deg,#10b981,#34d399)',
    'linear-gradient(135deg,#f59e0b,#fbbf24)',
    'linear-gradient(135deg,#6366f1,#818cf8)',
    'linear-gradient(135deg,#ec4899,#f472b6)'
  ]
  let hash = 0
  for (let i = 0; i < key.length; i++) hash = ((hash << 5) - hash + key.charCodeAt(i)) | 0
  return palettes[Math.abs(hash) % palettes.length]
}

function renderAdminAvatarHtml(sizeClass, borderClass) {
  return '<img src="/qh-logo.png" class="' + sizeClass + ' rounded-full object-cover ' + borderClass + '" alt="">'
}

function renderUserAvatarHtml(user, sizeClass, textClass, borderClass) {
  if (user?.avatar) {
    return '<img src="' + escapeHtml(user.avatar) + '" class="' + sizeClass + ' rounded-full object-cover ' + borderClass + '" alt="">'
  }
  return '<div class="' + sizeClass + ' rounded-full flex items-center justify-center text-white font-bold ' + textClass + ' ' + borderClass + ' shadow-sm" style="background:' + getUserAvatarStyle(user) + '">' + escapeHtml(getUserAvatarInitial(user)) + '</div>'
}

function loadTurnstileScript() {
  if (window.turnstile) return Promise.resolve()
  if (turnstileScriptPromise) return turnstileScriptPromise
  turnstileScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-turnstile-script="1"]')
    if (existing) {
      existing.addEventListener('load', resolve, { once: true })
      existing.addEventListener('error', reject, { once: true })
      return
    }
    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    script.async = true
    script.defer = true
    script.dataset.turnstileScript = '1'
    script.onload = resolve
    script.onerror = reject
    document.head.appendChild(script)
  })
  return turnstileScriptPromise
}

function loadTurnstilePublicConfig() {
  if (turnstilePublicConfigPromise) return turnstilePublicConfigPromise
  turnstilePublicConfigPromise = axios.get('/api/auth/turnstile-config')
    .then((res) => {
      const data = res.data?.data || {}
      userAuthTurnstileEnabled = data.enabled === true && !!data.site_key
      userAuthTurnstileSiteKey = userAuthTurnstileEnabled ? String(data.site_key || '') : ''
      return data
    })
    .catch(() => {
      userAuthTurnstileEnabled = false
      userAuthTurnstileSiteKey = ''
      return { enabled: false, site_key: '' }
    })
  return turnstilePublicConfigPromise
}

async function renderUserAuthTurnstile() {
  await loadTurnstilePublicConfig()
  const wrap = document.getElementById('userAuthTurnstileWrap')
  let widget = document.getElementById('userAuthTurnstileWidget')
  if (!wrap || !widget || !userAuthTurnstileEnabled || !userAuthTurnstileSiteKey) {
    if (wrap) wrap.classList.add('hidden')
    return
  }
  if (isUserAuthTurnstileLocalDev()) {
    wrap.classList.add('hidden')
    return
  }
  wrap.classList.remove('hidden')
  await loadTurnstileScript()
  if (!window.turnstile || userAuthTurnstileWidgetId !== null) return
  await new Promise((resolve) => requestAnimationFrame(resolve))
  widget = document.getElementById('userAuthTurnstileWidget')
  if (!widget || !widget.isConnected) return
  widget.innerHTML = ''
  try {
    userAuthTurnstileWidgetId = window.turnstile.render(widget, {
      sitekey: userAuthTurnstileSiteKey,
      theme: document.body.dataset.storefrontTheme === 'dark' ? 'dark' : 'light',
      action: 'storefront_auth',
      callback: (token) => { userAuthTurnstileToken = token || '' },
      'expired-callback': () => { userAuthTurnstileToken = '' },
      'error-callback': () => { userAuthTurnstileToken = '' }
    })
  } catch (_) {
    userAuthTurnstileWidgetId = null
    wrap.classList.add('hidden')
    return
  }
}

function getUserAuthTurnstileToken() {
  return userAuthTurnstileEnabled ? userAuthTurnstileToken : ''
}

function isUserAuthTurnstileLocalDev() {
  return userAuthTurnstileSiteKey === TURNSTILE_LOCAL_TEST_SITE_KEY
}

function resetUserAuthTurnstile() {
  userAuthTurnstileToken = ''
  if (window.turnstile && userAuthTurnstileWidgetId !== null) {
    try { window.turnstile.reset(userAuthTurnstileWidgetId) } catch (_) {}
  }
}

function renderUserAuthForm(mode = 'login') {
  const content = document.getElementById('userMenuContent')
  if (!content || currentUser) return
  const isRegister = mode === 'register'
  userAuthTurnstileToken = ''
  userAuthTurnstileWidgetId = null
  const submitFn = isRegister ? 'submitUserRegister(event)' : 'submitUserLogin(event)'
  const title = isRegister ? 'Tạo tài khoản nhanh' : 'Đăng nhập tài khoản'
  const action = isRegister ? 'Đăng ký' : 'Đăng nhập'
  const switchText = isRegister ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'
  const switchLabel = isRegister ? 'Đăng nhập' : 'Đăng ký nhanh'
  const switchMode = isRegister ? 'login' : 'register'
  const phoneField = isRegister
    ? '<label class="block text-sm font-semibold text-gray-700 mb-1.5" for="authPhone">Số điện thoại <span class="text-gray-400 font-normal">(tuỳ chọn)</span></label>'
      + '<input id="authPhone" type="tel" autocomplete="tel" inputmode="tel" maxlength="20" placeholder="VD: 09xxxxxxxx" class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition">'
    : ''
  content.innerHTML = '<div id="userAuthShell" class="space-y-4">'
    + '<div class="flex items-center gap-3 text-gray-400 text-sm font-semibold"><span class="h-px flex-1 bg-gray-200"></span><span>Hoặc dùng tài khoản riêng</span><span class="h-px flex-1 bg-gray-200"></span></div>'
    + '<form class="space-y-3" onsubmit="' + submitFn + '">'
    + '<h3 class="font-display text-xl font-bold text-gray-900">' + title + '</h3>'
    + '<div><label class="block text-sm font-semibold text-gray-700 mb-1.5" for="authUsername">Username</label>'
    + '<input id="authUsername" type="text" autocomplete="username" autocapitalize="none" spellcheck="false" maxlength="32" placeholder="username" class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition"></div>'
    + '<div><div class="flex items-center justify-between mb-1.5"><label class="block text-sm font-semibold text-gray-700" for="authPassword">Mật khẩu</label></div>'
    + '<div class="relative"><input id="authPassword" type="password" autocomplete="' + (isRegister ? 'new-password' : 'current-password') + '" maxlength="64" placeholder="Tối thiểu 6 ký tự" class="w-full border border-gray-200 rounded-xl px-4 py-3 pr-11 text-sm outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition">'
    + '<button type="button" onclick="toggleAuthPasswordVisibility()" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-pink-500" aria-label="Ẩn hiện mật khẩu"><i id="authPasswordEye" class="fas fa-eye"></i></button></div></div>'
    + (phoneField ? '<div>' + phoneField + '</div>' : '')
    + '<div id="userAuthTurnstileWrap" class="hidden flex justify-center min-h-[65px]"><div id="userAuthTurnstileWidget"></div></div>'
    + '<p id="userAuthError" class="hidden text-sm font-semibold text-red-500"></p>'
    + '<button id="userAuthSubmitBtn" type="submit" class="w-full btn-primary text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"><i class="fas fa-shield-alt"></i>' + action + '</button>'
    + '</form>'
    + '<div class="w-full text-center text-sm font-semibold"><span class="text-gray-500">' + switchText + '</span> <button type="button" onclick="renderUserAuthForm(\\'' + switchMode + '\\')" class="text-pink-500 hover:text-pink-600 transition">' + switchLabel + '</button></div>'
    + '</div>'
  setTimeout(() => { renderUserAuthTurnstile() }, 0)
}

function setUserAuthError(message) {
  const el = document.getElementById('userAuthError')
  if (!el) return
  el.textContent = message || ''
  el.classList.toggle('hidden', !message)
}

function setUserAuthBusy(isBusy) {
  const btn = document.getElementById('userAuthSubmitBtn')
  if (!btn) return
  btn.disabled = !!isBusy
  btn.classList.toggle('opacity-60', !!isBusy)
  btn.classList.toggle('cursor-not-allowed', !!isBusy)
}

function getUserAuthPayload(includePhone) {
  const username = String(document.getElementById('authUsername')?.value || '').trim().toLowerCase()
  const password = String(document.getElementById('authPassword')?.value || '')
  const phone = String(document.getElementById('authPhone')?.value || '').trim()
  if (!/^[a-z0-9._-]{3,32}$/.test(username)) {
    setUserAuthError('Username chỉ dùng chữ thường, số, dấu chấm, gạch dưới hoặc gạch ngang, từ 3-32 ký tự.')
    return null
  }
  if (password.length < 6 || password.length > 64) {
    setUserAuthError('Mật khẩu cần từ 6 đến 64 ký tự.')
    return null
  }
  if (includePhone && phone && !/^\\+?[0-9 .()-]{7,20}$/.test(phone)) {
    setUserAuthError('Số điện thoại không hợp lệ.')
    return null
  }
  if (userAuthTurnstileEnabled && !getUserAuthTurnstileToken() && !isUserAuthTurnstileLocalDev()) {
    setUserAuthError('Vui lòng xác minh bảo mật trước khi tiếp tục.')
    return null
  }
  setUserAuthError('')
  return includePhone
    ? { username, password, phone, turnstile_token: getUserAuthTurnstileToken() }
    : { username, password, turnstile_token: getUserAuthTurnstileToken() }
}

function applyAuthenticatedUser(user) {
  currentUser = user
  isAdminUser = false
  loadFavoriteProductsForCurrentUser()
  syncCartScope(true)
  updateUserUI()
  document.getElementById('userMenuContent').innerHTML = ''
  refreshFavoriteProductViews()
}

async function submitUserLogin(event) {
  event.preventDefault()
  await renderUserAuthTurnstile()
  const payload = getUserAuthPayload(false)
  if (!payload) return
  setUserAuthBusy(true)
  try {
    const res = await axios.post('/api/auth/login', payload)
    applyAuthenticatedUser(res.data.data)
    showToast('Đăng nhập thành công', 'success', 2500)
  } catch (err) {
    const code = err.response?.data?.error
    setUserAuthError(code === 'TURNSTILE_REQUIRED' || code === 'TURNSTILE_INVALID'
      ? 'Xác minh bảo mật không hợp lệ, vui lòng thử lại.'
      : 'Sai username hoặc mật khẩu.')
    resetUserAuthTurnstile()
  } finally {
    setUserAuthBusy(false)
  }
}

async function submitUserRegister(event) {
  event.preventDefault()
  await renderUserAuthTurnstile()
  const payload = getUserAuthPayload(true)
  if (!payload) return
  setUserAuthBusy(true)
  try {
    const res = await axios.post('/api/auth/register', payload)
    applyAuthenticatedUser(res.data.data)
    showToast('Đăng ký tài khoản thành công', 'success', 2500)
  } catch (err) {
    const code = err.response?.data?.error
    const reason = err.response?.data?.reason
    if (code === 'USERNAME_TAKEN') setUserAuthError('Username này đã được dùng.')
    else if (code === 'PASSWORD_LENGTH_INVALID') setUserAuthError('Mật khẩu cần từ 6 đến 64 ký tự.')
    else if (code === 'INVALID_PHONE') setUserAuthError('Số điện thoại không hợp lệ.')
    else if (code === 'BOM_HANG_BLOCKED') {
      setUserAuthError('')
      showBlockedCustomerModal(reason || 'Bạn không thể tạo tài khoản do bom hàng nhiều lần, liên hệ shop để được hỗ trợ nhanh.')
    }
    else if (code === 'ACCOUNT_LIMIT_REACHED') setUserAuthError(reason || 'Bạn chỉ có thể tạo tối đa 3 tài khoản. Liên hệ shop nếu cần hỗ trợ.')
    else if (code === 'TURNSTILE_REQUIRED' || code === 'TURNSTILE_INVALID') setUserAuthError('Xác minh bảo mật không hợp lệ, vui lòng thử lại.')
    else setUserAuthError('Không thể đăng ký. Vui lòng thử lại.')
    resetUserAuthTurnstile()
  } finally {
    setUserAuthBusy(false)
  }
}

function toggleAuthPasswordVisibility() {
  const input = document.getElementById('authPassword')
  const icon = document.getElementById('authPasswordEye')
  if (!input) return
  const nextType = input.type === 'password' ? 'text' : 'password'
  input.type = nextType
  if (icon) icon.className = nextType === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash'
}

async function logoutUser() {
  try { await axios.post('/api/auth/logout') } catch {}
  currentUser = null
  isAdminUser = false
  loadFavoriteProductsForCurrentUser()
  syncCartScope(true)
  updateUserUI()
  refreshFavoriteProductViews()
  closeUserMenu()
  showToast('Đã đăng xuất thành công', 'success')
}

function showUserAccount() {
  const content = document.getElementById('userMenuContent')
  activeUserMenuView = 'account'
  if (!currentUser) {
    content.innerHTML = '<div class="text-center py-8 text-gray-400"><i class="fas fa-lock text-3xl mb-3"></i><p>Vui lòng đăng nhập để xem thông tin</p></div>'
    return
  }
  if (isAdminUser) {
    content.innerHTML = '<div class="bg-white rounded-2xl border p-4 space-y-3">'
      + '<h3 class="font-semibold text-gray-800 mb-3"><i class="fas fa-user-shield text-pink-400 mr-2"></i>Thông tin quản trị</h3>'
      + '<div class="flex items-center gap-4">' + renderAdminAvatarHtml('w-16 h-16', 'border-2 border-pink-200') + '<div>'
      + '<p class="font-bold text-gray-900">Admin</p>'
      + '<p class="text-sm text-gray-500">Quyền quản trị</p>'
      + '<a href="/admin/dashboard" class="inline-flex items-center gap-2 mt-3 text-sm font-semibold text-pink-500 hover:text-pink-600">Vào trang quản trị <i class="fas fa-arrow-right text-xs"></i></a>'
      + '</div></div></div>'
    return
  }
  content.innerHTML = '<div class="bg-white rounded-2xl border p-4 space-y-3">'
    + '<h3 class="font-semibold text-gray-800 mb-3"><i class="fas fa-user-circle text-pink-400 mr-2"></i>Thông tin tài khoản</h3>'
    + '<div class="flex items-center gap-4">' + renderUserAvatarHtml(currentUser, 'w-16 h-16', 'text-2xl', 'border-2 border-pink-200') + '<div>'
    + '<p class="font-bold text-gray-900">' + escapeHtml(getUserDisplayName(currentUser)) + '</p>'
    + '<p class="text-sm text-gray-500">' + escapeHtml(getUserDisplayLine(currentUser)) + '</p>'
    + (currentUser.phone ? '<p class="text-sm text-gray-500"><i class="fas fa-phone text-pink-300 mr-1"></i>' + escapeHtml(currentUser.phone) + '</p>' : '')
    + '</div></div></div>'
}

function getFavoriteProductsForMenu() {
  if (!Array.isArray(favoriteProductIds) || !favoriteProductIds.length || !Array.isArray(allProducts)) return []
  const byId = new Map(allProducts.map((product) => [Number(product?.id || 0), product]))
  return favoriteProductIds
    .map((id) => byId.get(Number(id || 0)) || null)
    .filter(Boolean)
}

function showUserFavorites() {
  const content = document.getElementById('userMenuContent')
  activeUserMenuView = 'favorites'
  if (!currentUser) {
    content.innerHTML = '<div class="text-center py-8 text-gray-400"><i class="fas fa-lock text-3xl mb-3"></i><p>Vui lòng đăng nhập để xem sản phẩm yêu thích</p></div>'
    return
  }
  if (isAdminUser) {
    content.innerHTML = '<div class="text-center py-8 text-gray-400"><i class="fas fa-user-shield text-3xl mb-3"></i><p>Tài khoản quản trị không dùng danh sách yêu thích</p></div>'
    return
  }
  const products = getFavoriteProductsForMenu()
  if (!products.length) {
    content.innerHTML = '<div class="text-center py-8 text-gray-400"><i class="fas fa-heart text-4xl mb-3 text-pink-300"></i><p>Chưa có sản phẩm yêu thích nào</p></div>'
    return
  }
  content.innerHTML = '<h3 class="font-semibold text-gray-800 mb-3"><i class="fas fa-heart text-pink-400 mr-2"></i>Sản phẩm yêu thích</h3>'
    + '<div class="favorites-products-grid space-y-3">' + products.map((product) => renderStorefrontProductCard(product, { hideFlashSaleMiniStrip: true })).join('') + '</div>'
  startFlashSaleCountdownTicker()
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function escapeJsString(value) {
  return JSON.stringify(String(value || ''))
    .slice(1, -1)
    .replace(/'/g, "\\\\'")
    .replace(/</g, '\\\\x3C')
}

function getOrderHistoryImage(order) {
  const selectedImage = String(order?.selected_color_image || '').trim()
  const fallbackImage = String(order?.product_thumbnail || '').trim()
  return selectedImage || fallbackImage || ''
}

function getOrderHistoryLifecycle(order) {
  const paymentStatus = String(order?.payment_status || '').toLowerCase()
  const paymentMethod = String(order?.payment_method || '').toUpperCase()
  const orderStatus = String(order?.status || '').toLowerCase()
  const shippingArranged = Number(order?.shipping_arranged || 0) === 1
  const trackingCode = String(order?.shipping_tracking_code || '').trim()
  const hasTracking = !!trackingCode

  if (orderStatus === 'cancelled') {
    return { key: 'cancelled', label: 'Đã huỷ', icon: 'fa-ban', toneClass: 'order-status-chip--cancelled', clickable: false, hasJourney: false }
  }
  if (orderStatus === 'done') {
    return { key: 'done', label: 'Đã nhận', icon: 'fa-circle-check', toneClass: 'order-status-chip--done', clickable: true, hasJourney: true }
  }
  if (orderStatus === 'shipping') {
    return { key: 'shipping', label: 'Đang giao', icon: 'fa-shipping-fast', toneClass: 'order-status-chip--shipping', clickable: true, hasJourney: true }
  }
  if (shippingArranged || hasTracking) {
    return { key: 'waiting_pickup', label: 'Đang chờ lấy hàng', icon: 'fa-truck-ramp-box', toneClass: 'order-status-chip--waiting-pickup', clickable: true, hasJourney: true }
  }
  if (paymentStatus !== 'paid' && paymentMethod !== 'COD') {
    return { key: 'waiting_payment', label: 'Đang chờ thanh toán', icon: 'fa-clock', toneClass: 'order-status-chip--waiting-payment', clickable: false, hasJourney: false }
  }
  return { key: 'waiting_shop', label: 'Đang chờ shop duyệt', icon: 'fa-bolt', toneClass: 'order-status-chip--waiting-shop', clickable: false, hasJourney: false }
}

function renderShippingJourneyModal(order) {
  const content = document.getElementById('shippingJourneyContent')
  if (!content) return
  const lifecycle = getOrderHistoryLifecycle(order)
  const trackingCode = String(order?.shipping_tracking_code || '').trim()
  const stepKeyOrder = ['waiting_shop', 'waiting_pickup', 'shipping', 'done']
  const activeIndexMap = { waiting_shop: 0, waiting_pickup: 1, shipping: 2, done: 3, cancelled: -2, waiting_payment: -1 }
  const activeIndex = activeIndexMap[lifecycle.key] ?? 0
  const stepLabels = {
    waiting_shop: 'Shop duyệt đơn',
    waiting_pickup: 'Đang chờ lấy hàng',
    shipping: 'Đang giao',
    done: 'Đã nhận'
  }
  const journeyNote = lifecycle.key === 'waiting_shop'
    ? 'Đơn đang chờ shop duyệt.'
    : lifecycle.key === 'waiting_payment'
      ? 'Đơn chưa hoàn tất thanh toán.'
      : lifecycle.key === 'cancelled'
        ? 'Đơn đã bị hủy.'
        : lifecycle.key === 'done'
          ? 'Đơn đã được giao thành công.'
          : 'Đơn đã được đẩy sang đơn vị vận chuyển.'

  const stepsHtml = stepKeyOrder.map(function (key, idx) {
    const isComplete = activeIndex >= idx
    const isActive = activeIndex === idx
    const stateClass = isActive ? 'is-active' : isComplete ? 'is-complete' : ''
    return '<div class="shipping-journey-step ' + stateClass + ' pb-4">'
      + '<div class="flex items-start gap-3">'
      + '<div class="pt-0.5"><div class="w-5 h-5 rounded-full border-2 ' + (isComplete ? 'border-green-500 bg-green-500' : 'border-gray-300 bg-white') + '"></div></div>'
      + '<div class="min-w-0 flex-1">'
      + '<p class="font-semibold text-gray-800">' + escapeHtml(stepLabels[key]) + '</p>'
      + '<p class="text-xs text-gray-500 mt-0.5">' + (isActive ? 'Trạng thái hiện tại' : isComplete ? 'Đã hoàn thành' : 'Đang chờ') + '</p>'
      + '</div>'
      + '</div>'
      + '</div>'
  }).join('')

  const trackingHtml = trackingCode
    ? '<div class="mt-4 rounded-2xl border bg-gray-50 p-4">'
      + '<p class="text-xs font-semibold text-gray-500 mb-1">Mã vận đơn</p>'
      + '<div class="flex items-center justify-between gap-2">'
      + '<span class="font-mono font-bold text-blue-600 text-sm break-all">' + escapeHtml(trackingCode) + '</span>'
      + '<button type="button" class="text-xs font-semibold text-gray-600 hover:text-gray-800" data-code="' + escapeHtml(trackingCode) + '" onclick="copyBankValue(this.dataset.code)">Copy</button>'
      + '</div>'
      + '</div>'
    : ''

  content.innerHTML = ''
    + '<div class="rounded-2xl border p-4">'
    + '<div class="flex items-center justify-between gap-3 mb-3">'
    + '<div>'
    + '<p class="text-xs text-gray-500">Đơn hàng</p>'
    + '<p class="font-mono text-sm font-bold text-blue-600">' + escapeHtml(String(order?.order_code || '')) + '</p>'
    + '</div>'
    + '<span class="order-status-chip ' + lifecycle.toneClass + '"><i class="fas ' + lifecycle.icon + '"></i>' + escapeHtml(lifecycle.label) + '</span>'
    + '</div>'
    + '<p class="text-sm text-gray-600">' + escapeHtml(journeyNote) + '</p>'
    + trackingHtml
    + '</div>'
    + '<div class="mt-4">' + stepsHtml + '</div>'
}

function openShippingJourneyModal(orderId) {
  const order = Array.isArray(userOrderHistoryCache)
    ? userOrderHistoryCache.find(function (item) { return Number(item.id) === Number(orderId) })
    : null
  if (!order) return
  const lifecycle = getOrderHistoryLifecycle(order)
  if (!lifecycle.hasJourney) return
  const overlay = document.getElementById('shippingJourneyOverlay')
  if (!overlay) return
  renderShippingJourneyModal(order)
  overlay.classList.remove('hidden')
  overlay.classList.add('flex')
  lockStorefrontPageScroll('shippingJourneyOverlay')
}

function closeShippingJourneyModal() {
  const overlay = document.getElementById('shippingJourneyOverlay')
  if (!overlay) return
  overlay.classList.add('hidden')
  overlay.classList.remove('flex')
  unlockStorefrontPageScroll('shippingJourneyOverlay')
}

function handleShippingJourneyOverlayClick(e) {
  if (e.target && e.target.id === 'shippingJourneyOverlay') closeShippingJourneyModal()
}

async function showUserOrders() {
  const content = document.getElementById('userMenuContent')
  activeUserMenuView = 'orders'
  if (!currentUser) {
    content.innerHTML = '<div class="text-center py-8 text-gray-400"><i class="fas fa-lock text-3xl mb-3"></i><p>Vui lòng đăng nhập để xem lịch sử</p></div>'
    return
  }
  if (isAdminUser) {
    content.innerHTML = '<div class="text-center py-8 text-gray-400"><i class="fas fa-user-shield text-3xl mb-3"></i><p>Tài khoản quản trị không có lịch sử mua hàng</p></div>'
    return
  }
  content.innerHTML = '<div class="text-center py-8"><i class="fas fa-spinner fa-spin text-2xl text-pink-400"></i></div>'
  try {
    const escapeHtml = function (value) {
      return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
    }
    const getOrderHistoryImage = function (o) {
      const selectedImage = String(o.selected_color_image || '').trim()
      const fallbackImage = String(o.product_thumbnail || '').trim()
      return selectedImage || fallbackImage || ''
    }
    const res = await axios.get('/api/user/orders')
    let orders = res.data.data || []
    const unpaidGatewayOrders = orders.filter(function (o) {
      const method = String(o.payment_method || '').toUpperCase()
      const unpaid = String(o.payment_status || '').toLowerCase() !== 'paid'
      return unpaid && method === 'BANK_TRANSFER'
    }).slice(0, 6)
    if (unpaidGatewayOrders.length) {
      await Promise.all(unpaidGatewayOrders.map(function (o) {
        const method = String(o.payment_method || '').toUpperCase()
        return axios.post('/api/orders/' + o.id + '/payos-sync').catch(function () { return null })
      }))
      const refreshed = await axios.get('/api/user/orders')
      orders = refreshed.data.data || orders
    }
    userOrderHistoryCache = Array.isArray(orders) ? orders : []
    if (!orders.length) {
      content.innerHTML = '<div class="text-center py-8 text-gray-400"><i class="fas fa-shopping-bag text-4xl mb-3"></i><p>Chưa có đơn hàng nào</p></div>'
      return
    }
    content.innerHTML = '<h3 class="font-semibold text-gray-800 mb-3"><i class="fas fa-clipboard-list text-pink-400 mr-2"></i>Lịch sử mua hàng</h3>'
      + '<div class="space-y-2">' + orders.map(function(o) {
        const paymentPaid = String(o.payment_status || '').toLowerCase() === 'paid'
        const paymentBadgeClass = paymentPaid ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
        const paymentBadgeText = paymentPaid ? 'Đã thanh toán' : 'Chưa thanh toán'
        const paymentMethod = String(o.payment_method || '').toUpperCase()
        const orderStatus = String(o.status || '').toLowerCase()
        const canResume = !paymentPaid
          && paymentMethod === 'BANK_TRANSFER'
          && orderStatus !== 'cancelled'
          && orderStatus !== 'done'
        const imageSrc = getOrderHistoryImage(o)
        const colorText = String(o.color || '').trim() || 'Chưa chọn'
        const sizeText = String(o.size || '').trim() || '--'
        const quantityText = Number(o.quantity || 1) > 1 ? ' x' + Number(o.quantity || 1) : ''
        const productTitle = escapeHtml(o.product_name || '')
        const lifecycle = getOrderHistoryLifecycle(o)
        const safeOrderCode = String(o.order_code || '')
        const methodArg = paymentMethod
        const paymentAttrs = ' data-order-id="' + escapeHtml(String(o.id || '')) + '" data-order-code="' + escapeHtml(safeOrderCode) + '" data-payment-method="' + escapeHtml(methodArg) + '" '
        const codeHtml = canResume
          ? '<button class="font-mono text-xs text-blue-600 font-semibold hover:underline"' + paymentAttrs + 'onclick="resumeOrderPaymentFromButton(this)">' + escapeHtml(o.order_code || '') + '</button>'
          : '<span class="font-mono text-xs text-blue-600 font-semibold">' + escapeHtml(o.order_code || '') + '</span>'
        const resumeActionHtml = canResume
          ? '<button class="mt-2 w-full rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2 transition"' + paymentAttrs + 'onclick="resumeOrderPaymentFromButton(this)"><i class="fas fa-qrcode mr-1"></i>Thanh toán</button>'
          : ''
        const imageHtml = imageSrc
          ? '<div class="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100"><img src="' + escapeHtml(imageSrc) + '" alt="' + productTitle + '" class="w-full h-full object-cover"></div>'
          : '<div class="w-16 h-16 rounded-lg bg-gray-100 flex-shrink-0 border border-gray-100 flex items-center justify-center text-gray-300"><i class="fas fa-image"></i></div>'
        const statusHtml = lifecycle.clickable
          ? '<button type="button" class="order-status-chip clickable ' + lifecycle.toneClass + '" onclick="openShippingJourneyModal(' + o.id + ')"><i class="fas ' + lifecycle.icon + '"></i>' + escapeHtml(lifecycle.label) + '</button>'
          : '<span class="order-status-chip ' + lifecycle.toneClass + '"><i class="fas ' + lifecycle.icon + '"></i>' + escapeHtml(lifecycle.label) + '</span>'
        return '<div class="order-history-item border rounded-xl p-3">'
          + '<div class="flex gap-3">'
          + imageHtml
          + '<div class="min-w-0 flex-1">'
          + '<div class="flex justify-between items-start gap-2 mb-1">' + codeHtml
          + '<span class="text-xs px-2 py-0.5 rounded-full font-medium ' + paymentBadgeClass + ' whitespace-nowrap">' + paymentBadgeText + '</span></div>'
          + '<p class="text-sm font-semibold text-gray-800 leading-snug order-history-title">' + productTitle + '</p>'
          + '<p class="text-xs text-gray-500 mt-1">Màu: ' + escapeHtml(colorText) + ' | Size: ' + escapeHtml(sizeText) + quantityText + '</p>'
          + '<div class="flex justify-between items-center mt-2 gap-2"><span class="text-xs text-gray-400">' + new Date(o.created_at).toLocaleDateString('vi-VN') + '</span>'
          + '<span class="font-bold text-gradient-price text-sm whitespace-nowrap">' + fmtPrice(getOrderAmountDue(o)) + '</span></div>'
          + '<div class="mt-2">' + statusHtml + '</div>'
          + resumeActionHtml
          + (!isAdminUser && orderStatus === 'done' && !o.has_review
             ? '<button class="btn-rate-order mt-2" onclick="openReviewModal(' + o.id + ',' + o.product_id + ')"><i class=\"fas fa-star mr-1\"></i>Đánh giá</button>'
             : '')
          + '</div>'
          + '</div>'
          + '</div>'
      }).join('') + '</div>'
  } catch { content.innerHTML = '<div class="text-center py-8 text-red-400">Lỗi tải dữ liệu</div>' }
}

function resumeOrderPaymentFromButton(button) {
  if (!button || !button.dataset) return
  const orderId = Number(button.dataset.orderId || 0)
  const orderCode = String(button.dataset.orderCode || '')
  const paymentMethod = String(button.dataset.paymentMethod || '')
  if (!orderId || !orderCode || !paymentMethod) return
  resumeOrderPayment(orderId, orderCode, paymentMethod)
}

async function resumeOrderPayment(orderId, orderCode, paymentMethod) {
  const method = String(paymentMethod || '').toUpperCase()
  if (method !== 'BANK_TRANSFER') {
    showToast('Đơn này không dùng phương thức chuyển khoản', 'error', 3800)
    return
  }
  let providerLabel = 'thanh toán'
  const createEndpoint = '/api/orders/' + orderId + '/bank-transfer-link'
  const syncEndpoint = '/api/orders/' + orderId + '/payos-sync'
  let payTab = window.open('about:blank', '_blank')
  const openCheckoutUrl = function (url) {
    const checkoutUrl = String(url || '').trim()
    if (!checkoutUrl) return false
    if (payTab) {
      try { payTab.location.href = checkoutUrl } catch (_) { payTab = null }
      return true
    }
    payTab = window.open(checkoutUrl, '_blank')
    return !!payTab
  }
  try {
    const paymentRes = await axios.post(createEndpoint, { origin: window.location.origin })
    const paymentData = paymentRes.data?.data || {}
    const provider = String(paymentData.provider || '').toUpperCase()
    providerLabel = provider === 'PAYOS' ? 'PayOS' : (provider === 'MANUAL_VIETQR' ? 'VietQR' : 'thanh toán')
    if (paymentData.alreadyPaid) {
      try { if (payTab && !payTab.closed) payTab.close() } catch (_) { }
      await axios.post(syncEndpoint).catch(function () { return null })
      showUserOrders()
      showToast('Đơn này đã thanh toán thành công', 'success', 3500)
      return
    }
    const checkoutUrl = String(paymentData.checkoutUrl || '').trim()
    if (!checkoutUrl) {
      try { if (payTab && !payTab.closed) payTab.close() } catch (_) { }
      if (provider === 'MANUAL_VIETQR' || paymentData.qrCode || paymentData.transferContent) {
        openOrderBankTransferModal({
          orderCode,
          orderId,
          amount: paymentData.amount || 0,
          transferContent: paymentData.transferContent || getOrderTransferContent(orderId || orderCode),
          paymentLinkId: paymentData.paymentLinkId || '',
          qrCode: paymentData.qrCode || '',
          bankId: paymentData.bankId || '',
          accountNo: paymentData.accountNo || '',
          accountName: paymentData.accountName || '',
          template: paymentData.template || ''
        })
        showToast('Đã mở QR VietQR để bạn thanh toán tiếp', 'success', 3500)
        return
      }
      showToast('Không tạo được link thanh toán ' + providerLabel, 'error', 3500)
      return
    }
    if (!openCheckoutUrl(checkoutUrl)) {
      showToast('Trình duyệt đang chặn popup, vui lòng cho phép mở tab mới', 'warning', 3800)
      return
    }
    startOrderPaymentPolling(orderCode)
    showToast('Đang mở lại trang ' + providerLabel + ' để bạn thanh toán tiếp', 'success', 3500)
  } catch (err) {
    const errCode = err.response?.data?.error
    const fallbackUrl = String(err.response?.data?.detail?.checkoutUrl || err.response?.data?.detail?.data?.checkoutUrl || '').trim()
    if (fallbackUrl && openCheckoutUrl(fallbackUrl)) {
      startOrderPaymentPolling(orderCode)
      showToast('Đang mở lại trang ' + providerLabel + ' để bạn thanh toán tiếp', 'success', 3500)
      return
    }
    if (errCode === 'PAYOS_CONFIG_MISSING') {
      showToast('Cấu hình thanh toán chưa đầy đủ, vui lòng liên hệ shop', 'error', 5500)
      return
    }
    if (errCode === 'PAYMENT_METHOD_NOT_BANK_TRANSFER') {
      showToast('Đơn này không dùng phương thức chuyển khoản', 'error', 3800)
      return
    }
    if (errCode === 'ORDER_NOT_FOUND') {
      showToast('Không tìm thấy đơn hàng để thanh toán lại', 'error', 3800)
      return
    }
    if (errCode === 'INVALID_ORDER_AMOUNT') {
      showToast('Đơn hàng có số tiền không hợp lệ để thanh toán', 'error', 3800)
      return
    }
    try { if (payTab && !payTab.closed) payTab.close() } catch (_) { }
    const msg = err.response?.data?.error || err.message || 'Không thể mở lại thanh toán cho đơn này'
    showToast('Không thể mở lại thanh toán: ' + msg, 'error', 4000)
  }
}

// ── WALLET CONFIG (thay thông tin ngân hàng ở đây) ──
const BANK_CONFIG = {
  bankId: 'MB',
  accountNo: '0200100441441',
  accountName: 'TRAN CONG HANH',
  template: 'compact2'
}

let selectedTopupAmount = 50000

function getVietQRUrl(amount, customInfo = '', bankConfig = BANK_CONFIG) {
  const info = customInfo || ('QHVN90' + (currentUser ? currentUser.userId : ''))
  const config = bankConfig || BANK_CONFIG
  return 'https://img.vietqr.io/image/' + config.bankId + '-' + config.accountNo + '-' + config.template + '.png?amount=' + amount + '&addInfo=' + encodeURIComponent(info) + '&accountName=' + encodeURIComponent(config.accountName)
}

function getOrderTransferContent(orderCode) {
  const safeCode = String(orderCode || '').replace(/[^a-zA-Z0-9]/g, '')
  return 'DH' + safeCode
}

function openOrderBankTransferModal(info) {
  const orderCode = info?.orderCode || ''
  const amount = Number(info?.amount || 0)
  const transferContent = info?.transferContent || getOrderTransferContent(info?.orderId || orderCode)
  const bankConfig = {
    bankId: info?.bankId || BANK_CONFIG.bankId,
    accountNo: info?.accountNo || BANK_CONFIG.accountNo,
    accountName: info?.accountName || BANK_CONFIG.accountName,
    template: info?.template || BANK_CONFIG.template
  }
  const qrImage = info?.qrCode || getVietQRUrl(amount, transferContent, bankConfig)
  pendingBankTransferOrder = { orderCode, amount, transferContent, paymentLinkId: info?.paymentLinkId || '' }
  document.getElementById('orderBankOrderCode').textContent = orderCode
  const amountDisplay = document.getElementById('orderBankAmountDisplay')
  if (amountDisplay) {
    amountDisplay.textContent = fmtPrice(amount)
    if (isHotTrendWomenContext()) {
      amountDisplay.classList.remove('text-gradient-price')
      amountDisplay.classList.add('qhher-order-price')
    } else {
      amountDisplay.classList.add('text-gradient-price')
      amountDisplay.classList.remove('qhher-order-price')
    }
  }
  document.getElementById('orderBankAccountNo').textContent = bankConfig.accountNo
  document.getElementById('orderBankAccountName').textContent = bankConfig.accountName
  document.getElementById('orderBankTransferContent').textContent = transferContent
  document.getElementById('orderBankQrImg').src = qrImage
  document.getElementById('orderBankTransferOverlay').classList.remove('hidden')
  lockStorefrontPageScroll('orderBankTransferOverlay')
  startOrderPaymentPolling(orderCode)
}

function closeOrderBankTransferModal() {
  document.getElementById('orderBankTransferOverlay').classList.add('hidden')
  stopOrderPaymentPolling()
  pendingBankTransferOrder = null
  unlockStorefrontPageScroll('orderBankTransferOverlay')
}

async function copyBankValue(value) {
  try {
    await navigator.clipboard.writeText(String(value || '').trim())
    showToast('Đã sao chép', 'success', 1500)
  } catch (_) {
    showToast('Không thể sao chép', 'error', 1500)
  }
}

function stopOrderPaymentPolling() {
  if (bankTransferPollTimer) {
    clearInterval(bankTransferPollTimer)
    bankTransferPollTimer = null
  }
}

function showOrderPaidNotice(orderCode) {
  const overlay = document.getElementById('orderPaidNoticeOverlay')
  const codeEl = document.getElementById('orderPaidNoticeCode')
  if (codeEl) codeEl.textContent = orderCode || ''
  if (!overlay) return
  overlay.classList.remove('hidden')
  overlay.classList.add('flex')
  lockStorefrontPageScroll('orderPaidNoticeOverlay')
  setTimeout(() => {
    overlay.classList.add('hidden')
    overlay.classList.remove('flex')
    unlockStorefrontPageScroll('orderPaidNoticeOverlay')
  }, 2600)
}

function onOrderMarkedPaid(orderCode) {
  stopOrderPaymentPolling()
  closeOrderBankTransferModal()
  showOrderPaidNotice(orderCode)
  showToast('Đã thanh toán thành công và ghi nhận đơn hàng', 'success', 4500)
  const userMenuContent = document.getElementById('userMenuContent')
  if (userMenuContent && userMenuContent.textContent && userMenuContent.textContent.includes('Lịch sử mua hàng')) {
    showUserOrders()
  }
  if (typeof loadAdminOrders === 'function') loadAdminOrders()
}

function startOrderPaymentPolling(orderCode) {
  stopOrderPaymentPolling()
  bankTransferPollTimer = setInterval(async () => {
    try {
      const res = await axios.get('/api/orders/' + encodeURIComponent(orderCode) + '/payment-status')
      const paymentStatus = res.data?.data?.payment_status
      if (paymentStatus === 'paid') {
        onOrderMarkedPaid(orderCode)
      }
    } catch (_) { }
  }, 4000)
}

function cleanPaymentQueryParams() {
  const url = new URL(window.location.href)
  if (!url.searchParams.has('pay')) return
  url.searchParams.delete('pay')
  url.searchParams.delete('order')
  url.searchParams.delete('provider')
  url.searchParams.delete('closeTab')
  const next = url.pathname + (url.searchParams.toString() ? '?' + url.searchParams.toString() : '') + url.hash
  window.history.replaceState({}, '', next)
}

function cleanAuthQueryParams() {
  const url = new URL(window.location.href)
  if (!url.searchParams.has('login')) return
  url.searchParams.delete('login')
  url.searchParams.delete('step')
  url.searchParams.delete('error')
  url.searchParams.delete('msg')
  const next = url.pathname + (url.searchParams.toString() ? '?' + url.searchParams.toString() : '') + url.hash
  window.history.replaceState({}, '', next)
}

function handleAuthReturnFlow() {
  const params = new URLSearchParams(window.location.search)
  const loginState = String(params.get('login') || '').toLowerCase()
  if (!loginState) return
  const step = String(params.get('step') || '').trim()
  const error = String(params.get('error') || '').trim()

  if (loginState === 'success') {
    showToast('Đăng nhập Google thành công', 'success', 3000)
  } else if (error === 'GOOGLE_AUTH_NOT_CONFIGURED' || step === 'google_config_missing') {
    showToast('Đăng nhập Google chưa được cấu hình. Cần thêm GOOGLE_CLIENT_ID và GOOGLE_CLIENT_SECRET.', 'error', 5000)
  } else if (error === 'GOOGLE_AUTH_CLIENT_ID_INVALID' || step === 'google_client_id_invalid') {
    showToast('OAuth Client ID Google không hợp lệ. Cần dùng Client ID dạng .apps.googleusercontent.com.', 'error', 6000)
  } else {
    showToast('Đăng nhập Google thất bại. Vui lòng thử lại.', 'error', 4000)
  }
  cleanAuthQueryParams()
}

function handlePaymentReturnFlow() {
  const params = new URLSearchParams(window.location.search)
  const payState = String(params.get('pay') || '').toLowerCase()
  const orderCode = String(params.get('order') || '').trim().toUpperCase()
  const provider = String(params.get('provider') || 'payos').trim().toLowerCase()
  const providerLabel = provider === 'zalopay' ? 'ZaloPay' : 'PayOS'
  const closeTab = params.get('closeTab') === '1'
  if (!payState) return

  if (payState === 'success' && orderCode) {
    try {
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage({ type: 'payment_paid', orderCode, provider }, window.location.origin)
      }
    } catch (_) { }
    startOrderPaymentPolling(orderCode)
    cleanPaymentQueryParams()
    if (closeTab && window.opener && !window.opener.closed) {
      setTimeout(() => { window.close() }, 80)
      return
    }
    showToast('Thanh toán ' + providerLabel + ' thành công', 'success', 3000)
    return
  }

  if (payState === 'cancel') {
    showToast('Bạn đã hủy thanh toán ' + providerLabel, 'error', 3000)
  }
  cleanPaymentQueryParams()
}

function showWalletInMenu() {
    var content = document.getElementById('userMenuContent')
    activeUserMenuView = 'wallet'
    if (!walletTopupEnabled) {
        content.innerHTML = renderWalletTopupDisabledNotice()
        return
    }
    if (!currentUser) {
        content.innerHTML = '<div class="text-center py-8 text-gray-400"><i class="fas fa-lock text-3xl mb-3"></i><p>Vui lòng đăng nhập để nạp tiền</p></div>'
        return
    }
    var tc = 'QHVN90' + currentUser.userId
    var html = '<div class="bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl p-4 mb-4 flex items-center justify-between">'
    html += '<div><p class="text-xs text-gray-500">Số dư ví</p><p class="text-xl font-bold text-gradient-price">' + fmtBalance(currentUser.balance) + '</p></div>'
    html += '<i class="fas fa-wallet text-3xl text-pink-300"></i></div>'
    html += '<h4 class="font-semibold text-gray-700 text-sm mb-2"><i class="fas fa-coins text-pink-400 mr-1"></i>Chọn số tiền</h4>'
    html += '<div class="grid grid-cols-3 gap-2 mb-3" id="topupAmountGrid">'
    var amounts = [50000, 100000, 200000, 500000, 1000000, 2000000]
    for (var i = 0; i < amounts.length; i++) {
        var v = amounts[i]
        var isActive = v === selectedTopupAmount
        var cls = isActive ? 'border-pink-500 bg-pink-50 text-pink-600' : 'border-gray-200 text-gray-600 hover:border-pink-300'
        html += '<button onclick="selectTopupAmount(' + v + ')" class="topup-amt-btn border-2 rounded-xl py-2 text-xs font-semibold transition ' + cls + '" data-amt="' + v + '">' + new Intl.NumberFormat('vi-VN').format(v) + 'đ</button>'
    }
    html += '</div>'
    html += '<div class="flex items-center gap-2 mb-4"><input id="customTopupAmt" type="number" placeholder="Số tiền khác..." class="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-pink-400 outline-none" oninput="onCustomAmountInput(this.value)"><span class="text-gray-400 text-sm font-semibold">đ</span></div>'
    html += '<div class="bg-white border-2 border-gray-100 rounded-2xl p-4 text-center">'
    html += '<p class="text-sm font-semibold text-gray-700 mb-3"><i class="fas fa-qrcode text-pink-400 mr-1"></i>Quét mã QR để thanh toán</p>'
    html += '<div class="flex justify-center mb-3"><img id="vietqrImg" src="' + getVietQRUrl(selectedTopupAmount) + '" class="w-48 h-48 object-contain rounded-xl border"></div>'
    html += '<div class="text-left space-y-2 text-xs">'
    html += '<div class="flex justify-between items-center bg-gray-50 rounded-lg px-3 py-2"><span class="text-gray-500">Ngân hàng</span><span class="font-bold text-gray-800">MB Bank</span></div>'
    html += '<div class="flex justify-between items-center bg-gray-50 rounded-lg px-3 py-2"><span class="text-gray-500">Số TK</span><span class="font-bold text-gray-800">' + BANK_CONFIG.accountNo + ' <i class="fas fa-copy text-gray-400 cursor-pointer ml-1 copy-btn" data-copy="' + BANK_CONFIG.accountNo + '"></i></span></div>'
    html += '<div class="flex justify-between items-center bg-gray-50 rounded-lg px-3 py-2"><span class="text-gray-500">Chủ TK</span><span class="font-bold text-gray-800">' + BANK_CONFIG.accountName + '</span></div>'
    html += '<div class="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2"><p class="text-amber-600 font-semibold mb-0.5">Nội dung CK (BẮT BUỘC)</p><div class="flex justify-between items-center"><span class="font-mono font-bold text-amber-800 text-sm">' + tc + '</span><i class="fas fa-copy text-amber-400 cursor-pointer copy-btn" data-copy="' + tc + '"></i></div></div>'
    html += '<div class="flex justify-between items-center bg-gray-50 rounded-lg px-3 py-2"><span class="text-gray-500">Số tiền</span><span class="font-bold text-gradient-price" id="qrAmountDisplay">' + fmtBalance(selectedTopupAmount) + '</span></div>'
    html += '</div></div>'
    html += '<div class="mt-3 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 text-xs text-blue-700 space-y-1">'
    html += '<p class="font-semibold"><i class="fas fa-info-circle mr-1"></i>Lưu ý:</p>'
    html += '<p>• Nội dung CK phải <strong>CHÍNH XÁC</strong></p>'
    html += '<p>• Tiền sẽ được cộng <strong>tự động</strong> trong 1-5 phút</p>'
    html += '<p>• Liên hệ admin nếu không nhận được tiền sau 10 phút</p>'
    html += '</div>'
    content.innerHTML = html
}

function selectTopupAmount(amt) {
    selectedTopupAmount = amt
    document.querySelectorAll('.topup-amt-btn').forEach(function (btn) {
        var btnAmt = parseInt(btn.getAttribute('data-amt'))
        if (btnAmt === amt) {
            btn.className = btn.className.replace(/border-gray-200 text-gray-600 hover:border-pink-300/g, '').replace(/border-pink-500 bg-pink-50 text-pink-600/g, '') + ' border-pink-500 bg-pink-50 text-pink-600'
        } else {
            btn.className = btn.className.replace(/border-pink-500 bg-pink-50 text-pink-600/g, '').replace(/border-gray-200 text-gray-600 hover:border-pink-300/g, '') + ' border-gray-200 text-gray-600 hover:border-pink-300'
        }
    })
    var ci = document.getElementById('customTopupAmt')
    if (ci) ci.value = ''
    updateQRCode(amt)
}

function onCustomAmountInput(val) {
    var amt = parseInt(val) || 0
    if (amt >= 2000) {
        selectedTopupAmount = amt
        document.querySelectorAll('.topup-amt-btn').forEach(function (btn) {
            btn.className = btn.className.replace(/border-pink-500 bg-pink-50 text-pink-600/g, '') + ' border-gray-200 text-gray-600 hover:border-pink-300'
        })
        updateQRCode(amt)
    }
}

function updateQRCode(amount) {
    var img = document.getElementById('vietqrImg')
    var display = document.getElementById('qrAmountDisplay')
    if (img) img.src = getVietQRUrl(amount)
    if (display) display.textContent = fmtBalance(amount)
}

function copyText(text) {
    navigator.clipboard.writeText(text).then(function () { showToast('Đã sao chép: ' + text, 'success') })
}

function normalizeLiveChatPhone(value) {
  var phone = String(value || '').trim().replace(/\\s+/g, '').replace(/[^\\d+]/g, '')
  if (phone.indexOf('+84') === 0) phone = '0' + phone.slice(3)
  else if (phone.indexOf('0084') === 0) phone = '0' + phone.slice(4)
  else if (phone.indexOf('84') === 0 && phone.length >= 11) phone = '0' + phone.slice(2)
  return phone.replace(/[^\\d]/g, '')
}

function getLiveChatStorageKey(suffix) {
  var identity = currentUser ? ('user_' + (currentUser.userId || currentUser.id || 'me')) : 'guest'
  return 'qh_live_chat_' + identity + '_' + suffix
}

function hydrateLiveChatSession() {
  if (liveChatConversationId) return
  try {
    liveChatConversationId = localStorage.getItem(getLiveChatStorageKey('conversation')) || ''
    liveChatCustomerToken = localStorage.getItem(getLiveChatStorageKey('token')) || ''
  } catch(e) {}
}

function persistLiveChatSession(conversationId, token) {
  liveChatConversationId = conversationId || liveChatConversationId
  liveChatCustomerToken = token || liveChatCustomerToken
  try {
    if (liveChatConversationId) localStorage.setItem(getLiveChatStorageKey('conversation'), liveChatConversationId)
    if (liveChatCustomerToken) localStorage.setItem(getLiveChatStorageKey('token'), liveChatCustomerToken)
  } catch(e) {}
}

function getLiveChatProductContext() {
  if (currentProduct && currentProduct.id) return currentProduct
  try {
    var productId = new URLSearchParams(window.location.search).get('product')
    if (productId) {
      return allProducts.find(function(product) { return String(product.id) === String(productId) }) || { id: Number(productId) }
    }
  } catch(e) {}
  return null
}

function renderLiveChatMessage(message) {
  var list = document.getElementById('liveChatMessages')
  if (!list || !message) return
  var messageId = String(message.id || '')
  if (messageId && liveChatRenderedMessageIds.has(messageId)) return
  if (messageId) liveChatRenderedMessageIds.add(messageId)
  var sender = String(message.sender_type || 'admin')
  var type = String(message.message_type || 'text')
  var bubble = document.createElement('div')
  bubble.className = 'live-chat-bubble ' + (sender === 'customer' ? 'customer' : sender === 'system' ? 'system' : 'admin') + (type === 'text' ? '' : ' is-media')
  if (type === 'product') {
    if (message.product_id) liveChatProductContextSent = String(message.product_id)
    var name = escapeHtml(message.product_name || message.body || 'Sản phẩm')
    var image = escapeHtml(message.product_thumbnail || '')
    var url = escapeHtml(message.product_url || (message.product_id ? '/?product=' + message.product_id : '#'))
    bubble.innerHTML = '<div class="live-chat-product-card">'
      + (image ? '<img src="' + image + '" alt="" onerror="this.style.display=\\'none\\'">' : '<span class="w-12 h-12 rounded-xl bg-pink-100 text-pink-500 flex items-center justify-center"><i class="fas fa-shirt"></i></span>')
      + '<div class="min-w-0"><p class="text-xs font-bold text-slate-900 truncate">' + name + '</p>'
      + '<a href="' + url + '" class="text-xs text-pink-600 font-semibold" target="_blank">Xem sản phẩm</a></div>'
      + '</div>'
  } else {
    bubble.textContent = String(message.body || '')
  }
  list.appendChild(bubble)
  list.scrollTop = list.scrollHeight
}

async function loadLiveChatMessages() {
  if (!liveChatConversationId) return
  try {
    var url = '/api/live-chat/' + encodeURIComponent(liveChatConversationId) + '/messages'
      + (liveChatCustomerToken ? '?token=' + encodeURIComponent(liveChatCustomerToken) : '')
    var res = await axios.get(url)
    var messages = res.data?.data?.messages || []
    var list = document.getElementById('liveChatMessages')
    if (list) list.innerHTML = ''
    liveChatRenderedMessageIds = new Set()
    messages.forEach(renderLiveChatMessage)
  } catch(e) {
    console.error('load live chat messages error', e)
  }
}

async function pollLiveChatMessages() {
  if (!liveChatConversationId) return
  try {
    var url = '/api/live-chat/' + encodeURIComponent(liveChatConversationId) + '/messages'
      + (liveChatCustomerToken ? '?token=' + encodeURIComponent(liveChatCustomerToken) : '')
    var res = await axios.get(url)
    var messages = res.data?.data?.messages || []
    messages.forEach(renderLiveChatMessage)
  } catch(e) {}
}

function startLiveChatPolling() {
  if (liveChatPollTimer) return
  liveChatPollTimer = setInterval(pollLiveChatMessages, 3000)
}

function stopLiveChatPolling() {
  if (!liveChatPollTimer) return
  clearInterval(liveChatPollTimer)
  liveChatPollTimer = null
}

function connectLiveChatSocket() {
  if (!liveChatConversationId || liveChatSocket) return
  try {
    var proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    var url = proto + '//' + window.location.host + '/api/live-chat/' + encodeURIComponent(liveChatConversationId) + '/ws'
      + (liveChatCustomerToken ? '?token=' + encodeURIComponent(liveChatCustomerToken) : '')
    liveChatSocket = new WebSocket(url)
    liveChatSocket.onopen = function() {
      var status = document.getElementById('liveChatStatus')
      if (status) status.textContent = 'Đang kết nối realtime'
    }
    liveChatSocket.onmessage = function(event) {
      try {
        var payload = JSON.parse(event.data)
        if (payload && payload.message) renderLiveChatMessage(payload.message)
      } catch(e) {}
    }
    liveChatSocket.onclose = function() {
      liveChatSocket = null
      var status = document.getElementById('liveChatStatus')
      if (status) status.textContent = 'Sẵn sàng hỗ trợ'
      startLiveChatPolling()
    }
  } catch(e) {
    liveChatSocket = null
    startLiveChatPolling()
  }
}

async function startLiveChat(options) {
  options = options || {}
  hydrateLiveChatSession()
  var phoneInput = document.getElementById('liveChatGuestPhone')
  var guestPhone = normalizeLiveChatPhone(phoneInput ? phoneInput.value : '')
  // guest phone is required before anonymous customers can chat
  if (!currentUser && !guestPhone && !liveChatConversationId) {
    var gate = document.getElementById('liveChatPhoneGate')
    if (gate) gate.classList.remove('hidden')
    if (phoneInput) phoneInput.focus()
    showToast('Nhập SĐT để shop liên hệ lại khi chat nhé', 'warning')
    return false
  }
  var product = options.product || getLiveChatProductContext()
  try {
    var res = await axios.post('/api/live-chat/start', {
      guest_phone: guestPhone,
      product_id: product && product.id ? product.id : null
    })
    var data = res.data?.data || {}
    persistLiveChatSession(data.conversation_id || '', data.customer_token || '')
    liveChatStarted = true
    var gate = document.getElementById('liveChatPhoneGate')
    if (gate) gate.classList.add('hidden')
    await loadLiveChatMessages()
    connectLiveChatSocket()
    startLiveChatPolling()
    if (product && product.id) liveChatProductContextSent = String(product.id)
    return true
  } catch(e) {
    if (e?.response?.data?.error === 'GUEST_PHONE_REQUIRED') showToast('Nhập SĐT khách vãng lai cần mở chat', 'error')
    else showToast('Chưa mở được chat, thử lại giúp shop nhé', 'error')
    return false
  }
}

async function sendLiveChatProductContext(product) {
  product = product || getLiveChatProductContext()
  if (!product || !product.id) return
  if (!liveChatStarted) {
    var ok = await startLiveChat({ product: product })
    if (!ok) return
    liveChatProductContextSent = String(product.id)
    return
  }
  if (liveChatProductContextSent === String(product.id)) return
  try {
    var res = await axios.post('/api/live-chat/' + encodeURIComponent(liveChatConversationId) + '/messages', {
      token: liveChatCustomerToken,
      message_type: 'product',
      product_id: product.id,
      body: 'Khách gửi sản phẩm'
    })
    renderLiveChatMessage(res.data?.data)
    liveChatProductContextSent = String(product.id)
  } catch(e) {
    showToast('Không gửi được sản phẩm vào chat', 'error')
  }
}

async function openLiveChat() {
  var panel = document.getElementById('liveChatPanel')
  if (panel) panel.classList.remove('hidden')
  updateLiveChatSendButtonState()
  resizeLiveChatTextarea()
  hydrateLiveChatSession()
  var gate = document.getElementById('liveChatPhoneGate')
  if (!currentUser && !liveChatConversationId && gate) gate.classList.remove('hidden')
  if (liveChatConversationId) {
    liveChatStarted = true
    await loadLiveChatMessages()
    connectLiveChatSocket()
    startLiveChatPolling()
  }
  var product = getLiveChatProductContext()
  if (product && product.id) {
    await sendLiveChatProductContext(product)
  }
}

function closeLiveChat() {
  var panel = document.getElementById('liveChatPanel')
  if (panel) panel.classList.add('hidden')
  stopLiveChatPolling()
}

async function sendLiveChatMessage() {
  var input = document.getElementById('liveChatInput')
  var body = String(input?.value || '').trim()
  if (!body) return
  if (!liveChatConversationId) {
    var ok = await startLiveChat()
    if (!ok) return
  }
  try {
    if (input) input.value = ''
    updateLiveChatSendButtonState()
    resizeLiveChatTextarea()
    var res = await axios.post('/api/live-chat/' + encodeURIComponent(liveChatConversationId) + '/messages', {
      token: liveChatCustomerToken,
      body: body
    })
    renderLiveChatMessage(res.data?.data)
  } catch(e) {
    showToast('Chưa gửi được tin nhắn', 'error')
    if (input) input.value = body
    updateLiveChatSendButtonState()
    resizeLiveChatTextarea()
  }
}

function updateLiveChatSendButtonState() {
  var input = document.getElementById('liveChatInput')
  var btn = document.getElementById('liveChatSendButton')
  if (!btn) return
  var hasText = String(input?.value || '').trim().length > 0
  btn.classList.toggle('has-text', hasText)
}

function resizeLiveChatTextarea() {
  var input = document.getElementById('liveChatInput')
  if (!input) return
  input.style.height = 'auto'
  input.style.height = Math.min(input.scrollHeight, 96) + 'px'
}

function handleLiveChatTextareaInput() {
  updateLiveChatSendButtonState()
  resizeLiveChatTextarea()
}

function handleLiveChatInputKey(event) {
  var isMobile = window.matchMedia && window.matchMedia('(max-width: 640px)').matches
  if (event.key === 'Enter' && !event.shiftKey && !isMobile) {
    event.preventDefault()
    sendLiveChatMessage()
  }
}

function toggleLiveChatProductPicker(event) {
  if (event && event.stopPropagation) event.stopPropagation()
  var picker = document.getElementById('liveChatProductPicker')
  if (!picker) return
  if (picker.classList.contains('hidden')) openLiveChatProductPicker()
  else closeLiveChatProductPicker()
}

async function ensureLiveChatPickerProducts() {
  if (Array.isArray(allProducts) && allProducts.length) return true
  if (liveChatProductsLoading) return false
  liveChatProductsLoading = true
  var list = document.getElementById('liveChatProductPickerList')
  if (list) list.innerHTML = '<div class="py-10 text-center text-slate-400 text-sm"><i class="fas fa-spinner fa-spin mr-2"></i>Đang tải sản phẩm...</div>'
  try {
    var res = await axios.get('/api/products' + getStorefrontQuerySuffix())
    allProducts = scopeStorefrontProductsForPage(res.data?.data || [])
    return true
  } catch(e) {
    if (list) list.innerHTML = '<div class="py-10 text-center text-red-400 text-sm">Không tải được sản phẩm</div>'
    return false
  } finally {
    liveChatProductsLoading = false
  }
}

async function openLiveChatProductPicker() {
  var picker = document.getElementById('liveChatProductPicker')
  if (picker) picker.classList.remove('hidden')
  var ready = await ensureLiveChatPickerProducts()
  if (ready) renderLiveChatProductPicker()
  setTimeout(function() {
    var search = document.getElementById('liveChatProductSearch')
    if (search) search.focus()
  }, 0)
}

function closeLiveChatProductPicker() {
  var picker = document.getElementById('liveChatProductPicker')
  if (picker) picker.classList.add('hidden')
}

document.addEventListener('click', function(event) {
  var picker = document.getElementById('liveChatProductPicker')
  if (!picker || picker.classList.contains('hidden')) return
  var panel = document.getElementById('liveChatPanel')
  var button = document.getElementById('liveChatProductButton')
  if (picker.contains(event.target) || (button && button.contains(event.target))) return
  if (panel && panel.contains(event.target)) closeLiveChatProductPicker()
  else closeLiveChatProductPicker()
})

function syncLiveChatLauncherExpansion() {
  var launcher = document.getElementById('liveChatLauncher')
  if (!launcher) return
  var label = launcher.querySelector('.live-chat-launcher-label')
  var icon = launcher.querySelector('.live-chat-launcher-icon')
  var viewportWidth = Math.min(window.innerWidth || 0, window.visualViewport?.width || window.innerWidth || 0)
  var shouldExpand = viewportWidth > 640 && (window.scrollY || document.documentElement.scrollTop || 0) > 260
  launcher.classList.toggle('is-expanded', shouldExpand)
  launcher.classList.toggle('is-collapsed', !shouldExpand)
  if (shouldExpand) {
    launcher.style.setProperty('width', '10.875rem', 'important')
    launcher.style.setProperty('min-width', '10.875rem', 'important')
    launcher.style.setProperty('justify-content', 'flex-start', 'important')
    launcher.style.setProperty('gap', '0.55rem', 'important')
    launcher.style.setProperty('padding', '0 1.05rem', 'important')
    if (label) {
      label.style.setProperty('max-width', '7.25rem', 'important')
      label.style.setProperty('opacity', '1', 'important')
      label.style.setProperty('transform', 'translateX(0)', 'important')
    }
    if (icon) {
      icon.style.setProperty('width', '2rem', 'important')
      icon.style.setProperty('height', '2rem', 'important')
      icon.style.setProperty('background', 'rgba(255,255,255,0.18)', 'important')
    }
  } else {
    launcher.style.setProperty('width', '3.5rem', 'important')
    launcher.style.setProperty('min-width', '0', 'important')
    launcher.style.setProperty('justify-content', 'center', 'important')
    launcher.style.setProperty('gap', '0', 'important')
    launcher.style.setProperty('padding', '0', 'important')
    if (label) {
      label.style.setProperty('max-width', '0', 'important')
      label.style.setProperty('opacity', '0', 'important')
      label.style.setProperty('transform', 'translateX(0.8rem)', 'important')
    }
    if (icon) {
      icon.style.setProperty('width', 'auto', 'important')
      icon.style.setProperty('height', 'auto', 'important')
      icon.style.setProperty('background', 'transparent', 'important')
    }
  }
}

let liveChatLauncherScrollTicking = false
function onLiveChatLauncherScroll() {
  if (liveChatLauncherScrollTicking) return
  liveChatLauncherScrollTicking = true
  requestAnimationFrame(function() {
    syncLiveChatLauncherExpansion()
    liveChatLauncherScrollTicking = false
  })
}

window.addEventListener('scroll', onLiveChatLauncherScroll, { passive: true })
window.addEventListener('resize', syncLiveChatLauncherExpansion)
syncLiveChatLauncherExpansion()

function renderLiveChatProductPicker() {
  var list = document.getElementById('liveChatProductPickerList')
  if (!list) return
  if ((!Array.isArray(allProducts) || !allProducts.length) && !liveChatProductsLoading) {
    list.innerHTML = '<div class="py-10 text-center text-slate-400 text-sm"><i class="fas fa-spinner fa-spin mr-2"></i>Đang tải sản phẩm...</div>'
    ensureLiveChatPickerProducts().then(function(ready) {
      if (ready) renderLiveChatProductPicker()
    })
    return
  }
  var search = String(document.getElementById('liveChatProductSearch')?.value || '').toLowerCase().trim()
  var products = (allProducts || []).filter(function(product) {
    return !search || String(product.name || '').toLowerCase().indexOf(search) >= 0
  }).slice(0, 30)
  if (!products.length) {
    list.innerHTML = '<div class="py-10 text-center text-slate-400 text-sm">Chưa có sản phẩm phù hợp</div>'
    return
  }
  list.innerHTML = products.map(function(product) {
    var price = Number(product.display_sale_price ?? product.display_price ?? product.price ?? 0)
    var stock = Number(product.stock || 0)
    var sold = Number(product.total_sold || 0)
    var stockText = stock > 0 ? fmtSold(stock) + ' có sẵn' : 'còn hàng'
    var image = product.thumbnail
      ? '<img src="' + escapeHtml(product.thumbnail || '') + '" alt="" onerror="this.outerHTML=\\'<span class=&quot;live-chat-picker-fallback flex items-center justify-center text-pink-500&quot;><i class=&quot;fas fa-shirt&quot;></i></span>\\'">'
      : '<span class="live-chat-picker-fallback flex items-center justify-center text-pink-500"><i class="fas fa-shirt"></i></span>'
    return '<div class="live-chat-picker-item">'
      + image
      + '<div class="min-w-0 flex-1"><p class="live-chat-picker-name">' + escapeHtml(product.name || '') + '</p>'
      + '<p class="live-chat-picker-meta"><span class="live-chat-picker-price">' + fmtPrice(price) + '</span><span>|</span><span class="truncate">' + escapeHtml(stockText) + '</span><span>|</span><span>' + fmtSold(sold) + ' đã bán</span></p></div>'
      + '<button type="button" class="live-chat-picker-send" onclick="sendLiveChatPickedProduct(' + Number(product.id) + ')">Gửi</button>'
      + '</div>'
  }).join('')
}

async function sendLiveChatPickedProduct(productId) {
  var product = (allProducts || []).find(function(item) { return Number(item.id) === Number(productId) })
  if (!product) return
  await sendLiveChatProductContext(product)
  closeLiveChatProductPicker()
}

// Event delegation for copy buttons
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('copy-btn') && e.target.dataset.copy) {
    copyText(e.target.dataset.copy)
  }
})

// Load bestsellers on page start
loadBestSellers()
if (isHotTrendWomenContext()) loadHotTrendNuTrendingProducts()


function openTopupModal() {
    if (!walletTopupEnabled) {
      showToast('Chức năng nạp tiền vào ví đang tắt', 'warning', 3000)
      return
    }
    if (!currentUser) { toggleUserMenu(); return }
    openUserMenu()
    showWalletInMenu()
}

// ── BALANCE POLLING & SUCCESS NOTIFICATION ──
var balancePollingTimer = null
var lastKnownBalance = null

function startBalancePolling() {
  if (balancePollingTimer) return
  if (!currentUser) return
  lastKnownBalance = currentUser.balance || 0
  balancePollingTimer = setInterval(checkBalanceChange, 5000)
}

function stopBalancePolling() {
  if (balancePollingTimer) { clearInterval(balancePollingTimer); balancePollingTimer = null }
}

async function checkBalanceChange() {
  if (!currentUser) { stopBalancePolling(); return }
  try {
    var res = await axios.get('/api/auth/me')
    if (res.data.data && res.data.data.balance !== undefined) {
      var newBalance = res.data.data.balance
      if (lastKnownBalance !== null && newBalance > lastKnownBalance) {
        var added = newBalance - lastKnownBalance
        currentUser.balance = newBalance
        updateUserUI()
        showWalletInMenu()
        showTopupSuccessModal(added)
        playTingSound()
      }
      lastKnownBalance = newBalance
      currentUser.balance = newBalance
    }
  } catch(e) {}
}

function showTopupSuccessModal(amount) {
  var overlay = document.createElement('div')
  overlay.id = 'topupSuccessOverlay'
  overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);backdrop-filter:blur(4px);z-index:9999;display:flex;align-items:center;justify-content:center;animation:fadeIn 0.3s ease'
  overlay.innerHTML = '<div style="background:white;border-radius:1.5rem;padding:2.5rem 2rem;text-align:center;max-width:340px;width:90%;box-shadow:0 25px 50px rgba(0,0,0,0.25);animation:scaleIn 0.4s cubic-bezier(0.34,1.56,0.64,1)">'
    + '<div style="width:70px;height:70px;border-radius:50%;background:linear-gradient(135deg,#10b981,#059669);margin:0 auto 1rem;display:flex;align-items:center;justify-content:center"><i class="fas fa-check" style="color:white;font-size:2rem"></i></div>'
    + '<h3 style="color:#059669;font-size:1.25rem;font-weight:700;margin-bottom:0.5rem">Đã nạp tiền thành công!</h3>'
    + '<p style="color:#047857;font-size:1.75rem;font-weight:800">+' + fmtBalance(amount) + '</p>'
    + '<p style="color:#6b7280;font-size:0.8rem;margin-top:0.5rem">Số dư mới: ' + fmtBalance(currentUser.balance) + '</p>'
    + '<button onclick="closeTopupSuccessModal()" style="margin-top:1.25rem;background:linear-gradient(135deg,#10b981,#059669);color:white;border:none;padding:0.75rem 2rem;border-radius:0.75rem;font-weight:600;font-size:0.9rem;cursor:pointer">OK</button>'
    + '</div>'
  document.body.appendChild(overlay)
  overlay.addEventListener('click', function(e) { if (e.target === overlay) closeTopupSuccessModal() })
}

function closeTopupSuccessModal() {
  var el = document.getElementById('topupSuccessOverlay')
  if (el) el.remove()
}

function playTingSound() {
  try {
    var ctx = new (window.AudioContext || window.webkitAudioContext)()
    // Note 1
    var osc1 = ctx.createOscillator()
    var gain1 = ctx.createGain()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(880, ctx.currentTime)
    gain1.gain.setValueAtTime(0.3, ctx.currentTime)
    gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.start(ctx.currentTime)
    osc1.stop(ctx.currentTime + 0.3)
    // Note 2 (higher, delayed)
    var osc2 = ctx.createOscillator()
    var gain2 = ctx.createGain()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(1318, ctx.currentTime + 0.15)
    gain2.gain.setValueAtTime(0.01, ctx.currentTime)
    gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.15)
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.start(ctx.currentTime + 0.15)
    osc2.stop(ctx.currentTime + 0.5)
  } catch(e) {}
}

// Start polling when wallet menu is opened
var origShowWallet = showWalletInMenu
showWalletInMenu = function() { origShowWallet(); startBalancePolling() }

// Stop polling when user menu closes
var origCloseMenu = closeUserMenu
closeUserMenu = function() { stopBalancePolling(); origCloseMenu() }
`
    .replace(/\\`/g, '`')
    .replace(/\\\$\{/g, '${')
}
