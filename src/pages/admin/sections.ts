import {
  DEFAULT_QUICK_ORDER_RISK_NOTE_TEXT,
  DEFAULT_TEXT_UI_SETTINGS,
} from '../../lib/textUiSettings'

function escapeAdminHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[ch] || ch))
}

export function adminBodyOpen(): string {
  return "<body class=\"bg-gray-50 flex\">"
}

export function adminMobileMenuToggle(): string {
  return ""
}

export function adminSidebarOverlay(): string {
  return "<!-- SIDEBAR OVERLAY (mobile) -->\n<div id=\"sidebarOverlay\" class=\"fixed inset-0 mobile-overlay z-30 hidden md:hidden\" style=\"display:none;pointer-events:none\" onclick=\"closeMobileSidebar()\"></div>"
}

export function adminSidebarSection(): string {
  return `<!-- SIDEBAR -->
<aside id="sidebar" data-sidebar-state="expanded" class="sidebar w-64 min-h-screen fixed left-0 top-0 z-40 transform -translate-x-full md:translate-x-0 transition-transform duration-300 flex flex-col">
  <div class="p-6 border-b border-white/10">
    <div class="flex items-center gap-3 sidebar-brand-shell">
      <span class="inline-flex items-center justify-center sidebar-brand-logo"><img src="/qh-logo.png" alt="QH Boypho" class="rounded-full w-9 h-9 object-cover bg-white"></span>
      <div class="sidebar-brand-copy">
        <p class="text-white font-bold text-lg leading-tight"><span class="text-pink-400">Boypho</span></p>
        <p class="text-gray-400 text-xs">Admin Panel</p>
      </div>
    </div>
  </div>
  
  <nav class="p-4 flex-1 space-y-1">
    <button class="nav-item active w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 text-sm font-medium" data-page="dashboard" onclick="showPage('dashboard')">
      <i class="fas fa-chart-pie w-5"></i><span class="sidebar-label">Dashboard</span>
    </button>
    <button id="productMenuBtn" class="nav-item w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 text-sm font-medium" onclick="toggleProductMenu()">
      <i class="fas fa-tshirt w-5"></i>
      <span class="sidebar-label">Sản phẩm</span>
      <i id="productMenuChevron" class="sidebar-chevron fas fa-chevron-down ml-auto text-xs transition-transform"></i>
    </button>
    <div id="productSubmenu" class="hidden ml-5 mt-1 space-y-1">
      <button class="nav-sub-item w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-gray-400 text-sm font-medium" data-sub-page="products" onclick="openProductsAdmin()">
        <i class="fas fa-box-open w-4"></i><span class="sidebar-sub-label">Danh sách sản phẩm</span>
      </button>
      <button class="nav-sub-item w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-gray-400 text-sm font-medium" data-sub-page="product-types" onclick="openProductTypesAdmin()">
        <i class="fas fa-layer-group w-4"></i><span class="sidebar-sub-label">Loại sản phẩm</span>
      </button>
    </div>
    <button class="nav-item w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 text-sm font-medium" data-page="orders" onclick="showPage('orders')">
      <i class="fas fa-clipboard-list w-5"></i><span class="sidebar-label">Đơn hàng</span>
      <span id="pendingBadge" class="sidebar-badge ml-auto bg-pink-500 text-white text-xs rounded-full px-2 py-0.5 hidden"></span>
    </button>
    <button class="nav-item w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 text-sm font-medium" data-page="returns" onclick="showPage('returns')">
      <i class="fas fa-undo w-5"></i><span class="sidebar-label">Quản lý hoàn trả</span>
    </button>
    <button class="nav-item w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 text-sm font-medium" data-page="customers" onclick="showPage('customers')">
      <i class="fas fa-users w-5"></i><span class="sidebar-label">Khách hàng</span>
    </button>
    <button class="nav-item w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 text-sm font-medium" data-page="live-chat" onclick="showPage('live-chat')">
      <i class="fas fa-comments w-5"></i><span class="sidebar-label">Live chat</span>
      <span id="liveChatAdminBadge" class="sidebar-badge ml-auto bg-pink-500 text-white text-xs rounded-full px-2 py-0.5 hidden"></span>
    </button>
    <button class="nav-item w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 text-sm font-medium" data-page="vouchers" onclick="showPage('vouchers')">
      <i class="fas fa-ticket-alt w-5"></i><span class="sidebar-label">Khuyến mãi</span>
    </button>
    <button class="nav-item w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 text-sm font-medium" data-page="featured" onclick="showPage('featured')">
      <i class="fas fa-star w-5"></i><span class="sidebar-label">Sản phẩm Nổi Bật</span>
    </button>
    <button id="marketingMenuBtn" class="nav-item w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 text-sm font-medium" onclick="toggleMarketingMenu()">
      <i class="fas fa-bullhorn w-5"></i>
      <span class="sidebar-label">Marketing</span>
      <i id="marketingMenuChevron" class="sidebar-chevron fas fa-chevron-down ml-auto text-xs transition-transform"></i>
    </button>
    <div id="marketingSubmenu" class="hidden ml-5 mt-1 space-y-1">
      <button class="nav-sub-item w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-gray-400 text-sm font-medium" data-sub-page="flashsale" onclick="openFlashSaleAdmin()">
        <i class="fas fa-bolt w-4"></i><span class="sidebar-sub-label">Flashsale</span>
      </button>
    </div>
    <button class="nav-item w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 text-sm font-medium" data-page="reviews" onclick="showPage('reviews')">
      <i class="fas fa-star-half-stroke w-5"></i><span class="sidebar-label">Đánh giá</span>
    </button>
    <button class="nav-item w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 text-sm font-medium" data-page="backup" onclick="showPage('backup')">
      <i class="fas fa-database w-5"></i><span class="sidebar-label">Dữ liệu</span>
    </button>
    <button id="settingsMenuBtn" class="nav-item w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 text-sm font-medium" onclick="toggleSettingsMenu()">
      <i class="fas fa-gear w-5"></i>
      <span class="sidebar-label">Setting</span>
      <i id="settingsMenuChevron" class="sidebar-chevron fas fa-chevron-down ml-auto text-xs transition-transform"></i>
    </button>
    <div id="settingsSubmenu" class="hidden ml-5 mt-1 space-y-1">
      <button class="nav-sub-item w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-gray-400 text-sm font-medium" data-sub-page="settings-social" onclick="openSettingsSocial()">
        <i class="fas fa-hashtag w-4"></i><span class="sidebar-sub-label">MXH</span>
      </button>
      <button class="nav-sub-item w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-gray-400 text-sm font-medium" data-sub-page="settings-warehouse" onclick="openSettingsWarehouse()">
        <i class="fas fa-warehouse w-4"></i><span class="sidebar-sub-label">Kho hàng</span>
      </button>
    </div>
  </nav>
  
  <div class="p-4 border-t border-white/10">
    <a href="/" target="_blank" class="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 text-sm hover:text-pink-400 transition">
      <i class="fas fa-external-link-alt w-5"></i><span class="sidebar-label">Xem trang chủ</span>
    </a>
  </div>
</aside>`
}

export function adminMainContentStart(): string {
  return `<!-- MAIN CONTENT -->
<main id="adminMainContent" class="flex-1 min-w-0 overflow-x-hidden min-h-screen">
  <!-- Top bar -->
  <header class="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-[45] shadow-sm">
    <div class="flex items-center gap-3 min-w-0 flex-1">
      <button id="menuToggle" type="button" onclick="toggleSidebar()" aria-label="Mở menu quản trị" aria-expanded="false" class="sidebar-mobile-toggle z-[70] md:hidden text-gray-700">
        <i id="menuToggleIcon" class="fas fa-bars text-gray-700"></i>
      </button>
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
      <button type="button" id="adminInstallAppButton" onclick="installAdminPwa()" class="hidden admin-install-app-btn items-center justify-center gap-2 rounded-xl border border-pink-100 bg-pink-50 px-3 py-2 text-xs font-bold text-pink-600 shadow-sm hover:bg-pink-100 transition" title="Cài dashboard như app">
        <i class="fas fa-mobile-screen-button"></i><span class="hidden sm:inline">Cài app</span>
      </button>
      <button type="button" id="adminOrderNotifyButton" onclick="enableAdminOrderNotifications()" class="inline-flex items-center justify-center gap-2 w-10 h-10 lg:w-auto lg:px-3 rounded-xl border border-gray-200 bg-white text-gray-500 shadow-sm hover:text-pink-600 hover:border-pink-200 hover:bg-pink-50 transition" title="Bật thông báo đơn mới" aria-label="Bật thông báo đơn mới">
        <i id="adminOrderNotifyIcon" class="fas fa-bell text-sm"></i>
        <span id="adminOrderNotifyLabel" class="hidden lg:inline text-xs font-bold whitespace-nowrap leading-none">Thông báo</span>
      </button>
      <button type="button" id="sidebarDesktopToggle" onclick="toggleDesktopSidebar()" class="sidebar-toggle-desktop hidden md:inline-flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200 text-gray-600 hover:text-pink-600 hover:border-pink-200 transition" title="Thu gọn sidebar">
        <i class="fas fa-bars-staggered"></i>
      </button>
      <div id="adminAvatarMenuRoot" class="relative z-[49]">
        <button id="adminAvatarMenuTrigger" type="button" onclick="toggleAdminAvatarMenu(event)" title="Tài khoản quản trị" class="w-auto max-w-[260px] rounded-full bg-gray-900 text-white pl-1.5 pr-3 py-1.5 flex items-center gap-2 shadow-sm hover:bg-gray-800 transition">
          <span class="relative w-8 h-8 rounded-full overflow-hidden bg-gray-50 text-gray-700 font-bold text-xs flex items-center justify-center flex-none">
            <img id="adminHeaderAvatarImg" src="" alt="avatar" class="w-full h-full object-cover hidden">
            <span id="adminHeaderAvatarFallback">A</span>
          </span>
          <span id="adminHeaderProfileName" class="text-sm font-semibold truncate">QH Boypho</span>
        </button>
        <div id="adminAvatarDropdown" class="hidden fixed top-0 right-0 w-[320px] bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-[49]" style="display:none;pointer-events:none">
          <div class="p-3 bg-gray-50 border-b border-gray-200">
            <div class="flex items-center gap-3">
              <button type="button" class="avatar-wrap relative w-14 h-14 rounded-full overflow-hidden bg-gray-50 text-gray-700 font-bold text-lg flex items-center justify-center cursor-pointer flex-none">
                <input id="adminAvatarInput" type="file" accept="image/*" class="absolute inset-0 z-20 opacity-0 cursor-pointer" onclick="event.stopPropagation()" onchange="onAdminAvatarSelected(this)">
                <img id="adminMenuAvatarImg" src="" alt="avatar" class="w-full h-full object-cover hidden">
                <span id="adminMenuAvatarFallback">A</span>
                <span class="avatar-edit-overlay"><i class="fas fa-camera text-white text-sm"></i></span>
              </button>
              <div class="min-w-0">
                <p id="adminMenuProfileName" class="text-sm font-semibold text-gray-900 truncate">QH Boypho</p>
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
  </header>`
}

