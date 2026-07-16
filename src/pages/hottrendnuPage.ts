import { storefrontStyles } from './storefront/styles'
import { storefrontThemeRefreshStyles } from './storefront/theme-refresh'
import { storefrontMobileBottomNavSection, storefrontBodyClose } from './storefront/sections'
import { storefrontModalsSection } from './storefront/modals'
import { storefrontInlineScript } from './storefront/script'
import { storefrontPurchaseToastScript } from './storefront/script-purchase-toast'
import autoTypingScript from 'autotyping/dist/AutoTyping.min.js?raw'
import type { TextUiSettings } from '../lib/textUiSettings'

type HotTrendNuPageOptions = {
  textUiSettings?: Partial<TextUiSettings>
  canonicalUrl?: string
  ogImageUrl?: string
}

function serializeHotTrendNuRuntimeConfig(options: HotTrendNuPageOptions): string {
  return JSON.stringify({
    product_freeship_badge_enabled: options.textUiSettings?.product_freeship_badge_enabled !== false,
  }).replace(/</g, '\\u003c')
}

function hotTrendNuStyles(): string {
  return `
@import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&family=Cormorant+Garamond:wght@500;600;700&display=swap');

body.hottrendnu-page,
body.hottrendnu-page[data-storefront-theme],
body.hottrendnu-page[data-storefront-theme='dark'],
body.hottrendnu-page[data-storefront-theme='light'] {
  --htn-bg: #FFF7F8;
  --htn-surface: #FCEEEF;
  --htn-card: #FFFFFF;
  --htn-rose: #C94F7C;
  --htn-rose-hover: #A93C66;
  --htn-sale: #EB4D6A;
  --htn-border: #F3DDE4;
  --htn-chip: #F9E3EA;
  --htn-text-primary: #282024;
  --htn-text-secondary: #786870;
  --htn-success: #22B573;
  --htn-muted: #786870;
  --htn-ink: #282024;
  background:
    radial-gradient(circle at 8% 12%, rgba(239, 115, 93, 0.08), transparent 30%),
    radial-gradient(circle at 88% 6%, rgba(201, 79, 124, 0.06), transparent 28%),
    linear-gradient(180deg, #FFF7F8 0%, #FFFAFB 48%, #FFF 100%) !important;
  color: var(--htn-text-primary) !important;
  font-family: 'Be Vietnam Pro', sans-serif;
}

body.hottrendnu-page::before {
  display: none !important;
}

.hottrendnu-page h1,
.hottrendnu-page h2,
.hottrendnu-page h3,
.hottrendnu-page h4,
.hottrendnu-page h5,
.hottrendnu-page h6,
.hottrendnu-page span,
.hottrendnu-page p,
.hottrendnu-page a,
.hottrendnu-page div,
.hottrendnu-page button {
  text-shadow: none !important;
}

.hottrendnu-page h1,
.hottrendnu-page h2,
.hottrendnu-page h3,
.hottrendnu-page .font-display {
  font-family: 'Cormorant Garamond', serif !important;
  letter-spacing: -0.01em !important;
}

.hottrendnu-page .navbar-blur,
body.hottrendnu-page[data-storefront-theme='dark'] .navbar-blur {
  background: rgba(255, 255, 255, 0.96) !important;
  border-color: var(--htn-border) !important;
  box-shadow: 0 10px 30px rgba(201, 79, 124, 0.04) !important;
}

body.hottrendnu-page[data-storefront-theme='dark'] .navbar-blur a,
body.hottrendnu-page[data-storefront-theme='dark'] .navbar-blur button,
body.hottrendnu-page[data-storefront-theme='dark'] .navbar-blur div,
body.hottrendnu-page[data-storefront-theme='dark'] .navbar-blur span {
  color: var(--htn-text-primary) !important;
}

.hottrendnu-page .storefront-marquee-bar,
body.hottrendnu-page[data-storefront-theme='dark'] .storefront-marquee-bar {
  background: #FDE5EC !important;
  border-color: var(--htn-border) !important;
}

.hottrendnu-page .storefront-marquee-text,
.hottrendnu-page .storefront-marquee-icon,
body.hottrendnu-page[data-storefront-theme='dark'] .storefront-marquee-text,
body.hottrendnu-page[data-storefront-theme='dark'] .storefront-marquee-icon {
  color: var(--htn-rose) !important;
  font-weight: 500 !important;
}

.hottrendnu-page .theme-toggle-btn {
  background: rgba(201, 79, 124, 0.09) !important;
  border: 1px solid rgba(201, 79, 124, 0.2) !important;
  color: var(--htn-rose) !important;
}

.hottrendnu-nav-link,
.qhher-nav-link {
  color: var(--htn-text-primary) !important;
  font-weight: 600 !important;
}
.hottrendnu-nav-link:hover,
.qhher-nav-link:hover {
  color: var(--htn-rose) !important;
}

body.hottrendnu-page .mobile-bottom-nav,
body.hottrendnu-page[data-storefront-theme='dark'] .mobile-bottom-nav {
  background: #FFF7F8 !important;
  border-color: var(--htn-border) !important;
}

body.hottrendnu-page .mobile-bottom-nav-link,
body.hottrendnu-page[data-storefront-theme='dark'] .mobile-bottom-nav-link {
  color: var(--htn-muted) !important;
}

body.hottrendnu-page .mobile-bottom-nav-link.is-active,
body.hottrendnu-page[data-storefront-theme='dark'] .mobile-bottom-nav-link.is-active,
body.hottrendnu-page[data-storefront-theme='dark'] .mobile-bottom-nav-link.is-active i,
body.hottrendnu-page[data-storefront-theme='dark'] .mobile-bottom-nav-link.is-active > span {
  color: var(--htn-rose) !important;
}

.hottrendnu-hero {
  position: relative;
  min-height: min(760px, calc(100dvh - 6px));
  padding: 7.5rem 1rem 3.25rem;
  overflow: hidden;
}

.hottrendnu-hero::before {
  content: '';
  position: absolute;
  inset: 9rem auto auto -10rem;
  width: 36rem;
  height: 36rem;
  border-radius: 9999px;
  background: rgba(239, 115, 93, 0.1);
  filter: blur(24px);
  pointer-events: none;
}

.hottrendnu-hero-inner {
  position: relative;
  max-width: 1320px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(320px, 0.78fr);
  gap: clamp(2rem, 5vw, 5.5rem);
  align-items: center;
}

.hottrendnu-kicker {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--htn-rose);
  font-size: 0.74rem;
  font-weight: 900;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.hottrendnu-title {
  max-width: 11ch;
  margin-top: 1rem;
  font-size: clamp(3.1rem, 8.5vw, 7.4rem);
  line-height: 0.9;
  font-weight: 800;
}

.hottrendnu-title span {
  color: var(--htn-rose);
}

.hottrendnu-copy {
  max-width: 48rem;
  color: var(--htn-muted);
  font-size: clamp(1rem, 1.35vw, 1.18rem);
  line-height: 1.8;
}

.hottrendnu-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.85rem;
  margin-top: 2rem;
}

.hottrendnu-primary-btn,
.hottrendnu-page .btn-primary {
  background: linear-gradient(135deg, var(--htn-rose), var(--htn-coral)) !important;
  border-radius: 0.85rem !important;
  color: #fff !important;
  box-shadow: 0 16px 32px rgba(214, 63, 114, 0.18) !important;
}

.hottrendnu-primary-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.92rem 1.25rem;
  font-weight: 900;
}

.hottrendnu-secondary-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.9rem 1.15rem;
  border-radius: 0.85rem;
  border: 1px solid rgba(111, 37, 79, 0.18);
  color: var(--htn-plum);
  font-weight: 900;
  background: rgba(255, 255, 255, 0.68);
}

.hottrendnu-stat-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.8rem;
  max-width: 35rem;
  margin-top: 2.2rem;
}

.hottrendnu-stat-strip div {
  border-top: 1px solid var(--htn-line);
  padding-top: 0.85rem;
}

.hottrendnu-stat-strip strong {
  display: block;
  color: var(--htn-ink);
  font-size: 1.2rem;
}

.hottrendnu-stat-strip span {
  color: var(--htn-muted);
  font-size: 0.78rem;
  font-weight: 700;
}

.hottrendnu-page #heroBannersWrapper {
  position: relative;
  justify-content: center !important;
  padding: 1.2rem;
  border: 1px solid rgba(214, 63, 114, 0.18);
  background: rgba(255, 255, 255, 0.46);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.65), 0 30px 70px rgba(111, 37, 79, 0.12);
  border-radius: 2rem;
}

.hottrendnu-page .hero-carousel-card {
  border-radius: 1.35rem;
  background: #fff !important;
  color: var(--htn-ink) !important;
  box-shadow: 0 30px 60px rgba(111, 37, 79, 0.18) !important;
}

.hottrendnu-page .hero-3d-carousel {
  width: min(520px, 100%);
  height: 610px;
  perspective: 900px;
}

.hottrendnu-page .hero-carousel-stage {
  width: min(420px, 80vw);
  height: 580px;
}

.hottrendnu-page .htn-hero-card {
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  border: 1px solid rgba(214, 63, 114, 0.16) !important;
  background: #fffaf9 !important;
  overflow: hidden;
}

.hottrendnu-page .htn-hero-card-media {
  position: relative;
  min-height: 0;
  background: #f5e8ec;
}

.hottrendnu-page .htn-hero-card-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.hottrendnu-page .htn-hero-card-media::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(37,25,34,0) 54%, rgba(37,25,34,0.34) 100%);
}

.htn-hero-card-index {
  position: absolute;
  left: 1rem;
  top: 1rem;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.4rem;
  height: 2.4rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.82);
  color: var(--htn-plum);
  font-weight: 900;
  font-size: 0.8rem;
  backdrop-filter: blur(10px);
}

.htn-hero-card-copy {
  padding: 1.15rem;
}

.htn-hero-card-copy > p,
.htn-rank-kicker {
  color: var(--htn-rose);
  font-size: 0.68rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.14em;
}

.htn-hero-card-copy h3 {
  margin-top: 0.45rem;
  color: var(--htn-ink);
  font-size: 1.2rem;
  line-height: 1.06;
  font-weight: 900;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.htn-hero-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-top: 0.75rem;
}

.htn-hero-card-cta {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: var(--htn-plum);
  font-size: 0.75rem;
  font-weight: 900;
  white-space: nowrap;
}

.hottrendnu-page .hero-carousel-body {
  background: #fff !important;
}

.hottrendnu-page .hero-carousel-title,
.hottrendnu-page .hero-carousel-link {
  color: var(--htn-ink) !important;
}

.hottrendnu-page .hero-carousel-kicker {
  color: #fff !important;
}

.hottrendnu-section {
  max-width: 1320px;
  margin: 0 auto;
  padding: 4rem 1rem;
}

.hottrendnu-section-head {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.2rem;
}

.hottrendnu-section-head h2 {
  font-size: clamp(2.1rem, 4vw, 4rem);
  line-height: 0.98;
  font-weight: 800;
}

.hottrendnu-section-head p {
  color: var(--htn-muted);
  max-width: 34rem;
  line-height: 1.65;
}

.hottrendnu-page #bestsellersSection {
  background: transparent !important;
}

.hottrendnu-page .bestsellers-track {
  gap: 1rem;
}

.hottrendnu-page .bs-card {
  background: rgba(255, 255, 255, 0.94) !important;
  border-color: rgba(214, 63, 114, 0.18) !important;
  border-radius: 1.1rem !important;
  box-shadow: 0 18px 40px rgba(111, 37, 79, 0.1) !important;
}

.hottrendnu-page .bs-name {
  color: var(--htn-ink) !important;
}

.hottrendnu-page .bs-sold-chip {
  color: var(--htn-plum);
  background: #fff1f4;
  border-color: rgba(214, 63, 114, 0.16);
}

.hottrendnu-page #flashSaleShopSection > div {
  background: linear-gradient(135deg, #fff, #fff1f4) !important;
  border: 1px solid rgba(214, 63, 114, 0.16) !important;
  box-shadow: 0 22px 52px rgba(111, 37, 79, 0.1);
}

.hottrendnu-page .flash-sale-shop-card {
  background: #fff !important;
  border-color: rgba(214, 63, 114, 0.16) !important;
  border-radius: 1rem !important;
}

.htn-rank-card,
.htn-deal-card,
.htn-product-card {
  position: relative;
  cursor: pointer;
  overflow: hidden;
  border: 1px solid rgba(214, 63, 114, 0.16);
  background: #fff;
  color: var(--htn-ink);
  box-shadow: 0 18px 46px rgba(111, 37, 79, 0.1);
  transition: transform 0.26s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.26s cubic-bezier(0.16, 1, 0.3, 1);
}

.htn-rank-card:hover,
.htn-deal-card:hover,
.htn-product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 28px 66px rgba(111, 37, 79, 0.14);
}

.htn-rank-card {
  flex: 0 0 min(520px, 86vw);
  display: grid;
  grid-template-columns: minmax(0, 48%) minmax(0, 1fr);
  min-height: 290px;
  border-radius: 1.35rem;
}

.htn-rank-image,
.htn-deal-media,
.htn-product-media {
  position: relative;
  overflow: hidden;
  background: #f5e8ec;
}

.htn-rank-image img,
.htn-deal-media img,
.htn-product-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.htn-rank-number {
  position: absolute;
  left: 0.9rem;
  top: 0.9rem;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2.35rem;
  height: 2.35rem;
  padding: 0 0.55rem;
  border-radius: 999px;
  background: rgba(37, 25, 34, 0.82);
  color: #fff;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.06em;
  backdrop-filter: blur(10px);
}

.htn-rank-body,
.htn-deal-body {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 1.15rem;
}

.htn-rank-body h3,
.htn-deal-body h3 {
  margin-top: 0.5rem;
  font-size: clamp(1.25rem, 2vw, 1.75rem);
  line-height: 1.02;
  font-weight: 900;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
}

.htn-deal-card {
  flex: 0 0 min(410px, 82vw);
  display: grid;
  grid-template-rows: 260px auto;
  border-radius: 1.2rem;
}

.htn-product-card {
  display: grid !important;
  grid-template-rows: auto minmax(0, 1fr);
  border-radius: 1.1rem !important;
}

.htn-product-media {
  aspect-ratio: 4 / 5;
}

.htn-product-media-top {
  position: absolute;
  inset: 0.75rem 0.75rem auto;
  z-index: 3;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.6rem;
}

.htn-product-type {
  display: inline-flex;
  max-width: calc(100% - 3rem);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.82);
  color: var(--htn-plum);
  padding: 0.36rem 0.65rem;
  font-size: 0.68rem;
  font-weight: 900;
  backdrop-filter: blur(10px);
}

.htn-product-ribbon {
  position: absolute;
  left: 0.75rem;
  bottom: 0.75rem;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  gap: 0.32rem;
  border-radius: 0.45rem;
  background: var(--htn-coral);
  color: #fff;
  padding: 0.32rem 0.55rem;
  font-size: 0.68rem;
  font-weight: 900;
}

.htn-product-body {
  display: flex;
  min-width: 0;
  flex-direction: column;
  padding: 0.95rem;
}

.htn-product-title-row h3 {
  color: var(--htn-ink);
  font-size: 1rem;
  line-height: 1.14;
  font-weight: 900;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.htn-product-price-row {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-top: 0.65rem;
}

.htn-product-price {
  color: var(--htn-rose);
  font-size: 1.15rem;
  line-height: 1;
  font-weight: 900;
}

.htn-product-original {
  color: rgba(128, 106, 118, 0.6);
  font-size: 0.75rem;
  font-weight: 800;
  text-decoration: line-through;
}

.htn-color-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 0.75rem;
}

.htn-color-row span {
  border-radius: 999px;
  border: 1px solid rgba(111, 37, 79, 0.12);
  color: var(--htn-muted);
  padding: 0.22rem 0.5rem;
  font-size: 0.68rem;
  font-weight: 800;
}

.htn-actions {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 3rem;
  gap: 0.55rem;
  margin-top: auto;
  padding-top: 0.9rem;
}

.htn-actions--compact {
  padding-top: 0.75rem;
}

.htn-buy,
.htn-cart {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  min-height: 2.65rem;
  border-radius: 0.75rem;
  font-size: 0.82rem;
  font-weight: 900;
}

.htn-buy {
  background: var(--htn-ink);
  color: #fff;
}

.htn-cart {
  background: #fff1f4;
  color: var(--htn-rose);
}

.htn-actions--blocked {
  display: block;
}

.htn-buy--blocked {
  width: 100%;
  background: #e5e7eb;
  color: #6b7280;
}

.hottrendnu-page .product-commerce-meta--hottrendnu {
  margin-top: 0.65rem;
  align-items: flex-start;
}

.hottrendnu-page .product-commerce-meta--hottrendnu .product-sold-line {
  color: var(--htn-muted);
  background: transparent;
  border: 0;
  padding: 0;
  font-weight: 900;
}

.hottrendnu-page .product-commerce-meta--hottrendnu .product-perk-badges {
  gap: 0.3rem;
}

.hottrendnu-page .product-commerce-meta--hottrendnu .product-perk-badge {
  border: 0;
  border-radius: 0.28rem;
}

.hottrendnu-products-panel {
  border: 1px solid rgba(214, 63, 114, 0.16);
  border-radius: 1.6rem;
  background: rgba(255, 255, 255, 0.68);
  box-shadow: 0 24px 70px rgba(111, 37, 79, 0.1);
  padding: clamp(1rem, 2.5vw, 1.8rem);
}

body.hottrendnu-page #filterBar.hottrendnu-products-panel {
  display: block !important;
  width: 100%;
  max-width: none;
  margin: 0;
  background: rgba(255, 255, 255, 0.68) !important;
  border: 1px solid rgba(214, 63, 114, 0.16) !important;
  border-radius: 1.6rem;
  box-shadow: 0 24px 70px rgba(111, 37, 79, 0.1) !important;
}

.hottrendnu-filter-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.75rem;
  align-items: center;
}

.hottrendnu-search {
  position: relative;
}

.hottrendnu-search i {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(111, 37, 79, 0.58);
}

.hottrendnu-search input {
  width: 100%;
  border: 1px solid rgba(111, 37, 79, 0.16);
  border-radius: 1rem;
  background: #fff;
  color: var(--htn-ink);
  padding: 0.95rem 1rem 0.95rem 2.75rem;
  font-size: 16px;
  outline: none;
}

.hottrendnu-filter-btn {
  width: 3.25rem;
  height: 3.25rem;
  border-radius: 1rem;
  background: var(--htn-ink);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.hottrendnu-type-row {
  display: flex;
  gap: 0.6rem;
  overflow-x: auto;
  padding: 1rem 0 0.5rem;
  scrollbar-width: none;
}

.hottrendnu-type-row::-webkit-scrollbar {
  display: none;
}

.hottrendnu-type-chip {
  flex: 0 0 auto;
  border: 1px solid rgba(111, 37, 79, 0.15);
  border-radius: 999px;
  background: #fff;
  color: var(--htn-muted);
  padding: 0.65rem 1rem;
  font-size: 0.9rem;
  font-weight: 900;
}

.hottrendnu-type-chip.active {
  color: #fff;
  background: var(--htn-ink);
  border-color: var(--htn-ink);
}

.hottrendnu-meta-row {
  display: flex;
  justify-content: space-between;
  gap: 0.8rem;
  align-items: center;
  margin: 0.75rem 0 1.1rem;
  color: var(--htn-muted);
  font-weight: 900;
}

.hottrendnu-sort-wrap {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  border: 1px solid rgba(111, 37, 79, 0.14);
  background: #fff;
  border-radius: 999px;
  padding: 0.55rem 0.8rem;
}

.hottrendnu-sort-wrap select {
  background: transparent;
  outline: none;
  color: var(--htn-ink);
  font-weight: 900;
}

.hottrendnu-page #productsGrid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.hottrendnu-page .product-card {
  background: #fff !important;
  border-color: rgba(214, 63, 114, 0.18) !important;
  border-radius: 1rem !important;
  box-shadow: 0 14px 34px rgba(111, 37, 79, 0.09) !important;
}

.hottrendnu-page .product-card h3 {
  color: var(--htn-ink) !important;
}

.hottrendnu-page .text-gradient-price,
.hottrendnu-page .bs-price {
  background: linear-gradient(135deg, var(--htn-rose), var(--htn-coral));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hottrendnu-page .product-featured-badge,
.hottrendnu-page .bs-mobile-hot-badge {
  background: var(--htn-coral) !important;
  box-shadow: none !important;
}

.hottrendnu-page .product-perk-badge {
  border-radius: 0.2rem;
}

.hottrendnu-page #filterModalGenderRow {
  display: none;
}

.hottrendnu-feature-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
  gap: 1rem;
}

.hottrendnu-feature-tile {
  min-height: 11rem;
  border-radius: 1.25rem;
  border: 1px solid rgba(214, 63, 114, 0.16);
  background: #fff;
  padding: 1.35rem;
}

.hottrendnu-feature-tile i {
  color: var(--htn-rose);
  font-size: 1.35rem;
}

.hottrendnu-feature-tile h3 {
  margin-top: 1rem;
  font-size: 1.2rem;
  font-weight: 900;
}

.hottrendnu-feature-tile p {
  margin-top: 0.45rem;
  color: var(--htn-muted);
  line-height: 1.65;
}

.hottrendnu-page .mobile-bottom-nav {
  background: rgba(255, 250, 251, 0.96) !important;
  border-color: rgba(214, 63, 114, 0.18) !important;
}

.hottrendnu-page .mobile-bottom-nav-link {
  color: rgba(111, 37, 79, 0.68) !important;
}

.hottrendnu-page .mobile-bottom-nav-link.is-active {
  color: var(--htn-rose) !important;
}

.hottrendnu-page #orderPopupCard,
.hottrendnu-page #variantModalPanel,
.hottrendnu-page .cart-modal,
.hottrendnu-page .user-menu-panel {
  border: 1px solid rgba(214, 63, 114, 0.18) !important;
  background:
    radial-gradient(circle at 90% 0%, rgba(214, 63, 114, 0.12), transparent 28%),
    #fffaf9 !important;
  color: var(--htn-ink);
  box-shadow: 0 30px 80px rgba(37, 25, 34, 0.22) !important;
}

.hottrendnu-page #orderPopupCard {
  display: flex;
  flex-direction: column;
  max-height: calc(100dvh - 2rem) !important;
  overflow: hidden !important;
}

.hottrendnu-page #orderModalBody {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
}

.hottrendnu-page #orderActionBarContainer {
  position: relative !important;
  bottom: auto !important;
  flex: 0 0 auto;
}

.hottrendnu-page #orderModalHeader {
  background: rgba(255, 250, 249, 0.96) !important;
  border-color: rgba(214, 63, 114, 0.16) !important;
}

.hottrendnu-page #orderPopupCard h2,
.hottrendnu-page #orderPopupCard h3,
.hottrendnu-page #variantModalPanel h3 {
  color: var(--htn-ink) !important;
}

.hottrendnu-page #orderPopupCard input,
.hottrendnu-page #orderPopupCard textarea,
.hottrendnu-page #orderPopupCard select,
.hottrendnu-page #variantModalPanel input,
.hottrendnu-page #variantModalPanel textarea,
.hottrendnu-page .address-dropdown-trigger {
  border-color: rgba(111, 37, 79, 0.18) !important;
  background: #fff !important;
  color: var(--htn-ink) !important;
}

.hottrendnu-page #orderPopupCard .btn-primary,
.hottrendnu-page #variantModalPanel .btn-primary {
  background: linear-gradient(135deg, var(--htn-ink), var(--htn-plum)) !important;
  border-radius: 0.8rem !important;
  box-shadow: none !important;
}

.hottrendnu-page #orderPopupCard .add-to-cart-btn,
.hottrendnu-page #variantModalPanel .add-to-cart-btn {
  background: linear-gradient(135deg, var(--htn-rose), var(--htn-coral)) !important;
  border-radius: 0.8rem !important;
  box-shadow: none !important;
}

body.hottrendnu-page[data-storefront-theme='dark'] #orderPopupCard,
body.hottrendnu-page[data-storefront-theme='dark'] #variantModalPanel,
body.hottrendnu-page[data-storefront-theme='dark'] .cart-modal,
body.hottrendnu-page[data-storefront-theme='dark'] .user-menu-panel {
  background:
    radial-gradient(circle at 88% 0%, rgba(214, 63, 114, 0.18), transparent 30%),
    #101323 !important;
  border-color: rgba(244, 114, 182, 0.2) !important;
  color: #f8fafc;
}

body.hottrendnu-page[data-storefront-theme='dark'] #orderModalHeader {
  background: rgba(16, 19, 35, 0.96) !important;
  border-color: rgba(244, 114, 182, 0.18) !important;
}

@media (min-width: 1024px) {
  .hottrendnu-page #productsGrid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (min-width: 1280px) {
  .hottrendnu-page #productsGrid {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .hottrendnu-hero {
    min-height: auto;
    padding: 5.75rem 0.85rem 1.2rem;
  }

  .hottrendnu-hero-inner {
    display: flex;
    flex-direction: column;
    gap: 1.4rem;
  }

  .hottrendnu-title {
    max-width: 9ch;
    font-size: clamp(2.55rem, 13.2vw, 3.35rem);
    line-height: 0.93;
    margin-top: 0.55rem;
  }

  .hottrendnu-copy {
    margin-top: 1rem !important;
    font-size: 0.84rem;
    line-height: 1.5;
  }

  .hottrendnu-actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.55rem;
    margin-top: 0.9rem;
  }

  .hottrendnu-primary-btn,
  .hottrendnu-secondary-btn {
    min-height: 3.1rem;
    justify-content: center;
    padding: 0.72rem 0.65rem;
    border-radius: 0.78rem;
    font-size: 0.82rem;
    white-space: nowrap;
  }

  .hottrendnu-stat-strip {
    display: none;
  }

  .hottrendnu-page #heroBannersWrapper {
    width: 100%;
    padding: 0.55rem;
    border-radius: 1.35rem;
  }

  .hottrendnu-page #heroBannersCollapsed {
    height: 248px !important;
    min-height: 0 !important;
  }

  .hottrendnu-section {
    padding: 2.7rem 0.85rem;
  }

  .hottrendnu-section-head {
    display: block;
  }

  .hottrendnu-section-head p {
    margin-top: 0.55rem;
    font-size: 0.95rem;
  }

  .hottrendnu-products-panel {
    padding: 0.75rem;
    border-radius: 1.1rem;
  }

  .hottrendnu-meta-row {
    align-items: flex-start;
  }

  .hottrendnu-page #productsGrid.mobile-products-list {
    display: grid !important;
    grid-template-columns: 1fr !important;
  }

  .hottrendnu-page #productsGrid.mobile-products-grid {
    display: grid !important;
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  }

  .hottrendnu-page #productsGrid.mobile-products-list .htn-product-card,
  .hottrendnu-page #productsGrid.mobile-products-grid .htn-product-card,
  .hottrendnu-page #products .htn-product-card {
    display: grid !important;
    grid-template-columns: none !important;
    grid-template-rows: auto minmax(0, 1fr) !important;
  }

  .hottrendnu-page #productsGrid.mobile-products-list .htn-product-media,
  .hottrendnu-page #productsGrid.mobile-products-grid .htn-product-media,
  .hottrendnu-page #products .htn-product-media {
    width: 100% !important;
    aspect-ratio: 4 / 5 !important;
  }

  .hottrendnu-page .product-card-actions {
    margin-top: 0.7rem;
  }

  .htn-rank-card {
    flex-basis: 82vw;
    grid-template-columns: 1fr;
    grid-template-rows: 210px auto;
    min-height: 0;
  }

  .htn-rank-body h3,
  .htn-deal-body h3 {
    font-size: 1.08rem;
    -webkit-line-clamp: 2;
  }

  .htn-deal-card {
    grid-template-rows: 210px auto;
  }

  .hottrendnu-page .hero-3d-carousel {
    height: 248px;
  }

  .hottrendnu-page .hero-carousel-stage {
    width: min(60vw, 210px);
    height: 236px;
  }

  .htn-hero-card-copy {
    padding: 0.68rem;
  }

  .htn-hero-card-copy h3 {
    font-size: 0.86rem;
    line-height: 1.05;
  }

  .htn-hero-card-copy > p {
    font-size: 0.55rem;
    letter-spacing: 0.12em;
  }

  .htn-hero-card-footer {
    margin-top: 0.48rem;
    align-items: flex-end;
  }

  .htn-hero-card-footer .product-commerce-meta,
  .htn-hero-card-copy .product-commerce-meta {
    display: none;
  }

  .htn-hero-card-footer .htn-product-price-row {
    margin-top: 0;
  }

  .htn-hero-card-footer .htn-product-price {
    font-size: 0.88rem;
  }

  .htn-hero-card-footer .htn-product-original {
    font-size: 0.62rem;
  }

  .htn-hero-card-cta {
    font-size: 0.66rem;
  }

  .htn-product-body {
    padding: 0.75rem;
  }

  .htn-product-title-row h3 {
    font-size: 0.88rem;
  }

  .htn-product-price {
    font-size: 0.98rem;
  }

  .htn-buy,
  .htn-cart {
    min-height: 2.45rem;
    border-radius: 0.65rem;
  }

  .hottrendnu-feature-grid {
    grid-template-columns: 1fr;
  }
}

/* QH Clothes mockup implementation */
body.hottrendnu-page {
  --htn-bg: #FFF7F8;
  --htn-surface: #FCEEEF;
  --htn-card: #FFFFFF;
  --htn-ink: #2B2024;
  --htn-muted: #7B6870;
  --htn-rose: #C94F7C;
  --htn-rose-hover: #A93C66;
  --htn-sale: #E84D6A;
  --htn-border: #F3DDE4;
  --htn-chip: #F9E3EA;
  --htn-success: #22B573;
  background: var(--htn-bg);
  color: var(--htn-ink);
  font-family: 'Be Vietnam Pro', sans-serif !important;
}

/* Force UI Font */
body.hottrendnu-page * {
  font-family: 'Be Vietnam Pro', sans-serif !important;
}

body.hottrendnu-page .fa,
body.hottrendnu-page .fas,
body.hottrendnu-page .far,
body.hottrendnu-page .fa-solid,
body.hottrendnu-page .fa-regular {
  font-family: "Font Awesome 6 Free" !important;
}

body.hottrendnu-page .fab,
body.hottrendnu-page .fa-brands {
  font-family: "Font Awesome 6 Brands" !important;
}

body.hottrendnu-page .fas,
body.hottrendnu-page .fa-solid {
  font-weight: 900 !important;
}

body.hottrendnu-page .far,
body.hottrendnu-page .fa-regular {
  font-weight: 400 !important;
}

/* Cormorant Garamond Serif Accent font */
body.hottrendnu-page .qhher-accent,
body.hottrendnu-page .qhher-logo,
body.hottrendnu-page .qhher-hero-title,
body.hottrendnu-page .qhher-hero-script,
body.hottrendnu-page .qhher-promo-sale {
  font-family: 'Cormorant Garamond', serif !important;
}

.hottrendnu-page h1,
.hottrendnu-page h2,
.hottrendnu-page h3,
.hottrendnu-page .font-display {
  font-family: 'Be Vietnam Pro', sans-serif !important;
  letter-spacing: 0;
}

/* Header & Marquee */
.hottrendnu-page .navbar-blur {
  background: rgba(255, 247, 248, 0.96) !important;
  border-bottom: 1px solid var(--htn-border) !important;
  box-shadow: 0 8px 28px rgba(201, 79, 124, 0.05) !important;
}

.hottrendnu-page .storefront-marquee-bar {
  min-height: 32px;
  background: #FDE5EC !important;
  border-bottom: 1px solid var(--htn-border) !important;
}

.hottrendnu-page .storefront-marquee-text {
  color: var(--htn-rose) !important;
  font-size: 12px !important;
  font-weight: 500 !important;
}

.hottrendnu-page .storefront-marquee-icon {
  color: var(--htn-rose) !important;
  font-size: 11px !important;
}

.hottrendnu-page .storefront-marquee-separator {
  color: rgba(201, 79, 124, 0.4) !important;
  font-size: 12px;
  margin: 0 0.5rem;
}

.qhher-header-main {
  height: 76px;
}

.qhher-logo {
  color: var(--htn-rose) !important;
  font-size: 36px !important;
  font-weight: 700 !important;
  line-height: 1;
  white-space: nowrap;
}

.qhher-nav-link {
  color: var(--htn-ink) !important;
  font-size: 14px !important;
  font-weight: 600 !important;
  transition: color 0.18s ease;
  text-decoration: none;
}

.qhher-nav-link:hover {
  color: var(--htn-rose) !important;
}

.qhher-nav-link--sale {
  color: var(--htn-sale) !important;
  font-weight: 700 !important;
}

.qhher-header-search {
  position: relative;
  width: min(100%, 310px);
}

.qhher-search-box {
  position: relative;
}

.qhher-header-search input,
.qhher-mobile-search input {
  width: 100% !important;
  height: 40px !important;
  border: 1px solid var(--htn-border) !important;
  border-radius: 999px !important;
  background: #FFFFFF !important;
  color: var(--htn-ink) !important;
  padding: 0 2.6rem 0 1.15rem !important;
  font-size: 14px !important;
  outline: none !important;
  box-shadow: none !important;
}

.qhher-header-search i,
.qhher-mobile-search i {
  position: absolute;
  right: 1.15rem;
  top: 50%;
  color: var(--htn-muted);
  transform: translateY(-50%);
  font-size: 14px;
}

.qhher-search-suggest-panel {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  z-index: 90;
  max-height: min(440px, calc(100dvh - 150px));
  overflow-y: auto;
  border: 1px solid var(--htn-border);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 22px 54px rgba(201, 79, 124, 0.16);
  padding: 8px;
}

.qhher-search-suggest-panel.hidden {
  display: none;
}

.qhher-search-suggest-item {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr);
  gap: 10px;
  width: 100%;
  align-items: center;
  border: 0;
  border-radius: 14px;
  background: transparent;
  padding: 8px;
  text-align: left;
  cursor: pointer;
}

.qhher-search-suggest-item:hover,
.qhher-search-suggest-item:focus-visible {
  background: var(--htn-chip);
  outline: none;
}

.qhher-search-suggest-thumb {
  width: 48px;
  height: 58px;
  overflow: hidden;
  border-radius: 12px;
  background: #FCEEEF;
}

.qhher-search-suggest-thumb img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.qhher-search-suggest-title {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  color: var(--htn-ink);
  font-size: 13px;
  font-weight: 800;
  line-height: 1.25;
}

.qhher-search-suggest-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
  color: var(--htn-sale);
  font-size: 12px;
  font-weight: 800;
}

.qhher-search-suggest-original {
  color: var(--htn-muted);
  font-size: 11px;
  font-weight: 600;
  text-decoration: line-through;
}

.qhher-search-suggest-action,
.qhher-search-suggest-empty {
  width: 100%;
  border: 0;
  border-radius: 14px;
  background: #FFF7F8;
  color: var(--htn-rose);
  padding: 10px 12px;
  text-align: center;
  font-size: 13px;
  font-weight: 800;
}

.qhher-search-suggest-empty {
  color: var(--htn-muted);
}

.qhher-icon-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  min-width: 42px;
  height: 42px;
  border: 0 !important;
  border-radius: 999px !important;
  background: transparent !important;
  color: var(--htn-ink) !important;
  font-weight: 600 !important;
  font-size: 14px !important;
  transition: background 0.18s ease, color 0.18s ease;
  cursor: pointer;
}

.qhher-icon-btn:hover {
  background: var(--htn-chip) !important;
  color: var(--htn-rose) !important;
}

.qhher-icon-btn i {
  font-size: 16px;
}

.hottrendnu-page .qhher-header-search + .flex .qhher-icon-btn[onclick="focusProductsSearch()"] {
  display: none;
}

/* Hero Section */
.hottrendnu-hero {
  min-height: 0 !important;
  padding: 8rem 1rem 1.5rem !important;
}

.hottrendnu-hero-inner {
  max-width: 1280px;
  margin: 0 auto;
}

.qhher-hero-grid {
  display: grid;
  grid-template-columns: 1.35fr 0.95fr;
  gap: 20px;
}

.qhher-hero-main {
  position: relative;
  display: grid;
  grid-template-columns: 0.52fr 0.48fr;
  overflow: hidden;
  border: 1px solid var(--htn-border);
  border-radius: 20px;
  background: linear-gradient(135deg, #FFFFFF 0%, #FCEEEF 100%);
}

.qhher-hero-copy {
  position: relative;
  z-index: 2;
  align-self: center;
  padding: 2.5rem 1.5rem 2.5rem 0.5rem;
}

.qhher-hero-script {
  color: var(--htn-muted);
  font-size: 20px !important;
  font-style: italic;
  line-height: 1;
}

.qhher-hero-title {
  max-width: 10ch;
  margin-top: 0.5rem;
  color: var(--htn-rose) !important;
  font-size: 38px !important;
  font-weight: 700 !important;
  line-height: 1.05 !important;
}

.qhher-hero-subtitle {
  margin-top: 0.9rem;
  color: var(--htn-muted) !important;
  font-size: 14px !important;
  font-weight: 500 !important;
  line-height: 1.4;
}

.qhher-hero-actions {
  display: flex;
  gap: 0.8rem;
  margin-top: 1.5rem;
}

.qhher-primary-btn,
.qhher-secondary-btn,
.hottrendnu-page .btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 44px;
  border-radius: 14px !important;
  padding: 0.75rem 1.35rem !important;
  font-size: 14px !important;
  font-weight: 600 !important;
  text-decoration: none;
  transition: transform 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
}

.qhher-primary-btn:hover,
.hottrendnu-page .btn-primary:hover {
  background: var(--htn-rose-hover) !important;
  transform: translateY(-1px);
}

.qhher-primary-btn,
.hottrendnu-page .btn-primary {
  border: 1px solid var(--htn-rose) !important;
  background: var(--htn-rose) !important;
  color: #FFFFFF !important;
  box-shadow: none !important;
}

.qhher-secondary-btn {
  border: 1px solid var(--htn-border) !important;
  background: rgba(255, 255, 255, 0.8) !important;
  color: var(--htn-rose) !important;
}

.qhher-secondary-btn:hover {
  background: #FFFFFF !important;
  transform: translateY(-1px);
}

.hottrendnu-page #heroBannersWrapper {
  min-width: 0;
  height: 100%;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.hottrendnu-page #heroBannersCollapsed {
  width: 100% !important;
  height: 100% !important;
}

.hottrendnu-page .hero-3d-carousel {
  width: 100%;
  height: 100%;
  min-height: 380px;
  overflow: hidden;
  perspective: none;
}

.hottrendnu-page .hero-carousel-stage {
  width: 100%;
  height: 100%;
}

.hottrendnu-page .hero-carousel-nav {
  display: none;
}

.hottrendnu-page .htn-hero-card {
  position: absolute;
  inset: 0;
  display: block;
  border: 0 !important;
  border-radius: 0;
  background: transparent !important;
  box-shadow: none !important;
}

.hottrendnu-page .hero-carousel-card[data-offset="0"] {
  transform: none !important;
  opacity: 1 !important;
  pointer-events: auto;
}

.hottrendnu-page .hero-carousel-card:not([data-offset="0"]) {
  opacity: 0 !important;
  pointer-events: none;
}

.hottrendnu-page .htn-hero-card-media {
  width: 100%;
  height: 100%;
  background: #FCEEEF;
}

.hottrendnu-page .htn-hero-card-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hottrendnu-page .htn-hero-card-media::after,
.hottrendnu-page .htn-hero-card-copy {
  display: none;
}

.hottrendnu-page .htn-hero-card-index {
  display: none;
}

.qhher-hero-promos {
  display: grid;
  grid-template-rows: 1fr 1fr;
  gap: 16px;
}

.qhher-promo-card {
  display: flex;
  justify-content: space-between;
  align-items: stretch;
  overflow: hidden;
  min-height: 142px;
  border: 1px solid var(--htn-border);
  border-radius: 20px;
  background: linear-gradient(135deg, #FFFFFF 0%, #FCEEEF 100%);
  text-decoration: none;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.qhher-promo-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(201, 79, 124, 0.05);
}

.qhher-promo-copy {
  flex: 1;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.qhher-promo-title {
  color: var(--htn-ink);
  font-size: 16px !important;
  font-weight: 700;
  line-height: 1.2;
}

.qhher-promo-sale {
  color: var(--htn-sale) !important;
  font-size: 32px !important;
  font-weight: 700 !important;
  line-height: 1;
  margin-top: 2px;
}

.qhher-promo-link {
  font-size: 12px;
  font-weight: 700;
  color: var(--htn-rose);
  margin-top: 6px;
}

.qhher-promo-thumb {
  flex: 0 0 130px;
  position: relative;
  overflow: hidden;
  background: #FCEEEF;
}

.qhher-promo-thumb img {
  display: block !important;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Category Rail */
.qhher-category-rail {
  max-width: 1280px;
  margin: 24px auto 0;
  display: grid;
  grid-template-columns: repeat(8, minmax(0, 1fr));
  gap: 16px;
  border: 1px solid var(--htn-border);
  border-radius: 20px;
  background: #FFFFFF;
  padding: 1rem 1.25rem;
}

.qhher-category-pill {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border-radius: 12px;
  color: var(--htn-ink) !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  text-decoration: none;
  transition: color 0.2s ease, transform 0.2s ease;
}

.qhher-category-pill:hover {
  color: var(--htn-rose) !important;
  transform: translateY(-1px);
}

.qhher-category-avatar {
  width: 48px !important;
  height: 48px !important;
  border-radius: 50% !important;
  object-fit: cover !important;
  border: 1px solid var(--htn-border) !important;
  background: #FCEEEF;
}

.qhher-category-avatar-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 999px;
  overflow: hidden;
  border: 1px solid var(--htn-border);
  background: #FCEEEF;
}

.qhher-category-avatar-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.qhher-category-avatar-wrap--new {
  color: var(--htn-rose);
  background: linear-gradient(135deg, #FDE5EC, #FFFFFF);
}

.qhher-mobile-category-page {
  scroll-margin-top: 104px;
  margin: 0 auto 1rem;
  padding: calc(96px + env(safe-area-inset-top, 0px)) 16px 88px;
  background:
    radial-gradient(circle at 85% 0%, rgba(253, 229, 236, 0.92), transparent 34%),
    linear-gradient(180deg, #FFF7F8 0%, #FFFFFF 68%, #FFF7F8 100%);
}

body.hottrendnu-page.qhher-category-open .navbar-blur {
  display: none;
}

.qhher-category-page-head {
  display: grid;
  grid-template-columns: 42px 1fr 42px;
  align-items: center;
  gap: 10px;
  min-height: 44px;
}

.qhher-category-page-head h2 {
  margin: 0;
  color: var(--htn-ink);
  font-size: 18px;
  font-weight: 800;
  text-align: center;
  letter-spacing: -0.01em;
}

.qhher-category-back-btn,
.qhher-category-cart-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--htn-ink);
  font-size: 18px;
  position: relative;
}

.qhher-category-cart-btn span {
  position: absolute;
  top: 3px;
  right: 2px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 999px;
  background: var(--htn-sale);
  color: #fff;
  font-size: 10px;
  font-weight: 800;
  line-height: 16px;
}

.qhher-category-page-search {
  position: relative;
  margin-top: 14px;
}

.qhher-category-page-search input {
  width: 100%;
  height: 44px;
  border: 1px solid var(--htn-border);
  border-radius: 14px;
  background: rgba(255,255,255,0.92);
  padding: 0 44px;
  color: var(--htn-ink);
  font-size: 14px;
  font-weight: 600;
  outline: none;
}

.qhher-category-page-search i {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--htn-muted);
  font-size: 14px;
}

.qhher-category-page-body {
  margin-top: 20px;
}

.qhher-category-page-kicker {
  margin: 0 0 12px;
  color: var(--htn-ink);
  font-size: 14px;
  font-weight: 800;
}

.qhher-mobile-category-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.qhher-category-card,
.qhher-collection-card {
  display: block;
  width: 100%;
  border: 1px solid var(--htn-border);
  border-radius: 18px;
  background: #FFFFFF;
  overflow: hidden;
  text-align: center;
  box-shadow: 0 10px 26px rgba(201,79,124,0.06);
}

.qhher-category-card-media {
  display: block;
  width: 100%;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: #FCEEEF;
}

.qhher-category-card-media img,
.qhher-collection-card-media img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.qhher-category-card-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #FDE5EC, #FFFFFF);
  color: var(--htn-rose);
  font-size: 22px;
}

.qhher-category-card-title {
  display: block;
  margin-top: 7px;
  padding: 0 8px;
  color: var(--htn-ink);
  font-size: 13px;
  font-weight: 800;
  line-height: 1.35;
}

.qhher-category-card-count {
  display: block;
  padding: 1px 8px 10px;
  color: var(--htn-muted);
  font-size: 11px;
  font-weight: 600;
}

.qhher-collection-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 22px 0 12px;
}

.qhher-collection-head h3 {
  margin: 0;
  color: var(--htn-ink);
  font-size: 15px;
  font-weight: 900;
}

.qhher-collection-head a {
  color: var(--htn-sale);
  font-size: 12px;
  font-weight: 800;
  text-decoration: none;
}

.qhher-featured-collections {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.qhher-collection-card-media {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  background: #FCEEEF;
}

.qhher-collection-card-label {
  display: block;
  padding: 9px 8px 11px;
  color: var(--htn-ink);
  font-size: 12px;
  font-weight: 800;
  line-height: 1.3;
}

@media (max-width: 767px) {
  .qhher-mobile-category-page {
    position: fixed;
    inset: 0 0 64px 0;
    z-index: 45;
    margin: 0;
    padding: calc(14px + env(safe-area-inset-top, 0px)) 16px 24px;
    overflow-y: auto;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
  }

  body.hottrendnu-page.qhher-category-open {
    overflow: hidden;
  }
}

/* Sections General */
.hottrendnu-section {
  max-width: 1280px;
  padding: 2.5rem 1rem 1.5rem !important;
}

.hottrendnu-section-head {
  margin-bottom: 1.25rem !important;
}

.hottrendnu-section-head h2 {
  color: var(--htn-ink) !important;
  font-size: 28px !important;
  font-weight: 600 !important;
  line-height: 36px !important;
}

.hottrendnu-section-head p {
  color: var(--htn-muted) !important;
  font-size: 14px !important;
  font-weight: 400 !important;
}

.hottrendnu-kicker {
  color: var(--htn-rose) !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  text-transform: uppercase;
}

/* Flash Sale timer */
.hottrendnu-page .flash-sale-timer-digit {
  background: var(--htn-sale) !important;
  color: #FFFFFF !important;
  border-radius: 6px !important;
  padding: 3px 6px !important;
  font-family: monospace !important;
  font-weight: 700 !important;
}

/* Bestsellers and Flash Sale Track */
.hottrendnu-page #flashSaleShopSection > div,
.hottrendnu-page .hottrendnu-products-panel,
body.hottrendnu-page #filterBar.hottrendnu-products-panel {
  border: 1px solid var(--htn-border) !important;
  border-radius: 20px !important;
  background: #FFFFFF !important;
  box-shadow: none !important;
  padding: 1.25rem !important;
}

.hottrendnu-page .flash-sale-shop-track,
.hottrendnu-page .bestsellers-track {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 0.5rem;
  scrollbar-width: none;
}

.hottrendnu-page .flash-sale-shop-track::-webkit-scrollbar,
.hottrendnu-page .bestsellers-track::-webkit-scrollbar {
  display: none;
}

.htn-rank-card,
.htn-deal-card {
  flex: 0 0 178px;
  display: block;
  min-height: 0;
  border: 0 !important;
  border-radius: 14px !important;
  background: #FFFFFF !important;
  box-shadow: none !important;
  cursor: pointer;
}

.htn-rank-image,
.htn-deal-media {
  aspect-ratio: 4 / 5 !important;
  border-radius: 12px !important;
  overflow: hidden;
  background: #FCEEEF;
}

.htn-rank-image img,
.htn-deal-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.htn-rank-body,
.htn-deal-body {
  padding: 0.55rem 0.1rem 0 !important;
}

.htn-rank-body h3,
.htn-deal-body h3 {
  margin-top: 0;
  font-size: 13px !important;
  font-weight: 500 !important;
  line-height: 18px !important;
  color: var(--htn-ink) !important;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.htn-rank-kicker,
.htn-rank-number {
  display: none !important;
}

.hottrendnu-page .product-commerce-meta--hottrendnu {
  display: none !important;
}

/* Price layout */
.htn-product-price-row {
  display: flex;
  align-items: baseline;
  gap: 0.35rem;
  margin-top: 0.35rem;
}

.htn-product-price {
  color: var(--htn-sale) !important;
  font-size: 15px !important;
  font-weight: 700 !important;
}

.htn-product-original {
  color: var(--htn-muted) !important;
  font-size: 12px !important;
  text-decoration: line-through;
  font-weight: 400;
}

/* Main Grid & Filters */
.hottrendnu-products-panel {
  margin-top: 1rem;
}

.hottrendnu-filter-row {
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
}

.hottrendnu-search input,
.hottrendnu-sort-wrap,
.hottrendnu-type-chip {
  border: 1px solid var(--htn-border) !important;
  border-radius: 12px !important;
  background: #FFFFFF !important;
  color: var(--htn-ink) !important;
  font-size: 14px !important;
}

.hottrendnu-search input {
  padding: 0.75rem 1rem 0.75rem 2.6rem !important;
}

.hottrendnu-filter-btn {
  width: 44px;
  height: 44px;
  border-radius: 12px !important;
  background: #FFFFFF !important;
  color: var(--htn-rose) !important;
  border: 1px solid var(--htn-border) !important;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.hottrendnu-filter-btn:hover {
  background: var(--htn-chip) !important;
}

.hottrendnu-type-row {
  gap: 0.6rem;
  padding: 0.85rem 0 0.45rem;
}

.hottrendnu-type-chip {
  padding: 0.55rem 1rem !important;
  color: var(--htn-muted) !important;
  font-weight: 600 !important;
  cursor: pointer;
}

.hottrendnu-type-chip.active {
  background: var(--htn-chip) !important;
  border-color: var(--htn-chip) !important;
  color: var(--htn-rose) !important;
}

.hottrendnu-meta-row {
  margin: 0.5rem 0 0.85rem;
  font-size: 13px !important;
  font-weight: 600 !important;
}

/* Product Cards Grid */
.hottrendnu-page #productsGrid {
  grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
  gap: 20px !important;
}

.hottrendnu-page .htn-product-card,
.hottrendnu-page .product-card {
  border: 1px solid var(--htn-border) !important;
  border-radius: 20px !important;
  background: #FFFFFF !important;
  box-shadow: none !important;
  cursor: pointer;
  overflow: hidden;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.htn-product-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 24px rgba(201, 79, 124, 0.05) !important;
}

.htn-product-media {
  aspect-ratio: 4 / 3;
  margin: 0.5rem 0.5rem 0 !important;
  border-radius: 15px !important;
  overflow: hidden;
  position: relative;
  background: #FCEEEF;
}

.htn-product-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.htn-product-media-top {
  position: absolute;
  inset: 0.6rem 0.6rem auto !important;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.htn-product-type,
.htn-product-ribbon {
  border-radius: 6px !important;
  background: var(--htn-sale) !important;
  color: #FFFFFF !important;
  padding: 0.25rem 0.5rem !important;
  font-size: 11px !important;
  font-weight: 700 !important;
  text-transform: uppercase;
}

.htn-product-body {
  padding: 0.75rem 0.75rem 0.85rem !important;
}

.htn-product-title-row h3 {
  color: var(--htn-ink) !important;
  font-size: 14px !important;
  line-height: 20px !important;
  font-weight: 500 !important;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

/* Color dot elements */
.htn-color-row {
  display: flex;
  gap: 0.35rem;
  margin-top: 0.6rem;
}

.htn-color-dot {
  display: inline-block !important;
  flex: 0 0 14px !important;
  width: 14px !important;
  min-width: 14px !important;
  max-width: 14px !important;
  height: 14px !important;
  min-height: 14px !important;
  max-height: 14px !important;
  padding: 0 !important;
  font-size: 0 !important;
  line-height: 0 !important;
  overflow: hidden !important;
  border-radius: 50% !important;
  border: 1px solid rgba(43, 32, 36, 0.08) !important;
}

/* Size pills */
.htn-size-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 0.6rem;
}

.htn-size-row span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 30px;
  height: 22px;
  border: 1px solid var(--htn-border) !important;
  border-radius: 6px !important;
  background: #FFFFFF !important;
  color: var(--htn-muted) !important;
  font-size: 11px !important;
  font-weight: 600 !important;
}

/* Product Card Actions */
.htn-actions {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 38px;
  gap: 6px;
  padding-top: 0.75rem;
}

.htn-buy,
.htn-cart {
  min-height: 38px !important;
  border-radius: 12px !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  transition: opacity 0.2s;
}

.htn-buy:hover,
.htn-cart:hover {
  opacity: 0.9;
}

.htn-buy {
  background: var(--htn-rose) !important;
  color: #FFFFFF !important;
}

.htn-cart {
  background: #FFFFFF !important;
  color: var(--htn-rose) !important;
  border: 1px solid var(--htn-border) !important;
}

/* Feature grid */
.hottrendnu-feature-grid {
  background: #FFFFFF;
}

.hottrendnu-feature-tile {
  border-right: 1px solid var(--htn-border) !important;
  padding: 1.5rem !important;
  min-height: auto !important;
}

.hottrendnu-feature-tile:last-child {
  border-right: 0 !important;
}

.qhher-service-strip {
  width: 100%;
  margin: 0;
  padding: 0 1rem;
  background: rgba(255, 255, 255, 0.96);
  border-top: 1px solid var(--htn-border);
  border-bottom: 1px solid var(--htn-border);
}

.qhher-service-inner {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  align-items: center;
  max-width: 1280px;
  min-height: 72px;
  margin: 0 auto;
}

.qhher-service-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  min-width: 0;
  height: 100%;
  color: var(--htn-ink);
}

.qhher-service-item i {
  flex: 0 0 auto;
  width: 2.35rem;
  color: var(--htn-rose);
  font-size: 2rem;
  line-height: 1;
  text-align: center;
}

.qhher-service-item h3 {
  margin: 0;
  color: var(--htn-ink) !important;
  font-size: 0.86rem !important;
  font-weight: 800 !important;
  line-height: 1.2 !important;
}

.qhher-service-item p {
  margin-top: 0.28rem;
  color: var(--htn-muted) !important;
  font-size: 0.72rem !important;
  font-weight: 500 !important;
  line-height: 1.25 !important;
}

.qhher-footer {
  margin: 0;
  padding: 1.25rem 1rem 0;
  color: var(--htn-ink);
  background: rgba(255, 247, 248, 0.92);
  border-bottom: 1px solid var(--htn-border);
}

.qhher-footer-grid {
  display: grid;
  grid-template-columns: 1.35fr 0.9fr 1fr 1.15fr 1.25fr;
  gap: clamp(1.5rem, 4vw, 4rem);
  max-width: 1280px;
  margin: 0 auto;
}

.qhher-footer-brand .qhher-logo {
  font-size: 2rem !important;
  line-height: 1 !important;
}

.qhher-footer-brand > p:not(.qhher-logo) {
  margin-top: 0.55rem;
  color: var(--htn-muted) !important;
  font-size: 0.72rem !important;
  font-weight: 500 !important;
  line-height: 1.55 !important;
}

.qhher-footer-socials {
  display: flex;
  align-items: center;
  gap: 1.05rem;
  margin-top: 0.85rem;
}

.qhher-footer-socials a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: auto;
  height: auto;
  color: var(--htn-ink) !important;
  font-size: 1rem;
  line-height: 1;
  text-decoration: none;
}

.qhher-footer-socials a:hover {
  color: var(--htn-rose) !important;
}

.qhher-footer-col > p {
  margin: 0 0 0.7rem;
  color: var(--htn-ink) !important;
  font-size: 0.72rem !important;
  font-weight: 900 !important;
  line-height: 1.25 !important;
  letter-spacing: 0.02em !important;
}

.qhher-footer-col ul {
  display: grid;
  gap: 0.35rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.qhher-footer-col li,
.qhher-footer-col a,
.qhher-footer-col span {
  color: var(--htn-muted) !important;
  font-size: 0.72rem !important;
  font-weight: 500 !important;
  line-height: 1.45 !important;
  text-decoration: none;
}

.qhher-footer-col a:hover {
  color: var(--htn-rose) !important;
}

.qhher-footer-contact li {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.qhher-footer-contact i {
  flex: 0 0 auto;
  width: 0.8rem;
  margin-top: 0.08rem;
  color: var(--htn-rose);
  font-size: 0.78rem;
  line-height: 1.2;
}

.qhher-footer-copy {
  max-width: 1280px;
  margin: 1.25rem auto 0;
  padding: 0.72rem 0;
  border-top: 1px solid var(--htn-border);
  text-align: center;
}

.qhher-footer-copy p {
  color: var(--htn-muted) !important;
  font-size: 0.68rem !important;
  font-weight: 500 !important;
  line-height: 1.2 !important;
}

/* Mobile bottom nav */
.hottrendnu-page .mobile-bottom-nav {
  height: 64px !important;
  background: rgba(255, 255, 255, 0.97) !important;
  border-top: 1px solid var(--htn-border) !important;
}

.hottrendnu-page .mobile-bottom-nav-link {
  color: var(--htn-ink) !important;
  font-size: 11px !important;
}

.hottrendnu-page .mobile-bottom-nav-link.is-active {
  color: var(--htn-rose) !important;
}

/* Modals & Popups redone */
.hottrendnu-page #orderPopupCard,
.hottrendnu-page #variantModalPanel,
.hottrendnu-page .cart-modal,
.hottrendnu-page .user-menu-panel,
.hottrendnu-page .review-modal-panel {
  border: 1px solid var(--htn-border) !important;
  background: #FFFFFF !important;
  box-shadow: 0 20px 50px rgba(201, 79, 124, 0.08) !important;
  border-radius: 20px !important;
}

.hottrendnu-page #orderModalHeader {
  background: #FFFFFF !important;
  border-bottom: 1px solid var(--htn-border) !important;
}

.hottrendnu-page #orderPopupCard input,
.hottrendnu-page #orderPopupCard textarea,
.hottrendnu-page #orderPopupCard select,
.hottrendnu-page #variantModalPanel input,
.hottrendnu-page #variantModalPanel textarea,
.hottrendnu-page .address-dropdown-trigger {
  border: 1px solid var(--htn-border) !important;
  border-radius: 12px !important;
  background: #FFFFFF !important;
}

.hottrendnu-page #orderPopupCard .btn-primary,
.hottrendnu-page #variantModalPanel .btn-primary {
  background: var(--htn-rose) !important;
  border: 1px solid var(--htn-rose) !important;
  border-radius: 14px !important;
}

.hottrendnu-page #orderPopupCard .add-to-cart-btn,
.hottrendnu-page #variantModalPanel .add-to-cart-btn {
  background: #FFFFFF !important;
  color: var(--htn-rose) !important;
  border: 1px solid var(--htn-border) !important;
  border-radius: 14px !important;
}

/* Active states for color/size selector buttons in modals */
.hottrendnu-page .color-btn.active {
  outline: 3px solid var(--htn-rose) !important;
  outline-offset: 2px !important;
}

.hottrendnu-page .size-btn {
  border-radius: 8px !important;
}

.hottrendnu-page .size-btn.active {
  background: var(--htn-rose) !important;
  color: #FFFFFF !important;
  border-color: var(--htn-rose) !important;
}

/* Responsive adjustments */
@media (max-width: 1024px) {
  .hottrendnu-page #productsGrid {
    grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
  }
}

@media (max-width: 768px) {
  .qhher-header-main {
    height: 56px;
  }

  .qhher-logo {
    font-size: 28px !important;
  }

  .qhher-mobile-search {
    padding: 0 1rem 0.75rem;
  }

  .hottrendnu-hero {
    padding: 9rem 1rem 0.75rem !important;
  }

  .qhher-hero-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .qhher-hero-main {
    grid-template-columns: 0.44fr 0.56fr;
  }

  .qhher-hero-copy {
    padding: 1rem 0.5rem 1rem 0.25rem;
  }

  .qhher-hero-script {
    font-size: 14px !important;
  }

  .qhher-hero-title {
    font-size: 22px !important;
  }

  .qhher-hero-subtitle {
    font-size: 11px !important;
    margin-top: 0.45rem;
  }

  .qhher-hero-actions {
    margin-top: 0.75rem;
  }

  .qhher-primary-btn,
  .qhher-secondary-btn {
    min-height: 36px !important;
    padding: 0.5rem 0.85rem !important;
    font-size: 12px !important;
    border-radius: 10px !important;
  }

  .qhher-secondary-btn {
    display: none !important;
  }

  .hottrendnu-page .hero-3d-carousel {
    min-height: 210px !important;
    height: 210px !important;
  }

  .hottrendnu-page .hero-carousel-stage {
    height: 210px !important;
  }

  .qhher-hero-promos {
    display: none !important;
  }

  /* Scrollable Category Rail on mobile */
  .qhher-category-rail {
    display: flex !important;
    overflow-x: auto !important;
    gap: 14px;
    margin-top: 14px;
    padding: 0 0.25rem 0.5rem 0 !important;
    border: 0 !important;
    background: transparent !important;
    scrollbar-width: none;
  }

  .qhher-category-rail::-webkit-scrollbar {
    display: none;
  }

  .qhher-category-pill {
    flex: 0 0 68px;
    gap: 6px;
    font-size: 11px !important;
  }

  .qhher-category-avatar {
    width: 48px !important;
    height: 48px !important;
  }

  .hottrendnu-section {
    padding: 1.5rem 1rem !important;
  }

  .hottrendnu-section-head h2 {
    font-size: 20px !important;
    line-height: 26px !important;
  }

  .hottrendnu-section-head p {
    display: none !important;
  }

  .hottrendnu-products-panel,
  body.hottrendnu-page #filterBar.hottrendnu-products-panel {
    border: 0 !important;
    background: transparent !important;
    padding: 0 !important;
  }

  .hottrendnu-filter-row {
    display: none !important;
  }

  .hottrendnu-type-row {
    padding-top: 0 !important;
  }

  .hottrendnu-meta-row {
    font-size: 12px !important;
  }

  /* 2 Columns grid on mobile */
  .hottrendnu-page #productsGrid,
  .hottrendnu-page #productsGrid.mobile-products-list,
  .hottrendnu-page #productsGrid.mobile-products-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 14px !important;
  }

  .hottrendnu-page #productsGrid.mobile-products-list .htn-product-card,
  .hottrendnu-page #productsGrid.mobile-products-grid .htn-product-card,
  .hottrendnu-page #products .htn-product-card {
    display: block !important;
  }

  .htn-product-media {
    margin: 0.35rem 0.35rem 0 !important;
    border-radius: 14px !important;
  }

  .htn-product-body {
    padding: 0.5rem 0.5rem 0.6rem !important;
  }

  .htn-product-title-row h3 {
    font-size: 13px !important;
    line-height: 17px !important;
  }

  .htn-actions {
    grid-template-columns: minmax(0, 1fr) 34px;
    gap: 4px;
  }

  .htn-buy,
  .htn-cart {
    min-height: 34px !important;
    border-radius: 10px !important;
    font-size: 12px !important;
  }

  .hottrendnu-feature-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    border-radius: 16px !important;
  }

  .hottrendnu-feature-tile {
    border-right: 1px solid var(--htn-border) !important;
    border-bottom: 1px solid var(--htn-border) !important;
    padding: 1rem !important;
  }

  .hottrendnu-feature-tile:nth-child(even) {
    border-right: 0 !important;
  }

  .hottrendnu-feature-tile:nth-child(3),
  .hottrendnu-feature-tile:nth-child(4) {
    border-bottom: 0 !important;
  }

  .qhher-service-strip {
    padding: 0 1rem !important;
  }

  .qhher-service-inner {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    min-height: 0 !important;
    padding: 0.85rem 0 !important;
    gap: 0.75rem !important;
  }

  .qhher-service-item {
    justify-content: flex-start !important;
    gap: 0.72rem !important;
  }

  .qhher-service-item i {
    width: 1.8rem !important;
    font-size: 1.5rem !important;
  }

  .qhher-service-item h3 {
    font-size: 0.76rem !important;
  }

  .qhher-service-item p {
    font-size: 0.66rem !important;
  }

  .qhher-footer {
    padding: 1.2rem 1rem 5.4rem !important;
  }

  .qhher-footer-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 1.35rem 1rem !important;
  }

  .qhher-footer-brand,
  .qhher-footer-contact {
    grid-column: 1 / -1 !important;
  }

  .qhher-footer-brand .qhher-logo {
    font-size: 1.85rem !important;
  }

  .qhher-footer-copy {
    margin-top: 1rem !important;
    padding-bottom: 0 !important;
  }

  .htn-rank-card,
  .htn-deal-card {
    flex: 0 0 148px;
  }

  .htn-rank-body h3,
  .htn-deal-body h3 {
    font-size: 12px !important;
    line-height: 16px !important;
  }
}

/* Deals row grid setup */
.hottrendnu-deals-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
}
@media (min-width: 1024px) {
  .hottrendnu-deals-row.has-trending {
    grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr);
  }
}
.hottrendnu-deals-row .hottrendnu-section {
  padding: 0 !important;
  max-width: none !important;
  margin: 0 !important;
}

/* Order overrides for main hero card on PC and SP */
@media (min-width: 768px) {
  .qhher-hero-main {
    display: grid !important;
    grid-template-columns: 0.52fr 0.48fr !important;
  }
  .qhher-hero-copy {
    order: 1 !important;
    padding: 2.5rem 1.5rem 2.5rem 2.5rem !important;
  }
  #heroBannersWrapper {
    order: 2 !important;
  }
  
  /* Desktop Full-width card actions */
  .htn-actions {
    display: block !important;
    width: 100% !important;
  }
  .htn-cart {
    display: none !important;
  }
  .htn-buy {
    width: 100% !important;
    background: var(--htn-rose) !important;
    color: #FFFFFF !important;
    border: 0 !important;
    border-radius: 14px !important;
    font-weight: 600 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    min-height: 2.5rem !important;
  }
  .htn-buy:hover {
    background: var(--htn-rose-hover) !important;
  }
  .htn-buy-cart-icon {
    margin-left: auto !important;
    display: inline-block !important;
  }
}

@media (max-width: 767px) {
  .qhher-hero-main {
    display: grid !important;
    grid-template-columns: 0.44fr 0.56fr !important;
  }
  .qhher-hero-copy {
    order: 2 !important;
    padding: 1rem 0.5rem 1rem 0.25rem !important;
  }
  #heroBannersWrapper {
    order: 1 !important;
  }

  /* Mobile outline buttons */
  .htn-actions {
    display: grid !important;
    grid-template-columns: minmax(0, 1fr) 2.65rem !important;
    gap: 6px !important;
  }
  .htn-buy {
    background: transparent !important;
    border: 1.5px solid var(--htn-rose) !important;
    color: var(--htn-rose) !important;
    border-radius: 14px !important;
    font-weight: 600 !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
  }
  .htn-cart {
    background: transparent !important;
    border: 1.5px solid var(--htn-rose) !important;
    color: var(--htn-rose) !important;
    border-radius: 14px !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    font-weight: 600 !important;
  }
}

/* Specificity Resets to override dark mode colors */
body.hottrendnu-page .qhher-hero-title,
body.hottrendnu-page[data-storefront-theme='dark'] .qhher-hero-title {
  color: var(--htn-rose) !important;
}
body.hottrendnu-page .qhher-hero-script,
body.hottrendnu-page[data-storefront-theme='dark'] .qhher-hero-script {
  color: var(--htn-muted) !important;
}
body.hottrendnu-page .qhher-hero-subtitle,
body.hottrendnu-page[data-storefront-theme='dark'] .qhher-hero-subtitle {
  color: var(--htn-muted) !important;
}
body.hottrendnu-page .qhher-promo-title,
body.hottrendnu-page[data-storefront-theme='dark'] .qhher-promo-title {
  color: var(--htn-ink) !important;
}
body.hottrendnu-page .qhher-promo-sale,
body.hottrendnu-page[data-storefront-theme='dark'] .qhher-promo-sale {
  color: var(--htn-sale) !important;
}
body.hottrendnu-page .hottrendnu-kicker,
body.hottrendnu-page[data-storefront-theme='dark'] .hottrendnu-kicker {
  color: var(--htn-rose) !important;
}
body.hottrendnu-page .hottrendnu-section-head h2,
body.hottrendnu-page[data-storefront-theme='dark'] .hottrendnu-section-head h2 {
  color: var(--htn-ink) !important;
}
body.hottrendnu-page .bestsellers-track h3,
body.hottrendnu-page[data-storefront-theme='dark'] .bestsellers-track h3,
body.hottrendnu-page .flash-sale-shop-track h3,
body.hottrendnu-page[data-storefront-theme='dark'] .flash-sale-shop-track h3 {
  color: var(--htn-ink) !important;
}
body.hottrendnu-page .filter-search-input,
body.hottrendnu-page[data-storefront-theme='dark'] .filter-search-input {
  color: var(--htn-text-primary) !important;
  background: #ffffff !important;
}
body.hottrendnu-page .filter-sort-select,
body.hottrendnu-page[data-storefront-theme='dark'] .filter-sort-select {
  color: var(--htn-text-primary) !important;
  background: #ffffff !important;
}
body.hottrendnu-page .htn-card-title,
body.hottrendnu-page[data-storefront-theme='dark'] .htn-card-title {
  color: var(--htn-ink) !important;
}
body.hottrendnu-page .htn-card-price,
body.hottrendnu-page[data-storefront-theme='dark'] .htn-card-price {
  color: var(--htn-sale) !important;
}
body.hottrendnu-page .htn-product-price,
body.hottrendnu-page[data-storefront-theme='dark'] .htn-product-price {
  color: var(--htn-sale) !important;
}
body.hottrendnu-page .htn-product-original,
body.hottrendnu-page[data-storefront-theme='dark'] .htn-product-original {
  color: var(--htn-muted) !important;
}
body.hottrendnu-page .htn-card-sizes span,
body.hottrendnu-page[data-storefront-theme='dark'] .htn-card-sizes span {
  color: var(--htn-text-secondary) !important;
  border-color: var(--htn-border) !important;
  background: #ffffff !important;
}
body.hottrendnu-page .hottrendnu-products-panel,
body.hottrendnu-page[data-storefront-theme='dark'] .hottrendnu-products-panel {
  border: 1px solid var(--htn-border) !important;
  border-radius: 20px !important;
  background: #FFFFFF !important;
  box-shadow: none !important;
}

/* QH Clothes top-section final alignment: match supplied desktop mockup. */
body.hottrendnu-page {
  background: #FFF7F8 !important;
}

body.hottrendnu-page .navbar-blur {
  background: rgba(255, 247, 248, 0.98) !important;
}

body.hottrendnu-page .purchase-toast {
  display: none !important;
}

body.hottrendnu-page .storefront-marquee-bar {
  height: 30px !important;
  min-height: 30px !important;
  background: #FDE5EC !important;
}

body.hottrendnu-page .storefront-marquee-track,
body.hottrendnu-page .storefront-marquee-seq,
body.hottrendnu-page .storefront-marquee-group {
  height: 30px !important;
  display: flex !important;
  align-items: center !important;
  gap: 0.65rem !important;
}

body.hottrendnu-page .storefront-marquee-icon,
body.hottrendnu-page .storefront-marquee-group i,
body.hottrendnu-page .storefront-marquee-bar i {
  display: inline-flex !important;
  color: var(--htn-rose) !important;
  font-size: 0.74rem !important;
  line-height: 1 !important;
}

.qhher-top-dot {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: var(--htn-rose);
  display: inline-flex;
  flex: 0 0 auto;
}

.qhher-glyph {
  position: relative;
  display: inline-flex;
  width: 16px;
  height: 16px;
  flex: 0 0 auto;
  color: currentColor;
}

.qhher-glyph-search {
  border: 2px solid currentColor;
  border-radius: 999px;
  width: 15px;
  height: 15px;
}

.qhher-glyph-search::after {
  content: '';
  position: absolute;
  width: 7px;
  height: 2px;
  right: -5px;
  bottom: -2px;
  background: currentColor;
  border-radius: 999px;
  transform: rotate(45deg);
}

.qhher-glyph-menu,
.qhher-glyph-menu::before,
.qhher-glyph-menu::after {
  height: 2px;
  background: currentColor;
  border-radius: 999px;
}

.qhher-glyph-menu {
  width: 18px;
  align-self: center;
}

.qhher-glyph-menu::before,
.qhher-glyph-menu::after {
  content: '';
  position: absolute;
  left: 0;
  width: 18px;
}

.qhher-glyph-menu::before { top: -6px; }
.qhher-glyph-menu::after { bottom: -6px; }

.qhher-glyph-heart::before {
  content: '♡';
  position: absolute;
  inset: -5px 0 0 -1px;
  font-size: 22px;
  line-height: 1;
}

.qhher-glyph-cart {
  border: 2px solid currentColor;
  border-top: 0;
  border-radius: 2px 2px 5px 5px;
  width: 17px;
  height: 13px;
  margin-top: 2px;
}

.qhher-glyph-cart::before {
  content: '';
  position: absolute;
  left: 3px;
  right: 3px;
  top: -5px;
  height: 7px;
  border: 2px solid currentColor;
  border-bottom: 0;
  border-radius: 8px 8px 0 0;
}

.qhher-glyph-wallet {
  width: 17px;
  height: 13px;
  border: 2px solid currentColor;
  border-radius: 4px;
}

.qhher-glyph-wallet::after {
  content: '';
  position: absolute;
  right: 2px;
  top: 4px;
  width: 3px;
  height: 3px;
  border-radius: 999px;
  background: currentColor;
}

.qhher-glyph-user {
  width: 17px;
  height: 17px;
}

.qhher-glyph-user::before,
.qhher-glyph-user::after {
  content: '';
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  border: 2px solid currentColor;
}

.qhher-glyph-user::before {
  width: 7px;
  height: 7px;
  top: 1px;
  border-radius: 999px;
}

.qhher-glyph-user::after {
  width: 14px;
  height: 8px;
  bottom: 0;
  border-radius: 999px 999px 3px 3px;
}

.qhher-glyph-moon {
  width: 17px;
  height: 17px;
  border-radius: 999px;
  box-shadow: inset -6px 0 0 currentColor;
}

.qhher-glyph-arrow {
  width: 14px;
  height: 14px;
}

.qhher-glyph-arrow::before {
  content: '';
  position: absolute;
  width: 8px;
  height: 8px;
  right: 2px;
  top: 3px;
  border-top: 2px solid currentColor;
  border-right: 2px solid currentColor;
  transform: rotate(45deg);
}

.qhher-glyph-arrow::after {
  content: '';
  position: absolute;
  width: 12px;
  height: 2px;
  right: 2px;
  top: 7px;
  border-radius: 999px;
  background: currentColor;
}

body.hottrendnu-page .qhher-header-main {
  height: 76px !important;
  max-width: 1280px !important;
  gap: 1.45rem !important;
  padding-inline: 0 !important;
}

body.hottrendnu-page .qhher-logo {
  font-size: 34px !important;
  line-height: 1 !important;
}

body.hottrendnu-page .qhher-nav-link {
  font-size: 13px !important;
  line-height: 18px !important;
  white-space: nowrap !important;
}

body.hottrendnu-page .qhher-header-search {
  width: 270px !important;
}

body.hottrendnu-page .qhher-header-search input {
  height: 40px !important;
  font-size: 13px !important;
}

body.hottrendnu-page #walletNavBtn,
body.hottrendnu-page #storefrontThemeToggle {
  display: none !important;
}

body.hottrendnu-page .qhher-header-search .qhher-glyph-search,
body.hottrendnu-page .qhher-mobile-search .qhher-glyph-search {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
}

body.hottrendnu-page .qhher-icon-btn {
  min-width: 36px !important;
  height: 40px !important;
  gap: 0.35rem !important;
}

body.hottrendnu-page .qhher-header-actions {
  gap: 1.45rem !important;
}

body.hottrendnu-page .qhher-header-actions .qhher-icon-btn {
  min-width: 0 !important;
  width: auto !important;
  height: 40px !important;
  padding: 0 !important;
  border: 0 !important;
  border-radius: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
  outline: 0 !important;
  color: var(--htn-ink) !important;
  gap: 0.42rem !important;
  font-size: 14px !important;
  font-weight: 600 !important;
  line-height: 1 !important;
  white-space: nowrap !important;
}

body.hottrendnu-page .qhher-header-actions .qhher-icon-btn:hover {
  background: transparent !important;
  color: var(--htn-rose) !important;
}

body.hottrendnu-page .qhher-header-actions .qhher-icon-btn > i,
body.hottrendnu-page .qhher-header-actions #userAvatarDefault > i {
  display: inline-flex !important;
  width: 1.45rem !important;
  height: 1.45rem !important;
  align-items: center !important;
  justify-content: center !important;
  color: currentColor !important;
  font-size: 1.35rem !important;
  line-height: 1 !important;
}

body.hottrendnu-page .qhher-header-actions #cartBadge {
  top: -0.58rem !important;
  left: 1.08rem !important;
  right: auto !important;
  width: 1.1rem !important;
  height: 1.1rem !important;
  border-radius: 999px !important;
  background: var(--htn-sale) !important;
  color: #fff !important;
  font-size: 0.64rem !important;
  font-weight: 800 !important;
  line-height: 1 !important;
  box-shadow: 0 0 0 2px #FFF7F8 !important;
}

body.hottrendnu-page .qhher-header-actions #cartBadgeMobile {
  display: none !important;
}

body.hottrendnu-page #userAvatarDefault {
  width: auto !important;
  height: auto !important;
  background: transparent !important;
  border: 0 !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  outline: 0 !important;
  color: currentColor !important;
}

body.hottrendnu-page .qhher-header-actions #userAvatarImg {
  width: 1.75rem !important;
  height: 1.75rem !important;
  border: 0 !important;
  box-shadow: none !important;
  outline: 0 !important;
}

body.hottrendnu-page #storefrontThemeToggle {
  background: #FDE5EC !important;
  border: 1px solid #F3DDE4 !important;
  color: #C94F7C !important;
}

body.hottrendnu-page .hottrendnu-hero {
  padding: 7.25rem 1rem 0 !important;
}

body.hottrendnu-page .hottrendnu-hero-inner {
  max-width: 1280px !important;
  width: 100% !important;
  display: block !important;
  grid-template-columns: none !important;
  gap: 0 !important;
}

body.hottrendnu-page .qhher-hero-grid {
  grid-template-columns: minmax(0, 1.33fr) minmax(0, 0.92fr) !important;
  gap: 20px !important;
  width: 100% !important;
  align-items: start !important;
}

body.hottrendnu-page .qhher-hero-main {
  min-height: 286px !important;
  max-height: 300px !important;
  width: 100% !important;
  grid-template-columns: minmax(0, 42%) minmax(0, 58%) !important;
  border-radius: 16px !important;
}

body.hottrendnu-page .qhher-hero-copy {
  grid-column: 2 !important;
  grid-row: 1 !important;
  order: 2 !important;
  padding: 2.1rem 2rem 2rem 2.2rem !important;
}

body.hottrendnu-page .qhher-hero-visual,
body.hottrendnu-page #heroBannersWrapper {
  grid-column: 1 !important;
  grid-row: 1 !important;
  order: 1 !important;
  width: 100% !important;
  min-width: 0 !important;
}

body.hottrendnu-page .qhher-hero-visual {
  height: 100% !important;
  min-height: 286px !important;
  overflow: hidden !important;
  background: #FCEEEF !important;
}

body.hottrendnu-page .qhher-hero-visual img {
  width: 100% !important;
  height: 100% !important;
  display: block !important;
  object-fit: cover !important;
  object-position: center top !important;
}

body.hottrendnu-page .hero-3d-carousel {
  min-height: 286px !important;
  height: 286px !important;
}

body.hottrendnu-page .hero-carousel-stage {
  height: 286px !important;
}

body.hottrendnu-page .htn-hero-card-media img {
  object-fit: cover !important;
  object-position: center top !important;
}

body.hottrendnu-page .qhher-hero-script {
  font-size: 20px !important;
}

body.hottrendnu-page .qhher-hero-title {
  max-width: 9.5ch !important;
  margin-top: 0.45rem !important;
  font-size: 42px !important;
  line-height: 1.02 !important;
}

body.hottrendnu-page .qhher-hero-subtitle {
  margin-top: 0.8rem !important;
  font-size: 14px !important;
  color: #2B2024 !important;
}

body.hottrendnu-page .qhher-hero-actions {
  margin-top: 1.05rem !important;
  gap: 0.75rem !important;
}

body.hottrendnu-page .qhher-primary-btn,
body.hottrendnu-page .qhher-secondary-btn {
  min-height: 38px !important;
  padding: 0.58rem 1.15rem !important;
  font-size: 13px !important;
  border-radius: 10px !important;
}

body.hottrendnu-page .qhher-hero-promos {
  gap: 14px !important;
  width: 100% !important;
  height: 300px !important;
  grid-template-rows: repeat(2, minmax(0, 1fr)) !important;
}

body.hottrendnu-page .qhher-promo-card {
  min-height: 0 !important;
  height: 143px !important;
  border-radius: 16px !important;
  overflow: hidden !important;
  display: grid !important;
  grid-template-columns: 132px minmax(0, 1fr) !important;
  align-items: stretch !important;
  background:
    radial-gradient(circle at 82% 28%, rgba(255, 239, 244, 0.98) 0 18%, rgba(255, 239, 244, 0) 50%),
    linear-gradient(100deg, #fff7f8 0%, #fffafa 44%, #fceeef 100%) !important;
}

body.hottrendnu-page .qhher-promo-copy {
  min-width: 0 !important;
  padding: 1.15rem 1.5rem 1rem 1.35rem !important;
  display: grid !important;
  grid-template-columns: minmax(0, 1fr) auto !important;
  grid-template-rows: min-content min-content 1fr !important;
  column-gap: 1.1rem !important;
  align-items: center !important;
}

body.hottrendnu-page .qhher-promo-thumb {
  grid-column: 1 !important;
  grid-row: 1 !important;
  width: 132px !important;
  min-width: 132px !important;
  order: 0 !important;
  height: 100% !important;
}

body.hottrendnu-page .qhher-promo-thumb img {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
}

body.hottrendnu-page .qhher-promo-title {
  grid-column: 1 !important;
  color: #2B2024 !important;
  font-size: 19px !important;
  line-height: 1.1 !important;
  font-weight: 700 !important;
  max-width: 8.5rem !important;
}

body.hottrendnu-page .qhher-promo-sale {
  grid-column: 2 !important;
  grid-row: 1 / span 2 !important;
  align-self: end !important;
  justify-self: center !important;
  margin: 0 0 0.2rem !important;
  color: #C94F7C !important;
  font-size: 42px !important;
  line-height: 0.95 !important;
  font-weight: 600 !important;
}

body.hottrendnu-page .qhher-promo-link {
  grid-column: 2 !important;
  grid-row: 3 !important;
  justify-self: center !important;
  align-self: start !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  min-width: 118px !important;
  min-height: 32px !important;
  padding: 0.45rem 1rem !important;
  border-radius: 999px !important;
  background: #C94F7C !important;
  color: #FFFFFF !important;
  box-shadow: 0 8px 18px rgba(201, 79, 124, 0.18) !important;
  font-size: 12px !important;
  font-weight: 700 !important;
  line-height: 1 !important;
}

body.hottrendnu-page .qhher-promo-copy .qhher-hero-script {
  grid-column: 1 !important;
  color: #7B6870 !important;
  font-size: 18px !important;
  line-height: 1 !important;
  margin: 0 0 0.3rem !important;
  max-width: 8.5rem !important;
}

body.hottrendnu-page .qhher-promo-link .qhher-glyph-arrow {
  filter: brightness(0) invert(1) !important;
}

body.hottrendnu-page .qhher-hero-main {
  position: relative !important;
  isolation: isolate !important;
  display: grid !important;
  overflow: hidden !important;
  background: #FCEEEF !important;
}

body.hottrendnu-page .qhher-hero-main::before {
  content: '' !important;
  position: absolute !important;
  inset: 0 !important;
  z-index: 1 !important;
  pointer-events: none !important;
  background:
    radial-gradient(circle at 92% 12%, rgba(255, 236, 241, 0.94) 0 8%, rgba(255, 236, 241, 0) 31%),
    radial-gradient(circle at 86% 86%, rgba(252, 206, 223, 0.68) 0 10%, rgba(252, 206, 223, 0) 36%),
    linear-gradient(270deg, rgba(255, 247, 248, 0.98) 0%, rgba(255, 238, 244, 0.94) 50%, rgba(255, 238, 244, 0.62) 65%, rgba(255, 238, 244, 0.2) 84%, rgba(255, 247, 248, 0.02) 100%) !important;
}

body.hottrendnu-page .qhher-hero-flower {
  position: absolute !important;
  top: 0.45rem !important;
  right: -1.45rem !important;
  z-index: 2 !important;
  width: clamp(104px, 14vw, 174px) !important;
  max-width: 32% !important;
  height: auto !important;
  opacity: 0.42 !important;
  pointer-events: none !important;
  object-fit: contain !important;
  filter: saturate(0.86) brightness(1.04) drop-shadow(0 12px 24px rgba(201, 79, 124, 0.08)) !important;
  transform: rotate(2deg) !important;
}

body.hottrendnu-page .qhher-hero-slider,
body.hottrendnu-page #heroBannersWrapper {
  position: absolute !important;
  inset: 0 auto 0 0 !important;
  z-index: 0 !important;
  grid-column: 1 / -1 !important;
  grid-row: 1 !important;
  width: 58% !important;
  height: 100% !important;
  min-height: 0 !important;
  overflow: hidden !important;
  border-radius: 16px 0 0 16px !important;
  -webkit-mask-image: linear-gradient(90deg, #000 0%, #000 74%, rgba(0, 0, 0, 0.72) 87%, transparent 100%) !important;
  mask-image: linear-gradient(90deg, #000 0%, #000 74%, rgba(0, 0, 0, 0.72) 87%, transparent 100%) !important;
  background: #FCEEEF !important;
}

body.hottrendnu-page #heroBannersCollapsed,
body.hottrendnu-page .qhher-hero-slider-stage,
body.hottrendnu-page #qhherHeroSliderTrack,
body.hottrendnu-page #heroBannersCollapsed > div,
body.hottrendnu-page .hero-setting-banner-card,
body.hottrendnu-page .hero-3d-carousel,
body.hottrendnu-page .hero-carousel-stage {
  position: relative !important;
  width: 100% !important;
  height: 100% !important;
  min-height: 0 !important;
  max-width: none !important;
  margin: 0 !important;
  padding: 0 !important;
  border-radius: inherit !important;
  overflow: hidden !important;
  perspective: none !important;
  transform-style: flat !important;
}

body.hottrendnu-page #heroBannersCollapsed > img,
body.hottrendnu-page .qhher-hero-slider-stage > img,
body.hottrendnu-page .hero-setting-banner-card img,
body.hottrendnu-page .htn-hero-card-media,
body.hottrendnu-page .htn-hero-card-media img {
  width: 100% !important;
  height: 100% !important;
  display: block !important;
  object-fit: cover !important;
  object-position: center center !important;
  border-radius: 0 !important;
}

body.hottrendnu-page #heroBannersCollapsed > .qhher-fallback-slide,
body.hottrendnu-page .qhher-hero-slider-stage > .qhher-fallback-slide {
  position: absolute !important;
  inset: 0 !important;
  opacity: 0;
  transform: scale(1.02);
  animation: none !important;
  transition: opacity 0.58s ease, transform 1.8s ease;
  pointer-events: none;
}

body.hottrendnu-page #heroBannersCollapsed > .qhher-fallback-slide.is-active,
body.hottrendnu-page .qhher-hero-slider-stage > .qhher-fallback-slide.is-active {
  opacity: 1 !important;
  transform: scale(1.02) !important;
}

body.hottrendnu-page #heroBannersCollapsed > .qhher-fallback-slide:nth-child(1),
body.hottrendnu-page .qhher-hero-slider-stage > .qhher-fallback-slide:nth-child(1) {
  animation-delay: 0s !important;
}

body.hottrendnu-page #heroBannersCollapsed > .qhher-fallback-slide:nth-child(2),
body.hottrendnu-page .qhher-hero-slider-stage > .qhher-fallback-slide:nth-child(2) {
  animation-delay: 4s !important;
}

body.hottrendnu-page #heroBannersCollapsed > .qhher-fallback-slide:nth-child(3),
body.hottrendnu-page .qhher-hero-slider-stage > .qhher-fallback-slide:nth-child(3) {
  animation-delay: 8s !important;
}

@keyframes qhherHeroFallbackFade {
  0%,
  28% {
    opacity: 1;
    transform: scale(1.02);
  }
  36%,
  92% {
    opacity: 0;
    transform: scale(1.055);
  }
  100% {
    opacity: 1;
    transform: scale(1.02);
  }
}

body.hottrendnu-page .htn-hero-card {
  position: absolute !important;
  inset: 0 !important;
  display: block !important;
  border: 0 !important;
  border-radius: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
  transform: none !important;
  transition: opacity 0.55s ease !important;
}

body.hottrendnu-page .hero-carousel-card[data-offset="0"] {
  opacity: 1 !important;
  z-index: 2 !important;
}

body.hottrendnu-page .hero-carousel-card:not([data-offset="0"]) {
  opacity: 0 !important;
  z-index: 1 !important;
  pointer-events: none !important;
}

body.hottrendnu-page .qhher-hero-copy {
  position: relative !important;
  z-index: 2 !important;
  grid-column: 2 !important;
  align-self: stretch !important;
  display: flex !important;
  flex-direction: column !important;
  justify-content: center !important;
  box-sizing: border-box !important;
  max-width: 31rem !important;
  padding: 1.55rem 1.85rem 1.55rem 2rem !important;
  border-radius: 0 !important;
}

body.hottrendnu-page .qhher-hero-dots {
  position: absolute !important;
  left: auto !important;
  right: 23.5% !important;
  bottom: 0.85rem !important;
  z-index: 3 !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 0.36rem !important;
  transform: none !important;
}

body.hottrendnu-page .qhher-hero-dot {
  width: 7px !important;
  height: 7px !important;
  padding: 0 !important;
  border: 0 !important;
  border-radius: 999px !important;
  background: rgba(201, 79, 124, 0.22) !important;
  cursor: pointer !important;
  transition: width 0.2s ease, background 0.2s ease, transform 0.2s ease !important;
}

body.hottrendnu-page .qhher-hero-dot:hover {
  transform: scale(1.14) !important;
  background: rgba(201, 79, 124, 0.42) !important;
}

body.hottrendnu-page .qhher-hero-dot.is-active {
  width: 18px !important;
  background: var(--htn-rose) !important;
}

body.hottrendnu-page .qhher-hero-title {
  max-width: 12.5ch !important;
  font-size: 38px !important;
  line-height: 1.06 !important;
}

body.hottrendnu-page .qhher-category-shell {
  max-width: 1280px !important;
  margin: 18px auto 0 !important;
  display: grid !important;
  grid-template-columns: minmax(0, 1fr) 270px !important;
  gap: 16px !important;
}

body.hottrendnu-page .qhher-category-rail {
  max-width: 1280px !important;
  width: 100% !important;
  margin-top: 0 !important;
  justify-self: stretch !important;
  grid-template-columns: repeat(7, minmax(72px, 1fr)) !important;
  gap: 12px !important;
  padding: 0.55rem 0.85rem !important;
  border-radius: 14px !important;
  min-height: 62px !important;
}

body.hottrendnu-page .qhher-category-avatar {
  width: 38px !important;
  height: 38px !important;
}

body.hottrendnu-page .qhher-category-pill {
  font-size: 12px !important;
  gap: 0.38rem !important;
}

body.hottrendnu-page .qhher-sale-tile {
  display: flex !important;
  align-items: center !important;
  gap: 0.85rem !important;
  min-height: 62px !important;
  border: 1px solid var(--htn-border) !important;
  border-radius: 14px !important;
  background: rgba(255, 255, 255, 0.92) !important;
  color: var(--htn-rose) !important;
  padding: 0.75rem 1rem !important;
  font-size: 13px !important;
  font-weight: 700 !important;
  text-decoration: none !important;
}

body.hottrendnu-page .qhher-sale-icon {
  position: relative;
  display: inline-flex;
  width: 34px;
  height: 34px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: #FDE5EC;
}

body.hottrendnu-page .qhher-sale-icon::before,
body.hottrendnu-page .qhher-section-icon::before {
  content: '';
  width: 10px;
  height: 16px;
  display: block;
  border-radius: 7px 7px 7px 1px;
  background: var(--htn-sale);
  transform: rotate(22deg);
}

body.hottrendnu-page .qhher-sale-icon::after,
body.hottrendnu-page .qhher-section-icon::after {
  content: '';
  position: absolute;
  width: 6px;
  height: 8px;
  border-radius: 999px 999px 999px 1px;
  background: #FFFFFF;
  transform: translate(2px, 3px) rotate(22deg);
}

body.hottrendnu-page .hottrendnu-deals-row {
  margin-top: 16px !important;
  margin-bottom: 20px !important;
  padding-inline: 0 !important;
  gap: 16px !important;
}

@media (min-width: 1024px) {
  body.hottrendnu-page .hottrendnu-deals-row {
    grid-template-columns: minmax(0, 1fr);
    justify-content: stretch;
  }

  body.hottrendnu-page .hottrendnu-deals-row.has-trending {
    grid-template-columns: minmax(0, 2.15fr) minmax(300px, 0.85fr);
  }
}

body.hottrendnu-page #products {
  max-width: 1280px !important;
  width: 100% !important;
  margin-left: auto !important;
  margin-right: auto !important;
  padding-top: 1rem !important;
  border: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
}

body.hottrendnu-page #products > .hottrendnu-section-head {
  display: none !important;
}

body.hottrendnu-page #products #filterBar.hottrendnu-products-panel {
  margin-top: 0 !important;
  border: 0 !important;
  border-radius: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
  padding: 0 !important;
}

body.hottrendnu-page #products .htn-product-media {
  aspect-ratio: 4 / 3 !important;
  width: auto !important;
}

body.hottrendnu-page #products .htn-product-media img {
  object-position: top center !important;
}

body.hottrendnu-page #products .htn-product-card .favorite-toggle-btn {
  left: auto !important;
  right: 0.55rem !important;
  top: 0.55rem !important;
  width: 2rem !important;
  height: 2rem !important;
  border-radius: 999px !important;
  background: transparent !important;
  color: #fff !important;
  box-shadow: none !important;
  opacity: 1 !important;
}

body.hottrendnu-page #products .htn-product-card .favorite-toggle-btn i {
  display: block !important;
  font-size: 1.38rem !important;
  line-height: 1 !important;
  color: currentColor !important;
  filter: drop-shadow(0 2px 5px rgba(15, 23, 42, 0.42));
}

body.hottrendnu-page #products .htn-product-card .favorite-toggle-btn::before {
  content: none !important;
  display: none !important;
}

body.hottrendnu-page #products .htn-product-card .favorite-toggle-btn.active {
  background: transparent !important;
  color: var(--htn-rose) !important;
}

body.hottrendnu-page #products .htn-product-card .favorite-toggle-btn.active i {
  color: var(--htn-rose) !important;
}

body.hottrendnu-page #products .htn-product-card .favorite-toggle-btn.active::before {
  content: none !important;
  display: none !important;
}

body.hottrendnu-page #products .htn-product-card .favorite-toggle-btn:not(.active),
body.hottrendnu-page #products .htn-product-card .favorite-toggle-btn:not(.active) i {
  color: #fff !important;
}

body.hottrendnu-page #products .htn-color-row {
  align-items: center !important;
  gap: 0.38rem !important;
}

body.hottrendnu-page #products .htn-color-row .htn-color-dot {
  display: inline-block !important;
  flex: 0 0 12px !important;
  width: 12px !important;
  min-width: 12px !important;
  max-width: 12px !important;
  height: 12px !important;
  min-height: 12px !important;
  max-height: 12px !important;
  padding: 0 !important;
  border-radius: 999px !important;
  line-height: 0 !important;
  font-size: 0 !important;
}

body.hottrendnu-page #products .htn-product-ribbon {
  display: none !important;
}

body.hottrendnu-page #products .htn-actions,
body.hottrendnu-page #products .htn-actions--single {
  display: block !important;
  width: 100% !important;
  padding-top: 0.72rem !important;
}

body.hottrendnu-page #products .htn-cart {
  display: none !important;
}

body.hottrendnu-page #products .htn-buy {
  position: relative !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 100% !important;
  min-height: 40px !important;
  border-radius: 10px !important;
  background: var(--htn-rose) !important;
  color: #FFFFFF !important;
  border: 0 !important;
  font-size: 13px !important;
  font-weight: 700 !important;
  line-height: 1 !important;
}

body.hottrendnu-page #products .htn-buy i:not(.htn-buy-cart-icon) {
  display: none !important;
}

body.hottrendnu-page #products .htn-buy .htn-buy-cart-icon {
  position: absolute !important;
  display: inline-block !important;
  right: 0.9rem !important;
  top: 50% !important;
  width: auto !important;
  height: auto !important;
  transform: translateY(-50%) !important;
  font-family: "Font Awesome 6 Free" !important;
  font-size: 1rem !important;
  font-weight: 900 !important;
  line-height: 1 !important;
}

@media (min-width: 769px) {
  body.hottrendnu-page #products {
    padding-left: 0 !important;
    padding-right: 0 !important;
  }

  body.hottrendnu-page #filterBar.hottrendnu-products-panel {
    margin-top: 1rem !important;
    padding: 0 !important;
    border: 0 !important;
    border-radius: 0 !important;
    background: transparent !important;
    box-shadow: none !important;
  }

  body.hottrendnu-page .hottrendnu-mobile-filter-row {
    display: none !important;
  }

  body.hottrendnu-page .hottrendnu-filter-strip {
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    gap: 16px !important;
    margin-bottom: 20px !important;
  }

  body.hottrendnu-page .hottrendnu-type-row {
    flex: 1 1 auto !important;
    min-width: 0 !important;
    padding: 0 !important;
    gap: 10px !important;
    overflow-x: auto !important;
  }

  body.hottrendnu-page .hottrendnu-type-chip {
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    min-width: 72px !important;
    height: 34px !important;
    padding: 0 18px !important;
    border: 1px solid var(--htn-border) !important;
    border-radius: 999px !important;
    background: #FFFFFF !important;
    color: var(--htn-ink) !important;
    font-size: 12px !important;
    font-weight: 700 !important;
    line-height: 1 !important;
    box-shadow: none !important;
  }

  body.hottrendnu-page .hottrendnu-type-chip.active {
    background: var(--htn-chip) !important;
    border-color: var(--htn-chip) !important;
    color: var(--htn-rose) !important;
  }

  body.hottrendnu-page .hottrendnu-filter-control-row {
    display: flex !important;
    align-items: center !important;
    justify-content: flex-end !important;
    gap: 10px !important;
    flex: 0 0 auto !important;
  }

  body.hottrendnu-page .hottrendnu-select-wrap,
  body.hottrendnu-page .hottrendnu-sort-wrap {
    position: relative !important;
    display: inline-flex !important;
    align-items: center !important;
    height: 34px !important;
    min-width: 86px !important;
    gap: 4px !important;
    padding: 0 30px 0 14px !important;
    border: 1px solid var(--htn-border) !important;
    border-radius: 999px !important;
    background: #FFFFFF !important;
    color: var(--htn-ink) !important;
    box-shadow: none !important;
  }

  body.hottrendnu-page .hottrendnu-sort-wrap {
    min-width: 150px !important;
  }

  body.hottrendnu-page .hottrendnu-select-wrap::after,
  body.hottrendnu-page .hottrendnu-sort-wrap::after {
    content: "" !important;
    position: absolute !important;
    right: 13px !important;
    top: 50% !important;
    width: 6px !important;
    height: 6px !important;
    border-right: 1.5px solid var(--htn-muted) !important;
    border-bottom: 1.5px solid var(--htn-muted) !important;
    transform: translateY(-62%) rotate(45deg) !important;
    pointer-events: none !important;
  }

  body.hottrendnu-page .hottrendnu-select-wrap select,
  body.hottrendnu-page .hottrendnu-sort-wrap select {
    width: 100% !important;
    min-width: 0 !important;
    border: 0 !important;
    outline: none !important;
    appearance: none !important;
    background: transparent !important;
    color: var(--htn-ink) !important;
    font-size: 12px !important;
    font-weight: 700 !important;
    line-height: 1 !important;
    cursor: pointer !important;
  }

  body.hottrendnu-page .hottrendnu-sort-wrap span {
    flex: 0 0 auto !important;
    color: var(--htn-ink) !important;
    font-size: 12px !important;
    font-weight: 700 !important;
  }

  body.hottrendnu-page .hottrendnu-meta-row {
    display: none !important;
  }
}

body.hottrendnu-page #flashSaleShopSection,
body.hottrendnu-page #trendingProductsSection,
body.hottrendnu-page #bestsellersSection {
  min-height: 214px !important;
  border: 1px solid var(--htn-border) !important;
  border-radius: 16px !important;
  background: rgba(255, 255, 255, 0.86) !important;
  box-shadow: none !important;
}

body.hottrendnu-page #flashSaleShopSection {
  width: 100% !important;
  max-width: none !important;
  margin: 0 !important;
  padding: 0.85rem 0.9rem !important;
}

body.hottrendnu-page #flashSaleShopGrid .htn-deal-card {
  overflow: visible;
}

body.hottrendnu-page #flashSaleShopSection .qhher-deal-header,
body.hottrendnu-page #flashSaleShopSection .flash-sale-shop-track {
  border: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
}

body.hottrendnu-page #flashSaleShopSection .flash-sale-shop-track {
  width: 100% !important;
  max-width: none !important;
  padding: 0.18rem 0.25rem 0.8rem !important;
}

body.hottrendnu-page #bestsellersSection {
  padding: 0.85rem 0.9rem 0.75rem !important;
}

body.hottrendnu-page #trendingProductsSection {
  padding: 0.85rem 0.9rem 0.75rem !important;
}

body.hottrendnu-page .qhher-deal-header,
body.hottrendnu-page .qhher-mini-section-head {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  gap: 1rem !important;
  margin-bottom: 0.85rem !important;
}

body.hottrendnu-page .qhher-deal-title,
body.hottrendnu-page .qhher-mini-title {
  display: inline-flex !important;
  align-items: center !important;
  gap: 0.45rem !important;
  color: var(--htn-ink) !important;
  font-size: 15px !important;
  line-height: 20px !important;
  font-weight: 800 !important;
  text-transform: uppercase !important;
}

body.hottrendnu-page .qhher-deal-title {
  color: var(--htn-sale) !important;
}

body.hottrendnu-page .qhher-section-icon {
  position: relative;
  display: inline-flex;
  width: 16px;
  height: 18px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
}

body.hottrendnu-page .qhher-deal-timer {
  display: inline-flex !important;
  align-items: center !important;
  gap: 0.35rem !important;
  color: var(--htn-muted) !important;
  font-size: 12px !important;
  font-weight: 500 !important;
}

body.hottrendnu-page .qhher-timer-digit {
  min-width: 26px;
  border-radius: 6px;
  background: #FDE5EC;
  color: var(--htn-sale);
  padding: 0.24rem 0.35rem;
  text-align: center;
  font-size: 12px;
  font-weight: 800;
}

body.hottrendnu-page .qhher-view-all {
  color: var(--htn-muted) !important;
  font-size: 12px !important;
  font-weight: 600 !important;
  text-decoration: none !important;
}

body.hottrendnu-page .flash-sale-shop-track,
body.hottrendnu-page .trending-products-track,
body.hottrendnu-page .bestsellers-track {
  gap: 12px !important;
  padding-bottom: 0 !important;
}

body.hottrendnu-page .qhher-mini-empty {
  width: 100%;
  min-height: 132px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed #f3dde4;
  border-radius: 14px;
  background: rgba(255, 247, 248, 0.64);
  color: #7b6870;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  padding: 0.75rem;
}

body.hottrendnu-page #flashSaleShopGrid .htn-deal-card,
body.hottrendnu-page #trendingProductsTrack .htn-rank-card,
body.hottrendnu-page #bestsellersTrack .htn-rank-card {
  flex: 0 0 104px !important;
  width: 104px !important;
  min-width: 104px !important;
  border-radius: 10px !important;
  background: transparent !important;
  box-shadow: none !important;
}

body.hottrendnu-page #flashSaleShopGrid .htn-deal-card,
body.hottrendnu-page #trendingProductsTrack .htn-rank-card {
  flex-basis: calc((100% - 72px) / 7) !important;
  width: calc((100% - 72px) / 7) !important;
  min-width: 86px !important;
  max-width: 112px !important;
}

body.hottrendnu-page #bestsellersTrack .htn-rank-card {
  flex-basis: 104px !important;
  width: 104px !important;
  min-width: 104px !important;
  max-width: 104px !important;
}

body.hottrendnu-page #flashSaleShopGrid .htn-deal-media,
body.hottrendnu-page #trendingProductsTrack .htn-rank-image,
body.hottrendnu-page #bestsellersTrack .htn-rank-image {
  border-radius: 8px !important;
  aspect-ratio: 4 / 5 !important;
}

body.hottrendnu-page #flashSaleShopGrid .htn-deal-body,
body.hottrendnu-page #trendingProductsTrack .htn-rank-body,
body.hottrendnu-page #bestsellersTrack .htn-rank-body {
  padding: 0.42rem 0 0 !important;
}

body.hottrendnu-page #flashSaleShopGrid .htn-deal-body h3,
body.hottrendnu-page #trendingProductsTrack .htn-rank-body h3,
body.hottrendnu-page #bestsellersTrack .htn-rank-body h3 {
  font-size: 11px !important;
  line-height: 15px !important;
  font-weight: 600 !important;
  min-height: 30px !important;
  margin: 0 !important;
}

body.hottrendnu-page #flashSaleShopGrid .htn-product-price,
body.hottrendnu-page #trendingProductsTrack .htn-product-price,
body.hottrendnu-page #bestsellersTrack .htn-product-price {
  font-size: 12px !important;
  line-height: 16px !important;
}

body.hottrendnu-page #flashSaleShopGrid .htn-product-original,
body.hottrendnu-page #trendingProductsTrack .htn-product-original,
body.hottrendnu-page #bestsellersTrack .htn-product-original {
  font-size: 10px !important;
}

body.hottrendnu-page #flashSaleShopGrid .htn-product-price-row,
body.hottrendnu-page #trendingProductsTrack .htn-product-price-row,
body.hottrendnu-page #bestsellersTrack .htn-product-price-row {
  gap: 0.25rem !important;
  margin-top: 0.22rem !important;
}

body.hottrendnu-page .qhher-mini-badge {
  position: absolute;
  top: 6px;
  left: 6px;
  z-index: 3;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 18px;
  border-radius: 5px;
  background: var(--htn-sale);
  color: #FFFFFF;
  padding: 0 0.35rem;
  font-size: 9px;
  line-height: 1;
  font-weight: 800;
}

@media (max-width: 768px) {
  body.hottrendnu-page .hottrendnu-section-head h2,
  body.hottrendnu-page #bestsellersSection .hottrendnu-section-head h2,
  body.hottrendnu-page #flashSaleShopSection .hottrendnu-section-head h2 {
    font-size: 20px !important;
    line-height: 28px !important;
    letter-spacing: 0 !important;
  }
}

@media (max-width: 768px) {
  body.hottrendnu-page .qhher-header-main {
    height: 56px !important;
    padding-inline: 1rem !important;
  }

  body.hottrendnu-page #userAvatarBtn {
    display: none !important;
  }

  body.hottrendnu-page .qhher-mobile-search {
    position: relative !important;
    padding: 0 1rem 0.75rem !important;
  }

  body.hottrendnu-page .qhher-mobile-search .qhher-search-suggest-panel {
    left: 1rem;
    right: 1rem;
  }

  body.hottrendnu-page .qhher-mobile-search .qhher-glyph-search {
    right: 2.05rem !important;
  }

  body.hottrendnu-page .hottrendnu-hero {
    padding: 8.9rem 1rem 0 !important;
  }

  body.hottrendnu-page .qhher-hero-grid {
    display: block !important;
  }

  body.hottrendnu-page .qhher-hero-main {
    min-height: 220px !important;
    max-height: 240px !important;
    grid-template-columns: minmax(0, 44%) minmax(0, 56%) !important;
  }

  body.hottrendnu-page .qhher-hero-visual,
  body.hottrendnu-page .hero-3d-carousel,
  body.hottrendnu-page .hero-carousel-stage {
    height: 220px !important;
    min-height: 220px !important;
  }

  body.hottrendnu-page .qhher-hero-slider,
  body.hottrendnu-page #heroBannersWrapper {
    width: 56% !important;
  }

  body.hottrendnu-page .qhher-hero-copy {
    padding: 1rem 0.9rem 0.9rem 0.5rem !important;
  }

  body.hottrendnu-page .qhher-hero-title {
    font-size: 30px !important;
    line-height: 1.03 !important;
  }

  body.hottrendnu-page .qhher-hero-script {
    font-size: 16px !important;
  }

  body.hottrendnu-page .qhher-hero-subtitle {
    font-size: 11px !important;
  }

  body.hottrendnu-page .qhher-primary-btn {
    min-height: 36px !important;
    font-size: 12px !important;
  }

  body.hottrendnu-page .qhher-category-rail {
    margin-top: 14px !important;
    padding: 0 !important;
    border: 0 !important;
  }

  body.hottrendnu-page .qhher-category-shell {
    display: flex !important;
    max-width: none !important;
    margin: 14px -1rem 0 0 !important;
    gap: 0.85rem !important;
    overflow-x: auto !important;
    padding: 0 1rem 0.15rem 0 !important;
    scrollbar-width: none !important;
  }

  body.hottrendnu-page .qhher-category-shell::-webkit-scrollbar {
    display: none !important;
  }

  body.hottrendnu-page .qhher-category-rail {
    display: flex !important;
    flex: 0 0 auto !important;
    width: auto !important;
    gap: 1rem !important;
    overflow: visible !important;
  }

  body.hottrendnu-page .qhher-category-pill,
  body.hottrendnu-page .qhher-sale-tile {
    flex: 0 0 auto !important;
  }

  body.hottrendnu-page .qhher-sale-tile {
    min-height: 52px !important;
    padding: 0 0.7rem !important;
  }

  body.hottrendnu-page .hottrendnu-deals-row,
  body.hottrendnu-page .hottrendnu-deals-row.has-trending {
    grid-template-columns: 1fr !important;
    margin-top: 14px !important;
    gap: 14px !important;
  }

  body.hottrendnu-page .hottrendnu-mobile-filter-row {
    display: grid !important;
    grid-template-columns: auto !important;
    justify-content: flex-end !important;
    gap: 10px !important;
    align-items: center !important;
    margin-bottom: 12px !important;
  }

  body.hottrendnu-page .hottrendnu-mobile-filter-row .hottrendnu-search {
    display: none;
  }

  body.hottrendnu-page .hottrendnu-filter-strip {
    display: block !important;
    margin-bottom: 10px !important;
  }

  body.hottrendnu-page .hottrendnu-filter-control-row {
    display: none !important;
  }

  body.hottrendnu-page .hottrendnu-search input {
    height: 44px !important;
    border-radius: 14px !important;
    background: #FFFFFF !important;
    border-color: var(--htn-border) !important;
    font-size: 14px !important;
  }

  body.hottrendnu-page .hottrendnu-filter-btn {
    width: 44px !important;
    height: 44px !important;
    border-radius: 14px !important;
    background: #FFFFFF !important;
    color: var(--htn-rose) !important;
    border: 1px solid var(--htn-border) !important;
  }

  body.hottrendnu-page .hottrendnu-type-row {
    display: flex !important;
    gap: 8px !important;
    padding: 0 0 10px !important;
    overflow-x: auto !important;
  }

  body.hottrendnu-page .hottrendnu-type-chip {
    height: 34px !important;
    min-width: max-content !important;
    padding: 0 14px !important;
    border-radius: 999px !important;
    font-size: 12px !important;
    font-weight: 700 !important;
    background: #FFFFFF !important;
    color: var(--htn-ink) !important;
    border-color: var(--htn-border) !important;
  }

  body.hottrendnu-page .hottrendnu-type-chip.active {
    background: var(--htn-rose) !important;
    color: #FFFFFF !important;
    border-color: var(--htn-rose) !important;
  }

  body.hottrendnu-page .hottrendnu-meta-row {
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    gap: 10px !important;
    margin: 2px 0 14px !important;
  }

  body.hottrendnu-page .hottrendnu-mobile-product-tools {
    display: inline-flex !important;
    align-items: center !important;
    justify-content: flex-end !important;
    gap: 8px !important;
    min-width: 0 !important;
  }

  body.hottrendnu-page .hottrendnu-mobile-product-tools .hottrendnu-sort-wrap {
    height: 38px !important;
    min-width: 124px !important;
    padding: 0 28px 0 12px !important;
    border-radius: 999px !important;
    background: #FFFFFF !important;
    border-color: var(--htn-border) !important;
  }

  body.hottrendnu-page .hottrendnu-mobile-product-tools .hottrendnu-sort-wrap select {
    border: 0 !important;
    outline: none !important;
    appearance: none !important;
    background: transparent !important;
    color: var(--htn-ink) !important;
    font-size: 12px !important;
    font-weight: 700 !important;
  }

  body.hottrendnu-page .hottrendnu-mobile-view-toggle {
    flex: 0 0 38px !important;
    width: 38px !important;
    height: 38px !important;
  }

  body.hottrendnu-page #flashSaleShopGrid .htn-deal-card {
    flex-basis: 94px !important;
    width: 94px !important;
    min-width: 94px !important;
  }

  body.hottrendnu-page .hottrendnu-section-head h2 {
    font-size: 20px !important;
    line-height: 28px !important;
  }

  body.hottrendnu-page #bestsellersSection h2.qhher-mini-title,
  body.hottrendnu-page #flashSaleShopSection h2.qhher-deal-title,
  body.hottrendnu-page .qhher-mini-title,
  body.hottrendnu-page .qhher-deal-title {
    font-size: 16px !important;
    line-height: 22px !important;
  }

  body.hottrendnu-page .qhher-deal-header,
  body.hottrendnu-page .qhher-mini-section-head {
    align-items: center !important;
    margin-bottom: 0.75rem !important;
  }

  body.hottrendnu-page .qhher-deal-timer {
    display: none !important;
  }

  body.hottrendnu-page #bestsellersTrack .htn-rank-card,
  body.hottrendnu-page #trendingProductsTrack .htn-rank-card,
  body.hottrendnu-page #flashSaleShopGrid .htn-deal-card {
    flex: 0 0 94px !important;
    width: 94px !important;
    min-width: 94px !important;
    max-width: 94px !important;
  }

  body.hottrendnu-page #bestsellersTrack .htn-rank-image,
  body.hottrendnu-page #trendingProductsTrack .htn-rank-image,
  body.hottrendnu-page #flashSaleShopGrid .htn-deal-media {
    width: 94px !important;
    height: auto !important;
    aspect-ratio: 4 / 5 !important;
  }

  body.hottrendnu-page #bestsellersTrack .htn-rank-body h3,
  body.hottrendnu-page #trendingProductsTrack .htn-rank-body h3,
  body.hottrendnu-page #flashSaleShopGrid .htn-deal-body h3 {
    font-size: 11px !important;
    line-height: 15px !important;
  }
}

body.hottrendnu-page .ui-select {
  position: relative !important;
  overflow: visible !important;
  padding: 0 !important;
  border: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
}

body.hottrendnu-page .ui-select::after {
  display: none !important;
}

body.hottrendnu-page .ui-select-native {
  position: absolute !important;
  inset: 0 auto auto 0 !important;
  width: 1px !important;
  height: 1px !important;
  opacity: 0 !important;
  pointer-events: none !important;
}

body.hottrendnu-page .ui-select-trigger {
  position: relative !important;
  z-index: 1 !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  gap: 0.55rem !important;
  width: 100% !important;
  min-width: 88px !important;
  min-height: 36px !important;
  padding: 0 0.85rem 0 0.95rem !important;
  border: 1px solid var(--htn-border) !important;
  border-radius: 999px !important;
  background: rgba(255, 255, 255, 0.96) !important;
  color: var(--htn-ink) !important;
  font-size: 12px !important;
  font-weight: 800 !important;
  line-height: 1 !important;
  white-space: nowrap !important;
  box-shadow: 0 8px 18px rgba(201, 79, 124, 0.045) !important;
  cursor: pointer !important;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease, transform 0.18s ease !important;
}

body.hottrendnu-page .ui-select-trigger:hover,
body.hottrendnu-page .ui-select.is-open .ui-select-trigger {
  border-color: rgba(201, 79, 124, 0.36) !important;
  background: #FFFFFF !important;
  box-shadow: 0 12px 28px rgba(201, 79, 124, 0.12) !important;
}

body.hottrendnu-page .ui-select-trigger:active {
  transform: translateY(1px) !important;
}

body.hottrendnu-page .ui-select-value {
  display: inline-block !important;
  min-width: 0 !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
}

body.hottrendnu-page .ui-select-chevron {
  flex: 0 0 auto !important;
  width: 7px !important;
  height: 7px !important;
  border-right: 1.5px solid var(--htn-muted) !important;
  border-bottom: 1.5px solid var(--htn-muted) !important;
  transform: translateY(-2px) rotate(45deg) !important;
  transition: transform 0.18s ease, border-color 0.18s ease !important;
}

body.hottrendnu-page .ui-select.is-open .ui-select-chevron {
  border-color: var(--htn-rose) !important;
  transform: translateY(2px) rotate(225deg) !important;
}

body.hottrendnu-page .ui-select-menu {
  position: absolute !important;
  top: calc(100% + 8px) !important;
  left: 0 !important;
  z-index: 60 !important;
  display: grid !important;
  gap: 0.25rem !important;
  min-width: max(100%, 168px) !important;
  max-height: 260px !important;
  padding: 0.45rem !important;
  overflow: auto !important;
  border: 1px solid rgba(201, 79, 124, 0.18) !important;
  border-radius: 14px !important;
  background: rgba(255, 255, 255, 0.98) !important;
  box-shadow: 0 22px 50px rgba(111, 37, 79, 0.16) !important;
  opacity: 0 !important;
  pointer-events: none !important;
  transform: translateY(-5px) scale(0.98) !important;
  transform-origin: top left !important;
  transition: opacity 0.16s ease, transform 0.16s ease !important;
}

body.hottrendnu-page .ui-select.is-open .ui-select-menu {
  opacity: 1 !important;
  pointer-events: auto !important;
  transform: translateY(0) scale(1) !important;
}

body.hottrendnu-page .ui-select-option {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  gap: 0.8rem !important;
  width: 100% !important;
  min-height: 34px !important;
  padding: 0.5rem 0.65rem !important;
  border: 0 !important;
  border-radius: 10px !important;
  background: transparent !important;
  color: var(--htn-ink) !important;
  font-size: 12px !important;
  font-weight: 750 !important;
  line-height: 1.2 !important;
  text-align: left !important;
  cursor: pointer !important;
}

body.hottrendnu-page .ui-select-option:hover,
body.hottrendnu-page .ui-select-option.is-highlighted {
  background: #FFF0F4 !important;
  color: var(--htn-rose) !important;
}

body.hottrendnu-page .ui-select-option.is-selected {
  background: #FDE5EC !important;
  color: var(--htn-rose) !important;
}

body.hottrendnu-page .ui-select-option.is-selected::after {
  content: "" !important;
  width: 6px !important;
  height: 10px !important;
  border-right: 2px solid var(--htn-rose) !important;
  border-bottom: 2px solid var(--htn-rose) !important;
  transform: rotate(45deg) !important;
}

body.hottrendnu-page .hottrendnu-sort-wrap.ui-select {
  min-width: 150px !important;
}

body.hottrendnu-page .hottrendnu-mobile-product-tools .hottrendnu-sort-wrap.ui-select {
  height: auto !important;
  min-width: 124px !important;
  padding: 0 !important;
}

body.hottrendnu-page .hottrendnu-mobile-product-tools .ui-select-trigger {
  min-height: 38px !important;
  padding-inline: 0.75rem !important;
}

body.hottrendnu-page .qhher-service-strip {
  max-width: none !important;
  box-shadow: none !important;
  background: rgba(255, 255, 255, 0.96) !important;
  border-top-color: var(--htn-border) !important;
  border-bottom-color: var(--htn-border) !important;
}

body.hottrendnu-page .qhher-footer {
  width: 100% !important;
  max-width: none !important;
  margin: 0 !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  background: rgba(255, 247, 248, 0.94) !important;
  border-top: 0 !important;
  border-left: 0 !important;
  border-right: 0 !important;
  border-bottom-color: var(--htn-border) !important;
}

body.hottrendnu-page #detailOverlay {
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(43, 32, 36, 0.34);
  backdrop-filter: blur(14px);
}

body.hottrendnu-page #detailOverlay > .w-full.max-w-md:not(.popup-card) {
  display: none;
}

body.hottrendnu-page #detailOverlay .popup-card {
  width: min(100%, 68rem);
  max-width: calc(100vw - 2rem);
  max-height: min(86vh, 48rem);
  overflow: hidden;
  border: 1px solid var(--htn-border);
  border-radius: 20px;
  background: #FFFFFF;
  color: var(--htn-ink);
  box-shadow: 0 24px 70px rgba(201, 79, 124, 0.18);
}

body.hottrendnu-page #detailOverlay .sticky {
  min-height: 4rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--htn-border);
  background: #FFFFFF;
}

body.hottrendnu-page #detailOverlay .detail-modal-title {
  color: var(--htn-ink);
  font-family: "Be Vietnam Pro", sans-serif;
  font-size: 1.1rem;
  font-weight: 800;
}

body.hottrendnu-page #detailOverlay .detail-close-btn {
  background: #FDF1F5;
  color: var(--htn-ink);
}

body.hottrendnu-page #detailContent {
  padding: 1.15rem 1.5rem 1.25rem;
  overflow-x: hidden;
}

body.hottrendnu-page #detailOverlay .detail-layout-grid {
  align-items: start;
}

body.hottrendnu-page #detailOverlay #detailGalleryViewport {
  border-radius: 18px;
  background: var(--htn-surface);
}

body.hottrendnu-page #detailOverlay #detailGalleryThumbs {
  gap: 0.6rem;
  padding-top: 0.4rem;
}

body.hottrendnu-page #detailOverlay #detailGalleryThumbs .detail-gallery-thumb {
  border-color: var(--htn-border);
  border-radius: 10px;
}

body.hottrendnu-page #detailOverlay #detailGalleryThumbs .detail-gallery-thumb.is-active {
  border-color: var(--htn-rose);
  box-shadow: 0 0 0 2px rgba(201, 79, 124, 0.14);
}

body.hottrendnu-page #detailOverlay .detail-product-title {
  color: var(--htn-ink);
  font-family: "Be Vietnam Pro", sans-serif;
  font-size: clamp(1.25rem, 1.05rem + 0.9vw, 1.9rem);
  line-height: 1.18;
  letter-spacing: 0;
}

body.hottrendnu-page #detailOverlay .detail-title-stack {
  display: block;
}

body.hottrendnu-page #detailOverlay .qhher-detail-title-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  right: 0;
  bottom: 1.1rem;
  z-index: 18;
  min-width: 3.7rem;
  height: 1.45rem;
  padding: 0 0.62rem 0 1rem;
  border-radius: 0.08rem 0 0 0.08rem;
  background: linear-gradient(90deg, #E61F45 0%, var(--htn-sale) 100%);
  color: #FFFFFF;
  font-size: 0.72rem;
  font-weight: 900;
  line-height: 1.1;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  clip-path: polygon(0 0, 0.58rem 50%, 0 100%, 100% 100%, 100% 0);
  box-shadow: 0 10px 18px rgba(232, 77, 106, 0.24);
  pointer-events: none;
}

body.hottrendnu-page #detailOverlay .qhher-detail-title-badge::before {
  content: "";
  position: absolute;
  top: -0.28rem;
  right: 0;
  width: 0.48rem;
  height: 0.3rem;
  background: #9D163C;
  clip-path: polygon(0 100%, 100% 0, 100% 100%);
}

body.hottrendnu-page #detailOverlay .qhher-detail-title-badge::after {
  content: "";
  position: absolute;
  right: 0;
  bottom: -0.28rem;
  width: 0.48rem;
  height: 0.3rem;
  background: #9D163C;
  clip-path: polygon(0 0, 100% 0, 100% 100%);
}

body.hottrendnu-page #detailOverlay .detail-price-row .qhher-detail-current-price {
  background: none;
  background-image: none;
  -webkit-background-clip: border-box;
  background-clip: border-box;
  -webkit-text-fill-color: var(--htn-sale);
  color: var(--htn-sale);
  font-size: 1.8rem;
}

body.hottrendnu-page #detailOverlay .detail-price-row .line-through {
  -webkit-text-fill-color: var(--htn-muted);
  color: var(--htn-muted);
}

body.hottrendnu-page #orderOverlay .qhher-order-price,
body.hottrendnu-page #orderBankTransferOverlay .qhher-order-price {
  background: none;
  background-image: none;
  -webkit-background-clip: border-box;
  background-clip: border-box;
  -webkit-text-fill-color: var(--htn-sale);
  color: var(--htn-sale);
}

body.hottrendnu-page #detailOverlay .detail-price-row .badge-sale {
  background: #FCEEEF;
  color: var(--htn-sale);
}

body.hottrendnu-page #detailOverlay .product-commerce-meta--detail {
  margin-bottom: 1rem;
}

body.hottrendnu-page #detailOverlay .detail-color-card {
  border-color: var(--htn-border);
  border-radius: 16px;
  box-shadow: 0 12px 24px rgba(201, 79, 124, 0.05);
}

body.hottrendnu-page #detailOverlay .detail-color-card.border-pink-500 {
  border-color: var(--htn-rose);
  box-shadow: 0 0 0 3px rgba(201, 79, 124, 0.12);
}

body.hottrendnu-page #detailOverlay .qhher-detail-color-dot {
  display: none;
}

body.hottrendnu-page #detailOverlay .size-btn {
  border-color: var(--htn-border);
  color: var(--htn-ink);
}

body.hottrendnu-page #detailOverlay .size-btn.active {
  border-color: var(--htn-rose);
  background: #FDE5EC;
  color: var(--htn-rose);
}

body.hottrendnu-page #detailOverlay .qhher-detail-description {
  margin-top: 1.25rem;
  padding-top: 1rem;
  border-top: 1px solid var(--htn-border);
}

body.hottrendnu-page #detailOverlay .qhher-detail-description h3 {
  margin-bottom: 0.55rem;
  color: var(--htn-ink);
  font-size: 0.95rem;
  font-weight: 900;
}

body.hottrendnu-page #detailOverlay .qhher-detail-description p {
  color: var(--htn-muted);
  font-size: 0.9rem;
  line-height: 1.75;
}

body.hottrendnu-page #detailActionBarContainer {
  gap: 0.85rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--htn-border);
  background: rgba(255, 255, 255, 0.98);
}

body.hottrendnu-page #detailActionBarContainer button {
  min-height: 3.15rem;
  border-radius: 14px;
  font-size: 0.95rem;
  font-weight: 900;
  box-shadow: none;
}

body.hottrendnu-page #detailActionBarContainer .qhher-detail-desktop-action {
  display: flex;
}

body.hottrendnu-page #detailActionBarContainer .qhher-detail-mobile-action {
  display: none;
}

body.hottrendnu-page #detailActionBarContainer .btn-primary {
  border: 1px solid var(--htn-rose);
  background: var(--htn-rose);
  color: #FFFFFF;
}

body.hottrendnu-page #detailActionBarContainer .qhher-detail-cart-btn,
body.hottrendnu-page #detailActionBarContainer .add-to-cart-btn {
  border: 1px solid var(--htn-border);
  background: #FFFFFF;
  color: var(--htn-rose);
}

@media (max-width: 767px) {
  body.hottrendnu-page.qhher-detail-open {
    overflow: hidden;
    touch-action: none;
  }

  body.hottrendnu-page #detailOverlay {
    align-items: stretch;
    justify-content: flex-start;
    padding: 0;
    background: #FFF7F8;
    backdrop-filter: none;
  }

  body.hottrendnu-page #detailOverlay .popup-card {
    width: 100%;
    max-width: none;
    height: 100dvh;
    max-height: none;
    border: 0;
    border-radius: 0;
    box-shadow: none;
    display: flex;
    flex-direction: column;
  }

  body.hottrendnu-page #detailOverlay .sticky {
    display: grid;
    grid-template-columns: 2.5rem 1fr auto;
    gap: 0.75rem;
    align-items: center;
    min-height: 56px;
    padding: 0 1rem;
    border-radius: 0;
    background: #FFF7F8;
  }

  body.hottrendnu-page #detailOverlay .qhher-detail-back-btn {
    display: inline-flex;
    background: transparent;
  }

  body.hottrendnu-page #detailOverlay .detail-modal-title,
  body.hottrendnu-page #detailOverlay .detail-close-btn {
    display: none;
  }

  body.hottrendnu-page #detailOverlay .qhher-detail-header-actions {
    display: inline-flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.85rem;
  }

  body.hottrendnu-page #detailOverlay .qhher-detail-header-actions button,
  body.hottrendnu-page #detailOverlay .qhher-detail-header-actions .favorite-toggle-btn {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.1rem;
    height: 2.1rem;
    border: 0;
    border-radius: 999px;
    background: transparent;
    color: var(--htn-ink);
    box-shadow: none;
  }

  body.hottrendnu-page #detailOverlay .qhher-detail-cart-action span {
    position: absolute;
    top: -0.2rem;
    right: -0.25rem;
    min-width: 1rem;
    height: 1rem;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    background: var(--htn-sale);
    color: #FFFFFF;
    font-size: 0.62rem;
    font-weight: 900;
  }

  body.hottrendnu-page #detailContent {
    flex: 1 1 auto;
    min-height: 0;
    width: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 0 1rem 6.4rem;
    background: #FFF7F8;
    overscroll-behavior: contain;
  }

  body.hottrendnu-page #detailOverlay .detail-layout-grid {
    display: block;
  }

  body.hottrendnu-page #detailOverlay .detail-media-column {
    margin: 0;
  }

  body.hottrendnu-page #detailOverlay .detail-gallery-shell {
    margin: 0 -1rem 0.35rem;
    width: 100vw;
    max-width: none;
  }

  body.hottrendnu-page #detailOverlay #detailGalleryViewport {
    width: 100%;
    border: 0;
    border-radius: 0;
    background: #FCEEEF;
  }

  body.hottrendnu-page #detailOverlay .detail-gallery-counter {
    position: static;
    min-width: 2.35rem;
    padding: 0.22rem 0.55rem;
    background: rgba(43, 32, 36, 0.48);
    color: #FFFFFF;
    font-size: 0.68rem;
    line-height: 1.1;
  }

  body.hottrendnu-page #detailOverlay .qhher-detail-slider-meta {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 0.5rem;
    min-height: 1.8rem;
    margin: 0.45rem 0 0.85rem;
  }

  body.hottrendnu-page #detailOverlay .qhher-detail-slider-meta .detail-gallery-counter {
    justify-self: start;
  }

  body.hottrendnu-page #detailOverlay .qhher-detail-dots {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.42rem;
    margin: 0;
  }

  body.hottrendnu-page #detailOverlay .qhher-detail-dot {
    width: 0.42rem;
    height: 0.42rem;
    border: 0;
    border-radius: 999px;
    background: #E8CED8;
    padding: 0;
  }

  body.hottrendnu-page #detailOverlay .qhher-detail-dot.is-active {
    width: 0.5rem;
    height: 0.5rem;
    background: var(--htn-rose);
  }

  body.hottrendnu-page #detailOverlay #detailGalleryThumbs,
  body.hottrendnu-page #detailOverlay .favorite-toggle-btn--detail,
  body.hottrendnu-page #detailOverlay .product-commerce-meta--detail {
    display: none;
  }

  body.hottrendnu-page #detailOverlay .detail-info-column {
    padding-top: 0.25rem;
  }

  body.hottrendnu-page #detailOverlay .detail-product-heading-row {
    margin-bottom: 0.55rem;
  }

  body.hottrendnu-page #detailOverlay .detail-title-stack {
    display: block;
  }

  body.hottrendnu-page #detailOverlay .detail-product-title {
    font-size: 1.08rem;
    line-height: 1.35;
    font-weight: 900;
  }

  body.hottrendnu-page #detailOverlay .qhher-detail-title-badge {
    right: 0;
    bottom: 0.86rem;
    min-width: 3.35rem;
    height: 1.3rem;
    padding: 0 0.54rem 0 0.9rem;
    font-size: 0.66rem;
    transform: scale(0.82);
    transform-origin: right center;
  }

  body.hottrendnu-page #detailOverlay .detail-price-row {
    margin-bottom: 1.15rem;
  }

  body.hottrendnu-page #detailOverlay .detail-price-row .qhher-detail-current-price {
    font-size: 1.35rem;
  }

  body.hottrendnu-page #detailOverlay .detail-price-row .line-through {
    font-size: 0.78rem;
  }

  body.hottrendnu-page #detailOverlay .detail-option-section {
    display: block;
    margin-bottom: 1.05rem;
  }

  body.hottrendnu-page #detailOverlay .detail-option-section > p {
    margin-bottom: 0.65rem;
    color: var(--htn-ink);
    font-size: 0.82rem;
    font-weight: 800;
  }

  body.hottrendnu-page #detailOverlay #detailColorGrid {
    display: flex;
    gap: 0.72rem;
  }

  body.hottrendnu-page #detailOverlay .detail-color-card {
    display: inline-flex;
    width: 1.75rem;
    height: 1.75rem;
    overflow: visible;
    border: 1px solid #E7D3DA;
    border-radius: 999px;
    padding: 0;
    background: transparent;
    box-shadow: none;
  }

  body.hottrendnu-page #detailOverlay .detail-color-card .relative,
  body.hottrendnu-page #detailOverlay .detail-color-card .px-2\\.5 {
    display: none;
  }

  body.hottrendnu-page #detailOverlay .detail-color-card .qhher-detail-color-dot {
    display: block;
    width: 100%;
    height: 100%;
    border-radius: 999px;
    box-shadow: inset 0 0 0 1px rgba(43, 32, 36, 0.08);
  }

  body.hottrendnu-page #detailOverlay .detail-color-card.border-pink-500 {
    border-color: var(--htn-rose);
    box-shadow: 0 0 0 3px rgba(201, 79, 124, 0.13);
  }

  body.hottrendnu-page #detailOverlay .detail-size-section .flex {
    gap: 0.62rem;
  }

  body.hottrendnu-page #detailOverlay .size-btn {
    width: 2.9rem;
    height: 2rem;
    border: 1px solid var(--htn-border);
    border-radius: 8px;
    background: #FFFFFF;
    color: var(--htn-ink);
    font-size: 0.78rem;
  }

  body.hottrendnu-page #detailOverlay .size-btn.active {
    border-color: var(--htn-rose);
    background: #FFFFFF;
    color: var(--htn-rose);
    box-shadow: 0 0 0 2px rgba(201, 79, 124, 0.12);
  }

  body.hottrendnu-page #detailOverlay .qhher-detail-qty-row {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    margin: 0.85rem 0 1.2rem;
    color: var(--htn-ink);
    font-size: 0.82rem;
  }

  body.hottrendnu-page #detailOverlay .qhher-detail-qty-control {
    display: inline-flex;
    align-items: center;
    overflow: hidden;
    border: 1px solid var(--htn-border);
    border-radius: 8px;
    background: #FFFFFF;
  }

  body.hottrendnu-page #detailOverlay .qhher-detail-qty-control button,
  body.hottrendnu-page #detailOverlay .qhher-detail-qty-control strong {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.05rem;
    height: 1.8rem;
    color: var(--htn-ink);
    font-size: 0.85rem;
  }

  body.hottrendnu-page #detailOverlay .qhher-detail-qty-control button {
    border: 0;
    background: #FFF7F8;
  }

  body.hottrendnu-page #detailOverlay .qhher-detail-description {
    margin-top: 1.1rem;
    padding-top: 1.05rem;
  }

  body.hottrendnu-page #detailOverlay .qhher-detail-description h3 {
    font-size: 0.9rem;
  }

  body.hottrendnu-page #detailOverlay .qhher-detail-description p {
    font-size: 0.8rem;
    line-height: 1.75;
  }

  body.hottrendnu-page #detailActionBarContainer {
    position: fixed;
    top: auto;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 10030;
    display: grid;
    grid-template-columns: minmax(0, 0.86fr) minmax(0, 1.14fr);
    gap: 0.7rem;
    height: auto;
    min-height: 0;
    padding: 0.7rem 1rem calc(0.7rem + env(safe-area-inset-bottom));
    border-top: 1px solid var(--htn-border);
    background: rgba(255, 247, 248, 0.96);
    transform: translateZ(0);
  }

  body.hottrendnu-page.qhher-detail-open #mobileBottomNav {
    display: none;
  }

  body.hottrendnu-page #detailActionBarContainer .qhher-detail-desktop-action {
    display: none;
  }

  body.hottrendnu-page #detailActionBarContainer .qhher-detail-mobile-action {
    display: flex;
  }

  body.hottrendnu-page #detailActionBarContainer button {
    width: 100%;
    min-height: 3.1rem;
    border-radius: 14px;
    font-size: 0.92rem;
  }

  body.hottrendnu-page #detailActionBarContainer .qhher-detail-cart-btn,
  body.hottrendnu-page #detailActionBarContainer .add-to-cart-btn {
    border-color: var(--htn-rose);
  }
}

body.hottrendnu-page .qhher-hero-main .qhher-hero-title,
body.hottrendnu-page[data-storefront-theme='dark'] .qhher-hero-main .qhher-hero-title {
  color: var(--htn-rose) !important;
}
`
}

