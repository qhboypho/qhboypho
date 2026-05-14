export function storefrontThemeRefreshStyles(): string {
  return `
  :root {
    --qh-bg: #020817;
    --qh-bg-soft: #061128;
    --qh-surface: rgba(7,20,45,0.82);
    --qh-surface-strong: rgba(8,22,48,0.92);
    --qh-border: rgba(96,191,255,0.42);
    --qh-border-pink: rgba(236,91,255,0.46);
    --qh-text: #f8fbff;
    --qh-muted: #aab8d7;
    --qh-glow-blue: rgba(49,151,255,0.34);
    --qh-glow-pink: rgba(219,75,255,0.3);
    --qh-shadow: 0 28px 80px rgba(0,0,0,0.44), 0 0 42px rgba(39,139,255,0.14), inset 0 1px 0 rgba(255,255,255,0.08);
    --qh-card-bg: linear-gradient(135deg, rgba(6,22,51,0.96) 0%, rgba(8,16,42,0.94) 52%, rgba(42,21,72,0.9) 100%);
    --qh-chip-bg: linear-gradient(180deg, rgba(122,177,246,0.45), rgba(44,86,139,0.55));
    --qh-chip-border: rgba(159,203,255,0.56);
    --qh-price-gradient: linear-gradient(135deg, #8e5dff 0%, #c768ff 42%, #ff63d5 100%);
  }
  body[data-storefront-theme='dark'] {
    --qh-bg: #020b1a;
    --qh-bg-soft: #07172d;
    --qh-surface: rgba(7,20,45,0.84);
    --qh-surface-strong: rgba(8,22,48,0.95);
    --qh-border: rgba(96,191,255,0.46);
    --qh-border-pink: rgba(236,91,255,0.5);
    --qh-text: #f7fbff;
    --qh-muted: #a9b8d3;
    --qh-glow-blue: rgba(14,165,233,0.34);
    --qh-glow-pink: rgba(217,70,239,0.3);
    --qh-shadow: 0 30px 86px rgba(0,0,0,0.5), 0 0 44px rgba(59,130,246,0.14), inset 0 1px 0 rgba(255,255,255,0.08);
  }
  body[data-storefront-theme] {
    background:
      radial-gradient(circle at 12% 8%, rgba(30,144,255,0.28), transparent 30rem),
      radial-gradient(circle at 88% 10%, rgba(172,70,255,0.28), transparent 34rem),
      radial-gradient(circle at 52% 48%, rgba(22,87,180,0.18), transparent 38rem),
      linear-gradient(135deg, #010713 0%, #051126 44%, #130824 100%) !important;
    color: var(--qh-text);
  }
  body[data-storefront-theme]::before {
    content: '';
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: -1;
    background-image:
      linear-gradient(rgba(96,191,255,0.045) 1px, transparent 1px),
      linear-gradient(90deg, rgba(236,91,255,0.035) 1px, transparent 1px);
    background-size: 38px 38px;
    mask-image: linear-gradient(to bottom, rgba(0,0,0,0.9), rgba(0,0,0,0.2) 70%, transparent);
  }
  body[data-storefront-theme='dark']::before {
    background-image:
      linear-gradient(rgba(125,211,252,0.075) 1px, transparent 1px),
      linear-gradient(90deg, rgba(125,211,252,0.075) 1px, transparent 1px);
  }
  .navbar-blur {
    background: rgba(3,11,26,0.82) !important;
    border-bottom: 1px solid var(--qh-border) !important;
    box-shadow: 0 12px 38px rgba(0,0,0,0.34), 0 0 26px rgba(59,130,246,0.14);
  }
  .navbar-blur a,
  .navbar-blur button {
    color: var(--qh-text) !important;
  }
  .navbar-blur .text-pink-400 {
    color: #63e4ff !important;
  }
  .navbar-blur .bg-white\\/20,
  #userAvatarDefault {
    background: rgba(116,137,172,0.26) !important;
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
    background: rgba(2,8,18,0.94) !important;
    border-color: var(--qh-border) !important;
  }
  .storefront-marquee-text {
    color: rgba(232,240,255,0.9) !important;
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
    background: var(--qh-card-bg) !important;
    border: 1px solid color-mix(in srgb, var(--qh-border) 68%, var(--qh-border-pink)) !important;
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
    border: 1px solid color-mix(in srgb, var(--qh-border) 70%, var(--qh-border-pink));
    border-radius: 1.35rem;
    background: var(--qh-card-bg) !important;
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
    color: #55defc !important;
    text-shadow: 0 0 18px rgba(85,222,252,0.28);
  }
  body[data-storefront-theme='dark'] .hero-badge,
  body[data-storefront-theme='dark'] #products .text-pink-500,
  body[data-storefront-theme='dark'] #bestsellersSection .text-violet-400 {
    color: #5ee7ff !important;
  }
  .hero-title-gradient,
  .text-gradient-price,
  .bs-price {
    background: var(--qh-price-gradient) !important;
    -webkit-background-clip: text !important;
    background-clip: text !important;
    -webkit-text-fill-color: transparent !important;
    filter: drop-shadow(0 0 14px rgba(199,104,255,0.22));
  }
  .line-through,
  .bs-original-price,
  .hero-carousel-original-price {
    color: rgba(173,184,208,0.62) !important;
    text-decoration-color: rgba(173,184,208,0.64) !important;
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
    background: linear-gradient(135deg, #337cff, #8d55ff 45%, #ec4fbe) !important;
    box-shadow: 0 14px 34px rgba(59,130,246,0.28), 0 10px 28px rgba(236,63,173,0.22) !important;
  }
  #filterBar {
    background: rgba(5,15,34,0.86) !important;
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
    background: rgba(111,148,202,0.18);
    border-color: var(--qh-border) !important;
  }
  .filter-btn.active {
    color: #fff !important;
    background: linear-gradient(135deg, #1847c7, #2357ff 52%, #7a45ff) !important;
    border-color: rgba(83,166,255,0.92) !important;
    box-shadow: 0 0 0 1px rgba(106,184,255,0.28), 0 0 22px rgba(49,151,255,0.34) !important;
  }
  #searchInput {
    background: rgba(5,17,38,0.74) !important;
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
    background: linear-gradient(145deg, rgba(7,22,50,0.96) 0%, rgba(7,16,39,0.95) 55%, rgba(35,18,63,0.88) 100%) !important;
    border: 1px solid rgba(96,191,255,0.42) !important;
    box-shadow: 0 18px 48px rgba(0,0,0,0.42), 0 0 28px rgba(57,149,255,0.12), inset 0 1px 0 rgba(255,255,255,0.08) !important;
    isolation: isolate;
    position: relative;
  }
  .hero-carousel-card {
    isolation: isolate;
    overflow: hidden;
  }
  .product-card::before,
  .bs-card::before,
  .flash-sale-shop-card::before,
  .hero-carousel-card::before,
  .product-card::after,
  .bs-card::after,
  .flash-sale-shop-card::after,
  .hero-carousel-card::after {
    content: '';
    position: absolute;
    pointer-events: none;
    z-index: 0;
    opacity: 0.95;
    transition: opacity 0.25s ease, transform 0.25s ease, filter 0.25s ease;
  }
  .product-card::before,
  .bs-card::before,
  .flash-sale-shop-card::before,
  .hero-carousel-card::before {
    left: -18%;
    bottom: -24%;
    width: 56%;
    height: 46%;
    background:
      radial-gradient(ellipse at bottom left, rgba(85,222,252,0.48) 0%, rgba(57,149,255,0.3) 34%, rgba(57,149,255,0.08) 62%, transparent 76%),
      linear-gradient(90deg, rgba(85,222,252,0.78), transparent 68%);
    filter: blur(15px);
  }
  .product-card::after,
  .bs-card::after,
  .flash-sale-shop-card::after,
  .hero-carousel-card::after {
    right: -18%;
    bottom: -24%;
    width: 58%;
    height: 48%;
    background:
      radial-gradient(ellipse at bottom right, rgba(236,91,255,0.52) 0%, rgba(139,85,255,0.3) 36%, rgba(139,85,255,0.08) 62%, transparent 76%),
      linear-gradient(270deg, rgba(236,91,255,0.8), transparent 68%);
    filter: blur(16px);
  }
  .product-card > *,
  .bs-card > *,
  .flash-sale-shop-card > *,
  .hero-carousel-card > * {
    position: relative;
    z-index: 1;
  }
  .product-card:hover::before,
  .bs-card:hover::before,
  .flash-sale-shop-card:hover::before,
  .hero-carousel-card:hover::before,
  .product-card:hover::after,
  .bs-card:hover::after,
  .flash-sale-shop-card:hover::after,
  .hero-carousel-card:hover::after {
    opacity: 1;
    filter: blur(12px);
    transform: translateY(-3px) scale(1.04);
  }
  .product-card:hover,
  .bs-card:hover,
  .flash-sale-shop-card:hover {
    border-color: rgba(220,109,255,0.58) !important;
    box-shadow: 0 24px 64px rgba(0,0,0,0.48), 0 0 36px rgba(77,163,255,0.18), 0 0 30px rgba(236,91,255,0.12) !important;
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
  .product-card .bg-gray-100,
  .product-card span[class*="bg-gray-100"],
  .product-card span[class*="bg-pink-50"],
  .product-card span[class*="text-gray-400"],
  .cart-modal span[class*="bg-gray-100"],
  .cart-modal span[class*="bg-pink-50"] {
    background: var(--qh-chip-bg) !important;
    border: 1px solid var(--qh-chip-border) !important;
    color: #eaf5ff !important;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.18), 0 8px 20px rgba(45,113,210,0.14);
    backdrop-filter: blur(10px);
  }
  .product-card span[class*="bg-pink-50"],
  .cart-modal span[class*="bg-pink-50"] {
    background: linear-gradient(180deg, rgba(73,137,222,0.5), rgba(36,74,130,0.58)) !important;
    color: #eaf5ff !important;
  }
  .product-card .badge-sale,
  .product-card span[class*="bg-amber-400"],
  .flash-sale-badge {
    background: linear-gradient(135deg, rgba(51,124,255,0.95), rgba(236,79,190,0.95)) !important;
    border: 1px solid rgba(255,255,255,0.22) !important;
    box-shadow: 0 10px 24px rgba(37,99,235,0.22), 0 0 18px rgba(236,79,190,0.22) !important;
  }
  .bs-sold-chip {
    background: rgba(91,131,246,0.18) !important;
    border-color: var(--qh-border) !important;
  }
  .bs-stars {
    color: #f6b91a !important;
  }
  body[data-storefront-theme='dark'] .product-card,
  body[data-storefront-theme='dark'] .bs-card,
  body[data-storefront-theme='dark'] .flash-sale-shop-card {
    background: linear-gradient(145deg, rgba(7,22,50,0.97) 0%, rgba(7,16,39,0.96) 55%, rgba(35,18,63,0.9) 100%) !important;
    border-color: rgba(96,191,255,0.46) !important;
    box-shadow: 0 22px 58px rgba(0,0,0,0.48), 0 0 32px rgba(57,149,255,0.14), inset 0 1px 0 rgba(255,255,255,0.08) !important;
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
