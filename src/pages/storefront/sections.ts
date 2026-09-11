import {
  DEFAULT_TEXT_UI_SETTINGS,
  sanitizeHeroCtaLink,
  sanitizeStorefrontDarkPalette,
  sanitizeStorefrontLightPalette,
  type TextUiSettings,
} from '../../lib/textUiSettings'

function escapeStorefrontSectionHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[ch] || ch))
}

function resolveTextUiSettings(textUiSettings?: Partial<TextUiSettings>): TextUiSettings {
  const resolved = { ...DEFAULT_TEXT_UI_SETTINGS }
  Object.entries(textUiSettings || {}).forEach(([key, value]) => {
    const normalizedKey = key as keyof TextUiSettings
    if (!(normalizedKey in resolved)) return
    if (normalizedKey === 'product_freeship_badge_enabled' || normalizedKey === 'flash_sale_shop_section_enabled') {
      resolved[normalizedKey] = value !== false
      return
    }
    if (normalizedKey === 'storefront_light_palette') {
      resolved[normalizedKey] = sanitizeStorefrontLightPalette(value)
      return
    }
    if (normalizedKey === 'storefront_dark_palette') {
      resolved[normalizedKey] = sanitizeStorefrontDarkPalette(value)
      return
    }
    if (normalizedKey === 'hero_primary_cta_text' || normalizedKey === 'hero_secondary_cta_text') {
      resolved[normalizedKey] = String(value ?? '').trim()
      return
    }
    if (normalizedKey === 'hero_primary_cta_link' || normalizedKey === 'hero_secondary_cta_link') {
      resolved[normalizedKey] = sanitizeHeroCtaLink(value, DEFAULT_TEXT_UI_SETTINGS[normalizedKey]) || DEFAULT_TEXT_UI_SETTINGS[normalizedKey]
      return
    }
    const normalizedValue = String(value || '').trim()
    if (normalizedValue) {
      resolved[normalizedKey] = normalizedValue
    }
  })
  return resolved
}

export function storefrontBodyOpen(): string {
  return "<body class=\"bg-gray-50 overflow-x-hidden pb-[70px] md:pb-0\" data-storefront-theme=\"light\">"
}

export function storefrontBodyOpenWithPalette(lightPalette: string, darkPalette: string): string {
  return `<body class="bg-gray-50 overflow-x-hidden pb-[70px] md:pb-0" data-ui-variant="frontend-v2" data-storefront-theme="light" data-storefront-light-palette="${escapeStorefrontSectionHtml(lightPalette)}" data-storefront-dark-palette="${escapeStorefrontSectionHtml(darkPalette)}">`
}