export function adminDashboardPage(): string {
  return `<!-- DASHBOARD PAGE -->
  <div id="page-dashboard" class="p-3 md:p-6">
    <div class="dashboard-stat-grid grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4 mb-6 md:mb-8">
      <div class="dashboard-stat-card stat-card rounded-2xl p-4 md:p-5 text-white overflow-hidden" style="--from:#e84393;--to:#c0392b">
        <div class="flex justify-between items-start gap-3 min-w-0">
          <div class="min-w-0"><p class="dashboard-stat-label text-white/80 text-xs sm:text-sm leading-tight">Sản phẩm</p><p id="statProducts" class="dashboard-stat-value text-2xl md:text-3xl font-bold mt-1">—</p></div>
          <div class="dashboard-stat-icon w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0"><i class="fas fa-tshirt"></i></div>
        </div>
      </div>
      <div class="dashboard-stat-card stat-card rounded-2xl p-4 md:p-5 text-white overflow-hidden" style="--from:#667eea;--to:#764ba2">
        <div class="flex justify-between items-start gap-3 min-w-0">
          <div class="min-w-0"><p class="dashboard-stat-label text-white/80 text-xs sm:text-sm leading-tight">Đơn hàng</p><p id="statOrders" class="dashboard-stat-value text-2xl md:text-3xl font-bold mt-1">—</p></div>
          <div class="dashboard-stat-icon w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0"><i class="fas fa-shopping-bag"></i></div>
        </div>
      </div>
      <div class="dashboard-stat-card stat-card rounded-2xl p-4 md:p-5 text-white overflow-hidden" style="--from:#f093fb;--to:#f5576c">
        <div class="flex justify-between items-start gap-3 min-w-0">
          <div class="min-w-0"><p class="dashboard-stat-label text-white/80 text-xs sm:text-sm leading-tight">Chờ xử lý</p><p id="statPending" class="dashboard-stat-value text-2xl md:text-3xl font-bold mt-1">—</p></div>
          <div class="dashboard-stat-icon w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0"><i class="fas fa-clock"></i></div>
        </div>
      </div>
      <div class="dashboard-stat-card stat-card rounded-2xl p-4 md:p-5 text-white overflow-hidden" style="--from:#43e97b;--to:#38f9d7">
        <div class="flex justify-between items-start gap-3 min-w-0">
          <div class="min-w-0"><p class="dashboard-stat-label text-white/80 text-xs sm:text-sm leading-tight">Doanh thu tháng</p><p id="statRevenue" class="dashboard-stat-value dashboard-stat-value-revenue text-xl md:text-2xl font-bold mt-1">—</p></div>
          <div class="dashboard-stat-icon w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0"><i class="fas fa-coins"></i></div>
        </div>
      </div>
      <div class="dashboard-stat-card stat-card rounded-2xl p-4 md:p-5 text-white overflow-hidden" style="--from:#ffb347;--to:#ff9800">
        <div class="flex justify-between items-start gap-3 min-w-0">
          <div class="min-w-0"><p class="dashboard-stat-label text-white/85 text-xs sm:text-sm leading-tight">Thuế phải nộp</p><p id="statTaxDue" class="dashboard-stat-value dashboard-stat-value-revenue text-xl md:text-2xl font-bold mt-1">—</p></div>
          <div class="dashboard-stat-icon w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0"><i class="fas fa-file-invoice-dollar"></i></div>
        </div>
      </div>
      <div class="dashboard-stat-card stat-card rounded-2xl p-4 md:p-5 text-white overflow-hidden" style="--from:#00c6ff;--to:#0072ff">
        <div class="flex justify-between items-start gap-3 min-w-0">
          <div class="min-w-0">
            <p class="dashboard-stat-label text-white/80 text-xs sm:text-sm leading-tight">
              <span class="hidden sm:inline">Người xem sản phẩm</span>
              <span class="sm:hidden">Lượt xem SP</span>
            </p>
            <p id="statFrontendVisitors" class="dashboard-stat-value text-2xl md:text-3xl font-bold mt-1">—</p>
          </div>
          <div class="dashboard-stat-icon w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0"><i class="fas fa-eye"></i></div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-4 md:gap-6 mb-6">
      <section class="bg-white rounded-2xl shadow-sm border p-4 md:p-6 overflow-hidden">
        <div class="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 class="font-bold text-gray-800">Tổng quan tài chính tháng</h2>
            <p id="dashboardRangeLabel" class="text-xs text-gray-400 mt-1">Đang tải dữ liệu...</p>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <button
              id="dashboardTaxReportButton"
              type="button"
              onclick="downloadDashboardTaxReport()"
              class="inline-flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-100"
              title="Tải báo cáo doanh thu tính thuế"
            >
              <i class="fas fa-file-excel text-sm"></i>
              <span class="hidden sm:inline">Tải báo cáo</span>
            </button>
            <span class="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600"><i class="fas fa-chart-line"></i></span>
          </div>
        </div>
        <div id="dashboardInsightGrid" class="space-y-3">
          <div class="rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <p class="text-xs text-gray-500">Đang tải dữ liệu tài chính...</p>
            <p class="mt-2 text-2xl font-bold text-gray-800">—</p>
          </div>
        </div>
      </section>
      <section class="bg-white rounded-2xl shadow-sm border p-4 md:p-6 overflow-hidden">
        <div class="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 class="font-bold text-gray-800">Trạng thái đơn hàng</h2>
            <p class="text-xs text-gray-400 mt-1">Cùng logic với tổng đơn vận hành</p>
          </div>
          <span class="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-pink-50 text-pink-600"><i class="fas fa-bars-progress"></i></span>
        </div>
        <div id="dashboardStatusBreakdown" class="space-y-3">
          <div class="text-sm text-gray-400">Đang tải dữ liệu...</div>
        </div>
      </section>
    </div>
    
    <div class="dashboard-recent-orders-panel bg-white rounded-2xl shadow-sm border p-4 md:p-6 overflow-hidden">
      <div class="flex items-center justify-between gap-3 mb-4">
        <h2 class="font-bold text-gray-800">Đơn hàng gần đây</h2>
        <button onclick="showPage('orders')" class="text-pink-500 text-sm hover:underline shrink-0">Xem tất cả</button>
      </div>
      <div id="recentOrdersTable" class="min-w-0">
        <div class="text-center py-8 text-gray-400"><i class="fas fa-spinner fa-spin text-2xl"></i></div>
      </div>
    </div>

    <div id="dashboardCustomerModal" class="fixed inset-0 modal-overlay z-[85] hidden items-center justify-center p-4" style="display:none;pointer-events:none" onclick="if(event.target===this) closeDashboardCustomerModal()">
      <div class="modal-card bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden" onclick="event.stopPropagation()">
        <div class="border-b px-5 py-4 flex items-center justify-between gap-3">
          <h3 class="font-bold text-gray-900">Thông tin khách</h3>
          <button type="button" onclick="closeDashboardCustomerModal()" class="w-9 h-9 rounded-full bg-gray-100 text-gray-500 hover:text-gray-900 hover:bg-gray-200 transition">
            <i class="fas fa-xmark"></i>
          </button>
        </div>
        <div class="p-5 space-y-3 text-sm">
          <div>
            <p class="text-xs font-semibold uppercase tracking-wide text-gray-400">Tên khách</p>
            <p id="dashboardCustomerName" class="mt-1 font-semibold text-gray-900 break-words">—</p>
          </div>
          <div>
            <p class="text-xs font-semibold uppercase tracking-wide text-gray-400">Số điện thoại</p>
            <p id="dashboardCustomerPhone" class="mt-1 font-semibold text-gray-900 break-words">—</p>
          </div>
          <div>
            <p class="text-xs font-semibold uppercase tracking-wide text-gray-400">Địa chỉ</p>
            <p id="dashboardCustomerAddress" class="mt-1 text-gray-700 break-words">—</p>
          </div>
        </div>
      </div>
    </div>
  </div>`
}

export function adminProductsPage(): string {
  return `<!-- PRODUCTS PAGE -->
  <div id="page-products" class="p-3 md:p-6 hidden">
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
      <div class="flex flex-wrap gap-2 items-center">
        <input type="text" id="productSearch" placeholder="Tìm sản phẩm..." oninput="filterAdminProducts()" 
          class="border rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-pink-400 w-48">
        <select id="productCatFilter" onchange="filterAdminProducts()" class="border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-400">
          <option value="">Tất cả dành cho</option>
          <option value="unisex">Unisex</option>
          <option value="male">Nam</option>
          <option value="female">Nữ</option>
        </select>
        <select id="productTypeFilter" onchange="filterAdminProducts()" class="border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-400 min-w-[180px]">
          <option value="">Tất cả loại</option>
        </select>
      </div>
      <button onclick="openProductModal()" class="btn-pink text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2">
        <i class="fas fa-plus"></i>Thêm sản phẩm
      </button>
    </div>
    
    <div id="adminProductsGrid" class="admin-products-grid grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-4"></div>
  </div>

  <!-- PRODUCT TYPES PAGE -->
  <div id="page-product-types" class="p-3 md:p-6 hidden">
    <section class="rounded-3xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <button type="button" onclick="toggleProductTypesEditor()" class="w-full px-4 py-4 md:px-5 flex items-center justify-between gap-4 text-left">
        <div class="min-w-0">
          <div class="flex items-center gap-2 text-pink-600 font-bold">
            <i class="fas fa-layer-group"></i>
            <span>Loại sản phẩm</span>
          </div>
          <p class="mt-1 text-sm text-gray-500">Quản lý loại để gán vào sản phẩm và dùng cho bộ lọc ngoài storefront.</p>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <span id="adminProductTypesCount" class="hidden sm:inline-flex rounded-full bg-pink-50 px-3 py-1 text-xs font-bold text-pink-600">0 loại</span>
          <i id="productTypesEditorChevron" class="fas fa-chevron-up text-gray-400 transition-transform"></i>
        </div>
      </button>
      <div id="productTypesEditorShell" class="border-t border-gray-100 px-4 pb-4 md:px-5 md:pb-5">
        <div class="pt-4 flex justify-end">
          <button type="button" onclick="addAdminProductTypeRow()" class="inline-flex items-center justify-center gap-2 rounded-xl border border-pink-200 bg-pink-50 px-4 py-2.5 text-sm font-semibold text-pink-600 hover:bg-pink-100 transition">
            <i class="fas fa-plus"></i>Thêm loại
          </button>
        </div>
        <div id="adminProductTypesEditor" class="mt-4 grid gap-2"></div>
        <div class="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p class="text-xs font-semibold text-gray-400">Tắt hiển thị để ẩn loại khỏi filter nhưng vẫn giữ sản phẩm đang gán.</p>
          <button type="button" onclick="saveAdminProductTypes()" id="saveProductTypesBtn" class="btn-pink inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white">
            <i class="fas fa-save"></i>Lưu loại sản phẩm
          </button>
        </div>
      </div>
    </section>
  </div>`
}

export function adminOrdersPage(): string {
  return "<!-- ORDERS PAGE -->\n  <div id=\"page-orders\" class=\"p-3 md:p-6 hidden overflow-x-hidden\">\n    <div class=\"flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6\">\n      <div class=\"flex gap-2 flex-wrap items-center\">\n        <select id=\"orderStatusFilter\" onchange=\"setOrdersPage(1); filterOrders()\" class=\"border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-400\">\n          <option value=\"all\">Tất cả trạng thái</option>\n          <option value=\"pending\">Chờ xử lý</option>\n          <option value=\"confirmed\">Đã xác nhận</option>\n          <option value=\"shipping\">Đang giao</option>\n          <option value=\"done\">Hoàn thành</option>\n          <option value=\"cancelled\">Đã hủy</option>\n        </select>\n        <select id=\"ordersViewModeSelect\" onchange=\"setOrdersViewMode(this.value)\" class=\"border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-400 min-w-[220px] bg-white text-gray-700 font-semibold\">\n          <option id=\"ordersViewModeToArrangeOption\" value=\"to_arrange\">Sắp xếp vận chuyển (0)</option>\n          <option id=\"ordersViewModeWaitingOption\" value=\"waiting_ship\">Đang chờ vận chuyển (0)</option>\n        </select>\n      </div>\n      <div class=\"flex items-center gap-2\">\n        <button onclick=\"exportExcel()\" class=\"bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition\">\n          <i class=\"fas fa-file-excel\"></i>Xuất Excel\n        </button>\n      </div>\n    </div>\n    \n    <div class=\"bg-white rounded-2xl shadow-sm border overflow-hidden\">\n      <div class=\"hidden md:block overflow-x-auto scrollbar-thin\">\n        <table class=\"w-full text-sm\">\n          <thead>\n            <tr class=\"bg-gray-50 border-b\">\n              <th class=\"px-3 py-3 text-center font-semibold text-gray-600 w-10 min-w-10\">\n                <input id=\"ordersSelectAll\" type=\"checkbox\" onchange=\"toggleSelectAllOrders(this.checked)\" class=\"w-4 h-4 rounded border-gray-300 text-pink-500 focus:ring-pink-400\">\n              </th>\n              <th class=\"px-4 py-3 text-left font-semibold text-gray-600 w-[360px] min-w-[360px]\">Thông tin ĐH</th>\n              <th class=\"px-2 py-3 text-center font-semibold text-gray-600 w-12 min-w-12\">SL</th>\n              <th class=\"px-4 py-3 text-right font-semibold text-gray-600 w-[150px] min-w-[150px]\">Tổng tiền</th>\n              <th class=\"px-4 py-3 text-center font-semibold text-gray-600 hidden lg:table-cell w-[120px] min-w-[120px]\">Voucher</th>\n              <th id=\"ordersCarrierColumnHeader\" class=\"hidden px-4 py-3 text-center font-semibold text-gray-600 w-[110px] min-w-[110px]\">ĐVVC</th>\n              <th class=\"px-4 py-3 text-center font-semibold text-gray-600 w-[240px] min-w-[240px]\">Trạng thái</th>\n            </tr>\n          </thead>\n          <tbody id=\"ordersTable\"></tbody>\n        </table>\n      </div>\n      <div id=\"ordersMobileList\" class=\"md:hidden\"></div>\n      <div id=\"ordersEmpty\" class=\"hidden text-center py-16 text-gray-400\">\n        <i class=\"fas fa-inbox text-4xl mb-3\"></i><p>Không có đơn hàng nào</p>\n      </div>\n    </div>\n    <div id=\"ordersPagination\" class=\"mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-500\"></div>\n    <div id=\"orderStats\" class=\"mt-2 text-sm text-gray-500 text-right\"></div>\n  </div>\n\n  <div id=\"ordersBulkActionBar\" class=\"hidden fixed left-1/2 -translate-x-1/2 z-[70]\" style=\"bottom: 200px;\">\n    <div class=\"bg-white/95 backdrop-blur border border-gray-200 shadow-2xl rounded-2xl px-3 py-2 flex items-center gap-2\">\n      <button id=\"bulkArrangeShipBtn\" onclick=\"arrangeSelectedForShipping()\" class=\"hidden bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition\">\n        <i class=\"fas fa-truck-loading\"></i><span id=\"bulkArrangeShipText\">Sắp xếp vận chuyển</span>\n      </button>\n      <button id=\"bulkDeleteOrdersBtn\" onclick=\"deleteSelectedOrders()\" class=\"hidden bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition\">\n        <i class=\"fas fa-trash\"></i><span id=\"bulkDeleteOrdersText\">Xoá đã chọn</span>\n      </button>\n    </div>\n  </div>\n\n  <div id=\"shippingBulkActionBar\" class=\"hidden fixed bottom-5 left-1/2 -translate-x-1/2 z-[70]\">\n    <div class=\"bg-white border border-gray-200 shadow-2xl rounded-2xl px-3 py-2 flex items-center gap-2\">\n      <span id=\"shippingBulkSelectedText\" class=\"text-sm text-gray-700 px-2\">Đã chọn 0 đơn</span>\n      <button onclick=\"printSelectedOrders()\" class=\"bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition\">\n        In đơn hàng loạt\n      </button>\n    </div>\n  </div>"
}

export function adminReviewsPage(): string {
  return "<!-- REVIEWS PAGE -->\n  <div id=\"page-reviews\" class=\"p-6 hidden\">\n    <div class=\"flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6\">\n      <div class=\"flex flex-wrap gap-2 items-center\">\n        <input type=\"text\" id=\"adminReviewSearch\" placeholder=\"Tìm sản phẩm / người đánh giá / mã đơn...\" oninput=\"loadAdminReviews()\" class=\"border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400 min-w-[260px]\">\n        <select id=\"adminReviewProductFilter\" onchange=\"loadAdminReviews()\" class=\"border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-pink-400 min-w-[220px]\">\n          <option value=\"\">Tất cả sản phẩm</option>\n        </select>\n        <select id=\"adminReviewRatingFilter\" onchange=\"loadAdminReviews()\" class=\"border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-pink-400\">\n          <option value=\"\">Tất cả số sao</option>\n          <option value=\"5\">5 sao</option>\n          <option value=\"4\">4 sao</option>\n          <option value=\"3\">3 sao</option>\n          <option value=\"2\">2 sao</option>\n          <option value=\"1\">1 sao</option>\n        </select>\n        <label class=\"inline-flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm text-gray-600 bg-white cursor-pointer\">\n          <input type=\"checkbox\" id=\"adminReviewHasImagesFilter\" onchange=\"loadAdminReviews()\" class=\"w-4 h-4 accent-pink-500\">\n          Chỉ có ảnh\n        </label>\n      </div>\n      <button onclick=\"openAdminReviewModal()\" class=\"btn-pink text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2\">\n        <i class=\"fas fa-plus\"></i>Thêm đánh giá\n      </button>\n    </div>\n    <div class=\"bg-white rounded-2xl shadow-sm border overflow-hidden\">\n      <div class=\"overflow-x-auto\">\n        <table class=\"w-full text-sm min-w-[980px]\">\n          <thead>\n            <tr class=\"bg-gray-50 border-b text-gray-600\">\n              <th class=\"px-4 py-3 text-left font-semibold\">Sản phẩm</th>\n              <th class=\"px-4 py-3 text-left font-semibold\">Người đánh giá</th>\n              <th class=\"px-4 py-3 text-center font-semibold\">Số sao</th>\n              <th class=\"px-4 py-3 text-left font-semibold\">Nội dung</th>\n              <th class=\"px-4 py-3 text-center font-semibold\">Nguồn</th>\n              <th class=\"px-4 py-3 text-center font-semibold\">Ảnh</th>\n              <th class=\"px-4 py-3 text-center font-semibold\">Thời gian</th>\n              <th class=\"px-4 py-3 text-center font-semibold\">Hành động</th>\n            </tr>\n          </thead>\n          <tbody id=\"adminReviewsTable\"></tbody>\n        </table>\n      </div>\n      <div id=\"adminReviewsEmpty\" class=\"hidden text-center py-16 text-gray-400\">\n        <i class=\"fas fa-star text-4xl mb-3\"></i><p>Chưa có đánh giá nào</p>\n      </div>\n    </div>\n  </div>"
}

