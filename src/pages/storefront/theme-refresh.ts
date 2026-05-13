export function storefrontThemeRefreshStyles(): string {
  return `
  :root {
    --qh-bg: #f7fbff;
    --qh-bg-soft: #eef7ff;
    --qh-surface: rgba(255,255,255,0.78);
    --qh-surface-strong: rgba(255,255,255,0.92);
    --qh-border: rgba(133,166,210,0.26);
    --qh-text: #10194a;
    --qh-muted: #62708f;
    --qh-glow-blue: rgba(56,189,248,0.18);
    --qh-glow-pink: rgba(236,72,153,0.14);
    --qh-shadow: 0 18px 48px rgba(32,82,148,0.12), 0 2px 10px rgba(15,23,42,0.04);
  }
  body[data-storefront-theme='dark'] {
    --qh-bg: #020b1a;
    --qh-bg-soft: #07172d;
    --qh-surface: rgba(8,23,45,0.78);
    --qh-surface-strong: rgba(9,24,48,0.94);
    --qh-border: rgba(99,179,237,0.28);
    --qh-text: #f7fbff;
    --qh-muted: #a9b8d3;
    --qh-glow-blue: rgba(14,165,233,0.22);
    --qh-glow-pink: rgba(217,70,239,0.18);
    --qh-shadow: 0 24px 70px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.04);
  }
  body[data-storefront-theme] {
    background:
      radial-gradient(circle at 18% 10%, var(--qh-glow-blue), transparent 34rem),
      radial-gradient(circle at 86% 22%, var(--qh-glow-pink), transparent 28rem),
      linear-gradient(180deg, var(--qh-bg) 0%, var(--qh-bg-soft) 48%, var(--qh-bg) 100%) !important;
    color: var(--qh-text);
  }
  body[data-storefront-theme]::before {
    content: '';
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: -1;
    background-image:
      linear-gradient(rgba(59,130,246,0.055) 1px, transparent 1px),
      linear-gradient(90deg, rgba(59,130,246,0.055) 1px, transparent 1px);
    background-size: 34px 34px;
    mask-image: linear-gradient(to bottom, rgba(0,0,0,0.9), rgba(0,0,0,0.2) 70%, transparent);
  }
  body[data-storefront-theme='dark']::before {
    background-image:
      linear-gradient(rgba(125,211,252,0.075) 1px, transparent 1px),
      linear-gradient(90deg, rgba(125,211,252,0.075) 1px, transparent 1px);
  }
  .navbar-blur {
    background: rgba(255,255,255,0.78) !important;
    border-bottom: 1px solid var(--qh-border) !important;
    box-shadow: var(--qh-shadow);
  }
  .navbar-blur a,
  .navbar-blur button {
    color: var(--qh-text) !important;
  }
  .navbar-blur .text-pink-400 {
    color: #e83faa !important;
  }
  .navbar-blur .bg-white\\/20,
  #userAvatarDefault {
    background: rgba(37,99,235,0.08) !important;
    border: 1px solid var(--qh-border);
  }
  body[data-storefront-theme='dark'] .navbar-blur {
    background: rgba(2,12,30,0.72) !important;
    border-color: rgba(80,160,220,0.36) !important;
  }
  body[data-storefront-theme='dark'] .navbar-blur a,
  body[data-storefront-theme='dark'] .navbar-blur button {
    color: #f8fbff !important;
  }
  .storefront-marquee-bar {
    background: rgba(255,255,255,0.7) !important;
    border-color: var(--qh-border) !important;
  }
  .storefront-marquee-text {
    color: var(--qh-text) !important;
  }
  body[data-storefront-theme='dark'] .storefront-marquee-bar {
    background: rgba(3,10,25,0.84) !important;
  }
  body[data-storefront-theme='dark'] .storefront-marquee-text {
    color: #dbeafe !important;
  }
  .gradient-hero,
  #bestsellersSection,
  #about,
  footer {
    background:
      radial-gradient(circle at 18% 12%, var(--qh-glow-blue), transparent 34rem),
      radial-gradient(circle at 82% 36%, var(--qh-glow-pink), transparent 28rem),
      var(--qh-surface) !important;
    border: 1px solid var(--qh-border);
    box-shadow: var(--qh-shadow);
  }
  #hero.gradient-hero {
    max-width: 96rem;
    margin: 6rem auto 0;
    border-radius: 1.35rem;
    overflow: hidden;
  }
  #bestsellersSection,
  #about,
  footer {
    max-width: 96rem;
    margin-left: auto;
    margin-right: auto;
    border-radius: 1.35rem;
  }
  #bestsellersSection {
    margin-top: 1rem;
  }
  #products {
    max-width: 96rem;
    margin-top: 1rem;
    margin-bottom: 1rem;
    border: 1px solid var(--qh-border);
    border-radius: 1.35rem;
    background: var(--qh-surface) !important;
    box-shadow: var(--qh-shadow);
  }
  #hero h1,
  #products h2,
  #bestsellersSection h2,
  #about h3,
  footer h3,
  footer h4 {
    color: var(--qh-text) !important;
  }
  #hero p,
  #products p,
  #about p,
  footer p,
  footer a {
    color: var(--qh-muted) !important;
  }
  .hero-badge,
  #products .text-pink-500,
  #bestsellersSection .text-violet-400 {
    color: #e83faa !important;
  }
  body[data-storefront-theme='dark'] .hero-badge,
  body[data-storefront-theme='dark'] #products .text-pink-500,
  body[data-storefront-theme='dark'] #bestsellersSection .text-violet-400 {
    color: #5ee7ff !important;
  }
  .hero-title-gradient,
  .text-gradient-price,
  .bs-price {
    background: linear-gradient(135deg, #2f7df4, #e83faa) !important;
    -webkit-background-clip: text !important;
    background-clip: text !important;
    -webkit-text-fill-color: transparent !important;
  }
  body[data-storefront-theme='dark'] .hero-title-gradient,
  body[data-storefront-theme='dark'] .text-gradient-price,
  body[data-storefront-theme='dark'] .bs-price {
    background: linear-gradient(135deg, #51d6ff, #ff57d0) !important;
    -webkit-background-clip: text !important;
    background-clip: text !important;
    -webkit-text-fill-color: transparent !important;
  }
  #hero .border-white\\/30 {
    border-color: var(--qh-border) !important;
    color: var(--qh-text) !important;
    background: rgba(255,255,255,0.45);
    box-shadow: 0 12px 26px rgba(30,64,175,0.08);
  }
  body[data-storefront-theme='dark'] #hero .border-white\\/30 {
    background: rgba(8,23,45,0.58);
    color: #f8fbff !important;
  }
  .btn-primary,
  .add-to-cart-btn {
    background: linear-gradient(135deg, #3388ff, #ec3fad) !important;
    box-shadow: 0 14px 30px rgba(59,130,246,0.22), 0 10px 24px rgba(236,63,173,0.16) !important;
  }
  #filterBar {
    background: var(--qh-surface-strong) !important;
    border: 1px solid var(--qh-border) !important;
    box-shadow: var(--qh-shadow) !important;
    max-width: 96rem;
    margin: 1rem auto 0;
    border-radius: 1.1rem;
    top: 6rem !important;
  }
  #filterBar span,
  #filterBar .filter-btn {
    color: var(--qh-muted) !important;
  }
  .filter-btn {
    background: rgba(255,255,255,0.48);
    border-color: var(--qh-border) !important;
  }
  .filter-btn.active {
    color: #fff !important;
    background: linear-gradient(135deg, #5b8cff, #a855f7) !important;
  }
  #searchInput {
    background: rgba(255,255,255,0.62) !important;
    color: var(--qh-text) !important;
    border-color: var(--qh-border) !important;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.55);
  }
  body[data-storefront-theme='dark'] #searchInput,
  body[data-storefront-theme='dark'] .filter-btn {
    background: rgba(6,20,40,0.72) !important;
  }
  .product-card,
  .bs-card,
  .flash-sale-shop-card {
    background: var(--qh-surface-strong) !important;
    border: 1px solid var(--qh-border) !important;
    box-shadow: 0 16px 36px rgba(28,80,150,0.1) !important;
  }
  .product-card:hover,
  .bs-card:hover,
  .flash-sale-shop-card:hover {
    box-shadow: 0 24px 54px rgba(28,80,150,0.18) !important;
  }
  .product-card h3,
  .bs-name {
    color: var(--qh-text) !important;
  }
  .product-card .text-gray-500,
  .product-card .text-gray-600,
  .product-card p,
  .bs-sold-chip {
    color: var(--qh-muted) !important;
  }
  .bs-sold-chip {
    background: rgba(74,144,255,0.1) !important;
    border-color: var(--qh-border) !important;
  }
  .bs-stars {
    color: #f6b91a !important;
  }
  body[data-storefront-theme='dark'] .product-card,
  body[data-storefront-theme='dark'] .bs-card,
  body[data-storefront-theme='dark'] .flash-sale-shop-card {
    background: linear-gradient(180deg, rgba(11,32,58,0.94), rgba(7,19,38,0.96)) !important;
    border-color: rgba(76,166,232,0.36) !important;
    box-shadow: 0 20px 50px rgba(0,0,0,0.36), inset 0 1px 0 rgba(255,255,255,0.04) !important;
  }
  #flashSaleShopSection > div {
    background: var(--qh-surface) !important;
    border-color: var(--qh-border) !important;
    box-shadow: var(--qh-shadow) !important;
  }
  #flashSaleShopSection h2 {
    color: var(--qh-text) !important;
  }
  #flashSaleShopSection p {
    color: var(--qh-muted) !important;
  }
  #about .p-6 {
    background: var(--qh-surface-strong);
    border: 1px solid var(--qh-border);
    border-radius: 1rem;
    box-shadow: 0 12px 28px rgba(28,80,150,0.08);
  }
  #about .bg-pink-50 {
    background: linear-gradient(135deg, rgba(49,132,255,0.12), rgba(236,63,173,0.14)) !important;
  }
  #about .text-pink-500 {
    color: #7c3aed !important;
  }
  footer {
    color: var(--qh-text) !important;
  }
  footer .border-white\\/10 {
    border-color: var(--qh-border) !important;
  }
  body[data-storefront-theme='dark'] footer .text-gray-400,
  body[data-storefront-theme='dark'] footer .text-gray-500 {
    color: var(--qh-muted) !important;
  }
  body[data-storefront-theme='dark'] .overlay,
  body[data-storefront-theme='dark'] .user-menu-overlay,
  body[data-storefront-theme='dark'] .review-modal-overlay {
    background: rgba(1,8,20,0.72) !important;
  }
  body[data-storefront-theme='dark'] .popup-card,
  body[data-storefront-theme='dark'] .cart-modal,
  body[data-storefront-theme='dark'] .user-menu-panel,
  body[data-storefront-theme='dark'] .review-modal-panel {
    background: linear-gradient(180deg, rgba(9,24,48,0.98), rgba(4,13,29,0.98)) !important;
    color: var(--qh-text) !important;
    border: 1px solid rgba(80,160,220,0.28) !important;
    box-shadow: 0 28px 80px rgba(0,0,0,0.56) !important;
  }
  body[data-storefront-theme='dark'] .popup-card .bg-white,
  body[data-storefront-theme='dark'] .cart-modal .bg-white,
  body[data-storefront-theme='dark'] .user-menu-panel .bg-white,
  body[data-storefront-theme='dark'] .review-modal-panel .bg-white,
  body[data-storefront-theme='dark'] .popup-card .bg-gray-50,
  body[data-storefront-theme='dark'] .cart-modal .bg-gray-50,
  body[data-storefront-theme='dark'] .user-menu-panel .bg-gray-50,
  body[data-storefront-theme='dark'] .review-modal-panel .bg-gray-50,
  body[data-storefront-theme='dark'] .review-card,
  body[data-storefront-theme='dark'] .cart-item-inner,
  body[data-storefront-theme='dark'] .cart-item,
  body[data-storefront-theme='dark'] .order-history-item {
    background: rgba(11,32,58,0.82) !important;
    border-color: rgba(80,160,220,0.24) !important;
  }
  body[data-storefront-theme='dark'] .popup-card .sticky,
  body[data-storefront-theme='dark'] .cart-modal .sticky,
  body[data-storefront-theme='dark'] .review-modal-panel .sticky {
    background: rgba(7,20,40,0.96) !important;
    border-color: rgba(80,160,220,0.24) !important;
  }
  body[data-storefront-theme='dark'] .popup-card h1,
  body[data-storefront-theme='dark'] .popup-card h2,
  body[data-storefront-theme='dark'] .popup-card h3,
  body[data-storefront-theme='dark'] .cart-modal h1,
  body[data-storefront-theme='dark'] .cart-modal h2,
  body[data-storefront-theme='dark'] .cart-modal h3,
  body[data-storefront-theme='dark'] .user-menu-panel h1,
  body[data-storefront-theme='dark'] .user-menu-panel h2,
  body[data-storefront-theme='dark'] .user-menu-panel h3,
  body[data-storefront-theme='dark'] .review-modal-panel h1,
  body[data-storefront-theme='dark'] .review-modal-panel h2,
  body[data-storefront-theme='dark'] .review-modal-panel h3,
  body[data-storefront-theme='dark'] .popup-card .text-gray-900,
  body[data-storefront-theme='dark'] .cart-modal .text-gray-900,
  body[data-storefront-theme='dark'] .user-menu-panel .text-gray-900,
  body[data-storefront-theme='dark'] .review-modal-panel .text-gray-900 {
    color: #f8fbff !important;
  }
  body[data-storefront-theme='dark'] .popup-card p,
  body[data-storefront-theme='dark'] .popup-card label,
  body[data-storefront-theme='dark'] .cart-modal p,
  body[data-storefront-theme='dark'] .cart-modal label,
  body[data-storefront-theme='dark'] .user-menu-panel p,
  body[data-storefront-theme='dark'] .user-menu-panel label,
  body[data-storefront-theme='dark'] .review-modal-panel p,
  body[data-storefront-theme='dark'] .review-modal-panel label,
  body[data-storefront-theme='dark'] .popup-card .text-gray-500,
  body[data-storefront-theme='dark'] .popup-card .text-gray-600,
  body[data-storefront-theme='dark'] .cart-modal .text-gray-500,
  body[data-storefront-theme='dark'] .cart-modal .text-gray-600,
  body[data-storefront-theme='dark'] .user-menu-panel .text-gray-500,
  body[data-storefront-theme='dark'] .user-menu-panel .text-gray-600,
  body[data-storefront-theme='dark'] .review-modal-panel .text-gray-500,
  body[data-storefront-theme='dark'] .review-modal-panel .text-gray-600 {
    color: var(--qh-muted) !important;
  }
  body[data-storefront-theme='dark'] .popup-card input,
  body[data-storefront-theme='dark'] .popup-card textarea,
  body[data-storefront-theme='dark'] .popup-card select,
  body[data-storefront-theme='dark'] .cart-modal input,
  body[data-storefront-theme='dark'] .cart-modal textarea,
  body[data-storefront-theme='dark'] .cart-modal select,
  body[data-storefront-theme='dark'] .review-modal-panel textarea {
    background: rgba(4,15,32,0.78) !important;
    border-color: rgba(80,160,220,0.3) !important;
    color: #f8fbff !important;
  }
  body[data-storefront-theme='dark'] .popup-card input::placeholder,
  body[data-storefront-theme='dark'] .popup-card textarea::placeholder,
  body[data-storefront-theme='dark'] .cart-modal input::placeholder,
  body[data-storefront-theme='dark'] .cart-modal textarea::placeholder,
  body[data-storefront-theme='dark'] .review-modal-panel textarea::placeholder {
    color: rgba(169,184,211,0.7) !important;
  }
  body[data-storefront-theme='dark'] .payment-method-btn,
  body[data-storefront-theme='dark'] .size-btn,
  body[data-storefront-theme='dark'] .color-btn,
  body[data-storefront-theme='dark'] .detail-color-card {
    background: rgba(8,23,45,0.82) !important;
    border-color: rgba(80,160,220,0.26) !important;
    color: var(--qh-text) !important;
  }
  @media (max-width: 768px) {
    html,
    body {
      max-width: 100%;
      overflow-x: hidden !important;
    }
    #hero.gradient-hero {
      margin-top: 5.5rem;
      border-radius: 1rem;
      max-width: calc(100% - 1.5rem);
      margin-left: 0.75rem;
      margin-right: 0.75rem;
    }
    #filterBar {
      top: 5rem !important;
      border-radius: 1rem;
      margin-left: 0.75rem;
      margin-right: 0.75rem;
      max-width: calc(100% - 1.5rem);
    }
    #products,
    #bestsellersSection,
    #about,
    footer {
      border-radius: 1rem;
      margin-left: 0.75rem;
      margin-right: 0.75rem;
      max-width: calc(100% - 1.5rem);
    }
    #bestsellersSection .max-w-7xl:first-child {
      gap: 0.75rem;
      align-items: flex-start;
    }
    #bestsellersSection h2 {
      font-size: 1.75rem !important;
      line-height: 1.1 !important;
    }
  }`
}