export function storefrontNavbarSection(): string {
  return `<!-- NAVBAR -->
<nav class="navbar-blur fixed top-0 left-0 right-0 z-50 border-b border-white/10">
  <div class="storefront-marquee-bar">
    <div class="storefront-marquee-track">
      <div class="storefront-marquee-group">
        <i class="fas fa-bullhorn storefront-marquee-icon" aria-hidden="true"></i>
        <span class="storefront-marquee-text">Mua trực tiếp tại QH Boypho để có giá tốt hơn khi không qua sàn thương mại. Shop hỗ trợ đổi trả trong 7 ngày nếu sản phẩm bị lỗi. Cần bảo hành hoặc tư vấn, nhắn Facebook: <a class="storefront-marquee-link" href="http://m.me/qhboypho" target="_blank" rel="noreferrer noopener">QH Boypho</a>.</span>
      </div>
    </div>
  </div>
  <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
    <a href="/" class="flex items-center gap-1.5 md:gap-1">
      <span class="inline-flex items-center justify-center"><img data-store-logo-img="boypho" src="/qh-logo.png" alt="QH Boypho" class="rounded-full w-9 h-9 object-cover bg-white"></span><span class="hidden md:inline text-xl font-display text-white font-bold tracking-normal md:ml-0.5"><span data-store-logo-text="boypho" class="text-pink-400">Boypho</span></span>
    </a>
    <div class="hidden md:flex items-center gap-6 text-sm text-gray-300">
      <a href="#products" class="hover:text-pink-400 transition">Sản phẩm</a>
      <a href="#about" class="hover:text-pink-400 transition">Về chúng tôi</a>
      <a href="#contact" class="hover:text-pink-400 transition">Liên hệ</a>
    </div>
    
    <!-- DESKTOP ICONS -->
    <div class="hidden md:flex items-center gap-3">
      <button onclick="openCart()" id="cartNavBtn" class="relative text-white hover:text-pink-400 transition p-2">
        <i class="fas fa-shopping-cart text-xl"></i>
        <span id="cartBadge" class="absolute -top-1 -right-1 bg-[#881337] text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center hidden font-bold">0</span>
      </button>
      <button onclick="openTopupModal()" id="walletNavBtn" class="hidden items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-xl transition text-xs font-medium">
        <i class="fas fa-wallet text-pink-400"></i>
        <span id="walletBalanceNav">0đ</span>
      </button>
      <a href="/admin" id="adminNavLink" class="text-gray-400 hover:text-white transition p-2 hidden" title="Admin">
        <i class="fas fa-user-shield"></i>
      </a>
      <button type="button" onclick="toggleStorefrontTheme()" id="storefrontThemeToggle" class="theme-toggle-btn relative text-white hover:text-pink-400 transition p-2" aria-label="Chuyển giao diện tối" title="Chuyển sáng/tối">
        <i id="storefrontThemeIcon" class="fas fa-moon text-lg"></i>
      </button>
      <button onclick="toggleUserMenu()" id="userAvatarBtn" class="relative text-white hover:text-pink-400 transition p-1">
        <div id="userAvatarDefault" class="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
          <i class="fas fa-user text-sm"></i>
        </div>
        <img id="userAvatarImg" src="" alt="" class="w-8 h-8 rounded-full object-cover border-2 border-pink-400 hidden">
      </button>
    </div>

    <!-- MOBILE TOP ICONS -->
    <div class="flex md:hidden items-center gap-3">
      <button type="button" onclick="focusProductsSearch()" class="text-white hover:text-pink-400 transition p-2" aria-label="Tìm sản phẩm">
        <i class="fas fa-search text-[18px]"></i>
      </button>
      <button type="button" onclick="toggleStorefrontTheme()" id="storefrontThemeToggleMobile" class="theme-toggle-btn relative text-white hover:text-pink-400 transition p-2 border border-white/20 rounded-full w-9 h-9 flex items-center justify-center">
        <i id="storefrontThemeIconMobile" class="fas fa-moon text-[16px]"></i>
      </button>
      <button onclick="openCart()" id="cartNavBtnMobile" class="relative text-white hover:text-pink-400 transition p-2 border border-white/20 rounded-full w-9 h-9 flex items-center justify-center" aria-label="Giỏ hàng">
        <i class="fas fa-shopping-cart text-[16px]"></i>
        <span id="cartBadgeMobile" class="absolute -top-1 -right-1 bg-[#881337] text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center hidden font-bold">0</span>
      </button>
    </div>
  </div>
</nav>`
}