export function adminVouchersPage(): string {
  return `<!-- VOUCHERS PAGE -->
  <div id="page-vouchers" class="p-6 hidden">
    <div class="grid xl:grid-cols-2 gap-6">
      <div class="space-y-6">
        <div class="bg-white rounded-2xl shadow-sm border p-6">
          <h2 class="font-bold text-gray-800 text-lg mb-2 flex items-center gap-2">
            <i class="fas fa-barcode text-pink-500"></i>Tạo mã khuyến mãi
          </h2>
          <p class="text-sm text-gray-500 mb-5">Khách nhập đúng mã ở bước đặt hàng thì mới được giảm.</p>
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
                <i class="fas fa-ticket text-pink-400 mr-1"></i>Mã tuỳ chỉnh <span class="text-gray-400 font-normal">(để trống = tự sinh)</span>
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
              <i class="fas fa-magic mr-2"></i>Tạo mã khuyến mãi
            </button>
          </form>
          <div id="generatedCode" class="hidden mt-4 p-4 rounded-2xl bg-gradient-to-r from-pink-50 to-red-50 border border-pink-200 text-center">
            <p class="text-xs text-gray-500 mb-1">Mã khuyến mãi vừa tạo:</p>
            <p id="generatedCodeText" class="text-2xl font-bold tracking-widest text-pink-600 font-mono"></p>
            <button onclick="copyCode()" class="mt-2 text-xs text-gray-500 hover:text-pink-500 transition">
              <i class="fas fa-copy mr-1"></i>Sao chép
            </button>
          </div>
        </div>

        <div class="bg-white rounded-2xl shadow-sm border p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-bold text-gray-800 text-lg flex items-center gap-2">
              <i class="fas fa-list text-pink-500"></i>Danh sách mã khuyến mãi
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

      <div class="space-y-6">
        <div class="bg-white rounded-2xl shadow-sm border p-6">
          <h2 class="font-bold text-gray-800 text-lg mb-2 flex items-center gap-2">
            <i class="fas fa-tags text-pink-500"></i>Voucher tự động
          </h2>
          <p class="text-sm text-gray-500 mb-5">Tự trừ vào giá hiển thị của sản phẩm. Giá gạch ngang vẫn là giá gốc.</p>
          <form onsubmit="createAutoVoucher(event)" class="space-y-4">
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1.5">Tên voucher *</label>
              <input type="text" id="autoVoucherName" placeholder="VD: Giảm thêm 30K" required
                class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400">
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1.5">Số tiền giảm *</label>
                <input type="number" id="autoVoucherDiscount" placeholder="30000" min="1000" required
                  class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400">
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1.5">Phạm vi áp dụng</label>
                <select id="autoVoucherScope" onchange="syncAutoVoucherScopeUI()" class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400 bg-white">
                  <option value="all">Toàn bộ cửa hàng</option>
                  <option value="products">Một số sản phẩm</option>
                </select>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1.5">Hiệu lực từ *</label>
                <input type="datetime-local" id="autoVoucherFrom" required
                  class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400">
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1.5">Hết hạn *</label>
                <input type="datetime-local" id="autoVoucherTo" required
                  class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400">
              </div>
            </div>
            <div id="autoVoucherProductsWrap" class="hidden">
              <div class="flex items-center justify-between mb-2">
                <label class="block text-sm font-semibold text-gray-700">Sản phẩm áp dụng</label>
                <button type="button" onclick="loadAutoVoucherProductOptions()" class="text-xs text-pink-500 hover:underline">Tải lại</button>
              </div>
              <div id="autoVoucherProducts" class="max-h-64 overflow-y-auto rounded-2xl border bg-gray-50 p-2 space-y-2">
                <div class="text-center text-gray-400 py-6 text-sm">Chọn phạm vi sản phẩm để tải danh sách.</div>
              </div>
            </div>
            <label class="inline-flex items-center gap-2 text-sm font-semibold text-gray-700">
              <input id="autoVoucherActive" type="checkbox" checked class="w-4 h-4 rounded border-gray-300 text-pink-500 focus:ring-pink-400">
              Đang bật
            </label>
            <label class="flex items-start gap-3 rounded-2xl border border-pink-100 bg-pink-50 px-4 py-3 text-sm font-semibold text-gray-700">
              <input id="autoVoucherShowBadge" type="checkbox" checked class="mt-0.5 w-4 h-4 rounded border-gray-300 text-pink-500 focus:ring-pink-400">
              <span>
                <span class="block text-gray-800">Hiển thị badge ngoài storefront</span>
                <span class="block text-xs font-medium text-gray-500">Bật để hiện badge voucher cạnh Freeship trên card sản phẩm, mẫu bán chạy và hero.</span>
              </span>
            </label>
            <button type="submit" id="createAutoVoucherBtn" class="btn-pink w-full text-white py-3 rounded-xl font-bold text-sm">
              <i class="fas fa-tags mr-2"></i>Tạo voucher tự động
            </button>
          </form>
        </div>

        <div class="bg-white rounded-2xl shadow-sm border p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-bold text-gray-800 text-lg flex items-center gap-2">
              <i class="fas fa-bolt text-pink-500"></i>Danh sách voucher tự động
            </h2>
            <button onclick="loadAutoVouchers()" class="text-sm text-pink-500 hover:underline">
              <i class="fas fa-sync-alt mr-1"></i>Làm mới
            </button>
          </div>
          <div id="autoVoucherList" class="space-y-3 max-h-[500px] overflow-y-auto scrollbar-thin pr-1">
            <div class="text-center py-8 text-gray-400"><i class="fas fa-spinner fa-spin text-2xl"></i></div>
          </div>
        </div>
      </div>
    </div>
  </div>`
}

export function adminFeaturedPage(): string {
  return "<!-- FEATURED PRODUCTS PAGE -->\n  <div id=\"page-featured\" class=\"p-6 hidden\">\n    <div class=\"mb-6\">\n      <div class=\"flex items-center justify-between mb-2\">\n        <div>\n          <h2 class=\"font-bold text-gray-800 text-xl flex items-center gap-2\">\n            <i class=\"fas fa-star text-amber-400\"></i>Quản lý Sản phẩm Nổi Bật\n          </h2>\n          <p class=\"text-sm text-gray-500 mt-1\">Chọn sản phẩm muốn hiển thị nổi bật và sắp xếp thứ tự. Khi khách bấm vào, sẽ mở modal chi tiết sản phẩm.</p>\n        </div>\n        <div class=\"flex items-center gap-3\">\n          <span id=\"featuredCount\" class=\"text-sm font-semibold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200\">\n            <i class=\"fas fa-star mr-1\"></i>0 mặt hàng nổi bật\n          </span>\n          <button onclick=\"saveFeaturedOrder()\" id=\"saveFeaturedBtn\" class=\"bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition shadow-sm\">\n            <i class=\"fas fa-save\"></i>Lưu thứ tự\n          </button>\n        </div>\n      </div>\n\n      <!-- Featured Preview Strip -->\n      <div id=\"featuredPreviewStrip\" class=\"hidden bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 mb-4\">\n        <p class=\"text-xs font-semibold text-amber-700 uppercase tracking-wider mb-3\"><i class=\"fas fa-eye mr-1\"></i>Xem trước thứ tự hiển thị</p>\n        <div id=\"featuredPreviewItems\" class=\"flex gap-3 overflow-x-auto pb-2\"></div>\n      </div>\n    </div>\n\n    <!-- Products Grid for Featured Management -->\n    <div class=\"bg-white rounded-2xl shadow-sm border overflow-hidden\">\n      <div class=\"border-b px-6 py-4 flex items-center gap-3 bg-gray-50\">\n        <i class=\"fas fa-list text-gray-400\"></i>\n        <span class=\"text-sm font-semibold text-gray-700\">Tất cả sản phẩm – Tích chọn để đánh dấu nổi bật</span>\n        <div class=\"ml-auto flex gap-2\">\n          <input type=\"text\" id=\"featuredSearch\" placeholder=\"Tìm sản phẩm...\" oninput=\"filterFeaturedProducts()\"\n            class=\"border rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:border-amber-400 w-44\">\n        </div>\n      </div>\n      <div id=\"featuredProductsList\" class=\"divide-y max-h-[70vh] overflow-y-auto\">\n        <div class=\"py-12 text-center text-gray-400\"><i class=\"fas fa-spinner fa-spin text-3xl\"></i></div>\n      </div>\n    </div>\n  </div>"
}

