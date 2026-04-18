import { storefrontStyles } from './storefront/styles'
import {
  storefrontBodyOpen,
  storefrontNavbarSection,
  storefrontHeroSection,
  storefrontFilterBarSection,
  storefrontFlashSaleShopSection,
  storefrontProductsSection,
  storefrontFeaturesSection,
  storefrontFooterSection,
  storefrontBodyClose,
} from './storefront/sections'
import { storefrontModalsSection } from './storefront/modals'
import { storefrontInlineScript } from './storefront/script'
import { storefrontPurchaseToastScript } from './storefront/script-purchase-toast'

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
${storefrontStyles()}
</style>
</head>
${storefrontBodyOpen()}

${storefrontNavbarSection()}

${storefrontHeroSection()}

${storefrontFilterBarSection()}

${storefrontFlashSaleShopSection()}

${storefrontProductsSection()}

${storefrontFeaturesSection()}

${storefrontFooterSection()}

<div id="purchaseToastContainer" style="position:fixed;bottom:24px;left:24px;z-index:60;display:flex;flex-direction:column;gap:8px;pointer-events:none;max-width:320px;"></div>

${storefrontModalsSection()}

<script>
${storefrontInlineScript()}
${storefrontPurchaseToastScript()}
</script>
${storefrontBodyClose()}
</html>`
}