function hotTrendNuNavbar(): string {
  return `<nav class="navbar-blur fixed top-0 left-0 right-0 z-50">
  <div class="storefront-marquee-bar flex items-center justify-center">
    <div class="storefront-marquee-track">
      <div class="storefront-marquee-group">
        <i class="fas fa-tags storefront-marquee-icon" aria-hidden="true"></i>
        <span class="storefront-marquee-text">Mua trực tiếp giá tốt hơn</span>
        <span class="storefront-marquee-separator">•</span>
        <i class="fas fa-info-circle storefront-marquee-icon" aria-hidden="true"></i>
        <span class="storefront-marquee-text">Không qua sàn</span>
        <span class="storefront-marquee-separator">•</span>
        <i class="fas fa-undo storefront-marquee-icon" aria-hidden="true"></i>
        <span class="storefront-marquee-text">Đổi trả 7 ngày</span>
      </div>
    </div>
  </div>
  <div class="qhher-header-main mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-4">
    <button type="button" onclick="openHotTrendNuCategoryPage(event)" class="qhher-icon-btn md:hidden" aria-label="Mở danh mục"><i class="fas fa-bars" aria-hidden="true"></i></button>
    <a href="/hottrendnu" class="flex items-center gap-3">
      <span class="qhher-logo">QH Clothes</span>
    </a>
    <div class="hidden items-center gap-7 md:flex">
      <a class="qhher-nav-link" href="#bestsellersSection">Hàng mới</a>
      <a class="qhher-nav-link" href="#products" onclick="filterProductType('tops', document.querySelector('[data-type=&quot;tops&quot;]'))">Áo</a>
      <a class="qhher-nav-link" href="#products" onclick="filterProductType('dress', document.querySelector('[data-type=&quot;dress&quot;]'))">Váy/Đầm</a>
      <a class="qhher-nav-link" href="#products" onclick="filterProductType('pants', document.querySelector('[data-type=&quot;pants&quot;]'))">Quần</a>
      <a class="qhher-nav-link" href="#products" onclick="filterProductType('outerwear', document.querySelector('[data-type=&quot;outerwear&quot;]'))">Áo khoác</a>
      <a class="qhher-nav-link qhher-nav-link--sale" href="#flashSaleShopSection">Sale</a>
    </div>
    <div class="qhher-header-search qhher-search-box hidden md:block">
      <input id="qhherHeaderSearchInput" class="qhher-storefront-search-input" type="search" placeholder="Tìm sản phẩm, danh mục..." autocomplete="off" onfocus="openStorefrontHeaderSearch(this)" oninput="handleStorefrontHeaderSearchInput(this.value, this)" onkeydown="handleStorefrontHeaderSearchKeydown(event)" aria-label="Tìm sản phẩm">
      <i class="fas fa-search" aria-hidden="true"></i>
      <div id="qhherHeaderSearchPanel" class="qhher-search-suggest-panel hidden"></div>
    </div>
    <div class="qhher-header-actions flex items-center">
      <button type="button" onclick="focusProductsSearch()" class="qhher-icon-btn hidden md:inline-flex" aria-label="Tìm sản phẩm"><i class="fas fa-search" aria-hidden="true"></i></button>
      <button type="button" onclick="openUserMenu(); setTimeout(showUserFavorites, 0)" class="qhher-icon-btn" aria-label="Yêu thích"><i class="far fa-heart" aria-hidden="true"></i><span class="hidden md:inline">Yêu thích</span></button>
      <button onclick="openCart()" id="cartNavBtn" class="qhher-icon-btn">
        <i class="fas fa-shopping-bag" aria-hidden="true"></i>
        <span class="hidden md:inline">Giỏ hàng</span>
        <span id="cartBadge" class="absolute -right-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-[#E84D6A] text-[10px] font-bold text-white">0</span>
        <span id="cartBadgeMobile" class="absolute -right-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-[#E84D6A] text-[10px] font-bold text-white">0</span>
      </button>
      <button onclick="openTopupModal()" id="walletNavBtn" class="qhher-icon-btn hidden">
        <i class="fas fa-wallet" aria-hidden="true"></i><span id="walletBalanceNav">0đ</span>
      </button>
      <button onclick="toggleUserMenu()" id="userAvatarBtn" class="qhher-icon-btn">
        <div id="userAvatarDefault" class="flex items-center justify-center"><i class="far fa-user" aria-hidden="true"></i></div>
        <img id="userAvatarImg" src="" alt="" class="hidden h-10 w-10 rounded-full object-cover">
        <span class="hidden md:inline">Tài khoản</span>
      </button>
      <a href="/admin" id="adminNavLink" class="qhher-icon-btn hidden" title="Admin"><i class="fas fa-user-shield"></i></a>
      <button type="button" onclick="toggleStorefrontTheme()" id="storefrontThemeToggle" class="theme-toggle-btn qhher-icon-btn hidden md:inline-flex" aria-label="Chuyển sáng tối">
        <span id="storefrontThemeIcon" class="qhher-glyph qhher-glyph-moon" aria-hidden="true"></span>
        <span id="storefrontThemeIconMobile" class="qhher-glyph qhher-glyph-moon hidden" aria-hidden="true"></span>
      </button>
    </div>
  </div>
  <div class="qhher-mobile-search qhher-search-box md:hidden">
    <input id="qhherMobileSearchInput" class="qhher-storefront-search-input" type="search" placeholder="Tìm sản phẩm, danh mục..." autocomplete="off" onfocus="openStorefrontHeaderSearch(this)" oninput="handleStorefrontHeaderSearchInput(this.value, this)" onkeydown="handleStorefrontHeaderSearchKeydown(event)" aria-label="Tìm sản phẩm">
    <i class="fas fa-search" aria-hidden="true"></i>
    <div id="qhherMobileSearchPanel" class="qhher-search-suggest-panel hidden"></div>
  </div>
</nav>`
}