export function adminFlashSalePage(): string {
  return "<div id=\"page-flashsale\" class=\"p-6 hidden\">\n    <div class=\"bg-white rounded-2xl shadow-sm border p-6\">\n      <div class=\"flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-5\">\n        <div>\n          <div class=\"flex items-center gap-2 text-sm font-semibold text-pink-600 mb-2\">\n            <i class=\"fas fa-bolt\"></i><span>Marketing</span>\n          </div>\n          <h2 class=\"text-2xl font-extrabold text-gray-900 tracking-tight\">Quản lý Flashsale</h2>\n          <p class=\"text-sm text-gray-500 mt-1\">Tạo và theo dõi chương trình flash sale cho sản phẩm của shop.</p>\n        </div>\n        <button id=\"createFlashSaleBtn\" type=\"button\" onclick=\"openFlashSaleCreateModal()\" class=\"btn-pink text-white px-5 py-3 rounded-xl font-semibold text-sm flex items-center gap-2 shadow-sm\">\n          <i class=\"fas fa-plus\"></i>Tạo flashsale\n        </button>\n      </div>\n\n      <div class=\"flex flex-wrap gap-2 mb-6\">\n        <button class=\"flashsale-filter-btn active px-4 py-2 rounded-xl text-sm font-semibold border border-pink-200 bg-pink-50 text-pink-600\" data-status=\"all\">Tất cả trạng thái</button>\n        <button class=\"flashsale-filter-btn px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 bg-white text-gray-600 hover:border-pink-200 hover:text-pink-600\" data-status=\"active\">Đang diễn ra</button>\n        <button class=\"flashsale-filter-btn px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 bg-white text-gray-600 hover:border-pink-200 hover:text-pink-600\" data-status=\"upcoming\">Sắp tới</button>\n      </div>\n\n      <div id=\"flashsaleAdminShell\" class=\"min-h-[260px] rounded-2xl border border-dashed border-pink-200 bg-pink-50/40 p-6 flex items-center justify-center text-center text-gray-500\">\n        <div>\n          <div class=\"mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm text-pink-500\">\n            <i class=\"fas fa-bolt text-xl\"></i>\n          </div>\n          <p class=\"font-semibold text-gray-800\">Đang tải dữ liệu flashsale...</p>\n          <p class=\"text-sm text-gray-500 mt-1\">Vui lòng chờ trong giây lát.</p>\n        </div>\n      </div>\n    </div>\n  </div>\n\n  <div id=\"createFlashSaleModal\" class=\"modal-overlay hidden fixed inset-0 z-[90] items-center justify-center px-4 py-6\" onclick=\"closeFlashSaleCreateModal(event)\">\n    <div class=\"modal-card w-full max-w-6xl max-h-[92vh] overflow-hidden rounded-3xl bg-white shadow-2xl border border-pink-100 flex flex-col\" onclick=\"event.stopPropagation()\">\n      <div class=\"flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5 bg-gradient-to-r from-pink-50 via-white to-orange-50\">\n        <div>\n          <div class=\"inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-100 text-pink-600 text-xs font-semibold mb-3\">\n            <i class=\"fas fa-bolt\"></i><span>Tạo chiến dịch</span>\n          </div>\n          <h3 id=\"flashSaleModalTitle\" class=\"text-2xl font-extrabold text-gray-900 tracking-tight\">Tạo Flashsale của shop</h3>\n          <p id=\"flashSaleModalSubtitle\" class=\"text-sm text-gray-500 mt-1\">Thiết lập thời gian, chọn sản phẩm và cấu hình giá ưu đãi cho từng item.</p>\n        </div>\n        <button type=\"button\" onclick=\"closeFlashSaleCreateModal()\" class=\"w-10 h-10 rounded-full bg-white border border-gray-200 text-gray-500 hover:text-gray-900 hover:border-pink-200 transition shadow-sm\">\n          <i class=\"fas fa-xmark\"></i>\n        </button>\n      </div>\n      <div class=\"flex-1 overflow-y-auto scrollbar-thin bg-gray-50/60\">\n        <div class=\"space-y-4 p-6\">\n          <div class=\"grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px] items-start\">\n            <section class=\"bg-white rounded-2xl border border-gray-100 shadow-sm p-5\">\n                <div class=\"flex items-center gap-2 mb-4 text-pink-600 font-semibold\">\n                  <i class=\"fas fa-circle-info\"></i><span>Thông tin cơ bản</span>\n                </div>\n                <div class=\"space-y-4\">\n                  <label class=\"space-y-2 block\">\n                    <span class=\"text-sm font-semibold text-gray-700\">Tên flashsale</span>\n                    <input id=\"flashSaleNameInput\" type=\"text\" placeholder=\"Flash sale tháng 4 / Săn deal cuối tuần...\" class=\"w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-pink-300 focus:ring-4 focus:ring-pink-100\">\n                  </label>\n                  <div class=\"grid gap-4 md:grid-cols-[minmax(0,220px)_minmax(0,220px)]\">\n                    <label class=\"space-y-2\">\n                      <span class=\"text-sm font-semibold text-gray-700\">Thời gian bắt đầu</span>\n                      <input id=\"flashSaleStartInput\" type=\"datetime-local\" class=\"w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-pink-300 focus:ring-4 focus:ring-pink-100\">\n                    </label>\n                    <label class=\"space-y-2\">\n                      <span class=\"text-sm font-semibold text-gray-700\">Thời gian kết thúc</span>\n                      <input id=\"flashSaleEndInput\" type=\"datetime-local\" class=\"w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-pink-300 focus:ring-4 focus:ring-pink-100\">\n                    </label>\n                  </div>\n                </div>\n            </section>\n\n            <aside class=\"xl:w-[300px] self-start\">\n              <section class=\"bg-white rounded-2xl border border-gray-100 shadow-sm p-5\">\n                <div class=\"flex items-center gap-2 mb-4 text-pink-600 font-semibold\">\n                  <i class=\"fas fa-bolt\"></i><span>Xem trước</span>\n                </div>\n                <div class=\"rounded-3xl overflow-hidden border border-pink-100 bg-gradient-to-br from-rose-50 via-white to-orange-50 shadow-sm p-5\">\n                  <div class=\"inline-flex items-center gap-2 rounded-full bg-pink-600 px-3 py-1 text-xs font-semibold text-white mb-4\"><i class=\"fas fa-bolt\"></i>Flash Sale</div>\n                  <p class=\"text-xs font-semibold uppercase tracking-[0.2em] text-gray-400 mb-2\">Giá xem trước</p>\n                  <div class=\"flex items-end\">\n                    <span class=\"text-4xl font-extrabold text-rose-500\">119.000đ</span>\n                  </div>\n                  <p class=\"text-sm text-gray-500 mt-3\">Xem nhanh cách mức giá flash sale sẽ hiển thị trong giao diện shop.</p>\n                </div>\n              </section>\n            </aside>\n          </div>\n\n            <section class=\"w-full min-w-0 bg-white rounded-2xl border border-gray-100 shadow-sm p-5\">\n              <div class=\"flex items-center justify-between gap-3 mb-4\">\n                <div>\n                  <div class=\"flex items-center gap-2 text-pink-600 font-semibold mb-1\">\n                    <i class=\"fas fa-box-open\"></i><span>Sản phẩm</span>\n                  </div>\n                  <p class=\"text-sm text-gray-500\">Chọn sản phẩm áp dụng flash sale và cấu hình mức giá ưu đãi cho từng SKU.</p>\n                </div>\n                <button type=\"button\" onclick=\"openFlashSaleProductPickerModal()\" class=\"inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-pink-200 bg-pink-50 text-pink-600 hover:bg-pink-100 transition\">\n                  <i class=\"fas fa-magnifying-glass\"></i>Chọn sản phẩm\n                </button>\n              </div>\n              <div class=\"rounded-2xl border border-dashed border-pink-200 bg-pink-50/40 p-4\">\n                <div class=\"flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4 mb-3\">\n                  <div class=\"space-y-1\">\n                    <p class=\"text-sm font-semibold text-gray-800\">Danh sách sản phẩm đã chọn</p>\n                    <p id=\"flashSaleSelectedItemsHint\" class=\"text-xs text-gray-500\">Chưa có sản phẩm nào được gắn vào flashsale.</p>\n                    <div class=\"flex flex-wrap items-center gap-2 pt-1\">\n                      <span id=\"flashSaleSelectedItemsCount\" class=\"inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-pink-600 border border-pink-200\"><i class=\"fas fa-layer-group\"></i>0 mặt hàng / 0 SKU</span>\n                      <span id=\"flashSaleSelectedCheckedCount\" class=\"inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 border border-emerald-200\"><i class=\"fas fa-check-double\"></i>0/0 đã tick</span>\n                    </div>\n                  </div>\n                  <div class=\"grid gap-2 sm:grid-cols-2 xl:grid-cols-[150px_120px_140px_auto] xl:items-start\">\n                    <label class=\"space-y-1\">\n                      <span class=\"block text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400\">Giá flashsale</span>\n                      <input id=\"flashSaleGlobalSalePriceInput\" type=\"number\" min=\"0\" inputmode=\"numeric\" placeholder=\"Giá chung\" class=\"w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-pink-300 focus:ring-4 focus:ring-pink-100\">\n                    </label>\n                    <label class=\"space-y-1\">\n                      <span class=\"block text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400\">% giảm</span>\n                      <input id=\"flashSaleGlobalDiscountInput\" type=\"number\" min=\"0\" max=\"100\" inputmode=\"numeric\" placeholder=\"% chung\" class=\"w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-pink-300 focus:ring-4 focus:ring-pink-100\">\n                    </label>\n                    <label class=\"space-y-1\">\n                      <span class=\"block text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400\">Giới hạn mua</span>\n                      <input id=\"flashSaleGlobalPurchaseLimitInput\" type=\"number\" min=\"0\" inputmode=\"numeric\" placeholder=\"SL chung\" class=\"w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-pink-300 focus:ring-4 focus:ring-pink-100\">\n                    </label>\n                    <button type=\"button\" onclick=\"flashSaleApplyGroupFieldsToCheckedSkus()\" class=\"inline-flex items-center justify-center gap-2 self-end rounded-xl border border-pink-200 bg-pink-50 px-4 py-2.5 text-sm font-semibold text-pink-600 hover:bg-pink-100 transition\">\n                      <i class=\"fas fa-wand-magic-sparkles\"></i>Set all đã tick\n                    </button>\n                  </div>\n                </div>\n                <div class=\"overflow-hidden rounded-2xl border border-gray-100 bg-white\">\n                  <div class=\"overflow-x-auto\">\n                    <table class=\"min-w-[860px] w-full text-sm\">\n                      <thead class=\"bg-gray-50 text-gray-500\">\n                        <tr>\n                          <th class=\"px-4 py-3 text-left font-semibold\">Sản phẩm</th>\n                          <th class=\"px-3 py-3 text-center font-semibold min-w-[120px]\">Giá gốc</th>\n                          <th class=\"px-3 py-3 text-center font-semibold min-w-[130px]\">Giá flashsale</th>\n                          <th class=\"px-3 py-3 text-center font-semibold min-w-[84px]\">% giảm</th>\n                          <th class=\"px-3 py-3 text-center font-semibold min-w-[104px]\">Giới hạn mua</th>\n                          <th class=\"px-3 py-3 text-center font-semibold min-w-[80px] sticky right-[70px] bg-gray-50 z-20 shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.06)]\">Hành động</th>\n                          <th class=\"px-3 py-3 text-center font-semibold min-w-[70px] sticky right-0 bg-gray-50 z-20 shadow-[-2px_0_6px_-2px_rgba(0,0,0,0.04)]\">Trạng thái</th>\n                        </tr>\n                      </thead>\n                      <tbody id=\"flashSaleSelectedItemsBody\">\n                        <tr>\n                          <td colspan=\"7\" class=\"px-4 py-10 text-center text-gray-500\">\n                            <div class=\"flex flex-col items-center gap-2\">\n                              <div class=\"flex h-12 w-12 items-center justify-center rounded-full bg-pink-50 text-pink-500\">\n                                <i class=\"fas fa-basket-shopping\"></i>\n                              </div>\n                              <p class=\"font-medium\">Chưa có sản phẩm nào được chọn</p>\n                              <p class=\"text-xs text-gray-400\">Hãy chọn sản phẩm để bắt đầu cấu hình flash sale.</p>\n                            </div>\n                          </td>\n                        </tr>\n                      </tbody>\n                    </table>\n                  </div>\n                </div>\n              </div>\n            </section>\n        </div>\n      </div>\n      <div class=\"border-t border-gray-100 bg-white px-6 py-4 flex items-center justify-between gap-3\">\n        <p class=\"text-xs text-gray-500\">Tạo flashsale mới cho sản phẩm theo cấp độ sản phẩm.</p>\n        <div class=\"flex items-center gap-2\">\n          <button type=\"button\" onclick=\"closeFlashSaleCreateModal()\" class=\"px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition\">Đóng</button>\n          <button type=\"button\" id=\"flashSaleSubmitBtn\" onclick=\"submitFlashSaleCreateForm()\" class=\"btn-pink text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 shadow-sm\">\n            <i class=\"fas fa-bolt\"></i><span id=\"flashSaleSubmitText\">Tạo flashsale</span>\n          </button>\n        </div>\n      </div>\n    </div>\n  </div>\n\n  <div id=\"flashSaleProductPickerModal\" class=\"modal-overlay hidden fixed inset-0 z-[95] items-center justify-center px-4 py-6\" onclick=\"closeFlashSaleProductPickerModal(event)\">\n    <div class=\"modal-card w-full max-w-4xl max-h-[88vh] overflow-hidden rounded-3xl bg-white shadow-2xl border border-pink-100 flex flex-col\" onclick=\"event.stopPropagation()\">\n      <div class=\"flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5 bg-gradient-to-r from-pink-50 via-white to-orange-50\">\n        <div>\n          <div class=\"inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-100 text-pink-600 text-xs font-semibold mb-3\">\n            <i class=\"fas fa-bag-shopping\"></i><span>Chọn sản phẩm</span>\n          </div>\n          <h3 class=\"text-2xl font-extrabold text-gray-900 tracking-tight\">Chọn sản phẩm vào Flashsale</h3>\n          <p class=\"text-sm text-gray-500 mt-1\">Tìm nhanh sản phẩm đang có trong kho để gắn vào chiến dịch flashsale.</p>\n        </div>\n        <button type=\"button\" onclick=\"closeFlashSaleProductPickerModal()\" class=\"w-10 h-10 rounded-full bg-white border border-gray-200 text-gray-500 hover:text-gray-900 hover:border-pink-200 transition shadow-sm\">\n          <i class=\"fas fa-xmark\"></i>\n        </button>\n      </div>\n      <div class=\"flex-1 overflow-y-auto scrollbar-thin bg-gray-50/60 px-6 py-5 space-y-4\">\n        <div class=\"flex flex-col md:flex-row md:items-center gap-3 justify-between\">\n          <div class=\"flex-1 relative\">\n            <i class=\"fas fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400\"></i>\n            <input id=\"flashSaleProductPickerSearch\" type=\"text\" placeholder=\"Tìm sản phẩm...\" class=\"w-full rounded-2xl border border-gray-200 bg-white pl-11 pr-4 py-3 text-sm outline-none transition focus:border-pink-300 focus:ring-4 focus:ring-pink-100\" oninput=\"renderFlashSaleProductPicker()\">\n          </div>\n          <div id=\"flashSaleProductPickerCount\" class=\"inline-flex items-center gap-2 rounded-2xl border border-pink-200 bg-white px-4 py-3 text-sm font-semibold text-pink-600 shadow-sm\">\n            <i class=\"fas fa-layer-group\"></i><span>0 mặt hàng</span>\n          </div>\n        </div>\n        <div class=\"rounded-2xl border border-gray-100 bg-white overflow-hidden\">\n          <div id=\"flashSaleProductPickerList\" class=\"divide-y divide-gray-100\"></div>\n        </div>\n      </div>\n      <div class=\"border-t border-gray-100 bg-white px-6 py-4 flex items-center justify-between gap-3\">\n        <p class=\"text-xs text-gray-500\">Chọn sản phẩm trước, sau đó quay lại cấu hình giá bên dưới.</p>\n        <button type=\"button\" onclick=\"closeFlashSaleProductPickerModal()\" class=\"px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition\">Xong</button>\n      </div>\n    </div>\n  </div>"
}

export function adminSettingsPage(): string {
  return "<!-- SETTINGS SOCIAL PAGE -->\n  <div id=\"page-settings-social\" class=\"p-6 hidden\">\n    <div class=\"bg-white rounded-2xl shadow-sm border p-6\">\n      <div class=\"flex items-center justify-between gap-4 mb-6\">\n        <div>\n          <h2 class=\"text-xl font-extrabold text-gray-900 tracking-tight\">Cấu hình MXH</h2>\n          <p class=\"text-sm text-gray-500 mt-1\">Chỉ nhập ID hoặc handle. Link và icon ngoài frontend chỉ hiện sau khi đã lưu cấu hình.</p>\n        </div>\n      </div>\n      <div class=\"grid gap-4 md:grid-cols-2\">\n        <div class=\"rounded-2xl border border-gray-200 bg-gray-50 p-4\">\n          <label class=\"block text-sm font-semibold text-gray-700 mb-1.5\">TikTok handle</label>\n          <input type=\"text\" id=\"socialTiktokHandle\" placeholder=\"qhclothesvn\" oninput=\"previewSocialUrl('tiktok')\" class=\"w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400\">\n          <p class=\"text-xs text-gray-500 mt-2\">Preview: <a id=\"socialTiktokPreview\" href=\"#\" target=\"_blank\" class=\"text-pink-600 hover:underline\">Chưa cấu hình</a></p>\n        </div>\n        <div class=\"rounded-2xl border border-gray-200 bg-gray-50 p-4\">\n          <label class=\"block text-sm font-semibold text-gray-700 mb-1.5\">Shopee handle</label>\n          <input type=\"text\" id=\"socialShopeeHandle\" placeholder=\"qhclothes.vn\" oninput=\"previewSocialUrl('shopee')\" class=\"w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400\">\n          <p class=\"text-xs text-gray-500 mt-2\">Preview: <a id=\"socialShopeePreview\" href=\"#\" target=\"_blank\" class=\"text-pink-600 hover:underline\">Chưa cấu hình</a></p>\n        </div>\n        <div class=\"rounded-2xl border border-gray-200 bg-gray-50 p-4\">\n          <label class=\"block text-sm font-semibold text-gray-700 mb-1.5\">Facebook handle</label>\n          <input type=\"text\" id=\"socialFacebookHandle\" placeholder=\"qhclothes\" oninput=\"previewSocialUrl('facebook')\" class=\"w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400\">\n          <p class=\"text-xs text-gray-500 mt-2\">Preview: <a id=\"socialFacebookPreview\" href=\"#\" target=\"_blank\" class=\"text-pink-600 hover:underline\">Chưa cấu hình</a></p>\n        </div>\n        <div class=\"rounded-2xl border border-gray-200 bg-gray-50 p-4\">\n          <label class=\"block text-sm font-semibold text-gray-700 mb-1.5\">Threads handle</label>\n          <input type=\"text\" id=\"socialThreadsHandle\" placeholder=\"qhclothesvn\" oninput=\"previewSocialUrl('threads')\" class=\"w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400\">\n          <p class=\"text-xs text-gray-500 mt-2\">Preview: <a id=\"socialThreadsPreview\" href=\"#\" target=\"_blank\" class=\"text-pink-600 hover:underline\">Chưa cấu hình</a></p>\n        </div>\n      </div>\n      <div class=\"mt-6 flex justify-end\">\n        <button onclick=\"saveSocialSettings()\" id=\"saveSocialSettingsBtn\" class=\"btn-pink text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2\">\n          <i class=\"fas fa-save\"></i>Lưu cấu hình MXH\n        </button>\n      </div>\n    </div>\n  </div>\n\n  <!-- SETTINGS WAREHOUSE PAGE -->\n  <div id=\"page-settings-warehouse\" class=\"p-6 hidden\">\n    <div class=\"bg-white rounded-2xl shadow-sm border p-6\">\n      <div class=\"flex items-center justify-between gap-4 mb-4\">\n        <div>\n          <h2 class=\"text-xl font-extrabold text-gray-900 tracking-tight\">Cài đặt kho hàng</h2>\n          <p class=\"text-sm text-gray-500 mt-1\">Cấu hình địa chỉ lấy hàng và tài khoản GHTK cho hệ thống.</p>\n        </div>\n      </div>\n      <div id=\"settingsWarehouseContent\" class=\"rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-gray-500\">\n        <div class=\"flex items-center gap-3\">\n          <i class=\"fas fa-warehouse text-2xl text-emerald-500\"></i>\n          <div>\n            <p class=\"font-semibold text-gray-800\">Khu cài đặt kho hàng</p>\n            <p class=\"text-sm text-gray-500\">Phần này đã tồn tại trong hệ thống, chỉ đang được hiển thị tách ra để dễ mở rộng.</p>\n          </div>\n        </div>\n      </div>\n    </div>\n  </div>"
}

