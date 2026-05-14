export function storefrontThemeRefreshStyles(): string {
  return `
  :root {
    --qh-bg: #f7f9fc;
    --qh-bg-soft: #eef4fb;
    --qh-surface: rgba(255,255,255,0.94);
    --qh-surface-strong: rgba(255,255,255,0.98);
    --qh-border: rgba(203,213,225,0.9);
    --qh-border-pink: rgba(236,72,153,0.22);
    --qh-text: #111827;
    --qh-muted: #64748b;
    --qh-glow-blue: rgba(59,130,246,0.12);
    --qh-glow-pink: rgba(236,72,153,0.1);
    --qh-shadow: 0 18px 46px rgba(15,23,42,0.08), inset 0 1px 0 rgba(255,255,255,0.85);
    --qh-card-bg: linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.98) 58%, rgba(252,244,255,0.96) 100%);
    --qh-product-card-bg: linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.98) 58%, rgba(252,244,255,0.96) 100%) padding-box, linear-gradient(135deg, rgba(203,213,225,0.95), rgba(236,72,153,0.24)) border-box;
    --qh-product-card-bg-hover: linear-gradient(145deg, rgba(255,255,255,1) 0%, rgba(248,250,252,1) 58%, rgba(252,244,255,0.98) 100%) padding-box, linear-gradient(135deg, rgba(59,130,246,0.42), rgba(236,72,153,0.42)) border-box;
    --qh-chip-bg: rgba(241,245,249,0.92);
    --qh-chip-border: rgba(203,213,225,0.9);
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
    --qh-card-bg: radial-gradient(circle at 88% 12%, rgba(91,38,150,0.34), transparent 38%), linear-gradient(135deg, rgba(2,13,31,0.99) 0%, rgba(4,15,38,0.98) 58%, rgba(23,15,55,0.96) 100%);
    --qh-product-card-bg: radial-gradient(circle at 92% 12%, rgba(105,43,170,0.34), transparent 38%) padding-box, linear-gradient(135deg, rgba(2,13,31,0.99) 0%, rgba(4,15,38,0.98) 58%, rgba(23,15,55,0.96) 100%) padding-box, linear-gradient(135deg, rgba(85,222,252,0.95) 0%, rgba(57,149,255,0.55) 28%, rgba(139,85,255,0.42) 58%, rgba(236,91,255,0.96) 100%) border-box;
    --qh-product-card-bg-hover: radial-gradient(circle at 92% 12%, rgba(119,49,191,0.38), transparent 40%) padding-box, linear-gradient(135deg, rgba(3,17,40,0.99) 0%, rgba(5,17,43,0.99) 58%, rgba(29,17,64,0.97) 100%) padding-box, linear-gradient(135deg, rgba(94,231,255,1) 0%, rgba(52,139,255,0.72) 30%, rgba(139,85,255,0.6) 58%, rgba(255,91,220,1) 100%) border-box;
    --qh-chip-bg: linear-gradient(180deg, rgba(122,177,246,0.45), rgba(44,86,139,0.55));
    --qh-chip-border: rgba(159,203,255,0.56);
  }
  body[data-storefront-theme] {
    background:
      radial-gradient(circle at 12% 8%, rgba(59,130,246,0.1), transparent 28rem),
      radial-gradient(circle at 88% 10%, rgba(236,72,153,0.1), transparent 30rem),
      linear-gradient(135deg, #f8fafc 0%, #f1f5f9 52%, #fdf2f8 100%) !important;
    color: var(--qh-text);
  }
  body[data-storefront-theme='dark'] {
    background:
      radial-gradient(circle at 12% 8%, rgba(30,144,255,0.28), transparent 30rem),
      radial-gradient(circle at 88% 10%, rgba(172,70,255,0.28), transparent 34rem),
      radial-gradient(circle at 52% 48%, rgba(22,87,180,0.18), transparent 38rem),
      linear-gradient(135deg, #010713 0%, #051126 44%, #130824 100%) !important;
  }
  body[data-storefront-theme]::before {
    content: '';
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: -1;
    background-image:
      linear-gradient(rgba(59,130,246,0.035) 1px, transparent 1px),
      linear-gradient(90deg, rgba(236,72,153,0.03) 1px, transparent 1px);
    background-size: 38px 38px;
    mask-image: linear-gradient(to bottom, rgba(0,0,0,0.9), rgba(0,0,0,0.2) 70%, transparent);
  }
  body[data-storefront-theme='dark']::before {
    background-image:
      linear-gradient(rgba(125,211,252,0.075) 1px, transparent 1px),
      linear-gradient(90deg, rgba(125,211,252,0.075) 1px, transparent 1px);
  }
  .navbar-blur {
    background: rgba(255,255,255,0.88) !important;
    border-bottom: 1px solid var(--qh-border) !important;
    box-shadow: 0 12px 34px rgba(15,23,42,0.08);
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
    background: rgba(255,255,255,0.86) !important;
    border: 1px solid var(--qh-border) !important;
    box-shadow: var(--qh-shadow) !important;
    max-width: none;
    margin: 0 0 1.5rem;
    border-radius: 1.1rem;
    top: 6rem !important;
  }
  #filterBar span,
  #filterBar .filter-btn {
    color: var(--qh-muted) !important;
  }
  .filter-btn {
    background: rgba(241,245,249,0.9);
    border-color: var(--qh-border) !important;
  }
  #filterBar .filter-btn.active {
    color: #fff !important;
    background: linear-gradient(135deg, #337cff, #8d55ff 45%, #ec4fbe) !important;
    border-color: rgba(255,255,255,0.34) !important;
    box-shadow: 0 14px 34px rgba(59,130,246,0.28), 0 10px 28px rgba(236,63,173,0.22) !important;
  }
  #searchInput {
    background: rgba(255,255,255,0.92) !important;
    color: #0f172a !important;
    border-color: var(--qh-border) !important;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.55);
  }
  #searchInput::placeholder {
    color: #64748b !important;
    opacity: 1;
  }
  body[data-storefront-theme='dark'] #filterBar {
    background: rgba(5,15,34,0.86) !important;
  }
  body[data-storefront-theme='dark'] #searchInput {
    background: rgba(6,20,40,0.72) !important;
    color: #f8fbff !important;
  }
  body[data-storefront-theme='dark'] #searchInput::placeholder {
    color: #9fb0ca !important;
  }
  body[data-storefront-theme='dark'] .filter-btn {
    background: rgba(6,20,40,0.72) !important;
  }
  .product-card,
  .bs-card,
  .flash-sale-shop-card {
    background: var(--qh-product-card-bg) !important;
    border: 1px solid transparent !important;
    box-shadow: 0 18px 48px rgba(0,0,0,0.42), 0 0 30px rgba(57,149,255,0.17), 0 0 32px rgba(236,91,255,0.12), inset 0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.08) !important;
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
    content: none;
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
    border-color: transparent !important;
    background: var(--qh-product-card-bg-hover) !important;
    box-shadow: 0 24px 64px rgba(0,0,0,0.48), 0 0 40px rgba(77,163,255,0.24), 0 0 38px rgba(236,91,255,0.18), inset 0 0 0 1px rgba(255,255,255,0.08) !important;
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
    color: #475569 !important;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.18), 0 8px 20px rgba(45,113,210,0.14);
    backdrop-filter: blur(10px);
  }
  .product-card span[class*="bg-pink-50"],
  .cart-modal span[class*="bg-pink-50"] {
    background: rgba(239,246,255,0.92) !important;
    color: #2563eb !important;
  }
  .product-card .line-through,
  .product-card .product-card-original-price,
  .bs-original-price,
  .hero-carousel-original-price {
    background: transparent !important;
    border: 0 !important;
    box-shadow: none !important;
    backdrop-filter: none !important;
    color: rgba(173,184,208,0.68) !important;
    text-decoration-color: rgba(173,184,208,0.7) !important;
  }
  .blocked-order-btn,
  .blocked-order-icon-btn {
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 0.6rem !important;
    border: 1px solid rgba(255,115,124,0.78) !important;
    background:
      radial-gradient(circle at 18% 50%, rgba(96,165,250,0.2), transparent 34%),
      linear-gradient(135deg, rgba(255,238,238,0.94), rgba(255,244,244,0.9)) !important;
    color: #ef4444 !important;
    box-shadow: 0 0 0 1px rgba(255,115,124,0.08), 0 12px 30px rgba(239,68,68,0.14), inset 0 1px 0 rgba(255,255,255,0.72) !important;
    cursor: not-allowed !important;
    letter-spacing: 0.01em;
  }
  .blocked-order-btn i {
    font-size: 1.05em;
  }
  .blocked-order-btn span {
    line-height: 1;
  }
  .blocked-order-icon-btn {
    border-radius: 0.85rem !important;
    padding: 0 !important;
  }
  .product-buy-btn {
    flex: 0 0 42%;
    min-width: 0;
    white-space: nowrap;
  }
  .product-cart-btn {
    flex: 1 1 auto;
    min-width: 0;
    padding-left: 0.75rem;
    padding-right: 0.75rem;
    font-size: 0.8125rem;
    font-weight: 700;
    white-space: nowrap;
  }
  body[data-storefront-theme='dark'] .blocked-order-btn,
  body[data-storefront-theme='dark'] .blocked-order-icon-btn {
    background:
      radial-gradient(circle at 18% 50%, rgba(59,130,246,0.22), transparent 34%),
      linear-gradient(135deg, rgba(38,22,44,0.92), rgba(57,18,56,0.88)) !important;
    color: #ff7b82 !important;
    border-color: rgba(255,115,124,0.9) !important;
    box-shadow: 0 0 0 1px rgba(255,115,124,0.18), 0 0 22px rgba(255,86,116,0.22), inset 0 1px 0 rgba(255,255,255,0.08) !important;
    text-shadow: 0 0 16px rgba(255,115,124,0.3);
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
    background: var(--qh-product-card-bg) !important;
    border-color: transparent !important;
    box-shadow: 0 22px 58px rgba(0,0,0,0.48), 0 0 34px rgba(57,149,255,0.18), 0 0 34px rgba(236,91,255,0.13), inset 0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.08) !important;
  }
  body[data-storefront-theme='dark'] .product-card .bg-gray-100,
  body[data-storefront-theme='dark'] .product-card span[class*="bg-gray-100"],
  body[data-storefront-theme='dark'] .product-card span[class*="text-gray-400"],
  body[data-storefront-theme='dark'] .cart-modal span[class*="bg-gray-100"] {
    color: #eaf5ff !important;
  }
  body[data-storefront-theme='dark'] .product-card span[class*="bg-pink-50"],
  body[data-storefront-theme='dark'] .cart-modal span[class*="bg-pink-50"] {
    background: linear-gradient(180deg, rgba(73,137,222,0.5), rgba(36,74,130,0.58)) !important;
    color: #eaf5ff !important;
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
      margin-left: 0;
      margin-right: 0;
      max-width: 100%;
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
    #productsGrid,
    #productsModalGrid {
      grid-template-columns: minmax(0, 1fr) !important;
      gap: 0.6rem !important;
    }
    #products .product-card,
    #productsModalOverlay .product-card {
      display: flex !important;
      align-items: stretch;
      border-radius: 1rem !important;
      min-height: 142px;
    }
    #products .product-card > .relative,
    #productsModalOverlay .product-card > .relative {
      flex: 0 0 40%;
      min-width: 0;
      aspect-ratio: 1 / 1;
    }
    #products .product-card .product-img-main,
    #productsModalOverlay .product-card .product-img-main {
      height: 100% !important;
      min-height: 100%;
    }
    #products .product-card > .p-3,
    #productsModalOverlay .product-card > .p-3 {
      flex: 1 1 auto;
      min-width: 0;
      padding: 0.65rem !important;
      display: flex;
      flex-direction: column;
    }
    #products .product-card h3,
    #productsModalOverlay .product-card h3 {
      font-size: 0.875rem !important;
      line-height: 1.2 !important;
      margin-bottom: 0.35rem !important;
    }
    #products .product-card p,
    #productsModalOverlay .product-card p {
      margin-bottom: 0.2rem !important;
    }
    #products .product-card .text-gradient-price,
    #productsModalOverlay .product-card .text-gradient-price {
      font-size: 0.95rem !important;
    }
    #products .product-card .flex.gap-1,
    #productsModalOverlay .product-card .flex.gap-1 {
      gap: 0.25rem !important;
      margin-bottom: 0.45rem !important;
    }
    #products .product-card .flex.gap-1 span,
    #productsModalOverlay .product-card .flex.gap-1 span {
      font-size: 0.6875rem !important;
      padding: 0.08rem 0.42rem !important;
    }
    #products .product-card .badge-sale,
    #products .product-card span[class*="bg-amber-400"],
    #productsModalOverlay .product-card .badge-sale,
    #productsModalOverlay .product-card span[class*="bg-amber-400"] {
      top: 0.45rem !important;
      font-size: 0.6875rem !important;
      padding: 0.18rem 0.45rem !important;
    }
    #products .product-card .badge-sale,
    #productsModalOverlay .product-card .badge-sale {
      left: 0.45rem !important;
    }
    #products .product-card span[class*="bg-amber-400"],
    #productsModalOverlay .product-card span[class*="bg-amber-400"] {
      right: 0.45rem !important;
    }
    #products .product-buy-btn,
    #productsModalOverlay .product-buy-btn {
      flex-basis: 38%;
      font-size: 0.75rem !important;
      padding-left: 0.4rem !important;
      padding-right: 0.4rem !important;
    }
    #products .product-cart-btn,
    #productsModalOverlay .product-cart-btn {
      font-size: 0.75rem !important;
      padding-left: 0.5rem !important;
      padding-right: 0.5rem !important;
    }
  }`
}