export function storefrontHeroSection(textUiSettings?: Partial<TextUiSettings>): string {
  const settings = resolveTextUiSettings(textUiSettings)
  const badge = escapeStorefrontSectionHtml(settings.hero_badge_text)
  const title = escapeStorefrontSectionHtml(settings.hero_title_text)
  const typedText = escapeStorefrontSectionHtml(settings.hero_typed_text)
  const typedAria = escapeStorefrontSectionHtml(settings.hero_typed_text.replace(/\|+/g, ' '))
  const description = escapeStorefrontSectionHtml(settings.hero_description_text)
  const mobileSubtitle = escapeStorefrontSectionHtml(settings.hero_mobile_subtitle_text)
  const stat1Value = escapeStorefrontSectionHtml(settings.hero_stat_1_value)
  const stat1Label = escapeStorefrontSectionHtml(settings.hero_stat_1_label)
  const stat2Value = escapeStorefrontSectionHtml(settings.hero_stat_2_value)
  const stat2Label = escapeStorefrontSectionHtml(settings.hero_stat_2_label)
  const stat3Value = escapeStorefrontSectionHtml(settings.hero_stat_3_value)
  const stat3Label = escapeStorefrontSectionHtml(settings.hero_stat_3_label)
  const primaryCtaText = escapeStorefrontSectionHtml(settings.hero_primary_cta_text)
  const primaryCtaLink = escapeStorefrontSectionHtml(settings.hero_primary_cta_link)
  const secondaryCtaText = escapeStorefrontSectionHtml(settings.hero_secondary_cta_text)
  const secondaryCtaLink = escapeStorefrontSectionHtml(settings.hero_secondary_cta_link)
  const heroCtaButtons = [
    primaryCtaText
      ? `<a href="${primaryCtaLink}" class="btn-primary text-white px-8 py-3 rounded-full font-semibold">
          <i class="fas fa-shopping-bag mr-2"></i>${primaryCtaText}
        </a>`
      : '',
    secondaryCtaText
      ? `<a href="${secondaryCtaLink}" class="border border-white/30 text-white px-8 py-3 rounded-full font-semibold hover:bg-white/10 transition">
          ${secondaryCtaText}
        </a>`
      : '',
  ].filter(Boolean).join('')
  const heroCtaActions = heroCtaButtons
    ? `<div class="hero-desktop-actions flex gap-4 flex-wrap">${heroCtaButtons}</div>`
    : ''
  return `<!-- HERO -->
<section class="gradient-hero flex items-center" id="hero" role="region" aria-labelledby="heroTitle">
  <div class="max-w-7xl mx-auto px-4 py-10 grid md:grid-cols-2 gap-12 items-center hero-layout">
    <div class="hero-copy-block">
      <p class="hero-badge text-pink-400 font-medium tracking-widest uppercase text-sm mb-4">${badge}</p>
      <h1 id="heroTitle" class="hero-title font-display text-5xl md:text-6xl text-white font-bold leading-snug md:leading-tight mb-6">
        ${title}<br><span class="hero-title-gradient hero-typed-line"><span id="heroTypedText" class="hero-typed-text" data-typed-text="${typedText}" aria-label="${typedAria}"></span><span class="hero-typed-cursor" aria-hidden="true"></span></span>
      </h1>
      <p class="hero-mobile-sub hidden text-gray-300 text-sm leading-relaxed mb-5">${mobileSubtitle}</p>
      <p class="hero-desktop-desc text-gray-300 text-lg mb-8 leading-loose">${description}</p>
      ${heroCtaActions}
      <div class="hero-desktop-stats mt-8 grid grid-cols-3 gap-6">
        <div class="text-center"><p class="text-3xl font-bold text-white">${stat1Value}</p><p class="text-gray-400 text-sm">${stat1Label}</p></div>
        <div class="text-center"><p class="text-3xl font-bold text-white">${stat2Value}</p><p class="text-gray-400 text-sm">${stat2Label}</p></div>
        <div class="text-center"><p class="text-3xl font-bold text-white">${stat3Value}</p><p class="text-gray-400 text-sm">${stat3Label}</p></div>
      </div>
    </div>
    <div class="flex justify-end" id="heroBannersWrapper">
      <!-- Collapsed / stacked state -->
      <div id="heroBannersCollapsed" role="region" aria-roledescription="carousel" aria-label="Bộ sưu tập nổi bật" title="Click để xem thêm">
        <!-- will be rendered by JS -->
        <div class="relative rounded-3xl overflow-hidden bg-white/[0.03]" style="width:360px;height:360px"></div>
      </div>
    </div>

    <!-- Expanded fullscreen overlay -->
    <div id="heroBannersExpanded" onclick="handleBannerOverlayClick(event)">
      <p id="heroBannersExpandedTitle">Đang thịnh hành</p>
      <p id="heroBannersExpandedSubtitle" class="text-white/70 text-xs md:text-sm text-center mb-4">${mobileSubtitle}</p>
      <div id="heroBannersExpandedInner">
        <!-- filled by JS -->
      </div>
    </div>
  </div>
</section>`
}


