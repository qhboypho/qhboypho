export function adminOrdersScript(): string {
  return `async function loadAdminOrders() {
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
    ? 'grid grid-cols-2 gap-2 items-stretch w-full min-w-0'
    : 'flex flex-col gap-2 items-stretch w-full max-w-[240px] mx-auto'
  const buttonClass = compact
    ? 'w-full h-full inline-flex items-center justify-center gap-1 rounded-lg px-2 py-2 text-[10px] leading-tight font-semibold whitespace-normal break-words text-center flex-wrap transition ' + meta.className
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
                </div>
                <div class="mobile-order-title-row mt-1 flex items-start justify-between gap-2 min-w-0">
                  <p class="min-w-0 flex-1 text-sm font-semibold text-gray-900 leading-5 truncate">\${o.product_name}</p>
                  <span class="mobile-order-total shrink-0 text-sm font-extrabold text-gray-900 whitespace-nowrap">\${fmtPrice(getOrderAmountDue(o))}</span>
                </div>
                <div class="mobile-order-sku-row mt-1 flex items-center justify-between gap-2 min-w-0 text-xs text-gray-500">
                  <p class="min-w-0 truncate">SKU: \${buildOrderSkuText(o)}</p>
                  <span class="mobile-order-quantity inline-flex min-w-7 justify-center text-[11px] \${qtyClass} rounded-md px-2 py-0.5 shrink-0">x\${o.quantity || 1}</span>
                </div>
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
            <div class="mobile-order-actions min-w-0">
              \${renderOrderRowActionControls(o, true)}
            </div>
            <div class="mobile-order-payment-status flex justify-end">
              <span class="text-[11px] px-2 py-0.5 rounded-full \${paymentStatusClass(o.payment_status)}">\${paymentStatusLabel(o.payment_status)}</span>
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
  if (!confirm('Bạn có chắc muốn xoá ' + ids.length + ' đơn hàng đã chọn? Hành động này không thể hoàn tác.')) return
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
  showAdminOverlay(modal)
}

function closeArrangeSuccessModal() {
  const modal = document.getElementById('arrangeSuccessModal')
  forceHideAdminOverlay(modal)
  arrangedFailedOrders = []
}

function closeOrderDetailModal() {
  forceHideAdminOverlay(document.getElementById('orderDetailModal'))
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
  showAdminOverlay(document.getElementById('orderDetailModal'))
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
`
}