function hotTrendNuHero(): string {
  return `<section class="hottrendnu-hero" id="hero">
  <div class="hottrendnu-hero-inner">
    <div class="qhher-hero-grid">
      <div class="qhher-hero-main">
        <div class="qhher-hero-visual qhher-hero-slider" id="qhherHeroSlider">
          <div class="qhher-hero-slider-stage" id="qhherHeroSliderTrack">
            <img class="qhher-fallback-slide is-active" src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=920&h=560&fit=crop&crop=faces" alt="Bộ sưu tập nữ mới">
            <img class="qhher-fallback-slide" src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=920&h=560&fit=crop&crop=faces" alt="Lookbook nữ trẻ">
            <img class="qhher-fallback-slide" src="https://images.unsplash.com/photo-1509631179647-0177331693ae?w=920&h=560&fit=crop&crop=faces" alt="Áo khoác nữ mới">
          </div>
        </div>
        <img class="qhher-hero-flower" src="/qh-her-flower-branch.png" alt="" aria-hidden="true" loading="lazy">
        <div class="qhher-hero-copy">
          <p class="qhher-hero-script">New Collection</p>
          <h1 class="qhher-hero-title" style="color:#C94F7C!important;">Bộ sưu tập nữ mới 2026</h1>
          <p class="qhher-hero-subtitle">Xinh mỗi ngày · Giá tốt khi mua trực tiếp</p>
          <div class="qhher-hero-actions">
            <a href="#products" class="qhher-primary-btn">Mua sắm ngay <span class="qhher-glyph qhher-glyph-arrow" aria-hidden="true"></span></a>
            <a href="#bestsellersSection" class="qhher-secondary-btn">Xem lookbook <span class="qhher-glyph qhher-glyph-arrow" aria-hidden="true"></span></a>
          </div>
        </div>
        <div class="qhher-hero-dots" aria-label="Chọn ảnh bộ sưu tập">
          <button type="button" class="qhher-hero-dot is-active" data-qhher-slide="0" aria-label="Ảnh bộ sưu tập 1"></button>
          <button type="button" class="qhher-hero-dot" data-qhher-slide="1" aria-label="Ảnh bộ sưu tập 2"></button>
          <button type="button" class="qhher-hero-dot" data-qhher-slide="2" aria-label="Ảnh bộ sưu tập 3"></button>
        </div>
      </div>
      <div class="qhher-hero-promos">
        <a href="#products" class="qhher-promo-card">
          <div class="qhher-promo-copy">
            <p class="qhher-hero-script text-xs">Set đồ đi chơi</p>
            <h2 class="qhher-promo-title text-base font-bold text-gray-900 mt-0.5">Xinh xắn</h2>
            <strong class="qhher-promo-sale text-rose-500 font-bold block mt-1">-20%</strong>
            <span class="qhher-promo-link text-xs font-semibold text-[#C94F7C] mt-2 block">Shop now <span class="qhher-glyph qhher-glyph-arrow" aria-hidden="true"></span></span>
          </div>
          <div class="qhher-promo-thumb">
            <img src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300" alt="Set đồ đi chơi" loading="lazy">
          </div>
        </a>
        <a href="#products" class="qhher-promo-card">
          <div class="qhher-promo-copy">
            <p class="qhher-hero-script text-xs">Áo khoác</p>
            <h2 class="qhher-promo-title text-base font-bold text-gray-900 mt-0.5">Mới về</h2>
            <strong class="qhher-promo-sale text-rose-500 font-bold block mt-1">-15%</strong>
            <span class="qhher-promo-link text-xs font-semibold text-[#C94F7C] mt-2 block">Xem ngay <span class="qhher-glyph qhher-glyph-arrow" aria-hidden="true"></span></span>
          </div>
          <div class="qhher-promo-thumb">
            <img src="https://images.unsplash.com/photo-1509631179647-0177331693ae?w=300" alt="Áo khoác mới về" loading="lazy">
          </div>
        </a>
      </div>
    </div>
  </div>
  <div class="qhher-category-shell" aria-label="Danh mục nhanh">
    <div id="qhherCategoryRailDynamic" class="qhher-category-rail">
      <button type="button" class="qhher-category-pill" onclick="openHotTrendNuCategoryPage(event)">
        <span class="qhher-category-avatar-wrap qhher-category-avatar-wrap--new"><i class="fas fa-star"></i></span>
        <span>Hàng mới</span>
      </button>
    </div>
    <a class="qhher-sale-tile" href="#flashSaleShopSection">
      <span class="qhher-sale-icon" aria-hidden="true"></span>
      <span>Sale</span>
    </a>
  </div>
</section>`
}

