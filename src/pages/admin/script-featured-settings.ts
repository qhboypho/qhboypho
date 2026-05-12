export function adminFeaturedSettingsScript(): string {
  return `let allProductsForFeatured = []
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
  const tokenInput = document.getElementById('ghtkToken')
  const clientSourceInput = document.getElementById('ghtkClientSource')
  const credentialHint = document.getElementById('ghtkCredentialHint')
  if (tokenInput) tokenInput.value = cfg.token || ''
  if (clientSourceInput) clientSourceInput.value = cfg.clientSource || ''
  if (credentialHint) {
    credentialHint.textContent = cfg.token && cfg.clientSource
      ? 'Đã có key GHTK lưu trong cấu hình.'
      : 'Thiếu token hoặc client source thì đồng bộ GHTK sẽ báo MISSING_GHTK_KEYS.'
  }
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

const DEFAULT_MARQUEE_NOTIFICATION_TEXT = 'Mua hàng tại đây không qua sàn thương mại nên giá thành sản phẩm sẽ rẻ hơn rất nhiều và bảo hành hoàn trả trong vòng 7 ngày nếu sản phẩm bị lỗi nên quý khách yên tâm mua sắm nhé.Bảo hành đổi trả nhắn qua trang facebook : QH Boypho. Chúc quý khách có trải nghiệm mua sắm tốt tại QH Clothes'

function normalizeMarqueeSpeed(value) {
  const n = Number(value || 48)
  if (!Number.isFinite(n)) return 48
  return Math.min(120, Math.max(8, Math.round(n)))
}

function renderAdminMarqueePreview(text, speedSeconds) {
  const track = document.getElementById('adminMarqueePreviewTrack')
  if (!track) return
  const safeText = String(text || DEFAULT_MARQUEE_NOTIFICATION_TEXT).trim() || DEFAULT_MARQUEE_NOTIFICATION_TEXT
  const speed = normalizeMarqueeSpeed(speedSeconds)
  track.innerHTML = ''
  for (let i = 0; i < 3; i++) {
    const group = document.createElement('div')
    group.className = 'storefront-marquee-group'
    const icon = document.createElement('i')
    icon.className = 'fas fa-bullhorn storefront-marquee-icon'
    icon.setAttribute('aria-hidden', 'true')
    const span = document.createElement('span')
    span.className = 'storefront-marquee-text'
    span.textContent = safeText
    group.appendChild(icon)
    group.appendChild(span)
    track.appendChild(group)
  }
  track.style.setProperty('--storefront-marquee-duration', speed + 's')
}

function updateMarqueeCounter() {
  const text = document.getElementById('marqueeNotificationText')?.value || ''
  const counter = document.getElementById('marqueeTextCounter')
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
  const text = document.getElementById('marqueeNotificationText')?.value || ''
  updateMarqueeCounter()
  renderAdminMarqueePreview(text, speed)
}

function setNotificationQuickText(value) {
  const text = document.getElementById('marqueeNotificationText')
  if (!text) return
  text.value = String(value || '').slice(0, 600)
  previewNotificationSettings()
  text.focus()
}

function clearNotificationText() {
  const text = document.getElementById('marqueeNotificationText')
  if (!text) return
  text.value = ''
  previewNotificationSettings()
  text.focus()
}

function previewNotificationSettings() {
  const text = document.getElementById('marqueeNotificationText')?.value || ''
  const speed = updateMarqueeSpeedControls(document.getElementById('marqueeSpeedSeconds')?.value || 48)
  updateMarqueeCounter()
  renderAdminMarqueePreview(text, speed)
}

function fillNotificationSettings(cfg) {
  const text = document.getElementById('marqueeNotificationText')
  const speed = document.getElementById('marqueeSpeedSeconds')
  if (text) text.value = cfg.marquee_text || DEFAULT_MARQUEE_NOTIFICATION_TEXT
  if (speed) speed.value = String(normalizeMarqueeSpeed(cfg.marquee_speed_seconds || 48))
  updateMarqueeSpeedControls(cfg.marquee_speed_seconds || 48)
  previewNotificationSettings()
}

async function loadNotificationSettings() {
  try {
    const res = await axios.get('/api/admin/settings/notifications')
    fillNotificationSettings(res.data.data || {})
  } catch (e) {
    fillNotificationSettings({})
    showAdminToast('Lỗi tải cài đặt thông báo', 'error')
  }
}

async function saveNotificationSettings() {
  const btn = document.getElementById('saveNotificationSettingsBtn')
  const payload = {
    marquee_text: String(document.getElementById('marqueeNotificationText')?.value || '').trim(),
    marquee_speed_seconds: normalizeMarqueeSpeed(document.getElementById('marqueeSpeedSeconds')?.value || 48)
  }
  if (btn) {
    btn.disabled = true
    btn.innerHTML = '<i class="fas fa-spinner fa-spin text-amber-500"></i>Đang lưu...'
  }
  try {
    await axios.put('/api/admin/settings/notifications', payload)
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