export function storefrontBestsellersSection(): string {
  return `<!-- BESTSELLERS SLIDER -->
<section id="bestsellersSection" class="w-full py-10 px-0">
  <div class="max-w-7xl mx-auto px-4 mb-5 flex items-end justify-between">
    <div>
      <p class="text-violet-400 font-semibold tracking-widest uppercase text-xs mb-1.5">🏆 TOP RANKING</p>
      <h2 class="bestsellers-section-title font-display font-bold text-white leading-tight">Mẫu Bán Chạy Nhất</h2>
    </div>
    <a href="#products" class="text-sm text-violet-400 hover:text-pink-400 font-semibold transition whitespace-nowrap">Xem tất cả →</a>
  </div>
  <div class="max-w-7xl mx-auto px-4">
    <div id="bestsellersTrack" class="bestsellers-track">
      <div class="bs-card"><div class="skeleton" style="aspect-ratio:1/1;width:100%"></div><div class="p-3 space-y-2"><div class="skeleton h-3 rounded-full"></div><div class="skeleton h-3 w-2/3 rounded-full"></div><div class="skeleton h-8 rounded-xl"></div></div></div>
      <div class="bs-card"><div class="skeleton" style="aspect-ratio:1/1;width:100%"></div><div class="p-3 space-y-2"><div class="skeleton h-3 rounded-full"></div><div class="skeleton h-3 w-2/3 rounded-full"></div><div class="skeleton h-8 rounded-xl"></div></div></div>
      <div class="bs-card"><div class="skeleton" style="aspect-ratio:1/1;width:100%"></div><div class="p-3 space-y-2"><div class="skeleton h-3 rounded-full"></div><div class="skeleton h-3 w-2/3 rounded-full"></div><div class="skeleton h-8 rounded-xl"></div></div></div>
      <div class="bs-card"><div class="skeleton" style="aspect-ratio:1/1;width:100%"></div><div class="p-3 space-y-2"><div class="skeleton h-3 rounded-full"></div><div class="skeleton h-3 w-2/3 rounded-full"></div><div class="skeleton h-8 rounded-xl"></div></div></div>
      <div class="bs-card"><div class="skeleton" style="aspect-ratio:1/1;width:100%"></div><div class="p-3 space-y-2"><div class="skeleton h-3 rounded-full"></div><div class="skeleton h-3 w-2/3 rounded-full"></div><div class="skeleton h-8 rounded-xl"></div></div></div>
    </div>
  </div>
</section>`
}

export function storefrontFilterBarSection(): string {
  return `<!-- FILTER BAR -->
<section class="sticky top-20 z-40" id="filterBar">
  <div class="filter-shell">
    <div class="filter-search-row filter-toolbar">
      <h2 class="filter-section-title font-display">Danh Sách Sản Phẩm</h2>
      <div class="filter-search-wrap">
        <i class="fas fa-search filter-search-icon" aria-hidden="true"></i>
        <input type="search" id="searchInput" aria-label="Tìm sản phẩm" enterkeyhint="search" placeholder="Tìm sản phẩm..." class="filter-search-input w-full" oninput="if(!event.isComposing) searchProducts(this.value)" oncompositionend="searchProducts(this.value)" onkeydown="if(event.key==='Enter' && !event.isComposing){event.preventDefault();searchProducts(this.value);this.blur()}">
        <button type="button" id="clearProductsSearch" aria-label="Xóa từ khóa tìm kiếm" onclick="clearProductsSearch()" hidden>×</button>
      </div>
      <div class="filter-chip-row flex overflow-x-auto no-scrollbar gap-2 md:flex-1" id="filterChipRow">
        <button class="filter-btn active whitespace-nowrap" data-cat="all" onclick="filterProducts('all',this)">Tất cả</button>
        <button class="filter-btn whitespace-nowrap" data-cat="unisex" onclick="filterProducts('unisex',this)">Unisex</button>
        <button class="filter-btn whitespace-nowrap" data-cat="male" onclick="filterProducts('male',this)">Nam</button>
        <button class="filter-btn whitespace-nowrap" data-cat="female" onclick="filterProducts('female',this)">Nữ</button>
      </div>
      <label class="filter-sort-wrap" for="productsSortSelect">
        <i class="fas fa-arrow-up-wide-short" aria-hidden="true"></i>
        <select id="productsSortSelect" class="filter-sort-select" onchange="sortProductsByTime(this.value)">
          <option value="newest">Mới nhất</option>
          <option value="oldest">Cũ nhất</option>
        </select>
      </label>
      <button type="button" class="filter-modal-trigger" onclick="openFilterModal()" aria-label="Bộ lọc nâng cao" title="Bộ lọc nâng cao">
        <i class="fas fa-sliders-h" aria-hidden="true"></i>
        <span>Bộ lọc</span>
      </button>
      <button type="button" id="productsLayoutToggle" class="filter-view-toggle" aria-label="Chuyển sang dạng lưới 2 cột" title="Chuyển sang dạng lưới 2 cột" onclick="toggleProductsMobileLayout()"><i class="fas fa-table-cells-large" aria-hidden="true"></i></button>
    </div>
    <p id="productsCountLabel" class="search-result-count" role="status" aria-live="polite" aria-atomic="true">0 sản phẩm</p>
    <div id="activeProductsFilters" aria-label="Bộ lọc đang áp dụng" hidden></div>
  </div>
  <style>
    #filterBar .filter-search-wrap { position: relative; }
    #filterBar #searchInput { padding-right: 42px; }
    #filterBar #searchInput::-webkit-search-cancel-button { display: none; }
    #filterBar #clearProductsSearch { position: absolute; right: 0; top: 0; width: 40px; height: 100%; min-height: 40px; font-size: 24px; color: inherit; }
    #filterBar .search-result-count { margin: 8px 0 0; font-size: 13px; color: inherit; overflow-wrap: anywhere; }
    #activeProductsFilters { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
    #activeProductsFilters[hidden], #clearProductsSearch[hidden] { display: none; }
    #activeProductsFilters button { border: 1px solid currentColor; border-radius: 20px; padding: 8px 12px; min-height: 40px; font-size: 12px; color: inherit; background: transparent; }
    #emptyState .search-reset-button { display: inline-flex; margin-top: 16px; padding: 10px 18px; border: 1px solid currentColor; border-radius: 24px; min-height: 44px; color: inherit; background: transparent; }
    #filterBar button:focus-visible, #filterBar #searchInput:focus-visible { outline: 2px solid #3b82f6; outline-offset: 2px; }
  </style>
</section>`
}