function hotTrendNuCategoryPage(): string {
  return `<section id="qhherCategoryPage" class="qhher-mobile-category-page hidden md:hidden" aria-label="Danh mục QH Clothes">
  <div class="qhher-category-page-head">
    <button type="button" class="qhher-category-back-btn" onclick="closeHotTrendNuCategoryPage(); document.getElementById('hero')?.scrollIntoView({behavior:'smooth'})" aria-label="Quay lại">
      <i class="fas fa-arrow-left" aria-hidden="true"></i>
    </button>
    <h2>Danh mục</h2>
    <button type="button" onclick="openCart()" class="qhher-category-cart-btn" aria-label="Giỏ hàng">
      <i class="fas fa-shopping-bag" aria-hidden="true"></i>
      <span id="cartBadgeCategory" class="hidden">0</span>
    </button>
  </div>
  <div class="qhher-category-page-search">
    <i class="fas fa-search" aria-hidden="true"></i>
    <input type="search" placeholder="Tìm áo, váy, quần..." autocomplete="off" oninput="handleStorefrontHeaderSearchInput(this.value, this)" onkeydown="handleStorefrontHeaderSearchKeydown(event)" aria-label="Tìm trong danh mục">
  </div>
  <div class="qhher-category-page-body">
    <p class="qhher-category-page-kicker">Khám phá danh mục</p>
    <div id="qhherMobileCategoryGrid" class="qhher-mobile-category-grid"></div>
    <div class="qhher-collection-head">
      <h3>Bộ sưu tập nổi bật</h3>
      <a href="#products" onclick="closeHotTrendNuCategoryPage()">Xem tất cả -></a>
    </div>
    <div id="qhherFeaturedCollections" class="qhher-featured-collections"></div>
  </div>
</section>`
}

