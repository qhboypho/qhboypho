import { adminStyles } from './admin/styles'
import {
  adminBodyOpen,
  adminMobileMenuToggle,
  adminSidebarOverlay,
  adminSidebarSection,
  adminMainContentStart,
  adminDashboardPage,
  adminProductsPage,
  adminOrdersPage,
  adminReturnsPage,
  adminCustomersPage,
  adminReviewsPage,
  adminVouchersPage,
  adminFeaturedPage,
  adminFlashSalePage,
  adminSettingsPage,
  adminImageSettingsPage,
  adminBannersPage,
  adminBodyClose,
} from './admin/sections'
import { adminModalsSection } from './admin/modals'
import { adminInlineScript, adminBootstrapScript } from './admin/script'
import { adminOrdersScript } from './admin/script-orders'
import { adminFeaturedSettingsScript } from './admin/script-featured-settings'
import { adminFlashSaleScript } from './admin/script-flashsale'
import { adminReturnsScript } from './admin/script-returns'
import { adminCustomersScript } from './admin/script-customers'

export function adminHTML(): string {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QH Clothes Admin</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>
  <style>
${adminStyles()}
</style>
</head>
${adminBodyOpen()}

${adminMobileMenuToggle()}

${adminSidebarOverlay()}

${adminSidebarSection()}

${adminMainContentStart()}

${adminDashboardPage()}

${adminProductsPage()}

${adminOrdersPage()}

${adminReturnsPage()}

${adminCustomersPage()}

${adminReviewsPage()}

${adminVouchersPage()}

${adminFeaturedPage()}

${adminFlashSalePage()}

${adminSettingsPage()}

${adminImageSettingsPage()}

${adminBannersPage()}

${adminModalsSection()}

<script>
${adminInlineScript()}
</script>
<script>
${adminOrdersScript()}
</script>
<script>
${adminReturnsScript()}
</script>
<script>
${adminCustomersScript()}
</script>
<script>
${adminFlashSaleScript()}
</script>
<script>
${adminFeaturedSettingsScript()}
</script>
<script>
${adminBootstrapScript()}
</script>
${adminBodyClose()}
</html>`
}
