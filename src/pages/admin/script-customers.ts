export function adminCustomersScript(): string {
  return `// CUSTOMERS MANAGEMENT
let customersData = []
let filteredCustomersData = []

async function loadCustomers() {
  try {
    const res = await axios.get('/api/admin/customers')
    customersData = res.data?.data || []
    filterCustomers()
  } catch (e) {
    showAdminToast('Không thể tải dữ liệu khách hàng', 'error')
    console.error(e)
  }
}

function filterCustomers() {
  const search = String(document.getElementById('customersSearch')?.value || '').toLowerCase().trim()
  
  filteredCustomersData = customersData.filter(customer => {
    if (!search) return true
    
    const customerName = String(customer.customer_name || '').toLowerCase()
    const customerPhone = String(customer.customer_phone || '').toLowerCase()
    const userName = String(customer.user_name || '').toLowerCase()
    
    return customerName.includes(search) || customerPhone.includes(search) || userName.includes(search)
  })
  
  renderCustomersTable()
}

function renderCustomersTable() {
  const tbody = document.getElementById('customersTableBody')
  const mobileList = document.getElementById('customersMobileList')
  const empty = document.getElementById('customersEmpty')
  const countEl = document.getElementById('customersCount')
  
  if (countEl) countEl.textContent = filteredCustomersData.length + ' khách hàng'
  
  if (!filteredCustomersData.length) {
    if (tbody) tbody.innerHTML = '<tr><td colspan="4" class="px-4 py-16 text-center text-gray-400"><i class="fas fa-inbox text-4xl mb-3"></i><p>Không có dữ liệu</p></td></tr>'
    if (mobileList) mobileList.innerHTML = ''
    if (empty) empty.classList.remove('hidden')
    return
  }
  
  if (empty) empty.classList.add('hidden')
  
  // Desktop table
  if (tbody) {
    tbody.innerHTML = filteredCustomersData.map(customer => {
      const customerName = escapeHtml(customer.customer_name || '')
      const userName = escapeHtml(customer.user_name || '')
      const customerPhone = escapeHtml(customer.customer_phone || '')
      const customerAddress = escapeHtml(customer.customer_address || 'Chưa có địa chỉ')
      const orderCount = Number(customer.order_count || 0)
      const firstProductName = escapeHtml(customer.first_product_name || 'Sản phẩm')
      const firstProductThumbnail = escapeHtml(customer.first_product_thumbnail || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=80')
      
      // Determine identifier for order history
      const identifier = customer.user_id ? customer.user_id : customer.customer_phone
      const identifierType = customer.user_id ? 'user_id' : 'phone'
      
      let row = '<tr class="border-b hover:bg-gray-50">' +
        '<td class="px-4 py-3">' +
          '<div class="text-sm font-semibold text-gray-900">' + customerName + '</div>'
      
      if (userName) {
        row += '<div class="text-xs text-gray-500 mt-0.5">@' + userName + '</div>'
      }
      
      row += '</td>' +
        '<td class="px-4 py-3 text-sm text-gray-700">' + customerPhone + '</td>' +
        '<td class="px-4 py-3 text-sm text-gray-700">' + customerAddress + '</td>' +
        '<td class="px-4 py-3">' +
          '<div class="flex items-center gap-3">' +
            '<img src="' + firstProductThumbnail + '" alt="Product" class="w-10 h-10 rounded-lg object-cover border border-gray-200">' +
            '<div class="flex-1 min-w-0">' +
              '<div class="text-sm text-gray-700 truncate">' + firstProductName + '</div>'
      
      if (orderCount > 1) {
        row += '<button onclick="openCustomerOrderHistory(\'' + identifier + '\', \'' + identifierType + '\', \'' + escapeHtml(customerName) + '\')" class="text-xs text-pink-600 hover:text-pink-700 font-medium mt-0.5">Xem thêm (' + orderCount + ' đơn)</button>'
      }
      
      row += '</div>' +
          '</div>' +
        '</td>' +
        '</tr>'
      
      return row
    }).join('')
  }
  
  // Mobile list
  if (mobileList) {
    mobileList.innerHTML = filteredCustomersData.map(customer => {
      const customerName = escapeHtml(customer.customer_name || '')
      const userName = escapeHtml(customer.user_name || '')
      const customerPhone = escapeHtml(customer.customer_phone || '')
      const orderCount = Number(customer.order_count || 0)
      const firstProductName = escapeHtml(customer.first_product_name || 'Sản phẩm')
      
      const identifier = customer.user_id ? customer.user_id : customer.customer_phone
      const identifierType = customer.user_id ? 'user_id' : 'phone'
      
      let card = '<div class="p-4 border-b">' +
        '<div class="text-sm font-semibold text-gray-900 mb-1">' + customerName + '</div>'
      
      if (userName) {
        card += '<div class="text-xs text-gray-500 mb-2">@' + userName + '</div>'
      }
      
      card += '<div class="text-sm text-gray-700 mb-2">' + customerPhone + '</div>' +
        '<div class="text-sm text-gray-700 mb-2">' + firstProductName + '</div>'
      
      if (orderCount > 1) {
        card += '<button onclick="openCustomerOrderHistory(\'' + identifier + '\', \'' + identifierType + '\', \'' + escapeHtml(customerName) + '\')" class="text-xs text-pink-600 hover:text-pink-700 font-medium">Xem thêm (' + orderCount + ' đơn)</button>'
      }
      
      card += '</div>'
      
      return card
    }).join('')
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
    const res = await axios.get('/api/admin/customers/' + encodeURIComponent(identifier) + '/orders?type=' + type)
    const orders = res.data?.data || []
    
    if (!orders.length) {
      if (contentEl) contentEl.innerHTML = '<div class="text-center py-8 text-gray-400"><i class="fas fa-inbox text-4xl mb-3"></i><p>Chưa có đơn hàng nào</p></div>'
      return
    }
    
    // Render order history using similar UI to frontend order history
    if (contentEl) {
      contentEl.innerHTML = orders.map(order => {
        const orderCode = escapeHtml(order.order_code || '')
        const productName = escapeHtml(order.product_name || '')
        const productThumbnail = escapeHtml(order.product_thumbnail || order.thumbnail || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=80')
        const quantity = Number(order.quantity || 0)
        const totalPrice = Number(order.total_price || 0).toLocaleString('vi-VN')
        const status = String(order.status || 'pending')
        const createdAt = formatDate(order.created_at)
        
        const statusMap = {
          'pending': { label: 'Chờ xử lý', class: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
          'confirmed': { label: 'Đã xác nhận', class: 'bg-blue-50 text-blue-700 border-blue-200' },
          'shipping': { label: 'Đang giao', class: 'bg-purple-50 text-purple-700 border-purple-200' },
          'done': { label: 'Hoàn thành', class: 'bg-green-50 text-green-700 border-green-200' },
          'cancelled': { label: 'Đã hủy', class: 'bg-red-50 text-red-700 border-red-200' }
        }
        
        const statusInfo = statusMap[status] || statusMap['pending']
        
        return '<div class="bg-white rounded-2xl border border-gray-200 p-4 hover:shadow-md transition">' +
          '<div class="flex items-start gap-3 mb-3">' +
            '<img src="' + productThumbnail + '" alt="Product" class="w-16 h-16 rounded-lg object-cover border border-gray-200">' +
            '<div class="flex-1 min-w-0">' +
              '<div class="flex items-start justify-between gap-2 mb-1">' +
                '<div class="text-sm font-semibold text-gray-900">' + productName + '</div>' +
                '<span class="inline-block px-2 py-1 rounded-lg text-xs font-semibold border ' + statusInfo.class + '">' + statusInfo.label + '</span>' +
              '</div>' +
              '<div class="text-xs text-gray-500">Mã: ' + orderCode + '</div>' +
              '<div class="text-xs text-gray-500 mt-1">Số lượng: ' + quantity + '</div>' +
            '</div>' +
          '</div>' +
          '<div class="flex items-center justify-between pt-3 border-t border-gray-100">' +
            '<div class="text-xs text-gray-500">' + createdAt + '</div>' +
            '<div class="text-sm font-bold text-gray-900">' + totalPrice + 'đ</div>' +
          '</div>' +
        '</div>'
      }).join('')
    }
  } catch (e) {
    if (contentEl) contentEl.innerHTML = '<div class="text-center py-8 text-red-400"><i class="fas fa-exclamation-circle text-4xl mb-3"></i><p>Không thể tải lịch sử đơn hàng</p></div>'
    console.error(e)
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