function hotTrendNuBestsellers(): string {
  return `<section id="bestsellersSection" class="hottrendnu-section hidden">
  <div class="qhher-mini-section-head">
    <h2 class="qhher-mini-title">Hàng mới về</h2>
    <a href="#products" class="qhher-view-all">Xem tất cả -></a>
  </div>
  <div id="bestsellersTrack" class="bestsellers-track"></div>
</section>`
}

function hotTrendNuTrendingProducts(): string {
  return `<section id="trendingProductsSection" class="hottrendnu-section hidden">
  <div class="qhher-mini-section-head">
    <h2 class="qhher-mini-title">Sản phẩm thịnh hành</h2>
    <a href="#products" class="qhher-view-all">Xem tất cả -></a>
  </div>
  <div id="trendingProductsTrack" class="trending-products-track flex snap-x overflow-x-auto"></div>
</section>`
}

function hotTrendNuFlashSale(): string {
  return `<section id="flashSaleShopSection" class="hottrendnu-section hidden">
  <div class="qhher-deal-header">
    <div class="flex items-center gap-4">
      <h2 class="qhher-deal-title"><span class="qhher-section-icon" aria-hidden="true"></span>FLASH SALE</h2>
      <div class="qhher-deal-timer" aria-label="Đếm ngược flash sale">
        <span>Kết thúc sau</span>
        <span class="qhher-timer-digit">02</span>
        <span>:</span>
        <span class="qhher-timer-digit">14</span>
        <span>:</span>
        <span class="qhher-timer-digit">37</span>
        <span>:</span>
        <span class="qhher-timer-digit">58</span>
      </div>
    </div>
    <a href="#products" class="qhher-view-all">Xem tất cả -></a>
  </div>
  <div id="flashSaleShopGrid" class="flash-sale-shop-track flex snap-x overflow-x-auto"></div>
</section>`
}

