export function adminCustomersScript(): string {
  return `// CUSTOMERS MANAGEMENT
let customersData = []
let filteredCustomersData = []
let customersLoadError = ''

function setCustomersLoadingState() {
  const tbody = document.getElementById('customersTableBody')
  const mobileList = document.getElementById('customersMobileList')
  const empty = document.getElementById('customersEmpty')
  const countEl = document.getElementById('customersCount')
  if (countEl) countEl.textContent = 'Đang tải...'
  if (empty) empty.classList.add('hidden')
  if (mobileList) mobileList.innerHTML = '<div class="py-12 text-center text-gray-400"><i class="fas fa-spinner fa-spin text-2xl mb-2"></i><p>Đang tải dữ liệu...</p></div>'
  if (tbody) {
    tbody.innerHTML = '<tr><td colspan="4" class="px-4 py-16 text-center text-gray-400"><i class="fas fa-spinner fa-spin text-2xl mb-2"></i><p>Đang tải dữ liệu...</p></td></tr>'
  }
}

async function loadCustomers() {
  customersLoadError = ''
  setCustomersLoadingState()
  try {
    const res = await axios.get('/api/admin/customers')
    if (!res.data?.success) throw new Error(res.data?.error || 'Không thể tải dữ liệu khách hàng')
    customersData = Array.isArray(res.data?.data) ? res.data.data : []
  } catch (e) {
    customersData = []
    customersLoadError = e?.response?.data?.error || e?.message || 'Không thể tải dữ liệu khách hàng'
    showAdminToast(customersLoadError, 'error')
    console.error('loadCustomers error:', e)
  } finally {
    filterCustomers()
    renderCustomersTable()
  }
}

function normalizeCustomerSearch(value) {
  return String(value || '').toLowerCase().trim()
}

function filterCustomers() {
  const search = normalizeCustomerSearch(document.getElementById('customersSearch')?.value)
  filteredCustomersData = customersData.filter(customer => {
    if (!search) return true
    return [
      customer.customer_name,
      customer.customer_phone,
      customer.customer_address,
      customer.user_name,
      customer.first_product_name
    ].some(value => normalizeCustomerSearch(value).includes(search))
  })
  renderCustomersTable()
}

function customerInitials(customer) {
  const raw = String(customer?.customer_name || customer?.user_name || 'KH').trim()
  const parts = raw.split(/\s+/).filter(Boolean)
  if (!parts.length) return 'KH'
  return parts.slice(-2).map(part => part.charAt(0).toUpperCase()).join('') || 'KH'
}

function formatCustomerMoney(value) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value || 0))
}

function formatCustomerDate(value) {
  if (!value) return 'Chưa có'
  const parsed = new Date(String(value).trim().replace(' ', 'T'))
  if (!Number.isFinite(parsed.getTime())) return String(value)
  return parsed.toLocaleDateString('vi-VN')
}

function encodeCustomerHistoryPayload(customer) {
  const identifier = customer?.user_id ? String(customer.user_id) : String(customer?.customer_phone || '')
  return encodeURIComponent(JSON.stringify({
    identifier,
    type: customer?.user_id ? 'user_id' : 'phone',
    name: String(customer?.customer_name || customer?.user_name || 'Khách hàng')
  }))
}

function openCustomerOrderHistoryFromPayload(payload) {
  try {
    const data = JSON.parse(decodeURIComponent(String(payload || '')))
    if (!data.identifier) return
    openCustomerOrderHistory(data.identifier, data.type === 'user_id' ? 'user_id' : 'phone', data.name || 'Khách hàng')
  } catch (e) {
    showAdminToast('Không mở được lịch sử khách hàng', 'error')
    console.error('openCustomerOrderHistoryFromPayload error:', e)
  }
}

function customerHistoryButton(customer, compact = false) {
  const orderCount = Number(customer?.order_count || 0)
  if (orderCount < 1) return ''
  const payload = escapeHtml(encodeCustomerHistoryPayload(customer))
  const label = orderCount > 1 ? ('Xem ' + orderCount + ' đơn') : 'Xem đơn hàng'
  const className = compact
    ? 'mt-3 inline-flex items-center justify-center gap-2 rounded-xl bg-pink-50 px-3 py-2 text-xs font-bold text-pink-700 hover:bg-pink-100 transition'
    : 'inline-flex items-center gap-2 rounded-xl bg-pink-50 px-3 py-2 text-xs font-bold text-pink-700 hover:bg-pink-100 transition'
  return '<button type="button" data-history-payload="' + payload + '" onclick="openCustomerOrderHistoryFromPayload(this.dataset.historyPayload)" class="' + className + '"><i class="fas fa-receipt"></i>' + label + '</button>'
}

function customerProductSnippet(customer) {
  const firstProductName = escapeHtml(customer?.first_product_name || 'Chưa có sản phẩm')
  const thumbnail = escapeHtml(customer?.first_product_thumbnail || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=80')
  const latestDate = escapeHtml(formatCustomerDate(customer?.latest_order_date || customer?.first_order_date))
  return '<div class="flex items-center gap-3 min-w-0">'
    + '<img src="' + thumbnail + '" alt="" loading="lazy" class="h-11 w-11 shrink-0 rounded-xl border border-gray-200 bg-gray-100 object-cover">'
    + '<div class="min-w-0">'
    + '<p class="truncate text-sm font-semibold text-gray-800">' + firstProductName + '</p>'
    + '<p class="mt-0.5 text-xs text-gray-400">Mua gần nhất: ' + latestDate + '</p>'
    + '</div>'
    + '</div>'
}

function renderCustomersTable() {
  const tbody = document.getElementById('customersTableBody')
  const mobileList = document.getElementById('customersMobileList')
  const empty = document.getElementById('customersEmpty')
  const countEl = document.getElementById('customersCount')
  const totalCustomers = filteredCustomersData.length
  const totalOrders = filteredCustomersData.reduce((sum, customer) => sum + Number(customer.order_count || 0), 0)
  const totalSpent = filteredCustomersData.reduce((sum, customer) => sum + Number(customer.total_spent || 0), 0)

  if (countEl) {
    countEl.textContent = customersLoadError
      ? 'Lỗi tải dữ liệu'
      : totalCustomers + ' khách hàng • ' + totalOrders + ' đơn • ' + formatCustomerMoney(totalSpent)
  }

  if (customersLoadError) {
    if (tbody) tbody.innerHTML = '<tr><td colspan="5" class="px-4 py-16 text-center text-red-500"><i class="fas fa-triangle-exclamation text-3xl mb-3"></i><p class="font-semibold">' + escapeHtml(customersLoadError) + '</p><button type="button" onclick="loadCustomers()" class="mt-3 rounded-xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100">Tải lại</button></td></tr>'
    if (mobileList) mobileList.innerHTML = '<div class="p-6 text-center text-red-500"><i class="fas fa-triangle-exclamation text-3xl mb-3"></i><p class="font-semibold">' + escapeHtml(customersLoadError) + '</p><button type="button" onclick="loadCustomers()" class="mt-3 rounded-xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100">Tải lại</button></div>'
    if (empty) empty.classList.add('hidden')
    return
  }

  if (!totalCustomers) {
    const hasSearch = !!String(document.getElementById('customersSearch')?.value || '').trim()
    const message = hasSearch ? 'Không tìm thấy khách hàng phù hợp' : 'Chưa có khách hàng nào'
    if (tbody) tbody.innerHTML = '<tr><td colspan="5" class="px-4 py-16 text-center text-gray-400"><i class="fas fa-users text-4xl mb-3"></i><p>' + message + '</p></td></tr>'
    if (mobileList) mobileList.innerHTML = ''
    if (empty) empty.classList.toggle('hidden', hasSearch)
    return
  }

  if (empty) empty.classList.add('hidden')

  if (tbody) {
    tbody.innerHTML = filteredCustomersData.map(customer => {
      const customerName = escapeHtml(customer.customer_name || 'Khách hàng')
      const userName = escapeHtml(customer.user_name || '')
      const customerPhone = escapeHtml(customer.customer_phone || 'Chưa có SĐT')
      const customerAddress = escapeHtml(customer.customer_address || 'Chưa có địa chỉ')
      const orderCount = Number(customer.order_count || 0)
      const cancelledCount = Number(customer.cancelled_count || 0)
      const totalSpent = formatCustomerMoney(customer.total_spent || 0)
      const isBlocked = Number(customer.is_blocked || 0) === 1
      const userId = customer.user_id || null
      const phone = customer.customer_phone || null

      return '<tr class="border-b last:border-b-0 hover:bg-pink-50/40 transition">'
        + '<td class="px-4 py-4 align-top">'
        + '<div class="flex items-start gap-3 min-w-0">'
        + '<div class="h-10 w-10 shrink-0 rounded-2xl bg-gradient-to-br from-pink-500 to-orange-400 text-white flex items-center justify-center text-xs font-black shadow-sm">' + escapeHtml(customerInitials(customer)) + '</div>'
        + '<div class="min-w-0">'
        + '<p class="font-bold text-gray-900 break-words">' + customerName + '</p>'
        + (userName ? '<p class="mt-0.5 text-xs text-gray-500">@' + userName + '</p>' : '')
        + '<div class="mt-2 flex flex-wrap items-center gap-2">'
        + '<span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">' + orderCount + ' đơn</span>'
        + (cancelledCount > 0 ? '<span class="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600">' + cancelledCount + ' hủy</span>' : '')
        + '<span class="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">' + totalSpent + '</span>'
        + (isBlocked ? '<span class="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700"><i class="fas fa-ban mr-1"></i>Đã chặn</span>' : '')
        + '</div>'
        + '</div>'
        + '</div>'
        + '</td>'
        + '<td class="px-4 py-4 align-top text-sm font-semibold text-gray-700 whitespace-nowrap">' + customerPhone + '</td>'
        + '<td class="px-4 py-4 align-top text-sm text-gray-600 max-w-[360px]"><p class="line-clamp-2">' + customerAddress + '</p></td>'
        + '<td class="px-4 py-4 align-top">'
        + '<div class="space-y-3">' + customerProductSnippet(customer) + customerHistoryButton(customer, false) + '</div>'
        + '</td>'
        + '<td class="px-4 py-4 align-top text-center">'
        + (isBlocked 
          ? '<button type="button" onclick="unblockCustomer(' + (userId || 'null') + ', \'' + escapeHtml(phone || '') + '\')" class="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition"><i class="fas fa-check-circle"></i>Bỏ chặn</button>'
          : '<button type="button" onclick="blockCustomer(' + (userId || 'null') + ', \'' + escapeHtml(phone || '') + '\')" class="inline-flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100 transition"><i class="fas fa-ban"></i>Chặn</button>'
        )
        + '</td>'
        + '</tr>'
    }).join('')
  }

  if (mobileList) {
    mobileList.innerHTML = '<div class="customers-mobile-stack divide-y divide-gray-100">' + filteredCustomersData.map(customer => {
      const customerName = escapeHtml(customer.customer_name || 'Khách hàng')
      const userName = escapeHtml(customer.user_name || '')
      const customerPhone = escapeHtml(customer.customer_phone || 'Chưa có SĐT')
      const customerAddress = escapeHtml(customer.customer_address || 'Chưa có địa chỉ')
      const orderCount = Number(customer.order_count || 0)
      const cancelledCount = Number(customer.cancelled_count || 0)
      const totalSpent = formatCustomerMoney(customer.total_spent || 0)
      const isBlocked = Number(customer.is_blocked || 0) === 1
      const userId = customer.user_id || null
      const phone = customer.customer_phone || null

      return '<article class="customer-mobile-card p-4">'
        + '<div class="flex items-start gap-3">'
        + '<div class="h-11 w-11 shrink-0 rounded-2xl bg-gradient-to-br from-pink-500 to-orange-400 text-white flex items-center justify-center text-xs font-black shadow-sm">' + escapeHtml(customerInitials(customer)) + '</div>'
        + '<div class="min-w-0 flex-1">'
        + '<div class="flex items-start justify-between gap-2">'
        + '<div class="min-w-0"><p class="font-bold text-gray-900 break-words">' + customerName + '</p>' + (userName ? '<p class="text-xs text-gray-500">@' + userName + '</p>' : '') + '</div>'
        + '<span class="shrink-0 rounded-full bg-pink-50 px-2 py-1 text-xs font-bold text-pink-700">' + orderCount + ' đơn</span>'
        + '</div>'
        + (isBlocked ? '<div class="mt-2"><span class="inline-block rounded-full bg-red-100 px-2 py-1 text-xs font-bold text-red-700"><i class="fas fa-ban mr-1"></i>Đã chặn</span></div>' : '')
        + (cancelledCount > 0 ? '<div class="mt-2"><span class="inline-block rounded-full bg-red-50 px-2 py-1 text-xs font-semibold text-red-600">' + cancelledCount + ' đơn hủy</span></div>' : '')
        + '<div class="mt-2 space-y-1 text-sm text-gray-600">'
        + '<p><i class="fas fa-phone mr-2 text-gray-400"></i>' + customerPhone + '</p>'
        + '<p class="line-clamp-2"><i class="fas fa-location-dot mr-2 text-gray-400"></i>' + customerAddress + '</p>'
        + '</div>'
        + '<div class="mt-3 rounded-2xl bg-gray-50 p-3">' + customerProductSnippet(customer) + '</div>'
        + '<div class="mt-3 flex items-center justify-between gap-3">'
        + '<span class="text-sm font-extrabold text-gray-900">' + totalSpent + '</span>'
        + '<div class="flex items-center gap-2">'
        + customerHistoryButton(customer, true)
        + (isBlocked 
          ? '<button type="button" onclick="unblockCustomer(' + (userId || 'null') + ', \'' + escapeHtml(phone || '') + '\')" class="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition"><i class="fas fa-check-circle"></i>Bỏ chặn</button>'
          : '<button type="button" onclick="blockCustomer(' + (userId || 'null') + ', \'' + escapeHtml(phone || '') + '\')" class="inline-flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100 transition"><i class="fas fa-ban"></i>Chặn</button>'
        )
        + '</div>'
        + '</div>'
        + '</div>'
        + '</div>'
        + '</article>'
    }).join('') + '</div>'
  }
}

async function openCustomerOrderHistory(identifier, type, customerName) {
  const modal = document.getElementById('customerOrderHistoryModal')
  const nameEl = document.getElementById('customerOrderHistoryName')
  const contentEl = document.getElementById('customerOrderHistoryContent')

  if (nameEl) nameEl.textContent = customerName
  if (contentEl) contentEl.innerHTML = '<div class="text-center py-8 text-gray-400"><i class="fas fa-spinner fa-spin text-2xl"></i></div>'

  showAdminOverlay(modal)

  try {
    const res = await axios.get('/api/admin/customers/' + encodeURIComponent(identifier) + '/orders?type=' + encodeURIComponent(type || 'phone'))
    const orders = Array.isArray(res.data?.data) ? res.data.data : []

    if (!orders.length) {
      if (contentEl) contentEl.innerHTML = '<div class="text-center py-8 text-gray-400"><i class="fas fa-inbox text-4xl mb-3"></i><p>Chưa có đơn hàng nào</p></div>'
      return
    }

    if (contentEl) {
      contentEl.innerHTML = orders.map(order => {
        const orderCode = escapeHtml(order.order_code || '')
        const productName = escapeHtml(order.product_name || 'Sản phẩm')
        const productThumbnail = escapeHtml(order.product_thumbnail || order.thumbnail || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=80')
        const quantity = Number(order.quantity || 0)
        const totalPrice = formatCustomerMoney(order.total_price || 0)
        const status = String(order.status || 'pending')
        const createdAt = formatDate(order.created_at)

        const statusMap = {
          pending: { label: 'Chờ xử lý', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
          confirmed: { label: 'Đã xác nhận', className: 'bg-blue-50 text-blue-700 border-blue-200' },
          shipping: { label: 'Đang giao', className: 'bg-purple-50 text-purple-700 border-purple-200' },
          done: { label: 'Hoàn thành', className: 'bg-green-50 text-green-700 border-green-200' },
          cancelled: { label: 'Đã hủy', className: 'bg-red-50 text-red-700 border-red-200' }
        }
        const statusInfo = statusMap[status] || statusMap.pending

        return '<div class="bg-white rounded-2xl border border-gray-200 p-4 hover:shadow-md transition">'
          + '<div class="flex items-start gap-3 mb-3">'
          + '<img src="' + productThumbnail + '" alt="" loading="lazy" class="w-16 h-16 rounded-xl object-cover border border-gray-200 bg-gray-100">'
          + '<div class="flex-1 min-w-0">'
          + '<div class="flex items-start justify-between gap-2 mb-1">'
          + '<div class="text-sm font-semibold text-gray-900 break-words">' + productName + '</div>'
          + '<span class="inline-block px-2 py-1 rounded-lg text-xs font-semibold border shrink-0 ' + statusInfo.className + '">' + statusInfo.label + '</span>'
          + '</div>'
          + '<div class="text-xs text-gray-500">Mã: ' + orderCode + '</div>'
          + '<div class="text-xs text-gray-500 mt-1">Số lượng: ' + quantity + '</div>'
          + '</div>'
          + '</div>'
          + '<div class="flex items-center justify-between pt-3 border-t border-gray-100">'
          + '<div class="text-xs text-gray-500">' + createdAt + '</div>'
          + '<div class="text-sm font-bold text-gray-900">' + totalPrice + '</div>'
          + '</div>'
          + '</div>'
      }).join('')
    }
  } catch (e) {
    if (contentEl) contentEl.innerHTML = '<div class="text-center py-8 text-red-400"><i class="fas fa-exclamation-circle text-4xl mb-3"></i><p>Không thể tải lịch sử đơn hàng</p></div>'
    console.error('openCustomerOrderHistory error:', e)
  }
}

function closeCustomerOrderHistoryModal(event) {
  if (event && event.target !== event.currentTarget) return
  const modal = document.getElementById('customerOrderHistoryModal')
  forceHideAdminOverlay(modal)
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/A'
  try {
    const d = new Date(String(dateStr).trim().replace(' ', 'T'))
    return d.toLocaleDateString('vi-VN') + ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return 'N/A'
  }
}

function escapeHtml(text) {
  const div = document.createElement('div')
  div.textContent = text == null ? '' : String(text)
  return div.innerHTML
}

async function blockCustomer(userId, phone) {
  if (!confirm('Bạn có chắc muốn chặn khách hàng này? Họ sẽ không thể đặt hàng.')) return
  
  try {
    const res = await axios.post('/api/admin/customers/block', {
      user_id: userId,
      customer_phone: phone,
      reason: 'Bị chặn bởi quản trị viên'
    })
    
    if (res.data?.success) {
      showAdminToast('Đã chặn khách hàng', 'success')
      loadCustomers()
    } else {
      showAdminToast(res.data?.error || 'Không thể chặn khách hàng', 'error')
    }
  } catch (e) {
    showAdminToast(e?.response?.data?.error || 'Lỗi khi chặn khách hàng', 'error')
    console.error('Block customer error:', e)
  }
}

async function unblockCustomer(userId, phone) {
  if (!confirm('Bạn có chắc muốn bỏ chặn khách hàng này?')) return
  
  try {
    const res = await axios.post('/api/admin/customers/unblock', {
      user_id: userId,
      customer_phone: phone
    })
    
    if (res.data?.success) {
      showAdminToast('Đã bỏ chặn khách hàng', 'success')
      loadCustomers()
    } else {
      showAdminToast(res.data?.error || 'Không thể bỏ chặn khách hàng', 'error')
    }
  } catch (e) {
    showAdminToast(e?.response?.data?.error || 'Lỗi khi bỏ chặn khách hàng', 'error')
    console.error('Unblock customer error:', e)
  }
}
`
}
