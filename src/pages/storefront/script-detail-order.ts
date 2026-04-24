export function storefrontDetailOrderScript(): string {
  return `async function showDetail(id) {
  try {
    const res = await axios.get('/api/products/' + id)
    const p = res.data.data
    const colorOptions = getProductColorOptions(p)
    detailColorOptions = Array.isArray(colorOptions) ? colorOptions : []
    detailSelectedProductId = Number(p.id || id)
    detailSelectedColorIndex = -1
    detailSelectedColor = ''
    detailSelectedColorImage = ''
    detailSelectedSize = ''
    const sizes = safeJson(p.sizes)
    const images = safeJson(p.images)
    const defaultMainImage = String(p.thumbnail || detailColorOptions[0]?.image || images[0] || '').trim()
    const flashMeta = getFlashSaleMeta(p)
    const detailDisplayPrice = Number(flashMeta?.salePrice || p.display_price || p.price || 0)
    const detailDisplayOriginalPrice = Number(flashMeta?.basePrice || p.display_original_price || p.original_price || detailDisplayPrice)
    const discount = flashMeta ? Number(flashMeta.discountPercent || 0) : (p.original_price ? Math.round((1 - p.price/p.original_price)*100) : 0)
    document.getElementById('detailContent').innerHTML = \`
    <div class="grid md:grid-cols-2 gap-6">
      <div>
        <img id="mainDetailImg" src="\${defaultMainImage}" alt="\${p.name}" class="w-full rounded-2xl h-80 object-cover mb-3">
        <div class="img-gallery grid grid-cols-4 gap-2">
          \${[p.thumbnail, ...images].filter((v,i,a)=>v&&a.indexOf(v)===i).slice(0,8).map(img => \`
          <img src="\${img}" alt="" class="w-full h-16 object-cover rounded-lg border-2 border-transparent hover:border-pink-400"
            onclick="document.getElementById('mainDetailImg').src='\${img}'">\`).join('')}
        </div>
        <!-- Reviews section - only shown when logged in -->
        <div id="detailReviewsSection" class="review-section \${currentUser ? '' : 'hidden'}">
          <div id="detailReviewsContent"><div class="flex items-center gap-2 py-3"><i class="fas fa-spinner fa-spin text-violet-400 text-sm"></i><span class="text-sm text-gray-400">Đang tải đánh giá...</span></div></div>
        </div>
      </div>
      <div>
        \${p.brand ? \`<p class="text-sm text-pink-500 font-medium mb-1">\${p.brand}</p>\` : ''}
        <h2 class="font-display text-2xl font-bold text-gray-900 mb-3">\${p.name}</h2>
        \${p.has_flash_sale ? \`<div class="flex flex-wrap items-center gap-2 mb-3"><span class="flash-sale-badge"><i class="fas fa-bolt"></i> Flash Sale</span><span class="flash-sale-countdown" data-flash-sale-ends-at="\${flashMeta?.endsAt || ''}">\${formatFlashSaleCountdown(flashMeta?.endsAt || '')}</span></div>\` : ''}
        <div class="flex items-baseline gap-3 mb-4">
          <span class="text-3xl font-bold text-gradient-price">\${fmtPrice(detailDisplayPrice)}</span>
          \${detailDisplayOriginalPrice > detailDisplayPrice ? \`<span class="text-gray-400 line-through">\${fmtPrice(detailDisplayOriginalPrice)}</span><span class="badge-sale text-white text-xs px-2 py-1 rounded-full">-\${discount}%</span>\` : ''}
        </div>
        \${p.description ? \`<p class="text-gray-600 text-sm leading-relaxed mb-4">\${p.description}</p>\` : ''}
        \${p.material ? \`<p class="text-sm text-gray-500 mb-4"><strong>Chất liệu:</strong> \${p.material}</p>\` : ''}
        \${detailColorOptions.length ? \`
        <div class="mb-4">
          <p class="text-sm font-semibold mb-2">Màu sắc: <span class="text-pink-500" id="detailColorLabel"></span></p>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3" id="detailColorGrid">
            \${detailColorOptions.map((item, idx) => \`<button type="button"
              class="detail-color-card group overflow-hidden rounded-2xl border-2 border-gray-200 bg-white text-left transition hover:border-pink-300 hover:shadow-sm"
              onclick="selectDetailColorByIndex(\${idx}, this)">
              <div class="relative aspect-square bg-gray-100 overflow-hidden">
                \${item.image
                  ? \`<img src="\${item.image}" alt="\${item.name}" class="w-full h-full object-cover transition duration-300 group-hover:scale-[1.02]">\`
                  : \`<div class="w-full h-full flex items-center justify-center text-gray-300 text-xs">Không có ảnh</div>\`}
              </div>
              <div class="px-2.5 py-2 text-center">
                <span class="block text-sm font-medium text-gray-900 leading-tight">\${item.name}</span>
              </div>
            </button>\`).join('')}
          </div>
        </div>\` : ''}
        \${sizes.length ? \`
        <div class="mb-6">
          <p class="text-sm font-semibold mb-2">Size:</p>
          <div class="flex flex-wrap gap-2">
            \${sizes.map(s => \`<button class="size-btn w-12 h-10 border rounded-lg text-sm font-medium hover:border-pink-400 transition" onclick="selectDetailSize('\${s}',this)">\${s}</button>\`).join('')}
          </div>
        </div>\` : ''}
        <button onclick="closeDetail();collapseBanners();openOrder(\${p.id})" class="btn-primary w-full text-white py-3.5 rounded-xl font-bold text-base">
          <i class="fas fa-shopping-cart mr-2"></i>Đặt hàng ngay
        </button>
      </div>
    </div>\`
    document.getElementById('detailOverlay').classList.remove('hidden')
    document.body.style.overflow = 'hidden'
    startFlashSaleCountdownTicker()
    if (detailColorOptions.length) {
      const initialButton = document.querySelector('#detailColorGrid .detail-color-card')
      if (initialButton) selectDetailColorByIndex(0, initialButton)
    } else {
      const label = document.getElementById('detailColorLabel')
      if (label) label.textContent = ''
    }
    // Load reviews (only if user is logged in)
    if (typeof currentUser !== 'undefined' && currentUser) loadProductReviews(Number(p.id))
  } catch(e) { showToast('Không thể tải chi tiết sản phẩm', 'error') }
}

function selectDetailColorByIndex(idx, btn) {
  const item = Array.isArray(detailColorOptions) ? detailColorOptions[idx] : null
  if (!item) return
  detailSelectedColorIndex = idx
  detailSelectedColor = String(item.name || '').trim()
  detailSelectedColorImage = String(item.image || '').trim() || String(document.getElementById('mainDetailImg')?.src || '').trim()
  const mainImg = document.getElementById('mainDetailImg')
  if (mainImg && detailSelectedColorImage) mainImg.src = detailSelectedColorImage
  const label = document.getElementById('detailColorLabel')
  if (label) label.textContent = detailSelectedColor
  document.querySelectorAll('.detail-color-card').forEach(b => b.classList.remove('border-pink-500','ring-2','ring-pink-100','shadow-sm'))
  if (btn) btn.classList.add('border-pink-500','ring-2','ring-pink-100','shadow-sm')
}
function selectDetailSize(s, btn) {
  detailSelectedSize = String(s || '').trim()
  const group = btn?.closest('.flex')
  if (group) {
    group.querySelectorAll('button').forEach(b => b.classList.remove('active','bg-gray-900','text-white'))
  }
  if (btn) btn.classList.add('active','bg-gray-900','text-white')
}
function closeDetail() {
  document.getElementById('detailOverlay').classList.add('hidden')
  document.body.style.overflow = ''
}

// ── ORDER POPUP ────────────────────────────────────
async function openOrder(id) {
  try {
    await ensureAddressKitReady()
    const res = await axios.get('/api/products/' + id)
    currentProduct = res.data.data
    orderQty = 1
    selectedColor = ''
    selectedColorImage = String(currentProduct.thumbnail || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400')
    selectedSize = ''
    selectedPaymentMethod = ''
    appliedVoucher = null

    document.getElementById('orderProductImg').src = selectedColorImage
    document.getElementById('orderProductName').textContent = currentProduct.name
    document.getElementById('orderProductPrice').textContent = fmtPrice(currentProduct.price)
    document.getElementById('qtyDisplay').textContent = '1'
    document.getElementById('orderName').value = ''
    document.getElementById('orderPhone').value = ''
    await applySavedAddressToScope('order')
    document.getElementById('orderNote').value = ''
    document.getElementById('orderVoucher').value = ''
    document.getElementById('voucherStatus').classList.add('hidden')
    document.getElementById('discountRow').classList.add('hidden')
    document.getElementById('subtotalRow').classList.add('hidden')
    resetCheckoutPaymentMethod('order')
    // Clear field errors
    ;['fieldName','fieldPhone','fieldAddress','fieldColor','sizeSection','fieldPaymentMethod'].forEach(id => {
      document.getElementById(id)?.classList.remove('field-error','shake')
    })
    updateOrderTotal()

    // Colors
    const colorOptions = getProductColorOptions(currentProduct)
    orderColorOptions = Array.isArray(colorOptions) ? colorOptions : []
    const colorDiv = document.getElementById('colorOptions')
    colorDiv.innerHTML = orderColorOptions.length ? orderColorOptions.map((item, idx) => \`
      <button class="color-btn px-3 py-1.5 border rounded-lg text-sm hover:border-pink-400 transition inline-flex items-center gap-2"
        onclick="selectOrderColorByIndex(\${idx}, this)">
        \${item.image ? \`<img src="\${item.image}" alt="" class="w-5 h-5 rounded-md object-cover border border-gray-200">\` : '<span class="w-5 h-5 rounded-md bg-gray-100 border border-gray-200"></span>'}
        <span>\${item.name}</span>
      </button>
    \`).join('') : '<p class="text-gray-400 text-sm">Không có lựa chọn màu</p>'
    const shouldPrefillFromDetail = Number(detailSelectedProductId || 0) === Number(currentProduct?.id || 0) && detailSelectedColor
    if (shouldPrefillFromDetail) {
      const matchedIndex = orderColorOptions.findIndex((item) => String(item.name || '').trim().toLowerCase() === String(detailSelectedColor || '').trim().toLowerCase())
      if (matchedIndex >= 0) {
        const btn = colorDiv.querySelectorAll('.color-btn')[matchedIndex]
        selectOrderColorByIndex(matchedIndex, btn || null)
      }
    }

    // Sizes
    const sizes = safeJson(currentProduct.sizes)
    const sizeDiv = document.getElementById('sizeOptions')
    sizeDiv.innerHTML = sizes.length ? sizes.map(s => \`
      <button class="size-btn px-3 py-1.5 border rounded-lg text-sm font-medium hover:border-pink-400 transition" onclick="selectOrderSize('\${s}',this)">\${s}</button>
    \`).join('') : '<p class="text-gray-400 text-sm">Không có size</p>'
    document.getElementById('sizeSection').style.display = sizes.length ? '' : 'none'
    const shouldPrefillSizeFromDetail = Number(detailSelectedProductId || 0) === Number(currentProduct?.id || 0) && detailSelectedSize
    if (shouldPrefillSizeFromDetail) {
      const matchedSizeIndex = sizes.findIndex((s) => String(s || '').trim().toLowerCase() === String(detailSelectedSize || '').trim().toLowerCase())
      if (matchedSizeIndex >= 0) {
        const btn = sizeDiv.querySelectorAll('.size-btn')[matchedSizeIndex]
        selectOrderSize(String(sizes[matchedSizeIndex] || ''), btn || null)
      }
    }

    document.getElementById('orderOverlay').classList.remove('hidden')
    document.body.style.overflow = 'hidden'
  } catch(e) { showToast('Lỗi khi tải sản phẩm', 'error') }
}

function selectOrderColor(c, colorImage, btn) {
  document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active','bg-pink-50','border-pink-400','text-pink-600'))
  if (btn) btn.classList.add('active','bg-pink-50','border-pink-400','text-pink-600')
  selectedColor = c
  selectedColorImage = String(colorImage || '').trim() || getSelectedColorImageFromProduct(currentProduct, c) || (currentProduct?.thumbnail || '')
  const preview = document.getElementById('orderProductImg')
  if (preview && selectedColorImage) preview.src = selectedColorImage
  document.getElementById('fieldColor')?.classList.remove('field-error','shake')
}

function selectOrderColorByIndex(idx, btn) {
  const item = Array.isArray(orderColorOptions) ? orderColorOptions[idx] : null
  if (!item) return
  selectOrderColor(String(item.name || ''), String(item.image || ''), btn)
}
function selectOrderSize(s, btn) {
  document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active','bg-gray-900','text-white','border-gray-900'))
  if (btn) btn.classList.add('active','bg-gray-900','text-white','border-gray-900')
  selectedSize = s
  document.getElementById('sizeSection')?.classList.remove('field-error','shake')
}
function selectPaymentMethod(method, btn) {
  selectCheckoutPaymentMethod('order', method, btn)
}
function isPopupTabAlive(tab) {
  try { return !!(tab && !tab.closed) } catch (_) { return false }
}
function openOrReuseZaloPayLinkTab() {
  if (isPopupTabAlive(zaloPayLinkTab)) {
    try { zaloPayLinkTab.focus() } catch (_) { }
    return zaloPayLinkTab
  }
  let tab = null
  try { tab = window.open('https://zalopay.vn/', '_blank') } catch (_) { tab = null }
  zaloPayLinkTab = tab
  return tab
}

async function ensureZaloPayConfigReady(showMessage) {
  try {
    const res = await axios.get('/api/payments/zalopay/config')
    const ready = !!res.data?.data?.ready
    const missing = Array.isArray(res.data?.data?.missing) ? res.data.data.missing : []
    if (ready) return { ready: true, missing: [] }
    if (showMessage) {
      const detail = missing.length ? (': ' + missing.join(', ')) : ''
      showToast('ZaloPay chua cau hinh day du' + detail, 'error', 5500)
    }
    return { ready: false, missing }
  } catch (_) {
    if (showMessage) showToast('Khong kiem tra duoc cau hinh ZaloPay. Thu lai sau.', 'error', 5000)
    return { ready: false, missing: [] }
  }
}

function openZaloPayLink(evt) {
  if (evt) {
    evt.preventDefault()
    evt.stopPropagation()
  }
  const zaloBtn = Array.from(document.querySelectorAll('.payment-method-btn')).find(function (btn) {
    return String(btn.getAttribute('onclick') || '').indexOf("'ZALOPAY'") >= 0
  })
  if (zaloBtn) selectPaymentMethod('ZALOPAY', zaloBtn)
  const tab = openOrReuseZaloPayLinkTab()
  if (tab) {
    showToast('Da mo ZaloPay. Bam Dat ngay de tao QR thanh toan.', 'success', 4500)
    return
  }
  const fallback = window.open('https://zalopay.vn/', '_blank')
  if (fallback) {
    showToast('Da mo trang ZaloPay.', 'success', 3500)
  } else {
    showToast('Trinh duyet dang chan popup, hay cho phep popup roi thu lai.', 'error', 4000)
  }
}
function changeQty(d) {
  orderQty = Math.max(1, Math.min(99, orderQty + d))
  document.getElementById('qtyDisplay').textContent = orderQty
  updateOrderTotal()
}
function updateOrderTotal() {
  if (!currentProduct) return
  const subtotal = currentProduct.price * orderQty
  const discount = appliedVoucher ? appliedVoucher.discount_amount : 0
  const total = Math.max(0, subtotal - discount)
  document.getElementById('orderTotal').textContent = fmtPrice(total)
  if (appliedVoucher) {
    document.getElementById('orderSubtotal').textContent = fmtPrice(subtotal)
    document.getElementById('orderDiscount').textContent = '-' + fmtPrice(discount)
    document.getElementById('subtotalRow').classList.remove('hidden')
    document.getElementById('discountRow').classList.remove('hidden')
  } else {
    document.getElementById('subtotalRow').classList.add('hidden')
    document.getElementById('discountRow').classList.add('hidden')
  }
}
function closeOrder() {
  document.getElementById('orderOverlay').classList.add('hidden')
  document.body.style.overflow = ''
}

function resolveFlyImage(product) {
  if (!product) return 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200'
  const imgs = safeJson(product.images)
  return product.thumbnail || imgs[0] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200'
}

function animateFlyToCart(imgUrl, sourceEl) {
  const cartBtn = document.getElementById('cartNavBtn')
  if (!cartBtn) return
  const flyImg = imgUrl || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200'
  const fromRect = sourceEl ? sourceEl.getBoundingClientRect() : null
  const toRect = cartBtn.getBoundingClientRect()

  const chip = document.createElement('div')
  chip.className = 'cart-fly-chip'
  const startX = fromRect ? (fromRect.left + fromRect.width / 2 - 21) : (window.innerWidth / 2 - 21)
  const startY = fromRect ? (fromRect.top + fromRect.height / 2 - 21) : (window.innerHeight / 2 - 21)
  chip.style.left = startX + 'px'
  chip.style.top = startY + 'px'

  const img = document.createElement('img')
  img.src = flyImg
  img.onerror = () => { img.src = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200' }
  chip.appendChild(img)
  document.body.appendChild(chip)

  requestAnimationFrame(() => {
    const endX = toRect.left + toRect.width / 2 - 21
    const endY = toRect.top + toRect.height / 2 - 21
    chip.style.transform = 'translate(' + (endX - startX) + 'px, ' + (endY - startY) + 'px) scale(0.35)'
    chip.style.opacity = '0.1'
  })

  setTimeout(() => chip.remove(), 760)
}

// Add to cart from product card – always add directly, pick first color/size as default
async function addToCartFromCard(evt, id) {
  try {
    const res = await axios.get('/api/products/' + id)
    const p = res.data.data
    const colors = getProductColorOptions(p).map((c) => c.name)
    const sizes = safeJson(p.sizes)
    const color = colors.length > 0 ? colors[0] : ''
    const size = sizes.length > 0 ? sizes[0] : ''
    animateFlyToCart(resolveFlyImage(p), evt?.currentTarget || evt?.target || null)
    addToCart(p, color, size, 1)
    showToast('Đã thêm "' + p.name + '" vào giỏ hàng!', 'success', 2500)
  } catch(e) { showToast('Lỗi khi thêm vào giỏ', 'error') }
}

// ── VOUCHER ────────────────────────────────────────
async function applyVoucher() {
  const code = document.getElementById('orderVoucher').value.trim().toUpperCase()
  const statusEl = document.getElementById('voucherStatus')
  const btn = document.getElementById('voucherBtn')
  
  if (!code) {
    statusEl.className = 'mt-2 voucher-error rounded-xl px-3 py-2 text-sm text-red-600 font-medium'
    statusEl.innerHTML = '<i class="fas fa-times-circle mr-1"></i>Vui lòng nhập mã voucher'
    statusEl.classList.remove('hidden')
    return
  }
  
  btn.disabled = true
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'
  statusEl.classList.add('hidden')
  
  try {
    const res = await axios.post('/api/vouchers/validate', { code })
    appliedVoucher = res.data.data
    statusEl.className = 'mt-2 voucher-success rounded-xl px-3 py-2 text-sm text-green-700 font-semibold flex items-center gap-2'
    statusEl.innerHTML = \`<i class="fas fa-check-circle text-green-500"></i>Áp dụng thành công! Giảm <strong>\${fmtPrice(appliedVoucher.discount_amount)}</strong>\`
    statusEl.classList.remove('hidden')
    updateOrderTotal()
    document.getElementById('orderVoucher').classList.add('border-green-400','bg-green-50')
  } catch(err) {
    appliedVoucher = null
    const errCode = err.response?.data?.error
    const msg = errCode === 'VOUCHER_LIMIT' ? 'Voucher đã hết lượt sử dụng'
              : errCode === 'INVALID_VOUCHER' ? 'Mã không hợp lệ hoặc đã hết hạn'
              : 'Không thể áp dụng mã này'
    statusEl.className = 'mt-2 voucher-error rounded-xl px-3 py-2 text-sm text-red-600 font-medium flex items-center gap-1'
    statusEl.innerHTML = \`<i class="fas fa-times-circle mr-1"></i>\${msg}\`
    statusEl.classList.remove('hidden')
    document.getElementById('orderVoucher').classList.remove('border-green-400','bg-green-50')
    updateOrderTotal()
  } finally {
    btn.disabled = false
    btn.innerHTML = appliedVoucher ? '<i class="fas fa-check mr-1"></i>Đã áp dụng' : 'Áp dụng'
    if (appliedVoucher) btn.classList.replace('bg-gray-800','bg-green-600')
    else btn.className = 'px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-sm font-semibold transition whitespace-nowrap'
  }
}

// ── VALIDATION SHAKE + SCROLL ─────────────────────
function shakeField(fieldId) {
  const el = document.getElementById(fieldId)
  if (!el) return
  el.classList.add('field-error')
  el.classList.remove('shake')
  void el.offsetWidth  // reflow to restart animation
  el.classList.add('shake')
  // Scroll to field inside popup
  el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  setTimeout(() => el.classList.remove('shake'), 600)
}
function clearFieldError(fieldId) {
  document.getElementById(fieldId)?.classList.remove('field-error')
}

async function continueOrderPaymentFlow({ orderCode, orderId, orderTotal, paymentMethod, payTabRef }) {
  if (paymentMethod === 'BANK_TRANSFER') {
    let payosData = null
    try {
      const payos = await axios.post('/api/orders/' + orderId + '/payos-link', { origin: window.location.origin })
      payosData = payos.data?.data || null
    } catch (_) {
      showToast('PayOS tạm lỗi, đang chuyển sang QR dự phòng.', 'error', 4500)
    }
    if (payosData?.alreadyPaid) {
      onOrderMarkedPaid(orderCode)
      showToast('Đơn ' + orderCode + ' đã được thanh toán trước đó.', 'success', 4500)
      return { handled: true }
    }
    const checkoutUrl = String(payosData?.checkoutUrl || '').trim()
    if (checkoutUrl) {
      let payTab = payTabRef
      if (payTab) {
        try { payTab.location.href = checkoutUrl } catch (_) { payTab = null }
      }
      if (!payTab) payTab = window.open(checkoutUrl, '_blank')
      if (payTab) {
        startOrderPaymentPolling(orderCode)
        showToast('Đơn ' + orderCode + ': đã mở tab PayOS, vui lòng hoàn tất thanh toán.', 'success', 5000)
      } else {
        showToast('Trình duyệt đang chặn popup, hiển thị QR dự phòng để bạn thanh toán thủ công.', 'error', 5000)
        openOrderBankTransferModal({
          orderCode,
          orderId,
          amount: orderTotal,
          transferContent: 'DH' + orderId,
          paymentLinkId: payosData?.paymentLinkId || ''
        })
      }
      return { handled: true }
    }

    try { if (payTabRef && !payTabRef.closed) payTabRef.close() } catch (_) { }
    openOrderBankTransferModal({
      orderCode,
      orderId,
      amount: orderTotal,
      transferContent: 'DH' + orderId,
      paymentLinkId: payosData?.paymentLinkId || ''
    })
    showToast('Đơn hàng ' + orderCode + ' đã tạo. Vui lòng chuyển khoản để hoàn tất.', 'success', 5000)
    return { handled: true }
  }

  if (paymentMethod === 'ZALOPAY') {
    let zaloData = null
    try {
      const zalo = await axios.post('/api/orders/' + orderId + '/zalopay-link', { origin: window.location.origin })
      zaloData = zalo.data?.data || null
    } catch (err) {
      const errCode = err.response?.data?.error
      const missing = Array.isArray(err.response?.data?.missing) ? err.response.data.missing : []
      if (errCode === 'ZALOPAY_CONFIG_MISSING') {
        const detail = missing.length ? (': ' + missing.join(', ')) : ''
        showToast('ZaloPay chua cau hinh day du' + detail, 'error', 5500)
      } else {
        showToast('ZaloPay tam loi, vui long thu lai sau it phut.', 'error', 4500)
      }
    }

    if (zaloData?.alreadyPaid) {
      onOrderMarkedPaid(orderCode)
      showToast('Đơn ' + orderCode + ' đã được thanh toán trước đó.', 'success', 4500)
      return { handled: true }
    }

    const checkoutUrl = String(zaloData?.orderUrl || '').trim()
    if (!checkoutUrl) {
      try { if (payTabRef && !payTabRef.closed) payTabRef.close() } catch (_) { }
      showToast('Không tạo được liên kết thanh toán ZaloPay.', 'error', 4500)
      return { handled: true }
    }

    let payTab = payTabRef
    if (payTab) {
      try { payTab.location.href = checkoutUrl } catch (_) { payTab = null }
    }
    if (!payTab) payTab = window.open(checkoutUrl, '_blank')

    if (payTab) {
      zaloPayLinkTab = payTab
      startOrderPaymentPolling(orderCode)
      showToast('Đơn ' + orderCode + ': đã mở tab ZaloPay, vui lòng quét QR để thanh toán.', 'success', 5000)
    } else {
      startOrderPaymentPolling(orderCode)
      window.location.href = checkoutUrl
    }
    return { handled: true }
  }

  showToast('🎉 Đặt hàng thành công! Mã đơn: ' + orderCode, 'success', 5000)
  return { handled: true }
}

// ── SUBMIT ORDER ───────────────────────────────────
async function submitOrder() {
  const sizes = safeJson(currentProduct?.sizes)
  const hasColorOptions = Array.isArray(orderColorOptions) ? orderColorOptions.length > 0 : false
  const hasSizeOptions = Array.isArray(sizes) ? sizes.length > 0 : false
  const payload = validateCheckoutFields('order', {
    requireColor: hasColorOptions,
    requireSize: hasSizeOptions,
    requirePayment: true
  })
  if (!payload) return
  const paymentMethod = getCheckoutSelectedPaymentMethod('order')
  if (paymentMethod === 'ZALOPAY') {
    const check = await ensureZaloPayConfigReady(true)
    if (!check.ready) return
  }

  const btn = document.getElementById('submitOrderBtn')
  btn.disabled = true
  btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Đang xử lý...'
  let payTabRef = null
  if (paymentMethod === 'BANK_TRANSFER') {
    try { payTabRef = window.open('about:blank', '_blank') } catch (_) { payTabRef = null }
  } else if (paymentMethod === 'ZALOPAY') {
    payTabRef = openOrReuseZaloPayLinkTab()
    if (!payTabRef) {
      try { payTabRef = window.open('about:blank', '_blank') } catch (_) { payTabRef = null }
    }
  }

  try {
    const resolvedColorImage = getSelectedColorImageFromProduct(currentProduct, selectedColor)
    const res = await axios.post('/api/orders', {
      customer_name: payload.name,
      customer_phone: payload.phone,
      customer_address: payload.address,
      product_id: currentProduct.id,
      color: selectedColor,
      selected_color_image: resolvedColorImage || selectedColorImage || (currentProduct?.thumbnail || ''),
      size: selectedSize,
      quantity: orderQty,
      voucher_code: appliedVoucher ? appliedVoucher.code : '',
      note: document.getElementById('orderNote').value.trim(),
      payment_method: paymentMethod
    })
    closeOrder()
    const orderCode = res.data.order_code
    const orderTotal = Number(res.data.total || 0)
    const orderId = Number(res.data.id || 0)
    await continueOrderPaymentFlow({ orderCode, orderId, orderTotal, paymentMethod, payTabRef })
  } catch(e) {
    try { if (payTabRef && !payTabRef.closed) payTabRef.close() } catch (_) { }
    const errCode = e.response?.data?.error
    if (errCode === 'INVALID_VOUCHER' || errCode === 'VOUCHER_LIMIT') {
      showToast('Voucher không còn hiệu lực, vui lòng thử lại', 'error')
      appliedVoucher = null
      updateOrderTotal()
      document.getElementById('voucherBtn').innerHTML = 'Áp dụng'
      document.getElementById('voucherBtn').className = 'px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-sm font-semibold transition whitespace-nowrap'
    } else if (errCode === 'ZALOPAY_CONFIG_MISSING') {
      const missing = Array.isArray(e.response?.data?.missing) ? e.response.data.missing : []
      const detail = missing.length ? (': ' + missing.join(', ')) : ''
      showToast('ZaloPay chua cau hinh day du' + detail, 'error', 5500)
    } else {
      showToast('Đặt hàng thất bại, thử lại sau', 'error')
    }
  } finally {
    btn.disabled = false
    btn.innerHTML = '<i class="fas fa-shopping-cart mr-2"></i>Đặt hàng ngay'
  }
}

// Add current product from order popup to cart
function addCurrentToCart() {
  if (!currentProduct) return
  animateFlyToCart(resolveFlyImage(currentProduct), document.getElementById('addToCartBtn'))
  addToCart(currentProduct, selectedColor, selectedSize, orderQty)
  closeOrder()
  showToast('Da them "' + currentProduct.name + '" vao gio hang!', 'success', 2500)
}

// ── UTILS ──────────────────────────────────────────
`
}