function uiSelectTemplate(params: {
  id: string
  label: string
  optionsHtml: string
  onChange: string
  wrapperClass?: string
  prefixHtml?: string
}): string {
  const wrapperClass = params.wrapperClass || 'hottrendnu-select-wrap'
  const prefixHtml = params.prefixHtml || ''
  return `<div class="${wrapperClass} ui-select" data-ui-select data-select-id="${params.id}">
          <select id="${params.id}" class="ui-select-native" onchange="${params.onChange}" aria-label="${params.label}">
            ${params.optionsHtml}
          </select>
          <button type="button" class="ui-select-trigger" aria-haspopup="listbox" aria-expanded="false">
            ${prefixHtml}
            <span class="ui-select-value">${params.label}</span>
            <span class="ui-select-chevron" aria-hidden="true"></span>
          </button>
          <div class="ui-select-menu" role="listbox" aria-label="${params.label}"></div>
        </div>`
}

function hotTrendNuProducts(): string {
  const sortOptions = `<option value="newest">Mới nhất</option>
            <option value="best_selling">Bán chạy</option>
            <option value="price_asc">Giá thấp</option>
            <option value="price_desc">Giá cao</option>
            <option value="oldest">Cũ nhất</option>`
  return `<section class="hottrendnu-section" id="products">
  <div class="hottrendnu-products-panel" id="filterBar">
    <div class="hottrendnu-mobile-filter-row">
      <div class="hottrendnu-search">
        <i class="fas fa-search" aria-hidden="true"></i>
        <input type="text" id="searchInput" placeholder="Tìm sản phẩm nữ..." oninput="searchProducts(this.value)">
      </div>
      <button type="button" class="hottrendnu-filter-btn" onclick="openFilterModal()" aria-label="Mở bộ lọc"><i class="fas fa-sliders" aria-hidden="true"></i></button>
    </div>
    <div class="hottrendnu-filter-strip">
      <div class="hottrendnu-type-row" id="filterChipRow">
        <button class="hottrendnu-type-chip active" data-type="all" onclick="filterProductType('all', this)">Tất cả</button>
        <button class="hottrendnu-type-chip" data-type="tops" onclick="filterProductType('tops', this)">Áo</button>
        <button class="hottrendnu-type-chip" data-type="dress" onclick="filterProductType('dress', this)">Váy/Đầm</button>
        <button class="hottrendnu-type-chip" data-type="pants" onclick="filterProductType('pants', this)">Quần</button>
        <button class="hottrendnu-type-chip" data-type="set" onclick="filterProductType('set', this)">Set đồ</button>
        <button class="hottrendnu-type-chip" data-type="outerwear" onclick="filterProductType('outerwear', this)">Áo khoác</button>
      </div>
      <div class="hottrendnu-filter-control-row">
        ${uiSelectTemplate({
          id: 'productsColorFilter',
          label: 'Màu sắc',
          optionsHtml: '<option value="all">Màu sắc</option>',
          onChange: "setHotTrendNuProductFilter('color', this.value)"
        })}
        ${uiSelectTemplate({
          id: 'productsPriceFilter',
          label: 'Giá',
          optionsHtml: `<option value="all">Giá</option>
            <option value="under_200">Dưới 200K</option>
            <option value="200_400">200K - 400K</option>
            <option value="over_400">Trên 400K</option>`,
          onChange: "setHotTrendNuProductFilter('price', this.value)"
        })}
        ${uiSelectTemplate({
          id: 'productsSizeFilter',
          label: 'Size',
          optionsHtml: '<option value="all">Size</option>',
          onChange: "setHotTrendNuProductFilter('size', this.value)"
        })}
        ${uiSelectTemplate({
          id: 'productsSortSelect',
          label: 'Sắp xếp: Mới nhất',
          optionsHtml: sortOptions,
          onChange: 'sortProductsByTime(this.value)',
          wrapperClass: 'hottrendnu-sort-wrap hottrendnu-sort-desktop'
        })}
      </div>
    </div>
    <div class="hottrendnu-meta-row">
      <div><i class="fas fa-shirt mr-2" aria-hidden="true"></i><span id="productsCountLabel">0 mặt hàng</span></div>
      <div class="hottrendnu-mobile-product-tools">
        ${uiSelectTemplate({
          id: 'productsSortSelectMobile',
          label: 'Mới nhất',
          optionsHtml: sortOptions,
          onChange: 'sortProductsByTime(this.value)',
          wrapperClass: 'hottrendnu-sort-wrap',
          prefixHtml: '<i class="fas fa-arrow-down-wide-short" aria-hidden="true"></i>'
        })}
        <button type="button" id="productsLayoutToggle" class="hottrendnu-filter-btn hottrendnu-mobile-view-toggle" aria-label="Chuyển dạng hiển thị" onclick="toggleProductsMobileLayout()"><i class="fas fa-table-cells-large" aria-hidden="true"></i></button>
      </div>
    </div>
    <div id="productsGrid" class="grid gap-4 md:gap-5">
      <div class="product-card h-72 animate-pulse"></div>
      <div class="product-card h-72 animate-pulse"></div>
      <div class="product-card h-72 animate-pulse"></div>
      <div class="product-card h-72 animate-pulse"></div>
    </div>
    <div id="productsMoreWrap" class="hidden text-center mt-8">
      <button type="button" onclick="openProductsModal()" class="btn-primary px-7 py-3 font-bold">Xem thêm <span id="productsMoreCount"></span></button>
    </div>
    <div id="emptyState" class="hidden py-16 text-center text-[#806a76]">
      <i class="fas fa-box-open mb-4 text-5xl"></i>
      <p class="text-lg font-bold">Chưa có sản phẩm nữ phù hợp</p>
    </div>
  </div>
</section>
<div id="productsModalOverlay" class="hidden fixed inset-0 z-[10020] bg-black/60 backdrop-blur-sm p-3 md:p-6">
  <div class="bg-white w-full max-w-7xl mx-auto h-full rounded-3xl shadow-2xl overflow-hidden flex flex-col">
    <div class="flex items-center justify-between gap-4 px-4 md:px-6 py-4 border-b border-gray-100">
      <div>
        <p class="text-[#d63f72] font-bold tracking-widest uppercase text-xs">Danh sách đầy đủ</p>
        <h3 class="font-display text-xl md:text-2xl font-bold text-gray-900">Tất cả hàng nữ</h3>
        <p id="productsModalMeta" class="text-sm text-gray-500 mt-1"></p>
      </div>
      <button type="button" onclick="closeProductsModal()" class="w-10 h-10 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition"><i class="fas fa-times"></i></button>
    </div>
    <div class="flex-1 overflow-y-auto p-4 md:p-6">
      <div id="productsModalGrid" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"></div>
      <div class="text-center pt-6">
        <button type="button" id="productsModalLoadMore" onclick="loadMoreProductsModal()" class="hidden border border-rose-200 text-[#d63f72] hover:bg-rose-50 px-6 py-3 rounded-full font-semibold transition"><i class="fas fa-plus mr-2"></i>Tải thêm sản phẩm</button>
      </div>
    </div>
  </div>
</div>`
}