export function storefrontFlashSaleShopSection(): string {
  return "<!-- FLASH SALE SHOP -->\n<section id=\"flashSaleShopSection\" class=\"hidden max-w-7xl mx-auto px-4 py-10\">\n  <div class=\"flash-sale-shop-shell\">\n    <div class=\"mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between\">\n      <div>\n        <div class=\"inline-flex items-center gap-2 rounded-full bg-rose-500 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-white\">\n          <i class=\"fas fa-bolt\"></i>\n          Flash Sale của shop\n        </div>\n        <h2 class=\"mt-3 font-display text-3xl font-bold text-slate-900 md:text-4xl\">Săn deal chớp nhoáng</h2>\n      </div>\n    </div>\n    <div id=\"flashSaleShopGrid\" class=\"grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6\">\n      <div class=\"product-card bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100\" aria-hidden=\"true\">\n        <div class=\"relative overflow-hidden bg-gray-100\"><div class=\"skeleton product-img-main\"></div></div>\n        <div class=\"p-3 md:p-4 space-y-1.5\">\n          <div class=\"skeleton h-3 w-full rounded-full\"></div>\n          <div class=\"skeleton h-3 w-4/5 rounded-full\"></div>\n          <div class=\"skeleton h-4 w-24 rounded-md\"></div>\n          <div class=\"skeleton h-8 w-full rounded-xl\"></div>\n        </div>\n      </div>\n      <div class=\"product-card bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100\" aria-hidden=\"true\">\n        <div class=\"relative overflow-hidden bg-gray-100\"><div class=\"skeleton product-img-main\"></div></div>\n        <div class=\"p-3 md:p-4 space-y-1.5\">\n          <div class=\"skeleton h-3 w-full rounded-full\"></div>\n          <div class=\"skeleton h-3 w-3/4 rounded-full\"></div>\n          <div class=\"skeleton h-4 w-24 rounded-md\"></div>\n          <div class=\"skeleton h-8 w-full rounded-xl\"></div>\n        </div>\n      </div>\n    </div>\n  </div>\n</section>"
}