export function adminPaymentSettingsPage(): string {
  return `<!-- SETTINGS PAYMENT PAGE -->
  <div id="page-settings-payment" class="p-3 md:p-6 hidden">
    <div class="bg-white rounded-2xl shadow-sm border overflow-hidden">
      <div class="px-5 py-5 md:px-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <p class="text-xs font-bold uppercase tracking-[0.18em] text-pink-500">Setting</p>
          <h2 class="mt-1 text-xl md:text-2xl font-extrabold text-gray-900 tracking-tight">Thanh toán</h2>
          <p class="text-sm text-gray-500 mt-1">Bật/tắt các chức năng thanh toán hiển thị ngoài trang khách hàng.</p>
        </div>
        <span id="paymentSettingsStatus" class="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-500">
          <i class="fas fa-circle-notch fa-spin"></i>Đang tải
        </span>
      </div>
      <div class="p-5 md:p-6">
        <div class="rounded-2xl border border-gray-200 bg-gray-50 p-4 md:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div class="flex items-start gap-3 min-w-0">
            <span class="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-pink-100 text-pink-600">
              <i class="fas fa-wallet"></i>
            </span>
            <div class="min-w-0">
              <h3 class="font-bold text-gray-900">Nạp tiền vào ví</h3>
              <p class="mt-1 text-sm leading-relaxed text-gray-500">Khi tắt, nút nạp tiền sẽ bị ẩn khỏi trang khách hàng và webhook nạp ví sẽ không tự cộng số dư.</p>
            </div>
          </div>
          <label class="inline-flex items-center gap-3 cursor-pointer select-none">
            <span id="walletTopupSwitchLabel" class="text-sm font-semibold text-gray-600">Đang tải</span>
            <input id="walletTopupEnabledSwitch" type="checkbox" class="sr-only peer" onchange="savePaymentSettings()">
            <span class="relative h-8 w-14 rounded-full bg-gray-300 transition peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-pink-500 after:absolute after:left-1 after:top-1 after:h-6 after:w-6 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-6"></span>
          </label>
        </div>
        <div class="mt-4 rounded-2xl border border-gray-200 bg-white p-4 md:p-5">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div class="min-w-0">
              <h3 class="font-bold text-gray-900">Thanh toán chuyển khoản</h3>
              <p class="mt-1 text-sm leading-relaxed text-gray-500">PayOS vẫn là mặc định. VietQR thủ công dùng khi muốn fallback không mất phí provider, admin xác nhận đơn bằng đối soát.</p>
            </div>
            <label class="block w-full lg:w-64">
              <span class="block text-sm font-semibold text-gray-700 mb-1.5">Provider</span>
              <select id="bankTransferProviderSelect" onchange="syncBankTransferProviderSettingsUI()" class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400">
                <option value="PAYOS">PayOS tự xác minh</option>
                <option value="MANUAL_VIETQR">VietQR thủ công</option>
              </select>
            </label>
          </div>
          <div id="manualVietqrSettingsPanel" class="mt-4 grid gap-4 md:grid-cols-2">
            <label class="block">
              <span class="block text-sm font-semibold text-gray-700 mb-1.5">Mã ngân hàng</span>
              <input id="manualVietqrBankId" type="text" placeholder="MB" class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400">
            </label>
            <label class="block">
              <span class="block text-sm font-semibold text-gray-700 mb-1.5">Số tài khoản</span>
              <input id="manualVietqrAccountNo" type="text" placeholder="0200100441441" class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400">
            </label>
            <label class="block">
              <span class="block text-sm font-semibold text-gray-700 mb-1.5">Tên chủ tài khoản</span>
              <input id="manualVietqrAccountName" type="text" placeholder="TRAN CONG HANH" class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400">
            </label>
            <label class="block">
              <span class="block text-sm font-semibold text-gray-700 mb-1.5">Template QR</span>
              <input id="manualVietqrTemplate" type="text" placeholder="compact2" class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400">
            </label>
          </div>
          <div class="mt-4 flex justify-end">
            <button onclick="savePaymentSettings()" id="saveBankTransferSettingsBtn" class="btn-pink text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2">
              <i class="fas fa-save"></i>Lưu thanh toán chuyển khoản
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>`
}

export function adminBackupPage(): string {
  return `<!-- BACKUP PAGE -->
  <div id="page-backup" class="p-3 md:p-6 hidden">
    <div class="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
      <section class="rounded-3xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div class="border-b border-gray-100 px-5 py-5 md:px-6">
          <p class="text-xs font-bold uppercase tracking-[0.18em] text-pink-500">Backup dữ liệu</p>
          <h2 class="mt-1 text-xl md:text-2xl font-extrabold text-gray-900">Export sản phẩm & ảnh</h2>
          <p class="mt-1 text-sm leading-relaxed text-gray-500">Dùng khi chuyển hosting hoặc cần sao lưu. ZIP sẽ chứa manifest, dữ liệu JSON và các ảnh lấy được từ R2/URL.</p>
        </div>
        <div class="p-5 md:p-6 space-y-4">
          <div class="rounded-2xl border border-sky-100 bg-sky-50 p-4 text-sm text-sky-800">
            <div class="flex items-start gap-3">
              <i class="fas fa-circle-info mt-0.5 text-sky-500"></i>
              <p>Backup không chứa token, session, khách hàng hoặc đơn hàng. Reviews chỉ được giữ trong file để tham chiếu, import không tự khôi phục reviews nếu thiếu users/orders.</p>
            </div>
          </div>
          <div class="grid gap-3 sm:grid-cols-2">
            <button type="button" onclick="downloadAdminBackup('zip')" id="backupZipBtn" class="btn-pink inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold text-white">
              <i class="fas fa-file-zipper"></i>Tải ZIP đầy đủ
            </button>
            <button type="button" onclick="downloadAdminBackup('json')" id="backupJsonBtn" class="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50">
              <i class="fas fa-code"></i>Tải JSON
            </button>
          </div>
          <div id="backupExportStatus" class="hidden rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-500"></div>
        </div>
      </section>

      <section class="rounded-3xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div class="border-b border-gray-100 px-5 py-5 md:px-6">
          <p class="text-xs font-bold uppercase tracking-[0.18em] text-pink-500">Restore dữ liệu</p>
          <h2 class="mt-1 text-xl md:text-2xl font-extrabold text-gray-900">Import backup</h2>
          <p class="mt-1 text-sm leading-relaxed text-gray-500">Nên bấm Xem trước trước khi import thật. ZIP có ảnh sẽ upload lại ảnh vào R2 hiện tại rồi tự rewrite link ảnh.</p>
        </div>
        <div class="p-5 md:p-6 space-y-4">
          <label class="block">
            <span class="mb-1.5 block text-sm font-semibold text-gray-700">File backup (.zip hoặc .json)</span>
            <input id="backupImportFile" type="file" accept=".zip,.json,application/json,application/zip" class="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-pink-400">
          </label>
          <label class="flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-900">
            <input id="backupReplaceExisting" type="checkbox" checked class="mt-1 h-4 w-4 rounded border-amber-300 text-pink-500 focus:ring-pink-400">
            <span><strong>Xoá dữ liệu hiện tại trước khi import.</strong> Nên bật khi chuyển sang host mới hoặc muốn restore đúng bản backup.</span>
          </label>
          <div class="grid gap-3 sm:grid-cols-2">
            <button type="button" onclick="previewAdminBackupImport()" id="backupPreviewBtn" class="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50">
              <i class="fas fa-magnifying-glass-chart"></i>Xem trước
            </button>
            <button type="button" onclick="restoreAdminBackupImport()" id="backupRestoreBtn" class="btn-pink inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold text-white">
              <i class="fas fa-upload"></i>Import backup
            </button>
          </div>
          <div id="backupImportPreview" class="hidden rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-600"></div>
          <div id="backupImportStatus" class="hidden rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-500"></div>
        </div>
      </section>
    </div>
  </div>`
}

