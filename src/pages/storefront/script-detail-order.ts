export function storefrontDetailOrderScript(): string {
  return `function trackProductDetailView(id) {
  const productId = Number(id || 0)
  if (!Number.isFinite(productId) || productId <= 0) return
  axios.post('/api/products/' + productId + '/view').catch(() => {})
}

let detailGalleryImages = []
let detailGalleryIndex = 0
let detailGalleryDragStartX = 0
let detailGalleryDragStartY = 0
let detailGalleryDragDeltaX = 0
let detailGalleryIsDragging = false

function buildDetailGalleryImages(defaultImage, baseImages, colorOptions) {
  const unique = []
  const pushImage = (value) => {
    const src = String(value || '').trim()
    if (!src || unique.includes(src)) return
    unique.push(src)
  }
  pushImage(defaultImage)
  if (Array.isArray(colorOptions)) colorOptions.forEach((item) => pushImage(item?.image))
  if (Array.isArray(baseImages)) baseImages.forEach((item) => pushImage(item))
  return unique
}

function getCurrentDetailGalleryImage() {
  return detailGalleryImages[detailGalleryIndex] || detailGalleryImages[0] || ''
}

function updateDetailGalleryUI(immediate) {
  const track = document.getElementById('detailGalleryTrack')
  if (track) {
    track.style.transitionDuration = immediate ? '0ms' : ''
    track.style.transform = 'translate3d(' + (-detailGalleryIndex * 100) + '%, 0, 0)'
  }

  const counter = document.getElementById('detailGalleryCounter')
  if (counter) counter.textContent = Math.max(1, detailGalleryIndex + 1) + '/' + Math.max(1, detailGalleryImages.length)

  document.querySelectorAll('[data-detail-thumb-index]').forEach((thumb) => {
    const thumbIndex = Number(thumb.getAttribute('data-detail-thumb-index'))
    const active = thumbIndex === detailGalleryIndex
    thumb.classList.toggle('is-active', active)
    thumb.setAttribute('aria-pressed', active ? 'true' : 'false')
    if (active) thumb.scrollIntoView({ behavior: immediate ? 'auto' : 'smooth', inline: 'center', block: 'nearest' })
  })

  const prevBtn = document.getElementById('detailGalleryPrevBtn')
  const nextBtn = document.getElementById('detailGalleryNextBtn')
  const atStart = detailGalleryIndex <= 0
  const atEnd = detailGalleryIndex >= Math.max(0, detailGalleryImages.length - 1)
  if (prevBtn) {
    prevBtn.disabled = atStart
    prevBtn.classList.toggle('is-disabled', atStart)
  }
  if (nextBtn) {
    nextBtn.disabled = atEnd
    nextBtn.classList.toggle('is-disabled', atEnd)
  }
}

function setDetailGalleryIndex(nextIndex, options) {
  if (!detailGalleryImages.length) return
  const detailOptions = options || {}
  const bounded = Math.max(0, Math.min(detailGalleryImages.length - 1, Number(nextIndex) || 0))
  detailGalleryIndex = bounded
  updateDetailGalleryUI(!!detailOptions.immediate)
}

function jumpToDetailGalleryIndex(index, event) {
  if (event) {
    event.preventDefault()
    event.stopPropagation()
  }
  setDetailGalleryIndex(index)
}

function stepDetailGallery(step, event) {
  if (event) {
    event.preventDefault()
    event.stopPropagation()
  }
  setDetailGalleryIndex(detailGalleryIndex + Number(step || 0))
}

function bindDetailGalleryGestures() {
  const viewport = document.getElementById('detailGalleryViewport')
  const track = document.getElementById('detailGalleryTrack')
  if (!viewport || !track || detailGalleryImages.length <= 1) return

  viewport.addEventListener('touchstart', (event) => {
    const point = event.touches?.[0]
    if (!point) return
    detailGalleryIsDragging = true
    detailGalleryDragStartX = point.clientX
    detailGalleryDragStartY = point.clientY
    detailGalleryDragDeltaX = 0
    track.style.transitionDuration = '0ms'
  }, { passive: true })

  viewport.addEventListener('touchmove', (event) => {
    if (!detailGalleryIsDragging) return
    const point = event.touches?.[0]
    if (!point) return
    const deltaX = point.clientX - detailGalleryDragStartX
    const deltaY = point.clientY - detailGalleryDragStartY
    if (Math.abs(deltaY) > Math.abs(deltaX) + 10) {
      detailGalleryIsDragging = false
      track.style.transitionDuration = ''
      updateDetailGalleryUI(true)
      return
    }
    detailGalleryDragDeltaX = deltaX
    track.style.transform = 'translate3d(calc(' + (-detailGalleryIndex * 100) + '% + ' + detailGalleryDragDeltaX + 'px), 0, 0)'
    if (Math.abs(deltaX) > 6) event.preventDefault()
  }, { passive: false })

  viewport.addEventListener('touchend', () => {
    if (!detailGalleryIsDragging) return
    detailGalleryIsDragging = false
    track.style.transitionDuration = ''
    if (Math.abs(detailGalleryDragDeltaX) > 42) {
      setDetailGalleryIndex(detailGalleryIndex + (detailGalleryDragDeltaX < 0 ? 1 : -1))
    } else {
      updateDetailGalleryUI(false)
    }
    detailGalleryDragDeltaX = 0
  }, { passive: true })

  viewport.addEventListener('touchcancel', () => {
    detailGalleryIsDragging = false
    detailGalleryDragDeltaX = 0
    track.style.transitionDuration = ''
    updateDetailGalleryUI(true)
  }, { passive: true })
}

async function showDetail(id, options) {
  try {
    const detailOptions = options || {}
    const res = await axios.get('/api/products/' + id)
    const p = res.data.data
    currentProduct = p
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
    const detailGalleryImageList = buildDetailGalleryImages(defaultMainImage, [p.thumbnail].concat(images), detailColorOptions)
    const defaultGalleryIndex = Math.max(0, detailGalleryImageList.findIndex((img) => img === defaultMainImage))
    const flashMeta = getFlashSaleMeta(p)
    const detailDisplayPrice = Number(flashMeta?.salePrice || p.display_price || p.price || 0)
    const detailDisplayOriginalPrice = Number(flashMeta?.basePrice || p.display_original_price || p.original_price || detailDisplayPrice)
    const discount = flashMeta ? Number(flashMeta.discountPercent || 0) : (p.original_price ? Math.round((1 - p.price/p.original_price)*100) : 0)
    const detailHtml = \`
    <div class="grid md:grid-cols-2 gap-6">
      <div class="-mx-2 md:mx-0">
        <div class="detail-gallery-shell relative mb-2">
          <div id="detailGalleryViewport" class="detail-gallery-viewport relative w-full aspect-square overflow-hidden bg-slate-100">
            <div id="detailGalleryTrack" class="detail-gallery-track">
              \${detailGalleryImageList.map((img, idx) => \`<div class="detail-gallery-slide"><img src="\${escapeHtml(img)}" alt="\${escapeHtml(p.name)} \${idx + 1}" class="w-full h-full object-cover select-none pointer-events-none" draggable="false"></div>\`).join('')}
            </div>
            <button id="detailGalleryPrevBtn" type="button" onclick="stepDetailGallery(-1, event)" class="detail-gallery-arrow detail-gallery-arrow--prev hidden md:flex\${detailGalleryImageList.length <= 1 ? ' md:hidden' : ''}" aria-label="Ảnh trước">
              <i class="fas fa-chevron-left"></i>
            </button>
            <button id="detailGalleryNextBtn" type="button" onclick="stepDetailGallery(1, event)" class="detail-gallery-arrow detail-gallery-arrow--next hidden md:flex\${detailGalleryImageList.length <= 1 ? ' md:hidden' : ''}" aria-label="Ảnh sau">
              <i class="fas fa-chevron-right"></i>
            </button>
            <div id="detailGalleryCounter" class="detail-gallery-counter md:hidden">\${defaultGalleryIndex + 1}/\${Math.max(1, detailGalleryImageList.length)}</div>
          </div>
        </div>
        <div id="detailGalleryThumbs" class="img-gallery detail-gallery-thumbs px-2 md:px-0">
          \${detailGalleryImageList.map((img, idx) => \`
          <button type="button" class="detail-gallery-thumb\${idx === defaultGalleryIndex ? ' is-active' : ''}" data-detail-thumb-index="\${idx}" onclick="jumpToDetailGalleryIndex(\${idx}, event)" aria-label="Xem ảnh \${idx + 1}" aria-pressed="\${idx === defaultGalleryIndex ? 'true' : 'false'}">
            <img src="\${escapeHtml(img)}" alt="" class="w-full h-full object-cover" draggable="false">
          </button>\`).join('')}
        </div>
        <div class="hidden md:block">
          <div class="detail-reviews-section review-section mt-6 hidden">
            <div class="detail-reviews-content"><div class="flex items-center gap-2 py-3"><i class="fas fa-spinner fa-spin text-violet-400 text-sm"></i><span class="text-sm text-gray-400">Đang tải đánh giá...</span></div></div>
          </div>
        </div>
      </div>
      <div>
        \${p.brand ? \`<p class="text-sm text-pink-500 font-medium mb-1">\${escapeHtml(p.brand)}</p>\` : ''}
        <div class="detail-product-heading-row flex items-center justify-between gap-3 mb-3">
          <h2 id="detailProductTitle" class="detail-product-title font-display font-bold text-gray-900 min-w-0 flex-1">\${escapeHtml(p.name)}</h2>
          \${renderFavoriteButton(p.id, 'favorite-toggle-btn--detail')}
        </div>
        \${p.has_flash_sale ? \`<div class="flex flex-wrap items-center gap-2 mb-3"><span class="flash-sale-badge"><i class="fas fa-bolt"></i> Flash Sale</span><span class="flash-sale-countdown" data-flash-sale-ends-at="\${escapeHtml(flashMeta?.endsAt || '')}">\${formatFlashSaleCountdown(flashMeta?.endsAt || '')}</span></div>\` : ''}
        <div class="flex items-baseline gap-3 mb-4">
          <span class="text-3xl font-bold text-gradient-price">\${fmtPrice(detailDisplayPrice)}</span>
          \${detailDisplayOriginalPrice > detailDisplayPrice ? \`<span class="text-gray-400 line-through">\${fmtPrice(detailDisplayOriginalPrice)}</span><span class="badge-sale text-white text-xs px-2 py-1 rounded-full">-\${discount}%</span>\` : ''}
        </div>
        \${p.description ? \`<p class="text-gray-600 text-sm leading-relaxed mb-4">\${escapeHtml(p.description)}</p>\` : ''}
        \${p.material ? \`<p class="text-sm text-gray-500 mb-4"><strong>Chất liệu:</strong> \${escapeHtml(p.material)}</p>\` : ''}
        \${detailColorOptions.length ? \`
        <div class="mb-4 hidden md:block">
          <p class="text-sm font-semibold mb-2">Màu sắc: <span class="text-pink-500" id="detailColorLabel"></span></p>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3" id="detailColorGrid">
            \${detailColorOptions.map((item, idx) => \`<button type="button"
              class="detail-color-card group overflow-hidden rounded-2xl border-2 border-gray-200 bg-white text-left transition hover:border-pink-300 hover:shadow-sm"
              onclick="selectDetailColorByIndex(\${idx}, this)">
              <div class="relative aspect-square bg-gray-100 overflow-hidden">
                \${item.image
                  ? \`<img src="\${escapeHtml(item.image)}" alt="\${escapeHtml(item.name)}" class="w-full h-full object-cover transition duration-300 group-hover:scale-[1.02]">\`
                  : \`<div class="w-full h-full flex items-center justify-center text-gray-300 text-xs">Không có ảnh</div>\`}
              </div>
              <div class="px-2.5 py-2 text-center">
                <span class="block text-sm font-medium text-gray-900 leading-tight">\${escapeHtml(item.name)}</span>
              </div>
            </button>\`).join('')}
          </div>
        </div>\` : ''}
        \${sizes.length ? \`
        <div class="mb-6 hidden md:block">
          <p class="text-sm font-semibold mb-2">Size:</p>
          <div class="flex flex-wrap gap-2">
            \${sizes.map(s => \`<button type="button" class="size-btn w-12 h-10 border rounded-lg text-sm font-medium hover:border-pink-400 transition" onclick="selectDetailSize('\${escapeJsString(s)}',this)">\${escapeHtml(s)}</button>\`).join('')}
          </div>
        </div>\` : ''}
      </div>
    </div>
    
    <div class="w-full md:hidden">
      <div class="detail-reviews-section review-section hidden">
        <div class="detail-reviews-content"><div class="flex items-center gap-2 py-3"><i class="fas fa-spinner fa-spin text-violet-400 text-sm"></i><span class="text-sm text-gray-400">Đang tải đánh giá...</span></div></div>
      </div>
    </div>\`
    document.getElementById('detailContent').innerHTML = detailHtml
    detailGalleryImages = detailGalleryImageList.slice()
    detailGalleryIndex = defaultGalleryIndex
    updateDetailGalleryUI(true)
    bindDetailGalleryGestures()
    
    document.getElementById('detailActionBarContainer').innerHTML = isCurrentUserBlocked()
      ? renderBlockedPurchaseActions('w-full py-3.5 rounded-xl font-bold text-base')
      : \`<button onclick="openOrderFromDetail(\${p.id})" style="border-radius: 0.75rem !important;" class="hidden md:flex btn-primary flex-1 justify-center items-center gap-2 text-white py-3.5 font-bold text-base"><i class="fas fa-shopping-cart"></i><span class="quick-order-label-desktop">Đặt hàng ngay</span></button>
         <button onclick="addDetailToCart()" id="detailAddToCartBtn" style="border-radius: 0.75rem !important;" class="hidden md:flex add-to-cart-btn detail-cart-btn flex-1 justify-center items-center gap-2 text-white py-3.5 font-bold text-base">\${detailOptions.cartItemId ? '<i class="fas fa-check"></i><span>Cập nhật lựa chọn</span>' : '<i class="fas fa-cart-plus"></i><span class="quick-order-label-desktop">Thêm vào giỏ hàng</span>'}</button>
         <button onclick="openVariantModal(\${p.id}, 'add_to_cart', \${detailOptions.cartItemId ? \\\`'\${detailOptions.cartItemId}'\\\` : 'null'})" id="detailAddToCartBtnMobile" style="border-radius: 0.75rem !important;" class="flex md:hidden add-to-cart-btn detail-cart-btn flex-1 justify-center items-center gap-2 text-white py-3.5 font-bold text-base">\${detailOptions.cartItemId ? '<i class="fas fa-check"></i><span>Cập nhật lựa chọn</span>' : '<i class="fas fa-cart-plus"></i><span class="quick-order-label-mobile">Thêm vào giỏ</span>'}</button>
         <button onclick="openOrderFromDetail(\${p.id})" style="border-radius: 0.75rem !important;" class="flex md:hidden btn-primary flex-1 justify-center items-center gap-2 text-white py-3.5 font-bold text-base"><i class="fas fa-shopping-cart"></i><span class="quick-order-label-mobile">Đặt ngay</span></button>\`
      
    if (detailOptions.cartItemId) {
      document.getElementById('detailActionBarContainer').classList.add('detail-action-bar--cart-edit')
    } else {
      document.getElementById('detailActionBarContainer').classList.remove('detail-action-bar--cart-edit')
    }
    
    document.getElementById('detailOverlay').classList.remove('hidden')
    lockStorefrontPageScroll('detailOverlay')
    trackProductDetailView(p.id || id)
    startFlashSaleCountdownTicker()
    
    if (!history.state || history.state.modal !== 'product_detail' || history.state.id !== (p.id || id)) {
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.set('product', p.id || id)
      history.pushState({ modal: 'product_detail', id: p.id || id, openedFromSite: true }, '', newUrl.toString())
    }

    if (detailOptions.focusVariants) {
      setTimeout(() => openVariantModal(p.id || id, detailOptions.cartItemId ? 'add_to_cart' : 'add_to_cart', detailOptions.cartItemId), 120)
    }

    loadProductReviews(Number(p.id))
  } catch(e) { showToast('Không thể tải chi tiết sản phẩm', 'error') }
}

function selectDetailColorByIndex(idx, btn) {
  const item = Array.isArray(detailColorOptions) ? detailColorOptions[idx] : null
  if (!item) return
  detailSelectedColorIndex = idx
  detailSelectedColor = String(item.name || '').trim()
  detailSelectedColorImage = String(item.image || '').trim() || getCurrentDetailGalleryImage()
  const galleryIndex = detailSelectedColorImage ? detailGalleryImages.findIndex((img) => img === detailSelectedColorImage) : -1
  if (galleryIndex >= 0) setDetailGalleryIndex(galleryIndex)
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
function scrollDetailToVariantPicker() {
  const target = document.getElementById('detailColorGrid') || document.querySelector('#detailContent .size-btn')
  if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' })
}
function closeDetail(skipHistory) {
  const overlay = document.getElementById('detailOverlay')
  if (overlay) overlay.classList.add('hidden')
  cartVariantEditId = ''
  unlockStorefrontPageScroll('detailOverlay')
  
  if (!skipHistory) {
    const newUrl = new URL(window.location.href)
    if (newUrl.searchParams.has('product')) {
      if (history.state && history.state.openedFromSite) {
        history.back()
      } else {
        newUrl.searchParams.delete('product')
        history.pushState(null, '', newUrl.toString())
      }
    }
  }
}

function copyProductLink() {
  const url = window.location.href;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(() => {
      showToast('Đã copy link sản phẩm!', 'success', 2500);
    }).catch(() => {
      showToast('Không thể copy link', 'error');
    });
  } else {
    const input = document.createElement('input');
    input.value = url;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    showToast('Đã copy link sản phẩm!', 'success', 2500);
  }
}

function addDetailToCart() {
  if (!currentProduct) return
  if (!assertCustomerCanShop()) return
  const detailSelection = validateRequiredProductSelection(currentProduct, {
    color: detailSelectedColor,
    size: detailSelectedSize
  }, {
    colorMessage: 'Vui lòng chọn màu sản phẩm',
    sizeMessage: 'Vui lòng chọn size sản phẩm',
    shakeColor: () => {
      document.getElementById('detailColorGrid')?.classList.add('shake')
      setTimeout(() => document.getElementById('detailColorGrid')?.classList.remove('shake'), 450)
    },
    shakeSize: () => {
      const sizeGroup = document.querySelector('#detailContent .size-btn')?.closest('.flex')
      sizeGroup?.classList.add('shake')
      setTimeout(() => sizeGroup?.classList.remove('shake'), 450)
    }
  })
  if (!detailSelection.ok) return

  const color = detailSelectedColor || ''
  const size = detailSelectedSize || ''
  if (cartVariantEditId) {
    updateCartItemVariant(cartVariantEditId, color, size)
    cartVariantEditId = ''
    closeDetail()
    renderCartStep1()
    showToast('Đã cập nhật phân loại sản phẩm', 'success', 2200)
    return
  }
  revealMobileBottomNavForCartFeedback()
  animateFlyToCart(resolveFlyImage(currentProduct), document.getElementById('detailGalleryViewport'))
  if (addToCart(currentProduct, color, size, 1)) {
    showToast('Đã thêm "' + currentProduct.name + '" vào giỏ hàng!', 'success', 2500)
    closeDetail()
  }
}

function updateCartItemVariant(cartId, color, size) {
  const item = cart.find(i => i.cartId === cartId)
  if (!item || !currentProduct) return
  const duplicate = cart.find(i => i.cartId !== cartId && i.productId === item.productId && i.color === color && i.size === size)
  if (duplicate) {
    duplicate.qty = Math.min(99, Number(duplicate.qty || 1) + Number(item.qty || 1))
    cart = cart.filter(i => i.cartId !== cartId)
  } else {
    item.color = color
    item.size = size
    item.colorImage = getSelectedColorImageFromProduct(currentProduct, color)
      || detailSelectedColorImage
      || item.colorImage
      || currentProduct.thumbnail
      || ''
  }
  saveCart()
}

function openOrderFromDetail(id, options) {
  closeDetail()
  return openOrder(id, options)
}

// ── ORDER POPUP ────────────────────────────────────
async function openOrder(id, options) {
  try {
    const orderOptions = options || {}
    const prefill = orderOptions.prefill && typeof orderOptions.prefill === 'object' ? orderOptions.prefill : null
    if (!assertCustomerCanShop()) return
    await ensureAddressKitReady()
    const res = await axios.get('/api/products/' + id)
    currentProduct = res.data.data
    orderQty = Math.max(1, Math.min(99, Number(prefill?.qty || 1) || 1))
    selectedColor = ''
    selectedColorImage = String(prefill?.colorImage || currentProduct.thumbnail || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400')
    selectedSize = ''
    selectedPaymentMethod = ''
    appliedVoucher = null

    document.getElementById('orderProductImg').src = selectedColorImage
    document.getElementById('orderProductName').textContent = currentProduct.name
    document.getElementById('orderProductPrice').textContent = fmtPrice(currentProduct.price)
    document.getElementById('qtyDisplay').textContent = String(orderQty)
    document.getElementById('orderName').value = ''
    document.getElementById('orderPhone').value = ''
    await applySavedAddressToScope('order')
    loadCheckoutAddressBook()
    const selectedAddress = getSelectedCheckoutAddress()
    if (selectedAddress) await applyAddressRecordToScope(selectedAddress, 'order')
    else renderOrderAddressSummary()
    document.getElementById('orderNote').value = ''
    updateOrderNoteActionLabel()
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
        \${item.image ? \`<img src="\${escapeHtml(item.image)}" alt="" class="w-5 h-5 rounded-md object-cover border border-gray-200">\` : '<span class="w-5 h-5 rounded-md bg-gray-100 border border-gray-200"></span>'}
        <span>\${escapeHtml(item.name)}</span>
      </button>
    \`).join('') : '<p class="text-gray-400 text-sm">Không có lựa chọn màu</p>'
    const prefillColor = String(prefill?.color || '').trim()
    const detailPrefillColor = Number(detailSelectedProductId || 0) === Number(currentProduct?.id || 0) ? String(detailSelectedColor || '').trim() : ''
    const targetColor = prefillColor || detailPrefillColor
    if (targetColor) {
      const matchedIndex = orderColorOptions.findIndex((item) => String(item.name || '').trim().toLowerCase() === targetColor.toLowerCase())
      if (matchedIndex >= 0) {
        const btn = colorDiv.querySelectorAll('.color-btn')[matchedIndex]
        selectOrderColorByIndex(matchedIndex, btn || null)
      }
    }

    // Sizes
    const sizes = safeJson(currentProduct.sizes)
    const sizeDiv = document.getElementById('sizeOptions')
    sizeDiv.innerHTML = sizes.length ? sizes.map(s => \`
      <button class="size-btn px-3 py-1.5 border rounded-lg text-sm font-medium hover:border-pink-400 transition" onclick="selectOrderSize('\${escapeJsString(s)}',this)">\${escapeHtml(s)}</button>
    \`).join('') : '<p class="text-gray-400 text-sm">Không có size</p>'
    document.getElementById('sizeSection').style.display = sizes.length ? '' : 'none'
    const prefillSize = String(prefill?.size || '').trim()
    const detailPrefillSize = Number(detailSelectedProductId || 0) === Number(currentProduct?.id || 0) ? String(detailSelectedSize || '').trim() : ''
    const targetSize = prefillSize || detailPrefillSize
    if (targetSize) {
      const matchedSizeIndex = sizes.findIndex((s) => String(s || '').trim().toLowerCase() === targetSize.toLowerCase())
      if (matchedSizeIndex >= 0) {
        const btn = sizeDiv.querySelectorAll('.size-btn')[matchedSizeIndex]
        selectOrderSize(String(sizes[matchedSizeIndex] || ''), btn || null)
      }
    }

    document.getElementById('orderOverlay').classList.remove('hidden')
    lockStorefrontPageScroll('orderOverlay')
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
  const scope = document.getElementById('sizeOptions')
  ;(scope ? scope.querySelectorAll('.size-btn') : document.querySelectorAll('#sizeOptions .size-btn')).forEach((b) => b.classList.remove('active','bg-gray-900','text-white','border-gray-900'))
  if (btn) btn.classList.add('active','bg-gray-900','text-white','border-gray-900')
  selectedSize = s
  document.getElementById('sizeSection')?.classList.remove('field-error','shake')
}
function selectPaymentMethod(method, btn) {
  selectCheckoutPaymentMethod('order', method, btn)
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
  const label = document.getElementById('orderTotalLabel')
  if (label) label.textContent = 'Tổng cộng (' + orderQty + ' mặt hàng):'
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
  closeOrderAddressEditor()
  document.getElementById('orderOverlay').classList.add('hidden')
  unlockStorefrontPageScroll('orderOverlay')
}

function resolveFlyImage(product) {
  if (!product) return 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200'
  const imgs = safeJson(product.images)
  return product.thumbnail || imgs[0] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200'
}

function isVisibleFlyTarget(el) {
  if (!(el instanceof HTMLElement)) return false
  const style = window.getComputedStyle(el)
  if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity || '1') <= 0.08) return false
  if (el.closest('#mobileBottomNav')?.classList.contains('is-hidden')) return false
  const rect = el.getBoundingClientRect()
  return rect.width > 0 && rect.height > 0 && rect.bottom >= 0 && rect.right >= 0 && rect.top <= window.innerHeight && rect.left <= window.innerWidth
}

function getCartFlyTarget() {
  const isMobile = window.innerWidth <= 768
  const candidates = isMobile
    ? [
        document.getElementById('cartBottomNavBtn'),
        document.getElementById('cartNavBtnMobile'),
        document.getElementById('cartBadgeBottom')?.parentElement,
        document.getElementById('cartBadgeMobile')?.parentElement,
        document.getElementById('cartNavBtn')
      ]
    : [
        document.getElementById('cartNavBtn'),
        document.getElementById('cartNavBtnMobile'),
        document.getElementById('cartBottomNavBtn'),
        document.getElementById('cartBadgeMobile')?.parentElement,
        document.getElementById('cartBadgeBottom')?.parentElement
      ]
  return candidates.find((el) => isVisibleFlyTarget(el)) || document.getElementById(isMobile ? 'cartBottomNavBtn' : 'cartNavBtn') || document.getElementById('cartNavBtnMobile')
}

function animateFlyToCart(imgUrl, sourceEl) {
  const cartBtn = getCartFlyTarget()
  if (!cartBtn) return
  const flyImg = imgUrl || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200'
  const fromRect = sourceEl ? sourceEl.getBoundingClientRect() : null
  const toRect = cartBtn.getBoundingClientRect()
  const isMobile = window.innerWidth <= 768

  const chip = document.createElement('div')
  chip.className = 'cart-fly-chip'
  const chipSize = isMobile ? 56 : 52
  const startX = fromRect ? (fromRect.left + fromRect.width / 2 - chipSize / 2) : (window.innerWidth / 2 - chipSize / 2)
  const startY = fromRect ? (fromRect.top + fromRect.height / 2 - chipSize / 2) : (window.innerHeight / 2 - chipSize / 2)
  chip.style.left = startX + 'px'
  chip.style.top = startY + 'px'
  chip.style.width = chipSize + 'px'
  chip.style.height = chipSize + 'px'

  const img = document.createElement('img')
  img.src = flyImg
  img.onerror = () => { img.src = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200' }
  chip.appendChild(img)
  document.body.appendChild(chip)

  const endX = toRect.left + toRect.width / 2 - chipSize / 2
  const endY = toRect.top + toRect.height / 2 - chipSize / 2
  const deltaX = endX - startX
  const deltaY = endY - startY
  const arcHeight = isMobile
    ? Math.max(92, Math.min(170, Math.abs(deltaX) * 0.15 + Math.abs(deltaY) * 0.16))
    : Math.max(104, Math.min(188, Math.abs(deltaX) * 0.18 + Math.abs(deltaY) * 0.14))
  const control1X = startX + deltaX * 0.16
  const control1Y = startY - arcHeight
  const control2X = startX + deltaX * 0.84
  const control2Y = endY - (arcHeight * (isMobile ? 0.9 : 0.72))
  const duration = isMobile ? 1320 : 1120
  const startAt = performance.now()
  const rotateDirection = deltaX >= 0 ? 1 : -1

  chip.classList.add('is-active')

  function step(now) {
    const elapsed = now - startAt
    const t = Math.min(1, elapsed / duration)
    const ease = 1 - Math.pow(1 - t, 3)
    const inv = 1 - ease
    const x = (inv * inv * inv * startX)
      + (3 * inv * inv * ease * control1X)
      + (3 * inv * ease * ease * control2X)
      + (ease * ease * ease * endX)
    const y = (inv * inv * inv * startY)
      + (3 * inv * inv * ease * control1Y)
      + (3 * inv * ease * ease * control2Y)
      + (ease * ease * ease * endY)
    const burst = t < 0.22 ? Math.sin((t / 0.22) * Math.PI) * 0.12 : 0
    const scale = Math.max(0.42, 1 + burst - ease * (isMobile ? 0.58 : 0.52))
    const rotate = rotateDirection * ease * (isMobile ? 18 : 14)
    const opacity = t < 0.84 ? 1 : 1 - ((t - 0.84) / 0.16) * 0.92
    chip.style.transform = 'translate(' + (x - startX) + 'px, ' + (y - startY) + 'px) scale(' + scale.toFixed(3) + ') rotate(' + rotate.toFixed(2) + 'deg)'
    chip.style.opacity = String(Math.max(0.12, opacity))

    if (t < 1) {
      requestAnimationFrame(step)
      return
    }

    chip.remove()
    cartBtn.classList.remove('cart-fly-target-pulse')
    void cartBtn.offsetWidth
    cartBtn.classList.add('cart-fly-target-pulse')
    setTimeout(() => cartBtn.classList.remove('cart-fly-target-pulse'), 520)
  }

  requestAnimationFrame(step)
}

function productRequiresSkuSelection(product) {
  return getProductColorOptions(product).length > 0 || safeJson(product?.sizes).length > 0
}

function validateRequiredProductSelection(product, selection, options) {
  const cfg = options || {}
  const color = String(selection?.color || '').trim()
  const size = String(selection?.size || '').trim()
  const hasColorOptions = getProductColorOptions(product).length > 0
  const hasSizeOptions = safeJson(product?.sizes).length > 0

  if (hasColorOptions && !color) {
    showToast(cfg.colorMessage || 'Vui lòng chọn màu sản phẩm', 'error')
    if (typeof cfg.shakeColor === 'function') cfg.shakeColor()
    return { ok: false, missing: 'color' }
  }

  if (hasSizeOptions && !size) {
    showToast(cfg.sizeMessage || 'Vui lòng chọn size sản phẩm', 'error')
    if (typeof cfg.shakeSize === 'function') cfg.shakeSize()
    return { ok: false, missing: 'size' }
  }

  return { ok: true }
}

// Add to cart from product card. Products with SKU options must go through variant modal.
async function addToCartFromCard(evt, id) {
  try {
    if (!assertCustomerCanShop()) return
    const res = await axios.get('/api/products/' + id)
    const p = res.data.data
    if (productRequiresSkuSelection(p)) {
      openVariantModal(id, 'add_to_cart')
      return
    }
    const colors = getProductColorOptions(p).map((c) => c.name)
    const sizes = safeJson(p.sizes)
    const color = colors.length > 0 ? colors[0] : ''
    const size = sizes.length > 0 ? sizes[0] : ''
    revealMobileBottomNavForCartFeedback()
    animateFlyToCart(resolveFlyImage(p), evt?.currentTarget || evt?.target || null)
    if (addToCart(p, color, size, 1)) {
      showToast('Đã thêm "' + p.name + '" vào giỏ hàng!', 'success', 2500)
    }
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

  showToast('🎉 Đặt hàng thành công! Mã đơn: ' + orderCode, 'success', 5000)
  return { handled: true }
}

// ── SUBMIT ORDER ───────────────────────────────────
async function submitOrder() {
  const sizes = safeJson(currentProduct?.sizes)
  const hasColorOptions = Array.isArray(orderColorOptions) ? orderColorOptions.length > 0 : false
  const hasSizeOptions = Array.isArray(sizes) ? sizes.length > 0 : false
  let payload = validateCheckoutFields('order', {
    requireColor: hasColorOptions,
    requireSize: hasSizeOptions,
    requirePayment: true
  })
  if (!payload) {
    const selectedAddress = getSelectedCheckoutAddress()
    if (selectedAddress) {
      try {
        await applyAddressRecordToScope(selectedAddress, 'order')
        payload = validateCheckoutFields('order', {
          requireColor: hasColorOptions,
          requireSize: hasSizeOptions,
          requirePayment: true
        })
      } catch (_) { }
    }
  }
  if (!payload) {
    if (
      window.matchMedia
      && window.matchMedia('(max-width: 767px)').matches
      && !hasCheckoutContactAddress('order')
    ) {
      openOrderAddressEditor()
    }
    return
  }
  
  // Check if customer is blocked
  const blockCheck = await checkCustomerBlockStatus(payload.phone)
  if (blockCheck.is_blocked) {
    showBlockedCustomerModal(blockCheck.reason)
    return
  }
  
  const paymentMethod = getCheckoutSelectedPaymentMethod('order')

  const btn = document.getElementById('submitOrderBtn')
  btn.disabled = true
  btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Đang xử lý...'
  let payTabRef = null
  if (paymentMethod === 'BANK_TRANSFER') {
    try { payTabRef = window.open('about:blank', '_blank') } catch (_) { payTabRef = null }
  }

  try {
    const resolvedColorImage = getSelectedColorImageFromProduct(currentProduct, selectedColor)
    const res = await axios.post('/api/orders', {
      customer_name: payload.name,
      customer_phone: payload.phone,
      customer_address: payload.address,
      customer_province_code: payload.addressPayload.provinceCode,
      customer_commune_code: payload.addressPayload.communeCode,
      address_effective_date: payload.addressPayload.effectiveDate,
      product_id: currentProduct.id,
      color: selectedColor,
      selected_color_image: resolvedColorImage || selectedColorImage || (currentProduct?.thumbnail || ''),
      size: selectedSize,
      quantity: orderQty,
      voucher_code: appliedVoucher ? appliedVoucher.code : '',
      note: document.getElementById('orderNote').value.trim(),
      payment_method: paymentMethod,
      device_id: getStorefrontDeviceId()
    })
    closeOrder()
    const orderCode = res.data.order_code
    const orderTotal = Number(res.data.total || 0)
    const orderId = Number(res.data.id || 0)
    await continueOrderPaymentFlow({ orderCode, orderId, orderTotal, paymentMethod, payTabRef })
  } catch(e) {
    try { if (payTabRef && !payTabRef.closed) payTabRef.close() } catch (_) { }
    const errCode = e.response?.data?.error
    if (errCode === 'CUSTOMER_BLOCKED') {
      showBlockedCustomerModal(e.response?.data?.reason || 'Không thể đặt hàng')
    } else if (errCode === 'ORDER_DAILY_LIMIT_REACHED') {
      showBlockedCustomerModal(e.response?.data?.reason || 'Bạn đã đặt tối đa 2 đơn trong hôm nay. Vui lòng liên hệ shop nếu cần hỗ trợ.')
    } else if (errCode === 'INVALID_VOUCHER' || errCode === 'VOUCHER_LIMIT') {
      showToast('Voucher không còn hiệu lực, vui lòng thử lại', 'error')
      appliedVoucher = null
      updateOrderTotal()
      document.getElementById('voucherBtn').innerHTML = 'Áp dụng'
      document.getElementById('voucherBtn').className = 'px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-sm font-semibold transition whitespace-nowrap'
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
  if (!assertCustomerCanShop()) return
  const orderSelection = validateRequiredProductSelection(currentProduct, {
    color: selectedColor,
    size: selectedSize
  }, {
    colorMessage: 'Vui lòng chọn màu sản phẩm',
    sizeMessage: 'Vui lòng chọn size sản phẩm',
    shakeColor: () => shakeField('fieldColor'),
    shakeSize: () => shakeField('sizeSection')
  })
  if (!orderSelection.ok) return
  revealMobileBottomNavForCartFeedback()
  animateFlyToCart(resolveFlyImage(currentProduct), document.getElementById('addToCartBtn'))
  if (addToCart(currentProduct, selectedColor, selectedSize, orderQty)) {
    closeOrder()
    showToast('Đã thêm "' + currentProduct.name + '" vào giỏ hàng!', 'success', 2500)
  }
}

// ── VARIANT MODAL ──────────────────────────────────
let variantActionType = 'add_to_cart'

async function openVariantModal(productId, actionType, editCartId) {
  try {
    if (!assertCustomerCanShop()) return
    const res = await axios.get('/api/products/' + productId)
    currentProduct = res.data.data
    variantActionType = actionType || 'add_to_cart'
    cartVariantEditId = editCartId || ''
    
    orderQty = 1
    selectedColor = ''
    selectedColorImage = String(currentProduct.thumbnail || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400')
    selectedSize = ''
    
    const colorOptions = getProductColorOptions(currentProduct)
    orderColorOptions = Array.isArray(colorOptions) ? colorOptions : []
    const sizes = safeJson(currentProduct.sizes)

    // Render modal UI
    document.getElementById('variantModalProductImg').src = selectedColorImage
    document.getElementById('variantModalProductPrice').innerHTML = fmtPrice(currentProduct.price)
    document.getElementById('variantQtyDisplay').textContent = '1'
    document.getElementById('variantModalColorLabel').textContent = ''

    const colorDiv = document.getElementById('variantModalColorOptions')
    if (colorDiv) {
      if (orderColorOptions.length) {
        colorDiv.innerHTML = orderColorOptions.map((item, idx) => \`
          <button type="button" class="variant-color-btn w-[4.5rem] flex-shrink-0 border-2 border-transparent rounded-xl overflow-hidden transition relative flex flex-col" onclick="selectVariantColorByIndex(\${idx}, this)">
            <div class="aspect-square bg-gray-100 w-full flex items-center justify-center overflow-hidden">
              <img src="\${escapeHtml(item.image)}" alt="" class="w-full h-full object-cover">
            </div>
            <div class="px-1.5 pt-1 pb-0.5 text-center border-t w-full bg-white min-h-[2.2rem] flex items-start justify-center">
              <span class="block text-[11px] font-medium text-gray-900 leading-tight overflow-hidden" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;text-overflow:ellipsis;word-break:break-word;overflow-wrap:anywhere;">\${escapeHtml(item.name)}</span>
            </div>
          </button>
        \`).join('')
        colorDiv.parentElement.style.display = 'block'
      } else {
        colorDiv.innerHTML = ''
        colorDiv.parentElement.style.display = 'none'
      }
    }

    const sizeDiv = document.getElementById('variantModalSizeOptions')
    if (sizeDiv) {
      if (sizes.length) {
        sizeDiv.innerHTML = sizes.map(s => \`
          <button type="button" class="variant-size-btn min-w-[3.5rem] h-10 px-3 border border-gray-200 rounded-lg text-sm font-medium hover:border-pink-400 transition" onclick="selectVariantSize('\${escapeJsString(s)}', this)">\${escapeHtml(s)}</button>
        \`).join('')
        sizeDiv.parentElement.style.display = 'block'
      } else {
        sizeDiv.innerHTML = ''
        sizeDiv.parentElement.style.display = 'none'
      }
    }

    // Prefill for edit mode
    if (cartVariantEditId) {
      const cartItem = cart.find(i => i.cartId === cartVariantEditId)
      if (cartItem) {
        orderQty = cartItem.qty || 1
        document.getElementById('variantQtyDisplay').textContent = orderQty
        if (cartItem.color) {
          const matchedColorIndex = orderColorOptions.findIndex((item) => String(item.name || '').trim().toLowerCase() === String(cartItem.color || '').trim().toLowerCase())
          if (matchedColorIndex >= 0) {
             const btn = colorDiv.querySelectorAll('.variant-color-btn')[matchedColorIndex]
             selectVariantColorByIndex(matchedColorIndex, btn)
          }
        }
        if (cartItem.size) {
           const matchedSizeIndex = sizes.findIndex((s) => String(s || '').trim().toLowerCase() === String(cartItem.size || '').trim().toLowerCase())
           if (matchedSizeIndex >= 0) {
             const btn = sizeDiv.querySelectorAll('.variant-size-btn')[matchedSizeIndex]
             selectVariantSize(String(sizes[matchedSizeIndex] || ''), btn)
           }
        }
      }
    }

    const btn = document.getElementById('variantSubmitBtn')
    if (btn) {
      if (cartVariantEditId) {
        btn.innerHTML = '<i class="fas fa-check"></i> Cập nhật'
      } else {
        btn.innerHTML = actionType === 'buy_now' ? '<i class="fas fa-bolt"></i> Đặt ngay' : '<i class="fas fa-cart-plus"></i> Thêm vào giỏ'
      }
    }
    
    document.getElementById('variantModalOverlay').classList.remove('hidden')
    document.getElementById('variantModalOverlay').classList.add('flex')
    lockStorefrontPageScroll('variantModalOverlay')
    
    // Animate slide up
    const panel = document.getElementById('variantModalPanel')
    const overlay = document.getElementById('variantModalOverlay')
    if (panel) {
      setTimeout(() => {
        overlay.classList.remove('opacity-0')
        overlay.classList.add('opacity-100')
        panel.classList.remove('translate-y-full')
        panel.classList.remove('opacity-0')
        panel.classList.remove('md:translate-y-4')
        panel.classList.remove('md:scale-[0.985]')
        panel.classList.add('translate-y-0')
        panel.classList.add('opacity-100')
        panel.classList.add('scale-100')
      }, 10)
    }
  } catch (e) {
    showToast('Không thể tải sản phẩm', 'error')
  }
}

function selectVariantColorByIndex(idx, btn) {
  const item = Array.isArray(orderColorOptions) ? orderColorOptions[idx] : null
  if (!item) return
  selectedColor = String(item.name || '').trim()
  selectedColorImage = String(item.image || '').trim() || getSelectedColorImageFromProduct(currentProduct, selectedColor) || (currentProduct?.thumbnail || '')
  const preview = document.getElementById('variantModalProductImg')
  if (preview && selectedColorImage) preview.src = selectedColorImage
  
  const label = document.getElementById('variantModalColorLabel')
  if (label) label.textContent = selectedColor

  document.querySelectorAll('.variant-color-btn').forEach(b => b.classList.remove('border-pink-500', 'ring-2', 'ring-pink-200'))
  if (btn) btn.classList.add('border-pink-500', 'ring-2', 'ring-pink-200')
}

function selectVariantSize(s, btn) {
  selectedSize = String(s || '').trim()
  document.querySelectorAll('.variant-size-btn').forEach(b => b.classList.remove('active', 'bg-gray-900', 'text-white', 'border-gray-900'))
  if (btn) btn.classList.add('active', 'bg-gray-900', 'text-white', 'border-gray-900')
  
  const label = document.getElementById('variantModalSizeLabel')
  if (label) label.textContent = selectedSize
}

function updateVariantQty(delta) {
  orderQty = Math.max(1, Math.min(99, orderQty + delta))
  document.getElementById('variantQtyDisplay').textContent = orderQty
}

function closeVariantModal() {
  const panel = document.getElementById('variantModalPanel')
  if (panel) {
    panel.classList.remove('translate-y-0')
    panel.classList.remove('opacity-100')
    panel.classList.remove('scale-100')
    panel.classList.add('translate-y-full')
    panel.classList.add('opacity-0')
    panel.classList.add('md:translate-y-4')
    panel.classList.add('md:scale-[0.985]')
  }
  const overlay = document.getElementById('variantModalOverlay')
  if (overlay) {
    overlay.classList.remove('opacity-100')
    overlay.classList.add('opacity-0')
  }
  
  setTimeout(() => {
    const overlay = document.getElementById('variantModalOverlay')
    if (overlay) {
      overlay.classList.add('hidden')
      overlay.classList.remove('flex')
    }
    cartVariantEditId = ''
    unlockStorefrontPageScroll('variantModalOverlay')
  }, 300)
}

function submitVariantModal() {
  if (!currentProduct) return
  if (!assertCustomerCanShop()) return

  const variantSelection = validateRequiredProductSelection(currentProduct, {
    color: selectedColor,
    size: selectedSize
  }, {
    colorMessage: 'Vui lòng chọn Màu sắc',
    sizeMessage: 'Vui lòng chọn Size',
    shakeColor: () => {
      document.getElementById('variantModalColorOptions')?.classList.add('shake')
      setTimeout(() => document.getElementById('variantModalColorOptions')?.classList.remove('shake'), 450)
    },
    shakeSize: () => {
      document.getElementById('variantModalSizeOptions')?.closest('div')?.classList.add('shake')
      setTimeout(() => document.getElementById('variantModalSizeOptions')?.closest('div')?.classList.remove('shake'), 450)
    }
  })
  if (!variantSelection.ok) return

  if (cartVariantEditId) {
    updateCartItemVariant(cartVariantEditId, selectedColor, selectedSize)
    const i = cart.find(x => x.cartId === cartVariantEditId)
    if (i) {
      i.qty = orderQty
      saveCart()
    }
    cartVariantEditId = ''
    closeVariantModal()
    renderCartStep1()
    showToast('Đã cập nhật phân loại sản phẩm', 'success', 2200)
    return
  }

  if (variantActionType === 'add_to_cart') {
    revealMobileBottomNavForCartFeedback()
    animateFlyToCart(resolveFlyImage(currentProduct), document.getElementById('variantModalProductImg') || document.getElementById('variantSubmitBtn'))
    if (addToCart(currentProduct, selectedColor, selectedSize, orderQty)) {
      closeVariantModal()
      showToast('Đã thêm "' + currentProduct.name + '" vào giỏ hàng!', 'success', 2500)
    }
  } else {
    const prefill = {
      color: selectedColor,
      colorImage: selectedColorImage,
      size: selectedSize,
      qty: orderQty
    }
    closeVariantModal()
    if (document.getElementById('detailOverlay')?.classList.contains('hidden')) {
      openOrder(currentProduct.id, { prefill })
    } else {
      openOrderFromDetail(currentProduct.id, { prefill })
    }
  }
}

// ── UTILS ──────────────────────────────────────────
`
}
