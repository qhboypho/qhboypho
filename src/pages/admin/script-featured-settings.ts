export function adminFeaturedSettingsScript(): string {
  return `let allProductsForFeatured = []
let featuredOrderMap = {} // { productId: displayOrder }
let customShippingCarriers = []

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
          <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[\\'\\'] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-400"></div>
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
  countEl.innerHTML = \`<i class="fas fa-star mr-1"></i>\${featured.length} mặt hàng nổi bật\`

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
async function loadSettingsAdmin(options = {}) {
  try {
    const pickupRes = await axios.get('/api/admin/ghtk/pickup-config')
    const pickupCfg = pickupRes.data.data || {}
    fillGhtkPickupConfig(pickupCfg)
    if (options.syncPickup !== false) {
      await syncGhtkPickupAddresses(true, pickupCfg.pickAddressId || '')
    }
  } catch (e) {
    showAdminToast('Lỗi tải dữ liệu cài đặt kho GHTK', 'error')
  }
}

function fillGhtkPickupConfig(cfg) {
  const tokenInput = document.getElementById('ghtkToken')
  const clientSourceInput = document.getElementById('ghtkClientSource')
  const credentialHint = document.getElementById('ghtkCredentialHint')
  const spx = cfg.spx || {}
  const spxUserIdInput = document.getElementById('spxUserId')
  const spxSecretKeyInput = document.getElementById('spxSecretKey')
  const spxAccountIdInput = document.getElementById('spxAccountId')
  const spxCredentialHint = document.getElementById('spxCredentialHint')
  const ghn = cfg.ghn || {}
  const ghnTokenInput = document.getElementById('ghnToken')
  const ghnShopIdInput = document.getElementById('ghnShopId')
  const ghnClientIdInput = document.getElementById('ghnClientId')
  const ghnCredentialHint = document.getElementById('ghnCredentialHint')
  if (tokenInput) tokenInput.value = cfg.token || ''
  if (clientSourceInput) clientSourceInput.value = cfg.clientSource || ''
  if (credentialHint) {
    credentialHint.textContent = cfg.token && cfg.clientSource
      ? 'Đã có key GHTK lưu trong cấu hình.'
      : 'Thiếu token hoặc client source thì đồng bộ GHTK sẽ báo MISSING_GHTK_KEYS.'
  }
  if (spxUserIdInput) spxUserIdInput.value = spx.userId || ''
  if (spxSecretKeyInput) spxSecretKeyInput.value = spx.secretKey || ''
  if (spxAccountIdInput) spxAccountIdInput.value = spx.accountId || ''
  if (spxCredentialHint) {
    spxCredentialHint.textContent = spx.userId && spx.secretKey && spx.accountId
      ? 'Đã có key SPX Express lưu trong cấu hình.'
      : 'Thiếu User ID, Secret Key hoặc Account ID thì chưa thể bật tạo vận đơn SPX.'
  }
  if (ghnTokenInput) ghnTokenInput.value = ghn.token || ''
  if (ghnShopIdInput) ghnShopIdInput.value = ghn.shopId || ''
  if (ghnClientIdInput) ghnClientIdInput.value = ghn.clientId || ''
  if (ghnCredentialHint) {
    ghnCredentialHint.textContent = ghn.token && ghn.shopId
      ? 'Đã có key GHN lưu trong cấu hình.'
      : 'Thiếu API token hoặc Shop ID thì chưa thể tạo vận đơn GHN.'
  }
  renderShippingCarrierRegistry(cfg.shipping_carriers || [])
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
    ghtk_token: document.getElementById('ghtkToken')?.value.trim() || '',
    ghtk_client_source: document.getElementById('ghtkClientSource')?.value.trim() || '',
    spx_user_id: document.getElementById('spxUserId')?.value.trim() || '',
    spx_secret_key: document.getElementById('spxSecretKey')?.value.trim() || '',
    spx_account_id: document.getElementById('spxAccountId')?.value.trim() || '',
    ghn_token: document.getElementById('ghnToken')?.value.trim() || '',
    ghn_shop_id: document.getElementById('ghnShopId')?.value.trim() || '',
    ghn_client_id: document.getElementById('ghnClientId')?.value.trim() || '',
    shipping_carrier_enabled_codes: getEnabledShippingCarrierCodes(),
    shipping_carrier_custom_definitions: customShippingCarriers,
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
    if (typeof shippingCarrierOptionsLoaded !== 'undefined') shippingCarrierOptionsLoaded = false
    showAdminToast('Đã lưu cấu hình kho vận chuyển', 'success')
  } catch (e) {
    showAdminToast('Lưu cấu hình kho thất bại', 'error')
  } finally {
    btn.disabled = false
    btn.innerHTML = '<i class="fas fa-save"></i>Lưu cấu hình kho vận chuyển'
  }
}

function buildSocialPreviewUrl(platform, rawHandle) {
  const handle = String(rawHandle || '').trim().replace(/^@+/, '')
  if (!handle) return ''
  if (platform === 'tiktok') return 'https://www.tiktok.com/@' + handle
  if (platform === 'shopee') return 'https://shopee.vn/' + handle.replace(/^\\/+|\\/+$/g, '')
  if (platform === 'facebook') return 'https://www.facebook.com/' + handle
  if (platform === 'threads') return 'https://www.threads.net/@' + handle
  return ''
}

function previewSocialUrl(platform) {
  const input = document.getElementById('social' + platform.charAt(0).toUpperCase() + platform.slice(1) + 'Handle')
  const preview = document.getElementById('social' + platform.charAt(0).toUpperCase() + platform.slice(1) + 'Preview')
  if (!preview) return
  const url = buildSocialPreviewUrl(platform, input ? input.value : '')
  preview.href = url || '#'
  preview.textContent = url || 'Chưa cấu hình'
  preview.classList.toggle('pointer-events-none', !url)
}

function fillSocialSettings(cfg) {
  document.getElementById('socialTiktokHandle').value = cfg.tiktok_handle || ''
  document.getElementById('socialShopeeHandle').value = cfg.shopee_handle || ''
  document.getElementById('socialFacebookHandle').value = cfg.facebook_handle || ''
  document.getElementById('socialThreadsHandle').value = cfg.threads_handle || ''
  ;['tiktok','shopee','facebook','threads'].forEach(previewSocialUrl)
}

async function loadSocialSettings() {
  try {
    const res = await axios.get('/api/admin/settings/social')
    fillSocialSettings(res.data.data || {})
  } catch (e) {
    showAdminToast('Lỗi tải cấu hình MXH', 'error')
  }
}

async function saveSocialSettings() {
  const btn = document.getElementById('saveSocialSettingsBtn')
  const payload = {
    tiktok_handle: document.getElementById('socialTiktokHandle').value.trim(),
    shopee_handle: document.getElementById('socialShopeeHandle').value.trim(),
    facebook_handle: document.getElementById('socialFacebookHandle').value.trim(),
    threads_handle: document.getElementById('socialThreadsHandle').value.trim(),
  }
  btn.disabled = true
  btn.innerHTML = '<i class=\"fas fa-spinner fa-spin\"></i> Đang lưu...'
  try {
    await axios.put('/api/admin/settings/social', payload)
    showAdminToast('Đã lưu cấu hình MXH', 'success')
    await loadSocialSettings()
  } catch (e) {
    showAdminToast('Lưu cấu hình MXH thất bại', 'error')
  } finally {
    btn.disabled = false
    btn.innerHTML = '<i class=\"fas fa-save\"></i>Lưu cấu hình MXH'
  }
}

function syncPaymentSettingsSwitch(enabled) {
  const input = document.getElementById('walletTopupEnabledSwitch')
  const label = document.getElementById('walletTopupSwitchLabel')
  const status = document.getElementById('paymentSettingsStatus')
  const isEnabled = enabled !== false
  if (input) input.checked = isEnabled
  if (label) {
    label.textContent = isEnabled ? 'Đang bật' : 'Đang tắt'
    label.className = 'text-sm font-semibold ' + (isEnabled ? 'text-emerald-600' : 'text-gray-500')
  }
  if (status) {
    status.className = 'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ' + (isEnabled ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500')
    status.innerHTML = '<i class="fas ' + (isEnabled ? 'fa-circle-check' : 'fa-circle-pause') + '"></i>' + (isEnabled ? 'Nạp ví đang bật' : 'Nạp ví đang tắt')
  }
}

async function loadPaymentSettings() {
  try {
    const res = await axios.get('/api/admin/settings/payment')
    syncPaymentSettingsSwitch((res.data.data || {}).wallet_topup_enabled !== false)
  } catch (e) {
    showAdminToast('Lỗi tải cấu hình thanh toán', 'error')
    syncPaymentSettingsSwitch(true)
  }
}

async function savePaymentSettings() {
  const input = document.getElementById('walletTopupEnabledSwitch')
  const enabled = !!(input && input.checked)
  syncPaymentSettingsSwitch(enabled)
  try {
    await axios.put('/api/admin/settings/payment', { wallet_topup_enabled: enabled })
    showAdminToast(enabled ? 'Đã bật nạp tiền vào ví' : 'Đã tắt nạp tiền vào ví', 'success')
    await loadPaymentSettings()
  } catch (e) {
    showAdminToast('Lưu cấu hình thanh toán thất bại', 'error')
    await loadPaymentSettings()
  }
}

function normalizeAdminCarrierCode(value) {
  return String(value || '').trim().toUpperCase().replace(/[^A-Z0-9_]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 24)
}

function escapeCarrierHtml(text) {
  const div = document.createElement('div')
  div.textContent = String(text || '')
  return div.innerHTML
}

function renderShippingCarrierRegistry(carriers) {
  const list = document.getElementById('shippingCarrierRegistryList')
  if (!list) return
  const rows = Array.isArray(carriers) && carriers.length
    ? carriers
    : [
      { code: 'GHTK', label: 'GHTK', enabled: true, builtIn: true },
      { code: 'SPX', label: 'SPX Express', enabled: true, builtIn: true },
      { code: 'GHN', label: 'GHN', enabled: true, builtIn: true }
    ]
  customShippingCarriers = rows.filter(item => !item.builtIn).map(item => ({
    code: normalizeAdminCarrierCode(item.code),
    label: String(item.label || item.code || '').trim(),
    enabled: item.enabled !== false
  }))
  list.innerHTML = rows.map(item => {
    const code = normalizeAdminCarrierCode(item.code)
    const checked = item.enabled !== false ? 'checked' : ''
    const removable = item.builtIn ? '' : '<button type="button" onclick="removeCustomShippingCarrier(\\'' + code + '\\')" class="text-xs font-semibold text-red-500 hover:text-red-600">Xóa</button>'
    return '<div class="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2">' +
      '<label class="flex items-center gap-3 min-w-0">' +
        '<input type="checkbox" id="shippingCarrierEnabled_' + code + '" class="rounded border-gray-300 text-pink-500 focus:ring-pink-400" ' + checked + '>' +
        '<span class="min-w-0"><span class="block text-sm font-bold text-gray-800">' + escapeCarrierHtml(item.label || code) + '</span><span class="block text-xs text-gray-400">' + code + (item.adapter === false ? ' · chưa có adapter API' : '') + '</span></span>' +
      '</label>' +
      removable +
    '</div>'
  }).join('')
}

function getEnabledShippingCarrierCodes() {
  const boxes = Array.from(document.querySelectorAll('[id^="shippingCarrierEnabled_"]'))
  return boxes.filter(box => box.checked).map(box => normalizeAdminCarrierCode(String(box.id || '').replace('shippingCarrierEnabled_', ''))).filter(Boolean)
}

function addCustomShippingCarrier() {
  const codeInput = document.getElementById('customShippingCarrierCode')
  const labelInput = document.getElementById('customShippingCarrierLabel')
  const code = normalizeAdminCarrierCode(codeInput?.value || '')
  const label = String(labelInput?.value || '').trim()
  if (!code || !label) {
    showAdminToast('Nhập mã và tên đơn vị vận chuyển trước', 'warning')
    return
  }
  if (['GHTK', 'SPX', 'GHN'].includes(code) || customShippingCarriers.some(item => item.code === code)) {
    showAdminToast('Mã đơn vị vận chuyển đã tồn tại', 'warning')
    return
  }
  customShippingCarriers.push({ code, label, enabled: true })
  const builtIns = ['GHTK', 'SPX', 'GHN'].map(code => ({
    code,
    label: code === 'SPX' ? 'SPX Express' : code,
    enabled: !!document.getElementById('shippingCarrierEnabled_' + code)?.checked,
    builtIn: true,
    adapter: true
  }))
  renderShippingCarrierRegistry(builtIns.concat(customShippingCarriers))
  if (codeInput) codeInput.value = ''
  if (labelInput) labelInput.value = ''
}

function removeCustomShippingCarrier(code) {
  const normalized = normalizeAdminCarrierCode(code)
  customShippingCarriers = customShippingCarriers.filter(item => item.code !== normalized)
  const rows = ['GHTK', 'SPX', 'GHN'].map(code => ({
    code,
    label: code === 'SPX' ? 'SPX Express' : code,
    enabled: !!document.getElementById('shippingCarrierEnabled_' + code)?.checked,
    builtIn: true,
    adapter: true
  })).concat(customShippingCarriers)
  renderShippingCarrierRegistry(rows)
}

const DEFAULT_MARQUEE_NOTIFICATION_TEXT = 'Mua hàng tại đây không qua sàn thương mại nên giá thành sản phẩm sẽ rẻ hơn rất nhiều và bảo hành hoàn trả trong vòng 7 ngày nếu sản phẩm bị lỗi nên quý khách yên tâm mua sắm nhé.Bảo hành đổi trả nhắn qua trang facebook : QH Boypho. Chúc quý khách có trải nghiệm mua sắm tốt tại QH Boypho'
const DEFAULT_HOT_TREND_NU_MARQUEE_NOTIFICATION_TEXT = 'Mua trực tiếp giá tốt hơn | Không qua sàn | Đổi trả 7 ngày'
let activeNotificationSegment = 'index'

function getNotificationSegmentDefaultText(segment) {
  return segment === 'hottrendnu' ? DEFAULT_HOT_TREND_NU_MARQUEE_NOTIFICATION_TEXT : DEFAULT_MARQUEE_NOTIFICATION_TEXT
}

function getActiveNotificationDefaultText() {
  return getNotificationSegmentDefaultText(activeNotificationSegment)
}

function normalizeMarqueeSpeed(value) {
  const n = Number(value || 48)
  if (!Number.isFinite(n)) return 48
  return Math.min(120, Math.max(8, Math.round(n)))
}

function parseMarqueeSegments(value) {
  const fallback = getActiveNotificationDefaultText()
  const raw = String(value || fallback)
  const lineBreak = String.fromCharCode(10)
  const segments = raw
    .replaceAll(String.fromCharCode(13), lineBreak)
    .replaceAll('|', lineBreak)
    .split(lineBreak)
    .map(item => item.trim())
    .filter(Boolean)
  return segments.length ? segments.slice(0, 12) : [fallback]
}

function syncMarqueeSegmentsFromInputs() {
  const text = document.getElementById('marqueeNotificationText')
  const inputs = Array.from(document.querySelectorAll('[data-marquee-segment-input]'))
  const value = inputs.map(input => String(input.value || '').trim()).filter(Boolean).join(' | ').slice(0, 600)
  if (text) text.value = value
  updateMarqueeCounter()
  return value
}

function renderMarqueeSegmentInputs(segments) {
  const list = document.getElementById('marqueeSegmentsList')
  if (!list) return
  list.innerHTML = ''
  const normalized = (Array.isArray(segments) && segments.length ? segments : ['']).slice(0, 12)
  normalized.forEach((segment, index) => {
    const row = document.createElement('div')
    row.className = 'flex min-w-0 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2'

    const handle = document.createElement('span')
    handle.className = 'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-cyan-300'
    handle.innerHTML = '<i class="fas fa-grip-lines" aria-hidden="true"></i>'

    const input = document.createElement('input')
    input.type = 'text'
    input.maxLength = 160
    input.value = String(segment || '')
    input.placeholder = 'Nhập một đoạn thông báo ngắn...'
    input.dataset.marqueeSegmentInput = '1'
    input.className = 'min-w-0 flex-1 rounded-xl border border-transparent bg-white px-3 py-2.5 text-sm font-bold text-slate-900 outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100'
    input.oninput = previewNotificationSettings

    const removeBtn = document.createElement('button')
    removeBtn.type = 'button'
    removeBtn.className = 'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-rose-100 bg-white text-rose-500 transition hover:bg-rose-50 disabled:opacity-40'
    removeBtn.innerHTML = '<i class="fas fa-trash" aria-hidden="true"></i>'
    removeBtn.disabled = normalized.length <= 1
    removeBtn.onclick = function () {
      row.remove()
      syncMarqueeSegmentsFromInputs()
      previewNotificationSettings()
    }

    row.appendChild(handle)
    row.appendChild(input)
    row.appendChild(removeBtn)
    list.appendChild(row)
  })
  syncMarqueeSegmentsFromInputs()
}

function setMarqueeSegmentsFromText(value) {
  renderMarqueeSegmentInputs(parseMarqueeSegments(value))
}

function addMarqueeSegment(value) {
  const current = parseMarqueeSegments(syncMarqueeSegmentsFromInputs())
  if (current.length >= 12) {
    showAdminToast('Tối đa 12 đoạn thông báo', 'warning')
    return
  }
  current.push(String(value || ''))
  renderMarqueeSegmentInputs(current)
  const inputs = document.querySelectorAll('[data-marquee-segment-input]')
  const last = inputs[inputs.length - 1]
  if (last) last.focus()
  previewNotificationSettings()
}

function getMarqueeIconClass(text) {
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

function appendMarqueeSegmentGroup(track, text) {
  const group = document.createElement('div')
  group.className = 'storefront-marquee-group'
  const icon = document.createElement('i')
  icon.className = getMarqueeIconClass(text)
  icon.setAttribute('aria-hidden', 'true')
  const span = document.createElement('span')
  span.className = 'storefront-marquee-text'
  span.textContent = text
  const separator = document.createElement('span')
  separator.className = 'storefront-marquee-separator'
  separator.setAttribute('aria-hidden', 'true')
  group.appendChild(icon)
  group.appendChild(span)
  group.appendChild(separator)
  track.appendChild(group)
}

function getAdminMarqueeFillWidth(track) {
  const bar = track?.closest?.('.storefront-marquee-bar')
  const barWidth = Number(bar?.clientWidth || bar?.getBoundingClientRect?.().width || 0)
  const viewportWidth = Number(window.innerWidth || document.documentElement.clientWidth || 0)
  return Math.max(barWidth, viewportWidth, 720) + 160
}

function fillAdminMarqueePattern(sequence, segments, minWidth) {
  let guard = 0
  while (sequence.scrollWidth < minWidth && guard < 80) {
    segments.forEach(segment => appendMarqueeSegmentGroup(sequence, segment))
    guard += 1
  }
}

function resolveAdminMarqueeDuration(speedSeconds, sequence) {
  const speed = normalizeMarqueeSpeed(speedSeconds)
  const sequenceWidth = Number(sequence?.scrollWidth || 0)
  const baselineWidth = 720
  const widthScale = sequenceWidth > baselineWidth ? sequenceWidth / baselineWidth : 1
  return Math.round(speed * widthScale)
}

function renderAdminMarqueePreview(text, speedSeconds) {
  const track = document.getElementById('adminMarqueePreviewTrack')
  if (!track) return
  const bar = track.closest('.storefront-marquee-bar')
  const segments = parseMarqueeSegments(text)
  const speed = normalizeMarqueeSpeed(speedSeconds)
  if (bar) bar.classList.remove('storefront-marquee-bar--static')
  track.innerHTML = ''
  track.className = 'storefront-marquee-track'
  track.style.removeProperty('animation')
  track.style.removeProperty('transform')
  track.style.removeProperty('width')
  track.style.removeProperty('--storefront-marquee-translate')
  const sequence = document.createElement('div')
  sequence.className = 'storefront-marquee-seq'
  segments.forEach(segment => appendMarqueeSegmentGroup(sequence, segment))
  track.appendChild(sequence)
  fillAdminMarqueePattern(sequence, segments, getAdminMarqueeFillWidth(track))
  const clone = sequence.cloneNode(true)
  clone.setAttribute('aria-hidden', 'true')
  track.appendChild(clone)
  track.style.setProperty('--storefront-marquee-duration', resolveAdminMarqueeDuration(speed, sequence) + 's')
}

function renderAdminStaticNotificationPreview(text) {
  const track = document.getElementById('adminMarqueePreviewTrack')
  if (!track) return
  const bar = track.closest('.storefront-marquee-bar')
  const fallback = getActiveNotificationDefaultText()
  const safeText = String(text || fallback).trim() || fallback
  if (bar) bar.classList.add('storefront-marquee-bar--static')
  track.innerHTML = ''
  track.className = 'storefront-marquee-track'
  track.style.animation = 'none'
  track.style.transform = 'none'
  track.style.width = '100%'
  track.style.removeProperty('--storefront-marquee-translate')
  const notice = document.createElement('div')
  notice.className = 'storefront-static-notice'
  const icon = document.createElement('i')
  icon.className = 'fas fa-bullhorn'
  icon.setAttribute('aria-hidden', 'true')
  const span = document.createElement('span')
  span.textContent = safeText
  notice.appendChild(icon)
  notice.appendChild(span)
  track.appendChild(notice)
}

function getNotificationDisplayMode() {
  const loopSwitch = document.getElementById('notificationLoopSwitch')
  if (loopSwitch) return loopSwitch.checked ? 'marquee' : 'static'
  const selected = document.querySelector('input[name="notificationDisplayMode"]:checked')
  return selected?.value === 'static' ? 'static' : 'marquee'
}

function setNotificationDisplayMode(mode) {
  const normalized = String(mode || '') === 'static' ? 'static' : 'marquee'
  const loopSwitch = document.getElementById('notificationLoopSwitch')
  const label = document.getElementById('notificationLoopSwitchLabel')
  const help = document.getElementById('notificationModeHelp')
  const marqueePanel = document.getElementById('marqueeContentPanel')
  const staticPanel = document.getElementById('staticNotificationPanel')
  if (loopSwitch) loopSwitch.checked = normalized === 'marquee'
  if (label) label.textContent = normalized === 'marquee' ? 'Chạy loop' : 'Hiển thị tĩnh'
  if (help) help.textContent = normalized === 'marquee' ? 'Đang bật chạy loop tự động cho PC và mobile.' : 'Đang tắt loop, storefront hiển thị nội dung tĩnh ở giữa.'
  if (marqueePanel) marqueePanel.classList.toggle('hidden', normalized === 'static')
  if (staticPanel) staticPanel.classList.toggle('hidden', normalized === 'marquee')
  const marquee = document.getElementById('notificationModeMarquee')
  const stat = document.getElementById('notificationModeStatic')
  if (marquee) marquee.checked = normalized === 'marquee'
  if (stat) stat.checked = normalized === 'static'
}

function toggleNotificationDisplayMode() {
  setNotificationDisplayMode(getNotificationDisplayMode())
  previewNotificationSettings()
}

function updateMarqueeCounter() {
  const text = document.getElementById('marqueeNotificationText')?.value || ''
  const counter = document.getElementById('marqueeTextCounter')
  if (counter) counter.textContent = String(text.length) + '/600'
}

function updateStaticNotificationCounter() {
  const text = document.getElementById('staticNotificationText')?.value || ''
  const counter = document.getElementById('staticNotificationTextCounter')
  if (counter) counter.textContent = String(text.length) + '/600'
}

function updateMarqueeSpeedControls(speedValue) {
  const speed = normalizeMarqueeSpeed(speedValue)
  const numberInput = document.getElementById('marqueeSpeedSeconds')
  const rangeInput = document.getElementById('marqueeSpeedRange')
  const label = document.getElementById('marqueeSpeedLabel')
  if (numberInput && String(numberInput.value) !== String(speed)) numberInput.value = String(speed)
  if (rangeInput && String(rangeInput.value) !== String(speed)) rangeInput.value = String(speed)
  if (label) label.textContent = String(speed) + ' giây / vòng'
  return speed
}

function syncMarqueeSpeedFromRange() {
  const range = document.getElementById('marqueeSpeedRange')
  const speed = updateMarqueeSpeedControls(range?.value || 48)
  const text = syncMarqueeSegmentsFromInputs()
  updateMarqueeCounter()
  renderAdminMarqueePreview(text, speed)
}

function setNotificationQuickText(value) {
  const text = document.getElementById('marqueeNotificationText')
  if (!text) return
  text.value = String(value || '').slice(0, 600)
  setMarqueeSegmentsFromText(text.value)
  previewNotificationSettings()
  document.querySelector('[data-marquee-segment-input]')?.focus()
}

function clearNotificationText() {
  const text = document.getElementById('marqueeNotificationText')
  if (!text) return
  text.value = ''
  renderMarqueeSegmentInputs([''])
  previewNotificationSettings()
  document.querySelector('[data-marquee-segment-input]')?.focus()
}

function previewNotificationSettings() {
  const text = syncMarqueeSegmentsFromInputs()
  const staticText = document.getElementById('staticNotificationText')?.value || ''
  const mode = getNotificationDisplayMode()
  setNotificationDisplayMode(mode)
  const speed = updateMarqueeSpeedControls(document.getElementById('marqueeSpeedSeconds')?.value || 48)
  updateMarqueeCounter()
  updateStaticNotificationCounter()
  if (mode === 'static') {
    renderAdminStaticNotificationPreview(staticText || text)
  } else {
    renderAdminMarqueePreview(text, speed)
  }
  const caption = document.getElementById('notificationPreviewCaption')
  const storeName = document.getElementById('notificationPreviewStoreName')
  if (storeName) storeName.textContent = activeNotificationSegment === 'hottrendnu' ? 'QH Clothes' : 'QH Boypho'
  if (caption) caption.textContent = mode === 'static' ? 'Thông báo hiển thị tĩnh trên đầu trang.' : 'Thông báo chạy ngay khi trang được load.'
}

function fillNotificationSettings(cfg) {
  const text = document.getElementById('marqueeNotificationText')
  const staticText = document.getElementById('staticNotificationText')
  const speed = document.getElementById('marqueeSpeedSeconds')
  const fallback = getActiveNotificationDefaultText()
  if (text) text.value = cfg.marquee_text || fallback
  setMarqueeSegmentsFromText(cfg.marquee_text || fallback)
  if (staticText) staticText.value = cfg.static_notification_text || ''
  setNotificationDisplayMode(cfg.notification_display_mode || 'marquee')
  if (speed) speed.value = String(normalizeMarqueeSpeed(cfg.marquee_speed_seconds || 48))
  updateMarqueeSpeedControls(cfg.marquee_speed_seconds || 48)
  previewNotificationSettings()
}

function getNotificationSegmentApiSuffix() {
  return '?segment=' + encodeURIComponent(activeNotificationSegment)
}

function updateNotificationSegmentButtons() {
  const indexBtn = document.getElementById('notificationSegmentIndexBtn')
  const herBtn = document.getElementById('notificationSegmentHottrendnuBtn')
  if (indexBtn) indexBtn.classList.toggle('is-active', activeNotificationSegment === 'index')
  if (herBtn) herBtn.classList.toggle('is-active', activeNotificationSegment === 'hottrendnu')
}

function switchNotificationSegment(segment) {
  const normalized = String(segment || '').trim() === 'hottrendnu' ? 'hottrendnu' : 'index'
  if (activeNotificationSegment === normalized) return
  activeNotificationSegment = normalized
  updateNotificationSegmentButtons()
  loadNotificationSettings()
}

async function loadNotificationSettings() {
  try {
    updateNotificationSegmentButtons()
    const res = await axios.get('/api/admin/settings/notifications' + getNotificationSegmentApiSuffix())
    fillNotificationSettings(res.data.data || {})
  } catch (e) {
    fillNotificationSettings({})
    showAdminToast('Lỗi tải cài đặt thông báo', 'error')
  }
}

async function saveNotificationSettings() {
  const btn = document.getElementById('saveNotificationSettingsBtn')
  const marqueeText = syncMarqueeSegmentsFromInputs()
  const payload = {
    segment: activeNotificationSegment,
    marquee_text: String(marqueeText || '').trim(),
    marquee_speed_seconds: normalizeMarqueeSpeed(document.getElementById('marqueeSpeedSeconds')?.value || 48),
    notification_display_mode: getNotificationDisplayMode(),
    static_notification_text: String(document.getElementById('staticNotificationText')?.value || '').trim()
  }
  if (btn) {
    btn.disabled = true
    btn.innerHTML = '<i class="fas fa-spinner fa-spin text-amber-500"></i>Đang lưu...'
  }
  try {
    await axios.put('/api/admin/settings/notifications' + getNotificationSegmentApiSuffix(), payload)
    showAdminToast('Đã lưu cài đặt thông báo', 'success')
    await loadNotificationSettings()
  } catch (e) {
    showAdminToast('Lưu cài đặt thông báo thất bại', 'error')
  } finally {
    if (btn) {
      btn.disabled = false
      btn.innerHTML = '<i class="fas fa-save text-amber-500"></i>Lưu thông báo'
    }
  }
}

function getQuickOrderRiskNoteInputText() {
  return String(document.getElementById('quickOrderRiskNoteText')?.value || '').slice(0, 800)
}

function getTextUiSettingInputs() {
  return Array.from(document.querySelectorAll('[data-setting-key]'))
}

function getTextUiInputDefault(input) {
  return String(input?.dataset?.defaultText || '')
}

function getTextUiPayload() {
  const payload = {
    quick_order_risk_note_text: getQuickOrderRiskNoteInputText().trim()
  }
  getTextUiSettingInputs().forEach(input => {
    const key = input.dataset.settingKey
    if (!key) return
    payload[key] = input.type === 'checkbox' ? (input.checked ? '1' : '0') : String(input.value || '').trim()
  })
  return payload
}

function getQuickOrderRiskNoteDefaultText() {
  return String(document.getElementById('quickOrderRiskNoteText')?.dataset.defaultText || '')
}

function previewTextUiSettings() {
  const text = getQuickOrderRiskNoteInputText()
  const counter = document.getElementById('quickOrderRiskNoteCounter')
  const preview = document.getElementById('quickOrderRiskNotePreview')
  if (counter) counter.textContent = String(text.length) + '/800'
  if (preview) preview.textContent = text.trim() || getQuickOrderRiskNoteDefaultText()
}

function fillTextUiSettings(cfg) {
  const input = document.getElementById('quickOrderRiskNoteText')
  if (input) {
    input.value = String(cfg?.quick_order_risk_note_text || getQuickOrderRiskNoteDefaultText()).slice(0, 800)
  }
  getTextUiSettingInputs().forEach(input => {
    const key = input.dataset.settingKey
    if (!key) return
    if (input.type === 'checkbox') {
      input.checked = cfg?.[key] === true || cfg?.[key] === 1 || cfg?.[key] === '1'
      return
    }
    input.value = String(cfg?.[key] || getTextUiInputDefault(input)).slice(0, Number(input.maxLength) > 0 ? Number(input.maxLength) : 800)
  })
  previewTextUiSettings()
}

async function loadTextUiSettings() {
  try {
    const res = await axios.get('/api/admin/settings/text-ui')
    fillTextUiSettings(res.data.data || {})
  } catch (e) {
    fillTextUiSettings({})
    showAdminToast('Lỗi tải Text UI', 'error')
  }
}

function resetQuickOrderRiskNoteDefault() {
  const input = document.getElementById('quickOrderRiskNoteText')
  if (!input) return
  input.value = getQuickOrderRiskNoteDefaultText()
  previewTextUiSettings()
  input.focus()
}

async function saveTextUiSettings() {
  const btn = document.getElementById('saveTextUiSettingsBtn')
  const payload = getTextUiPayload()
  if (btn) {
    btn.disabled = true
    btn.innerHTML = '<i class="fas fa-spinner fa-spin text-pink-500"></i>Đang lưu...'
  }
  try {
    await axios.put('/api/admin/settings/text-ui', payload)
    showAdminToast('Đã lưu Text UI', 'success')
    await loadTextUiSettings()
  } catch (e) {
    showAdminToast('Lưu Text UI thất bại', 'error')
  } finally {
    if (btn) {
      btn.disabled = false
      btn.innerHTML = '<i class="fas fa-save text-pink-500"></i>Lưu Text UI'
    }
  }
}

function getImageSettingUrl(idBase) {
  return String(document.getElementById(idBase + 'Url')?.value || '').trim()
}

function previewImageSetting(idBase) {
  const url = getImageSettingUrl(idBase)
  const img = document.getElementById(idBase + 'Preview')
  const placeholder = document.getElementById(idBase + 'Placeholder')
  if (!img || !placeholder) return
  if (url) {
    img.src = url
    img.classList.remove('hidden')
    placeholder.classList.add('hidden')
  } else {
    img.src = ''
    img.classList.add('hidden')
    placeholder.classList.remove('hidden')
  }
}

function fillImageSettings(cfg) {
  const input = document.getElementById('homeTrendingBannerImageUrl')
  if (input) input.value = cfg.home_trending_banner_image || ''
  const subtitle = document.getElementById('homeTrendingBannerSubtitle')
  const title = document.getElementById('homeTrendingBannerTitle')
  if (subtitle) subtitle.value = cfg.home_trending_banner_subtitle || ''
  if (title) title.value = cfg.home_trending_banner_title || ''
  previewImageSetting('homeTrendingBannerImage')
}

async function loadImageSettings() {
  try {
    const res = await axios.get('/api/admin/settings/images')
    fillImageSettings(res.data.data || {})
  } catch (e) {
    showAdminToast('Lỗi tải cài đặt ảnh', 'error')
  }
}

async function uploadHomeTrendingBannerImage(input) {
  const file = Array.from(input.files || []).find(f => f.type && f.type.startsWith('image/'))
  if (!file) return
  const urlInput = document.getElementById('homeTrendingBannerImageUrl')
  try {
    const url = await uploadProductImageFile(file, 1400, 0.86, 'settings')
    if (urlInput) urlInput.value = url
    previewImageSetting('homeTrendingBannerImage')
    showAdminToast('Đã upload ảnh cài đặt', 'success')
  } catch (e) {
    showAdminToast('Upload ảnh cài đặt thất bại', 'error')
  } finally {
    input.value = ''
  }
}

function clearHomeTrendingBannerImage() {
  const input = document.getElementById('homeTrendingBannerImageUrl')
  if (input) input.value = ''
  previewImageSetting('homeTrendingBannerImage')
}

async function saveImageSettings() {
  const btn = document.getElementById('saveImageSettingsBtn')
  const payload = {
    home_trending_banner_image: getImageSettingUrl('homeTrendingBannerImage'),
    home_trending_banner_subtitle: String(document.getElementById('homeTrendingBannerSubtitle')?.value || '').trim(),
    home_trending_banner_title: String(document.getElementById('homeTrendingBannerTitle')?.value || '').trim()
  }
  if (btn) {
    btn.disabled = true
    btn.innerHTML = '<i class="fas fa-spinner fa-spin text-pink-500"></i>Đang lưu...'
  }
  try {
    await axios.put('/api/admin/settings/images', payload)
    showAdminToast('Đã lưu cài đặt ảnh', 'success')
    await loadImageSettings()
  } catch (e) {
    showAdminToast('Lưu cài đặt ảnh thất bại', 'error')
  } finally {
    if (btn) {
      btn.disabled = false
      btn.innerHTML = '<i class="fas fa-save text-pink-500"></i>Lưu cài đặt ảnh'
    }
  }
}


// ── DASHBOARD ─────────────────────────────────────
`
}
