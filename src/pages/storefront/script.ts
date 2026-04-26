import { storefrontDetailOrderScript } from './script-detail-order'
export function storefrontInlineScript(): string {
  return `let allProducts = []
let filteredProducts = []
let currentProduct = null
let orderQty = 1
let selectedColor = ''
let orderColorOptions = []
let selectedSize = ''
let selectedPaymentMethod = ''
let pendingBankTransferOrder = null
let bankTransferPollTimer = null
let zaloPayLinkTab = null
let appliedVoucher = null   // { code, discount_amount }
let detailColorOptions = []
let detailSelectedColor = ''
let detailSelectedColorImage = ''
let detailSelectedColorIndex = -1
let detailSelectedSize = ''
let detailSelectedProductId = null
let userOrderHistoryCache = []

// ── CART STATE ─────────────────────────────────────
// cart = [{ cartId, productId, name, sku, thumbnail, price, color, size, qty, checked }]
let cart = []
let cartStep = 1  // 1=list, 2=checkout
let ckAppliedVoucher = null
let cartSelectedPaymentMethod = ''
let currentUser = null
let isAdminUser = false
let cartStorageKey = 'qhclothes_cart_guest'
const ADDRESS_EFFECTIVE_DATE = 'latest'
let addressProvinceOptions = []
let addressCommuneOptionsByProvince = {}
let addressKitLoadingPromise = null
let addressAutoFillInProgress = false
const addressDropdownSearchState = {}

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
    return '<button type="button" class="address-option-item' + active + '" data-scope="' + scope + '" data-type="' + type + '" data-code="' + item.code + '" onclick="selectAddressDropdownOption(this.dataset.scope,this.dataset.type,this.dataset.code)">' + item.name + '</button>'
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
    else clearFieldError(ids.fieldId)
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
  else clearFieldError(ids.fieldId)
}

function onAddressCommuneChange(scope) {
  syncAddressFullText(scope)
  renderAddressDropdownList(scope, 'commune', '')
  const ids = getAddressScopeElements(scope)
  if (scope === 'ck') clearCheckoutError(ids.fieldId)
  else clearFieldError(ids.fieldId)
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
  if (type === 'province') onAddressProvinceChange(scope)
  else onAddressCommuneChange(scope)
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
    detail
  }
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
  const badge = document.getElementById('cartBadge')
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
function genCartId() { return Date.now().toString(36)+Math.random().toString(36).slice(2,7) }

function addToCart(product, color, size, qty) {
  // check duplicate: same productId + color + size
  const exist = cart.find(i=>i.productId===product.id && i.color===color && i.size===size)
  if (exist) {
    exist.qty = Math.min(99, exist.qty + qty)
  } else {
    cart.push({
      cartId: genCartId(),
      productId: product.id,
      name: product.name,
      sku: product.sku || ('SKU-'+String(product.id).padStart(4,'0')),
      thumbnail: product.thumbnail || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
      price: product.price,
      color,
      colorImage: getSelectedColorImageFromProduct(product, color),
      size, qty,
      checked: true
    })
  }
  saveCart()
}

// ── INIT ──────────────────────────────────────────
async function loadProducts() {
  try {
    const res = await axios.get('/api/products')
    allProducts = res.data.data || []
    filteredProducts = [...allProducts]
    renderProducts(filteredProducts)
    loadFlashSaleShop()
  } catch(e) {
    document.getElementById('productsGrid').innerHTML = '<div class="col-span-4 text-center text-gray-400 py-12"><i class="fas fa-exclamation-circle text-4xl mb-3"></i><p>Không thể tải sản phẩm</p></div>'
  }
}

// ── REVIEWS ─────────────────────────────────────────
let _reviewState = { productId: 0, orderId: 0, rating: 5, images: [], submitting: false }

async function loadProductReviews(productId) {
  const section = document.getElementById('detailReviewsSection')
  const content = document.getElementById('detailReviewsContent')
  if (!section || !content || !currentUser) return
  section.classList.remove('hidden')
  try {
    const res = await axios.get('/api/reviews?productId=' + productId)
    const reviews = Array.isArray(res.data?.data) ? res.data.data : []
    const avg = Number(res.data?.avgRating || 0)
    const total = Number(res.data?.total || 0)
    if (!reviews.length) {
      content.innerHTML = '<p class="text-gray-400 text-sm py-2">Chưa có đánh giá nào. Hãy là người đầu tiên!</p>'
      return
    }
    const stars = (n) => '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n))
    content.innerHTML = \`
      <div class="flex items-center gap-2 mb-3">
        <span class="review-avg-stars text-lg">\${stars(avg)}</span>
        <span class="font-bold text-gray-800 text-sm">\${avg.toFixed(1)}</span>
        <span class="text-gray-400 text-xs">(\${total} đánh giá)</span>
      </div>
      <div class="space-y-3">
        \${reviews.slice(0, 5).map(r => {
          const avatarHtml = r.user_avatar
            ? \`<img src="\${escapeHtml(r.user_avatar)}" class="review-avatar" onerror="this.src=''">\`
            : \`<div class="review-avatar bg-violet-100 flex items-center justify-center text-violet-500 text-xs font-bold">\${escapeHtml((r.user_name||'?')[0].toUpperCase())}</div>\`
          const imgHtml = Array.isArray(r.images) && r.images.length
            ? \`<div class="flex gap-1.5 mt-2 flex-wrap">\${r.images.map(img => \`<img src="\${escapeHtml(img)}" class="review-img-thumb" onclick="window.open('\${escapeHtml(img)}','_blank')">\`).join('')}</div>\`
            : ''
          return \`<div class="review-card">
            <div class="flex items-center gap-2 mb-1.5">
              \${avatarHtml}
              <div>
                <p class="text-xs font-semibold text-gray-700">\${escapeHtml(r.user_name || 'Khách hàng')}</p>
                <span class="review-stars">\${'★'.repeat(Number(r.rating))}\${'☆'.repeat(5-Number(r.rating))}</span>
              </div>
              <span class="ml-auto text-xs text-gray-400">\${new Date(r.created_at).toLocaleDateString('vi-VN')}</span>
            </div>
            \${r.comment ? \`<p class="text-sm text-gray-600 leading-relaxed">\${escapeHtml(r.comment)}</p>\` : ''}
            \${imgHtml}
          </div>\`
        }).join('')}
      </div>\`
  } catch(e) {
    section.classList.add('hidden')
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
  document.body.style.overflow = 'hidden'
}

function closeReviewModal() {
  document.getElementById('reviewModalOverlay').classList.add('hidden')
  document.body.style.overflow = ''
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
  try {
    const res = await axios.get('/api/bestsellers?limit=10')
    const products = Array.isArray(res.data?.data) ? res.data.data : []
    if (!products.length) { track.innerHTML = '<p class="text-gray-400 text-sm py-4 px-2">Chưa có dữ liệu bán hàng.</p>'; return }
    const medalClass = (i) => i < 3 ? 'bs-medal bs-medal-top bs-medal-top-' + (i + 1) : 'bs-medal bs-medal-n'
    const medalIcon = (i) => i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : String(i + 1)
    const fmtSold = (n) => n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n)
    track.innerHTML = products.map((p, i) => {
      const flashMeta = getFlashSaleMeta(p)
      const price = Number(flashMeta?.salePrice || p.display_price || p.price || 0)
      const soldCount = Number(p.total_sold || 0)
      return \`<div class="bs-card" onclick="showDetail(\${p.id})">
        <div class="relative">
          <img src="\${p.thumbnail || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'}"
            alt="\${p.name}" class="bs-card-img" loading="lazy"
            onerror="this.src='https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'">
          <div class="\${medalClass(i)}">\${medalIcon(i)}</div>
          \${p.has_flash_sale ? '<div class="absolute bottom-2 right-2"><span class="flash-sale-badge text-xs"><i class="fas fa-bolt"></i></span></div>' : ''}
        </div>
        <div class="p-3">
          <p class="bs-name mb-1.5">\${p.name}</p>
          <div class="flex items-center justify-between mb-2">
            <span class="bs-price">\${fmtPrice(price)}</span>
            <span class="bs-stars">★★★★★</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="bs-sold-chip"><i class="fas fa-fire-flame-curved"></i> \${fmtSold(soldCount)} đã bán</span>
          </div>
          <button onclick="event.stopPropagation();openOrder(\${p.id})" class="btn-primary w-full mt-2.5 py-2 text-xs font-bold text-white rounded-xl">
            <i class="fas fa-bolt mr-1"></i>Mua ngay
          </button>
        </div>
      </div>\`
    }).join('')
  } catch(e) {
    if (track) track.innerHTML = ''
  }
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

let flashSaleCountdownTicker = null

function updateFlashSaleCountdownNode(node) {
  if (!node) return
  const endAt = String(node.getAttribute('data-flash-sale-ends-at') || '').trim()
  node.textContent = formatFlashSaleCountdown(endAt)
}

async function startFlashSaleCountdownTicker() {
  const updateAll = () => {
    document.querySelectorAll('.flash-sale-countdown[data-flash-sale-ends-at]').forEach((node) => updateFlashSaleCountdownNode(node))
  }
  updateAll()
  if (flashSaleCountdownTicker) clearInterval(flashSaleCountdownTicker)
  flashSaleCountdownTicker = setInterval(updateAll, 1000)
}

async function loadFlashSaleShop() {
  const section = document.getElementById('flashSaleShopSection')
  const grid = document.getElementById('flashSaleShopGrid')
  const countdown = document.getElementById('flashSaleShopCountdown')
  if (!section || !grid || !countdown) return
  try {
    const res = await axios.get('/api/flash-sales/active-products')
    const products = Array.isArray(res.data?.data) ? res.data.data : []
    if (!products.length) {
      section.classList.add('hidden')
      return
    }
    section.classList.remove('hidden')
    const firstActive = products.find((product) => product?.flash_sale?.campaign?.end_at || product?.flash_sale?.end_at)
    countdown.setAttribute('data-flash-sale-ends-at', firstActive?.flash_sale?.campaign?.end_at || firstActive?.flash_sale?.end_at || '')
    countdown.textContent = formatFlashSaleCountdown(firstActive?.flash_sale?.campaign?.end_at || firstActive?.flash_sale?.end_at || '')
    grid.innerHTML = products.slice(0, 8).map((product) => {
      const meta = getFlashSaleMeta(product)
      const price = meta?.salePrice || Number(product.display_price ?? product.price ?? 0)
      const original = meta?.basePrice || Number(product.display_original_price ?? product.original_price ?? price)
      const discount = Number(meta?.discountPercent || 0)
      return \`
        <div class="flash-sale-shop-card shrink-0 basis-[78%] cursor-pointer md:basis-auto" onclick="showDetail(\${product.id})">
          <div class="relative aspect-square overflow-hidden bg-slate-100">
            <img src="\${product.thumbnail || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'}" alt="\${product.name}" class="h-full w-full object-cover" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'">
            <div class="absolute left-3 top-3 flex flex-col gap-2">
              <span class="flash-sale-badge"><i class="fas fa-bolt"></i> Flash Sale</span>
              <span class="flash-sale-countdown" data-flash-sale-ends-at="\${meta?.endsAt || ''}">\${formatFlashSaleCountdown(meta?.endsAt || '')}</span>
            </div>
            \${discount > 0 ? \`<span class="absolute bottom-3 left-3 rounded-full bg-black/75 px-3 py-1 text-xs font-bold text-white">-\${discount}%</span>\` : ''}
          </div>
          <div class="space-y-3 p-4">
            <h3 class="line-clamp-2 text-sm font-semibold leading-6 text-slate-900">\${product.name}</h3>
            <div class="flex items-end gap-2">
              <span class="text-2xl font-bold text-gradient-price">\${fmtPrice(price)}</span>
              \${original > price ? \`<span class="pb-0.5 text-sm text-slate-400 line-through">\${fmtPrice(original)}</span>\` : ''}
            </div>
            <button onclick="event.stopPropagation();openOrder(\${product.id})" class="btn-primary w-full rounded-2xl py-3 text-sm font-semibold text-white">
              <i class="fas fa-bolt mr-1"></i>Mua ngay
            </button>
          </div>
        </div>
      \`
    }).join('')
    startFlashSaleCountdownTicker()
  } catch (e) {
    section.classList.add('hidden')
  }
}

function renderProducts(products) {
  const grid = document.getElementById('productsGrid')
  const empty = document.getElementById('emptyState')
  if (!products.length) {
    grid.innerHTML = ''
    empty.classList.remove('hidden')
    return
  }
  empty.classList.add('hidden')
  grid.innerHTML = products.map(p => {
    const colors = getProductColorOptions(p).map((c) => c.name)
    const flashMeta = getFlashSaleMeta(p)
    const displayPrice = Number(flashMeta?.salePrice || p.display_price || p.price || 0)
    const displayOriginalPrice = Number(flashMeta?.basePrice || p.display_original_price || p.original_price || displayPrice)
    const discount = flashMeta ? Number(flashMeta.discountPercent || 0) : (p.original_price ? Math.round((1 - p.price/p.original_price)*100) : 0)
    return \`
    <div class="bg-white rounded-2xl overflow-hidden card-hover shadow-sm border border-gray-100 cursor-pointer" onclick="showDetail(\${p.id})">
      <div class="relative overflow-hidden bg-gray-100">
        <img src="\${p.thumbnail || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'}"
          alt="\${p.name}" class="w-full product-img-main" loading="lazy"
          onerror="this.src='https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'">
        \${p.has_flash_sale ? \`<div class="absolute left-3 top-3 flex flex-col gap-2"><span class="flash-sale-badge"><i class="fas fa-bolt"></i> Flash Sale</span><span class="flash-sale-countdown" data-flash-sale-ends-at="\${flashMeta?.endsAt || ''}">\${formatFlashSaleCountdown(flashMeta?.endsAt || '')}</span></div>\` : (discount > 0 ? \`<span class="absolute top-3 left-3 badge-sale text-white text-xs font-bold px-2 py-1 rounded-full">-\${discount}%</span>\` : '')}
        \${p.is_featured ? \`<span class="absolute top-3 right-3 bg-amber-400 text-white text-xs font-bold px-2 py-1 rounded-full">⭐ Hot</span>\` : ''}
        <div class="absolute inset-0 bg-black/0 hover:bg-black/10 transition flex items-center justify-center opacity-0 hover:opacity-100">
          <span class="bg-white/90 text-gray-800 px-3 py-1 rounded-full text-xs font-semibold">Xem chi tiết</span>
        </div>
      </div>
      <div class="p-3 md:p-4">
        \${p.brand ? \`<p class="text-xs text-pink-500 font-medium mb-1">\${p.brand}</p>\` : ''}
        <h3 class="font-semibold text-gray-900 text-sm leading-tight mb-2 line-clamp-2">\${p.name}</h3>
        <div class="flex items-center gap-2 mb-3">
          <span class="text-gradient-price font-bold">\${fmtPrice(displayPrice)}</span>
          \${displayOriginalPrice > displayPrice ? \`<span class="text-gray-400 text-xs line-through">\${fmtPrice(displayOriginalPrice)}</span>\` : ''}
        </div>
        \${colors.length > 0 ? \`
        <div class="flex gap-1 mb-3 flex-wrap">
          \${colors.slice(0,4).map(c => \`<span class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">\${c}</span>\`).join('')}
          \${colors.length > 4 ? \`<span class="text-xs text-gray-400">+\${colors.length-4}</span>\` : ''}
        </div>\` : ''}
        <div class="flex gap-2">
          <button onclick="event.stopPropagation();openOrder(\${p.id})" title="Mua ngay"
            class="btn-primary flex-1 text-white py-2 rounded-xl text-sm font-semibold">
            <i class="fas fa-bolt mr-1"></i>Mua ngay
          </button>
          <button onclick="event.stopPropagation();addToCartFromCard(event, \${p.id})" title="Thêm vào giỏ hàng"
            class="add-to-cart-btn w-10 h-9 flex items-center justify-center text-white rounded-xl transition group relative">
            <i class="fas fa-shopping-bag text-sm"></i>
          </button>
        </div>
      </div>
    </div>\`
  }).join('')
  startFlashSaleCountdownTicker()
}

// ── FILTER & SEARCH ────────────────────────────────
function filterProducts(cat, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'))
  btn.classList.add('active')
  const search = document.getElementById('searchInput').value.toLowerCase()
  filteredProducts = allProducts.filter(p => {
    const matchCat = cat === 'all' || p.category === cat
    const matchSearch = !search || p.name.toLowerCase().includes(search) || (p.brand||'').toLowerCase().includes(search)
    return matchCat && matchSearch
  })
  renderProducts(filteredProducts)
}

function searchProducts(q) {
  const activeCat = document.querySelector('.filter-btn.active')?.dataset.cat || 'all'
  const ql = q.toLowerCase()
  filteredProducts = allProducts.filter(p => {
    const matchCat = activeCat === 'all' || p.category === activeCat
    const matchSearch = !q || p.name.toLowerCase().includes(ql) || (p.brand||'').toLowerCase().includes(ql)
    return matchCat && matchSearch
  })
  renderProducts(filteredProducts)
}

// ── PRODUCT DETAIL ─────────────────────────────────
${storefrontDetailOrderScript()}

function fmtPrice(p) { return new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND'}).format(p) }
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
  if (key === 'ZALOPAY') return 'ZaloPay'
  if (key === 'MOMO') return 'Ví điện tử MoMo'
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

function toggleMobileMenu() {
  const m = document.getElementById('mobileMenu')
  m.classList.toggle('hidden')
}
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
  document.body.style.overflow = 'hidden'
}
function closeCart() {
  document.getElementById('cartOverlay').classList.add('hidden')
  document.body.style.overflow = ''
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
    listEl.innerHTML = '<div class="flex flex-col items-center justify-center py-20 text-center"><div class="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4"><i class="fas fa-shopping-bag text-4xl text-gray-300"></i></div><p class="text-gray-500 font-medium text-lg mb-1">Chua co san pham nao</p><p class="text-gray-400 text-sm">Hay them san pham vao gio hang</p><button onclick="closeCart()" class="mt-6 btn-primary text-white px-6 py-2.5 rounded-full font-semibold text-sm"><i class="fas fa-arrow-left mr-2"></i>Tiep tuc mua sam</button></div>'
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
    const colorTag = col ? '<span class="text-xs bg-pink-50 text-pink-600 border border-pink-200 px-2 py-0.5 rounded-full">' + col + '</span>' : ''
    const sizeTag = sz ? '<span class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">' + sz + '</span>' : ''
    return '<div class="cart-item rounded-xl border border-gray-200 bg-white" data-cart-id="' + item.cartId + '">'
      + '<div class="cart-item-delete-bg cart-del-btn" data-id="' + item.cartId + '"><i class="fas fa-trash"></i></div>'
      + '<div class="cart-item-inner rounded-xl p-3" data-cart-id="' + item.cartId + '">'
      + '<div class="flex gap-3 items-start">'
      + '<div class="flex-shrink-0 pt-1"><input type="checkbox" ' + chk + ' data-toggle-id="' + item.cartId + '" class="cart-chk w-4 h-4 accent-pink-500 cursor-pointer mt-0.5"></div>'
      + '<img src="' + item.thumbnail + '" alt="' + item.name + '" class="w-16 h-20 object-cover rounded-lg flex-shrink-0" onerror="this.src=&quot;https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&quot;">'
      + '<div class="flex-1 min-w-0">'
      + '<p class="font-semibold text-gray-900 text-sm line-clamp-1 mb-0.5">' + item.name + '</p>'
      + '<p class="text-xs text-gray-400 mb-1">' + item.sku + '</p>'
      + '<div class="flex flex-wrap gap-1 mb-2">' + colorTag + sizeTag + '</div>'
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

  // Setup swipe-to-delete for each item
  setupSwipeToDelete()
  updateCartSummary()
  updateCartHeaderSubtitle()
}

function updateCartHeaderSubtitle() {
  const total = cart.reduce(function(s,i){return s+i.qty},0)
  document.getElementById('cartSubtitle').textContent = total > 0 ? (total + ' san pham trong gio') : 'Chua co san pham nao'
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
  document.getElementById('selectedCount').textContent = 'Da chon ' + count
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
async function proceedToCheckout() {
  const checked = cart.filter(i=>i.checked)
  if (checked.length === 0) { showToast('Vui lòng chọn ít nhất 1 sản phẩm','error'); return }
  try {
    await ensureAddressKitReady()
  } catch (_) {
    showToast('Không tải được danh mục địa chỉ, vui lòng thử lại.', 'error', 4500)
    return
  }
  // Build summary
  document.getElementById('checkoutSummaryItems').innerHTML = checked.map(function(i){
    return '<div class="flex-shrink-0 w-20 text-center">'
      + '<div class="relative inline-block">'
      + '<img src="' + i.thumbnail + '" class="w-16 h-20 object-cover rounded-xl border-2 border-white shadow" onerror="this.src=&quot;https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&quot;">'
      + '<span class="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 text-white text-xs rounded-full flex items-center justify-center font-bold">' + i.qty + '</span>'
      + '</div><p class="text-xs text-gray-600 mt-1 line-clamp-1">' + i.name + '</p></div>'
  }).join('')
  // reset form
  ;['ckName','ckPhone','ckAddress','ckAddressDetail','ckNote'].forEach(id => { const el=document.getElementById(id); if(el) el.value='' })
  await applySavedAddressToScope('ck')
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
  document.getElementById('cartSubtitle').textContent = checked.reduce(function(s,i){return s+i.qty},0) + ' sản phẩm'
}

function updateCkTotal() {
  const checked = cart.filter(i=>i.checked)
  const subtotal = checked.reduce((s,i)=>s+i.price*i.qty,0)
  const discount = ckAppliedVoucher ? ckAppliedVoucher.discount_amount : 0
  const total = Math.max(0, subtotal - discount)
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
async function applyCkVoucher() {
  const code = document.getElementById('ckVoucher').value.trim().toUpperCase()
  const statusEl = document.getElementById('ckVoucherStatus')
  const btn = document.getElementById('ckVoucherBtn')
  if (!code) {
    statusEl.className='mt-2 voucher-error rounded-xl px-3 py-2 text-sm text-red-600 font-medium'
    statusEl.innerHTML='<i class="fas fa-times-circle mr-1"></i>Vui lòng nhập mã voucher'
    statusEl.classList.remove('hidden'); return
  }
  btn.disabled=true; btn.innerHTML='<i class="fas fa-spinner fa-spin"></i>'
  statusEl.classList.add('hidden')
  try {
    const res = await axios.post('/api/vouchers/validate', { code })
    ckAppliedVoucher = res.data.data
    statusEl.className='mt-2 voucher-success rounded-xl px-3 py-2 text-sm text-green-700 font-semibold flex items-center gap-2'
    statusEl.innerHTML='<i class="fas fa-check-circle text-green-500"></i>Ap dung thanh cong! Giam <strong>' + fmtPrice(ckAppliedVoucher.discount_amount) + '</strong>'
    statusEl.classList.remove('hidden')
    document.getElementById('ckVoucher').classList.add('border-green-400','bg-green-50')
    updateCkTotal()
  } catch(err) {
    ckAppliedVoucher = null
    const errCode = err.response?.data?.error
    const msg = errCode==='VOUCHER_LIMIT'?'Voucher đã hết lượt':errCode==='INVALID_VOUCHER'?'Mã không hợp lệ hoặc hết hạn':'Không thể áp dụng'
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
async function submitCartOrder() {
  const payload = validateCheckoutFields('ck', { requirePayment: true })
  if (!payload) return

  const note = document.getElementById('ckNote').value.trim()
  const checkedItems = cart.filter(i=>i.checked)
  const paymentMethod = getCheckoutSelectedPaymentMethod('ck')
  if (paymentMethod === 'BANK_TRANSFER' && checkedItems.length !== 1) {
    showToast('Chuyển khoản từ giỏ hiện chỉ hỗ trợ 1 sản phẩm mỗi lần. Hãy chọn 1 sản phẩm hoặc dùng COD.', 'error', 5000)
    return
  }
  const btn = document.getElementById('submitCartBtn')
  btn.disabled=true
  btn.innerHTML='<i class="fas fa-spinner fa-spin mr-2"></i>Đang xử lý...'
  let payTabRef = null
  if (paymentMethod === 'BANK_TRANSFER') {
    try { payTabRef = window.open('about:blank', '_blank') } catch (_) { payTabRef = null }
  }

  try {
    const createdOrders = []
    for (const item of checkedItems) {
      const res = await axios.post('/api/orders', {
        customer_name: payload.name, customer_phone: payload.phone, customer_address: payload.address,
        product_id: item.productId, color: item.color, size: item.size,
        selected_color_image: item.colorImage || '',
        quantity: item.qty,
        voucher_code: ckAppliedVoucher ? ckAppliedVoucher.code : '',
        note,
        payment_method: paymentMethod
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
      showToast('Đặt hàng thành công! ' + createdOrders.length + ' đơn hàng đã được tạo', 'success', 5000)
    }
  } catch(e) {
    try { if (payTabRef && !payTabRef.closed) payTabRef.close() } catch (_) { }
    const errCode = e.response?.data?.error
    if (errCode==='INVALID_VOUCHER'||errCode==='VOUCHER_LIMIT') {
      showToast('Voucher không còn hiệu lực','error')
      ckAppliedVoucher=null; updateCkTotal()
      document.getElementById('ckVoucherBtn').innerHTML='Áp dụng'
      document.getElementById('ckVoucherBtn').className='px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-sm font-semibold transition whitespace-nowrap'
    } else { showToast('Đặt hàng thất bại, thử lại sau','error') }
  } finally {
    btn.disabled=false
    btn.innerHTML='<i class="fas fa-shopping-cart mr-2"></i>Đặt hàng ngay'
  }
}

function toggleCart() { openCart() }

// Close overlays on outside click
document.getElementById('orderOverlay').addEventListener('click', (e) => { if(e.target.id==='orderOverlay') closeOrder() })
document.getElementById('detailOverlay').addEventListener('click', (e) => { if(e.target.id==='detailOverlay') closeDetail() })
document.getElementById('orderBankTransferOverlay').addEventListener('click', (e) => { if (e.target.id === 'orderBankTransferOverlay') closeOrderBankTransferModal() })
const storefrontClosableOverlays = [
  { id: 'orderBankTransferOverlay', close: () => closeOrderBankTransferModal() },
  { id: 'shippingJourneyOverlay', close: () => closeShippingJourneyModal() },
  { id: 'orderOverlay', close: () => closeOrder() },
  { id: 'detailOverlay', close: () => closeDetail() },
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
  if (heroBannersIsExpanded) collapseBanners()
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
  const clearFn = () => clearFieldError(fieldMap[id])
  el.addEventListener('input', clearFn)
  el.addEventListener('change', clearFn)
})

// ── DYNAMIC HERO BANNERS ──────────────────────────
let heroBannersData = []
let heroBannersIsExpanded = false
let lastHeroMobileMode = null

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
    const trendingRes = await axios.get('/api/trending-products').catch(() => ({ data: { data: [] } }))
    const trendingProducts = (trendingRes.data && trendingRes.data.data) ? trendingRes.data.data : []
    heroBannersData = sortHeroCards(mapTrendingProductsToHeroCards(trendingProducts))
    renderCollapsedBanners(heroBannersData)
    renderExpandedBanners(heroBannersData)
    bindHeroBannersWheelScroll()
  } catch (e) {
    console.error('Failed to load banners', e)
  }
}

function mapTrendingProductsToHeroCards(products) {
  if (!Array.isArray(products)) return []
  return products.map((p) => {
    const imgs = safeJson(p.images)
    const categoryLabel = p.category === 'male' ? 'Nam' : p.category === 'female' ? 'Nu' : 'Unisex'
    return {
      image_url: p.thumbnail || imgs[0] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
      subtitle: categoryLabel + ' · Dang thinh hanh',
      title: p.name || '',
      price: fmtPrice(p.price || 0),
      product_id: p.id,
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
    const au = Date.parse(a.updated_at || a.created_at || '')
    const bu = Date.parse(b.updated_at || b.created_at || '')
    if (!Number.isNaN(au) && !Number.isNaN(bu) && au !== bu) return bu - au
    return Number(a.product_id || 0) - Number(b.product_id || 0)
  })
}
function isMobileHeroLayout() {
  return window.matchMedia('(max-width: 768px)').matches
}

function bindHeroBannersWheelScroll() {
  const overlay = document.getElementById('heroBannersExpanded')
  const inner = document.getElementById('heroBannersExpandedInner')
  if (!overlay || !inner || inner.dataset.wheelBound === '1') return
  inner.dataset.wheelBound = '1'
  const onWheel = (e) => {
    if (!heroBannersIsExpanded || isMobileHeroLayout()) return
    const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX
    if (!delta) return
    inner.scrollLeft += delta * 1.2
    e.preventDefault()
  }
  inner.addEventListener('wheel', onWheel, { passive: false })
  overlay.addEventListener('wheel', onWheel, { passive: false })
}

function renderCollapsedBanners(banners) {
  const container = document.getElementById('heroBannersCollapsed')
  if (!container) return
  const mobileMode = isMobileHeroLayout()
  lastHeroMobileMode = mobileMode
  if (!banners.length) {
    container.innerHTML = \`<div class="relative w-full h-full rounded-3xl border border-white/20 bg-white/5 flex items-center justify-center text-center px-6">
      <div>
        <i class="fas fa-fire text-2xl text-pink-300 mb-2"></i>
        <p class="text-white/80 text-sm font-medium">Chưa có sản phẩm thịnh hành</p>
      </div>
    </div>\`
    return
  }
  if (mobileMode) {
    const shown = banners.slice(0, Math.max(3, Math.min(banners.length, 8)))
    container.innerHTML = \`<div class="hero-mobile-slider">\${shown.map((b) => {
      const safeTitle = b.title || 'Sản phẩm'
      if (b.product_id) {
        return \`<button type="button" class="hero-mobile-card hero-mobile-card-button" onclick="showDetail(\${b.product_id})">
          <div class="hero-mobile-card-thumb">
            <img src="\${b.image_url}" alt="\${safeTitle}" onerror="this.src='https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'">
          </div>
          <p class="hero-mobile-card-name">\${safeTitle}</p>
        </button>\`
      }
      return \`<div class="hero-mobile-card">
        <div class="hero-mobile-card-thumb">
          <img src="\${b.image_url}" alt="\${safeTitle}" onerror="this.src='https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'">
        </div>
        <p class="hero-mobile-card-name">\${safeTitle}</p>
      </div>\`
    }).join('')}</div>
    <div class="hero-mobile-swipe-hint"><i class="fas fa-arrows-left-right"></i><span>Vuốt ngang để xem thêm</span></div>\`
    container.style.paddingBottom = '0'
    container.onclick = null
    return
  }
  const len = banners.length
  const shown = banners.slice(0, Math.min(len, 4)).reverse()
  container.innerHTML = \`<div class="relative" style="width:300px;height:360px">
  \${shown.map((b, i) => {
    const rot = shown.length > 1 ? (i - Math.floor((shown.length - 1) / 2)) * 6 : 0
    const z = i * 10
    const isTop = i === shown.length - 1
    const clickHandler = \`expandBanners()\`
    const cursor = 'cursor-pointer'
    return \`<div class="absolute inset-0 rounded-3xl overflow-hidden \${cursor}" onclick="\${clickHandler}" style="transform:rotate(\${rot}deg);z-index:\${z};transition:transform 0.5s ease,box-shadow 0.5s ease;box-shadow:0 12px 40px rgba(0,0,0,0.25);">
      <div class="absolute inset-0 bg-gradient-to-br from-pink-500/15 to-purple-600/15 rounded-3xl pointer-events-none"></div>
      <img src="\${b.image_url}" alt="\${b.title || 'Banner'}" class="w-full h-full object-cover rounded-3xl pointer-events-none" onerror="this.src='https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'">
      \${isTop && (b.subtitle || b.title || b.price) ? \`
        <div class="absolute left-0 right-0 bottom-0 px-4 pt-10 pb-4 pointer-events-none rounded-b-3xl"
          style="z-index:\${z+5};background:linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 42%, rgba(0,0,0,0) 100%);">
          \${b.subtitle ? \`<p class="text-[10px] text-white/75 uppercase tracking-[2px] font-semibold mb-1">\${b.subtitle}</p>\` : ''}
          \${b.title ? \`<p class="font-bold text-white text-sm leading-tight overflow-hidden text-ellipsis whitespace-nowrap" style="max-width:100%;">\${b.title}</p>\` : ''}
          \${b.price ? \`<p class="text-pink-300 font-bold text-sm mt-1">\${b.price}</p>\` : ''}
        </div>\` : ''}
    </div>\`
  }).join('')}
  </div>
  <div class="absolute flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5 text-white text-xs font-medium cursor-pointer hover:bg-white/30 transition whitespace-nowrap" style="bottom:-28px;left:50%;transform:translateX(-50%);z-index:5" onclick="expandBanners()">
    <i class="fas fa-expand-alt mr-1 text-pink-300"></i>Các mẫu thịnh hành
  </div>\`
  container.style.paddingBottom = '36px'
  container.onclick = () => { if (!heroBannersIsExpanded) expandBanners() }
}

function renderExpandedBanners(banners) {
  const inner = document.getElementById('heroBannersExpandedInner')
  const title = document.getElementById('heroBannersExpandedTitle')
  if (!inner) return
  if (title) title.textContent = \`🔥 Đang thịnh hành (\${banners.length} mẫu)\`
  inner.innerHTML = banners.map(b => {
    if (b.product_id) {
      return \`<a href="javascript:void(0)" class="hero-banner-card" onclick="showDetail(\${b.product_id})">
        <img src="\${b.image_url}" alt="\${b.title || ''}" onerror="this.src='https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'" loading="lazy">
        \${(b.subtitle || b.title || b.price) ? \`
          <div class="banner-caption">
            \${b.subtitle ? \`<p class="banner-subtitle">\${b.subtitle}</p>\` : ''}
            \${b.title ? \`<p class="banner-title">\${b.title}</p>\` : ''}
            \${b.price ? \`<p class="banner-price">\${b.price}</p>\` : ''}
          </div>\` : ''}
      </a>\`
    } else {
      return \`<div class="hero-banner-card" style="cursor:default;">
        <img src="\${b.image_url}" alt="\${b.title || ''}" onerror="this.src='https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'" loading="lazy">
        \${(b.subtitle || b.title || b.price) ? \`
          <div class="banner-caption">
            \${b.subtitle ? \`<p class="banner-subtitle">\${b.subtitle}</p>\` : ''}
            \${b.title ? \`<p class="banner-title">\${b.title}</p>\` : ''}
            \${b.price ? \`<p class="banner-price">\${b.price}</p>\` : ''}
          </div>\` : ''}
      </div>\`
    }
  }).join('')
  // Add placeholders to always have 4 per row
  const needed = Math.max(0, 4 - banners.length)
  for (let i = 0; i < needed; i++) {
    inner.innerHTML += \`<div class="hero-banner-card" style="background:rgba(255,255,255,0.05);pointer-events:none;"></div>\`
  }
}

function expandBanners() {
  if (heroBannersIsExpanded || isMobileHeroLayout()) return
  heroBannersIsExpanded = true
  const overlay = document.getElementById('heroBannersExpanded')
  overlay.style.display = 'flex'
  requestAnimationFrame(() => { overlay.style.opacity = '1' })
  document.body.style.overflow = 'hidden'
}

function collapseBanners() {
  if (!heroBannersIsExpanded) return
  heroBannersIsExpanded = false
  const overlay = document.getElementById('heroBannersExpanded')
  overlay.style.opacity = '0'
  setTimeout(() => {
    overlay.style.display = 'none'
    document.body.style.overflow = ''
  }, 350)
}

function handleBannerOverlayClick(e) {
  if (e.target.id === 'heroBannersExpanded') collapseBanners()
}

window.addEventListener('resize', () => {
  const mobileMode = isMobileHeroLayout()
  if (lastHeroMobileMode === null) {
    lastHeroMobileMode = mobileMode
    return
  }
  if (mobileMode !== lastHeroMobileMode) {
    if (mobileMode && heroBannersIsExpanded) collapseBanners()
    renderCollapsedBanners(heroBannersData)
    lastHeroMobileMode = mobileMode
  }
})

// Init
bindAddressSearchableDropdowns()
loadSettings()
loadFooterSocialLinks()
loadCart()
loadProducts()
checkUserAuth()
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
    isAdminUser = !!res.data.isAdmin
    syncCartScope()
    ensureAddressKitReady()
      .then(() => {
        applySavedAddressToScope('order')
          .catch(() => { })
      })
      .catch(() => { })
    updateUserUI()
  } catch {
    currentUser = null
    isAdminUser = false
    syncCartScope()
    ensureAddressKitReady()
      .then(() => {
        applySavedAddressToScope('order')
          .catch(() => { })
      })
      .catch(() => { })
    updateUserUI()
  }
}

function fmtBalance(v) { return new Intl.NumberFormat('vi-VN').format(v||0) + 'đ' }

function updateUserUI() {
  const defaultAvatar = document.getElementById('userAvatarDefault')
  const imgAvatar = document.getElementById('userAvatarImg')
  const guestSection = document.getElementById('userMenuGuest')
  const loggedInSection = document.getElementById('userMenuLoggedIn')
  const logoutArea = document.getElementById('userMenuLogoutArea')
  const walletNav = document.getElementById('walletNavBtn')
  const adminLink = document.getElementById('adminNavLink')
  const userOrdersBtn = document.getElementById('userOrdersBtn')
  // Admin icon
  if (isAdminUser) { adminLink.classList.remove('hidden') } else { adminLink.classList.add('hidden') }
  if (currentUser && isAdminUser) {
    defaultAvatar.classList.remove('hidden')
    imgAvatar.classList.add('hidden')
    guestSection.classList.add('hidden')
    loggedInSection.classList.remove('hidden')
    logoutArea.classList.remove('hidden')
    document.getElementById('userMenuAvatar').src = '/qh-logo.png'
    document.getElementById('userMenuName').textContent = 'Admin'
    document.getElementById('userMenuEmail').textContent = 'Quyen quan tri'
    walletNav.classList.add('hidden')
    walletNav.classList.remove('flex')
    if (userOrdersBtn) userOrdersBtn.classList.add('hidden')
  } else if (currentUser) {
    defaultAvatar.classList.add('hidden')
    imgAvatar.src = currentUser.avatar || ''
    imgAvatar.classList.remove('hidden')
    guestSection.classList.add('hidden')
    loggedInSection.classList.remove('hidden')
    logoutArea.classList.remove('hidden')
    document.getElementById('userMenuAvatar').src = currentUser.avatar || ''
    document.getElementById('userMenuName').textContent = currentUser.name || ''
    document.getElementById('userMenuEmail').textContent = currentUser.email || ''
    // Wallet
    walletNav.classList.remove('hidden')
    walletNav.classList.add('flex')
    const bal = fmtBalance(currentUser.balance)
    document.getElementById('walletBalanceNav').textContent = bal
    document.getElementById('walletBalanceMenu').textContent = bal
    if (userOrdersBtn) userOrdersBtn.classList.remove('hidden')
  } else {
    defaultAvatar.classList.remove('hidden')
    imgAvatar.classList.add('hidden')
    guestSection.classList.remove('hidden')
    loggedInSection.classList.add('hidden')
    logoutArea.classList.add('hidden')
    walletNav.classList.add('hidden')
    walletNav.classList.remove('flex')
    if (userOrdersBtn) userOrdersBtn.classList.remove('hidden')
  }
}

function toggleUserMenu() {
  const overlay = document.getElementById('userMenuOverlay')
  if (overlay.classList.contains('hidden')) { openUserMenu() } else { closeUserMenu() }
}
function openUserMenu() {
  const overlay = document.getElementById('userMenuOverlay')
  const panel = document.getElementById('userMenuPanel')
  panel.classList.remove('closing')
  overlay.classList.remove('hidden')
  document.body.style.overflow = 'hidden'
  document.getElementById('userMenuContent').innerHTML = ''
}
function closeUserMenu() {
  const overlay = document.getElementById('userMenuOverlay')
  const panel = document.getElementById('userMenuPanel')
  panel.classList.add('closing')
  setTimeout(() => { overlay.classList.add('hidden'); panel.classList.remove('closing'); closeShippingJourneyModal(); document.body.style.overflow = '' }, 300)
}
function handleUserMenuOverlayClick(e) { if (e.target.id === 'userMenuOverlay') closeUserMenu() }

function loginWithGoogle() { window.location.href = '/api/auth/google' }

async function logoutUser() {
  try { await axios.post('/api/auth/logout') } catch {}
  currentUser = null
  isAdminUser = false
  syncCartScope(true)
  updateUserUI()
  closeUserMenu()
  showToast('Đã đăng xuất thành công', 'success')
}

function showUserAccount() {
  const content = document.getElementById('userMenuContent')
  if (!currentUser) {
    content.innerHTML = '<div class="text-center py-8 text-gray-400"><i class="fas fa-lock text-3xl mb-3"></i><p>Vui lòng đăng nhập để xem thông tin</p></div>'
    return
  }
  content.innerHTML = '<div class="bg-white rounded-2xl border p-4 space-y-3">'
    + '<h3 class="font-semibold text-gray-800 mb-3"><i class="fas fa-user-circle text-pink-400 mr-2"></i>Thông tin tài khoản</h3>'
    + '<div class="flex items-center gap-4"><img src="' + (currentUser.avatar||'') + '" class="w-16 h-16 rounded-full object-cover border-2 border-pink-200"><div>'
    + '<p class="font-bold text-gray-900">' + (currentUser.name||'') + '</p>'
    + '<p class="text-sm text-gray-500">' + (currentUser.email||'') + '</p></div></div></div>'
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
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
    return { key: 'shipping', label: 'Đang giao', icon: 'fa-truck-fast', toneClass: 'order-status-chip--shipping', clickable: true, hasJourney: true }
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
}

function closeShippingJourneyModal() {
  const overlay = document.getElementById('shippingJourneyOverlay')
  if (!overlay) return
  overlay.classList.add('hidden')
  overlay.classList.remove('flex')
}

function handleShippingJourneyOverlayClick(e) {
  if (e.target && e.target.id === 'shippingJourneyOverlay') closeShippingJourneyModal()
}

async function showUserOrders() {
  const content = document.getElementById('userMenuContent')
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
      return unpaid && (method === 'BANK_TRANSFER' || method === 'ZALOPAY')
    }).slice(0, 6)
    if (unpaidGatewayOrders.length) {
      await Promise.all(unpaidGatewayOrders.map(function (o) {
        const method = String(o.payment_method || '').toUpperCase()
        const syncEndpoint = method === 'ZALOPAY'
          ? '/api/orders/' + o.id + '/zalopay-sync'
          : '/api/orders/' + o.id + '/payos-sync'
        return axios.post(syncEndpoint).catch(function () { return null })
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
          + (isAdminUser && orderStatus === 'done' && !o.has_review
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
  const isZaloPay = method === 'ZALOPAY'
  if (isZaloPay) {
    const check = await ensureZaloPayConfigReady(true)
    if (!check.ready) return
  }
  const providerLabel = isZaloPay ? 'ZaloPay' : 'PayOS'
  const createEndpoint = isZaloPay ? '/api/orders/' + orderId + '/zalopay-link' : '/api/orders/' + orderId + '/payos-link'
  const syncEndpoint = isZaloPay ? '/api/orders/' + orderId + '/zalopay-sync' : '/api/orders/' + orderId + '/payos-sync'
  let payTab = isZaloPay ? openOrReuseZaloPayLinkTab() : window.open('about:blank', '_blank')
  const openCheckoutUrl = function (url) {
    const checkoutUrl = String(url || '').trim()
    if (!checkoutUrl) return false
    if (payTab) {
      try { payTab.location.href = checkoutUrl } catch (_) { payTab = null }
      if (isZaloPay && payTab) zaloPayLinkTab = payTab
      return true
    }
    payTab = window.open(checkoutUrl, '_blank')
    if (isZaloPay && payTab) zaloPayLinkTab = payTab
    return !!payTab
  }
  try {
    const paymentRes = await axios.post(createEndpoint, { origin: window.location.origin })
    const paymentData = paymentRes.data?.data || {}
    if (paymentData.alreadyPaid) {
      try { if (payTab && !payTab.closed) payTab.close() } catch (_) { }
      await axios.post(syncEndpoint).catch(function () { return null })
      showUserOrders()
      showToast('Đơn này đã thanh toán thành công', 'success', 3500)
      return
    }
    const checkoutUrl = isZaloPay
      ? String(paymentData.orderUrl || '').trim()
      : String(paymentData.checkoutUrl || '').trim()
    if (!checkoutUrl) {
      try { if (payTab && !payTab.closed) payTab.close() } catch (_) { }
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
    const fallbackUrl = isZaloPay
      ? String(err.response?.data?.detail?.order_url || err.response?.data?.detail?.data?.order_url || '').trim()
      : String(err.response?.data?.detail?.checkoutUrl || err.response?.data?.detail?.data?.checkoutUrl || '').trim()
    if (fallbackUrl && openCheckoutUrl(fallbackUrl)) {
      startOrderPaymentPolling(orderCode)
      showToast('Đang mở lại trang ' + providerLabel + ' để bạn thanh toán tiếp', 'success', 3500)
      return
    }
    if (errCode === 'ZALOPAY_CONFIG_MISSING') {
      const missing = Array.isArray(err.response?.data?.missing) ? err.response.data.missing : []
      const detail = missing.length ? (': ' + missing.join(', ')) : ''
      showToast('ZaloPay chua cau hinh day du' + detail, 'error', 5500)
      return
    }
    if (errCode === 'PAYOS_CONFIG_MISSING') {
      showToast('PayOS chưa cấu hình đầy đủ, vui lòng liên hệ shop', 'error', 5500)
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

function getVietQRUrl(amount, customInfo = '') {
  const info = customInfo || ('QHVN90' + (currentUser ? currentUser.userId : ''))
  return 'https://img.vietqr.io/image/' + BANK_CONFIG.bankId + '-' + BANK_CONFIG.accountNo + '-' + BANK_CONFIG.template + '.png?amount=' + amount + '&addInfo=' + encodeURIComponent(info) + '&accountName=' + encodeURIComponent(BANK_CONFIG.accountName)
}

function getOrderTransferContent(orderCode) {
  const safeCode = String(orderCode || '').replace(/[^a-zA-Z0-9]/g, '')
  return 'DH' + safeCode
}

function openOrderBankTransferModal(info) {
  const orderCode = info?.orderCode || ''
  const amount = Number(info?.amount || 0)
  const transferContent = info?.transferContent || getOrderTransferContent(info?.orderId || orderCode)
  const qrImage = getVietQRUrl(amount, transferContent)
  pendingBankTransferOrder = { orderCode, amount, transferContent, paymentLinkId: info?.paymentLinkId || '' }
  document.getElementById('orderBankOrderCode').textContent = orderCode
  document.getElementById('orderBankAmountDisplay').textContent = fmtPrice(amount)
  document.getElementById('orderBankAccountNo').textContent = BANK_CONFIG.accountNo
  document.getElementById('orderBankAccountName').textContent = BANK_CONFIG.accountName
  document.getElementById('orderBankTransferContent').textContent = transferContent
  document.getElementById('orderBankQrImg').src = qrImage
  document.getElementById('orderBankTransferOverlay').classList.remove('hidden')
  document.body.style.overflow = 'hidden'
  startOrderPaymentPolling(orderCode)
}

function closeOrderBankTransferModal() {
  document.getElementById('orderBankTransferOverlay').classList.add('hidden')
  stopOrderPaymentPolling()
  pendingBankTransferOrder = null
  document.body.style.overflow = ''
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
  setTimeout(() => {
    overlay.classList.add('hidden')
    overlay.classList.remove('flex')
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

// Event delegation for copy buttons
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('copy-btn') && e.target.dataset.copy) {
    copyText(e.target.dataset.copy)
  }
})

// Load bestsellers on page start
loadBestSellers()


function openTopupModal() {
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