export function adminTextUiSettingsPage(): string {
  const defaultRiskNote = escapeAdminHtml(DEFAULT_QUICK_ORDER_RISK_NOTE_TEXT)
  const defaults = DEFAULT_TEXT_UI_SETTINGS
  return `<!-- SETTINGS TEXT UI PAGE -->
  <div id="page-settings-text-ui" class="p-3 md:p-6 hidden">
    <div class="mb-5 rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-pink-950 p-5 md:p-6 text-white shadow-sm overflow-hidden relative">
      <div class="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-pink-500/20 blur-3xl"></div>
      <div class="absolute -bottom-20 left-20 h-52 w-52 rounded-full bg-cyan-400/10 blur-3xl"></div>
      <div class="relative flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p class="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-pink-100">
            <i class="fas fa-language"></i>Quản lý nội dung UI
          </p>
          <h2 class="mt-4 text-2xl md:text-3xl font-extrabold tracking-tight">Text UI</h2>
          <p class="mt-2 max-w-2xl text-sm text-slate-300">Cấu hình các đoạn text hiển thị ngoài storefront để không phải sửa code thủ công.</p>
        </div>
        <button id="saveTextUiSettingsBtn" onclick="saveTextUiSettings()" class="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-black/20 hover:bg-pink-50 transition">
          <i class="fas fa-save text-pink-500"></i>Lưu Text UI
        </button>
      </div>
    </div>

    <section class="mb-5 rounded-3xl border border-gray-200 bg-white p-5 md:p-6 shadow-sm">
      <div class="mb-5 flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div>
          <p class="text-xs font-bold uppercase tracking-[0.18em] text-cyan-500">First view storefront</p>
          <h3 class="mt-1 text-xl font-extrabold text-gray-900">Hero đầu trang</h3>
          <p class="mt-1 text-sm text-gray-500">Cấu hình phần chữ đầu tiên khách nhìn thấy trên trang chủ.</p>
        </div>
        <span class="hidden sm:inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-500">
          <i class="fas fa-display"></i>
        </span>
      </div>
      <div class="grid gap-4 xl:grid-cols-2">
        <label class="block">
          <span class="block text-sm font-semibold text-gray-700 mb-1.5">Dòng badge nhỏ</span>
          <input id="heroBadgeText" data-setting-key="hero_badge_text" data-default-text="${escapeAdminHtml(defaults.hero_badge_text)}" type="text" maxlength="220" oninput="previewTextUiSettings()" class="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-100">
        </label>
        <label class="block">
          <span class="block text-sm font-semibold text-gray-700 mb-1.5">Tiêu đề chính</span>
          <input id="heroTitleText" data-setting-key="hero_title_text" data-default-text="${escapeAdminHtml(defaults.hero_title_text)}" type="text" maxlength="220" oninput="previewTextUiSettings()" class="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-100">
        </label>
        <label class="block xl:col-span-2">
          <span class="block text-sm font-semibold text-gray-700 mb-1.5">Text auto typing</span>
          <input id="heroTypedTextSetting" data-setting-key="hero_typed_text" data-default-text="${escapeAdminHtml(defaults.hero_typed_text)}" type="text" maxlength="220" oninput="previewTextUiSettings()" class="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-100">
          <p class="mt-1.5 text-xs text-gray-400">Nhập nhiều câu bằng dấu |, ví dụ: Cho Cả Nam Nữ|Phong Cách Boypho</p>
        </label>
        <label class="block xl:col-span-2">
          <span class="block text-sm font-semibold text-gray-700 mb-1.5">Mô tả desktop</span>
          <textarea id="heroDescriptionText" data-setting-key="hero_description_text" data-default-text="${escapeAdminHtml(defaults.hero_description_text)}" maxlength="800" rows="3" oninput="previewTextUiSettings()" class="w-full resize-y rounded-2xl border border-gray-200 px-4 py-3 text-sm leading-relaxed outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-100"></textarea>
        </label>
        <label class="block xl:col-span-2">
          <span class="block text-sm font-semibold text-gray-700 mb-1.5">Mô tả mobile</span>
          <textarea id="heroMobileSubtitleText" data-setting-key="hero_mobile_subtitle_text" data-default-text="${escapeAdminHtml(defaults.hero_mobile_subtitle_text)}" maxlength="220" rows="2" oninput="previewTextUiSettings()" class="w-full resize-y rounded-2xl border border-gray-200 px-4 py-3 text-sm leading-relaxed outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-100"></textarea>
        </label>
      </div>
      <div class="mt-5 grid gap-3 md:grid-cols-3">
        <div class="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <p class="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-gray-400">Chỉ số 1</p>
          <input id="heroStat1Value" data-setting-key="hero_stat_1_value" data-default-text="${escapeAdminHtml(defaults.hero_stat_1_value)}" type="text" maxlength="80" oninput="previewTextUiSettings()" class="mb-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-bold outline-none focus:border-pink-400">
          <input id="heroStat1Label" data-setting-key="hero_stat_1_label" data-default-text="${escapeAdminHtml(defaults.hero_stat_1_label)}" type="text" maxlength="80" oninput="previewTextUiSettings()" class="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-pink-400">
        </div>
        <div class="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <p class="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-gray-400">Chỉ số 2</p>
          <input id="heroStat2Value" data-setting-key="hero_stat_2_value" data-default-text="${escapeAdminHtml(defaults.hero_stat_2_value)}" type="text" maxlength="80" oninput="previewTextUiSettings()" class="mb-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-bold outline-none focus:border-pink-400">
          <input id="heroStat2Label" data-setting-key="hero_stat_2_label" data-default-text="${escapeAdminHtml(defaults.hero_stat_2_label)}" type="text" maxlength="80" oninput="previewTextUiSettings()" class="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-pink-400">
        </div>
        <div class="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <p class="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-gray-400">Chỉ số 3</p>
          <input id="heroStat3Value" data-setting-key="hero_stat_3_value" data-default-text="${escapeAdminHtml(defaults.hero_stat_3_value)}" type="text" maxlength="80" oninput="previewTextUiSettings()" class="mb-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-bold outline-none focus:border-pink-400">
          <input id="heroStat3Label" data-setting-key="hero_stat_3_label" data-default-text="${escapeAdminHtml(defaults.hero_stat_3_label)}" type="text" maxlength="80" oninput="previewTextUiSettings()" class="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-pink-400">
        </div>
      </div>
    </section>

    <section class="mb-5 rounded-3xl border border-gray-200 bg-white p-5 md:p-6 shadow-sm">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div class="min-w-0">
          <p class="text-xs font-bold uppercase tracking-[0.18em] text-emerald-500">Badge sản phẩm</p>
          <h3 class="mt-1 text-xl font-extrabold text-gray-900">Hiển thị freeship</h3>
          <p class="mt-1 text-sm text-gray-500">Bật/tắt badge Freeship trên card sản phẩm, mẫu bán chạy và hero.</p>
        </div>
        <label class="inline-flex w-full items-center justify-between gap-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 md:w-auto">
          <span class="inline-flex items-center gap-2 text-sm font-bold text-emerald-700">
            <i class="fas fa-truck-fast"></i>Freeship
          </span>
          <input id="productFreeshipBadgeEnabled" data-setting-key="product_freeship_badge_enabled" type="checkbox" checked class="h-5 w-5 rounded border-emerald-200 text-pink-500 focus:ring-pink-300">
        </label>
      </div>
    </section>

    <div class="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
      <section class="rounded-3xl border border-gray-200 bg-white p-5 md:p-6 shadow-sm">
        <div class="flex items-start justify-between gap-3 mb-5">
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.18em] text-pink-500">Modal đặt hàng nhanh</p>
            <h3 class="mt-1 text-xl font-extrabold text-gray-900">Cảnh báo trước khi đặt</h3>
            <p class="mt-1 text-sm text-gray-500">Đoạn này hiển thị dưới tổng tiền trong modal đặt hàng nhanh.</p>
          </div>
          <span class="hidden sm:inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-500">
            <i class="fas fa-triangle-exclamation"></i>
          </span>
        </div>

        <label class="block">
          <span class="block text-sm font-semibold text-gray-700 mb-1.5">Nội dung cảnh báo</span>
          <textarea id="quickOrderRiskNoteText" data-default-text="${defaultRiskNote}" maxlength="800" rows="7" oninput="previewTextUiSettings()" class="w-full resize-y rounded-2xl border border-gray-200 px-4 py-3 text-sm leading-relaxed outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-100"></textarea>
        </label>
        <div class="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p id="quickOrderRiskNoteCounter" class="text-xs font-semibold text-gray-400">0/800</p>
          <button type="button" onclick="resetQuickOrderRiskNoteDefault()" class="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
            <i class="fas fa-rotate-left"></i>Khôi phục mặc định
          </button>
        </div>
      </section>

      <section class="rounded-3xl border border-gray-200 bg-white p-5 md:p-6 shadow-sm">
        <div class="mb-5">
          <p class="text-xs font-bold uppercase tracking-[0.18em] text-amber-500">Preview</p>
          <h3 class="mt-1 text-xl font-extrabold text-gray-900">Hiển thị trên modal</h3>
          <p class="mt-1 text-sm text-gray-500">Preview dùng cùng cấu trúc cảnh báo ngoài storefront.</p>
        </div>
        <div class="rounded-3xl border border-slate-200 bg-slate-950 p-4">
          <div class="order-risk-note flex items-start gap-3 rounded-2xl border border-amber-300/25 bg-amber-300/10 p-3.5 text-amber-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
            <div class="order-risk-note-icon inline-flex h-8 w-8 flex-none items-center justify-center rounded-full bg-amber-300/15 text-amber-300" aria-hidden="true">
              <i class="fas fa-triangle-exclamation"></i>
            </div>
            <div class="min-w-0">
              <div class="order-risk-note-title text-sm font-extrabold leading-tight text-amber-100"><strong>Chú ý !</strong></div>
              <div id="quickOrderRiskNotePreview" class="order-risk-note-text mt-1 text-[13px] leading-relaxed text-amber-100/80"></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>`
}

export function adminImageSettingsPage(): string {
  return `<!-- SETTINGS IMAGES PAGE -->
  <div id="page-settings-images" class="p-3 md:p-6 hidden">
    <div class="mb-5 rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-pink-950 p-5 md:p-6 text-white shadow-sm overflow-hidden relative">
      <div class="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-pink-500/20 blur-3xl"></div>
      <div class="absolute -bottom-20 left-20 h-52 w-52 rounded-full bg-cyan-400/10 blur-3xl"></div>
      <div class="relative flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p class="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-pink-100">
            <i class="fas fa-image"></i>Quản lý media storefront
          </p>
          <h2 class="mt-4 text-2xl md:text-3xl font-extrabold tracking-tight">Cài đặt ảnh</h2>
          <p class="mt-2 max-w-2xl text-sm text-slate-300">Ưu tiên ảnh cấu hình trước dữ liệu sản phẩm. Sau này có thể thêm banner quảng cáo, banner mobile và ảnh theo từng vị trí tại đây.</p>
        </div>
        <button id="saveImageSettingsBtn" onclick="saveImageSettings()" class="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-black/20 hover:bg-pink-50 transition">
          <i class="fas fa-save text-pink-500"></i>Lưu cài đặt ảnh
        </button>
      </div>
    </div>

    <div class="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
      <section class="rounded-3xl border border-gray-200 bg-white p-5 md:p-6 shadow-sm">
        <div class="flex items-start justify-between gap-3 mb-5">
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.18em] text-pink-500">Trang chủ</p>
            <h3 class="mt-1 text-xl font-extrabold text-gray-900">Hero / Sản phẩm thịnh hành</h3>
            <p class="mt-1 text-sm text-gray-500">Nếu ảnh này được cấu hình, frontend sẽ dùng ảnh này trước. Nếu để trống, hệ thống fallback về sản phẩm đã tick “Thịnh hành”.</p>
          </div>
          <span class="hidden sm:inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-pink-50 text-pink-500">
            <i class="fas fa-fire"></i>
          </span>
        </div>

        <div class="grid gap-5 lg:grid-cols-[280px_1fr]">
          <label for="homeTrendingBannerImageFile" class="group relative block aspect-[4/5] overflow-hidden rounded-3xl border-2 border-dashed border-gray-200 bg-gray-50 cursor-pointer hover:border-pink-300 hover:bg-pink-50/40 transition">
            <img id="homeTrendingBannerImagePreview" src="" alt="" class="hidden h-full w-full object-cover">
            <div id="homeTrendingBannerImagePlaceholder" class="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-gray-400">
              <span class="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-pink-500 shadow-sm group-hover:scale-105 transition"><i class="fas fa-cloud-arrow-up text-xl"></i></span>
              <span class="text-sm font-bold text-gray-700">Upload ảnh hero</span>
              <span class="text-xs leading-relaxed">Khuyến nghị ảnh dọc hoặc vuông, tối thiểu 900px. File sẽ lưu qua R2.</span>
            </div>
            <input id="homeTrendingBannerImageFile" type="file" accept="image/*" class="hidden" onchange="uploadHomeTrendingBannerImage(this)">
          </label>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1.5">URL ảnh đang dùng</label>
              <input id="homeTrendingBannerImageUrl" type="text" placeholder="/media/settings/..." oninput="previewImageSetting('homeTrendingBannerImage')" class="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-100">
              <p class="mt-2 text-xs text-gray-500">Có thể upload ảnh hoặc dán URL ảnh thủ công. Xóa trống để quay lại dùng sản phẩm thịnh hành.</p>
            </div>
            <div class="grid gap-3 md:grid-cols-2">
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1.5">Caption nhỏ</label>
                <input id="homeTrendingBannerSubtitle" type="text" maxlength="120" placeholder="QH Boypho · Đang thịnh hành" class="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-100">
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1.5">Tiêu đề chính</label>
                <input id="homeTrendingBannerTitle" type="text" maxlength="160" placeholder="Bộ sưu tập thịnh hành" class="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-100">
              </div>
            </div>
            <div class="flex flex-wrap gap-2">
              <button type="button" onclick="document.getElementById('homeTrendingBannerImageFile').click()" class="inline-flex items-center gap-2 rounded-xl bg-pink-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-pink-700 transition">
                <i class="fas fa-upload"></i>Chọn ảnh
              </button>
              <button type="button" onclick="clearHomeTrendingBannerImage()" class="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
                <i class="fas fa-trash"></i>Xóa ảnh
              </button>
            </div>
            <div class="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800">
              <p class="font-bold"><i class="fas fa-layer-group mr-1"></i>Thứ tự ưu tiên</p>
              <p class="mt-1">Ảnh cài đặt này → sản phẩm tick thịnh hành → fallback rỗng gọn, không hiện card “chưa có sản phẩm” xấu.</p>
            </div>
          </div>
        </div>
      </section>

      <section class="rounded-3xl border border-dashed border-gray-200 bg-white p-5 md:p-6 shadow-sm">
        <div class="flex items-center gap-3 mb-4">
          <span class="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600"><i class="fas fa-plus"></i></span>
          <div>
            <h3 class="font-extrabold text-gray-900">Vị trí ảnh sắp mở rộng</h3>
            <p class="text-sm text-gray-500">UI đã chừa chỗ để thêm các banner khác.</p>
          </div>
        </div>
        <div class="grid gap-3">
          <div class="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-500">
            <p class="font-semibold text-gray-800">Banner quảng cáo giữa trang</p>
            <p class="mt-1">Có thể thêm field sau mà không đổi cấu trúc trang.</p>
          </div>
          <div class="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-500">
            <p class="font-semibold text-gray-800">Banner mobile riêng</p>
            <p class="mt-1">Dùng ảnh nhẹ hơn cho màn hình nhỏ.</p>
          </div>
          <div class="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-500">
            <p class="font-semibold text-gray-800">Ảnh theo category</p>
            <p class="mt-1">Nam, nữ, unisex hoặc các landing page riêng.</p>
          </div>
        </div>
      </section>
    </div>
  </div>`
}

