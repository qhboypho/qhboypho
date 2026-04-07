export function adminFlashSaleScript(): string {
  return `let flashSaleCreateSelectedItems = []
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
`
}
