export function adminReturnsScript(): string {
  return `// RETURNS MANAGEMENT
let returnsData = []
let filteredReturnsData = []
let currentReturnsTab = 'returned'

function switchReturnsTab(tab) {
  currentReturnsTab = tab
  document.querySelectorAll('.returns-tab').forEach(btn => btn.classList.remove('active', 'text-pink-600', 'border-pink-600'))
  document.querySelectorAll('.returns-tab').forEach(btn => btn.classList.add('text-gray-500', 'border-transparent'))
  
  const tabMap = {
    'returned': 'returnsTabReturned',
    'cancelled': 'returnsTabCancelled',
    'delivery_failed': 'returnsTabDeliveryFailed'
  }
  
  const activeBtn = document.getElementById(tabMap[tab])
  if (activeBtn) {
    activeBtn.classList.add('active', 'text-pink-600', 'border-pink-600')
    activeBtn.classList.remove('text-gray-500', 'border-transparent')
  }
  
  document.getElementById('returnsTableReturned').classList.toggle('hidden', tab !== 'returned')
  document.getElementById('returnsTableCancelled').classList.toggle('hidden', tab !== 'cancelled')
  document.getElementById('returnsTableDeliveryFailed').classList.toggle('hidden', tab !== 'delivery_failed')
  
  filterReturns()
}

async function loadReturns() {
  try {
    const res = await axios.get('/api/admin/returns')
    returnsData = res.data?.data || []
    filterReturns()
  } catch (e) {
    showAdminToast('Không thể tải dữ liệu hoàn trả', 'error')
    console.error(e)
  }
}

function filterReturns() {
  const search = String(document.getElementById('returnsSearch')?.value || '').toLowerCase().trim()
  
  filteredReturnsData = returnsData.filter(order => {
    let matchesTab = false
    if (currentReturnsTab === 'returned') {
      matchesTab = order.return_status === 'returned'
    } else if (currentReturnsTab === 'cancelled') {
      matchesTab = order.return_status === 'cancelled'
    } else if (currentReturnsTab === 'delivery_failed') {
      matchesTab = order.return_status === 'delivery_failed'
    }
    
    if (!matchesTab) return false
    
    if (!search) return true
    
    const orderCode = String(order.order_code || '').toLowerCase()
    const customerName = String(order.customer_name || '').toLowerCase()
    const customerPhone = String(order.customer_phone || '').toLowerCase()
    
    return orderCode.includes(search) || customerName.includes(search) || customerPhone.includes(search)
  })
  
  renderReturnsTable()
}

function getCancelReason(order) {
  // Use cancelled_by field if available
  const cancelledBy = String(order.cancelled_by || '').toLowerCase()
  if (cancelledBy === 'shop') return 'Shop huỷ'
  if (cancelledBy === 'customer') return 'Khách tự huỷ'
  
  // Fallback: Determine if cancelled by customer or shop based on shipping status
  const status = String(order.status || '').toLowerCase()
  const shippingArranged = Number(order.shipping_arranged || 0)
  const trackingCode = String(order.shipping_tracking_code || '').trim()
  
  // If order was cancelled before shipping was arranged, it's shop cancelled
  if (status === 'cancelled' && !shippingArranged && !trackingCode) {
    return 'Shop huỷ'
  }
  
  // If order has tracking code but was cancelled, it's customer cancelled (bom hang)
  return 'Khách tự huỷ'
}

function renderReturnsTable() {
  const tabSuffixMap = {
    'returned': 'Returned',
    'cancelled': 'Cancelled',
    'delivery_failed': 'DeliveryFailed'
  }
  
  const suffix = tabSuffixMap[currentReturnsTab]
  const tbody = document.getElementById('returnsTableBody' + suffix)
  const mobileList = document.getElementById('returnsMobileList' + suffix)
  const empty = document.getElementById('returnsEmpty' + suffix)
  const countEl = document.getElementById('returnsCount')
  
  if (countEl) countEl.textContent = filteredReturnsData.length + ' đơn'
  
  if (!filteredReturnsData.length) {
    const colspanCount = currentReturnsTab === 'cancelled' ? 9 : 8
    if (tbody) tbody.innerHTML = '<tr><td colspan="' + colspanCount + '" class="px-4 py-16 text-center text-gray-400"><i class="fas fa-inbox text-4xl mb-3"></i><p>Không có dữ liệu</p></td></tr>'
    if (mobileList) mobileList.innerHTML = ''
    if (empty) empty.classList.remove('hidden')
    return
  }
  
  if (empty) empty.classList.add('hidden')
  
  // Desktop table
  if (tbody) {
    tbody.innerHTML = filteredReturnsData.map(order => {
      const orderCode = escapeHtml(order.order_code || '')
      const customerName = escapeHtml(order.customer_name || '')
      const customerPhone = escapeHtml(order.customer_phone || '')
      const productName = escapeHtml(order.product_name || '')
      const quantity = Number(order.quantity || 0)
      const totalPrice = Number(order.total_price || 0).toLocaleString('vi-VN')
      const trackingCode = escapeHtml(order.shipping_tracking_code || 'N/A')
      const createdAt = formatDate(order.created_at)
      
      let row = '<tr class="border-b hover:bg-gray-50">' +
        '<td class="px-4 py-3"><span class="font-mono text-xs text-blue-600">' + orderCode + '</span></td>' +
        '<td class="px-4 py-3"><div class="text-sm font-semibold text-gray-900">' + customerName + '</div><div class="text-xs text-gray-500">' + customerPhone + '</div></td>' +
        '<td class="px-4 py-3 text-sm text-gray-700">' + productName + '</td>' +
        '<td class="px-4 py-3 text-center font-semibold">' + quantity + '</td>' +
        '<td class="px-4 py-3 text-right font-semibold text-gray-900">' + totalPrice + 'đ</td>'
      
      // Add "Lý do" column only for cancelled tab
      if (currentReturnsTab === 'cancelled') {
        const reason = getCancelReason(order)
        const reasonClass = reason === 'Shop huỷ' ? 'text-orange-600 bg-orange-50' : 'text-red-600 bg-red-50'
        row += '<td class="px-4 py-3 text-center"><span class="inline-block px-2 py-1 rounded-lg text-xs font-semibold ' + reasonClass + '">' + reason + '</span></td>'
      }
      
      row += '<td class="px-4 py-3 text-center"><span class="font-mono text-xs text-gray-600">' + trackingCode + '</span></td>' +
        '<td class="px-4 py-3 text-center text-xs text-gray-500">' + createdAt + '</td>' +
        '<td class="px-4 py-3 text-center"><button onclick="viewReturnDetail(' + order.id + ')" class="text-pink-600 hover:text-pink-700 text-sm font-medium"><i class="fas fa-eye"></i></button></td>' +
        '</tr>'
      
      return row
    }).join('')
  }
  
  // Mobile list
  if (mobileList) {
    mobileList.innerHTML = filteredReturnsData.map(order => {
      const orderCode = escapeHtml(order.order_code || '')
      const customerName = escapeHtml(order.customer_name || '')
      const productName = escapeHtml(order.product_name || '')
      const totalPrice = Number(order.total_price || 0).toLocaleString('vi-VN')
      
      let card = '<div class="p-4 border-b">' +
        '<div class="flex items-start justify-between gap-2 mb-2">' +
          '<span class="font-mono text-xs text-blue-600">' + orderCode + '</span>' +
          '<button onclick="viewReturnDetail(' + order.id + ')" class="text-pink-600 text-sm"><i class="fas fa-eye"></i></button>' +
        '</div>' +
        '<div class="text-sm font-semibold text-gray-900 mb-1">' + customerName + '</div>'
      
      // Add reason badge for cancelled tab
      if (currentReturnsTab === 'cancelled') {
        const reason = getCancelReason(order)
        const reasonClass = reason === 'Shop huỷ' ? 'text-orange-600 bg-orange-50' : 'text-red-600 bg-red-50'
        card += '<div class="mb-2"><span class="inline-block px-2 py-1 rounded-lg text-xs font-semibold ' + reasonClass + '">' + reason + '</span></div>'
      }
      
      card += '<div class="text-sm text-gray-700 mb-2">' + productName + '</div>' +
        '<div class="text-right font-semibold text-gray-900">' + totalPrice + 'đ</div>' +
        '</div>'
      
      return card
    }).join('')
  }
}

async function syncReturnsFromGHTK() {
  const btn = document.getElementById('syncReturnsBtn')
  if (!btn) return
  
  const originalText = btn.innerHTML
  btn.disabled = true
  btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Đang đồng bộ...'
  
  try {
    const res = await axios.post('/api/admin/returns/sync-ghtk')
    if (res.data?.success) {
      showAdminToast('Đồng bộ thành công: ' + (res.data.synced_count || 0) + ' đơn', 'success')
      await loadReturns()
    } else {
      showAdminToast(res.data?.error || 'Đồng bộ thất bại', 'error')
    }
  } catch (e) {
    const msg = e.response?.data?.error || 'Lỗi khi đồng bộ với GHTK'
    showAdminToast(msg, 'error')
    console.error(e)
  } finally {
    btn.disabled = false
    btn.innerHTML = originalText
  }
}

function viewReturnDetail(orderId) {
  const order = returnsData.find(o => o.id === orderId)
  if (!order) return
  
  // Reuse existing order detail modal
  if (typeof openOrderDetailModal === 'function') {
    openOrderDetailModal(orderId)
  } else {
    showAdminToast('Chi tiết đơn hàng: ' + order.order_code, 'info')
  }
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/A'
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('vi-VN') + ' ' + d.toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'})
  } catch {
    return 'N/A'
  }
}

function escapeHtml(text) {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}
`
}
