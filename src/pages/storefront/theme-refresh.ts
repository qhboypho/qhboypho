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
    background: transparent !important;
    border: 0 !important;
    box-shadow: none !important;
    max-width: none;
    width: 100%;
    margin: 0 0 1rem;
    border-radius: 0;
    top: 6rem !important;
  }
  .filter-shell {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    width: 100%;
    padding: 1rem 1rem 0.9rem;
    border-radius: 1.35rem;
    background: transparent !important;
    border: 0 !important;
    box-shadow: none !important;
  }
  .filter-chip-group {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    min-width: 0;
  }
  .filter-label {
    display: inline-flex;
    align-items: center;
    color: var(--qh-muted);
    font-size: 0.96rem;
    font-weight: 600;
    white-space: nowrap;
  }
  .filter-search-row {
    display: flex;
    align-items: center;
  }
  .filter-search-wrap {
    position: relative;
    width: 100%;
  }
  .filter-search-icon {
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--qh-muted);
    font-size: 0.95rem;
    pointer-events: none;
  }
  .filter-search-input {
    width: 100%;
    height: 3.5rem;
    padding: 0 1rem 0 2.75rem;
    border-radius: 999px;
    border: 1px solid var(--qh-border);
    background: transparent !important;
    color: #0f172a;
    font-size: 1rem;
    box-shadow: none !important;
    outline: none;
  }
  .filter-search-input:focus {
    border-color: rgba(94,231,255,0.8);
    box-shadow: 0 0 0 3px rgba(94,231,255,0.12), inset 0 1px 0 rgba(255,255,255,0.55);
  }
  .filter-search-input::placeholder {
    color: #64748b;
    opacity: 1;
  }
  .filter-chip-row {
    display: flex;
    gap: 0.75rem;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
    padding: 0.05rem 0 0.1rem;
  }
  .filter-chip-row::-webkit-scrollbar {
    display: none;
  }
  .filter-chip-row .filter-btn {
    flex: 0 0 auto;
    min-height: 2.65rem;
    padding: 0 1.25rem;
    border-radius: 999px;
    border: 1px solid var(--qh-border) !important;
    font-size: 0.96rem;
    font-weight: 600;
    color: var(--qh-muted) !important;
  }
  .filter-btn {
    background: rgba(241,245,249,0.9);
    border-color: var(--qh-border) !important;
  }
  .filter-chip-row .filter-btn.active {
    color: #fff !important;
    background: linear-gradient(135deg, #337cff, #8d55ff 45%, #ec4fbe) !important;
    border-color: rgba(255,255,255,0.34) !important;
    box-shadow: 0 14px 34px rgba(59,130,246,0.28), 0 10px 28px rgba(236,63,173,0.22) !important;
  }
  .filter-meta-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    width: 100%;
    margin-top: 0.7rem;
    padding: 0 0.15rem 0.1rem;
  }
  .filter-product-count {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--qh-muted);
    font-size: 0.95rem;
    font-weight: 600;
    white-space: nowrap;
  }
  .filter-meta-actions {
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
    min-width: 0;
  }
  .filter-sort-wrap {
    position: relative;
    display: inline-flex;
    align-items: center;
    min-width: 0;
  }
  .filter-sort-wrap > i {
    position: absolute;
    left: 0.85rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--qh-muted);
    font-size: 0.85rem;
    pointer-events: none;
  }
  .filter-sort-select {
    min-width: 8.75rem;
    height: 2.4rem;
    padding: 0 2rem 0 2.1rem;
    border-radius: 999px;
    border: 1px solid var(--qh-border);
    background: rgba(255,255,255,0.82);
    color: var(--qh-muted);
    font-size: 0.92rem;
    font-weight: 600;
    outline: none;
    appearance: none;
  }
  .filter-view-toggle {
    display: none;
    width: 2.4rem;
    min-width: 2.4rem;
    height: 2.4rem;
    border-radius: 999px;
    border: 1px solid var(--qh-border);
    background: rgba(255,255,255,0.82);
    color: var(--qh-muted);
    align-items: center;
    justify-content: center;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.45);
  }
  .filter-view-toggle.active {
    color: #fff;
    background: linear-gradient(135deg, #337cff, #8d55ff 45%, #ec4fbe) !important;
    border-color: rgba(255,255,255,0.34) !important;
    box-shadow: 0 14px 34px rgba(59,130,246,0.28), 0 10px 28px rgba(236,63,173,0.22) !important;
  }
  #productsMoreWrap button {
    transition: transform 0.16s ease, box-shadow 0.16s ease, opacity 0.16s ease;
  }
  #productsMoreWrap button:active {
    transform: translateY(1px) scale(0.97);
    opacity: 0.88;
  }
  body[data-storefront-theme='dark'] #filterBar {
    background: transparent !important;
  }
  body[data-storefront-theme='dark'] .filter-shell {
    background: transparent !important;
    border: 0 !important;
    box-shadow: none !important;
  }
  body[data-storefront-theme='dark'] .filter-search-icon,
  body[data-storefront-theme='dark'] .filter-product-count,
  body[data-storefront-theme='dark'] .filter-sort-wrap > i,
  body[data-storefront-theme='dark'] .filter-sort-select,
  body[data-storefront-theme='dark'] .filter-chip-row .filter-btn {
    color: #cbd5e1 !important;
  }
  body[data-storefront-theme='dark'] .filter-search-input {
    background: transparent !important;
    color: #f8fbff !important;
    border-color: rgba(80,160,220,0.28) !important;
    box-shadow: none !important;
  }
  body[data-storefront-theme='dark'] .filter-search-input::placeholder {
    color: #9fb0ca !important;
  }
  body[data-storefront-theme='dark'] .filter-chip-row .filter-btn,
  body[data-storefront-theme='dark'] .filter-sort-select {
    background: rgba(6,20,40,0.72) !important;
    border-color: rgba(80,160,220,0.28) !important;
  }
  body[data-storefront-theme='dark'] .filter-chip-row .filter-btn.active {
    color: #fff !important;
    background: linear-gradient(135deg, #337cff, #8d55ff 45%, #ec4fbe) !important;
    border-color: rgba(255,255,255,0.34) !important;
    box-shadow: 0 14px 34px rgba(59,130,246,0.28), 0 10px 28px rgba(236,63,173,0.22) !important;
  }
  body[data-storefront-theme='dark'] .filter-view-toggle {
    background: rgba(6,20,40,0.72) !important;
    border-color: rgba(80,160,220,0.28) !important;
    color: #cbd5e1 !important;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
  }
  @media (min-width: 769px) {
    #filterBar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin: 0 0 1rem;
      padding: 0.75rem 1rem;
      border-radius: 1.1rem;
      background: rgba(255,255,255,0.9) !important;
      border: 1px solid var(--qh-border) !important;
      box-shadow: 0 16px 36px rgba(15,23,42,0.08);
    }
    .filter-shell {
      flex: 1 1 auto;
      flex-direction: row-reverse;
      align-items: center;
      justify-content: flex-end;
      gap: 0.9rem;
      padding: 0;
      border: 0 !important;
      border-radius: 0;
      background: transparent !important;
      box-shadow: none !important;
    }
    .filter-chip-group {
      flex: 0 0 auto;
      min-width: 0;
    }
    .filter-chip-row {
      flex-wrap: nowrap;
      overflow: visible;
      padding: 0;
    }
    .filter-search-row {
      flex: 0 0 16rem;
      width: 16rem;
      justify-content: flex-start;
    }
    .filter-search-input {
      height: 2.2rem;
      padding-left: 2.35rem;
      font-size: 0.95rem;
      background: rgba(255,255,255,0.95);
    }
    .filter-meta-row {
      display: none;
    }
    body[data-storefront-theme='dark'] #filterBar {
      background: rgba(7,20,45,0.86) !important;
      border-color: rgba(80,160,220,0.28) !important;
      box-shadow: 0 18px 38px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04);
    }
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
  .product-card {
    display: flex;
    flex-direction: column;
  }
  .bs-card,
  .flash-sale-shop-card {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  .bs-card-body,
  .flash-sale-shop-body {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    min-height: 0;
  }
  .bestsellers-track,
  .flash-sale-shop-track {
    align-items: stretch;
  }
  .bs-name,
  .flash-sale-shop-body h3 {
    min-height: calc(1.35em * 2);
  }
  .quick-order-label-mobile {
    display: none;
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
  .bs-name,
  .flash-sale-shop-body h3,
  .hero-carousel-title,
  .hero-banner-card .banner-title,
  .hero-mobile-card-name {
    color: var(--qh-text) !important;
  }
  .favorite-toggle-btn {
    position: absolute;
    top: 0.7rem;
    left: 0.7rem;
    z-index: 6;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: auto;
    height: auto;
    padding: 0;
    border: 0 !important;
    border-radius: 0;
    background: none !important;
    color: #9ca3af;
    backdrop-filter: none;
    box-shadow: none !important;
    transition: transform 0.16s ease, color 0.16s ease;
  }
  .favorite-toggle-btn i {
    font-size: 1.28rem;
    line-height: 1;
  }
  .favorite-toggle-btn:hover {
    transform: scale(1.04);
  }
  .favorite-toggle-btn.active {
    background: none !important;
    color: #ff5ca8 !important;
    border: 0 !important;
    box-shadow: none !important;
  }
  .bs-card .bs-medal {
    left: auto;
    right: 0.75rem;
  }
  .favorites-products-grid .product-card {
    display: grid;
    grid-template-columns: minmax(0, 40%) minmax(0, 1fr);
    align-items: stretch;
    height: 100%;
  }
  .favorites-products-grid .product-card > .relative {
    min-width: 0;
  }
  .favorites-products-grid .product-card > .relative > .absolute.inset-0 {
    display: none !important;
  }
  .favorites-products-grid .product-card .product-img-main {
    display: block;
    width: 100%;
    aspect-ratio: 1 / 1;
    height: auto !important;
    object-fit: cover;
  }
  .favorites-products-grid .product-card > .p-3 {
    padding: 0.7rem !important;
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    min-height: 0;
  }
  .favorites-products-grid .product-card-actions {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin-top: auto;
  }
  .favorites-products-grid .product-buy-btn,
  .favorites-products-grid .product-cart-btn {
    min-height: 0 !important;
    height: 2.05rem !important;
    border-radius: 0.72rem !important;
    font-size: 0.72rem !important;
    line-height: 1 !important;
  }
  .favorites-products-grid .product-buy-btn {
    flex: auto !important;
    width: auto !important;
    max-width: calc(100% - 60px - 0.5rem) !important;
    padding: 0 0.62rem !important;
  }
  .favorites-products-grid .product-cart-btn {
    flex: 0 0 60px !important;
    min-width: 60px !important;
    width: 60px !important;
    padding: 0 !important;
    gap: 0 !important;
  }
  .favorites-products-grid .product-cart-btn span {
    display: none !important;
  }
  .favorites-products-grid .product-card .text-gradient-price {
    font-size: 0.92rem !important;
  }
  .favorites-products-grid .product-card p.text-pink-500 {
    display: none !important;
  }
  .favorites-products-grid .product-card h3 {
    font-size: 0.82rem !important;
    line-height: 1.18 !important;
    margin-bottom: 0.45rem !important;
    display: block !important;
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
  }
  .favorites-products-grid .product-card p {
    font-size: 0.68rem !important;
    line-height: 1.15 !important;
    margin-bottom: 0.35rem !important;
  }
  .favorites-products-grid .product-card .product-rating-stars-desktop {
    display: inline-flex !important;
    margin-left: 0 !important;
  }
  .favorites-products-grid .product-card .product-card-social-meta,
  .favorites-products-grid .product-card .flex.gap-1,
  .favorites-products-grid .product-card .product-card-sold-text {
    display: none !important;
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
  #products .product-card > .relative,
  #productsModalOverlay .product-card > .relative {
    background: transparent !important;
  }
  #products .product-card,
  #productsModalOverlay .product-card {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    height: 100%;
  }
  #products .product-card > .relative,
  #productsModalOverlay .product-card > .relative {
    min-width: 0;
  }
  #products .product-card .product-img-main,
  #productsModalOverlay .product-card .product-img-main {
    display: block;
    width: 100%;
    aspect-ratio: 1 / 1;
    height: auto !important;
    object-fit: cover;
  }
  #products .product-card > .p-3,
  #productsModalOverlay .product-card > .p-3 {
    padding: 0.7rem !important;
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    min-height: 0;
  }
  #products .product-card h3,
  #productsModalOverlay .product-card h3 {
    font-size: 0.82rem !important;
    line-height: 1.18 !important;
    margin-bottom: 0.45rem !important;
  }
  #products .product-card p,
  #productsModalOverlay .product-card p {
    font-size: 0.68rem !important;
    line-height: 1.15 !important;
    margin-bottom: 0.35rem !important;
  }
  #products .product-card .text-gradient-price,
  #productsModalOverlay .product-card .text-gradient-price {
    font-size: 0.92rem !important;
    line-height: 1 !important;
  }
  #products .product-card .product-card-original-price,
  #productsModalOverlay .product-card .product-card-original-price {
    font-size: 0.68rem !important;
  }
  #products .product-card .flex.items-center.gap-2.mb-3,
  #productsModalOverlay .product-card .flex.items-center.gap-2.mb-3 {
    gap: 0.4rem !important;
    margin-bottom: 0.2rem !important;
  }
  #products .product-card .flex.gap-1,
  #productsModalOverlay .product-card .flex.gap-1 {
    gap: 0.25rem !important;
    margin-bottom: 0.55rem !important;
  }
  #products .product-card .flex.gap-1 span,
  #productsModalOverlay .product-card .flex.gap-1 span {
    font-size: 0.63rem !important;
    line-height: 1 !important;
    padding: 0.14rem 0.38rem !important;
  }
  #products .product-card .product-featured-badge,
  #productsModalOverlay .product-card .product-featured-badge {
    top: 0.7rem !important;
    right: 1.7rem !important;
    z-index: 5;
    font-size: 0.72rem !important;
    line-height: 1 !important;
    padding: 0.22rem 0.5rem !important;
    border-radius: 999px !important;
    white-space: nowrap;
  }
  #products .product-card .flash-sale-mini-strip,
  #productsModalOverlay .product-card .flash-sale-mini-strip {
    gap: 0;
    margin: 0.35rem 0 0.55rem;
    padding: 0.18rem;
    border-radius: 0.2rem;
  }
  #products .product-card .flash-sale-mini-label,
  #productsModalOverlay .product-card .flash-sale-mini-label {
    min-width: 4.85rem;
    padding: 0.1rem 0.38rem;
    border-radius: 0.2rem 0 0 0.2rem;
    font-size: 0.66rem;
    border: 0 !important;
  }
  #products .product-card .flash-sale-mini-strip .flash-sale-mini-timer,
  #productsModalOverlay .product-card .flash-sale-mini-strip .flash-sale-mini-timer {
    min-width: 6.2ch;
    padding: 0.1rem 0.4rem;
    border-radius: 0 0.2rem 0.2rem 0;
    font-size: 0.68rem;
    letter-spacing: 0.08em;
    border: 0 !important;
    margin-left: 0rem;
    font-variant-numeric: tabular-nums;
    font-feature-settings: 'tnum' 1;
    font-kerning: none;
    transition: none !important;
    animation: none !important;
  }
  #products .product-card-social-meta,
  #productsModalOverlay .product-card-social-meta {
    display: none;
    align-items: center;
    gap: 0.32rem;
    margin: 0 0 0.45rem;
    color: var(--qh-muted);
    font-size: 0.66rem;
    line-height: 1;
    white-space: nowrap;
  }
  #products .product-card-social-meta .product-rating-stars,
  #productsModalOverlay .product-card-social-meta .product-rating-stars {
    display: inline-flex;
    align-items: center;
    gap: 0.28rem;
    color: #f6b91a !important;
    font-size: 0.66rem;
    letter-spacing: 0;
  }
  #products .product-card-social-meta .product-rating-stars-icons,
  #productsModalOverlay .product-card-social-meta .product-rating-stars-icons {
    letter-spacing: -0.08em;
  }
  #products .product-rating-score-text,
  #productsModalOverlay .product-rating-score-text {
    color: var(--qh-muted);
    font-weight: 700;
    letter-spacing: 0;
  }
  #products .product-card-sold-text,
  #productsModalOverlay .product-card-sold-text {
    color: var(--qh-muted);
    font-weight: 700;
  }
  #products .product-card-actions,
  #productsModalOverlay .product-card-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    justify-content: center;
    margin-top: auto;
    overflow: visible;
    border-radius: 0;
  }
  #products .product-buy-btn,
  #productsModalOverlay .product-buy-btn,
  #products .product-cart-btn,
  #productsModalOverlay .product-cart-btn {
    min-height: 0 !important;
    height: 2.05rem !important;
    border-radius: 0.72rem !important;
    font-size: 0.72rem !important;
    line-height: 1 !important;
  }
  #products .product-buy-btn,
  #productsModalOverlay .product-buy-btn {
    flex: auto !important;
    width: auto !important;
    max-width: calc(100% - 60px - 0.5rem) !important;
    padding: 0 0.62rem !important;
  }
  #products .product-cart-btn,
  #productsModalOverlay .product-cart-btn {
    flex: 0 0 60px !important;
    min-width: 60px !important;
    width: 60px !important;
    padding: 0 !important;
    gap: 0 !important;
  }
  #products .product-cart-btn span,
  #productsModalOverlay .product-cart-btn span {
    display: none !important;
  }
  #products .product-cart-btn i,
  #productsModalOverlay .product-cart-btn i,
  #products .product-buy-btn i,
  #productsModalOverlay .product-buy-btn i {
    font-size: 0.72rem !important;
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
  .product-card-actions--blocked {
    justify-content: center !important;
    align-self: stretch !important;
    width: 100% !important;
    margin-left: 0 !important;
  }
  .product-card-actions--blocked .blocked-order-btn,
  .product-buy-btn--blocked {
    flex: 1 1 100% !important;
    width: 100% !important;
    min-width: 100% !important;
    max-width: none !important;
    justify-content: center !important;
  }
  .blocked-order-icon-btn {
    border-radius: 0.85rem !important;
    padding: 0 !important;
  }
  .product-buy-btn {
    display: inline-flex;
    flex: 0 1 auto;
    align-items: center;
    justify-content: center;
    min-width: 0;
    width: auto;
    padding-left: 0.9rem;
    padding-right: 0.9rem;
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
  .product-rating-stars {
    color: #f6b91a !important;
    font-size: 0.75rem;
    letter-spacing: -0.05em;
    margin-left: auto;
    white-space: nowrap;
  }
  .bs-mobile-cart-btn {
    display: inline-flex;
    flex: 0 0 60px;
    min-width: 60px;
    align-items: center;
    justify-content: center;
    height: 2.05rem;
    padding: 0;
    border-radius: 0.75rem;
    color: #fff;
    font-size: 0.78rem;
  }
  .bs-actions {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin-top: auto;
    padding-top: 0.625rem;
  }
  .bs-buy-btn {
    flex: 0 0 auto;
    width: auto;
    min-width: 0;
    height: 2.05rem;
    padding: 0 0.9rem;
    white-space: nowrap;
  }
  .flash-sale-shop-actions {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin-top: auto;
    padding-top: 0.625rem;
  }
  .flash-sale-shop-buy-btn {
    flex: 0 0 auto;
    width: auto !important;
    min-width: 0;
    height: 2.05rem;
    padding: 0 0.9rem !important;
    border-radius: 0.72rem !important;
    white-space: nowrap;
  }
  .flash-sale-shop-cart-btn {
    display: inline-flex;
    flex: 0 0 60px;
    min-width: 60px;
    align-items: center;
    justify-content: center;
    height: 2.05rem;
    padding: 0 !important;
    border-radius: 0.72rem !important;
    color: #fff;
  }
  .detail-action-bar {
    position: sticky;
    bottom: 0;
    z-index: 8;
    display: flex;
    gap: 0.75rem;
    margin: 1rem -0.25rem -0.25rem;
    padding: 0.85rem 0.25rem 0.25rem;
    background: linear-gradient(180deg, rgba(255,255,255,0), var(--qh-surface) 24%, var(--qh-surface) 100%);
  }
  .detail-action-bar .btn-primary,
  .detail-action-bar .add-to-cart-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;
    min-width: 0;
    min-height: 3.25rem;
    line-height: 1.15;
    white-space: nowrap;
    text-align: center;
    padding-left: 1rem !important;
    padding-right: 1rem !important;
    border-radius: 0.75rem !important;
  }
  .detail-action-bar .btn-primary {
    flex: 1 1 0;
  }
  .detail-action-bar .detail-cart-btn {
    flex: 0 0 auto;
    min-width: 60px;
  }
  .detail-action-bar .btn-primary i,
  .detail-action-bar .add-to-cart-btn i {
    flex: 0 0 auto;
    margin: 0 !important;
    font-size: 0.95rem;
  }
  body[data-storefront-theme='dark'] .detail-action-bar {
    background: linear-gradient(180deg, rgba(9,24,48,0), rgba(9,24,48,0.96) 24%, rgba(9,24,48,0.98) 100%);
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
    border: none !important;
    box-shadow: none !important;
  }
  .flash-sale-mini-strip {
    display: inline-flex;
    align-items: center;
    gap: 0;
    max-width: 100%;
    margin: 0.4rem 0 0.5rem;
    padding: 0.1rem 0.14rem;
    border-radius: 0.2rem;
    background: none;
    border: 0 !important;
    box-shadow: none !important;
    backdrop-filter: blur(10px);
  }
  .flash-sale-mini-label {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.22rem;
    min-width: 5.15rem;
    padding: 0.12rem 0.48rem;
    border-radius: 0.2rem 0 0 0.2rem;
    background: linear-gradient(135deg, #ff5f8b 0%, #ff758f 45%, #ff9a5a 100%);
    color: #fff;
    font-size: 0.74rem;
    font-style: italic;
    font-weight: 900;
    line-height: 0;
    box-shadow: 0 12px 24px rgba(255,95,139,0.26), inset 0 1px 0 rgba(255,255,255,0.34);
    text-shadow: 0 1px 8px rgba(255,255,255,0.22);
    white-space: nowrap;
    border: 0 !important;
  }
  .flash-sale-mini-label i {
    color: #fff06a;
    font-size: 0.7rem;
    filter: drop-shadow(0 2px 6px rgba(255,214,10,0.55));
  }
  .flash-sale-mini-strip .flash-sale-mini-timer {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    min-width: 6ch;
    padding: 0.1rem 0.4rem;
    border-radius: 0 0.2rem 0.2rem 0;
    background: rgb(0 0 0 / 3%) !important;
    border: 0 !important;
    color: #f05a28 !important;
    font-family: 'Outfit', 'Inter', sans-serif;
    font-size: 0.76rem;
    font-weight: 900;
    letter-spacing: 0.1em;
    font-variant-numeric: tabular-nums;
    font-feature-settings: 'tnum' 1;
    line-height: 1;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.85), 0 8px 18px rgba(15,23,42,0.06);
    backdrop-filter: blur(8px);
    margin-left: 0rem;
    white-space: nowrap;
  }
  .flash-sale-mini-tail {
    display: block;
    flex: 0 0 auto;
    width: auto;
    height: 1rem;
    margin-left: 0.12rem;
    object-fit: contain;
  }
  body[data-storefront-theme='dark'] .flash-sale-mini-strip {
    background: none;
    border: 0 !important;
    box-shadow: none !important;
  }
  body[data-storefront-theme='dark'] .flash-sale-mini-label {
    background: linear-gradient(135deg, rgba(255,42,115,0.96), rgba(121,36,143,0.72));
    box-shadow: 0 0 22px rgba(255,44,116,0.42), inset 0 1px 0 rgba(255,255,255,0.14);
  }
  body[data-storefront-theme='dark'] .flash-sale-mini-strip .flash-sale-mini-timer {
    background: rgb(0 0 0 / 3%) !important;
    color: #ffd166 !important;
    text-shadow: 0 0 14px rgba(255,209,102,0.42);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.08), 0 0 18px rgba(93,65,255,0.22);
  }
  @media (max-width: 768px) {
    .quick-order-label-desktop {
      display: none;
    }
    .quick-order-label-mobile {
      display: inline;
    }
    .favorite-toggle-btn {
      height: 1.9rem;
      top: 0.5rem;
      left: 0.5rem;
    }
    .favorite-toggle-btn i {
      font-size: 1.08rem;
    }
    .flash-sale-mini-strip {
      gap: 0;
      margin: 0.4rem 0 0.5rem;
      padding: 0.08rem 0.14rem;
      border-radius: 0.2rem;
    }
    .flash-sale-mini-label {
      gap: 0.2rem;
      min-width: 5.1rem;
      padding: 0.1rem 0.48rem;
      border-radius: 0.2rem 0 0 0.2rem;
      font-size: 0.74rem;
      line-height: 0;
    }
    .flash-sale-mini-label i {
      font-size: 0.7rem;
    }
    .flash-sale-mini-strip .flash-sale-mini-timer {
      min-width: 6ch;
      padding: 0.1rem 0.4rem;
      border-radius: 0 0.2rem 0.2rem 0;
      font-size: 0.76rem;
      letter-spacing: 0.1em;
      margin-left: 0rem;
    }
    .flash-sale-mini-tail {
      height: 0.96rem;
      margin-left: 0.1rem;
    }
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
  body[data-storefront-theme='dark'] .hero-carousel-title,
  body[data-storefront-theme='dark'] .hero-banner-card .banner-title,
  body[data-storefront-theme='dark'] .hero-mobile-card-name,
  body[data-storefront-theme='dark'] .flash-sale-shop-card h3,
  body[data-storefront-theme='dark'] .flash-sale-shop-card .text-slate-900,
  body[data-storefront-theme='dark'] .bs-card .bs-name {
    color: #f8fafc !important;
  }
  body[data-storefront-theme='dark'] .favorite-toggle-btn {
    background: none !important;
    border: 0 !important;
    color: #9ca3af !important;
    box-shadow: none !important;
  }
  body[data-storefront-theme='dark'] .favorite-toggle-btn.active {
    background: none !important;
    border: 0 !important;
    color: #ff5ca8 !important;
  }
  body[data-storefront-theme='dark'] .hero-carousel-desc,
  body[data-storefront-theme='dark'] .hero-carousel-link,
  body[data-storefront-theme='dark'] .flash-sale-shop-card .text-slate-400 {
    color: #cbd5e1 !important;
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
  body[data-storefront-theme='dark'] #productsModalOverlay > div,
  body[data-storefront-theme='dark'] .cart-modal,
  body[data-storefront-theme='dark'] .user-menu-panel,
  body[data-storefront-theme='dark'] .review-modal-panel {
    background: linear-gradient(180deg, rgba(9,24,48,0.98), rgba(4,13,29,0.98)) !important;
    color: var(--qh-text) !important;
    border: 1px solid rgba(80,160,220,0.28) !important;
    box-shadow: 0 28px 80px rgba(0,0,0,0.56) !important;
  }
  body[data-storefront-theme='dark'] #userMenuPanel > .bg-gradient-to-r {
    background:
      radial-gradient(circle at 88% 12%, rgba(91,38,150,0.34), transparent 38%),
      linear-gradient(135deg, rgba(2,13,31,0.99) 0%, rgba(4,15,38,0.98) 58%, rgba(23,15,55,0.96) 100%) !important;
    border-bottom: 1px solid rgba(80,160,220,0.24);
  }
  body[data-storefront-theme='dark'] #userMenuAuthedNav button {
    color: #cbd5e1 !important;
  }
  body[data-storefront-theme='dark'] #userMenuAuthedNav button:hover {
    background: rgba(13,33,61,0.92) !important;
    color: #f8fbff !important;
  }
  body[data-storefront-theme='dark'] #userMenuAuthedNav i {
    color: #f472b6 !important;
  }
  body[data-storefront-theme='dark'] #walletBalanceMenu {
    background: rgba(21,128,61,0.18) !important;
    color: #bbf7d0 !important;
    border: 1px solid rgba(134,239,172,0.24);
  }
  body[data-storefront-theme='dark'] #userMenuContent .bg-gradient-to-r {
    background:
      radial-gradient(circle at 88% 12%, rgba(91,38,150,0.2), transparent 44%),
      linear-gradient(135deg, rgba(8,23,45,0.92), rgba(18,20,56,0.9)) !important;
    border: 1px solid rgba(80,160,220,0.24) !important;
    color: #f8fbff !important;
  }
  body[data-storefront-theme='dark'] #userMenuContent .bg-blue-50,
  body[data-storefront-theme='dark'] #userMenuContent .bg-gray-50 {
    background: rgba(11,32,58,0.82) !important;
    border-color: rgba(80,160,220,0.24) !important;
    color: #cbd5e1 !important;
  }
  body[data-storefront-theme='dark'] #userMenuContent .text-gray-700,
  body[data-storefront-theme='dark'] #userMenuContent .text-gray-800,
  body[data-storefront-theme='dark'] #userMenuContent .text-gray-900 {
    color: #f8fbff !important;
  }
  body[data-storefront-theme='dark'] #userMenuContent .text-gray-400,
  body[data-storefront-theme='dark'] #userMenuContent .text-gray-500,
  body[data-storefront-theme='dark'] #userMenuContent .text-gray-600 {
    color: #a9b8d3 !important;
  }
  body[data-storefront-theme='dark'] #userMenuLogoutArea {
    border-color: rgba(80,160,220,0.24) !important;
    background: rgba(4,13,29,0.92) !important;
  }
  body[data-storefront-theme='dark'] .popup-card .bg-white,
  body[data-storefront-theme='dark'] #productsModalOverlay .bg-white,
  body[data-storefront-theme='dark'] .cart-modal .bg-white,
  body[data-storefront-theme='dark'] .user-menu-panel .bg-white,
  body[data-storefront-theme='dark'] .review-modal-panel .bg-white,
  body[data-storefront-theme='dark'] .popup-card .bg-gray-50,
  body[data-storefront-theme='dark'] #productsModalOverlay .bg-gray-50,
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
  body[data-storefront-theme='dark'] #productsModalOverlay .border-b,
  body[data-storefront-theme='dark'] #productsModalOverlay .border-gray-100 {
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
    #products {
      padding-left: 0.75rem !important;
      padding-right: 0.75rem !important;
    }
    body[data-storefront-theme='dark'] #products {
      background:
        radial-gradient(circle at 88% 12%, rgba(122, 73, 224, 0.28), transparent 34%),
        radial-gradient(circle at 14% 12%, rgba(28, 123, 255, 0.14), transparent 28%),
        linear-gradient(135deg, rgba(2, 12, 29, 0.99) 0%, rgba(4, 18, 43, 0.98) 50%, rgba(27, 15, 61, 0.96) 100%) !important;
    }
    .filter-meta-actions {
      gap: 0.45rem;
    }
    .filter-label {
      display: none;
    }
    .filter-view-toggle {
      display: inline-flex;
      flex: 0 0 auto;
    }
    #productsGrid {
      grid-template-columns: minmax(0, 1fr) !important;
      gap: 0.6rem !important;
    }
    #productsGrid.products-grid-compact {
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      gap: 0.75rem !important;
    }
    #productsModalGrid {
      grid-template-columns: minmax(0, 1fr) !important;
      gap: 0.6rem !important;
    }
    #products .product-card {
      display: grid !important;
      grid-template-columns: minmax(0, 40%) minmax(0, 1fr);
      align-items: stretch;
      border-radius: 1rem !important;
    }
    #productsModalOverlay .product-card {
      display: grid !important;
      grid-template-columns: minmax(0, 40%) minmax(0, 1fr);
      align-items: stretch;
      border-radius: 1rem !important;
    }
    #products .product-card > .relative {
      flex: 0 0 40%;
      min-width: 0;
      aspect-ratio: 1 / 1;
      height: auto !important;
    }
    #productsModalOverlay .product-card > .relative {
      flex: 0 0 40%;
      min-width: 0;
      aspect-ratio: 1 / 1;
      height: auto !important;
    }
    #products .product-card .product-img-main {
      width: 100%;
      height: auto !important;
      min-height: 0;
      aspect-ratio: 1 / 1;
    }
    #productsModalOverlay .product-card .product-img-main {
      width: 100%;
      height: auto !important;
      min-height: 0;
      aspect-ratio: 1 / 1;
    }
    #products .product-card > .p-3 {
      flex: 1 1 auto;
      height: 100%;
      min-width: 0;
      min-height: 0;
      padding: 0.5rem 0.55rem !important;
      display: flex;
      flex-direction: column;
    }
    #productsModalOverlay .product-card > .p-3 {
      flex: 1 1 auto;
      height: 100%;
      min-width: 0;
      min-height: 0;
      padding: 0.5rem 0.55rem !important;
      display: flex;
      flex-direction: column;
    }
    #products .product-card p.text-pink-500,
    #productsModalOverlay .product-card p.text-pink-500 {
      display: none !important;
    }
    #products .product-card h3 {
      font-size: 0.8rem !important;
      line-height: 1.16 !important;
      margin-bottom: 0.3rem !important;
      display: block !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
    }
    #productsModalOverlay .product-card h3 {
      font-size: 0.8rem !important;
      line-height: 1.16 !important;
      margin-bottom: 0.3rem !important;
      display: block !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
    }
    #products .product-card p,
    #productsModalOverlay .product-card p {
      margin-bottom: 0.15rem !important;
    }
    #products .product-card .text-gradient-price,
    #productsModalOverlay .product-card .text-gradient-price {
      font-size: 0.9rem !important;
    }
    #products .product-rating-stars-desktop,
    #productsModalOverlay .product-rating-stars-desktop {
      display: none !important;
    }
    #products .product-card .flash-sale-mini-strip,
    #productsModalOverlay .product-card .flash-sale-mini-strip {
      gap: 0;
      margin: 0.08rem 0 0.2rem;
      padding: 0.1rem 0.12rem;
      border-radius: 0.2rem;
    }
    #products .product-card .flash-sale-mini-label,
    #productsModalOverlay .product-card .flash-sale-mini-label {
      min-width: 0;
      padding: 0.1rem 0.38rem;
      border-radius: 0.2rem 0 0 0.2rem;
      font-size: 0.58rem;
      line-height: 1;
    }
    #products .product-card .flash-sale-mini-strip .flash-sale-mini-timer,
    #productsModalOverlay .product-card .flash-sale-mini-strip .flash-sale-mini-timer {
      min-width: 6.2ch;
      padding: 0.1rem 0.4rem;
      border-radius: 0 0.2rem 0.2rem 0;
      font-size: 0.58rem;
      letter-spacing: 0.06em;
      margin-left: 0rem;
      font-variant-numeric: tabular-nums;
      font-feature-settings: 'tnum' 1;
      font-kerning: none;
      transition: none !important;
      animation: none !important;
    }
    #products .product-card .flash-sale-mini-tail,
    #productsModalOverlay .product-card .flash-sale-mini-tail {
      height: 0.82rem;
      margin-left: 0.14rem;
    }
    #products .product-card-social-meta,
    #productsModalOverlay .product-card-social-meta {
      display: flex;
      margin-bottom: 0.45rem;
    }
    #products .product-card .flex.gap-1,
    #productsModalOverlay .product-card .flex.gap-1 {
      display: none !important;
    }
    #products .product-card .flex.gap-1 span,
    #productsModalOverlay .product-card .flex.gap-1 span {
      font-size: 0.6875rem !important;
      padding: 0.08rem 0.42rem !important;
    }
    #products .product-card .badge-sale,
    #products .product-card .product-featured-badge,
    #productsModalOverlay .product-card .badge-sale,
    #productsModalOverlay .product-card .product-featured-badge {
      top: 0.45rem !important;
      font-size: 0.6875rem !important;
      padding: 0.18rem 0.45rem !important;
    }
    #products .product-card .badge-sale,
    #productsModalOverlay .product-card .badge-sale {
      left: 0.45rem !important;
    }
    #products .product-card .product-featured-badge,
    #productsModalOverlay .product-card .product-featured-badge {
      right: 1.7rem !important;
    }
    #products .product-card-actions,
    #productsModalOverlay .product-card-actions {
      display: inline-flex;
      align-items: stretch;
      justify-content: flex-end;
      gap: 0;
      align-self: flex-end;
      margin-top: auto;
      margin-left: auto;
      overflow: hidden;
      border-radius: 0.62rem;
      position: relative;
      background: linear-gradient(135deg, #337cff, #8d55ff 45%, #ec4fbe) !important;
      box-shadow: 0 10px 22px rgba(59,130,246,0.24), 0 8px 20px rgba(236,63,173,0.18) !important;
    }
    #products .product-card-actions::after,
    #productsModalOverlay .product-card-actions::after {
      content: '';
      position: absolute;
      top: 18%;
      bottom: 18%;
      left: calc(100% - 2.05rem);
      width: 1px;
      pointer-events: none;
    }
    #products .product-buy-btn,
    #productsModalOverlay .product-buy-btn {
      flex: 0 0 auto !important;
      flex-basis: auto;
      width: auto !important;
      max-width: none !important;
      height: 1.52rem !important;
      font-size: 0.62rem !important;
      padding-left: 0.46rem !important;
      padding-right: 0.46rem !important;
      border-radius: 0 !important;
      border-top-left-radius: 0.62rem !important;
      border-bottom-left-radius: 0.62rem !important;
      background: transparent !important;
      box-shadow: none !important;
    }
    #products .product-card-actions--blocked .blocked-order-btn,
    #productsModalOverlay .product-card-actions--blocked .blocked-order-btn {
      flex: 1 1 100% !important;
      width: 100% !important;
      min-width: 100% !important;
      max-width: none !important;
      height: 1.52rem !important;
      border-radius: 0.62rem !important;
      padding-left: 0.46rem !important;
      padding-right: 0.46rem !important;
    }
    #products .product-cart-btn,
    #productsModalOverlay .product-cart-btn {
      display: inline-flex !important;
      flex: 0 0 auto;
      width: 2.05rem !important;
      min-width: 2.05rem !important;
      height: 1.52rem !important;
      padding: 0 0.46rem !important;
      border-radius: 0 !important;
      border-top-right-radius: 0.62rem !important;
      border-bottom-right-radius: 0.62rem !important;
      position: relative;
      background: transparent !important;
      box-shadow: none !important;
    }
    #products .product-cart-btn::before,
    #productsModalOverlay .product-cart-btn::before {
      content: '|';
      position: absolute;
      left: 0;
      top: 50%;
      color: rgba(255,255,255,0.62);
      font-size: 0.74rem;
      font-weight: 700;
      line-height: 1;
      transform: translate(-50%, -52%);
      pointer-events: none;
    }
    #products .product-cart-btn span,
    #productsModalOverlay .product-cart-btn span {
      display: none !important;
    }
    #products .product-rating-stars,
    #productsModalOverlay .product-rating-stars {
      margin-left: 0;
      font-size: 0.7rem;
    }
    #productsGrid.products-grid-compact .product-card {
      display: flex !important;
      flex-direction: column;
      min-height: 100%;
    }
    #productsGrid.products-grid-compact .product-card > .relative {
      flex: 0 0 auto;
      aspect-ratio: 1 / 1;
    }
    #productsGrid.products-grid-compact .product-card .product-img-main {
      height: 100% !important;
      aspect-ratio: 1 / 1;
      object-fit: cover;
    }
    #productsGrid.products-grid-compact .product-card > .p-3 {
      height: auto;
      padding: 0.68rem 0.68rem 0.72rem !important;
    }
    #productsGrid.products-grid-compact .product-card h3 {
      font-size: 0.86rem !important;
      line-height: 1.18 !important;
      margin-bottom: 0.34rem !important;
      display: -webkit-box !important;
      min-height: calc(1.18em * 2);
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      white-space: normal !important;
      overflow: hidden !important;
      text-overflow: initial !important;
    }
    #productsGrid.products-grid-compact .product-card-actions {
      justify-content: center;
      align-self: center;
      margin-left: 0;
      margin-right: 0;
    }
  .bs-mobile-cart-btn {
      display: inline-flex;
      flex: 0 0 60px;
      min-width: 60px;
      align-items: center;
      justify-content: center;
      width: 60px;
      height: 1.8rem;
      border-radius: 0.75rem;
      color: #fff;
      font-size: 0.78rem;
    }
    .bs-actions {
      display: flex;
      gap: 0.45rem;
      align-items: center;
      margin-top: auto;
      padding-top: 0.55rem;
    }
    .bs-buy-btn {
      flex: 0 0 auto;
      width: auto;
      height: 1.8rem;
      padding: 0 0.62rem;
      white-space: nowrap;
    }
    .flash-sale-shop-actions {
      gap: 0.45rem;
      margin-top: auto;
      padding-top: 0.55rem;
    }
    .flash-sale-shop-buy-btn {
      height: 1.8rem;
      padding: 0 0.62rem !important;
      border-radius: 0.75rem !important;
    }
    .flash-sale-shop-cart-btn {
      flex: 0 0 60px;
      min-width: 60px;
      height: 1.8rem;
      border-radius: 0.75rem !important;
    }
    .bs-card {
      height: 100% !important;
      min-height: 0 !important;
      align-self: stretch;
    }
    .bs-card > div:last-child {
      padding-bottom: 0.75rem !important;
    }
    .bs-name {
      min-height: calc(1.35em * 2) !important;
      -webkit-line-clamp: 2;
    }
    .detail-action-bar {
      gap: 0.55rem;
      margin-left: -0.65rem;
      margin-right: -0.65rem;
      margin-bottom: -0.65rem;
      padding: 0.75rem 0.65rem 0.65rem;
    }
    .detail-action-bar .btn-primary,
    .detail-action-bar .add-to-cart-btn {
      flex: 1 1 0;
      min-width: 0;
      min-height: 3rem;
      font-size: 0.78rem !important;
      gap: 0.42rem;
      padding-left: 0.7rem !important;
      padding-right: 0.7rem !important;
    }
  }`
}