export function adminNotificationSettingsPage(): string {
  return `<!-- SETTINGS NOTIFICATIONS PAGE -->
  <div id="page-settings-notifications" class="p-3 md:p-5 hidden">
    <style>
      #page-settings-notifications .notification-hero { background: radial-gradient(circle at 88% 12%, rgba(236,72,153,.38), transparent 32%), radial-gradient(circle at 14% 100%, rgba(59,130,246,.18), transparent 34%), linear-gradient(135deg,#101827 0%,#172033 48%,#9f1239 100%); }
      #page-settings-notifications .notification-card { box-shadow: 0 18px 44px -24px rgba(15,23,42,.28); }
      #page-settings-notifications .storefront-marquee-bar { height: 34px; background: rgba(2,8,18,0.98); border-bottom: 1px solid rgba(6,182,212,0.16); overflow: hidden; }
      #page-settings-notifications .storefront-marquee-bar.storefront-marquee-bar--static { height: auto; min-height: 34px; overflow: visible; }
      #page-settings-notifications .storefront-marquee-track { display: flex; align-items: center; width: max-content; height: 100%; animation: storefrontMarqueePreview var(--storefront-marquee-duration, 48s) linear infinite; animation-delay: 0s; will-change: transform; transform: translateX(0); backface-visibility: visible; }
      #page-settings-notifications .storefront-marquee-seq { display: flex; align-items: center; flex: none; }
      #page-settings-notifications .storefront-marquee-bar:hover .storefront-marquee-track { animation-play-state: paused !important; }
      #page-settings-notifications .storefront-marquee-group { display: inline-flex; align-items: center; flex: 0 0 auto; gap: 0.5rem; padding: 0 1rem; white-space: nowrap; }
      #page-settings-notifications .storefront-marquee-icon { flex: 0 0 auto; color: rgba(255,255,255,0.92); font-size: 12px; line-height: 1; }
      #page-settings-notifications .storefront-marquee-text { flex: 0 0 auto; color: rgba(203,213,225,0.9); font-size: 13px; font-weight: 600; line-height: 1; white-space: nowrap; letter-spacing: 0; }
      #page-settings-notifications .storefront-marquee-separator { width: 1px; height: 14px; margin-left: 1rem; background: rgba(148,163,184,0.24); }
      #page-settings-notifications .storefront-static-notice { display: flex; align-items: center; justify-content: center; gap: .45rem; min-height: 100%; padding: .3rem 1rem; color: rgba(255,255,255,.92); font-size: 14px; font-weight: 700; line-height: 1.35; overflow: visible; text-align: center; }
      #page-settings-notifications .storefront-static-notice i { flex: 0 0 auto; color: #facc15; font-size: 14px; }
      #page-settings-notifications .storefront-static-notice span { min-width: 0; overflow: visible; text-overflow: clip; white-space: normal; overflow-wrap: anywhere; }
      #page-settings-notifications .notification-switch-input:checked + .notification-switch-track { background: linear-gradient(135deg,#2563eb,#ec4899); }
      #page-settings-notifications .notification-switch-input:checked + .notification-switch-track .notification-switch-thumb { transform: translateX(1.45rem); }
      #page-settings-notifications .notification-segment-btn.is-active { background: linear-gradient(135deg,#111827,#be185d); color: #fff; border-color: transparent; box-shadow: 0 14px 28px -18px rgba(190,24,93,.7); }
      #page-settings-notifications input[type="range"] { accent-color: #ec4899; }
      @keyframes storefrontMarqueePreview { from { transform: translateX(0); } to { transform: translateX(-50%); } }
    </style>
    <div class="notification-hero mb-5 rounded-3xl border border-slate-200 p-5 md:p-6 text-white shadow-sm overflow-hidden relative">
      <div class="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
        <div>
          <p class="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-pink-100">
            <i class="fas fa-bullhorn"></i>Setting / Thông báo
          </p>
          <h2 class="mt-4 text-2xl md:text-3xl font-extrabold tracking-tight">Quản lý thông báo chạy trên storefront</h2>
          <p class="mt-2 max-w-4xl text-sm leading-relaxed text-slate-200">Tuỳ chỉnh thông báo đầu trang, chọn chạy marquee hoặc hiển thị tĩnh và xem preview trực tiếp trước khi lưu.</p>
        </div>
        <button id="saveNotificationSettingsBtn" onclick="saveNotificationSettings()" class="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-rose-700 shadow-lg shadow-black/20 hover:bg-pink-50 transition">
          <i class="fas fa-save text-pink-500"></i>Lưu thông báo
        </button>
      </div>
    </div>

    <div class="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
      <div class="min-w-0 space-y-5">
        <section class="notification-card min-w-0 overflow-hidden rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
          <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 class="text-lg font-extrabold text-gray-900">Chọn storefront</h3>
              <p class="mt-1 text-sm font-medium text-slate-500">Mỗi trang dùng một bộ thông báo riêng, không ghi đè lẫn nhau.</p>
            </div>
            <div class="inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
              <button id="notificationSegmentIndexBtn" type="button" onclick="switchNotificationSegment('index')" class="notification-segment-btn is-active rounded-xl border border-transparent px-4 py-2 text-sm font-extrabold text-slate-700 transition">QH Boypho</button>
              <button id="notificationSegmentHottrendnuBtn" type="button" onclick="switchNotificationSegment('hottrendnu')" class="notification-segment-btn rounded-xl border border-transparent px-4 py-2 text-sm font-extrabold text-slate-700 transition">QH Clothes</button>
            </div>
          </div>
        </section>

        <section class="notification-card min-w-0 overflow-hidden rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <div class="mb-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 class="text-lg font-extrabold text-gray-900">Kiểu hiển thị</h3>
                <p id="notificationModeHelp" class="mt-1 text-sm font-medium text-slate-500">Bật để chạy loop tự động, tắt để hiển thị một dòng tĩnh.</p>
              </div>
              <label class="inline-flex cursor-pointer select-none items-center gap-3 rounded-2xl border border-pink-100 bg-white px-4 py-3 text-sm font-extrabold text-slate-800 shadow-sm">
                <input id="notificationLoopSwitch" type="checkbox" checked onchange="toggleNotificationDisplayMode()" class="notification-switch-input sr-only">
                <span class="notification-switch-track relative inline-flex h-7 w-14 shrink-0 rounded-full bg-slate-300 p-1 transition">
                  <span class="notification-switch-thumb h-5 w-5 rounded-full bg-white shadow transition"></span>
                </span>
                <span id="notificationLoopSwitchLabel">Chạy loop</span>
              </label>
            </div>
          </div>

          <div id="marqueeContentPanel">
          <div class="mb-4 flex items-start justify-between gap-4">
            <div class="min-w-0 flex items-start gap-4">
              <span class="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-pink-50 text-pink-600">
                <i class="fas fa-a text-lg"></i>
              </span>
              <div class="min-w-0">
                <h3 class="text-xl font-extrabold text-gray-900">Nội dung chạy loop</h3>
                <p class="mt-1 text-sm text-gray-500">Thêm nhiều đoạn ngắn, storefront sẽ tự ngăn cách bằng vạch như thanh tham khảo.</p>
              </div>
            </div>
            <span id="marqueeTextCounter" class="inline-flex shrink-0 items-center rounded-full bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-500">0/600</span>
          </div>
          <textarea id="marqueeNotificationText" maxlength="600" class="hidden" aria-hidden="true"></textarea>
          <div id="marqueeSegmentsList" class="space-y-3"></div>
          <button type="button" onclick="addMarqueeSegment()" class="mt-3 inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-2.5 text-sm font-extrabold text-cyan-700 transition hover:bg-cyan-100">
            <i class="fas fa-plus"></i>Thêm đoạn
          </button>
          <div class="mt-4 flex flex-wrap gap-2">
            <button type="button" onclick="setNotificationQuickText('Miễn phí vận chuyển cho đơn từ 500K | Flashsale mỗi tối 20:00 | Hỗ trợ đổi size trong 7 ngày')" class="rounded-full border border-orange-100 bg-orange-50 px-3 py-2 text-xs font-bold text-orange-700 hover:bg-orange-100 transition">Ưu đãi</button>
            <button type="button" onclick="setNotificationQuickText('Flashsale mỗi tối 20:00 | Số lượng có hạn | Chốt đơn sớm để giữ size đẹp')" class="rounded-full border border-orange-100 bg-orange-50 px-3 py-2 text-xs font-bold text-orange-700 hover:bg-orange-100 transition">Flashsale</button>
            <button type="button" onclick="setNotificationQuickText('Hỗ trợ đổi size trong 7 ngày nếu sản phẩm còn nguyên tem mác')" class="rounded-full border border-orange-100 bg-orange-50 px-3 py-2 text-xs font-bold text-orange-700 hover:bg-orange-100 transition">Đổi trả</button>
            <button type="button" onclick="setNotificationQuickText('Freeship cho đơn từ 500K | Giao hàng toàn quốc')" class="rounded-full border border-orange-100 bg-orange-50 px-3 py-2 text-xs font-bold text-orange-700 hover:bg-orange-100 transition">Freeship</button>
            <button type="button" onclick="clearNotificationText()" class="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 transition">Xoá nội dung</button>
          </div>
          </div>

          <div id="staticNotificationPanel" class="mt-6 hidden rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
            <div class="mb-3 flex items-center justify-between gap-3">
              <label for="staticNotificationText" class="text-sm font-extrabold text-blue-900">Nội dung tĩnh</label>
              <span id="staticNotificationTextCounter" class="inline-flex shrink-0 items-center rounded-full bg-white px-3 py-1 text-xs font-bold text-blue-600">0/600</span>
            </div>
            <textarea id="staticNotificationText" rows="3" maxlength="600" oninput="previewNotificationSettings()" placeholder="Nhập nội dung hiển thị tĩnh khi không muốn chạy marquee..." class="block w-full max-w-full resize-y rounded-2xl border border-blue-200 bg-white px-4 py-3 text-sm font-medium leading-relaxed text-slate-900 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"></textarea>
            <p class="mt-2 text-xs font-semibold text-blue-700">Khi chọn hiển thị tĩnh, storefront sẽ dùng nội dung này. Nếu để trống sẽ tự dùng nội dung marquee.</p>
          </div>
        </section>

        <section class="notification-card min-w-0 overflow-hidden rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <div class="mb-5 flex items-center justify-between gap-3">
            <div>
              <h3 class="text-lg font-extrabold text-gray-900">Tốc độ chạy</h3>
            </div>
            <div class="relative w-40">
              <input id="marqueeSpeedSeconds" type="number" min="8" max="120" step="1" value="48" oninput="previewNotificationSettings()" class="w-full rounded-2xl border border-gray-200 px-4 py-2.5 pr-12 text-sm font-bold outline-none focus:border-pink-300 focus:ring-4 focus:ring-pink-100">
              <span class="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">giây</span>
            </div>
          </div>
          <div class="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <input id="marqueeSpeedRange" type="range" min="8" max="120" step="1" value="48" oninput="syncMarqueeSpeedFromRange()" class="w-full">
            <div class="mt-2 flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Nhanh 8s</span>
              <span id="marqueeSpeedLabel" class="rounded-full bg-blue-50 px-3 py-1 text-blue-700">48 giây / vòng</span>
              <span>Chậm 120s</span>
            </div>
          </div>
          <p class="mt-4 text-sm font-medium text-slate-500">Khuyến nghị 40-60 giây để người dùng đọc kịp mà vẫn có cảm giác chuyển động.</p>
        </section>
      </div>

      <div class="min-w-0 space-y-5">
        <section class="notification-card min-w-0 overflow-hidden rounded-3xl border border-slate-900 bg-slate-950 p-4 text-white shadow-sm">
          <h3 class="text-lg font-extrabold">Preview storefront</h3>
          <p class="mt-1 text-sm text-slate-400">Mô phỏng thanh thông báo ở đầu trang.</p>
          <div class="mt-4 min-w-0 overflow-hidden rounded-2xl border border-slate-700 bg-slate-950">
            <div class="h-8 bg-slate-900 px-4 flex items-center gap-2">
              <span class="h-2.5 w-2.5 rounded-full bg-red-500"></span>
              <span class="h-2.5 w-2.5 rounded-full bg-amber-500"></span>
              <span class="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
            </div>
            <div class="storefront-marquee-bar">
              <div id="adminMarqueePreviewTrack" class="storefront-marquee-track" style="--storefront-marquee-duration:48s">
                <div class="storefront-marquee-group">
                  <i class="fas fa-bullhorn storefront-marquee-icon" aria-hidden="true"></i>
                  <span id="adminMarqueePreviewText" class="storefront-marquee-text">Đang tải thông báo...</span>
                </div>
              </div>
            </div>
            <div class="bg-gradient-to-br from-indigo-950 to-pink-900 p-5">
              <p id="notificationPreviewStoreName" class="text-2xl font-extrabold">QH Boypho</p>
              <p id="notificationPreviewCaption" class="mt-2 text-sm font-medium text-pink-100">Thông báo chạy ngay khi trang được load.</p>
            </div>
          </div>
        </section>

        <section class="notification-card min-w-0 overflow-hidden rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 class="text-lg font-extrabold text-gray-900">Kiểm tra trước khi lưu</h3>
          <div class="mt-5 space-y-4">
            <div class="flex items-center gap-3 text-sm font-bold text-slate-700"><span class="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>Độ dài phù hợp</div>
            <div class="flex items-center gap-3 text-sm font-bold text-slate-700"><span class="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>Không có mã HTML</div>
            <div class="flex items-center gap-3 text-sm font-bold text-slate-700"><span class="h-2.5 w-2.5 rounded-full bg-blue-500"></span>Tốc độ trong khoảng an toàn</div>
          </div>
        </section>
      </div>
    </div>

    <div class="mt-5 grid min-w-0 gap-4 xl:grid-cols-3">
      <div class="min-w-0 rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
        <span class="inline-flex rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">Ưu tiên rõ nội dung</span>
        <p class="mt-3 text-sm font-medium leading-relaxed text-slate-600">Một dòng thông báo nên tập trung vào ưu đãi hoặc chính sách quan trọng nhất.</p>
      </div>
      <div class="min-w-0 rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
        <span class="inline-flex rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">Không delay loading</span>
        <p class="mt-3 text-sm font-medium leading-relaxed text-slate-600">Marquee chạy ngay khi trang mở, dữ liệu từ admin cập nhật lại sau khi API trả về.</p>
      </div>
      <div class="min-w-0 rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
        <span class="inline-flex rounded-full bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-700">Có fallback an toàn</span>
        <p class="mt-3 text-sm font-medium leading-relaxed text-slate-600">Nếu nội dung trống, hệ thống dùng thông báo mặc định để tránh thanh trống.</p>
      </div>
    </div>
  </div>`
}

export function adminBannersPage(): string {
  return "<!-- BANNERS PAGE -->\n  <div id=\"page-settings\" class=\"p-6 hidden\">\n    <div class=\"bg-white rounded-2xl shadow-sm border p-4 mb-4\">\n      <div class=\"flex items-center gap-2\">\n        <button type=\"button\" class=\"inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200\">\n          <i class=\"fas fa-warehouse\"></i>Cài đặt kho hàng\n        </button>\n      </div>\n    </div>\n\n    <div class=\"bg-white rounded-2xl shadow-sm border p-6 mb-6\">\n      <div class=\"flex flex-wrap items-center justify-between gap-3 mb-5\">\n        <h2 class=\"font-bold text-gray-800 text-lg flex items-center gap-2\">\n          <i class=\"fas fa-warehouse text-emerald-500\"></i>Cài đặt kho lấy hàng GHTK\n        </h2>\n        <button onclick=\"syncGhtkPickupAddresses()\" id=\"syncGhtkPickupBtn\" class=\"bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2\">\n          <i class=\"fas fa-rotate\"></i> Đồng bộ kho từ GHTK\n        </button>\n      </div>\n      <p class=\"text-sm text-gray-500 mb-4\">Chọn kho đã tạo trên GHTK để dùng mặc định khi bấm Sắp xếp vận chuyển.</p>\n      <div class=\"grid md:grid-cols-2 gap-4\">\n        <div class=\"md:col-span-2\">\n          <label class=\"block text-sm font-semibold text-gray-700 mb-1.5\">Kho lấy hàng từ GHTK</label>\n          <select id=\"ghtkPickupAddressId\" onchange=\"applySelectedGhtkWarehouse()\" class=\"w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-400\">\n            <option value=\"\">-- Chọn kho đồng bộ --</option>\n          </select>\n          <p id=\"ghtkPickupHint\" class=\"text-xs text-gray-500 mt-1.5\">Nếu chưa thấy kho, bấm \"Đồng bộ kho từ GHTK\".</p>\n        </div>\n        <div>\n          <label class=\"block text-sm font-semibold text-gray-700 mb-1.5\">Tên người lấy hàng</label>\n          <input type=\"text\" id=\"ghtkPickName\" class=\"w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-400\">\n        </div>\n        <div>\n          <label class=\"block text-sm font-semibold text-gray-700 mb-1.5\">Số điện thoại lấy hàng</label>\n          <input type=\"text\" id=\"ghtkPickTel\" class=\"w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-400\">\n        </div>\n        <div class=\"md:col-span-2\">\n          <label class=\"block text-sm font-semibold text-gray-700 mb-1.5\">Địa chỉ lấy hàng (chi tiết)</label>\n          <input type=\"text\" id=\"ghtkPickAddress\" class=\"w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-400\">\n        </div>\n        <div>\n          <label class=\"block text-sm font-semibold text-gray-700 mb-1.5\">Tỉnh/Thành</label>\n          <input type=\"text\" id=\"ghtkPickProvince\" class=\"w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-400\">\n        </div>\n        <div>\n          <label class=\"block text-sm font-semibold text-gray-700 mb-1.5\">Quận/Huyện</label>\n          <input type=\"text\" id=\"ghtkPickDistrict\" class=\"w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-400\">\n        </div>\n        <div>\n          <label class=\"block text-sm font-semibold text-gray-700 mb-1.5\">Phường/Xã</label>\n          <input type=\"text\" id=\"ghtkPickWard\" class=\"w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-400\">\n        </div>\n        <div class=\"md:col-span-2 flex justify-end\">\n          <button onclick=\"saveGhtkPickupConfig()\" id=\"saveGhtkPickupBtn\" class=\"bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition\">\n            <i class=\"fas fa-save\"></i>Lưu cấu hình kho GHTK\n          </button>\n        </div>\n      </div>\n    </div>\n  </div>\n\n</main>"
}