function hotTrendNuFeatures(): string {
  return `<section class="qhher-service-strip animate-fade-in" id="qhher-services">
  <div class="qhher-service-inner">
    <div class="qhher-service-item">
      <i class="fas fa-truck" aria-hidden="true"></i>
      <div>
        <h3>Giao hàng toàn quốc</h3>
        <p>Freeship đơn từ 499k</p>
      </div>
    </div>
    <div class="qhher-service-item">
      <i class="fas fa-shield-alt" aria-hidden="true"></i>
      <div>
        <h3>Chất lượng đảm bảo</h3>
        <p>Sản phẩm chính hãng</p>
      </div>
    </div>
    <div class="qhher-service-item">
      <i class="fas fa-rotate-left" aria-hidden="true"></i>
      <div>
        <h3>Đổi trả dễ dàng</h3>
        <p>Đổi trả trong 7 ngày</p>
      </div>
    </div>
    <div class="qhher-service-item">
      <i class="fas fa-headset" aria-hidden="true"></i>
      <div>
        <h3>Hỗ trợ nhanh</h3>
        <p>Tư vấn 8:00 - 22:00</p>
      </div>
    </div>
  </div>
</section>`
}

function hotTrendNuFooter(): string {
  return `<footer class="qhher-footer" id="contact">
  <div class="qhher-footer-grid">
    <div class="qhher-footer-brand">
      <p class="qhher-logo">QH Clothes</p>
      <p>Thời trang nữ trẻ trung, hiện đại<br>Xinh mỗi ngày - Giá tốt khi mua trực tiếp.</p>
      <div class="qhher-footer-socials">
        <a href="#" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a>
        <a href="#" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
        <a href="#" aria-label="TikTok"><i class="fab fa-tiktok"></i></a>
        <a href="#" aria-label="YouTube"><i class="fab fa-youtube"></i></a>
      </div>
    </div>
    
    <div class="qhher-footer-col">
      <p>VỀ CHÚNG TÔI</p>
      <ul>
        <li><a href="#">Giới thiệu</a></li>
        <li><a href="#">Tuyển dụng</a></li>
        <li><a href="#">Tin tức</a></li>
        <li><a href="#">Liên hệ</a></li>
      </ul>
    </div>

    <div class="qhher-footer-col">
      <p>CHÍNH SÁCH</p>
      <ul>
        <li><a href="/hottrendnu/chinh-sach-thanh-toan">Chính sách thanh toán</a></li>
        <li><a href="/hottrendnu/chinh-sach-van-chuyen">Chính sách vận chuyển</a></li>
        <li><a href="/hottrendnu/chinh-sach-doi-tra">Chính sách đổi trả</a></li>
        <li><a href="/hottrendnu/chinh-sach-bao-mat">Chính sách bảo mật</a></li>
      </ul>
    </div>

    <div class="qhher-footer-col">
      <p>HỖ TRỢ KHÁCH HÀNG</p>
      <ul>
        <li><a href="#">Hướng dẫn mua hàng</a></li>
        <li><a href="#">Câu hỏi thường gặp</a></li>
        <li><a href="/hottrendnu/chinh-sach-doi-tra">Hướng dẫn đổi trả</a></li>
        <li><a href="#">Liên hệ hỗ trợ</a></li>
      </ul>
    </div>

    <div class="qhher-footer-col qhher-footer-contact">
      <p>LIÊN HỆ</p>
      <ul>
        <li><i class="fas fa-phone-alt"></i><span>1900 636 999</span></li>
        <li><i class="fas fa-envelope"></i><a href="mailto:hello@qhher.vn">hello@qhher.vn</a></li>
        <li><i class="fas fa-map-marker-alt"></i><span>24/7B Lý Thường Kiệt, P.14, Q.10, TP.HCM</span></li>
      </ul>
    </div>
  </div>
  <div class="qhher-footer-copy">
    <p>© 2026 QH Clothes. All rights reserved.</p>
  </div>
</footer>`
}

