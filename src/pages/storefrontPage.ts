import { storefrontStyles } from './storefront/styles'
import { storefrontThemeRefreshStyles } from './storefront/theme-refresh'
import {
  storefrontBodyOpen,
  storefrontNavbarSection,
  storefrontHeroSection,
  storefrontBestsellersSection,
  storefrontFlashSaleShopSection,
  storefrontProductsSection,
  storefrontFeaturesSection,
  storefrontFooterWithPolicySection,
  storefrontBodyClose,
} from './storefront/sections'
import { storefrontModalsSection } from './storefront/modals'
import { storefrontInlineScript } from './storefront/script'
import { storefrontPurchaseToastScript } from './storefront/script-purchase-toast'
import autoTypingScript from 'autotyping/dist/AutoTyping.min.js?raw'
import type { TextUiSettings } from '../lib/textUiSettings'

type StorefrontPageOptions = {
  textUiSettings?: Partial<TextUiSettings>
  canonicalUrl?: string
  ogImageUrl?: string
}

export function storefrontHTML(options: StorefrontPageOptions = {}): string {
  const canonicalUrl = String(options.canonicalUrl || 'https://qhclothes.pages.dev/').trim()
  const ogImageUrl = String(options.ogImageUrl || 'https://qhclothes.pages.dev/og/qh-clothes-share-16x9.png').trim()
  const seoTitle = 'QH Clothes - Mua trực tiếp giá tốt hơn | Thời trang nam nữ hot trend'
  const seoDescription = 'QH Clothes cung cấp thời trang nam nữ hot trend, mua trực tiếp giá tốt hơn, không qua sàn, cập nhật mẫu mới mỗi ngày cho giới trẻ yêu phong cách.'
  const seoKeywords = 'QH Clothes, thời trang nam nữ, local brand, áo thun unisex, quần áo hot trend, mua trực tiếp giá tốt hơn, thời trang giới trẻ, shop quần áo online'
  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${seoTitle}</title>
<meta name="description" content="${seoDescription}">
<meta name="keywords" content="${seoKeywords}">
<meta name="author" content="QH Clothes">
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">
<meta name="googlebot" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">
<link rel="canonical" href="${canonicalUrl}">
<meta property="og:site_name" content="QH Clothes">
<meta property="og:locale" content="vi_VN">
<meta property="og:title" content="${seoTitle}">
<meta property="og:description" content="${seoDescription}">
<meta property="og:url" content="${canonicalUrl}">
<meta property="og:image" content="${ogImageUrl}">
<meta property="og:image:secure_url" content="${ogImageUrl}">
<meta property="og:image:width" content="1731">
<meta property="og:image:height" content="909">
<meta property="og:image:alt" content="QH Clothes - Mua trực tiếp giá tốt hơn">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${seoTitle}">
<meta name="twitter:description" content="${seoDescription}">
<meta name="twitter:image" content="${ogImageUrl}">
<meta name="twitter:image:alt" content="QH Clothes - Mua trực tiếp giá tốt hơn">
<meta name="theme-color" content="#0b0a14">
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
</head>
${storefrontBodyOpen()}

${storefrontNavbarSection()}

${storefrontHeroSection(options.textUiSettings)}

${storefrontBestsellersSection()}

${storefrontFlashSaleShopSection()}

${storefrontProductsSection()}

${storefrontFeaturesSection()}

${storefrontFooterWithPolicySection()}

<div id="purchaseToastContainer" style="position:fixed;bottom:24px;left:24px;z-index:60;display:flex;flex-direction:column;gap:8px;pointer-events:none;max-width:320px;"></div>

${storefrontModalsSection(options.textUiSettings)}

<script>
${storefrontInlineScript()}
${storefrontPurchaseToastScript()}
</script>
${storefrontBodyClose()}
</html>`
}
