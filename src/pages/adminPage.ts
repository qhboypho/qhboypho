export function adminHTML(): string {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Admin – QH Clothes</title>
<script src="https://cdn.tailwindcss.com"><\/script>
<link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"><\/script>
<script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"><\/script>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
  * { font-family: 'Inter', sans-serif; }
  .sidebar { background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%); }
  .nav-item { transition: all 0.2s; }
  .nav-item.active, .nav-item:hover { background: rgba(232,67,147,0.15); color: #e84393; }
  .nav-item.active { border-left: 3px solid #e84393; }
  .nav-sub-item { transition: all 0.2s; }
  .nav-sub-item.active, .nav-sub-item:hover { background: rgba(16,185,129,0.15); color: #34d399; }
  .stat-card { background: linear-gradient(135deg, var(--from), var(--to)); }
  .btn-pink { background: linear-gradient(135deg,#e84393,#c0392b); transition:all 0.2s; }
  .btn-pink:hover { opacity:0.9; transform:scale(1.01); }
  .table-row:hover { background: #fdf2f8; }
  .badge { display:inline-flex; align-items:center; padding:2px 10px; border-radius:99px; font-size:12px; font-weight:600; }
  .badge-pending { background:#fef3c7; color:#d97706; }
  .badge-confirmed { background:#dbeafe; color:#2563eb; }
  .badge-shipping { background:#ede9fe; color:#7c3aed; }
  .badge-done { background:#d1fae5; color:#059669; }
  .badge-cancelled { background:#fee2e2; color:#dc2626; }
  .modal-overlay { background:rgba(0,0,0,0.6); backdrop-filter:blur(4px); }
  .modal-card { animation: fadeIn 0.25s ease; }
  @keyframes fadeIn { from{opacity:0;transform:scale(0.95)} to{opacity:1;transform:scale(1)} }
  .avatar-edit-overlay { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.35); opacity:0; transition:opacity 0.2s; pointer-events:none; }
  .avatar-wrap:hover .avatar-edit-overlay { opacity:1; }
  .img-slot { aspect-ratio:1; border:2px dashed #e5e7eb; border-radius:12px; cursor:pointer; transition:all 0.2s; }
  .img-slot:hover { border-color:#e84393; background:#fdf2f8; }
  .img-slot.drag-over { border-color:#ec4899; background:#fce7f3; box-shadow:0 0 0 2px rgba(236,72,153,.12) inset; }
  .img-slot.has-img { border-style:solid; border-color:#e84393; }
  .tag-item { display:inline-flex; align-items:center; background:#fdf2f8; border:1px solid #f9a8d4; color:#be185d; border-radius:999px; padding:3px 10px; font-size:13px; gap:4px; }
  .tag-del { cursor:pointer; width:16px; height:16px; display:flex; align-items:center; justify-content:center; border-radius:50%; background:#fecdd3; color:#e11d48; font-size:10px; }
  .tag-del:hover { background:#fca5a5; }
  .toast-admin { animation: slideIn 0.3s ease; }
  @keyframes slideIn { from{opacity:0;transform:translateX(100%)} to{opacity:1;transform:translateX(0)} }
  .scrollbar-thin::-webkit-scrollbar { width:4px; }
  .scrollbar-thin::-webkit-scrollbar-thumb { background:#e84393; border-radius:2px; }
  .mobile-overlay { background:rgba(0,0,0,0.5); }
  [x-cloak] { display:none; }
  .col-tag { width: 32px; height: 32px; border-radius: 50%; display:inline-flex; align-items:center; justify-content:center; font-size:11px; font-weight:600; }
  .orders-header-search {
    display: none;
    align-items: center;
    margin-left: 0.25rem;
  }
  .orders-header-search.is-visible {
    display: flex;
  }
  .orders-header-search-shell {
    display: flex;
    align-items: center;
    width: 176px;
    height: 44px;
    border: 1px solid #e5e7eb;
    border-radius: 9999px;
    background: #fff;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
    overflow: hidden;
    transition: width 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
  }
  .orders-header-search.expanded .orders-header-search-shell,
  .orders-header-search-shell:focus-within {
    width: 226px;
    border-color: #f9a8d4;
    box-shadow: 0 14px 34px rgba(232, 67, 147, 0.14);
  }
  .orders-header-search-btn {
    width: 44px;
    height: 44px;
    border: 0;
    background: transparent;
    color: #64748b;
    flex: 0 0 44px;
  }
  .orders-header-search-btn:hover {
    color: #e84393;
  }
  .orders-header-search-input {
    width: 100%;
    min-width: 0;
    border: 0;
    outline: none;
    background: transparent;
    color: #334155;
    padding: 0 14px 0 0;
    opacity: 1;
    transition: width 0.25s ease, opacity 0.2s ease, padding 0.25s ease;
  }
  .orders-mobile-stack {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 0.75rem;
    background: #f8fafc;
  }
  .orders-mobile-card {
    border: 1px solid #e5e7eb;
    border-radius: 1rem;
    background: #fff;
    box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
    padding: 0.75rem;
  }
  @media (max-width: 767px) {
    .orders-header-search {
      margin-left: auto;
      position: relative;
      z-index: 110;
    }
    .orders-header-search .orders-header-search-input {
      width: 0;
      padding: 0;
      opacity: 0;
    }
    .orders-header-search .orders-header-search-shell {
      width: 44px;
      box-shadow: 0 4px 14px rgba(15, 23, 42, 0.08);
    }
    .orders-header-search.expanded {
      position: fixed;
      top: 12px;
      left: 12px;
      right: 12px;
      z-index: 999;
    }
    .orders-header-search.expanded .orders-header-search-shell {
      width: 100%;
      border-radius: 18px;
      border-color: #f9a8d4;
      box-shadow: 0 20px 45px rgba(15, 23, 42, 0.18);
    }
    .orders-header-search.expanded .orders-header-search-input {
      width: 100%;
      padding: 0 16px 0 0;
      opacity: 1;
    }
  }
  /* Force hide sidebar overlay on desktop - overrides any JS toggle */
  @media (min-width: 768px) {
    #sidebarOverlay { display: none !important; }
  }
  /* Ensure modals don't accidentally block page */
  .modal-overlay.hidden { pointer-events: none !important; }
</style>
</head>
<body class="bg-gray-50 flex">

<!-- MOBILE MENU TOGGLE -->
<button id="menuToggle" onclick="toggleSidebar()" class="fixed top-4 left-4 z-50 md:hidden bg-white shadow-lg rounded-xl p-2.5">
  <i class="fas fa-bars text-gray-700"></i>
</button>

<!-- SIDEBAR OVERLAY (mobile) -->
<div id="sidebarOverlay" class="fixed inset-0 mobile-overlay z-30 md:hidden" style="display:none" onclick="toggleSidebar()"></div>

<!-- SIDEBAR -->
<aside id="sidebar" class="sidebar w-64 min-h-screen fixed left-0 top-0 z-40 transform -translate-x-full md:translate-x-0 transition-transform duration-300 flex flex-col">
  <div class="p-6 border-b border-white/10">
    <div class="flex items-center gap-3">
      <span class="inline-flex items-center justify-center"><img src="/qh-logo.png" alt="QH" class="rounded-full w-9 h-9 object-cover bg-white"></span>
      <div>
        <p class="text-white font-bold text-lg leading-tight">QH<span class="text-pink-400">Clothes</span></p>
        <p class="text-gray-400 text-xs">Admin Panel</p>
      </div>
    </div>
  </div>
  
  <nav class="p-4 flex-1 space-y-1">
    <button class="nav-item active w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 text-sm font-medium" data-page="dashboard" onclick="showPage('dashboard')">
      <i class="fas fa-chart-pie w-5"></i>Dashboard
    </button>
    <button class="nav-item w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 text-sm font-medium" data-page="products" onclick="showPage('products')">
      <i class="fas fa-tshirt w-5"></i>Sản phẩm
    </button>
    <button class="nav-item w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 text-sm font-medium" data-page="orders" onclick="showPage('orders')">
      <i class="fas fa-clipboard-list w-5"></i>Đơn hàng
      <span id="pendingBadge" class="ml-auto bg-pink-500 text-white text-xs rounded-full px-2 py-0.5 hidden"></span>
    </button>
    <button class="nav-item w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 text-sm font-medium" data-page="vouchers" onclick="showPage('vouchers')">
      <i class="fas fa-ticket-alt w-5"></i>Voucher
    </button>
    <button class="nav-item w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 text-sm font-medium" data-page="featured" onclick="showPage('featured')">
      <i class="fas fa-star w-5"></i>Sản phẩm Nổi Bật
    </button>
    <button id="settingsMenuBtn" class="nav-item w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 text-sm font-medium" onclick="toggleSettingsMenu()">
      <i class="fas fa-gear w-5"></i>
      <span>Cài đặt</span>
      <i id="settingsMenuChevron" class="fas fa-chevron-down ml-auto text-xs transition-transform"></i>
    </button>
    <div id="settingsSubmenu" class="hidden ml-5 mt-1 space-y-1">
      <button class="nav-sub-item w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-gray-400 text-sm font-medium" data-sub-page="settings-warehouse" onclick="openSettingsWarehouse()">
        <i class="fas fa-warehouse w-4"></i>Cài đặt kho hàng
      </button>
    </div>
  </nav>
  
  <div class="p-4 border-t border-white/10">
    <a href="/" target="_blank" class="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 text-sm hover:text-pink-400 transition">
      <i class="fas fa-external-link-alt w-5"></i>Xem trang chủ
    </a>
  </div>
</aside>

<!-- MAIN CONTENT -->
<main class="flex-1 md:ml-64 min-h-screen">
  <!-- Top bar -->
  <header class="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
    <div class="ml-10 md:ml-0 flex items-center gap-3 min-w-0 flex-1">
      <h1 id="pageTitle" class="text-lg font-bold text-gray-800 shrink-0">Dashboard</h1>
      <div id="ordersHeaderSearch" class="orders-header-search hidden">
        <div class="orders-header-search-shell">
          <button id="ordersHeaderSearchButton" type="button" onclick="handleOrdersSearchButton()" class="orders-header-search-btn" aria-label="Mở tìm kiếm đơn hàng">
            <i id="ordersHeaderSearchIcon" class="fas fa-search text-sm"></i>
          </button>
          <input type="text" id="orderSearch" placeholder="Tìm tên/SĐT/mã..." oninput="onOrderSearchInput()" class="orders-header-search-input text-sm" />
        </div>
      </div>
    </div>
    <div class="flex items-center gap-3">
      <div id="adminAvatarMenuRoot" class="relative">
        <button type="button" onclick="toggleAdminAvatarMenu()" title="Tài khoản quản trị" class="w-auto max-w-[260px] rounded-full bg-gray-900 text-white pl-1.5 pr-3 py-1.5 flex items-center gap-2 shadow-sm hover:bg-gray-800 transition">
          <span class="relative w-8 h-8 rounded-full overflow-hidden bg-gray-50 text-gray-700 font-bold text-xs flex items-center justify-center flex-none">
            <img id="adminHeaderAvatarImg" src="" alt="avatar" class="w-full h-full object-cover hidden">
            <span id="adminHeaderAvatarFallback">A</span>
          </span>
          <span id="adminHeaderProfileName" class="text-sm font-semibold truncate">QH Clothes</span>
        </button>
        <div id="adminAvatarDropdown" class="hidden absolute right-0 mt-2 w-[320px] bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-50">
          <div class="p-3 bg-gray-50 border-b border-gray-200">
            <div class="flex items-center gap-3">
              <button type="button" class="avatar-wrap relative w-14 h-14 rounded-full overflow-hidden bg-gray-50 text-gray-700 font-bold text-lg flex items-center justify-center cursor-pointer flex-none">
                <input id="adminAvatarInput" type="file" accept="image/*" class="absolute inset-0 z-20 opacity-0 cursor-pointer" onclick="event.stopPropagation()" onchange="onAdminAvatarSelected(this)">
                <img id="adminMenuAvatarImg" src="" alt="avatar" class="w-full h-full object-cover hidden">
                <span id="adminMenuAvatarFallback">A</span>
                <span class="avatar-edit-overlay"><i class="fas fa-camera text-white text-sm"></i></span>
              </button>
              <div class="min-w-0">
                <p id="adminMenuProfileName" class="text-sm font-semibold text-gray-900 truncate">QH Clothes</p>
                <p id="adminMenuShopCode" class="text-xs text-gray-400 truncate">Shop Code: ADMIN</p>
                <p class="text-xs text-gray-400">Tự bán hàng</p>
              </div>
            </div>
          </div>
          <button type="button" onclick="openChangeAdminPasswordModal(); closeAdminAvatarMenu();" class="w-full text-left px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
            <i class="fas fa-key text-amber-500"></i>Thay đổi mật khẩu
          </button>
          <button type="button" onclick="logoutAdminUser(); closeAdminAvatarMenu();" class="w-full text-left px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-gray-100">
            <i class="fas fa-right-from-bracket"></i>Logout
          </button>
        </div>
      </div>
    </div>
  </header>

  <!-- DASHBOARD PAGE -->
  <div id="page-dashboard" class="p-6">
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div class="stat-card rounded-2xl p-5 text-white" style="--from:#e84393;--to:#c0392b">
        <div class="flex justify-between items-start">
          <div><p class="text-white/80 text-sm">Sản phẩm</p><p id="statProducts" class="text-3xl font-bold mt-1">—</p></div>
          <div class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"><i class="fas fa-tshirt"></i></div>
        </div>
      </div>
      <div class="stat-card rounded-2xl p-5 text-white" style="--from:#667eea;--to:#764ba2">
        <div class="flex justify-between items-start">
          <div><p class="text-white/80 text-sm">Đơn hàng</p><p id="statOrders" class="text-3xl font-bold mt-1">—</p></div>
          <div class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"><i class="fas fa-shopping-bag"></i></div>
        </div>
      </div>
      <div class="stat-card rounded-2xl p-5 text-white" style="--from:#f093fb;--to:#f5576c">
        <div class="flex justify-between items-start">
          <div><p class="text-white/80 text-sm">Chờ xử lý</p><p id="statPending" class="text-3xl font-bold mt-1">—</p></div>
          <div class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"><i class="fas fa-clock"></i></div>
        </div>
      </div>
      <div class="stat-card rounded-2xl p-5 text-white" style="--from:#43e97b;--to:#38f9d7">
        <div class="flex justify-between items-start">
          <div><p class="text-white/80 text-sm">Doanh thu</p><p id="statRevenue" class="text-2xl font-bold mt-1">—</p></div>
          <div class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"><i class="fas fa-coins"></i></div>
        </div>
      </div>
    </div>
    
    <div class="bg-white rounded-2xl shadow-sm border p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-bold text-gray-800">Đơn hàng gần đây</h2>
        <button onclick="showPage('orders')" class="text-pink-500 text-sm hover:underline">Xem tất cả</button>
      </div>
      <div id="recentOrdersTable" class="overflow-x-auto">
        <div class="text-center py-8 text-gray-400"><i class="fas fa-spinner fa-spin text-2xl"></i></div>
      </div>
    </div>
  </div>

  <!-- PRODUCTS PAGE -->
  <div id="page-products" class="p-6 hidden">
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
      <div class="flex gap-2 items-center">
        <input type="text" id="productSearch" placeholder="Tìm sản phẩm..." oninput="filterAdminProducts()" 
          class="border rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-pink-400 w-48">
        <select id="productCatFilter" onchange="filterAdminProducts()" class="border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-400">
          <option value="">Tất cả</option>
          <option value="unisex">Unisex</option>
          <option value="male">Nam</option>
          <option value="female">Nữ</option>
        </select>
      </div>
      <button onclick="openProductModal()" class="btn-pink text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2">
        <i class="fas fa-plus"></i>Thêm sản phẩm
      </button>
    </div>
    
    <div id="adminProductsGrid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"></div>
  </div>

  <!-- ORDERS PAGE -->
  <div id="page-orders" class="p-6 hidden">
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
      <div class="flex gap-2 flex-wrap items-center">
        <select id="orderStatusFilter" onchange="setOrdersPage(1); filterOrders()" class="border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-400">
          <option value="all">Tất cả trạng thái</option>
          <option value="pending">Chờ xử lý</option>
          <option value="confirmed">Đã xác nhận</option>
          <option value="shipping">Đang giao</option>
          <option value="done">Hoàn thành</option>
          <option value="cancelled">Đã hủy</option>
        </select>
        <select id="ordersViewModeSelect" onchange="setOrdersViewMode(this.value)" class="border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-400 min-w-[220px] bg-white text-gray-700 font-semibold">
          <option id="ordersViewModeToArrangeOption" value="to_arrange">Sắp xếp vận chuyển (0)</option>
          <option id="ordersViewModeWaitingOption" value="waiting_ship">Đang chờ vận chuyển (0)</option>
        </select>
      </div>
      <div class="flex items-center gap-2">
        <button onclick="exportExcel()" class="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition">
          <i class="fas fa-file-excel"></i>Xuất Excel
        </button>
      </div>
    </div>
    
    <div class="bg-white rounded-2xl shadow-sm border overflow-hidden">
      <div class="hidden md:block overflow-x-auto scrollbar-thin">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-gray-50 border-b">
              <th class="px-3 py-3 text-center font-semibold text-gray-600 w-10 min-w-10">
                <input id="ordersSelectAll" type="checkbox" onchange="toggleSelectAllOrders(this.checked)" class="w-4 h-4 rounded border-gray-300 text-pink-500 focus:ring-pink-400">
              </th>
              <th class="px-4 py-3 text-left font-semibold text-gray-600 w-[360px] min-w-[360px]">Thông tin ĐH</th>
              <th class="px-2 py-3 text-center font-semibold text-gray-600 w-12 min-w-12">SL</th>
              <th class="px-4 py-3 text-right font-semibold text-gray-600 w-[150px] min-w-[150px]">Tổng tiền</th>
              <th class="px-4 py-3 text-center font-semibold text-gray-600 hidden lg:table-cell w-[120px] min-w-[120px]">Voucher</th>
              <th class="px-4 py-3 text-center font-semibold text-gray-600 w-[240px] min-w-[240px]">Trạng thái</th>
            </tr>
          </thead>
          <tbody id="ordersTable"></tbody>
        </table>
      </div>
      <div id="ordersMobileList" class="md:hidden"></div>
      <div id="ordersEmpty" class="hidden text-center py-16 text-gray-400">
        <i class="fas fa-inbox text-4xl mb-3"></i><p>Không có đơn hàng nào</p>
      </div>
    </div>
    <div id="ordersPagination" class="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-500"></div>
    <div id="orderStats" class="mt-2 text-sm text-gray-500 text-right"></div>
  </div>

  <div id="ordersBulkActionBar" class="hidden fixed left-1/2 -translate-x-1/2 z-[70]" style="bottom: 200px;">
    <div class="bg-white/95 backdrop-blur border border-gray-200 shadow-2xl rounded-2xl px-3 py-2 flex items-center gap-2">
      <button id="bulkArrangeShipBtn" onclick="arrangeSelectedForShipping()" class="hidden bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition">
        <i class="fas fa-truck-loading"></i><span id="bulkArrangeShipText">Sắp xếp vận chuyển</span>
      </button>
      <button id="bulkDeleteOrdersBtn" onclick="deleteSelectedOrders()" class="hidden bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition">
        <i class="fas fa-trash"></i><span id="bulkDeleteOrdersText">Xoá đã chọn</span>
      </button>
    </div>
  </div>

  <div id="shippingBulkActionBar" class="hidden fixed bottom-5 left-1/2 -translate-x-1/2 z-[70]">
    <div class="bg-white border border-gray-200 shadow-2xl rounded-2xl px-3 py-2 flex items-center gap-2">
      <span id="shippingBulkSelectedText" class="text-sm text-gray-700 px-2">Đã chọn 0 đơn</span>
      <button onclick="printSelectedOrders()" class="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition">
        In đơn hàng loạt
      </button>
    </div>
  </div>

  <!-- VOUCHERS PAGE -->
  <div id="page-vouchers" class="p-6 hidden">
    <div class="grid md:grid-cols-2 gap-6">
      <!-- Create Voucher Form -->
      <div class="bg-white rounded-2xl shadow-sm border p-6">
        <h2 class="font-bold text-gray-800 text-lg mb-5 flex items-center gap-2">
          <i class="fas fa-plus-circle text-pink-500"></i>Tạo Voucher mới
        </h2>
        <form onsubmit="createVoucher(event)" class="space-y-4">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1.5">
              <i class="fas fa-coins text-pink-400 mr-1"></i>Số tiền giảm (VNĐ) *
            </label>
            <input type="number" id="vDiscount" placeholder="VD: 50000" min="1000" required
              class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400">
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1.5">
                <i class="fas fa-calendar-check text-pink-400 mr-1"></i>Hiệu lực từ *
              </label>
              <input type="datetime-local" id="vFrom" required
                class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400">
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1.5">
                <i class="fas fa-calendar-times text-pink-400 mr-1"></i>Hết hạn *
              </label>
              <input type="datetime-local" id="vTo" required
                class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400">
            </div>
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1.5">
              <i class="fas fa-barcode text-pink-400 mr-1"></i>Mã tuỳ chỉnh <span class="text-gray-400 font-normal">(để trống = tự sinh)</span>
            </label>
            <input type="text" id="vCode" placeholder="VD: SUMMER30"
              class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400 uppercase tracking-wider"
              oninput="this.value=this.value.toUpperCase()">
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1.5">
              <i class="fas fa-users text-pink-400 mr-1"></i>Giới hạn lượt dùng <span class="text-gray-400 font-normal">(0 = không giới hạn)</span>
            </label>
            <input type="number" id="vLimit" placeholder="0" min="0" value="0"
              class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400">
          </div>
          <button type="submit" id="createVoucherBtn" class="btn-pink w-full text-white py-3 rounded-xl font-bold text-sm">
            <i class="fas fa-magic mr-2"></i>Tạo & Sinh mã Voucher
          </button>
        </form>
        <!-- Generated code display -->
        <div id="generatedCode" class="hidden mt-4 p-4 rounded-2xl bg-gradient-to-r from-pink-50 to-red-50 border border-pink-200 text-center">
          <p class="text-xs text-gray-500 mb-1">Mã voucher vừa tạo:</p>
          <p id="generatedCodeText" class="text-2xl font-bold tracking-widest text-pink-600 font-mono"></p>
          <button onclick="copyCode()" class="mt-2 text-xs text-gray-500 hover:text-pink-500 transition">
            <i class="fas fa-copy mr-1"></i>Sao chép
          </button>
        </div>
      </div>

      <!-- Voucher List -->
      <div class="bg-white rounded-2xl shadow-sm border p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-bold text-gray-800 text-lg flex items-center gap-2">
            <i class="fas fa-list text-pink-500"></i>Danh sách Voucher
          </h2>
          <button onclick="loadVouchers()" class="text-sm text-pink-500 hover:underline">
            <i class="fas fa-sync-alt mr-1"></i>Làm mới
          </button>
        </div>
        <div id="voucherList" class="space-y-3 max-h-[500px] overflow-y-auto scrollbar-thin pr-1">
          <div class="text-center py-8 text-gray-400"><i class="fas fa-spinner fa-spin text-2xl"></i></div>
        </div>
      </div>
    </div>
  </div>

  <!-- FEATURED PRODUCTS PAGE -->
  <div id="page-featured" class="p-6 hidden">
    <div class="mb-6">
      <div class="flex items-center justify-between mb-2">
        <div>
          <h2 class="font-bold text-gray-800 text-xl flex items-center gap-2">
            <i class="fas fa-star text-amber-400"></i>Quản lý Sản phẩm Nổi Bật
          </h2>
          <p class="text-sm text-gray-500 mt-1">Chọn sản phẩm muốn hiển thị nổi bật và sắp xếp thứ tự. Khi khách bấm vào, sẽ mở modal chi tiết sản phẩm.</p>
        </div>
        <div class="flex items-center gap-3">
          <span id="featuredCount" class="text-sm font-semibold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
            <i class="fas fa-star mr-1"></i>0 sản phẩm nổi bật
          </span>
          <button onclick="saveFeaturedOrder()" id="saveFeaturedBtn" class="bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition shadow-sm">
            <i class="fas fa-save"></i>Lưu thứ tự
          </button>
        </div>
      </div>

      <!-- Featured Preview Strip -->
      <div id="featuredPreviewStrip" class="hidden bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 mb-4">
        <p class="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-3"><i class="fas fa-eye mr-1"></i>Xem trước thứ tự hiển thị</p>
        <div id="featuredPreviewItems" class="flex gap-3 overflow-x-auto pb-2"></div>
      </div>
    </div>

    <!-- Products Grid for Featured Management -->
    <div class="bg-white rounded-2xl shadow-sm border overflow-hidden">
      <div class="border-b px-6 py-4 flex items-center gap-3 bg-gray-50">
        <i class="fas fa-list text-gray-400"></i>
        <span class="text-sm font-semibold text-gray-700">Tất cả sản phẩm – Tích chọn để đánh dấu nổi bật</span>
        <div class="ml-auto flex gap-2">
          <input type="text" id="featuredSearch" placeholder="Tìm sản phẩm..." oninput="filterFeaturedProducts()"
            class="border rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:border-amber-400 w-44">
        </div>
      </div>
      <div id="featuredProductsList" class="divide-y max-h-[70vh] overflow-y-auto">
        <div class="py-12 text-center text-gray-400"><i class="fas fa-spinner fa-spin text-3xl"></i></div>
      </div>
    </div>
  </div>

  <!-- BANNERS PAGE -->
  <div id="page-settings" class="p-6 hidden">
    <div class="bg-white rounded-2xl shadow-sm border p-4 mb-4">
      <div class="flex items-center gap-2">
        <button type="button" class="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <i class="fas fa-warehouse"></i>Cài đặt kho hàng
        </button>
      </div>
    </div>

    <div class="bg-white rounded-2xl shadow-sm border p-6 mb-6">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h2 class="font-bold text-gray-800 text-lg flex items-center gap-2">
          <i class="fas fa-warehouse text-emerald-500"></i>Cài đặt kho lấy hàng GHTK
        </h2>
        <button onclick="syncGhtkPickupAddresses()" id="syncGhtkPickupBtn" class="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2">
          <i class="fas fa-rotate"></i> Đồng bộ kho từ GHTK
        </button>
      </div>
      <p class="text-sm text-gray-500 mb-4">Chọn kho đã tạo trên GHTK để dùng mặc định khi bấm Sắp xếp vận chuyển.</p>
      <div class="grid md:grid-cols-2 gap-4">
        <div class="md:col-span-2">
          <label class="block text-sm font-semibold text-gray-700 mb-1.5">Kho lấy hàng từ GHTK</label>
          <select id="ghtkPickupAddressId" onchange="applySelectedGhtkWarehouse()" class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-400">
            <option value="">-- Chọn kho đồng bộ --</option>
          </select>
          <p id="ghtkPickupHint" class="text-xs text-gray-500 mt-1.5">Nếu chưa thấy kho, bấm "Đồng bộ kho từ GHTK".</p>
        </div>
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1.5">Tên người lấy hàng</label>
          <input type="text" id="ghtkPickName" class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-400">
        </div>
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1.5">Số điện thoại lấy hàng</label>
          <input type="text" id="ghtkPickTel" class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-400">
        </div>
        <div class="md:col-span-2">
          <label class="block text-sm font-semibold text-gray-700 mb-1.5">Địa chỉ lấy hàng (chi tiết)</label>
          <input type="text" id="ghtkPickAddress" class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-400">
        </div>
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1.5">Tỉnh/Thành</label>
          <input type="text" id="ghtkPickProvince" class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-400">
        </div>
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1.5">Quận/Huyện</label>
          <input type="text" id="ghtkPickDistrict" class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-400">
        </div>
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1.5">Phường/Xã</label>
          <input type="text" id="ghtkPickWard" class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-400">
        </div>
        <div class="md:col-span-2 flex justify-end">
          <button onclick="saveGhtkPickupConfig()" id="saveGhtkPickupBtn" class="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition">
            <i class="fas fa-save"></i>Lưu cấu hình kho GHTK
          </button>
        </div>
      </div>
    </div>
  </div>

</main>

<!-- PRODUCT MODAL -->
<div id="productModal" class="fixed inset-0 modal-overlay z-50 hidden flex items-start justify-center p-4 overflow-y-auto">
  <div class="modal-card bg-white rounded-3xl shadow-2xl w-full max-w-3xl my-4">
    <div class="sticky top-0 bg-white rounded-t-3xl border-b px-6 py-4 flex items-center justify-between">
      <h2 id="modalTitle" class="font-bold text-xl text-gray-900">Thêm sản phẩm mới</h2>
      <button onclick="closeProductModal()" class="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition">
        <i class="fas fa-times text-gray-600"></i>
      </button>
    </div>
    
    <form id="productForm" onsubmit="saveProduct(event)" class="px-6 py-5 space-y-6">
      <input type="hidden" id="productId">
      
      <!-- Basic Info -->
      <div class="grid md:grid-cols-2 gap-4">
        <div class="md:col-span-2">
          <label class="block text-sm font-semibold mb-1.5 text-gray-700">Tên sản phẩm *</label>
          <input type="text" id="pName" required placeholder="VD: Áo thun Unisex Premium" class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-100">
        </div>
        <div class="md:col-span-2">
          <label class="block text-sm font-semibold mb-2 text-gray-700"><i class="fas fa-images text-pink-400 mr-1"></i>Hình ảnh *</label>
          <p class="text-xs text-gray-400 mb-2">Ảnh chính hiển thị ở khung lớn bên trái, ảnh phụ nằm ở các khung nhỏ bên phải.</p>
          <div class="grid md:grid-cols-3 gap-3 items-start">
            <div class="md:col-span-1">
              <div class="img-slot w-full flex flex-col items-center justify-center p-3 min-h-[220px]" id="thumbnailPreviewBox" onclick="document.getElementById('thumbnailInput').click()" ondragover="handleImageDragOver(event)" ondragleave="handleImageDragLeave(event)" ondrop="handleImageDrop(event, 'thumbnail', -1)">
                <img id="thumbnailPreview" src="" alt="" draggable="true" ondragstart="startImageReorderDrag(event, 'thumbnail', -1)" class="w-full h-full object-cover rounded-xl hidden">
                <div id="thumbnailPlaceholder" class="flex flex-col items-center gap-1 text-gray-400">
                  <i class="fas fa-camera text-2xl"></i>
                  <span class="text-sm font-medium">Tải lên ảnh chính</span>
                </div>
              </div>
              <input type="file" id="thumbnailInput" accept="image/*" multiple class="hidden" onchange="handleThumbnailFile(this)">
              <input type="url" id="pThumbnail" placeholder="Dán URL ảnh chính..." class="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-400 mt-2" oninput="previewThumbnail(this.value)">
            </div>
            <div class="md:col-span-2">
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-3" id="galleryGrid">
                ${[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => `
                <div class="img-slot relative flex flex-col items-center justify-center min-h-[102px]" id="slot-${i}" ondragover="handleImageDragOver(event)" ondragleave="handleImageDragLeave(event)" ondrop="handleImageDrop(event, 'gallery', ${i})">
                  <img id="galleryImg-${i}" src="" alt="" draggable="true" ondragstart="startImageReorderDrag(event, 'gallery', ${i})" class="w-full h-full object-cover rounded-xl hidden absolute inset-0">
                  <div class="flex flex-col items-center gap-1 text-gray-400 text-center p-2" id="slotPlaceholder-${i}">
                    <i class="fas fa-plus text-base"></i>
                    <span class="text-xs">Ảnh ${i + 1}</span>
                  </div>
                  <button type="button" class="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full items-center justify-center hidden text-xs z-10"
                    id="slotDel-${i}" onclick="removeGalleryImg(${i})">×</button>
                  <input type="file" accept="image/*" multiple class="hidden" id="galleryFile-${i}" onchange="handleGalleryFile(${i},this)">
                </div>`).join('')}
              </div>
              <p class="text-xs text-gray-400 mt-2">Nhấn vào từng ô để thêm ảnh phụ hoặc dán URL nhanh bên dưới.</p>
              <div class="mt-2 flex gap-2">
                <input type="url" id="galleryUrlInput" placeholder="Dán URL ảnh phụ..." class="flex-1 border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-400">
                <button type="button" onclick="addGalleryUrl()" class="btn-pink text-white px-4 py-2 rounded-xl text-sm font-semibold">Thêm</button>
              </div>
            </div>
          </div>
        </div>
        <div>
          <label class="block text-sm font-semibold mb-1.5 text-gray-700">Giá bán (VNĐ) *</label>
          <input type="number" id="pPrice" required placeholder="299000" min="0" class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400">
        </div>
        <div>
          <label class="block text-sm font-semibold mb-1.5 text-gray-700">Giá gốc (VNĐ)</label>
          <input type="number" id="pOriginalPrice" placeholder="399000" min="0" class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400">
        </div>
        <div>
          <label class="block text-sm font-semibold mb-1.5 text-gray-700">Danh mục</label>
          <select id="pCategory" class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400">
            <option value="unisex">Unisex</option>
            <option value="male">Nam</option>
            <option value="female">Nữ</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-semibold mb-1.5 text-gray-700">Thương hiệu</label>
          <input type="text" id="pBrand" placeholder="VD: QH Clothes" class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400">
        </div>
        <div class="md:col-span-2">
          <label class="block text-sm font-semibold mb-1.5 text-gray-700">Chất liệu</label>
          <input type="text" id="pMaterial" placeholder="VD: 100% Cotton Combed" class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400">
        </div>
        <div class="md:col-span-2">
          <label class="block text-sm font-semibold mb-1.5 text-gray-700">Mô tả</label>
          <textarea id="pDescription" rows="3" placeholder="Mô tả chi tiết về sản phẩm..." class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400 resize-none"></textarea>
        </div>
        <div>
          <label class="block text-sm font-semibold mb-1.5 text-gray-700">Số lượng tồn kho</label>
          <input type="number" id="pStock" placeholder="100" min="0" class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400">
        </div>
        <div class="flex items-center gap-6 pt-4">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" id="pFeatured" class="w-4 h-4 accent-pink-500">
            <span class="text-sm font-medium text-gray-700">Sản phẩm nổi bật</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" id="pTrending" class="w-4 h-4 accent-pink-500">
            <span class="text-sm font-medium text-gray-700">Sản phẩm thịnh hành</span>
          </label>
          <div class="flex items-center gap-2">
            <label for="pTrendingOrder" class="text-sm font-medium text-gray-700 whitespace-nowrap">Vị trí hiển thị</label>
            <select id="pTrendingOrder" class="border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-400">
              <option value="0">Tự động</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="6">6</option>
              <option value="7">7</option>
              <option value="8">8</option>
              <option value="9">9</option>
              <option value="10">10</option>
              <option value="11">11</option>
              <option value="12">12</option>
            </select>
          </div>
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" id="pActive" checked class="w-4 h-4 accent-pink-500">
            <span class="text-sm font-medium text-gray-700">Hiển thị</span>
          </label>
        </div>
      </div>
      <!-- Colors -->
      <div>
        <label class="block text-sm font-semibold mb-2 text-gray-700"><i class="fas fa-palette text-pink-400 mr-1"></i>Màu sắc</label>
        <div id="colorOptionsEditor" class="space-y-2"></div>
        <button type="button" onclick="addColorOptionRow()" class="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-pink-600 transition">
          <i class="fas fa-plus"></i>Thêm lựa chọn
        </button>
      </div>
      
      <!-- Sizes -->
      <div>
        <label class="block text-sm font-semibold mb-2 text-gray-700"><i class="fas fa-ruler text-pink-400 mr-1"></i>Size số</label>
        <div class="flex flex-wrap gap-2 mb-2">
          <button type="button" onclick="addPresetSizes(['XS','S','M','L','XL','XXL'])" class="px-3 py-1.5 border rounded-lg text-xs text-gray-600 hover:border-pink-400 hover:text-pink-600 transition">+ XS→XXL</button>
          <button type="button" onclick="addPresetSizes(['28','29','30','31','32','33','34'])" class="px-3 py-1.5 border rounded-lg text-xs text-gray-600 hover:border-pink-400 hover:text-pink-600 transition">+ Size quần</button>
          <button type="button" onclick="addPresetSizes(['35','36','37','38','39','40','41','42'])" class="px-3 py-1.5 border rounded-lg text-xs text-gray-600 hover:border-pink-400 hover:text-pink-600 transition">+ Size giày</button>
        </div>
        <div id="sizeTags" class="flex flex-wrap gap-2 mb-2 min-h-[36px]"></div>
        <div class="flex gap-2">
          <input type="text" id="sizeInput" placeholder="VD: S, M, L, XL, 28, 29..." class="flex-1 border rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-pink-400"
            onkeydown="if(event.key==='Enter'){event.preventDefault();addTag('size')}">
          <button type="button" onclick="addTag('size')" class="btn-pink text-white px-4 py-2 rounded-xl text-sm">Thêm</button>
        </div>
      </div>
      
      <div class="flex gap-3 pt-2">
        <button type="button" onclick="closeProductModal()" class="flex-1 border-2 border-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition">Huỷ</button>
        <button type="submit" class="flex-1 btn-pink text-white py-3 rounded-xl font-semibold">
          <i class="fas fa-save mr-2"></i><span id="saveBtn">Lưu sản phẩm</span>
        </button>
      </div>
    </form>
  </div>
</div>

<!-- ORDER DETAIL MODAL -->
<div id="orderDetailModal" class="fixed inset-0 modal-overlay z-50 hidden flex items-center justify-center p-4" onclick="if(event.target === this) this.classList.add('hidden')">
  <div class="modal-card bg-white rounded-3xl shadow-2xl w-full max-w-lg" onclick="event.stopPropagation()">
    <div class="border-b px-6 py-4 flex items-center justify-between">
      <h2 class="font-bold text-xl text-gray-900">Chi tiết đơn hàng</h2>
      <button onclick="document.getElementById('orderDetailModal').classList.add('hidden')" class="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
        <i class="fas fa-times"></i>
      </button>
    </div>
    <div id="orderDetailContent" class="px-6 py-4"></div>
  </div>
</div>

<!-- SHIPPING ARRANGE SUCCESS MODAL -->
<div id="arrangeSuccessModal" class="fixed inset-0 modal-overlay z-[80] hidden flex items-center justify-center p-4">
  <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
    <div class="px-6 py-4 border-b flex items-center justify-between">
      <h3 class="font-bold text-lg text-gray-900">Sắp xếp vận chuyển</h3>
      <button onclick="closeArrangeSuccessModal()" class="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
        <i class="fas fa-times text-gray-600"></i>
      </button>
    </div>
    <div class="px-6 py-6 text-center">
      <div class="mx-auto mb-3 w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
        <i class="fas fa-check text-xl"></i>
      </div>
      <p id="arrangeSuccessText" class="text-gray-800 font-semibold">Đã sắp xếp vận chuyển thành công 0 đơn hàng.</p>
      <button id="arrangeModalPrintBtn" onclick="printArrangedOrdersFromModal()" class="mt-5 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-semibold text-sm inline-flex items-center gap-2 transition">
        <i class="fas fa-print"></i>In đơn
      </button>
      <div id="arrangeFailedWrap" class="hidden mt-4 text-left bg-amber-50 border border-amber-200 rounded-xl p-3">
        <p class="text-xs font-semibold text-amber-700 mb-2">Đơn lỗi khi tạo vận đơn GHTK</p>
        <div id="arrangeFailedList" class="max-h-32 overflow-auto space-y-1 text-xs text-amber-800"></div>
      </div>
    </div>
  </div>
</div>

<!-- CHANGE ADMIN PASSWORD MODAL -->
<div id="adminChangePasswordModal" onclick="if(event.target===this) closeChangeAdminPasswordModal()" style="display:none" class="fixed inset-0 modal-overlay z-50 items-start justify-center p-4 overflow-y-auto">
  <div class="modal-card bg-white rounded-3xl shadow-2xl w-full max-w-md my-8">
    <div class="sticky top-0 bg-white rounded-t-3xl border-b px-6 py-4 flex items-center justify-between">
      <h2 class="font-bold text-lg text-gray-900">Thay đổi mật khẩu</h2>
      <button onclick="closeChangeAdminPasswordModal()" class="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition">
        <i class="fas fa-times text-gray-600"></i>
      </button>
    </div>
    <form onsubmit="submitAdminPasswordChange(event)" class="px-6 py-5 space-y-4">
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-1.5">Mật khẩu hiện tại</label>
        <input type="password" id="adminOldPassword" required class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400">
      </div>
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-1.5">Mật khẩu mới</label>
        <input type="password" id="adminNewPassword" required minlength="6" maxlength="64" class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400">
      </div>
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-1.5">Nhập lại mật khẩu mới</label>
        <input type="password" id="adminConfirmPassword" required minlength="6" maxlength="64" class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400">
      </div>
      <div class="pt-1 flex justify-end gap-3">
        <button type="button" onclick="closeChangeAdminPasswordModal()" class="px-4 py-2.5 rounded-xl border text-gray-600 font-medium hover:bg-gray-50 transition">Hủy</button>
        <button type="submit" id="adminChangePasswordBtn" class="bg-pink-500 hover:bg-pink-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition">
          Cập nhật mật khẩu
        </button>
      </div>
    </form>
  </div>
</div>

<!-- TOAST -->
<div id="adminToast" class="fixed top-6 right-6 z-50 flex flex-col gap-2 pointer-events-none"></div>

<script>
// ── STATE ─────────────────────────────────────────
let adminProducts = []
let adminOrders = []
let selectedOrderIds = new Set()
let filteredAdminOrders = []
let paginatedAdminOrders = []
let ordersViewMode = 'to_arrange'
let currentOrdersPage = 1
let ordersSearchExpanded = false
const ORDERS_PAGE_SIZE = 50
let arrangedOrdersForPrint = []
let arrangedFailedOrders = []
let colors = []
let sizes = []
let galleryImages = ['','','','','','','','','']
let editingId = null
let gallerySlotClickBound = false
let ghtkPickupAddresses = []
let adminProfile = null
let adminAvatarMenuOpen = false
let settingsSubmenuOpen = false
let settingsActiveSubPage = ''
let selectedColorImage = ''
const MAX_PRODUCT_PAYLOAD_SIZE = 1200000
const ADMIN_OVERLAY_IDS = ['productModal', 'orderDetailModal', 'arrangeSuccessModal']

// ── NAVIGATION ────────────────────────────────────
function isAdminOverlayDebugEnabled() {
  const host = String(window.location.hostname || '')
  return host === '127.0.0.1' || host === 'localhost' || window.location.search.includes('debugOverlay=1')
}

function debugAdminOverlayState(reason = '') {
  if (!isAdminOverlayDebugEnabled()) return
  const inspectIds = [...ADMIN_OVERLAY_IDS, 'adminChangePasswordModal', 'sidebarOverlay']
  const rows = inspectIds.map((id) => {
    const el = document.getElementById(id)
    if (!el) return { id, missing: true }
    const style = window.getComputedStyle(el)
    return {
      id,
      hiddenClass: el.classList.contains('hidden'),
      inlineDisplay: el.style.display || '',
      display: style.display,
      pointerEvents: style.pointerEvents,
      opacity: style.opacity,
      zIndex: style.zIndex,
    }
  })
  console.groupCollapsed('[admin-overlay] ' + (reason || 'state'))
  console.table(rows)
  console.groupEnd()
}

function getInitialFromName(name) {
  const text = String(name || '').trim()
  if (!text) return 'A'
  return text.charAt(0).toUpperCase()
}

function applyAdminAvatarUI() {
  const rawAvatar = String(adminProfile?.avatar || '').trim()
  const lowerAvatar = rawAvatar.toLowerCase()
  const avatar = ['null', 'undefined', 'none'].includes(lowerAvatar) ? '' : rawAvatar
  const name = String(adminProfile?.name || 'QH Clothes').trim() || 'QH Clothes'
  const adminKey = String(adminProfile?.adminUserKey || 'admin').trim().toUpperCase()

  const bindAvatarImg = (img, fallback) => {
    if (!img || !fallback || img.dataset.bound === '1') return
    img.dataset.bound = '1'
    img.addEventListener('load', () => {
      if (!img.src) return
      if (img.naturalWidth <= 1 && img.naturalHeight <= 1) {
        img.classList.add('hidden')
        fallback.classList.remove('hidden')
        return
      }
      img.classList.remove('hidden')
      fallback.classList.add('hidden')
    })
    img.addEventListener('error', () => {
      img.classList.add('hidden')
      fallback.classList.remove('hidden')
    })
  }

  const syncAvatar = (imgId, fallbackId) => {
    const img = document.getElementById(imgId)
    const fallback = document.getElementById(fallbackId)
    if (!img || !fallback) return
    bindAvatarImg(img, fallback)
    fallback.textContent = getInitialFromName(name)
    if (avatar) {
      img.src = avatar
      img.classList.remove('hidden')
      fallback.classList.add('hidden')
    } else {
      img.src = ''
      img.classList.add('hidden')
      fallback.classList.remove('hidden')
    }
  }

  syncAvatar('adminHeaderAvatarImg', 'adminHeaderAvatarFallback')
  syncAvatar('adminMenuAvatarImg', 'adminMenuAvatarFallback')

  const headerName = document.getElementById('adminHeaderProfileName')
  if (headerName) headerName.textContent = name
  const menuName = document.getElementById('adminMenuProfileName')
  if (menuName) menuName.textContent = name
  const menuCode = document.getElementById('adminMenuShopCode')
  if (menuCode) menuCode.textContent = 'Shop Code: ' + adminKey
}

function applyAvatarSrcDirect(dataUrl) {
  const ids = [
    ['adminHeaderAvatarImg', 'adminHeaderAvatarFallback'],
    ['adminMenuAvatarImg', 'adminMenuAvatarFallback']
  ]
  ids.forEach(([imgId, fbId]) => {
    const img = document.getElementById(imgId)
    const fallback = document.getElementById(fbId)
    if (!img || !fallback) return
    if (!dataUrl) {
      img.src = ''
      img.classList.add('hidden')
      fallback.classList.remove('hidden')
      return
    }
    img.src = dataUrl
    img.classList.remove('hidden')
    fallback.classList.add('hidden')
  })
}

async function loadAdminProfile() {
  try {
    const res = await axios.get('/api/admin/profile')
    adminProfile = res.data?.data || null
    applyAdminAvatarUI()
  } catch (_) {
    // keep default avatar fallback
  }
}

function closeAdminAvatarMenu() {
  adminAvatarMenuOpen = false
  const menu = document.getElementById('adminAvatarDropdown')
  if (menu) menu.classList.add('hidden')
}

function toggleAdminAvatarMenu() {
  adminAvatarMenuOpen = !adminAvatarMenuOpen
  const menu = document.getElementById('adminAvatarDropdown')
  if (menu) menu.classList.toggle('hidden', !adminAvatarMenuOpen)
}

function sanitizeAdminOverlayState() {
  ADMIN_OVERLAY_IDS.forEach((id) => {
    const el = document.getElementById(id)
    if (el) el.classList.add('hidden')
  })
  closeChangeAdminPasswordModal()
  closeAdminAvatarMenu()
  const sidebarOverlay = document.getElementById('sidebarOverlay')
  if (sidebarOverlay) {
    sidebarOverlay.style.display = 'none'
    sidebarOverlay.style.pointerEvents = 'none'
    sidebarOverlay.classList.add('hidden')
  }
  syncSidebarOverlay()
  document.body.style.overflow = ''
  debugAdminOverlayState('sanitize')
}

function scheduleAdminOverlaySanitize() {
  sanitizeAdminOverlayState()
  requestAnimationFrame(() => {
    sanitizeAdminOverlayState()
    setTimeout(sanitizeAdminOverlayState, 0)
  })
}

function openChangeAdminPasswordModal() {
  const modal = document.getElementById('adminChangePasswordModal')
  if (modal) modal.style.display = 'flex'
  const oldInput = document.getElementById('adminOldPassword')
  if (oldInput) setTimeout(() => oldInput.focus(), 0)
}

function closeChangeAdminPasswordModal() {
  const modal = document.getElementById('adminChangePasswordModal')
  if (modal) modal.style.display = 'none'
  const formIds = ['adminOldPassword', 'adminNewPassword', 'adminConfirmPassword']
  formIds.forEach((id) => {
    const el = document.getElementById(id)
    if (el) el.value = ''
  })
}

async function submitAdminPasswordChange(e) {
  e.preventDefault()
  const oldPassword = String(document.getElementById('adminOldPassword')?.value || '')
  const newPassword = String(document.getElementById('adminNewPassword')?.value || '')
  const confirmPassword = String(document.getElementById('adminConfirmPassword')?.value || '')
  if (newPassword.length < 6) {
    showAdminToast('Mật khẩu mới tối thiểu 6 ký tự', 'error')
    return
  }
  if (newPassword !== confirmPassword) {
    showAdminToast('Nhập lại mật khẩu chưa khớp', 'error')
    return
  }
  const btn = document.getElementById('adminChangePasswordBtn')
  btn.disabled = true
  btn.textContent = 'Đang cập nhật...'
  try {
    await axios.put('/api/admin/profile/password', {
      old_password: oldPassword,
      new_password: newPassword
    })
    showAdminToast('Đã đổi mật khẩu thành công', 'success')
    closeChangeAdminPasswordModal()
  } catch (err) {
    const msg = err.response?.data?.error || 'Đổi mật khẩu thất bại'
    showAdminToast(msg, 'error')
  } finally {
    btn.disabled = false
    btn.textContent = 'Cập nhật mật khẩu'
  }
}

async function logoutAdminUser() {
  try { await axios.post('/api/auth/logout') } catch (_) {}
  sanitizeAdminOverlayState()
  window.location.replace('/admin/login')
}

function readImageAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('FILE_READ_FAILED'))
    reader.readAsDataURL(file)
  })
}

function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('IMAGE_LOAD_FAILED'))
    img.src = src
  })
}

async function compressAvatarDataUrl(dataUrl, maxSide = 512, quality = 0.85) {
  const img = await loadImageElement(dataUrl)
  const scale = Math.min(1, maxSide / Math.max(img.width || 1, img.height || 1))
  const w = Math.max(1, Math.round((img.width || 1) * scale))
  const h = Math.max(1, Math.round((img.height || 1) * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return dataUrl
  ctx.drawImage(img, 0, 0, w, h)
  return canvas.toDataURL('image/jpeg', quality)
}

function triggerAdminAvatarPicker(evt) {
  if (evt) evt.stopPropagation()
  const input = document.getElementById('adminAvatarInput')
  if (input) input.click()
}

async function onAdminAvatarSelected(inputOrEvent) {
  const input = inputOrEvent?.target || inputOrEvent
  const file = input?.files?.[0]
  if (!file) return
  await handleAdminAvatarFile(file)
  input.value = ''
}

async function handleAdminAvatarFile(file) {
  const mimeType = String(file.type || '').toLowerCase()
  if (!mimeType.startsWith('image/')) {
    showAdminToast('Vui lòng chọn file ảnh', 'error')
    return
  }
  try {
    const rawDataUrl = await readImageAsDataURL(file)
    let dataUrl = await compressAvatarDataUrl(rawDataUrl, 512, 0.85)
    if (dataUrl.length > 700000) dataUrl = await compressAvatarDataUrl(rawDataUrl, 448, 0.8)
    if (dataUrl.length > 700000) dataUrl = await compressAvatarDataUrl(rawDataUrl, 384, 0.75)
    if (dataUrl.length > 700000) dataUrl = await compressAvatarDataUrl(rawDataUrl, 320, 0.7)
    if (!dataUrl.startsWith('data:image/')) {
      showAdminToast('File ảnh không hợp lệ', 'error')
      return
    }
    if (dataUrl.length > 700000) {
      showAdminToast('Ảnh quá lớn, vui lòng chọn ảnh nhỏ hơn', 'error')
      return
    }
    const prevAvatar = String(adminProfile?.avatar || '').trim()
    adminProfile = { ...(adminProfile || {}), avatar: dataUrl }
    applyAdminAvatarUI()
    try {
      const res = await axios.put('/api/admin/profile/avatar', { avatar: dataUrl })
      adminProfile = res.data?.data || adminProfile
      applyAdminAvatarUI()
      applyAvatarSrcDirect(String(adminProfile?.avatar || dataUrl))
      loadAdminProfile()
      showAdminToast('Đã cập nhật avatar', 'success')
    } catch (e) {
      adminProfile = { ...(adminProfile || {}), avatar: prevAvatar }
      applyAdminAvatarUI()
      const msg = e.response?.data?.error || 'Lưu avatar thất bại'
      showAdminToast(msg, 'error')
    }
  } catch (_) {
    showAdminToast('Không đọc được ảnh, vui lòng thử lại', 'error')
  }
}

function isOrdersPageActive() {
  return document.body.dataset.adminPage === 'orders'
}

function syncOrdersHeaderSearchUI() {
  const wrap = document.getElementById('ordersHeaderSearch')
  const input = document.getElementById('orderSearch')
  const icon = document.getElementById('ordersHeaderSearchIcon')
  const isOrders = isOrdersPageActive()
  const hasValue = !!(input && String(input.value || '').trim())

  if (!wrap || !input || !icon) return

  wrap.classList.toggle('hidden', !isOrders)
  wrap.classList.toggle('is-visible', isOrders)

  if (!isOrders) {
    ordersSearchExpanded = false
    wrap.classList.remove('expanded')
    icon.className = 'fas fa-search text-sm'
    return
  }

  const shouldExpand = ordersSearchExpanded || hasValue
  wrap.classList.toggle('expanded', shouldExpand)
  icon.className = (hasValue ? 'fas fa-times' : 'fas fa-search') + ' text-sm'
}

function focusOrdersSearchInput() {
  const input = document.getElementById('orderSearch')
  if (!input) return
  setTimeout(() => input.focus(), 20)
}

function handleOrdersSearchButton() {
  const input = document.getElementById('orderSearch')
  if (!input || !isOrdersPageActive()) return

  if (String(input.value || '').trim()) {
    input.value = ''
    ordersSearchExpanded = false
    setOrdersPage(1)
    filterOrders()
    syncOrdersHeaderSearchUI()
    return
  }

  if (window.innerWidth >= 768) {
    ordersSearchExpanded = true
    syncOrdersHeaderSearchUI()
    focusOrdersSearchInput()
    return
  }

  ordersSearchExpanded = !ordersSearchExpanded
  syncOrdersHeaderSearchUI()
  if (ordersSearchExpanded) focusOrdersSearchInput()
}

function onOrderSearchInput() {
  const input = document.getElementById('orderSearch')
  if (!input) return
  ordersSearchExpanded = !!String(input.value || '').trim() || ordersSearchExpanded
  setOrdersPage(1)
  filterOrders()
  syncOrdersHeaderSearchUI()
}

function closeOrdersHeaderSearch() {
  const input = document.getElementById('orderSearch')
  if (!input) return
  if (window.innerWidth >= 768) {
    if (!String(input.value || '').trim()) ordersSearchExpanded = false
    syncOrdersHeaderSearchUI()
    return
  }
  if (String(input.value || '').trim()) {
    syncOrdersHeaderSearchUI()
    return
  }
  ordersSearchExpanded = false
  syncOrdersHeaderSearchUI()
}
function showPage(name) {
  ['dashboard','products','orders','vouchers','featured','settings'].forEach(p => {
    const section = document.getElementById('page-'+p)
    if (section) section.classList.toggle('hidden', p !== name)
  })
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'))
  const mainBtn = document.querySelector('.nav-item[data-page="' + name + '"]')
  if (mainBtn) mainBtn.classList.add('active')
  document.querySelectorAll('.nav-sub-item').forEach(b => {
    b.classList.toggle('active', b.dataset.subPage === settingsActiveSubPage)
  })
  if (name === 'settings') {
    const settingsBtn = document.getElementById('settingsMenuBtn')
    if (settingsBtn) settingsBtn.classList.add('active')
    setSettingsSubmenuOpen(true)
  } else {
    setSettingsSubmenuOpen(false)
    settingsActiveSubPage = ''
    document.querySelectorAll('.nav-sub-item').forEach(b => b.classList.remove('active'))
  }
  const titles = {dashboard:'Dashboard', products:'Quản lý Sản phẩm', orders:'Quản lý Đơn hàng', vouchers:'Quản lý Voucher', featured:'Sản phẩm Nổi Bật', settings:'Cài đặt'}
  document.body.dataset.adminPage = name
  document.getElementById('pageTitle').textContent = titles[name] || name

  if (name === 'dashboard') loadDashboard()
  else if (name === 'products') loadAdminProducts()
  else if (name === 'orders') loadAdminOrders()
  else if (name === 'vouchers') loadVouchers()
  else if (name === 'featured') loadFeaturedAdmin()
  else if (name === 'settings') loadSettingsAdmin()

  syncOrdersHeaderSearchUI()

  if (name !== 'orders') {
    const bulkBar = document.getElementById('ordersBulkActionBar')
    const shipBar = document.getElementById('shippingBulkActionBar')
    if (bulkBar) bulkBar.classList.add('hidden')
    if (shipBar) shipBar.classList.add('hidden')
  }

  // Close mobile sidebar
  document.getElementById('sidebar').classList.add('-translate-x-full')
  document.getElementById('sidebarOverlay').classList.add('hidden')
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('-translate-x-full')
  syncSidebarOverlay()
}

function syncSidebarOverlay() {
  const sidebar = document.getElementById('sidebar')
  const overlay = document.getElementById('sidebarOverlay')
  if (!sidebar || !overlay) return
  const isDesktop = window.matchMedia && window.matchMedia('(min-width: 768px)').matches
  const sidebarOpen = !sidebar.classList.contains('-translate-x-full')
  if (isDesktop) {
    overlay.style.display = 'none'
    overlay.classList.add('hidden')
    overlay.style.pointerEvents = 'none'
    return
  }
  if (sidebarOpen) {
    overlay.style.display = 'block'
    overlay.classList.remove('hidden')
    overlay.style.pointerEvents = ''
  } else {
    overlay.style.display = 'none'
    overlay.classList.add('hidden')
    overlay.style.pointerEvents = 'none'
  }
}

function setSettingsSubmenuOpen(open) {
  settingsSubmenuOpen = !!open
  const submenu = document.getElementById('settingsSubmenu')
  const chevron = document.getElementById('settingsMenuChevron')
  if (submenu) submenu.classList.toggle('hidden', !settingsSubmenuOpen)
  if (chevron) chevron.classList.toggle('rotate-180', settingsSubmenuOpen)
}

function toggleSettingsMenu() {
  setSettingsSubmenuOpen(!settingsSubmenuOpen)
}

function openSettingsWarehouse() {
  settingsActiveSubPage = 'settings-warehouse'
  setSettingsSubmenuOpen(true)
  showPage('settings')
}

// ── FEATURED PRODUCTS ────────────────────────────
let allProductsForFeatured = []
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
          <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-400"></div>
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


// ── DASHBOARD ─────────────────────────────────────
async function loadDashboard() {
  try {
    const res = await axios.get('/api/admin/stats')
    const d = res.data.data
    document.getElementById('statProducts').textContent = d.totalProducts
    document.getElementById('statOrders').textContent = d.totalOrders
    document.getElementById('statPending').textContent = d.pendingOrders
    document.getElementById('statRevenue').textContent = fmtPrice(d.revenue)
    
    const shippingQueueOrders = Number(d.shippingQueueOrders || 0)
    if (shippingQueueOrders > 0) {
      document.getElementById('pendingBadge').textContent = shippingQueueOrders
      document.getElementById('pendingBadge').classList.remove('hidden')
    }
    
    const recent = (d.recentOrders || []).filter(o => !isInternalTestOrder(o))
    if (!recent.length) {
      document.getElementById('recentOrdersTable').innerHTML = '<div class="text-center py-8 text-gray-400">Chưa có đơn hàng nào</div>'
      return
    }
    document.getElementById('recentOrdersTable').innerHTML = '<table class="w-full text-sm"><thead><tr class="border-b text-gray-500"><th class="py-2 text-left pr-4">Mã ĐH</th><th class="py-2 text-left pr-4">Khách hàng</th><th class="py-2 text-right pr-4">Còn phải thu</th><th class="py-2 text-center">Trạng thái</th></tr></thead><tbody>' +
      recent.map(o => '<tr class="border-b last:border-0"><td class="py-2 pr-4 font-mono text-xs text-blue-600">' + o.order_code + '</td><td class="py-2 pr-4">' + displayCustomerName(o.customer_name) + '</td><td class="py-2 pr-4 text-right font-semibold">' + fmtPrice(getOrderAmountDue(o)) + '</td><td class="py-2 text-center"><span class="badge badge-' + o.status + '">' + statusLabel(o.status) + '</span></td></tr>').join('') +
      '</tbody></table>'
  } catch(e) {
    if (e && e.response && e.response.status === 401) {
      showAdminToast('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại', 'error')
      setTimeout(() => { window.location.href = '/admin/login' }, 400)
      return
    }
    document.getElementById('recentOrdersTable').innerHTML = '<div class="text-center py-8 text-red-400">Lỗi tải dữ liệu dashboard</div>'
    console.error(e)
  }
}

// ── PRODUCTS ─────────────────────────────────────
async function loadAdminProducts() {
  const grid = document.getElementById('adminProductsGrid')
  grid.innerHTML = '<div class="col-span-4 text-center py-12 text-gray-400"><i class="fas fa-spinner fa-spin text-3xl"></i></div>'
  try {
    const res = await axios.get('/api/admin/products')
    adminProducts = res.data.data || []
    renderAdminProducts(adminProducts)
  } catch(e) {
    if (e && e.response && e.response.status === 401) {
      showAdminToast('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại', 'error')
      setTimeout(() => { window.location.href = '/admin/login' }, 400)
      return
    }
    const msg = e?.response?.data?.error || e?.message || 'Lỗi tải dữ liệu'
    grid.innerHTML = '<div class="col-span-4 text-center py-12 text-red-400">Lỗi tải dữ liệu</div>'
    showAdminToast(msg, 'error')
    console.error('loadAdminProducts error:', e)
  }
}

function filterAdminProducts() {
  const q = document.getElementById('productSearch').value.toLowerCase()
  const cat = document.getElementById('productCatFilter').value
  const filtered = adminProducts.filter(p => 
    (!q || String(p?.name || '').toLowerCase().includes(q) || String(p?.brand || '').toLowerCase().includes(q)) &&
    (!cat || String(p?.category || '') === cat)
  )
  renderAdminProducts(filtered)
}

function renderAdminProducts(products) {
  const grid = document.getElementById('adminProductsGrid')
  const safeProducts = (Array.isArray(products) ? products : []).filter(Boolean)
  if (!safeProducts.length) {
    grid.innerHTML = '<div class="col-span-4 text-center py-12 text-gray-400"><i class="fas fa-box-open text-4xl mb-3"></i><p>Không có sản phẩm</p></div>'
    return
  }
  grid.innerHTML = safeProducts.map(raw => {
    try {
      const p = raw || {}
      const name = String(p.name || 'Sản phẩm')
      const brand = String(p.brand || '').trim()
      const thumbnail = String(p.thumbnail || '').trim() || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'
      const colors = getProductColorOptions(p).map((c) => c.name).filter(Boolean)
      const sizes = safeJson(p.sizes)
      return \`
    <div class="bg-white rounded-2xl shadow-sm border overflow-hidden \${!p.is_active ? 'opacity-60' : ''}">
      <div class="relative h-48 bg-gray-100 overflow-hidden">
        <img src="\${thumbnail}" alt="\${name}" 
          class="w-full h-full object-cover" onerror="this.src='https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'">
        <div class="absolute top-2 left-2 flex gap-1">
          <span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-white/90 text-gray-700">\${catLabel(p.category)}</span>
          \${p.is_featured ? '<span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-400 text-white">⭐ Hot</span>' : ''}
          \${p.is_trending ? '<span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500 text-white">🔥 Trend</span>' : ''}
          \${p.is_trending && (p.trending_order||0) > 0 ? \`<span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-500 text-white">#\${p.trending_order}</span>\` : ''}
        </div>
        <div class="absolute top-2 right-2">
          <span class="w-2.5 h-2.5 rounded-full inline-block \${p.is_active ? 'bg-green-400' : 'bg-gray-400'}"></span>
        </div>
      </div>
      <div class="p-4">
        \${brand ? \`<p class="text-xs text-pink-500 font-medium mb-1">\${brand}</p>\` : ''}
        <h3 class="font-semibold text-gray-900 text-sm mb-2 line-clamp-2 leading-tight">\${name}</h3>
        <div class="flex items-center gap-2 mb-3">
          <span class="font-bold text-pink-600">\${fmtPrice(p.price)}</span>
          \${p.original_price ? \`<span class="text-xs text-gray-400 line-through">\${fmtPrice(p.original_price)}</span>\` : ''}
        </div>
        \${colors.length ? \`<div class="flex flex-wrap gap-1 mb-2">\${colors.slice(0,3).map(c=>\`<span class="text-xs bg-pink-50 text-pink-600 px-2 py-0.5 rounded-full">\${c}</span>\`).join('')}\${colors.length>3?\`<span class="text-xs text-gray-400">+\${colors.length-3}</span>\`:''}</div>\` : ''}
        \${sizes.length ? \`<div class="flex flex-wrap gap-1 mb-3">\${sizes.slice(0,4).map(s=>\`<span class="text-xs border text-gray-600 px-1.5 py-0.5 rounded">\${s}</span>\`).join('')}\${sizes.length>4?\`<span class="text-xs text-gray-400">+\${sizes.length-4}</span>\`:''}</div>\` : ''}
        <p class="text-xs text-gray-400 mb-3">Tồn kho: <span class="font-semibold text-gray-700">\${p.stock || 0}</span></p>
        <div class="flex gap-2">
          <button onclick="openProductModal(\${p.id})" class="flex-1 py-2 border-2 border-pink-200 text-pink-600 rounded-xl text-xs font-semibold hover:bg-pink-50 transition">
            <i class="fas fa-edit mr-1"></i>Sửa
          </button>
          <button onclick="toggleProductActive(\${p.id})" class="py-2 px-3 border-2 border-gray-200 rounded-xl text-xs hover:bg-gray-50 transition" title="\${p.is_active ? 'Ẩn' : 'Hiện'}">
            <i class="fas fa-\${p.is_active ? 'eye-slash' : 'eye'} text-gray-500"></i>
          </button>
          <button onclick="deleteProduct(\${p.id})" class="py-2 px-3 border-2 border-red-200 text-red-500 rounded-xl text-xs hover:bg-red-50 transition">
          <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    </div>\`
    } catch (err) {
      const p = raw || {}
      const name = String(p.name || 'Sản phẩm')
      const thumbnail = String(p.thumbnail || '').trim() || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'
      const isActive = !!p.is_active
      const price = Number(p.price || 0)
      console.error('renderAdminProducts item error:', err, raw)
      return \`
      <div class="bg-white rounded-2xl shadow-sm border overflow-hidden \${!isActive ? 'opacity-60' : ''}">
        <div class="relative h-48 bg-gray-100 overflow-hidden">
          <img src="\${thumbnail}" alt="\${name}" class="w-full h-full object-cover" onerror="this.src='https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'">
          <div class="absolute top-2 right-2">
            <span class="w-2.5 h-2.5 rounded-full inline-block \${isActive ? 'bg-green-400' : 'bg-gray-400'}"></span>
          </div>
        </div>
        <div class="p-4">
          <h3 class="font-semibold text-gray-900 text-sm mb-2 line-clamp-2 leading-tight">\${name}</h3>
          <div class="flex items-center gap-2 mb-3">
            <span class="font-bold text-pink-600">\${fmtPrice(price)}</span>
          </div>
          <p class="text-xs text-gray-400 mb-3">Tồn kho: <span class="font-semibold text-gray-700">\${p.stock || 0}</span></p>
          <div class="flex gap-2">
            <button onclick="openProductModal(\${p.id})" class="flex-1 py-2 border-2 border-pink-200 text-pink-600 rounded-xl text-xs font-semibold hover:bg-pink-50 transition">
              <i class="fas fa-edit mr-1"></i>Sửa
            </button>
            <button onclick="toggleProductActive(\${p.id})" class="py-2 px-3 border-2 border-gray-200 rounded-xl text-xs hover:bg-gray-50 transition" title="\${isActive ? 'Ẩn' : 'Hiện'}">
              <i class="fas fa-\${isActive ? 'eye-slash' : 'eye'} text-gray-500"></i>
            </button>
            <button onclick="deleteProduct(\${p.id})" class="py-2 px-3 border-2 border-red-200 text-red-500 rounded-xl text-xs hover:bg-red-50 transition">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>\`
    }
  }).join('')
}

async function toggleProductActive(id) {
  try {
    await axios.patch('/api/admin/products/' + id + '/toggle')
    loadAdminProducts()
    showAdminToast('Đã cập nhật trạng thái', 'success')
  } catch(e) { showAdminToast('Lỗi cập nhật', 'error') }
}

async function deleteProduct(id) {
  if (!confirm('Bạn chắc chắn muốn xoá sản phẩm này?')) return
  try {
    await axios.delete('/api/admin/products/' + id)
    loadAdminProducts()
    showAdminToast('Đã xoá sản phẩm', 'success')
  } catch(e) { showAdminToast('Lỗi xoá sản phẩm', 'error') }
}

// ── PRODUCT MODAL ─────────────────────────────────
async function openProductModal(id = null) {
  editingId = id
  colors = []
  sizes = []
  galleryImages = ['','','','','','','','','']
  const toStringList = (raw) => {
    const arr = Array.isArray(raw) ? raw : safeJson(raw)
    if (!Array.isArray(arr)) return []
    return arr.map((item) => String(item || '').trim()).filter(Boolean)
  }
  const normalizeColorOptionsLocal = (raw) => {
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
  
  resetProductForm()
  document.getElementById('modalTitle').textContent = id ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'
  
  // Bind gallery slots
  for (let i = 0; i < 9; i++) {
    const slot = document.getElementById('slot-'+i)
    slot.onclick = () => handleGallerySlotClick(i)
  }
  
  if (id) {
    try {
      const res = await axios.get('/api/admin/products/' + id)
      const p = res?.data?.data || {}
      document.getElementById('productId').value = p.id || ''
      document.getElementById('pName').value = p.name || ''
      document.getElementById('pPrice').value = p.price || ''
      document.getElementById('pOriginalPrice').value = p.original_price || ''
      document.getElementById('pCategory').value = p.category || 'unisex'
      document.getElementById('pBrand').value = p.brand || ''
      document.getElementById('pMaterial').value = p.material || ''
      document.getElementById('pDescription').value = p.description || ''
      document.getElementById('pStock').value = p.stock || 0
      document.getElementById('pFeatured').checked = !!p.is_featured
      document.getElementById('pTrending').checked = !!p.is_trending
      document.getElementById('pTrendingOrder').value = String(p.trending_order || 0)
      document.getElementById('pActive').checked = !!p.is_active
      
      // Thumbnail
      previewThumbnail(p.thumbnail || '')
      document.getElementById('pThumbnail').value = p.thumbnail || ''
      
      // Gallery
      const imgs = toStringList(Array.isArray(p.image_list) ? p.image_list : p.images)
      imgs.forEach((url, i) => { if (i < 9 && url) setGallerySlot(i, url) })
      
      // Colors & sizes
      colors = normalizeColorOptionsLocal(Array.isArray(p.color_options) ? p.color_options : p.colors)
      sizes = toStringList(Array.isArray(p.size_list) ? p.size_list : p.sizes)
      renderColorOptionsEditor()
      renderTags('size')
    } catch(e) {
      const msg = e?.response?.data?.error || e?.message || 'Lỗi tải sản phẩm'
      console.error('openProductModal error:', e)
      showAdminToast(msg, 'error')
      return
    }
  }
  
  document.getElementById('productModal').classList.remove('hidden')
  document.body.style.overflow = 'hidden'
}

function closeProductModal() {
  document.getElementById('productModal').classList.add('hidden')
  document.body.style.overflow = ''
  editingId = null
}

function resetProductForm() {
  document.getElementById('productForm').reset()
  document.getElementById('productId').value = ''
  document.getElementById('pActive').checked = true
  document.getElementById('pTrendingOrder').value = '0'
  previewThumbnail('')
  for (let i = 0; i < 9; i++) clearGallerySlot(i)
  colors = []; sizes = []
  renderColorOptionsEditor(); renderTags('size')
  galleryImages = ['','','','','','','','','']
}

async function saveProduct(e) {
  e.preventDefault()
  const btn = document.getElementById('saveBtn')
  btn.textContent = 'Đang lưu...'
  
  const imgList = galleryImages.filter(v => v && v.trim())
  const normalizedThumbnail = String(document.getElementById('pThumbnail').value || '').trim()
  const normalizedColors = colors
    .map((c) => ({ name: String(c?.name || '').trim(), image: String(c?.image || '').trim() }))
    .filter((c) => c.name || c.image)
  if (!normalizedThumbnail && imgList.length === 0) {
    showAdminToast('Trường hình ảnh là bắt buộc', 'error')
    btn.textContent = 'Lưu sản phẩm'
    return
  }
  
  const data = {
    name: document.getElementById('pName').value,
    price: document.getElementById('pPrice').value,
    original_price: document.getElementById('pOriginalPrice').value || null,
    category: document.getElementById('pCategory').value,
    brand: document.getElementById('pBrand').value,
    material: document.getElementById('pMaterial').value,
    description: document.getElementById('pDescription').value,
    thumbnail: normalizedThumbnail,
    images: imgList,
    colors: normalizedColors,
    sizes: sizes,
    stock: document.getElementById('pStock').value || 0,
    is_featured: document.getElementById('pFeatured').checked,
    is_trending: document.getElementById('pTrending').checked,
    trending_order: parseInt(document.getElementById('pTrendingOrder').value) || 0,
    is_active: document.getElementById('pActive').checked
  }
  const payloadSize = JSON.stringify(data).length
  if (payloadSize > MAX_PRODUCT_PAYLOAD_SIZE) {
    showAdminToast('Ảnh quá nặng, vui lòng giảm dung lượng hoặc số lượng ảnh', 'error')
    btn.textContent = 'Lưu sản phẩm'
    return
  }
  
  try {
    if (editingId) {
      await axios.put('/api/admin/products/' + editingId, data)
      showAdminToast('Cập nhật sản phẩm thành công!', 'success')
    } else {
      await axios.post('/api/admin/products', data)
      showAdminToast('Thêm sản phẩm thành công!', 'success')
    }
    closeProductModal()
    loadAdminProducts()
  } catch(e) {
    const msg = e.response?.data?.error || e.message || 'Lỗi lưu sản phẩm'
    showAdminToast(msg, 'error')
  } finally {
    btn.textContent = 'Lưu sản phẩm'
  }
}

// ── GALLERY ───────────────────────────────────────
function handleGallerySlotClick(i) {
  const hasImg = galleryImages[i]
  if (!hasImg) {
    document.getElementById('galleryFile-'+i).click()
  }
}

function setGallerySlot(i, url) {
  galleryImages[i] = url
  const img = document.getElementById('galleryImg-'+i)
  const placeholder = document.getElementById('slotPlaceholder-'+i)
  const delBtn = document.getElementById('slotDel-'+i)
  const slot = document.getElementById('slot-'+i)
  img.src = url
  img.classList.remove('hidden')
  placeholder.classList.add('hidden')
  delBtn.classList.remove('hidden')
  delBtn.classList.add('flex')
  slot.classList.add('has-img')
}

function clearGallerySlot(i) {
  galleryImages[i] = ''
  const img = document.getElementById('galleryImg-'+i)
  const placeholder = document.getElementById('slotPlaceholder-'+i)
  const delBtn = document.getElementById('slotDel-'+i)
  const slot = document.getElementById('slot-'+i)
  img.src = ''; img.classList.add('hidden')
  placeholder.classList.remove('hidden')
  delBtn.classList.add('hidden'); delBtn.classList.remove('flex')
  slot.classList.remove('has-img')
}

function compactGallerySlots() {
  const compacted = galleryImages.filter(v => String(v || '').trim())
  galleryImages = ['','','','','','','','','']
  for (let i = 0; i < 9; i++) clearGallerySlot(i)
  compacted.forEach((url, idx) => {
    if (idx < 9) setGallerySlot(idx, url)
  })
}

function removeGalleryImg(i) {
  event.stopPropagation()
  clearGallerySlot(i)
}

async function handleGalleryFile(i, input) {
  const files = Array.from(input.files || []).filter(f => f.type && f.type.startsWith('image/'))
  if (!files.length) return
  await applyMultipleImagesFrom(files, 'gallery', i)
  input.value = ''
}

function handleImageDragOver(event) {
  event.preventDefault()
  const hasInternalSource = !!event.dataTransfer?.types?.includes('application/x-image-source')
  event.dataTransfer.dropEffect = hasInternalSource ? 'move' : 'copy'
  event.currentTarget.classList.add('drag-over')
}

function handleImageDragLeave(event) {
  event.currentTarget.classList.remove('drag-over')
}

async function handleImageDrop(event, targetType, targetIndex = -1) {
  event.preventDefault()
  event.currentTarget.classList.remove('drag-over')
  const srcPayload = event.dataTransfer?.getData('application/x-image-source')
  if (srcPayload) {
    handleImageReorderDrop(srcPayload, targetType, targetIndex)
    return
  }
  const files = Array.from(event.dataTransfer?.files || []).filter(f => f.type && f.type.startsWith('image/'))
  if (!files.length) {
    showAdminToast('Vui lòng kéo thả file ảnh hợp lệ', 'warning')
    return
  }
  await applyMultipleImagesFrom(files, targetType, targetIndex)
}

function startImageReorderDrag(event, sourceType, sourceIndex = -1) {
  const sourceUrl = sourceType === 'thumbnail'
    ? String(document.getElementById('pThumbnail')?.value || '').trim()
    : String(galleryImages[sourceIndex] || '').trim()
  if (!sourceUrl) {
    event.preventDefault()
    return
  }
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('application/x-image-source', JSON.stringify({ sourceType, sourceIndex }))
  event.dataTransfer.setData('text/plain', sourceUrl)
}

function handleImageReorderDrop(rawSource, targetType, targetIndex = -1) {
  let source
  try {
    source = JSON.parse(rawSource)
  } catch {
    return
  }
  const sourceType = source?.sourceType === 'thumbnail' ? 'thumbnail' : 'gallery'
  const sourceIndex = Number.isInteger(source?.sourceIndex) ? source.sourceIndex : -1
  if (sourceType === targetType && sourceIndex === targetIndex) return
  const sourceUrl = sourceType === 'thumbnail'
    ? String(document.getElementById('pThumbnail')?.value || '').trim()
    : String(galleryImages[sourceIndex] || '').trim()
  if (!sourceUrl) return
  const targetUrl = targetType === 'thumbnail'
    ? String(document.getElementById('pThumbnail')?.value || '').trim()
    : String(galleryImages[targetIndex] || '').trim()
  if (targetType === 'thumbnail') {
    document.getElementById('pThumbnail').value = sourceUrl
    previewThumbnail(sourceUrl)
  } else if (targetIndex >= 0 && targetIndex < 9) {
    setGallerySlot(targetIndex, sourceUrl)
  }
  if (sourceType === 'thumbnail') {
    if (targetUrl) {
      document.getElementById('pThumbnail').value = targetUrl
      previewThumbnail(targetUrl)
    } else {
      document.getElementById('pThumbnail').value = ''
      previewThumbnail('')
    }
  } else if (sourceIndex >= 0 && sourceIndex < 9) {
    if (targetUrl) setGallerySlot(sourceIndex, targetUrl)
    else clearGallerySlot(sourceIndex)
  }
  compactGallerySlots()
}

async function applyMultipleImagesFrom(files, targetType, startIndex = 0) {
  try {
    let fileIndex = 0
    if (targetType === 'thumbnail' && files[0]) {
      const thumbDataUrl = await fileToOptimizedDataURL(files[0], 900, 0.85)
      document.getElementById('pThumbnail').value = thumbDataUrl
      previewThumbnail(thumbDataUrl)
      fileIndex = 1
      startIndex = 0
    }
    for (let i = startIndex; i < 9 && fileIndex < files.length; i++) {
      const dataUrl = await fileToOptimizedDataURL(files[fileIndex], 1200, 0.82)
      setGallerySlot(i, dataUrl)
      fileIndex++
    }
    if (fileIndex < files.length) {
      showAdminToast('Đã đầy ô ảnh, một số ảnh chưa được thêm', 'warning')
    }
  } catch (e) {
    showAdminToast('Không thể xử lý ảnh, vui lòng thử ảnh khác', 'error')
  }
}

function addGalleryUrl() {
  const url = document.getElementById('galleryUrlInput').value.trim()
  if (!url) return
  const emptySlot = galleryImages.findIndex(v => !v)
  if (emptySlot === -1) { showAdminToast('Đã đầy 9 ảnh', 'error'); return }
  setGallerySlot(emptySlot, url)
  document.getElementById('galleryUrlInput').value = ''
}

function previewThumbnail(url) {
  const img = document.getElementById('thumbnailPreview')
  const placeholder = document.getElementById('thumbnailPlaceholder')
  const box = document.getElementById('thumbnailPreviewBox')
  if (url) {
    img.src = url; img.classList.remove('hidden'); placeholder.classList.add('hidden')
    box.classList.add('has-img')
  } else {
    img.src = ''; img.classList.add('hidden'); placeholder.classList.remove('hidden')
    box.classList.remove('has-img')
  }
}

async function handleThumbnailFile(input) {
  const files = Array.from(input.files || []).filter(f => f.type && f.type.startsWith('image/'))
  if (!files.length) return
  await applyMultipleImagesFrom(files, 'thumbnail', 0)
  input.value = ''
}

function fileToOptimizedDataURL(file, maxWidth = 1200, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('read_failed'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('decode_failed'))
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width)
        const width = Math.max(1, Math.round(img.width * scale))
        const height = Math.max(1, Math.round(img.height * scale))
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject(new Error('canvas_failed'))
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

// ── TAGS (Colors/Sizes) ────────────────────────────
function addTag(type) {
  const input = document.getElementById(type === 'size' ? 'sizeInput' : '')
  if (!input) return
  const val = input.value.trim()
  if (!val) return
  val.split(',').map(v => v.trim()).filter(v => v && !sizes.includes(v)).forEach(v => sizes.push(v))
  renderTags('size')
  input.value = ''
}

function removeTag(type, val) {
  if (type !== 'size') return
  sizes = sizes.filter(s => s !== val)
  renderTags('size')
}

function renderTags(type) {
  if (type !== 'size') return
  const container = document.getElementById('sizeTags')
  container.innerHTML = sizes.map(v => \`
    <span class="tag-item">\${v}<span class="tag-del" onclick="removeTag('size','\${v}')">×</span></span>
  \`).join('')
}

function renderColorOptionsEditor() {
  const wrap = document.getElementById('colorOptionsEditor')
  if (!wrap) return
  if (!colors.length) colors = [{ name: '', image: '' }]
  wrap.innerHTML = colors.map((color, idx) => \`
    <div class="grid grid-cols-[78px_1fr_auto] gap-3 items-start">
      <div class="img-slot group relative w-[78px] h-[78px] flex items-center justify-center cursor-pointer select-none overflow-hidden"
        ondragover="handleColorImageDragOver(event)"
        ondragleave="handleColorImageDragLeave(event)"
        ondrop="handleColorImageDrop(event, \${idx})">
        <img src="\${color.image || ''}" alt="" class="w-full h-full object-cover rounded-xl \${color.image ? '' : 'hidden'}" id="colorImg-\${idx}">
        <div class="text-[11px] text-gray-400 text-center px-2 leading-tight \${color.image ? 'hidden' : ''}" id="colorPlaceholder-\${idx}">
          Bấm hoặc kéo ảnh
        </div>
        <input type="file" accept="image/*" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" id="colorFile-\${idx}" onchange="handleColorImageFile(\${idx}, this)">
        <div class="\${color.image ? 'absolute inset-0 hidden group-hover:flex items-center justify-center bg-black/45 text-white transition z-20' : 'hidden'}" id="colorOverlay-\${idx}">
          <button type="button" onclick="event.preventDefault();event.stopPropagation();removeColorImage(\${idx})" class="w-8 h-8 rounded-full bg-black/35 hover:bg-red-500 flex items-center justify-center z-30">
            <i class="fas fa-trash text-xs"></i>
          </button>
        </div>
      </div>
      <input type="text" value="\${String(color.name || '').replace(/"/g, '&quot;')}" placeholder="Nhập màu (VD: Đen, Navy...)" class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400" oninput="updateColorName(\${idx}, this.value)">
      <button type="button" onclick="removeColorOptionRow(\${idx})" class="w-9 h-9 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 mt-1">
        <i class="fas fa-trash text-xs"></i>
      </button>
    </div>
  \`).join('')
}

function addColorOptionRow() {
  colors.push({ name: '', image: '' })
  renderColorOptionsEditor()
}

function removeColorOptionRow(idx) {
  if (colors.length <= 1) {
    colors = [{ name: '', image: '' }]
  } else {
    colors.splice(idx, 1)
  }
  renderColorOptionsEditor()
}

function updateColorName(idx, value) {
  if (!colors[idx]) return
  colors[idx].name = String(value || '')
}

function removeColorImage(idx) {
  if (!colors[idx]) return
  colors[idx].image = ''
  renderColorOptionsEditor()
}

function handleColorImageDragOver(event) {
  event.preventDefault()
  event.currentTarget.classList.add('drag-over')
}

function handleColorImageDragLeave(event) {
  event.currentTarget.classList.remove('drag-over')
}

async function handleColorImageDrop(event, idx) {
  event.preventDefault()
  event.currentTarget.classList.remove('drag-over')
  const file = Array.from(event.dataTransfer?.files || []).find((f) => f.type && f.type.startsWith('image/'))
  if (!file) return
  await applyColorImageFile(idx, file)
}

async function handleColorImageFile(idx, input) {
  const file = Array.from(input.files || []).find((f) => f.type && f.type.startsWith('image/'))
  if (!file) return
  await applyColorImageFile(idx, file)
  input.value = ''
}

async function applyColorImageFile(idx, file) {
  try {
    if (!colors[idx]) return
    colors[idx].image = await fileToOptimizedDataURL(file, 500, 0.85)
    renderColorOptionsEditor()
  } catch (_) {
    showAdminToast('Không thể xử lý ảnh màu', 'error')
  }
}

function addPresetSizes(arr) {
  arr.forEach(s => { if (!sizes.includes(s)) sizes.push(s) })
  renderTags('size')
}

// ── ORDERS ────────────────────────────────────────
async function loadAdminOrders() {
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

function renderOrderRowActionControls(order) {
  const meta = getRowPrimaryActionMeta()
  const orderId = Number(order.id)
  return ''
    + '<div class="flex flex-col gap-2 items-stretch w-full max-w-[240px] mx-auto">'
    +   '<button type="button"'
    +     ' onclick="handleOrderPrimaryAction(' + orderId + ')"'
    +     ' class="w-full inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-[11px] font-semibold whitespace-nowrap transition ' + meta.className + '">'
    +     '<i class="fas ' + meta.icon + ' text-[11px]"></i>'
    +     '<span>' + meta.label + '</span>'
    +   '</button>'
    +   '<select onchange="handleOrderSecondaryAction(' + orderId + ', this)" class="w-full text-xs border rounded-lg px-2 py-2 focus:outline-none bg-white text-gray-700 border-gray-300">'
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
    const voucherHtml = o.voucher_code
      ? '<span class="font-mono text-[11px] bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded-lg font-semibold">' + o.voucher_code + '</span>'
      : '<span class="text-gray-300 text-xs">—</span>'
    return \`
      <div class="orders-mobile-card">
        <div class="flex items-start gap-2.5">
          <input type="checkbox" class="mt-1 w-4 h-4 rounded border-gray-300 text-pink-500 focus:ring-pink-400" \${selectedOrderIds.has(Number(o.id)) ? 'checked' : ''} onchange="toggleOrderSelection(\${o.id}, this.checked)">
          <div class="min-w-0 flex-1 space-y-2.5">
            <div class="flex items-start gap-3">
              <img src="\${getOrderItemImage(o)}" alt="\${o.product_name || 'product'}" class="w-14 h-14 rounded-xl object-cover border border-gray-200 bg-gray-100 flex-none" onerror="this.src='https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=80'">
              <div class="min-w-0 flex-1">
                <div class="flex items-start justify-between gap-2">
                  <button type="button"
                    onclick="copyOrderCode(decodeURIComponent('\${encodeURIComponent(String(o.order_code || '').trim())}')); return false;"
                    class="font-mono text-[11px] text-blue-600 font-semibold truncate max-w-[150px] text-left">Mã ĐH: \${o.order_code}</button>
                  <span class="inline-flex min-w-7 justify-center text-[11px] \${qtyClass} rounded-md px-2 py-0.5 shrink-0">x\${o.quantity || 1}</span>
                </div>
                <p class="mt-1 text-sm font-semibold text-gray-900 leading-5 truncate">\${o.product_name}</p>
                <p class="mt-1 text-xs text-gray-500 truncate">SKU: \${buildOrderSkuText(o)}</p>
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
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div class="rounded-xl border border-gray-200 bg-white px-3 py-2">
                <p class="text-gray-400 uppercase tracking-wide text-[10px]">Tổng tiền</p>
                <p class="mt-1 text-sm font-bold text-gray-900">\${fmtPrice(getOrderAmountDue(o))}</p>
                <p class="mt-1"><span class="text-[11px] px-2 py-0.5 rounded-full \${paymentStatusClass(o.payment_status)}">\${paymentStatusLabel(o.payment_status)}</span></p>
              </div>
              <div class="rounded-xl border border-gray-200 bg-white px-3 py-2">
                <p class="text-gray-400 uppercase tracking-wide text-[10px]">Voucher</p>
                <div class="mt-1">\${voucherHtml}</div>
                <div class="mt-2">\${paymentMethodTagHTML(o.payment_method, o.payment_status)}</div>
              </div>
            </div>
            <div>
              \${renderOrderRowActionControls(o)}
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
  if (!confirm('Xoá ' + ids.length + ' đơn đã chọn?')) return
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
  if (modal) modal.classList.remove('hidden')
}

function closeArrangeSuccessModal() {
  const modal = document.getElementById('arrangeSuccessModal')
  if (modal) modal.classList.add('hidden')
  arrangedFailedOrders = []
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
  document.getElementById('orderDetailModal').classList.remove('hidden')
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
async function loadVouchers() {
  const list = document.getElementById('voucherList')
  list.innerHTML = '<div class="text-center py-8 text-gray-400"><i class="fas fa-spinner fa-spin text-2xl"></i></div>'
  try {
    const res = await axios.get('/api/admin/vouchers')
    const vouchers = res.data.data || []
    if (!vouchers.length) {
      list.innerHTML = '<div class="text-center py-8 text-gray-400"><i class="fas fa-ticket-alt text-4xl mb-2"></i><p>Chưa có voucher nào</p></div>'
      return
    }
    list.innerHTML = vouchers.map(v => {
      const now = new Date()
      const from = new Date(v.valid_from)
      const to = new Date(v.valid_to)
      const expired = to < now
      const notStarted = from > now
      const isValid = !expired && !notStarted && v.is_active
      return \`
      <div class="border rounded-2xl p-4 \${!v.is_active ? 'opacity-50 bg-gray-50' : isValid ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' : 'bg-gray-50 border-gray-200'}">
        <div class="flex items-start justify-between gap-2 mb-2">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="font-mono font-bold text-lg tracking-widest \${isValid ? 'text-green-700' : 'text-gray-500'}">\${v.code}</span>
            <span class="text-xs px-2 py-0.5 rounded-full font-medium \${isValid ? 'bg-green-100 text-green-700' : expired ? 'bg-gray-100 text-gray-500' : notStarted ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}">
              \${isValid ? '✅ Hiệu lực' : expired ? '⏰ Hết hạn' : notStarted ? '🕐 Chưa bắt đầu' : '🚫 Tắt'}
            </span>
          </div>
          <div class="flex gap-1 shrink-0">
            <button onclick="toggleVoucher(\${v.id})" class="p-1.5 rounded-lg text-xs \${v.is_active ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-green-50 text-green-600 hover:bg-green-100'} transition" title="\${v.is_active ? 'Tắt' : 'Bật'}">
              <i class="fas fa-\${v.is_active ? 'toggle-off' : 'toggle-on'}"></i>
            </button>
            <button onclick="deleteVoucher(\${v.id})" class="p-1.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg text-xs transition" title="Xoá">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
        <div class="flex items-center gap-3 flex-wrap text-sm">
          <span class="font-bold text-pink-600 text-base">-\${fmtPrice(v.discount_amount)}</span>
          <span class="text-gray-400">|</span>
          <span class="text-gray-500 text-xs">
            <i class="fas fa-calendar text-gray-400 mr-1"></i>
            \${new Date(v.valid_from).toLocaleDateString('vi-VN')} → \${new Date(v.valid_to).toLocaleDateString('vi-VN')}
          </span>
        </div>
        <div class="flex gap-3 mt-1.5 text-xs text-gray-500">
          <span><i class="fas fa-users mr-1 text-gray-400"></i>Đã dùng: <strong>\${v.used_count}</strong>\${v.usage_limit > 0 ? '/'+v.usage_limit : ' (không giới hạn)'}</span>
        </div>
      </div>\`
    }).join('')
  } catch(e) {
    list.innerHTML = '<div class="text-center text-red-400 py-8">Lỗi tải dữ liệu</div>'
  }
}

async function createVoucher(e) {
  e.preventDefault()
  const btn = document.getElementById('createVoucherBtn')
  btn.disabled = true
  btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Đang tạo...'
  try {
    const res = await axios.post('/api/admin/vouchers', {
      discount_amount: document.getElementById('vDiscount').value,
      valid_from: new Date(document.getElementById('vFrom').value).toISOString(),
      valid_to: new Date(document.getElementById('vTo').value).toISOString(),
      usage_limit: document.getElementById('vLimit').value || 0,
      custom_code: document.getElementById('vCode').value || ''
    })
    const code = res.data.code
    document.getElementById('generatedCode').classList.remove('hidden')
    document.getElementById('generatedCodeText').textContent = code
    showAdminToast('Tạo voucher ' + code + ' thành công!', 'success')
    e.target.reset()
    loadVouchers()
  } catch(err) {
    showAdminToast('Lỗi tạo voucher: ' + (err.response?.data?.error || 'Unknown'), 'error')
  } finally {
    btn.disabled = false
    btn.innerHTML = '<i class="fas fa-magic mr-2"></i>Tạo & Sinh mã Voucher'
  }
}

async function toggleVoucher(id) {
  try {
    await axios.patch('/api/admin/vouchers/' + id + '/toggle')
    loadVouchers()
    showAdminToast('Đã cập nhật trạng thái voucher', 'success')
  } catch(e) { showAdminToast('Lỗi', 'error') }
}

async function deleteVoucher(id) {
  if (!confirm('Xoá voucher này?')) return
  try {
    await axios.delete('/api/admin/vouchers/' + id)
    loadVouchers()
    showAdminToast('Đã xoá voucher', 'success')
  } catch(e) { showAdminToast('Lỗi xoá', 'error') }
}

function copyCode() {
  const code = document.getElementById('generatedCodeText').textContent
  navigator.clipboard.writeText(code).then(() => showAdminToast('Đã sao chép: ' + code, 'success'))
}

// ── UTILS ─────────────────────────────────────────
function fmtPrice(p) { return new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND'}).format(p||0) }
function getOrderAmountDue(order) {
  if (order && order.amount_due !== undefined && order.amount_due !== null) {
    return Number(order.amount_due || 0)
  }
  return String(order?.payment_status || '').toLowerCase() === 'paid'
    ? 0
    : Number(order?.total_price || 0)
}
function paymentStatusLabel(v) {
  return String(v || '').toLowerCase() === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'
}
function paymentStatusClass(v) {
  return String(v || '').toLowerCase() === 'paid'
    ? 'bg-green-100 text-green-700 border border-green-200'
    : 'bg-amber-100 text-amber-700 border border-amber-200'
}
function formatPaymentMethod(v) {
  const key = String(v || '').toUpperCase()
  if (key === 'BANK_TRANSFER') return 'Chuyển khoản ngân hàng'
  if (key === 'MOMO') return 'Ví điện tử MoMo'
  if (key === 'ZALOPAY') return 'ZaloPay'
  return 'COD - Thanh toán khi giao'
}
function paymentMethodTagHTML(method, paymentStatus) {
  const key = String(method || '').toUpperCase()
  const paid = String(paymentStatus || '').toLowerCase() === 'paid'
  const paidMark = paid ? '<i class="fas fa-check-circle text-green-600"></i>' : ''
  if (key === 'BANK_TRANSFER') {
    return '<span class="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200"><i class="fas fa-university"></i>CK ngân hàng ' + paidMark + '</span>'
  }
  if (key === 'MOMO') {
    return '<span class="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-pink-50 text-pink-700 border border-pink-200"><i class="fas fa-wallet"></i>MoMo ' + paidMark + '</span>'
  }
  if (key === 'ZALOPAY') {
    return '<span class="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200"><i class="fas fa-mobile-alt"></i>ZaloPay ' + paidMark + '</span>'
  }
  return '<span class="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200"><i class="fas fa-money-bill-wave"></i>COD</span>'
}
function displayCustomerName(name) {
  let n = String(name || '').trim()
  while (n.indexOf('  ') >= 0) n = n.replace('  ', ' ')
  if (/^Trần\s+Công\s+Hiếu[a-z]$/i.test(n)) return 'Trần Công Hiếu'
  if (n.toLowerCase().endsWith("'s")) n = n.slice(0, -2)
  // Fix common input artifact: Vietnamese char + stray latin suffix (e.g. "Hiếus")
  if (n.length >= 2) {
    const last = n.charAt(n.length - 1)
    const prev = n.charAt(n.length - 2)
    const isAsciiLetter = (last >= 'A' && last <= 'Z') || (last >= 'a' && last <= 'z')
    if (isAsciiLetter && prev.charCodeAt(0) > 127) {
      n = n.slice(0, -1)
    }
  }
  return n
}
function isInternalTestOrder(o) {
  const customerName = String(o?.customer_name || '').trim().toLowerCase()
  const note = String(o?.note || '').trim().toLowerCase()
  return customerName === 'local script test' || note.indexOf('test:payos-local') >= 0 || note.indexOf('test:zalopay-local') >= 0
}

function getTrackingDisplayCode(fullCode) {
  const full = String(fullCode || '').trim()
  if (!full) return ''
  const parts = full.split('.').map((p) => String(p || '').trim()).filter(Boolean)
  if (parts.length >= 2 && parts[1]) return parts[1]
  return full
}

async function copyTextValue(value, successMessage) {
  const full = String(value || '').trim()
  if (!full) return false
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(full)
    } else {
      const ta = document.createElement('textarea')
      ta.value = full
      ta.setAttribute('readonly', '')
      ta.style.position = 'fixed'
      ta.style.left = '-9999px'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    showAdminToast(successMessage || 'Đã copy', 'success')
    return true
  } catch (_) {
    showAdminToast('Không thể copy', 'error')
    return false
  }
}

async function copyTrackingCode(fullCode) {
  await copyTextValue(fullCode, 'Đã copy mã vận đơn đầy đủ')
}

async function copyPhoneNumber(phone) {
  await copyTextValue(phone, 'Đã copy số điện thoại')
}

async function copyOrderCode(orderCode) {
  await copyTextValue(orderCode, 'Đã copy mã đơn hàng')
}
function safeJson(v) { try { return JSON.parse(v||'[]') } catch { return [] } }
function catLabel(c) { return {unisex:'Unisex',male:'Nam',female:'Nữ'}[c]||c }
function statusLabel(s) { return {pending:'Chờ xử lý',confirmed:'Xác nhận',shipping:'Đang giao',done:'Hoàn thành',cancelled:'Đã hủy'}[s]||s }

function showAdminToast(msg, type='success') {
  const c = document.getElementById('adminToast')
  const t = document.createElement('div')
  t.className = \`toast-admin flex items-center gap-2 px-5 py-3 rounded-2xl shadow-xl text-white text-sm font-medium pointer-events-auto \${type==='error'?'bg-red-500':type==='warning'?'bg-amber-500':'bg-green-500'}\`
  t.innerHTML = \`<i class="fas fa-\${type==='error'?'exclamation-circle':type==='warning'?'exclamation-triangle':'check-circle'}"></i>\${msg}\`
  c.appendChild(t)
  setTimeout(() => { t.style.opacity='0'; t.style.transform='translateX(100%)'; t.style.transition='all 0.3s'; setTimeout(()=>t.remove(),300) }, 3000)
}

// ── ESC key handler - close any open modal ──────────
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    const modals = ['productModal', 'orderDetailModal', 'arrangeSuccessModal']
    modals.forEach(id => {
      const el = document.getElementById(id)
      if (el && !el.classList.contains('hidden')) {
        el.classList.add('hidden')
      }
    })
    closeChangeAdminPasswordModal()
    closeAdminAvatarMenu()
    document.body.style.overflow = ''
    // Also close sidebar overlay if open
    document.getElementById('sidebarOverlay').classList.add('hidden')
    document.getElementById('sidebar').classList.add('-translate-x-full')
  }
})

// ── Safety: ensure all modals start hidden on page load ──
document.addEventListener('DOMContentLoaded', function() {
  scheduleAdminOverlaySanitize()
  syncOrdersHeaderSearchUI()
  window.addEventListener('resize', syncSidebarOverlay)
  window.addEventListener('resize', syncOrdersHeaderSearchUI)
  window.addEventListener('pageshow', scheduleAdminOverlaySanitize)
  window.addEventListener('focus', scheduleAdminOverlaySanitize)
  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible') scheduleAdminOverlaySanitize()
  })
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeOrdersHeaderSearch()
  })

  document.addEventListener('click', function(e) {
    const target = e.target
    if (!target) return
    const searchRoot = document.getElementById('ordersHeaderSearch')
    if (searchRoot && isOrdersPageActive() && ordersSearchExpanded && !searchRoot.contains(target)) closeOrdersHeaderSearch()
    const root = document.getElementById('adminAvatarMenuRoot')
    if (!root) return
    if (!root.contains(target)) closeAdminAvatarMenu()
  })
})

// Init
async function initAdminAuth() {
  scheduleAdminOverlaySanitize()
  try {
    const res = await axios.get('/api/auth/me')
    if (!res.data.isAdmin) {
      window.location.replace('/admin/login')
      return
    }
    adminProfile = res.data?.data || null
    applyAdminAvatarUI()
  } catch (e) {
    // 401 or error → redirect to login
    window.location.replace('/admin/login')
    return
  }
  await loadAdminProfile()
  loadDashboard()
  scheduleAdminOverlaySanitize()
}
initAdminAuth()
<\/script>
</body>
</html>`
}
