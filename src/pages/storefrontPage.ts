export function storefrontHTML(): string {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>QH Clothes – Phong Cách Thời Trang Hot Trend</title>
<meta name="description" content="Thời trang hot trend cho giới trẻ, cập nhập các mẫu mới và thịnh hành nhất. Mua sắm phong cách, dẫn đầu xu hướng, giá cực chất tại QH Clothes.">
<meta name="keywords" content="QH Boypho, QH Clothes, boypho, girlpho, Hiếu Quỳnh, thời trang hot trend, thời trang giới trẻ, quần áo nam nữ, local brand, áo thun unisex, áo khoác nam nữ, mẫu mới thịnh hành">
<meta name="author" content="QH Clothes">
<meta name="robots" content="index, follow">
<meta property="og:title" content="QH Clothes – Phong Cách Thời Trang Hot Trend">
<meta property="og:description" content="Thời trang hot trend cho giới trẻ, cập nhập các mẫu mới và thịnh hành nhất.">
<meta property="og:image" content="/qh-logo.png">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="QH Clothes – Phong Cách Thời Trang Hot Trend">
<meta name="twitter:description" content="Thời trang hot trend cho giới trẻ, cập nhập các mẫu mới và thịnh hành nhất.">
<meta name="twitter:image" content="/qh-logo.png">
<link rel="icon" type="image/png" href="/qh-logo.png">
<link rel="apple-touch-icon" href="/qh-logo.png">
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap');
  * { font-family: 'Inter', sans-serif; }
  h1,h2,h3,.font-display { font-family: 'Playfair Display', serif; }
  .gradient-hero { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%); }
  .card-hover { transition: all 0.3s ease; }
  .card-hover:hover { transform: translateY(-6px); box-shadow: 0 20px 40px rgba(0,0,0,0.15); }
  .badge-sale { background: linear-gradient(135deg, #e84393, #c0392b); }
  .btn-primary { background: linear-gradient(135deg, #c0392b, #e84393); transition: all 0.3s; }
  .btn-primary:hover { background: linear-gradient(135deg, #a93226, #c0307a); transform: scale(1.02); }
  .overlay { background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); }
  .popup-card { animation: slideUp 0.3s ease; }
  @keyframes slideUp { from { opacity:0; transform:translateY(40px); } to { opacity:1; transform:translateY(0); } }
  .color-btn.active { ring: 2px; outline: 3px solid #e84393; outline-offset: 2px; }
  .size-btn.active { background: #1a1a2e; color: white; }
  .img-gallery img { cursor: pointer; transition: all 0.2s; }
  .img-gallery img:hover { opacity: 0.8; transform: scale(1.05); }
  .toast { animation: fadeInOut 3s ease forwards; }
  @keyframes fadeInOut { 0%{opacity:0;transform:translateY(20px)} 15%{opacity:1;transform:translateY(0)} 85%{opacity:1} 100%{opacity:0} }
  ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-thumb { background: #c0392b; border-radius: 3px; }
  .product-img-main { width: 100%; aspect-ratio: 1/1; height: 100%; object-fit: cover; display: block; }
  .skeleton { background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
  @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  .navbar-blur { backdrop-filter: blur(12px); background: rgba(26,26,46,0.95); }
  .filter-btn.active { background: #c0392b; color: white; border-color: #c0392b; }
  /* Shake animation for validation */
  @keyframes shake {
    0%,100%{transform:translateX(0)}
    15%{transform:translateX(-6px)}
    30%{transform:translateX(6px)}
    45%{transform:translateX(-5px)}
    60%{transform:translateX(5px)}
    75%{transform:translateX(-3px)}
    90%{transform:translateX(3px)}
  }
  .shake { animation: shake 0.5s ease; }
  .field-error label, .field-error .field-title { color: #e84393 !important; }
  .field-error input, .field-error textarea { border-color: #e84393 !important; box-shadow: 0 0 0 3px rgba(232,67,147,0.15) !important; }
  .field-error select { border-color: #e84393 !important; box-shadow: 0 0 0 3px rgba(232,67,147,0.15) !important; }
  .field-error .payment-method-btn { border-color: #e84393 !important; box-shadow: 0 0 0 3px rgba(232,67,147,0.12) !important; }
  .field-error .color-btn, .field-error .size-btn { border-color: #e84393 !important; box-shadow: 0 0 0 3px rgba(232,67,147,0.12) !important; }
  .payment-method-unavailable {
    opacity: 0.45;
    filter: grayscale(0.15);
  }
  .payment-method-unavailable .payment-method-badge {
    font-size: 11px;
    line-height: 1.2;
  }
  .address-option-item { width: 100%; text-align: left; padding: 9px 12px; font-size: 14px; line-height: 1.4; }
  .address-option-item:hover { background: #fdf2f8; color: #be185d; }
  .address-option-item.active { background: #ec4899; color: #fff; font-weight: 600; }
  /* Voucher styles */
  .voucher-success { background: linear-gradient(135deg,#d1fae5,#a7f3d0); border: 1.5px solid #6ee7b7; }
  .voucher-error { background: #fff1f2; border: 1.5px solid #fecdd3; }
  /* Cart modal */
  .cart-modal { animation: slideInRight 0.35s cubic-bezier(0.32,0.72,0,1); }
  @keyframes slideInRight { from { transform:translateX(100%); opacity:0.5; } to { transform:translateX(0); opacity:1; } }
  .cart-item { position:relative; overflow:hidden; touch-action:pan-y; }
  .cart-item-inner { position:relative; background:#fff; transition: transform 0.25s ease; }
  .cart-item-delete-bg { position:absolute; right:0; top:0; bottom:0; width:80px; background:linear-gradient(135deg,#e84393,#c0392b); display:flex; align-items:center; justify-content:center; color:white; font-size:1.2rem; border-radius:0 0.75rem 0.75rem 0; }
  .cart-checkout { animation: slideUp 0.3s ease; }
  .cart-badge-bounce { animation: badgeBounce 0.4s cubic-bezier(0.36,0.07,0.19,0.97); }
  @keyframes badgeBounce { 0%{transform:scale(1)} 30%{transform:scale(1.5)} 60%{transform:scale(0.9)} 100%{transform:scale(1)} }
  .cart-fly-chip {
    position: fixed;
    width: 42px;
    height: 42px;
    border-radius: 9999px;
    overflow: hidden;
    border: 2px solid rgba(255,255,255,0.85);
    box-shadow: 0 10px 24px rgba(0,0,0,0.25);
    z-index: 10000;
    pointer-events: none;
    transform: translate(0,0) scale(1);
    opacity: 1;
    transition: transform 0.7s cubic-bezier(0.2,0.8,0.2,1), opacity 0.7s ease;
  }
  .cart-fly-chip img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .line-clamp-1 { overflow:hidden; display:-webkit-box; -webkit-line-clamp:1; -webkit-box-orient:vertical; }
  /* Checkout step in cart */
  .checkout-slide { animation: slideUp 0.3s ease; }
  .user-menu-overlay { background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); }
  .user-menu-panel { animation: slideInRight 0.35s cubic-bezier(0.32,0.72,0,1); }
  .user-menu-panel.closing { animation: slideOutRight 0.3s ease forwards; }
  @keyframes slideOutRight { from { transform:translateX(0); opacity:1; } to { transform:translateX(100%); opacity:0; } }
  .order-history-item { transition: all 0.2s; }
  .order-history-item:hover { background: #fdf2f8; }
  .order-history-title {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.35;
    max-height: calc(1.35em * 2);
    word-break: break-word;
    overflow-wrap: anywhere;
  }
  .order-status-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    border-radius: 9999px;
    padding: 0.32rem 0.65rem;
    font-size: 11px;
    font-weight: 700;
    line-height: 1;
    white-space: nowrap;
    border: 1px solid transparent;
  }
  .order-status-chip.clickable { cursor: pointer; }
  .order-status-chip--waiting-shop { background: #fff7ed; color: #c2410c; border-color: #fdba74; }
  .order-status-chip--waiting-pickup { background: #eff6ff; color: #2563eb; border-color: #bfdbfe; }
  .order-status-chip--shipping { background: #fef3c7; color: #b45309; border-color: #fcd34d; }
  .order-status-chip--done { background: #dcfce7; color: #15803d; border-color: #86efac; }
  .order-status-chip--cancelled { background: #fee2e2; color: #b91c1c; border-color: #fca5a5; }
  .order-status-chip--waiting-payment { background: #f3f4f6; color: #6b7280; border-color: #d1d5db; }
  .shipping-journey-step {
    position: relative;
    padding-left: 1.85rem;
  }
  .shipping-journey-step::before {
    content: '';
    position: absolute;
    left: 0.35rem;
    top: 0.45rem;
    width: 0.65rem;
    height: 0.65rem;
    border-radius: 9999px;
    background: #d1d5db;
    box-shadow: 0 0 0 4px #f9fafb;
  }
  .shipping-journey-step::after {
    content: '';
    position: absolute;
    left: 0.66rem;
    top: 1.05rem;
    bottom: -0.75rem;
    width: 2px;
    background: #e5e7eb;
  }
  .shipping-journey-step:last-child::after { display: none; }
  .shipping-journey-step.is-active::before { background: #e11d48; box-shadow: 0 0 0 4px rgba(225,29,72,0.12); }
  .shipping-journey-step.is-complete::before { background: #16a34a; box-shadow: 0 0 0 4px rgba(22,163,74,0.12); }
  .shipping-journey-step.is-complete::after { background: #86efac; }
  @keyframes spinSlow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @keyframes glowSpin { 0% { filter: hue-rotate(0deg) drop-shadow(0 0 6px rgba(99,102,241,0.7)); } 50% { filter: hue-rotate(60deg) drop-shadow(0 0 10px rgba(139,92,246,0.9)); } 100% { filter: hue-rotate(0deg) drop-shadow(0 0 6px rgba(99,102,241,0.7)); } }
  .logo-spinner { position:relative; display:inline-flex; align-items:center; justify-content:center; }
  .logo-spinner::before { content:''; position:absolute; inset:-3px; border-radius:50%; background:conic-gradient(from 0deg, #6366f1, #8b5cf6, #a855f7, #6366f1); animation: spinSlow 8s linear infinite; z-index:0; }
  .logo-spinner::after { content:''; position:absolute; inset:-3px; border-radius:50%; background:conic-gradient(from 0deg, #6366f1, #8b5cf6, #a855f7, #6366f1); animation: spinSlow 8s linear infinite; filter:blur(8px); opacity:0.6; z-index:0; }
  .logo-spinner img { position:relative; z-index:1; border-radius:50%; width:36px; height:36px; object-fit:cover; animation: spinSlow 12s linear infinite; background:white; }

  /* ── HERO BANNERS EXPAND ────────────────────────── */
  #heroBannersWrapper {
    position: relative;
    cursor: pointer;
  }
  /* Collapsed: stacked cards */
  #heroBannersCollapsed {
    position: relative;
    width: 320px;
    height: 380px;
    transition: opacity 0.35s ease, transform 0.35s ease;
  }
  /* Expanded overlay: full-width horizontal row */
  #heroBannersExpanded {
    display: none;
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    z-index: 999;
    background: rgba(10,10,30,0.85);
    backdrop-filter: blur(8px);
    padding: 80px 24px 24px;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.35s ease;
  }
  #heroBannersExpanded.open {
    display: flex;
    opacity: 1;
  }
  #heroBannersExpandedInner {
    display: flex;
    flex-direction: row;
    gap: 16px;
    overflow-x: auto;
    overflow-y: hidden;
    max-width: 100%;
    width: 100%;
    padding-bottom: 8px;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
  }
  #heroBannersExpandedInner::-webkit-scrollbar { height: 6px; }
  #heroBannersExpandedInner::-webkit-scrollbar-thumb { background: rgba(232,67,147,0.6); border-radius:3px; }
  .hero-banner-card {
    flex: 0 0 calc(25% - 12px);
    min-width: 220px;
    position: relative;
    border-radius: 20px;
    overflow: hidden;
    cursor: pointer;
    scroll-snap-align: start;
    box-shadow: 0 20px 50px rgba(0,0,0,0.4);
    transition: transform 0.25s ease, box-shadow 0.25s ease;
    text-decoration: none;
  }
  .hero-banner-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 30px 60px rgba(0,0,0,0.5);
  }
  .hero-banner-card img {
    width: 100%;
    height: 320px;
    object-fit: cover;
    display: block;
  }
  .hero-banner-card .banner-caption {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 60%, transparent 100%);
    padding: 40px 16px 16px;
    color: white;
  }
  .hero-banner-card .banner-caption .banner-subtitle {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: rgba(255,200,200,0.9);
    margin-bottom: 4px;
  }
  .hero-banner-card .banner-caption .banner-title {
    font-size: 15px;
    font-weight: 700;
    line-height: 1.3;
    margin-bottom: 4px;
  }
  .hero-banner-card .banner-caption .banner-price {
    font-size: 13px;
    font-weight: 700;
    color: #fda4af;
  }
  /* Close button for expanded */
  #heroBannersCloseBtn {
    position: absolute;
    top: 20px; right: 20px;
    width: 40px; height: 40px;
    border-radius: 50%;
    background: rgba(255,255,255,0.2);
    border: none;
    color: white;
    font-size: 18px;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.2s;
    backdrop-filter: blur(4px);
  }
  #heroBannersCloseBtn:hover { background: rgba(255,255,255,0.35); }
  #heroBannersExpandedTitle {
    color: white;
    font-size: 18px;
    font-weight: 700;
    margin-bottom: 20px;
    text-align: center;
    letter-spacing: 0.5px;
  }
  .hero-mobile-slider {
    display: flex;
    gap: 0.75rem;
    overflow-x: auto;
    overflow-y: hidden;
    scroll-snap-type: x proximity;
    -webkit-overflow-scrolling: touch;
    padding: 0.25rem 0 0.35rem;
    scrollbar-width: none;
    width: 100%;
    max-width: 100%;
  }
  .hero-mobile-slider::-webkit-scrollbar { display: none; }
  .hero-mobile-card {
    flex: 0 0 calc((100% - 1.5rem) / 3.15);
    min-width: 96px;
    max-width: 128px;
    scroll-snap-align: start;
    text-decoration: none;
  }
  .hero-mobile-card-button {
    display: block;
    width: 100%;
    border: 0;
    background: transparent;
    padding: 0;
    text-align: left;
    cursor: pointer;
  }
  .hero-mobile-card-thumb {
    width: 100%;
    aspect-ratio: 1 / 1;
    border-radius: 1rem;
    overflow: hidden;
    box-shadow: 0 10px 26px rgba(15,23,42,0.22);
    background: rgba(255,255,255,0.08);
  }
  .hero-mobile-card-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .hero-mobile-card-name {
    color: #fff;
    font-size: 11px;
    font-weight: 700;
    line-height: 1.3;
    margin-top: 0.5rem;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
    min-height: calc(1.3em * 2);
  }
  .hero-mobile-swipe-hint {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    margin: 0.65rem auto 0;
    color: rgba(255,255,255,0.78);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.01em;
    animation: swipeHintPulse 1.8s ease-in-out infinite;
  }
  @keyframes swipeHintPulse {
    0%, 100% { opacity: 0.55; transform: translateX(0); }
    35% { opacity: 1; transform: translateX(4px); }
    70% { opacity: 0.8; transform: translateX(-3px); }
  }
  /* Mobile: slider layout */
  @media (max-width: 768px) {
    #hero { min-height: auto; }
    #hero .hero-layout { padding-top: 1rem !important; padding-bottom: 1rem !important; gap: 1.5rem !important; }
    #hero .hero-copy-block .hero-mobile-sub { display: block !important; }
    #hero .hero-copy-block .hero-badge,
    #hero .hero-copy-block .hero-desktop-desc,
    #hero .hero-copy-block .hero-desktop-actions,
    #hero .hero-copy-block .hero-desktop-stats { display: none !important; }
    #hero .hero-copy-block { display: block; }
    #heroBannersWrapper {
      width: 100%;
      max-width: 100%;
      justify-content: flex-start;
      overflow: hidden;
    }
    #heroBannersCollapsed {
      width: 100%;
      max-width: 100%;
      height: auto;
      padding-bottom: 0 !important;
      overflow: hidden;
    }
    #heroBannersExpanded {
      display: none !important;
      opacity: 0 !important;
      pointer-events: none !important;
    }
    #searchInput { font-size: 16px !important; }
  }
</style>
</head>
<body class="bg-gray-50 overflow-x-hidden">

<!-- NAVBAR -->
<nav class="navbar-blur fixed top-0 left-0 right-0 z-50 border-b border-white/10">
  <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
    <a href="/" class="flex items-center gap-1.5 md:gap-1">
      <span class="inline-flex items-center justify-center"><img src="/qh-logo.png" alt="QH" class="rounded-full w-9 h-9 object-cover bg-white"></span><span class="hidden md:inline text-xl font-display text-white font-bold tracking-normal md:ml-0.5"><span class="text-pink-400">Clothes</span></span>
    </a>
    <div class="hidden md:flex items-center gap-6 text-sm text-gray-300">
      <a href="#products" class="hover:text-pink-400 transition">Sản phẩm</a>
      <a href="#about" class="hover:text-pink-400 transition">Về chúng tôi</a>
      <a href="#contact" class="hover:text-pink-400 transition">Liên hệ</a>
    </div>
    <div class="flex items-center gap-3">
      <button onclick="openCart()" id="cartNavBtn" class="relative text-white hover:text-pink-400 transition p-2">
        <i class="fas fa-shopping-bag text-xl"></i>
        <span id="cartBadge" class="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center hidden font-bold">0</span>
      </button>
      <!-- Wallet / Top-up -->
      <button onclick="openTopupModal()" id="walletNavBtn" class="hidden items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-xl transition text-xs font-medium">
        <i class="fas fa-wallet text-pink-400"></i>
        <span id="walletBalanceNav">0đ</span>
      </button>
      <!-- User Avatar / Login -->
      <button onclick="toggleUserMenu()" id="userAvatarBtn" class="relative text-white hover:text-pink-400 transition p-1">
        <div id="userAvatarDefault" class="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
          <i class="fas fa-user text-sm"></i>
        </div>
        <img id="userAvatarImg" src="" alt="" class="w-8 h-8 rounded-full object-cover border-2 border-pink-400 hidden">
      </button>
      <a href="/admin" id="adminNavLink" class="text-gray-400 hover:text-white transition p-2 hidden" title="Admin">
        <i class="fas fa-user-shield"></i>
      </a>
      <button class="md:hidden text-white p-2" onclick="toggleMobileMenu()">
        <i class="fas fa-bars text-xl"></i>
      </button>
    </div>
  </div>
  <!-- Mobile menu -->
  <div id="mobileMenu" class="hidden md:hidden border-t border-white/10 py-4 px-4 flex flex-col gap-3">
    <a href="#products" class="text-gray-300 hover:text-pink-400" onclick="toggleMobileMenu()">Sản phẩm</a>
    <a href="#about" class="text-gray-300 hover:text-pink-400" onclick="toggleMobileMenu()">Về chúng tôi</a>
    <a href="#contact" class="text-gray-300 hover:text-pink-400" onclick="toggleMobileMenu()">Liên hệ</a>
  </div>
</nav>

<!-- HERO -->
<section class="gradient-hero min-h-screen flex items-center pt-16" id="hero">
  <div class="max-w-7xl mx-auto px-4 py-20 grid md:grid-cols-2 gap-12 items-center hero-layout">
    <div class="hero-copy-block">
      <p class="hero-badge text-pink-400 font-medium tracking-widest uppercase text-sm mb-4">Bộ sưu tập mới 2026</p>
      <h1 class="font-display text-5xl md:text-6xl text-white font-bold leading-tight mb-6">
        Phong Cách<br><span style="background:linear-gradient(135deg,#e84393,#f39c12);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent">Không Giới Hạn</span>
      </h1>
      <p class="hero-mobile-sub hidden text-gray-300 text-sm leading-relaxed mb-5">Đây là những sản phẩm hot nhất và đang được đặt mua nhiều nhất ở thời điểm hiện tại.</p>
      <p class="hero-desktop-desc text-gray-300 text-lg mb-8 leading-relaxed">Khám phá bộ sưu tập thời trang cao cấp dành cho cả nam lẫn nữ. Chất lượng vải premium, thiết kế tinh tế – thể hiện cá tính của bạn.</p>
      <div class="hero-desktop-actions flex gap-4 flex-wrap">
        <a href="#products" class="btn-primary text-white px-8 py-3 rounded-full font-semibold">
          <i class="fas fa-shopping-bag mr-2"></i>Mua sắm ngay
        </a>
        <a href="#about" class="border border-white/30 text-white px-8 py-3 rounded-full font-semibold hover:bg-white/10 transition">
          Khám phá thêm
        </a>
      </div>
      <div class="hero-desktop-stats mt-12 grid grid-cols-3 gap-6">
        <div class="text-center"><p class="text-3xl font-bold text-white">500+</p><p class="text-gray-400 text-sm">Sản phẩm</p></div>
        <div class="text-center"><p class="text-3xl font-bold text-white">10K+</p><p class="text-gray-400 text-sm">Khách hàng</p></div>
        <div class="text-center"><p class="text-3xl font-bold text-white">4.9★</p><p class="text-gray-400 text-sm">Đánh giá</p></div>
      </div>
    </div>
    <div class="flex justify-center" id="heroBannersWrapper">
      <!-- Collapsed / stacked state -->
      <div id="heroBannersCollapsed" title="Click để xem thêm">
        <!-- will be rendered by JS -->
        <div class="relative w-80 h-96">
          <div class="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-purple-600/20 rounded-3xl rotate-6"></div>
          <div class="relative rounded-3xl w-full h-full bg-gray-700/40 shadow-2xl flex items-center justify-center">
            <i class="fas fa-spinner fa-spin text-white text-3xl"></i>
          </div>
        </div>
      </div>
    </div>

    <!-- Expanded fullscreen overlay -->
    <div id="heroBannersExpanded" onclick="handleBannerOverlayClick(event)">
      <p id="heroBannersExpandedTitle">🔥 Đang thịnh hành</p>
      <p id="heroBannersExpandedSubtitle" class="text-white/70 text-xs md:text-sm text-center mb-4">Đây là những sản phẩm hot nhất và đang được đặt mua nhiều nhất ở thời điểm hiện tại.</p>
      <div id="heroBannersExpandedInner">
        <!-- filled by JS -->
      </div>
    </div>
  </div>
</section>

<!-- FILTER BAR -->
<section class="sticky top-16 z-40 bg-white shadow-sm border-b" id="filterBar">
  <div class="max-w-7xl mx-auto px-4 py-3 flex gap-3 overflow-x-auto scrollbar-none items-center">
    <span class="text-sm text-gray-500 whitespace-nowrap font-medium">Lọc:</span>
    <button class="filter-btn active whitespace-nowrap px-4 py-1.5 rounded-full border text-sm font-medium transition" data-cat="all" onclick="filterProducts('all',this)">Tất cả</button>
    <button class="filter-btn whitespace-nowrap px-4 py-1.5 rounded-full border text-sm font-medium transition text-gray-600 hover:border-red-400" data-cat="unisex" onclick="filterProducts('unisex',this)">Unisex</button>
    <button class="filter-btn whitespace-nowrap px-4 py-1.5 rounded-full border text-sm font-medium transition text-gray-600 hover:border-red-400" data-cat="male" onclick="filterProducts('male',this)">Nam</button>
    <button class="filter-btn whitespace-nowrap px-4 py-1.5 rounded-full border text-sm font-medium transition text-gray-600 hover:border-red-400" data-cat="female" onclick="filterProducts('female',this)">Nữ</button>
    <div class="flex-1"></div>
    <div class="relative">
      <input type="text" id="searchInput" placeholder="Tìm sản phẩm..." 
        class="pl-8 pr-4 py-1.5 border rounded-full text-sm focus:outline-none focus:border-pink-400 w-48"
        oninput="searchProducts(this.value)">
      <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
    </div>
  </div>
</section>

<!-- PRODUCTS -->
<section class="max-w-7xl mx-auto px-4 py-16" id="products">
  <div class="text-center mb-12">
    <p class="text-pink-500 font-medium tracking-widest uppercase text-sm">Khám phá ngay</p>
    <h2 class="font-display text-4xl font-bold text-gray-900 mt-2">Sản Phẩm Nổi Bật</h2>
    <p class="text-gray-500 mt-3">Những thiết kế được yêu thích nhất từ bộ sưu tập của chúng tôi</p>
  </div>
  <div id="productsGrid" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
    <!-- skeleton placeholders -->
    
    <div class="skeleton rounded-2xl h-80"></div>
    <div class="skeleton rounded-2xl h-80"></div>
    <div class="skeleton rounded-2xl h-80"></div>
    <div class="skeleton rounded-2xl h-80"></div>
  </div>
  <div id="emptyState" class="hidden text-center py-20">
    <i class="fas fa-box-open text-6xl text-gray-300 mb-4"></i>
    <p class="text-gray-400 text-lg">Không tìm thấy sản phẩm nào</p>
  </div>
</section>

<!-- FEATURES SECTION -->
<section class="bg-white py-16" id="about">
  <div class="max-w-7xl mx-auto px-4">
    <div class="grid md:grid-cols-4 gap-8 text-center">
      <div class="p-6"><div class="w-14 h-14 bg-pink-50 rounded-2xl flex items-center justify-center mx-auto mb-4"><i class="fas fa-truck text-pink-500 text-2xl"></i></div><h3 class="font-semibold text-gray-800 mb-2">Giao hàng toàn quốc</h3><p class="text-gray-500 text-sm">Giao tận nơi, nhanh chóng, an toàn</p></div>
      <div class="p-6"><div class="w-14 h-14 bg-pink-50 rounded-2xl flex items-center justify-center mx-auto mb-4"><i class="fas fa-shield-alt text-pink-500 text-2xl"></i></div><h3 class="font-semibold text-gray-800 mb-2">Chất lượng đảm bảo</h3><p class="text-gray-500 text-sm">100% vải cao cấp, kiểm định chặt chẽ</p></div>
      <div class="p-6"><div class="w-14 h-14 bg-pink-50 rounded-2xl flex items-center justify-center mx-auto mb-4"><i class="fas fa-undo text-pink-500 text-2xl"></i></div><h3 class="font-semibold text-gray-800 mb-2">Đổi trả dễ dàng</h3><p class="text-gray-500 text-sm">7 ngày đổi trả, không cần lý do</p></div>
      <div class="p-6"><div class="w-14 h-14 bg-pink-50 rounded-2xl flex items-center justify-center mx-auto mb-4"><i class="fas fa-headset text-pink-500 text-2xl"></i></div><h3 class="font-semibold text-gray-800 mb-2">Hỗ trợ 24/7</h3><p class="text-gray-500 text-sm">Tư vấn nhiệt tình, tận tâm</p></div>
    </div>
  </div>
</section>

<!-- FOOTER -->
<footer class="gradient-hero text-white py-12" id="contact">
  <div class="max-w-7xl mx-auto px-4 grid md:grid-cols-3 gap-8">
    <div>
      <h3 class="font-display text-2xl font-bold mb-4 flex items-center gap-2">
        <span class="logo-spinner"><img src="/qh-logo.png" alt="QH"></span>
        <span>QH<span class="text-pink-400">Clothes</span></span>
      </h3>
      <p class="text-gray-400 text-sm leading-relaxed">Thương hiệu thời trang Việt Nam cao cấp, mang phong cách hiện đại đến với mọi người.</p>
    </div>
    <div>
      <h4 class="font-semibold mb-4">Liên kết nhanh</h4>
      <div class="flex flex-col gap-2 text-gray-400 text-sm">
        <a href="#products" class="hover:text-pink-400 transition">Sản phẩm</a>
        <a href="#about" class="hover:text-pink-400 transition">Về chúng tôi</a>
        <a href="/admin" class="hover:text-pink-400 transition">Quản trị</a>
      </div>
    </div>
    <div>
      <h4 class="font-semibold mb-4">Liên hệ</h4>
      <div class="flex flex-col gap-2 text-gray-400 text-sm">
        <p><i class="fas fa-phone mr-2 text-pink-400"></i>0987 654 321</p>
        <p><i class="fas fa-envelope mr-2 text-pink-400"></i>hello@qhclothes.com</p>
        <p><i class="fas fa-map-marker-alt mr-2 text-pink-400"></i>TP. Hồ Chí Minh, Việt Nam</p>
      </div>
    </div>
  </div>
  <div class="max-w-7xl mx-auto px-4 mt-8 pt-8 border-t border-white/10 text-center text-gray-500 text-sm">
    © 2026 QH Clothes. All rights reserved.
  </div>
</footer>

<!-- ORDER POPUP -->
<div id="orderOverlay" class="fixed inset-0 overlay z-50 hidden flex items-center justify-center p-4">
  <div class="popup-card bg-white rounded-3xl shadow-2xl w-full max-w-md md:max-w-[56rem] max-h-[90vh] overflow-y-auto" id="orderPopupCard">
    <div class="sticky top-0 bg-white rounded-t-3xl border-b px-6 py-4 flex items-center justify-between">
      <h3 class="font-display text-xl font-bold text-gray-900">Đặt hàng nhanh</h3>
      <button onclick="closeOrder()" class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition">
        <i class="fas fa-times text-gray-600"></i>
      </button>
    </div>
    
    <div class="px-6 py-4">
      <!-- Product Preview -->
      <div id="orderProductPreview" class="flex gap-3 p-3 bg-gray-50 rounded-2xl mb-5">
        <img id="orderProductImg" src="" alt="" class="w-16 h-20 object-cover rounded-xl">
        <div>
          <p id="orderProductName" class="font-semibold text-gray-800 text-sm"></p>
          <p id="orderProductPrice" class="text-pink-600 font-bold mt-1"></p>
        </div>
      </div>

      <div class="space-y-4">
        <!-- Họ tên -->
        <div id="fieldName">
          <label class="block text-sm font-semibold text-gray-700 mb-1.5 field-title">
            <i class="fas fa-user text-pink-400 mr-1"></i>Họ và tên *
          </label>
          <input type="text" id="orderName" placeholder="Nhập họ và tên"
            class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-200">
        </div>
        <!-- SĐT -->
        <div id="fieldPhone">
          <label class="block text-sm font-semibold text-gray-700 mb-1.5 field-title">
            <i class="fas fa-phone text-pink-400 mr-1"></i>Số điện thoại *
          </label>
          <input type="tel" id="orderPhone" placeholder="0987 654 321"
            class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-200">
        </div>
        <!-- Địa chỉ -->
        <div id="fieldAddress">
          <label class="block text-sm font-semibold text-gray-700 mb-1.5 field-title">
            <i class="fas fa-map-marker-alt text-pink-400 mr-1"></i>Địa chỉ giao hàng *
          </label>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            <div id="orderProvinceDropdown" class="relative">
              <button type="button" id="orderProvinceTrigger" onclick="toggleAddressDropdown('order','province')"
                class="w-full border rounded-xl px-3.5 py-2.5 text-sm bg-white text-left flex items-center justify-between focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-200">
                <span id="orderProvinceLabel" class="text-gray-500">Chọn tỉnh/thành</span>
                <i class="fas fa-chevron-down text-gray-400 text-xs"></i>
              </button>
              <div id="orderProvinceMenu" class="hidden absolute z-[90] mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                <div class="p-2 border-b bg-gray-50">
                  <input type="text" id="orderProvinceSearch" placeholder="Tìm tỉnh/thành..."
                    oninput="onAddressDropdownSearchInput('order','province')"
                    class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-200">
                </div>
                <div id="orderProvinceOptions" class="max-h-56 overflow-auto"></div>
              </div>
              <select id="orderProvince" onchange="onAddressProvinceChange('order')" class="hidden">
                <option value="">Chọn tỉnh/thành</option>
              </select>
            </div>
            <div id="orderCommuneDropdown" class="relative">
              <button type="button" id="orderCommuneTrigger" onclick="toggleAddressDropdown('order','commune')"
                class="w-full border rounded-xl px-3.5 py-2.5 text-sm bg-white text-left flex items-center justify-between focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-200">
                <span id="orderCommuneLabel" class="text-gray-500">Chọn phường/xã</span>
                <i class="fas fa-chevron-down text-gray-400 text-xs"></i>
              </button>
              <div id="orderCommuneMenu" class="hidden absolute z-[90] mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                <div class="p-2 border-b bg-gray-50">
                  <input type="text" id="orderCommuneSearch" placeholder="Tìm phường/xã..."
                    oninput="onAddressDropdownSearchInput('order','commune')"
                    class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-200">
                </div>
                <div id="orderCommuneOptions" class="max-h-56 overflow-auto"></div>
              </div>
              <select id="orderCommune" onchange="onAddressCommuneChange('order')" class="hidden">
                <option value="">Chọn phường/xã</option>
              </select>
            </div>
          </div>
          <input type="text" id="orderAddressDetail"
            placeholder="Số nhà, tên đường..."
            class="mt-2.5 w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-200"
            oninput="clearFieldError('fieldAddress'); syncAddressFullText('order')">
          <input type="text" id="orderAddress"
            readonly
            placeholder="Địa chỉ đầy đủ sẽ tự động ghép tại đây"
            class="mt-2.5 w-full border rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-600 focus:outline-none">
        </div>
        
        <!-- Color -->
        <div id="fieldColor">
          <label class="block text-sm font-semibold text-gray-700 mb-2 field-title">
            <i class="fas fa-palette text-pink-400 mr-1"></i>Màu sắc *
          </label>
          <div id="colorOptions" class="flex flex-wrap gap-2"></div>
        </div>
        
        <!-- Size -->
        <div id="sizeSection">
          <label class="block text-sm font-semibold text-gray-700 mb-2 field-title">
            <i class="fas fa-ruler text-pink-400 mr-1"></i>Size *
          </label>
          <div id="sizeOptions" class="flex flex-wrap gap-2"></div>
        </div>
        
        <!-- Quantity -->
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            <i class="fas fa-sort-numeric-up text-pink-400 mr-1"></i>Số lượng
          </label>
          <div class="flex items-center gap-3">
            <button onclick="changeQty(-1)" class="w-9 h-9 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-pink-400 hover:text-pink-500 transition font-bold">−</button>
            <span id="qtyDisplay" class="text-xl font-bold w-8 text-center">1</span>
            <button onclick="changeQty(1)" class="w-9 h-9 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-pink-400 hover:text-pink-500 transition font-bold">+</button>
          </div>
        </div>
        
        <!-- Voucher -->
        <div id="fieldVoucher">
          <label class="block text-sm font-semibold text-gray-700 mb-1.5 field-title">
            <i class="fas fa-tag text-pink-400 mr-1"></i>Mã giảm giá (tuỳ chọn)
          </label>
          <div class="flex gap-2">
            <input type="text" id="orderVoucher" placeholder="Nhập mã voucher..."
              class="flex-1 border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-200 uppercase tracking-wider"
              oninput="this.value=this.value.toUpperCase()">
            <button onclick="applyVoucher()" id="voucherBtn"
              class="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-sm font-semibold transition whitespace-nowrap">
              Áp dụng
            </button>
          </div>
          <div id="voucherStatus" class="mt-2 hidden"></div>
        </div>
        
        <!-- Note -->
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1.5">
            <i class="fas fa-sticky-note text-pink-400 mr-1"></i>Ghi chú (tuỳ chọn)
          </label>
          <input type="text" id="orderNote" placeholder="Ghi chú cho đơn hàng..."
            class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-200">
        </div>

        <div id="fieldPaymentMethod">
          <label class="block text-sm font-semibold text-gray-700 mb-1.5 field-title">
            <i class="fas fa-credit-card text-pink-400 mr-1"></i>Chọn phương thức thanh toán *
          </label>
          <p class="text-xs text-red-500 mb-2">Trường này là bắt buộc</p>
          <div class="space-y-2">
            <button type="button" class="payment-method-btn w-full flex items-center gap-3 border rounded-xl px-3 py-2.5 text-left hover:border-pink-400 transition"
              onclick="selectPaymentMethod('COD', this)">
              <span class="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                <i class="fas fa-money-bill-wave"></i>
              </span>
              <span>
                <span class="block text-sm font-semibold text-gray-800">COD</span>
                <span class="block text-xs text-gray-500">Thanh toán khi giao</span>
              </span>
            </button>

            <button type="button" class="payment-method-btn w-full flex items-center gap-3 border rounded-xl px-3 py-2.5 text-left hover:border-pink-400 transition"
              onclick="selectPaymentMethod('BANK_TRANSFER', this)">
              <span class="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <i class="fas fa-university"></i>
              </span>
              <span>
                <span class="block text-sm font-semibold text-gray-800">Chuyển khoản ngân hàng</span>
                <span class="block text-xs text-gray-500">Chuyển khoản trực tiếp</span>
              </span>
            </button>

            <div class="payment-method-unavailable w-full flex items-center gap-2 border rounded-xl px-3 py-2.5 transition" aria-disabled="true">
              <button type="button" class="payment-method-btn flex-1 flex items-center gap-3 text-left border rounded-lg px-2 py-1.5" tabindex="-1" disabled>
                <span class="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">ZP</span>
                <span>
                  <span class="block text-sm font-semibold text-gray-800">Zalopay</span>
                  <span class="payment-method-badge block text-xs text-gray-500 mt-0.5">Không khả dụng</span>
                </span>
              </button>
              <button type="button" class="text-sm font-semibold text-blue-600 flex items-center gap-1" tabindex="-1" disabled>
                Liên kết <i class="fas fa-chevron-right text-xs"></i>
              </button>
            </div>

            <div class="payment-method-unavailable w-full flex items-center gap-3 border rounded-xl px-3 py-2.5 transition" aria-disabled="true">
              <button type="button" class="payment-method-btn flex-1 flex items-center gap-3 text-left border rounded-lg px-2 py-1.5" tabindex="-1" disabled>
                <span class="w-8 h-8 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center">
                  <i class="fas fa-wallet"></i>
                </span>
                <span>
                  <span class="block text-sm font-semibold text-gray-800">Ví điện tử MoMo</span>
                  <span class="payment-method-badge block text-xs text-gray-500 mt-0.5">Không khả dụng</span>
                </span>
              </button>
            </div>
          </div>
        </div>
        
        <!-- Total -->
        <div class="bg-gradient-to-r from-pink-50 to-red-50 rounded-2xl p-4 space-y-1.5">
          <div id="subtotalRow" class="flex justify-between items-center hidden">
            <span class="text-sm text-gray-500">Tạm tính:</span>
            <span id="orderSubtotal" class="text-sm font-semibold text-gray-700">0đ</span>
          </div>
          <div id="discountRow" class="flex justify-between items-center hidden">
            <span class="text-sm text-green-600 font-medium"><i class="fas fa-tag mr-1"></i>Giảm giá:</span>
            <span id="orderDiscount" class="text-sm font-bold text-green-600">-0đ</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="font-semibold text-gray-700">Tổng cộng:</span>
            <span id="orderTotal" class="text-2xl font-bold text-pink-600">0đ</span>
          </div>
        </div>
        
        <div class="flex gap-2">
          <button onclick="addCurrentToCart()" id="addToCartBtn"
            class="flex-shrink-0 flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-3.5 rounded-xl font-semibold text-sm transition">
            <i class="fas fa-shopping-bag"></i><span class="hidden sm:inline">Giỏ hàng</span>
          </button>
          <button onclick="submitOrder()" id="submitOrderBtn"
            class="btn-primary flex-1 text-white py-3.5 rounded-xl font-bold text-base">
            <i class="fas fa-bolt mr-2"></i>Đặt ngay
          </button>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- ORDER BANK TRANSFER QR MODAL -->
<div id="orderBankTransferOverlay" class="fixed inset-0 overlay z-[70] hidden flex items-center justify-center p-4">
  <div class="popup-card bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[92vh] overflow-y-auto">
    <div class="sticky top-0 bg-white rounded-t-3xl border-b px-6 py-4 flex items-center justify-between">
      <h3 class="font-display text-xl font-bold text-gray-900">
        <i class="fas fa-qrcode text-pink-500 mr-2"></i>Quét mã QR để thanh toán
      </h3>
      <button onclick="closeOrderBankTransferModal()" class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition">
        <i class="fas fa-times text-gray-600"></i>
      </button>
    </div>
    <div class="px-6 py-5">
      <div class="border rounded-2xl p-4 bg-gray-50">
        <div class="flex justify-center mb-3">
          <img id="orderBankQrImg" src="" alt="VietQR thanh toán đơn hàng" class="w-56 h-56 object-contain rounded-xl border bg-white">
        </div>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between items-center bg-white rounded-lg px-3 py-2 border">
            <span class="text-gray-500">Ngân hàng</span>
            <span class="font-bold text-gray-800">MB Bank</span>
          </div>
          <div class="flex justify-between items-center bg-white rounded-lg px-3 py-2 border">
            <span class="text-gray-500">Số TK</span>
            <span class="font-bold text-gray-800">
              <span id="orderBankAccountNo"></span>
              <button type="button" class="ml-1 text-gray-400 hover:text-gray-600" onclick="copyBankValue(document.getElementById('orderBankAccountNo').textContent)">
                <i class="fas fa-copy"></i>
              </button>
            </span>
          </div>
          <div class="flex justify-between items-center bg-white rounded-lg px-3 py-2 border">
            <span class="text-gray-500">Chủ TK</span>
            <span class="font-bold text-gray-800" id="orderBankAccountName"></span>
          </div>
          <div class="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <p class="text-amber-700 text-xs font-semibold mb-1">Nội dung CK (BẮT BUỘC)</p>
            <div class="flex items-center justify-between">
              <span id="orderBankTransferContent" class="font-mono font-bold text-amber-800"></span>
              <button type="button" class="text-amber-500 hover:text-amber-700" onclick="copyBankValue(document.getElementById('orderBankTransferContent').textContent)">
                <i class="fas fa-copy"></i>
              </button>
            </div>
          </div>
          <div class="flex justify-between items-center bg-white rounded-lg px-3 py-2 border">
            <span class="text-gray-500">Số tiền</span>
            <span class="font-bold text-pink-600" id="orderBankAmountDisplay"></span>
          </div>
          <div class="flex justify-between items-center bg-white rounded-lg px-3 py-2 border">
            <span class="text-gray-500">Mã đơn</span>
            <span class="font-mono font-bold text-blue-600" id="orderBankOrderCode"></span>
          </div>
        </div>
      </div>
      <div class="mt-4 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 text-xs text-blue-700">
        Sau khi chuyển khoản, đơn hàng sẽ được xác nhận khi shop đối soát giao dịch.
      </div>
    </div>
  </div>
</div>

<div id="orderPaidNoticeOverlay" class="fixed inset-0 z-[80] hidden items-center justify-center bg-black/30 p-4">
  <div class="bg-white rounded-2xl shadow-2xl w-full max-w-xs p-5 text-center">
    <div class="w-12 h-12 mx-auto mb-3 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
      <i class="fas fa-check text-xl"></i>
    </div>
    <p class="text-green-600 font-bold text-lg">Đã thanh toán thành công</p>
    <p class="text-sm text-gray-600 mt-1">Đơn hàng đã được ghi nhận.</p>
    <p class="text-xs font-mono text-blue-600 mt-2" id="orderPaidNoticeCode"></p>
  </div>
</div>

<div id="shippingJourneyOverlay" class="fixed inset-0 hidden items-center justify-center bg-black/30 p-4" style="z-index:85;" onclick="handleShippingJourneyOverlayClick(event)">
  <div class="popup-card bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[88vh] overflow-y-auto">
    <div class="sticky top-0 bg-white rounded-t-3xl border-b px-6 py-4 flex items-center justify-between">
      <h3 class="font-display text-xl font-bold text-gray-900">
        <i class="fas fa-route text-pink-500 mr-2"></i>Hành trình vận chuyển
      </h3>
      <button onclick="closeShippingJourneyModal()" class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition">
        <i class="fas fa-times text-gray-600"></i>
      </button>
    </div>
    <div id="shippingJourneyContent" class="px-6 py-5"></div>
  </div>
</div>

<!-- PRODUCT DETAIL POPUP -->
<div id="detailOverlay" class="fixed inset-0 overlay hidden flex items-center justify-center p-4" style="z-index:1001;">
  <div class="popup-card bg-white rounded-3xl shadow-2xl w-full max-w-md md:max-w-[56rem] max-h-[90vh] overflow-y-auto">
    <div class="sticky top-0 bg-white rounded-t-3xl border-b px-6 py-4 flex items-center justify-between">
      <h3 class="font-display text-xl font-bold text-gray-900">Chi tiết sản phẩm</h3>
      <button onclick="closeDetail()" class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition">
        <i class="fas fa-times text-gray-600"></i>
      </button>
    </div>
    <div id="detailContent" class="px-6 py-4"></div>
  </div>
</div>

<!-- CART MODAL (full-screen, slide from right) -->
<div id="cartOverlay" class="fixed inset-0 overlay z-50 hidden" onclick="handleCartOverlayClick(event)">
  <div id="cartModal" class="cart-modal absolute right-0 top-0 bottom-0 w-full max-w-lg bg-white flex flex-col shadow-2xl">
    
    <!-- Cart Header -->
    <div id="cartHeader" class="flex items-center justify-between px-5 py-4 border-b bg-gradient-to-r from-gray-900 to-gray-800 text-white flex-shrink-0">
      <div class="flex items-center gap-3">
        <button id="cartBackBtn" onclick="cartGoBack()" class="hidden w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition">
          <i class="fas fa-arrow-left text-sm"></i>
        </button>
        <div>
          <h2 id="cartTitle" class="font-display text-lg font-bold">Giỏ hàng</h2>
          <p id="cartSubtitle" class="text-xs text-gray-300">Chưa có sản phẩm</p>
        </div>
      </div>
      <button onclick="closeCart()" class="w-9 h-9 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition">
        <i class="fas fa-times"></i>
      </button>
    </div>

    <!-- STEP 1: Cart items list -->
    <div id="cartStep1" class="flex flex-col flex-1 overflow-hidden">
      <!-- Check all bar -->
      <div id="cartCheckAllBar" class="hidden flex items-center gap-3 px-5 py-3 bg-gray-50 border-b flex-shrink-0">
        <label class="flex items-center gap-2 cursor-pointer select-none">
          <input type="checkbox" id="checkAll" onchange="toggleCheckAll(this)" class="w-4 h-4 accent-pink-500 cursor-pointer">
          <span class="text-sm font-medium text-gray-700">Chọn tất cả</span>
        </label>
        <span id="selectedCount" class="ml-auto text-xs text-gray-400"></span>
        <button onclick="removeChecked()" id="deleteCheckedBtn" class="hidden text-xs text-red-500 hover:text-red-600 font-medium transition">
          <i class="fas fa-trash mr-1"></i>Xoá đã chọn
        </button>
      </div>

      <!-- Items scroll area -->
      <div id="cartItemsList" class="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        <!-- filled dynamically -->
      </div>

      <!-- Cart Footer -->
      <div id="cartFooter" class="hidden flex-shrink-0 border-t bg-white px-5 py-4">
        <div class="flex items-center justify-between mb-3">
          <span class="text-gray-600 font-medium">Tổng cộng (<span id="cartSelectedItems">0</span> sản phẩm):</span>
          <span id="cartTotalPrice" class="text-xl font-bold text-pink-600">0đ</span>
        </div>
        <button onclick="proceedToCheckout()" id="checkoutBtn"
          class="btn-primary w-full text-white py-3.5 rounded-xl font-bold text-base disabled:opacity-50">
          <i class="fas fa-credit-card mr-2"></i>Xác nhận & Đặt hàng
        </button>
      </div>
    </div>

    <!-- STEP 2: Checkout form -->
    <div id="cartStep2" class="hidden flex-col flex-1 overflow-hidden checkout-slide">
      <!-- Order summary mini -->
      <div id="checkoutSummary" class="flex-shrink-0 bg-gray-50 border-b px-5 py-3 overflow-x-auto">
        <div id="checkoutSummaryItems" class="flex gap-3 min-w-max"></div>
      </div>

      <!-- Form -->
      <div class="flex-1 overflow-y-auto px-5 py-4">
        <h3 class="font-display text-base font-bold text-gray-800 mb-4">Thông tin giao hàng</h3>
        <div class="space-y-4">
          <!-- Họ tên -->
          <div id="ckFieldName">
            <label class="block text-sm font-semibold text-gray-700 mb-1.5 field-title">
              <i class="fas fa-user text-pink-400 mr-1"></i>Họ và tên *
            </label>
            <input type="text" id="ckName" placeholder="Nhập họ và tên"
              class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-200"
              oninput="clearCheckoutError('ckFieldName')">
          </div>
          <!-- SĐT -->
          <div id="ckFieldPhone">
            <label class="block text-sm font-semibold text-gray-700 mb-1.5 field-title">
              <i class="fas fa-phone text-pink-400 mr-1"></i>Số điện thoại *
            </label>
            <input type="tel" id="ckPhone" placeholder="0987 654 321"
              class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-200"
              oninput="clearCheckoutError('ckFieldPhone')">
          </div>
          <!-- Địa chỉ -->
          <div id="ckFieldAddress">
            <label class="block text-sm font-semibold text-gray-700 mb-1.5 field-title">
              <i class="fas fa-map-marker-alt text-pink-400 mr-1"></i>Địa chỉ giao hàng *
            </label>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              <div id="ckProvinceDropdown" class="relative">
                <button type="button" id="ckProvinceTrigger" onclick="toggleAddressDropdown('ck','province')"
                  class="w-full border rounded-xl px-3.5 py-2.5 text-sm bg-white text-left flex items-center justify-between focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-200">
                  <span id="ckProvinceLabel" class="text-gray-500">Chọn tỉnh/thành</span>
                  <i class="fas fa-chevron-down text-gray-400 text-xs"></i>
                </button>
                <div id="ckProvinceMenu" class="hidden absolute z-[90] mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                  <div class="p-2 border-b bg-gray-50">
                    <input type="text" id="ckProvinceSearch" placeholder="Tìm tỉnh/thành..."
                      oninput="onAddressDropdownSearchInput('ck','province')"
                      class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-200">
                  </div>
                  <div id="ckProvinceOptions" class="max-h-56 overflow-auto"></div>
                </div>
                <select id="ckProvince" onchange="onAddressProvinceChange('ck')" class="hidden">
                  <option value="">Chọn tỉnh/thành</option>
                </select>
              </div>
              <div id="ckCommuneDropdown" class="relative">
                <button type="button" id="ckCommuneTrigger" onclick="toggleAddressDropdown('ck','commune')"
                  class="w-full border rounded-xl px-3.5 py-2.5 text-sm bg-white text-left flex items-center justify-between focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-200">
                  <span id="ckCommuneLabel" class="text-gray-500">Chọn phường/xã</span>
                  <i class="fas fa-chevron-down text-gray-400 text-xs"></i>
                </button>
                <div id="ckCommuneMenu" class="hidden absolute z-[90] mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                  <div class="p-2 border-b bg-gray-50">
                    <input type="text" id="ckCommuneSearch" placeholder="Tìm phường/xã..."
                      oninput="onAddressDropdownSearchInput('ck','commune')"
                      class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-200">
                  </div>
                  <div id="ckCommuneOptions" class="max-h-56 overflow-auto"></div>
                </div>
                <select id="ckCommune" onchange="onAddressCommuneChange('ck')" class="hidden">
                  <option value="">Chọn phường/xã</option>
                </select>
              </div>
            </div>
            <input type="text" id="ckAddressDetail"
              placeholder="Số nhà, tên đường..."
              class="mt-2.5 w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-200"
              oninput="clearCheckoutError('ckFieldAddress'); syncAddressFullText('ck')">
            <input type="text" id="ckAddress"
              readonly
              placeholder="Địa chỉ đầy đủ sẽ tự động ghép tại đây"
              class="mt-2.5 w-full border rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-600 focus:outline-none">
          </div>
          <!-- Voucher -->
          <div id="ckFieldVoucher">
            <label class="block text-sm font-semibold text-gray-700 mb-1.5">
              <i class="fas fa-tag text-pink-400 mr-1"></i>Mã giảm giá (tuỳ chọn)
            </label>
            <div class="flex gap-2">
              <input type="text" id="ckVoucher" placeholder="Nhập mã voucher..."
                class="flex-1 border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-200 uppercase tracking-wider"
                oninput="this.value=this.value.toUpperCase()">
              <button onclick="applyCkVoucher()" id="ckVoucherBtn"
                class="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-sm font-semibold transition whitespace-nowrap">
                Áp dụng
              </button>
            </div>
            <div id="ckVoucherStatus" class="mt-2 hidden"></div>
          </div>
          <!-- Note -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1.5">
              <i class="fas fa-sticky-note text-pink-400 mr-1"></i>Ghi chú (tuỳ chọn)
            </label>
            <input type="text" id="ckNote" placeholder="Ghi chú cho đơn hàng..."
              class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-200">
          </div>
          <!-- Total box -->
          <div class="bg-gradient-to-r from-pink-50 to-red-50 rounded-2xl p-4 space-y-1.5">
            <div id="ckSubtotalRow" class="hidden flex justify-between items-center">
              <span class="text-sm text-gray-500">Tạm tính:</span>
              <span id="ckSubtotal" class="text-sm font-semibold text-gray-700">0đ</span>
            </div>
            <div id="ckDiscountRow" class="hidden flex justify-between items-center">
              <span class="text-sm text-green-600 font-medium"><i class="fas fa-tag mr-1"></i>Giảm giá:</span>
              <span id="ckDiscount" class="text-sm font-bold text-green-600">-0đ</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="font-semibold text-gray-700">Tổng cộng:</span>
              <span id="ckTotal" class="text-2xl font-bold text-pink-600">0đ</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Submit button -->
      <div class="flex-shrink-0 border-t bg-white px-5 py-4">
        <button onclick="submitCartOrder()" id="submitCartBtn"
          class="btn-primary w-full text-white py-3.5 rounded-xl font-bold text-base">
          <i class="fas fa-shopping-cart mr-2"></i>Đặt hàng ngay
        </button>
      </div>
    </div>

  </div>
</div>

<!-- TOAST -->
<!-- USER MENU OVERLAY -->
<div id="userMenuOverlay" class="fixed inset-0 user-menu-overlay z-50 hidden" onclick="handleUserMenuOverlayClick(event)">
  <div id="userMenuPanel" class="user-menu-panel absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white flex flex-col shadow-2xl">
    <!-- Header -->
    <div class="bg-gradient-to-r from-gray-900 to-gray-800 text-white px-5 py-5 flex-shrink-0">
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-display text-lg font-bold">Tài khoản</h2>
        <button onclick="closeUserMenu()" class="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <!-- Guest state -->
      <div id="userMenuGuest">
        <p class="text-gray-300 text-sm mb-3">Đăng nhập để lưu lịch sử đơn hàng</p>
        <button onclick="loginWithGoogle()" class="w-full flex items-center justify-center gap-3 bg-white text-gray-800 px-4 py-3 rounded-xl font-semibold text-sm hover:bg-gray-100 transition">
          <svg width="18" height="18" viewBox="0 0 18 18"><path d="M17.6 9.2c0-.6-.1-1.2-.2-1.8H9v3.4h4.8c-.2 1.1-.8 2-1.7 2.6v2.2h2.8c1.6-1.5 2.7-3.7 2.7-6.4z" fill="#4285F4"/><path d="M9 18c2.4 0 4.5-.8 6-2.2l-2.8-2.2c-.8.6-1.9.9-3.2.9-2.5 0-4.5-1.7-5.3-3.9H.8v2.3C2.3 16 5.4 18 9 18z" fill="#34A853"/><path d="M3.7 10.7c-.2-.6-.3-1.2-.3-1.7s.1-1.2.3-1.7V5H.8C.3 6 0 7.2 0 9s.3 3 .8 4l2.9-2.3z" fill="#FBBC05"/><path d="M9 3.6c1.4 0 2.6.5 3.5 1.4l2.6-2.6C13.5.9 11.4 0 9 0 5.4 0 2.3 2 .8 5l2.9 2.3c.8-2.2 2.8-3.7 5.3-3.7z" fill="#EA4335"/></svg>
          Đăng nhập bằng Google
        </button>
      </div>
      <!-- Logged in state -->
      <div id="userMenuLoggedIn" class="hidden">
        <div class="flex items-center gap-3">
          <img id="userMenuAvatar" src="" class="w-12 h-12 rounded-full object-cover border-2 border-pink-400">
          <div>
            <p id="userMenuName" class="font-semibold"></p>
            <p id="userMenuEmail" class="text-gray-400 text-xs"></p>
          </div>
        </div>
      </div>
    </div>
    <!-- Menu Items -->
    <div class="flex-1 overflow-y-auto px-4 py-4">
      <nav class="space-y-1">
        <button onclick="showUserAccount()" class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-pink-50 hover:text-pink-600 transition text-sm font-medium text-left">
          <i class="fas fa-user-circle w-5 text-pink-400"></i>Quản lý tài khoản
        </button>
        <button onclick="showUserOrders()" id="userOrdersBtn" class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-pink-50 hover:text-pink-600 transition text-sm font-medium text-left">
          <i class="fas fa-clipboard-list w-5 text-pink-400"></i>Lịch sử mua hàng
        </button>
        <button onclick="showWalletInMenu()" class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-pink-50 hover:text-pink-600 transition text-sm font-medium text-left">
          <i class="fas fa-wallet w-5 text-pink-400"></i>Nạp tiền vào ví
          <span id="walletBalanceMenu" class="ml-auto text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-semibold">0đ</span>
        </button>
      </nav>
      <!-- Content area -->
      <div id="userMenuContent" class="mt-4"></div>
    </div>
    <!-- Logout (only when logged in) -->
    <div id="userMenuLogoutArea" class="hidden flex-shrink-0 border-t px-5 py-4">
      <button onclick="logoutUser()" class="w-full flex items-center justify-center gap-2 border-2 border-red-200 text-red-500 py-2.5 rounded-xl font-semibold text-sm hover:bg-red-50 transition">
        <i class="fas fa-sign-out-alt"></i>Đăng xuất
      </button>
    </div>
  </div>
</div>

<!-- TOAST -->
<div id="toastContainer" class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none"></div>

<script>
let allProducts = []
let filteredProducts = []
let currentProduct = null
let orderQty = 1
let selectedColor = ''
let orderColorOptions = []
let selectedSize = ''
let selectedPaymentMethod = ''
let pendingBankTransferOrder = null
let bankTransferPollTimer = null
let zaloPayLinkTab = null
let appliedVoucher = null   // { code, discount_amount }
let detailColorOptions = []
let detailSelectedColor = ''
let detailSelectedColorImage = ''
let detailSelectedColorIndex = -1
let detailSelectedSize = ''
let detailSelectedProductId = null
let userOrderHistoryCache = []

// ── CART STATE ─────────────────────────────────────
// cart = [{ cartId, productId, name, sku, thumbnail, price, color, size, qty, checked }]
let cart = []
let cartStep = 1  // 1=list, 2=checkout
let ckAppliedVoucher = null
let currentUser = null
let isAdminUser = false
let cartStorageKey = 'qhclothes_cart_guest'
const ADDRESS_EFFECTIVE_DATE = 'latest'
let addressProvinceOptions = []
let addressCommuneOptionsByProvince = {}
let addressKitLoadingPromise = null
let addressAutoFillInProgress = false
const addressDropdownSearchState = {}

function getAddressScopeElements(scope) {
  const isCart = scope === 'ck'
  return {
    fieldId: isCart ? 'ckFieldAddress' : 'fieldAddress',
    provinceId: isCart ? 'ckProvince' : 'orderProvince',
    communeId: isCart ? 'ckCommune' : 'orderCommune',
    detailId: isCart ? 'ckAddressDetail' : 'orderAddressDetail',
    fullAddressId: isCart ? 'ckAddress' : 'orderAddress'
  }
}

function getSelectedAddressOptionText(selectEl) {
  if (!selectEl) return ''
  const idx = selectEl.selectedIndex
  if (idx < 0 || !selectEl.options[idx]) return ''
  return String(selectEl.options[idx].textContent || '').trim()
}

function setAddressSelectOptions(selectEl, options, placeholder) {
  if (!selectEl) return
  const safeOptions = Array.isArray(options) ? options : []
  const previousValue = String(selectEl.value || '').trim()
  selectEl.innerHTML = '<option value="">' + placeholder + '</option>'
  safeOptions.forEach((item) => {
    if (!item || !item.code || !item.name) return
    const opt = document.createElement('option')
    opt.value = String(item.code)
    opt.textContent = String(item.name)
    selectEl.appendChild(opt)
  })
  if (previousValue && safeOptions.some((item) => String(item.code) === previousValue)) {
    selectEl.value = previousValue
  }
}

function normalizeSearchText(input) {
  return String(input || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\\u0300-\\u036f]/g, '')
    .trim()
}

function getAddressPreferenceKey() {
  if (isAdminUser) return 'qhclothes_saved_address_admin'
  const uid = Number(currentUser?.userId || currentUser?.id || 0)
  if (uid > 0) return 'qhclothes_saved_address_user_' + uid
  return 'qhclothes_saved_address_guest'
}

function saveAddressPreference(payload) {
  try {
    localStorage.setItem(getAddressPreferenceKey(), JSON.stringify({
      provinceCode: String(payload?.provinceCode || '').trim(),
      communeCode: String(payload?.communeCode || '').trim(),
      detail: String(payload?.detail || '').trim(),
      updatedAt: Date.now()
    }))
  } catch (_) { }
}

function loadAddressPreference() {
  try {
    const raw = localStorage.getItem(getAddressPreferenceKey())
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    const provinceCode = String(parsed.provinceCode || '').trim()
    const communeCode = String(parsed.communeCode || '').trim()
    const detail = String(parsed.detail || '').trim()
    if (!provinceCode || !communeCode || !detail) return null
    return { provinceCode, communeCode, detail }
  } catch (_) {
    return null
  }
}

function getFilteredAddressOptions(options, keyword) {
  const list = Array.isArray(options) ? options : []
  const q = normalizeSearchText(keyword)
  if (!q) return list
  return list.filter((item) => normalizeSearchText(item?.name || '').indexOf(q) >= 0)
}

function getAddressDropdownIds(scope, type) {
  const prefix = scope === 'ck' ? 'ck' : 'order'
  const part = type === 'province' ? 'Province' : 'Commune'
  const root = prefix + part
  return {
    dropdownId: root + 'Dropdown',
    triggerId: root + 'Trigger',
    labelId: root + 'Label',
    menuId: root + 'Menu',
    searchId: root + 'Search',
    optionsId: root + 'Options'
  }
}

function closeAddressDropdown(scope, type) {
  const ids = getAddressDropdownIds(scope, type)
  const menuEl = document.getElementById(ids.menuId)
  if (menuEl) menuEl.classList.add('hidden')
}

function closeAllAddressDropdowns() {
  ;[
    ['order', 'province'],
    ['order', 'commune'],
    ['ck', 'province'],
    ['ck', 'commune']
  ].forEach(([scope, type]) => closeAddressDropdown(scope, type))
}

function renderAddressDropdownList(scope, type, keyword = '') {
  const ids = getAddressScopeElements(scope)
  const dIds = getAddressDropdownIds(scope, type)
  const selectEl = document.getElementById(type === 'province' ? ids.provinceId : ids.communeId)
  const optionsEl = document.getElementById(dIds.optionsId)
  const labelEl = document.getElementById(dIds.labelId)
  if (!selectEl || !optionsEl || !labelEl) return

  const placeholder = String(selectEl.options?.[0]?.textContent || (type === 'province' ? 'Chọn tỉnh/thành' : 'Chọn phường/xã'))
  const selectedCode = String(selectEl.value || '').trim()
  const selectedOpt = Array.from(selectEl.options).find((opt, idx) => idx > 0 && String(opt.value || '').trim() === selectedCode)
  labelEl.textContent = selectedOpt ? String(selectedOpt.textContent || '') : placeholder
  labelEl.classList.toggle('text-gray-500', !selectedOpt)
  labelEl.classList.toggle('text-gray-900', !!selectedOpt)

  const list = Array.from(selectEl.options)
    .slice(1)
    .map((opt) => ({ code: String(opt.value || ''), name: String(opt.textContent || '') }))
  const filtered = getFilteredAddressOptions(list, keyword)

  if (!filtered.length) {
    optionsEl.innerHTML = '<div class="px-3 py-2 text-sm text-gray-400">Không tìm thấy kết quả</div>'
    return
  }

  optionsEl.innerHTML = filtered.map((item) => {
    const active = String(item.code) === selectedCode ? ' active' : ''
    return '<button type="button" class="address-option-item' + active + '" data-scope="' + scope + '" data-type="' + type + '" data-code="' + item.code + '" onclick="selectAddressDropdownOption(this.dataset.scope,this.dataset.type,this.dataset.code)">' + item.name + '</button>'
  }).join('')
}

function renderProvinceOptionsForScope(scope, keyword = '') {
  const ids = getAddressScopeElements(scope)
  const provinceEl = document.getElementById(ids.provinceId)
  const filtered = getFilteredAddressOptions(addressProvinceOptions, keyword)
  setAddressSelectOptions(provinceEl, filtered, filtered.length ? 'Chọn tỉnh/thành' : 'Không tìm thấy tỉnh/thành')
  renderAddressDropdownList(scope, 'province', keyword)
}

function renderCommuneOptionsForScope(scope, keyword = '') {
  const ids = getAddressScopeElements(scope)
  const provinceEl = document.getElementById(ids.provinceId)
  const communeEl = document.getElementById(ids.communeId)
  const provinceCode = String(provinceEl?.value || '').trim()
  const list = provinceCode ? (addressCommuneOptionsByProvince[provinceCode] || []) : []
  const filtered = getFilteredAddressOptions(list, keyword)
  const placeholder = provinceCode
    ? (filtered.length ? 'Chọn phường/xã' : 'Không tìm thấy phường/xã')
    : 'Chọn phường/xã'
  setAddressSelectOptions(communeEl, filtered, placeholder)
  renderAddressDropdownList(scope, 'commune', keyword)
}

async function fetchAddressProvinces() {
  const res = await axios.get('/api/address/provinces', { params: { effectiveDate: ADDRESS_EFFECTIVE_DATE } })
  const list = Array.isArray(res.data?.data) ? res.data.data : []
  addressProvinceOptions = list.filter((p) => p && p.code && p.name)
  renderProvinceOptionsForScope('order')
  renderProvinceOptionsForScope('ck')
}

async function ensureAddressKitReady() {
  if (!addressKitLoadingPromise) {
    addressKitLoadingPromise = fetchAddressProvinces()
      .catch((err) => {
        addressProvinceOptions = []
        addressCommuneOptionsByProvince = {}
        throw err
      })
      .finally(() => { addressKitLoadingPromise = null })
  }
  return addressKitLoadingPromise
}

async function fetchAddressCommunesByProvince(provinceCode) {
  const code = String(provinceCode || '').trim()
  if (!code) return []
  if (Array.isArray(addressCommuneOptionsByProvince[code])) return addressCommuneOptionsByProvince[code]
  const res = await axios.get('/api/address/provinces/' + encodeURIComponent(code) + '/communes', {
    params: { effectiveDate: ADDRESS_EFFECTIVE_DATE }
  })
  const list = Array.isArray(res.data?.data) ? res.data.data : []
  const safeList = list.filter((item) => item && item.code && item.name)
  addressCommuneOptionsByProvince[code] = safeList
  return safeList
}

function syncAddressFullText(scope) {
  const ids = getAddressScopeElements(scope)
  const provinceEl = document.getElementById(ids.provinceId)
  const communeEl = document.getElementById(ids.communeId)
  const detailEl = document.getElementById(ids.detailId)
  const fullAddressEl = document.getElementById(ids.fullAddressId)
  if (!fullAddressEl) return ''

  const provinceName = getSelectedAddressOptionText(provinceEl)
  const communeName = getSelectedAddressOptionText(communeEl)
  const detail = String(detailEl?.value || '').trim()
  const fullParts = [detail, communeName, provinceName].filter(Boolean)
  const fullAddress = fullParts.join(', ')
  fullAddressEl.value = fullAddress
  if (!addressAutoFillInProgress) {
    const provinceCode = String(provinceEl?.value || '').trim()
    const communeCode = String(communeEl?.value || '').trim()
    if (provinceCode && communeCode && detail && fullAddress) {
      saveAddressPreference({ provinceCode, communeCode, detail })
    }
  }
  return fullAddress
}

function resetAddressScope(scope) {
  const ids = getAddressScopeElements(scope)
  const provinceEl = document.getElementById(ids.provinceId)
  const communeEl = document.getElementById(ids.communeId)
  const detailEl = document.getElementById(ids.detailId)
  const fullAddressEl = document.getElementById(ids.fullAddressId)
  addressDropdownSearchState[scope + ':province'] = ''
  addressDropdownSearchState[scope + ':commune'] = ''
  renderProvinceOptionsForScope(scope)
  if (provinceEl) provinceEl.value = ''
  if (communeEl) setAddressSelectOptions(communeEl, [], 'Chọn phường/xã')
  renderAddressDropdownList(scope, 'province', '')
  renderAddressDropdownList(scope, 'commune', '')
  if (detailEl) detailEl.value = ''
  if (fullAddressEl) fullAddressEl.value = ''
}

async function onAddressProvinceChange(scope) {
  const ids = getAddressScopeElements(scope)
  const provinceEl = document.getElementById(ids.provinceId)
  const communeEl = document.getElementById(ids.communeId)
  const selectedCode = String(provinceEl?.value || '').trim()
  addressDropdownSearchState[scope + ':commune'] = ''
  setAddressSelectOptions(communeEl, [], selectedCode ? 'Đang tải phường/xã...' : 'Chọn phường/xã')
  renderAddressDropdownList(scope, 'commune', '')
  if (!selectedCode) {
    renderCommuneOptionsForScope(scope)
    syncAddressFullText(scope)
    if (scope === 'ck') clearCheckoutError(ids.fieldId)
    else clearFieldError(ids.fieldId)
    return
  }
  try {
    await fetchAddressCommunesByProvince(selectedCode)
    renderCommuneOptionsForScope(scope)
  } catch (_) {
    setAddressSelectOptions(communeEl, [], 'Không tải được phường/xã')
    showToast('Không tải được danh sách phường/xã. Vui lòng thử lại.', 'error', 4500)
  }
  syncAddressFullText(scope)
  if (scope === 'ck') clearCheckoutError(ids.fieldId)
  else clearFieldError(ids.fieldId)
}

function onAddressCommuneChange(scope) {
  syncAddressFullText(scope)
  renderAddressDropdownList(scope, 'commune', '')
  const ids = getAddressScopeElements(scope)
  if (scope === 'ck') clearCheckoutError(ids.fieldId)
  else clearFieldError(ids.fieldId)
}

function onAddressDropdownSearchInput(scope, type) {
  const dIds = getAddressDropdownIds(scope, type)
  const searchEl = document.getElementById(dIds.searchId)
  const keyword = String(searchEl?.value || '')
  addressDropdownSearchState[scope + ':' + type] = keyword
  if (type === 'province') renderProvinceOptionsForScope(scope, keyword)
  else renderCommuneOptionsForScope(scope, keyword)
}

function selectAddressDropdownOption(scope, type, code) {
  const ids = getAddressScopeElements(scope)
  const selectEl = document.getElementById(type === 'province' ? ids.provinceId : ids.communeId)
  if (!selectEl) return
  selectEl.value = String(code || '')
  const dIds = getAddressDropdownIds(scope, type)
  const searchEl = document.getElementById(dIds.searchId)
  if (searchEl) searchEl.value = ''
  addressDropdownSearchState[scope + ':' + type] = ''
  closeAddressDropdown(scope, type)
  if (type === 'province') onAddressProvinceChange(scope)
  else onAddressCommuneChange(scope)
}

function toggleAddressDropdown(scope, type) {
  const dIds = getAddressDropdownIds(scope, type)
  const menuEl = document.getElementById(dIds.menuId)
  const searchEl = document.getElementById(dIds.searchId)
  if (!menuEl) return
  const willOpen = menuEl.classList.contains('hidden')
  closeAllAddressDropdowns()
  if (!willOpen) return
  menuEl.classList.remove('hidden')
  if (searchEl) {
    searchEl.value = ''
    setTimeout(() => searchEl.focus(), 0)
  }
  addressDropdownSearchState[scope + ':' + type] = ''
  if (type === 'province') renderProvinceOptionsForScope(scope, '')
  else renderCommuneOptionsForScope(scope, '')
}

function bindAddressSearchableDropdowns() {
  document.addEventListener('click', (e) => {
    const target = e.target
    if (!target) return
    const inDropdown = target.closest && target.closest('#orderProvinceDropdown, #orderCommuneDropdown, #ckProvinceDropdown, #ckCommuneDropdown')
    if (!inDropdown) closeAllAddressDropdowns()
  })
}

async function applySavedAddressToScope(scope) {
  resetAddressScope(scope)
  const saved = loadAddressPreference()
  if (!saved) return
  const ids = getAddressScopeElements(scope)
  const provinceEl = document.getElementById(ids.provinceId)
  const communeEl = document.getElementById(ids.communeId)
  const detailEl = document.getElementById(ids.detailId)
  if (!provinceEl || !communeEl || !detailEl) return
  const hasProvince = addressProvinceOptions.some((item) => String(item.code) === saved.provinceCode)
  if (!hasProvince) return
  addressAutoFillInProgress = true
  try {
    provinceEl.value = saved.provinceCode
    await onAddressProvinceChange(scope)
    const communes = addressCommuneOptionsByProvince[saved.provinceCode] || []
    if (communes.some((item) => String(item.code) === saved.communeCode)) {
      communeEl.value = saved.communeCode
    }
    detailEl.value = saved.detail
    syncAddressFullText(scope)
  } finally {
    addressAutoFillInProgress = false
  }
}

function getAddressPayload(scope) {
  const ids = getAddressScopeElements(scope)
  const provinceEl = document.getElementById(ids.provinceId)
  const communeEl = document.getElementById(ids.communeId)
  const detailEl = document.getElementById(ids.detailId)
  const provinceCode = String(provinceEl?.value || '').trim()
  const communeCode = String(communeEl?.value || '').trim()
  const detail = String(detailEl?.value || '').trim()
  const address = syncAddressFullText(scope)
  return {
    address,
    valid: !!(provinceCode && communeCode && detail && address),
    provinceCode,
    communeCode,
    detail
  }
}

function resolveCartStorageKey() {
  if (isAdminUser) return 'qhclothes_cart_admin'
  const uid = Number(currentUser?.userId || currentUser?.id || 0)
  if (uid > 0) return 'qhclothes_cart_user_' + uid
  return 'qhclothes_cart_guest'
}

function syncCartScope(force = false) {
  const nextKey = resolveCartStorageKey()
  if (!force && nextKey === cartStorageKey) return
  cartStorageKey = nextKey
  loadCart(true)
  const overlay = document.getElementById('cartOverlay')
  if (overlay && !overlay.classList.contains('hidden')) {
    renderCartStep1()
  }
}

function loadCart(useCurrentScope = false) {
  if (!useCurrentScope) cartStorageKey = resolveCartStorageKey()
  try { cart = JSON.parse(localStorage.getItem(cartStorageKey) || '[]') } catch { cart = [] }
  updateCartBadge()
}
function saveCart() {
  localStorage.setItem(cartStorageKey, JSON.stringify(cart))
  updateCartBadge()
}
function updateCartBadge() {
  const total = cart.reduce((s,i)=>s+i.qty,0)
  const badge = document.getElementById('cartBadge')
  if (!badge) return
  if (total > 0) {
    badge.textContent = total > 99 ? '99+' : total
    badge.classList.remove('hidden')
    badge.classList.add('flex')
    badge.classList.add('cart-badge-bounce')
    setTimeout(()=>badge.classList.remove('cart-badge-bounce'),400)
  } else {
    badge.classList.add('hidden')
    badge.classList.remove('flex')
  }
}
function genCartId() { return Date.now().toString(36)+Math.random().toString(36).slice(2,7) }

function addToCart(product, color, size, qty) {
  // check duplicate: same productId + color + size
  const exist = cart.find(i=>i.productId===product.id && i.color===color && i.size===size)
  if (exist) {
    exist.qty = Math.min(99, exist.qty + qty)
  } else {
    cart.push({
      cartId: genCartId(),
      productId: product.id,
      name: product.name,
      sku: product.sku || ('SKU-'+String(product.id).padStart(4,'0')),
      thumbnail: product.thumbnail || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
      price: product.price,
      color,
      colorImage: getSelectedColorImageFromProduct(product, color),
      size, qty,
      checked: true
    })
  }
  saveCart()
}

// ── INIT ──────────────────────────────────────────
async function loadProducts() {
  try {
    const res = await axios.get('/api/products')
    allProducts = res.data.data || []
    filteredProducts = [...allProducts]
    renderProducts(filteredProducts)
  } catch(e) {
    document.getElementById('productsGrid').innerHTML = '<div class="col-span-4 text-center text-gray-400 py-12"><i class="fas fa-exclamation-circle text-4xl mb-3"></i><p>Không thể tải sản phẩm</p></div>'
  }
}

function renderProducts(products) {
  const grid = document.getElementById('productsGrid')
  const empty = document.getElementById('emptyState')
  if (!products.length) {
    grid.innerHTML = ''
    empty.classList.remove('hidden')
    return
  }
  empty.classList.add('hidden')
  grid.innerHTML = products.map(p => {
    const colors = getProductColorOptions(p).map((c) => c.name)
    const discount = p.original_price ? Math.round((1 - p.price/p.original_price)*100) : 0
    return \`
    <div class="bg-white rounded-2xl overflow-hidden card-hover shadow-sm border border-gray-100 cursor-pointer" onclick="showDetail(\${p.id})">
      <div class="relative overflow-hidden bg-gray-100">
        <img src="\${p.thumbnail || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'}"
          alt="\${p.name}" class="w-full product-img-main" loading="lazy"
          onerror="this.src='https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'">
        \${discount > 0 ? \`<span class="absolute top-3 left-3 badge-sale text-white text-xs font-bold px-2 py-1 rounded-full">-\${discount}%</span>\` : ''}
        \${p.is_featured ? \`<span class="absolute top-3 right-3 bg-amber-400 text-white text-xs font-bold px-2 py-1 rounded-full">⭐ Hot</span>\` : ''}
        <div class="absolute inset-0 bg-black/0 hover:bg-black/10 transition flex items-center justify-center opacity-0 hover:opacity-100">
          <span class="bg-white/90 text-gray-800 px-3 py-1 rounded-full text-xs font-semibold">Xem chi tiết</span>
        </div>
      </div>
      <div class="p-3 md:p-4">
        \${p.brand ? \`<p class="text-xs text-pink-500 font-medium mb-1">\${p.brand}</p>\` : ''}
        <h3 class="font-semibold text-gray-900 text-sm leading-tight mb-2 line-clamp-2">\${p.name}</h3>
        <div class="flex items-center gap-2 mb-3">
          <span class="text-pink-600 font-bold">\${fmtPrice(p.price)}</span>
          \${p.original_price ? \`<span class="text-gray-400 text-xs line-through">\${fmtPrice(p.original_price)}</span>\` : ''}
        </div>
        \${colors.length > 0 ? \`
        <div class="flex gap-1 mb-3 flex-wrap">
          \${colors.slice(0,4).map(c => \`<span class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">\${c}</span>\`).join('')}
          \${colors.length > 4 ? \`<span class="text-xs text-gray-400">+\${colors.length-4}</span>\` : ''}
        </div>\` : ''}
        <div class="flex gap-2">
          <button onclick="event.stopPropagation();openOrder(\${p.id})" title="Mua ngay"
            class="btn-primary flex-1 text-white py-2 rounded-xl text-sm font-semibold">
            <i class="fas fa-bolt mr-1"></i>Mua ngay
          </button>
          <button onclick="event.stopPropagation();addToCartFromCard(event, \${p.id})" title="Thêm vào giỏ hàng"
            class="w-10 h-9 flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition group relative">
            <i class="fas fa-shopping-bag text-sm"></i>
          </button>
        </div>
      </div>
    </div>\`
  }).join('')
}

// ── FILTER & SEARCH ────────────────────────────────
function filterProducts(cat, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'))
  btn.classList.add('active')
  const search = document.getElementById('searchInput').value.toLowerCase()
  filteredProducts = allProducts.filter(p => {
    const matchCat = cat === 'all' || p.category === cat
    const matchSearch = !search || p.name.toLowerCase().includes(search) || (p.brand||'').toLowerCase().includes(search)
    return matchCat && matchSearch
  })
  renderProducts(filteredProducts)
}

function searchProducts(q) {
  const activeCat = document.querySelector('.filter-btn.active')?.dataset.cat || 'all'
  const ql = q.toLowerCase()
  filteredProducts = allProducts.filter(p => {
    const matchCat = activeCat === 'all' || p.category === activeCat
    const matchSearch = !q || p.name.toLowerCase().includes(ql) || (p.brand||'').toLowerCase().includes(ql)
    return matchCat && matchSearch
  })
  renderProducts(filteredProducts)
}

// ── PRODUCT DETAIL ─────────────────────────────────
async function showDetail(id) {
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
    const discount = p.original_price ? Math.round((1 - p.price/p.original_price)*100) : 0
    document.getElementById('detailContent').innerHTML = \`
    <div class="grid md:grid-cols-2 gap-6">
      <div>
        <img id="mainDetailImg" src="\${defaultMainImage}" alt="\${p.name}" class="w-full rounded-2xl h-80 object-cover mb-3">
        <div class="img-gallery grid grid-cols-4 gap-2">
          \${[p.thumbnail, ...images].filter((v,i,a)=>v&&a.indexOf(v)===i).slice(0,8).map(img => \`
          <img src="\${img}" alt="" class="w-full h-16 object-cover rounded-lg border-2 border-transparent hover:border-pink-400"
            onclick="document.getElementById('mainDetailImg').src='\${img}'">\`).join('')}
        </div>
      </div>
      <div>
        \${p.brand ? \`<p class="text-sm text-pink-500 font-medium mb-1">\${p.brand}</p>\` : ''}
        <h2 class="font-display text-2xl font-bold text-gray-900 mb-3">\${p.name}</h2>
        <div class="flex items-baseline gap-3 mb-4">
          <span class="text-3xl font-bold text-pink-600">\${fmtPrice(p.price)}</span>
          \${p.original_price ? \`<span class="text-gray-400 line-through">\${fmtPrice(p.original_price)}</span><span class="badge-sale text-white text-xs px-2 py-1 rounded-full">-\${discount}%</span>\` : ''}
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
    if (detailColorOptions.length) {
      const initialButton = document.querySelector('#detailColorGrid .detail-color-card')
      if (initialButton) selectDetailColorByIndex(0, initialButton)
    } else {
      const label = document.getElementById('detailColorLabel')
      if (label) label.textContent = ''
    }
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
    document.querySelectorAll('.payment-method-btn').forEach(b => b.classList.remove('active','border-pink-500','bg-pink-50'))
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
  if (!btn || btn.disabled || btn.closest('.payment-method-unavailable')) return
  document.querySelectorAll('.payment-method-btn').forEach(b => b.classList.remove('active','border-pink-500','bg-pink-50'))
  btn.classList.add('active','border-pink-500','bg-pink-50')
  selectedPaymentMethod = method
  document.getElementById('fieldPaymentMethod')?.classList.remove('field-error','shake')
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

// ── SUBMIT ORDER ───────────────────────────────────
async function submitOrder() {
  const name = document.getElementById('orderName').value.trim()
  const phone = document.getElementById('orderPhone').value.trim()
  const addressPayload = getAddressPayload('order')
  const address = addressPayload.address
  const sizes = safeJson(currentProduct?.sizes)
  const hasColorOptions = Array.isArray(orderColorOptions) ? orderColorOptions.length > 0 : false
  const hasSizeOptions = Array.isArray(sizes) ? sizes.length > 0 : false

  // Validate with shake + scroll
  if (!name) { shakeField('fieldName'); return }
  clearFieldError('fieldName')
  if (!phone || !/^[0-9]{9,11}$/.test(phone.replace(/\\s/g,''))) { shakeField('fieldPhone'); return }
  clearFieldError('fieldPhone')
  if (!addressPayload.valid) { shakeField('fieldAddress'); return }
  clearFieldError('fieldAddress')
  if (hasColorOptions && !selectedColor) { shakeField('fieldColor'); return }
  clearFieldError('fieldColor')
  if (hasSizeOptions && !selectedSize) { shakeField('sizeSection'); return }
  clearFieldError('sizeSection')
  if (!selectedPaymentMethod) { shakeField('fieldPaymentMethod'); return }
  clearFieldError('fieldPaymentMethod')
  if (selectedPaymentMethod === 'ZALOPAY') {
    const check = await ensureZaloPayConfigReady(true)
    if (!check.ready) return
  }

  const btn = document.getElementById('submitOrderBtn')
  btn.disabled = true
  btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Đang xử lý...'
  let payTabRef = null
  if (selectedPaymentMethod === 'BANK_TRANSFER') {
    try { payTabRef = window.open('about:blank', '_blank') } catch (_) { payTabRef = null }
  } else if (selectedPaymentMethod === 'ZALOPAY') {
    payTabRef = openOrReuseZaloPayLinkTab()
    if (!payTabRef) {
      try { payTabRef = window.open('about:blank', '_blank') } catch (_) { payTabRef = null }
    }
  }

  try {
    const resolvedColorImage = getSelectedColorImageFromProduct(currentProduct, selectedColor)
    const res = await axios.post('/api/orders', {
      customer_name: name,
      customer_phone: phone,
      customer_address: address,
      product_id: currentProduct.id,
      color: selectedColor,
      selected_color_image: resolvedColorImage || selectedColorImage || (currentProduct?.thumbnail || ''),
      size: selectedSize,
      quantity: orderQty,
      voucher_code: appliedVoucher ? appliedVoucher.code : '',
      note: document.getElementById('orderNote').value.trim(),
      payment_method: selectedPaymentMethod
    })
    closeOrder()
    const orderCode = res.data.order_code
    const orderTotal = Number(res.data.total || 0)
    const orderId = Number(res.data.id || 0)
    if (selectedPaymentMethod === 'BANK_TRANSFER') {
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
        return
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
          showToast(\`Đơn \${orderCode}: đã mở tab PayOS, vui lòng hoàn tất thanh toán.\`, 'success', 5000)
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
      } else {
        try { if (payTabRef && !payTabRef.closed) payTabRef.close() } catch (_) { }
        openOrderBankTransferModal({
          orderCode,
          orderId,
          amount: orderTotal,
          transferContent: 'DH' + orderId,
          paymentLinkId: payosData?.paymentLinkId || ''
        })
        showToast(\`Đơn hàng \${orderCode} đã tạo. Vui lòng chuyển khoản để hoàn tất.\`, 'success', 5000)
      }
    } else if (selectedPaymentMethod === 'ZALOPAY') {
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
        return
      }

      const checkoutUrl = String(zaloData?.orderUrl || '').trim()
      if (!checkoutUrl) {
        try { if (payTabRef && !payTabRef.closed) payTabRef.close() } catch (_) { }
        showToast('Không tạo được liên kết thanh toán ZaloPay.', 'error', 4500)
        return
      }

      let payTab = payTabRef
      if (payTab) {
        try { payTab.location.href = checkoutUrl } catch (_) { payTab = null }
      }
      if (!payTab) payTab = window.open(checkoutUrl, '_blank')

      if (payTab) {
        zaloPayLinkTab = payTab
        startOrderPaymentPolling(orderCode)
        showToast(\`Đơn \${orderCode}: đã mở tab ZaloPay, vui lòng quét QR để thanh toán.\`, 'success', 5000)
      } else {
        // Fallback: popup bị chặn, điều hướng luôn tại tab hiện tại
        startOrderPaymentPolling(orderCode)
        window.location.href = checkoutUrl
      }
    } else {
      showToast(\`🎉 Đặt hàng thành công! Mã đơn: \${orderCode}\`, 'success', 5000)
    }
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
function fmtPrice(p) { return new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND'}).format(p) }
function safeJson(v) { try { return JSON.parse(v||'[]') } catch { return [] } }
function normalizeColorOptions(raw) {
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
function getProductColorOptions(product) {
  if (!product) return []
  const direct = Array.isArray(product.color_options) ? product.color_options : null
  if (direct && direct.length) return normalizeColorOptions(direct)
  return normalizeColorOptions(product.colors || [])
}
function getColorNames(raw) {
  const arr = Array.isArray(raw) ? raw : safeJson(raw)
  if (!Array.isArray(arr)) return []
  return arr.map((item) => {
    if (typeof item === 'string') return String(item || '').trim()
    if (item && typeof item === 'object') return String(item.name || item.label || '').trim()
    return ''
  }).filter(Boolean)
}
function getSelectedColorImageFromProduct(product, selectedColor) {
  const color = String(selectedColor || '').trim().toLowerCase()
  if (!color) return String(product?.thumbnail || '').trim()
  const colors = getProductColorOptions(product)
  const matched =
    colors.find((item) => String(item.name || '').trim().toLowerCase() === color) ||
    colors.find((item) => {
      const name = String(item.name || '').trim().toLowerCase()
      return name.includes(color) || color.includes(name)
    })
  if (matched && String(matched.image || '').trim()) return String(matched.image).trim()
  return String(product?.thumbnail || '').trim()
}
window.normalizeColorOptions = normalizeColorOptions
window.getColorNames = getColorNames
function formatPaymentMethod(v) {
  const key = String(v || '').toUpperCase()
  if (key === 'ZALOPAY') return 'ZaloPay'
  if (key === 'MOMO') return 'Ví điện tử MoMo'
  if (key === 'BANK_TRANSFER') return 'Chuyển khoản ngân hàng'
  return 'COD - Thanh toán khi giao'
}
function paymentStatusLabel(v) {
  return String(v || '').toLowerCase() === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'
}
function paymentStatusClass(v) {
  return String(v || '').toLowerCase() === 'paid'
    ? 'bg-green-100 text-green-700 border border-green-200'
    : 'bg-amber-100 text-amber-700 border border-amber-200'
}
function getOrderAmountDue(order) {
  if (order && order.amount_due !== undefined && order.amount_due !== null) {
    return Number(order.amount_due || 0)
  }
  return String(order?.payment_status || '').toLowerCase() === 'paid'
    ? 0
    : Number(order?.total_price || 0)
}

function showToast(msg, type='success', duration=3000) {
  const c = document.getElementById('toastContainer')
  const t = document.createElement('div')
  t.className = \`toast px-5 py-3 rounded-2xl shadow-xl text-white text-sm font-medium pointer-events-auto \${type==='error'?'bg-red-500':'bg-green-500'}\`
  t.textContent = msg
  c.appendChild(t)
  setTimeout(() => t.remove(), duration)
}

function toggleMobileMenu() {
  const m = document.getElementById('mobileMenu')
  m.classList.toggle('hidden')
}
// ── CART MODAL ────────────────────────────────────
function openCart() {
  cartStep = 1
  ckAppliedVoucher = null
  renderCartStep1()
  document.getElementById('cartOverlay').classList.remove('hidden')
  document.getElementById('cartStep2').classList.add('hidden')
  document.getElementById('cartStep2').classList.remove('flex')
  document.getElementById('cartStep1').classList.remove('hidden')
  document.getElementById('cartBackBtn').classList.add('hidden')
  document.getElementById('cartTitle').textContent = 'Giỏ hàng'
  document.body.style.overflow = 'hidden'
}
function closeCart() {
  document.getElementById('cartOverlay').classList.add('hidden')
  document.body.style.overflow = ''
}
function handleCartOverlayClick(e) {
  if (e.target.id === 'cartOverlay') closeCart()
}
function cartGoBack() {
  cartStep = 1
  document.getElementById('cartStep2').classList.add('hidden')
  document.getElementById('cartStep2').classList.remove('flex')
  document.getElementById('cartStep1').classList.remove('hidden')
  document.getElementById('cartBackBtn').classList.add('hidden')
  document.getElementById('cartTitle').textContent = 'Giỏ hàng'
  updateCartHeaderSubtitle()
}

function renderCartStep1() {
  const listEl = document.getElementById('cartItemsList')
  const checkAllBar = document.getElementById('cartCheckAllBar')
  const footer = document.getElementById('cartFooter')
  
  if (cart.length === 0) {
    checkAllBar.classList.add('hidden')
    footer.classList.add('hidden')
    listEl.innerHTML = '<div class="flex flex-col items-center justify-center py-20 text-center"><div class="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4"><i class="fas fa-shopping-bag text-4xl text-gray-300"></i></div><p class="text-gray-500 font-medium text-lg mb-1">Chua co san pham nao</p><p class="text-gray-400 text-sm">Hay them san pham vao gio hang</p><button onclick="closeCart()" class="mt-6 btn-primary text-white px-6 py-2.5 rounded-full font-semibold text-sm"><i class="fas fa-arrow-left mr-2"></i>Tiep tuc mua sam</button></div>'
    updateCartHeaderSubtitle()
    return
  }

  checkAllBar.classList.remove('hidden')
  footer.classList.remove('hidden')

  // Sync checkAll state
  const allChecked = cart.every(i=>i.checked)
  document.getElementById('checkAll').checked = allChecked

  listEl.innerHTML = cart.map(function(item) {
    const col = (typeof item.color === 'string' && item.color) ? item.color : ''
    const sz = item.size || ''
    const chk = item.checked ? 'checked' : ''
    const colorTag = col ? '<span class="text-xs bg-pink-50 text-pink-600 border border-pink-200 px-2 py-0.5 rounded-full">' + col + '</span>' : ''
    const sizeTag = sz ? '<span class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">' + sz + '</span>' : ''
    return '<div class="cart-item rounded-xl border border-gray-200 bg-white" data-cart-id="' + item.cartId + '">'
      + '<div class="cart-item-delete-bg cart-del-btn" data-id="' + item.cartId + '"><i class="fas fa-trash"></i></div>'
      + '<div class="cart-item-inner rounded-xl p-3" data-cart-id="' + item.cartId + '">'
      + '<div class="flex gap-3 items-start">'
      + '<div class="flex-shrink-0 pt-1"><input type="checkbox" ' + chk + ' data-toggle-id="' + item.cartId + '" class="cart-chk w-4 h-4 accent-pink-500 cursor-pointer mt-0.5"></div>'
      + '<img src="' + item.thumbnail + '" alt="' + item.name + '" class="w-16 h-20 object-cover rounded-lg flex-shrink-0" onerror="this.src=&quot;https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&quot;">'
      + '<div class="flex-1 min-w-0">'
      + '<p class="font-semibold text-gray-900 text-sm line-clamp-1 mb-0.5">' + item.name + '</p>'
      + '<p class="text-xs text-gray-400 mb-1">' + item.sku + '</p>'
      + '<div class="flex flex-wrap gap-1 mb-2">' + colorTag + sizeTag + '</div>'
      + '<div class="flex items-center justify-between">'
      + '<span class="text-pink-600 font-bold text-sm">' + fmtPrice(item.price) + '</span>'
      + '<div class="flex items-center gap-2">'
      + '<button class="cart-qty-btn w-7 h-7 rounded-full border flex items-center justify-center text-gray-600 hover:border-pink-400 hover:text-pink-500 transition font-bold text-base" data-id="' + item.cartId + '" data-delta="-1">&minus;</button>'
      + '<span class="text-sm font-bold w-6 text-center">' + item.qty + '</span>'
      + '<button class="cart-qty-btn w-7 h-7 rounded-full border flex items-center justify-center text-gray-600 hover:border-pink-400 hover:text-pink-500 transition font-bold text-base" data-id="' + item.cartId + '" data-delta="1">+</button>'
      + '</div></div>'
      + '<p class="text-right text-xs text-gray-400 mt-1">= ' + fmtPrice(item.price * item.qty) + '</p>'
      + '</div></div></div></div>'
  }).join('')

  // Bind events via delegation
  listEl.querySelectorAll('.cart-del-btn').forEach(function(btn) {
    btn.addEventListener('click', function() { removeCartItem(btn.dataset.id) })
  })
  listEl.querySelectorAll('.cart-chk').forEach(function(cb) {
    cb.addEventListener('change', function() { toggleCartItem(cb.dataset.toggleId, cb.checked) })
  })
  listEl.querySelectorAll('.cart-qty-btn').forEach(function(btn) {
    btn.addEventListener('click', function() { changeCartQty(btn.dataset.id, parseInt(btn.dataset.delta)) })
  })

  // Setup swipe-to-delete for each item
  setupSwipeToDelete()
  updateCartSummary()
  updateCartHeaderSubtitle()
}

function updateCartHeaderSubtitle() {
  const total = cart.reduce(function(s,i){return s+i.qty},0)
  document.getElementById('cartSubtitle').textContent = total > 0 ? (total + ' san pham trong gio') : 'Chua co san pham nao'
}

function toggleCheckAll(cb) {
  cart.forEach(i=>i.checked = cb.checked)
  saveCart()
  renderCartStep1()
}
function toggleCartItem(cartId, checked) {
  const item = cart.find(i=>i.cartId===cartId)
  if (item) item.checked = checked
  saveCart()
  updateCartSummary()
  // sync checkAll
  document.getElementById('checkAll').checked = cart.every(i=>i.checked)
}
function updateCartSummary() {
  const checked = cart.filter(i=>i.checked)
  const total = checked.reduce((s,i)=>s+i.price*i.qty,0)
  const count = checked.length
  document.getElementById('cartSelectedItems').textContent = checked.reduce((s,i)=>s+i.qty,0)
  document.getElementById('cartTotalPrice').textContent = fmtPrice(total)
  const deleteBtn = document.getElementById('deleteCheckedBtn')
  const checkoutBtn = document.getElementById('checkoutBtn')
  if (count > 0) {
    deleteBtn.classList.remove('hidden')
    checkoutBtn.disabled = false
  } else {
    deleteBtn.classList.add('hidden')
    checkoutBtn.disabled = true
  }
  document.getElementById('selectedCount').textContent = 'Da chon ' + count
}
function changeCartQty(cartId, delta) {
  const item = cart.find(i=>i.cartId===cartId)
  if (!item) return
  item.qty = Math.max(1, Math.min(99, item.qty + delta))
  saveCart()
  renderCartStep1()
}
function removeCartItem(cartId) {
  cart = cart.filter(i=>i.cartId!==cartId)
  saveCart()
  renderCartStep1()
}
function removeChecked() {
  cart = cart.filter(i=>!i.checked)
  saveCart()
  renderCartStep1()
}

// ── SWIPE TO DELETE ────────────────────────────────
function setupSwipeToDelete() {
  document.querySelectorAll('.cart-item').forEach(itemEl => {
    const inner = itemEl.querySelector('.cart-item-inner')
    if (!inner) return
    let startX = 0, currentX = 0, isDragging = false
    const threshold = 60

    function onStart(e) {
      startX = e.touches ? e.touches[0].clientX : e.clientX
      isDragging = true
    }
    function onMove(e) {
      if (!isDragging) return
      currentX = (e.touches ? e.touches[0].clientX : e.clientX) - startX
      if (currentX < 0) {
        inner.style.transform = 'translateX(' + Math.max(currentX,-80) + 'px)'
      } else {
        inner.style.transform = ''
      }
    }
    function onEnd() {
      if (!isDragging) return
      isDragging = false
      const cartId = inner.dataset.cartId
      if (currentX < -threshold) {
        inner.style.transform = 'translateX(-80px)'
        setTimeout(()=>removeCartItem(cartId),200)
      } else {
        inner.style.transform = ''
      }
      currentX = 0
    }
    inner.addEventListener('touchstart', onStart, {passive:true})
    inner.addEventListener('touchmove', onMove, {passive:true})
    inner.addEventListener('touchend', onEnd)
    inner.addEventListener('mousedown', onStart)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onEnd)
  })
}

// ── CHECKOUT from CART ────────────────────────────
async function proceedToCheckout() {
  const checked = cart.filter(i=>i.checked)
  if (checked.length === 0) { showToast('Vui lòng chọn ít nhất 1 sản phẩm','error'); return }
  try {
    await ensureAddressKitReady()
  } catch (_) {
    showToast('Không tải được danh mục địa chỉ, vui lòng thử lại.', 'error', 4500)
    return
  }
  // Build summary
  document.getElementById('checkoutSummaryItems').innerHTML = checked.map(function(i){
    return '<div class="flex-shrink-0 w-20 text-center">'
      + '<div class="relative inline-block">'
      + '<img src="' + i.thumbnail + '" class="w-16 h-20 object-cover rounded-xl border-2 border-white shadow" onerror="this.src=&quot;https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&quot;">'
      + '<span class="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 text-white text-xs rounded-full flex items-center justify-center font-bold">' + i.qty + '</span>'
      + '</div><p class="text-xs text-gray-600 mt-1 line-clamp-1">' + i.name + '</p></div>'
  }).join('')
  // reset form
  ;['ckName','ckPhone','ckAddress','ckAddressDetail','ckNote'].forEach(id => { const el=document.getElementById(id); if(el) el.value='' })
  await applySavedAddressToScope('ck')
  ;['ckFieldName','ckFieldPhone','ckFieldAddress'].forEach(id => clearCheckoutError(id))
  ckAppliedVoucher = null
  document.getElementById('ckVoucher').value = ''
  document.getElementById('ckVoucherStatus').classList.add('hidden')
  document.getElementById('ckVoucherBtn').textContent = 'Áp dụng'
  document.getElementById('ckVoucherBtn').className = 'px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-sm font-semibold transition whitespace-nowrap'
  updateCkTotal()
  // show step2
  cartStep = 2
  document.getElementById('cartStep1').classList.add('hidden')
  document.getElementById('cartStep2').classList.remove('hidden')
  document.getElementById('cartStep2').classList.add('flex')
  document.getElementById('cartBackBtn').classList.remove('hidden')
  document.getElementById('cartTitle').textContent = 'Xác nhận đơn hàng'
  document.getElementById('cartSubtitle').textContent = checked.reduce(function(s,i){return s+i.qty},0) + ' san pham'
}

function updateCkTotal() {
  const checked = cart.filter(i=>i.checked)
  const subtotal = checked.reduce((s,i)=>s+i.price*i.qty,0)
  const discount = ckAppliedVoucher ? ckAppliedVoucher.discount_amount : 0
  const total = Math.max(0, subtotal - discount)
  document.getElementById('ckTotal').textContent = fmtPrice(total)
  if (ckAppliedVoucher) {
    document.getElementById('ckSubtotal').textContent = fmtPrice(subtotal)
    document.getElementById('ckDiscount').textContent = '-'+fmtPrice(discount)
    document.getElementById('ckSubtotalRow').classList.remove('hidden')
    document.getElementById('ckDiscountRow').classList.remove('hidden')
  } else {
    document.getElementById('ckSubtotalRow').classList.add('hidden')
    document.getElementById('ckDiscountRow').classList.add('hidden')
  }
}
async function applyCkVoucher() {
  const code = document.getElementById('ckVoucher').value.trim().toUpperCase()
  const statusEl = document.getElementById('ckVoucherStatus')
  const btn = document.getElementById('ckVoucherBtn')
  if (!code) {
    statusEl.className='mt-2 voucher-error rounded-xl px-3 py-2 text-sm text-red-600 font-medium'
    statusEl.innerHTML='<i class="fas fa-times-circle mr-1"></i>Vui lòng nhập mã voucher'
    statusEl.classList.remove('hidden'); return
  }
  btn.disabled=true; btn.innerHTML='<i class="fas fa-spinner fa-spin"></i>'
  statusEl.classList.add('hidden')
  try {
    const res = await axios.post('/api/vouchers/validate', { code })
    ckAppliedVoucher = res.data.data
    statusEl.className='mt-2 voucher-success rounded-xl px-3 py-2 text-sm text-green-700 font-semibold flex items-center gap-2'
    statusEl.innerHTML='<i class="fas fa-check-circle text-green-500"></i>Ap dung thanh cong! Giam <strong>' + fmtPrice(ckAppliedVoucher.discount_amount) + '</strong>'
    statusEl.classList.remove('hidden')
    document.getElementById('ckVoucher').classList.add('border-green-400','bg-green-50')
    updateCkTotal()
  } catch(err) {
    ckAppliedVoucher = null
    const errCode = err.response?.data?.error
    const msg = errCode==='VOUCHER_LIMIT'?'Voucher đã hết lượt':errCode==='INVALID_VOUCHER'?'Mã không hợp lệ hoặc hết hạn':'Không thể áp dụng'
    statusEl.className='mt-2 voucher-error rounded-xl px-3 py-2 text-sm text-red-600 font-medium flex items-center gap-1'
    statusEl.innerHTML='<i class="fas fa-times-circle mr-1"></i>' + msg
    statusEl.classList.remove('hidden')
    document.getElementById('ckVoucher').classList.remove('border-green-400','bg-green-50')
    updateCkTotal()
  } finally {
    btn.disabled=false
    btn.innerHTML = ckAppliedVoucher ? '<i class="fas fa-check mr-1"></i>Đã áp dụng' : 'Áp dụng'
    if(ckAppliedVoucher) btn.classList.replace('bg-gray-800','bg-green-600')
    else btn.className='px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-sm font-semibold transition whitespace-nowrap'
  }
}
function shakeCheckoutField(fieldId) {
  const el = document.getElementById(fieldId)
  if (!el) return
  el.classList.add('field-error')
  el.classList.remove('shake')
  void el.offsetWidth
  el.classList.add('shake')
  el.scrollIntoView({ behavior:'smooth', block:'center' })
  setTimeout(()=>el.classList.remove('shake'),600)
}
function clearCheckoutError(fieldId) {
  document.getElementById(fieldId)?.classList.remove('field-error')
}
async function submitCartOrder() {
  const name = document.getElementById('ckName').value.trim()
  const phone = document.getElementById('ckPhone').value.trim()
  const addressPayload = getAddressPayload('ck')
  const address = addressPayload.address
  if (!name) { shakeCheckoutField('ckFieldName'); return }
  clearCheckoutError('ckFieldName')
  if (!phone || !/^[0-9]{9,11}$/.test(phone.replace(/s/g,''))) { shakeCheckoutField('ckFieldPhone'); return }
  clearCheckoutError('ckFieldPhone')
  if (!addressPayload.valid) { shakeCheckoutField('ckFieldAddress'); return }
  clearCheckoutError('ckFieldAddress')

  const note = document.getElementById('ckNote').value.trim()
  const checkedItems = cart.filter(i=>i.checked)
  const btn = document.getElementById('submitCartBtn')
  btn.disabled=true
  btn.innerHTML='<i class="fas fa-spinner fa-spin mr-2"></i>Đang xử lý...'

  try {
    const codes = []
    for (const item of checkedItems) {
      const res = await axios.post('/api/orders', {
        customer_name: name, customer_phone: phone, customer_address: address,
        product_id: item.productId, color: item.color, size: item.size,
        selected_color_image: item.colorImage || '',
        quantity: item.qty,
        voucher_code: ckAppliedVoucher ? ckAppliedVoucher.code : '',
        note,
        payment_method: 'COD'
      })
      codes.push(res.data.order_code)
    }
    // Remove checked items from cart
    cart = cart.filter(i=>!i.checked)
    saveCart()
    closeCart()
    showToast('Dat hang thanh cong! ' + codes.length + ' don hang da duoc tao', 'success', 5000)
  } catch(e) {
    const errCode = e.response?.data?.error
    if (errCode==='INVALID_VOUCHER'||errCode==='VOUCHER_LIMIT') {
      showToast('Voucher không còn hiệu lực','error')
      ckAppliedVoucher=null; updateCkTotal()
      document.getElementById('ckVoucherBtn').innerHTML='Áp dụng'
      document.getElementById('ckVoucherBtn').className='px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-sm font-semibold transition whitespace-nowrap'
    } else { showToast('Đặt hàng thất bại, thử lại sau','error') }
  } finally {
    btn.disabled=false
    btn.innerHTML='<i class="fas fa-shopping-cart mr-2"></i>Đặt hàng ngay'
  }
}

function toggleCart() { openCart() }

// Close overlays on outside click
document.getElementById('orderOverlay').addEventListener('click', (e) => { if(e.target.id==='orderOverlay') closeOrder() })
document.getElementById('detailOverlay').addEventListener('click', (e) => { if(e.target.id==='detailOverlay') closeDetail() })
document.getElementById('orderBankTransferOverlay').addEventListener('click', (e) => { if (e.target.id === 'orderBankTransferOverlay') closeOrderBankTransferModal() })
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const bankModal = document.getElementById('orderBankTransferOverlay')
    if (bankModal && !bankModal.classList.contains('hidden')) closeOrderBankTransferModal()
  }
})

// Auto clear error on input
;['orderName','orderPhone','orderAddressDetail','orderProvince','orderCommune'].forEach(id => {
  const el = document.getElementById(id)
  if (!el) return
  const fieldMap = {
    orderName: 'fieldName',
    orderPhone: 'fieldPhone',
    orderAddressDetail: 'fieldAddress',
    orderProvince: 'fieldAddress',
    orderCommune: 'fieldAddress'
  }
  const clearFn = () => clearFieldError(fieldMap[id])
  el.addEventListener('input', clearFn)
  el.addEventListener('change', clearFn)
})

// ── DYNAMIC HERO BANNERS ──────────────────────────
let heroBannersData = []
let heroBannersIsExpanded = false
let lastHeroMobileMode = null

async function loadSettings() {
  try {
    const trendingRes = await axios.get('/api/trending-products').catch(() => ({ data: { data: [] } }))
    const trendingProducts = (trendingRes.data && trendingRes.data.data) ? trendingRes.data.data : []
    heroBannersData = sortHeroCards(mapTrendingProductsToHeroCards(trendingProducts))
    renderCollapsedBanners(heroBannersData)
    renderExpandedBanners(heroBannersData)
    bindHeroBannersWheelScroll()
  } catch (e) {
    console.error('Failed to load banners', e)
  }
}

function mapTrendingProductsToHeroCards(products) {
  if (!Array.isArray(products)) return []
  return products.map((p) => {
    const imgs = safeJson(p.images)
    const categoryLabel = p.category === 'male' ? 'Nam' : p.category === 'female' ? 'Nu' : 'Unisex'
    return {
      image_url: p.thumbnail || imgs[0] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
      subtitle: categoryLabel + ' · Dang thinh hanh',
      title: p.name || '',
      price: fmtPrice(p.price || 0),
      product_id: p.id,
      trending_order: Number(p.trending_order || 0),
      updated_at: p.updated_at || '',
      created_at: p.created_at || ''
    }
  })
}
function sortHeroCards(cards) {
  return [...cards].sort((a, b) => {
    const ao = Number(a.trending_order || 0)
    const bo = Number(b.trending_order || 0)
    const aHas = ao > 0
    const bHas = bo > 0
    if (aHas && !bHas) return -1
    if (!aHas && bHas) return 1
    if (aHas && bHas && ao !== bo) return ao - bo
    const au = Date.parse(a.updated_at || a.created_at || '')
    const bu = Date.parse(b.updated_at || b.created_at || '')
    if (!Number.isNaN(au) && !Number.isNaN(bu) && au !== bu) return bu - au
    return Number(a.product_id || 0) - Number(b.product_id || 0)
  })
}
function isMobileHeroLayout() {
  return window.matchMedia('(max-width: 768px)').matches
}

function bindHeroBannersWheelScroll() {
  const overlay = document.getElementById('heroBannersExpanded')
  const inner = document.getElementById('heroBannersExpandedInner')
  if (!overlay || !inner || inner.dataset.wheelBound === '1') return
  inner.dataset.wheelBound = '1'
  const onWheel = (e) => {
    if (!heroBannersIsExpanded || isMobileHeroLayout()) return
    const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX
    if (!delta) return
    inner.scrollLeft += delta * 1.2
    e.preventDefault()
  }
  inner.addEventListener('wheel', onWheel, { passive: false })
  overlay.addEventListener('wheel', onWheel, { passive: false })
}

function renderCollapsedBanners(banners) {
  const container = document.getElementById('heroBannersCollapsed')
  if (!container) return
  const mobileMode = isMobileHeroLayout()
  lastHeroMobileMode = mobileMode
  if (!banners.length) {
    container.innerHTML = \`<div class="relative w-full h-full rounded-3xl border border-white/20 bg-white/5 flex items-center justify-center text-center px-6">
      <div>
        <i class="fas fa-fire text-2xl text-pink-300 mb-2"></i>
        <p class="text-white/80 text-sm font-medium">Chưa có sản phẩm thịnh hành</p>
      </div>
    </div>\`
    return
  }
  if (mobileMode) {
    const shown = banners.slice(0, Math.max(3, Math.min(banners.length, 8)))
    container.innerHTML = \`<div class="hero-mobile-slider">\${shown.map((b) => {
      const safeTitle = b.title || 'Sản phẩm'
      if (b.product_id) {
        return \`<button type="button" class="hero-mobile-card hero-mobile-card-button" onclick="showDetail(\${b.product_id})">
          <div class="hero-mobile-card-thumb">
            <img src="\${b.image_url}" alt="\${safeTitle}" onerror="this.src='https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'">
          </div>
          <p class="hero-mobile-card-name">\${safeTitle}</p>
        </button>\`
      }
      return \`<div class="hero-mobile-card">
        <div class="hero-mobile-card-thumb">
          <img src="\${b.image_url}" alt="\${safeTitle}" onerror="this.src='https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'">
        </div>
        <p class="hero-mobile-card-name">\${safeTitle}</p>
      </div>\`
    }).join('')}</div>
    <div class="hero-mobile-swipe-hint"><i class="fas fa-arrows-left-right"></i><span>Vuốt ngang để xem thêm</span></div>\`
    container.style.paddingBottom = '0'
    container.onclick = null
    return
  }
  const len = banners.length
  const shown = banners.slice(0, Math.min(len, 4)).reverse()
  container.innerHTML = \`<div class="relative" style="width:300px;height:360px">
  \${shown.map((b, i) => {
    const rot = shown.length > 1 ? (i - Math.floor((shown.length - 1) / 2)) * 6 : 0
    const z = i * 10
    const isTop = i === shown.length - 1
    const clickHandler = \`expandBanners()\`
    const cursor = 'cursor-pointer'
    return \`<div class="absolute inset-0 rounded-3xl overflow-hidden \${cursor}" onclick="\${clickHandler}" style="transform:rotate(\${rot}deg);z-index:\${z};transition:transform 0.5s ease,box-shadow 0.5s ease;box-shadow:0 12px 40px rgba(0,0,0,0.25);">
      <div class="absolute inset-0 bg-gradient-to-br from-pink-500/15 to-purple-600/15 rounded-3xl pointer-events-none"></div>
      <img src="\${b.image_url}" alt="\${b.title || 'Banner'}" class="w-full h-full object-cover rounded-3xl pointer-events-none" onerror="this.src='https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'">
      \${isTop && (b.subtitle || b.title || b.price) ? \`
        <div class="absolute left-0 right-0 bottom-0 px-4 pt-10 pb-4 pointer-events-none rounded-b-3xl"
          style="z-index:\${z+5};background:linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 42%, rgba(0,0,0,0) 100%);">
          \${b.subtitle ? \`<p class="text-[10px] text-white/75 uppercase tracking-[2px] font-semibold mb-1">\${b.subtitle}</p>\` : ''}
          \${b.title ? \`<p class="font-bold text-white text-sm leading-tight overflow-hidden text-ellipsis whitespace-nowrap" style="max-width:100%;">\${b.title}</p>\` : ''}
          \${b.price ? \`<p class="text-pink-300 font-bold text-sm mt-1">\${b.price}</p>\` : ''}
        </div>\` : ''}
    </div>\`
  }).join('')}
  </div>
  <div class="absolute flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5 text-white text-xs font-medium cursor-pointer hover:bg-white/30 transition whitespace-nowrap" style="bottom:-28px;left:50%;transform:translateX(-50%);z-index:5" onclick="expandBanners()">
    <i class="fas fa-expand-alt mr-1 text-pink-300"></i>Các mẫu thịnh hành
  </div>\`
  container.style.paddingBottom = '36px'
  container.onclick = () => { if (!heroBannersIsExpanded) expandBanners() }
}

function renderExpandedBanners(banners) {
  const inner = document.getElementById('heroBannersExpandedInner')
  const title = document.getElementById('heroBannersExpandedTitle')
  if (!inner) return
  if (title) title.textContent = \`🔥 Đang thịnh hành (\${banners.length} mẫu)\`
  inner.innerHTML = banners.map(b => {
    if (b.product_id) {
      return \`<a href="javascript:void(0)" class="hero-banner-card" onclick="showDetail(\${b.product_id})">
        <img src="\${b.image_url}" alt="\${b.title || ''}" onerror="this.src='https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'" loading="lazy">
        \${(b.subtitle || b.title || b.price) ? \`
          <div class="banner-caption">
            \${b.subtitle ? \`<p class="banner-subtitle">\${b.subtitle}</p>\` : ''}
            \${b.title ? \`<p class="banner-title">\${b.title}</p>\` : ''}
            \${b.price ? \`<p class="banner-price">\${b.price}</p>\` : ''}
          </div>\` : ''}
      </a>\`
    } else {
      return \`<div class="hero-banner-card" style="cursor:default;">
        <img src="\${b.image_url}" alt="\${b.title || ''}" onerror="this.src='https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'" loading="lazy">
        \${(b.subtitle || b.title || b.price) ? \`
          <div class="banner-caption">
            \${b.subtitle ? \`<p class="banner-subtitle">\${b.subtitle}</p>\` : ''}
            \${b.title ? \`<p class="banner-title">\${b.title}</p>\` : ''}
            \${b.price ? \`<p class="banner-price">\${b.price}</p>\` : ''}
          </div>\` : ''}
      </div>\`
    }
  }).join('')
  // Add placeholders to always have 4 per row
  const needed = Math.max(0, 4 - banners.length)
  for (let i = 0; i < needed; i++) {
    inner.innerHTML += \`<div class="hero-banner-card" style="background:rgba(255,255,255,0.05);pointer-events:none;"></div>\`
  }
}

function expandBanners() {
  if (heroBannersIsExpanded || isMobileHeroLayout()) return
  heroBannersIsExpanded = true
  const overlay = document.getElementById('heroBannersExpanded')
  overlay.style.display = 'flex'
  requestAnimationFrame(() => { overlay.style.opacity = '1' })
  document.body.style.overflow = 'hidden'
}

function collapseBanners() {
  if (!heroBannersIsExpanded) return
  heroBannersIsExpanded = false
  const overlay = document.getElementById('heroBannersExpanded')
  overlay.style.opacity = '0'
  setTimeout(() => {
    overlay.style.display = 'none'
    document.body.style.overflow = ''
  }, 350)
}

function handleBannerOverlayClick(e) {
  if (e.target.id === 'heroBannersExpanded') collapseBanners()
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && heroBannersIsExpanded) collapseBanners()
})

window.addEventListener('resize', () => {
  const mobileMode = isMobileHeroLayout()
  if (lastHeroMobileMode === null) {
    lastHeroMobileMode = mobileMode
    return
  }
  if (mobileMode !== lastHeroMobileMode) {
    if (mobileMode && heroBannersIsExpanded) collapseBanners()
    renderCollapsedBanners(heroBannersData)
    lastHeroMobileMode = mobileMode
  }
})

// Init
bindAddressSearchableDropdowns()
loadSettings()
loadCart()
loadProducts()
checkUserAuth()
handlePaymentReturnFlow()
ensureAddressKitReady().catch(() => {
  showToast('Không tải được danh mục tỉnh/phường. Bạn có thể thử lại sau.', 'error', 4500)
})

window.addEventListener('message', function (event) {
  if (event.origin !== window.location.origin) return
  const data = event.data || {}
  if ((data.type === 'payment_paid' || data.type === 'payos_paid') && data.orderCode) {
    onOrderMarkedPaid(String(data.orderCode))
  }
})

// ── USER AUTH & MENU ──────────────────────────────
async function checkUserAuth() {
  try {
    const res = await axios.get('/api/auth/me')
    currentUser = res.data.data
    isAdminUser = !!res.data.isAdmin
    syncCartScope()
    ensureAddressKitReady()
      .then(() => {
        applySavedAddressToScope('order')
          .catch(() => { })
      })
      .catch(() => { })
    updateUserUI()
  } catch {
    currentUser = null
    isAdminUser = false
    syncCartScope()
    ensureAddressKitReady()
      .then(() => {
        applySavedAddressToScope('order')
          .catch(() => { })
      })
      .catch(() => { })
    updateUserUI()
  }
}

function fmtBalance(v) { return new Intl.NumberFormat('vi-VN').format(v||0) + 'đ' }

function updateUserUI() {
  const defaultAvatar = document.getElementById('userAvatarDefault')
  const imgAvatar = document.getElementById('userAvatarImg')
  const guestSection = document.getElementById('userMenuGuest')
  const loggedInSection = document.getElementById('userMenuLoggedIn')
  const logoutArea = document.getElementById('userMenuLogoutArea')
  const walletNav = document.getElementById('walletNavBtn')
  const adminLink = document.getElementById('adminNavLink')
  const userOrdersBtn = document.getElementById('userOrdersBtn')
  // Admin icon
  if (isAdminUser) { adminLink.classList.remove('hidden') } else { adminLink.classList.add('hidden') }
  if (currentUser && isAdminUser) {
    defaultAvatar.classList.remove('hidden')
    imgAvatar.classList.add('hidden')
    guestSection.classList.add('hidden')
    loggedInSection.classList.remove('hidden')
    logoutArea.classList.remove('hidden')
    document.getElementById('userMenuAvatar').src = '/qh-logo.png'
    document.getElementById('userMenuName').textContent = 'Admin'
    document.getElementById('userMenuEmail').textContent = 'Quyen quan tri'
    walletNav.classList.add('hidden')
    walletNav.classList.remove('flex')
    if (userOrdersBtn) userOrdersBtn.classList.add('hidden')
  } else if (currentUser) {
    defaultAvatar.classList.add('hidden')
    imgAvatar.src = currentUser.avatar || ''
    imgAvatar.classList.remove('hidden')
    guestSection.classList.add('hidden')
    loggedInSection.classList.remove('hidden')
    logoutArea.classList.remove('hidden')
    document.getElementById('userMenuAvatar').src = currentUser.avatar || ''
    document.getElementById('userMenuName').textContent = currentUser.name || ''
    document.getElementById('userMenuEmail').textContent = currentUser.email || ''
    // Wallet
    walletNav.classList.remove('hidden')
    walletNav.classList.add('flex')
    const bal = fmtBalance(currentUser.balance)
    document.getElementById('walletBalanceNav').textContent = bal
    document.getElementById('walletBalanceMenu').textContent = bal
    if (userOrdersBtn) userOrdersBtn.classList.remove('hidden')
  } else {
    defaultAvatar.classList.remove('hidden')
    imgAvatar.classList.add('hidden')
    guestSection.classList.remove('hidden')
    loggedInSection.classList.add('hidden')
    logoutArea.classList.add('hidden')
    walletNav.classList.add('hidden')
    walletNav.classList.remove('flex')
    if (userOrdersBtn) userOrdersBtn.classList.remove('hidden')
  }
}

function toggleUserMenu() {
  const overlay = document.getElementById('userMenuOverlay')
  if (overlay.classList.contains('hidden')) { openUserMenu() } else { closeUserMenu() }
}
function openUserMenu() {
  const overlay = document.getElementById('userMenuOverlay')
  const panel = document.getElementById('userMenuPanel')
  panel.classList.remove('closing')
  overlay.classList.remove('hidden')
  document.body.style.overflow = 'hidden'
  document.getElementById('userMenuContent').innerHTML = ''
}
function closeUserMenu() {
  const overlay = document.getElementById('userMenuOverlay')
  const panel = document.getElementById('userMenuPanel')
  panel.classList.add('closing')
  setTimeout(() => { overlay.classList.add('hidden'); panel.classList.remove('closing'); closeShippingJourneyModal() }, 300)
}
function handleUserMenuOverlayClick(e) { if (e.target.id === 'userMenuOverlay') closeUserMenu() }

function loginWithGoogle() { window.location.href = '/api/auth/google' }

async function logoutUser() {
  try { await axios.post('/api/auth/logout') } catch {}
  currentUser = null
  isAdminUser = false
  syncCartScope(true)
  updateUserUI()
  closeUserMenu()
  showToast('Đã đăng xuất thành công', 'success')
}

function showUserAccount() {
  const content = document.getElementById('userMenuContent')
  if (!currentUser) {
    content.innerHTML = '<div class="text-center py-8 text-gray-400"><i class="fas fa-lock text-3xl mb-3"></i><p>Vui lòng đăng nhập để xem thông tin</p></div>'
    return
  }
  content.innerHTML = '<div class="bg-white rounded-2xl border p-4 space-y-3">'
    + '<h3 class="font-semibold text-gray-800 mb-3"><i class="fas fa-user-circle text-pink-400 mr-2"></i>Thông tin tài khoản</h3>'
    + '<div class="flex items-center gap-4"><img src="' + (currentUser.avatar||'') + '" class="w-16 h-16 rounded-full object-cover border-2 border-pink-200"><div>'
    + '<p class="font-bold text-gray-900">' + (currentUser.name||'') + '</p>'
    + '<p class="text-sm text-gray-500">' + (currentUser.email||'') + '</p></div></div></div>'
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function getOrderHistoryImage(order) {
  const selectedImage = String(order?.selected_color_image || '').trim()
  const fallbackImage = String(order?.product_thumbnail || '').trim()
  return selectedImage || fallbackImage || ''
}

function getOrderHistoryLifecycle(order) {
  const paymentStatus = String(order?.payment_status || '').toLowerCase()
  const paymentMethod = String(order?.payment_method || '').toUpperCase()
  const orderStatus = String(order?.status || '').toLowerCase()
  const shippingArranged = Number(order?.shipping_arranged || 0) === 1
  const trackingCode = String(order?.shipping_tracking_code || '').trim()
  const hasTracking = !!trackingCode

  if (orderStatus === 'cancelled') {
    return { key: 'cancelled', label: 'Đã huỷ', icon: 'fa-ban', toneClass: 'order-status-chip--cancelled', clickable: false, hasJourney: false }
  }
  if (orderStatus === 'done') {
    return { key: 'done', label: 'Đã nhận', icon: 'fa-circle-check', toneClass: 'order-status-chip--done', clickable: true, hasJourney: true }
  }
  if (orderStatus === 'shipping') {
    return { key: 'shipping', label: 'Đang giao', icon: 'fa-truck-fast', toneClass: 'order-status-chip--shipping', clickable: true, hasJourney: true }
  }
  if (shippingArranged || hasTracking) {
    return { key: 'waiting_pickup', label: 'Đang chờ lấy hàng', icon: 'fa-truck-ramp-box', toneClass: 'order-status-chip--waiting-pickup', clickable: true, hasJourney: true }
  }
  if (paymentStatus !== 'paid' && paymentMethod !== 'COD') {
    return { key: 'waiting_payment', label: 'Đang chờ thanh toán', icon: 'fa-clock', toneClass: 'order-status-chip--waiting-payment', clickable: false, hasJourney: false }
  }
  return { key: 'waiting_shop', label: 'Đang chờ shop duyệt', icon: 'fa-bolt', toneClass: 'order-status-chip--waiting-shop', clickable: false, hasJourney: false }
}

function renderShippingJourneyModal(order) {
  const content = document.getElementById('shippingJourneyContent')
  if (!content) return
  const lifecycle = getOrderHistoryLifecycle(order)
  const trackingCode = String(order?.shipping_tracking_code || '').trim()
  const stepKeyOrder = ['waiting_shop', 'waiting_pickup', 'shipping', 'done']
  const activeIndexMap = { waiting_shop: 0, waiting_pickup: 1, shipping: 2, done: 3, cancelled: -2, waiting_payment: -1 }
  const activeIndex = activeIndexMap[lifecycle.key] ?? 0
  const stepLabels = {
    waiting_shop: 'Shop duyệt đơn',
    waiting_pickup: 'Đang chờ lấy hàng',
    shipping: 'Đang giao',
    done: 'Đã nhận'
  }
  const journeyNote = lifecycle.key === 'waiting_shop'
    ? 'Đơn đang chờ shop duyệt.'
    : lifecycle.key === 'waiting_payment'
      ? 'Đơn chưa hoàn tất thanh toán.'
      : lifecycle.key === 'cancelled'
        ? 'Đơn đã bị hủy.'
        : lifecycle.key === 'done'
          ? 'Đơn đã được giao thành công.'
          : 'Đơn đã được đẩy sang đơn vị vận chuyển.'

  const stepsHtml = stepKeyOrder.map(function (key, idx) {
    const isComplete = activeIndex >= idx
    const isActive = activeIndex === idx
    const stateClass = isActive ? 'is-active' : isComplete ? 'is-complete' : ''
    return '<div class="shipping-journey-step ' + stateClass + ' pb-4">'
      + '<div class="flex items-start gap-3">'
      + '<div class="pt-0.5"><div class="w-5 h-5 rounded-full border-2 ' + (isComplete ? 'border-green-500 bg-green-500' : 'border-gray-300 bg-white') + '"></div></div>'
      + '<div class="min-w-0 flex-1">'
      + '<p class="font-semibold text-gray-800">' + escapeHtml(stepLabels[key]) + '</p>'
      + '<p class="text-xs text-gray-500 mt-0.5">' + (isActive ? 'Trạng thái hiện tại' : isComplete ? 'Đã hoàn thành' : 'Đang chờ') + '</p>'
      + '</div>'
      + '</div>'
      + '</div>'
  }).join('')

  const trackingHtml = trackingCode
    ? '<div class="mt-4 rounded-2xl border bg-gray-50 p-4">'
      + '<p class="text-xs font-semibold text-gray-500 mb-1">Mã vận đơn</p>'
      + '<div class="flex items-center justify-between gap-2">'
      + '<span class="font-mono font-bold text-blue-600 text-sm break-all">' + escapeHtml(trackingCode) + '</span>'
      + '<button type="button" class="text-xs font-semibold text-gray-600 hover:text-gray-800" data-code="' + escapeHtml(trackingCode) + '" onclick="copyBankValue(this.dataset.code)">Copy</button>'
      + '</div>'
      + '</div>'
    : ''

  content.innerHTML = ''
    + '<div class="rounded-2xl border p-4">'
    + '<div class="flex items-center justify-between gap-3 mb-3">'
    + '<div>'
    + '<p class="text-xs text-gray-500">Đơn hàng</p>'
    + '<p class="font-mono text-sm font-bold text-blue-600">' + escapeHtml(String(order?.order_code || '')) + '</p>'
    + '</div>'
    + '<span class="order-status-chip ' + lifecycle.toneClass + '"><i class="fas ' + lifecycle.icon + '"></i>' + escapeHtml(lifecycle.label) + '</span>'
    + '</div>'
    + '<p class="text-sm text-gray-600">' + escapeHtml(journeyNote) + '</p>'
    + trackingHtml
    + '</div>'
    + '<div class="mt-4">' + stepsHtml + '</div>'
}

function openShippingJourneyModal(orderId) {
  const order = Array.isArray(userOrderHistoryCache)
    ? userOrderHistoryCache.find(function (item) { return Number(item.id) === Number(orderId) })
    : null
  if (!order) return
  const lifecycle = getOrderHistoryLifecycle(order)
  if (!lifecycle.hasJourney) return
  const overlay = document.getElementById('shippingJourneyOverlay')
  if (!overlay) return
  renderShippingJourneyModal(order)
  overlay.classList.remove('hidden')
  overlay.classList.add('flex')
}

function closeShippingJourneyModal() {
  const overlay = document.getElementById('shippingJourneyOverlay')
  if (!overlay) return
  overlay.classList.add('hidden')
  overlay.classList.remove('flex')
}

function handleShippingJourneyOverlayClick(e) {
  if (e.target && e.target.id === 'shippingJourneyOverlay') closeShippingJourneyModal()
}

async function showUserOrders() {
  const content = document.getElementById('userMenuContent')
  if (!currentUser) {
    content.innerHTML = '<div class="text-center py-8 text-gray-400"><i class="fas fa-lock text-3xl mb-3"></i><p>Vui lòng đăng nhập để xem lịch sử</p></div>'
    return
  }
  if (isAdminUser) {
    content.innerHTML = '<div class="text-center py-8 text-gray-400"><i class="fas fa-user-shield text-3xl mb-3"></i><p>Tài khoản quản trị không có lịch sử mua hàng</p></div>'
    return
  }
  content.innerHTML = '<div class="text-center py-8"><i class="fas fa-spinner fa-spin text-2xl text-pink-400"></i></div>'
  try {
    const escapeHtml = function (value) {
      return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
    }
    const getOrderHistoryImage = function (o) {
      const selectedImage = String(o.selected_color_image || '').trim()
      const fallbackImage = String(o.product_thumbnail || '').trim()
      return selectedImage || fallbackImage || ''
    }
    const res = await axios.get('/api/user/orders')
    let orders = res.data.data || []
    const unpaidGatewayOrders = orders.filter(function (o) {
      const method = String(o.payment_method || '').toUpperCase()
      const unpaid = String(o.payment_status || '').toLowerCase() !== 'paid'
      return unpaid && (method === 'BANK_TRANSFER' || method === 'ZALOPAY')
    }).slice(0, 6)
    if (unpaidGatewayOrders.length) {
      await Promise.all(unpaidGatewayOrders.map(function (o) {
        const method = String(o.payment_method || '').toUpperCase()
        const syncEndpoint = method === 'ZALOPAY'
          ? '/api/orders/' + o.id + '/zalopay-sync'
          : '/api/orders/' + o.id + '/payos-sync'
        return axios.post(syncEndpoint).catch(function () { return null })
      }))
      const refreshed = await axios.get('/api/user/orders')
      orders = refreshed.data.data || orders
    }
    userOrderHistoryCache = Array.isArray(orders) ? orders : []
    if (!orders.length) {
      content.innerHTML = '<div class="text-center py-8 text-gray-400"><i class="fas fa-shopping-bag text-4xl mb-3"></i><p>Chưa có đơn hàng nào</p></div>'
      return
    }
    content.innerHTML = '<h3 class="font-semibold text-gray-800 mb-3"><i class="fas fa-clipboard-list text-pink-400 mr-2"></i>Lịch sử mua hàng</h3>'
      + '<div class="space-y-2">' + orders.map(function(o) {
        const paymentPaid = String(o.payment_status || '').toLowerCase() === 'paid'
        const paymentBadgeClass = paymentPaid ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
        const paymentBadgeText = paymentPaid ? 'Đã thanh toán' : 'Chưa thanh toán'
        const paymentMethod = String(o.payment_method || '').toUpperCase()
        const orderStatus = String(o.status || '').toLowerCase()
        const canResume = !paymentPaid
          && paymentMethod === 'BANK_TRANSFER'
          && orderStatus !== 'cancelled'
          && orderStatus !== 'done'
        const imageSrc = getOrderHistoryImage(o)
        const colorText = String(o.color || '').trim() || 'Chưa chọn'
        const sizeText = String(o.size || '').trim() || '--'
        const quantityText = Number(o.quantity || 1) > 1 ? ' x' + Number(o.quantity || 1) : ''
        const productTitle = escapeHtml(o.product_name || '')
        const lifecycle = getOrderHistoryLifecycle(o)
        const safeOrderCode = String(o.order_code || '').replace(/'/g, "\\'")
        const methodArg = paymentMethod.replace(/'/g, "\\'")
        const codeHtml = canResume
          ? '<button class="font-mono text-xs text-blue-600 font-semibold hover:underline" onclick="resumeOrderPayment(' + o.id + ',\\'' + safeOrderCode + '\\',\\'' + methodArg + '\\')">' + escapeHtml(o.order_code || '') + '</button>'
          : '<span class="font-mono text-xs text-blue-600 font-semibold">' + escapeHtml(o.order_code || '') + '</span>'
        const resumeActionHtml = canResume
          ? '<button class="mt-2 w-full rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2 transition" onclick="resumeOrderPayment(' + o.id + ',\\'' + safeOrderCode + '\\',\\'' + methodArg + '\\')"><i class="fas fa-qrcode mr-1"></i>Thanh toán</button>'
          : ''
        const imageHtml = imageSrc
          ? '<div class="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100"><img src="' + escapeHtml(imageSrc) + '" alt="' + productTitle + '" class="w-full h-full object-cover"></div>'
          : '<div class="w-16 h-16 rounded-lg bg-gray-100 flex-shrink-0 border border-gray-100 flex items-center justify-center text-gray-300"><i class="fas fa-image"></i></div>'
        const statusHtml = lifecycle.clickable
          ? '<button type="button" class="order-status-chip clickable ' + lifecycle.toneClass + '" onclick="openShippingJourneyModal(' + o.id + ')"><i class="fas ' + lifecycle.icon + '"></i>' + escapeHtml(lifecycle.label) + '</button>'
          : '<span class="order-status-chip ' + lifecycle.toneClass + '"><i class="fas ' + lifecycle.icon + '"></i>' + escapeHtml(lifecycle.label) + '</span>'
        return '<div class="order-history-item border rounded-xl p-3">'
          + '<div class="flex gap-3">'
          + imageHtml
          + '<div class="min-w-0 flex-1">'
          + '<div class="flex justify-between items-start gap-2 mb-1">' + codeHtml
          + '<span class="text-xs px-2 py-0.5 rounded-full font-medium ' + paymentBadgeClass + ' whitespace-nowrap">' + paymentBadgeText + '</span></div>'
          + '<p class="text-sm font-semibold text-gray-800 leading-snug order-history-title">' + productTitle + '</p>'
          + '<p class="text-xs text-gray-500 mt-1">Màu: ' + escapeHtml(colorText) + ' | Size: ' + escapeHtml(sizeText) + quantityText + '</p>'
          + '<div class="flex justify-between items-center mt-2 gap-2"><span class="text-xs text-gray-400">' + new Date(o.created_at).toLocaleDateString('vi-VN') + '</span>'
          + '<span class="font-bold text-pink-600 text-sm whitespace-nowrap">' + fmtPrice(getOrderAmountDue(o)) + '</span></div>'
          + '<div class="mt-2">' + statusHtml + '</div>'
          + resumeActionHtml
          + '</div>'
          + '</div>'
          + '</div>'
      }).join('') + '</div>'
  } catch { content.innerHTML = '<div class="text-center py-8 text-red-400">Lỗi tải dữ liệu</div>' }
}

async function resumeOrderPayment(orderId, orderCode, paymentMethod) {
  const method = String(paymentMethod || '').toUpperCase()
  const isZaloPay = method === 'ZALOPAY'
  if (isZaloPay) {
    const check = await ensureZaloPayConfigReady(true)
    if (!check.ready) return
  }
  const providerLabel = isZaloPay ? 'ZaloPay' : 'PayOS'
  const createEndpoint = isZaloPay ? '/api/orders/' + orderId + '/zalopay-link' : '/api/orders/' + orderId + '/payos-link'
  const syncEndpoint = isZaloPay ? '/api/orders/' + orderId + '/zalopay-sync' : '/api/orders/' + orderId + '/payos-sync'
  let payTab = isZaloPay ? openOrReuseZaloPayLinkTab() : window.open('about:blank', '_blank')
  const openCheckoutUrl = function (url) {
    const checkoutUrl = String(url || '').trim()
    if (!checkoutUrl) return false
    if (payTab) {
      try { payTab.location.href = checkoutUrl } catch (_) { payTab = null }
      if (isZaloPay && payTab) zaloPayLinkTab = payTab
      return true
    }
    payTab = window.open(checkoutUrl, '_blank')
    if (isZaloPay && payTab) zaloPayLinkTab = payTab
    return !!payTab
  }
  try {
    const paymentRes = await axios.post(createEndpoint, { origin: window.location.origin })
    const paymentData = paymentRes.data?.data || {}
    if (paymentData.alreadyPaid) {
      try { if (payTab && !payTab.closed) payTab.close() } catch (_) { }
      await axios.post(syncEndpoint).catch(function () { return null })
      showUserOrders()
      showToast('Đơn này đã thanh toán thành công', 'success', 3500)
      return
    }
    const checkoutUrl = isZaloPay
      ? String(paymentData.orderUrl || '').trim()
      : String(paymentData.checkoutUrl || '').trim()
    if (!checkoutUrl) {
      try { if (payTab && !payTab.closed) payTab.close() } catch (_) { }
      showToast('Không tạo được link thanh toán ' + providerLabel, 'error', 3500)
      return
    }
    if (!openCheckoutUrl(checkoutUrl)) {
      showToast('Trình duyệt đang chặn popup, vui lòng cho phép mở tab mới', 'warning', 3800)
      return
    }
    startOrderPaymentPolling(orderCode)
    showToast('Đang mở lại trang ' + providerLabel + ' để bạn thanh toán tiếp', 'success', 3500)
  } catch (err) {
    const errCode = err.response?.data?.error
    const fallbackUrl = isZaloPay
      ? String(err.response?.data?.detail?.order_url || err.response?.data?.detail?.data?.order_url || '').trim()
      : String(err.response?.data?.detail?.checkoutUrl || err.response?.data?.detail?.data?.checkoutUrl || '').trim()
    if (fallbackUrl && openCheckoutUrl(fallbackUrl)) {
      startOrderPaymentPolling(orderCode)
      showToast('Đang mở lại trang ' + providerLabel + ' để bạn thanh toán tiếp', 'success', 3500)
      return
    }
    if (errCode === 'ZALOPAY_CONFIG_MISSING') {
      const missing = Array.isArray(err.response?.data?.missing) ? err.response.data.missing : []
      const detail = missing.length ? (': ' + missing.join(', ')) : ''
      showToast('ZaloPay chua cau hinh day du' + detail, 'error', 5500)
      return
    }
    if (errCode === 'PAYOS_CONFIG_MISSING') {
      showToast('PayOS chưa cấu hình đầy đủ, vui lòng liên hệ shop', 'error', 5500)
      return
    }
    if (errCode === 'PAYMENT_METHOD_NOT_BANK_TRANSFER') {
      showToast('Đơn này không dùng phương thức chuyển khoản', 'error', 3800)
      return
    }
    if (errCode === 'ORDER_NOT_FOUND') {
      showToast('Không tìm thấy đơn hàng để thanh toán lại', 'error', 3800)
      return
    }
    if (errCode === 'INVALID_ORDER_AMOUNT') {
      showToast('Đơn hàng có số tiền không hợp lệ để thanh toán', 'error', 3800)
      return
    }
    try { if (payTab && !payTab.closed) payTab.close() } catch (_) { }
    const msg = err.response?.data?.error || err.message || 'Không thể mở lại thanh toán cho đơn này'
    showToast('Không thể mở lại thanh toán: ' + msg, 'error', 4000)
  }
}

// ── WALLET CONFIG (thay thông tin ngân hàng ở đây) ──
const BANK_CONFIG = {
  bankId: 'MB',
  accountNo: '0200100441441',
  accountName: 'TRAN CONG HANH',
  template: 'compact2'
}

let selectedTopupAmount = 50000

function getVietQRUrl(amount, customInfo = '') {
  const info = customInfo || ('QHVN90' + (currentUser ? currentUser.userId : ''))
  return 'https://img.vietqr.io/image/' + BANK_CONFIG.bankId + '-' + BANK_CONFIG.accountNo + '-' + BANK_CONFIG.template + '.png?amount=' + amount + '&addInfo=' + encodeURIComponent(info) + '&accountName=' + encodeURIComponent(BANK_CONFIG.accountName)
}

function getOrderTransferContent(orderCode) {
  const safeCode = String(orderCode || '').replace(/[^a-zA-Z0-9]/g, '')
  return 'DH' + safeCode
}

function openOrderBankTransferModal(info) {
  const orderCode = info?.orderCode || ''
  const amount = Number(info?.amount || 0)
  const transferContent = info?.transferContent || getOrderTransferContent(info?.orderId || orderCode)
  const qrImage = getVietQRUrl(amount, transferContent)
  pendingBankTransferOrder = { orderCode, amount, transferContent, paymentLinkId: info?.paymentLinkId || '' }
  document.getElementById('orderBankOrderCode').textContent = orderCode
  document.getElementById('orderBankAmountDisplay').textContent = fmtPrice(amount)
  document.getElementById('orderBankAccountNo').textContent = BANK_CONFIG.accountNo
  document.getElementById('orderBankAccountName').textContent = BANK_CONFIG.accountName
  document.getElementById('orderBankTransferContent').textContent = transferContent
  document.getElementById('orderBankQrImg').src = qrImage
  document.getElementById('orderBankTransferOverlay').classList.remove('hidden')
  document.body.style.overflow = 'hidden'
  startOrderPaymentPolling(orderCode)
}

function closeOrderBankTransferModal() {
  document.getElementById('orderBankTransferOverlay').classList.add('hidden')
  stopOrderPaymentPolling()
  pendingBankTransferOrder = null
  document.body.style.overflow = ''
}

async function copyBankValue(value) {
  try {
    await navigator.clipboard.writeText(String(value || '').trim())
    showToast('Đã sao chép', 'success', 1500)
  } catch (_) {
    showToast('Không thể sao chép', 'error', 1500)
  }
}

function stopOrderPaymentPolling() {
  if (bankTransferPollTimer) {
    clearInterval(bankTransferPollTimer)
    bankTransferPollTimer = null
  }
}

function showOrderPaidNotice(orderCode) {
  const overlay = document.getElementById('orderPaidNoticeOverlay')
  const codeEl = document.getElementById('orderPaidNoticeCode')
  if (codeEl) codeEl.textContent = orderCode || ''
  if (!overlay) return
  overlay.classList.remove('hidden')
  overlay.classList.add('flex')
  setTimeout(() => {
    overlay.classList.add('hidden')
    overlay.classList.remove('flex')
  }, 2600)
}

function onOrderMarkedPaid(orderCode) {
  stopOrderPaymentPolling()
  closeOrderBankTransferModal()
  showOrderPaidNotice(orderCode)
  showToast('Đã thanh toán thành công và ghi nhận đơn hàng', 'success', 4500)
  const userMenuContent = document.getElementById('userMenuContent')
  if (userMenuContent && userMenuContent.textContent && userMenuContent.textContent.includes('Lịch sử mua hàng')) {
    showUserOrders()
  }
  if (typeof loadAdminOrders === 'function') loadAdminOrders()
}

function startOrderPaymentPolling(orderCode) {
  stopOrderPaymentPolling()
  bankTransferPollTimer = setInterval(async () => {
    try {
      const res = await axios.get('/api/orders/' + encodeURIComponent(orderCode) + '/payment-status')
      const paymentStatus = res.data?.data?.payment_status
      if (paymentStatus === 'paid') {
        onOrderMarkedPaid(orderCode)
      }
    } catch (_) { }
  }, 4000)
}

function cleanPaymentQueryParams() {
  const url = new URL(window.location.href)
  if (!url.searchParams.has('pay')) return
  url.searchParams.delete('pay')
  url.searchParams.delete('order')
  url.searchParams.delete('provider')
  url.searchParams.delete('closeTab')
  const next = url.pathname + (url.searchParams.toString() ? '?' + url.searchParams.toString() : '') + url.hash
  window.history.replaceState({}, '', next)
}

function handlePaymentReturnFlow() {
  const params = new URLSearchParams(window.location.search)
  const payState = String(params.get('pay') || '').toLowerCase()
  const orderCode = String(params.get('order') || '').trim().toUpperCase()
  const provider = String(params.get('provider') || 'payos').trim().toLowerCase()
  const providerLabel = provider === 'zalopay' ? 'ZaloPay' : 'PayOS'
  const closeTab = params.get('closeTab') === '1'
  if (!payState) return

  if (payState === 'success' && orderCode) {
    try {
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage({ type: 'payment_paid', orderCode, provider }, window.location.origin)
      }
    } catch (_) { }
    startOrderPaymentPolling(orderCode)
    cleanPaymentQueryParams()
    if (closeTab && window.opener && !window.opener.closed) {
      setTimeout(() => { window.close() }, 80)
      return
    }
    showToast('Thanh toán ' + providerLabel + ' thành công', 'success', 3000)
    return
  }

  if (payState === 'cancel') {
    showToast('Bạn đã hủy thanh toán ' + providerLabel, 'error', 3000)
  }
  cleanPaymentQueryParams()
}

function showWalletInMenu() {
    var content = document.getElementById('userMenuContent')
    if (!currentUser) {
        content.innerHTML = '<div class="text-center py-8 text-gray-400"><i class="fas fa-lock text-3xl mb-3"></i><p>Vui lòng đăng nhập để nạp tiền</p></div>'
        return
    }
    var tc = 'QHVN90' + currentUser.userId
    var html = '<div class="bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl p-4 mb-4 flex items-center justify-between">'
    html += '<div><p class="text-xs text-gray-500">Số dư ví</p><p class="text-xl font-bold text-pink-600">' + fmtBalance(currentUser.balance) + '</p></div>'
    html += '<i class="fas fa-wallet text-3xl text-pink-300"></i></div>'
    html += '<h4 class="font-semibold text-gray-700 text-sm mb-2"><i class="fas fa-coins text-pink-400 mr-1"></i>Chọn số tiền</h4>'
    html += '<div class="grid grid-cols-3 gap-2 mb-3" id="topupAmountGrid">'
    var amounts = [50000, 100000, 200000, 500000, 1000000, 2000000]
    for (var i = 0; i < amounts.length; i++) {
        var v = amounts[i]
        var isActive = v === selectedTopupAmount
        var cls = isActive ? 'border-pink-500 bg-pink-50 text-pink-600' : 'border-gray-200 text-gray-600 hover:border-pink-300'
        html += '<button onclick="selectTopupAmount(' + v + ')" class="topup-amt-btn border-2 rounded-xl py-2 text-xs font-semibold transition ' + cls + '" data-amt="' + v + '">' + new Intl.NumberFormat('vi-VN').format(v) + 'đ</button>'
    }
    html += '</div>'
    html += '<div class="flex items-center gap-2 mb-4"><input id="customTopupAmt" type="number" placeholder="Số tiền khác..." class="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-pink-400 outline-none" oninput="onCustomAmountInput(this.value)"><span class="text-gray-400 text-sm font-semibold">đ</span></div>'
    html += '<div class="bg-white border-2 border-gray-100 rounded-2xl p-4 text-center">'
    html += '<p class="text-sm font-semibold text-gray-700 mb-3"><i class="fas fa-qrcode text-pink-400 mr-1"></i>Quét mã QR để thanh toán</p>'
    html += '<div class="flex justify-center mb-3"><img id="vietqrImg" src="' + getVietQRUrl(selectedTopupAmount) + '" class="w-48 h-48 object-contain rounded-xl border"></div>'
    html += '<div class="text-left space-y-2 text-xs">'
    html += '<div class="flex justify-between items-center bg-gray-50 rounded-lg px-3 py-2"><span class="text-gray-500">Ngân hàng</span><span class="font-bold text-gray-800">MB Bank</span></div>'
    html += '<div class="flex justify-between items-center bg-gray-50 rounded-lg px-3 py-2"><span class="text-gray-500">Số TK</span><span class="font-bold text-gray-800">' + BANK_CONFIG.accountNo + ' <i class="fas fa-copy text-gray-400 cursor-pointer ml-1 copy-btn" data-copy="' + BANK_CONFIG.accountNo + '"></i></span></div>'
    html += '<div class="flex justify-between items-center bg-gray-50 rounded-lg px-3 py-2"><span class="text-gray-500">Chủ TK</span><span class="font-bold text-gray-800">' + BANK_CONFIG.accountName + '</span></div>'
    html += '<div class="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2"><p class="text-amber-600 font-semibold mb-0.5">Nội dung CK (BẮT BUỘC)</p><div class="flex justify-between items-center"><span class="font-mono font-bold text-amber-800 text-sm">' + tc + '</span><i class="fas fa-copy text-amber-400 cursor-pointer copy-btn" data-copy="' + tc + '"></i></div></div>'
    html += '<div class="flex justify-between items-center bg-gray-50 rounded-lg px-3 py-2"><span class="text-gray-500">Số tiền</span><span class="font-bold text-pink-600" id="qrAmountDisplay">' + fmtBalance(selectedTopupAmount) + '</span></div>'
    html += '</div></div>'
    html += '<div class="mt-3 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 text-xs text-blue-700 space-y-1">'
    html += '<p class="font-semibold"><i class="fas fa-info-circle mr-1"></i>Lưu ý:</p>'
    html += '<p>• Nội dung CK phải <strong>CHÍNH XÁC</strong></p>'
    html += '<p>• Tiền sẽ được cộng <strong>tự động</strong> trong 1-5 phút</p>'
    html += '<p>• Liên hệ admin nếu không nhận được tiền sau 10 phút</p>'
    html += '</div>'
    content.innerHTML = html
}

function selectTopupAmount(amt) {
    selectedTopupAmount = amt
    document.querySelectorAll('.topup-amt-btn').forEach(function (btn) {
        var btnAmt = parseInt(btn.getAttribute('data-amt'))
        if (btnAmt === amt) {
            btn.className = btn.className.replace(/border-gray-200 text-gray-600 hover:border-pink-300/g, '').replace(/border-pink-500 bg-pink-50 text-pink-600/g, '') + ' border-pink-500 bg-pink-50 text-pink-600'
        } else {
            btn.className = btn.className.replace(/border-pink-500 bg-pink-50 text-pink-600/g, '').replace(/border-gray-200 text-gray-600 hover:border-pink-300/g, '') + ' border-gray-200 text-gray-600 hover:border-pink-300'
        }
    })
    var ci = document.getElementById('customTopupAmt')
    if (ci) ci.value = ''
    updateQRCode(amt)
}

function onCustomAmountInput(val) {
    var amt = parseInt(val) || 0
    if (amt >= 2000) {
        selectedTopupAmount = amt
        document.querySelectorAll('.topup-amt-btn').forEach(function (btn) {
            btn.className = btn.className.replace(/border-pink-500 bg-pink-50 text-pink-600/g, '') + ' border-gray-200 text-gray-600 hover:border-pink-300'
        })
        updateQRCode(amt)
    }
}

function updateQRCode(amount) {
    var img = document.getElementById('vietqrImg')
    var display = document.getElementById('qrAmountDisplay')
    if (img) img.src = getVietQRUrl(amount)
    if (display) display.textContent = fmtBalance(amount)
}

function copyText(text) {
    navigator.clipboard.writeText(text).then(function () { showToast('Đã sao chép: ' + text, 'success') })
}

// Event delegation for copy buttons
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('copy-btn') && e.target.dataset.copy) {
    copyText(e.target.dataset.copy)
  }
})

function openTopupModal() {
    if (!currentUser) { toggleUserMenu(); return }
    openUserMenu()
    showWalletInMenu()
}

// ── BALANCE POLLING & SUCCESS NOTIFICATION ──
var balancePollingTimer = null
var lastKnownBalance = null

function startBalancePolling() {
  if (balancePollingTimer) return
  if (!currentUser) return
  lastKnownBalance = currentUser.balance || 0
  balancePollingTimer = setInterval(checkBalanceChange, 5000)
}

function stopBalancePolling() {
  if (balancePollingTimer) { clearInterval(balancePollingTimer); balancePollingTimer = null }
}

async function checkBalanceChange() {
  if (!currentUser) { stopBalancePolling(); return }
  try {
    var res = await axios.get('/api/auth/me')
    if (res.data.data && res.data.data.balance !== undefined) {
      var newBalance = res.data.data.balance
      if (lastKnownBalance !== null && newBalance > lastKnownBalance) {
        var added = newBalance - lastKnownBalance
        currentUser.balance = newBalance
        updateUserUI()
        showWalletInMenu()
        showTopupSuccessModal(added)
        playTingSound()
      }
      lastKnownBalance = newBalance
      currentUser.balance = newBalance
    }
  } catch(e) {}
}

function showTopupSuccessModal(amount) {
  var overlay = document.createElement('div')
  overlay.id = 'topupSuccessOverlay'
  overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);backdrop-filter:blur(4px);z-index:9999;display:flex;align-items:center;justify-content:center;animation:fadeIn 0.3s ease'
  overlay.innerHTML = '<div style="background:white;border-radius:1.5rem;padding:2.5rem 2rem;text-align:center;max-width:340px;width:90%;box-shadow:0 25px 50px rgba(0,0,0,0.25);animation:scaleIn 0.4s cubic-bezier(0.34,1.56,0.64,1)">'
    + '<div style="width:70px;height:70px;border-radius:50%;background:linear-gradient(135deg,#10b981,#059669);margin:0 auto 1rem;display:flex;align-items:center;justify-content:center"><i class="fas fa-check" style="color:white;font-size:2rem"></i></div>'
    + '<h3 style="color:#059669;font-size:1.25rem;font-weight:700;margin-bottom:0.5rem">Đã nạp tiền thành công!</h3>'
    + '<p style="color:#047857;font-size:1.75rem;font-weight:800">+' + fmtBalance(amount) + '</p>'
    + '<p style="color:#6b7280;font-size:0.8rem;margin-top:0.5rem">Số dư mới: ' + fmtBalance(currentUser.balance) + '</p>'
    + '<button onclick="closeTopupSuccessModal()" style="margin-top:1.25rem;background:linear-gradient(135deg,#10b981,#059669);color:white;border:none;padding:0.75rem 2rem;border-radius:0.75rem;font-weight:600;font-size:0.9rem;cursor:pointer">OK</button>'
    + '</div>'
  document.body.appendChild(overlay)
  overlay.addEventListener('click', function(e) { if (e.target === overlay) closeTopupSuccessModal() })
}

function closeTopupSuccessModal() {
  var el = document.getElementById('topupSuccessOverlay')
  if (el) el.remove()
}

function playTingSound() {
  try {
    var ctx = new (window.AudioContext || window.webkitAudioContext)()
    // Note 1
    var osc1 = ctx.createOscillator()
    var gain1 = ctx.createGain()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(880, ctx.currentTime)
    gain1.gain.setValueAtTime(0.3, ctx.currentTime)
    gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.start(ctx.currentTime)
    osc1.stop(ctx.currentTime + 0.3)
    // Note 2 (higher, delayed)
    var osc2 = ctx.createOscillator()
    var gain2 = ctx.createGain()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(1318, ctx.currentTime + 0.15)
    gain2.gain.setValueAtTime(0.01, ctx.currentTime)
    gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.15)
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.start(ctx.currentTime + 0.15)
    osc2.stop(ctx.currentTime + 0.5)
  } catch(e) {}
}

// Start polling when wallet menu is opened
var origShowWallet = showWalletInMenu
showWalletInMenu = function() { origShowWallet(); startBalancePolling() }

// Stop polling when user menu closes
var origCloseMenu = closeUserMenu
closeUserMenu = function() { stopBalancePolling(); origCloseMenu() }
</script>
</body>
</html>`
}