export function storefrontProductsSection(): string {
  return "<!-- PRODUCTS -->\n<section class=\"max-w-7xl mx-auto px-4 py-8 md:py-10\" id=\"products\">\n  " + storefrontFilterBarSection() + "\n  <div id=\"productsGrid\" class=\"grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6\">\n    <div class=\"product-card bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100\" aria-hidden=\"true\">\n      <div class=\"relative overflow-hidden bg-gray-100\"><div class=\"skeleton product-img-main\"></div></div>\n      <div class=\"p-3 md:p-4 space-y-1.5\">\n        <div class=\"skeleton h-3 w-10 rounded-full\"></div>\n        <div class=\"skeleton h-3 w-full rounded-full\"></div>\n        <div class=\"skeleton h-3 w-4/5 rounded-full\"></div>\n        <div class=\"flex items-center gap-1.5\"><div class=\"skeleton h-4 w-16 rounded-full\"></div><div class=\"skeleton h-3 w-9 rounded-full\"></div></div>\n        <div class=\"skeleton h-4 w-24 rounded-md\"></div>\n        <div class=\"skeleton h-8 w-full rounded-xl\"></div>\n      </div>\n    </div>\n    <div class=\"product-card bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100\" aria-hidden=\"true\">\n      <div class=\"relative overflow-hidden bg-gray-100\"><div class=\"skeleton product-img-main\"></div></div>\n      <div class=\"p-3 md:p-4 space-y-1.5\">\n        <div class=\"skeleton h-3 w-11 rounded-full\"></div>\n        <div class=\"skeleton h-3 w-full rounded-full\"></div>\n        <div class=\"skeleton h-3 w-3/4 rounded-full\"></div>\n        <div class=\"flex items-center gap-1.5\"><div class=\"skeleton h-4 w-16 rounded-full\"></div><div class=\"skeleton h-3 w-10 rounded-full\"></div></div>\n        <div class=\"skeleton h-4 w-24 rounded-md\"></div>\n        <div class=\"skeleton h-8 w-full rounded-xl\"></div>\n      </div>\n    </div>\n    <div class=\"product-card bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100\" aria-hidden=\"true\">\n      <div class=\"relative overflow-hidden bg-gray-100\"><div class=\"skeleton product-img-main\"></div></div>\n      <div class=\"p-3 md:p-4 space-y-1.5\">\n        <div class=\"skeleton h-3 w-10 rounded-full\"></div>\n        <div class=\"skeleton h-3 w-full rounded-full\"></div>\n        <div class=\"skeleton h-3 w-4/5 rounded-full\"></div>\n        <div class=\"flex items-center gap-1.5\"><div class=\"skeleton h-4 w-16 rounded-full\"></div><div class=\"skeleton h-3 w-9 rounded-full\"></div></div>\n        <div class=\"skeleton h-4 w-24 rounded-md\"></div>\n        <div class=\"skeleton h-8 w-full rounded-xl\"></div>\n      </div>\n    </div>\n    <div class=\"product-card bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100\" aria-hidden=\"true\">\n      <div class=\"relative overflow-hidden bg-gray-100\"><div class=\"skeleton product-img-main\"></div></div>\n      <div class=\"p-3 md:p-4 space-y-1.5\">\n        <div class=\"skeleton h-3 w-9 rounded-full\"></div>\n        <div class=\"skeleton h-3 w-full rounded-full\"></div>\n        <div class=\"skeleton h-3 w-3/4 rounded-full\"></div>\n        <div class=\"flex items-center gap-1.5\"><div class=\"skeleton h-4 w-16 rounded-full\"></div><div class=\"skeleton h-3 w-10 rounded-full\"></div></div>\n        <div class=\"skeleton h-4 w-24 rounded-md\"></div>\n        <div class=\"skeleton h-8 w-full rounded-xl\"></div>\n      </div>\n    </div>\n  </div>\n  <div id=\"productsMoreWrap\" class=\"hidden text-center mt-8\">\n    <button type=\"button\" onclick=\"openProductsModal()\" class=\"btn-primary text-white px-7 py-3 rounded-full font-semibold shadow-lg\"><i class=\"fas fa-layer-group mr-2\"></i>Xem thêm <span id=\"productsMoreCount\"></span></button>\n  </div>\n  <div id=\"emptyState\" class=\"hidden text-center py-20\">\n    <i class=\"fas fa-box-open text-6xl text-gray-300 mb-4\"></i>\n    <p class=\"text-gray-400 text-lg\">Không tìm thấy sản phẩm nào</p>\n  </div>\n</section>\n<div id=\"productsModalOverlay\" class=\"hidden fixed inset-0 z-[10020] bg-black/60 backdrop-blur-sm p-3 md:p-6\">\n  <div class=\"bg-white w-full max-w-7xl mx-auto h-full rounded-3xl shadow-2xl overflow-hidden flex flex-col\">\n    <div class=\"flex items-center justify-between gap-4 px-4 md:px-6 py-4 border-b border-gray-100\">\n      <div>\n        <p class=\"text-pink-500 font-medium tracking-widest uppercase text-xs\">Danh sách đầy đủ</p>\n        <h3 class=\"font-display text-xl md:text-2xl font-bold text-gray-900\">Tất cả sản phẩm</h3>\n        <p id=\"productsModalMeta\" class=\"text-sm text-gray-500 mt-1\"></p>\n      </div>\n      <button type=\"button\" onclick=\"closeProductsModal()\" class=\"w-10 h-10 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition\"><i class=\"fas fa-times\"></i></button>\n    </div>\n    <div class=\"flex-1 overflow-y-auto p-4 md:p-6\">\n      <div id=\"productsModalGrid\" class=\"grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6\"></div>\n      <div class=\"text-center pt-6\">\n        <button type=\"button\" id=\"productsModalLoadMore\" onclick=\"loadMoreProductsModal()\" class=\"hidden border border-pink-200 text-pink-600 hover:bg-pink-50 px-6 py-3 rounded-full font-semibold transition\"><i class=\"fas fa-plus mr-2\"></i>Tải thêm sản phẩm</button>\n      </div>\n    </div>\n  </div>\n</div>"
}