export function adminReturnsPage(): string {
  return `<!-- RETURNS PAGE -->
  <div id="page-returns" class="p-3 md:p-6 hidden">
    <!-- Tabs -->
    <div class="flex gap-2 mb-6 border-b border-gray-200">
      <button id="returnsTabReturned" onclick="switchReturnsTab('returned')" class="returns-tab active px-6 py-3 text-sm font-semibold text-pink-600 border-b-2 border-pink-600 transition">
        <i class="fas fa-box-open mr-2"></i>Đơn hoàn
      </button>
      <button id="returnsTabCancelled" onclick="switchReturnsTab('cancelled')" class="returns-tab px-6 py-3 text-sm font-semibold text-gray-500 border-b-2 border-transparent hover:text-pink-600 transition">
        <i class="fas fa-ban mr-2"></i>Đơn huỷ
      </button>
      <button id="returnsTabDeliveryFailed" onclick="switchReturnsTab('delivery_failed')" class="returns-tab px-6 py-3 text-sm font-semibold text-gray-500 border-b-2 border-transparent hover:text-pink-600 transition">
        <i class="fas fa-truck-ramp-box mr-2"></i>Giao không thành công
      </button>
    </div>

    <!-- Filters & Actions -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
      <div class="flex gap-2 flex-wrap items-center">
        <input type="text" id="returnsSearch" placeholder="Tìm tên/SĐT/mã đơn..." oninput="filterReturns()" 
          class="border rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-pink-400 w-64">
        <button onclick="syncReturnsFromGHTK()" id="syncReturnsBtn" class="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition">
          <i class="fas fa-sync-alt"></i>Đồng bộ từ GHTK
        </button>
      </div>
      <div class="flex items-center gap-2">
        <span id="returnsCount" class="text-sm text-gray-600 font-medium">0 đơn</span>
      </div>
    </div>

    <!-- Returned Orders Table -->
    <div id="returnsTableReturned" class="bg-white rounded-2xl shadow-sm border overflow-hidden">
      <div class="hidden md:block overflow-x-auto scrollbar-thin">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-gray-50 border-b">
              <th class="px-4 py-3 text-left font-semibold text-gray-600">Mã đơn</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-600">Khách hàng</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-600">Sản phẩm</th>
              <th class="px-4 py-3 text-center font-semibold text-gray-600">SL</th>
              <th class="px-4 py-3 text-right font-semibold text-gray-600">Tổng tiền</th>
              <th class="px-4 py-3 text-center font-semibold text-gray-600">Mã vận đơn</th>
              <th class="px-4 py-3 text-center font-semibold text-gray-600">Ngày tạo</th>
              <th class="px-4 py-3 text-center font-semibold text-gray-600">Hành động</th>
            </tr>
          </thead>
          <tbody id="returnsTableBodyReturned">
            <tr>
              <td colspan="8" class="px-4 py-16 text-center text-gray-400">
                <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
                <p>Đang tải dữ liệu...</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div id="returnsMobileListReturned" class="md:hidden"></div>
      <div id="returnsEmptyReturned" class="hidden text-center py-16 text-gray-400">
        <i class="fas fa-box-open text-4xl mb-3"></i>
        <p>Không có đơn hoàn nào</p>
      </div>
    </div>

    <!-- Cancelled Orders Table -->
    <div id="returnsTableCancelled" class="hidden bg-white rounded-2xl shadow-sm border overflow-hidden">
      <div class="hidden md:block overflow-x-auto scrollbar-thin">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-gray-50 border-b">
              <th class="px-4 py-3 text-left font-semibold text-gray-600">Mã đơn</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-600">Khách hàng</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-600">Sản phẩm</th>
              <th class="px-4 py-3 text-center font-semibold text-gray-600">SL</th>
              <th class="px-4 py-3 text-right font-semibold text-gray-600">Tổng tiền</th>
              <th class="px-4 py-3 text-center font-semibold text-gray-600">Lý do</th>
              <th class="px-4 py-3 text-center font-semibold text-gray-600">Mã vận đơn</th>
              <th class="px-4 py-3 text-center font-semibold text-gray-600">Ngày tạo</th>
              <th class="px-4 py-3 text-center font-semibold text-gray-600">Hành động</th>
            </tr>
          </thead>
          <tbody id="returnsTableBodyCancelled">
            <tr>
              <td colspan="9" class="px-4 py-16 text-center text-gray-400">
                <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
                <p>Đang tải dữ liệu...</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div id="returnsMobileListCancelled" class="md:hidden"></div>
      <div id="returnsEmptyCancelled" class="hidden text-center py-16 text-gray-400">
        <i class="fas fa-ban text-4xl mb-3"></i>
        <p>Không có đơn huỷ nào</p>
      </div>
    </div>

    <!-- Delivery Failed Orders Table -->
    <div id="returnsTableDeliveryFailed" class="hidden bg-white rounded-2xl shadow-sm border overflow-hidden">
      <div class="hidden md:block overflow-x-auto scrollbar-thin">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-gray-50 border-b">
              <th class="px-4 py-3 text-left font-semibold text-gray-600">Mã đơn</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-600">Khách hàng</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-600">Sản phẩm</th>
              <th class="px-4 py-3 text-center font-semibold text-gray-600">SL</th>
              <th class="px-4 py-3 text-right font-semibold text-gray-600">Tổng tiền</th>
              <th class="px-4 py-3 text-center font-semibold text-gray-600">Mã vận đơn</th>
              <th class="px-4 py-3 text-center font-semibold text-gray-600">Ngày tạo</th>
              <th class="px-4 py-3 text-center font-semibold text-gray-600">Hành động</th>
            </tr>
          </thead>
          <tbody id="returnsTableBodyDeliveryFailed">
            <tr>
              <td colspan="8" class="px-4 py-16 text-center text-gray-400">
                <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
                <p>Đang tải dữ liệu...</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div id="returnsMobileListDeliveryFailed" class="md:hidden"></div>
      <div id="returnsEmptyDeliveryFailed" class="hidden text-center py-16 text-gray-400">
        <i class="fas fa-truck-ramp-box text-4xl mb-3"></i>
        <p>Không có đơn giao thất bại nào</p>
      </div>
    </div>
  </div>`
}
export function adminCustomersPage(): string {
  return `<!-- CUSTOMERS PAGE -->
  <div id="page-customers" class="p-3 md:p-6 hidden">
    <!-- Filters & Actions -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
      <div class="flex gap-2 flex-wrap items-center">
        <input type="text" id="customersSearch" placeholder="Tìm tên/SĐT/username..." oninput="filterCustomers()" 
          class="border rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-pink-400 w-64">
        <div class="flex items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50/70 px-2 py-2">
          <input type="tel" id="dailyLimitOverridePhone" placeholder="SĐT khách vãng lai"
            class="w-44 bg-white border border-blue-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400">
          <button type="button" onclick="grantDailyOrderLimitOverrideByPhone(this)" class="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-bold text-white hover:bg-blue-700 transition">
            <i class="fas fa-unlock-keyhole"></i>
            Mở limit
          </button>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <span id="customersCount" class="text-sm text-gray-600 font-medium">0 khách hàng</span>
      </div>
    </div>

    <!-- Customers Table -->
    <div class="bg-white rounded-2xl shadow-sm border overflow-hidden">
      <div class="hidden md:block overflow-x-auto scrollbar-thin">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-gray-50 border-b">
              <th class="px-4 py-3 text-left font-semibold text-gray-600">Khách hàng</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-600">Số điện thoại</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-600">Địa chỉ</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-600">Sản phẩm đã mua</th>
              <th class="px-4 py-3 text-center font-semibold text-gray-600">Hành động</th>
            </tr>
          </thead>
          <tbody id="customersTableBody">
            <tr>
              <td colspan="5" class="px-4 py-16 text-center text-gray-400">
                <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
                <p>Đang tải dữ liệu...</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div id="customersMobileList" class="md:hidden"></div>
      <div id="customersEmpty" class="hidden text-center py-16 text-gray-400">
        <i class="fas fa-users text-4xl mb-3"></i>
        <p>Chưa có khách hàng nào</p>
      </div>
    </div>
  </div>

  <!-- Customer Order History Modal -->
  <div id="customerOrderHistoryModal" class="modal-overlay hidden fixed inset-0 z-[90] items-center justify-center px-4 py-6" style="display:none;pointer-events:none" onclick="closeCustomerOrderHistoryModal(event)">
    <div class="modal-card w-full max-w-4xl max-h-[88vh] overflow-hidden rounded-3xl bg-white shadow-2xl border border-pink-100 flex flex-col" onclick="event.stopPropagation()">
      <div class="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5 bg-gradient-to-r from-pink-50 via-white to-orange-50">
        <div>
          <h3 class="text-2xl font-extrabold text-gray-900 tracking-tight">Lịch sử đơn hàng</h3>
          <p id="customerOrderHistorySubtitle" class="text-sm text-gray-500 mt-1">Khách hàng: <span id="customerOrderHistoryName" class="font-semibold text-gray-700"></span></p>
        </div>
        <button type="button" onclick="closeCustomerOrderHistoryModal()" class="w-10 h-10 rounded-full bg-white border border-gray-200 text-gray-500 hover:text-gray-900 hover:border-pink-200 transition shadow-sm">
          <i class="fas fa-xmark"></i>
        </button>
      </div>
      <div class="flex-1 overflow-y-auto scrollbar-thin bg-gray-50/60 px-6 py-5">
        <div id="customerOrderHistoryContent" class="space-y-3">
          <div class="text-center py-8 text-gray-400">
            <i class="fas fa-spinner fa-spin text-2xl"></i>
          </div>
        </div>
      </div>
      <div class="border-t border-gray-100 bg-white px-6 py-4 flex items-center justify-end gap-3">
        <button type="button" onclick="closeCustomerOrderHistoryModal()" class="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">Đóng</button>
      </div>
    </div>
  </div>`
}

export function adminLiveChatPage(): string {
  return `<!-- LIVE CHAT PAGE -->
  <div id="page-live-chat" class="p-3 md:p-6 hidden">
    <div class="grid grid-cols-1 xl:grid-cols-[22rem_1fr] gap-4 h-[calc(100vh-7rem)] min-h-[36rem]">
      <section class="bg-white rounded-2xl shadow-sm border overflow-hidden flex flex-col min-h-0">
        <div class="px-4 py-3 border-b flex items-center justify-between gap-3">
          <div>
            <h2 class="font-bold text-gray-900">Hội thoại</h2>
            <p id="liveChatAdminSummary" class="text-xs text-gray-400">Đang tải...</p>
          </div>
          <button type="button" onclick="loadLiveChatAdminInbox()" class="w-9 h-9 rounded-xl bg-pink-50 text-pink-600 hover:bg-pink-100 transition" title="Tải lại" aria-label="Tải lại live chat">
            <i class="fas fa-rotate"></i>
          </button>
        </div>
        <div id="liveChatConversationList" class="flex-1 overflow-y-auto divide-y divide-gray-100">
          <div class="p-6 text-center text-gray-400"><i class="fas fa-spinner fa-spin text-2xl mb-2"></i><p>Đang tải live chat...</p></div>
        </div>
      </section>

      <section class="bg-white rounded-2xl shadow-sm border overflow-hidden flex flex-col min-h-0">
        <div class="px-4 py-3 border-b flex items-center justify-between gap-3">
          <div class="min-w-0">
            <h2 id="liveChatActiveName" class="font-bold text-gray-900 truncate">Chọn một hội thoại</h2>
            <p id="liveChatActiveMeta" class="text-xs text-gray-400 truncate">Tin nhắn lưu trong 7 ngày</p>
          </div>
          <span id="liveChatSocketStatus" class="text-xs font-semibold rounded-full bg-gray-100 text-gray-500 px-2 py-1">Offline</span>
        </div>
        <div id="liveChatAdminMessages" class="flex-1 overflow-y-auto bg-gray-50 p-4 space-y-3">
          <div class="h-full min-h-[16rem] flex items-center justify-center text-center text-gray-400">
            <div><i class="fas fa-comments text-3xl mb-3"></i><p>Chọn khách để bắt đầu trả lời</p></div>
          </div>
        </div>
        <div class="p-3 border-t bg-white">
          <div class="flex gap-2">
            <input id="liveChatAdminInput" type="text" placeholder="Nhập phản hồi..." class="flex-1 border rounded-xl px-3 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:border-pink-400" onkeydown="handleLiveChatAdminInputKey(event)">
            <button type="button" onclick="sendLiveChatAdminReply()" class="px-4 py-3 rounded-xl bg-gray-900 text-white font-bold text-sm hover:bg-pink-600 transition">
              <i class="fas fa-paper-plane mr-1"></i>Gửi
            </button>
          </div>
        </div>
      </section>
    </div>
  </div>`
}

export function adminBodyClose(): string {
  return "</body>"
}