function hotTrendNuMobileBottomNavSection(): string {
  return `<!-- MOBILE BOTTOM NAV -->
<nav id="mobileBottomNav" class="mobile-bottom-nav md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#FFF7F8] border-t border-[#F3DDE4] safe-area-bottom pb-2">
  <div class="flex items-center justify-around h-[64px]">
    <a href="#hero" onclick="closeHotTrendNuCategoryPage()" class="mobile-bottom-nav-link is-active flex flex-col items-center justify-center gap-1 w-16 transition">
      <i class="fas fa-home text-xl"></i>
      <span class="text-[10px] font-medium" style="font-family: 'Be Vietnam Pro', sans-serif;">Trang chủ</span>
    </a>
    <button type="button" data-qhher-category-nav="true" onclick="openHotTrendNuCategoryPage(event)" class="mobile-bottom-nav-link flex flex-col items-center justify-center gap-1 w-16 transition">
      <i class="fas fa-th-large text-xl"></i>
      <span class="text-[10px] font-medium" style="font-family: 'Be Vietnam Pro', sans-serif;">Danh mục</span>
    </button>
    <button onclick="openUserMenu(); setTimeout(showUserFavorites, 0)" class="mobile-bottom-nav-link flex flex-col items-center justify-center gap-1 w-16 transition">
      <i class="far fa-heart text-xl"></i>
      <span class="text-[10px] font-medium" style="font-family: 'Be Vietnam Pro', sans-serif;">Yêu thích</span>
    </button>
    <button onclick="openCart()" id="cartBottomNavBtn" class="mobile-bottom-nav-link relative flex flex-col items-center justify-center gap-1 w-16 transition">
      <div class="relative">
        <i class="fas fa-shopping-bag text-xl"></i>
        <span id="cartBadgeBottom" class="absolute -top-1.5 -right-2 bg-[#E84D6A] text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center hidden font-bold">0</span>
      </div>
      <span class="text-[10px] font-medium" style="font-family: 'Be Vietnam Pro', sans-serif;">Giỏ hàng</span>
    </button>
    <button onclick="toggleUserMenu()" class="mobile-bottom-nav-link flex flex-col items-center justify-center gap-1 w-16 transition">
      <i class="far fa-user text-xl"></i>
      <span class="text-[10px] font-medium" style="font-family: 'Be Vietnam Pro', sans-serif;">Tài khoản</span>
    </button>
  </div>
</nav>`;
}

export function hotTrendNuHTML(options: HotTrendNuPageOptions = {}): string {
  const canonicalUrl = String(options.canonicalUrl || 'https://qhclothes.pages.dev/hottrendnu').trim()
  const ogImageUrl = String(options.ogImageUrl || 'https://qhclothes.pages.dev/og/qh-clothes-share-16x9.png').trim()
  const seoTitle = 'QH Clothes - Thời trang nữ trẻ, váy, set và outfit hot trend'
  const seoDescription = 'QH Clothes là mặt tiền thời trang nữ trẻ dùng chung giỏ hàng, đặt nhanh và dashboard với QH Boypho.'
  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${seoTitle}</title>
<meta name="description" content="${seoDescription}">
<meta name="keywords" content="hot trend nữ, thời trang nữ, váy nữ, set nữ, outfit nữ, Boypho">
<meta name="author" content="QH Boypho">
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">
<link rel="canonical" href="${canonicalUrl}">
<meta property="og:site_name" content="QH Clothes">
<meta property="og:locale" content="vi_VN">
<meta property="og:title" content="${seoTitle}">
<meta property="og:description" content="${seoDescription}">
<meta property="og:url" content="${canonicalUrl}">
<meta property="og:image" content="${ogImageUrl}">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#fff7f8">
<link rel="icon" type="image/png" href="/qh-logo.png">
<link rel="apple-touch-icon" href="/qh-logo.png">
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
<script>${autoTypingScript}</script>
<style>
${storefrontStyles()}
</style>
<style>
${storefrontThemeRefreshStyles()}
</style>
<style>
${hotTrendNuStyles()}
</style>
</head>
<body class="hottrendnu-page overflow-x-hidden pb-[70px] md:pb-0" data-storefront-theme="light">
${hotTrendNuNavbar()}
${hotTrendNuHero()}
${hotTrendNuCategoryPage()}
<div id="flashSaleDealsRow" class="hidden max-w-[1280px] mx-auto my-8">
  ${hotTrendNuFlashSale()}
</div>
<div id="dealsGridRow" class="hottrendnu-deals-row hidden max-w-[1280px] mx-auto px-4 gap-6 my-8">
  ${hotTrendNuTrendingProducts()}
  ${hotTrendNuBestsellers()}
</div>
${hotTrendNuProducts()}
${hotTrendNuFeatures()}
${hotTrendNuFooter()}
<div id="purchaseToastContainer" style="position:fixed;bottom:80px;left:24px;z-index:60;display:flex;flex-direction:column;gap:8px;pointer-events:none;max-width:320px;"></div>
${storefrontModalsSection(options.textUiSettings)}
${hotTrendNuMobileBottomNavSection()}
<script>
window.STOREFRONT_RUNTIME_CONFIG = ${serializeHotTrendNuRuntimeConfig(options)};
window.STOREFRONT_SEGMENT_CONTEXT = {"key":"hottrendnu","label":"Hot Trend Nữ"};
${storefrontInlineScript()}
;(function initQhHerHeroSlider() {
  var slides = Array.prototype.slice.call(document.querySelectorAll('.qhher-fallback-slide'));
  var dots = Array.prototype.slice.call(document.querySelectorAll('.qhher-hero-dot'));
  if (!slides.length || !dots.length) return;

  var index = 0;
  var timer = null;

  function setSlide(nextIndex) {
    index = ((Number(nextIndex) || 0) + slides.length) % slides.length;
    slides.forEach(function(slide, slideIndex) {
      var active = slideIndex === index;
      slide.classList.toggle('is-active', active);
      slide.style.setProperty('opacity', active ? '1' : '0', 'important');
      slide.style.setProperty('transform', active ? 'scale(1.02)' : 'scale(1.055)', 'important');
    });
    dots.forEach(function(dot, dotIndex) {
      var active = dotIndex === index;
      dot.classList.toggle('is-active', active);
      dot.setAttribute('aria-pressed', active ? 'true' : 'false');
      dot.style.setProperty('width', active ? '18px' : '7px', 'important');
      dot.style.setProperty('background', active ? '#C94F7C' : 'rgba(201, 79, 124, 0.22)', 'important');
    });
  }

  function start() {
    if (timer) window.clearInterval(timer);
    timer = window.setInterval(function() {
      if (document.hidden) return;
      setSlide(index + 1);
    }, 4200);
  }

  dots.forEach(function(dot) {
    dot.addEventListener('click', function() {
      setSlide(dot.getAttribute('data-qhher-slide'));
      start();
    });
  });

  setSlide(0);
  start();
})();
;(function initUiSelectTemplate() {
  var roots = [];

  function getOptionLabel(option) {
    return option ? String(option.textContent || option.label || option.value || '').trim() : '';
  }

  function closeAll(exceptRoot) {
    roots.forEach(function(root) {
      if (root !== exceptRoot) {
        root.classList.remove('is-open');
        var trigger = root.querySelector('.ui-select-trigger');
        if (trigger) trigger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  function refreshOne(root) {
    if (!root) return;
    var select = root.querySelector('select');
    var valueNode = root.querySelector('.ui-select-value');
    var menu = root.querySelector('.ui-select-menu');
    if (!select || !valueNode || !menu) return;

    var options = Array.prototype.slice.call(select.options || []);
    var selected = options.find(function(option) { return option.value === select.value; }) || options[0];
    valueNode.textContent = getOptionLabel(selected) || root.getAttribute('data-select-id') || 'Chọn';
    menu.innerHTML = options.map(function(option) {
      var selectedClass = option.value === select.value ? ' is-selected' : '';
      var value = String(option.value || '').replace(/"/g, '&quot;');
      var label = getOptionLabel(option)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
      return '<button type="button" class="ui-select-option' + selectedClass + '" role="option" aria-selected="' + (option.value === select.value ? 'true' : 'false') + '" data-value="' + value + '">' + label + '</button>';
    }).join('');
  }

  function refreshAll() {
    roots.forEach(refreshOne);
  }

  function selectValue(root, value) {
    var select = root && root.querySelector('select');
    if (!select) return;
    select.value = value;
    refreshOne(root);
    select.dispatchEvent(new Event('change', { bubbles: true }));
    closeAll();
    window.requestAnimationFrame(refreshAll);
    window.setTimeout(refreshAll, 80);
  }

  function initOne(root) {
    if (!root || root.dataset.uiSelectReady === 'true') return;
    var select = root.querySelector('select');
    var trigger = root.querySelector('.ui-select-trigger');
    var menu = root.querySelector('.ui-select-menu');
    if (!select || !trigger || !menu) return;

    root.dataset.uiSelectReady = 'true';
    roots.push(root);

    trigger.addEventListener('click', function(event) {
      event.preventDefault();
      event.stopPropagation();
      var willOpen = !root.classList.contains('is-open');
      closeAll(root);
      root.classList.toggle('is-open', willOpen);
      trigger.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      if (willOpen) refreshOne(root);
    });

    menu.addEventListener('click', function(event) {
      var optionButton = event.target && event.target.closest ? event.target.closest('.ui-select-option') : null;
      if (!optionButton) return;
      event.preventDefault();
      selectValue(root, optionButton.getAttribute('data-value') || 'all');
    });

    trigger.addEventListener('keydown', function(event) {
      if (event.key === 'Escape') {
        closeAll();
        trigger.focus();
      }
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
        event.preventDefault();
        closeAll(root);
        root.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
        refreshOne(root);
        var firstSelected = menu.querySelector('.ui-select-option.is-selected') || menu.querySelector('.ui-select-option');
        if (firstSelected) firstSelected.focus();
      }
    });

    menu.addEventListener('keydown', function(event) {
      var items = Array.prototype.slice.call(menu.querySelectorAll('.ui-select-option'));
      var currentIndex = items.indexOf(document.activeElement);
      if (event.key === 'Escape') {
        closeAll();
        trigger.focus();
      }
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        var nextIndex = event.key === 'ArrowDown' ? currentIndex + 1 : currentIndex - 1;
        if (nextIndex < 0) nextIndex = items.length - 1;
        if (nextIndex >= items.length) nextIndex = 0;
        if (items[nextIndex]) items[nextIndex].focus();
      }
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        if (document.activeElement && document.activeElement.classList.contains('ui-select-option')) {
          selectValue(root, document.activeElement.getAttribute('data-value') || 'all');
        }
      }
    });

    select.addEventListener('change', function() {
      window.requestAnimationFrame(function() { refreshOne(root); });
    });

    if (window.MutationObserver) {
      new MutationObserver(function() { refreshOne(root); }).observe(select, { childList: true, subtree: true });
    }

    refreshOne(root);
  }

  document.querySelectorAll('.ui-select[data-ui-select]').forEach(initOne);
  document.addEventListener('click', function() { closeAll(); });
  window.refreshUiSelects = refreshAll;
  window.requestAnimationFrame(refreshAll);
  window.setTimeout(refreshAll, 600);
})();
${storefrontPurchaseToastScript()}
</script>
${storefrontBodyClose()}
</html>`
}