export function storefrontFeaturesSection(): string {
  return "<!-- FEATURES SECTION -->\n<section class=\"bg-white py-16\" id=\"about\">\n  <div class=\"max-w-7xl mx-auto px-4\">\n    <div class=\"grid grid-cols-2 md:grid-cols-4 gap-8 text-center\">\n      <div class=\"p-6\"><div class=\"w-14 h-14 bg-pink-50 rounded-2xl flex items-center justify-center mx-auto mb-4\"><i class=\"fas fa-truck text-pink-500 text-2xl\"></i></div><h3 class=\"font-semibold text-gray-800 mb-2\">Giao hàng toàn quốc</h3><p class=\"text-gray-500 text-sm\">Giao tận nơi, nhanh chóng, an toàn</p></div>\n      <div class=\"p-6\"><div class=\"w-14 h-14 bg-pink-50 rounded-2xl flex items-center justify-center mx-auto mb-4\"><i class=\"fas fa-shield-alt text-pink-500 text-2xl\"></i></div><h3 class=\"font-semibold text-gray-800 mb-2\">Chất lượng đảm bảo</h3><p class=\"text-gray-500 text-sm\">100% vải cao cấp, kiểm định chặt chẽ</p></div>\n      <div class=\"p-6\"><div class=\"w-14 h-14 bg-pink-50 rounded-2xl flex items-center justify-center mx-auto mb-4\"><i class=\"fas fa-undo text-pink-500 text-2xl\"></i></div><h3 class=\"font-semibold text-gray-800 mb-2\">Đổi trả dễ dàng</h3><p class=\"text-gray-500 text-sm\">Hỗ trợ đổi trả trong 7 ngày nếu sản phẩm bị lỗi</p></div>\n      <div class=\"p-6\"><div class=\"w-14 h-14 bg-pink-50 rounded-2xl flex items-center justify-center mx-auto mb-4\"><i class=\"fas fa-headset text-pink-500 text-2xl\"></i></div><h3 class=\"font-semibold text-gray-800 mb-2\">Hỗ trợ 24/7</h3><p class=\"text-gray-500 text-sm\">Tư vấn nhiệt tình, tận tâm</p></div>\n    </div>\n  </div>\n</section>"
}

export function storefrontFooterSection(): string {
  return "<!-- FOOTER -->\n<footer class=\"gradient-hero text-white py-12\" id=\"contact\">\n  <div class=\"max-w-7xl mx-auto px-4 grid md:grid-cols-4 gap-8\">\n    <div>\n      <h3 class=\"font-display text-2xl font-bold mb-4 flex items-center gap-2\">\n        <span class=\"logo-spinner\"><img data-store-logo-img=\"boypho\" src=\"/qh-logo.png\" alt=\"QH Boypho\" class=\"rounded-full w-9 h-9 object-cover bg-white\"></span>\n        <span><span data-store-logo-text=\"boypho\" class=\"text-pink-400\">Boypho</span></span>\n      </h3>\n      <p class=\"text-gray-400 text-sm leading-relaxed\">Quần áo nam nữ giá tốt chất lượng cho giới trẻ đa dạng mẫu mã và thịnh hành nhất.</p>\n    </div>\n    <div id=\"footerSocialSection\" class=\"hidden\">\n      <h4 class=\"font-semibold mb-4\">Sàn TMĐT</h4>\n      <div id=\"footerSocialLinks\" class=\"flex flex-wrap gap-2 text-sm\"></div>\n    </div>\n    <div>\n      <h4 class=\"font-semibold mb-4\">Chính sách</h4>\n      <div class=\"flex flex-col gap-2 text-gray-400 text-sm\">\n        <a href=\"#\" class=\"hover:text-pink-400 transition\">Chính sách đổi trả</a>\n        <a href=\"#\" class=\"hover:text-pink-400 transition\">Chính sách bảo mật</a>\n      </div>\n    </div>\n    <div>\n      <h4 class=\"font-semibold mb-4\">Liên hệ</h4>\n      <div class=\"flex flex-col gap-2 text-gray-400 text-sm\">\n        <p><i class=\"fab fa-facebook-messenger mr-2 text-pink-400\"></i><a href=\"https://m.me/qhboypho\" target=\"_blank\" rel=\"noreferrer noopener\" class=\"hover:text-pink-400 transition\">QH Boypho</a></p>\n        <p><i class=\"fas fa-envelope mr-2 text-pink-400\"></i>qhboypho@gmail.com</p>\n        <p><i class=\"fas fa-map-marker-alt mr-2 text-pink-400\"></i>Ninh Bình, Việt Nam</p>\n      </div>\n    </div>\n  </div>\n  <div class=\"max-w-7xl mx-auto px-4 mt-8 pt-8 border-t border-white/10 text-center text-gray-500 text-sm\">\n    © 2026 QH Boypho. All rights reserved.\n  </div>\n</footer>"
}

export function storefrontFooterWithPolicySection(): string {
  return storefrontFooterSection()
    .replace(
      'href="#" class="hover:text-pink-400 transition">Chính sách đổi trả',
      'href="/chinh-sach-doi-tra" class="hover:text-pink-400 transition">Chính sách đổi trả'
    )
    .replace(
      'href="#" class="hover:text-pink-400 transition">Chính sách bảo mật',
      'href="/chinh-sach-bao-mat" class="hover:text-pink-400 transition">Chính sách bảo mật'
    )
}

export function storefrontMobileBottomNavSection(): string {
  return `<!-- MOBILE BOTTOM NAV -->
<nav id="mobileBottomNav" class="mobile-bottom-nav md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-bottom pb-2">
  <div class="flex items-center justify-around h-[60px]">
    <a href="#hero" class="mobile-bottom-nav-link is-active flex flex-col items-center justify-center gap-1 w-16 transition">
      <i class="fas fa-home text-xl"></i>
      <span class="text-[10px] font-medium">Trang chủ</span>
    </a>
    <a href="#products" class="mobile-bottom-nav-link flex flex-col items-center justify-center gap-1 w-16 transition">
      <i class="fas fa-table-cells-large text-xl"></i>
      <span class="text-[10px] font-medium">Sản Phẩm</span>
    </a>
    <button onclick="openLiveChat()" id="liveChatBottomNavBtn" class="mobile-bottom-nav-link relative flex flex-col items-center justify-center gap-1 w-16 transition" aria-label="Chat với shop">
      <i class="fas fa-comments text-xl"></i>
      <span class="text-[10px] font-medium">Chat</span>
      <span class="live-chat-unread-badge hidden" aria-label="Tin nhắn chưa đọc">0</span>
    </button>
    <button onclick="toggleUserMenu()" class="mobile-bottom-nav-link flex flex-col items-center justify-center gap-1 w-16 transition">
      <i class="fas fa-user text-xl"></i>
      <span class="text-[10px] font-medium">Tài khoản</span>
    </button>
  </div>
</nav>`
}

export function storefrontBodyClose(): string {
  return "</body>"
}
